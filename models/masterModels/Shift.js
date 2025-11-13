// models/Shift.js
const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  shiftName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  shiftCode: {
    type: String,
    trim: true
  },
  startTime: {
    type: String, // "HH:mm"
    required: true
  },
  endTime: {
    type: String, // "HH:mm"
    required: true
  },
  totalHours: {
    type: Number, // total hours of the shift
    required: true
  },
  hourlyRate: {
    type: Number, // hourly wage for the shift
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
