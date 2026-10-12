import React, { useState } from 'react';
import { MemoryItem } from '../types/companion';
import {
  Plus,
  Trash2,
  Pin,
  PinOff,
  Search,
  BookOpen,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface Props {
  memories: MemoryItem[];
  companionName: string;
  userName: string;
  onAddMemory: (category: string, text: string) => void;
  onDeleteMemory: (id: string) => void;
  onTogglePin: (id: string) => void;
}

const CATEGORIES = [
  'All',
  'Life & Goals',
  'People & Relationships',
  'Tastes & Hobbies',
  'Work & Projects',
  'Shared Moments',
];

export const MemoryVault: React.FC<Props> = ({
  memories,
  companionName,
  userName,
  onAddMemory,
  onDeleteMemory,
  onTogglePin,
}) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('Life & Goals');
  const [newText, setNewText] = useState('');

  const filteredMemories = memories
    .filter((m) => {
      const matchCat = activeCategory === 'All' || m.category === activeCategory;
      const matchQuery =
        m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddMemory(newCategory, newText.trim());
    setNewText('');
    setIsAdding(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Info */}
      <div className="border-b border-white/[0.08] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-400" />
            <span>Memories & Shared Notes</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
            What {companionName} remembers about {userName}. Real memories help {companionName} ask about what matters, remember key people, and show up without inventing false history.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 self-start md:self-center transition-all min-h-[44px] shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Memory</span>
        </button>
      </div>

      {/* Add Memory Form */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-[#161b22] border border-white/[0.1] rounded-2xl p-4 space-y-3 animate-fadeIn"
        >
          <h3 className="text-sm font-semibold text-white">
            Note something for {companionName} to remember
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-[#0d1117] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-400"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] text-slate-400 block mb-1">
                Memory Details
              </label>
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="e.g. Preparing for an upcoming design presentation on Friday"
                className="w-full bg-[#0d1117] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-400"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg min-h-[36px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newText.trim()}
              className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg min-h-[36px]"
            >
              Save Note
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Tabs (Interactive Filter Controls - Buttons Allowed) */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
                activeCategory === cat
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-rose-400 min-h-[40px]"
          />
        </div>
      </div>

      {/* Memory Cards Grid */}
      {filteredMemories.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/[0.1] rounded-2xl p-6">
          <p className="text-sm text-slate-400">
            No memories found matching your criteria.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            As you chat, {companionName} will automatically remember important moments and goals you share.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className={`p-4 rounded-2xl bg-[#161b22] border transition-all ${
                mem.isPinned
                  ? 'border-rose-500/30 shadow-sm shadow-rose-950/20'
                  : 'border-white/[0.08]'
              } flex flex-col justify-between gap-3`}
            >
              <div>
                {/* Clean unboxed metadata with typographic separators */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-300 font-medium">
                      {mem.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {new Date(mem.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onTogglePin(mem.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        mem.isPinned
                          ? 'text-rose-400 hover:text-rose-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title={mem.isPinned ? 'Unpin memory' : 'Pin to top'}
                    >
                      {mem.isPinned ? (
                        <Pin className="w-3.5 h-3.5 fill-rose-400/40" />
                      ) : (
                        <PinOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteMemory(mem.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      title="Forget this memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed font-serif-companion">
                  {mem.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Memory Privacy & Ethics Note */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <div>
          <strong className="text-slate-300 font-medium">
            Privacy & Honesty:
          </strong>{' '}
          {companionName} only references things you have explicitly discussed or noted here. {companionName} will never fabricate shared history and will never ask for or store passwords or payment credentials.
        </div>
      </div>
    </div>
  );
};
