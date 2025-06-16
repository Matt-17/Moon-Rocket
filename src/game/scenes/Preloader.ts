import { Scene } from 'phaser';

export class Preloader extends Scene {
	constructor() {
		super({ key: 'Preloader' });
	}

	preload() {
		this.load.setPath('assets/');

		this.load.image('logo', 'logo.png');

		this.load.image('background', 'background.png');
		this.load.image('stars1', 'stars1.png');
		this.load.image('stars2', 'stars2.png');
		this.load.image('stars3', 'stars3.png');
		this.load.image('moon', 'moon.png');
		this.load.image('buildings', 'buildings.png');

		this.load.spritesheet('start', 'start.png', { frameWidth: 96, frameHeight: 40 });

		this.load.spritesheet('rocket', 'rocket.png', { frameWidth: 40, frameHeight: 18 });
		this.load.image('candle_red', 'candle_red.png');
		this.load.image('candle_green', 'candle_green.png');

		this.load.image('buy', 'buy.png');		
		this.load.image('star', 'star.png');
		this.load.image('diamond', 'diamond.png');
		
		this.load.audio('flap', 'flap.ogg');
		this.load.audio('milestone', 'milestone.ogg');
		this.load.audio('explosion', 'explosion.ogg');
		this.load.font('Kenney', 'kenney.ttf');
	}

	createRocketAnimations() {
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
		this.createRocketAnimations();
		this.createStartAnimations();

		this.scene.start('Menu');
	}
}
