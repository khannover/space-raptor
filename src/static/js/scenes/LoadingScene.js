class LoadingScene extends Phaser.Scene {
    constructor() {
        super('LoadingScene');
    }

    preload() {
        // Display loading background
        this.add.image(400, 300, 'loadingBackground');

        // Add loading text
        this.loadingText = this.add.text(400, 250, 'Loading...', {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Create loading bar
        this.loadingBarBg = this.add.image(400, 300, 'loadingBarBg');
        this.loadingBar = this.add.image(201, 300, 'loadingBar');
        this.loadingBar.setOrigin(0, 0.5);

        // Set up loading bar to track progress
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Display loading progress
        this.load.on('progress', (value) => {
            // Update loading bar width based on progress
            this.loadingBar.displayWidth = 398 * value;

            // Update text with percentage
            const percent = Math.floor(value * 100);
            this.loadingText.setText(`Loading: ${percent}%`);
        });

        // When loading completes
        this.load.on('complete', () => {
            this.loadingText.setText('Loading Complete!');
        });

        // Load game assets
        this.loadGameAssets();
    }

    loadGameAssets() {
        // Load player ship
        this.load.svg('player', '/static/assets/images/player-ship.svg');

        // Load enemy ships
        this.load.svg('enemy1', '/static/assets/images/enemy-ship-1.svg');
        this.load.svg('enemy2', '/static/assets/images/enemy-ship-2.svg');

        // Load bullets
        this.load.svg('playerBullet', '/static/assets/images/player-bullet.svg');
        this.load.svg('enemyBullet', '/static/assets/images/enemy-bullet.svg');

        // Load background
        this.load.svg('background', '/static/assets/images/background.svg');

        // Load explosions and smoke effects
        this.load.svg('explosion', '/static/assets/images/explosion.svg');
        this.load.svg('explosion-2', '/static/assets/images/explosion-2.svg');
        this.load.svg('explosion-3', '/static/assets/images/explosion-3.svg');
        this.load.svg('smoke-1', '/static/assets/images/smoke-1.svg');
        this.load.svg('smoke-2', '/static/assets/images/smoke-2.svg');

        // Load sounds
        this.load.audio('shoot', '/static/assets/sounds/shoot.mp3');
        this.load.audio('explosion', '/static/assets/sounds/explosion.mp3');
        this.load.audio('gameMusic', '/static/assets/sounds/game-music.mp3');
    }

    create() {
        // Add a slight delay before starting the game
        this.time.delayedCall(1000, () => {
            // Hide the loading text before transitioning
            this.loadingText.setVisible(false);
            this.loadingBarBg.setVisible(false);
            this.loadingBar.setVisible(false);

            this.scene.start('GameScene');
        });
    }
}
