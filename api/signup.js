const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

exports.handler = async (event) => {
    if (event.httpMethod === 'POST') {
        const { username, password } = JSON.parse(event.body);
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });

        try {
            await user.save();
            return { statusCode: 201, body: JSON.stringify({ message: 'User registered successfully' }) }; 
        } catch (error) {
            return { statusCode: 400, body: JSON.stringify({ message: error.message }) };
        }
    }
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
};
