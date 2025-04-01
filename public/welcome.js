import React from "react";
import { useNavigate } from "react-router-dom";
import "./welcome.css"; // (Optional) Create a CSS file for styling

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <h1>Welcome to AI News Aggregator</h1>
      <p>Get personalized news powered by AI. Sign up to explore!</p>
      <button onClick={() => navigate("/signup")}>Get Started</button>
      <p>Already have an account? <a href="/login">Login</a></p>
    </div>
  );
}

