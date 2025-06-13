export class Game extends Phaser.Scene {
	score!: number
	timeLeft!: number
	scoreText!: Phaser.GameObjects.Text
	timeText!: Phaser.GameObjects.Text
	difficultyMultiplier!: number

	constructor() {
		super('Game')
	}

	create() {
		this.score = 0
		this.timeLeft = 30
		this.difficultyMultiplier = 1

		this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fontFamily: 'Kenney', color: '#ffffff' })
		this.timeText = this.add.text(16, 50, 'Time: 30', { fontSize: '32px', fontFamily: 'Kenney', color: '#ffffff' })

		this.time.addEvent({
			delay: 1000,
			callback: this.updateTimer,
			callbackScope: this,
			loop: true,
		})

		this.spawnAnimal()
	}

	updateTimer() {
		this.timeLeft--
		this.timeText.setText(`Time: ${this.timeLeft}`)

		if (this.timeLeft % 5 === 0) {
			this.difficultyMultiplier += 0.5
		}

		if (this.timeLeft <= 0) {
			this.gameOver()
		}
	}

	spawnAnimal() {
		if (this.timeLeft <= 0) return

		const { width, height } = this.scale.gameSize

		const texture = this.textures.get('characters')
		const frames = texture.getFrameNames()

		const x = Phaser.Math.Between(50, width - 50)
		const y = Phaser.Math.Between(50, height - 50)
		const randomAnimal = Phaser.Utils.Array.GetRandom(frames)

		const sprite = this.add.sprite(x, y, 'characters', randomAnimal)
		sprite.setScale(0.5)
		sprite.setInteractive({ useHandCursor: true })
		sprite.on('pointerdown', () => {
			this.score++
			this.scoreText.setText(`Score: ${this.score}`)
			this.sound.play('hit', { volume: 0.5 })
			sprite.destroy()
		})

		const nextSpawn = Phaser.Math.Between(200, 1000) / (this.difficultyMultiplier * 1.5)
		this.time.delayedCall(nextSpawn, () => this.spawnAnimal())
	}

	gameOver() {
		this.scene.start('GameOver', { score: this.score })
	}
}
