import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mailchimp from "@mailchimp/mailchimp_marketing";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import session from "express-session";
import Redis from "redis";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.set("trust proxy", 1);

// ✅ Validate Required Environment Variables
const requiredEnvVars = [
  "NEWSAPI_KEY", "GNEWS_API_KEY", "MAILCHIMP_API_KEY", "MAILCHIMP_LIST_ID",
  "REDIS_URL", "SESSION_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
  "FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET"
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
  FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET
} = process.env;

// ✅ Mailchimp Config
mailchimp.setConfig({ apiKey: MAILCHIMP_API_KEY, server: "us11" });

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

// ✅ Session & Passport Setup
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

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

// ✅ Authentication Routes
app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => res.redirect("https://ai-powered-news-aggregator.vercel.app")
);

app.get("/api/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
app.get(
  "/api/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/" }),
  (req, res) => res.redirect("https://ai-powered-news-aggregator.vercel.app")
);

// ✅ Rate Limiting
app.use(
  "/api/news",
  rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 50,
    message: { error: "Too many requests, try again later." },
  })
);

// ✅ Redis Setup
const redisClient = Redis.createClient({ url: REDIS_URL, socket: { tls: true } });

redisClient.on("error", (err) => console.error(`❌ Redis Error: ${err.message}`));
redisClient.connect().then(() => console.log("✅ Connected to Redis"));

// ✅ Fetch News from APIs
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

// ✅ News Route with Caching
app.get("/api/news", async (req, res) => {
  const { category = "general", country = "us", language = "en" } = req.query;
  const redisKey = `news:${country}:${category}:${language}`;
  try {
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) return res.json(JSON.parse(cachedData));
    const newsData = await fetchNewsFromAPIs(category, country, language);
    if (newsData.articles.length > 0) await redisClient.setEx(redisKey, 1800, JSON.stringify(newsData));
    res.json(newsData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news" });
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
  const { email } = req.body;
  if (!email || !email.includes("@")) return res.status(400).json({ error: "Invalid email address" });
  try {
    await mailchimp.lists.addListMember(MAILCHIMP_LIST_ID, { email_address: email, status: "subscribed" });
    res.json({ message: "Successfully subscribed!" });
  } catch (error) {
    res.status(500).json({ error: "Subscription failed. Try again later." });
  }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));





















