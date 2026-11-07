const express = require('express');
const router = express.Router();
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  generateBroadcast,
} = require('../controllers/eventController');

router.route('/').get(getEvents).post(createEvent);
router.post('/broadcast', generateBroadcast);
router.route('/:id').put(updateEvent).delete(deleteEvent);

module.exports = router;
