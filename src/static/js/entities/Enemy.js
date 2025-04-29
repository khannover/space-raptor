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

        // Create small explosion effect for hit using the enhanced system
        // Randomly select explosion type for variety
        const explosionTypes = ['explosion', 'explosion-2', 'explosion-3'];
        const randomType = explosionTypes[Phaser.Math.Between(0, explosionTypes.length - 1)];

        // Use the GameScene's createExplosion method if scene exists
        if (this.scene && typeof this.scene.createExplosion === 'function') {
            this.scene.createExplosion(this.x, this.y, 0.7, randomType);
        }

        // Check if dead
        if (this.health <= 0) {
            // Play explosion sound
            if (this.scene && this.scene.sound && typeof this.scene.sound.play === 'function') {
                try {
                    this.scene.sound.play('explosion', { volume: 0.3 });
                } catch (error) {
                    console.warn('Explosion sound not loaded properly:', error);
                }
            }

            // Store reference to position and scene before destruction
            const enemyX = this.x;
            const enemyY = this.y;
            const enemyWidth = this.width;
            const enemyHeight = this.height;
            const sceneRef = this.scene;

            // Create a main explosion using the enhanced system
            // Randomly select explosion type
            const explosionTypes = ['explosion', 'explosion-2', 'explosion-3'];
            const randomType = explosionTypes[Phaser.Math.Between(0, explosionTypes.length - 1)];

            // Create main explosion if scene exists
            if (sceneRef && typeof sceneRef.createExplosion === 'function') {
                sceneRef.createExplosion(enemyX, enemyY, 1.2, randomType);
            }

            // Always add smoke for the main explosion if scene exists
            if (sceneRef && typeof sceneRef.createSmokeEffect === 'function') {
                sceneRef.createSmokeEffect(enemyX, enemyY, 1.5);
            }

            // Create secondary explosions with slight delay for a more dramatic effect
            // Only proceed if scene reference exists
            if (sceneRef && sceneRef.time && typeof sceneRef.time.delayedCall === 'function') {
                for (let i = 0; i < 3; i++) {
                    sceneRef.time.delayedCall(Phaser.Math.Between(50, 150), () => {
                        // Random position within the enemy's last known position
                        const offsetX = Phaser.Math.Between(-enemyWidth/3, enemyWidth/3);
                        const offsetY = Phaser.Math.Between(-enemyHeight/3, enemyHeight/3);

                        // Randomly select explosion type
                        const randomType = explosionTypes[Phaser.Math.Between(0, explosionTypes.length - 1)];

                        // Create secondary explosion if scene still exists
                        if (sceneRef && typeof sceneRef.createExplosion === 'function') {
                            sceneRef.createExplosion(
                                enemyX + offsetX,
                                enemyY + offsetY,
                                Phaser.Math.FloatBetween(0.6, 0.9),
                                randomType
                            );
                        }

                        // Randomly add smoke effects if scene still exists
                        if (Phaser.Math.Between(0, 10) > 6 && sceneRef && typeof sceneRef.createSmokeEffect === 'function') {
                            sceneRef.createSmokeEffect(
                                enemyX + offsetX,
                                enemyY + offsetY,
                                Phaser.Math.FloatBetween(0.7, 1.0)
                            );
                        }
                    });
                }
            }

            // Destroy enemy
            this.destroy();
        }
    }
}
