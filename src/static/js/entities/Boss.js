class Boss extends Enemy {
    constructor(scene, x, y) {
        // Use enemy2 texture as it looks more formidable
        super(scene, x, y, 'enemy2', 3); // Type 3 for boss

        // Make boss larger
        this.setScale(0.8); // Twice the size of regular enemies

        // Base boss properties (will be adjusted based on player's weapon level)
        this.baseHealth = 15; // Much more health than regular enemies
        this.baseSpeed = 80; // Slower but more menacing
        this.baseFireRate = 1500; // Faster firing rate
        this.baseSpecialAttackCooldown = 5000; // ms between special attacks
        this.score = 100; // Worth more points

        // Set initial values
        this.health = this.baseHealth;
        this.speed = this.baseSpeed;
        this.fireRate = this.baseFireRate;
        this.specialAttackCooldown = this.baseSpecialAttackCooldown;
        this.lastSpecialAttack = 0;

        // Set a distinctive tint to make the boss stand out
        this.setTint(0xff0000); // Red tint

        // Set up movement pattern (override the one from Enemy)
        this.setupBossMovementPattern();
    }

    setupBossMovementPattern() {
        // Boss has a more complex movement pattern
        this.pattern = 4; // Special boss pattern

        // Boss moves in a figure-8 pattern
        this.direction = new Phaser.Math.Vector2(0, 1); // Down
        this.figureEightAmplitude = 150;
        this.figureEightFrequency = 0.002;
        this.figureEightOffset = Phaser.Math.Between(0, 1000);
        this.initialX = this.x;
        this.initialY = this.y;
        this.moveSpeed = 0.5; // Controls vertical movement speed
    }

    update(delta) {
        // Adjust difficulty based on player's weapon level
        this.adjustBossDifficultyBasedOnPlayerWeapon();

        // Move based on boss pattern
        if (this.pattern === 4) {
            // Figure-8 pattern
            this.y += this.direction.y * this.speed * (delta / 1000) * this.moveSpeed;

            // Only start horizontal movement once on screen
            if (this.y > 0) {
                // Calculate position in figure-8 pattern
                const t = (this.y + this.figureEightOffset) * this.figureEightFrequency;
                this.x = this.initialX + Math.sin(t * 2) * this.figureEightAmplitude;

                // If boss reaches middle of screen, slow down vertical movement
                if (this.y > this.scene.game.config.height / 4) {
                    this.moveSpeed = 0.2;
                }

                // Stop vertical movement at about 1/3 down the screen
                if (this.y > this.scene.game.config.height / 3) {
                    this.moveSpeed = 0;
                }
            }
        } else {
            // Fallback to standard enemy movement if pattern is not boss-specific
            super.update(delta);
            return;
        }

        // Make boss face the player
        this.facePlayer();

        // Try to shoot
        this.tryToShoot(delta);

        // Try special attack
        this.trySpecialAttack(delta);

        // Destroy if off screen (less likely for boss)
        if (this.y > this.scene.game.config.height + 100 || 
            this.x < -100 || 
            this.x > this.scene.game.config.width + 100) {
            this.destroy();
        }
    }

    adjustBossDifficultyBasedOnPlayerWeapon() {
        // Get player from scene
        const player = this.scene.player;

        // Only proceed if player exists
        if (player) {
            const weaponLevel = player.weaponLevel;

            // Adjust speed based on weapon level (up to 40% faster at max weapon level)
            const speedMultiplier = 1 + (weaponLevel * 0.12); // 12% increase per weapon level
            this.speed = this.baseSpeed * speedMultiplier;

            // Adjust fire rate based on weapon level (up to 50% faster shooting at max weapon level)
            const fireRateMultiplier = 1 - (weaponLevel * 0.12); // 12% decrease per weapon level (faster shooting)
            this.fireRate = Math.max(this.baseFireRate * fireRateMultiplier, this.baseFireRate * 0.5); // Cap at 50% reduction

            // Adjust special attack cooldown based on weapon level (up to 40% faster special attacks)
            const specialAttackMultiplier = 1 - (weaponLevel * 0.10); // 10% decrease per weapon level
            this.specialAttackCooldown = Math.max(this.baseSpecialAttackCooldown * specialAttackMultiplier, 
                                                this.baseSpecialAttackCooldown * 0.6); // Cap at 40% reduction

            // Adjust figure-8 pattern based on weapon level
            if (this.pattern === 4) {
                // Increase figure-8 amplitude and frequency for more erratic movement
                this.figureEightAmplitude = 150 + (weaponLevel * 15); // Wider pattern
                this.figureEightFrequency = 0.002 + (weaponLevel * 0.0004); // Faster oscillation
            }
        }
    }

    trySpecialAttack(delta) {
        // Decrease cooldown
        this.lastSpecialAttack -= delta;

        // Check if we can use special attack
        if (this.lastSpecialAttack <= 0) {
            // Reset cooldown
            this.lastSpecialAttack = this.specialAttackCooldown;

            // Only use special attack if on screen
            if (this.y > 0 && this.y < this.scene.game.config.height &&
                this.x > 0 && this.x < this.scene.game.config.width) {

                // Special attack: fire bullets in a circular pattern
                this.fireCircularPattern();
            }
        }
    }

    fireCircularPattern() {
        // Number of bullets in the circular pattern - increases with player weapon level
        let bulletCount = 12;

        // Add more bullets based on player's weapon level
        if (this.scene.player && this.scene.player.weaponLevel > 0) {
            bulletCount += this.scene.player.weaponLevel * 2; // 2 more bullets per weapon level
        }

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

        // Visual effect for special attack
        const specialAttackEffect = this.scene.add.image(this.x, this.y, 'explosion');
        specialAttackEffect.setScale(0.5);
        specialAttackEffect.setAlpha(0.7);
        specialAttackEffect.setTint(0xff0000); // Red tint
        specialAttackEffect.setDepth(4); // Behind the boss

        // Add animation
        this.scene.tweens.add({
            targets: specialAttackEffect,
            scale: 1.5,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                specialAttackEffect.destroy();
            }
        });
    }

    damage() {
        this.health--;

        // Flash white when hit
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            this.setTint(0xff0000); // Return to red tint
        });

        // Create small explosion effect for hit
        const smallExplosion = this.scene.add.image(this.x, this.y, 'explosion');
        smallExplosion.setScale(0.7);
        smallExplosion.setAlpha(0.9);
        smallExplosion.setDepth(10);

        // Add rotation and scaling animation
        this.scene.tweens.add({
            targets: smallExplosion,
            angle: Phaser.Math.Between(-180, 180),
            scale: { from: 0.4, to: 0.8 },
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                smallExplosion.destroy();
            }
        });

        // Check if dead
        if (this.health <= 0) {
            // Play explosion sound
            try {
                this.scene.sound.play('explosion', { volume: 0.5 });
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

            for (let i = 0; i < 5; i++) {
                // Delay each explosion slightly
                scene.time.delayedCall(i * 200, () => {
                    // Random position within the boss's last known position
                    const offsetX = Phaser.Math.Between(-bossWidth/3, bossWidth/3);
                    const offsetY = Phaser.Math.Between(-bossHeight/3, bossHeight/3);

                    // Create explosion
                    const explosion = scene.add.image(
                        bossX + offsetX,
                        bossY + offsetY,
                        'explosion'
                    );
                    explosion.setScale(1.2);
                    explosion.setDepth(10);

                    // Add animation
                    scene.tweens.add({
                        targets: explosion,
                        angle: Phaser.Math.Between(-90, 90),
                        scale: { from: 0.5, to: 1.5 },
                        alpha: { from: 1, to: 0 },
                        duration: 800,
                        ease: 'Power2',
                        onComplete: () => {
                            explosion.destroy();
                        }
                    });
                });
            }

            // Add score
            this.scene.score += this.score;
            this.scene.scoreText.setText(`Score: ${this.scene.score}`);

            // Destroy boss
            this.destroy();
        }
    }
}
