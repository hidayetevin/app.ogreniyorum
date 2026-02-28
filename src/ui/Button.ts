import { COLORS, Z_INDEX, FONTS } from '@constants/index';
import { AudioService } from '@core/AudioService';
import { HapticFeedback } from '@utils/HapticFeedback';
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
    private background: Phaser.GameObjects.Graphics;
    private label: Phaser.GameObjects.Text;
    private config: IButtonConfig;
    private audioService: AudioService;
    private isPressed: boolean = false;

    constructor(scene: Phaser.Scene, config: IButtonConfig) {
        super(scene, config.x, config.y);

        this.config = config;
        this.audioService = AudioService.getInstance();

        // Create visuals using Graphics for gradients and rounded corners
        this.background = scene.add.graphics();
        this.drawBackground(config.backgroundColor ?? COLORS.PRIMARY);

        // Create text label with modern font
        this.label = scene.add.text(0, 0, config.text, {
            fontSize: `${config.fontSize ?? 26}px`,
            color: config.textColor ?? COLORS.TEXT_LIGHT,
            fontFamily: FONTS.PRIMARY,
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
        const hitArea = new Phaser.Geom.Rectangle(
            -this.config.width / 2,
            -this.config.height / 2,
            this.config.width,
            this.config.height
        );
        this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        this.on('pointerover', () => this.onHoverStart());
        this.on('pointerout', () => this.onHoverEnd());
        this.on('pointerdown', () => this.onPressStart());
        this.on('pointerup', () => this.onPressEnd());
    }

    /**
     * Draws the fancy button background
     */
    private drawBackground(colorHex: string, isPressed: boolean = false): void {
        this.background.clear();
        const width = this.config.width;
        const height = this.config.height;
        const mainColor = Phaser.Display.Color.HexStringToColor(colorHex).color;

        // Darker shade for gradient bottom
        const darkColor = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.HexStringToColor(colorHex),
            Phaser.Display.Color.HexStringToColor('#000000'),
            100,
            20
        ).color;

        // Draw shadow (outer)
        if (!isPressed) {
            this.background.fillStyle(0x000000, 0.2);
            this.background.fillRoundedRect(-width / 2 + 4, -height / 2 + 4, width, height, 16);
        }

        // Draw body with linear gradient (simulated with 2 rects)
        this.background.fillGradientStyle(mainColor, mainColor, darkColor, darkColor, 1);
        this.background.fillRoundedRect(-width / 2, -height / 2, width, height, 16);

        // Inner highlight (top)
        if (!isPressed) {
            this.background.lineStyle(2, 0xffffff, 0.3);
            this.background.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height / 2, { tl: 14, tr: 14, bl: 0, br: 0 });
        }
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
        this.drawBackground(this.config.backgroundColor ?? COLORS.PRIMARY, true);

        // Haptic feedback for mobile
        HapticFeedback.light();

        this.scene.tweens.add({
            targets: this,
            scale: 0.92,
            duration: 80,
            ease: 'Back.easeOut',
        });

        this.audioService.playSound('button-click');
    }

    /**
     * Press end effect and trigger callback
     */
    private onPressEnd(): void {
        if (!this.isPressed) return;
        this.isPressed = false;
        this.drawBackground(this.config.backgroundColor ?? COLORS.PRIMARY, false);

        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 150,
            ease: 'Elastic.easeOut',
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
        this.config.backgroundColor = colorHex;
        this.drawBackground(colorHex, this.isPressed);
    }

    /**
     * Enables or disables the button
     */
    public setEnabled(enabled: boolean): void {
        if (enabled) {
            this.setInteractive();
            this.drawBackground(this.config.backgroundColor ?? COLORS.PRIMARY);
            this.setAlpha(1);
        } else {
            this.disableInteractive();
            this.drawBackground(COLORS.DISABLED);
            this.setAlpha(0.6);
        }
    }
}
