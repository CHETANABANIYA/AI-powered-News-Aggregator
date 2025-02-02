// Fetch news from the backend API
async function fetchNews(category = 'technology') {
  // Corrected the URL to be a string
  const url = `https://ai-news-aggregator-l1bikbomi-chetanabaniyas-projects.vercel.app/api/news?category=${category}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    displayNews(data.articles);
  } catch (error) {
    console.error('Error fetching news:', error);
  }
}

// Display news on the page
function displayNews(articles) {
  const container = document.querySelector('.news-options .container');
  container.innerHTML = ''; // Clear existing content

  if (articles.length === 0) {
    container.innerHTML = '<p>No news articles found for this category.</p>';
    return;
  }

  articles.forEach(article => {
    const cardHTML = `
      <div class="col-md-3 mb-4">
        <div class="card news-card">
          <img src="${article.urlToImage || 'images/placeholder.jpg'}" alt="${article.title}">
          <div class="card-body">
            <h5 class="news-card-title">${article.title}</h5>
            <p class="news-card-text">${article.description || 'No description available.'}</p>
            <a href="${article.url}" target="_blank" class="btn btn-primary">Read More</a>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += cardHTML;
  });
}

// Event listener for category changes (if applicable)
document.querySelectorAll('.category-link').forEach(link => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const category = event.target.dataset.category;
    fetchNews(category);
  });
});

// Fetch default category news on page load
fetchNews();

