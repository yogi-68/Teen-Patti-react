class SoundManager {
  private static instance: SoundManager;
  private buttonClickSound: HTMLAudioElement | null = null;
  private tabSwitchSound: HTMLAudioElement | null = null;
  private appBackgroundMusic: HTMLAudioElement | null = null;
  private gameBackgroundMusic: HTMLAudioElement | null = null;
  private currentMusic: HTMLAudioElement | null = null;
  private winnerSound: HTMLAudioElement | null = null;
  private loserSound: HTMLAudioElement | null = null;
  private cardDistributeSound: HTMLAudioElement | null = null;
  private chaalSound: HTMLAudioElement | null = null;
  private blindSound: HTMLAudioElement | null = null;
  private foldSound: HTMLAudioElement | null = null;
  private raiseSound: HTMLAudioElement | null = null;
  private coinSound: HTMLAudioElement | null = null;
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

      // Load loser sound
      this.loserSound = new Audio('/sounds/loser.mp3');
      this.loserSound.volume = 0.6;
      this.loserSound.preload = 'metadata';

      // Load card distribution sound
      this.cardDistributeSound = new Audio('/sounds/card-distribute.mp3');
      this.cardDistributeSound.volume = 0.5;
      this.cardDistributeSound.preload = 'metadata';

      // Load chaal (seen) sound
      this.chaalSound = new Audio('/sounds/chaal.mp3');
      this.chaalSound.volume = 0.6;
      this.chaalSound.preload = 'metadata';

      // Load blind sound
      this.blindSound = new Audio('/sounds/blind.mp3');
      this.blindSound.volume = 0.6;
      this.blindSound.preload = 'metadata';

      // Load fold sound
      this.foldSound = new Audio('/sounds/fold.mp3');
      this.foldSound.volume = 0.5;
      this.foldSound.preload = 'metadata';

      // Load raise sound
      this.raiseSound = new Audio('/sounds/raise.mp3');
      this.raiseSound.volume = 0.65;
      this.raiseSound.preload = 'metadata';

      // Load coin sound
      this.coinSound = new Audio('/sounds/coins.mp3');
      this.coinSound.volume = 0.5;
      this.coinSound.preload = 'metadata';

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

  playLoserSound() {
    if (!this.isSoundEnabled || !this.loserSound) return;
    try {
      this.loserSound.currentTime = 0;
      const playPromise = this.loserSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (error) {
      console.error('Error playing loser sound:', error);
    }
  }

  playCardDistribute() {
    if (!this.isSoundEnabled || !this.cardDistributeSound) return;
    try {
      this.cardDistributeSound.currentTime = 0;
      const playPromise = this.cardDistributeSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (error) {
      console.error('Error playing card distribute sound:', error);
    }
  }

  playChaalSound() {
    if (!this.isSoundEnabled || !this.chaalSound) return;
    try {
      this.chaalSound.currentTime = 0;
      const playPromise = this.chaalSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (error) {
      console.error('Error playing chaal sound:', error);
    }
  }

  playBlindSound() {
    if (!this.isSoundEnabled || !this.blindSound) return;
    try {
      this.blindSound.currentTime = 0;
      const playPromise = this.blindSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (error) {
      console.error('Error playing blind sound:', error);
    }
  }

  playFoldSound() {
    if (!this.isSoundEnabled || !this.foldSound) return;
    try {
      this.foldSound.currentTime = 0;
      const playPromise = this.foldSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (error) {
      console.error('Error playing fold sound:', error);
    }
  }

  playRaiseSound() {
    if (!this.isSoundEnabled || !this.raiseSound) return;
    try {
      this.raiseSound.currentTime = 0;
      const playPromise = this.raiseSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (error) {
      console.error('Error playing raise sound:', error);
    }
  }

  playCoinSound() {
    if (!this.isSoundEnabled || !this.coinSound) return;
    try {
      this.coinSound.currentTime = 0;
      const playPromise = this.coinSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (error) {
      console.error('Error playing coin sound:', error);
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
