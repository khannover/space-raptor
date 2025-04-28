class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set up physics body
        this.body.setCollideWorldBounds(true);
        this.setScale(0.5);

        // Set up player properties
        this.speed = 300;
        this.fireRate = 250; // ms between shots
        this.lastFired = 0;
        this.health = 1; // One hit and you're dead

        // Set up depth (z-index)
        this.setDepth(10);

        // Set smaller hitbox than the sprite
        this.body.setSize(this.width * 0.6, this.height * 0.6);
        this.body.setOffset(this.width * 0.2, this.height * 0.2);
    }

    update(delta) {
        // Player movement is handled by mouse in the GameScene

        // Cooldown for shooting
        if (this.lastFired > 0) {
            this.lastFired -= delta;
        }
    }

    shoot() {
        // Check if we can fire again
        if (this.lastFired <= 0) {
            // Reset cooldown
            this.lastFired = this.fireRate;

            // Create bullet
            const bullet = new Bullet(
                this.scene,
                this.x,
                this.y - this.height / 2,
                'playerBullet',
                { x: 0, y: -1 } // Direction: up
            );

            // Add to group
            this.scene.playerBullets.add(bullet);

            // Play sound
            if (this.scene.sound.get('shoot')) {
                this.scene.sound.play('shoot', { volume: 0.5 });
            } else {
                console.warn('Shoot sound not loaded properly');
            }

            return bullet;
        }

        return null;
    }

    damage() {
        // Player dies in one hit
        this.scene.gameOver();
    }

    // Override setPosition to ensure player stays within visible area
    setPosition(x, y) {
        // Get game dimensions
        const width = this.scene.game.config.width;
        const height = this.scene.game.config.height;

        // Calculate bounds to keep player fully visible
        const halfWidth = this.displayWidth / 2;
        const halfHeight = this.displayHeight / 2;

        // Clamp position within bounds
        x = Phaser.Math.Clamp(x, halfWidth, width - halfWidth);
        y = Phaser.Math.Clamp(y, halfHeight, height - halfHeight);

        // Set position
        super.setPosition(x, y);
    }
}
