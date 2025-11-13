// controllers/leaveTypeController.js
const LeaveType = require("../../models/masterModels/LeaveType");

// CREATE LeaveType
exports.createLeaveType = async (req, res) => {
  try {
    const { LeaveTypeName } = req.body; // only take LeaveTypeName
    if (!LeaveTypeName) {
      return res.status(400).json({ message: "Name is required" });
    }

    const existing = await LeaveType.findOne({ LeaveTypeName: LeaveTypeName.trim() });
    if (existing) {
      return res.status(400).json({ message: "Leave type with this Leave Type already exists" });
    }

    const leaveType = new LeaveType({ LeaveTypeName: LeaveTypeName.trim() });
    await leaveType.save();

    res.status(201).json({
      message: "Leave type created successfully",
      data: leaveType,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL LeaveTypees
exports.getAllLeaveType = async (req, res) => {
  try {
    const statuses = await LeaveType.find().sort({ createdAt: -1 });
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ONE LeaveType
exports.getLeaveTypeById = async (req, res) => {
  try {
    const {_id}=req.body
    const status = await LeaveType.findById(_id);
    if (!status) {
      return res.status(404).json({ message: "Leave type not found" });
    }
    res.status(200).json({ data: status });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE LeaveType (only name)
exports.updateLeaveType = async (req, res) => {
  try {
    const { _id,LeaveTypeName } = req.body; // only take LeaveTypeName
    if (!LeaveType) {
      return res.status(400).json({ message: "Leave Type name is required" });
    }

    const status = await LeaveType.findById(_id);
    if (!status) {
      return res.status(404).json({ message: "Leave type not found" });
    }

    status.LeaveTypeName = LeaveTypeName.trim();
    await status.save();

    res.status(200).json({
      message: "Leave type updated successfully",
      data: status,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE LeaveType
exports.deleteLeaveType = async (req, res) => {
  try {
    const {_id}=req.body
    const status = await LeaveType.findByIdAndDelete(_id);
    if (!status) {
      return res.status(404).json({ message: "Leave type not found" });
    }
    res.status(200).json({ message: "Leave type deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
