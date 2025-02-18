const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// Enable CORS for your frontend (Netlify URL)
app.use(cors({
  origin: 'https://ainewsify-news.netlify.app',  // Frontend URL
}));

const API_KEY = 'c8f7bbd1aa7b4719ae619139984f2b08';  // Your NewsAPI key

// Define the route to fetch news
app.get('/api/news', async (req, res) => {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?category=technology&apiKey=${API_KEY}`
    );
    res.json(response.data);  // Send fetched news data to the frontend
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
