import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./signup.css";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "1182578409398725",
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
    };

    (function (d, s, id) {
      let js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");

    fetch("https://ai-powered-news-aggregator-backend.onrender.com/api/auth/user", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user || data.token) {
          navigate("/");
        }
      })
      .catch(() => {});
  }, [navigate]);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

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
        setTimeout(() => navigate("/login"), 500);
      } else if (response.status === 409) {
        setError("⚠️ Email is already registered. Try logging in.");
      } else {
        setError(data.message || "Signup failed. Please try again.");
      }
    } catch (err) {
      setLoading(false);
      setError("🚨 Something went wrong. Check your internet connection.");
    }
  };

  const handleGoogleSignup = () => {
    const newWindow = window.open(
      "https://ai-powered-news-aggregator-backend.onrender.com/api/auth/google",
      "_blank",
      "width=500,height=600"
    );

    const checkLogin = setInterval(() => {
      if (newWindow.closed) {
        clearInterval(checkLogin);
        navigate("/login");
      }
    }, 1000);
  };

  const handleFacebookSignup = () => {
    window.FB.login((response) => {
      if (response.authResponse) {
        fetch(`https://ai-powered-news-aggregator-backend.onrender.com/api/auth/facebook?access_token=${response.authResponse.accessToken}`)
          .then(() => navigate("/login"))
          .catch(() => setError("Facebook signup failed. Try again."));
      } else {
        setError("Facebook signup failed. Please try again.");
      }
    }, { scope: "email,public_profile" });
  };

  return (
    <div className="signup-container">
      <h2>Create an Account</h2>
      <form onSubmit={handleSignup}>
        <input type="text" name="name" placeholder="Full Name" required />
        <input type="email" name="email" placeholder="Email Address" required />

        <div className="password-container">
          <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" required />
          <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} eye-icon`} onClick={togglePassword}></i>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? <i className="fas fa-spinner fa-spin"></i> : "Sign Up"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <button className="btn-google" onClick={handleGoogleSignup}>Sign Up with Google</button>
      <button className="btn-facebook" onClick={handleFacebookSignup}>Sign Up with Facebook</button>
    </div>
  );
}



