import { Scene } from 'phaser'
import { StartButton } from '../components/StartButton.js'
import { Background } from '../components/Background.js'
import { TextStyles } from '../utils/TextStyles.js'

export class Menu extends Scene {
	background!: Background;

	constructor() {
		super({ key: 'Menu' })
	}

	async create() {
		// Create animated background
		this.background = new Background(this);
		const { width, height } = this.scale

		//	You can use the registry to access the playerStats data from the Preloader scene
		//	or store data that you want to access in other scenes.
		const playerStats = this.registry.get('playerStats')
		const { highscore, attempts } = playerStats

		// logo
		this.add.image(100, 20, 'logo').setOrigin(0.5, 0);

		// Highscore using SUBTITLE style
		this.add
			.text(350, 10, `Highscore: ${highscore}`, TextStyles.SUBTITLE)
			.setOrigin(0.5, 0)
			.setResolution(4);

		// rocket
		this.add.image(490, 25, 'rocket').setOrigin(0.5, 0).setScale(1);

		new StartButton(this, 100, 150).onClick(() => this.startGame());
		this.input.keyboard?.on('keydown-SPACE', () => this.startGame(), this);
	}

	startGame() {
		this.scene.start('Game');
	}

	override update(_time: number, delta: number) {
		// Animate background
		this.background.update(delta);
	}
}
