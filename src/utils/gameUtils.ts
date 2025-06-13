import { PIPE_GAP } from '../constants.js';
import { RocketState, Pipe } from '../types.js';

/**
 * Check if the rocket collides with any pipes
 */
export function checkCollision(rocket: RocketState, pipes: Pipe[]): boolean {
  const rocketRight = 100;
  const rocketLeft = 50;
  const rocketTop = rocket.y;
  const rocketBottom = rocket.y + 50;

  return pipes.some(pipe => {
    return (
      rocketRight > pipe.x &&
      rocketLeft < pipe.x + 80 &&
      (rocketTop < pipe.topHeight || rocketBottom > pipe.topHeight + PIPE_GAP)
    );
  });
}

/**
 * Check if rocket is out of bounds (hit ceiling or ground)
 */
export function isRocketOutOfBounds(rocket: RocketState, gameHeight: number): boolean {
  return rocket.y <= 0 || rocket.y >= gameHeight - 50;
}

/**
 * Generate a random pipe height
 */
export function generatePipeHeight(): number {
  return Math.random() * 200 + 100;
}

/**
 * Create a new pipe
 */
export function createPipe(x: number): Pipe {
  return {
    x,
    topHeight: generatePipeHeight(),
    passed: false,
    id: `pipe-${Date.now()}-${Math.random()}`
  };
}

/**
 * Update pipes position and filter out off-screen pipes
 */
export function updatePipes(pipes: Pipe[], speed: number): Pipe[] {
  return pipes
    .map(pipe => ({ ...pipe, x: pipe.x - speed }))
    .filter(pipe => pipe.x > -100);
}

/**
 * Calculate score based on passed pipes
 */
export function calculateScore(pipes: Pipe[]): number {
  return pipes.filter(pipe => pipe.passed).length;
} 