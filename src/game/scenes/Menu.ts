import { Scene } from 'phaser'

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

		this.add
			.text(width / 2, height / 2 - 60, `Games played: ${attempts}`, {
				fontSize: '32px',
				fontFamily: 'Kenney',
				color: '#ffffff',
			})
			.setOrigin(0.5)

		const startButton = this.add
			.text(width / 2, height / 2 + 50, 'Start Game', {
				fontSize: '48px',
				color: '#ffffff',
				fontFamily: 'Kenney',
				backgroundColor: '#000000',
				padding: { x: 40, y: 40 },
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true })

		startButton.on('pointerdown', () => {
			this.scene.start('Game')
		})
	}
}
