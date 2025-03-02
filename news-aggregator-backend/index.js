const express = require('express');
const axios = require('axios');
const cors = require('cors');
const redis = require('redis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Allowed Frontend Origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://ainewsify-news.netlify.app',
  'https://ai-powered-news-aggregator.vercel.app',
  'https://ai-powered-news-aggregator-3om085y9l-chetanabaniyas-projects.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ✅ API Keys
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

if (!NEWSAPI_KEY || !GNEWS_API_KEY) {
  console.error('❌ Missing API Keys: Check your .env file or environment variables.');
  process.exit(1);
}

// ✅ Redis Cache Setup (Same as `server.js`)
const REDIS_URL = process.env.REDIS_URL || "redis://your-upstash-redis-url";
const redisClient = redis.createClient({ url: REDIS_URL, socket: { tls: true } });

redisClient.on('error', (err) => console.error(`❌ Redis Error: ${err.message}`));
redisClient.connect()
  .then(() => console.log('✅ Connected to Redis'))
  .catch((err) => console.error('❌ Redis Connection Failed:', err.message));

// ✅ News API Route with Improved Caching & Query Handling
app.get('/api/news', async (req, res) => {
  const category = req.query.category || 'general';
  const country = req.query.country || 'us';
  const redisKey = `news:${country}:${category}`;

  try {
    // 🔹 Check Redis Cache First
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      console.log('✅ Serving news from cache');
      return res.json(JSON.parse(cachedData));
    }

    let url;
    const useGNews = ['in', 'jp', 'ca'].includes(country);

    if (useGNews) {
      url = `https://gnews.io/api/v4/top-headlines?token=${GNEWS_API_KEY}&lang=en&max=10&topic=${category}`;
    } else {
      url = `https://newsapi.org/v2/top-headlines?apiKey=${NEWSAPI_KEY}&pageSize=10&language=en&country=${country}&category=${category}`;
    }

    const response = await axios.get(url);

    // 🔹 Fallback to 'everything' endpoint if no articles found (NewsAPI only)
    if (response.data.articles.length === 0 && !useGNews) {
      const fallbackUrl = `https://newsapi.org/v2/everything?q=${category}&language=en&apiKey=${NEWSAPI_KEY}&pageSize=10`;
      const fallbackResponse = await axios.get(fallbackUrl);
      response.data.articles = fallbackResponse.data.articles;
    }

    const formattedArticles = response.data.articles.map(article => ({
      title: article.title || 'No Title',
      description: article.description || 'No Description',
      url: article.url || '#',
      image: article.urlToImage || article.image || 'https://via.placeholder.com/150?text=No+Image',
      source: article.source?.name || 'Unknown',
      publishedAt: article.publishedAt || 'No Date'
    }));

    // 🔹 Cache the response for 30 minutes
    await redisClient.setEx(redisKey, 1800, JSON.stringify({ articles: formattedArticles }));

    res.json({ articles: formattedArticles });
  } catch (error) {
    console.error('❌ Error fetching news:', error.response?.data || error.message);
    res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
  }
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Backend Error:', err.message);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});









