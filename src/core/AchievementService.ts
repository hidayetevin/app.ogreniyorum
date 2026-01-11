import type { IAchievement, IAchievementProgress } from '../types/models';
import { STORAGE_KEYS } from '@constants/index';
import achievementsData from '../config/achievements.json';

/**
 * AchievementService manages achievement unlocking and tracking
 * Implements singleton pattern for global access
 */
export class AchievementService {
    private static instance: AchievementService | null = null;
    private achievements: IAchievement[] = [];
    private progress: IAchievementProgress = {
        unlockedAchievements: [],
        totalBonusStars: 0,
    };

    private constructor() { }

    /**
     * Gets the singleton instance
     */
    public static getInstance(): AchievementService {
        if (AchievementService.instance === null) {
            AchievementService.instance = new AchievementService();
        }
        return AchievementService.instance;
    }

    /**
     * Initializes the achievement system
     */
    public async initialize(): Promise<void> {
        // Load achievements from JSON
        this.achievements = achievementsData as IAchievement[];

        // Load progress from storage
        this.loadProgress();

        console.log(`[AchievementService] Initialized with ${this.achievements.length} achievements`);
    }

    /**
     * Checks for newly unlocked achievements based on game events
     */
    public checkAchievements(stats: {
        levelsCompleted?: number;
        totalStars?: number;
        threeStarLevels?: number;
        categoriesCompleted?: number;
        currentStreak?: number;
        fastMatches?: number;
    }): IAchievement[] {
        const newlyUnlocked: IAchievement[] = [];

        this.achievements.forEach((achievement) => {
            // Skip if already unlocked
            if (this.isUnlocked(achievement.id)) {
                return;
            }

            // Check condition
            let conditionMet = false;
            const { type, value } = achievement.condition;

            switch (type) {
                case 'COMPLETE_LEVEL':
                    conditionMet = (stats.levelsCompleted ?? 0) >= value;
                    break;
                case 'EARN_THREE_STARS':
                    conditionMet = (stats.threeStarLevels ?? 0) >= value;
                    break;
                case 'COLLECT_STARS':
                    conditionMet = (stats.totalStars ?? 0) >= value;
                    break;
                case 'COMPLETE_CATEGORY':
                    conditionMet = (stats.categoriesCompleted ?? 0) >= value;
                    break;
                case 'STREAK_DAYS':
                    conditionMet = (stats.currentStreak ?? 0) >= value;
                    break;
                case 'COMPLETE_LEVELS':
                    conditionMet = (stats.levelsCompleted ?? 0) >= value;
                    break;
                case 'COMPLETE_ALL_CATEGORIES':
                    // This would need total categories count
                    conditionMet = (stats.categoriesCompleted ?? 0) >= 9; // 9 total categories
                    break;
                case 'FAST_MATCH':
                    conditionMet = (stats.fastMatches ?? 0) >= value;
                    break;
            }

            if (conditionMet) {
                this.unlockAchievement(achievement.id);
                newlyUnlocked.push(achievement);
            }
        });

        return newlyUnlocked;
    }

    /**
     * Unlocks a specific achievement
     */
    public unlockAchievement(achievementId: string): void {
        if (this.isUnlocked(achievementId)) {
            return;
        }

        const achievement = this.achievements.find((a) => a.id === achievementId);
        if (!achievement) {
            console.warn(`[AchievementService] Achievement not found: ${achievementId}`);
            return;
        }

        // Add to unlocked list
        this.progress.unlockedAchievements.push(achievementId);
        this.progress.totalBonusStars += achievement.reward;
        this.progress.lastUnlockedAt = Date.now();

        // Save progress
        this.saveProgress();

        console.log(`[AchievementService] Unlocked: ${achievementId} (+${achievement.reward} bonus stars)`);
    }

    /**
     * Checks if an achievement is unlocked
     */
    public isUnlocked(achievementId: string): boolean {
        return this.progress.unlockedAchievements.includes(achievementId);
    }

    /**
     * Gets all achievements
     */
    public getAllAchievements(): IAchievement[] {
        return this.achievements;
    }

    /**
     * Gets unlocked achievements
     */
    public getUnlockedAchievements(): IAchievement[] {
        return this.achievements.filter((a) => this.isUnlocked(a.id));
    }

    /**
     * Gets locked achievements
     */
    public getLockedAchievements(): IAchievement[] {
        return this.achievements.filter((a) => !this.isUnlocked(a.id));
    }

    /**
     * Gets achievement progress stats
     */
    public getProgress(): IAchievementProgress {
        return { ...this.progress };
    }

    /**
     * Gets achievement by ID
     */
    public getAchievementById(id: string): IAchievement | null {
        return this.achievements.find((a) => a.id === id) ?? null;
    }

    /**
     * Loads progress from localStorage
     */
    private loadProgress(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
            if (stored) {
                this.progress = JSON.parse(stored) as IAchievementProgress;
            }
        } catch (error) {
            console.error('[AchievementService] Error loading progress:', error);
        }
    }

    /**
     * Saves progress to localStorage
     */
    private saveProgress(): void {
        try {
            localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(this.progress));
        } catch (error) {
            console.error('[AchievementService] Error saving progress:', error);
        }
    }

    /**
     * Resets all achievements (for testing/parent panel)
     */
    public resetAll(): void {
        this.progress = {
            unlockedAchievements: [],
            totalBonusStars: 0,
        };
        this.saveProgress();
        console.log('[AchievementService] All achievements reset');
    }
}
