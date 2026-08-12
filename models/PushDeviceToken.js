import mongoose from "mongoose";

const pushDeviceTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      default: null,
      trim: true,
    },
    appSlug: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    deviceType: { type: String, default: "unknown", trim: true },
    deviceInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.PushDeviceToken ||
  mongoose.model("PushDeviceToken", pushDeviceTokenSchema);
