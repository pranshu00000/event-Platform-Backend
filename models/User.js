const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'guest'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  profilePicture: {
    type: String,
    default: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1621234567/default-avatar.png'
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Auto-manage createdAt and updatedAt
});

module.exports = mongoose.model('User', userSchema);