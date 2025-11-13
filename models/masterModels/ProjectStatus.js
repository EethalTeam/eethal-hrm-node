const mongoose = require("mongoose");

const ProjectStatusSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectStatus", ProjectStatusSchema);
