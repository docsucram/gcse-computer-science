import React from 'react';
import {
  ArrowLeft,
  BarChart3,
  Search,
  Flag,
  BookOpen,
  Volume2,
  VolumeX,
  Keyboard,
  Sun,
  Moon,
} from 'lucide-react';

export default function Navbar({
  activeView = 'visualizer', // 'visualizer' | 'search' | 'race' | 'revision'
  onViewChange = () => {},
  isDarkMode = false,
  onToggleTheme = () => {},
  audioMode = 'clicks',
  onCycleAudio = () => {},
  onOpenShortcuts = () => {},
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e2e8f0] dark:border-[#2e3646] border-t-[3px] border-t-[#001736] dark:border-t-[#38bdf8] bg-white dark:bg-[#181c24] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
        {/* Navigation & Brand */}
        <div className="flex items-center gap-3.5">
          <a
            href="../../index.html"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-[#cbd5e1] dark:border-[#2e3646] bg-white dark:bg-[#202632] text-[#001736] dark:text-[#f3f4f6] text-xs font-semibold hover:bg-[#f1f5f9] dark:hover:bg-[#2a3242] hover:border-[#001736] dark:hover:border-[#3b82f6] transition-all whitespace-nowrap"
            title="Return to Revision Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Hub</span>
          </a>

          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-[4px] flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #c8006b 0%, #db2777 100%)' }}
            >
              {/* Bar chart icon matching front page */}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <h1 className="font-serif text-[17px] font-bold text-[#001736] dark:text-[#f3f4f6] leading-tight tracking-tight m-0">
              Searching &amp; Sorting
            </h1>
            <span className="badge badge-topic font-mono text-[10.5px] font-bold text-[#1e3a5f] dark:text-[#7dd3fc] bg-[#edf3f9] dark:bg-[rgba(56,189,248,0.12)] border border-[#cbd5e1] dark:border-[rgba(56,189,248,0.25)] px-2 py-0.5 rounded-[4px] tracking-wide inline-flex items-center">
              AQA 8525 §3.1
            </span>
          </div>
        </div>

        {/* View Switcher Tabs (Sorting | Sorting Race | Searching | Revision) */}
        <nav className="flex items-center p-1 rounded-[4px] border border-[#e2e8f0] dark:border-[#2e3646] bg-[#f1f5f9] dark:bg-[#202632] text-xs font-semibold gap-1">
          <button
            onClick={() => onViewChange('visualizer')}
            className={`px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'visualizer'
                ? 'bg-[#c8006b] text-white font-bold shadow-xs'
                : 'text-[#475569] dark:text-[#9ca3af] hover:text-[#0f172a] dark:hover:text-[#f3f4f6] hover:bg-white/50 dark:hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Sorting</span>
          </button>

          <button
            onClick={() => onViewChange('race')}
            className={`px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'race'
                ? 'bg-[#c8006b] text-white font-bold shadow-xs'
                : 'text-[#475569] dark:text-[#9ca3af] hover:text-[#0f172a] dark:hover:text-[#f3f4f6] hover:bg-white/50 dark:hover:bg-white/10'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Sorting Race</span>
          </button>

          <button
            onClick={() => onViewChange('search')}
            className={`px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'search'
                ? 'bg-[#c8006b] text-white font-bold shadow-xs'
                : 'text-[#475569] dark:text-[#9ca3af] hover:text-[#0f172a] dark:hover:text-[#f3f4f6] hover:bg-white/50 dark:hover:bg-white/10'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Searching</span>
          </button>

          <button
            onClick={() => onViewChange('revision')}
            className={`px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'revision'
                ? 'bg-[#c8006b] text-white font-bold shadow-xs'
                : 'text-[#475569] dark:text-[#9ca3af] hover:text-[#0f172a] dark:hover:text-[#f3f4f6] hover:bg-white/50 dark:hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Revision</span>
          </button>
        </nav>

        {/* Right Tools: Sound Toggle, Keyboard Shortcuts, Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={onCycleAudio}
            className={`px-2.5 py-1.5 rounded-[3px] border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              audioMode === 'muted' || audioMode === 'off'
                ? 'border-[#cbd5e1] dark:border-[#3f495e] bg-white dark:bg-[#181c24] text-[#64748b] dark:text-[#9ca3af] hover:text-[#0f172a] dark:hover:text-[#f3f4f6]'
                : 'border-[#c8006b] bg-[#fdf2f8] dark:bg-[#c8006b]/20 text-[#c8006b] font-bold'
            }`}
            title={`Sound: ${audioMode.toUpperCase()} (Click to toggle)`}
          >
            {audioMode === 'muted' || audioMode === 'off' ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#c8006b]" />
            )}
            <span className="capitalize">{audioMode}</span>
          </button>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-[3px] border border-[#cbd5e1] dark:border-[#3f495e] bg-white dark:bg-[#181c24] text-[#64748b] dark:text-[#9ca3af] hover:text-[#0f172a] dark:hover:text-[#f3f4f6] hover:border-[#c8006b] text-xs transition-colors hidden md:flex items-center cursor-pointer"
            title="Keyboard shortcuts [?]"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Dark / Light Mode Toggle Button */}
          <button
            id="themeToggleBtn"
            onClick={onToggleTheme}
            className="p-1.5 rounded-[3px] border border-[#cbd5e1] dark:border-[#3f495e] bg-white dark:bg-[#181c24] text-[#64748b] dark:text-[#9ca3af] hover:text-[#0f172a] dark:hover:text-[#f3f4f6] text-xs transition-colors flex items-center cursor-pointer"
            title="Toggle Dark/Light Mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-[#f5b700]" />
            ) : (
              <Moon className="w-4 h-4 text-[#475569]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
