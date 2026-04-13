const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('---');
    console.log('TIP: Make sure you have replaced the MONGODB_URI in your .env file with your real connection string from MongoDB Atlas.');
    console.log('---');
  });

// Routes
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, phone, password, interests } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      interests
    });

    await newUser.save();
    console.log(`👤 New user registered: ${email}`);
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: { name, email } 
    });

  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Simple test route
app.get('/', (req, res) => {
  res.send('NexaApp Backend API is running...');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
