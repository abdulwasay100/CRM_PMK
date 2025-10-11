// Sound notification utility
export class SoundNotification {
  private static instance: SoundNotification;
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  private constructor() {
    // Initialize audio context on user interaction
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  public static getInstance(): SoundNotification {
    if (!SoundNotification.instance) {
      SoundNotification.instance = new SoundNotification();
    }
    return SoundNotification.instance;
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
  }

  public isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  // Play a simple beep sound
  public playBeep(frequency: number = 800, duration: number = 200) {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Error playing beep:', error);
    }
  }

  // Play notification sound based on type
  public playNotification(type: 'success' | 'error' | 'warning' | 'info' | 'reminder') {
    if (!this.isEnabled) return;

    switch (type) {
      case 'success':
        this.playSuccessSound();
        break;
      case 'error':
        this.playErrorSound();
        break;
      case 'warning':
        this.playWarningSound();
        break;
      case 'info':
        this.playInfoSound();
        break;
      case 'reminder':
        this.playReminderSound();
        break;
    }
  }

  private playSuccessSound() {
    // Pleasant ascending tone
    this.playBeep(600, 150);
    setTimeout(() => this.playBeep(800, 150), 200);
  }

  private playErrorSound() {
    // Sharp descending tone
    this.playBeep(1000, 300);
    setTimeout(() => this.playBeep(500, 300), 100);
  }

  private playWarningSound() {
    // Medium tone repeated
    this.playBeep(700, 200);
    setTimeout(() => this.playBeep(700, 200), 300);
  }

  private playInfoSound() {
    // Simple single beep
    this.playBeep(800, 200);
  }

  private playReminderSound() {
    // Gentle chime
    this.playBeep(500, 100);
    setTimeout(() => this.playBeep(600, 100), 150);
    setTimeout(() => this.playBeep(700, 100), 300);
  }

  // Play custom melody
  public playMelody(notes: { frequency: number; duration: number }[]) {
    if (!this.isEnabled || !this.audioContext) return;

    let currentTime = this.audioContext.currentTime;
    
    notes.forEach((note, index) => {
      setTimeout(() => {
        this.playBeep(note.frequency, note.duration);
      }, index * 200);
    });
  }
}

// Export singleton instance
export const soundNotification = SoundNotification.getInstance();
