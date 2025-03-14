import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./signup.css";

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const name = e.target.name.value;
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await fetch("https://ai-powered-news-aggregator-backend.onrender.com/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        alert("✅ Account created successfully!");
        navigate("/login");
      } else {
        setError(data.message || "Signup failed. Please try again.");
      }
    } catch (err) {
      setLoading(false);
      setError("Something went wrong. Please try again later.");
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = "https://ai-powered-news-aggregator-backend.onrender.com/auth/google";
  };

  const handleFacebookSignup = () => {
    window.location.href = "https://ai-powered-news-aggregator-backend.onrender.com/auth/facebook";
  };

  return (
    <div className="signup-container">
      <h2>Create an Account</h2>
      <form onSubmit={handleSignup}>
        <input type="text" name="name" placeholder="Full Name" required />
        <input type="email" name="email" placeholder="Email Address" required />
        <input type="password" name="password" placeholder="Password" required />

        <button type="submit" disabled={loading}>
          {loading ? <i className="fas fa-spinner fa-spin"></i> : "Sign Up"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <p className="footer">
        Already have an account? <a href="/login">Login</a>
      </p>

      <button className="btn-google" onClick={handleGoogleSignup}>
        <i className="fab fa-google"></i> Sign Up with Google
      </button>
      <button className="btn-facebook" onClick={handleFacebookSignup}>
        <i className="fab fa-facebook-f"></i> Sign Up with Facebook
      </button>
    </div>
  );
}

