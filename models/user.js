const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, index: true },
    username: { type: String, index: true },
    password: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;