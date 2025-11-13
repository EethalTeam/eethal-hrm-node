const Unit = require("../../models/masterModels/Unit");

// Create Unit
exports.createUnit = async (req, res) => {
  try {
    const { UnitName, UnitCode, UnitType, UnitLocation, addressLine, geoLocation, description } = req.body;
if (!UnitCode) {
  return res.status(400).json({ message: "unitCode is required." });
}
    const existing = await Unit.findOne({ UnitCode });
    if (existing) {
      return res.status(400).json({ message: "Unit code already exists." });
    }

    const unit = new Unit({
      UnitName,
      UnitCode,
      UnitType,
      UnitLocation,
      addressLine,
      geoLocation,
      description,
    });

   const data =  await unit.save();
    res.status(201).json({ message: "Unit created successfully.", data });
  } catch (error) {
    res.status(500).json({ message: "Error creating unit", error });
  }
};

// Get All Units
exports.getAllUnits = async (req, res) => {
  try {
    const units = await Unit.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ message: "Error fetching units", error });
  }
};

// Get Unit By ID
exports.getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit || !unit.isActive) {
      return res.status(404).json({ message: "Unit not found" });
    }
    res.status(200).json(unit);
  } catch (error) {
    res.status(500).json({ message: "Error fetching unit", error });
  }
};

// Update Unit
exports.updateUnit = async (req, res) => {
  try {
    const { UnitName, UnitCode, UnitType, UnitLocation, addressLine, geoLocation, description } = req.body;

    const updated = await Unit.findByIdAndUpdate(
      req.body.id,
      { UnitName, UnitCode, UnitType, UnitLocation, addressLine, geoLocation, description },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Unit not found" });
    }

    res.status(200).json({ message: "Unit updated successfully", unit: updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating unit", error });
  }
};

// Soft Delete Unit
exports.deleteUnit = async (req, res) => {
  try {
    const deleted = await Unit.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({ message: "Unit not found" });
    }

    res.status(200).json({ message: "Unit deleted (soft) successfully", unit: deleted });
  } catch (error) {
    res.status(500).json({ message: "Error deleting unit", error });
  }
};
