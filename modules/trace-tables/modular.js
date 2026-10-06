/**
 * GCSE Computer Science: Structuring Code into Modules
 * Sub-module logic aligned with AQA GCSE (8525 Paper 1 §3.1 & §3.2)
 * Features interactive decomposition, AQA Structure Charts, and Function vs Procedure checks.
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. SCENARIO DEFINITIONS & BENCHMARK EXERCISES
  // =========================================================================

  const SCENARIOS = [
    {
      id: 'cinema',
      name: 'Cinema Booking System',
      description: 'A box office counter application that validates customer ages, calculates concession discounts, and prints receipts. Notice the copy-pasted validation loops!',
      monolithicCode: [
        '# CINEMA TICKET BOOKING SYSTEM (Monolithic Script)',
        'tickets_sold = 0',
        'total_revenue = 0.0',
        'print("=== WELCOME TO THE GCSE ODEON ===")',
        '',
        '# [BLOCK 1: Main Menu & Booking Loop Controller]',
        'while True:',
        '    choice = input("Enter (B)ook tickets or (Q)uit: ").upper()',
        '    if choice == "Q":',
        '        break',
        '',
        '    # [BLOCK 2A: Customer 1 Age Validation Loop]',
        '    valid1 = False',
        '    while not valid1:',
        '        in1 = input("Enter Customer 1 age: ")',
        '        if in1.isdigit() and 0 <= int(in1) <= 120:',
        '            age1 = int(in1)',
        '            valid1 = True',
        '        else:',
        '            print("Invalid age! Must be 0 to 120.")',
        '',
        '    # [BLOCK 2B: Customer 2 Age Validation - EXACT DUPLICATE CODE COPY-PASTED!]',
        '    valid2 = False',
        '    while not valid2:',
        '        in2 = input("Enter Customer 2 age: ")',
        '        if in2.isdigit() and 0 <= int(in2) <= 120:',
        '            age2 = int(in2)',
        '            valid2 = True',
        '        else:',
        '            print("Invalid age! Must be 0 to 120.")',
        '',
        '    # [BLOCK 3: Concession Discount & Price Calculation]',
        '    base_price = 12.50',
        '    rate1 = 0.50 if age1 < 12 else (0.30 if age1 >= 65 else 0.0)',
        '    rate2 = 0.50 if age2 < 12 else (0.30 if age2 >= 65 else 0.0)',
        '    price1 = base_price * (1.0 - rate1)',
        '    price2 = base_price * (1.0 - rate2)',
        '    total_order = price1 + price2',
        '    total_revenue = total_revenue + total_order',
        '    tickets_sold = tickets_sold + 2',
        '',
        '    # [BLOCK 4: Formatted Receipt Printing Output]',
        '    print("--------------------------------")',
        '    print(f"BOOKING CONFIRMED: 2 TICKETS")',
        '    print(f"Customer 1 ({age1} yrs): £{price1:.2f}")',
        '    print(f"Customer 2 ({age2} yrs): £{price2:.2f}")',
        '    print(f"Total Charged: £{total_order:.2f}")',
        '    print("--------------------------------")',
        '',
        '# [BLOCK 5: Terminal Farewell Summary]',
        'print(f"Session closed. Tickets: {tickets_sold}, Revenue: £{total_revenue:.2f}")'
      ].join('\n'),

      blocks: [
        {
          id: 0,
          title: 'Block 1: Menu & Main Loop Controller',
          lines: 'Lines 6–10',
          snippet: 'while True:\n    choice = input("Enter (B)ook tickets or (Q)uit: ").upper()\n    if choice == "Q":\n        break',
          shouldExtract: false,
          subroutineType: null,
          moduleName: 'Main Program Loop',
          params: 'None (Orchestrator)',
          returns: 'None',
          isRepeated: false,
          rationale: '<strong>Keep in Main Module!</strong> This loop is the master coordinator controlling program navigation. Top-level orchestration belongs directly in <code>main()</code> to direct when other subroutines are called.'
        },
        {
          id: 1,
          title: 'Block 2: Age Input Validation (Repeated Twice!)',
          lines: 'Lines 12–30',
          snippet: '# Block 2A & 2B are identical validation loops:\nvalid = False\nwhile not valid:\n    val = input("Enter age: ")\n    if val.isdigit() and 0 <= int(val) <= 120:\n        age = int(val)\n        valid = True',
          shouldExtract: true,
          subroutineType: 'Function',
          moduleName: 'get_valid_age(customer_num)',
          params: 'customer_num (string/int)',
          returns: 'age (valid integer)',
          isRepeated: true,
          repeatedNote: 'Eliminates 16 lines of duplicate validation code copy-pasted for Customer 1 and 2!',
          rationale: '<strong>Extract as Subroutine (FUNCTION)!</strong> Notice that Blocks 2A and 2B are <em>identical copy-pasted code</em>. By defining <code>get_valid_age()</code> once and calling it twice, you follow the <strong>DRY principle</strong> (Don\'t Repeat Yourself). It is a <strong>Function</strong> because it calculates and returns an integer (<code>age</code>) back to the caller!'
        },
        {
          id: 2,
          title: 'Block 3: Ticket Pricing & Concession Calculator',
          lines: 'Lines 32–39',
          snippet: 'base_price = 12.50\nrate1 = 0.50 if age1 < 12 else (0.30 if age1 >= 65 else 0.0)\nprice1 = base_price * (1.0 - rate1)',
          shouldExtract: true,
          subroutineType: 'Function',
          moduleName: 'calculate_ticket_price(age, base_price)',
          params: 'age, base_price=12.50',
          returns: 'price (float)',
          isRepeated: true,
          repeatedNote: 'Reused for every ticket purchased without duplicating math formulas.',
          rationale: '<strong>Extract as Subroutine (FUNCTION)!</strong> Pricing rules are core business logic. Extracting it as a function with parameters (<code>age</code>, <code>base_price</code>) and a return value (<code>price</code>) allows isolated <strong>unit testing</strong> with boundary data (ages 11, 12, 64, 65) without running the interactive terminal prompt.'
        },
        {
          id: 3,
          title: 'Block 4: Formatted Receipt Printing Output',
          lines: 'Lines 41–48',
          snippet: 'print("--------------------------------")\nprint(f"BOOKING CONFIRMED: 2 TICKETS")\nprint(f"Customer 1 ({age1} yrs): £{price1:.2f}")\nprint(f"Customer 2 ({age2} yrs): £{price2:.2f}")\nprint("--------------------------------")',
          shouldExtract: true,
          subroutineType: 'Procedure',
          moduleName: 'print_receipt(age1, p1, age2, p2, total)',
          params: 'age1, p1, age2, p2, total',
          returns: 'None (Procedure)',
          isRepeated: false,
          rationale: '<strong>Extract as Subroutine (PROCEDURE)!</strong> This is a presentation task. It formats and outputs text to the screen, but does not calculate or return any value. Hence, it is an AQA <strong>Procedure</strong>. Separating output logic means you can change receipt branding without risking bugs in ticket calculations.'
        },
        {
          id: 4,
          title: 'Block 5: Session Farewell Summary',
          lines: 'Lines 50–51',
          snippet: 'print(f"Session closed. Tickets: {tickets_sold}, Revenue: £{total_revenue:.2f}")',
          shouldExtract: false,
          subroutineType: null,
          moduleName: 'None (One-line Output)',
          params: 'N/A',
          returns: 'N/A',
          isRepeated: false,
          rationale: '<strong>Keep in Main Module!</strong> A single print statement executed once when the main program shuts down does not justify its own subroutine. Wrapping trivial one-liners adds unnecessary overhead.'
        }
      ],

      structureChart: {
        root: {
          name: 'cinema_booking.py / main()',
          role: 'Main Module (Program Coordinator / Master Loop)'
        },
        subroutines: [
          {
            name: 'get_valid_age()',
            type: 'Function',
            desc: 'Prompts until age between 0–120 is entered',
            params: 'prompt_text',
            returns: 'valid_age (int)',
            repeated: true,
            scope: 'Local: age_input, valid_flag'
          },
          {
            name: 'calculate_ticket_price()',
            type: 'Function',
            desc: 'Computes child (50%), senior (30%), or adult price',
            params: 'age, base_price',
            returns: 'final_price (float)',
            repeated: true,
            scope: 'Local: discount_rate, final_price'
          },
          {
            name: 'print_receipt()',
            type: 'Procedure',
            desc: 'Prints formatted border and itemised costs',
            params: 'age1, p1, age2, p2, total',
            returns: 'None',
            repeated: false,
            scope: 'Local: formatted strings'
          }
        ]
      }
    },

    {
      id: 'rpg',
      name: 'Dungeon Combat Engine',
      description: 'A turn-based battle engine with player dice rolls, dragon AI attacks, and ASCII health bars. Notice the duplicate health bar code!',
      monolithicCode: [
        '# DUNGEON QUEST COMBAT ENGINE (Monolithic Script)',
        'import random',
        'player_hp = 100',
        'monster_hp = 80',
        'turn = 1',
        'print("⚔️ A Wild Dragon Appears! ⚔️")',
        '',
        '# [BLOCK 1: Battle Round Controller Loop]',
        'while player_hp > 0 and monster_hp > 0:',
        '    print(f"\\n--- ROUND {turn} ---")',
        '',
        '    # [BLOCK 2: Player Dice Attack Damage Formula]',
        '    roll1 = random.randint(1, 6) + random.randint(1, 6)',
        '    is_crit = (random.randint(1, 20) == 20)',
        '    p_dmg = roll1 * 2 if is_crit else roll1',
        '    monster_hp = max(0, monster_hp - p_dmg)',
        '',
        '    # [BLOCK 3: Monster AI Tactics Attack]',
        '    if monster_hp < 25:',
        '        m_dmg = random.randint(16, 26)  # Rage flame',
        '    else:',
        '        m_dmg = random.randint(8, 14)   # Claw swipe',
        '    player_hp = max(0, player_hp - m_dmg)',
        '',
        '    # [BLOCK 4: ASCII Health Bar Renderer - DUPLICATED TWICE!]',
        '    bar_len = 10',
        '    p_bars = int((max(0, player_hp) / 100) * bar_len)',
        '    print(f"Player: [{\'█\'*p_bars}{\' \'*(bar_len-p_bars)}] {player_hp}/100 HP")',
        '    m_bars = int((max(0, monster_hp) / 80) * bar_len)',
        '    print(f"Dragon: [{\'█\'*m_bars}{\' \'*(bar_len-m_bars)}] {monster_hp}/80 HP")',
        '    turn = turn + 1',
        '',
        '# [BLOCK 5: Outcome Victory / Defeat Announcement]',
        'if player_hp > 0:',
        '    print("🏆 Victory! The dragon has been vanquished!")',
        'else:',
        '    print("💀 Defeat! You were slain in the dungeon...")'
      ].join('\n'),

      blocks: [
        {
          id: 0,
          title: 'Block 1: Battle Round Controller Loop',
          lines: 'Lines 8–10',
          snippet: 'while player_hp > 0 and monster_hp > 0:\n    print(f"\\n--- ROUND {turn} ---")',
          shouldExtract: false,
          subroutineType: null,
          moduleName: 'Main Combat Loop',
          params: 'None (Orchestrator)',
          returns: 'None',
          isRepeated: false,
          rationale: '<strong>Keep in Main Module!</strong> The central battle loop checks win/lose conditions and drives sequence round-by-round. It coordinates when combatants strike, so it belongs in <code>main()</code>.'
        },
        {
          id: 1,
          title: 'Block 2: Weapon Dice Damage Calculation',
          lines: 'Lines 12–16',
          snippet: 'roll1 = random.randint(1, 6) + random.randint(1, 6)\nis_crit = (random.randint(1, 20) == 20)\np_dmg = roll1 * 2 if is_crit else roll1\nmonster_hp = max(0, monster_hp - p_dmg)',
          shouldExtract: true,
          subroutineType: 'Function',
          moduleName: 'roll_attack_damage(dice_count=2)',
          params: 'dice_count',
          returns: 'damage (int)',
          isRepeated: false,
          rationale: '<strong>Extract as Subroutine (FUNCTION)!</strong> Calculating weapon damage and critical hits is a distinct mathematical algorithm. It is a <strong>Function</strong> because it calculates and returns an integer damage value (<code>p_dmg</code>).'
        },
        {
          id: 2,
          title: 'Block 3: Monster AI Strategy Decision',
          lines: 'Lines 18–23',
          snippet: 'if monster_hp < 25:\n    m_dmg = random.randint(16, 26)  # Rage flame\nelse:\n    m_dmg = random.randint(8, 14)   # Claw swipe',
          shouldExtract: true,
          subroutineType: 'Function',
          moduleName: 'get_monster_attack(current_hp)',
          params: 'current_hp (int)',
          returns: 'damage (int)',
          isRepeated: false,
          rationale: '<strong>Extract as Subroutine (FUNCTION)!</strong> The dragon AI behavior is a self-contained decision module. Given the enemy\'s health, it returns attack damage. Isolating AI makes game balancing simple.'
        },
        {
          id: 3,
          title: 'Block 4: ASCII Health Bar Renderer (Duplicated!)',
          lines: 'Lines 25–30',
          snippet: 'bar_len = 10\np_bars = int((max(0, player_hp) / 100) * bar_len)\nprint(f"Player: [{\'█\'*p_bars}...]")\nm_bars = int((max(0, monster_hp) / 80) * bar_len)\nprint(f"Dragon: [{\'█\'*m_bars}...]")',
          shouldExtract: true,
          subroutineType: 'Procedure',
          moduleName: 'display_health_bar(name, hp, max_hp)',
          params: 'entity_name, current_hp, max_hp',
          returns: 'None (Procedure)',
          isRepeated: true,
          repeatedNote: 'Eliminates duplicated math and print statements for Player and Monster!',
          rationale: '<strong>Extract as Subroutine (PROCEDURE)!</strong> The monolithic code copy-pastes the bar math and string formatting twice! Extracting <code>display_health_bar(name, hp, max_hp)</code> allows calling it for any character. It is a <strong>Procedure</strong> because it prints graphics and returns nothing.'
        },
        {
          id: 4,
          title: 'Block 5: Victory / Defeat Announcement',
          lines: 'Lines 33–37',
          snippet: 'if player_hp > 0:\n    print("🏆 Victory! The dragon has been vanquished!")\nelse:\n    print("💀 Defeat! You were slain in the dungeon...")',
          shouldExtract: true,
          subroutineType: 'Procedure',
          moduleName: 'check_battle_result(player_hp)',
          params: 'player_hp',
          returns: 'None (Procedure)',
          isRepeated: false,
          rationale: '<strong>Extract as Subroutine (PROCEDURE)!</strong> Evaluating final victory/defeat conditions is clean to encapsulate into an outcome procedure, especially if you later add loot tables, high scores, or sound effects.'
        }
      ],

      structureChart: {
        root: {
          name: 'dungeon_quest.py / main()',
          role: 'Main Module (Combat Round Orchestrator)'
        },
        subroutines: [
          {
            name: 'roll_attack_damage()',
            type: 'Function',
            desc: 'Simulates 2d6 dice rolls and critical strikes',
            params: 'dice_count',
            returns: 'damage (int)',
            repeated: false,
            scope: 'Local: raw_roll, is_crit'
          },
          {
            name: 'get_monster_attack()',
            type: 'Function',
            desc: 'AI chooses rage fire or claw swipe based on HP',
            params: 'current_hp',
            returns: 'damage (int)',
            repeated: false,
            scope: 'Local: m_dmg'
          },
          {
            name: 'display_health_bar()',
            type: 'Procedure',
            desc: 'Renders dynamic ASCII health bar to terminal',
            params: 'name, hp, max_hp',
            returns: 'None',
            repeated: true,
            scope: 'Local: filled_bars, bar_string'
          },
          {
            name: 'check_battle_result()',
            type: 'Procedure',
            desc: 'Displays victory trophy or defeat skull',
            params: 'player_hp',
            returns: 'None',
            repeated: false,
            scope: 'Local: terminal prints'
          }
        ]
      }
    },

    {
      id: 'grades',
      name: 'GCSE Grade Analyzer',
      description: 'A teacher assistant utility that inputs test marks, validates ranges (0-100), and assigns GCSE grades. Notice the duplicate validation for Paper 1 and Paper 2!',
      monolithicCode: [
        '# GCSE GRADE ANALYZER (Monolithic Script)',
        'scores = []',
        '',
        '# [BLOCK 1: Main Menu Loop Controller]',
        'while True:',
        '    menu = input("(A)dd Marks, (R)eport, or (Q)uit: ").upper()',
        '    if menu == "Q":',
        '        break',
        '',
        '    # [BLOCK 2A: Paper 1 Mark Validation Loop]',
        '    valid1 = False',
        '    while not valid1:',
        '        p1 = input("Enter Paper 1 mark (0-100): ")',
        '        if p1.isdigit() and 0 <= int(p1) <= 100:',
        '            mark1 = int(p1)',
        '            valid1 = True',
        '        else:',
        '            print("Error! Must be 0 to 100.")',
        '',
        '    # [BLOCK 2B: Paper 2 Mark Validation - IDENTICAL COPY-PASTE!]',
        '    valid2 = False',
        '    while not valid2:',
        '        p2 = input("Enter Paper 2 mark (0-100): ")',
        '        if p2.isdigit() and 0 <= int(p2) <= 100:',
        '            mark2 = int(p2)',
        '            valid2 = True',
        '        else:',
        '            print("Error! Must be 0 to 100.")',
        '',
        '    # [BLOCK 3: Append Marks to Master List]',
        '    scores.append(mark1)',
        '    scores.append(mark2)',
        '',
        '    # [BLOCK 4: GCSE Grade Boundary Mapping]',
        '    tot = (mark1 + mark2) // 2',
        '    if tot >= 80: gr = "Grade 9"',
        '    elif tot >= 65: gr = "Grade 7"',
        '    elif tot >= 50: gr = "Grade 5"',
        '    elif tot >= 40: gr = "Grade 4"',
        '    else: gr = "Grade U"',
        '    print(f"Average: {tot}% -> {gr}")',
        '',
        '    # [BLOCK 5: Class Summary Statistics Output]',
        '    if menu == "R" and len(scores) > 0:',
        '        avg = sum(scores) / len(scores)',
        '        print(f"Summary: High={max(scores)}, Low={min(scores)}, Avg={avg:.1f}")'
      ].join('\n'),

      blocks: [
        {
          id: 0,
          title: 'Block 1: Menu & Main Loop Controller',
          lines: 'Lines 5–9',
          snippet: 'while True:\n    menu = input("(A)dd Marks, (R)eport, or (Q)uit: ").upper()\n    if menu == "Q":\n        break',
          shouldExtract: false,
          subroutineType: null,
          moduleName: 'Main Menu Loop',
          params: 'None (Orchestrator)',
          returns: 'None',
          isRepeated: false,
          rationale: '<strong>Keep in Main Module!</strong> The menu loop handles user navigation. The main coordinator belongs directly in <code>main()</code>.'
        },
        {
          id: 1,
          title: 'Block 2: Score Validation (Copy-Pasted 2×!)',
          lines: 'Lines 11–27',
          snippet: '# Blocks 2A & 2B are identical validation routines:\nvalid = False\nwhile not valid:\n    p = input("Enter mark (0-100): ")\n    if p.isdigit() and 0 <= int(p) <= 100:\n        mark = int(p)\n        valid = True',
          shouldExtract: true,
          subroutineType: 'Function',
          moduleName: 'get_valid_score(paper_name)',
          params: 'paper_name (string)',
          returns: 'score (int)',
          isRepeated: true,
          repeatedNote: 'Eliminates identical copy-pasted validation for Paper 1 and Paper 2!',
          rationale: '<strong>Extract as Subroutine (FUNCTION)!</strong> Paper 1 and Paper 2 validation are <em>exact duplicate code</em>. Creating <code>get_valid_score(paper_name)</code> eliminates duplicate code and allows boundary testing (marks 0, 100, -1, 101). It is a <strong>Function</strong> because it returns an integer score.'
        },
        {
          id: 2,
          title: 'Block 3: Append Marks to Master List',
          lines: 'Lines 29–31',
          snippet: 'scores.append(mark1)\nscores.append(mark2)',
          shouldExtract: false,
          subroutineType: null,
          moduleName: 'None (Built-in list method)',
          params: 'N/A',
          returns: 'N/A',
          isRepeated: false,
          rationale: '<strong>Keep in Main Module!</strong> Wrapping single built-in list operations like <code>scores.append()</code> inside a custom subroutine is unnecessary and creates redundant code.'
        },
        {
          id: 3,
          title: 'Block 4: GCSE Grade Boundary Mapping',
          lines: 'Lines 33–40',
          snippet: 'tot = (mark1 + mark2) // 2\nif tot >= 80: gr = "Grade 9"\nelif tot >= 65: gr = "Grade 7"\nelif tot >= 50: gr = "Grade 5"\nelif tot >= 40: gr = "Grade 4"\nelse: gr = "Grade U"',
          shouldExtract: true,
          subroutineType: 'Function',
          moduleName: 'assign_gcse_grade(score)',
          params: 'score (int)',
          returns: 'grade_string (str)',
          isRepeated: false,
          rationale: '<strong>Extract as Subroutine (FUNCTION)!</strong> Grade boundary calculation is a pure function: given a mark, it returns a grade string. It has zero side-effects and is very easy to unit-test.'
        },
        {
          id: 4,
          title: 'Block 5: Class Summary Statistics Output',
          lines: 'Lines 42–45',
          snippet: 'if len(scores) > 0:\n    avg = sum(scores) / len(scores)\n    print(f"Summary: High={max(scores)}, Low={min(scores)}, Avg={avg:.1f}")',
          shouldExtract: true,
          subroutineType: 'Procedure',
          moduleName: 'display_class_summary(scores_list)',
          params: 'scores_list (list)',
          returns: 'None (Procedure)',
          isRepeated: false,
          rationale: '<strong>Extract as Subroutine (PROCEDURE)!</strong> Calculating and displaying statistical summary metrics is a distinct reporting task. It outputs directly to screen and returns nothing, making it a <strong>Procedure</strong>.'
        }
      ],

      structureChart: {
        root: {
          name: 'grade_analyzer.py / main()',
          role: 'Main Module (Teacher Menu Coordinator)'
        },
        subroutines: [
          {
            name: 'get_valid_score()',
            type: 'Function',
            desc: 'Validates input is an integer between 0 and 100',
            params: 'paper_name',
            returns: 'valid_score (int)',
            repeated: true,
            scope: 'Local: p_input, valid_flag'
          },
          {
            name: 'assign_gcse_grade()',
            type: 'Function',
            desc: 'Maps numeric score to GCSE boundary string',
            params: 'score',
            returns: 'grade_name (str)',
            repeated: false,
            scope: 'Local: grade_string'
          },
          {
            name: 'display_class_summary()',
            type: 'Procedure',
            desc: 'Computes class average, max, and min statistics',
            params: 'scores_list',
            returns: 'None',
            repeated: false,
            scope: 'Local: avg, high, low'
          }
        ]
      }
    }
  ];

  // =========================================================================
  // 2. GCSE EXAM THEORY QUIZ DATA
  // =========================================================================

  const THEORY_QUIZ = [
    {
      q: '1. What is the primary role of the "Main Module" (main program) in modular software?',
      options: [
        'To hold all the detailed validation routines and math calculations in one big script',
        'To act as the master orchestrator, controlling overall program flow and calling subroutines as needed',
        'To compile the source code into assembly language before execution',
        'To replace all local variables with global variables'
      ],
      correct: 1,
      explain: 'The Main Module acts like a project manager or conductor: it coordinates program flow, maintains top-level state, and delegates specific jobs to specialised subroutines.'
    },
    {
      q: '2. Which of the following is the BEST reason to extract a block of code into a subroutine?',
      options: [
        'The code is executed exactly once and only consists of a single assignment statement like x = x + 1',
        'The code performs a distinct, reusable task (e.g. validating input or calculating tax) with a single responsibility',
        'It allows the programmer to eliminate parameter passing by making every variable global',
        'It makes the overall program file size larger to impress the exam marker'
      ],
      correct: 1,
      explain: 'Subroutines should follow the Single Responsibility Principle: each module performs one well-defined task. This promotes reusability, easier maintenance, and independent testing.'
    },
    {
      q: '3. What is the fundamental difference between a Function and a Procedure in GCSE Computer Science?',
      options: [
        'A Function returns a value to the statement that called it; a Procedure does not return a value',
        'A Function can only be written in Python; a Procedure can only be written in pseudo-code',
        'A Procedure can have parameters; a Function is never allowed to have parameters',
        'A Function always runs faster than a Procedure on modern CPUs'
      ],
      correct: 0,
      explain: 'A Function calculates and returns a value using a return statement (look for the return arrow ↑○ on an AQA Structure Chart). A Procedure performs an action (e.g. printing or file saving) without returning a value.'
    },
    {
      q: '4. Why are Local Variables preferred over Global Variables in structured programming?',
      options: [
        'Local variables exist only within their subroutine, preventing accidental changes and bugs in other modules',
        'Local variables use 100× more memory than global variables',
        'Global variables cannot be used in loops or if statements',
        'Local variables are automatically saved to the hard drive when power is cut'
      ],
      correct: 0,
      explain: 'Local variables are encapsulated inside their subroutine and deleted from memory when it terminates. This ensures modules do not interfere with each other or create unintended side-effects.'
    }
  ];

  // =========================================================================
  // 3. APPLICATION STATE
  // =========================================================================

  const state = {
    currentScenarioIndex: 0,
    selectedBlockIndex: 0,
    userAnswers: {}, // key: `${scenarioId}_${blockId}` -> boolean
    chartViewMode: 'aqa' // 'aqa' | 'monolith'
  };

  // =========================================================================
  // 4. UI RENDERERS & EVENT HANDLERS
  // =========================================================================

  function renderScenario() {
    const sc = SCENARIOS[state.currentScenarioIndex];
    if (!sc) return;

    // 1. Update Scenario Pill Buttons
    const pillContainer = document.getElementById('scenarioPillContainer');
    if (pillContainer) {
      pillContainer.innerHTML = '';
      SCENARIOS.forEach((s, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `scenario-btn ${idx === state.currentScenarioIndex ? 'active' : ''}`;
        btn.textContent = s.name;
        btn.addEventListener('click', () => {
          state.currentScenarioIndex = idx;
          state.selectedBlockIndex = 0;
          renderScenario();
        });
        pillContainer.appendChild(btn);
      });
    }

    // 2. Update Scenario Title & Description
    const scTitle = document.getElementById('scenarioTitle');
    const scDesc = document.getElementById('scenarioDesc');
    if (scTitle) scTitle.textContent = sc.name;
    if (scDesc) scDesc.textContent = sc.description;

    // 3. Render Monolithic Code Viewer
    renderCodeViewer(sc);

    // 4. Render Active Block Decision Workbench
    renderDecisionWorkbench(sc);

    // 5. Render AQA Structure Chart & Monolith Comparison
    renderStructureChart(sc);

    // 6. Update Score & Progress
    updateProgressCounter(sc);
  }

  function renderCodeViewer(sc) {
    const viewer = document.getElementById('monolithViewer');
    if (!viewer) return;

    const lines = sc.monolithicCode.split('\n');
    let html = '';

    lines.forEach((lineText, lIdx) => {
      const lineNum = lIdx + 1;
      let matchingBlock = null;

      if (sc.id === 'cinema') {
        if (lineNum >= 6 && lineNum <= 10) matchingBlock = sc.blocks[0];
        else if (lineNum >= 12 && lineNum <= 30) matchingBlock = sc.blocks[1];
        else if (lineNum >= 32 && lineNum <= 39) matchingBlock = sc.blocks[2];
        else if (lineNum >= 41 && lineNum <= 48) matchingBlock = sc.blocks[3];
        else if (lineNum >= 50 && lineNum <= 51) matchingBlock = sc.blocks[4];
      } else if (sc.id === 'rpg') {
        if (lineNum >= 8 && lineNum <= 10) matchingBlock = sc.blocks[0];
        else if (lineNum >= 12 && lineNum <= 16) matchingBlock = sc.blocks[1];
        else if (lineNum >= 18 && lineNum <= 23) matchingBlock = sc.blocks[2];
        else if (lineNum >= 25 && lineNum <= 30) matchingBlock = sc.blocks[3];
        else if (lineNum >= 33 && lineNum <= 37) matchingBlock = sc.blocks[4];
      } else if (sc.id === 'grades') {
        if (lineNum >= 5 && lineNum <= 9) matchingBlock = sc.blocks[0];
        else if (lineNum >= 11 && lineNum <= 27) matchingBlock = sc.blocks[1];
        else if (lineNum >= 29 && lineNum <= 31) matchingBlock = sc.blocks[2];
        else if (lineNum >= 33 && lineNum <= 40) matchingBlock = sc.blocks[3];
        else if (lineNum >= 42 && lineNum <= 45) matchingBlock = sc.blocks[4];
      }

      const isSelected = matchingBlock && matchingBlock.id === state.selectedBlockIndex;
      const answerKey = matchingBlock ? `${sc.id}_${matchingBlock.id}` : null;
      const answered = answerKey && state.userAnswers[answerKey] !== undefined;

      let blockClass = '';
      if (isSelected) blockClass += ' active-block';
      if (answered) {
        blockClass += state.userAnswers[answerKey] ? ' block-extracted' : ' block-main';
      }

      const escapedLine = lineText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      if (matchingBlock) {
        html += `<div class="code-block-span${blockClass}" data-block="${matchingBlock.id}" title="Click to inspect ${matchingBlock.title}">`;
        html += `<span style="color: #64748b; margin-right: 12px; font-size: 10px; user-select: none;">${String(lineNum).padStart(2, '0')}</span>${escapedLine}`;
        html += `</div>`;
      } else {
        html += `<div style="padding: 1px 8px; opacity: 0.75;">`;
        html += `<span style="color: #475569; margin-right: 12px; font-size: 10px; user-select: none;">${String(lineNum).padStart(2, '0')}</span>${escapedLine}`;
        html += `</div>`;
      }
    });

    viewer.innerHTML = html;

    viewer.querySelectorAll('.code-block-span').forEach(el => {
      el.addEventListener('click', () => {
        const bId = parseInt(el.getAttribute('data-block'), 10);
        state.selectedBlockIndex = bId;
        renderScenario();
      });
    });
  }

  function renderDecisionWorkbench(sc) {
    const block = sc.blocks[state.selectedBlockIndex];
    if (!block) return;

    const blockTitle = document.getElementById('activeBlockTitle');
    const blockSnippet = document.getElementById('activeBlockSnippet');
    const feedbackBox = document.getElementById('decisionFeedbackBox');
    const btnExtract = document.getElementById('btnDecisionExtract');
    const btnMain = document.getElementById('btnDecisionMain');

    if (blockTitle) blockTitle.textContent = `${block.title} (${block.lines})`;
    if (blockSnippet) blockSnippet.textContent = block.snippet;

    const answerKey = `${sc.id}_${block.id}`;
    const userChoice = state.userAnswers[answerKey];

    if (btnExtract) {
      btnExtract.className = `btn-decision btn-decision-extract ${userChoice === true ? 'chosen' : ''}`;
    }
    if (btnMain) {
      btnMain.className = `btn-decision btn-decision-main ${userChoice === false ? 'chosen' : ''}`;
    }

    if (userChoice === undefined) {
      if (feedbackBox) feedbackBox.style.display = 'none';
    } else {
      const isCorrect = userChoice === block.shouldExtract;
      if (feedbackBox) {
        feedbackBox.style.display = 'flex';
        feedbackBox.className = `decision-feedback-callout ${isCorrect ? 'callout-success' : 'callout-wrong'}`;
        
        let typeBadgeHtml = '';
        if (block.shouldExtract && block.subroutineType) {
          const isFunc = block.subroutineType === 'Function';
          typeBadgeHtml = `
            <div style="margin-top: 8px; padding: 6px 10px; background: var(--bg-root); border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 11.5px;">
              <span class="badge-mini ${isFunc ? 'badge-func' : 'badge-proc'}">${block.subroutineType}</span>
              ${isFunc ? '<span style="color: var(--forest-green, #1a6b3c); font-weight: 700;">Returns a value (↑○ Return Arrow)</span>' : '<span style="color: var(--oxford-navy, #1e3a5f); font-weight: 700;">Executes actions (No return value)</span>'}
              <div style="margin-top: 4px; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">
                Parameters (Inputs): <code>${block.params}</code> | Return (Output): <code>${block.returns}</code>
              </div>
            </div>
          `;
        }

        let repeatNoteHtml = '';
        if (block.isRepeated && block.repeatedNote) {
          repeatNoteHtml = `
            <div style="margin-top: 6px; font-size: 11.5px; color: var(--amber-mid, #b45309); font-weight: 700;">
              🔁 Reusability Benefit: ${block.repeatedNote}
            </div>
          `;
        }

        feedbackBox.innerHTML = `
          <div style="font-weight: 800; font-size: 13px;">
            ${isCorrect ? '✓ Correct Decision!' : '✗ Incorrect Selection'}
          </div>
          <div>${block.rationale}</div>
          ${repeatNoteHtml}
          ${typeBadgeHtml}
        `;
      }
    }
  }

  function handleDecision(shouldExtract) {
    const sc = SCENARIOS[state.currentScenarioIndex];
    const block = sc.blocks[state.selectedBlockIndex];
    if (!sc || !block) return;

    const answerKey = `${sc.id}_${block.id}`;
    state.userAnswers[answerKey] = shouldExtract;

    renderScenario();
  }

  function renderStructureChart(sc) {
    const displayArea = document.getElementById('chartDisplayArea');
    if (!displayArea) return;

    if (state.chartViewMode === 'monolith') {
      // 1. RENDER MONOLITHIC BEFORE VIEW
      displayArea.innerHTML = `
        <div class="monolith-diagram-card">
          <div class="monolith-big-box">
            <div class="monolith-box-title">Monolithic Script ("God Module")</div>
            <div class="monolith-box-desc">
              All code is crammed inside a single massive file (<code>${sc.id}.py</code>). 
              Every variable is in one global namespace, and there are zero subroutines.
            </div>
          </div>

          <div class="monolith-traps-list">
            <div class="monolith-trap-item">
              <strong>🔁 Code Duplication:</strong> Identical validation loops copy-pasted multiple times. If a bug is fixed, it must be edited everywhere!
            </div>
            <div class="monolith-trap-item">
              <strong>🐛 Hard to Debug:</strong> A bug in line 35 can secretly corrupt variables used in line 80 without clear module boundaries.
            </div>
            <div class="monolith-trap-item">
              <strong>🧪 Impossible to Unit Test:</strong> You cannot test the pricing discount calculation in isolation without running the entire interactive menu!
            </div>
            <div class="monolith-trap-item">
              <strong>👥 Zero Teamwork:</strong> Multiple developers cannot work simultaneously without creating massive code conflicts in the same file.
            </div>
          </div>
        </div>
      `;
    } else {
      // 2. RENDER OFFICIAL AQA STRUCTURE CHART AFTER VIEW
      const chartData = sc.structureChart;
      if (!chartData) return;

      // Check which subroutines have been unlocked by user
      const branchesHtml = chartData.subroutines.map((sub, sIdx) => {
        // Find matching block
        const matchingBlock = sc.blocks.find(b => b.moduleName.startsWith(sub.name.replace('()', '')));
        const isUnlocked = matchingBlock && state.userAnswers[`${sc.id}_${matchingBlock.id}`] === true;

        const isFunc = sub.type === 'Function';

        return `
          <div class="aqa-branch-col">
            <!-- Data Flow Couples along connecting line -->
            <div class="aqa-data-flow-box">
              <div class="data-param-line" title="Input Parameter passed down">
                <span>○ ↓</span>
                <span>(${sub.params})</span>
              </div>
              ${isFunc ? `
                <div class="data-return-line" title="Output Return Value passed up to caller">
                  <span>↑ ○</span>
                  <span>${sub.returns}</span>
                </div>
              ` : `
                <div style="font-size: 9.5px; color: var(--text-muted); font-style: italic;">
                  (No Return)
                </div>
              `}
            </div>

            <!-- Subroutine Box -->
            <div class="aqa-module-box ${isUnlocked ? 'unlocked' : 'locked'}">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="badge-mini ${isFunc ? 'badge-func' : 'badge-proc'}">${sub.type}</span>
                ${sub.repeated ? '<span class="aqa-repeat-badge">🔁 Called 2×</span>' : ''}
              </div>
              <div class="aqa-module-name">${sub.name}</div>
              <div class="aqa-module-desc">${sub.desc}</div>
              <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">
                ${sub.scope}
              </div>
            </div>
          </div>
        `;
      }).join('');

      displayArea.innerHTML = `
        <div class="aqa-chart-wrap">
          <!-- Root Main Module Box -->
          <div class="aqa-root-box">
            <div class="aqa-root-title">👑 ${chartData.root.name}</div>
            <div class="aqa-root-role">${chartData.root.role}</div>
          </div>

          <!-- Main Trunk Line -->
          <div class="aqa-trunk-line"></div>

          <!-- Horizontal Branching Row -->
          <div class="aqa-branches-row">
            ${branchesHtml}
          </div>
        </div>
      `;
    }
  }

  function updateProgressCounter(sc) {
    const badge = document.getElementById('scenarioScoreBadge');
    if (!badge) return;

    let correctCount = 0;
    sc.blocks.forEach(b => {
      const key = `${sc.id}_${b.id}`;
      if (state.userAnswers[key] === b.shouldExtract) {
        correctCount++;
      }
    });

    badge.textContent = `Score: ${correctCount} / ${sc.blocks.length} Correct`;
  }

  // =========================================================================
  // 5. GCSE THEORY QUIZ
  // =========================================================================

  function initTheoryQuiz() {
    const quizContainer = document.getElementById('modularQuizContainer');
    if (!quizContainer) return;

    quizContainer.innerHTML = '';

    THEORY_QUIZ.forEach((item, qIdx) => {
      const card = document.createElement('div');
      card.className = 'quiz-question-box';
      card.innerHTML = `
        <div style="font-weight: 800; font-size: 13.5px; color: var(--text-primary); margin-bottom: 8px;">
          ${item.q}
        </div>
        <div class="quiz-options-list" id="quizOpts_${qIdx}">
          ${item.options.map((opt, optIdx) => `
            <button type="button" class="quiz-option-btn" data-q="${qIdx}" data-opt="${optIdx}">
              <span style="font-weight: 800; font-size: 11px; opacity: 0.7;">${String.fromCharCode(65 + optIdx)}.</span>
              <span>${opt}</span>
            </button>
          `).join('')}
        </div>
        <div id="quizExplain_${qIdx}" style="display: none; margin-top: 10px; font-size: 12px; line-height: 1.5; padding: 8px 12px; border-radius: var(--radius-sm);"></div>
      `;

      quizContainer.appendChild(card);
    });

    quizContainer.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qIdx = parseInt(btn.getAttribute('data-q'), 10);
        const optIdx = parseInt(btn.getAttribute('data-opt'), 10);
        const qData = THEORY_QUIZ[qIdx];
        const explainBox = document.getElementById(`quizExplain_${qIdx}`);
        const optsList = document.getElementById(`quizOpts_${qIdx}`);

        optsList.querySelectorAll('.quiz-option-btn').forEach((b, idx) => {
          b.disabled = true;
          if (idx === qData.correct) {
            b.classList.add('correct');
          } else if (idx === optIdx && optIdx !== qData.correct) {
            b.classList.add('wrong');
          }
        });

        if (explainBox) {
          explainBox.style.display = 'block';
          const isCorrect = (optIdx === qData.correct);
          explainBox.style.background = isCorrect ? 'var(--green-tint, #edf7f0)' : 'var(--red-tint, #fef2f2)';
          explainBox.style.borderLeft = `3.5px solid ${isCorrect ? 'var(--forest-green, #1a6b3c)' : 'var(--cardinal-red, #a82020)'}`;
          explainBox.style.color = isCorrect ? 'var(--forest-green, #1a6b3c)' : 'var(--cardinal-red, #a82020)';
          explainBox.innerHTML = `
            <strong>${isCorrect ? '✓ Correct!' : '✗ Exam Explanation:'}</strong> ${qData.explain}
          `;
        }
      });
    });
  }

  // =========================================================================
  // 6. TOP-LEVEL SUB-MODULE TAB NAVIGATION
  // =========================================================================

  function initSubmoduleNavigation() {
    const tabTrace = document.getElementById('tabBtnTrace');
    const tabModules = document.getElementById('tabBtnModules');
    const viewTrace = document.getElementById('submoduleTrace');
    const viewModular = document.getElementById('submoduleModular');

    function switchView(viewName) {
      if (viewName === 'modules') {
        if (tabTrace) {
          tabTrace.classList.remove('active');
          tabTrace.setAttribute('aria-selected', 'false');
        }
        if (tabModules) {
          tabModules.classList.add('active');
          tabModules.setAttribute('aria-selected', 'true');
        }
        if (viewTrace) viewTrace.style.display = 'none';
        if (viewModular) viewModular.style.display = 'block';
        localStorage.setItem('designTestingActiveTab', 'modules');
        try { window.location.hash = 'modules'; } catch (e) {}
      } else {
        if (tabModules) {
          tabModules.classList.remove('active');
          tabModules.setAttribute('aria-selected', 'false');
        }
        if (tabTrace) {
          tabTrace.classList.add('active');
          tabTrace.setAttribute('aria-selected', 'true');
        }
        if (viewTrace) viewTrace.style.display = 'block';
        if (viewModular) viewModular.style.display = 'none';
        localStorage.setItem('designTestingActiveTab', 'trace');
        try { window.location.hash = 'trace'; } catch (e) {}
      }
    }

    if (tabTrace) tabTrace.addEventListener('click', () => switchView('trace'));
    if (tabModules) tabModules.addEventListener('click', () => switchView('modules'));

    const hash = window.location.hash.replace('#', '');
    const savedTab = localStorage.getItem('designTestingActiveTab');
    if (hash === 'modules' || (!hash && savedTab === 'modules')) {
      switchView('modules');
    } else {
      switchView('trace');
    }
  }

  // =========================================================================
  // 7. INITIALIZATION ENTRYPOINT
  // =========================================================================

  function init() {
    initSubmoduleNavigation();

    // Decision buttons
    const btnExtract = document.getElementById('btnDecisionExtract');
    const btnMain = document.getElementById('btnDecisionMain');
    const btnNextBlock = document.getElementById('btnNextBlock');

    if (btnExtract) btnExtract.addEventListener('click', () => handleDecision(true));
    if (btnMain) btnMain.addEventListener('click', () => handleDecision(false));

    if (btnNextBlock) {
      btnNextBlock.addEventListener('click', () => {
        const sc = SCENARIOS[state.currentScenarioIndex];
        if (sc) {
          state.selectedBlockIndex = (state.selectedBlockIndex + 1) % sc.blocks.length;
          renderScenario();
        }
      });
    }

    const btnResetChoices = document.getElementById('btnResetModularChoices');
    if (btnResetChoices) {
      btnResetChoices.addEventListener('click', () => {
        const sc = SCENARIOS[state.currentScenarioIndex];
        if (sc) {
          sc.blocks.forEach(b => {
            delete state.userAnswers[`${sc.id}_${b.id}`];
          });
          state.selectedBlockIndex = 0;
          renderScenario();
        }
      });
    }

    // Chart View Toggle (Monolithic vs AQA Structure Chart)
    const tabChartMonolith = document.getElementById('tabChartMonolith');
    const tabChartAqa = document.getElementById('tabChartAqa');
    if (tabChartMonolith && tabChartAqa) {
      tabChartMonolith.addEventListener('click', () => {
        tabChartMonolith.classList.add('active');
        tabChartAqa.classList.remove('active');
        state.chartViewMode = 'monolith';
        renderStructureChart(SCENARIOS[state.currentScenarioIndex]);
      });
      tabChartAqa.addEventListener('click', () => {
        tabChartAqa.classList.add('active');
        tabChartMonolith.classList.remove('active');
        state.chartViewMode = 'aqa';
        renderStructureChart(SCENARIOS[state.currentScenarioIndex]);
      });
    }

    // Initial render
    renderScenario();
    initTheoryQuiz();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
