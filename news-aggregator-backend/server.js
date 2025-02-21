require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const redis = require('redis');
const rateLimit = require('express-rate-limit');
const mailchimp = require("@mailchimp/mailchimp_marketing");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Enable CORS for all origins (temporary fix for debugging)
app.use(cors({
  origin: '*', // Change this later to restrict specific domains
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type'
}));

app.use(express.json()); // Ensure JSON request bodies are handled

// ✅ Rate Limiting (Prevents excessive requests)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // Limit each IP to 50 requests per window
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/news', limiter);

// ✅ Redis client setup with error handling
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.error(`❌ Redis Error: ${err}`));
redisClient.connect().catch(console.error);

// ✅ News API Route
app.get('/api/news', async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // ✅ Explicitly allow CORS for this route
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { category = 'general', country = 'us', language = 'en' } = req.query;

  try {
    const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&language=${language}&apiKey=c8f7bbd1aa7b4719ae619139984f2b08`);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching news:", error.message);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});













