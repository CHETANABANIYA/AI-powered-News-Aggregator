import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Welcome from "./components/Welcome";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Carousel from "./components/Carousel";
import NewsCategories from "./components/NewsCategories";
import SubscriptionSection from "./components/SubscriptionSection";
import Footer from "./components/Footer";

// Welcome Page with Auto-Redirect After 3 Seconds
const WelcomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      navigate("/index");
    }, 3000); // Redirects after 3 seconds
  }, [navigate]);

  return <Welcome />;
};

// Main Home Page Component
const MainHomePage = () => (
  <>
    <Navbar />
    <HeroSection />
    <Carousel />
    <NewsCategories />
    <SubscriptionSection />
    <Footer />
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

