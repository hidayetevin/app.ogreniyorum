/**
 * HapticFeedback utility for providing tactile feedback on mobile devices
 */
export class HapticFeedback {
    private static isSupported: boolean = 'vibrate' in navigator;

    /**
     * Light tap feedback for button clicks
     */
    public static light(): void {
        if (!this.isSupported) return;
        navigator.vibrate(10);
    }

    /**
     * Medium feedback for selections
     */
    public static medium(): void {
        if (!this.isSupported) return;
        navigator.vibrate(20);
    }

    /**
     * Success pattern for correct matches
     */
    public static success(): void {
        if (!this.isSupported) return;
        navigator.vibrate([30, 20, 30]); // Short-pause-short pattern
    }

    /**
     * Error pattern for incorrect matches
     */
    public static error(): void {
        if (!this.isSupported) return;
        navigator.vibrate([50, 30, 50, 30, 50]); // Triple buzz
    }

    /**
     * Warning feedback
     */
    public static warning(): void {
        if (!this.isSupported) return;
        navigator.vibrate(100);
    }

    /**
     * Heavy feedback for major events (level complete)
     */
    public static heavy(): void {
        if (!this.isSupported) return;
        navigator.vibrate([50, 30, 50, 30, 100]); // Celebration pattern
    }

    /**
     * Selection feedback for UI interactions
     */
    public static selection(): void {
        if (!this.isSupported) return;
        navigator.vibrate(15);
    }

    /**
     * Check if haptic feedback is supported
     */
    public static isAvailable(): boolean {
        return this.isSupported;
    }
}
