export const verifyServiceKey = (req, res, next) => {
  const key = req.headers["x-service-key"];
  const expected = process.env.INTERNAL_SERVICE_KEY;
  if (expected && key === expected) {
    return next();
  }
  return res.status(401).json({ success: false, message: "Unauthorized" });
};

export const verifyAdminOrServiceKey = (verifyAdmin) => (req, res, next) => {
  const key = req.headers["x-service-key"];
  const expected = process.env.INTERNAL_SERVICE_KEY;
  if (expected && key === expected) {
    return next();
  }
  return verifyAdmin(req, res, next);
};
