class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, direction) {
        super(scene, x, y, texture);

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set up bullet properties
        this.speed = texture === 'playerBullet' ? 1200 : 200; // Player bullets are faster
        this.lifespan = 3000; // ms before bullet is destroyed
        this.setScale(0.2);

        // Set up direction
        this.direction = direction || { x: 0, y: -1 }; // Default: up

        // Set up depth (z-index)
        this.setDepth(3);

        // Store velocity for manual position updates
        this.velocity = {
            x: this.direction.x * this.speed,
            y: this.direction.y * this.speed
        };

        // Set rotation based on direction
        if (this.direction.x !== 0 || this.direction.y !== 0) {
            // Calculate angle from direction vector
            const angle = Math.atan2(this.direction.y, this.direction.x);
            // Add 90 degrees (PI/2) because sprite is oriented upward by default
            this.setRotation(angle + Math.PI/2);
        }

        // Set smaller hitbox than the sprite
        this.body.setSize(this.width * 0.6, this.height * 0.6);
        this.body.setOffset(this.width * 0.2, this.height * 0.2);

        // Destroy bullet after lifespan
        scene.time.delayedCall(this.lifespan, () => {
            this.destroy();
        });
    }

    update(delta) {
        // Update position based on velocity
        this.x += this.velocity.x * (delta / 1000);
        this.y += this.velocity.y * (delta / 1000);

        // Check if bullet is off screen
        if (this.y < -50 || 
            this.y > this.scene.game.config.height + 50 ||
            this.x < -50 || 
            this.x > this.scene.game.config.width + 50) {
            this.destroy();
        }
    }
}
