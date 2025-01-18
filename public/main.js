async function fetchNews() {
  try {
    const response = await fetch('/api/news'); // Assuming your frontend and backend are served from the same origin
    const newsData = await response.json();
    console.log(newsData);

    // Update the DOM with news articles
    displayNews(newsData.articles);
  } catch (error) {
    console.error('Error fetching news:', error);
  }
}

function displayNews(articles) {
  const newsContainer = document.getElementById('news-container');
  newsContainer.innerHTML = articles.map(article => `
    <div class="news-article">
      <h2>${article.title}</h2>
      <p>${article.description}</p>
      <a href="${article.url}" target="_blank">Read more</a>
    </div>
  `).join('');
}

fetchNews();
