const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images");
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().slice(0, 16).replace(":", "-");
    const uniqueSuffix =
      "image" + "-" + timestamp + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// file Filter
const fileFilter = (req, file, cb) => {
  const filetype = file.mimetype.split("/")[1];
  if (filetype === "jpg" || filetype === "jpeg" || "png") {
    cb(null, true);
  } else {
    cb(new Error("File Must be of type jpg, jpeg or png."), false);
  }
};

module.exports = multer({ storage, fileFilter });
