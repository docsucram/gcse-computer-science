import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import VisualizerBars from './components/VisualizerBars';
import VisualizerImage from './components/VisualizerImage';
import PseudocodeTracer from './components/PseudocodeTracer';
import TraceTable from './components/TraceTable';
import ControlsToolbar from './components/ControlsToolbar';
import QuizModal from './components/QuizModal';
import RaceMode from './components/RaceMode';
import RevisionCards from './components/RevisionCards';
import CustomArrayModal from './components/CustomArrayModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';

import { ALGORITHMS } from './constants/algorithms';
import { generateSteps } from './services/sortingEngine';
import { soundManager } from './utils/audio';
import { BarChart3, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Navigation & View State
  const [activeView, setActiveView] = useState('visualizer'); // 'visualizer' | 'race' | 'revision'
  const [visualizerMode, setVisualizerMode] = useState('bars'); // 'bars' | 'image'
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('bubble');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved !== null) return saved === 'dark';
      return true; // default dark for modern IDE feel
    } catch {
      return true;
    }
  });

  // Sync theme with <html> class and localStorage
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  // Audio State
  const [audioMode, setAudioMode] = useState('chimes');

  // Playback & Array State
  const [arraySize, setArraySize] = useState(20);
  const [speed, setSpeed] = useState(15); // steps per second
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePreset, setActivePreset] = useState('random');

  const [initialArray, setInitialArray] = useState([]);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Quiz / Active Recall State
  const [quizMode, setQuizMode] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizStats, setQuizStats] = useState({ score: 0, streak: 0, total: 0 });

  // Modals
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Mobile layout state
  const [mobileInspectorTab, setMobileInspectorTab] = useState('pseudocode'); // 'pseudocode' | 'table' | 'both'
  const [isExplainerCollapsed, setIsExplainerCollapsed] = useState(false);

  // Playback timer ref
  const playTimerRef = useRef(null);

  // Helper to generate array based on preset
  const createPresetArray = useCallback((preset, size = arraySize) => {
    let arr = [];
    if (preset === 'reversed') {
      arr = Array.from({ length: size }, (_, i) => Math.round(95 - (i / (size - 1 || 1)) * 85));
    } else if (preset === 'nearly_sorted') {
      arr = Array.from({ length: size }, (_, i) => Math.round(10 + (i / (size - 1 || 1)) * 80));
      // Swap 2 random adjacent pairs
      for (let s = 0; s < Math.max(1, Math.floor(size / 6)); s++) {
        const idx = Math.floor(Math.random() * (size - 1));
        const tmp = arr[idx];
        arr[idx] = arr[idx + 1];
        arr[idx + 1] = tmp;
      }
    } else if (preset === 'few_unique') {
      const distinct = [15, 38, 65, 90];
      arr = Array.from({ length: size }, () => distinct[Math.floor(Math.random() * distinct.length)]);
    } else {
      // random
      arr = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
    }
    return arr;
  }, [arraySize]);

  // Load new array and generate steps
  const loadNewArray = useCallback((arr, preset = 'random') => {
    setIsPlaying(false);
    clearInterval(playTimerRef.current);
    setActivePreset(preset);
    setInitialArray(arr);

    const generated = generateSteps(selectedAlgorithm, arr);
    setSteps(generated);
    setCurrentStepIndex(0);
  }, [selectedAlgorithm]);

  // Re-generate when algorithm or preset changes
  useEffect(() => {
    const newArr = createPresetArray(activePreset, arraySize);
    loadNewArray(newArr, activePreset);
  }, [selectedAlgorithm, arraySize, activePreset, createPresetArray, loadNewArray]);

  // Handle Playback step execution
  const executeStep = useCallback((stepIdx) => {
    if (stepIdx < 0 || stepIdx >= steps.length) return;
    const step = steps[stepIdx];
    setCurrentStepIndex(stepIdx);

    // Audio tone
    if (step && step.indices && step.indices.length > 0) {
      const primaryIdx = step.indices[0];
      const val = step.array[primaryIdx] || 50;
      soundManager.playTone(val / 100, step.type);
    }

    // Check if step completed
    if (stepIdx === steps.length - 1 && steps.length > 1) {
      setIsPlaying(false);
      clearInterval(playTimerRef.current);
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      soundManager.playVictoryFanfare();
      return;
    }

    // Check if Quiz Mode is ON and this step has a question
    if (quizMode && step && step.quiz) {
      setIsPlaying(false);
      clearInterval(playTimerRef.current);
      setActiveQuiz(step.quiz);
      setIsQuizModalOpen(true);
    }
  }, [steps, quizMode]);

  // Continuous playback effect
  useEffect(() => {
    if (!isPlaying) {
      clearInterval(playTimerRef.current);
      return;
    }

    const intervalMs = Math.max(15, Math.floor(1000 / speed));

    playTimerRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          clearInterval(playTimerRef.current);
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          soundManager.playVictoryFanfare();
          return prev;
        }

        const next = prev + 1;
        const step = steps[next];
        if (step?.indices?.[0] !== undefined) {
          const val = step.array[step.indices[0]] || 50;
          soundManager.playTone(val / 100, step.type);
        }

        if (quizMode && step?.quiz) {
          setIsPlaying(false);
          clearInterval(playTimerRef.current);
          setActiveQuiz(step.quiz);
          setIsQuizModalOpen(true);
        }

        return next;
      });
    }, intervalMs);

    return () => clearInterval(playTimerRef.current);
  }, [isPlaying, speed, steps, quizMode]);

  // Step Forward
  const handleStepForward = () => {
    if (currentStepIndex < steps.length - 1) {
      executeStep(currentStepIndex + 1);
    }
  };

  // Step Backward
  const handleStepBack = () => {
    if (currentStepIndex > 0) {
      executeStep(currentStepIndex - 1);
    }
  };

  // Next Pass (GCSE Exam Core Feature)
  const handleNextPass = () => {
    if (currentStepIndex >= steps.length - 1) return;
    const currentPass = steps[currentStepIndex]?.pass ?? 0;
    // Find next step where isPassEnd is true and pass > currentPass (or last step)
    let targetIdx = -1;
    for (let i = currentStepIndex + 1; i < steps.length; i++) {
      if (steps[i].isPassEnd && steps[i].pass > currentPass) {
        targetIdx = i;
        break;
      }
    }
    if (targetIdx === -1) {
      targetIdx = steps.length - 1;
    }
    executeStep(targetIdx);
  };

  // Reset to step 0
  const handleReset = () => {
    setIsPlaying(false);
    clearInterval(playTimerRef.current);
    executeStep(0);
  };

  // Shuffle list
  const handleShuffle = () => {
    const newArr = createPresetArray('random', arraySize);
    loadNewArray(newArr, 'random');
  };

  // Preset change
  const handlePresetChange = (preset) => {
    setActivePreset(preset);
    const newArr = createPresetArray(preset, arraySize);
    loadNewArray(newArr, preset);
  };

  // Custom Array modal submit
  const handleCustomArraySubmit = (customArr) => {
    setArraySize(customArr.length);
    loadNewArray(customArr, 'custom');
  };

  // Audio cycle
  const handleCycleAudio = () => {
    const nextMode = soundManager.cycleMode();
    setAudioMode(nextMode);
  };

  // Quiz Answer
  const handleQuizAnswer = (isCorrect) => {
    setQuizStats((prev) => ({
      score: isCorrect ? prev.score + 1 : prev.score,
      streak: isCorrect ? prev.streak + 1 : 0,
      total: prev.total + 1,
    }));
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyS') {
        e.preventDefault();
        handleStepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleStepBack();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        handleNextPass();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleCycleAudio();
      } else if (e.code === 'KeyQ') {
        e.preventDefault();
        setQuizMode((q) => !q);
      } else if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
        e.preventDefault();
        setIsShortcutsOpen((o) => !o);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const currentStep = steps[currentStepIndex] || {
    array: initialArray,
    indices: [],
    sortedIndices: [],
    type: 'initial',
    variables: {},
    codeLine: 1,
    explanation: 'Ready',
    comparisons: 0,
    swaps: 0,
  };

  const isCompleted = currentStepIndex === steps.length - 1 && steps.length > 1;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Navigation */}
      <Navbar
        activeView={activeView}
        onViewChange={setActiveView}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        audioMode={audioMode}
        onCycleAudio={handleCycleAudio}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {activeView === 'visualizer' && (
          <div className="flex flex-col gap-6">
            {/* 1. Visualizer Canvas Chart Area (At the Top) */}
            {visualizerMode === 'bars' ? (
              <VisualizerBars
                array={currentStep.array}
                activeIndices={currentStep.indices}
                sortedIndices={currentStep.sortedIndices}
                stepType={currentStep.type}
                sublistBounds={currentStep.sublistBounds}
                isDarkMode={isDarkMode}
              />
            ) : (
              <VisualizerImage
                array={currentStep.array}
                activeIndices={currentStep.indices}
                sortedIndices={currentStep.sortedIndices}
                stepType={currentStep.type}
                isCompleted={isCompleted}
                isDarkMode={isDarkMode}
              />
            )}

            {/* 2. Algorithm Selector & Plain-English Explainer (Positioned directly under the chart) */}
            {(() => {
              const currentAlgo = ALGORITHMS[selectedAlgorithm] || ALGORITHMS.bubble;
              return (
                <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    {/* Left: Selector Dropdown & Mode Toggles */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <div>
                        <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          Select Algorithm:
                        </label>
                        <select
                          value={selectedAlgorithm}
                          onChange={(e) => setSelectedAlgorithm(e.target.value)}
                          className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 ${
                            isDarkMode
                              ? 'bg-slate-800 border-slate-700 text-white'
                              : 'bg-slate-100 border-slate-300 text-slate-900'
                          }`}
                        >
                          {Object.values(ALGORITHMS).map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} {a.aqaCore ? '★ [AQA Core]' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Mode Toggle: Bars vs Image Slices */}
                      <div className="self-end mb-0.5">
                        <div className={`flex items-center p-0.5 rounded-xl border text-xs ${
                          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                        }`}>
                          <button
                            onClick={() => setVisualizerMode('bars')}
                            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-semibold cursor-pointer ${
                              visualizerMode === 'bars'
                                ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                                : isDarkMode
                                ? 'text-slate-400 hover:text-slate-200'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Animated Bar Chart"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Bars</span>
                          </button>
                          <button
                            onClick={() => setVisualizerMode('image')}
                            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-semibold cursor-pointer ${
                              visualizerMode === 'image'
                                ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                                : isDarkMode
                                ? 'text-slate-400 hover:text-slate-200'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Vertical Image Slice Sorting"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Image</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: How It Works Explainer */}
                    <div className={`flex-1 p-3.5 rounded-xl border flex flex-col transition-colors ${
                      isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-indigo-50/50 border-indigo-100'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-extrabold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                            How {currentAlgo.name} Works:
                          </span>
                          {currentAlgo.aqaCore && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                              AQA Core
                            </span>
                          )}
                          <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            ({currentAlgo.category})
                          </span>
                        </div>
                        <button
                          onClick={() => setIsExplainerCollapsed(!isExplainerCollapsed)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isExplainerCollapsed ? 'Show' : 'Hide'}
                        </button>
                      </div>
                      {!isExplainerCollapsed && (
                        <p className={`text-xs sm:text-[12.5px] leading-relaxed m-0 mt-1.5 ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          {currentAlgo.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. Playback Controls & Timeline Toolbar */}
            <ControlsToolbar
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onStepBack={handleStepBack}
              onStepForward={handleStepForward}
              onNextPass={handleNextPass}
              onReset={handleReset}
              onShuffle={handleShuffle}
              onPresetChange={handlePresetChange}
              currentStepIndex={currentStepIndex}
              totalSteps={steps.length}
              onScrub={(idx) => executeStep(idx)}
              speed={speed}
              onSpeedChange={setSpeed}
              arraySize={arraySize}
              onArraySizeChange={setArraySize}
              activePreset={activePreset}
              onOpenCustomModal={() => setIsCustomModalOpen(true)}
              audioMode={audioMode}
              onCycleAudio={handleCycleAudio}
              quizMode={quizMode}
              onToggleQuizMode={() => setQuizMode(!quizMode)}
              isDarkMode={isDarkMode}
            />

            {/* 4. Side-by-Side: Pseudocode Tracer & Trace Table */}
            <div className="flex flex-col gap-3">
              {/* Mobile Inspection Switcher Pill */}
              <div className={`flex lg:hidden items-center justify-between p-1.5 rounded-xl border text-xs ${
                isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <span className={`text-[11px] font-bold px-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Inspect:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMobileInspectorTab('pseudocode')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      mobileInspectorTab === 'pseudocode'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Code & Variables
                  </button>
                  <button
                    onClick={() => setMobileInspectorTab('table')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      mobileInspectorTab === 'table'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Trace Table
                  </button>
                  <button
                    onClick={() => setMobileInspectorTab('both')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      mobileInspectorTab === 'both'
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Both
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={mobileInspectorTab === 'table' ? 'hidden lg:block' : 'block'}>
                  <PseudocodeTracer
                    algorithmId={selectedAlgorithm}
                    activeLine={currentStep.codeLine}
                    variables={currentStep.variables}
                    explanation={currentStep.explanation}
                    isDarkMode={isDarkMode}
                  />
                </div>
                <div className={mobileInspectorTab === 'pseudocode' ? 'hidden lg:block' : 'block'}>
                  <TraceTable
                    steps={steps}
                    currentStepIndex={currentStepIndex}
                    onJumpToStep={(idx) => executeStep(idx)}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Split-Screen Race Mode */}
        {activeView === 'race' && (
          <RaceMode
            isDarkMode={isDarkMode}
            audioMode={audioMode}
            onCycleAudio={handleCycleAudio}
          />
        )}

        {/* View 3: GCSE Revision Cards */}
        {activeView === 'revision' && (
          <RevisionCards activeAlgorithmId={selectedAlgorithm} isDarkMode={isDarkMode} />
        )}
      </main>

      {/* Footer */}
      <footer className={`w-full py-6 border-t text-center text-xs transition-colors ${
        isDarkMode ? 'border-slate-800 text-slate-500 bg-slate-950/60' : 'border-slate-200 text-slate-500 bg-white/60'
      }`}>
        <p>
          GCSE Computer Science Sorting Visualizer & Learning Lab • Built for OCR J277, AQA 8525 & Edexcel
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Client-side Web Audio synthesis • Zero server dependencies • Optimized for Chromebooks, iPads, and Laptops
        </p>
      </footer>

      {/* Modals */}
      <QuizModal
        isOpen={isQuizModalOpen}
        quiz={activeQuiz}
        onClose={() => setIsQuizModalOpen(false)}
        onAnswer={handleQuizAnswer}
        quizStats={quizStats}
        isDarkMode={isDarkMode}
      />

      <CustomArrayModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSubmit={handleCustomArraySubmit}
        isDarkMode={isDarkMode}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
