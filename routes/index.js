var express = require('express');
var router = express.Router();
const {MongoClient} = require("mongodb");
const bcrypt = require('bcrypt');
const uri = "mongodb://127.0.0.1:27017";


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

module.exports = router;
