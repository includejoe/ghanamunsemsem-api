const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const authorSchema = new Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
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
});

const Author = mongoose.model("Author", authorSchema);
module.exports = Author;