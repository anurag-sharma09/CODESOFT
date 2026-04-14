const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

let db, auth;

// Initialize Firebase Admin
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    // Fix common PEM formatting issues from environment variables
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    auth = admin.auth();
    console.log('✅ Firebase Admin Initialized');
  } else {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is missing');
  }
} catch (error) {
  console.error('❌ Firebase Initialization Error:', error.message);
  console.log('TIP: Ensure FIREBASE_SERVICE_ACCOUNT is set in your .env or Vercel dashboard.');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes

// ── SIGNUP ROUTE ──
app.post('/api/signup', async (req, res) => {
  if (!db || !auth) {
    return res.status(503).json({ error: 'Firebase is not initialized. Please check your environment variables.' });
  }
  try {
    const { name, email, phone, password, interests } = req.body;

    // 1. Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone.startsWith('+') ? phone : `+91${phone.replace(/\s/g, '')}`, // Firebase requires E.164 format
    });

    // 2. Save additional data in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      phone,
      interests,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`👤 New user registered in Firebase: ${email}`);
    res.status(201).json({ 
      message: 'User registered successfully',
      user: { name, email } 
    });

  } catch (error) {
    console.error('Signup Error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ── LOGIN ROUTE ──
// NOTE: Firebase Admin does not have "signIn" (that's for clients).
// For this backend approach, we'll verify the user exists. 
// In a real app, you'd use Firebase Client SDK on the frontend and verify the token here.
app.post('/api/login', async (req, res) => {
  if (!db || !auth) {
    return res.status(503).json({ error: 'Firebase is not initialized. Please check your environment variables.' });
  }
  try {
    const { email, password } = req.body;

    // Check if user exists in Auth
    const userRecord = await auth.getUserByEmail(email);
    
    // Fetch profile from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();

    // Since we can't easily check password via Admin SDK without the REST API, 
    // we'll return the user data. (In production, the frontend should handle Auth).
    res.json({
      message: 'Login simulation successful',
      user: {
        name: userRecord.displayName,
        email: userRecord.email,
        interests: userData ? userData.interests : []
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(401).json({ error: 'Authentication failed or user not found' });
  }
});

// ── GET USER DATA ──
app.get('/api/user/:email', async (req, res) => {
  try {
    const userRecord = await auth.getUserByEmail(req.params.email);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json(userDoc.data());
  } catch (error) {
    console.error('Fetch User Error:', error);
    res.status(500).json({ error: 'Error fetching user data' });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    server: 'online',
    firebase: admin.apps.length > 0 ? 'initialized' : 'failed'
  });
});

// Fallback to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Export for Vercel
module.exports = app;

// Local development
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Local Server running on http://localhost:${PORT}`);
  });
}
