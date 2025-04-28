# Sound Replacement Guide

This guide provides instructions for replacing all placeholder sound files in the game.

## Explosion Sounds

The current explosion.mp3 file is a placeholder (0 bytes) and needs to be replaced with actual explosion sound effects.

## Recommended Free Explosion Sound Resources

Here are some websites where you can find free explosion sound effects:

1. **Freesound.org** - https://freesound.org/search/?q=explosion
   - Large collection of user-contributed sounds under Creative Commons licenses
   - Filter by license type for commercial use if needed

2. **Pixabay** - https://pixabay.com/sound-effects/search/explosion/
   - All sounds are free for commercial use
   - No attribution required

3. **Zapsplat** - https://www.zapsplat.com/sound-effect-categories/explosions/
   - Free account with attribution
   - Premium accounts available for no attribution

4. **OpenGameArt.org** - https://opengameart.org/art-search-advanced?keys=explosion&field_art_type_tid%5B%5D=13
   - Game-specific sound effects
   - Various licenses, check each sound

## How to Replace the Sound

1. Download explosion sound effects from one of the resources above
2. Rename the downloaded file to `explosion.mp3` (convert to MP3 format if necessary)
3. Replace the placeholder file at `src\static\assets\sounds\explosion.mp3`

## Usage in Game

The explosion sound is used in multiple places in the game with different volume levels:
- Regular enemies: 0.3 volume
- Bosses: 0.5 volume
- Player and super bosses: 0.7 volume

Consider choosing a sound that works well at these different volume levels.

## Game Music

The current game-music.mp3 file is a placeholder (0 bytes) and needs to be replaced with actual background music.

### Recommended Free Game Music Resources

Here are some websites where you can find free game music:

1. **Freesound.org** - https://freesound.org/search/?q=game+music
   - Filter for longer tracks suitable for background music
   - Check licenses for commercial use

2. **Pixabay** - https://pixabay.com/music/search/game/
   - All music is free for commercial use
   - No attribution required

3. **OpenGameArt.org** - https://opengameart.org/art-search-advanced?keys=music&field_art_type_tid%5B%5D=12
   - Game-specific music tracks
   - Various licenses, check each track

4. **Free Music Archive** - https://freemusicarchive.org/search/?adv=1&search-genre=Game
   - Curated high-quality music
   - Check individual licenses

### How to Replace the Game Music

1. Download game music from one of the resources above
2. Rename the downloaded file to `game-music.mp3` (convert to MP3 format if necessary)
3. Replace the placeholder file at `src\static\assets\sounds\game-music.mp3`

### Usage in Game

The game music is played as background music with looping enabled at a volume of 0.5.

## Shooting Sound

The current shoot.mp3 file is a placeholder (0 bytes) and needs to be replaced with an actual shooting sound effect.

### Recommended Free Shooting Sound Resources

Here are some websites where you can find free shooting sound effects:

1. **Freesound.org** - https://freesound.org/search/?q=laser+shoot
   - Search for "laser shoot" or "space gun" for sci-fi shooting sounds
   - Filter by license type for commercial use if needed

2. **Pixabay** - https://pixabay.com/sound-effects/search/laser/
   - All sounds are free for commercial use
   - No attribution required

3. **Zapsplat** - https://www.zapsplat.com/sound-effect-categories/lasers-and-weapons/
   - Free account with attribution
   - Premium accounts available for no attribution

### How to Replace the Shooting Sound

1. Download shooting sound effects from one of the resources above
2. Rename the downloaded file to `shoot.mp3` (convert to MP3 format if necessary)
3. Replace the placeholder file at `src\static\assets\sounds\shoot.mp3`

### Usage in Game

The shooting sound is played when the player fires a weapon at a volume of 0.5.
