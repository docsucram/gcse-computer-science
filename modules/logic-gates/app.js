/**
 * GCSE Boolean Logic & Circuits Module Logic
 * Pure Vanilla JavaScript (ES6+) - Aligned with AQA 8525 §3.4.3
 * Interactive Logic Gate Breadboard, Drag-and-Drop Wires, and Live Truth Tables
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. STATE & DATA STRUCTURES
  // =========================================================================

  let nextId = 1;

  const state = {
    nodes: [],              // { id, type, gateType, label, state, x, y, inputs: [], output: val }
    wires: [],              // { id, fromNodeId, fromPinIndex, toNodeId, toPinIndex, state }
    activeWireSource: null, // { nodeId, pinIndex }
    mousePos: { x: 0, y: 0 },
    draggedNode: null,
    dragOffset: { x: 0, y: 0 },
    activeTab: 'breadboard',
    activeChallenge: 'free',
    challengeCompleted: false,
  };

  const CHALLENGES = {
    free: {
      name: 'Free Breadboard',
      number: null,
      desc: 'Build, wire, and test any logic circuits freely.',
      formula: '',
      goal: '',
      detailsHtml: '',
      inputs: [],
      outputs: [],
      test: null
    },
    greenhouse: {
      name: 'Smart Greenhouse Ventilation',
      number: 1,
      desc: 'Automate a greenhouse roof vent motor. The vent (Vent) must open when it is Hot (A=1) AND Dry (B=1), OR whenever the emergency Manual Override switch (C=1) is switched ON.',
      formula: 'Vent = (A AND B) OR C',
      goal: 'Wire inputs Hot (Input A) and Dry (Input B) into an AND gate. Connect the output of that AND gate and Override (Input C) into an OR gate, then wire the OR gate to the Vent LED.',
      detailsHtml: '',
      inputs: ['A', 'B', 'C'],
      outputs: ['Vent'],
      test: (inp) => (((inp.A === 1 && inp.B === 1) || inp.C === 1) ? 1 : 0)
    },
    vault: {
      name: 'Bank Vault Intruder Alarm',
      number: 2,
      desc: 'Protect a bank vault. The alarm (Alarm) must sound if the Laser Sensor is tripped (A=1) AND the Pressure Plate is active (B=1), provided the Security Key is NOT turned (C=0).',
      formula: 'Alarm = (A AND B) AND (NOT C)',
      goal: 'Wire inputs Laser (Input A) and Pressure (Input B) to an AND gate. Wire Key (Input C) to a NOT gate. Connect both signals into a second AND gate, wired to the Alarm LED.',
      detailsHtml: '',
      inputs: ['A', 'B', 'C'],
      outputs: ['Alarm'],
      test: (inp) => ((inp.A === 1 && inp.B === 1 && inp.C === 0) ? 1 : 0)
    },
    staircase: {
      name: 'Two-Way Staircase Switch',
      number: 3,
      desc: 'Control a hallway staircase light with two independent switches (A upstairs, B downstairs). Flipping either switch toggles the light: the light turns ON when exactly one switch is flipped, but turns OFF if both switches are in the same state.',
      formula: 'Light = A XOR B',
      goal: 'Wire Upstairs (Input A) and Downstairs (Input B) into an XOR gate, then wire the gate output to the Light LED.',
      detailsHtml: '',
      inputs: ['A', 'B'],
      outputs: ['Light'],
      test: (inp) => (inp.A !== inp.B ? 1 : 0)
    },
    adder: {
      name: '1-Bit Binary Half Adder',
      number: 4,
      desc: 'In binary arithmetic, adding two 1-bit numbers (A + B) produces a 2-bit result: a SUM bit and a CARRY bit e.g.',
      formula: 'Sum = A XOR B   |   Carry = A AND B',
      goal: 'Wire Bit A (Input A) and Bit B (Input B) to an XOR gate, then wire its output to the SUM LED. Wire Bit A (Input A) and Bit B (Input B) to an AND gate, then wire its output to the CARRY LED.',
      detailsHtml: `
        <div class="adder-table-container">
          <div class="adder-arithmetic-table">
            <div class="adder-row"><span>0 + 0 = 0 (00₂)</span> <span class="adder-tag">Sum 0, Carry 0</span></div>
            <div class="adder-row"><span>0 + 1 = 1 (01₂)</span> <span class="adder-tag">Sum 1, Carry 0</span></div>
            <div class="adder-row"><span>1 + 0 = 1 (01₂)</span> <span class="adder-tag">Sum 1, Carry 0</span></div>
            <div class="adder-row highlight"><span>1 + 1 = 2 (10₂)</span> <span class="adder-tag carry">Sum 0, Carry 1</span></div>
          </div>
        </div>
        <div class="challenge-goal-checklist">
          <div>&bull; The <strong>Sum LED</strong> should output <strong>1</strong> when inputs are different (0+1 or 1+0).</div>
          <div>&bull; The <strong>Carry LED</strong> should output <strong>1</strong> when both inputs are 1 (1+1).</div>
        </div>
      `,
      inputs: ['A', 'B'],
      outputs: ['SUM', 'CARRY'],
      test: (inp) => ({
        SUM: (inp.A !== inp.B ? 1 : 0),
        CARRY: (inp.A === 1 && inp.B === 1 ? 1 : 0)
      })
    }
  };

  const GATE_DEFINITIONS = {
    AND: {
      name: 'AND',
      inputs: 2,
      calc: (in0, in1) => (in0 === 1 && in1 === 1 ? 1 : 0),
      svg: `<path d="M 10 10 L 28 10 A 15 15 0 0 1 28 40 L 10 40 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
    },
    OR: {
      name: 'OR',
      inputs: 2,
      calc: (in0, in1) => (in0 === 1 || in1 === 1 ? 1 : 0),
      svg: `<path d="M 10 10 Q 24 10 38 25 Q 24 40 10 40 Q 18 25 10 10 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
    },
    NOT: {
      name: 'NOT',
      inputs: 1,
      calc: (in0) => (in0 === 1 ? 0 : 1),
      svg: `<polygon points="10,10 30,25 10,40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="34" cy="25" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/>`
    },
    XOR: {
      name: 'XOR',
      inputs: 2,
      calc: (in0, in1) => (in0 !== in1 ? 1 : 0),
      svg: `<path d="M 6 10 Q 14 25 6 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M 12 10 Q 26 10 40 25 Q 26 40 12 40 Q 20 25 12 10 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
    },
    NAND: {
      name: 'NAND',
      inputs: 2,
      calc: (in0, in1) => (in0 === 1 && in1 === 1 ? 0 : 1),
      svg: `<path d="M 10 10 L 26 10 A 15 15 0 0 1 26 40 L 10 40 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="38" cy="25" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/>`
    },
    NOR: {
      name: 'NOR',
      inputs: 2,
      calc: (in0, in1) => (in0 === 0 && in1 === 0 ? 1 : 0),
      svg: `<path d="M 10 10 Q 24 10 34 25 Q 24 40 10 40 Q 18 25 10 10 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="38" cy="25" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/>`
    }
  };

  // =========================================================================
  // 2. DOM ELEMENTS
  // =========================================================================

  const DOM = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    sunIcon: document.getElementById('sunIcon'),
    moonIcon: document.getElementById('moonIcon'),
    tabButtons: document.querySelectorAll('.view-tab-btn'),
    tabViews: document.querySelectorAll('.tab-view'),

    stage: document.getElementById('breadboardStage'),
    svgOverlay: document.getElementById('wireOverlay'),
    wireCountVal: document.getElementById('wireCountVal'),
    presetSelect: document.getElementById('presetSelect'),
    presetSelectWrapper: document.getElementById('presetSelectWrapper'),
    btnClearBoard: document.getElementById('btnClearBoard'),
    btnAddSwitch: document.getElementById('btnAddSwitch'),
    btnAddLED: document.getElementById('btnAddLED'),

    // Challenges
    challengePills: document.querySelectorAll('.challenge-pill-btn'),
    challengeInfoBox: document.getElementById('challengeInfoBox'),
    challengePrefixBadge: document.getElementById('challengePrefixBadge'),
    challengeTitleText: document.getElementById('challengeTitleText'),
    challengePromptText: document.getElementById('challengePromptText'),
    challengeDetailsBox: document.getElementById('challengeDetailsBox'),
    btnHintFormula: document.getElementById('btnHintFormula'),
    btnHintGoal: document.getElementById('btnHintGoal'),
    challengeHintFormulaBox: document.getElementById('challengeHintFormulaBox'),
    challengeHintGoalBox: document.getElementById('challengeHintGoalBox'),
    challengeLogicFormula: document.getElementById('challengeLogicFormula'),
    challengeCircuitGoalText: document.getElementById('challengeCircuitGoalText'),
    challengeResultBadge: document.getElementById('challengeResultBadge'),
    btnLoadChallengeStarter: document.getElementById('btnLoadChallengeStarter'),

    // Truth Table below breadboard
    truthTableDisplay: document.getElementById('truthTableDisplay')
  };

  // =========================================================================
  // 3. THEME TOGGLE
  // =========================================================================

  function initTheme() {
    function updateIcons(isDark) {
      if (DOM.sunIcon && DOM.moonIcon) {
        DOM.sunIcon.style.display = isDark ? 'block' : 'none';
        DOM.moonIcon.style.display = isDark ? 'none' : 'block';
      }
    }

    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    updateIcons(currentTheme === 'dark');

    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        document.documentElement.classList.toggle('light', !isDark);
        updateIcons(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        localStorage.setItem('gcse_theme', isDark ? 'dark' : 'light');
        renderWires();
      });
    }
  }

  // =========================================================================
  // 4. TAB NAVIGATION
  // =========================================================================

  function initTabs() {
    DOM.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        DOM.tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        DOM.tabViews.forEach(view => {
          view.classList.remove('active');
          if (view.id === `tab-${targetTab}`) {
            view.classList.add('active');
          }
        });

        state.activeTab = targetTab;
        if (targetTab === 'breadboard') {
          renderBoard();
        }
      });
    });
  }

  // =========================================================================
  // 5. BREADBOARD SIMULATION ENGINE
  // =========================================================================

  function createNode(type, options = {}) {
    const id = `node_${nextId++}`;
    const node = {
      id,
      type, // 'switch' | 'gate' | 'led'
      gateType: options.gateType || null,
      label: options.label || (type === 'switch' ? 'SW' : (type === 'led' ? 'LED' : options.gateType)),
      state: options.state || 0,
      x: options.x || 100,
      y: options.y || 100,
      inputs: type === 'gate' ? (options.gateType === 'NOT' ? [0] : [0, 0]) : (type === 'led' ? [0] : []),
      output: options.state || 0
    };
    state.nodes.push(node);
    return node;
  }

  function addWire(fromNodeId, fromPinIndex, toNodeId, toPinIndex) {
    // Remove existing wire to the exact same input pin (single-input principle)
    state.wires = state.wires.filter(w => !(w.toNodeId === toNodeId && w.toPinIndex === toPinIndex));

    const wire = {
      id: `wire_${nextId++}`,
      fromNodeId,
      fromPinIndex,
      toNodeId,
      toPinIndex,
      state: 0
    };
    state.wires.push(wire);
    evaluateCircuit();
    return wire;
  }

  function deleteWire(wireId) {
    state.wires = state.wires.filter(w => w.id !== wireId);
    evaluateCircuit();
  }

  function deleteNode(nodeId) {
    state.nodes = state.nodes.filter(n => n.id !== nodeId);
    state.wires = state.wires.filter(w => w.fromNodeId !== nodeId && w.toNodeId !== nodeId);
    evaluateCircuit();
    renderBoard();
  }

  function evaluateCircuit() {
    // Propagate signals across multiple passes to resolve multi-stage cascade gates
    for (let pass = 0; pass < 8; pass++) {
      // 1. Reset inputs to 0
      state.nodes.forEach(node => {
        if (node.type === 'gate' || node.type === 'led') {
          for (let i = 0; i < node.inputs.length; i++) {
            node.inputs[i] = 0;
          }
        }
      });

      // 2. Propagate values through wires
      state.wires.forEach(wire => {
        const sourceNode = state.nodes.find(n => n.id === wire.fromNodeId);
        const targetNode = state.nodes.find(n => n.id === wire.toNodeId);
        if (sourceNode && targetNode) {
          const val = sourceNode.output || 0;
          wire.state = val;
          if (wire.toPinIndex < targetNode.inputs.length) {
            targetNode.inputs[wire.toPinIndex] = val;
          }
        }
      });

      // 3. Evaluate gate outputs
      state.nodes.forEach(node => {
        if (node.type === 'switch') {
          node.output = node.state;
        } else if (node.type === 'gate') {
          const def = GATE_DEFINITIONS[node.gateType];
          if (def) {
            if (node.gateType === 'NOT') {
              node.output = def.calc(node.inputs[0]);
            } else {
              node.output = def.calc(node.inputs[0], node.inputs[1]);
            }
          }
        } else if (node.type === 'led') {
          node.state = node.inputs[0] || 0;
          node.output = node.state;
        }
      });
    }

    if (DOM.wireCountVal) {
      DOM.wireCountVal.innerText = state.wires.length;
    }

    updateDOMElementStates();
    renderWires();
    renderLiveTruthTable();
    checkActiveChallenge();
  }

  function updateDOMElementStates() {
    state.nodes.forEach(node => {
      const el = document.getElementById(node.id);
      if (!el) return;

      if (node.type === 'switch') {
        const toggleBtn = el.querySelector('.switch-toggle-btn');
        const indicator = el.querySelector('.switch-indicator');
        const valSpan = el.querySelector('.switch-val');
        if (toggleBtn && indicator && valSpan) {
          if (node.state === 1) {
            toggleBtn.classList.add('high');
            indicator.classList.add('high');
            valSpan.innerText = 'HIGH (1)';
          } else {
            toggleBtn.classList.remove('high');
            indicator.classList.remove('high');
            valSpan.innerText = 'LOW (0)';
          }
        }
      } else if (node.type === 'led') {
        const bulb = el.querySelector('.led-bulb');
        const stateText = el.querySelector('.led-state-text');
        if (bulb && stateText) {
          if (node.state === 1) {
            bulb.classList.add('high');
            stateText.innerText = 'ON (1)';
            stateText.style.color = '#10b981';
          } else {
            bulb.classList.remove('high');
            stateText.innerText = 'OFF (0)';
            stateText.style.color = 'var(--ink-secondary)';
          }
        }
      }

      // Output pin indicator
      const outPin = el.querySelector('.pin-output');
      if (outPin) {
        if (node.output === 1) {
          outPin.classList.add('pin-high');
        } else {
          outPin.classList.remove('pin-high');
        }
      }

      // Input pins indicators
      const inPins = el.querySelectorAll('.pin-input');
      inPins.forEach((pin, idx) => {
        const hasWire = state.wires.some(w => w.toNodeId === node.id && w.toPinIndex === idx);
        pin.classList.toggle('pin-connected', hasWire);
        if (node.inputs[idx] === 1) {
          pin.classList.add('pin-high');
        } else {
          pin.classList.remove('pin-high');
        }
      });
    });
  }

  // =========================================================================
  // 6. BOARD RENDERING & INTERACTIVE WIRING
  // =========================================================================

  function renderBoard() {
    if (!DOM.stage) return;

    // Clear existing HTML nodes except SVG overlay
    const existing = DOM.stage.querySelectorAll('.board-node');
    existing.forEach(el => el.remove());

    state.nodes.forEach(node => {
      const el = document.createElement('div');
      el.id = node.id;
      el.className = `board-node ${node.type}-node`;
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;

      if (node.type === 'switch') {
        const switchTitle = node.label.toLowerCase().includes('input') ? node.label : ('Input ' + node.label);
        el.innerHTML = `
          <div class="switch-header">
            <span class="switch-title" title="${switchTitle}">${switchTitle}</span>
            <button type="button" class="gate-delete-btn" title="Delete Switch">&times;</button>
          </div>
          <button type="button" class="switch-toggle-btn ${node.state === 1 ? 'high' : ''}">
            <div class="switch-indicator ${node.state === 1 ? 'high' : ''}"></div>
            <span class="switch-val font-mono">${node.state === 1 ? 'HIGH (1)' : 'LOW (0)'}</span>
          </button>
          <div class="pin pin-output" data-node="${node.id}" data-pin="0" style="top: calc(50% - 6px);" title="Output Pin (Click or drag to wire)"></div>
        `;

        el.querySelector('.switch-toggle-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          node.state = node.state === 1 ? 0 : 1;
          evaluateCircuit();
        });

      } else if (node.type === 'gate') {
        const def = GATE_DEFINITIONS[node.gateType];
        const numInputs = def ? def.inputs : 2;

        let inputPinsHtml = '';
        if (numInputs === 1) {
          inputPinsHtml = `<div class="pin pin-input" data-node="${node.id}" data-pin="0" style="top: calc(50% - 6px);" title="Input Pin (Click or drag to wire)"></div>`;
        } else {
          inputPinsHtml = `
            <div class="pin pin-input" data-node="${node.id}" data-pin="0" style="top: 18px;" title="Input Pin A (Click or drag to wire)"></div>
            <div class="pin pin-input" data-node="${node.id}" data-pin="1" style="top: 48px;" title="Input Pin B (Click or drag to wire)"></div>
          `;
        }

        el.innerHTML = `
          <div class="gate-header">
            <span>${node.gateType}</span>
            <button type="button" class="gate-delete-btn" title="Delete Gate">&times;</button>
          </div>
          <div class="gate-graphic-container">
            <svg width="48" height="48" viewBox="0 0 50 50">
              ${def ? def.svg : ''}
            </svg>
          </div>
          ${inputPinsHtml}
          <div class="pin pin-output" data-node="${node.id}" data-pin="0" style="top: calc(50% - 6px);" title="Output Pin (Click or drag to wire)"></div>
        `;

      } else if (node.type === 'led') {
        const ledTitle = node.label.toLowerCase().includes('output') ? node.label : ('Output ' + node.label);
        el.innerHTML = `
          <div class="led-header">
            <span class="led-title" title="${ledTitle}">${ledTitle}</span>
            <button type="button" class="gate-delete-btn" title="Delete LED">&times;</button>
          </div>
          <div class="led-bulb ${node.state === 1 ? 'high' : ''}"></div>
          <div class="led-state-text font-mono" style="font-size: 11px; font-weight: 700; color: ${node.state === 1 ? '#10b981' : 'var(--ink-secondary)'};">
            ${node.state === 1 ? 'ON (1)' : 'OFF (0)'}
          </div>
          <div class="pin pin-input" data-node="${node.id}" data-pin="0" style="top: calc(50% - 6px);" title="Input Pin (Click or drag to wire)"></div>
        `;
      }

      // Delete listener
      const deleteBtn = el.querySelector('.gate-delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteNode(node.id);
        });
      }

      // Node Dragging
      el.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('pin') || e.target.closest('button')) return;
        state.draggedNode = node;
        const rect = el.getBoundingClientRect();
        state.dragOffset.x = e.clientX - rect.left;
        state.dragOffset.y = e.clientY - rect.top;
        el.classList.add('selected');
      });

      // Pin Listeners (supports both click-to-wire and drag-and-drop wire)
      const pins = el.querySelectorAll('.pin');
      pins.forEach(pin => {
        pin.addEventListener('mousedown', (e) => {
          handlePinDown(pin, e);
        });
      });

      DOM.stage.appendChild(el);
    });

    evaluateCircuit();
  }

  let dragStartPin = null;

  function clearPinGlows() {
    document.querySelectorAll('.pin').forEach(p => {
      p.style.boxShadow = '';
      p.classList.remove('pin-active-glow');
    });
  }

  function setPinGlow(nodeId, pinType, pinIndex) {
    clearPinGlows();
    const nodeEl = document.getElementById(nodeId);
    if (!nodeEl) return;
    const selector = pinType === 'output' ? '.pin-output' : `.pin-input[data-pin="${pinIndex}"]`;
    const pinEl = nodeEl.querySelector(selector);
    if (pinEl) {
      pinEl.classList.add('pin-active-glow');
    }
  }

  function handlePinDown(pinEl, e) {
    e.stopPropagation();
    e.preventDefault();

    const nodeId = pinEl.getAttribute('data-node');
    const pinIndex = parseInt(pinEl.getAttribute('data-pin'), 10);
    const isOutput = pinEl.classList.contains('pin-output');
    const pinType = isOutput ? 'output' : 'input';

    // 1. If an active wire source already exists (clicking the second pin):
    if (state.activeWireSource) {
      const src = state.activeWireSource;

      // Clicked the exact same pin: cancel/toggle off
      if (src.nodeId === nodeId && src.pinIndex === pinIndex && src.pinType === pinType) {
        state.activeWireSource = null;
        clearPinGlows();
        renderWires();
        return;
      }

      // Opposite pin types on different nodes: complete connection!
      if (src.nodeId !== nodeId && src.pinType !== pinType) {
        if (src.pinType === 'output') {
          addWire(src.nodeId, src.pinIndex, nodeId, pinIndex);
        } else {
          addWire(nodeId, pinIndex, src.nodeId, src.pinIndex);
        }
        state.activeWireSource = null;
        clearPinGlows();
        renderWires();
        return;
      }

      // Same pin type on different node: switch active source to this new pin
      state.activeWireSource = { nodeId, pinIndex, pinType };
      setPinGlow(nodeId, pinType, pinIndex);
      renderWires();
      dragStartPin = { nodeId, pinIndex, pinType, startX: e.clientX, startY: e.clientY };
      return;
    }

    // 2. No active wire source yet:
    // If user clicked an input pin that ALREADY has a wire connected: detach it to re-route!
    if (!isOutput) {
      const existingWire = state.wires.find(w => w.toNodeId === nodeId && w.toPinIndex === pinIndex);
      if (existingWire) {
        state.activeWireSource = {
          nodeId: existingWire.fromNodeId,
          pinIndex: existingWire.fromPinIndex,
          pinType: 'output'
        };
        deleteWire(existingWire.id);
        setPinGlow(state.activeWireSource.nodeId, 'output', state.activeWireSource.pinIndex);
        renderWires();
        dragStartPin = {
          nodeId: state.activeWireSource.nodeId,
          pinIndex: state.activeWireSource.pinIndex,
          pinType: 'output',
          startX: e.clientX,
          startY: e.clientY
        };
        return;
      }
    }

    // 3. Start new wire from this pin (whether input or output pin!)
    state.activeWireSource = { nodeId, pinIndex, pinType };
    setPinGlow(nodeId, pinType, pinIndex);
    renderWires();
    dragStartPin = { nodeId, pinIndex, pinType, startX: e.clientX, startY: e.clientY };
  }

  function getPinCoords(nodeId, pinType, pinIndex) {
    const nodeEl = document.getElementById(nodeId);
    if (!nodeEl || !DOM.stage) return { x: 0, y: 0 };

    const selector = pinType === 'output' ? '.pin-output' : `.pin-input[data-pin="${pinIndex}"]`;
    const pinEl = nodeEl.querySelector(selector);
    if (!pinEl) return { x: 0, y: 0 };

    const stageRect = DOM.stage.getBoundingClientRect();
    const pinRect = pinEl.getBoundingClientRect();

    return {
      x: (pinRect.left - stageRect.left) + (pinRect.width / 2),
      y: (pinRect.top - stageRect.top) + (pinRect.height / 2)
    };
  }

  function renderWires() {
    if (!DOM.svgOverlay) return;

    let svgHtml = '';
    const isDark = document.documentElement.classList.contains('dark');
    const colorLow = isDark ? '#475569' : '#94a3b8';
    const colorHigh = '#10b981';

    // 1. Render established wires (with hitboxes for easy cutting/deleting)
    state.wires.forEach(wire => {
      const from = getPinCoords(wire.fromNodeId, 'output', wire.fromPinIndex);
      const to = getPinCoords(wire.toNodeId, 'input', wire.toPinIndex);

      if (from.x === 0 && from.y === 0 || to.x === 0 && to.y === 0) return;

      const dx = Math.abs(to.x - from.x) * 0.5;
      const pathD = `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
      const color = wire.state === 1 ? colorHigh : colorLow;
      const strokeWidth = wire.state === 1 ? 3 : 2;

      svgHtml += `
        <g class="wire-group" data-wire-id="${wire.id}">
          <!-- Invisible thick hitbox for click-to-delete -->
          <path d="${pathD}" fill="none" stroke="transparent" stroke-width="16" class="wire-hitbox">
            <title>Click to cut / delete connection</title>
          </path>
          <!-- Visible wire -->
          <path d="${pathD}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" class="wire-path ${wire.state === 1 ? 'wire-animated' : ''}" />
        </g>
      `;
    });

    // 2. Render dragging wire preview (supports both output-to-input and input-to-output)
    if (state.activeWireSource) {
      const pinType = state.activeWireSource.pinType || 'output';
      const pinCoords = getPinCoords(state.activeWireSource.nodeId, pinType, state.activeWireSource.pinIndex);
      if (pinCoords.x !== 0 && pinCoords.y !== 0) {
        let from, to;
        if (pinType === 'output') {
          from = pinCoords;
          to = state.mousePos;
        } else {
          from = state.mousePos;
          to = pinCoords;
        }
        const dx = Math.abs(to.x - from.x) * 0.5;
        const pathD = `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
        svgHtml += `
          <path d="${pathD}" fill="none" class="wire-drag-preview" />
        `;
      }
    }

    DOM.svgOverlay.innerHTML = svgHtml;

    // Attach click-to-delete listeners to wire hitboxes
    DOM.svgOverlay.querySelectorAll('.wire-hitbox').forEach(hitbox => {
      hitbox.addEventListener('click', (e) => {
        e.stopPropagation();
        const wireGroup = hitbox.closest('.wire-group');
        if (wireGroup) {
          const wireId = wireGroup.getAttribute('data-wire-id');
          deleteWire(wireId);
        }
      });
    });
  }

  // Mousemove for dragging nodes & wire preview
  window.addEventListener('mousemove', (e) => {
    if (DOM.stage) {
      const stageRect = DOM.stage.getBoundingClientRect();
      state.mousePos.x = e.clientX - stageRect.left;
      state.mousePos.y = e.clientY - stageRect.top;

      if (state.activeWireSource) {
        renderWires();
      }

      if (state.draggedNode) {
        let newX = e.clientX - stageRect.left - state.dragOffset.x;
        let newY = e.clientY - stageRect.top - state.dragOffset.y;

        newX = Math.max(10, Math.min(stageRect.width - 120, newX));
        newY = Math.max(10, Math.min(stageRect.height - 80, newY));

        state.draggedNode.x = Math.round(newX);
        state.draggedNode.y = Math.round(newY);

        const el = document.getElementById(state.draggedNode.id);
        if (el) {
          el.style.left = `${state.draggedNode.x}px`;
          el.style.top = `${state.draggedNode.y}px`;
        }
        renderWires();
      }
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (state.draggedNode) {
      const el = document.getElementById(state.draggedNode.id);
      if (el) el.classList.remove('selected');
      state.draggedNode = null;
    }

    if (dragStartPin) {
      const dist = Math.hypot(e.clientX - dragStartPin.startX, e.clientY - dragStartPin.startY);

      if (dist > 8) {
        // Drag gesture: find target element under release point
        const elUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
        const targetPin = elUnderMouse ? elUnderMouse.closest('.pin') : null;

        if (targetPin) {
          const targetNodeId = targetPin.getAttribute('data-node');
          const targetPinIndex = parseInt(targetPin.getAttribute('data-pin'), 10);
          const targetIsOutput = targetPin.classList.contains('pin-output');
          const targetPinType = targetIsOutput ? 'output' : 'input';

          if (targetNodeId !== dragStartPin.nodeId && targetPinType !== dragStartPin.pinType) {
            if (dragStartPin.pinType === 'output') {
              addWire(dragStartPin.nodeId, dragStartPin.pinIndex, targetNodeId, targetPinIndex);
            } else {
              addWire(targetNodeId, targetPinIndex, dragStartPin.nodeId, dragStartPin.pinIndex);
            }
          }
        }

        // Drag ended (whether connected or dropped in empty space)
        state.activeWireSource = null;
        clearPinGlows();
        renderWires();
      } else {
        // Click gesture: leave state.activeWireSource active so user can click target pin!
      }

      dragStartPin = null;
    }
  });

  // Cancel wire creation on Escape or clicking stage background
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.activeWireSource) {
      state.activeWireSource = null;
      clearPinGlows();
      renderWires();
    }
  });

  if (DOM.stage) {
    DOM.stage.addEventListener('mousedown', (e) => {
      if (e.target === DOM.stage || e.target === DOM.svgOverlay) {
        if (state.activeWireSource && !dragStartPin) {
          state.activeWireSource = null;
          clearPinGlows();
          renderWires();
        }
      }
    });
  }

  // =========================================================================
  // 7. PRESET CIRCUITS
  // =========================================================================

  function loadPreset(presetKey) {
    state.nodes = [];
    state.wires = [];
    state.activeWireSource = null;

    if (presetKey === 'exam1') {
      // Example: (A AND B) OR NOT C
      const swA = createNode('switch', { label: 'A', state: 1, x: 40, y: 50 });
      const swB = createNode('switch', { label: 'B', state: 1, x: 40, y: 160 });
      const swC = createNode('switch', { label: 'C', state: 0, x: 40, y: 310 });

      const gateAnd = createNode('gate', { gateType: 'AND', x: 250, y: 90 });
      const gateNot = createNode('gate', { gateType: 'NOT', x: 250, y: 310 });
      const gateOr = createNode('gate', { gateType: 'OR', x: 460, y: 180 });

      const ledQ = createNode('led', { label: 'Q', x: 670, y: 180 });

      addWire(swA.id, 0, gateAnd.id, 0);
      addWire(swB.id, 0, gateAnd.id, 1);
      addWire(swC.id, 0, gateNot.id, 0);
      addWire(gateAnd.id, 0, gateOr.id, 0);
      addWire(gateNot.id, 0, gateOr.id, 1);
      addWire(gateOr.id, 0, ledQ.id, 0);

    } else if (presetKey === 'half_adder') {
      // Sum = A XOR B, Carry = A AND B
      const swA = createNode('switch', { label: 'A', state: 1, x: 50, y: 70 });
      const swB = createNode('switch', { label: 'B', state: 0, x: 50, y: 230 });

      const gateXor = createNode('gate', { gateType: 'XOR', x: 280, y: 70 });
      const gateAnd = createNode('gate', { gateType: 'AND', x: 280, y: 230 });

      const ledSum = createNode('led', { label: 'SUM', x: 560, y: 70 });
      const ledCarry = createNode('led', { label: 'CARRY', x: 560, y: 230 });

      addWire(swA.id, 0, gateXor.id, 0);
      addWire(swB.id, 0, gateXor.id, 1);
      addWire(swA.id, 0, gateAnd.id, 0);
      addWire(swB.id, 0, gateAnd.id, 1);

      addWire(gateXor.id, 0, ledSum.id, 0);
      addWire(gateAnd.id, 0, ledCarry.id, 0);

    } else if (presetKey === 'majority') {
      // Majority Voter: (A AND B) OR (B AND C) OR (A AND C)
      const swA = createNode('switch', { label: 'A', state: 1, x: 40, y: 40 });
      const swB = createNode('switch', { label: 'B', state: 1, x: 40, y: 170 });
      const swC = createNode('switch', { label: 'C', state: 0, x: 40, y: 300 });

      const gAnd1 = createNode('gate', { gateType: 'AND', x: 240, y: 50 });
      const gAnd2 = createNode('gate', { gateType: 'AND', x: 240, y: 170 });
      const gAnd3 = createNode('gate', { gateType: 'AND', x: 240, y: 290 });

      const gOr1 = createNode('gate', { gateType: 'OR', x: 450, y: 100 });
      const gOr2 = createNode('gate', { gateType: 'OR', x: 620, y: 170 });
      const ledQ = createNode('led', { label: 'VOTE', x: 800, y: 170 });

      addWire(swA.id, 0, gAnd1.id, 0);
      addWire(swB.id, 0, gAnd1.id, 1);

      addWire(swB.id, 0, gAnd2.id, 0);
      addWire(swC.id, 0, gAnd2.id, 1);

      addWire(swA.id, 0, gAnd3.id, 0);
      addWire(swC.id, 0, gAnd3.id, 1);

      addWire(gAnd1.id, 0, gOr1.id, 0);
      addWire(gAnd2.id, 0, gOr1.id, 1);

      addWire(gOr1.id, 0, gOr2.id, 0);
      addWire(gAnd3.id, 0, gOr2.id, 1);

      addWire(gOr2.id, 0, ledQ.id, 0);

    } else if (presetKey === 'alarm') {
      // Alarm = (Laser AND Pressure) AND NOT Key
      const swLaser = createNode('switch', { label: 'LASER', state: 1, x: 50, y: 50 });
      const swPressure = createNode('switch', { label: 'PRESSURE', state: 1, x: 50, y: 170 });
      const swKey = createNode('switch', { label: 'KEY', state: 0, x: 50, y: 290 });

      const gateAnd1 = createNode('gate', { gateType: 'AND', x: 260, y: 90 });
      const gateNot = createNode('gate', { gateType: 'NOT', x: 260, y: 290 });
      const gateAnd2 = createNode('gate', { gateType: 'AND', x: 470, y: 170 });
      const ledAlarm = createNode('led', { label: 'ALARM', x: 680, y: 170 });

      addWire(swLaser.id, 0, gateAnd1.id, 0);
      addWire(swPressure.id, 0, gateAnd1.id, 1);
      addWire(swKey.id, 0, gateNot.id, 0);

      addWire(gateAnd1.id, 0, gateAnd2.id, 0);
      addWire(gateNot.id, 0, gateAnd2.id, 1);
      addWire(gateAnd2.id, 0, ledAlarm.id, 0);

    } else if (presetKey === 'xor_nand') {
      // XOR built from 4 NANDs
      const swA = createNode('switch', { label: 'A', state: 1, x: 40, y: 90 });
      const swB = createNode('switch', { label: 'B', state: 0, x: 40, y: 260 });

      const n1 = createNode('gate', { gateType: 'NAND', x: 200, y: 170 });
      const n2 = createNode('gate', { gateType: 'NAND', x: 380, y: 70 });
      const n3 = createNode('gate', { gateType: 'NAND', x: 380, y: 270 });
      const n4 = createNode('gate', { gateType: 'NAND', x: 570, y: 170 });
      const ledQ = createNode('led', { label: 'Q', x: 740, y: 170 });

      addWire(swA.id, 0, n1.id, 0);
      addWire(swB.id, 0, n1.id, 1);

      addWire(swA.id, 0, n2.id, 0);
      addWire(n1.id, 0, n2.id, 1);

      addWire(n1.id, 0, n3.id, 0);
      addWire(swB.id, 0, n3.id, 1);

      addWire(n2.id, 0, n4.id, 0);
      addWire(n3.id, 0, n4.id, 1);

      addWire(n4.id, 0, ledQ.id, 0);

    } else if (presetKey === 'basic_and') {
      const swA = createNode('switch', { label: 'A', state: 1, x: 70, y: 90 });
      const swB = createNode('switch', { label: 'B', state: 1, x: 70, y: 230 });
      const g = createNode('gate', { gateType: 'AND', x: 300, y: 150 });
      const led = createNode('led', { label: 'Q', x: 530, y: 150 });

      addWire(swA.id, 0, g.id, 0);
      addWire(swB.id, 0, g.id, 1);
      addWire(g.id, 0, led.id, 0);

    } else if (presetKey === 'basic_xor') {
      const swA = createNode('switch', { label: 'A', state: 1, x: 70, y: 90 });
      const swB = createNode('switch', { label: 'B', state: 0, x: 70, y: 230 });
      const g = createNode('gate', { gateType: 'XOR', x: 300, y: 150 });
      const led = createNode('led', { label: 'Q', x: 530, y: 150 });

      addWire(swA.id, 0, g.id, 0);
      addWire(swB.id, 0, g.id, 1);
      addWire(g.id, 0, led.id, 0);
    }

    renderBoard();
  }

  // =========================================================================
  // 8. DYNAMIC LIVE TRUTH TABLE (EVALUATING CURRENT BREADBOARD)
  // =========================================================================

  function renderLiveTruthTable() {
    if (!DOM.truthTableDisplay) return;

    // Collect all current switches and LEDs
    const switches = state.nodes.filter(n => n.type === 'switch');
    const leds = state.nodes.filter(n => n.type === 'led');

    if (switches.length === 0 || leds.length === 0) {
      DOM.truthTableDisplay.innerHTML = `
        <tbody>
          <tr>
            <td colspan="4" style="padding: 24px; text-align: center; color: var(--ink-secondary);">
              Connect at least one <strong>Input Switch</strong> and one <strong>Output LED</strong> to generate a live truth table.
            </td>
          </tr>
        </tbody>
      `;
      return;
    }

    // Limit to max 4 switches (16 rows) to keep table scannable
    const activeSwitches = switches.slice(0, 4);
    const totalRows = Math.pow(2, activeSwitches.length);

    // Save actual live switch states
    const originalStates = switches.map(s => s.state);

    // Compute rows
    const rows = [];
    for (let r = 0; r < totalRows; r++) {
      const rowInputs = {};
      activeSwitches.forEach((sw, idx) => {
        const bitPos = activeSwitches.length - 1 - idx;
        const val = (r >> bitPos) & 1;
        sw.state = val;
        rowInputs[sw.label] = val;
      });

      // Quick internal evaluation
      for (let p = 0; p < 8; p++) {
        state.wires.forEach(w => {
          const src = state.nodes.find(n => n.id === w.fromNodeId);
          const tgt = state.nodes.find(n => n.id === w.toNodeId);
          if (src && tgt) {
            tgt.inputs[w.toPinIndex] = (src.type === 'switch' ? src.state : src.output);
          }
        });
        state.nodes.forEach(n => {
          if (n.type === 'gate') {
            const def = GATE_DEFINITIONS[n.gateType];
            if (def) {
              n.output = (n.gateType === 'NOT' ? def.calc(n.inputs[0]) : def.calc(n.inputs[0], n.inputs[1]));
            }
          } else if (n.type === 'led') {
            n.state = n.inputs[0] || 0;
            n.output = n.state;
          }
        });
      }

      const rowOutputs = {};
      leds.forEach(led => {
        rowOutputs[led.label] = led.state || 0;
      });

      rows.push({
        inputs: rowInputs,
        outputs: rowOutputs
      });
    }

    // Restore original live switch states
    switches.forEach((s, idx) => {
      s.state = originalStates[idx];
    });

    // Re-evaluate circuit to restore visual states
    for (let p = 0; p < 8; p++) {
      state.wires.forEach(w => {
        const src = state.nodes.find(n => n.id === w.fromNodeId);
        const tgt = state.nodes.find(n => n.id === w.toNodeId);
        if (src && tgt) {
          tgt.inputs[w.toPinIndex] = (src.type === 'switch' ? src.state : src.output);
        }
      });
      state.nodes.forEach(n => {
        if (n.type === 'switch') n.output = n.state;
        else if (n.type === 'gate') {
          const def = GATE_DEFINITIONS[n.gateType];
          if (def) n.output = (n.gateType === 'NOT' ? def.calc(n.inputs[0]) : def.calc(n.inputs[0], n.inputs[1]));
        } else if (n.type === 'led') {
          n.state = n.inputs[0] || 0;
          n.output = n.state;
        }
      });
    }

    // Render Table Header
    let theadHtml = '<thead><tr>';
    activeSwitches.forEach(sw => {
      const headerTitle = sw.label.toLowerCase().includes('input') ? sw.label : (`INPUT ${sw.label}`);
      theadHtml += `<th>${headerTitle}</th>`;
    });
    leds.forEach(led => {
      const headerTitle = led.label.toLowerCase().includes('output') ? led.label : (`OUTPUT ${led.label}`);
      theadHtml += `<th style="background: rgba(200, 0, 107, 0.08); color: var(--gate-accent);">${headerTitle}</th>`;
    });
    theadHtml += '</tr></thead>';

    // Render Rows with active row highlighting & click-to-test
    let tbodyHtml = '<tbody>';
    rows.forEach((row, rowIdx) => {
      // Check if this row matches the live breadboard switch states
      let isLiveMatch = true;
      activeSwitches.forEach(sw => {
        if (sw.state !== row.inputs[sw.label]) {
          isLiveMatch = false;
        }
      });

      tbodyHtml += `<tr class="${isLiveMatch ? 'active-row' : ''}" data-row-index="${rowIdx}" style="cursor: pointer;" title="Click to test this input combination">`;
      activeSwitches.forEach(sw => {
        tbodyHtml += `<td><strong>${row.inputs[sw.label]}</strong></td>`;
      });
      leds.forEach(led => {
        const val = row.outputs[led.label];
        tbodyHtml += `<td style="color: ${val === 1 ? '#10b981' : 'var(--ink-secondary)'}; font-weight: 800;">${val}</td>`;
      });
      tbodyHtml += '</tr>';
    });
    tbodyHtml += '</tbody>';

    DOM.truthTableDisplay.innerHTML = theadHtml + tbodyHtml;

    // Attach click listener to table rows to immediately set breadboard switch states
    DOM.truthTableDisplay.querySelectorAll('tbody tr').forEach(tr => {
      tr.addEventListener('click', () => {
        const rowIdx = parseInt(tr.getAttribute('data-row-index'), 10);
        const row = rows[rowIdx];
        if (row) {
          activeSwitches.forEach(sw => {
            sw.state = row.inputs[sw.label];
          });
          evaluateCircuit();
        }
      });
    });
  }

  // =========================================================================
  // 9. INTEGRATED CHALLENGE EVALUATOR
  // =========================================================================

  function selectChallenge(challengeId) {
    state.activeChallenge = challengeId;
    const ch = CHALLENGES[challengeId];

    DOM.challengePills.forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-challenge') === challengeId);
    });

    if (challengeId === 'free' || !ch) {
      if (DOM.presetSelectWrapper) DOM.presetSelectWrapper.style.display = 'inline-flex';
      if (DOM.challengeInfoBox) DOM.challengeInfoBox.style.display = 'none';
      if (DOM.challengeResultBadge) DOM.challengeResultBadge.style.display = 'none';
      return;
    }

    // Hide presets toolbar group when a challenge is active
    if (DOM.presetSelectWrapper) DOM.presetSelectWrapper.style.display = 'none';

    if (DOM.challengeInfoBox) DOM.challengeInfoBox.style.display = 'flex';
    if (DOM.challengeResultBadge) DOM.challengeResultBadge.style.display = 'inline-flex';
    if (DOM.challengePrefixBadge) {
      DOM.challengePrefixBadge.innerText = ch.number ? `CHALLENGE ${ch.number}:` : 'CHALLENGE:';
    }
    if (DOM.challengeTitleText) DOM.challengeTitleText.innerText = ch.name;
    if (DOM.challengePromptText) DOM.challengePromptText.innerText = ch.desc;
    if (DOM.challengeDetailsBox) {
      DOM.challengeDetailsBox.innerHTML = ch.detailsHtml || '';
      DOM.challengeDetailsBox.style.display = ch.detailsHtml ? 'block' : 'none';
    }

    // Reset hints on challenge selection
    if (DOM.challengeHintFormulaBox) DOM.challengeHintFormulaBox.style.display = 'none';
    if (DOM.challengeHintGoalBox) DOM.challengeHintGoalBox.style.display = 'none';
    if (DOM.btnHintFormula) DOM.btnHintFormula.classList.remove('active');
    if (DOM.btnHintGoal) DOM.btnHintGoal.classList.remove('active');

    if (DOM.challengeLogicFormula) DOM.challengeLogicFormula.innerText = ch.formula || '';
    if (DOM.challengeCircuitGoalText) DOM.challengeCircuitGoalText.innerText = ch.goal || '';

    // Automatically reset breadboard with this challenge's starter components
    loadChallengeStarter(challengeId);
  }

  function loadChallengeStarter(challengeId) {
    state.nodes = [];
    state.wires = [];
    state.activeWireSource = null;
    state.challengeCompleted = false;

    if (challengeId === 'greenhouse') {
      createNode('switch', { label: 'Hot (Input A)', state: 0, x: 50, y: 70 });
      createNode('switch', { label: 'Dry (Input B)', state: 0, x: 50, y: 180 });
      createNode('switch', { label: 'Override (Input C)', state: 0, x: 50, y: 290 });
      createNode('led', { label: 'Vent', x: 650, y: 180 });
    } else if (challengeId === 'vault') {
      createNode('switch', { label: 'Laser (Input A)', state: 0, x: 50, y: 70 });
      createNode('switch', { label: 'Pressure (Input B)', state: 0, x: 50, y: 180 });
      createNode('switch', { label: 'Key (Input C)', state: 0, x: 50, y: 290 });
      createNode('led', { label: 'Alarm', x: 650, y: 180 });
    } else if (challengeId === 'adder') {
      createNode('switch', { label: 'Bit A (Input A)', state: 0, x: 50, y: 90 });
      createNode('switch', { label: 'Bit B (Input B)', state: 0, x: 50, y: 240 });
      createNode('led', { label: 'SUM', x: 650, y: 90 });
      createNode('led', { label: 'CARRY', x: 650, y: 240 });
    } else if (challengeId === 'staircase') {
      createNode('switch', { label: 'Upstairs (Input A)', state: 0, x: 60, y: 100 });
      createNode('switch', { label: 'Downstairs (Input B)', state: 0, x: 60, y: 240 });
      createNode('led', { label: 'Light', x: 650, y: 170 });
    }

    renderBoard();
  }

  function checkActiveChallenge() {
    if (state.activeChallenge === 'free') return;
    const ch = CHALLENGES[state.activeChallenge];
    if (!ch || !ch.test) return;

    const switches = state.nodes.filter(n => n.type === 'switch');
    const leds = state.nodes.filter(n => n.type === 'led');

    // Need appropriate switches
    if (switches.length < ch.inputs.length || leds.length < ch.outputs.length) {
      if (DOM.challengeResultBadge) {
        DOM.challengeResultBadge.className = 'challenge-result-chip fail';
        DOM.challengeResultBadge.innerText = `Add inputs & outputs`;
      }
      return;
    }

    const totalCases = Math.pow(2, ch.inputs.length);
    let passedCases = 0;
    const origStates = switches.map(s => s.state);

    for (let r = 0; r < totalCases; r++) {
      const inpMap = {};
      ch.inputs.forEach((key, idx) => {
        const sw = switches.find(s => {
          const l = s.label.toUpperCase();
          const k = key.toUpperCase();
          return l === k || l.includes(`INPUT ${k}`) || l.includes(`(${k})`) || l.endsWith(` ${k}`);
        }) || switches[idx];

        const val = (r >> (ch.inputs.length - 1 - idx)) & 1;
        if (sw) sw.state = val;
        inpMap[key] = val;
      });

      // Quick evaluate
      for (let p = 0; p < 8; p++) {
        state.wires.forEach(w => {
          const src = state.nodes.find(n => n.id === w.fromNodeId);
          const tgt = state.nodes.find(n => n.id === w.toNodeId);
          if (src && tgt) tgt.inputs[w.toPinIndex] = (src.type === 'switch' ? src.state : src.output);
        });
        state.nodes.forEach(n => {
          if (n.type === 'gate') {
            const def = GATE_DEFINITIONS[n.gateType];
            if (def) n.output = (n.gateType === 'NOT' ? def.calc(n.inputs[0]) : def.calc(n.inputs[0], n.inputs[1]));
          } else if (n.type === 'led') {
            n.state = n.inputs[0] || 0;
            n.output = n.state;
          }
        });
      }

      const expected = ch.test(inpMap);
      let match = true;

      if (typeof expected === 'object') {
        Object.keys(expected).forEach(outLabel => {
          const targetLed = leds.find(l => l.label.toUpperCase().includes(outLabel.toUpperCase()));
          if (!targetLed || targetLed.state !== expected[outLabel]) {
            match = false;
          }
        });
      } else {
        const primaryLed = leds.find(l => l.label.toUpperCase().includes(ch.outputs[0].toUpperCase())) || leds[0];
        if (!primaryLed || primaryLed.state !== expected) {
          match = false;
        }
      }

      if (match) passedCases++;
    }

    // Restore switches
    switches.forEach((s, idx) => {
      s.state = origStates[idx];
    });

    // Re-evaluate circuit to restore visuals to live user inputs
    for (let p = 0; p < 8; p++) {
      state.wires.forEach(w => {
        const src = state.nodes.find(n => n.id === w.fromNodeId);
        const tgt = state.nodes.find(n => n.id === w.toNodeId);
        if (src && tgt) tgt.inputs[w.toPinIndex] = (src.type === 'switch' ? src.state : src.output);
      });
      state.nodes.forEach(n => {
        if (n.type === 'switch') n.output = n.state;
        else if (n.type === 'gate') {
          const def = GATE_DEFINITIONS[n.gateType];
          if (def) n.output = (n.gateType === 'NOT' ? def.calc(n.inputs[0]) : def.calc(n.inputs[0], n.inputs[1]));
        } else if (n.type === 'led') {
          n.state = n.inputs[0] || 0;
          n.output = n.state;
        }
      });
    }
    updateDOMElementStates();

    if (DOM.challengeResultBadge) {
      if (passedCases === totalCases && state.wires.length > 0) {
        DOM.challengeResultBadge.className = 'challenge-result-chip pass';
        DOM.challengeResultBadge.innerText = `${passedCases} / ${totalCases} Passed ✓`;

        // Trigger confetti burst & victory sound once per completion
        if (!state.challengeCompleted) {
          state.challengeCompleted = true;
          triggerSuccessCelebration();
        }
      } else {
        DOM.challengeResultBadge.className = 'challenge-result-chip fail';
        DOM.challengeResultBadge.innerText = `${passedCases} / ${totalCases} Cases Passed`;
        state.challengeCompleted = false;
      }
    }
  }

  // Celebratory Audio & Confetti
  let audioCtx = null;
  function playVictorySound() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const now = audioCtx.currentTime;
      // High-register celebratory arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1047Hz)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (idx * 0.09));

        gain.gain.setValueAtTime(0.0001, now + (idx * 0.09));
        gain.gain.linearRampToValueAtTime(0.18, now + (idx * 0.09) + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx * 0.09) + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + (idx * 0.09));
        osc.stop(now + (idx * 0.09) + 0.4);
      });
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  function triggerSuccessCelebration() {
    // 1. Play procedural musical chime
    playVictorySound();

    // 2. Launch colorful confetti burst
    try {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (e) {}
  }

  // =========================================================================
  // 10. INITIALIZATION
  // =========================================================================

  function init() {
    initTheme();
    initTabs();

    // Preset selector
    if (DOM.presetSelect) {
      DOM.presetSelect.addEventListener('change', (e) => {
        loadPreset(e.target.value);
      });
    }

    // Clear board
    if (DOM.btnClearBoard) {
      DOM.btnClearBoard.addEventListener('click', () => {
        state.nodes = [];
        state.wires = [];
        state.activeWireSource = null;
        renderBoard();
      });
    }

    // Add buttons (+ Input / + Output)
    if (DOM.btnAddSwitch) {
      DOM.btnAddSwitch.addEventListener('click', () => {
        const switchCount = state.nodes.filter(n => n.type === 'switch').length;
        const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
        const label = labels[switchCount % labels.length];
        createNode('switch', { label, x: 50, y: 50 + (switchCount * 85) });
        renderBoard();
      });
    }

    if (DOM.btnAddLED) {
      DOM.btnAddLED.addEventListener('click', () => {
        const ledCount = state.nodes.filter(n => n.type === 'led').length;
        const label = ledCount === 0 ? 'Q' : `Q${ledCount + 1}`;
        createNode('led', { label, x: 670, y: 70 + (ledCount * 90) });
        renderBoard();
      });
    }

    // Add gate buttons
    document.querySelectorAll('[data-add-gate]').forEach(btn => {
      btn.addEventListener('click', () => {
        const gateType = btn.getAttribute('data-add-gate');
        const gateCount = state.nodes.filter(n => n.type === 'gate').length;
        createNode('gate', { gateType, x: 250 + (gateCount * 35), y: 100 + (gateCount * 40) });
        renderBoard();
      });
    });

    // Challenge selector pills
    DOM.challengePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const chId = pill.getAttribute('data-challenge');
        selectChallenge(chId);
      });
    });

    if (DOM.btnLoadChallengeStarter) {
      DOM.btnLoadChallengeStarter.addEventListener('click', () => {
        loadChallengeStarter(state.activeChallenge);
      });
    }

    // Hint buttons
    if (DOM.btnHintFormula) {
      DOM.btnHintFormula.addEventListener('click', () => {
        if (!DOM.challengeHintFormulaBox) return;
        const isVisible = DOM.challengeHintFormulaBox.style.display !== 'none';
        DOM.challengeHintFormulaBox.style.display = isVisible ? 'none' : 'block';
        DOM.btnHintFormula.classList.toggle('active', !isVisible);
      });
    }

    if (DOM.btnHintGoal) {
      DOM.btnHintGoal.addEventListener('click', () => {
        if (!DOM.challengeHintGoalBox) return;
        const isVisible = DOM.challengeHintGoalBox.style.display !== 'none';
        DOM.challengeHintGoalBox.style.display = isVisible ? 'none' : 'block';
        DOM.btnHintGoal.classList.toggle('active', !isVisible);
      });
    }

    // Initial load: Example circuit
    loadPreset('exam1');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
