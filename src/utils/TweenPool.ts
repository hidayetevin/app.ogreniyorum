import type { Scene } from 'phaser';

/**
 * TweenPool manages a pool of reusable tween objects to reduce GC pressure
 * and improve animation performance
 */
export class TweenPool {
    private static pools: Map<Scene, Phaser.Tweens.Tween[]> = new Map();
    private static readonly maxPoolSize = 20;

    /**
     * Gets a tween from the pool or creates a new one
     */
    public static get(scene: Scene, config: Phaser.Types.Tweens.TweenBuilderConfig): Phaser.Tweens.Tween {
        // For now, always create new tweens since Phaser's tween reuse is complex
        // Pool will store stopped tweens for potential future optimization
        const tween = scene.tweens.add(config);
        return tween;
    }

    /**
     * Returns a tween to the pool for reuse
     */
    public static release(scene: Scene, tween: Phaser.Tweens.Tween): void {
        const pool = this.getPool(scene);

        if (pool.length < this.maxPoolSize) {
            tween.stop();
            pool.push(tween);
        } else {
            // Pool is full, destroy the tween
            tween.remove();
        }
    }

    /**
     * Gets or creates a pool for a specific scene
     */
    private static getPool(scene: Scene): Phaser.Tweens.Tween[] {
        let pool = this.pools.get(scene);

        if (pool === undefined) {
            pool = [];
            this.pools.set(scene, pool);
        }

        return pool;
    }

    /**
     * Clears the pool for a specific scene
     */
    public static clearScene(scene: Scene): void {
        const pool = this.pools.get(scene);

        if (pool !== undefined) {
            pool.forEach((tween) => tween.remove());
            pool.length = 0;
            this.pools.delete(scene);
        }
    }

    /**
     * Clears all pools
     */
    public static clearAll(): void {
        this.pools.forEach((pool) => {
            pool.forEach((tween) => tween.remove());
        });
        this.pools.clear();
    }

    /**
     * Gets the current pool size for a scene
     */
    public static getPoolSize(scene: Scene): number {
        const pool = this.pools.get(scene);
        return pool !== undefined ? pool.length : 0;
    }
}
