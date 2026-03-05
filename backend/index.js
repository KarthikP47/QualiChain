const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const userRoutes = require('./routes/user');
const userUpvotes = require('./routes/userUpvotes');
const userDownvotes = require("./routes/userDownvotes");




const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow all or set frontend url
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Expose the uploads directory for serving profile images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io logic for chat
const connectedUsers = new Map();
const roomSockets = new Map(); // roomId -> Set of socketIds

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Join a chat room
  socket.on('joinRoom', (roomId) => {
    const roomName = `room_${roomId}`;
    socket.join(roomName);
    if (!roomSockets.has(roomId)) {
      roomSockets.set(roomId, new Set());
    }
    roomSockets.get(roomId).add(socket.id);
    console.log(`Socket ${socket.id} joined room ${roomId} (${roomName})`);
    console.log(`Total sockets in room ${roomId}:`, roomSockets.get(roomId).size);
  });

  // Leave a chat room
  socket.on('leaveRoom', (roomId) => {
    socket.leave(`room_${roomId}`);
    if (roomSockets.has(roomId)) {
      roomSockets.get(roomId).delete(socket.id);
    }
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  // Send message to a chat room
  socket.on('sendChatMessage', async (data) => {
    console.log('Received sendChatMessage:', data);
    const { roomId, userId, username, walletAddress, content } = data;

    // Validate data
    if (!roomId || !userId || !username || !content) {
      console.error('Missing required fields:', { roomId, userId, username, content });
      socket.emit('chatError', { error: 'Missing required fields' });
      return;
    }

    try {
      // Save message to database
      const [result] = await pool.query(
        'INSERT INTO chat_messages (room_id_uint256, user_id, wallet_address, username, content) VALUES (?, ?, ?, ?, ?)',
        [roomId, userId, walletAddress || '', username, content]
      );

      console.log('Message saved to database, ID:', result.insertId);

      const [msgRows] = await pool.query(
        'SELECT * FROM chat_messages WHERE id = ?',
        [result.insertId]
      );

      if (msgRows.length === 0) {
        throw new Error('Message was not saved to database');
      }

      const newMessage = msgRows[0];
      console.log('Broadcasting message to room:', `room_${roomId}`);

      // Broadcast to all sockets in the room
      io.to(`room_${roomId}`).emit('receiveChatMessage', newMessage);

      // Also send confirmation to sender
      socket.emit('receiveChatMessage', newMessage);
    } catch (err) {
      console.error("Error saving chat message:", err);
      console.error("Error details:", err.message, err.stack);
      socket.emit('chatError', { error: 'Failed to send message: ' + err.message });
    }
  });

  // Handle Typing Events
  socket.on('typing', (data) => {
    const { roomId, username } = data;
    if (roomId && username) {
      socket.to(`room_${roomId}`).emit('userTyping', { username });
    }
  });

  socket.on('stopTyping', (data) => {
    const { roomId, username } = data;
    if (roomId && username) {
      socket.to(`room_${roomId}`).emit('userStoppedTyping', { username });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    // Remove from all rooms
    for (const [roomId, socketSet] of roomSockets.entries()) {
      socketSet.delete(socket.id);
    }
  });
});

// Simple test route
app.get('/', (req, res) => {
  res.send('Backend is working!');
});

// Test DB route
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({ db: 'ok', result: rows[0].result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ db: 'error', message: err.message });
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', userUpvotes);
app.use('/api/users', userDownvotes);
app.use('/api/badges', require('./routes/badges'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/search', require('./routes/search'));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
