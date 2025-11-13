// controllers/masterControllers/HolidayController.js
const Holiday = require("../../models/masterModels/HolidayMaster");

// ➕ Create Holiday
exports.createHoliday = async (req, res) => {
  try {
    const { holidayName, date, type, recurring, description, unitId, createdBy } = req.body;

    // Prevent duplicate holiday on same date for same unit
    const existingHoliday = await Holiday.findOne({ date });
    if (existingHoliday) {
      return res.status(400).json({ message: "Holiday already exists for this date" });
    }

    const holiday = await Holiday.create({
      holidayName,
      date,
      type,
      recurring:recurring || false,
      description:description || "",
      unitId:unitId || null,
      createdBy,
    });

    res.status(201).json({ message: "Holiday created successfully", holiday });
  } catch (error) {
    console.error("❌ Error creating holiday:", error.message);
    res.status(500).json({ message: "Failed to create holiday", error: error.message });
  }
};

// 📖 Get All Holidays (filter by unit if needed)
exports.getAllHolidays = async (req, res) => {
  try {
    const { unitId } = req.body;
    const filter = unitId ? { unitId } : {};

    const holidays = await Holiday.find({}).sort({ date: 1 });
    res.status(200).json(holidays);
  } catch (error) {
    console.error("❌ Error fetching holidays:", error.message);
    res.status(500).json({ message: "Failed to fetch holidays", error: error.message });
  }
};

// 📖 Get Holiday by ID
exports.getHolidayById = async (req, res) => {
  try {
    const {_id}=req.body
    const holiday = await Holiday.findById(_id);
    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }
    res.status(200).json(holiday);
  } catch (error) {
    console.error("❌ Error fetching holiday:", error.message);
    res.status(500).json({ message: "Failed to fetch holiday", error: error.message });
  }
};

// ✏️ Update Holiday
exports.updateHoliday = async (req, res) => {
  try {
    const { holidayName, date, type, recurring, description ,_id} = req.body;

    const holiday = await Holiday.findByIdAndUpdate(
      _id,
      { holidayName, date},
      { new: true, runValidators: true }
    );

    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    res.status(200).json({ message: "Holiday updated successfully", holiday });
  } catch (error) {
    console.error("❌ Error updating holiday:", error.message);
    res.status(500).json({ message: "Failed to update holiday", error: error.message });
  }
};

// 🗑️ Delete Holiday
exports.deleteHoliday = async (req, res) => {
  try {
    const {_id}=req.body
    const holiday = await Holiday.findByIdAndDelete(_id);
    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }
    res.status(200).json({ message: "Holiday deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting holiday:", error.message);
    res.status(500).json({ message: "Failed to delete holiday", error: error.message });
  }
};
