import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./welcome.css";

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true") {
      navigate("/index"); // Redirect to the index page if logged in
    }
  }, [navigate]);

  return (
    <div className="welcome-container">
      <h1>Welcome to AI News Aggregator</h1>
      <p>Your gateway to AI-powered news tailored just for you.</p>
      <button onClick={() => navigate("/signup")}>Get Started</button>
      <p>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}




