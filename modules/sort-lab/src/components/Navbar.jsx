import React from 'react';
import {
  ArrowLeft,
  BarChart3,
  Search,
  Swords,
  BookOpen,
  Volume2,
  VolumeX,
  Keyboard,
} from 'lucide-react';

export default function Navbar({
  activeView = 'visualizer', // 'visualizer' | 'search' | 'race' | 'revision'
  onViewChange = () => {},
  audioMode = 'chimes',
  onCycleAudio = () => {},
  onOpenShortcuts = () => {},
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#ded7c6] border-t-3 border-t-[#1e3a5f] bg-[#fdfcf9] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
        {/* Navigation & Brand */}
        <div className="flex items-center gap-3">
          <a
            href="../../index.html"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] border border-[#c2b8a3] bg-[#fdfcf9] text-[#1e2229] text-xs font-semibold hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-all"
            title="Return to Revision Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hub</span>
          </a>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold text-[#1e2229] leading-none tracking-tight">
                Searching &amp; Sorting
              </h1>
              <span className="font-mono text-[10.5px] font-bold text-[#1e3a5f] bg-[#edf3f9] border border-[#cbd5e1] px-1.5 py-0.5 rounded-[2px] tracking-wide">
                AQA 8525 §3.1
              </span>
            </div>
            <p className="text-[11.5px] text-[#585e6b] hidden sm:block">
              Interactive GCSE Computer Science Algorithms
            </p>
          </div>
        </div>

        {/* View Switcher Tabs (Sorting | Sorting Race | Searching | Revision) */}
        <nav className="flex items-center p-0.5 rounded-[2px] border border-[#c2b8a3] bg-[#ede8db] text-xs font-semibold gap-1">
          <button
            onClick={() => onViewChange('visualizer')}
            className={`px-3 py-1.5 rounded-[2px] transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'visualizer'
                ? 'bg-[#1e3a5f] text-white font-bold shadow-2xs'
                : 'text-[#585e6b] hover:text-[#1e2229]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Sorting</span>
          </button>

          <button
            onClick={() => onViewChange('race')}
            className={`px-3 py-1.5 rounded-[2px] transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'race'
                ? 'bg-[#1e3a5f] text-white font-bold shadow-2xs'
                : 'text-[#585e6b] hover:text-[#1e2229]'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Sorting Race</span>
          </button>

          <button
            onClick={() => onViewChange('search')}
            className={`px-3 py-1.5 rounded-[2px] transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'search'
                ? 'bg-[#1e3a5f] text-white font-bold shadow-2xs'
                : 'text-[#585e6b] hover:text-[#1e2229]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Searching</span>
          </button>

          <button
            onClick={() => onViewChange('revision')}
            className={`px-3 py-1.5 rounded-[2px] transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'revision'
                ? 'bg-[#1e3a5f] text-white font-bold shadow-2xs'
                : 'text-[#585e6b] hover:text-[#1e2229]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Revision</span>
          </button>
        </nav>

        {/* Right Tools: Sound Toggle, Keyboard Shortcuts */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={onCycleAudio}
            className={`px-2.5 py-1.5 rounded-[2px] border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              audioMode === 'off'
                ? 'border-[#c2b8a3] bg-[#fdfcf9] text-[#8e95a2] hover:text-[#1e2229]'
                : 'border-[#1e3a5f] bg-[#edf3f9] text-[#1e3a5f] font-bold'
            }`}
            title={`Sound: ${audioMode.toUpperCase()} (Click to toggle)`}
          >
            {audioMode === 'off' ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#1e3a5f]" />
            )}
            <span className="capitalize">{audioMode}</span>
          </button>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-[2px] border border-[#c2b8a3] bg-[#fdfcf9] text-[#585e6b] hover:text-[#1e2229] hover:border-[#1e3a5f] text-xs transition-colors hidden md:flex items-center cursor-pointer"
            title="Keyboard shortcuts [?]"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
