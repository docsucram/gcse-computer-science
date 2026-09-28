/**
 * GCSE CPU Architecture & LMC Module Logic
 * Pure Vanilla JavaScript (ES6+) - Zero build tools required
 * Aligned with AQA 8525 §3.4.1 (Systems Architecture) + LMC Extension
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. THEME & NAVIGATION CONTROLS
  // =========================================================================

  function initTheme() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');

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
      if (sunIcon && moonIcon) {
        sunIcon.style.display = dark ? 'block' : 'none';
        moonIcon.style.display = dark ? 'none' : 'block';
      }
    }

    updateIcons(isDark);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
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
    const tabButtons = document.querySelectorAll('.view-tab-btn');
    const tabViews = document.querySelectorAll('.tab-view');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabViews.forEach(v => v.classList.remove('active'));

        btn.classList.add('active');
        const tabKey = btn.getAttribute('data-tab');
        const targetView = document.getElementById(`tab-${tabKey}`);
        if (targetView) targetView.classList.add('active');
      });
    });
  }

  // =========================================================================
  // 2. TAB 1: FETCH-DECODE-EXECUTE VISUALIZER (Core AQA §3.4.1)
  // =========================================================================

  const FDE_PROGRAMS = {
    add: {
      name: 'Add Two Numbers (12 + 8)',
      ram: [
        { addr: '00', val: 'LOAD 05', type: 'Instruction' },
        { addr: '01', val: 'ADD 06',  type: 'Instruction' },
        { addr: '02', val: 'STORE 07',type: 'Instruction' },
        { addr: '03', val: 'HLT',     type: 'Instruction' },
        { addr: '04', val: '0',       type: 'Empty' },
        { addr: '05', val: '12',      type: 'Data' },
        { addr: '06', val: '8',       type: 'Data' },
        { addr: '07', val: '0',       type: 'Result' },
      ]
    },
    sub: {
      name: 'Subtract Numbers (20 - 7)',
      ram: [
        { addr: '00', val: 'LOAD 05', type: 'Instruction' },
        { addr: '01', val: 'SUB 06',  type: 'Instruction' },
        { addr: '02', val: 'STORE 07',type: 'Instruction' },
        { addr: '03', val: 'HLT',     type: 'Instruction' },
        { addr: '04', val: '0',       type: 'Empty' },
        { addr: '05', val: '20',      type: 'Data' },
        { addr: '06', val: '7',       type: 'Data' },
        { addr: '07', val: '0',       type: 'Result' },
      ]
    },
    store: {
      name: 'Store Constant (Value 42)',
      ram: [
        { addr: '00', val: 'LOAD 04', type: 'Instruction' },
        { addr: '01', val: 'STORE 05',type: 'Instruction' },
        { addr: '02', val: 'HLT',     type: 'Instruction' },
        { addr: '03', val: '0',       type: 'Empty' },
        { addr: '04', val: '42',      type: 'Data' },
        { addr: '05', val: '0',       type: 'Result' },
        { addr: '06', val: '0',       type: 'Empty' },
        { addr: '07', val: '0',       type: 'Empty' },
      ]
    }
  };

  let fdeState = {
    selectedProgram: 'add',
    ram: [],
    pc: 0,
    mar: '00',
    mdr: '---',
    cir: '---',
    acc: 0,
    decodedOpcode: 'NONE',
    decodedOperand: '',
    currentMicroStepIndex: 0,
    microSteps: [],
    isPlaying: false,
    playIntervalTimer: null,
    playSpeedMs: 1000,
    isHalted: false,
    historyLog: [],
  };

  // Micro-step generator based on current instruction (AQA 8525 Full F-D-E Cycle with CIR)
  function generateMicroStepsForInstruction(pcVal) {
    const ramEntry = fdeState.ram[pcVal];
    if (!ramEntry || ramEntry.type !== 'Instruction') {
      return [
        {
          stage: 'HALTED',
          title: 'Execution Complete (Halted)',
          body: 'The CPU has encountered the end of program instructions and halted execution.',
          quote: 'The CPU halts when execution of the program completes.',
          action: () => { fdeState.isHalted = true; }
        }
      ];
    }

    const tokens = ramEntry.val.trim().split(/\s+/);
    const opcode = tokens[0].toUpperCase();
    const operand = tokens[1] || '';
    const pcStr = pcVal.toString().padStart(2, '0');
    const nextPcStr = (pcVal + 1).toString().padStart(2, '0');

    const steps = [];

    // Step 1: Fetch A (PC -> MAR)
    steps.push({
      stage: 'FETCH',
      title: 'Fetch 1: Copy PC Address to MAR',
      body: `The address stored in the Program Counter (${pcStr}) is placed on the Address Bus and copied into the Memory Address Register (MAR).`,
      quote: 'The address in the PC is copied to the MAR.',
      activeElements: { source: 'regPC', target: 'regMAR', bus: 'busAddress', busText: `Addr: ${pcStr}`, packet: { bus: 'busAddress', dir: 'to-ram' } },
      action: () => {
        fdeState.mar = pcStr;
      }
    });

    // Step 2: Fetch B (PC Increments)
    steps.push({
      stage: 'FETCH',
      title: 'Fetch 2: Increment Program Counter',
      body: `The Program Counter (PC) increments by 1 (now ${nextPcStr}) so it points to the subsequent instruction in memory for the next cycle.`,
      quote: 'The PC is incremented by 1.',
      activeElements: { source: 'regPC', target: null, bus: null },
      action: () => {
        fdeState.pc = pcVal + 1;
      }
    });

    // Step 3: Fetch C (RAM[MAR] -> MDR via Data Bus)
    steps.push({
      stage: 'FETCH',
      title: 'Fetch 3: Fetch Instruction from RAM to MDR',
      body: `The Control Unit sends a memory read signal. The instruction stored at RAM address ${pcStr} ("${ramEntry.val}") is transferred across the Data Bus into the MDR.`,
      quote: 'The instruction at the address in MAR is fetched from RAM into the MDR.',
      activeElements: { source: `ram-row-${pcStr}`, target: 'regMDR', bus: 'busData', busText: `Data: ${ramEntry.val}`, controlText: 'READ', packet: { bus: 'busData', dir: 'to-cpu' } },
      action: () => {
        fdeState.mdr = ramEntry.val;
      }
    });

    // Step 4: Fetch D (MDR -> CIR)
    steps.push({
      stage: 'FETCH',
      title: 'Fetch 4: Copy Instruction from MDR to CIR',
      body: `The instruction held in the MDR ("${ramEntry.val}") is copied directly into the Current Instruction Register (CIR) so the MDR is freed up to fetch subsequent data operands.`,
      quote: 'The instruction in MDR is copied to the Current Instruction Register (CIR).',
      activeElements: { source: 'regMDR', target: 'regCIR', bus: null },
      action: () => {
        fdeState.cir = ramEntry.val;
      }
    });

    // Step 5: Decode (CIR -> CU)
    steps.push({
      stage: 'DECODE',
      title: 'Decode: Control Unit Decodes Opcode in CIR',
      body: `The instruction in the CIR ("${ramEntry.val}") is decoded by the Control Unit (CU). The CU splits it into opcode (${opcode}) and operand address (${operand || 'None'}).`,
      quote: 'The instruction in the CIR is decoded by the Control Unit.',
      activeElements: { source: 'regCIR', target: 'cuBlock', bus: null },
      action: () => {
        fdeState.decodedOpcode = opcode;
        fdeState.decodedOperand = operand;
      }
    });

    // Step 6+: Execute based on Opcode
    if (opcode === 'LOAD') {
      steps.push({
        stage: 'EXECUTE',
        title: `Execute 1: Place Operand Address ${operand} on MAR`,
        body: `To load the value from memory address ${operand}, the address ${operand} is placed into the MAR and sent along the Address Bus.`,
        quote: 'Address of operand placed on MAR for reading.',
        activeElements: { source: 'cuBlock', target: 'regMAR', bus: 'busAddress', busText: `Addr: ${operand}`, packet: { bus: 'busAddress', dir: 'to-ram' } },
        action: () => {
          fdeState.mar = operand;
        }
      });
      steps.push({
        stage: 'EXECUTE',
        title: `Execute 2: Load Data into Accumulator (ACC)`,
        body: `The data at RAM address ${operand} is fetched across the Data Bus into the MDR, and then loaded directly into the Accumulator (ACC).`,
        quote: 'Data loaded from RAM into the Accumulator register.',
        activeElements: { source: `ram-row-${operand}`, target: 'regACC', bus: 'busData', busText: `Data: ${fdeState.ram[parseInt(operand, 10)]?.val || '0'}`, controlText: 'READ', packet: { bus: 'busData', dir: 'to-cpu' } },
        action: () => {
          const val = parseInt(fdeState.ram[parseInt(operand, 10)]?.val || '0', 10);
          fdeState.mdr = val.toString();
          fdeState.acc = val;
        }
      });
    } else if (opcode === 'ADD') {
      steps.push({
        stage: 'EXECUTE',
        title: `Execute 1: Fetch Operand from Address ${operand}`,
        body: `The address ${operand} is sent to MAR. The number is fetched across the Data Bus into the MDR to be added by the ALU.`,
        quote: 'Operand address copied to MAR; data fetched into MDR.',
        activeElements: { source: 'cuBlock', target: 'regMAR', bus: 'busAddress', busText: `Addr: ${operand}`, packet: { bus: 'busAddress', dir: 'to-ram' } },
        action: () => {
          fdeState.mar = operand;
        }
      });
      steps.push({
        stage: 'EXECUTE',
        title: `Execute 2: ALU Adds Operand to Accumulator`,
        body: `The ALU adds the value in MDR to the value in the Accumulator. The result (${fdeState.acc} + ${fdeState.ram[parseInt(operand, 10)]?.val}) is stored in the ACC.`,
        quote: 'ALU performs arithmetic addition and stores result in Accumulator.',
        activeElements: { source: 'aluBlock', target: 'regACC', bus: 'busData', busText: `Data: ${fdeState.ram[parseInt(operand, 10)]?.val || '0'}`, controlText: 'READ', packet: { bus: 'busData', dir: 'to-cpu' } },
        action: () => {
          const addVal = parseInt(fdeState.ram[parseInt(operand, 10)]?.val || '0', 10);
          fdeState.mdr = addVal.toString();
          fdeState.acc += addVal;
        }
      });
    } else if (opcode === 'SUB') {
      steps.push({
        stage: 'EXECUTE',
        title: `Execute 1: Fetch Operand from Address ${operand}`,
        body: `The address ${operand} is sent to MAR. The value to subtract is fetched across the Data Bus into the MDR.`,
        quote: 'Operand address copied to MAR; data fetched into MDR.',
        activeElements: { source: 'cuBlock', target: 'regMAR', bus: 'busAddress', busText: `Addr: ${operand}`, packet: { bus: 'busAddress', dir: 'to-ram' } },
        action: () => {
          fdeState.mar = operand;
        }
      });
      steps.push({
        stage: 'EXECUTE',
        title: `Execute 2: ALU Subtracts Operand from Accumulator`,
        body: `The ALU subtracts the value in MDR from the Accumulator. The result is stored back in the Accumulator (ACC).`,
        quote: 'ALU performs subtraction and stores result in Accumulator.',
        activeElements: { source: 'aluBlock', target: 'regACC', bus: 'busData', busText: `Data: ${fdeState.ram[parseInt(operand, 10)]?.val || '0'}`, controlText: 'READ', packet: { bus: 'busData', dir: 'to-cpu' } },
        action: () => {
          const subVal = parseInt(fdeState.ram[parseInt(operand, 10)]?.val || '0', 10);
          fdeState.mdr = subVal.toString();
          fdeState.acc -= subVal;
        }
      });
    } else if (opcode === 'STORE') {
      steps.push({
        stage: 'EXECUTE',
        title: `Execute 1: Set Destination Address ${operand} on MAR`,
        body: `The target destination address ${operand} is loaded into the MAR to prepare for writing data to RAM.`,
        quote: 'Destination address placed on MAR.',
        activeElements: { source: 'cuBlock', target: 'regMAR', bus: 'busAddress', busText: `Addr: ${operand}`, packet: { bus: 'busAddress', dir: 'to-ram' } },
        action: () => {
          fdeState.mar = operand;
          fdeState.mdr = fdeState.acc.toString();
        }
      });
      steps.push({
        stage: 'EXECUTE',
        title: `Execute 2: Write Accumulator Value to RAM`,
        body: `The value in the Accumulator (${fdeState.acc}) is written into RAM at address ${operand} via the Data Bus. The Control Unit pulses WRITE.`,
        quote: 'Value in MDR written into memory location specified by MAR.',
        activeElements: { source: 'regACC', target: `ram-row-${operand}`, bus: 'busData', busText: `Data: ${fdeState.acc}`, controlText: 'WRITE', packet: { bus: 'busData', dir: 'to-ram' } },
        action: () => {
          const targetIdx = parseInt(operand, 10);
          if (fdeState.ram[targetIdx]) {
            fdeState.ram[targetIdx].val = fdeState.acc.toString();
          }
        }
      });
    } else if (opcode === 'HLT') {
      steps.push({
        stage: 'EXECUTE',
        title: 'Execute: Stop Instruction Execution',
        body: 'The HLT instruction signals the Control Unit to stop the fetch-decode-execute cycle. Program execution terminates.',
        quote: 'The CPU stops executing instructions.',
        activeElements: { source: 'cuBlock', target: null, bus: null },
        action: () => {
          fdeState.isHalted = true;
          fdeState.isPlaying = false;
          updateFDEPlayButton();
        }
      });
    }

    return steps;
  }

  function resetFDE() {
    pauseFDE();
    const prog = FDE_PROGRAMS[fdeState.selectedProgram] || FDE_PROGRAMS.add;
    fdeState.ram = JSON.parse(JSON.stringify(prog.ram));
    fdeState.pc = 0;
    fdeState.mar = '00';
    fdeState.mdr = '---';
    fdeState.cir = '---';
    fdeState.acc = 0;
    fdeState.decodedOpcode = 'NONE';
    fdeState.decodedOperand = '';
    fdeState.isHalted = false;
    fdeState.microSteps = generateMicroStepsForInstruction(0);
    fdeState.currentMicroStepIndex = 0;
    fdeState.historyLog = [];

    renderRAMTable();
    updateRegistersDOM();
    updateStepNarrativeDOM();
    renderHistoryLogDOM();
  }

  function renderRAMTable() {
    const tbody = document.getElementById('ramTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    fdeState.ram.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.id = `ram-row-${row.addr}`;
      tr.className = 'ram-row';

      const tdAddr = document.createElement('td');
      tdAddr.textContent = row.addr;
      tdAddr.style.fontWeight = '700';
      tdAddr.style.color = 'var(--text-secondary)';

      const tdVal = document.createElement('td');
      tdVal.id = `ram-val-${row.addr}`;
      tdVal.textContent = row.val;
      tdVal.style.color = row.type === 'Instruction' ? '#818cf8' : (row.type === 'Result' ? '#34d399' : 'var(--text-primary)');

      const tdType = document.createElement('td');
      tdType.style.fontSize = '10px';
      tdType.style.color = 'var(--text-muted)';
      tdType.textContent = row.type;

      tr.appendChild(tdAddr);
      tr.appendChild(tdVal);
      tr.appendChild(tdType);
      tbody.appendChild(tr);
    });
  }

  function updateRegistersDOM() {
    const valPC = document.getElementById('valPC');
    const valMAR = document.getElementById('valMAR');
    const valMDR = document.getElementById('valMDR');
    const valCIR = document.getElementById('valCIR');
    const valACC = document.getElementById('valACC');
    const cuDecodedText = document.getElementById('cuDecodedText');
    const aluResultText = document.getElementById('aluResultText');

    if (valPC) valPC.textContent = fdeState.pc.toString().padStart(2, '0');
    if (valMAR) valMAR.textContent = fdeState.mar;
    if (valMDR) valMDR.textContent = fdeState.mdr;
    if (valCIR) valCIR.textContent = fdeState.cir;
    if (valACC) valACC.textContent = fdeState.acc.toString();
    if (cuDecodedText) cuDecodedText.textContent = fdeState.decodedOpcode + (fdeState.decodedOperand ? ` ${fdeState.decodedOperand}` : '');
    if (aluResultText) aluResultText.textContent = fdeState.acc.toString();
  }

  function clearActiveGlows() {
    document.querySelectorAll('.component-block').forEach(el => el.classList.remove('active-glow'));
    document.querySelectorAll('.register-card').forEach(el => {
      el.classList.remove('active-source', 'active-target');
    });
    document.querySelectorAll('.bus-line').forEach(el => el.classList.remove('bus-active'));
    document.querySelectorAll('.bus-packet-indicator').forEach(el => {
      el.classList.remove('packet-to-ram', 'packet-to-cpu');
    });
    document.querySelectorAll('.ram-row').forEach(el => el.classList.remove('active-ram-read', 'active-ram-write'));

    const bAddr = document.getElementById('busAddressVal');
    const bData = document.getElementById('busDataVal');
    const bCtrl = document.getElementById('busControlVal');
    if (bAddr) bAddr.textContent = 'Idle';
    if (bData) bData.textContent = 'Idle';
    if (bCtrl) bCtrl.textContent = 'Idle';
  }

  function updateStepNarrativeDOM() {
    const currentStep = fdeState.microSteps[fdeState.currentMicroStepIndex];
    if (!currentStep) return;

    const narrativeStageBadge = document.getElementById('narrativeStageBadge');
    const narrativeTitle = document.getElementById('narrativeTitle');
    const narrativeBody = document.getElementById('narrativeBody');
    const aqaExamQuote = document.getElementById('aqaExamQuote');
    const stepCounterBadge = document.getElementById('stepCounterBadge');
    const cycleStatusBadge = document.getElementById('cycleStatusBadge');

    if (narrativeStageBadge) {
      narrativeStageBadge.textContent = `${currentStep.stage} STAGE`;
      narrativeStageBadge.className = `stage-badge stage-${currentStep.stage.toLowerCase()}`;
    }
    if (narrativeTitle) narrativeTitle.textContent = currentStep.title;
    if (narrativeBody) narrativeBody.textContent = currentStep.body;
    if (aqaExamQuote) aqaExamQuote.textContent = `"${currentStep.quote}"`;

    if (stepCounterBadge) {
      stepCounterBadge.textContent = `Step ${fdeState.currentMicroStepIndex + 1} of ${fdeState.microSteps.length}`;
    }
    if (cycleStatusBadge) {
      cycleStatusBadge.textContent = `Stage: ${currentStep.stage} (Instr @ 0${Math.max(0, fdeState.pc - (currentStep.stage === 'FETCH' && fdeState.currentMicroStepIndex > 1 ? 1 : 0))})`;
    }
  }

  function applyMicroStepVisuals(step) {
    clearActiveGlows();
    if (!step) return;

    const act = step.activeElements || {};

    if (act.source) {
      const srcEl = document.getElementById(act.source);
      if (srcEl) {
        if (srcEl.classList.contains('register-card')) srcEl.classList.add('active-source');
        else if (srcEl.classList.contains('component-block')) srcEl.classList.add('active-glow');
        else if (srcEl.classList.contains('ram-row')) srcEl.classList.add('active-ram-read');
      }
    }

    if (act.target) {
      const tgtEl = document.getElementById(act.target);
      if (tgtEl) {
        if (tgtEl.classList.contains('register-card')) tgtEl.classList.add('active-target');
        else if (tgtEl.classList.contains('component-block')) tgtEl.classList.add('active-glow');
        else if (tgtEl.classList.contains('ram-row')) tgtEl.classList.add('active-ram-write');
      }
    }

    if (act.bus) {
      const busEl = document.getElementById(act.bus);
      if (busEl) busEl.classList.add('bus-active');
    }

    if (act.packet) {
      let packetEl = null;
      if (act.packet.bus === 'busAddress') packetEl = document.getElementById('packetAddress');
      else if (act.packet.bus === 'busData') packetEl = document.getElementById('packetData');
      else if (act.packet.bus === 'busControl') packetEl = document.getElementById('packetControl');

      if (packetEl) {
        packetEl.classList.remove('packet-to-ram', 'packet-to-cpu');
        void packetEl.offsetWidth; // force reflow for smooth re-trigger
        packetEl.classList.add(act.packet.dir === 'to-ram' ? 'packet-to-ram' : 'packet-to-cpu');
      }
    }

    if (act.busText && act.bus === 'busAddress') {
      const bAddr = document.getElementById('busAddressVal');
      if (bAddr) bAddr.textContent = act.busText;
    }
    if (act.busText && act.bus === 'busData') {
      const bData = document.getElementById('busDataVal');
      if (bData) bData.textContent = act.busText;
    }
    if (act.controlText) {
      const bCtrl = document.getElementById('busControlVal');
      const busControl = document.getElementById('busControl');
      if (bCtrl) bCtrl.textContent = act.controlText;
      if (busControl) busControl.classList.add('bus-active');
    }
  }

  function addHistoryLogEntry(step) {
    fdeState.historyLog.push({
      stage: step.stage,
      title: step.title,
      text: step.quote
    });
    renderHistoryLogDOM();
  }

  function renderHistoryLogDOM() {
    const box = document.getElementById('traceLogBox');
    if (!box) return;
    box.innerHTML = '';

    fdeState.historyLog.forEach((entry, idx) => {
      const item = document.createElement('div');
      item.className = `log-entry ${entry.stage.toLowerCase()}`;
      item.innerHTML = `<strong>[${entry.stage}]</strong> ${entry.title}: <em>"${entry.text}"</em>`;
      box.appendChild(item);
    });

    // Auto-scroll to bottom
    box.scrollTop = box.scrollHeight;
  }

  function stepForwardFDE() {
    if (fdeState.isHalted) {
      pauseFDE();
      return;
    }

    const currentStep = fdeState.microSteps[fdeState.currentMicroStepIndex];
    if (!currentStep) return;

    // Execute step action
    currentStep.action();
    applyMicroStepVisuals(currentStep);
    updateRegistersDOM();
    updateStepNarrativeDOM();
    renderRAMTable();
    addHistoryLogEntry(currentStep);

    // Advance to next microstep
    fdeState.currentMicroStepIndex++;

    // Check if we finished the micro-steps for the current instruction
    if (fdeState.currentMicroStepIndex >= fdeState.microSteps.length) {
      if (fdeState.isHalted) {
        pauseFDE();
        return;
      }
      // Generate next instruction's micro-steps
      fdeState.microSteps = generateMicroStepsForInstruction(fdeState.pc);
      fdeState.currentMicroStepIndex = 0;
    }
  }

  function playFDE() {
    if (fdeState.isHalted) {
      resetFDE();
    }
    fdeState.isPlaying = true;
    updateFDEPlayButton();
    fdeState.playIntervalTimer = setInterval(() => {
      stepForwardFDE();
    }, fdeState.playSpeedMs);
  }

  function pauseFDE() {
    fdeState.isPlaying = false;
    if (fdeState.playIntervalTimer) {
      clearInterval(fdeState.playIntervalTimer);
      fdeState.playIntervalTimer = null;
    }
    updateFDEPlayButton();
  }

  function updateFDEPlayButton() {
    const playBtn = document.getElementById('fdePlayBtn');
    if (playBtn) {
      playBtn.textContent = fdeState.isPlaying ? '⏸ Pause' : '▶ Play';
      playBtn.classList.toggle('active', fdeState.isPlaying);
    }
  }

  function initFDE() {
    const progSelect = document.getElementById('programSelect');
    const stepBtn = document.getElementById('fdeStepBtn');
    const playBtn = document.getElementById('fdePlayBtn');
    const resetBtn = document.getElementById('fdeResetBtn');
    const speedButtons = document.querySelectorAll('.speed-btn-fde');
    const clearLogBtn = document.getElementById('clearLogBtn');

    if (progSelect) {
      progSelect.addEventListener('change', (e) => {
        fdeState.selectedProgram = e.target.value;
        resetFDE();
      });
    }

    if (stepBtn) {
      stepBtn.addEventListener('click', () => {
        pauseFDE();
        stepForwardFDE();
      });
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (fdeState.isPlaying) pauseFDE();
        else playFDE();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', resetFDE);
    }

    speedButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        speedButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        fdeState.playSpeedMs = parseInt(btn.getAttribute('data-speed'), 10);
        if (fdeState.isPlaying) {
          pauseFDE();
          playFDE();
        }
      });
    });

    if (clearLogBtn) {
      clearLogBtn.addEventListener('click', () => {
        fdeState.historyLog = [];
        renderHistoryLogDOM();
      });
    }

    resetFDE();
  }

  // =========================================================================
  // 3. TAB 2: PERFORMANCE SANDBOX (Core AQA §3.4.1)
  // =========================================================================
let perfState = {
    clockSpeed: 2.5,
    cacheLevel: 'l2',
    cores: 2,
    taskType: 'sequential', // 'sequential' | 'parallel'
    isSimulating: false,
  };

  function initPerformanceSandbox() {
    const slider = document.getElementById('clockSpeedSlider');
    const badge = document.getElementById('clockSpeedValBadge');
    const cacheSelect = document.getElementById('cacheSelect');
    const coreButtons = document.querySelectorAll('.core-btn');
    const seqBtn = document.getElementById('taskSequentialBtn');
    const parBtn = document.getElementById('taskParallelBtn');
    const workloadDesc = document.getElementById('workloadDescText');
    const runBtn = document.getElementById('runBenchmarkBtn');

    if (slider && badge) {
      slider.addEventListener('input', (e) => {
        perfState.clockSpeed = parseFloat(e.target.value);
        badge.textContent = `${perfState.clockSpeed.toFixed(1)} GHz`;
      });
    }

    if (cacheSelect) {
      cacheSelect.addEventListener('change', (e) => {
        perfState.cacheLevel = e.target.value;
      });
    }

    coreButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        coreButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        perfState.cores = parseInt(btn.getAttribute('data-cores'), 10);
      });
    });

    if (seqBtn && parBtn && workloadDesc) {
      seqBtn.addEventListener('click', () => {
        seqBtn.classList.add('active');
        parBtn.classList.remove('active');
        perfState.taskType = 'sequential';
        workloadDesc.textContent = '• Sequential tasks cannot be divided across cores. Additional cores will remain idle!';
      });

      parBtn.addEventListener('click', () => {
        parBtn.classList.add('active');
        seqBtn.classList.remove('active');
        perfState.taskType = 'parallel';
        workloadDesc.textContent = '• Parallel batch tasks can be split across cores, but encounter coordination overhead and memory bottlenecks.';
      });
    }

    if (runBtn) {
      runBtn.addEventListener('click', runBenchmarkSimulation);
    }

    renderCoreMeters();
  }

  function renderCoreMeters() {
    const container = document.getElementById('coresProgressContainer');
    if (!container) return;
    container.innerHTML = '';

    for (let c = 0; c < perfState.cores; c++) {
      const row = document.createElement('div');
      row.className = 'core-meter-bar';

      const titleRow = document.createElement('div');
      titleRow.style.display = 'flex';
      titleRow.style.justifyContent = 'space-between';
      titleRow.style.fontSize = '11.5px';
      titleRow.style.fontWeight = '700';

      const name = document.createElement('span');
      name.textContent = `Core ${c}`;
      name.style.color = 'var(--text-primary)';

      const status = document.createElement('span');
      status.id = `core-status-${c}`;
      status.style.fontFamily = 'var(--font-mono)';
      status.style.color = 'var(--text-muted)';
      status.textContent = 'Idle';

      titleRow.appendChild(name);
      titleRow.appendChild(status);

      const track = document.createElement('div');
      track.className = 'core-progress-track';

      const fill = document.createElement('div');
      fill.id = `core-fill-${c}`;
      fill.className = 'core-progress-fill';

      track.appendChild(fill);
      row.appendChild(titleRow);
      row.appendChild(track);
      container.appendChild(row);
    }
  }

  function runBenchmarkSimulation() {
    renderCoreMeters();

    const statusBadge = document.getElementById('benchmarkStatusBadge');
    const metricExec = document.getElementById('metricExecTime');
    const metricScore = document.getElementById('metricSpeedScore');
    const metricCache = document.getElementById('metricCacheHit');
    const metricHeat = document.getElementById('metricHeatLevel');

    if (statusBadge) {
      statusBadge.textContent = 'SIMULATING...';
      statusBadge.className = 'badge badge-live';
    }

    // Mathematical model of execution time:
    // Base workload: 10,000 instruction units
    const baseUnits = 10000;
    
    // Cache impact
    let cacheHitRate = 0;
    let cacheMultiplier = 1.0;
    if (perfState.cacheLevel === 'none') {
      cacheHitRate = 12;
      cacheMultiplier = 2.4; // heavy memory stalls
    } else if (perfState.cacheLevel === 'l1') {
      cacheHitRate = 96;
      cacheMultiplier = 1.05;
    } else if (perfState.cacheLevel === 'l2') {
      cacheHitRate = 88;
      cacheMultiplier = 1.18;
    } else if (perfState.cacheLevel === 'l3') {
      cacheHitRate = 78;
      cacheMultiplier = 1.35;
    }

    // Core scaling factor
    let effectiveCores = 1;
    if (perfState.taskType === 'parallel') {
      // Amdahl's Law with 12% serial bottleneck + multi-core overhead
      const P = 0.88;
      const N = perfState.cores;
      const speedup = 1 / ((1 - P) + (P / N));
      effectiveCores = speedup * 0.92; // 8% bus contention penalty
    } else {
      effectiveCores = 1; // Sequential task only uses 1 core!
    }

    const calculatedTimeMs = Math.round((baseUnits * cacheMultiplier) / (perfState.clockSpeed * effectiveCores));
    const mipsScore = Math.round((perfState.clockSpeed * 1000 * effectiveCores) / cacheMultiplier);

    // Heat rating based on clock speed and cores
    let heat = 'Low';
    if (perfState.clockSpeed >= 3.5 && perfState.cores >= 4) heat = 'High (Throttling Risk)';
    else if (perfState.clockSpeed >= 3.0 || perfState.cores >= 4) heat = 'Moderate';

    // Animate the core bars
    const duration = Math.min(Math.max(calculatedTimeMs / 2, 400), 2000);

    for (let c = 0; c < perfState.cores; c++) {
      const fill = document.getElementById(`core-fill-${c}`);
      const st = document.getElementById(`core-status-${c}`);

      if (perfState.taskType === 'sequential' && c > 0) {
        if (st) st.textContent = 'Idle (0% - Single Thread)';
        if (fill) fill.style.width = '0%';
      } else {
        if (st) st.textContent = 'Computing 100%...';
        if (fill) {
          fill.style.transition = `width ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
          setTimeout(() => {
            fill.style.width = '100%';
          }, 30);
        }
      }
    }

    setTimeout(() => {
      if (statusBadge) {
        statusBadge.textContent = 'COMPLETED';
        statusBadge.className = 'badge badge-spec';
      }
      if (metricExec) metricExec.textContent = `${calculatedTimeMs} ms`;
      if (metricScore) metricScore.textContent = `${mipsScore.toLocaleString()} MIPS`;
      if (metricCache) metricCache.textContent = `${cacheHitRate}%`;
      if (metricHeat) {
        metricHeat.textContent = heat;
        metricHeat.style.color = heat.includes('High') ? '#ef4444' : (heat === 'Low' ? '#34d399' : '#fbbf24');
      }

      for (let c = 0; c < perfState.cores; c++) {
        const st = document.getElementById(`core-status-${c}`);
        if (st) {
          if (perfState.taskType === 'sequential' && c > 0) {
            st.textContent = 'Idle (0%)';
          } else {
            st.textContent = 'Done';
          }
        }
      }
    }, duration + 50);
  }

  // =========================================================================
  // 5. INITIALIZATION ENTRYPOINT
  // =========================================================================

  function init() {
    initTheme();
    initTabs();
    initFDE();
        initPerformanceSandbox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
