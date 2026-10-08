/**
 * GCSE Computer Science: Decomposition & Structure Charts
 * Aligned with AQA GCSE (8525 Paper 1 §3.1 & §3.2)
 * Features 4 genuinely distinct real-world domains:
 *   1. Connected Car Controller (Automotive ECU, engine throttle & ABS braking)
 *   2. Cash Machine (ATM) Controller (Banking, security & hardware dispensing)
 *   3. Space Arcade Game Loop (Video game 60 FPS real-time combat loop)
 *   4. Smart Greenhouse Controller (IoT environmental sensors & hardware automation)
 */

(function () {
  'use strict';

  const DECOMP_SCENARIOS = [
    {
      id: 'car_system',
      title: '1. Connected Car Controller',
      shortTitle: 'Connected Car (ECU)',
      description: 'You are programming an automotive electronic control unit (ECU). Each cycle it samples driver pedals, manages engine throttle, controls active braking by checking anti-lock (ABS) wheel slip and calculating calliper hydraulic pressure, and updates the dashboard cockpit display.',
      rootLabel: 'Vehicle Control Unit',
      parentTaskName: 'Control Active Braking',
      level1: [
        { id: 'sample_pedals', label: 'Sample Driver Pedals', desc: 'Reads accelerator pedal angle, brake pedal pressure, and steering wheel torque' },
        { id: 'manage_engine', label: 'Manage Engine Throttle', desc: 'Calculates optimal air-fuel injection ratio and cylinder ignition timing' },
        { id: 'control_brakes', label: 'Control Active Braking', desc: 'Orchestrates anti-lock wheel slip monitoring, hydraulic callipers, and emergency stops' },
        { id: 'update_cockpit', label: 'Update Dashboard Cockpit', desc: 'Renders digital speedometer, battery/fuel gauge, and hazard warning lights' }
      ],
      level2: [
        {
          id: 'check_abs',
          label: 'Check ABS Wheel Slip',
          subType: 'Function',
          inputs: ['Wheel RPM', 'Chassis Road Speed'],
          outputs: ['Slip detected (bool)'],
          decision: 'Wheel RPM < Road Speed threshold?',
          branchTrue: 'Pulse ABS valve (prevent skid)',
          branchFalse: 'Maintain steady hydraulic pressure',
          desc: 'Compares individual wheel rotation speed against vehicle velocity to detect tyre skidding'
        },
        {
          id: 'calc_pressure',
          label: 'Calculate Calliper Pressure',
          subType: 'Function',
          inputs: ['Pedal force', 'Disc temperature'],
          outputs: ['Calliper pressure (bar)'],
          decision: 'Pedal force > 80%?',
          branchTrue: 'Apply maximum emergency braking force',
          branchFalse: 'Proportional hydraulic pressure',
          desc: 'Calculates exact hydraulic bar pressure to apply to brake pads without locking wheels'
        }
      ],
      distractors: [
        {
          id: 'tune_radio',
          label: 'Tune FM Stereo Radio',
          desc: 'Infotainment entertainment task, completely separate from real-time vehicle braking safety!'
        }
      ],
      dataFlowTasks: [
        {
          id: 'check_abs',
          name: 'check_abs_wheel_slip()',
          caller: 'Control Active Braking',
          purpose: 'Determines whether a wheel is rotating slower than vehicle road velocity to activate anti-lock pulsing.',
          variables: [
            { id: 'v1', name: 'wheel_rpm', type: 'param', label: 'wheel_rpm', roleDesc: 'PARAMETER (Input): Live rotational speed measured by the wheel hub sensor.' },
            { id: 'v2', name: 'chassis_speed_kph', type: 'param', label: 'chassis_speed_kph', roleDesc: 'PARAMETER (Input): Forward ground speed from the vehicle accelerometer.' },
            { id: 'v3', name: 'slip_detected', type: 'return', label: 'slip_detected', roleDesc: 'RETURN VALUE (Output): Boolean True/False returned to pulse the hydraulic valve.' },
            { id: 'v4', name: 'SLIP_RATIO_LIMIT = 0.15', type: 'local', label: 'SLIP_RATIO_LIMIT', roleDesc: 'LOCAL CONSTANT: Safety slip margin stored privately inside the subroutine.' },
            { id: 'v5', name: 'stereo_music_volume', type: 'irrelevant', label: 'stereo_music_volume', roleDesc: 'IRRELEVANT: Radio music volume has no influence on tyre traction or braking!' }
          ]
        },
        {
          id: 'calc_pressure',
          name: 'calculate_calliper_pressure()',
          caller: 'Control Active Braking',
          purpose: 'Calculates hydraulic fluid pressure needed to safely clamp the brake discs.',
          variables: [
            { id: 'v1', name: 'pedal_force_newtons', type: 'param', label: 'pedal_force_newtons', roleDesc: 'PARAMETER (Input): Physical force measured by the brake pedal load cell.' },
            { id: 'v2', name: 'disc_temperature_c', type: 'param', label: 'disc_temperature_c', roleDesc: 'PARAMETER (Input): Brake rotor temperature to compensate for heat fade.' },
            { id: 'v3', name: 'hydraulic_bars', type: 'return', label: 'hydraulic_bars', roleDesc: 'RETURN VALUE (Output): Pressure level in bars returned to hydraulic pump motor.' },
            { id: 'v4', name: 'pad_friction_coef', type: 'local', label: 'pad_friction_coef', roleDesc: 'LOCAL VARIABLE: Private friction constant based on ceramic pad material.' }
          ]
        }
      ]
    },
    {
      id: 'atm',
      title: '2. Cash Machine (ATM) Controller',
      shortTitle: 'Cash Machine (ATM)',
      description: 'You are designing embedded software for a cash machine (ATM). It reads the customer card and PIN, checks account balance, dispenses cash by checking daily limits and calculating banknote breakdown, and then ejects the card with a receipt.',
      rootLabel: 'ATM Controller',
      parentTaskName: 'Dispense Cash',
      level1: [
        { id: 'auth_pin', label: 'Verify Card & PIN', desc: 'Validates chip data and compares entered 4-digit PIN against bank security server' },
        { id: 'check_bal', label: 'Check Account Balance', desc: 'Queries customer available funds and authorized overdraft limit' },
        { id: 'dispense_cash', label: 'Dispense Cash', desc: 'Orchestrates withdrawal limits, note breakdown, and physical note dispenser mechanics' },
        { id: 'eject_receipt', label: 'Eject Card & Print Slip', desc: 'Releases card mechanism safely and prints transaction confirmation slip' }
      ],
      level2: [
        {
          id: 'check_limit',
          label: 'Check Daily Limit',
          subType: 'Function',
          inputs: ['Requested amount', 'Customer daily total'],
          outputs: ['Limit approved (bool)'],
          decision: 'Requested <= £300 daily max?',
          branchTrue: 'Approve withdrawal transaction',
          branchFalse: 'Reject: Daily limit exceeded',
          desc: 'Verifies customer has not breached daily £300 ATM safety ceiling'
        },
        {
          id: 'calc_notes',
          label: 'Calculate Banknote Breakdown',
          subType: 'Function',
          inputs: ['Approved amount', 'Available £20 count'],
          outputs: ['Count of £20s', 'Count of £10s'],
          decision: 'Remaining amount >= £20?',
          branchTrue: 'Allocate £20 notes first',
          branchFalse: 'Allocate remaining in £10 notes',
          desc: 'Calculates the optimal mix of £20 and £10 notes for the dispensing mechanism'
        }
      ],
      distractors: [
        {
          id: 'vault_code',
          label: 'Change Bank Vault Safe Code',
          desc: 'Physical bank branch maintenance, not part of customer-facing ATM software!'
        }
      ],
      dataFlowTasks: [
        {
          id: 'calc_notes',
          name: 'calculate_banknote_breakdown()',
          caller: 'Dispense Cash',
          purpose: 'Calculates how many £20 and £10 notes to dispense for an approved withdrawal sum.',
          variables: [
            { id: 'v1', name: 'approved_amount', type: 'param', label: 'approved_amount', roleDesc: 'PARAMETER (Input): The withdrawal sum needed by the routine to compute note quantities.' },
            { id: 'v2', name: 'twenties_in_tray', type: 'param', label: 'twenties_in_tray', roleDesc: 'PARAMETER (Input): The current count of £20 bills remaining in the ATM physical cassette.' },
            { id: 'v3', name: 'notes_to_eject', type: 'return', label: 'notes_to_eject', roleDesc: 'RETURN VALUE (Output): Dictionary/tuple of note counts returned back to the motor caller.' },
            { id: 'v4', name: 'modulo_remainder', type: 'local', label: 'modulo_remainder', roleDesc: 'LOCAL VARIABLE: Temporary arithmetic variable inside the subroutine; keeps global scope clean.' },
            { id: 'v5', name: 'customer_card_pin', type: 'irrelevant', label: 'customer_card_pin', roleDesc: 'IRRELEVANT: The banknote calculator has no need for the confidential security PIN!' }
          ]
        },
        {
          id: 'check_limit',
          name: 'check_daily_limit()',
          caller: 'Dispense Cash',
          purpose: 'Determines whether requested cash exceeds the £300 daily maximum security ceiling.',
          variables: [
            { id: 'v1', name: 'requested_sum', type: 'param', label: 'requested_sum', roleDesc: 'PARAMETER (Input): Passed down so the function knows how much the customer wants.' },
            { id: 'v2', name: 'today_withdrawn_so_far', type: 'param', label: 'today_withdrawn_so_far', roleDesc: 'PARAMETER (Input): Past daily total retrieved from the bank database.' },
            { id: 'v3', name: 'is_approved_flag', type: 'return', label: 'is_approved_flag', roleDesc: 'RETURN VALUE (Output): Boolean True/False returned to allow or block withdrawal.' },
            { id: 'v4', name: 'DAILY_MAX_CAP = 300', type: 'local', label: 'DAILY_MAX_CAP', roleDesc: 'LOCAL CONSTANT: Safety limit stored privately inside the subroutine.' }
          ]
        }
      ]
    },
    {
      id: 'space_game',
      title: '3. Space Arcade Game Loop',
      shortTitle: 'Space Arcade Game',
      description: 'You are developing a 2D space shooter arcade game. Each frame it samples controls, updates alien formations, resolves weapon hit collisions by checking shield reflection and calculating hull damage, and then draws canvas graphics.',
      rootLabel: 'Space Combat Game Loop',
      parentTaskName: 'Resolve Weapon Collisions',
      level1: [
        { id: 'sample_input', label: 'Sample Player Controls', desc: 'Reads joystick thrust vector, laser firing trigger, and hyperspace button' },
        { id: 'update_ai', label: 'Update Enemy AI Ships', desc: 'Calculates alien swarm trajectories, patrol waypoints, and homing missiles' },
        { id: 'resolve_combat', label: 'Resolve Weapon Collisions', desc: 'Checks laser bounding boxes, shield reflection, and armor hull damage calculations' },
        { id: 'render_frame', label: 'Render Video Frame', desc: 'Draws starship sprites, particle explosions, and HUD shield bar to screen buffer' }
      ],
      level2: [
        {
          id: 'check_shield',
          label: 'Check Shield Reflection',
          subType: 'Function',
          inputs: ['Laser energy', 'Shield charge'],
          outputs: ['Shield absorbed (bool)'],
          decision: 'Shield charge > 0?',
          branchTrue: 'Absorb hit & deflect laser beam',
          branchFalse: 'Laser penetrates directly to hull',
          desc: 'Determines if forcefield energy reflects the incoming laser beam'
        },
        {
          id: 'calc_damage',
          label: 'Calculate Hull Damage',
          subType: 'Function',
          inputs: ['Weapon power', 'Armor multiplier'],
          outputs: ['Net damage HP'],
          decision: 'Critical hit roll > 90?',
          branchTrue: 'Double base damage (2x Critical)',
          branchFalse: 'Apply standard armor reduction',
          desc: 'Calculates exact hit points deducted from enemy starship hull'
        }
      ],
      distractors: [
        {
          id: 'download_dlc',
          label: 'Download Multiplayer DLC',
          desc: 'Online shop / operating system network task, not part of the high-speed combat loop!'
        }
      ],
      dataFlowTasks: [
        {
          id: 'calc_damage',
          name: 'calculate_hull_damage()',
          caller: 'Resolve Weapon Collisions',
          purpose: 'Calculates net hit points deducted from target ship after armor reduces laser blast.',
          variables: [
            { id: 'v1', name: 'laser_power', type: 'param', label: 'laser_power', roleDesc: 'PARAMETER (Input): Weapon attack power passed down from laser collision detector.' },
            { id: 'v2', name: 'target_armor_rating', type: 'param', label: 'target_armor_rating', roleDesc: 'PARAMETER (Input): Defensive armor stat of the enemy ship struck by laser.' },
            { id: 'v3', name: 'net_hp_deducted', type: 'return', label: 'net_hp_deducted', roleDesc: 'RETURN VALUE (Output): Integer HP reduction returned to deduct from health bar.' },
            { id: 'v4', name: 'random_crit_roll', type: 'local', label: 'random_crit_roll', roleDesc: 'LOCAL VARIABLE: Private random dice roll generated strictly inside the formula.' },
            { id: 'v5', name: 'master_audio_volume', type: 'irrelevant', label: 'master_audio_volume', roleDesc: 'IRRELEVANT: Audio mixer volume has no effect on combat hit points!' }
          ]
        }
      ]
    },
    {
      id: 'greenhouse',
      title: '4. Smart Greenhouse Controller',
      shortTitle: 'Smart Greenhouse',
      description: 'You are programming an automated climate controller for a commercial greenhouse. It reads environmental sensors, evaluates crop growth targets, operates climate hardware by calculating heating power and activating misting sprinklers, and then transmits telemetry to the cloud.',
      rootLabel: 'Greenhouse Controller',
      parentTaskName: 'Operate Climate Hardware',
      level1: [
        { id: 'poll_sensors', label: 'Read Environmental Sensors', desc: 'Reads digital thermometer, soil humidity probes, and solar lux light meter' },
        { id: 'eval_targets', label: 'Evaluate Crop Thresholds', desc: 'Compares live telemetry against optimal ranges stored in tomato growth profile' },
        { id: 'operate_climate', label: 'Operate Climate Hardware', desc: 'Controls roof vent louvres, electric fan heaters, and misting irrigation pumps' },
        { id: 'log_telemetry', label: 'Transmit Cloud Telemetry', desc: 'Sends hourly status reports to mobile app and triggers SMS alerts on frost warning' }
      ],
      level2: [
        {
          id: 'calc_heat',
          label: 'Calculate Heating Power',
          subType: 'Function',
          inputs: ['Current temp', 'Target temp'],
          outputs: ['Heating wattage (W)'],
          decision: 'Current temp < Target temp?',
          branchTrue: 'Compute heater kilowatt output',
          branchFalse: 'Heater remains off (0 Watts)',
          desc: 'Calculates heater wattage to maintain optimal growing temperature'
        },
        {
          id: 'trigger_misting',
          label: 'Activate Misting Sprinklers',
          subType: 'Procedure',
          inputs: ['Moisture deficit %', 'Duration seconds'],
          outputs: [],
          desc: 'Pulses water solenoid valves to spray fine mist across plant beds'
        }
      ],
      distractors: [
        {
          id: 'harvest_crops',
          label: 'Harvest Ripe Tomatoes',
          desc: 'Physical agricultural labor performed by greenhouse staff, not automated software code!'
        }
      ],
      dataFlowTasks: [
        {
          id: 'calc_heat',
          name: 'calculate_heating_power()',
          caller: 'Operate Climate Hardware',
          purpose: 'Calculates the required heating wattage based on how far ambient temp dropped below setpoint.',
          variables: [
            { id: 'v1', name: 'current_celsius', type: 'param', label: 'current_celsius', roleDesc: 'PARAMETER (Input): Current ambient reading passed down from sensor evaluation.' },
            { id: 'v2', name: 'target_celsius', type: 'param', label: 'target_celsius', roleDesc: 'PARAMETER (Input): Desired temperature setpoint from plant growth profile.' },
            { id: 'v3', name: 'required_wattage', type: 'return', label: 'required_wattage', roleDesc: 'RETURN VALUE (Output): The Function returns the calculated power in Watts to heater switch.' },
            { id: 'v4', name: 'glass_loss_coefficient', type: 'local', label: 'glass_loss_coefficient', roleDesc: 'LOCAL CONSTANT: Thermal insulation constant used internally in the formula.' },
            { id: 'v5', name: 'water_pipe_pressure', type: 'irrelevant', label: 'water_pipe_pressure', roleDesc: 'IRRELEVANT: Sprinkler water pressure is unrelated to heating coil calculations!' }
          ]
        }
      ]
    }
  ];

  // State Management
  let currentScenarioIdx = 0;
  let placedSlots = {}; // { 'l1_0': blockId, ... }
  let selectedCandidateId = null;
  let validationResults = null; // null or { 'l1_0': { correct: bool, msg: string } }
  let task1Celebrated = false;
  let task2Celebrated = false;
  let lastCelebrationTime = 0;
  let shuffledCandidateBlocks = [];

  // Task 2 Wiring State
  let activeWiringTaskIdx = 0;
  let wiringAssignments = {}; // { varId: 'param' | 'return' | 'local' | 'irrelevant' }
  let wiringValidation = null;

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function initDecomposition() {
    renderScenarioPills();
    initTask1Listeners();
    loadScenario(0);
  }

  function renderScenarioPills() {
    const container = document.getElementById('decompScenarioPills');
    if (!container) return;

    container.innerHTML = DECOMP_SCENARIOS.map((sc, idx) => `
      <button type="button" class="challenge-pill-btn ${idx === currentScenarioIdx ? 'active' : ''}" data-idx="${idx}">
        ${sc.title}
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
    placedSlots = {};
    selectedCandidateId = null;
    validationResults = null;
    task1Celebrated = false;
    task2Celebrated = false;
    activeWiringTaskIdx = 0;
    wiringAssignments = {};
    wiringValidation = null;

    const sc = DECOMP_SCENARIOS[idx];
    shuffledCandidateBlocks = shuffleArray(getAllCandidateBlocks(sc));

    const pills = document.querySelectorAll('#decompScenarioPills button');
    pills.forEach((p, i) => p.classList.toggle('active', i === idx));

    const descEl = document.getElementById('decompScenarioDesc');
    const rootEl = document.getElementById('chartRootNode');
    const titleEl = document.getElementById('decompScenarioTitle');

    if (titleEl) titleEl.innerText = `Challenge 1: Assemble the ${sc.shortTitle} Structure Chart`;
    if (descEl) descEl.innerText = sc.description;
    if (rootEl) rootEl.innerText = sc.rootLabel;

    renderTask1UI();
    initTask2Wiring();

    const feedback = document.getElementById('decompFeedbackBox');
    if (feedback) feedback.style.display = 'none';
  }

  // Celebratory Confetti & Audio Chime with Anti-Spam Guard
  let audioCtx = null;
  function triggerSafeConfetti(opts = {}) {
    const now = Date.now();
    // Enforce 2.5 second cooldown to eliminate runaway blizzard scaling
    if (now - lastCelebrationTime < 2500) {
      return;
    }
    lastCelebrationTime = now;

    try {
      if (typeof confetti === 'function') {
        if (typeof confetti.reset === 'function') {
          confetti.reset();
        }
        confetti({
          particleCount: opts.particleCount || 55,
          spread: opts.spread || 65,
          origin: opts.origin || { y: 0.6 },
          disableForReducedMotion: true
        });
      }
      playSuccessChime();
    } catch (e) {}
  }

  function playSuccessChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      const now = audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + (idx * 0.08));
        gain.gain.setValueAtTime(0.0001, now + (idx * 0.08));
        gain.gain.linearRampToValueAtTime(0.18, now + (idx * 0.08) + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx * 0.08) + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + (idx * 0.08));
        osc.stop(now + (idx * 0.08) + 0.4);
      });
    } catch (e) {}
  }

  function initTask1Listeners() {
    const btnAutoArrange = document.getElementById('btnDecompAutoFill');
    const btnResetChart = document.getElementById('btnDecompReset');
    const btnCheckChart = document.getElementById('btnDecompCheck');

    if (btnAutoArrange) {
      btnAutoArrange.addEventListener('click', autoFillChart);
    }
    if (btnResetChart) {
      btnResetChart.addEventListener('click', resetDecompChart);
    }
    if (btnCheckChart) {
      btnCheckChart.addEventListener('click', validateStructureChart);
    }

    // 1. Delegated listener on block pool (click to select/toggle candidate chip)
    const poolContainer = document.getElementById('decompBlockPool');
    if (poolContainer) {
      poolContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.decomp-candidate-chip');
        if (chip) {
          const bId = chip.getAttribute('data-block-id');
          selectedCandidateId = (selectedCandidateId === bId) ? null : bId;
          renderTask1UI();
        }
      });

      poolContainer.addEventListener('dragstart', (e) => {
        const chip = e.target.closest('.decomp-candidate-chip');
        if (chip) {
          const bId = chip.getAttribute('data-block-id');
          e.dataTransfer.setData('text/plain', bId);
          selectedCandidateId = bId;
        }
      });
    }

    // 2. Delegated listener on structure chart canvas (click empty slot to place, click X to remove)
    const chartCanvas = document.querySelector('.decomp-chart-canvas');
    if (chartCanvas) {
      chartCanvas.addEventListener('click', (e) => {
        // Remove button on filled slot
        const removeBtn = e.target.closest('.slot-remove-btn');
        if (removeBtn) {
          e.stopPropagation();
          const slot = removeBtn.getAttribute('data-slot');
          if (slot) {
            delete placedSlots[slot];
            validationResults = null;
            task1Celebrated = false;
            renderTask1UI();
          }
          return;
        }

        // Empty slot clicked with a selected candidate chip
        const slotEl = e.target.closest('.chart-node-slot');
        if (slotEl && slotEl.classList.contains('empty') && selectedCandidateId) {
          const slotId = slotEl.id.replace('slot_', '');
          placedSlots[slotId] = selectedCandidateId;
          selectedCandidateId = null;
          validationResults = null;
          renderTask1UI();
          if (Object.keys(placedSlots).length === 6) {
            validateStructureChart();
          }
        }
      });

      chartCanvas.addEventListener('dragover', (e) => {
        const slotEl = e.target.closest('.chart-node-slot');
        if (slotEl) e.preventDefault();
      });

      chartCanvas.addEventListener('drop', (e) => {
        const slotEl = e.target.closest('.chart-node-slot');
        if (slotEl && slotEl.classList.contains('empty')) {
          e.preventDefault();
          const bId = e.dataTransfer.getData('text/plain');
          if (bId) {
            const slotId = slotEl.id.replace('slot_', '');
            placedSlots[slotId] = bId;
            selectedCandidateId = null;
            validationResults = null;
            renderTask1UI();
            if (Object.keys(placedSlots).length === 6) {
              validateStructureChart();
            }
          }
        }
      });
    }
  }

  function resetDecompChart() {
    const sc = DECOMP_SCENARIOS[currentScenarioIdx];
    shuffledCandidateBlocks = shuffleArray(getAllCandidateBlocks(sc));
    placedSlots = {};
    selectedCandidateId = null;
    validationResults = null;
    task1Celebrated = false;
    renderTask1UI();
    const feedback = document.getElementById('decompFeedbackBox');
    if (feedback) feedback.style.display = 'none';
  }

  function autoFillChart() {
    const sc = DECOMP_SCENARIOS[currentScenarioIdx];
    // Fill all 4 Level 1 tasks
    sc.level1.forEach((b, i) => {
      placedSlots[`l1_${i}`] = b.id;
    });
    // Fill all 2 Level 2 subroutines
    sc.level2.forEach((b, j) => {
      placedSlots[`l2_${j}`] = b.id;
    });
    selectedCandidateId = null;
    validateStructureChart();
  }

  // Get all candidate blocks for current scenario (Level 1 + Level 2 + Distractors)
  function getAllCandidateBlocks(sc) {
    const items = [];
    sc.level1.forEach(b => items.push({ ...b, expectedLevel: 1 }));
    sc.level2.forEach(b => items.push({ ...b, expectedLevel: 2 }));
    if (sc.distractors) {
      sc.distractors.forEach(b => items.push({ ...b, expectedLevel: 0, isDistractor: true }));
    }
    return items;
  }

  function renderTask1UI() {
    const poolContainer = document.getElementById('decompBlockPool');
    const sc = DECOMP_SCENARIOS[currentScenarioIdx];
    if (!poolContainer) return;

    if (!shuffledCandidateBlocks || shuffledCandidateBlocks.length === 0) {
      shuffledCandidateBlocks = shuffleArray(getAllCandidateBlocks(sc));
    }
    const placedIds = Object.values(placedSlots);
    const unplaced = shuffledCandidateBlocks.filter(c => !placedIds.includes(c.id));

    if (unplaced.length === 0) {
      poolContainer.innerHTML = `
        <div style="font-size: 12px; color: var(--forest-green); font-weight: 700; padding: 6px;">
          ✓ All slots placed. Evaluating your structure chart...
        </div>
      `;
    } else {
      // Render neutral card chips without spoilers or level tags
      poolContainer.innerHTML = unplaced.map(b => {
        const isSelected = selectedCandidateId === b.id;
        return `
          <div class="decomp-candidate-chip ${isSelected ? 'selected' : ''}" 
               data-block-id="${b.id}" 
               draggable="true" 
               title="${b.desc}">
            <span class="chip-drag-handle">⠿</span>
            <span class="chip-label">${b.label}</span>
          </div>
        `;
      }).join('');
    }

    renderChartSlots(sc);
  }

  function renderChartSlots(sc) {
    // 4 Level 1 Slots
    for (let i = 0; i < 4; i++) {
      const slotEl = document.getElementById(`slot_l1_${i}`);
      if (!slotEl) continue;

      const slotKey = `l1_${i}`;
      const placedId = placedSlots[slotKey];
      const val = validationResults ? validationResults[slotKey] : null;

      if (placedId) {
        const item = getAllCandidateBlocks(sc).find(x => x.id === placedId);
        let colorClass = 'block-neutral-placed';
        let badgeHtml = '';

        if (val) {
          if (val.correct) {
            colorClass = 'block-amber';
            badgeHtml = '<span class="slot-status-icon correct">✓ Level 1 Sub-problem</span>';
          } else {
            colorClass = 'block-invalid';
            badgeHtml = `<span class="slot-status-icon error" title="${val.msg}">⚠️ Misplaced</span>`;
          }
        }

        slotEl.className = `chart-node-slot filled ${colorClass}`;
        slotEl.innerHTML = `
          <span class="slot-text">${item ? item.label : placedId}</span>
          ${badgeHtml}
          <button type="button" class="slot-remove-btn" data-slot="${slotKey}" title="Remove block">×</button>
        `;
      } else {
        const isTarget = selectedCandidateId !== null;
        slotEl.className = `chart-node-slot empty ${isTarget ? 'awaiting-drop' : ''}`;
        slotEl.innerHTML = `<span class="slot-placeholder">Level 1: Sub-problem ${i + 1}</span>`;
      }
    }

    // 2 Level 2 Slots (under Slot 4 or 3)
    for (let j = 0; j < 2; j++) {
      const slotEl = document.getElementById(`slot_l2_${j}`);
      if (!slotEl) continue;

      const slotKey = `l2_${j}`;
      const placedId = placedSlots[slotKey];
      const val = validationResults ? validationResults[slotKey] : null;

      if (placedId) {
        const item = getAllCandidateBlocks(sc).find(x => x.id === placedId);
        let colorClass = 'block-neutral-placed';
        let badgeHtml = '';

        if (val) {
          if (val.correct) {
            colorClass = 'block-teal';
            badgeHtml = '<span class="slot-status-icon correct">✓ Level 2 Subroutine</span>';
          } else {
            colorClass = 'block-invalid';
            badgeHtml = `<span class="slot-status-icon error" title="${val.msg}">⚠️ Misplaced</span>`;
          }
        }

        slotEl.className = `chart-node-slot filled ${colorClass}`;
        slotEl.innerHTML = `
          <span class="slot-text">${item ? item.label : placedId}</span>
          ${badgeHtml}
          <button type="button" class="slot-remove-btn" data-slot="${slotKey}" title="Remove block">×</button>
        `;
      } else {
        const isTarget = selectedCandidateId !== null;
        slotEl.className = `chart-node-slot empty ${isTarget ? 'awaiting-drop' : ''}`;
        slotEl.innerHTML = `<span class="slot-placeholder">Level 2: Subroutine ${j + 1}</span>`;
      }
    }
  }

  function validateStructureChart() {
    const sc = DECOMP_SCENARIOS[currentScenarioIdx];
    const allCandidates = getAllCandidateBlocks(sc);
    const results = {};
    let correctCount = 0;
    const totalSlots = 6;

    // Evaluate Level 1 (Slots l1_0 to l1_3)
    for (let i = 0; i < 4; i++) {
      const slotKey = `l1_${i}`;
      const placedId = placedSlots[slotKey];
      if (!placedId) continue;

      const item = allCandidates.find(x => x.id === placedId);
      if (item.isDistractor) {
        results[slotKey] = { correct: false, msg: `Distractor task! ${item.desc}` };
      } else if (item.expectedLevel === 1) {
        if (slotKey === 'l1_2' && item.label !== sc.parentTaskName) {
          results[slotKey] = { correct: false, msg: `Slot 3 is the Decomposed Parent Task and must be "${sc.parentTaskName}" because subroutines branch beneath it!` };
        } else if (slotKey !== 'l1_2' && item.label === sc.parentTaskName) {
          results[slotKey] = { correct: false, msg: `"${sc.parentTaskName}" has subroutines branching beneath it, so it belongs in the Decomposed Parent Task slot (Slot 3)!` };
        } else {
          results[slotKey] = { correct: true, msg: 'Valid Level 1 sub-problem' };
          correctCount++;
        }
      } else {
        results[slotKey] = { correct: false, msg: `Level mismatch: "${item.label}" is a decomposed subroutine, not a Level 1 major task!` };
      }
    }

    // Evaluate Level 2 (Slots l2_0 and l2_1)
    for (let j = 0; j < 2; j++) {
      const slotKey = `l2_${j}`;
      const placedId = placedSlots[slotKey];
      if (!placedId) continue;

      const item = allCandidates.find(x => x.id === placedId);
      if (item.isDistractor) {
        results[slotKey] = { correct: false, msg: `Distractor task! ${item.desc}` };
      } else if (item.expectedLevel === 2) {
        results[slotKey] = { correct: true, msg: 'Valid Level 2 decomposed subroutine' };
        correctCount++;
      } else {
        results[slotKey] = { correct: false, msg: `Level mismatch: "${item.label}" is a major Level 1 task, not a decomposed subroutine!` };
      }
    }

    validationResults = results;
    renderTask1UI();

    const feedback = document.getElementById('decompFeedbackBox');
    if (!feedback) return;

    feedback.style.display = 'block';

    if (correctCount === totalSlots) {
      feedback.className = 'defect-alert-banner alert-success';
      feedback.style.background = 'rgba(16, 185, 129, 0.12)';
      feedback.style.borderLeftColor = '#10b981';
      feedback.innerHTML = `
        <div>
          <strong style="color: #10b981; font-size: 13.5px;">✓ Structure Chart Hierarchy Fully Verified! (6 / 6 Correct)</strong><br>
          Excellent architectural decomposition. You classified the 4 top-level sub-problems under <code>${sc.rootLabel}</code>, and correctly decomposed <code>${sc.parentTaskName}</code> into 2 discrete subroutines without using distractors!
        </div>
      `;
      if (!task1Celebrated) {
        task1Celebrated = true;
        triggerSafeConfetti({ particleCount: 55, spread: 65, origin: { y: 0.6 } });
      }
    } else {
      task1Celebrated = false;
      const filledCount = Object.keys(placedSlots).length;
      feedback.className = 'defect-alert-banner alert-warn';
      feedback.style.background = 'rgba(245, 158, 11, 0.12)';
      feedback.style.borderLeftColor = '#f59e0b';
      feedback.innerHTML = `
        <div>
          <strong style="color: #d97706; font-size: 13px;">Structure Chart Evaluation: ${correctCount} / ${totalSlots} Correct</strong><br>
          ${filledCount < totalSlots ? `You still have ${totalSlots - filledCount} empty slot(s). ` : ''}
          Review the slots marked with ⚠️ icons. Remember: Major tasks belong at Level 1, while specific mathematical or hardware routines belong at Level 2!
        </div>
      `;
    }
  }

  // =========================================================================
  // TASK 2: INTERACTIVE DATA FLOW & PARAMETER WIRING CHALLENGE
  // =========================================================================

  function initTask2Wiring() {
    const sc = DECOMP_SCENARIOS[currentScenarioIdx];
    const taskData = sc.dataFlowTasks[activeWiringTaskIdx] || sc.dataFlowTasks[0];
    const container = document.getElementById('dataFlowCardArea');
    if (!container) return;

    // Subroutine picker tabs
    const subTabsHtml = sc.dataFlowTasks.map((t, idx) => `
      <button type="button" class="challenge-pill-btn ${idx === activeWiringTaskIdx ? 'active' : ''}" data-wiring-idx="${idx}">
        ${t.name}
      </button>
    `).join('');

    // Generate Variable Rows
    const varRowsHtml = taskData.variables.map(v => {
      const assigned = wiringAssignments[v.id];
      let rowFeedback = '';
      if (wiringValidation) {
        if (v.type === 'irrelevant') {
          if (assigned === 'irrelevant' || assigned === undefined) {
            rowFeedback = '<span style="color: var(--forest-green); font-weight: 700; font-size: 11px;">✓ Excluded</span>';
          } else {
            rowFeedback = '<span style="color: var(--cardinal-red); font-weight: 700; font-size: 11px;">✗ Irrelevant data!</span>';
          }
        } else {
          if (assigned === v.type) {
            rowFeedback = `<span style="color: var(--forest-green); font-weight: 700; font-size: 11px;">✓ Correct (${v.type.toUpperCase()})</span>`;
          } else {
            rowFeedback = `<span style="color: var(--cardinal-red); font-weight: 700; font-size: 11px;">✗ Should be ${v.type.toUpperCase()}</span>`;
          }
        }
      }

      return `
        <div class="wiring-matrix-row ${assigned ? 'assigned-' + assigned : ''}">
          <div class="wiring-row-info">
            <div style="display: flex; align-items: center; gap: 8px;">
              <code class="wiring-var-name">${v.name}</code>
              ${rowFeedback}
            </div>
            <div class="wiring-var-hint">${v.roleDesc}</div>
          </div>
          <div class="wiring-role-buttons" data-var="${v.id}">
            <button type="button" class="role-btn btn-param ${assigned === 'param' ? 'active' : ''}" data-role="param" title="Pass down into subroutine as parameter">
              ↓ Parameter
            </button>
            <button type="button" class="role-btn btn-return ${assigned === 'return' ? 'active' : ''}" data-role="return" title="Return result up to caller">
              ↑ Return
            </button>
            <button type="button" class="role-btn btn-local ${assigned === 'local' ? 'active' : ''}" data-role="local" title="Keep inside local scope">
              🔒 Local
            </button>
            <button type="button" class="role-btn btn-irrelevant ${assigned === 'irrelevant' ? 'active' : ''}" data-role="irrelevant" title="Not needed by this subroutine">
              ✕ Exclude
            </button>
          </div>
        </div>
      `;
    }).join('');

    const totalCount = taskData.variables.length;
    const assignedCount = Object.keys(wiringAssignments).length;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
        <div class="dataflow-sub-selector">
          ${subTabsHtml}
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span style="font-size: 11px; font-family: var(--font-mono); color: var(--ink-secondary); margin-right: 4px;">
            ${assignedCount} / ${totalCount} Wired
          </span>
          <button type="button" id="btnVerifyDataFlow" class="btn-step-primary">
            ✓ Check Answer
          </button>
          <button type="button" id="btnAutoWireDataFlow" class="btn-step-secondary" title="Auto-fill model data flow">
            ✨ Model Solution
          </button>
          <button type="button" id="btnResetDataFlow" class="btn-step-secondary" title="Clear all assignments">
            ↺ Reset
          </button>
        </div>
      </div>

      <!-- Problem Context Banner -->
      <div class="wiring-context-card">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
          <span class="badge badge-topic">SUBROUTINE TARGET</span>
          <strong style="font-family: var(--font-mono); font-size: 14px; color: var(--ink-primary);">${taskData.name}</strong>
          <span style="font-size: 11.5px; color: var(--ink-secondary);">Called by: <strong>${taskData.caller}</strong></span>
        </div>
        <p style="font-size: 12.5px; color: var(--ink-secondary); margin: 0; line-height: 1.5;">
          ${taskData.purpose} For each variable below, select whether it is a <strong>Parameter</strong> (passed down &darr;), a <strong>Return Value</strong> (passed up &uarr;), a <strong>Local Variable</strong> (private scope), or <strong>Excluded</strong>. Watch the diagram update live!
        </p>
      </div>

      <!-- Matrix of candidate variables -->
      <div class="wiring-matrix-box">
        <div class="wiring-matrix-list">
          ${varRowsHtml}
        </div>
      </div>

      <!-- Live Diagram & Feedback -->
      <div id="wiringFeedbackArea" style="margin-top: 18px;">
        ${renderWiringFeedbackHtml(taskData)}
      </div>
    `;

    attachWiringListeners(taskData);
  }

  function attachWiringListeners(taskData) {
    // Sub-tabs
    document.querySelectorAll('[data-wiring-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeWiringTaskIdx = parseInt(btn.getAttribute('data-wiring-idx'), 10);
        wiringAssignments = {};
        wiringValidation = null;
        initTask2Wiring();
      });
    });

    // Role buttons on variable rows
    document.querySelectorAll('.wiring-role-buttons .role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const vId = btn.parentElement.getAttribute('data-var');
        const role = btn.getAttribute('data-role');
        if (wiringAssignments[vId] === role) {
          delete wiringAssignments[vId];
        } else {
          wiringAssignments[vId] = role;
        }
        wiringValidation = null;
        initTask2Wiring();

        // Check if all variables have been assigned a role to auto-verify
        const allAssigned = taskData.variables.every(v => wiringAssignments[v.id]);
        if (allAssigned) {
          verifyDataFlowWiring(taskData);
        }
      });
    });

    // Action buttons
    const btnVerify = document.getElementById('btnVerifyDataFlow');
    if (btnVerify) {
      btnVerify.addEventListener('click', () => {
        verifyDataFlowWiring(taskData);
      });
    }

    const btnReset = document.getElementById('btnResetDataFlow');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        wiringAssignments = {};
        wiringValidation = null;
        initTask2Wiring();
      });
    }

    const btnAuto = document.getElementById('btnAutoWireDataFlow');
    if (btnAuto) {
      btnAuto.addEventListener('click', () => {
        taskData.variables.forEach(v => {
          wiringAssignments[v.id] = v.type;
        });
        verifyDataFlowWiring(taskData);
      });
    }
  }

  function verifyDataFlowWiring(taskData) {
    let allCorrect = true;
    let mistakes = [];

    taskData.variables.forEach(v => {
      const assigned = wiringAssignments[v.id];
      if (v.type === 'irrelevant') {
        if (assigned !== undefined && assigned !== 'irrelevant') {
          allCorrect = false;
          mistakes.push(`<code>${v.name}</code> is irrelevant to this subroutine and should be excluded.`);
        }
      } else {
        if (assigned !== v.type) {
          allCorrect = false;
          mistakes.push(`<code>${v.name}</code> should be classified as <strong>${v.type.toUpperCase()}</strong>: ${v.roleDesc}`);
        }
      }
    });

    wiringValidation = { allCorrect, mistakes };
    initTask2Wiring();

    if (allCorrect) {
      if (!task2Celebrated) {
        task2Celebrated = true;
        triggerSafeConfetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    } else {
      task2Celebrated = false;
    }
  }

  function renderWiringFeedbackHtml(taskData) {
    const paramsList = taskData.variables.filter(v => wiringAssignments[v.id] === 'param').map(v => v.name).join(', ') || 'None';
    const returnVars = taskData.variables.filter(v => wiringAssignments[v.id] === 'return').map(v => v.name).join(', ') || 'None';
    const localVars = taskData.variables.filter(v => wiringAssignments[v.id] === 'local').map(v => v.name).join(', ') || 'None';

    let alertBannerHtml = '';
    if (wiringValidation) {
      if (wiringValidation.allCorrect) {
        alertBannerHtml = `
          <div class="defect-alert-banner alert-success" style="background: rgba(16, 185, 129, 0.12); border-left-color: #10b981; margin-bottom: 16px;">
            <div>
              <strong style="color: #10b981; font-size: 13.5px;">✓ Correct Data Flow Architecture!</strong><br>
              You accurately identified the input parameters passed down, the output returned to caller, and variables protected in local scope.
            </div>
          </div>
        `;
      } else {
        alertBannerHtml = `
          <div class="defect-alert-banner alert-warn" style="background: rgba(245, 158, 11, 0.12); border-left-color: #f59e0b; margin-bottom: 16px;">
            <div>
              <strong style="color: #d97706; font-size: 13px;">Data Flow Wiring Adjustments Needed:</strong><br>
              <ul style="margin: 6px 0 0 16px; font-size: 12px; line-height: 1.55;">
                ${wiringValidation.mistakes.map(m => `<li>${m}</li>`).join('')}
              </ul>
            </div>
          </div>
        `;
      }
    }

    return `
      ${alertBannerHtml}

      <!-- Live AQA Data Couple Diagram -->
      <div class="aqa-live-couple-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 12px; font-weight: 800; color: var(--oxford-navy); text-transform: uppercase; letter-spacing: 0.05em;">
            Live Structure Chart Couple Visualisation:
          </span>
          <span style="font-size: 11px; color: var(--ink-secondary); font-family: var(--font-mono);">AQA Standard Notation</span>
        </div>
        
        <div class="aqa-visual-trunk-box">
          <div class="aqa-caller-node">
            <span>${taskData.caller}</span>
            <span style="font-size: 10px; opacity: 0.8;">(Calling Module)</span>
          </div>

          <!-- Connecting Stem with Live Couple Arrows -->
          <div class="aqa-pipe-stem">
            <div class="couple-pill param-pill" title="Parameters passed down into subroutine">
              <span>○ ↓</span>
              <span>params: (${paramsList})</span>
            </div>
            <div class="couple-stem-line"></div>
            <div class="couple-pill return-pill" title="Return values passed back to caller">
              <span>↑ ○</span>
              <span>returns: (${returnVars})</span>
            </div>
          </div>

          <div class="aqa-callee-node">
            <span>${taskData.name}</span>
            <span style="font-size: 10px; opacity: 0.9;">Local: [${localVars}]</span>
          </div>
        </div>
      </div>
    `;
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDecomposition);
  } else {
    initDecomposition();
  }

})();
