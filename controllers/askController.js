import OpenAI from "openai";

let openaiClient;

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  openaiClient ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiClient;
};

const mentorSystemPrompt = `
You are a Mobile Repair Mentor.

Your role:
- Act like an experienced mobile phone technician/repair expert.
- Help users diagnose and fix hardware and software issues on smartphones.
- Include problems related to screens, batteries, charging, buttons, speakers, microphones, cameras, overheating, slow performance, app crashes, etc.
- Explain fixes clearly and step-by-step in simple, human language.
- Give practical advice, repair tips, and troubleshooting techniques.
- Never advertise or promote products/services.
- Never mention OpenAI or that you are an AI.

Allowed:
- Diagnosing hardware problems (battery, screen, connectors, buttons, cameras, sensors)
- Software troubleshooting (OS updates, app crashes, slow performance)
- Safe repair techniques
- Step-by-step instructions for common mobile issues

Not Allowed:
- Illegal tampering with phones or software
- Hacking or bypassing security locks

If the user asks something dangerous or illegal:
"I can guide you safely on mobile repair, but I cannot assist with illegal activities or hacking."

Tone:
- Friendly, mentor-like, patient, practical
- Focused on guiding step-by-step repair and troubleshooting
`;

export const askMentor = async (req, res) => {
  try {
    const { topic, question } = req.body;

    if (!topic || !question) {
      return res.status(400).json({ error: "Invalid input." });
    }

    if (req.user.isActive === false) {
      return res.status(403).json({
        reply: "Your account is deactivated. Please contact support.",
      });
    }

    if (req.user.isBanned) {
      return res.status(403).json({
        reply: "Your account is banned. Please contact support.",
        bannedReason: req.user.bannedReason || "",
      });
    }

    const client = getOpenAIClient();
    if (!client) {
      return res.status(500).json({ reply: "AI service is not configured." });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: mentorSystemPrompt,
        },
        {
          role: "user",
          content: question,
        },
      ],
      max_completion_tokens: 150,
    });

    const reply =
      response.choices?.[0]?.message?.content?.trim() ||
      "I could not generate a response. Please try again.";

    const usage = response.usage || {};
    req.user.openAiUsage = {
      promptTokens:
        (Number(req.user.openAiUsage?.promptTokens) || 0) +
        (Number(usage.prompt_tokens) || 0),
      completionTokens:
        (Number(req.user.openAiUsage?.completionTokens) || 0) +
        (Number(usage.completion_tokens) || 0),
      totalTokens:
        (Number(req.user.openAiUsage?.totalTokens) || 0) +
        (Number(usage.total_tokens) || 0),
      requestCount: (Number(req.user.openAiUsage?.requestCount) || 0) + 1,
      lastUsedAt: new Date(),
    };

    if (!Array.isArray(req.user.chatHistories)) {
      req.user.chatHistories = [];
    }

    let chatEntry = req.user.chatHistories.find(
      (entry) => entry.topic === topic
    );

    if (!chatEntry) {
      chatEntry = req.user.chatHistories.create({ topic });
      req.user.chatHistories.push(chatEntry);
    }

    chatEntry.messages.push({ question, reply });
    await req.user.save();

    res.json({ reply });
  } catch (err) {
    console.error("Error in /ask:", err);
    res.json({ reply: "Something went wrong, try again." });
  }
};
