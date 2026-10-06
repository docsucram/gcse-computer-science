import React, { useState, useEffect, useRef } from 'react';
import { ALGORITHMS } from '../constants/algorithms';
import { generateSteps } from '../services/sortingEngine';
import VisualizerBars from './VisualizerBars';
import { soundManager } from '../utils/audio';
import { Play, Pause, RotateCcw, Swords, CheckCircle2, Trophy, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RaceMode({
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

      setStepIdx1((prev) => {
        if (prev < steps1.length - 1) return prev + 1;
        done1 = true;
        return prev;
      });

      setStepIdx2((prev) => {
        if (prev < steps2.length - 1) return prev + 1;
        done2 = true;
        return prev;
      });

      setWinner((currentWinner) => {
        if (currentWinner) return currentWinner;
        if (done1 && !done2) return algo1Id;
        if (done2 && !done1) return algo2Id;
        if (done1 && done2) return 'tie';
        return null;
      });

      if (done1 && done2) {
        setIsPlaying(false);
        clearInterval(timerRef.current);
        confetti({ particleCount: 75, spread: 75, origin: { y: 0.6 } });
        soundManager.playVictoryFanfare();
      }
    }, intervalMs);

    return () => clearInterval(timerRef.current);
  }, [isPlaying, speed, steps1, steps2, algo1Id, algo2Id]);

  const currentStep1 = steps1[stepIdx1] || { array: initialArray, indices: [], sortedIndices: [], type: 'initial', comparisons: 0, swaps: 0 };
  const currentStep2 = steps2[stepIdx2] || { array: initialArray, indices: [], sortedIndices: [], type: 'initial', comparisons: 0, swaps: 0 };

  const isDone1 = stepIdx1 >= steps1.length - 1 && steps1.length > 0;
  const isDone2 = stepIdx2 >= steps2.length - 1 && steps2.length > 0;

  const algo1Meta = ALGORITHMS[algo1Id];
  const algo2Meta = ALGORITHMS[algo2Id];

  return (
    <div className="editorial-container py-6">
      {/* 1. CLEAN EDITORIAL HEADER */}
      <header className="revision-header">
        <div className="revision-title-block">
          <span className="spec-pill">AQA 3.1.1 // OCR J277 2.1</span>
          <h1 style={{ marginTop: '6px' }}>Algorithm Duel: Head-to-Head Sorting Race</h1>
          <p>
            Direct head-to-head performance race. Compare O(n log n) divide-and-conquer against O(n²) quadratic algorithms in real time on identical lists.
          </p>
        </div>
      </header>

      {/* 2. RACE CONTROLS TOOLBAR */}
      <div className="bg-[#fdfcf9] border border-[#ded7c6] rounded-[2px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-[#1e3a5f]" />
            <span className="font-bold text-sm text-[#1e2229]">Race Settings &amp; Execution</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-[2px] bg-[#1e3a5f] hover:bg-[#152b47] text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'Pause Race' : 'Start Race'}</span>
            </button>

            <button
              onClick={() => generateNewRace(arraySize)}
              className="p-2 rounded-[2px] border border-[#c2b8a3] bg-[#fdfcf9] text-[#1e2229] hover:border-[#1e3a5f] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reset with new random array"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Race</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onCycleAudio}
              className={`px-2.5 py-1.5 rounded-[2px] border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                audioMode === 'off'
                  ? 'border-[#c2b8a3] bg-[#fdfcf9] text-[#8e95a2] hover:text-[#1e2229]'
                  : 'border-[#1e3a5f] bg-[#edf3f9] text-[#1e3a5f] font-bold'
              }`}
              title={`Sound: ${audioMode.toUpperCase()} (Click to toggle)`}
            >
              {audioMode === 'off' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#1e3a5f]" />}
              <span className="capitalize">{audioMode}</span>
            </button>
          </div>
        </div>

        {/* Sliders: Array Size & Speed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#ded7c6] text-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-medium text-[#585e6b] whitespace-nowrap min-w-[95px]">
              List Size: <strong className="text-[#1e3a5f] font-mono font-bold">{arraySize} items</strong>
            </span>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={arraySize}
              onChange={(e) => setArraySize(Number(e.target.value))}
              className="w-36 sm:w-44 accent-[#1e3a5f] cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2.5 sm:justify-end">
            <span className="font-medium text-[#585e6b] whitespace-nowrap min-w-[120px]">
              Speed: <strong className="text-[#1e3a5f] font-mono font-bold">{speed} steps/s</strong>
            </span>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-36 sm:w-44 accent-[#1e3a5f] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. SIDE-BY-SIDE VISUALIZERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Racer 1 */}
        <div className={`p-4 sm:p-5 rounded-[2px] border flex flex-col gap-3 transition-colors bg-[#fdfcf9] ${
          winner === algo1Id ? 'border-[#b45309] shadow-md' : 'border-[#ded7c6]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={algo1Id}
                onChange={(e) => setAlgo1Id(e.target.value)}
                className="text-xs sm:text-sm font-bold px-3 py-1.5 rounded-[2px] border border-[#c2b8a3] bg-[#fdfcf9] text-[#1e2229] font-sans outline-hidden cursor-pointer"
              >
                {Object.values(ALGORITHMS).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <span className="text-xs font-mono px-2 py-0.5 rounded-[2px] bg-[#edf3f9] text-[#1e3a5f] font-bold border border-[#cbd5e1]">
                {algo1Meta.complexity.averageTime}
              </span>
            </div>

            {winner === algo1Id && (
              <span className="flex items-center gap-1 text-xs font-bold text-[#78350f] bg-[#fef3c7] border border-[#fde68a] px-2.5 py-1 rounded-[2px]">
                <Trophy className="w-3.5 h-3.5 text-[#b45309]" />
                Winner!
              </span>
            )}
            {isDone1 && winner !== algo1Id && (
              <span className="text-xs font-bold flex items-center gap-1 text-[#1a6b3c]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Finished
              </span>
            )}
          </div>

          <div className="w-full h-[280px] sm:h-[320px] rounded-[2px] overflow-hidden p-1 border border-[#ded7c6] bg-[#f5f3ec]">
            <VisualizerBars
              array={currentStep1.array}
              activeIndices={currentStep1.indices}
              sortedIndices={currentStep1.sortedIndices}
              stepType={currentStep1.type}
              sublistBounds={currentStep1.sublistBounds}
              isDarkMode={false}
              className="w-full h-full border-none shadow-none bg-transparent"
            />
          </div>

          {/* Telemetry */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="p-2 rounded-[2px] bg-[#ede8db] border border-[#ded7c6]">
              <span className="text-[#585e6b] block text-[10.5px]">Step Progress</span>
              <strong className="text-[#1e2229] font-mono text-sm">{stepIdx1} / {steps1.length}</strong>
            </div>
            <div className="p-2 rounded-[2px] bg-[#ede8db] border border-[#ded7c6]">
              <span className="text-[#585e6b] block text-[10.5px]">Comparisons</span>
              <strong className="text-[#1e3a5f] font-mono text-sm">{currentStep1.comparisons}</strong>
            </div>
            <div className="p-2 rounded-[2px] bg-[#ede8db] border border-[#ded7c6]">
              <span className="text-[#585e6b] block text-[10.5px]">Swaps / Shifts</span>
              <strong className="text-[#a82020] font-mono text-sm">{currentStep1.swaps}</strong>
            </div>
          </div>
        </div>

        {/* Racer 2 */}
        <div className={`p-4 sm:p-5 rounded-[2px] border flex flex-col gap-3 transition-colors bg-[#fdfcf9] ${
          winner === algo2Id ? 'border-[#b45309] shadow-md' : 'border-[#ded7c6]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={algo2Id}
                onChange={(e) => setAlgo2Id(e.target.value)}
                className="text-xs sm:text-sm font-bold px-3 py-1.5 rounded-[2px] border border-[#c2b8a3] bg-[#fdfcf9] text-[#1e2229] font-sans outline-hidden cursor-pointer"
              >
                {Object.values(ALGORITHMS).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <span className="text-xs font-mono px-2 py-0.5 rounded-[2px] bg-[#edf3f9] text-[#1e3a5f] font-bold border border-[#cbd5e1]">
                {algo2Meta.complexity.averageTime}
              </span>
            </div>

            {winner === algo2Id && (
              <span className="flex items-center gap-1 text-xs font-bold text-[#78350f] bg-[#fef3c7] border border-[#fde68a] px-2.5 py-1 rounded-[2px]">
                <Trophy className="w-3.5 h-3.5 text-[#b45309]" />
                Winner!
              </span>
            )}
            {isDone2 && winner !== algo2Id && (
              <span className="text-xs font-bold flex items-center gap-1 text-[#1a6b3c]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Finished
              </span>
            )}
          </div>

          <div className="w-full h-[280px] sm:h-[320px] rounded-[2px] overflow-hidden p-1 border border-[#ded7c6] bg-[#f5f3ec]">
            <VisualizerBars
              array={currentStep2.array}
              activeIndices={currentStep2.indices}
              sortedIndices={currentStep2.sortedIndices}
              stepType={currentStep2.type}
              sublistBounds={currentStep2.sublistBounds}
              isDarkMode={false}
              className="w-full h-full border-none shadow-none bg-transparent"
            />
          </div>

          {/* Telemetry */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="p-2 rounded-[2px] bg-[#ede8db] border border-[#ded7c6]">
              <span className="text-[#585e6b] block text-[10.5px]">Step Progress</span>
              <strong className="text-[#1e2229] font-mono text-sm">{stepIdx2} / {steps2.length}</strong>
            </div>
            <div className="p-2 rounded-[2px] bg-[#ede8db] border border-[#ded7c6]">
              <span className="text-[#585e6b] block text-[10.5px]">Comparisons</span>
              <strong className="text-[#1e3a5f] font-mono text-sm">{currentStep2.comparisons}</strong>
            </div>
            <div className="p-2 rounded-[2px] bg-[#ede8db] border border-[#ded7c6]">
              <span className="text-[#585e6b] block text-[10.5px]">Swaps / Shifts</span>
              <strong className="text-[#a82020] font-mono text-sm">{currentStep2.swaps}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. COMPARISON BANNER */}
      <div className="p-4 rounded-[2px] border border-[#cbd5e1] bg-[#edf3f9] text-[#1e3a5f] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium">
        <div>
          <strong className="text-sm font-bold block mb-0.5">GCSE Exam Takeaway:</strong>
          <span>
            {algo1Meta.complexity.averageTime === 'O(n²)' && algo2Meta.complexity.averageTime === 'O(n log n)' ? (
              `${algo2Meta.name} drastically outperforms ${algo1Meta.name} as list size grows because divide-and-conquer halves work at each stage.`
            ) : (
              'Algorithms with lower time complexities require far fewer comparisons and swaps to finish sorting large datasets.'
            )}
          </span>
        </div>
        <div className="shrink-0 flex items-center gap-3 font-mono text-xs font-bold">
          <span>{algo1Meta.name}: {currentStep1.comparisons} cmps</span>
          <span>vs</span>
          <span>{algo2Meta.name}: {currentStep2.comparisons} cmps</span>
        </div>
      </div>
    </div>
  );
}
