import { Scene } from 'phaser';
import { SCENE_KEYS, GAME_CONFIG, COLORS, Z_INDEX, FONTS } from '@constants/index';
import { Button } from '@ui/Button';
import { LevelService } from '@core/LevelService';
import { StorageService } from '@core/StorageService';
import { LocalizationService } from '@core/LocalizationService';
import { AudioService } from '@core/AudioService';
import { AssetLoaderService } from '@core/AssetLoaderService';
import { AdService } from '@core/AdService';
import { LoadingOverlay } from '@ui/LoadingOverlay';
import type { ICategory } from '../types/models';

/**
 * CategorySelectionScene displays available game categories
 */
export class CategorySelectionScene extends Scene {
    private levelService: LevelService;
    private storageService: StorageService;
    private localizationService: LocalizationService;
    private audioService: AudioService;
    private assetLoader: AssetLoaderService;
    private adService: AdService;

    private scrollContainer: Phaser.GameObjects.Container | null = null;
    private scrollMask: Phaser.Display.Masks.GeometryMask | null = null;
    private startY: number = 0;
    private isDragging: boolean = false;
    private lastY: number = 0;
    private maxScroll: number = 0;
    private startPointerY: number = 0;
    private loadingOverlay: LoadingOverlay | null = null;
    private isLoading: boolean = false;

    constructor() {
        super({ key: SCENE_KEYS.CATEGORY_SELECTION });
        this.levelService = LevelService.getInstance();
        this.storageService = StorageService.getInstance();
        this.localizationService = LocalizationService.getInstance();
        this.audioService = AudioService.getInstance();
        this.assetLoader = AssetLoaderService.getInstance();
        this.adService = AdService.getInstance();
    }

    /**
     * Creates the category selection UI
     */
    public create(): void {
        try {
            // Reset loading state when scene starts
            this.isLoading = false;
            console.log('[CategorySelection] Scene created, isLoading reset to:', this.isLoading);

            const width = GAME_CONFIG.WIDTH;
            const height = GAME_CONFIG.HEIGHT;
            const headerHeight = 120;
            const footerHeight = 100;
            const bodyHeight = height - headerHeight - footerHeight;

            // Show banner ad via AdMob
            void this.adService.showBanner();

            // Background Gradient
            const bgGraphics = this.add.graphics();
            bgGraphics.fillGradientStyle(
                Phaser.Display.Color.HexStringToColor(COLORS.BACKGROUND).color,
                Phaser.Display.Color.HexStringToColor(COLORS.BACKGROUND).color,
                Phaser.Display.Color.HexStringToColor('#0F0F1A').color,
                Phaser.Display.Color.HexStringToColor('#0F0F1A').color,
                1
            );
            bgGraphics.fillRect(0, 0, width, height);

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
            headerBg.setDepth(Z_INDEX.UI + 10);

            const title = this.add.text(width / 2, headerHeight / 2, this.localizationService.translate('menu.categories'), {
                fontSize: '48px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: FONTS.PRIMARY,
                fontStyle: '900',
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 5, fill: true }
            });
            title.setOrigin(0.5);
            title.setDepth(Z_INDEX.UI + 11);

            // --- BODY (Scrollable) ---
            this.scrollContainer = this.add.container(0, headerHeight);

            // Define mask
            const maskShape = this.make.graphics({});
            maskShape.fillStyle(0xffffff);
            maskShape.fillRect(0, headerHeight, width, bodyHeight);
            this.scrollMask = maskShape.createGeometryMask();
            this.scrollContainer.setMask(this.scrollMask);

            // Get categories
            const categories = this.levelService.getCategories();
            const progress = this.storageService.loadProgress();

            // Create cards inside container
            this.createScrollableContent(categories, progress.lifetimeStars ?? progress.totalStars);

            // --- GLOBAL SCROLL LOGIC (Scene Level to avoid blocking) ---
            this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.y > headerHeight && pointer.y < height - footerHeight) {
                    this.startY = pointer.y;
                    this.startPointerY = pointer.y;
                    this.lastY = this.scrollContainer!.y;
                    this.isDragging = false;
                }
            });

            this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
                if (!pointer.isDown || !this.scrollContainer) return;

                // Only scroll if we started in the body area
                if (this.startPointerY === 0) return;

                const totalDelta = Math.abs(pointer.y - this.startPointerY);

                if (totalDelta > 15) {
                    this.isDragging = true;
                    let newY = this.lastY + (pointer.y - this.startY);

                    // Constrain scrolling
                    if (newY > headerHeight) newY = headerHeight;
                    if (newY < headerHeight - this.maxScroll) newY = headerHeight - this.maxScroll;

                    this.scrollContainer.y = newY;
                }
            });

            this.input.on('pointerup', () => {
                this.startPointerY = 0;
                // Note: We keep isDragging as true for a split second to prevent clicks firing immediately
                setTimeout(() => {
                    this.isDragging = false;
                }, 50);
            });

            // --- FOOTER (Glassy) ---
            const footerBg = this.add.graphics();
            // Shadow
            footerBg.fillStyle(0x000000, 0.4);
            footerBg.fillRect(0, height - footerHeight - 5, width, footerHeight + 5);
            // Body
            footerBg.fillStyle(0x0F0F1A, 0.98);
            footerBg.fillRect(0, height - footerHeight, width, footerHeight);
            // Border
            footerBg.lineStyle(2, 0xffffff, 0.1);
            footerBg.strokeLineShape(new Phaser.Geom.Line(0, height - footerHeight, width, height - footerHeight));
            footerBg.setDepth(Z_INDEX.UI + 10);

            // Back button
            const backButton = new Button(this, {
                x: 120,
                y: height - footerHeight / 2,
                width: 180,
                height: 60,
                text: this.localizationService.translate('menu.back'),
                backgroundColor: COLORS.ACCENT,
                fontSize: 24,
                onClick: () => {
                    this.scene.start(SCENE_KEYS.MAIN_MENU);
                },
            });
            backButton.setDepth(Z_INDEX.UI + 11);

            // Stars Display (Premium Chip)
            const starBg = this.add.graphics();
            starBg.fillStyle(0xffffff, 0.05);
            starBg.fillRoundedRect(width - 250, height - footerHeight / 2 - 35, 220, 70, 35);
            starBg.lineStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.WARNING).color, 0.3);
            starBg.strokeRoundedRect(width - 250, height - footerHeight / 2 - 35, 220, 70, 35);
            starBg.setDepth(Z_INDEX.UI + 11);

            const starsText = this.add.text(
                width - 140,
                height - footerHeight / 2,
                `⭐ ${progress.totalStars}`,
                {
                    fontSize: '34px',
                    color: COLORS.WARNING,
                    fontFamily: FONTS.PRIMARY,
                    fontStyle: 'bold',
                }
            );
            starsText.setOrigin(0.5);
            starsText.setDepth(Z_INDEX.UI + 12);
        } catch (error) {
            console.error('[CategorySelection] Scene Create Error:', error);
            this.isLoading = false;
            this.loadingOverlay?.hide();

            // Show explicit error to user
            const centerX = GAME_CONFIG.WIDTH / 2;
            const centerY = GAME_CONFIG.HEIGHT / 2;

            this.add.text(centerX, centerY, 'Bir hata oluştu.', {
                fontSize: '32px',
                color: '#ff0000',
                backgroundColor: '#000000'
            }).setOrigin(0.5).setDepth(200);

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
            }).setDepth(200);
        }
    }

    /**
     * Creates category cards inside the scroll container
     */
    private createScrollableContent(categories: ICategory[], totalStars: number): void {
        const cardWidth = 300;
        const cardHeight = 240;
        const spacing = 40;
        const columns = 2;
        const width = GAME_CONFIG.WIDTH;

        const totalGridWidth = (columns * cardWidth) + ((columns - 1) * spacing);
        const startX = (width - totalGridWidth) / 2 + (cardWidth / 2);
        const startY = 150;

        categories.forEach((category, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);

            const x = startX + col * (cardWidth + spacing);
            const y = startY + row * (cardHeight + spacing);

            this.createCategoryCard(category, x, y, cardWidth, cardHeight, totalStars);
        });

        const rows = Math.ceil(categories.length / columns);
        const totalContentHeight = startY + rows * (cardHeight + spacing) + 100;
        const height = GAME_CONFIG.HEIGHT;
        const headerHeight = 120;
        const footerHeight = 100;
        const bodyHeight = height - headerHeight - footerHeight;

        this.maxScroll = Math.max(0, totalContentHeight - bodyHeight);
    }

    /**
     * Creates a single category card and adds it to the scroll container
     */
    private createCategoryCard(
        category: ICategory,
        x: number,
        y: number,
        width: number,
        height: number,
        totalStars: number
    ): void {
        const isUnlocked = this.levelService.isCategoryUnlocked(category.id, totalStars);

        const card = this.add.container(x, y);
        this.scrollContainer?.add(card);

        // Premium card background
        const cardBg = this.add.graphics();
        const cardMainCol = isUnlocked ? 0x1A1A2E : 0x0F0F1A;
        const cardBorderCol = isUnlocked ? 0x6C5CE7 : 0x2C3E50;

        // Shadow
        cardBg.fillStyle(0x000000, 0.4);
        cardBg.fillRoundedRect(-width / 2 + 8, -height / 2 + 8, width, height, 25);

        // Body
        cardBg.fillStyle(cardMainCol, 0.95);
        cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 25);
        // Inner Highlight
        cardBg.fillStyle(0xffffff, 0.03);
        cardBg.fillRoundedRect(-width / 2, -height / 2, width, height / 2, { tl: 25, tr: 25, bl: 0, br: 0 });

        // Border
        cardBg.lineStyle(3, cardBorderCol, isUnlocked ? 0.6 : 0.3);
        cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 25);

        const nameText = this.add.text(0, -70, this.localizationService.translate(category.nameKey), {
            fontSize: '36px',
            color: COLORS.TEXT_LIGHT,
            fontFamily: FONTS.PRIMARY,
            fontStyle: '900',
        });
        nameText.setOrigin(0.5);

        const descText = this.add.text(0, -15, this.localizationService.translate(category.descriptionKey), {
            fontSize: '18px',
            color: isUnlocked ? '#BBBBBB' : '#888888',
            fontFamily: FONTS.SECONDARY,
            fontStyle: '600',
            align: 'center',
            wordWrap: { width: width - 60 }
        });
        descText.setOrigin(0.5);

        const levelCount = this.add.text(0, 45, `${category.levels.length} SEVİYE`, {
            fontSize: '22px',
            color: isUnlocked ? COLORS.PRIMARY : COLORS.DISABLED,
            fontFamily: FONTS.PRIMARY,
            fontStyle: '800'
        });
        levelCount.setOrigin(0.5);

        card.add([cardBg, nameText, descText, levelCount]);

        if (isUnlocked) {
            // Hit area for the entire card
            const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
            card.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
            if (card.input) card.input.cursor = 'pointer';

            let pressX = 0;
            let pressY = 0;

            card.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                pressX = pointer.x;
                pressY = pointer.y;
            });

            card.on('pointerup', (pointer: Phaser.Input.Pointer) => {
                console.log('[CategorySelection] Pointerup - isLoading:', this.isLoading, 'category:', category.id);

                if (this.isLoading) return;

                const dist = Phaser.Math.Distance.Between(pressX, pressY, pointer.x, pointer.y);

                if (!this.isDragging && dist < 15) {
                    this.tweens.add({
                        targets: card,
                        scale: 0.92,
                        duration: 100,
                        yoyo: true,
                        ease: 'Back.easeOut',
                        onComplete: () => this.selectCategory(category)
                    });
                }
            });

            card.on('pointerover', () => {
                this.tweens.add({ targets: card, scale: 1.05, duration: 250, ease: 'Cubic.easeOut' });
                cardBg.clear();
                // Redraw with highlight (Premium)
                cardBg.fillStyle(0x000000, 0.5);
                cardBg.fillRoundedRect(-width / 2 + 10, -height / 2 + 10, width, height, 25);
                cardBg.fillStyle(0x252545, 0.98);
                cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 25);
                cardBg.lineStyle(4, 0x6C5CE7, 1);
                cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 25);
            });

            card.on('pointerout', () => {
                this.tweens.add({ targets: card, scale: 1, duration: 250, ease: 'Cubic.easeOut' });
                cardBg.clear();
                cardBg.fillStyle(0x000000, 0.4);
                cardBg.fillRoundedRect(-width / 2 + 8, -height / 2 + 8, width, height, 25);
                cardBg.fillStyle(cardMainCol, 0.95);
                cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 25);
                cardBg.lineStyle(3, cardBorderCol, 0.6);
                cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 25);
            });
        } else {
            const lockIcon = this.add.text(0, 75, '🔒', { fontSize: '40px' });
            lockIcon.setOrigin(0.5);

            const unlockText = this.add.text(0, 105,
                this.localizationService.translate('category.unlock', { stars: category.unlockRequirement.toString() }),
                { fontSize: '18px', color: COLORS.DISABLED, fontFamily: FONTS.SECONDARY, fontStyle: 'bold' }
            );
            unlockText.setOrigin(0.5);

            card.add([lockIcon, unlockText]);
            card.setAlpha(0.6);
        }
    }

    /**
     * Selects a category and shows its levels
     */
    private async selectCategory(category: ICategory): Promise<void> {
        console.log('[CategorySelection] selectCategory called for:', category.id, 'isLoading:', this.isLoading);

        // Prevent multiple clicks
        if (this.isLoading) {
            console.log('[CategorySelection] selectCategory BLOCKED - Already loading');
            return;
        }

        this.isLoading = true;
        console.log('[CategorySelection] isLoading set to TRUE');

        const name = this.localizationService.translate(category.nameKey);
        const lang = this.localizationService.getCurrentLanguage();
        void this.audioService.speak(name, lang === 'tr' ? 'tr-TR' : 'en-US');

        // Always create fresh loading overlay for this scene
        this.loadingOverlay = new LoadingOverlay(this);
        this.loadingOverlay.show();

        try {
            // Load category assets
            console.log('[CategorySelection] Loading assets for', category.id);

            // Simulate progress updates
            this.loadingOverlay.updateProgress(0.3);
            await this.assetLoader.loadCategoryAssets(this, category.id);
            this.loadingOverlay.updateProgress(1.0);

            // Small delay to show completion
            await new Promise(resolve => setTimeout(resolve, 200));

            // Hide loading
            this.loadingOverlay.hide();

            // Start game
            const firstLevel = category.levels[0];
            if (firstLevel !== undefined) {
                this.scene.start(SCENE_KEYS.GAME_PLAY, {
                    levelId: firstLevel.id,
                    categoryId: category.id,
                });
            }
        } catch (error) {
            console.error('[CategorySelection] Failed to load assets:', error);
            this.loadingOverlay.hide();
            this.isLoading = false; // Reset to allow retry
            // Could show error message to user here
        }
    }
}
