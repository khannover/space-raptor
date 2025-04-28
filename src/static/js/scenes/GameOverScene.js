class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }
    
    init(data) {
        // Get the score from the previous scene
        this.score = data.score || 0;
    }
    
    create() {
        // Add game over text
        this.add.text(400, 200, 'GAME OVER', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#ff0000',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Add score text
        this.add.text(400, 300, `Final Score: ${this.score}`, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Add restart button
        const restartButton = this.add.text(400, 400, 'Play Again', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#00ff00',
            backgroundColor: '#333333',
            padding: {
                left: 20,
                right: 20,
                top: 10,
                bottom: 10
            }
        }).setOrigin(0.5);
        
        // Make button interactive
        restartButton.setInteractive({ useHandCursor: true });
        
        // Add hover effect
        restartButton.on('pointerover', () => {
            restartButton.setStyle({ color: '#ffffff' });
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setStyle({ color: '#00ff00' });
        });
        
        // Add click event
        restartButton.on('pointerdown', () => {
            // Restart the game
            this.scene.start('GameScene');
        });
    }
}