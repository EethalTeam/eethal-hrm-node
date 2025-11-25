const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    taskCode: {
      type: String,
      trim: true,
    },
    taskName: {
      type: String,
      required: true,
      trim: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    taskStatusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskStatus",
    },
    taskPriorityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskPriority",
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    feedback: {
      type: String,
      trim: true,
    },
    reqLeadCount: {
      type: String,
      trim: true,
    },
    compLeadCount: {
      type: String,
      trim: true,
    },
    progressDetails: [
      {
        type: String,
        trim: true,
      },
    ],
    reasonForPending: [
      {
        type: String,
        trim: true,
      },
    ],
    workLogs: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        startTime: {
          type: Date,
          required: true,
        },
        endTime: {
          type: Date
        },
        hoursWorked: {
          type: Number
        },
        logDescription: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);