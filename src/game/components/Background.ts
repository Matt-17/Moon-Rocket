export class Background {
	private scene: Phaser.Scene;
	private background!: Phaser.GameObjects.Image;
	private moon!: Phaser.GameObjects.Image;
	private stars1!: Phaser.GameObjects.TileSprite;
	private stars2!: Phaser.GameObjects.TileSprite;
	private stars3!: Phaser.GameObjects.TileSprite;
	private buildings!: Phaser.GameObjects.TileSprite;

	// Parallax speeds (pixels per second)
	private stars1Speed = 5;
	private stars2Speed = 8;
	private stars3Speed = 12;
	private buildingsSpeed = 25;

	// Registry keys for persistent positions
	private static readonly REGISTRY_KEYS = {
		stars1: 'bg_stars1_pos',
		stars2: 'bg_stars2_pos',
		stars3: 'bg_stars3_pos',
		buildings: 'bg_buildings_pos'
	};

	constructor(scene: Phaser.Scene) {
		this.scene = scene;
		this.create();
		this.restorePositions();
	}

	private create() {
		// Create main background sprite
		this.background = this.scene.add.image(
			this.scene.scale.width / 2, 
			this.scene.scale.height / 2, 
			'background'
		)
			.setScrollFactor(0)
			.setDisplaySize(this.scene.scale.width, this.scene.scale.height);

		// Create star layers (parallax background)
		this.stars1 = this.scene.add.tileSprite(
			0, 0, 
			this.scene.scale.width, 
			this.scene.scale.height, 
			'stars1'
		)
			.setScrollFactor(0)
			.setOrigin(0, 0);

		this.stars2 = this.scene.add.tileSprite(
			0, 0, 
			this.scene.scale.width, 
			this.scene.scale.height, 
			'stars2'
		)
			.setScrollFactor(0)
			.setOrigin(0, 0);

		this.stars3 = this.scene.add.tileSprite(
			0, 0, 
			this.scene.scale.width, 
			this.scene.scale.height, 
			'stars3'
		)
			.setScrollFactor(0)
			.setOrigin(0, 0);

		// Create buildings layer
		this.buildings = this.scene.add.tileSprite(
			0, 0, 
			this.scene.scale.width, 
			this.scene.scale.height, 
			'buildings'
		)
			.setScrollFactor(0)
			.setOrigin(0, 0);

		// Create moon
		this.moon = this.scene.add.image(
			this.scene.scale.width - 50, 
			50, 
			'moon'
		)
			.setScrollFactor(0);
	}

	// Restore tile positions from registry
	private restorePositions() {
		const registry = this.scene.registry;
		
		this.stars1.tilePositionX = registry.get(Background.REGISTRY_KEYS.stars1) || 0;
		this.stars2.tilePositionX = registry.get(Background.REGISTRY_KEYS.stars2) || 0;
		this.stars3.tilePositionX = registry.get(Background.REGISTRY_KEYS.stars3) || 0;
		this.buildings.tilePositionX = registry.get(Background.REGISTRY_KEYS.buildings) || 0;
	}

	// Save current tile positions to registry
	private savePositions() {
		const registry = this.scene.registry;
		
		registry.set(Background.REGISTRY_KEYS.stars1, this.stars1.tilePositionX);
		registry.set(Background.REGISTRY_KEYS.stars2, this.stars2.tilePositionX);
		registry.set(Background.REGISTRY_KEYS.stars3, this.stars3.tilePositionX);
		registry.set(Background.REGISTRY_KEYS.buildings, this.buildings.tilePositionX);
	}

	// Update parallax scrolling with time-based movement
	update(delta: number) {
		// Convert delta from milliseconds to seconds
		const deltaSeconds = delta / 1000;
		
		// Move backgrounds based on time, not frames
		this.stars1.tilePositionX += this.stars1Speed * deltaSeconds;
		this.stars2.tilePositionX += this.stars2Speed * deltaSeconds;
		this.stars3.tilePositionX += this.stars3Speed * deltaSeconds;
		this.buildings.tilePositionX += this.buildingsSpeed * deltaSeconds;

		// Save updated positions to registry
		this.savePositions();
	}

	// Set custom parallax speeds
	setParallaxSpeeds(stars1: number, stars2: number, stars3: number, buildings: number) {
		this.stars1Speed = stars1;
		this.stars2Speed = stars2;
		this.stars3Speed = stars3;
		this.buildingsSpeed = buildings;
	}

	// Destroy all background elements
	destroy() {
		// Save final positions before destroying
		this.savePositions();
		
		this.background?.destroy();
		this.moon?.destroy();
		this.stars1?.destroy();
		this.stars2?.destroy();
		this.stars3?.destroy();
		this.buildings?.destroy();
	}
} 