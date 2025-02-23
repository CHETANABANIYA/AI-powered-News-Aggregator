async function fetchPoliticsNews() {
  try {
    // ✅ Use your backend API URL
    const response = await fetch('https://ai-powered-news-aggregator.vercel.app/api/news?category=politics');

    if (!response.ok) throw new Error(`Failed to fetch news: ${response.statusText}`);

    const data = await response.json();
    const politicsContainer = document.getElementById('politics-news');

    if (!politicsContainer) {
      console.error('❌ Element #politics-news not found in DOM');
      return;
    }

    // ✅ Clear previous content
    politicsContainer.innerHTML = '';

    if (data.articles && data.articles.length > 0) {
      data.articles.forEach(article => {
        const newsItem = document.createElement('div');
        newsItem.className = 'col-md-4 mb-3'; // Bootstrap grid layout

        newsItem.innerHTML = `
          <div class="card h-100 shadow-sm">
            <img src="${article.image || 'https://via.placeholder.com/150'}" class="card-img-top" alt="News Image" onerror="this.src='https://via.placeholder.com/150'">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${article.title || 'No Title'}</h5>
              <p class="card-text">${article.description || 'No description available.'}</p>
              <a href="${article.url}" class="btn btn-primary mt-auto" target="_blank">Read More</a>
            </div>
          </div>
        `;

        politicsContainer.appendChild(newsItem);
      });
    } else {
      politicsContainer.innerHTML = '<p class="text-muted">No politics news available at the moment.</p>';
    }
  } catch (error) {
    console.error('❌ Error fetching politics news:', error);
    document.getElementById('politics-news').innerHTML = '<p class="text-danger">Failed to load politics news.</p>';
  }
}

// ✅ Fetch news after the page has fully loaded
window.onload = fetchPoliticsNews;


