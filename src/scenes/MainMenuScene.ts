import { Scene } from 'phaser';
import { SCENE_KEYS, GAME_CONFIG, COLORS } from '@constants/index';
import { Button } from '@ui/Button';
import { LocalizationService } from '@core/LocalizationService';
import { AudioService } from '@core/AudioService';
import { SettingsPanel } from '@ui/SettingsPanel';
import { Language } from '../types/models';

/**
 * MainMenuScene displays the main menu
 */
export class MainMenuScene extends Scene {
    private localizationService: LocalizationService;
    private audioService: AudioService;
    private settingsPanel!: SettingsPanel;

    constructor() {
        super({ key: SCENE_KEYS.MAIN_MENU });
        this.localizationService = LocalizationService.getInstance();
        this.audioService = AudioService.getInstance();
    }

    /**
     * Creates the main menu UI
     */
    public create(): void {
        const centerX = GAME_CONFIG.WIDTH / 2;
        const centerY = GAME_CONFIG.HEIGHT / 2;

        // Background
        this.cameras.main.setBackgroundColor(GAME_CONFIG.BACKGROUND_COLOR);

        // Title
        const title = this.add.text(
            centerX,
            centerY - 200,
            this.localizationService.translate('app.title'),
            {
                fontSize: '64px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
            }
        );
        title.setOrigin(0.5);

        // Subtitle
        const subtitle = this.add.text(
            centerX,
            centerY - 130,
            this.localizationService.translate('app.subtitle'),
            {
                fontSize: '24px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: 'Arial, sans-serif',
            }
        );
        subtitle.setOrigin(0.5);

        // Play button
        new Button(this, {
            x: centerX,
            y: centerY,
            width: 300,
            height: 80,
            text: this.localizationService.translate('menu.play'),
            backgroundColor: COLORS.PRIMARY,
            fontSize: 32,
            onClick: () => {
                this.startGame();
            },
        });

        // Settings button
        new Button(this, {
            x: centerX,
            y: centerY + 100,
            width: 300,
            height: 80,
            text: this.localizationService.translate('menu.settings'),
            backgroundColor: COLORS.SECONDARY,
            fontSize: 32,
            onClick: () => {
                this.openSettings();
            },
        });

        // Parent panel button
        new Button(this, {
            x: centerX,
            y: centerY + 200,
            width: 300,
            height: 80,
            text: this.localizationService.translate('menu.parent'),
            backgroundColor: COLORS.WARNING,
            fontSize: 32,
            onClick: () => {
                this.openParentPanel();
            },
        });

        // Add pulsing animation to title
        this.tweens.add({
            targets: title,
            scale: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Play background music
        this.audioService.playMusic('background-music', true);

        // Initialize Settings Panel
        this.settingsPanel = new SettingsPanel(this);

        // Language Button (Top Right)
        const currentLang = this.localizationService.getCurrentLanguage();
        new Button(this, {
            x: GAME_CONFIG.WIDTH - 80,
            y: 50,
            width: 100,
            height: 60,
            text: currentLang.toUpperCase(),
            backgroundColor: COLORS.ACCENT,
            fontSize: 24,
            onClick: () => {
                this.toggleLanguage();
            },
        });
    }

    private async toggleLanguage(): Promise<void> {
        const currentLang = this.localizationService.getCurrentLanguage();
        const newLang = currentLang === Language.TR ? Language.EN : Language.TR;

        await this.localizationService.setLanguage(newLang);

        // Reload scene to apply language changes
        this.scene.restart();
    }

    /**
     * Starts the game
     */
    private startGame(): void {
        this.scene.start(SCENE_KEYS.CATEGORY_SELECTION);
    }

    /**
     * Opens settings panel
     */
    private openSettings(): void {
        this.settingsPanel.show();
    }

    /**
     * Opens parent panel
     */
    private openParentPanel(): void {
        // TODO: Implement parent panel
        console.warn('Parent panel not yet implemented');
    }
}
