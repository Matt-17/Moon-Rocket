import { GAME_HEIGHT, GAME_WIDTH } from '../constants.js';

export class Background {
	private scene: Phaser.Scene;
	private container!: Phaser.GameObjects.Container;
	private background!: Phaser.GameObjects.Image;
	private moon!: Phaser.GameObjects.Image;
	private stars1!: Phaser.GameObjects.TileSprite;
	private stars2!: Phaser.GameObjects.TileSprite;
	private stars3!: Phaser.GameObjects.TileSprite;
	private buildings!: Phaser.GameObjects.TileSprite;

	// Parallax speeds (pixels per second)
	private stars1Speed = 0.2;
	private stars2Speed = 0.375;
	private stars3Speed = 0.575;
	private buildingsSpeed = 12;

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

		//	When the camera follows a target, its scroll position is computed
		//	during preRender - after the scene update ran. Listening to the
		//	follow event keeps the background aligned within the same frame.
		this.scene.cameras.main.on(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, this.syncToCamera, this);
	}

	private syncToCamera() {
		//	Note: camera.worldView is rounded to whole pixels by Phaser, which
		//	causes visible jitter against the smoothly scrolling camera. The
		//	unrounded midPoint gives the exact view origin instead.
		const cam = this.scene.cameras.main;
		this.container.setPosition(
			cam.midPoint.x - cam.displayWidth / 2,
			cam.midPoint.y - cam.displayHeight / 2
		);
	}

	private create() {
		//	The parallax layers scroll at fractional speeds. With nearest
		//	neighbour sampling their texel edges pop from one canvas pixel to
		//	the next, which reads as subtle jitter. Linear filtering blends
		//	those edges (~1 canvas pixel of softness at RENDER_SCALE 4) so the
		//	background glides smoothly while the foreground stays crisp.
		for (const key of ['stars1', 'stars2', 'stars3', 'buildings']) {
			this.scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
		}

		//	All layers live in a container that is kept aligned with the
		//	camera's world view (see update). This replaces the old
		//	setScrollFactor(0) approach, which does not survive camera zoom.
		this.container = this.scene.add.container(0, 0);

		// Create main background sprite
		this.background = this.scene.add
			.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'background')
			.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

		// Create star layers (parallax background)
		this.stars1 = this.scene.add
			.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'stars1')
			.setOrigin(0, 0);

		this.stars2 = this.scene.add
			.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'stars2')
			.setOrigin(0, 0);

		this.stars3 = this.scene.add
			.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'stars3')
			.setOrigin(0, 0);

		// Create buildings layer
		this.buildings = this.scene.add
			.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'buildings')
			.setOrigin(0, 0);

		// Create moon
		this.moon = this.scene.add.image(GAME_WIDTH - 50, 50, 'moon');

		this.container.add([
			this.background,
			this.stars1,
			this.stars2,
			this.stars3,
			this.buildings,
			this.moon,
		]);
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
		//	Pin the background to whatever the camera currently looks at.
		//	(For following cameras this is refined again via FOLLOW_UPDATE.)
		this.syncToCamera();

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

		this.scene.cameras.main?.off(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, this.syncToCamera, this);
		this.container?.destroy(true);
	}
}
