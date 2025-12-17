import express from "express";
import {
  submitQuizProgress,
  getQuizProgress,
} from "../controllers/quiz.controller.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Submit / Update quiz
router.post("/submit", authenticate, submitQuizProgress);

// ✅ Get quiz progress
router.get("/progress", authenticate, getQuizProgress);

export default router;
