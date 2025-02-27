import React from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import Carousel from './components/Carousel';
import NewsCategories from './components/NewsCategories';
import SubscriptionSection from './components/SubscriptionSection';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <Carousel />
      <NewsCategories />
      <SubscriptionSection />
      <Footer />
    </>
  );
}

export default App;
