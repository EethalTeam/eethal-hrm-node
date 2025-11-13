const express = require('express');
const router = express.Router();

const EmployeeController = require('../controllers/masterControllers/EmployeeControllers')

router.post('/Employee/login', EmployeeController.loginEmployee);
router.post('/Employee/logout', EmployeeController.logoutEmployee);

module.exports = router;