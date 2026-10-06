import React, { useEffect, useRef, useState } from 'react';
import { ALGORITHMS } from '../constants/algorithms';
import { Code2, Variable, Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function PseudocodeTracer({
  algorithmId = 'bubble',
  activeLine = 1,
  variables = {},
  explanation = '',
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
    <div className="flex flex-col rounded-[2px] border border-[#ded7c6] bg-[#fdfcf9] shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#ded7c6] text-xs font-semibold text-[#1e2229]">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-[#1e3a5f]" />
          <span>Code &amp; Pseudocode Tracer</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          {!isCollapsed && (
            <div className="flex items-center p-0.5 rounded-[2px] border border-[#c2b8a3] bg-[#ede8db] text-[11px]">
              {languageOptions.map((opt) => {
                const isAvailable = !!codeSnippets[opt.id];
                if (!isAvailable) return null;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setLanguage(opt.id)}
                    className={`px-2 py-0.5 rounded-[2px] transition-all font-sans cursor-pointer ${
                      language === opt.id
                        ? 'bg-[#1e3a5f] text-white font-bold shadow-2xs'
                        : 'text-[#585e6b] hover:text-[#1e2229]'
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
            className="p-1 rounded-[2px] border border-[#c2b8a3] bg-[#fdfcf9] text-[#585e6b] hover:text-[#1e2229] hover:border-[#1e3a5f] text-xs transition-colors flex items-center gap-1 cursor-pointer"
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
          <div ref={codeContainerRef} className="flex-1 p-3 overflow-y-auto max-h-[340px] font-mono text-xs sm:text-[13px] leading-relaxed bg-[#fdfcf9]">
            {currentLines.map((lineObj) => {
              const isActive = lineObj.line === activeLine;
              return (
                <div
                  key={lineObj.line}
                  ref={isActive ? activeLineRef : null}
                  className={`flex items-start gap-3 px-2 py-1 rounded-[2px] transition-colors ${
                    isActive
                      ? 'bg-[#fef3c7] text-[#78350f] font-bold border-l-2 border-l-[#b45309]'
                      : 'text-[#1e2229] hover:bg-[#f5f3ec]'
                  }`}
                >
                  <span className={`w-5 shrink-0 text-right select-none text-[11px] font-mono ${
                    isActive ? 'text-[#b45309] font-bold' : 'text-[#8e95a2]'
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
          <div className="p-3 border-t border-[#ded7c6] bg-[#ede8db]">
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1.5 text-[#585e6b]">
              <Variable className="w-3.5 h-3.5 text-[#b45309]" />
              <span>Active Variables</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {varEntries.length > 0 ? (
                varEntries.map(([key, val]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-xs font-mono bg-[#fdfcf9] border border-[#c2b8a3] text-[#1e2229]"
                  >
                    <span className="text-[#585e6b] font-bold">{key}:</span>
                    <strong className="text-[#1e3a5f]">{typeof val === 'boolean' ? (val ? 'True' : 'False') : JSON.stringify(val)}</strong>
                  </span>
                ))
              ) : (
                <span className="text-xs italic text-[#8e95a2]">No active variables at this step</span>
              )}
            </div>
          </div>

          {/* Live GCSE Explanation & Mark Scheme Commentary */}
          <div className="p-3 border-t border-[#ded7c6] bg-[#edf3f9]">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#1e3a5f] shrink-0 mt-0.5" />
              <p className="text-xs leading-snug font-medium text-[#1e3a5f]">
                {explanation || 'Select play or step to trace algorithm execution.'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
