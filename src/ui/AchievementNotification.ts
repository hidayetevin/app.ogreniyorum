import { GAME_CONFIG, COLORS, Z_INDEX, FONTS } from '@constants/index';
import type { IAchievement } from '../types/models';

/**
 * AchievementNotification displays a premium popup when an achievement is unlocked
 */
export class AchievementNotification extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Graphics;
    private iconText: Phaser.GameObjects.Text;
    private titleText: Phaser.GameObjects.Text;
    private descriptionText: Phaser.GameObjects.Text;
    private rewardText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        super(scene, GAME_CONFIG.WIDTH / 2, -250); // Start off-screen

        const width = 450;
        const height = 200;

        // Background (Glassy Header)
        this.background = scene.add.graphics();
        // Shadow
        this.background.fillStyle(0x000000, 0.4);
        this.background.fillRoundedRect(-width / 2 + 5, 5, width, height, 25);
        // Body (Gradient)
        this.background.fillGradientStyle(
            Phaser.Display.Color.HexStringToColor(COLORS.PRIMARY).color,
            Phaser.Display.Color.HexStringToColor(COLORS.PRIMARY).color,
            Phaser.Display.Color.HexStringToColor('#3D1B7B').color,
            Phaser.Display.Color.HexStringToColor('#3D1B7B').color,
            0.9
        );
        this.background.fillRoundedRect(-width / 2, 0, width, height, 25);
        // Stroke
        this.background.lineStyle(3, 0xffffff, 0.2);
        this.background.strokeRoundedRect(-width / 2, 0, width, height, 25);
        this.add(this.background);

        // Header text with Outfit
        const headerText = scene.add.text(0, 20, '🎉 YENİ BAŞARI!', {
            fontSize: '28px',
            color: COLORS.WARNING,
            fontFamily: FONTS.PRIMARY,
            fontStyle: '800',
        });
        headerText.setOrigin(0.5);
        this.add(headerText);

        // Icon (emoji)
        this.iconText = scene.add.text(-160, 85, '', {
            fontSize: '56px',
        });
        this.iconText.setOrigin(0.5);
        this.add(this.iconText);

        // Achievement title
        this.titleText = scene.add.text(20, 70, '', {
            fontSize: '26px',
            color: COLORS.TEXT_LIGHT,
            fontFamily: FONTS.PRIMARY,
            fontStyle: '800',
        });
        this.titleText.setOrigin(0.5, 0);
        this.add(this.titleText);

        // Achievement description
        this.descriptionText = scene.add.text(20, 105, '', {
            fontSize: '18px',
            color: COLORS.TEXT_LIGHT,
            fontFamily: FONTS.SECONDARY,
            align: 'center',
            wordWrap: { width: width - 120 },
        });
        this.descriptionText.setOrigin(0.5, 0);
        this.add(this.descriptionText);

        // Reward text
        this.rewardText = scene.add.text(0, 165, '', {
            fontSize: '20px',
            color: COLORS.WARNING,
            fontFamily: FONTS.PRIMARY,
            fontStyle: '800',
        });
        this.rewardText.setOrigin(0.5);
        this.add(this.rewardText);

        this.setDepth(Z_INDEX.OVERLAY + 10);
        this.setVisible(false);
        scene.add.existing(this);
    }

    public show(achievement: IAchievement, achievementName: string, achievementDescription: string): void {
        this.iconText.setText(achievement.iconEmoji);
        this.titleText.setText(achievementName);
        this.descriptionText.setText(achievementDescription);
        this.rewardText.setText(`+${achievement.reward} Bonus Yıldız ⭐`);
        this.setVisible(true);

        this.scene.tweens.add({
            targets: this,
            y: 180,
            duration: 700,
            ease: 'Back.out',
            onComplete: () => {
                this.scene.time.delayedCall(3500, () => this.hide());
            },
        });

        this.scene.tweens.add({
            targets: this.iconText,
            scale: 1.3,
            duration: 500,
            yoyo: true,
            repeat: 2,
            ease: 'Cubic.easeInOut',
        });
    }

    public hide(): void {
        this.scene.tweens.add({
            targets: this,
            y: -250,
            duration: 500,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                this.setVisible(false);
            },
        });
    }

    public override destroy(fromScene?: boolean): void {
        this.background.destroy();
        super.destroy(fromScene);
    }
}
