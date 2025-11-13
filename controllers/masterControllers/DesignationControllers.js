// controllers/designationController.js
const Designation = require("../../models/masterModels/Designation");

// Create Designation
exports.createDesignation = async (req, res) => {
  try {
    const { designationName, designationCode, description, departmentId } = req.body;

    const newDesignation = new Designation({
      designationName,
      designationCode,
      description,
      departmentId,
    });

    const savedDesignation = await newDesignation.save();
    res.status(201).json({
      message: "Designation created successfully",
      designation: savedDesignation,
    });
  } catch (error) {
    console.error("Error creating designation:", error);
    res.status(500).json({
      message: "Failed to create designation",
      error: error.message,
    });
  }
};

// Get all Designations (with department populated)
exports.getAllDesignations = async (req, res) => {
  try {
    const designations = await Designation.find()
      .populate("departmentId", "departmentName departmentCode") // only specific fields
      .sort({ createdAt: -1 });

    res.status(200).json(designations);
  } catch (error) {
    console.error("Error fetching designations:", error);
    res.status(500).json({
      message: "Failed to fetch designations",
      error: error.message,
    });
  }
};

// Get single Designation by ID
exports.getDesignationById = async (req, res) => {
  try {
    const {_id} = req.body
    const designation = await Designation.findById({_id:_id})

    if (!designation) {
      return res.status(404).json({ message: "Designation not found" });
    }

    res.status(200).json(designation);
  } catch (error) {
    console.error("Error fetching designation:", error);
    res.status(500).json({
      message: "Failed to fetch designation",
      error: error.message,
    });
  }
};

// Update Designation
exports.updateDesignation = async (req, res) => {
  try {
    const { _id, designationName, designationCode, description, departmentId, isActive } =
      req.body;

    const updatedDesignation = await Designation.findByIdAndUpdate(
      _id,
      { designationName, departmentId },
      { new: true, runValidators: true }
    );

    if (!updatedDesignation) {
      return res.status(404).json({ message: "Designation not found" });
    }

    res.status(200).json({
      message: "Designation updated successfully",
      designation: updatedDesignation,
    });
  } catch (error) {
    console.error("Error updating designation:", error);
    res.status(500).json({
      message: "Failed to update designation",
      error: error.message,
    });
  }
};

// Delete Designation
exports.deleteDesignation = async (req, res) => {
  try {
     const {_id} = req.body
    const designation = await Designation.findByIdAndDelete({_id:_id});

    if (!designation) {
      return res.status(404).json({ message: "Designation not found" });
    }

    res.status(200).json({ message: "Designation deleted successfully" });
  } catch (error) {
    console.error("Error deleting designation:", error);
    res.status(500).json({
      message: "Failed to delete designation",
      error: error.message,
    });
  }
};
