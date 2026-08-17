import OpenAI from "openai";
import { getMergedKnowledgeText } from "../services/knowledgeStoreService.js";

const MAX_HISTORY_MESSAGES = 10;
let openai = null;

function getOpenAI() {
  if (openai) return openai;
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  openai = new OpenAI({ apiKey });
  return openai;
}

function getModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'Provide a non-empty "messages" array.';
  }
  for (const message of messages) {
    if (!message?.role || !message?.content || typeof message.content !== "string") {
      return 'Each message must have "role" and "content" (string).';
    }
    if (!["user", "assistant"].includes(message.role)) {
      return 'Message role must be "user" or "assistant".';
    }
  }
  return null;
}

export async function faqChat(req, res) {
  try {
    if (req.authUser?.isBanned) {
      return res.status(403).json({
        success: false,
        error: "Account banned",
        message: "Your account is banned. Please contact support.",
        bannedReason: req.authUser.bannedReason || "",
      });
    }

    const messages = req.body?.messages;
    const validationError = validateMessages(messages);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const client = getOpenAI();
    if (!client) {
      return res.json({
        success: true,
        reply: "The FAQ assistant is currently unavailable. Please try again later or contact support.",
      });
    }

    const fallback =
      "I don't have information on that in my current knowledge base. Please contact Device Fix AI support.";
    const knowledgeText = await getMergedKnowledgeText();
    const systemPrompt = knowledgeText?.trim()
      ? `You are a support assistant for the Device Fix AI app. Your ONLY source of truth is the knowledge base delimited below.

STRICT RULES:
1. Answer ONLY from the knowledge base. Do not use external knowledge, training data, or assumptions.
2. If the user's question is not clearly answered by the knowledge base, respond with exactly:
   "${fallback}"
3. Do not say "based on general knowledge", "typically", "usually", or any phrase that implies outside knowledge.
4. Keep answers concise and factual. Quote or closely paraphrase the knowledge base when possible.

--- KNOWLEDGE BASE START ---
${knowledgeText}
--- KNOWLEDGE BASE END ---`
      : `You are a support assistant for the Device Fix AI app. The knowledge base has not been configured yet.

For every question, respond with:
"${fallback}"

Do not answer from general knowledge.`;

    const recentMessages = messages.slice(-MAX_HISTORY_MESSAGES);
    const completion = await client.chat.completions.create({
      model: getModel(),
      messages: [
        { role: "system", content: systemPrompt },
        ...recentMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      max_tokens: 500,
      temperature: 0,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "";
    if (!reply) {
      return res.status(502).json({
        success: false,
        message: "Received an empty response from the AI. Please try again.",
      });
    }

    return res.json({ success: true, reply });
  } catch (error) {
    console.error("[faqChat] error:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Failed to process your question. Please try again.",
    });
  }
}
