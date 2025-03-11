# Nini Doesn't Want to Go Home

A fun web-based game where you need to trap Nini the pig and guide her back home.

## Game Description

In this game, you'll need to trap Nini the pig and guide her back to her home. Nini bounces around the screen and will bounce off any red lines you draw with your mouse. The goal is to trap Nini inside her home by strategically drawing lines to guide her there.

## Game Features

- 🏠 Random home location on each game start
- 🐷 Bouncing pig (Nini) that moves in random directions
- ✏️ Draw red lines with your mouse to redirect Nini
- ⏱️ Timer to track how quickly you can guide Nini home
- 🏆 Daily leaderboard showing best times
- 🔄 Reset button to start a new game
- ⏸️ Pause/resume button

## How to Play

1. When the game starts, Nini will move in a random direction
2. Use your mouse to draw red lines on the screen
3. Nini will bounce off these lines
4. Your goal is to trap Nini entirely within the home area
5. The timer tracks how long it takes you to win
6. Try to beat your best time!

## Technologies Used

- **Frontend**: 
  - HTML5 Canvas for rendering
  - JavaScript for game logic
  - Tailwind CSS for styling
- **Backend**:
  - Node.js with Express
  - MongoDB for storing leaderboard data

## Setup and Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Build the Tailwind CSS:
   ```
   npm run build:css
   ```
4. Make sure MongoDB is running on your system
5. Start the server:
   ```
   npm start
   ```
6. Open http://localhost:3000 in your browser

## Development

To run in development mode with auto-reloading:
```
npm run dev
```

To watch for CSS changes:
```
npm run watch:css
```

## Game Controls

- Mouse: Draw lines
- Reset button: Start a new game
- Pause/Resume button: Pause or resume the game

## Credits

This game was created as a fun project to demonstrate HTML5 Canvas capabilities, Node.js backend, and Tailwind CSS styling. 