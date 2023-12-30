const bcrypt = require('bcrypt');
const User = require('../models/user');


const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }


        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);


        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });


        await newUser.save();
        return res.redirect('/home');
    } catch (error) {
        return res.redirect('/reg');
    }
};
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;


        const user = await User.findOne({ email });

        if (!user) {
            return res.redirect('index');
        }

        // Compare hashed passwords
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.redirect('index');
        }
         req.session.userId = user._id;

        return res.redirect('home');
    } catch (error) {
        return res.redirect('index');
    }
};

module.exports = {
    registerUser,
    loginUser,
};
