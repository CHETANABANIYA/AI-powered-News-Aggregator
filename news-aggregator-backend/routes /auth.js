const express = require('express');
const passport = require('passport'); // Directly import passport from server.js
const router = express.Router();

// ✅ Middleware to check authentication
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
};

// ✅ Google Auth Route
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// ✅ Google Auth Callback Route
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/api/auth/login-failed' }), 
    (req, res) => {
        console.log("✅ Google Auth Success:", req.user);
        res.redirect('https://ai-powered-news-aggregator.vercel.app');
    }
);

// ✅ Facebook Auth Route
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// ✅ Facebook Auth Callback Route
router.get('/facebook/callback', 
    passport.authenticate('facebook', { failureRedirect: '/api/auth/login-failed' }), 
    (req, res) => {
        console.log("✅ Facebook Auth Success:", req.user);
        res.redirect('https://ai-powered-news-aggregator.vercel.app');
    }
);

// ✅ Check Authentication Status
router.get('/status', (req, res) => {
    console.log("🔍 Checking auth status:", req.user);
    res.json({ authenticated: req.isAuthenticated(), user: req.user || null });
});

// ✅ Logout Route
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('https://ai-powered-news-aggregator.vercel.app');
    });
});

// ✅ Failure Redirect Route (for debugging)
router.get('/login-failed', (req, res) => {
    res.status(401).json({ error: "OAuth Login Failed" });
});

module.exports = router;






