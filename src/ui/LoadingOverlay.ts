import { GAME_CONFIG, COLORS, Z_INDEX, FONTS } from '@constants/index';
import { LocalizationService } from '@core/LocalizationService';

/**
 * LoadingOverlay displays a premium progress bar during asset loading
 */
export class LoadingOverlay extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Graphics;
    private progressBarBg: Phaser.GameObjects.Graphics;
    private progressBar: Phaser.GameObjects.Graphics;
    private loadingText: Phaser.GameObjects.Text;
    private percentText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        // Premium Background (Deep Space Fade)
        this.background = scene.add.graphics();
        this.background.fillGradientStyle(
            0x0F0F1A, 0x0F0F1A, 0x1A1A2E, 0x1A1A2E, 0.95
        );
        this.background.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
        this.add(this.background);

        const centerX = GAME_CONFIG.WIDTH / 2;
        const centerY = GAME_CONFIG.HEIGHT / 2;

        // Loading text with Outfit font
        const t = LocalizationService.getInstance();
        this.loadingText = scene.add.text(
            centerX,
            centerY - 80,
            t.translate('common.loading'),
            {
                fontSize: '42px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: FONTS.PRIMARY,
                fontStyle: '800',
            }
        );
        this.loadingText.setOrigin(0.5);
        this.add(this.loadingText);

        // Add pulse animation
        scene.tweens.add({
            targets: this.loadingText,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Progress bar container (Glassy)
        const barWidth = 450;
        const barHeight = 25;
        const barX = centerX - barWidth / 2;
        const barY = centerY;

        this.progressBarBg = scene.add.graphics();
        this.progressBarBg.fillStyle(0xffffff, 0.05);
        this.progressBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 12);
        this.progressBarBg.lineStyle(2, 0xffffff, 0.1);
        this.progressBarBg.strokeRoundedRect(barX, barY, barWidth, barHeight, 12);
        this.add(this.progressBarBg);

        // Progress bar (Primary Gradient)
        this.progressBar = scene.add.graphics();
        this.add(this.progressBar);

        // Percentage text
        this.percentText = scene.add.text(
            centerX,
            centerY + 60,
            '0%',
            {
                fontSize: '28px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: FONTS.SECONDARY,
                fontStyle: 'bold'
            }
        );
        this.percentText.setOrigin(0.5);
        this.add(this.percentText);

        // Set depth
        this.setDepth(Z_INDEX.OVERLAY);
        this.setVisible(false);
        scene.add.existing(this);
    }

    /**
     * Updates the progress bar
     */
    public updateProgress(progress: number): void {
        const barWidth = 450;
        const barHeight = 25;
        const centerX = GAME_CONFIG.WIDTH / 2;
        const centerY = GAME_CONFIG.HEIGHT / 2;
        const barX = centerX - barWidth / 2;
        const barY = centerY;

        const clampedProgress = Math.max(0, Math.min(1, progress));

        this.progressBar.clear();
        if (clampedProgress > 0) {
            this.progressBar.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.PRIMARY).color, 1);
            this.progressBar.fillRoundedRect(barX, barY, barWidth * clampedProgress, barHeight, 12);

            // Inner highlight
            this.progressBar.fillStyle(0xffffff, 0.15);
            this.progressBar.fillRoundedRect(barX, barY, barWidth * clampedProgress, barHeight / 2, { tl: 12, tr: 12, bl: 0, br: 0 });
        }

        this.percentText.setText(`${Math.round(clampedProgress * 100)}%`);
    }

    public show(): void {
        this.setVisible(true);
        this.updateProgress(0);
    }

    public hide(): void {
        this.setVisible(false);
    }

    public override destroy(fromScene?: boolean): void {
        this.progressBar.destroy();
        this.progressBarBg.destroy();
        super.destroy(fromScene);
    }
}
