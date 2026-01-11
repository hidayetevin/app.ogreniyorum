/**
 * Battery optimization utility
 * Reduces FPS and resource usage when app is in background
 */
export class BatteryOptimizer {
    private game: Phaser.Game | null = null;
    private originalFPS: number = 60;
    private backgroundFPS: number = 30;

    /**
     * Initialize battery optimizer with game instance
     */
    public init(game: Phaser.Game): void {
        this.game = game;
        this.originalFPS = game.loop.targetFps;
        this.setupVisibilityListener();
    }

    /**
     * Setup visibility change listener
     */
    private setupVisibilityListener(): void {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onBackground();
            } else {
                this.onForeground();
            }
        });
    }

    /**
     * Called when app goes to background
     */
    private onBackground(): void {
        if (!this.game) return;

        console.log('[BatteryOptimizer] App in background, reducing FPS');
        this.game.loop.targetFps = this.backgroundFPS;

        // Pause audio if needed
        this.game.sound.pauseAll();
    }

    /**
     * Called when app comes to foreground
     */
    private onForeground(): void {
        if (!this.game) return;

        console.log('[BatteryOptimizer] App in foreground, restoring FPS');
        this.game.loop.targetFps = this.originalFPS;

        // Resume audio
        this.game.sound.resumeAll();
    }

    /**
     * Manually set background FPS
     */
    public setBackgroundFPS(fps: number): void {
        this.backgroundFPS = fps;
    }
}

// Singleton instance
export const batteryOptimizer = new BatteryOptimizer();
