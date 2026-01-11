/**
 * Theme enumeration
 */
export enum Theme {
    LIGHT = 'light',
    DARK = 'dark',
}

/**
 * Theme color palette interface
 */
export interface IThemeColors {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
    warning: string;
    success: string;
    textLight: string;
    textDark: string;
    cardBack: string;
    cardFront: string;
    disabled: string;
}

/**
 * Light theme color palette
 */
export const LIGHT_THEME: IThemeColors = {
    background: '#2C3E50',
    primary: '#3498DB',
    secondary: '#2ECC71',
    accent: '#E74C3C',
    warning: '#F39C12',
    success: '#27AE60',
    textLight: '#FFFFFF',
    textDark: '#2C3E50',
    cardBack: '#34495E',
    cardFront: '#FFFFFF',
    disabled: '#95A5A6',
};

/**
 * Dark theme color palette
 */
export const DARK_THEME: IThemeColors = {
    background: '#0F1419',
    primary: '#1DA1F2',
    secondary: '#17BF63',
    accent: '#F91880',
    warning: '#FFAD1F',
    success: '#00BA7C',
    textLight: '#E7E9EA',
    textDark: '#0F1419',
    cardBack: '#1C2938',
    cardFront: '#253341',
    disabled: '#6E767D',
};

/**
 * Gets theme colors by theme type
 */
export function getThemeColors(theme: Theme): IThemeColors {
    return theme === Theme.LIGHT ? LIGHT_THEME : DARK_THEME;
}
