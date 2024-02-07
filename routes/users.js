var express = require('express');
var router = express.Router();
const io = require('socket.io-client');
const socket = io('http://localhost:3000');
const mongoose = require('mongoose');
const Room = require('../models/Room');
const User = require('../models/User');
const Quiz= require('../models/Quiz')
const {MongoClient} = require("mongodb");
const uri = "mongodb://127.0.0.1:27017";


router.get('/', function(req, res, next) {
  res.render('lobby');
});
router.get('/waiting_lobby/:gameCode', async function(req, res, next) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('Kahoot');
        const roomCollection = database.collection('rooms');
        const gameCode = req.params.gameCode;

        const room = await roomCollection.findOne({ code: gameCode });
        if (!room) {
            return res.status(404).send('Room not found');
        }


        const playerIds = Array.isArray(room.players) ? room.players : [room.players];


        const users = await database.collection('users').find({ _id: { $in: playerIds } }).toArray();

        res.render('waiting_lobby', { players: users });
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/join-game', async (req, res) => {
    const { gameCode } = req.body;
    const client = new MongoClient(uri);
    try {
      await client.connect();
      const database = client.db('Kahoot');
      const roomCollection = database.collection('rooms');

      const room = await roomCollection.findOne({ code: gameCode });
    if (!room) {
      return res.status(404).send('Game not found');
    }
    res.redirect(`/users/waiting_lobby/${gameCode}`);
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
