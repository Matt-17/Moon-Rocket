import { Scene } from 'phaser'

export class Preloader extends Scene {
	constructor() {
		super({ key: 'Preloader' })
	}

	preload() {
		//	Setting the default loading path to the assets folder.
		//	This way we don't have to specify the path for each asset repeatedly.
		this.load.setPath('assets/')

		this.load.atlasXML('characters', 'characters.png', 'characters.xml')
		this.load.audio('hit', 'hit.ogg')
		this.load.font('Kenney', 'Kenney_Mini_Square.ttf')
	}

	create() {
		//	The create function is called after the preload function has finished loading all assets.
		this.scene.start('Menu')
	}
}
