// controllers/taskPriorityController.js
const TaskPriority = require("../../models/masterModels/TaskPriority");

// CREATE TaskPriority
exports.createTaskPriority = async (req, res) => {
  try {
    const { name } = req.body; // only take name
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const existing = await TaskPriority.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "Task priority with this name already exists" });
    }

    const taskPriority = new TaskPriority({ name: name.trim() });
    await taskPriority.save();

    res.status(201).json({
      message: "Task priority created successfully",
      data: taskPriority,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL TaskPriorityes
exports.getAllTaskPriority = async (req, res) => {
  try {
    const priorities = await TaskPriority.find().sort({ createdAt: -1 });
    res.status(200).json(priorities);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ONE TaskPriority
exports.getTaskPriorityById = async (req, res) => {
  try {
    const {_id}=req.body
    const priority = await TaskPriority.findById(_id);
    if (!priority) {
      return res.status(404).json({ message: "Task priority not found" });
    }
    res.status(200).json({ data: priority });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE TaskPriority (only name)
exports.updateTaskPriority = async (req, res) => {
  try {
    const { _id,name } = req.body; // only take name
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const priority = await TaskPriority.findById(_id);
    if (!priority) {
      return res.status(404).json({ message: "Task priority not found" });
    }

    priority.name = name.trim();
    await priority.save();

    res.status(200).json({
      message: "Task priority updated successfully",
      data: priority,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE TaskPriority
exports.deleteTaskPriority = async (req, res) => {
  try {
    const {_id}=req.body
    const priority = await TaskPriority.findByIdAndDelete(_id);
    if (!priority) {
      return res.status(404).json({ message: "Task priority not found" });
    }
    res.status(200).json({ message: "Task priority deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
