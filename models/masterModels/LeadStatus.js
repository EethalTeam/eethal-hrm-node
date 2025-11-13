const mongoose = require('mongoose');

const LeadStatusSchema = new mongoose.Schema(
  {
    statusCode: {
      type: String,
      trim: true
    },
    statusName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const LeadStatus = mongoose.model('LeadStatus', LeadStatusSchema);
module.exports = LeadStatus;
