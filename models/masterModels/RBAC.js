const mongoose = require('mongoose');

// Define the Role Schema
const RoleSchema = new mongoose.Schema(
  {
    RoleCode: {
      type: String
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

    // RBAC: Permissions per menu/module
    permissions: [
      {
        menuId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuRegistry",
          required: true
        },
        isAdd: {
          type: Boolean,
          default: false
        },
        isEdit: {
          type: Boolean,
          default: false
        },
        isView: {
          type: Boolean,
          default: false
        },
        isDelete: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Create the Role Model
const Role = mongoose.model('RoleBased', RoleSchema);

module.exports = Role;
