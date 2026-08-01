import { Scene } from 'phaser';
import { fetchInitData } from '../api.js';

export class Boot extends Scene {
	constructor() {
		super({ key: 'Boot' });
	}

	create() {
		//	Restore the player's sound preference (toggled in the menu).
		try {
			this.sound.mute = localStorage.getItem('moonrocket-sound') === 'off';
		} catch {
			// localStorage may be unavailable in some embedded contexts
		}

		//	Load the player stats and leaderboard from the Devvit server before
		//	starting the game. Outside of Reddit fetchInitData falls back to
		//	empty data.
		fetchInitData().then(({ stats, leaderboard, diamondLeaderboard, todayLeaderboard, daily, playerCounts }) => {
			this.registry.set('playerStats', stats);
			this.registry.set('leaderboard', leaderboard);
			this.registry.set('diamondLeaderboard', diamondLeaderboard);
			this.registry.set('todayLeaderboard', todayLeaderboard);
			this.registry.set('daily', daily);
			this.registry.set('playerCounts', playerCounts);
			this.scene.start('Preloader');
		});
	}
}
