// models/EmployeeSalary.js
const mongoose = require('mongoose');

const employeeSalarySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  salaryMonth: {
    type: String, // e.g., "2025-08" for August 2025
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  grossSalary: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  earnings: [
    {
      earningTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EarningType"
      },
      amount: {
        type: Number,
        required: true
      }
    }
  ],
  deductions: [
    {
      deductionTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeductionType"
      },
      amount: {
        type: Number,
        required: true
      }
    }
  ],
  status: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Pending'],
    default: 'Pending'
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paymentDate: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeSalary', employeeSalarySchema);
