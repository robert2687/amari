/**
 * Web Speech API text-to-speech helper with warm voice prioritization
 */

export interface VoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
}

export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    const handler = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
  });
}

export function speakText(
  text: string,
  options?: {
    voiceURI?: string;
    pitch?: number;
    rate?: number;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  // Cancel any existing speech
  window.speechSynthesis.cancel();

  // Clean text from any asterisks or formatting
  const clean = text.replace(/[*_#~]/g, '').trim();
  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.pitch = options?.pitch ?? 1.0;
  utterance.rate = options?.rate ?? 0.95; // Slightly gentler and slower for intimacy

  const voices = window.speechSynthesis.getVoices();
  if (options?.voiceURI) {
    const matched = voices.find((v) => v.voiceURI === options.voiceURI);
    if (matched) utterance.voice = matched;
  } else {
    // Prefer warm natural female or expressive voices if available
    const preferred = voices.find(
      (v) =>
        (v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.name.includes('Karen') ||
          v.name.includes('Victoria') ||
          v.name.includes('Google UK English Female') ||
          v.name.includes('Serena')) &&
        v.lang.startsWith('en')
    ) || voices.find((v) => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;
  }

  utterance.onend = () => options?.onEnd?.();
  utterance.onerror = (e) => options?.onError?.(e);

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
