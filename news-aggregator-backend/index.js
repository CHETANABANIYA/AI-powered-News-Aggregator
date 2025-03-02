const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed Frontend Origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://ainewsify-news.netlify.app',
  'https://ai-news-aggregator-l1bikbomi-chetanabaniyas-projects.vercel.app',
  'https://ai-powered-news-aggregator-3om085y9l-chetanabaniyas-projects.vercel.app'
];

// CORS Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Keys from .env
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

if (!NEWSAPI_KEY || !GNEWS_API_KEY) {
  console.error('❌ Missing API Keys: Check your .env file or environment variables.');
  process.exit(1);
}

// Supported Categories
const NEWSAPI_CATEGORIES = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
const GNEWS_TOPICS = {
  business: 'business',
  entertainment: 'entertainment',
  general: 'general',
  health: 'health',
  science: 'science',
  sports: 'sports',
  technology: 'technology'
};

const DEFAULT_IMAGE = 'https://via.placeholder.com/150?text=No+Image';

// Route to Fetch News
app.get('/api/news', async (req, res) => {
  try {
    const category = req.query.category || 'general';
    const country = req.query.country || 'us';

    let url;
    const useGNews = ['in', 'jp', 'ca'].includes(country);

    if (useGNews) {
      const topic = GNEWS_TOPICS[category] || 'general';
      url = `https://gnews.io/api/v4/top-headlines?token=${GNEWS_API_KEY}&lang=en&max=10&topic=${topic}`;
    } else {
      url = `https://newsapi.org/v2/top-headlines?apiKey=${NEWSAPI_KEY}&pageSize=10&language=en&country=${country}`;
      if (NEWSAPI_CATEGORIES.includes(category)) {
        url += `&category=${category}`;
      } else {
        const categoryQueries = {
          crypto: 'cryptocurrency',
          stockmarket: 'stock market',
          education: 'education'
        };
        url = `https://newsapi.org/v2/everything?q=${categoryQueries[category] || category}&apiKey=${NEWSAPI_KEY}&pageSize=10&language=en`;
      }
    }

    const response = await axios.get(url);

    // Fallback to 'everything' endpoint if no articles found (only for NewsAPI)
    if (response.data.articles.length === 0 && !useGNews) {
      const fallbackUrl = `https://newsapi.org/v2/everything?q=${category}&language=en&apiKey=${NEWSAPI_KEY}&pageSize=10`;
      const fallbackResponse = await axios.get(fallbackUrl);
      response.data.articles = fallbackResponse.data.articles;
    }

    const formattedArticles = response.data.articles.map(article => ({
      title: article.title || 'No Title',
      description: article.description || 'No Description',
      url: article.url || '#',
      image: article.urlToImage || article.image || DEFAULT_IMAGE,
      source: article.source?.name || 'Unknown',
      publishedAt: article.publishedAt || 'No Date'
    }));

    res.json({ articles: formattedArticles });
  } catch (error) {
    console.error('❌ Error fetching news:', error.response?.data || error.message);
    res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Backend Error:', err.message);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Server Listener
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});








