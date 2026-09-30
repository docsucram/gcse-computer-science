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
    ramViewFormat: 'mnemonic', // 'mnemonic' | 'hex' | 'binary'
    isInitialState: true,
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

  const OPCODES_HEX_BIN = {
    'LOAD':  { hex: '1', bin: '0001' },
    'ADD':   { hex: '2', bin: '0010' },
    'SUB':   { hex: '3', bin: '0011' },
    'STORE': { hex: '4', bin: '0100' },
    'HLT':   { hex: 'F', bin: '1111' }
  };

  function formatRamValue(val, type, format) {
    if (!val) return '0';
    if (format === 'mnemonic') return val;

    if (type === 'Instruction') {
      const parts = val.trim().split(/\s+/);
      const op = parts[0].toUpperCase();
      const addr = parts[1] !== undefined ? parseInt(parts[1], 10) : 0;
      const opData = OPCODES_HEX_BIN[op] || { hex: '0', bin: '0000' };
      const addrHex = (isNaN(addr) ? 0 : (addr & 0xF)).toString(16).toUpperCase();
      const addrBin = (isNaN(addr) ? 0 : (addr & 0xF)).toString(2).padStart(4, '0');

      if (format === 'hex') {
        return `0x${opData.hex}${addrHex}`;
      } else if (format === 'binary') {
        return `${opData.bin} ${addrBin}`;
      }
    } else {
      // Data or Result numerical value
      const num = parseInt(val, 10);
      const safeNum = isNaN(num) ? 0 : num;
      if (format === 'hex') {
        return '0x' + (safeNum >= 0 ? safeNum.toString(16).toUpperCase().padStart(2, '0') : '00');
      } else if (format === 'binary') {
        const binStr = (safeNum >= 0 ? safeNum.toString(2).padStart(8, '0') : '00000000');
        return `${binStr.slice(0, 4)} ${binStr.slice(4)}`;
      }
    }
    return val;
  }

  const COMPONENT_DETAILS = {
    pc: {
      name: 'Program Counter (PC)',
      nickname: 'The Next-Step Bookmark',
      icon: '📍',
      bullets: [
        '<strong>Holds memory address</strong> of the next instruction to fetch',
        '<strong>Increments (+1)</strong> automatically each Fetch cycle',
        '<strong>Directs CPU flow</strong> sequentially through instructions'
      ],
      getValue: () => `Address: ${fdeState.pc.toString().padStart(2, '0')} (0x${fdeState.pc.toString(16).toUpperCase().padStart(2, '0')})`
    },
    mar: {
      name: 'Memory Address Register (MAR)',
      nickname: 'The Address Tag',
      icon: '🏷️',
      bullets: [
        '<strong>Holds RAM address</strong> currently being read from or written to',
        '<strong>Feeds Address Bus</strong> directly with the target memory location',
        '<strong>Points to RAM slot</strong> where instruction or data lives'
      ],
      getValue: () => `Address: ${fdeState.mar}`
    },
    mdr: {
      name: 'Memory Data Register (MDR)',
      nickname: 'The In / Out Tray',
      icon: '📥',
      bullets: [
        '<strong>Temporary buffer</strong> holding data or instructions from RAM',
        '<strong>Connected directly</strong> to the bidirectional Data Bus',
        '<strong>Passes opcodes to CU</strong> and numerical data to ALU / ACC'
      ],
      getValue: () => `Contents: "${fdeState.mdr}"`
    },
    acc: {
      name: 'Accumulator (ACC)',
      nickname: 'The Working Screen',
      icon: '🧮',
      bullets: [
        '<strong>Stores running results</strong> of calculations from the ALU',
        '<strong>Fast internal storage</strong> for temporary math outcomes',
        '<strong>Feeds inputs back</strong> into subsequent calculations'
      ],
      getValue: () => `Current Value: ${fdeState.acc}`
    },
    cu: {
      name: 'Control Unit (CU)',
      nickname: 'Centre of Operations',
      icon: '🧠',
      bullets: [
        '<strong>Receives & decodes</strong> instructions from memory',
        '<strong>Sends out commands</strong> across the Control Bus',
        '<strong>Coordinates timing</strong> and directs data flow'
      ],
      getValue: () => `Decoded: ${fdeState.decodedOpcode} ${fdeState.decodedOperand || ''}`
    },
    alu: {
      name: 'Arithmetic Logic Unit (ALU)',
      nickname: 'The Calculation Engine',
      icon: '⚡',
      bullets: [
        '<strong>Performs arithmetic</strong>: Addition, subtraction, multiplication',
        '<strong>Executes logic checks</strong>: AND, OR, NOT, comparisons',
        '<strong>Outputs calculation results</strong> directly to Accumulator'
      ],
      getValue: () => `Latest Output: ${fdeState.acc}`
    },
    'bus-address': {
      name: 'Address Bus',
      nickname: 'One-Way Memory Highway',
      icon: '🛣️',
      bullets: [
        '<strong>Unidirectional</strong>: Carries addresses one way (MAR ➔ RAM)',
        '<strong>Points to memory slot</strong> to read or write',
        '<strong>Width determines</strong> maximum memory capacity (2ⁿ)'
      ],
      getValue: () => `Address Signal: ${fdeState.mar}`
    },
    'bus-data': {
      name: 'Data Bus',
      nickname: 'Two-Way Data Highway',
      icon: '🚚',
      bullets: [
        '<strong>Bidirectional</strong>: Transfers data & code (CPU ⇄ RAM)',
        '<strong>Connects MDR, ALU, and RAM</strong> along the shared trunk',
        '<strong>Width determines</strong> word size (how many bits per transfer)'
      ],
      getValue: () => `Data Signal: "${fdeState.mdr}"`
    },
    'bus-control': {
      name: 'Control Bus',
      nickname: 'Command Signals & Timing',
      icon: '⚡',
      bullets: [
        '<strong>Carries command pulses</strong>: MEM_READ, MEM_WRITE, HALT',
        '<strong>Synchronizes components</strong> with the CPU system clock',
        '<strong>Prevents collisions</strong> on the data and address buses'
      ],
      getValue: () => `Control Signal: ${document.getElementById('busControlVal')?.textContent || 'Idle'}`
    },
    ram: {
      name: 'Main Memory (RAM)',
      nickname: 'Primary Storage Workbench',
      icon: '💾',
      bullets: [
        '<strong>Holds running programs</strong> (instructions and active variables)',
        '<strong>Volatile</strong>: Contents lost when power is switched off',
        '<strong>Directly connected</strong> to CPU via the three system buses'
      ],
      getValue: () => `Active Slots: 00 – 07 | Mode: ${fdeState.ramViewFormat}`
    }
  };

  let currentlyInspectedKey = null;

  // Micro-step generator strictly aligned with AQA 8525 §3.4.1:
  // Distinct 5 steps: Fetch 1 (PC->MAR), Fetch 2 (RAM->MDR), Fetch 3 (PC++), Decode, Execute
  function generateMicroStepsForInstruction(pcVal) {
    const ramEntry = fdeState.ram[pcVal];
    if (!ramEntry || ramEntry.type !== 'Instruction' || fdeState.isHalted) {
      return [
        {
          stage: 'HALTED',
          title: 'Execution Complete (CPU Halted)',
          instrTag: 'HLT',
          bullets: [
            '<strong>Halt instruction reached:</strong> CPU has stopped the F-D-E cycle',
            '<strong>Program finished:</strong> Final computation results remain stored in RAM and ACC',
            '<strong>System standby:</strong> Click <strong>Reset</strong> to restart or choose another program'
          ],
          examTakeaway: 'The CPU stops executing instructions when a HLT instruction or program end is reached.',
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
      bullets: [
        `<strong>Program Counter holds:</strong> Address ${pcStr} (points to next instruction in RAM)`,
        `<strong>Internal Transfer:</strong> Address ${pcStr} copied across jumper wire into MAR`,
        '<strong>Target Locked:</strong> Prepares the Memory Address Register for RAM lookup'
      ],
      examTakeaway: 'The contents of the Program Counter (PC) are copied to the MAR via the internal bus.',
      activeElements: { source: 'regPC', target: 'regMAR', internalWire: 'wirePCtoMAR' },
      action: () => {
        fdeState.mar = pcStr;
        fdeState.decodedOpcode = '---';
        fdeState.decodedOperand = '';
      }
    });

    // STEP 2: Fetch 2 (Memory Read from RAM into MDR)
    steps.push({
      stage: 'FETCH',
      title: 'Fetch 2: RAM Lookup & Copy to MDR',
      instrTag: instrDisplay,
      bullets: [
        `<strong>Address Bus:</strong> Transmits memory address ${pcStr} from MAR to RAM`,
        '<strong>Control Bus:</strong> Control Unit pulses MEM_READ command to RAM',
        `<strong>Data Bus:</strong> RAM finds instruction "${ramEntry.val}" and returns it into MDR`
      ],
      examTakeaway: 'The instruction at the memory address in MAR is copied to the MDR via the Data Bus.',
      activeElements: { source: 'regMAR', target: 'regMDR', bus: 'busAddress', secondaryBus: 'busData', ramRow: pcStr },
      busAddressVal: `Addr: ${pcStr}`,
      busDataVal: `${ramEntry.val}`,
      busControlVal: 'MEM_READ',
      packetDir: { bus: 'address', dir: 'to-ram', val: pcStr },
      action: () => {
        fdeState.mdr = ramEntry.val;
      }
    });

    // STEP 3: Fetch 3 (Explicit Program Counter Increment: PC = PC + 1)
    steps.push({
      stage: 'FETCH',
      title: 'Fetch 3: Program Counter Increments (PC ← PC + 1)',
      instrTag: instrDisplay,
      bullets: [
        `<strong>PC Advances:</strong> Program Counter increments by 1 (${pcStr} ➔ ${nextPcStr})`,
        '<strong>Sequencing:</strong> Primes PC to point to the next instruction for the subsequent cycle',
        '<strong>AQA Key Mark:</strong> Distinct mark awarded for stating PC = PC + 1'
      ],
      examTakeaway: 'The Program Counter is incremented by 1 (PC ← PC + 1).',
      activeElements: { target: 'regPC' },
      isIncrement: true,
      action: () => {
        fdeState.pc = pcVal + 1;
      }
    });

    // STEP 4: Decode (CU decodes MDR)
    steps.push({
      stage: 'DECODE',
      title: 'Decode: Control Unit Decodes Instruction in MDR',
      instrTag: instrDisplay,
      bullets: [
        `<strong>Instruction Passed:</strong> MDR sends "${ramEntry.val}" to the Control Unit`,
        `<strong>Decoded into Parts:</strong> Opcode (${opcode}) and Operand (${operand || 'None'})`,
        '<strong>Hardware Setup:</strong> CU activates internal control lines ready for execution'
      ],
      examTakeaway: 'The instruction held in the Memory Data Register (MDR) is decoded by the Control Unit (CU).',
      activeElements: { source: 'regMDR', target: 'cuBlock', internalWire: 'wireMDRtoExecution' },
      busControlVal: 'DECODE_OP',
      action: () => {
        fdeState.decodedOpcode = opcode;
        fdeState.decodedOperand = operand;
      }
    });

    // STEP 5: Execute (Opcode action)
    if (opcode === 'LOAD') {
      const dataVal = fdeState.ram[parseInt(operand, 10)]?.val || '0';
      steps.push({
        stage: 'EXECUTE',
        title: `Execute: Load Value from RAM Address ${operand} into ACC`,
        instrTag: instrDisplay,
        bullets: [
          `<strong>Address Sent:</strong> MAR set to address ${operand}; MEM_READ sent to RAM`,
          `<strong>Data Fetched:</strong> Number ${dataVal} travels across Data Bus into MDR`,
          `<strong>Stored in ACC:</strong> Value ${dataVal} loaded directly into the Accumulator`
        ],
        examTakeaway: 'Data at the specified memory address is fetched via MDR and copied into the Accumulator (ACC).',
        activeElements: { source: 'regMAR', target: 'regACC', bus: 'busAddress', secondaryBus: 'busData', ramRow: operand, internalWire: 'wireMDRtoExecution' },
        busAddressVal: `Addr: ${operand}`,
        busDataVal: `${dataVal}`,
        busControlVal: 'MEM_READ',
        packetDir: { bus: 'data', dir: 'to-cpu', val: dataVal },
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
        bullets: [
          `<strong>Data Retrieved:</strong> Value ${addOperandVal} fetched from address ${operand} into MDR`,
          `<strong>ALU Calculation:</strong> ALU adds MDR (${addOperandVal}) to existing ACC (${fdeState.acc})`,
          `<strong>New Total:</strong> Result (${fdeState.acc + addOperandVal}) saved into the Accumulator`
        ],
        examTakeaway: 'The ALU adds the MDR contents to the Accumulator (ACC) and stores the result back in ACC.',
        activeElements: { source: 'aluBlock', target: 'regACC', bus: 'busAddress', secondaryBus: 'busData', ramRow: operand, internalWire: 'wireALUtoACC' },
        busAddressVal: `Addr: ${operand}`,
        busDataVal: `${addOperandVal}`,
        busControlVal: 'MEM_READ',
        packetDir: { bus: 'data', dir: 'to-cpu', val: addOperandVal },
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
        bullets: [
          `<strong>Data Retrieved:</strong> Value ${subOperandVal} fetched from address ${operand} into MDR`,
          `<strong>ALU Calculation:</strong> ALU subtracts MDR (${subOperandVal}) from existing ACC (${fdeState.acc})`,
          `<strong>New Total:</strong> Result (${fdeState.acc - subOperandVal}) saved into the Accumulator`
        ],
        examTakeaway: 'The ALU subtracts the MDR contents from the Accumulator (ACC) and stores the result back in ACC.',
        activeElements: { source: 'aluBlock', target: 'regACC', bus: 'busAddress', secondaryBus: 'busData', ramRow: operand, internalWire: 'wireALUtoACC' },
        busAddressVal: `Addr: ${operand}`,
        busDataVal: `${subOperandVal}`,
        busControlVal: 'MEM_READ',
        packetDir: { bus: 'data', dir: 'to-cpu', val: subOperandVal },
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
        bullets: [
          `<strong>Target Address:</strong> MAR set to address ${operand} via Address Bus`,
          `<strong>Data Prepared:</strong> ACC value (${fdeState.acc}) transferred into MDR`,
          `<strong>Written to Memory:</strong> Control Unit pulses MEM_WRITE; ${fdeState.acc} stored in RAM slot ${operand}`
        ],
        examTakeaway: 'The contents of the Accumulator (ACC) are copied to MDR and written to the address in MAR.',
        activeElements: { source: 'regACC', target: `ram-row-${operand}`, bus: 'busAddress', secondaryBus: 'busData', ramRow: operand, internalWire: 'wireMDRtoExecution' },
        busAddressVal: `Addr: ${operand}`,
        busDataVal: `${fdeState.acc}`,
        busControlVal: 'MEM_WRITE',
        packetDir: { bus: 'data', dir: 'to-ram', val: fdeState.acc },
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
        bullets: [
          '<strong>Halt Signal:</strong> CU sends HALT command signal across the Control Bus',
          '<strong>Execution Stopped:</strong> The Fetch-Decode-Execute cycle completes and stops',
          '<strong>Final State Saved:</strong> Results remain safely stored in memory and registers'
        ],
        examTakeaway: 'The CPU stops executing instructions when a HLT instruction is reached.',
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
    fdeState.isInitialState = true;
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
        tdVal.textContent = formatRamValue(row.val, row.type, fdeState.ramViewFormat);
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
        valSpan.textContent = formatRamValue(row.val, row.type, fdeState.ramViewFormat);

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
    if (cuDecodedText) cuDecodedText.textContent = (fdeState.decodedOpcode === '---' || fdeState.decodedOpcode === 'NONE') ? '---' : (fdeState.decodedOpcode + (fdeState.decodedOperand ? ` ${fdeState.decodedOperand}` : ''));
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

  // =========================================================================
  // 2.2 CANVAS MOTHERBOARD RENDERER & VISUAL SYSTEM (Concept Art Aligned)
  // =========================================================================

  let canvasCtx = null;
  let animFrameId = null;
  let animTime = 0;
  let hoveredKey = null;

  function initCanvasMotherboard() {
    const canvas = document.getElementById('cpuMotherboardCanvas');
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 1060 * dpr;
    canvas.height = 520 * dpr;
    canvasCtx = canvas.getContext('2d');
    canvasCtx.scale(dpr, dpr);

    function getMousePos(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = 1060 / rect.width;
      const scaleY = 520 / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }

    const HIT_ZONES = [
      { key: 'pc',          x: 45,  y: 64,  w: 82,  h: 86 },
      { key: 'mar',         x: 139, y: 64,  w: 82,  h: 86 },
      { key: 'mdr',         x: 233, y: 64,  w: 82,  h: 86 },
      { key: 'acc',         x: 327, y: 64,  w: 82,  h: 86 },
      { key: 'alu',         x: 430, y: 45,  w: 285, h: 112 },
      { key: 'cu',          x: 35,  y: 365, w: 380, h: 125 },
      { key: 'bus-address', x: 180, y: 183, w: 565, h: 30 },
      { key: 'bus-data',    x: 274, y: 243, w: 471, h: 30 },
      { key: 'bus-control', x: 225, y: 303, w: 520, h: 30 },
      { key: 'ram',         x: 745, y: 15,  w: 298, h: 490 }
    ];

    canvas.addEventListener('mousemove', (e) => {
      const pos = getMousePos(e);
      let foundKey = null;

      for (const zone of HIT_ZONES) {
        if (pos.x >= zone.x && pos.x <= zone.x + zone.w && pos.y >= zone.y && pos.y <= zone.y + zone.h) {
          foundKey = zone.key;
          break;
        }
      }

      hoveredKey = foundKey;
      if (foundKey) {
        canvas.style.cursor = 'pointer';
        showInspector(foundKey, pos.x);
      } else {
        canvas.style.cursor = 'default';
        hideInspector();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      hoveredKey = null;
      canvas.style.cursor = 'default';
      hideInspector();
    });

    startCanvasLoop();
  }

  function startCanvasLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    function loop() {
      animTime += 0.022;
      drawCanvasMotherboard();
      animFrameId = requestAnimationFrame(loop);
    }
    animFrameId = requestAnimationFrame(loop);
  }

  function drawRoundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCanvasMotherboard() {
    if (!canvasCtx) return;
    const ctx = canvasCtx;
    const isDark = document.documentElement.classList.contains('dark');

    // Theme Color Palette
    const cBgRoot       = isDark ? '#090d16' : '#f8fafc';
    const cCardBg       = isDark ? '#111827' : '#ffffff';
    const cCardElevated = isDark ? '#1f2937' : '#f1f5f9';
    const cBorder       = isDark ? '#374151' : '#e2e8f0';
    const cTextPrimary  = isDark ? '#f9fafb' : '#0f172a';
    const cTextSecondary= isDark ? '#9ca3af' : '#475569';
    const cTextMuted    = isDark ? '#6b7280' : '#94a3b8';

    const cAmber   = '#f59e0b';
    const cEmerald = '#10b981';
    const cPurple  = '#a855f7';
    const cBlue    = '#38bdf8';
    const cPink    = '#ec4899';

    // Clear viewport
    ctx.clearRect(0, 0, 1060, 520);

    // Canvas Substrate Frame
    drawRoundRect(ctx, 4, 4, 1052, 512, 16);
    ctx.fillStyle = cBgRoot;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = cBorder;
    ctx.stroke();

    const isInitial = fdeState.isInitialState;
    const currStep = isInitial ? {} : (fdeState.microSteps[fdeState.currentMicroStepIndex] || {});
    const act = currStep.activeElements || {};
    const hasFocus = !isInitial && !!currStep.stage;

    // Helper: Component Active state check
    const isNodeActive = (key) => {
      if (isInitial || !currStep.stage) return false;
      if (act.source === key || act.target === key || act.secondaryTarget === key) return true;
      if (key === 'regPC' && currStep.isIncrement) return true;
      return false;
    };

    // Helper: Dim opacity in focus mode (Pre-stage always returns 1.0)
    const getDimAlpha = (isActive) => (isInitial ? 1.0 : (hasFocus ? (isActive ? 1.0 : 0.35) : 1.0));

    // =========================================================================
    // 1. CPU SILICON DIE HOUSING (Left & Center)
    // =========================================================================
    ctx.save();
    ctx.globalAlpha = 1.0;

    drawRoundRect(ctx, 20, 15, 710, 490, 16);
    ctx.fillStyle = cCardBg;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = cBorder;
    ctx.stroke();

    // CPU Header
    ctx.beginPath();
    ctx.arc(36, 32, 4, 0, Math.PI * 2);
    ctx.fillStyle = cBlue;
    ctx.fill();

    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextPrimary;
    ctx.textAlign = 'left';
    ctx.fillText('CENTRAL PROCESSING UNIT (CPU)', 48, 36);

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'right';
    ctx.fillText('Von Neumann Architecture Core', 715, 36);

    // Divider under CPU header
    ctx.beginPath();
    ctx.moveTo(20, 44);
    ctx.lineTo(730, 44);
    ctx.strokeStyle = cBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // -------------------------------------------------------------------------
    // 1.1 INTERNAL REGISTERS CONTAINER (Top Left)
    // -------------------------------------------------------------------------
    drawRoundRect(ctx, 35, 48, 380, 110, 10);
    ctx.fillStyle = isDark ? '#141c2c' : '#f8fafc';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = cBorder;
    ctx.stroke();

    ctx.font = 'bold 9.5px JetBrains Mono, monospace';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'left';
    ctx.fillText('INTERNAL REGISTERS (AQA CORE)', 48, 62);

    // 4 Registers: PC, MAR, MDR, ACC
    const REG_LIST = [
      { id: 'regPC',  key: 'pc',  x: 45,  pinX: 86,  tag: 'PC',  name: 'Prog Counter', color: cBlue,    val: fdeState.pc.toString().padStart(2, '0') },
      { id: 'regMAR', key: 'mar', x: 139, pinX: 180, tag: 'MAR', name: 'Mem Address',  color: cAmber,   val: fdeState.mar },
      { id: 'regMDR', key: 'mdr', x: 233, pinX: 274, tag: 'MDR', name: 'Mem Data',     color: cEmerald, val: fdeState.mdr },
      { id: 'regACC', key: 'acc', x: 327, pinX: 368, tag: 'ACC', name: 'Accumulator',  color: cPink,    val: fdeState.acc.toString() }
    ];

    for (const reg of REG_LIST) {
      const active = isNodeActive(reg.id);
      const isInc = reg.id === 'regPC' && currStep.isIncrement;
      ctx.globalAlpha = getDimAlpha(active || isInc);

      drawRoundRect(ctx, reg.x, 68, 82, 82, 8);
      ctx.fillStyle = active || isInc
        ? (isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(56, 189, 248, 0.12)')
        : cCardBg;
      ctx.fill();

      ctx.lineWidth = active || isInc ? 2.5 : 1.5;
      ctx.strokeStyle = isInc ? cEmerald : (active ? reg.color : (hoveredKey === reg.key ? cBlue : cBorder));
      if (active || isInc) {
        ctx.shadowColor = isInc ? cEmerald : reg.color;
        ctx.shadowBlur = 12;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Color accent tab
      ctx.beginPath();
      ctx.moveTo(reg.x + 3, 73);
      ctx.lineTo(reg.x + 3, 93);
      ctx.strokeStyle = reg.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Tag
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillStyle = reg.color;
      ctx.textAlign = 'left';
      ctx.fillText(reg.tag, reg.x + 10, 84);

      // Info Icon
      ctx.font = '9px sans-serif';
      ctx.fillStyle = cTextMuted;
      ctx.textAlign = 'right';
      ctx.fillText('ℹ️', reg.x + 75, 83);

      // Big Value
      ctx.font = 'bold 15px JetBrains Mono, monospace';
      ctx.fillStyle = active || isInc ? reg.color : cTextPrimary;
      ctx.textAlign = 'center';
      ctx.fillText(reg.val, reg.x + 41, 114);

      // PC Increment Badge
      if (isInc) {
        drawRoundRect(ctx, reg.x + 12, 122, 58, 14, 3);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.fill();
        ctx.font = 'bold 8px JetBrains Mono, monospace';
        ctx.fillStyle = cEmerald;
        ctx.fillText('+1 (Next)', reg.x + 41, 132);
      } else {
        ctx.font = '8px Inter, system-ui, sans-serif';
        ctx.fillStyle = cTextMuted;
        ctx.fillText(reg.name, reg.x + 41, 134);
      }

      // Pin connection terminal dot at bottom
      ctx.beginPath();
      ctx.arc(reg.pinX, 150, 3, 0, Math.PI * 2);
      ctx.fillStyle = reg.color;
      ctx.fill();
    }

    // -------------------------------------------------------------------------
    // 1.2 ARITHMETIC LOGIC UNIT (ALU) (Top Center/Right)
    // -------------------------------------------------------------------------
    const aluActive = isNodeActive('aluBlock');
    ctx.globalAlpha = getDimAlpha(aluActive);

    drawRoundRect(ctx, 430, 48, 285, 110, 10);
    ctx.fillStyle = aluActive ? (isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.12)') : cCardElevated;
    ctx.fill();
    ctx.lineWidth = aluActive ? 2 : 1.5;
    ctx.strokeStyle = aluActive ? cEmerald : (hoveredKey === 'alu' ? cBlue : cBorder);
    if (aluActive) {
      ctx.shadowColor = cEmerald;
      ctx.shadowBlur = 12;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ALU Tag Badge
    drawRoundRect(ctx, 638, 55, 68, 16, 4);
    ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)';
    ctx.fill();
    ctx.font = 'bold 8.5px JetBrains Mono, monospace';
    ctx.fillStyle = cEmerald;
    ctx.textAlign = 'center';
    ctx.fillText('CALCULATOR', 672, 66);

    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextPrimary;
    ctx.textAlign = 'left';
    ctx.fillText('Arithmetic Logic Unit (ALU)', 442, 68);

    ctx.font = '9.5px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextSecondary;
    ctx.fillText('Math Output:', 442, 94);

    ctx.font = 'bold 17px JetBrains Mono, monospace';
    ctx.fillStyle = aluActive ? cEmerald : cTextPrimary;
    ctx.fillText(fdeState.acc.toString(), 442, 118);

    ctx.font = '8.5px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextMuted;
    ctx.fillText('Performs arithmetic (+, -) & logic checks', 442, 138);

    // Pin connection terminal dot at bottom of ALU
    ctx.beginPath();
    ctx.arc(572, 158, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = cEmerald;
    ctx.fill();

    // Direct jumper link: ACC to ALU
    ctx.beginPath();
    ctx.moveTo(409, 109);
    ctx.lineTo(430, 109);
    ctx.strokeStyle = aluActive ? cEmerald : cBorder;
    ctx.lineWidth = aluActive ? 2.5 : 1.5;
    ctx.stroke();

    // Small ALU ⇄ ACC pill
    drawRoundRect(ctx, 396, 102, 46, 14, 3);
    ctx.fillStyle = cCardBg;
    ctx.fill();
    ctx.strokeStyle = aluActive ? cEmerald : cBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = 'bold 7.5px JetBrains Mono, monospace';
    ctx.fillStyle = aluActive ? cEmerald : cTextMuted;
    ctx.textAlign = 'center';
    ctx.fillText('ALU⇄ACC', 419, 112);

    // -------------------------------------------------------------------------
    // 1.3 CONTROL UNIT (CU) (Bottom Left)
    // -------------------------------------------------------------------------
    const cuActive = isNodeActive('cuBlock');
    ctx.globalAlpha = getDimAlpha(cuActive);

    drawRoundRect(ctx, 35, 365, 380, 125, 10);
    ctx.fillStyle = cuActive ? (isDark ? 'rgba(168, 85, 247, 0.16)' : 'rgba(168, 85, 247, 0.12)') : cCardElevated;
    ctx.fill();
    ctx.lineWidth = cuActive ? 2 : 1.5;
    ctx.strokeStyle = cuActive ? cPurple : (hoveredKey === 'cu' ? cBlue : cBorder);
    if (cuActive) {
      ctx.shadowColor = cPurple;
      ctx.shadowBlur = 12;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // CU Tag Pill
    drawRoundRect(ctx, 345, 373, 60, 16, 4);
    ctx.fillStyle = isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.2)';
    ctx.fill();
    ctx.font = 'bold 8.5px JetBrains Mono, monospace';
    ctx.fillStyle = cPurple;
    ctx.textAlign = 'center';
    ctx.fillText('DECODER', 375, 384);

    // CU Centre of Operations Pill
    drawRoundRect(ctx, 45, 373, 135, 16, 4);
    ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.15)';
    ctx.fill();
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.fillStyle = cBlue;
    ctx.textAlign = 'center';
    ctx.fillText('CENTRE OF OPERATIONS', 112, 384);

    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextPrimary;
    ctx.textAlign = 'left';
    ctx.fillText('Control Unit (CU)', 45, 410);

    ctx.font = '9.5px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextSecondary;
    ctx.fillText('Decoded Instruction:', 45, 432);

    ctx.font = 'bold 15px JetBrains Mono, monospace';
    ctx.fillStyle = cuActive ? cPurple : cTextPrimary;
    const cuText = (fdeState.decodedOpcode === '---' || fdeState.decodedOpcode === 'NONE')
      ? 'NONE'
      : `${fdeState.decodedOpcode} ${fdeState.decodedOperand || ''}`;
    ctx.fillText(cuText, 45, 454);

    ctx.font = '8.5px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextMuted;
    ctx.fillText('• Receives & decodes instructions  • Sends out command signals', 45, 476);

    // Pin connection terminal dot at top of CU
    ctx.beginPath();
    ctx.arc(225, 365, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = cPurple;
    ctx.fill();

    // =========================================================================
    // 2. MAIN MEMORY (RAM) RACK (Right)
    // =========================================================================
    ctx.save();
    ctx.globalAlpha = 1.0;

    drawRoundRect(ctx, 745, 15, 298, 490, 16);
    ctx.fillStyle = cCardBg;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = cBorder;
    ctx.stroke();

    // RAM Header
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillStyle = cEmerald;
    ctx.textAlign = 'left';
    ctx.fillText('MAIN MEMORY (RAM)', 760, 36);

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'right';
    ctx.fillText('Active Slots (00 – 07)', 1028, 36);

    // Divider under header
    ctx.beginPath();
    ctx.moveTo(745, 44);
    ctx.lineTo(1043, 44);
    ctx.strokeStyle = cBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Column Headers
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'left';
    ctx.fillText('ADDR', 762, 58);
    ctx.fillText('CONTENT', 835, 58);
    ctx.textAlign = 'right';
    ctx.fillText('TYPE', 1028, 58);

    // 8 Active RAM Slots
    const targetAddrStr = act.ramRow ? act.ramRow.toString().padStart(2, '0') : null;
    let ramTargetY = 70 + 21; // fallback row 0 center

    for (let i = 0; i < 8; i++) {
      const row = fdeState.ram[i] || { addr: i.toString().padStart(2, '0'), val: '0', type: 'Empty' };
      const rowY = 66 + i * 48;
      const isRowActive = !isInitial && targetAddrStr === row.addr;
      const isWrite = isRowActive && currStep.stage === 'EXECUTE' && currStep.busControlVal === 'MEM_WRITE';

      if (isRowActive) ramTargetY = rowY + 21;

      ctx.globalAlpha = getDimAlpha(isRowActive);

      drawRoundRect(ctx, 756, rowY, 276, 42, 6);
      ctx.fillStyle = isRowActive
        ? (isWrite ? (isDark ? 'rgba(245, 158, 11, 0.25)' : '#fef3c7') : (isDark ? 'rgba(56, 189, 248, 0.25)' : '#e0f2fe'))
        : cCardElevated;
      ctx.fill();

      ctx.lineWidth = isRowActive ? 2 : 1;
      ctx.strokeStyle = isRowActive ? (isWrite ? cAmber : cBlue) : cBorder;
      if (isRowActive) {
        ctx.shadowColor = isWrite ? cAmber : cBlue;
        ctx.shadowBlur = 14;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Address
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillStyle = isRowActive ? (isWrite ? cAmber : cBlue) : cTextSecondary;
      ctx.textAlign = 'left';
      ctx.fillText(row.addr, 768, rowY + 25);

      // Formatted Value
      const displayVal = formatRamValue(row.val, row.type, fdeState.ramViewFormat);
      ctx.font = 'bold 11.5px JetBrains Mono, monospace';
      if (row.type === 'Instruction') ctx.fillStyle = isDark ? '#a5b4fc' : '#4f46e5';
      else if (row.type === 'Result') ctx.fillStyle = cEmerald;
      else if (row.type === 'Data')   ctx.fillStyle = cBlue;
      else ctx.fillStyle = cTextMuted;
      ctx.fillText(displayVal, 835, rowY + 25);

      // Type Badge
      drawRoundRect(ctx, 984, rowY + 12, 42, 18, 4);
      ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = cBorder;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 7.5px JetBrains Mono, monospace';
      ctx.fillStyle = row.type === 'Instruction' ? '#818cf8' : (row.type === 'Result' ? cEmerald : (row.type === 'Data' ? cBlue : cTextMuted));
      ctx.textAlign = 'center';
      ctx.fillText(row.type === 'Instruction' ? 'INSTR' : (row.type === 'Result' ? 'RESULT' : (row.type === 'Data' ? 'DATA' : 'EMPTY')), 1005, rowY + 24);
    }

    ctx.restore();

    // =========================================================================
    // 3. THE 3 SYSTEM BUS HIGHWAY TRUNKS (Center Corridors with Solder Drops)
    // =========================================================================
    ctx.save();

    // -------------------------------------------------------------------------
    // 3.1 ADDRESS BUS TRUNK (Amber: Unidirectional MAR ➔ RAM)
    // -------------------------------------------------------------------------
    const isAddrBusActive = !isInitial && (act.bus === 'busAddress' || act.secondaryBus === 'busAddress');
    ctx.globalAlpha = getDimAlpha(isAddrBusActive);

    // Highway Ribbon Corridor (from MAR pin x=180 across to RAM dock x=745)
    drawRoundRect(ctx, 180, 183, 565, 30, 6);
    ctx.fillStyle = isAddrBusActive
      ? (isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.14)')
      : (isDark ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.04)');
    ctx.fill();
    ctx.lineWidth = isAddrBusActive ? 2 : 1;
    ctx.strokeStyle = isAddrBusActive ? cAmber : (isDark ? '#3d2e18' : '#fed7aa');
    if (isAddrBusActive) {
      ctx.shadowColor = cAmber;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center conductive copper trace
    ctx.beginPath();
    ctx.moveTo(180, 198);
    ctx.lineTo(745, 198);
    ctx.strokeStyle = isAddrBusActive ? cAmber : (isDark ? '#785315' : '#fcd34d');
    ctx.lineWidth = isAddrBusActive ? 3.5 : 2;
    ctx.stroke();

    // Direction arrows along Address Bus
    ctx.font = 'bold 8.5px JetBrains Mono, monospace';
    ctx.fillStyle = isAddrBusActive ? cAmber : cTextMuted;
    ctx.textAlign = 'center';
    ctx.fillText('▶   ▶   ▶   ▶   ▶', 460, 195);

    // Highway Ribbon Label
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.fillText('ADDRESS BUS (Unidirectional • MAR ➔ RAM)', 460, 207);

    // Live Readout at right end
    ctx.textAlign = 'right';
    ctx.fillText(isAddrBusActive ? `ADDR: ${fdeState.mar}` : 'ADDR BUS', 735, 203);

    // MAR Branch Drop-Line (Vertical from MAR pin to Address Bus)
    ctx.beginPath();
    ctx.moveTo(180, 150);
    ctx.lineTo(180, 198);
    ctx.strokeStyle = isAddrBusActive ? cAmber : cBorder;
    ctx.lineWidth = isAddrBusActive ? 3.5 : 2;
    if (isAddrBusActive) {
      ctx.shadowColor = cAmber;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Solder T-junction dot at MAR tap
    ctx.beginPath();
    ctx.arc(180, 198, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isAddrBusActive ? cAmber : (isDark ? '#785315' : '#fcd34d');
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Internal Jumper: PC ➔ MAR (Gold curved wire under registers)
    const isStep1 = !isInitial && currStep.stage === 'FETCH' && act.internalWire === 'wirePCtoMAR';
    ctx.globalAlpha = getDimAlpha(isStep1);

    ctx.beginPath();
    ctx.moveTo(86, 150);
    ctx.bezierCurveTo(86, 178, 180, 178, 180, 150);
    ctx.strokeStyle = isStep1 ? cBlue : cBorder;
    ctx.lineWidth = isStep1 ? 4 : 2;
    if (isStep1) {
      ctx.shadowColor = cBlue;
      ctx.shadowBlur = 12;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Capsule sliding PC -> MAR
    if (isStep1) {
      const t = (animTime * 1.5) % 1;
      const px = Math.pow(1 - t, 2) * 86 + 2 * (1 - t) * t * 133 + Math.pow(t, 2) * 180;
      const py = Math.pow(1 - t, 2) * 150 + 2 * (1 - t) * t * 178 + Math.pow(t, 2) * 150;
      drawCapsulePacket(ctx, px, py, fdeState.pc.toString().padStart(2, '0'), cBlue);
    }

    // Trace from Address Bus into Target RAM Row
    if (isAddrBusActive) {
      ctx.beginPath();
      ctx.moveTo(745, 198);
      ctx.bezierCurveTo(752, 198, 754, ramTargetY, 756, ramTargetY);
      ctx.strokeStyle = cAmber;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = cAmber;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Sliding Address Capsule along Address Bus
      const glideT = (animTime * 1.2) % 1;
      let px, py;
      if (glideT < 0.2) {
        // Drop down from MAR
        const t = glideT / 0.2;
        px = 180;
        py = 150 + t * 48;
      } else if (glideT < 0.85) {
        // Across Address Bus trunk
        const t = (glideT - 0.2) / 0.65;
        px = 180 + t * 565;
        py = 198;
      } else {
        // Into target RAM row
        const t = (glideT - 0.85) / 0.15;
        px = 745 + t * 11;
        py = (1 - t) * 198 + t * ramTargetY;
      }
      drawCapsulePacket(ctx, px, py, fdeState.mar, cAmber);
    }

    // -------------------------------------------------------------------------
    // 3.2 DATA BUS TRUNK (Emerald: Bidirectional MDR ⇄ RAM ⇄ ALU)
    // -------------------------------------------------------------------------
    const isDataBusActive = !isInitial && (act.bus === 'busData' || act.secondaryBus === 'busData');
    ctx.globalAlpha = getDimAlpha(isDataBusActive);

    // Highway Ribbon Corridor (from MDR pin x=274 across to RAM dock x=745)
    drawRoundRect(ctx, 274, 243, 471, 30, 6);
    ctx.fillStyle = isDataBusActive
      ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.14)')
      : (isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.04)');
    ctx.fill();
    ctx.lineWidth = isDataBusActive ? 2 : 1;
    ctx.strokeStyle = isDataBusActive ? cEmerald : (isDark ? '#143825' : '#a7f3d0');
    if (isDataBusActive) {
      ctx.shadowColor = cEmerald;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center conductive trace
    ctx.beginPath();
    ctx.moveTo(274, 258);
    ctx.lineTo(745, 258);
    ctx.strokeStyle = isDataBusActive ? cEmerald : (isDark ? '#1b5e39' : '#6ee7b7');
    ctx.lineWidth = isDataBusActive ? 3.5 : 2;
    ctx.stroke();

    // Bidirectional arrows along Data Bus
    ctx.font = 'bold 8.5px JetBrains Mono, monospace';
    ctx.fillStyle = isDataBusActive ? cEmerald : cTextMuted;
    ctx.textAlign = 'center';
    ctx.fillText('◀ ◀ ◀   ▶ ▶ ▶', 510, 255);

    // Highway Ribbon Label
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.fillText('DATA BUS (Bidirectional • MDR ⇄ RAM ⇄ ALU)', 510, 267);

    // Live Readout at right end
    ctx.textAlign = 'right';
    ctx.fillText(isDataBusActive ? `DATA: "${fdeState.mdr}"` : 'DATA BUS', 735, 263);

    // MDR Branch Drop-Line (Vertical from MDR pin down to Data Bus)
    ctx.beginPath();
    ctx.moveTo(274, 150);
    ctx.lineTo(274, 258);
    ctx.strokeStyle = isDataBusActive ? cEmerald : cBorder;
    ctx.lineWidth = isDataBusActive ? 3.5 : 2;
    if (isDataBusActive) {
      ctx.shadowColor = cEmerald;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Solder T-junction dot at MDR tap
    ctx.beginPath();
    ctx.arc(274, 258, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isDataBusActive ? cEmerald : (isDark ? '#1b5e39' : '#6ee7b7');
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ALU Branch Drop-Line (Vertical from ALU pin down to Data Bus)
    ctx.beginPath();
    ctx.moveTo(572, 158);
    ctx.lineTo(572, 258);
    ctx.strokeStyle = isDataBusActive ? cEmerald : cBorder;
    ctx.lineWidth = isDataBusActive ? 3.5 : 2;
    if (isDataBusActive) {
      ctx.shadowColor = cEmerald;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Solder T-junction dot at ALU tap
    ctx.beginPath();
    ctx.arc(572, 258, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isDataBusActive ? cEmerald : (isDark ? '#1b5e39' : '#6ee7b7');
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Decoder Opcode Line: from Data Bus down into CU top
    const isDecodeActive = !isInitial && currStep.stage === 'DECODE';
    ctx.beginPath();
    ctx.moveTo(274, 273);
    ctx.lineTo(274, 365);
    ctx.strokeStyle = isDecodeActive ? cPurple : cBorder;
    ctx.lineWidth = isDecodeActive ? 3.5 : 1.5;
    if (isDecodeActive) {
      ctx.shadowColor = cPurple;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Opcode label on decoder line
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.fillStyle = isDecodeActive ? cPurple : cTextMuted;
    ctx.textAlign = 'left';
    ctx.fillText('Opcode to CU ➔', 280, 320);

    // Sliding Opcode Capsule down into CU
    if (isDecodeActive) {
      const t = (animTime * 1.5) % 1;
      const py = 273 + t * 92;
      drawCapsulePacket(ctx, 274, py, fdeState.mdr, cPurple);
    }

    // Trace from Data Bus to Active RAM Row
    if (isDataBusActive) {
      const isMemWrite = currStep.stage === 'EXECUTE' && currStep.busControlVal === 'MEM_WRITE';

      ctx.beginPath();
      ctx.moveTo(745, 258);
      ctx.bezierCurveTo(752, 258, 754, ramTargetY, 756, ramTargetY);
      ctx.strokeStyle = cEmerald;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = cEmerald;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Sliding Data Capsule along Data Bus
      let glideT = (animTime * 1.2) % 1;
      if (isMemWrite) glideT = 1 - glideT; // Reverse for memory write

      let px, py;
      if (glideT < 0.15) {
        // Curve from RAM Row into Data Bus
        const t = glideT / 0.15;
        px = 756 - t * 11;
        py = (1 - t) * ramTargetY + t * 258;
      } else if (glideT < 0.8) {
        // Across Data Bus trunk
        const t = (glideT - 0.15) / 0.65;
        px = 745 - t * 471;
        py = 258;
      } else {
        // Travel up branch into MDR
        const t = (glideT - 0.8) / 0.2;
        px = 274;
        py = 258 - t * 108;
      }
      drawCapsulePacket(ctx, px, py, fdeState.mdr, cEmerald);
    }

    // -------------------------------------------------------------------------
    // 3.3 CONTROL BUS TRUNK (Purple: Commands & Timing CU ➔ System)
    // -------------------------------------------------------------------------
    const isCtrlBusActive = !isInitial && !!currStep.busControlVal;
    ctx.globalAlpha = getDimAlpha(isCtrlBusActive);

    // Highway Ribbon Corridor (from CU pin x=225 across to RAM dock x=745)
    drawRoundRect(ctx, 225, 303, 520, 30, 6);
    ctx.fillStyle = isCtrlBusActive
      ? (isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.14)')
      : (isDark ? 'rgba(168, 85, 247, 0.05)' : 'rgba(168, 85, 247, 0.04)');
    ctx.fill();
    ctx.lineWidth = isCtrlBusActive ? 2 : 1;
    ctx.strokeStyle = isCtrlBusActive ? cPurple : (isDark ? '#35184f' : '#e9d5ff');
    if (isCtrlBusActive) {
      ctx.shadowColor = cPurple;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center conductive trace
    ctx.beginPath();
    ctx.moveTo(225, 318);
    ctx.lineTo(745, 318);
    ctx.strokeStyle = isCtrlBusActive ? cPurple : (isDark ? '#6b21a8' : '#d8b4fe');
    ctx.lineWidth = isCtrlBusActive ? 3.5 : 2;
    ctx.stroke();

    // Pulse markers along Control Bus
    ctx.font = 'bold 8.5px JetBrains Mono, monospace';
    ctx.fillStyle = isCtrlBusActive ? cPurple : cTextMuted;
    ctx.textAlign = 'center';
    ctx.fillText('⚡   ⚡   ⚡   ⚡   ⚡', 485, 315);

    // Highway Ribbon Label
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.fillText('CONTROL BUS (Commands & Timing • CU ➔ All)', 485, 327);

    // Live Readout at right end
    ctx.textAlign = 'right';
    ctx.fillText(isCtrlBusActive ? `CMD: ${currStep.busControlVal || 'READ'}` : 'CTRL BUS', 735, 323);

    // CU Branch Tap-Line (Vertical from CU pin up to Control Bus)
    ctx.beginPath();
    ctx.moveTo(225, 365);
    ctx.lineTo(225, 318);
    ctx.strokeStyle = isCtrlBusActive ? cPurple : cBorder;
    ctx.lineWidth = isCtrlBusActive ? 3.5 : 2;
    if (isCtrlBusActive) {
      ctx.shadowColor = cPurple;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Solder T-junction dot at CU tap
    ctx.beginPath();
    ctx.arc(225, 318, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isCtrlBusActive ? cPurple : (isDark ? '#6b21a8' : '#d8b4fe');
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Signal Line up to ALU from Control Bus
    ctx.beginPath();
    ctx.moveTo(572, 303);
    ctx.lineTo(572, 273);
    ctx.strokeStyle = isCtrlBusActive ? cPurple : cBorder;
    ctx.lineWidth = isCtrlBusActive ? 2.5 : 1;
    ctx.stroke();

    // Connection into RAM Control Receiver
    ctx.beginPath();
    ctx.moveTo(745, 318);
    ctx.lineTo(756, 318);
    ctx.strokeStyle = isCtrlBusActive ? cPurple : cBorder;
    ctx.lineWidth = isCtrlBusActive ? 3.5 : 1.5;
    ctx.stroke();

    // Sliding Control Pulse Capsule
    if (isCtrlBusActive) {
      const glideT = (animTime * 1.3) % 1;
      let px, py;
      if (glideT < 0.2) {
        // Travel up from CU
        const t = glideT / 0.2;
        px = 225;
        py = 365 - t * 47;
      } else {
        // Travel across Control Bus to RAM
        const t = (glideT - 0.2) / 0.8;
        px = 225 + t * 520;
        py = 318;
      }
      drawCapsulePacket(ctx, px, py, currStep.busControlVal || 'MEM_READ', cPurple);
    }

    ctx.restore();
  }

  // Draw 3D-styled Data Capsule Packet
  function drawCapsulePacket(ctx, x, y, label, color) {
    ctx.save();
    ctx.font = 'bold 9.5px JetBrains Mono, monospace';
    const textW = Math.max(ctx.measureText(label).width + 14, 38);
    const capH = 18;
    const rx = x - textW / 2;
    const ry = y - capH / 2;

    drawRoundRect(ctx, rx, ry, textW, capH, 9);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);

    ctx.restore();
  }
  // Render Mini Step Flow Widget (From Concept Art)
  function renderMiniStepFlow(step) {
    const container = document.getElementById('miniStepFlowWidget');
    if (!container || !step) return;

    const pcStr = fdeState.pc.toString().padStart(2, '0');
    const marStr = fdeState.mar;
    const mdrStr = fdeState.mdr;
    let html = '';

    if (step.stage === 'FETCH') {
      if (step.activeElements && step.activeElements.internalWire === 'wirePCtoMAR') {
        // Fetch 1: PC -> MAR
        html = `
          <div class="mini-flow-node highlight-gold"><span class="mini-flow-node-tag">PC</span><span class="mini-flow-node-val">${pcStr}</span></div>
          <div class="mini-flow-wire"><span class="mini-flow-packet">${pcStr}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-gold"><span class="mini-flow-node-tag">MAR</span><span class="mini-flow-node-val">${pcStr}</span></div>
        `;
      } else if (step.isIncrement) {
        // Fetch 3: PC = PC + 1
        const oldPc = Math.max(0, fdeState.pc - 1).toString().padStart(2, '0');
        html = `
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">PC (Old)</span><span class="mini-flow-node-val">${oldPc}</span></div>
          <div class="mini-flow-wire wire-teal"><span class="mini-flow-packet">+1 (INC)</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">PC (New)</span><span class="mini-flow-node-val">${pcStr}</span></div>
        `;
      } else {
        // Fetch 2: RAM -> MDR
        html = `
          <div class="mini-flow-node highlight-gold"><span class="mini-flow-node-tag">MAR</span><span class="mini-flow-node-val">${marStr}</span></div>
          <div class="mini-flow-wire"><span class="mini-flow-packet">ADDR ${marStr}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">RAM</span><span class="mini-flow-node-val">${mdrStr}</span></div>
          <div class="mini-flow-wire wire-teal"><span class="mini-flow-packet">${mdrStr}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">MDR</span><span class="mini-flow-node-val">${mdrStr}</span></div>
        `;
      }
    } else if (step.stage === 'DECODE') {
      html = `
        <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">MDR</span><span class="mini-flow-node-val">${mdrStr}</span></div>
        <div class="mini-flow-wire wire-purple"><span class="mini-flow-packet">OPCODE</span></div>
        <span class="mini-flow-arrow">➔</span>
        <div class="mini-flow-node highlight-purple"><span class="mini-flow-node-tag">CU</span><span class="mini-flow-node-val">${fdeState.decodedOpcode} ${fdeState.decodedOperand || ''}</span></div>
      `;
    } else if (step.stage === 'EXECUTE') {
      const op = fdeState.decodedOpcode;
      if (op === 'LOAD') {
        html = `
          <div class="mini-flow-node highlight-gold"><span class="mini-flow-node-tag">RAM</span><span class="mini-flow-node-val">${mdrStr}</span></div>
          <div class="mini-flow-wire wire-teal"><span class="mini-flow-packet">${mdrStr}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">MDR</span><span class="mini-flow-node-val">${mdrStr}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">ACC</span><span class="mini-flow-node-val">${fdeState.acc}</span></div>
        `;
      } else if (op === 'ADD' || op === 'SUB') {
        html = `
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">MDR</span><span class="mini-flow-node-val">${mdrStr}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">ALU</span><span class="mini-flow-node-val">${op}</span></div>
          <div class="mini-flow-wire wire-teal"><span class="mini-flow-packet">RESULT</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">ACC</span><span class="mini-flow-node-val">${fdeState.acc}</span></div>
        `;
      } else if (op === 'STORE') {
        html = `
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">ACC</span><span class="mini-flow-node-val">${fdeState.acc}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">MDR</span><span class="mini-flow-node-val">${mdrStr}</span></div>
          <div class="mini-flow-wire"><span class="mini-flow-packet">WRITE</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-gold"><span class="mini-flow-node-tag">RAM</span><span class="mini-flow-node-val">${fdeState.acc}</span></div>
        `;
      } else {
        html = `
          <div class="mini-flow-node highlight-purple"><span class="mini-flow-node-tag">CU</span><span class="mini-flow-node-val">HLT</span></div>
          <div class="mini-flow-wire wire-purple"><span class="mini-flow-packet">HALT_SIG</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-purple"><span class="mini-flow-node-tag">CPU</span><span class="mini-flow-node-val">HALTED</span></div>
        `;
      }
    }

    container.innerHTML = html;
  }

  function updateStepNarrativeDOM() {
    const narrativeStageBadge = document.getElementById('narrativeStageBadge');
    const cycleInstrTag = document.getElementById('cycleInstrTag');
    const narrativeTitle = document.getElementById('narrativeTitle');
    const narrativeBullets = document.getElementById('narrativeBullets');
    const stepCounterBadge = document.getElementById('stepCounterBadge');
    const cycleStatusBadge = document.getElementById('cycleStatusBadge');

    // Phase Pills Sync
    const pillFetch = document.getElementById('phasePillFetch');
    const pillDecode = document.getElementById('phasePillDecode');
    const pillExecute = document.getElementById('phasePillExecute');

    if (fdeState.isInitialState) {
      if (pillFetch && pillDecode && pillExecute) {
        pillFetch.classList.remove('active');
        pillDecode.classList.remove('active');
        pillExecute.classList.remove('active');
      }
      if (narrativeStageBadge) {
        narrativeStageBadge.textContent = 'SYSTEM READY';
        narrativeStageBadge.className = 'stage-badge stage-spec';
      }
      if (cycleInstrTag) {
        cycleInstrTag.textContent = 'Instr: Ready [LOAD 05]';
      }
      if (narrativeTitle) {
        narrativeTitle.textContent = 'Initial State: Program Loaded in RAM';
      }
      if (narrativeBullets) {
        narrativeBullets.innerHTML = `
          <li><strong>Program in RAM:</strong> Instructions (LOAD, ADD, STORE, HLT) and initial variables reside in memory slots 00–07</li>
          <li><strong>Program Counter (PC):</strong> Initialized to address 00 (points to the first instruction to fetch)</li>
          <li><strong>System Buses:</strong> Address Bus, Data Bus, and Control Bus are standing by in idle circuit mode</li>
          <li><strong>Ready to Begin:</strong> Click <strong>"Step Forward"</strong> or <strong>"Play"</strong> to start the Fetch stage</li>
        `;
      }
      if (stepCounterBadge) {
        stepCounterBadge.textContent = 'Ready';
        stepCounterBadge.className = 'badge badge-spec';
      }
      if (cycleStatusBadge) {
        cycleStatusBadge.textContent = 'Cycle 1 • Standby';
      }

      const flowContainer = document.getElementById('miniStepFlowWidget');
      if (flowContainer) {
        flowContainer.innerHTML = `
          <div class="mini-flow-node highlight-gold"><span class="mini-flow-node-tag">START</span><span class="mini-flow-node-val">00</span></div>
          <div class="mini-flow-wire"><span class="mini-flow-packet">READY</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-gold"><span class="mini-flow-node-tag">FETCH 1</span><span class="mini-flow-node-val">PC ➔ MAR</span></div>
        `;
      }
      return;
    }

    const currentStep = fdeState.microSteps[fdeState.currentMicroStepIndex];
    if (!currentStep) return;

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
    if (narrativeBullets) {
      let bHtml = '';
      if (currentStep.bullets && currentStep.bullets.length > 0) {
        bHtml += currentStep.bullets.map(b => `<li>${b}</li>`).join('');
      }
      if (currentStep.examTakeaway) {
        bHtml += `<li class="exam-takeaway">💡 <strong>AQA Key Fact:</strong> ${currentStep.examTakeaway}</li>`;
      }
      narrativeBullets.innerHTML = bHtml;
    }
    if (stepCounterBadge) {
      stepCounterBadge.textContent = `Step ${fdeState.currentMicroStepIndex + 1} of ${fdeState.microSteps.length}`;
      stepCounterBadge.className = 'badge badge-live';
    }
    if (cycleStatusBadge) {
      cycleStatusBadge.textContent = `Cycle ${fdeState.cycleCount} • ${currentStep.stage}`;
    }

    renderMiniStepFlow(currentStep);
  }

  function stepForwardFDE() {
    if (fdeState.isHalted) {
      pauseFDE();
      return;
    }

    if (fdeState.isInitialState) {
      fdeState.isInitialState = false;
      const currentStep = fdeState.microSteps[0];
      if (currentStep) {
        currentStep.action();
      }
      updateRegistersDOM();
      renderRAMTable();
      updateStepNarrativeDOM();
      return;
    }

    // Advance to next microstep
    fdeState.currentMicroStepIndex++;

    // Check if we finished the micro-steps for the current instruction
    if (fdeState.currentMicroStepIndex >= fdeState.microSteps.length) {
      if (fdeState.isHalted) {
        pauseFDE();
        updateRegistersDOM();
        renderRAMTable();
        updateStepNarrativeDOM();
        return;
      }
      // Generate next instruction's micro-steps
      fdeState.cycleCount++;
      fdeState.microSteps = generateMicroStepsForInstruction(fdeState.pc);
      fdeState.currentMicroStepIndex = 0;
    }

    const nextStep = fdeState.microSteps[fdeState.currentMicroStepIndex];
    if (nextStep) {
      nextStep.action();
    }
    updateRegistersDOM();
    renderRAMTable();
    updateStepNarrativeDOM();
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

    // RAM View Format Toggle Buttons (Mnemonic / Hex / Binary)
    const formatButtons = document.querySelectorAll('.format-btn');
    formatButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        formatButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        fdeState.ramViewFormat = btn.getAttribute('data-format') || 'mnemonic';
        renderRAMTable();
      });
    });

    initCanvasMotherboard();
    initComponentInspector();
    resetFDE();
  }

  // =========================================================================
  // 2.5 INTERACTIVE COMPONENT HOVER & CLICK INSPECTOR
  // =========================================================================

  function showInspector(key, mouseX) {
    currentlyInspectedKey = key;
    const card = document.getElementById('componentInspectorCard');
    const iconEl = document.getElementById('inspectorIcon');
    const nameEl = document.getElementById('inspectorName');
    const nickEl = document.getElementById('inspectorNickname');
    const bulletsEl = document.getElementById('inspectorBullets');
    const valEl = document.getElementById('inspectorLiveValue');

    if (!card) return;
    const data = COMPONENT_DETAILS[key];
    if (!data) return;

    if (iconEl) iconEl.textContent = data.icon;
    if (nameEl) nameEl.textContent = data.name;
    if (nickEl) nickEl.textContent = `"${data.nickname}"`;
    if (bulletsEl) {
      if (data.bullets && data.bullets.length > 0) {
        bulletsEl.innerHTML = data.bullets.map(b => `<li>${b}</li>`).join('');
      } else {
        bulletsEl.innerHTML = '';
      }
    }
    if (valEl) valEl.textContent = data.getValue();

    if (mouseX !== undefined && mouseX !== null) {
      if (mouseX > 530) {
        card.style.left = '16px';
        card.style.right = 'auto';
      } else {
        card.style.right = '16px';
        card.style.left = 'auto';
      }
    }

    card.style.display = 'block';
  }

  function hideInspector() {
    currentlyInspectedKey = null;
    const card = document.getElementById('componentInspectorCard');
    if (card) card.style.display = 'none';
  }

  function initComponentInspector() {
    const card = document.getElementById('componentInspectorCard');
    const closeBtn = document.getElementById('closeInspectorBtn');

    if (closeBtn) {
      closeBtn.addEventListener('click', hideInspector);
    }

    document.querySelectorAll('[data-inspect]').forEach(el => {
      const key = el.getAttribute('data-inspect');
      el.addEventListener('mouseenter', () => showInspector(key));
      el.addEventListener('mouseleave', () => hideInspector());
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        showInspector(key);
      });
    });

    document.addEventListener('click', (e) => {
      if (card && !card.contains(e.target) && !e.target.closest('[data-inspect]')) {
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
