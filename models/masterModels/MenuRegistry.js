// models/Menu.js
const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    id: {
      type: String,
      required: true,
      unique: true, // e.g. "employees.all", "settings.roles"
      trim: true,
    },
    path: {
      type: String,
      required: true,
      trim: true, // e.g. "/employees", "/settings/roles"
    },
    icon: {
      type: String,
      trim: true, // e.g. "Users", "Calendar" → stored as string
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      default: null, // null = top-level menu, otherwise submenu
    },
    order: {
      type: Number,
      default: 0, // for sorting menus
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Menu", menuSchema);
