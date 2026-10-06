import React, { useState } from 'react';
import { Table, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

export default function TraceTable({
  steps = [],
  currentStepIndex = 0,
  onJumpToStep = () => {},
  isDarkMode = false,
}) {
  const [copied, setCopied] = useState(false);
  const [tableMode, setTableMode] = useState('pass'); // 'pass' | 'aqa_variable'
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Extract all pass-end steps and initial step
  const passSteps = steps.filter((s, idx) => idx === 0 || s.isPassEnd);

  // Extract key variable modification steps for AQA Paper 1 variable grid
  const aqaSteps = steps
    .filter((s, idx) => {
      if (idx === 0) return true;
      return (
        s.type === 'compare' ||
        s.type === 'swap' ||
        s.type === 'shift' ||
        s.type === 'pass-end' ||
        s.type === 'insert'
      );
    })
    .slice(0, 100); // capped at 100 steps for smooth rendering

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
                    <tr className="border-b border-[#ded7c6] text-[#1e2229] font-bold bg-[#ede8db]">
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
                              ? 'bg-[#edf7f0] text-[#1a6b3c] font-bold border-l-4 border-l-[#1a6b3c]'
                              : 'hover:bg-[#f5f3ec] text-[#1e2229]'
                          }`}
                        >
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[11px] font-bold ${
                                s.pass === 0
                                  ? 'bg-[#ede8db] text-[#1e2229]'
                                  : isActiveRow
                                  ? 'bg-[#dcfce7] text-[#14532d] border border-[#86efac]'
                                  : 'bg-[#fef3c7] text-[#78350f] border border-[#fde68a]'
                              }`}
                            >
                              {s.pass === 0 ? 'Init' : `Pass ${s.pass}`}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 font-bold text-[#1e2229] whitespace-nowrap">
                            [{s.array.join(', ')}]
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-[#1e3a5f]">
                            {s.comparisons}
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-[#b45309]">
                            {s.swaps}
                          </td>
                          <td
                            className="py-2 px-2.5 font-sans text-xs max-w-xs truncate text-[#374151] font-medium"
                            title={s.explanation}
                          >
                            {s.explanation}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-32 text-xs text-[#585e6b]">
                  Click Start or Step to populate the trace table.
                </div>
              )
            ) : (
              // 2. AQA Paper 1 Variable Grid Table (High-contrast WCAG AAA drafting design)
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[#ded7c6] text-[#1e2229] font-bold bg-[#ede8db]">
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
                    const condVal = isCompare
                      ? s.explanation.includes('True')
                        ? 'True'
                        : 'False'
                      : '';
                    const tempVal = s.variables?.temp !== undefined ? s.variables.temp : '';
                    const swappedVal =
                      s.variables?.swapped !== undefined
                        ? s.variables.swapped
                          ? 'True'
                          : 'False'
                        : '';

                    return (
                      <tr
                        key={idx}
                        onClick={() => stepIdx !== -1 && onJumpToStep(stepIdx)}
                        className={`cursor-pointer border-b border-[#ded7c6] transition-colors ${
                          isCurrent
                            ? 'bg-[#edf3f9] text-[#1e2229] font-bold border-l-4 border-l-[#1e3a5f]'
                            : 'hover:bg-[#f5f3ec] text-[#1e2229]'
                        }`}
                      >
                        {/* Line number: Oxford Navy (11.5:1 contrast against white/tint) */}
                        <td className="py-1.5 px-2 text-center font-bold text-[#1e3a5f]">
                          {s.codeLine}
                        </td>

                        {/* j column: High contrast primary charcoal (14:1 contrast, never washed-out yellow) */}
                        <td className="py-1.5 px-2 text-center font-bold text-[#1e2229]">
                          {jVal !== '' ? jVal : <span className="text-[#8e95a2] font-normal">—</span>}
                        </td>

                        {/* Condition column: High contrast badges (Deep Crimson on Soft Pink: 8.2:1 AAA; Slate on Cream: 5.4:1 AA) */}
                        <td className="py-1.5 px-2 text-center">
                          {condVal ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-[2px] text-[10.5px] font-bold ${
                                condVal === 'True'
                                  ? 'bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]'
                                  : 'bg-[#ede8db] text-[#374151] border border-[#d6cfbe]'
                              }`}
                            >
                              {condVal}
                            </span>
                          ) : (
                            <span className="text-[#8e95a2] font-normal">—</span>
                          )}
                        </td>

                        {/* temp column: Deep royal purple (9.5:1 contrast) */}
                        <td className="py-1.5 px-2 text-center font-bold text-[#6b21a8]">
                          {tempVal !== '' ? tempVal : <span className="text-[#8e95a2] font-normal">—</span>}
                        </td>

                        {/* swapped column: High contrast amber-brown on tint (7.1:1 AAA) or dark slate */}
                        <td className="py-1.5 px-2 text-center">
                          {swappedVal !== '' ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-[2px] text-[10.5px] font-bold ${
                                swappedVal === 'True'
                                  ? 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a]'
                                  : 'bg-[#ede8db] text-[#374151] border border-[#d6cfbe]'
                              }`}
                            >
                              {swappedVal}
                            </span>
                          ) : (
                            <span className="text-[#8e95a2] font-normal">—</span>
                          )}
                        </td>

                        {/* Array State: Primary charcoal ink, bold font-mono (14:1 contrast, never pale light grey) */}
                        <td className="py-1.5 px-2 whitespace-nowrap font-bold text-[#1e2229]">
                          [{s.array.join(', ')}]
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer tip: High-contrast drafting tray (Deep charcoal text on cream tray, never grey on grey) */}
          <div className="p-2.5 px-4 border-t border-[#ded7c6] bg-[#ede8db] text-[11.5px] text-[#1e2229] font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="text-[#1e3a5f] font-bold">AQA Paper 1 Rule:</span>
              <span className="text-[#1e2229]">
                {tableMode === 'aqa_variable'
                  ? 'Only record variable values in a column when they change!'
                  : 'Click any pass row to jump straight to that pass.'}
              </span>
            </span>
            <span className="font-mono text-[10.5px] font-bold text-[#1e3a5f] bg-[#edf3f9] border border-[#cbd5e1] px-1.5 py-0.5 rounded-[2px] hidden sm:inline">
              AQA 8525 Trace Table
            </span>
          </div>
        </>
      )}
    </div>
  );
}
