// import User from "../models/User.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import nodemailer from "nodemailer";
// import { OAuth2Client } from "google-auth-library";


// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// // Helper: Send OTP Email
// const sendOTPEmail = async (email, otp) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: "Email Verification OTP",
//     text: `Your OTP is: ${otp}`,
//   });
// };

// // Signup
// // export const signup = async (req, res) => {
// //   try {
// //     const { fullName, email, password } = req.body;

// //     if (!fullName || !email || !password) {
// //       return res.status(400).json({ error: "All fields are required." });
// //     }

// //     const existingUser = await User.findOne({ email });
// //     if (existingUser) {
// //       return res.status(400).json({ error: "User already exists." });
// //     }

// //     const hashedPassword = await bcrypt.hash(password, 10);

// //     const otp = Math.floor(100000 + Math.random() * 900000).toString();

// //     const newUser = await User.create({
// //       fullName,
// //       email,
// //       password: hashedPassword,
// //       otp,
// //       emailVerified: false,
// //     });

// //     // Send OTP
// //     await sendOTPEmail(email, otp);

// //     res.json({ message: "User created. OTP sent to email.", userId: newUser._id });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ error: "Server error" });
// //   }
// // };

// export const signup = async (req, res) => {
//   try {
//     const { fullName, email, password } = req.body;

//     if (!fullName || !email || !password) {
//       return res.status(400).json({ error: "All fields required" });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ error: "User already exists" });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     const user = await User.create({
//       fullName,
//       email,
//       password, // plain text (as requested)
//       profilePicture: req.file
//         ? `/uploads/profile/${req.file.filename}`
//         : "",
//       otp,
//       emailVerified: false,
//     });

//     await sendOTPEmail(email, otp);

//     res.json({
//       message: "Signup successful",
//       userId: user._id,
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// };


// // Verify OTP
// export const verifyOTP = async (req, res) => {
//   try {
//     const { userId, otp } = req.body;
//     const user = await User.findById(userId);
//     if (!user) return res.status(400).json({ error: "User not found." });

//     if (user.otp !== otp) {
//       return res.status(400).json({ error: "Invalid OTP." });
//     }

//     user.emailVerified = true;
//     user.otp = null;
//     await user.save();

//     res.json({ message: "Email verified successfully." });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// // Login
// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ error: "Invalid credentials." });

//     if (!user.emailVerified) {
//       return res.status(400).json({ error: "Email not verified." });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ error: "Invalid credentials." });

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

//     res.json({ message: "Login successful", token, userId: user._id });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// };
// export const googleLogin = async (req, res) => {
//   try {
//     const { idToken } = req.body;

//     if (!idToken) {
//       return res.status(400).json({ error: "Google token is required" });
//     }

//     // Verify token with Google
//     const ticket = await client.verifyIdToken({
//       idToken,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const { sub, email, name, email_verified } = ticket.getPayload();

//     // Find user
//     let user = await User.findOne({ email });

//     // If user doesn't exist → create
//     if (!user) {
//       user = await User.create({
//         fullName: name,
//         email,
//         googleId: sub,
//         emailVerified: email_verified,
//       });
//     }

//     // If user exists but googleId missing → attach it
//     if (!user.googleId) {
//       user.googleId = sub;
//       user.emailVerified = true;
//       await user.save();
//     }

//     // Generate JWT
//     const token = jwt.sign(
//       { id: user._id },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       message: "Google login successful",
//       token,
//       userId: user._id,
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Google authentication failed" });
//   }
// };



// import User from "../models/User.js";
// import jwt from "jsonwebtoken";
// import nodemailer from "nodemailer";
// import { OAuth2Client } from "google-auth-library";

// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// // ---------------- EMAIL ----------------
// const sendEmail = async (email, subject, text) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   await transporter.sendMail({ from: process.env.EMAIL_USER, to: email, subject, text });
// };

// // ---------------- SIGNUP ----------------
// export const signup = async (req, res) => {
//   try {
//     const { fullName, email, password } = req.body;

//     if (!fullName || !email || !password)
//       return res.status(400).json({ error: "All fields required" });

//     const exists = await User.findOne({ email });
//     if (exists) return res.status(400).json({ error: "User exists" });

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     const user = await User.create({
//       fullName,
//       email,
//       password,
//       otp,
//       emailVerified: false,
//       profileImage: req.file ? `/uploads/profile/${req.file.filename}` : null,
//     });


//     res.json({ message: "Signup successful, verify OTP", userId: user._id });
//     await sendEmail(email, "OTP Verification", `Your OTP is ${otp}`);

//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// };

// // ---------------- VERIFY OTP ----------------
// export const verifyOTP = async (req, res) => {
//   const { userId, otp } = req.body;
//   const user = await User.findById(userId);

//   if (!user || user.otp !== otp)
//     return res.status(400).json({ error: "Invalid OTP" });

//   user.emailVerified = true;
//   user.otp = null;
//   await user.save();

//   res.json({ message: "Email verified" });
// };

// // ---------------- LOGIN ----------------
// export const login = async (req, res) => {
//   const { email, password } = req.body;

//   const user = await User.findOne({ email });
//   if (!user || user.password !== password)
//     return res.status(400).json({ error: "Invalid credentials" });

//   if (!user.emailVerified)
//     return res.status(400).json({ error: "Email not verified" });

//   const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

//   res.json({ token });
// };


// export const googleLogin = async (req, res) => {
//   try {
//     const { idToken } = req.body;

//     if (!idToken) return res.status(400).json({ error: "Google ID token required" });

//     const ticket = await client.verifyIdToken({
//       idToken,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const { sub, email, name, email_verified, picture } = ticket.getPayload();

//     let user = await User.findOne({ email });

//     if (!user) {
//       user = await User.create({
//         fullName: name,
//         email,
//         googleId: sub,
//         emailVerified: email_verified,
//         avatar: picture,
//       });
//     }

//     // Update existing user if needed
//     let updated = false;
//     if (!user.googleId) { user.googleId = sub; updated = true; }
//     if (!user.avatar && picture) { user.avatar = picture; updated = true; }
//     if (!user.emailVerified && email_verified) { user.emailVerified = true; updated = true; }

//     if (updated) await user.save();

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

//     // Respond like simple login
//     console.log(user._id , "sdfsdf")
    
//     res.json({ token,
//        id: user._id });

//   } catch (err) {
//     console.error("Google login error:", err.message);
//     res.status(500).json({ error: "Google authentication failed" });
//   }
// };

// // ---------------- GET PROFILE ----------------



// export const getProfile = async (req, res) => {
// const user = await User.findById(req.params.id)
//   .select("-chatHistories -examHistory -otp -quizProgress -examProgress -resetOTP -emailVerified");
//   if (!user) return res.status(404).json({ error: "User not found" });
//   res.json(user);
// };


// export const updateProfile = async (req, res) => {

//   try {
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // 🔑 Old password check (simple)
//     if (req.body.oldPassword && req.body.newPassword) {
//       if (user.password !== req.body.oldPassword) {
//         return res.status(400).json({
//           message: "Old password is incorrect",
//         });
//       }
//     }

//     const updates = {
//       fullName: req.body.fullName,
//     };

//     if (req.body.newPassword) {
//       updates.password = req.body.newPassword;
//     }
// console.log(req.file)
//     if (req.file) {
//       updates.profileImage = `/uploads/profile/${req.file.filename}`;
//     }
    

//     const updatedUser = await User.findByIdAndUpdate(
//       req.params.id,
//       updates,
//       { new: true }
//     );

//     res.json("Your Information Updated");
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// // ---------------- FORGOT PASSWORD ----------------
// export const forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   const user = await User.findOne({ email });
//   if (!user) return res.status(404).json({ error: "User not found" });

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   user.resetOTP = otp;
//   await user.save();

//   await sendEmail(email, "Reset Password OTP", `Your OTP is ${otp}`);
//   res.json({ message: "OTP sent" });
// };

// // ---------------- RESET PASSWORD ----------------
// export const resetPassword = async (req, res) => {
//   const { email, otp, newPassword } = req.body;

//   const user = await User.findOne({ email, resetOTP: otp });
//   if (!user) return res.status(400).json({ error: "Invalid OTP" });

//   user.password = newPassword;
//   user.resetOTP = null;
//   await user.save();

//   res.json({ message: "Password reset successful" });
// };


import User from "../models/User.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ---------------- HELPERS ----------------
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidOTP = (otp) =>
  typeof otp === "string" && /^\d{6}$/.test(otp);

// ---------------- EMAIL ----------------
// const sendEmail = async (email, subject, text) => {
//   if (!email || !subject || !text) return;

//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject,
//     text,
//   });
// };

export const sendEmail = async (email, subject, text) => {
  if (!email || !subject || !text) {
    console.error("Missing email, subject, or text");
    return;
  }

  if (!isValidEmail(email)) {
    console.error("Invalid email format:", email);
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, 
      secure: false, 
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text,
    });

    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
};

// ---------------- SIGNUP ----------------
export const signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    if (!isValidEmail(email))
      return res.status(400).json({ error: "Invalid email format" });

    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "User exists" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      fullName,
      email,
      password,
      otp,
      emailVerified: false,
      profileImage: req.file
        ? `/uploads/profile/${req.file.filename}`
        : null,
    });

    res.json({ message: "Signup successful, verify OTP", userId: user._id });
    await sendEmail(email, "OTP Verification", `Your OTP is ${otp}`);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ---------------- VERIFY OTP ----------------
export const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp)
    return res.status(400).json({ error: "User ID and OTP required" });

  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(400).json({ error: "Invalid user ID" });

  if (!isValidOTP(otp))
    return res.status(400).json({ error: "Invalid OTP format" });

  const user = await User.findById(userId);

  if (!user || user.otp !== otp)
    return res.status(400).json({ error: "Invalid OTP" });

  user.emailVerified = true;
  user.otp = null;
  await user.save();

  res.json({ message: "Email verified" });
};

// ---------------- LOGIN ----------------
// export const login = async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password)
//     return res.status(400).json({ error: "Email and password required" });

//   if (!isValidEmail(email))
//     return res.status(400).json({ error: "Invalid email format" });

//   const user = await User.findOne({ email });
//   if (!user || user.password !== password)
//     return res.status(400).json({ error: "Invalid credentials" });

//   if (!user.emailVerified)
//     return res.status(400).json({ error: "Email not verified" });

//   const token = jwt.sign(
//     { id: user._id },
//     process.env.JWT_SECRET,
//     { expiresIn: "7d" }
//   );

//   res.json({ token });
// };

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Step 1: Empty fields
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  // Step 2: Email format
  if (!isValidEmail(email))
    return res.status(400).json({ error: "Invalid email format" });

  // Step 3: Email existence
  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ error: "Email not registered" });

  // Step 4: Password match
  if (user.password !== password)
    return res.status(400).json({ error: "Password incorrect" });

  // Step 5: Email verification
  if (!user.emailVerified)
    return res.status(400).json({ error: "Email not verified" });

  // Step 6: Token
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
};


// ---------------- GOOGLE LOGIN ----------------
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken)
      return res.status(400).json({ error: "Google ID token required" });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email)
      return res.status(400).json({ error: "Invalid Google token" });

    const { sub, email, name, email_verified, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        fullName: name || "Google User",
        email,
        googleId: sub,
        emailVerified: email_verified,
        avatar: picture,
      });
    }

    let updated = false;
    if (!user.googleId) { user.googleId = sub; updated = true; }
    if (!user.avatar && picture) { user.avatar = picture; updated = true; }
    if (!user.emailVerified && email_verified) { user.emailVerified = true; updated = true; }

    if (updated) await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, id: user._id });
  } catch (err) {
    console.error("Google login error:", err.message);
    res.status(500).json({ error: "Google authentication failed" });
  }
};

// ---------------- GET PROFILE ----------------
export const getProfile = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ error: "Invalid user ID" });

  const user = await User.findById(id).select(
    "-chatHistories -examHistory -otp -quizProgress -examProgress -resetOTP -emailVerified"
  );

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
};

// ---------------- UPDATE PROFILE ----------------
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user ID" });

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (req.body.newPassword && !req.body.oldPassword)
      return res.status(400).json({ message: "Old password required" });

    if (req.body.oldPassword && req.body.newPassword) {
      if (user.password !== req.body.oldPassword) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }
    }

    const updates = {};

    if (req.body.fullName) updates.fullName = req.body.fullName;
    if (req.body.newPassword) updates.password = req.body.newPassword;
    if (req.file)
      updates.profileImage = `/uploads/profile/${req.file.filename}`;

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ message: "No data to update" });

    await User.findByIdAndUpdate(id, updates, { new: true });

    res.json("Your Information Updated");
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- FORGOT PASSWORD ----------------
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ error: "Email required" });

  if (!isValidEmail(email))
    return res.status(400).json({ error: "Invalid email format" });

  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).json({ error: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetOTP = otp;
  await user.save();

  await sendEmail(email, "Reset Password OTP", `Your OTP is ${otp}`);
  res.json({ message: "OTP sent" });
};

// ---------------- RESET PASSWORD ----------------
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword)
    return res.status(400).json({ error: "All fields required" });

  if (!isValidOTP(otp))
    return res.status(400).json({ error: "Invalid OTP format" });

  if (newPassword.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  const user = await User.findOne({ email, resetOTP: otp });
  if (!user)
    return res.status(400).json({ error: "Invalid OTP" });

  user.password = newPassword;
  user.resetOTP = null;
  await user.save();

  res.json({ message: "Password reset successful" });
};
