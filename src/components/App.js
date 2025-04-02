import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Welcome from "./components/Welcome";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Carousel from "./components/Carousel";
import NewsCategories from "./components/NewsCategories";
import SubscriptionSection from "./components/SubscriptionSection";
import Footer from "./components/Footer";

// Function to check if the user is authenticated
const isAuthenticated = () => Boolean(localStorage?.getItem("token"));

// Welcome Page with Auto-Redirect After Few Seconds
const WelcomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      navigate("/index");
    }, 3000); // Redirect after 3 seconds
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
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/index"
        element={isAuthenticated() ? <MainHomePage /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;

