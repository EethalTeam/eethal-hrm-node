// controllers/taskController.js
const Task = require("../../models/masterModels/Task");
const TaskStatus = require("../../models/masterModels/TaskStatus")
const Notification = require('../../models/masterModels/Notifications')
const Employee = require('../../models/masterModels/Employee')
const { sendWhatsAppTemplate } = require('../../controllers/masterControllers/WhatsAppControllers')

function getIndiaDateTime() {
  const now = new Date();
  const indiaTime = now.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });

  return indiaTime; 
}

// ✅ Create Tasks for Multiple Assignees
exports.createTask = async (req, res) => {
  try {
    const {
      taskCode,
      taskName,
      projectId,
      description,
      startDate,
      dueDate,
      taskPriorityId,
      assignees,
      createdBy,
      reqLeadCount,
      compLeadCount
    } = req.body;

    // --- 1. Validation ---
    if (!taskName || !projectId) {
      return res.status(400).json({ message: "taskName and projectId are required" });
    }
    if (!assignees || !Array.isArray(assignees) || assignees.length === 0) {
      return res.status(400).json({ message: "assignees must be a non-empty array of employee IDs" });
    }
    const taskStatus =await TaskStatus.findOne({name:'To Do'})
    // --- 2. Fetch Common Data Once ---
    const createdEmployee = await Employee.findOne({ _id: createdBy });
    if (!createdEmployee) {
      return res.status(404).json({ message: "Creating employee not found" });
    }

    const io = req.app.get("socketio");
    const createdTasks = [];
    const notificationErrors = [];

    // --- 3. Loop Through Each Assignee and Create a Task ---
    for (const assigneeId of assignees) {
      // 3a. Create and save the individual task
      const task = new Task({
        taskCode,
        taskName,
        projectId,
        description,
        startDate,
        dueDate,
        taskStatusId:taskStatus._id,
        taskPriorityId,
        assignedTo: assigneeId,
        createdBy,
        reqLeadCount,
        compLeadCount
      });

      await task.save();
      createdTasks.push(task);

      // 3b. Send notifications (wrapped in a try/catch)
      // This prevents one failed notification from stopping the whole loop
      try {
        const assignedEmployee = await Employee.findOne({ _id: assigneeId });
        if (!assignedEmployee) {
          console.warn(`Assignee with ID ${assigneeId} not found. Skipping notifications.`);
          notificationErrors.push({ assigneeId, error: "Assignee not found" });
          continue; // Move to the next assignee
        }

        // Send WhatsApp
        await sendWhatsAppTemplate(
          "918825556025", // Note: This is hardcoded
          assignedEmployee.name,
          createdEmployee.name,
          description,
          dueDate
        );

        // Create DB Notification
        const notification = await Notification.create({
          type: "task-assignment",
          message: "New task is assigned for you",
          fromEmployeeId: createdBy,
          toEmployeeId: assigneeId, // <-- Individual assignee
          status: "unseen",
          meta: {
            taskId: task._id
          }
        });

        // Emit Socket.IO Notification
        if (io && assigneeId) {
          io.to(assigneeId.toString()).emit("receiveNotification", notification);
        }
      } catch (notifyError) {
        console.error(`Failed to send notification for task ${task._id} to user ${assigneeId}:`, notifyError.message);
        notificationErrors.push({ assigneeId, error: notifyError.message });
      }
    } // --- End of loop ---

    // --- 4. Send Final Response ---
    res.status(201).json({
      message: "Tasks created successfully and sent to whatsapp",
      tasks: createdTasks,
      notificationErrors: notificationErrors
    });

  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ✅ Get All Tasks
exports.getAllTasks = async (req, res) => {
  try {
    const {_id,role}= req.body;
    let filter={}
    if(role !== 'Super Admin' && role !== 'Admin'){
      filter.assignedTo = _id
    }
    const tasks = await Task.find(filter)
      .populate("projectId", "projectName projectCode")
      .populate("taskStatusId", "name")
      .populate("taskPriorityId", "name")
      .populate("assignedTo", "name email")
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Get All Tasks Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ✅ Get Task By ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("projectId", "projectName projectCode")
      .populate("taskStatusId", "name")
      .populate("taskPriorityId", "name")
      .populate("assignedTo", "name email")

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error("Get Task Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ✅ Update Task
exports.updateTask = async (req, res) => {
  try {
    const {
        _id,
      taskName,
      description,
      startDate,
      dueDate,
      taskStatusId,
      taskPriorityId,
      assignedTo,
      reqLeadCount,
      compLeadCount
    } = req.body;

    const task = await Task.findById(_id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Only updating selected fields
    if (taskName !== undefined) task.taskName = taskName;
    if (description !== undefined) task.description = description;
    if (startDate !== undefined) task.startDate = startDate;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (taskStatusId !== undefined) task.taskStatusId = taskStatusId;
    if (taskPriorityId !== undefined) task.taskPriorityId = taskPriorityId;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if(reqLeadCount !== undefined) task.reqLeadCount = reqLeadCount;
    if(compLeadCount !== undefined) task.compLeadCount = compLeadCount; 

    await task.save();
    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Update Task Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId, status, feedback, progressDetails, reasonForPending, reqLeadCount, compLeadCount } = req.body;

    if (!taskId || !status) {
      return res.status(400).json({ message: "Task ID and status are required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const statusMap = {
      Start: { id: "69254d07a48e61da37c0a31d", message: "Task Started" },     // In Progress
      Pause: { id: "69254cefa48e61da37c0a317", message: "Task Paused" },      // To Do
      Complete: { id: "69254d16a48e61da37c0a321", message: "Task Completed" } // Completed
    };

    const selectedStatus = statusMap[status];
    if (!selectedStatus && status !== 'Complete') {
      return res.status(400).json({ message: "Invalid status value" });
    }
    const currentTime = new Date();

    if (status === 'Start') {
      task.workLogs.push({
        employeeId: task.assignedTo[0], // Assuming the first assignee is performing the task
        startTime: currentTime,
      });
    } 
    else if (status === 'Pause' || status === 'Complete') {
      // Find the last log entry that hasn't been closed yet
      const lastLogIndex = task.workLogs.length - 1;
      
      if (lastLogIndex >= 0) {
        const lastLog = task.workLogs[lastLogIndex];
        
        // Only update if it has a start time but NO end time
        if (lastLog.startTime && !lastLog.endTime) {
          lastLog.endTime = currentTime;
          
          // Calculate duration in milliseconds
          const durationMs = lastLog.endTime - lastLog.startTime;
          
          // Convert to Hours (e.g., 1.5 hours)
          const hours = durationMs / (1000 * 60 * 60); 
          lastLog.hoursWorked = parseFloat(hours.toFixed(2)); // Round to 2 decimals
        }
      }
    }

    if (status === 'Complete') {
      // 2. Notification Logic for Completion
      const assignedEmployee = await Employee.findOne({ _id: task.assignedTo[0] });
      
      const notification = await Notification.create({
        type: "task-complete",
        message: `Task Completed by ${assignedEmployee ? assignedEmployee.name : 'Employee'} - ${task.taskName} (${task.description}), FeedBack:${feedback || ''}`,
        fromEmployeeId: task.assignedTo[0],
        toEmployeeId: task.createdBy,
        status: "unseen",
        meta: { taskId: taskId }
      });

      // 3. Emit notification
      const io = req.app.get("socketio");
      if (io && task.createdBy) {
        io.to(task.createdBy.toString()).emit("receiveNotification", notification);
      }
      
      // Update Status ID
      task.taskStatusId = selectedStatus.id;
    } else {
      // Update Status ID for Start/Pause
      task.taskStatusId = selectedStatus.id;
    }

    // --- GENERIC UPDATES ---
    if (feedback) task.feedback = feedback;
    if (compLeadCount) task.compLeadCount = compLeadCount;

    // Handle array pushes manually since we are using .save()
    if (progressDetails) {
      task.progressDetails.push(`${progressDetails} - ${new Date().toLocaleString('en-IN')}`);
    }
    if (reasonForPending) {
      task.reasonForPending.push(reasonForPending);
    }

    // 4. Save the document (This triggers the updates + logic above)
    await task.save();

    // 5. Populate for response
    await task.populate("projectId", "projectName");
    await task.populate("taskStatusId", "name");
    await task.populate("assignedTo", "name email");

    res.status(200).json({
      message: selectedStatus.message,
      task,
    });

  } catch (error) {
    console.error("Update Task Status Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ✅ Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const {_id} = req.body
    const task = await Task.findByIdAndDelete(_id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete Task Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
