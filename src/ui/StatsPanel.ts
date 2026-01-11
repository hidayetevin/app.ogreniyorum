import { COLORS, Z_INDEX } from '@constants/index';

/**
 * StatsPanel displays game statistics in a compact, visual format
 */
export class StatsPanel extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Graphics;
    private statsTexts: Phaser.GameObjects.Text[] = [];

    constructor(scene: Phaser.Scene, x: number, y: number, width: number = 400) {
        super(scene, x, y);

        // Background with rounded corners
        this.background = scene.add.graphics();
        this.background.fillStyle(parseInt(COLORS.CARD_BACK.replace('#', ''), 16), 0.9);
        this.background.fillRoundedRect(0, 0, width, 160, 12);
        this.background.lineStyle(3, parseInt(COLORS.PRIMARY.replace('#', ''), 16), 1);
        this.background.strokeRoundedRect(0, 0, width, 160, 12);
        this.add(this.background);

        this.setDepth(Z_INDEX.UI);

        // Add to scene
        scene.add.existing(this);
    }

    /**
     * Updates the stats panel with current progress data
     */
    public updateStats(stats: {
        totalStars: number;
        maxStars: number;
        levelsCompleted: number;
        totalLevels: number;
        categoriesUnlocked: number;
        totalCategories: number;
        currentStreak: number;
    }): void {
        // Clear existing texts
        this.statsTexts.forEach(text => text.destroy());
        this.statsTexts = [];

        const padding = 20;
        const lineHeight = 35;
        let yOffset = padding;

        // Stars
        const starsText = this.scene.add.text(
            padding,
            yOffset,
            `⭐ ${stats.totalStars} / ${stats.maxStars} Yıldız`,
            {
                fontSize: '20px',
                color: COLORS.WARNING,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
            }
        );
        this.add(starsText);
        this.statsTexts.push(starsText);
        yOffset += lineHeight;

        // Levels completed
        const levelsText = this.scene.add.text(
            padding,
            yOffset,
            `🎯 ${stats.levelsCompleted} / ${stats.totalLevels} Seviye Tamamlandı`,
            {
                fontSize: '18px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: 'Arial, sans-serif',
            }
        );
        this.add(levelsText);
        this.statsTexts.push(levelsText);
        yOffset += lineHeight;

        // Categories unlocked
        const categoriesText = this.scene.add.text(
            padding,
            yOffset,
            `📚 ${stats.categoriesUnlocked} / ${stats.totalCategories} Kategori Açıldı`,
            {
                fontSize: '18px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: 'Arial, sans-serif',
            }
        );
        this.add(categoriesText);
        this.statsTexts.push(categoriesText);
        yOffset += lineHeight;

        // Streak
        if (stats.currentStreak > 0) {
            const streakText = this.scene.add.text(
                padding,
                yOffset,
                `🔥 ${stats.currentStreak} Günlük Seri`,
                {
                    fontSize: '18px',
                    color: COLORS.ACCENT,
                    fontFamily: 'Arial, sans-serif',
                    fontStyle: 'bold',
                }
            );
            this.add(streakText);
            this.statsTexts.push(streakText);

            // Pulsing animation for streak
            this.scene.tweens.add({
                targets: streakText,
                scale: 1.1,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }
    }

    /**
     * Shows the panel with slide-in animation
     */
    public show(): void {
        this.setAlpha(0);
        this.setVisible(true);

        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            y: this.y + 20,
            duration: 400,
            ease: 'Back.out',
        });
    }

    /**
     * Hides the panel with slide-out animation
     */
    public hide(): void {
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            y: this.y - 20,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.setVisible(false);
            },
        });
    }

    /**
     * Cleanup
     */
    public override destroy(fromScene?: boolean): void {
        this.background.destroy();
        this.statsTexts.forEach(text => text.destroy());
        super.destroy(fromScene);
    }
}
