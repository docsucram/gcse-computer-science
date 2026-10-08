# GCSE Computer Science — Design & Editorial Guide

> **Core Mission:**
> Build a site that genuinely hooks a 14–15 year old learning computing—inspiring them with how computers actually work under the hood. 
> 
> It should be a place students return to for fun and curiosity beyond strict exam cramming: a collection of tactile, high-quality edutainment sims you'd want to fiddle with or show off to your friends.
> 
> It directly supports the **AQA GCSE Computer Science** syllabus (with room for curious stretch), mapping cleanly alongside the CGP revision guide so students can reinforce their reading with interactive intuition—without ever feeling like a stuffy, corporate textbook.

---

## 1. Types of Content

The platform balances three main types of content across every module:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. VISUALISATIONS                                                      │
│ Crystal-clear animated explainers that break complex algorithms and    │
│ internal processes down step-by-step (e.g. Binary Search, F-D-E cycle).│
├────────────────────────────────────────────────────────────────────────┤
│ 2. SANDBOX SIMULATIONS                                                 │
│ Edutainment "toys" and open-ended sandboxes with rich feature sets     │
│ to experiment with (e.g. CPU architecture, packet routing, RLE).       │
│ Should be the sort of thing students return to explore even when not   │
│ actively revising for an exam.                                         │
├────────────────────────────────────────────────────────────────────────┤
│ 3. DEDICATED REVISION PAGES                                            │
│ Every module includes a dedicated Revision tab featuring high-yield    │
│ exam cards, scannable bullet points, mark scheme rules, and traps.     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Structure & Syllabus Alignment (CGP Parallel)

- **Curriculum Anchor**: Aligned primarily with the **AQA 8525** syllabus (Paper 1 & Paper 2).
- **Match the CGP Revision Book Flow**: Where possible, structure topics and terminology parallel to the popular CGP AQA Revision Guide so students studying from the book can immediately jump into the corresponding simulation.
- **Subtle, Not Stuffy**: Keep syllabus badge codes (`AQA 8525 §3.1`) neat, small, and discreet. Never let exam bureaucracy overpower the excitement of the interactive tool. Confine badges to the universal header; don't fill page content with repetitive exam bureaucracy.
- **Room for Stretch**: Include concepts that go slightly beyond the minimum syllabus requirements when they make the simulation cooler or spark genuine interest in computer science (e.g. A-level concepts like hash collisions, public-key math, or 64-bit architectures).

---

## 3. Freedom & Fun: The "Edutainment First" Rule

Simulations and visualizers should **never be overly constrained by rigid UI dogmatism**. Above all, they must be engaging, tactile, and rewarding to interact with. A sim or visualization does not have to conform to rigid form rules if breaking them makes the tool more intuitive or fun.

Embrace playful, high-agency features:
- **Head-to-Head Duels & Races**: Put algorithms against each other (e.g. Binary Search vs Linear Search, or Bubble vs Merge) with live comparative metrics.
- **Playful Scenarios & Real-World Context**: Real-world framing (e.g. a school MIS portal for databases, fibre-optic ocean cables for packet routing) and fun edge cases.
- **Context-Aware Interactions**: In sandboxes (like the Network Builder), avoid separate "Move" tools where a simple click-and-drag on an existing node is more natural.
- **Immediate State Feedback**: When mutating data (e.g. inserting, updating, or deleting database records), highlight changed rows immediately with clear visual feedback (green/red accents).
- **Customization & Input Freedom**: Let students type their own arrays, upload custom images to the bitmap/compression canvas, scramble data, or craft custom assembly routines.
- **Delight & Celebration**: Reward success with satisfying visual feedback—such as a crisp burst of confetti on solving a search or cracking a challenge.
- **Tactile Sound & Motion** *(where appropriate)*: Optional subtle audio clicks for bus pulses or compares, smooth spring animations, and responsive hover lifts.

---

## 4. What We Reject (The "AI Traps" to Avoid)

When tools and visualizers are built with generic AI defaults, they quickly become sterile and alienating. We deliberately avoid:

1. **No generic AI "marshmallow" cards**: No bloated `rounded-3xl` bubble containers with giant blurry drop shadows. Use crisp 2px–4px radii and clean drafting borders.
2. **No corporate SaaS clichés**: Avoid looking like an enterprise cloud settings screen filled with neon cyan/magenta gradients on pitch black. Dark mode should feel like a deep, elegant slate notebook.
3. **No eye-straining pure white**: Avoid harsh `#ffffff` backdrops in light mode. Use warm, natural drafting paper substrates (`#f5f3ec` / `#f8fafc`).
4. **No emoji spam**: Avoid childish emoji stuffing (🚀, 🧠, 💡, ⚡) in headers and card titles. Rely on sharp typography, clear layout, and clean SVG icons.
5. **No preachy academic lecturing**: Never write patronizing filler like *"Let's delve into this topic"*, *"Mastering this concept is vital"*, or preachy lecture callout boxes.
6. **No cluttered headers**: Top headers should remain clean and editorial. All interactive controls, sliders, target selectors, and reset buttons belong inside the self-contained application workbench.
7. **No nested container hell (boxes in boxes in boxes)**: Limit hierarchy to a card and its inner controls. Never nest containers three levels deep. Always question whether an extra container wrapper improves clarity or just adds visual clutter.
8. **No UI instructions masquerading as intros**: View banners must never just say *"Click the switches below to toggle bits"*. They must introduce the actual computer science concept.

---

## 5. Visual Palette & Typography

### Light Mode: The "Warm Drafting Paper & Inks" Substrate
The design language is inspired by physical British notebooks, drafting benches, and high-end print revision guides:

- **Canvas Substrate**: `#f5f3ec` / `#f8fafc` (warm drafted paper) with an optional subtle faint grid (`rgba(0, 0, 0, 0.03)`).
- **Surface / Card**: `#fdfcf9` / `#ffffff` (clean unbleached card stock).
- **Recessed Tray / Control Bay**: `#ede8db` / `#f1f5f9` (for toolbars, slotted card shelves, discarded zones).
- **Drafting Borders**: `#ded7c6` / `#e2e8f0` (subtle partition) and `#c2b8a3` / `#cbd5e1` (tool inputs & active borders).

### Dark Mode: The "Deep Slate Notebook" Substrate
Dark mode is fully supported across all modules with strict WCAG AA/AAA contrast:

- **Canvas Substrate**: `#11141a` (deep midnight slate).
- **Surface / Card**: `#181c24` / `#1e2229` (elevated slate surface).
- **Recessed Tray / Inputs**: `#13171f` / `#161a22`.
- **Drafting Borders**: `#2e3646` / `#374151` (subtle slate borders).
- **Primary Text**: `#f3f4f6` (crisp, high-contrast light ink).
- **Secondary Text**: `#9ca3af` / `#cbd5e1` (readable pencil annotations).

### Natural Printing Inks
- **Primary Ink**: `#1e2229` (light mode) / `#f3f4f6` (dark mode).
- **Secondary Ink**: `#585e6b` (light mode) / `#9ca3af` (dark mode).
- **Faint / Index Ink**: `#8e95a2` (card indices, array slots, bus numbers).

### Highlighters & Accents
- **Oxford Navy (`#1e3a5f` / `#2563eb`)**: Primary brand identity, hub navigation, spec badges.
- **Isaac Magenta (`#c8006b`)**: Active view tabs, interactive highlights, primary calls to action.
- **Forest Green (`#1a6b3c` / `#10b981`)**: Successful matches, sorted state, verified parity, success badges.
- **Cardinal Red (`#a82020` / `#ef4444`)**: Eliminated partitions, search mismatches, corrupted packets, deletion warnings.
- **Amber / Terracotta (`#b45309` / `#f5b700`)**: Midpoint pivots, active pointers, exam tip callouts.

### Typography
- **Headings & Titles**: Editorial Serif (`Newsreader`, Georgia) — gives weight, physical guide feel, and distinguished character.
- **Controls & Interface**: Clean, legible Sans (`Plus Jakarta Sans` or Inter) — weights 500 to 700.
- **Code, Data & Registers**: Monospace (`JetBrains Mono`) — for indices, binary registers, memory addresses, and trace table values.

---

## 6. Tone of Voice & The 1–2 Sentence Concept Rule

Explanations and notes should talk **to** the student like a smart, older sibling or engaging tutor, not a lecturing professor.

1. **The 1–2 Sentence Banner Rule**: Every view or tab header must feature a concise introductory summary of **no more than a couple of sentences** explaining **what** the concept is and **why** computers work that way.
   - *Good (Pseudo-random Numbers)*: *"Computers cannot produce true random numbers by themselves. Although the numbers that computers produce may look random, if you start with the same seed value they will always follow the exact same predictable pattern."*
   - *Good (Procedural Generation)*: *"When computers generate data, like a game world, automatically using algorithms it is called procedural generation. Computers take a seed value and generate pseudo-random numbers from it to power this procedural generation. Explore this below."*
   - *Bad (UI instruction)*: *"Click the switches below to toggle 1s and 0s and watch the values calculate live."*
2. **Vivid Analogies, No Cliches**: Explain what the algorithm or concept actually does in plain English using vivid, memorable analogies (e.g. the Paint Pot Analogy for Diffie-Hellman key exchange). Never write condescending labels like *"Explained in Plain English"* or *"ELI5 text"*.
3. **Precise Technical Vocabulary**: Use official exam terminology (`subroutine`, `arithmetic logic unit`, `encapsulation`, `foreign key`), bolding key terms. Keep explanations clear and free of unnecessary fluff.
4. **Focused Exam Traps**: Highlight the exact traps students lose marks on in exams. Keep detailed exam tips on the dedicated Revision page or at the conclusion of a topic.

---

## 7. Universal Header Architecture

Every module shares an identical, cohesive header structure across the platform:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [← Back to Hub]  [Icon] Module Title  [AQA 8525 §X.X]  |  [Tab 1] [Tab 2] [Tab 3] [Revision]  |  [☼/☾] │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Brand & Back Link**: Crisp `← Back to Hub` link returning to the main portal.
2. **Icon Badge Matching Front Page**: An SVG icon matching the exact module card icon on `index.html`.
3. **Module Title**: Distinguished typography with neat, discreet AQA specification badge (`AQA 8525 §3.x`).
4. **View Tab Navigation**: Centered or inline `.view-tab-btn` buttons featuring an SVG icon and title. Active tabs highlight in berry magenta (`#c8006b`).
5. **Theme Toggle**: Right-aligned `#themeToggleBtn` toggling between Light and Dark mode with instantaneous persistence via `localStorage`.

---

## 8. Dedicated Revision Page Standard

**Every module must include a dedicated "Revision" tab.** It should contain:

1. **Core Concept & Formula Cards**: Scannable, structured cards summarizing the foundational laws (e.g. binary arithmetic rules, colour depth formulas, packet anatomy, F-D-E register roles).
2. **Paper 1 vs Paper 2 Clarity**: Clear labelling indicating whether the topic is tested in Paper 1 (Computational Thinking & Programming) or Paper 2 (Computing Concepts).
3. **Exam Traps & Mark Scheme Rules**: Highlighted warning callouts detailing common student pitfalls (e.g. sign-bit overflow in Two's Complement, decimal vs binary prefix divisions, only writing on value changes in trace tables).
4. **Past-Paper Practice / Model Answers**: Collapsible model answers showing how marks are awarded by exam boards (e.g. 1 Mark / 2 Mark breakdowns).

---

## 9. Contrast & Legibility Guardrails (Strict WCAG Standard)

Clear legibility is non-negotiable for students revising on varied screens (smartphones, dim classroom projectors, Chromebooks with poor color gamut):

### 1. The "No Tint-on-Tint" Rule
- **Never put pale text on a light tint background**: e.g., never light pink text on a light pink pill (`text-rose-300` on `bg-rose-100`).
- Status pills and condition flags MUST use **deep, saturated inks** on soft tints:
  - `True` / Condition met / Swap needed: `#991b1b` (Crimson) on `#fee2e2` (Soft pink) $\rightarrow$ **8.2:1 contrast (AAA)**.
  - `False` / Unchanged: `#374151` (Slate) on `#ede8db` (Drafting tray) $\rightarrow$ **5.4:1 contrast (AA)**.
  - Match / Found: `#14532d` (Deep forest) on `#dcfce7` (Soft mint) $\rightarrow$ **8.5:1 contrast (AAA)**.

### 2. The "No Grey-on-Grey" Rule
- Toolbars, footnotes, table footers, and note boxes must NEVER place grey text on a muted grey backdrop (e.g. `text-slate-400` on `bg-slate-950/20`).
- Recessed drafting trays (`#ede8db`) must always pair with rich charcoal ink `#1e2229` or deep Oxford Navy `#1e3a5f` ($\ge 10:1$ contrast).
- In dark mode, muted text must be at least `#9ca3af` or `#cbd5e1` on `#181c24` ($\ge 5:1$ contrast).

### 3. The "No Pale Numbers on Yellow" Rule
- Highlighted rows, active cards, or warning boxes on yellow/amber (`#fef3c7`) must NEVER use light grey (`#8e95a2`), pale yellow, or amber-300 for numbers, line indices, or labels.
- Any text or digits on amber backgrounds must be deep terracotta/brown (`#78350f` or `#92400e`, $>7:1$ contrast) or solid charcoal (`#1e2229`).

### 4. Data & Array Value Crispness
- Array elements, variable values, and numbers in trace tables must always render in solid primary ink (`#1e2229`), deep navy (`#1e3a5f`), or purple (`#6b21a8`) in light mode, and crisp `#f3f4f6` in dark mode—never faded grey.

---

## 10. Development Roadmap & Future Edutainment Sims

The following high-impact sim ideas are scheduled to address syllabus gaps:

1. **Interactive Logic Gate Breadboard (§3.4.3) — [In Active Development]**:
   - Virtual breadboard to wire AND, OR, NOT, XOR gates with switches and glowing LEDs.
   - Live auto-evaluating truth tables highlighting active input combinations.
   - Challenge/puzzle mode with real GCSE scenarios (smart greenhouse, bank vault alarm, half adder).
2. **Cyber Security "Red Team / Blue Team" Sandbox (§3.6)**:
   - Interactive attack-defense terminal covering social engineering/phishing email inspection, brute-force vs dictionary cracking times, and unencrypted HTTP packet sniffing vs HTTPS TLS.
3. **Flowchart Execution Engine & Gamified Maze (§3.1 & §3.2)**:
   - Visual flowchart builder following strict AQA standard shapes (Terminators, Processes, Decision rhombuses, I/O parallelograms).
   - Autonomous rover navigating a maze with glowing execution tokens and live variable trace tables.
4. **Web Audio Synthesizer & Sampling Studio (Upgrade for §3.3.2)**:
   - Interactive oscilloscope with real Web Audio API playback letting students hear sample rate changes (8 kHz vs 44.1 kHz) and bit depth crush (4-bit vs 16-bit).
5. **Forensic Debugger / Bug Bounty Game for Trace Tables (§3.2)**:
   - Algorithm crime scenes where students diagnose off-by-one errors and rogue variables using interactive trace tables before catastrophic simulation failures.

