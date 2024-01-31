var express = require('express');
var router = express.Router();
const {MongoClient} = require("mongodb");
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const uri = "mongodb://127.0.0.1:27017";
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Room = require('../models/Room');
const io = require('socket.io')();
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
    const { title } = req.body;
    const questions = [];
    for (let i = 1; req.body[`question${i}`]; i++) {
      const questionText = req.body[`question${i}`];
      const options = req.body[`options${i}`].split(',');
      const correctOptionIndex = parseInt(req.body[`correctOptionIndex${i}`]);
      questions.push({ questionText, options, correctOptionIndex });
    }
    const quiz = { title, questions };
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
    console.log(userId)
    if (!userId) {
      res.redirect('/index');
      return;
    }


    const user = await usersCollection.find({ _id: userId });
console.log(user);
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
  const { email, username } = req.body;
  const userId = req.session.userId;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('Kahoot');
    const usersCollection = database.collection('users');
    await usersCollection.updateOne({ _id: userId }, { $set: { email, username } });
    req.session.Email = email;
    req.session.Username = username;
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  } finally {
    await client.close();
  }
});

router.post('/profile/delete', async (req, res) => {
  const userId = req.session.userId;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('Kahoot');
    const usersCollection = database.collection('users');
    await usersCollection.deleteOne({ _id: userId });
    req.session.destroy();
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  } finally {
    await client.close();
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
router.get('/roomCode', function(req, res, next) {
  const roomCode = req.query.roomCode;
  res.render('roomCode', { roomCode: roomCode });
});
router.post('/play-quiz', async (req, res) => {
    const { quizId, roomCode } = req.body;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db('Kahoot');
        const quizCollection = database.collection('quizzes');
        const quiz = await quizCollection.find({ _id: quizId }).toArray();

        console.log(quiz)
        if (!quiz) {
            return res.status(404).send('Quiz not found');
        }

        let room;
        if (roomCode) {
            const roomCollection = database.collection('rooms');
            const room= await roomCollection.find({ code: roomCode }).toArray();

        } else {
            const Room = require('../models/Room');
            room = new Room({ quiz: quizId });
            console.log(room);
            await room.save();
        }

        res.redirect(`/play-quiz/${roomCode}`);
    } catch (err) {
        console.error('Error joining/creating room:', err);
        res.status(500).send('Internal Server Error');
    } finally {
        await client.close();
    }
});
router.get('/play-quiz/:roomCode', async (req, res) => {
    const roomCode = req.params.roomCode;
    const userIsHost = true;
    const quizData = {
        title: "Sample Quiz",
        questions: [
            {
                questionText: "What is the capital of France?",
                options: ["Paris", "London", "Berlin", "Madrid"],
                correctOptionIndex: 0
            },
            {
                questionText: "What is the largest planet in our solar system?",
                options: ["Venus", "Saturn", "Jupiter", "Mars"],
                correctOptionIndex: 2
            },
            {
                questionText: "Who wrote 'Romeo and Juliet'?",
                options: ["William Shakespeare", "Charles Dickens", "Jane Austen", "Mark Twain"],
                correctOptionIndex: 0
            }
        ]
    };

    if (userIsHost) {
        res.render('host_play_quiz', { roomCode, quizData  });
    } else {

        res.render('client_play_quiz', { roomCode, quizData });
    }
});
module.exports = router;
