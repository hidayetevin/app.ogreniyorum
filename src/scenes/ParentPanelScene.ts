import { Scene } from 'phaser';
import { SCENE_KEYS, GAME_CONFIG, COLORS } from '@constants/index';
import { Button } from '@ui/Button';
import { StorageService } from '@core/StorageService';
import { LevelService } from '@core/LevelService';
import { AchievementService } from '@core/AchievementService';
import { AdService } from '@core/AdService';

/**
 * ParentPanelScene displays statistics and allows progress management
 */
export class ParentPanelScene extends Scene {
    private storageService: StorageService;
    private levelService: LevelService;
    private achievementService: AchievementService;
    private adService: AdService;

    constructor() {
        super({ key: SCENE_KEYS.PARENT_PANEL });
        this.storageService = StorageService.getInstance();
        this.levelService = LevelService.getInstance();
        this.achievementService = AchievementService.getInstance();
        this.adService = AdService.getInstance();
    }

    /**
     * Creates the parent panel UI
     */
    public create(): void {
        const centerX = GAME_CONFIG.WIDTH / 2;
        const centerY = GAME_CONFIG.HEIGHT / 2;

        // Background
        this.cameras.main.setBackgroundColor(GAME_CONFIG.BACKGROUND_COLOR);

        // Show banner ad via AdMob
        void this.adService.showBanner();

        // Title
        const title = this.add.text(
            centerX,
            100,
            '📊 EBEVEYİN PANELİ',
            {
                fontSize: '48px',
                color: COLORS.WARNING,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
            }
        );
        title.setOrigin(0.5);

        // Get statistics
        const progress = this.storageService.loadProgress();
        const categories = this.levelService.getCategories();
        const achievementProgress = this.achievementService.getProgress();

        // Calculate total possible stars
        let totalPossibleStars = 0;
        categories.forEach(category => {
            totalPossibleStars += category.levels.length * 3;
        });

        // Statistics panel
        this.createStatsPanel(centerX, centerY - 200, {
            totalStars: progress.totalStars,
            maxStars: totalPossibleStars,
            levelsCompleted: progress.levelsCompleted,
            totalLevels: categories.reduce((sum, cat) => sum + cat.levels.length, 0),
            categoriesUnlocked: progress.unlockedCategories.length,
            totalCategories: categories.length,
            currentStreak: progress.currentStreak,
            playTime: this.storageService.getFormattedPlayTime(),
            achievementsUnlocked: achievementProgress.unlockedAchievements.length,
            totalAchievements: this.achievementService.getAllAchievements().length,
        });

        // Category performance (moved down)
        this.createCategoryPerformance(centerX, centerY + 150, categories, progress);

        // Reset button
        new Button(this, {
            x: centerX,
            y: GAME_CONFIG.HEIGHT - 200,
            width: 350,
            height: 70,
            text: '🗑️ İlerlemeyi Sıfırla',
            backgroundColor: COLORS.ACCENT,
            fontSize: 24,
            onClick: () => {
                this.confirmReset();
            },
        });

        // Back button
        new Button(this, {
            x: centerX,
            y: GAME_CONFIG.HEIGHT - 110,
            width: 350,
            height: 70,
            text: '← Ana Menü',
            backgroundColor: COLORS.SECONDARY,
            fontSize: 24,
            onClick: () => {
                this.scene.start(SCENE_KEYS.MAIN_MENU);
            },
        });
    }

    /**
     * Creates statistics panel
     */
    private createStatsPanel(x: number, y: number, stats: {
        totalStars: number;
        maxStars: number;
        levelsCompleted: number;
        totalLevels: number;
        categoriesUnlocked: number;
        totalCategories: number;
        currentStreak: number;
        playTime: string;
        achievementsUnlocked: number;
        totalAchievements: number;
    }): void {
        const panelWidth = 600;
        const panelHeight = 280;

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(parseInt(COLORS.CARD_BACK.replace('#', ''), 16), 0.9);
        bg.fillRoundedRect(x - panelWidth / 2, y, panelWidth, panelHeight, 12);
        bg.lineStyle(3, parseInt(COLORS.PRIMARY.replace('#', ''), 16), 1);
        bg.strokeRoundedRect(x - panelWidth / 2, y, panelWidth, panelHeight, 12);

        const padding = 30;
        const lineHeight = 40;
        let yOffset = y + padding;

        // Stats
        const statsData = [
            { icon: '⭐', text: `Yıldızlar: ${stats.totalStars} / ${stats.maxStars}` },
            { icon: '🎯', text: `Seviyeler: ${stats.levelsCompleted} / ${stats.totalLevels}` },
            { icon: '📚', text: `Kategoriler: ${stats.categoriesUnlocked} / ${stats.totalCategories}` },
            { icon: '🏆', text: `Başarılar: ${stats.achievementsUnlocked} / ${stats.totalAchievements}` },
            { icon: '🔥', text: `Seri: ${stats.currentStreak} gün` },
            { icon: '⏱️', text: `Toplam Süre: ${stats.playTime}` },
        ];

        statsData.forEach(stat => {
            this.add.text(
                x - panelWidth / 2 + padding,
                yOffset,
                `${stat.icon} ${stat.text}`,
                {
                    fontSize: '22px',
                    color: COLORS.TEXT_LIGHT,
                    fontFamily: 'Arial, sans-serif',
                }
            );
            yOffset += lineHeight;
        });
    }

    /**
     * Creates category performance display
     */
    private createCategoryPerformance(x: number, y: number, categories: any[], progress: any): void {
        const panelWidth = 600;
        const titleHeight = 50;

        // Title
        const titleText = this.add.text(
            x,
            y - 20,
            'Kategori Performansı',
            {
                fontSize: '24px',
                color: COLORS.WARNING,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
            }
        );
        titleText.setOrigin(0.5);

        let yOffset = y + titleHeight;

        // Show top 3 categories
        categories.slice(0, 3).forEach(category => {
            const categoryProgress = category.levels.filter((level: any) => {
                const levelProg = progress.levelProgress[level.id];
                return levelProg && levelProg.completed;
            }).length;

            const percentage = (categoryProgress / category.levels.length) * 100;

            // Category name
            this.add.text(
                x - panelWidth / 2 + 30,
                yOffset,
                category.name,
                {
                    fontSize: '18px',
                    color: COLORS.TEXT_LIGHT,
                    fontFamily: 'Arial, sans-serif',
                }
            );

            // Progress bar
            const barWidth = 300;
            const barHeight = 20;
            const barX = x - panelWidth / 2 + 200;

            const barBg = this.add.graphics();
            barBg.fillStyle(0x222222, 0.8);
            barBg.fillRoundedRect(barX, yOffset, barWidth, barHeight, 4);

            const barFill = this.add.graphics();
            const fillColor = percentage >= 100 ? 0x2ecc71 : percentage >= 50 ? 0xf39c12 : 0x3498db;
            barFill.fillStyle(fillColor, 1);
            barFill.fillRoundedRect(barX, yOffset, (barWidth * percentage) / 100, barHeight, 4);

            // Percentage text
            const percentText = this.add.text(
                barX + barWidth + 20,
                yOffset + barHeight / 2,
                `${Math.round(percentage)}%`,
                {
                    fontSize: '16px',
                    color: COLORS.TEXT_LIGHT,
                    fontFamily: 'Arial, sans-serif',
                }
            );
            percentText.setOrigin(0, 0.5);

            yOffset += 45;
        });
    }

    /**
     * Confirms progress reset
     */
    private confirmReset(): void {
        // Create confirmation dialog
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
        overlay.setDepth(100);

        const panelWidth = 500;
        const panelHeight = 250;
        const panelX = (GAME_CONFIG.WIDTH - panelWidth) / 2;
        const panelY = (GAME_CONFIG.HEIGHT - panelHeight) / 2;

        const panel = this.add.graphics();
        panel.fillStyle(parseInt(COLORS.CARD_BACK.replace('#', ''), 16), 1);
        panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);
        panel.setDepth(101);

        const warningText = this.add.text(
            GAME_CONFIG.WIDTH / 2,
            panelY + 60,
            '⚠️ UYARI',
            {
                fontSize: '32px',
                color: COLORS.ACCENT,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
            }
        );
        warningText.setOrigin(0.5);
        warningText.setDepth(102);

        const confirmText = this.add.text(
            GAME_CONFIG.WIDTH / 2,
            panelY + 120,
            'Tüm ilerleme silinecek.\nEmin misiniz?',
            {
                fontSize: '20px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: 'Arial, sans-serif',
                align: 'center',
            }
        );
        confirmText.setOrigin(0.5);
        confirmText.setDepth(102);

        // Yes button
        new Button(this, {
            x: GAME_CONFIG.WIDTH / 2 - 100,
            y: panelY + 190,
            width: 120,
            height: 50,
            text: 'Evet',
            backgroundColor: COLORS.ACCENT,
            fontSize: 20,
            onClick: () => {
                this.resetProgress();
                overlay.destroy();
                panel.destroy();
                warningText.destroy();
                confirmText.destroy();
            },
        }).setDepth(102);

        // No button
        new Button(this, {
            x: GAME_CONFIG.WIDTH / 2 + 100,
            y: panelY + 190,
            width: 120,
            height: 50,
            text: 'Hayır',
            backgroundColor: COLORS.SECONDARY,
            fontSize: 20,
            onClick: () => {
                overlay.destroy();
                panel.destroy();
                warningText.destroy();
                confirmText.destroy();
            },
        }).setDepth(102);
    }

    /**
     * Resets all progress
     */
    private resetProgress(): void {
        this.storageService.clearAllData();
        this.achievementService.resetAll();

        // Show success message
        const successText = this.add.text(
            GAME_CONFIG.WIDTH / 2,
            GAME_CONFIG.HEIGHT / 2,
            '✅ İlerleme Sıfırlandı',
            {
                fontSize: '32px',
                color: COLORS.SUCCESS,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
            }
        );
        successText.setOrigin(0.5);
        successText.setDepth(200);

        // Return to main menu after 2 seconds
        this.time.delayedCall(2000, () => {
            this.scene.start(SCENE_KEYS.MAIN_MENU);
        });
    }
}
