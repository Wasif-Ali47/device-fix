import express from "express";
import { saveExam, getExamHistory } from "../controllers/examController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, saveExam);        // Save exam
router.get("/", authenticate, getExamHistory);   // Retrieve exam history

export default router;