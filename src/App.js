import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
const isAuthenticated = () => !!localStorage.getItem("token");

function App() {
  return (
    <Router> {/* ✅ Single Router at the root level */}
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/index"
          element={
            isAuthenticated() ? <MainHomePage /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </Router>
  );
}

// Main Home Page as a Separate Component
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

export default App;











