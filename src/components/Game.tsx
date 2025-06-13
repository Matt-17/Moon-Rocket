import { Devvit, useState, useInterval } from '@devvit/public-api';
import { GRAVITY, JUMP_FORCE, PIPE_SPEED } from '../constants.js';
import {
    checkCollision,
    isRocketOutOfBounds,
    createPipe,
    updatePipes
} from '../utils/gameUtils.js';

interface GameComponentProps {
    context: Devvit.Context;
}

export function GameComponent({ context }: GameComponentProps): JSX.Element {
  // Individual state variables to avoid JSONValue constraints
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isClient, setIsClient] = useState(false);
  
  const [rocketY, setRocketY] = useState(200);
  const [rocketVelocity, setRocketVelocity] = useState(0);
  
  const [pipeCount, setPipeCount] = useState(0);
  const [lastPipeSpawn, setLastPipeSpawn] = useState(0);
  const [gameTime, setGameTime] = useState(0);

  // Game settings
  const GAME_HEIGHT = 400;
  const PIPE_SPAWN_INTERVAL = 2000;

  // Initialize client-side detection
  useState(() => {
    setIsClient(true);
    return null;
  });

  // Game loop using useInterval - runs at ~20 FPS (50ms intervals)
  useInterval(() => {
    if (!isClient || !gameStarted || gameOver) return;

    // Update rocket physics
    const newY = Math.max(0, Math.min(GAME_HEIGHT - 50, rocketY + rocketVelocity));
    const newVelocity = rocketVelocity + GRAVITY;
    
    setRocketY(newY);
    setRocketVelocity(newVelocity);

    // Check boundaries
    if (newY <= 0 || newY >= GAME_HEIGHT - 50) {
      setGameOver(true);
      return;
    }

    // Spawn new pipes and increment score over time
    const currentTime = Date.now();
    if (currentTime - lastPipeSpawn > PIPE_SPAWN_INTERVAL) {
      setLastPipeSpawn(currentTime);
      setPipeCount(prev => prev + 1);
      setScore(prev => prev + 1); // Simple scoring
    }

    // Additional scoring for staying alive
    if (currentTime % 1000 < 50) { // Every second approximately
      setScore(prev => prev + 1);
    }

    setGameTime(prev => prev + 50);
  }, gameStarted && !gameOver && isClient ? 50 : 1000);

      /**
   * Handle game area click - makes entire area clickable for jumping
   */
  const handleGameAreaClick = (): void => {
    if (!gameStarted) {
      // If game hasn't started, start it
      setGameStarted(true);
    } else if (gameStarted && !gameOver) {
      // If game is running, jump
      setRocketVelocity(JUMP_FORCE);
    } else if (gameOver) {
      // If game is over, restart
      resetGame();
    }
  };

  /**
   * Handle start button click
   */
  const handleStartClick = (): void => {
    if (!gameStarted) {
      setGameStarted(true);
    }
  };

      /**
   * Reset game to initial state
   */
  const resetGame = (): void => {
    setHighScore(Math.max(highScore, score));
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setRocketY(200);
    setRocketVelocity(0);
    setPipeCount(0);
    setLastPipeSpawn(0);
    setGameTime(0);
  };

    // No more setTimeout in render - game loop is managed by intervals

    return (
        <vstack height="100%" width="100%" gap="medium" alignment="center middle">
            {/* Game Header */}
            <hstack width="100%" alignment="center" gap="large">
                <text size="large" weight="bold">🚀 Flappy Rockets</text>
                <text size="medium">High Score: {highScore}</text>
            </hstack>

            {/* Game Area - Clickable for jumping */}
            <vstack
                width="100%"
                height="400px"
                backgroundColor="#1a1a2e"
                alignment="center middle"
                cornerRadius="medium"
                border="thick"
                borderColor="#16213e"
                onPress={handleGameAreaClick}
            >
                {!gameStarted ? (
                    <StartScreen onStart={handleStartClick} />
                ) : gameOver ? (
                    <GameOverScreen
                        score={score}
                        highScore={highScore}
                        onRestart={handleGameAreaClick}
                    />
                ) : (
                    <GamePlayArea
                        rocketY={rocketY}
                        rocketVelocity={rocketVelocity}
                        pipeCount={pipeCount}
                        gameStarted={gameStarted}
                        gameTime={gameTime}
                    />
                )}
            </vstack>
        </vstack>
    );
}

/**
 * Start Screen Component using start.png
 */
function StartScreen({ onStart }: { onStart: () => void }): JSX.Element {
    return (
        <vstack alignment="center middle" gap="large" onPress={onStart} width="100%" height="100%">
            {/* Large start button image */}
            <image
                url="start.png"
                description="Start Game - Click to Begin"
                imageWidth={300}
                imageHeight={150}
            />

            {/* Instructions */}
            <vstack alignment="center middle" gap="medium">
                <text size="large" color="white" weight="bold">
                    🚀 Ready for Launch?
                </text>
                <text size="medium" color="#4CAF50">
                    Click anywhere to start your flight!
                </text>
                <text size="small" color="#a0a0a0">
                    Once flying, tap anywhere in the game area to boost upward
                </text>
            </vstack>

            {/* Visual indicator that it's clickable */}
            <text size="small" color="#ffd93d">
                👆 Tap to Start
            </text>
        </vstack>
    );
}

/**
 * Game Over Screen Component
 */
function GameOverScreen({
    score,
    highScore,
    onRestart
}: {
    score: number;
    highScore: number;
    onRestart: () => void;
}): JSX.Element {
    return (
        <vstack alignment="center middle" gap="medium">
            <text size="xxlarge" color="#ff6b6b">💥 Game Over!</text>
            <text size="large" color="white">Score: {score}</text>
            {score === highScore && score > 0 && (
                <text size="medium" color="#ffd93d">🏆 New High Score!</text>
            )}
            <button
                appearance="primary"
                size="large"
                onPress={onRestart}
            >
                🔄 Play Again
            </button>
        </vstack>
    );
}

/**
 * Game Play Area Component
 */
function GamePlayArea({
    rocketY,
    rocketVelocity,
    pipeCount,
    gameStarted,
    gameTime
}: {
    rocketY: number;
    rocketVelocity: number;
    pipeCount: number;
    gameStarted: boolean;
    gameTime: number;
}): JSX.Element {
    return (
        <vstack width="100%" height="100%" alignment="center middle" gap="small">
            {/* Rocket with position indicator */}
            <vstack alignment="center middle" gap="small">
                <image
                    url="rocket.png"
                    description="rocket"
                    imageWidth={50}
                    imageHeight={50}
                />

                {/* Visual altitude indicator */}
                <hstack gap="small" alignment="center">
                    <text color="white" size="small">🌍</text>
                    <text color="#4CAF50" size="small">
                        {'█'.repeat(Math.max(1, Math.floor(rocketY / 20)))}
                    </text>
                    <text color="white" size="small">☁️</text>
                </hstack>
            </vstack>

            {/* Flight data */}
            <vstack alignment="center middle" gap="small">
                <text color="white" size="medium">
                    Altitude: {Math.round(rocketY)}m
                </text>
                <text color={rocketVelocity > 0 ? "#ff6b6b" : "#4CAF50"} size="small">
                    {rocketVelocity > 0 ? "📉 Falling" : "📈 Rising"} ({Math.round(Math.abs(rocketVelocity))} m/s)
                </text>

                {/* Pipes indicator */}
                {pipeCount > 0 && (
                    <text color="#ffd93d" size="small">
                        🏆 Obstacles passed: {pipeCount}
                    </text>
                )}

                {/* Flight status */}
                <text color="#a0a0a0" size="small">
                    {rocketY < 100 ? "⚠️ Low altitude!" :
                        rocketY > 300 ? "🌟 High altitude!" :
                            "✈️ Cruising"}
                </text>
            </vstack>
        </vstack>
    );
}