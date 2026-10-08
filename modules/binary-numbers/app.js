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
    // Tab 1: Register (Pre-populated with 21: 16 + 4 + 1 so students immediately see switches in action)
    bits: [1, 0, 1, 0, 1, 0, 0, 0], // index 0 = LSB (1), index 7 = MSB (128 / -128)
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

    // Tab 1: 3-Way Live Converter (Independent BigInt up to 40-Bit)
    convBitSizeBadge: document.getElementById('convBitSizeBadge'),
    converterPresetButtons: document.querySelectorAll('.converter-preset-btn'),
    denarySubtextLabel: document.getElementById('denarySubtextLabel'),
    hexSubtextLabel: document.getElementById('hexSubtextLabel'),
    binarySubtextLabel: document.getElementById('binarySubtextLabel'),
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

    // Tab 1: Target Practice Challenge (Arcade Lab)
    btnToggleAudio: document.getElementById('btnToggleAudio'),
    btnPracticeRelaxed: document.getElementById('btnPracticeRelaxed'),
    btnPracticeSprint: document.getElementById('btnPracticeSprint'),
    btnModeFlipper: document.getElementById('btnModeFlipper'),
    btnModeBinToDec: document.getElementById('btnModeBinToDec'),
    btnModeBinToHex: document.getElementById('btnModeBinToHex'),
    btnModeMixed: document.getElementById('btnModeMixed'),
    targetModeBadge: document.getElementById('targetModeBadge'),
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
    sprintRankBadge: document.getElementById('sprintRankBadge'),
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
    gameFlipperControls: document.getElementById('gameFlipperControls'),
    gameBinToDecControls: document.getElementById('gameBinToDecControls'),
    gameBinToHexControls: document.getElementById('gameBinToHexControls'),
    gameBitButtons: document.querySelectorAll('.game-bit-btn'),
    btnGameClearBits: document.getElementById('btnGameClearBits'),
    formBinToDec: document.getElementById('formBinToDec'),
    gameDecInput: document.getElementById('gameDecInput'),
    btnSkipBinToDec: document.getElementById('btnSkipBinToDec'),
    gameDecFeedback: document.getElementById('gameDecFeedback'),
    formBinToHex: document.getElementById('formBinToHex'),
    gameHexInput: document.getElementById('gameHexInput'),
    btnSkipBinToHex: document.getElementById('btnSkipBinToHex'),
    gameHexFeedback: document.getElementById('gameHexFeedback'),

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
    const urlParam = new URLSearchParams(window.location.search).get('theme');
    const savedTheme = urlParam || localStorage.getItem('theme') || localStorage.getItem('gcse_theme') || 'light';
    applyTheme(savedTheme);

    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        const nextTheme = isDark ? 'light' : 'dark';
        applyTheme(nextTheme);
        localStorage.setItem('theme', nextTheme);
        localStorage.setItem('gcse_theme', nextTheme);
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

    // Deep-linking support for tab query param or hash
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab') || window.location.hash.replace('#', '').replace('tab-', '');
    if (initialTab) {
      const matchBtn = Array.from(DOM.tabButtons).find(b => b.getAttribute('data-tab') === initialTab);
      if (matchBtn) matchBtn.click();
    }
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
      } else {
        DOM.msbPlaceValueLabel.textContent = '128';
        DOM.msbPlaceValueLabel.classList.remove('msb-negative');
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
  }

  // =========================================================================
  // 4A. STANDALONE 3-WAY NUMBER CONVERTER (UP TO 40-BIT)
  // =========================================================================

  let converterVal = 0n;
  const MAX_CONVERTER_VAL = 1099511627775n; // (1n << 40n) - 1n

  function formatBinaryNibbles(binStr) {
    if (!binStr || binStr === '0') return '0';
    const rem = binStr.length % 4;
    const parts = [];
    if (rem > 0) {
      parts.push(binStr.slice(0, rem));
    }
    for (let i = rem; i < binStr.length; i += 4) {
      parts.push(binStr.slice(i, i + 4));
    }
    return parts.join(' ');
  }

  function updateConverterUI(source) {
    const bitLen = converterVal === 0n ? 0 : converterVal.toString(2).length;

    // 1. Bit width badge
    if (DOM.convBitSizeBadge) {
      if (converterVal === 0n) {
        DOM.convBitSizeBadge.textContent = '0 bits (Value: 0)';
      } else if (bitLen <= 8) {
        DOM.convBitSizeBadge.textContent = `8 bits (1 Byte • ${bitLen} active)`;
      } else if (bitLen <= 16) {
        DOM.convBitSizeBadge.textContent = `16 bits (2 Bytes • ${bitLen} active)`;
      } else if (bitLen <= 24) {
        DOM.convBitSizeBadge.textContent = `24 bits (3 Bytes / RGB • ${bitLen} active)`;
      } else if (bitLen <= 32) {
        DOM.convBitSizeBadge.textContent = `32 bits (4 Bytes / IPv4 • ${bitLen} active)`;
      } else {
        DOM.convBitSizeBadge.textContent = `40 bits (5 Bytes / 1 TiB • ${bitLen} active)`;
      }
    }

    // 2. Denary
    if (source !== 'denary' && DOM.liveDenaryInput) {
      DOM.liveDenaryInput.value = converterVal.toString(10);
    }
    if (DOM.denarySubtextLabel) {
      DOM.denarySubtextLabel.textContent = `Formatted: ${converterVal.toLocaleString()} (0 to 2⁴⁰)`;
    }

    // 3. Hex
    const hexStr = converterVal.toString(16).toUpperCase();
    if (source !== 'hex' && DOM.liveHexInput) {
      DOM.liveHexInput.value = hexStr;
    }
    if (DOM.hexSubtextLabel) {
      const bytes = Math.max(1, Math.ceil(hexStr.length / 2));
      DOM.hexSubtextLabel.textContent = `Code literal: 0x${hexStr} (${bytes} byte${bytes === 1 ? '' : 's'})`;
    }

    // 4. Binary
    const binStr = converterVal.toString(2);
    if (source !== 'binary' && DOM.liveBinaryInput) {
      DOM.liveBinaryInput.value = formatBinaryNibbles(binStr);
    }
    if (DOM.binarySubtextLabel) {
      DOM.binarySubtextLabel.textContent = `Bit length: ${bitLen === 0 ? 1 : bitLen} bits (grouped in nibbles)`;
    }
  }

  function setConverterValue(newVal, source) {
    if (newVal < 0n) newVal = 0n;
    if (newVal > MAX_CONVERTER_VAL) newVal = MAX_CONVERTER_VAL;
    converterVal = newVal;
    updateConverterUI(source);
  }

  function setupStandaloneConverter() {
    // Preset buttons
    if (DOM.converterPresetButtons) {
      DOM.converterPresetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const raw = btn.getAttribute('data-val') || '0';
          try {
            const val = BigInt(raw);
            setConverterValue(val, null);
            playSynthSound('click');
          } catch (e) {}
        });
      });
    }

    // Steppers (+1 / -1)
    const step = (delta) => {
      let next = converterVal + BigInt(delta);
      if (next < 0n) next = 0n;
      if (next > MAX_CONVERTER_VAL) next = MAX_CONVERTER_VAL;
      setConverterValue(next, null);
      playSynthSound('click');
    };

    if (DOM.stepUpDenary) DOM.stepUpDenary.addEventListener('click', () => step(1));
    if (DOM.stepDownDenary) DOM.stepDownDenary.addEventListener('click', () => step(-1));
    if (DOM.stepUpHex) DOM.stepUpHex.addEventListener('click', () => step(1));
    if (DOM.stepDownHex) DOM.stepDownHex.addEventListener('click', () => step(-1));
    if (DOM.stepUpBinary) DOM.stepUpBinary.addEventListener('click', () => step(1));
    if (DOM.stepDownBinary) DOM.stepDownBinary.addEventListener('click', () => step(-1));

    // Inputs
    if (DOM.liveDenaryInput) {
      DOM.liveDenaryInput.addEventListener('input', (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = raw;
        if (raw === '') {
          setConverterValue(0n, 'denary');
          return;
        }
        try {
          let val = BigInt(raw);
          if (val > MAX_CONVERTER_VAL) {
            val = MAX_CONVERTER_VAL;
            e.target.value = val.toString(10);
          }
          setConverterValue(val, 'denary');
        } catch (err) {}
      });
    }

    if (DOM.liveHexInput) {
      DOM.liveHexInput.addEventListener('input', (e) => {
        let raw = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 10).toUpperCase();
        e.target.value = raw;
        if (raw === '') {
          setConverterValue(0n, 'hex');
          return;
        }
        try {
          let val = BigInt('0x' + raw);
          if (val > MAX_CONVERTER_VAL) {
            val = MAX_CONVERTER_VAL;
            e.target.value = val.toString(16).toUpperCase();
          }
          setConverterValue(val, 'hex');
        } catch (err) {}
      });
    }

    if (DOM.liveBinaryInput) {
      DOM.liveBinaryInput.addEventListener('input', (e) => {
        let raw = e.target.value.replace(/[^01]/g, '').slice(0, 40);
        if (raw === '') {
          setConverterValue(0n, 'binary');
          return;
        }
        try {
          let val = BigInt('0b' + raw);
          if (val > MAX_CONVERTER_VAL) val = MAX_CONVERTER_VAL;
          setConverterValue(val, 'binary');
        } catch (err) {}
      });

      DOM.liveBinaryInput.addEventListener('blur', () => {
        DOM.liveBinaryInput.value = formatBinaryNibbles(converterVal.toString(2));
      });
    }

    // Initial render
    setConverterValue(0n, null);
  }

  // =========================================================================
  // 4B. TAB 1: AUDIO SYNTH & ARCADE TARGET PRACTICE CHALLENGE
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

      if (type === 'click' || type === 'tap') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.035);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.035);
      } else if (type === 'switch') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.045);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.045);
      } else if (type === 'correct' || type === 'success') {
        // Ascending triumphant major chord (C5, E5, G5)
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const startTime = now + idx * 0.06;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.12, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.28);
        });
      } else if (type === 'wrong') {
        // Low error thud / buzzer (160Hz -> 80Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.14);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'victory') {
        // 4-note victory arpeggio: C5 -> E5 -> G5 -> C6
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const startTime = now + idx * 0.09;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.14, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.35);
        });
      } else if (type === 'perfect10') {
        // 5-note grand fanfare with shimmer: C5 -> E5 -> G5 -> C6 -> E6
        [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx === 4 ? 'triangle' : 'sine';
          const startTime = now + idx * 0.11;
          const dur = idx === 4 ? 0.8 : 0.45;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.16, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + dur);
        });
      }
    } catch (e) {}
  }

  // --- TARGET PRACTICE ARCADE LAB ---
  const targetState = {
    gameMode: 'flipper', // 'flipper' | 'bin2dec' | 'bin2hex' | 'mixed'
    currentType: 'flipper', // active question type: 'flipper' | 'bin2dec' | 'bin2hex'
    targetNum: 42,
    targetPattern: '00101010',
    gameBits: [0, 0, 0, 0, 0, 0, 0, 0], // User 8-bit switches in Bit Flipper
    streak: 0,
    isSprint: true, // User request: Start in sprint mode by default!
    sprintRunning: false,
    sprintTimeLeft: 60,
    sprintScore: 0,
    sprintTimerId: null,
    sprintBest: parseInt(localStorage.getItem('binary_sprint_best_60s') || '0', 10),
  };

  function getSprintRank(score) {
    if (score >= 20) return 'Rank: ⚡ Hex Grandmaster (Top 1%)';
    if (score >= 15) return 'Rank: 🏆 Byte Master';
    if (score >= 10) return 'Rank: 🚀 Nibble Navigator';
    if (score >= 5) return 'Rank: 💡 Logic Practitioner';
    return 'Rank: 🌱 Bit Novice';
  }

  function renderGameBits() {
    if (!DOM.gameBitButtons) return;
    DOM.gameBitButtons.forEach(btn => {
      const bitIdx = parseInt(btn.getAttribute('data-bit'), 10);
      const val = targetState.gameBits[bitIdx];
      btn.classList.toggle('active', val === 1);
      const valSpan = document.getElementById(`gbit-${bitIdx}`);
      if (valSpan) valSpan.textContent = val;
    });
  }

  function updateFlipperFeedback() {
    const currentVal = targetState.gameBits.reduce((acc, bit, idx) => acc + (bit ? Math.pow(2, idx) : 0), 0);
    if (DOM.targetCurrentVal) DOM.targetCurrentVal.textContent = currentVal;

    if (!DOM.targetDiffBadge) return;
    const diff = targetState.targetNum - currentVal;
    if (diff === 0) {
      DOM.targetDiffBadge.textContent = '🎉 MATCH!';
      DOM.targetDiffBadge.style.background = 'rgba(16, 185, 129, 0.2)';
      DOM.targetDiffBadge.style.color = '#10b981';
      DOM.targetDiffBadge.style.borderColor = '#10b981';
      onChallengeSuccess();
    } else if (diff > 0) {
      DOM.targetDiffBadge.textContent = `Needs +${diff}`;
      DOM.targetDiffBadge.style.background = 'var(--isaac-magenta-tint)';
      DOM.targetDiffBadge.style.color = 'var(--isaac-magenta)';
      DOM.targetDiffBadge.style.borderColor = 'var(--isaac-magenta)';
    } else {
      const over = Math.abs(diff);
      DOM.targetDiffBadge.textContent = `Over by ${over}`;
      DOM.targetDiffBadge.style.background = 'var(--isaac-yellow-tint)';
      DOM.targetDiffBadge.style.color = '#b45309';
      DOM.targetDiffBadge.style.borderColor = 'var(--isaac-yellow-border)';
    }
  }

  function rollNewQuestion() {
    // 1. Determine active question type
    if (targetState.gameMode === 'mixed') {
      const types = ['flipper', 'bin2dec', 'bin2hex'];
      targetState.currentType = types[Math.floor(Math.random() * types.length)];
    } else {
      targetState.currentType = targetState.gameMode;
    }

    // 2. Pick new target number (1..255, different from current)
    let nextNum;
    do {
      nextNum = Math.floor(Math.random() * 254) + 1;
    } while (nextNum === targetState.targetNum);
    targetState.targetNum = nextNum;
    targetState.targetPattern = nextNum.toString(2).padStart(8, '0');
    targetState.gameBits = [0, 0, 0, 0, 0, 0, 0, 0];

    // 3. Render appropriate controls & prompts
    const formattedBin = `${targetState.targetPattern.slice(0, 4)} ${targetState.targetPattern.slice(4)}`;

    if (targetState.currentType === 'flipper') {
      if (DOM.targetModeBadge) {
        DOM.targetModeBadge.textContent = 'BIT FLIPPER';
        DOM.targetModeBadge.style.background = 'rgba(99, 102, 241, 0.15)';
        DOM.targetModeBadge.style.color = '#4338ca';
      }
      if (DOM.targetBaseLabel) DOM.targetBaseLabel.textContent = 'Target Number (Denary):';
      if (DOM.targetNumberDisplay) DOM.targetNumberDisplay.textContent = targetState.targetNum;

      if (DOM.gameFlipperControls) DOM.gameFlipperControls.style.display = 'block';
      if (DOM.gameBinToDecControls) DOM.gameBinToDecControls.style.display = 'none';
      if (DOM.gameBinToHexControls) DOM.gameBinToHexControls.style.display = 'none';

      renderGameBits();
      updateFlipperFeedback();
    } else if (targetState.currentType === 'bin2dec') {
      if (DOM.targetModeBadge) {
        DOM.targetModeBadge.textContent = 'BIN ➔ DENARY';
        DOM.targetModeBadge.style.background = 'rgba(16, 185, 129, 0.15)';
        DOM.targetModeBadge.style.color = '#047857';
      }
      if (DOM.targetBaseLabel) DOM.targetBaseLabel.textContent = 'Convert Binary Pattern:';
      if (DOM.targetNumberDisplay) DOM.targetNumberDisplay.textContent = formattedBin;

      if (DOM.gameFlipperControls) DOM.gameFlipperControls.style.display = 'none';
      if (DOM.gameBinToDecControls) DOM.gameBinToDecControls.style.display = 'block';
      if (DOM.gameBinToHexControls) DOM.gameBinToHexControls.style.display = 'none';

      if (DOM.gameDecInput) {
        DOM.gameDecInput.value = '';
        DOM.gameDecInput.focus();
      }
      if (DOM.gameDecFeedback) DOM.gameDecFeedback.textContent = '';
    } else if (targetState.currentType === 'bin2hex') {
      if (DOM.targetModeBadge) {
        DOM.targetModeBadge.textContent = 'BIN ➔ HEX';
        DOM.targetModeBadge.style.background = 'rgba(200, 0, 107, 0.15)';
        DOM.targetModeBadge.style.color = 'var(--isaac-magenta)';
      }
      if (DOM.targetBaseLabel) DOM.targetBaseLabel.textContent = 'Convert Binary Pattern:';
      if (DOM.targetNumberDisplay) DOM.targetNumberDisplay.textContent = formattedBin;

      if (DOM.gameFlipperControls) DOM.gameFlipperControls.style.display = 'none';
      if (DOM.gameBinToDecControls) DOM.gameBinToDecControls.style.display = 'none';
      if (DOM.gameBinToHexControls) DOM.gameBinToHexControls.style.display = 'block';

      if (DOM.gameHexInput) {
        DOM.gameHexInput.value = '';
        DOM.gameHexInput.focus();
      }
      if (DOM.gameHexFeedback) DOM.gameHexFeedback.textContent = '';
    }
  }

  let successCooldown = false;
  function onChallengeSuccess() {
    if (successCooldown) return;
    successCooldown = true;

    playSynthSound('success');

    if (DOM.targetCardContainer) {
      DOM.targetCardContainer.classList.add('target-card-matched');
      setTimeout(() => {
        if (DOM.targetCardContainer) DOM.targetCardContainer.classList.remove('target-card-matched');
      }, 500);
    }

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
      successCooldown = false;
      rollNewQuestion();
    }, 450);
  }

  function startSprint() {
    targetState.sprintRunning = true;
    targetState.sprintTimeLeft = 60;
    targetState.sprintScore = 0;

    if (DOM.sprintStartLauncherCard) DOM.sprintStartLauncherCard.style.display = 'none';
    if (DOM.sprintGameOverCard) DOM.sprintGameOverCard.style.display = 'none';
    if (DOM.targetCardContainer) DOM.targetCardContainer.style.display = 'block';
    if (DOM.sprintActiveTimerBanner) DOM.sprintActiveTimerBanner.style.display = 'block';

    if (DOM.sprintScoreVal) DOM.sprintScoreVal.textContent = '0';
    if (DOM.sprintTimerVal) DOM.sprintTimerVal.textContent = '60';
    if (DOM.sprintBigCountdown) {
      DOM.sprintBigCountdown.textContent = '60s';
      DOM.sprintBigCountdown.style.color = 'var(--isaac-magenta)';
    }
    if (DOM.sprintTimerProgress) {
      DOM.sprintTimerProgress.style.width = '100%';
      DOM.sprintTimerProgress.style.background = 'var(--isaac-magenta)';
    }

    rollNewQuestion();

    if (targetState.sprintTimerId) clearInterval(targetState.sprintTimerId);
    targetState.sprintTimerId = setInterval(() => {
      targetState.sprintTimeLeft--;
      const pct = Math.max(0, (targetState.sprintTimeLeft / 60) * 100);
      if (DOM.sprintTimerVal) DOM.sprintTimerVal.textContent = targetState.sprintTimeLeft;
      if (DOM.sprintBigCountdown) DOM.sprintBigCountdown.textContent = `${targetState.sprintTimeLeft}s`;
      if (DOM.sprintTimerProgress) DOM.sprintTimerProgress.style.width = `${pct}%`;

      if (DOM.sprintBigCountdown) {
        if (targetState.sprintTimeLeft <= 10) {
          DOM.sprintBigCountdown.style.color = '#ef4444';
          if (DOM.sprintTimerProgress) DOM.sprintTimerProgress.style.background = '#ef4444';
        } else if (targetState.sprintTimeLeft <= 25) {
          DOM.sprintBigCountdown.style.color = '#f59e0b';
          if (DOM.sprintTimerProgress) DOM.sprintTimerProgress.style.background = '#f59e0b';
        } else {
          DOM.sprintBigCountdown.style.color = 'var(--isaac-magenta)';
          if (DOM.sprintTimerProgress) DOM.sprintTimerProgress.style.background = 'var(--isaac-magenta)';
        }
      }

      if (targetState.sprintTimeLeft <= 0) {
        clearInterval(targetState.sprintTimerId);
        targetState.sprintRunning = false;

        if (DOM.targetCardContainer) DOM.targetCardContainer.style.display = 'none';
        if (DOM.sprintActiveTimerBanner) DOM.sprintActiveTimerBanner.style.display = 'none';
        if (DOM.sprintGameOverCard) DOM.sprintGameOverCard.style.display = 'block';

        if (DOM.sprintFinalScoreVal) DOM.sprintFinalScoreVal.textContent = targetState.sprintScore;
        if (DOM.sprintRankBadge) DOM.sprintRankBadge.textContent = getSprintRank(targetState.sprintScore);

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

      if (DOM.targetCardContainer) DOM.targetCardContainer.style.display = 'block';
      if (DOM.sprintActiveTimerBanner) DOM.sprintActiveTimerBanner.style.display = 'none';
      if (DOM.sprintStartLauncherCard) DOM.sprintStartLauncherCard.style.display = 'none';
      if (DOM.sprintGameOverCard) DOM.sprintGameOverCard.style.display = 'none';

      targetState.streak = 0;
      if (DOM.currentStreakVal) DOM.currentStreakVal.textContent = '0';
      rollNewQuestion();
    }
  }

  function setupTargetPracticeEvents() {
    // Sound toggle
    if (DOM.btnToggleAudio) {
      DOM.btnToggleAudio.addEventListener('click', () => {
        isAudioMuted = !isAudioMuted;
        DOM.btnToggleAudio.textContent = isAudioMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
        if (!isAudioMuted) playSynthSound('click');
      });
    }

    // Game Mode selection pills
    const setGameMode = (mode) => {
      targetState.gameMode = mode;
      [DOM.btnModeFlipper, DOM.btnModeBinToDec, DOM.btnModeBinToHex, DOM.btnModeMixed].forEach(btn => {
        if (btn) btn.classList.remove('active');
      });
      if (mode === 'flipper' && DOM.btnModeFlipper) DOM.btnModeFlipper.classList.add('active');
      if (mode === 'bin2dec' && DOM.btnModeBinToDec) DOM.btnModeBinToDec.classList.add('active');
      if (mode === 'bin2hex' && DOM.btnModeBinToHex) DOM.btnModeBinToHex.classList.add('active');
      if (mode === 'mixed' && DOM.btnModeMixed) DOM.btnModeMixed.classList.add('active');
      playSynthSound('click');
      if (DOM.targetCardContainer && DOM.targetCardContainer.style.display !== 'none') {
        rollNewQuestion();
      }
    };

    if (DOM.btnModeFlipper) DOM.btnModeFlipper.addEventListener('click', () => setGameMode('flipper'));
    if (DOM.btnModeBinToDec) DOM.btnModeBinToDec.addEventListener('click', () => setGameMode('bin2dec'));
    if (DOM.btnModeBinToHex) DOM.btnModeBinToHex.addEventListener('click', () => setGameMode('bin2hex'));
    if (DOM.btnModeMixed) DOM.btnModeMixed.addEventListener('click', () => setGameMode('mixed'));

    // Sprint vs Relaxed selectors
    if (DOM.btnPracticeSprint) DOM.btnPracticeSprint.addEventListener('click', () => setSprintMode(true));
    if (DOM.btnPracticeRelaxed) DOM.btnPracticeRelaxed.addEventListener('click', () => setSprintMode(false));
    if (DOM.btnBackToRelaxed) DOM.btnBackToRelaxed.addEventListener('click', () => setSprintMode(false));
    if (DOM.btnStartSprint) DOM.btnStartSprint.addEventListener('click', startSprint);
    if (DOM.btnPlayAgainSprint) DOM.btnPlayAgainSprint.addEventListener('click', startSprint);

    // 1. Bit Flipper Switches
    if (DOM.gameBitButtons) {
      DOM.gameBitButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const bitIdx = parseInt(btn.getAttribute('data-bit'), 10);
          targetState.gameBits[bitIdx] = targetState.gameBits[bitIdx] === 1 ? 0 : 1;
          playSynthSound('click');
          renderGameBits();
          updateFlipperFeedback();
        });
      });
    }

    if (DOM.btnGameClearBits) {
      DOM.btnGameClearBits.addEventListener('click', () => {
        targetState.gameBits = [0, 0, 0, 0, 0, 0, 0, 0];
        playSynthSound('click');
        renderGameBits();
        updateFlipperFeedback();
      });
    }

    // Skip in Flipper mode
    if (DOM.btnSkipTarget) {
      DOM.btnSkipTarget.addEventListener('click', () => {
        if (!targetState.isSprint) {
          targetState.streak = 0;
          if (DOM.currentStreakVal) DOM.currentStreakVal.textContent = '0';
        }
        playSynthSound('click');
        rollNewQuestion();
      });
    }

    // 2. Bin -> Denary Form Submission
    if (DOM.formBinToDec) {
      DOM.formBinToDec.addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = DOM.gameDecInput ? DOM.gameDecInput.value.trim() : '';
        if (raw === '') return;
        const val = parseInt(raw, 10);
        if (val === targetState.targetNum) {
          if (DOM.gameDecFeedback) {
            DOM.gameDecFeedback.textContent = `🎉 Correct! ${targetState.targetNum}`;
            DOM.gameDecFeedback.style.color = '#10b981';
          }
          onChallengeSuccess();
        } else {
          if (DOM.gameDecFeedback) {
            DOM.gameDecFeedback.textContent = `❌ Not quite! Place values of 1 bits add up differently. Try again!`;
            DOM.gameDecFeedback.style.color = '#ef4444';
          }
          if (DOM.gameDecInput) {
            DOM.gameDecInput.select();
            DOM.gameDecInput.focus();
          }
        }
      });
    }

    if (DOM.btnSkipBinToDec) {
      DOM.btnSkipBinToDec.addEventListener('click', () => {
        if (!targetState.isSprint) {
          targetState.streak = 0;
          if (DOM.currentStreakVal) DOM.currentStreakVal.textContent = '0';
        }
        playSynthSound('click');
        rollNewQuestion();
      });
    }

    // 3. Bin -> Hex Form Submission
    if (DOM.formBinToHex) {
      DOM.formBinToHex.addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = DOM.gameHexInput ? DOM.gameHexInput.value.trim().toUpperCase() : '';
        if (raw === '') return;
        const val = parseInt(raw, 16);
        const expectedHex = targetState.targetNum.toString(16).toUpperCase().padStart(2, '0');
        if (val === targetState.targetNum) {
          if (DOM.gameHexFeedback) {
            DOM.gameHexFeedback.textContent = `🎉 Correct! 0x${expectedHex}`;
            DOM.gameHexFeedback.style.color = '#10b981';
          }
          onChallengeSuccess();
        } else {
          const highHex = targetState.targetPattern.slice(0, 4);
          const lowHex = targetState.targetPattern.slice(4);
          if (DOM.gameHexFeedback) {
            DOM.gameHexFeedback.textContent = `❌ Hint: High nibble (${highHex}) = ${parseInt(highHex, 2).toString(16).toUpperCase()}, Low nibble (${lowHex}) = ${parseInt(lowHex, 2).toString(16).toUpperCase()}`;
            DOM.gameHexFeedback.style.color = '#ef4444';
          }
          if (DOM.gameHexInput) {
            DOM.gameHexInput.select();
            DOM.gameHexInput.focus();
          }
        }
      });
    }

    if (DOM.btnSkipBinToHex) {
      DOM.btnSkipBinToHex.addEventListener('click', () => {
        if (!targetState.isSprint) {
          targetState.streak = 0;
          if (DOM.currentStreakVal) DOM.currentStreakVal.textContent = '0';
        }
        playSynthSound('click');
        rollNewQuestion();
      });
    }

    // Set initial mode (Sprint by default)
    setSprintMode(true);
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
  // =========================================================================
  // =========================================================================
  // 7. TAB 0: "BITMASTER" BINARY & HEX MENTAL ARCADE ENGINE
  // =========================================================================

  // Stage Vector SVG Icons (No emojis)
  const BITMASTER_STAGE_ICONS = {
    1: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3"/></svg>`,
    2: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="6" y1="9" x2="6" y2="15"/><line x1="10" y1="9" x2="10" y2="15"/><line x1="14" y1="9" x2="14" y2="15"/><line x1="18" y1="9" x2="18" y2="15"/></svg>`,
    3: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    4: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/></svg>`,
    5: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="12" y1="5" x2="12" y2="13"/><line x1="7" y1="18" x2="17" y2="18"/></svg>`,
    6: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>`,
    7: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`
  };

  const BITMASTER_STAGES = [
    {
      id: 1,
      title: "Stage 1: The 4-Bit Nibble",
      shortTitle: "The 4-Bit Nibble",
      subtitle: "4-Bit Binary & Denary Mastery (0–15)",
      svgIcon: BITMASTER_STAGE_ICONS[1],
      color: "#3b82f6",
      levels: [
        { id: 1, name: "Apprentice", mode: "mc_nibble_den2bin", desc: "Denary → 4-Bit Binary (e.g. 9 → 1001)" },
        { id: 2, name: "Operator", mode: "mc_nibble_bin2den", desc: "4-Bit Binary → Denary (e.g. 0110 → 6)" },
        { id: 3, name: "Tactician", mode: "switches_nibble", desc: "Toggle 4-Bit Switches with Place Values" },
        { id: 4, name: "Speed Sprint", mode: "sprint_60s", desc: "60s Speed Sprint: Solve as many Nibble conversions as you can!" }
      ]
    },
    {
      id: 2,
      title: "Stage 2: The 8-Bit Byte",
      shortTitle: "The 8-Bit Byte",
      subtitle: "8-Bit Binary & Denary (0–255)",
      svgIcon: BITMASTER_STAGE_ICONS[2],
      color: "#10b981",
      levels: [
        { id: 1, name: "Apprentice", mode: "mc_byte_den2bin", desc: "Denary → 8-Bit Binary (e.g. 42 → 00101010)" },
        { id: 2, name: "Operator", mode: "mc_byte_bin2den", desc: "8-Bit Binary → Denary (Place Values 128..1)" },
        { id: 3, name: "Tactician", mode: "switches_byte", desc: "Toggle 8-Bit Switches to Match Target Total" },
        { id: 4, name: "Speed Sprint", mode: "sprint_60s", desc: "60s Speed Sprint: Rapid 8-bit conversions under pressure!" }
      ]
    },
    {
      id: 3,
      title: "Stage 3: Hexadecimal Scribe",
      shortTitle: "Hexadecimal Scribe",
      subtitle: "Hexadecimal ↔ Binary ↔ Denary",
      svgIcon: BITMASTER_STAGE_ICONS[3],
      color: "#8b5cf6",
      levels: [
        { id: 1, name: "Apprentice", mode: "mc_hex_nibble_to_den", desc: "Single Hex Digits → Denary (0x0 to 0xF)" },
        { id: 2, name: "Operator", mode: "mc_hex_den_to_nibble", desc: "Denary → Hex Digits (e.g. 14 → 0xE)" },
        { id: 3, name: "Tactician", mode: "mc_hex_byte", desc: "2-Digit Hex Bytes (0x00 to 0xFF)" },
        { id: 4, name: "Speed Sprint", mode: "sprint_60s", desc: "60s Speed Sprint: Rapid-fire Hexadecimal conversions!" }
      ]
    },
    {
      id: 4,
      title: "Stage 4: Binary Addition",
      shortTitle: "Binary Addition",
      subtitle: "Carries, Arithmetic & Column Addition",
      svgIcon: BITMASTER_STAGE_ICONS[4],
      color: "#f59e0b",
      levels: [
        { id: 1, name: "Apprentice", mode: "math_add_simple", desc: "4-Bit Addition Grid: Align columns & flip result bits" },
        { id: 2, name: "Operator", mode: "math_add_carries", desc: "8-Bit Addition with Carries: 1 + 1 = 0 (carry 1)" },
        { id: 3, name: "Tactician", mode: "math_add_8bit", desc: "Full 8-Bit Binary Addition Grid Challenge" },
        { id: 4, name: "Speed Sprint", mode: "sprint_60s", desc: "60s Speed Sprint: Rapid binary addition against the clock!" }
      ]
    },
    {
      id: 5,
      title: "Stage 5: Two's Complement",
      shortTitle: "Two's Complement",
      subtitle: "Signed Binary & Negative Values (-128 MSB)",
      svgIcon: BITMASTER_STAGE_ICONS[5],
      color: "#06b6d4",
      levels: [
        { id: 1, name: "Apprentice", mode: "mc_twos_comp_sign", desc: "Sign Identification (MSB 1 = Negative)" },
        { id: 2, name: "Operator", mode: "mc_twos_comp_convert", desc: "Invert & Add 1 (+V to -V Conversion)" },
        { id: 3, name: "Tactician", mode: "mc_twos_comp_eval", desc: "Signed Binary → Denary (-128 MSB)" },
        { id: 4, name: "Speed Sprint", mode: "sprint_60s", desc: "60s Speed Sprint: Rapid Signed Binary interpretation!" }
      ]
    },
    {
      id: 6,
      title: "Stage 6: Logical Shifts",
      shortTitle: "Logical Shifts",
      subtitle: "Multiplication & Division (×2, ÷2)",
      svgIcon: BITMASTER_STAGE_ICONS[6],
      color: "#ec4899",
      levels: [
        { id: 1, name: "Apprentice", mode: "mc_shift_left", desc: "Left Shifts (Multiply by 2, 4, 8)" },
        { id: 2, name: "Operator", mode: "mc_shift_right", desc: "Right Shifts (Divide by 2, 4 with Truncation)" },
        { id: 3, name: "Tactician", mode: "mc_shift_multistep", desc: "Multi-Step Shifts & Arithmetic Effect" },
        { id: 4, name: "Speed Sprint", mode: "sprint_60s", desc: "60s Speed Sprint: Fast binary shifting under pressure!" }
      ]
    },
    {
      id: 7,
      title: "Stage 7: The Master Gauntlet",
      shortTitle: "The Master Gauntlet",
      subtitle: "Championship Blitz (All Topics Mixed)",
      svgIcon: BITMASTER_STAGE_ICONS[7],
      color: "#eab308",
      levels: [
        { id: 1, name: "Bronze Circuit", mode: "blitz_conversions", desc: "Conversions Blitz (Binary, Hex & Denary)" },
        { id: 2, name: "Silver Circuit", mode: "blitz_maths", desc: "Binary Arithmetic & Shifts Blitz" },
        { id: 3, name: "Gold Circuit", mode: "blitz_signed_hex", desc: "Two's Complement & Hex Advanced Blitz" },
        { id: 4, name: "Grandmaster Sprint", mode: "sprint_60s", desc: "60s Grandmaster Championship Gauntlet Sprint!" }
      ]
    }
  ];

  const BITMASTER_RANKS = [
    { minXp: 0, title: "Logic Novice", svgIcon: BITMASTER_STAGE_ICONS[1] },
    { minXp: 200, title: "Nibble Operator", svgIcon: BITMASTER_STAGE_ICONS[2] },
    { minXp: 550, title: "Byte Engineer", svgIcon: BITMASTER_STAGE_ICONS[4] },
    { minXp: 1100, title: "Hex Architect", svgIcon: BITMASTER_STAGE_ICONS[3] },
    { minXp: 1900, title: "Silicon Master", svgIcon: BITMASTER_STAGE_ICONS[6] },
    { minXp: 3000, title: "Grand BitMaster", svgIcon: BITMASTER_STAGE_ICONS[7] }
  ];

  const bitmasterState = {
    xp: 0,
    stars: {}, // key: "s{stageId}_l{levelId}" -> number (1-3)
    activeStage: 1,
    activeLevel: 1,
    currentQuestionIndex: 0,
    totalQuestions: 10,
    currentQuestion: null,
    mistakesThisRound: 0,
    correctThisRound: 0,
    startTime: null,
    timerInterval: null,
    elapsedSeconds: 0,
    switchBits: [0, 0, 0, 0, 0, 0, 0, 0],
    keypadBuffer: ""
  };

  function loadBitmasterSave() {
    try {
      const saved = localStorage.getItem('bitmaster_save_v1');
      if (saved) {
        const data = JSON.parse(saved);
        bitmasterState.xp = Number(data.xp) || 0;
        bitmasterState.stars = data.stars || {};
      }
    } catch (e) {
      console.warn("Could not load BitMaster save:", e);
    }
  }

  function saveBitmasterProgress() {
    try {
      localStorage.setItem('bitmaster_save_v1', JSON.stringify({
        xp: bitmasterState.xp,
        stars: bitmasterState.stars
      }));
    } catch (e) {
      console.warn("Could not write BitMaster save:", e);
    }
  }

  function calculateBitmasterStars() {
    return Object.values(bitmasterState.stars).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }

  function getCurrentBitmasterRank() {
    let rank = BITMASTER_RANKS[0];
    for (const r of BITMASTER_RANKS) {
      if (bitmasterState.xp >= r.minXp) {
        rank = r;
      }
    }
    return rank;
  }

  function getNextBitmasterRank() {
    for (let i = 0; i < BITMASTER_RANKS.length; i++) {
      if (bitmasterState.xp < BITMASTER_RANKS[i].minXp) {
        return BITMASTER_RANKS[i];
      }
    }
    return null;
  }

  function updateBitmasterHUD() {
    const totalStars = calculateBitmasterStars();
    const rank = getCurrentBitmasterRank();
    const nextRank = getNextBitmasterRank();

    const starEl = document.getElementById('bitmasterTotalStars');
    const xpEl = document.getElementById('bitmasterTotalXP');
    const avatarEl = document.getElementById('bitmasterAvatarIcon');
    const rankTitleEl = document.getElementById('bitmasterRankTitle');
    const xpLabelEl = document.getElementById('bitmasterXpLabel');
    const xpBarFillEl = document.getElementById('bitmasterXpBarFill');

    if (starEl) starEl.textContent = totalStars;
    if (xpEl) xpEl.textContent = bitmasterState.xp;
    if (avatarEl) avatarEl.innerHTML = rank.svgIcon;
    if (rankTitleEl) rankTitleEl.textContent = rank.title;

    if (nextRank) {
      const prevXp = rank.minXp;
      const targetXp = nextRank.minXp;
      const progress = Math.min(100, Math.max(0, Math.round(((bitmasterState.xp - prevXp) / (targetXp - prevXp)) * 100)));
      if (xpLabelEl) xpLabelEl.textContent = `${bitmasterState.xp} / ${targetXp} XP (${nextRank.title})`;
      if (xpBarFillEl) xpBarFillEl.style.width = `${progress}%`;
    } else {
      if (xpLabelEl) xpLabelEl.textContent = `${bitmasterState.xp} XP • Maximum Tier`;
      if (xpBarFillEl) xpBarFillEl.style.width = '100%';
    }
  }

  function showBitmasterScreen(screenName) {
    const screens = {
      stages: document.getElementById('bitmasterScreenStages'),
      levels: document.getElementById('bitmasterScreenLevels'),
      game: document.getElementById('bitmasterScreenGame'),
      summary: document.getElementById('bitmasterScreenSummary')
    };

    Object.values(screens).forEach(s => {
      if (s) {
        s.classList.remove('active');
        s.style.display = 'none';
      }
    });

    const backBtn = document.getElementById('bitmasterHudBackBtn');
    const backText = document.getElementById('bitmasterHudBackText');

    if (screenName === 'stages') {
      if (screens.stages) {
        screens.stages.classList.add('active');
        screens.stages.style.display = 'block';
      }
      if (backBtn) backBtn.style.display = 'none';
      renderBitmasterStagesGrid();
    } else if (screenName === 'levels') {
      if (screens.levels) {
        screens.levels.classList.add('active');
        screens.levels.style.display = 'block';
      }
      if (backBtn) {
        backBtn.style.display = 'inline-flex';
        if (backText) backText.textContent = 'Stages';
      }
      renderBitmasterLevelsScreen();
    } else if (screenName === 'game') {
      if (screens.game) {
        screens.game.classList.add('active');
        screens.game.style.display = 'block';
      }
      if (backBtn) {
        backBtn.style.display = 'inline-flex';
        if (backText) backText.textContent = 'Levels';
      }
    } else if (screenName === 'summary') {
      if (screens.summary) {
        screens.summary.classList.add('active');
        screens.summary.style.display = 'block';
      }
      if (backBtn) {
        backBtn.style.display = 'inline-flex';
        if (backText) backText.textContent = 'Levels';
      }
    }
  }

  function renderBitmasterStagesGrid() {
    const grid = document.getElementById('bitmasterStagesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    BITMASTER_STAGES.forEach(stage => {
      let stageStars = 0;
      stage.levels.forEach(lvl => {
        stageStars += (bitmasterState.stars[`s${stage.id}_l${lvl.id}`] || 0);
      });
      const maxStars = stage.levels.length * 3;

      const card = document.createElement('div');
      card.className = 'bitmaster-stage-card';
      card.innerHTML = `
        <div class="stage-card-badge stage-badge-s${stage.id}">
          <span class="stage-card-icon">${stage.svgIcon}</span>
        </div>
        <div class="stage-card-info">
          <div class="stage-card-header-row">
            <span class="stage-card-tag">STAGE 0${stage.id}</span>
            <span class="stage-card-stars">${stageStars}/${maxStars} ⭐</span>
          </div>
          <div class="stage-card-title">${stage.shortTitle}</div>
          <div class="stage-card-subtitle">${stage.subtitle}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        bitmasterState.activeStage = stage.id;
        playSynthSound('click');
        showBitmasterScreen('levels');
      });

      grid.appendChild(card);
    });
  }

  function renderBitmasterLevelsScreen() {
    const stage = BITMASTER_STAGES.find(s => s.id === bitmasterState.activeStage);
    if (!stage) return;

    const iconEl = document.getElementById('bitmasterStageHeaderIcon');
    const titleEl = document.getElementById('bitmasterStageHeaderTitle');
    const descEl = document.getElementById('bitmasterStageHeaderDesc');
    const listEl = document.getElementById('bitmasterLevelsList');

    if (iconEl) iconEl.innerHTML = stage.svgIcon;
    if (titleEl) titleEl.textContent = stage.title;
    if (descEl) descEl.textContent = stage.subtitle;
    if (!listEl) return;

    listEl.innerHTML = '';

    stage.levels.forEach(lvl => {
      const starsEarned = bitmasterState.stars[`s${stage.id}_l${lvl.id}`] || 0;
      const starStr = '⭐'.repeat(starsEarned) + '☆'.repeat(3 - starsEarned);
      const isSprint = (lvl.mode === 'sprint_60s');

      const lvlCard = document.createElement('div');
      lvlCard.className = 'bitmaster-level-card';
      lvlCard.innerHTML = `
        <div class="level-card-info">
          <div class="level-card-title-row">
            <span class="level-card-name">Level ${lvl.id}: ${lvl.name}</span>
            ${isSprint ? '<span class="badge badge-accent" style="margin-left: 6px; font-size: 10.5px; font-weight: 800;">⚡ 60s Sprint</span>' : ''}
            <span class="level-card-stars" style="margin-left: auto;">${starStr}</span>
          </div>
          <div class="level-card-desc">${lvl.desc}</div>
        </div>
        <button class="control-btn control-btn-primary level-play-btn">
          Start &rarr;
        </button>
      `;

      lvlCard.addEventListener('click', () => {
        bitmasterState.activeLevel = lvl.id;
        playSynthSound('click');
        startBitmasterRound();
      });

      listEl.appendChild(lvlCard);
    });
  }

  // =========================================================================
  // QUESTION GENERATOR WITH SMART GCSE DISTRACTORS
  // =========================================================================

  function generateDistractors(correctVal, min, max, type = 'denary') {
    const distractors = new Set();
    const correctStr = String(correctVal);

    if (type === 'denary') {
      const powers = [1, 2, 4, 8, 16, 32, 64];
      const randomPow = powers[Math.floor(Math.random() * powers.length)];
      if (correctVal + randomPow <= max) distractors.add(correctVal + randomPow);
      else if (correctVal - randomPow >= min) distractors.add(correctVal - randomPow);

      if (correctVal + 1 <= max) distractors.add(correctVal + 1);
      if (correctVal - 1 >= min) distractors.add(correctVal - 1);

      distractors.add(Math.min(max, Math.max(min, correctVal ^ 3)));
      distractors.add(Math.min(max, Math.max(min, correctVal ^ 12)));

      while (distractors.size < 3) {
        const offset = (Math.floor(Math.random() * 9) - 4) || 2;
        const candidate = Math.min(max, Math.max(min, correctVal + offset));
        if (candidate !== correctVal) distractors.add(candidate);
      }
    } else if (type === 'hex') {
      const den = parseInt(correctVal, 16);
      if (!isNaN(den)) {
        distractors.add((den).toString(10));
        distractors.add((Math.max(1, den - 16)).toString(16).toUpperCase());
        distractors.add((Math.min(255, den + 16)).toString(16).toUpperCase());
      }
      while (distractors.size < 3) {
        const rnd = Math.floor(Math.random() * 255).toString(16).toUpperCase();
        if (rnd !== correctVal) distractors.add(rnd);
      }
    } else if (type === 'binary') {
      const bitLen = correctVal.length;
      const arr = correctVal.split('');
      const flipIdx = Math.floor(Math.random() * bitLen);
      arr[flipIdx] = arr[flipIdx] === '1' ? '0' : '1';
      distractors.add(arr.join(''));

      const arr2 = correctVal.split('');
      const flipIdx2 = (flipIdx + 2) % bitLen;
      arr2[flipIdx2] = arr2[flipIdx2] === '1' ? '0' : '1';
      distractors.add(arr2.join(''));

      const arr3 = correctVal.split('');
      arr3[0] = arr3[0] === '1' ? '0' : '1';
      distractors.add(arr3.join(''));
    }

    return Array.from(distractors).filter(d => String(d) !== correctStr).slice(0, 3);
  }

  function createBitmasterQuestion() {
    const stage = BITMASTER_STAGES.find(s => s.id === bitmasterState.activeStage);
    const level = stage.levels.find(l => l.id === bitmasterState.activeLevel);
    const mode = level.mode;
    let effectiveMode = mode;
    if (mode === 'sprint_60s') {
      if (stage.id === 1) {
        effectiveMode = Math.random() > 0.5 ? 'mc_nibble_den2bin' : 'mc_nibble_bin2den';
      } else if (stage.id === 2) {
        effectiveMode = Math.random() > 0.5 ? 'mc_byte_den2bin' : 'mc_byte_bin2den';
      } else if (stage.id === 3) {
        const r = Math.random();
        effectiveMode = r < 0.4 ? 'mc_hex_nibble_to_den' : (r < 0.75 ? 'mc_hex_den_to_nibble' : 'mc_hex_byte');
      } else if (stage.id === 4) {
        effectiveMode = Math.random() > 0.5 ? 'math_add_simple' : 'math_add_carries';
      } else if (stage.id === 5) {
        const r = Math.random();
        effectiveMode = r < 0.4 ? 'mc_twos_comp_sign' : (r < 0.7 ? 'mc_twos_comp_convert' : 'mc_twos_comp_eval');
      } else if (stage.id === 6) {
        effectiveMode = Math.random() > 0.5 ? 'mc_shift_left' : 'mc_shift_right';
      } else if (stage.id === 7) {
        const r = Math.random();
        effectiveMode = r < 0.33 ? 'blitz_conversions' : (r < 0.66 ? 'blitz_maths' : 'blitz_signed_hex');
      }
    }

    const fmtBin = (val, len) => val.toString(2).padStart(len, '0').split('').join(' ');

    // STAGE 1: THE 4-BIT NIBBLE
    if (effectiveMode === 'mc_nibble_den2bin') {
      const val = Math.floor(Math.random() * 16);
      const binStr = val.toString(2).padStart(4, '0');
      const dists = generateDistractors(binStr, 0, 15, 'binary');
      const options = shuffleArray([binStr, ...dists]);
      return {
        type: 'mc',
        prompt: `Convert Denary ${val} to 4-Bit Binary:`,
        display: String(val),
        hint: "Nibble place values: 8 • 4 • 2 • 1",
        correctAnswer: binStr,
        options: options.map(String)
      };
    }

    if (effectiveMode === 'mc_nibble_bin2den') {
      const val = Math.floor(Math.random() * 16);
      const binStr = fmtBin(val, 4);
      const dists = generateDistractors(val, 0, 15, 'denary');
      const options = shuffleArray([val, ...dists]);
      return {
        type: 'mc',
        prompt: "Convert 4-Bit Binary to Denary:",
        display: binStr,
        hint: "Place values: 8 • 4 • 2 • 1",
        correctAnswer: String(val),
        options: options.map(String)
      };
    }

    if (effectiveMode === 'switches_nibble' || effectiveMode === 'blind_nibble') {
      const val = Math.floor(Math.random() * 15) + 1;
      return {
        type: 'switches',
        bitsCount: 4,
        blind: effectiveMode === 'blind_nibble',
        prompt: `Assemble Denary ${val} with 4-Bit Switches:`,
        display: String(val),
        hint: effectiveMode === 'blind_nibble' ? "Blind Mode: Place values HIDDEN (8, 4, 2, 1)!" : "Toggle bits (8, 4, 2, 1) to match total",
        correctAnswer: val
      };
    }

    // STAGE 2: THE 8-BIT BYTE
    if (effectiveMode === 'mc_byte_den2bin') {
      const val = Math.floor(Math.random() * 256);
      const binStr = val.toString(2).padStart(8, '0');
      const dists = generateDistractors(binStr, 0, 255, 'binary');
      const options = shuffleArray([binStr, ...dists]);
      return {
        type: 'mc',
        prompt: `Convert Denary ${val} to 8-Bit Binary:`,
        display: String(val),
        hint: "Place values: 128 • 64 • 32 • 16 • 8 • 4 • 2 • 1",
        correctAnswer: binStr,
        options: options.map(String)
      };
    }

    if (effectiveMode === 'mc_byte_bin2den') {
      const val = Math.floor(Math.random() * 256);
      const binStr = fmtBin(val, 8);
      const dists = generateDistractors(val, 0, 255, 'denary');
      const options = shuffleArray([val, ...dists]);
      return {
        type: 'mc',
        prompt: "Convert 8-Bit Byte to Denary:",
        display: binStr,
        hint: "Place values: 128 • 64 • 32 • 16 • 8 • 4 • 2 • 1",
        correctAnswer: String(val),
        options: options.map(String)
      };
    }

    if (effectiveMode === 'switches_byte' || effectiveMode === 'blind_byte') {
      const val = Math.floor(Math.random() * 254) + 1;
      return {
        type: 'switches',
        bitsCount: 8,
        blind: effectiveMode === 'blind_byte',
        prompt: `Assemble Denary ${val} with 8-Bit Switches:`,
        display: String(val),
        hint: effectiveMode === 'blind_byte' ? "Blind Mode: Place values hidden!" : "Toggle bits to match the target value",
        correctAnswer: val
      };
    }

    // STAGE 3: HEXADECIMAL SCRIBE
    if (effectiveMode === 'mc_hex_nibble_to_den') {
      const val = Math.floor(Math.random() * 16);
      const hex = val.toString(16).toUpperCase();
      const dists = generateDistractors(val, 0, 15, 'denary');
      const options = shuffleArray([val, ...dists]);
      return {
        type: 'mc',
        prompt: `What is Hexadecimal 0x${hex} in Denary?`,
        display: `0x${hex}`,
        hint: "Remember: A=10, B=11, C=12, D=13, E=14, F=15",
        correctAnswer: String(val),
        options: options.map(String)
      };
    }

    if (effectiveMode === 'mc_hex_den_to_nibble') {
      const val = Math.floor(Math.random() * 16);
      const hex = `0x${val.toString(16).toUpperCase()}`;
      const dists = generateDistractors(val.toString(16).toUpperCase(), 0, 15, 'hex').map(h => `0x${h}`);
      const options = shuffleArray([hex, ...dists]);
      return {
        type: 'mc',
        prompt: `Convert Denary ${val} to Hexadecimal:`,
        display: String(val),
        hint: "Base 16: 0–9 then A, B, C, D, E, F",
        correctAnswer: hex,
        options: options.map(String)
      };
    }

    if (effectiveMode === 'mc_hex_byte') {
      const val = Math.floor(Math.random() * 256);
      const hex = val.toString(16).toUpperCase().padStart(2, '0');
      const dists = generateDistractors(val, 0, 255, 'denary');
      const options = shuffleArray([val, ...dists]);
      return {
        type: 'mc',
        prompt: `Convert Hex 0x${hex} to Denary:`,
        display: `0x${hex}`,
        hint: `Left nibble × 16 + Right nibble`,
        correctAnswer: String(val),
        options: options.map(String)
      };
    }

    if (effectiveMode === 'keypad_hex') {
      const val = Math.floor(Math.random() * 256);
      const hex = val.toString(16).toUpperCase().padStart(2, '0');
      return {
        type: 'keypad',
        prompt: `Convert Denary ${val} to 2-Digit Hex:`,
        display: String(val),
        hint: "Enter 2 Hex digits using the keypad",
        correctAnswer: hex
      };
    }

    // STAGE 4: BINARY ADDITION (Pixel-perfect lined up columns & bit flips)
    if (effectiveMode === 'math_add_simple' || effectiveMode === 'mc_add_simple') {
      const a = Math.floor(Math.random() * 8); // 0..7
      const b = Math.floor(Math.random() * 8); // 0..7
      const sum = a + b;
      const bitsA = a.toString(2).padStart(4, '0').split('').map(Number);
      const bitsB = b.toString(2).padStart(4, '0').split('').map(Number);
      const sumStr = sum.toString(2).padStart(4, '0');
      return {
        type: 'math_grid',
        numBits: 4,
        placeValues: [8, 4, 2, 1],
        operator: '+',
        valA: a,
        valB: b,
        bitsA: bitsA,
        bitsB: bitsB,
        correctAnswer: sumStr,
        prompt: `Add 4-Bit Binary Columns (${a} + ${b}):`,
        display: `${a} + ${b} = ${sum}`,
        hint: `Place values: 8 • 4 • 2 • 1. Flip cells in Result row to 1 or 0, then submit!`
      };
    }

    if (effectiveMode === 'math_add_carries' || effectiveMode === 'math_add_8bit' || effectiveMode === 'mc_add_carries' || effectiveMode === 'mc_add_8bit' || effectiveMode === 'mc_add_overflow') {
      let a = Math.floor(Math.random() * 60) + 10;
      let b = Math.floor(Math.random() * 60) + 10;
      if (effectiveMode === 'math_add_8bit' || effectiveMode === 'mc_add_8bit') {
        a = Math.floor(Math.random() * 110) + 15;
        b = Math.floor(Math.random() * 110) + 15;
      }
      const sum = a + b;
      const bitsA = a.toString(2).padStart(8, '0').split('').map(Number);
      const bitsB = b.toString(2).padStart(8, '0').split('').map(Number);
      const sumStr = (sum & 255).toString(2).padStart(8, '0');
      return {
        type: 'math_grid',
        numBits: 8,
        placeValues: [128, 64, 32, 16, 8, 4, 2, 1],
        operator: '+',
        valA: a,
        valB: b,
        bitsA: bitsA,
        bitsB: bitsB,
        correctAnswer: sumStr,
        prompt: `Add 8-Bit Binary Columns (${a} + ${b}):`,
        display: `${a} + ${b} = ${sum}`,
        hint: `Align columns (128..1). Remember: 1+1=0 carry 1, 1+1+1=1 carry 1`
      };
    }

    // STAGE 5: TWO'S COMPLEMENT
    if (effectiveMode === 'mc_twos_comp_sign') {
      const isNeg = Math.random() > 0.5;
      const val = isNeg ? -(Math.floor(Math.random() * 127) + 1) : (Math.floor(Math.random() * 127) + 1);
      const binStr = (isNeg ? (256 + val) : val).toString(2).padStart(8, '0');
      const correctOpt = isNeg ? "Negative (< 0, MSB = 1)" : "Positive (≥ 0, MSB = 0)";
      const wrongOpt = isNeg ? "Positive (≥ 0, MSB = 0)" : "Negative (< 0, MSB = 1)";
      return {
        type: 'mc',
        prompt: "In Two's Complement, is this value Positive or Negative?",
        display: binStr,
        hint: "Inspect the Most Significant Bit (MSB, bit 7)",
        correctAnswer: correctOpt,
        options: shuffleArray([correctOpt, wrongOpt, "Overflow Error", "Invalid Pattern"])
      };
    }

    if (effectiveMode === 'mc_twos_comp_convert') {
      const posVal = Math.floor(Math.random() * 60) + 1;
      const negVal = -posVal;
      const twosComp = (256 + negVal).toString(2).padStart(8, '0');
      const dists = generateDistractors(twosComp, 0, 255, 'binary');
      const options = shuffleArray([twosComp, ...dists]);
      return {
        type: 'mc',
        prompt: `Convert Denary ${negVal} to Two's Complement:`,
        display: String(negVal),
        hint: `Tip: Write +${posVal}, flip bits, and add 1`,
        correctAnswer: twosComp,
        options: options.map(String)
      };
    }

    if (effectiveMode === 'mc_twos_comp_eval') {
      const negVal = -(Math.floor(Math.random() * 120) + 1);
      const twosComp = (256 + negVal).toString(2).padStart(8, '0');
      const dists = generateDistractors(negVal, -128, -1, 'denary');
      const options = shuffleArray([negVal, ...dists]);
      return {
        type: 'mc',
        prompt: "Interpret Two's Complement (MSB is -128):",
        display: twosComp,
        hint: "MSB is -128 + sum of remaining positive bits",
        correctAnswer: String(negVal),
        options: options.map(String)
      };
    }

    if (effectiveMode === 'switches_twos_comp') {
      const negVal = -(Math.floor(Math.random() * 120) + 1);
      return {
        type: 'switches',
        bitsCount: 8,
        isTwosComp: true,
        prompt: `Construct ${negVal} in Two's Complement:`,
        display: String(negVal),
        hint: "MSB switch is worth -128! Add positive bits to reach target",
        correctAnswer: negVal
      };
    }

    // STAGE 6: LOGICAL SHIFTS
    if (effectiveMode === 'mc_shift_left' || effectiveMode === 'mc_shift_right' || effectiveMode === 'mc_shift_multistep' || effectiveMode === 'mc_shift_bitloss') {
      const isLeft = effectiveMode === 'mc_shift_left' ? true : (effectiveMode === 'mc_shift_right' ? false : (effectiveMode === 'mc_shift_bitloss' ? true : Math.random() > 0.5));
      const shiftAmount = effectiveMode === 'mc_shift_multistep' ? 3 : (Math.floor(Math.random() * 2) + 1);
      const initialVal = isLeft ? Math.floor(Math.random() * 25) + 3 : (Math.floor(Math.random() * 100) + 10);
      const initialBin = initialVal.toString(2).padStart(8, '0');
      const resultVal = isLeft ? (initialVal << shiftAmount) & 255 : (initialVal >> shiftAmount);
      const resultBin = resultVal.toString(2).padStart(8, '0');

      if (effectiveMode === 'mc_shift_bitloss') {
        const testVal = Math.floor(Math.random() * 60) + 130; // MSB is 1
        const testBin = testVal.toString(2).padStart(8, '0');
        const correctOpt = "Bit Loss / Overflow (MSB discarded)";
        const wrongOpts = ["Value Doubles Accurately", "MSB wraps to LSB", "Number becomes negative"];
        return {
          type: 'mc',
          prompt: "What happens when this number is shifted LEFT by 1?",
          display: testBin,
          hint: "Most Significant Bit (1) gets pushed out of the 8-bit register",
          correctAnswer: correctOpt,
          options: shuffleArray([correctOpt, ...wrongOpts])
        };
      }

      const dists = generateDistractors(resultBin, 0, 255, 'binary');
      const options = shuffleArray([resultBin, ...dists]);
      return {
        type: 'mc',
        prompt: `Perform a Logical ${isLeft ? 'LEFT' : 'RIGHT'} Shift by ${shiftAmount} bit${shiftAmount > 1 ? 's' : ''}:`,
        display: initialBin,
        hint: isLeft ? `Multiply by ${Math.pow(2, shiftAmount)} (insert 0s at right)` : `Integer divide by ${Math.pow(2, shiftAmount)} (drop fractional bits)`,
        correctAnswer: resultBin,
        options: options.map(String)
      };
    }

    // STAGE 7: THE MASTER GAUNTLET
    if (effectiveMode === 'blitz_conversions' || effectiveMode === 'blitz_maths' || effectiveMode === 'blitz_signed_hex' || effectiveMode === 'blitz_grandmaster') {
      const rnd = Math.random();
      if (rnd < 0.33) {
        const val = Math.floor(Math.random() * 256);
        const binStr = fmtBin(val, 8);
        const dists = generateDistractors(val, 0, 255, 'denary');
        return {
          type: 'mc',
          prompt: "Gauntlet Blitz: Convert Binary to Denary:",
          display: binStr,
          hint: "Sum active place values",
          correctAnswer: String(val),
          options: shuffleArray([val, ...dists]).map(String)
        };
      } else if (rnd < 0.66) {
        const val = Math.floor(Math.random() * 256);
        const hex = val.toString(16).toUpperCase().padStart(2, '0');
        const dists = generateDistractors(val, 0, 255, 'denary');
        return {
          type: 'mc',
          prompt: `Gauntlet Blitz: Convert Hex 0x${hex} to Denary:`,
          display: `0x${hex}`,
          hint: "Left nibble × 16 + Right nibble",
          correctAnswer: String(val),
          options: shuffleArray([val, ...dists]).map(String)
        };
      } else {
        const a = Math.floor(Math.random() * 60) + 10;
        const b = Math.floor(Math.random() * 60) + 10;
        const sum = a + b;
        const bitsA = a.toString(2).padStart(8, '0').split('').map(Number);
        const bitsB = b.toString(2).padStart(8, '0').split('').map(Number);
        const binSum = (sum & 255).toString(2).padStart(8, '0');
        return {
          type: 'math_grid',
          numBits: 8,
          placeValues: [128, 64, 32, 16, 8, 4, 2, 1],
          operator: '+',
          valA: a,
          valB: b,
          bitsA: bitsA,
          bitsB: bitsB,
          correctAnswer: binSum,
          prompt: `Gauntlet Blitz: Calculate Binary Sum (${a} + ${b}):`,
          display: `${a} + ${b} = ${sum}`,
          hint: "Align columns and flip the result bits"
        };
      }
    }

    // Fallback
    return {
      type: 'mc',
      prompt: "Convert Binary to Denary:",
      display: "0 1 0 1 1 0 1 0",
      hint: "Place values 64 + 16 + 8 + 2",
      correctAnswer: "90",
      options: shuffleArray(["90", "88", "92", "74"])
    };
  }

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // =========================================================================
  // ROUND MANAGEMENT & GAMEPLAY
  // =========================================================================

  function startBitmasterRound() {
    const stage = BITMASTER_STAGES.find(s => s.id === bitmasterState.activeStage);
    const level = stage.levels.find(l => l.id === bitmasterState.activeLevel);
    const isSprint = (level.mode === 'sprint_60s');

    bitmasterState.isSprint = isSprint;
    bitmasterState.currentQuestionIndex = 0;
    bitmasterState.mistakesThisRound = 0;
    bitmasterState.correctThisRound = 0;
    bitmasterState.startTime = Date.now();
    bitmasterState.elapsedSeconds = 0;
    bitmasterState.sprintTimeLeft = 60;
    bitmasterState.totalQuestions = isSprint ? 999 : 10;
    bitmasterState.keypadBuffer = "";

    const timerEl = document.getElementById('bitmasterTimerDisplay');
    const counterEl = document.getElementById('bitmasterQuestionCounter');
    const barEl = document.getElementById('bitmasterProgressBar');

    if (timerEl) {
      timerEl.classList.toggle('sprint-mode', isSprint);
      timerEl.classList.remove('sprint-low');
      timerEl.textContent = isSprint ? '⏱️ 0:60' : '⏱️ 0:00';
    }

    if (counterEl) {
      counterEl.classList.toggle('sprint-counter', isSprint);
      counterEl.textContent = isSprint ? '⚡ Solved: 0' : 'Q 1/10';
    }

    if (barEl) {
      barEl.style.width = isSprint ? '0%' : '10%';
    }

    if (bitmasterState.timerInterval) clearInterval(bitmasterState.timerInterval);
    bitmasterState.timerInterval = setInterval(() => {
      if (bitmasterState.isSprint) {
        bitmasterState.sprintTimeLeft--;
        const secs = Math.max(0, bitmasterState.sprintTimeLeft);
        if (timerEl) {
          timerEl.textContent = `⏱️ 0:${secs.toString().padStart(2, '0')}`;
          if (secs <= 10) timerEl.classList.add('sprint-low');
        }
        if (barEl) {
          barEl.style.width = `${Math.min(100, Math.round(((60 - secs) / 60) * 100))}%`;
        }
        if (bitmasterState.sprintTimeLeft <= 0) {
          clearInterval(bitmasterState.timerInterval);
          bitmasterState.timerInterval = null;
          finishBitmasterRound();
          return;
        }
      } else {
        bitmasterState.elapsedSeconds = Math.floor((Date.now() - bitmasterState.startTime) / 1000);
        const mins = Math.floor(bitmasterState.elapsedSeconds / 60);
        const secs = (bitmasterState.elapsedSeconds % 60).toString().padStart(2, '0');
        if (timerEl) timerEl.textContent = `⏱️ ${mins}:${secs}`;
      }
    }, 1000);

    const badgeEl = document.getElementById('bitmasterActiveStageBadge');
    if (badgeEl) {
      badgeEl.textContent = isSprint 
        ? `Stage ${bitmasterState.activeStage} • ⚡ 60s Speed Sprint`
        : `Stage ${bitmasterState.activeStage} • Lvl ${bitmasterState.activeLevel}`;
    }

    showBitmasterScreen('game');
    loadNextBitmasterQuestion();
  }

  function loadNextBitmasterQuestion() {
    if (!bitmasterState.isSprint && bitmasterState.currentQuestionIndex >= bitmasterState.totalQuestions) {
      finishBitmasterRound();
      return;
    }

    bitmasterState.currentQuestionIndex++;
    bitmasterState.currentQuestion = createBitmasterQuestion();
    bitmasterState.switchBits = [0, 0, 0, 0, 0, 0, 0, 0];
    bitmasterState.keypadBuffer = "";

    const counterEl = document.getElementById('bitmasterQuestionCounter');
    const barEl = document.getElementById('bitmasterProgressBar');
    if (counterEl) {
      if (bitmasterState.isSprint) {
        counterEl.textContent = `⚡ Solved: ${bitmasterState.correctThisRound}`;
      } else {
        counterEl.textContent = `Q ${bitmasterState.currentQuestionIndex}/${bitmasterState.totalQuestions}`;
      }
    }
    if (barEl && !bitmasterState.isSprint) {
      barEl.style.width = `${(bitmasterState.currentQuestionIndex / bitmasterState.totalQuestions) * 100}%`;
    }

    const promptEl = document.getElementById('bitmasterPromptLabel');
    const mainDispEl = document.getElementById('bitmasterMainDisplay');
    const hintEl = document.getElementById('bitmasterHintSubtext');

    if (promptEl) promptEl.textContent = bitmasterState.currentQuestion.prompt;
    if (mainDispEl) {
      mainDispEl.style.whiteSpace = 'pre-wrap';
      mainDispEl.textContent = bitmasterState.currentQuestion.display;
    }
    if (hintEl) hintEl.textContent = bitmasterState.currentQuestion.hint || '';

    const tilesZone = document.getElementById('bitmasterTilesZone');
    const switchZone = document.getElementById('bitmasterSwitchboardZone');
    const keypadZone = document.getElementById('bitmasterKeypadZone');
    const mathZone = document.getElementById('bitmasterMathGridZone');

    if (bitmasterState.currentQuestion.type === 'mc') {
      if (tilesZone) tilesZone.style.display = 'grid';
      if (switchZone) switchZone.style.display = 'none';
      if (keypadZone) keypadZone.style.display = 'none';
      if (mathZone) mathZone.style.display = 'none';
      renderBitmasterMCTiles(bitmasterState.currentQuestion.options);
    } else if (bitmasterState.currentQuestion.type === 'switches') {
      if (tilesZone) tilesZone.style.display = 'none';
      if (switchZone) {
        switchZone.style.display = 'flex';
        renderBitmasterSwitchboard(bitmasterState.currentQuestion.bitsCount, bitmasterState.currentQuestion.blind, bitmasterState.currentQuestion.isTwosComp);
      }
      if (keypadZone) keypadZone.style.display = 'none';
      if (mathZone) mathZone.style.display = 'none';
    } else if (bitmasterState.currentQuestion.type === 'keypad') {
      if (tilesZone) tilesZone.style.display = 'none';
      if (switchZone) switchZone.style.display = 'none';
      if (keypadZone) {
        keypadZone.style.display = 'flex';
        renderBitmasterKeypad();
      }
      if (mathZone) mathZone.style.display = 'none';
    } else if (bitmasterState.currentQuestion.type === 'math_grid') {
      if (tilesZone) tilesZone.style.display = 'none';
      if (switchZone) switchZone.style.display = 'none';
      if (keypadZone) keypadZone.style.display = 'none';
      if (mathZone) {
        mathZone.style.display = 'flex';
        renderBitmasterMathGrid(bitmasterState.currentQuestion);
      }
    }
  }

  function renderBitmasterMCTiles(options) {
    const tilesZone = document.getElementById('bitmasterTilesZone');
    if (!tilesZone) return;
    tilesZone.innerHTML = '';

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'bitmaster-tile-btn';
      btn.textContent = opt;

      btn.addEventListener('click', () => {
        playSynthSound('tap');
        handleBitmasterMCAnswer(opt, btn);
      });

      tilesZone.appendChild(btn);
    });
  }

  function handleBitmasterMCAnswer(chosenVal, clickedBtn) {
    const isCorrect = String(chosenVal).trim() === String(bitmasterState.currentQuestion.correctAnswer).trim();
    const allButtons = document.querySelectorAll('.bitmaster-tile-btn');
    allButtons.forEach(b => b.style.pointerEvents = 'none');

    if (isCorrect) {
      clickedBtn.classList.add('correct');
      playSynthSound('correct');
      bitmasterState.correctThisRound++;
      bitmasterState.xp += 15;
      updateBitmasterHUD();
      if (bitmasterState.isSprint) {
        const counterEl = document.getElementById('bitmasterQuestionCounter');
        if (counterEl) counterEl.textContent = `⚡ Solved: ${bitmasterState.correctThisRound}`;
        setTimeout(() => {
          loadNextBitmasterQuestion();
        }, 180);
      } else {
        setTimeout(() => {
          loadNextBitmasterQuestion();
        }, 500);
      }
    } else {
      clickedBtn.classList.add('wrong');
      playSynthSound('wrong');
      bitmasterState.mistakesThisRound++;

      allButtons.forEach(b => {
        if (b.textContent.trim() === String(bitmasterState.currentQuestion.correctAnswer).trim()) {
          b.classList.add('correct');
        }
      });

      if (bitmasterState.isSprint) {
        setTimeout(() => {
          loadNextBitmasterQuestion();
        }, 350);
      } else {
        setTimeout(() => {
          loadNextBitmasterQuestion();
        }, 1200);
      }
    }
  }

  function showBitmasterToast(message, icon = '❌', durationMs = 1800, callback = null) {
    const toast = document.getElementById('bitmasterInlineFeedback');
    const iconEl = document.getElementById('bitmasterFeedbackIcon');
    const textEl = document.getElementById('bitmasterFeedbackText');
    if (!toast) {
      if (callback) callback();
      return;
    }
    if (iconEl) iconEl.textContent = icon;
    if (textEl) textEl.textContent = message;
    toast.style.display = 'flex';
    setTimeout(() => {
      toast.style.display = 'none';
      if (callback) callback();
    }, durationMs);
  }

  function showBitmasterAbandonModal() {
    const modal = document.getElementById('bitmasterModalAbandon');
    if (modal) modal.style.display = 'flex';
  }

  function hideBitmasterAbandonModal() {
    const modal = document.getElementById('bitmasterModalAbandon');
    if (modal) modal.style.display = 'none';
  }

  function renderBitmasterSwitchboard(bitsCount = 8, isBlind = false, isTwosComp = false) {
    const container = document.getElementById('bitmasterSwitchBitsContainer');
    if (!container) return;
    container.innerHTML = '';

    const weights = bitsCount === 4 ? [8, 4, 2, 1] : [128, 64, 32, 16, 8, 4, 2, 1];
    if (isTwosComp && bitsCount === 8) {
      weights[0] = -128;
    }

    weights.forEach((w, idx) => {
      const bitBtn = document.createElement('div');
      bitBtn.className = 'bitmaster-switch-cell';
      bitBtn.innerHTML = `
        <span class="switch-cell-pv">${isBlind ? '?' : (w > 0 ? w : '-128')}</span>
        <span class="switch-cell-val">0</span>
      `;

      bitBtn.addEventListener('click', () => {
        const currentBit = bitmasterState.switchBits[idx];
        const newBit = currentBit === 1 ? 0 : 1;
        bitmasterState.switchBits[idx] = newBit;

        if (newBit === 1) {
          bitBtn.classList.add('active');
          bitBtn.querySelector('.switch-cell-val').textContent = '1';
        } else {
          bitBtn.classList.remove('active');
          bitBtn.querySelector('.switch-cell-val').textContent = '0';
        }

        playSynthSound('switch');
        updateBitmasterSwitchSum(weights, isBlind);
      });

      container.appendChild(bitBtn);
    });

    updateBitmasterSwitchSum(weights, isBlind);

    const submitBtn = document.getElementById('bitmasterSubmitSwitchBtn');
    if (submitBtn) {
      submitBtn.onclick = () => {
        let currentTotal = 0;
        weights.forEach((w, idx) => {
          if (bitmasterState.switchBits[idx] === 1) currentTotal += w;
        });

        const isCorrect = currentTotal === bitmasterState.currentQuestion.correctAnswer;
        if (isCorrect) {
          playSynthSound('correct');
          bitmasterState.correctThisRound++;
          bitmasterState.xp += 20;
          updateBitmasterHUD();
          loadNextBitmasterQuestion();
        } else {
          playSynthSound('wrong');
          bitmasterState.mistakesThisRound++;
          showBitmasterToast(`Not quite! Target was ${bitmasterState.currentQuestion.correctAnswer}, but your switches made ${currentTotal}.`, '❌', 1900, () => {
            loadNextBitmasterQuestion();
          });
        }
      };
    }
  }

  function updateBitmasterSwitchSum(weights, isBlind) {
    let sum = 0;
    weights.forEach((w, idx) => {
      if (bitmasterState.switchBits[idx] === 1) sum += w;
    });
    const sumEl = document.getElementById('bitmasterCurrentSwitchSum');
    if (sumEl) {
      sumEl.textContent = isBlind ? '???' : sum;
    }
  }

  function renderBitmasterKeypad() {
    const dispEl = document.getElementById('bitmasterKeypadDisplay');
    const gridEl = document.getElementById('bitmasterKeypadGrid');
    if (dispEl) dispEl.textContent = bitmasterState.keypadBuffer || '_';
    if (!gridEl) return;

    gridEl.innerHTML = '';
    const keys = ['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '0', 'D', 'E', 'F', 'DEL', 'OK'];

    keys.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'control-btn keypad-btn';
      if (k === 'OK') btn.className += ' control-btn-primary';
      btn.textContent = k;

      btn.addEventListener('click', () => {
        playSynthSound('tap');
        if (k === 'DEL') {
          bitmasterState.keypadBuffer = bitmasterState.keypadBuffer.slice(0, -1);
        } else if (k === 'OK') {
          handleBitmasterKeypadSubmit();
          return;
        } else {
          if (bitmasterState.keypadBuffer.length < 4) {
            bitmasterState.keypadBuffer += k;
          }
        }
        if (dispEl) dispEl.textContent = bitmasterState.keypadBuffer || '_';
      });

      gridEl.appendChild(btn);
    });
  }

  function handleBitmasterKeypadSubmit() {
    const isCorrect = bitmasterState.keypadBuffer.toUpperCase() === String(bitmasterState.currentQuestion.correctAnswer).toUpperCase();
    if (isCorrect) {
      playSynthSound('correct');
      bitmasterState.correctThisRound++;
      bitmasterState.xp += 20;
      updateBitmasterHUD();
      if (bitmasterState.isSprint) {
        const counterEl = document.getElementById('bitmasterQuestionCounter');
        if (counterEl) counterEl.textContent = `⚡ Solved: ${bitmasterState.correctThisRound}`;
        setTimeout(() => loadNextBitmasterQuestion(), 200);
      } else {
        loadNextBitmasterQuestion();
      }
    } else {
      playSynthSound('wrong');
      bitmasterState.mistakesThisRound++;
      if (bitmasterState.isSprint) {
        showBitmasterToast(`Not quite! Expected ${bitmasterState.currentQuestion.correctAnswer}`, '❌', 850, () => {
          loadNextBitmasterQuestion();
        });
      } else {
        showBitmasterToast(`Not quite! The correct answer was ${bitmasterState.currentQuestion.correctAnswer}.`, '❌', 1900, () => {
          loadNextBitmasterQuestion();
        });
      }
    }
  }

  // =========================================================================
  // INTERACTION ZONE D: PIXEL-PERFECT LINED-UP CALCULATION & BIT FLIP
  // =========================================================================

  function renderBitmasterMathGrid(question) {
    const placeRow = document.getElementById('bitmasterMathPlaceRow');
    const rowA = document.getElementById('bitmasterMathRowA');
    const rowB = document.getElementById('bitmasterMathRowB');
    const resultRow = document.getElementById('bitmasterMathResultRow');
    const hintLabel = document.getElementById('bitmasterMathGridHint');
    const submitBtn = document.getElementById('bitmasterSubmitMathBtn');

    if (!placeRow || !rowA || !rowB || !resultRow) return;

    const numBits = question.numBits || 8;
    bitmasterState.mathResultBits = new Array(numBits).fill(0);

    const rows = [placeRow, rowA, rowB, resultRow];
    rows.forEach(r => r.style.setProperty('--math-cols', numBits));

    // 1. Header Place Values Row
    placeRow.innerHTML = `<span class="math-row-op"></span>` + 
      question.placeValues.map(pv => `<span class="math-pv-cell">${pv}</span>`).join('');

    // 2. Operand Row A
    rowA.innerHTML = `<span class="math-row-op"></span>` + 
      question.bitsA.map(b => `<span class="math-bit-cell ${b === 1 ? 'bit-is-1' : ''}">${b}</span>`).join('');

    // 3. Operand Row B with Operator
    rowB.innerHTML = `<span class="math-row-op op-symbol">${question.operator || '+'}</span>` + 
      question.bitsB.map(b => `<span class="math-bit-cell ${b === 1 ? 'bit-is-1' : ''}">${b}</span>`).join('');

    // 4. Result Interactive Flip Row
    resultRow.innerHTML = `<span class="math-row-op">=</span>`;
    for (let i = 0; i < numBits; i++) {
      const flipBtn = document.createElement('button');
      flipBtn.type = 'button';
      flipBtn.className = 'math-flip-cell';
      flipBtn.textContent = '0';
      flipBtn.setAttribute('data-idx', i);
      flipBtn.setAttribute('aria-label', `Result bit for column ${question.placeValues[i]}`);

      flipBtn.addEventListener('click', () => {
        const cur = bitmasterState.mathResultBits[i];
        const next = cur === 1 ? 0 : 1;
        bitmasterState.mathResultBits[i] = next;
        flipBtn.textContent = String(next);
        flipBtn.classList.toggle('active-1', next === 1);
        playSynthSound('switch');
      });

      resultRow.appendChild(flipBtn);
    }

    if (hintLabel) {
      hintLabel.textContent = question.hint || "Click cells in the Result row to flip bits (0 ↔ 1), then submit";
    }

    if (submitBtn) {
      submitBtn.onclick = () => {
        handleBitmasterMathSubmit();
      };
    }
  }

  function handleBitmasterMathSubmit() {
    const userAns = bitmasterState.mathResultBits.join('');
    const isCorrect = userAns === bitmasterState.currentQuestion.correctAnswer;

    if (isCorrect) {
      playSynthSound('correct');
      bitmasterState.correctThisRound++;
      bitmasterState.xp += 20;
      updateBitmasterHUD();
      if (bitmasterState.isSprint) {
        const counterEl = document.getElementById('bitmasterQuestionCounter');
        if (counterEl) counterEl.textContent = `⚡ Solved: ${bitmasterState.correctThisRound}`;
        setTimeout(() => loadNextBitmasterQuestion(), 200);
      } else {
        setTimeout(() => loadNextBitmasterQuestion(), 400);
      }
    } else {
      playSynthSound('wrong');
      bitmasterState.mistakesThisRound++;
      if (bitmasterState.isSprint) {
        showBitmasterToast(`Incorrect! Expected: ${bitmasterState.currentQuestion.correctAnswer}`, '❌', 850, () => {
          loadNextBitmasterQuestion();
        });
      } else {
        showBitmasterToast(`Not quite! The correct binary sum is ${bitmasterState.currentQuestion.correctAnswer}.`, '❌', 2000, () => {
          loadNextBitmasterQuestion();
        });
      }
    }
  }

  // =========================================================================
  // VICTORY & SCORING SCREEN
  // =========================================================================

  function fireConfetti() {
    try {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.inset = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const width = canvas.width = window.innerWidth;
      const height = canvas.height = window.innerHeight;

      const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];
      const particles = Array.from({ length: 65 }, () => ({
        x: width / 2,
        y: height / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 18,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10
      }));

      const startTime = performance.now();
      function animate(time) {
        const elapsed = time - startTime;
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.4;
          p.rotation += p.vRot;
          p.alpha = Math.max(0, 1 - elapsed / 2200);

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
          ctx.restore();
        });

        if (elapsed < 2200) {
          requestAnimationFrame(animate);
        } else {
          canvas.remove();
        }
      }
      requestAnimationFrame(animate);
    } catch (e) {
      console.warn("Confetti animation error:", e);
    }
  }

  function finishBitmasterRound() {
    if (bitmasterState.timerInterval) {
      clearInterval(bitmasterState.timerInterval);
      bitmasterState.timerInterval = null;
    }

    let starsEarned = 0;
    let xpBonus = 0;

    if (bitmasterState.isSprint) {
      // 60s Sprint Criteria:
      // >= 12 correct: 3 stars
      // >= 8 correct: 2 stars
      // >= 4 correct: 1 star
      // < 4: 0 stars
      if (bitmasterState.correctThisRound >= 12) {
        starsEarned = 3;
      } else if (bitmasterState.correctThisRound >= 8) {
        starsEarned = 2;
      } else if (bitmasterState.correctThisRound >= 4) {
        starsEarned = 1;
      } else {
        starsEarned = 0;
      }
      xpBonus = (bitmasterState.correctThisRound * 10) + (starsEarned === 3 ? 120 : (starsEarned === 2 ? 60 : (starsEarned === 1 ? 30 : 10)));
    } else {
      // Standard 10-Question Criteria:
      // 3 Stars = 10/10 correct with 0 mistakes in <= 50s
      // 2 Stars = >= 8/10 correct (<= 2 mistakes)
      // 1 Star = >= 5/10 correct
      if (bitmasterState.correctThisRound === 10 && bitmasterState.mistakesThisRound === 0 && bitmasterState.elapsedSeconds <= 50) {
        starsEarned = 3;
      } else if (bitmasterState.correctThisRound >= 8 && bitmasterState.mistakesThisRound <= 2) {
        starsEarned = 2;
      } else if (bitmasterState.correctThisRound >= 5) {
        starsEarned = 1;
      } else {
        starsEarned = 0;
      }
      xpBonus = starsEarned === 3 ? 120 : (starsEarned === 2 ? 60 : (starsEarned === 1 ? 30 : 10));
    }

    const saveKey = `s${bitmasterState.activeStage}_l${bitmasterState.activeLevel}`;
    const prevStars = bitmasterState.stars[saveKey] || 0;
    if (starsEarned > prevStars) {
      bitmasterState.stars[saveKey] = starsEarned;
    }

    bitmasterState.xp += xpBonus;
    saveBitmasterProgress();
    updateBitmasterHUD();

    const titleEl = document.getElementById('bitmasterVictoryTitle');
    const badgeEl = document.getElementById('bitmasterVictoryBadge');
    const starsEl = document.getElementById('bitmasterVictoryStars');
    const subtextEl = document.getElementById('bitmasterVictorySubtext');
    const xpEl = document.getElementById('bitmasterVictoryXp');
    const accEl = document.getElementById('bitmasterVictoryAccuracy');
    const tipEl = document.getElementById('bitmasterVictoryTip');

    if (bitmasterState.isSprint) {
      const totalAttempted = bitmasterState.correctThisRound + bitmasterState.mistakesThisRound;
      const accuracy = totalAttempted > 0 ? Math.round((bitmasterState.correctThisRound / totalAttempted) * 100) : 0;
      if (starsEarned === 3) {
        if (badgeEl) badgeEl.textContent = '👑';
        if (titleEl) titleEl.textContent = 'Sprint Champion!';
        if (starsEl) starsEl.textContent = '⭐⭐⭐';
        fireConfetti();
        playSynthSound('perfect10');
        if (tipEl) tipEl.innerHTML = `🏆 <strong>Legendary Pace!</strong> You solved ${bitmasterState.correctThisRound} problems in 60s! Maximum 3-Star Sprint rating achieved!`;
      } else if (starsEarned === 2) {
        if (badgeEl) badgeEl.textContent = '⚡';
        if (titleEl) titleEl.textContent = 'Speed Specialist!';
        if (starsEl) starsEl.textContent = '⭐⭐☆';
        playSynthSound('victory');
        if (tipEl) tipEl.innerHTML = `💡 <strong>To earn 3 Stars:</strong> Solve at least 12 correct in 60s (you solved ${bitmasterState.correctThisRound}). Keep your pace up!`;
      } else if (starsEarned === 1) {
        if (badgeEl) badgeEl.textContent = '💡';
        if (titleEl) titleEl.textContent = 'Sprint Completed';
        if (starsEl) starsEl.textContent = '⭐☆☆';
        playSynthSound('victory');
        if (tipEl) tipEl.innerHTML = `💡 <strong>To earn 2 Stars:</strong> Solve at least 8 correct in 60s (you solved ${bitmasterState.correctThisRound}).`;
      } else {
        if (badgeEl) badgeEl.textContent = '⏱️';
        if (titleEl) titleEl.textContent = 'Time Expired';
        if (starsEl) starsEl.textContent = '☆☆☆';
        playSynthSound('wrong');
        if (tipEl) tipEl.innerHTML = `💡 <strong>To pass this sprint:</strong> Solve at least 4 problems before the 60s timer expires. Try again!`;
      }
      if (subtextEl) subtextEl.textContent = `⚡ 60s Sprint Finished • ${bitmasterState.correctThisRound} Solved Correctly • ${bitmasterState.mistakesThisRound} mistakes`;
      if (xpEl) xpEl.textContent = `+${xpBonus} XP`;
      if (accEl) accEl.textContent = `${accuracy}%`;
    } else {
      const accuracy = Math.round((bitmasterState.correctThisRound / bitmasterState.totalQuestions) * 100);
      if (starsEarned === 3) {
        if (badgeEl) badgeEl.textContent = '👑';
        if (titleEl) titleEl.textContent = 'Grandmaster Precision!';
        if (starsEl) starsEl.textContent = '⭐⭐⭐';
        fireConfetti();
        playSynthSound('perfect10');
        if (tipEl) {
          tipEl.innerHTML = `🏆 <strong>Flawless 10/10 Mastery!</strong> Cleared in ${bitmasterState.elapsedSeconds}s with 0 mistakes. Maximum 3-Star Grandmaster achieved!`;
        }
      } else if (starsEarned === 2) {
        if (badgeEl) badgeEl.textContent = '⚡';
        if (titleEl) titleEl.textContent = 'Stage Mastered!';
        if (starsEl) starsEl.textContent = '⭐⭐☆';
        playSynthSound('victory');
        if (tipEl) {
          const timeDiff = bitmasterState.elapsedSeconds > 50 ? `${bitmasterState.elapsedSeconds - 50}s faster` : '';
          const mistakeMsg = bitmasterState.mistakesThisRound > 0 ? `eliminate ${bitmasterState.mistakesThisRound} mistake(s)` : '';
          const reqs = [mistakeMsg, timeDiff].filter(Boolean).join(' and ');
          tipEl.innerHTML = `💡 <strong>To earn 3 Stars:</strong> Score 10/10 in &lt; 50s with 0 mistakes. Try again to ${reqs || 'beat the 50s clock'}!`;
        }
      } else if (starsEarned === 1) {
        if (badgeEl) badgeEl.textContent = '💡';
        if (titleEl) titleEl.textContent = 'Trial Passed';
        if (starsEl) starsEl.textContent = '⭐☆☆';
        playSynthSound('victory');
        if (tipEl) {
          tipEl.innerHTML = `💡 <strong>To earn 2 Stars:</strong> Score at least 8/10 correct (&le; 2 mistakes). You scored ${bitmasterState.correctThisRound}/10!`;
        }
      } else {
        if (badgeEl) badgeEl.textContent = '🔄';
        if (titleEl) titleEl.textContent = 'Trial Incomplete';
        if (starsEl) starsEl.textContent = '☆☆☆';
        playSynthSound('wrong');
        if (tipEl) {
          tipEl.innerHTML = `💡 <strong>To pass this level:</strong> Score at least 5/10 correct. Review binary place values and retry!`;
        }
      }
      if (subtextEl) {
        subtextEl.textContent = `${bitmasterState.correctThisRound}/${bitmasterState.totalQuestions} Correct • ${bitmasterState.mistakesThisRound} mistakes • ${bitmasterState.elapsedSeconds}s`;
      }
      if (xpEl) xpEl.textContent = `+${xpBonus} XP`;
      if (accEl) accEl.textContent = `${accuracy}%`;
    }

    showBitmasterScreen('summary');

    const retryBtn = document.getElementById('bitmasterSummaryRetryBtn');
    const contBtn = document.getElementById('bitmasterSummaryContinueBtn');

    if (retryBtn) retryBtn.onclick = () => {
      playSynthSound('tap');
      startBitmasterRound();
    };
    if (contBtn) contBtn.onclick = () => {
      playSynthSound('tap');
      showBitmasterScreen('levels');
    };
  }

  // =========================================================================
  function setupBitMaster() {
    loadBitmasterSave();
    updateBitmasterHUD();

    // Setup native Fullscreen button & top-right HUD symbol toggle
    const fsBtn = document.getElementById('bitmasterFullscreenBtn');
    const hudFsToggleBtn = document.getElementById('bitmasterFullscreenToggleBtn');
    const fsEnterIcon = document.getElementById('bitmasterFsEnterIcon');
    const fsExitIcon = document.getElementById('bitmasterFsExitIcon');
    const arena = document.getElementById('bitmasterArena');
    const fsText = document.getElementById('bitmasterFullscreenText');

    function toggleFullscreen() {
      playSynthSound('tap');
      if (!document.fullscreenElement) {
        if (arena.requestFullscreen) {
          arena.requestFullscreen();
        } else if (arena.webkitRequestFullscreen) {
          arena.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }

    if (fsBtn && arena) {
      fsBtn.addEventListener('click', toggleFullscreen);
    }
    if (hudFsToggleBtn) {
      hudFsToggleBtn.addEventListener('click', toggleFullscreen);
    }

    document.addEventListener('fullscreenchange', () => {
      const isFs = !!document.fullscreenElement;
      if (fsText) fsText.textContent = isFs ? 'Exit Fullscreen' : 'Fullscreen Mode';
      if (fsEnterIcon) fsEnterIcon.style.display = isFs ? 'none' : 'block';
      if (fsExitIcon) fsExitIcon.style.display = isFs ? 'block' : 'none';
      if (hudFsToggleBtn) {
        hudFsToggleBtn.title = isFs ? 'Exit Fullscreen' : 'Toggle Fullscreen';
        hudFsToggleBtn.setAttribute('aria-label', isFs ? 'Exit Fullscreen' : 'Toggle Fullscreen');
      }
      arena.classList.toggle('is-fullscreen', isFs);
    });

    // In-Arena Modal Actions (Abandon Current Trial)
    const keepPlayingBtn = document.getElementById('bitmasterModalKeepPlayingBtn');
    const abandonConfirmBtn = document.getElementById('bitmasterModalAbandonConfirmBtn');

    if (keepPlayingBtn) {
      keepPlayingBtn.addEventListener('click', () => {
        playSynthSound('tap');
        hideBitmasterAbandonModal();
      });
    }

    if (abandonConfirmBtn) {
      abandonConfirmBtn.addEventListener('click', () => {
        playSynthSound('tap');
        hideBitmasterAbandonModal();
        if (bitmasterState.timerInterval) clearInterval(bitmasterState.timerInterval);
        showBitmasterScreen('levels');
      });
    }

    // HUD Back Button
    const hudBackBtn = document.getElementById('bitmasterHudBackBtn');
    if (hudBackBtn) {
      hudBackBtn.addEventListener('click', () => {
        playSynthSound('tap');
        const activeScreen = document.querySelector('.bitmaster-screen.active');
        if (activeScreen && activeScreen.id === 'bitmasterScreenGame') {
          showBitmasterAbandonModal();
        } else if (activeScreen && activeScreen.id === 'bitmasterScreenSummary') {
          showBitmasterScreen('levels');
        } else if (activeScreen && activeScreen.id === 'bitmasterScreenLevels') {
          showBitmasterScreen('stages');
        } else {
          showBitmasterScreen('stages');
        }
      });
    }

    showBitmasterScreen('stages');
  }

  // =========================================================================
  // 9. INITIALIZATION
  // =========================================================================

  function init() {
    initTheme();
    initTabs();
    setupRegisterEvents();
    const urlParams = new URLSearchParams(window.location.search);
    const valParam = urlParams.get('val');
    if (valParam !== null) {
      const num = parseInt(valParam, 10);
      if (!isNaN(num) && num >= 0 && num <= 255) {
        for (let i = 0; i < 8; i++) {
          state.bits[i] = (num >> i) & 1;
        }
      }
    }
    renderRegister();
    setupStandaloneConverter();
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
    setupBitMaster();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
