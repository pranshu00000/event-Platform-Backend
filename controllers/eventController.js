const Event = require('../models/Event');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const { category, upcoming } = req.query;
    const filters = {};

    if (category) filters.category = category;
    if (upcoming === 'true') filters.dateTime = { $gt: new Date() };

    const events = await Event.find(filters)
      .populate('owner', 'username email')
      .sort({ dateTime: 1 });

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
  try {
    const { name, description, dateTime, category, location, maxAttendees } = req.body;
    
    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'events'
    });

    const event = new Event({
      name,
      description,
      dateTime,
      category,
      location,
      maxAttendees,
      owner: req.user.id,
      image: {
        public_id: result.public_id,
        url: result.secure_url
      }
    });

    await event.save();
    
    // Add event to user's events array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { events: event._id }
    });

    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Owner only)
const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check ownership
    if (event.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updates = { ...req.body };
    
    if (req.file) {
      // Delete old image
      await cloudinary.uploader.destroy(event.image.public_id);
      
      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'events'
      });
      updates.image = {
        public_id: result.public_id,
        url: result.secure_url
      };
    }

    event = await Event.findByIdAndUpdate(req.params.id, updates, {
      new: true
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(event._id.toString()).emit('eventUpdate', event);

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Owner only)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(event.image.public_id);

    await event.remove();
    
    // Remove event from user's events array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { events: event._id }
    });

    res.json({ message: 'Event removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Join an event
// @route   POST /api/events/:id/join
// @access  Private
const joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if already attending
    if (event.attendees.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already attending this event' });
    }

    // Check capacity
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event is full' });
    }

    event.attendees.push(req.user.id);
    await event.save();

    // Emit real-time update (check if io exists)
    const io = req.app.get('io');
    if (io) {
      io.to(event._id.toString()).emit('attendeeUpdate', event);
    } else {
      console.warn("Socket.io instance not found");
    }

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};


module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent
};