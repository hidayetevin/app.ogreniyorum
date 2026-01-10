import { COLORS, ACCESSIBILITY, Z_INDEX, ANIMATION_DURATION } from '@constants/index';
import { AudioService } from '@core/AudioService';

/**
 * Button configuration interface
 */
export interface IButtonConfig {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    onClick?: () => void;
}

/**
 * Reusable Button component for Phaser
 * Follows accessibility guidelines with proper touch targets
 */
export class Button extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private label: Phaser.GameObjects.Text;
    private config: IButtonConfig;
    private audioService: AudioService;
    private isPressed: boolean = false;

    constructor(scene: Phaser.Scene, config: IButtonConfig) {
        super(scene, config.x, config.y);

        this.config = config;
        this.audioService = AudioService.getInstance();

        // Create background
        this.background = scene.add.rectangle(
            0,
            0,
            Math.max(config.width, ACCESSIBILITY.MIN_TOUCH_SIZE),
            Math.max(config.height, ACCESSIBILITY.MIN_TOUCH_SIZE),
            parseInt((config.backgroundColor ?? COLORS.PRIMARY).replace('#', ''), 16)
        );

        // Create text label
        this.label = scene.add.text(0, 0, config.text, {
            fontSize: `${config.fontSize ?? 24}px`,
            color: config.textColor ?? COLORS.TEXT_LIGHT,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
        });

        this.label.setOrigin(0.5);

        // Add to container
        this.add(this.background);
        this.add(this.label);

        // Setup interactivity
        this.setupInteractivity();

        // Add to scene
        scene.add.existing(this);
        this.setDepth(Z_INDEX.UI);
    }

    /**
     * Sets up interactive behavior
     */
    private setupInteractivity(): void {
        this.background.setInteractive({ useHandCursor: true });

        // Hover effects
        this.background.on('pointerover', () => {
            this.onHoverStart();
        });

        this.background.on('pointerout', () => {
            this.onHoverEnd();
        });

        // Click effects
        this.background.on('pointerdown', () => {
            this.onPressStart();
        });

        this.background.on('pointerup', () => {
            this.onPressEnd();
        });
    }

    /**
     * Hover start effect
     */
    private onHoverStart(): void {
        if (this.isPressed) {
            return;
        }

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
        if (this.isPressed) {
            return;
        }

        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 100,
            ease: 'Power2',
        });
    }

    /**
     * Press start effect
     */
    private onPressStart(): void {
        this.isPressed = true;

        this.scene.tweens.add({
            targets: this,
            scale: 0.95,
            duration: ANIMATION_DURATION.BUTTON_PRESS,
            ease: 'Power2',
        });

        this.audioService.playSound('button-click');
    }

    /**
     * Press end effect and trigger callback
     */
    private onPressEnd(): void {
        this.isPressed = false;

        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: ANIMATION_DURATION.BUTTON_PRESS,
            ease: 'Power2',
            onComplete: () => {
                this.config.onClick?.();
            },
        });
    }

    /**
     * Updates button text
     */
    public setText(text: string): void {
        this.label.setText(text);
    }

    /**
     * Set background color dynamically
     */
    public setBackgroundColor(colorHex: string): void {
        this.background.setFillStyle(parseInt(colorHex.replace('#', ''), 16));
    }

    /**
     * Enables or disables the button
     */
    public setEnabled(enabled: boolean): void {
        if (enabled) {
            this.background.setInteractive({ useHandCursor: true });
            this.background.setFillStyle(
                parseInt((this.config.backgroundColor ?? COLORS.PRIMARY).replace('#', ''), 16)
            );
            this.setAlpha(1);
        } else {
            this.background.disableInteractive();
            this.background.setFillStyle(parseInt(COLORS.DISABLED.replace('#', ''), 16));
            this.setAlpha(0.6);
        }
    }
}
