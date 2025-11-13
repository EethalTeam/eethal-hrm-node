// controllers/shiftController.js
const Shift = require("../../models/masterModels/Shift");

// CREATE Shift
exports.createShift = async (req, res) => {
  try {
    const shift = new Shift(req.body);
    await shift.save();
    res.status(201).json({ message: "Shift created successfully", shift });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create shift", error: error.message });
  }
};

// GET ALL Shifts
exports.getAllShifts = async (req, res) => {
  try {
    const shifts = await Shift.find()

    res.status(200).json(shifts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get shifts", error: error.message });
  }
};

// GET Shift BY ID
exports.getShiftById = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id)

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    res.status(200).json(shift);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get shift", error: error.message });
  }
};

// UPDATE Shift
exports.updateShift = async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    res.status(200).json({ message: "Shift updated successfully", shift });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update shift", error: error.message });
  }
};

// DELETE Shift
exports.deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    res.status(200).json({ message: "Shift deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete shift", error: error.message });
  }
};
