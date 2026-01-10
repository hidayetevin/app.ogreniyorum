import type { IStorageService } from '../types/services';
import type { ISettings, IProgress, ILevelProgress } from '../types/models';
import { STORAGE_KEYS, DEFAULT_SETTINGS, DEFAULT_PROGRESS } from '@constants/index';
import { isValidSettings, isValidProgress } from '@utils/validation';

/**
 * StorageService handles all LocalStorage operations
 * Implements singleton pattern for global access
 */
export class StorageService implements IStorageService {
    private static instance: StorageService | null = null;

    private constructor() {
        this.validateStorage();
    }

    /**
     * Gets the singleton instance
     */
    public static getInstance(): StorageService {
        if (StorageService.instance === null) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    /**
     * Validates that localStorage is available
     */
    private validateStorage(): void {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
        } catch (error) {
            console.error('LocalStorage is not available:', error);
        }
    }

    /**
     * Safely gets an item from localStorage
     */
    private getItem<T>(key: string, defaultValue: T): T {
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item) as T;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return defaultValue;
        }
    }

    /**
     * Safely sets an item in localStorage
     */
    private setItem<T>(key: string, value: T): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error writing ${key} to localStorage:`, error);
        }
    }

    /**
     * Saves user settings
     */
    public saveSettings(settings: ISettings): void {
        if (!isValidSettings(settings)) {
            console.error('Invalid settings object');
            return;
        }
        this.setItem(STORAGE_KEYS.SETTINGS, settings);
    }

    /**
     * Loads user settings
     */
    public loadSettings(): ISettings {
        const settings = this.getItem<ISettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

        if (!isValidSettings(settings)) {
            console.warn('Corrupted settings detected, using defaults');
            return { ...DEFAULT_SETTINGS };
        }

        return settings;
    }

    /**
     * Saves overall progress
     */
    public saveProgress(progress: IProgress): void {
        if (!isValidProgress(progress)) {
            console.error('Invalid progress object');
            return;
        }
        this.setItem(STORAGE_KEYS.PROGRESS, progress);
    }

    /**
     * Loads overall progress
     */
    public loadProgress(): IProgress {
        const progress = this.getItem<IProgress>(STORAGE_KEYS.PROGRESS, DEFAULT_PROGRESS);

        if (!isValidProgress(progress)) {
            console.warn('Corrupted progress detected, using defaults');
            return { ...DEFAULT_PROGRESS };
        }

        return progress;
    }

    /**
     * Saves progress for a specific level
     */
    public saveLevelProgress(levelProgress: ILevelProgress): void {
        const progress = this.loadProgress();
        progress.levelProgress[levelProgress.levelId] = levelProgress;

        // Update total stats
        const completedLevels = Object.values(progress.levelProgress).filter((lp) => lp.completed);
        progress.levelsCompleted = completedLevels.length;
        progress.totalStars = completedLevels.reduce((sum, lp) => sum + lp.stars, 0);

        this.saveProgress(progress);
    }

    /**
     * Gets progress for a specific level
     */
    public getLevelProgress(levelId: string): ILevelProgress | null {
        const progress = this.loadProgress();
        return progress.levelProgress[levelId] ?? null;
    }

    /**
     * Clears all stored data
     */
    public clearAllData(): void {
        try {
            localStorage.removeItem(STORAGE_KEYS.SETTINGS);
            localStorage.removeItem(STORAGE_KEYS.PROGRESS);
            localStorage.removeItem(STORAGE_KEYS.ANALYTICS);
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    }

    /**
     * Checks if stored data is corrupted
     */
    public isDataCorrupted(): boolean {
        const settings = this.getItem<unknown>(STORAGE_KEYS.SETTINGS, null);
        const progress = this.getItem<unknown>(STORAGE_KEYS.PROGRESS, null);

        if (settings !== null && !isValidSettings(settings)) {
            return true;
        }

        if (progress !== null && !isValidProgress(progress)) {
            return true;
        }

        return false;
    }
}
