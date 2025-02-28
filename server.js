require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const redis = require('redis');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ API Keys from .env
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'c8f7bbd1aa7b4719ae619139984f2b08';
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || '10998e49626e56d8e92a5a9470f0d169';

// ✅ Enable CORS (Allow only frontend URLs)
const allowedOrigins = ["http://localhost:3000", "https://ai-news-aggregator-l1bikbomi-chetanabaniyas-projects.vercel.app"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked request from: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// ✅ Rate Limiting (Prevents excessive requests)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/news', limiter);

// ✅ Redis Client Setup
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.error(`❌ Redis Error: ${err}`));
redisClient.connect().catch(console.error);

// ✅ Function to Fetch News from APIs
const fetchNewsFromAPIs = async (category, country, language) => {
  const newsAPIUrl = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&language=${language}&apiKey=${NEWS_API_KEY}`;
  const gnewsAPIUrl = `https://gnews.io/api/v4/top-headlines?category=${category}&country=${country}&lang=${language}&apikey=${GNEWS_API_KEY}`;

  try {
    // ✅ Try NewsAPI First
    const newsAPIResponse = await axios.get(newsAPIUrl);
    if (newsAPIResponse.data.articles && newsAPIResponse.data.articles.length > 0) {
      return newsAPIResponse.data;
    }
    console.warn("⚠️ NewsAPI returned no results. Trying GNews...");
  } catch (error) {
    console.error("❌ NewsAPI Error:", error.response?.data || error.message);
  }

  try {
    // ✅ Try GNews as Fallback
    const gnewsResponse = await axios.get(gnewsAPIUrl);
    if (gnewsResponse.data.articles && gnewsResponse.data.articles.length > 0) {
      return gnewsResponse.data;
    }
    console.warn("⚠️ GNews also returned no results.");
  } catch (error) {
    console.error("❌ GNews Error:", error.response?.data || error.message);
  }

  // ✅ If both fail, return empty response
  return { articles: [] };
};

// ✅ News API Route with Caching
app.get('/api/news', async (req, res) => {
  const { category = 'general', country = 'us', language = 'en' } = req.query;
  const redisKey = `news:${country}:${category}:${language}`;

  try {
    // ✅ Check cache first
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      console.log("✅ Serving news from cache");
      return res.json(JSON.parse(cachedData));
    }

    // ✅ Fetch news from APIs
    const newsData = await fetchNewsFromAPIs(category, country, language);

    // ✅ Cache result if data is found
    if (newsData.articles.length > 0) {
      await redisClient.setEx(redisKey, 1800, JSON.stringify(newsData)); // Cache for 30 minutes
    }

    res.json(newsData);
  } catch (error) {
    console.error("❌ Error fetching news:", error.message);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


