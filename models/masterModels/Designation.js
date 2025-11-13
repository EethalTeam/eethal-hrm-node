// models/Designation.js
const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
  designationName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  designationCode: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",   // link to Department
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Designation', designationSchema);
