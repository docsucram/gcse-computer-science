# GCSE Computer Science — Interactive Revision & Learning Platform

An interactive revision suite and learning lab built for GCSE Computer Science students (aligned with **AQA 8525**, **OCR J277**, and **Edexcel** specifications).

Designed with an edutainment philosophy — turning abstract syllabus concepts into tactile, visual, and highly responsive interactive simulations.

![GCSE Computer Science Hub](favicon.svg)

---

## 🌟 Interactive Modules

### 1. 📊 Sorting Algorithms Lab (AQA §3.1 / OCR 2.1)
- **Visualizers**: Bubble Sort, Merge Sort, and Linear / Binary Search.
- **Features**: Step-by-step playback, comparisons vs. swaps telemetry counters, intuitive step explanations, and an interactive step-by-step decision quiz.

### 2. 📋 Design and Testing (AQA §3.1 & §3.2)
- **Interactive Trace Tables**: Live line-by-line code execution engine with synchronized memory state watchers and exam practice mode.
- **Structuring Code into Modules**: Interactive decomposition workbench where students analyze programs to identify modules, understand the role of the Main Module, and practice refactoring.
- **Exam Traps**: While-loops, linear searches, count-controlled iterations, modulo operations, and boolean flags.

### 3. 🔢 Data Representation: Numbers & Characters (AQA §3.3.1 & §3.3.2)
- **Binary Conversion Switchboard**: Interactive 8-bit registers with real-time decimal, binary, and hexadecimal translation.
- **Signed Binary & Two's Complement**: Visual sign bit manipulation and negative number arithmetic.
- **Character Sets**: ASCII and Unicode (UTF-8) character exploration and binary inspection.
- **Huffman Coding Lab**: Dynamic Huffman tree visualization with frequency weightings, interactive branch traversal, and bit efficiency calculation.

### 4. 🖼️ Digital Media & Data Compression (AQA §3.3.3 / OCR 1.2)
- **Bitmap Matrix & Pixel Grid**: Real-time resolution and color depth controls (1-bit monochrome up to 24-bit TrueColor) with live storage calculations.
- **Run-Length Encoding (RLE)**: Interactive RLE compression visualizer with two-way synchronized hover highlighting between compressed tokens and pixel blocks.
- **Digital Sound Sampling**: Sampling rate (Hz) and bit depth (resolution) visualizer with custom waveform generators and playback.

### 5. 💻 CPU Architecture & Von Neumann Simulator (AQA §3.4.1 / OCR 1.1)
- **Fetch-Decode-Execute Simulator**: Complete architectural flow with glowing animated bus conduits (Address Bus, Data Bus, Control Bus) and dynamic data capsules.
- **Color-Coded Registers**: Program Counter (PC), Memory Address Register (MAR), Memory Data Register (MDR), Current Instruction Register (CIR), and Accumulator (ACC) with real-time read/write pulse animations.
- **Performance Sandbox**: Interactive clock speed, core count, and cache level simulations.
- **Storage & Memory Workbench**: Mechanical hard drive vs solid-state drive simulation with file allocation tables, fragmentation, defragmentation, and realistic file overwriting.

### 6. 🗄️ Relational Databases & SQL Studio (AQA §3.7 / OCR 1.2)
- **Interactive SQL Studio**: In-browser SQL execution engine with real-time relational table output.
- **Exam Query Challenges**: Hands-on exercises covering `SELECT`, `WHERE`, `ORDER BY`, `LIKE`, and `JOIN`.
- **Revision & Mark Schemes**: Clear reference cards on primary keys, foreign keys, composite keys, and relational schema integrity.

### 7. 🎲 Random Numbers and Procedural Generation (AQA §3.2.1 / §3.2.10)
- **Procedural Worlds & Art**: Interactive Minecraft voxel generator, recursive fractal trees, and city skylines.
- **Deterministic PRNG Seeds**: Demonstrates why computers cannot generate true randomness and how seeds allow identical procedural worlds to be reproduced.
- **PRNG Math & Cryptography**: Step-by-step float to integer mapping, linear congruential generators, and physical entropy sources.

---

## 🚀 Getting Started

This platform is 100% client-side and requires **zero external build tools or dependencies**. It runs in any modern browser directly or via a simple static file server.

### Option 1: Direct in Browser
Simply double-click or open `index.html` in Chrome, Edge, Firefox, or Safari.

### Option 2: Local Static Server (Node.js or Python)

Using Python:
```bash
python -m http.server 3000
```
Open `http://localhost:3000` in your browser.

Using Node.js:
```bash
node server.js
```
Open `http://localhost:3000` in your browser.

Or on Windows:
```cmd
launch.bat
```

---

## 📱 Mobile & Responsive Support

Optimized for desktop computers, classroom Chromebooks, iPads/tablets, and mobile phones:
- Touch-friendly controls and responsive layouts.
- Dedicated horizontal scroll preservation for architectural diagrams and trace table grids to prevent spatial distortion on small screens.
- System light and dark theme persistence.

---

## 📜 License
MIT License. Created for educators, tutors, and GCSE students.
