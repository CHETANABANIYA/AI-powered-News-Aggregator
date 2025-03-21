import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import cors from "cors";
import session from "express-session";
import { createClient } from "redis";
import connectRedis from "connect-redis";
 // ✅ Fix: Use named import
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import mailchimp from "@mailchimp/mailchimp_marketing";

// Load environment variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.set("trust proxy", 1);

// Validate Required Environment Variables
const requiredEnvVars = [
  "NEWSAPI_KEY", "GNEWS_API_KEY", "MAILCHIMP_API_KEY", "MAILCHIMP_LIST_ID",
  "REDIS_URL", "SESSION_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
  "FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET", "JWT_SECRET", "MONGO_URI"
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// Extract Environment Variables
const {
  NEWSAPI_KEY, GNEWS_API_KEY, MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID,
  REDIS_URL, SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, JWT_SECRET, MONGO_URI
} = process.env;

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// Define ContactMessage Model
const contactMessageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});
const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

// Redis Client Setup
const redisClient = createClient({ url: REDIS_URL });

redisClient.on("error", (err) => console.error(`❌ Redis Error: ${err.message}`));

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Connected to Redis");
  } catch (error) {
    console.error("❌ Redis Connection Error:", error.message);
    process.exit(1);
  }
})();

// Redis Session Store
const RedisStore = connectRedis(session); // ✅ Fix: Correct usage
app.use(
  session({
    store: new RedisStore({ client: redisClient, prefix: "sess:" }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", httpOnly: true },
  })
);

// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://ai-powered-news-aggregator.vercel.app"
];

app.use(
  cors({
    origin: (origin, callback) =>
      allowedOrigins.includes(origin) || !origin ? callback(null, true) : callback(new Error("Not allowed by CORS")),
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// Mailchimp Configuration
mailchimp.setConfig({ apiKey: MAILCHIMP_API_KEY, server: MAILCHIMP_API_KEY.split("-")[1] });

// Passport Setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy(
  { clientID: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET, callbackURL: "/api/auth/google/callback" },
  (accessToken, refreshToken, profile, done) => done(null, profile)
));

passport.use(new FacebookStrategy(
  { clientID: FACEBOOK_CLIENT_ID, clientSecret: FACEBOOK_CLIENT_SECRET, callbackURL: "/api/auth/facebook/callback", profileFields: ["id", "displayName", "photos", "email"] },
  (accessToken, refreshToken, profile, done) => done(null, profile)
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Generate JWT Token
const generateToken = (email) => jwt.sign({ email }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || "7d" });

// Fetch News from APIs
const fetchNewsFromAPIs = async (category, country, language) => {
  try {
    const newsAPIResponse = await axios.get(
      `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&language=${language}&apiKey=${NEWSAPI_KEY}`
    );
    if (newsAPIResponse.data?.articles?.length > 0) return newsAPIResponse.data;
  } catch (error) {
    console.error("❌ NewsAPI Error:", error.response?.data || error.message);
  }
  try {
    const gnewsResponse = await axios.get(
      `https://gnews.io/api/v4/top-headlines?category=${category}&country=${country}&lang=${language}&apikey=${GNEWS_API_KEY}`
    );
    if (gnewsResponse.data?.articles?.length > 0) return gnewsResponse.data;
  } catch (error) {
    console.error("❌ GNews Error:", error.response?.data || error.message);
  }
  return { articles: [] };
};

// News Route with Caching
app.get("/api/news", async (req, res, next) => {
  try {
    const { category = "general", country = "us", language = "en" } = req.query;
    const redisKey = `news:${country}:${category}:${language}`;
    
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) return res.json(JSON.parse(cachedData));

    const newsData = await fetchNewsFromAPIs(category, country, language);
    if (newsData.articles.length > 0) await redisClient.setEx(redisKey, 1800, JSON.stringify(newsData));
    
    res.json(newsData);
  } catch (error) {
    next(error);
  }
});

// Search News Route
app.get("/api/news/search", async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "Missing query parameter" });

  let results = { articles: [] };
  try {
    const newsAPIResponse = await axios.get(
      `https://newsapi.org/v2/everything?q=${query}&language=en&apiKey=${NEWSAPI_KEY}`
    );
    if (newsAPIResponse.data?.articles?.length > 0) results.articles.push(...newsAPIResponse.data.articles);
  } catch (error) {
    console.error("❌ NewsAPI Search Error:", error.response?.data || error.message);
  }
  try {
    const gnewsResponse = await axios.get(
      `https://gnews.io/api/v4/search?q=${query}&lang=en&apikey=${GNEWS_API_KEY}`
    );
    if (gnewsResponse.data?.articles?.length > 0) results.articles.push(...gnewsResponse.data.articles);
  } catch (error) {
    console.error("❌ GNews Search Error:", error.response?.data || error.message);
  }
  res.json(results);
});

// Mailchimp Subscription Route
app.post("/api/subscribe", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) return res.status(400).json({ error: "Invalid email address" });

    await mailchimp.lists.addListMember(MAILCHIMP_LIST_ID, { email_address: email, status: "subscribed" });
    res.json({ message: "Successfully subscribed!" });
  } catch (error) {
    next(error);
  }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));































