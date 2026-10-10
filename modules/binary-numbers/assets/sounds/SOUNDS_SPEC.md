# BitMaster: Sound Effects & Audio Integration Specification

This specification outlines the sound design palette, required audio files, format guidelines, free CC0 resource libraries, and fallback integration architecture for **BitMaster**.

---

## 1. Sound Design Concept

BitMaster's audio profile follows a **modern arcade sci-fi / cyberpunk** aesthetic:
- **Clean and crisp**: High-frequency transients that feel tactile, responsive, and instant.
- **Harmonic & positive**: Mistakes sound gentle and encouraging (a soft damp thud or subtle pitch drop rather than an abrasive buzzer), while correct answers and streaks build musical harmony.
- **Micro-durations**: Most gameplay sounds last under 250 milliseconds so they never feel sluggish during fast sprint rounds.

---

## 2. Sound Effects Asset List

| Filename | In-Game Trigger Event | Audio Description / Mood | Target Duration |
|:---|:---|:---|:---:|
| `bit_toggle.ogg` | Flipping an individual bit toggle (0 to 1 or 1 to 0), typing a hex keypad digit | High-tactile mechanical switch, clean micro-click, subtle clicky relay | ~40–80 ms |
| `answer_correct.ogg` | Submitting a correct answer in practice / level | Bright, buoyant chime or glass ping (major chord, uplifting) | ~200–350 ms |
| `answer_wrong.ogg` | Submitting an incorrect answer | Soft muted rubber thud / low double-pip; non-punishing, encouraging retry | ~150–250 ms |
| `streak_combo.ogg` | Consecutive correct answers (streak ×2, ×3, etc.) | Ascending frequency pitch chime that climbs with the streak counter | ~150–300 ms |
| `star_pop.ogg` | Victory summary card: each star awarding animation | Sparkling crystalline pop or star-chime sparkle | ~300–450 ms |
| `victory_fanfare.ogg` | Clearing a stage level (all 10 questions) | Triumphant 4-note ascending futuristic synthesizer flourish | ~1.5–2.2 s |
| `rank_levelup.ogg` | Earning a new rank (XP bar full -> rank up modal) | Epic cinematic power-surge whoosh followed by a grand harmonic chord | ~2.5–3.5 s |
| `timer_tick.ogg` | Blitz / 60s Sprint mode: final 10-second countdown | Low subtle digital pulse / radar blip | ~60–100 ms |

### Expected Folder Structure
```text
modules/binary-numbers/assets/sounds/
├── bit_toggle.ogg
├── answer_correct.ogg
├── answer_wrong.ogg
├── streak_combo.ogg
├── star_pop.ogg
├── victory_fanfare.ogg
├── rank_levelup.ogg
└── timer_tick.ogg
```

*(Optional: `.wav` or `.mp3` versions with the same names can be kept alongside for fallback compatibility).*

---

## 3. Technical Audio Specifications

| Parameter | Recommended Standard | Rationale |
|:---|:---|:---|
| **Primary Format** | `.ogg` (Ogg Vorbis) | Highest compression-to-quality ratio across modern Chrome, Edge, Safari, Firefox. |
| **Fallback Format** | `.mp3` or `.wav` | Legacy Safari / iOS fallback if desired. |
| **Sample Rate** | `44,100 Hz` (44.1 kHz) | CD standard, perfectly aligned with Web Audio API context sample rate. |
| **Bit Depth / Channels** | 16-bit / Mono (Stereo for fanfares) | Mono cuts file sizes in half with zero loss for interface micro-sounds. |
| **Peak Volume / Normalization** | Normalized to `-3.0 dB` FS | Prevents clipping when multiple sounds trigger simultaneously. |
| **Target File Size** | < 30 KB per short SFX, < 150 KB for fanfare | Total sound pack under 500 KB to preserve instant page loads. |

---

## 4. Recommended Free CC0 Asset Sources

All of the following libraries are 100% free and licensed for open educational and commercial use:

1. **Kenney.nl (CC0 Public Domain)**:
   - *Kenney Interface Sounds*: Contains hundreds of clean clicks, chimes, confirmation beeps, and switches.
   - *Kenney Digital Audio*: Synthesized sci-fi UI beeps, laser pulses, and victory jingles.
   - URL: `https://kenney.nl/assets/category:Audio`
2. **Chiptone / jsfxr (In-Browser Sound Generator)**:
   - Free interactive synthesizer in your browser.
   - Presets for `Coin / Star`, `Laser / Switch`, `Hit / Hurt`, `Power-Up`.
   - Export directly to clean `.wav` with one click.
   - URL: `https://sfbgames.itch.io/chiptone` or `https://sfxr.me/`
3. **Freesound.org (Creative Commons 0 search filter)**:
   - Search tags: `sci-fi ui`, `crystal chime`, `game levelup fanfare`, `mechanical click`.

---

## 5. Software Architecture & Graceful Fallback

BitMaster already has a procedural Web Audio API oscillator engine (`playSynthSound`). When real audio files are integrated, the app will use a **progressive audio manager**:

1. **Preload on Demand**: Audio files are loaded asynchronously into memory upon the student's first interaction (touch or click).
2. **Instant Fallback**: If an audio file is missing (404), fails to decode, or the student is running in an offline environment without the assets folder, the audio engine automatically calls `playSynthSound(type)` without throwing an error.
3. **Mute Synchronization**: Respects the existing sound toggle (`isAudioMuted` state in `localStorage`).

```javascript
// High-level Sound Manager Design Blueprint
const BITMASTER_AUDIO = {
  cache: {},
  muted: false,

  play(name, synthFallbackType) {
    if (this.muted || window.isAudioMuted) return;

    const file = `assets/sounds/${name}.ogg`;
    let sound = this.cache[name];

    if (!sound) {
      sound = new Audio(file);
      sound.volume = 0.6;
      this.cache[name] = sound;
    }

    sound.currentTime = 0;
    const playPromise = sound.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback gracefully to Web Audio oscillators if file is missing or blocked
        if (typeof playSynthSound === 'function' && synthFallbackType) {
          playSynthSound(synthFallbackType);
        }
      });
    }
  }
};
```
