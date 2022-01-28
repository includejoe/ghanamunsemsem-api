const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "../media_upload/images");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + ext);
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
