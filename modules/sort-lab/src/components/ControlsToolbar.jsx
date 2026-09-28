import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  RotateCcw,
  Shuffle,
  Volume2,
  VolumeX,
  Sliders,
  HelpCircle,
  Edit3,
} from 'lucide-react';

export default function ControlsToolbar({
  isPlaying = false,
  onTogglePlay = () => {},
  onStepBack = () => {},
  onStepForward = () => {},
  onNextPass = () => {},
  onReset = () => {},
  onShuffle = () => {},
  onPresetChange = () => {},
  currentStepIndex = 0,
  totalSteps = 1,
  onScrub = () => {},
  speed = 15,
  onSpeedChange = () => {},
  arraySize = 25,
  onArraySizeChange = () => {},
  activePreset = 'random',
  onOpenCustomModal = () => {},
  audioMode = 'chimes',
  onCycleAudio = () => {},
  quizMode = false,
  onToggleQuizMode = () => {},
  isDarkMode = true,
}) {
  const progressPercent = totalSteps > 1 ? (currentStepIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-4 transition-colors ${
      isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* 1. Main Playback Buttons & Timeline Scrubber */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Playback Button Group */}
        <div className="flex items-center gap-2">
          {/* Step Back */}
          <button
            onClick={onStepBack}
            disabled={currentStepIndex <= 0 || isPlaying}
            className={`p-2.5 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none ${
              isDarkMode ? 'border-slate-800 bg-slate-800 hover:bg-slate-700 text-slate-200' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Step Back [Left Arrow]"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={onTogglePlay}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95"
            title="Play / Pause [Spacebar]"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Step Forward */}
          <button
            onClick={onStepForward}
            disabled={currentStepIndex >= totalSteps - 1 || isPlaying}
            className={`p-2.5 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none ${
              isDarkMode ? 'border-slate-800 bg-slate-800 hover:bg-slate-700 text-slate-200' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Step Forward [Right Arrow or S]"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Next Pass (GCSE Exam Core Feature) */}
          <button
            onClick={onNextPass}
            disabled={currentStepIndex >= totalSteps - 1 || isPlaying}
            className={`px-3.5 py-2.5 rounded-xl border font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none ${
              isDarkMode
                ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
            }`}
            title="Advance one full outer loop pass [P]"
          >
            <FastForward className="w-4 h-4" />
            <span>Next Pass</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className={`p-2.5 rounded-xl border text-xs font-semibold transition-colors ${
              isDarkMode ? 'border-slate-800 bg-slate-800 hover:bg-slate-700 text-slate-300' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Reset to beginning of list [R]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Right utility buttons: Audio toggle & Quiz Mode */}
        <div className="flex items-center gap-2">
          {/* Audio Synthesizer Cycler */}
          <button
            onClick={onCycleAudio}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              audioMode === 'muted'
                ? isDarkMode ? 'border-slate-700 bg-slate-800/40 text-slate-400' : 'border-slate-300 bg-slate-100 text-slate-600'
                : isDarkMode ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' : 'border-indigo-300 bg-indigo-50 text-indigo-800'
            }`}
            title="Toggle Synthesizer Sound (Chimes / Clicks / Mute)"
          >
            {audioMode === 'muted' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="capitalize">{audioMode}</span>
          </button>

          {/* Active Recall / Quiz Mode Toggle */}
          <button
            onClick={onToggleQuizMode}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              quizMode
                ? isDarkMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-xs ring-1 ring-amber-500/40' : 'bg-amber-100 text-amber-900 border-amber-400 font-bold ring-1 ring-amber-400'
                : isDarkMode
                ? 'border-slate-800 bg-slate-800 text-slate-400 hover:text-slate-200'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:text-slate-900'
            }`}
            title="Enable Active Recall Quiz Mode"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Quiz Mode: {quizMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Timeline Scrub Bar */}
      <div className="flex flex-col gap-1.5">
        <div className={`flex items-center justify-between text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>
          <span>Step {currentStepIndex} of {Math.max(0, totalSteps - 1)}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max={Math.max(0, totalSteps - 1)}
          value={currentStepIndex}
          onChange={(e) => onScrub(Number(e.target.value))}
          className={`w-full accent-indigo-500 cursor-pointer h-2 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200'}`}
        />
      </div>

      {/* 3. Input Presets & Sliders */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t text-xs ${isDarkMode ? 'border-slate-800/40' : 'border-slate-200'}`}>
        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`font-semibold mr-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Input Presets:</span>
          {[
            { id: 'random', label: 'Random' },
            { id: 'reversed', label: 'Reversed (Worst)' },
            { id: 'nearly_sorted', label: 'Nearly Sorted (Best)' },
            { id: 'few_unique', label: 'Few Unique' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => onPresetChange(p.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activePreset === p.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}

          {/* Custom Array Input Button */}
          <button
            onClick={onOpenCustomModal}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              isDarkMode
                ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold'
            }`}
            title="Type custom comma-separated array for exam questions"
          >
            <Edit3 className="w-3 h-3" />
            <span>Custom Array</span>
          </button>
        </div>

        {/* Sliders: Array Size & Speed */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 sm:justify-end">
          {/* Size slider */}
          <div className="flex items-center gap-2">
            <span className={`whitespace-nowrap min-w-[62px] ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
              Size: <strong className={isDarkMode ? 'text-indigo-400' : 'text-indigo-700 font-bold'}>{arraySize}</strong>
            </span>
            <input
              type="range"
              min="5"
              max="100"
              step="1"
              value={arraySize}
              onChange={(e) => onArraySizeChange(Number(e.target.value))}
              disabled={isPlaying}
              className="w-28 sm:w-36 accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Speed slider */}
          <div className="flex items-center gap-2">
            <span className={`whitespace-nowrap min-w-[105px] ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
              Speed: <strong className={isDarkMode ? 'text-indigo-400' : 'text-indigo-700 font-bold'}>{speed} steps/s</strong>
            </span>
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="w-28 sm:w-36 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
