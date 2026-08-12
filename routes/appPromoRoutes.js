import express from "express";
import {
  getAllAppPromos,
  getAppPromoById,
} from "../controllers/appPromoController.js";

const router = express.Router();

router.get("/", getAllAppPromos);
router.get("/:id", getAppPromoById);

export default router;
