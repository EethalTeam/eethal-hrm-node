// controllers/departmentController.js
const Department = require("../../models/masterModels/Department");

// CREATE Department
exports.createDepartment = async (req, res) => {
  try {
    const {departmentName,departmentHead} = req.body
    let save={departmentName}
    if(departmentHead){
      save.departmentHead=departmentHead
    }
    const department = new Department(save);
    await department.save();
    res.status(201).json({ message: "Department created successfully", department });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create department", error: error.message });
  }
};

// GET ALL Departments
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate("departmentHead", "name email"); // populate only head's name and email
    res.status(200).json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get departments", error: error.message });
  }
};

// GET Department BY ID
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate("departmentHead", "name email");

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json(department);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get department", error: error.message });
  }
};

// UPDATE Department
exports.updateDepartment = async (req, res) => {
  try {
    const {_id,departmentHead,departmentName} = req.body
    const department = await Department.findByIdAndUpdate(
      _id,
      {departmentHead,departmentName},
      { new: true, runValidators: true }
    ).populate("departmentHead", "name email");

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({ message: "Department updated successfully", department });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update department", error: error.message });
  }
};

// DELETE Department
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete department", error: error.message });
  }
};
