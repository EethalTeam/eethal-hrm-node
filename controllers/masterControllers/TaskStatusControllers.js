// controllers/taskStatusController.js
const TaskStatus = require("../../models/masterModels/TaskStatus");

// CREATE TaskStatus
exports.createTaskStatus = async (req, res) => {
  try {
    const { name } = req.body; // only take name
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const existing = await TaskStatus.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "Task status with this name already exists" });
    }

    const taskStatus = new TaskStatus({ name: name.trim() });
    await taskStatus.save();

    res.status(201).json({
      message: "Task status created successfully",
      data: taskStatus,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL TaskStatuses
exports.getAllTaskStatus = async (req, res) => {
  try {
    const statuses = await TaskStatus.find().sort({ createdAt: -1 });
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ONE TaskStatus
exports.getTaskStatusById = async (req, res) => {
  try {
    const {_id}=req.body
    const status = await TaskStatus.findById(_id);
    if (!status) {
      return res.status(404).json({ message: "Task status not found" });
    }
    res.status(200).json({ data: status });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE TaskStatus (only name)
exports.updateTaskStatus = async (req, res) => {
  try {
    const { _id,name } = req.body; // only take name
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const status = await TaskStatus.findById(_id);
    if (!status) {
      return res.status(404).json({ message: "Task status not found" });
    }

    status.name = name.trim();
    await status.save();

    res.status(200).json({
      message: "Task status updated successfully",
      data: status,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE TaskStatus
exports.deleteTaskStatus = async (req, res) => {
  try {
    const {_id}=req.body
    const status = await TaskStatus.findByIdAndDelete(_id);
    if (!status) {
      return res.status(404).json({ message: "Task status not found" });
    }
    res.status(200).json({ message: "Task status deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
