// controllers/userRightsController.js
const mongoose = require('mongoose');
const MenuRegistry = require("../../models/masterModels/MenuRegistry");
const UserRights = require('../../models/masterModels/UserRights');
const Employee = require("../../models/masterModels/Employee");

exports.createUserRights = async (req, res) => {
  try {
    const { employeeId, rights } = req.body;

    if (!employeeId || !rights || !Array.isArray(rights)) {
      return res.status(400).json({
        message: "employeeId and rights array are required."
      });
    }

    // Prepare documents
    const docs = rights.map(item => ({
      employeeId:new mongoose.Types.ObjectId(employeeId),
      menuId:new mongoose.Types.ObjectId(item.menuId),
      isEnable: item.isEnable ?? true,
      isView: item.isView ?? true,
      isEdit: item.isEdit ?? true,
      isAdd: item.isAdd ?? true,
      isDelete: item.isDelete ?? true
    }));

    await UserRights.insertMany(docs);

    res.status(200).json({
      message: "User rights created successfully."
    });
  } catch (error) {
    console.error("Create UserRights error:", error);
    res.status(500).json({ message: error.message });
  }
};
function buildMenuTree(flatList) {
  const map = new Map();
  const roots = [];

  flatList.forEach(item => {
    map.set(item.formId, { ...item, children: [] });
  });

  flatList.forEach(item => {
    if (item.parentFormId) {
      const parent = map.get(item.parentFormId);
      if (parent) {
        parent.children.push(map.get(item.formId));
      }
    } else {
      roots.push(map.get(item.formId));
    }
  });

  return roots;
}
exports.getUserRightsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        message: "employeeId is required"
      });
    }

    const employeeObjectId = new mongoose.Types.ObjectId(employeeId);

    // Fetch UserRights document
    const userRights = await UserRights.findOne({
      employeeId: employeeObjectId
    }).lean();

    if (!userRights || !userRights.menus || userRights.menus.length === 0) {
      return res.status(200).json({
        message: "No user rights found.",
        data: []
      });
    }

    // Step 1: Get all unique menuIds
    const allMenuIds = userRights.menus.map((m) =>
      new mongoose.Types.ObjectId(m.menuId)
    );

    // Step 2: Lookup sortOrder and other details from MenuRegistry
    const menuRegistryDocs = await MenuRegistry.find({
      _id: { $in: allMenuIds }
    })
      .select("_id formId title parentFormId sortOrder")
      .lean();

    const menuRegistryMap = new Map();
    menuRegistryDocs.forEach((menu) => {
      menuRegistryMap.set(menu._id.toString(), menu);
    });

    // Step 4: Assemble the menus with sortOrder etc.
    const enabledMenus = userRights.menus.filter(m => m.isEnable === true);

    const result = enabledMenus.map((menu) => {
      const registry = menuRegistryMap.get(menu.menuId?.toString()) || {};

      return {
        menuId: menu.menuId,
        formId: registry.formId || null,
        title: registry.title || "",
        parentFormId: registry.parentFormId || null,
        isView: menu.isView,
        isAdd: menu.isAdd,
        isEdit: menu.isEdit,
        isDelete: menu.isDelete,
        isNotification: menu.isNotification,
        sortOrder: registry.sortOrder || 0
      };
    });

    // Step 5: Sort by sortOrder
    result.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    // Step 6: Convert flat list to tree
    const menuTree = buildMenuTree(result);

    return res.status(200).json({
      message: "User rights fetched successfully.",
      data: menuTree
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message
    });
  }
};

exports.getAllUserRights = async (req, res) => {
  try {
    const allUserRights = await UserRights.find({})
      .populate("employeeId", "_id EmployeeName EmployeeCode employeeRole")
      .lean();

    // 🔑 Get all menus once
    const allMenus = await MenuRegistry.find({}, "_id formId parentFormId title").lean();

    const results = [];
    for (const userRight of allUserRights) {
      const employee = userRight.employeeId;

      // 1. Map existing rights into a dictionary for fast lookup
      const rightsMap = new Map(
        userRight.menus.map(m => [String(m.formId), m])
      );
      // 2. Merge all menus with rights
      const mergedMenus = allMenus.map(menu => {
        const rights = rightsMap.get(String(menu.formId));
        return {
          menuId: menu._id,
          formId: menu.formId,
          parentFormId: menu.parentFormId || null,
          title: menu.title,
          isEnable: rights ? rights.isEnable : false,
          isView: rights ? rights.isView : false,
          isAdd: rights ? rights.isAdd : false,
          isEdit: rights ? rights.isEdit : false,
          isDelete: rights ? rights.isDelete : false
        };
      });

      // 3. Build menu tree
      const menuTree = buildMenuTree(mergedMenus);

      results.push({
        _id: userRight._id,
        employeeId: employee._id,
        employeeName: employee.EmployeeName,
        employeeCode: employee.EmployeeCode,
        employeeRole: employee.employeeRole,
        menus: menuTree
      });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateUserRights = async (req, res) => {
  try {
    const { _id, employeeId, menus } = req.body;

    if (!employeeId || !menus || !Array.isArray(menus)) {
      return res.status(400).json({
        message: "employeeId and menus array are required."
      });
    }

    const employeeObjectId = new mongoose.Types.ObjectId(employeeId);

    // Build the updated data object
    const updatedData = {
      employeeId: employeeObjectId,
      menus: menus.map((menu) => ({
        menuId: menu.menuId
          ? new mongoose.Types.ObjectId(menu.menuId)
          : null,
        formId: menu.formId,
        parentFormId: menu.parentFormId || null,
        title: menu.title,
        isEnable: menu.isEnable ?? false,
        isView: menu.isView ?? false,
        isAdd: menu.isAdd ?? false,
        isEdit: menu.isEdit ?? false,
        isDelete: menu.isDelete ?? false,
        isNotification: menu.isNotification ?? false
      })),
    };

    let result;

    if (_id) {
      // Update by document _id
      result = await UserRights.findByIdAndUpdate(
        _id,
        updatedData,
        { new: true }
      );

      if (!result) {
        return res.status(404).json({
          message: "UserRights document not found.",
        });
      }
    } else {
      // Upsert by employeeId if _id is not provided
      result = await UserRights.findOneAndUpdate(
        { employeeId: employeeObjectId },
        updatedData,
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      message: "User rights updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Update UserRights error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUserRight = async (req, res) => {
  try {
    const { id } = req.body;

    const deleted = await UserRights.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "User right not found." });
    }

    res.status(200).json({
      message: "User right deleted successfully."
    });
  } catch (error) {
    console.error("Delete UserRights error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllMenus = async (req, res) => {
  try {
    const {  } = req.body;
    const menus = await MenuRegistry.find({
      isActive: true
    })
      .sort({ sortOrder: 1 })
      .lean();
    // Step 2 → Build a lookup map { formId → menu }
    const menuMap = {};
    for (const menu of menus) {
      menuMap[menu.formId] = menu;
    }

    // Step 3 → Add parentTitle to each menu
    menus.forEach(menu => {
      menu.parentTitle = menu.parentFormId
        ? menuMap[menu.parentFormId]?.title || null
        : null;
    });

    // Step 4 → Build tree hierarchy
    const tree = buildMenuResponseTree(menus);

    return res.status(200).json(tree);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching menus",
      error: error.message
    });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    
    const employees = await Employee.find({})

    res.status(200).json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching employees" });
  }
};

function buildMenuResponseTree(items, parentFormId = null) {
  return items
    .filter(item => item.parentFormId === parentFormId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => ({
      menuId: item.menuId,
      title: item.title,
      formId: item.formId,
      parentFormId: item.parentFormId,
      isEnable: item.isEnable,
      isAdd: item.isAdd,
      isEdit: item.isEdit,
      isView: item.isView,
      isDelete: item.isDelete,
      isNotification: item.isNotification,
      children: buildMenuResponseTree(items, item.formId)
    }));
}

