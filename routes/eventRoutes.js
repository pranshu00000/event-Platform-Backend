const express = require('express');
const router = express.Router();
const { protect ,authorizeRoles } = require('../middleware/auth');
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent
} = require('../controllers/eventController');
const upload = require('../config/multer'); 

router.route('/')
  .get(getEvents)
  .post(protect, upload.single('image'), createEvent);

router.route('/:id')
.delete(protect, deleteEvent)
.put(protect, upload.single('image'), updateEvent)

router.post('/:id/join', protect, joinEvent);

module.exports = router;