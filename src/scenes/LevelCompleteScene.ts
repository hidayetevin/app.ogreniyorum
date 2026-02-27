import { Scene } from 'phaser';
import { SCENE_KEYS, GAME_CONFIG, COLORS } from '@constants/index';
import { Button } from '@ui/Button';
import { StorageService } from '@core/StorageService';
import { LevelService } from '@core/LevelService';
import { LocalizationService } from '@core/LocalizationService';
import { FeedbackService } from '@core/FeedbackService';
import { FeedbackType } from '../types/models';
import type { ILevelProgress } from '../types/models';
import { AdService } from '@core/AdService';

/**
 * LevelCompleteScene shows level completion results
 */
export class LevelCompleteScene extends Scene {
    private storageService: StorageService;
    private levelService: LevelService;
    private localizationService: LocalizationService;
    private feedbackService: FeedbackService;
    private adService: AdService;

    private levelId: string = '';
    private categoryId: string = '';
    private moves: number = 0;
    private stars: number = 0;
    private hasWatched2xAd: boolean = false;

    constructor() {
        super({ key: SCENE_KEYS.LEVEL_COMPLETE });
        this.storageService = StorageService.getInstance();
        this.levelService = LevelService.getInstance();
        this.localizationService = LocalizationService.getInstance();
        this.feedbackService = FeedbackService.getInstance();
        this.adService = AdService.getInstance();
    }

    /**
     * Initializes with level completion data
     */
    public init(data: { levelId: string; categoryId: string; moves: number; stars: number }): void {
        this.levelId = data.levelId;
        this.categoryId = data.categoryId;
        this.moves = data.moves;
        this.stars = data.stars;
        this.hasWatched2xAd = false; // Reset on new scene initialization

        // Save progress
        this.saveProgress();
    }

    /**
     * Creates the completion UI
     */
    public create(): void {
        try {
            const centerX = GAME_CONFIG.WIDTH / 2;
            const centerY = GAME_CONFIG.HEIGHT / 2;

            // Background
            this.cameras.main.setBackgroundColor(GAME_CONFIG.BACKGROUND_COLOR);

            // Show banner ad via AdMob
            void this.adService.showBanner();

            // Initialize feedback service
            this.feedbackService.initialize(this);

            // Celebration effect
            this.feedbackService.triggerFeedback(FeedbackType.LEVEL_COMPLETE);

            // Title
            const title = this.add.text(
                centerX,
                centerY - 200,
                this.localizationService.translate('level.complete'),
                {
                    fontSize: '64px',
                    color: COLORS.SUCCESS,
                    fontFamily: 'Arial, sans-serif',
                    fontStyle: 'bold',
                }
            );
            title.setOrigin(0.5);

            // Stars display
            this.displayStars(centerX, centerY - 100);

            // Fetch next level to determine flow
            const nextLevel = this.levelService.getNextLevel(this.levelId);

            // Dynamic stats positioning
            let statsY = centerY + 10; // Moved stats up a bit

            if (nextLevel === null) {
                const categoryCompleted = this.add.text(
                    centerX,
                    centerY - 35,
                    this.localizationService.translate('category.completed'),
                    {
                        fontSize: '32px',
                        color: COLORS.WARNING,
                        fontFamily: 'Arial, sans-serif',
                        fontStyle: 'bold',
                    }
                );
                categoryCompleted.setOrigin(0.5);

                // Add simple pulse animation
                this.tweens.add({
                    targets: categoryCompleted,
                    scale: 1.1,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                // Push stats further down to make room
                statsY = centerY + 20;
            }

            // Stats
            const movesText = this.add.text(
                centerX,
                statsY,
                this.localizationService.translate('stats.moves', { count: this.moves.toString() }),
                {
                    fontSize: '28px',
                    color: COLORS.TEXT_LIGHT,
                    fontFamily: 'Arial, sans-serif',
                }
            );
            movesText.setOrigin(0.5);

            // 2x Reward Button
            let doubleRewardBtn: Button | null = null;
            if (this.stars > 0) {
                doubleRewardBtn = new Button(this, {
                    x: centerX,
                    y: centerY + 70, // 60px distance from statsY (10) to here (70)
                    width: 540,
                    height: 70,
                    text: this.localizationService.translate('game.doubleReward'),
                    backgroundColor: COLORS.WARNING,
                    fontSize: 32,
                    onClick: () => {
                        void this.handleDoubleReward(doubleRewardBtn);
                    }
                });

                // Add pulse animation to make it stand out
                this.tweens.add({
                    targets: doubleRewardBtn,
                    scale: 1.05,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            // Buttons
            const buttonY = centerY + 160; // 90px distance from 2xBtn (70) to here (160) - perfectly even gaps

            const createMainButtons = () => {
                if (nextLevel !== null) {
                    // Next
                    new Button(this, {
                        x: centerX - 140, y: buttonY, width: 260, height: 70,
                        text: this.localizationService.translate('menu.next'),
                        backgroundColor: COLORS.PRIMARY, fontSize: 26,
                        onClick: () => { void this.handleActionWithAd(() => this.playNextLevel()); },
                    });

                    // Retry
                    new Button(this, {
                        x: centerX + 140, y: buttonY, width: 260, height: 70,
                        text: this.localizationService.translate('menu.retry'),
                        backgroundColor: COLORS.SECONDARY, fontSize: 26,
                        onClick: () => { void this.handleActionWithAd(() => this.retryLevel()); },
                    });

                    // Categories
                    new Button(this, {
                        x: centerX - 140, y: buttonY + 90, width: 260, height: 70,
                        text: this.localizationService.translate('menu.categories'),
                        backgroundColor: COLORS.WARNING, fontSize: 26,
                        onClick: () => { void this.handleActionWithAd(() => this.goToCategories()); },
                    });

                    // Main Menu
                    new Button(this, {
                        x: centerX + 140, y: buttonY + 90, width: 260, height: 70,
                        text: this.localizationService.translate('menu.mainMenu'),
                        backgroundColor: COLORS.ACCENT, fontSize: 26,
                        onClick: () => { void this.handleActionWithAd(() => this.goToMainMenu()); },
                    });
                } else {
                    // Retry
                    new Button(this, {
                        x: centerX, y: buttonY, width: 250, height: 70,
                        text: this.localizationService.translate('menu.retry'),
                        backgroundColor: COLORS.SECONDARY, fontSize: 28,
                        onClick: () => { void this.handleActionWithAd(() => this.retryLevel()); },
                    });

                    // Categories
                    new Button(this, {
                        x: centerX, y: buttonY + 90, width: 250, height: 70,
                        text: this.localizationService.translate('menu.categories'),
                        backgroundColor: COLORS.WARNING, fontSize: 28,
                        onClick: () => { void this.handleActionWithAd(() => this.goToCategories()); },
                    });

                    // Main Menu
                    new Button(this, {
                        x: centerX, y: buttonY + 180, width: 250, height: 70,
                        text: this.localizationService.translate('menu.mainMenu'),
                        backgroundColor: COLORS.ACCENT, fontSize: 28,
                        onClick: () => { void this.handleActionWithAd(() => this.goToMainMenu()); },
                    });
                }
            };

            // Delay main buttons if there's a 2x reward to watch
            if (this.stars > 0) {
                this.time.delayedCall(2000, createMainButtons);
            } else {
                createMainButtons();
            }

            // Animate title
            this.tweens.add({
                targets: title,
                scale: 1.1,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        } catch (error) {
            console.error('[LevelCompleteScene] Scene Create Error:', error);

            // Show explicit error
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
                text: 'Ana Menü',
                backgroundColor: COLORS.ACCENT,
                fontSize: 24,
                onClick: () => {
                    this.scene.start(SCENE_KEYS.MAIN_MENU);
                }
            });
        }
    }

    /**
     * Displays star rating
     */
    private displayStars(x: number, y: number): void {
        const starSize = 60;
        const starSpacing = 80;
        const startX = x - starSpacing;

        for (let i = 0; i < 3; i++) {
            const starX = startX + i * starSpacing;
            const isFilled = i < this.stars;

            const star = this.add.text(starX, y, isFilled ? '⭐' : '☆', {
                fontSize: `${starSize}px`,
                padding: { top: 10, bottom: 10 },
            });
            star.setOrigin(0.5);

            // Animate filled stars
            if (isFilled) {
                this.time.delayedCall(i * 200, () => {
                    this.tweens.add({
                        targets: star,
                        scale: 1.3,
                        duration: 300,
                        yoyo: true,
                        ease: 'Back.easeOut',
                    });
                });
            }
        }
    }

    /**
     * Saves level progress
     */
    private saveProgress(): void {
        const existingProgress = this.storageService.getLevelProgress(this.levelId);

        const levelProgress: ILevelProgress = {
            levelId: this.levelId,
            categoryId: this.categoryId,
            completed: true,
            stars: this.stars,
            bestMoves: existingProgress?.bestMoves
                ? Math.min(this.moves, existingProgress.bestMoves)
                : this.moves,
            bestTime: 0, // TODO: Implement time tracking
            attempts: (existingProgress?.attempts ?? 0) + 1,
            lastPlayedAt: Date.now(),
        };

        this.storageService.saveLevelProgress(levelProgress);
    }

    /**
     * Plays the next level
     */
    private playNextLevel(): void {
        const nextLevel = this.levelService.getNextLevel(this.levelId);

        if (nextLevel !== null) {
            this.scene.start(SCENE_KEYS.GAME_PLAY, {
                levelId: nextLevel.id,
                categoryId: nextLevel.categoryId,
            });
        }
    }

    /**
     * Retries the current level
     */
    private retryLevel(): void {
        this.scene.start(SCENE_KEYS.GAME_PLAY, {
            levelId: this.levelId,
            categoryId: this.categoryId,
        });
    }

    /**
     * Returns to main menu
     */
    private goToMainMenu(): void {
        this.scene.start(SCENE_KEYS.MAIN_MENU);
    }

    /**
     * Returns to categories selection
     */
    private goToCategories(): void {
        this.scene.start(SCENE_KEYS.CATEGORY_SELECTION);
    }

    private isHandlingAction: boolean = false;

    /**
     * Wrapper for button actions that require waiting for an ad
     */
    private async handleActionWithAd(action: () => void): Promise<void> {
        if (this.isHandlingAction) return;

        // Skip interstitial if user already watched the 2x Reward ad
        if (this.hasWatched2xAd) {
            action();
            return;
        }

        this.isHandlingAction = true;

        let loadingText: Phaser.GameObjects.Text | null = null;
        let overlayBg: Phaser.GameObjects.Rectangle | null = null;

        // Show loading overlay and block inputs if ad needs to be fetched
        if (!this.adService.isInterstitialReady()) {
            const centerX = GAME_CONFIG.WIDTH / 2;
            const centerY = GAME_CONFIG.HEIGHT / 2;

            overlayBg = this.add.rectangle(centerX, centerY, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT, 0x000000, 0.7);
            overlayBg.setDepth(1999);
            overlayBg.setInteractive(); // Intercepts clicks to buttons

            loadingText = this.add.text(centerX, centerY, 'Reklam Yükleniyor...', {
                fontSize: '32px',
                color: '#ffffff',
                fontFamily: 'Arial, sans-serif'
            }).setOrigin(0.5).setDepth(2000);
        }

        try {
            // Attempt to show interstitial ad
            await this.adService.showInterstitialAd();
        } catch (error) {
            console.error('Error showing interstitial ad:', error);
            // If ad fails, we still want the user to proceed
        } finally {
            if (loadingText) loadingText.destroy();
            if (overlayBg) overlayBg.destroy();

            // Execute the intended action (navigation)
            action();
            this.isHandlingAction = false;
        }
    }

    /**
     * Handles the Double Reward logic when 2x button is clicked
     */
    private async handleDoubleReward(buttonObj: Button | null): Promise<void> {
        if (this.isHandlingAction) return;
        this.isHandlingAction = true;

        let loadingText: Phaser.GameObjects.Text | null = null;
        let overlayBg: Phaser.GameObjects.Rectangle | null = null;

        if (!this.adService.isRewardedReady()) {
            const centerX = GAME_CONFIG.WIDTH / 2;
            const centerY = GAME_CONFIG.HEIGHT / 2;

            overlayBg = this.add.rectangle(centerX, centerY, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT, 0x000000, 0.7);
            overlayBg.setDepth(1999);
            overlayBg.setInteractive();

            loadingText = this.add.text(centerX, centerY, this.localizationService.translate('ad.watching'), {
                fontSize: '32px',
                color: '#ffffff',
                fontFamily: 'Arial, sans-serif'
            }).setOrigin(0.5).setDepth(2000);
        }

        try {
            const earnedReward = await this.adService.showRewardedAd();

            if (earnedReward) {
                this.hasWatched2xAd = true; // Flag to prevent interstitial ad next

                const extraStars = this.stars;
                this.stars *= 2;

                // Save the new doubled stars amount
                this.saveProgress();

                // Show visual feedback animation (+X Yıldız!)
                const centerX = GAME_CONFIG.WIDTH / 2;
                const centerY = GAME_CONFIG.HEIGHT / 2;

                const rewardText = this.add.text(
                    centerX,
                    centerY + 85,
                    this.localizationService.translate('game.rewardReceived', { count: extraStars.toString() }),
                    { fontSize: '32px', color: COLORS.SUCCESS, fontStyle: 'bold' }
                ).setOrigin(0.5).setDepth(100);

                this.tweens.add({
                    targets: rewardText,
                    y: centerY + 30, // Float up
                    alpha: 0,
                    duration: 2000,
                    ease: 'Power2',
                    onComplete: () => rewardText.destroy()
                });
            }
        } catch (error) {
            console.error('Error handling double reward:', error);
        } finally {
            if (loadingText) loadingText.destroy();
            if (overlayBg) overlayBg.destroy();

            // Remove the 2x button entirely so it cannot be spammed, regardless of ad outcome
            if (buttonObj) {
                buttonObj.destroy();
            }

            this.isHandlingAction = false;
        }
    }
}
