import React from 'react';
import { X, Keyboard } from 'lucide-react';

export default function KeyboardShortcutsModal({
  isOpen = false,
  onClose = () => {},
  isDarkMode = true,
}) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', action: 'Play / Pause algorithm' },
    { key: 'S or →', action: 'Single Step forward' },
    { key: '←', action: 'Single Step backward' },
    { key: 'P', action: 'Next Pass (advance 1 full outer loop)' },
    { key: 'R', action: 'Reset to initial unsorted state' },
    { key: 'M', action: 'Cycle Audio (Chimes ➔ Clicks ➔ Mute)' },
    { key: 'Q', action: 'Toggle Active Recall Quiz Mode' },
    { key: '?', action: 'Open / Close this shortcuts guide' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all ${
        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
          isDarkMode ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base">Keyboard Shortcuts</h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Fast navigation for classrooms & Chromebooks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-2.5 my-4">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                isDarkMode ? 'bg-slate-800/60 border-slate-750' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>{sc.action}</span>
              <kbd className={`px-2 py-1 rounded-md font-mono font-bold text-[11px] shadow-2xs border ${
                isDarkMode ? 'bg-slate-800 text-indigo-300 border-slate-700' : 'bg-slate-100 text-indigo-700 border-slate-300'
              }`}>
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
        >
          Got It
        </button>
      </div>
    </div>
  );
}
