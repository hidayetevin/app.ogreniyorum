import type { ICategory, ILevel, ISettings, IProgress } from '../types/models';

/**
 * Type guard to check if value is a valid category
 */
export function isValidCategory(value: unknown): value is ICategory {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const category = value as Partial<ICategory>;

    return (
        typeof category.id === 'string' &&
        typeof category.name === 'string' &&
        typeof category.nameKey === 'string' &&
        typeof category.iconPath === 'string' &&
        typeof category.unlockRequirement === 'number' &&
        typeof category.isLocked === 'boolean' &&
        Array.isArray(category.levels)
    );
}

/**
 * Type guard to check if value is a valid level
 */
export function isValidLevel(value: unknown): value is ILevel {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const level = value as Partial<ILevel>;

    return (
        typeof level.id === 'string' &&
        typeof level.categoryId === 'string' &&
        typeof level.levelNumber === 'number' &&
        typeof level.rows === 'number' &&
        typeof level.cols === 'number' &&
        typeof level.pairCount === 'number' &&
        Array.isArray(level.imagePaths)
    );
}

/**
 * Type guard to check if value is valid settings
 */
export function isValidSettings(value: unknown): value is ISettings {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const settings = value as Partial<ISettings>;

    return (
        typeof settings.soundEnabled === 'boolean' &&
        typeof settings.musicEnabled === 'boolean' &&
        typeof settings.language === 'string' &&
        typeof settings.colorBlindMode === 'boolean' &&
        typeof settings.volume === 'number' &&
        settings.volume >= 0 &&
        settings.volume <= 1
    );
}

/**
 * Type guard to check if value is valid progress
 */
export function isValidProgress(value: unknown): value is IProgress {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const progress = value as Partial<IProgress>;

    return (
        typeof progress.totalStars === 'number' &&
        typeof progress.levelsCompleted === 'number' &&
        typeof progress.levelProgress === 'object' &&
        Array.isArray(progress.unlockedCategories)
    );
}

/**
 * Validates grid dimensions
 */
export function isValidGridDimensions(rows: number, cols: number, pairCount: number): boolean {
    const totalCells = rows * cols;
    const requiredCells = pairCount * 2;

    return (
        rows > 0 &&
        cols > 0 &&
        pairCount > 0 &&
        totalCells >= requiredCells &&
        totalCells % 2 === 0 // Must be even number of cells
    );
}

/**
 * Sanitizes string input to prevent XSS
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Validates number is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}

/**
 * Validates email format (for parent panel)
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Checks if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}
