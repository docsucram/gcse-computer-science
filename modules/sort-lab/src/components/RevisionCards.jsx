import React, { useState } from 'react';
import { ALGORITHMS } from '../constants/algorithms';
import {
  BookOpen,
  Check,
  X,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export default function RevisionCards({ activeAlgorithmId = 'bubble' }) {
  const [selectedAlgo, setSelectedAlgo] = useState(activeAlgorithmId);
  const [revealedQuestions, setRevealedQuestions] = useState({});

  const algo = ALGORITHMS[selectedAlgo] || ALGORITHMS.bubble;

  const toggleQuestion = (idx) => {
    setRevealedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const algosList = Object.values(ALGORITHMS);

  return (
    <div className="editorial-container py-6">
      {/* 1. CLEAN EDITORIAL HEADER */}
      <header className="revision-header">
        <div className="revision-title-block">
          <span className="spec-pill">AQA 8525 §3.1</span>
          <h1 style={{ marginTop: '6px' }}>Searching &amp; Sorting Revision</h1>
          <p>
            Algorithm mechanics, best and worst-case comparisons, step-by-step trace tables, and past-paper exam questions for Paper 1 Section 3.1.
          </p>
        </div>
      </header>

      {/* 2. ALGORITHM SELECTOR TABS */}
      <div className="bg-[#fdfcf9] border border-[#ded7c6] rounded-[2px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#1e3a5f]" />
          <span className="font-bold text-xs text-[#1e2229]">Select Algorithm:</span>
        </div>

        {/* Algorithm Selection Pills */}
        <div className="flex flex-wrap gap-2">
          {algosList.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setSelectedAlgo(a.id);
                setRevealedQuestions({});
              }}
              className={`px-3 py-1.5 rounded-[2px] text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                selectedAlgo === a.id
                  ? 'bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-2xs font-bold'
                  : 'bg-[#fdfcf9] text-[#1e2229] border-[#c2b8a3] hover:border-[#1e3a5f]'
              }`}
            >
              <span>{a.name}</span>
              {a.aqaCore && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-[2px] font-bold ${
                    selectedAlgo === a.id
                      ? 'bg-white/20 text-white'
                      : 'bg-[#edf7f0] text-[#1a6b3c] border border-[#bbf7d0]'
                  }`}
                >
                  AQA Core
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN FACT DECK (3 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Complexity Matrix */}
        <div className="p-5 rounded-[2px] border border-[#ded7c6] bg-[#fdfcf9] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-bold text-[#1e3a5f] uppercase tracking-wider block">
                {algo.category}
              </span>
              {algo.aqaCore ? (
                <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-[#edf7f0] text-[#1a6b3c] border border-[#bbf7d0]">
                  AQA Core Mandatory
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-[#ede8db] text-[#585e6b] border border-[#ded7c6]">
                  Extension / Stretch
                </span>
              )}
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1e2229]">{algo.name}</h3>
            <p className="text-xs text-[#585e6b] mt-0.5">{algo.examBoardRelevance}</p>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#585e6b]">
              Time &amp; Space Complexity
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-[2px] border border-[#ded7c6] bg-[#ede8db]">
                <span className="block text-[10px] uppercase font-bold text-[#585e6b]">Best Time</span>
                <span className="text-xs font-mono font-bold text-[#1a6b3c]">{algo.complexity.bestTime}</span>
              </div>
              <div className="p-2 rounded-[2px] border border-[#ded7c6] bg-[#ede8db]">
                <span className="block text-[10px] uppercase font-bold text-[#585e6b]">Average</span>
                <span className="text-xs font-mono font-bold text-[#b45309]">{algo.complexity.averageTime}</span>
              </div>
              <div className="p-2 rounded-[2px] border border-[#ded7c6] bg-[#ede8db]">
                <span className="block text-[10px] uppercase font-bold text-[#585e6b]">Worst Time</span>
                <span className="text-xs font-mono font-bold text-[#a82020]">{algo.complexity.worstTime}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="p-2 rounded-[2px] border border-[#ded7c6] bg-[#ede8db]">
                <span className="block text-[10px] uppercase font-bold text-[#585e6b]">Space / RAM</span>
                <span className="text-xs font-mono font-bold text-[#1e3a5f]">{algo.complexity.space}</span>
              </div>
              <div className="p-2 rounded-[2px] border border-[#ded7c6] bg-[#ede8db]">
                <span className="block text-[10px] uppercase font-bold text-[#585e6b]">Stability</span>
                <span
                  className={`text-xs font-bold flex items-center justify-center gap-1 ${
                    algo.complexity.stable ? 'text-[#1a6b3c]' : 'text-[#b45309]'
                  }`}
                >
                  {algo.complexity.stable ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  {algo.complexity.stable ? 'Stable' : 'Unstable'}
                </span>
              </div>
            </div>
          </div>

          {/* Complexity Explanation notes */}
          <div className="p-3 rounded-[2px] border border-[#ded7c6] bg-[#f5f3ec] text-xs space-y-1.5 text-[#1e2229]">
            <p>
              <strong>Best Case:</strong> {algo.complexityNotes.best}
            </p>
            <p>
              <strong>Worst Case:</strong> {algo.complexityNotes.worst}
            </p>
            <p>
              <strong>Space / RAM:</strong> {algo.complexityNotes.space}
            </p>
          </div>
        </div>

        {/* Middle Column: How it Works, Pros & Cons */}
        <div className="p-5 rounded-[2px] border border-[#ded7c6] bg-[#fdfcf9] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1.5 text-[#585e6b]">
              The Big Idea
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed text-[#1e2229]">
              {algo.description}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#1a6b3c]">
              <Check className="w-3.5 h-3.5" /> Advantages (Pros)
            </h4>
            <ul className="text-xs space-y-1.5 list-disc list-inside text-[#585e6b]">
              {algo.pros.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#a82020]">
              <X className="w-3.5 h-3.5" /> Disadvantages (Cons)
            </h4>
            <ul className="text-xs space-y-1.5 list-disc list-inside text-[#585e6b]">
              {algo.cons.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Common Exam Mistakes & Practice Questions */}
        <div className="p-5 rounded-[2px] border border-[#ded7c6] bg-[#fdfcf9] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-4">
          {/* Exam Tips / Common Mistakes: only on core AQA algorithms */}
          {algo.aqaCore && algo.examTips && (
            <div className="p-3.5 rounded-[2px] border border-[#fde68a] bg-[#fef3c7] text-xs text-[#78350f]">
              <div className="flex items-center gap-1.5 font-bold mb-1.5">
                <AlertTriangle className="w-4 h-4 text-[#b45309]" />
                <span>Common Exam Mistakes</span>
              </div>
              <ul className="space-y-1 list-disc list-inside">
                {algo.examTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactive Exam Questions with Mark Scheme Reveal (for AQA Core) */}
          {algo.aqaCore && algo.examQuestions && algo.examQuestions.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#1e3a5f]">
                <HelpCircle className="w-3.5 h-3.5" /> Past-Paper Style Questions
              </h4>

              {algo.examQuestions.map((q, idx) => {
                const isRevealed = revealedQuestions[idx];
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-[2px] border border-[#ded7c6] bg-[#f5f3ec] text-xs text-[#1e2229]"
                  >
                    <p className="font-semibold mb-2">{q.question}</p>
                    <button
                      onClick={() => toggleQuestion(idx)}
                      className="text-[11px] font-bold flex items-center gap-1 transition-colors text-[#1e3a5f] hover:underline cursor-pointer"
                    >
                      {isRevealed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{isRevealed ? 'Hide Mark Scheme' : 'Reveal Official Mark Scheme'}</span>
                    </button>

                    {isRevealed && (
                      <div className="mt-2.5 p-2.5 rounded-[2px] border border-[#bbf7d0] bg-[#edf7f0] text-xs text-[#1a6b3c]">
                        <span className="font-bold block mb-0.5">Examiner Mark Scheme:</span>
                        {q.markScheme}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : !algo.aqaCore ? (
            <div className="p-3.5 rounded-[2px] border border-[#ded7c6] bg-[#f5f3ec] text-xs text-[#585e6b] space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#1e3a5f]">
                <Sparkles className="w-3.5 h-3.5 text-[#1e3a5f]" />
                <span>Enrichment &amp; Extension Algorithm</span>
              </div>
              <p className="leading-relaxed">
                This algorithm is not tested directly in the mandatory AQA 8525 exam, but studying its trade-offs builds strong intuition for computer science problem solving.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
