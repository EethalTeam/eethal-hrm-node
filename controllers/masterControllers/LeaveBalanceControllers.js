// controllers/leaveBalanceController.js
const LeaveBalance = require("../../models/masterModels/LeaveBalance");

// ✅ Create LeaveBalance
exports.createLeaveBalance = async (req, res) => {
  try {
    const { employeeId, leaveBalances } = req.body;

    if (!employeeId || !leaveBalances) {
      return res.status(400).json({ message: "employeeId and leaveBalances are required" });
    }

    const newLeaveBalance = new LeaveBalance({
      employeeId,
      leaveBalances: leaveBalances.map(lb => ({
        leaveTypeId: lb.leaveTypeId,
        totalAllocated: lb.totalAllocated,
        remaining: lb.remaining || 0
      }))
    });

    const savedLeaveBalance = await newLeaveBalance.save();
    res.status(201).json({ message: "LeaveBalance created successfully", data: savedLeaveBalance });
  } catch (error) {
    console.error("Error creating LeaveBalance:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// ✅ Get all LeaveBalances
exports.getAllLeaveBalances = async (req, res) => {
  try {
    const leaveBalances = await LeaveBalance.find()
      .populate("employeeId leaveBalances.leaveTypeId");

    res.status(200).json(leaveBalances);
  } catch (error) {
    console.error("Error fetching LeaveBalances:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// ✅ Get LeaveBalance by ID
exports.getLeaveBalanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const leaveBalance = await LeaveBalance.findById(id)
      .populate("employeeId leaveBalances.leaveTypeId");

    if (!leaveBalance) {
      return res.status(404).json({ message: "LeaveBalance not found" });
    }

    res.status(200).json({ data: leaveBalance });
  } catch (error) {
    console.error("Error fetching LeaveBalance:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// ✅ Update LeaveBalance
exports.updateLeaveBalance = async (req, res) => {
  try {
    const { _id, employeeId, leaveBalances } = req.body;

    const updatedLeaveBalance = await LeaveBalance.findByIdAndUpdate(
      id,
      {
        ...(employeeId && { employeeId }),
        ...(leaveBalances && {
          leaveBalances: leaveBalances.map(lb => ({
            leaveTypeId: lb.leaveTypeId,
            totalAllocated: lb.totalAllocated,
            remaining: lb.remaining || 0
          }))
        })
      },
      { new: true }
    ).populate("employeeId leaveBalances.leaveTypeId");

    if (!updatedLeaveBalance) {
      return res.status(404).json({ message: "LeaveBalance not found" });
    }

    res.status(200).json({ message: "LeaveBalance updated successfully", data: updatedLeaveBalance });
  } catch (error) {
    console.error("Error updating LeaveBalance:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// ✅ Delete LeaveBalance
exports.deleteLeaveBalance = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedLeaveBalance = await LeaveBalance.findByIdAndDelete(id);
    if (!deletedLeaveBalance) {
      return res.status(404).json({ message: "LeaveBalance not found" });
    }

    res.status(200).json({ message: "LeaveBalance deleted successfully" });
  } catch (error) {
    console.error("Error deleting LeaveBalance:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
