import { Background } from "../components/Background.js";
import { GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from "../constants.js";
import { TextStyles } from "../utils/TextStyles.js";
import type { DailyInfo } from "../../shared/api.js";

export class Game extends Phaser.Scene {
	// Game objects
	rocket!: Phaser.GameObjects.Sprite;
	candles!: Phaser.Physics.Arcade.StaticGroup;
	scores!: Phaser.Physics.Arcade.StaticGroup;
	thrustParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
	buyParticle!: Phaser.GameObjects.Particles.ParticleEmitter;
	diamondParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
	rocketFlap!: Phaser.Tweens.TweenChain;

	// Background component
	background!: Background;

	// Game state
	internalScore!: number; // Internal float score that increases linearly
	scoreText!: Phaser.GameObjects.Text;
	gameStarted!: boolean;
	gameOver!: boolean;

	// Stock chart simulation
	candleCount!: number; // Track how many candles in current week
	nextCandleX!: number;

	// Physics constants
	private readonly minRocketSpeed = 200;
	private readonly maxRocketSpeed = 500;
	private readonly rocketSpeedIncrease = 5;
	private rocketSpeed = this.minRocketSpeed;

	private readonly rocketThrustPower = 200;

	private readonly candlesPerWeek = 5;
	private readonly candleWidth = 30;
	private readonly weekendGapMin = 2;
	private readonly weekendGapMax = 5;
	private readonly trendStrengthMin = 10;
	private readonly trendStrengthMax = 50;
	private weeksDone = 0;
	private lastClose = 0;
	private rng!: Phaser.Math.RandomDataGenerator;

	// Personal best marker
	private bestScore = 0;
	private spawnedTriggers = 0;
	private pbTriggerIndex = 0;

	// News events: market phases announced by a ticker, biasing the candles
	// for the following week. All randomness goes through this.rng so daily
	// challenge runs stay identical for every player.
	private static readonly NEWS_CHANCE = 0.45;
	private static readonly NEWS_HEADLINES = {
		bull: ['FED CUTS RATES!', 'MOON MISSION APPROVED!', 'INSTITUTIONS ARE BUYING!'],
		bear: ['SEC INVESTIGATION!', 'RUG PULL RUMORS!', 'GAINS TAX INCOMING!'],
		volatile: ['ELON TWEETS AGAIN!', 'EARNINGS WEEK CHAOS!', 'ALGO TRADERS GONE WILD!'],
	} as const;
	private newsType: keyof typeof Game.NEWS_HEADLINES | null = null;
	private newsWeeksLeft = 0;
	private newsBanner!: Phaser.GameObjects.Container;
	private newsText!: Phaser.GameObjects.Text;

	// Diamond collectibles
	private static readonly DIAMOND_CHANCE = 0.35;
	private diamondPickups!: Phaser.Physics.Arcade.StaticGroup;
	private diamondsCollected = 0;
	private diamondHud!: Phaser.GameObjects.Container;
	private diamondHudText!: Phaser.GameObjects.Text;

	constructor() {
		super('Game');
	}

	init() {
		// Initialize game state
		this.internalScore = 0;
		this.gameStarted = false;
		this.gameOver = false;
		this.candleCount = 0;
		this.rocketSpeed = this.minRocketSpeed;
		this.lastClose = GAME_HEIGHT / 2;
		this.weeksDone = 0;

		//	On daily challenge posts the candle sequence is generated from a
		//	per-day seed, so every player faces the same market.
		const daily: DailyInfo | null = this.registry.get('daily');
		this.rng = new Phaser.Math.RandomDataGenerator(
			daily ? [`moonrocket-${daily.date}`] : [`${Math.random()}`]
		);

		//	The personal best is marked in the level: passing the n-th score
		//	trigger yields floor(n^1.5) points, so find the first trigger that
		//	beats the current best and drop a marker there when it spawns.
		//	On daily posts the day's own best is the relevant reference.
		this.bestScore = daily
			? (daily.myBest ?? 0)
			: (this.registry.get('playerStats')?.highscore ?? 0);

		this.newsType = null;
		this.newsWeeksLeft = 0;
		this.diamondsCollected = 0;
		this.spawnedTriggers = 0;
		this.pbTriggerIndex = 0;
		if (this.bestScore > 0) {
			let n = Math.max(1, Math.floor(Math.pow(this.bestScore, 2 / 3)) - 1);
			while (Math.floor(Math.pow(n, 1.5)) <= this.bestScore) n++;
			this.pbTriggerIndex = n;
		}
	}

	// MARK: - Create game
	create() {
		//	Oversampled canvas: zoom the camera so the 560x240 design space
		//	fills the screen while movement stays subpixel-smooth.
		this.cameras.main.setZoom(RENDER_SCALE);

		// Set up world bounds
		this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

		// Create background component
		this.background = new Background(this);

		// Create pipes group (without physics - we'll handle physics individually)
		this.candles = this.physics.add.staticGroup();
		this.scores = this.physics.add.staticGroup();
		this.diamondPickups = this.physics.add.staticGroup();

		// Create rocket (positioned at 25% of the screen width)
		this.rocket = this.physics.add
			.sprite(GAME_WIDTH * 0.25, GAME_HEIGHT / 2, 'rocket')
			.setRotation(0)
			.play('rocket_idle');

		this.physics.add.collider(this.rocket, this.candles, this.hitCandle, undefined, this);
		this.physics.add.overlap(this.rocket, this.scores, this.hitScore, undefined, this);
		this.physics.add.overlap(this.rocket, this.diamondPickups, this.collectDiamond, undefined, this);

		(this.rocket.body as Phaser.Physics.Arcade.Body)
			.setSize(this.rocket.width - 16, this.rocket.height - 7, true)
			.setOffset(10, 3);

		this.rocketFlap = this.tweens.chain({
			targets: this.rocket,
			paused: true,
			persist: true,
			tweens: [
				{ scale: 1.2, rotation: -0.3, duration: 50 },
				{ scale: 1, duration: 150, ease: 'Power2' },
				{ rotation: 0, duration: 250, ease: 'Power2' },

			]
		});

		this.createParticles();

		this.nextCandleX = GAME_WIDTH + this.candleWidth;

		// Create UI (kept aligned with the camera view in update)
		this.scoreText = this.add
			.text(16, 16, 'Floor: 0', TextStyles.SCORE)
			.setResolution(4)
			.setDepth(1000);

		// Diamond counter, pinned to the top-right of the camera view
		this.diamondHudText = this.add
			.text(-6, 0, '0', TextStyles.SCORE)
			.setOrigin(1, 0.5)
			.setResolution(4);
		this.diamondHud = this.add
			.container(0, 0, [
				this.diamondHudText,
				this.add.image(0, 0, 'diamond').setOrigin(0, 0.5).setScale(0.6),
			])
			.setDepth(1000);

		// News ticker banner (hidden until a news event fires)
		this.newsText = this.add
			.text(12, 0, '', TextStyles.withFontSize(TextStyles.SCORE, '12px'))
			.setOrigin(0, 0.5)
			.setResolution(4);
		this.newsBanner = this.add
			.container(0, 0, [
				this.add.image(0, 0, 'news').setOrigin(0, 0.5).setScale(0.6),
				this.newsText,
			])
			.setDepth(900)
			.setVisible(false);

		// Add start instructions
		const startText = this.add
			.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'Click to Start!\nClick to Thrust', TextStyles.BODY)
			.setOrigin(0.5)
			.setResolution(4);

		// Store start text to remove it later
		this.data.set('startText', startText);

		// Input handling
		this.input.on('pointerdown', this.thrustRocket, this);
		this.input.keyboard?.on('keydown-SPACE', this.thrustRocket, this);

		// Ensure physics world is running
		this.cameras.main.startFollow(this.rocket, false, 1, 0, - GAME_WIDTH / 4, 0);
		this.cameras.main.on(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, () => {
			// Keep the HUD pinned to the camera view. midPoint is used instead
			// of worldView because worldView is rounded to whole pixels, which
			// would make the elements jitter.
			const cam = this.cameras.main;
			const viewLeft = cam.midPoint.x - cam.displayWidth / 2;
			const viewTop = cam.midPoint.y - cam.displayHeight / 2;
			this.scoreText.setPosition(viewLeft + 16, viewTop + 16);
			this.newsBanner.setPosition(viewLeft + cam.displayWidth / 2 - 80, viewTop + 40);
			this.diamondHud.setPosition(viewLeft + cam.displayWidth - 26, viewTop + 22);
		});
		this.physics.world.pause();
	}

	// MARK: - Calculate exponential display score from internal linear score
	getDisplayScore(): number {
		// Exponential formula: floor(internalScore^1.5)
		// This creates exponential growth: 0->0, 1->1, 2->2, 3->5, 4->8, 5->11, 6->14, 7->18, etc.
		return Math.floor(Math.pow(this.internalScore, 1.5));
	}

	// MARK: - Calculate candle OHLC values based on previous close
	calculateCandle(): { openY: number; closeY: number } {
		const minY = 20;
		const maxY = GAME_HEIGHT - 20;

		const openY = this.lastClose;

		// 1) Richtung wählen (Marktphasen verschieben die Wahrscheinlichkeit)
		const downChance = this.newsType === 'bull' ? 0.25 : this.newsType === 'bear' ? 0.75 : 0.5;
		let goDown = this.rng.frac() < downChance;

		// 2) Genug Platz für trendStrengthMin?
		const roomUp = openY - minY;
		const roomDown = maxY - openY;

		if (goDown && roomDown < this.trendStrengthMin) goDown = false;
		if (!goDown && roomUp < this.trendStrengthMin) goDown = true;

		// 3) Zufällige Stärke zwischen min und max (volatile Wochen schlagen stärker aus)
		const strengthScale = this.newsType === 'volatile' ? 1.7 : 1;
		const chosen = Math.round(
			this.rng.between(this.trendStrengthMin, this.trendStrengthMax) * strengthScale
		);

		// 4) Falls zu weit, kürzen
		const maxAllowed = goDown ? roomDown : roomUp;
		const magnitude = Math.min(chosen, maxAllowed);

		const delta = goDown ? magnitude : -magnitude;
		const closeY = openY + delta;

		return { openY, closeY };
	}


	// MARK: - Create candle body sprite
	createCandleBody(candleX: number, ohlc: { openY: number, closeY: number }) {
		const { openY, closeY } = ohlc;
		const bodyH = Math.abs(closeY - openY) + 28;
		const bodyMid = (openY + closeY) / 2;
		const isUp = closeY < openY;


		const candle = this.add
			.nineslice(
				candleX,
				bodyMid,
				isUp ? 'candle_green' : 'candle_red',
				undefined,
				this.candleWidth,
				bodyH,
				0, 0, 14, 14
			);

		this.candles.add(candle);

		const body = candle.body as Phaser.Physics.Arcade.Body;
		body.setSize(28, (bodyH) - 28, true).setOffset(1, 14);
	}

	// MARK: - Personal best marker
	//	A golden line at the position where the current run would beat the
	//	player's all-time best - motivating when the record comes into view.
	createBestMarker(markerX: number) {
		this.add.rectangle(markerX, GAME_HEIGHT / 2, 1, GAME_HEIGHT, 0xffd700, 0.4);
		this.add
			.text(markerX + 4, 6, `PB ${this.bestScore}`,
				TextStyles.withColor(TextStyles.withFontSize(TextStyles.SMALL, '10px'), '#FFD700'))
			.setResolution(4);
	}

	// MARK: - Create score trigger for candle
	createScoreTrigger(candleX: number) {
		const trigger = this.add.rectangle(
			candleX + this.rocket.width,
			GAME_HEIGHT / 2,
			10,
			GAME_HEIGHT,
			0xff0000,
			0
		);
		this.scores.add(trigger);
	}

	createParticles() {
		this.thrustParticles = this.add
			.particles(0, 0, 'star', {
				quantity: { min: 5, max: 15 },
				lifespan: 1200,
				speedX: { min: -120, max: 120 },
				speedY: { min: -140, max: -60 },
				gravityY: 400,
				rotate: { min: 0, max: 360 }, // should be more random  and rotate
				alpha: { start: 1, end: 0 },
			})
			.startFollow(this.rocket, -this.rocket.width * 0.1, 0)
			.stop();

		this.buyParticle = this.add
			.particles(0, 0, 'buy', {
				quantity: 1,
				lifespan: 500,
				gravityY: 400,
				speedX: { min: -50, max: 50 },
				speedY: { min: -40, max: -40 },
				scale: { start: 1, end: 0.2 },
				alpha: { start: 1, end: 0 },
			})
			.startFollow(this.rocket, -this.rocket.width * 0.2, 0)
			.stop();

		this.diamondParticles = this.add
			.particles(0, 0, 'diamond', {
				quantity: { min: 3, max: 8 },
				lifespan: 2000,
				gravityY: 400,
				rotate: { min: 0, max: 360 }, // should be more random  and rotate
				scale: { min: 0.4, max: 0.8 },
				speedX: { min: -120, max: 120 },
				speedY: { min: -140, max: -60 },
			})
			.startFollow(this.rocket, 0, 0)
			.stop();
	}

	// MARK: - Flap
	thrustRocket() {
		if (this.gameOver) {
			return;
		}

		// Start game on first thrust
		if (!this.gameStarted) {
			this.startGame();
		}

		// Make rocket thrust
		const rocketBody = this.rocket.body as Phaser.Physics.Arcade.Body;
		rocketBody.setVelocityY(-this.rocketThrustPower);
		rocketBody.setVelocityX(this.rocketSpeed); // Move rocket forward
		// Play sound
		this.sound.play('flap', { volume: 0.3 });

		// Play thrust animation
		this.rocket.play('rocket_thrust');

		// Return to idle animation after a short delay
		this.time.delayedCall(200, () => {
			if (!this.gameOver) {
				this.rocket.play('rocket_idle');
			}
		});

		// Create thrust particles
		this.thrustParticles.explode();
		this.buyParticle.explode();

		this.rocketFlap.restart();
	}

	// MARK: - Start game
	startGame() {
		this.gameStarted = true;

		// Ensure physics world is running
		this.physics.world.resume();

		// Reset rocket to idle animation
		this.rocket.play('rocket_idle');

		// Start rocket moving forward
		const rocketBody = this.rocket.body as Phaser.Physics.Arcade.Body;
		rocketBody.setVelocityX(this.rocketSpeed);

		// Remove start text
		const startText = this.data.get('startText');
		if (startText) {
			startText.destroy();
		}

		// Spawn first set of pipes
		this.time.delayedCall(1000, this.spawnCandles, [], this);
	}

	// MARK: - Spawn pipes
	spawnCandles() {
		if (this.gameOver) return;

		// Skip candle spawn during weekend
		//	if (this.weekendTicks > 0) {
		//		this.weekendTicks--;
		//		this.nextCandleX += this.candleWidth;
		//		return;
		//	}

		this.candleCount++;

		const candleX = this.nextCandleX;

		const ohlc = this.calculateCandle();
		this.createCandleBody(candleX, ohlc);
		this.createScoreTrigger(candleX);

		this.spawnedTriggers++;
		if (this.pbTriggerIndex > 0 && this.spawnedTriggers === this.pbTriggerIndex) {
			this.createBestMarker(candleX + this.rocket.width);
		}

		//	Chance for a diamond in the gap after this candle. Both rng rolls
		//	are deterministic, so daily runs place identical diamonds.
		const diamondRoll = this.rng.frac();
		const diamondY = this.rng.between(30, GAME_HEIGHT - 30);
		if (diamondRoll < Game.DIAMOND_CHANCE) {
			this.diamondPickups.add(this.add.image(candleX + this.candleWidth + 14, diamondY, 'diamond'));
		}

		this.lastClose = ohlc.closeY;

		this.nextCandleX += this.candleWidth * 2;

		if (this.candleCount >= this.candlesPerWeek) {
			this.candleCount = 0; // Reset for new week
			const weekendTicks = this.rng.between(
				this.weekendGapMin,
				this.weekendGapMax
			);
			this.nextCandleX += weekendTicks * this.candleWidth * 2;

			this.updateNews();
		}
	}

	// MARK: - News events
	//	Called at every week boundary. Note: the rng calls happen
	//	unconditionally and in a fixed order to keep daily runs deterministic.
	updateNews() {
		if (this.newsWeeksLeft > 0) {
			this.newsWeeksLeft--;
			if (this.newsWeeksLeft === 0) {
				this.newsType = null;
			}
		}

		const roll = this.rng.frac();
		if (this.newsType === null && roll < Game.NEWS_CHANCE) {
			const types = Object.keys(Game.NEWS_HEADLINES) as (keyof typeof Game.NEWS_HEADLINES)[];
			this.newsType = types[this.rng.between(0, types.length - 1)]!;
			this.newsWeeksLeft = 1;

			const headlines = Game.NEWS_HEADLINES[this.newsType];
			this.showNewsBanner(headlines[this.rng.between(0, headlines.length - 1)]!);
		}
	}

	showNewsBanner(headline: string) {
		const color = this.newsType === 'bull' ? '#1ec51e' : this.newsType === 'bear' ? '#f7323c' : '#ffff88';
		this.newsText.setText(headline).setColor(color);

		this.newsBanner.setAlpha(0).setVisible(true);
		this.tweens.add({
			targets: this.newsBanner,
			alpha: 1,
			duration: 250,
			yoyo: true,
			hold: 3200,
			onComplete: () => this.newsBanner.setVisible(false),
		});
	}


	// MARK: - Hit candle
	hitCandle() {
		if (this.gameOver) return;

		this.gameOver = true;

		// Play crash animation
		this.rocket.play('rocket_crash');

		// Visual feedback
		this.cameras.main.shake(200, 0.02);
		this.cameras.main.flash(200, 255, 0, 0, false);

		// Stop rocket forward movement but let it fall
		const rocketBody = this.rocket.body as Phaser.Physics.Arcade.Body;
		rocketBody.setVelocityX(0);

		// Rocket spins as it crashes
		this.tweens.add({
			targets: this.rocket,
			rotation: Math.PI * 2, // Full spin
			duration: 800,
			ease: 'Power2'
		});

		this.diamondParticles.explode();
		this.sound.play('explosion', { volume: 0.3 });

		// Show game over after short delay
		this.time.delayedCall(800, () => {
			this.scene.start('GameOver', { score: this.getDisplayScore(), diamonds: this.diamondsCollected });
		});
	}

	// MARK: - Collect diamond
	collectDiamond(_: any, diamond: any) {
		this.diamondsCollected++;
		this.diamondHudText.setText(`${this.diamondsCollected}`);
		this.sound.play('milestone', { volume: 0.2 });
		diamond.destroy();
	}

	// MARK: - Hit score
	hitScore(_: any, scoreCollider: any) {
		this.internalScore += 1; // Increase internal score linearly
		const displayScore = this.getDisplayScore();
		this.scoreText.setText(`Floor: ${displayScore}`);

		// Increase internal score linearly
		if (this.internalScore % 5 === 0) {
			this.rocketSpeed = Math.min(this.rocketSpeed + this.rocketSpeedIncrease, this.maxRocketSpeed);

			// Update rocket's forward speed
			const rocketBody = this.rocket.body as Phaser.Physics.Arcade.Body;
			rocketBody.setVelocityX(this.rocketSpeed);

			this.weeksDone++;
		}

		scoreCollider.destroy();
	}

	// MARK: - Update
	override update(_time: number, delta: number) {
		// Always animate background, even when game is not started
		this.background.update(delta);

		if (this.gameOver || !this.gameStarted) return;

		// New candle spawning based on rocket's X position + one screen width
		if (this.rocket.x + GAME_WIDTH > this.nextCandleX) {
			this.spawnCandles();
		}

		// Check if rocket hit ground or ceiling
		if (this.rocket.y <= 0 || this.rocket.y >= GAME_HEIGHT) {
			this.hitCandle();
		}

		// Remove candles that are far behind the rocket
		this.candles.children.entries.forEach((candle) => {
			if ((candle as Phaser.GameObjects.Sprite).x < this.rocket.x - GAME_WIDTH) {
				candle.destroy();
			}
		});
	}
}
