import type { Scene } from 'phaser';
import { LevelService } from './LevelService';

/**
 * AssetLoaderService handles lazy loading and cache management of game assets
 * Implements singleton pattern for global access
 */
export class AssetLoaderService {
    private static instance: AssetLoaderService | null = null;
    private loadedCategories: Set<string> = new Set();
    private readonly maxCachedCategories = 3;
    private categoryLoadOrder: string[] = [];

    private constructor() { }

    /**
     * Gets the singleton instance
     */
    public static getInstance(): AssetLoaderService {
        if (AssetLoaderService.instance === null) {
            AssetLoaderService.instance = new AssetLoaderService();
        }
        return AssetLoaderService.instance;
    }

    /**
     * Loads assets for a specific category
     */
    public async loadCategoryAssets(scene: Scene, categoryId: string): Promise<void> {
        // Already loaded, skip
        if (this.loadedCategories.has(categoryId)) {
            console.log(`[AssetLoader] Category ${categoryId} already loaded`);
            return;
        }

        console.log(`[AssetLoader] Loading assets for category: ${categoryId}`);

        const levelService = LevelService.getInstance();
        const category = levelService.getCategoryById(categoryId);

        if (category === null) {
            console.error(`[AssetLoader] Category not found: ${categoryId}`);
            return;
        }

        // Collect all unique image paths from all levels in this category
        const imagePaths = new Set<string>();
        category.levels.forEach((level) => {
            level.imagePaths.forEach((path) => imagePaths.add(path));
        });

        // Add category icon
        imagePaths.add(category.iconPath);

        // Load assets
        await this.loadAssets(scene, Array.from(imagePaths));

        // Mark as loaded
        this.loadedCategories.add(categoryId);
        this.categoryLoadOrder.push(categoryId);

        // Cleanup old categories if needed
        this.cleanupOldCategories(scene);

        console.log(`[AssetLoader] Loaded ${imagePaths.size} assets for ${categoryId}`);
    }

    /**
     * Loads an array of asset paths
     */
    private async loadAssets(scene: Scene, paths: string[]): Promise<void> {
        return new Promise((resolve) => {
            // If no paths to load, resolve immediately
            if (paths.length === 0) {
                resolve();
                return;
            }

            let assetsToLoad = 0;

            // Queue assets for loading
            paths.forEach((path) => {
                // Only load if not already in cache
                if (!scene.textures.exists(path)) {
                    scene.load.image(path, path);
                    assetsToLoad++;
                }
            });

            // If all assets are already cached, resolve immediately
            if (assetsToLoad === 0) {
                console.log('[AssetLoader] All assets already cached');
                resolve();
                return;
            }

            // Setup load complete callback
            const onLoadComplete = (): void => {
                scene.load.off('complete', onLoadComplete);
                scene.load.off('loaderror', onLoadError);
                resolve();
            };

            const onLoadError = (file: { key: string }): void => {
                console.error(`[AssetLoader] Error loading asset: ${file.key}`);
            };

            scene.load.once('complete', onLoadComplete);
            scene.load.on('loaderror', onLoadError);

            // Start loading
            scene.load.start();
        });
    }

    /**
     * Unloads assets for a specific category
     */
    public unloadCategoryAssets(scene: Scene, categoryId: string): void {
        if (!this.loadedCategories.has(categoryId)) {
            return;
        }

        console.log(`[AssetLoader] Unloading assets for category: ${categoryId}`);

        const levelService = LevelService.getInstance();
        const category = levelService.getCategoryById(categoryId);

        if (category === null) {
            return;
        }

        // Collect all image paths
        const imagePaths = new Set<string>();
        category.levels.forEach((level) => {
            level.imagePaths.forEach((path) => imagePaths.add(path));
        });

        // Remove textures from cache
        imagePaths.forEach((path) => {
            if (scene.textures.exists(path)) {
                scene.textures.remove(path);
            }
        });

        // Remove from loaded set
        this.loadedCategories.delete(categoryId);
        this.categoryLoadOrder = this.categoryLoadOrder.filter((id) => id !== categoryId);

        console.log(`[AssetLoader] Unloaded ${imagePaths.size} assets for ${categoryId}`);
    }

    /**
     * Cleans up old categories if cache limit is exceeded
     */
    private cleanupOldCategories(scene: Scene): void {
        while (this.categoryLoadOrder.length > this.maxCachedCategories) {
            const oldestCategory = this.categoryLoadOrder.shift();
            if (oldestCategory !== undefined) {
                this.unloadCategoryAssets(scene, oldestCategory);
            }
        }
    }

    /**
     * Checks if a category's assets are loaded
     */
    public isLoaded(categoryId: string): boolean {
        return this.loadedCategories.has(categoryId);
    }

    /**
     * Gets the list of currently loaded categories
     */
    public getLoadedCategories(): string[] {
        return Array.from(this.loadedCategories);
    }

    /**
     * Clears all loaded assets
     */
    public clearAll(scene: Scene): void {
        const categories = Array.from(this.loadedCategories);
        categories.forEach((categoryId) => {
            this.unloadCategoryAssets(scene, categoryId);
        });
    }
}
