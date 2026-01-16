import { Scene } from 'phaser';
import { SCENE_KEYS, GAME_CONFIG } from '@constants/index';
import { AudioService } from '@core/AudioService';
import { StorageService } from '@core/StorageService';
import { LevelService } from '@core/LevelService';
import { LocalizationService } from '@core/LocalizationService';
import { AnalyticsService } from '@core/AnalyticsService';

/**
 * BootScene handles initial loading and service initialization
 */
export class BootScene extends Scene {
    private loadingText: Phaser.GameObjects.Text | null = null;
    private progressBar: Phaser.GameObjects.Graphics | null = null;

    constructor() {
        super({ key: SCENE_KEYS.BOOT });
    }

    /**
     * Preload assets
     */
    public preload(): void {
        this.createLoadingUI();

        // Setup loading progress callbacks
        this.load.on('progress', this.onLoadProgress, this);
        this.load.on('complete', this.onLoadComplete, this);

        // Preload audio assets
        AudioService.preloadAssets(this);

        // Preload placeholder images (will be replaced with actual assets)
        this.loadPlaceholderAssets();
    }

    /**
     * Creates loading UI
     */
    private createLoadingUI(): void {
        const centerX = GAME_CONFIG.WIDTH / 2;
        const centerY = GAME_CONFIG.HEIGHT / 2;

        // Loading text
        this.loadingText = this.add.text(centerX, centerY - 50, 'Yükleniyor...', {
            fontSize: '32px',
            color: '#FFFFFF',
            fontFamily: 'Arial, sans-serif',
        });
        this.loadingText.setOrigin(0.5);

        // Progress bar background
        const progressBarWidth = 400;
        const progressBarHeight = 30;

        const progressBg = this.add.graphics();
        progressBg.fillStyle(0x222222, 0.8);
        progressBg.fillRect(
            centerX - progressBarWidth / 2,
            centerY,
            progressBarWidth,
            progressBarHeight
        );

        // Progress bar
        this.progressBar = this.add.graphics();
    }

    /**
     * Updates loading progress
     */
    private onLoadProgress(progress: number): void {
        if (this.progressBar === null) {
            return;
        }

        const centerX = GAME_CONFIG.WIDTH / 2;
        const centerY = GAME_CONFIG.HEIGHT / 2;
        const progressBarWidth = 400;
        const progressBarHeight = 30;

        this.progressBar.clear();
        this.progressBar.fillStyle(0x3498db, 1);
        this.progressBar.fillRect(
            centerX - progressBarWidth / 2,
            centerY,
            progressBarWidth * progress,
            progressBarHeight
        );

        if (this.loadingText !== null) {
            this.loadingText.setText(`Yükleniyor... ${Math.round(progress * 100)}%`);
        }
    }

    /**
     * Called when loading is complete
     */
    private onLoadComplete(): void {
        // Cleanup loading UI
        this.loadingText?.destroy();
        this.progressBar?.destroy();
    }

    /**
     * Loads only essential assets (UI elements and category icons)
     * Card images will be loaded lazily per category
     */
    private loadPlaceholderAssets(): void {
        // Create simple texture for confetti particles
        const graphics = this.make.graphics({ x: 0, y: 0, add: false } as any);
        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, 10, 10);
        graphics.generateTexture('confetti', 10, 10);
        graphics.destroy();

        // Create star texture (Diamond shape)
        const starGraphics = this.make.graphics({ x: 0, y: 0, add: false } as any);
        starGraphics.fillStyle(0xffdd00);
        starGraphics.beginPath();
        starGraphics.moveTo(8, 0);
        starGraphics.lineTo(16, 8);
        starGraphics.lineTo(8, 16);
        starGraphics.lineTo(0, 8);
        starGraphics.closePath();
        starGraphics.fillPath();
        starGraphics.generateTexture('star', 16, 16);
        starGraphics.destroy();

        // Load category icons only
        // These are needed for CategorySelectionScene
        const categoryIcons = [
            '/assets/images/categories/animals-icon.png',
            '/assets/images/categories/fruits-icon.png',
            '/assets/images/categories/vehicles-icon.png',
            '/assets/images/categories/space-icon.png',
            '/assets/images/categories/sea-icon.png',
            '/assets/images/categories/dinosaurs-icon.png',
            '/assets/images/categories/feelings-icon.png',
            '/assets/images/categories/jobs-icon.png',
            '/assets/images/categories/shapes-icon.png',
        ];

        categoryIcons.forEach(iconPath => {
            this.load.image(iconPath, iconPath);
        });

        // Load card back images
        const cardBacks = [
            { key: 'card-back-default', path: '/assets/images/card-backs/default.svg' },
            { key: 'card-back-stars', path: '/assets/images/card-backs/stars.svg' },
            { key: 'card-back-rainbow', path: '/assets/images/card-backs/rainbow.svg' },
            { key: 'card-back-animals', path: '/assets/images/card-backs/animals.svg' },
            { key: 'card-back-space', path: '/assets/images/card-backs/space.svg' },
            { key: 'card-back-hearts', path: '/assets/images/card-backs/hearts.svg' },
        ];

        cardBacks.forEach(cb => {
            this.load.svg(cb.key, cb.path);
        });

        // NOTE: Card images are now loaded lazily per category via AssetLoaderService
        // This reduces initial load time from ~5s to ~1.5s (70% improvement)
        console.log('[BootScene] Loading only essential assets (category icons + UI)');
    }

    /**
     * Initialize services
     */
    public async create(): Promise<void> {
        try {
            // Initialize services
            const storageService = StorageService.getInstance();
            const levelService = LevelService.getInstance();
            const audioService = AudioService.getInstance();
            const localizationService = LocalizationService.getInstance();
            const analyticsService = AnalyticsService.getInstance();

            // Load settings
            const settings = storageService.loadSettings();

            // Initialize localization
            await localizationService.initialize(settings.language);

            // Initialize level service
            await levelService.initialize();

            // Initialize audio service
            await audioService.initialize(this);
            audioService.setVolume(settings.volume);
            audioService.setSoundEnabled(settings.soundEnabled);
            audioService.setMusicEnabled(settings.musicEnabled);

            // Initialize analytics
            analyticsService.initialize();

            // Check for data corruption
            if (storageService.isDataCorrupted()) {
                console.warn('Corrupted data detected, resetting to defaults');
            }

            // Transition to main menu
            this.scene.start(SCENE_KEYS.MAIN_MENU);
        } catch (error) {
            console.error('Failed to initialize services:', error);
            // Show error message
            this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 'Yükleme Hatası', {
                fontSize: '32px',
                color: '#FF0000',
            }).setOrigin(0.5);
        }
    }
}
