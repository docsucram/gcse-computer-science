import React from 'react';
import { ALGORITHMS } from '../constants/algorithms';
import {
  ArrowLeft,
  Sparkles,
  BarChart3,
  Image as ImageIcon,
  Swords,
  BookOpen,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Keyboard,
  GraduationCap,
} from 'lucide-react';

export default function Navbar({
  activeView = 'visualizer', // 'visualizer' | 'race' | 'revision'
  onViewChange = () => {},
  visualizerMode = 'bars', // 'bars' | 'image'
  onVisualizerModeChange = () => {},
  selectedAlgorithm = 'bubble',
  onAlgorithmChange = () => {},
  isDarkMode = true,
  onToggleTheme = () => {},
  audioMode = 'chimes',
  onCycleAudio = () => {},
  onOpenShortcuts = () => {},
}) {
  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
      isDarkMode ? 'bg-slate-950/85 border-slate-800 text-white' : 'bg-white/85 border-slate-200 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Navigation & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="../../index.html"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isDarkMode
                ? 'border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 shadow-2xs'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 shadow-2xs'
            }`}
            title="Return to Revision Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Hub</span>
            <span className="inline sm:hidden">Hub</span>
          </a>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight leading-none">
                Sorting Algorithms
              </h1>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold text-[10px] tracking-wide border border-indigo-500/20">
                AQA 8525 §3.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Interactive GCSE Computer Science Visualizer
            </p>
          </div>
        </div>

        {/* View Switcher Tabs (Visualizer | Race | Revision) */}
        <nav className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => onViewChange('visualizer')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeView === 'visualizer'
                ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                : isDarkMode
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Visualizer</span>
          </button>

          <button
            onClick={() => onViewChange('race')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeView === 'race'
                ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                : isDarkMode
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Race Mode</span>
          </button>

          <button
            onClick={() => onViewChange('revision')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeView === 'revision'
                ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                : isDarkMode
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Revision Cards</span>
          </button>
        </nav>

        {/* Right Tools: Sound Toggle, Keyboard Shortcuts, Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle (visible in all views including Race Mode) */}
          <button
            onClick={onCycleAudio}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              audioMode === 'off'
                ? isDarkMode
                  ? 'border-slate-800 bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  : 'border-slate-200 bg-slate-100 text-slate-500 hover:text-slate-700'
                : isDarkMode
                ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300 font-bold'
                : 'border-indigo-300 bg-indigo-50 text-indigo-700 font-bold'
            }`}
            title={`Sound: ${audioMode.toUpperCase()} (Click to change)`}
          >
            {audioMode === 'off' ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4 text-indigo-500" />
            )}
            <span className="capitalize">{audioMode}</span>
          </button>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={onOpenShortcuts}
            className={`p-2 rounded-xl border text-xs transition-colors hidden md:flex items-center ${
              isDarkMode ? 'border-slate-800 bg-slate-800/80 text-slate-300 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
            title="Keyboard shortcuts [?]"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              isDarkMode ? 'border-slate-800 bg-slate-800/80 text-amber-400 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle Dark / Light Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
