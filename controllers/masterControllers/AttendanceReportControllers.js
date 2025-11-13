// controllers/attendanceController.js
const Attendance = require("../../models/masterModels/Attendance");
const Employee = require("../../models/masterModels/Employee");
const mongoose = require("mongoose");

// ... (your existing checkIn, checkOut, and other controllers)

/**
 * @desc    Generate a monthly attendance report for all employees
 * @route   POST /api/attendance/report
 * @body    { year: 2025, month: 10 }
 * @access  Private/Admin
 */
exports.getMonthlyReport = async (req, res) => {
    try {
        const { year, month } = req.body;

        // 1. Input Validation
        if (!year || !month) {
            return res.status(400).json({ success: false, message: "Year and month are required." });
        }

        // 2. Date Range Calculation (using UTC for consistency)
        // Note: The month in the Date constructor is 0-indexed (0=Jan, 1=Feb, etc.)
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 1)); // The start of the next month

        // 3. MongoDB Aggregation Pipeline
        const report = await Attendance.aggregate([
            // Stage 1: Match documents within the specified month and year
            {
                $match: {
                    date: {
                        $gte: startDate,
                        $lt: endDate,
                    },
                },
            },
            // Stage 2: Group by employee to calculate monthly totals
            {
                $group: {
                    _id: "$employeeId",
                    totalWorkingDays: { $sum: 1 },
                    totalHoursWorked: { $sum: "$totalWorkedHours" },
                    totalBreakHours: { $sum: "$totalBreakHours" },
                },
            },
            // Stage 3: Lookup employee details (name, etc.) from the Employees collection
            {
                $lookup: {
                    from: "employees", // The actual collection name for your Employee model
                    localField: "_id",
                    foreignField: "_id",
                    as: "employeeDetails",
                },
            },
            // Stage 4: Deconstruct the employeeDetails array
            {
                $unwind: "$employeeDetails",
            },
            // Stage 5: Project to shape the final output
            {
                $project: {
                    _id: 0, // Exclude the default _id field
                    employeeId: "$_id",
                    employeeName: "$employeeDetails.name",
                    employeeCode: "$employeeDetails.code", // Optional: include employee code
                    totalWorkingDays: 1,
                    totalHoursWorked: { $round: ["$totalHoursWorked", 2] },
                    totalBreakHours: { $round: ["$totalBreakHours", 2] },
                },
            },
             // Stage 6: Sort by employee name
            {
                $sort: {
                    employeeName: 1
                }
            }
        ]);

        // 4. Calculate Average Hours in JavaScript
        const finalReport = report.map(item => ({
            ...item,
            averageHoursPerDay: item.totalWorkingDays > 0 
                ? (item.totalHoursWorked / item.totalWorkingDays).toFixed(2) 
                : 0,
        }));

        res.status(200).json({
            success: true,
            message: `Attendance report for ${startDate.toLocaleString('default', { month: 'long' })} ${year}`,
            report: finalReport,
        });

    } catch (error) {
        console.error("Error generating monthly report:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};