import express from "express";
import {
  authenticate,
  optionalAuth,
} from "../middlewares/authMiddleware.js";
import {
  getTokens,
  registerToken,
  removeToken,
  sendNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.post("/register-token", optionalAuth, registerToken);
router.post("/send", authenticate, sendNotification);
router.get("/tokens", authenticate, getTokens);
router.delete("/tokens/:token", authenticate, removeToken);

export default router;
