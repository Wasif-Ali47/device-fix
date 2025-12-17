// Save & Get exam history
export const saveExam = async (req, res) => {
  try {
    const { topic, score, answers } = req.body;
    if (!topic || score == null || !answers) return res.status(400).json({ error: "Missing exam data" });

    req.user.examHistory.push({ topic, score, answers });
    await req.user.save();

    res.json({ message: "Exam saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getExamHistory = async (req, res) => {
  try {
    res.json({ examHistory: req.user.examHistory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};