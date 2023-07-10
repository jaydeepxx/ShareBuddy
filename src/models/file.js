const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  name: String,
  originalName: String,
  mimeType: String,
  size: Number,
  etag: String,
  url: String,
  created: { type: Date, default: Date.now() },
});

const File = mongoose.model("File", fileSchema);

module.exports = File;
