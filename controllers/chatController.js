// // Save & Get chat history
// export const saveChat = async (req, res) => {
//   try {
//     const { question, reply } = req.body;
//     if (!question || !reply) return res.status(400).json({ error: "Missing question or reply" });

//     req.user.chatHistory.push({ question, reply });
//     await req.user.save();

//     res.json({ message: "Chat saved successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// export const getChatHistory = async (req, res) => {
//   try {
//     res.json({ chatHistory: req.user.chatHistory });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// };


// Save & Get chat history
// export const saveChat = async (req, res) => {
//   try {
//     const { topic, question, reply } = req.body;
//     if (!topic || !question || !reply) return res.status(400).json({ error: "Missing fields" });

//     let chatEntry = req.user.chatHistories.find(entry => entry.topic === topic);
//     if (!chatEntry) {
//       chatEntry = { topic, messages: [] };
//       req.user.chatHistories.push(chatEntry);
//     }

//     chatEntry.messages.push({ question, reply });
//     await req.user.save();

//     res.json({ message: "Chat saved successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

export const saveChat = async (req, res) => {
  try {
    const { topic, question, reply } = req.body;
    if (!topic || !question || !reply) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (!Array.isArray(req.user.chatHistories)) {
      req.user.chatHistories = [];
    }

    let chatEntry = req.user.chatHistories.find((entry) => entry.topic === topic);
    if (!chatEntry) {
      chatEntry = req.user.chatHistories.create({ topic });
      req.user.chatHistories.push(chatEntry);
    }

    chatEntry.messages.push({ question, reply });
    await req.user.save();
    res.json({ message: "Chat saved successfully" });
  } catch (err) {
    console.error("Error in /chat:", err);
    res.status(500).json({ error: "Server error" });
  }
};


export const getChatHistory = async (req, res) => {
  try {
    const { topic } = req.query;
    if (!topic) return res.status(400).json({ error: "Missing topic" });

    const histories = Array.isArray(req.user.chatHistories)
      ? req.user.chatHistories
      : [];
    const chatEntry = histories.find((entry) => entry.topic === topic);
    res.json({ chatHistory: chatEntry ? chatEntry.messages : [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get list of all chat topics
export const getAllChatTopics = async (req, res) => {
  try {
    const histories = Array.isArray(req.user.chatHistories)
      ? req.user.chatHistories
      : [];
    const topics = histories.map((entry) => entry.topic);

    res.json({ topics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
