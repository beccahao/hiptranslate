const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Data base data structure
// TODO: Specify collection here
const DataSchema = new Schema(
  {
    id: Number,
    uniqueId: Number,
    sourceLang: String,
    targetLang: String,
    sourceText: String,
    targetText: String,
    domain: String,
    translation: String,
  },
  { collection: "bear" },
  { timestamps: true }
);

// Export new Schema so we can modify it using Node.js
module.exports = mongoose.model("Data", DataSchema);
