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

        // Game settings
        this.enemySpawnTime = 2000; // ms between enemy spawns
        this.powerupSpawnTime = 10000; // ms between powerup spawns
        this.score = 0;
        this.isGameOver = false;
    }

    create() {
        // Reset game state
        this.isGameOver = false;
        this.score = 0;

        // Create scrolling background
        this.background = new Background(this, 0, 0, 'background');

        // Create player
        this.player = new Player(this, 400, 500, 'player');

        // Create groups for enemies, bullets, and powerups
        this.enemies = this.physics.add.group();
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.powerups = this.physics.add.group();

        // Set up collisions
        this.setupCollisions();

        // Start enemy and powerup spawning
        this.startEnemySpawner();
        this.startPowerupSpawner();

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
