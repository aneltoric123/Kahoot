const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

// Socket.io
const PORT = 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server)