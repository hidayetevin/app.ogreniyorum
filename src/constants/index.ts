/**
 * Game configuration constants
 */
export const GAME_CONFIG = {
    WIDTH: 720,
    HEIGHT: 1280,
    BACKGROUND_COLOR: '#2C3E50',
    PARENT: 'game-container',
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
    CARD_FLIP: 300,
    CARD_MATCH: 500,
    CARD_SHAKE: 200,
    SCENE_TRANSITION: 500,
    CONFETTI: 2000,
    BUTTON_PRESS: 100,
} as const;

/**
 * Grid configuration
 */
export const GRID_CONFIG = {
    CARD_WIDTH: 140,
    CARD_HEIGHT: 140,
    CARD_SPACING: 25,
    MIN_ROWS: 2,
    MAX_ROWS: 6,
    MIN_COLS: 2,
    MAX_COLS: 6,
} as const;

/**
 * Game timing constants (in milliseconds)
 */
export const TIMING = {
    WRONG_MATCH_DELAY: 1000, // Time to show wrong match before flipping back
    INPUT_LOCK_DURATION: 500, // Prevent spam clicking
    LEVEL_COMPLETE_DELAY: 1500, // Delay before showing completion screen
} as const;

/**
 * Color palette for the game
 */
export const COLORS = {
    PRIMARY: '#3498DB',
    SECONDARY: '#2ECC71',
    ACCENT: '#E74C3C',
    WARNING: '#F39C12',
    SUCCESS: '#27AE60',
    BACKGROUND: '#ECF0F1',
    TEXT_DARK: '#2C3E50',
    TEXT_LIGHT: '#FFFFFF',
    CARD_BACK: '#34495E',
    CARD_FRONT: '#FFFFFF',
    DISABLED: '#95A5A6',
} as const;

/**
 * Z-index layers for proper rendering order
 */
export const Z_INDEX = {
    BACKGROUND: 0,
    CARDS: 10,
    UI: 20,
    PARTICLES: 30,
    OVERLAY: 40,
    MODAL: 50,
} as const;

/**
 * Audio asset keys
 */
export const AUDIO_KEYS = {
    CARD_FLIP: 'card-flip',
    CORRECT_MATCH: 'correct-match',
    WRONG_MATCH: 'wrong-match',
    LEVEL_COMPLETE: 'level-complete',
    BUTTON_CLICK: 'button-click',
    BACKGROUND_MUSIC: 'background-music',
} as const;

/**
 * Scene keys
 */
export const SCENE_KEYS = {
    BOOT: 'BootScene',
    MAIN_MENU: 'MainMenuScene',
    CATEGORY_SELECTION: 'CategorySelectionScene',
    GAME_PLAY: 'GamePlayScene',
    LEVEL_COMPLETE: 'LevelCompleteScene',
} as const;

/**
 * Storage keys for LocalStorage
 */
export const STORAGE_KEYS = {
    SETTINGS: 'game-settings',
    PROGRESS: 'game-progress',
    ANALYTICS: 'game-analytics',
} as const;

import { Language } from '../types/models';

/**
 * Default settings
 */
export const DEFAULT_SETTINGS = {
    soundEnabled: true,
    musicEnabled: true,
    language: Language.TR,
    colorBlindMode: false,
    volume: 0.7,
};

/**
 * Default progress
 */
export const DEFAULT_PROGRESS = {
    totalStars: 0,
    levelsCompleted: 0,
    levelProgress: {},
    unlockedCategories: [] as string[],
};

/**
 * Star thresholds (moves required for each star rating)
 */
export const STAR_THRESHOLDS = {
    EASY: {
        threeStars: 8,
        twoStars: 12,
        oneStar: 20,
    },
    MEDIUM: {
        threeStars: 12,
        twoStars: 18,
        oneStar: 30,
    },
    HARD: {
        threeStars: 16,
        twoStars: 24,
        oneStar: 40,
    },
} as const;

/**
 * Performance targets
 */
export const PERFORMANCE = {
    TARGET_FPS: 60,
    MAX_PARTICLES: 100,
    SPRITE_ATLAS_MAX_SIZE: 2048,
} as const;

/**
 * Accessibility settings
 */
export const ACCESSIBILITY = {
    MIN_TOUCH_SIZE: 44, // Minimum touch target size in pixels (WCAG guideline)
    FOCUS_OUTLINE_WIDTH: 3,
    HIGH_CONTRAST_RATIO: 4.5, // WCAG AA standard
} as const;
