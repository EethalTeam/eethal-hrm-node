const Menu = require("../../models/masterModels/MenuRegistry");
const UserRights = require("../../models/masterModels/UserRights");
const Employee = require("../../models/masterModels/Employee");

exports.createMenu = async (req, res) => {
  try {
    const { label, id, path, icon, parentId, order, isActive } = req.body;

    // Step 1: Create menu
    const menu = new Menu({
      label,
      id,
      path,
      icon,
      parentId: parentId || null,
      order,
      isActive
    });

    await menu.save();

    // Step 2: Create default permission entry
    const newMenuEntry = {
      menuId: menu._id,
      title: menu.label,
      isEnable: false,
      isView: false,
      isAdd: false,
      isEdit: false,
      isDelete: false,
      isNotification: false
    };

    // Step 3: Push into every UserRights doc
    await UserRights.updateMany(
      {},
      { $push: { menus: newMenuEntry } }
    );

    res.status(201).json({
      success: true,
      message: "Menu created successfully",
      data: menu
    });
  } catch (error) {
    console.error("❌ createMenu error:", error);
    res.status(500).json({ success: false, message: "Error creating menu" });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const { _id, label, id, path, icon, parentId, order, isActive } = req.body;

    const updatedMenu = await Menu.findByIdAndUpdate(
      _id,
      { label, id, path, icon, parentId, order, isActive },
      { new: true }
    );

    if (!updatedMenu) {
      return res.status(404).json({ success: false, message: "Menu not found" });
    }

    // Also update title in UserRights
    await UserRights.updateMany(
      { "menus.menuId": updatedMenu._id },
      { $set: { "menus.$.title": updatedMenu.label } }
    );

    res.status(200).json({
      success: true,
      message: "Menu updated successfully",
      data: updatedMenu
    });
  } catch (error) {
    console.error("❌ updateMenu error:", error);
    res.status(500).json({ success: false, message: "Error updating menu" });
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    const { _id } = req.body;

    const deletedMenu = await Menu.findByIdAndDelete(_id);
    if (!deletedMenu) {
      return res.status(404).json({ success: false, message: "Menu not found" });
    }

    // Remove menu from all UserRights
    await UserRights.updateMany(
      {},
      { $pull: { menus: { menuId: deletedMenu._id } } }
    );

    res.status(200).json({
      success: true,
      message: "Menu deleted successfully"
    });
  } catch (error) {
    console.error("❌ deleteMenu error:", error);
    res.status(500).json({ success: false, message: "Error deleting menu" });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().populate("department", "name");

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("❌ getAllEmployees error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAllParentsMenu = async (req, res) => {
  try {
    const parents = await Menu.find({ parentId: null, isActive: true })
      .sort({ order: 1 })
      .select("_id label id path order"); // send only useful fields

    return res.status(200).json({
      success: true,
      message: "Parent menus fetched successfully",
      data: parents,
    });
  } catch (error) {
    console.error("❌ getAllParentsMenu error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAllMenus = async (req, res) => {
  try {
    const menus = await Menu.find().populate("parentId", "label").sort({ order: 1 }).lean();

    // Build a map { _id → label } to resolve parent names
    const menuMap = {};
    menus.forEach(menu => {
      menuMap[menu._id] = menu.label;
    });

    // Enrich with parentTitle
    const enrichedMenus = menus.map(menu =>({
      ...menu,
      parentTitle: menu.parentId ? menuMap[menu.parentId._id] || null : null
    }));

    res.status(200).json({
      success: true,
      message: "Menus fetched successfully",
      data: enrichedMenus
    });
  } catch (error) {
    console.error("❌ getAllMenus error:", error);
    res.status(500).json({ success: false, message: "Error fetching menus" });
  }
};

exports.getFormattedMenu = async (req, res) => {
  try {
    // 1. Fetch all active menus, sorted by order
    const menus = await Menu.find({ isActive: true }).sort({ order: 1 }).lean();

    // 2. Build lookup map for quick access
    const menuMap = {};
    menus.forEach(menu => {
      menuMap[menu._id.toString()] = {
        id: menu.id,
        label: menu.label,
        path: menu.path,
        icon: menu.icon || null, // will be resolved in frontend
        subItems: []
      };
    });

    // 3. Create hierarchy
    const formattedMenus = [];
    menus.forEach(menu => {
      if (menu.parentId) {
        // push into parent
        if (menuMap[menu.parentId.toString()]) {
          menuMap[menu.parentId.toString()].subItems.push(menuMap[menu._id.toString()]);
        }
      } else {
        // top-level menu
        formattedMenus.push(menuMap[menu._id.toString()]);
      }
    });

    return res.status(200).json({
      success: true,
      data: formattedMenus,
      total: formattedMenus.length
    });

  } catch (error) {
    console.error("Get formatted menu error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching menus",
      error: error.message
    });
  }
};

