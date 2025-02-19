import React, { useState } from "react";
import "./login.css"; // Move the styles here to a CSS file if needed

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      const email = e.target.email.value;
      const password = e.target.password.value;

      // Simulate incorrect credentials
      if (email !== "user@example.com" || password !== "password123") {
        setError("Invalid username or password.");
      } else {
        alert("Login Successful!");
      }
    }, 2000);
  };

  return (
    <div className="login-container">
      <h2>Login to NewsSphere</h2>
      <form id="login-form" onSubmit={handleLogin}>
        <input type="email" name="email" placeholder="Enter your email" required />
        <div style={{ position: "relative" }}>
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
        <button type="submit">Login</button>
      </form>

      {loading && (
        <div id="loading" style={{ textAlign: "center" }}>
          <i className="fas fa-spinner fa-spin"></i> Logging in...
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <p className="footer">
        Don't have an account? <a href="#">Sign Up</a>
      </p>

      <button className="btn-google">
        <i className="fab fa-google"></i> Login with Google
      </button>
      <button className="btn-facebook">
        <i className="fab fa-facebook-f"></i> Login with Facebook
      </button>
    </div>
  );
}
