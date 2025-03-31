// passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
require('dotenv').config();

// ✅ Serialize user (store only necessary user data in session)
passport.serializeUser((user, done) => {
    done(null, user.id); // Serialize user ID
});

// ✅ Deserialize user
passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user); // Retrieve user data by ID
    });
});

// ✅ Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://ai-powered-news-aggregator-backend.onrender.com/api/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    try {
        const user = {
            id: profile.id,
            displayName: profile.displayName,
            email: profile.emails ? profile.emails[0].value : null,
            photo: profile.photos ? profile.photos[0].value : null
        };
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

// ✅ Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: 'https://ai-powered-news-aggregator-backend.onrender.com/api/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'photos', 'email']
}, (accessToken, refreshToken, profile, done) => {
    try {
        const user = {
            id: profile.id,
            displayName: profile.displayName,
            email: profile.emails ? profile.emails[0].value : null,
            photo: profile.photos ? profile.photos[0].value : null
        };
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

module.exports = passport;





