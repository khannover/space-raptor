class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');

        // Game state
        this.player = null;
        this.enemies = null;
        this.playerBullets = null;
        this.enemyBullets = null;
        this.background = null;

        // Game settings
        this.enemySpawnTime = 2000; // ms between enemy spawns
        this.score = 0;
        this.isGameOver = false;
    }

    create() {
        // Create scrolling background
        this.background = new Background(this, 0, 0, 'background');

        // Create player
        this.player = new Player(this, 400, 500, 'player');

        // Create groups for enemies and bullets
        this.enemies = this.physics.add.group();
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();

        // Set up collisions
        this.setupCollisions();

        // Start enemy spawning
        this.startEnemySpawner();

        // Add score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff'
        });

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
                this.player.shoot();
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

    spawnEnemy() {
        // Determine spawn position (top or sides)
        const spawnPosition = Phaser.Math.Between(0, 2);
        let x, y;

        switch (spawnPosition) {
            case 0: // Top
                x = Phaser.Math.Between(50, 750);
                y = -50;
                break;
            case 1: // Left side
                x = -50;
                y = Phaser.Math.Between(50, 300);
                break;
            case 2: // Right side
                x = 850;
                y = Phaser.Math.Between(50, 300);
                break;
        }

        // Choose enemy type
        const enemyType = Phaser.Math.Between(1, 2);
        const enemyKey = `enemy${enemyType}`;

        // Create enemy
        const enemy = new Enemy(this, x, y, enemyKey, enemyType);
        this.enemies.add(enemy);
    }

    playerEnemyCollision(player, enemy) {
        this.gameOver();
    }

    playerBulletCollision(player, bullet) {
        bullet.destroy();
        this.gameOver();
    }

    bulletEnemyCollision(bullet, enemy) {
        bullet.destroy();
        enemy.damage();

        // Increase score
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
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
        const explosion = this.add.image(this.player.x, this.player.y, 'explosion');
        explosion.setScale(2);

        // Fade out explosion
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });

        // Stop enemy spawner
        this.enemySpawner.remove();

        // Transition to game over scene after delay
        this.time.delayedCall(2000, () => {
            this.sound.stopAll();
            this.scene.start('GameOverScene', { score: this.score });
        });
    }
}
