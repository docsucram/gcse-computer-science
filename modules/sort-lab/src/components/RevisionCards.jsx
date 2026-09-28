import React, { useState } from 'react';
import { ALGORITHMS, AQA_NINE_MARK_QUESTION, SYLLABUS_BOARDS } from '../constants/algorithms';
import {
  BookOpen,
  Check,
  X,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Award,
  Sparkles,
  Star,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react';

export default function RevisionCards({ activeAlgorithmId = 'bubble', isDarkMode = true }) {
  const [selectedAlgo, setSelectedAlgo] = useState(activeAlgorithmId);
  const [syllabusFilter, setSyllabusFilter] = useState('all'); // 'all' | 'aqa' | 'ocr'
  const [revealedQuestions, setRevealedQuestions] = useState({});
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [checklist, setChecklist] = useState({});

  const algo = ALGORITHMS[selectedAlgo] || ALGORITHMS.bubble;

  const toggleQuestion = (idx) => {
    setRevealedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const toggleChecklistItem = (idx) => {
    setChecklist((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Filtered algorithms based on board
  const displayedAlgos = Object.values(ALGORITHMS).filter((a) => {
    if (syllabusFilter === 'aqa') return a.aqaCore;
    if (syllabusFilter === 'ocr') return a.ocrCore;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header and Syllabus Switcher */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                GCSE Computer Science Revision Lab
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Exam board specifications (AQA 8525 & OCR J277), complexities, mark schemes, and essay scaffolds.
              </p>
            </div>
          </div>

          {/* Syllabus Board Filter */}
          <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
            isDarkMode ? 'bg-slate-800/80 border-slate-700/60' : 'bg-slate-100 border-slate-200'
          }`}>
            {Object.values(SYLLABUS_BOARDS).map((board) => (
              <button
                key={board.id}
                onClick={() => setSyllabusFilter(board.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  syllabusFilter === board.id
                    ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {board.label}
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm Selection Pills */}
        <div className="flex flex-wrap gap-2">
          {displayedAlgos.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setSelectedAlgo(a.id);
                setRevealedQuestions({});
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedAlgo === a.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
              }`}
            >
              <span>{a.name}</span>
              {a.aqaCore && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedAlgo === a.id
                    ? 'bg-white/20 text-white'
                    : isDarkMode
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  AQA Core
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Fact Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Complexity Matrix */}
        <div className={`p-5 rounded-2xl border flex flex-col gap-4 transition-colors ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block">
                {algo.category}
              </span>
              {algo.aqaCore && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isDarkMode
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  AQA 8525 Core
                </span>
              )}
            </div>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{algo.name}</h3>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{algo.examBoardRelevance}</p>
          </div>

          <div className="space-y-2.5">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
              Time & Space Complexity
            </h4>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={`p-2.5 rounded-xl border ${
                isDarkMode ? 'bg-slate-800/50 border-slate-700/40' : 'bg-slate-100/90 border-slate-300'
              }`}>
                <span className={`block text-[10px] uppercase font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Best Time
                </span>
                <span className={`text-sm font-mono font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {algo.complexity.bestTime}
                </span>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                isDarkMode ? 'bg-slate-800/50 border-slate-700/40' : 'bg-slate-100/90 border-slate-300'
              }`}>
                <span className={`block text-[10px] uppercase font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Average
                </span>
                <span className={`text-sm font-mono font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-800'}`}>
                  {algo.complexity.averageTime}
                </span>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                isDarkMode ? 'bg-slate-800/50 border-slate-700/40' : 'bg-slate-100/90 border-slate-300'
              }`}>
                <span className={`block text-[10px] uppercase font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Worst Time
                </span>
                <span className={`text-sm font-mono font-bold ${isDarkMode ? 'text-rose-400' : 'text-rose-700'}`}>
                  {algo.complexity.worstTime}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className={`p-2.5 rounded-xl border ${
                isDarkMode ? 'bg-slate-800/50 border-slate-700/40' : 'bg-slate-100/90 border-slate-300'
              }`}>
                <span className={`block text-[10px] uppercase font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Space Complexity
                </span>
                <span className={`text-xs font-mono font-bold ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                  {algo.complexity.space}
                </span>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                isDarkMode ? 'bg-slate-800/50 border-slate-700/40' : 'bg-slate-100/90 border-slate-300'
              }`}>
                <span className={`block text-[10px] uppercase font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Stability
                </span>
                <span className={`text-xs font-bold flex items-center justify-center gap-1 ${
                  algo.complexity.stable
                    ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-700')
                    : (isDarkMode ? 'text-amber-400' : 'text-amber-800')
                }`}>
                  {algo.complexity.stable ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  {algo.complexity.stable ? 'Stable' : 'Unstable'}
                </span>
              </div>
            </div>
          </div>

          {/* Complexity Explanation notes */}
          <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
            isDarkMode ? 'bg-slate-800/30 border-slate-750 text-slate-300' : 'bg-slate-100/90 border-slate-300 text-slate-800'
          }`}>
            <p><strong className={isDarkMode ? 'text-slate-100' : 'text-slate-900'}>Best Case:</strong> {algo.complexityNotes.best}</p>
            <p><strong className={isDarkMode ? 'text-slate-100' : 'text-slate-900'}>Worst Case:</strong> {algo.complexityNotes.worst}</p>
            <p><strong className={isDarkMode ? 'text-slate-100' : 'text-slate-900'}>Space / RAM:</strong> {algo.complexityNotes.space}</p>
          </div>
        </div>

        {/* Middle Column: Pros, Cons & Algorithm Description */}
        <div className={`p-5 rounded-2xl border flex flex-col gap-4 transition-colors ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              How It Works
            </h4>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {algo.description}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              <Check className="w-3.5 h-3.5" /> Advantages (Pros)
            </h4>
            <ul className={`text-xs space-y-1.5 list-disc list-inside ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {algo.pros.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDarkMode ? 'text-rose-400' : 'text-rose-700'
            }`}>
              <X className="w-3.5 h-3.5" /> Disadvantages (Cons)
            </h4>
            <ul className={`text-xs space-y-1.5 list-disc list-inside ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {algo.cons.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: GCSE Exam Tips & Practice Questions */}
        <div className={`p-5 rounded-2xl border flex flex-col gap-4 transition-colors ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          {/* Exam Tips / Traps */}
          <div className={`p-3.5 rounded-xl border text-xs ${
            isDarkMode
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
              : 'bg-amber-50 border-amber-300 text-amber-950 font-medium'
          }`}>
            <div className={`flex items-center gap-1.5 font-bold mb-1.5 ${
              isDarkMode ? 'text-amber-400' : 'text-amber-900'
            }`}>
              <AlertTriangle className="w-4 h-4" />
              <span>GCSE Mark Scheme Traps</span>
            </div>
            <ul className={`space-y-1 list-disc list-inside ${
              isDarkMode ? 'text-amber-200/90' : 'text-amber-950 font-medium'
            }`}>
              {algo.examTips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>

          {/* Interactive Exam Questions with Mark Scheme Reveal */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDarkMode ? 'text-indigo-400' : 'text-indigo-700'
            }`}>
              <HelpCircle className="w-3.5 h-3.5" /> Past-Paper Style Questions
            </h4>

            {algo.examQuestions.map((q, idx) => {
              const isRevealed = revealedQuestions[idx];
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs ${
                    isDarkMode
                      ? 'border-slate-700/50 bg-slate-800/40 text-slate-200'
                      : 'border-slate-300 bg-slate-100/90 text-slate-900'
                  }`}
                >
                  <p className={`font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                    {q.question}
                  </p>
                  <button
                    onClick={() => toggleQuestion(idx)}
                    className={`text-[11px] font-bold flex items-center gap-1 transition-colors ${
                      isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-700 hover:text-indigo-900'
                    }`}
                  >
                    {isRevealed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{isRevealed ? 'Hide Mark Scheme' : 'Reveal Official Mark Scheme'}</span>
                  </button>

                  {isRevealed && (
                    <div className={`mt-2.5 p-2.5 rounded-lg border text-xs animate-in fade-in ${
                      isDarkMode
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                    }`}>
                      <span className={`font-bold block mb-0.5 ${
                        isDarkMode ? 'text-emerald-400' : 'text-emerald-800'
                      }`}>
                        Examiner Mark Scheme:
                      </span>
                      {q.markScheme}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AQA 9-Mark Extended Response Scenario & Evaluation Guide */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-colors ${
        isDarkMode
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-indigo-500/40'
          : 'bg-gradient-to-br from-white via-slate-50 to-indigo-50/50 border-indigo-200 shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h3 className={`font-bold text-base ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                {AQA_NINE_MARK_QUESTION.title}
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Evaluation masterclass: Bubble Sort vs Merge Sort in real-world scenarios
              </p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full border font-bold text-xs flex items-center gap-1 ${
            isDarkMode
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            9 Marks High-Tariff
          </span>
        </div>

        {/* Scenario Box */}
        <div className={`p-4 rounded-xl border text-xs leading-relaxed mb-5 ${
          isDarkMode
            ? 'bg-slate-950/60 border-slate-800 text-slate-300'
            : 'bg-indigo-50/50 border-indigo-200 text-slate-800'
        }`}>
          <strong className={`block font-bold mb-1.5 uppercase tracking-wider text-[11px] ${
            isDarkMode ? 'text-indigo-400' : 'text-indigo-700'
          }`}>
            Exam Scenario:
          </strong>
          <pre className="whitespace-pre-line font-sans m-0">
            {AQA_NINE_MARK_QUESTION.scenario}
          </pre>
        </div>

        {/* Analysis breakdown for System A vs System B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {AQA_NINE_MARK_QUESTION.keyPoints.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border text-xs ${
                isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className={`font-bold text-sm mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                {item.topic}
              </h4>
              <span className={`inline-block px-2 py-0.5 rounded font-semibold text-[11px] mb-2.5 ${
                isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {item.recommendation}
              </span>
              <ul className={`space-y-1.5 list-disc list-inside ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {item.reasons.map((r, rIdx) => (
                  <li key={rIdx}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Interactive Self-Assessment Checklist */}
        <div className={`p-4 rounded-xl border mb-4 text-xs ${
          isDarkMode
            ? 'bg-slate-800/30 border-slate-700/50'
            : 'bg-slate-100/70 border-slate-200'
        }`}>
          <h4 className={`font-bold mb-2 flex items-center gap-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
            <FileCheck2 className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <span>Examiner Criteria Checklist (Level 3 Band)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Analyzed time complexity of both Bubble Sort O(n²) and Merge Sort O(n log n)',
              'Addressed System A hardware: 2 KB RAM demands O(1) in-place Bubble Sort',
              'Analyzed recursive stack overhead risk on 2 KB microcontroller',
              'Addressed System B scale: 250,000 records requires Merge Sort to avoid freeze',
              'Noted server has sufficient RAM to accommodate Merge Sort O(n) auxiliary list',
              'Reached clear, justified final conclusions for both systems',
            ].map((crit, cIdx) => (
              <label
                key={cIdx}
                className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/70'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!checklist[cIdx]}
                  onChange={() => toggleChecklistItem(cIdx)}
                  className="mt-0.5 accent-indigo-500 rounded"
                />
                <span className={checklist[cIdx] ? 'line-through text-slate-400' : (isDarkMode ? 'text-slate-300' : 'text-slate-800 font-medium')}>
                  {crit}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Reveal Exemplar Model Answer */}
        <div>
          <button
            onClick={() => setShowModelAnswer(!showModelAnswer)}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{showModelAnswer ? 'Hide Exemplar 9-Mark Model Answer' : 'Reveal Full 9/9 Mark Model Answer'}</span>
          </button>

          {showModelAnswer && (
            <div className={`mt-3 p-4 rounded-xl border text-xs sm:text-sm leading-relaxed animate-in fade-in ${
              isDarkMode
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}>
              <strong className={`block font-bold mb-2 ${
                isDarkMode ? 'text-emerald-400' : 'text-emerald-800'
              }`}>
                Level 3 (9/9 Marks) Exemplar Model Essay:
              </strong>
              <p className={`whitespace-pre-line leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                {AQA_NINE_MARK_QUESTION.modelAnswer}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Global GCSE Comparison Table */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          <Star className="w-4 h-4 text-amber-500" />
          GCSE Specification Algorithm Comparison Cheat Sheet
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-800 font-bold bg-slate-50'}`}>
                <th className="py-2.5 px-3 font-bold">Algorithm</th>
                <th className="py-2.5 px-3 font-bold">Syllabus Core</th>
                <th className="py-2.5 px-3 font-bold">Best Time</th>
                <th className="py-2.5 px-3 font-bold">Average Time</th>
                <th className="py-2.5 px-3 font-bold">Worst Time</th>
                <th className="py-2.5 px-3 font-bold">Space (RAM)</th>
                <th className="py-2.5 px-3 font-bold">Stable?</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(ALGORITHMS).map((a) => (
                <tr
                  key={a.id}
                  className={`border-b transition-colors ${
                    isDarkMode
                      ? 'border-slate-800/60 hover:bg-slate-800/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <td className={`py-2.5 px-3 font-sans font-bold flex items-center gap-1.5 ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-900'
                  }`}>
                    {a.name}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    {a.aqaCore ? (
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        AQA & OCR
                      </span>
                    ) : a.ocrCore ? (
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        OCR J277
                      </span>
                    ) : (
                      <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Extension</span>
                    )}
                  </td>
                  <td className={`py-2.5 px-3 font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {a.complexity.bestTime}
                  </td>
                  <td className={`py-2.5 px-3 font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-800'}`}>
                    {a.complexity.averageTime}
                  </td>
                  <td className={`py-2.5 px-3 font-bold ${isDarkMode ? 'text-rose-400' : 'text-rose-700'}`}>
                    {a.complexity.worstTime}
                  </td>
                  <td className={`py-2.5 px-3 font-semibold ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                    {a.complexity.space}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex items-center gap-1 font-sans text-[11px] font-bold ${
                      a.complexity.stable
                        ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-700')
                        : (isDarkMode ? 'text-slate-400' : 'text-slate-600')
                    }`}>
                      {a.complexity.stable ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
