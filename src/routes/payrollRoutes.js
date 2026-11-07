const express = require('express');
const router = express.Router();
const {
  applyStaffLeave,
  getStaffLeaves,
  reviewStaffLeave,
  recordStaffAttendance,
  getStaffAttendance,
  generateMonthlyPayroll,
  getGymPayroll,
  updatePayrollSlip,
} = require('../controllers/staffPayrollController');
const { protect } = require('../middleware/auth');

// Optional protect middleware (allows demo token or logged in user)
router.use(protect);

// 1. Leave Management (Chutti & Approvals)
router.get('/leaves', getStaffLeaves);
router.post('/leaves', applyStaffLeave);
router.patch('/leaves/:id/review', reviewStaffLeave);

// 2. Staff Attendance
router.get('/attendance', getStaffAttendance);
router.post('/attendance', recordStaffAttendance);

// 3. Automated Payroll Engine & Salary Slips
router.get('/', getGymPayroll);
router.post('/generate', generateMonthlyPayroll);
router.patch('/:id', updatePayrollSlip);

module.exports = router;
