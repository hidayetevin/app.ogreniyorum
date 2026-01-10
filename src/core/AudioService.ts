import { TextToSpeech } from '@capacitor-community/text-to-speech';
import type { IAudioService } from '../types/services';
// import { AUDIO_KEYS } from '../constants/index';
import { clamp } from '@utils/math';

/**
 * AudioService manages all game audio
 * Singleton pattern for global access
 */
export class AudioService implements IAudioService {
    private static instance: AudioService | null = null;
    private scene: Phaser.Scene | null = null;
    private soundEnabled: boolean = true;
    private musicEnabled: boolean = true;
    private volume: number = 0.7;
    private currentMusic: Phaser.Sound.BaseSound | null = null;
    private audioContext: AudioContext | null = null;

    private constructor() {
        // Initialize Web Audio API context for synthesized sounds
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    /**
     * Gets the singleton instance
     */
    public static getInstance(): AudioService {
        if (AudioService.instance === null) {
            AudioService.instance = new AudioService();
        }
        return AudioService.instance;
    }

    /**
     * Initializes the audio service with a Phaser scene
     */
    public async initialize(scene: Phaser.Scene): Promise<void> {
        this.scene = scene;
    }

    /**
     * Plays a sound effect
     */
    /**
     * Plays a sound effect
     */
    public playSound(key: string): void {
        if (!this.soundEnabled) {
            return;
        }

        // Try to play from cache first
        if (this.scene && this.scene.cache.audio.exists(key)) {
            try {
                this.scene.sound.play(key, { volume: this.volume });
                return;
            } catch (error) {
                // Fallback to synthesizer
            }
        }

        // Fallback: Synthesize sound based on key
        this.synthesizeSound(key);
    }

    /**
     * Synthesizes simple sound effects using Web Audio API
     */
    private synthesizeSound(key: string): void {
        if (!this.audioContext) return;

        // Resume context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;
        const volume = this.volume * 0.5; // Slightly lower volume for synthesized beeps

        switch (key) {
            case 'button-click':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(600, now);
                oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.1);
                gainNode.gain.setValueAtTime(volume, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;

            case 'card-flip':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.linearRampToValueAtTime(800, now + 0.1);
                gainNode.gain.setValueAtTime(volume * 0.5, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;

            case 'correct-match':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(500, now);
                oscillator.frequency.setValueAtTime(1000, now + 0.1);
                gainNode.gain.setValueAtTime(volume, now);
                gainNode.gain.setValueAtTime(volume, now + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);

                // Add a second harmonious tone
                const osc2 = this.audioContext.createOscillator();
                const gain2 = this.audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(this.audioContext.destination);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(750, now); // Major fifth
                osc2.frequency.setValueAtTime(1500, now + 0.1);
                gain2.gain.setValueAtTime(volume * 0.5, now);
                gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc2.start(now);
                osc2.stop(now + 0.3);
                break;

            case 'wrong-match':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(300, now);
                oscillator.frequency.linearRampToValueAtTime(200, now + 0.2);
                gainNode.gain.setValueAtTime(volume * 0.8, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;

            case 'level-complete':
                // Simple arpeggio
                const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C E G C
                frequencies.forEach((freq, index) => {
                    const osc = this.audioContext!.createOscillator();
                    const gain = this.audioContext!.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext!.destination);

                    const startTime = now + index * 0.1;
                    osc.type = 'sine';
                    osc.frequency.value = freq;

                    gain.gain.setValueAtTime(volume, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

                    osc.start(startTime);
                    osc.stop(startTime + 0.3);
                });
                break;
        }
    }

    /**
     * Plays background music
     */
    public playMusic(key: string, loop: boolean = true): void {
        if (!this.musicEnabled || this.scene === null) {
            return;
        }

        try {
            // Check if music exists in cache
            if (!this.scene.cache.audio.exists(key)) {
                return; // Silently skip if audio not loaded
            }

            // Stop current music if playing
            this.stopMusic();

            this.currentMusic = this.scene.sound.add(key, {
                volume: this.volume * 0.5, // Music is quieter than SFX
                loop,
            });

            this.currentMusic.play();
        } catch (error) {
            // Silently handle audio errors
        }
    }

    /**
     * Stops the currently playing music
     */
    public stopMusic(): void {
        if (this.currentMusic !== null) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }

    /**
     * Sets the master volume (0-1)
     */
    public setVolume(volume: number): void {
        this.volume = clamp(volume, 0, 1);

        if (this.scene !== null) {
            this.scene.sound.volume = this.volume;
        }

        // Update current music volume
        if (this.currentMusic !== null && 'setVolume' in this.currentMusic) {
            (this.currentMusic as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound).setVolume(
                this.volume * 0.5
            );
        }
    }

    /**
     * Enables or disables sound effects
     */
    public setSoundEnabled(enabled: boolean): void {
        this.soundEnabled = enabled;
    }

    /**
     * Enables or disables music
     */
    public setMusicEnabled(enabled: boolean): void {
        this.musicEnabled = enabled;

        if (!enabled) {
            this.stopMusic();
        }
    }

    /**
     * Checks if sound is enabled
     */
    public isSoundEnabled(): boolean {
        return this.soundEnabled;
    }

    /**
     * Checks if music is enabled
     */
    public isMusicEnabled(): boolean {
        return this.musicEnabled;
    }

    /**
     * Preloads audio assets
     */
    public static preloadAssets(_scene: Phaser.Scene): void {
        // Audio files are optional - uncomment when actual files are added
    }

    /**
     * Speaks the given text using Text-to-Speech API
     */
    public async speak(text: string, lang: string = 'tr-TR'): Promise<void> {
        if (!this.soundEnabled) {
            return;
        }

        try {
            // Cancel current speech
            await TextToSpeech.stop();

            await TextToSpeech.speak({
                text: text,
                lang: lang,
                rate: 0.9,
                pitch: 1.1,
                volume: this.volume,
                category: 'ambient',
            });
        } catch (e) {
            console.warn('TTS Error:', e);
        }
    }
}
