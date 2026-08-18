


import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  googleId: String,
  emailVerified: { type: Boolean, default: false },
  otp: String,
  resetOTP: String,
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  bannedAt: { type: Date, default: null },
  bannedReason: { type: String, default: "" },
  isPro: { type: Boolean, default: false },
  subscription: {
    plan: { type: String, default: "free" },
    status: { type: String, default: "free" },
    platform: { type: String, default: "" },
    productId: { type: String, default: "" },
    expiresAt: { type: Date, default: null },
    updatedAt: { type: Date, default: null },
  },

  deviceTokens: [
    {
      token: { type: String, required: true, trim: true },
      deviceType: { type: String, default: "unknown", trim: true },
      deviceInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
      appSlug: { type: String, default: "", trim: true },
      registeredAt: { type: Date, default: Date.now },
    },
  ],
  openAiUsage: {
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    requestCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date, default: null },
  },

  profileImage: {
  type: String,
  default: "",
},

  chatHistories: [
    {
      topic: { type: String, required: true },
      messages: [
        {
          question: String,
          reply: String,
          date: { type: Date, default: Date.now },
        },
      ],
    },
  ],
  examHistory: [
    {
      topic: String,
      score: Number,
      answers: Array,
      date: { type: Date, default: Date.now },
    },
  ],
  progress: {
    type: Map,
    of: Number,
  },


   quizProgress: [
    {
      topic: { type: String, required: true },
      correctAnswers: Number,
      totalQuestions: Number,
      percentage: Number,
      attempts: { type: Number, default: 1 },
      lastAttemptAt: { type: Date, default: Date.now },
      isCompleted: { type: Boolean, default: true },
    },

    
  ],

   examProgress: [
    {
      topic: { type: String, required: true },
      difficulty: {
        type: String,
        default: "medium",
        enum: ["medium"],
      },
      correct: { type: Number, required: true },
      total: { type: Number, required: true },
      percentage: { type: Number, required: true },
      attempts: { type: Number, default: 1 },
      lastUpdated: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });
export default mongoose.model("User", UserSchema);
