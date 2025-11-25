const Employee = require('../../models/masterModels/Employee');
const Department = require('../../models/masterModels/Department')
const Designation = require('../../models/masterModels/Designation')
const Shift = require('../../models/masterModels/Shift')
const WorkLocation = require('../../models/masterModels/WorkLocation')
const Role = require('../../models/masterModels/Role')
const Status = require('../../models/masterModels/Status')
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const defaultMenus = require('./defaultMenu.json')
const UserRights = require('../../models/masterModels/UserRights')
const MenuRegistry = require('../../models/masterModels/MenuRegistry')
const RoleBased = require("../../models/masterModels/RBAC")
const LeaveBalance = require("../../models/masterModels/LeaveBalance");
const {autoCheckoutOnDisconnect} = require("../masterControllers/AttendanceControllers")

// CREATE Employee + LeaveBalance
exports.createEmployee = async (req, res) => {
  const session = await Employee.startSession();
  session.startTransaction();

  try {
    const {
      code,
      name,
      email,
      password,
      designationId,
      departmentId,
      joinDate,
      birthDate,
      phoneNumber,
      salary,
      statusId,
      avatar,
      workingHours,
      workLocationId,
      roleId,
      shiftId,
      unitId // required for LeaveBalance
    } = req.body;

    // ✅ Step 1: Create Employee
    const employee = new Employee({
      code,
      name,
      email,
      password,
      designationId,
      departmentId,
      joinDate,
      birthDate,
      phoneNumber,
      salary,
      statusId,
      avatar,
      workingHours,
      workLocationId,
      roleId,
      shiftId
    });

    await employee.save({ session });

    // ✅ Step 2: Assign default leave balances using provided IDs
    const leaveBalances = [
      { leaveTypeId: "6925467ba48e61da37c0a220", totalAllocated: 12, remaining: 12 }, // Annual Leave
      { leaveTypeId: "69254608a48e61da37c0a1f5", totalAllocated: 10, remaining: 10 }, // Sick Leave
      { leaveTypeId: "692545eda48e61da37c0a1e8", totalAllocated: 12, remaining: 12 }  // Casual Leave
    ];

    // ✅ Step 3: Save LeaveBalance
    const newLeaveBalance = new LeaveBalance({
      employeeId: employee._id,
      unitId,
      leaveBalances
    });

    await newLeaveBalance.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Employee created successfully with leave balances",
      employee,
      leaveBalance: newLeaveBalance
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating employee with leave balance:", error);
    res.status(500).json({
      message: "Failed to create employee with leave balance",
      error: error.message
    });
  }
};

// GET ALL Employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.aggregate([
      // Department
      {
        $lookup: {
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          as: "department"
        }
      },
      { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },

      // Designation
      {
        $lookup: {
          from: "designations",
          localField: "designationId",
          foreignField: "_id",
          as: "designation"
        }
      },
      { $unwind: { path: "$designation", preserveNullAndEmptyArrays: true } },

      // Role
      {
        $lookup: {
          from: "roles",
          localField: "roleId",
          foreignField: "_id",
          as: "role"
        }
      },
      { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },

      // Status
      {
        $lookup: {
          from: "status",
          localField: "statusId",
          foreignField: "_id",
          as: "status"
        }
      },
      { $unwind: { path: "$status", preserveNullAndEmptyArrays: true } },

      // Work Location
      {
        $lookup: {
          from: "worklocations",
          localField: "workLocationId",
          foreignField: "_id",
          as: "workLocation"
        }
      },
      { $unwind: { path: "$workLocation", preserveNullAndEmptyArrays: true } },

      // Shift
      {
        $lookup: {
          from: "shifts",
          localField: "shiftId",
          foreignField: "_id",
          as: "shift"
        }
      },
      { $unwind: { path: "$shift", preserveNullAndEmptyArrays: true } },

      // Final projection (include IDs + names)
      {
        $project: {
          _id: 1,
          code:1,
          name: 1,
          email: 1,
          password:1,
          joinDate: 1,
          birthDate:1,
          phoneNumber:1,
          salary: 1,
          avatar: 1,
          workingHours: 1,
          lastLoggedIn: 1,
          isCurrentlyLoggedIn: 1,
          isActive: 1,

          departmentId: 1,
          departmentName: "$department.departmentName",

          designationId: 1,
          designationName: "$designation.designationName",

          roleId: 1,
          roleName: "$role.RoleName",

          statusId: 1,
          statusName: "$status.statusName",

          workLocationId: 1,
          workLocationName: "$workLocation.locationName",

          shiftId: 1,
          shiftName: "$shift.shiftName",
          shiftStartTime:"$shift.startTime",
          shiftEndTime:"$shift.endTime"
        }
      }
    ]);

    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET ALL Department
exports.getAllDepartments = async (req, res) => {
  try {
    const department = await Department.find();
    res.status(200).json(department);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get employees", error: error.message });
  }
};

// GET ALL Designation
exports.getAllDesignations = async (req, res) => {
  try {
    const designation = await Designation.find();
    res.status(200).json(designation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get employees", error: error.message });
  }
};

// GET ALL Shift
exports.getAllShifts = async (req, res) => {
  try {
    const shift = await Shift.find();
    res.status(200).json(shift);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get employees", error: error.message });
  }
};

// GET ALL WorkLocation
exports.getAllWorkLocations = async (req, res) => {
  try {
    const workLocation = await WorkLocation.find();
    res.status(200).json(workLocation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get employees", error: error.message });
  }
};

// GET ALL Role
exports.getAllRoles = async (req, res) => {
  try {
    const role = await RoleBased.find();
    res.status(200).json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get employees", error: error.message });
  }
};

// GET ALL Status
exports.getAllStatus = async (req, res) => {
  try {
    const status = await Status.find().limit(2);
    res.status(200).json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get employees", error: error.message });
  }
};

// GET Employee BY ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.body.id); // no populate

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get employee", error: error.message });
  }
};

// UPDATE Employee
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.body._id,
      req.body, // directly from req.body
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ message: "Employee updated successfully", employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update employee", error: error.message });
  }
};

// DELETE Employee
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.body.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete employee", error: error.message });
  }
};

// LOGIN Employee
exports.loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Reject if request is from mobile device
    const userAgent = req.headers["user-agent"] || "";
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    if (isMobile) {
      return res.status(403).json({ message: "Login from mobile devices is not allowed" });
    }

    // 2. Find employee by email
    const employee = await Employee.findOne({ email: email }).populate("roleId", "RoleName");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // 3. Check if employee is already logged in
    // if (employee.isCurrentlyLoggedIn) {
    //   return res.status(403).json({ message: "Employee is already logged in" });
    // }

    // 4. Compare plain password (since not hashing yet)
    if (employee.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // 5. Mark employee as logged in
    employee.isCurrentlyLoggedIn = true;
    await employee.save();

    // 6. Success
    res.status(200).json({
      message: "Login successful",
      employee: {
        _id: employee._id,
        employeeCode:employee.code?employee.code :'',
        name: employee.name,
        email: employee.email,
        role:employee.roleId.RoleName,
        isCurrentlyLoggedIn: employee.isCurrentlyLoggedIn
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

exports.logoutEmployee = async (req, res) => {
  try {
    const { email } = req.body; // or get from token/session if you’re using auth

    // 1. Find employee
    const employee = await Employee.findOne({ email: email });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // 2. Check if already logged out
    if (!employee.isCurrentlyLoggedIn) {
      return res.status(400).json({ message: "Employee is already logged out" });
    }

    // 3. Update login status
    employee.isCurrentlyLoggedIn = false;
    await employee.save();

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};

exports.logoutUser = async (employeeId) => {
  try {
    // Update lastActive or any other logout tracking if needed
    await Employee.findByIdAndUpdate(employeeId, { isCurrentlyLoggedIn: false });

  } catch (err) {
    console.error("❌ Error logging out user:", err.message);
  }
};

exports.cronJobLogOut = async (req, res) => {
  try {
    // Get all employees currently logged in
    const loggedInEmployees = await Employee.find({ isCurrentlyLoggedIn: true });

    if (loggedInEmployees.length === 0) {
      console.log("✅ No logged-in employees found at logout time.");
      return res.status(200).json({ message: "No logged-in employees found." });
    }

    // Iterate through each logged-in employee
    for (const employee of loggedInEmployees) {
      await autoCheckoutOnDisconnect(employee._id);

      employee.isCurrentlyLoggedIn = false;
      employee.lastLoggedIn = new Date();
      await employee.save();
    }

    console.log(`🕖 Cron job logout executed: ${loggedInEmployees.length} employees logged out.`);

    return res.status(200).json({
      message: `${loggedInEmployees.length} employees logged out and auto-checked out successfully.`,
    });
  } catch (error) {
    console.error("❌ Error during cron job logout:", error);
    return res.status(500).json({
      message: "Internal Server Error during cron job logout.",
      error: error.message,
    });
  }
};

exports.checkLogin = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"]; // userId passed from frontend
    if (!userId) {
      return res.status(401).json({ message: "User ID missing" });
    }

    const user = await Employee.findById(userId);

    if (!user || !user.isCurrentlyLoggedIn) {
      return res.status(401).json({ message: "User not logged in" });
    }

    // ✅ User is valid and logged in
    req.user = user;
    next();
  } catch (err) {
    console.error("checkLogin error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

