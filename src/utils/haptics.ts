/**
 * Safe haptic feedback triggers for mobile devices using the Web Vibration API.
 */

export function triggerHaptic(type: 'start' | 'stop' | 'cancel' | 'success' | 'light' | 'select') {
  if (typeof window === 'undefined' || !navigator) return;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      switch (type) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'select':
          navigator.vibrate(22);
          break;
        case 'start':
          // Distinct tactile click when microphone starts capturing
          navigator.vibrate(45);
          break;
        case 'stop':
          // Subtle double-pulse feedback when recording stops for transcription
          navigator.vibrate([35, 40, 35]);
          break;
        case 'cancel':
          // Brief dismiss tap
          navigator.vibrate(25);
          break;
        case 'success':
          // Soft confirmation vibration
          navigator.vibrate([30, 30, 45]);
          break;
      }
    }
  } catch {
    // Silent fallback if vibration is not supported or permitted on device
  }
}
