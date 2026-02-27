import { COLORS, GAME_CONFIG, Z_INDEX, FONTS } from '@constants/index';
import { Button } from './Button';
import { AudioService } from '@core/AudioService';
import { LocalizationService } from '@core/LocalizationService';
import { StorageService } from '@core/StorageService';
import { Language } from '../types/models';

export class SettingsPanel extends Phaser.GameObjects.Container {
    private audioService: AudioService;
    private localizationService: LocalizationService;
    private storageService: StorageService;

    private soundButton!: Button;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        this.audioService = AudioService.getInstance();
        this.localizationService = LocalizationService.getInstance();
        this.storageService = StorageService.getInstance();

        this.setDepth(Z_INDEX.OVERLAY);
        this.setVisible(false);

        this.createPanel();

        scene.add.existing(this);
    }

    private createPanel(): void {
        const width = GAME_CONFIG.WIDTH;
        const height = GAME_CONFIG.HEIGHT;

        // 1. Semi-transparent background (Blocker)
        const blocker = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        blocker.setOrigin(0, 0);
        blocker.setInteractive(); // Blocks clicks below
        this.add(blocker);

        // 2. Panel Background (Premium Glassmorphism)
        const panelWidth = 550;
        const panelHeight = 500;
        const panelX = width / 2;
        const panelY = height / 2;

        const panelBg = this.scene.add.graphics();
        // Shadow
        panelBg.fillStyle(0x000000, 0.4);
        panelBg.fillRoundedRect(panelX - panelWidth / 2 + 8, panelY - panelHeight / 2 + 8, panelWidth, panelHeight, 30);
        // Body
        panelBg.fillStyle(0x1A1A2E, 0.95);
        panelBg.fillRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 30);
        // Stroke
        panelBg.lineStyle(3, 0xffffff, 0.15);
        panelBg.strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 30);
        this.add(panelBg);

        // 3. Title
        const title = this.scene.add.text(panelX, panelY - 180, this.localizationService.translate('menu.settings'), {
            fontSize: '56px',
            color: COLORS.TEXT_LIGHT,
            fontFamily: FONTS.PRIMARY,
            fontStyle: '800'
        });
        title.setOrigin(0.5);
        this.add(title);

        // 4. Sound Toggle
        this.soundButton = new Button(this.scene, {
            x: panelX,
            y: panelY,
            width: 300,
            height: 70,
            text: this.getSoundText(),
            backgroundColor: this.audioService.isSoundEnabled() ? COLORS.SUCCESS : COLORS.DISABLED,
            onClick: () => this.toggleSound()
        });
        this.add(this.soundButton);

        // Close Button
        const closeButton = new Button(this.scene, {
            x: panelX,
            y: panelY + 150,
            width: 200,
            height: 60,
            text: 'Kapat',
            backgroundColor: COLORS.WARNING,
            onClick: () => this.hide()
        });
        this.add(closeButton);
    }

    public show(): void {
        this.setVisible(true);
        this.refreshState();

        // Premium pop-in animation
        this.setScale(0.9);
        this.setAlpha(0);
        this.scene.tweens.add({
            targets: this,
            scale: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.out'
        });
    }

    public hide(): void {
        this.scene.tweens.add({
            targets: this,
            scale: 0.9,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.setVisible(false);
            }
        });
    }

    private toggleSound(): void {
        const newState = !this.audioService.isSoundEnabled();
        this.audioService.setSoundEnabled(newState);
        this.saveSettings();
        this.refreshState();
    }

    private getSoundText(): string {
        const status = this.audioService.isSoundEnabled() ? 'AÇIK' : 'KAPALI';
        return `Ses Efektleri: ${status}`;
    }

    private refreshState(): void {
        this.soundButton.setText(this.getSoundText());
        this.soundButton.setBackgroundColor(this.audioService.isSoundEnabled() ? COLORS.SUCCESS : COLORS.DISABLED);
    }

    private saveSettings(): void {
        const currentSettings = this.storageService.loadSettings();
        this.storageService.saveSettings({
            ...currentSettings,
            soundEnabled: this.audioService.isSoundEnabled(),
            language: this.localizationService.getCurrentLanguage() as Language,
        });
    }
}
