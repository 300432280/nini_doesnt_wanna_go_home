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
let dailyLeaderboard = [];

// DOM elements
let resetBtn, pauseBtn, timerElement;

// Initialize the game when the window loads
window.onload = function() {
    // Get DOM elements
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    resetBtn = document.getElementById('reset-btn');
    pauseBtn = document.getElementById('pause-btn');
    timerElement = document.getElementById('timer');

    // Set canvas size to match its display size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Load daily leaderboard from server
    fetchLeaderboard().then(data => {
        dailyLeaderboard = data;
    });

    // Add event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
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
    
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
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
    
    // Set random home position (ensuring it's fully within the canvas)
    home.x = CANVAS_PADDING + Math.random() * (canvas.width - HOME_SIZE - 2 * CANVAS_PADDING);
    home.y = CANVAS_PADDING + Math.random() * (canvas.height - HOME_SIZE - 2 * CANVAS_PADDING);
    
    // Set random pig position (ensuring it's not inside the home)
    let pigX, pigY;
    do {
        pigX = CANVAS_PADDING + Math.random() * (canvas.width - PIG_SIZE - 2 * CANVAS_PADDING);
        pigY = CANVAS_PADDING + Math.random() * (canvas.height - PIG_SIZE - 2 * CANVAS_PADDING);
    } while (
        pigX > home.x - PIG_SIZE && 
        pigX < home.x + HOME_SIZE && 
        pigY > home.y - PIG_SIZE && 
        pigY < home.y + HOME_SIZE
    );
    
    pig.x = pigX;
    pig.y = pigY;
    
    // Set random pig direction
    const angle = Math.random() * Math.PI * 2;
    pig.dx = Math.cos(angle) * PIG_SPEED;
    pig.dy = Math.sin(angle) * PIG_SPEED;
    
    // Start game loop
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    gameLoop();
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
        
        // Get time score
        const timeScore = elapsedTime / 1000;
        
        // Ask for player name and save score to server
        const playerName = askPlayerName();
        saveScore(timeScore, playerName);
        
        // Show win message with overlay
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
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw home
    ctx.fillStyle = HOME_COLOR;
    ctx.fillRect(home.x, home.y, home.size, home.size);
    
    // Draw home emoji
    ctx.font = `${HOME_SIZE * 0.6}px Arial`;
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
    
    // Draw current line being drawn
    if (currentLine && currentLine.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentLine.points[0].x, currentLine.points[0].y);
        
        for (let i = 1; i < currentLine.points.length; i++) {
            ctx.lineTo(currentLine.points[i].x, currentLine.points[i].y);
        }
        
        ctx.stroke();
    }
    
    // Draw pig
    ctx.font = `${pig.size}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(PIG_EMOJI, pig.x, pig.y);
}