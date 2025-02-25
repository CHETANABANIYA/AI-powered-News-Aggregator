const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS (Change '*' to your frontend domain in production)
app.use(cors({
    origin: '*', 
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

// ✅ Start the server (Bind to 0.0.0.0 for Render Deployment)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Frontend server running at http://0.0.0.0:${PORT}`);
});


