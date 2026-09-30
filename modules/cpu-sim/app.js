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

  function build32CellRAM(baseRam) {
    const fullRam = [];
    for (let i = 0; i < 32; i++) {
      const addrStr = i.toString().padStart(2, '0');
      if (i < baseRam.length) {
        fullRam.push({
          addr: addrStr,
          val: baseRam[i].val,
          type: baseRam[i].type
        });
      } else {
        fullRam.push({
          addr: addrStr,
          val: '0',
          type: 'Unallocated'
        });
      }
    }
    return fullRam;
  }

  const BASE_PROGRAMS = {
    add: {
      name: 'Add Two Numbers (12 + 8)',
      ram: [
        { val: 'LOAD 05', type: 'Instruction' },
        { val: 'ADD 06',  type: 'Instruction' },
        { val: 'STORE 07',type: 'Instruction' },
        { val: 'HLT',     type: 'Instruction' },
        { val: '0',       type: 'Empty' },
        { val: '12',      type: 'Data' },
        { val: '8',       type: 'Data' },
        { val: '0',       type: 'Result' },
      ]
    },
    sub: {
      name: 'Subtract Numbers (20 - 7)',
      ram: [
        { val: 'LOAD 05', type: 'Instruction' },
        { val: 'SUB 06',  type: 'Instruction' },
        { val: 'STORE 07',type: 'Instruction' },
        { val: 'HLT',     type: 'Instruction' },
        { val: '0',       type: 'Empty' },
        { val: '20',      type: 'Data' },
        { val: '7',       type: 'Data' },
        { val: '0',       type: 'Result' },
      ]
    },
    store: {
      name: 'Store Constant (Value 42)',
      ram: [
        { val: 'LOAD 04', type: 'Instruction' },
        { val: 'STORE 05',type: 'Instruction' },
        { val: 'HLT',     type: 'Instruction' },
        { val: '0',       type: 'Empty' },
        { val: '42',      type: 'Data' },
        { val: '0',       type: 'Result' },
        { val: '0',       type: 'Empty' },
        { val: '0',       type: 'Empty' },
      ]
    }
  };

  let fdeState = {
    selectedProgram: 'add',
    ram: [],
    pc: 0,
    mar: '00',
    mdr: '---',
    acc: 0,
    decodedOpcode: 'NONE',
    decodedOperand: '',
    currentMicroStepIndex: 0,
    microSteps: [],
    isPlaying: false,
    playIntervalTimer: null,
    playSpeedMs: 1000,
    isHalted: false,
    cycleCount: 1,
    prevRegisters: { pc: null, mar: null, mdr: null, acc: null }
  };

  const COMPONENT_DETAILS = {
    pc: {
      name: 'Program Counter (PC)',
      nickname: '"The Bookmark"',
      icon: '📍',
      role: 'Holds the memory address of the NEXT instruction to be fetched from RAM. It automatically increments by 1 during each Fetch cycle so the program moves sequentially through code.',
      getValue: () => `Address: ${fdeState.pc.toString().padStart(2, '0')} (0x${fdeState.pc.toString(16).toUpperCase().padStart(2, '0')})`
    },
    mar: {
      name: 'Memory Address Register (MAR)',
      nickname: '"The Address Tag"',
      icon: '🏷️',
      role: 'Holds the exact memory address in RAM that is currently being read from or written to. The CPU outputs this address down the Address Bus.',
      getValue: () => `Address: ${fdeState.mar}`
    },
    mdr: {
      name: 'Memory Data Register (MDR)',
      nickname: '"The In / Out Tray"',
      icon: '📥',
      role: 'Acts as the temporary holding buffer for the actual data value or instruction fetched from RAM (Read) or about to be stored in RAM (Write). Connected directly to the Data Bus.',
      getValue: () => `Contents: "${fdeState.mdr}"`
    },
    acc: {
      name: 'Accumulator (ACC)',
      nickname: '"The Calculator Screen"',
      icon: '🧮',
      role: 'Temporarily stores the running results of calculations performed by the Arithmetic Logic Unit (ALU).',
      getValue: () => `Current Value: ${fdeState.acc}`
    },
    cu: {
      name: 'Control Unit (CU)',
      nickname: '"The Conductor & Decoder"',
      icon: '🧠',
      role: 'Decodes instructions held in the MDR using the CPU instruction set. Sends electrical control signals across the Control Bus to coordinate timing and data movement throughout the system.',
      getValue: () => `Decoded: ${fdeState.decodedOpcode} ${fdeState.decodedOperand || ''}`
    },
    alu: {
      name: 'Arithmetic Logic Unit (ALU)',
      nickname: '"The Math & Logic Engine"',
      icon: '⚡',
      role: 'Executes mathematical calculations (addition, subtraction) and logical comparisons (equal, greater, less than). Outputs results directly into the Accumulator.',
      getValue: () => `Latest Output: ${fdeState.acc}`
    },
    'bus-address': {
      name: 'Address Bus',
      nickname: '"One-Way Address Highway"',
      icon: '🛣️',
      role: 'A unidirectional physical pathway that transmits memory addresses from the CPU (MAR) to RAM. Data never travels backward on this bus.',
      getValue: () => `Current Signal: ${document.getElementById('busAddressVal')?.textContent || 'Idle'}`
    },
    'bus-data': {
      name: 'Data Bus',
      nickname: '"Two-Way Data Highway"',
      icon: '🚚',
      role: 'A bidirectional physical pathway that transports instructions and raw data values back and forth between the CPU (MDR) and RAM.',
      getValue: () => `Current Data: ${document.getElementById('busDataVal')?.textContent || 'Idle'}`
    },
    'bus-control': {
      name: 'Control Bus',
      nickname: '"Command Signals & Timing"',
      icon: '⚡',
      role: 'Carries command signals (MEM_READ, MEM_WRITE, HALT) and clock synchronization pulses across the motherboard.',
      getValue: () => `Current Signal: ${document.getElementById('busControlVal')?.textContent || 'Idle'}`
    },
    ram: {
      name: 'Main Memory (RAM)',
      nickname: '"The Main Workbench"',
      icon: '💾',
      role: 'Fast volatile memory holding the currently running program instructions and active data variables. Directly addressable by the CPU via the memory buses.',
      getValue: () => `Active Slots: 00 – 07 | Total Range: 00 – 31`
    }
  };

  let currentlyInspectedKey = null;

  // Micro-step generator strictly aligned with AQA 8525 §3.4.1:
  // Exactly 4 distinct steps: Fetch 1, Fetch 2, Decode, Execute
  function generateMicroStepsForInstruction(pcVal) {
    const ramEntry = fdeState.ram[pcVal];
    if (!ramEntry || ramEntry.type !== 'Instruction' || fdeState.isHalted) {
      return [
        {
          stage: 'HALTED',
          title: 'Execution Complete (CPU Halted)',
          instrTag: 'HLT',
          plainEnglish: 'The CPU has completed all instructions and halted execution.',
          quote: 'The CPU stops executing instructions when a HLT instruction or program end is reached.',
          action: () => {
            fdeState.isHalted = true;
          }
        }
      ];
    }

    const tokens = ramEntry.val.trim().split(/\s+/);
    const opcode = tokens[0].toUpperCase();
    const operand = tokens[1] || '';
    const pcStr = pcVal.toString().padStart(2, '0');
    const nextPcStr = (pcVal + 1).toString().padStart(2, '0');
    const instrDisplay = `Instr: ${ramEntry.val}`;

    const steps = [];

    // STEP 1: Fetch 1 (PC -> MAR)
    steps.push({
      stage: 'FETCH',
      title: 'Fetch 1: Copy PC Address to MAR',
      instrTag: instrDisplay,
      plainEnglish: `The CPU copies the memory address currently held in the Program Counter (${pcStr}) into the Memory Address Register (MAR) across the internal bus.`,
      quote: 'The contents of the Program Counter (PC) are copied to the Memory Address Register (MAR) via the address bus.',
      activeElements: { source: 'regPC', target: 'regMAR', bus: 'busAddress' },
      busAddressVal: `Addr: ${pcStr}`,
      packetDir: { bus: 'address', dir: 'to-ram' },
      action: () => {
        fdeState.mar = pcStr;
      }
    });

    // STEP 2: Fetch 2 (PC++ & Memory Read into MDR)
    steps.push({
      stage: 'FETCH',
      title: 'Fetch 2: Increment PC & Read from RAM into MDR',
      instrTag: instrDisplay,
      plainEnglish: `The Program Counter increments by 1 (now ${nextPcStr}) to point to the next instruction. Simultaneously, the instruction at address ${pcStr} ("${ramEntry.val}") is loaded from RAM into the MDR across the Data Bus.`,
      quote: 'The PC is incremented by 1. The instruction at the memory address in MAR is copied to the Memory Data Register (MDR) via the Data Bus.',
      activeElements: { source: `ram-row-${pcStr}`, target: 'regMDR', bus: 'busData', secondaryTarget: 'regPC' },
      busDataVal: `Data: "${ramEntry.val}"`,
      busControlVal: 'MEM_READ',
      packetDir: { bus: 'data', dir: 'to-cpu' },
      action: () => {
        fdeState.pc = pcVal + 1;
        fdeState.mdr = ramEntry.val;
      }
    });

    // STEP 3: Decode (CU decodes MDR)
    steps.push({
      stage: 'DECODE',
      title: 'Decode: Control Unit Decodes Instruction in MDR',
      instrTag: instrDisplay,
      plainEnglish: `The Control Unit (CU) inspects and decodes the instruction in the MDR ("${ramEntry.val}"). It identifies opcode ${opcode} and operand ${operand || 'None'}, configuring CPU pathways for execution.`,
      quote: 'The instruction held in the Memory Data Register (MDR) is decoded by the Control Unit (CU).',
      activeElements: { source: 'regMDR', target: 'cuBlock' },
      busControlVal: 'DECODE_OP',
      action: () => {
        fdeState.decodedOpcode = opcode;
        fdeState.decodedOperand = operand;
      }
    });

    // STEP 4: Execute (Opcode action)
    if (opcode === 'LOAD') {
      const dataVal = fdeState.ram[parseInt(operand, 10)]?.val || '0';
      steps.push({
        stage: 'EXECUTE',
        title: `Execute: Load Value from RAM Address ${operand} into ACC`,
        instrTag: instrDisplay,
        plainEnglish: `The address ${operand} is placed on the MAR, and the stored value (${dataVal}) is fetched through the MDR directly into the Accumulator (ACC) register.`,
        quote: 'The data at the specified address in memory is fetched via the MDR and copied into the Accumulator (ACC).',
        activeElements: { source: `ram-row-${operand}`, target: 'regACC', bus: 'busData' },
        busAddressVal: `Addr: ${operand}`,
        busDataVal: `Data: "${dataVal}"`,
        busControlVal: 'MEM_READ',
        packetDir: { bus: 'data', dir: 'to-cpu' },
        action: () => {
          fdeState.mar = operand;
          fdeState.mdr = dataVal;
          fdeState.acc = parseInt(dataVal, 10);
        }
      });
    } else if (opcode === 'ADD') {
      const addOperandVal = parseInt(fdeState.ram[parseInt(operand, 10)]?.val || '0', 10);
      steps.push({
        stage: 'EXECUTE',
        title: `Execute: ALU Adds Memory Value (${addOperandVal}) to Accumulator`,
        instrTag: instrDisplay,
        plainEnglish: `The ALU fetches ${addOperandVal} from address ${operand} via the MDR, adds it to the current Accumulator value (${fdeState.acc}), and saves the result (${fdeState.acc + addOperandVal}) into the Accumulator (ACC).`,
        quote: 'The ALU performs addition of the MDR contents to the Accumulator (ACC) and stores the result back in the Accumulator.',
        activeElements: { source: 'aluBlock', target: 'regACC', bus: 'busData' },
        busAddressVal: `Addr: ${operand}`,
        busDataVal: `Data: "${addOperandVal}"`,
        busControlVal: 'MEM_READ',
        packetDir: { bus: 'data', dir: 'to-cpu' },
        action: () => {
          fdeState.mar = operand;
          fdeState.mdr = addOperandVal.toString();
          fdeState.acc += addOperandVal;
        }
      });
    } else if (opcode === 'SUB') {
      const subOperandVal = parseInt(fdeState.ram[parseInt(operand, 10)]?.val || '0', 10);
      steps.push({
        stage: 'EXECUTE',
        title: `Execute: ALU Subtracts Memory Value (${subOperandVal}) from Accumulator`,
        instrTag: instrDisplay,
        plainEnglish: `The ALU fetches ${subOperandVal} from address ${operand} via the MDR, subtracts it from the Accumulator (${fdeState.acc}), and saves the result (${fdeState.acc - subOperandVal}) into the Accumulator (ACC).`,
        quote: 'The ALU performs subtraction of the MDR contents from the Accumulator (ACC) and stores the result back in the Accumulator.',
        activeElements: { source: 'aluBlock', target: 'regACC', bus: 'busData' },
        busAddressVal: `Addr: ${operand}`,
        busDataVal: `Data: "${subOperandVal}"`,
        busControlVal: 'MEM_READ',
        packetDir: { bus: 'data', dir: 'to-cpu' },
        action: () => {
          fdeState.mar = operand;
          fdeState.mdr = subOperandVal.toString();
          fdeState.acc -= subOperandVal;
        }
      });
    } else if (opcode === 'STORE') {
      steps.push({
        stage: 'EXECUTE',
        title: `Execute: Store Accumulator (${fdeState.acc}) to RAM Address ${operand}`,
        instrTag: instrDisplay,
        plainEnglish: `The value in the Accumulator (${fdeState.acc}) is loaded into the MDR and sent across the Data Bus with a MEM_WRITE signal to be stored in RAM address ${operand}.`,
        quote: 'The contents of the Accumulator (ACC) are copied to the MDR and written to the memory address specified by the MAR.',
        activeElements: { source: 'regACC', target: `ram-row-${operand}`, bus: 'busData' },
        busAddressVal: `Addr: ${operand}`,
        busDataVal: `Data: "${fdeState.acc}"`,
        busControlVal: 'MEM_WRITE',
        packetDir: { bus: 'data', dir: 'to-ram' },
        action: () => {
          fdeState.mar = operand;
          fdeState.mdr = fdeState.acc.toString();
          const targetIdx = parseInt(operand, 10);
          if (fdeState.ram[targetIdx]) {
            fdeState.ram[targetIdx].val = fdeState.acc.toString();
          }
        }
      });
    } else if (opcode === 'HLT') {
      steps.push({
        stage: 'EXECUTE',
        title: 'Execute: Stop Instruction Execution (HLT)',
        instrTag: instrDisplay,
        plainEnglish: 'The HLT instruction signals the CPU to stop the Fetch-Decode-Execute cycle. The program has finished running.',
        quote: 'The CPU stops executing instructions.',
        activeElements: { source: 'cuBlock', target: null },
        busControlVal: 'HALT_SIG',
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
    const prog = BASE_PROGRAMS[fdeState.selectedProgram] || BASE_PROGRAMS.add;
    fdeState.ram = build32CellRAM(prog.ram);
    fdeState.pc = 0;
    fdeState.mar = '00';
    fdeState.mdr = '---';
    fdeState.acc = 0;
    fdeState.decodedOpcode = 'NONE';
    fdeState.decodedOperand = '';
    fdeState.isHalted = false;
    fdeState.cycleCount = 1;
    fdeState.prevRegisters = { pc: null, mar: null, mdr: null, acc: null };
    fdeState.microSteps = generateMicroStepsForInstruction(0);
    fdeState.currentMicroStepIndex = 0;

    renderRAMTable();
    updateRegistersDOM();
    updateStepNarrativeDOM();
    clearActiveGlows();
  }

  function renderRAMTable() {
    // 1. Full 32-cell table in under-the-hood drawer
    const tbody = document.getElementById('ramTableBody');
    if (tbody) {
      tbody.innerHTML = '';
      fdeState.ram.forEach((row) => {
        const tr = document.createElement('tr');
        tr.id = `ram-row-${row.addr}`;
        tr.className = 'ram-row' + (row.type === 'Unallocated' ? ' unallocated' : '');

        const tdAddr = document.createElement('td');
        tdAddr.textContent = row.addr;
        tdAddr.style.fontWeight = '700';
        tdAddr.style.color = 'var(--text-secondary)';

        const tdVal = document.createElement('td');
        tdVal.id = `ram-val-${row.addr}`;
        tdVal.textContent = row.val;
        if (row.type === 'Instruction') {
          tdVal.style.color = '#818cf8';
          tdVal.style.fontWeight = '600';
        } else if (row.type === 'Result') {
          tdVal.style.color = '#34d399';
          tdVal.style.fontWeight = '600';
        } else if (row.type === 'Unallocated') {
          tdVal.style.color = 'var(--text-muted)';
        } else {
          tdVal.style.color = 'var(--text-primary)';
        }

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

    // 2. Active 8-slot vertical rack directly on motherboard canvas
    const rack = document.getElementById('ramRackSlots');
    if (rack) {
      rack.innerHTML = '';
      for (let i = 0; i < 8; i++) {
        const row = fdeState.ram[i];
        if (!row) continue;
        const slot = document.createElement('div');
        slot.id = `ram-slot-${row.addr}`;
        slot.className = 'ram-slot';

        const addrSpan = document.createElement('span');
        addrSpan.className = 'slot-addr';
        addrSpan.textContent = row.addr;

        const valSpan = document.createElement('span');
        valSpan.id = `rack-val-${row.addr}`;
        valSpan.className = 'slot-val';
        valSpan.textContent = row.val;

        if (row.type === 'Instruction') {
          valSpan.classList.add('val-instruction');
        } else if (row.type === 'Result') {
          valSpan.classList.add('val-result');
        } else if (row.type === 'Data') {
          valSpan.classList.add('val-data');
        } else {
          valSpan.classList.add('val-empty');
        }

        const typeBadge = document.createElement('span');
        typeBadge.className = 'slot-type-badge';
        typeBadge.textContent = row.type === 'Instruction' ? 'Instr' : row.type === 'Result' ? 'Result' : row.type === 'Data' ? 'Data' : 'Empty';

        slot.appendChild(addrSpan);
        slot.appendChild(valSpan);
        slot.appendChild(typeBadge);
        rack.appendChild(slot);
      }
    }
  }

  function updateRegistersDOM() {
    // 1. CPU Schematic boxes
    const valPC = document.getElementById('valPC');
    const valMAR = document.getElementById('valMAR');
    const valMDR = document.getElementById('valMDR');
    const valACC = document.getElementById('valACC');
    const cuDecodedText = document.getElementById('cuDecodedText');
    const aluResultText = document.getElementById('aluResultText');

    if (valPC) valPC.textContent = fdeState.pc.toString().padStart(2, '0');
    if (valMAR) valMAR.textContent = fdeState.mar;
    if (valMDR) valMDR.textContent = fdeState.mdr;
    if (valACC) valACC.textContent = fdeState.acc.toString();
    if (cuDecodedText) cuDecodedText.textContent = fdeState.decodedOpcode + (fdeState.decodedOperand ? ` ${fdeState.decodedOperand}` : '');
    if (aluResultText) aluResultText.textContent = fdeState.acc.toString();

    // 2. Right-hand Live Register State Table
    const pcDen = fdeState.pc.toString().padStart(2, '0');
    const pcHex = '0x' + fdeState.pc.toString(16).toUpperCase().padStart(2, '0');

    const marDen = fdeState.mar;
    const marInt = parseInt(fdeState.mar, 10);
    const marHex = !isNaN(marInt) ? '0x' + marInt.toString(16).toUpperCase().padStart(2, '0') : '---';

    const mdrDen = fdeState.mdr;
    const mdrInt = parseInt(fdeState.mdr, 10);
    const mdrHex = !isNaN(mdrInt) ? '0x' + mdrInt.toString(16).toUpperCase().padStart(2, '0') : '---';

    const accDen = fdeState.acc.toString();
    const accHex = '0x' + (fdeState.acc >= 0 ? fdeState.acc.toString(16).toUpperCase().padStart(2, '0') : fdeState.acc.toString(16).toUpperCase());

    const checkAndUpdateRow = (rowId, denId, hexId, denVal, hexVal, prevValKey, currentVal) => {
      const elDen = document.getElementById(denId);
      const elHex = document.getElementById(hexId);
      const elRow = document.getElementById(rowId);
      if (elDen) elDen.textContent = denVal;
      if (elHex) elHex.textContent = hexVal;

      if (fdeState.prevRegisters[prevValKey] !== null && fdeState.prevRegisters[prevValKey] !== currentVal) {
        if (elRow) {
          elRow.classList.remove('register-row-updated');
          void elRow.offsetWidth;
          elRow.classList.add('register-row-updated');
          setTimeout(() => elRow.classList.remove('register-row-updated'), 650);
        }
      }
      fdeState.prevRegisters[prevValKey] = currentVal;
    };

    checkAndUpdateRow('regRowPC', 'regDenPC', 'regHexPC', pcDen, pcHex, 'pc', fdeState.pc);
    checkAndUpdateRow('regRowMAR', 'regDenMAR', 'regHexMAR', marDen, marHex, 'mar', fdeState.mar);
    checkAndUpdateRow('regRowMDR', 'regDenMDR', 'regHexMDR', mdrDen, mdrHex, 'mdr', fdeState.mdr);
    checkAndUpdateRow('regRowACC', 'regDenACC', 'regHexACC', accDen, accHex, 'acc', fdeState.acc);

    // Refresh live inspector readout if currently open
    if (currentlyInspectedKey && typeof COMPONENT_DETAILS !== 'undefined' && COMPONENT_DETAILS[currentlyInspectedKey]) {
      const valEl = document.getElementById('inspectorLiveValue');
      if (valEl) valEl.textContent = COMPONENT_DETAILS[currentlyInspectedKey].getValue();
    }
  }

  function clearActiveGlows() {
    document.querySelectorAll('.component-block, .hardware-card').forEach(el => el.classList.remove('active-glow'));
    document.querySelectorAll('.register-card, .register-block').forEach(el => {
      el.classList.remove('active-source', 'active-target');
    });
    document.querySelectorAll('.bus-line, .highway-bus').forEach(el => el.classList.remove('bus-active'));
    document.querySelectorAll('.ram-row').forEach(el => el.classList.remove('active-ram-read', 'active-ram-write'));
    document.querySelectorAll('.ram-slot').forEach(el => el.classList.remove('active-slot-read', 'active-slot-write'));

    // Clear dynamic bus packets
    ['packetAddress', 'packetData', 'packetControl'].forEach(id => {
      const p = document.getElementById(id);
      if (p) p.classList.remove('packet-to-ram', 'packet-to-cpu');
    });

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
    const cycleInstrTag = document.getElementById('cycleInstrTag');
    const narrativeTitle = document.getElementById('narrativeTitle');
    const narrativePlainEnglish = document.getElementById('narrativePlainEnglish');
    const aqaExamQuote = document.getElementById('aqaExamQuote');
    const stepCounterBadge = document.getElementById('stepCounterBadge');
    const cycleStatusBadge = document.getElementById('cycleStatusBadge');

    // Phase Pills Sync
    const pillFetch = document.getElementById('phasePillFetch');
    const pillDecode = document.getElementById('phasePillDecode');
    const pillExecute = document.getElementById('phasePillExecute');
    if (pillFetch && pillDecode && pillExecute) {
      pillFetch.classList.toggle('active', currentStep.stage === 'FETCH');
      pillDecode.classList.toggle('active', currentStep.stage === 'DECODE');
      pillExecute.classList.toggle('active', currentStep.stage === 'EXECUTE');
    }

    if (narrativeStageBadge) {
      narrativeStageBadge.textContent = `${currentStep.stage} STAGE`;
      narrativeStageBadge.className = `stage-badge stage-${currentStep.stage.toLowerCase()}`;
    }
    if (cycleInstrTag) {
      cycleInstrTag.textContent = currentStep.instrTag || '';
    }
    if (narrativeTitle) {
      narrativeTitle.textContent = currentStep.title;
    }
    if (narrativePlainEnglish) {
      narrativePlainEnglish.textContent = currentStep.plainEnglish;
    }
    if (aqaExamQuote) {
      aqaExamQuote.textContent = `"${currentStep.quote}"`;
    }
    if (stepCounterBadge) {
      stepCounterBadge.textContent = `Step ${fdeState.currentMicroStepIndex + 1} of ${fdeState.microSteps.length}`;
    }
    if (cycleStatusBadge) {
      cycleStatusBadge.textContent = `Cycle ${fdeState.cycleCount} • ${currentStep.stage}`;
    }
  }

  function applyMicroStepVisuals(step) {
    clearActiveGlows();
    if (!step) return;

    const act = step.activeElements || {};

    if (act.source) {
      const srcEl = document.getElementById(act.source);
      if (srcEl) {
        if (srcEl.classList.contains('register-card') || srcEl.classList.contains('register-block')) {
          srcEl.classList.add('active-source');
        } else if (srcEl.classList.contains('component-block') || srcEl.classList.contains('hardware-card')) {
          srcEl.classList.add('active-glow');
        } else if (srcEl.classList.contains('ram-row')) {
          srcEl.classList.add('active-ram-read');
        }
      }
      if (act.source.startsWith('ram-row-')) {
        const addr = act.source.replace('ram-row-', '');
        const slotEl = document.getElementById(`ram-slot-${addr}`);
        if (slotEl) slotEl.classList.add('active-slot-read');
      }
    }

    if (act.target) {
      const tgtEl = document.getElementById(act.target);
      if (tgtEl) {
        if (tgtEl.classList.contains('register-card') || tgtEl.classList.contains('register-block')) {
          tgtEl.classList.add('active-target');
        } else if (tgtEl.classList.contains('component-block') || tgtEl.classList.contains('hardware-card')) {
          tgtEl.classList.add('active-glow');
        } else if (tgtEl.classList.contains('ram-row')) {
          tgtEl.classList.add('active-ram-write');
        }
      }
      if (act.target.startsWith('ram-row-')) {
        const addr = act.target.replace('ram-row-', '');
        const slotEl = document.getElementById(`ram-slot-${addr}`);
        if (slotEl) slotEl.classList.add('active-slot-write');
      }
    }

    if (act.secondaryTarget) {
      const secEl = document.getElementById(act.secondaryTarget);
      if (secEl && (secEl.classList.contains('register-card') || secEl.classList.contains('register-block'))) {
        secEl.classList.add('active-target');
      }
    }

    if (act.bus) {
      const busEl = document.getElementById(act.bus);
      if (busEl) busEl.classList.add('bus-active');
    }

    // Dynamic Bus Packet Glide Animation
    if (step.packetDir) {
      if (step.packetDir.bus === 'address') {
        const p = document.getElementById('packetAddress');
        const b = document.getElementById('busAddress');
        if (p) p.classList.add(step.packetDir.dir === 'to-ram' ? 'packet-to-ram' : 'packet-to-cpu');
        if (b) b.classList.add('bus-active');
      } else if (step.packetDir.bus === 'data') {
        const p = document.getElementById('packetData');
        const b = document.getElementById('busData');
        if (p) p.classList.add(step.packetDir.dir === 'to-ram' ? 'packet-to-ram' : 'packet-to-cpu');
        if (b) b.classList.add('bus-active');
      }
    }

    // Bus Status Readouts
    if (step.busAddressVal) {
      const bAddr = document.getElementById('busAddressVal');
      const b = document.getElementById('busAddress');
      if (bAddr) bAddr.textContent = step.busAddressVal;
      if (b) b.classList.add('bus-active');
    }
    if (step.busDataVal) {
      const bData = document.getElementById('busDataVal');
      const b = document.getElementById('busData');
      if (bData) bData.textContent = step.busDataVal;
      if (b) b.classList.add('bus-active');
    }
    if (step.busControlVal) {
      const bCtrl = document.getElementById('busControlVal');
      const b = document.getElementById('busControl');
      const p = document.getElementById('packetControl');
      if (bCtrl) bCtrl.textContent = step.busControlVal;
      if (b) b.classList.add('bus-active');
      if (p) p.classList.add('packet-to-ram');
    }

    // RAM Auto-scroll to active row
    const targetRow = document.getElementById(`ram-row-${fdeState.mar}`);
    const scrollWrap = document.getElementById('ramScrollContainer');
    if (targetRow && scrollWrap) {
      const rowTop = targetRow.offsetTop;
      const wrapHeight = scrollWrap.clientHeight;
      const rowHeight = targetRow.clientHeight;
      scrollWrap.scrollTo({
        top: Math.max(0, rowTop - (wrapHeight / 2) + (rowHeight / 2)),
        behavior: 'smooth'
      });
    }
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

    // Advance to next microstep
    fdeState.currentMicroStepIndex++;

    // Check if we finished the micro-steps for the current instruction
    if (fdeState.currentMicroStepIndex >= fdeState.microSteps.length) {
      if (fdeState.isHalted) {
        pauseFDE();
        return;
      }
      // Generate next instruction's micro-steps
      fdeState.cycleCount++;
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

    initComponentInspector();
    resetFDE();
  }

  // =========================================================================
  // 2.5 INTERACTIVE COMPONENT HOVER & CLICK INSPECTOR
  // =========================================================================

  function initComponentInspector() {
    const card = document.getElementById('componentInspectorCard');
    const closeBtn = document.getElementById('closeInspectorBtn');
    const iconEl = document.getElementById('inspectorIcon');
    const nameEl = document.getElementById('inspectorName');
    const nickEl = document.getElementById('inspectorNickname');
    const roleEl = document.getElementById('inspectorRole');
    const valEl = document.getElementById('inspectorLiveValue');

    if (!card) return;

    function showInspector(key) {
      currentlyInspectedKey = key;
      const data = COMPONENT_DETAILS[key];
      if (!data) return;
      if (iconEl) iconEl.textContent = data.icon;
      if (nameEl) nameEl.textContent = data.name;
      if (nickEl) nickEl.textContent = data.nickname;
      if (roleEl) roleEl.textContent = data.role;
      if (valEl) valEl.textContent = data.getValue();
      card.style.display = 'block';
    }

    function hideInspector() {
      currentlyInspectedKey = null;
      card.style.display = 'none';
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', hideInspector);
    }

    document.querySelectorAll('[data-inspect]').forEach(el => {
      const key = el.getAttribute('data-inspect');
      el.addEventListener('mouseenter', () => showInspector(key));
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        showInspector(key);
      });
    });

    document.addEventListener('click', (e) => {
      if (!card.contains(e.target) && !e.target.closest('[data-inspect]')) {
        hideInspector();
      }
    });
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
