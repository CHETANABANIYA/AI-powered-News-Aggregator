import React, { useEffect, useState } from 'react';
import HeroSection from './HeroSection';
import Carousel from './Carousel';
import NewsCategories from './NewsCategories';
import SubscriptionSection from './SubscriptionSection';

const Home = () => {
  const [newsLoaded, setNewsLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setNewsLoaded(true), 1000); // Simulating API load
  }, []);

  if (!newsLoaded) {
    return <p className="text-center mt-5">Loading news...</p>;
  }

  return (
    <>
      <HeroSection />
      <Carousel />
      <NewsCategories />
      <SubscriptionSection />
    </>
  );
};

export default Home;



