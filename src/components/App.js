import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Welcome from "./components/Welcome";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Carousel from "./components/Carousel";
import NewsCategories from "./components/NewsCategories";
import SubscriptionSection from "./components/SubscriptionSection";
import Footer from "./components/Footer";
import NewsAggregator from "./components/NewsAggregator"; // Import the new layout
import "./index.css";

// Welcome Page with Auto-Redirect
const WelcomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      navigate("/index");
    }, 3000);
  }, [navigate]);

  return <Welcome />;
};

// Main Home Page Component (Updated)
const MainHomePage = () => (
  <>
    <Navbar />
    <HeroSection />
    <Carousel />
    <NewsCategories />
    <SubscriptionSection />
    <Footer />
    <NewsAggregator />  {/* Add the new component */}
  </>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/index" element={<MainHomePage />} />
    </Routes>
  );
}

export default App;

