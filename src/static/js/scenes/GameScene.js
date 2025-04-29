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
        this.gameMusic = null; // Reference to the game music

        // Game settings
        this.enemySpawnTime = 2000; // ms between enemy spawns
        this.powerupSpawnTime = 10000; // ms between powerup spawns
        this.bossSpawnTime = 60000; // ms between boss spawns (increased to make bosses rarer)
        this.bossSpawnScore = 300; // Score threshold for first boss (increased to make bosses rarer)
        this.nextBossSpawn = this.bossSpawnScore; // Score at which next boss will spawn
        this.score = 0;
        this.isGameOver = false;
        this.superBossActive = false; // Flag to track if a super boss is active
        this.musicPlaying = false; // Flag to track if music is playing
    }

    create() {
        // Reset game state
        this.isGameOver = false;
        this.score = 0;
        this.nextBossSpawn = this.bossSpawnScore;
        this.superBossActive = false;

        // Reset music state if it was previously playing and stopped
        if (this.gameMusic && !this.musicPlaying) {
            this.gameMusic = null;
        }

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

        // Add bomb slots UI
        this.createBombUI();

        // Start game music (only if not already playing)
        if (!this.musicPlaying) {
            try {
                // Check if the audio file exists and is loaded
                if (this.sound.get('gameMusic')) {
                    this.gameMusic = this.sound.get('gameMusic');
                    this.gameMusic.play({ loop: true, volume: 0.5 });
                    this.musicPlaying = true;
                } else {
                    console.warn('Game music not found in sound manager');
                    // Try to load the music again if it's not found
                    this.sound.add('gameMusic', '/static/assets/sounds/game-music.mp3');
                    // Store the music instance for later reference
                    this.gameMusic = this.sound.get('gameMusic');
                    if (this.gameMusic) {
                        this.gameMusic.play({ loop: true, volume: 0.5 });
                        this.musicPlaying = true;
                    }
                }
            } catch (error) {
                console.warn('Game music not loaded properly:', error);
                // Try an alternative approach
                try {
                    this.load.audio('gameMusic', '/static/assets/sounds/game-music.mp3');
                    this.load.once('complete', () => {
                        this.gameMusic = this.sound.add('gameMusic');
                        this.gameMusic.play({ loop: true, volume: 0.5 });
                        this.musicPlaying = true;
                    });
                    this.load.start();
                } catch (innerError) {
                    console.error('Failed to play game music after multiple attempts:', innerError);
                }
            }
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
                else if (pointer.button === 2 && this.player.bombCount > 0) {
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
                message = 'Bomb Acquired! Right-click to use (Max 3)';
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
        // Don't spawn enemies if a boss or super boss is active
        if (this.bosses.getChildren().length > 0 || this.superBossActive) {
            return;
        }

        // Determine how many enemies to spawn based on player power
        let enemyCount = 1; // Default is 1 enemy

        // If player exists, check their weapon level and score
        if (this.player) {
            // Increase enemy count based on weapon level
            if (this.player.weaponLevel >= 3) {
                enemyCount = 3; // Spawn 3 enemies when player has max weapon
            } else if (this.player.weaponLevel >= 2) {
                enemyCount = 2; // Spawn 2 enemies for level 2 weapon
            }

            // Further increase based on score
            if (this.score > 500) {
                enemyCount += 1; // Add one more enemy when score is high
            }
        }

        // Spawn multiple enemies
        for (let i = 0; i < enemyCount; i++) {
            // Always spawn from the top
            let x, y;

            // Random x position along the top
            x = Phaser.Math.Between(50, 750);
            y = -50; // Just above the top of the screen

            // Choose enemy type (now includes type 3, which was previously a boss)
            const enemyType = Phaser.Math.Between(1, 3);
            const enemyKey = `enemy${enemyType === 3 ? 2 : enemyType}`; // Use enemy2 texture for type 3

            // Create enemy
            const enemy = new Enemy(this, x, y, enemyKey, enemyType);

            // If it's a type 3 enemy (former boss), make it a bit stronger
            if (enemyType === 3) {
                enemy.health = 5;
                enemy.setScale(0.6); // Larger than regular enemies but smaller than boss
                enemy.setTint(0xff8800); // Orange tint to distinguish from regular enemies
            }

            this.enemies.add(enemy);
        }
    }

    spawnBoss() {
        // Spawn boss in the middle top of the screen
        const x = this.game.config.width / 2;
        const y = -100; // Higher up than regular enemies

        // Determine if this should be a super boss (rarer, more powerful)
        // Higher chance of super boss as score increases
        const superBossThreshold = Math.min(0.3, this.score / 2000); // Max 30% chance
        const isSuperBoss = Math.random() < superBossThreshold;

        // Create warning message with appropriate text
        const warningText = this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 3,
            isSuperBoss ? 'DANGER: SUPER BOSS APPROACHING' : 'WARNING: BOSS APPROACHING',
            {
                fontSize: isSuperBoss ? '36px' : '32px',
                fontStyle: 'bold',
                fill: isSuperBoss ? '#ff00ff' : '#ff0000', // Purple for super boss, red for regular boss
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
            repeat: isSuperBoss ? 5 : 3, // More flashes for super boss
            onComplete: () => {
                warningText.destroy();
            }
        });

        // Play warning sound (reuse explosion sound)
        try {
            this.sound.play('explosion', { volume: isSuperBoss ? 0.5 : 0.3 });
        } catch (error) {
            console.warn('Explosion sound not loaded properly:', error);
        }

        // Delay the boss spawn to match the warning duration
        this.time.delayedCall(isSuperBoss ? 3000 : 2000, () => {
            // Create boss or super boss
            const boss = isSuperBoss 
                ? new SuperBoss(this, x, y)
                : new Boss(this, x, y);
            this.bosses.add(boss);

            // Create dramatic entrance effect
            const entranceEffect = this.add.image(x, y, 'explosion');
            entranceEffect.setScale(isSuperBoss ? 2.0 : 1.5);
            entranceEffect.setAlpha(0.8);
            entranceEffect.setTint(isSuperBoss ? 0xff00ff : 0xff0000); // Purple for super boss, red for regular boss
            entranceEffect.setDepth(9); // Behind the boss

            // Add animation
            this.tweens.add({
                targets: entranceEffect,
                scale: isSuperBoss ? 4 : 3,
                alpha: 0,
                duration: isSuperBoss ? 1500 : 1000,
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

        // Play hit sound
        try {
            this.sound.play('hit', { volume: 0.10 });
        } catch (error) {
            console.warn('Hit sound not loaded properly:', error);
        }

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

    createBombUI() {
        // Bomb UI container (positioned below health text)
        this.bombUIContainer = this.add.container(16, 100);
        this.bombUIContainer.setDepth(20);

        // Bomb slots background
        this.bombSlotsBackground = this.add.graphics();
        this.bombSlotsBackground.fillStyle(0x333333, 1);
        this.bombSlotsBackground.fillRect(0, 0, 100, 30);
        this.bombUIContainer.add(this.bombSlotsBackground);

        // Create bomb slots (3 slots)
        this.bombSlots = [];
        for (let i = 0; i < 3; i++) {
            const slot = this.add.graphics();
            slot.x = 10 + (i * 30);
            slot.y = 5;
            this.bombUIContainer.add(slot);
            this.bombSlots.push(slot);
        }

        // Bomb text
        this.bombText = this.add.text(0, 35, 'Bombs (Right-click to use)', {
            fontSize: '16px',
            fill: '#ffffff'
        });
        this.bombUIContainer.add(this.bombText);

        // Initial update
        this.updateBombUI();
    }

    updateBombUI() {
        if (!this.player || !this.bombSlots) return;

        // Update each bomb slot based on player's bomb count
        for (let i = 0; i < this.bombSlots.length; i++) {
            const slot = this.bombSlots[i];
            slot.clear();

            // Draw slot border
            slot.lineStyle(1, 0xffffff, 0.8);
            slot.strokeRect(0, 0, 20, 20);

            // Fill slot if player has this bomb
            if (i < this.player.bombCount) {
                slot.fillStyle(0xff00ff, 0.8); // Purple for bombs
                slot.fillRect(2, 2, 16, 16);
            }
        }
    }

    createExplosion(x, y, scale = 1, forceType = null) {
        // Randomly select explosion type or use forced type
        const explosionTypes = ['explosion', 'explosion-2', 'explosion-3'];
        const explosionType = forceType || explosionTypes[Phaser.Math.Between(0, explosionTypes.length - 1)];

        // Create explosion at specified position
        const explosion = this.add.image(x, y, explosionType);
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

        // Randomly add smoke effect
        if (Phaser.Math.Between(0, 10) > 5) {
            this.createSmokeEffect(x, y, scale);
        }

        return explosion;
    }

    createSmokeEffect(x, y, scale = 1) {
        // Randomly select smoke type
        const smokeType = Phaser.Math.Between(0, 1) === 0 ? 'smoke-1' : 'smoke-2';

        // Create smoke at specified position with slight offset
        const offsetX = Phaser.Math.Between(-10, 10);
        const offsetY = Phaser.Math.Between(-10, 10);
        const smoke = this.add.image(x + offsetX, y + offsetY, smokeType);

        // Set scale and depth (slightly behind explosion)
        smoke.setScale(scale * 1.2); // Smoke is slightly larger
        smoke.setDepth(19); // Behind explosion but in front of other elements

        // Add animation
        this.tweens.add({
            targets: smoke,
            angle: Phaser.Math.Between(-30, 30), // Slight rotation
            scale: { from: scale * 0.8, to: scale * 2 }, // Grow larger
            alpha: { from: 0.8, to: 0 }, // Fade out
            duration: 1200, // Longer duration than explosion
            ease: 'Power1',
            onComplete: () => {
                smoke.destroy();
            }
        });

        return smoke;
    }

    gameOver() {
        if (this.isGameOver) return;

        this.isGameOver = true;

        // Play explosion sound
        try {
            this.sound.play('explosion', { volume: 0.7 });
        } catch (error) {
            console.warn('Explosion sound not loaded properly:', error);
        }

        // Create main explosion at player position
        const mainExplosion = this.createExplosion(this.player.x, this.player.y, 2);

        // Always create smoke for the main explosion
        this.createSmokeEffect(this.player.x, this.player.y, 2.5);

        // Create secondary explosions with slight delay for a more dramatic effect
        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(Phaser.Math.Between(100, 300), () => {
                // Random offset from player position
                const offsetX = Phaser.Math.Between(-30, 30);
                const offsetY = Phaser.Math.Between(-30, 30);

                // Create secondary explosion with random type
                const explosionTypes = ['explosion', 'explosion-2', 'explosion-3'];
                const randomType = explosionTypes[Phaser.Math.Between(0, explosionTypes.length - 1)];

                this.createExplosion(
                    this.player.x + offsetX, 
                    this.player.y + offsetY, 
                    Phaser.Math.FloatBetween(1.0, 1.5),
                    randomType
                );
            });
        }

        // Create additional particle effects for a more dramatic player explosion
        for (let i = 0; i < 12; i++) {
            // Randomly select explosion or smoke for particles
            const particleType = Phaser.Math.Between(0, 10) > 7 ? 
                ['smoke-1', 'smoke-2'][Phaser.Math.Between(0, 1)] : 
                ['explosion', 'explosion-2', 'explosion-3'][Phaser.Math.Between(0, 2)];

            const particle = this.add.image(this.player.x, this.player.y, particleType);
            particle.setScale(0.4);
            particle.setAlpha(0.8);
            particle.setDepth(19); // Slightly behind the main explosion

            // Random direction for particles
            const angle = Math.random() * Math.PI * 2;
            const distance = Phaser.Math.Between(40, 100);

            this.tweens.add({
                targets: particle,
                x: this.player.x + Math.cos(angle) * distance,
                y: this.player.y + Math.sin(angle) * distance,
                angle: Phaser.Math.Between(-180, 180),
                scale: { from: 0.4, to: 0.2 },
                alpha: 0,
                duration: Phaser.Math.Between(600, 1200),
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
            // Stop all sounds including music
            if (this.gameMusic) {
                this.gameMusic.stop();
                this.musicPlaying = false; // Reset music playing flag
            }
            this.sound.stopAll();
            this.scene.start('GameOverScene', { score: this.score });
        });
    }
}
