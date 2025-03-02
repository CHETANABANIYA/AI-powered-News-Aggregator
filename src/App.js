 import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import NewsCarousel from './components/NewsCarousel'; // ✅ Renamed to avoid conflict
import NewsCategories from './components/NewsCategories';
import SubscriptionSection from './components/SubscriptionSection';
import Footer from './components/Footer';
import Home from './components/Home';
import Login from './components/Login';

function App() {
  return (
    <Router>
      <div> {/* ✅ Wrap everything in a div */}
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <HeroSection />
                <NewsCarousel />
                <NewsCategories />
                <SubscriptionSection />
                <Footer />
              </div>
            }
          />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;




