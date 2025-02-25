const express = require('express');
const path = require('path');
const app = express();

// Use the port assigned by Render or default to 3000 for local development
const PORT = process.env.PORT || 3000;

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, 'build')));

// Serve login and signup pages if they exist in the build folder
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'signup.html'));
});

// Catch-all route for React single-page application (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

