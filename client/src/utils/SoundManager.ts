class SoundManager {
  private static instance: SoundManager;
  private buttonClickSound: HTMLAudioElement | null = null;
  private backgroundMusic: HTMLAudioElement | null = null;
  private winnerSound: HTMLAudioElement | null = null;
  private isMusicEnabled: boolean = true;
  private isSoundEnabled: boolean = true;

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

      // Load background music
      this.backgroundMusic = new Audio('/sounds/background-music.mp3');
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = 0.3;

      // Load winner sound
      this.winnerSound = new Audio('/sounds/winner.mp3');
      this.winnerSound.volume = 0.7;

      console.log('✅ Sound Manager initialized');
    } catch (error) {
      console.error('⚠️ Error initializing sounds:', error);
    }
  }

  playButtonClick() {
    if (!this.isSoundEnabled || !this.buttonClickSound) return;
    try {
      this.buttonClickSound.currentTime = 0;
      this.buttonClickSound.play().catch(e => console.error('Error playing button click:', e));
    } catch (error) {
      console.error('Error playing button click:', error);
    }
  }

  playBackgroundMusic() {
    if (!this.isMusicEnabled || !this.backgroundMusic) return;
    try {
      this.backgroundMusic.play().catch(e => console.error('Error playing background music:', e));
    } catch (error) {
      console.error('Error playing background music:', error);
    }
  }

  stopBackgroundMusic() {
    if (!this.backgroundMusic) return;
    try {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    } catch (error) {
      console.error('Error stopping background music:', error);
    }
  }

  playWinnerSound() {
    if (!this.isSoundEnabled || !this.winnerSound) return;
    try {
      this.winnerSound.currentTime = 0;
      this.winnerSound.play().catch(e => console.error('Error playing winner sound:', e));
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
