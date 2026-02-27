import { COLORS, FONTS } from '@constants/index';

/**
 * ProgressBar component for displaying progress with animated fill
 */
export class ProgressBar extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Graphics;
    private fill: Phaser.GameObjects.Graphics;
    private percentText: Phaser.GameObjects.Text;
    private barWidth: number;
    private barHeight: number;
    private currentProgress: number = 0;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        width: number = 400,
        height: number = 30
    ) {
        super(scene, x, y);

        this.barWidth = width;
        this.barHeight = height;

        // Background (Glassy)
        this.background = scene.add.graphics();
        this.background.fillStyle(0x000000, 0.3);
        this.background.fillRoundedRect(0, 0, width, height, 15);
        this.background.lineStyle(2, 0xffffff, 0.1);
        this.background.strokeRoundedRect(0, 0, width, height, 15);
        this.add(this.background);

        // Fill
        this.fill = scene.add.graphics();
        this.add(this.fill);

        // Glassy Highlight
        const highlight = scene.add.graphics();
        highlight.fillStyle(0xffffff, 0.05);
        highlight.fillRoundedRect(2, 2, width - 4, height / 2 - 2, { tl: 10, tr: 10, bl: 0, br: 0 });
        this.add(highlight);

        // Percentage text
        this.percentText = scene.add.text(width / 2, height / 2, '0%', {
            fontSize: '18px',
            color: COLORS.TEXT_LIGHT,
            fontFamily: FONTS.PRIMARY,
            fontStyle: '800',
        });
        this.percentText.setOrigin(0.5);
        this.add(this.percentText);

        scene.add.existing(this);
    }

    /**
     * Updates the progress bar with animation
     */
    public updateProgress(current: number, max: number, animate: boolean = true): void {
        const percentage = Math.min(100, Math.max(0, (current / max) * 100));

        if (animate) {
            this.scene.tweens.add({
                targets: this,
                currentProgress: percentage,
                duration: 800,
                ease: 'Cubic.easeOut',
                onUpdate: () => this.redrawFill(),
            });
        } else {
            this.currentProgress = percentage;
            this.redrawFill();
        }
    }

    /**
     * Redraws the fill based on current progress
     */
    private redrawFill(): void {
        const fillWidth = (this.barWidth * this.currentProgress) / 100;
        const percentage = Math.round(this.currentProgress);

        this.fill.clear();

        // Theme colors
        let color = Phaser.Display.Color.HexStringToColor(COLORS.PRIMARY).color;
        if (percentage >= 100) {
            color = Phaser.Display.Color.HexStringToColor(COLORS.SUCCESS).color;
        } else if (percentage >= 75) {
            color = Phaser.Display.Color.HexStringToColor(COLORS.SECONDARY).color;
        } else if (percentage >= 50) {
            color = Phaser.Display.Color.HexStringToColor(COLORS.WARNING).color;
        }

        this.fill.fillStyle(color, 1);
        if (fillWidth > 0) {
            this.fill.fillRoundedRect(0, 0, fillWidth, this.barHeight, 15);
        }

        this.percentText.setText(`${percentage}%`);
    }

    /**
     * Sets progress without animation
     */
    public setProgress(current: number, max: number): void {
        this.updateProgress(current, max, false);
    }

    /**
     * Gets current progress percentage
     */
    public getProgress(): number {
        return this.currentProgress;
    }

    /**
     * Cleanup
     */
    public override destroy(fromScene?: boolean): void {
        this.background.destroy();
        this.fill.destroy();
        super.destroy(fromScene);
    }
}
