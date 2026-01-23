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
     * Cleanup resources
     */
    public cleanup(): void {
        this.scene = null;
    }
}
