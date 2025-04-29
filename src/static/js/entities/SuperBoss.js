class SuperBoss extends Boss {
    constructor(scene, x, y) {
        super(scene, x, y);

        // Make super boss larger than regular boss
        this.setScale(1.3); // 1.5x the size of regular boss (which is 0.8x the size of regular enemies)

        // Super boss properties
        this.health = 100; // Double the health of regular boss
        this.speed = 60; // Slower but more menacing
        this.fireRate = 800; // Faster firing rate than regular boss
        this.score = 250; // Worth more points

        // Special attack properties
        this.specialAttackCooldown = 2000; // Shorter cooldown for special attacks

        // Set a distinctive tint to make the super boss stand out
        this.setTint(0xff00ff); // Purple tint

        // Notify the game scene that a super boss is active
        this.scene.superBossActive = true;
    }

    setupBossMovementPattern() {
        // Super boss has a more complex movement pattern
        this.pattern = 5; // Special super boss pattern

        // Super boss moves in a more aggressive pattern
        this.direction = new Phaser.Math.Vector2(0, 1); // Down
        this.figureEightAmplitude = 200; // Wider movement
        this.figureEightFrequency = 0.003; // Faster oscillation
        this.figureEightOffset = Phaser.Math.Between(0, 1000);
        this.initialX = this.x;
        this.initialY = this.y;
        this.moveSpeed = 0.6; // Controls vertical movement speed
    }

    update(delta) {
        // Move based on super boss pattern
        if (this.pattern === 5) {
            // Modified figure-8 pattern with more aggressive movement
            this.y += this.direction.y * this.speed * (delta / 1000) * this.moveSpeed;

            // Only start horizontal movement once on screen
            if (this.y > 0) {
                // Calculate position in figure-8 pattern with more aggressive movement
                const t = (this.y + this.figureEightOffset) * this.figureEightFrequency;
                this.x = this.initialX + Math.sin(t * 2) * this.figureEightAmplitude;

                // If super boss reaches middle of screen, slow down vertical movement
                if (this.y > this.scene.game.config.height / 5) {
                    this.moveSpeed = 0.3;
                }

                // Stop vertical movement at about 1/4 down the screen
                if (this.y > this.scene.game.config.height / 4) {
                    this.moveSpeed = 0;
                }
            }
        } else {
            // Fallback to standard boss movement if pattern is not super boss-specific
            super.update(delta);
            return;
        }

        // Make super boss face the player
        this.facePlayer();

        // Try to shoot
        this.tryToShoot(delta);

        // Try special attack
        this.trySpecialAttack(delta);

        // Destroy if off screen (less likely for super boss)
        if (this.y > this.scene.game.config.height + 100 || 
            this.x < -100 || 
            this.x > this.scene.game.config.width + 100) {
            this.destroy();
        }
    }

    fireCircularPattern() {
        // Number of bullets in the circular pattern (more than regular boss)
        const bulletCount = 16;

        // Fire bullets in a circle
        for (let i = 0; i < bulletCount; i++) {
            // Calculate angle for this bullet
            const angle = (i / bulletCount) * Math.PI * 2;

            // Calculate direction vector
            const direction = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };

            // Create bullet
            const bullet = new Bullet(
                this.scene,
                this.x,
                this.y,
                'enemyBullet',
                direction
            );

            // Add to group
            this.scene.enemyBullets.add(bullet);
        }

        // Visual effect for special attack using enhanced system
        // Create a special explosion effect with purple tint
        const explosionTypes = ['explosion', 'explosion-2', 'explosion-3'];
        const randomType = explosionTypes[Phaser.Math.Between(0, explosionTypes.length - 1)];

        const specialAttackEffect = this.scene.add.image(this.x, this.y, randomType);
        specialAttackEffect.setScale(0.8);
        specialAttackEffect.setAlpha(0.8);
        specialAttackEffect.setTint(0xff00ff); // Purple tint
        specialAttackEffect.setDepth(4); // Behind the super boss

        // Add animation
        this.scene.tweens.add({
            targets: specialAttackEffect,
            scale: 2.0,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
                specialAttackEffect.destroy();
            }
        });

        // Add a smoke effect for more visual impact
        if (Phaser.Math.Between(0, 10) > 3) { // 70% chance
            const smokeEffect = this.scene.add.image(
                this.x, 
                this.y, 
                Phaser.Math.Between(0, 1) === 0 ? 'smoke-1' : 'smoke-2'
            );
            smokeEffect.setScale(1.0);
            smokeEffect.setAlpha(0.6);
            smokeEffect.setTint(0xff00ff); // Purple tint to match
            smokeEffect.setDepth(3); // Behind the explosion

            // Add animation
            this.scene.tweens.add({
                targets: smokeEffect,
                scale: 2.5,
                alpha: 0,
                duration: 800,
                ease: 'Power1',
                onComplete: () => {
                    smokeEffect.destroy();
                }
            });
        }
    }

    // Override the damage method to add additional effects
    damage() {
        this.health--;

        // Flash white when hit
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            this.setTint(0xff00ff); // Return to purple tint
        });

        // Create small explosion effect for hit using the enhanced system
        // Randomly select explosion type for variety
        const explosionTypes = ['explosion', 'explosion-2', 'explosion-3'];
        const randomType = explosionTypes[Phaser.Math.Between(0, explosionTypes.length - 1)];

        this.scene.createExplosion(this.x, this.y, 0.9, randomType);

        // Check if dead
        if (this.health <= 0) {
            // Play explosion sound
            try {
                this.scene.sound.play('explosion', { volume: 0.7 });
            } catch (error) {
                console.warn('Explosion sound not loaded properly:', error);
            }

            // Create multiple explosions for a more dramatic effect
            // Store reference to scene and position before destruction
            const scene = this.scene;
            const bossX = this.x;
            const bossY = this.y;
            const bossWidth = this.width;
            const bossHeight = this.height;

            // Create a large main explosion at the center
            scene.createExplosion(bossX, bossY, 2.5);

            // Always add smoke for the main explosion
            scene.createSmokeEffect(bossX, bossY, 3.0);

            // Create multiple secondary explosions for a more dramatic effect
            for (let i = 0; i < 10; i++) { // More explosions than before
                // Delay each explosion slightly with varying delays
                scene.time.delayedCall(i * Phaser.Math.Between(100, 200), () => {
                    // Random position within the super boss's last known position
                    const offsetX = Phaser.Math.Between(-bossWidth/2, bossWidth/2);
                    const offsetY = Phaser.Math.Between(-bossHeight/2, bossHeight/2);

                    // Randomly select explosion type
                    const explosionTypes = ['explosion', 'explosion-2', 'explosion-3'];
                    const randomType = explosionTypes[Phaser.Math.Between(0, explosionTypes.length - 1)];

                    // Create explosion using the enhanced system
                    scene.createExplosion(
                        bossX + offsetX,
                        bossY + offsetY,
                        Phaser.Math.FloatBetween(1.0, 1.8),
                        randomType
                    );

                    // Randomly add smoke effects
                    if (Phaser.Math.Between(0, 10) > 6) {
                        scene.createSmokeEffect(
                            bossX + offsetX,
                            bossY + offsetY,
                            Phaser.Math.FloatBetween(1.2, 2.0)
                        );
                    }
                });
            }

            // Add score
            this.scene.score += this.score;
            this.scene.scoreText.setText(`Score: ${this.scene.score}`);

            // Notify the game scene that the super boss is no longer active
            this.scene.superBossActive = false;

            // Destroy super boss
            this.destroy();
        }
    }
}
