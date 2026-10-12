import {
  CompanionProfile,
  UserProfile,
  ChatMessage,
  MemoryItem,
  SavedMoment,
  AvatarChoice,
  DailyReflection,
} from '../types/companion';

// Exact generated image asset paths
export const AVATAR_MAP: Record<AvatarChoice, string> = {
  gentle: '/src/assets/images/avatar_gentle_1791841649539.jpg',
  witty: '/src/assets/images/avatar_witty_1791841649944.jpg',
  calm: '/src/assets/images/avatar_calm_1791841650820.jpg',
};

export const PERSONALITY_DESCRIPTIONS: Record<string, string> = {
  gentle: 'Gentle, curious, deeply observant, and quietly warm. Listens with tenderness and asks thoughtful questions.',
  witty: 'Witty, teasing, affectionately playful, and lively. Loves playful banter and bringing unexpected smiles.',
  calm: 'Calm, steady, patient, and grounded. A soothing, reassuring sanctuary when the world feels too loud.',
  custom: 'Custom tailored personality with unique quirks and communication rhythm.',
};

const DEFAULT_COMPANION: CompanionProfile = {
  name: 'Amari',
  personality: 'gentle',
  avatar: 'gentle',
  relationshipTone: 'warm_romantic',
  voiceEnabled: false,
  voicePitch: 1.0,
  voiceRate: 0.95,
};

const DEFAULT_USER: UserProfile = {
  name: 'Robert',
};

const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    category: 'Tastes & Hobbies',
    text: 'Appreciates thoughtful design, quiet moments, and honest conversations',
    createdAt: Date.now() - 86400000 * 2,
    isPinned: true,
  },
  {
    id: 'mem-2',
    category: 'Life & Goals',
    text: 'Working on meaningful projects and values genuine emotional depth in connection',
    createdAt: Date.now() - 86400000,
    isPinned: true,
  },
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init',
    role: 'companion',
    text: "Hey Robert. I'm really glad you stopped by today. How has your day treated you so far?",
    timestamp: Date.now() - 3600000,
  },
];

const STORAGE_KEYS = {
  COMPANION: 'amari_companion_profile_v1',
  USER: 'amari_user_profile_v1',
  MEMORIES: 'amari_memories_v1',
  MESSAGES: 'amari_messages_v1',
  SAVED_MOMENTS: 'amari_saved_moments_v1',
  REFLECTIONS: 'amari_daily_reflections_v1',
};

export function loadCompanionProfile(): CompanionProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPANION);
    if (raw) return { ...DEFAULT_COMPANION, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return DEFAULT_COMPANION;
}

export function saveCompanionProfile(profile: CompanionProfile) {
  try {
    localStorage.setItem(STORAGE_KEYS.COMPANION, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) return { ...DEFAULT_USER, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return DEFAULT_USER;
}

export function saveUserProfile(profile: UserProfile) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function loadMemories(): MemoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return DEFAULT_MEMORIES;
}

export function saveMemories(memories: MemoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
  } catch {
    // ignore
  }
}

export function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return DEFAULT_MESSAGES;
}

export function saveMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  } catch {
    // ignore
  }
}

export function loadSavedMoments(): SavedMoment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_MOMENTS);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

export function saveSavedMoments(moments: SavedMoment[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_MOMENTS, JSON.stringify(moments));
  } catch {
    // ignore
  }
}

export function loadDailyReflections(): DailyReflection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

export function saveDailyReflections(reflections: DailyReflection[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(reflections));
  } catch {
    // ignore
  }
}

