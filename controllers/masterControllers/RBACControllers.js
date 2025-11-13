const Role = require("../../models/masterModels/RBAC");
const MenuRegistry = require("../../models/masterModels/MenuRegistry");
const mongoose = require('mongoose');

exports.createRole = async (req, res) => {
  try {
    const { RoleName } = req.body;

    if (!RoleName || !RoleName.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "RoleName is required" 
      });
    }

    // Check if role name already exists
    const existingRole = await Role.findOne({ 
      RoleName: { $regex: new RegExp(`^${RoleName.trim()}$`, 'i') } 
    });
    
    if (existingRole) {
      return res.status(409).json({ 
        success: false, 
        message: "Role name already exists" 
      });
    }

    // Auto-generate RoleCode (ROLE001, ROLE002, etc.)
    const lastRole = await Role.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextRoleNumber = 1;
    
    if (lastRole && lastRole.RoleCode) {
      const lastNumber = parseInt(lastRole.RoleCode.replace('ROLE', ''));
      nextRoleNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
    }
    
    const RoleCode = `ROLE${String(nextRoleNumber).padStart(3, '0')}`;

    const role = new Role({
      RoleCode,
      RoleName: RoleName.trim(),
      permissions: []
    });

    await role.save();

    res.status(201).json({ 
      success: true, 
      message: "Role created successfully",
      data: role 
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create role",
      error: error.message 
    });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { _id, RoleName } = req.body;

    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid roleId is required" 
      });
    }

    if (!RoleName || !RoleName.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "RoleName is required" 
      });
    }

    // Check if role exists
    const existingRole = await Role.findById(_id);
    if (!existingRole) {
      return res.status(404).json({ 
        success: false, 
        message: "Role not found" 
      });
    }

    // Check if new role name already exists (excluding current role)
    const duplicateRole = await Role.findOne({ 
      RoleName: { $regex: new RegExp(`^${RoleName.trim()}$`, 'i') },
      _id: { $ne: _id }
    });
    
    if (duplicateRole) {
      return res.status(409).json({ 
        success: false, 
        message: "Role name already exists" 
      });
    }

    // Update only the RoleName
    const updatedRole = await Role.findByIdAndUpdate(
      _id,
      { RoleName: RoleName.trim() },
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      success: true, 
      message: "Role name updated successfully",
      data: updatedRole 
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update role",
      error: error.message 
    });
  }
};

exports.getAllMenus = async (req, res) => {
  try {
    const menus = await MenuRegistry.find()
      .select('_id label parentId id path sortOrder isActive')
      .sort({ sortOrder: 1, label: 1 })
      .lean();

    // Create a lookup map for parent titles
    const menuMap = {};
    for (const menu of menus) {
      menuMap[menu.formId] = menu.label;
    }

    // Enrich menus with parent title
    const enrichedMenus = menus.map(menu => ({
      ...menu,
      parentTitle: menu.parentId ? (menuMap[menu.parentId] || null) : null
    }));

    res.status(200).json({
      success: true,
      data: enrichedMenus,
      total: enrichedMenus.length
    });
  } catch (error) {
    console.error('Get all menus error:', error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching menus",
      error: error.message 
    });
  }
};

exports.updateMenusAndAccess = async (req, res) => {
  try {
    const { 
      _id, // roleId
      menus // Array of menu objects with permissions
    } = req.body;

    // Validate required fields
    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid roleId is required" 
      });
    }

    if (!Array.isArray(menus) || menus.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Menus array is required and cannot be empty" 
      });
    }

    // Validate each menu object
    for (let i = 0; i < menus.length; i++) {
      const menu = menus[i];
      if (!menu.menuId || !mongoose.Types.ObjectId.isValid(menu.menuId)) {
        return res.status(400).json({ 
          success: false, 
          message: `Valid menuId is required for menu at index ${i}` 
        });
      }
    }

    // Find the role
    const role = await Role.findById(_id);
    if (!role) {
      return res.status(404).json({ 
        success: false, 
        message: "Role not found" 
      });
    }

    // Extract menuIds and verify all menus exist
    const menuIds = menus.map(m => m.menuId);
    const existingMenus = await MenuRegistry.find({ _id: { $in: menuIds } });
    
    if (existingMenus.length !== menuIds.length) {
      const foundMenuIds = existingMenus.map(m => m._id.toString());
      const missingMenus = menuIds.filter(id => !foundMenuIds.includes(id));
      return res.status(404).json({ 
        success: false, 
        message: `Menu(s) not found: ${missingMenus.join(', ')}` 
      });
    }

    // 🔑 Remove permissions that are not in the new menus list
    role.permissions = role.permissions.filter(p => 
      menus.some(m => m.menuId.toString() === p.menuId.toString())
    );

    // Process each menu permission (update or add)
    for (const menuData of menus) {
      const { menuId, isAdd = false, isEdit = false, isView = false, isDelete = false } = menuData;
      
      const existingIndex = role.permissions.findIndex(p => p.menuId.toString() === menuId);
      
      if (existingIndex !== -1) {
        // Update existing permission
        role.permissions[existingIndex] = {
          ...role.permissions[existingIndex],
          menuId,
          isAdd,
          isEdit,
          isView,
          isDelete
        };
      } else {
        // Add new permission
        role.permissions.push({ menuId, isAdd, isEdit, isView, isDelete });
      }
    }

    // Save the role
    await role.save();

    // Return updated role with populated menu information
    const updatedRole = await Role.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(_id) } },
      {
        $lookup: {
          from: "menuregistries",
          localField: "permissions.menuId",
          foreignField: "_id",
          as: "menuData"
        }
      },
      {
        $addFields: {
          enrichedPermissions: {
            $map: {
              input: "$permissions",
              as: "perm",
              in: {
                $mergeObjects: [
                  "$$perm",
                  {
                    MenuName: {
                      $let: {
                        vars: {
                          matchedMenu: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$menuData",
                                  cond: { $eq: ["$$this._id", "$$perm.menuId"] }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: "$$matchedMenu.label"  // Changed from "title" to "label"
                      }
                    }
                  }
                ]
              }
            }
          }
        },
      },
      {
        $project: {
          _id: 1,
          RoleCode: 1,
          RoleName: 1,
          description: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          permissions: "$enrichedPermissions"
        }
      }
    ]);

    res.status(200).json({ 
      success: true, 
      message: `Menu permissions updated successfully for ${menus.length} menu(s)`,
      data: updatedRole[0] || role
    });
  } catch (error) {
    console.error('Update menus and access error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update menu permissions",
      error: error.message 
    });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid role id" 
      });
    }

    const role = await Role.findByIdAndDelete(_id);

    if (!role) {
      return res.status(404).json({ 
        success: false, 
        message: "Role not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Role deleted successfully",
      data: { 
        deletedRoleId: _id,
        deletedRoleName: role.RoleName,
        deletedRoleCode: role.RoleCode
      }
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete role",
      error: error.message 
    });
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.aggregate([
      {
        $lookup: {
          from: "menus", // 👈 correct collection name
          localField: "permissions.menuId",
          foreignField: "_id",
          as: "menuData"
        }
      },
      {
        $addFields: {
          enrichedPermissions: {
            $map: {
              input: "$permissions",
              as: "perm",
              in: {
                $mergeObjects: [
                  "$$perm",
                  {
                    menuDetails: {
                      $let: {
                        vars: {
                          matchedMenu: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$menuData",
                                  cond: { $eq: ["$$this._id", "$$perm.menuId"] }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: {
                          _id:"$$matchedMenu._id",
                          menuId: "$$matchedMenu.id",
                          label: "$$matchedMenu.label",
                          path: "$$matchedMenu.path",
                          icon: "$$matchedMenu.icon"
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          RoleCode: 1,
          RoleName: 1,
          description: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          permissions: "$enrichedPermissions",
          totalPermissions: { $size: "$permissions" }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: roles,
      total: roles.length
    });
  } catch (error) {
    console.error("Get all roles error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching roles",
      error: error.message
    });
  }
};

exports.getPermissionsByRoleAndPath = async (req, res) => {
  try {
    const { roleName, path } = req.body;

    // 1. Find the menu by path
    const menu = await MenuRegistry.findOne({ path }).lean();
    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu not found for given path" });
    }

    // 2. Find the role
    const role = await Role.findOne({ RoleName: roleName }).lean();
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    // 3. Match permission by menuId
    const permission = role.permissions.find(
      (perm) => perm.menuId.toString() === menu._id.toString()
    );

    if (!permission) {
      return res.status(404).json({ success: false, message: "No permission found for this menu" });
    }

    res.json({
      success: true,
      menu: {
        id: menu._id,
        path: menu.path,
        label: menu.label,
      },
      permissions: {
        isAdd: permission.isAdd,
        isEdit: permission.isEdit,
        isView: permission.isView,
        isDelete: permission.isDelete,
      },
    });
  } catch (err) {
    console.error("Error in getPermissionsByRoleAndPath:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching permissions",
      error: err.message,
    });
  }
};
