const multer = require("multer");
const path = require("path");

// receive file with author first and last name

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/author_profile_images");
  },
  filename: (req, file, cb) => {
    const { firstname, lastname } = req.body;
    const timestamp = new Date().toISOString().slice(0, 16).replace(":", "-");
    const uniqueSuffix = firstname + "_" + lastname + timestamp;
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
