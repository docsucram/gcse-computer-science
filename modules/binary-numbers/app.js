/**
 * GCSE Numbers & Characters Module Logic
 * Pure Vanilla JavaScript (ES6+) - Zero build tools required
 * Aligned with AQA 8525 §3.3.1 & §3.3.2
 */

(function () {
  'use strict';

  // Flag to prevent recursion during live 3-way converter sync
  let isSyncing = false;

  // =========================================================================
  // 1. STATE MANAGEMENT
  // =========================================================================

  const state = {
    // Tab 1: Register
    bits: [0, 0, 0, 0, 0, 0, 0, 0], // index 0 = LSB (1), index 7 = MSB (128 / -128)
    numberMode: 'unsigned', // 'unsigned' | 'twos'

    // Tab 2: Addition
    rowA: [1, 0, 1, 1, 0, 1, 0, 0], // LSB at 0 (val 45: 32+8+4+1)
    rowB: [0, 1, 1, 0, 1, 0, 0, 0], // LSB at 0 (val 22: 16+4+2)

    // Tab 2: Subtraction (Two's Comp A - B)
    subA: [0, 0, 1, 0, 1, 1, 0, 0], // LSB at 0 (val 52: 32+16+4)
    subB: [1, 1, 0, 0, 1, 0, 0, 0], // LSB at 0 (val 19: 16+2+1)

    // Tab 2: Bitwise Logic
    logicA: [0, 1, 1, 0, 1, 0, 1, 1], // LSB at 0 (val 214)
    logicB: [1, 1, 1, 1, 0, 0, 0, 0], // LSB at 0 (val 15)
    logicOp: 'AND', // 'AND' | 'OR' | 'XOR' | 'NOT'

    // Tab 2: Shifts
    shiftValue: 20, // 00010100 in 8-bit
  };

  // =========================================================================
  // 2. DOM ELEMENTS
  // =========================================================================

  const DOM = {
    // Theme
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    sunIcon: document.getElementById('sunIcon'),
    moonIcon: document.getElementById('moonIcon'),

    // Main View Tabs
    tabButtons: document.querySelectorAll('.view-tab-btn'),
    tabViews: document.querySelectorAll('.tab-view'),

    // Tab 1: Register
    btnModeBinary: document.getElementById('btnModeBinary'),
    btnModeHex: document.getElementById('btnModeHex'),
    btnModeUnsigned: document.getElementById('btnModeUnsigned') || document.getElementById('btnModeBinary'),
    btnModeTwosComp: document.getElementById('btnModeTwosComp'),
    hexDirectInputBar: document.getElementById('hexDirectInputBar'),
    topLiveHexInput: document.getElementById('topLiveHexInput'),
    btnTopHexStepUp: document.getElementById('btnTopHexStepUp'),
    btnTopHexStepDown: document.getElementById('btnTopHexStepDown'),
    topHexHighNibbleText: document.getElementById('topHexHighNibbleText'),
    topHexLowNibbleText: document.getElementById('topHexLowNibbleText'),
    quickHexPresets: document.querySelectorAll('.quick-hex-preset'),
    msbPlaceValueLabel: document.getElementById('msbPlaceValueLabel'),
    bitCards: document.querySelectorAll('.bit-card'),
    highNibbleHexBadge: document.getElementById('highNibbleHexBadge'),
    lowNibbleHexBadge: document.getElementById('lowNibbleHexBadge'),
    summaryDenary: document.getElementById('summaryDenary'),
    summaryAdditionBreakdown: document.getElementById('summaryAdditionBreakdown'),
    summaryHex: document.getElementById('summaryHex'),
    summaryBinary: document.getElementById('summaryBinary'),
    twosComplementExplainer: document.getElementById('twosComplementExplainer'),
    twosStepTrace: document.getElementById('twosStepTrace'),
    btnDecrementBit: document.getElementById('btnDecrementBit'),
    btnIncrementBit: document.getElementById('btnIncrementBit'),
    btnResetBits: document.getElementById('btnResetBits'),
    btnInvertBits: document.getElementById('btnInvertBits'),
    btnRandomBits: document.getElementById('btnRandomBits'),

    // Tab 1: 3-Way Live Converter
    liveDenaryInput: document.getElementById('liveDenaryInput'),
    liveHexInput: document.getElementById('liveHexInput'),
    liveBinaryInput: document.getElementById('liveBinaryInput'),
    stepUpDenary: document.getElementById('stepUpDenary'),
    stepDownDenary: document.getElementById('stepDownDenary'),
    stepUpHex: document.getElementById('stepUpHex'),
    stepDownHex: document.getElementById('stepDownHex'),
    stepUpBinary: document.getElementById('stepUpBinary'),
    stepDownBinary: document.getElementById('stepDownBinary'),

    // Tab 2: Maths Sub-modes
    mathsModeButtons: document.querySelectorAll('.maths-mode-btn'),
    mathsSections: document.querySelectorAll('.maths-section'),

    // Tab 2: Binary Adder
    digitCellsA: document.querySelectorAll('.digit-input-cell[data-row="a"]'),
    digitCellsB: document.querySelectorAll('.digit-input-cell[data-row="b"]'),
    denaryValA: document.getElementById('denaryValA'),
    denaryValB: document.getElementById('denaryValB'),
    denaryValSum: document.getElementById('denaryValSum'),
    overflowAlert: document.getElementById('overflowAlert'),
    btnExampleOverflow: document.getElementById('btnExampleOverflow'),
    btnResetAdder: document.getElementById('btnResetAdder'),
    calcAddInputA: document.getElementById('calcAddInputA'),
    calcAddInputB: document.getElementById('calcAddInputB'),
    calcAddHexA: document.getElementById('calcAddHexA'),
    calcAddHexB: document.getElementById('calcAddHexB'),
    calcAddResultNum: document.getElementById('calcAddResultNum'),
    calcAddResultHex: document.getElementById('calcAddResultHex'),

    // Tab 2: Two's Complement Subtraction
    subStep1Bits: document.getElementById('subStep1Bits'),
    subStep1Label: document.getElementById('subStep1Label'),
    subStep2Bits: document.getElementById('subStep2Bits'),
    subStep2Label: document.getElementById('subStep2Label'),
    subVerificationLabel: document.getElementById('subVerificationLabel'),
    digitCellsSubA: document.querySelectorAll('.digit-input-cell[data-sub-row="a"]'),
    digitCellsSubB: document.querySelectorAll('.digit-input-cell[data-sub-row="b"]'),
    subDenaryA: document.getElementById('subDenaryA'),
    subDenaryOrigB: document.getElementById('subDenaryOrigB'),
    subDenaryNegB: document.getElementById('subDenaryNegB'),
    subDenaryResult: document.getElementById('subDenaryResult'),
    subCarryRuleBox: document.getElementById('subCarryRuleBox'),
    btnSubPreset1: document.getElementById('btnSubPreset1'),
    btnSubPreset2: document.getElementById('btnSubPreset2'),
    btnSubPreset3: document.getElementById('btnSubPreset3'),
    btnSubPreset4: document.getElementById('btnSubPreset4'),
    btnSubPreset5: document.getElementById('btnSubPreset5'),
    calcSubInputA: document.getElementById('calcSubInputA'),
    calcSubInputB: document.getElementById('calcSubInputB'),
    calcSubHexA: document.getElementById('calcSubHexA'),
    calcSubHexB: document.getElementById('calcSubHexB'),
    calcSubResultNum: document.getElementById('calcSubResultNum'),
    calcSubResultHex: document.getElementById('calcSubResultHex'),
    btnResetSub: document.getElementById('btnResetSub'),

    // Tab 2: Bitwise Logic
    logicOpButtons: document.querySelectorAll('.logic-op-btn'),
    digitCellsLogicA: document.querySelectorAll('.digit-input-cell[data-logic-row="a"]'),
    digitCellsLogicB: document.querySelectorAll('.digit-input-cell[data-logic-row="b"]'),
    logicOpLabel: document.getElementById('logicOpLabel'),
    logicDenaryA: document.getElementById('logicDenaryA'),
    logicDenaryB: document.getElementById('logicDenaryB'),
    logicDenaryRes: document.getElementById('logicDenaryRes'),
    logicOpTitle: document.getElementById('logicOpTitle'),
    logicOpDesc: document.getElementById('logicOpDesc'),
    logicOpExamTip: document.getElementById('logicOpExamTip'),
    btnMaskNibble: document.getElementById('btnMaskNibble'),
    btnMaskOddEven: document.getElementById('btnMaskOddEven'),
    btnMaskToggle: document.getElementById('btnMaskToggle'),
    btnResetLogic: document.getElementById('btnResetLogic'),
    calcLogicInputA: document.getElementById('calcLogicInputA'),
    calcLogicInputB: document.getElementById('calcLogicInputB'),
    calcLogicHexA: document.getElementById('calcLogicHexA'),
    calcLogicHexB: document.getElementById('calcLogicHexB'),
    calcLogicResultNum: document.getElementById('calcLogicResultNum'),
    calcLogicResultHex: document.getElementById('calcLogicResultHex'),

    // Tab 2: Logical Shifts
    shiftBitsDisplay: document.getElementById('shiftBitsDisplay'),
    shiftDenaryDisplay: document.getElementById('shiftDenaryDisplay'),
    btnShiftLeft1: document.getElementById('btnShiftLeft1'),
    btnShiftLeft2: document.getElementById('btnShiftLeft2'),
    btnShiftRight1: document.getElementById('btnShiftRight1'),
    btnShiftRight2: document.getElementById('btnShiftRight2'),
    btnResetShift: document.getElementById('btnResetShift'),
    calcShiftInput: document.getElementById('calcShiftInput'),
    calcShiftHex: document.getElementById('calcShiftHex'),

    // Tab 3: Units
    scaleUnitButtons: document.querySelectorAll('.scale-unit-btn'),
    sliderDataScale: document.getElementById('sliderDataScale'),
    scaleDisplayCard: document.getElementById('scaleDisplayCard'),
    scaleUnitName: document.getElementById('scaleUnitName'),
    scaleScaleName: document.getElementById('scaleScaleName'),
    scaleZerosBadge: document.getElementById('scaleZerosBadge'),
    scaleZerosWritten: document.getElementById('scaleZerosWritten'),
    scaleBinaryComp: document.getElementById('scaleBinaryComp'),
    scaleMp3Time: document.getElementById('scaleMp3Time'),
    scaleMp3Analogy: document.getElementById('scaleMp3Analogy'),
    scaleRealWorldSummary: document.getElementById('scaleRealWorldSummary'),
    scaleRealWorldDesc: document.getElementById('scaleRealWorldDesc'),
    inputAdvertisedGb: document.getElementById('inputAdvertisedGb'),
    storageTrapCalculation: document.getElementById('storageTrapCalculation'),
    storageTrapDifference: document.getElementById('storageTrapDifference'),
    storagePresetButtons: document.querySelectorAll('.storage-preset-btn'),

    // Tab 4: Characters
    textEncoderInput: document.getElementById('textEncoderInput'),
    charTokenStream: document.getElementById('charTokenStream'),
    fullBinaryOutputBox: document.getElementById('fullBinaryOutputBox'),
    encoderByteStats: document.getElementById('encoderByteStats'),
    fullHexOutputLabel: document.getElementById('fullHexOutputLabel'),
    btnCopyBinary: document.getElementById('btnCopyBinary'),
    presetTextButtons: document.querySelectorAll('.preset-text-btn'),

    // Tab 1: Target Practice Challenge
    btnToggleAudio: document.getElementById('btnToggleAudio'),
    btnPracticeRelaxed: document.getElementById('btnPracticeRelaxed'),
    btnPracticeSprint: document.getElementById('btnPracticeSprint'),
    btnTargetBaseDenary: document.getElementById('btnTargetBaseDenary'),
    btnTargetBaseHex: document.getElementById('btnTargetBaseHex'),
    streakBadge: document.getElementById('streakBadge'),
    currentStreakVal: document.getElementById('currentStreakVal'),
    sprintTimerBox: document.getElementById('sprintTimerBox'),
    sprintTimerVal: document.getElementById('sprintTimerVal'),
    sprintScoreBox: document.getElementById('sprintScoreBox'),
    sprintScoreVal: document.getElementById('sprintScoreVal'),
    sprintBestBox: document.getElementById('sprintBestBox'),
    sprintBestVal: document.getElementById('sprintBestVal'),
    sprintActiveTimerBanner: document.getElementById('sprintActiveTimerBanner'),
    sprintBigCountdown: document.getElementById('sprintBigCountdown'),
    sprintTimerProgress: document.getElementById('sprintTimerProgress'),
    sprintStartLauncherCard: document.getElementById('sprintStartLauncherCard'),
    sprintLauncherBestVal: document.getElementById('sprintLauncherBestVal'),
    sprintGameOverCard: document.getElementById('sprintGameOverCard'),
    sprintFinalScoreVal: document.getElementById('sprintFinalScoreVal'),
    sprintNewRecordBadge: document.getElementById('sprintNewRecordBadge'),
    btnPlayAgainSprint: document.getElementById('btnPlayAgainSprint'),
    btnBackToRelaxed: document.getElementById('btnBackToRelaxed'),
    targetCardContainer: document.getElementById('targetCardContainer'),
    targetBaseLabel: document.getElementById('targetBaseLabel'),
    targetNumberDisplay: document.getElementById('targetNumberDisplay'),
    targetCurrentVal: document.getElementById('targetCurrentVal'),
    targetDiffBadge: document.getElementById('targetDiffBadge'),
    btnSkipTarget: document.getElementById('btnSkipTarget'),
    btnStartSprint: document.getElementById('btnStartSprint'),

    // Tab 1: Hex RGB Colour Playground
    sliderHexR: document.getElementById('sliderHexR'),
    sliderHexG: document.getElementById('sliderHexG'),
    sliderHexB: document.getElementById('sliderHexB'),
    hexRLabel: document.getElementById('hexRLabel'),
    hexGLabel: document.getElementById('hexGLabel'),
    hexBLabel: document.getElementById('hexBLabel'),
    hexColorSwatch: document.getElementById('hexColorSwatch'),
    hexSwatchText: document.getElementById('hexSwatchText'),
    colorPresetButtons: document.querySelectorAll('.color-preset-btn'),
  };

  // =========================================================================
  // 3. THEME & NAVIGATION
  // =========================================================================

  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        const nextTheme = isDark ? 'light' : 'dark';
        applyTheme(nextTheme);
        localStorage.setItem('theme', nextTheme);
      });
    }
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      if (DOM.sunIcon) DOM.sunIcon.style.display = 'block';
      if (DOM.moonIcon) DOM.moonIcon.style.display = 'none';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      if (DOM.sunIcon) DOM.sunIcon.style.display = 'none';
      if (DOM.moonIcon) DOM.moonIcon.style.display = 'block';
    }
  }

  function initTabs() {
    DOM.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        DOM.tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        DOM.tabViews.forEach(view => {
          view.classList.remove('active');
          if (view.id === `tab-${tabId}`) {
            view.classList.add('active');
          }
        });
      });
    });

    // Maths mode selector tabs in Tab 2
    DOM.mathsModeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetSection = btn.getAttribute('data-maths-section');
        DOM.mathsModeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        DOM.mathsSections.forEach(sec => {
          sec.classList.remove('active');
          if (sec.id === `maths-section-${targetSection}`) {
            sec.classList.add('active');
          }
        });
      });
    });
  }

  // =========================================================================
  // 4. TAB 1: 8-BIT REGISTER, HEX & 3-WAY LIVE CONVERTER
  // =========================================================================

  function bitsToUnsigned(bitsArray) {
    let val = 0;
    for (let i = 0; i < 8; i++) {
      if (bitsArray[i] === 1) val += Math.pow(2, i);
    }
    return val;
  }

  function bitsToTwosComp(bitsArray) {
    let val = 0;
    for (let i = 0; i < 8; i++) {
      if (bitsArray[i] === 1) {
        if (i === 7) val -= 128;
        else val += Math.pow(2, i);
      }
    }
    return val;
  }

  function renderRegister() {
    // 1. Update bit switches & bulbs
    for (let i = 0; i < 8; i++) {
      const bitVal = state.bits[i];
      const bulb = document.getElementById(`bulb-${i}`);
      const card = document.querySelector(`.bit-card[data-bit="${i}"]`);
      if (bulb) bulb.textContent = bitVal;
      if (card) card.classList.toggle('active', bitVal === 1);
    }

    // 2. High & Low Nibbles (Hexadecimal)
    const highVal = (state.bits[7] << 3) | (state.bits[6] << 2) | (state.bits[5] << 1) | state.bits[4];
    const lowVal = (state.bits[3] << 3) | (state.bits[2] << 2) | (state.bits[1] << 1) | state.bits[0];

    const highHexChar = highVal.toString(16).toUpperCase();
    const lowHexChar = lowVal.toString(16).toUpperCase();

    if (DOM.highNibbleHexBadge) DOM.highNibbleHexBadge.textContent = `Hex: ${highHexChar} (${highVal})`;
    if (DOM.lowNibbleHexBadge) DOM.lowNibbleHexBadge.textContent = `Hex: ${lowHexChar} (${lowVal})`;

    // 3. Denary Value
    let denary = 0;
    const activePlaceValues = [];

    for (let i = 0; i < 8; i++) {
      if (state.bits[i] === 1) {
        if (i === 7 && state.numberMode === 'twos') {
          denary -= 128;
          activePlaceValues.push('-128');
        } else {
          const pv = Math.pow(2, i);
          denary += pv;
          activePlaceValues.push(pv.toString());
        }
      }
    }

    if (DOM.summaryDenary) DOM.summaryDenary.textContent = denary;

    // Hex display: No "0x" in primary exam display
    if (DOM.summaryHex) DOM.summaryHex.textContent = `${highHexChar}${lowHexChar}`;

    const binStrHigh = `${state.bits[7]}${state.bits[6]}${state.bits[5]}${state.bits[4]}`;
    const binStrLow = `${state.bits[3]}${state.bits[2]}${state.bits[1]}${state.bits[0]}`;
    const rawBinary = `${binStrHigh}${binStrLow}`;
    if (DOM.summaryBinary) DOM.summaryBinary.textContent = `${binStrHigh} ${binStrLow}`;

    // Addition breakdown string
    if (DOM.summaryAdditionBreakdown) {
      if (activePlaceValues.length === 0) {
        DOM.summaryAdditionBreakdown.textContent = 'All bits are 0';
      } else {
        DOM.summaryAdditionBreakdown.textContent = `${activePlaceValues.join(' + ')} = ${denary}`;
      }
    }

    // Two's complement step-by-step trace
    if (state.numberMode === 'twos') {
      if (DOM.twosComplementExplainer) DOM.twosComplementExplainer.style.display = 'block';
      if (DOM.twosStepTrace) {
        if (state.bits[7] === 1) {
          DOM.twosStepTrace.innerHTML = `
            <strong>Sign:</strong> MSB is 1 &rarr; Negative number.<br>
            <strong>Magnitude Check:</strong> Invert bits (${rawBinary} &rarr; ${invertString(rawBinary)}), then add 1 &rarr; ${Math.abs(denary)}. Result: <strong>${denary}</strong>.
          `;
        } else {
          DOM.twosStepTrace.innerHTML = `
            <strong>Sign:</strong> MSB is 0 &rarr; Positive number. Evaluates normally as <strong>+${denary}</strong>.
          `;
        }
      }
    } else {
      if (DOM.twosComplementExplainer) DOM.twosComplementExplainer.style.display = 'none';
    }

    // 4. Synchronize 3-Way Converter Inputs (if not user-typed)
    if (!isSyncing) {
      if (DOM.liveDenaryInput) DOM.liveDenaryInput.value = denary;
      if (DOM.liveHexInput) DOM.liveHexInput.value = `${highHexChar}${lowHexChar}`;
      if (DOM.liveBinaryInput) DOM.liveBinaryInput.value = rawBinary;
    }

    // Synchronize Direct Hex Input Bar at top (if not currently focused)
    if (DOM.topLiveHexInput && document.activeElement !== DOM.topLiveHexInput) {
      DOM.topLiveHexInput.value = `${highHexChar}${lowHexChar}`;
    }
    if (DOM.topHexHighNibbleText) {
      DOM.topHexHighNibbleText.textContent = `${highHexChar} (${binStrHigh})`;
    }
    if (DOM.topHexLowNibbleText) {
      DOM.topHexLowNibbleText.textContent = `${lowHexChar} (${binStrLow})`;
    }

    // 5. Update Target Challenge Feedback
    updateTargetFeedback();
  }

  function invertString(binStr) {
    return binStr.split('').map(b => (b === '1' ? '0' : '1')).join('');
  }

  function stepRegister(delta) {
    playSynthSound('click');
    const currentUnsigned = bitsToUnsigned(state.bits);
    const nextUnsigned = (currentUnsigned + delta + 256) % 256;
    for (let i = 0; i < 8; i++) {
      state.bits[i] = (nextUnsigned >> i) & 1;
    }
    renderRegister();
  }

  function setNumberMode(mode) {
    state.numberMode = mode;
    const isBinary = mode === 'binary' || mode === 'unsigned';
    if (DOM.btnModeBinary) DOM.btnModeBinary.classList.toggle('active', isBinary);
    if (DOM.btnModeUnsigned) DOM.btnModeUnsigned.classList.toggle('active', isBinary);
    if (DOM.btnModeHex) DOM.btnModeHex.classList.toggle('active', mode === 'hex');
    if (DOM.btnModeTwosComp) DOM.btnModeTwosComp.classList.toggle('active', mode === 'twos');

    if (DOM.hexDirectInputBar) {
      DOM.hexDirectInputBar.style.display = mode === 'hex' ? 'flex' : 'none';
      if (mode === 'hex' && DOM.topLiveHexInput) {
        DOM.topLiveHexInput.focus();
        DOM.topLiveHexInput.select();
      }
    }

    if (DOM.msbPlaceValueLabel) {
      if (mode === 'twos') {
        DOM.msbPlaceValueLabel.textContent = '-128';
        DOM.msbPlaceValueLabel.classList.add('msb-negative');
        if (DOM.liveDenaryInput) {
          DOM.liveDenaryInput.min = "-128";
          DOM.liveDenaryInput.max = "127";
          DOM.liveDenaryInput.placeholder = "-128 to 127";
        }
      } else {
        DOM.msbPlaceValueLabel.textContent = '128';
        DOM.msbPlaceValueLabel.classList.remove('msb-negative');
        if (DOM.liveDenaryInput) {
          DOM.liveDenaryInput.min = "0";
          DOM.liveDenaryInput.max = "255";
          DOM.liveDenaryInput.placeholder = "0 - 255";
        }
      }
    }
    renderRegister();
  }

  function setupRegisterEvents() {
    // Mode toggles
    if (DOM.btnModeBinary) DOM.btnModeBinary.addEventListener('click', () => setNumberMode('binary'));
    if (DOM.btnModeHex) DOM.btnModeHex.addEventListener('click', () => setNumberMode('hex'));
    if (DOM.btnModeUnsigned) DOM.btnModeUnsigned.addEventListener('click', () => setNumberMode('binary'));
    if (DOM.btnModeTwosComp) DOM.btnModeTwosComp.addEventListener('click', () => setNumberMode('twos'));

    // Direct Hex input events
    if (DOM.topLiveHexInput) {
      DOM.topLiveHexInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 2);
        e.target.value = val;
        if (val === '') val = '0';
        const num = parseInt(val, 16);
        if (!isNaN(num) && num >= 0 && num <= 255) {
          for (let i = 0; i < 8; i++) {
            state.bits[i] = (num >> i) & 1;
          }
          renderRegister();
        }
      });
    }

    if (DOM.btnTopHexStepUp) {
      DOM.btnTopHexStepUp.addEventListener('click', () => stepRegister(1));
    }
    if (DOM.btnTopHexStepDown) {
      DOM.btnTopHexStepDown.addEventListener('click', () => stepRegister(-1));
    }

    if (DOM.quickHexPresets) {
      DOM.quickHexPresets.forEach(btn => {
        btn.addEventListener('click', () => {
          playSynthSound('click');
          const hex = btn.getAttribute('data-hex');
          const num = parseInt(hex, 16);
          for (let i = 0; i < 8; i++) {
            state.bits[i] = (num >> i) & 1;
          }
          renderRegister();
        });
      });
    }

    // Bit Card Toggles
    DOM.bitCards.forEach(card => {
      card.addEventListener('click', () => {
        playSynthSound('click');
        const bitIdx = parseInt(card.getAttribute('data-bit'), 10);
        state.bits[bitIdx] = state.bits[bitIdx] === 1 ? 0 : 1;
        renderRegister();
      });
    });

    // Stepper buttons (+1 / -1) on main register
    if (DOM.btnIncrementBit) {
      DOM.btnIncrementBit.addEventListener('click', () => stepRegister(1));
    }
    if (DOM.btnDecrementBit) {
      DOM.btnDecrementBit.addEventListener('click', () => stepRegister(-1));
    }

    // Stepper buttons on 3-Way Converter cards (Denary, Hex, Binary)
    ['stepUpDenary', 'stepUpHex', 'stepUpBinary'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => stepRegister(1));
    });
    ['stepDownDenary', 'stepDownHex', 'stepDownBinary'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => stepRegister(-1));
    });

    // Reset button
    if (DOM.btnResetBits) {
      DOM.btnResetBits.addEventListener('click', () => {
        state.bits = [0, 0, 0, 0, 0, 0, 0, 0];
        renderRegister();
      });
    }

    // Invert button
    if (DOM.btnInvertBits) {
      DOM.btnInvertBits.addEventListener('click', () => {
        state.bits = state.bits.map(b => (b === 1 ? 0 : 1));
        renderRegister();
      });
    }

    // Random button
    if (DOM.btnRandomBits) {
      DOM.btnRandomBits.addEventListener('click', () => {
        state.bits = state.bits.map(() => (Math.random() > 0.5 ? 1 : 0));
        renderRegister();
      });
    }

    // 3-Way Synchronized Live Converter Event Listeners
    // 1. Denary Input
    if (DOM.liveDenaryInput) {
      DOM.liveDenaryInput.addEventListener('input', (e) => {
        const rawVal = e.target.value.trim();
        if (rawVal === '' || rawVal === '-') return;

        let num = parseInt(rawVal, 10);
        if (isNaN(num)) return;

        isSyncing = true;
        if (state.numberMode === 'twos') {
          if (num > 127) num = 127;
          if (num < -128) num = -128;
          const unsignedByte = (num + 256) & 0xFF;
          for (let i = 0; i < 8; i++) {
            state.bits[i] = (unsignedByte >> i) & 1;
          }
        } else {
          if (num > 255) num = 255;
          if (num < 0) num = 0;
          for (let i = 0; i < 8; i++) {
            state.bits[i] = (num >> i) & 1;
          }
        }

        renderRegister();
        // Update sister inputs
        const highVal = (state.bits[7] << 3) | (state.bits[6] << 2) | (state.bits[5] << 1) | state.bits[4];
        const lowVal = (state.bits[3] << 3) | (state.bits[2] << 2) | (state.bits[1] << 1) | state.bits[0];
        const hex = `${highVal.toString(16).toUpperCase()}${lowVal.toString(16).toUpperCase()}`;
        const bin = `${state.bits[7]}${state.bits[6]}${state.bits[5]}${state.bits[4]}${state.bits[3]}${state.bits[2]}${state.bits[1]}${state.bits[0]}`;
        if (DOM.liveHexInput) DOM.liveHexInput.value = hex;
        if (DOM.liveBinaryInput) DOM.liveBinaryInput.value = bin;
        isSyncing = false;
      });
    }

    // 2. Hex Input
    if (DOM.liveHexInput) {
      DOM.liveHexInput.addEventListener('input', (e) => {
        let cleanHex = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 2).toUpperCase();
        e.target.value = cleanHex;
        if (cleanHex === '') return;

        isSyncing = true;
        const num = parseInt(cleanHex, 16);
        for (let i = 0; i < 8; i++) {
          state.bits[i] = (num >> i) & 1;
        }

        renderRegister();
        // Update denary and binary inputs
        let denary = 0;
        for (let i = 0; i < 8; i++) {
          if (state.bits[i] === 1) {
            if (i === 7 && state.numberMode === 'twos') denary -= 128;
            else denary += Math.pow(2, i);
          }
        }
        const bin = `${state.bits[7]}${state.bits[6]}${state.bits[5]}${state.bits[4]}${state.bits[3]}${state.bits[2]}${state.bits[1]}${state.bits[0]}`;
        if (DOM.liveDenaryInput) DOM.liveDenaryInput.value = denary;
        if (DOM.liveBinaryInput) DOM.liveBinaryInput.value = bin;
        isSyncing = false;
      });
    }

    // 3. Binary Input
    if (DOM.liveBinaryInput) {
      DOM.liveBinaryInput.addEventListener('input', (e) => {
        let cleanBin = e.target.value.replace(/[^01]/g, '').slice(0, 8);
        e.target.value = cleanBin;
        if (cleanBin.length === 0) return;

        isSyncing = true;
        // Pad with leading 0s to 8 bits
        const padded = cleanBin.padStart(8, '0');
        for (let i = 0; i < 8; i++) {
          state.bits[i] = padded[7 - i] === '1' ? 1 : 0;
        }

        renderRegister();
        // Update denary and hex
        let denary = 0;
        for (let i = 0; i < 8; i++) {
          if (state.bits[i] === 1) {
            if (i === 7 && state.numberMode === 'twos') denary -= 128;
            else denary += Math.pow(2, i);
          }
        }
        const highVal = (state.bits[7] << 3) | (state.bits[6] << 2) | (state.bits[5] << 1) | state.bits[4];
        const lowVal = (state.bits[3] << 3) | (state.bits[2] << 2) | (state.bits[1] << 1) | state.bits[0];
        const hex = `${highVal.toString(16).toUpperCase()}${lowVal.toString(16).toUpperCase()}`;
        if (DOM.liveDenaryInput) DOM.liveDenaryInput.value = denary;
        if (DOM.liveHexInput) DOM.liveHexInput.value = hex;
        isSyncing = false;
      });
    }
  }

  // =========================================================================
  // 4B. TAB 1: AUDIO SYNTH, TARGET CHALLENGE & HEX RGB PLAYGROUND
  // =========================================================================

  let audioCtx = null;
  let isAudioMuted = false;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSynthSound(type) {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'success') {
        // Two-tone cheerful major third chime (C5 -> E5)
        [523.25, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.25);
        });
      }
    } catch (e) {
      // Autoplay policy fallback
    }
  }

  // --- TARGET PRACTICE CHALLENGE ---
  const targetState = {
    target: 42,
    targetBase: 'denary', // 'denary' | 'hex'
    streak: 0,
    isSprint: false,
    sprintRunning: false,
    sprintTimeLeft: 60,
    sprintScore: 0,
    sprintTimerId: null,
    sprintBest: parseInt(localStorage.getItem('binary_sprint_best_60s') || '0', 10),
  };

  function rollNewTarget() {
    let next;
    do {
      next = Math.floor(Math.random() * 254) + 1;
    } while (next === targetState.target);

    targetState.target = next;
    renderTargetDisplay();
    updateTargetFeedback();
  }

  function renderTargetDisplay() {
    if (!DOM.targetNumberDisplay) return;
    if (targetState.targetBase === 'hex') {
      DOM.targetNumberDisplay.textContent = targetState.target.toString(16).toUpperCase().padStart(2, '0');
      if (DOM.targetBaseLabel) DOM.targetBaseLabel.textContent = 'Hex Target:';
    } else {
      DOM.targetNumberDisplay.textContent = targetState.target;
      if (DOM.targetBaseLabel) DOM.targetBaseLabel.textContent = 'Denary Target:';
    }
  }

  function updateTargetFeedback() {
    if (!DOM.targetCurrentVal) return;
    const currentDenary = bitsToUnsigned(state.bits);

    if (targetState.targetBase === 'hex') {
      const curHex = currentDenary.toString(16).toUpperCase().padStart(2, '0');
      DOM.targetCurrentVal.textContent = `${curHex} (${currentDenary})`;
    } else {
      DOM.targetCurrentVal.textContent = currentDenary;
    }

    const diff = targetState.target - currentDenary;
    if (diff === 0) {
      // MATCH!
      DOM.targetDiffBadge.textContent = '🎉 MATCH!';
      DOM.targetDiffBadge.style.background = 'rgba(16, 185, 129, 0.2)';
      DOM.targetDiffBadge.style.color = '#10b981';

      if (DOM.targetCardContainer) {
        DOM.targetCardContainer.classList.add('target-card-matched');
        setTimeout(() => {
          DOM.targetCardContainer.classList.remove('target-card-matched');
        }, 500);
      }

      playSynthSound('success');

      if (targetState.isSprint && targetState.sprintRunning) {
        targetState.sprintScore++;
        if (DOM.sprintScoreVal) DOM.sprintScoreVal.textContent = targetState.sprintScore;
        if (targetState.sprintScore > targetState.sprintBest) {
          targetState.sprintBest = targetState.sprintScore;
          localStorage.setItem('binary_sprint_best_60s', targetState.sprintBest.toString());
          if (DOM.sprintBestVal) DOM.sprintBestVal.textContent = targetState.sprintBest;
          if (DOM.sprintLauncherBestVal) DOM.sprintLauncherBestVal.textContent = targetState.sprintBest;
        }
      } else if (!targetState.isSprint) {
        targetState.streak++;
        if (DOM.currentStreakVal) DOM.currentStreakVal.textContent = targetState.streak;
      }

      setTimeout(() => {
        rollNewTarget();
      }, 450);
    } else if (diff > 0) {
      if (targetState.targetBase === 'hex') {
        DOM.targetDiffBadge.textContent = `Needs +${diff} (0x${diff.toString(16).toUpperCase()})`;
      } else {
        DOM.targetDiffBadge.textContent = `Needs +${diff}`;
      }
      DOM.targetDiffBadge.style.background = 'rgba(59, 130, 246, 0.15)';
      DOM.targetDiffBadge.style.color = '#3b82f6';
    } else {
      const over = Math.abs(diff);
      if (targetState.targetBase === 'hex') {
        DOM.targetDiffBadge.textContent = `Over by ${over} (0x${over.toString(16).toUpperCase()})`;
      } else {
        DOM.targetDiffBadge.textContent = `Over by ${over}`;
      }
      DOM.targetDiffBadge.style.background = 'rgba(245, 158, 11, 0.15)';
      DOM.targetDiffBadge.style.color = '#ca8a04';
    }
  }

  function startSprint() {
    targetState.sprintRunning = true;
    targetState.sprintTimeLeft = 60;
    targetState.sprintScore = 0;

    // Show active sprint views, hide launcher and game over
    if (DOM.sprintStartLauncherCard) DOM.sprintStartLauncherCard.style.display = 'none';
    if (DOM.sprintGameOverCard) DOM.sprintGameOverCard.style.display = 'none';
    if (DOM.targetCardContainer) DOM.targetCardContainer.style.display = 'block';
    if (DOM.sprintActiveTimerBanner) DOM.sprintActiveTimerBanner.style.display = 'block';

    if (DOM.sprintScoreVal) DOM.sprintScoreVal.textContent = '0';
    if (DOM.sprintTimerVal) DOM.sprintTimerVal.textContent = '60s';
    if (DOM.sprintBigCountdown) DOM.sprintBigCountdown.textContent = '60s';
    if (DOM.sprintTimerProgress) DOM.sprintTimerProgress.style.width = '100%';

    rollNewTarget();

    if (targetState.sprintTimerId) clearInterval(targetState.sprintTimerId);
    targetState.sprintTimerId = setInterval(() => {
      targetState.sprintTimeLeft--;
      const pct = Math.max(0, (targetState.sprintTimeLeft / 60) * 100);
      if (DOM.sprintTimerVal) DOM.sprintTimerVal.textContent = `${targetState.sprintTimeLeft}s`;
      if (DOM.sprintBigCountdown) DOM.sprintBigCountdown.textContent = `${targetState.sprintTimeLeft}s`;
      if (DOM.sprintTimerProgress) DOM.sprintTimerProgress.style.width = `${pct}%`;

      // Change timer colour as urgency increases
      if (DOM.sprintBigCountdown) {
        if (targetState.sprintTimeLeft <= 10) {
          DOM.sprintBigCountdown.style.color = '#ef4444';
          if (DOM.sprintTimerProgress) DOM.sprintTimerProgress.style.background = '#ef4444';
        } else if (targetState.sprintTimeLeft <= 25) {
          DOM.sprintBigCountdown.style.color = '#f59e0b';
          if (DOM.sprintTimerProgress) DOM.sprintTimerProgress.style.background = '#f59e0b';
        } else {
          DOM.sprintBigCountdown.style.color = '#ef4444';
          if (DOM.sprintTimerProgress) DOM.sprintTimerProgress.style.background = '#ef4444';
        }
      }

      if (targetState.sprintTimeLeft <= 0) {
        clearInterval(targetState.sprintTimerId);
        targetState.sprintRunning = false;

        // Hide target card and active banner, show Game Over card
        if (DOM.targetCardContainer) DOM.targetCardContainer.style.display = 'none';
        if (DOM.sprintActiveTimerBanner) DOM.sprintActiveTimerBanner.style.display = 'none';
        if (DOM.sprintGameOverCard) DOM.sprintGameOverCard.style.display = 'block';

        if (DOM.sprintFinalScoreVal) DOM.sprintFinalScoreVal.textContent = targetState.sprintScore;
        const isNewRecord = targetState.sprintScore > 0 && targetState.sprintScore >= targetState.sprintBest;
        if (DOM.sprintNewRecordBadge) {
          DOM.sprintNewRecordBadge.style.display = isNewRecord ? 'inline-block' : 'none';
        }
        playSynthSound('success');
      }
    }, 1000);
  }

  function setSprintMode(isSprint) {
    targetState.isSprint = isSprint;
    if (targetState.sprintTimerId) clearInterval(targetState.sprintTimerId);
    targetState.sprintRunning = false;

    if (isSprint) {
      if (DOM.btnPracticeSprint) DOM.btnPracticeSprint.classList.add('active');
      if (DOM.btnPracticeRelaxed) DOM.btnPracticeRelaxed.classList.remove('active');

      if (DOM.streakBadge) DOM.streakBadge.style.display = 'none';
      if (DOM.sprintTimerBox) DOM.sprintTimerBox.style.display = 'block';
      if (DOM.sprintScoreBox) DOM.sprintScoreBox.style.display = 'block';
      if (DOM.sprintBestBox) DOM.sprintBestBox.style.display = 'block';
      if (DOM.sprintBestVal) DOM.sprintBestVal.textContent = targetState.sprintBest;
      if (DOM.sprintLauncherBestVal) DOM.sprintLauncherBestVal.textContent = targetState.sprintBest;

      // Hide target card until started
      if (DOM.targetCardContainer) DOM.targetCardContainer.style.display = 'none';
      if (DOM.sprintActiveTimerBanner) DOM.sprintActiveTimerBanner.style.display = 'none';
      if (DOM.sprintGameOverCard) DOM.sprintGameOverCard.style.display = 'none';
      if (DOM.sprintStartLauncherCard) DOM.sprintStartLauncherCard.style.display = 'block';
    } else {
      if (DOM.btnPracticeRelaxed) DOM.btnPracticeRelaxed.classList.add('active');
      if (DOM.btnPracticeSprint) DOM.btnPracticeSprint.classList.remove('active');

      if (DOM.streakBadge) DOM.streakBadge.style.display = 'block';
      if (DOM.sprintTimerBox) DOM.sprintTimerBox.style.display = 'none';
      if (DOM.sprintScoreBox) DOM.sprintScoreBox.style.display = 'none';
      if (DOM.sprintBestBox) DOM.sprintBestBox.style.display = 'none';

      // Show relaxed target card, hide sprint banners
      if (DOM.targetCardContainer) DOM.targetCardContainer.style.display = 'block';
      if (DOM.sprintActiveTimerBanner) DOM.sprintActiveTimerBanner.style.display = 'none';
      if (DOM.sprintStartLauncherCard) DOM.sprintStartLauncherCard.style.display = 'none';
      if (DOM.sprintGameOverCard) DOM.sprintGameOverCard.style.display = 'none';

      targetState.streak = 0;
      if (DOM.currentStreakVal) DOM.currentStreakVal.textContent = '0';
      rollNewTarget();
    }
  }

  function setupTargetPracticeEvents() {
    if (DOM.btnToggleAudio) {
      DOM.btnToggleAudio.addEventListener('click', () => {
        isAudioMuted = !isAudioMuted;
        DOM.btnToggleAudio.textContent = isAudioMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
        if (!isAudioMuted) playSynthSound('click');
      });
    }

    if (DOM.btnTargetBaseDenary) {
      DOM.btnTargetBaseDenary.addEventListener('click', () => {
        DOM.btnTargetBaseDenary.classList.add('active');
        if (DOM.btnTargetBaseHex) DOM.btnTargetBaseHex.classList.remove('active');
        targetState.targetBase = 'denary';
        renderTargetDisplay();
        updateTargetFeedback();
        playSynthSound('click');
      });
    }

    if (DOM.btnTargetBaseHex) {
      DOM.btnTargetBaseHex.addEventListener('click', () => {
        DOM.btnTargetBaseHex.classList.add('active');
        if (DOM.btnTargetBaseDenary) DOM.btnTargetBaseDenary.classList.remove('active');
        targetState.targetBase = 'hex';
        renderTargetDisplay();
        updateTargetFeedback();
        playSynthSound('click');
      });
    }

    if (DOM.btnPracticeRelaxed) {
      DOM.btnPracticeRelaxed.addEventListener('click', () => setSprintMode(false));
    }

    if (DOM.btnBackToRelaxed) {
      DOM.btnBackToRelaxed.addEventListener('click', () => setSprintMode(false));
    }

    if (DOM.btnPracticeSprint) {
      DOM.btnPracticeSprint.addEventListener('click', () => setSprintMode(true));
    }

    if (DOM.btnStartSprint) {
      DOM.btnStartSprint.addEventListener('click', startSprint);
    }

    if (DOM.btnPlayAgainSprint) {
      DOM.btnPlayAgainSprint.addEventListener('click', startSprint);
    }

    if (DOM.btnSkipTarget) {
      DOM.btnSkipTarget.addEventListener('click', () => {
        if (!targetState.isSprint) {
          targetState.streak = 0;
          if (DOM.currentStreakVal) DOM.currentStreakVal.textContent = '0';
        }
        rollNewTarget();
      });
    }
  }

  // --- HEX RGB COLOUR MIXER PLAYGROUND ---
  function updateHexColorPlayground() {
    const r = parseInt(DOM.sliderHexR ? DOM.sliderHexR.value : '255', 10);
    const g = parseInt(DOM.sliderHexG ? DOM.sliderHexG.value : '135', 10);
    const b = parseInt(DOM.sliderHexB ? DOM.sliderHexB.value : '51', 10);

    const rHex = r.toString(16).toUpperCase().padStart(2, '0');
    const gHex = g.toString(16).toUpperCase().padStart(2, '0');
    const bHex = b.toString(16).toUpperCase().padStart(2, '0');
    const hexCode = `#${rHex}${gHex}${bHex}`;

    if (DOM.hexRLabel) DOM.hexRLabel.textContent = `${rHex} (${r})`;
    if (DOM.hexGLabel) DOM.hexGLabel.textContent = `${gHex} (${g})`;
    if (DOM.hexBLabel) DOM.hexBLabel.textContent = `${bHex} (${b})`;

    if (DOM.hexColorSwatch) {
      DOM.hexColorSwatch.style.backgroundColor = hexCode;
    }
    if (DOM.hexSwatchText) {
      DOM.hexSwatchText.textContent = hexCode;
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      DOM.hexSwatchText.style.color = luminance > 0.55 ? '#0f172a' : '#ffffff';
      DOM.hexSwatchText.style.textShadow = luminance > 0.55 ? 'none' : '0 2px 8px rgba(0,0,0,0.6)';
    }
  }

  function setupHexPlaygroundEvents() {
    [DOM.sliderHexR, DOM.sliderHexG, DOM.sliderHexB].forEach(slider => {
      if (slider) slider.addEventListener('input', updateHexColorPlayground);
    });

    if (DOM.colorPresetButtons) {
      DOM.colorPresetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const r = parseInt(btn.getAttribute('data-r'), 10);
          const g = parseInt(btn.getAttribute('data-g'), 10);
          const b = parseInt(btn.getAttribute('data-b'), 10);
          if (DOM.sliderHexR) DOM.sliderHexR.value = r;
          if (DOM.sliderHexG) DOM.sliderHexG.value = g;
          if (DOM.sliderHexB) DOM.sliderHexB.value = b;
          updateHexColorPlayground();
          playSynthSound('click');
        });
      });
    }

    updateHexColorPlayground();
  }

  // =========================================================================
  // 5. TAB 2: BINARY ADDER, TWO'S COMP SUBTRACTION, BITWISE LOGIC & SHIFTS
  // =========================================================================

  // --- SUB-MODE 1: ADDITION & OVERFLOW ---
  function calculateBinaryAddition() {
    let carry = 0;
    const sumBits = [];
    const carryBits = [];

    // Add from LSB (0) to MSB (7)
    for (let i = 0; i < 8; i++) {
      const a = state.rowA[i];
      const b = state.rowB[i];
      const sum = a + b + carry;
      sumBits[i] = sum % 2;
      carry = Math.floor(sum / 2);
      carryBits[i] = carry;
    }

    const hasOverflow = carry > 0;

    // Render cells in adder grid
    for (let i = 0; i < 8; i++) {
      // Cell A
      const cellA = document.querySelector(`.digit-input-cell[data-row="a"][data-col="${i}"]`);
      if (cellA) {
        cellA.textContent = state.rowA[i];
        cellA.classList.toggle('one', state.rowA[i] === 1);
      }

      // Cell B
      const cellB = document.querySelector(`.digit-input-cell[data-row="b"][data-col="${i}"]`);
      if (cellB) {
        cellB.textContent = state.rowB[i];
        cellB.classList.toggle('one', state.rowB[i] === 1);
      }

      // Sum Cell
      const cellSum = document.getElementById(`sum-${i}`);
      if (cellSum) {
        cellSum.textContent = sumBits[i];
      }

      // Carry Cell (carry into column i+1)
      if (i < 7) {
        const cellCarry = document.getElementById(`carry-${i + 1}`);
        if (cellCarry) {
          cellCarry.textContent = carryBits[i];
          cellCarry.classList.toggle('has-carry', carryBits[i] === 1);
        }
      }
    }

    // Denary totals
    const denaryA = bitsToUnsigned(state.rowA);
    const denaryB = bitsToUnsigned(state.rowB);
    const denarySum = bitsToUnsigned(sumBits);
    const totalMath = denaryA + denaryB;

    if (DOM.denaryValA) DOM.denaryValA.textContent = denaryA;
    if (DOM.denaryValB) DOM.denaryValB.textContent = denaryB;
    if (DOM.denaryValSum) {
      DOM.denaryValSum.textContent = hasOverflow ? `${denarySum}*` : denarySum;
    }

    // Sync Calculator Bar
    if (DOM.calcAddInputA && document.activeElement !== DOM.calcAddInputA) {
      DOM.calcAddInputA.value = denaryA;
    }
    if (DOM.calcAddInputB && document.activeElement !== DOM.calcAddInputB) {
      DOM.calcAddInputB.value = denaryB;
    }
    if (DOM.calcAddHexA) DOM.calcAddHexA.textContent = `0x${denaryA.toString(16).toUpperCase().padStart(2, '0')}`;
    if (DOM.calcAddHexB) DOM.calcAddHexB.textContent = `0x${denaryB.toString(16).toUpperCase().padStart(2, '0')}`;
    if (DOM.calcAddResultNum) DOM.calcAddResultNum.textContent = hasOverflow ? `${totalMath} (Overflown to ${denarySum})` : totalMath;
    if (DOM.calcAddResultHex) DOM.calcAddResultHex.textContent = `0x${denarySum.toString(16).toUpperCase().padStart(2, '0')}`;

    // Overflow alert
    if (DOM.overflowAlert) {
      DOM.overflowAlert.classList.toggle('visible', hasOverflow);
    }
  }

  function setupAdderEvents() {
    DOM.digitCellsA.forEach(cell => {
      cell.addEventListener('click', () => {
        const col = parseInt(cell.getAttribute('data-col'), 10);
        state.rowA[col] = state.rowA[col] === 1 ? 0 : 1;
        calculateBinaryAddition();
      });
    });

    DOM.digitCellsB.forEach(cell => {
      cell.addEventListener('click', () => {
        const col = parseInt(cell.getAttribute('data-col'), 10);
        state.rowB[col] = state.rowB[col] === 1 ? 0 : 1;
        calculateBinaryAddition();
      });
    });

    if (DOM.calcAddInputA) {
      DOM.calcAddInputA.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 0;
        val = Math.max(0, Math.min(255, val));
        for (let i = 0; i < 8; i++) {
          state.rowA[i] = (val >> i) & 1;
        }
        calculateBinaryAddition();
      });
    }

    if (DOM.calcAddInputB) {
      DOM.calcAddInputB.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 0;
        val = Math.max(0, Math.min(255, val));
        for (let i = 0; i < 8; i++) {
          state.rowB[i] = (val >> i) & 1;
        }
        calculateBinaryAddition();
      });
    }

    if (DOM.btnExampleOverflow) {
      DOM.btnExampleOverflow.addEventListener('click', () => {
        // 200 = 11001000
        state.rowA = [0, 0, 0, 1, 0, 0, 1, 1];
        // 100 = 01100100
        state.rowB = [0, 0, 1, 0, 0, 1, 1, 0];
        calculateBinaryAddition();
      });
    }

    if (DOM.btnResetAdder) {
      DOM.btnResetAdder.addEventListener('click', () => {
        state.rowA = [1, 0, 1, 1, 0, 1, 0, 0];
        state.rowB = [0, 1, 1, 0, 1, 0, 0, 0];
        calculateBinaryAddition();
      });
    }
  }

  // --- SUB-MODE 2: TWO'S COMPLEMENT SUBTRACTION ---
  function calculateBinarySubtraction() {
    const denaryA = bitsToUnsigned(state.subA);
    const denaryB = bitsToUnsigned(state.subB);

    // Step 1: Invert all bits of B (One's Complement)
    const invB = state.subB.map(b => (b === 1 ? 0 : 1));
    const invBStr = `${invB[7]}${invB[6]}${invB[5]}${invB[4]}${invB[3]}${invB[2]}${invB[1]}${invB[0]}`;
    const origBStr = `${state.subB[7]}${state.subB[6]}${state.subB[5]}${state.subB[4]}${state.subB[3]}${state.subB[2]}${state.subB[1]}${state.subB[0]}`;

    if (DOM.subStep1Bits) DOM.subStep1Bits.textContent = invBStr;
    if (DOM.subStep1Label) DOM.subStep1Label.textContent = `Original B: ${origBStr} (${denaryB})`;

    // Step 2: Add 1 to get Two's Complement (-B)
    const negBValue = (-denaryB + 256) & 0xFF;
    const negBBits = [];
    for (let i = 0; i < 8; i++) {
      negBBits[i] = (negBValue >> i) & 1;
    }
    const negBStr = `${negBBits[7]}${negBBits[6]}${negBBits[5]}${negBBits[4]}${negBBits[3]}${negBBits[2]}${negBBits[1]}${negBBits[0]}`;

    if (DOM.subStep2Bits) DOM.subStep2Bits.textContent = negBStr;
    if (DOM.subStep2Label) DOM.subStep2Label.textContent = `Represents: -${denaryB}`;

    // Step 3: Add A + (-B)
    let carry = 0;
    const sumBits = [];
    const carryBits = [];

    for (let i = 0; i < 8; i++) {
      const a = state.subA[i];
      const b = negBBits[i];
      const sum = a + b + carry;
      sumBits[i] = sum % 2;
      carry = Math.floor(sum / 2);
      carryBits[i] = carry;
    }

    const finalCarryOut = carry;

    // Render cells in subtraction grid
    for (let i = 0; i < 8; i++) {
      // Cell A
      const cellA = document.querySelector(`.digit-input-cell[data-sub-row="a"][data-col="${i}"]`);
      if (cellA) {
        cellA.textContent = state.subA[i];
        cellA.classList.toggle('one', state.subA[i] === 1);
      }

      // Cell Orig B
      const cellB = document.querySelector(`.digit-input-cell[data-sub-row="b"][data-col="${i}"]`);
      if (cellB) {
        cellB.textContent = state.subB[i];
        cellB.classList.toggle('one', state.subB[i] === 1);
      }

      // Cell -B
      const cellNegB = document.getElementById(`subNegB-${i}`);
      if (cellNegB) {
        cellNegB.textContent = negBBits[i];
      }

      // Sum Cell
      const cellSum = document.getElementById(`subSum-${i}`);
      if (cellSum) {
        cellSum.textContent = sumBits[i];
      }

      // Carry Cell
      if (i < 7) {
        const cellCarry = document.getElementById(`subCarry-${i + 1}`);
        if (cellCarry) {
          cellCarry.textContent = carryBits[i];
          cellCarry.classList.toggle('has-carry', carryBits[i] === 1);
        }
      }
    }

    // Denary Calculation
    const resultMath = denaryA - denaryB;
    if (DOM.subDenaryA) DOM.subDenaryA.textContent = denaryA;
    if (DOM.subDenaryOrigB) DOM.subDenaryOrigB.textContent = denaryB;
    if (DOM.subDenaryNegB) DOM.subDenaryNegB.textContent = `-${denaryB}`;
    if (DOM.subDenaryResult) DOM.subDenaryResult.textContent = resultMath;
    if (DOM.subVerificationLabel) {
      DOM.subVerificationLabel.textContent = `${denaryA} - ${denaryB} = ${resultMath} (Verified!)`;
    }

    // Sync Calculator Bar elements
    if (DOM.calcSubInputA && document.activeElement !== DOM.calcSubInputA) {
      DOM.calcSubInputA.value = denaryA;
    }
    if (DOM.calcSubInputB && document.activeElement !== DOM.calcSubInputB) {
      DOM.calcSubInputB.value = denaryB;
    }
    if (DOM.calcSubHexA) DOM.calcSubHexA.textContent = `0x${denaryA.toString(16).toUpperCase().padStart(2, '0')}`;
    if (DOM.calcSubHexB) DOM.calcSubHexB.textContent = `0x${denaryB.toString(16).toUpperCase().padStart(2, '0')}`;
    if (DOM.calcSubResultNum) DOM.calcSubResultNum.textContent = resultMath;
    const unsignedRes = (resultMath + 256) & 0xFF;
    if (DOM.calcSubResultHex) DOM.calcSubResultHex.textContent = `0x${unsignedRes.toString(16).toUpperCase().padStart(2, '0')}`;

    // Carry note update
    if (DOM.subCarryRuleBox) {
      if (finalCarryOut === 1) {
        DOM.subCarryRuleBox.innerHTML = `
          <strong>📌 Final Carry Rule:</strong> A 9th carry bit <code>1</code> was generated past the MSB. <strong>In Two's Complement subtraction, this 9th carry bit is discarded</strong> by the processor! The remaining 8 bits evaluate to <strong>${resultMath}</strong>.
        `;
      } else {
        DOM.subCarryRuleBox.innerHTML = `
          <strong>📌 Final Carry Rule:</strong> No 9th carry bit was generated (A &lt; B). The result has MSB=1, meaning the answer is a negative number in two's complement: <strong>${resultMath}</strong> (8-bit value: <code>${sumBits.slice().reverse().join('')}</code>₂ = ${resultMath}).
        `;
      }
    }
  }

  function setupSubtractionEvents() {
    DOM.digitCellsSubA.forEach(cell => {
      cell.addEventListener('click', () => {
        const col = parseInt(cell.getAttribute('data-col'), 10);
        state.subA[col] = state.subA[col] === 1 ? 0 : 1;
        calculateBinarySubtraction();
      });
    });

    if (DOM.digitCellsSubB) {
      DOM.digitCellsSubB.forEach(cell => {
        cell.addEventListener('click', () => {
          const col = parseInt(cell.getAttribute('data-col'), 10);
          state.subB[col] = state.subB[col] === 1 ? 0 : 1;
          calculateBinarySubtraction();
        });
      });
    }

    if (DOM.calcSubInputA) {
      DOM.calcSubInputA.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 0;
        val = Math.max(0, Math.min(255, val));
        for (let i = 0; i < 8; i++) {
          state.subA[i] = (val >> i) & 1;
        }
        calculateBinarySubtraction();
      });
    }

    if (DOM.calcSubInputB) {
      DOM.calcSubInputB.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 0;
        val = Math.max(0, Math.min(255, val));
        for (let i = 0; i < 8; i++) {
          state.subB[i] = (val >> i) & 1;
        }
        calculateBinarySubtraction();
      });
    }

    // Preset buttons
    function setSubtractionPreset(valA, valB) {
      for (let i = 0; i < 8; i++) {
        state.subA[i] = (valA >> i) & 1;
        state.subB[i] = (valB >> i) & 1;
      }
      calculateBinarySubtraction();
    }

    if (DOM.btnSubPreset1) DOM.btnSubPreset1.addEventListener('click', () => setSubtractionPreset(52, 19));
    if (DOM.btnSubPreset2) DOM.btnSubPreset2.addEventListener('click', () => setSubtractionPreset(105, 42));
    if (DOM.btnSubPreset3) DOM.btnSubPreset3.addEventListener('click', () => setSubtractionPreset(25, 60));
    if (DOM.btnSubPreset4) DOM.btnSubPreset4.addEventListener('click', () => setSubtractionPreset(80, 80));
    if (DOM.btnSubPreset5) DOM.btnSubPreset5.addEventListener('click', () => setSubtractionPreset(200, 75));
    if (DOM.btnResetSub) DOM.btnResetSub.addEventListener('click', () => setSubtractionPreset(52, 19));
  }

  // --- SUB-MODE 3: BITWISE LOGIC ---
  const LOGIC_DOCS = {
    AND: {
      symbol: '&',
      label: 'AND Row B:',
      title: 'Bitwise AND (&)',
      desc: 'Output bit is <strong>1</strong> ONLY if BOTH Bit A and Bit B are 1. If either is 0, the output is 0.',
      tip: '🎯 <strong>Exam Masking Use:</strong> Used for <em>masking</em> (extracting or clearing bits). For example, <code>x AND 00000001</code> tests if a number is odd (1) or even (0). <code>x AND 00001111</code> clears the upper nibble and keeps the lower nibble intact.',
    },
    OR: {
      symbol: '|',
      label: 'OR Row B:',
      title: 'Bitwise OR (|)',
      desc: 'Output bit is <strong>1</strong> if EITHER Bit A or Bit B is 1 (or both). Output is 0 only when both are 0.',
      tip: '🎯 <strong>Exam Masking Use:</strong> Used to <em>set</em> specific bits to 1 without changing any other bits in a register or control byte.',
    },
    XOR: {
      symbol: '^',
      label: 'XOR Row B:',
      title: 'Bitwise XOR (^ Exclusive OR)',
      desc: 'Output bit is <strong>1</strong> if the bits are DIFFERENT. If both bits are identical (both 0 or both 1), the output is 0.',
      tip: '🎯 <strong>Exam Masking Use:</strong> Used to <em>toggle/flip</em> bits (applying 1 inverts that bit; applying 0 leaves it alone). Widely tested in symmetric ciphers and game graphics (sprites).',
    },
    NOT: {
      symbol: '~',
      label: 'NOT (Inverts A):',
      title: 'Bitwise NOT (~ Inversion)',
      desc: 'Inverts every single bit in Row A. 0 becomes 1, and 1 becomes 0.',
      tip: '🎯 <strong>Exam Masking Use:</strong> Used to generate the One\'s complement of a binary number prior to adding 1 for Two\'s complement negative arithmetic.',
    },
  };

  function calculateBitwiseLogic() {
    const op = state.logicOp;
    const doc = LOGIC_DOCS[op] || LOGIC_DOCS.AND;
    const resBits = [];

    for (let i = 0; i < 8; i++) {
      const a = state.logicA[i];
      const b = state.logicB[i];
      if (op === 'AND') resBits[i] = a & b;
      else if (op === 'OR') resBits[i] = a | b;
      else if (op === 'XOR') resBits[i] = a ^ b;
      else if (op === 'NOT') resBits[i] = a === 1 ? 0 : 1;
    }

    // Render cells in logic grid
    for (let i = 0; i < 8; i++) {
      const cellA = document.querySelector(`.digit-input-cell[data-logic-row="a"][data-col="${i}"]`);
      if (cellA) {
        cellA.textContent = state.logicA[i];
        cellA.classList.toggle('one', state.logicA[i] === 1);
      }

      const cellB = document.querySelector(`.digit-input-cell[data-logic-row="b"][data-col="${i}"]`);
      if (cellB) {
        cellB.textContent = op === 'NOT' ? '-' : state.logicB[i];
        cellB.classList.toggle('one', op !== 'NOT' && state.logicB[i] === 1);
        cellB.style.opacity = op === 'NOT' ? '0.3' : '1';
      }

      const cellRes = document.getElementById(`logicRes-${i}`);
      if (cellRes) {
        cellRes.textContent = resBits[i];
      }
    }

    // Denary values
    const denA = bitsToUnsigned(state.logicA);
    const denB = bitsToUnsigned(state.logicB);
    const denRes = bitsToUnsigned(resBits);

    if (DOM.logicDenaryA) DOM.logicDenaryA.textContent = denA;
    if (DOM.logicDenaryB) DOM.logicDenaryB.textContent = op === 'NOT' ? 'N/A' : denB;
    if (DOM.logicDenaryRes) DOM.logicDenaryRes.textContent = denRes;

    // Sync Calculator Bar elements
    if (DOM.calcLogicInputA && document.activeElement !== DOM.calcLogicInputA) {
      DOM.calcLogicInputA.value = denA;
    }
    if (DOM.calcLogicInputB && document.activeElement !== DOM.calcLogicInputB) {
      DOM.calcLogicInputB.value = denB;
    }
    if (DOM.calcLogicInputB) {
      DOM.calcLogicInputB.disabled = (op === 'NOT');
      DOM.calcLogicInputB.style.opacity = (op === 'NOT') ? '0.3' : '1';
    }
    if (DOM.calcLogicHexA) DOM.calcLogicHexA.textContent = `0x${denA.toString(16).toUpperCase().padStart(2, '0')}`;
    if (DOM.calcLogicHexB) DOM.calcLogicHexB.textContent = op === 'NOT' ? '—' : `0x${denB.toString(16).toUpperCase().padStart(2, '0')}`;
    if (DOM.calcLogicResultNum) DOM.calcLogicResultNum.textContent = denRes;
    if (DOM.calcLogicResultHex) DOM.calcLogicResultHex.textContent = `0x${denRes.toString(16).toUpperCase().padStart(2, '0')}`;

    // Label and Explanations
    if (DOM.logicOpLabel) DOM.logicOpLabel.textContent = doc.label;
    if (DOM.logicOpTitle) DOM.logicOpTitle.textContent = doc.title;
    if (DOM.logicOpDesc) DOM.logicOpDesc.innerHTML = doc.desc;
    if (DOM.logicOpExamTip) DOM.logicOpExamTip.innerHTML = doc.tip;
  }

  function setupBitwiseEvents() {
    DOM.logicOpButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.logicOpButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.logicOp = btn.getAttribute('data-op');
        calculateBitwiseLogic();
      });
    });

    DOM.digitCellsLogicA.forEach(cell => {
      cell.addEventListener('click', () => {
        const col = parseInt(cell.getAttribute('data-col'), 10);
        state.logicA[col] = state.logicA[col] === 1 ? 0 : 1;
        calculateBitwiseLogic();
      });
    });

    DOM.digitCellsLogicB.forEach(cell => {
      cell.addEventListener('click', () => {
        if (state.logicOp === 'NOT') return;
        const col = parseInt(cell.getAttribute('data-col'), 10);
        state.logicB[col] = state.logicB[col] === 1 ? 0 : 1;
        calculateBitwiseLogic();
      });
    });

    if (DOM.calcLogicInputA) {
      DOM.calcLogicInputA.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 0;
        val = Math.max(0, Math.min(255, val));
        for (let i = 0; i < 8; i++) {
          state.logicA[i] = (val >> i) & 1;
        }
        calculateBitwiseLogic();
      });
    }

    if (DOM.calcLogicInputB) {
      DOM.calcLogicInputB.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 0;
        val = Math.max(0, Math.min(255, val));
        for (let i = 0; i < 8; i++) {
          state.logicB[i] = (val >> i) & 1;
        }
        calculateBitwiseLogic();
      });
    }

    // Preset Mask buttons
    if (DOM.btnMaskNibble) {
      DOM.btnMaskNibble.addEventListener('click', () => {
        state.logicOp = 'AND';
        state.logicB = [1, 1, 1, 1, 0, 0, 0, 0]; // 00001111 (15)
        DOM.logicOpButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-op') === 'AND'));
        calculateBitwiseLogic();
      });
    }

    if (DOM.btnMaskOddEven) {
      DOM.btnMaskOddEven.addEventListener('click', () => {
        state.logicOp = 'AND';
        state.logicB = [1, 0, 0, 0, 0, 0, 0, 0]; // 00000001 (1)
        DOM.logicOpButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-op') === 'AND'));
        calculateBitwiseLogic();
      });
    }

    if (DOM.btnMaskToggle) {
      DOM.btnMaskToggle.addEventListener('click', () => {
        state.logicOp = 'XOR';
        state.logicB = [0, 0, 0, 0, 1, 1, 1, 1]; // 11110000 (240)
        DOM.logicOpButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-op') === 'XOR'));
        calculateBitwiseLogic();
      });
    }

    if (DOM.btnResetLogic) {
      DOM.btnResetLogic.addEventListener('click', () => {
        state.logicOp = 'AND';
        state.logicA = [0, 1, 1, 0, 1, 0, 1, 1]; // 214
        state.logicB = [1, 1, 1, 1, 0, 0, 0, 0]; // 15
        DOM.logicOpButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-op') === 'AND'));
        calculateBitwiseLogic();
      });
    }
  }

  // --- SUB-MODE 4: LOGICAL BINARY SHIFTS ---
  function renderShifts() {
    const val = state.shiftValue & 0xFF;
    const binStr = val.toString(2).padStart(8, '0');
    if (DOM.shiftBitsDisplay) DOM.shiftBitsDisplay.textContent = binStr;
    if (DOM.shiftDenaryDisplay) DOM.shiftDenaryDisplay.textContent = val;
    if (DOM.calcShiftInput && document.activeElement !== DOM.calcShiftInput) {
      DOM.calcShiftInput.value = val;
    }
    if (DOM.calcShiftHex) {
      DOM.calcShiftHex.textContent = `0x${val.toString(16).toUpperCase().padStart(2, '0')}`;
    }
  }

  function setupShiftEvents() {
    if (DOM.calcShiftInput) {
      DOM.calcShiftInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 0;
        state.shiftValue = Math.max(0, Math.min(255, val));
        renderShifts();
      });
    }

    if (DOM.btnShiftLeft1) {
      DOM.btnShiftLeft1.addEventListener('click', () => {
        state.shiftValue = (state.shiftValue << 1) & 0xFF;
        renderShifts();
      });
    }
    if (DOM.btnShiftLeft2) {
      DOM.btnShiftLeft2.addEventListener('click', () => {
        state.shiftValue = (state.shiftValue << 2) & 0xFF;
        renderShifts();
      });
    }
    if (DOM.btnShiftRight1) {
      DOM.btnShiftRight1.addEventListener('click', () => {
        state.shiftValue = (state.shiftValue >> 1) & 0xFF;
        renderShifts();
      });
    }
    if (DOM.btnShiftRight2) {
      DOM.btnShiftRight2.addEventListener('click', () => {
        state.shiftValue = (state.shiftValue >> 2) & 0xFF;
        renderShifts();
      });
    }
    if (DOM.btnResetShift) {
      DOM.btnResetShift.addEventListener('click', () => {
        state.shiftValue = 20;
        renderShifts();
      });
    }
  }

  // =========================================================================
  // 6. TAB 3: DATA UNITS CALCULATOR
  // =========================================================================

  // =========================================================================
  // 6. TAB 3: DATA UNITS SCALE VISUALIZER & STORAGE TRAP
  // =========================================================================

  const DATA_UNITS = [
    {
      unitName: '1 Byte (B)',
      scaleName: 'Single Byte',
      zerosBadge: '0 Zeros (10⁰)',
      zerosWritten: '1 Byte',
      binaryComp: 'Binary (IEC): 1 Byte (2⁰)',
      mp3Time: '0.00006 seconds (instant)',
      mp3Analogy: 'Holds 1 single ASCII character (e.g. "A"). Smaller than an imperceptible audio click.',
      realWorldSummary: '1 typed keystroke on your keyboard',
      realWorldDesc: 'Stored in 8 microscopic transistor switches inside computer RAM.'
    },
    {
      unitName: '1 Kilobyte (kB)',
      scaleName: 'One Thousand Bytes',
      zerosBadge: '3 Zeros (10³)',
      zerosWritten: '1,000 Bytes',
      binaryComp: 'Binary (IEC Kibibyte): 1,024 Bytes (2¹⁰)',
      mp3Time: '0.06 seconds (a split second)',
      mp3Analogy: 'At 128 kbps (16 kB/s), 1 kB plays for barely a sixteenth of a second (a brief click).',
      realWorldSummary: 'A short email or paragraph in WhatsApp',
      realWorldDesc: 'Roughly 150 to 200 words of plain text, or a tiny low-res favicon icon.'
    },
    {
      unitName: '1 Megabyte (MB)',
      scaleName: 'One Million Bytes',
      zerosBadge: '6 Zeros (10⁶)',
      zerosWritten: '1,000,000 Bytes',
      binaryComp: 'Binary (IEC Mebibyte): 1,048,576 Bytes (2²⁰)',
      mp3Time: '62.5 seconds (~1 Minute)',
      mp3Analogy: 'Almost exactly 1 minute of high-quality MP3 audio! A typical 3.5 minute pop song is about 3.5 MB.',
      realWorldSummary: '1 minute of MP3 music or 1 high-res smartphone photo',
      realWorldDesc: 'A typical 12-megapixel smartphone JPEG photo or a medium-sized PDF document.'
    },
    {
      unitName: '1 Gigabyte (GB)',
      scaleName: 'One Billion Bytes',
      zerosBadge: '9 Zeros (10⁹)',
      zerosWritten: '1,000,000,000 Bytes',
      binaryComp: 'Binary (IEC Gibibyte): 1,073,741,824 Bytes (2³⁰)',
      mp3Time: '62,500 seconds = 17.4 Hours!',
      mp3Analogy: '17.4 hours of continuous non-stop music playback! Over 250 typical MP3 songs in a row.',
      realWorldSummary: '~250 MP3 songs, 1 hour of HD Netflix streaming, or an indie game',
      realWorldDesc: 'Fills up a basic USB flash drive or standard modern cellular mobile data pack.'
    },
    {
      unitName: '1 Terabyte (TB)',
      scaleName: 'One Trillion Bytes',
      zerosBadge: '12 Zeros (10¹²)',
      zerosWritten: '1,000,000,000,000 Bytes',
      binaryComp: 'Binary (IEC Tebibyte): 1,099,511,627,776 Bytes (2⁴⁰)',
      mp3Time: '62.5 Million seconds = 723 Days (~2 YEARS!)',
      mp3Analogy: 'Play continuous music 24 hours a day, 7 days a week, for TWO FULL YEARS without ever repeating a track!',
      realWorldSummary: '~250,000 MP3 songs, 500 hours of video, or a console SSD',
      realWorldDesc: 'Standard storage capacity for PlayStation 5, Xbox Series X, or high-end laptop SSDs.'
    },
    {
      unitName: '1 Petabyte (PB)',
      scaleName: 'One Quadrillion Bytes',
      zerosBadge: '15 Zeros (10¹⁵)',
      zerosWritten: '1,000,000,000,000,000 Bytes',
      binaryComp: 'Binary (IEC Pebibyte): 1,125,899,906,842,624 Bytes (2⁵⁰)',
      mp3Time: '62.5 Billion seconds = 723,380 Days (~1,980 YEARS!)',
      mp3Analogy: 'Nearly TWO THOUSAND YEARS of non-stop continuous 24/7 music! If a track started when the Roman Empire ruled Britain in 45 AD, it would still be playing today!',
      realWorldSummary: '~250 million songs, 500,000 hours of HD video, or 500 billion pages',
      realWorldDesc: 'The storage scale of massive cloud datacenters (Google, Netflix, AWS, or CERN Large Hadron Collider).'
    }
  ];

  function renderDataUnitScale(index) {
    const data = DATA_UNITS[index];
    if (!data) return;

    if (DOM.scaleUnitButtons) {
      DOM.scaleUnitButtons.forEach((btn, idx) => {
        btn.classList.toggle('active', idx === index);
      });
    }
    if (DOM.sliderDataScale) {
      DOM.sliderDataScale.value = index;
    }

    if (DOM.scaleUnitName) DOM.scaleUnitName.textContent = data.unitName;
    if (DOM.scaleScaleName) DOM.scaleScaleName.textContent = data.scaleName;
    if (DOM.scaleZerosBadge) DOM.scaleZerosBadge.textContent = data.zerosBadge;
    if (DOM.scaleZerosWritten) DOM.scaleZerosWritten.textContent = data.zerosWritten;
    if (DOM.scaleBinaryComp) DOM.scaleBinaryComp.textContent = data.binaryComp;
    if (DOM.scaleMp3Time) DOM.scaleMp3Time.textContent = data.mp3Time;
    if (DOM.scaleMp3Analogy) DOM.scaleMp3Analogy.textContent = data.mp3Analogy;
    if (DOM.scaleRealWorldSummary) DOM.scaleRealWorldSummary.textContent = data.realWorldSummary;
    if (DOM.scaleRealWorldDesc) DOM.scaleRealWorldDesc.textContent = data.realWorldDesc;
  }

  function updateStorageTrapCalculation() {
    const advertisedGb = parseFloat(DOM.inputAdvertisedGb ? DOM.inputAdvertisedGb.value : '1000') || 0;
    const totalBytes = advertisedGb * 1000000000;
    const gib = totalBytes / 1073741824;
    const diffGb = advertisedGb - gib;

    if (DOM.storageTrapCalculation) {
      DOM.storageTrapCalculation.innerHTML = `
        ${totalBytes.toLocaleString()} bytes &divide; 1,073,741,824 bytes/GiB &approx; <strong style="color: #6366f1;">${gib.toFixed(2)} GiB</strong>
      `;
    }
    if (DOM.storageTrapDifference) {
      DOM.storageTrapDifference.innerHTML = `
        Apparent "missing" space: <strong style="color: #ef4444;">${diffGb.toFixed(2)} GB (&approx; 7% difference)</strong> due purely to base-10 vs base-2 definition!
      `;
    }
  }

  function setupUnitsCalculator() {
    if (DOM.scaleUnitButtons) {
      DOM.scaleUnitButtons.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          renderDataUnitScale(idx);
          playSynthSound('click');
        });
      });
    }

    if (DOM.sliderDataScale) {
      DOM.sliderDataScale.addEventListener('input', (e) => {
        const idx = parseInt(e.target.value, 10);
        renderDataUnitScale(idx);
      });
    }

    if (DOM.inputAdvertisedGb) {
      DOM.inputAdvertisedGb.addEventListener('input', updateStorageTrapCalculation);
    }

    if (DOM.storagePresetButtons) {
      DOM.storagePresetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const gb = btn.getAttribute('data-gb');
          if (DOM.inputAdvertisedGb) DOM.inputAdvertisedGb.value = gb;
          updateStorageTrapCalculation();
          playSynthSound('click');
        });
      });
    }

    renderDataUnitScale(3); // Default to Gigabyte (index 3)
    updateStorageTrapCalculation();
  }

  // =========================================================================
  // 7. TAB 4: CHARACTER ENCODER (ASCII & UNICODE)
  // =========================================================================

  function renderCharacterTokens() {
    const text = DOM.textEncoderInput ? DOM.textEncoderInput.value || '' : '';
    if (!DOM.charTokenStream) return;
    DOM.charTokenStream.innerHTML = '';

    if (!text) {
      if (DOM.fullBinaryOutputBox) DOM.fullBinaryOutputBox.textContent = '(Empty - type a message above)';
      if (DOM.fullHexOutputLabel) DOM.fullHexOutputLabel.textContent = 'Hex: (Empty)';
      if (DOM.encoderByteStats) DOM.encoderByteStats.textContent = '0 Characters • 0 Bytes (0 bits)';
      DOM.charTokenStream.innerHTML = '<span style="color:var(--text-muted); font-size:12px;">Start typing above to see binary character blocks...</span>';
      return;
    }

    const chars = Array.from(text);
    const binChunks = [];
    const hexChunks = [];
    let totalBytes = 0;

    chars.forEach(ch => {
      const code = ch.codePointAt(0);
      const isAscii = code <= 127;
      const utf8Bytes = new TextEncoder().encode(ch);
      totalBytes += utf8Bytes.length;

      let charBinStr = '';
      if (isAscii) {
        charBinStr = code.toString(2).padStart(8, '0');
        binChunks.push(charBinStr);
        hexChunks.push(code.toString(16).toUpperCase().padStart(2, '0'));
      } else {
        const subBins = [];
        utf8Bytes.forEach(b => {
          const bBin = b.toString(2).padStart(8, '0');
          subBins.push(bBin);
          binChunks.push(bBin);
          hexChunks.push(b.toString(16).toUpperCase().padStart(2, '0'));
        });
        charBinStr = subBins.join(' ');
      }

      const hex = code.toString(16).toUpperCase().padStart(2, '0');

      const token = document.createElement('div');
      token.className = 'char-token';
      token.innerHTML = `
        <span class="char-symbol">${escapeHtml(ch)}</span>
        <span class="char-denary">${code}</span>
        <span class="char-hex">${hex}₁₆</span>
        <span class="char-bin" style="font-size: 11px;">${charBinStr}</span>
        <span style="font-size: 9px; margin-top: 4px; padding: 2px 6px; border-radius: 4px; background: ${isAscii ? 'rgba(59, 130, 246, 0.15)' : 'rgba(139, 92, 246, 0.2)'}; color: ${isAscii ? '#3b82f6' : '#8b5cf6'}; font-weight: 700;">
          ${isAscii ? 'ASCII (1B)' : `Unicode (${utf8Bytes.length}B)`}
        </span>
      `;
      DOM.charTokenStream.appendChild(token);
    });

    // Populate Full Stream Output Box
    if (DOM.fullBinaryOutputBox) {
      DOM.fullBinaryOutputBox.textContent = binChunks.join(' ');
    }
    if (DOM.fullHexOutputLabel) {
      DOM.fullHexOutputLabel.textContent = `Hex: ${hexChunks.join(' ')}`;
    }
    if (DOM.encoderByteStats) {
      const totalBits = totalBytes * 8;
      DOM.encoderByteStats.textContent = `${chars.length} Character${chars.length === 1 ? '' : 's'} • ${totalBytes} Byte${totalBytes === 1 ? '' : 's'} (${totalBits} bits)`;
    }

    updateStorageImpact();
  }

  function escapeHtml(str) {
    if (str === ' ') return '&blank; (space)';
    if (str === '\n') return '&para; (newline)';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function updateStorageImpact() {
    const text = (DOM.textEncoderInput && DOM.textEncoderInput.value) ? DOM.textEncoderInput.value : 'Hello 👾';
    const container = document.getElementById('storageImpactBars');
    if (!container) return;

    const charCount = Array.from(text).length;
    const utf8Bytes = new TextEncoder().encode(text).length;
    const ascii8Bytes = Math.max(1, charCount);
    const utf16Bytes = Math.max(2, charCount * 2);
    const utf32Bytes = Math.max(4, charCount * 4);

    const maxBytes = Math.max(1, utf32Bytes);

    const standards = [
      { name: 'Standard 7/8-bit ASCII', bytes: ascii8Bytes, color: '#38bdf8', note: '1 byte per char (English only)' },
      { name: 'UTF-8 (Web Standard)', bytes: utf8Bytes, color: '#10b981', note: 'Variable (1B for English, 4B for Emojis)' },
      { name: 'UTF-16 (Windows / Java)', bytes: utf16Bytes, color: '#fbbf24', note: '2 bytes minimum per char' },
      { name: 'UTF-32 (Fixed Length)', bytes: utf32Bytes, color: '#ef4444', note: '4 bytes for EVERY character (4× size!)' }
    ];

    container.innerHTML = '';
    standards.forEach(std => {
      const pct = Math.max(8, Math.round((std.bytes / maxBytes) * 100));
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.flexDirection = 'column';
      row.style.gap = '4px';

      row.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
          <span style="color: var(--text-primary);">${std.name}:</span>
          <span style="font-family: var(--font-mono); color: ${std.color};">${std.bytes} Bytes <span style="color: var(--text-muted); font-weight: 400;">(${std.bytes * 8} bits)</span></span>
        </div>
        <div style="height: 10px; background: var(--bg-root); border-radius: 5px; overflow: hidden; border: 1px solid var(--border-color);">
          <div style="width: ${pct}%; height: 100%; background: ${std.color}; border-radius: 5px; transition: width 0.3s ease;"></div>
        </div>
        <div style="font-size: 10.5px; color: var(--text-muted);">${std.note}</div>
      `;
      container.appendChild(row);
    });
  }

  function setupCharacterSetsLab() {
    // 1. Case-Flipper
    const caseSelect = document.getElementById('caseFlipperSelect');
    const btnToggleBit5 = document.getElementById('btnToggleBit5');
    const upperCharBadge = document.getElementById('upperCharBadge');
    const upperDenaryVal = document.getElementById('upperDenaryVal');
    const upperBitsRow = document.getElementById('upperBitsRow');
    const lowerCharBadge = document.getElementById('lowerCharBadge');
    const lowerDenaryVal = document.getElementById('lowerDenaryVal');
    const lowerBitsRow = document.getElementById('lowerBitsRow');

    if (caseSelect) {
      caseSelect.innerHTML = '';
      for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        const opt = document.createElement('option');
        opt.value = letter;
        opt.textContent = `${letter} (65 + ${i - 65})`;
        caseSelect.appendChild(opt);
      }

      function updateCaseFlipper() {
        const letter = caseSelect.value || 'A';
        const upperCode = letter.charCodeAt(0);
        const lowerCode = upperCode + 32;
        const lowerLetter = String.fromCharCode(lowerCode);

        if (upperCharBadge) upperCharBadge.textContent = `'${letter}'`;
        if (upperDenaryVal) upperDenaryVal.textContent = upperCode;
        if (lowerCharBadge) lowerCharBadge.textContent = `'${lowerLetter}'`;
        if (lowerDenaryVal) lowerDenaryVal.textContent = lowerCode;

        const upperBits = upperCode.toString(2).padStart(8, '0');
        const lowerBits = lowerCode.toString(2).padStart(8, '0');

        if (upperBitsRow) {
          upperBitsRow.innerHTML = '';
          Array.from(upperBits).forEach((b, idx) => {
            const span = document.createElement('span');
            const isBit5 = idx === 2; // 128, 64, 32 -> idx 2
            span.style.padding = '4px 7px';
            span.style.borderRadius = '4px';
            span.style.fontWeight = '700';
            span.style.border = isBit5 ? '1px solid #ef4444' : '1px solid var(--border-color)';
            span.style.background = isBit5 ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-surface)';
            span.style.color = isBit5 ? '#f87171' : 'var(--text-primary)';
            span.textContent = b;
            upperBitsRow.appendChild(span);
          });
        }

        if (lowerBitsRow) {
          lowerBitsRow.innerHTML = '';
          Array.from(lowerBits).forEach((b, idx) => {
            const span = document.createElement('span');
            const isBit5 = idx === 2;
            span.style.padding = '4px 7px';
            span.style.borderRadius = '4px';
            span.style.fontWeight = '700';
            span.style.border = isBit5 ? '1px solid #10b981' : '1px solid var(--border-color)';
            span.style.background = isBit5 ? 'rgba(16, 185, 129, 0.25)' : 'var(--bg-surface)';
            span.style.color = isBit5 ? '#34d399' : 'var(--text-primary)';
            span.textContent = b;
            lowerBitsRow.appendChild(span);
          });
        }
      }

      caseSelect.addEventListener('change', updateCaseFlipper);
      if (btnToggleBit5) {
        btnToggleBit5.addEventListener('click', () => {
          playSynthSound('click');
          if (lowerBitsRow && lowerBitsRow.children[2]) {
            const bitEl = lowerBitsRow.children[2];
            bitEl.style.transform = 'scale(1.35)';
            bitEl.style.transition = 'transform 0.2s ease';
            setTimeout(() => { bitEl.style.transform = 'scale(1)'; }, 250);
          }
        });
      }
      updateCaseFlipper();
    }

    // 2. Letter Offset Solver
    const targetSelect = document.getElementById('offsetTargetLetter');
    const workingsBox = document.getElementById('offsetWorkingsBox');

    if (targetSelect) {
      targetSelect.innerHTML = '';
      for (let i = 66; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        const opt = document.createElement('option');
        opt.value = letter;
        opt.textContent = `'${letter}'`;
        if (letter === 'F') opt.selected = true;
        targetSelect.appendChild(opt);
      }

      function updateOffsetSolver() {
        const target = targetSelect.value || 'F';
        const targetCode = target.charCodeAt(0);
        const diff = targetCode - 65;
        const targetPos = diff + 1;
        const bin = targetCode.toString(2).padStart(8, '0');

        if (workingsBox) {
          workingsBox.innerHTML = `
            <div style="font-weight: 800; color: #10b981; font-size: 14px; margin-bottom: 8px;">
              ✓ Step-by-Step Working:
            </div>
            <div style="display: grid; gap: 6px;">
              <div><strong>Step 1 (Find distance):</strong> <code>'${target}'</code> is letter #${targetPos} in the alphabet. Distance from 'A' = ${targetPos} - 1 = <strong>+${diff}</strong>.</div>
              <div><strong>Step 2 (Apply ASCII base):</strong> Given 'A' = 65 &rarr; 65 + ${diff} = <strong style="color: #38bdf8; font-size: 15px; font-family: var(--font-mono);">${targetCode}</strong>.</div>
              <div><strong>Step 3 (Binary Conversion):</strong> Denary ${targetCode} = <code style="color: #c084fc; font-weight: 700;">${bin}</code> (64 + ${targetCode - 64}).</div>
              <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border-color); font-size: 12px; color: var(--text-muted);">
                📝 <em>AQA Mark Scheme Note:</em> Full method marks require showing the arithmetic addition <code>65 + ${diff} = ${targetCode}</code>.
              </div>
            </div>
          `;
        }
      }

      targetSelect.addEventListener('change', updateOffsetSolver);
      updateOffsetSolver();
    }

    updateStorageImpact();
  }

  function setupCharacterEncoderEvents() {
    if (DOM.textEncoderInput) {
      DOM.textEncoderInput.addEventListener('input', renderCharacterTokens);
    }

    DOM.presetTextButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        if (DOM.textEncoderInput) {
          DOM.textEncoderInput.value = text;
          renderCharacterTokens();
        }
      });
    });

    // Copy full binary stream to clipboard
    if (DOM.btnCopyBinary) {
      DOM.btnCopyBinary.addEventListener('click', () => {
        if (DOM.fullBinaryOutputBox) {
          const text = DOM.fullBinaryOutputBox.textContent;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
              const orig = DOM.btnCopyBinary.textContent;
              DOM.btnCopyBinary.textContent = '✓ Copied!';
              setTimeout(() => {
                DOM.btnCopyBinary.textContent = orig;
              }, 1500);
            });
          }
        }
      });
    }
  }

  // =========================================================================
  // 8. HUFFMAN CODING LAB (AQA §3.3.5 & OCR §2.1)
  // =========================================================================

  function initHuffmanLab() {
    const textInput = document.getElementById('huffmanTextInput');
    const charCountBadge = document.getElementById('huffmanCharCountBadge');
    const presetButtons = document.querySelectorAll('.huffman-preset-btn');
    const btnReset = document.getElementById('btnResetHuffmanText');
    const freqListContainer = document.getElementById('huffmanFreqList');
    const treeSvgContainer = document.getElementById('huffmanTreeSvgContainer');
    const tableBody = document.getElementById('huffmanCodebookTableBody');
    const savedBadge = document.getElementById('huffmanSavedBadge');
    const bitRatio = document.getElementById('huffmanBitRatio');
    const meterBar = document.getElementById('huffmanMeterBar');
    const asciiFormula = document.getElementById('huffmanAsciiFormula');
    const calcFormula = document.getElementById('huffmanCalcFormula');
    const bitstreamDisplay = document.getElementById('huffmanBitstreamDisplay');
    const btnDecodeStream = document.getElementById('btnDecodeHuffmanStream');
    const decodeTraceLog = document.getElementById('huffmanDecodeTraceLog');

    if (!textInput || !treeSvgContainer) return;

    let decodeTimer = null;

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function renderHuffman() {
      if (decodeTimer) {
        clearInterval(decodeTimer);
        decodeTimer = null;
      }
      if (decodeTraceLog) {
        decodeTraceLog.style.display = 'none';
        decodeTraceLog.innerHTML = '';
      }
      if (btnDecodeStream) {
        btnDecodeStream.textContent = '▶ Step-by-Step Tree Decode';
        btnDecodeStream.disabled = false;
      }

      const text = textInput.value;
      if (charCountBadge) {
        charCountBadge.textContent = `${text.length} Character${text.length === 1 ? '' : 's'}`;
      }

      if (!text || text.length === 0) {
        if (freqListContainer) freqListContainer.innerHTML = '<span style="font-size: 12px; color: var(--text-muted);">Type letters above to see frequencies.</span>';
        if (treeSvgContainer) treeSvgContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 40px 0;">Tree will appear once you type some text above!</div>';
        if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" style="color: var(--text-muted); padding: 18px;">No data</td></tr>';
        if (savedBadge) savedBadge.textContent = '0% Saved';
        if (bitRatio) bitRatio.textContent = '0 bits vs 0 bits';
        if (meterBar) meterBar.style.width = '0%';
        if (asciiFormula) asciiFormula.textContent = '0 chars × 8 = 0 bits';
        if (calcFormula) calcFormula.textContent = 'Total = 0 bits';
        if (bitstreamDisplay) bitstreamDisplay.textContent = '—';
        return;
      }

      // 1. Calculate character frequencies
      const freqs = {};
      for (const ch of text) {
        freqs[ch] = (freqs[ch] || 0) + 1;
      }

      // Sorted frequency list (ascending by frequency, then alphabetical)
      const sortedChars = Object.keys(freqs).sort((a, b) => {
        if (freqs[a] !== freqs[b]) return freqs[a] - freqs[b];
        return a.localeCompare(b);
      });

      // Render Frequency badges
      if (freqListContainer) {
        freqListContainer.innerHTML = sortedChars.map(ch => {
          const displayChar = ch === ' ' ? '␣ [space]' : ch;
          return `<div class="huffman-freq-badge" data-char="${encodeURIComponent(ch)}" title="Count: ${freqs[ch]}">
            <span class="char-pill">${escapeHtml(displayChar)}</span>
            <span class="count-pill">×${freqs[ch]}</span>
          </div>`;
        }).join('');
      }

      // 2. Build Huffman Tree
      let nodeId = 1;
      let queue = sortedChars.map(ch => ({
        id: `h_leaf_${nodeId++}`,
        char: ch,
        freq: freqs[ch],
        left: null,
        right: null,
        isLeaf: true
      }));

      let root;
      if (queue.length === 1) {
        // Single character edge case
        const onlyLeaf = queue[0];
        root = {
          id: `h_node_${nodeId++}`,
          char: null,
          freq: onlyLeaf.freq,
          left: onlyLeaf,
          right: null,
          isLeaf: false
        };
      } else {
        while (queue.length > 1) {
          queue.sort((a, b) => {
            if (a.freq !== b.freq) return a.freq - b.freq;
            return a.id.localeCompare(b.id);
          });
          const left = queue.shift();
          const right = queue.shift();
          const parent = {
            id: `h_node_${nodeId++}`,
            char: null,
            freq: left.freq + right.freq,
            left: left,
            right: right,
            isLeaf: false
          };
          queue.push(parent);
        }
        root = queue[0];
      }

      // 3. Extract codes and node paths
      const codebook = {};
      const pathToLeaf = {};

      function traverse(node, currentCode, currentPath) {
        if (!node) return;
        const newPath = [...currentPath, node.id];
        if (node.isLeaf) {
          codebook[node.char] = currentCode || '0';
          pathToLeaf[node.char] = newPath;
          return;
        }
        if (node.left) {
          traverse(node.left, currentCode + '0', newPath);
        }
        if (node.right) {
          traverse(node.right, currentCode + '1', newPath);
        }
      }
      traverse(root, '', []);

      // 4. Render SVG Binary Tree
      renderSvgTree(root);

      // 5. Render Codebook Table
      const descChars = [...sortedChars].reverse();
      let totalHuffmanBits = 0;
      const rowsHtml = descChars.map(ch => {
        const count = freqs[ch];
        const asciiBits = count * 8;
        const code = codebook[ch] || '0';
        const huffBits = count * code.length;
        totalHuffmanBits += huffBits;
        const displayChar = ch === ' ' ? '␣ [space]' : ch;

        return `
          <tr class="huffman-row" data-char="${encodeURIComponent(ch)}">
            <td style="font-family: var(--font-mono); font-weight: 800; font-size: 13px; color: var(--accent-soft-text);">
              ${escapeHtml(displayChar)}
            </td>
            <td style="font-weight: 700;">${count}</td>
            <td style="color: var(--text-muted);">${count} &times; 8 = ${asciiBits}</td>
            <td><code style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-weight: 800; padding: 2px 8px; border-radius: 4px;">${code}</code></td>
            <td style="font-weight: 800; color: #34d399;">${count} &times; ${code.length} = <strong>${huffBits}</strong></td>
          </tr>
        `;
      }).join('');
      if (tableBody) tableBody.innerHTML = rowsHtml;

      // 6. Metrics & Storage Comparison
      const totalAsciiBits = text.length * 8;
      const bitsSaved = Math.max(0, totalAsciiBits - totalHuffmanBits);
      const pctSaved = totalAsciiBits > 0 ? ((bitsSaved / totalAsciiBits) * 100).toFixed(1) : 0;

      if (savedBadge) {
        savedBadge.textContent = `${pctSaved}% Saved`;
      }
      if (bitRatio) {
        bitRatio.textContent = `${totalHuffmanBits} bits vs ${totalAsciiBits} bits`;
      }
      if (meterBar) {
        const pctWidth = totalAsciiBits > 0 ? Math.min(100, Math.max(5, (totalHuffmanBits / totalAsciiBits) * 100)) : 0;
        meterBar.style.width = `${pctWidth}%`;
        meterBar.style.background = pctSaved > 0 ? '#34d399' : '#f87171';
      }
      if (asciiFormula) {
        asciiFormula.innerHTML = `${text.length} chars &times; 8 bits = <strong>${totalAsciiBits} bits</strong>`;
      }
      if (calcFormula) {
        calcFormula.innerHTML = `&sum; (Freq &times; Code Len) = <strong style="color: #34d399;">${totalHuffmanBits} bits</strong>`;
      }

      // 7. Render Encoded Bitstream
      if (bitstreamDisplay) {
        const bitTokens = [];
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          const code = codebook[ch] || '0';
          const disp = ch === ' ' ? '␣' : ch;
          bitTokens.push(`<span class="huffman-bit-token" data-char="${encodeURIComponent(ch)}" title="'${escapeHtml(disp)}' &rarr; ${code}">${code}</span>`);
        }
        bitstreamDisplay.innerHTML = bitTokens.join('');
      }

      // 8. Attach Hover Traces
      attachHoverTraces(pathToLeaf);

      // 9. Attach Step-by-Step Decoder Handler
      if (btnDecodeStream) {
        btnDecodeStream.onclick = () => {
          runStepDecoder(text, codebook, root);
        };
      }
    }

    // Tree Layout & SVG Rendering function
    function renderSvgTree(root) {
      if (!treeSvgContainer || !root) return;

      let leafIndex = 0;
      let maxDepth = 0;

      function assignDepths(node, depth) {
        if (!node) return;
        node.depth = depth;
        if (depth > maxDepth) maxDepth = depth;
        assignDepths(node.left, depth + 1);
        assignDepths(node.right, depth + 1);
      }
      assignDepths(root, 0);

      function computeCoords(node) {
        if (!node) return;
        if (node.isLeaf) {
          node.x = leafIndex * 64 + 40;
          leafIndex++;
        } else {
          computeCoords(node.left);
          computeCoords(node.right);
          if (node.left && node.right) {
            node.x = (node.left.x + node.right.x) / 2;
          } else if (node.left) {
            node.x = node.left.x + 35;
          } else if (node.right) {
            node.x = node.right.x - 35;
          } else {
            node.x = 40;
          }
        }
        node.y = node.depth * 62 + 36;
      }
      computeCoords(root);

      const svgWidth = Math.max(340, leafIndex * 64 + 60);
      const svgHeight = (maxDepth + 1) * 62 + 45;

      const lines = [];
      const nodes = [];

      function drawBranches(node) {
        if (!node) return;
        if (node.left) {
          const edgeId = `edge_${node.id}_${node.left.id}`;
          const midX = (node.x + node.left.x) / 2 - 10;
          const midY = (node.y + node.left.y) / 2;
          lines.push(`
            <line id="${edgeId}" class="huffman-edge" data-source="${node.id}" data-target="${node.left.id}"
                  x1="${node.x}" y1="${node.y}" x2="${node.left.x}" y2="${node.left.y}"
                  stroke="var(--border-color, #4b5563)" stroke-width="2" />
            <text id="label_${edgeId}" class="huffman-edge-label" x="${midX}" y="${midY}" fill="#38bdf8" font-size="12" font-weight="800" text-anchor="middle" dominant-baseline="middle">0</text>
          `);
          drawBranches(node.left);
        }
        if (node.right) {
          const edgeId = `edge_${node.id}_${node.right.id}`;
          const midX = (node.x + node.right.x) / 2 + 10;
          const midY = (node.y + node.right.y) / 2;
          lines.push(`
            <line id="${edgeId}" class="huffman-edge" data-source="${node.id}" data-target="${node.right.id}"
                  x1="${node.x}" y1="${node.y}" x2="${node.right.x}" y2="${node.right.y}"
                  stroke="var(--border-color, #4b5563)" stroke-width="2" />
            <text id="label_${edgeId}" class="huffman-edge-label" x="${midX}" y="${midY}" fill="#34d399" font-size="12" font-weight="800" text-anchor="middle" dominant-baseline="middle">1</text>
          `);
          drawBranches(node.right);
        }

        if (node.isLeaf) {
          const disp = node.char === ' ' ? '␣' : node.char;
          nodes.push(`
            <g id="${node.id}" class="huffman-svg-node huffman-leaf-node" data-char="${encodeURIComponent(node.char)}">
              <circle cx="${node.x}" cy="${node.y}" r="17" fill="var(--bg-surface-elevated, #1e293b)" stroke="#38bdf8" stroke-width="2.5" />
              <text x="${node.x}" y="${node.y + 1}" fill="var(--text-primary, #ffffff)" font-size="13" font-weight="900" font-family="var(--font-mono, monospace)" text-anchor="middle" dominant-baseline="middle">${escapeHtml(disp)}</text>
              <text x="${node.x}" y="${node.y + 26}" fill="var(--text-muted, #94a3b8)" font-size="10" font-weight="700" text-anchor="middle">w:${node.freq}</text>
            </g>
          `);
        } else {
          nodes.push(`
            <g id="${node.id}" class="huffman-svg-node huffman-internal-node">
              <circle cx="${node.x}" cy="${node.y}" r="14" fill="var(--bg-surface, #0f172a)" stroke="var(--border-color, #64748b)" stroke-width="2" />
              <text x="${node.x}" y="${node.y + 1}" fill="var(--text-secondary, #cbd5e1)" font-size="11" font-weight="700" font-family="var(--font-mono, monospace)" text-anchor="middle" dominant-baseline="middle">${node.freq}</text>
            </g>
          `);
        }
      }
      drawBranches(root);

      treeSvgContainer.innerHTML = `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" style="max-width: 100%; height: auto; display: block; margin: 0 auto; overflow: visible;">
          <g class="huffman-edges">${lines.join('')}</g>
          <g class="huffman-nodes">${nodes.join('')}</g>
        </svg>
      `;
    }

    // Path Highlighting on Hover
    function attachHoverTraces(pathToLeaf) {
      function highlightChar(ch) {
        if (!ch) return;
        const nodeIds = pathToLeaf[ch];
        if (!nodeIds) return;

        // Highlight nodes
        nodeIds.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.add('highlighted');
        });

        // Highlight connecting edges
        for (let i = 0; i < nodeIds.length - 1; i++) {
          const edge = document.getElementById(`edge_${nodeIds[i]}_${nodeIds[i + 1]}`);
          if (edge) edge.classList.add('highlighted');
          const lbl = document.getElementById(`label_edge_${nodeIds[i]}_${nodeIds[i + 1]}`);
          if (lbl) lbl.classList.add('highlighted');
        }

        // Highlight table row
        const row = document.querySelector(`.huffman-row[data-char="${encodeURIComponent(ch)}"]`);
        if (row) row.classList.add('active-huffman-row');

        // Highlight badge
        const badge = document.querySelector(`.huffman-freq-badge[data-char="${encodeURIComponent(ch)}"]`);
        if (badge) badge.classList.add('active');

        // Highlight bit tokens
        document.querySelectorAll(`.huffman-bit-token[data-char="${encodeURIComponent(ch)}"]`).forEach(tok => {
          tok.classList.add('active-token');
        });
      }

      function clearHighlights() {
        document.querySelectorAll('.huffman-svg-node.highlighted').forEach(el => el.classList.remove('highlighted'));
        document.querySelectorAll('.huffman-edge.highlighted').forEach(el => el.classList.remove('highlighted'));
        document.querySelectorAll('.huffman-edge-label.highlighted').forEach(el => el.classList.remove('highlighted'));
        document.querySelectorAll('.huffman-row.active-huffman-row').forEach(el => el.classList.remove('active-huffman-row'));
        document.querySelectorAll('.huffman-freq-badge.active').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.huffman-bit-token.active-token').forEach(el => el.classList.remove('active-token'));
      }

      document.querySelectorAll('.huffman-leaf-node').forEach(leaf => {
        const rawCh = decodeURIComponent(leaf.getAttribute('data-char') || '');
        leaf.addEventListener('mouseenter', () => highlightChar(rawCh));
        leaf.addEventListener('mouseleave', clearHighlights);
      });

      document.querySelectorAll('.huffman-row').forEach(row => {
        const rawCh = decodeURIComponent(row.getAttribute('data-char') || '');
        row.addEventListener('mouseenter', () => highlightChar(rawCh));
        row.addEventListener('mouseleave', clearHighlights);
      });

      document.querySelectorAll('.huffman-freq-badge').forEach(badge => {
        const rawCh = decodeURIComponent(badge.getAttribute('data-char') || '');
        badge.addEventListener('mouseenter', () => highlightChar(rawCh));
        badge.addEventListener('mouseleave', clearHighlights);
      });

      document.querySelectorAll('.huffman-bit-token').forEach(token => {
        const rawCh = decodeURIComponent(token.getAttribute('data-char') || '');
        token.addEventListener('mouseenter', () => highlightChar(rawCh));
        token.addEventListener('mouseleave', clearHighlights);
      });
    }

    // Step-by-Step Decoder Simulation
    function runStepDecoder(text, codebook, root) {
      if (!decodeTraceLog) return;
      decodeTraceLog.style.display = 'block';
      decodeTraceLog.innerHTML = `<div style="font-weight: 800; color: #38bdf8; margin-bottom: 6px;">Tree Decoding in progress...</div>`;

      let fullBitString = '';
      for (const ch of text) {
        fullBitString += (codebook[ch] || '0');
      }

      let bitIdx = 0;
      let currentNode = root;
      let decodedResult = '';
      let stepCount = 1;

      if (btnDecodeStream) {
        btnDecodeStream.disabled = true;
        btnDecodeStream.textContent = '⏳ Decoding...';
      }

      if (decodeTimer) clearInterval(decodeTimer);

      decodeTimer = setInterval(() => {
        if (bitIdx >= fullBitString.length) {
          clearInterval(decodeTimer);
          decodeTimer = null;
          if (btnDecodeStream) {
            btnDecodeStream.disabled = false;
            btnDecodeStream.textContent = '✓ Decoded! Replay ▶';
          }
          decodeTraceLog.innerHTML += `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color); font-weight: 800; color: #34d399;">
              ✓ Decoding Complete! Result = "${escapeHtml(decodedResult)}" (${bitIdx} bits processed with 0 ambiguity)
            </div>
          `;
          return;
        }

        const bit = fullBitString[bitIdx];
        const nextNode = (bit === '0') ? (currentNode.left || currentNode) : (currentNode.right || currentNode);

        document.querySelectorAll('.huffman-edge.highlighted').forEach(e => e.classList.remove('highlighted'));
        document.querySelectorAll('.huffman-svg-node.highlighted').forEach(n => n.classList.remove('highlighted'));

        const edgeEl = document.getElementById(`edge_${currentNode.id}_${nextNode.id}`);
        if (edgeEl) edgeEl.classList.add('highlighted');
        const nodeEl = document.getElementById(nextNode.id);
        if (nodeEl) nodeEl.classList.add('highlighted');

        bitIdx++;

        if (nextNode.isLeaf) {
          decodedResult += nextNode.char;
          const disp = nextNode.char === ' ' ? '␣ (Space)' : `'${nextNode.char}'`;
          decodeTraceLog.innerHTML += `
            <div>Step ${stepCount++}: Read bit <code>${bit}</code> &rarr; Reached leaf <strong>${escapeHtml(disp)}</strong>! Output: "<code>${escapeHtml(decodedResult)}</code>"</div>
          `;
          currentNode = root;
        } else {
          const dir = bit === '0' ? 'Left (0)' : 'Right (1)';
          decodeTraceLog.innerHTML += `
            <div>Step ${stepCount++}: Read bit <code>${bit}</code> &rarr; Branch <strong>${dir}</strong> to node (weight ${nextNode.freq})</div>
          `;
          currentNode = nextNode;
        }

        decodeTraceLog.scrollTop = decodeTraceLog.scrollHeight;
      }, 350);
    }

    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const preset = btn.getAttribute('data-preset') || '';
        textInput.value = preset;
        renderHuffman();
      });
    });

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        textInput.value = '';
        presetButtons.forEach(b => b.classList.remove('active'));
        renderHuffman();
        textInput.focus();
      });
    }

    textInput.addEventListener('input', () => {
      presetButtons.forEach(b => {
        if (b.getAttribute('data-preset') === textInput.value) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      renderHuffman();
    });

    renderHuffman();
  }

  // =========================================================================
  // 9. INITIALIZATION
  // =========================================================================

  function init() {
    initTheme();
    initTabs();
    setupRegisterEvents();
    renderRegister();
    setupTargetPracticeEvents();
    setupHexPlaygroundEvents();
    setupAdderEvents();
    calculateBinaryAddition();
    setupSubtractionEvents();
    calculateBinarySubtraction();
    setupBitwiseEvents();
    calculateBitwiseLogic();
    setupShiftEvents();
    renderShifts();
    setupUnitsCalculator();
    setupCharacterEncoderEvents();
    renderCharacterTokens();
    setupCharacterSetsLab();
    initHuffmanLab();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
