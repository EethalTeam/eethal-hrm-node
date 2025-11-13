const express = require('express');
const router = express.Router();
const LogControllers = require('../controllers/mainControllers/ActivityLogControllers')
const MenuControllers = require('../controllers/mainControllers/MenuControllers')
const UserRightsControllers = require('../controllers/mainControllers/UserRightsControllers')
const ProjectController = require('../controllers/masterControllers/ProjectControllers')
const TaskController = require('../controllers/masterControllers/TaskControllers')
const LeaveRequestController = require('../controllers/masterControllers/LeaveRequestControllers')
const AIControllers = require('../controllers/masterControllers/AiControllers')
const GeminiControllers = require('../controllers/masterControllers/GeminiAiControllers')
const DashBoardControllers = require('../controllers/masterControllers/DashBoardControllers')
const AttendanceReportControllers = require('../controllers/masterControllers/AttendanceReportControllers')
const GroupControllers = require('../controllers/masterControllers/GroupControllers')
const TicketControllers = require('../controllers/masterControllers/TicketControllers')

router.post('/chatWithAI', AIControllers.chatWithAI)
router.post('/chatWithGemini', GeminiControllers.chatWithGemini)
router.post('/parseAICommand', GeminiControllers.parseAICommand)

router.post('/Group/createGroup', GroupControllers.createGroup)
router.post('/Group/AddMembers', GroupControllers.addMembersToGroup)
router.post('/Group/getMessages', GroupControllers.getGroupMessages)
router.post('/Group/getGroupByUsers', GroupControllers.getUserGroups)
router.post('/Group/RemoveMember', GroupControllers.removeMemberFromGroup)
router.post('/Group/makeMemberAdmin', GroupControllers.makeMemberAdmin)

router.post('/DashBoard/getLateLogins', DashBoardControllers.getLateLoginsForToday)
router.post('/DashBoard/getTodayPermissions', DashBoardControllers.getTodaysApprovedPermissions)
router.post('/DashBoard/getTodayLeaves', DashBoardControllers.getTodaysLeaveEmployees)
router.post('/DashBoard/getAllAbsentees', DashBoardControllers.getTodaysAbsentees)

router.post('/Attendance/report', AttendanceReportControllers.getMonthlyReport)

router.post('/Log/getAllLogs', LogControllers.getAllLogs )
router.post('/Log/getFilteredLogs', LogControllers.getFilteredLogs )
router.post('/Log/createLog', LogControllers.logCreate )
router.post('/Log/logCountChange', LogControllers.logCountChange )

router.post('/Menu/createMenu', MenuControllers.createMenu)
// router.post('/Menu/insertManyMenus', MenuControllers.InsertMany)
router.post('/Menu/updateMenu', MenuControllers.updateMenu)
router.post('/Menu/getAllMenus', MenuControllers.getAllMenus)
router.post('/Menu/getAllParentsMenu', MenuControllers.getAllParentsMenu)
router.post('/Menu/getFormattedMenu', MenuControllers.getFormattedMenu)


router.post('/UserRights/getUserRightsByEmployeeId', UserRightsControllers.getUserRightsByEmployee)
router.post('/UserRights/getAllUserRights', UserRightsControllers.getAllUserRights)
router.post('/UserRights/createUserRights', UserRightsControllers.createUserRights)
router.post('/UserRights/updateUserRights', UserRightsControllers.updateUserRights)
router.post('/UserRights/getAllMenus', UserRightsControllers.getAllMenus)
router.post('/UserRights/getAllEmployees', UserRightsControllers.getAllEmployees)

//Project Routes
router.post('/Project/createProject', ProjectController.createProject)
router.post('/Project/deleteProject', ProjectController.deleteProject)
router.post('/Project/updateProject', ProjectController.updateProject)
router.post('/Project/getAllProjects', ProjectController.getAllProjects)

//Task Routes
router.post('/Task/createTask', TaskController.createTask)
router.post('/Task/deleteTask', TaskController.deleteTask)
router.post('/Task/updateTask', TaskController.updateTask)
router.post('/Task/getAllTasks', TaskController.getAllTasks)
router.post('/Task/updateTaskStatus', TaskController.updateTaskStatus)

//LeaveRequest Routes
router.post('/Leave/createLeave', LeaveRequestController.createLeaveRequest)
router.post('/Leave/deleteLeave', LeaveRequestController.deleteLeaveRequest)
router.post('/Leave/updateLeave', LeaveRequestController.updateLeaveRequest)
router.post('/Leave/getAllLeaves', LeaveRequestController.getAllLeaveRequests)

//Ticket Routes
router.post('/Ticket/createTicket', TicketControllers.createTicket)
router.post('/Ticket/getTicketStats', TicketControllers.getTicketStats)
router.post('/Ticket/updateTicket', TicketControllers.updateTicket)
router.post('/Ticket/getAllTickets', TicketControllers.getAllTickets)
router.post('/Ticket/assignTicket', TicketControllers.assignTicket)
router.post('/Ticket/getTicketOptions', TicketControllers.getTicketOptions)
router.post('/Ticket/updateTicketStatus', TicketControllers.updateTicketStatus)

module.exports = router;