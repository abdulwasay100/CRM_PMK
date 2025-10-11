import { useEffect } from 'react';
import { toast } from 'sonner';
import { soundNotification } from '@/lib/sound-notification';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'reminder';
  title: string;
  message?: string;
  duration?: number;
  playSound?: boolean;
}

export function playNotificationSound(type: 'success' | 'error' | 'warning' | 'info' | 'reminder') {
  soundNotification.playNotification(type);
}

export function showNotification({ 
  type, 
  title, 
  message, 
  duration = 4000, 
  playSound = true 
}: NotificationProps) {
  // Play sound if enabled
  if (playSound) {
    soundNotification.playNotification(type);
  }

  // Show toast notification
  switch (type) {
    case 'success':
      toast.success(title, { description: message, duration });
      break;
    case 'error':
      toast.error(title, { description: message, duration });
      break;
    case 'warning':
      toast.warning(title, { description: message, duration });
      break;
    case 'info':
      toast.info(title, { description: message, duration });
      break;
    case 'reminder':
      toast.info(title, { description: message, duration });
      break;
  }
}

// Hook for playing notification sounds
export function useNotificationSound() {
  useEffect(() => {
    // Enable sound notifications on user interaction
    const enableSound = () => {
      soundNotification.enable();
    };

    // Enable on first user interaction
    document.addEventListener('click', enableSound, { once: true });
    document.addEventListener('keydown', enableSound, { once: true });

    return () => {
      document.removeEventListener('click', enableSound);
      document.removeEventListener('keydown', enableSound);
    };
  }, []);

  return {
    playSound: soundNotification.playNotification.bind(soundNotification),
    enableSound: soundNotification.enable.bind(soundNotification),
    disableSound: soundNotification.disable.bind(soundNotification),
    isEnabled: soundNotification.isSoundEnabled.bind(soundNotification),
  };
}
