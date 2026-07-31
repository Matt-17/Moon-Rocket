import type { Types } from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from './constants.js';
import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';
import { Menu } from './scenes/Menu.js';
import { Preloader } from './scenes/Preloader.js';

export const gameConfig: Types.Core.GameConfig = {
	type: Phaser.AUTO,
	autoFocus: true,
	transparent: false,
    backgroundColor: '#000000', // hier Farbe setzen
	scale: {
	  mode: Phaser.Scale.FIT,
	  autoCenter: Phaser.Scale.CENTER_BOTH,
	  //	The canvas is oversampled so cameras can zoom by RENDER_SCALE:
	  //	textures stay chunky (nearest neighbour) but positions resolve
	  //	at sub-"retro-pixel" precision, which makes scrolling smooth.
	  width: GAME_WIDTH * RENDER_SCALE,
	  height: GAME_HEIGHT * RENDER_SCALE,
	  parent: 'core',
	  fullscreenTarget: 'core',
	},
	render: {
		pixelArt: true, // Ensure crisp pixel rendering
		antialias: false,
		roundPixels: false // Allow subpixel positions for smooth movement
	},
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { x: 0, y: 600 },
			debug: false
		}
	},
	scene: [Boot, Preloader, Menu, Game, GameOver],
}
