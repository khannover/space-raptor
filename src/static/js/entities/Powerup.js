class Powerup extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type) {
        // Use a default texture initially - we'll set the correct one based on type
        super(scene, x, y, 'player');
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up powerup properties
        this.type = type; // 'health', 'weapon', 'shield', 'bomb'
        this.speed = 100; // Speed at which powerup moves down
        
        // Set up appearance based on type
        this.setupAppearance();
        
        // Set up depth (z-index)
        this.setDepth(5);
        
        // Set smaller hitbox than the sprite
        this.body.setSize(this.width * 0.8, this.height * 0.8);
        this.body.setOffset(this.width * 0.1, this.height * 0.1);
    }
    
    setupAppearance() {
        // Set scale and tint based on powerup type
        this.setScale(0.3);
        
        switch(this.type) {
            case 'health':
                this.setTint(0xff0000); // Red for health
                break;
            case 'weapon':
                this.setTint(0xffff00); // Yellow for weapon upgrade
                break;
            case 'shield':
                this.setTint(0x00ffff); // Cyan for shield
                break;
            case 'bomb':
                this.setTint(0xff00ff); // Purple for bomb
                break;
            default:
                this.setTint(0xffffff); // White for unknown
        }
        
        // Add a pulsing animation to make powerups more noticeable
        this.scene.tweens.add({
            targets: this,
            alpha: 0.6,
            duration: 500,
            ease: 'Power2',
            yoyo: true,
            repeat: -1
        });
        
        // Add a slight rotation
        this.scene.tweens.add({
            targets: this,
            angle: 360,
            duration: 3000,
            ease: 'Linear',
            repeat: -1
        });
    }
    
    update() {
        // Move downward
        this.y += this.speed * (this.scene.sys.game.loop.delta / 1000);
        
        // Destroy if out of bounds
        if (this.y > this.scene.sys.game.config.height + 50) {
            this.destroy();
        }
    }
    
    collect(player) {
        // Apply effect based on powerup type
        switch(this.type) {
            case 'health':
                this.applyHealthEffect(player);
                break;
            case 'weapon':
                this.applyWeaponEffect(player);
                break;
            case 'shield':
                this.applyShieldEffect(player);
                break;
            case 'bomb':
                this.applyBombEffect(player);
                break;
        }
        
        // Play collection effect
        this.playCollectionEffect();
        
        // Destroy the powerup
        this.destroy();
    }
    
    applyHealthEffect(player) {
        // Refill player health up to max
        if (player.health < player.maxHealth) {
            player.health = Math.min(player.health + 1, player.maxHealth);
            
            // Update health bar
            if (this.scene.updateHealthBar) {
                this.scene.updateHealthBar();
            }
        }
    }
    
    applyWeaponEffect(player) {
        // Upgrade player's weapon (increase fire rate or add multiple bullets)
        player.weaponLevel = (player.weaponLevel || 0) + 1;
        
        // Cap at level 3
        if (player.weaponLevel > 3) {
            player.weaponLevel = 3;
        }
        
        // Increase fire rate
        player.fireRate = Math.max(100, 250 - (player.weaponLevel * 50));
    }
    
    applyShieldEffect(player) {
        // Add shield to player
        player.hasShield = true;
        player.shieldDuration = 10000; // 10 seconds
        
        // Visual effect for shield
        if (player.shieldEffect) {
            player.shieldEffect.destroy();
        }
        
        // Create shield visual effect
        player.shieldEffect = this.scene.add.graphics();
        player.shieldEffect.setDepth(player.depth - 1);
        
        // Draw shield circle
        player.shieldEffect.lineStyle(2, 0x00ffff, 0.8);
        player.shieldEffect.strokeCircle(0, 0, player.width * 0.6);
        
        // Make shield follow player
        player.shieldEffect.x = player.x;
        player.shieldEffect.y = player.y;
    }
    
    applyBombEffect(player) {
        // Give player a bomb that can clear all enemies
        player.hasBomb = true;
    }
    
    playCollectionEffect() {
        // Create a flash effect
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xffffff, 0.8);
        flash.fillCircle(this.x, this.y, 40);
        flash.setDepth(30);
        
        // Fade out and destroy
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: () => {
                flash.destroy();
            }
        });
    }
}