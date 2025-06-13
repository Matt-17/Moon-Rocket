import { PostMessageManager } from '../events/PostMessageManager.js';
import { Scene } from 'phaser';

export class GameOver extends Phaser.Scene {
	score = 0

	constructor() {
		super('GameOver');
	}

	init(data: { score: number }) {
		this.score = data.score;
	}

	create() {
		PostMessageManager.send({ type: 'save:score', data: { score: this.score } });

		this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7).setOrigin(0, 0);

		const gameOverText = this.add
			.text(0, 0, `Game Over!\nYour Score: ${this.score}`, {
				fontSize: '32px',
				fontFamily: 'Kenney',
				color: '#ffffff',
				align: 'center',
			}).setOrigin(0.5);

		const replayButton = this.add
			.text(0, 100, 'Play Again', {
				fontSize: '24px',
				fontFamily: 'Kenney',
				color: '#ffffff',
			}).setOrigin(0.5);
		replayButton.setInteractive({ useHandCursor: true });
		replayButton.on('pointerdown', () => this.scene.start('Game'));

		this.add.container(this.cameras.main.centerX, this.cameras.main.centerY, [gameOverText, replayButton]);
	}
}
