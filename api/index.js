const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Database Connection State
let dbConnected = false;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    dbConnected = true;
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch(err => {
    dbConnected = false;
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('---');
    console.log('SURVIVAL MODE: Server is running, but database is disconnected.');
    console.log('TIP: Check your IP Whitelist in MongoDB Atlas.');
    console.log('---');
  });

// Routes
app.post('/api/signup', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database is currently offline. Please check your IP whitelist in MongoDB Atlas.' });
  }
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

// Login Route
app.post('/api/login', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database is currently offline. Please check your IP whitelist in MongoDB Atlas.' });
  }
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      user: {
        name: user.name,
        email: user.email,
        interests: user.interests
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get User Data Route
app.get('/api/user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      name: user.name,
      email: user.email,
      interests: user.interests,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Fetch User Error:', error);
    res.status(500).json({ error: 'Server error fetching user data' });
  }
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    server: 'online',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Simple test route / Fallback to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Export the app for Vercel serverless functions
module.exports = app;

// Only listen if running locally
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Local Server running on http://localhost:${PORT}`);
  });
}
