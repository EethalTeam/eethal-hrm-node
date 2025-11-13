// models/masterModels/Group.js
const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // (Optional but Recommended) For a group profile picture
    avatar: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    // (Recommended) To manage who can edit the group, add/remove members, etc.
    admins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    }],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
      }
    ],
    // (Recommended for Performance) A reference to the last message sent in this group.
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    type: {
      type: String,
      enum: ["team", "department", "project", "custom"],
      default: "custom",
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);