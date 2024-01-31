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

const rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle client joining a room
    socket.on('joinRoom', (roomCode) => {
        socket.join(roomCode);
        console.log(`User joined room ${roomCode}`);
    });

    // Handle client submitting an answer
    socket.on('submitAnswer', ({ roomCode, answer }) => {
        // Broadcast the answer to all clients in the room
        io.to(roomCode).emit('newAnswer', answer);
    });

    // Handle starting the quiz
    socket.on('startQuiz', (roomCode) => {
        // Broadcast a message to all clients in the room to start the quiz
        io.to(roomCode).emit('quizStarted');
    });

    // Handle ending the quiz
    socket.on('endQuiz', (roomCode) => {
        // Broadcast a message to all clients in the room to end the quiz
        io.to(roomCode).emit('quizEnded');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Client-side socket logic (in your HTML/JS files)
// Connect to the Socket.IO server
const socket = io();

// Emit events and listen for server events as needed
socket.emit('joinRoom', roomCode);

socket.on('newAnswer', (answer) => {
    // Handle receiving a new answer from the server
});

// Example: Handle a button click event to submit an answer
submitButton.addEventListener('click', () => {
    const answer = getSelectedAnswer(); // Get the selected answer from the UI
    socket.emit('submitAnswer', { roomCode, answer });
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});