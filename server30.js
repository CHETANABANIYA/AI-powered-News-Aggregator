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

// ✅ Express session for authentication
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
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

// ✅ Serve login & signup pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(buildPath, 'login.html'), (err) => {
        if (err) res.status(404).send("Login page not found.");
    });
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(buildPath, 'signup.html'), (err) => {
        if (err) res.status(404).send("Signup page not found.");
    });
});

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



