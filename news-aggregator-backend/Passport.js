const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('./models/User'); // Import User model
require('dotenv').config();

// ✅ Serialize user (store user ID in session)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// ✅ Deserialize user (retrieve user data by ID)
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// ✅ Google OAuth Strategy (Fixed)
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://ai-powered-news-aggregator-backend.onrender.com/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    console.log("Google Profile Data:", profile);  // ✅ Debugging Output

    try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                password: "", // No password for OAuth users
                photo: profile.photos ? profile.photos[0].value : null
            });
            await user.save();
            console.log("✅ New Google User Saved:", user);
        }
        return done(null, user);
    } catch (error) {
        console.error("❌ Google OAuth Error:", error.message);
        return done(error, null);
    }
}));



// ✅ Facebook OAuth Strategy (Enhanced for missing emails)
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://ai-powered-news-aggregator-backend.onrender.com/api/auth/facebook/callback",
    profileFields: ["id", "displayName", "photos", "email"]
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let userEmail = profile.emails && profile.emails[0] ? profile.emails[0].value : `facebook_${profile.id}@noemail.com`;
        let user = await User.findOneAndUpdate(
            { email: userEmail },
            { $setOnInsert: { name: profile.displayName, photo: profile.photos[0]?.value || null, password: "" } },
            { new: true, upsert: true }
        );
        return done(null, user);
    } catch (error) {
        console.error("❌ Facebook OAuth Error:", error);
        return done(error, null);
    }
}));

module.exports = passport;







