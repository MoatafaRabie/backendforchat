const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://frontendchat1.vercel.app"],
    methods: ["GET", "POST"],
    credentials: false,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ["polling", "websocket"],
  allowEIO3: true
});
  
const userSocketmap = {};

const getReciverSocketId = (receverId) => {
  return userSocketmap[receverId];
};

io.on("connection", (socket) => {
  const rawUserId = socket.handshake.query.userId || socket.handshake.auth?.userId;
  const userId = rawUserId && String(rawUserId).trim();

  if (userId && userId !== "undefined" && userId !== "null") {
    socket.data.userId = userId;
    userSocketmap[userId] = socket.id;
  }

  console.log(`[socket] connection: userId=${userId} socketId=${socket.id}`);
  try {
    console.log('[socket] handshake.auth=', socket.handshake && socket.handshake.auth);
    console.log('[socket] handshake.query=', socket.handshake && socket.handshake.query);
  } catch (e) {
    console.log('[socket] handshake logging error', e);
  }

  io.emit("getOnlineUsers", Object.keys(userSocketmap));

  // allow client to explicitly identify if handshake didn't carry userId
  socket.on('identify', (id) => {
    try {
      const uid = id && String(id).trim();
      if (uid && uid !== 'undefined' && uid !== 'null') {
        socket.data.userId = uid;
        userSocketmap[uid] = socket.id;
        console.log('[socket] identify set userId=', uid, 'socketId=', socket.id);
        io.emit('getOnlineUsers', Object.keys(userSocketmap));
      }
    } catch (e) { console.error('[socket] identify error', e); }
  });

  // allow sockets to join conversation rooms for message broadcasting
  socket.on('join', (roomId) => {
    try { 
      socket.join(String(roomId)); 
      console.log('[socket] user', socket.data.userId, 'joined room', String(roomId));
    } catch (e) { console.error('[socket] join error', e); }
  });
  socket.on('leave', (roomId) => {
    try { socket.leave(String(roomId)); } catch (e) {}
  });
  socket.on('joinRoom', (roomId) => {
    try { socket.join(String(roomId)); } catch (e) {}
  });
  socket.on('leaveRoom', (roomId) => {
    try { socket.leave(String(roomId)); } catch (e) {}
  });

  // WebRTC Signaling for Video Calls
  socket.on("call-user", (data) => {
    const { to, offer } = data;
    console.log('[socket] call-user received from', userId, 'to', to);
    const receiverSocketId = getReciverSocketId(to);
    console.log('[socket] resolved receiverSocketId=', receiverSocketId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incoming-call", { from: userId, offer });
      console.log('[socket] forwarded incoming-call to socket', receiverSocketId);
    } else {
      console.log('[socket] receiver not connected, cannot forward incoming-call');
    }
  });

  socket.on("answer-call", (data) => {
    const { to, answer } = data;
    console.log('[socket] answer-call from', userId, 'to', to);
    const receiverSocketId = getReciverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-answered", { from: userId, answer });
      console.log('[socket] forwarded call-answered to', receiverSocketId);
    } else {
      console.log('[socket] receiver not connected, cannot forward call-answered');
    }
  });

  socket.on("ice-candidate", (data) => {
    const { to, candidate } = data;
    const receiverSocketId = getReciverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("ice-candidate", { from: userId, candidate });
    } else {
      console.log('[socket] ice-candidate target not connected:', to);
    }
  });

  socket.on("end-call", (data) => {
    const { to } = data;
    console.log('[socket] end-call from', userId, 'to', to);
    const receiverSocketId = getReciverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-ended", { from: userId });
      console.log('[socket] forwarded call-ended to', receiverSocketId);
    } else {
      console.log('[socket] call-end target not connected:', to);
    }
  });

  socket.on("disconnect", () => {
    if (socket.data.userId) {
      delete userSocketmap[socket.data.userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketmap));
  });
});

module.exports = { app, io, server, getReciverSocketId };
