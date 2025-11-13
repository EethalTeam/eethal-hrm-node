// controllers/employeeController.js

const Employee = require('../../models/masterModels/Employee');
const Attendance = require('../../models/masterModels/Attendance'); // Make sure the path is correct
const Shift = require('../../models/masterModels/Shift');       // Make sure the path is correct
const mongoose = require('mongoose');
const PermissionRequest = require('../../models/masterModels/Permissions');
const LeaveRequest = require('../../models/masterModels/LeaveRequest');

const APPROVED_PERMISSION_STATUS_ID = new mongoose.Types.ObjectId("68b6a2610c502941d03c6372");

exports.getTodaysAbsentees = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Today at 12:00:00 AM

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999); // Today at 11:59:59 PM
    
    // 3. Find all employee IDs who are "excused" or "present"

    // Find employees on approved LEAVE today
    const onLeave = await LeaveRequest.find({
      RequestStatusId: APPROVED_PERMISSION_STATUS_ID,
      startDate: { $lte: todayEnd },
      endDate: { $gte: todayStart }
    }).select('employeeId');

    // Find employees on approved PERMISSION today
    const onPermission = await PermissionRequest.find({
      RequestStatusId: APPROVED_PERMISSION_STATUS_ID,
      permissionDate: { $gte: todayStart, $lt: todayEnd }
    }).select('employeeId');

    // Find employees who have LOGGED IN today (have an attendance record)
    const loggedIn = await Attendance.find({
      date: { $gte: todayStart, $lt: todayEnd }
    }).select('employeeId');

    // 4. Create a master list of all employee IDs to exclude
    const excludedIds = new Set([
        ...onLeave.map(l => l.employeeId.toString()),
        ...onPermission.map(p => p.employeeId.toString()),
        ...loggedIn.map(a => a.employeeId.toString())
    ]);

    // 5. Find all active employees who are NOT in the excluded list
    const absentEmployees = await Employee.find({
      _id: { $nin: [...excludedIds] },
      isActive: true // Only find currently active employees
    })
    .populate('departmentId') // Or 'department' - adjust to your schema
    .select('name employeeId '); // Select fields you want to show

    res.status(200).json({
      success: true,
      count: absentEmployees.length,
      absentees: absentEmployees
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getTodaysLeaveEmployees = async (req, res) => {
  try {
 
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); 

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999); 

    const leaves = await LeaveRequest.find({
      RequestStatusId: APPROVED_PERMISSION_STATUS_ID,
      startDate: { $lte: todayEnd },
      endDate: { $gte: todayStart }
    })
    .populate('employeeId', 'name') 
    .populate('leaveTypeId') 
    .sort({ 'employeeId.name': 1 }); 

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves: leaves
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
exports.getTodaysApprovedPermissions = async (req, res) => {

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    // 3. Find all permissions that are for today AND are approved
    const permissions = await PermissionRequest.find({
      permissionDate: {
        $gte: today,
        $lt: tomorrow
      },
      RequestStatusId: APPROVED_PERMISSION_STATUS_ID
    })
    .populate('employeeId', 'name') 
    .sort({ fromTime: 1 }); // Order them by time

    res.status(200).json({
      success: true,
      count: permissions.length,
      permissions: permissions
    });
};


const getStartOfDayISTAsUTC = (date = new Date()) => {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find(p => p.type === 'year').value);
  const month = parseInt(parts.find(p => p.type === 'month').value);
  const day = parseInt(parts.find(p => p.type === 'day').value);
  return new Date(Date.UTC(year, month - 1, day));
};

exports.getLateLoginsForToday = async (req, res) => {
  try {
    const today = getStartOfDayISTAsUTC(new Date());

    const lateAttendances = await Attendance.aggregate([
      { $addFields: { localDate: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Asia/Kolkata" } } } },
      { $match: { localDate: today.toISOString().split('T')[0] } },
      { $lookup: { from: 'employees', localField: 'employeeId', foreignField: '_id', as: 'employee' } },
      { $unwind: "$employee" },
      { $lookup: { from: 'shifts', localField: 'employee.shiftId', foreignField: '_id', as: 'shift' } },
      { $unwind: "$shift" },
      { $match: { "employee.isActive": true } },
      {
        $lookup: {
          from: 'permissionrequests',
          let: { empId: "$employeeId", pDate: "$date" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employeeId", "$$empId"] },
                    { $eq: ["$permissionDate", "$$pDate"] },
                    { $eq: ["$RequestStatusId", APPROVED_PERMISSION_STATUS_ID] }
                  ]
                }
              }
            }
          ],
          as: 'permissions'
        }
      }
    ]);
    
    const allLateEmployeeDetails = lateAttendances
      .filter(att => {
        if (!att.shift || !att.sessions || !att.sessions.length === 0) return false;
        const checkInTime = new Date(att.sessions[0].checkIn);
        const [shiftHour, shiftMinute] = att.shift.startTime.split(':').map(Number);
        const timeOptions = { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: false };
        const formatter = new Intl.DateTimeFormat('en-US', timeOptions);
        const parts = formatter.formatToParts(checkInTime);
        const checkInHourIST = parseInt(parts.find(p => p.type === 'hour').value);
        const checkInMinuteIST = parseInt(parts.find(p => p.type === 'minute').value);
        const isLate = checkInHourIST > shiftHour || (checkInHourIST === shiftHour && checkInMinuteIST > shiftMinute);

        if (!isLate) { return false; }
        
        const hasValidPermission = att.permissions.some(permission => {
            const [fromHour, fromMin] = permission.fromTime.split(':').map(Number);
            const [toHour, toMin] = permission.toTime.split(':').map(Number);
            const permissionFromTime = new Date(checkInTime);
            permissionFromTime.setHours(fromHour, fromMin, 0, 0);
            const permissionToTime = new Date(checkInTime);
            permissionToTime.setHours(toHour, toMin, 0, 0);
            return checkInTime >= permissionFromTime && checkInTime <= permissionToTime;
        });

        return isLate && !hasValidPermission;
      })
      .map(att => {
        const loginTimeDate = new Date(att.sessions[0].checkIn);
        return {
            _id: att.employee._id,
            name: att.employee.name,
            loginTime: loginTimeDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }),
            rawLoginTime: loginTimeDate,
            shiftStartTime: att.shift.startTime
        };
      });

    const uniqueLatestLogins = new Map();
    allLateEmployeeDetails.forEach(employee => {
        const existingEntry = uniqueLatestLogins.get(employee._id.toString());
        if (!existingEntry || employee.rawLoginTime > existingEntry.rawLoginTime) {
            uniqueLatestLogins.set(employee._id.toString(), employee);
        }
    });

    // ================== THIS SECTION IS UPDATED ==================
    const finalResult = Array.from(uniqueLatestLogins.values()).map(emp => {
      // 1. Get the date parts (YYYY-MM-DD) of the login in the correct IST timezone.
      // 'en-CA' locale reliably gives the YYYY-MM-DD format.
      const dateOptions = { timeZone: 'Asia/Kolkata' };
      const isoDateString = emp.rawLoginTime.toLocaleDateString('en-CA', dateOptions);

      // 2. Construct an ISO 8601 string for the shift start time *in IST*.
      const shiftStartTimeString = `${isoDateString}T${emp.shiftStartTime}:00.000+05:30`;
      
      // 3. Create a reliable Date object from this string. It now correctly represents 09:30 IST.
      const shiftStartDateTime = new Date(shiftStartTimeString);

      let lateByMins = 0;
      // 4. Compare the two universal timestamps. This is now an accurate comparison.
      if (emp.rawLoginTime.getTime() > shiftStartDateTime.getTime()) {
          const diffMs = emp.rawLoginTime.getTime() - shiftStartDateTime.getTime();
          lateByMins = Math.floor(diffMs / (1000 * 60));
      }

      // Format the duration string
      const hours = Math.floor(lateByMins / 60);
      const minutes = lateByMins % 60;
      let lateByFormatted = '';
      if (hours > 0) lateByFormatted += `${hours} hr `;
      if (minutes > 0 || lateByMins === 0) lateByFormatted += `${minutes} mins`;
      
      const { rawLoginTime, ...rest } = emp;
      return { ...rest, lateBy: lateByFormatted.trim() };
    });
    // ==========================================================

    res.status(200).json({
      success: true,
      count: finalResult.length,
      data: finalResult,
    });

  } catch (error) {
    console.error("Error fetching late logins:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};