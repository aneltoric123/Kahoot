var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const http = require('http'); // Require http module
const socketIo = require('socket.io');
// const app = require('./private/javascripts/socketio');
const app= express();// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(session({
  secret: 'sdre45z64567oikjhgfr34567zuh', // Change this to a secure random string
  resave: false,
  saveUninitialized: true,
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);
const server = http.createServer(app);

// Set up Socket.IO
const io = socketIo(server);
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('answer', (answer) => {
    io.emit('answer', answer);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = {app,server};
