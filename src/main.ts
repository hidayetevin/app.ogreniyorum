import './styles/main.css';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { CategorySelectionScene } from './scenes/CategorySelectionScene';
import { GamePlayScene } from './scenes/GamePlayScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { ParentPanelScene } from './scenes/ParentPanelScene';
import { CardBackSelectionScene } from './scenes/CardBackSelectionScene';
import { GAME_CONFIG } from '@constants/index';
import { batteryOptimizer } from '@utils/BatteryOptimizer';
/**
 * Main Phaser game configuration
 */
const config: Phaser.Types.Core.GameConfig & { resolution?: number } = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: GAME_CONFIG.BACKGROUND_COLOR,
    scene: [BootScene, MainMenuScene, CategorySelectionScene, GamePlayScene, LevelCompleteScene, ParentPanelScene, CardBackSelectionScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // High-DPI support
    resolution: window.devicePixelRatio,
    fps: {
        target: 60,
        forceSetTimeOut: false,
        min: 30,
        smoothStep: true,
    },
    render: {
        antialias: true, // Enable for smooth edges
        pixelArt: false,
        roundPixels: true, // Prevent sub-pixel blurring
        powerPreference: 'high-performance',
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
    const game = new Phaser.Game(config);

    // Initialize battery optimizer
    batteryOptimizer.init(game);

    console.log('[Game] Initialized with battery optimization');
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGame);
} else {
    startGame();
}
