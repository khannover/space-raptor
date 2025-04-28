class Background {
    constructor(scene, x, y, texture) {
        this.scene = scene;
        this.x = x;
        this.y = y;

        // Create two background images for seamless scrolling
        this.bg1 = scene.add.image(x, y, texture);
        this.bg2 = scene.add.image(x, y, texture);

        // Set origin to top-left corner
        this.bg1.setOrigin(0, 0);
        this.bg2.setOrigin(0, 0);

        // Set background to fit game width while maintaining aspect ratio
        this.bg1.displayWidth = scene.game.config.width;
        this.bg1.displayHeight = scene.game.config.width * 1.5; // Original aspect ratio is 2:3 (800x1200)

        this.bg2.displayWidth = scene.game.config.width;
        this.bg2.displayHeight = scene.game.config.width * 1.5; // Original aspect ratio is 2:3 (800x1200)

        // Position the second background image above the first one
        this.bg2.y = y - this.bg2.displayHeight;

        // Set depth (z-index)
        this.bg1.setDepth(0);
        this.bg2.setDepth(0);

        // Scrolling speed
        this.scrollSpeed = 100; // pixels per second
    }

    update(delta) {
        // Move backgrounds down
        this.bg1.y += this.scrollSpeed * (delta / 1000);
        this.bg2.y += this.scrollSpeed * (delta / 1000);

        // If the first background has moved completely off screen, reset its position
        if (this.bg1.y >= this.scene.game.config.height) {
            this.bg1.y = this.bg2.y - this.bg1.displayHeight;
        }

        // If the second background has moved completely off screen, reset its position
        if (this.bg2.y >= this.scene.game.config.height) {
            this.bg2.y = this.bg1.y - this.bg2.displayHeight;
        }
    }
}
