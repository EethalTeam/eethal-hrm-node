// controllers/attendanceController.js
const Attendance = require("../../models/masterModels/Attendance");
const Employee = require("../../models/masterModels/Employee");
const mongoose = require("mongoose");

// =================== THIS FUNCTION IS THE FIX ===================
/**
 * Creates a Date object representing the start of the day (00:00:00 UTC)
 * for the given date in the 'Asia/Kolkata' timezone.
 * @param {Date} date The date to convert. Defaults to now.
 * @returns {Date} A Date object set to midnight UTC for the corresponding IST day.
 */
const getStartOfDayISTAsUTC = (date = new Date()) => {
  // Use the standard Intl.DateTimeFormat API for robust timezone handling
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);

  const year = parseInt(parts.find(p => p.type === 'year').value);
  const month = parseInt(parts.find(p => p.type === 'month').value);
  const day = parseInt(parts.find(p => p.type === 'day').value);

  // Create a new Date object using UTC values.
  // The month for Date.UTC is 0-indexed, so we subtract 1.
  return new Date(Date.UTC(year, month - 1, day));
};
// ================================================================

// 🟢 Employee Check-In
exports.checkIn = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const now = new Date();
    
    // FIX: Use the new, correct helper function
    const today = getStartOfDayISTAsUTC(now);

    let attendance = await Attendance.findOne({ employeeId, date: today });

    if (!attendance) {
      // First session for the day
      attendance = new Attendance({
        employeeId,
        date: today,
        sessions: [{ checkIn: now }],
      });
    } else {
      const lastSession = attendance.sessions[attendance.sessions.length - 1];
      if (lastSession && !lastSession.checkOut) {
        return res.status(400).json({ message: "Already checked in. Please check out first." });
      }
      attendance.sessions.push({ checkIn: now });
    }

    await attendance.save();
    await Employee.findByIdAndUpdate(
      employeeId,
      { statusId: "68d115c6c8cbfdb2d70af549" }, // Assuming this is 'Online' status
      { new: true }
    );
    res.status(200).json({ message: "Checked in successfully", attendance });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ message: "Check-in failed", error: error.message });
  }
};

// 🔴 Employee Check-Out
exports.checkOut = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const now = new Date();
    
    // FIX: Use the new, correct helper function
    const today = getStartOfDayISTAsUTC(now);
    const attendance = await Attendance.findOne({ employeeId, date: today });

    if (!attendance) {
      return res.status(404).json({ message: "No attendance record found for today" });
    }

    const lastSession = attendance.sessions[attendance.sessions.length - 1];
    if (!lastSession || lastSession.checkOut) {
      return res.status(400).json({ message: "No active check-in found" });
    }

    // Calculate worked hours
    lastSession.checkOut = now;
    const workedMilliseconds = now - lastSession.checkIn;
    lastSession.workedHours = workedMilliseconds / (1000 * 60 * 60);

    // Recalculate totals
    attendance.totalWorkedHours = attendance.sessions.reduce(
      (sum, s) => sum + (s.workedHours || 0),
      0
    );

    await attendance.save();
    await Employee.findByIdAndUpdate(
      employeeId,
      { statusId: "68d115cec8cbfdb2d70af54e" }, // Assuming this is 'Offline' status
      { new: true }
    );
    res.status(200).json({ message: "Checked out successfully", attendance });
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ message: "Check-out failed", error: error.message });
  }
};

// Start Break
exports.startBreak = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const now = new Date();
    
    // FIX: Use the new, correct helper function
    const today = getStartOfDayISTAsUTC(now);
    let attendance = await Attendance.findOne({ employeeId, date: today });
    
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found for today" });
    }

    // ... (rest of the code is fine)
    const session = attendance.sessions[attendance.sessions.length - 1];
    if (!session || session.checkOut) {
        return res.status(400).json({ message: "No active session to start a break" });
    }

    const lastBreak = session.breaks[session.breaks.length - 1];
    if (lastBreak && !lastBreak.breakEnd) {
      return res.status(400).json({ message: "Already on a break. Please end it first." });
    }

    session.breaks.push({ breakStart: now });

    await attendance.save();
    await Employee.findByIdAndUpdate(
      employeeId,
      { statusId: "68d115e5c8cbfdb2d70af553" }, // Assuming 'On Break'
      { new: true }
    );
    res.json({
      success: true,
      message: "Break started",
      breakStart: now,
    });
  } catch (error) {
    res.status(500).json({ message: "Error starting break", error: error.message });
  }
};

// End Break
exports.endBreak = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const now = new Date();
    
    // FIX: Use the new, correct helper function
    const today = getStartOfDayISTAsUTC(now);
    let attendance = await Attendance.findOne({ employeeId, date: today });
    
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found for today" });
    }

    // ... (rest of the code is fine)
    const session = attendance.sessions[attendance.sessions.length - 1];
     if (!session || !session.breaks.length) {
      return res.status(400).json({ message: "No active break to end" });
    }

    const lastBreak = session.breaks[session.breaks.length - 1];
    if (lastBreak.breakEnd) {
      return res.status(400).json({ message: "This break already ended" });
    }

    lastBreak.breakEnd = now;
    const durationMs = now - lastBreak.breakStart;
    lastBreak.breakDuration = durationMs / (1000 * 60 * 60);

    session.totalBreakHours = session.breaks.reduce(
      (sum, b) => sum + (b.breakDuration || 0),
      0
    );

    attendance.totalBreakHours = attendance.sessions.reduce(
      (sum, s) => sum + (s.totalBreakHours || 0),
      0
    );

    await attendance.save();
    await Employee.findByIdAndUpdate(
      employeeId,
      { statusId: "68d115c6c8cbfdb2d70af549" }, // Back to 'Online'
      { new: true }
    );
    res.json({
      success: true,
      message: "Break ended",
      breakEnd: now,
    });
  } catch (error) {
    res.status(500).json({ message: "Error ending break", error: error.message });
  }
};

exports.autoCheckoutOnDisconnect = async (employeeId) => {
  try {
    if (!employeeId) return;

    const today = getStartOfDayISTAsUTC();
    const attendance = await Attendance.findOne({ employeeId, date: today });

    if (!attendance || !attendance.sessions.length) return;

    const lastSession = attendance.sessions[attendance.sessions.length - 1];

    if (lastSession && !lastSession.checkOut) {
      const checkOutTime = new Date();
      const elapsedMs = checkOutTime - new Date(lastSession.checkIn);
      const workedHours = elapsedMs / (1000 * 60 * 60);
      
      lastSession.checkOut = checkOutTime;
      lastSession.workedHours = workedHours;

      attendance.totalWorkedHours = attendance.sessions.reduce(
        (sum, s) => sum + (s.workedHours || 0),
        0
      );
      
      await attendance.save();
    }
  } catch (error) {
    console.error("❌ Auto checkout error:", error.message);
  }
};

// 📅 Get Attendance for a specific date
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { employeeId, date } = req.body;
    const queryDate = new Date(date);
    const dateOnly = getStartOfDayISTAsUTC(queryDate);

    const attendance = await Attendance.findOne({ employeeId, date: dateOnly });
    if (!attendance) {
      return res.status(404).json({ message: "No attendance found" });
    }

    res.status(200).json(attendance);
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ message: "Failed to get attendance", error: error.message });
  }
};

// 👤 Get all Attendance of an Employee
exports.getAttendanceByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const records = await Attendance.find({ employeeId }).sort({ date: -1 });
    res.status(200).json(records);
  } catch (error) {
    console.error("Get employee attendance error:", error);
    res.status(500).json({ message: "Failed to get employee attendance", error: error.message });
  }
};

// 📅 Get ALL attendance records for a specific date (MAIN FIX HERE)
exports.getAllAttendanceByDate = async (req, res) => {
  try {
    const { date, _id, role } = req.body;
    
    // Convert the input date to start of day in IST
    const inputDate = new Date(date);
    const queryDate = getStartOfDayISTAsUTC(inputDate);
    
    // Build query based on user role
    let query = { date: queryDate };
    
    if (role !== 'Super Admin' && role !== 'Admin') {
      // Add role-based filtering here if needed
    }

    const attendance = await Attendance.find(query)
      .populate('employeeId', 'name department employeeId status')
      .sort({ 'employeeId.name': 1 });

    // Ensure all records have calculated totals
    const processedAttendance = attendance.map(record => {
      const totalWorkedHours = record.totalWorkedHours ?? record.sessions.reduce((sum, s) => sum + (s.workedHours || 0), 0);
      const totalBreakHours = record.totalBreakHours ?? record.sessions.reduce((sum, s) => sum + (s.totalBreakHours || 0), 0);
      
      return {
        ...record.toObject(),
        totalWorkedHours,
        totalBreakHours,
      };
    });

    res.status(200).json({ 
      success: true,
      attendance: processedAttendance,
      message: processedAttendance.length > 0 ? "Attendance records found" : "No attendance records found for this date"
    });
  } catch (error) {
    console.error("Get all attendance by date error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get attendance records", 
      error: error.message 
    });
  }
};

// 📊 Get Employee's complete attendance history (FIXED)
exports.getEmployeeAttendanceHistory = async (req, res) => {
  try {
    const { employeeId, _id, role, startDate, endDate } = req.body;

    // Build date range query
    let dateQuery = {};
    if (startDate && endDate) {
      const start = getStartOfDayISTAsUTC(new Date(startDate));
      const end = getStartOfDayISTAsUTC(new Date(endDate));
      dateQuery = {
        date: { $gte: start, $lte: end }
      };
    } else {
      // Default to last 90 days
      const today = getStartOfDayISTAsUTC();
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      dateQuery = {
        date: { $gte: threeMonthsAgo, $lte: today }
      };
    }

    if (role !== 'Super Admin' && role !== 'Admin') {
      // Add role-based filtering if needed
    }

    const attendance = await Attendance.find({
      employeeId: employeeId,
      ...dateQuery
    })
    .populate('employeeId', 'name department employeeId')
    .sort({ date: -1 });

    // Ensure all records have calculated totals
    const processedAttendance = attendance.map(record => {
      const totalWorkedHours = record.totalWorkedHours ?? record.sessions.reduce((sum, s) => sum + (s.workedHours || 0), 0);
      const totalBreakHours = record.totalBreakHours ?? record.sessions.reduce((sum, s) => sum + (s.totalBreakHours || 0), 0);
      
      return {
        ...record.toObject(),
        totalWorkedHours,
        totalBreakHours,
      };
    });

    res.status(200).json({
      success: true,
      attendance: processedAttendance,
      message: processedAttendance.length > 0 ? "Attendance history found" : "No attendance history found"
    });
  } catch (error) {
    console.error("Get employee attendance history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get attendance history",
      error: error.message
    });
  }
};

// 📈 Get attendance summary/statistics for dashboard
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { date, _id, role } = req.body;
    const queryDate = getStartOfDayISTAsUTC(new Date(date));

    const attendance = await Attendance.find({ date: queryDate })
      .populate('employeeId', 'name department employeeId status');

    const totalEmployees = await Employee.countDocuments({ status: 'Active' });
    const presentEmployees = attendance.length;
    const absentEmployees = totalEmployees - presentEmployees;
    
    let activeEmployees = 0;
    let onBreakEmployees = 0;
    let totalWorkedHours = 0;
    let totalBreakHours = 0;

    attendance.forEach(record => {
      totalWorkedHours += record.totalWorkedHours || 0;
      totalBreakHours += record.totalBreakHours || 0;

      const hasActiveSession = record.sessions.some(session => !session.checkOut);
      if (hasActiveSession) activeEmployees++;

      const hasActiveBreak = record.sessions.some(session =>
        session.breaks && session.breaks.some(breakItem => !breakItem.breakEnd)
      );
      if (hasActiveBreak) onBreakEmployees++;
    });

    const summary = {
      totalEmployees,
      presentEmployees,
      absentEmployees,
      activeEmployees,
      onBreakEmployees,
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
      totalBreakHours: Math.round(totalBreakHours * 100) / 100,
      averageWorkedHours: presentEmployees > 0 ? Math.round((totalWorkedHours / presentEmployees) * 100) / 100 : 0
    };

    res.status(200).json({
      success: true,
      summary,
      message: "Attendance summary calculated successfully"
    });
  } catch (error) {
    console.error("Get attendance summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get attendance summary",
      error: error.message
    });
  }
};

// 🔍 Search employees with attendance status for a date
exports.searchEmployeesWithAttendance = async (req, res) => {
  try {
    const { date, searchTerm, _id, role } = req.body;
    const queryDate = getStartOfDayISTAsUTC(new Date(date));

    let employeeQuery = {};
    if (searchTerm) {
      employeeQuery = {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { department: { $regex: searchTerm, $options: 'i' } },
          { employeeId: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      };
    }

    if (role !== 'Super Admin' && role !== 'Admin') {
      // Add role-based filtering here if needed
    }

    const employees = await Employee.find(employeeQuery).select('name department employeeId email status');
    const employeeIds = employees.map(emp => emp._id);
    const attendance = await Attendance.find({
      employeeId: { $in: employeeIds },
      date: queryDate
    }).populate('employeeId', 'name department employeeId');

    const employeesWithAttendance = employees.map(employee => {
      const attendanceRecord = attendance.find(att => 
        att.employeeId._id.toString() === employee._id.toString()
      );
      
      return {
        ...employee.toObject(),
        attendance: attendanceRecord || null,
        status: attendanceRecord ? 'Present' : 'Absent'
      };
    });

    res.status(200).json({
      success: true,
      employees: employeesWithAttendance,
      message: `Found ${employeesWithAttendance.length} employees`
    });
  } catch (error) {
    console.error("Search employees with attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search employees",
      error: error.message
    });
  }
};

// 📋 Get attendance report for date range
exports.getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, department, _id, role } = req.body;

    let dateQuery = {};
    if (startDate && endDate) {
      const start = getStartOfDayISTAsUTC(new Date(startDate));
      const end = getStartOfDayISTAsUTC(new Date(endDate));
      dateQuery = {
        date: { $gte: start, $lte: end }
      };
    } else {
      // Default to current month
      const now = getStartOfDayISTAsUTC();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateQuery = {
        date: { $gte: startOfMonth, $lte: endOfMonth }
      };
    }

    let attendanceQuery = { ...dateQuery };
    if (employeeId) {
      attendanceQuery.employeeId = employeeId;
    }

    let attendance = await Attendance.find(attendanceQuery)
      .populate('employeeId', 'name department employeeId email')
      .sort({ date: -1, 'employeeId.name': 1 });

    if (department) {
      attendance = attendance.filter(record => 
        record.employeeId.department === department
      );
    }

    if (role !== 'Super Admin' && role !== 'Admin') {
      // Add role-based filtering logic here
    }

    const totalRecords = attendance.length;
    const totalWorkedHours = attendance.reduce((sum, record) => sum + (record.totalWorkedHours || 0), 0);
    const totalBreakHours = attendance.reduce((sum, record) => sum + (record.totalBreakHours || 0), 0);
    const averageWorkedHours = totalRecords > 0 ? totalWorkedHours / totalRecords : 0;

    // Group by employee for summary
    const employeeSummary = {};
    attendance.forEach(record => {
      const empId = record.employeeId._id.toString();
      if (!employeeSummary[empId]) {
        employeeSummary[empId] = {
          employee: record.employeeId,
          totalDays: 0,
          totalWorkedHours: 0,
          totalBreakHours: 0,
          averageWorkedHours: 0
        };
      }
      employeeSummary[empId].totalDays++;
      employeeSummary[empId].totalWorkedHours += record.totalWorkedHours || 0;
      employeeSummary[empId].totalBreakHours += record.totalBreakHours || 0;
    });

    Object.keys(employeeSummary).forEach(empId => {
      const summary = employeeSummary[empId];
      summary.averageWorkedHours = summary.totalDays > 0 ? summary.totalWorkedHours / summary.totalDays : 0;
    });

    res.status(200).json({
      success: true,
      attendance,
      summary: {
        totalRecords,
        totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
        totalBreakHours: Math.round(totalBreakHours * 100) / 100,
        averageWorkedHours: Math.round(averageWorkedHours * 100) / 100
      },
      employeeSummary: Object.values(employeeSummary),
      message: `Found ${totalRecords} attendance records`
    });
  } catch (error) {
    console.error("Get attendance report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get attendance report",
      error: error.message
    });
  }
};