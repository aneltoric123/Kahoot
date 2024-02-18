const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const app = express();
const { Server }=require('socket.io');
const server = http.createServer(app);
const io = new Server(server);

mongoose.connect('mongodb://localhost:27017/Kahoot');
const db = mongoose.connection;
io.on('connection', (socket) => {
    console.log('A user connected');


    socket.on('joinGame', async ({ gameCode, username }) => {
        try {

            if (!gameCode || !username) {
                console.log('Game code and username are required');
            }
            let room = await Room.findOne({ code: gameCode });
            if (!room) {
                console.log('Room not found');
            }
            room.participants.push({ username });
            await room.save();
            console.log("Added user to game");
            socket.emit('joinGameSuccess', { message: 'Joined game successfully' });
        } catch (error) {

            socket.emit('joinGameError', { error: error.message });
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;