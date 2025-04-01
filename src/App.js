import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Welcome from "./components/Welcome"; // New Welcome Page
import Signup from "./components/Signup";
import Login from "./components/Login";
import Home from "./components/Home";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Carousel from "./components/Carousel";
import NewsCategories from "./components/NewsCategories";
import SubscriptionSection from "./components/SubscriptionSection";
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      <Routes>
        {/* Welcome Page (First Page Users See) */}
        <Route path="/" element={<Welcome />} />

        {/* Signup and Login Pages (No Navbar on These Pages) */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Main Home Page (After Login) */}
        <Route
          path="/index"
          element={
            <>
              <Navbar />
              <HeroSection />
              <Carousel />
              <NewsCategories />
              <SubscriptionSection />
              <Footer />
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;





