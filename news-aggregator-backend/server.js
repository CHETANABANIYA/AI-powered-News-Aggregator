require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const redis = require('redis');
const rateLimit = require('express-rate-limit');
const mailchimp = require("@mailchimp/mailchimp_marketing");
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const app = express();
const PORT = process.env.PORT || 5000;

// API Keys
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'c8f7bbd1aa7b4719ae619139984f2b08';
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || '10998e49626e56d8e92a5a9470f0d169';
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || "8a4236f395858305478b31637a3c3b9e-us11";
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID || "6918a248d2";
const REDIS_URL = process.env.REDIS_URL || "redis://default:AWr_AAIjcDFkYWI2MWQ2MTA1OTQ0NWE4YTFjYTVmN2FhMDVhM2UzZXAxMA@closing-mantis-27391.upstash.io:6379";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;

// Mailchimp Config
mailchimp.setConfig({
  apiKey: MAILCHIMP_API_KEY,
  server: "us11",
});

// Enable CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://ai-powered-news-aggregator.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(session({ secret: 'secretkey', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, try again later.' },
});
app.use('/api/news', limiter);

// Redis Client Setup
const redisClient = redis.createClient({ url: REDIS_URL, socket: { tls: true } });
redisClient.on('error', (err) => console.error(`❌ Redis Error: ${err.message}`));
redisClient.connect().then(() => console.log('✅ Connected to Redis'))
  .catch((err) => console.error('❌ Redis Connection Failed:', err.message));

// Google Authentication
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

// Facebook Authentication
passport.use(new FacebookStrategy({
  clientID: FACEBOOK_CLIENT_ID,
  clientSecret: FACEBOOK_CLIENT_SECRET,
  callbackURL: "/auth/facebook/callback",
  profileFields: ['id', 'displayName', 'emails']
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Google Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => res.redirect('https://ai-powered-news-aggregator.vercel.app'));

// Facebook Auth Routes
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/' }),
  (req, res) => res.redirect('https://ai-powered-news-aggregator.vercel.app'));

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
















