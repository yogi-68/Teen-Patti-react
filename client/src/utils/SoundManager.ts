class SoundManager {
  private static instance: SoundManager;
  private buttonClickSound: HTMLAudioElement | null = null;
  private backgroundMusic: HTMLAudioElement | null = null;
  private winnerSound: HTMLAudioElement | null = null;
  private isMusicEnabled: boolean = true;
  private isSoundEnabled: boolean = true;
  private musicStarted: boolean = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private initialize() {
    try {
      // Load button click sound
      this.buttonClickSound = new Audio('/sounds/button-click.mp3');
      this.buttonClickSound.volume = 0.5;
      this.buttonClickSound.preload = 'auto';

      // Load background music
      this.backgroundMusic = new Audio('/sounds/background-music.mp3');
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = 0.3;
      this.backgroundMusic.preload = 'auto';

      // Load winner sound
      this.winnerSound = new Audio('/sounds/winner.mp3');
      this.winnerSound.volume = 0.7;
      this.winnerSound.preload = 'auto';

      console.log('✅ Sound Manager initialized');
      console.log('🔊 Sound files loaded from /sounds/');
    } catch (error) {
      console.error('⚠️ Error initializing sounds:', error);
    }
  }

  playButtonClick() {
    if (!this.isSoundEnabled || !this.buttonClickSound) return;
    try {
      this.buttonClickSound.currentTime = 0;
      const playPromise = this.buttonClickSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn('🔇 Button click sound blocked by browser:', e.message);
        });
      }
      console.log('🔊 Playing button click sound');
    } catch (error) {
      console.error('Error playing button click:', error);
    }
  }

  playBackgroundMusic() {
    if (!this.isMusicEnabled || !this.backgroundMusic || this.musicStarted) return;
    try {
      const playPromise = this.backgroundMusic.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.musicStarted = true;
            console.log('🎵 Background music started');
          })
          .catch(e => {
            console.warn('🔇 Background music blocked by browser (user interaction needed):', e.message);
          });
      }
    } catch (error) {
      console.error('Error playing background music:', error);
    }
  }

  stopBackgroundMusic() {
    if (!this.backgroundMusic) return;
    try {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      this.musicStarted = false;
      console.log('⏹️ Background music stopped');
    } catch (error) {
      console.error('Error stopping background music:', error);
    }
  }

  playWinnerSound() {
    if (!this.isSoundEnabled || !this.winnerSound) return;
    try {
      this.winnerSound.currentTime = 0;
      const playPromise = this.winnerSound.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🎉 Winner sound playing');
          })
          .catch(e => {
            console.warn('🔇 Winner sound blocked by browser:', e.message);
          });
      }
    } catch (error) {
      console.error('Error playing winner sound:', error);
    }
  }

  setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    } else {
      this.playBackgroundMusic();
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
  }
}

export default SoundManager.getInstance();
