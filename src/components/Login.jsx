import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Load Facebook SDK only once
    if (!window.FB) {
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
    }
  }, []);

  const togglePassword = () => setShowPassword(!showPassword);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await fetch("https://ai-powered-news-aggregator-backend.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token); // ✅ Store token
        alert("✅ Login Successful!");
        navigate("/index"); // ✅ Redirect to home page
      } else {
        setError(data.message || "Invalid credentials.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    }

    setLoading(false);
  };

  const handleGoogleLogin = () => {
  window.location.href = "https://ai-powered-news-aggregator-backend.onrender.com/api/auth/google";
};

  return (
    <div className="login-container">
      <h2>Login to AI News Aggregator</h2>
      <form onSubmit={handleLogin}>
        <input type="email" name="email" placeholder="Enter your email" required />
        <div className="password-container">
          <input type={showPassword ? "text" : "password"} name="password" placeholder="Enter your password" required />
          <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} eye-icon`} onClick={togglePassword}></i>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? <i className="fas fa-spinner fa-spin"></i> : "Login"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {/* Google Login Button */}
      <button onClick={handleGoogleLogin} className="btn-google">
        Login with Google
      </button>
    </div>
  );
}




