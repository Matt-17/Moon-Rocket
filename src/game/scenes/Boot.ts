import { Scene } from 'phaser';
import type { PlayerStats } from '../../shared/messages.js';
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
			});
			this.scene.start('Preloader');
		} else {
			eventEmitter.once('update:player:stats', this.setPlayerStats, this);
			PostMessageManager.send({ type: 'request:player:stats' });
		}
	}

	setPlayerStats(data: PlayerStats) {
		this.registry.set('playerStats', data);
		this.scene.start('Preloader');
	}
}
