/**
 * GCSE Computer Science: Test Plan Builder & Boundary Testing
 * Aligned with AQA 8525 Paper 1 §3.2.4 (Selecting Test Data) & Python 3 Programming
 * Features:
 *   0. Worked Example: Cinema Ticket Age Check (Interactive Walkthrough demonstrating line-by-line stepping)
 *   1. Numeric Range: Scooter Rental Duration (1 to 24 hours inclusive)
 *   2. String Length Validation: Security PIN / Passcode (between 6 and 10 characters)
 *   3. Concession Category Threshold: Senior Citizen Pass (Age 65+ with 64/65 boundary)
 */

(function () {
  'use strict';

  const TEST_SCENARIOS = [
    {
      id: 'worked_example',
      isWorkedExample: true,
      title: '0. Worked Example: Cinema Ticket Age',
      spec: 'Worked Example: Child tickets are issued for ages 3 to 15 inclusive. All other ages receive Standard Tickets. Watch the test harness step through each line of code and automatically record the test results.',
      min: 3,
      max: 15,
      unit: ' yrs',
      inputLabel: 'Customer Age (0 to 100):',
      fileName: 'ticket_checker.py',
      funcName: 'get_ticket_type',
      code: [
        '# Cinema Ticket Classifier (Python 3)',
        'def get_ticket_type(age):',
        '    # Child ticket valid for ages 3 to 15 inclusive',
        '    if age >= 3 and age <= 15:',
        '        return "Child Ticket"',
        '    else:',
        '        return "Standard Ticket"'
      ],
      buggyLineIndex: 3,
      fixedLine: '    if age >= 3 and age <= 15:',
      bugDesc: 'In this worked example, the logic is completely correct: age >= 3 and age <= 15 properly includes both threshold boundaries.',
      defaultInputs: {
        normal: '8',
        boundLower: '3',
        boundUpper: '15',
        erroneous: '25'
      },
      defaultExpected: {
        normal: 'Child Ticket',
        boundLower: 'Child Ticket',
        boundUpper: 'Child Ticket',
        erroneous: 'Standard Ticket'
      },
      outcomeOptions: ['Child Ticket', 'Standard Ticket'],
      runBuggy: (val) => {
        const n = parseInt(val, 10);
        if (isNaN(n) || n < 0) return 'Standard Ticket';
        return (n >= 3 && n <= 15) ? 'Child Ticket' : 'Standard Ticket';
      },
      runFixed: (val) => {
        const n = parseInt(val, 10);
        if (isNaN(n) || n < 0) return 'Standard Ticket';
        return (n >= 3 && n <= 15) ? 'Child Ticket' : 'Standard Ticket';
      },
      expectedCorrect: (val) => {
        const n = parseInt(val, 10);
        if (isNaN(n) || n < 0) return 'Standard Ticket';
        return (n >= 3 && n <= 15) ? 'Child Ticket' : 'Standard Ticket';
      },
      validateData: {
        normal: (val) => {
          const n = parseInt(val, 10);
          return !isNaN(n) && n > 3 && n < 15;
        },
        boundLower: (val) => parseInt(val, 10) === 3,
        boundUpper: (val) => parseInt(val, 10) === 15,
        erroneous: (val) => {
          const n = parseInt(val, 10);
          return isNaN(n) || n < 3 || n > 15;
        }
      },
      hints: {
        normal: 'Enter an age comfortably inside 3 to 15 (e.g. 8).',
        boundLower: 'Exact minimum boundary is 3.',
        boundUpper: 'Exact maximum boundary is 15.',
        erroneous: 'Enter an age outside 3 to 15 (e.g. 25 or 0).'
      }
    },
    {
      id: 'scooter_duration',
      isWorkedExample: false,
      title: '1. Scooter Hire Duration (Numeric Range)',
      spec: 'Rental duration check: Scooter hires must be between 1 and 24 hours inclusive. Duration outside 1 to 24 hours must be rejected.',
      min: 1,
      max: 24,
      unit: ' hrs',
      inputLabel: 'Hours (1 to 24):',
      fileName: 'validator.py',
      funcName: 'check_duration',
      code: [
        '# Scooter Hire Duration Check (Python 3)',
        'def check_duration(hours):',
        '    # Buggy condition: excludes 24 with strict < 24',
        '    if hours >= 1 and hours < 24:',
        '        return "Duration Accepted"',
        '    else:',
        '        return "Duration Rejected"'
      ],
      buggyLineIndex: 3,
      fixedLine: '    if hours >= 1 and hours <= 24:',
      bugDesc: 'The programmer coded `hours < 24` instead of `hours <= 24`. A 24-hour rental is rejected unexpectedly!',
      outcomeOptions: ['Duration Accepted', 'Duration Rejected'],
      runBuggy: (val) => {
        const n = parseFloat(val);
        if (isNaN(n) || n < 0) return 'Duration Rejected';
        return (n >= 1 && n < 24) ? 'Duration Accepted' : 'Duration Rejected';
      },
      runFixed: (val) => {
        const n = parseFloat(val);
        if (isNaN(n) || n < 0) return 'Duration Rejected';
        return (n >= 1 && n <= 24) ? 'Duration Accepted' : 'Duration Rejected';
      },
      expectedCorrect: (val) => {
        const n = parseFloat(val);
        if (isNaN(n) || n < 0) return 'Duration Rejected';
        return (n >= 1 && n <= 24) ? 'Duration Accepted' : 'Duration Rejected';
      },
      validateData: {
        normal: (val) => {
          const n = parseFloat(val);
          return !isNaN(n) && n > 1 && n < 24;
        },
        boundLower: (val) => parseFloat(val) === 1,
        boundUpper: (val) => parseFloat(val) === 24,
        erroneous: (val) => {
          const n = parseFloat(val);
          return isNaN(n) || n < 1 || n > 24;
        }
      },
      hints: {
        normal: 'Choose typical hours inside 1 to 24 (e.g. 5 or 12).',
        boundLower: 'Exact minimum boundary is 1 hour.',
        boundUpper: 'Exact maximum boundary is 24 hours.',
        erroneous: 'Choose 0 or 25 or -3 or non-numeric text.'
      }
    },
    {
      id: 'password_length',
      isWorkedExample: false,
      title: '2. Passcode Length Check (String Validation)',
      spec: 'String length verification: A rider security passcode must contain between 6 and 10 characters inclusive. Passcodes shorter than 6 or longer than 10 characters must be rejected.',
      min: 6,
      max: 10,
      unit: ' chars',
      inputLabel: 'Passcode Text:',
      fileName: 'passcode_guard.py',
      funcName: 'validate_passcode',
      code: [
        '# Passcode String Length Check (Python 3)',
        'def validate_passcode(code_str):',
        '    # Buggy condition: excludes 6-char strings with > 6',
        '    if len(code_str) > 6 and len(code_str) <= 10:',
        '        return "Valid Passcode"',
        '    else:',
        '        return "Invalid Length"'
      ],
      buggyLineIndex: 3,
      fixedLine: '    if len(code_str) >= 6 and len(code_str) <= 10:',
      bugDesc: 'The programmer coded `len(code_str) > 6` instead of `>= 6`. A 6-character passcode like "Secret" is incorrectly rejected as invalid!',
      outcomeOptions: ['Valid Passcode', 'Invalid Length'],
      runBuggy: (val) => {
        const s = String(val);
        return (s.length > 6 && s.length <= 10) ? 'Valid Passcode' : 'Invalid Length';
      },
      runFixed: (val) => {
        const s = String(val);
        return (s.length >= 6 && s.length <= 10) ? 'Valid Passcode' : 'Invalid Length';
      },
      expectedCorrect: (val) => {
        const s = String(val);
        return (s.length >= 6 && s.length <= 10) ? 'Valid Passcode' : 'Invalid Length';
      },
      validateData: {
        normal: (val) => {
          const len = String(val).length;
          return len > 6 && len < 10;
        },
        boundLower: (val) => String(val).length === 6,
        boundUpper: (val) => String(val).length === 10,
        erroneous: (val) => {
          const len = String(val).length;
          return len < 6 || len > 10;
        }
      },
      hints: {
        normal: 'Enter a word with 7, 8, or 9 letters (e.g. "Scooter" = 7 chars).',
        boundLower: 'Enter a string of exactly 6 characters (e.g. "Pass12").',
        boundUpper: 'Enter a string of exactly 10 characters (e.g. "Rider12345").',
        erroneous: 'Enter a string under 6 chars (e.g. "abc") or over 10 chars.'
      }
    },
    {
      id: 'concession_age',
      isWorkedExample: false,
      title: '3. Senior Citizen Pass (Threshold Boundary)',
      spec: 'Discount qualification: Customers aged 65 and over receive the Senior Concession discount (ages 65 to 110 inclusive). Ages under 65 pay Standard Rate.',
      min: 65,
      max: 110,
      unit: ' yrs',
      inputLabel: 'Rider Age (0 to 110):',
      fileName: 'concession_checker.py',
      funcName: 'check_concession',
      code: [
        '# Senior Concession Classifier (Python 3)',
        'def check_concession(age):',
        '    # Buggy condition: excludes age 65 with > 65',
        '    if age > 65 and age <= 110:',
        '        return "Senior Discount"',
        '    else:',
        '        return "Standard Rate"'
      ],
      buggyLineIndex: 3,
      fixedLine: '    if age >= 65 and age <= 110:',
      bugDesc: 'The programmer coded `age > 65` instead of `age >= 65`. A customer celebrating their 65th birthday is incorrectly charged Standard Rate!',
      outcomeOptions: ['Senior Discount', 'Standard Rate'],
      runBuggy: (val) => {
        const n = parseInt(val, 10);
        if (isNaN(n) || n < 0) return 'Standard Rate';
        return (n > 65 && n <= 110) ? 'Senior Discount' : 'Standard Rate';
      },
      runFixed: (val) => {
        const n = parseInt(val, 10);
        if (isNaN(n) || n < 0) return 'Standard Rate';
        return (n >= 65 && n <= 110) ? 'Senior Discount' : 'Standard Rate';
      },
      expectedCorrect: (val) => {
        const n = parseInt(val, 10);
        if (isNaN(n) || n < 0) return 'Standard Rate';
        return (n >= 65 && n <= 110) ? 'Senior Discount' : 'Standard Rate';
      },
      validateData: {
        normal: (val) => {
          const n = parseInt(val, 10);
          return !isNaN(n) && n > 65 && n < 110;
        },
        boundLower: (val) => parseInt(val, 10) === 65,
        boundUpper: (val) => parseInt(val, 10) === 110,
        erroneous: (val) => {
          const n = parseInt(val, 10);
          return isNaN(n) || n < 65 || n > 110;
        }
      },
      hints: {
        normal: 'Enter an age safely in the senior category (e.g. 70 or 80).',
        boundLower: 'Exact lower boundary for discount is 65.',
        boundUpper: 'Exact maximum boundary limit is 110.',
        erroneous: 'Enter an age below 65 (e.g. 25, 64) or above 110 or negative.'
      }
    }
  ];

  let currentScenarioIdx = 0;
  let codePatched = false;
  let isExecuting = false;

  function initTestPlan() {
    renderScenarioPills();
    loadScenario(0);

    const btnRunTests = document.getElementById('btnRunTestPlan');
    const btnPatchBug = document.getElementById('btnPatchTestBug');
    const btnReset = document.getElementById('btnResetTestPlan');

    if (btnRunTests) btnRunTests.addEventListener('click', () => {
      if (!isExecuting) runAllTests();
    });
    if (btnPatchBug) btnPatchBug.addEventListener('click', patchBugAndReRun);
    if (btnReset) btnReset.addEventListener('click', resetTestPlan);

    // Dynamic marker update as student types
    ['inputTestNormal', 'inputTestBoundLower', 'inputTestBoundUpper', 'inputTestErroneous'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updateNumberLineMarkers);
      }
    });
  }

  function renderScenarioPills() {
    const container = document.getElementById('testplanScenarioPills');
    if (!container) return;

    container.innerHTML = TEST_SCENARIOS.map((sc, idx) => `
      <button type="button" class="challenge-pill-btn ${idx === currentScenarioIdx ? 'active' : ''}" data-idx="${idx}">
        ${sc.title}
      </button>
    `).join('');

    container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        isExecuting = false;
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        loadScenario(idx);
      });
    });
  }

  function loadScenario(idx) {
    isExecuting = false;
    currentScenarioIdx = idx;
    codePatched = false;

    const pills = document.querySelectorAll('#testplanScenarioPills button');
    pills.forEach((p, i) => p.classList.toggle('active', i === idx));

    const sc = TEST_SCENARIOS[idx];
    const titleEl = document.getElementById('testplanScenarioTitle');
    const specEl = document.getElementById('testplanScenarioSpec');
    const domainEl = document.getElementById('testplanDomainPreview');
    const patchSlot = document.getElementById('patchButtonSlot');
    const fileNameEl = document.getElementById('testplanFileName');

    if (titleEl) titleEl.innerText = sc.title;
    if (specEl) specEl.innerText = sc.spec;
    if (domainEl) domainEl.innerText = `${sc.min} to ${sc.max}${sc.unit}`;
    if (fileNameEl) fileNameEl.innerText = sc.fileName || 'validator.py';
    if (patchSlot) patchSlot.style.display = 'none';

    renderNumberLine(sc);
    renderCode(sc);
    populateSelectOptions(sc);
    clearInputsAndResults();

    // If Worked Example, pre-fill inputs so user can step through right away
    if (sc.isWorkedExample) {
      const inNorm = document.getElementById('inputTestNormal');
      const inLow = document.getElementById('inputTestBoundLower');
      const inUp = document.getElementById('inputTestBoundUpper');
      const inErr = document.getElementById('inputTestErroneous');

      const selNorm = document.getElementById('selectExpNormal');
      const selLow = document.getElementById('selectExpLower');
      const selUp = document.getElementById('selectExpUpper');
      const selErr = document.getElementById('selectExpErr');

      if (inNorm) inNorm.value = sc.defaultInputs.normal;
      if (inLow) inLow.value = sc.defaultInputs.boundLower;
      if (inUp) inUp.value = sc.defaultInputs.boundUpper;
      if (inErr) inErr.value = sc.defaultInputs.erroneous;

      if (selNorm) selNorm.value = sc.defaultExpected.normal;
      if (selLow) selLow.value = sc.defaultExpected.boundLower;
      if (selUp) selUp.value = sc.defaultExpected.boundUpper;
      if (selErr) selErr.value = sc.defaultExpected.erroneous;

      updateNumberLineMarkers();

      const consoleEl = document.getElementById('testplanConsole');
      if (consoleEl) {
        consoleEl.innerHTML = `<span style="color: #38bdf8;">[Worked Example Ready]</span> Pre-filled with standard test values. Click <strong>"Execute Test Harness"</strong> to watch line-by-line execution and automated result recording.`;
      }
    } else {
      const consoleEl = document.getElementById('testplanConsole');
      if (consoleEl) {
        consoleEl.innerHTML = `<span class="console-msg-dim">Select or enter test data and click "Execute Test Harness" to run.</span>`;
      }
    }
  }

  function populateSelectOptions(sc) {
    const selects = ['selectExpNormal', 'selectExpLower', 'selectExpUpper', 'selectExpErr'];
    selects.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = `
        <option value="">-- Choose Expected --</option>
        ${sc.outcomeOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
      `;
    });
  }

  function renderNumberLine(sc) {
    const minTick = document.getElementById('nlMinTick');
    const maxTick = document.getElementById('nlMaxTick');
    const validZone = document.getElementById('nlValidZone');

    if (minTick) minTick.innerText = `${sc.min}${sc.unit}`;
    if (maxTick) maxTick.innerText = `${sc.max}${sc.unit}`;
    if (validZone) validZone.innerText = `Valid Range: ${sc.min} to ${sc.max} ${sc.unit}`;

    updateNumberLineMarkers();
  }

  function updateNumberLineMarkers() {
    const track = document.getElementById('numberlineTrack');
    if (!track) return;

    track.querySelectorAll('.nl-pin').forEach(p => p.remove());

    const sc = TEST_SCENARIOS[currentScenarioIdx];
    const inputs = [
      { id: 'inputTestNormal', type: 'normal' },
      { id: 'inputTestBoundLower', type: 'boundary' },
      { id: 'inputTestBoundUpper', type: 'boundary' },
      { id: 'inputTestErroneous', type: 'erroneous' }
    ];

    inputs.forEach(item => {
      const el = document.getElementById(item.id);
      if (!el || !el.value) return;

      let num = parseFloat(el.value);
      if (sc.id === 'password_length') {
        num = el.value.length;
      }
      if (isNaN(num)) return;

      const range = sc.max - sc.min;
      let pct = 25 + ((num - sc.min) / range) * 50;
      if (pct < 2) pct = 2;
      if (pct > 98) pct = 98;

      const pin = document.createElement('div');
      pin.className = `nl-pin ${item.type}`;
      pin.style.left = `${pct}%`;
      pin.title = `${item.type}: ${el.value}`;
      track.appendChild(pin);
    });
  }

  function renderCode(sc) {
    const codeContainer = document.getElementById('testplanCodeViewer');
    if (!codeContainer) return;

    let html = '';
    sc.code.forEach((line, idx) => {
      const isBuggyLine = idx === sc.buggyLineIndex;
      const text = (isBuggyLine && codePatched) ? sc.fixedLine : line;
      const lineClass = (isBuggyLine && codePatched) ? 'fixed-line' : (isBuggyLine ? 'error-line' : '');
      const tag = (isBuggyLine && codePatched)
        ? '<span class="testplan-line-tag fixed">PATCHED ✓</span>'
        : (isBuggyLine && !sc.isWorkedExample ? '<span class="testplan-line-tag bug">BUG</span>' : '');

      html += `
        <div class="testplan-line ${lineClass}" id="tplCodeLine_${idx}">
          <span class="testplan-line-num">${idx + 1}</span>
          <span class="testplan-line-code">${escapeHtml(text)}</span>
          ${tag}
        </div>
      `;
    });

    codeContainer.innerHTML = html;
  }

  function highlightLine(lineIdx) {
    document.querySelectorAll('.testplan-line').forEach(el => el.classList.remove('active-exec'));
    if (lineIdx !== null && lineIdx !== undefined) {
      const lineEl = document.getElementById(`tplCodeLine_${lineIdx}`);
      if (lineEl) lineEl.classList.add('active-exec');
    }
  }

  function clearInputsAndResults() {
    ['inputTestNormal', 'inputTestBoundLower', 'inputTestBoundUpper', 'inputTestErroneous'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    ['selectExpNormal', 'selectExpLower', 'selectExpUpper', 'selectExpErr'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    ['resNormal', 'resLower', 'resUpper', 'resErr'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<span style="color: var(--ink-faint); font-size: 11px;">Enter test value &amp; run</span>';
    });

    document.querySelectorAll('.testplan-table tr').forEach(tr => tr.classList.remove('active-eval-row'));
    highlightLine(null);

    const alertBox = document.getElementById('testDefectAlert');
    if (alertBox) alertBox.style.display = 'none';

    const patchSlot = document.getElementById('patchButtonSlot');
    if (patchSlot) patchSlot.style.display = 'none';

    const statusBadge = document.getElementById('testSuiteBadge');
    if (statusBadge) {
      statusBadge.className = 'challenge-result-chip fail';
      statusBadge.innerText = '0 / 4 Tests Completed';
    }

    updateNumberLineMarkers();
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runAllTests() {
    const sc = TEST_SCENARIOS[currentScenarioIdx];

    const inputNormal = document.getElementById('inputTestNormal')?.value.trim() || '';
    const inputLower = document.getElementById('inputTestBoundLower')?.value.trim() || '';
    const inputUpper = document.getElementById('inputTestBoundUpper')?.value.trim() || '';
    const inputErr = document.getElementById('inputTestErroneous')?.value.trim() || '';

    const expNormal = document.getElementById('selectExpNormal')?.value || '';
    const expLower = document.getElementById('selectExpLower')?.value || '';
    const expUpper = document.getElementById('selectExpUpper')?.value || '';
    const expErr = document.getElementById('selectExpErr')?.value || '';

    const testRows = [
      {
        rowId: 'testRowNormal',
        cellId: 'resNormal',
        name: 'Normal',
        input: inputNormal,
        expUser: expNormal,
        isValidData: sc.validateData.normal(inputNormal),
        hint: sc.hints.normal,
        expTrue: sc.expectedCorrect(inputNormal)
      },
      {
        rowId: 'testRowBoundLower',
        cellId: 'resLower',
        name: 'Boundary (Min)',
        input: inputLower,
        expUser: expLower,
        isValidData: sc.validateData.boundLower(inputLower),
        hint: sc.hints.boundLower,
        expTrue: sc.expectedCorrect(inputLower)
      },
      {
        rowId: 'testRowBoundUpper',
        cellId: 'resUpper',
        name: 'Boundary (Max)',
        input: inputUpper,
        expUser: expUpper,
        isValidData: sc.validateData.boundUpper(inputUpper),
        hint: sc.hints.boundUpper,
        expTrue: sc.expectedCorrect(inputUpper)
      },
      {
        rowId: 'testRowErroneous',
        cellId: 'resErr',
        name: 'Erroneous',
        input: inputErr,
        expUser: expErr,
        isValidData: sc.validateData.erroneous(inputErr),
        hint: sc.hints.erroneous,
        expTrue: sc.expectedCorrect(inputErr)
      }
    ];

    // Pre-flight check
    let allInputsEntered = true;
    let dataCategoriesValid = true;

    testRows.forEach(row => {
      const resEl = document.getElementById(row.cellId);
      if (!row.input || !row.expUser) {
        allInputsEntered = false;
        if (resEl) resEl.innerHTML = `<span style="color: #ef4444; font-size: 11px;">⚠️ Enter test value &amp; expected outcome</span>`;
      } else if (!row.isValidData) {
        dataCategoriesValid = false;
        if (resEl) {
          resEl.innerHTML = `
            <div style="color: #ef4444; font-size: 11px; line-height: 1.4;">
              <strong>Invalid ${row.name} test data!</strong><br>
              ${row.hint}
            </div>
          `;
        }
      }
    });

    const statusBadge = document.getElementById('testSuiteBadge');
    const alertBox = document.getElementById('testDefectAlert');

    if (!allInputsEntered) {
      if (statusBadge) {
        statusBadge.className = 'challenge-result-chip fail';
        statusBadge.innerText = 'Test Suite Incomplete';
      }
      return;
    }

    if (!dataCategoriesValid) {
      if (statusBadge) {
        statusBadge.className = 'challenge-result-chip fail';
        statusBadge.innerText = 'Revise Test Data Values';
      }
      if (alertBox) {
        alertBox.style.display = 'flex';
        alertBox.className = 'defect-alert-banner';
        alertBox.style.background = 'rgba(245, 158, 11, 0.12)';
        alertBox.style.borderLeftColor = '#f59e0b';
        alertBox.innerHTML = `
          <div>
            <strong style="color: #b45309;">Tip: Check Test Data Categories</strong><br>
            One or more of your chosen values does not match the test type. Normal data must be safely inside limits, Boundary data must probe the exact threshold edges (${sc.min} and ${sc.max}), and Erroneous data must be outside.
          </div>
        `;
      }
      return;
    }

    // Begin animated step-by-step execution!
    isExecuting = true;
    const btnRunTests = document.getElementById('btnRunTestPlan');
    if (btnRunTests) btnRunTests.disabled = true;

    const termStatus = document.getElementById('testplanTerminalStatus');
    if (termStatus) {
      termStatus.className = 'terminal-status-pill running';
      termStatus.innerText = 'EXECUTING...';
    }

    const consoleEl = document.getElementById('testplanConsole');
    if (consoleEl) {
      consoleEl.innerHTML = `<div style="color: #38bdf8; font-weight: 700;">>>> RUNNING TEST HARNESS: ${sc.fileName || 'validator.py'}</div>`;
    }

    const execute = codePatched ? sc.runFixed : sc.runBuggy;
    let testHarnessDefectCaught = false;
    let correctCount = 0;

    for (let i = 0; i < testRows.length; i++) {
      const row = testRows[i];
      const rowEl = document.getElementById(row.rowId);
      const resEl = document.getElementById(row.cellId);

      // Highlight row being tested
      if (rowEl) rowEl.classList.add('active-eval-row');

      // 1. Highlight function header
      highlightLine(1);
      if (consoleEl) {
        const line = document.createElement('div');
        line.style.marginTop = '4px';
        line.innerHTML = `<strong>[Test ${i + 1}/4: ${row.name}]</strong> Calling <code>${sc.funcName}("${row.input}")</code>`;
        consoleEl.appendChild(line);
        consoleEl.scrollTop = consoleEl.scrollHeight;
      }
      await sleep(150);

      // 2. Highlight condition line
      highlightLine(sc.buggyLineIndex);
      await sleep(150);

      // 3. Execute logic and determine return branch
      const actual = execute(row.input);
      const matchedExpected = actual === row.expUser;
      const matchedSpecification = actual === row.expTrue;

      // Highlight return line (branch taken)
      const returnLineIdx = actual === sc.outcomeOptions[0] ? 4 : 6;
      highlightLine(returnLineIdx);

      if (consoleEl) {
        const line = document.createElement('div');
        line.style.paddingLeft = '12px';
        line.style.color = '#94a3b8';
        line.innerHTML = `↳ Evaluated condition: returned <strong>"${actual}"</strong>`;
        consoleEl.appendChild(line);
        consoleEl.scrollTop = consoleEl.scrollHeight;
      }
      await sleep(150);

      // Populate cell with result
      if (matchedExpected && matchedSpecification) {
        correctCount++;
        if (resEl) {
          resEl.innerHTML = `
            <span style="color: #10b981; font-weight: 700; font-size: 11.5px;">✓ PASS</span>
            <div style="font-size: 10.5px; color: var(--ink-secondary);">Output: "${actual}" (Matches spec)</div>
          `;
        }
        if (consoleEl) {
          const passLog = document.createElement('div');
          passLog.style.paddingLeft = '12px';
          passLog.style.color = '#34d399';
          passLog.innerHTML = `✓ Result matches expected: "${row.expUser}"`;
          consoleEl.appendChild(passLog);
        }
      } else {
        testHarnessDefectCaught = true;
        if (resEl) {
          resEl.innerHTML = `
            <span style="color: #ef4444; font-weight: 700; font-size: 11.5px;">✗ DEFECT EXPOSED</span>
            <div style="font-size: 10.5px; color: #ef4444;">
              Got: "${actual}" | Expected: "${row.expTrue}"
            </div>
          `;
        }
        if (consoleEl) {
          const errLog = document.createElement('div');
          errLog.style.paddingLeft = '12px';
          errLog.style.color = '#f87171';
          errLog.innerHTML = `✗ Defect caught! Got "${actual}", expected "${row.expTrue}"`;
          consoleEl.appendChild(errLog);
        }
      }

      if (consoleEl) consoleEl.scrollTop = consoleEl.scrollHeight;
      await sleep(300);

      // Clean up row highlight
      if (rowEl) rowEl.classList.remove('active-eval-row');
      highlightLine(null);
    }

    // Finish execution
    isExecuting = false;
    if (btnRunTests) btnRunTests.disabled = false;

    const patchSlot = document.getElementById('patchButtonSlot');

    if (testHarnessDefectCaught) {
      if (termStatus) {
        termStatus.className = 'terminal-status-pill error';
        termStatus.innerText = 'DEFECT DETECTED';
      }
      if (patchSlot) patchSlot.style.display = 'block';
      if (statusBadge) {
        statusBadge.className = 'challenge-result-chip fail';
        statusBadge.innerText = `${correctCount} / 4 Passed (1 Boundary Defect Exposed)`;
      }
      if (alertBox) {
        alertBox.style.display = 'flex';
        alertBox.className = 'defect-alert-banner';
        alertBox.style.background = 'rgba(239, 68, 68, 0.12)';
        alertBox.style.borderLeftColor = '#ef4444';
        alertBox.innerHTML = `
          <div>
            <strong style="color: #dc2626;">Boundary Defect Successfully Caught!</strong><br>
            ${sc.bugDesc} Notice that your Normal test data passed silently, but your Boundary test probe exposed the defect immediately.
            <div style="margin-top: 8px;">
              <button type="button" id="btnPatchDefect" class="btn-step-primary" style="font-size: 11.5px; padding: 4px 12px; background: #0284c7; border-color: #0284c7;">
                Patch Code Bug &rarr;
              </button>
            </div>
          </div>
        `;
        const btnPatch = document.getElementById('btnPatchDefect');
        if (btnPatch) {
          btnPatch.addEventListener('click', patchBugAndReRun);
        }
      }
    } else {
      if (termStatus) {
        termStatus.className = 'terminal-status-pill success';
        termStatus.innerText = 'ALL PASSED';
      }
      if (patchSlot) patchSlot.style.display = 'none';
      if (statusBadge) {
        statusBadge.className = 'challenge-result-chip pass';
        statusBadge.innerText = '4 / 4 Tests Passed ✓';
      }
      if (alertBox) {
        alertBox.style.display = 'flex';
        alertBox.className = 'defect-alert-banner';
        alertBox.style.background = 'rgba(16, 185, 129, 0.12)';
        alertBox.style.borderLeftColor = '#10b981';

        if (sc.isWorkedExample) {
          alertBox.innerHTML = `
            <div>
              <strong style="color: #10b981;">🎉 Worked Example Complete!</strong><br>
              You've seen how the test harness tested Normal (8), Lower Boundary (3), Upper Boundary (15), and Erroneous (25) data line-by-line. Now click <strong>"1. Scooter Hire Duration"</strong> above to build and execute your own test plan!
            </div>
          `;
        } else {
          alertBox.innerHTML = `
            <div>
              <strong style="color: #10b981;">✓ Robust Test Plan Verified!</strong><br>
              The Python function correctly handles normal in-range data, both inclusive boundary thresholds (${sc.min} and ${sc.max}), and cleanly handles erroneous inputs.
            </div>
          `;
        }
      }
      if (codePatched || sc.isWorkedExample) {
        triggerVictoryCelebration();
      }
    }
  }

  function patchBugAndReRun() {
    codePatched = true;
    const patchSlot = document.getElementById('patchButtonSlot');
    if (patchSlot) patchSlot.style.display = 'none';
    const sc = TEST_SCENARIOS[currentScenarioIdx];
    renderCode(sc);
    runAllTests();
  }

  function resetTestPlan() {
    if (isExecuting) return;
    loadScenario(currentScenarioIdx);
  }

  let lastCelebrationTime = 0;
  function triggerVictoryCelebration() {
    const now = Date.now();
    if (now - lastCelebrationTime < 2500) return;
    lastCelebrationTime = now;

    try {
      if (typeof confetti === 'function') {
        if (typeof confetti.reset === 'function') confetti.reset();
        confetti({ particleCount: 65, spread: 75, origin: { y: 0.6 } });
      }
    } catch (e) {}

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(freq, now + (idx * 0.08));
          gain.gain.setValueAtTime(0.0001, now + (idx * 0.08));
          gain.gain.linearRampToValueAtTime(0.15, now + (idx * 0.08) + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx * 0.08) + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + (idx * 0.08));
          osc.stop(now + (idx * 0.08) + 0.4);
        });
      }
    } catch (e) {}
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTestPlan);
  } else {
    initTestPlan();
  }

})();
