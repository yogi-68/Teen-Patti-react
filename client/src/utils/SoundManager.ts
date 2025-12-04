class SoundManager {
  private static instance: SoundManager;
  private buttonClickSound: HTMLAudioElement | null = null;
  private tabSwitchSound: HTMLAudioElement | null = null;
  private appBackgroundMusic: HTMLAudioElement | null = null;
  private gameBackgroundMusic: HTMLAudioElement | null = null;
  private currentMusic: HTMLAudioElement | null = null;
  private winnerSound: HTMLAudioElement | null = null;
  private isMusicEnabled: boolean = true;
  private isSoundEnabled: boolean = true;

  private constructor() {
    // Load settings from localStorage
    const savedMusicEnabled = localStorage.getItem('backgroundMusicEnabled');
    const savedSoundEnabled = localStorage.getItem('soundEffectsEnabled');
    
    this.isMusicEnabled = savedMusicEnabled !== null ? savedMusicEnabled === 'true' : true;
    this.isSoundEnabled = savedSoundEnabled !== null ? savedSoundEnabled === 'true' : true;
    
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
      // Load button click sound with metadata preload (faster than 'auto')
      this.buttonClickSound = new Audio('/sounds/button-click.mp3');
      this.buttonClickSound.volume = 0.5;
      this.buttonClickSound.preload = 'metadata';

      // Load tab switch sound (same as button click but slightly different volume)
      this.tabSwitchSound = new Audio('/sounds/button-click.mp3');
      this.tabSwitchSound.volume = 0.3;
      this.tabSwitchSound.preload = 'metadata';

      // Load app background music (for menus, dashboard, etc.)
      this.appBackgroundMusic = new Audio('/sounds/app-background.mp3');
      this.appBackgroundMusic.loop = true;
      this.appBackgroundMusic.volume = 0.3;
      this.appBackgroundMusic.preload = 'metadata';

      // Load game background music (for gameplay)
      this.gameBackgroundMusic = new Audio('/sounds/game-background.mp3');
      this.gameBackgroundMusic.loop = true;
      this.gameBackgroundMusic.volume = 0.3;
      this.gameBackgroundMusic.preload = 'metadata';

      // Load winner sound
      this.winnerSound = new Audio('/sounds/winner.mp3');
      this.winnerSound.volume = 0.7;
      this.winnerSound.preload = 'metadata';

      // Sound Manager initialized silently
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
        playPromise.catch(() => {
          // Sound blocked by browser - silent fail
        });
      }
    } catch (error) {
      console.error('Error playing button click:', error);
    }
  }

  playTabSwitch() {
    if (!this.isSoundEnabled || !this.tabSwitchSound) return;
    try {
      this.tabSwitchSound.currentTime = 0;
      const playPromise = this.tabSwitchSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Sound blocked by browser - silent fail
        });
      }
    } catch (error) {
      console.error('Error playing tab switch:', error);
    }
  }

  playAppBackgroundMusic() {
    if (!this.isMusicEnabled || !this.appBackgroundMusic) return;
    this.switchMusic(this.appBackgroundMusic, 'app');
  }

  playGameBackgroundMusic() {
    if (!this.isMusicEnabled || !this.gameBackgroundMusic) return;
    this.switchMusic(this.gameBackgroundMusic, 'game');
  }

  private switchMusic(newMusic: HTMLAudioElement, type: string) {
    try {
      // Stop current music if playing
      if (this.currentMusic && this.currentMusic !== newMusic) {
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
      }

      // Start new music
      this.currentMusic = newMusic;
      const playPromise = this.currentMusic.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Music started successfully
          })
          .catch(() => {
            // Music blocked by browser - silent fail
          });
      }
    } catch (error) {
      console.error(`Error playing ${type} background music:`, error);
    }
  }

  playBackgroundMusic() {
    // Default to app music for backward compatibility
    this.playAppBackgroundMusic();
  }

  stopBackgroundMusic() {
    if (this.currentMusic) {
      try {
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
      } catch (error) {
        console.error('Error stopping background music:', error);
      }
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
            // Winner sound playing
          })
          .catch(() => {
            // Sound blocked by browser - silent fail
          });
      }
    } catch (error) {
      console.error('Error playing winner sound:', error);
    }
  }

  setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    localStorage.setItem('backgroundMusicEnabled', enabled.toString());
    if (!enabled) {
      this.stopBackgroundMusic();
    } else {
      this.playAppBackgroundMusic();
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
    localStorage.setItem('soundEffectsEnabled', enabled.toString());
  }

  getMusicEnabled(): boolean {
    return this.isMusicEnabled;
  }

  getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }
}

export default SoundManager.getInstance();
