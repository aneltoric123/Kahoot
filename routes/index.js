var express = require('express');
var router = express.Router();
const {MongoClient} = require("mongodb");
const uri = "mongodb://127.0.0.1:27017/";
const userController = require('../controllers/userController');


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Kahoot' });
});
router.get('/index', function(req, res, next) {
  res.render('index', { title: 'Kahoot' });
});
router.get('/reg', function(req, res, next) {
  res.render('reg');
});
router.post('/home',userController.registerUser);
router.post('/home', userController.loginUser);
module.exports = router;
