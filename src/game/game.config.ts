import type { Types } from 'phaser';
import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';
import { Menu } from './scenes/Menu.js';
import { Preloader } from './scenes/Preloader.js';

export const gameConfig: Types.Core.GameConfig = {
	type: Phaser.AUTO,
	autoFocus: true,
	parent: 'game-container',
	scale: {
		mode: Phaser.Scale.EXPAND,
	},
	transparent: true,
	pixelArt: true, // Enable pixel-perfect rendering
	antialias: false, // Disable antialiasing for crisp pixels
	render: {
		pixelArt: true, // Ensure crisp pixel rendering
		antialias: false,
		roundPixels: true // Round pixel positions for crisp edges
	},
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { x: 0, y: 0 },
			debug: false
		}
	},
	scene: [Boot, Preloader, Menu, Game, GameOver],
}
