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

        // Make enemy face the player
        this.facePlayer();

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

                // Calculate direction vector based on enemy's rotation
                // Subtract Math.PI/2 because sprite is oriented upward by default
                const angle = this.rotation - Math.PI/2;
                const direction = {
                    x: Math.cos(angle),
                    y: Math.sin(angle)
                };

                // Create bullet
                const bullet = new Bullet(
                    this.scene,
                    this.x,
                    this.y + this.height / 2,
                    'enemyBullet',
                    direction // Direction based on enemy's rotation
                );

                // Add to group
                this.scene.enemyBullets.add(bullet);
            }
        }
    }

    facePlayer() {
        // Get player from scene
        const player = this.scene.player;

        // Only proceed if player exists
        if (player) {
            // Calculate angle between enemy and player
            const angleToPlayer = Phaser.Math.Angle.Between(
                this.x, this.y,
                player.x, player.y
            );

            // Set rotation to face player (add 90 degrees because sprite is oriented upward by default)
            this.setRotation(angleToPlayer + Math.PI/2);
        }
    }

    damage() {
        this.health--;

        // Flash white when hit
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });

        // Create small explosion effect for hit
        const smallExplosion = this.scene.add.image(this.x, this.y, 'explosion');
        smallExplosion.setScale(0.7); // Increased size for better visibility
        smallExplosion.setAlpha(0.9); // Less transparent for better visibility
        smallExplosion.setDepth(10); // Put in front of enemies (enemy depth is 5)

        // Add rotation and scaling animation for more appeal
        this.scene.tweens.add({
            targets: smallExplosion,
            angle: Phaser.Math.Between(-180, 180), // Random rotation
            scale: { from: 0.4, to: 0.8 }, // Start smaller, grow larger
            alpha: 0,
            duration: 400, // Slightly longer duration for better visibility
            ease: 'Power2',
            onComplete: () => {
                smallExplosion.destroy();
            }
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
            explosion.setDepth(10); // Put in front of enemies (enemy depth is 5)

            // Add multiple animations for a more appealing effect
            // 1. Rotation and scaling animation
            this.scene.tweens.add({
                targets: explosion,
                angle: Phaser.Math.Between(-90, 90), // Random rotation
                scale: { from: 0.5, to: 1.2 }, // Start smaller, grow larger
                alpha: { from: 1, to: 0 },
                duration: 600,
                ease: 'Power2',
                onComplete: () => {
                    explosion.destroy();
                }
            });

            // 2. Create additional particle effects
            for (let i = 0; i < 6; i++) {
                const particle = this.scene.add.image(this.x, this.y, 'explosion');
                particle.setScale(0.3);
                particle.setAlpha(0.7);
                particle.setDepth(9); // Slightly behind the main explosion

                // Random direction for particles
                const angle = Math.random() * Math.PI * 2;
                const distance = Phaser.Math.Between(20, 50);

                this.scene.tweens.add({
                    targets: particle,
                    x: this.x + Math.cos(angle) * distance,
                    y: this.y + Math.sin(angle) * distance,
                    angle: Phaser.Math.Between(-180, 180),
                    scale: { from: 0.3, to: 0.1 },
                    alpha: 0,
                    duration: Phaser.Math.Between(300, 500),
                    ease: 'Power2',
                    onComplete: () => {
                        particle.destroy();
                    }
                });
            }

            // Destroy enemy
            this.destroy();
        }
    }
}
