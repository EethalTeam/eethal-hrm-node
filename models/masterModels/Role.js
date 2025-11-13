const mongoose = require('mongoose');

// Define the Role Schema
const RoleSchema = new mongoose.Schema(
  {
    RoleCode: {
      type: String,
      trim: true
    },
    RoleName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    },
  },
  {
    timestamps: true
  }
);

// Create the Role Model
const Role = mongoose.model('Role', RoleSchema);

module.exports = Role;
