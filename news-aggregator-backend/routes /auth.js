const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/User");
const Contact = require("../models/Contact"); // ✅ Import Contact model

// 🟢 User Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "✅ User registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: "❌ Server error", error });
  }
});

// 🟢 User Login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(500).json({ message: "❌ Server error", err });
    if (!user) return res.status(400).json({ message: info.message });

    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ message: "❌ Login failed" });
      res.json({ message: "✅ Login successful", user });
    });
  })(req, res, next);
});

// 🟢 Google Authentication
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  res.redirect("https://ai-powered-news-aggregator.vercel.app"); // ✅ Redirect to frontend
});

// 🟢 Facebook Authentication
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));

router.get("/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), (req, res) => {
  res.redirect("https://ai-powered-news-aggregator.vercel.app"); // ✅ Redirect to frontend
});

// 🟢 Logout Route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "❌ Logout failed" });
    res.json({ message: "✅ Successfully logged out" });
  });
});

// 🟢 Contact Us Form Submission
router.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "❌ All fields are required" });
    }

    const newMessage = new Contact({ name, email, message });
    await newMessage.save();

    res.status(200).json({ message: "✅ Message sent successfully!" });
  } catch (error) {
    res.status(500).json({ message: "❌ Server error", error });
  }
});

module.exports = router;


