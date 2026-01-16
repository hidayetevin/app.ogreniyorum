/**
 * Game state enumeration
 */
export enum GameState {
    IDLE = 'IDLE',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED',
}

/**
 * Language options
 */
export enum Language {
    TR = 'tr',
    EN = 'en',
}

/**
 * Difficulty levels
 */
export enum Difficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
}

/**
 * Card state during gameplay
 */
export enum CardState {
    FACE_DOWN = 'FACE_DOWN',
    FACE_UP = 'FACE_UP',
    MATCHED = 'MATCHED',
}

/**
 * Category interface
 */
export interface ICategory {
    id: string;
    name: string;
    nameKey: string; // Localization key
    description: string;
    descriptionKey: string; // Localization key
    iconPath: string;
    unlockRequirement: number; // Stars needed to unlock
    isLocked: boolean;
    levels: ILevel[];
}

/**
 * Level configuration interface
 */
export interface ILevel {
    id: string;
    categoryId: string;
    levelNumber: number;
    difficulty: Difficulty;
    rows: number;
    cols: number;
    pairCount: number;
    timeLimit?: number; // Optional time limit in seconds
    starThresholds: IStarThreshold;
    imagePaths: string[];
}

/**
 * Star threshold configuration
 */
export interface IStarThreshold {
    oneStar: number; // Maximum moves for 1 star
    twoStars: number; // Maximum moves for 2 stars
    threeStars: number; // Maximum moves for 3 stars
}

/**
 * Card data model
 */
export interface ICard {
    id: string;
    pairId: string; // Cards with same pairId are matches
    imagePath: string;
    state: CardState;
    gridPosition: IGridPosition;
}

/**
 * Grid position
 */
export interface IGridPosition {
    row: number;
    col: number;
}

/**
 * User settings
 */
export interface ISettings {
    soundEnabled: boolean;
    musicEnabled: boolean;
    language: Language;
    colorBlindMode: boolean;
    volume: number; // 0-1
}

/**
 * Player progress for a specific level
 */
export interface ILevelProgress {
    levelId: string;
    categoryId: string;
    completed: boolean;
    stars: number; // 0-3
    bestMoves: number;
    bestTime: number; // in seconds
    attempts: number;
    lastPlayedAt: number; // timestamp
}

/**
 * Overall player progress
 */
export interface IProgress {
    totalStars: number;
    levelsCompleted: number;
    levelProgress: Record<string, ILevelProgress>; // levelId -> progress
    unlockedCategories: string[]; // category IDs
    currentStreak: number; // Consecutive days played
    lastPlayedDate: string; // ISO date string (YYYY-MM-DD)
    totalPlayTime: number; // Total play time in milliseconds
    unlockedCardBacks: string[]; // IDs of unlocked card backs
    selectedCardBack: string; // ID of the currently selected card back
}

/**
 * Game session data
 */
export interface IGameSession {
    levelId: string;
    categoryId: string;
    startTime: number;
    moves: number;
    matches: number;
    totalPairs: number;

    elapsedTime: number; // in seconds
}

/**
 * Analytics event
 */
export interface IAnalyticsEvent {
    eventType: AnalyticsEventType;
    timestamp: number;
    data: Record<string, unknown>;
}

/**
 * Analytics event types
 */
export enum AnalyticsEventType {
    LEVEL_START = 'LEVEL_START',
    LEVEL_COMPLETE = 'LEVEL_COMPLETE',
    LEVEL_FAIL = 'LEVEL_FAIL',
    CATEGORY_SELECT = 'CATEGORY_SELECT',
    SETTINGS_CHANGE = 'SETTINGS_CHANGE',
    AD_SHOW = 'AD_SHOW',
    AD_REWARD = 'AD_REWARD',
}

/**
 * Feedback type for visual/audio feedback
 */
export enum FeedbackType {
    CORRECT_MATCH = 'CORRECT_MATCH',
    WRONG_MATCH = 'WRONG_MATCH',
    CARD_FLIP = 'CARD_FLIP',
    LEVEL_COMPLETE = 'LEVEL_COMPLETE',
    BUTTON_CLICK = 'BUTTON_CLICK',
}

/**
 * Achievement condition types
 */
export enum AchievementConditionType {
    COMPLETE_LEVEL = 'COMPLETE_LEVEL',
    EARN_THREE_STARS = 'EARN_THREE_STARS',
    COLLECT_STARS = 'COLLECT_STARS',
    COMPLETE_CATEGORY = 'COMPLETE_CATEGORY',
    FAST_MATCH = 'FAST_MATCH',
    STREAK_DAYS = 'STREAK_DAYS',
    COMPLETE_LEVELS = 'COMPLETE_LEVELS',
    COMPLETE_ALL_CATEGORIES = 'COMPLETE_ALL_CATEGORIES',
}

/**
 * Achievement condition
 */
export interface IAchievementCondition {
    type: AchievementConditionType;
    value: number;
}

/**
 * Achievement definition
 */
export interface IAchievement {
    id: string;
    nameKey: string;
    descriptionKey: string;
    iconEmoji: string;
    condition: IAchievementCondition;
    reward: number; // Bonus stars
}

/**
 * Achievement progress tracking
 */
export interface IAchievementProgress {
    unlockedAchievements: string[]; // Achievement IDs
    totalBonusStars: number;
    lastUnlockedAt?: number; // Timestamp
}

/**
 * Card back customization
 */
export interface ICardBack {
    id: string;
    name: string;
    nameKey: string; // Localization key
    imagePath: string;
    unlockCost: number; // Stars required to unlock
    isDefault?: boolean; // Whether this is the default card back
}
