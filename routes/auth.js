


import express from "express";
import { signup, verifyOTP, login, googleLogin } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);

// 🔹 Google Sign-In
router.post("/google-login", googleLogin);

export default router;
