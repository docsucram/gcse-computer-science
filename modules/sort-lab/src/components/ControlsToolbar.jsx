import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  RotateCcw,
  Volume2,
  VolumeX,
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
}) {
  const progressPercent = totalSteps > 1 ? (currentStepIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="bg-[#fdfcf9] border border-[#ded7c6] rounded-[2px] p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-3.5 transition-colors">
      {/* 1. Main Playback Buttons & Action Cluster */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Playback Button Group */}
        <div className="flex items-center gap-2">
          {/* Step Back */}
          <button
            onClick={onStepBack}
            disabled={currentStepIndex <= 0 || isPlaying}
            className="p-2 rounded-[2px] border border-[#c2b8a3] bg-[#fdfcf9] text-[#1e2229] hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            title="Step Back [Left Arrow]"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={onTogglePlay}
            className="px-4 py-2 rounded-[2px] bg-[#1e3a5f] hover:bg-[#152b47] text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            title="Play / Pause [Spacebar]"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Step Forward */}
          <button
            onClick={onStepForward}
            disabled={currentStepIndex >= totalSteps - 1 || isPlaying}
            className="p-2 rounded-[2px] border border-[#c2b8a3] bg-[#fdfcf9] text-[#1e2229] hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            title="Step Forward [Right Arrow or S]"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Next Pass (GCSE Exam Core Feature) */}
          <button
            onClick={onNextPass}
            disabled={currentStepIndex >= totalSteps - 1 || isPlaying}
            className="px-3 py-2 rounded-[2px] border border-[#bbf7d0] bg-[#edf7f0] hover:bg-[#dcfce7] text-[#1a6b3c] font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            title="Advance one full outer loop pass [P]"
          >
            <FastForward className="w-4 h-4" />
            <span>Next Pass</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-2 rounded-[2px] border border-[#c2b8a3] bg-[#fdfcf9] text-[#585e6b] hover:text-[#1e2229] hover:border-[#1e3a5f] transition-all cursor-pointer"
            title="Reset to beginning of list [R]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Right utility buttons: Audio & Quiz Mode */}
        <div className="flex items-center gap-2">
          {/* Audio Synthesizer Cycler */}
          <button
            onClick={onCycleAudio}
            className={`px-2.5 py-1.5 rounded-[2px] border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              audioMode === 'off'
                ? 'border-[#c2b8a3] bg-[#fdfcf9] text-[#8e95a2] hover:text-[#1e2229]'
                : 'border-[#1e3a5f] bg-[#edf3f9] text-[#1e3a5f] font-bold'
            }`}
            title="Toggle Synthesizer Sound (Chimes / Clicks / Mute)"
          >
            {audioMode === 'off' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#1e3a5f]" />}
            <span className="capitalize">{audioMode}</span>
          </button>

          {/* Active Recall / Quiz Mode Toggle */}
          <button
            onClick={onToggleQuizMode}
            className={`px-2.5 py-1.5 rounded-[2px] border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              quizMode
                ? 'bg-[#fef3c7] text-[#78350f] border-[#fde68a] font-bold'
                : 'border-[#c2b8a3] bg-[#fdfcf9] text-[#585e6b] hover:text-[#1e2229]'
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
        <div className="flex items-center justify-between text-xs font-mono text-[#585e6b]">
          <span>Step <strong>{currentStepIndex}</strong> of {Math.max(0, totalSteps - 1)}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max={Math.max(0, totalSteps - 1)}
          value={currentStepIndex}
          onChange={(e) => onScrub(Number(e.target.value))}
          className="w-full accent-[#1e3a5f] cursor-pointer h-1.5 rounded-[2px] bg-[#ede8db]"
        />
      </div>

      {/* 3. Input Presets & Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-3 border-t border-[#ded7c6] text-xs">
        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-[#585e6b] mr-1">Presets:</span>
          {[
            { id: 'random', label: 'Random' },
            { id: 'reversed', label: 'Reversed (Worst)' },
            { id: 'nearly_sorted', label: 'Nearly Sorted (Best)' },
            { id: 'few_unique', label: 'Few Unique' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => onPresetChange(p.id)}
              className={`px-2.5 py-1 rounded-[2px] font-semibold transition-colors cursor-pointer border ${
                activePreset === p.id
                  ? 'bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-2xs'
                  : 'bg-[#fdfcf9] text-[#1e2229] border-[#c2b8a3] hover:border-[#1e3a5f]'
              }`}
            >
              {p.label}
            </button>
          ))}

          {/* Custom Array Input Button */}
          <button
            onClick={onOpenCustomModal}
            className="px-2.5 py-1 rounded-[2px] font-semibold transition-colors flex items-center gap-1 bg-[#edf3f9] text-[#1e3a5f] border border-[#cbd5e1] hover:bg-[#dbeafe] cursor-pointer"
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
            <span className="whitespace-nowrap min-w-[62px] text-[#585e6b] font-medium">
              Size: <strong className="text-[#1e3a5f] font-mono font-bold">{arraySize}</strong>
            </span>
            <input
              type="range"
              min="5"
              max="100"
              step="1"
              value={arraySize}
              onChange={(e) => onArraySizeChange(Number(e.target.value))}
              disabled={isPlaying}
              className="w-24 sm:w-32 accent-[#1e3a5f] cursor-pointer"
            />
          </div>

          {/* Speed slider */}
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap min-w-[105px] text-[#585e6b] font-medium">
              Speed: <strong className="text-[#1e3a5f] font-mono font-bold">{speed} steps/s</strong>
            </span>
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="w-24 sm:w-32 accent-[#1e3a5f] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
