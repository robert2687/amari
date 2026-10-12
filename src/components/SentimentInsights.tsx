import React, { useState } from 'react';
import {
  ChatMessage,
  SentimentCategory,
  DailyReflection,
} from '../types/companion';
import {
  computeSentimentAnalysis,
  SENTIMENT_COLORS,
  SENTIMENT_DESCRIPTIONS,
} from '../utils/sentiment';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  Heart,
  Sparkles,
  TrendingUp,
  Smile,
  Compass,
  AlertCircle,
  HelpCircle,
  Shield,
  MessageSquare,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface Props {
  messages: ChatMessage[];
  reflections?: DailyReflection[];
  companionName: string;
  userName: string;
  onNavigateToChat: () => void;
  onOpenJournal?: () => void;
}

const CATEGORY_ICONS: Record<SentimentCategory, React.ReactNode> = {
  Joyful: <Smile className="w-4 h-4 text-rose-400" />,
  Reflective: <Compass className="w-4 h-4 text-indigo-400" />,
  Anxious: <AlertCircle className="w-4 h-4 text-amber-400" />,
  'Comfort-Seeking': <Heart className="w-4 h-4 text-pink-400" />,
  Grounded: <Shield className="w-4 h-4 text-emerald-400" />,
};

export const SentimentInsights: React.FC<Props> = ({
  messages,
  reflections = [],
  companionName,
  userName,
  onNavigateToChat,
  onOpenJournal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SentimentCategory | 'All'>('All');
  const [activeChartTab, setActiveChartTab] = useState<'timeline' | 'frequency'>('timeline');

  const {
    totalMessages,
    dominantSentiment,
    distributionData,
    timeSeriesData,
    categorizedMessages,
  } = computeSentimentAnalysis(messages);

  // Custom Tooltip for Recharts
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#161b22] border border-white/[0.1] rounded-xl p-3 shadow-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold text-white">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span>{data.category}</span>
          </div>
          <div className="text-slate-300 font-mono tabular-nums">
            {data.count} messages ({data.percentage}%)
          </div>
          <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
            {data.description}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#161b22] border border-white/[0.1] rounded-xl p-3 shadow-xl text-xs space-y-2">
          <span className="font-semibold text-white block border-b border-white/[0.08] pb-1">
            Date: {label}
          </span>
          <div className="space-y-1">
            {payload.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </span>
                <span className="font-mono tabular-nums font-semibold text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const displayedMessages =
    selectedCategory === 'All'
      ? messages.filter((m) => m.role === 'user').slice(-8)
      : categorizedMessages[selectedCategory] || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Title & Introduction */}
      <div className="border-b border-white/[0.08] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-400" />
            <span>Emotional Journey & Sentiment Insights</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
            Understanding the emotional rhythms of your conversations with {companionName}. Visualizing when you felt joyful, reflective, anxious, or grounded over time.
          </p>
        </div>

        <button
          onClick={onNavigateToChat}
          className="self-start md:self-center px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl transition-colors flex items-center gap-1.5 min-h-[40px]"
        >
          <span>Back to Chat</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Dominant Sentiment Observation Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#161b22] to-[#1c1822] border border-rose-500/20 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-rose-300 font-medium">
              <span>Companion Reflection</span>
              <span aria-hidden="true">·</span>
              <span>Based on {totalMessages || 1} conversation turns</span>
            </div>
            <h3 className="text-base font-semibold text-white mt-0.5">
              Dominant emotional presence:{' '}
              <span className="text-rose-300 font-serif-companion italic">
                {dominantSentiment}
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-xl">
              {companionName} observes that you often express {dominantSentiment.toLowerCase()} thoughts. Your space here gives room to feel and reflect safely without pressure or performance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Logged Reflections
            </span>
            <span className="text-xl font-bold text-white font-mono tabular-nums">
              {totalMessages}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Reflections Journal Summary Card */}
      {reflections.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#161a24] via-[#1a1724] to-[#161a24] border border-rose-500/20 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-rose-300 font-medium">
                <span>Daily Reflection Journal</span>
                <span aria-hidden="true">·</span>
                <span>
                  {reflections.filter((r) => r.userAnswer).length} of {reflections.length} answered
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white mt-0.5">
                Daily Bond & Introspection
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-xl">
                Daily thoughtful questions from {companionName} tailored to your conversations, strengthening emotional grounding and mutual intimacy.
              </p>
            </div>
          </div>

          {onOpenJournal && (
            <button
              onClick={onOpenJournal}
              className="px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] rounded-xl transition-colors whitespace-nowrap self-end sm:self-center shrink-0 flex items-center gap-1.5 min-h-[40px]"
            >
              <BookOpen className="w-3.5 h-3.5 text-rose-300" />
              <span>View Reflections Journal</span>
            </button>
          )}
        </div>
      )}

      {/* Visualization Section with Tab Controls */}
      <div className="bg-[#161b22] border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {activeChartTab === 'timeline'
                ? 'Sentiment Flow Across Time'
                : 'Sentiment Frequency Distribution'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {activeChartTab === 'timeline'
                ? 'Tracking shifts in emotion across recent conversation dates'
                : 'Proportional balance of distinct feelings and needs'}
            </p>
          </div>

          {/* Interactive Chart Mode Switch (44px touch targets for thumb reach) */}
          <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl self-start sm:self-auto shrink-0">
            <button
              onClick={() => setActiveChartTab('timeline')}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all min-h-[44px] flex items-center active:scale-95 ${
                activeChartTab === 'timeline'
                  ? 'bg-white/15 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Timeline Trend
            </button>
            <button
              onClick={() => setActiveChartTab('frequency')}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all min-h-[44px] flex items-center active:scale-95 ${
                activeChartTab === 'frequency'
                  ? 'bg-white/15 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Frequency
            </button>
          </div>
        </div>

        {/* Chart View 1: Timeline Area Chart */}
        {activeChartTab === 'timeline' && (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timeSeriesData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorJoyful" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SENTIMENT_COLORS.Joyful} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={SENTIMENT_COLORS.Joyful} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorReflective" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SENTIMENT_COLORS.Reflective} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={SENTIMENT_COLORS.Reflective} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAnxious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SENTIMENT_COLORS.Anxious} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={SENTIMENT_COLORS.Anxious} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorComfort" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SENTIMENT_COLORS['Comfort-Seeking']} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={SENTIMENT_COLORS['Comfort-Seeking']} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorGrounded" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SENTIMENT_COLORS.Grounded} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={SENTIMENT_COLORS.Grounded} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Joyful"
                  stroke={SENTIMENT_COLORS.Joyful}
                  fillOpacity={1}
                  fill="url(#colorJoyful)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Reflective"
                  stroke={SENTIMENT_COLORS.Reflective}
                  fillOpacity={1}
                  fill="url(#colorReflective)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Anxious"
                  stroke={SENTIMENT_COLORS.Anxious}
                  fillOpacity={1}
                  fill="url(#colorAnxious)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Comfort-Seeking"
                  stroke={SENTIMENT_COLORS['Comfort-Seeking']}
                  fillOpacity={1}
                  fill="url(#colorComfort)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Grounded"
                  stroke={SENTIMENT_COLORS.Grounded}
                  fillOpacity={1}
                  fill="url(#colorGrounded)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart View 2: Horizontal Bar Frequency Chart */}
        {activeChartTab === 'frequency' && (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distributionData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  stroke="#cbd5e1"
                  fontSize={12}
                  tickLine={false}
                  width={110}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar
                  dataKey="count"
                  radius={[0, 8, 8, 0]}
                  cursor="pointer"
                  onClick={(entry: any) => {
                    const cat = entry?.category || entry?.payload?.category;
                    if (cat) setSelectedCategory(cat);
                  }}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend / Category Pills (44px touch targets) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-3 border-t border-white/[0.08] text-xs">
          {(Object.keys(SENTIMENT_COLORS) as SentimentCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? 'All' : cat)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all min-h-[44px] active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-white/[0.12] text-white font-medium ring-1 ring-white/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-white/[0.02]'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: SENTIMENT_COLORS[cat] }}
              />
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sentiment Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Category Breakdown & Emotional Descriptions
          </h3>
          <span className="text-xs text-slate-400">
            Click any card to filter conversation excerpts below
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {distributionData.map((item) => {
            const isSelected = selectedCategory === item.category;

            return (
              <div
                key={item.category}
                onClick={() => setSelectedCategory(isSelected ? 'All' : item.category)}
                className={`p-4 rounded-2xl bg-[#161b22] border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-rose-400/60 ring-1 ring-rose-400/30 bg-rose-950/20'
                    : 'border-white/[0.08] hover:border-white/[0.15]'
                } flex flex-col justify-between gap-3`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {CATEGORY_ICONS[item.category]}
                      <span className="font-semibold text-slate-100 text-xs">
                        {item.category}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-semibold tabular-nums text-slate-300">
                      {item.count} msgs
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Share of reflections</span>
                  <span
                    className="font-mono font-bold tabular-nums"
                    style={{ color: item.color }}
                  >
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drill-down of Messages Tagged with Selected Sentiment */}
      <div className="p-5 rounded-2xl bg-[#161b22] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-rose-400" />
            <h4 className="text-sm font-semibold text-white">
              {selectedCategory === 'All'
                ? 'Recent User Reflections'
                : `Reflections Categorized as "${selectedCategory}"`}
            </h4>
          </div>

          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-xs text-rose-300 hover:text-white transition-colors"
            >
              Show All Messages
            </button>
          )}
        </div>

        {displayedMessages.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No specific messages have been classified under "{selectedCategory}" yet. As you chat, new messages will automatically populate this category.
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-rose-300 font-medium">
                    {userName}
                  </span>
                  <span className="tabular-nums">
                    {new Date(msg.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-serif-companion">
                  "{msg.text}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
