import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  Target,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Info,
  Shuffle,
  Zap,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  generateLinearSearchSteps,
  generateBinarySearchSteps,
  LINEAR_PSEUDOCODE,
  BINARY_PSEUDOCODE,
  SEARCH_ALGORITHMS
} from '../services/searchingEngine';
import { soundManager } from '../utils/audio';

export default function SearchVisualizer({
  isDarkMode = true,
  audioMode = 'chimes',
  onCycleAudio = () => {}
}) {
  // Mode: 'binary' | 'linear' | 'dual'
  const [searchAlgorithm, setSearchAlgorithm] = useState('binary');
  const [arraySize, setArraySize] = useState(12);
  const [speed, setSpeed] = useState(1); // 1 = normal, 2 = fast, 0.5 = slow

  // Array & Target
  const [array, setArray] = useState([]);
  const [target, setTarget] = useState(42);
  const [isSorted, setIsSorted] = useState(true);

  // Playback state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);

  // Explainer accordion
  const [isExplainerCollapsed, setIsExplainerCollapsed] = useState(false);

  // Generate initial random/sorted array
  const generateNewArray = useCallback((size = arraySize, sorted = true) => {
    let arr = [];
    const used = new Set();
    while (arr.length < size) {
      const val = Math.floor(Math.random() * 88) + 10;
      if (!used.has(val)) {
        used.add(val);
        arr.push(val);
      }
    }
    if (sorted) {
      arr.sort((a, b) => a - b);
    }
    setArray(arr);
    setIsSorted(sorted);
    // Pick a default target from inside the array (e.g. at 65% position)
    const defaultTarget = arr[Math.floor(arr.length * 0.65)] || arr[0];
    setTarget(defaultTarget);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    clearInterval(playTimerRef.current);
  }, [arraySize]);

  // Initial load
  useEffect(() => {
    generateNewArray(arraySize, searchAlgorithm === 'binary' || searchAlgorithm === 'dual');
  }, [arraySize, searchAlgorithm, generateNewArray]);

  // Steps for Single Algorithm
  const steps = useMemo(() => {
    if (array.length === 0) return [];
    if (searchAlgorithm === 'binary') {
      return generateBinarySearchSteps(array, target);
    } else {
      return generateLinearSearchSteps(array, target);
    }
  }, [array, target, searchAlgorithm]);

  // Steps for Dual Mode
  const binarySteps = useMemo(() => {
    if (array.length === 0) return [];
    return generateBinarySearchSteps(array, target);
  }, [array, target]);

  const linearSteps = useMemo(() => {
    if (array.length === 0) return [];
    return generateLinearSearchSteps(array, target);
  }, [array, target]);

  const maxDualSteps = Math.max(binarySteps.length, linearSteps.length);

  // Current step reference
  const currentStep = steps[currentStepIndex] || steps[0] || {};
  const currentBinaryStep = binarySteps[Math.min(currentStepIndex, binarySteps.length - 1)] || {};
  const currentLinearStep = linearSteps[Math.min(currentStepIndex, linearSteps.length - 1)] || {};

  // Audio tone helper
  const triggerStepAudio = useCallback((step) => {
    if (!step) return;
    if (step.isFound) {
      soundManager.playTone(0.9, 'sorted');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {
        console.error(e);
      }
    } else if (step.type === 'compare' || step.type === 'calc_mid') {
      const val = step.currentValue || step.midValue || 50;
      soundManager.playTone(val / 100, 'compare');
    }
  }, []);

  // Step Execution
  const goToStep = useCallback((idx) => {
    const total = searchAlgorithm === 'dual' ? maxDualSteps : steps.length;
    const clamped = Math.max(0, Math.min(idx, total - 1));
    setCurrentStepIndex(clamped);
    if (searchAlgorithm !== 'dual') {
      triggerStepAudio(steps[clamped]);
    } else {
      const bStep = binarySteps[Math.min(clamped, binarySteps.length - 1)];
      const lStep = linearSteps[Math.min(clamped, linearSteps.length - 1)];
      if (bStep?.isFound || lStep?.isFound) {
        triggerStepAudio({ isFound: true });
      } else {
        triggerStepAudio(bStep || lStep);
      }
    }
  }, [steps, binarySteps, linearSteps, searchAlgorithm, maxDualSteps, triggerStepAudio]);

  const handleStepForward = useCallback(() => {
    const total = searchAlgorithm === 'dual' ? maxDualSteps : steps.length;
    if (currentStepIndex < total - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      setIsPlaying(false);
      clearInterval(playTimerRef.current);
    }
  }, [currentStepIndex, steps.length, maxDualSteps, searchAlgorithm, goToStep]);

  const handleStepBack = useCallback(() => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, goToStep]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    clearInterval(playTimerRef.current);
    setCurrentStepIndex(0);
  }, []);

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.round(1100 / speed);
      playTimerRef.current = setInterval(() => {
        const total = searchAlgorithm === 'dual' ? maxDualSteps : steps.length;
        setCurrentStepIndex((prev) => {
          if (prev < total - 1) {
            const next = prev + 1;
            if (searchAlgorithm !== 'dual') triggerStepAudio(steps[next]);
            return next;
          } else {
            setIsPlaying(false);
            clearInterval(playTimerRef.current);
            return prev;
          }
        });
      }, intervalMs);
    } else {
      clearInterval(playTimerRef.current);
    }
    return () => clearInterval(playTimerRef.current);
  }, [isPlaying, speed, steps, searchAlgorithm, maxDualSteps, triggerStepAudio]);

  // Target quick selector
  const setQuickTarget = (type) => {
    handleReset();
    if (array.length === 0) return;
    if (type === 'first') setTarget(array[0]);
    else if (type === 'mid') setTarget(array[Math.floor(array.length / 2)]);
    else if (type === 'last') setTarget(array[array.length - 1]);
    else if (type === 'random_exist') {
      const randIdx = Math.floor(Math.random() * array.length);
      setTarget(array[randIdx]);
    } else if (type === 'absent') {
      // Find a number definitely not in array
      let absentVal = 99;
      while (array.includes(absentVal)) absentVal++;
      setTarget(absentVal);
    }
  };

  const sortCurrentArray = () => {
    handleReset();
    const sorted = [...array].sort((a, b) => a - b);
    setArray(sorted);
    setIsSorted(true);
  };

  const shuffleCurrentArray = () => {
    handleReset();
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    setArray(shuffled);
    setIsSorted(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6">
      
      {/* 1. Header Banner & Algorithm Switcher */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Searching Algorithms Laboratory
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-bold text-[10px] border border-sky-500/20">
                  AQA 8525 §3.1.1
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Step through Binary Search ($O(\log n)$) vs Linear Search ($O(n)$) with interactive pointers and step-by-step traces.
              </p>
            </div>
          </div>

          {/* Algorithm Mode Switcher Pills */}
          <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold self-start md:self-auto ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => {
                setSearchAlgorithm('binary');
                if (!isSorted) sortCurrentArray();
                handleReset();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                searchAlgorithm === 'binary'
                  ? 'bg-sky-600 text-white font-bold shadow-2xs'
                  : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Binary Search (O(log n))</span>
            </button>

            <button
              onClick={() => {
                setSearchAlgorithm('linear');
                handleReset();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                searchAlgorithm === 'linear'
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Linear Search (O(n))</span>
            </button>

            <button
              onClick={() => {
                setSearchAlgorithm('dual');
                if (!isSorted) sortCurrentArray();
                handleReset();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                searchAlgorithm === 'dual'
                  ? 'bg-purple-600 text-white font-bold shadow-2xs'
                  : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Dual Race Mode</span>
            </button>
          </div>
        </div>

        {/* Warning if Binary Search selected on unsorted array */}
        {(searchAlgorithm === 'binary' || searchAlgorithm === 'dual') && !isSorted && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Prerequisite:</strong> Binary Search requires the list to be in <strong>SORTED order</strong>. Halving logic fails on unsorted data!</span>
            </div>
            <button
              onClick={sortCurrentArray}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors shrink-0"
            >
              Sort Array Now
            </button>
          </div>
        )}
      </div>

      {/* 1.5 Algorithm Concept & How It Works Explainer Card */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
              <Info className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {searchAlgorithm === 'dual' ? 'Linear vs Binary Search: How They Work' : `How ${SEARCH_ALGORITHMS[searchAlgorithm]?.name} Works:`}
                </h3>
                {searchAlgorithm !== 'dual' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                    {SEARCH_ALGORITHMS[searchAlgorithm]?.timeComplexity}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {searchAlgorithm === 'dual'
                  ? 'Compare sequential linear scanning against logarithmic midpoint halving'
                  : SEARCH_ALGORITHMS[searchAlgorithm]?.analogy}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExplainerCollapsed(!isExplainerCollapsed)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1 shrink-0 ${
              isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}
          >
            <span>{isExplainerCollapsed ? 'Show' : 'Hide'}</span>
            {isExplainerCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!isExplainerCollapsed && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 flex flex-col gap-3">
            {searchAlgorithm !== 'dual' ? (
              <>
                <p className={`text-xs sm:text-[13px] leading-relaxed m-0 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {SEARCH_ALGORITHMS[searchAlgorithm]?.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                  {SEARCH_ALGORITHMS[searchAlgorithm]?.rules.map((rule, rIdx) => (
                    <div
                      key={rIdx}
                      className={`p-2.5 rounded-xl border text-[11.5px] leading-snug flex items-start gap-2 ${
                        isDarkMode ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {rIdx + 1}
                      </span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-3.5 rounded-xl border ${
                  isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-xs font-bold text-indigo-400">Linear Search</strong>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">O(n)</span>
                  </div>
                  <p className={`text-xs leading-relaxed mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {SEARCH_ALGORITHMS.linear.description}
                  </p>
                  <span className="text-[11px] text-indigo-300 font-medium">✓ Works on any list, no sorting required.</span>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-xs font-bold text-sky-400">Binary Search</strong>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">O(log n)</span>
                  </div>
                  <p className={`text-xs leading-relaxed mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {SEARCH_ALGORITHMS.binary.description}
                  </p>
                  <span className="text-[11px] text-amber-300 font-medium">⚠️ Prerequisite: List must be in sorted order!</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Interactive Target & Array Configuration Toolbar */}
      <div className={`p-4 rounded-2xl border transition-colors flex flex-wrap items-center justify-between gap-4 ${
        isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Left: Target Input & Quick Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-sky-400" />
            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Search Target:</span>
          </div>
          <input
            type="number"
            value={target}
            onChange={(e) => {
              handleReset();
              setTarget(Number(e.target.value));
            }}
            className={`w-16 px-2.5 py-1 rounded-lg border text-sm font-mono font-bold text-center ${
              isDarkMode ? 'bg-slate-950 border-slate-700 text-white focus:border-sky-500' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />

          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setQuickTarget('first')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-300 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
            >
              First
            </button>
            <button
              onClick={() => setQuickTarget('mid')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-300 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
            >
              Middle
            </button>
            <button
              onClick={() => setQuickTarget('last')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-300 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
            >
              Last
            </button>
            <button
              onClick={() => setQuickTarget('random_exist')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                isDarkMode ? 'border-slate-800 bg-slate-950 text-sky-400 hover:text-sky-300' : 'border-slate-200 bg-slate-100 text-sky-700'
              }`}
            >
              Random
            </button>
            <button
              onClick={() => setQuickTarget('absent')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                isDarkMode ? 'border-slate-800 bg-slate-950 text-rose-400 hover:text-rose-300' : 'border-slate-200 bg-slate-100 text-rose-700'
              }`}
            >
              Absent (Not in list)
            </button>
          </div>
        </div>

        {/* Right: Array Size & Shuffler */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <span>Size:</span>
            {[8, 12, 16, 20].map((sz) => (
              <button
                key={sz}
                onClick={() => {
                  setArraySize(sz);
                  generateNewArray(sz, isSorted);
                }}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  arraySize === sz
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          <button
            onClick={() => generateNewArray(arraySize, isSorted)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isDarkMode ? 'border-slate-800 bg-slate-800/80 text-slate-300 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}
            title="Generate New Values"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>New Array</span>
          </button>

          <button
            onClick={shuffleCurrentArray}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isDarkMode ? 'border-slate-800 bg-slate-800/80 text-slate-400 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-600'
            }`}
            title="Unsort / Randomize Positions (Exam test: Why binary search breaks on unsorted data)"
          >
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* 3. Playback Controls Toolbar */}
      <div className={`p-3 sm:p-4 rounded-2xl border transition-colors flex flex-wrap items-center justify-between gap-4 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Play Search'}</span>
          </button>

          <button
            onClick={handleStepBack}
            disabled={currentStepIndex === 0 || isPlaying}
            className={`p-2 rounded-xl border text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isDarkMode ? 'border-slate-800 bg-slate-800 text-slate-300 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}
            title="Step Back"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleStepForward}
            disabled={isPlaying || currentStepIndex >= (searchAlgorithm === 'dual' ? maxDualSteps - 1 : steps.length - 1)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
              isDarkMode ? 'border-slate-800 bg-slate-800 text-slate-200 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-800'
            }`}
            title="Step Forward"
          >
            <span>Step</span>
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              isDarkMode ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600'
            }`}
          >
            Reset
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex-1 max-w-xs flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={Math.max(0, (searchAlgorithm === 'dual' ? maxDualSteps : steps.length) - 1)}
            value={currentStepIndex}
            onChange={(e) => goToStep(Number(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <span className="font-mono text-xs font-bold text-slate-400 whitespace-nowrap">
            Step {currentStepIndex + 1} / {searchAlgorithm === 'dual' ? maxDualSteps : steps.length}
          </span>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Speed:</span>
          {[
            { label: '0.5x', val: 0.5 },
            { label: '1x', val: 1 },
            { label: '2x', val: 2 }
          ].map((sp) => (
            <button
              key={sp.label}
              onClick={() => setSpeed(sp.val)}
              className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors ${
                speed === sp.val
                  ? 'bg-sky-600 text-white'
                  : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. MAIN VISUALIZER WORKSPACE */}
      {searchAlgorithm !== 'dual' ? (
        /* SINGLE ALGORITHM VISUALIZATION */
        <div className={`p-6 rounded-2xl border transition-colors flex flex-col gap-6 ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          {/* Status & Telemetry Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider ${
                currentStep.isFound
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : currentStep.type === 'not_found'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              }`}>
                {currentStep.isFound
                  ? 'MATCH FOUND'
                  : currentStep.type === 'not_found'
                  ? 'NOT FOUND (-1)'
                  : searchAlgorithm === 'binary'
                  ? (currentStep.type === 'calc_mid' ? 'CALCULATING MID' : 'HALVING SEARCH')
                  : 'SEQUENTIAL CHECK'}
              </span>

              <span className="text-xs font-semibold text-slate-400">
                Comparisons: <strong className="text-white font-mono text-sm">{currentStep.comparisonsCount || 0}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">
                Target: <strong className="text-sky-400 font-mono text-sm">{target}</strong>
              </span>
              <span className="text-slate-400">
                Worst-case max: <strong className="text-amber-400 font-mono">
                  {searchAlgorithm === 'binary' ? Math.ceil(Math.log2(array.length + 1)) : array.length} comps
                </strong>
              </span>
            </div>
          </div>

          {/* Interactive Array Elements with Pointers */}
          <div className="relative py-12 px-2 overflow-x-auto min-h-[160px] flex items-center justify-center">
            <div className="flex items-center gap-2 sm:gap-3">
              {array.map((val, idx) => {
                const isLinearCurrent = searchAlgorithm === 'linear' && currentStep.current === idx;
                const isLinearChecked = searchAlgorithm === 'linear' && (currentStep.checkedIndices || []).includes(idx);

                const isBinaryMid = searchAlgorithm === 'binary' && currentStep.mid === idx;
                const isBinaryLow = searchAlgorithm === 'binary' && currentStep.low === idx;
                const isBinaryHigh = searchAlgorithm === 'binary' && currentStep.high === idx;
                const isBinaryEliminated = searchAlgorithm === 'binary' && (currentStep.eliminatedIndices || []).includes(idx);
                const isMatched = (searchAlgorithm === 'linear' && currentStep.foundIndex === idx) ||
                                  (searchAlgorithm === 'binary' && currentStep.foundIndex === idx);

                return (
                  <div key={idx} className="relative flex flex-col items-center">
                    {/* Top Pointers for Binary Search */}
                    {searchAlgorithm === 'binary' && (
                      <div className="absolute -top-10 flex items-center justify-center gap-1 font-mono text-[10px] font-bold">
                        {isBinaryLow && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-500 text-slate-950 shadow-xs" title={`Low = ${idx}`}>
                            L
                          </span>
                        )}
                        {isBinaryMid && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 shadow-xs animate-bounce" title={`Mid = ${idx}`}>
                            M
                          </span>
                        )}
                        {isBinaryHigh && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white shadow-xs" title={`High = ${idx}`}>
                            H
                          </span>
                        )}
                      </div>
                    )}

                    {/* Top Pointer for Linear Search */}
                    {searchAlgorithm === 'linear' && isLinearCurrent && (
                      <div className="absolute -top-8 px-1.5 py-0.5 rounded bg-indigo-500 text-white font-mono text-[10px] font-bold animate-bounce shadow-xs">
                        i = {idx}
                      </div>
                    )}

                    {/* Index Label */}
                    <span className="text-[10px] font-mono text-slate-500 mb-1">
                      [{idx}]
                    </span>

                    {/* Array Cell Card */}
                    <div
                      className={`w-11 sm:w-14 h-16 sm:h-20 rounded-xl flex flex-col items-center justify-center font-mono font-black text-sm sm:text-base border-2 transition-all duration-300 select-none ${
                        isMatched
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 scale-110 shadow-lg shadow-emerald-500/30'
                          : isBinaryMid
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 scale-105 shadow-md shadow-amber-500/20'
                          : isLinearCurrent
                          ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 scale-105 shadow-md shadow-indigo-500/20'
                          : isBinaryEliminated || isLinearChecked
                          ? 'bg-slate-950/40 border-slate-800 text-slate-600 opacity-40 line-through'
                          : isDarkMode
                          ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                          : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      <span>{val}</span>
                      {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1" />}
                      {(isBinaryEliminated || isLinearChecked) && !isMatched && (
                        <span className="text-[9px] text-slate-600 font-sans font-semibold">✕</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pointer Legend Bar (for Binary Search) */}
          {searchAlgorithm === 'binary' && (
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 py-2 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-sky-500 text-slate-950 font-bold font-mono text-[10px] flex items-center justify-center">L</span>
                <span>Low Pointer (Start of active range)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-amber-400 text-slate-950 font-bold font-mono text-[10px] flex items-center justify-center">M</span>
                <span>Midpoint Pointer: <code className="text-amber-300">floor((L+H)/2)</code></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-rose-500 text-white font-bold font-mono text-[10px] flex items-center justify-center">H</span>
                <span>High Pointer (End of active range)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-800 border border-slate-700 opacity-40 line-through text-[10px] text-center">--</span>
                <span>Discarded Sub-array</span>
              </div>
            </div>
          )}

          {/* Step Explanation Callout */}
          <div className={`p-4 rounded-xl border ${
            currentStep.isFound
              ? 'bg-emerald-950/40 border-emerald-500/40'
              : currentStep.type === 'not_found'
              ? 'bg-rose-950/40 border-rose-500/40'
              : isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {currentStep.isFound ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : currentStep.type === 'not_found' ? (
                  <XCircle className="w-5 h-5 text-rose-400" />
                ) : (
                  <Info className="w-5 h-5 text-sky-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-bold ${
                  currentStep.isFound
                    ? 'text-emerald-300'
                    : currentStep.type === 'not_found'
                    ? 'text-rose-300'
                    : isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {currentStep.isFound ? 'Target Found in Array!' : currentStep.type === 'not_found' ? 'Search Finished: Target Not Present' : `Step ${currentStepIndex + 1}`}
                </h4>
                <p className="text-xs sm:text-[13px] text-slate-300 mt-1 leading-relaxed whitespace-pre-line">
                  {currentStep.explanation}
                </p>
                {currentStep.quote && (
                  <div className="mt-2 text-[11px] font-mono text-sky-400/90 italic">
                    "{currentStep.quote}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DUAL RACE MODE: BINARY VS LINEAR SEARCH SIDE BY SIDE */
        <div className={`p-6 rounded-2xl border transition-colors flex flex-col gap-6 ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="text-center max-w-xl mx-auto mb-2">
            <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span>Side-by-Side Search Efficiency Race</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Watch how Binary Search slashes the search interval in half on each step ($O(\log n)$), while Linear Search must examine elements one by one ($O(n)$).
            </p>
          </div>

          {/* Lane 1: Binary Search */}
          <div className={`p-4 rounded-xl border ${
            currentBinaryStep.isFound
              ? 'bg-emerald-950/20 border-emerald-500/40'
              : isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 font-bold font-mono text-xs border border-sky-500/30">
                  Binary Search (O(log n))
                </span>
                <span className="text-xs text-slate-400">
                  Comparisons: <strong className="text-sky-300 font-mono text-sm">{currentBinaryStep.comparisonsCount || 0}</strong>
                </span>
              </div>
              {currentBinaryStep.isFound && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Found at index {currentBinaryStep.foundIndex}!
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2">
              {array.map((val, idx) => {
                const isMid = currentBinaryStep.mid === idx;
                const isEliminated = (currentBinaryStep.eliminatedIndices || []).includes(idx);
                const isMatched = currentBinaryStep.foundIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`w-9 sm:w-11 h-12 sm:h-14 rounded-lg flex flex-col items-center justify-center font-mono font-bold text-xs border transition-all ${
                      isMatched
                        ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 scale-105'
                        : isMid
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 scale-105'
                        : isEliminated
                        ? 'bg-slate-950/40 border-slate-800 text-slate-600 opacity-30 line-through'
                        : isDarkMode ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300'
                    }`}
                  >
                    <span>{val}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-300 mt-2 font-mono whitespace-pre-line">
              {currentBinaryStep.explanation || 'Initialising search interval...'}
            </p>
          </div>

          {/* Lane 2: Linear Search */}
          <div className={`p-4 rounded-xl border ${
            currentLinearStep.isFound
              ? 'bg-emerald-950/20 border-emerald-500/40'
              : isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-bold font-mono text-xs border border-indigo-500/30">
                  Linear Search (O(n))
                </span>
                <span className="text-xs text-slate-400">
                  Comparisons: <strong className="text-indigo-300 font-mono text-sm">{currentLinearStep.comparisonsCount || 0}</strong>
                </span>
              </div>
              {currentLinearStep.isFound && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Found at index {currentLinearStep.foundIndex}!
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2">
              {array.map((val, idx) => {
                const isCurrent = currentLinearStep.current === idx;
                const isChecked = (currentLinearStep.checkedIndices || []).includes(idx);
                const isMatched = currentLinearStep.foundIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`w-9 sm:w-11 h-12 sm:h-14 rounded-lg flex flex-col items-center justify-center font-mono font-bold text-xs border transition-all ${
                      isMatched
                        ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 scale-105'
                        : isCurrent
                        ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 scale-105'
                        : isChecked
                        ? 'bg-slate-950/40 border-slate-800 text-slate-600 opacity-30 line-through'
                        : isDarkMode ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300'
                    }`}
                  >
                    <span>{val}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-300 mt-2 font-mono whitespace-pre-line">
              {currentLinearStep.explanation || 'Initialising sequential pointer...'}
            </p>
          </div>
        </div>
      )}

      {/* 5. SIDE-BY-SIDE: PSEUDOCODE & LIVE VARIABLE TABLE */}
      {searchAlgorithm !== 'dual' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pseudocode Tracer Box */}
          <div className={`p-5 rounded-2xl border transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {searchAlgorithm === 'binary' ? 'Binary Search Pseudocode' : 'Linear Search Pseudocode'}
              </span>
              <span className="text-[10px] font-mono text-sky-400">Line {currentStep.codeLine || 1}</span>
            </div>

            <div className="font-mono text-xs sm:text-[12.5px] leading-relaxed flex flex-col gap-1 overflow-x-auto">
              {(searchAlgorithm === 'binary' ? BINARY_PSEUDOCODE : LINEAR_PSEUDOCODE).map((item) => {
                const isActive = currentStep.codeLine === item.line;
                return (
                  <div
                    key={item.line}
                    className={`flex items-center px-2.5 py-1 rounded-md transition-colors ${
                      isActive
                        ? 'bg-sky-500/20 border-l-4 border-sky-500 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <span className="w-6 text-slate-600 select-none text-[11px]">{item.line}</span>
                    <span className="whitespace-pre">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Trace Variables Box */}
          <div className={`p-5 rounded-2xl border transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live State Variables
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Memory Watch</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(currentStep.variables || {}).map(([key, val]) => (
                <div
                  key={key}
                  className={`p-3 rounded-xl border flex flex-col ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="text-[11px] font-mono text-slate-400 uppercase">{key}</span>
                  <span className="text-base font-mono font-bold text-sky-400 mt-1">
                    {typeof val === 'boolean' ? (val ? 'True' : 'False') : String(val)}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick GCSE Summary Box */}
            <div className={`mt-4 p-3.5 rounded-xl border text-xs leading-relaxed ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <strong className="text-sky-400">GCSE Exam Point:</strong>{' '}
              {searchAlgorithm === 'binary' ? (
                <span>
                  For an array of size $N = {array.length}$, Binary Search takes at most $\lceil\log_2({array.length})\rceil = {Math.ceil(Math.log2(array.length))}$ comparisons, even in the worst case!
                </span>
              ) : (
                <span>
                  Linear Search examines items sequentially. If the item is absent or at the very end, it will take all ${array.length}$ comparisons ($O(n)$).
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. GCSE REVISION & COMPARISON GUIDE */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Linear vs Binary Search: Key GCSE Differences &amp; Exam Tips
            </h3>
          </div>
          <button
            onClick={() => setIsExplainerCollapsed(!isExplainerCollapsed)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
            {isExplainerCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {!isExplainerCollapsed && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-4 font-bold">Feature</th>
                  <th className="py-2 px-4 font-bold text-indigo-400">Linear Search</th>
                  <th className="py-2 pl-4 font-bold text-sky-400">Binary Search</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                <tr>
                  <td className="py-2.5 pr-4 text-slate-400 font-bold">Requirement</td>
                  <td className="py-2.5 px-4 text-slate-300">Works on <strong>unsorted or sorted</strong> lists</td>
                  <td className="py-2.5 pl-4 text-slate-300">List <strong>MUST be sorted</strong> beforehand</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-400 font-bold">How it Works</td>
                  <td className="py-2.5 px-4 text-slate-300">Checks each element sequentially from start to end</td>
                  <td className="py-2.5 pl-4 text-slate-300">Calculates midpoint; halves the search space each time</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-400 font-bold">Time Complexity</td>
                  <td className="py-2.5 px-4 font-mono text-amber-400">O(n) - Linear Time</td>
                  <td className="py-2.5 pl-4 font-mono text-emerald-400">O(log n) - Logarithmic Time</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-400 font-bold">Best Case</td>
                  <td className="py-2.5 px-4 font-mono text-slate-300">O(1) - Item is at index 0</td>
                  <td className="py-2.5 pl-4 font-mono text-slate-300">O(1) - Item is exactly at initial midpoint</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-400 font-bold">Worst Case (1,000 items)</td>
                  <td className="py-2.5 px-4 font-mono text-rose-400">1,000 comparisons</td>
                  <td className="py-2.5 pl-4 font-mono text-emerald-400">Only 10 comparisons! (2^10 = 1,024)</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-400 font-bold">When to Use</td>
                  <td className="py-2.5 px-4 text-slate-300">Small lists, or unsorted lists searched only once</td>
                  <td className="py-2.5 pl-4 text-slate-300">Large lists that are already sorted or searched repeatedly</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
