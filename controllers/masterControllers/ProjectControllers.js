const Project = require("../../models/masterModels/Project");
const ProjectStatus = require("../../models/masterModels/ProjectStatus");
const Employee = require("../../models/masterModels/Employee");

// CREATE Project
exports.createProject = async (req, res) => {
  try {
    const {
      projectName,
      description,
      startDate,
      endDate,
      statusId,
      projectHead,
      assignees,
      createdBy,
      budget
    } = req.body;

    // validation (basic)
    if (!projectName) {
      return res.status(400).json({ message: "projectName is required" });
    }
   const alreadyExist=await Project.findOne({projectName:projectName})
   if(alreadyExist){
    return res.status(400).json({ message: "Project already exists" });
   }
    const project = new Project({
      projectName,
      description,
      startDate,
      endDate,
      projectStatusId:statusId,
      projectHead,
      budget,
      assignedEmployees: assignees || [],
      createdBy,
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error creating project", error: error.message });
  }
};

// GET all Projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("projectStatusId", "name")
      .populate("projectHead", "employeeName email")
      .populate("assignedEmployees", "employeeName email");

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects", error: error.message });
  }
};

// GET single Project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("projectStatusId", "name")
      .populate("projectHead", "employeeName email")
      .populate("assignedEmployees", "employeeName email");

    if (!project) return res.status(404).json({ message: "Project not found" });

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error fetching project", error: error.message });
  }
};

// UPDATE Project
exports.updateProject = async (req, res) => {
  try {
    const {
        _id,
      projectCode,
      projectName,
      description,
      startDate,
      endDate,
      statusId,
      projectHead,
      assignees,
      budget
    } = req.body;

    const project = await Project.findById(_id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // update only destructured fields
    if (projectCode !== undefined) project.projectCode = projectCode;
    if (projectName !== undefined) project.projectName = projectName;
    if (description !== undefined) project.description = description;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if(budget !== undefined) project.budget = budget;
    if (statusId !== undefined) project.projectStatusId = statusId;
    if (projectHead !== undefined) project.projectHead = projectHead;
    if (assignees !== undefined) project.assignedEmployees = assignees;

    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error updating project", error: error.message });
  }
};

// DELETE Project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project", error: error.message });
  }
};
