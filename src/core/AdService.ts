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
    private isInterstitialPrepared: boolean = false;
    private isRewardedPrepared: boolean = false;

    // Production IDs
    private readonly AD_IDS = {
        BANNER: 'ca-app-pub-4190858087915294/9285554263',
        INTERSTITIAL: 'ca-app-pub-4190858087915294/1131732079',
        REWARDED: 'ca-app-pub-4190858087915294/6564796239',
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
     * Initialize AdMob SDK with Families Policy compliance
     */
    private async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            console.log('AdService: Initializing AdMob with Families Policy settings...');

            // Initialize AdMob
            // COPPA compliance settings are configured in AndroidManifest.xml via:
            // - com.google.android.gms.ads.flag.TAG_FOR_CHILD_DIRECTED_TREATMENT
            // - com.google.android.gms.ads.flag.MAX_AD_CONTENT_RATING
            await AdMob.initialize({});

            this.isInitialized = true;
            console.log('AdService: AdMob Initialized successfully with Families compliance.');

            // Start preloading ads
            void this.preloadInterstitial();
            void this.preloadRewarded();
        } catch (error) {
            console.error('AdService: Error initializing AdMob:', error);
        }
    }

    /**
     * Preloads an interstitial ad
     */
    private async preloadInterstitial(): Promise<void> {
        if (this.isInterstitialPrepared) return;

        try {
            console.log('AdService: Preloading Interstitial Ad...');
            await AdMob.prepareInterstitial({
                adId: this.AD_IDS.INTERSTITIAL,
                npa: true, // Non-personalized ads for children
            });
            this.isInterstitialPrepared = true;
            console.log('AdService: Interstitial Ad Preloaded.');
        } catch (error) {
            console.error('AdService: Error preloading interstitial:', error);
            this.isInterstitialPrepared = false;
        }
    }

    /**
     * Preloads a rewarded ad
     */
    private async preloadRewarded(): Promise<void> {
        if (this.isRewardedPrepared) return;

        try {
            console.log('AdService: Preloading Rewarded Ad...');
            await AdMob.prepareRewardVideoAd({
                adId: this.AD_IDS.REWARDED,
                npa: true, // Non-personalized ads for children
            });
            this.isRewardedPrepared = true;
            console.log('AdService: Rewarded Ad Preloaded.');
        } catch (error) {
            console.error('AdService: Error preloading rewarded:', error);
            this.isRewardedPrepared = false;
        }
    }

    /**
     * Shows a banner ad
     */
    public async showBanner(): Promise<void> {
        if (!this.isInitialized) await this.initialize();

        try {
            const options: BannerAdOptions = {
                adId: this.AD_IDS.BANNER,
                adSize: BannerAdSize.ADAPTIVE_BANNER,
                position: BannerAdPosition.BOTTOM_CENTER,
                margin: 0,
                npa: true, // Non-personalized ads for children (COPPA compliance)
            };

            await AdMob.showBanner(options);
            // this.analyticsService.trackEvent(AnalyticsEventType.AD_SHOW, { type: AdType.BANNER }); // Banner analytics can be spammy
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
            // Check if preloaded, otherwise load
            if (!this.isRewardedPrepared) {
                console.log('AdService: Rewarded Ad not ready, loading now...');
                await this.preloadRewarded();
            }

            // Using 'any' to avoid SDK version specific type mismatches
            const reward: any = await AdMob.showRewardVideoAd();
            this.isRewardedPrepared = false; // Consumed

            // Preload next one immediately
            void this.preloadRewarded();

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
            this.isRewardedPrepared = false;
            // Try to recover for next time
            void this.preloadRewarded();
            return false;
        }
    }

    /**
     * Shows an interstitial ad
     */
    public async showInterstitialAd(): Promise<void> {
        if (!this.isInitialized) await this.initialize();

        try {
            // Check if preloaded, otherwise load
            if (!this.isInterstitialPrepared) {
                console.log('AdService: Interstitial Ad not ready, loading now...');
                await this.preloadInterstitial();
            }

            await AdMob.showInterstitial();
            this.analyticsService.trackEvent(AnalyticsEventType.AD_SHOW, { type: AdType.INTERSTITIAL });
            console.log('AdService: Interstitial Ad Shown');

            this.isInterstitialPrepared = false; // Consumed

            // Preload next one immediately
            void this.preloadInterstitial();
        } catch (error) {
            console.error('AdService: Error showing interstitial ad:', error);
            this.isInterstitialPrepared = false;
            // Try to recover for next time
            void this.preloadInterstitial();
        }
    }

    /**
     * Checks if interstitial ad is ready
     */
    public isInterstitialReady(): boolean {
        return this.isInterstitialPrepared;
    }

    /**
     * Checks if rewarded ad is ready
     */
    public isRewardedReady(): boolean {
        return this.isRewardedPrepared;
    }
}
