# GCSE Computer Science Sorting Visualizer & Learning Lab 🎓⚡

An interactive, responsive, zero-dependency educational web application designed to help secondary school students master sorting algorithms for their UK GCSE Computer Science exams (**AQA 8525**).

Runs 100% client-side in modern browsers, Chromebooks, iPads, and smartphones with zero server setup.

---

## 🌟 Key Features

### 1. Dual Interactive Visualization Modes
- **Mode A: Sleek Animated Bars**:
  - High-resolution, rounded vertical bars with numbers labeled above/inside.
  - Standardized color-coding:
    - **Base element**: Soft steel blue / indigo (`#4f46e5`).
    - **Comparison**: Glowing amber / orange (`#fbbf24`).
    - **Swap / Shift**: Vibrant coral / red (`#ef4444`).
    - **Pivot / Key**: Orchid purple (`#c084fc`).
    - **Confirmed Sorted**: Emerald green (`#10b981`).
  - Active pointer arrows and divide-and-conquer subarray bracket highlights.
- **Mode B: Vertical Image Slice Sorting**:
  - Slices an image vertically into $N$ strips and scrambles them.
  - As the algorithm sorts the strips, subtle top/bottom indicator tabs highlight active comparisons and swaps.
  - **No green lines** ruin the image: the assembled image itself is the visual reward, framed by a celebratory perimeter glow on completion!
  - Includes a built-in default retro 80s synthwave sunset canvas generator, plus a drag-and-drop / file upload button for any family photo or pet picture (PNG, JPG, WebP).

---

### 2. Core Educational & GCSE Exam Features
- **Official Exam Pseudocode Tracer**:
  - Synchronized line-by-line tracer matching the AQA 8525 exam specification.
  - Bright active line highlight with live variable inspector (`i`, `j`, `key`, `left`, `right`, `mid`, `pivot`, `swapped`).
  - Real-time examiner notes explaining the mark scheme context of each operation.
- **Pass-by-Pass Trace Table Generator**:
  - Dedicated **"Next Pass"** button (`[P]`) that advances one full outer loop pass.
  - Interactive Trace Table logging array state pass-by-pass (Initial, Pass 1, Pass 2, ...), exactly mirroring the 3–5 mark questions on GCSE exam papers.
  - Click any pass row in the table to jump the visualizer straight to that pass.
  - One-click **Copy Table as Markdown or CSV** for homework, Microsoft Word, or Google Docs.
- **Interactive "Predict the Next Move" (Quiz / Active Recall Mode)**:
  - Toggleable quiz mode (`[Q]`) that pauses at critical branch points to challenge students:
    - *"Will elements at index 3 (45) and index 4 (12) swap?"*
    - *"Which element will be chosen as the partition pivot?"*
    - *"Where will the key element be inserted?"*
  - Instant feedback reinforcing the exam mark scheme, score counters, streak tracking, and estimated GCSE Grade 1–9 progression.
- **Split-Screen "Race / Compare" Mode**:
  - Run two algorithms side-by-side on the exact same randomized dataset.
  - Real-time comparison count, swap/move count, and timer to visually demonstrate why an $O(n \log n)$ divide-and-conquer algorithm outperforms an $O(n^2)$ algorithm.
- **GCSE Revision Fact Cards & Practice Lab**:
  - Full complexity matrix: Best, Average, and Worst-case time, Auxiliary space memory ($O(1)$ vs $O(n)$), and Stability.
  - Common exam traps and tips.
  - Past-paper style questions with expandable official mark schemes.
  - Full comparison cheat sheet across all algorithms.

---

### 3. Native Web Audio Procedural Synthesizer
- Built using the native **Web Audio API** (`AudioContext`, `OscillatorNode`, `GainNode`) — zero external sound files.
- **Pitch = Value**: Logarithmic frequency mapping $f = f_{\min} \cdot (f_{\max}/f_{\min})^{\text{norm}}$ from 180 Hz to 1100 Hz.
- **Pleasant Harmonic Timbre**: Warm kalimba/marimba chimes (fundamental + soft 2nd/3rd harmonics) with gentle exponential decay.
- **Mechanical Clicks** mode and **Mute** option.
- **Celebratory Fanfare**: Ascending arpeggio sweep + confetti when sort completes!

---

### 4. Algorithms Supported
1. **Bubble Sort** ($O(n^2)$) — with early-exit `swapped == False` optimization.
2. **Insertion Sort** ($O(n^2)$).
3. **Selection Sort** ($O(n^2)$).
4. **Merge Sort** ($O(n \log n)$) — with visual divide-and-conquer subarray highlighting.
5. **Quick Sort** ($O(n \log n)$) — with Lomuto partition and pivot tracking.
6. **I Can't Believe It Can Sort (ICBICS)** ($\Theta(n^2)$) — Stanley P. Y. Fung's symmetric 2-loop curiosity.

---

## ⌨️ Keyboard Shortcuts
| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause algorithm |
| `S` or `→` | Single Step forward |
| `←` | Single Step backward |
| `P` | Next Pass (advances 1 full outer loop) |
| `R` | Reset to initial state |
| `M` | Cycle Audio (Chimes ➔ Clicks ➔ Mute) |
| `Q` | Toggle Active Recall Quiz Mode |
| `?` | Open Keyboard Shortcuts Modal |

---

## 🚀 Getting Started

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production (outputs to /dist)
npm run build
```

### Static 1-Click Deployment
The build output in `/dist` is completely static and ready for 1-click hosting on:
- **GitHub Pages**: Push the repository and set GitHub Pages source to `dist/` or deploy via GitHub Actions.
- **Vercel**: Run `vercel` or link your repository (Build command: `npm run build`, Output directory: `dist`).
- **Netlify**: Drag and drop the `dist/` folder into Netlify Drop or link the Git repository.
- **School USB / Chromebook Offline Storage**: Double-click `dist/index.html` directly or serve locally.
