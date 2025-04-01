import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Load Facebook SDK
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "1182578409398725", // Your Facebook App ID
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
    };

    (function (d, s, id) {
      let js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await fetch(
        "https://ai-powered-news-aggregator-backend.onrender.com/api/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Login Successful!");
        navigate("/dashboard"); // Redirect to dashboard
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    }

    setLoading(false);
  };

  const handleGoogleLogin = () => {
    window.location.href = "https://ai-powered-news-aggregator-backend.onrender.com/auth/google";
  };

  const handleFacebookLogin = () => {
    window.FB.login(
      function (response) {
        if (response.authResponse) {
          window.location.href = `https://ai-powered-news-aggregator-backend.onrender.com/auth/facebook?access_token=${response.authResponse.accessToken}`;
        } else {
          setError("Facebook login failed. Please try again.");
        }
      },
      { scope: "email,public_profile" }
    );
  };

  return (
    <div className="login-container">
      <h2>Login to NewsSphere</h2>
      <form onSubmit={handleLogin}>
        <input type="email" name="email" placeholder="Enter your email" required />
        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Enter your password"
            required
          />
          <i
            className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} eye-icon`}
            onClick={togglePassword}
          ></i>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? <i className="fas fa-spinner fa-spin"></i> : "Login"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <p className="footer">
        Don't have an account? <a href="/signup">Sign Up</a>
      </p>

      <button className="btn-google" onClick={handleGoogleLogin}>
        <i className="fab fa-google"></i> Login with Google
      </button>
      <button className="btn-facebook" onClick={handleFacebookLogin}>
        <i className="fab fa-facebook-f"></i> Login with Facebook
      </button>
    </div>
  );
}


