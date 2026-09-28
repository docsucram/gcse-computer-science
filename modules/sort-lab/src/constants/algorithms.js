// GCSE Computer Science Sorting Algorithms Reference & Metadata
// Aligned with AQA 8525 §3.1.1 (Core: Bubble Sort & Merge Sort; Python/C#/VB.NET)
// with enrichment sorting algorithms (Insertion, Selection, Quick)

export const SYLLABUS_BOARDS = {
  all: { id: 'all', label: 'All Algorithms' },
  aqa: { id: 'aqa', label: 'AQA 8525 Core Focus' },
};

export const ALGORITHMS = {
  bubble: {
    id: 'bubble',
    name: 'Bubble Sort',
    category: 'Exchange Sort',
    aqaCore: true,
    examBoardRelevance: 'AQA 8525 §3.1.1 (Core Mandatory)',
    complexity: {
      bestTime: 'O(n)',
      averageTime: 'O(n²)',
      worstTime: 'O(n²)',
      space: 'O(1) (In-place)',
      stable: true,
    },
    complexityNotes: {
      best: 'Occurs when list is already sorted; early-exit flag detects 0 swaps on Pass 1.',
      worst: 'Occurs when list is completely reversed; requires n(n-1)/2 comparisons and swaps.',
      space: 'Requires O(1) auxiliary memory because elements are swapped directly in-place without extra lists.',
      stability: 'Stable because equal elements are never swapped past one another (only strict `>` triggers swap).'
    },
    analogy: '🫧 Like bubbles rising in fizzy soda! It compares two side-by-side neighbours: if the left item is bigger, they swap places. By the end of Pass 1, the largest number has bubbled all the way to the right end!',
    description: "Imagine lining students up by height from shortest to tallest. You walk down the line from left to right, comparing two neighbours at a time. If the person on the left is taller than the person on the right, you swap them. By the time you reach the end of your very first walk, the tallest person has 'bubbled' all the way to the far right. You then repeat the walk for the rest of the line until you can make an entire pass without swapping anyone.",
    pros: [
      'Extremely simple to implement and understand for beginners.',
      'In-place algorithm: uses minimal extra memory (O(1) auxiliary space), ideal for RAM-limited embedded systems.',
      'Adaptive: with a swapped flag, can terminate in O(n) linear time on an already sorted list.',
      'Stable sort: preserves relative order of duplicate elements.'
    ],
    cons: [
      'Very inefficient on large datasets with quadratic O(n²) average time.',
      'Performs a massive number of costly swaps compared to Selection or Insertion sort.'
    ],
    examTips: [
      'AQA Paper 1 Rule: AQA tests Bubble Sort in Paper 1 using your school\'s chosen language (Python 3, C#, or VB.NET).',
      'Pass 1 always places the LARGEST item into the final index of the array.',
      'Total passes required on an array of length n is at most (n - 1).',
      'Remember the early-exit optimization: `swapped = False` set before the inner loop, flipped to `True` if any swap occurs.',
      'AQA Trace Table Rule: In AQA trace tables, only write down new values when a variable actually changes!'
    ],
    examQuestions: [
      {
        question: 'Explain why Bubble Sort has a best-case time complexity of O(n) when an early-exit flag is used. [2 marks]',
        markScheme: '1 mark for stating that the algorithm checks every adjacent pair once (1 pass with n-1 comparisons). 1 mark for stating the swapped flag remains False, allowing the algorithm to terminate early.'
      },
      {
        question: 'State the contents of array [5, 1, 4, 2, 8] after Pass 1 of Bubble Sort. [2 marks]',
        markScheme: 'Pass 1 result: [1, 4, 2, 5, 8]. Mark 1: 8 in final position. Mark 2: other elements correctly swapped.'
      }
    ],
    codeSnippets: {
      pseudocode: [
        { line: 1, text: 'swapped = True', note: 'Initialize swapped flag to True to enter loop' },
        { line: 2, text: 'pass_num = 0', note: 'Track pass counter' },
        { line: 3, text: 'while swapped == True', note: 'Repeat until a full pass makes 0 swaps' },
        { line: 4, text: '    swapped = False', note: 'Reset swapped flag at start of each pass' },
        { line: 5, text: '    for j = 0 to (length - 2 - pass_num)', note: 'Compare adjacent pairs, ignoring already sorted tail' },
        { line: 6, text: '        if list[j] > list[j + 1] then', note: 'Check if adjacent items are in wrong order' },
        { line: 7, text: '            temp = list[j]', note: 'Temporary variable holds value for swap' },
        { line: 8, text: '            list[j] = list[j + 1]', note: 'Shift smaller element left' },
        { line: 9, text: '            list[j + 1] = temp', note: 'Place larger element right' },
        { line: 10, text: '            swapped = True', note: 'Mark that a swap occurred this pass' },
        { line: 11, text: '        endif', note: 'End conditional check' },
        { line: 12, text: '    next j', note: 'Advance to next pair' },
        { line: 13, text: '    pass_num = pass_num + 1', note: 'Pass complete: one more element guaranteed sorted' },
        { line: 14, text: 'endwhile', note: 'List is now fully sorted' }
      ],
      python: [
        { line: 1, text: 'swapped = True', note: 'AQA 8525/1A Python: flag initialization' },
        { line: 2, text: 'pass_num = 0', note: 'Counter tracking completed outer passes' },
        { line: 3, text: 'while swapped:', note: 'Continue while swaps occurred in previous pass' },
        { line: 4, text: '    swapped = False', note: 'Reset flag for current pass' },
        { line: 5, text: '    for j in range(len(arr) - 1 - pass_num):', note: 'Iterate unsorted adjacent pairs' },
        { line: 6, text: '        if arr[j] > arr[j + 1]:', note: 'Compare adjacent elements' },
        { line: 7, text: '            temp = arr[j]', note: 'Store item in temporary variable' },
        { line: 8, text: '            arr[j] = arr[j + 1]', note: 'Shift smaller value left' },
        { line: 9, text: '            arr[j + 1] = temp', note: 'Assign temp to right slot' },
        { line: 10, text: '            swapped = True', note: 'Record swap event' },
        { line: 11, text: '        # end if', note: 'End of swap block' },
        { line: 12, text: '    # end for j', note: 'End of inner loop' },
        { line: 13, text: '    pass_num += 1', note: 'Pass complete; last item in position' },
        { line: 14, text: 'print("Sorted:", arr)', note: 'List completely sorted' }
      ],
      csharp: [
        { line: 1, text: 'bool swapped = true;', note: 'AQA 8525/1B C#: boolean flag' },
        { line: 2, text: 'int pass_num = 0;', note: 'Pass counter' },
        { line: 3, text: 'while (swapped) {', note: 'While loop condition' },
        { line: 4, text: '    swapped = false;', note: 'Reset swapped' },
        { line: 5, text: '    for (int j = 0; j < arr.Length - 1 - pass_num; j++) {', note: 'Inner loop bounds' },
        { line: 6, text: '        if (arr[j] > arr[j + 1]) {', note: 'Evaluate pair order' },
        { line: 7, text: '            int temp = arr[j];', note: 'Declare temporary integer' },
        { line: 8, text: '            arr[j] = arr[j + 1];', note: 'Shift value' },
        { line: 9, text: '            arr[j + 1] = temp;', note: 'Complete swap' },
        { line: 10, text: '            swapped = true;', note: 'Set flag true' },
        { line: 11, text: '        }', note: 'End if' },
        { line: 12, text: '    }', note: 'End for' },
        { line: 13, text: '    pass_num++;', note: 'Increment pass' },
        { line: 14, text: '}', note: 'Array is sorted' }
      ],
      vbnet: [
        { line: 1, text: 'Dim swapped As Boolean = True', note: 'AQA 8525/1C VB.NET: flag' },
        { line: 2, text: 'Dim pass_num As Integer = 0', note: 'Pass index' },
        { line: 3, text: 'While swapped', note: 'Begin loop' },
        { line: 4, text: '    swapped = False', note: 'Reset boolean flag' },
        { line: 5, text: '    For j = 0 To (arr.Length - 2 - pass_num)', note: 'VB 0-indexed loop' },
        { line: 6, text: '        If arr(j) > arr(j + 1) Then', note: 'Comparison' },
        { line: 7, text: '            Dim temp As Integer = arr(j)', note: 'Temp storage' },
        { line: 8, text: '            arr(j) = arr(j + 1)', note: 'Move left' },
        { line: 9, text: '            arr(j + 1) = temp', note: 'Move right' },
        { line: 10, text: '            swapped = True', note: 'Flag True' },
        { line: 11, text: '        End If', note: 'End If' },
        { line: 12, text: '    Next j', note: 'Next loop cycle' },
        { line: 13, text: '    pass_num = pass_num + 1', note: 'Increment pass' },
        { line: 14, text: 'End While', note: 'Sorted' }
      ]
    },
    // Backwards-compatible fallback
    get pseudocode() {
      return this.codeSnippets.pseudocode;
    }
  },

  merge: {
    id: 'merge',
    name: 'Merge Sort',
    category: 'Divide and Conquer',
    aqaCore: true,
    examBoardRelevance: 'AQA 8525 §3.1.1 (Core Mandatory)',
    complexity: {
      bestTime: 'O(n log n)',
      averageTime: 'O(n log n)',
      worstTime: 'O(n log n)',
      space: 'O(n) (Auxiliary Memory)',
      stable: true,
    },
    complexityNotes: {
      best: 'Guaranteed O(n log n) in all cases because list is always split into log₂(n) levels and merged in O(n) per level.',
      worst: 'Guaranteed O(n log n); immune to bad worst-case data inputs.',
      space: 'Crucial AQA & GCSE exam point: requires O(n) auxiliary memory to hold merged sublists.',
      stability: 'Stable sort: preserves relative ordering when merge condition uses `<=`.'
    },
    analogy: '✂️ Divide & Conquer (Zipper Teeth)! It chops the list in half again and again until every item is alone in its own 1-item box (a list of 1 is always sorted!). Then it merges neighbouring boxes back together like teeth on a zipper, picking the smaller number each time.',
    description: "Imagine being handed a messy stack of 30 shuffled exam papers. Instead of trying to sort them all at once, you keep splitting the pile in half until you have 30 individual piles with just 1 paper each (a pile of 1 paper is already sorted!). Then you work backwards, picking up two piles at a time, looking at their top papers, and zipping the smaller paper into a neat combined pile. You repeat this pairing up until the whole stack is merged into one ordered pile.",
    pros: [
      'Guaranteed consistent O(n log n) performance for all inputs (best, average, worst).',
      'Stable sorting algorithm.',
      'Highly predictable scaling, essential for large-scale enterprise databases and Big Data.'
    ],
    cons: [
      'Crucial AQA exam point: Requires O(n) auxiliary memory space, unlike in-place algorithms.',
      'Unsuitable for memory-constrained embedded systems (e.g. smart watch, IoT sensor with 2KB RAM).',
      'Higher constant overhead for small lists compared to simple iterative sorts.'
    ],
    examTips: [
      'AQA 8525 Core: Merge Sort is one of ONLY TWO required sorting algorithms on AQA GCSE!',
      'Dividing stage: list is split down to individual elements of length 1 (a list of 1 element is inherently sorted).',
      'Merging stage: two sorted sublists are compared element-by-element and combined into one sorted list.',
      'AQA Disadvantage Mark: "Requires additional memory / auxiliary RAM to store temporary sublists during merging."',
      'AQA Advantage Mark: "Consistent O(n log n) time even in the worst-case scenario."'
    ],
    examQuestions: [
      {
        question: 'Describe how the merge sort algorithm uses the divide and conquer approach to sort a list of numbers. [4 marks]',
        markScheme: 'Mark 1: Repeatedly splits list in half. Mark 2: Continues until sublists contain 1 element. Mark 3: Combines/merges pairs of sublists in sorted order. Mark 4: Repeats merge step until one single sorted list remains.'
      },
      {
        question: 'State one disadvantage of Merge Sort compared to Bubble Sort. [1 mark]',
        markScheme: 'Requires more memory / auxiliary storage space / O(n) additional RAM.'
      }
    ],
    codeSnippets: {
      pseudocode: [
        { line: 1, text: 'function mergeSort(list)', note: 'Divide-and-conquer recursive function' },
        { line: 2, text: '    if length(list) <= 1 then', note: 'Base case: 1 element is already sorted' },
        { line: 3, text: '        return list', note: 'Return single element sublist' },
        { line: 4, text: '    endif', note: 'End base case' },
        { line: 5, text: '    mid = length(list) DIV 2', note: 'Find midpoint to divide list into two halves' },
        { line: 6, text: '    left = mergeSort(sublist(0, mid))', note: 'Recursively sort left half' },
        { line: 7, text: '    right = mergeSort(sublist(mid, length))', note: 'Recursively sort right half' },
        { line: 8, text: '    return merge(left, right)', note: 'Combine two sorted halves into single sorted list' },
        { line: 9, text: 'endfunction', note: 'Recursive split complete' }
      ],
      python: [
        { line: 1, text: 'def merge_sort(arr):', note: 'AQA 8525/1A Python recursive function' },
        { line: 2, text: '    if len(arr) <= 1:', note: 'Base condition: single element' },
        { line: 3, text: '        return arr', note: 'Already sorted by definition' },
        { line: 4, text: '    # divide phase', note: 'Splitting into sublists' },
        { line: 5, text: '    mid = len(arr) // 2', note: 'Integer division midpoint' },
        { line: 6, text: '    left = merge_sort(arr[:mid])', note: 'Recursive left sublist' },
        { line: 7, text: '    right = merge_sort(arr[mid:])', note: 'Recursive right sublist' },
        { line: 8, text: '    return merge(left, right)', note: 'Combine two sorted halves' },
        { line: 9, text: '# end function', note: 'Complete' }
      ],
      csharp: [
        { line: 1, text: 'int[] MergeSort(int[] arr) {', note: 'AQA 8525/1B C# recursive method' },
        { line: 2, text: '    if (arr.Length <= 1)', note: 'Base case' },
        { line: 3, text: '        return arr;', note: 'Return single element' },
        { line: 4, text: '    // divide', note: 'Divide into two halves' },
        { line: 5, text: '    int mid = arr.Length / 2;', note: 'Calculate midpoint' },
        { line: 6, text: '    int[] left = MergeSort(arr[..mid]);', note: 'Sort left slice' },
        { line: 7, text: '    int[] right = MergeSort(arr[mid..]);', note: 'Sort right slice' },
        { line: 8, text: '    return Merge(left, right);', note: 'Merge sorted arrays' },
        { line: 9, text: '}', note: 'End method' }
      ],
      vbnet: [
        { line: 1, text: 'Function MergeSort(arr As Integer()) As Integer()', note: 'AQA 8525/1C VB.NET' },
        { line: 2, text: '    If arr.Length <= 1 Then', note: 'Base condition' },
        { line: 3, text: '        Return arr', note: 'Return single element' },
        { line: 4, text: '    End If', note: 'End If' },
        { line: 5, text: '    Dim mid As Integer = arr.Length \\ 2', note: 'Integer division midpoint' },
        { line: 6, text: '    Dim left = MergeSort(GetSubArray(arr, 0, mid))', note: 'Sort left' },
        { line: 7, text: '    Dim right = MergeSort(GetSubArray(arr, mid, arr.Length))', note: 'Sort right' },
        { line: 8, text: '    Return Merge(left, right)', note: 'Merge two halves' },
        { line: 9, text: 'End Function', note: 'End Function' }
      ]
    },
    get pseudocode() {
      return this.codeSnippets.pseudocode;
    }
  },

  insertion: {
    id: 'insertion',
    name: 'Insertion Sort',
    category: 'Insertion Sort',
    aqaCore: false,
    examBoardRelevance: 'Enrichment & Extension (How Other Coders Sort)',
    complexity: {
      bestTime: 'O(n)',
      averageTime: 'O(n²)',
      worstTime: 'O(n²)',
      space: 'O(1) (In-place)',
      stable: true,
    },
    complexityNotes: {
      best: 'Occurs when list is already sorted; each key element is compared only once with previous item (O(n) comparisons, 0 shifts).',
      worst: 'Occurs when list is reversed; each item i must shift past all i items before it (O(n²) shifts).',
      space: 'In-place sorting requiring only O(1) auxiliary variable (`key`).',
      stability: 'Stable sort: elements with identical values maintain original order.'
    },
    analogy: '🃏 Sorting playing cards in your hand! You look at the unsorted cards on the table one-by-one, pick the next card up, and slide it backwards into its exact right spot among the cards you already hold.',
    description: "Just like sorting a hand of playing cards. You leave your cards face down on the table, pick them up one by one, and slide each new card backwards into its exact correct spot among the cards you are already holding. You repeat this until every card from the table is sitting neatly in order in your hand.",
    pros: [
      'Very efficient for small datasets (n < 30) or nearly sorted lists.',
      'Adaptive: runs in O(n) linear time on sorted or nearly sorted data.',
      'Online algorithm: can sort a streaming list as items arrive one by one.',
      'Low constant factors and in-place memory efficiency.'
    ],
    cons: [
      'Quadratic O(n²) time makes it slow for large datasets.',
      'Performs many element shifts when dealing with reversed data.'
    ],
    examTips: [
      'Concept: Notice how the left part of the list grows one sorted card at a time!',
      'Start the outer loop at index 1 because a single element at index 0 is already considered sorted by definition.',
      'In trace tables, the left portion of the list expands by 1 sorted element after each pass.'
    ],
    examQuestions: [
      {
        question: 'State one advantage of Insertion Sort over Bubble Sort when sorting a nearly-sorted list. [1 mark]',
        markScheme: 'Insertion sort only shifts elements that are out of order, requiring fewer total operations than Bubble Sort.'
      }
    ],
    codeSnippets: {
      pseudocode: [
        { line: 1, text: 'for i = 1 to (length - 1)', note: 'Outer loop: examine each unsorted element from index 1' },
        { line: 2, text: '    key = list[i]', note: 'Store current element to be inserted' },
        { line: 3, text: '    j = i - 1', note: 'Start comparing backwards from the sorted sublist' },
        { line: 4, text: '    while j >= 0 and list[j] > key', note: 'Find insertion point by shifting larger elements' },
        { line: 5, text: '        list[j + 1] = list[j]', note: 'Shift larger element one position to the right' },
        { line: 6, text: '        j = j - 1', note: 'Move index leftwards' },
        { line: 7, text: '    endwhile', note: 'Correct insertion position found at j + 1' },
        { line: 8, text: '    list[j + 1] = key', note: 'Insert key into its sorted slot' },
        { line: 9, text: 'next i', note: 'Advance to next unsorted element' }
      ],
      python: [
        { line: 1, text: 'for i in range(1, len(arr)):', note: 'Loop from index 1 to end' },
        { line: 2, text: '    key = arr[i]', note: 'Extract key item' },
        { line: 3, text: '    j = i - 1', note: 'Pointer to end of sorted sublist' },
        { line: 4, text: '    while j >= 0 and arr[j] > key:', note: 'Shift condition' },
        { line: 5, text: '        arr[j + 1] = arr[j]', note: 'Shift element right' },
        { line: 6, text: '        j -= 1', note: 'Move pointer left' },
        { line: 7, text: '    # insertion slot found', note: 'While loop complete' },
        { line: 8, text: '    arr[j + 1] = key', note: 'Insert key into sorted slot' },
        { line: 9, text: '# end for i', note: 'Complete' }
      ],
      csharp: [
        { line: 1, text: 'for (int i = 1; i < arr.Length; i++) {', note: 'Outer loop' },
        { line: 2, text: '    int key = arr[i];', note: 'Select key' },
        { line: 3, text: '    int j = i - 1;', note: 'Sorted pointer' },
        { line: 4, text: '    while (j >= 0 && arr[j] > key) {', note: 'Shift loop' },
        { line: 5, text: '        arr[j + 1] = arr[j];', note: 'Shift right' },
        { line: 6, text: '        j--;', note: 'Decrement j' },
        { line: 7, text: '    }', note: 'End while' },
        { line: 8, text: '    arr[j + 1] = key;', note: 'Place key' },
        { line: 9, text: '}', note: 'End for' }
      ],
      vbnet: [
        { line: 1, text: 'For i = 1 To (arr.Length - 1)', note: 'Outer loop' },
        { line: 2, text: '    Dim key As Integer = arr(i)', note: 'Store key' },
        { line: 3, text: '    Dim j As Integer = i - 1', note: 'Sorted index' },
        { line: 4, text: '    While j >= 0 AndAlso arr(j) > key', note: 'Compare and shift' },
        { line: 5, text: '        arr(j + 1) = arr(j)', note: 'Shift right' },
        { line: 6, text: '        j = j - 1', note: 'Decrement' },
        { line: 7, text: '    End While', note: 'End While' },
        { line: 8, text: '    arr(j + 1) = key', note: 'Insert key' },
        { line: 9, text: 'Next i', note: 'Next i' }
      ]
    },
    get pseudocode() {
      return this.codeSnippets.pseudocode;
    }
  },

  selection: {
    id: 'selection',
    name: 'Selection Sort',
    category: 'Selection Sort',
    aqaCore: false,
    examBoardRelevance: 'Enrichment & Extension (Minimum Finding)',
    complexity: {
      bestTime: 'O(n²)',
      averageTime: 'O(n²)',
      worstTime: 'O(n²)',
      space: 'O(1) (In-place)',
      stable: false,
    },
    complexityNotes: {
      best: 'Always O(n²) because it must scan the entire remaining unsorted list to find the true minimum, even if already sorted.',
      worst: 'O(n²) comparisons in all cases: n(n-1)/2 comparisons.',
      space: 'In-place sort: O(1) auxiliary space.',
      stability: 'Unstable: long-distance swaps can reorder identical elements.'
    },
    analogy: '🔍 Finding the shortest person in a crowd! It scans the entire unsorted list for the smallest number and swaps it straight into the first spot. Then it repeats for the 2nd spot, 3rd spot, and so on.',
    description: "Imagine looking through a rack of clothes to find the smallest size. You scan through the entire unsorted rack to spot the absolute smallest item, then swap it with whatever is currently hanging in the very first slot. Then you scan the rest of the rack for the second smallest item and put it in the second slot. You repeat this one winner at a time until the entire rack is sorted.",
    pros: [
      'Minimizes the number of writes/swaps: performs at most n - 1 swaps total.',
      'Useful when write operations to flash memory/EEPROM are costly or wear out.',
      'Simple logic and zero auxiliary storage.'
    ],
    cons: [
      'Not adaptive: always takes O(n²) comparisons even if input is already sorted.',
      'Generally slower than Insertion Sort in practice.',
      'Unstable in its standard array implementation.'
    ],
    examTips: [
      'After Pass 1, the absolute SMALLEST element is placed at index 0.',
      'Selection sort always makes exactly n(n-1)/2 comparisons regardless of initial array ordering.'
    ],
    examQuestions: [
      {
        question: 'Compare Selection Sort and Bubble Sort in terms of the number of swaps performed. [2 marks]',
        markScheme: 'Selection sort performs at most n - 1 swaps (at most 1 per pass). Bubble sort can perform up to n(n-1)/2 swaps in worst case.'
      }
    ],
    codeSnippets: {
      pseudocode: [
        { line: 1, text: 'for i = 0 to (length - 2)', note: 'Outer loop: position to fill with next minimum element' },
        { line: 2, text: '    min_index = i', note: 'Assume first unsorted element is minimum' },
        { line: 3, text: '    for j = (i + 1) to (length - 1)', note: 'Inner loop: scan rest of unsorted list' },
        { line: 4, text: '        if list[j] < list[min_index] then', note: 'Found an element smaller than current minimum' },
        { line: 5, text: '            min_index = j', note: 'Update index of minimum element' },
        { line: 6, text: '        endif', note: 'End check' },
        { line: 7, text: '    next j', note: 'Continue scanning' },
        { line: 8, text: '    if min_index != i then', note: 'Only swap if minimum is not already at index i' },
        { line: 9, text: '        temp = list[i]', note: 'Swap minimum into position i' },
        { line: 10, text: '        list[i] = list[min_index]', note: 'Assign minimum element' },
        { line: 11, text: '        list[min_index] = temp', note: 'Place displaced element' },
        { line: 12, text: '    endif', note: 'End swap condition' },
        { line: 13, text: 'next i', note: 'Pass complete: index i is guaranteed sorted' }
      ],
      python: [
        { line: 1, text: 'for i in range(len(arr) - 1):', note: 'Target slot for minimum' },
        { line: 2, text: '    min_idx = i', note: 'Assume i is minimum' },
        { line: 3, text: '    for j in range(i + 1, len(arr)):', note: 'Scan unsorted items' },
        { line: 4, text: '        if arr[j] < arr[min_idx]:', note: 'Found smaller' },
        { line: 5, text: '            min_idx = j', note: 'Update index' },
        { line: 6, text: '        # end if', note: 'End comparison' },
        { line: 7, text: '    # end for j', note: 'End scan' },
        { line: 8, text: '    if min_idx != i:', note: 'Swap check' },
        { line: 9, text: '        temp = arr[i]', note: 'Swap temp' },
        { line: 10, text: '        arr[i] = arr[min_idx]', note: 'Place min' },
        { line: 11, text: '        arr[min_idx] = temp', note: 'Complete swap' },
        { line: 12, text: '    # end if', note: 'Done swap' },
        { line: 13, text: '# end for i', note: 'Sorted slot i' }
      ]
    },
    get pseudocode() {
      return this.codeSnippets.pseudocode;
    }
  },

  quick: {
    id: 'quick',
    name: 'Quick Sort',
    category: 'Divide and Conquer / Partitioning',
    aqaCore: false,
    examBoardRelevance: 'Enrichment & Extension (Fast Pivot Partitioning)',
    complexity: {
      bestTime: 'O(n log n)',
      averageTime: 'O(n log n)',
      worstTime: 'O(n²)',
      space: 'O(log n) (Call stack)',
      stable: false,
    },
    complexityNotes: {
      best: 'Occurs when the chosen pivot consistently splits the list into two equal halves.',
      worst: 'Occurs when pivot is always the smallest or largest element.',
      space: 'Requires O(log n) stack space for recursion; operates in-place without extra list copies.',
      stability: 'Unstable: swapping elements across the pivot can disrupt relative order.'
    },
    analogy: '🎯 The Pivot Teeter-Totter! Pick a target number (the pivot). Push everything smaller to the left, and everything bigger to the right. Repeat on both sides until every number is locked in place!',
    description: "Pick one number to be the 'pivot' (the divider). Then split everyone else into two groups: all smaller numbers are tossed to the left, and all bigger numbers are tossed to the right. The pivot is now locked in its exact permanent spot! You then repeat the same trick on the left group and the right group until every single number is in place.",
    pros: [
      'Fastest general-purpose comparison sort in practice with very small constant factors.',
      'In-place partition requires no large auxiliary array allocations.'
    ],
    cons: [
      'Worst-case performance is O(n²) if pivot selection is poor.',
      'Unstable sort.'
    ],
    examTips: [
      'Partitioning step: rearranges elements so items < pivot go to left, items >= pivot go to right.',
      'The pivot itself is in its final, permanently sorted position once partitioned!'
    ],
    examQuestions: [
      {
        question: 'Explain what happens to the pivot element during the partitioning step of Quick Sort. [2 marks]',
        markScheme: 'Mark 1: Placed between elements smaller than it and elements greater than it. Mark 2: Stays in its final sorted position.'
      }
    ],
    codeSnippets: {
      pseudocode: [
        { line: 1, text: 'procedure quickSort(list, low, high)', note: 'Recursive quicksort within index bounds' },
        { line: 2, text: '    if low < high then', note: 'Base condition: array slice has 2+ elements' },
        { line: 3, text: '        p_idx = partition(list, low, high)', note: 'Partition around pivot and get final pivot index' },
        { line: 4, text: '        quickSort(list, low, p_idx - 1)', note: 'Recursively sort elements to left of pivot' },
        { line: 5, text: '        quickSort(list, p_idx + 1, high)', note: 'Recursively sort elements to right of pivot' },
        { line: 6, text: '    endif', note: 'Base case reached' },
        { line: 7, text: 'endprocedure', note: 'Complete' }
      ],
      python: [
        { line: 1, text: 'def quick_sort(arr, low, high):', note: 'Python recursive quicksort' },
        { line: 2, text: '    if low < high:', note: 'Slice check' },
        { line: 3, text: '        p_idx = partition(arr, low, high)', note: 'Lomuto partition' },
        { line: 4, text: '        quick_sort(arr, low, p_idx - 1)', note: 'Left recursive sort' },
        { line: 5, text: '        quick_sort(arr, p_idx + 1, high)', note: 'Right recursive sort' },
        { line: 6, text: '    # base case', note: 'Subarray sorted' },
        { line: 7, text: '# end procedure', note: 'Finished' }
      ]
    },
    get pseudocode() {
      return this.codeSnippets.pseudocode;
    }
  },

  icbics: {
    id: 'icbics',
    name: "I Can't Believe It Can Sort (ICBICS)",
    category: 'Educational Curiosity',
    aqaCore: false,
    ocrCore: false,
    edexcelCore: false,
    examBoardRelevance: 'Algorithmic Curiosity & Code Analysis (Stanley P. Y. Fung, 2021)',
    complexity: {
      bestTime: 'Θ(n²)',
      averageTime: 'Θ(n²)',
      worstTime: 'Θ(n²)',
      space: 'O(1) (In-place)',
      stable: false,
    },
    complexityNotes: {
      best: 'Always executes exactly n² comparisons and variable swaps regardless of input data.',
      worst: 'Always Θ(n²) - strictly quadratic with zero optimizations.',
      space: 'O(1) auxiliary in-place memory.',
      stability: 'Unstable due to bidirectional swapping over the full length.'
    },
    description: 'A mind-bendingly short, symmetric 2-loop sorting algorithm published by Stanley P. Y. Fung in 2021. Both loops iterate from 0 to n-1.',
    pros: [
      'Remarkably concise: only 4 lines of code.',
      'Symmetric loops require zero boundary arithmetic.'
    ],
    cons: [
      'Executes unnecessary iterations and swaps compared to standard algorithms.',
      'Always Θ(n²) comparisons even if input list is completely sorted.'
    ],
    examTips: [
      'Great for code comprehension questions: "Trace what happens when j is less than i versus when j is greater than i."'
    ],
    examQuestions: [
      {
        question: 'Identify the total number of comparisons made by ICBICS for a list of size n. [1 mark]',
        markScheme: 'Exactly n × n = n² comparisons.'
      }
    ],
    codeSnippets: {
      pseudocode: [
        { line: 1, text: 'for i = 0 to (length - 1)', note: 'Outer loop iterates across entire list' },
        { line: 2, text: '    for j = 0 to (length - 1)', note: 'Inner loop ALSO iterates across entire list (symmetric!)' },
        { line: 3, text: '        if list[i] < list[j] then', note: 'Single conditional swap rule' },
        { line: 4, text: '            swap(list[i], list[j])', note: 'Swap elements i and j' },
        { line: 5, text: '        endif', note: 'End conditional' },
        { line: 6, text: '    next j', note: 'Next inner index' },
        { line: 7, text: 'next i', note: 'Next outer index' }
      ],
      python: [
        { line: 1, text: 'for i in range(len(arr)):', note: 'Outer loop' },
        { line: 2, text: '    for j in range(len(arr)):', note: 'Inner loop' },
        { line: 3, text: '        if arr[i] < arr[j]:', note: 'Swap condition' },
        { line: 4, text: '            arr[i], arr[j] = arr[j], arr[i]', note: 'Pythonic tuple swap' },
        { line: 5, text: '        # end if', note: 'End check' },
        { line: 6, text: '    # end for j', note: 'Next j' },
        { line: 7, text: '# end for i', note: 'Finished' }
      ]
    },
    get pseudocode() {
      return this.codeSnippets.pseudocode;
    }
  }
};

// ---------------------------------------------------------------------
// AQA 9-Mark Extended Response Scenario & Evaluation Guide
// ---------------------------------------------------------------------
export const AQA_NINE_MARK_QUESTION = {
  title: 'AQA GCSE Paper 1 & 2: 9-Mark Extended Response Question',
  scenario: `A software engineering company is commissioned to design two distinct computer systems:
  
• System A (IoT Weather Node): A battery-powered remote weather sensor logging 8 temperature readings per hour. The microcontroller operates with severely limited RAM (2 Kilobytes total).
• System B (Cloud E-Commerce Database): A cloud server processing and sorting an end-of-day transaction audit log containing 250,000 sales records.

Evaluate the suitability of Bubble Sort and Merge Sort for each system. In your answer, you should analyze:
1. Time complexity and scaling behaviour
2. Space (memory) complexity and hardware constraints
3. Suitability and recommendations for System A and System B.`,
  bands: [
    {
      band: 'Level 3 (7–9 marks)',
      desc: 'Thorough, well-developed evaluation of both algorithms covering time and space complexities. Direct application to both System A and System B with clear, justified recommendations.'
    },
    {
      band: 'Level 2 (4–6 marks)',
      desc: 'Sound discussion addressing at least one algorithm and system. Explains either time complexity or space complexity accurately with partially justified conclusions.'
    },
    {
      band: 'Level 1 (1–3 marks)',
      desc: 'Basic identification of isolated facts (e.g. "Merge Sort is faster", "Bubble sort swaps pairs"). Minimal or superficial link to the scenario.'
    }
  ],
  keyPoints: [
    {
      topic: 'System A (IoT Weather Node)',
      recommendation: 'Bubble Sort is the superior choice',
      reasons: [
        'Bubble Sort is an IN-PLACE algorithm with O(1) auxiliary space complexity. It operates directly within the existing array without allocating extra RAM.',
        'With only 8 temperature readings, the O(n²) worst case requires at most 8 × 7 / 2 = 28 comparisons, executing in microseconds.',
        'Merge Sort requires O(n) auxiliary memory and recursive call-stack overhead, creating a serious risk of stack overflow on a 2 KB microcontroller.'
      ]
    },
    {
      topic: 'System B (Cloud Transaction Server)',
      recommendation: 'Merge Sort is overwhelmingly superior',
      reasons: [
        'For 250,000 records, Merge Sort O(n log n) executes approximately 250,000 × 18 ≈ 4.5 million operations (a fraction of a second).',
        'Bubble Sort O(n²) would require approximately (250,000)² / 2 ≈ 3.125 × 10¹⁰ operations, taking several hours or crashing.',
        'The cloud server has gigabytes of RAM available, making Merge Sort\'s O(n) auxiliary memory requirement completely negligible.'
      ]
    }
  ],
  modelAnswer: `For System A (the IoT Weather Sensor), Bubble Sort is the most appropriate choice. Although Bubble Sort has a quadratic time complexity of O(n²), the dataset is minuscule (only 8 items). 28 comparisons will execute in less than a millisecond on any modern microcontroller. Crucially, the hardware has only 2 KB of total RAM. Bubble Sort is an in-place sort requiring O(1) auxiliary memory. Merge Sort, by contrast, requires O(n) additional memory to store temporary sub-arrays and adds recursive call-stack frames, which could exhaust the microcontroller's tiny 2 KB memory and cause a hardware crash. Furthermore, if the temperature readings arrive mostly in sequence, an early-exit Bubble Sort can complete in O(n) time.

For System B (the Cloud E-Commerce Server), Merge Sort is decisively superior. With 250,000 transaction records, Bubble Sort's O(n²) complexity would demand over 31 billion operations, causing unacceptable database timeouts and CPU bottlenecks. In contrast, Merge Sort guarantees consistent O(n log n) performance across best, average, and worst cases, sorting the 250,000 items in roughly 4.5 million operations. Cloud database servers possess plentiful RAM (gigabytes or terabytes), so Merge Sort's O(n) auxiliary memory requirement is easily accommodated. Therefore, Merge Sort is the only viable production solution for System B.`
};
