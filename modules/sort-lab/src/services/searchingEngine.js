// GCSE Computer Science Searching Algorithms Engine (AQA 8525 §3.1.1)
// Generates step-by-step trace states for Linear Search and Binary Search

export const LINEAR_PSEUDOCODE = [
  { line: 1, text: 'function linearSearch(arr, target):', note: 'Define linear search function with array and target' },
  { line: 2, text: '    for i = 0 to length(arr) - 1:', note: 'Loop through array sequentially from start to finish' },
  { line: 3, text: '        if arr[i] == target then:', note: 'Check if current element matches target' },
  { line: 4, text: '            return i  // Match found!', note: 'Return index of target element' },
  { line: 5, text: '        endif', note: 'End conditional' },
  { line: 6, text: '    next i', note: 'Advance to next element' },
  { line: 7, text: '    return -1  // Target not in list', note: 'Exam rule: return -1 when item is absent' }
];

export const BINARY_PSEUDOCODE = [
  { line: 1, text: 'function binarySearch(arr, target):', note: 'Prerequisite: array MUST be in sorted order!' },
  { line: 2, text: '    low = 0', note: 'Set low pointer to first index' },
  { line: 3, text: '    high = length(arr) - 1', note: 'Set high pointer to last index' },
  { line: 4, text: '    while low <= high:', note: 'Continue while search interval is valid' },
  { line: 5, text: '        mid = floor((low + high) / 2)', note: 'Calculate integer midpoint index' },
  { line: 6, text: '        if arr[mid] == target then:', note: 'Check if midpoint matches target' },
  { line: 7, text: '            return mid  // Match found!', note: 'Return index of target' },
  { line: 8, text: '        elseif arr[mid] < target then:', note: 'Target is in upper (right) half' },
  { line: 9, text: '            low = mid + 1  // Discard left half', note: 'Shift low pointer past mid' },
  { line: 10, text: '        else:', note: 'Target is in lower (left) half' },
  { line: 11, text: '            high = mid - 1 // Discard right half', note: 'Shift high pointer below mid' },
  { line: 12, text: '        endif', note: 'End if-elseif-else' },
  { line: 13, text: '    endwhile', note: 'Search interval exhausted' },
  { line: 14, text: '    return -1  // Target not in list', note: 'Exam rule: return -1 when item is absent' }
];

export function generateLinearSearchSteps(array, target) {
  const steps = [];
  const targetNum = Number(target);
  const checked = [];

  // Step 0: Initialisation
  steps.push({
    stepIndex: 0,
    type: 'init',
    current: null,
    currentValue: null,
    target: targetNum,
    checkedIndices: [],
    isFound: false,
    foundIndex: -1,
    comparisonsCount: 0,
    codeLine: 2,
    quote: 'Linear search starts at index 0 and inspects each item sequentially.',
    explanation: `Starting Linear Search for target ${targetNum}. We will examine items one by one starting at index 0.`,
    variables: { i: 0, target: targetNum, comparisons: 0, found: false }
  });

  let found = false;
  let comparisons = 0;

  for (let i = 0; i < array.length; i++) {
    comparisons++;
    const val = array[i];
    const isMatch = val === targetNum;

    // Step: Comparing
    steps.push({
      stepIndex: steps.length,
      type: isMatch ? 'found' : 'compare',
      current: i,
      currentValue: val,
      target: targetNum,
      checkedIndices: [...checked],
      isFound: isMatch,
      foundIndex: isMatch ? i : -1,
      comparisonsCount: comparisons,
      codeLine: isMatch ? 4 : 3,
      quote: isMatch 
        ? 'Target found! Return index immediately.'
        : 'If current element does not match, advance to next index.',
      explanation: isMatch
        ? `FOUND! Element at index ${i} has value ${val}, which matches target ${targetNum}! Required ${comparisons} comparison(s).`
        : `Checking index ${i}: Value is ${val}. Does ${val} == ${targetNum}? No. Advance to index ${i + 1}.`,
      variables: {
        i,
        'arr[i]': val,
        target: targetNum,
        comparisons,
        found: isMatch
      }
    });

    if (isMatch) {
      found = true;
      break;
    }

    checked.push(i);
  }

  if (!found) {
    steps.push({
      stepIndex: steps.length,
      type: 'not_found',
      current: null,
      currentValue: null,
      target: targetNum,
      checkedIndices: [...checked],
      isFound: false,
      foundIndex: -1,
      comparisonsCount: comparisons,
      codeLine: 7,
      quote: 'If all elements have been checked without a match, return -1.',
      explanation: `TARGET NOT FOUND! Examined all ${array.length} elements without finding ${targetNum}. Returns -1 after ${comparisons} comparison(s).`,
      variables: {
        i: array.length,
        target: targetNum,
        comparisons,
        found: false
      }
    });
  }

  return steps;
}

export function generateBinarySearchSteps(array, target) {
  const steps = [];
  const targetNum = Number(target);
  let low = 0;
  let high = array.length - 1;
  let comparisons = 0;
  const eliminated = new Set();

  function getEliminatedArray() {
    const list = [];
    for (let idx = 0; idx < array.length; idx++) {
      if (idx < low || idx > high) {
        list.push(idx);
      }
    }
    return list;
  }

  // Step 0: Initialisation
  steps.push({
    stepIndex: 0,
    type: 'init',
    low,
    high,
    mid: null,
    midValue: null,
    target: targetNum,
    activeRange: [low, high],
    eliminatedIndices: [],
    isFound: false,
    foundIndex: -1,
    comparisonsCount: 0,
    codeLine: 2,
    quote: 'Binary search sets low = 0 and high = length - 1.',
    explanation: `Initialise pointers: Low = 0, High = ${high}. The list must be SORTED. Search interval spans all ${array.length} items.`,
    variables: { low, high, mid: '—', target: targetNum, comparisons: 0, found: false }
  });

  let found = false;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midVal = array[mid];

    // Step A: Calculate Midpoint
    steps.push({
      stepIndex: steps.length,
      type: 'calc_mid',
      low,
      high,
      mid,
      midValue: midVal,
      target: targetNum,
      activeRange: [low, high],
      eliminatedIndices: getEliminatedArray(),
      isFound: false,
      foundIndex: -1,
      comparisonsCount: comparisons,
      codeLine: 5,
      quote: 'Calculate midpoint: mid = floor((low + high) / 2).',
      explanation: `Midpoint calculated: floor((${low} + ${high}) / 2) = ${mid}. Checking value array[${mid}] = ${midVal}.`,
      variables: { low, high, mid, 'arr[mid]': midVal, target: targetNum, comparisons, found: false }
    });

    comparisons++;

    // Step B: Compare Midpoint
    if (midVal === targetNum) {
      steps.push({
        stepIndex: steps.length,
        type: 'found',
        low,
        high,
        mid,
        midValue: midVal,
        target: targetNum,
        activeRange: [low, high],
        eliminatedIndices: getEliminatedArray(),
        isFound: true,
        foundIndex: mid,
        comparisonsCount: comparisons,
        codeLine: 7,
        quote: 'Match found! Returns index mid directly.',
        explanation: `FOUND! array[${mid}] = ${midVal}, which equals target ${targetNum}! Binary search found the item in only ${comparisons} comparison(s).`,
        variables: { low, high, mid, 'arr[mid]': midVal, target: targetNum, comparisons, found: true }
      });
      found = true;
      break;
    } else if (midVal < targetNum) {
      // Target is greater -> search right half
      const oldLow = low;
      const oldMid = mid;
      low = mid + 1;
      for (let k = oldLow; k <= oldMid; k++) eliminated.add(k);

      steps.push({
        stepIndex: steps.length,
        type: 'narrow_right',
        low,
        high,
        mid: oldMid,
        midValue: midVal,
        target: targetNum,
        activeRange: [low, high],
        eliminatedIndices: getEliminatedArray(),
        isFound: false,
        foundIndex: -1,
        comparisonsCount: comparisons,
        codeLine: 9,
        quote: 'If arr[mid] < target, target is in the upper half. Set low = mid + 1.',
        explanation: `Target ${targetNum} > Midpoint ${midVal}. Because array is sorted, target CANNOT be in the left half! Discarding indices ${oldLow}..${oldMid}. New Low = ${low}.`,
        variables: { low, high, mid: oldMid, 'arr[mid]': midVal, target: targetNum, comparisons, found: false }
      });
    } else {
      // Target is smaller -> search left half
      const oldHigh = high;
      const oldMid = mid;
      high = mid - 1;
      for (let k = oldMid; k <= oldHigh; k++) eliminated.add(k);

      steps.push({
        stepIndex: steps.length,
        type: 'narrow_left',
        low,
        high,
        mid: oldMid,
        midValue: midVal,
        target: targetNum,
        activeRange: [low, high],
        eliminatedIndices: getEliminatedArray(),
        isFound: false,
        foundIndex: -1,
        comparisonsCount: comparisons,
        codeLine: 11,
        quote: 'If arr[mid] > target, target is in the lower half. Set high = mid - 1.',
        explanation: `Target ${targetNum} < Midpoint ${midVal}. Target CANNOT be in the right half! Discarding indices ${oldMid}..${oldHigh}. New High = ${high}.`,
        variables: { low, high, mid: oldMid, 'arr[mid]': midVal, target: targetNum, comparisons, found: false }
      });
    }
  }

  if (!found) {
    steps.push({
      stepIndex: steps.length,
      type: 'not_found',
      low,
      high,
      mid: null,
      midValue: null,
      target: targetNum,
      activeRange: [],
      eliminatedIndices: Array.from({ length: array.length }, (_, i) => i),
      isFound: false,
      foundIndex: -1,
      comparisonsCount: comparisons,
      codeLine: 14,
      quote: 'If low > high, pointers have crossed. The target is not present in the list.',
      explanation: `TARGET NOT FOUND! Pointers crossed (Low = ${low} > High = ${high}). All possible intervals eliminated. Returns -1 after ${comparisons} comparison(s).`,
      variables: { low, high, mid: '—', target: targetNum, comparisons, found: false }
    });
  }

  return steps;
}
