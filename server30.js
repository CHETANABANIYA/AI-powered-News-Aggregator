const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS (Optional: Restrict to allowed domains in production)
app.use(cors({
    origin: '*', // Replace '*' with your frontend domain for security
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type'
}));

// ✅ Ensure the 'build' directory exists before serving static files
const buildPath = path.join(__dirname, 'build');

app.use(express.static(buildPath));

// ✅ Serve login & signup pages (Ensure they exist in `build/`)
app.get('/login', (req, res) => {
    res.sendFile(path.join(buildPath, 'login.html'), (err) => {
        if (err) res.status(404).send("Login page not found.");
    });
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(buildPath, 'signup.html'), (err) => {
        if (err) res.status(404).send("Signup page not found.");
    });
});

// ✅ Catch-all route for React SPA (Ensures React routing works)
app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'), (err) => {
        if (err) res.status(404).send("Page not found.");
    });
});

// ✅ Start the server
app.listen(PORT, () => {
    console.log(`🚀 Frontend server running at http://localhost:${PORT}`);
});


