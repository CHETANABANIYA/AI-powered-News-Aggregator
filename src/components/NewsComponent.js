import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NewsComponent = () => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    // Replace with your backend API URL
    axios.get('https://ai-news-aggregator-l1bikbomi-chetanabaniyas-projects.vercel.app/api/news')
      .then(response => {
        setArticles(response.data.articles);
      })
      .catch(error => {
        console.error('Error fetching the news:', error);
      });
  }, []);

  return (
    <div>
      <h1>News Articles</h1>
      <ul>
        {articles.map((article, index) => (
          <li key={index}>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              {article.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NewsComponent;
