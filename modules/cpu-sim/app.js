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
        if (targetView) {
          targetView.classList.add('active');
        }
      });
    });

    const initialHash = window.location.hash.replace('#', '');
    if (initialHash) {
      const targetBtn = document.querySelector(`.view-tab-btn[data-tab="${initialHash}"]`);
      if (targetBtn) targetBtn.click();
    }
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
    aluOutput: null,
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
    registers: {
      name: 'Registers (Internal CPU Memory)',
      nickname: 'Ultra-Fast Temporary Storage',
      icon: '⚡',
      bullets: [
        '<strong>High-speed memory cells</strong> located directly inside the CPU processor',
        '<strong>Extremely small capacity</strong> (typically holding just a single word, instruction, or address)',
        '<strong>Fastest access speed</strong> in the computer — operates at processor clock speed with zero wait cycles',
        '<strong>Generic term</strong>: AQA often asks about "registers" collectively as small, fast temporary storage locations'
      ],
      getValue: () => `Active Bank: PC, MAR, MDR, CIR, ACC (5 internal registers)`
    },
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
      examTakeaway: 'Syllabus Note: In detailed architectures, the CIR holds the instruction while the Control Unit decodes the opcode.',
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
        '<strong>Control Signals:</strong> The Control Unit prepares internal circuits (Control Bus remains idle until execution).'
      ],
      examTakeaway: 'The Control Unit (CU) decodes the instruction to determine what operation to perform and which memory address to access.',
      activeElements: { source: 'regCIR', target: 'cuBlock' },
      busControlVal: null,
      action: () => {
        fdeState.decodedOpcode = opcode;
        fdeState.decodedOperand = operand;
      }
    });

    // -------------------------------------------------------------------------
    // STEP 6+: Execute Stage (Decomposed into atomic microsteps)
    // -------------------------------------------------------------------------
    if (opcode === 'LOAD') {
      const dataVal = fdeState.ram[parseInt(operand, 10)]?.val || '0';

      // Execute 1: Fetch Value from RAM to MDR
      steps.push({
        stage: 'EXECUTE',
        subStep: 'fetch-data',
        title: `Execute 1: Fetch Value from RAM Address ${operand} into MDR`,
        instrTag: instrDisplay,
        bullets: [
          `<strong>Address Bus:</strong> MAR sends address ${operand} to RAM; Control Unit signals MEM_READ.`,
          `<strong>Data Bus:</strong> RAM retrieves value "${dataVal}" and transfers it down the Data Bus.`,
          `<strong>MDR Buffer:</strong> Memory Data Register receives and stores "${dataVal}".`
        ],
        examTakeaway: 'Data at the specified memory address is fetched via the Data Bus and held temporarily in the MDR.',
        activeElements: { source: 'regMAR', intermediate: 'regMDR', target: 'regMDR', bus: 'busAddress', secondaryBus: 'busData', ramRow: operand },
        busAddressVal: `Addr: ${operand}`,
        busDataVal: `${dataVal}`,
        busControlVal: 'MEM_READ',
        packetDir: { bus: 'data', dir: 'to-cpu', val: dataVal },
        action: () => {
          fdeState.mar = operand;
          fdeState.mdr = dataVal;
        }
      });

      // Execute 2: Copy MDR to ACC
      steps.push({
        stage: 'EXECUTE',
        subStep: 'save-acc',
        title: `Execute 2: Copy Value (${dataVal}) from MDR into Accumulator (ACC)`,
        instrTag: instrDisplay,
        bullets: [
          `<strong>Internal Transfer:</strong> Value "${dataVal}" is copied from the MDR directly into the Accumulator (ACC).`,
          `<strong>ACC Updated:</strong> Accumulator now holds ${dataVal} as its active working value.`,
          `<strong>Execution Complete:</strong> Instruction LOAD ${operand} has finished. Ready for next cycle.`
        ],
        examTakeaway: 'The value held in the MDR is copied directly into the Accumulator (ACC).',
        activeElements: { source: 'regMDR', target: 'regACC' },
        action: () => {
          fdeState.acc = parseInt(dataVal, 10) || 0;
        }
      });

    } else if (opcode === 'ADD') {
      const addOperandVal = parseInt(fdeState.ram[parseInt(operand, 10)]?.val || '0', 10);
      const startAcc = fdeState.acc;
      const calcTotal = startAcc + addOperandVal;

      // Execute 1: Fetch Operand Data from RAM to MDR
      steps.push({
        stage: 'EXECUTE',
        subStep: 'fetch-data',
        title: `Execute 1: Fetch Operand Data from RAM Address ${operand} into MDR`,
        instrTag: instrDisplay,
        bullets: [
          `<strong>Address Bus:</strong> MAR sends address ${operand} to RAM; Control Unit signals MEM_READ across Control Bus.`,
          `<strong>Data Bus:</strong> RAM retrieves value ${addOperandVal} and sends it along the Data Bus into MDR.`,
          `<strong>MDR Buffer:</strong> The Memory Data Register (MDR) holds ${addOperandVal} ready for the ALU.`
        ],
        examTakeaway: 'Before adding, the CPU must fetch the operand from RAM via the Address and Data buses into the MDR.',
        activeElements: { source: 'regMAR', intermediate: 'regMDR', target: 'regMDR', bus: 'busAddress', secondaryBus: 'busData', ramRow: operand },
        busAddressVal: `Addr: ${operand}`,
        busDataVal: `${addOperandVal}`,
        busControlVal: 'MEM_READ',
        packetDir: { bus: 'data', dir: 'to-cpu', val: addOperandVal },
        action: () => {
          fdeState.mar = operand;
          fdeState.mdr = addOperandVal.toString();
        }
      });

      // Execute 2: ALU Adds MDR to Accumulator
      steps.push({
        stage: 'EXECUTE',
        subStep: 'alu-calc',
        title: `Execute 2: ALU Adds MDR (${addOperandVal}) to Accumulator (${startAcc})`,
        instrTag: instrDisplay,
        bullets: [
          `<strong>Inputs to ALU:</strong> The ALU receives operand ${addOperandVal} from MDR and current total ${startAcc} from Accumulator.`,
          `<strong>ALU Arithmetic:</strong> Arithmetic adder circuitry computes: ${startAcc} + ${addOperandVal} = ${calcTotal}.`,
          `<strong>Control Unit Command:</strong> Control Unit signals the ALU across internal circuits to perform addition.`
        ],
        examTakeaway: 'The Arithmetic Logic Unit (ALU) performs the addition of the MDR contents and the Accumulator.',
        activeElements: { source: 'regMDR', secondaryTarget: 'regACC', target: 'aluBlock', bus: 'busData' },
        busDataVal: `${addOperandVal}`,
        action: () => {
          fdeState.aluOutput = calcTotal.toString();
        }
      });

      // Execute 3: Total Saved into Accumulator
      steps.push({
        stage: 'EXECUTE',
        subStep: 'save-acc',
        title: `Execute 3: Total Result (${calcTotal}) Saved into Accumulator (ACC)`,
        instrTag: instrDisplay,
        bullets: [
          `<strong>Result Stored:</strong> The calculation result (${calcTotal}) is transferred across the internal bridge into the Accumulator.`,
          `<strong>ACC Updated:</strong> Accumulator value updates from ${startAcc} to ${calcTotal}.`,
          `<strong>Execution Complete:</strong> Instruction ADD ${operand} finished. Ready for next cycle.`
        ],
        examTakeaway: 'The result of any calculation performed by the ALU is stored back in the Accumulator (ACC).',
        activeElements: { source: 'aluBlock', target: 'regACC' },
        action: () => {
          fdeState.acc = calcTotal;
          fdeState.aluOutput = null;
        }
      });

    } else if (opcode === 'SUB') {
      const subOperandVal = parseInt(fdeState.ram[parseInt(operand, 10)]?.val || '0', 10);
      const startAcc = fdeState.acc;
      const calcTotal = startAcc - subOperandVal;

      // Execute 1: Fetch Operand Data from RAM to MDR
      steps.push({
        stage: 'EXECUTE',
        subStep: 'fetch-data',
        title: `Execute 1: Fetch Operand Data from RAM Address ${operand} into MDR`,
        instrTag: instrDisplay,
        bullets: [
          `<strong>Address Bus:</strong> MAR sends address ${operand} to RAM; Control Unit signals MEM_READ across Control Bus.`,
          `<strong>Data Bus:</strong> RAM retrieves value ${subOperandVal} and sends it along the Data Bus into MDR.`,
          `<strong>MDR Buffer:</strong> The Memory Data Register (MDR) holds ${subOperandVal} ready for the ALU.`
        ],
        examTakeaway: 'Before subtracting, the CPU must fetch the operand from RAM via the Address and Data buses into the MDR.',
        activeElements: { source: 'regMAR', intermediate: 'regMDR', target: 'regMDR', bus: 'busAddress', secondaryBus: 'busData', ramRow: operand },
        busAddressVal: `Addr: ${operand}`,
        busDataVal: `${subOperandVal}`,
        busControlVal: 'MEM_READ',
        packetDir: { bus: 'data', dir: 'to-cpu', val: subOperandVal },
        action: () => {
          fdeState.mar = operand;
          fdeState.mdr = subOperandVal.toString();
        }
      });

      // Execute 2: ALU Subtracts MDR from Accumulator
      steps.push({
        stage: 'EXECUTE',
        subStep: 'alu-calc',
        title: `Execute 2: ALU Subtracts MDR (${subOperandVal}) from Accumulator (${startAcc})`,
        instrTag: instrDisplay,
        bullets: [
          `<strong>Inputs to ALU:</strong> The ALU receives operand ${subOperandVal} from MDR and current value ${startAcc} from Accumulator.`,
          `<strong>ALU Arithmetic:</strong> Arithmetic circuitry computes: ${startAcc} - ${subOperandVal} = ${calcTotal}.`,
          `<strong>Control Unit Command:</strong> Control Unit signals the ALU across internal circuits to perform subtraction.`
        ],
        examTakeaway: 'The Arithmetic Logic Unit (ALU) performs the subtraction of the MDR contents from the Accumulator.',
        activeElements: { source: 'regMDR', secondaryTarget: 'regACC', target: 'aluBlock', bus: 'busData' },
        busDataVal: `${subOperandVal}`,
        action: () => {
          fdeState.aluOutput = calcTotal.toString();
        }
      });

      // Execute 3: Total Saved into Accumulator
      steps.push({
        stage: 'EXECUTE',
        subStep: 'save-acc',
        title: `Execute 3: Total Result (${calcTotal}) Saved into Accumulator (ACC)`,
        instrTag: instrDisplay,
        bullets: [
          `<strong>Result Stored:</strong> The calculation result (${calcTotal}) is transferred across the internal bridge into the Accumulator.`,
          `<strong>ACC Updated:</strong> Accumulator value updates from ${startAcc} to ${calcTotal}.`,
          `<strong>Execution Complete:</strong> Instruction SUB ${operand} finished. Ready for next cycle.`
        ],
        examTakeaway: 'The result of any calculation performed by the ALU is stored back in the Accumulator (ACC).',
        activeElements: { source: 'aluBlock', target: 'regACC' },
        action: () => {
          fdeState.acc = calcTotal;
          fdeState.aluOutput = null;
        }
      });

    } else if (opcode === 'STORE') {
      const storeVal = fdeState.acc;

      // Execute 1: Copy ACC to MDR
      steps.push({
        stage: 'EXECUTE',
        subStep: 'store-prepare',
        title: `Execute 1: Copy Accumulator Value (${storeVal}) into MDR`,
        instrTag: instrDisplay,
        bullets: [
          `<strong>Prepare Data:</strong> The current value in the Accumulator (${storeVal}) is copied into the Memory Data Register (MDR).`,
          `<strong>Buffer Armed:</strong> MDR holds ${storeVal} ready to be placed on the Data Bus for writing.`
        ],
        examTakeaway: 'Before storing to memory, data from the Accumulator is placed into the MDR.',
        activeElements: { source: 'regACC', target: 'regMDR' },
        action: () => {
          fdeState.mdr = storeVal.toString();
        }
      });

      // Execute 2: Write MDR Value to RAM Address
      steps.push({
        stage: 'EXECUTE',
        subStep: 'store-write',
        title: `Execute 2: Write Value (${storeVal}) from MDR to RAM Address ${operand}`,
        instrTag: instrDisplay,
        bullets: [
          `<strong>Target Address:</strong> MAR places target address ${operand} onto the Address Bus.`,
          `<strong>Control Bus Command:</strong> Control Unit sends MEM_WRITE command signal along the Control Bus.`,
          `<strong>Written to RAM:</strong> Value ${storeVal} travels across the Data Bus and is saved in RAM slot ${operand}.`
        ],
        examTakeaway: 'The contents of the MDR are sent across the Data Bus and stored at the RAM address in MAR.',
        activeElements: { source: 'regMAR', intermediate: 'regMDR', target: `ram-row-${operand}`, bus: 'busAddress', secondaryBus: 'busData', ramRow: operand },
        busAddressVal: `Addr: ${operand}`,
        busDataVal: `${storeVal}`,
        busControlVal: 'MEM_WRITE',
        packetDir: { bus: 'data', dir: 'to-ram', val: storeVal },
        action: () => {
          fdeState.mar = operand;
          const targetIdx = parseInt(operand, 10);
          if (fdeState.ram[targetIdx]) {
            fdeState.ram[targetIdx].val = storeVal.toString();
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
    fdeState.aluOutput = null;
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

    canvasCtx = canvas.getContext('2d');

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
      { key: 'pc',          x: 30,  y: 58,  w: 96,  h: 96 },
      { key: 'mar',         x: 138, y: 58,  w: 96,  h: 96 },
      { key: 'mdr',         x: 246, y: 58,  w: 96,  h: 96 },
      { key: 'cir',         x: 354, y: 58,  w: 96,  h: 96 },
      { key: 'acc',         x: 462, y: 58,  w: 96,  h: 96 },
      { key: 'registers',   x: 22,  y: 42,  w: 546, h: 118 },
      { key: 'alu',         x: 578, y: 58,  w: 150, h: 96 },
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
    const canvas = document.getElementById('cpuMotherboardCanvas');
    if (!canvas) return;

    // High-DPI / Retina Crispness Resolution Match
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    if (rect.width > 0 && rect.height > 0) {
      const targetW = Math.max(1060, Math.round(rect.width * dpr));
      const targetH = Math.max(520, Math.round(rect.height * dpr));

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    }

    const ctx = canvasCtx;
    ctx.setTransform(canvas.width / 1060, 0, 0, canvas.height / 520, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

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

    // Clean substrate fill
    ctx.fillStyle = cBgRoot;
    ctx.fillRect(0, 0, 1060, 520);

    // Subtle Motherboard PCB circuit grid
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.035)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < 1060; gx += 24) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, 520);
      ctx.stroke();
    }
    for (let gy = 0; gy < 520; gy += 24) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(1060, gy);
      ctx.stroke();
    }

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
    // 1. CPU HARDWARE ZONE (Silicon Microchip Die Housing)
    // =========================================================================
    ctx.save();
    ctx.globalAlpha = 1.0;

    // CPU Silicon Substrate Enclosure
    const dieX = 16, dieY = 14, dieW = 726, dieH = 492;
    if (isDark) {
      const dieGrad = ctx.createLinearGradient(dieX, dieY, dieX + dieW, dieY + dieH);
      dieGrad.addColorStop(0, '#0f1d33');
      dieGrad.addColorStop(1, '#08101e');
      ctx.fillStyle = dieGrad;
    } else {
      ctx.fillStyle = '#ffffff';
    }
    drawRoundRect(ctx, dieX, dieY, dieW, dieH, 12);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : '#cbd5e1';
    ctx.stroke();

    // Gold Wire-Bond Pin Pads along top and bottom of the CPU silicon die
    ctx.fillStyle = isDark ? '#f59e0b' : '#d97706';
    for (let px = dieX + 32; px < dieX + dieW - 20; px += 24) {
      ctx.fillRect(px, dieY - 3, 10, 4); // top pin pads
      ctx.fillRect(px, dieY + dieH - 1, 10, 4); // bottom pin pads
    }

    // Top Header: Chip Die Badge + Title
    drawRoundRect(ctx, 28, 17, 72, 15, 3);
    ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(14, 165, 233, 0.15)';
    ctx.fill();
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.textAlign = 'center';
    ctx.fillText('SILICON DIE', 64, 28);

    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextPrimary;
    ctx.textAlign = 'left';
    ctx.fillText('VON NEUMANN CPU ARCHITECTURE', 108, 28);

    ctx.font = '9.5px JetBrains Mono, monospace';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'right';
    ctx.fillText('Internal Architecture', 730, 28);

    // Subtle hairline divider between CPU zone and RAM
    ctx.beginPath();
    ctx.moveTo(742, 15);
    ctx.lineTo(742, 505);
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : cBorder;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // -------------------------------------------------------------------------
    // 1.1 SPACIOUS REGISTER BANK (Top Row: PC, MAR, MDR, CIR, ACC)
    // -------------------------------------------------------------------------
    const isRegsHovered = hoveredKey === 'registers';

    // Enclosing Registers Container Box
    drawRoundRect(ctx, 22, 50, 546, 108, 8);
    ctx.fillStyle = isDark
      ? (isRegsHovered ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.45)')
      : (isRegsHovered ? 'rgba(56, 189, 248, 0.08)' : 'rgba(241, 245, 249, 0.55)');
    ctx.fill();
    ctx.lineWidth = isRegsHovered ? 2 : 1;
    ctx.strokeStyle = isRegsHovered
      ? (isDark ? '#38bdf8' : '#0284c7')
      : (isDark ? 'rgba(148, 163, 184, 0.35)' : '#cbd5e1');
    if (isRegsHovered) {
      ctx.shadowColor = isDark ? '#38bdf8' : 'rgba(2, 132, 199, 0.35)';
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Header Badge for Registers Container
    drawRoundRect(ctx, 252, 42, 86, 16, 4);
    ctx.fillStyle = isRegsHovered
      ? (isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(2, 132, 199, 0.2)')
      : (isDark ? '#1e293b' : '#e2e8f0');
    ctx.fill();
    ctx.strokeStyle = isRegsHovered ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#475569' : '#cbd5e1');
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 8.5px JetBrains Mono, monospace';
    ctx.fillStyle = isRegsHovered ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#94a3b8' : '#64748b');
    ctx.textAlign = 'center';
    ctx.fillText('REGISTERS', 295, 53.5);
    const REG_LIST = [
      { id: 'regPC',  x: 30,  w: 96, pinX: 88,  pinCtrlX: 54, tag: 'PC',  line1: 'Program Counter', line2: '',         color: cAmber,   val: fdeState.pc.toString().padStart(2, '0') },
      { id: 'regMAR', x: 138, w: 96, pinX: 186,               tag: 'MAR', line1: 'Memory Address',  line2: 'Register', color: cAmber,   val: fdeState.mar },
      { id: 'regMDR', x: 246, w: 96, pinX: 294,               tag: 'MDR', line1: 'Memory Data',     line2: 'Register', color: cEmerald, val: fdeState.mdr },
      { id: 'regCIR', x: 354, w: 96, pinX: 402,               tag: 'CIR', line1: 'Current Instr',   line2: 'Register', color: cPurple,  val: fdeState.cir || '---' },
      { id: 'regACC', x: 462, w: 96, pinX: 510,               tag: 'ACC', line1: 'Accumulator',     line2: '',         color: cPink,    val: fdeState.acc.toString() }
    ];

    for (const reg of REG_LIST) {
      const active = isNodeActive(reg.id);
      const isInc = reg.id === 'regPC' && currStep.isIncrement;
      ctx.globalAlpha = getDimAlpha(active || isInc);

      // Register Card Box
      drawRoundRect(ctx, reg.x, 58, reg.w, 96, 8);
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
      ctx.moveTo(reg.x + 3, 63);
      ctx.lineTo(reg.x + 3, 92);
      ctx.strokeStyle = reg.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Tag (e.g. PC, MAR, MDR, CIR, ACC)
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillStyle = reg.color;
      ctx.textAlign = 'left';
      ctx.fillText(reg.tag, reg.x + 10, 72);

      // Full Name moved cleanly UNDER Tag
      ctx.font = '8px Inter, system-ui, sans-serif';
      ctx.fillStyle = cTextSecondary;
      ctx.textAlign = 'left';
      if (reg.line2) {
        ctx.fillText(reg.line1, reg.x + 10, 83);
        ctx.fillText(reg.line2, reg.x + 10, 93);
      } else {
        ctx.fillText(reg.line1, reg.x + 10, 86);
      }

      // Big Value
      ctx.font = 'bold 15px JetBrains Mono, monospace';
      ctx.fillStyle = active || isInc ? reg.color : cTextPrimary;
      ctx.textAlign = 'center';
      const maxValW = reg.w - 16;
      let displayVal = reg.val;
      if (ctx.measureText(displayVal).width > maxValW) {
        displayVal = displayVal.slice(0, 8) + '..';
      }
      ctx.fillText(displayVal, reg.x + reg.w / 2, 113);

      // Status badge or role
      if (isInc) {
        drawRoundRect(ctx, reg.x + 14, 125, 68, 15, 3);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.fill();
        ctx.font = 'bold 8px JetBrains Mono, monospace';
        ctx.fillStyle = cEmerald;
        ctx.textAlign = 'center';
        ctx.fillText('+1 (Next)', reg.x + reg.w / 2, 136);
      } else {
        const roleLabel = reg.id === 'regPC' ? 'Pointer' : (reg.id === 'regMAR' ? 'Address' : (reg.id === 'regMDR' ? 'Buffer' : (reg.id === 'regCIR' ? 'Active' : 'Working')));
        drawRoundRect(ctx, reg.x + 16, 125, 64, 15, 3);
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
        ctx.fill();
        ctx.font = '7.5px JetBrains Mono, monospace';
        ctx.fillStyle = cTextMuted;
        ctx.textAlign = 'center';
        ctx.fillText(roleLabel, reg.x + reg.w / 2, 136);
      }

      // 8-bit Flip-Flop Transistor Bit-Cell Indicators
      const bitStartX = reg.x + (reg.w - (8 * 4 + 7 * 2)) / 2;
      const bitActive = active || isInc;
      for (let b = 0; b < 8; b++) {
        const bx = bitStartX + b * 6;
        ctx.fillStyle = bitActive
          ? (isInc ? cEmerald : reg.color)
          : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)');
        ctx.fillRect(bx, 144, 4, 3);
      }

      // Pin terminal dots at bottom of Register
      if (reg.id === 'regPC') {
        // Dedicated Control Pin (x=54) for INC_PC pulses
        ctx.beginPath();
        ctx.arc(54, 154, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isInc ? cEmerald : cPurple;
        ctx.fill();

        // Dedicated Address Pin (x=88) for Address Bus
        ctx.beginPath();
        ctx.arc(88, 154, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = reg.color;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(reg.pinX, 154, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = reg.color;
        ctx.fill();
      }
    }

    // -------------------------------------------------------------------------
    // 1.2 ARITHMETIC LOGIC UNIT (ALU) (Top Right of CPU zone)
    // -------------------------------------------------------------------------
    const aluActive = isNodeActive('aluBlock');
    ctx.globalAlpha = getDimAlpha(aluActive);

    drawRoundRect(ctx, 578, 58, 150, 96, 8);
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
    drawRoundRect(ctx, 668, 64, 54, 15, 3);
    ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)';
    ctx.fill();
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.fillStyle = cEmerald;
    ctx.textAlign = 'center';
    ctx.fillText('CALCULATOR', 695, 75);

    ctx.font = 'bold 10.5px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextPrimary;
    ctx.textAlign = 'left';
    ctx.fillText('ALU', 588, 76);

    ctx.font = '8.5px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextSecondary;
    ctx.fillText('Math Output:', 588, 96);

    ctx.font = 'bold 16px JetBrains Mono, monospace';
    ctx.fillStyle = aluActive ? cEmerald : cTextPrimary;
    ctx.fillText(fdeState.aluOutput || fdeState.acc.toString(), 588, 118);

    ctx.font = '8px Inter, system-ui, sans-serif';
    ctx.fillStyle = cTextMuted;
    ctx.fillText('Math (+, -) & logic', 588, 138);

    // ALU Arithmetic Logic Block Symbol (Iconic V-notch adder)
    ctx.beginPath();
    ctx.moveTo(672, 88);
    ctx.lineTo(687, 88);
    ctx.lineTo(693, 96);
    ctx.lineTo(699, 88);
    ctx.lineTo(714, 88);
    ctx.lineTo(705, 120);
    ctx.lineTo(681, 120);
    ctx.closePath();
    ctx.fillStyle = aluActive
      ? (isDark ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.2)')
      : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)');
    ctx.fill();
    ctx.lineWidth = aluActive ? 1.5 : 1;
    ctx.strokeStyle = aluActive ? cEmerald : (isDark ? 'rgba(16, 185, 129, 0.3)' : '#cbd5e1');
    ctx.stroke();

    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.fillStyle = aluActive ? cEmerald : cTextMuted;
    ctx.textAlign = 'center';
    ctx.fillText(aluActive ? 'ADD/SUB' : '+ / -', 693, 110);

    // ALU Data Pin Terminal (connecting to Data Bus) at (630, 154)
    ctx.beginPath();
    ctx.arc(630, 154, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = cEmerald;
    ctx.fill();

    // ALU Control Pin Terminal (connecting to Control Bus) at (680, 154)
    ctx.beginPath();
    ctx.arc(680, 154, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = cPurple;
    ctx.fill();

    // Dedicated Direct Internal Bus Bridge: ACC ⇄ ALU
    const isAccAluActive = aluActive || isNodeActive('regACC');
    ctx.beginPath();
    ctx.moveTo(558, 104);
    ctx.lineTo(578, 104);
    ctx.strokeStyle = isAccAluActive ? cEmerald : cBorder;
    ctx.lineWidth = isAccAluActive ? 3.5 : 2;
    if (isAccAluActive) {
      ctx.shadowColor = cEmerald;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Small ALU ⇄ ACC Bridge Badge
    drawRoundRect(ctx, 552, 96, 32, 14, 3);
    ctx.fillStyle = cCardBg;
    ctx.fill();
    ctx.strokeStyle = isAccAluActive ? cEmerald : cBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = 'bold 7px JetBrains Mono, monospace';
    ctx.fillStyle = isAccAluActive ? cEmerald : cTextMuted;
    ctx.textAlign = 'center';
    ctx.fillText('⇄', 568, 106);

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

    // Microcode Sequencer Stage Status Indicator
    const stages = [
      { name: '1. FETCH',   active: !isInitial && currStep.stage === 'FETCH',   color: cAmber },
      { name: '2. DECODE',  active: !isInitial && currStep.stage === 'DECODE',  color: cPurple },
      { name: '3. EXECUTE', active: !isInitial && currStep.stage === 'EXECUTE', color: cEmerald }
    ];
    let stY = 402;
    for (const st of stages) {
      drawRoundRect(ctx, 420, stY, 96, 14, 3);
      ctx.fillStyle = st.active
        ? (isDark ? 'rgba(168, 85, 247, 0.28)' : 'rgba(168, 85, 247, 0.15)')
        : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)');
      ctx.fill();
      ctx.strokeStyle = st.active ? st.color : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0');
      ctx.lineWidth = st.active ? 1.5 : 1;
      ctx.stroke();

      ctx.font = `${st.active ? 'bold' : 'normal'} 7.5px JetBrains Mono, monospace`;
      ctx.fillStyle = st.active ? st.color : cTextMuted;
      ctx.textAlign = 'center';
      ctx.fillText(st.name, 468, stY + 10);
      stY += 17;
    }

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

    const ramX = 760, ramY = 15, ramW = 280, ramH = 490;
    if (isDark) {
      const ramGrad = ctx.createLinearGradient(ramX, ramY, ramX + ramW, ramY + ramH);
      ramGrad.addColorStop(0, '#07241b');
      ramGrad.addColorStop(1, '#03140f');
      ctx.fillStyle = ramGrad;
    } else {
      ctx.fillStyle = '#f0fdf4';
    }
    drawRoundRect(ctx, ramX, ramY, ramW, ramH, 12);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = isDark ? '#059669' : '#86efac';
    ctx.stroke();

    // Gold Edge Connector Contacts along left edge of RAM (similar to CPU contacts)
    ctx.fillStyle = isDark ? '#f59e0b' : '#d97706';
    for (let py = ramY + 36; py < ramY + ramH - 24; py += 18) {
      // Avoid overlapping system bus dock terminals at y=195, y=250, y=305
      if (Math.abs(py - 195) < 10 || Math.abs(py - 250) < 10 || Math.abs(py - 305) < 10) continue;
      ctx.fillRect(ramX - 3, py, 4, 10);
    }

    // RAM Header
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.fillStyle = isDark ? '#34d399' : '#15803d';
    ctx.textAlign = 'left';
    ctx.fillText('MAIN MEMORY (RAM)', 775, 35);

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText('Slots 00 – 07', 1025, 35);

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

    // Parallel multi-rail copper conduit lines
    ctx.beginPath();
    ctx.moveTo(88, 187);
    ctx.lineTo(760, 187);
    ctx.moveTo(88, 203);
    ctx.lineTo(760, 203);
    ctx.strokeStyle = isDark ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

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
    ctx.fillText(isAddrBusActive ? `ADDR: ${fdeState.mar}` : 'ADDR BUS', 730, 200);

    // PC Branch Drop-Line (Vertical from PC pin down to Address Bus)
    ctx.beginPath();
    ctx.moveTo(88, 154);
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
    ctx.moveTo(186, 154);
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
        py = 154 + t * 41;
      } else if (g.progress <= 0.75) {
        const t = (g.progress - 0.25) / 0.50;
        px = 88 + t * 98;
        py = 195;
      } else {
        const t = (g.progress - 0.75) / 0.25;
        px = 186;
        py = 195 - t * 41;
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
        py = 154 + t * 41;
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

    // Parallel multi-rail copper conduit lines
    ctx.beginPath();
    ctx.moveTo(294, 242);
    ctx.lineTo(760, 242);
    ctx.moveTo(294, 258);
    ctx.lineTo(760, 258);
    ctx.strokeStyle = isDark ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

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
    ctx.fillText(isDataBusActive ? `DATA: "${fdeState.mdr}"` : 'DATA BUS', 730, 255);

    // MDR Branch Drop-Line (Vertical from MDR pin down to Data Bus)
    ctx.beginPath();
    ctx.moveTo(294, 154);
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
    ctx.moveTo(630, 154);
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
    ctx.moveTo(342, 104);
    ctx.lineTo(354, 104);
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
      drawCapsulePacket(ctx, px, 104, fdeState.mdr, cPurple, g.isArrived);
    }

    // --- DECODE 2: CIR ➔ CU Decoder Line ---
    const isDecode2Active = !isInitial && currStep.stage === 'DECODE' && act.source === 'regCIR';
    ctx.beginPath();
    ctx.moveTo(402, 154);
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
      const py = 154 + g.progress * 206;
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
        py = 250 - t * 96;
      }
      drawCapsulePacket(ctx, px, py, fdeState.mdr, cEmerald, g.isArrived);
    }

    // --- EXECUTE 2 (ADD / SUB): MDR ➔ ALU along Data Bus ---
    const isAluCalcActive = !isInitial && currStep.subStep === 'alu-calc';
    if (isAluCalcActive) {
      const g = getGlideProgress(animTime);
      let px, py;
      if (g.progress <= 0.20) {
        const t = g.progress / 0.20;
        px = 294;
        py = 154 + t * 96;
      } else if (g.progress <= 0.80) {
        const t = (g.progress - 0.20) / 0.60;
        px = 294 + t * 336;
        py = 250;
      } else {
        const t = (g.progress - 0.80) / 0.20;
        px = 630;
        py = 250 - t * 96;
      }
      drawCapsulePacket(ctx, px, py, fdeState.mdr, cEmerald, g.isArrived);
    }

    // --- EXECUTE 3 (ADD / SUB): ALU ➔ ACC across internal bridge ---
    const isAluToAcc = !isInitial && currStep.subStep === 'save-acc' && ['ADD', 'SUB'].includes(fdeState.decodedOpcode);
    if (isAluToAcc) {
      const g = getGlideProgress(animTime);
      const px = 578 - g.progress * 68;
      drawCapsulePacket(ctx, px, 104, fdeState.acc.toString(), cEmerald, g.isArrived);
    }

    // --- EXECUTE 2 (LOAD): MDR ➔ ACC internal transfer ---
    const isLoadToAcc = !isInitial && currStep.subStep === 'save-acc' && fdeState.decodedOpcode === 'LOAD';
    if (isLoadToAcc) {
      const g = getGlideProgress(animTime);
      const px = 294 + g.progress * 216;
      drawCapsulePacket(ctx, px, 104, fdeState.acc.toString(), cEmerald, g.isArrived);
    }

    // --- EXECUTE 1 (STORE): ACC ➔ MDR internal transfer ---
    const isStorePrep = !isInitial && currStep.subStep === 'store-prepare';
    if (isStorePrep) {
      const g = getGlideProgress(animTime);
      const px = 510 - g.progress * 216;
      drawCapsulePacket(ctx, px, 104, fdeState.mdr, cEmerald, g.isArrived);
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

    // Parallel multi-rail copper conduit lines
    ctx.beginPath();
    ctx.moveTo(54, 297);
    ctx.lineTo(760, 297);
    ctx.moveTo(54, 313);
    ctx.lineTo(760, 313);
    ctx.strokeStyle = isDark ? 'rgba(168, 85, 247, 0.22)' : 'rgba(168, 85, 247, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

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
    ctx.fillText(isCtrlBusActive ? `CMD: ${currStep.busControlVal || 'READ'}` : 'CTRL BUS', 730, 310);

    // PC Control Branch (Vertical from PC pin down to Control Bus) - Dedicated track to left of Address Bus!
    const isIncStep = isCtrlBusActive && currStep.busControlVal === 'INC_PC';
    ctx.beginPath();
    ctx.moveTo(54, 154);
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
    ctx.moveTo(680, 154);
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
        // Targeted at PC (x=54, y=154)
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
          // 3. Travel UP the PC Control branch from (54, 305) to PC pin (54, 154)
          const t = (g.progress - 0.75) / 0.25;
          px = 54;
          py = 305 - t * 151;
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
      const sub = step.subStep;

      if (sub === 'fetch-data') {
        html = `
          <div class="mini-flow-node highlight-gold"><span class="mini-flow-node-tag">RAM</span><span class="mini-flow-node-val">${fdeState.decodedOperand || 'MEM'}</span></div>
          <div class="mini-flow-wire wire-teal"><span class="mini-flow-packet">DATA ${mdrStr}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">MDR</span><span class="mini-flow-node-val">${mdrStr}</span></div>
        `;
      } else if (sub === 'alu-calc') {
        html = `
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">MDR</span><span class="mini-flow-node-val">${mdrStr}</span></div>
          <span class="mini-flow-arrow">+</span>
          <div class="mini-flow-node highlight-pink"><span class="mini-flow-node-tag">ACC</span><span class="mini-flow-node-val">${fdeState.acc}</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">ALU</span><span class="mini-flow-node-val">${fdeState.aluOutput || op}</span></div>
        `;
      } else if (sub === 'save-acc') {
        html = `
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">${op === 'LOAD' ? 'MDR' : 'ALU'}</span><span class="mini-flow-node-val">${fdeState.acc}</span></div>
          <div class="mini-flow-wire wire-teal"><span class="mini-flow-packet">SAVE</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-pink"><span class="mini-flow-node-tag">ACC</span><span class="mini-flow-node-val">${fdeState.acc}</span></div>
        `;
      } else if (sub === 'store-prepare') {
        html = `
          <div class="mini-flow-node highlight-pink"><span class="mini-flow-node-tag">ACC</span><span class="mini-flow-node-val">${fdeState.acc}</span></div>
          <div class="mini-flow-wire wire-teal"><span class="mini-flow-packet">BUFFER</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">MDR</span><span class="mini-flow-node-val">${mdrStr}</span></div>
        `;
      } else if (sub === 'store-write') {
        html = `
          <div class="mini-flow-node highlight-teal"><span class="mini-flow-node-tag">MDR</span><span class="mini-flow-node-val">${mdrStr}</span></div>
          <div class="mini-flow-wire wire-teal"><span class="mini-flow-packet">MEM_WRITE</span></div>
          <span class="mini-flow-arrow">➔</span>
          <div class="mini-flow-node highlight-gold"><span class="mini-flow-node-tag">RAM [${fdeState.decodedOperand}]</span><span class="mini-flow-node-val">${mdrStr}</span></div>
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
      aluOutput: fdeState.aluOutput,
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
    fdeState.aluOutput = prev.aluOutput;
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
  // 3. TAB 2: PERFORMANCE SANDBOX & SILICON DIE ENGINE (Core AQA §3.4.1)
  // =========================================================================
  const perfState = {
    clockSpeed: 3.0,
    cores: 2,
    cacheSize: '4mb',
    cacheLocation: 'on-die',
    workload: 'single',
    isPaused: false,
    simSpeed: 1.0,
    
    // Live calculated telemetry
    cacheHitRate: 85,
    stallRate: 15,
    throughputMips: 2400,
    heatWatts: 52,
    
    // Internal animation state
    animFrameId: null,
    lastTimestamp: 0,
    cycleClock: 0,
    packets: [],
    coreLoads: [100, 0, 0, 0],
    coreStallTimers: [0, 0, 0, 0],
    cacheFlashTimer: 0,
    cacheFlashType: null, // 'hit' | 'miss'
    ramFlashTimer: 0,
    nextSpawnTimer: 0,
    filledSlots: 0,
  };

  // Helper for drawing rounded rectangles with universal compatibility
  function drawRoundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  function initPerformanceSandbox() {
    const clockSlider = document.getElementById('perfClockSlider');
    const clockBadge = document.getElementById('perfClockBadge');
    const coresGroup = document.getElementById('perfCoresGroup');
    const coresBadge = document.getElementById('perfCoresBadge');
    const cacheGroup = document.getElementById('perfCacheGroup');
    const cacheBadge = document.getElementById('perfCacheBadge');
    const locGroup = document.getElementById('perfLocationGroup');
    const locBadge = document.getElementById('perfLocationBadge');
    const workloadBadge = document.getElementById('perfWorkloadBadge');
    const workloadButtons = document.querySelectorAll('.workload-pill-btn');
    const speedBtn = document.getElementById('perfSimSpeedBtn');
    const pauseBtn = document.getElementById('perfSimPauseBtn');

    // 1. Workload Presets (CGP friendly titles)
    workloadButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        workloadButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        perfState.workload = btn.getAttribute('data-workload');
        
        const titles = {
          single: 'Single-Threaded Task (e.g. Python Script / Office)',
          render: 'Multi-Threaded App (3D Rendering — 100% Multi-Core)',
          gaming: '3D Video Game (Mixed Game Loop & Physics)',
          database: 'Database Search (Memory & Cache Intensive)'
        };

        if (workloadBadge) workloadBadge.textContent = titles[perfState.workload] || 'Active Workload';
        calculatePerfMetrics();
      });
    });

    // 2. Clock Speed Slider
    if (clockSlider) {
      clockSlider.addEventListener('input', (e) => {
        perfState.clockSpeed = parseFloat(e.target.value);
        if (clockBadge) clockBadge.textContent = `${perfState.clockSpeed.toFixed(1)} GHz`;
        calculatePerfMetrics();
      });
    }

    // 3. Cores Buttons
    if (coresGroup) {
      const coreBtns = coresGroup.querySelectorAll('.perf-choice-btn');
      coreBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          coreBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          perfState.cores = parseInt(btn.getAttribute('data-cores'), 10);
          if (coresBadge) coresBadge.textContent = `${perfState.cores} Core${perfState.cores > 1 ? 's' : ''}`;
          calculatePerfMetrics();
        });
      });
    }

    // 4. Cache Size Buttons
    if (cacheGroup) {
      const cacheBtns = cacheGroup.querySelectorAll('.perf-choice-btn');
      cacheBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          cacheBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          perfState.cacheSize = btn.getAttribute('data-cache');
          if (cacheBadge) cacheBadge.textContent = perfState.cacheSize.toUpperCase();
          calculatePerfMetrics();
        });
      });
    }

    // 5. Cache Location Buttons
    if (locGroup) {
      const locBtns = locGroup.querySelectorAll('.perf-choice-btn');
      locBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          locBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          perfState.cacheLocation = btn.getAttribute('data-loc');
          if (locBadge) locBadge.textContent = perfState.cacheLocation === 'on-die' ? 'On-Die' : 'Off-Die';
          calculatePerfMetrics();
        });
      });
    }

    // 6. Simulation Speed & Pause Controls
    if (speedBtn) {
      speedBtn.addEventListener('click', () => {
        if (perfState.simSpeed === 1.0) {
          perfState.simSpeed = 0.35;
          speedBtn.textContent = 'Speed: 0.35× (Slow-Mo)';
          speedBtn.style.color = '#38bdf8';
        } else {
          perfState.simSpeed = 1.0;
          speedBtn.textContent = 'Speed: 1× (Normal)';
          speedBtn.style.color = '';
        }
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        perfState.isPaused = !perfState.isPaused;
        pauseBtn.textContent = perfState.isPaused ? '▶ Resume' : '⏸ Pause';
        pauseBtn.style.borderColor = perfState.isPaused ? '#10b981' : '';
      });
    }

    // 7. Reset Hardware to Baseline
    const resetHardwareBtn = document.getElementById('btnResetPerfHardware');
    if (resetHardwareBtn) {
      resetHardwareBtn.addEventListener('click', () => {
        perfState.clockSpeed = 3.0;
        perfState.cores = 2;
        perfState.cacheSize = 4;
        perfState.cacheLocation = 'on-die';
        perfState.workload = 'single';

        if (clockSlider) clockSlider.value = '3.0';
        if (clockBadge) clockBadge.textContent = '3.0 GHz';

        if (coresGroup) {
          const coreBtns = coresGroup.querySelectorAll('.perf-choice-btn');
          coreBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-cores') === '2'));
          if (coresBadge) coresBadge.textContent = '2 Cores';
        }

        if (cacheGroup) {
          const cacheBtns = cacheGroup.querySelectorAll('.perf-choice-btn');
          cacheBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-cache') === '4'));
          if (cacheBadge) cacheBadge.textContent = '4 MB';
        }

        if (locGroup) {
          const locBtns = locGroup.querySelectorAll('.perf-choice-btn');
          locBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-loc') === 'on-die'));
          if (locBadge) locBadge.textContent = 'On-Die';
        }

        workloadButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-workload') === 'single'));
        if (workloadBadge) workloadBadge.textContent = 'Single-Threaded Task';

        calculatePerfMetrics();
      });
    }

    window.addEventListener('resize', resizePerfCanvas);

    // Initial calculation and layout setup
    calculatePerfMetrics();
    resizePerfCanvas();

    // Start real-time simulation animation loop
    if (!perfState.animFrameId) {
      perfState.lastTimestamp = performance.now();
      perfState.animFrameId = requestAnimationFrame(perfAnimationLoop);
    }
  }

  function resizePerfCanvas() {
    const canvas = document.getElementById('cpuPerfCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    if (!width) return;
    const height = width * (460 / 1060);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(width / 1060 * dpr, 0, 0, width / 1060 * dpr, 0, 0);
    drawPerfCanvas();
  }

  // Live Metric Calculation & Bottleneck Diagnostic Engine (CGP Revision Style)
  function calculatePerfMetrics() {
    // Reset cache fill level so students watch cache fill up progressively on every config change
    perfState.filledSlots = 0;

    // 1. Thread Load Distribution per core based on workload
    const loads = [0, 0, 0, 0];
    if (perfState.workload === 'single') {
      loads[0] = 100;
      // All other cores remain completely 0% idle
    } else if (perfState.workload === 'render') {
      for (let i = 0; i < perfState.cores; i++) {
        loads[i] = 100;
      }
    } else if (perfState.workload === 'gaming') {
      const gameProfile = [95, 65, 38, 22];
      for (let i = 0; i < perfState.cores; i++) {
        loads[i] = gameProfile[i] || 20;
      }
    } else if (perfState.workload === 'database') {
      for (let i = 0; i < perfState.cores; i++) {
        loads[i] = 75;
      }
    }
    perfState.coreLoads = loads;

    // 2. Cache Hit Rate (%) Model
    // Proximity + capacity determine whether data is in high-speed SRAM or requires off-chip RAM
    const hitMatrix = {
      single:   { '256kb': 55, '1mb': 76, '4mb': 92, '16mb': 98 },
      render:   { '256kb': 70, '1mb': 86, '4mb': 95, '16mb': 99 },
      gaming:   { '256kb': 42, '1mb': 66, '4mb': 86, '16mb': 96 },
      database: { '256kb': 28, '1mb': 52, '4mb': 78, '16mb': 93 },
    };
    let baseHit = hitMatrix[perfState.workload][perfState.cacheSize] || 75;

    // Off-Die cache penalty: longer motherboard trace causes higher miss penalty & lower hit throughput
    if (perfState.cacheLocation === 'off-die') {
      baseHit = Math.max(15, baseHit - 14);
    }
    perfState.cacheHitRate = baseHit;

    // 3. Memory Stall Rate (% cycles lost waiting on off-chip RAM)
    const missRate = 100 - baseHit;
    if (perfState.cacheLocation === 'on-die') {
      perfState.stallRate = Math.min(85, Math.round(missRate * 0.72));
    } else {
      perfState.stallRate = Math.min(94, Math.round(missRate * 0.88 + 14));
    }

    // 4. Instruction Throughput (MIPS & Relative Speed Multiplier)
    let activeCoreFactor = 0;
    for (let i = 0; i < perfState.cores; i++) {
      activeCoreFactor += loads[i] / 100;
    }
    // Multi-core bus contention penalty (Amdahl & interconnect overhead)
    if (perfState.cores === 2) activeCoreFactor *= 0.96;
    if (perfState.cores === 4) activeCoreFactor *= 0.91;

    const stallMultiplier = Math.max(0.08, 1 - (perfState.stallRate / 100));
    perfState.throughputMips = Math.round(perfState.clockSpeed * 1000 * activeCoreFactor * stallMultiplier);

    // 5. Thermal & Power Dissipation (Watts TDP)
    const dynamicPower = Math.pow(perfState.clockSpeed, 2.2) * 5.2 * (0.4 + activeCoreFactor * 0.28);
    const staticPower = 8 + (perfState.cores * 2);
    perfState.heatWatts = Math.round(dynamicPower + staticPower);

    // 6. Update Intuitive Telemetry Cards & Speedometer
    const speedMultEl = document.getElementById('perfMetricSpeedMult');
    const speedSubEl = document.getElementById('perfMetricSpeedSub');
    const ratingBadge = document.getElementById('perfRatingBadge');
    const fpsEl = document.getElementById('perfMetricFps');
    const fpsSubEl = document.getElementById('perfMetricFpsSub');
    const fpsBadge = document.getElementById('perfFpsBadge');
    const hitEl = document.getElementById('perfMetricHit');
    const hitSubEl = document.getElementById('perfMetricHitSub');
    const effEl = document.getElementById('perfMetricEfficiency');
    const effSubEl = document.getElementById('perfMetricEfficiencySub');
    const stallBadge = document.getElementById('perfStallBadge');

    // Relative speed vs 1.0 GHz Single-Core baseline (~950 MIPS)
    const speedMult = Math.max(1.0, (perfState.throughputMips / 950)).toFixed(1);
    if (speedMultEl) speedMultEl.textContent = `${speedMult}× Baseline`;
    if (speedSubEl) speedSubEl.textContent = `vs 1.0 GHz Single-Core PC (~${perfState.throughputMips.toLocaleString()} MIPS)`;

    let ratingText = 'Average';
    let badgeClass = 'badge badge-warning';

    if (parseFloat(speedMult) >= 8.0) {
      ratingText = 'Very Fast';
      badgeClass = 'badge badge-live';
    } else if (parseFloat(speedMult) >= 4.5) {
      ratingText = 'Fast';
      badgeClass = 'badge badge-live';
    } else if (parseFloat(speedMult) >= 2.5) {
      ratingText = 'Above Average';
      badgeClass = 'badge badge-spec';
    } else if (parseFloat(speedMult) >= 1.5) {
      ratingText = 'Average';
      badgeClass = 'badge badge-warning';
    } else {
      ratingText = 'Below Average';
      badgeClass = 'badge badge-paper2';
    }

    if (ratingBadge) {
      ratingBadge.textContent = ratingText;
      ratingBadge.className = badgeClass;
    }

    // Update Overall Speedometer & Needle
    const speedoVal = document.getElementById('perfSpeedometerVal');
    const speedoMips = document.getElementById('perfSpeedometerMips');
    const speedoBadge = document.getElementById('perfSpeedometerBadge');
    const speedoNeedle = document.getElementById('perfSpeedometerNeedle');

    if (speedoVal) speedoVal.textContent = `${speedMult}×`;
    if (speedoMips) speedoMips.textContent = `${perfState.throughputMips.toLocaleString()} MIPS`;
    if (speedoBadge) {
      speedoBadge.textContent = ratingText;
      speedoBadge.className = badgeClass;
    }

    if (speedoNeedle) {
      const valNum = parseFloat(speedMult);
      const clamped = Math.max(1.0, Math.min(12.0, valNum));
      const angle = ((clamped - 1.0) / 11.0) * 180;
      speedoNeedle.setAttribute('transform', `rotate(${angle.toFixed(1)}, 100, 100)`);
    }

    // Real-world FPS task rate
    const fps = Math.round(Math.min(60, parseFloat(speedMult) * 10.5));
    if (fpsEl) fpsEl.textContent = `${fps} FPS`;
    if (fpsSubEl) {
      fpsSubEl.textContent = fps >= 55 ? 'Smooth playback (60 FPS)' : (fps >= 30 ? 'Acceptable performance' : 'Noticeable frame drops');
    }
    if (fpsBadge) {
      fpsBadge.textContent = fps >= 55 ? 'Smooth' : (fps >= 30 ? 'Moderate' : 'Low');
      fpsBadge.className = fps >= 55 ? 'badge badge-live' : (fps >= 30 ? 'badge badge-warning' : 'badge badge-paper2');
    }

    // Cache hit rate
    if (hitEl) hitEl.textContent = `${perfState.cacheHitRate}% Found`;
    if (hitSubEl) {
      hitSubEl.textContent = `Retrieved from fast cache (${100 - perfState.cacheHitRate}% from RAM)`;
    }

    // Core Efficiency (Productive work vs RAM stall wait)
    const efficiency = 100 - perfState.stallRate;
    if (effEl) effEl.textContent = `${efficiency}% Active`;
    if (effSubEl) effSubEl.textContent = `${perfState.stallRate}% of cycles spent waiting for RAM`;
    if (stallBadge) {
      stallBadge.textContent = efficiency >= 80 ? 'Low Wait' : (efficiency >= 60 ? 'Moderate Wait' : 'High Wait');
      stallBadge.className = efficiency >= 80 ? 'badge badge-live' : (efficiency >= 60 ? 'badge badge-warning' : 'badge badge-paper2');
    }

    // Real-Time Hardware Performance Summary
    updateBottleneckDiagnostic();
  }

  function updateBottleneckDiagnostic() {
    const card = document.getElementById('perfBottleneckCard');
    const icon = document.getElementById('perfBottleneckIcon');
    const typeBadge = document.getElementById('perfBottleneckType');
    const title = document.getElementById('perfBottleneckTitle');
    const desc = document.getElementById('perfBottleneckDesc');
    if (!card || !typeBadge || !title || !desc) return;

    if (perfState.stallRate >= 35) {
      card.style.borderLeftColor = '#ef4444';
      if (icon) icon.textContent = '';
      typeBadge.textContent = 'MEMORY LATENCY';
      typeBadge.className = 'badge badge-paper2';
      title.textContent = 'Memory Latency: CPU Waiting for Data';
      desc.textContent = `The processor is spending ${perfState.stallRate}% of its time waiting for data to arrive from main RAM. A fast clock speed cannot overcome slow memory retrieval. Increasing cache size allows frequently used instructions to be held closer to the CPU.`;
    } else if (perfState.workload === 'single' && perfState.cores > 1) {
      card.style.borderLeftColor = '#f59e0b';
      if (icon) icon.textContent = '';
      typeBadge.textContent = 'SOFTWARE CONSTRAINT';
      typeBadge.className = 'badge badge-warning';
      title.textContent = 'Software Constraint: Single-Threaded Task';
      desc.textContent = `This task is single-threaded, so only 1 core can process instructions at a time. The remaining ${perfState.cores - 1} cores cannot share the work. Having more cores does not speed up tasks that cannot be run in parallel.`;
    } else if (perfState.clockSpeed >= 4.0 && perfState.cores === 4) {
      card.style.borderLeftColor = '#ef4444';
      if (icon) icon.textContent = '';
      typeBadge.textContent = 'HEAT & POWER';
      typeBadge.className = 'badge badge-paper2';
      title.textContent = 'Thermal Limit: High Heat Generation';
      desc.textContent = `Running 4 cores at ${perfState.clockSpeed.toFixed(1)} GHz produces significant heat. Real processors will automatically throttle (reduce clock speed) to prevent overheating if cooling is insufficient.`;
    } else {
      card.style.borderLeftColor = '#10b981';
      if (icon) icon.textContent = '';
      typeBadge.textContent = 'BALANCED';
      typeBadge.className = 'badge badge-live';
      title.textContent = 'Balanced Hardware Configuration';
      desc.textContent = `Clock speed, core count, and cache capacity are well-suited to this workload. Instructions execute steadily with low memory wait time.`;
    }
  }

  // Helper generating strict orthogonal waypoint routes for data packets
  function getCoreExitPt(c) {
    const exits = [
      { x: 250, y: 137 }, // Core 0 right port
      { x: 471, y: 137 }, // Core 1 right port
      { x: 250, y: 327 }, // Core 2 right port
      { x: 471, y: 327 }, // Core 3 right port
    ];
    return exits[c] || exits[0];
  }

  function getCoreCenterPt(c) {
    const centers = [
      { x: 147, y: 137 },
      { x: 368, y: 137 },
      { x: 147, y: 327 },
      { x: 368, y: 327 },
    ];
    return centers[c] || centers[0];
  }

  function buildRouteToCache(coreIdx) {
    const exit = getCoreExitPt(coreIdx);
    const spineX = 492;
    const junctionY = 230;

    if (perfState.cacheLocation === 'on-die') {
      // Strict orthogonal path: Core -> Spine -> On-Die Cache
      return [
        { x: exit.x, y: exit.y },
        { x: spineX, y: exit.y },
        { x: spineX, y: junctionY },
        { x: 520, y: junctionY }
      ];
    } else {
      // Strict orthogonal path: Core -> Spine -> CPU Die Pin -> Motherboard Bus -> UP into Off-Die Cache
      return [
        { x: exit.x, y: exit.y },
        { x: spineX, y: exit.y },
        { x: spineX, y: junctionY },
        { x: 750, y: junctionY },
        { x: 785, y: junctionY },
        { x: 785, y: 165 }
      ];
    }
  }

  function buildRouteFromCacheToCore(coreIdx) {
    const exit = getCoreExitPt(coreIdx);
    const center = getCoreCenterPt(coreIdx);
    const spineX = 492;
    const junctionY = 230;

    if (perfState.cacheLocation === 'on-die') {
      return [
        { x: 520, y: junctionY },
        { x: spineX, y: junctionY },
        { x: spineX, y: exit.y },
        { x: exit.x, y: exit.y },
        { x: center.x, y: exit.y }
      ];
    } else {
      // Off-Die Cache -> DOWN to Motherboard Bus -> CPU Die Pin -> Spine -> Core
      return [
        { x: 785, y: 165 },
        { x: 785, y: junctionY },
        { x: 750, y: junctionY },
        { x: spineX, y: junctionY },
        { x: spineX, y: exit.y },
        { x: exit.x, y: exit.y },
        { x: center.x, y: exit.y }
      ];
    }
  }

  function buildRouteCacheToRam() {
    const junctionY = 230;

    if (perfState.cacheLocation === 'on-die') {
      return [
        { x: 620, y: junctionY },
        { x: 750, y: junctionY },
        { x: 880, y: junctionY }
      ];
    } else {
      // Off-Die Cache -> DOWN to Motherboard Bus -> RAM
      return [
        { x: 845, y: 165 },
        { x: 845, y: junctionY },
        { x: 880, y: junctionY }
      ];
    }
  }

  function buildRouteRamToCore(coreIdx) {
    const junctionY = 230;
    const exit = getCoreExitPt(coreIdx);
    const center = getCoreCenterPt(coreIdx);
    const spineX = 492;

    if (perfState.cacheLocation === 'on-die') {
      return [
        { x: 880, y: junctionY },
        { x: 750, y: junctionY },
        { x: 520, y: junctionY },
        { x: spineX, y: junctionY },
        { x: spineX, y: exit.y },
        { x: exit.x, y: exit.y },
        { x: center.x, y: exit.y }
      ];
    } else {
      // RAM -> Motherboard Bus -> UP into Off-Die Cache to refill -> DOWN to Bus -> CPU -> Spine -> Core
      return [
        { x: 880, y: junctionY },
        { x: 845, y: junctionY },
        { x: 845, y: 165 },
        { x: 785, y: 165 },
        { x: 785, y: junctionY },
        { x: 750, y: junctionY },
        { x: spineX, y: junctionY },
        { x: spineX, y: exit.y },
        { x: exit.x, y: exit.y },
        { x: center.x, y: exit.y }
      ];
    }
  }

  // Animation Loop: Packet physics and real-time state advances
  function perfAnimationLoop(timestamp) {
    const dt = Math.min((timestamp - perfState.lastTimestamp) / 1000, 0.1);
    perfState.lastTimestamp = timestamp;

    if (!perfState.isPaused) {
      perfState.cycleClock += dt * perfState.clockSpeed * perfState.simSpeed;

      // Decrement flash feedback timers
      if (perfState.cacheFlashTimer > 0) perfState.cacheFlashTimer -= dt;
      if (perfState.ramFlashTimer > 0) perfState.ramFlashTimer -= dt;

      // Core stall timers
      for (let i = 0; i < 4; i++) {
        if (perfState.coreStallTimers[i] > 0) {
          perfState.coreStallTimers[i] -= dt * perfState.simSpeed;
        }
      }

      // Packet generation: active cores send memory requests along bus tracks (deliberate, calm cadence)
      perfState.nextSpawnTimer -= dt * perfState.simSpeed;
      if (perfState.nextSpawnTimer <= 0) {
        perfState.nextSpawnTimer = 0.58 / (perfState.clockSpeed * 0.45);

        // Pick an active core with load > 0 that is not currently stalled
        const candidateCores = [];
        for (let i = 0; i < perfState.cores; i++) {
          if (perfState.coreLoads[i] > 0 && perfState.coreStallTimers[i] <= 0) {
            candidateCores.push(i);
          }
        }

        if (candidateCores.length > 0) {
          const coreIdx = candidateCores[Math.floor(Math.random() * candidateCores.length)];
          const route = buildRouteToCache(coreIdx);

          perfState.packets.push({
            waypoints: route,
            wpIdx: 1, // targeting index 1
            x: route[0].x,
            y: route[0].y,
            speed: 280 * perfState.simSpeed,
            type: 'req-to-cache',
            coreIdx: coreIdx,
            color: '#38bdf8'
          });
        }
      }

      // Update Packets movement along strict orthogonal waypoints
      for (let p = perfState.packets.length - 1; p >= 0; p--) {
        const pkt = perfState.packets[p];
        const target = pkt.waypoints[pkt.wpIdx];

        if (!target) {
          handlePacketArrival(pkt);
          perfState.packets.splice(p, 1);
          continue;
        }

        const dx = target.x - pkt.x;
        const dy = target.y - pkt.y;
        const dist = Math.hypot(dx, dy);
        const step = pkt.speed * dt;

        if (dist <= step || dist < 2) {
          // Reached waypoint
          pkt.x = target.x;
          pkt.y = target.y;
          pkt.wpIdx++;

          if (pkt.wpIdx >= pkt.waypoints.length) {
            handlePacketArrival(pkt);
            perfState.packets.splice(p, 1);
          }
        } else {
          pkt.x += (dx / dist) * step;
          pkt.y += (dy / dist) * step;
        }
      }
    }

    drawPerfCanvas();
    perfState.animFrameId = requestAnimationFrame(perfAnimationLoop);
  }

  function handlePacketArrival(pkt) {
    if (pkt.type === 'req-to-cache') {
      const maxSlots = perfState.cacheSize === '256kb' ? 4 : (perfState.cacheSize === '1mb' ? 10 : (perfState.cacheSize === '4mb' ? 24 : 48));

      // Realistic Software Footprint Demand:
      // - Single-Threaded (Python/Office): lightweight working set (~8 slots in 16MB)
      // - 3D Rendering (Blender): parallel thread buffers (~28 slots)
      // - 3D Video Game: textures, audio, physics (~40 slots)
      // - Database / Big Data: gigabyte table scan demands ALL available capacity (all 48 slots in 16MB!)
      let workloadDemand;
      if (perfState.workload === 'single') {
        workloadDemand = 8;
      } else if (perfState.workload === 'render') {
        workloadDemand = 28;
      } else if (perfState.workload === 'gaming') {
        workloadDemand = 40;
      } else {
        workloadDemand = 48;
      }

      const targetEquilibrium = Math.min(maxSlots, workloadDemand);

      // Fill up cache slot if not yet at equilibrium (starts empty, fills up progressively)
      if (perfState.filledSlots < targetEquilibrium) {
        perfState.filledSlots++;
      }

      // If cache reaches 100% of physical capacity (especially tiny 256KB that fills 4/4 fast),
      // it must evict and misses to RAM happen!
      const isFull = perfState.filledSlots >= maxSlots;
      let isFound = true;
      if (isFull) {
        isFound = (Math.random() * 100) < perfState.cacheHitRate;
      } else {
        // While below capacity, high rate of finding data in loaded working set
        isFound = (Math.random() * 100) < 92;
      }

      if (isFound) {
        // Found fast in cache (<1ns)
        perfState.cacheFlashTimer = 0.28;
        perfState.cacheFlashType = 'hit';

        // Return fast green packet to core along orthogonal tracks
        const returnRoute = buildRouteFromCacheToCore(pkt.coreIdx);
        perfState.packets.push({
          waypoints: returnRoute,
          wpIdx: 1,
          x: returnRoute[0].x,
          y: returnRoute[0].y,
          speed: 300 * perfState.simSpeed,
          type: 'hit-return',
          coreIdx: pkt.coreIdx,
          color: '#10b981'
        });
      } else {
        // Not in cache! Data must be fetched from slow RAM (~70ns). Core stalls!
        perfState.cacheFlashTimer = 0.38;
        perfState.cacheFlashType = 'miss';
        perfState.coreStallTimers[pkt.coreIdx] = 1.6 / perfState.simSpeed;

        // Spawn slow amber packet leaving cache and going across Motherboard Bus to RAM
        const ramRoute = buildRouteCacheToRam();
        perfState.packets.push({
          waypoints: ramRoute,
          wpIdx: 1,
          x: ramRoute[0].x,
          y: ramRoute[0].y,
          speed: 150 * perfState.simSpeed, // Slower motherboard bus speed
          type: 'miss-to-ram',
          coreIdx: pkt.coreIdx,
          color: '#f59e0b'
        });
      }
    } else if (pkt.type === 'miss-to-ram') {
      // Reached RAM: RAM flashes activity, sends data back across motherboard bus
      perfState.ramFlashTimer = 0.35;
      const ramReturnRoute = buildRouteRamToCore(pkt.coreIdx);
      perfState.packets.push({
        waypoints: ramReturnRoute,
        wpIdx: 1,
        x: ramReturnRoute[0].x,
        y: ramReturnRoute[0].y,
        speed: 170 * perfState.simSpeed,
        type: 'ram-to-cache',
        coreIdx: pkt.coreIdx,
        color: '#06b6d4'
      });
    } else if (pkt.type === 'hit-return' || pkt.type === 'ram-to-cache') {
      // Reached core: clear stall, core executes instruction
      perfState.coreStallTimers[pkt.coreIdx] = 0;
    }
  }

  // =========================================================================
  // Canvas Rendering Function: Silicon Die, Cores, Interconnect & RAM
  // =========================================================================
  function drawPerfCanvas() {
    const canvas = document.getElementById('cpuPerfCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Precalculate core stall status for cache and bus bottleneck visuals
    let isAnyStalled = false;
    for (let i = 0; i < perfState.cores; i++) {
      if (perfState.coreStallTimers[i] > 0) {
        isAnyStalled = true;
        break;
      }
    }

    // Clear background
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, 1060, 460);

    // Subtle motherboard PCB circuit grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < 1060; gx += 24) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, 460);
      ctx.stroke();
    }
    for (let gy = 0; gy < 460; gy += 24) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(1060, gy);
      ctx.stroke();
    }

    // -----------------------------------------------------------------------
    // 1. CPU SILICON DIE (Microchip substrate)
    // -----------------------------------------------------------------------
    const dieX = 24, dieY = 18, dieW = 726, dieH = 424;

    const dieGrad = ctx.createLinearGradient(dieX, dieY, dieX + dieW, dieY + dieH);
    dieGrad.addColorStop(0, '#0c1527');
    dieGrad.addColorStop(1, '#070c18');

    ctx.fillStyle = dieGrad;
    drawRoundRect(ctx, dieX, dieY, dieW, dieH, 14);
    ctx.fill();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Gold wire-bond contact pads around the perimeter of the silicon die
    ctx.fillStyle = '#f59e0b';
    for (let py = dieY + 20; py < dieY + dieH - 10; py += 18) {
      ctx.fillRect(dieX - 6, py, 6, 8); // left pin pads
      ctx.fillRect(dieX + dieW, py, 6, 8); // right pin pads
    }

    // Silicon Die Header
    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 11.5px Inter, system-ui, sans-serif';
    ctx.fillText('CPU SILICON DIE (INTEGRATED CIRCUIT)', dieX + 16, dieY + 22);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10.5px Inter, system-ui, sans-serif';
    ctx.fillText(
      `${perfState.cores} Core(s) Enabled • ${perfState.clockSpeed.toFixed(1)} GHz Clock • On-Chip Interconnect (< 1 ns)`,
      dieX + 270,
      dieY + 22
    );

    // -----------------------------------------------------------------------
    // 2. HIGH-SPEED ON-CHIP INTERCONNECT HIGHWAY (Physical Copper Bus Conduit)
    // -----------------------------------------------------------------------
    const spineX = 492;

    // Bus Conduit Background Track (Broad highway pipe)
    ctx.fillStyle = 'rgba(14, 165, 233, 0.1)';
    ctx.fillRect(spineX - 12, 50, 24, 360);

    // Horizontal feeder bus tracks
    ctx.fillRect(250, 131, 242, 12); // Core 0 & 1 -> Spine
    ctx.fillRect(250, 321, 242, 12); // Core 2 & 3 -> Spine

    if (perfState.cacheLocation === 'on-die') {
      ctx.fillRect(spineX, 224, 28, 12); // Spine -> On-Die Cache
    } else {
      // Connects spine straight through empty bay to CPU Die pin exit!
      ctx.fillRect(spineX, 224, 258, 12);
    }

    // Copper boundary lines of the bus conduit
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
    ctx.lineWidth = 1.5;

    // Vertical spine walls
    ctx.beginPath();
    ctx.moveTo(spineX - 12, 50);
    ctx.lineTo(spineX - 12, 410);
    ctx.moveTo(spineX + 12, 50);
    ctx.lineTo(spineX + 12, 410);

    // Horizontal feeder tracks
    ctx.moveTo(250, 131); ctx.lineTo(spineX - 12, 131);
    ctx.moveTo(250, 143); ctx.lineTo(spineX - 12, 143);
    ctx.moveTo(250, 321); ctx.lineTo(spineX - 12, 321);
    ctx.moveTo(250, 333); ctx.lineTo(spineX - 12, 333);

    if (perfState.cacheLocation === 'on-die') {
      ctx.moveTo(spineX + 12, 224); ctx.lineTo(520, 224);
      ctx.moveTo(spineX + 12, 236); ctx.lineTo(520, 236);
    } else {
      ctx.moveTo(spineX + 12, 224); ctx.lineTo(750, 224);
      ctx.moveTo(spineX + 12, 236); ctx.lineTo(750, 236);
    }
    ctx.stroke();

    // Center electrical signal pulse lines
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(spineX, 50);
    ctx.lineTo(spineX, 410);
    ctx.moveTo(250, 137); ctx.lineTo(spineX, 137);
    ctx.moveTo(250, 327); ctx.lineTo(spineX, 327);

    if (perfState.cacheLocation === 'on-die') {
      ctx.moveTo(spineX, 230); ctx.lineTo(520, 230);
    } else {
      ctx.moveTo(spineX, 230); ctx.lineTo(750, 230);
    }
    ctx.stroke();

    // Animated dashed flow along interconnect
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.lineDashOffset = -perfState.cycleClock * 24;
    ctx.beginPath();
    ctx.moveTo(spineX, 50);
    ctx.lineTo(spineX, 410);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // -----------------------------------------------------------------------
    // 3. CPU CORES (2 × 2 Grid)
    // -----------------------------------------------------------------------
    const coreBoxes = [
      { x: 44,  y: 52,  w: 206, h: 170, label: 'CORE 0' },
      { x: 265, y: 52,  w: 206, h: 170, label: 'CORE 1' },
      { x: 44,  y: 242, w: 206, h: 170, label: 'CORE 2' },
      { x: 265, y: 242, w: 206, h: 170, label: 'CORE 3' }
    ];

    for (let i = 0; i < 4; i++) {
      const box = coreBoxes[i];
      const isEnabled = i < perfState.cores;
      const isStalled = perfState.coreStallTimers[i] > 0;
      const load = perfState.coreLoads[i];

      if (isEnabled) {
        // Active Core Container
        const isComputing = load > 0 && !isStalled;
        ctx.fillStyle = isStalled ? '#1e1013' : (isComputing ? '#0d1829' : '#0a101d');
        drawRoundRect(ctx, box.x, box.y, box.w, box.h, 10);
        ctx.fill();

        // Border glow based on state
        if (isStalled) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.2;
        } else if (isComputing) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 1.8;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();

        // Core Header
        ctx.fillStyle = '#f8fafc';
        ctx.font = '800 12px Inter, system-ui, sans-serif';
        ctx.fillText(box.label, box.x + 12, box.y + 20);

        // State Badge (Top Right)
        let badgeBg = 'rgba(16, 185, 129, 0.15)';
        let badgeColor = '#10b981';
        let badgeText = `ACTIVE (${load}%)`;

        if (isStalled) {
          badgeBg = 'rgba(239, 68, 68, 0.25)';
          badgeColor = '#ef4444';
          badgeText = '⏳ RAM STALL';
        } else if (load === 0) {
          badgeBg = 'rgba(148, 163, 184, 0.1)';
          badgeColor = '#94a3b8';
          badgeText = 'IDLE (0%)';
        }

        ctx.fillStyle = badgeBg;
        drawRoundRect(ctx, box.x + box.w - 94, box.y + 7, 84, 18, 4);
        ctx.fill();

        ctx.fillStyle = badgeColor;
        ctx.font = '700 9.5px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, box.x + box.w - 52, box.y + 19);
        ctx.textAlign = 'left'; // reset

        // Internal Microarchitecture: ALU & CU Sub-blocks
        const aluX = box.x + 12, aluY = box.y + 32, subW = 86, subH = 26;
        ctx.fillStyle = '#1e293b';
        drawRoundRect(ctx, aluX, aluY, subW, subH, 4);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.font = '700 9.5px Inter, system-ui, sans-serif';
        ctx.fillText('ALU (Math)', aluX + 8, aluY + 17);

        const cuX = box.x + 106;
        ctx.fillStyle = '#1e293b';
        drawRoundRect(ctx, cuX, aluY, subW + 2, subH, 4);
        ctx.fill();
        ctx.fillStyle = '#c084fc';
        ctx.font = '700 9.5px Inter, system-ui, sans-serif';
        ctx.fillText('CU (Decoder)', cuX + 8, aluY + 17);

        // Dedicated Clock Header (Zero collision with wave!)
        const waveBoxX = box.x + 12, waveBoxY = box.y + 72, waveW = 182, waveH = 32;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 8.5px Inter, system-ui, sans-serif';
        ctx.fillText(`CLOCK: ${perfState.clockSpeed.toFixed(1)} GHz (${(perfState.clockSpeed * 1e9).toExponential(1)} cycles/s)`, waveBoxX, waveBoxY - 4);

        // Real-time Sine Wave Clock Frequency Oscillator (Clean CRT Screen)
        ctx.fillStyle = '#060a12';
        drawRoundRect(ctx, waveBoxX, waveBoxY, waveW, waveH, 5);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(waveBoxX, waveBoxY + 16);
        ctx.lineTo(waveBoxX + waveW, waveBoxY + 16);
        ctx.stroke();

        // Pulsing sine wave representing clock frequency
        ctx.strokeStyle = isStalled ? '#ef4444' : '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        const freqMultiplier = perfState.clockSpeed * 1.8;
        for (let wx = 0; wx < waveW; wx += 2) {
          const rad = (wx / 14) * freqMultiplier + perfState.cycleClock * 6;
          const wy = waveBoxY + 16 + Math.sin(rad) * (isComputing ? 11 : 2);
          if (wx === 0) ctx.moveTo(waveBoxX + wx, wy);
          else ctx.lineTo(waveBoxX + wx, wy);
        }
        ctx.stroke();

        // Core Thread Load Progress Bar
        const barX = box.x + 12, barY = box.y + 114, barW = 182, barH = 16;
        ctx.fillStyle = '#111827';
        drawRoundRect(ctx, barX, barY, barW, barH, 4);
        ctx.fill();

        if (load > 0) {
          const fillW = Math.max(8, (barW * load) / 100);
          ctx.fillStyle = isStalled ? '#ef4444' : (load > 85 ? '#10b981' : '#38bdf8');
          drawRoundRect(ctx, barX, barY, fillW, barH, 4);
          ctx.fill();
        }

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 8.5px Inter, system-ui, sans-serif';
        ctx.fillText(`Thread Execution Load: ${load}%`, barX + 8, barY + 11.5);

        // Subtext rule / State indicator
        if (isStalled) {
          ctx.fillStyle = '#ef4444';
          ctx.font = '700 8.5px Inter, system-ui, sans-serif';
          ctx.fillText('🔴 STALLED: Waiting on slow RAM (~70ns)...', barX, box.y + 148);
        } else if (load === 0) {
          ctx.fillStyle = '#64748b';
          ctx.font = '500 8.5px Inter, system-ui, sans-serif';
          ctx.fillText('• Idle: Unused by single-threaded code', barX, box.y + 148);
        } else {
          ctx.fillStyle = '#10b981';
          ctx.font = '600 8.5px Inter, system-ui, sans-serif';
          ctx.fillText('✓ Executing F-D-E instructions smoothly', barX, box.y + 148);
        }

      } else {
        // Disabled / Unused Core (Power Gated)
        ctx.fillStyle = 'rgba(10, 16, 26, 0.45)';
        drawRoundRect(ctx, box.x, box.y, box.w, box.h, 10);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]); // reset

        ctx.fillStyle = '#475569';
        ctx.font = '800 13px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${box.label} (DISABLED)`, box.x + box.w / 2, box.y + 70);

        ctx.font = '600 10.5px Inter, system-ui, sans-serif';
        ctx.fillText('POWER GATED (0W)', box.x + box.w / 2, box.y + 92);

        ctx.font = '500 9.5px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#334155';
        ctx.fillText('Unused by current hardware configuration', box.x + box.w / 2, box.y + 112);
        ctx.textAlign = 'left'; // reset
      }
    }

    // -----------------------------------------------------------------------
    // 4. CACHE MEMORY BLOCK (Dynamic Silicon Area & Placement)
    // -----------------------------------------------------------------------
    if (perfState.cacheLocation === 'on-die') {
      const cacheBayX = 520, cacheBayW = 215;
      // Dynamic height & visual slot counts according to cache size
      const sizeParams = {
        '256kb': { y: 160, h: 125, name: '256 KB (TINY - CRAMPED)', slots: 4, subText: 'Only 4 slots! High RAM misses', cols: 4, rows: 1 },
        '1mb':   { y: 130, h: 180, name: '1 MB (SMALL CACHE)', slots: 10, subText: '10 slots (30% trips to RAM)', cols: 5, rows: 2 },
        '4mb':   { y: 85,  h: 265, name: '4 MB (ROOMY CACHE)', slots: 24, subText: '24 slots (9 in 10 fit on desk!)', cols: 6, rows: 4 },
        '16mb':  { y: 44,  h: 345, name: '16 MB (MASSIVE CACHE)', slots: 48, subText: '48 slots (99 in 100 fit on desk)', cols: 8, rows: 6 }
      };
      const p = sizeParams[perfState.cacheSize] || sizeParams['4mb'];

      // Silicon SRAM container
      ctx.fillStyle = '#140f2b';
      drawRoundRect(ctx, cacheBayX, p.y, cacheBayW, p.h, 10);
      ctx.fill();

      // Steady calm border — eliminates distracting full-box strobe flashing
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Row 1: Title
      ctx.fillStyle = '#c084fc';
      ctx.font = '800 11.5px Inter, system-ui, sans-serif';
      ctx.fillText(p.name, cacheBayX + 12, p.y + 18);

      // Row 2: Subtitle
      ctx.fillStyle = '#a78bfa';
      ctx.font = '600 9px Inter, system-ui, sans-serif';
      ctx.fillText(p.subText, cacheBayX + 12, p.y + 31);

      // Row 3: Dedicated Full-Width Status Pill (Dynamically reflects progressive fill level)
      const isFull = perfState.filledSlots >= p.slots;
      const pillH = isFull ? 26 : 18;
      const pillY = p.y + (isFull ? 34 : 38);
      let pillBg = '';
      let pillColor = '';

      if (perfState.filledSlots === 0) {
        pillBg = 'rgba(148, 163, 184, 0.15)';
        pillColor = '#94a3b8';
      } else if (isFull) {
        pillBg = 'rgba(239, 68, 68, 0.28)';
        pillColor = '#ef4444';
      } else {
        const pct = Math.round((perfState.filledSlots / p.slots) * 100);
        pillBg = pct > 75 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.18)';
        pillColor = pct > 75 ? '#f59e0b' : '#34d399';
      }

      ctx.fillStyle = pillBg;
      drawRoundRect(ctx, cacheBayX + 12, pillY, cacheBayW - 24, pillH, 4);
      ctx.fill();

      if (perfState.filledSlots === 0) {
        ctx.fillStyle = pillColor;
        ctx.font = '700 8.5px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚪ CACHE EMPTY — INSTRUCTIONS STREAMING', cacheBayX + cacheBayW / 2, pillY + 12);
        ctx.textAlign = 'left';
      } else if (isFull) {
        // Two clean lines to guarantee zero overflow outside the pill
        ctx.fillStyle = pillColor;
        ctx.font = '800 8.5px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🔴 100% FULL (${p.slots}/${p.slots} SLOTS)`, cacheBayX + cacheBayW / 2, pillY + 11);
        ctx.font = '700 8px Inter, system-ui, sans-serif';
        ctx.fillText('Overflowing: Evicting data to RAM', cacheBayX + cacheBayW / 2, pillY + 22);
        ctx.textAlign = 'left';
      } else {
        const pct = Math.round((perfState.filledSlots / p.slots) * 100);
        ctx.fillStyle = pillColor;
        ctx.font = '700 8.5px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🟢 ${pct}% USED (${perfState.filledSlots}/${p.slots} SLOTS)`, cacheBayX + cacheBayW / 2, pillY + 12);
        ctx.textAlign = 'left';
      }

      // Silicon SRAM memory cell slots (Guaranteed inside bounding box without overflow)
      const cellCols = p.cols;
      const cellRows = p.rows;
      const gridW = cacheBayW - 24;
      const startGridY = pillY + pillH + 6;
      const gap = p.slots <= 4 ? 6 : 3;
      const cellW = Math.floor((gridW - (cellCols - 1) * gap) / cellCols);
      const cellH = p.slots <= 4 ? 22 : (perfState.cacheSize === '1mb' ? 18 : (perfState.cacheSize === '4mb' ? 16 : 13));
      const rowGap = 4;

      for (let cr = 0; cr < cellRows; cr++) {
        for (let cc = 0; cc < cellCols; cc++) {
          const slotIdx = cr * cellCols + cc;
          if (slotIdx >= p.slots) break;

          const cx = cacheBayX + 12 + cc * (cellW + gap);
          const cy = startGridY + cr * (cellH + rowGap);
          const isSlotFilled = slotIdx < perfState.filledSlots;

          if (isSlotFilled) {
            if (p.slots <= 4) {
              if (perfState.filledSlots >= 4) {
                ctx.fillStyle = '#ef4444';
                ctx.strokeStyle = '#f87171';
              } else {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
                ctx.strokeStyle = '#ef4444';
              }
            } else if (perfState.cacheSize === '1mb') {
              ctx.fillStyle = 'rgba(245, 158, 11, 0.8)';
              ctx.strokeStyle = '#fbbf24';
            } else if (perfState.cacheSize === '4mb') {
              ctx.fillStyle = 'rgba(14, 165, 233, 0.8)';
              ctx.strokeStyle = '#38bdf8';
            } else {
              ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
              ctx.strokeStyle = '#34d399';
            }
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          }

          drawRoundRect(ctx, cx, cy, cellW, cellH, 3);
          ctx.fill();
          ctx.stroke();

          if (isSlotFilled && p.slots <= 4 && perfState.filledSlots >= 4) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '800 8.5px font-mono, monospace';
            ctx.fillText('FULL', cx + Math.floor(cellW / 2) - 11, cy + cellH - 6);
          }
        }
      }

      // Status message at bottom of cache block: green when fine, red when missing/stalled/overflowing
      const isCacheProblem = isAnyStalled || (perfState.cacheFlashTimer > 0 && perfState.cacheFlashType === 'miss') || (perfState.filledSlots >= p.slots && p.slots <= 4);

      ctx.font = '700 9.5px Inter, system-ui, sans-serif';
      if (isCacheProblem) {
        ctx.fillStyle = '#ef4444';
        const msg = (perfState.filledSlots >= p.slots && p.slots <= 4)
          ? 'Cache 100% Full — Evicting to RAM'
          : 'Cache Miss — Fetching Slow RAM (~70ns)';
        ctx.fillText(msg, cacheBayX + 12, p.y + p.h - 10);
      } else {
        ctx.fillStyle = '#10b981';
        ctx.fillText('Cache Operating — Fast On-Chip SRAM (<1ns)', cacheBayX + 12, p.y + p.h - 10);
      }

    } else {
      // Off-Die Cache: Silicon slot inside CPU die is empty!
      const cacheBayX = 520, cacheBayY = 130, cacheBayW = 215, cacheBayH = 170;
      ctx.fillStyle = 'rgba(10, 16, 26, 0.45)';
      drawRoundRect(ctx, cacheBayX, cacheBayY, cacheBayW, cacheBayH, 10);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      ctx.fillStyle = '#64748b';
      ctx.font = '800 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EMPTY ON-DIE CACHE BAY', cacheBayX + cacheBayW / 2, cacheBayY + 65);
      ctx.font = '500 10px Inter, system-ui, sans-serif';
      ctx.fillText('No SRAM built on CPU silicon die', cacheBayX + cacheBayW / 2, cacheBayY + 85);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('⚠️ Bus traces routed off-die to external chip (~15ns)', cacheBayX + cacheBayW / 2, cacheBayY + 105);
      ctx.textAlign = 'left'; // reset

      // Physical Off-Die Cache chip placed cleanly ABOVE the motherboard bus!
      const offX = 762, offY = 40, offW = 104, offH = 125;
      ctx.fillStyle = '#140f2b';
      drawRoundRect(ctx, offX, offY, offW, offH, 8);
      ctx.fill();

      // Steady calm border — eliminates distracting strobe flash
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = '#c084fc';
      ctx.font = '800 10.5px Inter, system-ui, sans-serif';
      ctx.fillText('OFF-DIE CACHE', offX + 8, offY + 18);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '700 8.5px Inter, system-ui, sans-serif';
      ctx.fillText('~15 ns Bus Delay', offX + 8, offY + 31);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 8px Inter, system-ui, sans-serif';
      ctx.fillText('External SRAM', offX + 8, offY + 43);

      // 6 Miniature slots inside Off-Die Cache showing it filling up
      for (let sc = 0; sc < 6; sc++) {
        const sx = offX + 8 + (sc % 3) * 30;
        const sy = offY + 50 + Math.floor(sc / 3) * 16;
        const isOffSlotFilled = sc < perfState.filledSlots;

        ctx.fillStyle = isOffSlotFilled ? (perfState.filledSlots >= 4 ? '#ef4444' : '#f59e0b') : 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = isOffSlotFilled ? '#fbbf24' : 'rgba(255, 255, 255, 0.15)';
        drawRoundRect(ctx, sx, sy, 26, 12, 2);
        ctx.fill();
        ctx.stroke();
      }

      const isOffProblem = isAnyStalled || (perfState.cacheFlashTimer > 0 && perfState.cacheFlashType === 'miss') || perfState.filledSlots >= 4;
      ctx.fillStyle = isOffProblem ? '#ef4444' : '#10b981';
      ctx.font = '700 8px Inter, system-ui, sans-serif';
      ctx.fillText(isOffProblem ? 'Off-Die Miss (~15ns bus)' : 'Off-Die OK (~15ns SRAM)', offX + 8, offY + 92);

      // Gold solder pin pads at bottom of Off-Die Cache
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(781, 161, 8, 4); // Ingress pin pad (x=785)
      ctx.fillRect(841, 161, 8, 4); // Egress pin pad (x=845)

      // Vertical Ingress Bus Wire (CPU to Off-Die Cache): UP from y=230 to y=165
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.fillRect(780, 165, 10, 65);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(780, 165); ctx.lineTo(780, 230);
      ctx.moveTo(790, 165); ctx.lineTo(790, 230);
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(785, 165); ctx.lineTo(785, 230);
      ctx.stroke();

      // Solder dots at (785, 230) and (785, 165)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(785, 230, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(785, 165, 3.5, 0, Math.PI * 2); ctx.fill();

      // Up arrow tag
      ctx.fillStyle = '#f59e0b';
      ctx.font = '700 8px Inter, system-ui, sans-serif';
      ctx.fillText('▲ IN', 773, 202);

      // Vertical Egress Bus Wire (Off-Die Cache to RAM): DOWN from y=165 to y=230
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.fillRect(840, 165, 10, 65);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(840, 165); ctx.lineTo(840, 230);
      ctx.moveTo(850, 165); ctx.lineTo(850, 230);
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(845, 165); ctx.lineTo(845, 230);
      ctx.stroke();

      // Solder dots at (845, 165) and (845, 230)
      ctx.beginPath(); ctx.arc(845, 165, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(845, 230, 3.5, 0, Math.PI * 2); ctx.fill();

      // Down arrow tag
      ctx.fillStyle = '#f59e0b';
      ctx.font = '700 8px Inter, system-ui, sans-serif';
      ctx.fillText('▼ RAM', 833, 202);
    }

    // -----------------------------------------------------------------------
    // 5. EXTERNAL MOTHERBOARD BUS (Off-chip copper traces between CPU and RAM)
    // -----------------------------------------------------------------------
    const busStartX = dieX + dieW, busEndX = 880, busY = 210, busH = 46;

    // Copper trace channel
    ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
    ctx.fillRect(busStartX, busY, busEndX - busStartX, busH);

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.lineWidth = 1.5;
    for (let ty = busY + 8; ty < busY + busH; ty += 10) {
      ctx.beginPath();
      ctx.moveTo(busStartX, ty);
      ctx.lineTo(busEndX, ty);
      ctx.stroke();
    }

    // Motherboard bus title and latency clearly placed BELOW the bus (Zero collisions!)
    ctx.fillStyle = '#f59e0b';
    ctx.font = '800 10px Inter, system-ui, sans-serif';
    ctx.fillText('MOTHERBOARD BUS', busStartX + 10, busY + busH + 16);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 8.5px Inter, system-ui, sans-serif';
    ctx.fillText('~70 ns Latency (Slow Trip)', busStartX + 10, busY + busH + 28);

    // Visual Traffic Jam / Bottleneck Barricade when RAM Stalls occur
    if (isAnyStalled) {
      // Draw flashing bottleneck barrier at the CPU Die exit
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.fillRect(busStartX - 4, busY + 4, 6, busH - 8);

      // Warning queue tag
      ctx.fillStyle = '#ef4444';
      ctx.font = '800 9px Inter, system-ui, sans-serif';
      ctx.fillText('⛔ BUS BOTTLENECK: QUEUE BACKED UP', busStartX + 4, busY + 28);
    }

    // -----------------------------------------------------------------------
    // 6. SYSTEM RAM (Off-Chip DRAM Modules — "The School Library")
    // -----------------------------------------------------------------------
    const ramX = 880, ramY = 35, ramW = 156, ramH = 390;

    // Green / Slate DRAM Module PCB
    ctx.fillStyle = '#06281e';
    drawRoundRect(ctx, ramX, ramY, ramW, ramH, 8);
    ctx.fill();

    ctx.strokeStyle = perfState.ramFlashTimer > 0 ? '#10b981' : '#059669';
    ctx.lineWidth = perfState.ramFlashTimer > 0 ? 2.5 : 1.5;
    ctx.stroke();

    // Gold contact edge fingers on left
    ctx.fillStyle = '#f59e0b';
    for (let gy = ramY + 16; gy < ramY + ramH - 12; gy += 14) {
      ctx.fillRect(ramX - 5, gy, 5, 8);
    }

    // RAM Module Header
    ctx.fillStyle = '#34d399';
    ctx.font = '800 11.5px Inter, system-ui, sans-serif';
    ctx.fillText('SYSTEM RAM (DRAM)', ramX + 12, ramY + 22);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 9px Inter, system-ui, sans-serif';
    ctx.fillText('"The Library" • ~70 ns Access', ramX + 12, ramY + 36);

    // 4 DRAM IC Chips
    for (let c = 0; c < 4; c++) {
      const chipY = ramY + 52 + c * 76;
      ctx.fillStyle = '#0d1829';
      drawRoundRect(ctx, ramX + 14, chipY, ramW - 28, 64, 4);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '700 9px font-mono, monospace';
      ctx.fillText(`DRAM BANK ${c}`, ramX + 22, chipY + 18);
      ctx.fillStyle = '#475569';
      ctx.font = '500 8px font-mono, monospace';
      ctx.fillText('4096 MB Dynamic RAM', ramX + 22, chipY + 32);
      ctx.fillText('Capacitor Refresh Cycle', ramX + 22, chipY + 46);
    }

    // RAM Activity Status Indicator
    const isRamBusy = perfState.ramFlashTimer > 0;
    ctx.fillStyle = isRamBusy ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.1)';
    drawRoundRect(ctx, ramX + 14, ramY + ramH - 28, ramW - 28, 20, 4);
    ctx.fill();

    ctx.fillStyle = isRamBusy ? '#10b981' : '#64748b';
    ctx.font = '700 9px Inter, system-ui, sans-serif';
    ctx.fillText(isRamBusy ? '● READING FROM RAM...' : '○ RAM BUS IDLE', ramX + 24, ramY + ramH - 15);

    // -----------------------------------------------------------------------
    // 7. ANIMATED DATA PACKETS IN FLIGHT (Strictly along copper conduits!)
    // -----------------------------------------------------------------------
    for (let p = 0; p < perfState.packets.length; p++) {
      const pkt = perfState.packets[p];
      ctx.save();

      // Glowing packet body
      ctx.fillStyle = pkt.color;
      ctx.shadowColor = pkt.color;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.arc(pkt.x, pkt.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Outer pulse aura
      ctx.fillStyle = pkt.color;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(pkt.x, pkt.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // =========================================================================
  // 4. INITIALIZATION ENTRYPOINT
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
