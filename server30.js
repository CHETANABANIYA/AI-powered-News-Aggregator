// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
require('./passport'); // Import Passport.js configuration

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS (Replace '*' with frontend URL in production)
app.use(cors({
    origin: 'https://ai-powered-news-aggregator.vercel.app', 
    methods: 'GET,POST',
    credentials: true, // Required for session cookies
    allowedHeaders: 'Content-Type'
}));

// ✅ Middleware for JSON & URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Express session for authentication
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' }
}));

// ✅ Initialize Passport.js for authentication
app.use(passport.initialize());
app.use(passport.session());

// ✅ Auth Routes (Google & Facebook Login)
const authRoutes = require('./routes/auth'); // Ensure this file exists
app.use('/api/auth', authRoutes);

// ✅ Serve frontend static files
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// ✅ Catch-all route for React SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'), (err) => {
        if (err) res.status(404).send("Page not found.");
    });
});

// ✅ Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});




