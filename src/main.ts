import './styles/main.css';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { CategorySelectionScene } from './scenes/CategorySelectionScene';
import { GamePlayScene } from './scenes/GamePlayScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { ParentPanelScene } from './scenes/ParentPanelScene';
import { GAME_CONFIG } from '@constants/index';

/**
 * Main Phaser game configuration
 */
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: GAME_CONFIG.BACKGROUND_COLOR,
    scene: [BootScene, MainMenuScene, CategorySelectionScene, GamePlayScene, LevelCompleteScene, ParentPanelScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    fps: {
        target: 60,
        forceSetTimeOut: false,
        min: 30,
        smoothStep: true,
    },
    render: {
        antialias: false, // Disable for better performance
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
