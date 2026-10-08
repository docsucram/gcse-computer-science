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
import SearchVisualizer from './components/SearchVisualizer';
import CustomArrayModal from './components/CustomArrayModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';

import { ALGORITHMS } from './constants/algorithms';
import { generateSteps } from './services/sortingEngine';
import { soundManager } from './utils/audio';
import { BarChart3, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Navigation & View State
  const [activeView, setActiveView] = useState(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      if (['search', 'race', 'revision', 'visualizer'].includes(hash)) return hash;
    } catch {}
    return 'visualizer'; // 'visualizer' | 'search' | 'race' | 'revision'
  });
  const [visualizerMode, setVisualizerMode] = useState('bars'); // 'bars' | 'image'
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('bubble');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('theme');
      const s = p || localStorage.getItem('gcse_theme') || localStorage.getItem('theme');
      if (s === 'dark') return true;
      if (s === 'light') return false;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Handle View Change with hash support
  const handleViewChange = (view) => {
    setActiveView(view);
    try {
      window.location.hash = view;
    } catch {}
  };

  // Sync theme with <html> class and localStorage
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        localStorage.setItem('gcse_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        localStorage.setItem('gcse_theme', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  // Audio State
  const [audioMode, setAudioMode] = useState('clicks');

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
      // random: generate distinct values when size <= 85
      const pool = Array.from({ length: 88 }, (_, i) => i + 10);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      arr = pool.slice(0, size);
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
    <div className="min-h-screen flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeView={activeView}
        onViewChange={handleViewChange}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        audioMode={audioMode}
        onCycleAudio={handleCycleAudio}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {activeView === 'visualizer' && (() => {
          const currentAlgo = ALGORITHMS[selectedAlgorithm] || ALGORITHMS.bubble;
          return (
            <div className="editorial-container py-4">
              {/* 1. CLEAN UNBOXED HEADER */}
              <div className="view-banner mb-2">
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#1e2229] dark:text-[#f3f4f6]">
                  Sorting Algorithms: <span className="text-[#c8006b]">{currentAlgo.name}</span>
                </h1>
                <p className="text-xs sm:text-sm text-[#475569] dark:text-[#9ca3af] mt-1">
                  Sorting algorithms arrange unordered lists into ascending or descending sequence. Compare simple pairwise comparison passes like Bubble Sort against divide-and-conquer strategies like Merge Sort.
                </p>
              </div>

              {/* 2. SELF-CONTAINED APPLICATION WORKBENCH */}
              <div className="workbench-chassis">
                {/* TOP COMMAND BAR */}
                <div className="workbench-command-bar">
                  <div className="algo-selector-group">
                    {Object.values(ALGORITHMS).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAlgorithm(a.id)}
                        className={`algo-tab-btn flex items-center gap-1.5 ${selectedAlgorithm === a.id ? 'active' : ''}`}
                      >
                        <span>{a.name}</span>
                        {a.aqaCore && <span className="aqa-core-badge">AQA Core</span>}
                      </button>
                    ))}
                  </div>

                  <div className="workbench-tools-group">
                    <div className="flex items-center p-0.5 rounded-[2px] border border-[#c2b8a3] dark:border-[#2e3646] bg-[#fdfcf9] dark:bg-[#202632] text-xs">
                      <button
                        onClick={() => setVisualizerMode('bars')}
                        className={`px-2.5 py-1 rounded-[2px] font-semibold transition-all cursor-pointer ${
                          visualizerMode === 'bars' ? 'bg-[#1e3a5f] text-white font-bold' : 'text-[#585e6b] dark:text-[#9ca3af] hover:text-[#1e2229] dark:hover:text-[#f3f4f6]'
                        }`}
                      >
                        Bars
                      </button>
                      <button
                        onClick={() => setVisualizerMode('image')}
                        className={`px-2.5 py-1 rounded-[2px] font-semibold transition-all cursor-pointer ${
                          visualizerMode === 'image' ? 'bg-[#1e3a5f] text-white font-bold' : 'text-[#585e6b] dark:text-[#9ca3af] hover:text-[#1e2229] dark:hover:text-[#f3f4f6]'
                        }`}
                      >
                        Image
                      </button>
                    </div>

                    <div className="hud-stats-cluster">
                      <span className="stat-badge">Pass: <strong>{currentStep.pass ?? 1}</strong></span>
                      <span className="stat-badge">Checks: <strong>{currentStep.comparisons}</strong></span>
                      <span className="stat-badge">Swaps: <strong>{currentStep.swaps}</strong></span>
                    </div>
                  </div>
                </div>

                {/* WORKBENCH ARENA */}
                <div className="workbench-arena">
                  {visualizerMode === 'bars' ? (
                    <VisualizerBars
                      array={currentStep.array}
                      activeIndices={currentStep.indices}
                      sortedIndices={currentStep.sortedIndices}
                      stepType={currentStep.type}
                      sublistBounds={currentStep.sublistBounds}
                    />
                  ) : (
                    <VisualizerImage
                      array={currentStep.array}
                      activeIndices={currentStep.indices}
                      sortedIndices={currentStep.sortedIndices}
                      stepType={currentStep.type}
                      isCompleted={isCompleted}
                    />
                  )}

                  {/* Narrative Strip */}
                  <div className={`narrative-strip ${isCompleted ? 'matched' : ''}`}>
                    <div className="narrative-text">
                      {currentStepIndex === 0 ? (
                        <span>
                          <strong className="text-[#c8006b] font-bold mr-1.5">{currentAlgo.name}:</strong>
                          {currentAlgo.compactDesc || currentAlgo.description}
                        </span>
                      ) : (
                        currentStep.explanation || 'Ready. Click Play or Next Step to begin.'
                      )}
                    </div>
                    <div className="formula-tag">
                      {currentAlgo.name} • {currentAlgo.complexity.worstTime}
                    </div>
                  </div>
                </div>

                {/* 3. Playback Toolbar */}
                <ControlsToolbar
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  onStepBack={handleStepBack}
                  onStepForward={handleStepForward}
                  onNextPass={handleNextPass}
                  onReset={handleReset}
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
                />
              </div>

              {/* 4. Side-by-Side: Pseudocode Tracer & Trace Table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PseudocodeTracer
                  algorithmId={selectedAlgorithm}
                  activeLine={currentStep.codeLine}
                  variables={currentStep.variables}
                  explanation={currentStep.explanation}
                />
                <TraceTable
                  steps={steps}
                  currentStepIndex={currentStepIndex}
                  onJumpToStep={(idx) => executeStep(idx)}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          );
        })()}


        {/* View 2: Searching Algorithms Laboratory (Linear vs Binary Search) */}
        {activeView === 'search' && (
          <SearchVisualizer
            isDarkMode={isDarkMode}
            audioMode={audioMode}
            onCycleAudio={handleCycleAudio}
          />
        )}

        {/* View 3: Split-Screen Race Mode */}
        {activeView === 'race' && (
          <RaceMode
            isDarkMode={isDarkMode}
            audioMode={audioMode}
            onCycleAudio={handleCycleAudio}
          />
        )}

        {/* View 4: GCSE Revision Cards */}
        {activeView === 'revision' && (
          <RevisionCards activeAlgorithmId={selectedAlgorithm} isDarkMode={isDarkMode} />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-[#ded7c6] dark:border-[#2e3646] text-center text-xs bg-[#fdfcf9] dark:bg-[#181c24] text-[#585e6b] dark:text-[#9ca3af]">
        <p className="font-medium">
          GCSE Computer Science Searching &amp; Sorting Algorithms • Aligned with AQA 8525 §3.1
        </p>
        <p className="mt-1 text-[11.5px] text-[#8e95a2] dark:text-[#6b7280]">
          Client-side Web Audio synthesis • Zero server dependencies • Fast on school Chromebooks &amp; tablets
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
