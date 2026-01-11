import {
    AdMob,
    BannerAdSize,
    BannerAdPosition,
    BannerAdOptions
} from '@capacitor-community/admob';
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
 * Integrated with AdMob SDK via Capacitor
 */
export class AdService {
    private static instance: AdService | null = null;
    private analyticsService: AnalyticsService;
    private isInitialized: boolean = false;

    // Test IDs from Google (Use these during development)
    private readonly TEST_IDS = {
        BANNER: 'ca-app-pub-3940256099942544/6300978111',
        INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
        REWARDED: 'ca-app-pub-3940256099942544/5224354917',
    };

    private constructor() {
        this.analyticsService = AnalyticsService.getInstance();
        this.initialize();
    }

    public static getInstance(): AdService {
        if (!AdService.instance) {
            AdService.instance = new AdService();
        }
        return AdService.instance;
    }

    /**
     * Initialize AdMob SDK
     */
    private async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            console.log('AdService: Initializing AdMob...');
            await AdMob.initialize({});
            this.isInitialized = true;
            console.log('AdService: AdMob Initialized successfully.');
        } catch (error) {
            console.error('AdService: Error initializing AdMob:', error);
        }
    }

    /**
     * Shows a banner ad
     */
    public async showBanner(): Promise<void> {
        if (!this.isInitialized) await this.initialize();

        try {
            const options: BannerAdOptions = {
                adId: this.TEST_IDS.BANNER,
                adSize: BannerAdSize.ADAPTIVE_BANNER,
                position: BannerAdPosition.BOTTOM_CENTER,
                margin: 0,
                // npa: true // Set this to true for non-personalized ads
            };

            await AdMob.showBanner(options);
            this.analyticsService.trackEvent(AnalyticsEventType.AD_SHOW, { type: AdType.BANNER });
            console.log('AdService: Banner Ad Shown');
        } catch (error) {
            console.error('AdService: Error showing banner ad:', error);
        }
    }

    /**
     * Hides the banner ad
     */
    public async hideBanner(): Promise<void> {
        try {
            await AdMob.hideBanner();
            console.log('AdService: Banner Ad Hidden');
        } catch (error) {
            console.error('AdService: Error hiding banner ad:', error);
        }
    }

    /**
     * Shows a rewarded video ad
     * Returns true if the ad was watched successfully and reward was granted
     */
    public async showRewardedAd(): Promise<boolean> {
        if (!this.isInitialized) await this.initialize();

        try {
            console.log('AdService: Preparing Rewarded Ad...');

            await AdMob.prepareRewardVideoAd({
                adId: this.TEST_IDS.REWARDED,
            });

            // Using 'any' to avoid SDK version specific type mismatches for AdMobReward/AdReward
            const reward: any = await AdMob.showRewardVideoAd();

            if (reward && reward.amount > 0) {
                console.log('AdService: Rewarded Ad Watched Successfully:', reward);
                this.analyticsService.trackEvent(AnalyticsEventType.AD_REWARD, {
                    type: AdType.REWARDED,
                    amount: reward.amount,
                    currency: reward.type
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error('AdService: Error showing rewarded ad:', error);
            return false;
        }
    }

    /**
     * Shows an interstitial ad
     */
    public async showInterstitialAd(): Promise<void> {
        if (!this.isInitialized) await this.initialize();

        try {
            console.log('AdService: Preparing Interstitial Ad...');

            await AdMob.prepareInterstitial({
                adId: this.TEST_IDS.INTERSTITIAL,
            });

            await AdMob.showInterstitial();
            this.analyticsService.trackEvent(AnalyticsEventType.AD_SHOW, { type: AdType.INTERSTITIAL });
            console.log('AdService: Interstitial Ad Shown');
        } catch (error) {
            console.error('AdService: Error showing interstitial ad:', error);
        }
    }
}
