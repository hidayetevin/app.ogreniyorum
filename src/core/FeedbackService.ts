import type { IFeedbackService } from '../types/services';
import { FeedbackType } from '../types/models';
import { ANIMATION_DURATION, COLORS } from '@constants/index';
import { AudioService } from './AudioService';

/**
 * FeedbackService provides visual and audio feedback
 */
export class FeedbackService implements IFeedbackService {
    private static instance: FeedbackService | null = null;
    private scene: Phaser.Scene | null = null;
    private audioService: AudioService;

    private constructor() {
        this.audioService = AudioService.getInstance();
    }

    /**
     * Gets the singleton instance
     */
    public static getInstance(): FeedbackService {
        if (FeedbackService.instance === null) {
            FeedbackService.instance = new FeedbackService();
        }
        return FeedbackService.instance;
    }

    /**
     * Initializes the service with a scene
     */
    public initialize(scene: Phaser.Scene): void {
        this.scene = scene;
    }

    /**
     * Triggers appropriate feedback based on type
     */
    public triggerFeedback(type: FeedbackType): void {
        switch (type) {
            case FeedbackType.CORRECT_MATCH:
                this.audioService.playSound('correct-match');
                // Confetti removed - user doesn't like the visual effect
                break;

            case FeedbackType.WRONG_MATCH:
                this.audioService.playSound('wrong-match');
                break;

            case FeedbackType.CARD_FLIP:
                this.audioService.playSound('card-flip');
                break;

            case FeedbackType.LEVEL_COMPLETE:
                this.audioService.playSound('level-complete');
                break;

            case FeedbackType.BUTTON_CLICK:
                this.audioService.playSound('button-click');
                break;
        }
    }

    // showConfetti method removed - confetti effect was removed per user request

    /**
     * Shows shake effect on a game object
     */
    public showShake(target: Phaser.GameObjects.GameObject): void {
        if (this.scene === null) {
            return;
        }

        const gameObject = target as Phaser.GameObjects.GameObject & {
            x?: number;
            y?: number;
        };

        if (gameObject.x === undefined || gameObject.y === undefined) {
            return;
        }

        const originalX = gameObject.x;

        this.scene.tweens.add({
            targets: target,
            x: originalX - 10,
            duration: ANIMATION_DURATION.CARD_SHAKE / 4,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                if ('x' in target) {
                    (target as { x: number }).x = originalX;
                }
            },
        });
    }

    /**
     * Shows a pulsing scale effect
     */
    public showPulse(target: Phaser.GameObjects.GameObject): void {
        if (this.scene === null) {
            return;
        }

        this.scene.tweens.add({
            targets: target,
            scale: 1.1,
            duration: 200,
            yoyo: true,
            ease: 'Sine.easeInOut',
        });
    }

    /**
     * Shows a glow effect
     */
    public showGlow(target: Phaser.GameObjects.GameObject): void {
        if (this.scene === null) {
            return;
        }

        const gameObject = target as Phaser.GameObjects.GameObject & {
            setTint?: (tint: number) => void;
            clearTint?: () => void;
        };

        if (gameObject.setTint === undefined || gameObject.clearTint === undefined) {
            return;
        }

        const glowColor = parseInt(COLORS.SUCCESS.replace('#', ''), 16);

        this.scene.tweens.add({
            targets: target,
            duration: 500,
            yoyo: true,
            onStart: () => {
                gameObject.setTint?.(glowColor);
            },
            onComplete: () => {
                gameObject.clearTint?.();
            },
        });
    }

    /**
     * Shows a toast notification message
     */
    public showToast(message: string): void {
        if (this.scene === null) {
            console.warn('[FeedbackService] Scene not initialized, cannot show toast:', message);
            return;
        }

        const scene = this.scene;
        const centerX = 360; // GAME_CONFIG.WIDTH / 2 usually
        const bottomY = 700; // Target position

        const container = scene.add.container(centerX, bottomY + 50);
        container.setDepth(2000);

        // Background (Glassmorphism)
        const textObj = scene.add.text(0, 0, message, {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            padding: { x: 20, y: 10 }
        });
        textObj.setOrigin(0.5);

        const bg = scene.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        const bgWidth = textObj.width + 40;
        const bgHeight = textObj.height + 20;
        bg.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 15);
        bg.lineStyle(2, 0xffffff, 0.2);
        bg.strokeRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 15);

        container.add(bg);
        container.add(textObj);

        // Animation: Slide up and fade in
        scene.tweens.add({
            targets: container,
            y: bottomY,
            alpha: { from: 0, to: 1 },
            duration: 300,
            ease: 'Back.out',
            onComplete: () => {
                // Stay for 2 seconds then fade out
                scene.time.delayedCall(2500, () => {
                    scene.tweens.add({
                        targets: container,
                        y: bottomY - 50,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => container.destroy()
                    });
                });
            }
        });
    }

    /**
     * Cleanup resources
     */
    public cleanup(): void {
        this.scene = null;
    }
}
