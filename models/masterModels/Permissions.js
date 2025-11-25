const mongoose = require('mongoose');

const PermissionRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    permissionDate: {
      type: Date,
      required: true,
    },
    fromTime: {
      type: String, 
      required: true,
    },
    toTime: {
      type: String,
      required: true,
    },
    totalHours: {
      type: Number, // system can calculate (toTime - fromTime)
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    requestedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    RequestStatusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RequestStatus",
      required: true,
      default: new mongoose.Types.ObjectId("692550a8a48e61da37c0a436") //pending
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const PermissionRequest = mongoose.model('PermissionRequest', PermissionRequestSchema);

module.exports = PermissionRequest;
