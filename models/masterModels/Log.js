const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  // User / Employee Info
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  employeeCode: String,
  employeeName: String,

  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  departmentName: String,

  role: String,

  // Unit Info
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
  customerID: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  unitName: String,

  // Product Hierarchy
  childProductId: { type: mongoose.Schema.Types.ObjectId, ref: "ChildProduct" },
  parentProductId: { type: mongoose.Schema.Types.ObjectId, ref: "ParentProduct" },
  mainParentId: { type: mongoose.Schema.Types.ObjectId, ref: "MainParentProduct" },

  // Order Info
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  orderCode:String,
  orderType: String,            // e.g. "Issue", "Return", etc.
  orderStatus: String,          // e.g. "Pending", "Completed"

  // Action Info
  action: String,               // e.g. "added", "reduced", "updated"

  module: String,               // e.g. "Product", "Asset"

  entityName: String,           // e.g. product name, asset name
  entityCode: String,           // e.g. product code, asset code

  changeField: String,          // e.g. "quantity"
  oldValue: mongoose.Schema.Types.Mixed,
  activityValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,

  description: String,
  ipAddress: String,
  userAgent: String,

  timestamp: { type: Date, default: Date.now },
  dateStr: String,
  monthStr: String,
  year: Number

}, { timestamps: true });

// Suggested indexes for performance
activityLogSchema.index({ employeeId: 1 });
activityLogSchema.index({ changeField: 1 });
activityLogSchema.index({ parentProductId: 1 });
activityLogSchema.index({ mainParentId: 1 });
activityLogSchema.index({ orderId: 1 });
activityLogSchema.index({ dateStr: 1 });
activityLogSchema.index({ monthStr: 1 });
activityLogSchema.index({ unitId: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ oldValue: 1 });
activityLogSchema.index({ activityValue: 1 });
activityLogSchema.index({ newValue: 1 });


module.exports = mongoose.model("ActivityLog", activityLogSchema);
