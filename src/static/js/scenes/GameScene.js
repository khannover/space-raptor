class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');

        // Game state
        this.player = null;
        this.enemies = null;
        this.playerBullets = null;
        this.enemyBullets = null;
        this.background = null;
        this.powerups = null;
        this.bosses = null;

        // Game settings
        this.enemySpawnTime = 2000; // ms between enemy spawns
        this.powerupSpawnTime = 10000; // ms between powerup spawns
        this.bossSpawnTime = 30000; // ms between boss spawns
        this.bossSpawnScore = 200; // Score threshold for first boss
        this.nextBossSpawn = this.bossSpawnScore; // Score at which next boss will spawn
        this.score = 0;
        this.isGameOver = false;
    }

    create() {
        // Reset game state
        this.isGameOver = false;
        this.score = 0;
        this.nextBossSpawn = this.bossSpawnScore;

        // Create scrolling background
        this.background = new Background(this, 0, 0, 'background');

        // Create player
        this.player = new Player(this, 400, 500, 'player');

        // Show auto-fire enabled message at game start
        this.showAutoFireMessage(true);

        // Create groups for enemies, bullets, and powerups
        this.enemies = this.physics.add.group();
        this.bosses = this.physics.add.group();
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.powerups = this.physics.add.group();

        // Set up collisions
        this.setupCollisions();

        // Start enemy, powerup, and boss spawning
        this.startEnemySpawner();
        this.startPowerupSpawner();
        this.startBossSpawner();

        // Add score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff'
        });

        // Add health bar
        this.createHealthBar();

        // Start game music
        if (this.sound.get('gameMusic')) {
            this.sound.play('gameMusic', { loop: true, volume: 0.5 });
        } else {
            console.warn('Game music not loaded properly');
        }

        // Set up input
        this.input.on('pointermove', (pointer) => {
            if (this.player && !this.isGameOver) {
                this.player.setPosition(pointer.x, pointer.y);
            }
        });

        this.input.on('pointerdown', (pointer) => {
            if (this.player && !this.isGameOver) {
                // Left click (button 0) for shooting
                if (pointer.button === 0) {
                    this.player.shoot();
                }
                // Right click (button 2) for bomb
                else if (pointer.button === 2 && this.player.hasBomb) {
                    this.player.useBomb();
                }
            }
        });

        // Add keyboard input for auto-fire toggle
        this.input.keyboard.on('keydown-F', () => {
            if (this.player && !this.isGameOver) {
                const autoFireEnabled = this.player.toggleAutoFire();
                this.showAutoFireMessage(autoFireEnabled);
            }
        });
    }

    update(time, delta) {
        if (this.isGameOver) return;

        // Update background
        this.background.update(delta);

        // Update player
        if (this.player) {
            this.player.update(delta);
        }

        // Update enemies
        this.enemies.getChildren().forEach(enemy => {
            enemy.update(delta);
        });

        // Update bosses
        this.bosses.getChildren().forEach(boss => {
            boss.update(delta);
        });

        // Update player bullets
        this.playerBullets.getChildren().forEach(bullet => {
            bullet.update(delta);
        });

        // Update enemy bullets
        this.enemyBullets.getChildren().forEach(bullet => {
            bullet.update(delta);
        });

        // Update powerups
        this.powerups.getChildren().forEach(powerup => {
            powerup.update();
        });

        // Check if it's time to spawn a boss based on score
        if (this.score >= this.nextBossSpawn) {
            // Only spawn if there are fewer than two active bosses
            if (this.bosses.getChildren().length < 2) {
                this.spawnBoss();
            }
            // Increase the score threshold for the next boss regardless
            // This ensures we don't keep trying to spawn at the same score
            this.nextBossSpawn += this.bossSpawnScore;
        }
    }

    setupCollisions() {
        // Player collides with enemies
        this.physics.add.overlap(
            this.player,
            this.enemies,
            this.playerEnemyCollision,
            null,
            this
        );

        // Player collides with bosses
        this.physics.add.overlap(
            this.player,
            this.bosses,
            this.playerEnemyCollision, // Reuse the same collision handler
            null,
            this
        );

        // Player collides with enemy bullets
        this.physics.add.overlap(
            this.player,
            this.enemyBullets,
            this.playerBulletCollision,
            null,
            this
        );

        // Player bullets collide with enemies
        this.physics.add.overlap(
            this.playerBullets,
            this.enemies,
            this.bulletEnemyCollision,
            null,
            this
        );

        // Player bullets collide with bosses
        this.physics.add.overlap(
            this.playerBullets,
            this.bosses,
            this.bulletEnemyCollision, // Reuse the same collision handler
            null,
            this
        );

        // Player collides with powerups
        this.physics.add.overlap(
            this.player,
            this.powerups,
            this.playerPowerupCollision,
            null,
            this
        );
    }

    playerPowerupCollision(player, powerup) {
        // Apply powerup effect
        powerup.collect(player);

        // Display powerup message
        this.showPowerupMessage(powerup.type);
    }

    showPowerupMessage(type) {
        // Create message based on powerup type
        let message = '';
        switch(type) {
            case 'health':
                message = 'Health Restored!';
                break;
            case 'weapon':
                message = 'Weapon Upgraded!';
                break;
            case 'shield':
                message = 'Shield Activated!';
                break;
            case 'bomb':
                message = 'Bomb Acquired! Right-click to use';
                break;
        }

        // Create text
        const messageText = this.add.text(
            this.game.config.width / 2,
            100,
            message,
            {
                fontSize: '24px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        messageText.setOrigin(0.5);
        messageText.setDepth(100);

        // Fade out and destroy
        this.tweens.add({
            targets: messageText,
            alpha: 0,
            y: 80,
            duration: type === 'bomb' ? 5000 : 2000, // Longer duration for bomb message
            ease: 'Power2',
            onComplete: () => {
                messageText.destroy();
            }
        });
    }

    showAutoFireMessage(enabled) {
        // Create message based on auto-fire state
        const message = enabled ? 'Auto-Fire Enabled! (Press F to toggle)' : 'Auto-Fire Disabled! (Press F to toggle)';

        // Create text
        const messageText = this.add.text(
            this.game.config.width / 2,
            100,
            message,
            {
                fontSize: '24px',
                fill: enabled ? '#00ff00' : '#ffffff', // Green when enabled, white when disabled
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        messageText.setOrigin(0.5);
        messageText.setDepth(100);

        // Fade out and destroy
        this.tweens.add({
            targets: messageText,
            alpha: 0,
            y: 80,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                messageText.destroy();
            }
        });
    }

    startEnemySpawner() {
        // Create a timer to spawn enemies
        this.enemySpawner = this.time.addEvent({
            delay: this.enemySpawnTime,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    startPowerupSpawner() {
        // Create a timer to spawn powerups
        this.powerupSpawner = this.time.addEvent({
            delay: this.powerupSpawnTime,
            callback: this.spawnPowerup,
            callbackScope: this,
            loop: true
        });
    }

    startBossSpawner() {
        // Create a timer to spawn bosses
        this.bossSpawner = this.time.addEvent({
            delay: this.bossSpawnTime,
            callback: this.checkBossSpawn,
            callbackScope: this,
            loop: true
        });
    }

    checkBossSpawn() {
        // Only spawn a boss if there are fewer than two active bosses
        if (this.bosses.getChildren().length < 2) {
            // Don't spawn a boss if the player just started (score too low)
            if (this.score >= this.bossSpawnScore / 2) {
                this.spawnBoss();
            }
        }
    }

    spawnPowerup() {
        // Random x position
        const x = Phaser.Math.Between(50, 750);
        const y = -50; // Just above the top of the screen

        // Choose powerup type
        const types = ['health', 'weapon', 'shield', 'bomb'];
        const weights = [40, 30, 20, 10]; // Probability weights (health most common, bomb least common)

        // Weighted random selection
        let totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Phaser.Math.Between(1, totalWeight);
        let type;

        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                type = types[i];
                break;
            }
        }

        // Create powerup
        const powerup = new Powerup(this, x, y, type);
        this.powerups.add(powerup);
    }

    spawnEnemy() {
        // Always spawn from the top
        let x, y;

        // Random x position along the top
        x = Phaser.Math.Between(50, 750);
        y = -50; // Just above the top of the screen

        // Choose enemy type
        const enemyType = Phaser.Math.Between(1, 2);
        const enemyKey = `enemy${enemyType}`;

        // Create enemy
        const enemy = new Enemy(this, x, y, enemyKey, enemyType);
        this.enemies.add(enemy);
    }

    spawnBoss() {
        // Spawn boss in the middle top of the screen
        const x = this.game.config.width / 2;
        const y = -100; // Higher up than regular enemies

        // Create warning message
        const warningText = this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 3,
            'WARNING: BOSS APPROACHING',
            {
                fontSize: '32px',
                fontStyle: 'bold',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6
            }
        );
        warningText.setOrigin(0.5);
        warningText.setDepth(100);

        // Flash the warning text
        this.tweens.add({
            targets: warningText,
            alpha: { from: 1, to: 0 },
            duration: 500,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                warningText.destroy();
            }
        });

        // Play warning sound (reuse explosion sound)
        if (this.sound.get('explosion')) {
            this.sound.play('explosion', { volume: 0.3 });
        }

        // Delay the boss spawn to match the warning duration
        this.time.delayedCall(2000, () => {
            // Create boss
            const boss = new Boss(this, x, y);
            this.bosses.add(boss);

            // Create dramatic entrance effect
            const entranceEffect = this.add.image(x, y, 'explosion');
            entranceEffect.setScale(1.5);
            entranceEffect.setAlpha(0.8);
            entranceEffect.setTint(0xff0000); // Red tint
            entranceEffect.setDepth(9); // Behind the boss

            // Add animation
            this.tweens.add({
                targets: entranceEffect,
                scale: 3,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => {
                    entranceEffect.destroy();
                }
            });
        });
    }

    playerEnemyCollision(player, enemy) {
        player.damage();
        enemy.destroy();
    }

    playerBulletCollision(player, bullet) {
        bullet.destroy();
        player.damage();
    }

    bulletEnemyCollision(bullet, enemy) {
        bullet.destroy();
        enemy.damage();

        // Increase score
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    createHealthBar() {
        // Health bar container (positioned below score)
        this.healthBarContainer = this.add.graphics();
        this.healthBarContainer.setDepth(20);
        this.healthBarContainer.x = 16;
        this.healthBarContainer.y = 50;

        // Health bar background
        this.healthBarBackground = this.add.graphics();
        this.healthBarBackground.setDepth(20);
        this.healthBarBackground.x = 16;
        this.healthBarBackground.y = 50;
        this.healthBarBackground.fillStyle(0x333333, 1);
        this.healthBarBackground.fillRect(0, 0, 150, 20);

        // Health bar fill
        this.healthBar = this.add.graphics();
        this.healthBar.setDepth(21);
        this.healthBar.x = 16;
        this.healthBar.y = 50;

        // Health text
        this.healthText = this.add.text(16, 75, 'Health: 3/3', {
            fontSize: '18px',
            fill: '#ffffff'
        });

        // Initial update
        this.updateHealthBar();
    }

    updateHealthBar() {
        if (!this.player || !this.healthBar) return;

        // Clear previous health bar
        this.healthBar.clear();

        // Ensure maxHealth is defined (default to 3 if undefined)
        const maxHealth = this.player.maxHealth || 3;

        // Calculate health percentage
        const healthPercent = this.player.health / maxHealth;

        // Choose color based on health percentage
        let color;
        if (healthPercent > 0.6) {
            color = 0x00ff00; // Green
        } else if (healthPercent > 0.3) {
            color = 0xffff00; // Yellow
        } else {
            color = 0xff0000; // Red
        }

        // Draw health bar
        this.healthBar.fillStyle(color, 1);
        this.healthBar.fillRect(0, 0, 150 * healthPercent, 20);

        // Update health text
        this.healthText.setText(`Health: ${this.player.health}/${maxHealth}`);
    }

    createExplosion(x, y, scale = 1) {
        // Create explosion at specified position
        const explosion = this.add.image(x, y, 'explosion');
        explosion.setScale(scale);
        explosion.setDepth(20); // Ensure it's in front of everything

        // Add rotation and scaling animation
        this.tweens.add({
            targets: explosion,
            angle: Phaser.Math.Between(-60, 60), // Random rotation
            scale: { from: scale * 0.5, to: scale * 1.5 }, // Start smaller, grow larger
            alpha: { from: 1, to: 0 },
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });

        return explosion;
    }

    gameOver() {
        if (this.isGameOver) return;

        this.isGameOver = true;

        // Play explosion sound
        if (this.sound.get('explosion')) {
            this.sound.play('explosion');
        } else {
            console.warn('Explosion sound not loaded properly');
        }

        // Create explosion at player position
        const explosion = this.createExplosion(this.player.x, this.player.y, 2);

        // Create additional particle effects for a more dramatic player explosion
        for (let i = 0; i < 10; i++) {
            const particle = this.add.image(this.player.x, this.player.y, 'explosion');
            particle.setScale(0.5);
            particle.setAlpha(0.8);
            particle.setDepth(19); // Slightly behind the main explosion

            // Random direction for particles
            const angle = Math.random() * Math.PI * 2;
            const distance = Phaser.Math.Between(30, 80);

            this.tweens.add({
                targets: particle,
                x: this.player.x + Math.cos(angle) * distance,
                y: this.player.y + Math.sin(angle) * distance,
                angle: Phaser.Math.Between(-180, 180),
                scale: { from: 0.5, to: 0.2 },
                alpha: 0,
                duration: Phaser.Math.Between(600, 900),
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }

        // Stop enemy spawner
        this.enemySpawner.remove();

        // Transition to game over scene after delay
        this.time.delayedCall(2000, () => {
            this.sound.stopAll();
            this.scene.start('GameOverScene', { score: this.score });
        });
    }
}
