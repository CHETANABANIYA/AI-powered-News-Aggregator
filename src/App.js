import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import Carousel from './components/Carousel';
import NewsCategories from './components/NewsCategories';
import SubscriptionSection from './components/SubscriptionSection';
import Footer from './components/Footer';
import Home from './components/Home'; 
import Login from './components/Login'; 

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <HeroSection />
      <Carousel />
      <NewsCategories />
      <SubscriptionSection />
      <Footer />
    </Router>
  );
}

export default App;

