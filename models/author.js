const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const authorSchema = new Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    secretCode: {
      type: String,
      ref: "secretcodes",
    },
    profilePic: String,
  },
  { timestamps: true }
);

const Author = mongoose.model("Author", authorSchema);
module.exports = Author;
