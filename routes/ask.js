import express from "express";
import rateLimit from "express-rate-limit";
import { askMentor } from "../controllers/askController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

const askLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
});

router.post("/", askLimiter, authenticate, askMentor);

export default router;
