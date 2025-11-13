// models/WorkLocation.js
const mongoose = require('mongoose');

const workLocationSchema = new mongoose.Schema({
  locationName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  locationCode: {
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

module.exports = mongoose.model('WorkLocation', workLocationSchema);
