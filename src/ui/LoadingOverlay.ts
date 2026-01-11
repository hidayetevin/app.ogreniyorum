import { GAME_CONFIG, COLORS, Z_INDEX } from '@constants/index';

/**
 * LoadingOverlay displays a progress bar during asset loading
 */
export class LoadingOverlay extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private progressBarBg: Phaser.GameObjects.Graphics;
    private progressBar: Phaser.GameObjects.Graphics;
    private loadingText: Phaser.GameObjects.Text;
    private percentText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        // Semi-transparent background
        this.background = scene.add.rectangle(
            GAME_CONFIG.WIDTH / 2,
            GAME_CONFIG.HEIGHT / 2,
            GAME_CONFIG.WIDTH,
            GAME_CONFIG.HEIGHT,
            0x000000,
            0.7
        );
        this.add(this.background);

        // Loading text
        this.loadingText = scene.add.text(
            GAME_CONFIG.WIDTH / 2,
            GAME_CONFIG.HEIGHT / 2 - 60,
            'Yükleniyor...',
            {
                fontSize: '32px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
            }
        );
        this.loadingText.setOrigin(0.5);
        this.add(this.loadingText);

        // Progress bar background
        const barWidth = 400;
        const barHeight = 30;
        const barX = GAME_CONFIG.WIDTH / 2 - barWidth / 2;
        const barY = GAME_CONFIG.HEIGHT / 2;

        this.progressBarBg = scene.add.graphics();
        this.progressBarBg.fillStyle(0x222222, 0.8);
        this.progressBarBg.fillRect(barX, barY, barWidth, barHeight);
        this.add(this.progressBarBg);

        // Progress bar
        this.progressBar = scene.add.graphics();
        this.add(this.progressBar);

        // Percentage text
        this.percentText = scene.add.text(
            GAME_CONFIG.WIDTH / 2,
            GAME_CONFIG.HEIGHT / 2 + 50,
            '0%',
            {
                fontSize: '24px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: 'Arial, sans-serif',
            }
        );
        this.percentText.setOrigin(0.5);
        this.add(this.percentText);

        // Set depth
        this.setDepth(Z_INDEX.OVERLAY);

        // Initially hidden
        this.setVisible(false);

        // Add to scene
        scene.add.existing(this);
    }

    /**
     * Updates the progress bar
     */
    public updateProgress(progress: number): void {
        const barWidth = 400;
        const barHeight = 30;
        const barX = GAME_CONFIG.WIDTH / 2 - barWidth / 2;
        const barY = GAME_CONFIG.HEIGHT / 2;

        // Clamp progress between 0 and 1
        const clampedProgress = Math.max(0, Math.min(1, progress));

        // Update progress bar
        this.progressBar.clear();
        this.progressBar.fillStyle(parseInt(COLORS.PRIMARY.replace('#', ''), 16), 1);
        this.progressBar.fillRect(barX, barY, barWidth * clampedProgress, barHeight);

        // Update percentage text
        this.percentText.setText(`${Math.round(clampedProgress * 100)}%`);
    }

    /**
     * Shows the loading overlay
     */
    public show(): void {
        this.setVisible(true);
        this.updateProgress(0);
    }

    /**
     * Hides the loading overlay
     */
    public hide(): void {
        this.setVisible(false);
    }

    /**
     * Cleanup
     */
    public override destroy(fromScene?: boolean): void {
        this.progressBar.destroy();
        this.progressBarBg.destroy();
        super.destroy(fromScene);
    }
}
