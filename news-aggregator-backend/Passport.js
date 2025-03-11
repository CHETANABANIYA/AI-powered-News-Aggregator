const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
require('dotenv').config();

// ✅ Serialize user (Stores user ID in session)
passport.serializeUser((user, done) => {
    done(null, user);
});

// ✅ Deserialize user (Retrieves user from session)
passport.deserializeUser((user, done) => {
    done(null, user);
});

// ✅ Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://ai-powered-news-aggregator-backend.onrender.com/api/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    console.log('Google Profile:', profile);
    return done(null, profile);
}));

// ✅ Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: 'https://ai-powered-news-aggregator-backend.onrender.com/api/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'photos', 'email']
}, (accessToken, refreshToken, profile, done) => {
    console.log('Facebook Profile:', profile);
    return done(null, profile);
}));

module.exports = passport;



