import { COLORS, GAME_CONFIG, Z_INDEX, FONTS } from '@constants/index';
import { Button } from './Button';
import { AudioService } from '@core/AudioService';
import { LocalizationService } from '@core/LocalizationService';
import { StorageService } from '@core/StorageService';
import { Language } from '../types/models';
import { ParentGate } from './ParentGate';

export class SettingsPanel extends Phaser.GameObjects.Container {
    private audioService: AudioService;
    private localizationService: LocalizationService;
    private storageService: StorageService;
    private parentGate: ParentGate;

    private soundButton!: Button;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        this.audioService = AudioService.getInstance();
        this.localizationService = LocalizationService.getInstance();
        this.storageService = StorageService.getInstance();

        this.setDepth(Z_INDEX.OVERLAY);
        this.setVisible(false);

        // Initialize Parent Gate for Privacy Policy
        this.parentGate = new ParentGate(
            scene,
            () => {
                // Success: Open Privacy Policy URL
                window.open('https://github.com/hidayetevin/app.ogreniyorum/blob/main/privacy-policy.md', '_blank');
            },
            () => {
                // Fail: Just return to settings
                this.show();
            }
        );

        this.createPanel();

        scene.add.existing(this);
    }

    private createPanel(): void {
        const width = GAME_CONFIG.WIDTH;
        const height = GAME_CONFIG.HEIGHT;

        // 1. Semi-transparent background (Blocker)
        const blocker = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        blocker.setOrigin(0, 0);
        // Important: Stop propagation so clicks don't reach the UI underneath
        blocker.setInteractive();
        blocker.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
        });
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
            y: panelY - 70,
            width: 320,
            height: 70,
            text: this.getSoundText(),
            backgroundColor: this.audioService.isSoundEnabled() ? COLORS.SUCCESS : COLORS.DISABLED,
            onClick: () => this.toggleSound()
        });
        this.add(this.soundButton);

        // 5. Privacy Policy Button (Protected by Parental Gate)
        const privacyButton = new Button(this.scene, {
            x: panelX,
            y: panelY + 30,
            width: 320,
            height: 60,
            text: this.localizationService.translate('settings.privacy'),
            backgroundColor: COLORS.PRIMARY,
            fontSize: 24,
            onClick: () => {
                this.hide();
                this.parentGate.show();
            }
        });
        this.add(privacyButton);

        // Close Button
        const closeButton = new Button(this.scene, {
            x: panelX,
            y: panelY + 160,
            width: 200,
            height: 60,
            text: this.localizationService.translate('settings.close'),
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
        const status = this.audioService.isSoundEnabled() ? this.localizationService.translate('common.on') : this.localizationService.translate('common.off');
        return `${this.localizationService.translate('settings.sound')}: ${status}`;
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
