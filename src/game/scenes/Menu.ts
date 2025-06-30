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
			.text(350, yourStatsY, 'Your Stats:', TextStyles.SCORE_LARGE)
			.setOrigin(0.5, 0)
			.setResolution(4);

		this.add
			.text(350, yourStatsY + 25, `Best: ${highscore}`, TextStyles.BODY_WHITE)
			.setOrigin(0.5, 0)
			.setResolution(4);

		if (rank) {
			this.add
				.text(350, yourStatsY + 45, `Rank: #${rank}`, TextStyles.SCORE_LARGE)
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
		const startY = 85;
		const lineHeight = 12; // More compact
		const tableWidth = 240; // Much wider table to use more screen space

		// Leaderboard title - smaller and more compact
		this.add
			.text(startX, startY, 'Top 10:', TextStyles.withFontSize(TextStyles.BODY_WHITE, '18px'))
			.setOrigin(0.5, 0)
			.setResolution(4);

		// Create leaderboard entries
		leaderboard.forEach((entry, index) => {
			const y = startY + 20 + (index * lineHeight);
			
			// Different colors for top ranks
			let textColor = '#dddddd'; // Light gray for most
			if (entry.rank === 1) {
				textColor = '#FFD700'; // Gold
			} else if (entry.rank === 2) { // silver
				textColor = '#C0C0C0';
			}else if (entry.rank === 3) { // bronze
				textColor = '#CD7F32';
			}

			// Create a compact text style
			const compactStyle = TextStyles.withColor(
				TextStyles.withFontSize(TextStyles.SMALL, '16px'), 
				textColor
			);

			// Column 1: Rank (small, left aligned)
			const rankText = entry.rank < 10 ? `# ${entry.rank}` : `#${entry.rank}`;
			this.add
				.text(startX - tableWidth/2 - 10, y, rankText, compactStyle)
				.setOrigin(0, 0) // Left aligned
				.setResolution(4);

			// Column 2: Username (smaller font, longer space, middle)
			// Truncate very long usernames with "..."
			let usernameText = `u/${entry.username}`;
			const maxUsernameLength = 18; // Max characters before truncation
			if (usernameText.length > maxUsernameLength) {
				usernameText = usernameText.substring(0, maxUsernameLength - 3) + '...';
			}
			
			const usernameStyle = TextStyles.withColor(
				TextStyles.withFontSize(TextStyles.SMALL, '16px'), // Smaller font for username
				textColor
			);
			this.add
				.text(startX - tableWidth/2 + 40, y, usernameText, usernameStyle) // Position after rank, more space
				.setOrigin(0, 0) // Left aligned
				.setResolution(4);

			// Column 3: Score (far right, right aligned)
			const scoreText = `${entry.score}`;
			this.add
				.text(startX + tableWidth/2 + 30, y, scoreText, compactStyle) // Use the extra table width
				.setOrigin(1, 0) // Right aligned
				.setResolution(4);
		});

		// If no leaderboard data
		if (leaderboard.length === 0) {
			this.add
				.text(startX, startY + 20, 'No scores yet!\nBe the first to play!', TextStyles.SMALL)
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