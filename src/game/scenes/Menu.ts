import { Scene } from 'phaser'
import { StartButton } from '../components/StartButton.js'
import { Background } from '../components/Background.js'
import { TextStyles } from '../utils/TextStyles.js'
import type { LeaderboardEntry } from '../../shared/messages.js'

export class Menu extends Scene {
	background!: Background;
	leaderboardContainer!: Phaser.GameObjects.Container;

	constructor() {
		super({ key: 'Menu' })
	}

	async create() {
		// Create animated background
		this.background = new Background(this);
		const { width, height } = this.scale

		//	You can use the registry to access the playerStats data from the Preloader scene
		//	or store data that you want to access in other scenes.
		const playerStats = this.registry.get('playerStats')
		const leaderboard: LeaderboardEntry[] = this.registry.get('leaderboard') || []
		const { highscore, attempts, rank } = playerStats

		// Logo
		this.add.image(100, 20, 'logo').setOrigin(0.5, 0);

		// Your stats section
		const yourStatsY = 10;
		this.add
			.text(350, yourStatsY, 'Your Stats:', TextStyles.SUBTITLE)
			.setOrigin(0.5, 0)
			.setResolution(4);

		this.add
			.text(350, yourStatsY + 25, `Best: ${highscore}`, TextStyles.BODY_WHITE)
			.setOrigin(0.5, 0)
			.setResolution(4);

		if (rank) {
			this.add
				.text(350, yourStatsY + 45, `Rank: #${rank}`, TextStyles.SUBTITLE_YELLOW)
				.setOrigin(0.5, 0)
				.setResolution(4);
		}

		this.add.image(490, 25, 'rocket').setOrigin(0.5, 0).setScale(1);

		// Leaderboard section
		this.createLeaderboard(leaderboard);

		new StartButton(this, 100, 150).onClick(() => this.startGame());
		this.input.keyboard?.on('keydown-SPACE', () => this.startGame(), this);
	}

	createLeaderboard(leaderboard: LeaderboardEntry[]) {
		const startX = 350;
		const startY = 90;
		const lineHeight = 16;

		// Leaderboard title
		this.add
			.text(startX, startY, 'Top 10 Leaderboard:', TextStyles.HEADER)
			.setOrigin(0.5, 0)
			.setResolution(4);

		// Create leaderboard entries
		leaderboard.forEach((entry, index) => {
			const y = startY + 30 + (index * lineHeight);
			
			// Rank and username
			const rankText = `#${entry.rank}`;
			const usernameText = `u/${entry.username}`;
			const scoreText = `${entry.score}`;
			
			// Different colors for top 3
			let textStyle = TextStyles.SMALL;
			if (entry.rank === 1) {
				textStyle = TextStyles.withColor(TextStyles.SMALL, '#FFD700'); // Gold
			} else if (entry.rank === 2) {
				textStyle = TextStyles.withColor(TextStyles.SMALL, '#C0C0C0'); // Silver
			} else if (entry.rank === 3) {
				textStyle = TextStyles.withColor(TextStyles.SMALL, '#CD7F32'); // Bronze
			}

			// Create the leaderboard line
			const lineText = `${rankText} ${usernameText.padEnd(15)} ${scoreText}`;
			
			this.add
				.text(startX, y, lineText, textStyle)
				.setOrigin(0.5, 0)
				.setResolution(4)
				.setFontFamily('monospace'); // Use monospace for better alignment
		});

		// If no leaderboard data
		if (leaderboard.length === 0) {
			this.add
				.text(startX, startY + 30, 'No scores yet!\nBe the first to play!', TextStyles.SMALL)
				.setOrigin(0.5, 0)
				.setResolution(4);
		}
	}

	startGame() {
		this.scene.start('Game');
	}

	override update(_time: number, delta: number) {
		// Animate background
		this.background.update(delta);
	}
}