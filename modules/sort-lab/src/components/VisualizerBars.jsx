import React, { useEffect, useRef, useState } from 'react';

export default function VisualizerBars({
  array = [],
  activeIndices = [],
  sortedIndices = [],
  stepType = 'initial',
  sublistBounds = null,
  isDarkMode = true,
  maxVal = 100,
  className = '',
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const sortedSet = new Set(sortedIndices);
  const activeSet = new Set(activeIndices);

  // ResizeObserver to track container size accurately
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || array.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Use observed dimensions or fallback to bounding client rect
    const rect = container.getBoundingClientRect();
    const width = dimensions.width || Math.floor(rect.width) || 400;
    const height = dimensions.height || Math.floor(rect.height) || 280;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const n = array.length;
    const paddingX = Math.max(8, Math.min(16, width * 0.03));
    const availableWidth = width - paddingX * 2;
    const slotWidth = availableWidth / n;
    const barGap = n > 80 ? 1 : (n > 40 ? 2 : (n > 20 ? 3 : 4));
    const barWidth = Math.max(2, slotWidth - barGap);

    // Dynamic padding so bars stay strictly inside the container
    const paddingTop = 26;
    const paddingBottom = n <= 16 ? 26 : (n <= 35 ? 20 : 10);
    const maxBarHeight = Math.max(15, height - paddingTop - paddingBottom);
    const highest = Math.max(...array, maxVal || 1);

    // 1. Draw sublist bounds highlight (for Merge and Quick sort)
    if (sublistBounds && sublistBounds.left !== undefined && sublistBounds.right !== undefined) {
      const leftX = paddingX + sublistBounds.left * slotWidth;
      const rightX = paddingX + (sublistBounds.right + 1) * slotWidth;
      ctx.fillStyle = isDarkMode ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.06)';
      ctx.strokeStyle = isDarkMode ? 'rgba(129, 140, 248, 0.35)' : 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.fillRect(leftX - 1, paddingTop - 8, rightX - leftX + 2, maxBarHeight + 16);
      ctx.strokeRect(leftX - 1, paddingTop - 8, rightX - leftX + 2, maxBarHeight + 16);
      ctx.setLineDash([]);

      // Label sublist
      ctx.fillStyle = isDarkMode ? '#a5b4fc' : '#4f46e5';
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Subarray [${sublistBounds.left}..${sublistBounds.right}]`, leftX + 2, paddingTop - 12);
    }

    // 2. Draw Bars
    for (let i = 0; i < n; i++) {
      const val = array[i];
      const barHeight = Math.max(6, (val / highest) * maxBarHeight);
      const x = paddingX + i * slotWidth + barGap / 2;
      const y = height - paddingBottom - barHeight;

      const isActive = activeSet.has(i);
      const isSorted = sortedSet.has(i);

      let gradTop = '#4f46e5';
      let gradBottom = '#312e81';
      let glowColor = null;

      if (isActive) {
        if (stepType === 'swap' || stepType === 'shift') {
          // Vibrant coral / red
          gradTop = '#ef4444';
          gradBottom = '#991b1b';
          glowColor = 'rgba(239, 68, 68, 0.7)';
        } else if (stepType === 'pivot' || stepType === 'key') {
          // Orchid purple
          gradTop = '#c084fc';
          gradBottom = '#7e22ce';
          glowColor = 'rgba(192, 132, 252, 0.7)';
        } else {
          // Glowing amber / orange for comparison
          gradTop = '#fbbf24';
          gradBottom = '#b45309';
          glowColor = 'rgba(251, 191, 36, 0.7)';
        }
      } else if (isSorted) {
        // Emerald green
        gradTop = '#34d399';
        gradBottom = '#065f46';
      } else {
        // Base soft steel blue / indigo
        gradTop = isDarkMode ? '#6366f1' : '#4f46e5';
        gradBottom = isDarkMode ? '#312e81' : '#818cf8';
      }

      ctx.save();
      if (glowColor) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
      }

      const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
      grad.addColorStop(0, gradTop);
      grad.addColorStop(1, gradBottom);
      ctx.fillStyle = grad;

      // Rounded bar top
      const radius = Math.min(barWidth / 2, 5);
      ctx.beginPath();
      ctx.moveTo(x, y + barHeight);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + barHeight);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Active pointer marker above bar
      if (isActive) {
        ctx.fillStyle = gradTop;
        ctx.beginPath();
        const markerSize = Math.min(8, barWidth);
        const markerCenterX = x + barWidth / 2;
        const markerY = y - 3;
        ctx.moveTo(markerCenterX, markerY);
        ctx.lineTo(markerCenterX - markerSize / 2, markerY - markerSize);
        ctx.lineTo(markerCenterX + markerSize / 2, markerY - markerSize);
        ctx.closePath();
        ctx.fill();
      }

      // Draw value text inside or above bar only if there is sufficient width
      if (barWidth >= 18) {
        ctx.font = `600 ${barWidth >= 28 ? 12 : 10}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        const textY = barHeight > 24 ? y + 14 : Math.max(10, y - 5);
        ctx.fillStyle = barHeight > 24 ? '#ffffff' : (isDarkMode ? '#e5e7eb' : '#0f172a');
        ctx.fillText(`${val}`, x + barWidth / 2, textY);
      }

      // Index labels at bottom: only when not cramped
      if (n <= 16) {
        ctx.fillStyle = isDarkMode ? '#9ca3af' : '#334155';
        ctx.font = '600 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`[${i}]`, x + barWidth / 2, height - paddingBottom + 15);
      } else if (n <= 35 && (i % 5 === 0 || i === n - 1)) {
        // Show every 5th index and last index cleanly
        ctx.fillStyle = isDarkMode ? '#9ca3af' : '#334155';
        ctx.font = '600 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`[${i}]`, x + barWidth / 2, height - paddingBottom + 13);
      }
    }
  }, [array, activeIndices, sortedIndices, stepType, sublistBounds, isDarkMode, maxVal, dimensions]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-2xl flex items-center justify-center transition-colors ${
        className ? className : 'h-[340px] sm:h-[400px]'
      } ${
        isDarkMode ? 'bg-slate-900/90 border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'
      }`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
