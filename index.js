import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import examRoutes from "./routes/exam.js";
import quizRoutes from "./routes/quiz.routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


// NEW (Mongoose 7+)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));


// Routes
app.use("/auth", authRoutes);


app.use("/api/quiz", quizRoutes);

app.use("/chat", chatRoutes);
app.use("/exam", examRoutes);


// Start server
const PORT = process.env.PORT || 5044;
app.listen(PORT, () => console.log(`🚀 User Service running on port ${PORT}`));