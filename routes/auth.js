// import express from "express";
// import { signup, verifyOTP, login } from "../controllers/authController.js";

// const router = express.Router();

// router.post("/signup", signup);
// router.post("/verify-otp", verifyOTP);
// router.post("/login", login);

// export default router;


import express from "express";
import {
  signup,
  verifyOTP,
  login,
  googleLogin,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword
} from "../controllers/authController.js";

import { authenticate } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/upload.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.post("/google-login", googleLogin);

router.get("/profile/:id",authenticate, getProfile);
router.put("/profile/:id",authenticate, upload.single("profileImage"), updateProfile);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;

