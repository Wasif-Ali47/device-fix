import mongoose from "mongoose";
import AppPromo from "../models/AppPromo.js";
import {
  deletePromoImage,
  getPromoImageUrl,
} from "../middlewares/appPromoUpload.js";

const mapPromo = (promo) => ({
  id: promo._id.toString(),
  title: promo.title,
  image: getPromoImageUrl(promo.image) || promo.image,
  link: promo.link,
  isActive: !!promo.isActive,
  order: Number(promo.order) || 0,
  screen: promo.screen || "",
  createdAt: promo.createdAt,
  updatedAt: promo.updatedAt,
});

export const getAllAppPromos = async (req, res) => {
  try {
    const query = {};
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === "true";
    }
    const promos = await AppPromo.find(query).sort({ order: 1, createdAt: -1 }).lean();
    return res.json({ success: true, data: promos.map(mapPromo) });
  } catch (error) {
    console.error("[appPromos:getAll] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch app promos.",
      error: error.message,
    });
  }
};

export const getAppPromoById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid promo id" });
    }
    const promo = await AppPromo.findById(id).lean();
    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "App promo not found.",
      });
    }
    return res.json({ success: true, data: mapPromo(promo) });
  } catch (error) {
    console.error("[appPromos:getById] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch app promo.",
      error: error.message,
    });
  }
};

export const createAppPromo = async (req, res) => {
  try {
    const { title, link, isActive, order, screen } = req.body || {};
    if (!title || !link) {
      if (req.file) deletePromoImage(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "Title and link are required.",
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required.",
      });
    }

    const promo = await AppPromo.create({
      title: String(title).trim(),
      image: req.file.filename,
      link: String(link).trim(),
      isActive: isActive !== undefined ? isActive === "true" || isActive === true : true,
      order: Number.parseInt(order, 10) || 0,
      screen: typeof screen === "string" ? screen.trim() : "",
    });

    return res.status(201).json({
      success: true,
      message: "App promo created successfully.",
      data: mapPromo(promo),
    });
  } catch (error) {
    if (req.file) deletePromoImage(req.file.filename);
    console.error("[appPromos:create] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create app promo.",
      error: error.message,
    });
  }
};

export const updateAppPromo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.file) deletePromoImage(req.file.filename);
      return res.status(400).json({ success: false, message: "Invalid promo id" });
    }

    const promo = await AppPromo.findById(id);
    if (!promo) {
      if (req.file) deletePromoImage(req.file.filename);
      return res.status(404).json({
        success: false,
        message: "App promo not found.",
      });
    }

    const oldImage = promo.image;
    const { title, link, isActive, order, screen } = req.body || {};
    if (title !== undefined) promo.title = String(title).trim();
    if (link !== undefined) promo.link = String(link).trim();
    if (isActive !== undefined) promo.isActive = isActive === "true" || isActive === true;
    if (order !== undefined) promo.order = Number.parseInt(order, 10) || 0;
    if (screen !== undefined) promo.screen = typeof screen === "string" ? screen.trim() : "";
    if (req.file) promo.image = req.file.filename;

    await promo.save();
    if (req.file && oldImage && oldImage !== req.file.filename) {
      deletePromoImage(oldImage);
    }

    return res.json({
      success: true,
      message: "App promo updated successfully.",
      data: mapPromo(promo),
    });
  } catch (error) {
    if (req.file) deletePromoImage(req.file.filename);
    console.error("[appPromos:update] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update app promo.",
      error: error.message,
    });
  }
};

export const deleteAppPromo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid promo id" });
    }
    const promo = await AppPromo.findById(id);
    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "App promo not found.",
      });
    }
    if (promo.image) deletePromoImage(promo.image);
    await AppPromo.findByIdAndDelete(id);
    return res.json({
      success: true,
      message: "App promo deleted successfully.",
    });
  } catch (error) {
    console.error("[appPromos:delete] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete app promo.",
      error: error.message,
    });
  }
};
