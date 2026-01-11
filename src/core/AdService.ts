import { AnalyticsService } from './AnalyticsService';
import { AnalyticsEventType } from '../types/models';

/**
 * Ad Types
 */
export enum AdType {
    BANNER = 'BANNER',
    INTERSTITIAL = 'INTERSTITIAL',
    REWARDED = 'REWARDED',
}

/**
 * Service to manage advertisements
 * Ready for AdMob SDK integration
 */
export class AdService {
    private static instance: AdService | null = null;
    private analyticsService: AnalyticsService;

    private constructor() {
        this.analyticsService = AnalyticsService.getInstance();
        this.initializeAdMob();
    }

    public static getInstance(): AdService {
        if (!AdService.instance) {
            AdService.instance = new AdService();
        }
        return AdService.instance;
    }

    /**
     * Initialize AdMob SDK (Placeholder for real integration)
     */
    private initializeAdMob(): void {
        console.log('AdService: Initializing Ads...');
        // In a real Play Store app (Capacitor/Cordova), you would initialize AdMob here
        // Example: AdMob.initialize({ appId: 'YOUR_APP_ID' });
    }

    /**
     * Shows a banner ad
     */
    public showBanner(): void {
        const banner = document.getElementById('ad-banner-container');
        if (banner) {
            banner.style.display = 'flex';
            this.analyticsService.trackEvent(AnalyticsEventType.AD_SHOW, { type: AdType.BANNER });
        }
    }

    /**
     * Hides the banner ad
     */
    public hideBanner(): void {
        const banner = document.getElementById('ad-banner-container');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    /**
     * Shows a rewarded video ad
     * Returns true if the ad was watched successfully
     */
    public async showRewardedAd(): Promise<boolean> {
        console.log('AdService: Showing Rewarded Ad...');
        this.analyticsService.trackEvent(AnalyticsEventType.AD_SHOW, { type: AdType.REWARDED });

        // Simulate ad watching logic
        // In production: return AdMob.showRewardedAd(...);
        return new Promise((resolve) => {
            setTimeout(() => {
                const success = Math.random() > 0.05; // 95% success rate for simulation
                if (success) {
                    this.analyticsService.trackEvent(AnalyticsEventType.AD_REWARD, { type: AdType.REWARDED });
                }
                resolve(success);
            }, 2000);
        });
    }

    /**
     * Shows an interstitial ad
     */
    public async showInterstitialAd(): Promise<void> {
        console.log('AdService: Showing Interstitial Ad...');
        this.analyticsService.trackEvent(AnalyticsEventType.AD_SHOW, { type: AdType.INTERSTITIAL });

        // Simulate ad
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 1000);
        });
    }
}
