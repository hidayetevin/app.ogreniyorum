import type { IFeedbackService } from '../types/services';
import { FeedbackType } from '../types/models';
import { ANIMATION_DURATION, COLORS, Z_INDEX } from '@constants/index';
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
    public triggerFeedback(type: FeedbackType, x?: number, y?: number): void {
        switch (type) {
            case FeedbackType.CORRECT_MATCH:
                this.audioService.playSound('correct-match');
                if (x !== undefined && y !== undefined) {
                    this.showConfetti(x, y);
                }
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

    /**
     * Shows confetti particle effect
     */
    public showConfetti(x: number, y: number): void {
        if (this.scene === null) {
            return;
        }

        const colors = [COLORS.PRIMARY, COLORS.SECONDARY, COLORS.ACCENT, COLORS.WARNING];

        // Create particle emitter
        const texture = this.scene.textures.exists('star') ? 'star' : 'confetti';

        const particles = this.scene.add.particles(x, y, texture, {
            speed: { min: 150, max: 350 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            lifespan: ANIMATION_DURATION.CONFETTI,
            quantity: 30,
            tint: colors.map((c) => parseInt(c.replace('#', ''), 16)),
            gravityY: 350,
            rotate: { start: 0, end: 360 }
        });

        particles.setDepth(Z_INDEX.PARTICLES);

        // Auto-destroy after animation
        this.scene.time.delayedCall(ANIMATION_DURATION.CONFETTI, () => {
            particles.destroy();
        });
    }

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
