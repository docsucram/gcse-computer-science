# GCSE Computer Science — Design & Editorial Guide

> **Core Mission:**
> Build a site that genuinely hooks a 14–15 year old learning computing—inspiring them with how computers actually work under the hood. 
> 
> It should be a place students return to for fun and curiosity beyond strict exam cramming: a collection of tactile, high-quality edutainment sims you'd want to fiddle with or show off to your friends.
> 
> It directly supports the **AQA GCSE Computer Science** syllabus (with room for curious stretch), mapping cleanly alongside the CGP revision guide so students can reinforce their reading with interactive intuition—without ever feeling like a stuffy, corporate textbook.

---

## 1. Types of Content

The platform balances different main types of content:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. VISUALISATIONS                                                      │
│ Crystal-clear animated explainers that break complex algorithms and    │
│ internal processes down step-by-step (e.g. Binary Search, F-D-E cycle).│
├────────────────────────────────────────────────────────────────────────┤
│ 2. SANDBOX SIMULATIONS                                                 │
│ Edutainment "toys" and open-ended sandboxes with rich feature  │
│ sets to experiment with (e.g. CPU architecture, packet routing, RLE).
│ Should be the sort of thing people want to come back and experiment with even when nor actively looking to learn. 
├────────────────────────────────────────────────────────────────────────┤
│ 3. CGP-STYLE REVISION NOTES                                            │
│ Short, punchy explainers that introduce each sim and distill the key   │
│ exam points into scannable bullets, real-world numbers, and exam traps.│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Structure & Syllabus Alignment (CGP Parallel)

- **Curriculum Anchor**: Aligned primarily with the **AQA 8525** syllabus.
- **Match the CGP Revision Book Flow**: Where possible, structure topics and terminology parallel to the popular CGP AQA Revision Guide so students studying from the book can immediately jump into the corresponding simulation.
- **Subtle, Not Stuffy**: Keep syllabus badge codes (`AQA 3.1.1`) neat, small, and discreet. Never let exam bureaucracy overpower the excitement of the interactive tool. Mainly keep this to the universal top header/ front page navigation. Don't fill page with text going 'AQA this and AQA that' 
- **Room for Stretch**: Include concepts that go slightly beyond the minimum syllabus requirements when they make the simulation cooler or spark genuine interest in computer science. e.g.  A-level topics.

---

## 3. Freedom & Fun: The "Edutainment First" Rule

Simulations and visualizers should **never be overly constrained by rigid UI dogmatism**. Above all, they must be engaging, tactile, and rewarding to interact with. a sim or visulasation does not have to conform to other guidelines if it'd improve it. 

Embrace playful, high-agency features:
- **Head-to-Head Duels & Races**: Put algorithms against each other (e.g. Binary Search vs. Linear Search, or Bubble vs. Merge) with live comparative metrics.
- **Playful Scenarios & Easter Eggs**: Silly algorithms (like *"I Can't Believe It Can Sort"*, Bogo Sort, or Sleep Sort), humorous edge cases, and unexpected data behaviors.
- **Customization & Input Freedom**: Let students type their own arrays, upload custom images to the bitmap/compression canvas, scramble data, or craft custom assembly routines.
- **Delight & Celebration**: Reward success with satisfying visual feedback—such as a crisp burst of confetti on solving a search or cracking a challenge.
- **Tactile Sound & Motion** *(where appropriate)*: Optional subtle audio clicks for bus pulses or compares, smooth spring animations, and responsive hover lifts.

---

## 4. What We Reject (The "AI Traps" to Avoid)

When tools and visualizers are built with generic AI defaults, they quickly become sterile and alienating. We deliberately avoid:

1. **No generic AI "marshmallow" cards**: No bloated `rounded-3xl` bubble containers with giant blurry drop shadows. Use crisp 2px–4px radii and clean drafting borders.
2. **No dark-mode SaaS dashboards**: Avoid looking like a corporate cloud settings screen (`slate-900`/`zinc-950` with neon cyan/purple accents).
3. **No eye-straining pure white**: Avoid harsh `#ffffff` backdrops. Use warm, natural drafting paper substrates.
4. **No emoji spam**: Avoid childish emoji stuffing (🚀, 🧠, 💡, ⚡) in headers and cards. Rely on sharp typography, clear layout, and focused interactive graphics.
5. **No preachy academic lecturing**: Never write patronizing filler like *"Let's delve into this topic"*, *"Mastering this concept is vital"*, or preachy lecture callout boxes.
6. **No cluttered headers**: Top headers should remain clean and editorial. All interactive controls, sliders, target selectors, and reset buttons belong inside the self-contained application workbench.

---

## 5. Visual Palette & Typography

### The "Warm Drafting Paper & Inks" Substrate
The design language is inspired by physical British notebooks, drafting benches, and high-end print revision guides:

- **Canvas Substrate**: `#f5f3ec` (warm drafted paper) with an optional subtle 32px faint grid (`rgba(0, 0, 0, 0.03)`).
- **Surface / Card**: `#fdfcf9` (clean unbleached card stock).
- **Recessed Tray / Control Bay**: `#ede8db` (for toolbars, slotted card shelves, discarded zones).
- **Drafting Borders**: `#ded7c6` (subtle partition) and `#c2b8a3` (tool inputs & active borders).

### Natural Printing Inks
- **Primary Ink**: `#1e2229` (rich charcoal text, easier on the eyes than `#000000`).
- **Secondary Ink**: `#585e6b` (pencil annotations, descriptive subtitles).
- **Faint / Index Ink**: `#8e95a2` (card indices, array slots, bus numbers).

### Highlighters (Rich, Non-Neon)
- **Oxford Navy (`#1e3a5f`)**: Core navigation, active mode tabs, primary actions, spec badges.
- **Forest Green (`#1a6b3c`)**: Successful matches, sorted state, verified parity, success buttons.
- **Cardinal Red (`#a82020`)**: Eliminated partitions, search mismatches, corrupted packets, warnings.
- **Amber / Terracotta (`#b45309`)**: Midpoint pivots, active pointers, exam tip callouts (`#fef3c7` tint).

### Typography
- **Headings & Titles**: Editorial Serif (`Newsreader`, Georgia) — gives weight, physical guide feel, and distinguished character.
- **Controls & Interface**: Clean, legible Sans (`Plus Jakarta Sans` or Inter) — weights 500 to 700.
- **Code, Data & Registers**: Monospace (`JetBrains Mono`) — for indices, binary registers, memory addresses, and trace table values.

---

## 6. Tone of Voice: The CGP Revision Standard

Explanations and notes should talk **to** the student like a smart, older sibling or engaging tutor, not a lecturing professor.

1.   Explain what the algorithm or concept actually does in plain English using vivid, memorable analogies. Highlight key terms in **bold**. But never write 'Explained in Plain English' or 'ELI5 text' 
2. Use key technical words, but make sure they are clear and don't fill text with Jargon. Make use of clear, precise bullet points where reasonable to highlight key things to remember. 
3. On revision page if there is a key exam thing to highlight    A focused amber callout highlighting the exact mistake students regularly lose marks on in exams. Normally keep exam tips like on a revision page, or at the end. of a page. 
4. Don't try to be too cool for school, don't call anything 'Lab' or 'Laboratory' or 'Experiment hub' Write like a human and  don't lay on analogies too thick. 

---

## 7. Interactive Workbench Pattern

While simulations have full creative freedom, interactive pages benefit from a familiar layout hierarchy:

1. **Header**: Minimalist and text-only (discreet syllabus pill + serif title + one-sentence plain-English summary).
2. **Workbench Chassis**:
   - **Top Command Bar**: Mode switches (e.g. Duel vs Single) and self-contained controls (New Numbers, Scramble, Target, Speed).
   - **Stage HUD**: Live telemetry (Checks, Swaps, Clock Cycles, List Size, Worst Case).
   - **Interactive Arena**: Tactile cards, animated memory cells, draggable packets, or register buses.
   - **Narrative Strip**: Step-by-step plain-English play-by-play + active formula preview.
   - **Playback Bar**: Standard controls (`Next Step →`, `Auto Play`, `Reset`) and step counter.
3. **Revision Summary Deck**:
   - Clean 2-column comparative notes (e.g. Binary vs. Linear) following the CGP Paragraph + Bullets + Exam Trap format.

---

## 8. Contrast & Legibility Guardrails (Strict WCAG Standard)

Clear legibility is non-negotiable for students revising on varied screens (smartphones, dim classroom projectors, Chromebooks with poor color gamut). Every visual element must maintain sharp contrast:

### 1. The "No Tint-on-Tint" Rule
- **Never put pale text on a light tint background**: e.g., never light pink text on a light pink pill (`text-rose-300` on `bg-rose-100`).
- Status pills and condition flags MUST use **deep, saturated inks** on soft tints:
  - `True` / Condition met / Swap needed: `#991b1b` (Crimson) on `#fee2e2` (Soft pink) $\rightarrow$ **8.2:1 contrast (AAA)**.
  - `False` / Unchanged: `#374151` (Slate) on `#ede8db` (Drafting tray) $\rightarrow$ **5.4:1 contrast (AA)**.
  - Match / Found: `#14532d` (Deep forest) on `#dcfce7` (Soft mint) $\rightarrow$ **8.5:1 contrast (AAA)**.

### 2. The "No Grey-on-Grey" Rule
- Toolbars, footnotes, table footers, and note boxes must NEVER place grey text on a muted grey backdrop (e.g. `text-slate-400` on `bg-slate-950/20`).
- Recessed drafting trays (`#ede8db`) must always pair with rich charcoal ink `#1e2229` or deep Oxford Navy `#1e3a5f` ($\ge 10:1$ contrast).

### 3. The "No Pale Numbers on Yellow" Rule
- Highlighted rows, active cards, or warning boxes on yellow/amber (`#fef3c7`) must NEVER use light grey (`#8e95a2`), pale yellow, or amber-300 for numbers, line indices, or labels.
- Any text or digits on amber backgrounds must be deep terracotta/brown (`#78350f` or `#92400e`, $>7:1$ contrast) or solid charcoal (`#1e2229`).

### 4. Data & Array Value Crispness
- Array elements, variable values, and numbers in trace tables must always render in solid primary ink (`#1e2229`), deep navy (`#1e3a5f`), or purple (`#6b21a8`), never faded grey.

