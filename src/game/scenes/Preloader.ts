import { Scene } from 'phaser';

export class Preloader extends Scene {
	constructor() {
		super({ key: 'Preloader' });
	}

	preload() {
		//	Setting the default loading path to the assets folder.
		//	This way we don't have to specify the path for each asset repeatedly.
		this.load.setPath('assets/');

		// Load rocket as spritesheet instead of single image
		// Note: Adjust frameWidth and frameHeight based on your actual sprite sheet dimensions
		// If you only have a single image, change this back to: this.load.image('rocket', 'rocket.png');
		this.load.spritesheet('rocket', 'rocket.png', { frameWidth: 40, frameHeight: 18 });

		// Debug: Log when the rocket sprite sheet is loaded
		this.load.on('filecomplete-spritesheet-rocket', (key: string) => {
			console.log('Rocket spritesheet loaded:', key);
		});

		// load start button start.png -> 3 buttons vertical 96 x 40; first is normal, then hover, then pressed
		this.load.spritesheet('start', 'start.png', { frameWidth: 96, frameHeight: 40 });


		this.load.image('background', 'background.png');
		this.load.image('stars1', 'stars1.png');
		this.load.image('stars2', 'stars2.png');
		this.load.image('stars3', 'stars3.png');
		this.load.image('moon', 'moon.png');

		this.load.image('buildings', 'buildings.png');

		this.load.image('candle_red', 'candle_red.png');
		this.load.image('candle_green', 'candle_green.png');
		this.load.image('background', 'background_1.png');
		this.load.image('buy', 'buy.png');
		
		this.load.image('star', 'star.png');
		this.load.image('diamond', 'diamond.png');
		
		this.load.audio('flap', 'flap.ogg');
		this.load.audio('milestone', 'milestone.ogg');
		this.load.audio('explosion', 'explosion.ogg');
		this.load.font('Kenney', 'Kenney_Mini_Square.ttf');
	}

	// MARK: - Create rocket animations
	createRocketAnimations() {
		// Create idle animation (frames 0-1)
		this.anims.create({
			key: 'rocket_idle',
			frames: this.anims.generateFrameNumbers('rocket', { start: 0, end: 1 }),
			frameRate: 10,
			repeat: -1
		});

		// Create thrust animation (frame 2)
		this.anims.create({
			key: 'rocket_thrust',
			frames: this.anims.generateFrameNumbers('rocket', { start: 2, end: 2 }),
			frameRate: 8,
			repeat: -1
		});

		// Create crash animation (frame 3)
		this.anims.create({
			key: 'rocket_crash',
			frames: this.anims.generateFrameNumbers('rocket', { start: 3, end: 3 }),
			frameRate: 6,
			repeat: -1
		});
	}

	createStartAnimations() {
		this.anims.create({
			key: 'start_normal',
			frames: this.anims.generateFrameNumbers('start', { start: 0, end: 0 }),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'start_hover',
			frames: this.anims.generateFrameNumbers('start', { start: 1, end: 1 }),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'start_pressed',
			frames: this.anims.generateFrameNumbers('start', { start: 2, end: 2 }),
			frameRate: 10,
			repeat: -1
		});
	}
	create() {
		// Create rocket animations globally
		this.createRocketAnimations();
		this.createStartAnimations();

		//	The create function is called after the preload function has finished loading all assets.
		this.scene.start('Menu');
	}
}
