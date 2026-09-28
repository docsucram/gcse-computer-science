import React, { useEffect, useRef, useState } from 'react';
import { generateSynthwaveArt } from '../utils/synthwave';
import { Upload, Image as ImageIcon, RotateCcw, Sparkles } from 'lucide-react';

export default function VisualizerImage({
  array = [],
  activeIndices = [],
  sortedIndices = [],
  stepType = 'initial',
  isCompleted = false,
  isDarkMode = true,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [loadedImg, setLoadedImg] = useState(null);
  const [isCustomImage, setIsCustomImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Track container dimensions with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Load initial synthwave art
  useEffect(() => {
    if (!imageSrc) {
      const defaultArt = generateSynthwaveArt(1200, 700);
      setImageSrc(defaultArt);
    }
  }, [imageSrc]);

  // Load image object whenever source changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setLoadedImg(img);
    };
  }, [imageSrc]);

  // Render sliced strips on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !loadedImg || array.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = dimensions.width || Math.floor(rect.width) || 400;
    const height = dimensions.height || Math.floor(rect.height) || 360;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const n = array.length;
    const stripWidth = width / n;
    const srcStripWidth = loadedImg.width / n;

    // Map each value in array to a slice index [0..n-1]
    const sortedValues = [...array].sort((a, b) => a - b);
    const valueToSliceMap = new Map();
    sortedValues.forEach((val, idx) => {
      if (!valueToSliceMap.has(val)) {
        valueToSliceMap.set(val, idx);
      }
    });

    const activeSet = new Set(activeIndices);

    // 1. Draw sliced image strips
    for (let i = 0; i < n; i++) {
      const val = array[i];
      const sliceIdx = valueToSliceMap.get(val) ?? (val % n);

      const sx = sliceIdx * srcStripWidth;
      const sy = 0;
      const sw = srcStripWidth;
      const sh = loadedImg.height;

      const dx = i * stripWidth;
      const dy = 0;
      const dw = stripWidth + 0.5; // slight overlap to prevent fractional pixel seams
      const dh = height;

      ctx.drawImage(loadedImg, sx, sy, sw, sh, dx, dy, dw, dh);

      // Subtle indicator tabs (top and bottom only, keeping image clean)
      if (activeSet.has(i)) {
        let tabColor = '#fbbf24'; // amber for compare
        if (stepType === 'swap' || stepType === 'shift') {
          tabColor = '#ef4444'; // coral red
        } else if (stepType === 'pivot' || stepType === 'key') {
          tabColor = '#c084fc'; // purple
        }

        ctx.fillStyle = tabColor;
        // Top indicator tab
        ctx.fillRect(dx, 0, stripWidth, 6);
        // Bottom indicator tab
        ctx.fillRect(dx, height - 6, stripWidth, 6);

        // Active notch triangle at top
        ctx.beginPath();
        ctx.moveTo(dx + stripWidth / 2, 12);
        ctx.lineTo(dx + stripWidth / 2 - 4, 6);
        ctx.lineTo(dx + stripWidth / 2 + 4, 6);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 2. Celebratory perimeter glow when fully sorted
    if (isCompleted) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, width - 6, height - 6);
    }
  }, [array, activeIndices, sortedIndices, stepType, isCompleted, loadedImg]);

  const handleFileUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      setIsCustomImage(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const resetToSynthwave = () => {
    const defaultArt = generateSynthwaveArt(1200, 700);
    setImageSrc(defaultArt);
    setIsCustomImage(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Visualizer Canvas Card */}
      <div
        ref={containerRef}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden flex items-center justify-center transition-all ${
          isCompleted ? 'celebration-glow ring-4 ring-emerald-500/80 shadow-2xl' : 'border border-slate-700/50'
        } ${isDarkMode ? 'bg-slate-950' : 'bg-slate-900'} ${isDragging ? 'ring-4 ring-indigo-500 border-indigo-400' : ''}`}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Celebratory Completion Banner */}
        {isCompleted && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-emerald-500/90 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg backdrop-blur-sm animate-bounce">
            <Sparkles className="w-4 h-4" />
            Image Assembled & Sorted!
          </div>
        )}

        {/* Drag-and-drop overlay hint */}
        {isDragging && (
          <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white pointer-events-none">
            <Upload className="w-12 h-12 mb-2 text-indigo-400 animate-pulse" />
            <p className="font-bold text-lg">Drop your image here to scramble & sort!</p>
          </div>
        )}
      </div>

      {/* Image Strip Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
            {isCustomImage ? 'Custom Photo Slices' : '80s Synthwave Sunset'}
          </span>
          <span>•</span>
          <span>{array.length} vertical strips</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files?.[0])}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-medium transition-colors flex items-center gap-1"
            title="Upload any family photo, pet, or wallpaper"
          >
            <Upload className="w-3 h-3" />
            Upload Picture
          </button>
          {isCustomImage && (
            <button
              onClick={resetToSynthwave}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition-colors flex items-center gap-1"
              title="Reset back to default Synthwave artwork"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Art
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
