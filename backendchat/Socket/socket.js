const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);
const io = new Server(server,{
    cors:{
        origin:['http://localhost:3000'],
        methods:["GET","POST"],
    credentials: true 
  },
transports: ["polling", "websocket"], 
  allowEIO3: true
});

 const getReciverSocketId = (receverId)=>{
    return userSocketmap[receverId];
}; 

const userSocketmap={}; //{userId,socketId}
io.on('connection',(socket)=>{
    const userId = socket.handshake.query.userId;

    if(userId && userId !== "undefine") userSocketmap[userId] = socket.id;
    io.emit("getOnlineUsers",Object.keys(userSocketmap))

    socket.on('disconnect',()=>{
        delete userSocketmap[userId],
        io.emit('getOnlineUsers',Object.keys(userSocketmap))
    });
});

module.exports= {app , io , server,getReciverSocketId}