import { GAME_CONFIG, COLORS, Z_INDEX } from '@constants/index';
import type { IAchievement } from '../types/models';

/**
 * AchievementNotification displays a popup when an achievement is unlocked
 */
export class AchievementNotification extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Graphics;
    private iconText: Phaser.GameObjects.Text;
    private titleText: Phaser.GameObjects.Text;
    private descriptionText: Phaser.GameObjects.Text;
    private rewardText: Phaser.GameObjects.Text;
    // confettiParticles removed - feature removed per user request

    constructor(scene: Phaser.Scene) {
        super(scene, GAME_CONFIG.WIDTH / 2, -200); // Start off-screen

        const width = 400;
        const height = 180;

        // Background with glow effect
        this.background = scene.add.graphics();
        this.background.fillStyle(parseInt(COLORS.PRIMARY.replace('#', ''), 16), 0.95);
        this.background.fillRoundedRect(-width / 2, 0, width, height, 16);
        this.background.lineStyle(4, parseInt(COLORS.WARNING.replace('#', ''), 16), 1);
        this.background.strokeRoundedRect(-width / 2, 0, width, height, 16);
        this.add(this.background);

        // "NEW ACHIEVEMENT!" header
        const headerText = scene.add.text(0, 15, '🎉 YENİ BAŞARI!', {
            fontSize: '24px',
            color: COLORS.WARNING,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
        });
        headerText.setOrigin(0.5);
        this.add(headerText);

        // Icon (emoji)
        this.iconText = scene.add.text(-150, 70, '', {
            fontSize: '48px',
        });
        this.iconText.setOrigin(0.5);
        this.add(this.iconText);

        // Achievement title
        this.titleText = scene.add.text(0, 60, '', {
            fontSize: '22px',
            color: COLORS.TEXT_LIGHT,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
        });
        this.titleText.setOrigin(0.5, 0);
        this.add(this.titleText);

        // Achievement description
        this.descriptionText = scene.add.text(0, 90, '', {
            fontSize: '16px',
            color: COLORS.TEXT_LIGHT,
            fontFamily: 'Arial, sans-serif',
            align: 'center',
            wordWrap: { width: width - 100 },
        });
        this.descriptionText.setOrigin(0.5, 0);
        this.add(this.descriptionText);

        // Reward text
        this.rewardText = scene.add.text(0, 140, '', {
            fontSize: '18px',
            color: COLORS.WARNING,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
        });
        this.rewardText.setOrigin(0.5);
        this.add(this.rewardText);

        this.setDepth(Z_INDEX.OVERLAY + 10);
        this.setVisible(false);

        // Add to scene
        scene.add.existing(this);
    }

    /**
     * Shows the notification with achievement data
     */
    public show(achievement: IAchievement, achievementName: string, achievementDescription: string): void {
        // Update texts
        this.iconText.setText(achievement.iconEmoji);
        this.titleText.setText(achievementName);
        this.descriptionText.setText(achievementDescription);
        this.rewardText.setText(`+${achievement.reward} Bonus Yıldız ⭐`);

        // Make visible
        this.setVisible(true);

        // Confetti removed - user doesn't like the visual effect

        // Slide in animation
        this.scene.tweens.add({
            targets: this,
            y: 150,
            duration: 600,
            ease: 'Back.out',
            onComplete: () => {
                // Auto-hide after 3 seconds
                this.scene.time.delayedCall(3000, () => {
                    this.hide();
                });
            },
        });

        // Pulsing animation
        this.scene.tweens.add({
            targets: this.iconText,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut',
        });
    }

    /**
     * Hides the notification
     */
    public hide(): void {
        this.scene.tweens.add({
            targets: this,
            y: -200,
            duration: 400,
            ease: 'Back.in',
            onComplete: () => {
                this.setVisible(false);
                // confettiParticles cleanup removed - feature removed
            },
        });
    }

    // createConfetti method removed - feature removed per user request

    /**
     * Cleanup
     */
    public override destroy(fromScene?: boolean): void {
        this.background.destroy();
        // confettiParticles cleanup removed - feature removed
        super.destroy(fromScene);
    }
}
