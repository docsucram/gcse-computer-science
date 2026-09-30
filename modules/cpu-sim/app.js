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
    custom: {
      name: 'Custom User Programme',
      desc: 'User-configured assembly instructions and memory data',
      ram: [
        { addr: '00', val: 'LOAD 05', type: 'Instruction' },
        { addr: '01', val: 'ADD 06',  type: 'Instruction' },
        { addr: '02', val: 'STORE 07',type: 'Instruction' },
        { addr: '03', val: 'HLT',     type: 'Instruction' },
        { addr: '04', val: '0',       type: 'Empty' },
        { addr: '05', val: '10',      type: 'Data' },
        { addr: '06', val: '5',       type: 'Data' },
        { addr: '07', val: '0',       type: 'Result' }
      ]
    },
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
    cycleCount: 1,
    prevRegisters: { pc: null, mar: null, mdr: null, cir: null, acc: null }
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
        '<strong>Passes instructions to CIR</strong> and numerical data to ALU / ACC'
      ],
      getValue: () => `Contents: "${fdeState.mdr}"`
    },
    cir: {
      name: 'Current Instruction Register (CIR)',
      nickname: 'The Active Instruction',
      icon: '📋',
      bullets: [
        '<strong>Holds active instruction</strong> while being decoded and executed',
        '<strong>Receives instruction from MDR</strong> immediately after the fetch',
        '<strong>Splits into Opcode</strong> (what to do) and <strong>Operand</strong> (data/address)'
      ],
      getValue: () => `Instruction: "${fdeState.cir}"`
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
        '<strong>Unidirectional highway</strong>: Carries addresses from PC & MAR to RAM',
        '<strong>Points to memory slot</strong> to read instructions or store data',
        '<strong>Width determines</strong> maximum memory capacity (2ⁿ locations)'
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
    const steps = [];
    const ramEntry = fdeState.ram[pcVal] || { addr: pcVal.toString().padStart(2, '0'), val: 'HLT', type: 'Instruction' };
    const parts = ramEntry.val.trim().split(/\s+/);
    const opcode = parts[0].toUpperCase();
    const operand = parts[1] !== undefined ? parts[1].padStart(2, '0') : '';
    const pcStr = pcVal.toString().padStart(2, '0');
    const nextPcVal = (pcVal + 1) % 32;
    const nextPcStr = nextPcVal.toString().padStart(2, '0');
    const instrDisplay = `${opcode} ${operand}`.trim();

    // STEP 1: Fetch 1 (PC -> Address Bus -> MAR)
    steps.push({
      stage: 'FETCH',
      title: 'Fetch 1: Copy PC Address to MAR',
      instrTag: instrDisplay,
      bullets: [
        `<strong>Address Bus:</strong> Address ${pcStr} is sent across the Address Bus into the Memory Address Register (MAR).`,
        `<strong>MAR Armed:</strong> Holds address ${pcStr} of the next instruction or value to be fetched or stored.`
      ],
      examTakeaway: 'The address held in the Program Counter (PC) is copied to the Memory Address Register (MAR) via the Address Bus.',
      activeElements: { source: 'regPC', target: 'regMAR', bus: 'busAddress' },
      action: () => {
        fdeState.mar = pcStr;
        fdeState.decodedOpcode = '---';
        fdeState.decodedOperand = '';
      }
    });

    // STEP 2: Fetch 2 (RAM Lookup & Copy to MDR)
    steps.push({
      stage: 'FETCH',
      title: 'Fetch 2: RAM Lookup & Copy to MDR',
      instrTag: instrDisplay,
      bullets: [
        `<strong>Address Bus:</strong> Sends memory address ${pcStr} from MAR to RAM.`,
        '<strong>Control Bus:</strong> Control Unit sends MEM_READ command across Control Bus to RAM.',
        `<strong>Data Bus:</strong> RAM retrieves "${ramEntry.val}" and returns it down the Data Bus into the Memory Data Register (MDR).`,
        '<strong>MDR Buffer:</strong> Holds values and instructions ready for CPU processing.'
      ],
      examTakeaway: 'The instruction at the address in MAR is sent along the Data Bus and stored in the Memory Data Register (MDR).',
      activeElements: { source: 'regMAR', intermediate: 'regMDR', target: 'regMDR', bus: 'busAddress', secondaryBus: 'busData', ramRow: pcStr },
      busAddressVal: `Addr: ${pcStr}`,
      busDataVal: `${ramEntry.val}`,
      busControlVal: 'MEM_READ',
      packetDir: { bus: 'address', dir: 'to-ram', val: pcStr },
      action: () => {
        fdeState.mdr = ramEntry.val;
      }
    });

    // STEP 3: Fetch 3 (PC Increment: PC = PC + 1)
    steps.push({
      stage: 'FETCH',
      title: 'Fetch 3: Program Counter Increments (PC ← PC + 1)',
      instrTag: instrDisplay,
      bullets: [
        `<strong>Control Signal:</strong> Control Unit pulses internal timing signal to advance the Program Counter.`,
        `<strong>PC Advances:</strong> Program Counter increments by 1 (${pcStr} ➔ ${nextPcStr}).`,
        '<strong>Ready for Next Cycle:</strong> Ensures the CPU is prepared to fetch the next sequential instruction.'
      ],
      examTakeaway: 'Before completing the Fetch stage, the Program Counter is incremented by 1 (PC ← PC + 1).',
      activeElements: { source: 'cuBlock', target: 'regPC', bus: 'busControl' },
      busControlVal: 'INC_PC',
      isIncrement: true,
      action: () => {
        fdeState.pc = nextPcVal;
      }
    });

    // STEP 4: Decode 1 (Copy Instruction from MDR to CIR)
    steps.push({
      stage: 'DECODE',
      title: 'Decode 1: Copy Instruction from MDR to CIR',
      instrTag: instrDisplay,
      bullets: [
        `<strong>Instruction Copied:</strong> The instruction in the MDR ("${ramEntry.val}") is copied into the Current Instruction Register (CIR).`,
        '<strong>MDR Ready:</strong> This frees up the MDR so it can be used to hold data during the upcoming Execute stage.'
      ],
      examTakeaway: 'Syllabus Note: In OCR & advanced architectures, the CIR holds the instruction. For AQA GCSE, you only need to know that the instruction is decoded by the Control Unit.',
      activeElements: { source: 'regMDR', target: 'regCIR', internalWire: 'wireMDRtoCIR' },
      action: () => {
        fdeState.cir = ramEntry.val;
      }
    });

    // STEP 5: Decode 2 (Control Unit Decodes Instruction in CIR)
    let decodeMeaning = '';
    if (opcode === 'LOAD') {
      decodeMeaning = `LOAD the value stored at memory address ${operand} into the Accumulator.`;
    } else if (opcode === 'ADD') {
      decodeMeaning = `ADD the value stored at memory address ${operand} to the value currently in the Accumulator.`;
    } else if (opcode === 'SUB') {
      decodeMeaning = `SUBTRACT the value stored at memory address ${operand} from the value in the Accumulator.`;
    } else if (opcode === 'STORE') {
      decodeMeaning = `STORE the value currently in the Accumulator into memory address ${operand}.`;
    } else if (opcode === 'HLT') {
      decodeMeaning = 'HALT (stop) program execution.';
    } else {
      decodeMeaning = `Execute operation ${opcode} with parameter ${operand}.`;
    }

    steps.push({
      stage: 'DECODE',
      title: 'Decode 2: Control Unit Decodes Instruction',
      instrTag: instrDisplay,
      bullets: [
        `<strong>Decoding:</strong> The Control Unit decodes ${instrDisplay}.`,
        `<strong>Meaning:</strong> This means "${decodeMeaning}"`,
        '<strong>Control Signals:</strong> The Control Unit prepares the internal execution circuits and buses.'
      ],
      examTakeaway: 'The Control Unit (CU) decodes the instruction to determine what operation to perform and which memory address to access.',
      activeElements: { source: 'regCIR', target: 'cuBlock' },
      busControlVal: 'DECODE_OP',
      action: () => {
        fdeState.decodedOpcode = opcode;
        fdeState.decodedOperand = operand;
      }
    });

    // STEP 6: Execute Stage
    if (opcode === 'LOAD') {
      const dataVal = fdeState.ram[parseInt(operand, 10)]?.val || '0';
      steps.push({
        stage: 'EXECUTE',
        title: `Execute: Load Value from RAM Address ${operand} into ACC`,
        instrTag: instrDisplay,
        bullets: [
          `<strong>Address Sent:</strong> MAR sends address ${operand} along Address Bus to RAM; Control Unit signals MEM_READ.`,
          `<strong>Data Retrieved:</strong> Value ${dataVal} travels across Data Bus into the Memory Data Register (MDR).`,
          `<strong>Stored in ACC:</strong> Value ${dataVal} is copied from MDR directly into the Accumulator (ACC).`
        ],
        examTakeaway: 'Data at the specified memory address is fetched via MDR and copied into the Accumulator (ACC).',
        activeElements: { source: 'regMAR', intermediate: 'regMDR', target: 'regACC', bus: 'busAddress', secondaryBus: 'busData', ramRow: operand },
        busAddressVal: `Addr: ${operand}`,
        busDataVal: `${dataVal}`,
        busControlVal: 'MEM_READ',
        packetDir: { bus: 'data', dir: 'to-cpu', val: dataVal },
        action: () => {
          fdeState.mar = operand;
          fdeState.mdr = dataVal;
          fdeState.acc = parseInt(dataVal, 10) || 0;
        }
      });
    } else if (opcode === 'ADD') {
      const addOperandVal = parseInt(fdeState.ram[parseInt(operand, 10)]?.val || '0', 10);
      steps.push({
        stage: 'EXECUTE',
        title: `Execute: ALU Adds Memory Value (${addOperandVal}) to Accumulator`,
        instrTag: instrDisplay,
        bullets: [
          `<strong>Data Retrieved:</strong> Value ${addOperandVal} is fetched from RAM address ${operand} into the MDR.`,
          `<strong>ALU Calculation:</strong> The ALU adds MDR (${addOperandVal}) to existing ACC (${fdeState.acc}) to get ${fdeState.acc + addOperandVal}.`,
          `<strong>Total Saved:</strong> The result (${fdeState.acc + addOperandVal}) is stored back in the Accumulator (ACC).`
        ],
        examTakeaway: 'The ALU adds the MDR contents to the Accumulator (ACC) and stores the result back in ACC.',
        activeElements: { source: 'regMAR', intermediate: 'regMDR', secondaryTarget: 'aluBlock', target: 'regACC', bus: 'busAddress', secondaryBus: 'busData', ramRow: operand },
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
          `<strong>Data Retrieved:</strong> Value ${subOperandVal} is fetched from RAM address ${operand} into the MDR.`,
          `<strong>ALU Calculation:</strong> The ALU subtracts MDR (${subOperandVal}) from existing ACC (${fdeState.acc}) to get ${fdeState.acc - subOperandVal}.`,
          `<strong>Total Saved:</strong> The result (${fdeState.acc - subOperandVal}) is stored back in the Accumulator (ACC).`
        ],
        examTakeaway: 'The ALU subtracts the MDR contents from the Accumulator (ACC) and stores the result back in ACC.',
        activeElements: { source: 'regMAR', intermediate: 'regMDR', secondaryTarget: 'aluBlock', target: 'regACC', bus: 'busAddress', secondaryBus: 'busData', ramRow: operand },
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
          `<strong>Target Address:</strong> MAR is set to address ${operand} via the Address Bus.`,
          `<strong>Data Prepared:</strong> The Accumulator value (${fdeState.acc}) is copied into the MDR.`,
          `<strong>Written to Memory:</strong> Control Unit sends MEM_WRITE signal; ${fdeState.acc} is stored in RAM slot ${operand}.`
        ],
        examTakeaway: 'The contents of the Accumulator (ACC) are copied to MDR and written to the address in MAR.',
        activeElements: { source: 'regACC', intermediate: 'regMDR', secondaryTarget: 'regMAR', target: `ram-row-${operand}`, bus: 'busAddress', secondaryBus: 'busData', ramRow: operand },
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
          '<strong>Halt Signal:</strong> Control Unit sends HALT command signal across the Control Bus.',
          '<strong>Execution Stopped:</strong> The Fetch-Decode-Execute cycle completes and stops.',
          '<strong>Final State Saved:</strong> Results remain safely stored in memory and registers.'
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
    fdeHistory.length = 0;
    updateStepBackButton();
    const prog = BASE_PROGRAMS[fdeState.selectedProgram] || BASE_PROGRAMS.add;
    fdeState.ram = build32CellRAM(prog.ram);
    fdeState.isInitialState = true;
    fdeState.pc = 0;
    fdeState.mar = '00';
    fdeState.mdr = '---';
    fdeState.cir = '---';
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

    const cirDen = fdeState.cir || '---';
    const cirHex = '---';

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
    checkAndUpdateRow('regRowCIR', 'regDenCIR', 'regHexCIR', cirDen, cirHex, 'cir', fdeState.cir);
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
      { key: 'pc',          x: 30,  y: 42,  w: 96,  h: 96 },
      { key: 'mar',         x: 138, y: 42,  w: 96,  h: 96 },
      { key: 'mdr',         x: 246, y: 42,  w: 96,  h: 96 },
      { key: 'cir',         x: 354, y: 42,  w: 96,  h: 96 },
      { key: 'acc',         x: 462, y: 42,  w: 96,  h: 96 },
      { key: 'alu',         x: 578, y: 42,  w: 150, h: 96 },
      { key: 'cu',          x: 30,  y: 360, w: 500, h: 135 },
      { key: 'bus-address', x: 88,  y: 181, w: 672, h: 28 },
      { key: 'bus-data',    x: 294, y: 236, w: 466, h: 28 },
      { key: 'bus-control', x: 54,  y: 291, w: 706, h: 28 },
      { key: 'ram',         x: 760, y: 15,  w: 280, h: 490 }
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

    let lastTimestamp = performance.now();

    function loop(now) {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      let speedMult = 1.0;
      if (fdeState.playSpeedMs >= 1800) speedMult = 0.58;
      else if (fdeState.playSpeedMs <= 600) speedMult = 1.9;

      animTime += (dt / 2.8) * speedMult;
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

    // Clean substrate fill (no nested border lines)
    ctx.fillStyle = cBgRoot;
    ctx.fillRect(0, 0, 1060, 520);

    const isInitial = fdeState.isInitialState;
    const currStep = isInitial ? {} : (fdeState.microSteps[fdeState.currentMicroStepIndex] || {});
    const act = currStep.activeElements || {};
    const hasFocus = !isInitial && !!currStep.stage;

    // Component Active State Check
    const isNodeActive = (key) => {
      if (isInitial || !currStep.stage) return false;
      if (act.source === key || act.target === key || act.secondaryTarget === key || act.intermediate === key) return true;
      if (key === 'regPC' && currStep.isIncrement) return true;
      if (key === 'cuBlock' && (currStep.stage === 'DECODE' || !!currStep.busControlVal)) return true;
      if (key === 'regMDR' && (act.bus === 'busData' || act.secondaryBus === 'busData')) return true;
      return false;
    };

    // Dim opacity in focus mode (Initial state is always 100% visible)
    const getDimAlpha = (isActive) => (isInitial ? 1.0 : (hasFocus ? (isActive ? 1.0 : 0.32) : 1.0));

    // Smooth gliding progress with destination latch/dwell
    function getGlideProgress(timeVal) {
      const cycleT = timeVal % 1;
      if (cycleT < 0.78) {
        const u = cycleT / 0.78;
        const eased = u * u * (3 - 2 * u);
        return { progress: eased, isArrived: false, pulse: 0 };
      } else {
        const dwellT = (cycleT - 0.78) / 0.22;
        const pulse = Math.sin(dwellT * Math.PI);
        return { progress: 1.0, isArrived: true, pulse };
      }
    }

    // =========================================================================
    // 1. CPU HARDWARE ZONE (Left & Center - No nested cages)
    // =========================================================================
    ctx.save();
    ctx.globalAlpha = 1.0;

    // Subtle dashed CPU boundary label
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextSecondary;
    ctx.textAlign = 'left';
    ctx.fillText('CENTRAL PROCESSING UNIT (CPU CORE)', 30, 28);

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'right';
    ctx.fillText('Internal Architecture', 730, 28);

    // Subtle hairline divider between CPU zone and RAM
    ctx.beginPath();
    ctx.moveTo(742, 15);
    ctx.lineTo(742, 505);
    ctx.strokeStyle = cBorder;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // -------------------------------------------------------------------------
    // 1.1 SPACIOUS REGISTER BANK (Top Row: PC, MAR, MDR, CIR, ACC)
    // -------------------------------------------------------------------------
    const REG_LIST = [
      { id: 'regPC',  x: 30,  w: 96, pinX: 88,  pinCtrlX: 54, tag: 'PC',  name: 'Prog Counter',  color: cAmber,   val: fdeState.pc.toString().padStart(2, '0') },
      { id: 'regMAR', x: 138, w: 96, pinX: 186, tag: 'MAR', name: 'Mem Address',   color: cAmber,   val: fdeState.mar },
      { id: 'regMDR', x: 246, w: 96, pinX: 294, tag: 'MDR', name: 'Mem Data',      color: cEmerald, val: fdeState.mdr },
      { id: 'regCIR', x: 354, w: 96, pinX: 402, tag: 'CIR', name: 'Current Instr', color: cPurple,  val: fdeState.cir || '---' },
      { id: 'regACC', x: 462, w: 96, pinX: 510, tag: 'ACC', name: 'Accumulator',   color: cPink,    val: fdeState.acc.toString() }
    ];

    for (const reg of REG_LIST) {
      const active = isNodeActive(reg.id);
      const isInc = reg.id === 'regPC' && currStep.isIncrement;
      ctx.globalAlpha = getDimAlpha(active || isInc);

      // Register Card Box
      drawRoundRect(ctx, reg.x, 42, reg.w, 96, 8);
      ctx.fillStyle = active || isInc
        ? (isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(56, 189, 248, 0.12)')
        : cCardBg;
      ctx.fill();

      ctx.lineWidth = active || isInc ? 2.5 : 1.5;
      ctx.strokeStyle = isInc ? cEmerald : (active ? reg.color : cBorder);
      if (active || isInc) {
        ctx.shadowColor = isInc ? cEmerald : reg.color;
        ctx.shadowBlur = 12;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Color accent tab
      ctx.beginPath();
      ctx.moveTo(reg.x + 3, 47);
      ctx.lineTo(reg.x + 3, 72);
      ctx.strokeStyle = reg.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Tag
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillStyle = reg.color;
      ctx.textAlign = 'left';
      ctx.fillText(reg.tag, reg.x + 10, 60);

      // Name
      ctx.font = '8.5px Inter, system-ui, sans-serif';
      ctx.fillStyle = cTextMuted;
      ctx.textAlign = 'right';
      ctx.fillText(reg.name, reg.x + reg.w - 8, 60);

      // Big Value
      ctx.font = 'bold 14px JetBrains Mono, monospace';
      ctx.fillStyle = active || isInc ? reg.color : cTextPrimary;
      ctx.textAlign = 'center';
      const maxValW = reg.w - 16;
      let displayVal = reg.val;
      if (ctx.measureText(displayVal).width > maxValW) {
        displayVal = displayVal.slice(0, 8) + '..';
      }
      ctx.fillText(displayVal, reg.x + reg.w / 2, 92);

      // Status badge or role
      if (isInc) {
        drawRoundRect(ctx, reg.x + 16, 108, 64, 16, 3);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.fill();
        ctx.font = 'bold 8px JetBrains Mono, monospace';
        ctx.fillStyle = cEmerald;
        ctx.fillText('+1 (Next)', reg.x + reg.w / 2, 119);
      } else {
        ctx.font = '8px JetBrains Mono, monospace';
        ctx.fillStyle = cTextMuted;
        ctx.fillText(reg.id === 'regPC' ? 'Pointer' : (reg.id === 'regMAR' ? 'Address' : (reg.id === 'regMDR' ? 'Buffer' : (reg.id === 'regCIR' ? 'Active' : 'Working'))), reg.x + reg.w / 2, 118);
      }

      // Pin terminal dots at bottom of Register
      if (reg.id === 'regPC') {
        // Dedicated Control Pin (x=54) for INC_PC pulses
        ctx.beginPath();
        ctx.arc(54, 138, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isInc ? cEmerald : cPurple;
        ctx.fill();

        // Dedicated Address Pin (x=88) for Address Bus
        ctx.beginPath();
        ctx.arc(88, 138, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = reg.color;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(reg.pinX, 138, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = reg.color;
        ctx.fill();
      }
    }

    // -------------------------------------------------------------------------
    // 1.2 ARITHMETIC LOGIC UNIT (ALU) (Top Right of CPU zone)
    // -------------------------------------------------------------------------
    const aluActive = isNodeActive('aluBlock');
    ctx.globalAlpha = getDimAlpha(aluActive);

    drawRoundRect(ctx, 578, 42, 150, 96, 8);
    ctx.fillStyle = aluActive ? (isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.12)') : cCardElevated;
    ctx.fill();
    ctx.lineWidth = aluActive ? 2.5 : 1.5;
    ctx.strokeStyle = aluActive ? cEmerald : cBorder;
    if (aluActive) {
      ctx.shadowColor = cEmerald;
      ctx.shadowBlur = 12;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ALU Tag Badge
    drawRoundRect(ctx, 668, 48, 54, 15, 3);
    ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)';
    ctx.fill();
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.fillStyle = cEmerald;
    ctx.textAlign = 'center';
    ctx.fillText('CALCULATOR', 695, 59);

    ctx.font = 'bold 10.5px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextPrimary;
    ctx.textAlign = 'left';
    ctx.fillText('ALU', 588, 60);

    ctx.font = '8.5px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextSecondary;
    ctx.fillText('Math Output:', 588, 80);

    ctx.font = 'bold 16px JetBrains Mono, monospace';
    ctx.fillStyle = aluActive ? cEmerald : cTextPrimary;
    ctx.fillText(fdeState.acc.toString(), 588, 102);

    ctx.font = '8px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextMuted;
    ctx.fillText('Math (+, -) & logic', 588, 122);

    // ALU Data Pin Terminal (connecting to Data Bus) at (630, 138)
    ctx.beginPath();
    ctx.arc(630, 138, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = cEmerald;
    ctx.fill();

    // ALU Control Pin Terminal (connecting to Control Bus) at (680, 138)
    ctx.beginPath();
    ctx.arc(680, 138, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = cPurple;
    ctx.fill();

    // Dedicated Direct Internal Bus Bridge: ACC ⇄ ALU
    const isAccAluActive = aluActive || isNodeActive('regACC');
    ctx.beginPath();
    ctx.moveTo(558, 88);
    ctx.lineTo(578, 88);
    ctx.strokeStyle = isAccAluActive ? cEmerald : cBorder;
    ctx.lineWidth = isAccAluActive ? 3.5 : 2;
    if (isAccAluActive) {
      ctx.shadowColor = cEmerald;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Small ALU ⇄ ACC Bridge Badge
    drawRoundRect(ctx, 552, 80, 32, 14, 3);
    ctx.fillStyle = cCardBg;
    ctx.fill();
    ctx.strokeStyle = isAccAluActive ? cEmerald : cBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = 'bold 7px JetBrains Mono, monospace';
    ctx.fillStyle = isAccAluActive ? cEmerald : cTextMuted;
    ctx.textAlign = 'center';
    ctx.fillText('⇄', 568, 90);

    // -------------------------------------------------------------------------
    // 1.3 CONTROL UNIT (CU) (Bottom Left/Center)
    // -------------------------------------------------------------------------
    const cuActive = isNodeActive('cuBlock');
    ctx.globalAlpha = getDimAlpha(cuActive);

    drawRoundRect(ctx, 30, 360, 500, 135, 10);
    ctx.fillStyle = cuActive ? (isDark ? 'rgba(168, 85, 247, 0.16)' : 'rgba(168, 85, 247, 0.12)') : cCardElevated;
    ctx.fill();
    ctx.lineWidth = cuActive ? 2.5 : 1.5;
    ctx.strokeStyle = cuActive ? cPurple : cBorder;
    if (cuActive) {
      ctx.shadowColor = cPurple;
      ctx.shadowBlur = 12;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // CU Tag Pill
    drawRoundRect(ctx, 452, 368, 68, 18, 4);
    ctx.fillStyle = isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.2)';
    ctx.fill();
    ctx.font = 'bold 8.5px JetBrains Mono, monospace';
    ctx.fillStyle = cPurple;
    ctx.textAlign = 'center';
    ctx.fillText('DECODER', 486, 380);

    // CU Centre of Operations Pill
    drawRoundRect(ctx, 42, 368, 145, 18, 4);
    ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.15)';
    ctx.fill();
    ctx.font = 'bold 8.5px JetBrains Mono, monospace';
    ctx.fillStyle = cBlue;
    ctx.textAlign = 'center';
    ctx.fillText('CENTRE OF OPERATIONS', 114, 380);

    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextPrimary;
    ctx.textAlign = 'left';
    ctx.fillText('Control Unit (CU)', 42, 408);

    ctx.font = '9.5px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextSecondary;
    ctx.fillText('Decoded Instruction & Meaning:', 42, 430);

    ctx.font = 'bold 15px JetBrains Mono, monospace';
    ctx.fillStyle = cuActive ? cPurple : cTextPrimary;
    const cuText = (fdeState.decodedOpcode === '---' || fdeState.decodedOpcode === 'NONE')
      ? 'READY (Waiting for instruction)'
      : `${fdeState.decodedOpcode} ${fdeState.decodedOperand || ''}`;
    ctx.fillText(cuText, 42, 452);

    // Meaning translation
    ctx.font = '9.5px Inter, system-ui, sans-serif';
    ctx.fillStyle = cuActive ? (isDark ? '#c084fc' : '#7e22ce') : cTextMuted;
    let cuMeaning = '• Receives & decodes instructions  • Sends command signals across Control Bus';
    if (fdeState.decodedOpcode === 'LOAD') {
      cuMeaning = `➔ LOAD value at RAM address ${fdeState.decodedOperand} into the Accumulator`;
    } else if (fdeState.decodedOpcode === 'ADD') {
      cuMeaning = `➔ ADD value at RAM address ${fdeState.decodedOperand} to the Accumulator`;
    } else if (fdeState.decodedOpcode === 'SUB') {
      cuMeaning = `➔ SUBTRACT value at RAM address ${fdeState.decodedOperand} from the Accumulator`;
    } else if (fdeState.decodedOpcode === 'STORE') {
      cuMeaning = `➔ STORE value in Accumulator into RAM address ${fdeState.decodedOperand}`;
    } else if (fdeState.decodedOpcode === 'HLT') {
      cuMeaning = '➔ HALT program execution (Stop CPU cycle)';
    }
    ctx.fillText(cuMeaning, 42, 476);

    // Pin connection terminal dot at top of CU (Control Bus tap)
    ctx.beginPath();
    ctx.arc(220, 360, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = cPurple;
    ctx.fill();

    // =========================================================================
    // 2. MAIN MEMORY (RAM) RACK (Right Side)
    // =========================================================================
    ctx.save();
    ctx.globalAlpha = 1.0;

    drawRoundRect(ctx, 760, 15, 280, 490, 12);
    ctx.fillStyle = cCardBg;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = cBorder;
    ctx.stroke();

    // RAM Header
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillStyle = cEmerald;
    ctx.textAlign = 'left';
    ctx.fillText('MAIN MEMORY (RAM)', 775, 36);

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'right';
    ctx.fillText('Slots 00 – 07', 1025, 36);

    // Divider under header
    ctx.beginPath();
    ctx.moveTo(760, 44);
    ctx.lineTo(1040, 44);
    ctx.strokeStyle = cBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Column Headers
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'left';
    ctx.fillText('ADDR', 775, 58);
    ctx.fillText('CONTENT', 835, 58);
    ctx.textAlign = 'right';
    ctx.fillText('TYPE', 1025, 58);

    // 8 Active RAM Slots
    const targetAddrStr = act.ramRow ? act.ramRow.toString().padStart(2, '0') : null;
    let ramTargetY = 70 + 21;

    for (let i = 0; i < 8; i++) {
      const row = fdeState.ram[i] || { addr: i.toString().padStart(2, '0'), val: '0', type: 'Empty' };
      const rowY = 66 + i * 48;
      const isRowActive = !isInitial && targetAddrStr === row.addr;
      const isWrite = isRowActive && currStep.stage === 'EXECUTE' && currStep.busControlVal === 'MEM_WRITE';

      if (isRowActive) ramTargetY = rowY + 21;

      ctx.globalAlpha = getDimAlpha(isRowActive);

      drawRoundRect(ctx, 768, rowY, 264, 42, 6);
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
      ctx.fillText(row.addr, 778, rowY + 25);

      // Formatted Value
      const displayVal = formatRamValue(row.val, row.type, fdeState.ramViewFormat);
      ctx.font = 'bold 11.5px JetBrains Mono, monospace';
      if (row.type === 'Instruction') ctx.fillStyle = isDark ? '#a5b4fc' : '#4f46e5';
      else if (row.type === 'Result') ctx.fillStyle = cEmerald;
      else if (row.type === 'Data')   ctx.fillStyle = cBlue;
      else ctx.fillStyle = cTextMuted;
      ctx.fillText(displayVal, 835, rowY + 25);

      // Type Badge
      drawRoundRect(ctx, 982, rowY + 12, 42, 18, 4);
      ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = cBorder;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 7.5px JetBrains Mono, monospace';
      ctx.fillStyle = row.type === 'Instruction' ? '#818cf8' : (row.type === 'Result' ? cEmerald : (row.type === 'Data' ? cBlue : cTextMuted));
      ctx.textAlign = 'center';
      ctx.fillText(row.type === 'Instruction' ? 'INSTR' : (row.type === 'Result' ? 'RESULT' : (row.type === 'Data' ? 'DATA' : 'EMPTY')), 1003, rowY + 24);
    }

    ctx.restore();

    // =========================================================================
    // 3. THE 3 SYSTEM BUS HIGHWAY TRUNKS (Center Corridors with Solder Drops)
    // =========================================================================
    ctx.save();

    // -------------------------------------------------------------------------
    // 3.1 ADDRESS BUS TRUNK (Amber: PC ➔ MAR ➔ RAM)
    // -------------------------------------------------------------------------
    const isStep1 = !isInitial && currStep.stage === 'FETCH' && act.target === 'regMAR' && act.source === 'regPC';
    const isStep2 = !isInitial && currStep.stage === 'FETCH' && act.source === 'regMAR';
    const isExecuteAddr = !isInitial && currStep.stage === 'EXECUTE' && (act.bus === 'busAddress' || act.secondaryBus === 'busAddress');
    const isAddrBusActive = isStep1 || isStep2 || isExecuteAddr;

    ctx.globalAlpha = getDimAlpha(isAddrBusActive);

    // Highway Corridor Ribbon
    drawRoundRect(ctx, 88, 181, 672, 28, 6);
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

    // Center conductive copper trace across whole Address Bus
    ctx.beginPath();
    ctx.moveTo(88, 195);
    ctx.lineTo(760, 195);
    ctx.strokeStyle = isAddrBusActive ? cAmber : (isDark ? '#785315' : '#fcd34d');
    ctx.lineWidth = isAddrBusActive ? 3.5 : 2;
    ctx.stroke();

    // Direction arrows along Address Bus
    ctx.font = 'bold 8.5px JetBrains Mono, monospace';
    ctx.fillStyle = isAddrBusActive ? cAmber : cTextMuted;
    ctx.textAlign = 'center';
    ctx.fillText('▶   ▶   ▶   ▶   ▶   ▶   ▶', 424, 192);

    // Highway Ribbon Label
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.fillText('ADDRESS BUS (Unidirectional • PC / MAR ➔ RAM)', 424, 204);

    // Live Readout at right end
    ctx.textAlign = 'right';
    ctx.fillText(isAddrBusActive ? `ADDR: ${fdeState.mar}` : 'ADDR BUS', 750, 200);

    // PC Branch Drop-Line (Vertical from PC pin down to Address Bus)
    ctx.beginPath();
    ctx.moveTo(88, 138);
    ctx.lineTo(88, 195);
    ctx.strokeStyle = isStep1 ? cAmber : (isAddrBusActive ? cAmber : cBorder);
    ctx.lineWidth = isStep1 ? 3.5 : 2;
    if (isStep1) {
      ctx.shadowColor = cAmber;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Solder T-junction dot at PC tap (x=88, y=195)
    ctx.beginPath();
    ctx.arc(88, 195, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = (isStep1 || isAddrBusActive) ? cAmber : (isDark ? '#785315' : '#fcd34d');
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // MAR Branch Drop-Line (Vertical from MAR pin down to Address Bus)
    ctx.beginPath();
    ctx.moveTo(186, 138);
    ctx.lineTo(186, 195);
    ctx.strokeStyle = isAddrBusActive ? cAmber : cBorder;
    ctx.lineWidth = isAddrBusActive ? 3.5 : 2;
    if (isAddrBusActive) {
      ctx.shadowColor = cAmber;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Solder T-junction dot at MAR tap (x=186, y=195)
    ctx.beginPath();
    ctx.arc(186, 195, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isAddrBusActive ? cAmber : (isDark ? '#785315' : '#fcd34d');
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // RAM Address Dock Port at (760, 195)
    ctx.beginPath();
    ctx.arc(760, 195, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = (isStep2 || isExecuteAddr) ? cAmber : cBorder;
    ctx.fill();
    ctx.stroke();

    // --- ANIMATION: STEP 1 (PC ➔ MAR along Address Bus) ---
    if (isStep1) {
      const g = getGlideProgress(animTime);
      let px, py;
      const pcStr = fdeState.pc.toString().padStart(2, '0');

      if (g.progress <= 0.25) {
        const t = g.progress / 0.25;
        px = 88;
        py = 138 + t * 57;
      } else if (g.progress <= 0.75) {
        const t = (g.progress - 0.25) / 0.50;
        px = 88 + t * 98;
        py = 195;
      } else {
        const t = (g.progress - 0.75) / 0.25;
        px = 186;
        py = 195 - t * 57;
      }
      drawCapsulePacket(ctx, px, py, pcStr, cAmber, g.isArrived);
    }

    // --- ANIMATION: STEP 2 or EXECUTE (MAR ➔ RAM along Address Bus) ---
    if (isStep2 || isExecuteAddr) {
      ctx.beginPath();
      ctx.moveTo(760, 195);
      ctx.bezierCurveTo(764, 195, 766, ramTargetY, 768, ramTargetY);
      ctx.strokeStyle = cAmber;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = cAmber;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const g = getGlideProgress(animTime);
      let px, py;
      if (g.progress <= 0.15) {
        const t = g.progress / 0.15;
        px = 186;
        py = 138 + t * 57;
      } else if (g.progress <= 0.85) {
        const t = (g.progress - 0.15) / 0.70;
        px = 186 + t * 574;
        py = 195;
      } else {
        const t = (g.progress - 0.85) / 0.15;
        px = 760 + t * 8;
        py = (1 - t) * 195 + t * ramTargetY;
      }
      drawCapsulePacket(ctx, px, py, fdeState.mar, cAmber, g.isArrived);
    }

    // -------------------------------------------------------------------------
    // 3.2 DATA BUS TRUNK (Emerald: Bidirectional MDR ⇄ RAM ⇄ ALU)
    // -------------------------------------------------------------------------
    const isDataBusActive = !isInitial && (act.bus === 'busData' || act.secondaryBus === 'busData');
    ctx.globalAlpha = getDimAlpha(isDataBusActive);

    drawRoundRect(ctx, 294, 236, 466, 28, 6);
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
    ctx.moveTo(294, 250);
    ctx.lineTo(760, 250);
    ctx.strokeStyle = isDataBusActive ? cEmerald : (isDark ? '#1b5e39' : '#6ee7b7');
    ctx.lineWidth = isDataBusActive ? 3.5 : 2;
    ctx.stroke();

    // Bidirectional arrows along Data Bus
    ctx.font = 'bold 8.5px JetBrains Mono, monospace';
    ctx.fillStyle = isDataBusActive ? cEmerald : cTextMuted;
    ctx.textAlign = 'center';
    ctx.fillText('◀ ◀ ◀   ▶ ▶ ▶', 525, 247);

    // Highway Ribbon Label
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.fillText('DATA BUS (Bidirectional • MDR ⇄ RAM ⇄ ALU)', 525, 259);

    // Live Readout at right end
    ctx.textAlign = 'right';
    ctx.fillText(isDataBusActive ? `DATA: "${fdeState.mdr}"` : 'DATA BUS', 750, 255);

    // MDR Branch Drop-Line (Vertical from MDR pin down to Data Bus)
    ctx.beginPath();
    ctx.moveTo(294, 138);
    ctx.lineTo(294, 250);
    ctx.strokeStyle = isDataBusActive ? cEmerald : cBorder;
    ctx.lineWidth = isDataBusActive ? 3.5 : 2;
    if (isDataBusActive) {
      ctx.shadowColor = cEmerald;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Solder T-junction dot at MDR tap (294, 250)
    ctx.beginPath();
    ctx.arc(294, 250, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isDataBusActive ? cEmerald : (isDark ? '#1b5e39' : '#6ee7b7');
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ALU Branch Drop-Line (Vertical from ALU Data pin down to Data Bus)
    ctx.beginPath();
    ctx.moveTo(630, 138);
    ctx.lineTo(630, 250);
    ctx.strokeStyle = isDataBusActive ? cEmerald : cBorder;
    ctx.lineWidth = isDataBusActive ? 3.5 : 2;
    if (isDataBusActive) {
      ctx.shadowColor = cEmerald;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Solder T-junction dot at ALU tap (630, 250)
    ctx.beginPath();
    ctx.arc(630, 250, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isDataBusActive ? cEmerald : (isDark ? '#1b5e39' : '#6ee7b7');
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // RAM Data Dock Port at (760, 250)
    ctx.beginPath();
    ctx.arc(760, 250, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isDataBusActive ? cEmerald : cBorder;
    ctx.fill();
    ctx.stroke();

    // --- DECODE 1: MDR ➔ CIR Direct Transfer Bridge ---
    const isDecode1Active = !isInitial && currStep.stage === 'DECODE' && act.target === 'regCIR';
    ctx.beginPath();
    ctx.moveTo(342, 88);
    ctx.lineTo(354, 88);
    ctx.strokeStyle = isDecode1Active ? cPurple : cBorder;
    ctx.lineWidth = isDecode1Active ? 3.5 : 1.5;
    if (isDecode1Active) {
      ctx.shadowColor = cPurple;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (isDecode1Active) {
      const g = getGlideProgress(animTime);
      const px = 294 + g.progress * 108;
      drawCapsulePacket(ctx, px, 88, fdeState.mdr, cPurple, g.isArrived);
    }

    // --- DECODE 2: CIR ➔ CU Decoder Line ---
    const isDecode2Active = !isInitial && currStep.stage === 'DECODE' && act.source === 'regCIR';
    ctx.beginPath();
    ctx.moveTo(402, 138);
    ctx.lineTo(402, 360);
    ctx.strokeStyle = isDecode2Active ? cPurple : cBorder;
    ctx.lineWidth = isDecode2Active ? 3.5 : 1.5;
    if (isDecode2Active) {
      ctx.shadowColor = cPurple;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Solder dot at CU decoder terminal
    ctx.beginPath();
    ctx.arc(402, 360, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = isDecode2Active ? cPurple : cBorder;
    ctx.fill();

    // Opcode label on decoder line
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.fillStyle = isDecode2Active ? cPurple : cTextMuted;
    ctx.textAlign = 'left';
    ctx.fillText('CIR to CU Decoder ➔', 408, 335);

    if (isDecode2Active) {
      const g = getGlideProgress(animTime);
      const py = 138 + g.progress * 222;
      drawCapsulePacket(ctx, 402, py, fdeState.cir || fdeState.mdr, cPurple, g.isArrived);
    }

    // Trace from Data Bus to Active RAM Row
    if (isDataBusActive) {
      const isMemWrite = currStep.stage === 'EXECUTE' && currStep.busControlVal === 'MEM_WRITE';

      ctx.beginPath();
      ctx.moveTo(760, 250);
      ctx.bezierCurveTo(764, 250, 766, ramTargetY, 768, ramTargetY);
      ctx.strokeStyle = cEmerald;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = cEmerald;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Sliding Data Capsule along Data Bus
      const g = getGlideProgress(animTime);
      const p = isMemWrite ? (1 - g.progress) : g.progress;

      let px, py;
      if (p < 0.15) {
        const t = p / 0.15;
        px = 768 - t * 8;
        py = (1 - t) * ramTargetY + t * 250;
      } else if (p < 0.85) {
        const t = (p - 0.15) / 0.70;
        px = 760 - t * 466;
        py = 250;
      } else {
        const t = (p - 0.85) / 0.15;
        px = 294;
        py = 250 - t * 112;
      }
      drawCapsulePacket(ctx, px, py, fdeState.mdr, cEmerald, g.isArrived);
    }

    // -------------------------------------------------------------------------
    // 3.3 CONTROL BUS TRUNK (Purple: Commands & Timing CU ➔ PC, RAM & ALU)
    // -------------------------------------------------------------------------
    const isCtrlBusActive = !isInitial && !!currStep.busControlVal;
    ctx.globalAlpha = getDimAlpha(isCtrlBusActive);

    // Highway Ribbon Corridor spanning across entire chassis from PC tap (x=54) to RAM dock (x=760)
    drawRoundRect(ctx, 54, 291, 706, 28, 6);
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

    // Center conductive trace across whole Control Bus
    ctx.beginPath();
    ctx.moveTo(54, 305);
    ctx.lineTo(760, 305);
    ctx.strokeStyle = isCtrlBusActive ? cPurple : (isDark ? '#6b21a8' : '#d8b4fe');
    ctx.lineWidth = isCtrlBusActive ? 3.5 : 2;
    ctx.stroke();

    // Pulse markers along Control Bus
    ctx.font = 'bold 8.5px JetBrains Mono, monospace';
    ctx.fillStyle = isCtrlBusActive ? cPurple : cTextMuted;
    ctx.textAlign = 'center';
    ctx.fillText('⚡   ⚡   ⚡   ⚡   ⚡   ⚡   ⚡', 407, 302);

    // Highway Ribbon Label
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.fillText('CONTROL BUS (Commands & Timing • CU ➔ PC, ALU & RAM)', 407, 314);

    // Live Readout at right end
    ctx.textAlign = 'right';
    ctx.fillText(isCtrlBusActive ? `CMD: ${currStep.busControlVal || 'READ'}` : 'CTRL BUS', 750, 310);

    // PC Control Branch (Vertical from PC pin down to Control Bus) - Dedicated track to left of Address Bus!
    const isIncStep = isCtrlBusActive && currStep.busControlVal === 'INC_PC';
    ctx.beginPath();
    ctx.moveTo(54, 138);
    ctx.lineTo(54, 305);
    ctx.strokeStyle = isIncStep ? cPurple : (isCtrlBusActive ? cPurple : cBorder);
    ctx.lineWidth = isIncStep ? 3.5 : (isCtrlBusActive ? 2 : 1.5);
    if (isIncStep) {
      ctx.shadowColor = cPurple;
      ctx.shadowBlur = 12;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Solder T-junction dot at PC Control tap (54, 305)
    ctx.beginPath();
    ctx.arc(54, 305, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isIncStep ? cPurple : (isDark ? '#6b21a8' : '#d8b4fe');
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // CU Branch Tap-Line (Vertical from CU pin up to Control Bus)
    ctx.beginPath();
    ctx.moveTo(220, 360);
    ctx.lineTo(220, 305);
    ctx.strokeStyle = isCtrlBusActive ? cPurple : cBorder;
    ctx.lineWidth = isCtrlBusActive ? 3.5 : 2;
    if (isCtrlBusActive) {
      ctx.shadowColor = cPurple;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Solder T-junction dot at CU tap (220, 305)
    ctx.beginPath();
    ctx.arc(220, 305, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isCtrlBusActive ? cPurple : (isDark ? '#6b21a8' : '#d8b4fe');
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ALU Control Branch (Vertical from ALU pin down to Control Bus)
    const isAluCtrlActive = isCtrlBusActive && ['ADD', 'SUB'].includes(fdeState.decodedOpcode);
    ctx.beginPath();
    ctx.moveTo(680, 138);
    ctx.lineTo(680, 305);
    ctx.strokeStyle = isAluCtrlActive ? cPurple : (isCtrlBusActive ? cPurple : cBorder);
    ctx.lineWidth = isAluCtrlActive ? 3.5 : 1.5;
    ctx.stroke();

    // Solder dot at ALU Control tap (680, 305)
    ctx.beginPath();
    ctx.arc(680, 305, 4, 0, Math.PI * 2);
    ctx.fillStyle = isAluCtrlActive ? cPurple : cBorder;
    ctx.fill();

    // Connection into RAM Control Receiver Dock (760, 305)
    const isRamCtrlActive = isCtrlBusActive && ['MEM_READ', 'MEM_WRITE'].includes(currStep.busControlVal);
    ctx.beginPath();
    ctx.moveTo(760, 305);
    ctx.lineTo(768, 305);
    ctx.strokeStyle = isRamCtrlActive ? cPurple : cBorder;
    ctx.lineWidth = isRamCtrlActive ? 3.5 : 1.5;
    if (isRamCtrlActive) {
      ctx.shadowColor = cPurple;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Solder dot at RAM Control Dock
    ctx.beginPath();
    ctx.arc(760, 305, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isRamCtrlActive ? cPurple : cBorder;
    ctx.fill();
    ctx.stroke();

    // --- ANIMATION: Sliding Control Pulse Capsule ---
    if (isCtrlBusActive) {
      const g = getGlideProgress(animTime);
      let px, py;

      if (currStep.busControlVal === 'INC_PC') {
        // Targeted at PC (x=54, y=138)
        if (g.progress <= 0.20) {
          // 1. Travel UP from CU (220, 360) to Control Bus (220, 305)
          const t = g.progress / 0.20;
          px = 220;
          py = 360 - t * 55;
        } else if (g.progress <= 0.75) {
          // 2. Travel LEFT along Control Bus trunk from 220 to PC branch at 54
          const t = (g.progress - 0.20) / 0.55;
          px = 220 - t * 166;
          py = 305;
        } else {
          // 3. Travel UP the PC Control branch from (54, 305) to PC pin (54, 138)
          const t = (g.progress - 0.75) / 0.25;
          px = 54;
          py = 305 - t * 167;
        }
        drawCapsulePacket(ctx, px, py, 'INC_PC', cPurple, g.isArrived);
      } else {
        // Targeted at RAM (MEM_READ or MEM_WRITE) or ALU
        if (g.progress <= 0.20) {
          const t = g.progress / 0.20;
          px = 220;
          py = 360 - t * 55;
        } else {
          const t = (g.progress - 0.20) / 0.80;
          px = 220 + t * 540;
          py = 305;
        }
        drawCapsulePacket(ctx, px, py, currStep.busControlVal || 'MEM_READ', cPurple, g.isArrived);
      }
    }

    ctx.restore();
  }

    // Draw 3D-styled Data Capsule Packet
  function drawCapsulePacket(ctx, x, y, label, color, isArrived = false) {
    ctx.save();
    ctx.font = 'bold 9.5px JetBrains Mono, monospace';
    const textW = Math.max(ctx.measureText(label).width + 16, 42);
    const capH = 19;
    const rx = x - textW / 2;
    const ry = y - capH / 2;

    ctx.shadowColor = color;
    ctx.shadowBlur = isArrived ? 16 : 10;

    drawRoundRect(ctx, rx, ry, textW, capH, capH / 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = isArrived ? 2 : 1.5;
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
    const cirStr = fdeState.cir || '---';
    let html = '';

    if (step.stage === 'FETCH') {
      if (step.activeElements && step.activeElements.target === 'regMAR' && step.activeElements.source === 'regPC') {
        // Fetch 1: PC -> Address Bus -> MAR
        html = `
          <div class="mini-flow-node highlight-gold"><span class="mini-flow-node-tag">PC</span><span class="mini-flow-node-val">${pcStr}</span></div>
          <div class="mini-flow-wire wire-gold"><span class="mini-flow-packet">ADDR ${pcStr}</span></div>
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
        // Fetch 2: MAR -> RAM -> MDR
        html = `
          <div class="mini-flow-node highlight-gold"><span class="mini-flow-node-tag">MAR</span><span class="mini-flow-node-val">${marStr}</span></div>
          <div class="mini-flow-wire wire-gold"><span class="mini-flow-packet">ADDR ${marStr}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">RAM</span><span class="mini-flow-node-val">${mdrStr}</span></div>
          <div class="mini-flow-wire wire-teal"><span class="mini-flow-packet">${mdrStr}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">MDR</span><span class="mini-flow-node-val">${mdrStr}</span></div>
        `;
      }
    } else if (step.stage === 'DECODE') {
      if (step.activeElements && step.activeElements.target === 'regCIR') {
        // Decode 1: MDR -> CIR
        html = `
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">MDR</span><span class="mini-flow-node-val">${mdrStr}</span></div>
          <div class="mini-flow-wire wire-purple"><span class="mini-flow-packet">${mdrStr}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-purple"><span class="mini-flow-node-tag">CIR</span><span class="mini-flow-node-val">${mdrStr}</span></div>
        `;
      } else {
        // Decode 2: CIR -> CU
        html = `
          <div class="mini-flow-node highlight-purple"><span class="mini-flow-node-tag">CIR</span><span class="mini-flow-node-val">${cirStr}</span></div>
          <div class="mini-flow-wire wire-purple"><span class="mini-flow-packet">OPCODE</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-purple"><span class="mini-flow-node-tag">CU</span><span class="mini-flow-node-val">${fdeState.decodedOpcode} ${fdeState.decodedOperand || ''}</span></div>
        `;
      }
    } else if (step.stage === 'EXECUTE') {
      const op = fdeState.decodedOpcode;
      if (op === 'LOAD') {
        html = `
          <div class="mini-flow-node highlight-gold"><span class="mini-flow-node-tag">RAM</span><span class="mini-flow-node-val">${mdrStr}</span></div>
          <div class="mini-flow-wire wire-teal"><span class="mini-flow-packet">${mdrStr}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">MDR</span><span class="mini-flow-node-val">${mdrStr}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-pink"><span class="mini-flow-node-tag">ACC</span><span class="mini-flow-node-val">${fdeState.acc}</span></div>
        `;
      } else if (op === 'ADD' || op === 'SUB') {
        html = `
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">MDR</span><span class="mini-flow-node-val">${mdrStr}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">ALU</span><span class="mini-flow-node-val">${op}</span></div>
          <div class="mini-flow-wire wire-teal"><span class="mini-flow-packet">RESULT</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-pink"><span class="mini-flow-node-tag">ACC</span><span class="mini-flow-node-val">${fdeState.acc}</span></div>
        `;
      } else if (op === 'STORE') {
        html = `
          <div class="mini-flow-node highlight-pink"><span class="mini-flow-node-tag">ACC</span><span class="mini-flow-node-val">${fdeState.acc}</span></div>
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
          <div class="mini-flow-node highlight-gold"><span class="mini-flow-node-tag">CPU</span><span class="mini-flow-node-val">STOP</span></div>
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

  
  const fdeHistory = [];

  function saveFdeSnapshot() {
    fdeHistory.push({
      pc: fdeState.pc,
      mar: fdeState.mar,
      mdr: fdeState.mdr,
      cir: fdeState.cir,
      acc: fdeState.acc,
      decodedOpcode: fdeState.decodedOpcode,
      decodedOperand: fdeState.decodedOperand,
      currentMicroStepIndex: fdeState.currentMicroStepIndex,
      microSteps: [...fdeState.microSteps],
      cycleCount: fdeState.cycleCount,
      isHalted: fdeState.isHalted,
      isInitialState: fdeState.isInitialState,
      ram: JSON.parse(JSON.stringify(fdeState.ram))
    });
    updateStepBackButton();
  }

  function stepBackFDE() {
    if (fdeHistory.length === 0) return;
    pauseFDE();
    const prev = fdeHistory.pop();
    fdeState.pc = prev.pc;
    fdeState.mar = prev.mar;
    fdeState.mdr = prev.mdr;
    fdeState.cir = prev.cir;
    fdeState.acc = prev.acc;
    fdeState.decodedOpcode = prev.decodedOpcode;
    fdeState.decodedOperand = prev.decodedOperand;
    fdeState.currentMicroStepIndex = prev.currentMicroStepIndex;
    fdeState.microSteps = prev.microSteps;
    fdeState.cycleCount = prev.cycleCount;
    fdeState.isHalted = prev.isHalted;
    fdeState.isInitialState = prev.isInitialState;
    fdeState.ram = prev.ram;

    updateStepBackButton();
    updateRegistersDOM();
    renderRAMTable();
    updateStepNarrativeDOM();
  }

  function updateStepBackButton() {
    const btn = document.getElementById('fdeStepBackBtn');
    if (btn) {
      const isDisabled = fdeHistory.length === 0 || fdeState.isInitialState;
      btn.disabled = isDisabled;
      btn.style.opacity = isDisabled ? '0.45' : '1.0';
      btn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
    }
  }

  function stepForwardFDE() {
    if (fdeState.isHalted) {
      pauseFDE();
      return;
    }

    if (fdeState.isInitialState) {
      saveFdeSnapshot();
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

    // Save snapshot before advancing
    saveFdeSnapshot();
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

  
  function initCustomRamEditor() {
    const grid = document.getElementById('customRamGrid');
    const openBtn = document.getElementById('openCustomRamBtn');
    const closeBtn = document.getElementById('closeCustomRamBtn');
    const drawer = document.getElementById('customRamDrawer');
    const applyBtn = document.getElementById('applyCustomRamBtn');
    const resetDefaultsBtn = document.getElementById('resetDefaultsRamBtn');

    if (!grid) return;

    function renderCustomGrid() {
      grid.innerHTML = '';
      const prog = BASE_PROGRAMS.custom || BASE_PROGRAMS.add;
      const ramData = prog.ram;

      for (let i = 0; i < 8; i++) {
        const item = ramData[i] || { addr: i.toString().padStart(2, '0'), val: '0', type: 'Empty' };
        const isInstr = i < 4;
        const card = document.createElement('div');
        card.className = 'custom-ram-card';

        const top = document.createElement('div');
        top.className = 'custom-ram-card-top';
        top.innerHTML = `
          <span class="custom-ram-addr">Slot ${item.addr}</span>
          <span class="custom-ram-badge ${isInstr ? 'badge-instr' : 'badge-data'}">${isInstr ? 'INSTRUCTION' : 'DATA'}</span>
        `;
        card.appendChild(top);

        const inputs = document.createElement('div');
        inputs.className = 'custom-ram-inputs';

        if (isInstr) {
          const parts = (item.val || 'HLT').trim().split(/\s+/);
          const currentOp = parts[0].toUpperCase();
          const currentOperand = parts[1] || '05';

          const opSelect = document.createElement('select');
          opSelect.id = `custom-op-${i}`;
          opSelect.className = 'custom-ram-select';
          ['LOAD', 'ADD', 'SUB', 'STORE', 'HLT'].forEach(op => {
            const opt = document.createElement('option');
            opt.value = op;
            opt.textContent = op;
            if (op === currentOp) opt.selected = true;
            opSelect.appendChild(opt);
          });

          const operandSelect = document.createElement('select');
          operandSelect.id = `custom-operand-${i}`;
          operandSelect.className = 'custom-ram-select';
          for (let a = 0; a < 8; a++) {
            const addrStr = a.toString().padStart(2, '0');
            const opt = document.createElement('option');
            opt.value = addrStr;
            opt.textContent = addrStr;
            if (addrStr === currentOperand) opt.selected = true;
            operandSelect.appendChild(opt);
          }

          opSelect.addEventListener('change', () => {
            operandSelect.style.display = opSelect.value === 'HLT' ? 'none' : 'inline-block';
          });
          operandSelect.style.display = currentOp === 'HLT' ? 'none' : 'inline-block';

          inputs.appendChild(opSelect);
          inputs.appendChild(operandSelect);
        } else {
          const numInput = document.createElement('input');
          numInput.type = 'number';
          numInput.id = `custom-data-${i}`;
          numInput.className = 'custom-ram-input';
          numInput.value = parseInt(item.val, 10) || 0;
          inputs.appendChild(numInput);
        }

        card.appendChild(inputs);
        grid.appendChild(card);
      }
    }

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        const isShown = drawer.style.display === 'block';
        drawer.style.display = isShown ? 'none' : 'block';
        if (!isShown) renderCustomGrid();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        drawer.style.display = 'none';
      });
    }

    if (resetDefaultsBtn) {
      resetDefaultsBtn.addEventListener('click', () => {
        BASE_PROGRAMS.custom.ram = JSON.parse(JSON.stringify(BASE_PROGRAMS.add.ram));
        renderCustomGrid();
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const newRam = [];
        for (let i = 0; i < 8; i++) {
          const addrStr = i.toString().padStart(2, '0');
          if (i < 4) {
            const opEl = document.getElementById(`custom-op-${i}`);
            const operandEl = document.getElementById(`custom-operand-${i}`);
            const op = opEl ? opEl.value : 'HLT';
            const operand = (op !== 'HLT' && operandEl) ? operandEl.value : '';
            const valStr = operand ? `${op} ${operand}` : op;
            newRam.push({ addr: addrStr, val: valStr, type: 'Instruction' });
          } else {
            const dataEl = document.getElementById(`custom-data-${i}`);
            const val = dataEl ? dataEl.value.toString() : '0';
            newRam.push({ addr: addrStr, val: val, type: (i === 7 ? 'Result' : 'Data') });
          }
        }
        BASE_PROGRAMS.custom.ram = newRam;
        fdeState.selectedProgram = 'custom';
        const progSelect = document.getElementById('programSelect');
        if (progSelect) progSelect.value = 'custom';
        drawer.style.display = 'none';
        resetFDE();
      });
    }
  }

  function initFDE() {
    const progSelect = document.getElementById('programSelect');
    const stepBackBtn = document.getElementById('fdeStepBackBtn');
    const stepBtn = document.getElementById('fdeStepBtn');
    const playBtn = document.getElementById('fdePlayBtn');
    const resetBtn = document.getElementById('fdeResetBtn');
    const speedButtons = document.querySelectorAll('.speed-btn-fde');

    if (progSelect) {
      progSelect.addEventListener('change', (e) => {
        fdeState.selectedProgram = e.target.value;
        if (e.target.value === 'custom') {
          const drawer = document.getElementById('customRamDrawer');
          if (drawer) {
            drawer.style.display = 'block';
          }
        }
        resetFDE();
      });
    }

    if (stepBackBtn) {
      stepBackBtn.addEventListener('click', () => {
        pauseFDE();
        stepBackFDE();
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
    initCustomRamEditor();
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
