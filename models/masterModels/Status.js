// models/Status.js
const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
  statusName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  statusCode: {
    type: String,
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
}, { timestamps: true });

module.exports = mongoose.model('Status', statusSchema);
