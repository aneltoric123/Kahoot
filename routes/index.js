var express = require('express');
var router = express.Router();
const {MongoClient} = require("mongodb");
const bcrypt = require('bcrypt');
const uri = "mongodb://127.0.0.1:27017";
const User = require('../models/User');

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
        req.session.Username=user.usernme;

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
router.post('/create-quiz', async function(req, res, next) {
  const client = new MongoClient(uri);
  console.log("Request body:", req.body);
  try {
    console.log("Adding quiz to the database...");


    const database = client.db('Kahoot');
    const quizzesCollection = database.collection('quizzes');

    const { title, questions } = req.body;

    // Prepare an array to hold the transformed question data
    const transformedQuestions = [];

    // Iterate over each question and construct the transformed question object
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const transformedQuestion = {
        questionText: question.questionText,
        options: question.options.split(','), // Assuming options are comma-separated
        correctOptionIndex: parseInt(question.correctOptionIndex)
      };
      transformedQuestions.push(transformedQuestion);
    }

    // Construct the quiz object with the transformed questions
    const quiz = {
      title: title,
      questions: transformedQuestions
    };

    // Insert the quiz into the database
    const result = await quizzesCollection.insertOne(quiz);
    console.log("Quiz added successfully:", result.insertedId);

    // Redirect to some confirmation page or homepage
    res.redirect('/home');
  } catch (error) {
    console.error("Error adding quiz:", error);
    res.status(500).send('Internal Server Error');
  } finally {
    await client.close();
  }
});
router.get('/profile', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    res.redirect('/index');
    return;
  }

  try {
    const user = await User.findById(userId);
    res.render('profile', { user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/profile/update', async (req, res) => {
  const { email, username } = req.body;
  const userId = req.session.userId;
  try {
    // Update user data in the database
    await User.findByIdAndUpdate(userId, { email, username });
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/profile/delete', async (req, res) => {
  const userId = req.session.userId;
  try {

    await User.findByIdAndDelete(userId);
    req.session.destroy();
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
