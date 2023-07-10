const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  from: String,
  to: String,
  message: String,
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
  created: { type: Date, default: Date.now() },
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
