import { Scene } from 'phaser'
import { StartButton } from '../components/StartButton.js'
import { Background } from '../components/Background.js'
import { GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from '../constants.js'
import { getSelectedSkin, SKINS, setSelectedSkin } from '../skins.js'
import { TextStyles } from '../utils/TextStyles.js'
import type { DailyInfo, LeaderboardEntry } from '../../shared/api.js'

export class Menu extends Scene {
	background!: Background;

	constructor() {
		super({ key: 'Menu' })
	}

	async create() {
		this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);

		// Create animated background
		this.background = new Background(this);

		//	You can use the registry to access the playerStats data from the Preloader scene
		//	or store data that you want to access in other scenes.
		const playerStats = this.registry.get('playerStats')
		const leaderboard: LeaderboardEntry[] = this.registry.get('leaderboard') || []
		const daily: DailyInfo | null = this.registry.get('daily') || null
		const { highscore, rank } = playerStats

		// Logo
		this.add.image(100, 20, 'logo').setOrigin(0.5, 0);

		//	On daily challenge posts, show the date and today's board instead
		//	of the all-time leaderboard.
		if (daily) {
			this.add
				.text(100, 114, `DAILY CHALLENGE ${daily.date}`,
					TextStyles.withAlign(TextStyles.withFontSize(TextStyles.SMALL, '10px'), 'center'))
				.setOrigin(0.5, 0)
				.setResolution(4);
		}

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
		this.createLeaderboard(daily ? daily.leaderboard : leaderboard, daily ? "Today's Top 10:" : 'Top 10:');

		new StartButton(this, 100, 150).onClick(() => this.startGame());
		this.input.keyboard?.on('keydown-SPACE', () => this.startGame(), this);

		// Diamond balance under the start button
		this.add.image(86, 186, 'diamond').setScale(0.7);
		this.add
			.text(96, 186, `× ${playerStats.diamonds ?? 0}`, TextStyles.withFontSize(TextStyles.SMALL, '12px'))
			.setOrigin(0, 0.5)
			.setResolution(4);

		this.createSkinPicker(playerStats.diamonds ?? 0);
		this.createSoundToggle();

		// Player activity, bottom-right corner
		const counts = this.registry.get('playerCounts');
		if (counts) {
			this.add
				.text(
					GAME_WIDTH - 8,
					GAME_HEIGHT - 6,
					`PLAYERS · TODAY ${counts.today} · WEEK ${counts.week} · MONTH ${counts.month}`,
					TextStyles.withFontSize(TextStyles.SMALL, '10px')
				)
				.setOrigin(1, 1)
				.setResolution(4);
		}
	}

	createSkinPicker(totalDiamonds: number) {
		const rowY = 210;
		const startX = 62;
		const spacing = 32;

		this.add
			.text(startX - 24, rowY, 'SKIN:', TextStyles.withFontSize(TextStyles.SMALL, '10px'))
			.setOrigin(1, 0.5)
			.setResolution(4);

		const selection = this.add
			.rectangle(0, rowY, 24, 22)
			.setStrokeStyle(1, 0xffff00)
			.setFillStyle(0, 0);

		const selectSkin = (key: string) => {
			setSelectedSkin(key);
			const index = SKINS.findIndex((s) => s.key === key);
			selection.setX(startX + index * spacing);
		};

		SKINS.forEach((skin, index) => {
			const x = startX + index * spacing;
			const unlocked = skin.cost <= totalDiamonds;

			//	Render each skin at roughly uniform display height.
			const icon = this.add.sprite(x, rowY, skin.key, 0).setInteractive({ useHandCursor: true });
			icon.setScale(14 / icon.height);

			if (!unlocked) {
				icon.setAlpha(0.35);
				this.add
					.text(x, rowY + 13, `${skin.cost}`, TextStyles.withFontSize(TextStyles.SMALL, '8px'))
					.setOrigin(0.5, 0)
					.setResolution(4);
			}

			icon.on('pointerdown', () => {
				if (unlocked) {
					selectSkin(skin.key);
				} else {
					icon.setAlpha(0.35);
				}
			});
		});

		selectSkin(getSelectedSkin(totalDiamonds).key);
	}

	createSoundToggle() {
		//	Kept away from the bottom edge: Reddit's expanded view swallows
		//	clicks in a gesture zone along the lowest screen pixels.
		const soundText = this.add
			.text(200, 210, '', TextStyles.withFontSize(TextStyles.SMALL, '10px'))
			.setOrigin(0, 0.5)
			.setResolution(4);

		const applyLabel = () => {
			soundText.setText(this.sound.mute ? 'SOUND: OFF' : 'SOUND: ON');
			soundText.setColor(this.sound.mute ? '#777777' : '#cccccc');
			//	Text width changes with the label; refresh the hit area.
			soundText.setInteractive({ useHandCursor: true });
		};
		applyLabel();

		soundText.on('pointerup', () => {
			this.sound.mute = !this.sound.mute;
			applyLabel();
			try {
				localStorage.setItem('moonrocket-sound', this.sound.mute ? 'off' : 'on');
			} catch {
				// localStorage may be unavailable in some embedded contexts
			}
		});
	}

	createLeaderboard(leaderboard: LeaderboardEntry[], title: string) {
		const startX = 350;
		const startY = 85;
		const lineHeight = 12; // More compact
		const tableWidth = 240; // Much wider table to use more screen space

		// Leaderboard title - smaller and more compact
		this.add
			.text(startX, startY, title, TextStyles.withFontSize(TextStyles.BODY_WHITE, '18px'))
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
			} else if (entry.rank === 3) { // bronze
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
				.text(startX - tableWidth / 2 - 10, y, rankText, compactStyle)
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
				.text(startX - tableWidth / 2 + 40, y, usernameText, usernameStyle) // Position after rank, more space
				.setOrigin(0, 0) // Left aligned
				.setResolution(4);

			// Column 3: Score (far right, right aligned)
			const scoreText = `${entry.score}`;
			this.add
				.text(startX + tableWidth / 2 + 30, y, scoreText, compactStyle) // Use the extra table width
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
