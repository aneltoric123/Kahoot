const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

const rooms=[];
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('joinRoom', (roomCode) => {
        if (rooms[roomCode]) {
            socket.join(roomCode);
            io.to(roomCode).emit('playerJoined', socket.id);
        } else {
            console.log('Room does not exist');
        }
    });
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});