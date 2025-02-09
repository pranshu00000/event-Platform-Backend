const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [100, 'Event name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  dateTime: { 
    type: Date, 
    required: [true, 'Event date/time is required'],
    validate: {
      validator: function(value) {
        return value > Date.now();
      },
      message: 'Event date must be in the future'
    }
  },
  category: {
    type: String,
    required: true,
    enum: ['Conference', 'Workshop', 'Social', 'Webinar', 'Other'],
    default: 'Other'
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'Event owner is required']
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  }],
  image: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  maxAttendees: {
    type: Number,
    min: [1, 'Minimum attendees must be at least 1'],
    max: [10000, 'Maximum attendees cannot exceed 10,000']
  }
}, { 
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Virtual for attendee count
eventSchema.virtual('attendeeCount').get(function() {
  return this.attendees.length;
});

module.exports = mongoose.model('Event', eventSchema);