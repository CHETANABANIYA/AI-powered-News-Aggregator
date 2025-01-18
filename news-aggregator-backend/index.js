const express = require('express');
const axios = require('axios');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());

app.get('/get-news', async (req, res) => {
  const category = req.query.category || 'general';
  const apiKey = process.env.NEWS_API_KEY;
  try {
    const response = await axios.get(https://newsapi.org/v2/top-headlines?category=${category}&apiKey=${apiKey});
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.listen(PORT, () => {
  console.log(Server is running on http://localhost:${PORT});
});
