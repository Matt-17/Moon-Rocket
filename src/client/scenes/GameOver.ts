import { showToast } from '@devvit/web/client';
import { fetchInitData, saveScore } from '../api.js';
import { StartButton } from '../components/StartButton.js';
import { Background } from '../components/Background.js';
import { GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from '../constants.js';
import { TextStyles } from '../utils/TextStyles.js'

export class GameOver extends Phaser.Scene {
	score = 0
	diamonds = 0
	background!: Background;

	constructor() {
		super('GameOver');
	}

	init(data: { score: number; diamonds?: number }) {
		this.score = data.score;
		this.diamonds = data.diamonds ?? 0;
	}

	create() {
		this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);

		saveScore(this.score, this.diamonds).then((result) => {
			if (result) {
				this.registry.set('playerStats', result.stats);
				if (result.newBest !== null) {
					showToast(`Hooray, new personal best: ${result.newBest}!`);
				} else if (result.dailyNewBest !== null) {
					showToast(`New daily best: ${result.dailyNewBest}!`);
				}
			}
		});

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

		// Diamonds collected during this run
		const diamondItems: Phaser.GameObjects.GameObject[] = [];
		if (this.diamonds > 0) {
			diamondItems.push(
				this.add.image(-14, 20, 'diamond').setOrigin(0.5).setScale(0.7),
				this.add
					.text(-4, 20, `+${this.diamonds}`, TextStyles.withFontSize(TextStyles.SCORE, '12px'))
					.setOrigin(0, 0.5)
					.setResolution(4)
			);
		}

		// Play again button using the component
		const replayButton = new StartButton(this, 0, 50).onClick(() => this.startGame());
		this.input.keyboard?.on('keydown-SPACE', () => this.startGame(), this);
		this.input.keyboard?.on('keydown-ESC', () => this.goToMenu(), this);

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
		const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setOrigin(0, 0);
		this.tweens.add({
			targets: overlay,
			alpha: 0.8,
			duration: 300,
			ease: 'Power2'
		});

		// Container with slide-in animation
		const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2, [
			gameOverTitle, scoreText, performanceText, ...diamondItems, replayButton, menuButton
		]);

		container.setAlpha(0);
		container.y += 50;
		this.tweens.add({
			targets: container,
			alpha: 1,
			y: GAME_HEIGHT / 2,
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
		// Fetch fresh stats and leaderboard so the menu shows up-to-date data
		fetchInitData().then(({ stats, leaderboard, daily, playerCounts }) => {
			this.registry.set('playerStats', stats);
			this.registry.set('leaderboard', leaderboard);
			this.registry.set('daily', daily);
			this.registry.set('playerCounts', playerCounts);

			this.cameras.main.fade(200, 0, 0, 0);
			this.time.delayedCall(200, () => this.scene.start('Menu'));
		});
	}

	override update(_time: number, delta: number) {
		// Animate background
		this.background.update(delta);
	}
}
