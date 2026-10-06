/**
 * Random Lab & PRNG Seeds Engine
 * AQA GCSE Computer Science
 * Deterministic Pseudo-Random Number Generation Workbench
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. DETERMINISTIC PRNG CORE (Mulberry32 Algorithm)
  // =========================================================================
  // A true deterministic 32-bit PRNG that behaves 100% identically across
  // all operating systems, CPU architectures, and JavaScript runtimes.
  class SeededPRNG {
    constructor(seedInput) {
      this.initialSeed = seedInput;
      this.state = this.hashSeed(seedInput);
      this.callCount = 0;
    }

    hashSeed(input) {
      if (typeof input === 'number' && !isNaN(input)) {
        return (Math.floor(input) >>> 0) || 123456789;
      }
      const str = String(input || 'AQA-GCSE-CS');
      let h = 2166136261 >>> 0;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return (h >>> 0) || 123456789;
    }

    // Returns float between 0.0000000 and 0.9999999 (Equivalent to Math.random())
    next() {
      this.callCount++;
      let t = (this.state += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // Equivalent to AQA Pseudocode random_int(min, max) and Python random.randint(min, max)
    // Inclusive of both min and max!
    randint(min, max) {
      const r = this.next();
      return Math.floor(r * (max - min + 1)) + min;
    }

    // Float in range [min, max)
    uniform(min, max) {
      return min + this.next() * (max - min);
    }

    // Choose random element from array
    choice(arr) {
      if (!arr || arr.length === 0) return null;
      return arr[this.randint(0, arr.length - 1)];
    }

    // Boolean with given probability of true (0.0 to 1.0)
    chance(prob) {
      return this.next() < prob;
    }
  }

  // =========================================================================
  // 2. STATE & CONFIGURATION
  // =========================================================================
  const state = {
    currentMode: 'minecraft', // 'minecraft' | 'fractal' | 'cityscape'
    activeSeed: 'MINECRAFT-HEROBRINE-42',
    isAnimating: false,
    animFrameId: null,
    artData: null,
    hoveredItem: null
  };

  // Fun Procedural Seed Words for random rolls
  const SEED_PREFIXES = ['LUSH', 'DIAMOND', 'CYBER', 'COSMIC', 'EMERALD', 'GOLDEN', 'RETRO', 'NEON', 'MYSTIC', 'QUANTUM'];
  const SEED_NOUNS = ['CAVE', 'TREE', 'VALLEY', 'CREEPER', 'GALAXY', 'PIXEL', 'SKYLINE', 'BIOME', 'FRACTAL', 'HORIZON'];

  function getRandomSeedString() {
    const pr = SEED_PREFIXES[Math.floor(Math.random() * SEED_PREFIXES.length)];
    const no = SEED_NOUNS[Math.floor(Math.random() * SEED_NOUNS.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${pr}-${no}-${num}`;
  }

  // =========================================================================
  // 3. GENERATIVE ENGINE 1: MINECRAFT 2D VOXEL WORLD
  // =========================================================================
  function generateMinecraftWorld(seedStr) {
    const prng = new SeededPRNG(seedStr);
    const cols = 48; // 48 blocks wide (48 * 20 = 960px)
    const rows = 24; // 24 blocks high (24 * 20 = 480px)

    // Select Biome
    const biomes = [
      { name: 'Lush Forest', sky: ['#38bdf8', '#bae6fd'], surface: 'grass', treeChance: 0.28, oreBoost: 'coal' },
      { name: 'Snowy Taiga', sky: ['#93c5fd', '#e2e8f0'], surface: 'snow', treeChance: 0.35, oreBoost: 'iron' },
      { name: 'Desert Oasis', sky: ['#fdba74', '#fed7aa'], surface: 'sand', treeChance: 0.10, oreBoost: 'gold' },
      { name: 'Mountain Crag', sky: ['#60a5fa', '#bfdbfe'], surface: 'stone', treeChance: 0.15, oreBoost: 'diamond' }
    ];
    const biome = prng.choice(biomes);

    // Multi-octave terrain surface height map
    const surfaceHeights = [];
    const baseElevation = prng.randint(7, 10); // starting row for surface
    const waveFreq1 = prng.uniform(0.12, 0.22);
    const waveFreq2 = prng.uniform(0.04, 0.08);
    const phase1 = prng.uniform(0, Math.PI * 2);
    const phase2 = prng.uniform(0, Math.PI * 2);

    for (let c = 0; c < cols; c++) {
      const h1 = Math.sin(c * waveFreq1 + phase1) * 2.8;
      const h2 = Math.cos(c * waveFreq2 + phase2) * 2.2;
      const h = Math.round(baseElevation + h1 + h2);
      surfaceHeights.push(Math.max(4, Math.min(rows - 6, h)));
    }

    // Grid array: null for sky, or block object
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    let diamondCount = 0, ironCount = 0, goldCount = 0, coalCount = 0, caveBlocks = 0;

    // Build Underground & Terrain
    for (let c = 0; c < cols; c++) {
      const surfY = surfaceHeights[c];

      for (let r = surfY; r < rows; r++) {
        // Bedrock bottom row
        if (r === rows - 1) {
          grid[r][c] = { type: 'bedrock', name: 'Bedrock', depth: r - surfY };
          continue;
        }

        // Cave generation using pseudo-random cellular noise
        const depth = r - surfY;
        const caveChance = depth > 4 ? (depth > 8 ? 0.18 : 0.12) : 0.02;
        if (depth > 2 && r < rows - 2 && prng.chance(caveChance)) {
          // Hollow cave air pocket!
          caveBlocks++;
          continue;
        }

        // Surface layer
        if (r === surfY) {
          grid[r][c] = { type: biome.surface, name: biome.surface.toUpperCase(), depth: 0 };
        } else if (r <= surfY + 3) {
          // Subsurface dirt / sandstone
          const subType = biome.surface === 'sand' ? 'sandstone' : 'dirt';
          grid[r][c] = { type: subType, name: subType.toUpperCase(), depth };
        } else {
          // Deep Stone & Mineral Ores
          let oreType = 'stone';
          const oreRoll = prng.next();

          if (r >= rows - 5 && oreRoll < 0.065) {
            oreType = 'diamond';
            diamondCount++;
          } else if (r >= rows - 9 && oreRoll < 0.12) {
            oreType = 'gold';
            goldCount++;
          } else if (r >= surfY + 4 && oreRoll < 0.22) {
            oreType = 'iron';
            ironCount++;
          } else if (r >= surfY + 3 && oreRoll < 0.34) {
            oreType = 'coal';
            coalCount++;
          }

          grid[r][c] = { type: oreType, name: `${oreType.toUpperCase()} ORE`, depth };
        }
      }
    }

    // Place Surface Flora & Trees
    const trees = [];
    for (let c = 2; c < cols - 2; c++) {
      const surfY = surfaceHeights[c];
      // Check if spot is flat enough and not right next to another tree
      if (grid[surfY][c] && !grid[surfY - 1][c] && prng.chance(biome.treeChance)) {
        if (!trees.some(t => Math.abs(t.x - c) < 3)) {
          const treeHeight = prng.randint(3, 5);
          trees.push({ x: c, y: surfY, height: treeHeight, biome: biome.name });
          c += 2; // spacing
        }
      }
    }

    // Clouds in the sky
    const clouds = [];
    const cloudCount = prng.randint(4, 7);
    for (let i = 0; i < cloudCount; i++) {
      clouds.push({
        x: prng.randint(0, cols - 6),
        y: prng.randint(1, 3),
        w: prng.randint(4, 8)
      });
    }

    return {
      mode: 'minecraft',
      biome: biome.name,
      skyGrad: biome.sky,
      grid,
      cols,
      rows,
      surfaceHeights,
      trees,
      clouds,
      prngCalls: prng.callCount,
      stats: {
        'Biome': biome.name,
        'Diamond Ore': `${diamondCount} Blocks`,
        'Iron Ore': `${ironCount} Blocks`,
        'Gold Ore': `${goldCount} Blocks`,
        'Coal Ore': `${coalCount} Blocks`,
        'Cave Air': `${caveBlocks} Hollow Blocks`,
        'Trees Planted': `${trees.length} Trees`
      }
    };
  }

  // =========================================================================
  // 4. GENERATIVE ENGINE 2: FRACTAL BLOSSOM TREE
  // =========================================================================
  function generateFractalTree(seedStr) {
    const prng = new SeededPRNG(seedStr);

    const themes = [
      { name: 'Cherry Blossom (Sakura)', trunk: '#451a03', leaf: '#f472b6', leafGlow: '#ec4899', bg: ['#1e1b4b', '#0f172a'] },
      { name: 'Golden Autumn', trunk: '#78350f', leaf: '#f59e0b', leafGlow: '#d97706', bg: ['#1e293b', '#0f172a'] },
      { name: 'Lush Emerald Oak', trunk: '#3d2516', leaf: '#10b981', leafGlow: '#059669', bg: ['#06281e', '#071018'] },
      { name: 'Cyber Neon Bonsai', trunk: '#1e1b4b', leaf: '#06b6d4', leafGlow: '#a855f7', bg: ['#09090b', '#000000'] }
    ];
    const theme = prng.choice(themes);

    const trunkLength = prng.randint(95, 125);
    const branchAngleBase = prng.uniform(0.32, 0.52); // ~18 to 30 degrees
    const maxDepth = prng.randint(8, 10);
    const lengthDecay = prng.uniform(0.72, 0.78);
    const asymmetry = prng.uniform(-0.08, 0.08);

    // Recursively build tree branches
    const branches = [];
    const leaves = [];

    function buildBranch(x, y, length, angle, depth, thickness) {
      const endX = x + Math.sin(angle) * length;
      const endY = y - Math.cos(angle) * length;

      branches.push({ x1: x, y1: y, x2: endX, y2: endY, depth, thickness });

      if (depth >= maxDepth) {
        // Blossom leaves at tips
        const clusterSize = prng.randint(2, 5);
        for (let i = 0; i < clusterSize; i++) {
          leaves.push({
            x: endX + prng.uniform(-10, 10),
            y: endY + prng.uniform(-10, 10),
            r: prng.uniform(3, 6.5)
          });
        }
        return;
      }

      // Branch splits
      const leftAngle = angle - branchAngleBase + asymmetry + prng.uniform(-0.06, 0.06);
      const rightAngle = angle + branchAngleBase + asymmetry + prng.uniform(-0.06, 0.06);
      const nextLen = length * lengthDecay * prng.uniform(0.92, 1.08);
      const nextThick = Math.max(1, thickness * 0.7);

      buildBranch(endX, endY, nextLen, leftAngle, depth + 1, nextThick);
      buildBranch(endX, endY, nextLen, rightAngle, depth + 1, nextThick);

      // Occasional third middle branch
      if (depth < 4 && prng.chance(0.35)) {
        buildBranch(endX, endY, nextLen * 0.85, angle + prng.uniform(-0.15, 0.15), depth + 1, nextThick);
      }
    }

    buildBranch(480, 440, trunkLength, 0, 1, 14);

    return {
      mode: 'fractal',
      theme: theme.name,
      bgGrad: theme.bg,
      trunkColor: theme.trunk,
      leafColor: theme.leaf,
      leafGlow: theme.leafGlow,
      branches,
      leaves,
      prngCalls: prng.callCount,
      stats: {
        'Foliage Style': theme.name,
        'Fractal Depth': `${maxDepth} Generations`,
        'Branch Count': `${branches.length} Branches`,
        'Blossom Petals': `${leaves.length} Petals`,
        'Trunk Girth': '14 px base',
        'Branch Angle': `${(branchAngleBase * 57.3).toFixed(1)}°`
      }
    };
  }

  // =========================================================================
  // 5. GENERATIVE ENGINE 3: CYBERPUNK CITY SKYLINE
  // =========================================================================
  function generateCityscape(seedStr) {
    const prng = new SeededPRNG(seedStr);

    const moonTypes = ['Crescent Moon', 'Full Cyber Moon', 'Neon Blood Moon', 'Harvest Blue Moon'];
    const moonType = prng.choice(moonTypes);

    // Generate Skyscrapers
    const towers = [];
    let curX = 10;
    const neonColors = ['#06b6d4', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#a855f7'];

    while (curX < 950) {
      const w = prng.randint(45, 95);
      const h = prng.randint(180, 390);
      const roofStyle = prng.choice(['flat', 'spire', 'stepped', 'antenna']);
      const neonColor = prng.choice(neonColors);

      // Window grid matrix
      const cols = Math.floor((w - 12) / 10);
      const rows = Math.floor((h - 25) / 12);
      const windowDensity = prng.uniform(0.35, 0.75);

      const billboard = prng.chance(0.3) ? prng.choice(['PIXEL-CITY', 'CPU CORE', 'PRNG SEED', 'SRAM', 'NEO-CITY', 'PYTHON 3']) : null;

      towers.push({
        x: curX,
        y: 450 - h,
        w,
        h,
        roofStyle,
        neonColor,
        cols,
        rows,
        windowDensity,
        billboard
      });

      curX += w + prng.randint(4, 14);
    }

    // Stars in night sky
    const stars = [];
    const starCount = prng.randint(70, 130);
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: prng.randint(0, 960),
        y: prng.randint(0, 260),
        r: prng.uniform(0.8, 2.2),
        alpha: prng.uniform(0.3, 0.95)
      });
    }

    return {
      mode: 'cityscape',
      moonType,
      towers,
      stars,
      prngCalls: prng.callCount,
      stats: {
        'Moon Phase': moonType,
        'Skyscrapers': `${towers.length} Buildings`,
        'Night Sky': `${starCount} Stars`,
        'Tallest Spire': `${Math.max(...towers.map(t => t.h))} px`,
        'Neon Grid': 'Cyberpunk Spectrum',
        'Billboards': `${towers.filter(t => t.billboard).length} Holograms`
      }
    };
  }

  // =========================================================================
  // 6. CANVAS RENDERER & INTERACTION
  // =========================================================================
  function renderArtwork(artData, stepProgress = 1.0) {
    const canvas = document.getElementById('randomArtCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = 960, h = 480;

    ctx.clearRect(0, 0, w, h);

    if (artData.mode === 'minecraft') {
      renderMinecraftCanvas(ctx, artData, stepProgress);
    } else if (artData.mode === 'fractal') {
      renderFractalCanvas(ctx, artData, stepProgress);
    } else if (artData.mode === 'cityscape') {
      renderCityscapeCanvas(ctx, artData, stepProgress);
    }
  }

  // 6.1 Minecraft Renderer
  function renderMinecraftCanvas(ctx, data, progress) {
    const bw = 20; // 20px per block

    // Sky Background Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 480);
    sky.addColorStop(0, data.skyGrad[0]);
    sky.addColorStop(1, data.skyGrad[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 960, 480);

    // Fluffy Sun
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(840, 25, 45, 45);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (const cl of data.clouds) {
      ctx.fillRect(cl.x * bw, cl.y * bw, cl.w * bw, 18);
    }

    // Palette of Block Textures
    const PALETTE = {
      grass:     { base: '#15803d', top: '#22c55e', border: '#166534' },
      snow:      { base: '#e2e8f0', top: '#ffffff', border: '#cbd5e1' },
      sand:      { base: '#f59e0b', top: '#fbbf24', border: '#d97706' },
      dirt:      { base: '#78350f', top: '#92400e', border: '#451a03' },
      sandstone: { base: '#d97706', top: '#b45309', border: '#92400e' },
      stone:     { base: '#475569', top: '#64748b', border: '#334155' },
      coal:      { base: '#334155', speck: '#0f172a', border: '#1e293b' },
      iron:      { base: '#475569', speck: '#fed7aa', border: '#334155' },
      gold:      { base: '#475569', speck: '#fde047', border: '#334155' },
      diamond:   { base: '#334155', speck: '#38bdf8', border: '#0284c7' },
      bedrock:   { base: '#0f172a', speck: '#1e293b', border: '#020617' },
      wood:      { base: '#5c3a21', top: '#784d2b', border: '#3b2515' },
      leaves:    { base: '#166534', top: '#15803d', border: '#14532d' }
    };

    const maxRowToDraw = Math.floor(data.rows * progress);

    // Draw Grid Blocks
    for (let r = 0; r < data.rows; r++) {
      if (r > maxRowToDraw) break;

      for (let c = 0; c < data.cols; c++) {
        const blk = data.grid[r][c];
        if (!blk) continue;

        const bx = c * bw, by = r * bw;
        const pal = PALETTE[blk.type] || PALETTE.stone;

        // Block base fill
        ctx.fillStyle = pal.base;
        ctx.fillRect(bx, by, bw, bw);

        // Top edge accent
        if (pal.top) {
          ctx.fillStyle = pal.top;
          ctx.fillRect(bx, by, bw, 4);
        }

        // Ore Speckles
        if (pal.speck) {
          ctx.fillStyle = pal.speck;
          ctx.fillRect(bx + 4, by + 5, 4, 4);
          ctx.fillRect(bx + 11, by + 10, 5, 4);
          ctx.fillRect(bx + 5, by + 13, 3, 3);
          if (blk.type === 'diamond') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(bx + 12, by + 11, 2, 2);
          }
        }

        // Pixel block border
        ctx.strokeStyle = pal.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bw - 1);
      }
    }

    // Draw Trees
    for (const tree of data.trees) {
      if (tree.y > maxRowToDraw) continue;

      const tx = tree.x * bw;
      const ty = tree.y * bw;

      // Trunk
      for (let h = 1; h <= tree.height; h++) {
        const yBlock = ty - h * bw;
        ctx.fillStyle = PALETTE.wood.base;
        ctx.fillRect(tx, yBlock, bw, bw);
        ctx.strokeStyle = PALETTE.wood.border;
        ctx.strokeRect(tx + 0.5, yBlock + 0.5, bw - 1, bw - 1);
      }

      // Leaves Canopy
      const topY = ty - tree.height * bw;
      for (let lx = -1; lx <= 1; lx++) {
        for (let ly = -2; ly <= 0; ly++) {
          if (lx === 0 && ly === 0) continue; // trunk position
          const leafX = tx + lx * bw;
          const leafY = topY + ly * bw;

          ctx.fillStyle = PALETTE.leaves.base;
          ctx.fillRect(leafX, leafY, bw, bw);
          ctx.fillStyle = PALETTE.leaves.top;
          ctx.fillRect(leafX, leafY, bw, 3);
          ctx.strokeStyle = PALETTE.leaves.border;
          ctx.strokeRect(leafX + 0.5, leafY + 0.5, bw - 1, bw - 1);
        }
      }
    }
  }

  // 6.2 Fractal Tree Renderer
  function renderFractalCanvas(ctx, data, progress) {
    // Night sky gradient
    const bg = ctx.createLinearGradient(0, 0, 0, 480);
    bg.addColorStop(0, data.bgGrad[0]);
    bg.addColorStop(1, data.bgGrad[1]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 960, 480);

    // Ground platform
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(0, 440, 960, 40);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 440);
    ctx.lineTo(960, 440);
    ctx.stroke();

    const maxBranch = Math.floor(data.branches.length * progress);

    // Draw Branches
    for (let i = 0; i < maxBranch; i++) {
      const b = data.branches[i];
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.strokeStyle = data.trunkColor;
      ctx.lineWidth = b.thickness;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Draw Leaves
    if (progress > 0.85) {
      const leafAlpha = (progress - 0.85) / 0.15;
      ctx.save();
      ctx.globalAlpha = leafAlpha;

      for (const lf of data.leaves) {
        ctx.beginPath();
        ctx.arc(lf.x, lf.y, lf.r, 0, Math.PI * 2);
        ctx.fillStyle = data.leafColor;
        ctx.fill();

        ctx.strokeStyle = data.leafGlow;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 6.3 Cyberpunk Skyline Renderer
  function renderCityscapeCanvas(ctx, data, progress) {
    // Deep night sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 480);
    sky.addColorStop(0, '#060a12');
    sky.addColorStop(0.65, '#0b1329');
    sky.addColorStop(1, '#1b1238');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 960, 480);

    // Stars
    for (const st of data.stars) {
      ctx.fillStyle = `rgba(255, 255, 255, ${st.alpha})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cyber Moon
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(830, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 12;
    ctx.stroke();

    const maxTowers = Math.floor(data.towers.length * progress);

    // Draw Skyscrapers
    for (let i = 0; i < maxTowers; i++) {
      const t = data.towers[i];

      // Building Silhouettes
      ctx.fillStyle = '#0a101d';
      ctx.fillRect(t.x, t.y, t.w, t.h);

      ctx.strokeStyle = t.neonColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(t.x, t.y, t.w, t.h);

      // Roof styles
      if (t.roofStyle === 'spire') {
        ctx.beginPath();
        ctx.moveTo(t.x + t.w / 2, t.y - 28);
        ctx.lineTo(t.x + t.w / 2, t.y);
        ctx.strokeStyle = t.neonColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Red aviation light
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(t.x + t.w / 2, t.y - 28, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Windows
      for (let r = 0; r < t.rows; r++) {
        for (let c = 0; c < t.cols; c++) {
          const wx = t.x + 8 + c * 10;
          const wy = t.y + 12 + r * 12;
          const isLit = (Math.sin(wx * 11 + wy * 17) + 1) / 2 < t.windowDensity;

          ctx.fillStyle = isLit ? t.neonColor : 'rgba(255, 255, 255, 0.05)';
          ctx.fillRect(wx, wy, 5, 6);
        }
      }

      // Billboard Hologram
      if (t.billboard && t.h > 240) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(t.x + 4, t.y + 35, t.w - 8, 22);
        ctx.strokeStyle = t.neonColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(t.x + 4, t.y + 35, t.w - 8, 22);

        ctx.fillStyle = t.neonColor;
        ctx.font = 'bold 8.5px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.billboard, t.x + t.w / 2, t.y + 49);
        ctx.textAlign = 'left';
      }
    }

    // Street level cyber highway reflection
    ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.fillRect(0, 450, 960, 30);
  }

  // =========================================================================
  // 7. ORCHESTRATION & SEED UI
  // =========================================================================
  function generateActiveWorld(seedStr, animated = false) {
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }

    state.activeSeed = seedStr;
    const seedInput = document.getElementById('seedInput');
    if (seedInput && seedInput.value !== seedStr) {
      seedInput.value = seedStr;
    }

    let artData;
    if (state.currentMode === 'minecraft') {
      artData = generateMinecraftWorld(seedStr);
      updateBadge('rlModeBadge', 'Minecraft 2D Voxel Terrain');
      updateBadge('rlBiomeBadge', `Biome: ${artData.biome}`);
    } else if (state.currentMode === 'fractal') {
      artData = generateFractalTree(seedStr);
      updateBadge('rlModeBadge', 'Fractal Blossom Tree');
      updateBadge('rlBiomeBadge', `Style: ${artData.theme}`);
    } else {
      artData = generateCityscape(seedStr);
      updateBadge('rlModeBadge', 'Cyberpunk City Skyline');
      updateBadge('rlBiomeBadge', `Sky: ${artData.moonType}`);
    }

    state.artData = artData;
    updateTelemetry(artData);

    if (animated) {
      animateGeneration(artData);
    } else {
      renderArtwork(artData, 1.0);
    }
  }

  function animateGeneration(artData) {
    state.isAnimating = true;
    const startTime = performance.now();
    const duration = 1200; // 1.2s build animation

    function frame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      const eased = progress * progress * (3 - 2 * progress);

      renderArtwork(artData, eased);

      if (progress < 1.0) {
        state.animFrameId = requestAnimationFrame(frame);
      } else {
        state.isAnimating = false;
        state.animFrameId = null;
        renderArtwork(artData, 1.0);
      }
    }

    state.animFrameId = requestAnimationFrame(frame);
  }

  function updateBadge(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function updateTelemetry(artData) {
    const entropyEl = document.getElementById('rlEntropyStat');
    if (entropyEl) {
      entropyEl.textContent = `Generated numbers: ${artData.prngCalls}`;
    }

    const gridEl = document.getElementById('inventoryStatsGrid');
    if (!gridEl) return;

    gridEl.innerHTML = '';
    for (const [key, val] of Object.entries(artData.stats)) {
      const box = document.createElement('div');
      box.className = 'rl-stat-box';
      box.innerHTML = `
        <span class="rl-stat-label">${key}</span>
        <span class="rl-stat-value">${val}</span>
      `;
      gridEl.appendChild(box);
    }
  }

  function showToast(msg) {
    const toast = document.getElementById('seedToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // =========================================================================
  // 8. TAB 2: PRNG MATH ENGINE INTERACTIVE STEPPER & COMPARISON
  // =========================================================================
  const LCG_PARAMS = {
    a: 1664525,
    c: 1013904223,
    m: 4294967296 // 2^32
  };

  function lcgStep(x) {
    const nextX = (Math.imul(LCG_PARAMS.a, x) + LCG_PARAMS.c) >>> 0;
    const floatVal = nextX / LCG_PARAMS.m;
    const diceRoll = Math.floor(floatVal * 6) + 1; // 1 to 6
    return { nextX, floatVal, diceRoll };
  }

  let mathPrngState = {
    seed: 42,
    currentX: 42,
    stepIndex: 0
  };

  function highlightSequenceRow(activeStep) {
    for (let i = 1; i <= 8; i++) {
      const row = document.getElementById(`seqRow-${i}`);
      if (row) {
        if (i === activeStep) {
          row.classList.add('highlighted-step');
        } else {
          row.classList.remove('highlighted-step');
        }
      }
    }
  }

  function populateSequenceTable(seedA = 42) {
    const tableBody = document.getElementById('seqTableBody');
    const thSeedA = document.getElementById('thSeedA');
    const thRollA = document.getElementById('thRollA');
    if (!tableBody) return;

    if (thSeedA) thSeedA.textContent = `Seed ${seedA}`;
    if (thRollA) thRollA.textContent = `Roll (1–6)`;

    let curA = (seedA >>> 0);
    let curB = 999 >>> 0;

    let html = '';
    for (let i = 1; i <= 8; i++) {
      const resA = lcgStep(curA);
      curA = resA.nextX;

      const resB = lcgStep(curB);
      curB = resB.nextX;

      const aFloat = resA.floatVal.toFixed(4);
      const bFloat = resB.floatVal.toFixed(4);
      const aDice = resA.diceRoll;

      html += `
        <tr id="seqRow-${i}">
          <td>Call #${i}</td>
          <td style="color: #6366f1; font-weight: 700;">${aFloat}</td>
          <td style="color: #ec4899; font-weight: 700;">${bFloat}</td>
          <td style="color: #10b981; font-weight: 700;">${aDice}</td>
        </tr>
      `;
    }
    tableBody.innerHTML = html;
  }

  function initMathPrng() {
    const input = document.getElementById('mathSeedInput');
    const btnReset = document.getElementById('btnResetMathPrng');
    const btnNext = document.getElementById('btnNextMathPrng');

    if (!input || !btnReset || !btnNext) return;

    function resetStepper() {
      const s = parseInt(input.value, 10);
      const seedVal = isNaN(s) ? 42 : s;
      mathPrngState = { seed: seedVal, currentX: seedVal >>> 0, stepIndex: 0 };
      const log = document.getElementById('mathStepLog');
      if (log) {
        log.innerHTML = `<div>[Initial Seed Set: X₀ = ${seedVal}] Click "▶ Next Random Number" to calculate X₁...</div>`;
      }
      highlightSequenceRow(0);
      populateSequenceTable(seedVal);
    }

    function stepPrng() {
      mathPrngState.stepIndex++;
      const prevX = mathPrngState.currentX;
      const res = lcgStep(prevX);
      mathPrngState.currentX = res.nextX;

      const normalizedFloat = res.floatVal.toFixed(6);
      const diceRoll = res.diceRoll;

      const log = document.getElementById('mathStepLog');
      if (log) {
        log.innerHTML = `
          <div style="color: #38bdf8;"><strong>Step ${mathPrngState.stepIndex}: Calculating X<sub>${mathPrngState.stepIndex}</sub> from X<sub>${mathPrngState.stepIndex - 1}</sub></strong></div>
          <div>Formula: (${LCG_PARAMS.a} × ${prevX} + ${LCG_PARAMS.c}) mod 2³²</div>
          <div>New 32-bit Integer: <strong>${res.nextX}</strong></div>
          <div>Normalized Float (0.0 to 1.0): <strong>${normalizedFloat}</strong></div>
          <div style="color: #10b981; font-weight: bold; margin-top: 4px;">➔ Scaled to Die Roll (1–6): [ ${diceRoll} ]</div>
        `;
      }

      highlightSequenceRow(mathPrngState.stepIndex);
    }

    input.addEventListener('change', resetStepper);
    btnReset.addEventListener('click', resetStepper);
    btnNext.addEventListener('click', stepPrng);

    resetStepper();
  }

  // =========================================================================
  // 9. EVENT LISTENERS & INITIALIZATION
  // =========================================================================
  function init() {
    // 1. Tab Switching
    const tabBtns = document.querySelectorAll('.view-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tabKey = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
        const targetView = document.getElementById(`tab-${tabKey}`);
        if (targetView) targetView.classList.add('active');
      });
    });

    const initialHash = window.location.hash.replace('#', '');
    if (initialHash) {
      const targetBtn = document.querySelector(`.view-tab-btn[data-tab="${initialHash}"]`);
      if (targetBtn) targetBtn.click();
    }

    // 2. Mode Tabs
    const modeBtns = document.querySelectorAll('.rl-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentMode = btn.getAttribute('data-mode');
        generateActiveWorld(state.activeSeed, false);
      });
    });

    // 3. Roll Random Seed
    const btnRoll = document.getElementById('btnRollSeed');
    if (btnRoll) {
      btnRoll.addEventListener('click', () => {
        const newSeed = getRandomSeedString();
        generateActiveWorld(newSeed, true);
      });
    }

    // 4. Apply Seed Button
    const btnApply = document.getElementById('btnApplySeed');
    const seedInput = document.getElementById('seedInput');
    if (btnApply && seedInput) {
      btnApply.addEventListener('click', () => {
        const val = seedInput.value.trim() || getRandomSeedString();
        generateActiveWorld(val, false);
      });

      seedInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = seedInput.value.trim() || getRandomSeedString();
          generateActiveWorld(val, false);
        }
      });
    }

    // 4b. Reset Seed Button
    const btnResetSeed = document.getElementById('btnResetWorldSeed');
    if (btnResetSeed) {
      btnResetSeed.addEventListener('click', () => {
        const defaultSeed = 'MINECRAFT-HEROBRINE-42';
        if (seedInput) seedInput.value = defaultSeed;
        generateActiveWorld(defaultSeed, false);
      });
    }

    // 5. Copy Seed
    const btnCopy = document.getElementById('btnCopySeed');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        if (!navigator.clipboard) {
          showToast(`Seed: ${state.activeSeed}`);
          return;
        }
        navigator.clipboard.writeText(state.activeSeed).then(() => {
          showToast('✓ Seed copied! Paste it anytime to re-create this exact world.');
        }).catch(() => {
          showToast(`Seed: ${state.activeSeed}`);
        });
      });
    }

    // 6. Live Build Animation Toggle
    const animBtn = document.getElementById('stepAnimToggleBtn');
    if (animBtn) {
      animBtn.addEventListener('click', () => {
        generateActiveWorld(state.activeSeed, true);
      });
    }

    // 7. Download PNG
    const btnDownload = document.getElementById('downloadImageBtn');
    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        const canvas = document.getElementById('randomArtCanvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `seed-${state.activeSeed}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }

    // 8. Canvas Hover Block Inspector (Minecraft mode)
    const canvas = document.getElementById('randomArtCanvas');
    const tooltip = document.getElementById('canvasTooltip');
    if (canvas && tooltip) {
      canvas.addEventListener('mousemove', (e) => {
        if (state.currentMode !== 'minecraft' || !state.artData || !state.artData.grid) {
          tooltip.style.display = 'none';
          return;
        }

        const rect = canvas.getBoundingClientRect();
        const scaleX = 960 / rect.width;
        const scaleY = 480 / rect.height;
        const cx = (e.clientX - rect.left) * scaleX;
        const cy = (e.clientY - rect.top) * scaleY;

        const col = Math.floor(cx / 20);
        const row = Math.floor(cy / 20);

        if (row >= 0 && row < state.artData.rows && col >= 0 && col < state.artData.cols) {
          const blk = state.artData.grid[row][col];
          if (blk) {
            tooltip.style.display = 'block';
            tooltip.style.left = `${e.clientX - rect.left + 15}px`;
            tooltip.style.top = `${e.clientY - rect.top - 20}px`;
            tooltip.innerHTML = `<strong>${blk.name}</strong><br>X: ${col}, Y: ${row} • Depth: ${blk.depth} blocks`;
            return;
          }
        }
        tooltip.style.display = 'none';
      });

      canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
    }

    // 9. Theme Toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');

    function updateIcons(isDark) {
      if (sunIcon) sunIcon.style.display = isDark ? 'block' : 'none';
      if (moonIcon) moonIcon.style.display = isDark ? 'none' : 'block';
    }

    updateIcons(document.documentElement.classList.contains('dark'));

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        document.documentElement.classList.toggle('light', !isDark);
        try {
          localStorage.setItem('theme', isDark ? 'dark' : 'light');
        } catch (e) {}
        updateIcons(isDark);
      });
    }

    // 10. Initialize PRNG Math Tab & First World
    initMathPrng();
    generateActiveWorld(state.activeSeed, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
