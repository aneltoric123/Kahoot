var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const Room = require('../models/Room');
const User = require('../models/User');
const Quiz= require('../models/Quiz')
const {MongoClient, ObjectId} = require("mongodb");
const bcrypt = require("bcrypt");
const uri = "mongodb://127.0.0.1:27017";
const { Server } = require('socket.io');
const io = new Server();
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


function generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let roomCode = '';
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        roomCode += characters[randomIndex];
    }
    return roomCode;
}
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Kahoot' });
});
router.get('/index', function(req, res, next) {
    res.render('index', { title: 'Kahoot' });
});
router.get('/reg', function(req, res, next) {
    res.render('reg');
});
router.post('/add', async function(req, res, next) {
    const client = new MongoClient(uri);
    try {
        console.log("Trying insert....");
        const database = client.db('Kahoot');
        const game = database.collection('users');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        const myobj = { email: req.body.email, username: req.body.username , password: hashedPassword };

        const result = await game.insertOne(myobj);
        console.log(result);
    } finally {

        await client.close();
        console.log("Done.");
        res.redirect('/');
    }
});
router.post('/login', async function(req, res, next) {
    const client = new MongoClient(uri);
    try {
        console.log("Trying login....");
        const database = client.db('Kahoot');
        const usersCollection = database.collection('users');

        const user = await usersCollection.findOne({ email: req.body.email });

        if (user) {
            const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
            if (isPasswordValid) {

                console.log('Login successful');
                req.session.userId = user._id;
                req.session.Email= user.email;
                req.session.Username=user.username;

                res.redirect('/home');
                return;
            }
        }
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    } finally {
        await client.close();
    }
});
router.get('/home', function(req, res, next) {
    res.render('home');
});
router.get('/create-quiz',function (req, res) {
    res.render('create_quiz');
});
router.get('/logout',function(req, res,next)
{
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return next(err);
        }
        res.redirect('/');
    });
});
router.post('/create-quiz', async (req, res) => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('Kahoot');
        const quizzesCollection = database.collection('quizzes');

        const { quizTitle } = req.body;
        const questions = [];
        for (let i = 1; req.body[`question${i}`]; i++) {
            const questionText = req.body[`question${i}`];
            const options = req.body[`options${i}`].split(',');
            const correctOptionIndex = parseInt(req.body[`correctOptionIndex${i}`]);
            questions.push({ questionText, options, correctOptionIndex });
        }
        const quiz = { title: quizTitle, questions };
        await quizzesCollection.insertOne(quiz);
        res.redirect('/home');
    } catch (error) {
        console.error("Error adding quiz:", error);
        res.status(500).send('Internal Server Error');
    } finally {
        await client.close();
    }
});

router.get('/profile', async (req, res) => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('Kahoot');
        const usersCollection = database.collection('users');
        const userId = req.session.userId;
        if (!userId) {
            res.redirect('/index');
            return;
        }
        const user = await usersCollection.find({ _id: userId });
        if (!user) {
            res.redirect('/index');
            return;
        }
        res.render('profile', { email: req.session.Email, username: req.session.Username });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    } finally {
        await client.close();
    }
});
router.post('/profile/update', async (req, res) => {
    try {
        const { email, username } = req.body;
        const userId = req.session.userId;

        console.log('User ID:', userId);
        console.log('Email:', email);
        console.log('Username:', username);


        const client = new MongoClient(uri);
        await client.connect();

        const database = client.db('Kahoot');
        const usersCollection = database.collection('users');


        await usersCollection.updateOne({ _id: new ObjectId(userId) }, { $set: { email, username } });


        req.session.Email = email;
        req.session.Username = username;

        client.close();

        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Internal Server Error');
    }
});
router.post('/profile/delete', async (req, res) => {
    try {
        const userId = req.session.userId;
        console.log('User ID:', userId);


        const client = new MongoClient(uri);
        await client.connect();

        const database = client.db('Kahoot');
        const usersCollection = database.collection('users');

        // Perform delete operation
        await usersCollection.deleteOne({ _id: new ObjectId(userId) });
        // Destroy session
        req.session.destroy();

        client.close();

        res.redirect('/');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/quiz_play', async (req, res, next) => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('Kahoot');
        const quizCollection = database.collection('quizzes');
        const quizzes = await quizCollection.find().toArray();
        const roomCode = generateRoomCode();
        res.render('quiz_play', { quizzes, roomCode });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    } finally {
        await client.close();
    }
});
router.post('/create_room', async (req, res) => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('Kahoot');
        const roomCollection = database.collection('rooms');
        const roomCode = generateRoomCode();
        const selectedQuizId = req.body.quiz;
        await roomCollection.insertOne({ code: roomCode, quizId: selectedQuizId });
        res.redirect(`/create-room/${roomCode}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    } finally {
        await client.close();
    }
});
router.post('/delete-room', async function(req, res) {
    const roomCode = req.body.roomCode;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('Kahoot');
        const roomCollection = database.collection('rooms');


        await roomCollection.deleteOne({ code: roomCode });

        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    } finally {
        await client.close();
    }
});
router.get('/create-room/:roomCode', async function(req, res) {
    const roomCode = req.params.roomCode;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('Kahoot');
        const roomCollection = database.collection('rooms');
        const room = await roomCollection.findOne({ code: roomCode });
        if (!room) {
            return res.status(404).send('Room not found');
        }
        res.render('create-room', { roomCode });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    } finally {
        await client.close();
    }
});

router.get('/lobby', function(req, res, next) {
    res.render('lobby',{ username: req.session.username });
});
router.post('/waiting_lobby',function(reg,res)
{
   res.redirect('waiting_lobby');
});
router.get('/waiting_lobby', function(req, res, next) {
    res.render('waiting_lobby',{ username: req.session.Username });
});
module.exports = router;
