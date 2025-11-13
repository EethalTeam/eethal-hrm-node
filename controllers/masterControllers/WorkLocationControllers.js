// controllers/workLocationController.js
const WorkLocation = require("../../models/masterModels/WorkLocation");

// CREATE WorkLocation
exports.createWorkLocation = async (req, res) => {
  try {
    const { locationName }=req.body
    const workLocation = new WorkLocation({locationName});
    await workLocation.save();
    res.status(201).json({ message: "Work location created successfully", workLocation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create work location", error: error.message });
  }
};

// GET ALL WorkLocations
exports.getAllWorkLocations = async (req, res) => {
  try {
    const workLocations = await WorkLocation.find();
    res.status(200).json(workLocations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get work locations", error: error.message });
  }
};

// GET WorkLocation BY ID
exports.getWorkLocationById = async (req, res) => {
  try {
    const workLocation = await WorkLocation.findById(req.body.id);

    if (!workLocation) {
      return res.status(404).json({ message: "Work location not found" });
    }

    res.status(200).json(workLocation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get work location", error: error.message });
  }
};

// UPDATE WorkLocation
exports.updateWorkLocation = async (req, res) => {
  try {
    const {_id,locationName}= req.body
    const workLocation = await WorkLocation.findByIdAndUpdate(
      _id,
     {locationName},
      { new: true, runValidators: true }
    );

    if (!workLocation) {
      return res.status(404).json({ message: "Work location not found" });
    }

    res.status(200).json({ message: "Work location updated successfully", workLocation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update work location", error: error.message });
  }
};

// DELETE WorkLocation
exports.deleteWorkLocation = async (req, res) => {
  try {
    const {_id}=req.body
    const workLocation = await WorkLocation.findByIdAndDelete({_id});

    if (!workLocation) {
      return res.status(404).json({ message: "Work location not found" });
    }

    res.status(200).json({ message: "Work location deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete work location", error: error.message });
  }
};
