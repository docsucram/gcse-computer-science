/**
 * GCSE Computer Science: Program Debugger & In-Place Code Scratchpad Workbench
 * Aligned with AQA 8525 Paper 1 §3.2.3 (Program Errors) & Python 3 Programming Standard
 * Features:
 *   - In-place editable code scratchpad matching user mockup
 *   - Embedded terminal action bar with [▶ Run Python Script] and [↺ Reset]
 *   - Comprehensive Python syntax, name, and indentation guardrails for user breakage
 *   - Clear bottom prompt: "The above code contains two errors, correct them..."
 *   - Rich explanation box on completion with GCSE exam takeaways
 */

(function () {
  'use strict';

  const DEBUG_SCENARIOS = [
    {
      id: 'discount_loop',
      title: 'Test 1: Loyalty Discount Counter',
      filename: 'loyalty_discount.py',
      spec: 'Accumulate £2 discount for each 5 loyalty points. Points should decrement to 0. Expected output: "Final Discount: £10".',
      directive: 'The above code contains two errors, correct them in the code above until it can run without errors.',
      targetOutput: 'Final Discount: £10',
      hint: 'Look closely at line 4: does the while statement terminate with a colon (:)? Then inspect line 6: why does points never decrement, causing an infinite loop?',
      starterCode: `# Loyalty Discount Counter (Python 3)
points = 5
discount = 0
while points > 0
    discount = discount + 2
    points = points
print("Final Discount: £" + str(discount))`,
      validate: function (code) {
        // 1. General syntax and structure guardrail
        const generalErr = checkGeneralIntegrity(code, 'loyalty_discount.py');
        if (generalErr) return generalErr;

        const lines = code.split('\n');

        // Check if baseline variables were deleted/broken
        if (!/points\s*=\s*\d+/.test(code)) {
          return {
            errorMsg: `Error running "loyalty_discount.py", line 2:\nNameError: variable 'points' is missing or unassigned.\n💡 Tip: Line 2 should remain 'points = 5'. Click "↺ Reset" anytime to restore the starter code.`
          };
        }

        if (!/discount\s*=\s*\d+/.test(code)) {
          return {
            errorMsg: `Error running "loyalty_discount.py", line 3:\nNameError: variable 'discount' is missing or unassigned.\n💡 Tip: Line 3 should remain 'discount = 0'. Click "↺ Reset" anytime to restore the starter code.`
          };
        }

        if (!code.includes('print') || !code.includes('discount')) {
          return {
            errorMsg: `Error running "loyalty_discount.py", line 7:\nOutput Missing: The print statement was removed or modified.\nExpected: print("Final Discount: £" + str(discount))\n💡 Tip: Click "↺ Reset" to restore the starter code.`
          };
        }

        // 2. Target Error 1: While loop syntax
        const whileLineIdx = lines.findIndex(l => l.trim().startsWith('while') || l.trim().startsWith('whlie'));
        if (whileLineIdx === -1) {
          return {
            errorMsg: `Error running "loyalty_discount.py": missing while loop statement.\n💡 Click "↺ Reset" to restore the loop.`
          };
        }

        const whileLine = lines[whileLineIdx].trim();
        if (whileLine.startsWith('whlie')) {
          return {
            errorMsg: `Error running "loyalty_discount.py", line ${whileLineIdx + 1}:\n    ${lines[whileLineIdx]}\n    ^\nSyntaxError: invalid syntax (misspelled keyword 'whlie')`
          };
        }

        if (!whileLine.endsWith(':')) {
          return {
            errorMsg: `Error running "loyalty_discount.py", line ${whileLineIdx + 1}, missing expected ':'\n    ${lines[whileLineIdx]}\n              ^`
          };
        }

        // Check indentation under while loop
        if (whileLineIdx + 1 < lines.length) {
          const nextLine = lines[whileLineIdx + 1];
          if (nextLine.trim() && !nextLine.startsWith(' ') && !nextLine.startsWith('\t')) {
            return {
              errorMsg: `  File "loyalty_discount.py", line ${whileLineIdx + 2}\n    ${nextLine}\n    ^\nIndentationError: expected an indented block after 'while' statement on line ${whileLineIdx + 1}`
            };
          }
        }

        // 3. Target Error 2: Points decrement (Infinite loop)
        const pointsInfiniteLineIdx = lines.findIndex(l => {
          const stripped = l.trim().split('#')[0].trim();
          return stripped === 'points = points';
        });

        if (pointsInfiniteLineIdx !== -1) {
          return {
            errorMsg: `Error running "loyalty_discount.py", line ${pointsInfiniteLineIdx + 1}:\n[TIMEOUT] Loop condition 'points > 0' (5 > 0) never changes.\nLogic Error: 'points = points' does not decrement the loop variable (Infinite Loop)!`
          };
        }

        const hasDecrement = lines.some(l => {
          const stripped = l.trim().split('#')[0].replace(/\s+/g, '');
          return stripped === 'points=points-1' || stripped === 'points-=1';
        });

        if (!hasDecrement) {
          return {
            errorMsg: `Error running "loyalty_discount.py":\nLogic Error: The points variable must decrement by 1 each iteration (e.g. points = points - 1).`
          };
        }

        // All passed!
        return {
          successOutput: 'Final Discount: £10'
        };
      },
      explanation: {
        syntaxTitle: 'Syntax Error (Line 4): Missing Colon',
        syntaxDesc: 'In Python, all compound statement headers (while, if, for, def) MUST terminate with a colon (:). Forgetting the colon halts the Python compiler immediately with a SyntaxError before any code executes.',
        logicTitle: 'Logic Error (Line 6): Missing Loop Iteration (Infinite Loop)',
        logicDesc: 'In a while loop, the condition variable must update inside the loop body. Writing points = points kept points at 5 perpetually, meaning points > 0 remained True forever. Correcting to points = points - 1 allows the loop to iterate 5 times and cleanly terminate with £10 discount.',
        examTakeaway: 'GCSE Paper 1 frequently tests infinite loops. Remember: every while loop needs an initial value, a test condition, and an update statement inside the loop body.'
      }
    },
    {
      id: 'cinema',
      title: 'Test 2: Cinema Ticket Surcharger',
      filename: 'cinema_ticket.py',
      spec: 'Calculate ticket total with a 3D glasses surcharge. Adult tickets are £12.50 + £5.00 for 3D glasses. Expected output: "Total: £17.50".',
      directive: 'The above code contains a syntax error and a data type error, correct them in the code above until it runs without errors.',
      targetOutput: 'Total: £17.50',
      hint: 'Line 4 needs a colon (:) after the if condition. On line 6, look at the data type of surcharge: adding a float (12.50) to a string ("5.00") crashes with a TypeError.',
      starterCode: `# Cinema Ticket Surcharger (Python 3)
price = 12.50
age = 19
if age >= 18
    surcharge = "5.00"
    total = price + surcharge
print("Total: £" + str(total))`,
      validate: function (code) {
        const generalErr = checkGeneralIntegrity(code, 'cinema_ticket.py');
        if (generalErr) return generalErr;

        const lines = code.split('\n');

        if (!/price\s*=\s*12\.5/.test(code)) {
          return {
            errorMsg: `Error running "cinema_ticket.py": initial price variable 'price = 12.50' is missing or modified.\n💡 Click "↺ Reset" anytime to restore starter code.`
          };
        }

        const ifLineIdx = lines.findIndex(l => l.trim().startsWith('if'));
        if (ifLineIdx !== -1) {
          const ifLine = lines[ifLineIdx].trim();
          if (!ifLine.endsWith(':')) {
            return {
              errorMsg: `Error running "cinema_ticket.py", line ${ifLineIdx + 1}, missing expected ':'\n    ${lines[ifLineIdx]}\n               ^`
            };
          }
        }

        // Check Type error
        const hasStringSurcharge = code.includes('surcharge = "5.00"') || code.includes("surcharge = '5.00'");
        const hasCasting = code.includes('float(surcharge)');
        const hasNumericSurcharge = code.includes('surcharge = 5.0') || code.includes('surcharge = 5.00') || code.includes('surcharge = 5');

        if (hasStringSurcharge && !hasCasting && !hasNumericSurcharge) {
          const totalLineIdx = lines.findIndex(l => l.includes('total = price + surcharge'));
          const errLine = totalLineIdx !== -1 ? totalLineIdx + 1 : 6;
          return {
            errorMsg: `Traceback (most recent call last):\n  File "cinema_ticket.py", line ${errLine}, in <module>\n    total = price + surcharge\nTypeError: unsupported operand type(s) for +: 'float' and 'str'`
          };
        }

        return {
          successOutput: 'Total: £17.50'
        };
      },
      explanation: {
        syntaxTitle: 'Syntax Error (Line 4): Missing Colon',
        syntaxDesc: 'The if statement header requires a colon (:). Without it, Python halts before execution.',
        logicTitle: 'Data Type Error (Line 6): Incompatible Operand Types',
        logicDesc: 'price is a Float (12.50) while surcharge was initialized as a String ("5.00"). Python is strongly typed and refuses to add numbers to strings during arithmetic. Casting with float(surcharge) or setting surcharge = 5.00 resolves the error.',
        examTakeaway: 'Always check data types in arithmetic. Raw user inputs or quoted values are Strings and must be cast using int() or float() before mathematical operations.'
      }
    },
    {
      id: 'averager',
      title: 'Test 3: Score Averager & Bonus',
      filename: 'score_averager.py',
      spec: 'Calculate average pupil score and compute a weighted bonus using formula: bonus = (average + 5) * 2. Initial dataset has 0 scores.',
      directive: 'The above code contains a runtime division defect and a BIDMAS operator precedence error, correct them in the code above until it runs without errors.',
      targetOutput: 'Bonus Score: 10.0',
      hint: 'Line 4 crashes because scores_count is 0 (ZeroDivisionError). On line 6, multiplication executes before addition (BIDMAS), calculating average + 10 instead of (average + 5) * 2.',
      starterCode: `# Score Averager & Bonus (Python 3)
scores_total = 0
scores_count = 0
average = scores_total / scores_count
bonus = average + 5 * 2
print("Bonus Score:", bonus)`,
      validate: function (code) {
        const generalErr = checkGeneralIntegrity(code, 'score_averager.py');
        if (generalErr) return generalErr;

        const lines = code.split('\n');

        const hasUnguardedDiv = code.includes('scores_total / scores_count') && !code.includes('if scores_count > 0') && !code.includes('scores_count = 1') && !code.includes('if scores_count != 0');
        if (hasUnguardedDiv) {
          const divLineIdx = lines.findIndex(l => l.includes('average = scores_total / scores_count'));
          const lineNum = divLineIdx !== -1 ? divLineIdx + 1 : 4;
          return {
            errorMsg: `Traceback (most recent call last):\n  File "score_averager.py", line ${lineNum}, in <module>\n    average = scores_total / scores_count\nZeroDivisionError: division by zero`
          };
        }

        const hasParentheses = code.includes('(average + 5) * 2') || code.includes('(5 + average) * 2');
        if (!hasParentheses) {
          const bonusLineIdx = lines.findIndex(l => l.includes('bonus ='));
          const lineNum = bonusLineIdx !== -1 ? bonusLineIdx + 1 : 6;
          return {
            errorMsg: `Error running "score_averager.py", line ${lineNum}:\nLogic Error: Operator precedence evaluated average + (5 * 2) = average + 10.\nSpecification requires adding 5 BEFORE doubling with 2: (average + 5) * 2`
          };
        }

        return {
          successOutput: 'Bonus Score: 10.0'
        };
      },
      explanation: {
        syntaxTitle: 'Runtime Error (Line 4): ZeroDivisionError',
        syntaxDesc: 'Dividing any number by 0 is mathematically undefined. Evaluating scores_total / scores_count when scores_count is 0 crashes Python immediately.',
        logicTitle: 'Logic Error (Line 6): BIDMAS / Operator Precedence',
        logicDesc: 'In Python, multiplication (*) executes before addition (+). average + 5 * 2 calculated average + 10. Adding explicit parentheses (average + 5) * 2 forces addition to execute first.',
        examTakeaway: 'Always use parentheses to enforce intended calculation order in computer algorithms.'
      }
    },
    {
      id: 'pincheck',
      title: 'Test 4: Security PIN Validator',
      filename: 'security_pin.py',
      spec: 'Take a user input security PIN and compare it against stored account PIN 4821. Print "Access Granted" if they match.',
      directive: 'The above code contains an unclosed parenthesis syntax error and a data type comparison error, correct them in the code above until it runs without errors.',
      targetOutput: 'Access Granted',
      hint: 'Line 3 is missing a closing parenthesis ). On line 4, input() returns a string ("4821"), while account_pin is an integer (4821). In Python, "4821" == 4821 is ALWAYS False! Cast user_pin with int().',
      starterCode: `# Security PIN Validator (Python 3)
account_pin = 4821
user_pin = input("Enter 4-digit PIN: "
if user_pin == account_pin:
    print("Access Granted")`,
      validate: function (code) {
        const lines = code.split('\n');

        const inputLineIdx = lines.findIndex(l => l.includes('input('));
        if (inputLineIdx !== -1) {
          const l = lines[inputLineIdx];
          const opens = (l.match(/\(/g) || []).length;
          const closes = (l.match(/\)/g) || []).length;
          if (opens > closes) {
            return {
              errorMsg: `  File "security_pin.py", line ${inputLineIdx + 1}\n    ${l}\n                                         ^\nSyntaxError: '(' was never closed`
            };
          }
        }

        const hasUncastComparison = code.includes('user_pin == account_pin') && !code.includes('int(user_pin)');
        if (hasUncastComparison) {
          const ifLineIdx = lines.findIndex(l => l.includes('if user_pin == account_pin:'));
          const lineNum = ifLineIdx !== -1 ? ifLineIdx + 1 : 4;
          return {
            errorMsg: `Error running "security_pin.py", line ${lineNum}:\nType Logic Error: user_pin is str ("4821") while account_pin is int (4821).\nPython evaluates str == int as False. Cast user_pin with int(user_pin).`
          };
        }

        return {
          successOutput: 'Access Granted'
        };
      },
      explanation: {
        syntaxTitle: 'Syntax Error (Line 3): Unclosed Parenthesis',
        syntaxDesc: 'Every opening parenthesis ( must have a matching closing parenthesis ). Omitting ) prevents Python from parsing the function call.',
        logicTitle: 'Data Type Logic Error (Line 4): Incompatible Type Comparison',
        logicDesc: 'The input() function always returns text data of type String. Comparing "4821" (str) to 4821 (int) evaluates to False in Python. Explicitly casting with int(user_pin) ensures equal numerical types.',
        examTakeaway: 'Exam questions frequently expect you to cast input strings: age = int(input()) or score = float(input()).'
      }
    },
    {
      id: 'leaderboard',
      title: 'Test 5: Leaderboard High Scores',
      filename: 'leaderboard.py',
      spec: 'Inspect top 5 leaderboard list and award the "Master Badge" if a player achieves qualifying threshold of 100 points or more.',
      directive: 'The above code contains a list index out of range runtime error and a boundary inequality logic error, correct them in the code above until it runs without errors.',
      targetOutput: 'Master Badge Awarded!',
      hint: 'A list with 5 items has indices 0, 1, 2, 3, 4. Accessing scores[5] causes an IndexError! Then look at the if condition: strict > 100 excludes the qualifying score of 100.',
      starterCode: `# Top 5 Leaderboard (Python 3)
scores = [95, 88, 72, 60, 45]
player_score = 100
lowest_score = scores[5]
if player_score > 100:
    print("Master Badge Awarded!")`,
      validate: function (code) {
        const generalErr = checkGeneralIntegrity(code, 'leaderboard.py');
        if (generalErr) return generalErr;

        const lines = code.split('\n');

        if (code.includes('scores[5]')) {
          const idxLine = lines.findIndex(l => l.includes('scores[5]'));
          const lineNum = idxLine !== -1 ? idxLine + 1 : 4;
          return {
            errorMsg: `Traceback (most recent call last):\n  File "leaderboard.py", line ${lineNum}, in <module>\n    lowest_score = scores[5]\nIndexError: list index out of range (legal indices are 0 to 4)`
          };
        }

        if (code.includes('player_score > 100:') || code.includes('player_score > 100 :')) {
          const ifLineIdx = lines.findIndex(l => l.includes('player_score > 100'));
          const lineNum = ifLineIdx !== -1 ? ifLineIdx + 1 : 5;
          return {
            errorMsg: `Error running "leaderboard.py", line ${lineNum}:\nLogic Error: Specification states 100 points qualifies for Master Badge.\nStrict operator '>' evaluated (100 > 100) as False. Use inclusive '>=' operator!`
          };
        }

        return {
          successOutput: 'Master Badge Awarded!'
        };
      },
      explanation: {
        syntaxTitle: 'Runtime Error (Line 4): IndexError: list index out of range',
        syntaxDesc: 'Python uses zero-based indexing. A list with 5 elements contains indices 0, 1, 2, 3, 4. Requesting index 5 queries a non-existent 6th element, throwing an IndexError. The last element is scores[4].',
        logicTitle: 'Logic Error (Line 5): Wrong Boolean Comparison Operator',
        logicDesc: 'Using > 100 excludes the qualifying boundary score of 100. To include 100 as per specification, the comparison must be greater-than-or-equal-to (>= 100).',
        examTakeaway: 'Off-by-one errors in list indexing and inequality operators (> vs >=) are the most common source of boundary defects in GCSE programming.'
      }
    }
  ];

  let currentScenarioIdx = 0;
  let scenarioUserCode = {};
  let scenarioSolved = {};

  // General integrity & basic Python syntax checker (handles user breaking code elsewhere)
  function checkGeneralIntegrity(code, filename) {
    if (!code || !code.trim()) {
      return {
        errorMsg: `Error running "${filename}":\nIndentationError: unexpected EOF while parsing\nThe script is empty! Click "↺ Reset" to restore the starter code.`
      };
    }

    const lines = code.split('\n');

    // Check unclosed quotes
    for (let i = 0; i < lines.length; i++) {
      const lineWithoutComments = lines[i].split('#')[0];
      const dQuotes = (lineWithoutComments.match(/"/g) || []).length;
      const sQuotes = (lineWithoutComments.match(/'/g) || []).length;
      if (dQuotes % 2 !== 0 || sQuotes % 2 !== 0) {
        return {
          errorMsg: `  File "${filename}", line ${i + 1}\n    ${lines[i]}\n    ^\nSyntaxError: unterminated string literal (unclosed quotation mark)\n💡 Tip: Check quotation marks on line ${i + 1}. Click "↺ Reset" anytime to restore starter code.`
        };
      }
    }

    return null;
  }

  function initDebugger() {
    renderScenarioPills();
    loadScenario(0);

    const btnRun = document.getElementById('btnRunDebugger');
    const btnReset = document.getElementById('btnResetDebugger');
    const btnHint = document.getElementById('btnHintDebugger');
    const editor = document.getElementById('debugCodeEditor');

    if (btnRun) btnRun.addEventListener('click', runDiagnostics);
    if (btnReset) btnReset.addEventListener('click', resetCurrentScenario);
    if (btnHint) btnHint.addEventListener('click', toggleHint);

    if (editor) {
      editor.addEventListener('input', () => {
        scenarioUserCode[currentScenarioIdx] = editor.value;
        updateLineNumbers();
      });

      editor.addEventListener('scroll', () => {
        const gutter = document.getElementById('scratchpadGutter');
        if (gutter) gutter.scrollTop = editor.scrollTop;
      });

      editor.addEventListener('keydown', handleEditorKeydown);
    }
  }

  function handleEditorKeydown(e) {
    const editor = e.target;

    // Ctrl+Enter or Cmd+Enter to Run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runDiagnostics();
      return;
    }

    // Tab key handling (insert 4 spaces)
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 4;
      scenarioUserCode[currentScenarioIdx] = editor.value;
      updateLineNumbers();
      return;
    }

    // Enter key auto-indent
    if (e.key === 'Enter') {
      const cursor = editor.selectionStart;
      const textBefore = editor.value.substring(0, cursor);
      const curLine = textBefore.split('\n').pop();
      const match = curLine.match(/^(\s+)/);
      if (match) {
        e.preventDefault();
        const indent = match[1];
        const extraIndent = curLine.trim().endsWith(':') ? '    ' : '';
        const insertion = '\n' + indent + extraIndent;
        editor.value = editor.value.substring(0, cursor) + insertion + editor.value.substring(editor.selectionEnd);
        editor.selectionStart = editor.selectionEnd = cursor + insertion.length;
        scenarioUserCode[currentScenarioIdx] = editor.value;
        updateLineNumbers();
      }
    }
  }

  function updateLineNumbers() {
    const editor = document.getElementById('debugCodeEditor');
    const gutter = document.getElementById('scratchpadGutter');
    if (!editor || !gutter) return;

    const lineCount = editor.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= Math.max(lineCount, 7); i++) {
      html += `<div>${i}</div>`;
    }
    gutter.innerHTML = html;
  }

  function renderScenarioPills() {
    const container = document.getElementById('debugScenarioPills');
    if (!container) return;

    container.innerHTML = DEBUG_SCENARIOS.map((sc, idx) => `
      <button type="button" class="challenge-pill-btn ${idx === currentScenarioIdx ? 'active' : ''}" data-idx="${idx}">
        ${sc.title} ${scenarioSolved[idx] ? '✓' : ''}
      </button>
    `).join('');

    container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        loadScenario(idx);
      });
    });
  }

  function loadScenario(idx) {
    currentScenarioIdx = idx;
    const sc = DEBUG_SCENARIOS[idx];

    // Update Pills
    const pills = document.querySelectorAll('#debugScenarioPills button');
    pills.forEach((p, i) => {
      p.classList.toggle('active', i === idx);
      p.innerHTML = `${DEBUG_SCENARIOS[i].title} ${scenarioSolved[i] ? '✓' : ''}`;
    });

    // Update Headers & Directive Text
    const titleEl = document.getElementById('debugScenarioTitle');
    const specEl = document.getElementById('debugScenarioSpec');
    const directiveEl = document.getElementById('debugScenarioDirective');
    const tabEl = document.getElementById('ideActiveTabName');
    const hintBox = document.getElementById('debugHintBox');
    const explBox = document.getElementById('debugExplanationBox');

    if (titleEl) titleEl.innerText = sc.title;
    if (specEl) specEl.innerText = sc.spec;
    if (directiveEl) directiveEl.innerText = sc.directive || 'The above code contains two errors, correct them in the code above until it can run without errors.';
    if (tabEl) tabEl.innerText = sc.filename;

    if (hintBox) {
      hintBox.style.display = 'none';
      hintBox.innerHTML = `<strong>💡 Hint:</strong> ${sc.hint}`;
    }
    if (explBox) {
      explBox.style.display = scenarioSolved[idx] ? 'flex' : 'none';
      if (scenarioSolved[idx]) renderExplanation(sc);
    }

    // Set Editor Content
    const editor = document.getElementById('debugCodeEditor');
    if (editor) {
      editor.value = scenarioUserCode[idx] !== undefined ? scenarioUserCode[idx] : sc.starterCode;
      updateLineNumbers();
    }

    // Reset Console
    clearConsole();
  }

  function resetCurrentScenario() {
    const sc = DEBUG_SCENARIOS[currentScenarioIdx];
    delete scenarioUserCode[currentScenarioIdx];
    delete scenarioSolved[currentScenarioIdx];

    const editor = document.getElementById('debugCodeEditor');
    if (editor) {
      editor.value = sc.starterCode;
      updateLineNumbers();
    }

    const explBox = document.getElementById('debugExplanationBox');
    if (explBox) explBox.style.display = 'none';

    renderScenarioPills();
    clearConsole();
  }

  function toggleHint() {
    const hintBox = document.getElementById('debugHintBox');
    if (hintBox) {
      hintBox.style.display = hintBox.style.display === 'none' ? 'block' : 'none';
    }
  }

  function clearConsole() {
    const consoleBox = document.getElementById('debuggerConsole');
    if (consoleBox) {
      consoleBox.innerHTML = `<span class="console-msg-dim">Click "▶ Run Python Script" or press Ctrl+Enter to test execution.</span>`;
    }
  }

  function runDiagnostics() {
    const sc = DEBUG_SCENARIOS[currentScenarioIdx];
    const editor = document.getElementById('debugCodeEditor');
    const consoleBox = document.getElementById('debuggerConsole');
    if (!editor || !consoleBox) return;

    const code = editor.value;
    const res = sc.validate(code);

    if (res.errorMsg) {
      // Defect caught!
      consoleBox.innerHTML = `
        <div class="console-msg-warn">================ RUN: ${sc.filename} ================</div>
        <div class="console-msg-error" style="white-space: pre-wrap; margin-top: 4px;">${escapeHtml(res.errorMsg)}</div>
      `;
    } else {
      // Success! All errors repaired
      scenarioSolved[currentScenarioIdx] = true;

      consoleBox.innerHTML = `
        <div class="console-msg-success">================ RUN: ${sc.filename} ================</div>
        <div class="console-msg-success" style="font-size: 13.5px; margin: 4px 0;">${escapeHtml(res.successOutput)}</div>
        <div class="console-msg-dim">&gt;&gt;&gt; Process finished with exit code 0 (All syntax &amp; logic checks passed!)</div>
      `;

      renderExplanation(sc);
      triggerVictoryCelebration();
      renderScenarioPills();
    }
  }

  function renderExplanation(sc) {
    const explBox = document.getElementById('debugExplanationBox');
    if (!explBox) return;

    explBox.style.display = 'flex';
    explBox.innerHTML = `
      <div class="explanation-header">
        <h4>🎉 Program Repaired &amp; Validated!</h4>
        <span class="explanation-pill">ALL DEFECTS RESOLVED</span>
      </div>

      <div class="explanation-section sec-syntax">
        <strong>${sc.explanation.syntaxTitle}</strong>
        ${sc.explanation.syntaxDesc}
      </div>

      <div class="explanation-section sec-logic">
        <strong>${sc.explanation.logicTitle}</strong>
        ${sc.explanation.logicDesc}
      </div>

      <div class="explanation-section sec-takeaway">
        <strong>💡 GCSE Exam Takeaway:</strong>
        ${sc.explanation.examTakeaway}
      </div>

      <button type="button" id="btnNextScenario" class="btn-step-primary" style="margin-top: 6px; width: 100%; justify-content: center; font-size: 13px; padding: 8px 16px;">
        Next Program Target &rarr;
      </button>
    `;

    const btnNext = document.getElementById('btnNextScenario');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        loadScenario((currentScenarioIdx + 1) % DEBUG_SCENARIOS.length);
      });
    }
  }

  let lastCelebrationTime = 0;
  function triggerVictoryCelebration() {
    const now = Date.now();
    if (now - lastCelebrationTime < 2500) return;
    lastCelebrationTime = now;

    try {
      if (typeof confetti === 'function') {
        if (typeof confetti.reset === 'function') confetti.reset();
        confetti({ particleCount: 65, spread: 80, origin: { y: 0.6 } });
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
    document.addEventListener('DOMContentLoaded', initDebugger);
  } else {
    initDebugger();
  }

})();
