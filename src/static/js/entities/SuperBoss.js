class SuperBoss extends Boss {
    constructor(scene, x, y) {
        super(scene, x, y);
        
        // Make super boss larger than regular boss
        this.setScale(1.2); // 1.5x the size of regular boss (which is 0.8x the size of regular enemies)
        
        // Super boss properties
        this.health = 30; // Double the health of regular boss
        this.speed = 60; // Slower but more menacing
        this.fireRate = 1200; // Faster firing rate than regular boss
        this.score = 250; // Worth more points
        
        // Special attack properties
        this.specialAttackCooldown = 3000; // Shorter cooldown for special attacks
        
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
        
        // Visual effect for special attack (larger than regular boss)
        const specialAttackEffect = this.scene.add.image(this.x, this.y, 'explosion');
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
    }
    
    // Override the damage method to add additional effects
    damage() {
        this.health--;
        
        // Flash white when hit
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            this.setTint(0xff00ff); // Return to purple tint
        });
        
        // Create small explosion effect for hit
        const smallExplosion = this.scene.add.image(this.x, this.y, 'explosion');
        smallExplosion.setScale(0.9); // Larger than regular boss
        smallExplosion.setAlpha(0.9);
        smallExplosion.setDepth(10);
        
        // Add rotation and scaling animation
        this.scene.tweens.add({
            targets: smallExplosion,
            angle: Phaser.Math.Between(-180, 180),
            scale: { from: 0.5, to: 1.0 },
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                smallExplosion.destroy();
            }
        });
        
        // Check if dead
        if (this.health <= 0) {
            // Play explosion sound
            if (this.scene.sound.get('explosion')) {
                this.scene.sound.play('explosion', { volume: 0.7 });
            }
            
            // Create multiple explosions for a more dramatic effect
            // Store reference to scene and position before destruction
            const scene = this.scene;
            const bossX = this.x;
            const bossY = this.y;
            const bossWidth = this.width;
            const bossHeight = this.height;
            
            for (let i = 0; i < 8; i++) { // More explosions than regular boss
                // Delay each explosion slightly
                scene.time.delayedCall(i * 150, () => {
                    // Random position within the super boss's last known position
                    const offsetX = Phaser.Math.Between(-bossWidth/2, bossWidth/2);
                    const offsetY = Phaser.Math.Between(-bossHeight/2, bossHeight/2);
                    
                    // Create explosion
                    const explosion = scene.add.image(
                        bossX + offsetX,
                        bossY + offsetY,
                        'explosion'
                    );
                    explosion.setScale(1.5); // Larger explosions
                    explosion.setDepth(10);
                    
                    // Add animation
                    scene.tweens.add({
                        targets: explosion,
                        angle: Phaser.Math.Between(-90, 90),
                        scale: { from: 0.7, to: 1.8 },
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
            
            // Notify the game scene that the super boss is no longer active
            this.scene.superBossActive = false;
            
            // Destroy super boss
            this.destroy();
        }
    }
}