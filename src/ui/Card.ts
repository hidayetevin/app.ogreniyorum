import { CardState } from '../types/models';
import { COLORS, ANIMATION_DURATION, GRID_CONFIG, Z_INDEX } from '@constants/index';
import { FeedbackService } from '@core/FeedbackService';

/**
 * Card component for the memory matching game
 */
export class Card extends Phaser.GameObjects.Container {
    private pairId: string;
    private imagePath: string;
    private cardState: CardState;
    private frontImage: Phaser.GameObjects.Image | null = null;
    private backRect: Phaser.GameObjects.Rectangle;
    private feedbackService: FeedbackService;
    private isFlipping: boolean = false;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        pairId: string,
        imagePath: string,
        size: number = GRID_CONFIG.CARD_WIDTH
    ) {
        super(scene, x, y);

        this.pairId = pairId;
        this.imagePath = imagePath;
        this.cardState = CardState.FACE_DOWN;
        this.feedbackService = FeedbackService.getInstance();

        // Create card back (visible initially)
        this.backRect = scene.add.rectangle(
            0,
            0,
            size,
            size,
            parseInt(COLORS.CARD_BACK.replace('#', ''), 16)
        );

        this.backRect.setStrokeStyle(Math.max(2, size / 30), parseInt(COLORS.PRIMARY.replace('#', ''), 16));

        this.add(this.backRect);

        // Setup interactivity
        this.setupInteractivity();

        // Add to scene
        scene.add.existing(this);
        this.setDepth(Z_INDEX.CARDS);
    }

    /**
     * Sets up interactive behavior
     */
    private setupInteractivity(): void {
        this.backRect.setInteractive({ useHandCursor: true });

        // Hit area for the entire card container should match the rect
        // No need to manually define since we use backRect.setInteractive

        this.backRect.on('pointerover', () => {
            if (this.cardState === CardState.FACE_DOWN && !this.isFlipping) {
                this.onHover();
            }
        });

        this.backRect.on('pointerout', () => {
            if (this.cardState === CardState.FACE_DOWN && !this.isFlipping) {
                this.onHoverEnd();
            }
        });

        // Add click handler
        this.backRect.on('pointerdown', () => {
            this.emit('pointerdown');
        });
    }

    /**
     * Hover effect
     */
    private onHover(): void {
        this.scene.tweens.add({
            targets: this,
            scale: 1.05,
            duration: 100,
            ease: 'Power2',
        });
    }

    /**
     * Hover end effect
     */
    private onHoverEnd(): void {
        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 100,
            ease: 'Power2',
        });
    }

    /**
     * Flips the card to show front
     */
    public async flipToFront(): Promise<void> {
        if (this.cardState !== CardState.FACE_DOWN || this.isFlipping) {
            return;
        }

        this.isFlipping = true;
        this.cardState = CardState.FACE_UP;

        // Load image if not already loaded
        if (this.frontImage === null) {
            this.frontImage = this.scene.add.image(0, 0, this.imagePath);
            const size = this.backRect.width;
            this.frontImage.setDisplaySize(size - (size * 0.1), size - (size * 0.1));
            this.frontImage.setVisible(false);
            this.add(this.frontImage);
        }

        // Flip animation
        await this.playFlipAnimation(true);

        this.isFlipping = false;
    }

    /**
     * Flips the card to show back
     */
    public async flipToBack(): Promise<void> {
        if (this.cardState !== CardState.FACE_UP || this.isFlipping) {
            return;
        }

        this.isFlipping = true;
        this.cardState = CardState.FACE_DOWN;

        await this.playFlipAnimation(false);

        this.isFlipping = false;
    }

    /**
     * Plays the flip animation
     */
    private playFlipAnimation(showFront: boolean): Promise<void> {
        return new Promise((resolve) => {
            // First half: scale down
            this.scene.tweens.add({
                targets: this,
                scaleX: 0,
                duration: ANIMATION_DURATION.CARD_FLIP / 2,
                ease: 'Power2',
                onComplete: () => {
                    // Switch visibility
                    this.backRect.setVisible(!showFront);
                    if (this.frontImage !== null) {
                        this.frontImage.setVisible(showFront);
                    }

                    // Second half: scale up
                    this.scene.tweens.add({
                        targets: this,
                        scaleX: 1,
                        duration: ANIMATION_DURATION.CARD_FLIP / 2,
                        ease: 'Power2',
                        onComplete: () => {
                            resolve();
                        },
                    });
                },
            });
        });
    }

    /**
     * Marks the card as matched
     */
    public setMatched(): void {
        this.cardState = CardState.MATCHED;
        this.backRect.disableInteractive();

        // Glow effect
        this.feedbackService.showGlow(this as unknown as Phaser.GameObjects.GameObject);

        // Fade out slightly
        this.scene.tweens.add({
            targets: this,
            alpha: 0.7,
            duration: ANIMATION_DURATION.CARD_MATCH,
            ease: 'Power2',
        });
    }

    /**
     * Shows wrong match effect
     */
    public showWrongMatch(): void {
        this.feedbackService.showShake(this as unknown as Phaser.GameObjects.GameObject);
    }

    /**
     * Gets the pair ID
     */
    public getPairId(): string {
        return this.pairId;
    }

    /**
     * Gets the current state
     */
    public getState(): CardState {
        return this.cardState;
    }

    /**
     * Checks if card is flipping
     */
    public isCurrentlyFlipping(): boolean {
        return this.isFlipping;
    }

    /**
     * Helper to get image path
     */
    public getImagePath(): string {
        return this.imagePath;
    }

    /**
     * Cleanup - Destroys the card and all its resources
     */
    public override destroy(fromScene?: boolean): void {
        // Remove event listeners
        this.backRect.off('pointerover');
        this.backRect.off('pointerout');
        this.backRect.off('pointerdown');

        // Kill any tweens targeting this card
        this.scene.tweens.killTweensOf(this);

        // Destroy front image if it exists
        if (this.frontImage !== null) {
            this.frontImage.destroy();
            this.frontImage = null;
        }

        // Destroy back rectangle
        this.backRect.destroy();

        // Call parent destroy
        super.destroy(fromScene);
    }
}
