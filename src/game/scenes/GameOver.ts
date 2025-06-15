import { PostMessageManager } from '../events/PostMessageManager.js';
import { Scene } from 'phaser';
import { StartButton } from '../components/StartButton.js';

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

		// Dark overlay with fade-in effect
		const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0).setOrigin(0, 0);
		this.tweens.add({
			targets: overlay,
			alpha: 0.8,
			duration: 300,
			ease: 'Power2'
		});

		// Game Over title
		const gameOverTitle = this.add
			.text(0, -80, 'Game Over!', {
				fontSize: '48px',
				fontFamily: 'Kenney',
				color: '#ff4444',
				align: 'center',
			}).setOrigin(0.5)
			.setResolution(4);

		// Score display
		const scoreText = this.add
			.text(0, -20, `Score: ${this.score}`, {
				fontSize: '32px',
				fontFamily: 'Kenney',
				color: '#ffffff',
				align: 'center',
			}).setOrigin(0.5)
			.setResolution(4);

		// Performance message
		let performanceMsg = '';
		if (this.score >= 50) performanceMsg = 'Amazing!';
		else if (this.score >= 30) performanceMsg = 'Great job!';
		else if (this.score >= 20) performanceMsg = 'Well done!';
		else if (this.score >= 10) performanceMsg = 'Good effort!';
		else performanceMsg = 'Keep trying!';

		const performanceText = this.add
			.text(0, 20, performanceMsg, {
				fontSize: '24px',
				fontFamily: 'Kenney',
				color: '#ffff88',
				align: 'center',
			}).setOrigin(0.5)
			.setResolution(4);

		// Play again button using the component
		const replayButton = new StartButton(this, 0, 80)
			.onClick(() => {
				this.cameras.main.fade(200, 0, 0, 0);
				this.time.delayedCall(200, () => this.scene.start('Game'));
			});

		// Container with slide-in animation
		const container = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY, [
			gameOverTitle, scoreText, performanceText, replayButton
		]);
		
		container.setAlpha(0);
		container.y += 50;
		this.tweens.add({
			targets: container,
			alpha: 1,
			y: this.cameras.main.centerY,
			duration: 500,
			delay: 200,
			ease: 'Back.easeOut'
		});
	}
}
