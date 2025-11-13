// controllers/requestStatusController.js
const RequestStatus = require("../../models/masterModels/RequestStatus");

// CREATE RequestStatus
exports.createRequestStatus = async (req, res) => {
  try {
    const { StatusName } = req.body; // only take StatusName
    if (!StatusName) {
      return res.status(400).json({ message: "Status Name is required" });
    }

    const existing = await RequestStatus.findOne({ StatusName: StatusName.trim() });
    if (existing) {
      return res.status(400).json({ message: "Leave status with this name already exists" });
    }

    const requestStatus = new RequestStatus({ StatusName: StatusName.trim() });
    await requestStatus.save();

    res.status(201).json({
      message: "Request status created successfully",
      data: requestStatus,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL RequestStatuses
exports.getAllRequestStatus = async (req, res) => {
  try {
    const statuses = await RequestStatus.find().sort({ createdAt: -1 });
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ONE RequestStatus
exports.getRequestStatusById = async (req, res) => {
  try {
    const {_id}=req.body
    const status = await RequestStatus.findById(_id);
    if (!status) {
      return res.status(404).json({ message: "Leave status not found" });
    }
    res.status(200).json({ data: status });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE RequestStatus (only name)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { _id,StatusName } = req.body; // only take StatusName
    if (!StatusName) {
      return res.status(400).json({ message: "Status Name is required" });
    }

    const status = await RequestStatus.findById(_id);
    if (!status) {
      return res.status(404).json({ message: "Leave status not found" });
    }

    status.StatusName = StatusName.trim();
    await status.save();

    res.status(200).json({
      message: "Leave status updated successfully",
      data: status,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE RequestStatus
exports.deleteRequestStatus = async (req, res) => {
  try {
    const {_id}=req.body
    const status = await RequestStatus.findByIdAndDelete(_id);
    if (!status) {
      return res.status(404).json({ message: "Leave status not found" });
    }
    res.status(200).json({ message: "Leave status deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
