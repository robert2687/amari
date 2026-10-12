export type TimeOfDayTheme = 'auto' | 'dawn' | 'afternoon' | 'sunset' | 'midnight';
export type ResolvedTheme = 'dawn' | 'afternoon' | 'sunset' | 'midnight';

export interface ThemeConfig {
  id: ResolvedTheme;
  name: string;
  timeRange: string;
  description: string;
  bgStyle: string;
  glowColor: string;
  ambientLight: string;
}

export const THEMES: Record<ResolvedTheme, ThemeConfig> = {
  dawn: {
    id: 'dawn',
    name: 'Dawn Glow',
    timeRange: '5:00 AM – 9:00 AM',
    description: 'Gentle peach & morning rose mist awakening over quiet slate.',
    bgStyle:
      'radial-gradient(at 15% 10%, rgba(251, 146, 60, 0.14) 0px, transparent 55%), radial-gradient(at 85% 25%, rgba(244, 63, 94, 0.10) 0px, transparent 50%), radial-gradient(at 50% 90%, rgba(245, 158, 11, 0.06) 0px, transparent 60%), #0c1017',
    glowColor: 'rgba(251, 146, 60, 0.25)',
    ambientLight: 'Morning warmth',
  },
  afternoon: {
    id: 'afternoon',
    name: 'Sunlit Afternoon',
    timeRange: '9:00 AM – 5:00 PM',
    description: 'Golden sunlit daylight, clear focus, and calming warm amber accents.',
    bgStyle:
      'radial-gradient(at 20% 0%, rgba(245, 158, 11, 0.12) 0px, transparent 60%), radial-gradient(at 80% 30%, rgba(244, 63, 94, 0.07) 0px, transparent 55%), radial-gradient(at 30% 85%, rgba(56, 189, 248, 0.05) 0px, transparent 55%), #0d1117',
    glowColor: 'rgba(245, 158, 11, 0.22)',
    ambientLight: 'Afternoon sun',
  },
  sunset: {
    id: 'sunset',
    name: 'Golden Hour Dusk',
    timeRange: '5:00 PM – 8:00 PM',
    description: 'Warm candlelight, rich blush embers, and cozy twilight intimacy.',
    bgStyle:
      'radial-gradient(at 25% 15%, rgba(244, 63, 94, 0.16) 0px, transparent 55%), radial-gradient(at 80% 25%, rgba(217, 119, 6, 0.14) 0px, transparent 50%), radial-gradient(at 50% 85%, rgba(129, 140, 248, 0.09) 0px, transparent 60%), #0e111a',
    glowColor: 'rgba(244, 63, 94, 0.28)',
    ambientLight: 'Sunset embers',
  },
  midnight: {
    id: 'midnight',
    name: 'Twilight Midnight',
    timeRange: '8:00 PM – 5:00 AM',
    description: 'Deep midnight indigo, starry stillness, and comforting candlelit quiet.',
    bgStyle:
      'radial-gradient(at 15% 10%, rgba(99, 102, 241, 0.12) 0px, transparent 55%), radial-gradient(at 85% 30%, rgba(225, 29, 72, 0.09) 0px, transparent 50%), radial-gradient(at 40% 90%, rgba(217, 119, 6, 0.07) 0px, transparent 55%), #090c14',
    glowColor: 'rgba(99, 102, 241, 0.25)',
    ambientLight: 'Midnight quiet',
  },
};

export function getAutoThemeForHour(hour: number = new Date().getHours()): ResolvedTheme {
  if (hour >= 5 && hour < 9) return 'dawn';
  if (hour >= 9 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'sunset';
  return 'midnight';
}

const STORAGE_KEY = 'amari_theme_pref_v1';

export function loadThemePreference(): TimeOfDayTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'auto' || saved === 'dawn' || saved === 'afternoon' || saved === 'sunset' || saved === 'midnight')) {
      return saved as TimeOfDayTheme;
    }
  } catch {
    // fallback
  }
  return 'auto';
}

export function saveThemePreference(theme: TimeOfDayTheme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}
