import type { ILevelService, ICategory, ILevel } from '../types/services';
import type { IStarThreshold } from '../types/models';
import { isValidCategory, isValidLevel } from '@utils/validation';

/**
 * LevelService manages game levels and categories
 */
export class LevelService implements ILevelService {
    private static instance: LevelService | null = null;
    private categories: ICategory[] = [];
    private levelsMap: Map<string, ILevel> = new Map();
    private initialized: boolean = false;

    private constructor() { }

    /**
     * Gets the singleton instance
     */
    public static getInstance(): LevelService {
        if (LevelService.instance === null) {
            LevelService.instance = new LevelService();
        }
        return LevelService.instance;
    }

    /**
     * Initializes the service by loading configuration
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            // Load categories configuration with cache busting
            const categoriesResponse = await fetch(`/config/categories.json?t=${Date.now()}`);
            const categoriesData = (await categoriesResponse.json()) as unknown;

            if (!Array.isArray(categoriesData)) {
                throw new Error('Invalid categories data format');
            }

            // Validate and store categories
            this.categories = categoriesData.filter((cat) => {
                if (!isValidCategory(cat)) {
                    console.warn('Invalid category detected:', cat);
                    return false;
                }
                return true;
            });

            // Build levels map
            this.categories.forEach((category) => {
                category.levels.forEach((level) => {
                    if (isValidLevel(level)) {
                        this.levelsMap.set(level.id, level);
                    }
                });
            });

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize LevelService:', error);
            throw error;
        }
    }

    /**
     * Gets all categories
     */
    public getCategories(): ICategory[] {
        return [...this.categories];
    }

    /**
     * Gets a category by ID
     */
    public getCategoryById(categoryId: string): ICategory | null {
        return this.categories.find((cat) => cat.id === categoryId) ?? null;
    }

    /**
     * Gets a level by ID
     */
    public getLevelById(levelId: string): ILevel | null {
        return this.levelsMap.get(levelId) ?? null;
    }

    /**
     * Gets all levels for a category
     */
    public getLevelsByCategory(categoryId: string): ILevel[] {
        const category = this.getCategoryById(categoryId);
        return category?.levels ?? [];
    }

    /**
     * Checks if a category is unlocked based on total stars
     */
    public isCategoryUnlocked(categoryId: string, totalStars: number): boolean {
        const category = this.getCategoryById(categoryId);

        if (category === null) {
            return false;
        }

        return totalStars >= category.unlockRequirement;
    }

    /**
     * Calculates stars earned based on moves and thresholds
     */
    public calculateStars(moves: number, starThresholds: IStarThreshold): number {
        if (moves <= starThresholds.threeStars) {
            return 3;
        }

        if (moves <= starThresholds.twoStars) {
            return 2;
        }

        if (moves <= starThresholds.oneStar) {
            return 1;
        }

        return 0;
    }

    /**
     * Gets the next level in sequence
     */
    public getNextLevel(currentLevelId: string): ILevel | null {
        const currentLevel = this.getLevelById(currentLevelId);

        if (currentLevel === null) {
            return null;
        }

        const categoryLevels = this.getLevelsByCategory(currentLevel.categoryId);
        const currentIndex = categoryLevels.findIndex((level) => level.id === currentLevelId);

        if (currentIndex === -1 || currentIndex === categoryLevels.length - 1) {
            return null;
        }

        return categoryLevels[currentIndex + 1] ?? null;
    }

    /**
     * Gets the previous level in sequence
     */
    public getPreviousLevel(currentLevelId: string): ILevel | null {
        const currentLevel = this.getLevelById(currentLevelId);

        if (currentLevel === null) {
            return null;
        }

        const categoryLevels = this.getLevelsByCategory(currentLevel.categoryId);
        const currentIndex = categoryLevels.findIndex((level) => level.id === currentLevelId);

        if (currentIndex <= 0) {
            return null;
        }

        return categoryLevels[currentIndex - 1] ?? null;
    }
}
