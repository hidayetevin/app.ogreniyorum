import { COLORS, Z_INDEX, FONTS } from '@constants/index';
import { LocalizationService } from '@core/LocalizationService';

/**
 * StatsPanel displays game statistics in a premium, visual format
 */
export class StatsPanel extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Graphics;
    private statsTexts: Phaser.GameObjects.Text[] = [];

    constructor(scene: Phaser.Scene, x: number, y: number, width: number = 420) {
        super(scene, x, y);

        // Background (Glassy Plate)
        this.background = scene.add.graphics();
        // Shadow
        this.background.fillStyle(0x000000, 0.4);
        this.background.fillRoundedRect(5, 5, width, 180, 20);
        // Body
        this.background.fillStyle(0x1A1A2E, 0.9);
        this.background.fillRoundedRect(0, 0, width, 180, 20);
        // Stroke
        this.background.lineStyle(2, 0xffffff, 0.15);
        this.background.strokeRoundedRect(0, 0, width, 180, 20);
        this.add(this.background);

        this.setDepth(Z_INDEX.UI);
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
        this.statsTexts.forEach(text => text.destroy());
        this.statsTexts = [];

        const padding = 25;
        const lineHeight = 40;
        let yOffset = padding;

        const textStyle = {
            fontSize: '20px',
            color: COLORS.TEXT_LIGHT,
            fontFamily: FONTS.SECONDARY,
            fontStyle: '600'
        };

        const t = LocalizationService.getInstance();

        // Stars
        const starsText = this.scene.add.text(
            padding,
            yOffset,
            `⭐ ${t.translate('stats.panel.stars', { current: stats.totalStars.toString(), total: stats.maxStars.toString() })}`,
            {
                ...textStyle,
                fontSize: '22px',
                color: COLORS.WARNING,
                fontFamily: FONTS.PRIMARY,
                fontStyle: '800'
            }
        );
        this.add(starsText);
        this.statsTexts.push(starsText);
        yOffset += lineHeight;

        // Levels completed
        const levelsText = this.scene.add.text(
            padding,
            yOffset,
            `🎯 ${t.translate('stats.panel.levels', { current: stats.levelsCompleted.toString(), total: stats.totalLevels.toString() })}`,
            textStyle
        );
        this.add(levelsText);
        this.statsTexts.push(levelsText);
        yOffset += lineHeight;

        // Categories unlocked
        const categoriesText = this.scene.add.text(
            padding,
            yOffset,
            `📚 ${t.translate('stats.panel.categories', { current: stats.categoriesUnlocked.toString(), total: stats.totalCategories.toString() })}`,
            textStyle
        );
        this.add(categoriesText);
        this.statsTexts.push(categoriesText);
        yOffset += lineHeight;

        // Streak
        if (stats.currentStreak > 0) {
            const streakText = this.scene.add.text(
                padding,
                yOffset,
                `🔥 ${t.translate('stats.panel.streak', { days: stats.currentStreak.toString() })}`,
                {
                    ...textStyle,
                    color: COLORS.ACCENT,
                    fontStyle: '800'
                }
            );
            this.add(streakText);
            this.statsTexts.push(streakText);

            this.scene.tweens.add({
                targets: streakText,
                scale: 1.05,
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }
    }

    public show(): void {
        this.setAlpha(0);
        this.setScale(0.95);
        this.setVisible(true);

        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            scale: 1,
            duration: 400,
            ease: 'Cubic.easeOut',
        });
    }

    public hide(): void {
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0.95,
            duration: 300,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                this.setVisible(false);
            },
        });
    }

    public override destroy(fromScene?: boolean): void {
        this.background.destroy();
        this.statsTexts.forEach(text => text.destroy());
        super.destroy(fromScene);
    }
}
