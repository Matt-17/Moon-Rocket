import { Scene } from 'phaser';

export class Preloader extends Scene {
	constructor() {
		super({ key: 'Preloader' });
	}

	preload() {
		//	Setting the default loading path to the assets folder.
		//	This way we don't have to specify the path for each asset repeatedly.
		this.load.setPath('assets/');

		this.load.image('rocket', 'rocket.png');
		this.load.image('candle_red', 'candle_red.png');
		this.load.image('candle_green', 'candle_green.png');
		this.load.image('background', 'background_1.png');
		this.load.image('particle_buy', 'particle_buy.png');
		this.load.audio('flap', 'flap.ogg');
		this.load.audio('milestone', 'milestone.ogg');
		this.load.font('Kenney', 'Kenney_Mini_Square.ttf');
	}

	create() {
		//	The create function is called after the preload function has finished loading all assets.
		this.scene.start('Menu');
	}
}
