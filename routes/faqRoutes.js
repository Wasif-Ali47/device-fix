import express from "express";
import { optionalAuth } from "../middlewares/authMiddleware.js";
import { faqChat } from "../controllers/faqController.js";

const router = express.Router();

router.post("/chat", optionalAuth, faqChat);

export default router;
