// import multer from "multer";
// import path from "path";

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/profile");
//   },
//   filename: (req, file, cb) => {
//     cb(
//       null,
//       Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)
//     );
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith("image/")) cb(null, true);
//   else cb(new Error("Only images allowed"), false);
// };

// export const upload = multer({ storage, fileFilter });


import multer from "multer";
import path from "path";

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profile");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// File type filter
const fileFilter = (req, file, cb) => {
  const mimetype = file.mimetype || '';

  if (mimetype.startsWith("image/") || file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    cb(null, true);
  } else {
    cb(new Error("Only images allowed"), false);
  }
};


// const fileFilter = (req, file, cb) => {
//   console.log("[DEBUG] Checking file type:", file.mimetype);
//   if (file.mimetype.startsWith("image/")) {
//     console.log("[DEBUG] File accepted");
//     cb(null, true);
//   } else {
//     console.log("[DEBUG] File rejected: Only images allowed");
//     cb(new Error("Only images allowed"), false);
//   }
// };

// Export multer instance
export const upload = multer({ storage, fileFilter });
