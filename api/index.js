const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');
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

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    db = admin.firestore();
    auth = admin.auth();
    console.log('✅ Firebase Admin Initialized');
  } else {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is missing');
  }
} catch (error) {
  console.error('❌ Firebase Initialization Error:', error.message);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── ROUTER FOR MULTI-PLATFORM SUPPORT ──
const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
  if (!db || !auth) {
    return res.status(503).json({ error: 'Firebase not initialized' });
  }
  try {
    const { name, email, phone, password, interests } = req.body;
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone.startsWith('+') ? phone : `+91${phone.replace(/\s/g, '')}`,
    });

    await db.collection('users').doc(userRecord.uid).set({
      name, email, phone, interests,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ message: 'User registered successfully', user: { name, email } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  if (!db || !auth) {
    return res.status(503).json({ error: 'Firebase not initialized' });
  }
  try {
    const { email } = req.body;
    const userRecord = await auth.getUserByEmail(email);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();
    
    const name = userRecord.displayName || (userData ? userData.name : 'User');

    res.json({
      message: 'Login successful',
      user: { name, email: userRecord.email, interests: userData ? userData.interests : [] }
    });
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// User Data Route
router.get('/user/:email', async (req, res) => {
  try {
    const userRecord = await auth.getUserByEmail(req.params.email);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    res.json(userDoc.data());
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user data' });
  }
});

// Health Check
router.get('/health', (req, res) => {
  res.json({ server: 'online', firebase: admin.apps.length > 0 ? 'initialized' : 'failed' });
});

// ── MOUNT ROUTER ──
app.use('/api', router);
app.use('/.netlify/functions/index', router);

// Fallback to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Export handler for Netlify
module.exports = app;
module.exports.handler = serverless(app);

// Local development
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Local Server running on http://localhost:${PORT}`);
  });
}
