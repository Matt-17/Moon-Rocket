export class Game extends Phaser.Scene {
	// Game objects
	rocket!: Phaser.GameObjects.Sprite;
	pipes!: Phaser.GameObjects.Group;
	particles!: Phaser.GameObjects.Group;
	backgroundItems!: Phaser.GameObjects.Group;

	// Game state
	internalScore!: number; // Internal float score that increases linearly
	scoreText!: Phaser.GameObjects.Text;
	gameStarted!: boolean;
	gameOver!: boolean;

	// Stock chart simulation
	candleCount!: number; // Track how many candles in current week
	lastCandleY!: number; // Y position of last candle for continuity

	// Physics constants
	gravity = 600;
	flapPower = 200;
	pipeSpeed = 200;
	pipeGap = 150;
	candlesPerWeek = 5;
	weekendGapMin = 3;   // in Kerzenbreiten
	weekendGapMax = 8;
	weekendTicks = 0;    // wie viele Spawns noch überspringen
	lastClose = 0;          // wird in create() gesetzt
	trendStrengthMin = 30;     // min. Pixel rauf/runter pro Kerze
	trendStrengthMax = 150;     // max. Pixel rauf/runter pro Kerze
	nextCandleX!: number;// Track next candle X position for proper spacing
	candleWidth = 30;

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
	calculateCandleOHLC(): { openY: number, closeY: number } {
		const openY = this.lastClose;
		// Abstand zum Rand berechnen
		const minY = 20;
		const maxY = this.scale.height - 20;
		const roomUp = openY - minY;          // wie viel Platz nach oben  (negativ Δ)
		const roomDown = maxY - openY;          // wie viel Platz nach unten (positiv Δ)

		// erlaubte Magnitude bestimmen
		const maxUp = Math.min(roomUp, this.trendStrengthMax);
		const maxDown = Math.min(roomDown, this.trendStrengthMax);

		// zufällige Richtung
		const goDown = Phaser.Math.Between(0, 1) === 0;

		// Magnitude ≥ trendStrengthMin, aber ≤ zulässiger Max in der gewählten Richtung
		let magnitude = Phaser.Math.Between(this.trendStrengthMin, goDown ? maxDown : maxUp);

		// falls der Platz enger als trendStrengthMin ist ➜ nimm den Rest-Platz
		if (goDown && roomDown < this.trendStrengthMin) magnitude = roomDown;
		if (!goDown && roomUp < this.trendStrengthMin) magnitude = roomUp;

		const delta = goDown ? magnitude : -magnitude;
		const closeY = openY + delta;

		return { openY, closeY };
	}

	// MARK: - Create candle body sprite
	createCandleBody(candleX: number, ohlc: { openY: number, closeY: number }) {
		const { openY, closeY } = ohlc;
		const bodyH = Math.abs(closeY - openY) + 14;
		const bodyMid = (openY + closeY) / 2;
		const isUp = closeY < openY;

		const candle = this.add
			.nineslice(
				candleX,
				bodyMid,
				isUp ? 'candle_green' : 'candle_red',
				undefined,
				this.candleWidth,
				bodyH, // /4 because of 4x scale
				0, 0, 14, 14
			);

		this.physics.add.existing(candle);
		const body = candle.body as Phaser.Physics.Arcade.Body;
		body.setVelocityX(-this.pipeSpeed).setImmovable(true);
		body.setSize(12, (bodyH) - 12, true).setOffset(1, 6);

		return candle;
	}

	// MARK: - Create score trigger for candle
	createScoreTrigger(candleX: number) {
		const trigger = this.add.rectangle(
			candleX + this.rocket.width,
			this.scale.height / 2,
			10,
			this.scale.height,
			0xff0000,
			0.5
		);

		this.physics.add.existing(trigger);
		const tBody = trigger.body as Phaser.Physics.Arcade.Body;
		tBody.setVelocityX(-this.pipeSpeed).setImmovable(true);
		(trigger as any).isScoreTrigger = true;

		return trigger;
	}

	// MARK: - Check if weekend should start and set up gap
	handleWeekendLogic() {
		if (this.candleCount >= this.candlesPerWeek) {
			this.candleCount = 0; // Reset for new week
			this.weekendTicks = Phaser.Math.Between(
				this.weekendGapMin,
				this.weekendGapMax
			);
			this.nextCandleX += this.weekendTicks * this.candleWidth;
		}
	}

	// MARK: - Increase game difficulty
	increaseDifficulty() {
		this.pipeSpeed = Math.min(this.pipeSpeed + 20, 350);

		// Update existing particles to match new world speed
		this.updateParticleVelocities();
	}

	// MARK: - Update particle velocities
	updateParticleVelocities() {
		// Update all existing particles to match current world speed
		this.particles.children.entries.forEach((particle) => {
			const particleSprite = particle as Phaser.GameObjects.Sprite;
			const particleBody = particleSprite.body as Phaser.Physics.Arcade.Body;
			if (particleBody) {
				const currentY = particleBody.velocity.y;
				const particleSpeed = Phaser.Math.Between(-60, -20);
				particleBody.setVelocityX(-this.pipeSpeed + particleSpeed);
				particleBody.setVelocityY(currentY); // Keep existing Y velocity
			}
		});
	}

	// MARK: - Create thrust particles
	createThrustParticles() {
		// Create 2-3 particles at rocket position
		const particleCount = Phaser.Math.Between(2, 4);
	  
		for (let i = 0; i < particleCount; i++) {
			const particle = this.add.sprite(
				this.rocket.x - this.rocket.width * this.rocket.scaleX * 0.6 + Phaser.Math.Between(-15, 15), // Further behind the rocket
				this.rocket.y + Phaser.Math.Between(-15, 15), // Slight random Y offset
				'particle_buy'
			);

			// Start with bigger scale
			particle.setScale(Phaser.Math.Between(0.6, 1));

			// Add physics
			this.physics.add.existing(particle);
			const particleBody = particle.body as Phaser.Physics.Arcade.Body;

			// Set velocity (world movement + particle movement)
			const worldSpeed = -this.pipeSpeed; // Move with the world
			const particleSpeed = Phaser.Math.Between(-60, -20); // Additional particle movement
			particleBody.setVelocityX(worldSpeed + particleSpeed + Phaser.Math.Between(-40, 40)); // Combined movement
			particleBody.setVelocityY(Phaser.Math.Between(-40, 40)); // Slight random Y
			particleBody.setGravityY(400); // Gravity for falling

			// Add to particles group
			this.particles.add(particle);

			// Slower fade out and shrink animation (2-3 seconds)
			const fadeDuration = Phaser.Math.Between(2000, 3000);
			this.tweens.add({
				targets: particle,
				alpha: 0,
				scaleX: 0.2,
				scaleY: 0.2,
				duration: fadeDuration,
				ease: 'Power2',
				onComplete: () => {
					particle.destroy();
				}
			});
		}
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

		// Ensure physics world is running
		this.physics.world.resume();
		console.log('Physics world started, isPaused:', this.physics.world.isPaused);

		// Set up world bounds
		this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

		// Create pixel art background
		const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'background');
		bg.setDisplaySize(this.scale.width, this.scale.height);

		// Create ground (visual only, no collision)
		//const ground = this.add.rectangle(this.scale.width / 2, this.scale.height - 10, this.scale.width, 20, 0x8B4513);
		//ground.setStrokeStyle(2, 0x654321);
		//ground.setAlpha(0.8); // Make it semi-transparent to blend with background

		// Create rocket (positioned at 25% of the screen width)
		this.rocket = this.add.sprite(this.scale.width * 0.25, this.scale.height / 2, 'rocket');
		this.rocket.setRotation(0); // Start perfectly horizontal
		this.rocket.play('rocket_idle'); // Start with idle animation
		this.physics.add.existing(this.rocket);
		const rocketBody = this.rocket.body as Phaser.Physics.Arcade.Body;
		rocketBody.setGravityY(this.gravity);
		rocketBody.setCollideWorldBounds(true);

		// Make rocket collision box smaller (remove top and bottom 3 pixels)
		rocketBody.setSize(this.rocket.width - 6, this.rocket.height - 6, true); // Remove 6 pixels total (3 top + 3 bottom)
		rocketBody.setOffset(3, 3); // Offset to center the smaller hitbox
		this.nextCandleX = this.scale.width + this.candleWidth;

		// Create pipes group (without physics - we'll handle physics individually)
		this.pipes = this.add.group();

		// Create particles group (without physics - we'll handle physics individually)
		this.particles = this.add.group();

		// Create UI
		this.scoreText = this.add.text(16, 16, 'Floor: 0', {
			fontSize: '16px',
			fontFamily: 'Kenney',
			color: '#ffffff'
		})
			.setResolution(4);

		// Add start instructions
		const startText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50,
			'Click to Start!\nClick to Thrust', {
			fontSize: '24px',
			fontFamily: 'Kenney',
			color: '#1ec51e',
			align: 'center'
		}).setOrigin(0.5)
			.setResolution(4);

		// Input handling
		this.input.on('pointerdown', this.flap, this);
		this.input.keyboard?.on('keydown-SPACE', this.flap, this);

		// Set up collision detection with candles (we'll handle this manually in update)
		// this.physics.add.overlap(this.rocket, this.pipes, this.hitCandle, undefined, this);

		// Store start text to remove it later
		this.data.set('startText', startText);
	}

	// MARK: - Flap
	flap() {
		if (this.gameOver) return;

		// Start game on first thrust
		if (!this.gameStarted) {
			this.startGame();
		}

		// Make rocket thrust
		const rocketBody = this.rocket.body as Phaser.Physics.Arcade.Body;
		rocketBody.setVelocityY(-this.flapPower);

		// Play thrust animation
		this.rocket.play('rocket_thrust');

		// Return to idle animation after a short delay
		this.time.delayedCall(200, () => {
			if (!this.gameOver) {
				this.rocket.play('rocket_idle');
			}
		});

		// Play sound
		this.sound.play('flap', { volume: 0.3 });

		// Create thrust particles
		this.createThrustParticles();

		// Kill any existing rotation/scale tweens to prevent conflicts
		this.tweens.killTweensOf(this.rocket);

		// Rocket animation (thrust upward rotation then back to horizontal)
		this.rocket.setRotation(-0.3); // Quick upward angle
		this.tweens.add({
			targets: this.rocket,
			rotation: 0, // Return to horizontal
			duration: 300,
			ease: 'Power2'
		});

		// Scale boost effect for thrust
		this.rocket.setScale(1.15);
		this.tweens.add({
			targets: this.rocket,
			scaleX: 1,
			scaleY: 1,
			duration: 150,
			ease: 'Power2'
		});
	}

	// MARK: - Start game
	startGame() {
		this.gameStarted = true;

		// Reset rocket to idle animation
		this.rocket.play('rocket_idle');

		// Remove start text
		const startText = this.data.get('startText');
		if (startText) {
			startText.destroy();
		}

		// Spawn first set of pipes
		this.time.delayedCall(1000, this.spawnPipes, [], this);
	}

	// MARK: - Spawn pipes
	spawnPipes() {
		if (this.gameOver) return;

		// Skip candle spawn during weekend
		if (this.weekendTicks > 0) {
			this.weekendTicks--;
			this.nextCandleX += this.candleWidth;
			return;
		}

		this.candleCount++;

		const candleX = this.nextCandleX;

		const ohlc = this.calculateCandleOHLC();
		const candle = this.createCandleBody(candleX, ohlc);
		const trigger = this.createScoreTrigger(candleX);

		this.pipes.addMultiple([candle, trigger]);
		this.lastClose = ohlc.closeY;

		this.nextCandleX += this.candleWidth;

		this.handleWeekendLogic();

		console.log('Spawned candle at', candleX, 'next spawn at', this.nextCandleX);
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

		// Stop rocket physics but let it fall
		const rocketBody = this.rocket.body as Phaser.Physics.Arcade.Body;
		rocketBody.setVelocityX(0);

		// Stop all candles
		this.pipes.children.entries.forEach((gameObject) => {
			const sprite = gameObject as Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
			const body = sprite.body as Phaser.Physics.Arcade.Body;
			if (body) {
				body.setVelocity(0);
			}
		});

		// Rocket spins as it crashes
		this.tweens.add({
			targets: this.rocket,
			rotation: Math.PI * 2, // Full spin
			duration: 800,
			ease: 'Power2'
		});

		// Show game over after short delay
		this.time.delayedCall(800, () => {
			this.scene.start('GameOver', { score: this.getDisplayScore() });
		});
	}

	// MARK: - Update
	override update() {
		if (this.gameOver || !this.gameStarted) return;

		// Debug: Check if physics is running
		if (this.pipes.children.entries.length > 0) {
			const firstCandle = this.pipes.children.entries[0] as Phaser.GameObjects.Sprite;
			const body = firstCandle.body as Phaser.Physics.Arcade.Body;
			console.log('First candle position:', firstCandle.x, 'Velocity:', body.velocity.x, 'Body enabled:', body.enable);
		}

		// Neues Kerzen-Spawning basierend auf der X-Position der Rakete
		const spawnTriggerX = this.rocket.x + this.scale.width; // Sichtfeld hinter Rakete
		if (this.nextCandleX <= spawnTriggerX) {
			this.spawnPipes();
		}

		// Manual collision detection with candles and score triggers
		const rocketBody = this.rocket.body as Phaser.Physics.Arcade.Body;
		this.pipes.children.entries.forEach((gameObject) => {
			const sprite = gameObject as Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;

			// Check for overlap using Phaser's built-in bounds checking
			if (this.physics.overlap(this.rocket, sprite)) {
				// Check if it's a score trigger
				if ((sprite as any).isScoreTrigger) {
					this.internalScore += 1; // Increase internal score linearly
					const displayScore = this.getDisplayScore();
					this.scoreText.setText(`Floor: ${displayScore}`);

					// Increase difficulty every 5 internal score points
					if (this.internalScore % 5 === 0) {
						this.increaseDifficulty();
					}

					sprite.destroy();
				} else {
					// It's a candle - collision!
					this.hitCandle();
				}
			}
		});

		// Check if rocket hit ground or ceiling
		if (this.rocket.y <= 0 || this.rocket.y >= this.scale.height) {
			this.hitCandle();
		}

		console.log('rocket:', this.rocket.x, 'nextCandleX:', this.nextCandleX);


		// Remove candles that are off screen
		this.pipes.children.entries.forEach((candle) => {
			if ((candle as Phaser.GameObjects.Sprite).x < -100) {
				candle.destroy();
			}
		});

		// Remove particles that are off screen or fell too far
		this.particles.children.entries.forEach((particle) => {
			const particleSprite = particle as Phaser.GameObjects.Sprite;
			if (particleSprite.x < -100 || particleSprite.y > this.scale.height + 100) {
				particle.destroy();
			}
		});
	}
}
