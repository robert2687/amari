/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CompanionProfile,
  UserProfile,
  ChatMessage,
  MemoryItem,
  SavedMoment,
  UserNeedMode,
  EmojiReaction,
  DailyReflection,
} from './types/companion';
import {
  loadCompanionProfile,
  saveCompanionProfile,
  loadUserProfile,
  saveUserProfile,
  loadMemories,
  saveMemories,
  loadMessages,
  saveMessages,
  loadSavedMoments,
  saveSavedMoments,
  loadDailyReflections,
  saveDailyReflections,
} from './utils/storage';
import { speakText } from './utils/speechSynthesis';
import { detectCrisisIndicators } from './utils/safety';
import { triggerHaptic } from './utils/haptics';
import { CompanionHeader } from './components/CompanionHeader';
import { ChatView } from './components/ChatView';
import { MemoryVault } from './components/MemoryVault';
import { SavedMomentsModal } from './components/SavedMomentsModal';
import { CareGuideModal } from './components/CareGuideModal';
import { SentimentInsights } from './components/SentimentInsights';
import { CrisisBanner } from './components/CrisisBanner';
import { SettingsModal } from './components/SettingsModal';
import { ReflectionsJournalModal } from './components/ReflectionsJournalModal';
import { CompanionProfileDrawer } from './components/CompanionProfileDrawer';
import { MessageSquare, BookOpen, Bookmark, HeartHandshake, TrendingUp, Sparkles } from 'lucide-react';
import {
  TimeOfDayTheme,
  ResolvedTheme,
  THEMES,
  getAutoThemeForHour,
  loadThemePreference,
  saveThemePreference,
} from './utils/theme';

const TABS: Array<'chat' | 'memories' | 'insights' | 'saved' | 'care'> = [
  'chat',
  'memories',
  'insights',
  'saved',
  'care',
];

export default function App() {
  const [companion, setCompanion] = useState<CompanionProfile>(loadCompanionProfile);
  const [user, setUser] = useState<UserProfile>(loadUserProfile);
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [memories, setMemories] = useState<MemoryItem[]>(loadMemories);
  const [savedMoments, setSavedMoments] = useState<SavedMoment[]>(loadSavedMoments);
  const [reflections, setReflections] = useState<DailyReflection[]>(loadDailyReflections);

  const [activeTab, setActiveTab] = useState<'chat' | 'memories' | 'insights' | 'saved' | 'care'>('chat');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);
  const [isReflectionLoading, setIsReflectionLoading] = useState<boolean>(false);
  const [showCrisisBanner, setShowCrisisBanner] = useState<boolean>(false);
  const [memoryNotification, setMemoryNotification] = useState<string | null>(null);

  // Mobile virtual keyboard visual viewport height tracker
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Mobile horizontal swipe gestures across tabs
  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, button, a, .touch-pan-x, .overflow-x-auto, [data-no-swipe]')) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Only switch tabs on intentional horizontal edge swipes (>75px) without vertical scroll (<40px)
    if (Math.abs(deltaX) > 75 && Math.abs(deltaY) < 40) {
      const currentIndex = TABS.indexOf(activeTab);
      if (deltaX < 0 && currentIndex < TABS.length - 1) {
        triggerHaptic('select');
        setActiveTab(TABS[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        triggerHaptic('select');
        setActiveTab(TABS[currentIndex - 1]);
      }
    }
  };

  // Dynamic Time-of-Day Theme System
  const [themePref, setThemePref] = useState<TimeOfDayTheme>(loadThemePreference);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const pref = loadThemePreference();
    return pref === 'auto' ? getAutoThemeForHour() : pref;
  });

  useEffect(() => {
    saveThemePreference(themePref);
    const updateTheme = () => {
      if (themePref === 'auto') {
        setResolvedTheme(getAutoThemeForHour());
      } else {
        setResolvedTheme(themePref);
      }
    };
    updateTheme();
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, [themePref]);

  // Sync state to localStorage on updates
  useEffect(() => {
    saveCompanionProfile(companion);
  }, [companion]);

  useEffect(() => {
    saveUserProfile(user);
  }, [user]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    saveMemories(memories);
  }, [memories]);

  useEffect(() => {
    saveSavedMoments(savedMoments);
  }, [savedMoments]);

  useEffect(() => {
    saveDailyReflections(reflections);
  }, [reflections]);

  // Fetch or generate today's daily reflection if not already generated
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = reflections.find((r) => r.dateString === todayStr);

    if (!existing) {
      const fetchReflection = async () => {
        setIsReflectionLoading(true);
        try {
          const res = await fetch('/api/reflection/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companionName: companion.name,
              userName: user.name,
              personality:
                companion.personality === 'custom' && companion.customPersonality
                  ? companion.customPersonality
                  : companion.personality,
              messages: messages.slice(-8),
              memories,
            }),
          });
          const data = await res.json();
          if (data.question) {
            const newRef: DailyReflection = {
              id: `ref-${todayStr}-${Date.now()}`,
              dateString: todayStr,
              question: data.question,
              theme: data.theme || 'Daily Check-in',
              contextHint: data.contextHint,
              options: Array.isArray(data.options) && data.options.length > 0
                ? data.options
                : [
                    'Sitting with a warm cup in peace',
                    'Stepping outside into fresh air',
                    'Unwinding with music or a favorite show',
                    'Letting go of the day and resting',
                  ],
            };
            setReflections((prev) => [newRef, ...prev.filter((r) => r.dateString !== todayStr)]);
          }
        } catch (err) {
          console.error('Failed to generate daily reflection:', err);
          const fallbackRef: DailyReflection = {
            id: `ref-${todayStr}-${Date.now()}`,
            dateString: todayStr,
            question:
              'Looking back on your day, what was one quiet moment that felt genuinely yours?',
            theme: 'Evening Presence',
            contextHint: 'For your quiet moment with Amari today',
            options: [
              'Sitting with a warm cup in peace',
              'Stepping outside into fresh air',
              'Unwinding with music or a favorite show',
              'Letting go of today’s pressure and resting',
            ],
          };
          setReflections((prev) => [fallbackRef, ...prev.filter((r) => r.dateString !== todayStr)]);
        } finally {
          setIsReflectionLoading(false);
        }
      };

      fetchReflection();
    }
  }, [companion.name, companion.personality, user.name]);

  // Extract memories in the background after conversation turns
  const extractMemoriesAsync = useCallback(
    async (updatedMessages: ChatMessage[]) => {
      try {
        const res = await fetch('/api/memories/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.slice(-6),
            existingMemories: memories,
          }),
        });
        const data = await res.json();
        if (data.memories && Array.isArray(data.memories) && data.memories.length > 0) {
          const newItems: MemoryItem[] = data.memories.map((m: any, idx: number) => ({
            id: `mem-auto-${Date.now()}-${idx}`,
            category: m.category || 'Life & Goals',
            text: m.text,
            createdAt: Date.now(),
          }));

          setMemories((prev) => [...newItems, ...prev]);
          setMemoryNotification(`${companion.name} noted: "${newItems[0].text}"`);
          setTimeout(() => setMemoryNotification(null), 5000);
        }
      } catch (err) {
        console.error('Failed to extract memories:', err);
      }
    },
    [companion.name, memories]
  );

  const handleSendMessage = async (text: string, needMode?: UserNeedMode) => {
    if (isStreaming) return;

    if (detectCrisisIndicators(text)) {
      setShowCrisisBanner(true);
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
      needMode,
    };

    const tempCompanionId = `companion-${Date.now()}`;
    const initialCompanionMessage: ChatMessage = {
      id: tempCompanionId,
      role: 'companion',
      text: '',
      timestamp: Date.now(),
      needMode,
    };

    const updatedWithUser = [...messages, userMessage];
    setMessages([...updatedWithUser, initialCompanionMessage]);
    setIsStreaming(true);

    let accumulatedText = '';

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companionName: companion.name,
          userName: user.name,
          personality:
            companion.personality === 'custom' && companion.customPersonality
              ? companion.customPersonality
              : companion.personality,
          relationshipTone: companion.relationshipTone,
          userNeedsMode: needMode || 'natural',
          memories,
          messages: updatedWithUser.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      if (!response.body) {
        throw new Error('No response stream available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempCompanionId
                      ? { ...m, text: accumulatedText }
                      : m
                  )
                );
              }
              if (parsed.error) {
                accumulatedText += `\n${parsed.error}`;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempCompanionId
                      ? { ...m, text: accumulatedText }
                      : m
                  )
                );
              }
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }
      }

      // Final message assembly
      const completedMessages = [
        ...updatedWithUser,
        {
          ...initialCompanionMessage,
          text: accumulatedText.trim() || "I'm right here with you.",
        },
      ];

      setMessages(completedMessages);

      // Auto speech read-aloud if enabled
      if (companion.voiceEnabled && accumulatedText.trim()) {
        speakText(accumulatedText.trim(), {
          voiceURI: companion.selectedVoiceURI,
          pitch: companion.voicePitch,
          rate: companion.voiceRate,
        });
      }

      // Check crisis keywords in companion's response
      if (detectCrisisIndicators(accumulatedText)) {
        setShowCrisisBanner(true);
      }

      // Run memory extraction in background
      extractMemoriesAsync(completedMessages);
    } catch (err: any) {
      console.error('Chat stream error:', err);
      const fallbackText =
        accumulatedText ||
        "I had a quiet moment thinking of what to say. Could you share that with me again?";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempCompanionId ? { ...m, text: fallbackText } : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm(`Start a fresh conversation with ${companion.name}?`)) {
      const freshStarter: ChatMessage = {
        id: `fresh-${Date.now()}`,
        role: 'companion',
        text: `Hey ${user.name}. It feels good to pause and start fresh. How are you feeling in this moment?`,
        timestamp: Date.now(),
      };
      setMessages([freshStarter]);
    }
  };

  const handleSaveMoment = (msg: ChatMessage) => {
    // Check if already saved
    if (savedMoments.some((m) => m.messageId === msg.id)) {
      setSavedMoments((prev) => prev.filter((m) => m.messageId !== msg.id));
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isSaved: false } : m))
      );
      return;
    }

    const newMoment: SavedMoment = {
      id: `saved-${Date.now()}`,
      messageId: msg.id,
      text: msg.text,
      timestamp: msg.timestamp,
    };
    setSavedMoments((prev) => [newMoment, ...prev]);
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, isSaved: true } : m))
    );
  };

  const handleAddMemory = (category: string, text: string) => {
    const newItem: MemoryItem = {
      id: `mem-${Date.now()}`,
      category,
      text,
      createdAt: Date.now(),
    };
    setMemories((prev) => [newItem, ...prev]);
  };

  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleTogglePinMemory = (id: string) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isPinned: !m.isPinned } : m))
    );
  };

  const handleDeleteSavedMoment = (id: string) => {
    const target = savedMoments.find((m) => m.id === id);
    if (target) {
      setMessages((prev) =>
        prev.map((m) => (m.id === target.messageId ? { ...m, isSaved: false } : m))
      );
    }
    setSavedMoments((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggleReaction = (messageId: string, reaction: EmojiReaction) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          const nextReaction = m.reaction === reaction ? null : reaction;
          return { ...m, reaction: nextReaction };
        }
        return m;
      })
    );
  };

  const handleAnswerReflection = async (
    reflectionId: string,
    answer: string,
    sendToChat: boolean,
    selectedOption?: string
  ) => {
    setReflections((prev) =>
      prev.map((r) =>
        r.id === reflectionId
          ? {
              ...r,
              userAnswer: answer,
              selectedOption: selectedOption || r.selectedOption,
              answeredAt: Date.now(),
              isSkipped: false,
            }
          : r
      )
    );

    if (sendToChat) {
      const textToSend =
        selectedOption && answer !== selectedOption
          ? `Here is my daily reflection for today: "${selectedOption}" — ${answer}`
          : `Here is my daily reflection for today: "${answer}"`;
      await handleSendMessage(textToSend);
    } else {
      setMemoryNotification('Saved to your private reflections journal.');
      setTimeout(() => setMemoryNotification(null), 4000);
    }
  };

  const handleSkipReflection = (reflectionId: string) => {
    setReflections((prev) =>
      prev.map((r) => (r.id === reflectionId ? { ...r, isSkipped: true } : r))
    );
  };

  const handleDeleteReflection = (id: string) => {
    setReflections((prev) => prev.filter((r) => r.id !== id));
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayReflection = reflections.find((r) => r.dateString === todayStr) || null;

  const activeThemeConfig = THEMES[resolvedTheme];

  return (
    <div
      className="h-[100dvh] max-h-[100dvh] w-full text-slate-100 flex flex-col selection:bg-rose-900 selection:text-white relative overflow-hidden"
      style={{
        background: activeThemeConfig.bgStyle,
        transition: 'background 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
        ...(viewportHeight ? { height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` } : {}),
      }}
    >
      {/* Ambient Atmospheric Glow Elements */}
      <div
        className="fixed -top-40 -left-40 w-[550px] h-[550px] rounded-full pointer-events-none blur-[140px] opacity-40 transition-colors duration-1000 z-0"
        style={{ backgroundColor: activeThemeConfig.glowColor }}
      />
      <div
        className="fixed top-1/2 -right-40 w-[450px] h-[450px] rounded-full pointer-events-none blur-[150px] opacity-25 transition-colors duration-1000 z-0"
        style={{ backgroundColor: activeThemeConfig.glowColor }}
      />

      {/* Crisis Banner if triggered */}
      {showCrisisBanner && (
        <CrisisBanner onDismiss={() => setShowCrisisBanner(false)} />
      )}

      {/* Top Header */}
      <CompanionHeader
        profile={companion}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfileDrawer={() => setIsProfileDrawerOpen(true)}
        themePref={themePref}
        resolvedTheme={resolvedTheme}
        onThemeChange={setThemePref}
      />

      {/* Subtle Memory Toast notification */}
      {memoryNotification && (
        <div className="fixed top-16 right-3 sm:right-4 z-40 bg-[#161b22] border border-rose-500/30 text-rose-200 px-3.5 py-2 rounded-xl shadow-xl text-xs flex items-center gap-2 animate-fadeIn max-w-[85vw] sm:max-w-sm">
          <BookOpen className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="truncate">{memoryNotification}</span>
        </div>
      )}

      {/* Main Tab Content with smooth horizontal swipe support */}
      <main
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 min-h-0 relative z-10 flex flex-col overflow-hidden pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0"
      >
        {activeTab === 'chat' && (
          <ChatView
            companion={companion}
            user={user}
            messages={messages}
            memories={memories}
            themePref={themePref}
            resolvedTheme={resolvedTheme}
            dailyReflection={todayReflection}
            isReflectionLoading={isReflectionLoading}
            onThemeChange={setThemePref}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onSaveMoment={handleSaveMoment}
            onNavigateToMemories={() => setActiveTab('memories')}
            onNavigateToInsights={() => setActiveTab('insights')}
            onToggleReaction={handleToggleReaction}
            onAnswerReflection={handleAnswerReflection}
            onSkipReflection={handleSkipReflection}
            onOpenReflectionJournal={() => setIsJournalOpen(true)}
            isStreaming={isStreaming}
            onTriggerCrisisAlert={() => setShowCrisisBanner(true)}
          />
        )}

        {activeTab === 'memories' && (
          <div className="h-full overflow-y-auto overscroll-contain px-2 sm:px-6 py-4">
            <MemoryVault
              memories={memories}
              companionName={companion.name}
              userName={user.name}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
              onTogglePin={handleTogglePinMemory}
            />
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="h-full overflow-y-auto overscroll-contain px-2 sm:px-6 py-4">
            <SentimentInsights
              messages={messages}
              reflections={reflections}
              companionName={companion.name}
              userName={user.name}
              onNavigateToChat={() => setActiveTab('chat')}
              onOpenJournal={() => setIsJournalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="h-full overflow-y-auto overscroll-contain px-2 sm:px-6 py-4">
            <SavedMomentsModal
              moments={savedMoments}
              companionName={companion.name}
              userName={user.name}
              onDeleteMoment={handleDeleteSavedMoment}
              onNavigateToChat={() => setActiveTab('chat')}
            />
          </div>
        )}

        {activeTab === 'care' && (
          <div className="h-full overflow-y-auto overscroll-contain px-2 sm:px-6 py-4">
            <CareGuideModal
              companionName={companion.name}
              userName={user.name}
            />
          </div>
        )}
      </main>

      {/* Settings Modal (Mobile bottom sheet / desktop modal) */}
      <SettingsModal
        companion={companion}
        user={user}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(updatedCompanion, updatedUser) => {
          setCompanion(updatedCompanion);
          setUser(updatedUser);
        }}
      />

      {/* Daily Reflections Journal Modal (Mobile bottom sheet / desktop modal) */}
      <ReflectionsJournalModal
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        reflections={reflections}
        companionName={companion.name}
        userName={user.name}
        onDeleteReflection={handleDeleteReflection}
      />

      {/* Companion Profile Bottom Sheet Drawer (Mobile one-handed touch sheet) */}
      <CompanionProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        companion={companion}
        user={user}
        memoriesCount={memories.length}
        themePref={themePref}
        resolvedTheme={resolvedTheme}
        onThemeChange={setThemePref}
        onOpenSettings={() => {
          setIsProfileDrawerOpen(false);
          setIsSettingsOpen(true);
        }}
        onNavigateToMemories={() => {
          setIsProfileDrawerOpen(false);
          setActiveTab('memories');
        }}
        onClearChat={handleClearChat}
      />

      {/* Mobile Bottom Tab Navigation: 5 Primary Tabs, 48px+ touch targets, thumb-accessible */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161b22]/95 backdrop-blur-md border-t border-white/[0.08] grid grid-cols-5 items-center h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-safe px-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <button
          onClick={() => {
            setActiveTab('chat');
            triggerHaptic('select');
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[48px] min-w-[48px] transition-all rounded-xl py-1 active:scale-95 ${
            activeTab === 'chat'
              ? 'text-rose-400 font-semibold bg-white/[0.06] shadow-inner'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Chat with companion"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {todayReflection && !todayReflection.userAnswer && !todayReflection.isSkipped && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </div>
          <span className="text-[11px] tracking-tight mt-1 font-medium">Chat</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('memories');
            triggerHaptic('select');
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[48px] min-w-[48px] transition-all rounded-xl py-1 active:scale-95 ${
            activeTab === 'memories'
              ? 'text-rose-400 font-semibold bg-white/[0.06] shadow-inner'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Memory notes"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1 font-medium">Notes</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('insights');
            triggerHaptic('select');
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[48px] min-w-[48px] transition-all rounded-xl py-1 active:scale-95 ${
            activeTab === 'insights'
              ? 'text-rose-400 font-semibold bg-white/[0.06] shadow-inner'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Emotional journey insights"
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1 font-medium">Journey</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('saved');
            triggerHaptic('select');
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[48px] min-w-[48px] transition-all rounded-xl py-1 active:scale-95 ${
            activeTab === 'saved'
              ? 'text-rose-400 font-semibold bg-white/[0.06] shadow-inner'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Saved moments and quotes"
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1 font-medium">Saved</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('care');
            triggerHaptic('select');
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[48px] min-w-[48px] transition-all rounded-xl py-1 active:scale-95 ${
            activeTab === 'care'
              ? 'text-rose-400 font-semibold bg-white/[0.06] shadow-inner'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Care and ethics guide"
        >
          <HeartHandshake className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1 font-medium">Care</span>
        </button>
      </nav>
    </div>
  );
}
