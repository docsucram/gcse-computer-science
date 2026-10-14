/**
 * GCSE Numbers & Characters Module Logic
 * Pure Vanilla JavaScript (ES6+) - Zero build tools required
 * Universal GCSE Computer Science Number Systems (AQA, OCR, Edexcel, Eduqas, CIE)
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
    shiftOriginalValue: 20, // 00010100 in 8-bit
    shiftAmount: 0, // positive = left, negative = right
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
    btnModeSignMag: document.getElementById('btnModeSignMag'),
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
    signMagExplainer: document.getElementById('signMagExplainer'),
    signMagLiveTrace: document.getElementById('signMagLiveTrace'),
    btnTestNegZero: document.getElementById('btnTestNegZero'),
    twosComplementExplainer: document.getElementById('twosComplementExplainer'),
    twosStepTrace: document.getElementById('twosStepTrace'),
    btnPresetPlus127: document.getElementById('btnPresetPlus127'),
    btnTriggerSignedOverflow: document.getElementById('btnTriggerSignedOverflow'),
    btnPresetMinus1: document.getElementById('btnPresetMinus1'),
    btnPresetMinus128: document.getElementById('btnPresetMinus128'),
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
    btnShiftStepLeft: document.getElementById('btnShiftStepLeft'),
    btnShiftStepRight: document.getElementById('btnShiftStepRight'),
    btnResetShift: document.getElementById('btnResetShift'),
    calcShiftInput: document.getElementById('calcShiftInput'),
    calcShiftHex: document.getElementById('calcShiftHex'),
    shiftOrigGrid: document.getElementById('shiftOrigGrid'),
    shiftResultGrid: document.getElementById('shiftResultGrid'),
    shiftResultHex: document.getElementById('shiftResultHex'),
    shiftMathFormula: document.getElementById('shiftMathFormula'),
    shiftLossBadge: document.getElementById('shiftLossBadge'),
    currentShiftStatusLabel: document.getElementById('currentShiftStatusLabel'),

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
    const isStandalone = urlParams.has('standalone') || urlParams.has('play') || urlParams.has('game') || urlParams.has('arcade_only');
    if (isStandalone) {
      document.body.classList.add('bitmaster-standalone-mode');
      const arcadeBtn = Array.from(DOM.tabButtons).find(b => b.getAttribute('data-tab') === 'arcade');
      if (arcadeBtn) arcadeBtn.click();
    } else {
      const initialTab = urlParams.get('tab') || window.location.hash.replace('#', '').replace('tab-', '');
      if (initialTab) {
        const matchBtn = Array.from(DOM.tabButtons).find(b => b.getAttribute('data-tab') === initialTab);
        if (matchBtn) matchBtn.click();
      }
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

    // 3. Denary Value & Format according to mode
    let denary = 0;
    const activePlaceValues = [];

    const binStrHigh = `${state.bits[7]}${state.bits[6]}${state.bits[5]}${state.bits[4]}`;
    const binStrLow = `${state.bits[3]}${state.bits[2]}${state.bits[1]}${state.bits[0]}`;
    const rawBinary = `${binStrHigh}${binStrLow}`;
    if (DOM.summaryBinary) DOM.summaryBinary.textContent = `${binStrHigh} ${binStrLow}`;

    // Hex display: No "0x" in primary exam display
    if (DOM.summaryHex) DOM.summaryHex.textContent = `${highHexChar}${lowHexChar}`;

    if (state.numberMode === 'sign_mag') {
      const isNeg = (state.bits[7] === 1);
      let magnitude = 0;
      const magComponents = [];
      for (let i = 0; i < 7; i++) {
        if (state.bits[i] === 1) {
          const pv = Math.pow(2, i);
          magnitude += pv;
          magComponents.push(pv);
        }
      }

      if (isNeg) {
        if (magnitude === 0) {
          if (DOM.summaryDenary) DOM.summaryDenary.textContent = '-0';
          if (DOM.summaryAdditionBreakdown) {
            DOM.summaryAdditionBreakdown.textContent = 'Sign: - (Negative) | Magnitude: 0 | Value: -0 (Redundant Zero!)';
          }
        } else {
          if (DOM.summaryDenary) DOM.summaryDenary.textContent = `-${magnitude}`;
          if (DOM.summaryAdditionBreakdown) {
            DOM.summaryAdditionBreakdown.textContent = `Sign: - (Negative) | Magnitude: ${magComponents.join(' + ') || '0'} = ${magnitude} | Value: -${magnitude}`;
          }
        }
      } else {
        if (DOM.summaryDenary) DOM.summaryDenary.textContent = `+${magnitude}`;
        if (DOM.summaryAdditionBreakdown) {
          DOM.summaryAdditionBreakdown.textContent = `Sign: + (Positive) | Magnitude: ${magComponents.join(' + ') || '0'} = ${magnitude} | Value: +${magnitude}`;
        }
      }

      if (DOM.signMagExplainer) DOM.signMagExplainer.style.display = 'block';
      if (DOM.twosComplementExplainer) DOM.twosComplementExplainer.style.display = 'none';

      if (DOM.signMagLiveTrace) {
        const magBinaryStr = `${state.bits[6]}${state.bits[5]}${state.bits[4]} ${state.bits[3]}${state.bits[2]}${state.bits[1]}${state.bits[0]}`;
        if (isNeg && magnitude === 0) {
          DOM.signMagLiveTrace.innerHTML = `
            <strong>Sign Bit (MSB, Bit 7):</strong> <code style="color: #dc2626;">1</code> &rarr; Negative (<code>−</code>)<br>
            <strong>Magnitude (Bits 6..0):</strong> <code>${magBinaryStr}</code> &rarr; <code>0</code><br>
            <strong>Evaluated Value:</strong> <strong style="color: #dc2626;">-0 (Negative Zero!)</strong><br>
            <span style="color: #dc2626; font-size: 11.5px; display: block; margin-top: 4px;">⚠️ <strong>The Classic Trap:</strong> This exposes the primary flaw of Sign &amp; Magnitude: Zero has TWO distinct representations: +0 (00000000) and -0 (10000000). This wastes a state and forces the CPU to test for both!</span>
          `;
        } else if (isNeg) {
          DOM.signMagLiveTrace.innerHTML = `
            <strong>Sign Bit (MSB, Bit 7):</strong> <code style="color: #dc2626;">1</code> &rarr; Negative (<code>−</code>)<br>
            <strong>Magnitude (Bits 6..0):</strong> <code>${magBinaryStr}</code> &rarr; <code>${magnitude}</code><br>
            <strong>Evaluated Value:</strong> <strong style="color: #dc2626;">-${magnitude}</strong>
          `;
        } else {
          DOM.signMagLiveTrace.innerHTML = `
            <strong>Sign Bit (MSB, Bit 7):</strong> <code style="color: #059669;">0</code> &rarr; Positive (<code>+</code>)<br>
            <strong>Magnitude (Bits 6..0):</strong> <code>${magBinaryStr}</code> &rarr; <code>${magnitude}</code><br>
            <strong>Evaluated Value:</strong> <strong style="color: #059669;">+${magnitude}</strong>
          `;
        }
      }
    } else {
      // Unsigned or Two's Complement
      if (DOM.signMagExplainer) DOM.signMagExplainer.style.display = 'none';

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
            const positiveSum = denary + 128;
            DOM.twosStepTrace.innerHTML = `
              <strong>Sign (Bit 7 MSB):</strong> <code style="color: #0284c7;">1</code> &rarr; Negative (worth <strong>-128</strong>).<br>
              <strong>Method 1 (Place Values):</strong> -128 + ${positiveSum} = <strong style="color: #0284c7;">${denary}</strong><br>
              <strong>Method 2 (Algorithm Check):</strong> Invert bits (${rawBinary} &rarr; ${invertString(rawBinary)}), add 1 &rarr; magnitude ${Math.abs(denary)} &rarr; Result: <strong style="color: #0284c7;">${denary}</strong>.
            `;
          } else {
            DOM.twosStepTrace.innerHTML = `
              <strong>Sign (Bit 7 MSB):</strong> <code style="color: #059669;">0</code> &rarr; Positive (&ge; 0). Evaluates directly to <strong style="color: #059669;">+${denary}</strong>.
            `;
          }
        }
      } else {
        if (DOM.twosComplementExplainer) DOM.twosComplementExplainer.style.display = 'none';
      }
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
    if (DOM.btnModeSignMag) DOM.btnModeSignMag.classList.toggle('active', mode === 'sign_mag');
    if (DOM.btnModeTwosComp) DOM.btnModeTwosComp.classList.toggle('active', mode === 'twos');
    if (DOM.btnModeHex) DOM.btnModeHex.classList.toggle('active', mode === 'hex');

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
      } else if (mode === 'sign_mag') {
        DOM.msbPlaceValueLabel.textContent = 'Sign (+/-)';
        DOM.msbPlaceValueLabel.classList.remove('msb-negative');
      } else {
        DOM.msbPlaceValueLabel.textContent = '128';
        DOM.msbPlaceValueLabel.classList.remove('msb-negative');
      }
    }

    // Pedagogical Explainers visibility: Show only the active representation explainer
    const explainerUnsigned = document.getElementById('explainerUnsigned');
    const explainerSignMag = document.getElementById('explainerSignMag');
    const explainerTwos = document.getElementById('explainerTwos');

    if (explainerUnsigned) explainerUnsigned.style.display = isBinary ? 'block' : 'none';
    if (explainerSignMag) explainerSignMag.style.display = mode === 'sign_mag' ? 'block' : 'none';
    if (explainerTwos) explainerTwos.style.display = mode === 'twos' ? 'block' : 'none';

    renderRegister();
  }

  function setupRegisterEvents() {
    // Mode toggles
    if (DOM.btnModeBinary) DOM.btnModeBinary.addEventListener('click', () => setNumberMode('binary'));
    if (DOM.btnModeSignMag) DOM.btnModeSignMag.addEventListener('click', () => setNumberMode('sign_mag'));
    if (DOM.btnModeHex) DOM.btnModeHex.addEventListener('click', () => setNumberMode('hex'));
    if (DOM.btnModeUnsigned) DOM.btnModeUnsigned.addEventListener('click', () => setNumberMode('binary'));
    if (DOM.btnModeTwosComp) DOM.btnModeTwosComp.addEventListener('click', () => setNumberMode('twos'));

    // Sign & Magnitude / Two's Complement quick interactive test buttons
    if (DOM.btnTestNegZero) {
      DOM.btnTestNegZero.addEventListener('click', () => {
        playSynthSound('tap');
        state.bits = [0, 0, 0, 0, 0, 0, 0, 1]; // MSB=1, bits 0..6=0 (10000000)
        setNumberMode('sign_mag');
      });
    }

    if (DOM.btnPresetPlus127) {
      DOM.btnPresetPlus127.addEventListener('click', () => {
        playSynthSound('tap');
        state.bits = [1, 1, 1, 1, 1, 1, 1, 0]; // 01111111 (+127)
        renderRegister();
      });
    }

    if (DOM.btnTriggerSignedOverflow) {
      DOM.btnTriggerSignedOverflow.addEventListener('click', () => {
        playSynthSound('wrong');
        // Adding 1 to +127 (01111111) flips to 10000000 (-128)
        state.bits = [0, 0, 0, 0, 0, 0, 0, 1]; // 10000000 (-128)
        renderRegister();
      });
    }

    if (DOM.btnPresetMinus1) {
      DOM.btnPresetMinus1.addEventListener('click', () => {
        playSynthSound('tap');
        state.bits = [1, 1, 1, 1, 1, 1, 1, 1]; // 11111111 (-1)
        renderRegister();
      });
    }

    if (DOM.btnPresetMinus128) {
      DOM.btnPresetMinus128.addEventListener('click', () => {
        playSynthSound('tap');
        state.bits = [0, 0, 0, 0, 0, 0, 0, 1]; // 10000000 (-128)
        renderRegister();
      });
    }

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

  // Progressive Audio Manager: Plays real .ogg or .mp3 assets if available (e.g. menu_nav.ogg, bit_toggle.ogg, answer_correct.mp3),
  // with instant fallback to Web Audio procedural synthesis oscillators.
  const SOUND_FILE_MAP = {
    tap: ['assets/sounds/menu_nav.ogg', 'modules/binary-numbers/assets/sounds/menu_nav.ogg', 'assets/sounds/menu_nav.mp3', 'modules/binary-numbers/assets/sounds/menu_nav.mp3'],
    click: ['assets/sounds/menu_nav.ogg', 'modules/binary-numbers/assets/sounds/menu_nav.ogg', 'assets/sounds/menu_nav.mp3', 'modules/binary-numbers/assets/sounds/menu_nav.mp3'],
    switch: ['assets/sounds/bit_toggle.ogg', 'modules/binary-numbers/assets/sounds/bit_toggle.ogg', 'assets/sounds/bit_toggle.mp3', 'modules/binary-numbers/assets/sounds/bit_toggle.mp3'],
    correct: ['assets/sounds/answer_correct.ogg', 'modules/binary-numbers/assets/sounds/answer_correct.ogg', 'assets/sounds/answer_correct.mp3', 'modules/binary-numbers/assets/sounds/answer_correct.mp3'],
    success: ['assets/sounds/answer_correct.ogg', 'modules/binary-numbers/assets/sounds/answer_correct.ogg', 'assets/sounds/answer_correct.mp3', 'modules/binary-numbers/assets/sounds/answer_correct.mp3'],
    wrong: ['assets/sounds/answer_wrong.ogg', 'modules/binary-numbers/assets/sounds/answer_wrong.ogg', 'assets/sounds/answer_wrong.mp3', 'modules/binary-numbers/assets/sounds/answer_wrong.mp3'],
    star: ['assets/sounds/star_pop.ogg', 'modules/binary-numbers/assets/sounds/star_pop.ogg', 'assets/sounds/star_pop.mp3', 'modules/binary-numbers/assets/sounds/star_pop.mp3'],
    victory: ['assets/sounds/victory_fanfare.ogg', 'modules/binary-numbers/assets/sounds/victory_fanfare.ogg', 'assets/sounds/victory_fanfare.mp3', 'modules/binary-numbers/assets/sounds/victory_fanfare.mp3'],
    perfect10: ['assets/sounds/victory_fanfare.ogg', 'modules/binary-numbers/assets/sounds/victory_fanfare.ogg', 'assets/sounds/victory_fanfare.mp3', 'modules/binary-numbers/assets/sounds/victory_fanfare.mp3'],
    levelup: ['assets/sounds/rank_levelup.ogg', 'modules/binary-numbers/assets/sounds/rank_levelup.ogg', 'assets/sounds/rank_levelup.mp3', 'modules/binary-numbers/assets/sounds/rank_levelup.mp3']
  };

  const bitmasterAudioCache = {};

  function playRealAudio(type, onFallback) {
    const list = SOUND_FILE_MAP[type];
    if (!list || list.length === 0) {
      if (onFallback) onFallback();
      return;
    }

    if (bitmasterAudioCache[type] === false) {
      if (onFallback) onFallback();
      return;
    }

    if (bitmasterAudioCache[type] instanceof Audio) {
      const a = bitmasterAudioCache[type];
      a.currentTime = 0;
      a.play().catch(() => {
        if (onFallback) onFallback();
      });
      return;
    }

    const a = new Audio();
    a.src = list[0];
    a.volume = 0.6;
    a.play().then(() => {
      bitmasterAudioCache[type] = a;
    }).catch(() => {
      if (list[1]) {
        const a2 = new Audio();
        a2.src = list[1];
        a2.volume = 0.6;
        a2.play().then(() => {
          bitmasterAudioCache[type] = a2;
        }).catch(() => {
          bitmasterAudioCache[type] = false;
          if (onFallback) onFallback();
        });
      } else {
        bitmasterAudioCache[type] = false;
        if (onFallback) onFallback();
      }
    });
  }

  function playSynthSound(type) {
    if (isAudioMuted) return;
    playRealAudio(type, () => {
      playProceduralSynthSound(type);
    });
  }

  function playProceduralSynthSound(type) {
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
      } else if (type === 'levelup') {
        // Triumphant 6-note arpeggio with shimmer: C4 -> E4 -> G4 -> C5 -> E5 -> G5 -> C6
        const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx >= 4 ? 'triangle' : 'sine';
          const startTime = now + idx * 0.08;
          const dur = idx === freqs.length - 1 ? 0.85 : 0.35;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.18, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + dur);
        });
      } else if (type === 'star') {
        // Crisp sparkling bell chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1174.66, now); // D6
        osc.frequency.exponentialRampToValueAtTime(1760.00, now + 0.12); // A6
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'bubblepop') {
        // High-resonance pop chirp
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(1150, now + 0.055);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.065);
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
    if (score >= 20) return 'Rank: 👑 Hex Grandmaster (Top 1%)';
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
    if (!document.getElementById('targetPracticePanel')) return;
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
            DOM.gameHexFeedback.textContent = `🎉 Correct! Hex ${expectedHex}`;
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
    if (DOM.calcAddHexA) DOM.calcAddHexA.textContent = `${denaryA.toString(16).toUpperCase().padStart(2, '0')}`;
    if (DOM.calcAddHexB) DOM.calcAddHexB.textContent = `${denaryB.toString(16).toUpperCase().padStart(2, '0')}`;
    if (DOM.calcAddResultNum) DOM.calcAddResultNum.textContent = hasOverflow ? `${totalMath} (Overflown to ${denarySum})` : totalMath;
    if (DOM.calcAddResultHex) DOM.calcAddResultHex.textContent = `${denarySum.toString(16).toUpperCase().padStart(2, '0')}`;

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
    if (DOM.calcSubHexA) DOM.calcSubHexA.textContent = `${denaryA.toString(16).toUpperCase().padStart(2, '0')}`;
    if (DOM.calcSubHexB) DOM.calcSubHexB.textContent = `${denaryB.toString(16).toUpperCase().padStart(2, '0')}`;
    if (DOM.calcSubResultNum) DOM.calcSubResultNum.textContent = resultMath;
    const unsignedRes = (resultMath + 256) & 0xFF;
    if (DOM.calcSubResultHex) DOM.calcSubResultHex.textContent = `${unsignedRes.toString(16).toUpperCase().padStart(2, '0')}`;

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
      tip: '💡 <strong>Exam Masking Use:</strong> Used for <em>masking</em> (extracting or clearing bits). For example, <code>x AND 00000001</code> tests if a number is odd (1) or even (0). <code>x AND 00001111</code> clears the upper nibble and keeps the lower nibble intact.',
    },
    OR: {
      symbol: '|',
      label: 'OR Row B:',
      title: 'Bitwise OR (|)',
      desc: 'Output bit is <strong>1</strong> if EITHER Bit A or Bit B is 1 (or both). Output is 0 only when both are 0.',
      tip: '💡 <strong>Exam Masking Use:</strong> Used to <em>set</em> specific bits to 1 without changing any other bits in a register or control byte.',
    },
    XOR: {
      symbol: '^',
      label: 'XOR Row B:',
      title: 'Bitwise XOR (^ Exclusive OR)',
      desc: 'Output bit is <strong>1</strong> if the bits are DIFFERENT. If both bits are identical (both 0 or both 1), the output is 0.',
      tip: '💡 <strong>Exam Masking Use:</strong> Used to <em>toggle/flip</em> bits (applying 1 inverts that bit; applying 0 leaves it alone). Widely tested in symmetric ciphers and game graphics (sprites).',
    },
    NOT: {
      symbol: '~',
      label: 'NOT (Inverts A):',
      title: 'Bitwise NOT (~ Inversion)',
      desc: 'Inverts every single bit in Row A. 0 becomes 1, and 1 becomes 0.',
      tip: '💡 <strong>Exam Masking Use:</strong> Used to generate the One\'s complement of a binary number prior to adding 1 for Two\'s complement negative arithmetic.',
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
    if (DOM.calcLogicHexA) DOM.calcLogicHexA.textContent = `${denA.toString(16).toUpperCase().padStart(2, '0')}`;
    if (DOM.calcLogicHexB) DOM.calcLogicHexB.textContent = op === 'NOT' ? '—' : `${denB.toString(16).toUpperCase().padStart(2, '0')}`;
    if (DOM.calcLogicResultNum) DOM.calcLogicResultNum.textContent = denRes;
    if (DOM.calcLogicResultHex) DOM.calcLogicResultHex.textContent = `${denRes.toString(16).toUpperCase().padStart(2, '0')}`;

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
    const origVal = Math.max(0, Math.min(255, state.shiftOriginalValue !== undefined ? state.shiftOriginalValue : 20));
    const k = state.shiftAmount || 0; // positive = left, negative = right, 0 = unshifted

    // 1. Calculate shifted value & track data loss
    let shiftedVal = origVal;
    let overflow = false;
    let truncated = false;
    let mathText = '';

    if (k > 0) {
      // Left shift: multiplication by 2^k
      const multiplier = Math.pow(2, k);
      const trueResult = origVal * multiplier;
      shiftedVal = (origVal << k) & 0xFF;
      mathText = `${origVal} × ${multiplier} = ${trueResult}`;
      // Check if any 1 bit in origVal was shifted out past bit 7 (MSB)
      for (let i = 8 - k; i < 8; i++) {
        if ((origVal >> i) & 1) {
          overflow = true;
          break;
        }
      }
      if (overflow) {
        mathText += ` (Truncated to 8-bit: ${shiftedVal})`;
      }
    } else if (k < 0) {
      // Right shift: integer division by 2^|k|
      const divisor = Math.pow(2, Math.abs(k));
      shiftedVal = origVal >> Math.abs(k);
      const remainder = origVal % divisor;
      mathText = `${origVal} ÷ ${divisor} = ${shiftedVal}`;
      if (remainder > 0) {
        truncated = true;
        mathText += ` (Remainder ${remainder} dropped)`;
      }
    } else {
      mathText = `${origVal} (No shift applied)`;
    }

    // 2. Render Original Byte Grid (Bit 7 MSB down to Bit 0 LSB)
    if (DOM.shiftOrigGrid) {
      DOM.shiftOrigGrid.innerHTML = '';
      for (let bitIdx = 7; bitIdx >= 0; bitIdx--) {
        const pv = Math.pow(2, bitIdx);
        const bitVal = (origVal >> bitIdx) & 1;
        const cell = document.createElement('div');
        cell.className = `shift-cell ${bitVal === 1 ? 'active' : ''}`;
        cell.style.cursor = 'pointer';
        cell.title = `Click to toggle Bit ${bitIdx} (${pv})`;
        cell.innerHTML = `
          <span class="cell-pv">${pv}</span>
          <span class="cell-bit">${bitVal}</span>
        `;
        cell.addEventListener('click', () => {
          playSynthSound('click');
          state.shiftOriginalValue = origVal ^ (1 << bitIdx);
          renderShifts();
        });
        DOM.shiftOrigGrid.appendChild(cell);
      }
    }

    // 3. Render Shifted Result Grid
    if (DOM.shiftResultGrid) {
      DOM.shiftResultGrid.innerHTML = '';
      for (let bitIdx = 7; bitIdx >= 0; bitIdx--) {
        const pv = Math.pow(2, bitIdx);
        const bitVal = (shiftedVal >> bitIdx) & 1;
        // Determine if this bit position is newly padded with 0
        let isIncomingZero = false;
        if (k > 0 && bitIdx < k) {
          isIncomingZero = true; // lower k bits padded with 0 on left shift
        } else if (k < 0 && bitIdx >= 8 + k) {
          isIncomingZero = true; // upper |k| bits padded with 0 on right shift
        }

        const cell = document.createElement('div');
        cell.className = `shift-cell ${bitVal === 1 ? 'active' : ''} ${isIncomingZero ? 'is-incoming-zero' : ''}`;
        cell.innerHTML = `
          <span class="cell-pv">${pv}</span>
          <span class="cell-bit">${bitVal}</span>
        `;
        DOM.shiftResultGrid.appendChild(cell);
      }
    }

    // 4. Update Inputs and Displays
    if (DOM.calcShiftInput && document.activeElement !== DOM.calcShiftInput) {
      DOM.calcShiftInput.value = origVal;
    }
    if (DOM.calcShiftHex) {
      DOM.calcShiftHex.textContent = `${origVal.toString(16).toUpperCase().padStart(2, '0')}₁₆`;
    }
    if (DOM.shiftDenaryDisplay) {
      DOM.shiftDenaryDisplay.textContent = shiftedVal;
    }
    if (DOM.shiftResultHex) {
      DOM.shiftResultHex.textContent = `${shiftedVal.toString(16).toUpperCase().padStart(2, '0')}₁₆`;
    }
    if (DOM.shiftMathFormula) {
      DOM.shiftMathFormula.textContent = mathText;
    }

    // Status label and loss badges
    if (DOM.currentShiftStatusLabel) {
      if (k > 0) {
        DOM.currentShiftStatusLabel.textContent = `« Left ${k} bit${k > 1 ? 's' : ''} (× ${Math.pow(2, k)})`;
      } else if (k < 0) {
        const absK = Math.abs(k);
        DOM.currentShiftStatusLabel.textContent = `Right ${absK} bit${absK > 1 ? 's' : ''} (÷ ${Math.pow(2, absK)}) »`;
      } else {
        DOM.currentShiftStatusLabel.textContent = '0 shifts (Original)';
      }
    }

    if (DOM.shiftLossBadge) {
      if (overflow) {
        DOM.shiftLossBadge.className = 'shift-loss-badge warning';
        DOM.shiftLossBadge.innerHTML = '<span>⚠️</span> Overflow Error: 1-bits lost past MSB!';
      } else if (truncated) {
        DOM.shiftLossBadge.className = 'shift-loss-badge info';
        DOM.shiftLossBadge.innerHTML = '<span>ℹ️</span> Truncation: Fractional remainder dropped';
      } else {
        DOM.shiftLossBadge.className = 'shift-loss-badge none';
        DOM.shiftLossBadge.innerHTML = '<span>✓</span> No data loss';
      }
    }
  }

  function setupShiftEvents() {
    if (DOM.calcShiftInput) {
      DOM.calcShiftInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 0;
        state.shiftOriginalValue = Math.max(0, Math.min(255, val));
        renderShifts();
      });
    }

    if (DOM.btnShiftStepLeft) {
      DOM.btnShiftStepLeft.addEventListener('click', () => {
        playSynthSound('click');
        state.shiftAmount = Math.min(8, (state.shiftAmount || 0) + 1);
        renderShifts();
      });
    }

    if (DOM.btnShiftStepRight) {
      DOM.btnShiftStepRight.addEventListener('click', () => {
        playSynthSound('click');
        state.shiftAmount = Math.max(-8, (state.shiftAmount || 0) - 1);
        renderShifts();
      });
    }

    if (DOM.btnResetShift) {
      DOM.btnResetShift.addEventListener('click', () => {
        playSynthSound('click');
        state.shiftAmount = 0;
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

  // Stage Vector SVG Icons (No emojis - semantic CS symbols)
  const BITMASTER_STAGE_ICONS = {
    1: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3"/></svg>`,
    2: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="4" x2="6" y2="20"/><line x1="10" y1="4" x2="10" y2="20"/><line x1="14" y1="4" x2="14" y2="20"/><line x1="18" y1="4" x2="18" y2="20"/></svg>`,
    3: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3" fill="currentColor"/></svg>`,
    4: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>`,
    5: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    6: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
    7: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19"/></svg>`,
    8: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
    9: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
    10: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg>`,
    11: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`,
    12: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>`,
    13: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
    14: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/><circle cx="12" cy="12" r="2"/></svg>`,
    15: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    16: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>`,
    17: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    18: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    19: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    20: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>`,
    21: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
  };

  // 6 Thematic Topic Groupings ("Worlds")
  const BITMASTER_TOPICS = [
    {
      id: 1,
      name: "Binary Foundations",
      shortName: "Binary",
      heroCode: "100101",
      tag: "TOPIC 01",
      accent: "#38bdf8",
      glow: "rgba(56, 189, 248, 0.28)",
      gradient: "linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(56, 189, 248, 0.05))",
      svgIcon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3"/></svg>`,
      desc: "Place values, switches & mental binary/denary conversion"
    },
    {
      id: 2,
      name: "Hexadecimal Mastery",
      shortName: "Hexadecimal",
      heroCode: "0xF",
      tag: "TOPIC 02",
      accent: "#ec4899",
      glow: "rgba(236, 72, 153, 0.28)",
      gradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(236, 72, 153, 0.05))",
      svgIcon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
      desc: "Hex digits (0x), nibble splitting & 3-way conversions"
    },
    {
      id: 3,
      name: "Binary Arithmetic",
      shortName: "Arithmetic",
      heroCode: "+ −",
      tag: "TOPIC 03",
      accent: "#f97316",
      glow: "rgba(249, 115, 22, 0.28)",
      gradient: "linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(249, 115, 22, 0.05))",
      svgIcon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/></svg>`,
      desc: "Column addition, unsigned subtraction & logical shifts"
    },
    {
      id: 4,
      name: "Signed Numbers",
      shortName: "Signed",
      heroCode: "± Signed",
      tag: "TOPIC 04",
      accent: "#06b6d4",
      glow: "rgba(6, 182, 212, 0.28)",
      gradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(6, 182, 212, 0.05))",
      svgIcon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="12" y1="5" x2="12" y2="13"/><line x1="7" y1="18" x2="17" y2="18"/></svg>`,
      desc: "Two's Complement, negation & signed binary arithmetic"
    },
    {
      id: 5,
      name: "Data Units & Calculations",
      shortName: "Data Units",
      heroCode: "KB / MB",
      tag: "TOPIC 05",
      accent: "#10b981",
      glow: "rgba(16, 185, 129, 0.28)",
      gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.05))",
      svgIcon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
      desc: "Prefixes, multimedia file sizing & network bandwidth"
    },
    {
      id: 6,
      name: "Mixed",
      shortName: "Mixed",
      heroCode: "MIX",
      tag: "TOPIC 06",
      accent: "#eab308",
      glow: "rgba(234, 179, 8, 0.32)",
      gradient: "linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(234, 179, 8, 0.05))",
      svgIcon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      desc: "Timed championship circuits across all topics"
    }
  ];

  const BITMASTER_STAGES = [
    // -------------------------------------------------------------------------
    // TOPIC 1: BINARY FOUNDATIONS (Stages 1 - 4)
    // -------------------------------------------------------------------------
    {
      id: 1,
      topicId: 1,
      title: "Stage 1: Nibble Place Values",
      shortTitle: "Nibble Place Values",
      subtitle: "4-Bit Place Values & Bit Weights (8 • 4 • 2 • 1)",
      svgIcon: BITMASTER_STAGE_ICONS[1],
      color: "#3b82f6",
      levels: [
        { id: 1, name: "Nibble Weights", mode: "place_val_nibble_what", desc: "Identify place values for 4-bit nibbles (8, 4, 2, 1) in visual bit boxes" },
        { id: 2, name: "Nibble Missing (?)", mode: "place_val_nibble_missing", desc: "Find the missing place value marked with '?' (e.g. 8, ?, 2, 1)" },
        { id: 3, name: "Nibble Blind (?)", mode: "place_val_nibble_all_blank", desc: "All bit boxes blank with a single '?' — identify the highlighted weight" },
        { id: 4, name: "Reverse Bit Finder", mode: "place_val_nibble_reverse_which_bit", desc: "Given a place value (8, 4, 2, 1), select the matching bit: Bit 3, 2, 1, or 0" }
      ]
    },
    {
      id: 2,
      topicId: 1,
      title: "Stage 2: Byte Place Values",
      shortTitle: "Byte Place Values",
      subtitle: "8-Bit Place Values & Bit Weights (128 down to 1)",
      svgIcon: BITMASTER_STAGE_ICONS[2],
      color: "#10b981",
      levels: [
        { id: 1, name: "Byte Weights", mode: "place_val_byte_what", desc: "Identify place values across 8-bit positions (128 down to 1)" },
        { id: 2, name: "Byte Missing (?)", mode: "place_val_byte_missing", desc: "Find the missing place value marked with '?' in an 8-bit byte" },
        { id: 3, name: "Byte Blind (?)", mode: "place_val_byte_all_blank", desc: "All bit boxes blank with a single '?' — identify the 8-bit column weight" },
        { id: 4, name: "Reverse Bit Finder", mode: "place_val_byte_reverse_which_bit", desc: "Given a byte weight (128..1), select the matching bit: Bit 7 down to Bit 0" }
      ]
    },
    {
      id: 3,
      topicId: 1,
      title: "Stage 3: Denary to Binary",
      shortTitle: "Denary to Binary",
      subtitle: "Assemble Binary Bit Patterns from Denary Numbers",
      svgIcon: BITMASTER_STAGE_ICONS[3],
      color: "#0ea5e9",
      levels: [
        { id: 1, name: "4-Bit Nibble (Assisted)", mode: "switches_nibble_assisted", desc: "Toggle 4-bit switches (8 • 4 • 2 • 1) for values 0 to 15 with live sum helper" },
        { id: 2, name: "4-Bit Nibble (Unassisted)", mode: "switches_nibble_unassisted", desc: "Toggle 4-bit switches without the current total — mental summation!" },
        { id: 3, name: "8-Bit Byte (Assisted)", mode: "switches_byte_assisted", desc: "Toggle 8-bit switches (128..1) for values 0 to 255 with live sum helper" },
        { id: 4, name: "8-Bit Byte (Unassisted)", mode: "switches_byte_unassisted", desc: "Toggle 8-bit switches without the current total — true exam practice!" }
      ]
    },
    {
      id: 4,
      topicId: 1,
      title: "Stage 4: Binary to Denary",
      shortTitle: "Binary to Denary",
      subtitle: "Convert Binary Bit Patterns to Denary Numbers",
      svgIcon: BITMASTER_STAGE_ICONS[4],
      color: "#8b5cf6",
      levels: [
        { id: 1, name: "4-Bit Nibble (Assisted)", mode: "mc_nibble_bin2den_assisted", desc: "4-Bit Binary to Denary with weights (8 • 4 • 2 • 1) displayed above bits" },
        { id: 2, name: "4-Bit Nibble (Unassisted)", mode: "mc_nibble_bin2den_unassisted", desc: "4-Bit Binary to Denary with place values removed (Mental conversion)" },
        { id: 3, name: "8-Bit Byte (Assisted)", mode: "mc_byte_bin2den_assisted", desc: "8-Bit Binary to Denary with weights (128..1) displayed above bits" },
        { id: 4, name: "8-Bit Byte (Unassisted)", mode: "mc_byte_bin2den_unassisted", desc: "Full 8-Bit Binary to Denary without scaffolding (Mental conversion)" },
        { id: 5, name: "Mixed Bi-Directional", mode: "mixed_bin_den", desc: "Rapid mix of Binary → Denary and Denary → Binary!" }
      ]
    },

    // -------------------------------------------------------------------------
    // TOPIC 2: HEXADECIMAL (Stages 5 - 7)
    // -------------------------------------------------------------------------
    {
      id: 5,
      topicId: 2,
      title: "Stage 5: Hexadecimal (Hex to Binary)",
      shortTitle: "Hex to Binary",
      subtitle: "Convert Hexadecimal Digits & Bytes into Binary (with 0x)",
      svgIcon: BITMASTER_STAGE_ICONS[5],
      color: "#ec4899",
      levels: [
        { id: 1, name: "1-Digit Hex (Assisted)", mode: "hex_nibble_flip_assisted", desc: "Flip 4 bits to match 0x0..0xF with live Hex value feedback" },
        { id: 2, name: "1-Digit Hex (Unassisted)", mode: "hex_nibble_flip_unassisted", desc: "Flip 4 bits to match 0x0..0xF without live Hex feedback" },
        { id: 3, name: "2-Digit Byte (Assisted)", mode: "hex_byte_flip_assisted", desc: "Flip two nibbles for 0x00..0xFF with live Hex value feedback" },
        { id: 4, name: "2-Digit Byte (Unassisted)", mode: "hex_byte_flip_unassisted", desc: "Flip two nibbles for 0x00..0xFF without live Hex feedback" }
      ]
    },
    {
      id: 6,
      topicId: 2,
      title: "Stage 6: Hexadecimal to Denary",
      shortTitle: "Hex to Denary",
      subtitle: "Convert Hex Values directly to Denary & Vice Versa",
      svgIcon: BITMASTER_STAGE_ICONS[6],
      color: "#f59e0b",
      levels: [
        { id: 1, name: "1-Digit Hex to Denary (Assisted)", mode: "mc_hex_nibble_to_den_assisted", desc: "Convert 0x0 to 0xF directly to Denary (0 to 15) with helper" },
        { id: 2, name: "1-Digit Hex to Denary (Unassisted)", mode: "mc_hex_nibble_to_den_unassisted", desc: "Convert 0x0 to 0xF directly to Denary (pure mental recall)" },
        { id: 3, name: "2-Digit Hex to Denary (Assisted)", mode: "mc_hex_byte_assisted", desc: "Convert 0x00 to 0xFF to Denary with (16 × High + Low) helper" },
        { id: 4, name: "2-Digit Hex to Denary (Unassisted)", mode: "mc_hex_byte_unassisted", desc: "Convert 0x00 to 0xFF to Denary without assistance" },
        { id: 5, name: "Denary to Hex", mode: "mc_den_to_hex", desc: "Convert Denary numbers back into Hexadecimal (e.g. 171 → 0xAB)" }
      ]
    },
    {
      id: 7,
      topicId: 2,
      title: "Stage 7: 3-Way Conversion",
      shortTitle: "3-Way Conversion",
      subtitle: "Tri-Directional Conversion (Hex ↔ Binary ↔ Denary)",
      svgIcon: BITMASTER_STAGE_ICONS[7],
      color: "#a855f7",
      levels: [
        { id: 1, name: "Hex ↔ Binary", mode: "hex_mixed_bin", desc: "Bi-directional Hex & Binary conversions (with 0x)" },
        { id: 2, name: "Hex ↔ Denary", mode: "hex_mixed_den", desc: "Bi-directional Hex & Denary conversions (with 0x)" },
        { id: 3, name: "Tri-Directional Blitz", mode: "hex_tri_mixed", desc: "Master Blitz: Hex ↔ Binary ↔ Denary all mixed together!" }
      ]
    },

    // -------------------------------------------------------------------------
    // TOPIC 3: BINARY ARITHMETIC (Stages 8 - 10)
    // -------------------------------------------------------------------------
    {
      id: 8,
      topicId: 3,
      title: "Stage 8: Binary Addition & Overflow",
      shortTitle: "Binary Addition",
      subtitle: "Column Addition, Carries & Unsigned 8-Bit Overflow",
      svgIcon: BITMASTER_STAGE_ICONS[8],
      color: "#f97316",
      levels: [
        { id: 1, name: "Starter Addition", mode: "math_add_no_overflow", desc: "Beginner Addition: No Carries & No Overflow (0+0, 0+1, 1+0)" },
        { id: 2, name: "Carries Starter", mode: "math_add_simple", desc: "4-Bit Addition with Carries: 1 + 1 = 10" },
        { id: 3, name: "Full 8-Bit Addition", mode: "math_add_8bit", desc: "Full 8-Bit Column Addition Grid with multiple carries" },
        { id: 4, name: "Unsigned Overflow Detection", mode: "math_add_overflow_detect", desc: "Diagnose 8-bit overflow errors when the 9th carry bit exceeds 255" }
      ]
    },
    {
      id: 9,
      topicId: 3,
      title: "Stage 9: Unsigned Binary Subtraction",
      shortTitle: "Unsigned Subtraction",
      subtitle: "Direct Column Subtraction & Borrow Mechanics",
      svgIcon: BITMASTER_STAGE_ICONS[9],
      color: "#ef4444",
      levels: [
        { id: 1, name: "Starter Subtraction (No Borrows)", mode: "math_sub_no_borrow_4bit", desc: "4-Bit Column Subtraction with No Borrows (1−0=1, 1−1=0, 0−0=0)" },
        { id: 2, name: "8-Bit Subtraction (No Borrows)", mode: "math_sub_no_borrow_8bit", desc: "Full 8-Bit Column Subtraction with No Borrows across all 8 columns" },
        { id: 3, name: "Column Subtraction with Borrows", mode: "math_sub_with_borrows_4bit", desc: "4-Bit Column Subtraction where 0−1 borrows 1 from the next higher column" },
        { id: 4, name: "Unsigned Underflow / Subtraction Trap", mode: "math_sub_underflow_quiz", desc: "Understand why computers cannot represent A < B in unsigned registers without sign bits" }
      ]
    },
    {
      id: 10,
      topicId: 3,
      title: "Stage 10: Logical Shifts",
      shortTitle: "Logical Shifts",
      subtitle: "Binary Shifting & Arithmetic Effects (×2, ÷2)",
      svgIcon: BITMASTER_STAGE_ICONS[10],
      color: "#ec4899",
      levels: [
        { id: 1, name: "Interactive Shift Flip", mode: "math_shift_flip", desc: "Flip the shifted bits underneath in the result row & submit!" },
        { id: 2, name: "Logical Left Shifts", mode: "mc_shift_left", desc: "Left Shifts (Multiply by 2, 4, 8) with MSB overflow check" },
        { id: 3, name: "Logical Right Shifts", mode: "mc_shift_right", desc: "Right Shifts (Divide by 2, 4 with Truncation)" }
      ]
    },

    // -------------------------------------------------------------------------
    // TOPIC 4: SIGNED NUMBERS & HARDWARE SUBTRACTION (Stages 11 - 14)
    // -------------------------------------------------------------------------
    {
      id: 11,
      topicId: 4,
      title: "Stage 11: Two's Complement Foundations",
      shortTitle: "Two's Comp Foundations",
      subtitle: "Signed Binary, Positive vs Negative & Theory Rules",
      svgIcon: BITMASTER_STAGE_ICONS[11],
      color: "#06b6d4",
      levels: [
        { id: 1, name: "4-Bit: Positive or Negative?", mode: "twos_comp_sign_nibble", desc: "Identify if 4-bit Two's Complement numbers are positive or negative with labelled weights" },
        { id: 2, name: "8-Bit: Positive or Negative?", mode: "twos_comp_sign_byte", desc: "Identify if 8-bit Two's Complement bytes are positive or negative with labelled weights" },
        { id: 3, name: "Rapid Sign Recall", mode: "twos_comp_sign_rapid", desc: "Unassisted rapid recall: Look at the MSB and determine the sign instantly!" },
        { id: 4, name: "Two's Complement Quiz", mode: "mc_twos_comp_sign", desc: "Core theory: MSB values (−8 / −128), range boundaries, and zero representation" }
      ]
    },
    {
      id: 12,
      topicId: 4,
      title: "Stage 12: Converting to Two's Complement",
      shortTitle: "Converting to Two's Comp",
      subtitle: "Invert all bits and add 1 (+1) to form negative values & vice versa",
      svgIcon: BITMASTER_STAGE_ICONS[12],
      color: "#14b8a6",
      levels: [
        { id: 1, name: "4-Bit Negation (Odd Numbers)", mode: "twos_comp_negate_4bit_odd", desc: "Convert +X to −X (LSB ends in 1): Invert bits directly above switches and add 1" },
        { id: 2, name: "8-Bit Negation (Odd Numbers)", mode: "twos_comp_negate_8bit_odd", desc: "Convert +X to −X (LSB ends in 1): 8-bit byte with positive bits aligned directly above" },
        { id: 3, name: "8-Bit Negation (Even Numbers / Carries)", mode: "twos_comp_negate_8bit_even", desc: "Convert +X to −X (LSB ends in 0): Invert and ripple carries on +1!" },
        { id: 4, name: "Negation Mastery (Unassisted)", mode: "twos_comp_negate_mastery", desc: "Mixed 4-bit and 8-bit positive to negative without the current total display" },
        { id: 5, name: "Negative to Positive (−X ➔ +X)", mode: "twos_comp_neg_to_pos", desc: "Convert −X back to +X using the exact same Two's Complement rule: Invert & +1!" }
      ]
    },
    {
      id: 13,
      topicId: 4,
      title: "Stage 13: Two's Complement to Denary",
      shortTitle: "Two's Comp to Denary",
      subtitle: "Calculate Signed Denary Values (−128 / −8 MSB)",
      svgIcon: BITMASTER_STAGE_ICONS[13],
      color: "#3b82f6",
      levels: [
        { id: 1, name: "4-Bit to Denary (Assisted)", mode: "mc_twos_comp_nibble_assisted", desc: "4-Bit Two's Comp to Denary with weights (−8 • 4 • 2 • 1) displayed above bits" },
        { id: 2, name: "4-Bit to Denary (Unassisted)", mode: "mc_twos_comp_nibble_unassisted", desc: "4-Bit Two's Comp to Denary with weights hidden (Mental calculation)" },
        { id: 3, name: "8-Bit to Denary (Assisted)", mode: "mc_twos_comp_byte_assisted", desc: "8-Bit Two's Comp to Denary with weights (−128..1) displayed above bits" },
        { id: 4, name: "8-Bit to Denary (Unassisted)", mode: "mc_twos_comp_byte_unassisted", desc: "8-Bit Two's Comp to Denary with weights hidden (Mental calculation)" },
        { id: 5, name: "Two's Complement Mastery", mode: "twos_comp_byte_mastery", desc: "Full 8-Bit Two's Complement mastery: mixed mental evaluation & switchboard construction!" }
      ]
    },
    {
      id: 14,
      topicId: 4,
      title: "Stage 14: Hardware Subtraction & ALU",
      shortTitle: "Hardware Subtraction & ALU",
      subtitle: "Compute A − B via A + (−B), End-Around Carry & Signed Overflow",
      svgIcon: BITMASTER_STAGE_ICONS[14],
      color: "#0284c7",
      levels: [
        { id: 1, name: "Two's Comp Negation Prep", mode: "sub_twos_comp_negate", desc: "Write (−B) in Two's Complement to prepare for hardware adder execution" },
        { id: 2, name: "Hardware Subtraction Grid", mode: "math_sub_twos_comp_grid", desc: "Write (−B) in Row B, then add Row A + Row B into the Result row" },
        { id: 3, name: "Ignore Final Carry Out", mode: "math_sub_drop_carry_quiz", desc: "Understand why the 9th carry bit out of the MSB is discarded in Two's Complement subtraction" },
        { id: 4, name: "Signed Overflow Traps", mode: "math_sub_signed_overflow_quiz", desc: "Recognize when adding two numbers with identical signs produces an impossible sign flip" }
      ]
    },

    // -------------------------------------------------------------------------
    // TOPIC 5: DATA UNITS & CALCULATIONS (Stages 15 - 18)
    // -------------------------------------------------------------------------
    {
      id: 15,
      topicId: 5,
      title: "Stage 15: Bits, Nibbles & Prefixes",
      shortTitle: "Bits, Nibbles & Prefixes",
      subtitle: "Fundamental storage units, decimal prefixes vs binary kibibytes",
      svgIcon: BITMASTER_STAGE_ICONS[15],
      color: "#10b981",
      levels: [
        { id: 1, name: "Bits, Nibbles & Bytes", mode: "units_fundamental", desc: "Fundamental units of storage: bits in byte, bytes in KB, and sizes" },
        { id: 2, name: "Decimal vs Binary Prefixes", mode: "units_prefixes_kib", desc: "Compare metric prefixes (KB, MB = 1000) with IEC binary prefixes (KiB, MiB = 1024)" },
        { id: 3, name: "Character Encoding Sizes", mode: "units_text_chars", desc: "7-bit/8-bit ASCII vs 16-bit/32-bit Unicode string byte calculations" }
      ]
    },
    {
      id: 16,
      topicId: 5,
      title: "Stage 16: Unit Conversions",
      shortTitle: "Unit Conversions",
      subtitle: "Convert between KB, MB, GB, and TB using decimal multipliers",
      svgIcon: BITMASTER_STAGE_ICONS[16],
      color: "#059669",
      levels: [
        { id: 1, name: "Step-Up Conversions (÷1,000)", mode: "units_conversions_up", desc: "Convert small units into larger units: Bytes ➔ KB, KB ➔ MB, MB ➔ GB" },
        { id: 2, name: "Step-Down Conversions (×1,000)", mode: "units_conversions_down", desc: "Convert large storage units into smaller units: TB ➔ GB, GB ➔ MB, MB ➔ KB" },
        { id: 3, name: "Mixed Multi-Step Conversions", mode: "units_conversions", desc: "Jump across multiple decimal tiers (e.g. Gigabytes directly to Kilobytes or Bytes)" }
      ]
    },
    {
      id: 17,
      topicId: 5,
      title: "Stage 17: Sound & Image File Sizing",
      shortTitle: "Sound & Image File Sizing",
      subtitle: "Compute file sizes from sample rate, bit depth, resolution & colour depth",
      svgIcon: BITMASTER_STAGE_ICONS[17],
      color: "#047857",
      levels: [
        { id: 1, name: "Sound File Size Formula", mode: "units_sound_calc", desc: "Sample rate (Hz) × Bit depth (bits) × Duration (s) × Channels" },
        { id: 2, name: "Bitmap Image File Size", mode: "units_image_calc", desc: "Width × Height × Colour Depth (bits) converted into Bytes / KB" },
        { id: 3, name: "Storage Partition Capacity", mode: "units_capacity", desc: "Calculate how many sound, video, or image files fit in a drive" }
      ]
    },
    {
      id: 18,
      topicId: 5,
      title: "Stage 18: Network Transmission & Speeds",
      shortTitle: "Network Speeds & Times",
      subtitle: "Bits vs Bytes (Mbps vs MB/s), network payloads & download times",
      svgIcon: BITMASTER_STAGE_ICONS[18],
      color: "#065f46",
      levels: [
        { id: 1, name: "Megabits (Mb) vs Megabytes (MB)", mode: "units_mb_vs_mb", desc: "Master the factor of 8 distinction between transfer rate and file storage" },
        { id: 2, name: "Broadband Download Times", mode: "units_transmission", desc: "Calculate download times: File Size (bits) ÷ Network Speed (bps)" },
        { id: 3, name: "Payload & Protocol Overhead", mode: "units_payload_overhead", desc: "Calculate effective transfer speeds accounting for packet headers and latency" }
      ]
    },

    // -------------------------------------------------------------------------
    // TOPIC 6: THE MASTER GAUNTLET (Stages 19 - 21)
    // -------------------------------------------------------------------------
    {
      id: 19,
      topicId: 6,
      title: "Stage 19: Conversions Circuit",
      shortTitle: "Conversions Circuit",
      subtitle: "High-speed blitz across Binary, Hexadecimal (0x) & Denary",
      svgIcon: BITMASTER_STAGE_ICONS[19],
      color: "#eab308",
      levels: [
        { id: 1, name: "Conversions Sprint", mode: "blitz_conversions", desc: "Rapid conversions between Binary, Hex with 0x, and Denary" }
      ]
    },
    {
      id: 20,
      topicId: 6,
      title: "Stage 20: Arithmetic & ALU Circuit",
      shortTitle: "Arithmetic & ALU Circuit",
      subtitle: "High-speed blitz across Addition, Subtraction, Shifts & Signed ALU",
      svgIcon: BITMASTER_STAGE_ICONS[20],
      color: "#f59e0b",
      levels: [
        { id: 1, name: "Arithmetic Blitz", mode: "blitz_maths", desc: "Binary column arithmetic, subtraction, shifts and signed Two's Complement" }
      ]
    },
    {
      id: 21,
      topicId: 6,
      title: "Stage 21: Grand BitMaster Championship",
      shortTitle: "BitMaster Championship",
      subtitle: "The ultimate gauntlet mixing all 20 previous stages together",
      svgIcon: BITMASTER_STAGE_ICONS[21],
      color: "#d97706",
      levels: [
        { id: 1, name: "Grand Championship Gauntlet", mode: "blitz_signed_hex", desc: "Comprehensive championship mix across all 6 topics of GCSE computer architecture!" }
      ]
    }
  ];

  // Progressive Ranks with accessible, steady point progression
  const BITMASTER_RANKS = [
    { minXp: 0, title: "Logic Novice", svgIcon: BITMASTER_STAGE_ICONS[1], avatarKey: "avatar_tier01_logic_novice" },
    { minXp: 4000, title: "Nibble Operator", svgIcon: BITMASTER_STAGE_ICONS[2], avatarKey: "avatar_tier02_nibble_operator" },
    { minXp: 10000, title: "Binary Specialist", svgIcon: BITMASTER_STAGE_ICONS[3], avatarKey: "avatar_tier03_binary_specialist" },
    { minXp: 18000, title: "Byte Engineer", svgIcon: BITMASTER_STAGE_ICONS[4], avatarKey: "avatar_tier04_byte_engineer" },
    { minXp: 28000, title: "Hex Sorcerer", svgIcon: BITMASTER_STAGE_ICONS[5], avatarKey: "avatar_tier08_hex_sorcerer" },
    { minXp: 40000, title: "Hex Archon", svgIcon: BITMASTER_STAGE_ICONS[6], avatarKey: "avatar_tier09_hex_archon" },
    { minXp: 54000, title: "ALU Vanguard", svgIcon: BITMASTER_STAGE_ICONS[8], avatarKey: "avatar_tier07_alu_vanguard" },
    { minXp: 70000, title: "Silicon Shifter", svgIcon: BITMASTER_STAGE_ICONS[10], avatarKey: "avatar_tier06_silicon_shifter" },
    { minXp: 88000, title: "Signed Sentinel", svgIcon: BITMASTER_STAGE_ICONS[11], avatarKey: "avatar_tier05_signed_sentinel" },
    { minXp: 108000, title: "Data Architect", svgIcon: BITMASTER_STAGE_ICONS[15], avatarKey: "avatar_tier10_data_architect" },
    { minXp: 130000, title: "Grand BitMaster", svgIcon: BITMASTER_STAGE_ICONS[21], avatarKey: "avatar_tier11_grand_bitmaster" },
    { minXp: 155000, title: "Supreme Silicon Legend", svgIcon: BITMASTER_STAGE_ICONS[21], avatarKey: "avatar_tier12_supreme_silicon_legend" }
  ];

  window.BITMASTER_AVATAR_CACHE = window.BITMASTER_AVATAR_CACHE || {};

  window.handleBitmasterAvatarLoad = function(img) {
    if (!img) return;
    img.style.display = 'block';
    const media = img.closest('.bitmaster-avatar-media');
    if (media) {
      const fallback = media.querySelector('.bitmaster-avatar-fallback');
      if (fallback) fallback.style.display = 'none';
    }
    const resolvedSrc = img.currentSrc || img.src;
    if (img.dataset.avatarKey && resolvedSrc) {
      window.BITMASTER_AVATAR_CACHE[img.dataset.avatarKey] = resolvedSrc;
    }
  };

  window.handleBitmasterAvatarError = function(img) {
    if (!img) return;
    const candidates = (img.dataset.candidates || '').split('|');
    let idx = parseInt(img.dataset.candIdx || '0', 10) + 1;
    if (idx < candidates.length && candidates[idx]) {
      img.dataset.candIdx = String(idx);
      img.src = candidates[idx];
    } else {
      img.style.display = 'none';
      const media = img.closest('.bitmaster-avatar-media');
      if (media) {
        const fallback = media.querySelector('.bitmaster-avatar-fallback');
        if (fallback) fallback.style.display = 'flex';
      }
      if (img.dataset.avatarKey) {
        window.BITMASTER_AVATAR_CACHE[img.dataset.avatarKey] = false;
      }
    }
  };

  const AVATAR_KEY_ALIASES = {
    avatar_tier07_alu_vanguard: ['avatar_tier07_alu_vanguard', 'avatar_tier07_alu_striker', 'avatar_tier07_alu_circuitist', 'avatar_tier07_logic_vanguard'],
    avatar_tier07_alu_circuitist: ['avatar_tier07_alu_vanguard', 'avatar_tier07_alu_striker', 'avatar_tier07_alu_circuitist', 'avatar_tier07_logic_vanguard'],
    avatar_tier08_signed_sentinel: ['avatar_tier08_signed_sentinel', 'avatar_tier08_complement_sentinel', 'avatar_tier08_polarity_phantom', 'avatar_tier08_twos_complement_master'],
    avatar_tier08_twos_complement_master: ['avatar_tier08_signed_sentinel', 'avatar_tier08_complement_sentinel', 'avatar_tier08_polarity_phantom', 'avatar_tier08_twos_complement_master']
  };

  function getBitmasterAvatarHTML(rank, extraClass = '') {
    if (!rank) return '';
    window.BITMASTER_AVATAR_CACHE = window.BITMASTER_AVATAR_CACHE || {};
    const key = rank.avatarKey || `avatar_tier${String(rank.id || 1).padStart(2, '0')}`;

    if (window.BITMASTER_AVATAR_CACHE[key] === false) {
      return `<div class="bitmaster-avatar-media ${extraClass}"><div class="bitmaster-avatar-fallback">${rank.svgIcon}</div></div>`;
    }

    const cachedSrc = window.BITMASTER_AVATAR_CACHE[key];
    const initialSrc = cachedSrc || `assets/avatars/${key}.png`;

    const exts = [
      '.png',
      '.jpeg',
      '.jpg',
      ' (Custom).jpeg',
      ' (Custom).png',
      ' (Custom).jpg',
      'a.jpeg',
      'a.png',
      '.webp'
    ];

    const keysToTry = AVATAR_KEY_ALIASES[key] || [key];
    const candidates = [];
    keysToTry.forEach(k => {
      exts.forEach(ext => {
        candidates.push(`assets/avatars/${k}${ext}`);
        candidates.push(`modules/binary-numbers/assets/avatars/${k}${ext}`);
      });
    });

    const candidatesAttr = candidates.join('|');

    return `
      <div class="bitmaster-avatar-media ${extraClass}">
        <img src="${initialSrc}"
             alt="${rank.title}"
             class="bitmaster-avatar-img"
             data-avatar-key="${key}"
             data-candidates="${candidatesAttr}"
             data-cand-idx="0"
             onload="window.handleBitmasterAvatarLoad(this)"
             onerror="window.handleBitmasterAvatarError(this)"
             style="${cachedSrc ? 'display:block;' : 'display:none;'}" />
        <div class="bitmaster-avatar-fallback" style="${cachedSrc ? 'display:none;' : 'display:flex;'}">
          ${rank.svgIcon}
        </div>
      </div>
    `;
  }

  function probeBitmasterAvatars() {
    BITMASTER_RANKS.forEach(rank => {
      const key = rank.avatarKey;
      if (!key) return;
      const exts = ['.png', '.jpeg', '.jpg', ' (Custom).jpeg', 'a.jpeg', '.webp'];
      const keysToTry = AVATAR_KEY_ALIASES[key] || [key];
      const pathsToTry = [];
      keysToTry.forEach(k => {
        exts.forEach(ext => {
          pathsToTry.push(`assets/avatars/${k}${ext}`);
        });
      });

      let idx = 0;
      function tryNext() {
        if (idx >= pathsToTry.length) {
          window.BITMASTER_AVATAR_CACHE[key] = false;
          return;
        }
        const src = pathsToTry[idx];
        idx++;
        const testImg = new Image();
        testImg.onload = () => {
          window.BITMASTER_AVATAR_CACHE[key] = src;
          const currentRank = getCurrentBitmasterRank();
          if (currentRank && (currentRank.avatarKey === key || currentRank.title === rank.title)) {
            const avatarEl = document.getElementById('bitmasterAvatarIcon');
            if (avatarEl) avatarEl.innerHTML = getBitmasterAvatarHTML(currentRank, 'hud-avatar');
          }
        };
        testImg.onerror = tryNext;
        testImg.src = src;
      }
      tryNext();
    });
  }

  const bitmasterState = {
    xp: 0,
    stars: {}, // key: "s{stageId}_l{levelId}" -> number (1-3)
    levelRecords: {}, // key: "s{stageId}_l{levelId}" -> { best10Q, stars10Q, bestSprint, solvedSprint, medalSprint }
    selectedGameMode: '10q', // '10q' | 'sprint'
    selectedTopicFilter: '1', // '1'..'6'
    isSprint: false,
    activeStage: 1,
    activeLevel: 1,
    currentQuestionIndex: 0,
    totalQuestions: 10,
    currentQuestion: null,
    mistakesThisRound: 0,
    correctThisRound: 0,
    currentQuestionMistakes: 0,
    startTime: null,
    timerInterval: null,
    elapsedSeconds: 0,
    sprintTimeLeft: 60,
    switchBits: [0, 0, 0, 0, 0, 0, 0, 0],
    keypadBuffer: ""
  };
  window.bitmasterState = bitmasterState;

  function loadBitmasterSave() {
    try {
      const savedV2 = localStorage.getItem('bitmaster_save_v2');
      if (savedV2) {
        const data = JSON.parse(savedV2);
        bitmasterState.stars = data.stars || {};
        bitmasterState.levelRecords = data.levelRecords || {};
        let totalXp = 0;
        Object.values(bitmasterState.levelRecords).forEach(rec => {
          totalXp += (Number(rec.best10Q) || 0) + (Number(rec.bestSprint) || 0);
        });
        bitmasterState.xp = totalXp;
      } else {
        const savedV1 = localStorage.getItem('bitmaster_save_v1');
        if (savedV1) {
          const data = JSON.parse(savedV1);
          bitmasterState.stars = data.stars || {};
          bitmasterState.levelRecords = {};
          let migXp = 0;
          Object.entries(bitmasterState.stars).forEach(([k, s]) => {
            const starVal = Number(s) || 0;
            const estScore = starVal === 3 ? 1500 : (starVal === 2 ? 1000 : (starVal === 1 ? 600 : 0));
            bitmasterState.levelRecords[k] = {
              best10Q: estScore,
              stars10Q: starVal,
              bestSprint: 0,
              solvedSprint: 0,
              medalSprint: 'none'
            };
            migXp += estScore;
          });
          bitmasterState.xp = Math.max(migXp, Number(data.xp) || 0);
        }
      }
    } catch (e) {
      console.warn("Could not load BitMaster save:", e);
    }
  }

  function saveBitmasterProgress() {
    try {
      let totalXp = 0;
      Object.values(bitmasterState.levelRecords).forEach(rec => {
        totalXp += (Number(rec.best10Q) || 0) + (Number(rec.bestSprint) || 0);
      });
      bitmasterState.xp = totalXp;

      localStorage.setItem('bitmaster_save_v2', JSON.stringify({
        xp: bitmasterState.xp,
        stars: bitmasterState.stars,
        levelRecords: bitmasterState.levelRecords
      }));
    } catch (e) {
      console.warn("Could not write BitMaster save:", e);
    }
  }

  function calculateBitmasterStars() {
    return Object.values(bitmasterState.stars).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }

  function getRankForXp(xp) {
    let rank = BITMASTER_RANKS[0];
    let rankIdx = 0;
    for (let i = 0; i < BITMASTER_RANKS.length; i++) {
      if (xp >= BITMASTER_RANKS[i].minXp) {
        rank = BITMASTER_RANKS[i];
        rankIdx = i;
      }
    }
    return { ...rank, id: rankIdx + 1, index: rankIdx };
  }

  function getNextRankForXp(xp) {
    for (let i = 0; i < BITMASTER_RANKS.length; i++) {
      if (xp < BITMASTER_RANKS[i].minXp) {
        return { ...BITMASTER_RANKS[i], id: i + 1, index: i };
      }
    }
    return null;
  }

  function getCurrentBitmasterRank() {
    return getRankForXp(bitmasterState.xp);
  }

  function getNextBitmasterRank() {
    return getNextRankForXp(bitmasterState.xp);
  }

  function updateBitmasterHUD(suppressModal = false) {
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
    if (avatarEl) avatarEl.innerHTML = getBitmasterAvatarHTML(rank, 'hud-avatar');
    if (rankTitleEl) rankTitleEl.textContent = rank.title;

    if (nextRank) {
      const prevXp = rank.minXp;
      const targetXp = nextRank.minXp;
      const progress = Math.min(100, Math.max(0, Math.round(((bitmasterState.xp - prevXp) / (targetXp - prevXp)) * 100)));
      if (xpLabelEl) xpLabelEl.textContent = `${bitmasterState.xp.toLocaleString()} / ${targetXp.toLocaleString()} pts`;
      if (xpBarFillEl) xpBarFillEl.style.width = `${progress}%`;
    } else {
      if (xpLabelEl) xpLabelEl.textContent = `${bitmasterState.xp.toLocaleString()} pts • Maximum Rank`;
      if (xpBarFillEl) xpBarFillEl.style.width = '100%';
    }

    // Update Title Screen preview stats if present
    const titleHeroChip = document.getElementById('bitmasterTitleHeroChip');
    const titleRankEl = document.getElementById('bitmasterTitleRankName');
    const titleStarsEl = document.getElementById('bitmasterTitleStarsCount');
    const titleXpEl = document.getElementById('bitmasterTitleXpCount');
    if (titleHeroChip) titleHeroChip.innerHTML = getBitmasterAvatarHTML(rank, 'title-hero-avatar');
    if (titleRankEl) titleRankEl.textContent = rank.title;
    const maxPossibleStars = BITMASTER_STAGES.reduce((acc, s) => acc + s.levels.length * 3, 0);
    if (titleStarsEl) titleStarsEl.textContent = `${totalStars} / ${maxPossibleStars} ⭐`;
    if (titleXpEl) titleXpEl.textContent = `${bitmasterState.xp.toLocaleString()} pts`;
    renderBitmasterFrontTopics();
    renderBitmasterSuggestedLevel();

    // Check rank promotion / level-up event
    const storedLastRank = Number(localStorage.getItem('bitmaster_last_notified_rank') || '1');
    if (!bitmasterState.lastNotifiedRankId) {
      bitmasterState.lastNotifiedRankId = storedLastRank;
    }
    if (!suppressModal && rank.id > bitmasterState.lastNotifiedRankId) {
      bitmasterState.lastNotifiedRankId = rank.id;
      localStorage.setItem('bitmaster_last_notified_rank', String(rank.id));
      showBitmasterLevelUpModal(rank);
    }
  }

  function showBitmasterScreen(screenName, isHistoryNav = false) {
    const screens = {
      title: document.getElementById('bitmasterScreenTitle'),
      stages: document.getElementById('bitmasterScreenStages'),
      levels: document.getElementById('bitmasterScreenLevels'),
      game: document.getElementById('bitmasterScreenGame'),
      summary: document.getElementById('bitmasterScreenSummary'),
      bitcross: document.getElementById('bitmasterScreenBitCross'),
      bitpop: document.getElementById('bitmasterScreenBitPop')
    };

    Object.values(screens).forEach(s => {
      if (s) {
        s.classList.remove('active');
        s.style.display = 'none';
      }
    });

    const backBtn = document.getElementById('bitmasterHudBackBtn');
    const backText = document.getElementById('bitmasterHudBackText');

    if (screenName === 'title') {
      if (screens.title) {
        screens.title.classList.add('active');
        screens.title.style.display = 'block';
      }
      if (backBtn) backBtn.style.display = 'none';
      updateBitmasterHUD();
    } else if (screenName === 'stages') {
      if (screens.stages) {
        screens.stages.classList.add('active');
        screens.stages.style.display = 'block';
      }
      if (backBtn) {
        backBtn.style.display = 'inline-flex';
        if (backText) backText.textContent = 'Topics';
      }
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
    } else if (screenName === 'bitcross') {
      if (screens.bitcross) {
        screens.bitcross.classList.add('active');
        screens.bitcross.style.display = 'block';
      }
      if (backBtn) {
        backBtn.style.display = 'inline-flex';
        if (backText) backText.textContent = 'Arcade';
      }
    } else if (screenName === 'bitpop') {
      if (screens.bitpop) {
        screens.bitpop.classList.add('active');
        screens.bitpop.style.display = 'block';
      }
      if (backBtn) {
        backBtn.style.display = 'inline-flex';
        if (backText) backText.textContent = 'Arcade';
      }
    }

    if (!isHistoryNav && window.history && window.history.pushState) {
      try {
        window.history.pushState({ bitmasterApp: true, bitmasterScreen: screenName }, '');
      } catch (err) {}
    }
  }

  // Determine suggested next level (prioritizing 1-star levels, then first uncompleted 0-star level)
  function getSuggestedNextLevel() {
    let oneStarCandidate = null;
    let uncompletedCandidate = null;
    let twoStarCandidate = null;

    for (const stage of BITMASTER_STAGES) {
      for (const lvl of stage.levels) {
        const starKey = `s${stage.id}_l${lvl.id}`;
        const stars = bitmasterState.stars[starKey] || 0;
        if (stars === 1 && !oneStarCandidate) {
          oneStarCandidate = { stage, level: lvl, stars, reason: 'Improve to 3 Stars' };
        } else if (stars === 0 && !uncompletedCandidate) {
          uncompletedCandidate = { stage, level: lvl, stars, reason: 'Next Level' };
        } else if (stars === 2 && !twoStarCandidate) {
          twoStarCandidate = { stage, level: lvl, stars, reason: 'Improve to 3 Stars' };
        }
      }
    }

    return oneStarCandidate || uncompletedCandidate || twoStarCandidate || {
      stage: BITMASTER_STAGES[0],
      level: BITMASTER_STAGES[0].levels[0],
      stars: 3,
      reason: 'All Mastered - Replay'
    };
  }

  function renderBitmasterSuggestedLevel() {
    const cardContainer = document.getElementById('bitmasterSuggestedLevelCard');
    if (!cardContainer) return;

    const suggested = getSuggestedNextLevel();
    if (!suggested || !suggested.stage || !suggested.level) {
      cardContainer.style.display = 'none';
      return;
    }

    cardContainer.style.display = 'block';
    const stage = suggested.stage;
    const lvl = suggested.level;
    const topic = BITMASTER_TOPICS.find(t => t.id === stage.topicId) || BITMASTER_TOPICS[0];

    const starIcons = '★'.repeat(suggested.stars) + '☆'.repeat(3 - suggested.stars);

    cardContainer.innerHTML = `
      <div class="suggested-card-inner" style="--topic-accent: ${topic.accent}; --topic-glow: ${topic.glow};">
        <div class="suggested-card-left">
          <div class="suggested-badge-row">
            <span class="suggested-tag-pill">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:-1px; margin-right:4px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>RECOMMENDED
            </span>
            <span class="suggested-reason-pill">${suggested.reason}</span>
            <span class="suggested-stars-badge">${starIcons} (${suggested.stars}/3)</span>
          </div>
          <div class="suggested-title-row">
            <span class="suggested-stage-label">${stage.shortTitle}:</span>
            <span class="suggested-level-name">${lvl.name || lvl.title || 'Start'}</span>
          </div>
        </div>
        <button type="button" class="control-btn control-btn-primary suggested-action-btn">
          <span>Play Level</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    `;

    const playBtn = cardContainer.querySelector('.suggested-action-btn');
    const startHandler = (e) => {
      if (e) e.stopPropagation();
      playSynthSound('tap');
      bitmasterState.selectedStage = stage;
      bitmasterState.selectedLevel = lvl;
      bitmasterState.selectedTopicFilter = String(stage.topicId);
      startBitmasterRound(stage, lvl);
    };

    if (playBtn) playBtn.addEventListener('click', startHandler);
    cardContainer.onclick = startHandler;
  }

  // Render the 6 Big Bold Topic Buttons on the Front Menu (as sketched)
  function renderBitmasterFrontTopics() {
    const grid = document.getElementById('bitmasterFrontTopicsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    BITMASTER_TOPICS.forEach(topic => {
      const topicStages = BITMASTER_STAGES.filter(s => s.topicId === topic.id);
      let topicEarnedStars = 0;
      let topicMaxStars = 0;

      topicStages.forEach(s => {
        s.levels.forEach(lvl => {
          topicEarnedStars += (bitmasterState.stars[`s${s.id}_l${lvl.id}`] || 0);
          topicMaxStars += 3;
        });
      });

      const card = document.createElement('div');
      card.className = 'bitmaster-topic-card-btn';
      card.setAttribute('data-topic-id', topic.id);
      card.style.setProperty('--topic-accent', topic.accent);
      card.style.setProperty('--topic-glow', topic.glow);

      card.innerHTML = `
        <div class="topic-card-stars-pill">${topicEarnedStars}/${topicMaxStars} ⭐</div>
        <div class="topic-card-code-hero">${topic.heroCode}</div>
        <div class="topic-card-name">${topic.shortName}</div>
      `;

      card.addEventListener('click', () => {
        bitmasterState.selectedTopicFilter = String(topic.id);
        playSynthSound('tap');
        renderBitmasterStagesGrid();
        showBitmasterScreen('stages');
      });

      grid.appendChild(card);
    });
  }

  // Renders ONLY the stages for the currently selected topic (clean, uncluttered view)
  function renderBitmasterStagesGrid() {
    const grid = document.getElementById('bitmasterStagesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    let currentFilter = bitmasterState.selectedTopicFilter || '1';
    if (currentFilter === 'all') currentFilter = '1';

    // Identify active topic
    const activeTopic = BITMASTER_TOPICS.find(t => String(t.id) === String(currentFilter)) || BITMASTER_TOPICS[0];

    // Update topic title in the Stages screen header
    const topicTitleEl = document.getElementById('bitmasterStagesTopicTitle');
    if (topicTitleEl) {
      topicTitleEl.textContent = activeTopic.shortName;
      topicTitleEl.style.textShadow = `0 0 20px ${activeTopic.glow}`;
    }

    // Render stages for ONLY this topic (clean 3-4 cards!)
    const topicStages = BITMASTER_STAGES.filter(s => s.topicId === activeTopic.id);
    topicStages.forEach(stage => {
      let stageStars = 0;
      stage.levels.forEach(lvl => {
        stageStars += (bitmasterState.stars[`s${stage.id}_l${lvl.id}`] || 0);
      });
      const maxStars = stage.levels.length * 3;

      const card = document.createElement('div');
      card.className = 'bitmaster-stage-card';
      card.setAttribute('data-stage', stage.id);
      card.innerHTML = `
        <div class="stage-card-badge stage-badge-s${stage.id}">
          <span class="stage-card-icon">${stage.svgIcon}</span>
        </div>
        <div class="stage-card-info">
          <div class="stage-card-header-row">
            <span class="stage-card-tag">STAGE ${String(stage.id).padStart(2, '0')}</span>
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

    // Attach mode selector button handlers
    const btn10Q = document.getElementById('bitmasterModeBtn10Q');
    const btnSprint = document.getElementById('bitmasterModeBtnSprint');
    if (btn10Q && !btn10Q.dataset.bmBound) {
      btn10Q.dataset.bmBound = 'true';
      btn10Q.addEventListener('click', () => {
        bitmasterState.selectedGameMode = '10q';
        playSynthSound('tap');
        renderBitmasterLevelsScreen();
      });
    }
    if (btnSprint && !btnSprint.dataset.bmBound) {
      btnSprint.dataset.bmBound = 'true';
      btnSprint.addEventListener('click', () => {
        bitmasterState.selectedGameMode = 'sprint';
        playSynthSound('tap');
        renderBitmasterLevelsScreen();
      });
    }
    if (btn10Q) btn10Q.classList.toggle('active', bitmasterState.selectedGameMode === '10q');
    if (btnSprint) btnSprint.classList.toggle('active', bitmasterState.selectedGameMode === 'sprint');

    if (!listEl) return;
    listEl.innerHTML = '';

    const isSprintMode = (bitmasterState.selectedGameMode === 'sprint');

    stage.levels.forEach(lvl => {
      const lvlKey = `s${stage.id}_l${lvl.id}`;
      const record = bitmasterState.levelRecords[lvlKey] || {};

      let rightStatusHTML = '';
      if (isSprintMode) {
        const solved = record.solvedSprint || 0;
        const medal = record.medalSprint || 'none';
        let medalHTML = '';
        if (medal === 'gold' || solved >= 15) {
          medalHTML = `<span class="level-card-medal-badge gold">🥇 Gold (${solved})</span>`;
        } else if (medal === 'silver' || solved >= 10) {
          medalHTML = `<span class="level-card-medal-badge silver">🥈 Silver (${solved})</span>`;
        } else if (medal === 'bronze' || solved >= 6) {
          medalHTML = `<span class="level-card-medal-badge bronze">🥉 Bronze (${solved})</span>`;
        } else {
          medalHTML = `<span class="level-card-medal-badge unranked">Unranked</span>`;
        }
        const scorePill = record.bestSprint ? `<span class="level-card-score-pill">Best: ${record.bestSprint} pts</span>` : '';
        rightStatusHTML = `${scorePill}${medalHTML}`;
      } else {
        const starsEarned = record.stars10Q !== undefined ? record.stars10Q : (bitmasterState.stars[lvlKey] || 0);
        const starStr = '⭐'.repeat(starsEarned) + '☆'.repeat(3 - starsEarned);
        const scorePill = record.best10Q ? `<span class="level-card-score-pill">Best: ${record.best10Q} pts</span>` : '';
        rightStatusHTML = `${scorePill}<span class="level-card-stars">${starStr}</span>`;
      }

      const lvlCard = document.createElement('div');
      lvlCard.className = 'bitmaster-level-card';
      lvlCard.setAttribute('data-level', lvl.id);
      lvlCard.innerHTML = `
        <div class="level-card-info">
          <div class="level-card-title-row">
            <span class="level-card-name">Level ${lvl.id}: ${lvl.name}</span>
            <div style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
              ${rightStatusHTML}
            </div>
          </div>
          <div class="level-card-desc">${lvl.desc}</div>
        </div>
        <button class="control-btn control-btn-primary level-play-btn">
          START
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
  // BITMASTER QUESTION BIT STRIP COMPONENT BUILDER
  // =========================================================================

  function renderBitStripHTML({
    bits = null,
    weights = null,
    showWeights = true,
    targetIdx = -1,
    valuesAsWeights = false,
    targetChar = '?',
    variant = 'cyan'
  }) {
    const count = bits ? bits.length : (weights ? weights.length : 8);
    const isFour = count === 4;
    let html = `<div class="bm-bit-strip ${isFour ? 'bm-strip-4' : 'bm-strip-8'} bm-variant-${variant}">`;

    for (let i = 0; i < count; i++) {
      const isTarget = (i === targetIdx);
      const weightVal = weights ? weights[i] : null;
      const bitVal = bits ? bits[i] : null;

      let displayBoxVal = '';
      let boxClasses = ['bm-bit-rect'];

      if (valuesAsWeights) {
        if (isTarget) {
          displayBoxVal = targetChar;
          boxClasses.push('is-target');
        } else {
          displayBoxVal = weightVal !== null && weightVal !== undefined ? String(weightVal) : '';
        }
        if (variant === 'twos' && i === 0) {
          boxClasses.push('twos-msb');
        }
      } else {
        if (isTarget) {
          boxClasses.push('is-target');
          displayBoxVal = targetChar !== '?' ? targetChar : (bitVal !== null ? String(bitVal) : '?');
        } else {
          displayBoxVal = bitVal !== null ? String(bitVal) : '0';
          if (displayBoxVal === '1') {
            boxClasses.push('bit-1');
          } else if (displayBoxVal === '0') {
            boxClasses.push('bit-0');
          }
        }
        if (variant === 'twos' && i === 0) {
          boxClasses.push('twos-msb');
        }
      }

      html += `<div class="bm-bit-col">`;
      if (showWeights && weights && !valuesAsWeights) {
        const isWeightTarget = isTarget;
        const isTwosNeg = (variant === 'twos' && i === 0);
        const wLabel = String(weightVal);
        html += `<div class="bm-bit-weight-label ${isWeightTarget ? 'is-target' : ''} ${isTwosNeg ? 'is-twos-neg' : ''}">${wLabel}</div>`;
      } else if (valuesAsWeights && showWeights) {
        const posName = `Bit ${count - 1 - i}`;
        html += `<div class="bm-bit-weight-label ${isTarget ? 'is-target' : ''}">${posName}</div>`;
      }
      html += `<div class="${boxClasses.join(' ')}">${displayBoxVal}</div>`;
      html += `</div>`;
    }

    html += `</div>`;
    return html;
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
        effectiveMode = Math.random() > 0.5 ? 'place_val_nibble_missing' : 'place_val_byte_missing';
      } else if (stage.id === 2) {
        effectiveMode = Math.random() > 0.5 ? 'mc_nibble_bin2den_assisted' : 'mc_byte_bin2den_unassisted';
      } else if (stage.id === 3) {
        effectiveMode = Math.random() > 0.5 ? 'switches_nibble' : 'mixed_bin_den';
      } else if (stage.id === 4) {
        effectiveMode = Math.random() > 0.5 ? 'mc_hex_nibble_to_den' : 'mc_hex_byte';
      } else if (stage.id === 5) {
        const r = Math.random();
        effectiveMode = r < 0.33 ? 'hex_mixed_bin' : (r < 0.66 ? 'hex_mixed_den' : 'hex_tri_mixed');
      } else if (stage.id === 6) {
        effectiveMode = Math.random() > 0.5 ? 'math_add_simple' : 'math_add_8bit';
      } else if (stage.id === 7) {
        const r = Math.random();
        effectiveMode = r < 0.25 ? 'mc_twos_comp_sign' : (r < 0.5 ? 'twos_comp_nibble_missing' : (r < 0.75 ? 'twos_comp_nibbles' : 'twos_comp_byte_mastery'));
      } else if (stage.id === 8) {
        const r = Math.random();
        effectiveMode = r < 0.25
          ? 'math_sub_no_borrow_4bit'
          : (r < 0.5 ? 'math_sub_no_borrow_8bit' : (r < 0.75 ? 'sub_twos_comp_negate' : 'math_sub_twos_comp_grid'));
      } else if (stage.id === 9) {
        const r = Math.random();
        effectiveMode = r < 0.33 ? 'math_shift_flip' : (r < 0.66 ? 'mc_shift_left' : 'mc_shift_right');
      } else if (stage.id === 10) {
        const r = Math.random();
        effectiveMode = r < 0.33 ? 'units_fundamental' : (r < 0.66 ? 'units_conversions' : 'units_capacity');
      } else if (stage.id === 11) {
        const r = Math.random();
        effectiveMode = r < 0.33 ? 'blitz_conversions' : (r < 0.66 ? 'blitz_maths' : 'units_transmission');
      }
    }

    const fmtBin = (val, len) => val.toString(2).padStart(len, '0').split('').join(' ');

    // =========================================================================
    // STAGE 1: NIBBLE PLACE VALUES
    // =========================================================================
    if (effectiveMode === 'place_val_nibble_what' || effectiveMode === 'place_val_nibble_which') {
      const weights = [8, 4, 2, 1];
      const chosenIdx = Math.floor(Math.random() * 4);
      const targetVal = weights[chosenIdx];
      const bitNames = ['Bit 3', 'Bit 2', 'Bit 1', 'Bit 0'];
      const displayHTML = renderBitStripHTML({
        weights: weights,
        valuesAsWeights: true,
        targetIdx: chosenIdx,
        targetChar: String(targetVal),
        showWeights: true
      });
      const dists = weights.filter(w => w !== targetVal);
      return {
        type: 'mc',
        prompt: `What is the place value of the highlighted bit (${bitNames[chosenIdx]})?`,
        display: `[${weights.map((w, idx) => idx === chosenIdx ? w : '.').join(' ')}]`,
        displayHTML: displayHTML,
        hint: "4-bit nibble columns: Bit 3 (8), Bit 2 (4), Bit 1 (2), Bit 0 (1)",
        correctAnswer: String(targetVal),
        options: shuffleArray([targetVal, ...dists]).map(String)
      };
    }

    if (effectiveMode === 'place_val_nibble_missing') {
      const weights = [8, 4, 2, 1];
      const chosenIdx = Math.floor(Math.random() * 4);
      const targetVal = weights[chosenIdx];
      const displayHTML = renderBitStripHTML({
        weights: weights,
        valuesAsWeights: true,
        targetIdx: chosenIdx,
        targetChar: '?',
        showWeights: true
      });
      const dists = [16, 8, 4, 2, 1].filter(w => w !== targetVal).slice(0, 3);
      return {
        type: 'mc',
        prompt: "What is the missing place value marked with '?'?",
        display: weights.map((w, idx) => idx === chosenIdx ? '?' : w).join(' '),
        displayHTML: displayHTML,
        hint: "Place values double from right to left (1, 2, 4, 8)",
        correctAnswer: String(targetVal),
        options: shuffleArray([targetVal, ...dists]).map(String)
      };
    }

    if (effectiveMode === 'place_val_nibble_all_blank') {
      const weights = [8, 4, 2, 1];
      const chosenIdx = Math.floor(Math.random() * 4);
      const targetVal = weights[chosenIdx];
      const displayHTML = renderBitStripHTML({
        weights: ['', '', '', ''],
        valuesAsWeights: true,
        targetIdx: chosenIdx,
        targetChar: '?',
        showWeights: false
      });
      return {
        type: 'mc',
        prompt: "What is the place value of the highlighted bit marked with '?'?",
        display: "?",
        displayHTML: displayHTML,
        hint: "Remember the 4-bit weights from left to right: 8, 4, 2, 1",
        correctAnswer: String(targetVal),
        options: shuffleArray([8, 4, 2, 1]).map(String)
      };
    }

    if (effectiveMode === 'place_val_nibble_reverse_which_bit') {
      const weights = [8, 4, 2, 1];
      const bitNames = ['Bit 3', 'Bit 2', 'Bit 1', 'Bit 0'];
      const chosenIdx = Math.floor(Math.random() * 4);
      const targetVal = weights[chosenIdx];
      const targetBit = bitNames[chosenIdx];
      return {
        type: 'mc',
        layout: 'bit_boxes',
        prompt: `Which bit position has the place value ${targetVal}?`,
        display: `Place Value: ${targetVal}`,
        hint: "Bit 3 (8) • Bit 2 (4) • Bit 1 (2) • Bit 0 (1)",
        correctAnswer: targetBit,
        options: ['Bit 3', 'Bit 2', 'Bit 1', 'Bit 0']
      };
    }

    // =========================================================================
    // STAGE 2: BYTE PLACE VALUES
    // =========================================================================
    if (effectiveMode === 'place_val_byte_which' || effectiveMode === 'place_val_byte_what') {
      const byteWeights = [128, 64, 32, 16, 8, 4, 2, 1];
      const chosenIdx = Math.floor(Math.random() * 8);
      const targetVal = byteWeights[chosenIdx];
      const displayHTML = renderBitStripHTML({
        weights: byteWeights,
        valuesAsWeights: true,
        targetIdx: chosenIdx,
        targetChar: String(targetVal),
        showWeights: true
      });
      const otherWeights = byteWeights.filter(w => w !== targetVal);
      const dists = shuffleArray(otherWeights).slice(0, 3);
      return {
        type: 'mc',
        prompt: `What is the place value of Bit ${7 - chosenIdx}?`,
        display: `Bit ${7 - chosenIdx}`,
        displayHTML: displayHTML,
        hint: "8-bit weights: 128 • 64 • 32 • 16 • 8 • 4 • 2 • 1",
        correctAnswer: String(targetVal),
        options: shuffleArray([targetVal, ...dists]).map(String)
      };
    }

    if (effectiveMode === 'place_val_byte_missing') {
      const byteWeights = [128, 64, 32, 16, 8, 4, 2, 1];
      const chosenIdx = Math.floor(Math.random() * 8);
      const targetVal = byteWeights[chosenIdx];
      const displayHTML = renderBitStripHTML({
        weights: byteWeights,
        valuesAsWeights: true,
        targetIdx: chosenIdx,
        targetChar: '?',
        showWeights: true
      });
      const otherWeights = [256, 128, 64, 32, 16, 8, 4, 2, 1].filter(w => w !== targetVal);
      const dists = shuffleArray(otherWeights).slice(0, 3);
      return {
        type: 'mc',
        prompt: "What is the missing place value marked with '?' in this byte?",
        display: byteWeights.map((w, idx) => idx === chosenIdx ? '?' : w).join(' '),
        displayHTML: displayHTML,
        hint: "Each position doubles: 1, 2, 4, 8, 16, 32, 64, 128",
        correctAnswer: String(targetVal),
        options: shuffleArray([targetVal, ...dists]).map(String)
      };
    }

    if (effectiveMode === 'place_val_byte_all_blank') {
      const byteWeights = [128, 64, 32, 16, 8, 4, 2, 1];
      const chosenIdx = Math.floor(Math.random() * 8);
      const targetVal = byteWeights[chosenIdx];
      const displayHTML = renderBitStripHTML({
        weights: new Array(8).fill(''),
        valuesAsWeights: true,
        targetIdx: chosenIdx,
        targetChar: '?',
        showWeights: false
      });
      const dists = shuffleArray(byteWeights.filter(w => w !== targetVal)).slice(0, 3);
      return {
        type: 'mc',
        prompt: "What is the place value of the 8-bit position marked with '?'?",
        display: "?",
        displayHTML: displayHTML,
        hint: "Each position doubles right to left: 1, 2, 4, 8, 16, 32, 64, 128",
        correctAnswer: String(targetVal),
        options: shuffleArray([targetVal, ...dists]).map(String)
      };
    }

    if (effectiveMode === 'place_val_byte_reverse_which_bit') {
      const byteWeights = [128, 64, 32, 16, 8, 4, 2, 1];
      const bitNames = ['Bit 7', 'Bit 6', 'Bit 5', 'Bit 4', 'Bit 3', 'Bit 2', 'Bit 1', 'Bit 0'];
      const chosenIdx = Math.floor(Math.random() * 8);
      const targetVal = byteWeights[chosenIdx];
      const targetBit = bitNames[chosenIdx];
      return {
        type: 'mc',
        layout: 'bit_boxes',
        prompt: `Which bit position has the place value ${targetVal}?`,
        display: `Place Value: ${targetVal}`,
        hint: "Powers of 2: 2⁰=1, 2¹=2, 2²=4, 2³=8, 2⁴=16, 2⁵=32, 2⁶=64, 2⁷=128",
        correctAnswer: targetBit,
        options: bitNames
      };
    }

    // =========================================================================
    // STAGE 3: DENARY TO BINARY (SWAPPED)
    // =========================================================================
    if (effectiveMode === 'switches_nibble_assisted' || effectiveMode === 'switches_nibble') {
      const val = Math.floor(Math.random() * 15) + 1;
      return {
        type: 'switches',
        bitsCount: 4,
        blind: false,
        prompt: `Assemble Denary ${val} with 4-Bit Switches:`,
        display: String(val),
        hint: "Toggle bits (8, 4, 2, 1) to match total",
        correctAnswer: val
      };
    }

    if (effectiveMode === 'switches_nibble_unassisted') {
      const val = Math.floor(Math.random() * 15) + 1;
      return {
        type: 'switches',
        bitsCount: 4,
        blind: true,
        prompt: `Assemble Denary ${val} with 4-Bit Switches (No Total Helper):`,
        display: String(val),
        hint: "Mentally sum your active bits (8, 4, 2, 1)",
        correctAnswer: val
      };
    }

    if (effectiveMode === 'switches_byte_assisted' || effectiveMode === 'switches_byte') {
      const val = Math.floor(Math.random() * 254) + 1;
      return {
        type: 'switches',
        bitsCount: 8,
        blind: false,
        prompt: `Assemble Denary ${val} with 8-Bit Switches:`,
        display: String(val),
        hint: "Toggle bits (128..1) to match the target value",
        correctAnswer: val
      };
    }

    if (effectiveMode === 'switches_byte_unassisted') {
      const val = Math.floor(Math.random() * 254) + 1;
      return {
        type: 'switches',
        bitsCount: 8,
        blind: true,
        prompt: `Assemble Denary ${val} with 8-Bit Switches (No Total Helper):`,
        display: String(val),
        hint: "Subtract highest powers of 2 (128, 64, 32, 16, 8, 4, 2, 1)",
        correctAnswer: val
      };
    }

    // =========================================================================
    // STAGE 4: BINARY TO DENARY (SWAPPED)
    // =========================================================================
    if (effectiveMode === 'mc_nibble_bin2den_assisted') {
      const val = Math.floor(Math.random() * 16);
      const binBits = val.toString(2).padStart(4, '0').split('').map(Number);
      const dists = generateDistractors(val, 0, 15, 'denary');
      const displayHTML = renderBitStripHTML({
        bits: binBits,
        weights: [8, 4, 2, 1],
        showWeights: true
      });
      return {
        type: 'mc',
        prompt: "Convert 4-Bit Binary to Denary:",
        display: binBits.join(' '),
        displayHTML: displayHTML,
        hint: "Weights 8 • 4 • 2 • 1",
        correctAnswer: String(val),
        options: shuffleArray([val, ...dists]).map(String)
      };
    }

    if (effectiveMode === 'mc_nibble_bin2den_unassisted' || effectiveMode === 'mc_nibble_bin2den') {
      const val = Math.floor(Math.random() * 16);
      const binBits = val.toString(2).padStart(4, '0').split('').map(Number);
      const dists = generateDistractors(val, 0, 15, 'denary');
      const displayHTML = renderBitStripHTML({
        bits: binBits,
        showWeights: false
      });
      return {
        type: 'mc',
        prompt: "Convert 4-Bit Binary to Denary (Unassisted):",
        display: binBits.join(' '),
        displayHTML: displayHTML,
        hint: "Mental conversion (8 • 4 • 2 • 1)",
        correctAnswer: String(val),
        options: shuffleArray([val, ...dists]).map(String)
      };
    }

    if (effectiveMode === 'mc_byte_bin2den_assisted') {
      const val = Math.floor(Math.random() * 127) + 1;
      const binBits = val.toString(2).padStart(8, '0').split('').map(Number);
      const dists = generateDistractors(val, 0, 255, 'denary');
      const displayHTML = renderBitStripHTML({
        bits: binBits,
        weights: [128, 64, 32, 16, 8, 4, 2, 1],
        showWeights: true
      });
      return {
        type: 'mc',
        prompt: "Convert 8-Bit Binary to Denary (Weights Shown):",
        display: `${binBits.slice(0, 4).join('')} ${binBits.slice(4).join('')}`,
        displayHTML: displayHTML,
        hint: "Weights 128..1 shown above bits",
        correctAnswer: String(val),
        options: shuffleArray([val, ...dists]).map(String)
      };
    }

    if (effectiveMode === 'mc_byte_bin2den_unassisted') {
      const val = Math.floor(Math.random() * 256);
      const binBits = val.toString(2).padStart(8, '0').split('').map(Number);
      const dists = generateDistractors(val, 0, 255, 'denary');
      const displayHTML = renderBitStripHTML({
        bits: binBits,
        showWeights: false
      });
      return {
        type: 'mc',
        prompt: "Convert 8-Bit Byte to Denary (No Hints):",
        display: `${binBits.slice(0, 4).join('')} ${binBits.slice(4).join('')}`,
        displayHTML: displayHTML,
        hint: "Mental calculation: 128 down to 1",
        correctAnswer: String(val),
        options: shuffleArray([val, ...dists]).map(String)
      };
    }

    if (effectiveMode === 'mixed_bin_den') {
      const isDenToBin = Math.random() > 0.5;
      if (isDenToBin) {
        const val = Math.floor(Math.random() * 128) + 1;
        return {
          type: 'switches',
          bitsCount: 8,
          blind: false,
          prompt: `Assemble Denary ${val} with 8-Bit Switches:`,
          display: String(val),
          hint: "Toggle bits (128..1) to add up to target total",
          correctAnswer: val
        };
      } else {
        const val = Math.floor(Math.random() * 128) + 1;
        const binStr = fmtBin(val, 8);
        const dists = generateDistractors(val, 0, 255, 'denary');
        return {
          type: 'mc',
          prompt: "Convert 8-Bit Binary to Denary:",
          display: binStr,
          hint: "Sum active place values (128..1)",
          correctAnswer: String(val),
          options: shuffleArray([val, ...dists]).map(String)
        };
      }
    }

    // =========================================================================
    // STAGE 5: HEXADECIMAL (HEX TO BINARY)
    // =========================================================================
    if (effectiveMode === 'hex_nibble_flip_assisted' || effectiveMode === 'hex_nibble_flip') {
      const val = Math.floor(Math.random() * 16);
      const hex = val.toString(16).toUpperCase();
      const binStr = val.toString(2).padStart(4, '0');
      return {
        type: 'hex_nibbles',
        nibblesCount: 1,
        showLiveHex: true,
        showDenaryHint: true,
        hexDigits: [hex],
        hexDenaryValues: [val],
        prompt: "Convert the Following Hex Digit to Binary",
        display: `0x${hex}`,
        hint: "",
        correctBinary: binStr,
        correctAnswer: binStr
      };
    }

    if (effectiveMode === 'hex_nibble_flip_unassisted') {
      const val = Math.floor(Math.random() * 16);
      const hex = val.toString(16).toUpperCase();
      const binStr = val.toString(2).padStart(4, '0');
      return {
        type: 'hex_nibbles',
        nibblesCount: 1,
        showLiveHex: false,
        showDenaryHint: false,
        hexDigits: [hex],
        hexDenaryValues: [val],
        prompt: "Convert the Following Hex Digit to Binary",
        display: `0x${hex}`,
        hint: "",
        correctBinary: binStr,
        correctAnswer: binStr
      };
    }

    if (effectiveMode === 'hex_byte_flip_assisted' || effectiveMode === 'hex_byte_flip') {
      const highVal = Math.floor(Math.random() * 16);
      const lowVal = Math.floor(Math.random() * 16);
      const highHex = highVal.toString(16).toUpperCase();
      const lowHex = lowVal.toString(16).toUpperCase();
      const fullHex = highHex + lowHex;
      const fullBin = highVal.toString(2).padStart(4, '0') + lowVal.toString(2).padStart(4, '0');
      return {
        type: 'hex_nibbles',
        nibblesCount: 2,
        showLiveHex: true,
        showDenaryHint: true,
        hexDigits: [highHex, lowHex],
        hexDenaryValues: [highVal, lowVal],
        prompt: "Convert the Following Hex Byte to Binary",
        display: `0x${fullHex}`,
        hint: "",
        correctBinary: fullBin,
        correctAnswer: fullBin
      };
    }

    if (effectiveMode === 'hex_byte_flip_unassisted') {
      const highVal = Math.floor(Math.random() * 16);
      const lowVal = Math.floor(Math.random() * 16);
      const highHex = highVal.toString(16).toUpperCase();
      const lowHex = lowVal.toString(16).toUpperCase();
      const fullHex = highHex + lowHex;
      const fullBin = highVal.toString(2).padStart(4, '0') + lowVal.toString(2).padStart(4, '0');
      return {
        type: 'hex_nibbles',
        nibblesCount: 2,
        showLiveHex: false,
        showDenaryHint: false,
        hexDigits: [highHex, lowHex],
        hexDenaryValues: [highVal, lowVal],
        prompt: "Convert the Following Hex Byte to Binary",
        display: `0x${fullHex}`,
        hint: "",
        correctBinary: fullBin,
        correctAnswer: fullBin
      };
    }

    // =========================================================================
    // STAGE 6: HEXADECIMAL TO DENARY (NEW STAGE)
    // =========================================================================
    if (effectiveMode === 'mc_hex_nibble_to_den_assisted' || effectiveMode === 'mc_hex_nibble_to_den') {
      const val = Math.floor(Math.random() * 16);
      const hex = val.toString(16).toUpperCase();
      const dists = generateDistractors(val, 0, 15, 'denary');
      const options = shuffleArray([val, ...dists]);
      return {
        type: 'mc',
        prompt: `Convert Hex 0x${hex} to Denary:`,
        display: `0x${hex}`,
        hint: "Remember: 0x0..0x9 = 0..9, 0xA=10, 0xB=11, 0xC=12, 0xD=13, 0xE=14, 0xF=15",
        correctAnswer: String(val),
        options: options.map(String)
      };
    }

    if (effectiveMode === 'mc_hex_nibble_to_den_unassisted') {
      const val = Math.floor(Math.random() * 16);
      const hex = val.toString(16).toUpperCase();
      const dists = generateDistractors(val, 0, 15, 'denary');
      const options = shuffleArray([val, ...dists]);
      return {
        type: 'mc',
        prompt: `Convert Hex 0x${hex} to Denary (Mental Recall):`,
        display: `0x${hex}`,
        hint: "Direct recall (0x0 to 0xF)",
        correctAnswer: String(val),
        options: options.map(String)
      };
    }

    if (effectiveMode === 'mc_hex_byte_assisted' || effectiveMode === 'mc_hex_byte') {
      const val = Math.floor(Math.random() * 256);
      const hex = val.toString(16).toUpperCase().padStart(2, '0');
      const highVal = parseInt(hex[0], 16);
      const lowVal = parseInt(hex[1], 16);
      const dists = generateDistractors(val, 0, 255, 'denary');
      const options = shuffleArray([val, ...dists]);
      return {
        type: 'mc',
        prompt: `Convert Hex 0x${hex} to Denary:`,
        display: `0x${hex}`,
        hint: `Calculation: (${highVal} × 16) + ${lowVal} = ${val}`,
        correctAnswer: String(val),
        options: options.map(String)
      };
    }

    if (effectiveMode === 'mc_hex_byte_unassisted') {
      const val = Math.floor(Math.random() * 256);
      const hex = val.toString(16).toUpperCase().padStart(2, '0');
      const dists = generateDistractors(val, 0, 255, 'denary');
      const options = shuffleArray([val, ...dists]);
      return {
        type: 'mc',
        prompt: `Convert Hex 0x${hex} to Denary (Unassisted):`,
        display: `0x${hex}`,
        hint: "High digit × 16 + Low digit",
        correctAnswer: String(val),
        options: options.map(String)
      };
    }

    if (effectiveMode === 'mc_den_to_hex') {
      const val = Math.floor(Math.random() * 256);
      const hex = '0x' + val.toString(16).toUpperCase().padStart(2, '0');
      const rawDists = generateDistractors(val.toString(16).toUpperCase().padStart(2, '0'), 0, 255, 'hex');
      const dists = rawDists.map(h => '0x' + h.padStart(2, '0'));
      return {
        type: 'mc',
        prompt: `Convert Denary ${val} to Hexadecimal:`,
        display: String(val),
        hint: "Divide by 16 for high digit, remainder is low digit",
        correctAnswer: hex,
        options: shuffleArray([hex, ...dists]).map(String)
      };
    }

    if (effectiveMode === 'mc_hex_nibble_to_den') {
      const val = Math.floor(Math.random() * 16);
      const hex = val.toString(16).toUpperCase();
      const dists = generateDistractors(val, 0, 15, 'denary');
      const options = shuffleArray([val, ...dists]);
      return {
        type: 'mc',
        prompt: `Convert Hex 0x${hex} to Denary:`,
        display: `0x${hex}`,
        hint: "Remember: 0x0..0x9 = 0..9, 0xA=10, 0xB=11, 0xC=12, 0xD=13, 0xE=14, 0xF=15",
        correctAnswer: String(val),
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
        hint: "High nibble × 16 + Low nibble",
        correctAnswer: String(val),
        options: options.map(String)
      };
    }

    // =========================================================================
    // STAGE 5: HEXADECIMAL MASTER (WITH 0x NOTATION)
    // =========================================================================
    if (effectiveMode === 'hex_mixed_bin') {
      const isHexToBin = Math.random() > 0.5;
      if (isHexToBin) {
        const val = Math.floor(Math.random() * 256);
        const hex = val.toString(16).toUpperCase().padStart(2, '0');
        const binStr = val.toString(2).padStart(8, '0');
        const dists = generateDistractors(binStr, 0, 255, 'binary');
        return {
          type: 'mc',
          prompt: `Convert Hex 0x${hex} to 8-Bit Binary:`,
          display: `0x${hex}`,
          hint: "Convert left digit (×16) and right digit (×1) into two 4-bit nibbles",
          correctAnswer: binStr,
          options: shuffleArray([binStr, ...dists]).map(String)
        };
      } else {
        const val = Math.floor(Math.random() * 256);
        const hex = '0x' + val.toString(16).toUpperCase().padStart(2, '0');
        const binStr = fmtBin(val, 8);
        const rawDists = generateDistractors(val.toString(16).toUpperCase().padStart(2, '0'), 0, 255, 'hex');
        const dists = rawDists.map(h => '0x' + h.padStart(2, '0'));
        return {
          type: 'mc',
          prompt: "Convert 8-Bit Binary to Hexadecimal:",
          display: binStr,
          hint: "Split into two 4-bit nibbles, convert each nibble to hex (0x0..0xF)",
          correctAnswer: hex,
          options: shuffleArray([hex, ...dists]).map(String)
        };
      }
    }

    if (effectiveMode === 'hex_mixed_den') {
      const isHexToDen = Math.random() > 0.5;
      if (isHexToDen) {
        const val = Math.floor(Math.random() * 256);
        const hex = '0x' + val.toString(16).toUpperCase().padStart(2, '0');
        const dists = generateDistractors(val, 0, 255, 'denary');
        return {
          type: 'mc',
          prompt: `Convert Hex ${hex} to Denary:`,
          display: hex,
          hint: "(High nibble × 16) + Low nibble",
          correctAnswer: String(val),
          options: shuffleArray([val, ...dists]).map(String)
        };
      } else {
        const val = Math.floor(Math.random() * 256);
        const hex = '0x' + val.toString(16).toUpperCase().padStart(2, '0');
        const rawDists = generateDistractors(val.toString(16).toUpperCase().padStart(2, '0'), 0, 255, 'hex');
        const dists = rawDists.map(h => '0x' + h.padStart(2, '0'));
        return {
          type: 'mc',
          prompt: `Convert Denary ${val} to Hexadecimal:`,
          display: String(val),
          hint: "Divide by 16 for high digit, remainder for low digit",
          correctAnswer: hex,
          options: shuffleArray([hex, ...dists]).map(String)
        };
      }
    }

    if (effectiveMode === 'hex_tri_mixed') {
      const r = Math.random();
      if (r < 0.33) {
        const val = Math.floor(Math.random() * 256);
        const hex = '0x' + val.toString(16).toUpperCase().padStart(2, '0');
        const dists = generateDistractors(val, 0, 255, 'denary');
        return {
          type: 'mc',
          prompt: `Tri-Master: Convert Hex ${hex} to Denary:`,
          display: hex,
          hint: "(High nibble × 16) + Low nibble",
          correctAnswer: String(val),
          options: shuffleArray([val, ...dists]).map(String)
        };
      } else if (r < 0.66) {
        const val = Math.floor(Math.random() * 256);
        const hex = '0x' + val.toString(16).toUpperCase().padStart(2, '0');
        const rawDists = generateDistractors(val.toString(16).toUpperCase().padStart(2, '0'), 0, 255, 'hex');
        const dists = rawDists.map(h => '0x' + h.padStart(2, '0'));
        return {
          type: 'mc',
          prompt: `Tri-Master: Convert Denary ${val} to Hex:`,
          display: String(val),
          hint: "Divide by 16 for high digit, remainder for low digit",
          correctAnswer: hex,
          options: shuffleArray([hex, ...dists]).map(String)
        };
      } else {
        const val = Math.floor(Math.random() * 256);
        const hex = '0x' + val.toString(16).toUpperCase().padStart(2, '0');
        const binStr = fmtBin(val, 8);
        const rawDists = generateDistractors(val.toString(16).toUpperCase().padStart(2, '0'), 0, 255, 'hex');
        const dists = rawDists.map(h => '0x' + h.padStart(2, '0'));
        return {
          type: 'mc',
          prompt: "Tri-Master: Convert Binary to Hex:",
          display: binStr,
          hint: "Split into two 4-bit nibbles (8 4 2 1 each)",
          correctAnswer: hex,
          options: shuffleArray([hex, ...dists]).map(String)
        };
      }
    }

    // =========================================================================
    // STAGE 6: BINARY ADDITION (NO OVERFLOW STARTER + COLUMN CARRIES)
    // =========================================================================
    if (effectiveMode === 'math_add_no_overflow') {
      const pairs = [[0, 0], [1, 0], [0, 1]];
      let bitsA = [];
      let bitsB = [];
      for (let i = 0; i < 4; i++) {
        const pair = pairs[Math.floor(Math.random() * pairs.length)];
        bitsA.push(pair[0]);
        bitsB.push(pair[1]);
      }
      if (bitsA.every(b => b === 0) && bitsB.every(b => b === 0)) {
        bitsA[3] = 1;
      }
      const a = parseInt(bitsA.join(''), 2);
      const b = parseInt(bitsB.join(''), 2);
      const sum = a + b;
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
        prompt: `Starter Addition (No Carries): Add Columns:`,
        display: `${a} + ${b}`,
        hint: "No carries needed! 0+0=0, 0+1=1, 1+0=1. Flip result bits and submit!"
      };
    }

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
        prompt: `Add 4-Bit Binary Columns:`,
        display: `${a} + ${b}`,
        hint: `Place values: 8 • 4 • 2 • 1. Flip cells in Result row to 1 or 0, then submit!`
      };
    }

    if (effectiveMode === 'math_add_carries' || effectiveMode === 'math_add_8bit' || effectiveMode === 'mc_add_carries' || effectiveMode === 'mc_add_8bit' || effectiveMode === 'mc_add_overflow') {
      const a = Math.floor(Math.random() * 110) + 15;
      const b = Math.floor(Math.random() * 110) + 15;
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
        prompt: `Add 8-Bit Binary Columns:`,
        display: `${a} + ${b}`,
        hint: `Align columns (128..1). Remember: 1+1=0 carry 1, 1+1+1=1 carry 1`
      };
    }

    // Level 4: Unsigned Overflow Detection (Diagnose overflow when sum > 255)
    if (effectiveMode === 'math_add_overflow_detect') {
      const isOverflow = Math.random() < 0.5;
      let a, b, sum;
      if (isOverflow) {
        a = Math.floor(Math.random() * 80) + 140; // 140..220
        b = Math.floor(Math.random() * 70) + (256 - a + 1); // guarantees sum > 255
        sum = a + b;
      } else {
        a = Math.floor(Math.random() * 80) + 20; // 20..100
        b = Math.floor(Math.random() * (255 - a - 10)) + 5; // guarantees sum <= 255
        sum = a + b;
      }
      const binA = a.toString(2).padStart(8, '0');
      const binB = b.toString(2).padStart(8, '0');
      return {
        type: 'mc',
        prompt: `In an 8-bit unsigned register, does adding ${a} + ${b} trigger an OVERFLOW ERROR?`,
        display: `${a} + ${b} = ${sum}`,
        hint: `Maximum value an 8-bit unsigned register can hold is 255 (2⁸ − 1). Current sum: ${sum}`,
        correctAnswer: isOverflow ? "Yes (Sum > 255)" : "No (Sum ≤ 255)",
        options: ["Yes (Sum > 255)", "No (Sum ≤ 255)"]
      };
    }

    // =========================================================================
    // STAGE 9: TWO'S COMPLEMENT FOUNDATIONS (SIGN & CONCEPTS)
    // =========================================================================

    // Level 1: 4-Bit: Positive or Negative? (Labelled with bit strip weights)
    if (effectiveMode === 'twos_comp_sign_nibble') {
      const isNegative = Math.random() < 0.5;
      const msb = isNegative ? 1 : 0;
      const b1 = Math.random() < 0.5 ? 1 : 0;
      const b2 = Math.random() < 0.5 ? 1 : 0;
      const b3 = Math.random() < 0.5 ? 1 : 0;
      const bits = [msb, b1, b2, b3];
      const denary = (-8 * msb) + (4 * b1) + (2 * b2) + (1 * b3);
      const displayHTML = renderBitStripHTML({
        bits: bits,
        weights: [-8, 4, 2, 1],
        showWeights: true,
        targetIdx: 0,
        variant: 'twos'
      });
      return {
        type: 'mc',
        prompt: "Is this 4-bit Two's Complement number positive or negative?",
        display: bits.join(' '),
        displayHTML: displayHTML,
        hint: "Look at the sign bit (MSB, worth −8): 0 = Positive (≥ 0), 1 = Negative (< 0)",
        correctAnswer: isNegative ? "Negative" : "Positive",
        options: ["Positive", "Negative"]
      };
    }

    // Level 2: 8-Bit: Positive or Negative? (Labelled with bit strip weights)
    if (effectiveMode === 'twos_comp_sign_byte') {
      const isNegative = Math.random() < 0.5;
      const msb = isNegative ? 1 : 0;
      const otherBits = Array.from({ length: 7 }, () => Math.random() < 0.5 ? 1 : 0);
      const bits = [msb, ...otherBits];
      const displayHTML = renderBitStripHTML({
        bits: bits,
        weights: [-128, 64, 32, 16, 8, 4, 2, 1],
        showWeights: true,
        targetIdx: 0,
        variant: 'twos'
      });
      return {
        type: 'mc',
        prompt: "Is this 8-bit Two's Complement byte positive or negative?",
        display: `${bits.slice(0, 4).join('')} ${bits.slice(4).join('')}`,
        displayHTML: displayHTML,
        hint: "Look at Bit 7 (MSB, worth −128): 0 = Positive, 1 = Negative",
        correctAnswer: isNegative ? "Negative" : "Positive",
        options: ["Positive", "Negative"]
      };
    }

    // Level 3: Rapid Sign Recall (Unassisted pure binary string)
    if (effectiveMode === 'twos_comp_sign_rapid') {
      const isNegative = Math.random() < 0.5;
      const is8Bit = Math.random() < 0.5;
      const len = is8Bit ? 8 : 4;
      const msb = isNegative ? 1 : 0;
      const otherBits = Array.from({ length: len - 1 }, () => Math.random() < 0.5 ? 1 : 0);
      const bits = [msb, ...otherBits];
      const binStr = is8Bit ? `${bits.slice(0, 4).join('')} ${bits.slice(4).join('')}` : bits.join(' ');
      return {
        type: 'mc',
        prompt: `Rapid Recall: Is this ${len}-bit pattern positive or negative?`,
        display: binStr,
        hint: "Instantly check the leftmost bit (MSB): 0 ➔ Positive • 1 ➔ Negative",
        correctAnswer: isNegative ? "Negative" : "Positive",
        options: ["Positive", "Negative"]
      };
    }

    // Level 4: Two's Complement Quiz (Core theory)
    if (effectiveMode === 'mc_twos_comp_sign') {
      const qPool = [
        {
          prompt: "In a 4-bit Two's Complement nibble, what is the place value of the leftmost bit (MSB)?",
          displayHTML: renderBitStripHTML({ weights: [-8, 4, 2, 1], valuesAsWeights: true, targetIdx: 0, targetChar: '-8', showWeights: true, variant: 'twos' }),
          display: "-8 4 2 1",
          hint: "The leftmost bit is negative in Two's Complement",
          correctAnswer: "-8",
          options: ["-8", "+8", "-7", "-1"]
        },
        {
          prompt: "In an 8-bit Two's Complement byte, what is the place value of the leftmost bit (MSB, Bit 7)?",
          displayHTML: renderBitStripHTML({ weights: [-128, 64, 32, 16, 8, 4, 2, 1], valuesAsWeights: true, targetIdx: 0, targetChar: '-128', showWeights: true, variant: 'twos' }),
          display: "-128 64 32 ...",
          hint: "Bit 7 represents -2⁷ = -128",
          correctAnswer: "-128",
          options: ["-128", "+128", "+127", "-127"]
        },
        {
          prompt: "In Two's Complement, what does a Most Significant Bit (MSB) of 1 indicate?",
          displayHTML: renderBitStripHTML({ bits: [1, 0, 1, 0], weights: [-8, 4, 2, 1], showWeights: true, targetIdx: 0, variant: 'twos' }),
          display: "MSB = 1",
          hint: "1 at the left means the negative weight is active",
          correctAnswer: "Negative number (< 0)",
          options: ["Negative number (< 0)", "Positive number (≥ 0)", "Overflow Error", "Even number"]
        },
        {
          prompt: "In Two's Complement, what does a Most Significant Bit (MSB) of 0 indicate?",
          displayHTML: renderBitStripHTML({ bits: [0, 1, 1, 0], weights: [-8, 4, 2, 1], showWeights: true, targetIdx: 0, variant: 'twos' }),
          display: "MSB = 0",
          hint: "0 at the left means no negative weight is applied",
          correctAnswer: "Positive number (≥ 0)",
          options: ["Positive number (≥ 0)", "Negative number (< 0)", "Odd number", "Fractional number"]
        },
        {
          prompt: "What is the full range of integer values for an 8-bit Two's Complement byte?",
          displayHTML: renderBitStripHTML({ weights: [-128, 64, 32, 16, 8, 4, 2, 1], valuesAsWeights: true, showWeights: true, variant: 'twos' }),
          display: "8-Bit Range",
          hint: "From −2⁷ up to +2⁷ − 1",
          correctAnswer: "-128 to +127",
          options: ["-128 to +127", "-127 to +127", "0 to 255", "-256 to +255"]
        },
        {
          prompt: "What is the full range of integer values for a 4-bit Two's Complement nibble?",
          displayHTML: renderBitStripHTML({ weights: [-8, 4, 2, 1], valuesAsWeights: true, showWeights: true, variant: 'twos' }),
          display: "4-Bit Range",
          hint: "From −2³ up to +2³ − 1",
          correctAnswer: "-8 to +7",
          options: ["-8 to +7", "-7 to +7", "0 to 15", "-16 to +15"]
        },
        {
          prompt: "Is this 8-bit Two's Complement pattern positive or negative?",
          displayHTML: renderBitStripHTML({ bits: [1, 0, 0, 1, 0, 1, 1, 0], weights: [-128, 64, 32, 16, 8, 4, 2, 1], showWeights: true, targetIdx: 0, variant: 'twos' }),
          display: "1001 0110",
          hint: "Check Bit 7 (MSB): 1 = negative, 0 = positive",
          correctAnswer: "Negative (MSB = 1)",
          options: ["Negative (MSB = 1)", "Positive (MSB = 0)", "Undefined Value", "Overflow Trap"]
        },
        {
          prompt: "Is this 8-bit Two's Complement pattern positive or negative?",
          displayHTML: renderBitStripHTML({ bits: [0, 1, 1, 1, 0, 0, 1, 1], weights: [-128, 64, 32, 16, 8, 4, 2, 1], showWeights: true, targetIdx: 0, variant: 'twos' }),
          display: "0111 0011",
          hint: "Check Bit 7 (MSB): 1 = negative, 0 = positive",
          correctAnswer: "Positive (MSB = 0)",
          options: ["Positive (MSB = 0)", "Negative (MSB = 1)", "Negative Zero", "Syntax Error"]
        },
        {
          prompt: "How many distinct representations of zero exist in Two's Complement?",
          displayHTML: renderBitStripHTML({ bits: [0, 0, 0, 0, 0, 0, 0, 0], weights: [-128, 64, 32, 16, 8, 4, 2, 1], showWeights: true, variant: 'twos' }),
          display: "0000 0000",
          hint: "Two's Complement solves the two-zero dilemma of Sign & Magnitude",
          correctAnswer: "Only 1 (00000000)",
          options: ["Only 1 (00000000)", "Two (+0 and -0)", "Eight", "None"]
        }
      ];
      const selected = qPool[Math.floor(Math.random() * qPool.length)];
      return {
        type: 'mc',
        prompt: selected.prompt,
        display: selected.display,
        displayHTML: selected.displayHTML,
        hint: selected.hint,
        correctAnswer: selected.correctAnswer,
        options: shuffleArray(selected.options)
      };
    }

    // =========================================================================
    // STAGE 10: CONVERTING TO TWO'S COMPLEMENT (INVERT & ADD 1)
    // =========================================================================

    // Level 1: 4-Bit Negation (Odd Numbers: LSB = 1, so inverted ends in 0, +1 turns LSB to 1)
    if (effectiveMode === 'twos_comp_negate_4bit_odd') {
      const oddCandidates = [1, 3, 5, 7];
      const posVal = oddCandidates[Math.floor(Math.random() * oddCandidates.length)];
      const negVal = -posVal;
      const posBits = posVal.toString(2).padStart(4, '0').split('').map(Number);
      const twosComp = (16 + negVal).toString(2).padStart(4, '0');

      return {
        type: 'switches',
        bitsCount: 4,
        isTwosComp: true,
        referenceBits: posBits,
        referenceLabel: `Positive Bits (+${posVal}):`,
        prompt: `Convert +${posVal} to −${posVal} in Two's Complement:`,
        display: `+${posVal} (${posBits.join('')})  ➔  −${posVal}`,
        hint: "Step 1: Invert all bits (0 ↔ 1) • Step 2: Add 1 (+1). Switch columns: −8 • 4 • 2 • 1",
        correctAnswer: negVal,
        targetBinary: twosComp
      };
    }

    // Level 2: 8-Bit Negation (Odd Numbers: LSB = 1)
    if (effectiveMode === 'twos_comp_negate_8bit_odd') {
      const oddCandidates = [1, 3, 5, 7, 9, 11, 13, 15, 17, 21, 25, 33, 45, 63, 77];
      const posVal = oddCandidates[Math.floor(Math.random() * oddCandidates.length)];
      const negVal = -posVal;
      const posBits = posVal.toString(2).padStart(8, '0').split('').map(Number);
      const twosComp = (256 + negVal).toString(2).padStart(8, '0');

      return {
        type: 'switches',
        bitsCount: 8,
        isTwosComp: true,
        referenceBits: posBits,
        referenceLabel: `Positive Bits (+${posVal}):`,
        prompt: `Convert +${posVal} to −${posVal} in Two's Complement:`,
        display: `+${posVal} (${posBits.slice(0, 4).join('')} ${posBits.slice(4).join('')})  ➔  −${posVal}`,
        hint: "Step 1: Invert all bits (0 ↔ 1) • Step 2: Add 1 (+1). Switch columns: −128 • 64 • 32 • 16 • 8 • 4 • 2 • 1",
        correctAnswer: negVal,
        targetBinary: twosComp
      };
    }

    // Level 3: 8-Bit Negation (Even Numbers: LSB = 0, so inverted ends in 1, +1 triggers carry!)
    if (effectiveMode === 'twos_comp_negate_8bit_even') {
      const evenCandidates = [2, 4, 6, 8, 10, 12, 14, 18, 24, 30, 40, 52, 64, 78];
      const posVal = evenCandidates[Math.floor(Math.random() * evenCandidates.length)];
      const negVal = -posVal;
      const posBits = posVal.toString(2).padStart(8, '0').split('').map(Number);
      const twosComp = (256 + negVal).toString(2).padStart(8, '0');

      return {
        type: 'switches',
        bitsCount: 8,
        isTwosComp: true,
        referenceBits: posBits,
        referenceLabel: `Positive Bits (+${posVal}):`,
        prompt: `Convert +${posVal} to −${posVal} in Two's Complement (With Carry):`,
        display: `+${posVal} (${posBits.slice(0, 4).join('')} ${posBits.slice(4).join('')})  ➔  −${posVal}`,
        hint: "Step 1: Invert all bits (0 ↔ 1) • Step 2: Add 1 (+1). Remember: 1 + 1 = 0 carry 1!",
        correctAnswer: negVal,
        targetBinary: twosComp
      };
    }

    // Level 4: Negation Mastery (Random 4-bit or 8-bit, odd or even, unassisted: blind = true)
    if (effectiveMode === 'twos_comp_negate_mastery') {
      const is4Bit = Math.random() < 0.4;
      if (is4Bit) {
        const posVal = Math.floor(Math.random() * 7) + 1; // 1..7
        const negVal = -posVal;
        const posBits = posVal.toString(2).padStart(4, '0').split('').map(Number);
        const twosComp = (16 + negVal).toString(2).padStart(4, '0');
        return {
          type: 'switches',
          bitsCount: 4,
          isTwosComp: true,
          blind: true,
          referenceBits: posBits,
          referenceLabel: `Positive Bits (+${posVal}):`,
          prompt: `Convert +${posVal} to −${posVal} in 4-bit Two's Complement (Unassisted):`,
          display: `+${posVal} (${posBits.join('')})  ➔  −${posVal}`,
          hint: "Step 1: Invert all bits (0 ↔ 1) • Step 2: Add 1 (+1)",
          correctAnswer: negVal,
          targetBinary: twosComp
        };
      } else {
        const posVal = Math.floor(Math.random() * 120) + 1; // 1..120
        const negVal = -posVal;
        const posBits = posVal.toString(2).padStart(8, '0').split('').map(Number);
        const twosComp = (256 + negVal).toString(2).padStart(8, '0');
        return {
          type: 'switches',
          bitsCount: 8,
          isTwosComp: true,
          blind: true,
          referenceBits: posBits,
          referenceLabel: `Positive Bits (+${posVal}):`,
          prompt: `Convert +${posVal} to −${posVal} in 8-bit Two's Complement (Unassisted):`,
          display: `+${posVal} (${posBits.slice(0, 4).join('')} ${posBits.slice(4).join('')})  ➔  −${posVal}`,
          hint: "Step 1: Invert all bits (0 ↔ 1) • Step 2: Add 1 (+1)",
          correctAnswer: negVal,
          targetBinary: twosComp
        };
      }
    }

    // Level 5: Negative to Positive (−X ➔ +X)
    // Hardware symmetry: Applying Invert & +1 to a negative Two's Complement pattern gives its positive magnitude!
    if (effectiveMode === 'twos_comp_neg_to_pos') {
      const is4Bit = Math.random() < 0.35;
      if (is4Bit) {
        const posVal = Math.floor(Math.random() * 7) + 1; // 1..7
        const negVal = -posVal;
        const negBits = (16 + negVal).toString(2).padStart(4, '0').split('').map(Number);
        const targetBin = posVal.toString(2).padStart(4, '0');
        return {
          type: 'switches',
          bitsCount: 4,
          isTwosComp: false, // Target is positive unsigned binary representation
          referenceBits: negBits,
          referenceLabel: `Negative Bits (−${posVal}):`,
          prompt: `Convert −${posVal} (${negBits.join('')}) to +${posVal}:`,
          display: `−${posVal} (${negBits.join('')})  ➔  +${posVal}`,
          hint: "The Two's Complement rule works both ways! Step 1: Invert all bits (0 ↔ 1) • Step 2: Add 1 (+1)",
          correctAnswer: posVal,
          targetBinary: targetBin
        };
      } else {
        const posVal = Math.floor(Math.random() * 125) + 1; // 1..125
        const negVal = -posVal;
        const negBits = (256 + negVal).toString(2).padStart(8, '0').split('').map(Number);
        const targetBin = posVal.toString(2).padStart(8, '0');
        return {
          type: 'switches',
          bitsCount: 8,
          isTwosComp: false, // Target is positive
          referenceBits: negBits,
          referenceLabel: `Negative Bits (−${posVal}):`,
          prompt: `Convert −${posVal} to +${posVal}:`,
          display: `−${posVal} (${negBits.slice(0, 4).join('')} ${negBits.slice(4).join('')})  ➔  +${posVal}`,
          hint: "The hardware rule is symmetric: Invert all bits (0 ↔ 1), then add 1 (+1) to find +X!",
          correctAnswer: posVal,
          targetBinary: targetBin
        };
      }
    }

    // =========================================================================
    // STAGE 11: TWO'S COMPLEMENT TO DENARY
    // =========================================================================

    // Level 1: 4-Bit to Denary (Assisted, weights −8, 4, 2, 1 shown above bits)
    if (effectiveMode === 'mc_twos_comp_nibble_assisted') {
      const candidates = [-8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
      const val = candidates[Math.floor(Math.random() * candidates.length)];
      const rawBin = (val < 0 ? (16 + val) : val).toString(2).padStart(4, '0');
      const bits = rawBin.split('').map(Number);
      const dists = generateDistractors(val, -8, 7, 'denary');
      const displayHTML = renderBitStripHTML({
        bits: bits,
        weights: [-8, 4, 2, 1],
        showWeights: true,
        variant: 'twos'
      });
      return {
        type: 'mc',
        prompt: "Convert 4-Bit Two's Complement to Denary:",
        display: bits.join(' '),
        displayHTML: displayHTML,
        hint: "Weight of Bit 3 is −8! Add active positive weights (+4, +2, +1)",
        correctAnswer: String(val),
        options: shuffleArray([val, ...dists]).map(String)
      };
    }

    // Level 2: 4-Bit to Denary (Unassisted, weights hidden)
    if (effectiveMode === 'mc_twos_comp_nibble_unassisted') {
      const candidates = [-8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7];
      const val = candidates[Math.floor(Math.random() * candidates.length)];
      const rawBin = (val < 0 ? (16 + val) : val).toString(2).padStart(4, '0');
      const bits = rawBin.split('').map(Number);
      const dists = generateDistractors(val, -8, 7, 'denary');
      const displayHTML = renderBitStripHTML({
        bits: bits,
        showWeights: false,
        variant: 'twos'
      });
      return {
        type: 'mc',
        prompt: "Convert 4-Bit Two's Complement to Denary (Mental Calculation):",
        display: bits.join(' '),
        displayHTML: displayHTML,
        hint: "Recall the 4-bit Two's Comp weights: −8 • 4 • 2 • 1",
        correctAnswer: String(val),
        options: shuffleArray([val, ...dists]).map(String)
      };
    }

    // Level 3: 8-Bit to Denary (Assisted, weights −128..1 shown above bits)
    if (effectiveMode === 'mc_twos_comp_byte_assisted') {
      const isNegative = Math.random() < 0.65;
      const val = isNegative ? -(Math.floor(Math.random() * 128) + 1) : Math.floor(Math.random() * 128);
      const rawBin = (val < 0 ? (256 + val) : val).toString(2).padStart(8, '0');
      const bits = rawBin.split('').map(Number);
      const dists = generateDistractors(val, -128, 127, 'denary');
      const displayHTML = renderBitStripHTML({
        bits: bits,
        weights: [-128, 64, 32, 16, 8, 4, 2, 1],
        showWeights: true,
        variant: 'twos'
      });
      return {
        type: 'mc',
        prompt: "Convert 8-Bit Two's Complement to Denary:",
        display: `${rawBin.slice(0, 4)} ${rawBin.slice(4)}`,
        displayHTML: displayHTML,
        hint: "Weight of Bit 7 is −128! Add active positive weights (64..1)",
        correctAnswer: String(val),
        options: shuffleArray([val, ...dists]).map(String)
      };
    }

    // Level 4: 8-Bit to Denary (Unassisted, weights hidden)
    if (effectiveMode === 'mc_twos_comp_byte_unassisted') {
      const isNegative = Math.random() < 0.7;
      const val = isNegative ? -(Math.floor(Math.random() * 128) + 1) : Math.floor(Math.random() * 128);
      const rawBin = (val < 0 ? (256 + val) : val).toString(2).padStart(8, '0');
      const bits = rawBin.split('').map(Number);
      const dists = generateDistractors(val, -128, 127, 'denary');
      const displayHTML = renderBitStripHTML({
        bits: bits,
        showWeights: false,
        variant: 'twos'
      });
      return {
        type: 'mc',
        prompt: "Convert 8-Bit Two's Complement to Denary (Mental Calculation):",
        display: `${rawBin.slice(0, 4)} ${rawBin.slice(4)}`,
        displayHTML: displayHTML,
        hint: "Bit 7 is −128. Add active positive columns (64, 32, 16, 8, 4, 2, 1)",
        correctAnswer: String(val),
        options: shuffleArray([val, ...dists]).map(String)
      };
    }

    // Level 5: Two's Complement 8-Bit Mastery (Mixed switches construction & mental MC)
    if (effectiveMode === 'twos_comp_byte_mastery') {
      const isSwitch = Math.random() > 0.5;
      if (isSwitch) {
        const candidates = [-12, -25, -35, -42, -55, -64, -75, -88, -100, -128, 45, 99];
        const val = candidates[Math.floor(Math.random() * candidates.length)];
        const targetBin = (val < 0 ? (256 + val) : val).toString(2).padStart(8, '0');
        return {
          type: 'switches',
          bitsCount: 8,
          isTwosComp: true,
          prompt: `Construct ${val} in 8-bit Two's Complement:`,
          display: `Target: ${val}`,
          hint: "MSB switch is worth −128! Add positive weights (64..1) to reach target",
          correctAnswer: val,
          targetBinary: targetBin
        };
      } else {
        const val = -(Math.floor(Math.random() * 120) + 1);
        const twosComp = (256 + val).toString(2).padStart(8, '0');
        const dists = generateDistractors(val, -128, -1, 'denary');
        const options = shuffleArray([val, ...dists]);
        const displayHTML = renderBitStripHTML({
          bits: twosComp.split('').map(Number),
          showWeights: false,
          variant: 'twos'
        });
        return {
          type: 'mc',
          prompt: "Interpret 8-Bit Two's Complement in Denary (Mental Calculation):",
          display: `${twosComp.slice(0, 4)} ${twosComp.slice(4)}`,
          displayHTML: displayHTML,
          hint: "Bit 7 is −128. Add active positive bits",
          correctAnswer: String(val),
          options: options.map(String)
        };
      }
    }

    // =========================================================================
    // STAGE 8: BINARY SUBTRACTION (4-BIT GRID, 8-BIT GRID, TWO'S COMP ADDITION)
    // =========================================================================
    if (effectiveMode === 'math_sub_no_borrow_4bit') {
      const allowedPairs = [[1, 0], [1, 1], [0, 0]];
      let bitsA, bitsB, a, b;
      let attempts = 0;
      do {
        bitsA = [];
        bitsB = [];
        for (let i = 0; i < 4; i++) {
          const pair = allowedPairs[Math.floor(Math.random() * allowedPairs.length)];
          bitsA.push(pair[0]);
          bitsB.push(pair[1]);
        }
        a = parseInt(bitsA.join(''), 2);
        b = parseInt(bitsB.join(''), 2);
        attempts++;
      } while ((a === 0 || b === 0 || a === b) && attempts < 100);

      if (a === 0 || b === 0 || a === b) {
        bitsA = [1, 1, 0, 1];
        bitsB = [0, 1, 0, 0];
        a = 13;
        b = 4;
      }

      const diff = a - b;
      const diffStr = diff.toString(2).padStart(4, '0');
      return {
        type: 'math_grid',
        numBits: 4,
        placeValues: [8, 4, 2, 1],
        operator: '−',
        valA: a,
        valB: b,
        bitsA: bitsA,
        bitsB: bitsB,
        correctAnswer: diffStr,
        prompt: `Starter Subtraction (No Borrows): Subtract Columns:`,
        display: `${a} − ${b}`,
        hint: `No borrows needed! 1−0=1, 1−1=0, 0−0=0. Flip Result bits and submit!`
      };
    }

    if (effectiveMode === 'math_sub_no_borrow_8bit') {
      const allowedPairs = [[1, 0], [1, 1], [0, 0], [1, 0]];
      let bitsA, bitsB, a, b;
      let attempts = 0;
      do {
        bitsA = [];
        bitsB = [];
        for (let i = 0; i < 8; i++) {
          const pair = allowedPairs[Math.floor(Math.random() * allowedPairs.length)];
          bitsA.push(pair[0]);
          bitsB.push(pair[1]);
        }
        a = parseInt(bitsA.join(''), 2);
        b = parseInt(bitsB.join(''), 2);
        attempts++;
      } while ((a < 30 || b === 0 || a === b) && attempts < 100);

      if (a < 30 || b === 0 || a === b) {
        bitsA = [1, 0, 1, 1, 0, 1, 1, 0];
        bitsB = [0, 0, 1, 0, 0, 1, 0, 0];
        a = 182;
        b = 36;
      }

      const diff = a - b;
      const diffStr = diff.toString(2).padStart(8, '0');
      return {
        type: 'math_grid',
        numBits: 8,
        placeValues: [128, 64, 32, 16, 8, 4, 2, 1],
        operator: '−',
        valA: a,
        valB: b,
        bitsA: bitsA,
        bitsB: bitsB,
        correctAnswer: diffStr,
        prompt: `8-Bit Subtraction (No Borrows): Subtract Columns:`,
        display: `${a} − ${b}`,
        hint: `Zero borrows required! Work column-by-column: 1−0=1, 1−1=0, 0−0=0. Flip Result bits to match!`
      };
    }

    // Unsigned Subtraction with single borrow (4-bit: 0 - 1 borrows from next column)
    if (effectiveMode === 'math_sub_with_borrows_4bit') {
      const candidates = [
        { a: 6, b: 1, bitsA: [0, 1, 1, 0], bitsB: [0, 0, 0, 1], diff: 5 },
        { a: 10, b: 3, bitsA: [1, 0, 1, 0], bitsB: [0, 0, 1, 1], diff: 7 },
        { a: 12, b: 5, bitsA: [1, 1, 0, 0], bitsB: [0, 1, 0, 1], diff: 7 },
        { a: 9, b: 2, bitsA: [1, 0, 0, 1], bitsB: [0, 0, 1, 0], diff: 7 },
        { a: 14, b: 6, bitsA: [1, 1, 1, 0], bitsB: [0, 1, 1, 0], diff: 8 }
      ];
      const item = candidates[Math.floor(Math.random() * candidates.length)];
      const diffStr = item.diff.toString(2).padStart(4, '0');
      return {
        type: 'math_grid',
        numBits: 4,
        placeValues: [8, 4, 2, 1],
        operator: '−',
        valA: item.a,
        valB: item.b,
        bitsA: item.bitsA,
        bitsB: item.bitsB,
        correctAnswer: diffStr,
        prompt: `Subtract 4-Bit Columns (With Borrow):`,
        display: `${item.a} − ${item.b}`,
        hint: "When subtracting 0 − 1, borrow 1 from the next higher column (2 − 1 = 1)!"
      };
    }

    // Unsigned Underflow Quiz
    if (effectiveMode === 'math_sub_underflow_quiz') {
      const qPool = [
        {
          prompt: "What happens if an 8-bit unsigned CPU register attempts to compute 5 − 12 without signed representation?",
          display: "5 − 12 (Unsigned)",
          hint: "Unsigned integers can only hold non-negative values from 0 up to 255",
          correctAnswer: "Underflow Error (Cannot represent negative values)",
          options: [
            "Underflow Error (Cannot represent negative values)",
            "The CPU converts automatically to decimal",
            "Result wraps to 0 without error",
            "Overflow trap to 255"
          ]
        },
        {
          prompt: "CPU Arithmetic Logic Unit",
          display: "Why do CPU ALUs use Two's Complement for subtraction?",
          isQuestionDisplay: true,
          hint: "Reusing the existing binary addition circuit saves millions of transistors",
          correctAnswer: "It allows subtraction using the exact same adder circuit: A + (−B)",
          options: [
            "It allows subtraction using the exact same adder circuit: A + (−B)",
            "Column borrowing is too fast for the clock speed",
            "Borrowing creates duplicate zeros",
            "Two's complement requires double the memory"
          ]
        }
      ];
      const selected = qPool[Math.floor(Math.random() * qPool.length)];
      return {
        type: 'mc',
        prompt: selected.prompt,
        display: selected.display,
        isQuestionDisplay: selected.isQuestionDisplay,
        hint: selected.hint,
        correctAnswer: selected.correctAnswer,
        options: shuffleArray(selected.options)
      };
    }

    // Hardware Subtraction Prep: Invert +B and add 1 to make -B
    if (effectiveMode === 'sub_twos_comp_negate') {
      const candidates = [4, 6, 9, 12, 15, 18, 24, 28, 35, 42, 50];
      const posVal = candidates[Math.floor(Math.random() * candidates.length)];
      const negVal = -posVal;
      const posBin = posVal.toString(2).padStart(8, '0');
      const posBinFmt = `${posBin.slice(0, 4)} ${posBin.slice(4)}`;
      const twosComp = (256 + negVal).toString(2).padStart(8, '0');

      return {
        type: 'switches',
        bitsCount: 8,
        isTwosComp: true,
        prompt: `Hardware Subtraction Prep: Convert +${posVal} (${posBinFmt}) to −${posVal} in Two's Complement:`,
        display: `+${posVal} (${posBinFmt})  ➔  −${posVal}`,
        hint: `Step 1: Invert all bits (0 ↔ 1) • Step 2: Add 1 (+1). Switch columns: −128 • 64 • 32 • 16 • 8 • 4 • 2 • 1`,
        correctAnswer: negVal,
        targetBinary: twosComp
      };
    }

    // Hardware Subtraction Grid: Flip Row B to (-B) Two's Complement, then add Row A + Row B
    if (effectiveMode === 'math_sub_twos_comp_grid') {
      const a = Math.floor(Math.random() * 66) + 25; // 25 to 90
      const b = Math.floor(Math.random() * Math.min(25, a - 5)) + 6; // 6 to ~30, guaranteed b < a
      const diff = a - b;
      const bitsA = a.toString(2).padStart(8, '0').split('').map(Number);
      const twosCompB = (256 - b).toString(2).padStart(8, '0');
      const diffBin = diff.toString(2).padStart(8, '0');

      return {
        type: 'math_grid',
        interactiveRowB: true,
        numBits: 8,
        placeValues: [128, 64, 32, 16, 8, 4, 2, 1],
        operator: '+',
        valA: a,
        valB: b,
        bitsA: bitsA,
        correctRowB: twosCompB,
        correctAnswer: diffBin,
        prompt: `Hardware Subtraction: Write −${b} in Row B (Two's Comp), then Add Row A + Row B:`,
        display: `${a} − ${b}  ➔  ${a} + (−${b})`,
        hint: `1. Flip Row B cells to make −${b} (invert +${b} and add 1) • 2. Add Row A + Row B into Result!`
      };
    }

    // Hardware Subtraction Rule: Drop final carry out
    if (effectiveMode === 'math_sub_drop_carry_quiz') {
      const qPool = [
        {
          prompt: "Hardware Subtraction Rules",
          display: "What happens to the 9th carry bit out of the MSB in A + (−B)?",
          isQuestionDisplay: true,
          hint: "When computing 15 + (-6), an end-around carry is generated into the 9th bit",
          correctAnswer: "It is discarded / ignored (the 8-bit result is correct)",
          options: [
            "It is discarded / ignored (the 8-bit result is correct)",
            "It triggers a fatal CPU crash",
            "It must be added back into the LSB",
            "It inverts the sign bit"
          ]
        },
        {
          prompt: "Hardware Subtraction Rules",
          display: "Why is an MSB carry out NOT an overflow in Two's Complement?",
          isQuestionDisplay: true,
          hint: "Adding opposite-signed numbers can never exceed the 8-bit signed range (-128 to +127)",
          correctAnswer: "Adding opposite-signed numbers can never exceed the 8-bit signed range",
          options: [
            "Adding opposite-signed numbers can never exceed the 8-bit signed range",
            "The CPU ALU has infinite bits",
            "Two's complement ignores all arithmetic",
            "Carry bits only apply to multiplication"
          ]
        }
      ];
      const selected = qPool[Math.floor(Math.random() * qPool.length)];
      return {
        type: 'mc',
        prompt: selected.prompt,
        display: selected.display,
        isQuestionDisplay: selected.isQuestionDisplay,
        hint: selected.hint,
        correctAnswer: selected.correctAnswer,
        options: shuffleArray(selected.options)
      };
    }

    // Signed Overflow Traps Quiz
    if (effectiveMode === 'math_sub_signed_overflow_quiz') {
      const qPool = [
        {
          prompt: "Signed Overflow Rules",
          display: "When does an 8-bit Signed Overflow error occur?",
          isQuestionDisplay: true,
          hint: "Look at the sign of the two operands vs the sign of the result",
          correctAnswer: "When adding two positives produces a negative (or two negatives produce a positive)",
          options: [
            "When adding two positives produces a negative (or two negatives produce a positive)",
            "Whenever any carry occurs in the LSB",
            "Whenever zero is the answer",
            "When subtracting a smaller number from a larger number"
          ]
        },
        {
          prompt: "Signed Overflow Calculation",
          display: "+70 + +70 = −116 ?",
          hint: "70 + 70 = 140, which exceeds the maximum positive 8-bit signed limit of +127",
          correctAnswer: "Signed Overflow (+140 > +127, MSB flipped to negative)",
          options: [
            "Signed Overflow (+140 > +127, MSB flipped to negative)",
            "Underflow Error",
            "Parity Mismatch",
            "No error occurred"
          ]
        }
      ];
      const selected = qPool[Math.floor(Math.random() * qPool.length)];
      return {
        type: 'mc',
        prompt: selected.prompt,
        display: selected.display,
        isQuestionDisplay: selected.isQuestionDisplay,
        hint: selected.hint,
        correctAnswer: selected.correctAnswer,
        options: shuffleArray(selected.options)
      };
    }

    // =========================================================================
    // STAGE 9: LOGICAL SHIFTS (INTERACTIVE FLIP & MC)
    // =========================================================================
    if (effectiveMode === 'math_shift_flip') {
      const isLeft = Math.random() > 0.5;
      const shiftAmount = Math.floor(Math.random() * 2) + 1; // 1 or 2
      const initialVal = isLeft ? Math.floor(Math.random() * 30) + 3 : (Math.floor(Math.random() * 100) + 20);
      const bitsA = initialVal.toString(2).padStart(8, '0').split('').map(Number);
      const resultVal = isLeft ? (initialVal << shiftAmount) & 255 : (initialVal >> shiftAmount);
      const resultStr = resultVal.toString(2).padStart(8, '0');
      const arrowSymbol = isLeft ? '◀◀' : '▶▶';
      return {
        type: 'math_grid',
        numBits: 8,
        placeValues: [128, 64, 32, 16, 8, 4, 2, 1],
        operator: arrowSymbol,
        valA: initialVal,
        valB: shiftAmount,
        bitsA: bitsA,
        isLeft: isLeft,
        shiftAmount: shiftAmount,
        isShiftGrid: true,
        correctAnswer: resultStr,
        prompt: `Logical Shift ${isLeft ? 'LEFT (×' + Math.pow(2, shiftAmount) + ')' : 'RIGHT (÷' + Math.pow(2, shiftAmount) + ')'}:`,
        display: `${initialVal}  ${isLeft ? '<<' : '>>'}  ${shiftAmount} bit${shiftAmount > 1 ? 's' : ''}`,
        hint: isLeft 
          ? `Shift all bits LEFT by ${shiftAmount}. Discard MSB overflow, pad 0s into the rightmost columns!` 
          : `Shift all bits RIGHT by ${shiftAmount}. Discard bits shifted past the 1s column, pad 0s at the left!`
      };
    }

    if (effectiveMode === 'mc_shift_left' || effectiveMode === 'mc_shift_right') {
      const isLeft = (effectiveMode === 'mc_shift_left');
      const shiftAmount = Math.floor(Math.random() * 2) + 1;
      const initialVal = isLeft ? Math.floor(Math.random() * 25) + 3 : (Math.floor(Math.random() * 100) + 10);
      const initialBin = initialVal.toString(2).padStart(8, '0');
      const resultVal = isLeft ? (initialVal << shiftAmount) & 255 : (initialVal >> shiftAmount);
      const resultBin = resultVal.toString(2).padStart(8, '0');
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

    // =========================================================================
    // UNITS OF DATA: FUNDAMENTALS & CONVERSIONS
    // =========================================================================
    if (effectiveMode === 'units_fundamental') {
      const subType = Math.floor(Math.random() * 3);

      if (subType === 0) {
        // Category A: Direct Definition (How many bits in a byte, how many bytes in a KB/MB/GB)
        const defs = [
          {
            prompt: "Data Storage Units",
            display: "How many bits are in 1 Byte?",
            hint: "The fundamental unit of computer memory storage.",
            correctAnswer: "8 bits",
            options: ["8 bits", "4 bits", "16 bits", "2 bits"]
          },
          {
            prompt: "Data Storage Units",
            display: "How many bits are in 1 Nibble?",
            hint: "A nibble is exactly half of an 8-bit byte (represents 1 hex digit).",
            correctAnswer: "4 bits",
            options: ["4 bits", "8 bits", "2 bits", "16 bits"]
          },
          {
            prompt: "Data Storage Units",
            display: "How many nibbles are in 1 Byte?",
            hint: "8 bits divided into 4-bit nibbles.",
            correctAnswer: "2 nibbles",
            options: ["2 nibbles", "4 nibbles", "8 nibbles", "1 nibble"]
          },
          {
            prompt: "Decimal Storage Prefixes",
            display: "How many bytes are in 1 Kilobyte (KB)?",
            hint: "Standard metric decimal prefix: Kilo = 10³.",
            correctAnswer: "1,000 bytes",
            options: ["1,000 bytes", "100 bytes", "10,000 bytes", "500 bytes"]
          },
          {
            prompt: "Decimal Storage Prefixes",
            display: "How many Kilobytes (KB) are in 1 Megabyte (MB)?",
            hint: "Standard metric decimal step: 10³ Kilobytes.",
            correctAnswer: "1,000 KB",
            options: ["1,000 KB", "100 KB", "10,000 KB", "1,024 KB"]
          },
          {
            prompt: "Decimal Storage Prefixes",
            display: "How many Megabytes (MB) are in 1 Gigabyte (GB)?",
            hint: "Standard metric decimal step: 10³ Megabytes.",
            correctAnswer: "1,000 MB",
            options: ["1,000 MB", "100 MB", "10,000 MB", "500 MB"]
          },
          {
            prompt: "Decimal Storage Prefixes",
            display: "How many Gigabytes (GB) are in 1 Terabyte (TB)?",
            hint: "Standard metric decimal step: 10³ Gigabytes.",
            correctAnswer: "1,000 GB",
            options: ["1,000 GB", "100 GB", "10,000 GB", "500 GB"]
          }
        ];
        const selected = defs[Math.floor(Math.random() * defs.length)];
        return {
          type: 'mc',
          prompt: selected.prompt,
          display: selected.display,
          isQuestionDisplay: true,
          hint: selected.hint,
          correctAnswer: selected.correctAnswer,
          options: shuffleArray(selected.options)
        };
      } else if (subType === 1) {
        // Category B: "Which is bigger, X or Y?" (2 options ONLY!)
        const comparisons = [
          { itemA: "1 Byte", itemB: "1 Nibble", bigger: "1 Byte", hint: "1 Byte = 8 bits, 1 Nibble = 4 bits." },
          { itemA: "1 Byte", itemB: "4 bits", bigger: "1 Byte", hint: "1 Byte = 8 bits." },
          { itemA: "10 bits", itemB: "1 Byte", bigger: "10 bits", hint: "1 Byte is 8 bits, so 10 bits is larger." },
          { itemA: "1 Kilobyte (KB)", itemB: "500 bytes", bigger: "1 Kilobyte (KB)", hint: "1 KB = 1,000 bytes." },
          { itemA: "1 Megabyte (MB)", itemB: "1 Kilobyte (KB)", bigger: "1 Megabyte (MB)", hint: "1 MB = 1,000 KB." },
          { itemA: "1 Gigabyte (GB)", itemB: "1 Megabyte (MB)", bigger: "1 Gigabyte (GB)", hint: "1 GB = 1,000 MB." },
          { itemA: "1 Terabyte (TB)", itemB: "1 Gigabyte (GB)", bigger: "1 Terabyte (TB)", hint: "1 TB = 1,000 GB." },
          { itemA: "2 Megabytes (MB)", itemB: "1,500 Kilobytes (KB)", bigger: "2 Megabytes (MB)", hint: "2 MB = 2,000 KB." },
          { itemA: "3 Bytes", itemB: "4 Nibbles", bigger: "3 Bytes", hint: "3 Bytes = 6 nibbles (24 bits); 4 nibbles = 16 bits." },
          { itemA: "1,200 Megabytes (MB)", itemB: "1 Gigabyte (GB)", bigger: "1,200 Megabytes (MB)", hint: "1 GB = 1,000 MB." }
        ];
        const comp = comparisons[Math.floor(Math.random() * comparisons.length)];
        const opts = shuffleArray([comp.itemA, comp.itemB]);
        return {
          type: 'mc',
          prompt: "Compare Storage Sizes",
          display: "Which is bigger?",
          isQuestionDisplay: true,
          hint: comp.hint,
          correctAnswer: comp.bigger,
          options: opts
        };
      } else {
        // Category C: Randomized Multiplier (N bytes to bits/nibbles)
        const randN = [2, 3, 4, 5, 6, 8][Math.floor(Math.random() * 6)];
        const kind = Math.floor(Math.random() * 3);

        if (kind === 0) {
          const ans = `${randN * 8} bits`;
          const opts = shuffleArray([ans, `${randN * 4} bits`, `${randN * 16} bits`, `${randN * 2} bits`]);
          return {
            type: 'mc',
            prompt: "Data Storage Units",
            display: `How many bits in ${randN} Bytes?`,
            isQuestionDisplay: true,
            hint: "1 Byte = 8 bits. Multiply number of bytes by 8.",
            correctAnswer: ans,
            options: opts
          };
        } else if (kind === 1) {
          const ans = `${randN * 2} nibbles`;
          const opts = shuffleArray([ans, `${randN * 4} nibbles`, `${randN} nibbles`, `${randN * 8} nibbles`]);
          return {
            type: 'mc',
            prompt: "Data Storage Units",
            display: `How many nibbles in ${randN} Bytes?`,
            isQuestionDisplay: true,
            hint: "Each byte contains 2 nibbles. Multiply number of bytes by 2.",
            correctAnswer: ans,
            options: opts
          };
        } else {
          const ans = `${(randN * 1000).toLocaleString()} bytes`;
          const opts = shuffleArray([ans, `${(randN * 100).toLocaleString()} bytes`, `${(randN * 10000).toLocaleString()} bytes`, `${(randN * 500).toLocaleString()} bytes`]);
          return {
            type: 'mc',
            prompt: "Decimal Storage Units",
            display: `How many bytes in ${randN} Kilobytes (KB)?`,
            isQuestionDisplay: true,
            hint: "1 KB = 1,000 bytes. Multiply number of KB by 1,000.",
            correctAnswer: ans,
            options: opts
          };
        }
      }
    }

    if (effectiveMode === 'units_conversions') {
      const qPool = [
        {
          prompt: "Storage Unit Conversion",
          display: "2.3 MB ➔ ? KB",
          hint: "1 MB = 1,000 KB. Multiply by 1,000 to convert down to KB.",
          correctAnswer: "2,300 KB",
          options: ["2,300 KB", "230 KB", "23,000 KB", "235 KB"]
        },
        {
          prompt: "Storage Unit Conversion",
          display: "4 GB ➔ ? MB",
          hint: "1 GB = 1,000 MB. Multiply by 1,000 to convert down to MB.",
          correctAnswer: "4,000 MB",
          options: ["4,000 MB", "400 MB", "40,000 MB", "4 MB"]
        },
        {
          prompt: "Storage Unit Conversion",
          display: "3.5 KB ➔ ? bytes",
          hint: "1 KB = 1,000 bytes. Multiply by 1,000 to convert down to bytes.",
          correctAnswer: "3,500 bytes",
          options: ["3,500 bytes", "350 bytes", "35,000 bytes", "35 bytes"]
        },
        {
          prompt: "Storage Unit Conversion",
          display: "5,000 MB ➔ ? GB",
          hint: "1 GB = 1,000 MB. Divide by 1,000 to convert up to GB.",
          correctAnswer: "5 GB",
          options: ["5 GB", "50 GB", "0.5 GB", "500 GB"]
        },
        {
          prompt: "Storage Unit Conversion",
          display: "1 MB ➔ ? bytes",
          hint: "1 MB = 1,000 KB, and 1 KB = 1,000 bytes. Multiply by 1,000 twice (× 1,000,000).",
          correctAnswer: "1,000,000 bytes",
          options: ["1,000,000 bytes", "1,000 bytes", "10,000,000 bytes", "100,000 bytes"]
        },
        {
          prompt: "Storage Unit Conversion",
          display: "2 TB ➔ ? GB",
          hint: "1 TB = 1,000 GB. Multiply by 1,000 to convert down to GB.",
          correctAnswer: "2,000 GB",
          options: ["2,000 GB", "200 GB", "20,000 GB", "20 GB"]
        },
        {
          prompt: "Storage Unit Conversion",
          display: "750 KB ➔ ? MB",
          hint: "1 MB = 1,000 KB. Divide by 1,000 to convert up to MB.",
          correctAnswer: "0.75 MB",
          options: ["0.75 MB", "7.5 MB", "0.075 MB", "75 MB"]
        }
      ];
      const selected = qPool[Math.floor(Math.random() * qPool.length)];
      return {
        type: 'mc',
        prompt: selected.prompt,
        display: selected.display,
        isQuestionDisplay: selected.isQuestionDisplay,
        hint: selected.hint,
        correctAnswer: selected.correctAnswer,
        options: shuffleArray(selected.options)
      };
    }

    if (effectiveMode === 'units_capacity') {
      const qPool = [
        {
          prompt: "How many 500 KB image files can fit into a 2 MB USB partition?",
          display: "2 MB ÷ 500 KB",
          hint: "First convert MB to KB (× 1,000) so units match, then divide by file size.",
          correctAnswer: "4 files",
          options: ["4 files", "2 files", "8 files", "10 files"]
        },
        {
          prompt: "How many 250 MB video clips can fit on a 4 GB memory card?",
          display: "4 GB ÷ 250 MB",
          hint: "First convert GB to MB (× 1,000) so units match, then divide by file size.",
          correctAnswer: "16 videos",
          options: ["16 videos", "8 videos", "12 videos", "20 videos"]
        },
        {
          prompt: "A text file is 100 KB. How many can fit into 1 MB of cache?",
          display: "1 MB ÷ 100 KB",
          hint: "First convert MB to KB (× 1,000) so units match, then divide by file size.",
          correctAnswer: "10 files",
          options: ["10 files", "5 files", "100 files", "1 file"]
        },
        {
          prompt: "A music track is 4 MB. How many tracks can be stored on a 16 GB phone drive?",
          display: "16 GB ÷ 4 MB",
          hint: "First convert GB to MB (× 1,000) so units match, then divide by file size.",
          correctAnswer: "4,000 songs",
          options: ["4,000 songs", "400 songs", "40,000 songs", "2,000 songs"]
        },
        {
          prompt: "How many 200 KB document scans can fit into 3 MB of free drive space?",
          display: "3 MB ÷ 200 KB",
          hint: "First convert MB to KB (× 1,000) so units match, then divide by file size.",
          correctAnswer: "15 scans",
          options: ["15 scans", "12 scans", "18 scans", "30 scans"]
        },
        {
          prompt: "A high-res photo is 5 MB. How many photos can fit on an 8 GB flash drive?",
          display: "8 GB ÷ 5 MB",
          hint: "First convert GB to MB (× 1,000) so units match, then divide by file size.",
          correctAnswer: "1,600 photos",
          options: ["1,600 photos", "160 photos", "16,000 photos", "800 photos"]
        }
      ];
      const selected = qPool[Math.floor(Math.random() * qPool.length)];
      return {
        type: 'mc',
        prompt: selected.prompt,
        display: selected.display,
        hint: selected.hint,
        correctAnswer: selected.correctAnswer,
        options: shuffleArray(selected.options)
      };
    }

    if (effectiveMode === 'units_transmission') {
      const qPool = [
        {
          prompt: "Data Transmission: Bits vs Bytes",
          display: "50 MB ➔ ? Mb",
          hint: "1 Byte = 8 bits. Multiply Bytes by 8 to convert to bits (Mb).",
          correctAnswer: "400 Mb",
          options: ["400 Mb", "50 Mb", "25 Mb", "800 Mb"]
        },
        {
          prompt: "Data Transmission: Transfer Speed",
          display: "40 Mbps ➔ ? MB/s",
          hint: "1 Byte = 8 bits. Divide Mbps by 8 to convert speed to MB/s.",
          correctAnswer: "5 MB/s",
          options: ["5 MB/s", "4 MB/s", "8 MB/s", "10 MB/s"]
        },
        {
          prompt: "Download Time Calculation",
          display: "300 MB @ 30 Mbps = ? seconds",
          hint: "Formula: Convert file size to bits (MB × 8 = Mb), then divide by speed in Mbps.",
          correctAnswer: "80 seconds",
          options: ["80 seconds", "10 seconds", "40 seconds", "100 seconds"]
        },
        {
          prompt: "Download Time Calculation",
          display: "100 MB @ 40 Mbps = ? seconds",
          hint: "Formula: Convert file size to bits (MB × 8 = Mb), then divide by speed in Mbps.",
          correctAnswer: "20 seconds",
          options: ["20 seconds", "2.5 seconds", "40 seconds", "80 seconds"]
        },
        {
          prompt: "Download Time Calculation",
          display: "80 MB @ 16 Mbps = ? seconds",
          hint: "Formula: Convert file size to bits (MB × 8 = Mb), then divide by speed in Mbps.",
          correctAnswer: "40 seconds",
          options: ["40 seconds", "5 seconds", "20 seconds", "80 seconds"]
        },
        {
          prompt: "Data Transmission: Bits to Bytes",
          display: "240 Mb ➔ ? MB",
          hint: "1 Byte = 8 bits. Divide bits (Mb) by 8 to convert to Bytes (MB).",
          correctAnswer: "30 MB",
          options: ["30 MB", "1,920 MB", "60 MB", "15 MB"]
        },
        {
          prompt: "Network Notation Rules",
          display: "What is the difference between capital 'B' and lowercase 'b'?",
          isQuestionDisplay: true,
          hint: "Capital B denotes Bytes (8 bits); lowercase b denotes bits",
          correctAnswer: "B = Byte (8 bits), b = bit (1 binary digit)",
          options: [
            "B = Byte (8 bits), b = bit (1 binary digit)",
            "B = bit (1 binary digit), b = Byte (8 bits)",
            "B = Base 10, b = Base 2",
            "B = Broadband, b = Buffer"
          ]
        }
      ];
      const selected = qPool[Math.floor(Math.random() * qPool.length)];
      return {
        type: 'mc',
        prompt: selected.prompt,
        display: selected.display,
        isQuestionDisplay: selected.isQuestionDisplay,
        hint: selected.hint,
        correctAnswer: selected.correctAnswer,
        options: shuffleArray(selected.options)
      };
    }

    // Level 2: Decimal vs Binary Prefixes (KB vs KiB)
    if (effectiveMode === 'units_prefixes_kib') {
      const qTypes = [
        // Comparison questions (2 options)
        {
          prompt: "Binary vs Decimal Prefixes",
          display: "Which is larger: 1 KiB or 1 KB?",
          hint: "1 KiB = 1,024 bytes (binary 2¹⁰); 1 KB = 1,000 bytes (decimal 10³).",
          correctAnswer: "1 KiB (1,024 bytes)",
          options: ["1 KiB (1,024 bytes)", "1 KB (1,000 bytes)"]
        },
        {
          prompt: "Binary vs Decimal Prefixes",
          display: "Which is larger: 1 MiB or 1 MB?",
          hint: "1 MiB = 1,048,576 bytes; 1 MB = 1,000,000 bytes.",
          correctAnswer: "1 MiB (Mebibyte)",
          options: ["1 MiB (Mebibyte)", "1 MB (Megabyte)"]
        },
        {
          prompt: "Binary vs Decimal Prefixes",
          display: "Which is larger: 1 GiB or 1 GB?",
          hint: "Gibibyte uses powers of 1,024; Gigabyte uses powers of 1,000.",
          correctAnswer: "1 GiB (Gibibyte)",
          options: ["1 GiB (Gibibyte)", "1 GB (Gigabyte)"]
        },
        // Multiplier rules (2 options)
        {
          prompt: "Prefix Standards",
          display: "Which multiplier is used by Decimal metric prefixes (KB, MB, GB)?",
          hint: "Metric base 10 uses powers of 1,000 (10³).",
          correctAnswer: "1,000 (10³)",
          options: ["1,000 (10³)", "1,024 (2¹⁰)"]
        },
        {
          prompt: "Prefix Standards",
          display: "Which multiplier is used by IEC Binary prefixes (KiB, MiB, GiB)?",
          hint: "Binary base 2 uses powers of 1,024 (2¹⁰).",
          correctAnswer: "1,024 (2¹⁰)",
          options: ["1,024 (2¹⁰)", "1,000 (10³)"]
        },
        // Unit values
        {
          prompt: "IEC Binary Prefixes",
          display: "1 Kibibyte (KiB) = ? bytes",
          hint: "Binary prefix uses 2¹⁰ = 1,024.",
          correctAnswer: "1,024 bytes",
          options: ["1,024 bytes", "1,000 bytes", "512 bytes", "2,048 bytes"]
        },
        {
          prompt: "IEC Binary Prefixes",
          display: "2 Kibibytes (2 KiB) = ? bytes",
          hint: "Multiply 1,024 by 2.",
          correctAnswer: "2,048 bytes",
          options: ["2,048 bytes", "2,000 bytes", "1,024 bytes", "4,096 bytes"]
        },
        {
          prompt: "Decimal Prefixes",
          display: "1 Kilobyte (KB) = ? bytes",
          hint: "Decimal prefix uses 10³ = 1,000.",
          correctAnswer: "1,000 bytes",
          options: ["1,000 bytes", "1,024 bytes", "100 bytes", "10,000 bytes"]
        },
        // Terminology
        {
          prompt: "Prefix Terminology",
          display: "What does the 'bi' in Kibibyte stand for?",
          hint: "KiB represents Kilo-Binary.",
          correctAnswer: "Binary (powers of 2)",
          options: ["Binary (powers of 2)", "Bit-level", "Broadband", "Base-10"]
        },
        {
          prompt: "Prefix Terminology",
          display: "What does the prefix 'MiB' stand for?",
          hint: "Mega + Binary Byte.",
          correctAnswer: "Mebibyte (Mega-Binary)",
          options: ["Mebibyte (Mega-Binary)", "Metric Byte", "Micro-Binary", "Multi-Byte"]
        },
        {
          prompt: "Storage Discrepancies",
          display: "Why does a 500 GB drive show ~465 GiB in Windows?",
          hint: "Drive makers use 1,000 (decimal), but Windows calculates in 1,024 (binary).",
          correctAnswer: "Drive makers use 1,000 (decimal); Windows reports 1,024 (binary)",
          options: [
            "Drive makers use 1,000 (decimal); Windows reports 1,024 (binary)",
            "Windows reserves 35 GB of space for system files",
            "35 GB of disk sectors were damaged during shipping"
          ]
        }
      ];
      const selected = qTypes[Math.floor(Math.random() * qTypes.length)];
      return {
        type: 'mc',
        prompt: selected.prompt,
        display: selected.display,
        isQuestionDisplay: true,
        hint: selected.hint,
        correctAnswer: selected.correctAnswer,
        options: shuffleArray(selected.options)
      };
    }

    // Level 3: Character Encoding Sizes (ASCII vs Unicode)
    if (effectiveMode === 'units_text_chars') {
      const charCounts = [4, 5, 6, 8, 10, 12, 14, 15, 16, 20, 25];
      const n = charCounts[Math.floor(Math.random() * charCounts.length)];
      const qKind = Math.floor(Math.random() * 5);

      if (qKind === 0) {
        // How many bytes to store N ASCII characters?
        const ans = `${n} bytes`;
        const opts = shuffleArray([ans, `${n * 8} bytes`, `${n * 2} bytes`, `${Math.max(1, Math.round(n / 2))} bytes`]);
        return {
          type: 'mc',
          prompt: "Character Encoding Storage",
          display: `How many bytes to store ${n} ASCII characters?`,
          isQuestionDisplay: true,
          hint: "Standard ASCII uses exactly 1 byte (8 bits) per character.",
          correctAnswer: ans,
          options: opts
        };
      } else if (qKind === 1) {
        // How many bits to store N ASCII characters?
        const ans = `${n * 8} bits`;
        const opts = shuffleArray([ans, `${n} bits`, `${n * 4} bits`, `${n * 16} bits`]);
        return {
          type: 'mc',
          prompt: "Character Encoding Storage",
          display: `How many bits to store ${n} ASCII characters?`,
          isQuestionDisplay: true,
          hint: "Each ASCII character requires 8 bits (1 byte).",
          correctAnswer: ans,
          options: opts
        };
      } else if (qKind === 2) {
        // How many bytes to store N UTF-16 (Unicode) characters?
        const ans = `${n * 2} bytes`;
        const opts = shuffleArray([ans, `${n} bytes`, `${n * 4} bytes`, `${n * 8} bytes`]);
        return {
          type: 'mc',
          prompt: "Character Encoding Storage",
          display: `How many bytes to store ${n} UTF-16 characters?`,
          isQuestionDisplay: true,
          hint: "Each UTF-16 Unicode character requires 2 bytes (16 bits).",
          correctAnswer: ans,
          options: opts
        };
      } else if (qKind === 3) {
        // Comparison question (2 options)
        return {
          type: 'mc',
          prompt: "Character Encoding Storage",
          display: "Which character encoding uses more storage per character?",
          isQuestionDisplay: true,
          hint: "Unicode uses 16 or 32 bits per character; ASCII uses 7 or 8 bits.",
          correctAnswer: "Unicode (UTF-16)",
          options: ["Unicode (UTF-16)", "Standard ASCII"]
        };
      } else {
        // Encoding bit width definitions
        const bitsDefs = [
          {
            display: "How many bits are used by standard 7-bit ASCII?",
            ans: "7 bits (stored in 1 byte)",
            opts: ["7 bits (stored in 1 byte)", "16 bits", "4 bits", "32 bits"],
            hint: "Original standard ASCII uses 7 bits to represent 128 characters."
          },
          {
            display: "How many bits are used by Extended ASCII?",
            ans: "8 bits (1 byte)",
            opts: ["8 bits (1 byte)", "7 bits", "16 bits", "4 bits"],
            hint: "Extended ASCII uses a full 8-bit byte to represent 256 characters."
          },
          {
            display: "How many bits are used by a standard UTF-16 character?",
            ans: "16 bits (2 bytes)",
            opts: ["16 bits (2 bytes)", "8 bits (1 byte)", "4 bits", "32 bits"],
            hint: "UTF-16 uses 16 bits per code unit."
          },
          {
            display: "How many unique characters can 8-bit Extended ASCII represent?",
            ans: "256 characters (2⁸)",
            opts: ["256 characters (2⁸)", "128 characters (2⁷)", "65,536 characters (2¹⁶)", "16 characters"],
            hint: "Formula: 2ⁿ, where n is the number of bits."
          }
        ];
        const chosen = bitsDefs[Math.floor(Math.random() * bitsDefs.length)];
        return {
          type: 'mc',
          prompt: "Character Encoding Standards",
          display: chosen.display,
          isQuestionDisplay: true,
          hint: chosen.hint,
          correctAnswer: chosen.ans,
          options: shuffleArray(chosen.opts)
        };
      }
    }

    // Step-Up Conversions (÷1,000)
    if (effectiveMode === 'units_conversions_up') {
      const qPool = [
        {
          prompt: "Step-Up Conversion (÷1,000)",
          display: "8,000 KB ➔ ? MB",
          hint: "1 MB = 1,000 KB. Divide by 1,000 to step up from KB to MB.",
          correctAnswer: "8 MB",
          options: ["8 MB", "80 MB", "0.8 MB", "800 MB"]
        },
        {
          prompt: "Step-Up Conversion (÷1,000)",
          display: "12,000 MB ➔ ? GB",
          hint: "1 GB = 1,000 MB. Divide by 1,000 to step up from MB to GB.",
          correctAnswer: "12 GB",
          options: ["12 GB", "1.2 GB", "120 GB", "12,000 GB"]
        },
        {
          prompt: "Step-Up Conversion (÷1,000)",
          display: "4,500 bytes ➔ ? KB",
          hint: "1 KB = 1,000 bytes. Divide by 1,000 to step up from bytes to KB.",
          correctAnswer: "4.5 KB",
          options: ["4.5 KB", "45 KB", "0.45 KB", "450 KB"]
        },
        {
          prompt: "Step-Up Conversion (÷1,000)",
          display: "25,000 KB ➔ ? MB",
          hint: "1 MB = 1,000 KB. Divide by 1,000 to step up from KB to MB.",
          correctAnswer: "25 MB",
          options: ["25 MB", "2.5 MB", "250 MB", "2500 MB"]
        }
      ];
      const selected = qPool[Math.floor(Math.random() * qPool.length)];
      return {
        type: 'mc',
        prompt: selected.prompt,
        display: selected.display,
        isQuestionDisplay: selected.isQuestionDisplay,
        hint: selected.hint,
        correctAnswer: selected.correctAnswer,
        options: shuffleArray(selected.options)
      };
    }

    // Step-Down Conversions (×1,000)
    if (effectiveMode === 'units_conversions_down') {
      const qPool = [
        {
          prompt: "Step-Down Conversion (×1,000)",
          display: "6 GB ➔ ? MB",
          hint: "1 GB = 1,000 MB. Multiply by 1,000 to step down from GB to MB.",
          correctAnswer: "6,000 MB",
          options: ["6,000 MB", "600 MB", "60,000 MB", "6 MB"]
        },
        {
          prompt: "Step-Down Conversion (×1,000)",
          display: "1.5 TB ➔ ? GB",
          hint: "1 TB = 1,000 GB. Multiply by 1,000 to step down from TB to GB.",
          correctAnswer: "1,500 GB",
          options: ["1,500 GB", "150 GB", "15,000 GB", "15 GB"]
        },
        {
          prompt: "Step-Down Conversion (×1,000)",
          display: "3.2 MB ➔ ? KB",
          hint: "1 MB = 1,000 KB. Multiply by 1,000 to step down from MB to KB.",
          correctAnswer: "3,200 KB",
          options: ["3,200 KB", "320 KB", "32,000 KB", "32 KB"]
        },
        {
          prompt: "Step-Down Conversion (×1,000)",
          display: "0.5 GB ➔ ? MB",
          hint: "1 GB = 1,000 MB. Multiply by 1,000 to step down from GB to MB.",
          correctAnswer: "500 MB",
          options: ["500 MB", "50 MB", "5,000 MB", "0.05 MB"]
        }
      ];
      const selected = qPool[Math.floor(Math.random() * qPool.length)];
      return {
        type: 'mc',
        prompt: selected.prompt,
        display: selected.display,
        isQuestionDisplay: selected.isQuestionDisplay,
        hint: selected.hint,
        correctAnswer: selected.correctAnswer,
        options: shuffleArray(selected.options)
      };
    }

    // Sound File Size Formula
    if (effectiveMode === 'units_sound_calc') {
      const qKind = Math.floor(Math.random() * 3);

      if (qKind === 0) {
        // Space for 1 second of audio
        const secQuestions = [
          {
            display: "8,000 Hz sample rate × 8-bit depth (1 second)",
            ans: "8 KB",
            opts: ["8 KB", "64 KB", "1 KB", "80 KB"],
            hint: "Formula: (Sample rate × Bit depth) ÷ 8 bits per byte. 8 bits = 1 byte per sample."
          },
          {
            display: "44,000 Hz sample rate × 16-bit depth (1 second)",
            ans: "88 KB",
            opts: ["88 KB", "44 KB", "176 KB", "704 KB"],
            hint: "16 bits = 2 bytes per sample. Multiply sample rate by 2 bytes."
          },
          {
            display: "10,000 Hz sample rate × 16-bit depth (1 second)",
            ans: "20 KB",
            opts: ["20 KB", "10 KB", "160 KB", "40 KB"],
            hint: "16 bits = 2 bytes per sample. Multiply sample rate by 2 bytes."
          },
          {
            display: "20,000 Hz sample rate × 8-bit depth (1 second)",
            ans: "20 KB",
            opts: ["20 KB", "160 KB", "2 KB", "40 KB"],
            hint: "8 bits = 1 byte per sample. Multiply sample rate by 1 byte."
          }
        ];
        const item = secQuestions[Math.floor(Math.random() * secQuestions.length)];
        return {
          type: 'mc',
          prompt: "Sound Data per Second",
          display: item.display,
          isQuestionDisplay: true,
          hint: item.hint,
          correctAnswer: item.ans,
          options: shuffleArray(item.opts)
        };
      } else if (qKind === 1) {
        // Proportional adjustments (downsampling, stereo, duration)
        const propQuestions = [
          {
            prompt: "Audio Downsampling",
            display: "A 40,000 Hz audio clip is 60 MB. If downsampled to 20,000 Hz (half the rate), what is the new size?",
            ans: "30 MB",
            opts: ["30 MB", "120 MB", "15 MB", "60 MB"],
            hint: "Sample rate is directly proportional to file size. Halving the rate halves the file size."
          },
          {
            prompt: "Audio Downsampling",
            display: "A 44,000 Hz audio track is 80 MB. If downsampled to 22,000 Hz, what is the new size?",
            ans: "40 MB",
            opts: ["40 MB", "160 MB", "20 MB", "80 MB"],
            hint: "Halving the sample rate halves the total recorded samples and file size."
          },
          {
            prompt: "Bit Depth Adjustment",
            display: "A 10 MB audio track is reduced from 16-bit depth to 8-bit depth. What is the new size?",
            ans: "5 MB",
            opts: ["5 MB", "20 MB", "2.5 MB", "10 MB"],
            hint: "Halving the bit depth halves the number of bits stored per sample."
          },
          {
            prompt: "Mono vs Stereo Channels",
            display: "A 15 MB audio recording is recorded in Stereo (2 channels) instead of Mono (1 channel). What is the file size?",
            ans: "30 MB",
            opts: ["30 MB", "15 MB", "60 MB", "7.5 MB"],
            hint: "Stereo doubles the audio stream by recording separate left and right channels."
          },
          {
            prompt: "Recording Duration",
            display: "A 3-minute recording is 12 MB. How large would a 6-minute recording be at identical quality?",
            ans: "24 MB",
            opts: ["24 MB", "36 MB", "6 MB", "12 MB"],
            hint: "Duration is directly proportional to file size. Doubling the time doubles the file size."
          }
        ];
        const item = propQuestions[Math.floor(Math.random() * propQuestions.length)];
        return {
          type: 'mc',
          prompt: item.prompt,
          display: item.display,
          isQuestionDisplay: true,
          hint: item.hint,
          correctAnswer: item.ans,
          options: shuffleArray(item.opts)
        };
      } else {
        // Conceptual sound formulas & definitions
        const conceptQuestions = [
          {
            prompt: "Sound File Size Formula",
            display: "Which 3 factors determine the file size of an uncompressed audio recording?",
            ans: "Sample rate, bit depth & duration",
            opts: [
              "Sample rate, bit depth & duration",
              "Volume, pitch & speaker wattage",
              "Microphone brand, cable length & tempo",
              "Genre, album art & artist name"
            ],
            hint: "Formula: Sample rate (Hz) × Bit depth (bits) × Duration (seconds) [× Channels]."
          },
          {
            prompt: "Sound File Size Formula",
            display: "If you double both the sample rate and the bit depth, how much larger does the file become?",
            ans: "4× larger (quadruples)",
            opts: ["4× larger (quadruples)", "2× larger (doubles)", "8× larger", "Stays the same"],
            hint: "Multiply the two factor increases: 2 × 2 = 4×."
          },
          {
            prompt: "Audio Quality & Size",
            display: "What unit is sample rate measured in?",
            ans: "Hertz (Hz)",
            opts: ["Hertz (Hz)", "Bits per second (bps)", "Decibels (dB)", "Pixels"],
            hint: "Hertz represents the number of samples captured per second."
          },
          {
            prompt: "Audio Sampling",
            display: "What is sample rate?",
            ans: "The number of sound samples captured per second",
            opts: [
              "The number of sound samples captured per second",
              "The loudness of the loudest instrument",
              "The number of bits assigned to each sample",
              "The physical length of the sound wave"
            ],
            hint: "Measured in Hertz (Hz): 44.1 kHz = 44,100 samples per second."
          }
        ];
        const item = conceptQuestions[Math.floor(Math.random() * conceptQuestions.length)];
        return {
          type: 'mc',
          prompt: item.prompt,
          display: item.display,
          isQuestionDisplay: true,
          hint: item.hint,
          correctAnswer: item.ans,
          options: shuffleArray(item.opts)
        };
      }
    }

    // Bitmap Image File Size Formula
    if (effectiveMode === 'units_image_calc') {
      const qKind = Math.floor(Math.random() * 3);

      if (qKind === 0) {
        // Simple pixel calculations (clean numbers, NO spoiler hints)
        const imgQuestions = [
          {
            display: "10 × 10 pixel icon @ 8-bit colour depth",
            ans: "100 bytes",
            opts: ["100 bytes", "800 bytes", "10 bytes", "1,000 bytes"],
            hint: "Formula: Width × Height × (Colour depth ÷ 8). 8 bits = 1 byte per pixel."
          },
          {
            display: "100 × 50 pixel image @ 8-bit colour depth",
            ans: "5 KB (5,000 bytes)",
            opts: ["5 KB (5,000 bytes)", "50 KB", "40 KB", "500 bytes"],
            hint: "Total pixels = Width × Height. 8 bits = 1 byte per pixel."
          },
          {
            display: "200 × 100 monochrome image (1 bit per pixel)",
            ans: "2,500 bytes",
            opts: ["2,500 bytes", "20,000 bytes", "200 bytes", "5,000 bytes"],
            hint: "Calculate total pixels (Width × Height), then divide by 8 to convert bits to bytes."
          },
          {
            display: "20 × 20 pixel sprite @ 16-bit colour depth",
            ans: "800 bytes",
            opts: ["800 bytes", "400 bytes", "6,400 bytes", "1,600 bytes"],
            hint: "16 bits = 2 bytes per pixel. Multiply total pixels by 2 bytes."
          }
        ];
        const item = imgQuestions[Math.floor(Math.random() * imgQuestions.length)];
        return {
          type: 'mc',
          prompt: "Bitmap Image File Size",
          display: item.display,
          isQuestionDisplay: true,
          hint: item.hint,
          correctAnswer: item.ans,
          options: shuffleArray(item.opts)
        };
      } else if (qKind === 1) {
        // Proportional adjustments (resolution & depth)
        const propQuestions = [
          {
            prompt: "Colour Depth Adjustment",
            display: "An 8 MB image has its colour depth increased from 8-bit to 24-bit (True Colour). What is the new size?",
            ans: "24 MB",
            opts: ["24 MB", "16 MB", "32 MB", "64 MB"],
            hint: "Colour depth triples (8 bits ➔ 24 bits), so the uncompressed file size triples."
          },
          {
            prompt: "Image Resolution Scaling",
            display: "If you double both the width and the height of an image, what happens to its file size?",
            ans: "File size quadruples (4×)",
            opts: ["File size quadruples (4×)", "File size doubles (2×)", "File size triples (3×)", "File size stays the same"],
            hint: "Area = Width × Height. Doubling both dimensions quadruples total pixels (2 × 2 = 4)."
          },
          {
            prompt: "Image Resolution Scaling",
            display: "A 16 MB image has both its width and height halved. What is the new file size?",
            ans: "4 MB",
            opts: ["4 MB", "8 MB", "2 MB", "1 MB"],
            hint: "Halving both dimensions reduces total pixels to one quarter (1/2 × 1/2 = 1/4)."
          },
          {
            prompt: "Colour Depth Reduction",
            display: "A 12 MB image is converted from 24-bit True Colour to 8-bit colour. What is the new size?",
            ans: "4 MB",
            opts: ["4 MB", "6 MB", "3 MB", "8 MB"],
            hint: "Colour depth is reduced by a factor of 3 (24 ÷ 8 = 3), so file size is divided by 3."
          }
        ];
        const item = propQuestions[Math.floor(Math.random() * propQuestions.length)];
        return {
          type: 'mc',
          prompt: item.prompt,
          display: item.display,
          isQuestionDisplay: true,
          hint: item.hint,
          correctAnswer: item.ans,
          options: shuffleArray(item.opts)
        };
      } else {
        // Colour depth & metadata concepts
        const conceptQuestions = [
          {
            prompt: "Colour Depth Calculation",
            display: "How many unique colours can be represented with 8-bit colour depth?",
            ans: "256 colours (2⁸)",
            opts: ["256 colours (2⁸)", "64 colours", "128 colours", "16 colours"],
            hint: "Formula: 2ⁿ colours, where n is the number of bits per pixel."
          },
          {
            prompt: "Colour Depth Calculation",
            display: "How many unique colours can be represented with 4-bit colour depth?",
            ans: "16 colours (2⁴)",
            opts: ["16 colours (2⁴)", "8 colours", "32 colours", "64 colours"],
            hint: "Formula: 2ⁿ colours, where n = 4 bits per pixel."
          },
          {
            prompt: "Colour Depth Calculation",
            display: "How many unique colours can be represented with 1-bit colour depth?",
            ans: "2 colours (Monochrome: Black & White)",
            opts: ["2 colours (Monochrome: Black & White)", "1 colour", "4 colours", "8 colours"],
            hint: "1 bit has 2 possible binary states: 0 or 1."
          },
          {
            prompt: "Bitmap File Structure",
            display: "What extra data is stored in an image file alongside pixel colours?",
            ans: "Metadata (dimensions, colour profile, resolution)",
            opts: [
              "Metadata (dimensions, colour profile, resolution)",
              "Screen refresh rate instructions",
              "Audio channel frequencies",
              "Electric voltage requirements"
            ],
            hint: "Metadata contains information about the file itself (dimensions, date, camera settings)."
          }
        ];
        const item = conceptQuestions[Math.floor(Math.random() * conceptQuestions.length)];
        return {
          type: 'mc',
          prompt: item.prompt,
          display: item.display,
          isQuestionDisplay: true,
          hint: item.hint,
          correctAnswer: item.ans,
          options: shuffleArray(item.opts)
        };
      }
    }

    // Megabits vs Megabytes
    if (effectiveMode === 'units_mb_vs_mb') {
      const qPool = [
        {
          prompt: "Transfer Speed vs File Size",
          display: "80 Mbps ➔ ? MB/s",
          hint: "1 Byte = 8 bits. Divide network speed in Mbps by 8 to convert to MB/s.",
          correctAnswer: "10 MB/s",
          options: ["10 MB/s", "8 MB/s", "80 MB/s", "640 MB/s"]
        },
        {
          prompt: "Transfer Speed vs File Size",
          display: "6 MB/s ➔ ? Mbps",
          hint: "1 Byte = 8 bits. Multiply file transfer speed in MB/s by 8 to convert to Mbps.",
          correctAnswer: "48 Mbps",
          options: ["48 Mbps", "6 Mbps", "24 Mbps", "36 Mbps"]
        },
        {
          prompt: "Transfer Speed vs File Size",
          display: "120 Mbps ➔ ? MB/s",
          hint: "1 Byte = 8 bits. Divide Mbps by 8 to convert to MB/s.",
          correctAnswer: "15 MB/s",
          options: ["15 MB/s", "12 MB/s", "120 MB/s", "960 MB/s"]
        },
        {
          prompt: "Transfer Speed vs File Size",
          display: "25 MB/s ➔ ? Mbps",
          hint: "1 Byte = 8 bits. Multiply MB/s by 8 to convert to Mbps.",
          correctAnswer: "200 Mbps",
          options: ["200 Mbps", "25 Mbps", "100 Mbps", "3.125 Mbps"]
        }
      ];
      const selected = qPool[Math.floor(Math.random() * qPool.length)];
      return {
        type: 'mc',
        prompt: selected.prompt,
        display: selected.display,
        isQuestionDisplay: selected.isQuestionDisplay,
        hint: selected.hint,
        correctAnswer: selected.correctAnswer,
        options: shuffleArray(selected.options)
      };
    }

    // Payload & Protocol Overhead
    if (effectiveMode === 'units_payload_overhead') {
      const qPool = [
        {
          prompt: "Network Protocol Overhead",
          display: "Why is real download speed lower than theoretical Mbps?",
          isQuestionDisplay: true,
          hint: "Network protocols (TCP/IP, Ethernet) require packet headers containing IP addresses, sequence numbers & checksums",
          correctAnswer: "Packet headers and protocol metadata consume a portion of the bandwidth",
          options: [
            "Packet headers and protocol metadata consume a portion of the bandwidth",
            "Broadband wires absorb binary electrons over distance",
            "The computer CPU slows down internet packets to inspect syntax",
            "Binary digits shrink during transmission"
          ]
        },
        {
          prompt: "Packet Payload Calculation",
          display: "1,500 B Packet − 40 B Headers = ? Payload",
          hint: "Formula: Payload = Total Packet Size − Protocol Headers.",
          correctAnswer: "1,460 bytes",
          options: ["1,460 bytes", "1,540 bytes", "1,400 bytes", "750 bytes"]
        },
        {
          prompt: "Packet Payload Calculation",
          display: "1,000 B Packet − 60 B Headers = ? Payload",
          hint: "Formula: Payload = Total Packet Size − Protocol Headers.",
          correctAnswer: "940 bytes",
          options: ["940 bytes", "1,060 bytes", "900 bytes", "500 bytes"]
        }
      ];
      const selected = qPool[Math.floor(Math.random() * qPool.length)];
      return {
        type: 'mc',
        prompt: selected.prompt,
        display: selected.display,
        isQuestionDisplay: selected.isQuestionDisplay,
        hint: selected.hint,
        correctAnswer: selected.correctAnswer,
        options: shuffleArray(selected.options)
      };
    }

    // =========================================================================
    // STAGE 11: THE MASTER GAUNTLET (CHAMPIONSHIP BLITZ)
    // =========================================================================
    if (effectiveMode === 'blitz_conversions' || effectiveMode === 'blitz_maths' || effectiveMode === 'blitz_signed_hex') {
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
        const hex = '0x' + val.toString(16).toUpperCase().padStart(2, '0');
        const dists = generateDistractors(val, 0, 255, 'denary');
        return {
          type: 'mc',
          prompt: `Gauntlet Blitz: Convert Hex ${hex} to Denary:`,
          display: hex,
          hint: "High nibble × 16 + Low nibble",
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
          prompt: `Gauntlet Blitz: Calculate Binary Sum:`,
          display: `${a} + ${b}`,
          hint: "Add the binary columns and flip result bits to submit"
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
    const isSprint = (bitmasterState.selectedGameMode === 'sprint');

    bitmasterState.isSprint = isSprint;
    bitmasterState.currentQuestionIndex = 0;
    bitmasterState.mistakesThisRound = 0;
    bitmasterState.currentQuestionMistakes = 0;
    bitmasterState.correctThisRound = 0;
    bitmasterState.startTime = Date.now();
    bitmasterState.elapsedSeconds = 0;
    bitmasterState.sprintTimeLeft = 60;
    bitmasterState.totalQuestions = isSprint ? 999 : 10;
    bitmasterState.keypadBuffer = "";

    const timerEl = document.getElementById('bitmasterTimerDisplay');
    const counterEl = document.getElementById('bitmasterQuestionCounter');
    const mistakeEl = document.getElementById('bitmasterMistakeCounter');
    const barEl = document.getElementById('bitmasterProgressBar');

    if (mistakeEl) {
      mistakeEl.textContent = '⚠️ Mistakes: 0';
    }

    if (timerEl) {
      timerEl.classList.toggle('sprint-mode', isSprint);
      timerEl.classList.remove('sprint-low');
      timerEl.textContent = isSprint ? '⏱️ 0:60' : '⏱️ 0:00';
    }

    if (counterEl) {
      counterEl.classList.toggle('sprint-counter', isSprint);
      counterEl.textContent = isSprint ? 'Solved: 0' : 'Q 1/10';
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
        ? `Stage ${bitmasterState.activeStage} • Lvl ${bitmasterState.activeLevel} • 60s Sprint`
        : `Stage ${bitmasterState.activeStage} • Lvl ${bitmasterState.activeLevel} • 10 Questions`;
    }

    showBitmasterScreen('game');
    loadNextBitmasterQuestion();
  }

  function updateBitmasterMistakeCounter() {
    const el = document.getElementById('bitmasterMistakeCounter');
    if (el) {
      el.textContent = `⚠️ Mistakes: ${bitmasterState.mistakesThisRound}`;
    }
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
    bitmasterState.currentQuestionMistakes = 0;

    const counterEl = document.getElementById('bitmasterQuestionCounter');
    const barEl = document.getElementById('bitmasterProgressBar');
    if (counterEl) {
      if (bitmasterState.isSprint) {
        counterEl.textContent = `Solved: ${bitmasterState.correctThisRound}`;
      } else {
        counterEl.textContent = `Q ${bitmasterState.currentQuestionIndex}/${bitmasterState.totalQuestions}`;
      }
    }
    if (barEl && !bitmasterState.isSprint) {
      barEl.style.width = `${(bitmasterState.currentQuestionIndex / bitmasterState.totalQuestions) * 100}%`;
    }

    const challengeCard = document.getElementById('bitmasterChallengeCard');
    if (challengeCard) {
      challengeCard.style.display = bitmasterState.currentQuestion.type === 'hex_nibbles' ? 'none' : 'block';
    }

    const promptEl = document.getElementById('bitmasterPromptLabel');
    const mainDispEl = document.getElementById('bitmasterMainDisplay');
    const hintEl = document.getElementById('bitmasterHintSubtext');

    if (promptEl) promptEl.textContent = bitmasterState.currentQuestion.prompt;
    if (mainDispEl) {
      if (bitmasterState.currentQuestion.displayHTML) {
        mainDispEl.innerHTML = bitmasterState.currentQuestion.displayHTML;
        mainDispEl.classList.add('has-strip');
        mainDispEl.classList.remove('is-question-text');
        mainDispEl.style.whiteSpace = 'normal';
      } else {
        mainDispEl.textContent = bitmasterState.currentQuestion.display;
        mainDispEl.classList.remove('has-strip');
        const isLongText = Boolean(bitmasterState.currentQuestion.isQuestionDisplay) || 
          (typeof bitmasterState.currentQuestion.display === 'string' && 
           bitmasterState.currentQuestion.display.length > 25 && 
           !bitmasterState.currentQuestion.display.includes('➔') && 
           !bitmasterState.currentQuestion.display.includes('<<') && 
           !bitmasterState.currentQuestion.display.includes('>>'));
        if (isLongText) {
          mainDispEl.classList.add('is-question-text');
          mainDispEl.style.whiteSpace = 'normal';
        } else {
          mainDispEl.classList.remove('is-question-text');
          mainDispEl.style.whiteSpace = 'nowrap';
        }
      }
    }
    if (hintEl) hintEl.textContent = bitmasterState.currentQuestion.hint || '';

    const tilesZone = document.getElementById('bitmasterTilesZone');
    const switchZone = document.getElementById('bitmasterSwitchboardZone');
    const keypadZone = document.getElementById('bitmasterKeypadZone');
    const mathZone = document.getElementById('bitmasterMathGridZone');
    const hexZone = document.getElementById('bitmasterHexNibblesZone');

    if (bitmasterState.currentQuestion.type === 'mc') {
      if (tilesZone) tilesZone.style.display = 'grid';
      if (switchZone) switchZone.style.display = 'none';
      if (keypadZone) keypadZone.style.display = 'none';
      if (mathZone) mathZone.style.display = 'none';
      if (hexZone) hexZone.style.display = 'none';
      renderBitmasterMCTiles(bitmasterState.currentQuestion.options, bitmasterState.currentQuestion.layout);
    } else if (bitmasterState.currentQuestion.type === 'switches') {
      if (tilesZone) tilesZone.style.display = 'none';
      if (switchZone) {
        switchZone.style.display = 'flex';
        renderBitmasterSwitchboard(
          bitmasterState.currentQuestion.bitsCount,
          bitmasterState.currentQuestion.blind,
          bitmasterState.currentQuestion.isTwosComp,
          bitmasterState.currentQuestion.referenceBits,
          bitmasterState.currentQuestion.referenceLabel
        );
      }
      if (keypadZone) keypadZone.style.display = 'none';
      if (mathZone) mathZone.style.display = 'none';
      if (hexZone) hexZone.style.display = 'none';
    } else if (bitmasterState.currentQuestion.type === 'hex_nibbles') {
      if (tilesZone) tilesZone.style.display = 'none';
      if (switchZone) switchZone.style.display = 'none';
      if (keypadZone) keypadZone.style.display = 'none';
      if (mathZone) mathZone.style.display = 'none';
      if (hexZone) {
        hexZone.style.display = 'flex';
        renderBitmasterHexNibbles(bitmasterState.currentQuestion);
      }
    } else if (bitmasterState.currentQuestion.type === 'keypad') {
      if (tilesZone) tilesZone.style.display = 'none';
      if (switchZone) switchZone.style.display = 'none';
      if (keypadZone) {
        keypadZone.style.display = 'flex';
        renderBitmasterKeypad();
      }
      if (mathZone) mathZone.style.display = 'none';
      if (hexZone) hexZone.style.display = 'none';
    } else if (bitmasterState.currentQuestion.type === 'math_grid') {
      if (tilesZone) tilesZone.style.display = 'none';
      if (switchZone) switchZone.style.display = 'none';
      if (keypadZone) keypadZone.style.display = 'none';
      if (hexZone) hexZone.style.display = 'none';
      if (mathZone) {
        mathZone.style.display = 'flex';
        renderBitmasterMathGrid(bitmasterState.currentQuestion);
      }
    }
  }

  function renderBitmasterMCTiles(options, layout) {
    const tilesZone = document.getElementById('bitmasterTilesZone');
    if (!tilesZone) return;
    tilesZone.innerHTML = '';

    const maxLen = Math.max(...options.map(opt => String(opt).length));
    const isLongText = maxLen > 22 || options.some(opt => String(opt).length > 20);

    if (layout === 'bit_boxes') {
      tilesZone.className = 'bitmaster-tiles-grid bitmaster-bit-boxes-row';
    } else if (isLongText && options.length <= 4) {
      // Long text options: stack vertically in 1 column so they are comfortable to read
      tilesZone.className = 'bitmaster-tiles-grid bitmaster-tiles-stacked';
    } else if (options.length === 2) {
      // Direct comparison (e.g. Which is bigger X or Y): 2 prominent side-by-side buttons
      tilesZone.className = 'bitmaster-tiles-grid bitmaster-tiles-2col';
    } else if (options.length === 3) {
      tilesZone.className = 'bitmaster-tiles-grid bitmaster-tiles-3col';
    } else {
      tilesZone.className = 'bitmaster-tiles-grid';
    }

    options.forEach(opt => {
      const btn = document.createElement('button');
      const optStr = String(opt);
      const isTextTile = optStr.length > 12 || isLongText;
      btn.className = 'bitmaster-tile-btn' + 
                      (layout === 'bit_boxes' ? ' bit-box-btn' : '') + 
                      (isTextTile ? ' is-text-tile' : '');
      btn.textContent = optStr;

      btn.addEventListener('click', () => {
        playSynthSound('tap');
        handleBitmasterMCAnswer(opt, btn);
      });

      tilesZone.appendChild(btn);
    });
  }

  function handleBitmasterMCAnswer(chosenVal, clickedBtn) {
    const isCorrect = String(chosenVal).trim() === String(bitmasterState.currentQuestion.correctAnswer).trim();

    if (isCorrect) {
      const allButtons = document.querySelectorAll('.bitmaster-tile-btn');
      allButtons.forEach(b => b.style.pointerEvents = 'none');
      clickedBtn.classList.add('correct');
      playSynthSound('correct');
      bitmasterState.correctThisRound++;
      const earnedXp = bitmasterState.currentQuestionMistakes === 0 ? 15 : 5;
      bitmasterState.xp += earnedXp;
      updateBitmasterHUD();
      if (bitmasterState.isSprint) {
        const counterEl = document.getElementById('bitmasterQuestionCounter');
        if (counterEl) counterEl.textContent = `Solved: ${bitmasterState.correctThisRound}`;
        setTimeout(() => {
          loadNextBitmasterQuestion();
        }, 180);
      } else {
        setTimeout(() => {
          loadNextBitmasterQuestion();
        }, 450);
      }
    } else {
      playSynthSound('wrong');
      bitmasterState.mistakesThisRound++;
      bitmasterState.currentQuestionMistakes++;
      updateBitmasterMistakeCounter();

      if (bitmasterState.isSprint) {
        clickedBtn.classList.add('wrong');
        const allButtons = document.querySelectorAll('.bitmaster-tile-btn');
        allButtons.forEach(b => {
          b.style.pointerEvents = 'none';
          if (b.textContent.trim() === String(bitmasterState.currentQuestion.correctAnswer).trim()) {
            b.classList.add('correct');
          }
        });
        setTimeout(() => {
          loadNextBitmasterQuestion();
        }, 350);
      } else {
        clickedBtn.classList.add('wrong', 'shake-wrong');
        clickedBtn.disabled = true;
        clickedBtn.style.pointerEvents = 'none';
        clickedBtn.style.opacity = '0.5';
        showBitmasterToast('Not quite! Try another answer.', '❌', 1400);
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

  function showBitmasterExitModal() {
    const modal = document.getElementById('bitmasterModalExit');
    if (modal) {
      modal.style.display = 'flex';
      playSynthSound('tap');
    }
  }

  function hideBitmasterExitModal() {
    const modal = document.getElementById('bitmasterModalExit');
    if (modal) modal.style.display = 'none';
  }

  function applyBitmasterTheme(themeId, save = true) {
    const validThemes = ['cyber-neon', 'natural-breeze', 'sunset-horizon'];
    const chosenTheme = validThemes.includes(themeId) ? themeId : 'cyber-neon';

    const arena = document.getElementById('bitmasterArena');
    if (arena) {
      arena.setAttribute('data-theme', chosenTheme);
    }

    if (save) {
      try {
        localStorage.setItem('bitmaster_theme', chosenTheme);
      } catch (err) {
        // Local storage might be blocked or unavailable
      }
    }

    // Update active states on cards in theme grid
    const themeCards = document.querySelectorAll('#bitmasterThemesGrid .star-theme-card');
    themeCards.forEach((card) => {
      const isCurrent = card.getAttribute('data-theme-id') === chosenTheme;
      card.classList.toggle('active', isCurrent);
      const statusEl = card.querySelector('.theme-card-status');
      if (statusEl) {
        statusEl.textContent = isCurrent ? 'Active' : 'Equip';
      }
    });
  }

  function showBitmasterStarVaultModal() {
    const modal = document.getElementById('bitmasterModalStarVault');
    const tallyEl = document.getElementById('bitmasterVaultStarsTally');
    if (tallyEl) {
      tallyEl.textContent = calculateBitmasterStars();
    }
    const currentTheme = localStorage.getItem('bitmaster_theme') || 'cyber-neon';
    applyBitmasterTheme(currentTheme, false);

    if (modal) {
      modal.style.display = 'flex';
      playSynthSound('tap');
    }
  }

  function hideBitmasterStarVaultModal() {
    const modal = document.getElementById('bitmasterModalStarVault');
    if (modal) {
      modal.style.display = 'none';
      playSynthSound('tap');
    }
  }

  function renderBitmasterSwitchboard(bitsCount = 8, isBlind = false, isTwosComp = false, referenceBits = null, referenceLabel = null) {
    // Handle Optional Reference Row (e.g. Stage 10 Two's Complement Negation where original +ve bits are shown directly above)
    const refRowEl = document.getElementById('bitmasterSwitchReferenceRow');
    const refBitsContainer = document.getElementById('bitmasterSwitchRefBits');
    const refLabelEl = document.getElementById('bitmasterSwitchRefLabel');

    if (refRowEl && refBitsContainer) {
      if (Array.isArray(referenceBits) && referenceBits.length > 0) {
        refRowEl.style.display = 'flex';
        if (refLabelEl && referenceLabel) {
          refLabelEl.textContent = referenceLabel;
        }
        refBitsContainer.className = 'switch-ref-bits-flex' + (bitsCount === 4 ? ' bits-4' : ' bits-8');
        refBitsContainer.innerHTML = '';
        referenceBits.forEach(b => {
          const refCell = document.createElement('div');
          refCell.className = 'switch-ref-cell' + (b === 1 ? ' bit-1' : '');
          refCell.innerHTML = `<span class="switch-ref-cell-val">${b}</span>`;
          refBitsContainer.appendChild(refCell);
        });
      } else {
        refRowEl.style.display = 'none';
        refBitsContainer.innerHTML = '';
      }
    }

    const container = document.getElementById('bitmasterSwitchBitsContainer');
    if (!container) return;
    container.innerHTML = '';
    container.className = 'switch-bits-flex' + (bitsCount === 4 ? ' bits-4' : ' bits-8');
    bitmasterState.switchBits = new Array(bitsCount).fill(0);

    const weights = bitsCount === 4 ? [8, 4, 2, 1] : [128, 64, 32, 16, 8, 4, 2, 1];
    if (isTwosComp) {
      weights[0] = bitsCount === 4 ? -8 : -128;
    }

    weights.forEach((w, idx) => {
      const bitBtn = document.createElement('div');
      bitBtn.className = 'bitmaster-switch-cell';
      const label = w < 0 ? String(w) : (isTwosComp ? '+' + w : String(w));
      bitBtn.innerHTML = `
        <span class="switch-cell-pv">${label}</span>
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

    const sumWrap = document.getElementById('bitmasterSwitchSumWrap');
    if (sumWrap) {
      sumWrap.style.display = isBlind ? 'none' : 'block';
    }
    updateBitmasterSwitchSum(weights, isBlind);

    const submitBtn = document.getElementById('bitmasterSubmitSwitchBtn');
    if (submitBtn) {
      submitBtn.onclick = () => {
        let currentTotal = 0;
        weights.forEach((w, idx) => {
          if (bitmasterState.switchBits[idx] === 1) currentTotal += w;
        });
        const currentBin = bitmasterState.switchBits.join('');
        const q = bitmasterState.currentQuestion;

        const isCorrect = (q.targetBinary && currentBin === q.targetBinary) ||
                          (currentTotal === q.correctAnswer);

        if (isCorrect) {
          playSynthSound('correct');
          bitmasterState.correctThisRound++;
          const earnedXp = bitmasterState.currentQuestionMistakes === 0 ? 20 : 8;
          bitmasterState.xp += earnedXp;
          updateBitmasterHUD();
          loadNextBitmasterQuestion();
        } else {
          playSynthSound('wrong');
          bitmasterState.mistakesThisRound++;
          bitmasterState.currentQuestionMistakes++;
          updateBitmasterMistakeCounter();
          container.classList.add('shake-wrong');
          setTimeout(() => container.classList.remove('shake-wrong'), 500);

          if (bitmasterState.isSprint) {
            if (q.targetBinary) {
              const expectedFmt = bitsCount === 8 ? `${q.targetBinary.slice(0, 4)} ${q.targetBinary.slice(4)}` : q.targetBinary;
              showBitmasterToast(`Target was ${expectedFmt}`, '❌', 850, () => {
                loadNextBitmasterQuestion();
              });
            } else {
              showBitmasterToast(`Target was ${q.correctAnswer}`, '❌', 850, () => {
                loadNextBitmasterQuestion();
              });
            }
          } else {
            if (q.targetBinary) {
              const currentFmt = bitsCount === 8 ? `${currentBin.slice(0, 4)} ${currentBin.slice(4)}` : currentBin;
              showBitmasterToast(`Switches make ${currentFmt} (${currentTotal}). Adjust the bits and try again!`, '❌', 2200);
            } else {
              showBitmasterToast(`Switches sum to ${currentTotal}, target is ${q.correctAnswer}. Adjust bits and try again!`, '❌', 2000);
            }
          }
        }
      };
    }
  }

  function updateBitmasterSwitchSum(weights, isBlind) {
    let sum = 0;
    weights.forEach((w, idx) => {
      if (bitmasterState.switchBits[idx] === 1) sum += w;
    });
    const sumWrap = document.getElementById('bitmasterSwitchSumWrap');
    if (sumWrap) {
      sumWrap.style.display = isBlind ? 'none' : 'block';
    }
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
      const earnedXp = bitmasterState.currentQuestionMistakes === 0 ? 20 : 8;
      bitmasterState.xp += earnedXp;
      updateBitmasterHUD();
      if (bitmasterState.isSprint) {
        const counterEl = document.getElementById('bitmasterQuestionCounter');
        if (counterEl) counterEl.textContent = `Solved: ${bitmasterState.correctThisRound}`;
        setTimeout(() => loadNextBitmasterQuestion(), 200);
      } else {
        loadNextBitmasterQuestion();
      }
    } else {
      playSynthSound('wrong');
      bitmasterState.mistakesThisRound++;
      bitmasterState.currentQuestionMistakes++;
      updateBitmasterMistakeCounter();
      const dispEl = document.getElementById('bitmasterKeypadDisplay');
      if (dispEl) {
        dispEl.classList.add('shake-wrong');
        setTimeout(() => dispEl.classList.remove('shake-wrong'), 500);
      }

      if (bitmasterState.isSprint) {
        showBitmasterToast(`Not quite! Expected ${bitmasterState.currentQuestion.correctAnswer}`, '❌', 850, () => {
          loadNextBitmasterQuestion();
        });
      } else {
        bitmasterState.keypadBuffer = "";
        if (dispEl) dispEl.textContent = '_';
        showBitmasterToast(`Not quite! Re-enter your answer and press OK.`, '❌', 1800);
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
    bitmasterState.mathRowBBits = new Array(numBits).fill(0);

    const rows = [placeRow, rowA, rowB, resultRow];
    rows.forEach(r => r.style.setProperty('--math-cols', numBits));

    // 1. Header Place Values Row
    placeRow.innerHTML = `<span class="math-row-op"></span>` + 
      question.placeValues.map(pv => `<span class="math-pv-cell">${pv}</span>`).join('');

    // 2. Operand Row A
    rowA.innerHTML = `<span class="math-row-op"></span>` + 
      question.bitsA.map(b => `<span class="math-bit-cell ${b === 1 ? 'bit-is-1' : ''}">${b}</span>`).join('');

    // 3. Operand Row B with Operator
    if (question.isShiftGrid) {
      rowB.className = 'math-grid-shift-row';
      const isLeft = question.isLeft;
      const arrow = isLeft ? '◀◀' : '▶▶';
      const mathEffect = isLeft ? `×${Math.pow(2, question.shiftAmount)}` : `÷${Math.pow(2, question.shiftAmount)}`;
      rowB.innerHTML = `
        <div class="math-shift-flow-bar ${isLeft ? 'shift-left' : 'shift-right'}">
          <span class="shift-flow-arrow">${arrow}</span>
          <span class="shift-flow-label">Shift ${isLeft ? 'Left' : 'Right'} by ${question.shiftAmount} Bit${question.shiftAmount > 1 ? 's' : ''} (${mathEffect})</span>
          <span class="shift-flow-arrow">${arrow}</span>
        </div>
      `;
    } else if (question.interactiveRowB) {
      rowB.className = 'math-grid-operand-row';
      rowB.innerHTML = `<span class="math-row-op op-symbol" title="Two's Complement Addition: A + (-B)">${question.operator || '+'}</span>`;
      for (let i = 0; i < numBits; i++) {
        const flipBtnB = document.createElement('button');
        flipBtnB.type = 'button';
        flipBtnB.className = 'math-flip-cell';
        flipBtnB.textContent = '0';
        flipBtnB.setAttribute('data-idx', i);
        flipBtnB.setAttribute('aria-label', `Row B bit for column ${question.placeValues[i]}`);
        flipBtnB.addEventListener('click', () => {
          const cur = bitmasterState.mathRowBBits[i] || 0;
          const next = cur === 1 ? 0 : 1;
          bitmasterState.mathRowBBits[i] = next;
          flipBtnB.textContent = String(next);
          flipBtnB.classList.toggle('active-1', next === 1);
          playSynthSound('switch');
        });
        rowB.appendChild(flipBtnB);
      }
    } else {
      rowB.className = 'math-grid-operand-row';
      rowB.innerHTML = `<span class="math-row-op op-symbol">${question.operator || '+'}</span>` + 
        (question.bitsB || []).map(b => {
          return `<span class="math-bit-cell ${b === 1 ? 'bit-is-1' : ''}">${b}</span>`;
        }).join('');
    }

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
    const q = bitmasterState.currentQuestion;
    const resultRow = document.getElementById('bitmasterMathResultRow');
    const rowB = document.getElementById('bitmasterMathRowB');

    if (q.interactiveRowB) {
      const userRowB = bitmasterState.mathRowBBits.join('');
      if (userRowB !== q.correctRowB) {
        playSynthSound('wrong');
        bitmasterState.mistakesThisRound++;
        bitmasterState.currentQuestionMistakes++;
        updateBitmasterMistakeCounter();
        if (rowB) {
          rowB.classList.add('shake-wrong');
          setTimeout(() => rowB.classList.remove('shake-wrong'), 500);
        }
        showBitmasterToast(`Check Row B! Remember: invert +${q.valB} (0↔1) and add 1 to make −${q.valB}. Try again!`, '❌', 2400);
        return;
      }
    }

    const userAns = bitmasterState.mathResultBits.join('');
    const isCorrect = userAns === q.correctAnswer;

    if (isCorrect) {
      playSynthSound('correct');
      bitmasterState.correctThisRound++;
      const earnedXp = bitmasterState.currentQuestionMistakes === 0 ? 20 : 8;
      bitmasterState.xp += earnedXp;
      updateBitmasterHUD();
      if (bitmasterState.isSprint) {
        const counterEl = document.getElementById('bitmasterQuestionCounter');
        if (counterEl) counterEl.textContent = `Solved: ${bitmasterState.correctThisRound}`;
        setTimeout(() => loadNextBitmasterQuestion(), 200);
      } else {
        setTimeout(() => loadNextBitmasterQuestion(), 400);
      }
    } else {
      playSynthSound('wrong');
      bitmasterState.mistakesThisRound++;
      bitmasterState.currentQuestionMistakes++;
      updateBitmasterMistakeCounter();
      if (resultRow) {
        resultRow.classList.add('shake-wrong');
        setTimeout(() => resultRow.classList.remove('shake-wrong'), 500);
      }

      if (bitmasterState.isSprint) {
        showBitmasterToast(`Incorrect! Expected: ${q.correctAnswer}`, '❌', 850, () => {
          loadNextBitmasterQuestion();
        });
      } else {
        if (q.interactiveRowB) {
          showBitmasterToast(`Row B is correct (−${q.valB}), but check your addition in the Result row! Try again.`, '❌', 2400);
        } else if (q.isShiftGrid) {
          showBitmasterToast(`Not quite! Shift all bits by ${q.valB} and check zeros. Try again!`, '❌', 2200);
        } else if (q.operator === '−') {
          showBitmasterToast(`Not quite! Subtract each column (1−0=1, 1−1=0, 0−0=0) and try again.`, '❌', 2200);
        } else {
          showBitmasterToast(`Not quite! Check each binary addition column (1+1=0 carry 1) and try again.`, '❌', 2200);
        }
      }
    }
  }

  // =========================================================================
  // INTERACTION ZONE E: HEX DIGITS WITH FLIPPABLE NIBBLE BITS
  // =========================================================================

  function renderBitmasterHexNibbles(question) {
    const container = document.getElementById('bitmasterHexNibblesContainer');
    const assembledEl = document.getElementById('bitmasterHexAssembledBin');
    const currentValWrap = document.getElementById('bitmasterHexCurrentValWrap');
    const headingEl = document.getElementById('bitmasterHexHeading');
    const submitBtn = document.getElementById('bitmasterSubmitHexNibblesBtn');
    if (!container) return;

    const nibbleCount = question.nibblesCount || 1;
    if (headingEl) {
      headingEl.textContent = nibbleCount === 1
        ? 'Convert the Following Hex Digit to Binary'
        : 'Convert the Following Hex Byte to Binary';
    }

    // Each nibble has 4 bits [b3, b2, b1, b0] corresponding to weights [8, 4, 2, 1]
    bitmasterState.hexNibbleBits = Array.from({ length: nibbleCount }, () => [0, 0, 0, 0]);

    container.innerHTML = '';

    for (let nIdx = 0; nIdx < nibbleCount; nIdx++) {
      const hexChar = question.hexDigits[nIdx];
      const denVal = question.hexDenaryValues[nIdx];
      const card = document.createElement('div');
      card.className = 'hex-nibble-card';

      const header = document.createElement('div');
      header.className = 'hex-nibble-card-header';
      const label = nibbleCount === 1 ? 'Hex Digit' : (nIdx === 0 ? 'High Nibble' : 'Low Nibble');
      header.innerHTML = `
        <div class="hex-nibble-card-title-row">
          <span class="hex-nibble-card-tag">${label}</span>
          ${question.showDenaryHint ? `<span class="hex-nibble-denary-hint">= ${denVal}</span>` : ''}
        </div>
        <div class="hex-digit-badge">0x${hexChar}</div>
      `;
      card.appendChild(header);

      const bitsRow = document.createElement('div');
      bitsRow.className = 'hex-nibble-bits-row';

      const weights = [8, 4, 2, 1];
      for (let bIdx = 0; bIdx < 4; bIdx++) {
        const col = document.createElement('div');
        col.className = 'hex-bit-col';

        const weightLabel = document.createElement('span');
        weightLabel.className = 'hex-bit-weight';
        weightLabel.textContent = weights[bIdx];

        const flipBtn = document.createElement('button');
        flipBtn.type = 'button';
        flipBtn.className = 'bitmaster-flip-btn';
        flipBtn.textContent = '0';
        flipBtn.setAttribute('data-nibble', nIdx);
        flipBtn.setAttribute('data-bit', bIdx);
        flipBtn.setAttribute('aria-label', `${label} weight ${weights[bIdx]} bit switch`);

        flipBtn.addEventListener('click', () => {
          const cur = bitmasterState.hexNibbleBits[nIdx][bIdx];
          const next = cur === 1 ? 0 : 1;
          bitmasterState.hexNibbleBits[nIdx][bIdx] = next;
          flipBtn.textContent = String(next);
          flipBtn.classList.toggle('active', next === 1);
          playSynthSound('switch');
          updateHexNibblesDisplay();
        });

        col.appendChild(weightLabel);
        col.appendChild(flipBtn);
        bitsRow.appendChild(col);
      }

      card.appendChild(bitsRow);
      container.appendChild(card);
    }

    function updateHexNibblesDisplay() {
      if (currentValWrap) {
        currentValWrap.style.display = question.showLiveHex ? 'inline-flex' : 'none';
      }
      if (!assembledEl) return;
      if (nibbleCount === 1) {
        const den0 = (bitmasterState.hexNibbleBits[0][0] * 8) + (bitmasterState.hexNibbleBits[0][1] * 4) + (bitmasterState.hexNibbleBits[0][2] * 2) + (bitmasterState.hexNibbleBits[0][3] * 1);
        assembledEl.textContent = `0x${den0.toString(16).toUpperCase()}`;
      } else {
        const den0 = (bitmasterState.hexNibbleBits[0][0] * 8) + (bitmasterState.hexNibbleBits[0][1] * 4) + (bitmasterState.hexNibbleBits[0][2] * 2) + (bitmasterState.hexNibbleBits[0][3] * 1);
        const den1 = (bitmasterState.hexNibbleBits[1][0] * 8) + (bitmasterState.hexNibbleBits[1][1] * 4) + (bitmasterState.hexNibbleBits[1][2] * 2) + (bitmasterState.hexNibbleBits[1][3] * 1);
        assembledEl.textContent = `0x${den0.toString(16).toUpperCase()}${den1.toString(16).toUpperCase()}`;
      }
    }

    updateHexNibblesDisplay();

    if (submitBtn) {
      submitBtn.onclick = () => {
        handleBitmasterHexNibblesSubmit();
      };
    }
  }

  function handleBitmasterHexNibblesSubmit() {
    const container = document.getElementById('bitmasterHexNibblesContainer');
    const nibbleCount = bitmasterState.hexNibbleBits.length;
    const userAns = nibbleCount === 1
      ? bitmasterState.hexNibbleBits[0].join('')
      : bitmasterState.hexNibbleBits[0].join('') + bitmasterState.hexNibbleBits[1].join('');

    const isCorrect = userAns === bitmasterState.currentQuestion.correctBinary;

    if (isCorrect) {
      playSynthSound('correct');
      bitmasterState.correctThisRound++;
      const earnedXp = bitmasterState.currentQuestionMistakes === 0 ? 20 : 8;
      bitmasterState.xp += earnedXp;
      updateBitmasterHUD();
      if (bitmasterState.isSprint) {
        const counterEl = document.getElementById('bitmasterQuestionCounter');
        if (counterEl) counterEl.textContent = `Solved: ${bitmasterState.correctThisRound}`;
        setTimeout(() => loadNextBitmasterQuestion(), 200);
      } else {
        setTimeout(() => loadNextBitmasterQuestion(), 400);
      }
    } else {
      playSynthSound('wrong');
      bitmasterState.mistakesThisRound++;
      bitmasterState.currentQuestionMistakes++;
      updateBitmasterMistakeCounter();
      if (container) {
        container.classList.add('shake-wrong');
        setTimeout(() => container.classList.remove('shake-wrong'), 500);
      }

      const expectedFormatted = nibbleCount === 2
        ? `${bitmasterState.currentQuestion.correctBinary.slice(0, 4)} ${bitmasterState.currentQuestion.correctBinary.slice(4)}`
        : bitmasterState.currentQuestion.correctBinary;
      const userFormatted = nibbleCount === 2
        ? `${userAns.slice(0, 4)} ${userAns.slice(4)}`
        : userAns;

      if (bitmasterState.isSprint) {
        showBitmasterToast(`Incorrect! Expected: ${expectedFormatted}`, '❌', 850, () => {
          loadNextBitmasterQuestion();
        });
      } else {
        showBitmasterToast(`Not quite! Each hex digit equals 4 bits (8 4 2 1). Flip bits and try again!`, '❌', 2200);
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
      canvas.style.zIndex = '99999';
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const width = canvas.width = window.innerWidth;
      const height = canvas.height = window.innerHeight;

      const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#38bdf8', '#fbbf24', '#f43f5e'];
      const particles = [];
      const numParticles = 100;

      for (let i = 0; i < numParticles; i++) {
        const originX = (i % 2 === 0) ? width * 0.3 : width * 0.7;
        const originY = height * 0.6;
        particles.push({
          x: originX,
          y: originY,
          vx: (i % 2 === 0 ? 1 : -1) * (Math.random() * 8 + 3) + (Math.random() - 0.5) * 6,
          vy: -(Math.random() * 14 + 10),
          size: Math.random() * 9 + 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 12,
          isCircle: Math.random() > 0.6
        });
      }

      const startTime = performance.now();
      function animate(time) {
        const elapsed = time - startTime;
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.38;
          p.rotation += p.vRot;
          p.alpha = Math.max(0, 1 - elapsed / 2600);

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          if (p.isCircle) {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
          }
          ctx.restore();
        });

        if (elapsed < 2600) {
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
  window.fireConfetti = fireConfetti;

  function animateNumberCounter(el, start, end, duration) {
    if (!el) return;
    const startTime = performance.now();
    function tick(now) {
      const p = Math.min((now - startTime) / duration, 1);
      const val = Math.floor(start + (end - start) * p);
      el.textContent = `${val.toLocaleString()} pts`;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = `${end.toLocaleString()} pts`;
    }
    requestAnimationFrame(tick);
  }

  function finishBitmasterRound() {
    if (bitmasterState.timerInterval) {
      clearInterval(bitmasterState.timerInterval);
      bitmasterState.timerInterval = null;
    }

    const isSprint = bitmasterState.isSprint;
    const stageId = bitmasterState.activeStage;
    const levelId = bitmasterState.activeLevel;
    const stage = BITMASTER_STAGES.find(s => s.id === stageId);
    const saveKey = `s${stageId}_l${levelId}`;
    const record = bitmasterState.levelRecords[saveKey] || {
      best10Q: 0,
      stars10Q: 0,
      best10QTime: 999,
      bestSprint: 0,
      solvedSprint: 0,
      medalSprint: 'none'
    };

    let roundScore = 0;
    let starsEarned = 0;
    let sprintMedal = 'none';

    if (isSprint) {
      const correct = bitmasterState.correctThisRound;
      const mistakes = bitmasterState.mistakesThisRound;
      const totalAttempted = correct + mistakes;
      const accuracy = totalAttempted > 0 ? (correct / totalAttempted) : 0;
      const accuracyBonus = Math.round(correct * 30 * accuracy);
      roundScore = (correct * 100) + accuracyBonus;

      if (correct >= 15) {
        sprintMedal = 'gold';
        starsEarned = 3;
      } else if (correct >= 10) {
        sprintMedal = 'silver';
        starsEarned = 2;
      } else if (correct >= 6) {
        sprintMedal = 'bronze';
        starsEarned = 1;
      } else {
        sprintMedal = 'none';
        starsEarned = 0;
      }
    } else {
      const correct = bitmasterState.correctThisRound;
      const mistakes = bitmasterState.mistakesThisRound;
      const elapsed = bitmasterState.elapsedSeconds;
      const flawlessBonus = (mistakes === 0 && correct === 10) ? 300 : 0;
      const speedBonus = Math.max(0, (60 - elapsed) * 10);
      const mistakePenalty = mistakes * 50;
      roundScore = Math.max(0, (correct * 100) + flawlessBonus + speedBonus - mistakePenalty);

      if (mistakes === 0 && elapsed <= 60 && correct === 10) {
        starsEarned = 3;
      } else if (mistakes <= 2 && correct >= 8) {
        starsEarned = 2;
      } else if (mistakes <= 5 && correct >= 5) {
        starsEarned = 1;
      } else {
        starsEarned = 0;
      }
    }

    const prevBest = isSprint ? (record.bestSprint || 0) : (record.best10Q || 0);
    const isNewRecord = roundScore > prevBest;
    const deltaXp = Math.max(0, roundScore - prevBest);

    // Update level records
    if (isSprint) {
      if (roundScore > (record.bestSprint || 0)) {
        record.bestSprint = roundScore;
      }
      record.solvedSprint = Math.max(record.solvedSprint || 0, bitmasterState.correctThisRound);
      const medalWeights = { gold: 3, silver: 2, bronze: 1, none: 0 };
      if (medalWeights[sprintMedal] > medalWeights[record.medalSprint || 'none']) {
        record.medalSprint = sprintMedal;
      }
    } else {
      if (roundScore > (record.best10Q || 0)) {
        record.best10Q = roundScore;
      }
      record.stars10Q = Math.max(record.stars10Q || 0, starsEarned);
      if (bitmasterState.elapsedSeconds < (record.best10QTime || 999)) {
        record.best10QTime = bitmasterState.elapsedSeconds;
      }
      bitmasterState.stars[saveKey] = Math.max(bitmasterState.stars[saveKey] || 0, starsEarned);
    }
    bitmasterState.levelRecords[saveKey] = record;

    const oldXp = bitmasterState.xp;
    // Compute total XP across all levels
    let totalXp = 0;
    Object.values(bitmasterState.levelRecords).forEach(rec => {
      totalXp += (Number(rec.best10Q) || 0) + (Number(rec.bestSprint) || 0);
    });
    bitmasterState.xp = totalXp;
    const newXp = bitmasterState.xp;

    const oldRank = getRankForXp(oldXp);
    const newRank = getRankForXp(newXp);
    const oldNextRank = getNextRankForXp(oldXp);
    const newNextRank = getNextRankForXp(newXp);
    const isRankUp = newRank.index > oldRank.index;

    let oldPct = 0;
    if (oldNextRank) {
      const span = oldNextRank.minXp - oldRank.minXp;
      oldPct = Math.max(0, Math.min(100, Math.round(((oldXp - oldRank.minXp) / span) * 100)));
    } else {
      oldPct = 100;
    }

    let newPct = 0;
    if (newNextRank) {
      const span = newNextRank.minXp - newRank.minXp;
      newPct = Math.max(0, Math.min(100, Math.round(((newXp - newRank.minXp) / span) * 100)));
    } else {
      newPct = 100;
    }

    saveBitmasterProgress();
    updateBitmasterHUD(true);

    const titleEl = document.getElementById('bitmasterVictoryTitle');
    const badgeEl = document.getElementById('bitmasterVictoryBadge');
    const starsEl = document.getElementById('bitmasterVictoryStars');
    const subtextEl = document.getElementById('bitmasterVictorySubtext');
    const xpEl = document.getElementById('bitmasterVictoryXp');
    const accEl = document.getElementById('bitmasterVictoryAccuracy');
    const mistakesEl = document.getElementById('bitmasterVictoryMistakes');
    const tipEl = document.getElementById('bitmasterVictoryTip');

    if (mistakesEl) {
      mistakesEl.textContent = String(bitmasterState.mistakesThisRound);
    }

    const totalAttempted = bitmasterState.correctThisRound + bitmasterState.mistakesThisRound;
    const accuracy = totalAttempted > 0 ? Math.round((bitmasterState.correctThisRound / totalAttempted) * 100) : 0;
    if (accEl) accEl.textContent = `${accuracy}%`;

    if (isSprint) {
      if (starsEarned === 3) {
        if (badgeEl) badgeEl.textContent = '🥇';
        if (titleEl) titleEl.textContent = 'Gold Medal Sprint!';
        if (starsEl) starsEl.textContent = '⭐⭐⭐';
        fireConfetti();
        setTimeout(fireConfetti, 280);
        playSynthSound('perfect10');
        if (tipEl) tipEl.innerHTML = `🏆 <strong>Legendary Pace!</strong> You solved ${bitmasterState.correctThisRound} problems in 60s! 🥇 Gold Medal achieved! (Score: ${roundScore} pts)`;
      } else if (starsEarned === 2) {
        if (badgeEl) badgeEl.textContent = '🥈';
        if (titleEl) titleEl.textContent = 'Silver Medal Sprint!';
        if (starsEl) starsEl.textContent = '⭐⭐☆';
        playSynthSound('victory');
        if (tipEl) tipEl.innerHTML = `🥈 <strong>Silver Medal!</strong> ${bitmasterState.correctThisRound} solved. To reach Gold: solve 15+ in 60s! (Score: ${roundScore} pts)`;
      } else if (starsEarned === 1) {
        if (badgeEl) badgeEl.textContent = '🥉';
        if (titleEl) titleEl.textContent = 'Bronze Medal Sprint!';
        if (starsEl) starsEl.textContent = '⭐☆☆';
        playSynthSound('victory');
        if (tipEl) tipEl.innerHTML = `🥉 <strong>Bronze Medal!</strong> ${bitmasterState.correctThisRound} solved. To reach Silver: solve 10+ in 60s! (Score: ${roundScore} pts)`;
      } else {
        if (badgeEl) badgeEl.textContent = '⏱️';
        if (titleEl) titleEl.textContent = 'Sprint Finished';
        if (starsEl) starsEl.textContent = '☆☆☆';
        playSynthSound('wrong');
        if (tipEl) tipEl.innerHTML = `💡 <strong>To earn Bronze:</strong> Solve at least 6 problems before the 60s timer expires. Keep training!`;
      }
      if (subtextEl) {
        subtextEl.textContent = `60s Speed Sprint • Score: ${roundScore} pts • ${bitmasterState.correctThisRound} Solved • ${bitmasterState.mistakesThisRound} mistakes` + (isNewRecord ? ' • 🏆 NEW BEST!' : '');
      }
    } else {
      const isFlawlessZeroMistakes = (bitmasterState.mistakesThisRound === 0 && bitmasterState.correctThisRound === 10);
      if (starsEarned === 3 || isFlawlessZeroMistakes) {
        fireConfetti();
        setTimeout(fireConfetti, 280);
        playSynthSound('perfect10');
      }

      if (starsEarned === 3) {
        if (badgeEl) badgeEl.textContent = '👑';
        if (titleEl) titleEl.textContent = 'Flawless Precision!';
        if (starsEl) starsEl.textContent = '⭐⭐⭐';
        if (tipEl) tipEl.innerHTML = `🏆 <strong>Flawless 10/10 Mastery!</strong> Cleared in ${bitmasterState.elapsedSeconds}s with 0 mistakes. Score: ${roundScore} pts!`;
      } else if (starsEarned === 2) {
        if (badgeEl) badgeEl.textContent = '🌟';
        if (titleEl) titleEl.textContent = 'Stage Mastered!';
        if (starsEl) starsEl.textContent = '⭐⭐☆';
        playSynthSound('victory');
        if (tipEl) tipEl.innerHTML = `💡 <strong>To earn 3 Stars:</strong> Complete all 10 with 0 mistakes in &le; 60s (you made ${bitmasterState.mistakesThisRound} mistake${bitmasterState.mistakesThisRound > 1 ? 's' : ''}). Score: ${roundScore} pts.`;
      } else if (starsEarned === 1) {
        if (badgeEl) badgeEl.textContent = '💡';
        if (titleEl) titleEl.textContent = 'Trial Passed';
        if (starsEl) starsEl.textContent = '⭐☆☆';
        playSynthSound('victory');
        if (tipEl) tipEl.innerHTML = `💡 <strong>To earn 2 Stars:</strong> Complete with &le; 2 mistakes (you made ${bitmasterState.mistakesThisRound} mistakes). Score: ${roundScore} pts.`;
      } else {
        if (badgeEl) badgeEl.textContent = '🔄';
        if (titleEl) titleEl.textContent = 'Trial Incomplete';
        if (starsEl) starsEl.textContent = '☆☆☆';
        playSynthSound('wrong');
        if (tipEl) tipEl.innerHTML = `💡 <strong>To pass this level:</strong> Complete with &le; 5 mistakes (you made ${bitmasterState.mistakesThisRound} mistakes). Score: ${roundScore} pts.`;
      }
      if (subtextEl) {
        subtextEl.textContent = `10 Questions • Score: ${roundScore} pts • ${bitmasterState.correctThisRound}/10 Correct • ${bitmasterState.elapsedSeconds}s` + (isNewRecord ? ' • 🏆 NEW BEST!' : '');
      }
    }

    if (xpEl) {
      const diffFormatted = deltaXp > 0 ? `(+${deltaXp.toLocaleString()} pts)` : `(+0 pts)`;
      const trophy = isNewRecord ? ' 🏆' : '';
      xpEl.innerHTML = `${roundScore.toLocaleString()} <span class="stat-diff">${diffFormatted}</span>${trophy}`;
    }

    const metric4LabelEl = document.getElementById('bitmasterVictoryMetric4Label');
    const timeEl = document.getElementById('bitmasterVictoryTime');
    if (timeEl) {
      if (isSprint) {
        if (metric4LabelEl) metric4LabelEl.textContent = 'Solved';
        timeEl.textContent = `${bitmasterState.correctThisRound}`;
      } else {
        if (metric4LabelEl) metric4LabelEl.textContent = 'Time';
        timeEl.textContent = `${bitmasterState.elapsedSeconds}s`;
      }
    }

    // Sequentially animate victory stars
    if (starsEl) {
      starsEl.textContent = '';
      const starIcons = starsEarned === 3 ? ['⭐', '⭐', '⭐'] : (starsEarned === 2 ? ['⭐', '⭐', '☆'] : (starsEarned === 1 ? ['⭐', '☆', '☆'] : ['☆', '☆', '☆']));
      starIcons.forEach((st, idx) => {
        setTimeout(() => {
          starsEl.textContent += st;
          if (st === '⭐') playSynthSound('star');
        }, (idx + 1) * 220);
      });
    }

    if (starsEarned >= 1) {
      fireConfetti();
      if (starsEarned === 3) setTimeout(fireConfetti, 280);
    }

    showBitmasterScreen('summary');

    // Configure and animate Architecture XP Card on victory screen
    const summaryCardEl = document.getElementById('bitmasterSummaryXpCard');
    const summaryRankAvatar = document.getElementById('bitmasterSummaryRankAvatar');
    const summaryRankTier = document.getElementById('bitmasterSummaryRankTier');
    const summaryRankTitle = document.getElementById('bitmasterSummaryRankTitle');
    const summaryXpGainPill = document.getElementById('bitmasterSummaryXpGainPill');
    const summaryXpCur = document.getElementById('bitmasterSummaryXpCur');
    const summaryXpTarget = document.getElementById('bitmasterSummaryXpTarget');
    const summaryXpFill = document.getElementById('bitmasterSummaryXpFill');
    const summaryXpFootnote = document.getElementById('bitmasterSummaryXpFootnote');

    if (summaryCardEl) {
      summaryCardEl.classList.remove('rank-up-flash');
      if (summaryRankAvatar) summaryRankAvatar.innerHTML = getBitmasterAvatarHTML(oldRank, 'summary-avatar');
      if (summaryRankTier) summaryRankTier.textContent = `ARCHITECTURE TIER ${oldRank.id} OF 12`;
      if (summaryRankTitle) {
        summaryRankTitle.textContent = oldRank.title;
        summaryRankTitle.style.color = '#ffffff';
      }
      if (summaryXpGainPill) summaryXpGainPill.textContent = deltaXp > 0 ? `+${deltaXp.toLocaleString()} pts` : `+0 pts`;
      if (summaryXpCur) summaryXpCur.textContent = `${oldXp.toLocaleString()} pts`;
      if (summaryXpTarget) summaryXpTarget.textContent = oldNextRank ? `Next Rank: ${oldNextRank.minXp.toLocaleString()} pts` : 'Max Rank';
      if (summaryXpFill) {
        summaryXpFill.style.transition = 'none';
        summaryXpFill.style.width = `${oldPct}%`;
      }
      if (summaryXpFootnote) {
        summaryXpFootnote.textContent = oldNextRank ? `Need ${Math.max(0, oldNextRank.minXp - oldXp).toLocaleString()} more pts to unlock ${oldNextRank.title}` : 'Maximum Architecture Rank Achieved!';
      }

      // After stars chiming (~700ms), animate XP bar growing forward & trigger level up if earned!
      setTimeout(() => {
        if (summaryXpFill) {
          summaryXpFill.style.transition = 'width 1.1s cubic-bezier(0.16, 1, 0.3, 1)';
        }

        if (isRankUp) {
          if (summaryXpFill) summaryXpFill.style.width = '100%';
          animateNumberCounter(summaryXpCur, oldXp, oldNextRank.minXp, 900);

          setTimeout(() => {
            if (summaryCardEl) summaryCardEl.classList.add('rank-up-flash');
            if (summaryRankAvatar) summaryRankAvatar.innerHTML = getBitmasterAvatarHTML(newRank, 'summary-avatar');
            if (summaryRankTier) summaryRankTier.textContent = `PROMOTED! TIER ${newRank.id} OF 12`;
            if (summaryRankTitle) {
              summaryRankTitle.textContent = newRank.title;
              summaryRankTitle.style.color = '#facc15';
            }
            if (summaryXpTarget) summaryXpTarget.textContent = newNextRank ? `Next Rank: ${newNextRank.minXp.toLocaleString()} pts` : 'Max Rank';
            if (summaryXpFootnote) {
              summaryXpFootnote.textContent = newNextRank ? `Need ${Math.max(0, newNextRank.minXp - newXp).toLocaleString()} more pts to unlock ${newNextRank.title}` : 'Maximum Architecture Rank!';
            }

            playSynthSound('levelup');
            fireConfetti();
            setTimeout(fireConfetti, 280);

            if (summaryXpFill) {
              summaryXpFill.style.transition = 'none';
              summaryXpFill.style.width = '0%';
              setTimeout(() => {
                if (summaryXpFill) {
                  summaryXpFill.style.transition = 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1)';
                  summaryXpFill.style.width = `${newPct}%`;
                }
              }, 60);
            }
            animateNumberCounter(summaryXpCur, oldNextRank.minXp, newXp, 900);

            setTimeout(() => {
              bitmasterState.lastNotifiedRankId = newRank.id;
              localStorage.setItem('bitmaster_last_notified_rank', String(newRank.id));
              showBitmasterLevelUpModal(newRank);
            }, 850);
          }, 1000);
        } else {
          if (summaryXpFill) summaryXpFill.style.width = `${newPct}%`;
          animateNumberCounter(summaryXpCur, oldXp, newXp, 900);
          playSynthSound('tap');
          if (summaryXpFootnote && newNextRank) {
            summaryXpFootnote.textContent = `Need ${Math.max(0, newNextRank.minXp - newXp).toLocaleString()} more pts to unlock ${newNextRank.title}`;
          }
        }
      }, 700);
    }

    const retryBtn = document.getElementById('bitmasterSummaryRetryBtn');
    const contBtn = document.getElementById('bitmasterSummaryContinueBtn');
    const nextLvlBtn = document.getElementById('bitmasterSummaryNextLevelBtn');

    if (nextLvlBtn) {
      const stageLevelCount = stage ? stage.levels.length : 4;
      if (starsEarned >= 1 && bitmasterState.activeLevel < stageLevelCount) {
        nextLvlBtn.style.display = 'inline-flex';
        nextLvlBtn.textContent = `Next Level (Level ${bitmasterState.activeLevel + 1}) \u2192`;
        nextLvlBtn.onclick = () => {
          bitmasterState.activeLevel++;
          playSynthSound('tap');
          startBitmasterRound();
        };
      } else {
        nextLvlBtn.style.display = 'none';
      }
    }

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
  // ARCADE & BIT CROSS LOGIC GRID SYSTEM
  // =========================================================================
  const bitcrossState = {
    size: 4, // 3, 4, 5
    weights: [8, 4, 2, 1],
    targetRows: [0, 0, 0, 0],
    targetCols: [0, 0, 0, 0],
    playerGrid: [], // size x size
    flips: 0,
    startTime: 0,
    elapsedSeconds: 0,
    timerInterval: null,
    isSolved: false
  };

  function getBitcrossWeights(size) {
    if (size === 3) return [4, 2, 1];
    if (size === 5) return [16, 8, 4, 2, 1];
    return [8, 4, 2, 1]; // size 4
  }

  function startBitCrossGame(size = 4) {
    bitcrossState.size = size;
    bitcrossState.weights = getBitcrossWeights(size);
    bitcrossState.flips = 0;
    bitcrossState.isSolved = false;
    bitcrossState.elapsedSeconds = 0;

    // Generate puzzle
    generateBitcrossPuzzle(size);

    // Update size buttons UI
    const sizePills = document.querySelectorAll('.bitcross-size-pill');
    sizePills.forEach(pill => {
      const pSize = parseInt(pill.getAttribute('data-size'), 10);
      pill.classList.toggle('active', pSize === size);
    });

    // Start timer
    startBitcrossTimer();

    // Render board
    renderBitcrossBoard();
    updateBitcrossHUD();

    // Close victory modal if open
    const winModal = document.getElementById('bitcrossVictoryModal');
    if (winModal) winModal.style.display = 'none';

    showBitmasterScreen('bitcross');
  }

  function generateBitcrossPuzzle(size) {
    const weights = bitcrossState.weights;
    let matrix = [];
    let attempts = 0;

    while (attempts < 80) {
      matrix = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => Math.random() < 0.48 ? 1 : 0)
      );

      const rowSums = matrix.map(r => r.reduce((s, bit, c) => s + (bit ? weights[c] : 0), 0));
      const colSums = Array.from({ length: size }, (_, c) =>
        matrix.reduce((s, r, rowIdx) => s + (r[c] ? weights[rowIdx] : 0), 0)
      );

      const maxVal = weights.reduce((a, b) => a + b, 0);
      const totalOnes = matrix.flat().filter(b => b === 1).length;
      const minOnes = Math.max(2, size);
      const maxOnes = (size * size) - Math.max(2, size);

      const hasVariedRows = rowSums.some(s => s > 0 && s < maxVal);
      const hasVariedCols = colSums.some(s => s > 0 && s < maxVal);

      if (totalOnes >= minOnes && totalOnes <= maxOnes && hasVariedRows && hasVariedCols) {
        bitcrossState.targetRows = rowSums;
        bitcrossState.targetCols = colSums;
        break;
      }
      attempts++;
    }

    if (attempts >= 80) {
      bitcrossState.targetRows = matrix.map(r => r.reduce((s, bit, c) => s + (bit ? weights[c] : 0), 0));
      bitcrossState.targetCols = Array.from({ length: size }, (_, c) =>
        matrix.reduce((s, r, rowIdx) => s + (r[c] ? weights[rowIdx] : 0), 0)
      );
    }

    bitcrossState.playerGrid = Array.from({ length: size }, () => Array(size).fill(0));
  }

  function startBitcrossTimer() {
    if (bitcrossState.timerInterval) {
      clearInterval(bitcrossState.timerInterval);
    }
    bitcrossState.startTime = Date.now();
    bitcrossState.elapsedSeconds = 0;
    updateBitcrossTimerDisplay();
    bitcrossState.timerInterval = setInterval(() => {
      bitcrossState.elapsedSeconds = Math.floor((Date.now() - bitcrossState.startTime) / 1000);
      updateBitcrossTimerDisplay();
    }, 1000);
  }

  function stopBitcrossTimer() {
    if (bitcrossState.timerInterval) {
      clearInterval(bitcrossState.timerInterval);
      bitcrossState.timerInterval = null;
    }
  }

  function formatBitcrossTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function updateBitcrossTimerDisplay() {
    const el = document.getElementById('bitcrossTimer');
    if (el) el.textContent = formatBitcrossTime(bitcrossState.elapsedSeconds);
  }

  function calcBitcrossRowSum(r) {
    const weights = bitcrossState.weights;
    return bitcrossState.playerGrid[r].reduce((sum, bit, c) => sum + (bit ? weights[c] : 0), 0);
  }

  function calcBitcrossColSum(c) {
    const weights = bitcrossState.weights;
    return bitcrossState.playerGrid.reduce((sum, row, r) => sum + (row[c] ? weights[r] : 0), 0);
  }

  function renderBitcrossBoard() {
    const container = document.getElementById('bitcrossBoardContainer');
    if (!container) return;
    container.innerHTML = '';

    const size = bitcrossState.size;
    const weights = bitcrossState.weights;

    const board = document.createElement('div');
    board.className = 'bitcross-grid-board';
    board.style.gridTemplateColumns = `auto repeat(${size}, minmax(44px, 58px)) auto`;

    // 1. Top-left corner spacer
    const tlCorner = document.createElement('div');
    tlCorner.className = 'bitcross-empty-spacer';
    board.appendChild(tlCorner);

    // 2. Column Place Value unboxed numbers (Cyan)
    for (let c = 0; c < size; c++) {
      const colNum = document.createElement('div');
      colNum.className = 'bitcross-header-num col-num';
      colNum.textContent = String(weights[c]);
      board.appendChild(colNum);
    }

    // 3. Top-right corner spacer
    const trCorner = document.createElement('div');
    trCorner.className = 'bitcross-empty-spacer';
    board.appendChild(trCorner);

    // 4. Matrix Rows
    for (let r = 0; r < size; r++) {
      // Row place value unboxed number (Pink)
      const rowNum = document.createElement('div');
      rowNum.className = 'bitcross-header-num row-num';
      rowNum.textContent = String(weights[r]);
      board.appendChild(rowNum);

      // Interactive bit cells
      for (let c = 0; c < size; c++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'bitcross-cell-btn' + (bitcrossState.playerGrid[r][c] === 1 ? ' is-active-1' : '');
        cell.setAttribute('data-row', r);
        cell.setAttribute('data-col', c);
        cell.textContent = String(bitcrossState.playerGrid[r][c]);
        cell.setAttribute('aria-label', `Row ${weights[r]}, Column ${weights[c]}, value ${bitcrossState.playerGrid[r][c]}`);

        cell.addEventListener('click', () => {
          toggleBitcrossCell(r, c, cell);
        });

        board.appendChild(cell);
      }

      // Row Target Indicator Readout (Unboxed, turns green when matched)
      const rowTarget = document.createElement('div');
      rowTarget.className = 'bitcross-target-badge';
      rowTarget.id = `bitcrossRowTarget_${r}`;
      rowTarget.innerHTML = `
        <div class="target-val-row">
          <span class="target-cur-val" id="bitcrossRowCur_${r}">0</span>
          <span class="target-sep">/</span>
          <span class="target-goal-val">${bitcrossState.targetRows[r]}</span>
        </div>
      `;
      board.appendChild(rowTarget);
    }

    // 5. Bottom-left corner spacer
    const blCorner = document.createElement('div');
    blCorner.className = 'bitcross-empty-spacer';
    board.appendChild(blCorner);

    for (let c = 0; c < size; c++) {
      const colTarget = document.createElement('div');
      colTarget.className = 'bitcross-target-badge';
      colTarget.id = `bitcrossColTarget_${c}`;
      colTarget.innerHTML = `
        <div class="target-val-row">
          <span class="target-cur-val" id="bitcrossColCur_${c}">0</span>
          <span class="target-sep">/</span>
          <span class="target-goal-val">${bitcrossState.targetCols[c]}</span>
        </div>
      `;
      board.appendChild(colTarget);
    }

    // Bottom-right corner summary badge
    const brCorner = document.createElement('div');
    brCorner.className = 'bitcross-corner-badge';
    brCorner.id = 'bitcrossCornerSummary';
    brCorner.innerHTML = `
      <span class="corner-matches-text" id="bitcrossCornerMatchesText">0 / ${size * 2}</span>
      <span class="corner-status-icon" id="bitcrossCornerStatusIcon">🔒</span>
    `;
    board.appendChild(brCorner);

    container.appendChild(board);
    updateBitcrossBadges();
  }

  function toggleBitcrossCell(r, c, cellBtn) {
    if (bitcrossState.isSolved) return;

    const cur = bitcrossState.playerGrid[r][c];
    const next = cur === 1 ? 0 : 1;
    bitcrossState.playerGrid[r][c] = next;
    bitcrossState.flips++;

    cellBtn.textContent = String(next);
    cellBtn.classList.toggle('is-active-1', next === 1);
    cellBtn.setAttribute('aria-label', `Row ${bitcrossState.weights[r]}, Column ${bitcrossState.weights[c]}, value ${next}`);

    playSynthSound('switch');
    updateBitcrossBadges();
    updateBitcrossHUD();
    checkBitcrossWin();
  }

  function updateBitcrossBadges() {
    const size = bitcrossState.size;
    let matchedCount = 0;

    // Check Rows
    for (let r = 0; r < size; r++) {
      const curSum = calcBitcrossRowSum(r);
      const target = bitcrossState.targetRows[r];
      const isMatch = curSum === target;
      if (isMatch) matchedCount++;

      const badge = document.getElementById(`bitcrossRowTarget_${r}`);
      const curEl = document.getElementById(`bitcrossRowCur_${r}`);

      if (curEl) curEl.textContent = String(curSum);
      if (badge) badge.classList.toggle('is-matched', isMatch);
    }

    // Check Columns
    for (let c = 0; c < size; c++) {
      const curSum = calcBitcrossColSum(c);
      const target = bitcrossState.targetCols[c];
      const isMatch = curSum === target;
      if (isMatch) matchedCount++;

      const badge = document.getElementById(`bitcrossColTarget_${c}`);
      const curEl = document.getElementById(`bitcrossColCur_${c}`);

      if (curEl) curEl.textContent = String(curSum);
      if (badge) badge.classList.toggle('is-matched', isMatch);
    }

    const totalTargets = size * 2;
    const cornerText = document.getElementById('bitcrossCornerMatchesText');
    const cornerIcon = document.getElementById('bitcrossCornerStatusIcon');
    if (cornerText) cornerText.textContent = `${matchedCount} / ${totalTargets}`;
    if (cornerIcon) cornerIcon.textContent = matchedCount === totalTargets ? '🔓' : '🔒';

    const matchesEl = document.getElementById('bitcrossMatches');
    if (matchesEl) matchesEl.textContent = `${matchedCount} / ${totalTargets}`;

    return matchedCount === totalTargets;
  }

  function updateBitcrossHUD() {
    const flipsEl = document.getElementById('bitcrossFlips');
    if (flipsEl) flipsEl.textContent = String(bitcrossState.flips);
  }

  function checkBitcrossWin() {
    const isWin = updateBitcrossBadges();
    if (!isWin || bitcrossState.isSolved) return;

    bitcrossState.isSolved = true;
    stopBitcrossTimer();

    // Reward XP based on size
    const xpRewards = { 3: 150, 4: 300, 5: 500 };
    const earnedXp = xpRewards[bitcrossState.size] || 300;
    bitmasterState.xp += earnedXp;
    saveBitmasterProgress();
    updateBitmasterHUD();

    // Audio victory chime & Confetti
    try {
      playSynthSound('victory');
    } catch (e) {}
    fireConfetti();

    // Show Victory Overlay Modal
    setTimeout(() => {
      const modal = document.getElementById('bitcrossVictoryModal');
      const sizeEl = document.getElementById('bitcrossVictoryGridSize');
      const timeEl = document.getElementById('bitcrossVictoryTime');
      const flipsEl = document.getElementById('bitcrossVictoryFlips');
      const xpEl = document.getElementById('bitcrossVictoryXp');
      const subtextEl = document.getElementById('bitcrossVictorySubtext');

      if (sizeEl) sizeEl.textContent = `${bitcrossState.size}×${bitcrossState.size}`;
      if (timeEl) timeEl.textContent = formatBitcrossTime(bitcrossState.elapsedSeconds);
      if (flipsEl) flipsEl.textContent = `${bitcrossState.flips}`;
      if (xpEl) xpEl.textContent = `+${earnedXp} XP`;
      if (subtextEl) subtextEl.textContent = `Flawless deduction! All ${bitcrossState.size * 2} place-value sums verified!`;
      if (modal) modal.style.display = 'flex';
    }, 600);
  }

  function resetBitcrossGrid() {
    const size = bitcrossState.size;
    bitcrossState.playerGrid = Array.from({ length: size }, () => Array(size).fill(0));
    bitcrossState.flips = 0;
    bitcrossState.isSolved = false;

    renderBitcrossBoard();
    updateBitcrossHUD();
    playSynthSound('tap');
  }

  function exitBitCrossToArcade() {
    stopBitcrossTimer();
    const modal = document.getElementById('bitcrossVictoryModal');
    if (modal) modal.style.display = 'none';

    showBitmasterScreen('title');
  }

  // =========================================================================
  // BIT POP: TACTILE STATIC BUBBLE WRAP ARCADE ENGINE
  // =========================================================================
  const bitpopThemes = ['theme-cyan', 'theme-magenta', 'theme-amber', 'theme-purple', 'theme-emerald'];

  const bitpopState = {
    isRunning: false,
    timer: 50.0,
    timerInterval: null,
    score: 0,
    combo: 1.0,
    maxCombo: 1.0,
    streak: 0,
    poppedCount: 0,
    tier: 0,              // 0: Nibble (0-15), 1: 5-bit (0-31), 2: 6-bit (0-63), 3: 7-bit (0-127), 4: 8-bit (0-255)
    cycleStep: 0,         // 0: Den->Bin, 1: Bin->Den, 2: Den Add->Bin, 3: Bin Add->Den
    roundInStep: 1,       // 1 or 2 (each phase step repeats twice before advancing)
    sheetNumber: 1,
    sheetQuestions: [],   // Array of 8 target question specs for this sheet
    currentQIndex: 0,
    sheetPoppedInCurrent: 0,
    cells: []
  };

  function getBitpopTierConfig(tier) {
    switch (tier) {
      case 0:
        return {
          name: 'NIBBLE',
          title: 'NIBBLE BLITZ (BITS 0–3)',
          bits: 4,
          maxVal: 15,
          minTarget: 1,
          isNibble: true
        };
      case 1:
        return {
          name: '5-BIT BYTE',
          title: '5-BIT EXPANSION (BITS 0–4)',
          bits: 5,
          maxVal: 31,
          minTarget: 16,
          isNibble: false
        };
      case 2:
        return {
          name: '6-BIT BYTE',
          title: '6-BIT EXPANSION (BITS 0–5)',
          bits: 6,
          maxVal: 63,
          minTarget: 32,
          isNibble: false
        };
      case 3:
        return {
          name: '7-BIT BYTE',
          title: '7-BIT EXPANSION (BITS 0–6)',
          bits: 7,
          maxVal: 127,
          minTarget: 64,
          isNibble: false
        };
      default:
        return {
          name: '8-BIT BYTE',
          title: '8-BIT BYTE MASTER (BITS 0–7)',
          bits: 8,
          maxVal: 255,
          minTarget: 128,
          isNibble: false
        };
    }
  }

  function formatBinaryStr(val, bits) {
    return (val >>> 0).toString(2).padStart(bits, '0');
  }

  function startBitPopGame() {
    stopBitpopEngine();
    bitpopState.isRunning = true;
    bitpopState.timer = 50.0;
    bitpopState.score = 0;
    bitpopState.combo = 1.0;
    bitpopState.maxCombo = 1.0;
    bitpopState.streak = 0;
    bitpopState.poppedCount = 0;
    bitpopState.tier = 0;
    bitpopState.cycleStep = 0;
    bitpopState.roundInStep = 1;
    bitpopState.sheetNumber = 1;
    bitpopState.sheetQuestions = [];
    bitpopState.currentQIndex = 0;
    bitpopState.sheetPoppedInCurrent = 0;
    bitpopState.cells = [];

    const modal = document.getElementById('bitpopGameOverModal');
    if (modal) modal.style.display = 'none';

    updateBitpopHUD();
    showBitmasterScreen('bitpop');

    // Generate initial static bubble wrap sheet (3x4 grid of 12 cells with 8 solvable questions)
    initBitpopSheet();

    // Start 100ms countdown timer
    bitpopState.timerInterval = setInterval(updateBitpopTimerTick, 100);
  }

  function stopBitpopEngine() {
    bitpopState.isRunning = false;
    if (bitpopState.timerInterval) {
      clearInterval(bitpopState.timerInterval);
      bitpopState.timerInterval = null;
    }
  }

  function updateBitpopHUD() {
    const timerEl = document.getElementById('bitpopTimer');
    const scoreEl = document.getElementById('bitpopScore');
    const comboEl = document.getElementById('bitpopCombo');
    const poppedEl = document.getElementById('bitpopPoppedStat');
    const progressEl = document.getElementById('bitpopSheetProgress');

    if (timerEl) {
      timerEl.textContent = `${bitpopState.timer.toFixed(1)}s`;
      if (bitpopState.timer <= 6.0) {
        timerEl.classList.add('is-low-time');
      } else {
        timerEl.classList.remove('is-low-time');
      }
    }
    if (scoreEl) {
      scoreEl.textContent = bitpopState.score.toLocaleString();
    }
    if (comboEl) {
      comboEl.textContent = `${bitpopState.combo.toFixed(1)}×`;
    }
    if (poppedEl) {
      poppedEl.textContent = String(bitpopState.poppedCount);
    }
    if (progressEl) {
      progressEl.textContent = `Round ${bitpopState.roundInStep}/2 • ${bitpopState.sheetPoppedInCurrent}/8`;
    }
  }

  function updateBitpopTimerTick() {
    if (!bitpopState.isRunning) return;
    bitpopState.timer = Math.max(0, bitpopState.timer - 0.1);
    updateBitpopHUD();

    if (bitpopState.timer <= 0) {
      endBitPopGame();
    }
  }

  // Generates 12 distinct cell values for the 3x4 grid, ensuring 8 target values exist
  function initBitpopSheet() {
    const arena = document.getElementById('bitpopArena');
    if (!arena) return;
    arena.innerHTML = '';
    bitpopState.cells = [];
    bitpopState.sheetPoppedInCurrent = 0;
    bitpopState.currentQIndex = 0;

    const tierCfg = getBitpopTierConfig(bitpopState.tier);
    const step = bitpopState.cycleStep; // 0: Den->Bin, 1: Bin->Den, 2: DenAdd->Bin, 3: BinAdd->Den
    const isBinOnCells = (step === 0 || step === 2); // Cells show binary when converting to binary

    // Pick 8 unique target values within the tier
    const targetVals = [];
    const usedVals = new Set();

    let targetAttempts = 0;
    while (targetVals.length < 8 && targetAttempts < 350) {
      targetAttempts++;
      let candidate = 0;
      if (bitpopState.tier === 0) {
        // Nibble: 1 to 15
        candidate = Math.floor(Math.random() * 15) + 1;
      } else {
        // Tiers 1-4: bias towards newly introduced bits (>= minTarget)
        if (targetVals.length < 5) {
          const range = tierCfg.maxVal - tierCfg.minTarget + 1;
          candidate = tierCfg.minTarget + Math.floor(Math.random() * range);
        } else {
          candidate = Math.floor(Math.random() * tierCfg.maxVal) + 1;
        }
      }
      if (!usedVals.has(candidate)) {
        usedVals.add(candidate);
        targetVals.push(candidate);
      }
    }

    // Pick 4 distractors so total cells = 12
    let distractorAttempts = 0;
    const allCellVals = [...targetVals];
    while (allCellVals.length < 12 && distractorAttempts < 350) {
      distractorAttempts++;
      let candidate = 0;
      if (bitpopState.tier === 0) {
        candidate = Math.floor(Math.random() * 15) + 1;
      } else {
        candidate = Math.floor(Math.random() * tierCfg.maxVal) + 1;
      }
      if (!usedVals.has(candidate)) {
        usedVals.add(candidate);
        allCellVals.push(candidate);
      }
    }

    // Fallback if needed
    while (allCellVals.length < 12) {
      const fallback = allCellVals.length + 1;
      allCellVals.push(fallback);
    }

    // Shuffle the 12 cell values so targets and distractors are scattered across the 3x4 sheet
    for (let i = allCellVals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCellVals[i], allCellVals[j]] = [allCellVals[j], allCellVals[i]];
    }

    // Build the 8 question descriptors for targetVals
    bitpopState.sheetQuestions = targetVals.map((val) => {
      let promptText = '';
      let displayValue = '';
      let hintText = '';

      if (step === 0) {
        // Denary to Binary
        promptText = 'POP BINARY EQUAL TO:';
        displayValue = String(val);
        hintText = `${tierCfg.bits}-Bit Binary`;
      } else if (step === 1) {
        // Binary to Denary
        promptText = 'POP DENARY EQUAL TO:';
        displayValue = formatBinaryStr(val, tierCfg.bits);
        hintText = 'Denary Value';
      } else if (step === 2) {
        // Denary addition to Binary (User must compute sum!)
        promptText = 'POP BINARY SUM OF:';
        if (val <= 1) {
          displayValue = `${val} + 0`;
        } else {
          const a = Math.floor(Math.random() * (val - 1)) + 1;
          const b = val - a;
          displayValue = `${a} + ${b}`;
        }
        hintText = `${tierCfg.bits}-Bit Binary Sum`;
      } else {
        // Binary addition to Denary (User must compute sum!)
        promptText = 'POP DENARY SUM OF:';
        if (val <= 1) {
          const aBin = formatBinaryStr(val, tierCfg.bits);
          const bBin = formatBinaryStr(0, tierCfg.bits);
          displayValue = `${aBin} + ${bBin}`;
        } else {
          const a = Math.floor(Math.random() * (val - 1)) + 1;
          const b = val - a;
          const aBin = formatBinaryStr(a, tierCfg.bits);
          const bBin = formatBinaryStr(b, tierCfg.bits);
          displayValue = `${aBin} + ${bBin}`;
        }
        hintText = 'Denary Sum';
      }

      return {
        targetVal: val,
        promptText: promptText,
        displayValue: displayValue,
        hintText: hintText
      };
    });

    // Render 12 blister cells into the 3x4 arena grid
    for (let i = 0; i < allCellVals.length; i++) {
      const val = allCellVals[i];
      const theme = bitpopThemes[i % bitpopThemes.length];
      const cellEl = document.createElement('div');
      cellEl.className = `bitpop-wrap-cell ${theme}`;
      cellEl.setAttribute('data-val', String(val));

      const textSpan = document.createElement('span');
      const is8Bit = isBinOnCells && tierCfg.bits >= 8;
      textSpan.className = 'bitpop-wrap-text' + (is8Bit ? ' is-8bit' : '');

      if (isBinOnCells) {
        textSpan.textContent = formatBinaryStr(val, tierCfg.bits);
      } else {
        textSpan.textContent = String(val);
      }

      cellEl.appendChild(textSpan);

      const cellObj = {
        val: val,
        el: cellEl,
        isPopped: false
      };

      cellEl.addEventListener('click', (evt) => {
        handleBitpopCellClick(cellObj, evt);
      });

      arena.appendChild(cellEl);
      bitpopState.cells.push(cellObj);
    }

    // Set first question active
    setBitpopTargetFromQuestion(bitpopState.sheetQuestions[0]);
    updateBitpopHUD();
  }

  function setBitpopTargetFromQuestion(q) {
    if (!q) return;
    const phasePill = document.getElementById('bitpopPhasePill');
    const promptEl = document.getElementById('bitpopTargetPrompt');
    const valEl = document.getElementById('bitpopTargetValue');
    const hintEl = document.getElementById('bitpopTargetHint');

    const tierCfg = getBitpopTierConfig(bitpopState.tier);
    const stepNames = [
      'DENARY → BINARY',
      'BINARY → DENARY',
      'DENARY ADDITION',
      'BINARY ADDITION'
    ];
    const currentStepName = stepNames[bitpopState.cycleStep] || 'CONVERSION';

    if (phasePill) {
      phasePill.textContent = `PHASE ${bitpopState.tier + 1}.${bitpopState.cycleStep + 1}: ${tierCfg.name} • ${currentStepName}`;
    }
    if (promptEl) promptEl.textContent = q.promptText;
    if (valEl) valEl.textContent = q.displayValue;
    if (hintEl) hintEl.textContent = q.hintText;

    if (valEl) {
      valEl.style.transform = 'scale(1.18)';
      valEl.style.filter = 'drop-shadow(0 0 16px rgba(236, 72, 153, 0.9))';
      setTimeout(() => {
        valEl.style.transform = 'scale(1)';
        valEl.style.filter = '';
      }, 160);
    }
  }

  function handleBitpopCellClick(cellObj, evt) {
    if (!bitpopState.isRunning || cellObj.isPopped) return;

    const currentQ = bitpopState.sheetQuestions[bitpopState.currentQIndex];
    if (!currentQ) return;

    if (cellObj.val === currentQ.targetVal) {
      // --- CORRECT TACTILE POP! ---
      playSynthSound('bubblepop');

      cellObj.isPopped = true;
      cellObj.el.classList.add('is-popped');

      // Add checkmark visual to deflated blister
      const checkBadge = document.createElement('span');
      checkBadge.className = 'bitpop-popped-tick';
      checkBadge.innerHTML = ' &#10003;';
      const textSpan = cellObj.el.querySelector('.bitpop-wrap-text');
      if (textSpan) textSpan.appendChild(checkBadge);

      bitpopState.timer = Math.min(60.0, bitpopState.timer + 2.5);
      bitpopState.streak++;
      bitpopState.poppedCount++;
      bitpopState.sheetPoppedInCurrent++;

      // Combo & scoring
      bitpopState.combo = Math.min(3.5, 1.0 + (bitpopState.streak * 0.15));
      bitpopState.maxCombo = Math.max(bitpopState.maxCombo, bitpopState.combo);
      const pts = Math.round(100 * bitpopState.combo);
      bitpopState.score += pts;

      updateBitpopHUD();
      showBitpopFloater('+2.5s', true, evt);
      if (bitpopState.streak >= 3) {
        setTimeout(() => {
          showBitpopFloater(`${bitpopState.combo.toFixed(1)}× Combo!`, true, evt, -22);
        }, 110);
      }

      // Check if this sheet is fully cleared (all 8 target questions solved)!
      if (bitpopState.sheetPoppedInCurrent >= 8) {
        // --- COMPLETE SHEET CLEARED! ---
        playSynthSound('levelup');
        bitpopState.timer = Math.min(60.0, bitpopState.timer + 6.0);
        bitpopState.score += Math.round(500 * bitpopState.combo);
        updateBitpopHUD();

        showBitpopFloater('SHEET CLEAR! +6s ⚡', true, null, -10);

        // Advance round or cycle step (each phase repeats twice)
        bitpopState.sheetNumber++;
        if (bitpopState.roundInStep < 2) {
          bitpopState.roundInStep++;
        } else {
          bitpopState.roundInStep = 1;
          bitpopState.cycleStep++;
          if (bitpopState.cycleStep >= 4) {
            bitpopState.cycleStep = 0;
            bitpopState.tier++;
            if (bitpopState.tier > 4) {
              bitpopState.tier = 4; // Stay at 8-bit master blitz
            }
          }
        }

        // Brief delay for tactile satisfaction, then render the next fresh bubble wrap sheet
        setTimeout(() => {
          if (bitpopState.isRunning) {
            initBitpopSheet();
          }
        }, 450);

      } else {
        // Advance to next question in the current sheet
        bitpopState.currentQIndex++;
        setBitpopTargetFromQuestion(bitpopState.sheetQuestions[bitpopState.currentQIndex]);
      }

    } else {
      // --- WRONG BUBBLE CLICK ---
      playSynthSound('wrong');

      cellObj.el.classList.add('is-wrong');
      bitpopState.timer = Math.max(0, bitpopState.timer - 2.0);
      bitpopState.streak = 0;
      bitpopState.combo = 1.0;

      updateBitpopHUD();
      showBitpopFloater('-2.0s', false, evt);

      setTimeout(() => {
        cellObj.el.classList.remove('is-wrong');
      }, 380);

      if (bitpopState.timer <= 0) {
        endBitPopGame();
      }
    }
  }

  function showBitpopFloater(text, isBonus, evt, yOffset = 0) {
    const container = document.getElementById('bitpopFloaterContainer');
    if (!container) return;

    const floater = document.createElement('div');
    floater.className = `bitpop-floater ${isBonus ? 'bonus' : 'penalty'}`;
    floater.textContent = text;

    if (evt && evt.clientX && container.getBoundingClientRect) {
      const rect = container.getBoundingClientRect();
      const x = Math.max(30, Math.min(rect.width - 45, evt.clientX - rect.left));
      const y = Math.max(20, Math.min(rect.height - 40, (evt.clientY - rect.top) + yOffset));
      floater.style.left = `${x}px`;
      floater.style.top = `${y}px`;
    } else {
      floater.style.left = '50%';
      floater.style.top = '40%';
    }

    container.appendChild(floater);
    setTimeout(() => {
      if (floater.parentNode) floater.parentNode.removeChild(floater);
    }, 850);
  }

  function endBitPopGame() {
    stopBitpopEngine();

    // Architecture XP Reward formula:
    const xpReward = Math.max(35, Math.round(bitpopState.score / 20) + (bitpopState.poppedCount * 5));

    // Award XP
    bitmasterState.xp = (bitmasterState.xp || 0) + xpReward;
    saveBitmasterProgress();
    updateBitmasterHUD();

    try {
      playSynthSound('victory');
    } catch (e) {}
    fireConfetti();

    // Populate modal stats
    const modal = document.getElementById('bitpopGameOverModal');
    const finalScoreEl = document.getElementById('bitpopFinalScore');
    const finalPoppedEl = document.getElementById('bitpopFinalPopped');
    const finalComboEl = document.getElementById('bitpopFinalMaxCombo');
    const finalXpEl = document.getElementById('bitpopFinalXp');

    if (finalScoreEl) finalScoreEl.textContent = bitpopState.score.toLocaleString();
    if (finalPoppedEl) finalPoppedEl.textContent = String(bitpopState.poppedCount);
    if (finalComboEl) finalComboEl.textContent = `${bitpopState.maxCombo.toFixed(1)}× 🔥`;
    if (finalXpEl) finalXpEl.textContent = `+${xpReward} XP`;

    if (modal) modal.style.display = 'flex';
  }

  function exitBitPop() {
    stopBitpopEngine();
    const modal = document.getElementById('bitpopGameOverModal');
    if (modal) modal.style.display = 'none';
    showBitmasterScreen('title');
  }

  window.finishBitmasterRound = finishBitmasterRound;
  window.startBitmasterRound = startBitmasterRound;
  window.loadNextBitmasterQuestion = loadNextBitmasterQuestion;
  window.createBitmasterQuestion = createBitmasterQuestion;
  window.showBitmasterScreen = showBitmasterScreen;
  window.showBitmasterRankModal = showBitmasterRankModal;
  window.startBitCrossGame = startBitCrossGame;
  window.bitcrossState = bitcrossState;
  window.startBitPopGame = startBitPopGame;
  window.exitBitPop = exitBitPop;
  window.bitpopState = bitpopState;

  // =========================================================================
  function setupBitMaster() {
    loadBitmasterSave();
    updateBitmasterHUD();
    probeBitmasterAvatars();

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

    // Star Vault & Themes Modal
    const hudStarsPill = document.getElementById('bitmasterHudStarsPill');
    const closeStarVaultBtn = document.getElementById('bitmasterStarVaultCloseBtn');
    const starVaultModal = document.getElementById('bitmasterModalStarVault');
    const starCriteriaBtn = document.getElementById('bitmasterStarCriteriaBtn');
    const starCriteriaModal = document.getElementById('bitmasterModalStarCriteria');
    const closeStarCriteriaBtn = document.getElementById('bitmasterModalCloseStarCriteriaBtn');

    if (hudStarsPill) {
      hudStarsPill.addEventListener('click', () => {
        showBitmasterStarVaultModal();
      });
    }

    if (closeStarVaultBtn) {
      closeStarVaultBtn.addEventListener('click', () => {
        hideBitmasterStarVaultModal();
      });
    }

    if (starVaultModal) {
      starVaultModal.addEventListener('click', (e) => {
        if (e.target === starVaultModal) {
          hideBitmasterStarVaultModal();
        }
      });
    }

    // Theme Selection Cards
    const themeCards = document.querySelectorAll('#bitmasterThemesGrid .star-theme-card');
    themeCards.forEach((card) => {
      const equip = () => {
        const themeId = card.getAttribute('data-theme-id');
        if (themeId) {
          applyBitmasterTheme(themeId, true);
          playSynthSound('celebrate');
        }
      };
      card.addEventListener('click', equip);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          equip();
        }
      });
    });

    // Star Criteria Button in Levels Screen opens Star Vault & Rules
    if (starCriteriaBtn) {
      starCriteriaBtn.addEventListener('click', () => {
        showBitmasterStarVaultModal();
      });
    }

    if (closeStarCriteriaBtn && starCriteriaModal) {
      closeStarCriteriaBtn.addEventListener('click', () => {
        playSynthSound('tap');
        starCriteriaModal.style.display = 'none';
      });
    }

    if (starCriteriaModal) {
      starCriteriaModal.addEventListener('click', (e) => {
        if (e.target === starCriteriaModal) {
          starCriteriaModal.style.display = 'none';
        }
      });
    }

    // Restore saved theme on startup
    const savedTheme = localStorage.getItem('bitmaster_theme') || 'cyber-neon';
    applyBitmasterTheme(savedTheme, false);

    // Title Screen Start Arcade Button (if present)
    const startBtn = document.getElementById('bitmasterStartBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        playSynthSound('tap');
        showBitmasterScreen('stages');
      });
    }

    // Back to Topics Button on Stages Screen
    const backToTopicsBtn = document.getElementById('bitmasterBackToTopicsBtn');
    if (backToTopicsBtn) {
      backToTopicsBtn.addEventListener('click', () => {
        playSynthSound('tap');
        showBitmasterScreen('title');
      });
    }

    // Front Menu Avatar & Stats Click -> Open Rank Progression Ladder
    const titleHeroChip = document.getElementById('bitmasterTitleHeroChip');
    const titleStatsPreview = document.getElementById('bitmasterTitleStatsPreview');
    if (titleHeroChip) {
      titleHeroChip.addEventListener('click', () => {
        playSynthSound('tap');
        showBitmasterRankModal();
      });
    }
    if (titleStatsPreview) {
      titleStatsPreview.addEventListener('click', () => {
        playSynthSound('tap');
        showBitmasterRankModal();
      });
    }

    // Click Rank Card -> Open Rank Progression & Reset Modal
    const rankCard = document.getElementById('bitmasterRankCard');
    if (rankCard) {
      rankCard.addEventListener('click', () => {
        playSynthSound('tap');
        showBitmasterRankModal();
      });
    }

    const rankModalCloseBtn = document.getElementById('bitmasterRankModalCloseBtn');
    const rankModalDoneBtn = document.getElementById('bitmasterRankModalDoneBtn');
    if (rankModalCloseBtn) {
      rankModalCloseBtn.addEventListener('click', () => {
        playSynthSound('tap');
        hideBitmasterRankModal();
      });
    }
    if (rankModalDoneBtn) {
      rankModalDoneBtn.addEventListener('click', () => {
        playSynthSound('tap');
        hideBitmasterRankModal();
      });
    }

    // Rank Promotion / Level Up Claim Button
    const levelUpClaimBtn = document.getElementById('bitmasterModalLevelUpClaimBtn');
    const levelUpModal = document.getElementById('bitmasterModalLevelUp');
    if (levelUpClaimBtn) {
      levelUpClaimBtn.addEventListener('click', () => {
        hideBitmasterLevelUpModal();
      });
    }
    if (levelUpModal) {
      levelUpModal.addEventListener('click', (e) => {
        if (e.target === levelUpModal) hideBitmasterLevelUpModal();
      });
    }

    // Reset Scores Flow
    const resetScoresBtn = document.getElementById('bitmasterResetScoresBtn');
    const resetConfirmModal = document.getElementById('bitmasterModalResetConfirm');
    const cancelResetBtn = document.getElementById('bitmasterModalCancelResetBtn');
    const confirmResetBtn = document.getElementById('bitmasterModalConfirmResetBtn');

    if (resetScoresBtn && resetConfirmModal) {
      resetScoresBtn.addEventListener('click', () => {
        playSynthSound('tap');
        resetConfirmModal.style.display = 'flex';
      });
    }

    if (cancelResetBtn && resetConfirmModal) {
      cancelResetBtn.addEventListener('click', () => {
        playSynthSound('tap');
        resetConfirmModal.style.display = 'none';
      });
    }

    if (confirmResetBtn && resetConfirmModal) {
      confirmResetBtn.addEventListener('click', () => {
        playSynthSound('wrong');
        localStorage.removeItem('bitmaster_save_v1');
        bitmasterState.xp = 0;
        bitmasterState.stars = {};
        saveBitmasterProgress();
        updateBitmasterHUD();
        renderBitmasterRankModal();
        renderBitmasterStagesGrid();
        resetConfirmModal.style.display = 'none';
      });
    }

    // Centralized In-Game Back Function
    function goBackBitmaster() {
      playSynthSound('tap');
      const activeScreen = document.querySelector('.bitmaster-screen.active');
      if (activeScreen && activeScreen.id === 'bitmasterScreenGame') {
        showBitmasterAbandonModal();
      } else if (activeScreen && activeScreen.id === 'bitmasterScreenBitCross') {
        exitBitCrossToArcade();
      } else if (activeScreen && activeScreen.id === 'bitmasterScreenBitPop') {
        exitBitPop();
      } else if (activeScreen && activeScreen.id === 'bitmasterScreenSummary') {
        showBitmasterScreen('levels');
      } else if (activeScreen && activeScreen.id === 'bitmasterScreenLevels') {
        showBitmasterScreen('stages');
      } else if (activeScreen && activeScreen.id === 'bitmasterScreenStages') {
        showBitmasterScreen('title');
      } else {
        showBitmasterExitModal();
      }
    }

    // HUD Top Back Button
    const hudBackBtn = document.getElementById('bitmasterHudBackBtn');
    if (hudBackBtn) {
      hudBackBtn.addEventListener('click', goBackBitmaster);
    }

    // Bottom Back Buttons on Stages & Levels Screens
    const stagesBottomBackBtn = document.getElementById('bitmasterStagesBottomBackBtn');
    if (stagesBottomBackBtn) {
      stagesBottomBackBtn.addEventListener('click', goBackBitmaster);
    }

    const levelsBottomBackBtn = document.getElementById('bitmasterLevelsBottomBackBtn');
    if (levelsBottomBackBtn) {
      levelsBottomBackBtn.addEventListener('click', goBackBitmaster);
    }

    // Launch Bit Cross Game Card
    const launchBitCrossBtn = document.getElementById('bitmasterLaunchBitCrossBtn');
    if (launchBitCrossBtn) {
      launchBitCrossBtn.addEventListener('click', () => {
        playSynthSound('tap');
        startBitCrossGame(4);
      });
    }

    // Launch Bit Pop Game Card
    const launchBitPopBtn = document.getElementById('bitmasterLaunchBitPopBtn');
    if (launchBitPopBtn) {
      launchBitPopBtn.addEventListener('click', () => {
        playSynthSound('tap');
        startBitPopGame();
      });
    }

    // Bit Pop Controls & Modal Buttons
    const restartPopBtn = document.getElementById('bitpopRestartBtn');
    if (restartPopBtn) {
      restartPopBtn.addEventListener('click', () => {
        playSynthSound('tap');
        startBitPopGame();
      });
    }

    const popPlayAgainBtn = document.getElementById('bitpopPlayAgainBtn');
    if (popPlayAgainBtn) {
      popPlayAgainBtn.addEventListener('click', () => {
        playSynthSound('tap');
        startBitPopGame();
      });
    }

    const popExitBtn = document.getElementById('bitpopExitToMenuBtn');
    if (popExitBtn) {
      popExitBtn.addEventListener('click', () => {
        playSynthSound('tap');
        exitBitPop();
      });
    }

    // Bit Cross Size Selector Pills
    const sizePills = document.querySelectorAll('.bitcross-size-pill');
    sizePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const s = parseInt(pill.getAttribute('data-size'), 10);
        playSynthSound('tap');
        startBitCrossGame(s);
      });
    });

    // Bit Cross Controls: Reset and New Puzzle
    const resetCrossBtn = document.getElementById('bitcrossResetBtn');
    if (resetCrossBtn) {
      resetCrossBtn.addEventListener('click', () => {
        resetBitcrossGrid();
      });
    }
    const newCrossBtn = document.getElementById('bitcrossNewPuzzleBtn');
    if (newCrossBtn) {
      newCrossBtn.addEventListener('click', () => {
        playSynthSound('tap');
        startBitCrossGame(bitcrossState.size);
      });
    }

    // Bit Cross Victory Modal Buttons
    const winNextBtn = document.getElementById('bitcrossVictoryNextBtn');
    if (winNextBtn) {
      winNextBtn.addEventListener('click', () => {
        playSynthSound('tap');
        startBitCrossGame(bitcrossState.size);
      });
    }
    const winArcadeBtn = document.getElementById('bitcrossVictoryArcadeBtn');
    if (winArcadeBtn) {
      winArcadeBtn.addEventListener('click', () => {
        playSynthSound('tap');
        exitBitCrossToArcade();
      });
    }

    // Exit BitMaster Modal Event Listeners
    const exitModal = document.getElementById('bitmasterModalExit');
    const exitStayBtn = document.getElementById('bitmasterModalStayBtn');
    const exitConfirmBtn = document.getElementById('bitmasterModalExitConfirmBtn');
    if (exitStayBtn && exitModal) {
      exitStayBtn.addEventListener('click', () => {
        playSynthSound('tap');
        exitModal.style.display = 'none';
      });
    }
    if (exitConfirmBtn && exitModal) {
      exitConfirmBtn.addEventListener('click', () => {
        playSynthSound('tap');
        exitModal.style.display = 'none';
        window.location.href = '../../index.html';
      });
    }
    if (exitModal) {
      exitModal.addEventListener('click', (e) => {
        if (e.target === exitModal) {
          exitModal.style.display = 'none';
        }
      });
    }

    // Browser History API Integration (Enables Mobile Back Gesture to navigate backwards in game)
    try {
      if (window.history && window.history.replaceState) {
        window.history.replaceState({ bitmasterApp: true, bitmasterRoot: true, bitmasterScreen: 'title' }, '');
      }
    } catch (e) {}

    window.addEventListener('popstate', (e) => {
      // Check if arcade tab is currently active
      const arcadeTab = document.getElementById('tab-arcade');
      if (arcadeTab && !arcadeTab.classList.contains('active')) return;

      const activeScreen = document.querySelector('.bitmaster-screen.active');
      const activeScreenId = activeScreen ? activeScreen.id : 'bitmasterScreenTitle';

      if (activeScreenId === 'bitmasterScreenGame') {
        // Active challenge in arena: re-push game state so match isn't abruptly abandoned, show confirmation
        try {
          window.history.pushState({ bitmasterApp: true, bitmasterScreen: 'game' }, '');
        } catch (err) {}
        showBitmasterAbandonModal();
      } else if (activeScreenId === 'bitmasterScreenBitCross') {
        exitBitCrossToArcade();
      } else if (activeScreenId === 'bitmasterScreenBitPop') {
        exitBitPop();
      } else if (activeScreenId === 'bitmasterScreenSummary') {
        showBitmasterScreen('levels', true);
      } else if (activeScreenId === 'bitmasterScreenLevels') {
        showBitmasterScreen('stages', true);
      } else if (activeScreenId === 'bitmasterScreenStages') {
        showBitmasterScreen('title', true);
      } else if (activeScreenId === 'bitmasterScreenTitle') {
        // User swiped back while on the front topic menu: show leave confirmation modal
        try {
          window.history.pushState({ bitmasterApp: true, bitmasterScreen: 'title' }, '');
        } catch (err) {}
        showBitmasterExitModal();
      }
    });

    // Confirmation warning when attempting to unload/leave page during an active match
    window.addEventListener('beforeunload', (e) => {
      if (bitmasterState && bitmasterState.inRound) {
        e.preventDefault();
        e.returnValue = 'You have a match in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    });

    showBitmasterScreen('title', true);
  }

  function renderBitmasterRankModal() {
    const currentRank = getCurrentBitmasterRank();
    const nextRank = getNextBitmasterRank();

    const curAvatar = document.getElementById('bitmasterModalCurrentAvatar');
    const curTitle = document.getElementById('bitmasterModalCurrentTitle');
    const curXp = document.getElementById('bitmasterModalCurrentXp');

    const nextBadge = document.getElementById('bitmasterModalNextBadge');
    const nextAvatar = document.getElementById('bitmasterModalNextAvatar');
    const nextTitle = document.getElementById('bitmasterModalNextTitle');
    const nextReq = document.getElementById('bitmasterModalNextReq');

    const meterWrap = document.getElementById('bitmasterModalMeterWrap');
    const meterFill = document.getElementById('bitmasterModalMeterFill');
    const progressPct = document.getElementById('bitmasterModalProgressPct');
    const ladderList = document.getElementById('bitmasterRankLadderList');

    if (curAvatar) curAvatar.innerHTML = getBitmasterAvatarHTML(currentRank, 'modal-avatar');
    if (curTitle) curTitle.textContent = currentRank.title;
    if (curXp) curXp.textContent = `${bitmasterState.xp.toLocaleString()} pts`;

    if (nextRank) {
      if (nextBadge) nextBadge.textContent = 'NEXT RANK';
      if (nextAvatar) nextAvatar.innerHTML = getBitmasterAvatarHTML(nextRank, 'modal-avatar');
      if (nextTitle) nextTitle.textContent = nextRank.title;
      const diff = Math.max(0, nextRank.minXp - bitmasterState.xp);
      if (nextReq) nextReq.textContent = `Need ${diff.toLocaleString()} more pts`;

      const prevXp = currentRank.minXp;
      const pct = Math.min(100, Math.max(0, Math.round(((bitmasterState.xp - prevXp) / (nextRank.minXp - prevXp)) * 100)));
      if (meterWrap) meterWrap.style.display = 'block';
      if (meterFill) meterFill.style.width = `${pct}%`;
      if (progressPct) progressPct.textContent = `${pct}%`;
    } else {
      if (nextBadge) nextBadge.textContent = 'MAX RANK';
      if (nextAvatar) nextAvatar.innerHTML = getBitmasterAvatarHTML(currentRank, 'modal-avatar');
      if (nextTitle) nextTitle.textContent = currentRank.title;
      if (nextReq) nextReq.textContent = 'Highest Rank Attained! 👑';
      if (meterWrap) meterWrap.style.display = 'none';
    }

    if (ladderList) {
      ladderList.innerHTML = BITMASTER_RANKS.map(r => {
        const isCurrent = r.title === currentRank.title;
        const isUnlocked = bitmasterState.xp >= r.minXp;
        return `
          <div class="rank-ladder-row ${isCurrent ? 'current-tier' : ''} ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="ladder-rank-avatar">${getBitmasterAvatarHTML(r, 'ladder-avatar')}</div>
            <div class="ladder-rank-info">
              <div class="ladder-rank-name">
                <span>${r.title}</span>
                ${isCurrent ? '<span class="ladder-current-tag">ACTIVE</span>' : ''}
              </div>
              <div class="ladder-rank-xp">${r.minXp.toLocaleString()} pts required</div>
            </div>
            <div class="ladder-rank-status">
              ${isUnlocked ? '<span class="status-unlocked-icon">✓</span>' : '<span class="status-locked-icon">🔒</span>'}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function showBitmasterRankModal() {
    renderBitmasterRankModal();
    const modal = document.getElementById('bitmasterModalRank');
    if (modal) modal.style.display = 'flex';
  }

  function hideBitmasterRankModal() {
    const modal = document.getElementById('bitmasterModalRank');
    if (modal) modal.style.display = 'none';
  }

  function showBitmasterLevelUpModal(newRank) {
    const modal = document.getElementById('bitmasterModalLevelUp');
    if (!modal) return;
    const avatarEl = document.getElementById('bitmasterLevelUpAvatar');
    const titleEl = document.getElementById('bitmasterLevelUpTitle');
    const subEl = document.getElementById('bitmasterLevelUpSubtitle');
    const descEl = document.getElementById('bitmasterLevelUpDesc');

    if (avatarEl) avatarEl.innerHTML = getBitmasterAvatarHTML(newRank, 'levelup-avatar');
    if (titleEl) titleEl.textContent = newRank.title;
    if (subEl) subEl.textContent = `Architecture Tier ${newRank.id} of 12`;
    if (descEl) descEl.textContent = `Outstanding work! You have earned enough points to unlock the rank of ${newRank.title}. Keep conquering binary stages!`;

    modal.style.display = 'flex';
    playSynthSound('levelup');
    fireConfetti();
    setTimeout(fireConfetti, 280);
  }

  function hideBitmasterLevelUpModal() {
    const modal = document.getElementById('bitmasterModalLevelUp');
    if (modal) modal.style.display = 'none';
    playSynthSound('tap');
  }

  window.showBitmasterRankModal = showBitmasterRankModal;
  window.hideBitmasterRankModal = hideBitmasterRankModal;
  window.showBitmasterLevelUpModal = showBitmasterLevelUpModal;
  window.hideBitmasterLevelUpModal = hideBitmasterLevelUpModal;

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
