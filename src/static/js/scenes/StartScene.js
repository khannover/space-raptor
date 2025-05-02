class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
        this.isMultiplayer = false;
        this.readyButton = null;
        this.waitingText = null;
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

        // Check if multiplayer is active
        this.isMultiplayer = window.multiplayerManager && window.multiplayerManager.connected;

        if (this.isMultiplayer) {
            this.setupMultiplayerScreen();
        } else {
            this.setupSinglePlayerScreen();
        }
    }

    setupSinglePlayerScreen() {
        // Add press to start text for single player
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

    setupMultiplayerScreen() {
        // Set up the ready button for multiplayer
        this.readyButton = this.add.text(400, 350, 'CLICK WHEN READY', {
            font: '24px Arial',
            fill: '#ffffff',
            backgroundColor: '#006400',
            padding: { x: 20, y: 10 },
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setInteractive();

        // Add waiting text (initially hidden)
        this.waitingText = this.add.text(400, 400, 'WAITING FOR OTHER PLAYERS...', {
            font: '20px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setAlpha(0);

        // Ready button click handler
        this.readyButton.on('pointerdown', () => {
            if (window.multiplayerManager.isReady) {
                // If already ready, toggle to not ready
                window.multiplayerManager.setReady(false);
                this.readyButton.setBackgroundColor('#006400');
                this.readyButton.setText('CLICK WHEN READY');
                this.waitingText.setAlpha(0);
            } else {
                // Set to ready
                window.multiplayerManager.setReady(true);
                this.readyButton.setBackgroundColor('#8B0000');
                this.readyButton.setText('CANCEL READY');
                this.waitingText.setAlpha(1);
            }
        });

        // Add hover effect
        this.readyButton.on('pointerover', () => {
            this.readyButton.setScale(1.1);
        });

        this.readyButton.on('pointerout', () => {
            this.readyButton.setScale(1.0);
        });

        // Set up the game start callback
        if (window.multiplayerManager) {
            window.multiplayerManager.onGameStart = () => {
                this.startGame();
            };
        }
    }

    startGame() {
        // Stop any tweens on the text
        this.tweens.killAll();
        
        // Transition to the game scene
        this.scene.start('GameScene');
    }
}

