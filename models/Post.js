const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  content: {
    type: String,
  },
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  pk: { type: String },
  image: {
    type: String,
  },
  video: {
    type: String,
  },
  createdAt: {
    type: String,
    default: new Date().toDateString(),
  },
});

module.exports = mongoose.model("Post", PostSchema);
