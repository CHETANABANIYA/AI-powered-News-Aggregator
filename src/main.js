async function fetchNews(country = "us", category = "technology") {
  try {
    const response = await fetch(
      `https://ai-powered-news-aggregator-backend.onrender.com/api/news?country=${country}&category=${category}`
    );
    const newsData = await response.json();

    if (!newsData.articles || newsData.articles.length === 0) {
      throw new Error("No articles found.");
    }

    displayNews(newsData.articles);
  } catch (error) {
    console.error("Error fetching news:", error);
    document.getElementById("news-container").innerHTML = `<p>⚠️ Failed to load news. Please try again later.</p>`;
  }
}

function displayNews(articles) {
  const newsContainer = document.getElementById("news-container");
  newsContainer.innerHTML = articles
    .map(
      (article) => `
      <div class="news-article">
        <img src="${article.urlToImage || "placeholder.jpg"}" alt="News Image" />
        <h2>${article.title}</h2>
        <p>${article.description || "No description available."}</p>
        <small>${new Date(article.publishedAt).toLocaleString()}</small>
        <a href="${article.url}" target="_blank">Read more</a>
      </div>
    `
    )
    .join("");
}

// Call with default values
fetchNews();

