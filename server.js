// server.js

// Import necessary modules
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const configureCloudinary=require('./config/cloudinary')
const cookieParser = require('cookie-parser');

// Load environment variables from .env file
dotenv.config();
configureCloudinary();
// Import API routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');

// Initialize the Express application
const app = express();
app.use(cookieParser());

// Create an HTTP server instance using Express
const server = http.createServer(app);

// Set up Socket.IO with CORS configuration
const io = socketIo(server, {
  cors: {
    origin: ['https://event-platform-frontend.onrender.com',
'http://localhost:3000'
     ] ,// For development; restrict this in production
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
app.set('io', io);

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors({
  origin:  ['https://event-platform-frontend.onrender.com',
    'http://localhost:3000'
   ] , // Allow only your frontend origin
  credentials: true, // Allow cookies and auth headers
})); // Enable CORS for all origins

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Socket.IO: Real-time communication setup
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // When a client joins an event room
  socket.on('joinEvent', (eventId) => {
    socket.join(eventId);
    console.log(`Socket ${socket.id} joined event room: ${eventId}`);
  });

  // When a client leaves an event room
  socket.on('leaveEvent', (eventId) => {
    socket.leave(eventId);
    console.log(`Socket ${socket.id} left event room: ${eventId}`);
  });

  // When an attendee is added, broadcast the update to the event room
  socket.on('attendeeAdded', (eventData) => {
    const { eventId, attendeeCount } = eventData;
    io.to(eventId).emit('updateAttendees', { eventId, attendeeCount });
    console.log(`Attendee added to event ${eventId}. New count: ${attendeeCount}`);
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// MongoDB connection and server start
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI,{
  serverSelectionTimeoutMS: 5000 // Timeout after 5 seconds

})
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    // Start the server after a successful DB connection
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
