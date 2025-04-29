class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    create() {
        // Add background
        this.add.image(400, 300, 'background');

        // Add game title
        this.add.text(400, 200, 'RAPTOR CLONE', {
            font: '48px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Add press to start text
        const startText = this.add.text(400, 350, 'PRESS ANY KEY TO START', {
            font: '24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Make the text blink
        this.tweens.add({
            targets: startText,
            alpha: { from: 1, to: 0.5 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Listen for keyboard input
        this.input.keyboard.on('keydown', () => {
            this.startGame();
        });

        // Listen for pointer input (mouse/touch)
        this.input.on('pointerdown', () => {
            this.startGame();
        });
    }

    startGame() {
        // Stop any tweens on the text
        this.tweens.killAll();
        
        // Transition to the game scene
        this.scene.start('GameScene');
    }
}