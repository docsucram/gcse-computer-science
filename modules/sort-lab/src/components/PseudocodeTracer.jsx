import React, { useEffect, useRef, useState } from 'react';
import { ALGORITHMS } from '../constants/algorithms';
import { Code2, Variable, Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function PseudocodeTracer({
  algorithmId = 'bubble',
  activeLine = 1,
  variables = {},
  explanation = '',
  isDarkMode = true,
}) {
  const [language, setLanguage] = useState('pseudocode'); // 'pseudocode' | 'python' | 'csharp' | 'vbnet'
  const [isCollapsed, setIsCollapsed] = useState(false);
  const algo = ALGORITHMS[algorithmId] || ALGORITHMS.bubble;
  const activeLineRef = useRef(null);
  const codeContainerRef = useRef(null);

  // Available language snippets for this algorithm
  const codeSnippets = algo.codeSnippets || { pseudocode: algo.pseudocode || [] };
  const currentLines = codeSnippets[language] || codeSnippets.pseudocode || algo.pseudocode || [];

  // Smooth scroll within code container ONLY (never scrolls window)
  useEffect(() => {
    if (!isCollapsed && activeLineRef.current && codeContainerRef.current) {
      const container = codeContainerRef.current;
      const el = activeLineRef.current;
      const elTop = el.offsetTop - container.offsetTop;
      const elBottom = elTop + el.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;

      if (elTop < containerTop) {
        container.scrollTo({ top: elTop, behavior: 'smooth' });
      } else if (elBottom > containerBottom) {
        container.scrollTo({ top: elBottom - container.clientHeight, behavior: 'smooth' });
      }
    }
  }, [activeLine, isCollapsed]);

  // Clean formatted variables
  const varEntries = Object.entries(variables).filter(([k, v]) => v !== undefined && k !== 'message');

  const languageOptions = [
    { id: 'pseudocode', label: 'Pseudocode' },
    { id: 'python', label: 'Python' },
    { id: 'csharp', label: 'C#' },
    { id: 'vbnet', label: 'VB.NET' },
  ];

  return (
    <div className={`flex flex-col rounded-2xl border transition-all ${
      isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b text-xs font-semibold ${
        isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-700'
      }`}>
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-500" />
          <span>Code & Pseudocode</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          {!isCollapsed && (
            <div className={`flex items-center p-0.5 rounded-lg border text-[11px] ${
              isDarkMode ? 'bg-slate-800/80 border-slate-700/60' : 'bg-slate-100 border-slate-200'
            }`}>
              {languageOptions.map((opt) => {
                const isAvailable = !!codeSnippets[opt.id];
                if (!isAvailable) return null;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setLanguage(opt.id)}
                    className={`px-2 py-1 rounded-md transition-all font-sans ${
                      language === opt.id
                        ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                        : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
              isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
            title={isCollapsed ? 'Expand Pseudocode Panel' : 'Collapse Pseudocode Panel'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            <span className="text-[10px] font-semibold">{isCollapsed ? 'Expand' : 'Collapse'}</span>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Code Editor Body */}
          <div ref={codeContainerRef} className="flex-1 p-3 overflow-y-auto max-h-[340px] font-mono text-xs sm:text-[13px] leading-relaxed">
        {currentLines.map((lineObj) => {
          const isActive = lineObj.line === activeLine;
          return (
            <div
              key={lineObj.line}
              ref={isActive ? activeLineRef : null}
              className={`flex items-start gap-3 px-2.5 py-1 rounded-lg transition-colors ${
                isActive
                  ? isDarkMode
                    ? 'bg-indigo-600/30 text-indigo-200 font-semibold ring-1 ring-indigo-500/60 shadow-sm'
                    : 'bg-indigo-50 text-indigo-950 font-bold ring-1 ring-indigo-400 shadow-sm'
                  : isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800/40'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span className={`w-5 shrink-0 text-right select-none text-[11px] ${
                isActive
                  ? isDarkMode ? 'text-indigo-400 font-bold' : 'text-indigo-700 font-bold'
                  : isDarkMode ? 'text-slate-600 font-semibold' : 'text-slate-600 font-bold'
              }`}>
                {lineObj.line}
              </span>
              <pre className="flex-1 m-0 overflow-x-auto whitespace-pre font-mono">
                {lineObj.text}
              </pre>
            </div>
          );
        })}
      </div>

      {/* Live Variable Inspector */}
      <div className={`p-3 border-t ${
        isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
      }`}>
        <div className={`flex items-center gap-1.5 text-xs font-bold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
          <Variable className="w-3.5 h-3.5 text-amber-500" />
          <span>Variables</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {varEntries.length > 0 ? (
            varEntries.map(([key, val]) => (
              <span
                key={key}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium ${
                  isDarkMode
                    ? 'bg-slate-800 text-amber-300 border border-slate-700'
                    : 'bg-white text-amber-900 border border-amber-300 shadow-2xs font-semibold'
                }`}
              >
                <span className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} font-bold`}>{key}:</span>
                <span>{typeof val === 'boolean' ? (val ? 'True' : 'False') : JSON.stringify(val)}</span>
              </span>
            ))
          ) : (
            <span className={`text-xs italic ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No variables active yet</span>
          )}
        </div>
      </div>

      {/* Live GCSE Explanation & Mark Scheme Commentary */}
      <div className={`p-3 border-t rounded-b-2xl ${
        isDarkMode ? 'border-slate-800 bg-indigo-950/20' : 'border-slate-200 bg-indigo-50/50'
      }`}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p className={`text-xs leading-snug font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
            {explanation || 'Select play or step to trace algorithm execution.'}
          </p>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
