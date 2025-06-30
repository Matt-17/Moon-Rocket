export class StartButton extends Phaser.GameObjects.Sprite {
	private buttonPressed = false;
	private onClickCallback?: () => void;

	constructor(scene: Phaser.Scene, x: number, y: number) {
		super(scene, x, y, 'start');
		
		// Add to scene
		scene.add.existing(this);
		
		// Set initial state
		this.setOrigin(0.5).play('start_normal');
		
		// Set up interactivity
		this.setupInteractivity();
	}

	private setupInteractivity() {
		this.setInteractive({ useHandCursor: true });
		
		this.on('pointerdown', () => {
			this.buttonPressed = true;
			this.play('start_pressed');
		});
		
		this.on('pointerup', () => {
			if (this.buttonPressed && this.onClickCallback) {
				this.onClickCallback();
			}
			this.buttonPressed = false;
		});
		
		this.on('pointerover', () => {
			if (!this.buttonPressed) {
				this.play('start_hover');
			}
		});
		
		this.on('pointerout', () => {
			this.buttonPressed = false;
			this.play('start_normal');
		});
	}

	public onClick(callback: () => void): this {
		this.onClickCallback = callback;
		return this;
	}
} 