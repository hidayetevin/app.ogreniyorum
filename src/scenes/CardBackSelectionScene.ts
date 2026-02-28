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

            const title = this.add.text(width / 2, headerHeight / 2, this.localizationService.translate('cardBack.title'), {
                fontSize: '48px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: 'Outfit, sans-serif',
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

            // --- FOOTER (Premium Glassmorphism) ---
            const footerBg = this.add.graphics();
            footerBg.fillStyle(0x0f0f1a, 0.95);
            footerBg.fillRect(0, height - footerHeight, width, footerHeight);
            footerBg.lineStyle(2, 0xffffff, 0.1);
            footerBg.strokeLineShape(new Phaser.Geom.Line(0, height - footerHeight, width, height - footerHeight));
            footerBg.setDepth(Z_INDEX.UI + 10);

            // Back button
            new Button(this, {
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
            }).setDepth(Z_INDEX.UI + 11);

            // Stars display
            this.updateStarsDisplay();
        } catch (error) {
            console.error('CardBackSelectionScene create error:', error);
            // Show explicit error to user instead of freeze
            const centerX = GAME_CONFIG.WIDTH / 2;
            const centerY = GAME_CONFIG.HEIGHT / 2;

            this.add.text(centerX, centerY, this.localizationService.translate('error.unknown'), {
                fontSize: '32px',
                color: '#ff0000',
                backgroundColor: '#000000'
            }).setOrigin(0.5);

            new Button(this, {
                x: centerX,
                y: centerY + 100,
                width: 200,
                height: 60,
                text: this.localizationService.translate('menu.mainMenu'),
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
            // Star Chip Background
            const starBg = this.add.graphics();
            starBg.fillStyle(0xffffff, 0.05);
            starBg.fillRoundedRect(width - 250, height - footerHeight / 2 - 35, 220, 70, 35);
            starBg.lineStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.WARNING).color, 0.3);
            starBg.strokeRoundedRect(width - 250, height - footerHeight / 2 - 35, 220, 70, 35);
            starBg.setDepth(Z_INDEX.UI + 11);

            this.starsText = this.add.text(
                width - 140,
                height - footerHeight / 2,
                `⭐ ${progress.totalStars}`,
                {
                    fontSize: '34px',
                    color: COLORS.WARNING,
                    fontFamily: 'Outfit, sans-serif',
                    fontStyle: 'bold',
                }
            );
            this.starsText.setOrigin(0.5);
            this.starsText.setDepth(Z_INDEX.UI + 12);
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

        // Premium card background
        const cardBg = this.add.graphics();
        const mainCardCol = isUnlocked ? (isSelected ? 0x252545 : 0x1A1A2E) : 0x0F0F1A;
        const bColVal = isSelected ? 0x24fbff : (isUnlocked ? Phaser.Display.Color.HexStringToColor(COLORS.PRIMARY).color : 0x2C3E50);

        // Shadow
        cardBg.fillStyle(0x000000, 0.4);
        cardBg.fillRoundedRect(-width / 2 + 8, -height / 2 + 8, width, height, 25);
        // Body
        cardBg.fillStyle(mainCardCol, 0.95);
        cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 25);
        // Highlight
        cardBg.fillStyle(0xffffff, 0.03);
        cardBg.fillRoundedRect(-width / 2, -height / 2, width, height / 2, { tl: 25, tr: 25, bl: 0, br: 0 });
        // Border
        cardBg.lineStyle(isSelected ? 4 : 3, bColVal, isUnlocked ? 0.8 : 0.3);
        cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 25);

        container.add(cardBg);

        // Card back preview image
        const imgKey = `card-back-${cb.id}`;
        const preview = this.add.image(0, -50, imgKey);
        const imgScale = (width * 0.7) / preview.width;
        preview.setScale(imgScale);
        container.add(preview);

        // Name
        const nameText = this.add.text(0, height / 2 - 80, this.localizationService.translate(cb.nameKey), {
            fontSize: '26px',
            color: COLORS.TEXT_LIGHT,
            fontFamily: 'Outfit, sans-serif',
            fontStyle: '900'
        }).setOrigin(0.5);
        container.add(nameText);

        // Interaction
        if (isSelected) {
            const labelText = this.add.text(0, height / 2 - 35, this.localizationService.translate('cardBack.selected'), {
                fontSize: '22px',
                color: '#24fbff', // Cyan highlight
                fontFamily: 'Outfit, sans-serif',
                fontStyle: '800'
            }).setOrigin(0.5);
            container.add(labelText);
        } else if (isUnlocked) {
            const actBtn = new Button(this, {
                x: 0,
                y: height / 2 - 35,
                width: width - 60,
                height: 45,
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
            container.add(actBtn);
        } else {
            const unlockBtn = new Button(this, {
                x: 0,
                y: height / 2 - 35,
                width: width - 60,
                height: 45,
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
                        const errText = this.add.text(0, -150, this.localizationService.translate('cardBack.notEnoughStars'), {
                            fontSize: '24px',
                            color: '#ff4d4d',
                            fontFamily: 'Outfit, sans-serif',
                            fontStyle: '900',
                            backgroundColor: '#000000aa',
                            padding: { x: 15, y: 8 }
                        }).setOrigin(0.5).setDepth(100);
                        this.tweens.add({
                            targets: errText,
                            alpha: 0,
                            y: -200,
                            delay: 1500,
                            duration: 500,
                            onComplete: () => errText.destroy()
                        });
                    }
                }
            });
            container.add(unlockBtn);

            // Lock icon (Premium)
            const lockIconObj = this.add.text(0, -35, '🔒', { fontSize: '48px' }).setOrigin(0.5);
            container.add(lockIconObj);
            preview.setAlpha(0.25);
        }

        // Interactive hit area
        const itemHitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
        container.setInteractive(itemHitArea, Phaser.Geom.Rectangle.Contains);
        if (container.input) container.input.cursor = 'pointer';

        // Hover effects
        container.on('pointerover', () => {
            this.tweens.add({ targets: container, scale: 1.05, duration: 250, ease: 'Cubic.easeOut' });
        });
        container.on('pointerout', () => {
            this.tweens.add({ targets: container, scale: 1, duration: 250, ease: 'Cubic.easeOut' });
        });
    }
}
