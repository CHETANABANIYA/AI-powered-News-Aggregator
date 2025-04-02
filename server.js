import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import cors from "cors";
import session from "express-session";
import RedisStore from "connect-redis";
import { createClient } from "redis";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import mailchimp from "@mailchimp/mailchimp_marketing";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import User from "./models/User.js";
import Contact from "./models/Contact.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Ensure Required Environment Variables Are Loaded
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

const {
  NEWSAPI_KEY, GNEWS_API_KEY, MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID,
  REDIS_URL, SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, JWT_SECRET, MONGO_URI
} = process.env;

// ✅ MongoDB Connection
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Redis Client Setup (Fixed `await` issue)
let redisClient;
(async () => {
  redisClient = createClient({ url: REDIS_URL });
  redisClient.on("error", (err) => console.error(`❌ Redis Error: ${err.message}`));
  await redisClient.connect();
  console.log("✅ Connected to Redis");
})();

// ✅ Mailchimp Configuration
mailchimp.setConfig({ apiKey: MAILCHIMP_API_KEY, server: "us11" });

// ✅ Middleware
app.use(cors({
  origin: "https://ai-powered-news-aggregator.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ✅ Session Middleware
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, sameSite: "none" }
}));

// ✅ Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// ✅ Security Headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://ai-powered-news-aggregator.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// ✅ News Route (Fixed CORS and 500 Error)
app.get("/api/news", async (req, res) => {
  try {
    const { category = "general", country = "us", language = "en" } = req.query;
    const redisKey = `news:${country}:${category}:${language}`;
    
    // ✅ Check Redis Cache
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) return res.json(JSON.parse(cachedData));

    // ✅ Fetch News from API
    const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
      params: { country, category, language, apiKey: NEWSAPI_KEY },
    });

    if (response.status !== 200) {
      throw new Error(`❌ News API Error: ${response.status} ${response.statusText}`);
    }

    // ✅ Store in Redis & Send Response
    await redisClient.setEx(redisKey, 1800, JSON.stringify(response.data));
    res.json(response.data);
  } catch (error) {
    console.error("❌ Error Fetching News:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "https://ai-powered-news-aggregator-backend.onrender.com/api/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
      user = new User({ name: profile.displayName, email: profile.emails[0].value, password: "" });
      await user.save();
    }
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// ✅ Facebook OAuth Strategy
passport.use(new FacebookStrategy({
  clientID: FACEBOOK_CLIENT_ID,
  clientSecret: FACEBOOK_CLIENT_SECRET,
  callbackURL: "https://ai-powered-news-aggregator-backend.onrender.com/api/auth/facebook/callback",
  profileFields: ["id", "displayName", "emails"],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
      user = new User({ name: profile.displayName, email: profile.emails[0].value, password: "" });
      await user.save();
    }
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ✅ OAuth Routes
app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/api/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  res.redirect("https://ai-powered-news-aggregator.vercel.app");
});

app.get("/api/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
app.get("/api/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), (req, res) => {
  res.redirect("https://ai-powered-news-aggregator.vercel.app");
});

// ✅ Mailchimp Subscription Route
app.post("/api/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email.includes("@")) return res.status(400).json({ error: "Invalid email address" });

    await mailchimp.lists.addListMember(MAILCHIMP_LIST_ID, { email_address: email, status: "subscribed" });
    res.json({ message: "Successfully subscribed!" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

