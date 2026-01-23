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

        // Save progress
        this.saveProgress();
    }

    /**
     * Creates the completion UI
     */
    public create(): void {
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

        // Stats
        const statsY = centerY + 20;
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

        // Buttons
        const buttonY = centerY + 150;

        // Next level button
        const nextLevel = this.levelService.getNextLevel(this.levelId);

        if (nextLevel !== null) {
            new Button(this, {
                x: centerX - 160,
                y: buttonY,
                width: 250,
                height: 70,
                text: this.localizationService.translate('menu.next'),
                backgroundColor: COLORS.PRIMARY,
                fontSize: 28,
                onClick: () => {
                    this.playNextLevel();
                },
            });
        }

        // Retry button
        new Button(this, {
            x: centerX + (nextLevel !== null ? 160 : 0),
            y: buttonY,
            width: 250,
            height: 70,
            text: this.localizationService.translate('menu.retry'),
            backgroundColor: COLORS.SECONDARY,
            fontSize: 28,
            onClick: () => {
                this.retryLevel();
            },
        });

        // Main menu button
        new Button(this, {
            x: centerX,
            y: buttonY + 90,
            width: 250,
            height: 70,
            text: this.localizationService.translate('menu.mainMenu'),
            backgroundColor: COLORS.ACCENT,
            fontSize: 28,
            onClick: () => {
                this.goToMainMenu();
            },
        });

        // Animate title
        this.tweens.add({
            targets: title,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
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
}
