import express from "express";
import { verifyAdmin } from "../middlewares/adminAuthMiddleware.js";
import { appPromoUpload } from "../middlewares/appPromoUpload.js";
import {
  createAppPromo,
  deleteAppPromo,
  updateAppPromo,
} from "../controllers/appPromoController.js";

const router = express.Router();

router.use(verifyAdmin);
router.post("/", appPromoUpload.single("image"), createAppPromo);
router.put("/:id", appPromoUpload.single("image"), updateAppPromo);
router.patch("/:id", appPromoUpload.single("image"), updateAppPromo);
router.delete("/:id", deleteAppPromo);

export default router;
