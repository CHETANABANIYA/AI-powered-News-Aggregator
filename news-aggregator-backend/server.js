require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const redis = require('redis');
const rateLimit = require('express-rate-limit');
const mailchimp = require("@mailchimp/mailchimp_marketing");

const app = express();
const PORT = process.env.PORT || 5000;
const NEWSAPI_KEY = 'c8f7bbd1aa7b4719ae619139984f2b08';
const GNEWS_API_KEY = '10998e49626e56d8e92a5a9470f0d169';

// ✅ Configure Mailchimp
mailchimp.setConfig({
  apiKey: "1b7aa6e1ad559385ac874c0074c37f9a-us11", // Your Mailchimp API Key
  server: "us11", // Extracted from your API key (last part after "-")
});

// ✅ Redis client setup with error handling
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.error(`❌ Redis Error: ${err}`));
redisClient.connect().catch(console.error);

// ✅ Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:3000', 'https://ai-powered-news-aggregator.vercel.app'],
}));

// ✅ Rate Limiting (Prevents excessive requests)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // Limit each IP to 50 requests per window
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/news', limiter);

// ✅ Supported categories for NewsAPI
const NEWSAPI_CATEGORIES = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];

// ✅ Supported countries
const SUPPORTED_COUNTRIES = [
  "us", "in", "gb", "de", "sg", "it", "fr", "jp", "br", "ca", "ae", "tr", "se", "ch", "nl", "id", "sa", "ar", "za", "mx", "ru", "kr", "cn", "es", "au"
];

// ✅ Supported languages
const SUPPORTED_LANGUAGES = ["en", "fr", "es", "hi", "ja", "de", "ru", "zh"];

// ✅ Fetch News Route (Uses GNews first, then NewsAPI if needed)
app.get('/api/news', async (req, res) => {
  const category = req.query.category || 'general';
  const country = req.query.country || 'us';
  let language = req.query.language || 'en';

  // ✅ Validate language
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    console.warn(`⚠️ Unsupported language: ${language}, defaulting to English`);
    language = 'en';
  }

  const cacheKey = `news:${country}:${category}:${language}`;

  try {
    // 🔹 Check Redis Cache First
    const cachedNews = await redisClient.get(cacheKey);
    if (cachedNews) {
      console.log(`🟢 Serving cached news for ${country} - ${category} - ${language}`);
      return res.json({ articles: JSON.parse(cachedNews) });
    }

    let url;
    let response;

    console.log(`🔹 Fetching news for ${country} in ${language} from GNews...`);
    url = `https://gnews.io/api/v4/top-headlines?category=${category}&country=${country}&lang=${language}&max=10&apikey=${GNEWS_API_KEY}`;
    response = await axios.get(url);

    // 🔹 If GNews fails, fallback to NewsAPI
    if (!response.data.articles || response.data.articles.length === 0) {
      console.log(`⚠️ No results from GNews. Trying NewsAPI...`);
      url = `https://newsapi.org/v2/top-headlines?apiKey=${NEWSAPI_KEY}&pageSize=10&language=${language}&country=${country}`;
      if (NEWSAPI_CATEGORIES.includes(category)) url += `&category=${category}`;
      response = await axios.get(url);
    }

    // ✅ Format response
    const formattedArticles = response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.urlToImage || article.image || 'https://via.placeholder.com/1200x500',
      source: article.source?.name || 'Unknown',
      publishedAt: article.publishedAt,
    }));

    console.log(`✅ Fetched ${formattedArticles.length} articles for ${country} in ${language}`);

    // 🔹 Store in Redis cache (expires in 10 minutes)
    await redisClient.setEx(cacheKey, 600, JSON.stringify(formattedArticles));

    res.json({ articles: formattedArticles });
  } catch (error) {
    console.error('❌ Error fetching news:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching news', error: error.response ? error.response.data : error.message });
  }
});

// ✅ Fetch Top Headlines for the Carousel
app.get('/api/top-headlines', async (req, res) => {
  const country = req.query.country || 'us';
  const cacheKey = `topHeadlines:${country}`;

  try {
    // 🔹 Check Redis Cache First
    const cachedHeadlines = await redisClient.get(cacheKey);
    if (cachedHeadlines) {
      console.log(`🟢 Serving cached headlines for ${country}`);
      return res.json({ articles: JSON.parse(cachedHeadlines) });
    }

    console.log(`🔹 Fetching top headlines for ${country}...`);
    let url = `https://gnews.io/api/v4/top-headlines?country=${country}&lang=en&max=5&apikey=${GNEWS_API_KEY}`;
    let response = await axios.get(url);

    if (!response.data.articles || response.data.articles.length === 0) {
      console.log(`⚠️ No results from GNews. Trying NewsAPI...`);
      url = `https://newsapi.org/v2/top-headlines?apiKey=${NEWSAPI_KEY}&pageSize=5&language=en&country=${country}`;
      response = await axios.get(url);
    }

    // ✅ Format response
    const formattedArticles = response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.urlToImage || article.image || 'https://via.placeholder.com/1200x500',
      source: article.source?.name || 'Unknown',
      publishedAt: article.publishedAt,
    }));

    console.log(`✅ Fetched ${formattedArticles.length} top headlines for ${country}`);

    // 🔹 Store in Redis cache (expires in 10 minutes)
    await redisClient.setEx(cacheKey, 600, JSON.stringify(formattedArticles));

    res.json({ articles: formattedArticles });
  } catch (error) {
    console.error('❌ Error fetching top headlines:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Error fetching top headlines', error: error.response ? error.response.data : error.message });
  }
});

// ✅ API Endpoint to Fetch Supported Countries
app.get("/api/countries", (req, res) => res.json(SUPPORTED_COUNTRIES));

// ✅ API Endpoint to Fetch Supported Languages
app.get("/api/languages", (req, res) => res.json(SUPPORTED_LANGUAGES));

// ✅ Email Subscription Endpoint
app.post("/api/subscribe", express.json(), async (req, res) => {
  const { email } = req.body;
  const audienceId = "6918a248d2"; // Your Mailchimp Audience ID

  if (!email) {
    return res.status(400).json({ error: "Email is required!" });
  }

  const subscriberHash = require("crypto").createHash("md5").update(email.toLowerCase()).digest("hex");

  try {
    // 🔹 Check if user exists
    await mailchimp.lists.getListMember(audienceId, subscriberHash);

    // 🔹 If exists, update the subscription status
    await mailchimp.lists.updateListMember(audienceId, subscriberHash, {
      status: "subscribed",
    });

    console.log(`✅ Updated existing subscriber: ${email}`);
    res.json({ message: "You're already subscribed, your status is updated!" });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // 🔹 If not found, add as a new subscriber
      try {
        await mailchimp.lists.addListMember(audienceId, {
          email_address: email,
          status: "subscribed",
        });

        console.log(`✅ New subscriber added: ${email}`);
        res.json({ message: "Successfully subscribed!" });
      } catch (addError) {
        console.error("❌ Mailchimp add error:", addError.response ? addError.response.text : addError.message);
        res.status(500).json({ error: "Subscription failed. Try again later!" });
      }
    } else {
      console.error("❌ Mailchimp error:", error.response ? error.response.text : error.message);
      res.status(500).json({ error: "Subscription failed. Try again later!" });
    }
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});












