const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
  },
  email: {
    type: String,
    sparse: true,
  },
  mssv: {
    type: String,
  },
  class: {
    type: String,
  },
  khoa: {
    type: String,
  },
  password: String,
  username: {
    type: String,
    unique: true,
  },
  image: {
    type: String,
  },
  role: [String],
});

module.exports = mongoose.model("User", UserSchema);
