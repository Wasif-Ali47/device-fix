import jwt from "jsonwebtoken";

const adminJwtSecret = () =>
  process.env.ADMIN_JWT_SECRET ||
  process.env.JWT_SECRET ||
  "change-this-admin-secret";

export const signAdminToken = (adminId) =>
  jwt.sign({ adminId }, adminJwtSecret(), { expiresIn: "7d" });

export const verifyAdmin = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No admin token provided",
      });
    }

    const decoded = jwt.verify(token, adminJwtSecret());
    req.adminId = decoded.adminId;
    next();
  } catch (_) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin token",
    });
  }
};
