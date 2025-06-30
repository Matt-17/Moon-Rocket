import { Scene } from 'phaser'
import { StartButton } from '../components/StartButton.js'

export class Menu extends Scene {
	constructor() {
		super({ key: 'Menu' })
	}

	async create() {
		const { width, height } = this.scale

		//	You can use the registry to access the playerStats data from the Preloader scene
		//	or store data that you want to access in other scenes.
		const playerStats = this.registry.get('playerStats')
		const { highscore, attempts } = playerStats

		this.add
			.text(width / 2, height / 2 - 100, `Highscore: ${highscore}`, {
				fontSize: '32px',
				fontFamily: 'Kenney',
				color: '#ffffff',
			})
			.setOrigin(0.5)
			.setResolution(4);

		this.add
			.text(width / 2, height / 2 - 60, `Games played: ${attempts}`, {
				fontSize: '32px',
				fontFamily: 'Kenney',
				color: '#ffffff',
			})
			.setOrigin(0.5)
			.setResolution(4);

		new StartButton(this, width / 2, height / 2 + 50)
			.onClick(() => this.scene.start('Game'));
	}
}
