import { Scene } from 'phaser';
import { SCENE_KEYS, GAME_CONFIG, COLORS, Z_INDEX } from '@constants/index';
import { Button } from '@ui/Button';
import { StorageService } from '@core/StorageService';
import { LocalizationService } from '@core/LocalizationService';
import { AudioService } from '@core/AudioService';
import cardBacksData from '../config/cardBacks.json';
import type { ICardBack } from '../types/models';

/**
 * CardBackSelectionScene displays available card back patterns
 * Users can unlock them using stars and select one to use in game
 */
export class CardBackSelectionScene extends Scene {
    private storageService: StorageService;
    private localizationService: LocalizationService;
    private audioService: AudioService;

    private scrollContainer: Phaser.GameObjects.Container | null = null;
    private scrollMask: Phaser.Display.Masks.GeometryMask | null = null;
    private startY: number = 0;
    private isDragging: boolean = false;
    private lastY: number = 0;
    private maxScroll: number = 0;
    private startPointerY: number = 0;
    private starsText: Phaser.GameObjects.Text | null = null;

    constructor() {
        super({ key: SCENE_KEYS.CARD_BACK_SELECTION });
        this.storageService = StorageService.getInstance();
        this.localizationService = LocalizationService.getInstance();
        this.audioService = AudioService.getInstance();
    }

    public create(): void {
        try {
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

            const title = this.add.text(width / 2, headerHeight / 2, this.localizationService.translate('cardBack.title'), {
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

            // Create scrollable content
            this.createScrollableContent();

            // --- SCROLL LOGIC ---
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
                setTimeout(() => {
                    this.isDragging = false;
                }, 50);
            });

            // --- FOOTER ---
            const footerBg = this.add.rectangle(0, height - footerHeight, width, footerHeight, 0x1a252f);
            footerBg.setOrigin(0, 0);
            footerBg.setDepth(Z_INDEX.UI + 10);

            // Back button
            new Button(this, {
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
            }).setDepth(Z_INDEX.UI + 11);

            // Stars display
            this.updateStarsDisplay();
        } catch (error) {
            console.error('CardBackSelectionScene create error:', error);
            // Show explicit error to user instead of freeze
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

    private updateStarsDisplay(): void {
        const progress = this.storageService.loadProgress();
        const width = GAME_CONFIG.WIDTH;
        const height = GAME_CONFIG.HEIGHT;
        const footerHeight = 100;

        if (this.starsText) {
            this.starsText.setText(`⭐ ${progress.totalStars}`);
        } else {
            this.starsText = this.add.text(
                width - 120,
                height - footerHeight / 2,
                `⭐ ${progress.totalStars}`,
                {
                    fontSize: '32px',
                    color: COLORS.WARNING,
                    fontFamily: 'Arial, sans-serif',
                    fontStyle: 'bold',
                }
            );
            this.starsText.setOrigin(0.5);
            this.starsText.setDepth(Z_INDEX.UI + 11);
        }
    }

    private createScrollableContent(): void {
        const cardBacks = cardBacksData.cardBacks as ICardBack[];
        const unlockedIds = this.storageService.getUnlockedCardBacks();
        const selectedId = this.storageService.getSelectedCardBackId();

        const cardWidth = 280;
        const cardHeight = 350;
        const spacing = 40;
        const columns = 2;
        const width = GAME_CONFIG.WIDTH;

        const totalGridWidth = (columns * cardWidth) + ((columns - 1) * spacing);
        const startX = (width - totalGridWidth) / 2 + (cardWidth / 2);
        const startY = 180;

        cardBacks.forEach((cb, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);

            const x = startX + col * (cardWidth + spacing);
            const y = startY + row * (cardHeight + spacing);

            this.createCardBackItem(cb, x, y, cardWidth, cardHeight, unlockedIds.includes(cb.id), selectedId === cb.id);
        });

        const rowsCount = Math.ceil(cardBacks.length / columns);
        const totalContentHeight = startY + rowsCount * (cardHeight + spacing) + 50;
        const headerHeight = 120;
        const footerHeight = 100;
        const bodyHeight = GAME_CONFIG.HEIGHT - headerHeight - footerHeight;

        this.maxScroll = Math.max(0, totalContentHeight - bodyHeight);
    }

    private createCardBackItem(
        cb: ICardBack,
        x: number,
        y: number,
        width: number,
        height: number,
        isUnlocked: boolean,
        isSelected: boolean
    ): void {
        const container = this.add.container(x, y);
        this.scrollContainer?.add(container);

        // Card background
        const bg = this.add.rectangle(0, 0, width, height, isSelected ? 0xecf0f1 : 0xffffff);
        bg.setStrokeStyle(isSelected ? 6 : 2, isSelected ? 0x2ecc71 : 0xbdc3c7);
        bg.setInteractive({ useHandCursor: true });
        container.add(bg);

        // Card back preview image
        // We use the key loaded in BootScene which is 'card-back-' + id
        const imgKey = `card-back-${cb.id}`;
        const preview = this.add.image(0, -50, imgKey);
        // Scale to fit half of the card
        const imgScale = (width * 0.6) / preview.width;
        preview.setScale(imgScale);
        container.add(preview);

        // Name
        const name = this.add.text(0, height / 2 - 75, this.localizationService.translate(cb.nameKey), {
            fontSize: '22px',
            color: COLORS.TEXT_DARK,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(name);

        // Interaction
        if (isSelected) {
            const label = this.add.text(0, height / 2 - 30, this.localizationService.translate('cardBack.selected'), {
                fontSize: '20px',
                color: '#2ecc71',
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            container.add(label);
        } else if (isUnlocked) {
            const btn = new Button(this, {
                x: 0,
                y: height / 2 - 30,
                width: width - 40,
                height: 40,
                text: this.localizationService.translate('cardBack.select'),
                backgroundColor: COLORS.PRIMARY,
                fontSize: 18,
                onClick: () => {
                    if (this.isDragging) return;
                    this.audioService.playSound('button-click');
                    this.storageService.setSelectedCardBackId(cb.id);
                    this.scene.restart(); // Refresh all
                }
            });
            container.add(btn);
        } else {
            const btn = new Button(this, {
                x: 0,
                y: height / 2 - 30,
                width: width - 40,
                height: 40,
                text: this.localizationService.translate('cardBack.unlock', { stars: cb.unlockCost.toString() }),
                backgroundColor: COLORS.SECONDARY,
                fontSize: 18,
                onClick: () => {
                    if (this.isDragging) return;
                    const success = this.storageService.unlockCardBack(cb.id, cb.unlockCost);
                    if (success) {
                        this.audioService.playSound('correct-match');
                        this.updateStarsDisplay();
                        this.scene.restart();
                    } else {
                        this.audioService.playSound('wrong-match');
                        // Show "not enough stars" briefly
                        const error = this.add.text(0, -150, this.localizationService.translate('cardBack.notEnoughStars'), {
                            fontSize: '24px',
                            color: '#e74c3c',
                            fontFamily: 'Arial, sans-serif',
                            fontStyle: 'bold',
                            backgroundColor: '#ffffffaa',
                            padding: { x: 10, y: 5 }
                        }).setOrigin(0.5);
                        this.tweens.add({
                            targets: error,
                            alpha: 0,
                            y: -200,
                            delay: 1000,
                            duration: 500,
                            onComplete: () => error.destroy()
                        });
                    }
                }
            });
            container.add(btn);

            // Lock icon
            const lockIcon = this.add.text(0, -30, '🔒', { fontSize: '48px' }).setOrigin(0.5);
            container.add(lockIcon);
            preview.setAlpha(0.3);
        }
    }
}
