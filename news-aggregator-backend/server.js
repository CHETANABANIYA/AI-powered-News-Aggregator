import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mailchimp from "@mailchimp/mailchimp_marketing";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import session from "express-session";
import RedisStore from "connect-redis";
import { createClient } from "redis";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser"; // ✅ FIXED

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

// ✅ Redis Client Setup (Fixed Duplicate)
const redisClient = createClient({ url: REDIS_URL });
redisClient.on("error", (err) => console.error(`❌ Redis Error: ${err.message}`));
await redisClient.connect();
console.log("✅ Connected to Redis");

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
app.use(cookieParser()); // ✅ FIXED

// ✅ Session Middleware (Removed Duplicate)
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

// ✅ Google OAuth Strategy (Fixed Callback URL)
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

// ✅ Facebook OAuth Strategy (Fixed Callback URL)
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

// ✅ News Route
app.get("/api/news", async (req, res) => {
  const { category = "general", country = "us", language = "en" } = req.query;
  const redisKey = `news:${country}:${category}:${language}`;
  const cachedData = await redisClient.get(redisKey);

  if (cachedData) return res.json(JSON.parse(cachedData));

  const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&language=${language}&apiKey=${NEWSAPI_KEY}`);
  await redisClient.setEx(redisKey, 1800, JSON.stringify(response.data));
  res.json(response.data);
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

// ✅ Contact Form Route
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: "All fields are required" });

    await Contact.create({ name, email, message });
    res.json({ message: "Message saved successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

