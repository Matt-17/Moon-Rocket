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

		// Game title using TextStyles
		this.add
			.text(width / 2, height / 2 - 150, 'Flappy Rockets', TextStyles.TITLE_GREEN)
			.setOrigin(0.5)
			.setResolution(4);

		// Highscore using SUBTITLE style
		this.add
			.text(width / 2, height / 2 - 100, `Highscore: ${highscore}`, TextStyles.SUBTITLE)
			.setOrigin(0.5)
			.setResolution(4);

		// Games played using BODY style
		this.add
			.text(width / 2, height / 2 - 60, `Games played: ${attempts}`, TextStyles.BODY)
			.setOrigin(0.5)
			.setResolution(4);

		new StartButton(this, width / 2, height / 2 + 50)
			.onClick(() => this.scene.start('Game'));
	}

	override update(_time: number, delta: number) {
		// Animate background
		this.background.update(delta);
	}
}
