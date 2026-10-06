import React, { useState } from 'react';
import { Table, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

export default function TraceTable({
  steps = [],
  currentStepIndex = 0,
  onJumpToStep = () => {},
  isDarkMode = true,
}) {
  const [copied, setCopied] = useState(false);
  const [tableMode, setTableMode] = useState('pass'); // 'pass' | 'aqa_variable'
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Extract all pass-end steps and initial step
  const passSteps = steps.filter((s, idx) => idx === 0 || s.isPassEnd);

  // Extract key variable modification steps for AQA Paper 1 variable grid
  const aqaSteps = steps.filter((s, idx) => {
    if (idx === 0) return true;
    return s.type === 'compare' || s.type === 'swap' || s.type === 'shift' || s.type === 'pass-end' || s.type === 'insert';
  }).slice(0, 100); // capped at 100 steps for smooth rendering

  // Determine which pass step matches or precedes the current step
  const currentStep = steps[currentStepIndex] || steps[0];
  const activePass = currentStep?.pass ?? 0;

  const copyToClipboard = (format = 'markdown') => {
    let text = '';
    if (tableMode === 'pass') {
      text += '| Pass | Array State | Comparisons | Swaps / Shifts | Notes |\n';
      text += '| :--- | :--- | :---: | :---: | :--- |\n';
      passSteps.forEach((s) => {
        const passLabel = s.pass === 0 ? 'Initial' : `Pass ${s.pass}`;
        const arrayStr = `[${s.array.join(', ')}]`;
        text += `| ${passLabel} | \`${arrayStr}\` | ${s.comparisons} | ${s.swaps} | ${s.explanation.replace(/\|/g, '-')} |\n`;
      });
    } else {
      // AQA Variable Table
      text += '| Step | Line | j | Condition | temp | swapped | Array State |\n';
      text += '| :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n';
      aqaSteps.forEach((s, idx) => {
        const jVal = s.variables?.j ?? '-';
        const condVal = s.type === 'compare' ? (s.explanation.includes('True') ? 'True' : 'False') : '-';
        const tempVal = s.variables?.temp ?? '-';
        const swappedVal = s.variables?.swapped !== undefined ? (s.variables.swapped ? 'True' : 'False') : '-';
        const arrayStr = `[${s.array.join(', ')}]`;
        text += `| ${idx} | ${s.codeLine} | ${jVal} | ${condVal} | ${tempVal} | ${swappedVal} | \`${arrayStr}\` |\n`;
      });
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col h-full rounded-[2px] border border-[#ded7c6] bg-[#fdfcf9] shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#ded7c6] text-xs font-semibold text-[#1e2229]">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-[#1a6b3c]" />
          <span>Trace Table</span>
        </div>

        {/* View Toggle: Pass-by-Pass vs AQA Variable Grid */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-[2px] border border-[#c2b8a3] bg-[#ede8db] text-[11px]">
            <button
              onClick={() => setTableMode('pass')}
              className={`px-2 py-0.5 rounded-[2px] transition-all cursor-pointer font-sans ${
                tableMode === 'pass'
                  ? 'bg-[#1e3a5f] text-white font-bold shadow-2xs'
                  : 'text-[#585e6b] hover:text-[#1e2229]'
              }`}
            >
              Pass-by-Pass
            </button>
            <button
              onClick={() => setTableMode('aqa_variable')}
              className={`px-2 py-0.5 rounded-[2px] transition-all cursor-pointer font-sans ${
                tableMode === 'aqa_variable'
                  ? 'bg-[#1e3a5f] text-white font-bold shadow-2xs'
                  : 'text-[#585e6b] hover:text-[#1e2229]'
              }`}
              title="AQA Paper 1 variable-by-variable mark-scheme grid"
            >
              AQA Variable Grid
            </button>
          </div>

          <button
            onClick={() => copyToClipboard('markdown')}
            className="px-2.5 py-1 rounded-[2px] text-xs font-medium transition-colors flex items-center gap-1 border border-[#c2b8a3] bg-[#fdfcf9] text-[#1e2229] hover:border-[#1e3a5f] cursor-pointer"
            title="Copy trace table formatted as Markdown for homework or notes"
          >
            {copied ? <Check className="w-3 h-3 text-[#1a6b3c]" /> : <Copy className="w-3 h-3 text-[#585e6b]" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-[2px] border border-[#c2b8a3] bg-[#fdfcf9] text-[#585e6b] hover:text-[#1e2229] hover:border-[#1e3a5f] text-xs transition-colors flex items-center gap-1 cursor-pointer"
            title={isCollapsed ? 'Expand Trace Table' : 'Collapse Trace Table'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            <span className="text-[10px] font-semibold">{isCollapsed ? 'Expand' : 'Collapse'}</span>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Table Container */}
          <div className="flex-1 p-3 overflow-auto max-h-[340px] bg-[#fdfcf9]">
        {tableMode === 'pass' ? (
          // 1. Pass-by-Pass Table
          passSteps.length > 0 ? (
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-[#ded7c6] text-[#585e6b] font-bold bg-[#ede8db]">
                  <th className="py-2 px-2.5 font-bold">Pass</th>
                  <th className="py-2 px-2.5 font-bold">Array State</th>
                  <th className="py-2 px-2 font-bold text-center">Cmp</th>
                  <th className="py-2 px-2 font-bold text-center">Swp</th>
                  <th className="py-2 px-2.5 font-bold">Exam Description</th>
                </tr>
              </thead>
              <tbody>
                {passSteps.map((s, idx) => {
                  const isActiveRow = s.pass === activePass;
                  const stepIdx = steps.indexOf(s);

                  return (
                    <tr
                      key={idx}
                      onClick={() => stepIdx !== -1 && onJumpToStep(stepIdx)}
                      className={`cursor-pointer border-b border-[#ded7c6] transition-colors ${
                        isActiveRow
                          ? 'bg-[#edf7f0] text-[#1a6b3c] font-bold'
                          : 'hover:bg-[#f5f3ec] text-[#1e2229]'
                      }`}
                    >
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[11px] font-bold ${
                          s.pass === 0
                            ? 'bg-[#ede8db] text-[#585e6b]'
                            : isActiveRow
                            ? 'bg-[#dcfce7] text-[#1a6b3c] border border-[#bbf7d0]'
                            : 'bg-[#edf3f9] text-[#1e3a5f] border border-[#cbd5e1]'
                        }`}>
                          {s.pass === 0 ? 'Initial' : `Pass ${s.pass}`}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600 font-bold'}>[</span>
                          {s.array.map((num, i) => {
                            const isSortedInThisStep = s.sortedIndices?.includes(i);
                            return (
                              <span
                                key={i}
                                className={`px-1 rounded ${
                                  isSortedInThisStep
                                    ? isDarkMode
                                      ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                                      : 'bg-emerald-100 text-emerald-900 font-bold'
                                    : ''
                                }`}
                              >
                                {num}
                                {i < s.array.length - 1 ? ',' : ''}
                              </span>
                            );
                          })}
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600 font-bold'}>]</span>
                        </div>
                      </td>
                      <td className={`py-2 px-2 text-center font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-900'}`}>
                        {s.comparisons}
                      </td>
                      <td className={`py-2 px-2 text-center font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-900'}`}>
                        {s.swaps}
                      </td>
                      <td className={`py-2 px-2.5 font-sans text-xs max-w-xs truncate ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-800 font-medium'
                      }`} title={s.explanation}>
                        {s.explanation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={`flex items-center justify-center h-32 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Click Start or Step to populate the trace table.
            </div>
          )
        ) : (
          // 2. AQA Paper 1 Variable Grid Table
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className={`border-b ${
                isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-800 font-bold bg-slate-50'
              }`}>
                <th className="py-2 px-2 font-bold text-center">Line</th>
                <th className="py-2 px-2 font-bold text-center">j</th>
                <th className="py-2 px-2 font-bold text-center">Condition</th>
                <th className="py-2 px-2 font-bold text-center">temp</th>
                <th className="py-2 px-2 font-bold text-center">swapped</th>
                <th className="py-2 px-2 font-bold">Array State</th>
              </tr>
            </thead>
            <tbody>
              {aqaSteps.map((s, idx) => {
                const stepIdx = steps.indexOf(s);
                const isCurrent = stepIdx === currentStepIndex;

                const jVal = s.variables?.j !== undefined ? s.variables.j : '';
                const isCompare = s.type === 'compare';
                const condVal = isCompare ? (s.explanation.includes('True') ? 'True' : 'False') : '';
                const tempVal = s.variables?.temp !== undefined ? s.variables.temp : '';
                const swappedVal = s.variables?.swapped !== undefined ? (s.variables.swapped ? 'True' : 'False') : '';

                return (
                  <tr
                    key={idx}
                    onClick={() => stepIdx !== -1 && onJumpToStep(stepIdx)}
                    className={`cursor-pointer border-b transition-colors ${
                      isCurrent
                        ? isDarkMode
                          ? 'bg-emerald-950/40 text-emerald-200 font-semibold'
                          : 'bg-emerald-50 text-emerald-950 font-bold'
                        : isDarkMode
                        ? 'border-slate-800/60 hover:bg-slate-800/40 text-slate-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-900'
                    }`}
                  >
                    <td className={`py-1.5 px-2 text-center font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-800 font-bold'}`}>
                      {s.codeLine}
                    </td>
                    <td className={`py-1.5 px-2 text-center font-semibold ${isDarkMode ? 'text-amber-300' : 'text-amber-900 font-bold'}`}>
                      {jVal !== '' ? jVal : '—'}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {condVal ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          condVal === 'True'
                            ? (isDarkMode ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-800 border border-rose-300')
                            : (isDarkMode ? 'bg-slate-700/60 text-slate-300' : 'bg-slate-100 text-slate-800 border border-slate-300')
                        }`}>
                          {condVal}
                        </span>
                      ) : '—'}
                    </td>
                    <td className={`py-1.5 px-2 text-center font-semibold ${isDarkMode ? 'text-purple-300' : 'text-purple-900 font-bold'}`}>
                      {tempVal !== '' ? tempVal : '—'}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {swappedVal !== '' ? (
                        <span className={`text-[11px] font-bold ${
                          swappedVal === 'True'
                            ? (isDarkMode ? 'text-amber-400' : 'text-amber-900 font-bold')
                            : (isDarkMode ? 'text-slate-500' : 'text-slate-500 font-semibold')
                        }`}>
                          {swappedVal}
                        </span>
                      ) : '—'}
                    </td>
                    <td className={`py-1.5 px-2 whitespace-nowrap ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                      [{s.array.join(', ')}]
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer tip */}
      <div className={`p-2.5 px-4 border-t text-[11px] flex items-center justify-between ${
        isDarkMode ? 'border-slate-800 bg-slate-950/20 text-slate-400' : 'border-slate-100 bg-slate-50/70 text-slate-600 font-medium'
      }`}>
        <span>
          {tableMode === 'aqa_variable'
            ? '📝 AQA Paper 1 Rule: Only record variable values in a column when they change!'
            : '💡 Click any pass row to jump straight to that pass.'}
        </span>
        <span className="hidden sm:inline">AQA 8525 Trace Table</span>
      </div>
        </>
      )}
    </div>
  );
}
