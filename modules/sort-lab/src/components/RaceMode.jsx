import React, { useState, useEffect, useRef } from 'react';
import { ALGORITHMS } from '../constants/algorithms';
import { generateSteps } from '../services/sortingEngine';
import VisualizerBars from './VisualizerBars';
import { soundManager } from '../utils/audio';
import { Play, Pause, RotateCcw, Swords, Zap, CheckCircle2, Trophy, FastForward, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RaceMode({
  isDarkMode = true,
  audioMode = 'chimes',
  onCycleAudio = () => {},
}) {
  const [algo1Id, setAlgo1Id] = useState('bubble');
  const [algo2Id, setAlgo2Id] = useState('merge');
  const [arraySize, setArraySize] = useState(30);
  const [speed, setSpeed] = useState(30); // steps per second
  const [isPlaying, setIsPlaying] = useState(false);

  const [initialArray, setInitialArray] = useState([]);
  const [steps1, setSteps1] = useState([]);
  const [steps2, setSteps2] = useState([]);

  const [stepIdx1, setStepIdx1] = useState(0);
  const [stepIdx2, setStepIdx2] = useState(0);

  const [winner, setWinner] = useState(null);
  const timerRef = useRef(null);

  // Generate randomized array
  const generateNewRace = (size = arraySize) => {
    setIsPlaying(false);
    setWinner(null);
    clearInterval(timerRef.current);

    const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 95) + 5);
    setInitialArray(arr);

    const s1 = generateSteps(algo1Id, arr);
    const s2 = generateSteps(algo2Id, arr);
    setSteps1(s1);
    setSteps2(s2);
    setStepIdx1(0);
    setStepIdx2(0);
  };

  useEffect(() => {
    generateNewRace(arraySize);
  }, [algo1Id, algo2Id, arraySize]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(12, Math.floor(1000 / speed));

    timerRef.current = setInterval(() => {
      let done1 = false;
      let done2 = false;

      setStepIdx1((prev1) => {
        if (prev1 < steps1.length - 1) {
          const next = prev1 + 1;
          const s = steps1[next];
          if (s?.indices?.[0] !== undefined) {
            soundManager.playTone(s.array[s.indices[0]] / 100, s.type);
          }
          return next;
        } else {
          done1 = true;
          return prev1;
        }
      });

      setStepIdx2((prev2) => {
        if (prev2 < steps2.length - 1) {
          return prev2 + 1;
        } else {
          done2 = true;
          return prev2;
        }
      });

      // Check completions
      setWinner((prevWinner) => {
        if (prevWinner) return prevWinner;
        if (done1 && !done2) return algo1Id;
        if (done2 && !done1) return algo2Id;
        if (done1 && done2) return 'tie';
        return null;
      });

      if (done1 && done2) {
        setIsPlaying(false);
        clearInterval(timerRef.current);
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        soundManager.playVictoryFanfare();
      }
    }, intervalMs);

    return () => clearInterval(timerRef.current);
  }, [isPlaying, speed, steps1, steps2]);

  const currentStep1 = steps1[stepIdx1] || { array: initialArray, indices: [], sortedIndices: [], type: 'initial', comparisons: 0, swaps: 0 };
  const currentStep2 = steps2[stepIdx2] || { array: initialArray, indices: [], sortedIndices: [], type: 'initial', comparisons: 0, swaps: 0 };

  const isDone1 = stepIdx1 >= steps1.length - 1 && steps1.length > 0;
  const isDone2 = stepIdx2 >= steps2.length - 1 && steps2.length > 0;

  const algo1Meta = ALGORITHMS[algo1Id];
  const algo2Meta = ALGORITHMS[algo2Id];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6">
      {/* Race Header & Toolbar */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Swords className="w-5 h-5" />
            </span>
            <div>
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Split-Screen Algorithm Race</h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                Direct head-to-head comparison demonstrating O(n log n) divide-and-conquer vs O(n²) quadratic efficiency.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-md shadow-indigo-600/30"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'Pause Race' : 'Start Race'}</span>
            </button>

            <button
              onClick={() => generateNewRace(arraySize)}
              className={`p-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isDarkMode ? 'border-slate-800 bg-slate-800 hover:bg-slate-700 text-slate-300' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Reset with new random array"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onCycleAudio}
              className={`p-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                audioMode === 'off'
                  ? isDarkMode
                    ? 'border-slate-800 bg-slate-800 text-slate-500 hover:text-slate-300'
                    : 'border-slate-200 bg-slate-100 text-slate-400 hover:text-slate-600'
                  : isDarkMode
                  ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300 font-bold'
                  : 'border-indigo-300 bg-indigo-50 text-indigo-700 font-bold'
              }`}
              title={`Sound: ${audioMode.toUpperCase()} (Click to toggle)`}
            >
              {audioMode === 'off' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-indigo-500" />}
              <span className="capitalize hidden sm:inline">{audioMode}</span>
            </button>
          </div>
        </div>

        {/* Sliders: Array Size & Speed */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t ${isDarkMode ? 'border-slate-800/40' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5 text-xs">
            <span className={`font-semibold whitespace-nowrap min-w-[95px] ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
              List Elements: <strong className={isDarkMode ? 'text-indigo-400' : 'text-indigo-700 font-bold'}>{arraySize}</strong>
            </span>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={arraySize}
              onChange={(e) => setArraySize(Number(e.target.value))}
              className="w-36 sm:w-44 accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <span className={`font-semibold whitespace-nowrap min-w-[120px] ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
              Animation Speed: <strong className={isDarkMode ? 'text-indigo-400' : 'text-indigo-700 font-bold'}>{speed} steps/s</strong>
            </span>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-36 sm:w-44 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Side-by-side Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Racer 1 */}
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-3 transition-colors ${
          winner === algo1Id ? 'ring-2 ring-amber-500 border-amber-500/50' : ''
        } ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={algo1Id}
                onChange={(e) => setAlgo1Id(e.target.value)}
                className={`text-sm font-bold px-3 py-1.5 rounded-xl border font-sans outline-hidden ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                {Object.values(ALGORITHMS).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                isDarkMode ? 'bg-indigo-500/10 text-indigo-400 font-semibold' : 'bg-indigo-50 text-indigo-800 font-bold border border-indigo-200'
              }`}>
                {algo1Meta.complexity.averageTime}
              </span>
            </div>

            {winner === algo1Id && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full animate-bounce">
                <Trophy className="w-3.5 h-3.5" />
                Winner!
              </span>
            )}
            {isDone1 && winner !== algo1Id && (
              <span className={`text-xs font-bold flex items-center gap-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Finished
              </span>
            )}
          </div>

          <div className={`w-full h-[300px] sm:h-[340px] rounded-xl overflow-hidden p-1 border ${
            isDarkMode ? 'bg-slate-950/40 border-slate-800/40' : 'bg-slate-50 border-slate-200'
          }`}>
            <VisualizerBars
              array={currentStep1.array}
              activeIndices={currentStep1.indices}
              sortedIndices={currentStep1.sortedIndices}
              stepType={currentStep1.type}
              sublistBounds={currentStep1.sublistBounds}
              isDarkMode={isDarkMode}
              className="w-full h-full border-none shadow-none bg-transparent"
            />
          </div>

          {/* Stats Bar */}
          <div className={`grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t ${
            isDarkMode ? 'border-slate-800/40' : 'border-slate-200'
          }`}>
            <div className={`p-2 rounded-xl border ${
              isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-100/90 border-slate-300'
            }`}>
              <span className={`block text-[10px] uppercase font-bold ${
                isDarkMode ? 'text-slate-400' : 'text-slate-700'
              }`}>Comparisons</span>
              <span className={`text-sm font-mono font-bold ${
                isDarkMode ? 'text-amber-400' : 'text-amber-800'
              }`}>{currentStep1.comparisons}</span>
            </div>
            <div className={`p-2 rounded-xl border ${
              isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-100/90 border-slate-300'
            }`}>
              <span className={`block text-[10px] uppercase font-bold ${
                isDarkMode ? 'text-slate-400' : 'text-slate-700'
              }`}>Swaps / Writes</span>
              <span className={`text-sm font-mono font-bold ${
                isDarkMode ? 'text-rose-400' : 'text-rose-700'
              }`}>{currentStep1.swaps}</span>
            </div>
          </div>
        </div>

        {/* Racer 2 */}
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-3 transition-colors ${
          winner === algo2Id ? 'ring-2 ring-amber-500 border-amber-500/50' : ''
        } ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={algo2Id}
                onChange={(e) => setAlgo2Id(e.target.value)}
                className={`text-sm font-bold px-3 py-1.5 rounded-xl border font-sans outline-hidden ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                {Object.values(ALGORITHMS).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                isDarkMode ? 'bg-indigo-500/10 text-indigo-400 font-semibold' : 'bg-indigo-50 text-indigo-800 font-bold border border-indigo-200'
              }`}>
                {algo2Meta.complexity.averageTime}
              </span>
            </div>

            {winner === algo2Id && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full animate-bounce">
                <Trophy className="w-3.5 h-3.5" />
                Winner!
              </span>
            )}
            {isDone2 && winner !== algo2Id && (
              <span className={`text-xs font-bold flex items-center gap-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Finished
              </span>
            )}
          </div>

          <div className={`w-full h-[300px] sm:h-[340px] rounded-xl overflow-hidden p-1 border ${
            isDarkMode ? 'bg-slate-950/40 border-slate-800/40' : 'bg-slate-50 border-slate-200'
          }`}>
            <VisualizerBars
              array={currentStep2.array}
              activeIndices={currentStep2.indices}
              sortedIndices={currentStep2.sortedIndices}
              stepType={currentStep2.type}
              sublistBounds={currentStep2.sublistBounds}
              isDarkMode={isDarkMode}
              className="w-full h-full border-none shadow-none bg-transparent"
            />
          </div>

          {/* Stats Bar */}
          <div className={`grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t ${
            isDarkMode ? 'border-slate-800/40' : 'border-slate-200'
          }`}>
            <div className={`p-2 rounded-xl border ${
              isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-100/90 border-slate-300'
            }`}>
              <span className={`block text-[10px] uppercase font-bold ${
                isDarkMode ? 'text-slate-400' : 'text-slate-700'
              }`}>Comparisons</span>
              <span className={`text-sm font-mono font-bold ${
                isDarkMode ? 'text-amber-400' : 'text-amber-800'
              }`}>{currentStep2.comparisons}</span>
            </div>
            <div className={`p-2 rounded-xl border ${
              isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-100/90 border-slate-300'
            }`}>
              <span className={`block text-[10px] uppercase font-bold ${
                isDarkMode ? 'text-slate-400' : 'text-slate-700'
              }`}>Swaps / Writes</span>
              <span className={`text-sm font-mono font-bold ${
                isDarkMode ? 'text-rose-400' : 'text-rose-700'
              }`}>{currentStep2.swaps}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time GCSE Takeaway & Comparison Analysis */}
      {(isDone1 || isDone2) && (
        <div className={`p-4 rounded-2xl border ${
          isDarkMode ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-950'
        }`}>
          <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            GCSE Exam Analysis & Efficiency Verdict
          </h4>
          <p className="text-xs leading-relaxed">
            {winner === algo1Id ? algo1Meta.name : (winner === algo2Id ? algo2Meta.name : 'Both')} finished in fewer operations! Notice how the divide-and-conquer logarithmic reduction eliminates quadratic iteration loops on lists as small as {arraySize} elements.
          </p>
        </div>
      )}
    </div>
  );
}
