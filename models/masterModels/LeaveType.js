const mongoose = require('mongoose');

const LeaveTypeSchema = new mongoose.Schema(
  {
    LeaveTypeCode: {
      type: String,
      trim: true
    },
    LeaveTypeName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const LeaveType = mongoose.model('LeaveType', LeaveTypeSchema);
module.exports = LeaveType;
