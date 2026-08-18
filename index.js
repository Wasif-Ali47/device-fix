import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import examRoutes from "./routes/exam.js";
import quizRoutes from "./routes/quiz.routes.js";
import askRoutes from "./routes/ask.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import appPromoRoutes from "./routes/appPromoRoutes.js";
import adminPromoRoutes from "./routes/adminPromoRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import knowledgeRoutes from "./routes/knowledgeRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import { ensureFirebaseAdmin } from "./utils/firebaseAdminInit.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

const getBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;

app.get("/", (req, res) => {
  const baseUrl = getBaseUrl(req);

  res.json({
    name: "DevicePulse AI Backend",
    status: "running",
    baseUrl,
    database: mongoose.connection.name || mongoDbName || "not connected",
    endpoints: {
      health: `${baseUrl}/health`,
      auth: `${baseUrl}/auth`,
      aiMentor: `${baseUrl}/ask`,
      chat: `${baseUrl}/chat`,
      quiz: `${baseUrl}/api/quiz`,
      examProgress: `${baseUrl}/exam_progress`,
      uploads: `${baseUrl}/uploads`,
      adminAuth: `${baseUrl}/api/admin/auth`,
      admin: `${baseUrl}/api/admin`,
      notifications: `${baseUrl}/api/notifications`,
      appPromos: `${baseUrl}/api/app-promos`,
      faq: `${baseUrl}/api/faq`,
      subscription: `${baseUrl}/api/subscription`,
      adminKnowledge: `${baseUrl}/api/admin/knowledge`,
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    baseUrl: getBaseUrl(req),
    database: {
      name: mongoose.connection.name || mongoDbName || null,
      readyState: mongoose.connection.readyState,
    },
  });
});

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const mongoDbName = process.env.MONGODB_DB_NAME;

if (!mongoUri) {
  console.error("MongoDB connection error: MONGODB_URI is not set");
  process.exit(1);
}

mongoose
  .connect(mongoUri, mongoDbName ? { dbName: mongoDbName } : undefined)
  .then(() => {
    const connectedDb = mongoose.connection.name;
    console.log(`MongoDB connected to database: ${connectedDb}`);
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/chat", chatRoutes);
app.use("/ask", askRoutes);
app.use("/exam_progress", examRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/app-promos", appPromoRoutes);
app.use("/api/admin/app-promos", adminPromoRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/admin/knowledge", knowledgeRoutes);
app.use("/api/subscription", subscriptionRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((error, req, res, next) => {
  console.error(`[express-error] ${req.method} ${req.originalUrl}:`, error.message);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5044;
app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
const firebaseAdmin = ensureFirebaseAdmin();
console.log(
  `[firebase] Push notifications: ${
    firebaseAdmin ? "ready" : "not configured (set FIREBASE_SERVICE_ACCOUNT or firebase-service-account.json)"
  }`
);
