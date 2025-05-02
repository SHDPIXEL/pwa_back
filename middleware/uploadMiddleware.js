const multer = require("multer");
const path = require("path");

// Dynamic Storage Engine
const storage = (type) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath = "";

      if (file.mimetype.startsWith("image")) {
        switch (type) {
          case "challengesForm":
            uploadPath = "assets/images/challengesForm"; // Images go here
            break;
          case "challenges":
            uploadPath = "assets/images/challenges";
            break;
          case "products":
            uploadPath = "assets/images/products";
            break;
          case "rewards":
            uploadPath = "assets/images/rewards";
            break;
          case "payments":
            uploadPath = "assets/images/payments";
            break;
          default:
            uploadPath = "assets/images";
            break;
        }
      } else if (file.mimetype.startsWith("video")) {
        switch (type) {
          case "challengesForm":
            uploadPath = "assets/videos/challengesForm"; // FIXED: Now saves correctly
            break;
          default:
            uploadPath = "assets/videos";
            break;
        }
      } else {
        return cb(new Error("Invalid file type"));
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
      );
    },
  });

// File Filter
const fileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|webp/;
  const videoTypes = /mp4|mov/;

  if (file.mimetype.match(imageTypes) || file.mimetype.match(videoTypes)) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WebP, MP4, and MOV files are allowed."
      )
    );
  }
};

// Multer Configuration
const upload = (type) =>
  multer({
    storage: storage(type),
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // Limit file size to 10MB
  });

// Export the dynamic upload middleware
module.exports = upload;
