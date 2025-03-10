require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const redis = require('redis');
const rateLimit = require('express-rate-limit');
const mailchimp = require("@mailchimp/mailchimp_marketing");

const app = express();
const PORT = process.env.PORT || 5000;

// API Keys
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'c8f7bbd1aa7b4719ae619139984f2b08';
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || '10998e49626e56d8e92a5a9470f0d169';
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || "8a4236f395858305478b31637a3c3b9e-us11";
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID || "6918a248d2"; // Replace with your Audience ID
const REDIS_URL = process.env.REDIS_URL || "redis://default:AWr_AAIjcDFkYWI2MWQ2MTA1OTQ0NWE4YTFjYTVmN2FhMDVhM2UzZXAxMA@closing-mantis-27391.upstash.io:6379";

// Mailchimp Config
mailchimp.setConfig({
  apiKey: MAILCHIMP_API_KEY,
  server: "us11", // Change based on your Mailchimp API key prefix
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

// Rate Limiting (50 requests per 10 minutes)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, try again later.' },
});
app.use('/api/news', limiter);

// Redis Client Setup
const redisClient = redis.createClient({
  url: REDIS_URL,
  socket: { tls: true }
});

redisClient.on('error', (err) => console.error(`❌ Redis Error: ${err.message}`));
redisClient.connect()
  .then(() => console.log('✅ Connected to Redis'))
  .catch((err) => console.error('❌ Redis Connection Failed:', err.message));

// Function to Fetch News from APIs
const fetchNewsFromAPIs = async (category, country, language) => {
  const newsAPIUrl = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&language=${language}&apiKey=${NEWS_API_KEY}`;
  const gnewsAPIUrl = `https://gnews.io/api/v4/top-headlines?category=${category}&country=${country}&lang=${language}&apikey=${GNEWS_API_KEY}`;

  try {
    const newsAPIResponse = await axios.get(newsAPIUrl);
    if (newsAPIResponse.data?.articles?.length > 0) {
      return newsAPIResponse.data;
    }
    console.warn('⚠️ NewsAPI returned no results. Trying GNews...');
  } catch (error) {
    console.error('❌ NewsAPI Error:', error.response?.data || error.message);
  }

  try {
    const gnewsResponse = await axios.get(gnewsAPIUrl);
    if (gnewsResponse.data?.articles?.length > 0) {
      return gnewsResponse.data;
    }
    console.warn('⚠️ GNews also returned no results.');
  } catch (error) {
    console.error('❌ GNews Error:', error.response?.data || error.message);
  }

  return { articles: [] };
};

// News API Route with Caching
app.get('/api/news', async (req, res) => {
  const { category = 'general', country = 'us', language = 'en' } = req.query;
  const redisKey = `news:${country}:${category}:${language}`;

  try {
    // Check Redis Cache
    const cachedData = await redisClient.get(redisKey);
    
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        if (parsedData.articles && Array.isArray(parsedData.articles)) {
          console.log('✅ Serving news from cache');
          return res.json(parsedData);
        } else {
          console.warn('⚠️ Cache contained invalid data. Fetching fresh news.');
        }
      } catch (parseError) {
        console.error('❌ Redis Cache Parsing Error:', parseError.message);
      }
    }

    // Fetch News from APIs
    const newsData = await fetchNewsFromAPIs(category, country, language);

    // Cache Valid Response
    if (newsData.articles.length > 0) {
      await redisClient.setEx(redisKey, 1800, JSON.stringify(newsData)); // Cache for 30 mins
    }

    res.json(newsData);
  } catch (error) {
    console.error('❌ Error fetching news:', error.message);
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

    console.log("✅ Subscription successful:", email);
    res.json({ message: "Successfully subscribed!" });
  } catch (error) {
    console.error("❌ Mailchimp Error:", error.response?.text || error.message);
    res.status(500).json({ error: "Subscription failed. Try again later." });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
















