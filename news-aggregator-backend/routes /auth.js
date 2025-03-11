const express = require('express');
const passport = require('../passport'); // Import passport config
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
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('https://ai-powered-news-aggregator.vercel.app'); // Redirect to frontend
    }
);

// ✅ Facebook Auth Route
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// ✅ Facebook Auth Callback Route
router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('https://ai-powered-news-aggregator.vercel.app'); // Redirect to frontend
    }
);

// ✅ Check Authentication Status
router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ authenticated: true, user: req.user });
    } else {
        res.json({ authenticated: false });
    }
});

// ✅ Logout Route
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('https://ai-powered-news-aggregator.vercel.app'); // Redirect to frontend
    });
});

module.exports = router;



