const multer = require("multer");
const path = require("path");

// Dynamic Storage Engine
const storage = (type) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath = "";

      if (file.mimetype.startsWith("image")) {
        // Fix the "challengesForm" case to match "images"
        if (type === "challengesForm" || type === "images") {
          uploadPath = "assets/images/challengesForm";
        } else {
          switch (type) {
            case "challenges":
              uploadPath = "assets/images/challenges";
              break;
            case "products":
              uploadPath = "assets/images/products";
              break;
            case "rewards":
              uploadPath = "assets/images/rewards";
              break;
            default:
              uploadPath = "assets/images"; // Default image path
              break;
          }
        }
      } else if (file.mimetype.startsWith("video")) {
        switch (type) {
          case "challengesForm":
            uploadPath = "assets/videos/challengesForm";
            break;
          default:
            uploadPath = "assets/videos"; // Default video path
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
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  });

// Export the dynamic upload middleware
module.exports = upload;
