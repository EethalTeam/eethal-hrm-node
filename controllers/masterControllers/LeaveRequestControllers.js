// controllers/leaveRequestController.js
const LeaveRequest = require("../../models/masterModels/LeaveRequest");
const Notification = require('../../models/masterModels/Notifications')

exports.createLeaveRequest = async (req, res) => {
  try {
    const {
      employeeId,
      leaveTypeId,
      employee,
      leaveType,
      requestedToId,
      startDate,
      endDate,
      totalDays,
      reason
    } = req.body;

    if (!employeeId || !leaveTypeId || !requestedToId || !startDate || !endDate) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // 1️⃣ Save leave request
    const leaveRequest = new LeaveRequest({
      employeeId,
      leaveTypeId,
      requestedTo: requestedToId,
      startDate,
      endDate,
      totalDays,
      reason
    });

    const savedRequest = await leaveRequest.save();
    // 2️⃣ Create a notification for the approver
    const notification = await Notification.create({
      type: "leave-request",
      message: `New ${leaveType} request from ${employee} for about ${totalDays} ${totalDays > 1 ? "days" : "day"} from ${startDate}
      to ${endDate} for ${reason}`,
      fromEmployeeId: employeeId,
      toEmployeeId: requestedToId,
      status: "unseen",
      meta: {
        leaveRequestId: savedRequest._id
      }
    });
    // 3️⃣ Emit notification via Socket.IO
    const io = req.app.get("socketio");
    if (io && requestedToId) {
      io.to(requestedToId.toString()).emit("receiveNotification", notification);
    }

    res.status(201).json({
      message: "Leave request created successfully",
      data: savedRequest
    });

  } catch (error) {
    console.error("Error creating leave request:", error.message);
    res.status(500).json({ message: "Error creating leave request", error: error.message });
  }
};

// ✅ Get All Leave Requests
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const {employeeId} = req.body
    let filter={}
    if(employeeId){
      filter.employeeId = employeeId
    }
    const requests = await LeaveRequest.find(filter)
      .populate("employeeId", "name email")
      .populate("leaveTypeId", "LeaveTypeName")
      .populate("RequestStatusId", "StatusName")
      .populate("requestedTo", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leave requests", error: error.message });
  }
};

// ✅ Get Leave Request by ID
exports.getLeaveRequestById = async (req, res) => {
  try {
    const { _id } = req.body;

    const request = await LeaveRequest.findById(_id)
      .populate("employeeId", "employeeName employeeCode")
      .populate("leaveTypeId", "leaveTypeName")
      .populate("RequestStatusId", "statusName")
      .populate("requestedTo", "employeeName employeeCode");

    if (!request) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.status(200).json({ data: request });
  } catch (error) {
    res.status(500).json({ message: "Error fetching leave request", error: error.message });
  }
};

// ✅ Update Leave Request
exports.updateLeaveRequest = async (req, res) => {
  try {
    const { _id,
         employeeId,
      leaveTypeId,
      requestedToId,
      startDate,
      endDate,
      totalDays,
      reason} = req.body;

    const updatedRequest = await LeaveRequest.findByIdAndUpdate(
      _id,
      { $set: {employeeId,
      leaveTypeId,
      requestedTo:requestedToId,
      startDate,
      endDate,
      totalDays,
      reason} },
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.status(200).json({ message: "Leave request updated successfully", data: updatedRequest });
  } catch (error) {
    res.status(500).json({ message: "Error updating leave request", error: error.message });
  }
};

// ✅ Delete Leave Request (Soft delete using isActive)
exports.deleteLeaveRequest = async (req, res) => {
  try {
    const { _id } = req.body;

    const deletedRequest = await LeaveRequest.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.status(200).json({ message: "Leave request deactivated successfully", data: deletedRequest });
  } catch (error) {
    res.status(500).json({ message: "Error deleting leave request", error: error.message });
  }
};
