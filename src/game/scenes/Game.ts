export class Game extends Phaser.Scene {
	// Game objects
	rocket!: Phaser.GameObjects.Sprite;
	pipes!: Phaser.GameObjects.Group;
	particles!: Phaser.GameObjects.Group;

	// Game state
	internalScore!: number; // Internal float score that increases linearly
	scoreText!: Phaser.GameObjects.Text;
	gameStarted!: boolean;
	gameOver!: boolean;

	// Physics constants
	gravity = 600;
	flapPower = 200;
	pipeSpeed = 200;
	pipeGap = 150;
	pipeSpawnDelay = 2000;

	// Spawn timer
	pipeSpawnTimer!: Phaser.Time.TimerEvent;

	constructor() {
		super('Game');
	}

	// Calculate exponential display score from internal linear score
	getDisplayScore(): number {
		// Exponential formula: floor(internalScore^1.5)
		// This creates exponential growth: 0->0, 1->1, 2->2, 3->5, 4->8, 5->11, 6->14, 7->18, etc.
		return Math.floor(Math.pow(this.internalScore, 1.5));
	}

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

	createThrustParticles() {
		// Create 2-3 particles at rocket position
		const particleCount = Phaser.Math.Between(2, 4);

		for (let i = 0; i < particleCount; i++) {
			const particle = this.add.sprite(
				this.rocket.x - this.rocket.width * this.rocket.scaleX * 0.6, // Further behind the rocket
				this.rocket.y + Phaser.Math.Between(-15, 15), // Slight random Y offset
				'particle_buy'
			);

			// Start with bigger scale
			particle.setScale(Phaser.Math.Between(1, 1.5));

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

	create() {
		// Initialize game state
		this.internalScore = 0;
		this.gameStarted = false;
		this.gameOver = false;

		// Ensure physics world is running
		this.physics.world.resume();
		console.log('Physics world started, isPaused:', this.physics.world.isPaused);

		// Set up world bounds
		this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

		// Create pixel art background
		const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'background');
		bg.setDisplaySize(this.scale.width, this.scale.height);

		// Create ground (visual only, no collision)
		const ground = this.add.rectangle(this.scale.width / 2, this.scale.height - 10, this.scale.width, 20, 0x8B4513);
		ground.setStrokeStyle(2, 0x654321);
		ground.setAlpha(0.8); // Make it semi-transparent to blend with background

		// Create rocket (positioned more to the right)
		this.rocket = this.add.sprite(this.scale.width * 0.25, this.scale.height / 2, 'rocket');
		// Make rocket about 10% of viewport width
		const desiredWidth = this.scale.width * 0.1;
		const rocketScale = desiredWidth / this.rocket.width;
		this.rocket.setScale(rocketScale);
		this.rocket.setRotation(0); // Start perfectly horizontal
		this.physics.add.existing(this.rocket);
		const rocketBody = this.rocket.body as Phaser.Physics.Arcade.Body;
		rocketBody.setGravityY(this.gravity);
		rocketBody.setCollideWorldBounds(true);
		
		// Make rocket collision box smaller (remove top and bottom 3 pixels)
		rocketBody.setSize(this.rocket.width - 6, this.rocket.height - 6, true); // Remove 6 pixels total (3 top + 3 bottom)
		rocketBody.setOffset(3, 3); // Offset to center the smaller hitbox

		// Create pipes group (without physics - we'll handle physics individually)
		this.pipes = this.add.group();

		// Create particles group (without physics - we'll handle physics individually)
		this.particles = this.add.group();

		// Create UI
		this.scoreText = this.add.text(16, 16, 'Floor: 0', {
			fontSize: '32px',
			fontFamily: 'Kenney',
			color: '#ffffff'
		});

		// Add start instructions
		const startText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50,
			'Click to Start!\nClick to Thrust', {
			fontSize: '24px',
			fontFamily: 'Kenney',
			color: '#ffffff',
			align: 'center'
		}).setOrigin(0.5);

		// Input handling
		this.input.on('pointerdown', this.flap, this);
		this.input.keyboard?.on('keydown-SPACE', this.flap, this);

		// Set up collision detection with candles (we'll handle this manually in update)
		// this.physics.add.overlap(this.rocket, this.pipes, this.hitCandle, undefined, this);

		// Store start text to remove it later
		this.data.set('startText', startText);
	}

	flap() {
		if (this.gameOver) return;

		// Start game on first thrust
		if (!this.gameStarted) {
			this.startGame();
		}

		// Make rocket thrust
		const rocketBody = this.rocket.body as Phaser.Physics.Arcade.Body;
		rocketBody.setVelocityY(-this.flapPower);

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
		const desiredWidth = this.scale.width * 0.1;
		const baseScale = desiredWidth / this.rocket.width; // Original scale
		const thrustScale = baseScale * 1.15; // 15% larger for thrust effect
		this.rocket.setScale(thrustScale);
		this.tweens.add({
			targets: this.rocket,
			scaleX: baseScale,
			scaleY: baseScale,
			duration: 150,
			ease: 'Power2'
		});
	}

	startGame() {
		this.gameStarted = true;

		// Remove start text
		const startText = this.data.get('startText');
		if (startText) {
			startText.destroy();
		}

		// Start spawning pipes
		this.pipeSpawnTimer = this.time.addEvent({
			delay: this.pipeSpawnDelay,
			callback: this.spawnPipes,
			callbackScope: this,
			loop: true
		});

		// Spawn first set of pipes
		this.time.delayedCall(1000, this.spawnPipes, [], this);
	}

		spawnPipes() {
		if (this.gameOver) return;
		
		// Alternate between red and green candles for variety
		const candleType = Math.random() > 0.5 ? 'candle_red' : 'candle_green';
		
		// Random position and height for single candle obstacle
		const candleHeight = Phaser.Math.Between(120, 500); // Variable height for candle
		const candleY = Phaser.Math.Between(candleHeight / 2 - 6, this.scale.height - candleHeight / 2 + 6); // Random Y position
		
		// Create single candle using 3-slice (stretched vertically)
		const candle = this.add.nineslice(
			this.scale.width + 50,
			candleY, // Random Y position
			candleType,
			undefined, // frame
			14, // width (original candle width in pixels)
			candleHeight / 4, // height (stretch this, but account for 4x scale)
			0, // leftWidth (no horizontal stretching needed)
			0, // rightWidth (no horizontal stretching needed)
			7, // topHeight (keep top 7 pixels fixed)
			7  // bottomHeight (keep bottom 7 pixels fixed)
		);
		candle.setScale(4); // Scale up 4x for pixel art visibility
		this.physics.add.existing(candle);
		const candleBody = candle.body as Phaser.Physics.Arcade.Body;
		candleBody.setVelocityX(-this.pipeSpeed);
		candleBody.setImmovable(true);
		
		// Make candle collision box smaller (remove top and bottom 6 pixels each)
		candleBody.setSize(14 - 2, (candleHeight / 4) - 12, true); // Remove 12 pixels total from height, 2 from width
		candleBody.setOffset(1, 6); // Offset to center the smaller hitbox
		
		this.pipes.add(candle);
		
		// Debug: Log pipe speed to console
		console.log('Candle spawned with velocity:', -this.pipeSpeed);

		// Add score trigger (invisible rectangle next to candle)
		const scoreTrigger = this.add.rectangle(
			this.scale.width + 120, // Position it ahead of the candle
			this.scale.height / 2, // Center of screen
			10,
			this.scale.height, // Full height trigger
			0xff0000,
			0 // Transparent
		);
		this.physics.add.existing(scoreTrigger);
		const scoreTriggerBody = scoreTrigger.body as Phaser.Physics.Arcade.Body;
		scoreTriggerBody.setVelocityX(-this.pipeSpeed);
		scoreTriggerBody.setImmovable(true);

		// Store score trigger for manual collision detection
		(scoreTrigger as any).isScoreTrigger = true;
		this.pipes.add(scoreTrigger);
	}

	hitCandle() {
		if (this.gameOver) return;

		this.gameOver = true;

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

		// Stop spawning pipes
		if (this.pipeSpawnTimer) {
			this.pipeSpawnTimer.destroy();
		}

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

	override update() {
		if (this.gameOver || !this.gameStarted) return;

		// Debug: Check if physics is running
		if (this.pipes.children.entries.length > 0) {
			const firstCandle = this.pipes.children.entries[0] as Phaser.GameObjects.Sprite;
			const body = firstCandle.body as Phaser.Physics.Arcade.Body;
			console.log('First candle position:', firstCandle.x, 'Velocity:', body.velocity.x, 'Body enabled:', body.enable);
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
						this.pipeSpeed = Math.min(this.pipeSpeed + 20, 350);
						this.pipeSpawnDelay = Math.max(this.pipeSpawnDelay - 100, 1200);

						// Update existing particles to match new world speed
						this.updateParticleVelocities();

						// Update spawn timer
						if (this.pipeSpawnTimer) {
							this.pipeSpawnTimer.destroy();
							this.pipeSpawnTimer = this.time.addEvent({
								delay: this.pipeSpawnDelay,
								callback: this.spawnPipes,
								callbackScope: this,
								loop: true
							});
						}
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
