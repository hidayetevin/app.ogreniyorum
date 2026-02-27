import {
    AdMob,
    BannerAdSize,
    BannerAdPosition,
    BannerAdOptions,
    MaxAdContentRating,
    RewardAdPluginEvents,
    InterstitialAdPluginEvents,
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

    // Ad Pooling
    private readonly MAX_POOL_SIZE = 2;
    private interstitialPoolCount: number = 0;
    private rewardedPoolCount: number = 0;
    private isPreparingInterstitial: boolean = false;
    private isPreparingRewarded: boolean = false;

    // Production IDs
    private readonly AD_IDS = {
        BANNER: 'ca-app-pub-4190858087915294/9285554263',
        INTERSTITIAL: 'ca-app-pub-4190858087915294/5133570153',
        REWARDED: 'ca-app-pub-4190858087915294/7136916962',
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
            await AdMob.initialize({
                tagForChildDirectedTreatment: true,
                maxAdContentRating: MaxAdContentRating.General,
            });

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
     * Preloads an interstitial ad to maintain the pool
     */
    private async preloadInterstitial(): Promise<void> {
        if (this.isPreparingInterstitial) return; // Prevent concurrent preparation calls
        if (this.interstitialPoolCount >= this.MAX_POOL_SIZE) return; // Pool is full

        try {
            this.isPreparingInterstitial = true;
            console.log(`AdService: Preloading Interstitial Ad... (Current pool: ${this.interstitialPoolCount}/${this.MAX_POOL_SIZE})`);

            await AdMob.prepareInterstitial({
                adId: this.AD_IDS.INTERSTITIAL,
                npa: true, // Non-personalized ads for children
            });

            this.interstitialPoolCount++;
            console.log(`AdService: Interstitial Ad Preloaded successfully. (New pool: ${this.interstitialPoolCount}/${this.MAX_POOL_SIZE})`);
        } catch (error) {
            console.error('AdService: Error preloading interstitial:', error);
        } finally {
            this.isPreparingInterstitial = false;

            // If the pool is still not full, try to queue another load
            if (this.interstitialPoolCount < this.MAX_POOL_SIZE) {
                // Short delay to prevent hammering the ad network on rapid failures
                setTimeout(() => {
                    void this.preloadInterstitial();
                }, 2000);
            }
        }
    }

    /**
     * Preloads a rewarded ad to maintain the pool
     */
    private async preloadRewarded(): Promise<void> {
        if (this.isPreparingRewarded) return; // Prevent concurrent preparation calls
        if (this.rewardedPoolCount >= this.MAX_POOL_SIZE) return; // Pool is full

        try {
            this.isPreparingRewarded = true;
            console.log(`AdService: Preloading Rewarded Ad... (Current pool: ${this.rewardedPoolCount}/${this.MAX_POOL_SIZE})`);

            await AdMob.prepareRewardVideoAd({
                adId: this.AD_IDS.REWARDED,
                npa: true, // Non-personalized ads for children
            });

            this.rewardedPoolCount++;
            console.log(`AdService: Rewarded Ad Preloaded successfully. (New pool: ${this.rewardedPoolCount}/${this.MAX_POOL_SIZE})`);
        } catch (error) {
            console.error('AdService: Error preloading rewarded:', error);
        } finally {
            this.isPreparingRewarded = false;

            // If the pool is still not full, try to queue another load
            if (this.rewardedPoolCount < this.MAX_POOL_SIZE) {
                // Short delay to prevent hammering the ad network on rapid failures
                setTimeout(() => {
                    void this.preloadRewarded();
                }, 2000);
            }
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

        return new Promise<boolean>(async (resolve) => {
            let isResolved = false;
            let earnedReward = false;
            let listeners: { remove: () => void }[] = [];

            const cleanup = () => {
                listeners.forEach(l => l.remove && l.remove());
                listeners = [];
            };

            const finish = () => {
                if (isResolved) return;
                isResolved = true;
                cleanup();

                // Keep trying to fill the pool
                void this.preloadRewarded();

                resolve(earnedReward);
            };

            try {
                if (this.rewardedPoolCount <= 0) {
                    console.log('AdService: Rewarded Ad pool empty, loading one now and waiting...');
                    await this.preloadRewarded();
                    if (this.rewardedPoolCount <= 0) {
                        finish();
                        return;
                    }
                }

                // Consume one ad from the pool
                this.rewardedPoolCount--;

                const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: any) => {
                    console.log('AdService: Rewarded Ad Watched Successfully:', reward);
                    if (reward && reward.amount > 0) {
                        earnedReward = true;
                        this.analyticsService.trackEvent(AnalyticsEventType.AD_REWARD, {
                            type: AdType.REWARDED,
                            amount: reward.amount,
                            currency: reward.type
                        });
                    }
                });
                listeners.push(rewardListener);

                const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
                    console.log('AdService: Rewarded Ad Dismissed');
                    finish();
                });
                listeners.push(dismissListener);

                const failListener = await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
                    console.error('AdService: Rewarded Ad Failed To Show:', error);
                    finish();
                });
                listeners.push(failListener);

                await AdMob.showRewardVideoAd().catch((e) => {
                    console.error('AdService: showRewardVideoAd promise rejected:', e);
                    finish();
                });
            } catch (error) {
                console.error('AdService: Error setting up rewarded ad:', error);
                finish();
            }
        });
    }

    /**
     * Shows an interstitial ad
     */
    public async showInterstitialAd(): Promise<void> {
        if (!this.isInitialized) await this.initialize();

        return new Promise<void>(async (resolve) => {
            let isResolved = false;
            let listeners: { remove: () => void }[] = [];

            const cleanup = () => {
                listeners.forEach(l => l.remove && l.remove());
                listeners = [];
            };

            const finish = () => {
                if (isResolved) return;
                isResolved = true;
                cleanup();

                // Keep trying to fill the pool
                void this.preloadInterstitial();

                resolve();
            };

            try {
                if (this.interstitialPoolCount <= 0) {
                    console.log('AdService: Interstitial Ad pool empty, loading one now and waiting...');
                    await this.preloadInterstitial();
                    if (this.interstitialPoolCount <= 0) {
                        finish();
                        return;
                    }
                }

                // Consume one from the pool
                this.interstitialPoolCount--;

                const dismissListener = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
                    console.log('AdService: Interstitial Ad Dismissed');
                    finish();
                });
                listeners.push(dismissListener);

                const failListener = await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error: any) => {
                    console.error('AdService: Interstitial Ad Failed To Show:', error);
                    finish();
                });
                listeners.push(failListener);

                await AdMob.showInterstitial().catch((e) => {
                    console.error('AdService: showInterstitial promise rejected:', e);
                    finish();
                });

                this.analyticsService.trackEvent(AnalyticsEventType.AD_SHOW, { type: AdType.INTERSTITIAL });
                console.log('AdService: Interstitial Ad Shown');
            } catch (error) {
                console.error('AdService: Error setting up interstitial ad:', error);
                finish();
            }
        });
    }

    /**
     * Checks if interstitial ad is ready
     */
    public isInterstitialReady(): boolean {
        return this.interstitialPoolCount > 0;
    }

    /**
     * Checks if rewarded ad is ready
     */
    public isRewardedReady(): boolean {
        return this.rewardedPoolCount > 0;
    }
}
