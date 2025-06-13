// Game state types
export interface GameState {
  gameStarted: boolean;
  gameOver: boolean;
  score: number;
  highScore: number;
}

export interface RocketState {
  y: number;
  velocity: number;
}

export interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
  id: string;
}

// Component props
export interface GameProps {
  onScoreUpdate?: (score: number) => void;
}

// Game settings
export interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  soundEnabled: boolean;
} 