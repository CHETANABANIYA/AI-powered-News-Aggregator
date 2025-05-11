import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Welcome from "./components/Welcome";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Carousel from "./components/Carousel";
import NewsCategories from "./components/NewsCategories";
import SubscriptionSection from "./components/SubscriptionSection";
import Footer from "./components/Footer";
import NewsAggregator from "./components/NewsAggregator";
import Signup from "./components/Signup"; // ✅ Add this import
import "./index.css";

const WelcomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      navigate("/index");
    }, 3000);
  }, [navigate]);

  return <Welcome />;
};

const MainHomePage = () => (
  <>
    <Navbar />
    <HeroSection />
    <Carousel />
    <NewsCategories />
    <SubscriptionSection />
    <Footer />
    <NewsAggregator />
  </>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/index" element={<MainHomePage />} />
      <Route path="/signup" element={<Signup />} /> {/* ✅ Add this route */}
    </Routes>
  );
}

export default App;

