// import jwt from "jsonwebtoken";
// import User from "../models/User.js";

// export const authenticate = async (req, res, next) => {
//   try {
//     const token = req.header("Authorization")?.replace("Bearer ", "");
//     if (!token) return res.status(401).json({ error: "Unauthorized" });
//     console.log(token)

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log(decoded)
//     const user = await User.findById(decoded.id);
//     if (!user) return res.status(401).json({ error: "User not found" });

//     req.user = user; // attach user object
//     next();
//   } catch (err) {
//     res.status(401).json({ error: "Invalid token" });
//   }
// };


import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id); 
    if (!user) return res.status(401).json({ error: "User not found" });
    if (user.isBanned) {
      return res.status(403).json({
        error: "Account banned",
        bannedReason: user.bannedReason || "",
      });
    }
    req.user = user; 
    req.authUser = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const optionalAuth = async (req, _res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && !user.isBanned) {
      req.user = user;
      req.authUser = user;
    }
  } catch (_) {
    // Optional auth deliberately ignores invalid tokens.
  }
  next();
};
