class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load the loading screen background
        this.load.svg('loadingBackground', '/static/assets/images/loading-background.svg');

        // Create loading bar assets on the fly
        this.createLoadingBarAssets();
    }

    createLoadingBarAssets() {
        // Create a loading bar background
        const loadingBarBg = this.make.graphics();
        loadingBarBg.fillStyle(0x222222, 0.8);
        loadingBarBg.fillRect(0, 0, 400, 30);
        loadingBarBg.generateTexture('loadingBarBg', 400, 30);

        // Create a loading bar fill
        const loadingBar = this.make.graphics();
        loadingBar.fillStyle(0x00ff00, 1);
        loadingBar.fillRect(0, 0, 398, 28);
        loadingBar.generateTexture('loadingBar', 398, 28);
    }

    create() {
        // Set up any game settings
        this.scale.refresh();

        // Transition to the loading scene
        this.scene.start('LoadingScene');
    }
}
