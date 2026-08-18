import express from "express";
import { getSubscriptionStatus } from "../controllers/subscriptionController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/status", authenticate, getSubscriptionStatus);

export default router;
