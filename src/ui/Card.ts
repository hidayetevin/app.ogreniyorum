import { CardState } from '../types/models';
import { COLORS, ANIMATION_DURATION, GRID_CONFIG, Z_INDEX, FONTS } from '@constants/index';
import { FeedbackService } from '@core/FeedbackService';

/**
 * Card component for the memory matching game
 */
export class Card extends Phaser.GameObjects.Container {
    private pairId: string;
    private imagePath: string;
    private cardState: CardState;
    private frontImage: Phaser.GameObjects.Image | null = null;
    private visuals: Phaser.GameObjects.Graphics;
    private backImage: Phaser.GameObjects.Image | null = null;
    private feedbackService: FeedbackService;
    private label: string;
    private textObj: Phaser.GameObjects.Text | null = null;
    private isFlipping: boolean = false;
    private cardSize: number;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        pairId: string,
        imagePath: string,
        label: string,
        size: number = GRID_CONFIG.CARD_WIDTH,
        cardBackKey: string = 'card-back-default'
    ) {
        super(scene, x, y);

        this.pairId = pairId;
        this.imagePath = imagePath;
        this.label = label;
        this.cardSize = size;
        this.cardState = CardState.FACE_DOWN;
        this.feedbackService = FeedbackService.getInstance();

        // Create high-fidelity visuals
        this.visuals = scene.add.graphics();
        this.drawCardBack();
        this.add(this.visuals);

        // Create card back image
        try {
            this.backImage = scene.add.image(0, 0, cardBackKey);
            this.backImage.setDisplaySize(size * 0.8, size * 0.8);
            this.add(this.backImage);
        } catch (e) {
            console.error(`Error loading card back image: ${cardBackKey}`, e);
        }

        // Setup interactivity
        this.setupInteractivity();

        // Front components (pre-rendered)
        this.frontImage = scene.add.image(0, -10, this.imagePath);
        this.frontImage.setDisplaySize(size - 40, size - 40);
        this.frontImage.setVisible(false);
        this.add(this.frontImage);

        // Modern glassy label
        const textBg = scene.add.graphics();
        textBg.fillStyle(0xffffff, 0.9);
        textBg.fillRoundedRect(-size / 2 + 10, size / 2 - 45, size - 20, 35, 10);
        textBg.setVisible(false);

        this.textObj = scene.add.text(0, size / 2 - 28, this.label, {
            fontSize: '18px',
            color: '#2C3E50',
            fontFamily: FONTS.PRIMARY,
            fontStyle: '800',
            align: 'center',
            wordWrap: { width: size - 30 }
        });
        this.textObj.setOrigin(0.5);
        this.textObj.setVisible(false);

        this.textObj.setData('bg', textBg);
        this.add(textBg);
        this.add(this.textObj);

        scene.add.existing(this);
        this.setDepth(Z_INDEX.CARDS);
    }

    private setupInteractivity(): void {
        const hitArea = new Phaser.Geom.Rectangle(-this.cardSize / 2, -this.cardSize / 2, this.cardSize, this.cardSize);
        this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        if (this.input) this.input.cursor = 'pointer';

        this.on('pointerover', () => {
            if (this.cardState === CardState.FACE_DOWN && !this.isFlipping) {
                this.onHover();
            }
        });

        this.on('pointerout', () => {
            if (this.cardState === CardState.FACE_DOWN && !this.isFlipping) {
                this.onHoverEnd();
            }
        });
    }

    private drawCardBack(): void {
        this.visuals.clear();
        // Shadow
        this.visuals.fillStyle(0x000000, 0.2);
        this.visuals.fillRoundedRect(-this.cardSize / 2 + 5, -this.cardSize / 2 + 5, this.cardSize, this.cardSize, 15);
        // Stroke
        this.visuals.lineStyle(4, Phaser.Display.Color.HexStringToColor(COLORS.PRIMARY).color, 1);
        this.visuals.strokeRoundedRect(-this.cardSize / 2, -this.cardSize / 2, this.cardSize, this.cardSize, 15);
        // Body
        this.visuals.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.CARD_BACK).color);
        this.visuals.fillRoundedRect(-this.cardSize / 2, -this.cardSize / 2, this.cardSize, this.cardSize, 15);
    }

    private drawCardFront(): void {
        this.visuals.clear();
        // Shadow
        this.visuals.fillStyle(0x000000, 0.2);
        this.visuals.fillRoundedRect(-this.cardSize / 2 + 5, -this.cardSize / 2 + 5, this.cardSize, this.cardSize, 15);
        // Body
        this.visuals.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.CARD_FRONT).color);
        this.visuals.fillRoundedRect(-this.cardSize / 2, -this.cardSize / 2, this.cardSize, this.cardSize, 15);
        // Inner highlight
        this.visuals.fillStyle(0xffffff, 0.1);
        this.visuals.fillRoundedRect(-this.cardSize / 2 + 5, -this.cardSize / 2 + 5, this.cardSize - 10, this.cardSize / 2, { tl: 10, tr: 10, bl: 0, br: 0 });
    }

    private onHover(): void {
        if (!this.scene || !this.scene.tweens) return;
        this.scene.tweens.add({
            targets: this,
            scale: 1.05,
            duration: 150,
            ease: 'Cubic.easeOut',
        });
    }

    private onHoverEnd(): void {
        if (!this.scene || !this.scene.tweens) return;
        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 150,
            ease: 'Cubic.easeOut',
        });
    }

    public async flipToFront(): Promise<void> {
        if (this.cardState !== CardState.FACE_DOWN || this.isFlipping) return;
        this.isFlipping = true;
        this.cardState = CardState.FACE_UP;
        await this.playFlipAnimation(true);
        this.isFlipping = false;
    }

    public async flipToBack(): Promise<void> {
        if (this.cardState !== CardState.FACE_UP || this.isFlipping) return;
        this.isFlipping = true;
        this.cardState = CardState.FACE_DOWN;
        await this.playFlipAnimation(false);
        this.isFlipping = false;
    }

    private playFlipAnimation(showFront: boolean): Promise<void> {
        return new Promise((resolve) => {
            if (!this.scene || !this.scene.tweens) {
                resolve();
                return;
            }

            this.scene.tweens.add({
                targets: this,
                scaleX: 0,
                duration: ANIMATION_DURATION.CARD_FLIP / 2,
                ease: 'Cubic.easeIn',
                onComplete: () => {
                    if (showFront) this.drawCardFront();
                    else this.drawCardBack();

                    if (this.backImage) this.backImage.setVisible(!showFront);
                    if (this.frontImage) this.frontImage.setVisible(showFront);
                    if (this.textObj) {
                        this.textObj.setVisible(showFront);
                        const bg = this.textObj.getData('bg') as Phaser.GameObjects.Graphics;
                        if (bg) bg.setVisible(showFront);
                    }

                    this.scene.tweens.add({
                        targets: this,
                        scaleX: 1,
                        duration: ANIMATION_DURATION.CARD_FLIP / 2,
                        ease: 'Back.easeOut',
                        onComplete: () => resolve(),
                    });
                },
            });
        });
    }

    public setMatched(): void {
        this.cardState = CardState.MATCHED;
        this.disableInteractive();
        this.feedbackService.showGlow(this);
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.add({
                targets: this,
                alpha: 0.8,
                duration: ANIMATION_DURATION.CARD_MATCH,
                ease: 'Power2',
            });
        }
    }

    public showWrongMatch(): void {
        this.feedbackService.showShake(this);
    }

    public getPairId(): string { return this.pairId; }
    public getState(): CardState { return this.cardState; }
    public isCurrentlyFlipping(): boolean { return this.isFlipping; }
    public getImagePath(): string { return this.imagePath; }

    public override destroy(fromScene?: boolean): void {
        this.off('pointerover');
        this.off('pointerout');
        this.off('pointerdown');
        if (this.scene && this.scene.tweens) this.scene.tweens.killTweensOf(this);
        if (this.frontImage) this.frontImage.destroy();
        if (this.textObj) {
            const bg = this.textObj.getData('bg') as Phaser.GameObjects.Graphics;
            if (bg) bg.destroy();
            this.textObj.destroy();
        }
        if (this.visuals) this.visuals.destroy();
        if (this.backImage) this.backImage.destroy();
        super.destroy(fromScene);
    }
}
