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
        this.health = 3; // Player can take multiple hits now
        this.maxHealth = 3;

        // Auto-fire property
        this.autoFire = true;

        // Upgrade properties
        this.weaponLevel = 0; // 0 = basic, 1-3 = upgraded
        this.hasShield = false;
        this.shieldDuration = 0;
        this.shieldEffect = null;
        this.hasBomb = false;

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

        // Auto-fire if enabled and cooldown has expired
        if (this.autoFire && this.lastFired <= 0) {
            this.shoot();
        }

        // Handle shield duration
        if (this.hasShield && this.shieldDuration > 0) {
            this.shieldDuration -= delta;

            // Update shield position
            if (this.shieldEffect) {
                this.shieldEffect.x = this.x;
                this.shieldEffect.y = this.y;
            }

            // Remove shield when duration expires
            if (this.shieldDuration <= 0) {
                this.hasShield = false;
                if (this.shieldEffect) {
                    this.shieldEffect.destroy();
                    this.shieldEffect = null;
                }
            }
        }
    }

    toggleAutoFire() {
        this.autoFire = !this.autoFire;
        return this.autoFire; // Return the new state
    }

    shoot() {
        // Check if we can fire again
        if (this.lastFired <= 0) {
            // Reset cooldown
            this.lastFired = this.fireRate;

            // Array to hold all bullets created
            const bullets = [];

            // Create bullets based on weapon level
            if (this.weaponLevel === 0) {
                // Basic weapon - single bullet
                const bullet = new Bullet(
                    this.scene,
                    this.x,
                    this.y - this.height / 2,
                    'playerBullet',
                    { x: 0, y: -1 } // Direction: up
                );

                this.scene.playerBullets.add(bullet);
                bullets.push(bullet);
            } 
            else if (this.weaponLevel === 1) {
                // Level 1 - two bullets side by side
                const leftBullet = new Bullet(
                    this.scene,
                    this.x - 15,
                    this.y - this.height / 2,
                    'playerBullet',
                    { x: 0, y: -1 }
                );

                const rightBullet = new Bullet(
                    this.scene,
                    this.x + 15,
                    this.y - this.height / 2,
                    'playerBullet',
                    { x: 0, y: -1 }
                );

                this.scene.playerBullets.add(leftBullet);
                this.scene.playerBullets.add(rightBullet);
                bullets.push(leftBullet, rightBullet);
            }
            else if (this.weaponLevel === 2) {
                // Level 2 - three bullets (one straight, two angled)
                const centerBullet = new Bullet(
                    this.scene,
                    this.x,
                    this.y - this.height / 2,
                    'playerBullet',
                    { x: 0, y: -1 }
                );

                const leftBullet = new Bullet(
                    this.scene,
                    this.x - 15,
                    this.y - this.height / 3,
                    'playerBullet',
                    { x: -0.2, y: -0.8 }
                );

                const rightBullet = new Bullet(
                    this.scene,
                    this.x + 15,
                    this.y - this.height / 3,
                    'playerBullet',
                    { x: 0.2, y: -0.8 }
                );

                this.scene.playerBullets.add(centerBullet);
                this.scene.playerBullets.add(leftBullet);
                this.scene.playerBullets.add(rightBullet);
                bullets.push(centerBullet, leftBullet, rightBullet);
            }
            else if (this.weaponLevel >= 3) {
                // Level 3 - four bullets (two straight, two angled)
                const leftCenterBullet = new Bullet(
                    this.scene,
                    this.x - 10,
                    this.y - this.height / 2,
                    'playerBullet',
                    { x: 0, y: -1 }
                );

                const rightCenterBullet = new Bullet(
                    this.scene,
                    this.x + 10,
                    this.y - this.height / 2,
                    'playerBullet',
                    { x: 0, y: -1 }
                );

                const leftBullet = new Bullet(
                    this.scene,
                    this.x - 25,
                    this.y - this.height / 3,
                    'playerBullet',
                    { x: -0.3, y: -0.7 }
                );

                const rightBullet = new Bullet(
                    this.scene,
                    this.x + 25,
                    this.y - this.height / 3,
                    'playerBullet',
                    { x: 0.3, y: -0.7 }
                );

                this.scene.playerBullets.add(leftCenterBullet);
                this.scene.playerBullets.add(rightCenterBullet);
                this.scene.playerBullets.add(leftBullet);
                this.scene.playerBullets.add(rightBullet);
                bullets.push(leftCenterBullet, rightCenterBullet, leftBullet, rightBullet);
            }

            // Play sound
            if (this.scene.sound.get('shoot')) {
                this.scene.sound.play('shoot', { volume: 0.5 });
            } else {
                console.warn('Shoot sound not loaded properly');
            }

            return bullets;
        }

        return null;
    }

    damage() {
        // If player has shield, absorb the damage and remove shield
        if (this.hasShield) {
            this.hasShield = false;
            if (this.shieldEffect) {
                this.shieldEffect.destroy();
                this.shieldEffect = null;
            }
            return; // Shield absorbed the damage, no health loss
        }

        // Reduce player health
        this.health--;

        // Update health bar if it exists
        if (this.scene.updateHealthBar) {
            this.scene.updateHealthBar();
        }

        // Player dies when health reaches zero
        if (this.health <= 0) {
            this.scene.gameOver();
        }
    }

    useBomb() {
        // Check if player has a bomb
        if (!this.hasBomb) return false;

        // Use the bomb
        this.hasBomb = false;

        // Create bomb explosion effect
        this.createBombExplosion();

        // Damage all enemies on screen
        if (this.scene.enemies) {
            this.scene.enemies.getChildren().forEach(enemy => {
                // Call the enemy's damage method to properly handle damage and effects
                // For bomb, we want to ensure enemies are destroyed, so we reduce their health to 0
                while (enemy.active && enemy.health > 0) {
                    enemy.damage();
                }

                // Increase score
                this.scene.score += 10;
            });

            // Update score display
            if (this.scene.scoreText) {
                this.scene.scoreText.setText(`Score: ${this.scene.score}`);
            }
        }

        return true;
    }

    createBombExplosion() {
        // Create a large explosion effect
        const explosion = this.scene.add.graphics();
        explosion.fillStyle(0xffffff, 0.8);
        explosion.fillCircle(this.scene.game.config.width / 2, this.scene.game.config.height / 2, 300);
        explosion.setDepth(30);

        // Play explosion sound
        if (this.scene.sound.get('explosion')) {
            this.scene.sound.play('explosion', { volume: 0.7 });
        }

        // Fade out and destroy
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                explosion.destroy();
            }
        });
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
