// models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true, // Index for fast retrieval of a group's messages
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  // To support images, files, etc. in the future
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text',
  },
  // Advanced feature: Track who has read the message
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  }],
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);