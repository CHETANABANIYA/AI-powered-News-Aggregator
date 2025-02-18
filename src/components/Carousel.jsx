import React from 'react';

const Carousel = () => {
  return (
    <div id="newsCarousel" className="carousel slide" data-bs-ride="carousel">
      <div className="carousel-inner">
        <div className="carousel-item active">
          <img
            src="https://via.placeholder.com/1200x500?text=Trending+News+1"
            className="d-block w-100"
            alt="Trending News 1"
          />
        </div>
        <div className="carousel-item">
          <img
            src="https://via.placeholder.com/1200x500?text=Trending+News+2"
            className="d-block w-100"
            alt="Trending News 2"
          />
        </div>
        <div className="carousel-item">
          <img
            src="https://via.placeholder.com/1200x500?text=Trending+News+3"
            className="d-block w-100"
            alt="Trending News 3"
          />
        </div>
      </div>
      <a
        className="carousel-control-prev"
        href="#newsCarousel"
        role="button"
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
      </a>
      <a
        className="carousel-control-next"
        href="#newsCarousel"
        role="button"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
      </a>
    </div>
  );
};

export default Carousel;