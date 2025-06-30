import { PostMessageManager } from '../events/PostMessageManager.js';
import { Scene } from 'phaser';
import { StartButton } from '../components/StartButton.js';
import { Background } from '../components/Background.js';
import { TextStyles } from '../utils/TextStyles.js'

export class GameOver extends Phaser.Scene {
	score = 0
	background!: Background;

	constructor() {
		super('GameOver');
	}

	init(data: { score: number }) {
		this.score = data.score;
	}

	create() {
		PostMessageManager.send({ type: 'save:score', data: { score: this.score } });

		// Create animated background
		this.background = new Background(this);

		// Game Over title
		const gameOverTitle = this.add
			.text(0, -100, 'Game Over!', TextStyles.TITLE_RED)
			.setOrigin(0.5)
			.setResolution(4);

		// Score display
		const scoreText = this.add
			.text(0, -50, `Your floor: ${this.score}`, TextStyles.SUBTITLE)
			.setOrigin(0.5)
			.setResolution(4);

		// Performance message
		let performanceMsg = '';
		if (this.score >= 50) performanceMsg = 'Amazing!';
		else if (this.score >= 30) performanceMsg = 'Great job!';
		else if (this.score >= 20) performanceMsg = 'Well done!';
		else if (this.score >= 10) performanceMsg = 'Good effort!';
		else performanceMsg = 'Keep trying!';

		const performanceText = this.add
			.text(0, -10, performanceMsg, TextStyles.SUBTITLE_YELLOW)
			.setOrigin(0.5)
			.setResolution(4);

		// Play again button using the component
		const replayButton = new StartButton(this, 0, 50).onClick(() => this.startGame());
		this.input.keyboard?.on('keydown-SPACE', () => this.startGame(), this);

		// Menu button (small text without background)
		const menuButton = this.add
			.text(0, 100, 'Back to Menu', TextStyles.SMALL)
			.setOrigin(0.5)
			.setResolution(4)
			.setInteractive({ useHandCursor: true })
			.on('pointerdown', () => this.goToMenu())
			.on('pointerover', () => menuButton.setTint(0xffff00))
			.on('pointerout', () => menuButton.clearTint());

		// Dark overlay with fade-in effect
		const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0).setOrigin(0, 0);
		this.tweens.add({
			targets: overlay,
			alpha: 0.8,
			duration: 300,
			ease: 'Power2'
		});

		// Container with slide-in animation
		const container = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY, [
			gameOverTitle, scoreText, performanceText, replayButton, menuButton
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

	startGame() {
		this.cameras.main.fade(200, 0, 0, 0);
		this.time.delayedCall(200, () => this.scene.start('Game'));
	}

	goToMenu() {
		this.cameras.main.fade(200, 0, 0, 0);
		this.time.delayedCall(200, () => this.scene.start('Menu'));
	}
}
