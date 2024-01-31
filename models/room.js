const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;