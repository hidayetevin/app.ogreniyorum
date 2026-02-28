import { Scene } from 'phaser';
import { SCENE_KEYS, GAME_CONFIG, COLORS, FONTS } from '@constants/index';
import { Button } from '@ui/Button';
import { LocalizationService } from '@core/LocalizationService';
import { AudioService } from '@core/AudioService';
import { SettingsPanel } from '@ui/SettingsPanel';
import { ProgressBar } from '@ui/ProgressBar';
import { StatsPanel } from '@ui/StatsPanel';
import { ParentGate } from '@ui/ParentGate';
import { StorageService } from '@core/StorageService';
import { LevelService } from '@core/LevelService';
import { Language } from '../types/models';
import { AdService } from '@core/AdService';
import { FeedbackService } from '@core/FeedbackService';

/**
 * MainMenuScene displays the main menu
 */
export class MainMenuScene extends Scene {
    private localizationService: LocalizationService;
    private audioService: AudioService;
    private storageService: StorageService;
    private levelService: LevelService;
    private settingsPanel!: SettingsPanel;
    private progressBar!: ProgressBar;
    private statsPanel!: StatsPanel;
    private parentGate!: ParentGate;
    private adService: AdService;

    constructor() {
        super({ key: SCENE_KEYS.MAIN_MENU });
        this.localizationService = LocalizationService.getInstance();
        this.audioService = AudioService.getInstance();
        this.storageService = StorageService.getInstance();
        this.levelService = LevelService.getInstance();
        this.adService = AdService.getInstance();
    }

    /**
     * Creates the main menu UI
     */
    public create(): void {
        try {
            const centerX = GAME_CONFIG.WIDTH / 2;
            const centerY = GAME_CONFIG.HEIGHT / 2;

            // Initialize feedback service
            FeedbackService.getInstance().initialize(this);

            // 1. Background Gradient (Deep Space)
            const bgGraphics = this.add.graphics();
            bgGraphics.fillGradientStyle(
                Phaser.Display.Color.HexStringToColor(COLORS.BACKGROUND).color,
                Phaser.Display.Color.HexStringToColor(COLORS.BACKGROUND).color,
                Phaser.Display.Color.HexStringToColor('#0F0F1A').color,
                Phaser.Display.Color.HexStringToColor('#0F0F1A').color,
                1
            );
            bgGraphics.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

            // 2. Background Grid Pattern (Subtle)
            const grid = this.add.grid(
                GAME_CONFIG.WIDTH / 2,
                GAME_CONFIG.HEIGHT / 2,
                GAME_CONFIG.WIDTH,
                GAME_CONFIG.HEIGHT,
                60,
                60,
                0xffffff,
                0.02,
                0xffffff,
                0.05
            );
            grid.setAlpha(0.3);

            // 3. Title (Logo Area)
            const title = this.add.text(
                centerX,
                centerY - 340,
                this.localizationService.translate('app.title'),
                {
                    fontSize: '50px', // Reduced from 72px for better fit
                    color: COLORS.TEXT_LIGHT,
                    fontFamily: FONTS.PRIMARY,
                    fontStyle: '900',
                    stroke: COLORS.PRIMARY,
                    strokeThickness: 2,
                    shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 10, stroke: true, fill: true }
                }
            );
            title.setOrigin(0.5);

            // Scale down if it still overflows (Safe guard for long translations)
            const maxTitleWidth = GAME_CONFIG.WIDTH - 80;
            if (title.width > maxTitleWidth) {
                title.setScale(maxTitleWidth / title.width);
            }

            // Subtitle
            const subtitle = this.add.text(
                centerX,
                centerY - 260,
                this.localizationService.translate('app.subtitle'),
                {
                    fontSize: '24px',
                    color: COLORS.SECONDARY,
                    fontFamily: FONTS.SECONDARY,
                    fontStyle: '600',
                    letterSpacing: 2
                }
            );
            subtitle.setOrigin(0.5);

            // Progress tracking UI (moved above buttons)
            this.createProgressUI(centerX, centerY - 280);

            // Play button (moved down)
            new Button(this, {
                x: centerX,
                y: centerY + 80,
                width: 300,
                height: 80,
                text: this.localizationService.translate('menu.play'),
                backgroundColor: COLORS.PRIMARY,
                fontSize: 32,
                onClick: () => {
                    this.startGame();
                },
            });

            // Settings button (moved down)
            new Button(this, {
                x: centerX,
                y: centerY + 180,
                width: 300,
                height: 80,
                text: this.localizationService.translate('menu.settings'),
                backgroundColor: COLORS.SECONDARY,
                fontSize: 32,
                onClick: () => {
                    this.openSettings();
                },
            });

            // Parent panel button (moved down)
            new Button(this, {
                x: centerX,
                y: centerY + 280,
                width: 300,
                height: 80,
                text: this.localizationService.translate('menu.parent'),
                backgroundColor: COLORS.WARNING,
                fontSize: 32,
                onClick: () => {
                    this.openParentPanel();
                },
            });

            // Card backs button
            new Button(this, {
                x: centerX,
                y: centerY + 380,
                width: 300,
                height: 80,
                text: this.localizationService.translate('cardBack.title'),
                backgroundColor: COLORS.PRIMARY,
                fontSize: 32,
                onClick: () => {
                    this.scene.start(SCENE_KEYS.CARD_BACK_SELECTION);
                },
            });

            // Floating Logo Animation
            this.tweens.add({
                targets: title,
                y: title.y - 20,
                scale: 1.05,
                duration: 2500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });

            // Glassmorphism Footer (Polished)
            const footerBg = this.add.graphics();
            // Shadow
            footerBg.fillStyle(0x000000, 0.3);
            footerBg.fillRoundedRect(50, GAME_CONFIG.HEIGHT - 130, GAME_CONFIG.WIDTH - 100, 90, 25);
            // Body
            footerBg.fillStyle(0xffffff, 0.03);
            footerBg.fillRoundedRect(40, GAME_CONFIG.HEIGHT - 140, GAME_CONFIG.WIDTH - 80, 90, 25);
            // Border
            footerBg.lineStyle(2, 0xffffff, 0.1);
            footerBg.strokeRoundedRect(40, GAME_CONFIG.HEIGHT - 140, GAME_CONFIG.WIDTH - 80, 90, 25);

            this.add.text(centerX, GAME_CONFIG.HEIGHT - 80, 'v2.0.1 - EvnLabs', {
                fontSize: '18px',
                color: '#888888',
                fontFamily: FONTS.SECONDARY
            }).setOrigin(0.5);

            // Play background music
            this.audioService.playMusic('background-music', true);

            // Initialize Settings Panel
            this.settingsPanel = new SettingsPanel(this);

            // Initialize Parent Gate
            this.parentGate = new ParentGate(
                this,
                () => {
                    // Success - open parent panel
                    this.scene.start(SCENE_KEYS.PARENT_PANEL);
                },
                () => {
                    // Fail - do nothing
                    console.log('Parent gate failed');
                }
            );

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

            // Show banner ad via AdMob
            void this.adService.showBanner();
        } catch (error) {
            console.error('[MainMenuScene] Scene Create Error:', error);

            // Show explicit error (Critical scene)
            const centerX = GAME_CONFIG.WIDTH / 2;
            const centerY = GAME_CONFIG.HEIGHT / 2;

            this.add.text(centerX, centerY, 'Bir hata oluştu.', {
                fontSize: '32px',
                color: '#ff0000',
                backgroundColor: '#000000'
            }).setOrigin(0.5);

            new Button(this, {
                x: centerX,
                y: centerY + 100,
                width: 200,
                height: 60,
                text: 'Tekrar Dene',
                backgroundColor: COLORS.ACCENT,
                fontSize: 24,
                onClick: () => {
                    this.scene.restart();
                }
            });
        }
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
        this.parentGate.show();
    }

    /**
     * Creates progress tracking UI
     */
    private createProgressUI(centerX: number, centerY: number): void {
        const progress = this.storageService.loadProgress();
        const categories = this.levelService.getCategories();

        // Calculate total possible stars
        let totalPossibleStars = 0;
        categories.forEach(category => {
            totalPossibleStars += category.levels.length * 3; // 3 stars per level
        });

        // Create progress bar
        this.progressBar = new ProgressBar(this, centerX - 200, centerY + 80, 400, 30);
        this.progressBar.updateProgress(progress.totalStars, totalPossibleStars, false);

        // Create stats panel
        this.statsPanel = new StatsPanel(this, centerX - 200, centerY + 130, 400);
        this.statsPanel.updateStats({
            totalStars: progress.totalStars,
            maxStars: totalPossibleStars,
            levelsCompleted: progress.levelsCompleted,
            totalLevels: categories.reduce((sum, cat) => sum + cat.levels.length, 0),
            categoriesUnlocked: progress.unlockedCategories.length,
            totalCategories: categories.length,
            currentStreak: progress.currentStreak,
        });
    }
}
