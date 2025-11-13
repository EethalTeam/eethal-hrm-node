// controllers/leadStatusController.js
const LeadStatus = require('../../models/masterModels/LeadStatus');
const mongoose = require('mongoose');

// Create a new Lead Status
exports.createLeadStatus = async (req, res) => {
  try {
    const {statusName} = req.body
    const leadStatus = new LeadStatus({statusName:statusName});
    await leadStatus.save();
    res.status(201).json({ message: 'Lead Status created successfully', leadStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create Lead Status', error: error.message });
  }
};

// Get all Lead Statuses (optionally filter by isActive)
exports.getAllLeadStatus = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const leadStatuses = await LeadStatus.find(filter);
    res.status(200).json(leadStatuses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch Lead Statuses', error: error.message });
  }
};

// Get a single Lead Status by ID
exports.getLeadStatusById = async (req, res) => {
  try {
    const { _id } = req.body;
    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(400).json({ message: 'Invalid ID' });

    const leadStatus = await LeadStatus.findById(id);
    if (!leadStatus) return res.status(404).json({ message: 'Lead Status not found' });

    res.status(200).json({ leadStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch Lead Status', error: error.message });
  }
};

// Update a Lead Status by ID
exports.updateLeadStatus = async (req, res) => {
  try {
    const { _id } = req.body;
    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(400).json({ message: 'Invalid ID' });

    const updatedLeadStatus = await LeadStatus.findByIdAndUpdate(_id, req.body, { new: true });
    if (!updatedLeadStatus) return res.status(404).json({ message: 'Lead Status not found' });

    res.status(200).json({ message: 'Lead Status updated successfully', leadStatus: updatedLeadStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update Lead Status', error: error.message });
  }
};

// Delete a Lead Status (soft delete)
exports.deleteLeadStatus = async (req, res) => {
  try {
    const { _id } = req.body;
    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(400).json({ message: 'Invalid ID' });

    const leadStatus = await LeadStatus.findById(id);
    if (!leadStatus) return res.status(404).json({ message: 'Lead Status not found' });

    // Soft delete
    leadStatus.isActive = false;
    await leadStatus.save();

    res.status(200).json({ message: 'Lead Status deleted successfully (soft delete)', leadStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete Lead Status', error: error.message });
  }
};
