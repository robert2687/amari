export type PersonalityArchetype = 'gentle' | 'witty' | 'calm' | 'custom';
export type AvatarChoice = 'gentle' | 'witty' | 'calm';
export type UserNeedMode = 'natural' | 'comfort' | 'advice' | 'distraction';
export type RelationshipTone = 'warm_romantic' | 'tender_affectionate' | 'deep_confidant';

export interface CompanionProfile {
  name: string;
  personality: PersonalityArchetype;
  customPersonality?: string;
  avatar: AvatarChoice;
  relationshipTone: RelationshipTone;
  voiceEnabled: boolean;
  voicePitch: number;
  voiceRate: number;
  selectedVoiceURI?: string;
}

export interface UserProfile {
  name: string;
  notes?: string;
}

export type EmojiReaction = 'heart' | 'laugh' | 'support';

export interface ChatMessage {
  id: string;
  role: 'user' | 'companion';
  text: string;
  timestamp: number;
  needMode?: UserNeedMode;
  isSaved?: boolean;
  reaction?: EmojiReaction | null;
}

export interface MemoryItem {
  id: string;
  category: string;
  text: string;
  createdAt: number;
  isPinned?: boolean;
}

export interface SavedMoment {
  id: string;
  messageId: string;
  text: string;
  timestamp: number;
  note?: string;
}

export type SentimentCategory =
  | 'Joyful'
  | 'Reflective'
  | 'Anxious'
  | 'Comfort-Seeking'
  | 'Grounded';

export interface SentimentDataPoint {
  category: SentimentCategory;
  count: number;
  percentage: number;
  color: string;
  description: string;
}

export interface SentimentTimePoint {
  date: string;
  timestamp: number;
  Joyful: number;
  Reflective: number;
  Anxious: number;
  'Comfort-Seeking': number;
  Grounded: number;
  total: number;
}

export interface DailyReflection {
  id: string;
  dateString: string; // e.g. '2026-10-12'
  question: string;
  theme: string;
  contextHint?: string;
  userAnswer?: string;
  answeredAt?: number;
  isSkipped?: boolean;
}


