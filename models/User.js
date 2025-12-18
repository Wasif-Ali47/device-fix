// import mongoose from "mongoose";

// const UserSchema = new mongoose.Schema({
//   fullName: String,
//   email: { type: String, unique: true },
//   password: String,
//   googleId: String,
//   emailVerified: { type: Boolean, default: false },
//   otp: String,
//   chatHistory: [
//     {
//       question: String,
//       reply: String,
//       date: { type: Date, default: Date.now },
//     },
//   ],
//   examHistory: [
//     {
//       topic: String,
//       score: Number,
//       answers: Array,
//       date: { type: Date, default: Date.now },
//     },
//   ],
//   progress: {
//     type: Map,
//     of: Number,
//   },
// }, { timestamps: true });

// export default mongoose.model("User", UserSchema);


import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  googleId: String,
  emailVerified: { type: Boolean, default: false },
  otp: String,
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