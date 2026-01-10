import type { ILocalizationService } from '../types/services';
import { Language } from '../types/models';
import tr from '../locales/tr.json';
import en from '../locales/en.json';

/**
 * LocalizationService handles multi-language support
 */
export class LocalizationService implements ILocalizationService {
    private static instance: LocalizationService | null = null;
    private currentLanguage: Language = Language.TR;
    private translations: Record<string, string> = {};

    private constructor() { }

    /**
     * Gets the singleton instance
     */
    public static getInstance(): LocalizationService {
        if (LocalizationService.instance === null) {
            LocalizationService.instance = new LocalizationService();
        }
        return LocalizationService.instance;
    }

    /**
     * Initializes the service with a language
     */
    public async initialize(language: string): Promise<void> {
        await this.setLanguage(language);
    }

    /**
     * Sets the current language and loads translations
     */
    public async setLanguage(language: string): Promise<void> {
        try {
            const lang = language as Language;
            this.currentLanguage = lang;

            if (lang === Language.TR) {
                this.translations = tr;
            } else {
                this.translations = en;
            }
        } catch (error) {
            console.error(`Failed to load language ${language}:`, error);
            // Fallback to Turkish
            if (language !== Language.TR) {
                this.currentLanguage = Language.TR;
                this.translations = tr;
            }
        }
    }

    /**
     * Translates a key to current language
     */
    public translate(key: string, params?: Record<string, string>): string {
        let translation = this.translations[key] ?? key;

        // Replace parameters if provided
        if (params !== undefined) {
            Object.entries(params).forEach(([paramKey, value]) => {
                translation = translation.replace(`{${paramKey}}`, value);
            });
        }

        return translation;
    }

    /**
     * Gets the current language
     */
    public getCurrentLanguage(): string {
        return this.currentLanguage;
    }

    /**
     * Shorthand method for translation (alias)
     */
    public t(key: string, params?: Record<string, string>): string {
        return this.translate(key, params);
    }
}
