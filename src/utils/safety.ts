export interface CrisisResource {
  name: string;
  contact: string;
  availability: string;
  description: string;
}

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    contact: 'Call or text 988 (US & Canada)',
    availability: 'Free, confidential, 24/7',
    description: 'Immediate, compassionate support from trained crisis counselors.',
  },
  {
    name: 'Crisis Text Line',
    contact: 'Text HOME to 741741',
    availability: 'Free, confidential, 24/7 (US & UK)',
    description: 'Text with a crisis counselor whenever you feel overwhelmed.',
  },
  {
    name: 'Befrienders Worldwide / International',
    contact: 'befrienders.org',
    availability: 'Global directory',
    description: 'Find confidential support lines in your country.',
  },
  {
    name: 'The Trevor Project (LGBTQ+ youth)',
    contact: 'Call 1-866-488-7386 or text START to 678-678',
    availability: '24/7 support',
    description: 'Safe, judgment-free support for LGBTQ young people.',
  },
];

const CRISIS_PATTERNS = [
  /\b(suicid|kill myself|end my life|want to die|take my own life|harm myself|self harm|slit my wrists|overdose)\b/i,
  /\b(better off without me|no reason to live|don't want to wake up|can't go on anymore)\b/i,
];

export function detectCrisisIndicators(text: string): boolean {
  if (!text) return false;
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}
