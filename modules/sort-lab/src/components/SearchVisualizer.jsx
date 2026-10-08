import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';

const INITIAL_ARRAY = [4, 9, 14, 18, 23, 29, 35, 42, 48, 55, 61, 68, 74, 82, 91, 99];

export default function SearchVisualizer({
  audioMode = 'clicks',
}) {
  const [currentArray, setCurrentArray] = useState(INITIAL_ARRAY);
  const [target, setTarget] = useState(74);
  const [mode, setMode] = useState('binary'); // 'binary' | 'linear' | 'duel'
  const [stepIndex, setStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Playback timer ref
  const autoTimerRef = useRef(null);
  const confettiTriggeredRef = useRef(false);

  const triggerConfetti = useCallback(() => {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.62 },
        colors: ['#1e3a5f', '#1a6b3c', '#b45309', '#0284c7', '#10b981', '#f59e0b'],
      });
    }
  }, []);

  // Binary Search Step Generator
  const generateBinarySteps = useCallback((arr, tgt) => {
    const stepList = [];
    let low = 0;
    let high = arr.length - 1;
    let comparisons = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      comparisons++;
      const midVal = arr[mid];

      if (midVal === tgt) {
        stepList.push({
          low,
          high,
          mid,
          comparisons,
          status: 'found',
          msg: `Match found at index ${mid}! Value ${midVal} equals target ${tgt}. Search complete in just ${comparisons} check${comparisons > 1 ? 's' : ''}!`,
          formula: `Mid = ⌊(${low} + ${high}) / 2⌋ = ${mid} [MATCH FOUND ✓]`,
        });
        return stepList;
      } else if (midVal > tgt) {
        stepList.push({
          low,
          high,
          mid,
          comparisons,
          status: 'too_high',
          msg: `Middle card ${midVal} (index ${mid}) is too big. Discarding everything from index ${mid} upwards!`,
          formula: `Mid = ⌊(${low} + ${high}) / 2⌋ = ${mid} [${midVal} > ${tgt} ➔ High becomes ${mid - 1}]`,
        });
        high = mid - 1;
      } else {
        stepList.push({
          low,
          high,
          mid,
          comparisons,
          status: 'too_low',
          msg: `Middle card ${midVal} (index ${mid}) is too small. Discarding everything from index ${mid} downwards!`,
          formula: `Mid = ⌊(${low} + ${high}) / 2⌋ = ${mid} [${midVal} < ${tgt} ➔ Low becomes ${mid + 1}]`,
        });
        low = mid + 1;
      }
    }

    stepList.push({
      low,
      high,
      mid: -1,
      comparisons,
      status: 'not_found',
      msg: `Target ${tgt} not found! Low passed High without finding a match.`,
      formula: `Low (${low}) > High (${high}) ➔ Return -1 [NOT FOUND]`,
    });
    return stepList;
  }, []);

  // Linear Search Step Generator
  const generateLinearSteps = useCallback((arr, tgt) => {
    const stepList = [];
    let comparisons = 0;

    for (let i = 0; i < arr.length; i++) {
      comparisons++;
      const val = arr[i];

      if (val === tgt) {
        stepList.push({
          currentIndex: i,
          comparisons,
          status: 'found',
          msg: `Match found at index ${i}! Card ${val} equals target ${tgt} after ${comparisons} sequential checks.`,
          formula: `arr[${i}] == ${tgt} [MATCH FOUND ✓]`,
        });
        return stepList;
      } else {
        stepList.push({
          currentIndex: i,
          comparisons,
          status: 'mismatch',
          msg: `Checking index ${i}: Card is ${val} ≠ ${tgt}. Moving forward one card...`,
          formula: `arr[${i}] (${val}) != ${tgt} ➔ Increment index to ${i + 1}`,
        });
      }
    }

    stepList.push({
      currentIndex: arr.length,
      comparisons,
      status: 'not_found',
      msg: `Reached the end of the entire list. Target ${tgt} was not found after ${comparisons} checks!`,
      formula: `Checked 0..${arr.length - 1} ➔ Return -1`,
    });
    return stepList;
  }, []);

  // Steps for currently loaded state
  const binarySteps = React.useMemo(() => generateBinarySteps(currentArray, target), [currentArray, target, generateBinarySteps]);
  const linearSteps = React.useMemo(() => generateLinearSteps(currentArray, target), [currentArray, target, generateLinearSteps]);

  const activeSteps = mode === 'binary' ? binarySteps : linearSteps;
  const duelMaxSteps = Math.max(binarySteps.length, linearSteps.length);
  const totalSteps = mode === 'duel' ? duelMaxSteps : activeSteps.length;

  // Sound triggering on step change
  useEffect(() => {
    if (audioMode === 'muted' || audioMode === 'off' || stepIndex === 0) return;

    if (mode === 'binary' && binarySteps[stepIndex - 1]) {
      const step = binarySteps[stepIndex - 1];
      if (step.status === 'found') {
        soundManager.playTone(0.9, 'match');
      } else {
        soundManager.playTone(0.5, 'compare');
      }
    } else if (mode === 'linear' && linearSteps[stepIndex - 1]) {
      const step = linearSteps[stepIndex - 1];
      if (step.status === 'found') {
        soundManager.playTone(0.9, 'match');
      } else {
        soundManager.playTone(0.4, 'compare');
      }
    } else if (mode === 'duel') {
      const bStep = binarySteps[Math.min(stepIndex - 1, binarySteps.length - 1)];
      const lStep = linearSteps[Math.min(stepIndex - 1, linearSteps.length - 1)];
      if (bStep?.status === 'found' || lStep?.status === 'found') {
        soundManager.playTone(0.9, 'match');
      } else {
        soundManager.playTone(0.5, 'compare');
      }
    }
  }, [stepIndex, mode, binarySteps, linearSteps, audioMode]);

  // Check for confetti trigger
  useEffect(() => {
    if (stepIndex === 0) {
      confettiTriggeredRef.current = false;
      return;
    }

    if (confettiTriggeredRef.current) return;

    if (mode === 'binary' && binarySteps[stepIndex - 1]?.status === 'found') {
      confettiTriggeredRef.current = true;
      triggerConfetti();
    } else if (mode === 'linear' && linearSteps[stepIndex - 1]?.status === 'found') {
      confettiTriggeredRef.current = true;
      triggerConfetti();
    } else if (mode === 'duel') {
      const bFound = binarySteps[Math.min(stepIndex - 1, binarySteps.length - 1)]?.status === 'found';
      const lFound = linearSteps[Math.min(stepIndex - 1, linearSteps.length - 1)]?.status === 'found';
      if (bFound || lFound) {
        confettiTriggeredRef.current = true;
        triggerConfetti();
      }
    }
  }, [stepIndex, mode, binarySteps, linearSteps, triggerConfetti]);

  // Auto-play interval
  useEffect(() => {
    if (!isAutoPlaying) {
      clearInterval(autoTimerRef.current);
      return;
    }

    autoTimerRef.current = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= totalSteps) {
          setIsAutoPlaying(false);
          clearInterval(autoTimerRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 700);

    return () => clearInterval(autoTimerRef.current);
  }, [isAutoPlaying, totalSteps]);

  // Handlers
  const handleNextStep = () => {
    if (stepIndex < totalSteps) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setIsAutoPlaying(false);
    clearInterval(autoTimerRef.current);
    setStepIndex(0);
    confettiTriggeredRef.current = false;
  };

  const handleToggleAutoPlay = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
    } else {
      if (stepIndex >= totalSteps) {
        setStepIndex(0);
      }
      setIsAutoPlaying(true);
    }
  };

  const handleNewNumbers = () => {
    handleReset();
    const set = new Set();
    while (set.size < 16) {
      set.add(Math.floor(Math.random() * 95) + 3);
    }
    const arr = Array.from(set).sort((a, b) => a - b);
    setCurrentArray(arr);
    const newTarget = arr[Math.floor(arr.length * 0.75)] || arr[0];
    setTarget(newTarget);
  };

  const handleSortList = () => {
    handleReset();
    const sorted = [...currentArray].sort((a, b) => a - b);
    setCurrentArray(sorted);
  };

  const handleScrambleList = () => {
    handleReset();
    const scrambled = [...currentArray];
    for (let i = scrambled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
    }
    setCurrentArray(scrambled);
  };

  // Render single shelf card helper
  const getSingleCardClass = (idx, val) => {
    if (stepIndex === 0) return 'shelf-card';
    const currentStep = activeSteps[stepIndex - 1];
    if (!currentStep) return 'shelf-card';

    if (mode === 'binary') {
      if (currentStep.status === 'found' && idx === currentStep.mid) {
        return 'shelf-card is-match';
      }
      if (idx < currentStep.low || idx > currentStep.high) {
        return 'shelf-card is-discarded';
      }
      if (idx === currentStep.mid) {
        return 'shelf-card is-mid';
      }
      if (idx === currentStep.low) {
        return 'shelf-card is-low';
      }
      if (idx === currentStep.high) {
        return 'shelf-card is-high';
      }
      return 'shelf-card';
    } else {
      // Linear search
      if (currentStep.status === 'found' && idx === currentStep.currentIndex) {
        return 'shelf-card is-match';
      }
      if (idx < currentStep.currentIndex) {
        return 'shelf-card is-discarded';
      }
      if (idx === currentStep.currentIndex) {
        return currentStep.status === 'found' ? 'shelf-card is-match' : 'shelf-card is-mid';
      }
      return 'shelf-card';
    }
  };

  const getSingleCardMarker = (idx) => {
    if (stepIndex === 0) return '';
    const currentStep = activeSteps[stepIndex - 1];
    if (!currentStep) return '';

    if (mode === 'binary') {
      if (currentStep.status === 'found' && idx === currentStep.mid) return 'MATCH';
      if (idx === currentStep.mid) return 'MID';
      if (idx === currentStep.low) return 'LOW';
      if (idx === currentStep.high) return 'HIGH';
      return '';
    } else {
      if (currentStep.status === 'found' && idx === currentStep.currentIndex) return 'MATCH';
      if (idx === currentStep.currentIndex) return 'CHECK';
      return '';
    }
  };

  // Narrative text & formula calculation
  const currentStep = stepIndex > 0 ? activeSteps[stepIndex - 1] : null;
  const narrativeText = currentStep
    ? currentStep.msg
    : `Target: ${target}. Click Next Step to begin the search.`;
  const formulaText = currentStep
    ? currentStep.formula
    : mode === 'binary'
    ? 'Mid = ⌊(0 + 15) / 2⌋ = 7'
    : 'arr[0] == Target';

  // Duel Track helpers
  const getDuelCardClass = (idx, algo) => {
    if (stepIndex === 0) return 'shelf-card';
    const sList = algo === 'binary' ? binarySteps : linearSteps;
    const sIdx = Math.min(stepIndex - 1, sList.length - 1);
    const st = sList[sIdx];
    if (!st) return 'shelf-card';

    if (algo === 'binary') {
      if (st.status === 'found' && idx === st.mid) return 'shelf-card is-match';
      if (idx < st.low || idx > st.high) return 'shelf-card is-discarded';
      if (idx === st.mid) return 'shelf-card is-mid';
      return 'shelf-card';
    } else {
      if (st.status === 'found' && idx === st.currentIndex) return 'shelf-card is-match';
      if (idx < st.currentIndex) return 'shelf-card is-discarded';
      if (idx === st.currentIndex) return 'shelf-card is-mid';
      return 'shelf-card';
    }
  };

  const duelBinaryCurrent = stepIndex > 0 ? binarySteps[Math.min(stepIndex - 1, binarySteps.length - 1)] : null;
  const duelLinearCurrent = stepIndex > 0 ? linearSteps[Math.min(stepIndex - 1, linearSteps.length - 1)] : null;
  const duelBinaryChecks = duelBinaryCurrent ? duelBinaryCurrent.comparisons : 0;
  const duelLinearChecks = duelLinearCurrent ? duelLinearCurrent.comparisons : 0;

  return (
    <div className="editorial-container py-4">
      {/* 1. CLEAN UNBOXED HEADER */}
      <div className="view-banner mb-3">
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#1e2229] dark:text-[#f3f4f6]">
          Searching Algorithms: <span className="text-[#c8006b]">Linear vs Binary Search</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] dark:text-[#9ca3af] mt-1">
          Searching algorithms locate specific target items in lists. Linear search checks every element sequentially on any list, whereas binary search requires a sorted list and repeatedly halves the search space for dramatically faster results.
        </p>
      </div>

      {/* 2. SELF-CONTAINED APPLICATION WORKBENCH */}
      <div className="workbench-chassis">
        
        {/* TOP COMMAND BAR */}
        <div className="workbench-command-bar">
          {/* Algorithm Mode Switcher */}
          <div className="algo-selector-group">
            <button
              className={`algo-tab-btn ${mode === 'binary' ? 'active' : ''}`}
              onClick={() => { setMode('binary'); handleReset(); }}
            >
              Binary Search (Divide &amp; Conquer)
            </button>
            <button
              className={`algo-tab-btn ${mode === 'linear' ? 'active' : ''}`}
              onClick={() => { setMode('linear'); handleReset(); }}
            >
              Linear Search (Sequential)
            </button>
            <button
              className={`algo-tab-btn ${mode === 'duel' ? 'active' : ''}`}
              onClick={() => { setMode('duel'); handleReset(); }}
            >
              Head-to-Head Duel
            </button>
          </div>

          {/* Target & Array Controls */}
          <div className="workbench-tools-group">
            <span className="tool-inline-label">Target:</span>
            <select
              value={target}
              onChange={(e) => {
                setTarget(Number(e.target.value));
                handleReset();
              }}
              className="target-select"
            >
              {currentArray.map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
              <option value={999}>999 (Not in list)</option>
            </select>

            <button onClick={handleNewNumbers} className="tool-btn" title="Generate fresh numbers">
              ↺ New Numbers
            </button>
            <button onClick={handleSortList} className="tool-btn success" title="Restore sorted order">
              ⇈ Sort List
            </button>
            <button onClick={handleScrambleList} className="tool-btn warning" title="Scramble order to test search failure">
              ⇄ Scramble (Unsort)
            </button>
          </div>
        </div>

        {/* WORKBENCH ARENA */}
        <div className="workbench-arena">
          
          {/* SINGLE ALGORITHM MODE */}
          {mode !== 'duel' && (
            <div>
              <div className="stage-hud">
                <div className="hud-title-col">
                  <span className="hud-algo-name">
                    {mode === 'binary' ? 'Binary Search (Divide & Conquer)' : 'Linear Search (Sequential Check)'}
                  </span>
                  <span className="hud-algo-desc">
                    {mode === 'binary'
                      ? 'Requires a sorted list. Checks the middle, then discards the wrong half.'
                      : 'Works on any list. Inspects items one-by-one from the start.'}
                  </span>
                </div>

                <div className="hud-stats-cluster">
                  <span className="stat-badge">List Size: <strong>16 items</strong></span>
                  <span className="stat-badge">
                    Checks: <strong>{currentStep ? currentStep.comparisons : 0}</strong>
                  </span>
                  <span className="stat-badge">
                    Worst Case: <strong>{mode === 'binary' ? '4 checks [log₂ 16]' : '16 checks [N]'}</strong>
                  </span>
                </div>
              </div>

              {/* CARD SHELF */}
              <div className="card-shelf-container">
                <div className="shelf-track">
                  {currentArray.map((val, idx) => (
                    <div
                      key={idx}
                      className={getSingleCardClass(idx, val)}
                      onClick={() => {
                        setTarget(val);
                        handleReset();
                      }}
                      title={`Click to set target to ${val}`}
                    >
                      <div className="card-index">{idx}</div>
                      <div className="card-value">{val}</div>
                      <div className="card-marker-slot">{getSingleCardMarker(idx)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DUAL HEAD-TO-HEAD DUEL MODE */}
          {mode === 'duel' && (
            <div className="duel-arena">
              {/* Track 1: Binary */}
              <div className="duel-track-card">
                <div className="duel-track-header">
                  <span style={{ color: 'var(--oxford-navy)' }}>Binary Search (Halving Strategy)</span>
                  <span className="duel-track-score">
                    Checks: {duelBinaryChecks} {duelBinaryCurrent?.status === 'found' ? '✓ FOUND!' : ''}
                  </span>
                </div>
                <div className="shelf-track">
                  {currentArray.map((val, idx) => (
                    <div key={idx} className={getDuelCardClass(idx, 'binary')}>
                      <div className="card-index">{idx}</div>
                      <div className="card-value">{val}</div>
                      <div className="card-marker-slot">
                        {duelBinaryCurrent?.mid === idx ? 'MID' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Track 2: Linear */}
              <div className="duel-track-card">
                <div className="duel-track-header">
                  <span style={{ color: 'var(--oxford-navy)' }}>Linear Search (Sequential Step-by-Step)</span>
                  <span className="duel-track-score">
                    Checks: {duelLinearChecks} {duelLinearCurrent?.status === 'found' ? '✓ FOUND!' : ''}
                  </span>
                </div>
                <div className="shelf-track">
                  {currentArray.map((val, idx) => (
                    <div key={idx} className={getDuelCardClass(idx, 'linear')}>
                      <div className="card-index">{idx}</div>
                      <div className="card-value">{val}</div>
                      <div className="card-marker-slot">
                        {duelLinearCurrent?.currentIndex === idx ? 'CHECK' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoreboard Banner */}
              <div className="duel-scoreboard-banner">
                <span>
                  <strong>Head-to-Head Race:</strong> Tap <strong>Next Step</strong> to run both algorithms simultaneously against the same list.
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  Binary: {duelBinaryChecks} vs Linear: {duelLinearChecks}
                </span>
              </div>
            </div>
          )}

          {/* NARRATIVE STRIP */}
          <div className={`narrative-strip ${currentStep?.status === 'found' ? 'matched' : ''}`}>
            <div className="narrative-text">
              {narrativeText}
            </div>
            <div className="formula-tag">{formulaText}</div>
          </div>

        </div>

        {/* WORKBENCH PLAYBACK TOOLBAR */}
        <div className="workbench-playback-bar">
          <div className="btn-cluster">
            <button
              className="action-btn primary"
              onClick={handleNextStep}
              disabled={stepIndex >= totalSteps}
            >
              Next Step &rarr;
            </button>
            <button
              className="action-btn"
              onClick={handleToggleAutoPlay}
            >
              {isAutoPlaying ? 'Pause' : 'Auto Play'}
            </button>
            <button className="action-btn" onClick={handleReset}>
              Reset
            </button>
          </div>

          <div className="step-counter-label">
            {stepIndex === 0
              ? `Ready • 0 of ${totalSteps} steps`
              : stepIndex >= totalSteps
              ? `Complete • ${totalSteps} of ${totalSteps} steps`
              : `Step ${stepIndex} of ${totalSteps}`}
          </div>
        </div>

      </div>

      {/* 3. CGP REVISION SUMMARY DECK (PARAGRAPH + BULLET POINTS) */}
      <div className="cgp-revision-deck">
        
        {/* Binary Search Card */}
        <div className="cgp-note-card">
          <div className="cgp-note-header">
            <span>Binary Search</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>O(log₂ N)</span>
          </div>
          <p className="cgp-intro-para">
            Binary Search is a fast algorithm for finding an item in a <strong>SORTED</strong> list. Instead of checking every item one by one from the start, it jumps straight to the middle item. If the target is smaller, it throws away the entire right half of the list; if larger, it throws away the entire left half. Then it repeats until it finds the target.
          </p>
          <ul className="cgp-bullet-list">
            <li>Data <strong>must be sorted</strong> beforehand. It does not work on random lists.</li>
            <li><strong>Efficiency:</strong> Extremely fast on big datasets. Doubling the list size only adds 1 extra check!</li>
            <li><strong>Worst case:</strong> Searching 1,000 items takes at most <strong>10 checks</strong> (2¹⁰ ≈ 1,000).</li>
          </ul>
          <div className="cgp-exam-tip-box">
            <strong>Exam Rule:</strong> If an exam question asks you to search an unsorted list using Binary Search, the answer is: <em>you can't &mdash; you must sort it first or use Linear Search!</em>
          </div>
        </div>

        {/* Linear Search Card */}
        <div className="cgp-note-card">
          <div className="cgp-note-header">
            <span>Linear Search</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>O(N)</span>
          </div>
          <p className="cgp-intro-para">
            Linear Search is a straightforward algorithm that starts at the very beginning of a list and checks every single item one by one in order until it either finds the target or runs out of items. It doesn't need the list to be in any special order, but it gets painfully slow on large datasets.
          </p>
          <ul className="cgp-bullet-list">
            <li>Works on <strong>any list</strong> &mdash; even completely unsorted, messy data.</li>
            <li><strong>Efficiency:</strong> Inefficient on big datasets. Every extra item means one more possible check.</li>
            <li><strong>Worst case:</strong> Searching 1,000 items might take all <strong>1,000 checks</strong>.</li>
          </ul>
          <div className="cgp-exam-tip-box">
            <strong>Efficiency Comparison:</strong> On 1,000,000 items, Linear search might need 1,000,000 checks. Binary search finishes in just <strong>20 checks</strong>.
          </div>
        </div>

      </div>

    </div>
  );
}
