import { Scene } from 'phaser'
import { StartButton } from '../components/StartButton.js'
import { Background } from '../components/Background.js'
import { GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from '../constants.js'
import { getSelectedSkin, SKINS, setSelectedSkin } from '../skins.js'
import { TextStyles } from '../utils/TextStyles.js'
import type { ChallengeInfo, GameMode, LeaderboardEntry } from '../../shared/api.js'

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
		const challenge: ChallengeInfo | null = this.registry.get('challenge') || null

		// Logo
		this.add.image(100, 20, 'logo').setOrigin(0.5, 0);

		if (challenge && !challenge.isToday) {
			//	Archived challenge: replayable, but nothing is scored.
			this.add
				.text(100, 114, `ARCHIVE ${challenge.date} — NO SCORING`,
					TextStyles.withAlign(TextStyles.withFontSize(TextStyles.SMALL, '10px'), 'center'))
				.setOrigin(0.5, 0)
				.setResolution(4);
		} else {
			this.createModeToggle();
		}

		// Leaderboard tabs: the challenge board (today's global race, or the
		// frozen board of an archived date) plus this subreddit's boards.
		this.createLeaderboardTabs([
			...(challenge
				? [{ label: challenge.isToday ? 'TODAY' : 'ARCHIVE', entries: challenge.leaderboard }]
				: []),
			{ label: 'SCORE', entries: leaderboard },
			{ label: 'DIAMONDS', entries: this.registry.get('diamondLeaderboard') || [] },
		]);

		new StartButton(this, 100, 170).onClick(() => this.startGame());
		this.input.keyboard?.on('keydown-SPACE', () => this.startGame(), this);

		// Diamond balance and today's best haul, bottom center
		const diamondLine = this.add
			.text(
				GAME_WIDTH / 2 + 8,
				GAME_HEIGHT - 6,
				`× ${playerStats.diamonds ?? 0}   TODAY'S BEST: ${playerStats.diamondsToday ?? 0}`,
				TextStyles.withFontSize(TextStyles.SMALL, '12px')
			)
			.setOrigin(0.5, 1)
			.setResolution(4);
		this.add
			.image(diamondLine.x - diamondLine.displayWidth / 2 - 8, diamondLine.y - diamondLine.displayHeight / 2, 'diamond')
			.setScale(0.7);

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
		//	Both labels are pre-rendered and toggled via visibility. The state
		//	lives in a local variable - reading this.sound.mute back lags one
		//	frame, which made the label trail the actual state by one click.
		let muted = false;
		try {
			muted = localStorage.getItem('moonrocket-sound') === 'off';
		} catch {
			// localStorage may be unavailable in some embedded contexts
		}

		const style = TextStyles.withFontSize(TextStyles.SMALL, '10px');
		const onText = this.add
			.text(8, GAME_HEIGHT - 6, 'SOUND: ON', style)
			.setOrigin(0, 1)
			.setResolution(4);
		const offText = this.add
			.text(8, GAME_HEIGHT - 6, 'SOUND: OFF', TextStyles.withColor(style, '#888888'))
			.setOrigin(0, 1)
			.setResolution(4);

		const sync = () => {
			this.sound.mute = muted;
			onText.setVisible(!muted);
			offText.setVisible(muted);
		};
		sync();

		//	Invisible, generously sized hit area on top of the label.
		const hit = this.add
			.rectangle(4, GAME_HEIGHT, 78, 22)
			.setOrigin(0, 1)
			.setFillStyle(0, 0)
			.setInteractive({ useHandCursor: true });

		hit.on('pointerdown', () => {
			muted = !muted;
			sync();
			try {
				localStorage.setItem('moonrocket-sound', muted ? 'off' : 'on');
			} catch {
				// localStorage may be unavailable in some embedded contexts
			}
		});
		hit.on('pointerover', () => {
			onText.setTint(0xffff00);
			offText.setTint(0xffff00);
		});
		hit.on('pointerout', () => {
			onText.clearTint();
			offText.clearTint();
		});
	}

	//	Mode toggle under the logo: today's seeded challenge (default) or a
	//	fresh random market. The choice lives in the registry and is read by
	//	the Game scene.
	createModeToggle() {
		const options: { mode: GameMode; label: string; y: number }[] = [
			{ mode: 'daily', label: "TODAY'S CHALLENGE", y: 110 },
			{ mode: 'random', label: 'RANDOM', y: 124 },
		];

		const texts: Phaser.GameObjects.Text[] = [];
		const current: GameMode = this.registry.get('gameMode') ?? 'daily';

		const select = (mode: GameMode) => {
			this.registry.set('gameMode', mode);
			options.forEach((option, i) => {
				texts[i]!.setColor(option.mode === mode ? '#ffff00' : '#888888');
			});
		};

		options.forEach((option) => {
			const text = this.add
				.text(100, option.y, option.label, TextStyles.withAlign(TextStyles.withFontSize(TextStyles.SMALL, '10px'), 'center'))
				.setOrigin(0.5, 0)
				.setResolution(4)
				.setInteractive({ useHandCursor: true });
			text.on('pointerdown', () => select(option.mode));
			texts.push(text);
		});

		select(current);
	}

	//	Tabbed leaderboards in the right column. The first tab (daily) is
	//	selected initially.
	createLeaderboardTabs(boards: { label: string; entries: LeaderboardEntry[] }[]) {
		const startX = 370;
		const tabY = 12;
		const listContainer = this.add.container(0, 0);
		const tabTexts: Phaser.GameObjects.Text[] = [];

		const select = (index: number) => {
			tabTexts.forEach((t, i) => t.setColor(i === index ? '#ffff00' : '#aaaaaa'));
			listContainer.removeAll(true);
			this.renderLeaderboard(listContainer, boards[index]!.entries);
		};

		boards.forEach((board, index) => {
			const tab = this.add
				.text(startX + (index - (boards.length - 1) / 2) * 90, tabY, board.label, TextStyles.withFontSize(TextStyles.SCORE, '14px'))
				.setOrigin(0.5, 0)
				.setResolution(4)
				.setInteractive({ useHandCursor: true });
			tab.on('pointerdown', () => select(index));
			tabTexts.push(tab);
		});

		select(0);
	}

	renderLeaderboard(container: Phaser.GameObjects.Container, leaderboard: LeaderboardEntry[]) {
		const startX = 370;
		const startY = 36;
		const lineHeight = 15;
		const tableWidth = 240;

		// Create leaderboard entries
		leaderboard.forEach((entry, index) => {
			const y = startY + (index * lineHeight);

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
			container.add(this.add
				.text(startX - tableWidth / 2 - 10, y, rankText, compactStyle)
				.setOrigin(0, 0) // Left aligned
				.setResolution(4));

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
			container.add(this.add
				.text(startX - tableWidth / 2 + 40, y, usernameText, usernameStyle) // Position after rank, more space
				.setOrigin(0, 0) // Left aligned
				.setResolution(4));

			// Column 3: Score (far right, right aligned)
			const scoreText = `${entry.score}`;
			container.add(this.add
				.text(startX + tableWidth / 2 + 30, y, scoreText, compactStyle) // Use the extra table width
				.setOrigin(1, 0) // Right aligned
				.setResolution(4));
		});

		// If no leaderboard data
		if (leaderboard.length === 0) {
			container.add(this.add
				.text(startX, startY + 10, 'No scores yet!\nBe the first to play!', TextStyles.withAlign(TextStyles.SMALL, 'center'))
				.setOrigin(0.5, 0)
				.setResolution(4));
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
