const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage (in production, use Redis or database)
const rooms = new Map();
const userSessions = new Map();

// Generate unique room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Room management
function createRoom() {
  const roomCode = generateRoomCode();
  const room = {
    id: roomCode,
    users: new Map(),
    videoState: {
      videoId: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      lastUpdated: Date.now()
    },
    chat: [],
    createdAt: Date.now(),
    sessionStartTime: null
  };
  rooms.set(roomCode, room);
  return roomCode;
}

function getRoom(roomCode) {
  return rooms.get(roomCode);
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (data) => {
    const { roomCode, username } = data;
    const room = getRoom(roomCode);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Add user to room
    room.users.set(socket.id, {
      id: socket.id,
      username: username || `User${room.users.size + 1}`,
      joinedAt: Date.now()
    });

    socket.join(roomCode);
    userSessions.set(socket.id, roomCode);

    // Start session timer if first user
    if (room.users.size === 1) {
      room.sessionStartTime = Date.now();
    }

    // Send current room state to new user
    socket.emit('room-joined', {
      roomCode,
      users: Array.from(room.users.values()),
      videoState: room.videoState,
      chat: room.chat,
      sessionStartTime: room.sessionStartTime
    });

    // Notify other users
    socket.to(roomCode).emit('user-joined', {
      user: room.users.get(socket.id),
      users: Array.from(room.users.values())
    });

    console.log(`User ${socket.id} joined room ${roomCode}`);
  });

  // Video synchronization events
  socket.on('video-play', (data) => {
    const roomCode = userSessions.get(socket.id);
    const room = getRoom(roomCode);
    
    if (room) {
      room.videoState.isPlaying = true;
      room.videoState.currentTime = data.currentTime;
      room.videoState.lastUpdated = Date.now();
      
      socket.to(roomCode).emit('video-play', {
        currentTime: data.currentTime,
        triggeredBy: socket.id
      });
    }
  });

  socket.on('video-pause', (data) => {
    const roomCode = userSessions.get(socket.id);
    const room = getRoom(roomCode);
    
    if (room) {
      room.videoState.isPlaying = false;
      room.videoState.currentTime = data.currentTime;
      room.videoState.lastUpdated = Date.now();
      
      socket.to(roomCode).emit('video-pause', {
        currentTime: data.currentTime,
        triggeredBy: socket.id
      });
    }
  });

  socket.on('video-seek', (data) => {
    const roomCode = userSessions.get(socket.id);
    const room = getRoom(roomCode);
    
    if (room) {
      room.videoState.currentTime = data.currentTime;
      room.videoState.lastUpdated = Date.now();
      
      socket.to(roomCode).emit('video-seek', {
        currentTime: data.currentTime,
        triggeredBy: socket.id
      });
    }
  });

  socket.on('video-change', (data) => {
    const roomCode = userSessions.get(socket.id);
    const room = getRoom(roomCode);
    
    if (room) {
      room.videoState.videoId = data.videoId;
      room.videoState.isPlaying = false;
      room.videoState.currentTime = 0;
      room.videoState.lastUpdated = Date.now();
      
      io.to(roomCode).emit('video-change', {
        videoId: data.videoId,
        triggeredBy: socket.id
      });
    }
  });

  // Chat events
  socket.on('send-message', (data) => {
    const roomCode = userSessions.get(socket.id);
    const room = getRoom(roomCode);
    
    if (room) {
      const message = {
        id: uuidv4(),
        user: room.users.get(socket.id),
        text: data.text,
        timestamp: Date.now()
      };
      
      room.chat.push(message);
      
      io.to(roomCode).emit('new-message', message);
    }
  });

  // Session time check
  socket.on('check-session-time', (callback) => {
    const roomCode = userSessions.get(socket.id);
    const room = getRoom(roomCode);
    
    if (room && room.sessionStartTime) {
      const elapsedTime = Date.now() - room.sessionStartTime;
      const freeTimeRemaining = Math.max(0, (30 * 60 * 1000) - elapsedTime);
      
      callback({
        elapsedTime,
        freeTimeRemaining,
        requiresPayment: elapsedTime > (30 * 60 * 1000)
      });
    }
  });

  socket.on('disconnect', () => {
    const roomCode = userSessions.get(socket.id);
    const room = getRoom(roomCode);
    
    if (room) {
      const user = room.users.get(socket.id);
      room.users.delete(socket.id);
      
      // Notify other users
      socket.to(roomCode).emit('user-left', {
        user,
        users: Array.from(room.users.values())
      });

      // Clean up empty rooms after 5 minutes
      if (room.users.size === 0) {
        setTimeout(() => {
          if (rooms.get(roomCode)?.users.size === 0) {
            rooms.delete(roomCode);
            console.log(`Room ${roomCode} cleaned up`);
          }
        }, 5 * 60 * 1000);
      }
    }
    
    userSessions.delete(socket.id);
    console.log('User disconnected:', socket.id);
  });
});

// REST API routes
app.post('/api/rooms/create', (req, res) => {
  const roomCode = createRoom();
  res.json({ roomCode });
});

app.get('/api/rooms/:roomCode/exists', (req, res) => {
  const room = getRoom(req.params.roomCode);
  res.json({ exists: !!room });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});