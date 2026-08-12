import express from "express";
import { verifyAdmin } from "../middlewares/adminAuthMiddleware.js";
import { verifyAdminOrServiceKey } from "../middlewares/serviceKeyMiddleware.js";
import {
  broadcastNotification,
  getUsageOverview,
  getUsers,
  setUserBanState,
  updateUser,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/test", (_req, res) => {
  res.json({ success: true, message: "Admin routes are working" });
});

router.use(verifyAdminOrServiceKey(verifyAdmin));
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.patch("/users/:id/ban", setUserBanState);
router.patch("/users/:id/toggle", setUserBanState);
router.get("/usage", getUsageOverview);
router.post("/notifications/broadcast", broadcastNotification);

export default router;
