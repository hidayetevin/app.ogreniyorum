import type { IAnalyticsService } from '../types/services';
import { AnalyticsEventType } from '../types/models';
import type { IAnalyticsEvent } from '../types/models';
import { STORAGE_KEYS } from '@constants/index';

/**
 * AnalyticsService tracks minimal, anonymous game events
 * Privacy-first approach - no personal data collected
 */
export class AnalyticsService implements IAnalyticsService {
    private static instance: AnalyticsService | null = null;
    private events: IAnalyticsEvent[] = [];
    private maxEvents: number = 100; // Limit stored events

    private constructor() {
        this.loadEvents();
    }

    /**
     * Gets the singleton instance
     */
    public static getInstance(): AnalyticsService {
        if (AnalyticsService.instance === null) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    /**
     * Initializes the service
     */
    public initialize(): void {
        // Load existing events from storage
        this.loadEvents();
    }

    /**
     * Tracks an analytics event
     */
    public trackEvent(eventType: AnalyticsEventType, data: Record<string, unknown> = {}): void {
        const event: IAnalyticsEvent = {
            eventType,
            timestamp: Date.now(),
            data,
        };
        this.events.push(event);

        // Trim old events if exceeding max
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }

        this.saveEvents();
    }

    /**
     * Gets all tracked events
     */
    public getEvents(): IAnalyticsEvent[] {
        return [...this.events];
    }

    /**
     * Clears all events
     */
    public clearEvents(): void {
        this.events = [];
        this.saveEvents();
    }

    /**
     * Loads events from localStorage
     */
    private loadEvents(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
            if (stored !== null) {
                const parsed = JSON.parse(stored) as unknown;
                if (Array.isArray(parsed)) {
                    this.events = parsed;
                }
            }
        } catch (error) {
            console.error('Error loading analytics events:', error);
            this.events = [];
        }
    }

    /**
     * Saves events to localStorage
     */
    private saveEvents(): void {
        try {
            localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(this.events));
        } catch (error) {
            console.error('Error saving analytics events:', error);
        }
    }

    /**
     * Gets event statistics
     */
    public getStatistics(): {
        totalEvents: number;
        eventsByType: Record<string, number>;
    } {
        const eventsByType: Record<string, number> = {};

        this.events.forEach((event) => {
            const count = eventsByType[event.eventType] ?? 0;
            eventsByType[event.eventType] = count + 1;
        });

        return {
            totalEvents: this.events.length,
            eventsByType,
        };
    }
}
