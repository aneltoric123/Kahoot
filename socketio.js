const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const Room = require('./models/room'); // Import the Room model
const User  =require('./models/user');
const Quiz = require('./models/quiz');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB connection setup
mongoose.connect('mongodb://localhost:27017/Kahoot', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
