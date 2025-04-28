// Initialize the Phaser game instance
document.addEventListener('DOMContentLoaded', function() {
    // Hide the loading text
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.style.display = 'none';
    }

    // Create the game with the configuration
    const game = new Phaser.Game(config);

    // Add game to window object for debugging
    window.game = game;

    // Prevent right-click context menu in the game
    document.getElementById('game-container').addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
});
