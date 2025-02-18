import React from 'react';

const NewsCategories = ({ categories }) => {
  return (
    <section className="news-options">
      <h2>Explore News by Category</h2>
      <div className="container">
        <div className="row">
          {categories.map((category, index) => (
            <div key={index} className="col-md-3 mb-4">
              <div className="card news-card">
                <img
                  src={category.image}
                  alt={category.title}
                  className="card-img-top"
                />
                <div className="card-body">
                  <h5 className="news-card-title">{category.title}</h5>
                  <p className="news-card-text">{category.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsCategories;