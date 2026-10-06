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

    // Stable slice mapping: bucket each unique value so duplicates never collide or omit slices
    const sortedValues = [...array].sort((a, b) => a - b);
    const valueSlicesMap = new Map();
    sortedValues.forEach((val, idx) => {
      if (!valueSlicesMap.has(val)) {
        valueSlicesMap.set(val, []);
      }
      valueSlicesMap.get(val).push(idx);
    });

    const valueCounters = new Map();
    const sliceIndices = array.map((val) => {
      const slices = valueSlicesMap.get(val) || [];
      const usedCount = valueCounters.get(val) || 0;
      valueCounters.set(val, usedCount + 1);
      return slices[usedCount % slices.length] ?? 0;
    });

    const activeSet = new Set(activeIndices);

    // 1. Draw sliced image strips
    for (let i = 0; i < n; i++) {
      const sliceIdx = sliceIndices[i];

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
        let tabColor = '#b45309'; // warm amber for compare
        if (stepType === 'swap' || stepType === 'shift') {
          tabColor = '#a82020'; // cardinal red
        } else if (stepType === 'pivot' || stepType === 'key') {
          tabColor = '#1e3a5f'; // oxford navy
        }

        ctx.fillStyle = tabColor;
        // Top indicator tab
        ctx.fillRect(dx, 0, stripWidth, 5);
        // Bottom indicator tab
        ctx.fillRect(dx, height - 5, stripWidth, 5);

        // Active notch triangle at top
        ctx.beginPath();
        ctx.moveTo(dx + stripWidth / 2, 10);
        ctx.lineTo(dx + stripWidth / 2 - 4, 5);
        ctx.lineTo(dx + stripWidth / 2 + 4, 5);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 2. Celebratory perimeter glow when fully sorted
    if (isCompleted) {
      ctx.strokeStyle = '#1a6b3c';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, width - 4, height - 4);
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
        className={`relative w-full h-[360px] sm:h-[420px] rounded-[2px] overflow-hidden flex items-center justify-center transition-all ${
          isCompleted ? 'ring-2 ring-[#1a6b3c] shadow-md' : 'border border-[#ded7c6]'
        } bg-[#1e2229] ${isDragging ? 'ring-2 ring-[#1e3a5f] border-[#1e3a5f]' : ''}`}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Celebratory Completion Banner */}
        {isCompleted && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-[2px] bg-[#edf7f0] border border-[#bbf7d0] text-[#1a6b3c] font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#1a6b3c]" />
            Image Correctly Assembled &amp; Sorted!
          </div>
        )}

        {/* Drag-and-drop overlay hint */}
        {isDragging && (
          <div className="absolute inset-0 bg-[#1e3a5f]/90 flex flex-col items-center justify-center text-white pointer-events-none">
            <Upload className="w-10 h-10 mb-2 text-white animate-pulse" />
            <p className="font-bold text-sm">Drop your image here to scramble &amp; sort!</p>
          </div>
        )}
      </div>

      {/* Image Strip Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#585e6b]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1e2229] flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-[#1e3a5f]" />
            {isCustomImage ? 'Custom Photo Slices' : '80s Synthwave Sunset'}
          </span>
          <span>•</span>
          <span className="font-mono">{array.length} vertical strips</span>
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
            className="px-2.5 py-1 rounded-[2px] bg-[#fdfcf9] border border-[#c2b8a3] hover:border-[#1e3a5f] text-[#1e2229] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            title="Upload any image file"
          >
            <Upload className="w-3 h-3 text-[#1e3a5f]" />
            Upload Picture
          </button>
          {isCustomImage && (
            <button
              onClick={resetToSynthwave}
              className="px-2.5 py-1 rounded-[2px] bg-[#fdfcf9] border border-[#c2b8a3] hover:border-[#1e3a5f] text-[#585e6b] hover:text-[#1e2229] font-medium transition-colors flex items-center gap-1 cursor-pointer"
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
