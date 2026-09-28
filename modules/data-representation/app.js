/**
 * GCSE Data Representation & Bitmaps Module Logic
 * Pure Vanilla JavaScript (ES6+) - Zero build tools required
 * Full AQA 8525 §3.3.3 & §3.3.4 alignment
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. PALETTES & HIGH-FIDELITY PRESET DATA
  // =========================================================================

  const PALETTES = {
    1: [
      { hex: '#000000', bin: '0', name: 'Black' },
      { hex: '#ffffff', bin: '1', name: 'White' },
    ],
    2: [
      { hex: '#0f380f', bin: '00', name: 'Darkest Green' },
      { hex: '#306230', bin: '01', name: 'Dark Green' },
      { hex: '#8bac0f', bin: '10', name: 'Light Green' },
      { hex: '#9bbc0f', bin: '11', name: 'Lightest Green' },
    ],
    4: [
      { hex: '#000000', bin: '0000', name: 'Black' },
      { hex: '#0000aa', bin: '0001', name: 'Blue' },
      { hex: '#00aa00', bin: '0010', name: 'Green' },
      { hex: '#00aaaa', bin: '0011', name: 'Cyan' },
      { hex: '#aa0000', bin: '0100', name: 'Red' },
      { hex: '#aa00aa', bin: '0101', name: 'Magenta' },
      { hex: '#aa5500', bin: '0110', name: 'Brown' },
      { hex: '#aaaaaa', bin: '0111', name: 'Light Gray' },
      { hex: '#555555', bin: '1000', name: 'Dark Gray' },
      { hex: '#5555ff', bin: '1001', name: 'Bright Blue' },
      { hex: '#55ff55', bin: '1010', name: 'Bright Green' },
      { hex: '#55ffff', bin: '1011', name: 'Bright Cyan' },
      { hex: '#ff5555', bin: '1100', name: 'Bright Red' },
      { hex: '#ff55ff', bin: '1101', name: 'Bright Magenta' },
      { hex: '#ffff55', bin: '1110', name: 'Yellow' },
      { hex: '#ffffff', bin: '1111', name: 'White' },
    ],
    8: generate256Palette(),
  };

  /**
   * Generates a standard Xterm/VGA 256-colour palette:
   * - Indices 0-15: The exact 16 standard EGA/VGA colours matching 4-bit mode
   * - Indices 16-231: 6x6x6 RGB colour cube (216 vibrant shades)
   * - Indices 232-255: 24 grayscale steps from dark to light
   */
  function generate256Palette() {
    const list = [];

    // 1. First 16 entries match the standard 4-bit VGA palette exactly
    const base16 = [
      { hex: '#000000', name: 'Black' },
      { hex: '#0000aa', name: 'Blue' },
      { hex: '#00aa00', name: 'Green' },
      { hex: '#00aaaa', name: 'Cyan' },
      { hex: '#aa0000', name: 'Red' },
      { hex: '#aa00aa', name: 'Magenta' },
      { hex: '#aa5500', name: 'Brown' },
      { hex: '#aaaaaa', name: 'Light Gray' },
      { hex: '#555555', name: 'Dark Gray' },
      { hex: '#5555ff', name: 'Bright Blue' },
      { hex: '#55ff55', name: 'Bright Green' },
      { hex: '#55ffff', name: 'Bright Cyan' },
      { hex: '#ff5555', name: 'Bright Red' },
      { hex: '#ff55ff', name: 'Bright Magenta' },
      { hex: '#ffff55', name: 'Yellow' },
      { hex: '#ffffff', name: 'White' },
    ];
    base16.forEach((c, i) => {
      list.push({ hex: c.hex, bin: i.toString(2).padStart(8, '0'), name: c.name });
    });

    // 2. 6x6x6 RGB colour cube (216 colours)
    const steps = [0, 51, 102, 153, 204, 255];
    for (let r of steps) {
      for (let g of steps) {
        for (let b of steps) {
          const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
          const i = list.length;
          list.push({ hex, bin: i.toString(2).padStart(8, '0'), name: `RGB(${r},${g},${b})` });
        }
      }
    }

    // 3. 24 Grayscale ramp levels from 8 to 238
    for (let g = 0; g < 24; g++) {
      const v = Math.round(8 + g * 10);
      const hex = '#' + [v, v, v].map(x => x.toString(16).padStart(2, '0')).join('');
      const i = list.length;
      list.push({ hex, bin: i.toString(2).padStart(8, '0'), name: `Gray ${g + 1}` });
    }

    return list.slice(0, 256);
  }

  // Helper: Hex string to RGB components
  function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  // Helper: Find closest palette index by Euclidean distance or Luminance
  function getClosestPaletteIndex(r, g, b, depth) {
    const palette = PALETTES[depth];
    if (depth === 1) {
      // Luminance threshold
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      return y >= 128 ? 1 : 0;
    }
    if (depth === 2) {
      // Game Boy 4 shades based on brightness
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      if (y < 64) return 0;
      if (y < 128) return 1;
      if (y < 192) return 2;
      return 3;
    }

    let bestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < palette.length; i++) {
      const c = hexToRgb(palette[i].hex);
      const dr = r - c.r;
      const dg = g - c.g;
      const db = b - c.b;
      // Perceptual weighting: human eye is more sensitive to green
      const dist = 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
      if (dist < minDiff) {
        minDiff = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  // =========================================================================
  // HIGH-RESOLUTION VIBRANT 16x16 PRESETS (Master 24-bit True RGB)
  // Each sprite has rich gradients, shading, and highlights that display
  // vividly in 8-bit, simplify down in 4-bit/2-bit/1-bit, and restore seamlessly!
  // =========================================================================

  const K = '#000000'; // Background

  const PRESETS_HIGHRES = {
    rainbow: [
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,
      K,K,K,'#ff1744','#ff1744','#ff1744','#ff1744','#ff1744','#ff1744','#ff1744','#ff1744','#ff1744','#ff1744',K,K,K,
      K,K,'#ff1744','#ff1744','#ff9100','#ff9100','#ff9100','#ff9100','#ff9100','#ff9100','#ff9100','#ff9100','#ff1744','#ff1744',K,K,
      K,'#ff1744','#ff9100','#ff9100','#ffea00','#ffea00','#ffea00','#ffea00','#ffea00','#ffea00','#ffea00','#ffea00','#ff9100','#ff9100','#ff1744',K,
      K,'#ff1744','#ff9100','#ffea00','#00e676','#00e676','#00e676','#00e676','#00e676','#00e676','#00e676','#00e676','#ffea00','#ff9100','#ff1744',K,
      '#ff1744','#ff9100','#ffea00','#00e676','#00e5ff','#00e5ff','#00e5ff','#00e5ff','#00e5ff','#00e5ff','#00e5ff','#00e5ff','#00e676','#ffea00','#ff9100','#ff1744',
      '#ff1744','#ff9100','#ffea00','#00e676','#00e5ff','#2979ff','#2979ff','#2979ff','#2979ff','#2979ff','#2979ff','#00e5ff','#00e676','#ffea00','#ff9100','#ff1744',
      '#ff1744','#ff9100','#ffea00','#00e676','#00e5ff','#2979ff','#d500f9','#d500f9','#d500f9','#d500f9','#2979ff','#00e5ff','#00e676','#ffea00','#ff9100','#ff1744',
      '#ff1744','#ff9100','#ffea00','#00e676','#00e5ff','#2979ff','#d500f9',K,K,'#d500f9','#2979ff','#00e5ff','#00e676','#ffea00','#ff9100','#ff1744',
      '#ff1744','#ff9100','#ffea00','#00e676','#00e5ff','#2979ff','#d500f9',K,K,'#d500f9','#2979ff','#00e5ff','#00e676','#ffea00','#ff9100','#ff1744',
      K,'#ffffff','#ffffff',K,K,K,K,K,K,K,K,K,K,'#ffffff','#ffffff',K,
      '#ffffff','#ffffff','#ffffff','#ffffff',K,K,K,K,K,K,K,K,'#ffffff','#ffffff','#ffffff','#ffffff',
      '#ffffff','#f1f5f9','#cbd5e1','#ffffff','#ffffff',K,K,K,K,K,K,'#ffffff','#ffffff','#cbd5e1','#f1f5f9','#ffffff',
      K,'#cbd5e1','#94a3b8','#cbd5e1',K,K,K,K,K,K,K,K,'#cbd5e1','#94a3b8','#cbd5e1',K,
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K
    ],
    heart: [
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,
      K,K,'#88001b','#88001b','#88001b',K,K,K,K,K,'#88001b','#88001b','#88001b',K,K,K,
      K,'#88001b','#ef4444','#ef4444','#ef4444','#88001b',K,K,K,'#88001b','#ef4444','#ef4444','#ef4444','#88001b',K,K,
      '#88001b','#ef4444','#ffffff','#f87171','#ef4444','#ef4444','#88001b',K,'#88001b','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#88001b',K,
      '#88001b','#ef4444','#ffffff','#ef4444','#ef4444','#ef4444','#ef4444','#88001b','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#dc2626','#88001b',K,
      '#88001b','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#dc2626','#dc2626','#88001b',K,
      '#88001b','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#dc2626','#dc2626','#b91c1c','#88001b',K,
      K,'#88001b','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#dc2626','#dc2626','#b91c1c','#88001b',K,K,
      K,K,'#88001b','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#dc2626','#dc2626','#b91c1c','#88001b',K,K,K,
      K,K,K,'#88001b','#ef4444','#ef4444','#ef4444','#ef4444','#dc2626','#dc2626','#b91c1c','#88001b',K,K,K,K,
      K,K,K,K,'#88001b','#ef4444','#ef4444','#dc2626','#dc2626','#b91c1c','#88001b',K,K,K,K,K,
      K,K,K,K,K,'#88001b','#ef4444','#dc2626','#b91c1c','#88001b',K,K,K,K,K,K,
      K,K,K,K,K,K,'#88001b','#dc2626','#88001b',K,K,K,K,K,K,K,
      K,K,K,K,K,K,K,'#88001b',K,K,K,K,K,K,K,K,
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K
    ],
    sword: [
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,'#0891b2','#ffffff',
      K,K,K,K,K,K,K,K,K,K,K,K,K,'#0891b2','#ffffff','#22d3ee',
      K,K,K,K,K,K,K,K,K,K,K,K,'#0891b2','#ffffff','#22d3ee',K,
      K,K,K,K,K,K,K,K,K,K,K,'#0891b2','#ffffff','#22d3ee',K,K,
      K,K,K,K,K,K,K,K,K,K,'#0891b2','#ffffff','#22d3ee',K,K,K,
      K,K,K,K,K,K,K,K,K,'#0891b2','#ffffff','#22d3ee',K,K,K,K,
      K,K,K,K,K,K,K,K,'#0891b2','#ffffff','#22d3ee',K,K,K,K,K,
      K,K,K,K,K,K,K,'#0891b2','#ffffff','#22d3ee',K,K,K,K,K,K,
      K,K,K,K,K,'#d97706','#b45309','#ffffff','#0891b2',K,K,K,K,K,K,K,
      K,K,K,K,'#f59e0b','#78350f','#b45309','#0891b2',K,K,K,K,K,K,K,K,
      K,K,K,'#f59e0b','#78350f','#78350f','#b45309',K,K,K,K,K,K,K,K,K,
      K,K,'#f59e0b','#78350f','#78350f','#f59e0b',K,K,K,K,K,K,K,K,K,K,
      K,'#b45309','#78350f','#78350f','#f59e0b',K,K,K,K,K,K,K,K,K,K,K,
      '#b45309','#78350f','#78350f','#b45309',K,K,K,K,K,K,K,K,K,K,K,K,
      '#0891b2','#0891b2','#0891b2',K,K,K,K,K,K,K,K,K,K,K,K,K,
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K
    ],
    mushroom: [
      K,K,K,K,K,'#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444',K,K,K,K,K,
      K,K,K,'#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444','#ef4444',K,K,K,
      K,K,'#ef4444','#ef4444','#ffffff','#ffffff','#ef4444','#ef4444','#ef4444','#ef4444','#ffffff','#ffffff','#ef4444','#ef4444',K,K,
      K,'#ef4444','#ef4444','#ffffff','#ffffff','#ffffff','#ffffff','#ef4444','#ef4444','#ffffff','#ffffff','#ffffff','#ffffff','#ef4444','#ef4444',K,
      K,'#ef4444','#ef4444','#ffffff','#ffffff','#ffffff','#ffffff','#ef4444','#ef4444','#ffffff','#ffffff','#ffffff','#ffffff','#ef4444','#ef4444',K,
      '#ef4444','#ef4444','#ef4444','#ef4444','#ffffff','#ffffff','#ef4444','#ef4444','#ef4444','#ef4444','#ffffff','#ffffff','#ef4444','#ef4444','#ef4444','#ef4444',
      '#ef4444','#ffffff','#ffffff','#ef4444','#ef4444','#ef4444','#ef4444','#ffffff','#ffffff','#ef4444','#ef4444','#ef4444','#ef4444','#ffffff','#ffffff','#ef4444',
      '#ef4444','#ffffff','#ffffff','#ef4444','#ef4444','#ef4444','#ffffff','#ffffff','#ffffff','#ffffff','#ef4444','#ef4444','#ef4444','#ffffff','#ffffff','#ef4444',
      '#991b1b','#991b1b','#991b1b','#991b1b','#991b1b','#991b1b','#ffffff','#ffffff','#ffffff','#ffffff','#991b1b','#991b1b','#991b1b','#991b1b','#991b1b','#991b1b',
      K,'#991b1b','#991b1b','#991b1b','#991b1b','#991b1b','#991b1b','#991b1b','#991b1b','#991b1b','#991b1b','#991b1b','#991b1b','#991b1b','#991b1b',K,
      K,K,K,'#fef3c7','#fef3c7','#fef3c7','#fef3c7','#fef3c7','#fef3c7','#fef3c7','#fef3c7','#fef3c7','#fef3c7',K,K,K,
      K,K,K,'#fef3c7','#fef3c7',K,'#fef3c7','#fef3c7','#fef3c7','#fef3c7',K,'#fef3c7','#fef3c7',K,K,K,
      K,K,K,'#fef3c7','#fef3c7',K,'#fef3c7','#fef3c7','#fef3c7','#fef3c7',K,'#fef3c7','#fef3c7',K,K,K,
      K,K,K,'#fde68a','#fde68a','#fde68a','#fde68a','#fde68a','#fde68a','#fde68a','#fde68a','#fde68a','#fde68a',K,K,K,
      K,K,K,K,'#d97706','#d97706','#d97706','#d97706','#d97706','#d97706','#d97706','#d97706',K,K,K,K,
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K
    ],
    pizza: [
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,
      K,K,'#d97706','#d97706','#d97706','#d97706','#d97706','#d97706','#d97706','#d97706','#d97706','#d97706','#d97706','#d97706',K,K,
      K,K,'#b45309','#b45309','#b45309','#b45309','#b45309','#b45309','#b45309','#b45309','#b45309','#b45309','#b45309','#b45309',K,K,
      K,K,K,'#dc2626','#fbbf24','#fbbf24','#fbbf24','#fbbf24','#fbbf24','#fbbf24','#fbbf24','#fbbf24','#dc2626',K,K,K,
      K,K,K,'#dc2626','#fbbf24','#b91c1c','#b91c1c','#fbbf24','#fbbf24','#b91c1c','#b91c1c','#fbbf24','#dc2626',K,K,K,
      K,K,K,K,'#fbbf24','#b91c1c','#b91c1c','#fbbf24','#fbbf24','#b91c1c','#b91c1c','#fbbf24',K,K,K,K,
      K,K,K,K,'#fbbf24','#fbbf24','#fbbf24',K,'#fbbf24','#fbbf24','#fbbf24','#fbbf24',K,K,K,K,
      K,K,K,K,K,'#fbbf24','#fbbf24','#fbbf24','#fbbf24','#fbbf24','#fbbf24',K,K,K,K,K,
      K,K,K,K,K,'#fbbf24','#b91c1c','#b91c1c','#fbbf24','#fbbf24',K,K,K,K,K,K,
      K,K,K,K,K,K,'#b91c1c','#b91c1c','#fbbf24','#fbbf24',K,K,K,K,K,K,
      K,K,K,K,K,K,'#fbbf24','#fbbf24','#fbbf24',K,K,K,K,K,K,K,
      K,K,K,K,K,K,K,'#fbbf24','#fbbf24',K,K,K,K,K,K,K,
      K,K,K,K,K,K,K,'#fbbf24',K,K,K,K,K,K,K,K,
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K
    ],
    alien: [
      K,K,K,K,K,K,'#34d399',K,K,'#34d399',K,K,K,K,K,K,
      K,K,K,'#34d399',K,K,'#34d399',K,K,'#34d399',K,K,'#34d399',K,K,K,
      K,K,K,K,'#10b981','#10b981','#10b981','#10b981','#10b981','#10b981','#10b981','#10b981',K,K,K,K,
      K,K,K,'#10b981','#10b981','#10b981','#10b981','#10b981','#10b981','#10b981','#10b981','#10b981','#10b981',K,K,K,
      K,K,'#10b981','#10b981','#fef08a','#fef08a','#10b981','#10b981','#10b981','#10b981','#fef08a','#fef08a','#10b981','#10b981',K,K,
      K,K,'#10b981','#10b981','#fef08a',K,'#10b981','#10b981','#10b981','#10b981',K,'#fef08a','#10b981','#10b981',K,K,
      K,K,'#10b981','#10b981','#10b981','#10b981','#10b981','#10b981','#10b981','#10b981','#10b981','#10b981','#10b981','#10b981',K,K,
      K,K,K,'#10b981','#10b981','#10b981','#047857','#047857','#047857','#047857','#10b981','#10b981','#10b981',K,K,K,
      K,K,K,K,'#10b981','#10b981','#10b981','#10b981','#10b981','#10b981','#10b981','#10b981',K,K,K,K,
      K,K,K,'#10b981','#059669','#059669','#059669','#059669','#059669','#059669','#059669','#059669','#10b981',K,K,K,
      K,K,'#10b981','#10b981','#059669','#059669','#059669','#059669','#059669','#059669','#059669','#059669','#10b981','#10b981',K,K,
      K,'#10b981','#10b981',K,'#059669','#059669','#059669','#059669','#059669','#059669','#059669','#059669',K,'#10b981','#10b981',K,
      K,'#10b981',K,K,'#10b981','#10b981',K,K,K,K,'#10b981','#10b981',K,K,'#10b981',K,
      K,K,K,K,'#10b981','#10b981',K,K,K,K,'#10b981','#10b981',K,K,K,K,
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K
    ],
    cat: [
      K,K,'#c2410c',K,K,K,K,K,K,K,K,K,K,'#c2410c',K,K,
      K,'#c2410c','#f472b6','#c2410c',K,K,K,K,K,K,K,K,'#c2410c','#f472b6','#c2410c',K,
      '#c2410c','#f472b6','#f472b6','#f472b6','#c2410c',K,K,K,K,K,K,'#c2410c','#f472b6','#f472b6','#f472b6','#c2410c',
      '#c2410c','#f472b6','#f472b6','#f472b6','#c2410c','#f97316','#f97316','#f97316','#f97316','#f97316','#f97316','#c2410c','#f472b6','#f472b6','#f472b6','#c2410c',
      '#c2410c','#f97316','#f97316','#f97316','#f97316','#fef08a','#fef08a','#f97316','#f97316','#fef08a','#fef08a','#f97316','#f97316','#f97316','#f97316','#c2410c',
      '#c2410c','#f97316','#f97316','#f97316','#fef08a','#84cc16','#84cc16','#f97316','#f97316','#84cc16','#84cc16','#fef08a','#f97316','#f97316','#f97316','#c2410c',
      '#c2410c','#f97316','#f97316','#f97316','#f97316','#f97316','#f97316','#f97316','#f97316','#f97316','#f97316','#f97316','#f97316','#f97316','#f97316','#c2410c',
      '#c2410c','#f97316','#f97316','#f97316',K,'#f97316','#f97316','#f472b6','#f472b6','#f97316','#f97316',K,'#f97316','#f97316','#f97316','#c2410c',
      '#c2410c',K,K,'#c2410c','#f97316','#f97316','#ffffff','#ffffff','#f97316','#f97316','#c2410c',K,K,'#c2410c','#f97316','#c2410c',
      K,K,K,'#c2410c','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#c2410c',K,K,K,K,K,
      K,K,K,'#c2410c','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#c2410c',K,K,K,K,K,
      K,K,K,K,'#c2410c','#c2410c','#ffffff','#ffffff','#c2410c','#c2410c',K,K,K,K,K,K,
      K,K,K,K,'#c2410c','#c2410c','#ffffff','#ffffff','#c2410c','#c2410c',K,K,K,K,K,K,
      K,K,K,'#c2410c','#c2410c','#c2410c','#ffffff','#ffffff','#c2410c','#c2410c','#c2410c',K,K,K,K,K,
      K,K,'#c2410c','#c2410c',K,'#c2410c','#ffffff','#ffffff','#c2410c',K,'#c2410c','#c2410c',K,K,K,K,
      K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K
    ]
  };

  PRESETS_HIGHRES.invader = PRESETS_HIGHRES.alien;

  // =========================================================================
  // 2. STATE MANAGEMENT
  // =========================================================================

  let state = {
    gridSize: 16, // 8 or 16
    colourDepth: 4, // 1, 2, 4, 8
    selectedColorIndex: 1, // index in current palette
    activeTool: 'paint', // 'paint' | 'eraser' | 'fill'
    includeMetadata: false,
    gridData: [], // 1D array of palette indices in active palette
    masterPixels: [], // 1D array of { r, g, b, hex, isUserModified } for non-destructive reversible depth conversion!
    isMouseDown: false,
  };

  // Sound Sampling State (AQA §3.3.4)
  let soundState = {
    sampleRate: 8, // 4, 8, 16, 32 Hz (visual sampling frequency)
    bitDepth: 3, // 1, 2, 3, 4 bits (quantization resolution)
    waveform: 'flute', // 'flute' | 'chiptune' | 'bass' | 'robot' | 'custom'
    duration: 10, // seconds for calculation
    channels: 1, // 1 mono, 2 stereo
    isPlaying: false,
    audioCtx: null,
    customWavePoints: [], // Array of amplitude points in [-1, 1]
    playheadRatio: -1, // Normalized progress 0.0 to 1.0 during playback
    playheadAnimId: null,
    isDrawingWave: false,
  };

  // Dedicated Photo Colour Depth Lab State
  let photoLabState = {
    currentSample: 'sunset', // 'sunset' | 'parrot' | 'car' | 'dog' | 'custom'
    depth: 8, // 1, 2, 4, 8, 16, 24 bits
    dithering: false,
    width: 800,
    height: 560,
    aspectName: '16:9 Landscape',
    originalData: null,
    isPeeking: false,
  };

  // Dedicated Voice & Microphone Degradation Lab State
  let voiceLabState = {
    sampleRate: 44100, // 44100, 11025, 8000, 2500
    bitDepth: 16,      // 16, 8, 4, 2, 1
    preset: 'speech',  // 'speech' | 'drum' | 'mic'
    isRecording: false,
    isPlaying: false,
    audioCtx: null,
    sourceBuffer: null, // Float32Array 2.0s audio buffer at 44100Hz
    processedBuffer: null,
    playheadAnimId: null,
    playheadRatio: -1,
  };

  // Initialize default grid data
  function initGridData() {
    state.gridData = new Array(state.gridSize * state.gridSize).fill(0);
    applyPreset('rainbow');
  }

  // =========================================================================
  // 3. DOM ELEMENTS CACHE
  // =========================================================================

  const DOM = {
    // Theme
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    sunIcon: document.getElementById('sunIcon'),
    moonIcon: document.getElementById('moonIcon'),

    // Tabs
    tabButtons: document.querySelectorAll('.view-tab-btn'),
    tabViews: document.querySelectorAll('.tab-view'),

    // Visualizer Controls
    gridSizeSelect: document.getElementById('gridSizeSelect'),
    depthButtons: document.querySelectorAll('.depth-btn'),
    toolPaintBtn: document.getElementById('toolPaintBtn'),
    toolEraserBtn: document.getElementById('toolEraserBtn'),
    toolFillBtn: document.getElementById('toolFillBtn'),
    presetButtons: document.querySelectorAll('.preset-btn'),
    paletteContainer: document.getElementById('paletteContainer'),
    activePaletteInfo: document.getElementById('activePaletteInfo'),
    pixelGrid: document.getElementById('pixelGrid'),
    cellCoordIndicator: document.getElementById('cellCoordIndicator'),
    cellColorIndicator: document.getElementById('cellColorIndicator'),

    // Inspector
    metricDimensions: document.getElementById('metricDimensions'),
    metricPixels: document.getElementById('metricPixels'),
    metricDepth: document.getElementById('metricDepth'),
    metricColors: document.getElementById('metricColors'),
    metricRawBits: document.getElementById('metricRawBits'),
    metricRawBytes: document.getElementById('metricRawBytes'),
    metricKb: document.getElementById('metricKb'),
    metricKib: document.getElementById('metricKib'),
    formulaStep1: document.getElementById('formulaStep1'),
    formulaStep2: document.getElementById('formulaStep2'),
    formulaStep3: document.getElementById('formulaStep3'),
    formulaStep4: document.getElementById('formulaStep4'),
    metadataToggle: document.getElementById('metadataToggle'),
    metadataBreakdown: document.getElementById('metadataBreakdown'),
    metaWidthVal: document.getElementById('metaWidthVal'),
    metaHeightVal: document.getElementById('metaHeightVal'),
    metaDepthVal: document.getElementById('metaDepthVal'),
    finalTotalDisplay: document.getElementById('finalTotalDisplay'),
    finalUnitBadge: document.getElementById('finalUnitBadge'),

    // Streams
    binaryStreamOutput: document.getElementById('binaryStreamOutput'),
    streamByteCount: document.getElementById('streamByteCount'),
    copyBinaryBtn: document.getElementById('copyBinaryBtn'),
    rleStreamOutput: document.getElementById('rleStreamOutput'),
    rleStatusBadge: document.getElementById('rleStatusBadge'),
    rleRatioDisplay: document.getElementById('rleRatioDisplay'),
    rleMeterFill: document.getElementById('rleMeterFill'),
    rleOriginalBits: document.getElementById('rleOriginalBits'),
    rleCompressedBits: document.getElementById('rleCompressedBits'),

    // Dedicated Photo Colour Depth Lab (Single Large Display)
    photoCanvasLarge: document.getElementById('photoCanvasLarge'),
    photoAspectBadge: document.getElementById('photoAspectBadge'),
    btnPeekOriginal: document.getElementById('btnPeekOriginal'),
    photoSampleButtons: document.querySelectorAll('.photo-sample-btn'),
    photoDepthButtons: document.querySelectorAll('.photo-depth-btn'),
    photoDitherToggle: document.getElementById('photoDitherToggle'),
    photoLabUploadBtn: document.getElementById('photoLabUploadBtn'),
    photoLabFileInput: document.getElementById('photoLabFileInput'),
    photoOriginalDim: document.getElementById('photoOriginalDim'),
    photoOriginalSize: document.getElementById('photoOriginalSize'),
    photoQuantBadge: document.getElementById('photoQuantBadge'),
    photoQuantBandingNote: document.getElementById('photoQuantBandingNote'),
    photoQuantSize: document.getElementById('photoQuantSize'),
    photoTableDimensions: document.getElementById('photoTableDimensions'),
    photoComparisonTableBody: document.getElementById('photoComparisonTableBody'),

    // Comparison Mode
    compareSubjectSelect: document.getElementById('compareSubjectSelect'),
    compareResA: document.getElementById('compareResA'),
    compareDepthA: document.getElementById('compareDepthA'),
    compareCanvasA: document.getElementById('compareCanvasA'),
    comparePixelsA: document.getElementById('comparePixelsA'),
    compareColoursA: document.getElementById('compareColoursA'),
    compareBytesA: document.getElementById('compareBytesA'),
    compareBitsA: document.getElementById('compareBitsA'),

    compareResB: document.getElementById('compareResB'),
    compareDepthB: document.getElementById('compareDepthB'),
    compareCanvasB: document.getElementById('compareCanvasB'),
    comparePixelsB: document.getElementById('comparePixelsB'),
    compareColoursB: document.getElementById('compareColoursB'),
    compareBytesB: document.getElementById('compareBytesB'),
    compareBitsB: document.getElementById('compareBitsB'),

    speedButtons: document.querySelectorAll('.speed-btn'),
    simulateTransferBtn: document.getElementById('simulateTransferBtn'),
    transferTimeA: document.getElementById('transferTimeA'),
    transferTimeB: document.getElementById('transferTimeB'),
    transferBarA: document.getElementById('transferBarA'),
    transferBarB: document.getElementById('transferBarB'),

    // Sound Sampling
    soundWaveCanvas: document.getElementById('soundWaveCanvas'),
    soundRateButtons: document.querySelectorAll('.sound-rate-btn'),
    soundDepthButtons: document.querySelectorAll('.sound-depth-btn'),
    soundWaveButtons: document.querySelectorAll('.sound-wave-btn'),
    btnPlaySound: document.getElementById('btnPlaySound'),
    soundDurationInput: document.getElementById('soundDurationInput'),
    soundDurationLabel: document.getElementById('soundDurationLabel'),
    soundChannelButtons: document.querySelectorAll('.sound-channel-btn'),
    soundPlayheadStatus: document.getElementById('soundPlayheadStatus'),
    metricSoundRate: document.getElementById('metricSoundRate'),
    metricSoundDepth: document.getElementById('metricSoundDepth'),
    metricSoundBits: document.getElementById('metricSoundBits'),
    metricSoundBytes: document.getElementById('metricSoundBytes'),
    soundKbVal: document.getElementById('soundKbVal'),
    soundKibVal: document.getElementById('soundKibVal'),

    // Voice & Microphone Degradation Lab
    btnRecordVoice: document.getElementById('btnRecordVoice'),
    recordMicIcon: document.getElementById('recordMicIcon'),
    recordVoiceText: document.getElementById('recordVoiceText'),
    btnPlayVoice: document.getElementById('btnPlayVoice'),
    voicePresetButtons: document.querySelectorAll('.voice-preset-btn'),
    voiceRateButtons: document.querySelectorAll('.voice-rate-btn'),
    voiceDepthButtons: document.querySelectorAll('.voice-depth-btn'),
    voiceWaveCanvas: document.getElementById('voiceWaveCanvas'),
    voiceAudioStatus: document.getElementById('voiceAudioStatus'),
    voiceFileSizeDisplay: document.getElementById('voiceFileSizeDisplay'),
    voiceFileSavings: document.getElementById('voiceFileSavings'),
    voicePerceptionNote: document.getElementById('voicePerceptionNote'),
  };

  // =========================================================================
  // 4. THEME & TABS INITIALIZATION
  // =========================================================================

  function initTheme() {
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }

    function updateIcons(dark) {
      if (DOM.sunIcon && DOM.moonIcon) {
        DOM.sunIcon.style.display = dark ? 'block' : 'none';
        DOM.moonIcon.style.display = dark ? 'none' : 'block';
      }
    }

    updateIcons(isDark);

    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener('click', () => {
        const currentlyDark = document.documentElement.classList.contains('dark');
        if (currentlyDark) {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
          localStorage.setItem('theme', 'light');
          updateIcons(false);
        } else {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
          localStorage.setItem('theme', 'dark');
          updateIcons(true);
        }
      });
    }
  }

  function initTabs() {
    DOM.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.tabButtons.forEach(b => b.classList.remove('active'));
        DOM.tabViews.forEach(v => v.classList.remove('active'));

        btn.classList.add('active');
        const tabKey = btn.getAttribute('data-tab');
        const targetView = document.getElementById(`tab-${tabKey}`);
        if (targetView) targetView.classList.add('active');

        if (tabKey === 'photolab') {
          renderPhotoLab();
        } else if (tabKey === 'comparison') {
          renderComparisonCanvases();
        } else if (tabKey === 'sound') {
          renderSoundWave();
          renderVoiceWave();
        }
      });
    });
  }

  // =========================================================================
  // 5. PIXEL GRID, PALETTE & REVERSIBLE QUANTIZATION
  // =========================================================================

  function renderPalette() {
    const palette = PALETTES[state.colourDepth];
    DOM.paletteContainer.innerHTML = '';
    DOM.paletteContainer.style.width = '100%';
    DOM.paletteContainer.style.boxSizing = 'border-box';

    if (state.colourDepth <= 4) {
      DOM.paletteContainer.style.display = 'flex';
      DOM.paletteContainer.style.flexDirection = 'row';
      DOM.paletteContainer.style.flexWrap = 'wrap';
      DOM.paletteContainer.style.alignItems = 'center';
      DOM.paletteContainer.style.justifyContent = 'flex-start';
      DOM.paletteContainer.style.gap = '8px';

      palette.forEach((color, idx) => {
        const swatch = createSwatchElement(color, idx);
        DOM.paletteContainer.appendChild(swatch);
      });
    } else {
      // 8-bit mode (256 colours): standard 16 basic colours row + scrollable 256 spectrum
      DOM.paletteContainer.style.display = 'flex';
      DOM.paletteContainer.style.flexDirection = 'column';
      DOM.paletteContainer.style.alignItems = 'stretch';
      DOM.paletteContainer.style.gap = '8px';

      const primaryHeader = document.createElement('div');
      primaryHeader.style.display = 'flex';
      primaryHeader.style.justifyContent = 'space-between';
      primaryHeader.style.alignItems = 'center';
      primaryHeader.innerHTML = `
        <span style="font-size: 11px; font-weight: 700; color: var(--text-primary);">Standard 16 Colours (Indices 0–15):</span>
        <span style="font-size: 10px; color: var(--text-muted);">Exact match with 4-bit mode</span>
      `;
      DOM.paletteContainer.appendChild(primaryHeader);

      const primaryRow = document.createElement('div');
      primaryRow.style.display = 'flex';
      primaryRow.style.flexWrap = 'wrap';
      primaryRow.style.gap = '6px';
      for (let i = 0; i < 16; i++) {
        primaryRow.appendChild(createSwatchElement(palette[i], i));
      }
      DOM.paletteContainer.appendChild(primaryRow);

      const fullHeader = document.createElement('div');
      fullHeader.style.display = 'flex';
      fullHeader.style.justifyContent = 'space-between';
      fullHeader.style.alignItems = 'center';
      fullHeader.style.marginTop = '4px';
      fullHeader.innerHTML = `
        <span style="font-size: 11px; font-weight: 700; color: var(--text-primary);">Full 256-Colour Palette (Scroll or click any colour):</span>
        <span style="font-size: 10px; color: var(--text-muted);">256 total shades</span>
      `;
      DOM.paletteContainer.appendChild(fullHeader);

      const scrollGrid = document.createElement('div');
      scrollGrid.id = 'full256PaletteGrid';
      scrollGrid.style.display = 'grid';
      scrollGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(24px, 1fr))';
      scrollGrid.style.gap = '3px';
      scrollGrid.style.maxHeight = '110px';
      scrollGrid.style.overflowY = 'auto';
      scrollGrid.style.padding = '6px';
      scrollGrid.style.background = 'var(--bg-surface-elevated)';
      scrollGrid.style.borderRadius = 'var(--radius-md)';
      scrollGrid.style.border = '1px solid var(--border-color)';

      for (let i = 16; i < 256; i++) {
        const miniSwatch = createSwatchElement(palette[i], i, true);
        scrollGrid.appendChild(miniSwatch);
      }
      DOM.paletteContainer.appendChild(scrollGrid);
    }

    updatePaletteInfoText();
  }

  function createSwatchElement(color, idx, isMini = false) {
    const swatch = document.createElement('div');
    swatch.className = `palette-swatch ${idx === state.selectedColorIndex ? 'active' : ''}`;
    if (isMini) {
      swatch.style.width = '24px';
      swatch.style.height = '24px';
      swatch.style.borderRadius = '3px';
    }
    swatch.style.backgroundColor = color.hex;
    swatch.title = `${color.name} (${color.bin}) [Index ${idx}]`;
    swatch.dataset.paletteIndex = idx;

    if (!isMini) {
      const label = document.createElement('span');
      label.className = 'swatch-label';
      label.textContent = state.colourDepth <= 4 ? color.bin : idx;
      swatch.appendChild(label);
    }

    swatch.addEventListener('click', () => {
      document.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      state.selectedColorIndex = idx;
      state.activeTool = 'paint';
      updateToolButtons();
      updatePaletteInfoText();
    });

    return swatch;
  }

  function updatePaletteInfoText() {
    const palette = PALETTES[state.colourDepth];
    const currentColor = palette[state.selectedColorIndex] || palette[0];
    DOM.activePaletteInfo.textContent = `Selected: ${currentColor.hex} (${currentColor.bin}) [${currentColor.name}] • Index ${state.selectedColorIndex}`;
  }

  function renderPixelGrid() {
    DOM.pixelGrid.innerHTML = '';
    DOM.pixelGrid.style.gridTemplateColumns = `repeat(${state.gridSize}, 1fr)`;

    const cellSize = state.gridSize === 8 ? '36px' : '22px';
    const totalCells = state.gridSize * state.gridSize;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'pixel-cell';
      cell.style.width = cellSize;
      cell.style.height = cellSize;
      cell.dataset.index = i;

      const colorVal = state.gridData[i] || 0;
      const palette = PALETTES[state.colourDepth];
      const colorObj = palette[colorVal] || palette[0];
      cell.style.backgroundColor = colorObj.hex;

      cell.addEventListener('mousedown', (e) => {
        e.preventDefault();
        state.isMouseDown = true;
        applyTool(i);
      });

      cell.addEventListener('mouseenter', () => {
        const row = Math.floor(i / state.gridSize);
        const col = i % state.gridSize;
        DOM.cellCoordIndicator.textContent = `X: ${col}, Y: ${row} (Pixel #${i + 1})`;
        const currentPal = PALETTES[state.colourDepth];
        const c = currentPal[state.gridData[i]] || currentPal[0];
        DOM.cellColorIndicator.textContent = `${c.name} (${c.bin}) [Index ${state.gridData[i]}]`;

        if (state.isMouseDown) {
          applyTool(i);
        }

        highlightStreamByteForCell(i);

        // Highlight matching RLE run
        if (state.rleRuns) {
          const runIdx = state.rleRuns.findIndex(r => i >= r.start && i <= r.end);
          if (runIdx !== -1) {
            highlightRleRun(runIdx, false);
          }
        }
      });

      cell.addEventListener('mouseleave', () => {
        clearStreamByteHighlights();
        clearRleRunHighlights();
      });

      DOM.pixelGrid.appendChild(cell);
    }
  }

  // Global mouse up for smooth dragging
  window.addEventListener('mouseup', () => {
    state.isMouseDown = false;
  });

  function applyTool(index) {
    const curPal = PALETTES[state.colourDepth];
    let newColorIdx = 0;

    if (state.activeTool === 'paint') {
      newColorIdx = state.selectedColorIndex;
    } else if (state.activeTool === 'eraser') {
      newColorIdx = 0;
    } else if (state.activeTool === 'fill') {
      floodFill(index, state.gridData[index], state.selectedColorIndex);
      return;
    }

    state.gridData[index] = newColorIdx;

    // Record in master high-res pixels so user's work is preserved!
    const chosenColor = curPal[newColorIdx] || curPal[0];
    const rgb = hexToRgb(chosenColor.hex);
    if (!state.masterPixels[index]) state.masterPixels[index] = {};
    state.masterPixels[index].r = rgb.r;
    state.masterPixels[index].g = rgb.g;
    state.masterPixels[index].b = rgb.b;
    state.masterPixels[index].hex = chosenColor.hex;
    state.masterPixels[index].isUserModified = true;

    updateCellVisual(index);
    updateCalculationsAndStreams();
  }

  function updateCellVisual(index) {
    const cell = DOM.pixelGrid.children[index];
    if (cell) {
      const palette = PALETTES[state.colourDepth];
      const colorVal = state.gridData[index] || 0;
      const colorObj = palette[colorVal] || palette[0];
      cell.style.backgroundColor = colorObj.hex;
    }
  }

  function floodFill(startIndex, targetColor, replacementColor) {
    if (targetColor === replacementColor) return;
    const queue = [startIndex];
    const visited = new Uint8Array(state.gridData.length);
    const curPal = PALETTES[state.colourDepth];
    const repColorObj = curPal[replacementColor] || curPal[0];
    const rgb = hexToRgb(repColorObj.hex);

    while (queue.length > 0) {
      const idx = queue.pop();
      if (visited[idx]) continue;
      visited[idx] = 1;

      if (state.gridData[idx] === targetColor) {
        state.gridData[idx] = replacementColor;

        if (!state.masterPixels[idx]) state.masterPixels[idx] = {};
        state.masterPixels[idx].r = rgb.r;
        state.masterPixels[idx].g = rgb.g;
        state.masterPixels[idx].b = rgb.b;
        state.masterPixels[idx].hex = repColorObj.hex;
        state.masterPixels[idx].isUserModified = true;

        updateCellVisual(idx);

        const r = Math.floor(idx / state.gridSize);
        const c = idx % state.gridSize;

        if (c > 0) queue.push(idx - 1);
        if (c < state.gridSize - 1) queue.push(idx + 1);
        if (r > 0) queue.push(idx - state.gridSize);
        if (r < state.gridSize - 1) queue.push(idx + state.gridSize);
      }
    }
    updateCalculationsAndStreams();
  }

  function applyPreset(presetName) {
    const totalCells = state.gridSize * state.gridSize;

    if (presetName === 'clear') {
      state.masterPixels = [];
      state.gridData = new Array(totalCells).fill(0);
      for (let i = 0; i < totalCells; i++) {
        state.masterPixels[i] = { r: 0, g: 0, b: 0, hex: '#000000', isUserModified: false };
      }
    } else {
      const srcList = PRESETS_HIGHRES[presetName] || PRESETS_HIGHRES.rainbow;
      state.masterPixels = [];
      state.gridData = new Array(totalCells).fill(0);

      for (let r = 0; r < state.gridSize; r++) {
        for (let c = 0; c < state.gridSize; c++) {
          const srcR = state.gridSize === 8 ? r * 2 : r;
          const srcC = state.gridSize === 8 ? c * 2 : c;
          const srcIdx = srcR * 16 + srcC;
          const targetIdx = r * state.gridSize + c;
          const hexCol = srcList[srcIdx] || '#000000';
          const rgb = hexToRgb(hexCol);

          state.masterPixels[targetIdx] = {
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            hex: hexCol,
            isUserModified: false
          };

          // Map to current depth's palette
          state.gridData[targetIdx] = getClosestPaletteIndex(rgb.r, rgb.g, rgb.b, state.colourDepth);
        }
      }
    }

    renderPixelGrid();
    updateCalculationsAndStreams();
  }

  /**
   * NON-DESTRUCTIVE REVERSIBLE QUANTIZATION:
   * When switching between 8-bit, 4-bit, 2-bit, and 1-bit, unchanged pixels
   * preserve their original high-resolution master colours!
   */
  function setColourDepth(newDepth) {
    if (state.colourDepth === newDepth) return;
    state.colourDepth = newDepth;

    if (state.gridData && state.gridData.length && state.masterPixels && state.masterPixels.length) {
      for (let i = 0; i < state.gridData.length; i++) {
        const master = state.masterPixels[i];
        if (master) {
          state.gridData[i] = getClosestPaletteIndex(master.r, master.g, master.b, newDepth);
        }
      }
    }

    if (DOM.depthButtons) {
      DOM.depthButtons.forEach(btn => {
        const d = parseInt(btn.getAttribute('data-depth'), 10);
        btn.classList.toggle('active', d === newDepth);
      });
    }

    const curPal = PALETTES[newDepth];
    if (state.selectedColorIndex >= curPal.length) {
      state.selectedColorIndex = 1;
    }

    renderPalette();
    renderPixelGrid();
    updateCalculationsAndStreams();
  }

  function updateToolButtons() {
    DOM.toolPaintBtn.classList.toggle('active', state.activeTool === 'paint');
    DOM.toolEraserBtn.classList.toggle('active', state.activeTool === 'eraser');
    DOM.toolFillBtn.classList.toggle('active', state.activeTool === 'fill');
  }

  // =========================================================================
  // 6. CALCULATIONS & METADATA INSPECTOR
  // =========================================================================

  function updateCalculationsAndStreams() {
    const W = state.gridSize;
    const H = state.gridSize;
    const pixels = W * H;
    const D = state.colourDepth;
    const maxColors = Math.pow(2, D);

    const rawBits = pixels * D;
    const metadataBits = state.includeMetadata ? 32 : 0;
    const totalBits = rawBits + metadataBits;
    const rawBytes = Math.ceil(totalBits / 8);
    const kb = (rawBytes / 1000).toFixed(3);
    const kib = (rawBytes / 1024).toFixed(3);

    DOM.metricDimensions.textContent = `${W} × ${H}`;
    DOM.metricPixels.textContent = `${pixels} pixels`;
    DOM.metricDepth.textContent = `${D} bits`;
    DOM.metricColors.textContent = `${maxColors} colours (2^${D})`;
    DOM.metricRawBits.textContent = totalBits;
    DOM.metricRawBytes.textContent = `${rawBytes} B`;
    DOM.metricKb.textContent = `${kb} kB`;
    DOM.metricKib.textContent = `${kib} KiB`;

    DOM.formulaStep1.textContent = `${W} × ${H} = ${pixels} pixels`;
    DOM.formulaStep2.textContent = `${pixels} × ${D} = ${rawBits} raw bits`;
    DOM.formulaStep3.textContent = state.includeMetadata ? `${rawBits} + 32 (metadata) = ${totalBits} bits` : `${totalBits} bits (no metadata)`;
    DOM.formulaStep4.textContent = `${totalBits} ÷ 8 = ${rawBytes} Bytes`;

    DOM.finalTotalDisplay.textContent = `${rawBytes} Bytes (${totalBits} bits)`;

    renderBinaryStream();
    renderRleStream();
  }

  function renderBinaryStream() {
    DOM.binaryStreamOutput.innerHTML = '';
    const D = state.colourDepth;
    const totalPixels = state.gridSize * state.gridSize;

    let fullBitString = '';
    for (let i = 0; i < totalPixels; i++) {
      const colorVal = state.gridData[i] || 0;
      const binVal = colorVal.toString(2).padStart(D, '0');
      fullBitString += binVal;
    }

    if (state.includeMetadata) {
      const wBin = state.gridSize.toString(2).padStart(8, '0');
      const hBin = state.gridSize.toString(2).padStart(8, '0');
      const dBin = state.colourDepth.toString(2).padStart(8, '0');
      const padBin = '00000000';
      fullBitString = wBin + hBin + dBin + padBin + fullBitString;
    }

    const byteCount = Math.ceil(fullBitString.length / 8);
    DOM.streamByteCount.textContent = `Byte Count: ${byteCount} Bytes (${fullBitString.length} bits)`;

    const fragment = document.createDocumentFragment();
    for (let b = 0; b < byteCount; b++) {
      const byteBits = fullBitString.slice(b * 8, (b + 1) * 8).padEnd(8, '0');
      const span = document.createElement('span');
      span.className = 'byte-block';
      span.textContent = byteBits;
      span.dataset.byteIndex = b;

      span.addEventListener('mouseenter', () => {
        highlightPixelsForByte(b);
      });
      span.addEventListener('mouseleave', () => {
        clearPixelHighlights();
      });

      fragment.appendChild(span);
    }
    DOM.binaryStreamOutput.appendChild(fragment);
  }

  function highlightPixelsForByte(byteIdx) {
    clearPixelHighlights();
    const D = state.colourDepth;
    const metaOffset = state.includeMetadata ? 32 : 0;
    const byteStartBit = byteIdx * 8;
    const byteEndBit = byteStartBit + 8;

    if (byteEndBit <= metaOffset) return;

    const dataStartBit = Math.max(0, byteStartBit - metaOffset);
    const dataEndBit = Math.max(0, byteEndBit - metaOffset);

    const firstPixel = Math.floor(dataStartBit / D);
    const lastPixel = Math.floor((dataEndBit - 1) / D);

    for (let p = firstPixel; p <= lastPixel; p++) {
      if (DOM.pixelGrid.children[p]) {
        DOM.pixelGrid.children[p].classList.add('active-bit-hover');
      }
    }
  }

  function clearPixelHighlights() {
    Array.from(DOM.pixelGrid.children).forEach(c => c.classList.remove('active-bit-hover'));
  }

  function highlightStreamByteForCell(pixelIdx) {
    const D = state.colourDepth;
    const metaOffset = state.includeMetadata ? 32 : 0;
    const startBit = metaOffset + pixelIdx * D;
    const byteIdx = Math.floor(startBit / 8);

    const byteElements = DOM.binaryStreamOutput.children;
    if (byteElements[byteIdx]) {
      byteElements[byteIdx].classList.add('highlight');
      // Scroll ONLY the stream container, NEVER the window or page!
      const container = DOM.binaryStreamOutput;
      const target = byteElements[byteIdx];
      if (container && target) {
        const targetTop = target.offsetTop - container.offsetTop;
        if (targetTop < container.scrollTop || targetTop > container.scrollTop + container.clientHeight - 30) {
          container.scrollTop = Math.max(0, targetTop - 12);
        }
      }
    }
  }

  function clearStreamByteHighlights() {
    Array.from(DOM.binaryStreamOutput.children).forEach(b => b.classList.remove('highlight'));
  }

  function highlightRleRun(runIndex, scrollChip = true) {
    clearRleRunHighlights();
    const runs = state.rleRuns;
    if (!runs || !runs[runIndex]) return;
    const run = runs[runIndex];
    const palette = PALETTES[state.colourDepth];
    const colorObj = palette[run.color] || palette[0];

    // Highlight chip
    const chips = DOM.rleStreamOutput ? DOM.rleStreamOutput.querySelectorAll('.rle-run-chip') : [];
    if (chips[runIndex]) {
      chips[runIndex].classList.add('active-rle');
      if (scrollChip) {
        const container = DOM.rleStreamOutput;
        const target = chips[runIndex];
        const targetTop = target.offsetTop - container.offsetTop;
        if (targetTop < container.scrollTop || targetTop > container.scrollTop + container.clientHeight - 30) {
          container.scrollTop = Math.max(0, targetTop - 12);
        }
      }
    }

    // Highlight corresponding pixel cells
    for (let p = run.start; p <= run.end; p++) {
      const cell = DOM.pixelGrid.children[p];
      if (cell) {
        cell.classList.add('rle-highlighted');
      }
    }

    if (DOM.cellCoordIndicator) {
      DOM.cellCoordIndicator.textContent = `🎯 RLE Run #${runIndex + 1}: ${run.count} × ${colorObj.name} (Pixels #${run.start + 1} to #${run.end + 1})`;
    }
    if (DOM.cellColorIndicator) {
      DOM.cellColorIndicator.textContent = `${colorObj.name} (${colorObj.bin}) [Index ${run.color}]`;
    }
  }

  function clearRleRunHighlights() {
    Array.from(DOM.pixelGrid.children).forEach(c => c.classList.remove('rle-highlighted'));
    if (DOM.rleStreamOutput) {
      DOM.rleStreamOutput.querySelectorAll('.rle-run-chip').forEach(c => c.classList.remove('active-rle'));
    }
  }

  function renderRleStream() {
    DOM.rleStreamOutput.innerHTML = '';
    const palette = PALETTES[state.colourDepth];
    const data = state.gridData;
    if (!data || data.length === 0) return;

    const runs = [];
    let currentColor = data[0];
    let count = 1;
    let runStart = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i] === currentColor) {
        count++;
      } else {
        runs.push({ count, color: currentColor, start: runStart, end: i - 1 });
        currentColor = data[i];
        count = 1;
        runStart = i;
      }
    }
    runs.push({ count, color: currentColor, start: runStart, end: data.length - 1 });
    state.rleRuns = runs;

    const fragment = document.createDocumentFragment();
    runs.forEach((run, idx) => {
      const chip = document.createElement('span');
      chip.className = 'rle-run-chip';
      const colorObj = palette[run.color] || palette[0];
      chip.title = `Run #${idx + 1}: ${run.count} × ${colorObj.name} (Pixels ${run.start + 1} to ${run.end + 1}) — Click or hover to highlight on canvas`;

      const sample = document.createElement('span');
      sample.className = 'rle-color-sample';
      sample.style.backgroundColor = colorObj.hex;

      const text = document.createElement('span');
      text.textContent = `(${run.count}, ${colorObj.name})`;

      chip.appendChild(sample);
      chip.appendChild(text);

      chip.addEventListener('mouseenter', () => highlightRleRun(idx, false));
      chip.addEventListener('mouseleave', () => clearRleRunHighlights());

      fragment.appendChild(chip);
    });
    DOM.rleStreamOutput.appendChild(fragment);

    const rawBits = data.length * state.colourDepth;
    const rleBits = runs.length * (8 + state.colourDepth);
    const spaceSaved = rawBits > 0 ? Math.max(0, Math.round(((rawBits - rleBits) / rawBits) * 100)) : 0;

    DOM.rleOriginalBits.textContent = `Raw: ${rawBits} bits`;
    DOM.rleCompressedBits.textContent = `RLE: ${rleBits} bits`;
    DOM.rleRatioDisplay.textContent = `${spaceSaved}%`;
    DOM.rleMeterFill.style.width = `${Math.min(100, Math.max(0, spaceSaved))}%`;

    if (rleBits < rawBits) {
      DOM.rleStatusBadge.className = 'badge badge-live';
      DOM.rleStatusBadge.textContent = 'COMPRESSION EFFECTIVE';
    } else {
      DOM.rleStatusBadge.className = 'badge badge-spec';
      DOM.rleStatusBadge.textContent = 'RLE LARGER THAN RAW';
    }
  }

  // =========================================================================
  // 7. DEDICATED PHOTO COLOUR DEPTH & POSTERIZATION LAB (16.7M to 1-Bit)
  // =========================================================================

  function initPhotoLab() {
    generatePhotoSample(photoLabState.currentSample);

    // Sample Photo Buttons
    if (DOM.photoSampleButtons) {
      DOM.photoSampleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          DOM.photoSampleButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          photoLabState.currentSample = btn.getAttribute('data-sample');
          photoLabState.width = 800;
          photoLabState.height = 560;
          photoLabState.aspectName = '16:9 Landscape';
          if (DOM.photoCanvasLarge) {
            DOM.photoCanvasLarge.width = 800;
            DOM.photoCanvasLarge.height = 560;
          }
          generatePhotoSample(photoLabState.currentSample);
        });
      });
    }

    // Depth Buttons
    if (DOM.photoDepthButtons) {
      DOM.photoDepthButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          DOM.photoDepthButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          photoLabState.depth = parseInt(btn.getAttribute('data-depth'), 10);
          renderPhotoLab();
        });
      });
    }

    // Dithering Toggle
    if (DOM.photoDitherToggle) {
      DOM.photoDitherToggle.addEventListener('change', (e) => {
        photoLabState.dithering = e.target.checked;
        renderPhotoLab();
      });
    }

    // Peek Original Button (Hold to preview 24-bit original)
    if (DOM.btnPeekOriginal) {
      const startPeek = (e) => {
        e.preventDefault();
        photoLabState.isPeeking = true;
        DOM.btnPeekOriginal.classList.add('active');
        DOM.btnPeekOriginal.textContent = '👁️ Peeking Original 24-bit...';
        renderPhotoLab();
      };
      const stopPeek = (e) => {
        if (!photoLabState.isPeeking) return;
        photoLabState.isPeeking = false;
        DOM.btnPeekOriginal.classList.remove('active');
        DOM.btnPeekOriginal.textContent = '👁️ Hold to Peek Original (24-bit)';
        renderPhotoLab();
      };
      DOM.btnPeekOriginal.addEventListener('mousedown', startPeek);
      DOM.btnPeekOriginal.addEventListener('mouseup', stopPeek);
      DOM.btnPeekOriginal.addEventListener('mouseleave', stopPeek);
      DOM.btnPeekOriginal.addEventListener('touchstart', startPeek, { passive: false });
      DOM.btnPeekOriginal.addEventListener('touchend', stopPeek);
    }

    // Upload Photo with Multi-Aspect-Ratio Support
    if (DOM.photoLabUploadBtn && DOM.photoLabFileInput) {
      DOM.photoLabUploadBtn.addEventListener('click', () => {
        DOM.photoLabFileInput.click();
      });

      DOM.photoLabFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const naturalW = img.naturalWidth || img.width;
            const naturalH = img.naturalHeight || img.height;
            const ratio = naturalW / naturalH;

            // Classify aspect ratio for clear student context
            let aspectDesc = 'Custom';
            if (Math.abs(ratio - 1) < 0.08) aspectDesc = '1:1 Square';
            else if (Math.abs(ratio - 16 / 9) < 0.12) aspectDesc = '16:9 Widescreen';
            else if (Math.abs(ratio - 4 / 3) < 0.10) aspectDesc = '4:3 Standard';
            else if (Math.abs(ratio - 3 / 2) < 0.10) aspectDesc = '3:2 Classic Photo';
            else if (ratio > 1.8) aspectDesc = `${ratio.toFixed(2)}:1 Panoramic`;
            else if (ratio < 0.85) aspectDesc = `${(1 / ratio).toFixed(2)}:1 Portrait`;
            else aspectDesc = `${ratio.toFixed(2)}:1 Landscape`;
            photoLabState.aspectName = aspectDesc;

            // Fit into max bounds (840 x 600) while keeping natural proportions exactly
            let targetW = 800;
            let targetH = Math.round(targetW / ratio);
            if (targetH > 600) {
              targetH = 600;
              targetW = Math.round(targetH * ratio);
            }
            if (targetW > 840) {
              targetW = 840;
              targetH = Math.round(targetW / ratio);
            }
            targetW = Math.max(100, Math.round(targetW / 2) * 2);
            targetH = Math.max(100, Math.round(targetH / 2) * 2);

            photoLabState.width = targetW;
            photoLabState.height = targetH;

            if (DOM.photoCanvasLarge) {
              DOM.photoCanvasLarge.width = targetW;
              DOM.photoCanvasLarge.height = targetH;
            }

            const off = document.createElement('canvas');
            off.width = targetW;
            off.height = targetH;
            const ctx = off.getContext('2d');
            ctx.drawImage(img, 0, 0, targetW, targetH);
            photoLabState.originalData = ctx.getImageData(0, 0, targetW, targetH);
            photoLabState.currentSample = 'custom';
            if (DOM.photoSampleButtons) DOM.photoSampleButtons.forEach(b => b.classList.remove('active'));
            renderPhotoLab();
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function generatePhotoSample(sampleKey) {
    const W = photoLabState.width;
    const H = photoLabState.height;
    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    const ctx = off.getContext('2d');

    if (sampleKey === 'sunset') {
      // Smooth gradient sky: Navy -> Magenta -> Orange -> Gold (Great for seeing colour banding!)
      const grad = ctx.createLinearGradient(0, 0, 0, H * 0.7);
      grad.addColorStop(0.0, '#0a0826');
      grad.addColorStop(0.25, '#2d1457');
      grad.addColorStop(0.5, '#a11d6d');
      grad.addColorStop(0.75, '#f95e2c');
      grad.addColorStop(1.0, '#ffc83b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H * 0.7);

      // Glowing Sun
      const sunRadius = Math.round(H * 0.22);
      const sunGrad = ctx.createRadialGradient(W * 0.5, H * 0.45, 5, W * 0.5, H * 0.45, sunRadius);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.4, '#fff275');
      sunGrad.addColorStop(1, 'rgba(255, 110, 40, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.45, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Mountains silhouette
      ctx.fillStyle = '#180829';
      ctx.beginPath();
      ctx.moveTo(0, H * 0.7);
      ctx.lineTo(W * 0.2, H * 0.5);
      ctx.lineTo(W * 0.4, H * 0.62);
      ctx.lineTo(W * 0.6, H * 0.48);
      ctx.lineTo(W * 0.8, H * 0.64);
      ctx.lineTo(W, H * 0.52);
      ctx.lineTo(W, H * 0.7);
      ctx.closePath();
      ctx.fill();

      // Water reflection
      const waterGrad = ctx.createLinearGradient(0, H * 0.7, 0, H);
      waterGrad.addColorStop(0, '#e65c00');
      waterGrad.addColorStop(0.4, '#a11d6d');
      waterGrad.addColorStop(1, '#180829');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, H * 0.7, W, H * 0.3);

      // Shimmer ripples
      ctx.strokeStyle = 'rgba(255, 230, 150, 0.4)';
      ctx.lineWidth = 2.5;
      for (let y = H * 0.72; y < H; y += 12) {
        const spread = (y - H * 0.7) * 2.5;
        ctx.beginPath();
        ctx.moveTo(W * 0.5 - spread, y);
        ctx.lineTo(W * 0.5 + spread, y);
        ctx.stroke();
      }

    } else if (sampleKey === 'parrot') {
      // Jungle gradient background
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#064e3b');
      bg.addColorStop(1, '#022c22');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Soft tropical leaves
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.ellipse(i * (W * 0.15), H * 0.15, W * 0.12, H * 0.08, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Scarlet Macaw Body
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.5, W * 0.17, H * 0.34, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Golden Shoulder
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(W * 0.45, H * 0.52, W * 0.11, H * 0.21, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Emerald Wing
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.ellipse(W * 0.42, H * 0.58, W * 0.09, H * 0.23, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Royal Blue Wingtips
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.ellipse(W * 0.40, H * 0.65, W * 0.06, H * 0.25, 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Face patch & Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(W * 0.56, H * 0.38, Math.round(W * 0.05), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(W * 0.56, H * 0.36, Math.round(W * 0.018), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(W * 0.58, H * 0.34, Math.round(W * 0.006), 0, Math.PI * 2);
      ctx.fill();

      // Curved Beak
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(W * 0.62, H * 0.35);
      ctx.quadraticCurveTo(W * 0.76, H * 0.42, W * 0.67, H * 0.55);
      ctx.lineTo(W * 0.60, H * 0.46);
      ctx.closePath();
      ctx.fill();

    } else if (sampleKey === 'car') {
      // Cyberpunk city background
      const city = ctx.createLinearGradient(0, 0, 0, H);
      city.addColorStop(0, '#09090b');
      city.addColorStop(0.6, '#18181b');
      city.addColorStop(1, '#09090b');
      ctx.fillStyle = city;
      ctx.fillRect(0, 0, W, H);

      // Neon grid lines
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < W; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, H * 0.6);
        ctx.lineTo(x * 1.6 - W * 0.3, H);
        ctx.stroke();
      }

      // Sports Car Body
      const carGrad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
      carGrad.addColorStop(0, '#06b6d4');
      carGrad.addColorStop(0.5, '#3b82f6');
      carGrad.addColorStop(1, '#ec4899');
      ctx.fillStyle = carGrad;

      ctx.beginPath();
      ctx.moveTo(W * 0.15, H * 0.68);
      ctx.lineTo(W * 0.25, H * 0.55);
      ctx.lineTo(W * 0.45, H * 0.45);
      ctx.lineTo(W * 0.72, H * 0.48);
      ctx.lineTo(W * 0.88, H * 0.62);
      ctx.lineTo(W * 0.85, H * 0.72);
      ctx.lineTo(W * 0.15, H * 0.72);
      ctx.closePath();
      ctx.fill();

      // Glass windshield
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(W * 0.44, H * 0.47);
      ctx.lineTo(W * 0.62, H * 0.48);
      ctx.lineTo(W * 0.68, H * 0.56);
      ctx.lineTo(W * 0.38, H * 0.56);
      ctx.closePath();
      ctx.fill();

      // Headlight glow
      const headGlow = ctx.createRadialGradient(W * 0.88, H * 0.64, 2, W * 0.88, H * 0.64, 70);
      headGlow.addColorStop(0, '#38bdf8');
      headGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = headGlow;
      ctx.beginPath();
      ctx.arc(W * 0.88, H * 0.64, 70, 0, Math.PI * 2);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(W * 0.28, H * 0.72, Math.round(W * 0.055), 0, Math.PI * 2);
      ctx.arc(W * 0.75, H * 0.72, Math.round(W * 0.055), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(W * 0.28, H * 0.72, Math.round(W * 0.025), 0, Math.PI * 2);
      ctx.arc(W * 0.75, H * 0.72, Math.round(W * 0.025), 0, Math.PI * 2);
      ctx.fill();

    } else {
      // Golden Pup
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 60, W * 0.5, H * 0.5, 360);
      bg.addColorStop(0, '#3f6212');
      bg.addColorStop(1, '#14532d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Pup Head
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.48, W * 0.21, H * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();

      // Floppy Ears
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(W * 0.32, H * 0.45, W * 0.075, H * 0.23, 0.4, 0, Math.PI * 2);
      ctx.ellipse(W * 0.68, H * 0.45, W * 0.075, H * 0.23, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Muzzle
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.60, W * 0.12, H * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dark Eyes with glistening highlights
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(W * 0.42, H * 0.42, Math.round(W * 0.03), 0, Math.PI * 2);
      ctx.arc(W * 0.58, H * 0.42, Math.round(W * 0.03), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(W * 0.44, H * 0.40, Math.round(W * 0.01), 0, Math.PI * 2);
      ctx.arc(W * 0.60, H * 0.40, Math.round(W * 0.01), 0, Math.PI * 2);
      ctx.fill();

      // Black Nose
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.55, W * 0.04, H * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    photoLabState.originalData = ctx.getImageData(0, 0, W, H);
    renderPhotoLab();
  }

  function renderPhotoLab() {
    const canvas = DOM.photoCanvasLarge;
    if (!canvas || !photoLabState.originalData) return;

    const W = photoLabState.width;
    const H = photoLabState.height;
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;

    const totalPixels = W * H;
    const D = photoLabState.depth;
    const ctx = canvas.getContext('2d');

    const origBits = totalPixels * 24;
    const origBytes = origBits / 8;
    const origKb = (origBytes / 1000).toFixed(1);

    if (DOM.photoAspectBadge) DOM.photoAspectBadge.textContent = `Aspect: ${photoLabState.aspectName}`;
    if (DOM.photoOriginalDim) DOM.photoOriginalDim.textContent = `${W} × ${H} px (${totalPixels.toLocaleString()} pixels)`;

    // Check if user is holding "Peek Original"
    if (photoLabState.isPeeking) {
      ctx.putImageData(photoLabState.originalData, 0, 0);
      if (DOM.photoQuantBadge) DOM.photoQuantBadge.textContent = '👁️ 24-bit True Colour (Original Preview)';
      if (DOM.photoQuantSize) DOM.photoQuantSize.textContent = `${origKb} kB (Original Uncompressed)`;
      if (DOM.photoQuantBandingNote) DOM.photoQuantBandingNote.textContent = 'Viewing original uncompressed 24-bit master image';
      return;
    }

    // 2. Quantize into Target Colour Depth
    const quantImgData = ctx.createImageData(W, H);
    const src = photoLabState.originalData.data;
    const dst = quantImgData.data;

    // Buffer for error diffusion dithering (Floyd-Steinberg)
    const errR = new Float32Array(W * H);
    const errG = new Float32Array(W * H);
    const errB = new Float32Array(W * H);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const pIdx = y * W + x;

        let r = src[i] + (photoLabState.dithering ? errR[pIdx] : 0);
        let g = src[i + 1] + (photoLabState.dithering ? errG[pIdx] : 0);
        let b = src[i + 2] + (photoLabState.dithering ? errB[pIdx] : 0);

        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));

        let qr = r, qg = g, qb = b;

        if (D === 24) {
          // True Colour: No quantization
          qr = r; qg = g; qb = b;
        } else if (D === 16) {
          // High Colour (5-6-5 bits)
          qr = Math.round(r / 8.225) * 8.225;
          qg = Math.round(g / 4.047) * 4.047;
          qb = Math.round(b / 8.225) * 8.225;
        } else if (D === 8) {
          // 256 colours (3 bits Red, 3 bits Green, 2 bits Blue)
          qr = Math.round(r / 36.42) * 36.42;
          qg = Math.round(g / 36.42) * 36.42;
          qb = Math.round(b / 85.0) * 85.0;
        } else if (D === 4) {
          // 16 colours: Snap to closest VGA palette entry
          const palIdx = getClosestPaletteIndex(r, g, b, 4);
          const c = hexToRgb(PALETTES[4][palIdx].hex);
          qr = c.r; qg = c.g; qb = c.b;
        } else if (D === 2) {
          // 2-bit (4 levels of luminance)
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const step = Math.round(lum / 85) * 85;
          qr = step; qg = step; qb = step;
        } else if (D === 1) {
          // 1-bit Monochrome
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const val = lum >= 128 ? 255 : 0;
          qr = val; qg = val; qb = val;
        }

        dst[i] = Math.max(0, Math.min(255, Math.round(qr)));
        dst[i + 1] = Math.max(0, Math.min(255, Math.round(qg)));
        dst[i + 2] = Math.max(0, Math.min(255, Math.round(qb)));
        dst[i + 3] = 255;

        // Floyd-Steinberg error distribution
        if (photoLabState.dithering && D < 24) {
          const diffR = r - qr;
          const diffG = g - qg;
          const diffB = b - qb;

          if (x + 1 < W) {
            errR[pIdx + 1] += diffR * (7 / 16);
            errG[pIdx + 1] += diffG * (7 / 16);
            errB[pIdx + 1] += diffB * (7 / 16);
          }
          if (y + 1 < H) {
            if (x > 0) {
              errR[pIdx + W - 1] += diffR * (3 / 16);
              errG[pIdx + W - 1] += diffG * (3 / 16);
              errB[pIdx + W - 1] += diffB * (3 / 16);
            }
            errR[pIdx + W] += diffR * (5 / 16);
            errG[pIdx + W] += diffG * (5 / 16);
            errB[pIdx + W] += diffB * (5 / 16);
            if (x + 1 < W) {
              errR[pIdx + W + 1] += diffR * (1 / 16);
              errG[pIdx + W + 1] += diffG * (1 / 16);
              errB[pIdx + W + 1] += diffB * (1 / 16);
            }
          }
        }
      }
    }

    ctx.putImageData(quantImgData, 0, 0);

    // 3. Update Metrics Badges & Calculations
    const quantBits = totalPixels * D;
    const quantBytes = Math.ceil(quantBits / 8);
    const quantKb = (quantBytes / 1000).toFixed(1);
    const savingsPercent = (((origBytes - quantBytes) / origBytes) * 100).toFixed(1);

    const depthLabels = {
      24: '24-bit • 16.7M Colours',
      16: '16-bit • 65,536 Colours',
      8: '8-bit • 256 Colours',
      4: '4-bit • 16 Colours',
      2: '2-bit • 4 Shades',
      1: '1-bit • 2 Colours',
    };

    const bandingNotes = {
      24: 'Colour Banding: None (Smooth true colour)',
      16: 'Colour Banding: Barely perceptible',
      8: 'Colour Banding: Noticeable in skies & skin',
      4: 'Colour Banding: Severe Posterization (16 VGA colors)',
      2: 'Colour Banding: Extreme 4-tone banding',
      1: 'Colour Banding: Total thresholding (Black/White)',
    };

    if (DOM.photoQuantBadge) DOM.photoQuantBadge.textContent = depthLabels[D];
    if (DOM.photoQuantSize) DOM.photoQuantSize.textContent = `${quantKb} kB (${savingsPercent}% saved vs 24-bit)`;
    if (DOM.photoQuantBandingNote) DOM.photoQuantBandingNote.textContent = bandingNotes[D];

    // 4. Update AQA Comparison Table
    if (DOM.photoTableDimensions) DOM.photoTableDimensions.textContent = `${W} × ${H} (${totalPixels.toLocaleString()} px)`;

    if (DOM.photoComparisonTableBody) {
      const specs = [
        { depth: 24, colors: '16,777,216', bpp: '3 Bytes (24 bits)', effect: 'True Colour: Photorealistic, no banding' },
        { depth: 16, colors: '65,536', bpp: '2 Bytes (16 bits)', effect: 'High Colour: Smooth gradients, faint banding' },
        { depth: 8, colors: '256', bpp: '1 Byte (8 bits)', effect: 'Indexed Palette: Visible banding in skies' },
        { depth: 4, colors: '16', bpp: '0.5 Byte (4 bits)', effect: 'VGA / Retro: Heavy colour posterization' },
        { depth: 2, colors: '4', bpp: '0.25 Byte (2 bits)', effect: 'Game Boy style: 4 brightness tones' },
        { depth: 1, colors: '2', bpp: '0.125 Byte (1 bit)', effect: 'Monochrome: Pure black & white silhouette' },
      ];

      DOM.photoComparisonTableBody.innerHTML = '';
      specs.forEach(s => {
        const bits = totalPixels * s.depth;
        const bytes = Math.ceil(bits / 8);
        const kb = (bytes / 1000).toFixed(1);
        const saved = (((origBytes - bytes) / origBytes) * 100).toFixed(1);
        const isCurrent = s.depth === D;

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border-color)';
        if (isCurrent) {
          tr.style.background = 'rgba(99, 102, 241, 0.12)';
          tr.style.fontWeight = '700';
        }

        tr.innerHTML = `
          <td style="padding: 8px 12px; color: ${isCurrent ? 'var(--accent-primary)' : 'var(--text-primary)'};">
            ${s.depth}-bit ${isCurrent ? '⭐ [Active]' : ''}
          </td>
          <td style="padding: 8px 12px; font-family: var(--font-mono);">${s.colors}</td>
          <td style="padding: 8px 12px; font-family: var(--font-mono);">${s.bpp}</td>
          <td style="padding: 8px 12px; font-family: var(--font-mono); color: #10b981;">${kb} kB (${bytes.toLocaleString()} B)</td>
          <td style="padding: 8px 12px; font-family: var(--font-mono); color: #3b82f6;">${saved}%</td>
          <td style="padding: 8px 12px; font-size: 11.5px; color: var(--text-secondary);">${s.effect}</td>
        `;

        DOM.photoComparisonTableBody.appendChild(tr);
      });
    }
  }

  // =========================================================================
  // 8. SOUND SAMPLING & QUANTIZATION (AQA §3.3.4)
  // With constant musical pitch, interactive custom wave drawing, and animated playhead needle!
  // =========================================================================

  function renderSoundWave() {
    const canvas = DOM.soundWaveCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const padding = 55;
    const drawHeight = height - padding * 2;
    const levels = Math.pow(2, soundState.bitDepth);

    // 1. Draw Quantization Grid Levels (Horizontal lines with Note & Binary Code)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let k = 0; k < levels; k++) {
      const normLevel = levels > 1 ? k / (levels - 1) : 0.5;
      const y = padding + drawHeight * (1 - normLevel);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      const binCode = k.toString(2).padStart(soundState.bitDepth, '0');
      const approxHz = Math.round(130.81 * Math.pow(2, 2 * normLevel));
      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${binCode} (${approxHz}Hz)`, padding - 8, y + 3);
    }
    ctx.setLineDash([]);

    // Pitch Range Indicator Labels
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('▲ High Pitch (C5 ~523 Hz)', padding, padding - 15);
    ctx.fillText('▼ Low Pitch (C3 ~131 Hz)', padding, height - padding + 22);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.fillText('Duration: 2.0s ▶', width - padding, height - padding + 22);

    // 2. Continuous Analogue Wave Function (Height = Pitch)
    function waveFunc(t) {
      if (soundState.waveform === 'custom' && soundState.customWavePoints.length >= 2) {
        const idx = Math.max(0, Math.min(soundState.customWavePoints.length - 1, Math.floor(t * (soundState.customWavePoints.length - 1))));
        return soundState.customWavePoints[idx];
      } else if (soundState.waveform === 'chiptune') {
        // 8-Bit chiptune arpeggio contour (8 notes across 2.0s)
        const notes = [0.15, 0.45, 0.72, 0.95, 0.72, 0.45, 0.85, 0.30];
        const step = Math.min(notes.length - 1, Math.floor(t * notes.length));
        return notes[step] * 2 - 1;
      } else if (soundState.waveform === 'bass') {
        // Synth bass progression
        const bassNotes = [0.08, 0.28, 0.42, 0.28, 0.18, 0.38, 0.52, 0.12];
        const bStep = Math.min(bassNotes.length - 1, Math.floor(t * bassNotes.length));
        return bassNotes[bStep] * 2 - 1;
      } else if (soundState.waveform === 'robot') {
        // Robot octave beeps
        const rNotes = [0.22, 0.88, 0.22, 0.88, 0.55, 0.88, 0.22, 0.95];
        const rStep = Math.min(rNotes.length - 1, Math.floor(t * rNotes.length));
        return rNotes[rStep] * 2 - 1;
      } else {
        // Siren Slide (smooth sinusoidal glide)
        return 0.82 * Math.sin(2 * Math.PI * 1.0 * t);
      }
    }

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const startX = padding;
    const endX = width - padding;
    const graphWidth = endX - startX;

    for (let x = startX; x <= endX; x++) {
      const t = (x - startX) / graphWidth;
      const v = waveFunc(t);
      const y = height / 2 - v * (drawHeight / 2);
      if (x === startX) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 3. Compute Digital Samples & Quantization
    const sampleCount = soundState.sampleRate;
    const samples = [];

    for (let i = 0; i < sampleCount; i++) {
      const t = i / (sampleCount - 1);
      const x = startX + t * graphWidth;
      const v = waveFunc(t);
      const norm = Math.max(0, Math.min(1, (v + 1) / 2));
      const quantNorm = Math.round(norm * (levels - 1)) / (levels - 1);
      const quantV = quantNorm * 2 - 1;
      const quantY = height / 2 - quantV * (drawHeight / 2);
      const levelIdx = Math.round(quantNorm * (levels - 1));

      samples.push({ x, quantY, levelIdx, quantNorm });
    }

    // 4. Draw Quantized Staircase (Red)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const curr = samples[i];
      if (i === 0) {
        ctx.moveTo(curr.x, curr.quantY);
      } else {
        const prev = samples[i - 1];
        ctx.lineTo(curr.x, prev.quantY);
        ctx.lineTo(curr.x, curr.quantY);
      }
    }
    ctx.stroke();

    // 5. Draw Sample Dots & Drop-lines
    samples.forEach(s => {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(s.x, height - padding);
      ctx.lineTo(s.x, s.quantY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(s.x, s.quantY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // 6. Draw Animated Playhead Needle (Moving cursor during playback)
    if (soundState.isPlaying && soundState.playheadRatio >= 0 && soundState.playheadRatio <= 1) {
      const needleX = startX + soundState.playheadRatio * graphWidth;

      // Vertical glowing needle
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(needleX, padding - 15);
      ctx.lineTo(needleX, height - padding + 15);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Active needle pill at top
      const currentU = soundState.playheadRatio;
      const stepIdx = Math.min(sampleCount - 1, Math.floor(currentU * sampleCount));
      const stepT = stepIdx / (sampleCount - 1);
      const currentV = waveFunc(stepT);
      const currentNorm = Math.max(0, Math.min(1, (currentV + 1) / 2));
      const currentLevel = Math.round(currentNorm * (levels - 1));
      const binCode = currentLevel.toString(2).padStart(soundState.bitDepth, '0');
      const curHz = Math.round(130.81 * Math.pow(2, 2 * (currentLevel / (levels - 1))));

      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.roundRect(needleX - 35, padding - 34, 70, 18, 4);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${binCode} (${curHz}Hz)`, needleX, padding - 21);

      // Pulse nearest sample dot
      let nearestSample = samples[0];
      let minXDist = Math.abs(needleX - samples[0].x);
      for (let s of samples) {
        const d = Math.abs(needleX - s.x);
        if (d < minXDist) {
          minXDist = d;
          nearestSample = s;
        }
      }

      if (minXDist < 25) {
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(nearestSample.x, nearestSample.quantY, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function updateSoundCalculations() {
    const rate = soundState.sampleRate;
    const depth = soundState.bitDepth;
    const duration = soundState.duration;
    const channels = soundState.channels;

    const totalBits = rate * depth * duration * channels;
    const totalBytes = totalBits / 8;
    const kB = (totalBytes / 1000).toFixed(3);
    const KiB = (totalBytes / 1024).toFixed(3);

    if (DOM.metricSoundRate) DOM.metricSoundRate.textContent = `${rate} Hz`;
    if (DOM.metricSoundDepth) DOM.metricSoundDepth.textContent = `${depth} bits (${Math.pow(2, depth)} levels)`;
    if (DOM.metricSoundBits) DOM.metricSoundBits.textContent = `${totalBits.toLocaleString()} bits`;
    if (DOM.metricSoundBytes) DOM.metricSoundBytes.textContent = `${totalBytes.toLocaleString()} B`;
    if (DOM.soundKbVal) DOM.soundKbVal.textContent = `${kB} kB`;
    if (DOM.soundKibVal) DOM.soundKibVal.textContent = `${KiB} KiB`;
    if (DOM.soundDurationLabel) DOM.soundDurationLabel.textContent = duration;

    renderSoundWave();
  }

  /**
   * MELODY THEREMIN SYNTHESIS:
   * Maps height of wave to musical pitch (C3 ~130.81 Hz to C5 ~523.25 Hz).
   * Plays the exact discrete quantized pitch steps shown by the red staircase!
   */
  function playQuantizedSound() {
    if (soundState.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!soundState.audioCtx) soundState.audioCtx = new AudioCtx();
      const ctx = soundState.audioCtx;
      if (ctx.state === 'suspended') ctx.resume();

      soundState.isPlaying = true;
      if (DOM.btnPlaySound) DOM.btnPlaySound.textContent = '⏹️ Playing Melody (2s)...';
      if (DOM.soundPlayheadStatus) DOM.soundPlayheadStatus.textContent = 'PLAYING • SWEEPING SAMPLES';

      const duration = 2.0;
      const audioSampleRate = ctx.sampleRate;
      const frameCount = Math.floor(audioSampleRate * duration);
      const buffer = ctx.createBuffer(1, frameCount, audioSampleRate);
      const data = buffer.getChannelData(0);

      const sampleCount = soundState.sampleRate;
      const levels = Math.pow(2, soundState.bitDepth);

      function getWaveV(t) {
        if (soundState.waveform === 'custom' && soundState.customWavePoints.length >= 2) {
          const idx = Math.max(0, Math.min(soundState.customWavePoints.length - 1, Math.floor(t * (soundState.customWavePoints.length - 1))));
          return soundState.customWavePoints[idx];
        } else if (soundState.waveform === 'chiptune') {
          const notes = [0.15, 0.45, 0.72, 0.95, 0.72, 0.45, 0.85, 0.30];
          const step = Math.min(notes.length - 1, Math.floor(t * notes.length));
          return notes[step] * 2 - 1;
        } else if (soundState.waveform === 'bass') {
          const bassNotes = [0.08, 0.28, 0.42, 0.28, 0.18, 0.38, 0.52, 0.12];
          const bStep = Math.min(bassNotes.length - 1, Math.floor(t * bassNotes.length));
          return bassNotes[bStep] * 2 - 1;
        } else if (soundState.waveform === 'robot') {
          const rNotes = [0.22, 0.88, 0.22, 0.88, 0.55, 0.88, 0.22, 0.95];
          const rStep = Math.min(rNotes.length - 1, Math.floor(t * rNotes.length));
          return rNotes[rStep] * 2 - 1;
        } else {
          return 0.82 * Math.sin(2 * Math.PI * 1.0 * t);
        }
      }

      let phase = 0;

      for (let i = 0; i < frameCount; i++) {
        const t = i / audioSampleRate;
        const u = Math.min(0.9999, t / duration);

        // Map progress to sample step in [0, sampleCount - 1]
        const stepIdx = Math.min(sampleCount - 1, Math.floor(u * sampleCount));
        const stepT = stepIdx / (sampleCount - 1);
        const val = getWaveV(stepT);
        const norm = Math.max(0, Math.min(1, (val + 1) / 2));
        const quantNorm = Math.round(norm * (levels - 1)) / (levels - 1);

        // Musical pitch frequency: C3 (130.81 Hz) to C5 (523.25 Hz)
        const freq = 130.81 * Math.pow(2, 2 * quantNorm);

        phase += (2 * Math.PI * freq) / audioSampleRate;
        if (phase > 2 * Math.PI) phase -= 2 * Math.PI;

        // Rich electronic tone with fundamental + subtle overtone
        const tone = 0.72 * Math.sin(phase) + 0.28 * Math.sin(2 * phase);

        // Anti-click envelope
        const env = i < 600 ? i / 600 : (frameCount - i < 600 ? (frameCount - i) / 600 : 1);
        data[i] = tone * 0.32 * env;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();

      const startTime = performance.now();
      const playbackMs = duration * 1000;

      function animPlayhead(now) {
        const elapsed = now - startTime;
        soundState.playheadRatio = Math.min(1, elapsed / playbackMs);
        renderSoundWave();

        if (soundState.playheadRatio < 1 && soundState.isPlaying) {
          soundState.playheadAnimId = requestAnimationFrame(animPlayhead);
        } else {
          soundState.isPlaying = false;
          soundState.playheadRatio = -1;
          renderSoundWave();
          if (DOM.btnPlaySound) DOM.btnPlaySound.textContent = '🔊 Play Melody & Steps (2s)';
          if (DOM.soundPlayheadStatus) DOM.soundPlayheadStatus.textContent = 'IDLE • CLICK PLAY TO HEAR';
        }
      }

      soundState.playheadAnimId = requestAnimationFrame(animPlayhead);

      source.onended = () => {
        soundState.isPlaying = false;
        soundState.playheadRatio = -1;
        renderSoundWave();
        if (DOM.btnPlaySound) DOM.btnPlaySound.textContent = '🔊 Play Melody & Steps (2s)';
        if (DOM.soundPlayheadStatus) DOM.soundPlayheadStatus.textContent = 'IDLE • CLICK PLAY TO HEAR';
      };
    } catch (err) {
      console.warn('Web Audio error:', err);
      soundState.isPlaying = false;
      soundState.playheadRatio = -1;
      renderSoundWave();
      if (DOM.btnPlaySound) DOM.btnPlaySound.textContent = '🔊 Play Melody & Steps (2s)';
    }
  }

  function setupSoundEvents() {
    // Rate Buttons
    if (DOM.soundRateButtons) {
      DOM.soundRateButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          DOM.soundRateButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          soundState.sampleRate = parseInt(btn.getAttribute('data-rate'), 10);
          updateSoundCalculations();
        });
      });
    }

    // Depth Buttons
    if (DOM.soundDepthButtons) {
      DOM.soundDepthButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          DOM.soundDepthButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          soundState.bitDepth = parseInt(btn.getAttribute('data-depth'), 10);
          updateSoundCalculations();
        });
      });
    }

    // Waveform / Sample Buttons
    if (DOM.soundWaveButtons) {
      DOM.soundWaveButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          DOM.soundWaveButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          soundState.waveform = btn.getAttribute('data-wave') || 'flute';
          renderSoundWave();
        });
      });
    }

    // Channels Buttons
    if (DOM.soundChannelButtons) {
      DOM.soundChannelButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          DOM.soundChannelButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          soundState.channels = parseInt(btn.getAttribute('data-channels'), 10);
          updateSoundCalculations();
        });
      });
    }

    // Duration Slider
    if (DOM.soundDurationInput) {
      DOM.soundDurationInput.addEventListener('input', (e) => {
        soundState.duration = parseInt(e.target.value, 10);
        updateSoundCalculations();
      });
    }

    // Play Sound Button
    if (DOM.btnPlaySound) {
      DOM.btnPlaySound.addEventListener('click', playQuantizedSound);
    }

    // Interactive Custom Waveform Drawing on Canvas (Mouse & Touch)
    const canvas = DOM.soundWaveCanvas;
    if (canvas) {
      function startDraw(e) {
        e.preventDefault();
        soundState.isDrawingWave = true;
        soundState.waveform = 'custom';
        soundState.customWavePoints = new Array(100).fill(0);

        if (DOM.soundWaveButtons) {
          DOM.soundWaveButtons.forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-wave') === 'custom');
          });
        }
        recordDrawPoint(e);
      }

      function moveDraw(e) {
        if (!soundState.isDrawingWave) return;
        e.preventDefault();
        recordDrawPoint(e);
      }

      function endDraw() {
        if (!soundState.isDrawingWave) return;
        soundState.isDrawingWave = false;
        renderSoundWave();
      }

      function recordDrawPoint(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const padding = 45;
        const graphWidth = rect.width - padding * 2;
        const drawHeight = rect.height - padding * 2;

        const t = Math.max(0, Math.min(1, (x - padding) / graphWidth));
        const v = -((y - rect.height / 2) / (drawHeight / 2));
        const clampedV = Math.max(-1, Math.min(1, v));

        const ptIdx = Math.floor(t * (soundState.customWavePoints.length - 1));
        soundState.customWavePoints[ptIdx] = clampedV;

        // Smooth neighbouring points
        if (ptIdx > 0 && soundState.customWavePoints[ptIdx - 1] === 0) {
          soundState.customWavePoints[ptIdx - 1] = clampedV * 0.8;
        }
        if (ptIdx < soundState.customWavePoints.length - 1 && soundState.customWavePoints[ptIdx + 1] === 0) {
          soundState.customWavePoints[ptIdx + 1] = clampedV * 0.8;
        }

        renderSoundWave();
      }

      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', moveDraw);
      window.addEventListener('mouseup', endDraw);

      canvas.addEventListener('touchstart', startDraw, { passive: false });
      canvas.addEventListener('touchmove', moveDraw, { passive: false });
      window.addEventListener('touchend', endDraw);
    }
  }

  // =========================================================================
  // 8B. VOICE & MICROPHONE AUDIO DEGRADATION LAB
  // =========================================================================

  function initVoiceLab() {
    generateVoicePreset('speech');

    // Preset buttons
    if (DOM.voicePresetButtons) {
      DOM.voicePresetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          DOM.voicePresetButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const p = btn.getAttribute('data-preset');
          voiceLabState.preset = p;
          generateVoicePreset(p);
        });
      });
    }

    // Rate buttons
    if (DOM.voiceRateButtons) {
      DOM.voiceRateButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          DOM.voiceRateButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          voiceLabState.sampleRate = parseInt(btn.getAttribute('data-rate'), 10);
          processVoiceAudio();
        });
      });
    }

    // Depth buttons
    if (DOM.voiceDepthButtons) {
      DOM.voiceDepthButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          DOM.voiceDepthButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          voiceLabState.bitDepth = parseInt(btn.getAttribute('data-depth'), 10);
          processVoiceAudio();
        });
      });
    }

    // Record voice button
    if (DOM.btnRecordVoice) {
      DOM.btnRecordVoice.addEventListener('click', startVoiceRecording);
    }

    // Play processed voice button
    if (DOM.btnPlayVoice) {
      DOM.btnPlayVoice.addEventListener('click', playVoiceAudio);
    }
  }

  function decodeWavBase64(base64Str, targetSampleRate = 44100) {
    try {
      const binary = atob(base64Str);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const view = new DataView(bytes.buffer);
      let offset = 12;
      let sampleRate = 22050;
      let bitsPerSample = 16;
      let numChannels = 1;
      let dataOffset = 44;
      let dataLen = bytes.length - 44;

      while (offset < bytes.length - 8) {
        const chunkId = String.fromCharCode(bytes[offset], bytes[offset+1], bytes[offset+2], bytes[offset+3]);
        const chunkSize = view.getUint32(offset + 4, true);
        if (chunkId === 'fmt ') {
          numChannels = view.getUint16(offset + 8 + 2, true);
          sampleRate = view.getUint32(offset + 8 + 4, true);
          bitsPerSample = view.getUint16(offset + 8 + 14, true);
        } else if (chunkId === 'data') {
          dataOffset = offset + 8;
          dataLen = chunkSize;
          break;
        }
        offset += 8 + chunkSize;
      }

      const numSamples = Math.floor(dataLen / ((bitsPerSample / 8) * numChannels));
      const srcFloats = new Float32Array(numSamples);
      if (bitsPerSample === 16) {
        for (let i = 0; i < numSamples; i++) {
          const val = view.getInt16(dataOffset + i * 2 * numChannels, true);
          srcFloats[i] = val / 32768.0;
        }
      }

      // Resample to targetSampleRate using linear interpolation
      const ratio = sampleRate / targetSampleRate;
      const outLen = Math.floor(numSamples / ratio);
      const outFloats = new Float32Array(outLen);
      for (let i = 0; i < outLen; i++) {
        const srcPos = i * ratio;
        const idx = Math.floor(srcPos);
        const frac = srcPos - idx;
        const s0 = srcFloats[idx] || 0;
        const s1 = (idx + 1 < numSamples) ? srcFloats[idx + 1] : s0;
        outFloats[i] = s0 + frac * (s1 - s0);
      }
      return outFloats;
    } catch (e) {
      console.warn('WAV decoding fallback:', e);
      return null;
    }
  }

  function generateVoicePreset(presetType) {
    const sr = 44100;
    const dur = 2.0;
    const len = Math.floor(sr * dur);
    const buf = new Float32Array(len);

    if (presetType === 'speech') {
      if (window.REAL_SPEECH_WAV_BASE64) {
        const decoded = decodeWavBase64(window.REAL_SPEECH_WAV_BASE64, sr);
        if (decoded && decoded.length > 0) {
          // Place into 2.0s buffer with natural centering
          const targetBuf = new Float32Array(len);
          const copyLen = Math.min(len, decoded.length);
          for (let i = 0; i < copyLen; i++) {
            targetBuf[i] = decoded[i];
          }
          voiceLabState.sourceBuffer = targetBuf;
          processVoiceAudio();
          return;
        }
      }
    }

    if (presetType === 'melody') {
      // 2.0s Retro Chiptune Arpeggio Melody (C -> G -> Am -> F)
      const chords = [
        [261.63, 329.63, 392.00, 523.25], // C maj
        [196.00, 246.94, 293.66, 392.00], // G maj
        [220.00, 261.63, 329.63, 440.00], // A min
        [174.61, 220.00, 261.63, 349.23]  // F maj
      ];
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const chordIdx = Math.min(3, Math.floor(t / 0.5));
        const chordTime = t % 0.5;
        const noteIdx = Math.floor(chordTime / 0.125);
        const freq = chords[chordIdx][noteIdx];
        const noteTime = chordTime % 0.125;
        const env = Math.exp(-noteTime * 12);
        const phase = (freq * noteTime) % 1;
        const pulse = phase < 0.35 ? 0.6 : -0.6;
        const bass = Math.sin(2 * Math.PI * (freq / 2) * noteTime) * 0.3;
        buf[i] = (pulse + bass) * env * 0.7;
      }
      voiceLabState.sourceBuffer = buf;
      processVoiceAudio();
      return;
    }

    if (presetType === 'drum') {
      // 2.0s Rhythmic Beat (Kick, Snare, Hi-hat)
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        let s = 0;

        // Kick drum at 0.0s, 1.0s, 1.25s
        [0.0, 1.0, 1.25].forEach(start => {
          if (t >= start && t < start + 0.3) {
            const dt = t - start;
            const freq = 130 * Math.exp(-dt * 25) + 45;
            const env = Math.exp(-dt * 15);
            s += Math.sin(2 * Math.PI * freq * dt) * env * 0.7;
          }
        });

        // Snare drum at 0.5s and 1.5s
        [0.5, 1.5].forEach(start => {
          if (t >= start && t < start + 0.28) {
            const dt = t - start;
            const noise = (Math.random() * 2 - 1) * Math.exp(-dt * 18);
            const tone = Math.sin(2 * Math.PI * 185 * dt) * Math.exp(-dt * 25) * 0.4;
            s += (noise + tone) * 0.6;
          }
        });

        // Hi-hat every 0.25s
        for (let beat = 0; beat < 8; beat++) {
          const start = beat * 0.25;
          if (t >= start && t < start + 0.08) {
            const dt = t - start;
            const hatNoise = (Math.random() * 2 - 1) * Math.exp(-dt * 65) * 0.25;
            s += hatNoise;
          }
        }

        buf[i] = Math.max(-1, Math.min(1, s));
      }
    } else {
      // Acoustic Sine chord sweep
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const env = Math.sin((t / dur) * Math.PI);
        const f1 = Math.sin(2 * Math.PI * 440 * t);
        const f2 = Math.sin(2 * Math.PI * 554.37 * t) * 0.8;
        const f3 = Math.sin(2 * Math.PI * 659.25 * t) * 0.6;
        buf[i] = (f1 + f2 + f3) * 0.3 * env;
      }
    }

    voiceLabState.sourceBuffer = buf;
    processVoiceAudio();
  }

  function startVoiceRecording() {
    if (voiceLabState.isRecording) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone access is not supported by your browser in this mode. Switching to built-in Speech preset!');
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!voiceLabState.audioCtx) voiceLabState.audioCtx = new AudioCtx();
    const ctx = voiceLabState.audioCtx;
    if (ctx.state === 'suspended') ctx.resume();

    if (DOM.recordVoiceText) DOM.recordVoiceText.textContent = 'Listening (2.0s)...';
    if (DOM.recordMicIcon) DOM.recordMicIcon.textContent = '🎙️⚡';
    if (DOM.voiceAudioStatus) DOM.voiceAudioStatus.textContent = 'RECORDING 2 SECONDS...';
    voiceLabState.isRecording = true;

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const source = ctx.createMediaStreamSource(stream);
      const bufferLen = Math.floor(ctx.sampleRate * 2.0);
      const recorded = new Float32Array(bufferLen);
      let recordedIdx = 0;

      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        if (!voiceLabState.isRecording) return;
        const input = e.inputBuffer.getChannelData(0);
        for (let j = 0; j < input.length && recordedIdx < bufferLen; j++) {
          recorded[recordedIdx++] = input[j];
        }
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      setTimeout(() => {
        voiceLabState.isRecording = false;
        processor.disconnect();
        source.disconnect();
        stream.getTracks().forEach(t => t.stop());

        const finalBuf = new Float32Array(44100 * 2);
        const ratio = ctx.sampleRate / 44100;
        let maxAmp = 0.001;

        for (let i = 0; i < finalBuf.length; i++) {
          const srcIdx = Math.floor(i * ratio);
          const v = srcIdx < recorded.length ? recorded[srcIdx] : 0;
          finalBuf[i] = v;
          if (Math.abs(v) > maxAmp) maxAmp = Math.abs(v);
        }

        const gain = Math.min(5.0, 0.85 / maxAmp);
        for (let i = 0; i < finalBuf.length; i++) {
          finalBuf[i] = Math.max(-1, Math.min(1, finalBuf[i] * gain));
        }

        voiceLabState.sourceBuffer = finalBuf;
        voiceLabState.preset = 'mic';

        if (DOM.voicePresetButtons) {
          DOM.voicePresetButtons.forEach(b => b.classList.remove('active'));
        }
        if (DOM.recordVoiceText) DOM.recordVoiceText.textContent = 'Record Again (2s)';
        if (DOM.recordMicIcon) DOM.recordMicIcon.textContent = '🔴';
        if (DOM.voiceAudioStatus) DOM.voiceAudioStatus.textContent = 'VOICE RECORDED • READY';

        processVoiceAudio();
      }, 2000);

    }).catch(err => {
      console.warn('Microphone permission blocked or unavailable:', err);
      voiceLabState.isRecording = false;
      if (DOM.recordVoiceText) DOM.recordVoiceText.textContent = 'Record My Voice (2s)';
      if (DOM.recordMicIcon) DOM.recordMicIcon.textContent = '🔴';
      if (DOM.voiceAudioStatus) DOM.voiceAudioStatus.textContent = 'MIC UNAVAILABLE • USING SPEECH';
      alert('Microphone access was denied or not found. Falling back to the built-in Speech preset!');
      generateVoicePreset('speech');
    });
  }

  function processVoiceAudio() {
    if (!voiceLabState.sourceBuffer) return;

    const src = voiceLabState.sourceBuffer;
    const len = src.length;
    const dst = new Float32Array(len);

    const targetRate = voiceLabState.sampleRate; // 44100, 11025, 8000, 2500
    const targetDepth = voiceLabState.bitDepth;   // 16, 8, 4, 2, 1
    const levels = Math.pow(2, targetDepth);

    // Hardware ADC Decimation (Sample-and-Hold step)
    const step = Math.max(1, Math.round(44100 / targetRate));

    for (let i = 0; i < len; i += step) {
      const heldRaw = src[i];

      // Quantize to target bit depth
      const norm = Math.max(0, Math.min(1, (heldRaw + 1) / 2));
      const quantNorm = Math.round(norm * (levels - 1)) / (levels - 1);
      const quantVal = quantNorm * 2 - 1;

      // Fill sample-and-hold block
      const blockEnd = Math.min(len, i + step);
      for (let j = i; j < blockEnd; j++) {
        dst[j] = quantVal;
      }
    }

    voiceLabState.processedBuffer = dst;

    // File Size Calculations (Formula: Rate × Depth × 2.0s × 1)
    const totalBits = targetRate * targetDepth * 2;
    const totalBytes = Math.ceil(totalBits / 8);
    const kB = (totalBytes / 1000).toFixed(1);
    const baselineBytes = 176400; // 44100 * 16 * 2 / 8
    const savings = (((baselineBytes - totalBytes) / baselineBytes) * 100).toFixed(1);

    if (DOM.voiceFileSizeDisplay) {
      DOM.voiceFileSizeDisplay.textContent = `${kB} kB (${totalBytes.toLocaleString()} Bytes)`;
    }
    if (DOM.voiceFileSavings) {
      if (targetRate === 44100 && targetDepth === 16) {
        DOM.voiceFileSavings.textContent = 'Baseline Studio CD Quality (16-bit at 44.1 kHz, Mono)';
      } else {
        DOM.voiceFileSavings.textContent = `${savings}% file size saved vs Studio CD (176.4 kB)`;
      }
    }

    // Audio Explanations (AQA §3.3.4)
    const rateExplanations = {
      44100: 'Full Treble & Clarity (All frequencies up to 22 kHz preserved)',
      11025: 'Muffled Treble (Frequencies above 5.5 kHz cut off, sounds like FM radio)',
      8000: 'Landline Telephone (Frequencies above 4 kHz removed, intelligible but hollow)',
      2500: 'Walkie-Talkie / Intercom (Severe frequency loss, robotic aliased burble)'
    };

    const depthExplanations = {
      16: 'Zero audible quantization noise (High-Fidelity Studio).',
      8: 'Faint background tape hiss in quiet moments (1990s CD-ROM / VGA era).',
      4: 'Noticeable crunchy arcade quantization step buzzing.',
      2: 'Harsh distortion quantized into only 4 discrete volume levels.',
      1: 'Extreme 1-bit binary clipping (only 2 states: max +1 or -1). <span style="display:block; margin-top:6px; padding:8px 12px; background:rgba(16,185,129,0.12); border-left:3px solid #10b981; border-radius:4px; color:var(--text-primary); font-size:11.5px; line-height:1.45;"><strong>🧠 Why can you still understand words at 1-bit?</strong> 1-bit quantization strips all volume dynamics (turning everything into harsh square waves), but preserves the exact <em>timing of zero-crossings</em> (frequency transitions of your vocal tract formants). In 1948, acoustic scientists proved infinite-clipped 1-bit speech remains over 90% intelligible to human ears!</span>'
    };

    if (DOM.voicePerceptionNote) {
      DOM.voicePerceptionNote.innerHTML = `
        <strong>Sample Rate Effect:</strong> ${rateExplanations[targetRate] || ''}<br>
        <strong>Bit Depth Effect:</strong> ${depthExplanations[targetDepth] || ''}
      `;
    }

    renderVoiceWave();
  }

  function renderVoiceWave() {
    const canvas = DOM.voiceWaveCanvas;
    if (!canvas || !voiceLabState.processedBuffer) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Center baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    const data = voiceLabState.processedBuffer;
    const step = data.length / width;

    // Draw waveform gradient
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#10b981');
    grad.addColorStop(0.5, '#06b6d4');
    grad.addColorStop(1, '#6366f1');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const idx = Math.floor(x * step);
      const val = data[idx] || 0;
      const y = height / 2 - val * (height * 0.42);

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Playhead sweep cursor
    if (voiceLabState.isPlaying && voiceLabState.playheadRatio >= 0 && voiceLabState.playheadRatio <= 1) {
      const px = voiceLabState.playheadRatio * width;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(px, height / 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function playVoiceAudio() {
    if (voiceLabState.isPlaying || !voiceLabState.processedBuffer) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!voiceLabState.audioCtx) voiceLabState.audioCtx = new AudioCtx();
      const ctx = voiceLabState.audioCtx;
      if (ctx.state === 'suspended') ctx.resume();

      voiceLabState.isPlaying = true;
      if (DOM.btnPlayVoice) DOM.btnPlayVoice.textContent = '⏹️ Playing...';
      if (DOM.voiceAudioStatus) DOM.voiceAudioStatus.textContent = 'PLAYING PROCESSED CLIP (2.0s)';

      const duration = 2.0;
      const sr = 44100;
      const buffer = ctx.createBuffer(1, voiceLabState.processedBuffer.length, sr);
      buffer.getChannelData(0).set(voiceLabState.processedBuffer);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();

      const startTime = performance.now();
      const playbackMs = duration * 1000;

      function animVoicePlayhead(now) {
        const elapsed = now - startTime;
        voiceLabState.playheadRatio = Math.min(1, elapsed / playbackMs);
        renderVoiceWave();

        if (voiceLabState.playheadRatio < 1 && voiceLabState.isPlaying) {
          voiceLabState.playheadAnimId = requestAnimationFrame(animVoicePlayhead);
        } else {
          voiceLabState.isPlaying = false;
          voiceLabState.playheadRatio = -1;
          renderVoiceWave();
          if (DOM.btnPlayVoice) DOM.btnPlayVoice.textContent = '▶️ Play Processed Audio';
          if (DOM.voiceAudioStatus) DOM.voiceAudioStatus.textContent = 'READY • PRESS PLAY';
        }
      }

      voiceLabState.playheadAnimId = requestAnimationFrame(animVoicePlayhead);

      source.onended = () => {
        voiceLabState.isPlaying = false;
        voiceLabState.playheadRatio = -1;
        renderVoiceWave();
        if (DOM.btnPlayVoice) DOM.btnPlayVoice.textContent = '▶️ Play Processed Audio';
        if (DOM.voiceAudioStatus) DOM.voiceAudioStatus.textContent = 'READY • PRESS PLAY';
      };
    } catch (err) {
      console.warn('Voice playback error:', err);
      voiceLabState.isPlaying = false;
      voiceLabState.playheadRatio = -1;
      renderVoiceWave();
      if (DOM.btnPlayVoice) DOM.btnPlayVoice.textContent = '▶️ Play Processed Audio';
    }
  }

  // =========================================================================
  // 9. COMPARISON MODE CANVASES & NETWORK TRANSFER
  // =========================================================================

  function renderComparisonCanvases() {
    drawCompareCanvas('A', DOM.compareResA, DOM.compareDepthA, DOM.compareCanvasA, DOM.comparePixelsA, DOM.compareColoursA, DOM.compareBytesA, DOM.compareBitsA);
    drawCompareCanvas('B', DOM.compareResB, DOM.compareDepthB, DOM.compareCanvasB, DOM.comparePixelsB, DOM.compareColoursB, DOM.compareBytesB, DOM.compareBitsB);
    updateTransferSimulation();
  }

  function drawCompareCanvas(label, selectRes, selectDepth, canvas, txtPx, txtCol, txtBytes, txtBits) {
    if (!canvas) return;
    const res = parseInt(selectRes.value, 10);
    const depth = parseInt(selectDepth.value, 10);
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const totalPixels = res * res;
    const totalBits = totalPixels * depth;
    const totalBytes = Math.ceil(totalBits / 8);
    const maxColors = Math.pow(2, depth);

    if (txtPx) txtPx.textContent = totalPixels.toLocaleString();
    if (txtCol) txtCol.textContent = depth === 24 ? '16.7M' : maxColors.toLocaleString();
    if (txtBytes) txtBytes.textContent = totalBytes >= 1000 ? `${(totalBytes / 1000).toFixed(2)} kB` : `${totalBytes} B`;
    if (txtBits) txtBits.textContent = `${totalBits.toLocaleString()} bits`;

    const block = width / res;
    const subj = DOM.compareSubjectSelect ? DOM.compareSubjectSelect.value : 'parrot';

    for (let r = 0; r < res; r++) {
      for (let c = 0; c < res; c++) {
        let normR = 0, normG = 0, normB = 0;

        if (subj === 'parrot') {
          const u = c / res;
          const v = r / res;
          const dx = u - 0.42;
          const dy = v - 0.35;
          const distHead = Math.sqrt(dx * dx + dy * dy);

          // Curved golden beak
          if (u >= 0.46 && u <= 0.74 && v >= 0.30 && v <= 0.50) {
            const beakMid = 0.32 + Math.pow((u - 0.46) / 0.28, 1.8) * 0.16;
            if (v >= beakMid - 0.08 && v <= beakMid + 0.08) {
              if (u > 0.68) { normR = 30; normG = 25; normB = 20; }
              else { normR = 255; normG = 195; normB = 10; }
            }
          }

          if (normR === 0 && normG === 0 && normB === 0) {
            // White eye patch with black pupil
            const eyeDx = u - 0.39;
            const eyeDy = v - 0.30;
            const distEye = Math.sqrt(eyeDx * eyeDx + eyeDy * eyeDy);
            if (distEye < 0.038) {
              normR = 10; normG = 10; normB = 15;
            } else if (distEye < 0.08) {
              normR = 245; normG = 245; normB = 240;
            } else if (distHead < 0.22) {
              normR = 235; normG = 30; normB = 30; // scarlet head
            } else if (v >= 0.44 && v <= 0.84 && u >= 0.24 && u <= 0.58) {
              if (u < 0.36) { normR = 25; normG = 90; normB = 225; } // blue wing
              else if (v < 0.62) { normR = 255; normG = 195; normB = 0; } // gold stripe
              else { normR = 220; normG = 30; normB = 30; } // scarlet body
            } else if (v > 0.82 && u >= 0.22 && u <= 0.40) {
              normR = 20; normG = 80; normB = 210; // blue tail
            } else {
              // Tropical jungle foliage
              const leaf = Math.sin(u * 12 + v * 8) * 25;
              normR = Math.max(0, Math.min(255, Math.floor(15 + leaf)));
              normG = Math.max(0, Math.min(255, Math.floor(100 + leaf * 1.5)));
              normB = Math.max(0, Math.min(255, Math.floor(55 + leaf)));
            }
          }
        } else if (subj === 'arcade') {
          const u = c / res;
          const v = r / res;
          if (v < 0.16) {
            normR = (u >= 0.2 && u <= 0.8) ? 255 : 25;
            normG = (u >= 0.2 && u <= 0.8) ? 20 : 25;
            normB = (u >= 0.2 && u <= 0.8) ? 147 : 35;
          } else if (v >= 0.16 && v <= 0.58 && u >= 0.20 && u <= 0.80) {
            if (v >= 0.22 && v <= 0.52 && u >= 0.26 && u <= 0.74) {
              const su = Math.floor((u - 0.26) / 0.48 * 8);
              const sv = Math.floor((v - 0.22) / 0.30 * 6);
              const invader = [
                0,1,0,0,0,0,1,0,
                0,0,1,1,1,1,0,0,
                0,1,1,1,1,1,1,0,
                1,1,0,1,1,0,1,1,
                1,1,1,1,1,1,1,1,
                0,1,0,1,1,0,1,0
              ];
              if (invader[sv * 8 + su]) {
                normR = 0; normG = 255; normB = 130;
              } else {
                normR = 15; normG = 20; normB = 45;
              }
            } else {
              normR = 45; normG = 50; normB = 65;
            }
          } else if (v > 0.58 && v <= 0.72 && u >= 0.18 && u <= 0.82) {
            if (Math.abs(u - 0.38) < 0.05 && Math.abs(v - 0.65) < 0.05) { normR = 255; normG = 50; normB = 50; }
            else if (Math.abs(u - 0.58) < 0.04 && Math.abs(v - 0.64) < 0.04) { normR = 50; normG = 150; normB = 255; }
            else if (Math.abs(u - 0.68) < 0.04 && Math.abs(v - 0.64) < 0.04) { normR = 255; normG = 220; normB = 50; }
            else { normR = 75; normG = 80; normB = 95; }
          } else if (v > 0.72 && u >= 0.20 && u <= 0.80) {
            if (Math.abs(u - 0.5) < 0.1 && v >= 0.78 && v <= 0.88) { normR = 255; normG = 165; normB = 0; }
            else { normR = 35; normG = 38; normB = 50; }
          } else {
            normR = 12; normG = 15; normB = 24;
          }
        } else if (subj === 'sunset') {
          const u = c / res;
          const v = r / res;
          const dx = u - 0.5;
          const dy = (v - 0.44) * 1.1;
          const distSun = Math.sqrt(dx * dx + dy * dy);
          const mtnHeight = 0.54 + 0.12 * Math.sin(u * 7) + 0.08 * Math.cos(u * 13);
          if (distSun < 0.15) {
            normR = 255; normG = 235; normB = 60;
          } else if (v >= mtnHeight && v < 0.70) {
            normR = 40; normG = 30; normB = 68;
          } else if (v >= 0.70) {
            const rip = Math.sin((v - 0.70) * 45 + u * 12) * 18;
            normR = Math.max(0, Math.min(255, Math.floor(20 + rip)));
            normG = Math.max(0, Math.min(255, Math.floor(45 + rip)));
            normB = Math.max(0, Math.min(255, Math.floor(130 + rip)));
          } else {
            normR = Math.floor(255 * (1 - v * 0.75));
            normG = Math.floor(125 * (1 - v * 0.85));
            normB = Math.floor(190 * v + 35);
          }
        } else {
          // alien hero
          const normRow = Math.floor((r / res) * 16);
          const normCol = Math.floor((c / res) * 16);
          const idx = normRow * 16 + normCol;
          const hexCol = PRESETS_HIGHRES.alien[idx] || '#000000';
          const rgb = hexToRgb(hexCol);
          normR = rgb.r;
          normG = rgb.g;
          normB = rgb.b;
        }

        let finalHex = '#000000';
        if (depth === 24) {
          finalHex = '#' + [normR, normG, normB].map(x => x.toString(16).padStart(2, '0')).join('');
        } else {
          const palIdx = getClosestPaletteIndex(normR, normG, normB, depth);
          finalHex = PALETTES[depth][palIdx].hex;
        }

        ctx.fillStyle = finalHex;
        ctx.fillRect(c * block, r * block, block, block);
      }
    }
  }

  function updateTransferSimulation() {
    const resA = parseInt(DOM.compareResA.value, 10);
    const depthA = parseInt(DOM.compareDepthA.value, 10);
    const bitsA = resA * resA * depthA;

    const resB = parseInt(DOM.compareResB.value, 10);
    const depthB = parseInt(DOM.compareDepthB.value, 10);
    const bitsB = resB * resB * depthB;

    let speedBps = 10000000;
    DOM.speedButtons.forEach(b => {
      if (b.classList.contains('active')) {
        speedBps = parseInt(b.getAttribute('data-speed'), 10);
      }
    });

    const timeA = (bitsA / speedBps).toFixed(4);
    const timeB = (bitsB / speedBps).toFixed(4);

    if (DOM.transferTimeA) DOM.transferTimeA.textContent = `${timeA} s`;
    if (DOM.transferTimeB) DOM.transferTimeB.textContent = `${timeB} s`;
  }

  // =========================================================================
  // 10. EVENT LISTENERS SETUP
  // =========================================================================

  function setupEventListeners() {
    // Grid Size Select
    if (DOM.gridSizeSelect) {
      DOM.gridSizeSelect.addEventListener('change', (e) => {
        state.gridSize = parseInt(e.target.value, 10);
        initGridData();
      });
    }

    // Depth Buttons
    if (DOM.depthButtons) {
      DOM.depthButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const d = parseInt(btn.getAttribute('data-depth'), 10);
          setColourDepth(d);
        });
      });
    }

    // Tool Buttons
    if (DOM.toolPaintBtn) {
      DOM.toolPaintBtn.addEventListener('click', () => {
        state.activeTool = 'paint';
        updateToolButtons();
      });
    }
    if (DOM.toolEraserBtn) {
      DOM.toolEraserBtn.addEventListener('click', () => {
        state.activeTool = 'eraser';
        updateToolButtons();
      });
    }
    if (DOM.toolFillBtn) {
      DOM.toolFillBtn.addEventListener('click', () => {
        state.activeTool = 'fill';
        updateToolButtons();
      });
    }

    // Preset Buttons
    if (DOM.presetButtons) {
      DOM.presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const presetName = btn.getAttribute('data-preset');
          applyPreset(presetName);
        });
      });
    }

    // Metadata Toggle
    if (DOM.metadataToggle) {
      DOM.metadataToggle.addEventListener('change', (e) => {
        state.includeMetadata = e.target.checked;
        DOM.metadataBreakdown.style.display = state.includeMetadata ? 'block' : 'none';
        updateCalculationsAndStreams();
      });
    }

    // Copy Binary Button
    if (DOM.copyBinaryBtn) {
      DOM.copyBinaryBtn.addEventListener('click', () => {
        let textToCopy = '';
        Array.from(DOM.binaryStreamOutput.children).forEach(span => {
          textToCopy += span.textContent + ' ';
        });
        navigator.clipboard.writeText(textToCopy.trim()).then(() => {
          const orig = DOM.copyBinaryBtn.textContent;
          DOM.copyBinaryBtn.textContent = '✓ Copied!';
          setTimeout(() => {
            DOM.copyBinaryBtn.textContent = orig;
          }, 1500);
        });
      });
    }

    // Comparison Selectors
    ['compareSubjectSelect', 'compareResA', 'compareDepthA', 'compareResB', 'compareDepthB'].forEach(id => {
      if (DOM[id]) {
        DOM[id].addEventListener('change', renderComparisonCanvases);
      }
    });

    if (DOM.speedButtons) {
      DOM.speedButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          DOM.speedButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          updateTransferSimulation();
        });
      });
    }

    if (DOM.simulateTransferBtn) {
      DOM.simulateTransferBtn.addEventListener('click', () => {
        if (DOM.transferBarA) {
          DOM.transferBarA.style.width = '0%';
          setTimeout(() => { DOM.transferBarA.style.width = '100%'; }, 50);
        }
        if (DOM.transferBarB) {
          DOM.transferBarB.style.width = '0%';
          setTimeout(() => { DOM.transferBarB.style.width = '100%'; }, 50);
        }
      });
    }

    setupSoundEvents();
  }

  // =========================================================================
  // 11. INITIALIZATION ENTRYPOINT
  // =========================================================================

  function init() {
    initTheme();
    initTabs();
    setupEventListeners();
    renderPalette();
    initGridData();
    initPhotoLab();
    renderComparisonCanvases();
    updateSoundCalculations();
    initVoiceLab();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
