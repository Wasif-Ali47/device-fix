import mongoose from "mongoose";
import User from "../models/User.js";
import PushDeviceToken from "../models/PushDeviceToken.js";
import { ensureFirebaseAdmin } from "../utils/firebaseAdminInit.js";

const readUsage = (usage) => ({
  promptTokens: Number(usage?.promptTokens) || 0,
  completionTokens: Number(usage?.completionTokens) || 0,
  totalTokens: Number(usage?.totalTokens) || 0,
  requestCount: Number(usage?.requestCount) || 0,
  lastUsedAt: usage?.lastUsedAt || null,
});

export const getUsers = async (_req, res) => {
  try {
    const users = await User.find({})
      .select("-password -otp -resetOTP")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      users: users.map((user) => ({
        id: user._id,
        name: user.fullName || "",
        fullName: user.fullName || "",
        email: user.email || "",
        image: user.profileImage || "",
        profileImage: user.profileImage || "",
        emailVerified: !!user.emailVerified,
        isActive: user.isActive !== false,
        isBanned: !!user.isBanned,
        bannedAt: user.bannedAt || null,
        bannedReason: user.bannedReason || "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deviceTokenCount: Array.isArray(user.deviceTokens)
          ? user.deviceTokens.length
          : 0,
        openAiUsage: readUsage(user.openAiUsage),
      })),
    });
  } catch (error) {
    console.error("[admin:getUsers] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const payload = {};
    const fieldMap = {
      name: "fullName",
      fullName: "fullName",
      email: "email",
      emailVerified: "emailVerified",
      isActive: "isActive",
    };
    for (const [source, target] of Object.entries(fieldMap)) {
      if (req.body?.[source] !== undefined) {
        payload[target] = req.body[source];
      }
    }

    if (typeof payload.email === "string") {
      payload.email = payload.email.trim().toLowerCase();
    }
    if (typeof payload.fullName === "string") {
      payload.fullName = payload.fullName.trim();
    }

    if (!Object.keys(payload).length) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    const user = await User.findByIdAndUpdate(id, payload, { new: true }).select(
      "-password -otp -resetOTP"
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("[admin:updateUser] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

export const setUserBanState = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const banValue = req.body?.isBanned;
    const isBanned =
      banValue === true || banValue === "true" || banValue === 1 || banValue === "1";

    const user = await User.findByIdAndUpdate(
      id,
      {
        isBanned,
        bannedAt: isBanned ? new Date() : null,
        bannedReason: isBanned ? String(req.body?.bannedReason || "").trim() : "",
      },
      { new: true }
    ).select("-password -otp -resetOTP");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: isBanned ? "User banned successfully" : "User unbanned successfully",
      user: {
        id: user._id,
        email: user.email,
        isBanned: user.isBanned,
        bannedAt: user.bannedAt,
        bannedReason: user.bannedReason,
      },
    });
  } catch (error) {
    console.error("[admin:setUserBanState] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user ban state",
      error: error.message,
    });
  }
};

export const getUsageOverview = async (_req, res) => {
  try {
    const agg = await User.aggregate([
      {
        $group: {
          _id: null,
          users: { $sum: 1 },
          bannedUsers: { $sum: { $cond: [{ $eq: ["$isBanned", true] }, 1, 0] } },
          totalPromptTokens: { $sum: { $ifNull: ["$openAiUsage.promptTokens", 0] } },
          totalCompletionTokens: {
            $sum: { $ifNull: ["$openAiUsage.completionTokens", 0] },
          },
          totalTokens: { $sum: { $ifNull: ["$openAiUsage.totalTokens", 0] } },
          totalRequests: { $sum: { $ifNull: ["$openAiUsage.requestCount", 0] } },
        },
      },
    ]);

    const topUsers = await User.find({})
      .select("fullName email isBanned openAiUsage")
      .sort({ "openAiUsage.totalTokens": -1 })
      .limit(20)
      .lean();

    return res.json({
      success: true,
      summary: agg[0] || {
        users: 0,
        bannedUsers: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        totalRequests: 0,
      },
      topUsers: topUsers.map((user) => ({
        id: user._id,
        name: user.fullName || "",
        email: user.email || "",
        isBanned: !!user.isBanned,
        openAiUsage: readUsage(user.openAiUsage),
      })),
    });
  } catch (error) {
    console.error("[admin:getUsageOverview] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch usage overview",
      error: error.message,
    });
  }
};

export const broadcastNotification = async (req, res) => {
  try {
    const firebaseAdmin = ensureFirebaseAdmin();
    if (!firebaseAdmin) {
      return res.status(503).json({
        success: false,
        message: "Push notifications not configured. Missing Firebase setup.",
      });
    }

    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    const data = req.body?.data && typeof req.body.data === "object" ? req.body.data : {};
    const targetAppSlug =
      typeof req.body?.appSlug === "string" ? req.body.appSlug.trim() : "";

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: "title and body are required",
      });
    }

    const uniqueTokens = new Set();
    const userQuery = {
      "deviceTokens.0": { $exists: true },
      isBanned: { $ne: true },
    };
    const usersWithTokens = await User.find(userQuery).select("deviceTokens").lean();
    for (const user of usersWithTokens) {
      for (const device of user.deviceTokens || []) {
        if (!device?.token) continue;
        if (targetAppSlug && device.appSlug && device.appSlug !== targetAppSlug) {
          continue;
        }
        uniqueTokens.add(device.token);
      }
    }

    const standaloneQuery = { isActive: true };
    if (targetAppSlug) standaloneQuery.appSlug = targetAppSlug;
    const standaloneRows = await PushDeviceToken.find(standaloneQuery)
      .select("token")
      .lean();
    for (const row of standaloneRows) {
      if (row?.token) uniqueTokens.add(row.token);
    }

    const tokens = Array.from(uniqueTokens);
    if (!tokens.length) {
      return res.json({
        success: true,
        message: "No registered device tokens found",
        totalTokens: 0,
        successCount: 0,
        failureCount: 0,
      });
    }

    const payloadData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[String(key)] = String(value);
      return acc;
    }, {});
    if (targetAppSlug) payloadData.appSlug = targetAppSlug;

    const chunkSize = 500;
    let successCount = 0;
    let failureCount = 0;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const response = await firebaseAdmin.messaging().sendEachForMulticast({
        tokens: tokens.slice(i, i + chunkSize),
        notification: { title, body },
        data: payloadData,
      });
      successCount += response.successCount || 0;
      failureCount += response.failureCount || 0;
    }

    return res.json({
      success: true,
      message: "Broadcast notification sent",
      totalTokens: tokens.length,
      successCount,
      failureCount,
    });
  } catch (error) {
    console.error("[admin:broadcastNotification] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send broadcast notification",
      error: error.message,
    });
  }
};
