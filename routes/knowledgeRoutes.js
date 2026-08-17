import express from "express";
import {
  categories,
  createEntry,
  deactivateEntry,
  getEntry,
  listEntries,
  merged,
  reactivateEntry,
  removeEntry,
  stats,
  updateEntry,
} from "../controllers/knowledgeController.js";
import { verifyAdmin } from "../middlewares/adminAuthMiddleware.js";

const router = express.Router();

router.use(verifyAdmin);
router.get("/", listEntries);
router.get("/stats", stats);
router.get("/categories", categories);
router.get("/merged", merged);
router.get("/:id", getEntry);
router.post("/", createEntry);
router.put("/:id", updateEntry);
router.patch("/:id/deactivate", deactivateEntry);
router.patch("/:id/reactivate", reactivateEntry);
router.delete("/:id", removeEntry);

export default router;
