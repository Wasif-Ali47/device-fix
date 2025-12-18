// // Save & Get exam history
// export const saveExam = async (req, res) => {
//   try {
//     const { topic, score, answers } = req.body;
//     if (!topic || score == null || !answers) return res.status(400).json({ error: "Missing exam data" });

//     req.user.examHistory.push({ topic, score, answers });
//     await req.user.save();

//     res.json({ message: "Exam saved successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// export const getExamHistory = async (req, res) => {
//   try {
//     res.json({ examHistory: req.user.examHistory });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// };


import User from "../models/User.js";

// ===============================
// SAVE / UPDATE EXAM PROGRESS
// ===============================
export const saveExamProgress = async (req, res) => {
  try {
    const userId = req.user.id; // JWT middleware se aayega
    const { topic, correct, total } = req.body;

    if (!topic || correct == null || total == null) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const percentage = Math.round((correct / total) * 100);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = user.examProgress.find(
      (p) => p.topic === topic
    );

    if (existing) {
      // 🔁 Retake → update
      existing.correct = correct;
      existing.total = total;
      existing.percentage = percentage;
      existing.attempts += 1;
      existing.lastUpdated = new Date();
    } else {
      // 🆕 First attempt
      user.examProgress.push({
        topic,
        correct,
        total,
        percentage,
      });
    }

    await user.save();

    res.status(200).json({
      message: "Exam progress saved",
      examProgress: user.examProgress,
    });
  } catch (err) {
    console.error("Save examProgress error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// GET EXAM PROGRESS
// ===============================
export const getExamProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("examProgress");
    if (!user) return res.status(404).json({ message: "User not found" });

    let overall = 0;
    user.examProgress.forEach((p) => {
      overall += p.percentage;
    });

    const overallPercentage =
      user.examProgress.length > 0
        ? Math.round(overall / user.examProgress.length)
        : 0;

    res.status(200).json({
      examProgress: user.examProgress,
      overallPercentage,
    });
  } catch (err) {
    console.error("Get examProgress error:", err);
    res.status(500).json({ message: "Server error" });
  }
};