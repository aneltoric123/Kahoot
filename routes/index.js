var express = require('express');
var router = express.Router();
const {MongoClient} = require("mongodb");
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const uri = "mongodb://127.0.0.1:27017";
const User = require('../models/User');
const Quiz = require('../models/Quiz');
function generateGameCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let gameCode = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    gameCode += characters[randomIndex];
  }
  return gameCode;
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
    // Close the MongoDB connection
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

    // Retrieve quizzes as an array
    const quizzes = await quizCollection.find().toArray();

    res.render('quiz_play', { quizzes });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  } finally {
    // Close the MongoDB connection
    await client.close();
  }
});
router.post('/create_game', async function(req, res, next) {
  let gameCode;
  if (req.body.gameCode) {
    gameCode = req.body.gameCode;
  } else if (req.query.gameCode) {
    gameCode = req.query.gameCode;
  } else {

    return res.status(400).send('Game code is missing');
  }

  console.log(gameCode);
  res.redirect(`/quiz_interface?gameCode=${gameCode}`);
});


router.get('/join_game', function(req, res, next) {
  const gameCode = generateGameCode();
  console.log(gameCode);
  res.render('join_game', { gameCode });
});


router.get('/quiz_interface', function(req, res, next) {
  const gameCode = req.query.gameCode;

  res.render('quiz_interface', { gameCode });
});


router.get('/quiz_results', function(req, res, next) {

  res.render('quiz_results');
});

router.get('/quiz_questions', async (req, res) => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('Kahoot');
    const quizCollection = database.collection('quizzes');


    const quiz = await quizCollection.findOne({  });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }


    res.json({ quizQuestions: quiz.questions });
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await client.close();
  }
});


module.exports = router;
