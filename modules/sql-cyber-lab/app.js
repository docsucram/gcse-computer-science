/**
 * GCSE SQL & Cyber Security Lab Module Logic
 * Pure Vanilla JavaScript (ES6+) - Zero build tools required
 * Aligned with AQA 8525 §3.6 (Cyber Security) & §3.7 (Relational Databases & SQL)
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. THEME & NAVIGATION
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
  // 2. TAB 1: RELATIONAL DATABASE & SQL ENGINE (§3.7)
  // =========================================================================

  const DB_SCHEMA = {
    Students: {
      pk: 'StudentID',
      fk: null,
      columns: ['StudentID', 'FirstName', 'LastName', 'YearGroup', 'FormGroup'],
      rows: [
        { StudentID: 101, FirstName: 'Alice',   LastName: 'Smith',   YearGroup: 11, FormGroup: '11A' },
        { StudentID: 102, FirstName: 'Bob',     LastName: 'Jones',   YearGroup: 11, FormGroup: '11B' },
        { StudentID: 103, FirstName: 'Charlie', LastName: 'Brown',   YearGroup: 10, FormGroup: '10A' },
        { StudentID: 104, FirstName: 'Daisy',   LastName: 'Evans',   YearGroup: 11, FormGroup: '11A' },
        { StudentID: 105, FirstName: 'Ethan',   LastName: 'Taylor',  YearGroup: 10, FormGroup: '10B' },
        { StudentID: 106, FirstName: 'Fiona',   LastName: 'White',   YearGroup: 11, FormGroup: '11C' },
        { StudentID: 107, FirstName: 'George',  LastName: 'Miller',  YearGroup: 10, FormGroup: '10A' },
      ]
    },
    ExamResults: {
      pk: 'ResultID',
      fk: 'StudentID',
      columns: ['ResultID', 'StudentID', 'Subject', 'Grade', 'Score'],
      rows: [
        { ResultID: 501, StudentID: 101, Subject: 'Computing', Grade: '9', Score: 94 },
        { ResultID: 502, StudentID: 101, Subject: 'Maths',     Grade: '8', Score: 85 },
        { ResultID: 503, StudentID: 102, Subject: 'Computing', Grade: '6', Score: 62 },
        { ResultID: 504, StudentID: 103, Subject: 'Computing', Grade: '7', Score: 74 },
        { ResultID: 505, StudentID: 104, Subject: 'Computing', Grade: '9', Score: 91 },
        { ResultID: 506, StudentID: 105, Subject: 'Computing', Grade: '5', Score: 58 },
        { ResultID: 507, StudentID: 106, Subject: 'Computing', Grade: '8', Score: 83 },
        { ResultID: 508, StudentID: 107, Subject: 'Computing', Grade: '7', Score: 72 },
      ]
    }
  };

  let workingDb = JSON.parse(JSON.stringify(DB_SCHEMA));

  function renderSchemaTables() {
    // Render Students Table
    const stBody = document.getElementById('studentsTableBody');
    if (stBody) {
      stBody.innerHTML = '';
      workingDb.Students.rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${r.StudentID}</strong></td>
          <td>${r.FirstName}</td>
          <td>${r.LastName}</td>
          <td>${r.YearGroup}</td>
          <td>${r.FormGroup}</td>
        `;
        stBody.appendChild(tr);
      });
      document.getElementById('studentsRowCount').textContent = `${workingDb.Students.rows.length} records`;
    }

    // Render ExamResults Table
    const exBody = document.getElementById('examResultsTableBody');
    if (exBody) {
      exBody.innerHTML = '';
      workingDb.ExamResults.rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${r.ResultID}</strong></td>
          <td><span style="color: #c084fc;">${r.StudentID}</span></td>
          <td>${r.Subject}</td>
          <td>${r.Grade}</td>
          <td>${r.Score}</td>
        `;
        exBody.appendChild(tr);
      });
      document.getElementById('examResultsRowCount').textContent = `${workingDb.ExamResults.rows.length} records`;
    }
  }

  // Shared Pure Client-side AQA Standard SQL Parser & Evaluator
  function parseAndRunSQL(rawQuery) {
    const query = rawQuery.trim().replace(/;$/, '');
    if (!query) {
      return { success: false, error: 'Please enter an SQL query.' };
    }

    const regex = /SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?$/i;
    const match = query.match(regex);
    if (!match) {
      return {
        success: false,
        error: 'Syntax error. Query must follow: SELECT ... FROM ... [WHERE ...] [ORDER BY ...]'
      };
    }

    const selectPart = match[1].trim();
    const fromPart = match[2].trim();
    const wherePart = match[3] ? match[3].trim() : null;
    const orderPart = match[4] ? match[4].trim() : null;

    const tableKey = Object.keys(workingDb).find(k => k.toLowerCase() === fromPart.toLowerCase());
    if (!tableKey) {
      return {
        success: false,
        error: `Table '${fromPart}' not found. Available tables: Students, ExamResults.`
      };
    }

    const tableMeta = workingDb[tableKey];
    let workingRows = [...tableMeta.rows];
    const traceSteps = [];

    traceSteps.push({
      type: 'from',
      title: 'Step 1: FROM Clause',
      html: `Loaded source table <code>${tableKey}</code> containing <strong>${workingRows.length}</strong> total records.`
    });

    if (wherePart) {
      const initialCount = workingRows.length;
      try {
        workingRows = workingRows.filter(row => evaluateWhere(row, wherePart));
        traceSteps.push({
          type: 'where',
          title: 'Step 2: WHERE Clause Filtering',
          html: `Applied condition <code>${escapeHTML(wherePart)}</code>. Filtered ${initialCount} records down to <strong>${workingRows.length}</strong> matching records.`
        });
      } catch (err) {
        return { success: false, error: `WHERE clause error: ${err.message}` };
      }
    } else {
      traceSteps.push({
        type: 'where',
        title: 'Step 2: WHERE Clause',
        html: 'No WHERE condition specified. All records passed through.'
      });
    }

    if (orderPart) {
      const orderTokens = orderPart.split(/\s+/);
      const orderCol = orderTokens[0];
      const isDesc = orderTokens.length > 1 && orderTokens[1].toUpperCase() === 'DESC';

      const matchedCol = tableMeta.columns.find(c => c.toLowerCase() === orderCol.toLowerCase());
      if (matchedCol) {
        workingRows.sort((a, b) => {
          let valA = a[matchedCol];
          let valB = b[matchedCol];
          if (typeof valA === 'number' && typeof valB === 'number') {
            return isDesc ? valB - valA : valA - valB;
          }
          return isDesc
            ? String(valB).localeCompare(String(valA))
            : String(valA).localeCompare(String(valB));
        });
        traceSteps.push({
          type: 'order',
          title: 'Step 3: ORDER BY Clause',
          html: `Sorted records by column <code>${matchedCol}</code> (${isDesc ? 'DESC: Highest to Lowest / Z-A' : 'ASC: Lowest to Highest / A-Z'}).`
        });
      } else {
        traceSteps.push({
          type: 'order',
          title: 'Step 3: ORDER BY (Ignored)',
          html: `Column <code>${orderCol}</code> not found in table schema; sort skipped.`
        });
      }
    } else {
      traceSteps.push({
        type: 'order',
        title: 'Step 3: ORDER BY',
        html: 'No ordering specified; records retained default database storage order.'
      });
    }

    let projectedColumns = [];
    if (selectPart === '*') {
      projectedColumns = [...tableMeta.columns];
      traceSteps.push({
        type: 'select',
        title: 'Step 4: SELECT Projection',
        html: `Wildcard <code>*</code> specified: returned all <strong>${projectedColumns.length}</strong> columns (${projectedColumns.join(', ')}).`
      });
    } else {
      const reqCols = selectPart.split(',').map(s => s.trim());
      for (const rc of reqCols) {
        const found = tableMeta.columns.find(c => c.toLowerCase() === rc.toLowerCase());
        if (found) {
          projectedColumns.push(found);
        } else {
          return {
            success: false,
            error: `Column '${rc}' does not exist on table '${tableKey}'.`
          };
        }
      }
      traceSteps.push({
        type: 'select',
        title: 'Step 4: SELECT Projection',
        html: `Projected <strong>${projectedColumns.length}</strong> columns: <code>${projectedColumns.join(', ')}</code>.`
      });
    }

    return {
      success: true,
      tableKey,
      rows: workingRows,
      columns: projectedColumns,
      traceSteps,
      isWildcard: selectPart === '*'
    };
  }

  function executeSQLQuery(rawQuery) {
    const traceBox = document.getElementById('executionTracerBox');
    const tableHead = document.getElementById('resultsTableHead');
    const tableBody = document.getElementById('resultsTableBody');
    const countBadge = document.getElementById('resultCountBadge');
    const statusText = document.getElementById('queryStatusText');

    if (traceBox) traceBox.innerHTML = '';
    if (tableHead) tableHead.innerHTML = '';
    if (tableBody) tableBody.innerHTML = '';

    const result = parseAndRunSQL(rawQuery);
    if (!result.success) {
      if (statusText) {
        statusText.textContent = result.error;
        statusText.style.color = '#ef4444';
      }
      addTraceStep('error', 'Execution Error', result.error);
      return;
    }

    if (result.traceSteps) {
      result.traceSteps.forEach(step => {
        addTraceStep(step.type, step.title, step.html);
      });
    }

    renderQueryResults(result.rows, result.columns);
    if (statusText) {
      statusText.textContent = `✓ Query executed successfully. ${result.rows.length} rows returned.`;
      statusText.style.color = '#34d399';
    }
    if (countBadge) {
      countBadge.textContent = `${result.rows.length} row${result.rows.length === 1 ? '' : 's'} returned`;
    }
  }

  function addTraceStep(type, title, bodyHTML) {
    const traceBox = document.getElementById('executionTracerBox');
    if (!traceBox) return;
    const item = document.createElement('div');
    item.className = `trace-step-item step-${type}`;
    item.innerHTML = `<strong>${title}:</strong><div style="margin-top: 3px; color: var(--text-secondary);">${bodyHTML}</div>`;
    traceBox.appendChild(item);
  }

  // Evaluates simple and compound WHERE predicates
  function evaluateWhere(row, whereClause) {
    if (/\s+OR\s+/i.test(whereClause)) {
      const parts = whereClause.split(/\s+OR\s+/i);
      return parts.some(p => evaluateSingleCondition(row, p));
    }
    if (/\s+AND\s+/i.test(whereClause)) {
      const parts = whereClause.split(/\s+AND\s+/i);
      return parts.every(p => evaluateSingleCondition(row, p));
    }
    return evaluateSingleCondition(row, whereClause);
  }

  function evaluateSingleCondition(row, conditionStr) {
    const opRegex = /([a-zA-Z0-9_]+)\s*(>=|<=|<>|!=|=|>|<)\s*(.+)/;
    const match = conditionStr.trim().match(opRegex);
    if (!match) {
      throw new Error(`Invalid condition format: "${conditionStr}"`);
    }

    const colName = match[1].trim();
    const op = match[2].trim();
    let rawVal = match[3].trim();

    const actualCol = Object.keys(row).find(k => k.toLowerCase() === colName.toLowerCase());
    if (!actualCol) {
      throw new Error(`Unknown column '${colName}' in WHERE clause.`);
    }

    const cellVal = row[actualCol];

    let targetVal;
    if ((rawVal.startsWith("'") && rawVal.endsWith("'")) || (rawVal.startsWith('"') && rawVal.endsWith('"'))) {
      targetVal = rawVal.slice(1, -1);
    } else if (!isNaN(Number(rawVal))) {
      targetVal = Number(rawVal);
    } else {
      targetVal = rawVal;
    }

    if (typeof cellVal === 'number' && typeof targetVal === 'number') {
      switch (op) {
        case '=':  return cellVal === targetVal;
        case '<>':
        case '!=': return cellVal !== targetVal;
        case '>':  return cellVal > targetVal;
        case '<':  return cellVal < targetVal;
        case '>=': return cellVal >= targetVal;
        case '<=': return cellVal <= targetVal;
      }
    } else {
      const sCell = String(cellVal).toLowerCase();
      const sTarget = String(targetVal).toLowerCase();
      switch (op) {
        case '=':  return sCell === sTarget;
        case '<>':
        case '!=': return sCell !== sTarget;
        case '>':  return sCell > sTarget;
        case '<':  return sCell < sTarget;
        case '>=': return sCell >= sTarget;
        case '<=': return sCell <= sTarget;
      }
    }
    return false;
  }

  function renderQueryResults(rows, columns, headElId = 'resultsTableHead', bodyElId = 'resultsTableBody') {
    const tableHead = document.getElementById(headElId);
    const tableBody = document.getElementById(bodyElId);
    if (!tableHead || !tableBody) return;

    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    const htr = document.createElement('tr');
    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      htr.appendChild(th);
    });
    tableHead.appendChild(htr);

    if (rows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = Math.max(1, columns.length);
      td.style.textAlign = 'center';
      td.style.color = 'var(--text-muted)';
      td.style.padding = '18px';
      td.textContent = 'No records matched the query criteria.';
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }

    rows.forEach(r => {
      const tr = document.createElement('tr');
      columns.forEach(col => {
        const td = document.createElement('td');
        td.textContent = r[col] !== undefined ? r[col] : '';
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }

  function escapeHTML(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function initSQLWorkbench() {
    renderSchemaTables();

    const queryInput = document.getElementById('sqlQueryInput');
    const runBtn = document.getElementById('runQueryBtn');
    const resetBtn = document.getElementById('resetTablesBtn');
    const presets = document.querySelectorAll('.preset-chip');

    presets.forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.getAttribute('data-query');
        if (queryInput && q) {
          queryInput.value = q;
          executeSQLQuery(q);
        }
      });
    });

    if (runBtn && queryInput) {
      runBtn.addEventListener('click', () => {
        executeSQLQuery(queryInput.value);
      });
      queryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          executeSQLQuery(queryInput.value);
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        workingDb = JSON.parse(JSON.stringify(DB_SCHEMA));
        renderSchemaTables();
        if (queryInput) {
          executeSQLQuery(queryInput.value);
        }
      });
    }

    if (queryInput) {
      executeSQLQuery(queryInput.value);
    }
  }

  // =========================================================================
  // 3. TAB 2: EXAM CHALLENGES & VALIDATOR (§3.7)
  // =========================================================================

  const CHALLENGES = [
    {
      id: 1,
      levelBadge: 'WARM-UP [2 MARKS]',
      title: 'Challenge 1: Find All Year 11 Students',
      tableHint: 'Table: Students',
      prompt: 'Write an SQL query to retrieve the <code>FirstName</code> and <code>LastName</code> of all students in <code>YearGroup = 11</code> from the <code>Students</code> table.',
      targetRowsDesc: '4 rows (Alice Smith, Bob Jones, Daisy Evans, Fiona White)',
      starterTemplate: 'SELECT FirstName, LastName\nFROM Students\nWHERE YearGroup = 11',
      expectedTable: 'Students',
      expectedCols: ['FirstName', 'LastName'],
      checkRows: (rows) => rows.length === 4 && rows.every(r => ['Alice', 'Bob', 'Daisy', 'Fiona'].includes(r.FirstName)),
      modelSql: 'SELECT FirstName, LastName FROM Students WHERE YearGroup = 11',
      marksBreakdown: `
        <strong>Exam Mark Scheme (2 Marks):</strong><br>
        • <strong>1 Mark:</strong> Correct columns <code>SELECT FirstName, LastName FROM Students</code><br>
        • <strong>1 Mark:</strong> Correct condition <code>WHERE YearGroup = 11</code>
      `
    },
    {
      id: 2,
      levelBadge: 'COMPOUND LOGIC [3 MARKS]',
      title: 'Challenge 2: Grade 8 or Higher in Computing',
      tableHint: 'Table: ExamResults',
      prompt: 'Write an SQL query to select <code>StudentID</code>, <code>Subject</code>, and <code>Score</code> from the <code>ExamResults</code> table where <code>Subject = \'Computing\'</code> and <code>Score &gt;= 80</code>.',
      targetRowsDesc: '3 rows (Student 101: 94, Student 104: 91, Student 106: 83)',
      starterTemplate: "SELECT StudentID, Subject, Score\nFROM ExamResults\nWHERE Subject = 'Computing' AND Score >= 80",
      expectedTable: 'ExamResults',
      expectedCols: ['StudentID', 'Subject', 'Score'],
      checkRows: (rows) => rows.length === 3 && rows.every(r => r.Score >= 80 && r.Subject === 'Computing'),
      modelSql: "SELECT StudentID, Subject, Score FROM ExamResults WHERE Subject = 'Computing' AND Score >= 80",
      marksBreakdown: `
        <strong>Exam Mark Scheme (3 Marks):</strong><br>
        • <strong>1 Mark:</strong> Correct columns <code>SELECT StudentID, Subject, Score FROM ExamResults</code><br>
        • <strong>1 Mark:</strong> Subject filter <code>WHERE Subject = 'Computing'</code><br>
        • <strong>1 Mark:</strong> Compound operator <code>AND Score >= 80</code> (or <code>Score > 79</code>)
      `
    },
    {
      id: 3,
      levelBadge: 'SORTING & ORDER [3 MARKS]',
      title: 'Challenge 3: Computing Score Leaderboard',
      tableHint: 'Table: ExamResults',
      prompt: 'Write an SQL query to retrieve <code>StudentID</code>, <code>Grade</code>, and <code>Score</code> for all records where <code>Subject = \'Computing\'</code>, sorted by <code>Score</code> in descending order (highest score first).',
      targetRowsDesc: '7 rows sorted descending (94, 91, 83, 74, 72, 62, 58)',
      starterTemplate: "SELECT StudentID, Grade, Score\nFROM ExamResults\nWHERE Subject = 'Computing'\nORDER BY Score DESC",
      expectedTable: 'ExamResults',
      expectedCols: ['StudentID', 'Grade', 'Score'],
      checkRows: (rows) => rows.length === 7 && rows[0]?.Score === 94 && rows[rows.length - 1]?.Score === 58,
      modelSql: "SELECT StudentID, Grade, Score FROM ExamResults WHERE Subject = 'Computing' ORDER BY Score DESC",
      marksBreakdown: `
        <strong>Exam Mark Scheme (3 Marks):</strong><br>
        • <strong>1 Mark:</strong> Correct fields <code>SELECT StudentID, Grade, Score FROM ExamResults</code><br>
        • <strong>1 Mark:</strong> Filtering condition <code>WHERE Subject = 'Computing'</code><br>
        • <strong>1 Mark:</strong> Correct sorting <code>ORDER BY Score DESC</code>
      `
    },
    {
      id: 4,
      levelBadge: 'RELATIONAL QUERY [3 MARKS]',
      title: "Challenge 4: Alice's Exam Transcript",
      tableHint: 'Table: ExamResults (Foreign Key Lookup)',
      prompt: "Alice Smith has <code>StudentID = 101</code>. Write a query on the <code>ExamResults</code> table using the foreign key to retrieve her <code>Subject</code>, <code>Grade</code>, and <code>Score</code>.",
      targetRowsDesc: '2 rows (Computing: Grade 9, Maths: Grade 8)',
      starterTemplate: 'SELECT Subject, Grade, Score\nFROM ExamResults\nWHERE StudentID = 101',
      expectedTable: 'ExamResults',
      expectedCols: ['Subject', 'Grade', 'Score'],
      checkRows: (rows) => rows.length === 2 && rows.some(r => r.Subject === 'Computing') && rows.some(r => r.Subject === 'Maths'),
      modelSql: 'SELECT Subject, Grade, Score FROM ExamResults WHERE StudentID = 101',
      marksBreakdown: `
        <strong>Exam Mark Scheme (3 Marks):</strong><br>
        • <strong>1 Mark:</strong> Selecting fields <code>SELECT Subject, Grade, Score</code><br>
        • <strong>1 Mark:</strong> From child table <code>FROM ExamResults</code><br>
        • <strong>1 Mark:</strong> Foreign key matching <code>WHERE StudentID = 101</code>
      `
    }
  ];

  let currentChallengeIndex = 0;

  function loadChallenge(index) {
    currentChallengeIndex = index;
    const c = CHALLENGES[index];
    if (!c) return;

    // Update buttons
    const btns = document.querySelectorAll('.challenge-tab-btn');
    btns.forEach((b, idx) => {
      b.classList.toggle('active', idx === index);
    });

    // Update UI elements
    const levelBadge = document.getElementById('challengeLevelBadge');
    const titleEl = document.getElementById('challengeTitle');
    const hintEl = document.getElementById('challengeTableHint');
    const promptEl = document.getElementById('challengePrompt');
    const targetRowsEl = document.getElementById('challengeTargetRows');
    const sqlInput = document.getElementById('challengeSqlInput');
    const feedbackBox = document.getElementById('challengeFeedbackBox');
    const resultsWrapper = document.getElementById('challengeResultsWrapper');
    const modelBox = document.getElementById('challengeModelAnswerBox');
    const modelSql = document.getElementById('modelAnswerSql');
    const modelMarks = document.getElementById('modelAnswerMarks');
    const toggleModelBtn = document.getElementById('btnToggleModelAnswer');

    if (levelBadge) levelBadge.textContent = c.levelBadge;
    if (titleEl) titleEl.textContent = c.title;
    if (hintEl) hintEl.textContent = c.tableHint;
    if (promptEl) promptEl.innerHTML = c.prompt;
    if (targetRowsEl) targetRowsEl.textContent = c.targetRowsDesc;
    if (sqlInput) sqlInput.value = '';
    if (feedbackBox) feedbackBox.style.display = 'none';
    if (resultsWrapper) resultsWrapper.style.display = 'none';
    if (modelBox) modelBox.style.display = 'none';
    if (modelSql) modelSql.textContent = c.modelSql;
    if (modelMarks) modelMarks.innerHTML = c.marksBreakdown;
    if (toggleModelBtn) toggleModelBtn.textContent = 'Show Worked Model Answer ▾';
  }

  function checkChallengeAnswer() {
    const c = CHALLENGES[currentChallengeIndex];
    if (!c) return;

    const sqlInput = document.getElementById('challengeSqlInput');
    const feedbackBox = document.getElementById('challengeFeedbackBox');
    const resultsWrapper = document.getElementById('challengeResultsWrapper');

    if (!sqlInput || !feedbackBox || !resultsWrapper) return;

    const rawQuery = sqlInput.value.trim();
    if (!rawQuery) {
      feedbackBox.style.display = 'block';
      feedbackBox.style.background = 'rgba(239, 68, 68, 0.12)';
      feedbackBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      feedbackBox.style.color = '#f87171';
      feedbackBox.innerHTML = '<strong>Empty Query:</strong> Please write an SQL query before clicking check!';
      return;
    }

    const result = parseAndRunSQL(rawQuery);
    if (!result.success) {
      feedbackBox.style.display = 'block';
      feedbackBox.style.background = 'rgba(239, 68, 68, 0.12)';
      feedbackBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      feedbackBox.style.color = '#f87171';
      feedbackBox.innerHTML = `<strong>Syntax / Database Error:</strong> ${escapeHTML(result.error)}`;
      resultsWrapper.style.display = 'none';
      return;
    }

    // Render results
    resultsWrapper.style.display = 'block';
    renderQueryResults(result.rows, result.columns, 'challengeTableHead', 'challengeTableBody');

    // Check table
    if (result.tableKey.toLowerCase() !== c.expectedTable.toLowerCase()) {
      feedbackBox.style.display = 'block';
      feedbackBox.style.background = 'rgba(239, 68, 68, 0.12)';
      feedbackBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      feedbackBox.style.color = '#f87171';
      feedbackBox.innerHTML = `<strong>Wrong Table:</strong> You queried <code>${result.tableKey}</code>, but this question requires <code>${c.expectedTable}</code>.`;
      return;
    }

    // Check wildcard vs requested columns
    if (result.isWildcard) {
      feedbackBox.style.display = 'block';
      feedbackBox.style.background = 'rgba(245, 158, 11, 0.15)';
      feedbackBox.style.border = '1px solid rgba(245, 158, 11, 0.3)';
      feedbackBox.style.color = '#fbbf24';
      feedbackBox.innerHTML = `<strong>Partial Credit (Near Miss):</strong> You used <code>SELECT *</code>. In GCSE exams, you lose a mark for wildcards when the question asks for specific fields (<code>${c.expectedCols.join(', ')}</code>). Replace <code>*</code> with the exact column names!`;
      return;
    }

    // Check columns match
    const returnedLowerCols = result.columns.map(col => col.toLowerCase());
    const expectedLowerCols = c.expectedCols.map(col => col.toLowerCase());
    const colsMatch = expectedLowerCols.every(col => returnedLowerCols.includes(col)) &&
                      returnedLowerCols.length === expectedLowerCols.length;

    if (!colsMatch) {
      feedbackBox.style.display = 'block';
      feedbackBox.style.background = 'rgba(245, 158, 11, 0.15)';
      feedbackBox.style.border = '1px solid rgba(245, 158, 11, 0.3)';
      feedbackBox.style.color = '#fbbf24';
      feedbackBox.innerHTML = `<strong>Column Mismatch:</strong> Expected columns <code>${c.expectedCols.join(', ')}</code>, but your query returned <code>${result.columns.join(', ')}</code>.`;
      return;
    }

    // Check rows filter
    const rowsPass = c.checkRows(result.rows);
    if (!rowsPass) {
      feedbackBox.style.display = 'block';
      feedbackBox.style.background = 'rgba(239, 68, 68, 0.12)';
      feedbackBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      feedbackBox.style.color = '#f87171';
      feedbackBox.innerHTML = `<strong>Incorrect Records Filtered:</strong> Your query returned <strong>${result.rows.length}</strong> rows, but this does not match the target criteria. Re-check your <code>WHERE</code> or <code>ORDER BY</code> clause!`;
      return;
    }

    // Full Success!
    feedbackBox.style.display = 'block';
    feedbackBox.style.background = 'rgba(16, 185, 129, 0.15)';
    feedbackBox.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    feedbackBox.style.color = '#34d399';
    feedbackBox.innerHTML = `
      <div style="font-size: 14px; font-weight: 800; margin-bottom: 4px;">Spot on! Full Marks!</div>
      <div>Your query met every specification criterion and produced the exact required dataset. You earned full marks for this exam problem.</div>
    `;
  }

  function initChallenges() {
    const btns = document.querySelectorAll('.challenge-tab-btn');
    btns.forEach((btn, idx) => {
      btn.addEventListener('click', () => loadChallenge(idx));
    });

    const btnFillTemplate = document.getElementById('btnFillTemplate');
    if (btnFillTemplate) {
      btnFillTemplate.addEventListener('click', () => {
        const c = CHALLENGES[currentChallengeIndex];
        const sqlInput = document.getElementById('challengeSqlInput');
        if (c && sqlInput) {
          sqlInput.value = c.starterTemplate;
        }
      });
    }

    const btnCheck = document.getElementById('btnCheckChallenge');
    if (btnCheck) {
      btnCheck.addEventListener('click', checkChallengeAnswer);
    }

    const btnToggleModel = document.getElementById('btnToggleModelAnswer');
    const modelBox = document.getElementById('challengeModelAnswerBox');
    if (btnToggleModel && modelBox) {
      btnToggleModel.addEventListener('click', () => {
        const isHidden = modelBox.style.display === 'none' || !modelBox.style.display;
        modelBox.style.display = isHidden ? 'block' : 'none';
        btnToggleModel.textContent = isHidden ? 'Hide Model Answer ▴' : 'Show Worked Model Answer ▾';
      });
    }

    const btnLoadStudio = document.getElementById('btnLoadIntoStudio');
    if (btnLoadStudio) {
      btnLoadStudio.addEventListener('click', () => {
        const sqlInput = document.getElementById('challengeSqlInput');
        const studioInput = document.getElementById('sqlQueryInput');
        const workbenchTabBtn = document.querySelector('.view-tab-btn[data-tab="workbench"]');

        if (sqlInput && studioInput) {
          const val = sqlInput.value.trim() || CHALLENGES[currentChallengeIndex].starterTemplate;
          studioInput.value = val;
          if (workbenchTabBtn) workbenchTabBtn.click();
          executeSQLQuery(val);
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }
      });
    }

    loadChallenge(0);
  }

  // =========================================================================
  // 4. INITIALIZATION ENTRYPOINT
  // =========================================================================

  function init() {
    initTheme();
    initTabs();
    initSQLWorkbench();
    initChallenges();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

