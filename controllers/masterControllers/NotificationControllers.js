const Notification = require("../../models/masterModels/Notifications");
const Group = require("../../models/masterModels/Group"); // Your group schema
const LeaveRequest = require("../../models/masterModels/LeaveRequest");
const PermissionRequest = require("../../models/masterModels/Permissions");
const Task = require('../../models/masterModels/Task')
const mongoose = require('mongoose');

// Create a notification
exports.createNotification = async (req, res) => {
  try {
    const { unitId, message, type, fromEmployeeId, toEmployeeId, groupId, meta } = req.body;

    if (!unitId || !message || !type || !fromEmployeeId) {
      return res.status(400).json({
        message: "unitId, message, type, and fromEmployeeId are required.",
      });
    }

    // Determine default status
    let status = "unseen";
    if (type === "chat-message" || type === "group-chat-message") status = "unseen";
    else if (type === "leave-request" || type === "permission-request") status = "unseen";
    else status = "seen"; // system announcements etc.

    const notification = new Notification({
      unitId,
      message,
      type,
      fromEmployeeId,
      toEmployeeId: toEmployeeId || null,
      groupId: groupId || null,
      status,
      meta: meta || {},
    });

    await notification.save();

    // Emit real-time notification via socket
    const io = req.app.get("socketio"); // access Socket.IO instance
    if (io) {
      if (toEmployeeId) {
        io.to(toEmployeeId.toString()).emit("receiveNotification", notification);
      } else if (groupId) {
        const group = await Group.findById(groupId).populate("members", "_id");
        group.members.forEach(member => {
          if (member._id.toString() !== fromEmployeeId.toString()) {
            io.to(member._id.toString()).emit("receiveNotification", notification);
          }
        });
      }
    }

    res.status(201).json({
      message: "Notification created successfully.",
      data: notification,
    });
  } catch (error) {
    console.error("Error saving notification:", error.message);
    res.status(500).json({
      message: "Failed to save notification.",
      error: error.message,
    });
  }
};

// Fetch notifications for an employee (direct + group)
exports.getNotificationsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ message: "employeeId is required." });
    }

    const notifications = await Notification.find({
      $or: [
        { toEmployeeId: employeeId },
        { type: "group-chat-message", "meta.groupMembers": employeeId },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Notifications fetched successfully.",
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    res.status(500).json({
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

// Mark a notification as seen
exports.markAsSeen = async (req, res) => {
  try {
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({ message: "notificationId is required." });
    }

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { status: "seen" },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    res.status(200).json({
      message: "Notification marked as seen.",
      data: notification,
    });
  } catch (error) {
    console.error("Error updating notification:", error.message);
    res.status(500).json({
      message: "Failed to update notification.",
      error: error.message,
    });
  }
};

exports.updateNotificationStatus = async (req, res) => {
  try {
    const { notificationId, action } = req.body;
    const io = req.app.get("socketio"); // ✅ get socket instance
    if (!notificationId || !action) {
      return res.status(400).json({ message: "notificationId and action are required." });
    }

    const STATUS = {
      approved: "68b6a2610c502941d03c6372",
      rejected: "68b6a2680c502941d03c6376",
      complete: "68b5a26d88e62ec178bb292b"
    };

    const newStatus = action === "approve" ? "approved" : "rejected";

    // ✅ Update notification status
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { status: newStatus },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    // ✅ If notification is for Leave Request
    if (notification.type === "leave-request" && notification.meta?.leaveRequestId) {
      await LeaveRequest.findByIdAndUpdate(
        notification.meta.leaveRequestId,
        { RequestStatusId: STATUS[newStatus] },
        { new: true }
      );
    }

    // ✅ If notification is for Permission Request
    if (notification.type === "permission-request" && notification.meta?.permissionRequestId) {
      await PermissionRequest.findByIdAndUpdate(
        notification.meta.permissionRequestId,
        { RequestStatusId: STATUS[newStatus] },
        { new: true }
      );
    }

        // ✅ If notification is for Permission Request
    if (notification.type === "task-complete" && notification.meta?.taskId) {
      await Task.findByIdAndUpdate(
        notification.meta.taskId,
        { taskStatusId: STATUS['complete'] },
        { new: true }
      );
    }

    const Newnotification = new Notification({
      message:`Your ${notification.type} has been ${newStatus}`,
      type: "general",
      fromEmployeeId:notification.toEmployeeId,
      toEmployeeId: notification.fromEmployeeId || null,
      groupId:null,
      status: "unseen",
      meta: {},
    });

    await Newnotification.save();
  io.to(notification.fromEmployeeId.toString()).emit("receiveNotification", Newnotification);
    res.status(200).json({
      message: `Notification and related request updated to ${newStatus}`,
      data: notification,
    });
  } catch (error) {
    console.error("Error updating notification:", error.message);
    res.status(500).json({
      message: "Failed to update notification.",
      error: error.message,
    });
  }
};

