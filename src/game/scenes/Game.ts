import { Tweens } from "phaser";
import { Background } from "../components/Background.js";
import { TextStyles } from "../utils/TextStyles.js";

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
	lastCandleY!: number; // Y position of last candle for continuity
	nextCandleX!: number;

	// Physics constants
	rocketSpeed = 200;
	rocketPower = 200;
	candlesPerWeek = 5;
	candleWidth = 30;
	weekendGapMin = 2;
	weekendGapMax = 4;
	weekendTicks = 0;
	lastClose = 0;
	trendStrengthMin = 10;
	trendStrengthMax = 50;

	constructor() {
		super('Game');
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
		const maxY = this.scale.height - 20;

		const openY = this.lastClose;

		// 1) Richtung wählen
		let goDown = Phaser.Math.Between(0, 1) === 0;

		// 2) Genug Platz für trendStrengthMin?
		const roomUp = openY - minY;
		const roomDown = maxY - openY;

		if (goDown && roomDown < this.trendStrengthMin) goDown = false;
		if (!goDown && roomUp < this.trendStrengthMin) goDown = true;

		// 3) Zufällige Stärke zwischen min und max
		const chosen = Phaser.Math.Between(this.trendStrengthMin, this.trendStrengthMax);

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

	// MARK: - Create score trigger for candle
	createScoreTrigger(candleX: number) {
		const trigger = this.add.rectangle(
			candleX + this.rocket.width,
			this.scale.height / 2,
			10,
			this.scale.height,
			0xff0000,
			0
		);
		this.scores.add(trigger);
	}

	// MARK: - Increase game difficulty
	increaseDifficulty() {
		this.rocketSpeed = Math.min(this.rocketSpeed + 20, 350);

		// Update rocket's forward speed
		const rocketBody = this.rocket.body as Phaser.Physics.Arcade.Body;
		rocketBody.setVelocityX(this.rocketSpeed);
	}

	// MARK: - Create game
	create() {
		// Initialize game state
		this.internalScore = 0;
		this.gameStarted = false;
		this.gameOver = false;
		this.candleCount = 0;
		this.lastCandleY = this.scale.height / 2; // Start in middle of screen
		this.lastClose = this.scale.height / 2;   // Start-Close in der Mitte

		// Set up world bounds
		this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

		// Create background component
		this.background = new Background(this);

		// Create pipes group (without physics - we'll handle physics individually)
		this.candles = this.physics.add.staticGroup();
		this.scores = this.physics.add.staticGroup();

		// Create rocket (positioned at 25% of the screen width)
		this.rocket = this.physics.add
			.sprite(this.scale.width * 0.25, this.scale.height / 2, 'rocket')
			.setRotation(0)
			.play('rocket_idle');

		this.physics.add.collider(this.rocket, this.candles, this.hitCandle, undefined, this);
		this.physics.add.overlap(this.rocket, this.scores, this.hitScore, undefined, this);

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

		// diamons is 3-8 diamonds
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

		this.nextCandleX = this.scale.width + this.candleWidth;

		// Create UI
		this.scoreText = this.add
			.text(16, 16, 'Floor: 0', TextStyles.SCORE)
			.setResolution(4)
			.setScrollFactor(0);

		// Add start instructions
		const startText = this.add
			.text(this.scale.width / 2, this.scale.height / 2 - 50, 'Click to Start!\nClick to Thrust', TextStyles.BODY)
			.setOrigin(0.5)
			.setResolution(4);

		// Store start text to remove it later
		this.data.set('startText', startText);

		// Input handling
		this.input.on('pointerdown', this.thrustRocket, this);
		this.input.keyboard?.on('keydown-SPACE', this.thrustRocket, this);

		// Ensure physics world is running	
		this.cameras.main.startFollow(this.rocket, false, 1, 0, - this.scale.width / 4, 0);
		this.physics.world.pause();
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
		rocketBody.setVelocityY(-this.rocketPower);
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
		console.log('Physics world started, isPaused:', this.physics.world.isPaused);

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
		if (this.weekendTicks > 0) {
			this.weekendTicks--;
			this.nextCandleX += this.candleWidth;
			return;
		}

		this.candleCount++;

		const candleX = this.nextCandleX;

		const ohlc = this.calculateCandle();
		this.createCandleBody(candleX, ohlc);
		this.createScoreTrigger(candleX);

		this.lastClose = ohlc.closeY;

		this.nextCandleX += this.candleWidth * 2;

		if (this.candleCount >= this.candlesPerWeek) {
			this.candleCount = 0; // Reset for new week
			this.weekendTicks = Phaser.Math.Between(
				this.weekendGapMin,
				this.weekendGapMax
			);
			this.nextCandleX += this.weekendTicks * this.candleWidth;
		}
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
			this.scene.start('GameOver', { score: this.getDisplayScore() });
		});
	}

	// MARK: - Hit score
	hitScore(_: any, score: any) {
		this.internalScore += 1; // Increase internal score linearly
		const displayScore = this.getDisplayScore();
		this.scoreText.setText(`Floor: ${displayScore}`);

		// Increase internal score linearly
		if (this.internalScore % 5 === 0) {
			this.increaseDifficulty();
		}

		score.destroy();
	}

	// MARK: - Update
	override update(_time: number, delta: number) {
		// Always animate background, even when game is not started
		this.background.update(delta);

		if (this.gameOver || !this.gameStarted) return;

		// New candle spawning based on rocket's X position + one screen width
		if (this.rocket.x + this.scale.width > this.nextCandleX) {
			this.spawnCandles();
		}

		// Check if rocket hit ground or ceiling
		if (this.rocket.y <= 0 || this.rocket.y >= this.scale.height) {
			this.hitCandle();
		}

		// Remove candles that are far behind the rocket
		this.candles.children.entries.forEach((candle) => {
			if ((candle as Phaser.GameObjects.Sprite).x < this.rocket.x - this.scale.width) {
				candle.destroy();
			}
		});
	}
}
