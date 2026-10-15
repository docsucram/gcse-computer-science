# BitMaster: Avatar Assets & Character Progression Specification

This specification defines the visual avatar ladder, image naming standards, generation prompts for Gemini / Imagen, and integration architecture for **BitMaster**.

---

## 1. Rank Ladder & Character Archetypes

The progression ladder spans 12 ranks across the 11 syllabus stages plus the Grandmaster Gauntlet. Ranks are calibrated so a student levels up every ~3–4 three-star stages, maintaining high motivational feedback.

| Tier | Rank Name | Min XP | Syllabus Stage Equivalent | Character Archetype |
|:---:|:---|:---:|:---|:---|
| **01** | **Logic Novice** | 0 | Stage 1 (Bits & Place Values) | Friendly white CPU companion bot with cute blue LED eyes, holding a tiny screwdriver. |
| **02** | **Nibble Operator** | 450 | Stage 2 (4-Bit Binary) | Streetwise cyberpunk script hacker in dark hoodie with `>_` terminal visor and laptop. |
| **03** | **Binary Specialist** | 1,000 | Stage 3–4 (8-Bit Conversions) | Sleek stealth cyber-operative in form-fitting matrix suit with cascading `0101` code and holo-tablet. |
| **04** | **Byte Engineer** | 1,650 | Stage 5 (Binary Addition) | Heavy mech-suit power engineer with neon cyan holographic cube cores, oversized cyber wrench, and toolkit. |
| **05** | **Signed Sentinel** | 2,350 | Stage 9 (Signed Integers & Inversion) | Quantum phase ninja wrapped in inverted dark/light chromatic split aura, representing negative sign flipping. |
| **06** | **Silicon Shifter** | 3,100 | Stage 8 (Binary Shifts & Overclocking) | Overclocked neon speedster surrounded by motion-blurred data packets and glowing bus conduits. |
| **07** | **ALU Vanguard** | 3,900 | Stage 7–8 (ALU Arithmetic & Logic) | Fast dual-blade cyber-duelist with twin laser circuit wires representing parallel logic pathways. |
| **08** | **Hex Sorcerer** | 4,750 | Stage 6 (Hexadecimal Foundations) | Hooded techno-mage with robotic silver beard and circuit robes, summoning floating glowing hexagonal runes (`Σ`, `0x`). |
| **09** | **Hex Archon** | 5,650 | Stage 7 (Hex Conversions & Geometry) | Regal high-tech construct architect in crystalline hexagonal energy armor with floating geometry shields. |
| **10** | **Data Architect** | 6,600 | Stage 10–11 (Mainframe Data & Storage) | Sovereign mainframe commander seated amidst circular multi-layered holographic control spheres and waveform rings. |
| **11** | **Grand BitMaster** | 7,800 | Stage 12 (Gauntlet & Speed Blitz) | Ascended silicon champion in radiant gold-and-cyan cyber plate, wielding a floating CPU core matrix crown. |
| **12** | **Supreme Silicon Legend** | 9,500 | Max Mastery / All Gauntlets Cleared | Transcendent digital deity / singularity entity woven of pure golden light, fiber-optic threads, and binary constellations. |

---

## 2. Image Asset Specifications

To ensure pixel-perfect rendering across both high-density mobile screens and desktop displays:

| Property | Requirement | Notes |
|:---|:---|:---|
| **Dimensions** | `512 × 512` pixels | High-DPI master asset. Displayed at `40px` (HUD), `72px` (Rank modal), and `96px` (Victory level-up). |
| **Aspect Ratio** | `1:1` Square | Must be square for round CSS avatar circles (`border-radius: 50%` or `16px` squircle). |
| **File Format** | `.png`, `.jpeg`, `.jpg`, or `.webp` | The game automatically probes and detects `.png`, `.jpeg`, `.jpg`, and `(Custom).jpeg` with zero configuration needed. |
| **Safe Framing Zone** | Centered within an inner `440 × 440` circular boundary | Ensure character heads, hats, antennae, or hands aren't clipped by circular CSS masks. |
| **Lighting & Palette** | Cyberpunk neon rim lighting: cyan `#06b6d4`, hot pink `#ec4899`, amber `#f59e0b` | Matches the dark navy background (`#090d16` / `#0f172a`) of the BitMaster theme. |
| **Folder Location** | `modules/binary-numbers/assets/avatars/` | Dedicated relative path. |

### Expected Filenames
```text
modules/binary-numbers/assets/avatars/
├── avatar_tier01_logic_novice.png
├── avatar_tier02_nibble_operator.png
├── avatar_tier03_binary_specialist.png
├── avatar_tier04_byte_engineer.png
├── avatar_tier05_signed_sentinel.jpeg
├── avatar_tier06_silicon_shifter.jpeg
├── avatar_tier07_alu_vanguard.jpeg
├── avatar_tier08_hex_sorcerer.jpeg
├── avatar_tier09_hex_archon.jpeg
├── avatar_tier10_data_architect.jpeg
├── avatar_tier11_grand_bitmaster.jpeg
└── avatar_tier12_supreme_silicon_legend.jpeg
```

---

## 3. Gemini Image Generation Prompts

When generating avatar art in Gemini / Imagen, use the following standardized style header and prompts.

### Universal Style Header
> **Style parameters**: *Clean digital 2.5D game character portrait, video game UI avatar icon, sleek futuristic cyberpunk aesthetic, high-contrast vibrant neon rim lighting, isolated on solid dark navy #090d16 background with faint digital grid lines, centered head-and-shoulders bust framing, no text, no watermark, perfectly centered.*

---

### Prompt 01: Logic Novice (`avatar_tier01_logic_novice.png`)
```text
Sleek 2D game avatar portrait of a cute futuristic white CPU robot companion. Round friendly head with large expressive glowing cyan LED curved eyes, small antenna on the side, white chassis with subtle motherboard circuitry, holding a small glowing miniature screwdriver. Charming, friendly rookie mascot appearance, clean vector digital art style, glowing cyan accents, isolated on dark navy background, perfectly centered bust portrait.
```

### Prompt 02: Nibble Operator (`avatar_tier02_nibble_operator.png`)
```text
Sleek 2D game avatar portrait of a young streetwise cyberpunk hacker in a dark hooded tech jacket with neon pink and cyan piping. Wearing a dark futuristic helmet mask with a glowing cyan terminal prompt text '>_' on the visor faceplate. High-tech backpack with glowing colorful fiber cables, holding a glowing cyber laptop. Energetic, rebellious young tech operator, clean video game character concept art, centered square framing.
```

### Prompt 03: Binary Specialist (`avatar_tier03_binary_specialist.png`)
```text
Sleek 2D game avatar portrait of a high-tech female stealth operative wearing a form-fitting dark carbon fiber combat suit. Visor with glowing cyan lens display and communication headset. The suit is adorned with streams of glowing cyan binary code numbers '010101' illuminating the fabric. Holding a slim glowing holographic glass data tablet. Confident, sharp, elite cyber operative, high contrast digital art.
```

### Prompt 04: Byte Engineer (`avatar_tier04_byte_engineer.png`)
```text
Sleek 2D game avatar portrait of a rugged sci-fi male engineer with a short neat beard and high-tech headset. Wearing heavy dark industrial exosuit power armor with glowing neon cyan holographic cube emblems on the chest and shoulder plate. Holding a large glowing futuristic cyan energy wrench over his shoulder. Heavy machinery specialist, powerhouse engineer, clean digital illustration, centered portrait.
```

### Prompt 05: Hex Sorcerer (`avatar_tier05_hex_sorcerer.png`)
```text
Sleek 2D game avatar portrait of an elder cybernetic techno-wizard wearing dark futuristic hooded robes with glowing circuit-board patterns. Trimmed silver cybernetic beard, calm wise glowing eyes beneath the cowl. Both hands raised forward, conjuring floating glowing neon cyan and violet holographic hexagonal glyphs inscribed with mathematical and hex code symbols '0x' and 'Σ'. Mysterious, powerful techno-mage, centered portrait.
```

### Prompt 06: Hex Archon (`avatar_tier06_hex_archon.png`)
```text
Sleek 2D game avatar portrait of an elite digital architect in crystalline hexagonal armored vestments. Geometric floating polygonal glass facets orbit around the head, gleaming with purple and cyan refraction. High-tech crown-like visor with interlocking hex prisms. Majestic, structural mastermind, clean vibrant sci-fi illustration, dark navy background.
```

### Prompt 07: ALU Vanguard (`avatar_tier07_alu_vanguard.png`)
```text
Sleek 2D game avatar portrait of an agile cyber-blade specialist. Wearing a sleek lightweight exo-suit with dual energy-filament blades humming with electrical current. Glowing orange and cyan circuit traces run down the arms, symbolizing arithmetic and logic gates. Dynamic combat pose, focused intense gaze through a razor-thin visor. High-octane digital art, centered avatar framing.
```

### Prompt 08: Signed Sentinel (`avatar_tier08_signed_sentinel.png`)
```text
Sleek 2D game avatar portrait of a shadowy digital phantom ninja. The character's design is divided down the middle by a glowing quantum phase inversion: one side clean cyan light, the other deep inverted magenta shadow with glowing glitch artifacts, symbolizing signed binary sign bits and inversion. Glowing dual-tone eyes, stealth cyber cowl. High contrast, sleek and mysterious.
```

### Prompt 09: Silicon Shifter (`avatar_tier09_silicon_shifter.png`)
```text
Sleek 2D game avatar portrait of a hyper-speed overclocked courier. Wearing an aerodynamic streamlined cybernetic flight helmet with trailing neon cyan velocity trails and shift arrows. Glowing bus conduits pulsed with liquid light. Kinetic energy sparks radiating from the shoulders. Extreme speed, electric energy, clean digital game art.
```

### Prompt 10: Data Architect (`avatar_tier10_data_architect.png`)
```text
Sleek 2D game avatar portrait of a senior mainframe commander in executive high-tech cyber robes. Surrounded by orbiting circular holographic data rings, sound waveforms, and pixel matrices floating in 3D around them. Calm, commanding expression, glowing ocular cyber implants, floating neural interface nodes. Supreme digital commander.
```

### Prompt 11: Grand BitMaster (`avatar_tier11_grand_bitmaster.png`)
```text
Sleek 2D game avatar portrait of a grandmaster cybernetic champion in ceremonial golden and neon-cyan high-tech armor. Floating geometric golden silicon halo / CPU crown above the head. Pure radiant neon blue eyes, gleaming polished golden circuitry on the breastplate. Champion, triumphant, legendary achievement, regal and inspiring.
```

### Prompt 12: Supreme Silicon Legend (`avatar_tier12_supreme_silicon_legend.png`)
```text
Sleek 2D game avatar portrait of an ascended artificial intelligence deity. Ethereal form made of translucent cosmic silicon, starlight binary code constellations, and radiant prismatic energy tendrils. Floating serenely with a calm omniscient expression, eyes like glowing celestial stars, golden fractal circuitry weaving through the body. Ultimate cosmic digital entity, awe-inspiring, centered icon.
```

---

## 4. App Integration Architecture

### A. Non-Breaking Progressive Loading
The application will use a zero-crash progressive fallback pattern. If the avatar PNG file does not exist or fails to load, the UI gracefully retains the current high-contrast SVG stage icon.

```javascript
// Example progressive image loading helper
function getBitmasterAvatarHTML(rankIndex, cssClass = 'bitmaster-avatar-img') {
  const rank = BITMASTER_RANKS[rankIndex];
  const filename = rank.avatarFile;
  const fallbackSvg = rank.svgIcon;

  return `
    <div class="bitmaster-avatar-frame ${cssClass}-frame">
      <img src="assets/avatars/${filename}" 
           alt="${rank.title}" 
           class="${cssClass}"
           loading="lazy"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
      <div class="bitmaster-avatar-fallback" style="display:none;">
        ${fallbackSvg}
      </div>
    </div>
  `;
}
```

### B. UI Touchpoints
1. **BitMaster Top HUD Pill**:
   - Replaces or accompanies the tiny diamond icon next to the rank badge with the circular avatar portrait (`36px` diameter with rank-color glowing border).
2. **Rank & XP Details Modal**:
   - Shows the current avatar at `72px` with a shiny circular frame.
   - Includes a scrollable "Hall of Ranks" showing all 12 avatar icons. Unlocked ranks show in full color; locked ranks appear in darkened silhouette with a padlock badge.
3. **Stage Victory Card**:
   - Shows the student's avatar beside their name and XP earned.
4. **Rank Promotion / Level-Up Celebration**:
   - When reaching a new rank threshold, the modal displays the newly unlocked avatar at `96px` with a pulse-glow animation and triumphant sound.
