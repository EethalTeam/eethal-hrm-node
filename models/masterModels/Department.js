// models/Department.js
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  departmentName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  departmentCode: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  departmentHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"   // link to employee as head of department
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
