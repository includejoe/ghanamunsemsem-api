const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const secretCodeSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    used: {
      type: Boolean,
      required: true,
    },
    by: {
      type: String,
      ref: "authors",
    },
  },
  { timestamps: true }
);

const SecretCode = mongoose.model("SecretCode", secretCodeSchema);
module.exports = SecretCode;
