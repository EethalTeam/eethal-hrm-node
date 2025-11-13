const ActivityLog = require("../../models/masterModels/Log");

exports.logCreate = async ({
  employeeId,
  employeeCode,
  employeeName,
  departmentId,
  departmentName,
  role,
  unitId,
  customerID,
  unitName,
  childProductId,
  parentProductId,
  mainParentId,
  orderId,
  orderCode,
  orderType,
  orderStatus,
  action,
  module,
  entityName,
  entityCode,
  changeField,
  oldValue,
  activityValue,
  newValue,
  description,
  ipAddress,
  userAgent
}) => {
  const now = new Date();

  await ActivityLog.create({
    employeeId,
    employeeCode,
    employeeName,
    departmentId,
    departmentName,
    role,
    unitId,
    customerID,
    unitName,
    childProductId,
    parentProductId,
    mainParentId,
    orderId,
    orderCode,
    orderType,
    orderStatus,
    action,
    module,
    entityName,
    entityCode,
    changeField,
    oldValue,
    activityValue,
    newValue,
    description,
    ipAddress,
    userAgent,
    timestamp: now,
    dateStr: now.toISOString().split("T")[0],     // e.g. "2025-07-12"
    monthStr: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, // e.g. "2025-07"
    year: now.getFullYear()
  })
};

exports.logUpdate = async ({
  req,
  entityName,
  entityCode,
  module,
  changeField,
  oldValue,
  newValue,
  description,
  extraFields = {}
}) => {
  const now = new Date();

  const dateStr = now.toISOString().slice(0, 10);
  const monthStr = now.toISOString().slice(0, 7);
  const year = now.getFullYear();

  const activityValue = (typeof oldValue === "number" && typeof newValue === "number")
    ? newValue - oldValue
    : null;

  await ActivityLog.create({
    employeeId: req.user._id,
    employeeCode: req.user.employeeCode,
    employeeName: req.user.employeeName,
    departmentId: req.user.departmentId,
    departmentName: req.user.departmentName,
    role: req.user.role,
    unitId: req.user.unitId,
    unitName: req.user.unitName,

    ...extraFields,

    action: "update",
    module,
    entityName,
    entityCode,
    changeField,
    oldValue,
    activityValue,
    newValue,

    description,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    dateStr,
    monthStr,
    year
  });
};

exports.logDelete = async ({
  req,
  entityName,
  entityCode,
  module,
  description,
  extraFields = {}
}) => {
  const now = new Date();

  const dateStr = now.toISOString().slice(0, 10);
  const monthStr = now.toISOString().slice(0, 7);
  const year = now.getFullYear();

  await ActivityLog.create({
    employeeId: req.user._id,
    employeeCode: req.user.employeeCode,
    employeeName: req.user.employeeName,
    departmentId: req.user.departmentId,
    departmentName: req.user.departmentName,
    role: req.user.role,
    unitId: req.user.unitId,
    unitName: req.user.unitName,

    ...extraFields,

    action: "delete",
    module,
    entityName,
    entityCode,
    changeField: null,
    oldValue: null,
    activityValue: null,
    newValue: null,

    description,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    dateStr,
    monthStr,
    year
  });
};

exports.logCountChange = async ({
  req,
  entityName,
  entityCode,
  module,
  changeField,
  oldValue,
  newValue,
  description,
  parentProductId,
  mainParentId,
  extraFields = {}
}) => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const monthStr = now.toISOString().slice(0, 7);
  const year = now.getFullYear();

  const activityValue = (typeof oldValue === "number" && typeof newValue === "number")
    ? Math.abs(newValue - oldValue)
    : null;

  const action = (newValue > oldValue)
    ? "added"
    : (newValue < oldValue)
      ? "reduced"
      : "no_change";

  await ActivityLog.create({
    employeeId: req.body.user.employeeId,
    employeeCode: req.body.user.employeeCode,
    employeeName: req.body.user.employeeName,
    departmentId: req.body.user.departmentId,
    departmentName: req.body.user.departmentName,
    role: req.body.user.role,
    unitId: req.body.user.unitId,
    unitName: req.body.user.unitName,
    parentProductId,
    mainParentId,

    ...extraFields,

    action,
    module,
    entityName,
    entityCode,
    changeField,
    oldValue,
    activityValue,
    newValue,

    description,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    dateStr,
    monthStr,
    year
  });
};

exports.getAllLogs = async (req, res) => {
  try {
    const {unitId} = req.body
  const page = parseInt(req.body.page) || 1;
  const limit = parseInt(req.body.limit) || 100;
  const skip = (page - 1) * limit;
    const logs = await ActivityLog.find({unitId:unitId}).sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching logs" });
  }
};

exports.getFilteredLogs = async (req, res) => {
  try {
    const {
      employeeId,
      employeeCode,
      employeeName,
      departmentId,
      departmentName,
      role,
      unitId,
      unitName,
      childProductId,
      parentProductId,
      mainParentId,
      customerID,
      orderId,
      orderType,
      orderStatus,
      action,
      module,
      entityName,
      entityCode,
      changeField,
      oldValue,
      activityValue,
      newValue,
      description,
      ipAddress,
      userAgent,
      dateStr,
      monthStr,
      year,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.body;

    const query = {};
 const parseDateString = (str) => {
      if (!str) return null;
      const [day, month, year] = str.split("-");
      return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    };

    const StartDate = parseDateString(startDate);
    const EndDate = parseDateString(endDate);
    if (employeeId) query.employeeId = employeeId;
    if (employeeCode) query.employeeCode = new RegExp(employeeCode, "i");
    if (employeeName) query.employeeName = new RegExp(employeeName, "i");

    if (departmentId) query.departmentId = departmentId;
    if (departmentName) query.departmentName = new RegExp(departmentName, "i");

    if (role) query.role = new RegExp(role, "i");

    if (unitId) query.unitId = unitId;
    if (unitName) query.unitName = new RegExp(unitName, "i");

    if (childProductId) query.childProductId = childProductId;
    if (parentProductId) query.parentProductId = parentProductId;
    if (mainParentId) query.mainParentId = mainParentId;

    if (orderId) query.orderId = orderId;
    if (orderType) query.orderType = new RegExp(orderType, "i");
    if (orderStatus) query.orderStatus = new RegExp(orderStatus, "i");
    if (customerID) query.customerID = customerID;

    if (action) query.action = new RegExp(action, "i");
    if (module) query.module = new RegExp(module, "i");

    if (entityName) query.entityName = new RegExp(entityName, "i");
    if (entityCode) query.entityCode = new RegExp(entityCode, "i");

    if (changeField) query.changeField = new RegExp(changeField, "i");

    if (oldValue) query.oldValue = oldValue;
    if (activityValue) query.activityValue = activityValue;
    if (newValue) query.newValue = newValue;

    if (description) query.description = new RegExp(description, "i");
    if (ipAddress) query.ipAddress = ipAddress;
    if (userAgent) query.userAgent = new RegExp(userAgent, "i");

    if (dateStr) query.dateStr = dateStr;
    if (monthStr) query.monthStr = monthStr;
    if (year) query.year = Number(year);

    // ✅ Add date range filter
    if (StartDate || EndDate) {
      query.createdAt = {};
      if (StartDate) {
        query.createdAt.$gte = new Date(StartDate);
      }
      if (EndDate) {
        // Ensure EndDate includes the whole day
        const end = new Date(EndDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments(query);

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      logs
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching logs." });
  }
};
