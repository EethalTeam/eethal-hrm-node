// models/masterModels/Holiday.js
const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    holidayName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ["Full-day", "Half-day"],
      default: "full-day",
    },
    recurring: {
      type: Boolean,
      default: false, // if true -> repeats every year (ex: Jan 26 Republic Day)
    },
    description: {
      type: String,
      trim: true,
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Holiday", holidaySchema);
