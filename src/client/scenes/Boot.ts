import { Scene } from 'phaser';
import { fetchInitData } from '../api.js';

export class Boot extends Scene {
	constructor() {
		super({ key: 'Boot' });
	}

	create() {
		//	Load the player stats and leaderboard from the Devvit server before
		//	starting the game. Outside of Reddit fetchInitData falls back to
		//	empty data.
		fetchInitData().then(({ stats, leaderboard, daily }) => {
			this.registry.set('playerStats', stats);
			this.registry.set('leaderboard', leaderboard);
			this.registry.set('daily', daily);
			this.scene.start('Preloader');
		});
	}
}
