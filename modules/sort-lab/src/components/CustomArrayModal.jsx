import React, { useState } from 'react';
import { X, Check, FileText } from 'lucide-react';

export default function CustomArrayModal({
  isOpen = false,
  onClose = () => {},
  onSubmit = () => {},
  isDarkMode = true,
}) {
  const [inputText, setInputText] = useState('12, 7, 34, 2, 8, 19, 5');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const pastPaperPresets = [
    { label: 'AQA 8525 Paper 1', values: [9, 4, 2, 7, 6, 1, 8] },
    { label: 'AQA Specimen Sample', values: [12, 7, 34, 2, 8] },
    { label: 'Reversed Worst Case', values: [55, 43, 38, 22, 19, 11] },
    { label: 'Nearly Sorted Exam List', values: [2, 5, 8, 14, 11, 20, 25] },
  ];

  const handleApply = () => {
    setError('');
    const rawTokens = inputText.split(/[\s,]+/);
    const parsed = [];

    for (const t of rawTokens) {
      if (t.trim() === '') continue;
      const num = Number(t);
      if (isNaN(num)) {
        setError(`"${t}" is not a valid number. Please enter numbers separated by commas.`);
        return;
      }
      parsed.push(num);
    }

    if (parsed.length < 3) {
      setError('Please provide at least 3 elements to sort.');
      return;
    }
    if (parsed.length > 50) {
      setError('Maximum 50 elements for custom list mode to ensure clear bar rendering.');
      return;
    }

    onSubmit(parsed);
    onClose();
  };

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
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base">Custom Array Input</h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Test exact lists from GCSE exam papers</p>
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

        {/* Text Input */}
        <div className="space-y-2 mb-4">
          <label className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Comma-separated values:
          </label>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. 12, 7, 34, 2, 8"
            className={`w-full p-2.5 rounded-xl border text-sm font-mono outline-hidden ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
            }`}
          />
          {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
        </div>

        {/* Quick GCSE Past Paper Presets */}
        <div className="space-y-2 mb-5">
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
            Official Exam Presets
          </span>
          <div className="grid grid-cols-2 gap-2">
            {pastPaperPresets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(p.values.join(', '))}
                className={`p-2 rounded-xl text-left border text-xs transition-colors ${
                  isDarkMode
                    ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-900'
                }`}
              >
                <strong className={`block text-[11px] ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700 font-bold'}`}>{p.label}</strong>
                <span className={`text-[10px] truncate block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>[{p.values.join(', ')}]</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold ${
              isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <Check className="w-4 h-4" />
            <span>Load Array</span>
          </button>
        </div>
      </div>
    </div>
  );
}
