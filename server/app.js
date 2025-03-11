const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// In-memory storage for leaderboard
const dailyLeaderboard = {
    scores: [],
    lastReset: new Date().setHours(0, 0, 0, 0) // Midnight of the current day
};

// Function to check if we need to reset the daily leaderboard
const checkAndResetLeaderboard = () => {
    const today = new Date().setHours(0, 0, 0, 0);
    if (today > dailyLeaderboard.lastReset) {
        console.log('Resetting daily leaderboard');
        dailyLeaderboard.scores = [];
        dailyLeaderboard.lastReset = today;
    }
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Leaderboard API routes
app.get('/api/leaderboard/daily', (req, res) => {
    checkAndResetLeaderboard();
    res.json(dailyLeaderboard.scores);
});

app.post('/api/leaderboard', (req, res) => {
    const { time, playerName } = req.body;
    
    if (!time) {
        return res.status(400).json({ message: 'Time is required' });
    }
    
    checkAndResetLeaderboard();
    
    // Create a new score object
    const newScore = {
        time,
        playerName: playerName || 'Anonymous',
        date: new Date()
    };
    
    // Add to leaderboard and sort
    dailyLeaderboard.scores.push(newScore);
    dailyLeaderboard.scores.sort((a, b) => a.time - b.time);
    
    // Keep only top 10 scores
    if (dailyLeaderboard.scores.length > 10) {
        dailyLeaderboard.scores = dailyLeaderboard.scores.slice(0, 10);
    }
    
    res.status(201).json(newScore);
});

// Serve the game
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app; 