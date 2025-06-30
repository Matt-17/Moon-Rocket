import { Scene } from 'phaser';
import type { PlayerStats, LeaderboardData, LeaderboardEntry } from '../../shared/messages.js';
import eventEmitter from '../events/EventEmitter.js';
import { PostMessageManager } from '../events/PostMessageManager.js';

export class Boot extends Scene {
	constructor() {
		super({ key: 'Boot' });
	}

	create() {
		//	If the game is not embedded we assume that the App is not running
		//	on Reddit, therefore we cannot send postMessages.
		if (window === window.top) {
			this.registry.set('playerStats', {
				highscore: 0,
				attempts: 0,
				rank: null
			});
			this.registry.set('leaderboard', []);
			this.scene.start('Preloader');
		} else {
			eventEmitter.once('update:leaderboard', this.setLeaderboardData, this);
			PostMessageManager.send({ type: 'request:leaderboard' });
		}
	}

	setLeaderboardData(data: LeaderboardData) {
		this.registry.set('playerStats', data.userStats);
		this.registry.set('leaderboard', data.leaderboard);
		this.scene.start('Preloader');
	}
}