/**
 * Nini Doesn't Want to Go Home
 * A game where you trap a pig (Nini) and guide her back home
 */

// Game constants
const CANVAS_PADDING = 20;
const PIG_SIZE = 30;
const HOME_SIZE = 100;
const PIG_SPEED = 3;
const LINE_COLOR = '#ff0000';
const LINE_WIDTH = 3;
const HOME_COLOR = 'rgba(144, 238, 144, 0.5)'; // Light green with transparency
const PIG_EMOJI = '🐷';
const HOME_EMOJI = '🏠';

// Game variables
let canvas, ctx;
let pig = { x: 0, y: 0, dx: 0, dy: 0, size: PIG_SIZE };
let home = { x: 0, y: 0, size: HOME_SIZE };
let lines = [];
let currentLine = null;
let isDrawing = false;
let gameStarted = false;
let gamePaused = false;
let gameWon = false;
let startTime = 0;
let elapsedTime = 0;
let animationFrameId = null;
let leaderboard = [];

// DOM elements
let resetBtn, pauseBtn, timerElement, leaderboardList;

// Initialize the game when the window loads
window.onload = function() {
    // Get DOM elements
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    resetBtn = document.getElementById('reset-btn');
    pauseBtn = document.getElementById('pause-btn');
    timerElement = document.getElementById('timer');
    leaderboardList = document.getElementById('leaderboard-list');

    // Set canvas size to match its display size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Load leaderboard from localStorage
    loadLeaderboard();
    updateLeaderboardDisplay();

    // Add event listeners for mouse
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Add touch event listeners for mobile devices
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);
    
    resetBtn.addEventListener('click', resetGame);
    pauseBtn.addEventListener('click', togglePause);

    // Initialize the game
    resetGame();
};

/**
 * Resize the canvas to match its display size
 */
function resizeCanvas() {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // Get the device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    
    // Set the canvas size for higher resolution on high-DPI screens
    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        // Set the canvas dimensions with DPR for sharper rendering
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        
        // Scale the context to ensure correct drawing
        ctx.scale(dpr, dpr);
        
        // Set style size to maintain layout
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        
        // Recalculate game dimensions when canvas size changes
        if (gameStarted) {
            // Position home in the bottom right quadrant
            home.x = displayWidth - HOME_SIZE - CANVAS_PADDING;
            home.y = displayHeight - HOME_SIZE - CANVAS_PADDING;
            
            // Position pig if not already set
            if (pig.x === 0 && pig.y === 0) {
                // Position pig in the top left quadrant
                pig.x = CANVAS_PADDING * 2;
                pig.y = CANVAS_PADDING * 2;
                
                // Set random initial direction
                const angle = Math.random() * 2 * Math.PI;
                pig.dx = Math.cos(angle) * PIG_SPEED;
                pig.dy = Math.sin(angle) * PIG_SPEED;
            }
        }
        
        // Redraw the game if it's active
        if (gameStarted && !gamePaused) {
            drawGame();
        }
    }
}

/**
 * Reset the game state
 */
function resetGame() {
    // Reset game state
    lines = [];
    gameStarted = true;
    gamePaused = false;
    gameWon = false;
    startTime = Date.now();
    elapsedTime = 0;
    pauseBtn.textContent = 'Pause';
    
    // Position home in the bottom right
    home.x = canvas.width - HOME_SIZE - CANVAS_PADDING;
    home.y = canvas.height - HOME_SIZE - CANVAS_PADDING;
    
    // Position pig in the top left
    pig.x = CANVAS_PADDING * 2;
    pig.y = CANVAS_PADDING * 2;
    
    // Set initial random direction for the pig
    const angle = Math.random() * 2 * Math.PI;
    pig.dx = Math.cos(angle) * PIG_SPEED;
    pig.dy = Math.sin(angle) * PIG_SPEED;
    
    // Adjust pig speed for smaller screens
    if (canvas.width < 500) {
        pig.dx *= 0.7;
        pig.dy *= 0.7;
    }
    
    // Start the game loop if it's not already running
    if (!animationFrameId) {
        gameLoop();
    }
}

/**
 * Toggle pause state of the game
 */
function togglePause() {
    if (gameWon) return;
    
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
    
    if (!gamePaused) {
        // Adjust start time to account for pause duration
        startTime = Date.now() - elapsedTime;
        gameLoop();
    }
}

/**
 * Handle touch start event for mobile devices
 */
function handleTouchStart(e) {
    e.preventDefault(); // Prevent scrolling
    if (gamePaused || gameWon) return;
    
    // Start game if not started yet
    if (!gameStarted) {
        resetGame();
    }
    
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    
    // Calculate touch position with proper scaling
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    
    currentLine = { points: [{ x, y }] };
}

/**
 * Handle touch move event for mobile devices
 */
function handleTouchMove(e) {
    e.preventDefault(); // Prevent scrolling
    if (!isDrawing || gamePaused || gameWon) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    
    // Calculate touch position with proper scaling
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    
    currentLine.points.push({ x, y });
    
    // Redraw everything
    drawGame();
}

/**
 * Handle touch end event for mobile devices
 */
function handleTouchEnd(e) {
    // Don't prevent default here to allow for scrolling after drawing
    if (!isDrawing) return;
    
    isDrawing = false;
    if (currentLine && currentLine.points.length > 1) {
        lines.push(currentLine);
    }
    currentLine = null;
}

/**
 * Start drawing a line
 */
function startDrawing(e) {
    if (gamePaused || gameWon) return;
    
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    currentLine = { points: [{ x, y }] };
}

/**
 * Continue drawing a line
 */
function draw(e) {
    if (!isDrawing || gamePaused || gameWon) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    currentLine.points.push({ x, y });
    
    // Redraw everything
    drawGame();
}

/**
 * Stop drawing a line
 */
function stopDrawing() {
    if (!isDrawing) return;
    
    isDrawing = false;
    if (currentLine && currentLine.points.length > 1) {
        lines.push(currentLine);
    }
    currentLine = null;
}

/**
 * Main game loop
 */
function gameLoop() {
    if (!gamePaused && gameStarted && !gameWon) {
        updateGame();
        drawGame();
        
        // Update timer
        elapsedTime = Date.now() - startTime;
        timerElement.textContent = (elapsedTime / 1000).toFixed(1);
        
        // Check win condition
        checkWinCondition();
        
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

/**
 * Update game state
 */
function updateGame() {
    // Move pig
    pig.x += pig.dx;
    pig.y += pig.dy;
    
    // Bounce off canvas edges
    if (pig.x < 0) {
        pig.x = 0;
        pig.dx = -pig.dx;
    } else if (pig.x + pig.size > canvas.width) {
        pig.x = canvas.width - pig.size;
        pig.dx = -pig.dx;
    }
    
    if (pig.y < 0) {
        pig.y = 0;
        pig.dy = -pig.dy;
    } else if (pig.y + pig.size > canvas.height) {
        pig.y = canvas.height - pig.size;
        pig.dy = -pig.dy;
    }
    
    // Check collision with lines
    checkLineCollisions();
}

/**
 * Check for collisions between the pig and drawn lines
 */
function checkLineCollisions() {
    // Create a pig hitbox (slightly smaller than the pig for better collision detection)
    const pigHitbox = {
        x: pig.x + 5,
        y: pig.y + 5,
        width: pig.size - 10,
        height: pig.size - 10
    };
    
    // Check each line
    for (const line of lines) {
        for (let i = 1; i < line.points.length; i++) {
            const p1 = line.points[i - 1];
            const p2 = line.points[i];
            
            // Check if line segment intersects with pig hitbox
            if (lineIntersectsRect(p1, p2, pigHitbox)) {
                // Determine bounce direction based on line angle
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const lineAngle = Math.atan2(dy, dx);
                
                // Calculate normal vector to the line
                const normalAngle = lineAngle + Math.PI / 2;
                const normalX = Math.cos(normalAngle);
                const normalY = Math.sin(normalAngle);
                
                // Reflect pig's velocity vector across the normal
                const dotProduct = 2 * (pig.dx * normalX + pig.dy * normalY);
                pig.dx -= dotProduct * normalX;
                pig.dy -= dotProduct * normalY;
                
                // Move pig slightly away from the line to prevent multiple collisions
                pig.x += pig.dx;
                pig.y += pig.dy;
                
                // Only handle one collision per frame
                return;
            }
        }
    }
}

/**
 * Check if a line segment intersects with a rectangle
 */
function lineIntersectsRect(p1, p2, rect) {
    // Check if either endpoint is inside the rectangle
    if (pointInRect(p1, rect) || pointInRect(p2, rect)) {
        return true;
    }
    
    // Check if line intersects any of the rectangle's edges
    const rectLines = [
        { p1: { x: rect.x, y: rect.y }, p2: { x: rect.x + rect.width, y: rect.y } },
        { p1: { x: rect.x + rect.width, y: rect.y }, p2: { x: rect.x + rect.width, y: rect.y + rect.height } },
        { p1: { x: rect.x + rect.width, y: rect.y + rect.height }, p2: { x: rect.x, y: rect.y + rect.height } },
        { p1: { x: rect.x, y: rect.y + rect.height }, p2: { x: rect.x, y: rect.y } }
    ];
    
    for (const rectLine of rectLines) {
        if (linesIntersect(p1, p2, rectLine.p1, rectLine.p2)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Check if a point is inside a rectangle
 */
function pointInRect(p, rect) {
    return p.x >= rect.x && p.x <= rect.x + rect.width &&
           p.y >= rect.y && p.y <= rect.y + rect.height;
}

/**
 * Check if two line segments intersect
 */
function linesIntersect(p1, p2, p3, p4) {
    // Calculate direction vectors
    const d1x = p2.x - p1.x;
    const d1y = p2.y - p1.y;
    const d2x = p4.x - p3.x;
    const d2y = p4.y - p3.y;
    
    // Calculate the determinant
    const det = d1x * d2y - d1y * d2x;
    
    // Lines are parallel if determinant is zero
    if (det === 0) {
        return false;
    }
    
    // Calculate parameters for the intersection point
    const dx = p3.x - p1.x;
    const dy = p3.y - p1.y;
    const t = (dx * d2y - dy * d2x) / det;
    const u = (dx * d1y - dy * d1x) / det;
    
    // Check if intersection point is within both line segments
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/**
 * Check if the pig is entirely inside the home area
 */
function checkWinCondition() {
    if (
        pig.x >= home.x &&
        pig.x + pig.size <= home.x + home.size &&
        pig.y >= home.y &&
        pig.y + pig.size <= home.y + home.size
    ) {
        // Pig is entirely inside home
        gameWon = true;
        
        // Add score to leaderboard
        const timeScore = elapsedTime / 1000;
        addToLeaderboard(timeScore);
        
        // Show win message
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Nini is home!', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Time: ${timeScore.toFixed(1)} seconds`, canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.font = '18px Arial';
        ctx.fillText('Press Reset to play again', canvas.width / 2, canvas.height / 2 + 60);
    }
}

/**
 * Draw the game state
 */
function drawGame() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    
    // Draw home
    ctx.fillStyle = HOME_COLOR;
    ctx.fillRect(home.x, home.y, home.size, home.size);
    
    // Draw home emoji
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(HOME_EMOJI, home.x + home.size / 2, home.y + home.size / 2);
    
    // Draw all completed lines
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (const line of lines) {
        if (line.points.length < 2) continue;
        
        ctx.beginPath();
        ctx.moveTo(line.points[0].x, line.points[0].y);
        
        for (let i = 1; i < line.points.length; i++) {
            ctx.lineTo(line.points[i].x, line.points[i].y);
        }
        
        ctx.stroke();
    }
    
    // Draw current line if drawing
    if (currentLine && currentLine.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentLine.points[0].x, currentLine.points[0].y);
        
        for (let i = 1; i < currentLine.points.length; i++) {
            ctx.lineTo(currentLine.points[i].x, currentLine.points[i].y);
        }
        
        ctx.stroke();
    }
    
    // Draw pig
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PIG_EMOJI, pig.x, pig.y);
    
    // Draw game win message if won
    if (gameWon) {
        const timeScore = (elapsedTime / 1000).toFixed(1);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            `Nini is home!`, 
            canvas.width / (2 * (window.devicePixelRatio || 1)), 
            canvas.height / (2 * (window.devicePixelRatio || 1)) - 40
        );
        ctx.fillText(
            `Time: ${timeScore}s`, 
            canvas.width / (2 * (window.devicePixelRatio || 1)), 
            canvas.height / (2 * (window.devicePixelRatio || 1)) + 40
        );
    }
}

/**
 * Add a score to the leaderboard
 */
function addToLeaderboard(timeScore) {
    leaderboard.push(timeScore);
    leaderboard.sort((a, b) => a - b);
    
    // Keep only top 10 scores
    if (leaderboard.length > 10) {
        leaderboard = leaderboard.slice(0, 10);
    }
    
    // Save to localStorage
    saveLeaderboard();
    
    // Update display
    updateLeaderboardDisplay();
}

/**
 * Save leaderboard to localStorage
 */
function saveLeaderboard() {
    localStorage.setItem('niniLeaderboard', JSON.stringify(leaderboard));
}

/**
 * Load leaderboard from localStorage
 */
function loadLeaderboard() {
    const savedLeaderboard = localStorage.getItem('niniLeaderboard');
    if (savedLeaderboard) {
        leaderboard = JSON.parse(savedLeaderboard);
    } else {
        leaderboard = [];
    }
}

/**
 * Update the leaderboard display
 */
function updateLeaderboardDisplay() {
    leaderboardList.innerHTML = '';
    
    if (leaderboard.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'No records yet';
        leaderboardList.appendChild(emptyItem);
        return;
    }
    
    for (let i = 0; i < leaderboard.length; i++) {
        const listItem = document.createElement('li');
        listItem.textContent = `${leaderboard[i].toFixed(1)} seconds`;
        leaderboardList.appendChild(listItem);
    }
} 