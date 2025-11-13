const mongoose = require("mongoose");

const LeaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    leaveBalances: [
      {
        leaveTypeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LeaveType",
          required: true
        },
        totalAllocated: {
          type: Number,
          required: true
        },
        remaining: {
          type: Number,
          default: 0
        }
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaveBalance", LeaveBalanceSchema);
