// models/EarningType.js
const mongoose = require('mongoose');

const earningSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Fixed', 'Percentage'], // Fixed amount or percentage
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  employeeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"
  }],
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Earning', earningSchema);
