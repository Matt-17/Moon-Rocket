import { exitExpandedMode } from '@devvit/web/client';
import { Game } from 'phaser'
import { gameConfig } from './game.config.js';

new Game(gameConfig);

//	Escape closes the expanded game view and returns to the post.
window.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		try {
			exitExpandedMode(event as unknown as MouseEvent);
		} catch {
			// Already inline - nothing to do.
		}
	}
});
