/**
 * GCSE Trace Table Lab Logic
 * Aligned with AQA 8525 Paper 1 (Computational Thinking, Algorithms & Testing)
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. THEME SUPPORT
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

  // =========================================================================
  // 2. EXAM PROBLEMS & SIMULATION DATASETS
  // =========================================================================

  const PROBLEMS = [
    {
      id: 'q1',
      title: 'Q1: Counter & While Loop',
      marksBadge: '3 MARKS (WARM-UP)',
      prompt: 'Trace the execution of this algorithm that calculates the triangular sum of numbers up to 4 using a <code>while</code> loop.',
      code: [
        'total = 0',
        'count = 1',
        'while count <= 4:',
        '    total = total + count',
        '    count = count + 1',
        'print("Done. Total =", total)'
      ],
      columns: ['count', 'total', 'Output'],
      initialVars: { count: '—', total: '—' },
      markSchemeNotes: `
        • <strong>1 Mark:</strong> Correct initialisation row: <code>count: 1, total: 0</code><br>
        • <strong>1 Mark:</strong> Correct loop updates: <code>total</code> sequence (1, 3, 6, 10) and <code>count</code> (2, 3, 4, 5)<br>
        • <strong>1 Mark:</strong> Correct terminal condition and final output: <code>Done. Total = 10</code>
      `,
      solutionRows: [
        { count: '1',  total: '0',  output: '' },
        { count: '2',  total: '1',  output: '' },
        { count: '3',  total: '3',  output: '' },
        { count: '4',  total: '6',  output: '' },
        { count: '5',  total: '10', output: '' },
        { count: '',   total: '',   output: 'Done. Total = 10' }
      ],
      steps: [
        { line: 1, vars: { count: '—', total: 0 }, changedVar: 'total', output: '', rowIdx: 0, desc: 'Set total = 0' },
        { line: 2, vars: { count: 1, total: 0 }, changedVar: 'count', output: '', rowIdx: 0, desc: 'Set count = 1' },
        { line: 3, vars: { count: 1, total: 0 }, changedVar: null, output: '', rowIdx: null, desc: 'Check count <= 4 (1 <= 4 is True, enter loop)' },
        { line: 4, vars: { count: 1, total: 1 }, changedVar: 'total', output: '', rowIdx: 1, desc: 'total = 0 + 1 = 1' },
        { line: 5, vars: { count: 2, total: 1 }, changedVar: 'count', output: '', rowIdx: 1, desc: 'count = 1 + 1 = 2' },
        { line: 3, vars: { count: 2, total: 1 }, changedVar: null, output: '', rowIdx: null, desc: 'Check count <= 4 (2 <= 4 is True)' },
        { line: 4, vars: { count: 2, total: 3 }, changedVar: 'total', output: '', rowIdx: 2, desc: 'total = 1 + 2 = 3' },
        { line: 5, vars: { count: 3, total: 3 }, changedVar: 'count', output: '', rowIdx: 2, desc: 'count = 2 + 1 = 3' },
        { line: 3, vars: { count: 3, total: 3 }, changedVar: null, output: '', rowIdx: null, desc: 'Check count <= 4 (3 <= 4 is True)' },
        { line: 4, vars: { count: 3, total: 6 }, changedVar: 'total', output: '', rowIdx: 3, desc: 'total = 3 + 3 = 6' },
        { line: 5, vars: { count: 4, total: 6 }, changedVar: 'count', output: '', rowIdx: 3, desc: 'count = 3 + 1 = 4' },
        { line: 3, vars: { count: 4, total: 6 }, changedVar: null, output: '', rowIdx: null, desc: 'Check count <= 4 (4 <= 4 is True)' },
        { line: 4, vars: { count: 4, total: 10 }, changedVar: 'total', output: '', rowIdx: 4, desc: 'total = 6 + 4 = 10' },
        { line: 5, vars: { count: 5, total: 10 }, changedVar: 'count', output: '', rowIdx: 4, desc: 'count = 4 + 1 = 5' },
        { line: 3, vars: { count: 5, total: 10 }, changedVar: null, output: '', rowIdx: null, desc: 'Check count <= 4 (5 <= 4 is FALSE -> loop terminates!)' },
        { line: 6, vars: { count: 5, total: 10 }, changedVar: null, output: 'Done. Total = 10', rowIdx: 5, desc: 'Print final message to console' }
      ]
    },
    {
      id: 'q2',
      title: 'Q2: Modulo & Selection Trap',
      marksBadge: '4 MARKS (EXAM TRAP)',
      prompt: 'Trace this algorithm containing a decrementing loop and an <code>if score % 2 == 0</code> even-number check.',
      code: [
        'score = 10',
        'bonus = 0',
        'while score > 0:',
        '    if score % 2 == 0:',
        '        bonus = bonus + 2',
        '    score = score - 3',
        'print("Bonus =", bonus)'
      ],
      columns: ['score', 'bonus', 'Output'],
      initialVars: { score: '—', bonus: '—' },
      markSchemeNotes: `
        • <strong>1 Mark:</strong> Initial values: <code>score: 10, bonus: 0</code><br>
        • <strong>1 Mark:</strong> Iteration 1: <code>bonus: 2, score: 7</code><br>
        • <strong>1 Mark:</strong> Subsequent decrements: <code>score: 4, bonus: 4, score: 1, score: -2</code><br>
        • <strong>1 Mark:</strong> Correct termination (stops at -2) and final output: <code>Bonus = 4</code>
      `,
      solutionRows: [
        { score: '10', bonus: '0', output: '' },
        { score: '7',  bonus: '2', output: '' },
        { score: '4',  bonus: '',  output: '' },
        { score: '1',  bonus: '4', output: '' },
        { score: '-2', bonus: '',  output: '' },
        { score: '',   bonus: '',  output: 'Bonus = 4' }
      ],
      steps: [
        { line: 1, vars: { score: 10, bonus: '—' }, changedVar: 'score', output: '', rowIdx: 0, desc: 'Set score = 10' },
        { line: 2, vars: { score: 10, bonus: 0 }, changedVar: 'bonus', output: '', rowIdx: 0, desc: 'Set bonus = 0' },
        { line: 3, vars: { score: 10, bonus: 0 }, changedVar: null, output: '', rowIdx: null, desc: 'Check score > 0 (10 > 0 is True)' },
        { line: 4, vars: { score: 10, bonus: 0 }, changedVar: null, output: '', rowIdx: null, desc: '10 % 2 == 0 is True' },
        { line: 5, vars: { score: 10, bonus: 2 }, changedVar: 'bonus', output: '', rowIdx: 1, desc: 'bonus = 0 + 2 = 2' },
        { line: 6, vars: { score: 7, bonus: 2 }, changedVar: 'score', output: '', rowIdx: 1, desc: 'score = 10 - 3 = 7' },
        { line: 3, vars: { score: 7, bonus: 2 }, changedVar: null, output: '', rowIdx: null, desc: 'Check score > 0 (7 > 0 is True)' },
        { line: 4, vars: { score: 7, bonus: 2 }, changedVar: null, output: '', rowIdx: null, desc: '7 % 2 == 0 is False (skip bonus)' },
        { line: 6, vars: { score: 4, bonus: 2 }, changedVar: 'score', output: '', rowIdx: 2, desc: 'score = 7 - 3 = 4' },
        { line: 3, vars: { score: 4, bonus: 2 }, changedVar: null, output: '', rowIdx: null, desc: 'Check score > 0 (4 > 0 is True)' },
        { line: 4, vars: { score: 4, bonus: 2 }, changedVar: null, output: '', rowIdx: null, desc: '4 % 2 == 0 is True' },
        { line: 5, vars: { score: 4, bonus: 4 }, changedVar: 'bonus', output: '', rowIdx: 3, desc: 'bonus = 2 + 2 = 4' },
        { line: 6, vars: { score: 1, bonus: 4 }, changedVar: 'score', output: '', rowIdx: 3, desc: 'score = 4 - 3 = 1' },
        { line: 3, vars: { score: 1, bonus: 4 }, changedVar: null, output: '', rowIdx: null, desc: 'Check score > 0 (1 > 0 is True)' },
        { line: 4, vars: { score: 1, bonus: 4 }, changedVar: null, output: '', rowIdx: null, desc: '1 % 2 == 0 is False' },
        { line: 6, vars: { score: -2, bonus: 4 }, changedVar: 'score', output: '', rowIdx: 4, desc: 'score = 1 - 3 = -2' },
        { line: 3, vars: { score: -2, bonus: 4 }, changedVar: null, output: '', rowIdx: null, desc: 'Check score > 0 (-2 > 0 is FALSE -> loop terminates!)' },
        { line: 7, vars: { score: -2, bonus: 4 }, changedVar: null, output: 'Bonus = 4', rowIdx: 5, desc: 'Print output' }
      ]
    },
    {
      id: 'q3',
      title: 'Q3: Search with Boolean Flag',
      marksBadge: '5 MARKS (CORE AQA)',
      prompt: 'Trace an array search that stops immediately once a value greater than 6 is found using a boolean flag.',
      code: [
        'nums = [4, 7, 2, 9]',
        'found = False',
        'i = 0',
        'while i < 4 and found == False:',
        '    if nums[i] > 6:',
        '        found = True',
        '    else:',
        '        i = i + 1',
        'print("Found at index", i)'
      ],
      columns: ['found', 'i', 'Output'],
      initialVars: { found: '—', i: '—' },
      markSchemeNotes: `
        • <strong>1 Mark:</strong> Initial row: <code>found: False, i: 0</code><br>
        • <strong>1 Mark:</strong> Iteration 0: nums[0]=4 (&lt;=6) &rarr; else executed &rarr; <code>i: 1</code><br>
        • <strong>1 Mark:</strong> Iteration 1: nums[1]=7 (&gt;6) &rarr; <code>found: True</code><br>
        • <strong>1 Mark:</strong> Noticing <code>i</code> does NOT increment when <code>found</code> becomes True (remains 1)!<br>
        • <strong>1 Mark:</strong> Final output: <code>Found at index 1</code>
      `,
      solutionRows: [
        { found: 'False', i: '0', output: '' },
        { found: '',      i: '1', output: '' },
        { found: 'True',  i: '',  output: '' },
        { found: '',      i: '',  output: 'Found at index 1' }
      ],
      steps: [
        { line: 1, vars: { found: '—', i: '—' }, changedVar: null, output: '', rowIdx: null, desc: 'List nums = [4, 7, 2, 9] initialized' },
        { line: 2, vars: { found: 'False', i: '—' }, changedVar: 'found', output: '', rowIdx: 0, desc: 'found = False' },
        { line: 3, vars: { found: 'False', i: 0 }, changedVar: 'i', output: '', rowIdx: 0, desc: 'i = 0' },
        { line: 4, vars: { found: 'False', i: 0 }, changedVar: null, output: '', rowIdx: null, desc: 'i < 4 and found == False (0 < 4 and True -> continue)' },
        { line: 5, vars: { found: 'False', i: 0 }, changedVar: null, output: '', rowIdx: null, desc: 'nums[0] is 4. 4 > 6 is False.' },
        { line: 7, vars: { found: 'False', i: 0 }, changedVar: null, output: '', rowIdx: null, desc: 'Execute else branch' },
        { line: 8, vars: { found: 'False', i: 1 }, changedVar: 'i', output: '', rowIdx: 1, desc: 'i = 0 + 1 = 1' },
        { line: 4, vars: { found: 'False', i: 1 }, changedVar: null, output: '', rowIdx: null, desc: '1 < 4 and found == False is True' },
        { line: 5, vars: { found: 'False', i: 1 }, changedVar: null, output: '', rowIdx: null, desc: 'nums[1] is 7. 7 > 6 is TRUE!' },
        { line: 6, vars: { found: 'True', i: 1 }, changedVar: 'found', output: '', rowIdx: 2, desc: 'found = True (Notice i does not change!)' },
        { line: 4, vars: { found: 'True', i: 1 }, changedVar: null, output: '', rowIdx: null, desc: 'found == False is now FALSE -> Loop terminates!' },
        { line: 9, vars: { found: 'True', i: 1 }, changedVar: null, output: 'Found at index 1', rowIdx: 3, desc: 'Print output' }
      ]
    },
    {
      id: 'q4',
      title: 'Q4: Integer Div & Mod (Binary)',
      marksBadge: '5 MARKS (ALGORITHMIC)',
      prompt: 'Trace how repeated integer division (<code>//</code>) and modulo (<code>%</code>) convert decimal number 13 into binary.',
      code: [
        'n = 13',
        'bits = ""',
        'while n > 0:',
        '    rem = n % 2',
        '    bits = str(rem) + bits',
        '    n = n // 2',
        'print("Binary =", bits)'
      ],
      columns: ['n', 'rem', 'bits', 'Output'],
      initialVars: { n: '—', rem: '—', bits: '—' },
      markSchemeNotes: `
        • <strong>1 Mark:</strong> Initial values: <code>n: 13, bits: ""</code><br>
        • <strong>1 Mark:</strong> Iteration 1: <code>rem: 1, bits: "1", n: 6</code><br>
        • <strong>1 Mark:</strong> Iteration 2: <code>rem: 0, bits: "01", n: 3</code><br>
        • <strong>1 Mark:</strong> Iteration 3 & 4: <code>rem: 1, bits: "101", n: 1</code> then <code>rem: 1, bits: "1101", n: 0</code><br>
        • <strong>1 Mark:</strong> Loop terminates at n=0 with output: <code>Binary = 1101</code>
      `,
      solutionRows: [
        { n: '13', rem: '',  bits: '""',     output: '' },
        { n: '6',  rem: '1', bits: '"1"',    output: '' },
        { n: '3',  rem: '0', bits: '"01"',   output: '' },
        { n: '1',  rem: '1', bits: '"101"',  output: '' },
        { n: '0',  rem: '1', bits: '"1101"', output: '' },
        { n: '',   rem: '',  bits: '',       output: 'Binary = 1101' }
      ],
      steps: [
        { line: 1, vars: { n: 13, rem: '—', bits: '—' }, changedVar: 'n', output: '', rowIdx: 0, desc: 'n = 13' },
        { line: 2, vars: { n: 13, rem: '—', bits: '""' }, changedVar: 'bits', output: '', rowIdx: 0, desc: 'bits = "" (empty string)' },
        { line: 3, vars: { n: 13, rem: '—', bits: '""' }, changedVar: null, output: '', rowIdx: null, desc: '13 > 0 is True' },
        { line: 4, vars: { n: 13, rem: 1, bits: '""' }, changedVar: 'rem', output: '', rowIdx: 1, desc: 'rem = 13 % 2 = 1' },
        { line: 5, vars: { n: 13, rem: 1, bits: '"1"' }, changedVar: 'bits', output: '', rowIdx: 1, desc: 'bits = "1" + "" = "1"' },
        { line: 6, vars: { n: 6, rem: 1, bits: '"1"' }, changedVar: 'n', output: '', rowIdx: 1, desc: 'n = 13 // 2 = 6' },
        { line: 3, vars: { n: 6, rem: 1, bits: '"1"' }, changedVar: null, output: '', rowIdx: null, desc: '6 > 0 is True' },
        { line: 4, vars: { n: 6, rem: 0, bits: '"1"' }, changedVar: 'rem', output: '', rowIdx: 2, desc: 'rem = 6 % 2 = 0' },
        { line: 5, vars: { n: 6, rem: 0, bits: '"01"' }, changedVar: 'bits', output: '', rowIdx: 2, desc: 'bits = "0" + "1" = "01"' },
        { line: 6, vars: { n: 3, rem: 0, bits: '"01"' }, changedVar: 'n', output: '', rowIdx: 2, desc: 'n = 6 // 2 = 3' },
        { line: 3, vars: { n: 3, rem: 0, bits: '"01"' }, changedVar: null, output: '', rowIdx: null, desc: '3 > 0 is True' },
        { line: 4, vars: { n: 3, rem: 1, bits: '"01"' }, changedVar: 'rem', output: '', rowIdx: 3, desc: 'rem = 3 % 2 = 1' },
        { line: 5, vars: { n: 3, rem: 1, bits: '"101"' }, changedVar: 'bits', output: '', rowIdx: 3, desc: 'bits = "1" + "01" = "101"' },
        { line: 6, vars: { n: 1, rem: 1, bits: '"101"' }, changedVar: 'n', output: '', rowIdx: 3, desc: 'n = 3 // 2 = 1' },
        { line: 3, vars: { n: 1, rem: 1, bits: '"101"' }, changedVar: null, output: '', rowIdx: null, desc: '1 > 0 is True' },
        { line: 4, vars: { n: 1, rem: 1, bits: '"101"' }, changedVar: 'rem', output: '', rowIdx: 4, desc: 'rem = 1 % 2 = 1' },
        { line: 5, vars: { n: 1, rem: 1, bits: '"1101"' }, changedVar: 'bits', output: '', rowIdx: 4, desc: 'bits = "1" + "101" = "1101"' },
        { line: 6, vars: { n: 0, rem: 1, bits: '"1101"' }, changedVar: 'n', output: '', rowIdx: 4, desc: 'n = 1 // 2 = 0' },
        { line: 3, vars: { n: 0, rem: 1, bits: '"1101"' }, changedVar: null, output: '', rowIdx: null, desc: '0 > 0 is FALSE -> Loop terminates!' },
        { line: 7, vars: { n: 0, rem: 1, bits: '"1101"' }, changedVar: null, output: 'Binary = 1101', rowIdx: 5, desc: 'Print output' }
      ]
    }
  ];

  // =========================================================================
  // 3. APPLICATION STATE
  // =========================================================================

  let activeProblemIndex = 0;
  let currentStepIndex = -1; // -1 = before start
  let isAutoPlaying = false;
  let autoPlayTimer = null;
  let activeMode = 'auto'; // 'auto' | 'practice'

  // =========================================================================
  // 4. RENDERING & UI UPDATES
  // =========================================================================

  function loadProblem(index) {
    activeProblemIndex = index;
    currentStepIndex = -1;
    stopAutoPlay();

    const p = PROBLEMS[index];
    if (!p) return;

    // Update pill tabs
    const pills = document.querySelectorAll('.challenge-pill-btn');
    pills.forEach((pill, idx) => {
      pill.classList.toggle('active', idx === index);
    });

    // Update headers
    document.getElementById('problemTitle').textContent = p.title;
    document.getElementById('problemMarksBadge').textContent = p.marksBadge;
    document.getElementById('problemPrompt').innerHTML = p.prompt;
    document.getElementById('markSchemeNotes').innerHTML = p.markSchemeNotes;

    // Reset console
    const consoleBox = document.getElementById('consoleOutputBox');
    consoleBox.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">(No output printed yet)</span>';

    // Render code view
    renderCode(p.code);

    // Render live variables
    renderVarChips(p.initialVars);

    // Render Trace Grid depending on mode
    renderTraceGrid();

    // Reset step explanation text
    const expText = document.getElementById('stepExplanationText');
    if (expText) expText.textContent = "Click 'Step Line' to trace line 1";

    // Reset feedback
    const feedbackBox = document.getElementById('practiceFeedbackBox');
    if (feedbackBox) feedbackBox.style.display = 'none';
    const scoreBadge = document.getElementById('practiceScoreBadge');
    if (scoreBadge) scoreBadge.textContent = '';
  }

  function renderCode(codeLines) {
    const viewer = document.getElementById('codeViewer');
    viewer.innerHTML = '';

    codeLines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const lineDiv = document.createElement('div');
      lineDiv.className = 'code-line';
      lineDiv.id = `codeLine-${lineNum}`;

      const numSpan = document.createElement('span');
      numSpan.className = 'code-line-num';
      numSpan.textContent = lineNum;

      const textSpan = document.createElement('span');
      textSpan.className = 'code-line-text';
      textSpan.textContent = lineText;

      lineDiv.appendChild(numSpan);
      lineDiv.appendChild(textSpan);
      viewer.appendChild(lineDiv);
    });
  }

  function renderVarChips(varsObj) {
    const grid = document.getElementById('varWatchGrid');
    grid.innerHTML = '';

    Object.entries(varsObj).forEach(([vName, vVal]) => {
      const chip = document.createElement('div');
      chip.className = 'var-chip';
      chip.id = `varChip-${vName}`;
      chip.innerHTML = `
        <span class="var-name">${vName}</span>
        <span class="var-value" id="varVal-${vName}">${vVal}</span>
      `;
      grid.appendChild(chip);
    });
  }

  function renderTraceGrid() {
    const p = PROBLEMS[activeProblemIndex];
    const head = document.getElementById('traceGridHead');
    const body = document.getElementById('traceGridBody');

    head.innerHTML = '';
    body.innerHTML = '';

    // Headers
    const htr = document.createElement('tr');
    
    // Add Row / Step # column
    const thStep = document.createElement('th');
    thStep.textContent = '#';
    thStep.style.width = '36px';
    htr.appendChild(thStep);

    p.columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      htr.appendChild(th);
    });
    head.appendChild(htr);

    if (activeMode === 'auto') {
      // Auto-Sync Mode: Render empty rows initially
      p.solutionRows.forEach((row, rowIdx) => {
        const tr = document.createElement('tr');
        tr.id = `traceRow-${rowIdx}`;

        const tdStep = document.createElement('td');
        tdStep.textContent = rowIdx + 1;
        tdStep.style.color = 'var(--text-muted)';
        tr.appendChild(tdStep);

        p.columns.forEach(col => {
          const td = document.createElement('td');
          td.id = `traceCell-${rowIdx}-${col}`;
          td.textContent = '—';
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
    } else {
      // Student Test Mode: Render input fields
      p.solutionRows.forEach((row, rowIdx) => {
        const tr = document.createElement('tr');

        const tdStep = document.createElement('td');
        tdStep.textContent = rowIdx + 1;
        tdStep.style.color = 'var(--text-muted)';
        tr.appendChild(tdStep);

        p.columns.forEach(col => {
          const td = document.createElement('td');
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'trace-input';
          input.setAttribute('data-row', rowIdx);
          input.setAttribute('data-col', col);
          input.placeholder = 'leave blank if unchanged';
          td.appendChild(input);
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
    }
  }

  // =========================================================================
  // 5. STEPPER ENGINE (AUTO-SYNC MODE)
  // =========================================================================

  function stepForward() {
    const p = PROBLEMS[activeProblemIndex];
    if (!p) return;

    if (currentStepIndex >= p.steps.length - 1) {
      stopAutoPlay();
      return;
    }

    currentStepIndex++;
    applyStep(currentStepIndex);
  }

  function stepBack() {
    if (currentStepIndex <= 0) {
      resetTrace();
      return;
    }
    stopAutoPlay();
    currentStepIndex--;
    applyStep(currentStepIndex);
  }

  function resetTrace() {
    stopAutoPlay();
    currentStepIndex = -1;
    const p = PROBLEMS[activeProblemIndex];

    // Remove active code lines
    document.querySelectorAll('.code-line').forEach(l => l.classList.remove('active'));

    // Reset variables
    renderVarChips(p.initialVars);

    // Reset console
    const consoleBox = document.getElementById('consoleOutputBox');
    if (consoleBox) {
      consoleBox.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">(No output printed yet)</span>';
    }

    // Reset explanation
    const expText = document.getElementById('stepExplanationText');
    if (expText) {
      expText.textContent = "Click 'Step Line' to trace line 1";
    }

    // Reset table cells
    syncTraceTableToStep(-1);
  }

  function syncTraceTableToStep(stepIdx) {
    if (activeMode !== 'auto') return;
    const p = PROBLEMS[activeProblemIndex];
    if (!p) return;

    // Reset all cells in all rows to '—' and clear highlights
    p.solutionRows.forEach((row, rowIdx) => {
      p.columns.forEach(col => {
        const cell = document.getElementById(`traceCell-${rowIdx}-${col}`);
        if (cell) {
          cell.textContent = '—';
          cell.className = '';
        }
      });
      const tr = document.getElementById(`traceRow-${rowIdx}`);
      if (tr) tr.classList.remove('active-row');
    });

    if (stepIdx < 0) return;

    // Highlight the row of the current step if applicable
    const currentStep = p.steps[stepIdx];
    if (currentStep && currentStep.rowIdx !== null) {
      const tr = document.getElementById(`traceRow-${currentStep.rowIdx}`);
      if (tr) tr.classList.add('active-row');
    }

    // Replay each step from 0 up to stepIdx
    for (let i = 0; i <= stepIdx; i++) {
      const s = p.steps[i];
      if (!s || s.rowIdx === null) continue;

      const isCurrentStep = (i === stepIdx);

      // Variable assignment update
      if (s.changedVar) {
        const cell = document.getElementById(`traceCell-${s.rowIdx}-${s.changedVar}`);
        if (cell) {
          cell.textContent = String(s.vars[s.changedVar]);
          cell.className = isCurrentStep ? 'cell-changed' : '';
        }
      }

      // Terminal output
      if (s.output) {
        const cell = document.getElementById(`traceCell-${s.rowIdx}-Output`);
        if (cell) {
          cell.textContent = s.output;
          cell.className = isCurrentStep ? 'cell-output' : '';
        }
      }
    }
  }

  function applyStep(stepIdx) {
    const p = PROBLEMS[activeProblemIndex];
    const step = p.steps[stepIdx];
    if (!step) return;

    // Highlight active code line
    document.querySelectorAll('.code-line').forEach(l => l.classList.remove('active'));
    const activeLine = document.getElementById(`codeLine-${step.line}`);
    if (activeLine) activeLine.classList.add('active');

    // Update live variable chips
    Object.entries(step.vars).forEach(([vName, vVal]) => {
      const valEl = document.getElementById(`varVal-${vName}`);
      const chipEl = document.getElementById(`varChip-${vName}`);
      if (valEl) {
        valEl.textContent = vVal;
      }
      if (chipEl && vName === step.changedVar) {
        chipEl.classList.remove('changed');
        void chipEl.offsetWidth; // trigger reflow
        chipEl.classList.add('changed');
      }
    });

    // Console output: reconstruct up to current step so Back button also works
    let latestOutput = '';
    for (let i = 0; i <= stepIdx; i++) {
      if (p.steps[i].output) latestOutput = p.steps[i].output;
    }
    const consoleBox = document.getElementById('consoleOutputBox');
    if (consoleBox) {
      if (latestOutput) {
        consoleBox.textContent = `> ${latestOutput}`;
        consoleBox.style.color = 'var(--forest-green, #1a6b3c)';
      } else {
        consoleBox.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">(No output printed yet)</span>';
      }
    }

    // Step explanation text
    const expText = document.getElementById('stepExplanationText');
    if (expText && step.desc) {
      expText.textContent = `Line ${step.line}: ${step.desc}`;
    }

    // Sync trace table cells dynamically
    syncTraceTableToStep(stepIdx);
  }

  function toggleAutoPlay() {
    if (isAutoPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  }

  function startAutoPlay() {
    isAutoPlaying = true;
    const btn = document.getElementById('btnAutoPlay');
    if (btn) btn.textContent = '⏸ Pause';

    autoPlayTimer = setInterval(() => {
      const p = PROBLEMS[activeProblemIndex];
      if (currentStepIndex >= p.steps.length - 1) {
        stopAutoPlay();
      } else {
        stepForward();
      }
    }, 900);
  }

  function stopAutoPlay() {
    isAutoPlaying = false;
    clearInterval(autoPlayTimer);
    const btn = document.getElementById('btnAutoPlay');
    if (btn) btn.textContent = '▶ Auto Play';
  }

  // =========================================================================
  // 6. STUDENT TEST MODE & VERIFIER
  // =========================================================================

  function setMode(mode) {
    activeMode = mode;
    stopAutoPlay();

    const modeAutoBtn = document.getElementById('modeAutoBtn');
    const modePracticeBtn = document.getElementById('modePracticeBtn');
    const modeDesc = document.getElementById('modeDescText');
    const practiceToolbar = document.getElementById('practiceActionsBar');

    if (mode === 'auto') {
      modeAutoBtn.classList.add('active');
      modePracticeBtn.classList.remove('active');
      modeDesc.innerHTML = '<strong>Auto-Sync Mode:</strong> As you click <strong>Step Line</strong>, the table fills automatically and highlights changing variables.';
      if (practiceToolbar) practiceToolbar.style.display = 'none';
    } else {
      modePracticeBtn.classList.add('active');
      modeAutoBtn.classList.remove('active');
      modeDesc.innerHTML = '<strong>Student Test Mode:</strong> Fill in the blanks below as you trace the code! Remember: leave cells blank if a variable does not change.';
      if (practiceToolbar) practiceToolbar.style.display = 'flex';
    }

    renderTraceGrid();
  }

  function checkPracticeAnswers() {
    const p = PROBLEMS[activeProblemIndex];
    if (!p) return;

    const inputs = document.querySelectorAll('.trace-input');
    let totalCells = 0;
    let correctCells = 0;

    inputs.forEach(input => {
      const rowIdx = parseInt(input.getAttribute('data-row'), 10);
      const colName = input.getAttribute('data-col');
      const userVal = input.value.trim();

      let expectedVal = '';
      if (colName === 'Output') {
        expectedVal = p.solutionRows[rowIdx]?.output || '';
      } else {
        expectedVal = p.solutionRows[rowIdx]?.[colName] || '';
      }

      totalCells++;

      // Normalize string comparisons: ignore outer quotes & case for booleans
      const cleanUser = userVal.replace(/^["']|["']$/g, '').toLowerCase();
      const cleanExpected = expectedVal.replace(/^["']|["']$/g, '').toLowerCase();

      if (cleanUser === cleanExpected) {
        input.classList.remove('wrong');
        input.classList.add('correct');
        correctCells++;
      } else {
        input.classList.remove('correct');
        input.classList.add('wrong');
      }
    });

    const scorePct = Math.round((correctCells / totalCells) * 100);
    const feedbackBox = document.getElementById('practiceFeedbackBox');
    const scoreBadge = document.getElementById('practiceScoreBadge');

    if (scoreBadge) {
      scoreBadge.textContent = `${correctCells} / ${totalCells} cells correct (${scorePct}%)`;
    }

    if (feedbackBox) {
      feedbackBox.style.display = 'block';
      if (scorePct === 100) {
        feedbackBox.style.background = 'var(--green-tint, #edf7f0)';
        feedbackBox.style.border = '1px solid var(--forest-green, #1a6b3c)';
        feedbackBox.style.color = 'var(--forest-green, #1a6b3c)';
        feedbackBox.innerHTML = `
          <strong>✓ Full Marks (${correctCells}/${totalCells}):</strong><br>
          You correctly recorded variable updates only on the lines where values changed, maintained correct loop bounds, and traced the terminal output accurately.
        `;
      } else {
        feedbackBox.style.background = 'var(--red-tint, #fef2f2)';
        feedbackBox.style.border = '1px solid var(--cardinal-red, #a82020)';
        feedbackBox.style.color = 'var(--cardinal-red, #a82020)';
        feedbackBox.innerHTML = `
          <strong>⚠️ Check Your Trace (${correctCells} of ${totalCells} cells matched):</strong><br>
          Red cells highlight where your trace differed from the mark scheme. Check loop conditions carefully, and remember only to write in a column when that variable changes value.
        `;
      }
    }
  }

  function revealSolution() {
    const p = PROBLEMS[activeProblemIndex];
    if (!p) return;

    const inputs = document.querySelectorAll('.trace-input');
    inputs.forEach(input => {
      const rowIdx = parseInt(input.getAttribute('data-row'), 10);
      const colName = input.getAttribute('data-col');

      let expectedVal = '';
      if (colName === 'Output') {
        expectedVal = p.solutionRows[rowIdx]?.output || '';
      } else {
        expectedVal = p.solutionRows[rowIdx]?.[colName] || '';
      }

      input.value = expectedVal;
      input.classList.remove('wrong');
      input.classList.add('correct');
    });

    const scoreBadge = document.getElementById('practiceScoreBadge');
    if (scoreBadge) scoreBadge.textContent = 'Solution Revealed (Model Answers)';
  }

  // =========================================================================
  // 7. INITIALIZATION
  // =========================================================================

  function init() {
    initTheme();

    // Challenge pills
    const pills = document.querySelectorAll('.challenge-pill-btn');
    pills.forEach((btn, idx) => {
      btn.addEventListener('click', () => loadProblem(idx));
    });

    // Step controls
    const btnStepForward = document.getElementById('btnStepForward');
    const btnStepBack = document.getElementById('btnStepBack');
    const btnReset = document.getElementById('btnResetTrace');
    const btnAutoPlay = document.getElementById('btnAutoPlay');

    if (btnStepForward) btnStepForward.addEventListener('click', stepForward);
    if (btnStepBack) btnStepBack.addEventListener('click', stepBack);
    if (btnReset) btnReset.addEventListener('click', resetTrace);
    if (btnAutoPlay) btnAutoPlay.addEventListener('click', toggleAutoPlay);

    // Mode buttons
    const modeAutoBtn = document.getElementById('modeAutoBtn');
    const modePracticeBtn = document.getElementById('modePracticeBtn');
    if (modeAutoBtn) modeAutoBtn.addEventListener('click', () => setMode('auto'));
    if (modePracticeBtn) modePracticeBtn.addEventListener('click', () => setMode('practice'));

    // Practice buttons
    const btnCheck = document.getElementById('btnCheckPracticeAnswers');
    const btnReveal = document.getElementById('btnRevealAnswers');
    if (btnCheck) btnCheck.addEventListener('click', checkPracticeAnswers);
    if (btnReveal) btnReveal.addEventListener('click', revealSolution);

    // Initial load
    loadProblem(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
