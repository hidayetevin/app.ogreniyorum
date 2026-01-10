import type {
    ISettings,
    IProgress,
    ILevelProgress,
    IAnalyticsEvent,
    FeedbackType,
    ICategory,
    ILevel,
    IStarThreshold,
    AnalyticsEventType,
} from './models';

/**
 * Audio service interface
 */
export interface IAudioService {
    initialize(scene: Phaser.Scene): Promise<void>;
    playSound(key: string): void;
    playMusic(key: string, loop?: boolean): void;
    stopMusic(): void;
    setVolume(volume: number): void;
    setSoundEnabled(enabled: boolean): void;
    setMusicEnabled(enabled: boolean): void;
    isSoundEnabled(): boolean;
    isMusicEnabled(): boolean;
}

/**
 * Feedback service interface
 */
export interface IFeedbackService {
    initialize(scene: Phaser.Scene): void;
    triggerFeedback(type: FeedbackType, x?: number, y?: number): void;
    showConfetti(x: number, y: number): void;
    showShake(target: Phaser.GameObjects.GameObject): void;
    cleanup(): void;
}

/**
 * Storage service interface
 */
export interface IStorageService {
    saveSettings(settings: ISettings): void;
    loadSettings(): ISettings;
    saveProgress(progress: IProgress): void;
    loadProgress(): IProgress;
    saveLevelProgress(levelProgress: ILevelProgress): void;
    getLevelProgress(levelId: string): ILevelProgress | null;
    clearAllData(): void;
    isDataCorrupted(): boolean;
}

/**
 * Level service interface
 */
export interface ILevelService {
    initialize(): Promise<void>;
    getCategories(): ICategory[];
    getCategoryById(categoryId: string): ICategory | null;
    getLevelById(levelId: string): ILevel | null;
    getLevelsByCategory(categoryId: string): ILevel[];
    isCategoryUnlocked(categoryId: string, totalStars: number): boolean;
    calculateStars(moves: number, starThresholds: IStarThreshold): number;
}

/**
 * Analytics service interface
 */
export interface IAnalyticsService {
    initialize(): void;
    trackEvent(eventType: AnalyticsEventType, data?: Record<string, unknown>): void;
    getEvents(): IAnalyticsEvent[];
    clearEvents(): void;
}

/**
 * Localization service interface
 */
export interface ILocalizationService {
    initialize(language: string): Promise<void>;
    setLanguage(language: string): Promise<void>;
    translate(key: string, params?: Record<string, string>): string;
    getCurrentLanguage(): string;
}

// Re-export for convenience
export type { ICategory, ILevel, IStarThreshold } from './models';
