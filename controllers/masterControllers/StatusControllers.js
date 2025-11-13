// controllers/statusController.js
const Status = require("../../models/masterModels/Status");

// CREATE Status
exports.createStatus = async (req, res) => {
  try {
    const {statusName} = req.body
    const status = new Status({statusName:statusName});
    await status.save();
    res.status(201).json({ message: "Status created successfully", status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create status", error: error.message });
  }
};

// GET ALL Statuses
exports.getAllStatuses = async (req, res) => {
  try {
    const statuses = await Status.find();
    res.status(200).json(statuses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get statuses", error: error.message });
  }
};

// GET Status BY ID
exports.getStatusById = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);

    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    res.status(200).json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get status", error: error.message });
  }
};

// UPDATE Status
exports.updateStatus = async (req, res) => {
  try {
    const {_id,statusName}=req.body
    const status = await Status.findByIdAndUpdate(
      _id,
      {statusName:statusName},
      { new: true, runValidators: true }
    );

    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    res.status(200).json({ message: "Status updated successfully", status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
};

// DELETE Status
exports.deleteStatus = async (req, res) => {
  try {
    const status = await Status.findByIdAndDelete(req.params.id);

    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    res.status(200).json({ message: "Status deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete status", error: error.message });
  }
};
