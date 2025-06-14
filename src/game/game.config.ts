import type { Types } from 'phaser';
import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';
import { Menu } from './scenes/Menu.js';
import { Preloader } from './scenes/Preloader.js';

export const gameConfig: Types.Core.GameConfig = {
	type: Phaser.AUTO,
	autoFocus: true,
	transparent: false,
	scale: {
	  mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT ,
	  autoCenter: Phaser.Scale.CENTER_BOTH,
	  width: 560,
	  height: 240,
	  parent: 'core',
	  fullscreenTarget: 'core',
	},
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
