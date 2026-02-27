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
        try {
            const width = GAME_CONFIG.WIDTH;
            const height = GAME_CONFIG.HEIGHT;
            const headerHeight = 120;

            // Background Gradient with Grid Pattern
            const bgGraphics = this.add.graphics();
            bgGraphics.fillGradientStyle(
                Phaser.Display.Color.HexStringToColor(COLORS.BACKGROUND).color,
                Phaser.Display.Color.HexStringToColor(COLORS.BACKGROUND).color,
                Phaser.Display.Color.HexStringToColor('#0F0F1A').color,
                Phaser.Display.Color.HexStringToColor('#0F0F1A').color,
                1
            );
            bgGraphics.fillRect(0, 0, width, height);

            // Subtly overlay a grid pattern
            const grid = this.add.grid(width / 2, height / 2, width, height, 40, 40, 0xffffff, 0.02);
            grid.setAlpha(0.2);

            // (Removing redundant background calls)

            // Show banner ad via AdMob
            void this.adService.showBanner();

            // --- HEADER (Premium Glassmorphism) ---
            const headerBg = this.add.graphics();
            // Shadow
            headerBg.fillStyle(0x000000, 0.4);
            headerBg.fillRect(0, 0, width, headerHeight + 5);
            // Body
            headerBg.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.PRIMARY).color, 0.95);
            headerBg.fillRect(0, 0, width, headerHeight);
            // Glass Highlight
            headerBg.fillStyle(0xffffff, 0.1);
            headerBg.fillRect(0, 0, width, headerHeight / 2);

            const title = this.add.text(
                width / 2,
                headerHeight / 2,
                '📊 EBEVEYN PANELİ', // Fixed spelling (EBEVEYN)
                {
                    fontSize: '48px',
                    color: COLORS.TEXT_LIGHT,
                    fontFamily: 'Outfit, sans-serif',
                    fontStyle: '900',
                    shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 5, fill: true }
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
            this.createStatsPanel(width / 2, height / 2 - 180, {
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

            // Category performance
            this.createCategoryPerformance(width / 2, height / 2 + 150, categories, progress);

            // Reset button
            new Button(this, {
                x: width / 2,
                y: height - 190,
                width: 380,
                height: 70,
                text: '🗑️ İLERLEMEYİ SIFIRLA',
                backgroundColor: COLORS.ACCENT,
                fontSize: 24,
                onClick: () => {
                    this.confirmReset();
                },
            });

            // Back button
            new Button(this, {
                x: width / 2,
                y: height - 100,
                width: 380,
                height: 70,
                text: '← ANA MENÜ',
                backgroundColor: COLORS.SECONDARY,
                fontSize: 24,
                onClick: () => {
                    this.scene.start(SCENE_KEYS.MAIN_MENU);
                },
            });
        } catch (error) {
            console.error('[ParentPanelScene] Scene Create Error:', error);

            // Show explicit error
            const centerX = GAME_CONFIG.WIDTH / 2;
            const centerY = GAME_CONFIG.HEIGHT / 2;

            this.add.text(centerX, centerY, 'Bir hata oluştu.', {
                fontSize: '32px',
                color: '#ff0000',
                backgroundColor: '#000000'
            }).setOrigin(0.5);

            new Button(this, {
                x: centerX,
                y: centerY + 100,
                width: 200,
                height: 60,
                text: 'Ana Menü',
                backgroundColor: COLORS.ACCENT,
                fontSize: 24,
                onClick: () => {
                    this.scene.start(SCENE_KEYS.MAIN_MENU);
                }
            });
        }
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

        // Premium Background
        const statsPanelBg = this.add.graphics();
        // Shadow
        statsPanelBg.fillStyle(0x000000, 0.4);
        statsPanelBg.fillRoundedRect(x - panelWidth / 2 + 8, y + 8, panelWidth, panelHeight, 25);
        // Body
        statsPanelBg.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.BACKGROUND).color, 0.9);
        statsPanelBg.fillRoundedRect(x - panelWidth / 2, y, panelWidth, panelHeight, 25);
        // Glass Highlight
        statsPanelBg.fillStyle(0xffffff, 0.03);
        statsPanelBg.fillRoundedRect(x - panelWidth / 2, y, panelWidth, panelHeight / 2, { tl: 25, tr: 25, bl: 0, br: 0 });
        // Border
        statsPanelBg.lineStyle(3, Phaser.Display.Color.HexStringToColor(COLORS.PRIMARY).color, 0.6);
        statsPanelBg.strokeRoundedRect(x - panelWidth / 2, y, panelWidth, panelHeight, 25);

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
                    fontFamily: 'Outfit, sans-serif',
                    fontStyle: '600'
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
            'KATEGORİ PERFORMANSI',
            {
                fontSize: '28px',
                color: COLORS.WARNING,
                fontFamily: 'Outfit, sans-serif',
                fontStyle: '900',
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, fill: true }
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
                    fontSize: '20px',
                    color: COLORS.TEXT_LIGHT,
                    fontFamily: 'Outfit, sans-serif',
                    fontStyle: '800'
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
            const colors = {
                success: Phaser.Display.Color.HexStringToColor(COLORS.SUCCESS).color,
                warning: Phaser.Display.Color.HexStringToColor(COLORS.WARNING).color,
                primary: Phaser.Display.Color.HexStringToColor(COLORS.PRIMARY).color
            };
            const fillColor = percentage >= 100 ? colors.success : percentage >= 50 ? colors.warning : colors.primary;
            barFill.fillStyle(fillColor, 1);
            barFill.fillRoundedRect(barX, yOffset, (barWidth * percentage) / 100, barHeight, 4);

            // Percentage text
            const percentText = this.add.text(
                barX + barWidth + 20,
                yOffset + barHeight / 2,
                `${Math.round(percentage)}%`,
                {
                    fontSize: '18px',
                    color: COLORS.TEXT_LIGHT,
                    fontFamily: 'Outfit, sans-serif',
                    fontStyle: '800'
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

        const confirmPanel = this.add.graphics();
        // Shadow
        confirmPanel.fillStyle(0x000000, 0.4);
        confirmPanel.fillRoundedRect(panelX + 8, panelY + 8, panelWidth, panelHeight, 25);
        // Body
        confirmPanel.fillStyle(0x1A1A2E, 0.95);
        confirmPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 25);
        // Glass Highlight
        confirmPanel.fillStyle(0xffffff, 0.05);
        confirmPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight / 2, { tl: 25, tr: 25, bl: 0, br: 0 });
        // Border
        confirmPanel.lineStyle(3, 0x6C5CE7, 0.6); // PRIMARY
        confirmPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 25);
        confirmPanel.setDepth(101);

        const warningText = this.add.text(
            GAME_CONFIG.WIDTH / 2,
            panelY + 60,
            '⚠️ UYARI',
            {
                fontSize: '38px', // Slightly larger
                color: COLORS.ACCENT,
                fontFamily: 'Outfit, sans-serif',
                fontStyle: '900',
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, fill: true }
            }
        );
        warningText.setOrigin(0.5);
        warningText.setDepth(102);

        const confirmText = this.add.text(
            GAME_CONFIG.WIDTH / 2,
            panelY + 120,
            'Tüm ilerleme silinecek.\nEmin misiniz?',
            {
                fontSize: '22px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: 'Outfit, sans-serif',
                fontStyle: '600',
                align: 'center',
            }
        );
        confirmText.setOrigin(0.5);
        confirmText.setDepth(102);

        // Yes button reference
        let yesButton: Button;
        let noButton: Button;

        // Yes button
        yesButton = new Button(this, {
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
                confirmPanel.destroy();
                warningText.destroy();
                confirmText.destroy();
                yesButton.destroy();
                noButton.destroy();
            },
        });
        yesButton.setDepth(102);

        // No button
        noButton = new Button(this, {
            x: GAME_CONFIG.WIDTH / 2 + 100,
            y: panelY + 190,
            width: 120,
            height: 50,
            text: 'Hayır',
            backgroundColor: COLORS.SECONDARY,
            fontSize: 20,
            onClick: () => {
                overlay.destroy();
                confirmPanel.destroy();
                warningText.destroy();
                confirmText.destroy();
                yesButton.destroy();
                noButton.destroy();
            },
        });
        noButton.setDepth(102);
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
                fontSize: '44px',
                color: '#2ecc71', // SUCCESS color hex
                fontFamily: 'Outfit, sans-serif',
                fontStyle: '900',
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 5, fill: true }
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
