import { Scene } from 'phaser';
import { SCENE_KEYS, GAME_CONFIG, COLORS, TIMING, GRID_CONFIG } from '@constants/index';
import { Card } from '@ui/Card';
import { Button } from '@ui/Button';
import { LevelService } from '@core/LevelService';
import { FeedbackService } from '@core/FeedbackService';
import { AnalyticsService } from '@core/AnalyticsService';
import { LocalizationService } from '@core/LocalizationService';
import { AdService } from '@core/AdService';
import { CardState, FeedbackType, AnalyticsEventType } from '../types/models';
import type { ILevel, IGameSession } from '../types/models';
import { shuffle, createPairs } from '@utils/array';
import { delay } from '@utils/async';
import { CARD_NAMES } from '@constants/cardNames';
import { AudioService } from '@core/AudioService';

/**
 * GamePlayScene handles the main gameplay
 */
export class GamePlayScene extends Scene {
    private levelService: LevelService;
    private feedbackService: FeedbackService;
    private analyticsService: AnalyticsService;
    private localizationService: LocalizationService;
    private adService: AdService;
    private audioService: AudioService;

    private currentLevel: ILevel | null = null;
    private cards: Card[] = [];
    private flippedCards: Card[] = [];
    private isInputLocked: boolean = false;
    private gameSession: IGameSession | null = null;

    constructor() {
        super({ key: SCENE_KEYS.GAME_PLAY });
        this.levelService = LevelService.getInstance();
        this.feedbackService = FeedbackService.getInstance();
        this.analyticsService = AnalyticsService.getInstance();
        this.localizationService = LocalizationService.getInstance();
        this.adService = AdService.getInstance();
        this.audioService = AudioService.getInstance();
    }

    /**
     * Initializes the scene with level data
     */
    public init(data: { levelId: string; categoryId: string }): void {
        const level = this.levelService.getLevelById(data.levelId);

        if (level === null) {
            console.error('Level not found:', data.levelId);
            this.scene.start(SCENE_KEYS.CATEGORY_SELECTION);
            return;
        }

        this.currentLevel = level;

        // Initialize game session
        this.gameSession = {
            levelId: level.id,
            categoryId: level.categoryId,
            startTime: Date.now(),
            moves: 0,
            matches: 0,
            totalPairs: level.pairCount,

            elapsedTime: 0,
        };

        // Track analytics
        this.analyticsService.trackEvent(AnalyticsEventType.LEVEL_START, {
            levelId: level.id,
            categoryId: level.categoryId,
        });
    }

    /**
     * Creates the gameplay UI
     */
    public create(): void {
        if (this.currentLevel === null || this.gameSession === null) {
            return;
        }

        // Background
        this.cameras.main.setBackgroundColor(GAME_CONFIG.BACKGROUND_COLOR);

        // Initialize feedback service
        this.feedbackService.initialize(this);

        // Create UI
        this.createUI();

        // Create card grid
        this.createCardGrid();
    }

    /**
     * Creates the UI elements
     */
    private createUI(): void {
        if (this.currentLevel === null) {
            return;
        }

        // Level title
        const title = this.add.text(
            GAME_CONFIG.WIDTH / 2,
            40,
            this.localizationService.translate('level.title', {
                number: this.currentLevel.levelNumber.toString(),
            }),
            {
                fontSize: '32px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
            }
        );
        title.setOrigin(0.5);

        // Moves counter
        const movesText = this.add.text(100, 100, `${this.localizationService.translate('level.moves')}: 0`, {
            fontSize: '24px',
            color: COLORS.TEXT_LIGHT,
            fontFamily: 'Arial, sans-serif',
        });

        // Back button
        new Button(this, {
            x: 100,
            y: GAME_CONFIG.HEIGHT - 60,
            width: 150,
            height: 60,
            text: this.localizationService.translate('menu.back'),
            backgroundColor: COLORS.ACCENT,
            fontSize: 24,
            onClick: () => {
                this.exitToMenu();
            },
        });

        // Store reference for updates
        this.data.set('movesText', movesText);

        this.data.set('movesText', movesText);
    }



    /**
     * Creates the card grid
     */
    private createCardGrid(): void {
        if (this.currentLevel === null) {
            return;
        }

        const { rows, cols, pairCount, imagePaths } = this.currentLevel;

        // Select random images for this level
        const selectedImages = imagePaths.slice(0, pairCount);

        // Create pairs and shuffle
        const cardData = createPairs(selectedImages);
        const shuffledData = shuffle(cardData);

        // --- Dynamic Scaling for Portrait ---
        // Available space
        const padding = 40;
        const availableWidth = GAME_CONFIG.WIDTH - (padding * 2);
        const availableHeight = GAME_CONFIG.HEIGHT - 400; // Leave space for top and bottom UI

        const spacing = GRID_CONFIG.CARD_SPACING;

        // Calculate max possible size per card
        const maxCardWidth = (availableWidth - (spacing * (cols - 1))) / cols;
        const maxCardHeight = (availableHeight - (spacing * (rows - 1))) / rows;

        // Use the smaller of the two to keep cards square
        const cardSize = Math.min(maxCardWidth, maxCardHeight, 200); // Max cap logic

        const gridWidth = cols * cardSize + (cols - 1) * spacing;
        const gridHeight = rows * cardSize + (rows - 1) * spacing;

        const startX = (GAME_CONFIG.WIDTH - gridWidth) / 2 + cardSize / 2;
        const startY = (GAME_CONFIG.HEIGHT - gridHeight) / 2 + cardSize / 2 + 20; // Slight offset for visual balance

        // Create cards
        let cardIndex = 0;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (cardIndex >= shuffledData.length) {
                    break;
                }

                const imagePath = shuffledData[cardIndex];
                if (imagePath === undefined) {
                    continue;
                }

                const x = startX + col * (cardSize + spacing);
                const y = startY + row * (cardSize + spacing);

                // Create card with dynamic size
                const card = new Card(this, x, y, imagePath, imagePath, cardSize);

                // Add click handler
                card.on('pointerdown', () => {
                    void this.onCardClick(card);
                });

                this.cards.push(card);
                cardIndex++;
            }
        }
    }

    /**
     * Handles card click
     */
    private async onCardClick(card: Card): Promise<void> {
        // Ignore if input is locked or card is not face down
        if (this.isInputLocked || card.getState() !== CardState.FACE_DOWN || card.isCurrentlyFlipping()) {
            return;
        }

        // Flip the card
        this.feedbackService.triggerFeedback(FeedbackType.CARD_FLIP);
        await card.flipToFront();

        // Speak card name
        this.isInputLocked = true;
        await this.speakCardName(card.getImagePath());
        this.isInputLocked = false;

        this.flippedCards.push(card);

        // Check if we have two flipped cards
        if (this.flippedCards.length === 2) {
            this.isInputLocked = true;
            await this.checkMatch();
            this.isInputLocked = false;
        }
    }

    /**
     * Speaks the name of the card
     */
    /**
     * Speaks the name of the card
     */
    private async speakCardName(imagePath: string): Promise<void> {
        // Remove /assets/images/ prefix to get the key used in CARD_NAMES
        const cleanPath = imagePath.replace('/assets/images/', '');
        const key = CARD_NAMES[cleanPath];

        if (key) {
            const name = this.localizationService.translate(key);
            const currentLang = this.localizationService.getCurrentLanguage();
            // Convert 'tr' to 'tr-TR', 'en' to 'en-US' for Speech API
            const locale = currentLang === 'tr' ? 'tr-TR' : 'en-US';
            await this.audioService.speak(name, locale);
        }
    }

    /**
     * Checks if flipped cards match
     */
    private async checkMatch(): Promise<void> {
        if (this.flippedCards.length !== 2 || this.gameSession === null) {
            return;
        }

        const [card1, card2] = this.flippedCards;

        if (card1 === undefined || card2 === undefined) {
            return;
        }

        // Increment moves
        this.gameSession.moves++;
        this.updateMovesDisplay();


        // Check if cards match
        if (card1.getPairId() === card2.getPairId()) {
            // Match!
            this.feedbackService.triggerFeedback(FeedbackType.CORRECT_MATCH, card1.x, card1.y);
            this.feedbackService.triggerFeedback(FeedbackType.CORRECT_MATCH, card2.x, card2.y);

            card1.setMatched();
            card2.setMatched();

            // --- EDUCATIONAL ANIMATION SEQUENCE ---
            // 1. Bring to front
            card1.setDepth(100);
            card2.setDepth(100);

            // 2. Scale Up Animation
            await new Promise<void>(resolve => {
                this.tweens.add({
                    targets: [card1, card2],
                    scale: 1.3,
                    duration: 300,
                    ease: 'Back.out',
                    onComplete: () => resolve()
                });
            });

            // 3. Speak Name (Again, emphasizing the match)
            await this.speakCardName(card1.getImagePath());

            // 4. Wait for speech/emphasis
            // Removed explicit delay as we now await the speech

            // 5. Scale Down / Hide Animation
            await new Promise<void>(resolve => {
                this.tweens.add({
                    targets: [card1, card2],
                    scale: 0,
                    alpha: 0,
                    duration: 300,
                    ease: 'Back.in',
                    onComplete: () => resolve()
                });
            });

            this.gameSession.matches++;

            // Check if level is complete
            if (this.gameSession.matches === this.gameSession.totalPairs) {
                await delay(TIMING.LEVEL_COMPLETE_DELAY);
                await this.completeLevel();
            } else if (this.gameSession.matches > 0 && this.gameSession.matches % 3 === 0) {
                // Show ad every 3 matches
                await this.showAd();
            }
        } else {
            // No match
            this.feedbackService.triggerFeedback(FeedbackType.WRONG_MATCH);

            card1.showWrongMatch();
            card2.showWrongMatch();

            // Wait before flipping back
            await delay(TIMING.WRONG_MATCH_DELAY);

            await Promise.all([card1.flipToBack(), card2.flipToBack()]);
        }

        // Clear flipped cards
        this.flippedCards = [];
    }

    /**
     * Updates the moves display
     */
    private updateMovesDisplay(): void {
        const movesText = this.data.get('movesText') as Phaser.GameObjects.Text | undefined;

        if (movesText !== undefined && this.gameSession !== null) {
            movesText.setText(
                `${this.localizationService.translate('level.moves')}: ${this.gameSession.moves}`
            );
        }
    }



    /**
     * Shows an interstitial ad
     */
    private async showAd(): Promise<void> {
        this.isInputLocked = true;

        // Show loading or overlay if needed
        const overlay = this.add.rectangle(
            GAME_CONFIG.WIDTH / 2,
            GAME_CONFIG.HEIGHT / 2,
            GAME_CONFIG.WIDTH,
            GAME_CONFIG.HEIGHT,
            0x000000,
            0.7
        );
        overlay.setDepth(200);

        const loadingText = this.add.text(
            GAME_CONFIG.WIDTH / 2,
            GAME_CONFIG.HEIGHT / 2,
            'Reklam Yükleniyor...',
            {
                fontSize: '32px',
                color: '#ffffff'
            }
        );
        loadingText.setOrigin(0.5);
        loadingText.setDepth(201);

        try {
            // Show interstitial ad
            // Note: In a real implementation this would wait for the ad to close
            // AdService's showInterstitialAd should ideally return a Promise that resolves when closed
            await this.adService.showInterstitialAd();

            // Artificial delay if ad service is instant/mock
            await delay(1000);

        } catch (error) {
            console.error('Ad failed to show:', error);
        } finally {
            overlay.destroy();
            loadingText.destroy();
            this.isInputLocked = false;
        }
    }

    /**
     * Completes the level
     */
    private async completeLevel(): Promise<void> {
        if (this.currentLevel === null || this.gameSession === null) {
            return;
        }

        // Calculate stars
        const stars = this.levelService.calculateStars(
            this.gameSession.moves,
            this.currentLevel.starThresholds
        );

        // Track analytics
        this.analyticsService.trackEvent(AnalyticsEventType.LEVEL_COMPLETE, {
            levelId: this.currentLevel.id,
            moves: this.gameSession.moves,
            stars,
        });

        // Show Ad before completing level
        await this.showAd();

        // Transition to completion scene
        this.scene.start(SCENE_KEYS.LEVEL_COMPLETE, {
            levelId: this.currentLevel.id,
            categoryId: this.currentLevel.categoryId,
            moves: this.gameSession.moves,
            stars,
        });
    }

    /**
     * Exits to main menu
     */
    private exitToMenu(): void {
        this.scene.start(SCENE_KEYS.CATEGORY_SELECTION);
    }

    /**
     * Cleanup
     */
    public shutdown(): void {
        this.cards = [];
        this.flippedCards = [];
        this.isInputLocked = false;
        this.feedbackService.cleanup();
    }
}
