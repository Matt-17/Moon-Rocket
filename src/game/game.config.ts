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
	scene: [Boot, Preloader, Menu, Game, GameOver],
}
