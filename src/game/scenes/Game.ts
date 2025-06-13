export class Game extends Phaser.Scene {
	// Game objects
	rocket!: Phaser.GameObjects.Sprite;
	pipes!: Phaser.Physics.Arcade.Group;
	particles!: Phaser.Physics.Arcade.Group;
	
	// Game state
	score!: number;
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

	createThrustParticles() {
		// Create 2-3 particles at rocket position
		const particleCount =1;
		
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
			
			// Set velocity (left movement + slight random)
			particleBody.setVelocityX(Phaser.Math.Between(-120, -60)); // Move left
			particleBody.setVelocityY(Phaser.Math.Between(-40, 40)); // Slight random Y
			particleBody.setGravityY(400); // Lighter gravity for slower fall
			
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
		this.score = 0;
		this.gameStarted = false;
		this.gameOver = false;
		
		// Set up world bounds
		this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
		
		// Create pixel art background
		const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'background');
		bg.setDisplaySize(this.scale.width, this.scale.height);
		
		// Create ground (keep for collision)
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
		
		// Create pipes group
		this.pipes = this.physics.add.group();
		
		// Create particles group
		this.particles = this.physics.add.group();
		
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
		
		// Set up collision detection with candles
		this.physics.add.overlap(this.rocket, this.pipes, this.hitCandle, undefined, this);
		
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
		this.sound.play('hit', { volume: 0.3 });
		
		// Create thrust particles
		this.createThrustParticles();
		
		// Rocket animation (thrust upward rotation then back to horizontal)
		this.rocket.setRotation(-0.3); // Quick upward angle
		this.tweens.add({
			targets: this.rocket,
			rotation: 0, // Return to horizontal
			duration: 300,
			ease: 'Power2'
		});
		
		// Scale boost effect for thrust
		const currentScale = this.rocket.scaleX;
		const thrustScale = currentScale * 1.15; // 15% larger for thrust effect
		this.rocket.setScale(thrustScale);
		this.tweens.add({
			targets: this.rocket,
			scaleX: currentScale,
			scaleY: currentScale,
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
		
		const candleScale = 1.0; // Increased scale for smaller pixel art candles
		const gapY = Phaser.Math.Between(120, this.scale.height - 120 - this.pipeGap);
		
		// Alternate between red and green candles for variety
		const candleType = Math.random() > 0.5 ? 'candle_red' : 'candle_green';
		
		// Create top candle (inverted)
		const topCandle = this.add.sprite(
			this.scale.width + 50,
			gapY - this.pipeGap / 2 - 200,
			candleType
		);
		topCandle.setScale(candleScale);
		topCandle.setFlipY(true); // Flip the candle upside down for top obstacle
		this.physics.add.existing(topCandle);
		const topCandleBody = topCandle.body as Phaser.Physics.Arcade.Body;
		topCandleBody.setVelocityX(-this.pipeSpeed);
		topCandleBody.setImmovable(true);
		this.pipes.add(topCandle);
		
		// Create bottom candle
		const bottomCandle = this.add.sprite(
			this.scale.width + 50,
			gapY + this.pipeGap / 2 + 200,
			candleType
		);
		bottomCandle.setScale(candleScale);
		this.physics.add.existing(bottomCandle);
		const bottomCandleBody = bottomCandle.body as Phaser.Physics.Arcade.Body;
		bottomCandleBody.setVelocityX(-this.pipeSpeed);
		bottomCandleBody.setImmovable(true);
		this.pipes.add(bottomCandle);
		
		// Add score trigger (invisible rectangle between candles)
		const scoreTrigger = this.add.rectangle(
			this.scale.width + 50,
			gapY,
			60,
			this.pipeGap,
			0xff0000,
			0 // Transparent
		);
		this.physics.add.existing(scoreTrigger);
		const scoreTriggerBody = scoreTrigger.body as Phaser.Physics.Arcade.Body;
		scoreTriggerBody.setVelocityX(-this.pipeSpeed);
		scoreTriggerBody.setImmovable(true);
		
		// Set up score detection
		this.physics.add.overlap(this.rocket, scoreTrigger, () => {
			this.score = Math.floor(this.score * 1.1 + 1);
			this.scoreText.setText(`Floor: ${this.score}`);
			
			// Increase difficulty every 5 points
			if (this.score % 5 === 0) {
				this.pipeSpeed = Math.min(this.pipeSpeed + 20, 350);
				this.pipeSpawnDelay = Math.max(this.pipeSpawnDelay - 100, 1200);
				
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
			
			// Milestone celebration
			if (this.score % 10 === 0) {
				this.cameras.main.shake(100, 0.01);
				this.sound.play('hit', { volume: 0.5, rate: 1.5 });
			}
			
			scoreTrigger.destroy();
		}, undefined, this);
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
		this.pipes.children.entries.forEach((candle) => {
			const candleBody = candle.body as Phaser.Physics.Arcade.Body;
			candleBody.setVelocity(0);
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
			this.scene.start('GameOver', { score: this.score });
		});
	}

	override update() {
		if (this.gameOver || !this.gameStarted) return;
		
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
