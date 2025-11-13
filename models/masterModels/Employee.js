// models/Employee.js
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  code: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
    phoneNumber: {
    type: String
  },
  password: {
    type: String,
    required: true
  },
  birthDate: {
    type: Date,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department"   // master table
  },
  designationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Designation"  // master table
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role"         // master table
  },
  statusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Status"       // master table
  },
  workLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WorkLocation" // master table
  },
  joinDate: {
    type: Date,
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  avatar: {
    type: String, // URL or file path
    trim: true
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shift"
  },
  workingHours: {
    type: Number // e.g., 8
  },
  lastLoggedIn: {
    type: Date
  },
  isCurrentlyLoggedIn: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
