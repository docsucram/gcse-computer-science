// Sorting Engine: Precomputes and logs discrete, fully-traceable steps
// Includes variable values, GCSE pseudocode line pointers, explanations, and quiz opportunities

export function generateSteps(algorithmId, inputList) {
  const steps = [];
  const arr = [...inputList];
  const n = arr.length;

  // Initial step 0
  steps.push({
    array: [...arr],
    type: 'initial',
    indices: [],
    sortedIndices: [],
    sublistBounds: null,
    variables: {},
    codeLine: 1,
    explanation: 'Initial unsorted list loaded. Ready to begin execution.',
    pass: 0,
    isPassEnd: true,
    comparisons: 0,
    swaps: 0,
  });

  switch (algorithmId) {
    case 'bubble':
      generateBubbleSteps(arr, steps);
      break;
    case 'insertion':
      generateInsertionSteps(arr, steps);
      break;
    case 'selection':
      generateSelectionSteps(arr, steps);
      break;
    case 'merge':
      generateMergeSteps(arr, steps);
      break;
    case 'quick':
      generateQuickSteps(arr, steps);
      break;
    case 'icbics':
      generateICBICSSteps(arr, steps);
      break;
    default:
      generateBubbleSteps(arr, steps);
  }

  // Final completion step
  const last = steps[steps.length - 1];
  const allIndices = Array.from({ length: n }, (_, idx) => idx);
  steps.push({
    array: [...last.array],
    type: 'completed',
    indices: [],
    sortedIndices: allIndices,
    sublistBounds: null,
    variables: { ...last.variables, status: 'Sorted' },
    codeLine: last.codeLine,
    explanation: `Sorting complete! The entire list of ${n} elements is verified in non-decreasing order.`,
    pass: last.pass,
    isPassEnd: true,
    comparisons: last.comparisons,
    swaps: last.swaps,
  });

  return steps;
}

// ----------------------------------------------------
// 1. BUBBLE SORT
// ----------------------------------------------------
function generateBubbleSteps(arr, steps) {
  const n = arr.length;
  let swapped = true;
  let passNum = 0;
  const sortedSet = new Set();
  let comparisons = 0;
  let swaps = 0;

  steps.push({
    array: [...arr],
    type: 'flag',
    indices: [],
    sortedIndices: Array.from(sortedSet),
    variables: { swapped: true, pass: 0 },
    codeLine: 1,
    explanation: 'Set swapped flag to True to enter the while loop.',
    pass: 0,
    isPassEnd: false,
    comparisons,
    swaps,
  });

  while (swapped && passNum < n - 1) {
    swapped = false;
    const currentPass = passNum + 1;

    steps.push({
      array: [...arr],
      type: 'pass-start',
      indices: [],
      sortedIndices: Array.from(sortedSet),
      variables: { swapped: false, pass: currentPass, pass_num: passNum },
      codeLine: 4,
      explanation: `Pass ${currentPass} begins. Reset swapped = False.`,
      pass: currentPass,
      isPassEnd: false,
      comparisons,
      swaps,
    });

    for (let j = 0; j < n - 1 - passNum; j++) {
      comparisons++;
      const willSwap = arr[j] > arr[j + 1];

      // Step: Compare adjacent pair
      const compareStep = {
        array: [...arr],
        type: 'compare',
        indices: [j, j + 1],
        sortedIndices: Array.from(sortedSet),
        variables: { j, 'j+1': j + 1, 'list[j]': arr[j], 'list[j+1]': arr[j + 1], swapped, pass: currentPass },
        codeLine: 6,
        explanation: `Comparing list[${j}] (${arr[j]}) and list[${j + 1}] (${arr[j + 1]}). ${willSwap ? `${arr[j]} > ${arr[j + 1]} is True: must swap!` : `${arr[j]} <= ${arr[j + 1]} is False: in correct order.`}`,
        pass: currentPass,
        isPassEnd: false,
        comparisons,
        swaps,
      };

      // Quiz opportunity on comparison
      if (j === 0 || (j % 2 === 0 && j < 4)) {
        compareStep.quiz = {
          type: 'swap_prediction',
          question: `Will list[${j}] (${arr[j]}) and list[${j + 1}] (${arr[j + 1]}) swap?`,
          options: [
            willSwap ? `Yes (${arr[j]} > ${arr[j + 1]})` : `No (${arr[j]} ≤ ${arr[j + 1]})`,
            willSwap ? `No (${arr[j]} ≤ ${arr[j + 1]})` : `Yes (${arr[j]} > ${arr[j + 1]})`,
          ],
          correctIndex: 0,
          explanation: willSwap
            ? `Correct! Because ${arr[j]} is strictly greater than ${arr[j + 1]}, the GCSE condition list[j] > list[j+1] evaluates to True.`
            : `Correct! Because ${arr[j]} is less than or equal to ${arr[j + 1]}, no swap is needed.`,
        };
      }

      steps.push(compareStep);

      if (willSwap) {
        // Swap values
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swapped = true;
        swaps++;

        steps.push({
          array: [...arr],
          type: 'swap',
          indices: [j, j + 1],
          sortedIndices: Array.from(sortedSet),
          variables: { j, 'j+1': j + 1, temp, swapped: true, pass: currentPass },
          codeLine: 8,
          explanation: `Swapped list[${j}] and list[${j + 1}]. Set swapped = True.`,
          pass: currentPass,
          isPassEnd: false,
          comparisons,
          swaps,
        });
      }
    }

    // Element at n - 1 - passNum is now in final position
    const sortedPos = n - 1 - passNum;
    sortedSet.add(sortedPos);
    passNum++;

    steps.push({
      array: [...arr],
      type: 'pass-end',
      indices: [sortedPos],
      sortedIndices: Array.from(sortedSet),
      variables: { pass: passNum, last_sorted: sortedPos, swapped },
      codeLine: 13,
      explanation: `Pass ${passNum} complete! Element ${arr[sortedPos]} at index ${sortedPos} has bubbled to its final position.`,
      pass: passNum,
      isPassEnd: true,
      comparisons,
      swaps,
    });

    if (!swapped) {
      steps.push({
        array: [...arr],
        type: 'early-exit',
        indices: [],
        sortedIndices: Array.from({ length: n }, (_, i) => i),
        variables: { swapped: false, pass: passNum },
        codeLine: 3,
        explanation: 'Early exit triggered! Zero swaps made during this pass, meaning list is fully sorted in O(n) time.',
        pass: passNum,
        isPassEnd: true,
        comparisons,
        swaps,
      });
      break;
    }
  }
}

// ----------------------------------------------------
// 2. INSERTION SORT
// ----------------------------------------------------
function generateInsertionSteps(arr, steps) {
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  const sortedSet = new Set([0]); // index 0 is trivially sorted

  steps.push({
    array: [...arr],
    type: 'pass-start',
    indices: [0],
    sortedIndices: [0],
    variables: { i: 0, message: 'list[0] is trivially sorted' },
    codeLine: 1,
    explanation: 'A sublist of 1 element (index 0) is already sorted by definition.',
    pass: 0,
    isPassEnd: false,
    comparisons,
    swaps,
  });

  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    const currentPass = i;

    // Pick key
    const pickStep = {
      array: [...arr],
      type: 'key',
      indices: [i],
      sortedIndices: Array.from(sortedSet),
      variables: { i, key, j },
      codeLine: 2,
      explanation: `Pass ${currentPass}: key = list[${i}] (${key}). Insert into sorted sublist [0..${i - 1}].`,
      pass: currentPass,
      isPassEnd: false,
      comparisons,
      swaps,
    };

    if (i <= 3) {
      pickStep.quiz = {
        type: 'key_prediction',
        question: `In Pass ${currentPass}, which element is selected as the 'key' to be inserted?`,
        options: [
          `Element ${key} at index ${i}`,
          `Element ${arr[j]} at index ${j}`,
        ],
        correctIndex: 0,
        explanation: `Correct! In Insertion Sort, the outer loop advances from left to right, picking list[i] (${key}) as the key element.`,
      };
    }

    steps.push(pickStep);

    while (j >= 0) {
      comparisons++;
      const needShift = arr[j] > key;

      steps.push({
        array: [...arr],
        type: 'compare',
        indices: [j, j + 1],
        sortedIndices: Array.from(sortedSet),
        variables: { i, j, 'list[j]': arr[j], key },
        codeLine: 4,
        explanation: `Comparing sorted item list[${j}] (${arr[j]}) with key (${key}). ${needShift ? `${arr[j]} > ${key} is True: shift right!` : `${arr[j]} <= ${key} is False: insertion slot found.`}`,
        pass: currentPass,
        isPassEnd: false,
        comparisons,
        swaps,
      });

      if (needShift) {
        arr[j + 1] = arr[j];
        swaps++; // shift counts as array write
        steps.push({
          array: [...arr],
          type: 'shift',
          indices: [j, j + 1],
          sortedIndices: Array.from(sortedSet),
          variables: { i, j, shifted: arr[j], targetSlot: j + 1 },
          codeLine: 5,
          explanation: `Shifted element ${arr[j]} from index ${j} to index ${j + 1}.`,
          pass: currentPass,
          isPassEnd: false,
          comparisons,
          swaps,
        });
        j--;
      } else {
        break;
      }
    }

    // Insert key at j + 1
    arr[j + 1] = key;
    swaps++;
    for (let k = 0; k <= i; k++) sortedSet.add(k);

    steps.push({
      array: [...arr],
      type: 'insert',
      indices: [j + 1],
      sortedIndices: Array.from(sortedSet),
      variables: { i, insertPos: j + 1, key },
      codeLine: 8,
      explanation: `Pass ${currentPass} complete! Inserted key ${key} at position ${j + 1}. Sublist [0..${i}] is now sorted.`,
      pass: currentPass,
      isPassEnd: true,
      comparisons,
      swaps,
    });
  }
}

// ----------------------------------------------------
// 3. SELECTION SORT
// ----------------------------------------------------
function generateSelectionSteps(arr, steps) {
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  const sortedSet = new Set();

  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;
    const currentPass = i + 1;

    steps.push({
      array: [...arr],
      type: 'pass-start',
      indices: [i],
      sortedIndices: Array.from(sortedSet),
      variables: { i, min_index: i, 'list[min]': arr[i], pass: currentPass },
      codeLine: 2,
      explanation: `Pass ${currentPass}: Assume list[${i}] (${arr[i]}) is the minimum. Scan unsorted items [${i + 1}..${n - 1}].`,
      pass: currentPass,
      isPassEnd: false,
      comparisons,
      swaps,
    });

    for (let j = i + 1; j < n; j++) {
      comparisons++;
      const isSmaller = arr[j] < arr[minIndex];

      const scanStep = {
        array: [...arr],
        type: 'compare',
        indices: [j, minIndex],
        sortedIndices: Array.from(sortedSet),
        variables: { i, j, min_index: minIndex, 'list[j]': arr[j], 'list[min]': arr[minIndex] },
        codeLine: 4,
        explanation: `Comparing list[${j}] (${arr[j]}) with current minimum list[${minIndex}] (${arr[minIndex]}). ${isSmaller ? `Found smaller element! Update min_index = ${j}.` : 'Not smaller, keep current minimum.'}`,
        pass: currentPass,
        isPassEnd: false,
        comparisons,
        swaps,
      };

      if (i < 2 && (j === i + 1 || (j === i + 2 && isSmaller))) {
        scanStep.quiz = {
          type: 'selection_min',
          question: `Selection Sort: Is list[${j}] (${arr[j]}) smaller than current minimum list[${minIndex}] (${arr[minIndex]})?`,
          options: [
            isSmaller ? `Yes (${arr[j]} < ${arr[minIndex]}): Update min_index` : `No (${arr[j]} ≥ ${arr[minIndex]}): Keep current minimum`,
            isSmaller ? `No (${arr[j]} ≥ ${arr[minIndex]}): Keep current minimum` : `Yes (${arr[j]} < ${arr[minIndex]}): Update min_index`,
          ],
          correctIndex: 0,
          explanation: isSmaller
            ? `Correct! Since ${arr[j]} < ${arr[minIndex]}, min_index is updated to ${j}.`
            : `Correct! Since ${arr[j]} is not less than ${arr[minIndex]}, the existing minimum is retained.`,
        };
      }

      steps.push(scanStep);

      if (isSmaller) {
        minIndex = j;
        steps.push({
          array: [...arr],
          type: 'pivot',
          indices: [minIndex],
          sortedIndices: Array.from(sortedSet),
          variables: { i, min_index: minIndex, 'new_min': arr[minIndex] },
          codeLine: 5,
          explanation: `New minimum found: ${arr[minIndex]} at index ${minIndex}.`,
          pass: currentPass,
          isPassEnd: false,
          comparisons,
          swaps,
        });
      }
    }

    // Swap minIndex with i
    if (minIndex !== i) {
      const temp = arr[i];
      arr[i] = arr[minIndex];
      arr[minIndex] = temp;
      swaps++;

      steps.push({
        array: [...arr],
        type: 'swap',
        indices: [i, minIndex],
        sortedIndices: Array.from(sortedSet),
        variables: { i, min_index: minIndex, swapped: [arr[i], arr[minIndex]] },
        codeLine: 10,
        explanation: `Swapped minimum element ${arr[i]} into slot ${i}.`,
        pass: currentPass,
        isPassEnd: false,
        comparisons,
        swaps,
      });
    }

    sortedSet.add(i);

    steps.push({
      array: [...arr],
      type: 'pass-end',
      indices: [i],
      sortedIndices: Array.from(sortedSet),
      variables: { pass: currentPass, confirmed: i, value: arr[i] },
      codeLine: 13,
      explanation: `Pass ${currentPass} complete! Index ${i} permanently holds value ${arr[i]}.`,
      pass: currentPass,
      isPassEnd: true,
      comparisons,
      swaps,
    });
  }

  sortedSet.add(n - 1);
}

// ----------------------------------------------------
// 4. MERGE SORT (Visual Divide-and-Conquer)
// ----------------------------------------------------
function generateMergeSteps(arr, steps) {
  let comparisons = 0;
  let swaps = 0;
  let passCounter = 0;
  const sortedSet = new Set();

  function mergeSortHelper(left, right) {
    if (left >= right) return;

    const mid = Math.floor((left + right) / 2);

    const divideStep = {
      array: [...arr],
      type: 'sublist',
      indices: [mid],
      sublistBounds: { left, mid, right },
      sortedIndices: Array.from(sortedSet),
      variables: { left, mid, right, 'mid DIV 2': mid },
      codeLine: 5,
      explanation: `Divide: Sublist [${left}..${right}] split at mid = ${mid}. Left: [${left}..${mid}], Right: [${mid + 1}..${right}].`,
      pass: passCounter,
      isPassEnd: false,
      comparisons,
      swaps,
    };

    if (left === 0 && right === arr.length - 1) {
      divideStep.quiz = {
        type: 'merge_base_case',
        question: `Why does Merge Sort recursively split until each sublist has only 1 item?`,
        options: [
          `A sublist of 1 item is already sorted by definition (base case).`,
          `Because 1 item requires 0 bytes of RAM.`,
        ],
        correctIndex: 0,
        explanation: `Correct! A single-element list is inherently sorted. Once down to single items, Merge Sort combines them back up by comparing and merging sorted pairs!`,
      };
    }

    steps.push(divideStep);

    mergeSortHelper(left, mid);
    mergeSortHelper(mid + 1, right);
    merge(left, mid, right);
  }

  function merge(left, mid, right) {
    passCounter++;
    const currentPass = passCounter;
    const temp = [];
    let i = left;
    let j = mid + 1;

    steps.push({
      array: [...arr],
      type: 'pass-start',
      indices: [left, right],
      sublistBounds: { left, mid, right },
      sortedIndices: Array.from(sortedSet),
      variables: { left, mid, right, i, j, pass: currentPass },
      codeLine: 8,
      explanation: `Conquer: Merging sorted sublists [${left}..${mid}] and [${mid + 1}..${right}].`,
      pass: currentPass,
      isPassEnd: false,
      comparisons,
      swaps,
    });

    while (i <= mid && j <= right) {
      comparisons++;
      const leftVal = arr[i];
      const rightVal = arr[j];
      const chooseLeft = leftVal <= rightVal;
      const winnerVal = chooseLeft ? leftVal : rightVal;
      const loserVal = chooseLeft ? rightVal : leftVal;

      const compareStep = {
        array: [...arr],
        type: 'compare',
        indices: [i, j],
        sublistBounds: { left, mid, right },
        sortedIndices: Array.from(sortedSet),
        variables: { i, j, 'left_val': leftVal, 'right_val': rightVal },
        codeLine: 8,
        explanation: `Comparing ${leftVal} (left sublist) and ${rightVal} (right sublist). ${chooseLeft ? `Take ${leftVal} first.` : `Take ${rightVal} first.`}`,
        pass: currentPass,
        isPassEnd: false,
        comparisons,
        swaps,
      };

      if (comparisons === 1 || (comparisons % 3 === 0 && comparisons < 8)) {
        compareStep.quiz = {
          type: 'merge_selection',
          question: `Merge Step: Comparing ${leftVal} (Left) and ${rightVal} (Right). Which number is placed into the merged list first?`,
          options: [
            `${winnerVal} (The smaller number: ${winnerVal} ${chooseLeft ? '≤' : '<'} ${loserVal})`,
            `${loserVal} (The larger number: ${loserVal} ${chooseLeft ? '>' : '≥'} ${winnerVal})`,
          ],
          correctIndex: 0,
          explanation: `Correct! In Merge Sort, we compare the front elements of both sorted sublists and take the smaller value (${winnerVal}) first to maintain ascending order.`,
        };
      }

      steps.push(compareStep);

      if (chooseLeft) {
        temp.push(arr[i]);
        i++;
      } else {
        temp.push(arr[j]);
        j++;
      }
    }

    while (i <= mid) {
      temp.push(arr[i]);
      i++;
    }
    while (j <= right) {
      temp.push(arr[j]);
      j++;
    }

    // Write back to main array
    for (let k = 0; k < temp.length; k++) {
      arr[left + k] = temp[k];
      swaps++;
      if (left === 0 && right === arr.length - 1) {
        sortedSet.add(left + k);
      }
    }

    steps.push({
      array: [...arr],
      type: 'pass-end',
      indices: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
      sublistBounds: { left, mid, right },
      sortedIndices: Array.from(sortedSet),
      variables: { left, right, mergedSize: temp.length, pass: currentPass },
      codeLine: 8,
      explanation: `Merged sublist [${left}..${right}] successfully placed back into array!`,
      pass: currentPass,
      isPassEnd: true,
      comparisons,
      swaps,
    });
  }

  mergeSortHelper(0, arr.length - 1);
}

// ----------------------------------------------------
// 5. QUICK SORT (Lomuto Partition)
// ----------------------------------------------------
function generateQuickSteps(arr, steps) {
  let comparisons = 0;
  let swaps = 0;
  let passNum = 0;
  const sortedSet = new Set();

  function quickSortHelper(low, high) {
    if (low < high) {
      const pIdx = partition(low, high);
      sortedSet.add(pIdx);
      quickSortHelper(low, pIdx - 1);
      quickSortHelper(pIdx + 1, high);
    } else if (low === high) {
      sortedSet.add(low);
    }
  }

  function partition(low, high) {
    passNum++;
    const currentPass = passNum;
    const pivot = arr[high]; // Lomuto pivot at high
    let i = low - 1;

    const pivotStep = {
      array: [...arr],
      type: 'pivot',
      indices: [high],
      sublistBounds: { left: low, right: high },
      sortedIndices: Array.from(sortedSet),
      variables: { low, high, pivot, pivotIndex: high, pass: currentPass },
      codeLine: 3,
      explanation: `Pass ${currentPass}: Chosen pivot = ${pivot} at index ${high}. Elements < ${pivot} will move left.`,
      pass: currentPass,
      isPassEnd: false,
      comparisons,
      swaps,
    };

    if (passNum <= 2) {
      pivotStep.quiz = {
        type: 'pivot_prediction',
        question: `Which element is currently selected as the partition pivot for sublist [${low}..${high}]?`,
        options: [
          `Element ${pivot} at index ${high}`,
          `Element ${arr[low]} at index ${low}`,
        ],
        correctIndex: 0,
        explanation: `Correct! Under the standard Lomuto partition scheme, list[high] (${pivot}) is chosen as the pivot.`,
      };
    }

    steps.push(pivotStep);

    for (let j = low; j < high; j++) {
      comparisons++;
      const isSmaller = arr[j] < pivot;

      steps.push({
        array: [...arr],
        type: 'compare',
        indices: [j, high],
        sublistBounds: { left: low, right: high },
        sortedIndices: Array.from(sortedSet),
        variables: { low, high, j, 'list[j]': arr[j], pivot, i },
        codeLine: 3,
        explanation: `Comparing list[${j}] (${arr[j]}) with pivot (${pivot}). ${isSmaller ? `${arr[j]} < ${pivot}: swap into left partition!` : `${arr[j]} >= ${pivot}: stays in right partition.`}`,
        pass: currentPass,
        isPassEnd: false,
        comparisons,
        swaps,
      });

      if (isSmaller) {
        i++;
        if (i !== j) {
          const temp = arr[i];
          arr[i] = arr[j];
          arr[j] = temp;
          swaps++;

          steps.push({
            array: [...arr],
            type: 'swap',
            indices: [i, j],
            sublistBounds: { left: low, right: high },
            sortedIndices: Array.from(sortedSet),
            variables: { i, j, pivot },
            codeLine: 3,
            explanation: `Swapped list[${i}] (${arr[i]}) and list[${j}] (${arr[j]}) into lower partition.`,
            pass: currentPass,
            isPassEnd: false,
            comparisons,
            swaps,
          });
        }
      }
    }

    // Place pivot in correct slot (i + 1)
    const pivotSlot = i + 1;
    if (pivotSlot !== high) {
      const temp = arr[pivotSlot];
      arr[pivotSlot] = arr[high];
      arr[high] = temp;
      swaps++;
    }

    sortedSet.add(pivotSlot);

    steps.push({
      array: [...arr],
      type: 'pass-end',
      indices: [pivotSlot],
      sublistBounds: { left: low, right: high },
      sortedIndices: Array.from(sortedSet),
      variables: { pivotSlot, pivot: arr[pivotSlot], pass: currentPass },
      codeLine: 3,
      explanation: `Partition complete! Pivot ${arr[pivotSlot]} is now in its permanently sorted index ${pivotSlot}.`,
      pass: currentPass,
      isPassEnd: true,
      comparisons,
      swaps,
    });

    return pivotSlot;
  }

  quickSortHelper(0, arr.length - 1);
}

// ----------------------------------------------------
// 6. I CAN'T BELIEVE IT CAN SORT (ICBICS)
// ----------------------------------------------------
function generateICBICSSteps(arr, steps) {
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  const sortedSet = new Set();

  for (let i = 0; i < n; i++) {
    const currentPass = i + 1;

    steps.push({
      array: [...arr],
      type: 'pass-start',
      indices: [i],
      sortedIndices: Array.from(sortedSet),
      variables: { i, 'list[i]': arr[i], pass: currentPass },
      codeLine: 1,
      explanation: `Pass ${currentPass}: Outer index i = ${i} (value ${arr[i]}). Inner loop j sweeps entire array [0..${n - 1}].`,
      pass: currentPass,
      isPassEnd: false,
      comparisons,
      swaps,
    });

    for (let j = 0; j < n; j++) {
      comparisons++;
      const willSwap = arr[i] < arr[j];

      steps.push({
        array: [...arr],
        type: 'compare',
        indices: [i, j],
        sortedIndices: Array.from(sortedSet),
        variables: { i, j, 'list[i]': arr[i], 'list[j]': arr[j], pass: currentPass },
        codeLine: 3,
        explanation: `Comparing list[${i}] (${arr[i]}) < list[${j}] (${arr[j]}). ${willSwap ? 'Condition True: swap!' : 'Condition False: no swap.'}`,
        pass: currentPass,
        isPassEnd: false,
        comparisons,
        swaps,
      });

      if (willSwap) {
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
        swaps++;

        steps.push({
          array: [...arr],
          type: 'swap',
          indices: [i, j],
          sortedIndices: Array.from(sortedSet),
          variables: { i, j, swapped: [arr[i], arr[j]] },
          codeLine: 4,
          explanation: `Swapped list[${i}] and list[${j}].`,
          pass: currentPass,
          isPassEnd: false,
          comparisons,
          swaps,
        });
      }
    }

    sortedSet.add(i);

    steps.push({
      array: [...arr],
      type: 'pass-end',
      indices: [i],
      sortedIndices: Array.from(sortedSet),
      variables: { i, pass: currentPass },
      codeLine: 7,
      explanation: `Pass ${currentPass} complete for outer index i = ${i}.`,
      pass: currentPass,
      isPassEnd: true,
      comparisons,
      swaps,
    });
  }
}
