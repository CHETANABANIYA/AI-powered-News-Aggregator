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

import User from "./models/User.js";  // ✅ Corrected import
import Contact from "./models/Contact.js";  // ✅ Corrected import

// Load environment variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.set("trust proxy", 1);

// ✅ Validate Required Environment Variables
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

// ✅ API Keys & Configurations
const {
  NEWSAPI_KEY, GNEWS_API_KEY, MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID,
  REDIS_URL, SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, JWT_SECRET, MONGO_URI
} = process.env;

// ✅ Define ContactMessage Model
const contactMessageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});
const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

// ✅ Mailchimp Config
mailchimp.setConfig({ apiKey: MAILCHIMP_API_KEY, server: "us11" });

// ✅ Redis Setup
const redisClient = createClient({ url: REDIS_URL });

redisClient.on("error", (err) => console.error(`❌ Redis Error: ${err.message}`));

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Connected to Redis");
  } catch (error) {
    console.error("❌ Redis Connection Error:", error.message);
  }
})();

// ✅ CORS Configuration
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

// ✅ Apply Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

// ✅ Session Middleware (Ensures session & cookies work)
app.use(
    session({
        store: new RedisStore({ client: redisClient }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production", // Secure only in production
            httpOnly: true, // Prevents client-side access
            sameSite: "Lax", // Ensures compatibility
        },
    })
);

// ✅ Debugging: Log session & user
app.use((req, res, next) => {
    console.log("🔍 Session:", req.session);
    console.log("👤 User:", req.user);
    next();
});

// ✅ Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ Test Session Route
app.get("/test-session", (req, res) => {
    res.json({ session: req.session, user: req.user });
});

// ✅ Middleware Setup
app.use(cors());
app.use(express.json());

// ✅ Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  )
);

// ✅ Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: FACEBOOK_CLIENT_ID,
      clientSecret: FACEBOOK_CLIENT_SECRET,
      callbackURL: "/api/auth/facebook/callback",
      profileFields: ["id", "displayName", "photos", "email"],
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// ✅ Generate JWT Token
const generateToken = (email) => jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

// ✅ Fetch News from APIs
const fetchNewsFromAPIs = async (category, country, language) => {
  try {
    const newsAPIResponse = await axios.get(
      `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&language=${language}&apiKey=${NEWSAPI_KEY}`
    );
    if (newsAPIResponse.data?.articles?.length > 0) return newsAPIResponse.data;
  } catch (error) {
    console.error("❌ NewsAPI Error:", error.message);
  }
  try {
    const gnewsResponse = await axios.get(
      `https://gnews.io/api/v4/top-headlines?category=${category}&country=${country}&lang=${language}&apikey=${GNEWS_API_KEY}`
    );
    if (gnewsResponse.data?.articles?.length > 0) return gnewsResponse.data;
  } catch (error) {
    console.error("❌ GNews Error:", error.message);
  }
  return { articles: [] };
};

// ✅ News Route with Caching
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

// ✅ Search News Route
app.get("/api/news/search", async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "Missing query parameter" });
  let results = { articles: [] };
  try {
    const newsAPIResponse = await axios.get(
      `https://newsapi.org/v2/everything?q=${query}&language=en&apiKey=${NEWSAPI_KEY}`
    );
    if (newsAPIResponse.data?.articles?.length > 0) results.articles = [...newsAPIResponse.data.articles];
  } catch (error) {
    console.error("❌ NewsAPI Search Error:", error.response?.data || error.message);
  }
  try {
    const gnewsResponse = await axios.get(
      `https://gnews.io/api/v4/search?q=${query}&lang=en&apikey=${GNEWS_API_KEY}`
    );
    if (gnewsResponse.data?.articles?.length > 0) results.articles = [...results.articles, ...gnewsResponse.data.articles];
  } catch (error) {
    console.error("❌ GNews Search Error:", error.response?.data || error.message);
  }
  res.json(results);
});

// ✅ Mailchimp Subscription Route
app.post("/api/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) return res.status(400).json({ error: "Invalid email address" });

    await mailchimp.lists.addListMember(MAILCHIMP_LIST_ID, { email_address: email, status: "subscribed" });
    res.json({ message: "Successfully subscribed!" });
  } catch (error) {
    if (error.response?.body?.title === "Member Exists") {
      return res.status(400).json({ error: "Email is already subscribed" });
    }
    console.error("❌ Mailchimp Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Contact Form Route (Saves to MongoDB)
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const newMessage = new ContactMessage({ name, email, message });
    await newMessage.save();
    res.json({ message: "Message saved successfully!" });
  } catch (error) {
    console.error("❌ Contact Form Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Manual Login Route (Fix)
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken(user.email);
    res.json({ message: "Login successful!", token });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Manual Signup Route
// ✅ Signup Route Debugging
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("Signup Attempt:", req.body);  // ✅ Debugging Output

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    console.log("✅ New User Saved:", newUser); // ✅ Debugging Output

    res.json({ message: "Signup successful! Please login." });
  } catch (error) {
    console.error("❌ Signup Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// ✅ Google OAuth Strategy (Fix: Use Full Callback URL)

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://ai-powered-news-aggregator-backend.onrender.com/api/auth/google/callback",
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        user = new User({ 
          name: profile.displayName, 
          email: profile.emails[0].value,
          password: "",
        });
        await user.save();
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
}));

// ✅ Facebook OAuth Strategy (Fix: Use Full Callback URL)

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "https://ai-powered-news-aggregator-backend.onrender.com/api/auth/facebook/callback",
    profileFields: ["id", "displayName", "emails"],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        user = new User({ 
          name: profile.displayName, 
          email: profile.emails[0].value,
          password: "",
        });
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

// ✅ Google Auth Routes
app.get('/api/auth/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email']  // ✅ REQUIRED SCOPES
  })
);

app.get("/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("https://ai-powered-news-aggregator.vercel.app");
  }
);

// ✅ Facebook Auth Routes (Fix: Remove duplicate)
app.get("/api/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
app.get("/api/auth/facebook/callback", passport.authenticate("facebook", {
  failureRedirect: "/login",
}), (req, res) => {
  res.redirect("https://ai-powered-news-aggregator.vercel.app");
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));































