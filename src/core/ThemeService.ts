import { Theme, getThemeColors, type IThemeColors } from '../config/themes';
import { STORAGE_KEYS } from '@constants/index';

/**
 * ThemeService manages theme switching and persistence
 * Implements singleton pattern for global access
 */
export class ThemeService {
    private static instance: ThemeService | null = null;
    private currentTheme: Theme = Theme.LIGHT;
    private listeners: Array<(theme: Theme) => void> = [];

    private constructor() {
        this.loadTheme();
    }

    /**
     * Gets the singleton instance
     */
    public static getInstance(): ThemeService {
        if (ThemeService.instance === null) {
            ThemeService.instance = new ThemeService();
        }
        return ThemeService.instance;
    }

    /**
     * Gets current theme
     */
    public getCurrentTheme(): Theme {
        return this.currentTheme;
    }

    /**
     * Gets current theme colors
     */
    public getColors(): IThemeColors {
        return getThemeColors(this.currentTheme);
    }

    /**
     * Sets theme
     */
    public setTheme(theme: Theme): void {
        if (this.currentTheme === theme) {
            return;
        }

        this.currentTheme = theme;
        this.saveTheme();
        this.notifyListeners();

        console.log(`[ThemeService] Theme changed to: ${theme}`);
    }

    /**
     * Toggles between light and dark theme
     */
    public toggleTheme(): void {
        const newTheme = this.currentTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
        this.setTheme(newTheme);
    }

    /**
     * Checks if current theme is dark
     */
    public isDark(): boolean {
        return this.currentTheme === Theme.DARK;
    }

    /**
     * Adds a theme change listener
     */
    public addListener(callback: (theme: Theme) => void): void {
        this.listeners.push(callback);
    }

    /**
     * Removes a theme change listener
     */
    public removeListener(callback: (theme: Theme) => void): void {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    /**
     * Notifies all listeners of theme change
     */
    private notifyListeners(): void {
        this.listeners.forEach(callback => callback(this.currentTheme));
    }

    /**
     * Loads theme from storage
     */
    private loadTheme(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.THEME);
            if (stored && (stored === Theme.LIGHT || stored === Theme.DARK)) {
                this.currentTheme = stored as Theme;
            }
        } catch (error) {
            console.error('[ThemeService] Error loading theme:', error);
        }
    }

    /**
     * Saves theme to storage
     */
    private saveTheme(): void {
        try {
            localStorage.setItem(STORAGE_KEYS.THEME, this.currentTheme);
        } catch (error) {
            console.error('[ThemeService] Error saving theme:', error);
        }
    }
}
