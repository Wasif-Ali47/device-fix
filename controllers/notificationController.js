import mongoose from "mongoose";
import User from "../models/User.js";
import PushDeviceToken from "../models/PushDeviceToken.js";
import { ensureFirebaseAdmin } from "../utils/firebaseAdminInit.js";

const buildDeviceInfo = (deviceInfo) => {
  if (!deviceInfo || typeof deviceInfo !== "object") {
    return { os: "", appVersion: "" };
  }
  return {
    os: typeof deviceInfo.os === "string" ? deviceInfo.os : "",
    appVersion:
      typeof deviceInfo.appVersion === "string" ? deviceInfo.appVersion : "",
  };
};

const stringifyData = (data) =>
  Object.entries(data || {}).reduce((acc, [key, value]) => {
    acc[String(key)] = String(value);
    return acc;
  }, {});

const upsertStandaloneToken = async ({
  token,
  labelUserId,
  appSlug,
  deviceType,
  deviceInfo,
}) => {
  await PushDeviceToken.findOneAndUpdate(
    { token },
    {
      $set: {
        token,
        userId: labelUserId || null,
        appSlug: appSlug || "",
        deviceType,
        deviceInfo,
        isActive: true,
        registeredAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const registerToken = async (req, res) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const deviceType =
      typeof req.body?.deviceType === "string"
        ? req.body.deviceType.trim()
        : "unknown";
    const deviceInfo = buildDeviceInfo(req.body?.deviceInfo);
    const bodyUserIdRaw =
      typeof req.body?.userId === "string" ? req.body.userId.trim() : "";
    const appSlug =
      typeof req.body?.appSlug === "string" ? req.body.appSlug.trim() : "";

    if (!token) {
      return res.status(400).json({ success: false, message: "token is required" });
    }

    let mongoUser = req.authUser?._id ? req.authUser : null;
    if (!mongoUser && bodyUserIdRaw && mongoose.Types.ObjectId.isValid(bodyUserIdRaw)) {
      const user = await User.findById(bodyUserIdRaw);
      if (user && !user.isBanned) mongoUser = user;
    }

    if (mongoUser) {
      if (mongoUser.isBanned) {
        return res.status(403).json({
          success: false,
          message: "Banned users cannot register device tokens",
        });
      }

      const existingIndex = (mongoUser.deviceTokens || []).findIndex(
        (device) => device.token === token
      );
      const tokenPayload = {
        token,
        deviceType,
        deviceInfo,
        appSlug,
        registeredAt: new Date(),
      };
      if (existingIndex >= 0) {
        mongoUser.deviceTokens[existingIndex].set(tokenPayload);
      } else {
        mongoUser.deviceTokens.push(tokenPayload);
      }

      await mongoUser.save();
      await PushDeviceToken.deleteOne({ token }).catch((error) =>
        console.warn("[notification:registerToken] standalone cleanup skipped:", error.message)
      );

      return res.json({
        success: true,
        message: "Device token registered successfully",
        storage: "user",
        userId: mongoUser._id.toString(),
        token,
      });
    }

    await upsertStandaloneToken({
      token,
      labelUserId: bodyUserIdRaw || null,
      appSlug,
      deviceType,
      deviceInfo,
    });

    return res.status(201).json({
      success: true,
      message: "Device token registered successfully",
      storage: "standalone",
      token,
    });
  } catch (error) {
    console.error("[notification:registerToken] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register device token",
      error: error.message,
    });
  }
};

export const sendNotification = async (req, res) => {
  try {
    const firebaseAdmin = ensureFirebaseAdmin();
    if (!firebaseAdmin) {
      return res.status(503).json({
        success: false,
        message: "Push notifications not configured. Missing Firebase setup.",
      });
    }

    const user = req.authUser;
    if (!user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    const data = req.body?.data && typeof req.body.data === "object" ? req.body.data : {};
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: "title and body are required",
      });
    }

    const freshUser = await User.findById(user._id).select("deviceTokens");
    const tokens = (freshUser?.deviceTokens || []).map((device) => device.token).filter(Boolean);
    if (!tokens.length) {
      return res.status(404).json({
        success: false,
        message: "No device tokens found for user",
      });
    }

    const response = await firebaseAdmin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: stringifyData(data),
    });

    return res.json({
      success: true,
      message: "Notification sent successfully",
      successCount: response.successCount || 0,
      failureCount: response.failureCount || 0,
    });
  } catch (error) {
    console.error("[notification:sendNotification] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};

export const getTokens = async (req, res) => {
  try {
    const user = req.authUser;
    if (!user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const freshUser = await User.findById(user._id).select("deviceTokens");
    if (!freshUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, tokens: freshUser.deviceTokens || [] });
  } catch (error) {
    console.error("[notification:getTokens] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get tokens",
      error: error.message,
    });
  }
};

export const removeToken = async (req, res) => {
  try {
    const user = req.authUser;
    if (!user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = req.params?.token;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required in path",
      });
    }

    const freshUser = await User.findById(user._id);
    if (!freshUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    freshUser.deviceTokens = (freshUser.deviceTokens || []).filter(
      (device) => device.token !== token
    );
    await freshUser.save();

    return res.json({ success: true, message: "Token removed successfully" });
  } catch (error) {
    console.error("[notification:removeToken] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove token",
      error: error.message,
    });
  }
};
