import { Scene } from 'phaser';
import { fetchPlayerStats } from '../api.js';

export class Boot extends Scene {
	constructor() {
		super({ key: 'Boot' });
	}

	create() {
		//	Load the player stats from the Devvit server before starting the game.
		//	Outside of Reddit fetchPlayerStats falls back to empty stats.
		fetchPlayerStats().then((stats) => {
			this.registry.set('playerStats', stats);
			this.scene.start('Preloader');
		});
	}
}
