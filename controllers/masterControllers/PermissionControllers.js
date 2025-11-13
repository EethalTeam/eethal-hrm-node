// controllers/permissionRequestController.js
const PermissionRequest = require("../../models/masterModels/Permissions");
const RequestStatus = require("../../models/masterModels/RequestStatus")
const Notification = require("../../models/masterModels/Notifications");

// CREATE - Add new permission request
exports.createPermissionRequest = async (req, res) => {
  try {
    const {
      employeeId,
      employee,
      permissionDate,
      fromTime,
      toTime,
      totalHours,
      reason,
      requestedTo,
      isActive
    } = req.body;

    // Create the permission request
    const newRequest = new PermissionRequest({
      employeeId,
      permissionDate,
      fromTime,
      toTime,
      totalHours,
      reason,
      requestedTo,
      isActive
    });

    const savedRequest = await newRequest.save();

    // Create notification for the requestedTo employee
    const notification = new Notification({
      toEmployeeId: requestedTo,
      fromEmployeeId: employeeId,
      message: `New permission request from employee`,
       message: `New permission request from ${employee} for about ${totalHours} ${totalHours > 1 ? "hours" : "hour"} from ${fromTime}
      to ${toTime} for ${reason} on ${permissionDate}`,
      type: "permission-request",
      status: "unseen",
      meta: { permissionRequestId: savedRequest._id }
    });

    const savedNotification = await notification.save();

    // Emit live notification via socket
    const io = req.app.get("socketio"); // Get socket.io instance from app
    if (io) {
      io.to(requestedTo.toString()).emit("receiveNotification", savedNotification);
    }

    res.status(201).json({ success: true, data: savedRequest, notification: savedNotification });
  } catch (error) {
    console.error("Error creating permission request:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// READ - Get all permission requests
exports.getAllPermissionRequests = async (req, res) => {
  try {
        const {employeeId} = req.body
    let filter={}
    if(employeeId){
      filter.employeeId = employeeId
    }
    const requests = await PermissionRequest.find(filter)
      .populate("employeeId", "name email") // adjust fields as per Employee schema
      .populate("requestedTo", "name email")
      .populate("RequestStatusId", "StatusName");

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// READ - Get single permission request by ID
exports.getPermissionRequestById = async (req, res) => {
  try {
    const {_id}=req.body
    const request = await PermissionRequest.findById(_id)
      .populate("employeeId", "employeeName")
      .populate("requestedTo", "employeeName")
      .populate("RequestStatusId", "statusName");

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE - Update permission request
exports.updatePermissionRequest = async (req, res) => {
  try {
    const {
        _id,
      employeeId,
      permissionDate,
      fromTime,
      toTime,
      totalHours,
      reason,
      requestedTo,
      RequestStatusId,
      isActive
    } = req.body;

    const updatedRequest = await PermissionRequest.findByIdAndUpdate(
      _id,
      {
        employeeId,
        permissionDate,
        fromTime,
        toTime,
        totalHours,
        reason,
        requestedTo,
        RequestStatusId,
        isActive
      },
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.status(200).json({ success: true, data: updatedRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update request status by string (Pending, Approved, etc.)
exports.updatePermissionStatus = async (req, res) => {
  try {
    const { _id } = req.body; // PermissionRequest ID
    const { status } = req.body; // status string like "Pending" / "Approved"

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Find the RequestStatus by status name
    const statusDoc = await RequestStatus.findOne({ StatusName: status });
    if (!statusDoc) {
      return res.status(404).json({ message: `Invalid status: ${status}` });
    }

    // Update PermissionRequest with the found statusId
    const updatedRequest = await PermissionRequest.findByIdAndUpdate(
      _id,
      { RequestStatusId: statusDoc._id },
      { new: true }
    ).populate("employeeId requestedTo RequestStatusId");

    if (!updatedRequest) {
      return res.status(404).json({ message: "PermissionRequest not found" });
    }

    res.status(200).json({
      message: `Request status updated to ${status}`,
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};


// DELETE - Delete permission request
exports.deletePermissionRequest = async (req, res) => {
  try {
    const{_id}=req.body
    const deletedRequest = await PermissionRequest.findByIdAndDelete(_id);

    if (!deletedRequest) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.status(200).json({ success: true, message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
