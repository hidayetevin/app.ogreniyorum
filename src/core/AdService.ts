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

    // Ad State & Locking
    private interstitialReady: boolean = false;
    private rewardedReady: boolean = false;
    private interstitialLoadPromise: Promise<void> | null = null;
    private rewardedLoadPromise: Promise<void> | null = null;

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
                tagForUnderAgeOfConsent: true,
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
     * Preloads an interstitial ad (Single instance for AdMob)
     */
    private async preloadInterstitial(): Promise<void> {
        if (this.interstitialReady) return Promise.resolve();
        if (this.interstitialLoadPromise) return this.interstitialLoadPromise;

        this.interstitialLoadPromise = new Promise(async (resolve) => {
            try {
                console.log('AdService: Preloading Interstitial Ad...');
                await AdMob.prepareInterstitial({
                    adId: this.AD_IDS.INTERSTITIAL,
                    npa: true,
                });
                this.interstitialReady = true;
                console.log('AdService: Interstitial Ad Preloaded successfully.');
            } catch (error) {
                console.error('AdService: Error preloading interstitial:', error);
                this.interstitialReady = false;

                // Retry in background after delay if failed
                setTimeout(() => { void this.preloadInterstitial(); }, 5000);
            } finally {
                this.interstitialLoadPromise = null;
                resolve();
            }
        });

        return this.interstitialLoadPromise;
    }

    /**
     * Preloads a rewarded ad (Single instance for AdMob)
     */
    private async preloadRewarded(): Promise<void> {
        if (this.rewardedReady) return Promise.resolve();
        if (this.rewardedLoadPromise) return this.rewardedLoadPromise;

        this.rewardedLoadPromise = new Promise(async (resolve) => {
            try {
                console.log('AdService: Preloading Rewarded Ad...');
                await AdMob.prepareRewardVideoAd({
                    adId: this.AD_IDS.REWARDED,
                    npa: true,
                });
                this.rewardedReady = true;
                console.log('AdService: Rewarded Ad Preloaded successfully.');
            } catch (error) {
                console.error('AdService: Error preloading rewarded:', error);
                this.rewardedReady = false;

                // Retry in background after delay if failed
                setTimeout(() => { void this.preloadRewarded(); }, 5000);
            } finally {
                this.rewardedLoadPromise = null;
                resolve();
            }
        });

        return this.rewardedLoadPromise;
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

                this.rewardedReady = false;
                void this.preloadRewarded();

                resolve(earnedReward);
            };

            // Safety timeout: If ad doesn't finish/dismiss in 15 seconds, proceed anyway
            const safetyTimeout = setTimeout(() => {
                console.warn('AdService: Rewarded Ad safety timeout triggered.');
                finish();
            }, 15000);

            const internalFinish = () => {
                clearTimeout(safetyTimeout);
                finish();
            };

            try {
                if (!this.rewardedReady) {
                    console.log('AdService: Rewarded Ad not ready, fetching...');
                    const timeoutPromise = new Promise<void>((r) => setTimeout(r, 3000));
                    await Promise.race([this.preloadRewarded(), timeoutPromise]);

                    if (!this.rewardedReady) {
                        internalFinish();
                        return;
                    }
                }

                listeners.push(await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: any) => {
                    console.log('AdService: Rewarded Ad Watched Successfully:', reward);
                    if (reward && reward.amount > 0) {
                        earnedReward = true;
                        this.analyticsService.trackEvent(AnalyticsEventType.AD_REWARD, {
                            type: AdType.REWARDED,
                            amount: reward.amount,
                            currency: reward.type
                        });
                    }
                }));

                listeners.push(await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
                    console.log('AdService: Rewarded Ad Dismissed');
                    internalFinish();
                }));

                listeners.push(await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: any) => {
                    console.error('AdService: Rewarded Ad Failed To Show:', error);
                    internalFinish();
                }));

                await AdMob.showRewardVideoAd().catch((e) => {
                    console.error('AdService: showRewardVideoAd promise rejected:', e);
                    internalFinish();
                });
            } catch (error) {
                console.error('AdService: Error setting up rewarded ad:', error);
                internalFinish();
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

                this.interstitialReady = false;
                void this.preloadInterstitial();

                resolve();
            };

            // Safety timeout: If ad doesn't finish/dismiss in 15 seconds, proceed anyway
            const safetyTimeout = setTimeout(() => {
                console.warn('AdService: Interstitial Ad safety timeout triggered.');
                finish();
            }, 15000);

            const internalFinish = () => {
                clearTimeout(safetyTimeout);
                finish();
            };

            try {
                if (!this.interstitialReady) {
                    console.log('AdService: Interstitial Ad not ready, fetching...');
                    const timeoutPromise = new Promise<void>((r) => setTimeout(r, 3000));
                    await Promise.race([this.preloadInterstitial(), timeoutPromise]);

                    if (!this.interstitialReady) {
                        internalFinish();
                        return;
                    }
                }

                listeners.push(await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
                    console.log('AdService: Interstitial Ad Dismissed');
                    internalFinish();
                }));

                listeners.push(await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error: any) => {
                    console.error('AdService: Interstitial Ad Failed To Show:', error);
                    internalFinish();
                }));

                await AdMob.showInterstitial().catch((e) => {
                    console.error('AdService: showInterstitial promise rejected:', e);
                    internalFinish();
                });

                this.analyticsService.trackEvent(AnalyticsEventType.AD_SHOW, { type: AdType.INTERSTITIAL });
            } catch (error) {
                console.error('AdService: Error setting up interstitial ad:', error);
                internalFinish();
            }
        });
    }

    /**
     * Checks if interstitial ad is ready
     */
    public isInterstitialReady(): boolean {
        return this.interstitialReady;
    }

    /**
     * Checks if rewarded ad is ready
     */
    public isRewardedReady(): boolean {
        return this.rewardedReady;
    }
}
