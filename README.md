# 🚀 Flappy Rockets - Reddit Devvit Game

A professional Flappy Bird-style game built for Reddit using the Devvit framework.

## 🎮 Game Features

- **Physics-based gameplay** with gravity and jump mechanics
- **High score tracking** to compete with other players
- **Professional UI** with emojis and modern styling
- **Responsive design** optimized for Reddit's post format
- **Clean architecture** following Devvit best practices

## 🏗️ Project Structure

```
src/
├── main.tsx              # Main entry point and Devvit configuration
├── constants.ts          # Game constants and configuration
├── types.ts             # TypeScript type definitions
├── components/
│   └── Game.tsx         # Main game component with sub-components
└── utils/
    └── gameUtils.ts     # Reusable game logic functions

assets/
├── rocket.png           # Player character sprite
├── background_1.png     # Game background
├── background_2.png     # Alternative background
├── candle_red.png       # Top pipe obstacle
├── candle_green.png     # Bottom pipe obstacle
└── ...                  # Other game assets
```

## 🔧 Architecture

### Component Structure
- **GameComponent**: Main game container with state management
- **GameOverScreen**: Handles game over state and restart
- **GamePlayArea**: Renders the active game area
- **GameControls**: Manages user input and score display

### State Management
- Individual `useState` hooks for each piece of state
- Avoids complex objects to comply with Devvit's JSONValue constraints
- Clean separation between game logic and UI rendering

### Utilities
- **gameUtils.ts**: Pure functions for collision detection, physics, and game logic
- **constants.ts**: Centralized configuration for easy tweaking
- **types.ts**: TypeScript interfaces for type safety

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   devvit start
   ```

3. **Create a new game post**:
   - Go to your test subreddit
   - Look for "Add Flappy Rockets Game" in the moderator menu
   - Click to create a new game post

## 🎯 Game Mechanics

- **Jump**: Click the "Jump!" button to make the rocket fly upward
- **Gravity**: The rocket constantly falls due to gravity
- **Scoring**: Points are awarded for staying alive and passing obstacles
- **Game Over**: Triggered by hitting boundaries or obstacles
- **High Score**: Automatically tracked and displayed

## 🛠️ Development

### Adding New Features
1. Add constants to `src/constants.ts`
2. Define types in `src/types.ts`
3. Implement logic in `src/utils/gameUtils.ts`
4. Update components in `src/components/Game.tsx`

### Customization
- Modify game physics in `constants.ts`
- Add new visual elements by updating the component structure
- Implement new game modes by extending the state management

## 📝 Best Practices

- **Separation of Concerns**: Logic, UI, and configuration are separated
- **Type Safety**: Full TypeScript support with proper interfaces
- **Reusable Functions**: Game logic is extracted into testable utilities
- **Clean Components**: Each component has a single responsibility
- **Professional Styling**: Consistent design with proper spacing and colors

## 🎨 Styling

The game uses a modern dark theme with:
- **Primary Color**: `#1a1a2e` (Dark blue-gray)
- **Accent Color**: `#16213e` (Darker blue)
- **Success Color**: `#ffd93d` (Gold for high scores)
- **Error Color**: `#ff6b6b` (Red for game over)

## 🔄 Future Enhancements

- [ ] Add sound effects
- [ ] Implement difficulty levels
- [ ] Add particle effects
- [ ] Create leaderboards
- [ ] Add power-ups
- [ ] Implement themes

## 📄 License

This project is built for Reddit's Devvit platform and follows their terms of service. 