const mongoose = require('mongoose');

const RequestStatusSchema = new mongoose.Schema(
  {
    StatusCode: {
      type: String,
      trim: true
    },
    StatusName: {
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

const RequestStatus = mongoose.model('RequestStatus', RequestStatusSchema);
module.exports = RequestStatus;
