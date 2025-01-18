const express = require('express');
const axios = require('axios');
const path = require('path'); // To work with file paths

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your own API Key from NewsAPI
const API_KEY = 'c8f7bbd1aa7b4719ae619139984f2b08';

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// API route to fetch news
app.get('/api/news', async (req, res) => {
  const NEWS_API_URL = `https://newsapi.org/v2/top-headlines?category=technology&apiKey=${API_KEY}`;
  try {
    const response = await axios.get(NEWS_API_URL);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Serve the main index.html for all routes except the API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
