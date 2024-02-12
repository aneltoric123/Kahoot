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

const socket = io();

io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('join-room', async (roomCode) => {
        socket.join(roomCode);
        socket.roomCode = roomCode;

        try {
            await client.connect();
            const database = client.db('Kahoot');
            const roomCollection = database.collection('rooms');


            await roomCollection.updateOne({ code: roomCode }, { $inc: { playersCount: 1 } });


            io.to(roomCode).emit('user-joined', socket.id);
        } catch (error) {
            console.error(error);
        } finally {
            await client.close();
        }
    });


    socket.on('disconnect', async () => {
        const roomCode = socket.roomCode;
        try {
            await client.connect();
            const database = client.db('Kahoot');
            const roomCollection = database.collection('rooms');


            await roomCollection.updateOne({ code: roomCode }, { $inc: { playersCount: -1 } });


            io.to(roomCode).emit('user-left', socket.id);
        } catch (error) {
            console.error(error);
        } finally {
            await client.close();
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});