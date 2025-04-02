const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
    console.error("❌ Missing JWT_SECRET in environment variables");
    process.exit(1);
}

// User Signup
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({ name, email, password: hashedPassword });

        res.status(201).json({ 
            message: "User created successfully", 
            user: { id: newUser._id, name: newUser.name, email: newUser.email } 
        });
    } catch (error) {
        console.error("❌ Signup Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// User Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({ 
            token, 
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error("❌ Login Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;




