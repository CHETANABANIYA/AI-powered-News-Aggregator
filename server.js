require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const redis = require('redis');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ API Keys
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'c8f7bbd1aa7b4719ae619139984f2b08';
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || '10998e49626e56d8e92a5a9470f0d169';

// ✅ Enable CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://ai-news-aggregator-l1bikbomi-chetanabaniyas-projects.vercel.app"
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// ✅ Rate Limiting (50 requests per 10 minutes)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, try again later.' },
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
    const newsAPIResponse = await axios.get(newsAPIUrl);
    if (newsAPIResponse.data?.articles?.length > 0) {
      return newsAPIResponse.data;
    }
    console.warn("⚠️ NewsAPI returned no results. Trying GNews...");
  } catch (error) {
    console.error("❌ NewsAPI Error:", error.response?.data || error.message);
  }

  try {
    const gnewsResponse = await axios.get(gnewsAPIUrl);
    if (gnewsResponse.data?.articles?.length > 0) {
      return gnewsResponse.data;
    }
    console.warn("⚠️ GNews also returned no results.");
  } catch (error) {
    console.error("❌ GNews Error:", error.response?.data || error.message);
  }

  return { articles: [] };
};

// ✅ News API Route with Caching
app.get('/api/news', async (req, res) => {
  const { category = 'general', country = 'us', language = 'en' } = req.query;
  const redisKey = `news:${country}:${category}:${language}`;

  try {
    // ✅ Check Redis Cache
    const cachedData = await redisClient.get(redisKey);
    
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        if (parsedData.articles && Array.isArray(parsedData.articles)) {
          console.log("✅ Serving news from cache");
          return res.json(parsedData);
        } else {
          console.warn("⚠️ Cache contained invalid data. Fetching fresh news.");
        }
      } catch (parseError) {
        console.error("❌ Redis Cache Parsing Error:", parseError.message);
      }
    }

    // ✅ Fetch News from APIs
    const newsData = await fetchNewsFromAPIs(category, country, language);

    // ✅ Cache Valid Response
    if (newsData.articles.length > 0) {
      await redisClient.setEx(redisKey, 1800, JSON.stringify(newsData)); // Cache for 30 mins
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




