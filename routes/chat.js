import express from "express";
import { saveChat, getChatHistory } from "../controllers/chatController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, saveChat);      // Save question + reply
router.get("/", authenticate, getChatHistory); // Retrieve chat history

export default router;