const express = require('express');
const router = express.Router();
const {
  kioskScan,
  qrScan,
  getGymQRDetails,
  getAttendance,
  exportAttendanceCsv,
  getTodayAttendance,
  manualCheckIn,
  manualCheckOut,
} = require('../controllers/attendanceController');

router.get('/', getAttendance);
router.get('/export/csv', exportAttendanceCsv);
router.post('/scan', kioskScan);
router.post('/qr-scan', qrScan);
router.get('/gym-qr/:gymId', getGymQRDetails);
router.get('/today', getTodayAttendance);
router.post('/check-in', manualCheckIn);
router.post('/check-out/:id', manualCheckOut);

module.exports = router;

