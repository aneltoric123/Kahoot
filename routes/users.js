var express = require('express');
var router = express.Router();
//const io = require('socket.io-client');
//const socket = io('http://localhost:3000');
router.get('/', function(req, res, next) {
  res.render('lobby');
});

module.exports = router;
