// GCSE Computer Science Searching Algorithms Engine (AQA 8525 §3.1.1)
// Generates step-by-step trace states for Linear Search and Binary Search

export const SEARCH_ALGORITHMS = {
  binary: {
    id: 'binary',
    name: 'Binary Search',
    analogy: '📖 Like opening a dictionary right in the middle!',
    description: 'Binary Search is an ultra-fast algorithm for finding an item in a SORTED list. Instead of checking every item one by one from the start, it jumps straight to the middle item. If your target is smaller, it throws away the entire right half of the list; if larger, it throws away the entire left half. By repeatedly cutting the remaining items in half, it can find any number in a list of 1,000 items in just 10 checks!',
    rules: [
      'The list MUST be sorted beforehand for the halving logic to work.',
      'Find the midpoint of the active range: (Low + High) / 2 (rounded down).',
      'Check: If array[mid] == target, match found!',
      'If target > array[mid], eliminate the left half (Low = mid + 1).',
      'If target < array[mid], eliminate the right half (High = mid - 1).'
    ],
    timeComplexity: 'O(log n) - Logarithmic',
    spaceComplexity: 'O(1) - In-place'
  },
  linear: {
    id: 'linear',
    name: 'Linear Search',
    analogy: '🔍 Like checking through a shuffled deck of cards one by one!',
    description: 'Linear Search is the most straightforward search method. It starts at the very beginning of the list (index 0) and inspects every item sequentially until it either finds the target number or reaches the end of the list. It works on ANY list (sorted or unsorted), but can be slow on huge datasets because in the worst case, every single item must be examined.',
    rules: [
      'Works on ANY list — no sorting needed.',
      'Start at index 0 and inspect each element in order.',
      'If array[i] == target, match found! Return index immediately.',
      'If not found after checking the whole list, return -1.'
    ],
    timeComplexity: 'O(n) - Linear',
    spaceComplexity: 'O(1) - In-place'
  }
};

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
    explanation: `Start at the beginning of the list (index 0).\nTarget number to find: ${targetNum}.\nWe will check each item one by one.`,
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
        ? `Checking item at index ${i}: Value is ${val}.\nIs this the target number (${targetNum})?: Yes!\nMatch found at index ${i} after ${comparisons} check(s).`
        : `Checking item at index ${i}: Value is ${val}.\nIs this the target number (${targetNum})?: No.\nMoving on to index ${i + 1}.`,
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
      explanation: `Checked every item in the list from index 0 to ${array.length - 1}.\nIs the target number (${targetNum}) in the list?: No.\nTarget not found after ${comparisons} check(s).`,
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
    explanation: `Set the search range across the whole list: from index 0 to ${high}.\n(The list must be sorted in order).\nTarget number to find: ${targetNum}.`,
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
      explanation: `Find the midpoint of the list: (${low} + ${high}) / 2 = ${mid}.\nChecking value array[${mid}] = ${midVal}.\nIs this the target number?: ${midVal === targetNum ? 'Yes!' : 'No.'}`,
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
        explanation: `Match found!\narray[${mid}] = ${midVal}, which matches target number ${targetNum}.\nFound in only ${comparisons} check(s)!`,
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
        explanation: `Is the target number (${targetNum}) bigger than ${midVal}? Yes.\nBecause the list is sorted, the target cannot be in the left half.\nDiscard indexes ${oldLow} to ${oldMid}. Now search between index ${low} and ${high}.`,
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
        explanation: `Is the target number (${targetNum}) smaller than ${midVal}? Yes.\nBecause the list is sorted, the target cannot be in the right half.\nDiscard indexes ${oldMid} to ${oldHigh}. Now search between index ${low} and ${high}.`,
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
      explanation: `The search pointers have crossed (Low = ${low} is now greater than High = ${high}).\nEvery possible position has been checked.\nIs the target number (${targetNum}) in the list?: No.`,
      variables: { low, high, mid: '—', target: targetNum, comparisons, found: false }
    });
  }

  return steps;
}
