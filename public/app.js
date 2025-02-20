async function fetchPoliticsNews() {
  try {
    // ✅ Use your deployed backend URL (change if needed)
    const response = await fetch('https://ai-powered-news-aggregator.vercel.app/api/news?category=politics');

    if (!response.ok) throw new Error('Failed to fetch news');

    const data = await response.json();
    const politicsContainer = document.getElementById('politics-news');

    if (data.articles && data.articles.length > 0) {
      politicsContainer.innerHTML = ''; // Clear previous content

      data.articles.forEach(article => {
        const newsItem = document.createElement('div');
        newsItem.className = 'col-md-4 mb-3';  // Bootstrap classes for grid layout

        newsItem.innerHTML = `
          <div class="card h-100 shadow-sm">
            <img src="${article.image || 'https://via.placeholder.com/150'}" class="card-img-top" alt="News Image">
            <div class="card-body">
              <h5 class="card-title">${article.title || 'No Title'}</h5>
              <p class="card-text">${article.description || 'No description available.'}</p>
              <a href="${article.url}" class="btn btn-primary" target="_blank">Read More</a>
            </div>
          </div>
        `;

        politicsContainer.appendChild(newsItem);
      });
    } else {
      politicsContainer.innerHTML = '<p>No politics news available at the moment.</p>';
    }
  } catch (error) {
    console.error('Error fetching politics news:', error);
    document.getElementById('politics-news').innerHTML = '<p>Failed to load politics news.</p>';
  }
}

// ✅ Fetch news when the page loads
document.addEventListener('DOMContentLoaded', fetchPoliticsNews);

