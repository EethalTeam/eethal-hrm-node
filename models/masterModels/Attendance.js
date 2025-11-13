// models/Attendance.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    sessions: [
      {
        checkIn: { type: Date, required: true },
        checkOut: { type: Date },
        workedHours: { type: Number, default: 0 },

        // Multiple breaks inside this session
        breaks: [
          {
            breakStart: { type: Date, required: true },
            breakEnd: { type: Date },
            breakDuration: { type: Number, default: 0 }, // minutes/hours
          },
        ],
        totalBreakHours: { type: Number, default: 0 }, // total per session
      },
    ],
    totalWorkedHours: { type: Number, default: 0 }, // for the whole day
    totalBreakHours: { type: Number, default: 0 },  // for the whole day
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
