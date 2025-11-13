// controllers/projectStatusController.js
const ProjectStatus = require("../../models/masterModels/ProjectStatus");

// CREATE ProjectStatus
exports.createProjectStatus = async (req, res) => {
  try {
    const { name } = req.body; // only take name
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const existing = await ProjectStatus.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "Project status with this name already exists" });
    }

    const projectStatus = new ProjectStatus({ name: name.trim() });
    await projectStatus.save();

    res.status(201).json({
      message: "Project status created successfully",
      data: projectStatus,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL ProjectStatuses
exports.getAllProjectStatus = async (req, res) => {
  try {
    const statuses = await ProjectStatus.find().sort({ createdAt: -1 });
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ONE ProjectStatus
exports.getProjectStatusById = async (req, res) => {
  try {
    const {_id}=req.body
    const status = await ProjectStatus.findById(_id);
    if (!status) {
      return res.status(404).json({ message: "Project status not found" });
    }
    res.status(200).json({ data: status });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE ProjectStatus (only name)
exports.updateProjectStatus = async (req, res) => {
  try {
    const { _id,name } = req.body; // only take name
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const status = await ProjectStatus.findById(_id);
    if (!status) {
      return res.status(404).json({ message: "Project status not found" });
    }

    status.name = name.trim();
    await status.save();

    res.status(200).json({
      message: "Project status updated successfully",
      data: status,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE ProjectStatus
exports.deleteProjectStatus = async (req, res) => {
  try {
    const {_id}=req.body
    const status = await ProjectStatus.findByIdAndDelete(_id);
    if (!status) {
      return res.status(404).json({ message: "Project status not found" });
    }
    res.status(200).json({ message: "Project status deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
