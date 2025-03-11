require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const redis = require('redis');
const rateLimit = require('express-rate-limit');
const mailchimp = require("@mailchimp/mailchimp_marketing");
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Fix for rate limiter issue on Render
app.set('trust proxy', 1);

// ✅ API Keys & Configurations
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'c8f7bbd1aa7b4719ae619139984f2b08';
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || '10998e49626e56d8e92a5a9470f0d169';
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || "8a4236f395858305478b31637a3c3b9e-us11";
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID || "6918a248d2";
const REDIS_URL = process.env.REDIS_URL || "redis://default:AWr_AAIjcDFkYWI2MWQ2MTA1OTQ0NWE4YTFjYTVmN2FhMDVhM2UzZXAxMA@closing-mantis-27391.upstash.io:6379";
const SESSION_SECRET = process.env.SESSION_SECRET || "949785c8c2958b818acc15abaacde58f3d2e9af4f05a9e76ec15ff549eefcad1";

// ✅ Mailchimp Config
mailchimp.setConfig({
  apiKey: MAILCHIMP_API_KEY,
  server: "us11",
});

// ✅ Enable CORS
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

// ✅ Session Setup for Passport.js
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// ✅ Rate Limiting (50 requests per 10 minutes)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, try again later.' },
});
app.use('/api/news', limiter);

// ✅ Redis Client Setup
const redisClient = redis.createClient({
  url: REDIS_URL,
  socket: { tls: true }
});

redisClient.on('error', (err) => console.error(`❌ Redis Error: ${err.message}`));
redisClient.connect()
  .then(() => console.log('✅ Connected to Redis'))
  .catch((err) => console.error('❌ Redis Connection Failed:', err.message));

// ✅ Google Authentication
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret',
    callbackURL: "/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

// ✅ Facebook Authentication
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID || 'your_facebook_client_id',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'your_facebook_client_secret',
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// ✅ Google Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('https://ai-powered-news-aggregator.vercel.app');
  }
);

// ✅ Facebook Auth Routes
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('https://ai-powered-news-aggregator.vercel.app');
  }
);

// ✅ Function to Fetch News from APIs
const fetchNewsFromAPIs = async (category, country, language) => {
  const newsAPIUrl = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&language=${language}&apiKey=${NEWS_API_KEY}`;
  const gnewsAPIUrl = `https://gnews.io/api/v4/top-headlines?category=${category}&country=${country}&lang=${language}&apikey=${GNEWS_API_KEY}`;

  try {
    const newsAPIResponse = await axios.get(newsAPIUrl);
    if (newsAPIResponse.data?.articles?.length > 0) {
      return newsAPIResponse.data;
    }
  } catch (error) {
    console.error('❌ NewsAPI Error:', error.response?.data || error.message);
  }

  try {
    const gnewsResponse = await axios.get(gnewsAPIUrl);
    if (gnewsResponse.data?.articles?.length > 0) {
      return gnewsResponse.data;
    }
  } catch (error) {
    console.error('❌ GNews Error:', error.response?.data || error.message);
  }

  return { articles: [] };
};

// ✅ News API Route with Caching
app.get('/api/news', async (req, res) => {
  const { category = 'general', country = 'us', language = 'en' } = req.query;
  const redisKey = `news:${country}:${category}:${language}`;

  try {
    const cachedData = await redisClient.get(redisKey);
    
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const newsData = await fetchNewsFromAPIs(category, country, language);

    if (newsData.articles.length > 0) {
      await redisClient.setEx(redisKey, 1800, JSON.stringify(newsData)); // Cache for 30 mins
    }

    res.json(newsData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// ✅ SEARCH NEWS ROUTE
app.get('/api/news/search', async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  let results = { articles: [] };

  try {
    const newsAPIResponse = await axios.get(
      `https://newsapi.org/v2/everything?q=${query}&language=en&apiKey=${NEWS_API_KEY}`
    );
    if (newsAPIResponse.data?.articles?.length > 0) {
      results.articles = [...newsAPIResponse.data.articles];
    }
  } catch (error) {
    console.error('❌ NewsAPI Search Error:', error.response?.data || error.message);
  }

  try {
    const gnewsResponse = await axios.get(
      `https://gnews.io/api/v4/search?q=${query}&lang=en&apikey=${GNEWS_API_KEY}`
    );
    if (gnewsResponse.data?.articles?.length > 0) {
      results.articles = [...results.articles, ...gnewsResponse.data.articles];
    }
  } catch (error) {
    console.error('❌ GNews Search Error:', error.response?.data || error.message);
  }

  res.json(results);
});

// ✅ MAILCHIMP SUBSCRIPTION ROUTE
app.post("/api/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    await mailchimp.lists.addListMember(MAILCHIMP_LIST_ID, {
      email_address: email,
      status: "subscribed",
    });

    res.json({ message: "Successfully subscribed!" });
  } catch (error) {
    res.status(500).json({ error: "Subscription failed. Try again later." });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

















