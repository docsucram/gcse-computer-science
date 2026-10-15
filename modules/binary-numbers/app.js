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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
