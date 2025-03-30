const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from project directory
app.use(express.static(path.join(__dirname, 'src')));

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`6800 Emulator server running on http://localhost:${PORT}`);
});
