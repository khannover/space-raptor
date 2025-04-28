class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, type) {
        super(scene, x, y, texture);

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set up enemy properties based on type
        this.type = type || 1;
        this.setScale(0.4);

        // Set up depth (z-index)
        this.setDepth(5);

        // Set up health and speed based on type
        switch (this.type) {
            case 1: // Fast, weak enemy
                this.health = 1;
                this.speed = 150;
                this.fireRate = 2000; // ms between shots
                break;
            case 2: // Slower, stronger enemy
                this.health = 3;
                this.speed = 100;
                this.fireRate = 4500; // ms between shots
                break;
            default:
                this.health = 1;
                this.speed = 100;
                this.fireRate = 2000;
        }

        // Set up movement pattern
        this.setupMovementPattern();

        // Set up shooting
        this.lastFired = Phaser.Math.Between(0, this.fireRate);

        // Set smaller hitbox than the sprite
        this.body.setSize(this.width * 0.7, this.height * 0.7);
        this.body.setOffset(this.width * 0.15, this.height * 0.15);
    }

    setupMovementPattern() {
        // Choose a random movement pattern
        this.pattern = Phaser.Math.Between(1, 3);

        // Set up pattern-specific properties
        switch (this.pattern) {
            case 1: // Straight line
                this.direction = new Phaser.Math.Vector2(0, 1); // Down
                break;
            case 2: // Sine wave
                this.direction = new Phaser.Math.Vector2(0, 1); // Down
                this.sineAmplitude = 100;
                this.sineFrequency = 0.003;
                this.sineOffset = Phaser.Math.Between(0, 1000);
                this.initialX = this.x;
                break;
            case 3: // Circular
                this.direction = new Phaser.Math.Vector2(0, 1); // Down
                this.circleRadius = 50;
                this.circleSpeed = 0.002;
                this.circleOffset = Phaser.Math.Between(0, 1000);
                this.initialX = this.x;
                break;
        }
    }

    update(delta) {
        // Move based on pattern
        switch (this.pattern) {
            case 1: // Straight line
                this.x += this.direction.x * this.speed * (delta / 1000);
                this.y += this.direction.y * this.speed * (delta / 1000);
                break;
            case 2: // Sine wave
                this.y += this.direction.y * this.speed * (delta / 1000);
                this.x = this.initialX + Math.sin((this.y + this.sineOffset) * this.sineFrequency) * this.sineAmplitude;
                break;
            case 3: // Circular
                this.y += this.direction.y * this.speed * (delta / 1000);
                this.x = this.initialX + Math.cos((this.y + this.circleOffset) * this.circleSpeed) * this.circleRadius;
                break;
        }

        // Try to shoot
        this.tryToShoot(delta);

        // Destroy if off screen
        if (this.y > this.scene.game.config.height + 100 || 
            this.x < -100 || 
            this.x > this.scene.game.config.width + 100) {
            this.destroy();
        }
    }

    tryToShoot(delta) {
        // Decrease cooldown
        this.lastFired -= delta;

        // Check if we can fire
        if (this.lastFired <= 0) {
            // Reset cooldown
            this.lastFired = this.fireRate;

            // Only shoot if on screen
            if (this.y > 0 && this.y < this.scene.game.config.height &&
                this.x > 0 && this.x < this.scene.game.config.width) {

                // Create bullet
                const bullet = new Bullet(
                    this.scene,
                    this.x,
                    this.y + this.height / 2,
                    'enemyBullet',
                    { x: 0, y: 1 } // Direction: down
                );

                // Add to group
                this.scene.enemyBullets.add(bullet);
            }
        }
    }

    damage() {
        this.health--;

        // Flash white when hit
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });

        // Check if dead
        if (this.health <= 0) {
            // Play explosion sound
            if (this.scene.sound.get('explosion')) {
                this.scene.sound.play('explosion', { volume: 0.3 });
            } else {
                console.warn('Explosion sound not loaded properly');
            }

            // Create explosion
            const explosion = this.scene.add.image(this.x, this.y, 'explosion');
            explosion.setScale(1);

            // Fade out explosion
            this.scene.tweens.add({
                targets: explosion,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    explosion.destroy();
                }
            });

            // Destroy enemy
            this.destroy();
        }
    }
}
