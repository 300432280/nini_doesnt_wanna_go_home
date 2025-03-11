/**
 * UI handlers for the Nini game
 * Manages the interaction with the server API for leaderboard
 */

// Handle leaderboard updates
function updateLeaderboardDisplay(scores) {
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    
    if (!scores || scores.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'No records yet today';
        emptyItem.className = 'text-gray-400 text-center py-2';
        leaderboardList.appendChild(emptyItem);
        return;
    }
    
    // Create a list item for each score
    scores.forEach((score, index) => {
        const listItem = document.createElement('li');
        const formattedTime = typeof score.time === 'number' ? score.time.toFixed(1) : score.time;
        const playerName = score.playerName || 'Anonymous';
        
        listItem.innerHTML = `
            <div class="flex justify-between items-center py-1 border-b border-gray-700">
                <span class="font-semibold">${index + 1}. ${playerName}</span>
                <span class="font-mono">${formattedTime}s</span>
            </div>
        `;
        
        leaderboardList.appendChild(listItem);
    });
}

// Fetch leaderboard data from the server
async function fetchLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard/daily');
        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        
        const data = await response.json();
        updateLeaderboardDisplay(data);
        return data;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        updateLeaderboardDisplay([]);
        return [];
    }
}

// Save score to the server
async function saveScore(timeScore, playerName = 'You') {
    try {
        const response = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ time: timeScore, playerName })
        });
        
        if (!response.ok) throw new Error('Failed to save score');
        
        // Refresh the leaderboard
        fetchLeaderboard();
        return true;
    } catch (error) {
        console.error('Error saving score:', error);
        return false;
    }
}

// Ask player for their name
function askPlayerName() {
    const name = localStorage.getItem('playerName');
    if (name) return name;
    
    const playerName = prompt('Enter your name for the leaderboard:', 'Anonymous');
    if (playerName && playerName.trim() !== '') {
        localStorage.setItem('playerName', playerName.trim());
        return playerName.trim();
    }
    
    return 'Anonymous';
}

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    // Initial leaderboard fetch
    fetchLeaderboard();
    
    // Set up interval to refresh leaderboard periodically
    setInterval(fetchLeaderboard, 60000); // Refresh every minute
}); 