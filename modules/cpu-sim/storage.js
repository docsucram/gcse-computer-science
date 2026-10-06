/**
 * Storage & Memory Sub-Module (Primary & Secondary Storage)
 * Pure Vanilla JavaScript (ES6+)
 * Aligned with AQA GCSE Computer Science (Paper 2 • Storage)
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. PRIMARY STORAGE (RAM vs ROM) SIMULATION
  // =========================================================================

  const memoryState = {
    isPowerOn: true,
    ramSlots: [
      { id: 0, addr: '0x00', name: 'OS Kernel & Drivers', size: '4.0 GB', type: 'system', active: true },
      { id: 1, addr: '0x04', name: 'Web Browser (12 Tabs)', size: '2.5 GB', type: 'app', active: true },
      { id: 2, addr: '0x08', name: 'Spotify Audio Stream', size: '350 MB', type: 'media', active: true },
      { id: 3, addr: '0x0C', name: 'Unsaved Chemistry Essay', size: '18 KB', type: 'user', active: true, unsaved: true }
    ],
    romSlots: [
      { id: 0, addr: '0xF0', name: 'Power-On Self-Test (POST)', role: 'Diagnostic', fixed: true },
      { id: 1, addr: '0xF4', name: 'CPU & Bus Init Vectors', role: 'Hardware Setup', fixed: true },
      { id: 2, addr: '0xF8', name: 'UEFI / BIOS Setup Routine', role: 'Firmware Config', fixed: true },
      { id: 3, addr: '0xFC', name: 'Bootstrap Loader', role: 'Finds & Loads OS', fixed: true }
    ],
    writeCounter: 1
  };

  function renderMemorySlots() {
    const ramContainer = document.getElementById('ramSlotsList');
    const romContainer = document.getElementById('romSlotsList');
    const ramBadge = document.getElementById('ramPowerBadge');
    const romBadge = document.getElementById('romPowerBadge');
    const ramUsage = document.getElementById('ramUsageStat');
    const powerBtn = document.getElementById('btnToggleMemoryPower');
    const powerText = document.getElementById('powerBtnText');

    if (!ramContainer || !romContainer) return;

    if (powerBtn && powerText) {
      if (memoryState.isPowerOn) {
        powerBtn.className = 'power-toggle-btn power-on';
        powerText.textContent = 'POWER: ON';
      } else {
        powerBtn.className = 'power-toggle-btn power-off';
        powerText.textContent = 'POWER: OFF (CUT)';
      }
    }

    ramContainer.innerHTML = '';
    let activeRamCount = 0;

    memoryState.ramSlots.forEach(slot => {
      const el = document.createElement('div');
      el.className = `memory-slot ${memoryState.isPowerOn && slot.active ? 'slot-ram-active' : 'slot-ram-empty'}`;
      
      if (memoryState.isPowerOn && slot.active) {
        activeRamCount++;
        el.innerHTML = `
          <div class="slot-addr font-mono">${slot.addr}</div>
          <div class="slot-info">
            <span class="slot-name">${slot.name}</span>
            <span class="slot-meta">${slot.size} ${slot.unsaved ? '• <strong style="color: #fbbf24;">(Unsaved!)</strong>' : ''}</span>
          </div>
          <span class="slot-status-pill pill-live">Active</span>
        `;
      } else {
        el.innerHTML = `
          <div class="slot-addr font-mono">${slot.addr}</div>
          <div class="slot-info">
            <span class="slot-name" style="color: #ef4444; font-weight: 700;">[00000000] DATA WIPED</span>
            <span class="slot-meta" style="color: var(--text-muted);">Capacitors discharged • Power lost</span>
          </div>
          <span class="slot-status-pill pill-dead">Wiped</span>
        `;
      }
      ramContainer.appendChild(el);
    });

    if (ramUsage) {
      ramUsage.textContent = memoryState.isPowerOn ? `${activeRamCount}/4 Slots Active` : `0/4 Slots (Wiped)`;
    }

    if (ramBadge) {
      if (memoryState.isPowerOn) {
        ramBadge.className = 'badge badge-success';
        ramBadge.textContent = 'Active • Power Supplied';
      } else {
        ramBadge.className = 'badge badge-danger';
        ramBadge.textContent = 'Wiped • Power Lost (Volatile)';
      }
    }

    romContainer.innerHTML = '';
    memoryState.romSlots.forEach(slot => {
      const el = document.createElement('div');
      el.className = 'memory-slot slot-rom-fixed';
      el.innerHTML = `
        <div class="slot-addr font-mono" style="color: #0284c7;">${slot.addr}</div>
        <div class="slot-info">
          <span class="slot-name">${slot.name}</span>
          <span class="slot-meta" style="color: #0369a1;">${slot.role}</span>
        </div>
        <span class="slot-status-pill pill-rom">Firmware</span>
      `;
      romContainer.appendChild(el);
    });

    if (romBadge) {
      romBadge.className = 'badge badge-topic';
      romBadge.textContent = memoryState.isPowerOn ? 'Firmware Preserved' : 'Firmware Preserved (Non-Volatile)';
    }
  }

  function setMemoryFeedback(msg, isWarning = false) {
    const log = document.getElementById('memoryFeedbackLog');
    if (!log) return;
    log.innerHTML = msg;
    if (isWarning) {
      log.style.borderColor = '#ef4444';
      log.style.background = 'rgba(239, 68, 68, 0.12)';
    } else {
      log.style.borderColor = 'var(--border-color)';
      log.style.background = 'var(--bg-surface-elevated)';
    }
  }

  function initPrimaryMemory() {
    const powerBtn = document.getElementById('btnToggleMemoryPower');
    const writeRamBtn = document.getElementById('btnWriteRam');
    const writeRomBtn = document.getElementById('btnWriteRom');

    if (powerBtn) {
      powerBtn.addEventListener('click', () => {
        memoryState.isPowerOn = !memoryState.isPowerOn;
        if (!memoryState.isPowerOn) {
          setMemoryFeedback(
            `<strong style="color: #ef4444;">⚡ POWER CUT!</strong> Electrical charge lost. All volatile RAM capacitors discharged to 0V. The <strong>Unsaved Chemistry Essay</strong> and all open applications were destroyed! ROM firmware remains 100% intact.`,
            true
          );
        } else {
          setMemoryFeedback(
            `<strong style="color: #10b981;">⚡ POWER RESTORED:</strong> ROM executes Power-On Self-Test (POST) → Bootstrap Loader finds Secondary Storage (SSD/HDD) → Operating System Kernel loaded back into RAM!`
          );
          memoryState.ramSlots = [
            { id: 0, addr: '0x00', name: 'OS Kernel & Drivers', size: '4.0 GB', type: 'system', active: true },
            { id: 1, addr: '0x04', name: 'System Services & GUI', size: '1.2 GB', type: 'system', active: true },
            { id: 2, addr: '0x08', name: '[Empty Working Slot]', size: '0 MB', type: 'free', active: false },
            { id: 3, addr: '0x0C', name: '[Empty Working Slot]', size: '0 MB', type: 'free', active: false }
          ];
        }
        renderMemorySlots();
      });
    }

    if (writeRamBtn) {
      writeRamBtn.addEventListener('click', () => {
        if (!memoryState.isPowerOn) {
          setMemoryFeedback(`🚫 Cannot write to RAM while power is OFF! RAM requires electrical power to operate.`, true);
          return;
        }

        const newApps = [
          { name: 'Discord Chat (PID 781)', size: '420 MB' },
          { name: 'VS Code Editor (Python script)', size: '680 MB' },
          { name: 'Blender 3D Render Buffer', size: '2.1 GB' },
          { name: 'Minecraft Game World Chunk', size: '1.8 GB' }
        ];
        const nextApp = newApps[memoryState.writeCounter % newApps.length];
        memoryState.writeCounter++;

        const targetSlot = memoryState.ramSlots[2].active ? memoryState.ramSlots[3] : memoryState.ramSlots[2];
        targetSlot.name = nextApp.name;
        targetSlot.size = nextApp.size;
        targetSlot.active = true;
        targetSlot.unsaved = false;

        renderMemorySlots();
        setMemoryFeedback(
          `<span style="color: #10b981; font-weight: 700;">✓ Write Successful:</span> CPU loaded <strong>${nextApp.name}</strong> into address ${targetSlot.addr} in RAM. This proves RAM is <strong>Read &amp; Write</strong> memory!`
        );
      });
    }

    if (writeRomBtn) {
      writeRomBtn.addEventListener('click', () => {
        setMemoryFeedback(
          `🚫 <strong style="color: #ef4444;">Hardware Write Protection Error!</strong> ROM stands for <strong>Read-Only Memory</strong>. Its microscopic diode matrices are burned at the silicon factory and cannot be overwritten by CPU software.`,
          true
        );
      });
    }

    renderMemorySlots();
  }


  // =========================================================================
  // 2. SECONDARY STORAGE (HDD) WORKBENCH & PHYSICAL SYNCHRONIZATION
  // =========================================================================

  // Mathematical Geometry Constants for Actuator & Platter
  const HDD_GEOM = {
    cx: 210, // Platter Center X
    cy: 200, // Platter Center Y
    px: 385, // Actuator Pivot X
    py: 65,  // Actuator Pivot Y
    armLength: 230,
    radii: [145, 110, 75], // Track 0 (Outer), Track 1 (Middle), Track 2 (Inner)
    trackWidth: 26,
    numSectors: 12
  };

  // Precompute exact arm angle for each track using the Law of Cosines
  // Triangle sides: D (center to pivot), L (arm length), r (track radius)
  const D_PIVOT = Math.hypot(HDD_GEOM.cx - HDD_GEOM.px, HDD_GEOM.cy - HDD_GEOM.py);
  const BASE_PIVOT_ANGLE = Math.atan2(HDD_GEOM.cy - HDD_GEOM.py, HDD_GEOM.cx - HDD_GEOM.px);

  const TRACK_ARM_ANGLES = HDD_GEOM.radii.map(r => {
    const cosVal = (D_PIVOT * D_PIVOT + HDD_GEOM.armLength * HDD_GEOM.armLength - r * r) / (2 * D_PIVOT * HDD_GEOM.armLength);
    const clamped = Math.max(-1, Math.min(1, cosVal));
    const offset = Math.acos(clamped);
    return BASE_PIVOT_ANGLE - offset;
  });

  const hddState = {
    isSpinning: true,
    angle: 0,
    armAngle: TRACK_ARM_ANGLES[0],
    targetArmAngle: TRACK_ARM_ANGLES[0],
    headTrack: 0,
    isReading: false,
    isDefragged: false,
    isDeletedB: false,
    isWrittenD: false,
    overwroteB: false,
    fileDBlocks: [],
    flashSector: null, // Sector currently flashing green upon read
    flashCounter: 0,

    // File layout definitions
    // Fragmented:
    fragFileA: [
      { track: 0, sector: 1, label: 'A1' },
      { track: 1, sector: 5, label: 'A2' },
      { track: 0, sector: 9, label: 'A3' },
      { track: 2, sector: 3, label: 'A4' }
    ],
    fragFileB: [
      { track: 1, sector: 2, label: 'B1' },
      { track: 2, sector: 7, label: 'B2' },
      { track: 1, sector: 10, label: 'B3' }
    ],
    fragFileC: [
      { track: 0, sector: 4, label: 'C1' },
      { track: 2, sector: 11, label: 'C2' }
    ],

    // Defragmented (Contiguous on Track 0):
    defragFileA: [
      { track: 0, sector: 0, label: 'A1' },
      { track: 0, sector: 1, label: 'A2' },
      { track: 0, sector: 2, label: 'A3' },
      { track: 0, sector: 3, label: 'A4' }
    ],
    defragFileB: [
      { track: 0, sector: 4, label: 'B1' },
      { track: 0, sector: 5, label: 'B2' },
      { track: 0, sector: 6, label: 'B3' }
    ],
    defragFileC: [
      { track: 0, sector: 7, label: 'C1' },
      { track: 0, sector: 8, label: 'C2' }
    ],

    // Active reading job state
    readJob: null
  };

  function updateFatTable() {
    const tbody = document.getElementById('fatTableBody');
    if (!tbody) return;

    let html = '';

    // File A
    if (hddState.isDefragged) {
      html += `
        <tr>
          <td style="color: #3b82f6; font-weight: 700;">game_levels.pak (File A)</td>
          <td>T0-S0 → T0-S1 → T0-S2 → T0-S3</td>
          <td><span style="color: #10b981; font-weight: 700;">Contiguous • Defragged</span></td>
        </tr>
      `;
    } else {
      html += `
        <tr>
          <td style="color: #3b82f6; font-weight: 700;">game_levels.pak (File A)</td>
          <td>T0-S1 → T1-S5 → T0-S9 → T2-S3</td>
          <td><span style="color: #f59e0b; font-weight: 700;">Fragmented (3 Track Jumps)</span></td>
        </tr>
      `;
    }

    // File B
    if (hddState.overwroteB) {
      html += `
        <tr style="opacity: 0.45; text-decoration: line-through;">
          <td style="color: #ec4899; font-weight: 700;">vacation_clip.mp4 (File B)</td>
          <td>Overwritten by File D</td>
          <td><span style="color: #ef4444; font-weight: 700;">OVERWRITTEN (Unrecoverable)</span></td>
        </tr>
      `;
    } else if (hddState.isDefragged) {
      html += `
        <tr style="${hddState.isDeletedB ? 'opacity: 0.55; text-decoration: line-through;' : ''}">
          <td style="color: #ec4899; font-weight: 700;">vacation_clip.mp4 (File B)</td>
          <td>T0-S4 → T0-S5 → T0-S6</td>
          <td>${hddState.isDeletedB ? '<span style="color: #ef4444; font-weight: 700;">DELETED (Free to Overwrite)</span>' : '<span style="color: #10b981; font-weight: 700;">Contiguous • Defragged</span>'}</td>
        </tr>
      `;
    } else {
      html += `
        <tr style="${hddState.isDeletedB ? 'opacity: 0.55; text-decoration: line-through;' : ''}">
          <td style="color: #ec4899; font-weight: 700;">vacation_clip.mp4 (File B)</td>
          <td>T1-S2 → T2-S7 → T1-S10</td>
          <td>${hddState.isDeletedB ? '<span style="color: #ef4444; font-weight: 700;">DELETED (Free to Overwrite)</span>' : '<span style="color: #f59e0b; font-weight: 700;">Fragmented (2 Track Jumps)</span>'}</td>
        </tr>
      `;
    }

    // File C
    if (hddState.isDefragged) {
      html += `
        <tr>
          <td style="color: #f59e0b; font-weight: 700;">notes.txt (File C)</td>
          <td>T0-S7 → T0-S8</td>
          <td><span style="color: #10b981; font-weight: 700;">Contiguous • Defragged</span></td>
        </tr>
      `;
    } else {
      html += `
        <tr>
          <td style="color: #f59e0b; font-weight: 700;">notes.txt (File C)</td>
          <td>T0-S4 → T2-S11</td>
          <td><span style="color: #f59e0b; font-weight: 700;">Fragmented (2 Track Jumps)</span></td>
        </tr>
      `;
    }

    // File D (if written)
    if (hddState.isWrittenD && hddState.fileDBlocks.length > 0) {
      const dChain = hddState.fileDBlocks.map(b => `T${b.track}-S${b.sector}`).join(' → ');
      let dStatus = '';
      if (hddState.overwroteB) {
        dStatus = '<span style="color: #06b6d4; font-weight: 700;">Overwrote Deleted File B</span>';
      } else if (hddState.isDefragged) {
        dStatus = '<span style="color: #10b981; font-weight: 700;">Contiguous • Defragged</span>';
      } else {
        dStatus = '<span style="color: #f59e0b; font-weight: 700;">Scattered Free Sectors</span>';
      }
      html += `
        <tr>
          <td style="color: #06b6d4; font-weight: 700;">save_data.dat (File D)</td>
          <td>${dChain}</td>
          <td>${dStatus}</td>
        </tr>
      `;
    }

    tbody.innerHTML = html;
  }

  function getHeadTipCoords(armAngle) {
    const hx = HDD_GEOM.px + Math.cos(armAngle) * HDD_GEOM.armLength;
    const hy = HDD_GEOM.py + Math.sin(armAngle) * HDD_GEOM.armLength;
    return { hx, hy };
  }

  function initHddCanvas() {
    const canvas = document.getElementById('hddCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const sectorAngle = (Math.PI * 2) / HDD_GEOM.numSectors;

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Rotating Platter
      ctx.save();
      ctx.translate(HDD_GEOM.cx, HDD_GEOM.cy);
      ctx.rotate(hddState.angle);

      // Platter gradient
      const grad = ctx.createRadialGradient(0, 0, 30, 0, 0, 168);
      grad.addColorStop(0, '#475569');
      grad.addColorStop(0.35, '#94a3b8');
      grad.addColorStop(0.65, '#cbd5e1');
      grad.addColorStop(1, '#334155');

      ctx.beginPath();
      ctx.arc(0, 0, 164, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Platter sheen lines
      ctx.beginPath();
      ctx.moveTo(-162, -25);
      ctx.lineTo(162, 25);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 16;
      ctx.stroke();

      // Draw concentric tracks and sectors
      for (let t = 0; t < 3; t++) {
        const r = HDD_GEOM.radii[t];

        // Track boundary line
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.3)';
        ctx.lineWidth = HDD_GEOM.trackWidth;
        ctx.stroke();

        // 12 Sectors
        for (let s = 0; s < HDD_GEOM.numSectors; s++) {
          const a = s * sectorAngle;
          ctx.beginPath();
          ctx.arc(0, 0, r, a + 0.035, a + sectorAngle - 0.035);

          let fillColor = 'rgba(148, 163, 184, 0.45)'; // Default free sector
          let blockLabel = '';

          const fileA = hddState.isDefragged ? hddState.defragFileA : hddState.fragFileA;
          const fileB = hddState.isDefragged ? hddState.defragFileB : hddState.fragFileB;
          const fileC = hddState.isDefragged ? hddState.defragFileC : hddState.fragFileC;

          // Check File A
          const bA = fileA.find(b => b.track === t && b.sector === s);
          if (bA) {
            fillColor = '#3b82f6';
            blockLabel = bA.label;
          }

          // Check File B
          if (!hddState.overwroteB) {
            const bB = fileB.find(b => b.track === t && b.sector === s);
            if (bB) {
              if (hddState.isDeletedB) {
                fillColor = 'rgba(236, 72, 153, 0.22)';
                blockLabel = 'B(Del)';
              } else {
                fillColor = '#ec4899';
                blockLabel = bB.label;
              }
            }
          }

          // Check File C
          const bC = fileC.find(b => b.track === t && b.sector === s);
          if (bC) {
            fillColor = '#f59e0b';
            blockLabel = bC.label;
          }

          // Check File D
          if (hddState.isWrittenD && hddState.fileDBlocks.length > 0) {
            const bD = hddState.fileDBlocks.find(b => b.track === t && b.sector === s);
            if (bD) {
              fillColor = '#06b6d4';
              blockLabel = bD.label;
            }
          }

          // Flash read pulse if sector is currently being read by head
          if (hddState.flashSector && hddState.flashSector.track === t && hddState.flashSector.sector === s) {
            fillColor = '#10b981';
          }

          ctx.strokeStyle = fillColor;
          ctx.lineWidth = HDD_GEOM.trackWidth - 3;
          ctx.stroke();

          // Sector text label
          if (blockLabel) {
            const midA = a + sectorAngle / 2;
            const tx = Math.cos(midA) * r;
            const ty = Math.sin(midA) * r;
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(midA + Math.PI / 2);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8.5px Inter, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(blockLabel, 0, 0);
            ctx.restore();
          }
        }
      }

      // Spindle Center
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#64748b';
      ctx.fill();

      ctx.restore();

      // 2. Actuator Base & Mechanical Pivot Arm
      ctx.beginPath();
      ctx.arc(HDD_GEOM.px, HDD_GEOM.py, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(HDD_GEOM.px, HDD_GEOM.py, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // Interpolate arm smoothly towards target track angle
      hddState.armAngle += (hddState.targetArmAngle - hddState.armAngle) * 0.12;

      const { hx, hy } = getHeadTipCoords(hddState.armAngle);

      // Arm body
      ctx.beginPath();
      ctx.moveTo(HDD_GEOM.px, HDD_GEOM.py);
      ctx.lineTo(hx, hy);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(HDD_GEOM.px, HDD_GEOM.py);
      ctx.lineTo(hx, hy);
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Head Slider Block
      ctx.beginPath();
      ctx.rect(hx - 7, hy - 7, 14, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = (hddState.flashCounter > 0) ? '#10b981' : '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Head Magnetic Sensor Glow
      ctx.beginPath();
      ctx.arc(hx, hy, (hddState.flashCounter > 0) ? 6 : 3, 0, Math.PI * 2);
      ctx.fillStyle = (hddState.flashCounter > 0) ? '#10b981' : '#38bdf8';
      ctx.shadowColor = (hddState.flashCounter > 0) ? '#10b981' : '#38bdf8';
      ctx.shadowBlur = (hddState.flashCounter > 0) ? 14 : 5;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Flash counter decrement
      if (hddState.flashCounter > 0) {
        hddState.flashCounter--;
        if (hddState.flashCounter === 0) {
          hddState.flashSector = null;
        }
      }

      // 3. Process Active Read Job (Physical Coupling)
      if (hddState.readJob && hddState.isSpinning) {
        processReadJobTick(hx, hy);
      }

      // Platter spin
      if (hddState.isSpinning) {
        hddState.angle += 0.022; // ~7200 RPM visual simulation
      }

      requestAnimationFrame(render);
    }

    render();
  }

  // =========================================================================
  // 3. SYNCHRONIZED SECTOR READING ENGINE
  // =========================================================================

  function processReadJobTick(hx, hy) {
    const job = hddState.readJob;
    if (!job || job.completed) return;

    const targetBlock = job.blocks[job.currentBlockIndex];
    if (!targetBlock) return;

    // Check if arm has reached target track
    const armArrived = Math.abs(hddState.armAngle - hddState.targetArmAngle) < 0.015;

    if (!armArrived) {
      // Still seeking across tracks
      job.seekTime += 0.08;
      updateHddTelemetryDisplay(job.seekTime, job.rotTime, job.trackJumps);
      return;
    }

    // Arm is steady on the track. Now check which sector is physically passing under the head tip!
    const headAngle = Math.atan2(hy - HDD_GEOM.cy, hx - HDD_GEOM.cx);
    let psi = (headAngle - hddState.angle) % (Math.PI * 2);
    if (psi < 0) psi += Math.PI * 2;

    const sectorUnderHead = Math.floor(psi / ((Math.PI * 2) / HDD_GEOM.numSectors));

    if (sectorUnderHead === targetBlock.sector) {
      // MATCH! Sector is directly touching the read head tip
      hddState.flashSector = { track: targetBlock.track, sector: targetBlock.sector };
      hddState.flashCounter = 18; // pulse for 18 frames

      job.currentBlockIndex++;

      if (job.currentBlockIndex >= job.blocks.length) {
        // Entire file read finished!
        job.completed = true;
        hddState.isReading = false;
        hddState.readJob = null;
        onReadJobFinished(job);
      } else {
        // Move arm to the next block's track!
        const nextBlock = job.blocks[job.currentBlockIndex];
        if (nextBlock.track !== targetBlock.track) {
          job.trackJumps++;
          setArmTargetTrack(nextBlock.track);
        }
      }
    } else {
      // Waiting for rotation
      job.rotTime += 0.04;
      updateHddTelemetryDisplay(job.seekTime, job.rotTime, job.trackJumps);
    }
  }

  function setArmTargetTrack(trackIdx) {
    hddState.headTrack = trackIdx;
    hddState.targetArmAngle = TRACK_ARM_ANGLES[trackIdx] || TRACK_ARM_ANGLES[0];
  }

  function updateHddTelemetryDisplay(seek, rot, jumps) {
    const seekVal = document.getElementById('hddSeekVal');
    const rotVal = document.getElementById('hddRotVal');
    const totalVal = document.getElementById('hddTotalVal');
    const jumpsVal = document.getElementById('hddJumpsVal');

    if (seekVal) seekVal.textContent = `${seek.toFixed(1)} ms`;
    if (rotVal) rotVal.textContent = `${rot.toFixed(1)} ms`;
    if (totalVal) totalVal.textContent = `${(seek + rot).toFixed(1)} ms`;
    if (jumpsVal) jumpsVal.textContent = `${jumps}`;
  }

  function updateReadFileABtn() {
    const btn = document.getElementById('btnHddReadFileA');
    if (!btn) return;
    if (hddState.isDefragged) {
      btn.innerHTML = '⚡ Read File A (Contiguous • Defragged)';
      btn.className = 'btn btn-success';
    } else {
      btn.innerHTML = '▶ Read File A (game_levels.pak)';
      btn.className = 'btn btn-primary';
    }
    btn.style.width = '100%';
    btn.style.justifyContent = 'center';
  }

  function onReadJobFinished(job) {
    const explainer = document.getElementById('hddExplainerBox');
    const totalMs = (job.seekTime + job.rotTime).toFixed(1);

    const btnReadFileA = document.getElementById('btnHddReadFileA');
    if (btnReadFileA) btnReadFileA.disabled = false;

    if (job.isDefragged) {
      if (explainer) {
        explainer.innerHTML = `
          <strong style="color: #10b981;">⚡ Defragmented Read Complete:</strong> All 4 contiguous sectors read smoothly in <strong>${totalMs} ms</strong>! 
          The head stayed on Track 0 throughout the spin with <strong>0 track jumps</strong>.
        `;
      }
      updateBenchmarkScore('defrag', parseFloat(totalMs));
    } else {
      if (explainer) {
        explainer.innerHTML = `
          <strong style="color: #ef4444;">Fragmented Read Complete:</strong> The mechanical arm had to jump across physical tracks <strong>${job.trackJumps} times</strong>. Total read latency: <strong>${totalMs} ms</strong>. Slower due to physical mechanical seek penalty!
        `;
      }
      updateBenchmarkScore('frag', parseFloat(totalMs));
    }
  }

  function updateBenchmarkScore(type, timeMs) {
    const rowFrag = document.getElementById('benchRowFrag');
    const rowDefrag = document.getElementById('benchRowDefrag');
    const rowSsd = document.getElementById('benchRowSsd');

    const fragTimeBadge = document.getElementById('benchFragTime');
    const defragTimeBadge = document.getElementById('benchDefragTime');
    const ssdTimeBadge = document.getElementById('benchSsdTime');

    if (rowFrag) rowFrag.classList.remove('active-read');
    if (rowDefrag) rowDefrag.classList.remove('active-read');
    if (rowSsd) rowSsd.classList.remove('active-read');

    if (type === 'frag') {
      if (rowFrag) rowFrag.classList.add('active-read');
      if (fragTimeBadge) fragTimeBadge.textContent = `${timeMs} ms • Slow`;
    } else if (type === 'defrag') {
      if (rowDefrag) rowDefrag.classList.add('active-read');
      if (defragTimeBadge) defragTimeBadge.textContent = `${timeMs} ms • ~6× Faster`;
    } else if (type === 'ssd') {
      if (rowSsd) rowSsd.classList.add('active-read');
      if (ssdTimeBadge) ssdTimeBadge.textContent = `0.08 ms • 175× Faster!`;
    }
  }

  // =========================================================================
  // 4. HDD CONTROLS, DEFRAG & CANVAS OVERLAY BUTTONS
  // =========================================================================

  function initHddControls() {
    const btnReadFileA = document.getElementById('btnHddReadFileA');
    const btnDefrag = document.getElementById('btnHddDefrag');
    const btnDelete = document.getElementById('btnHddDelete');
    const btnWriteD = document.getElementById('btnHddWriteD');
    const btnReset = document.getElementById('btnHddReset');

    const btnPause = document.getElementById('btnPlatterPause');
    const pauseIcon = document.getElementById('platterPauseIcon');
    const btnPlatterReset = document.getElementById('btnPlatterReset');
    const explainer = document.getElementById('hddExplainerBox');

    // Initial button state
    updateReadFileABtn();

    // 1. Single Read File A Button (dispatches fragmented or defragged based on drive state)
    if (btnReadFileA) {
      btnReadFileA.addEventListener('click', () => {
        if (hddState.isReading) return;
        hddState.isReading = true;
        btnReadFileA.disabled = true;

        if (hddState.isDefragged) {
          if (explainer) {
            explainer.innerHTML = `
              <strong style="color: #10b981;">Reading Defragmented File A:</strong> The head moves once to Track 0 and remains completely still. All 4 contiguous sectors (S0, S1, S2, S3) will be read in a single smooth sweep!
            `;
          }

          const blocks = hddState.defragFileA;
          hddState.readJob = {
            blocks,
            currentBlockIndex: 0,
            seekTime: 1.1,
            rotTime: 0.8,
            trackJumps: 0,
            isDefragged: true,
            completed: false
          };
          setArmTargetTrack(blocks[0].track);
        } else {
          if (explainer) {
            explainer.innerHTML = `
              <strong style="color: #f59e0b;">Reading Fragmented File A:</strong> Watch the mechanical arm physically seek to Track 0, wait for Sector 1 $\\rightarrow$ jump to Track 1 for Sector 5 $\\rightarrow$ jump to Track 0 for Sector 9 $\\rightarrow$ jump to Track 2 for Sector 3!
            `;
          }

          const blocks = hddState.fragFileA;
          hddState.readJob = {
            blocks,
            currentBlockIndex: 0,
            seekTime: 1.5,
            rotTime: 1.2,
            trackJumps: 0,
            isDefragged: false,
            completed: false
          };
          setArmTargetTrack(blocks[0].track);
        }
      });
    }

    // 2. Run Disk Defragmenter (Defrags ALL Files!)
    if (btnDefrag) {
      btnDefrag.addEventListener('click', () => {
        if (hddState.isReading) return;
        hddState.isReading = true;
        btnDefrag.disabled = true;

        if (explainer) {
          explainer.innerHTML = `
            <strong style="color: #38bdf8;">Disk Defragmenter Running:</strong> Reorganizing ALL scattered sectors on the hard drive into contiguous blocks on Track 0 (Outer Track)...
          `;
        }

        let step = 0;
        const interval = setInterval(() => {
          step++;
          setArmTargetTrack(step % 3);

          if (step >= 8) {
            clearInterval(interval);
            hddState.isDefragged = true;
            hddState.isReading = false;
            setArmTargetTrack(0);

            // Recompute File D layout if already written
            if (hddState.isWrittenD) {
              if (hddState.overwroteB) {
                hddState.fileDBlocks = [
                  { track: 0, sector: 4, label: 'D1' },
                  { track: 0, sector: 5, label: 'D2' },
                  { track: 0, sector: 6, label: 'D3' }
                ];
              } else {
                hddState.fileDBlocks = [
                  { track: 0, sector: 9, label: 'D1' },
                  { track: 0, sector: 10, label: 'D2' },
                  { track: 0, sector: 11, label: 'D3' }
                ];
              }
            }

            updateFatTable();
            updateReadFileABtn();
            btnDefrag.disabled = false;

            if (explainer) {
              explainer.innerHTML = `
                <strong style="color: #10b981;">✓ All Files Defragmented:</strong> Files are now packed into contiguous sectors on Track 0! Click <strong>"Read File A"</strong> to test high-speed sequential read without track jumping.
              `;
            }
          }
        }, 220);
      });
    }

    // 3. Delete File B
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (hddState.overwroteB) {
          if (explainer) {
            explainer.innerHTML = `
              <strong style="color: #f59e0b;">Notice:</strong> File B's sectors have already been permanently overwritten by File D (<code>save_data.dat</code>).
            `;
          }
          return;
        }

        hddState.isDeletedB = true;
        updateFatTable();

        if (explainer) {
          explainer.innerHTML = `
            <strong style="color: #ec4899;">Why "Deleted" Files Aren't Really Deleted:</strong><br>
            Notice File B's status in the File Allocation Table (FAT) above! The OS did <strong>NOT wipe the magnetic sectors</strong> on the disc (writing zeroes to every sector would take minutes). 
            Instead, it simply <strong>unlinked the pointer</strong> in the table and marked those sectors as <em>"Free for overwrite"</em>.<br>
            The original magnetic data stays physically on the platter until a new file overwrites it. <strong>Now click "Write File D" to see what happens when the OS overwrites freed sectors!</strong>
          `;
        }
      });
    }

    // 4. Write File D (Realistic New File & Overwrite Simulation)
    if (btnWriteD) {
      btnWriteD.addEventListener('click', () => {
        if (hddState.isReading) return;

        if (hddState.isWrittenD) {
          if (explainer) {
            explainer.innerHTML = `
              <strong style="color: #06b6d4;">File D Already Written:</strong> <code>save_data.dat</code> is already allocated on the disc. Click <strong>"Reset Drive"</strong> to test a different deletion/write sequence.
            `;
          }
          return;
        }

        hddState.isWrittenD = true;

        if (hddState.isDeletedB) {
          // File B was freed! Overwrite File B's freed sectors
          hddState.overwroteB = true;
          if (hddState.isDefragged) {
            hddState.fileDBlocks = [
              { track: 0, sector: 4, label: 'D1' },
              { track: 0, sector: 5, label: 'D2' },
              { track: 0, sector: 6, label: 'D3' }
            ];
          } else {
            hddState.fileDBlocks = [
              { track: 1, sector: 2, label: 'D1' },
              { track: 2, sector: 7, label: 'D2' },
              { track: 1, sector: 10, label: 'D3' }
            ];
          }

          setArmTargetTrack(hddState.fileDBlocks[0].track);
          hddState.flashSector = { track: hddState.fileDBlocks[0].track, sector: hddState.fileDBlocks[0].sector };
          hddState.flashCounter = 30;
          updateFatTable();

          if (explainer) {
            explainer.innerHTML = `
              <strong style="color: #06b6d4;">💾 File D Overwrote Deleted File B:</strong><br>
              Because File B was marked deleted in the FAT, the OS reused its freed sectors! File D (<code>save_data.dat</code>: D1, D2, D3 in cyan) has now physically written over those magnetic sectors.<br>
              <span style="color: #ef4444; font-weight: 700;">Critical Security Insight:</span> Previously, File B could still be recovered because its magnetic charges were untouched. Now that File D has physically rewritten them, <strong>File B is permanently destroyed and unrecoverable!</strong>
            `;
          }
        } else {
          // File B was NOT deleted: allocate fresh unused sectors
          hddState.overwroteB = false;
          if (hddState.isDefragged) {
            hddState.fileDBlocks = [
              { track: 0, sector: 9, label: 'D1' },
              { track: 0, sector: 10, label: 'D2' },
              { track: 0, sector: 11, label: 'D3' }
            ];
          } else {
            hddState.fileDBlocks = [
              { track: 1, sector: 0, label: 'D1' },
              { track: 1, sector: 3, label: 'D2' },
              { track: 2, sector: 0, label: 'D3' }
            ];
          }

          setArmTargetTrack(hddState.fileDBlocks[0].track);
          hddState.flashSector = { track: hddState.fileDBlocks[0].track, sector: hddState.fileDBlocks[0].sector };
          hddState.flashCounter = 30;
          updateFatTable();

          if (explainer) {
            explainer.innerHTML = `
              <strong style="color: #06b6d4;">💾 File D Written to Free Sectors:</strong><br>
              The OS found unallocated sectors on the hard drive and wrote File D (<code>save_data.dat</code>: D1, D2, D3 in cyan). 
              Because File B was not deleted, its data was preserved intact.
            `;
          }
        }
      });
    }

    // 5. Reset Drive Handler
    function resetDrive() {
      hddState.isDefragged = false;
      hddState.isDeletedB = false;
      hddState.isWrittenD = false;
      hddState.overwroteB = false;
      hddState.fileDBlocks = [];
      hddState.isReading = false;
      hddState.readJob = null;
      hddState.flashSector = null;
      hddState.flashCounter = 0;
      setArmTargetTrack(0);
      updateFatTable();
      updateReadFileABtn();
      updateHddTelemetryDisplay(0, 0, 0);

      if (btnReadFileA) btnReadFileA.disabled = false;
      if (btnDefrag) btnDefrag.disabled = false;

      if (explainer) {
        explainer.innerHTML = `
          <strong style="color: #38bdf8;">Drive Reset:</strong> Drive restored to its original fragmented file distribution. Ready for read and write simulation.
        `;
      }
    }

    if (btnReset) btnReset.addEventListener('click', resetDrive);
    if (btnPlatterReset) btnPlatterReset.addEventListener('click', resetDrive);

    // 6. Play / Pause Button
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        hddState.isSpinning = !hddState.isSpinning;
        if (pauseIcon) {
          pauseIcon.textContent = hddState.isSpinning ? '⏸' : '▶';
        }
        if (explainer) {
          explainer.innerHTML = hddState.isSpinning
            ? `<span style="color: #10b981;">▶ Platter Resumed:</span> Spinning at 7,200 RPM.`
            : `<span style="color: #f59e0b;">⏸ Platter Paused:</span> Spindle motor stopped. Move your mouse across the canvas to inspect sectors and tracks.`;
        }
      });
    }

    // 7. Mouseover Inspector HUD
    const canvas = document.getElementById('hddCanvas');
    const hudText = document.getElementById('hddInspectorText');

    if (canvas && hudText) {
      canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const distFromCenter = Math.hypot(mouseX - HDD_GEOM.cx, mouseY - HDD_GEOM.cy);
        const distFromPivot = Math.hypot(mouseX - HDD_GEOM.px, mouseY - HDD_GEOM.py);

        // Check if over spindle
        if (distFromCenter <= 26) {
          hudText.innerHTML = `<strong>Spindle Center:</strong> Precision brushless DC motor spinning the metallic platters at 7,200 RPM.`;
          return;
        }

        // Check if over actuator arm / pivot
        if (distFromPivot <= 30 || (mouseX > 280 && mouseY < 150)) {
          hudText.innerHTML = `<strong>Actuator Arm &amp; Pivot:</strong> Voice-coil motor swings the mechanical arm across tracks. Jumping tracks creates <strong>Seek Time</strong>.`;
          return;
        }

        // Check which track is hovered
        let hoveredTrack = -1;
        if (distFromCenter >= 132 && distFromCenter <= 160) hoveredTrack = 0;
        else if (distFromCenter >= 98 && distFromCenter <= 124) hoveredTrack = 1;
        else if (distFromCenter >= 62 && distFromCenter <= 88) hoveredTrack = 2;

        if (hoveredTrack !== -1) {
          const angle = (Math.atan2(mouseY - HDD_GEOM.cy, mouseX - HDD_GEOM.cx) - hddState.angle) % (Math.PI * 2);
          const normAngle = angle < 0 ? angle + Math.PI * 2 : angle;
          const sector = Math.floor(normAngle / ((Math.PI * 2) / 12));

          const trackNames = ['Track 0 (Outer)', 'Track 1 (Middle)', 'Track 2 (Inner)'];
          hudText.innerHTML = `<strong>${trackNames[hoveredTrack]} • Sector ${sector}:</strong> 512-byte magnetic data block. Outer tracks have higher linear velocity for faster sequential throughput.`;
          return;
        }

        hudText.textContent = `Move mouse over tracks, sectors, spindle, or actuator head to inspect hardware components.`;
      });

      canvas.addEventListener('mouseleave', () => {
        hudText.textContent = `Move mouse over tracks, sectors, spindle, or actuator head to inspect hardware components.`;
      });
    }

    updateFatTable();
  }


  // =========================================================================
  // 5. SSD WORKBENCH (NAND FLASH CHIPS WITH FILE C)
  // =========================================================================

  function initSsdSimulation() {
    const grid = document.getElementById('ssdChipsGrid');
    const btnReadA = document.getElementById('btnSsdRead');
    const btnReadB = document.getElementById('btnSsdReadB');
    const btnReadC = document.getElementById('btnSsdReadC');
    const btnDefrag = document.getElementById('btnSsdDefrag');
    const explainer = document.getElementById('ssdExplainerBox');

    if (!grid) return;

    grid.innerHTML = '';
    const chipNames = ['NAND Die #1', 'NAND Die #2', 'NAND Die #3', 'NAND Die #4'];

    // 4 chips with 6 cells each (File A, File B, File C, and Free cells)
    for (let c = 0; c < 4; c++) {
      const chipEl = document.createElement('div');
      chipEl.className = 'ssd-chip';
      chipEl.innerHTML = `
        <div class="ssd-chip-head">
          <span>${chipNames[c]}</span>
          <span style="color: #10b981; font-size: 9px;">Channel ${c}</span>
        </div>
        <div class="ssd-cells-matrix">
          ${[0, 1, 2, 3, 4, 5].map(cellIdx => {
            // File A: (0,1), (1,4), (2,2), (3,5)
            const isFileA = (c === 0 && cellIdx === 1) || (c === 1 && cellIdx === 4) || (c === 2 && cellIdx === 2) || (c === 3 && cellIdx === 5);
            // File B: (0,3), (1,0), (2,5)
            const isFileB = (c === 0 && cellIdx === 3) || (c === 1 && cellIdx === 0) || (c === 2 && cellIdx === 5);
            // File C: (1,2), (3,1)
            const isFileC = (c === 1 && cellIdx === 2) || (c === 3 && cellIdx === 1);

            let cls = 'ssd-cell';
            let label = '';
            if (isFileA) {
              cls += ' cell-file-a';
              label = 'File A';
            } else if (isFileB) {
              cls += ' cell-file-b';
              label = 'File B';
            } else if (isFileC) {
              cls += ' cell-file-c';
              label = 'File C';
            }

            return `<div class="${cls}" data-chip="${c}" data-cell="${cellIdx}">${label}</div>`;
          }).join('')}
        </div>
      `;
      grid.appendChild(chipEl);
    }

    function triggerSsdRead(targetClass, fileName) {
      const cells = document.querySelectorAll(`.ssd-cell.${targetClass}`);
      cells.forEach(el => el.classList.add('reading-active'));

      if (explainer) {
        explainer.innerHTML = `
          <strong style="color: #10b981;">⚡ Parallel Electrical Read (${fileName}):</strong> The SSD controller activated multiple parallel silicon channels at once. 
          All blocks were read simultaneously in <strong>0.08 milliseconds</strong>. 
          Even though blocks are non-contiguous across separate dies, there is <strong>zero mechanical seek penalty</strong>!
        `;
      }

      updateBenchmarkScore('ssd', 0.08);

      setTimeout(() => {
        cells.forEach(el => el.classList.remove('reading-active'));
      }, 1000);
    }

    if (btnReadA) btnReadA.addEventListener('click', () => triggerSsdRead('cell-file-a', 'File A: game_levels.pak'));
    if (btnReadB) btnReadB.addEventListener('click', () => triggerSsdRead('cell-file-b', 'File B: vacation_clip.mp4'));
    if (btnReadC) btnReadC.addEventListener('click', () => triggerSsdRead('cell-file-c', 'File C: notes.txt'));

    // Try Defrag Warning
    if (btnDefrag) {
      btnDefrag.addEventListener('click', () => {
        if (explainer) {
          explainer.innerHTML = `
            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; padding: 12px; border-radius: var(--radius-md);">
              <strong style="color: #ef4444; font-size: 14px;">🚨 NEVER DEFRAGMENT AN SSD!</strong><br>
              <p style="margin: 6px 0 0 0; font-size: 13px; line-height: 1.6; color: var(--text-primary);">
                <strong>1. Zero Speed Advantage:</strong> Seek time on an SSD is already 0.00 ms. Non-contiguous blocks read at the exact same lightning speed as contiguous blocks.<br>
                <strong>2. Premature Hardware Wear:</strong> Solid-state NAND flash cells can only withstand a finite number of Program/Erase (P/E) write cycles before degrading. 
                Running a defragmenter needlessly writes and moves gigabytes of files, wearing out the silicon cells and significantly shortening the SSD's lifespan!
              </p>
            </div>
          `;
        }
      });
    }
  }


  // =========================================================================
  // 6. SECONDARY MODE SWITCHER (HDD vs SSD)
  // =========================================================================

  function initModeSwitching() {
    const modeBtns = document.querySelectorAll('.storage-mode-btn');
    const hddBox = document.getElementById('hddWorkbench');
    const ssdBox = document.getElementById('ssdWorkbench');

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const mode = btn.getAttribute('data-mode');
        if (mode === 'hdd') {
          if (hddBox) hddBox.style.display = 'block';
          if (ssdBox) ssdBox.style.display = 'none';
        } else if (mode === 'ssd') {
          if (hddBox) hddBox.style.display = 'none';
          if (ssdBox) ssdBox.style.display = 'block';
        }
      });
    });
  }


  // =========================================================================
  // 7. INITIALIZATION ENTRYPOINT
  // =========================================================================

  function initStorageModule() {
    initPrimaryMemory();
    initHddCanvas();
    initHddControls();
    initSsdSimulation();
    initModeSwitching();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStorageModule);
  } else {
    initStorageModule();
  }

})();
