import User from "../models/User.js";

export const submitQuizProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic, correctAnswers, totalQuestions } = req.body;

    if (!topic || correctAnswers == null || !totalQuestions) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const percentage = Math.round(
      (correctAnswers / totalQuestions) * 100
    );

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔍 Check if topic already exists
    const existingQuiz = user.quizProgress.find(
      (q) => q.topic === topic
    );

    if (existingQuiz) {
      // 🔁 Update existing topic
      existingQuiz.correctAnswers = correctAnswers;
      existingQuiz.totalQuestions = totalQuestions;
      existingQuiz.percentage = percentage;
      existingQuiz.attempts += 1;
      existingQuiz.lastAttemptAt = new Date();
      existingQuiz.isCompleted = true;
    } else {
      // ➕ Add new topic
      user.quizProgress.push({
        topic,
        correctAnswers,
        totalQuestions,
        percentage,
        attempts: 1,
        isCompleted: true,
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Quiz progress saved successfully",
      quizProgress: user.quizProgress,
    });

  } catch (error) {
    console.error("Quiz Submit Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getQuizProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("quizProgress");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      totalTopics: user.quizProgress.length,
      quizProgress: user.quizProgress,
    });

  } catch (error) {
    console.error("Get Quiz Progress Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
