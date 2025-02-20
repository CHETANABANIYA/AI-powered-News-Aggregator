const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ API Keys from .env
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

// ✅ Enable CORS for frontend (Allow all domains for now)
app.use(cors({
  origin: '*', // Change this to your frontend URL in production
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
}));

// ✅ Supported categories for NewsAPI
const NEWSAPI_CATEGORIES = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];

// ✅ Map NewsAPI categories to GNews topics
const GNEWS_TOPICS = {
  business: 'business',
  entertainment: 'entertainment',
  general: 'general',
  health: 'health',
  science: 'science',
  sports: 'sports',
  technology: 'technology',
};

// ✅ Default fallback image
const DEFAULT_IMAGE = 'https://via.placeholder.com/150?text=No+Image';

// ✅ Route to fetch news
app.get('/api/news', async (req, res) => {
  try {
    const category = req.query.category || 'general';
    const country = req.query.country || 'us';

    let url;
    let useGNews = ['in', 'jp', 'ca'].includes(country); // Use GNews for India, Japan, and Canada

    if (useGNews) {
      const topic = GNEWS_TOPICS[category] || 'general';
      url = `https://gnews.io/api/v4/top-headlines?token=${GNEWS_API_KEY}&lang=en&max=10&topic=${topic}`;
    } else {
      url = `https://newsapi.org/v2/top-headlines?apiKey=${NEWSAPI_KEY}&pageSize=10&language=en&country=${country}`;
      if (NEWSAPI_CATEGORIES.includes(category)) url += `&category=${category}`;
      else if (category === 'crypto') url = `https://newsapi.org/v2/everything?q=cryptocurrency&apiKey=${NEWSAPI_KEY}&pageSize=10&language=en`;
      else if (category === 'stockmarket') url = `https://newsapi.org/v2/everything?q=stock%20market&apiKey=${NEWSAPI_KEY}&pageSize=10&language=en`;
      else if (category === 'education') url = `https://newsapi.org/v2/everything?q=education&apiKey=${NEWSAPI_KEY}&pageSize=10&language=en`;
    }

    let response = await axios.get(url);

    // 🔹 If no articles, fallback to /everything for broader results
    if (response.data.articles.length === 0 && !useGNews) {
      url = `https://newsapi.org/v2/everything?q=${category}&language=en&apiKey=${NEWSAPI_KEY}&pageSize=10`;
      response = await axios.get(url);
    }

    // ✅ Normalize response format
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
    console.error('Error fetching news:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching news', error: error.response ? error.response.data : error.message });
  }
});

// ✅ Server Listener
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});




