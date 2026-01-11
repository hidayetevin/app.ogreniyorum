import { COLORS } from '@constants/index';

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

        // Background
        this.background = scene.add.graphics();
        this.background.fillStyle(0x222222, 0.8);
        this.background.fillRoundedRect(0, 0, width, height, 8);
        this.add(this.background);

        // Fill
        this.fill = scene.add.graphics();
        this.add(this.fill);

        // Percentage text
        this.percentText = scene.add.text(width / 2, height / 2, '0%', {
            fontSize: '18px',
            color: COLORS.TEXT_LIGHT,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
        });
        this.percentText.setOrigin(0.5);
        this.add(this.percentText);

        // Add to scene
        scene.add.existing(this);
    }

    /**
     * Updates the progress bar with animation
     */
    public updateProgress(current: number, max: number, animate: boolean = true): void {
        const percentage = Math.min(100, Math.max(0, (current / max) * 100));

        if (animate) {
            // Animate from current to new value
            this.scene.tweens.add({
                targets: this,
                currentProgress: percentage,
                duration: 800,
                ease: 'Power2',
                onUpdate: () => {
                    this.redrawFill();
                },
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

        // Clear and redraw fill
        this.fill.clear();

        // Gradient color based on progress
        let color = 0x3498db; // Blue
        if (percentage >= 100) {
            color = 0x2ecc71; // Green
        } else if (percentage >= 75) {
            color = 0x27ae60; // Dark green
        } else if (percentage >= 50) {
            color = 0xf39c12; // Orange
        }

        this.fill.fillStyle(color, 1);
        this.fill.fillRoundedRect(0, 0, fillWidth, this.barHeight, 8);

        // Update text
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
