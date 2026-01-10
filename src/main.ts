import Phaser from 'phaser';
import { BootScene } from '@scenes/BootScene';
import { MainMenuScene } from '@scenes/MainMenuScene';
import { CategorySelectionScene } from '@scenes/CategorySelectionScene';
import { GamePlayScene } from '@scenes/GamePlayScene';
import { LevelCompleteScene } from '@scenes/LevelCompleteScene';
import { GAME_CONFIG, PERFORMANCE } from '@constants/index';

/**
 * Main Phaser game configuration
 */
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    parent: GAME_CONFIG.PARENT,
    backgroundColor: GAME_CONFIG.BACKGROUND_COLOR,
    scene: [BootScene, MainMenuScene, CategorySelectionScene, GamePlayScene, LevelCompleteScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    fps: {
        target: PERFORMANCE.TARGET_FPS,
        forceSetTimeOut: false,
    },
    render: {
        antialias: true,
        pixelArt: false,
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        },
    },
};

/**
 * Initialize and start the game
 */
function startGame(): void {
    new Phaser.Game(config);
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGame);
} else {
    startGame();
}
