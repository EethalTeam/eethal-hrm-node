// models/masterModels/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    fromEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    toEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      // For group messages, this can be null
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "leave-request",
        "permission-request",
        "general",
        "chat-message",
        "group-chat-message",
        "announcement",
        "task-assignment",
        "task-complete",
        "holiday-notice",
        "system-alert",
        "other"
      ],
      default: "general",
    },
    status: {
      type: String,
      enum: ["unseen", "seen","approved","rejected"],
      default: "unseen",
    },
    meta: {
      leaveRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "Leave" },
      permissionRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "Permission" },
      taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
