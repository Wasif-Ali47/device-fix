import express from "express";
import { saveChat, getChatHistory , getAllChatTopics } from "../controllers/chatController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, saveChat);     
router.get("/", authenticate, getChatHistory); 
router.get("/topics", authenticate, getAllChatTopics);

export default router;