import { Scene } from 'phaser';
import { SCENE_KEYS, GAME_CONFIG, COLORS, Z_INDEX } from '@constants/index';
import { Button } from '@ui/Button';
import { LevelService } from '@core/LevelService';
import { StorageService } from '@core/StorageService';
import { LocalizationService } from '@core/LocalizationService';
import { AudioService } from '@core/AudioService';
import { AssetLoaderService } from '@core/AssetLoaderService';
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
    }

    /**
     * Creates the category selection UI
     */
    public create(): void {
        const width = GAME_CONFIG.WIDTH;
        const height = GAME_CONFIG.HEIGHT;
        const headerHeight = 120;
        const footerHeight = 100;
        const bodyHeight = height - headerHeight - footerHeight;

        // Background
        this.cameras.main.setBackgroundColor(GAME_CONFIG.BACKGROUND_COLOR);

        // --- HEADER ---
        const headerBg = this.add.rectangle(0, 0, width, headerHeight, 0x2c3e50);
        headerBg.setOrigin(0, 0);
        headerBg.setDepth(Z_INDEX.UI + 10);

        const title = this.add.text(width / 2, headerHeight / 2, 'Kategori Seç', {
            fontSize: '42px',
            color: COLORS.TEXT_LIGHT,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
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
        this.createScrollableContent(categories, progress.totalStars);

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

        // --- FOOTER ---
        const footerBg = this.add.rectangle(0, height - footerHeight, width, footerHeight, 0x1a252f);
        footerBg.setOrigin(0, 0);
        footerBg.setDepth(Z_INDEX.UI + 10);

        // Back button
        const backButton = new Button(this, {
            x: 100,
            y: height - footerHeight / 2,
            width: 150,
            height: 60,
            text: this.localizationService.translate('menu.back'),
            backgroundColor: COLORS.ACCENT,
            fontSize: 24,
            onClick: () => {
                this.scene.start(SCENE_KEYS.MAIN_MENU);
            },
        });
        backButton.setDepth(Z_INDEX.UI + 11);

        // Stars
        const starsText = this.add.text(
            width - 100,
            height - footerHeight / 2,
            `⭐ ${progress.totalStars}`,
            {
                fontSize: '32px',
                color: COLORS.WARNING,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
            }
        );
        starsText.setOrigin(0.5);
        starsText.setDepth(Z_INDEX.UI + 11);
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

        const bg = this.add.rectangle(0, 0, width, height, parseInt(COLORS.CARD_FRONT.replace('#', ''), 16));
        bg.setStrokeStyle(4, parseInt(COLORS.PRIMARY.replace('#', ''), 16));

        const nameText = this.add.text(0, -70, this.localizationService.translate(category.nameKey), {
            fontSize: '32px',
            color: COLORS.TEXT_DARK,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
        });
        nameText.setOrigin(0.5);

        const descText = this.add.text(0, -20, this.localizationService.translate(category.descriptionKey), {
            fontSize: '18px',
            color: COLORS.TEXT_DARK,
            fontFamily: 'Arial, sans-serif',
            align: 'center',
            wordWrap: { width: width - 40 }
        });
        descText.setOrigin(0.5);

        const levelCount = this.add.text(0, 30, `${category.levels.length} Seviye`, {
            fontSize: '18px',
            color: COLORS.TEXT_DARK,
            fontFamily: 'Arial, sans-serif',
        });
        levelCount.setOrigin(0.5);

        card.add([bg, nameText, descText, levelCount]);

        if (isUnlocked) {
            bg.setInteractive({ useHandCursor: true });

            let pressX = 0;
            let pressY = 0;

            bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                pressX = pointer.x;
                pressY = pointer.y;
            });

            bg.on('pointerup', (pointer: Phaser.Input.Pointer) => {
                const dist = Phaser.Math.Distance.Between(pressX, pressY, pointer.x, pointer.y);

                // Trigger only if not dragging and movement is small
                if (!this.isDragging && dist < 15) {
                    this.tweens.add({
                        targets: card,
                        scale: 0.95,
                        duration: 50,
                        yoyo: true,
                        onComplete: () => {
                            this.selectCategory(category);
                        }
                    });
                }
            });

            bg.on('pointerover', () => {
                this.tweens.add({ targets: card, scale: 1.05, duration: 100 });
            });

            bg.on('pointerout', () => {
                this.tweens.add({ targets: card, scale: 1, duration: 100 });
            });
        } else {
            const lockIcon = this.add.text(0, 60, '🔒', { fontSize: '32px' });
            lockIcon.setOrigin(0.5);

            const unlockText = this.add.text(0, 90,
                this.localizationService.translate('category.unlock', { stars: category.unlockRequirement.toString() }),
                { fontSize: '14px', color: COLORS.DISABLED, fontFamily: 'Arial, sans-serif' }
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
        // Prevent multiple clicks
        if (this.isLoading) {
            return;
        }
        this.isLoading = true;

        const name = this.localizationService.translate(category.nameKey);
        const lang = this.localizationService.getCurrentLanguage();
        void this.audioService.speak(name, lang === 'tr' ? 'tr-TR' : 'en-US');

        // Show loading overlay
        if (this.loadingOverlay === null) {
            this.loadingOverlay = new LoadingOverlay(this);
        }
        this.loadingOverlay.show();

        try {
            // Load category assets
            console.log(`[CategorySelection] Loading assets for ${category.id}`);

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
