const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, index: true,unique: true },
    username: { type: String, index: true,unique: true },
    password: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;