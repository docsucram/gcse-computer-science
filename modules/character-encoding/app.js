/**
 * GCSE Computer Science — Character Sets & Text Encoding
 * Interactive ASCII, Unicode UTF-8 & Huffman Coding Lab (AQA 8525 §3.3.2)
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. DOM REFERENCES
  // =========================================================================

  const DOM = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    sunIcon: document.getElementById('sunIcon'),
    moonIcon: document.getElementById('moonIcon'),
    viewTabs: document.querySelectorAll('.view-tab-btn'),
    tabViews: document.querySelectorAll('.tab-view'),

    // Character Encoder
    textEncoderInput: document.getElementById('textEncoderInput'),
    charTokenStream: document.getElementById('charTokenStream'),
    fullBinaryOutputBox: document.getElementById('fullBinaryOutputBox'),
    fullHexOutputLabel: document.getElementById('fullHexOutputLabel'),
    encoderByteStats: document.getElementById('encoderByteStats'),
    btnCopyBinary: document.getElementById('btnCopyBinary'),
    presetTextButtons: document.querySelectorAll('.preset-text-btn'),
  };

  // =========================================================================
  // 2. THEME & NAVIGATION
  // =========================================================================

  function initTheme() {
    const urlParam = new URLSearchParams(window.location.search).get('theme');
    const savedTheme = urlParam || localStorage.getItem('theme') || localStorage.getItem('gcse_theme') || 'light';
    applyTheme(savedTheme);

    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        const nextTheme = isDark ? 'light' : 'dark';
        applyTheme(nextTheme);
        localStorage.setItem('theme', nextTheme);
        localStorage.setItem('gcse_theme', nextTheme);
      });
    }
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      if (DOM.sunIcon) DOM.sunIcon.style.display = 'block';
      if (DOM.moonIcon) DOM.moonIcon.style.display = 'none';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      if (DOM.sunIcon) DOM.sunIcon.style.display = 'none';
      if (DOM.moonIcon) DOM.moonIcon.style.display = 'block';
    }
  }

  function initTabs() {
    DOM.viewTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        DOM.viewTabs.forEach(t => t.classList.remove('active'));
        DOM.tabViews.forEach(v => v.classList.remove('active'));

        tab.classList.add('active');
        const targetView = document.getElementById(`tab-${targetTab}`);
        if (targetView) targetView.classList.add('active');
      });
    });
  }

  // =========================================================================
  // 3. ASCII & UNICODE MESSAGE ENCODER
  // =========================================================================

  function escapeHtml(str) {
    if (str === ' ') return '&blank; (space)';
    if (str === '\n') return '&para; (newline)';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderCharacterTokens() {
    const text = DOM.textEncoderInput ? DOM.textEncoderInput.value || '' : '';
    if (!DOM.charTokenStream) return;
    DOM.charTokenStream.innerHTML = '';

    if (!text) {
      if (DOM.fullBinaryOutputBox) DOM.fullBinaryOutputBox.textContent = '(Empty - type a message above)';
      if (DOM.fullHexOutputLabel) DOM.fullHexOutputLabel.textContent = 'Hex: (Empty)';
      if (DOM.encoderByteStats) DOM.encoderByteStats.textContent = '0 Characters • 0 Bytes (0 bits)';
      DOM.charTokenStream.innerHTML = '<span style="color:var(--text-muted); font-size:12px;">Start typing above to see binary character blocks...</span>';
      return;
    }

    const chars = Array.from(text);
    const binChunks = [];
    const hexChunks = [];
    let totalBytes = 0;

    chars.forEach(ch => {
      const code = ch.codePointAt(0);
      const isAscii = code <= 127;
      const utf8Bytes = new TextEncoder().encode(ch);
      totalBytes += utf8Bytes.length;

      let charBinStr = '';
      if (isAscii) {
        charBinStr = code.toString(2).padStart(8, '0');
        binChunks.push(charBinStr);
        hexChunks.push(code.toString(16).toUpperCase().padStart(2, '0'));
      } else {
        const subBins = [];
        utf8Bytes.forEach(b => {
          const bBin = b.toString(2).padStart(8, '0');
          subBins.push(bBin);
          binChunks.push(bBin);
          hexChunks.push(b.toString(16).toUpperCase().padStart(2, '0'));
        });
        charBinStr = subBins.join(' ');
      }

      const hex = code.toString(16).toUpperCase().padStart(2, '0');

      const token = document.createElement('div');
      token.className = 'char-token';
      token.innerHTML = `
        <span class="char-symbol">${escapeHtml(ch)}</span>
        <span class="char-denary">${code}</span>
        <span class="char-hex">${hex}₁₆</span>
        <span class="char-bin" style="font-size: 11px;">${charBinStr}</span>
        <span style="font-size: 9px; margin-top: 4px; padding: 2px 6px; border-radius: 4px; background: ${isAscii ? 'rgba(59, 130, 246, 0.15)' : 'rgba(139, 92, 246, 0.2)'}; color: ${isAscii ? '#3b82f6' : '#8b5cf6'}; font-weight: 700;">
          ${isAscii ? 'ASCII (1B)' : `Unicode (${utf8Bytes.length}B)`}
        </span>
      `;
      DOM.charTokenStream.appendChild(token);
    });

    if (DOM.fullBinaryOutputBox) {
      DOM.fullBinaryOutputBox.textContent = binChunks.join(' ');
    }
    if (DOM.fullHexOutputLabel) {
      DOM.fullHexOutputLabel.textContent = `Hex: ${hexChunks.join(' ')}`;
    }
    if (DOM.encoderByteStats) {
      const totalBits = totalBytes * 8;
      DOM.encoderByteStats.textContent = `${chars.length} Character${chars.length === 1 ? '' : 's'} • ${totalBytes} Byte${totalBytes === 1 ? '' : 's'} (${totalBits} bits)`;
    }

    updateStorageImpact();
  }

  function updateStorageImpact() {
    const text = (DOM.textEncoderInput && DOM.textEncoderInput.value) ? DOM.textEncoderInput.value : 'Hello 👾';
    const container = document.getElementById('storageImpactBars');
    if (!container) return;

    const charCount = Array.from(text).length;
    const utf8Bytes = new TextEncoder().encode(text).length;
    const ascii8Bytes = Math.max(1, charCount);
    const utf16Bytes = Math.max(2, charCount * 2);
    const utf32Bytes = Math.max(4, charCount * 4);
    const maxBytes = Math.max(1, utf32Bytes);

    const standards = [
      { name: 'Standard 7/8-bit ASCII', bytes: ascii8Bytes, color: '#38bdf8', note: '1 byte per char (English text only)' },
      { name: 'UTF-8 (Web Standard)', bytes: utf8Bytes, color: '#10b981', note: 'Variable (1B English, 4B Emojis)' },
      { name: 'UTF-16 (Windows / Java)', bytes: utf16Bytes, color: '#fbbf24', note: '2 bytes minimum per char' },
      { name: 'UTF-32 (Fixed Length)', bytes: utf32Bytes, color: '#ef4444', note: '4 bytes for EVERY character (4× size!)' }
    ];

    container.innerHTML = '';
    standards.forEach(std => {
      const pct = Math.max(8, Math.round((std.bytes / maxBytes) * 100));
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.flexDirection = 'column';
      row.style.gap = '4px';

      row.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
          <span style="color: var(--text-primary);">${std.name}:</span>
          <span style="font-family: var(--font-mono); color: ${std.color};">${std.bytes} Bytes <span style="color: var(--text-muted); font-weight: 400;">(${std.bytes * 8} bits)</span></span>
        </div>
        <div style="height: 10px; background: var(--bg-root); border-radius: 5px; overflow: hidden; border: 1px solid var(--border-color);">
          <div style="width: ${pct}%; height: 100%; background: ${std.color}; border-radius: 5px; transition: width 0.3s ease;"></div>
        </div>
        <div style="font-size: 10.5px; color: var(--text-muted);">${std.note}</div>
      `;
      container.appendChild(row);
    });
  }

  function setupCharacterSetsLab() {
    // 1. Case-Flipper (+32 Bit 5)
    const caseSelect = document.getElementById('caseFlipperSelect');
    const btnToggleBit5 = document.getElementById('btnToggleBit5');
    const upperCharBadge = document.getElementById('upperCharBadge');
    const upperDenaryVal = document.getElementById('upperDenaryVal');
    const upperBitsRow = document.getElementById('upperBitsRow');
    const lowerCharBadge = document.getElementById('lowerCharBadge');
    const lowerDenaryVal = document.getElementById('lowerDenaryVal');
    const lowerBitsRow = document.getElementById('lowerBitsRow');

    if (caseSelect) {
      caseSelect.innerHTML = '';
      for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        const opt = document.createElement('option');
        opt.value = letter;
        opt.textContent = `${letter} (65 + ${i - 65})`;
        caseSelect.appendChild(opt);
      }

      function updateCaseFlipper() {
        const letter = caseSelect.value || 'A';
        const upperCode = letter.charCodeAt(0);
        const lowerCode = upperCode + 32;
        const lowerLetter = String.fromCharCode(lowerCode);

        if (upperCharBadge) upperCharBadge.textContent = `'${letter}'`;
        if (upperDenaryVal) upperDenaryVal.textContent = upperCode;
        if (lowerCharBadge) lowerCharBadge.textContent = `'${lowerLetter}'`;
        if (lowerDenaryVal) lowerDenaryVal.textContent = lowerCode;

        const upperBits = upperCode.toString(2).padStart(8, '0');
        const lowerBits = lowerCode.toString(2).padStart(8, '0');

        if (upperBitsRow) {
          upperBitsRow.innerHTML = '';
          Array.from(upperBits).forEach((b, idx) => {
            const span = document.createElement('span');
            const isBit5 = idx === 2; // 128, 64, 32 -> bit 5 is place value 32
            span.style.padding = '4px 7px';
            span.style.borderRadius = '4px';
            span.style.fontWeight = '700';
            span.style.border = isBit5 ? '1px solid #ef4444' : '1px solid var(--border-color)';
            span.style.background = isBit5 ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-surface)';
            span.style.color = isBit5 ? '#f87171' : 'var(--text-primary)';
            span.textContent = b;
            upperBitsRow.appendChild(span);
          });
        }

        if (lowerBitsRow) {
          lowerBitsRow.innerHTML = '';
          Array.from(lowerBits).forEach((b, idx) => {
            const span = document.createElement('span');
            const isBit5 = idx === 2;
            span.style.padding = '4px 7px';
            span.style.borderRadius = '4px';
            span.style.fontWeight = '700';
            span.style.border = isBit5 ? '1px solid #10b981' : '1px solid var(--border-color)';
            span.style.background = isBit5 ? 'rgba(16, 185, 129, 0.25)' : 'var(--bg-surface)';
            span.style.color = isBit5 ? '#34d399' : 'var(--text-primary)';
            span.textContent = b;
            lowerBitsRow.appendChild(span);
          });
        }
      }

      caseSelect.addEventListener('change', updateCaseFlipper);
      if (btnToggleBit5) {
        btnToggleBit5.addEventListener('click', () => {
          if (lowerBitsRow && lowerBitsRow.children[2]) {
            const bitEl = lowerBitsRow.children[2];
            bitEl.style.transform = 'scale(1.35)';
            bitEl.style.transition = 'transform 0.2s ease';
            setTimeout(() => { bitEl.style.transform = 'scale(1)'; }, 250);
          }
        });
      }
      updateCaseFlipper();
    }

    // 2. Letter Offset Solver
    const targetSelect = document.getElementById('offsetTargetLetter');
    const workingsBox = document.getElementById('offsetWorkingsBox');

    if (targetSelect) {
      targetSelect.innerHTML = '';
      for (let i = 66; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        const opt = document.createElement('option');
        opt.value = letter;
        opt.textContent = `'${letter}'`;
        if (letter === 'F') opt.selected = true;
        targetSelect.appendChild(opt);
      }

      function updateOffsetSolver() {
        const target = targetSelect.value || 'F';
        const targetCode = target.charCodeAt(0);
        const diff = targetCode - 65;
        const targetPos = diff + 1;
        const bin = targetCode.toString(2).padStart(8, '0');

        if (workingsBox) {
          workingsBox.innerHTML = `
            <div style="font-weight: 800; color: #10b981; font-size: 14px; margin-bottom: 8px;">
              ✓ Step-by-Step Working:
            </div>
            <div style="display: grid; gap: 6px;">
              <div><strong>Step 1 (Find distance):</strong> <code>'${target}'</code> is letter #${targetPos} in the alphabet. Distance from 'A' = ${targetPos} - 1 = <strong>+${diff}</strong>.</div>
              <div><strong>Step 2 (Apply ASCII base):</strong> Given 'A' = 65 &rarr; 65 + ${diff} = <strong style="color: #38bdf8; font-size: 15px; font-family: var(--font-mono);">${targetCode}</strong>.</div>
              <div><strong>Step 3 (Binary Conversion):</strong> Denary ${targetCode} = <code style="color: #c084fc; font-weight: 700;">${bin}</code> (64 + ${targetCode - 64}).</div>
              <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border-color); font-size: 12px; color: var(--text-muted);">
                📝 <em>AQA Mark Scheme Note:</em> Full method marks require showing the addition <code>65 + ${diff} = ${targetCode}</code>.
              </div>
            </div>
          `;
        }
      }

      targetSelect.addEventListener('change', updateOffsetSolver);
      updateOffsetSolver();
    }

    updateStorageImpact();
  }

  function setupCharacterEncoderEvents() {
    if (DOM.textEncoderInput) {
      DOM.textEncoderInput.addEventListener('input', renderCharacterTokens);
    }

    DOM.presetTextButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        if (DOM.textEncoderInput) {
          DOM.textEncoderInput.value = text;
          renderCharacterTokens();
        }
      });
    });

    if (DOM.btnCopyBinary) {
      DOM.btnCopyBinary.addEventListener('click', () => {
        if (DOM.fullBinaryOutputBox) {
          const text = DOM.fullBinaryOutputBox.textContent;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
              const orig = DOM.btnCopyBinary.textContent;
              DOM.btnCopyBinary.textContent = '✓ Copied!';
              setTimeout(() => {
                DOM.btnCopyBinary.textContent = orig;
              }, 1500);
            });
          }
        }
      });
    }
  }

  // =========================================================================
  // 4. HUFFMAN CODING LABORATORY (AQA §3.3.2)
  // =========================================================================

  function initHuffmanLab() {
    const textInput = document.getElementById('huffmanTextInput');
    const charCountBadge = document.getElementById('huffmanCharCountBadge');
    const presetButtons = document.querySelectorAll('.huffman-preset-btn');
    const btnReset = document.getElementById('btnResetHuffmanText');
    const freqListContainer = document.getElementById('huffmanFreqList');
    const treeSvgContainer = document.getElementById('huffmanTreeSvgContainer');
    const tableBody = document.getElementById('huffmanCodebookTableBody');
    const savedBadge = document.getElementById('huffmanSavedBadge');
    const bitRatio = document.getElementById('huffmanBitRatio');
    const meterBar = document.getElementById('huffmanMeterBar');
    const asciiFormula = document.getElementById('huffmanAsciiFormula');
    const calcFormula = document.getElementById('huffmanCalcFormula');
    const bitstreamDisplay = document.getElementById('huffmanBitstreamDisplay');
    const btnDecodeStream = document.getElementById('btnDecodeHuffmanStream');
    const decodeTraceLog = document.getElementById('huffmanDecodeTraceLog');

    if (!textInput || !treeSvgContainer) return;

    let decodeTimer = null;

    function renderHuffman() {
      if (decodeTimer) {
        clearInterval(decodeTimer);
        decodeTimer = null;
      }
      if (decodeTraceLog) {
        decodeTraceLog.style.display = 'none';
        decodeTraceLog.innerHTML = '';
      }
      if (btnDecodeStream) {
        btnDecodeStream.textContent = '▶ Step-by-Step Tree Decode';
        btnDecodeStream.disabled = false;
      }

      const text = textInput.value;
      if (charCountBadge) {
        charCountBadge.textContent = `${text.length} Character${text.length === 1 ? '' : 's'}`;
      }

      if (!text || text.length === 0) {
        if (freqListContainer) freqListContainer.innerHTML = '<span style="font-size: 12px; color: var(--text-muted);">Type letters above to see frequencies.</span>';
        if (treeSvgContainer) treeSvgContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 40px 0;">Tree will appear once you type some text above!</div>';
        if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" style="color: var(--text-muted); padding: 18px;">No data</td></tr>';
        if (savedBadge) savedBadge.textContent = '0% Saved';
        if (bitRatio) bitRatio.textContent = '0 bits vs 0 bits';
        if (meterBar) meterBar.style.width = '0%';
        if (asciiFormula) asciiFormula.textContent = '0 chars × 8 = 0 bits';
        if (calcFormula) calcFormula.textContent = 'Total = 0 bits';
        if (bitstreamDisplay) bitstreamDisplay.textContent = '—';
        return;
      }

      // 1. Character frequencies
      const freqs = {};
      for (const ch of text) {
        freqs[ch] = (freqs[ch] || 0) + 1;
      }

      const sortedChars = Object.keys(freqs).sort((a, b) => {
        if (freqs[a] !== freqs[b]) return freqs[a] - freqs[b];
        return a.localeCompare(b);
      });

      if (freqListContainer) {
        freqListContainer.innerHTML = sortedChars.map(ch => {
          const displayChar = ch === ' ' ? '␣ [space]' : ch;
          return `<div class="huffman-freq-badge" data-char="${encodeURIComponent(ch)}" title="Count: ${freqs[ch]}">
            <span class="char-pill">${escapeHtml(displayChar)}</span>
            <span class="count-pill">×${freqs[ch]}</span>
          </div>`;
        }).join('');
      }

      // 2. Build Huffman Tree
      let nodeId = 1;
      let queue = sortedChars.map(ch => ({
        id: `h_leaf_${nodeId++}`,
        char: ch,
        freq: freqs[ch],
        left: null,
        right: null,
        isLeaf: true
      }));

      let root;
      if (queue.length === 1) {
        const onlyLeaf = queue[0];
        root = {
          id: `h_node_${nodeId++}`,
          char: null,
          freq: onlyLeaf.freq,
          left: onlyLeaf,
          right: null,
          isLeaf: false
        };
      } else {
        while (queue.length > 1) {
          queue.sort((a, b) => {
            if (a.freq !== b.freq) return a.freq - b.freq;
            return a.id.localeCompare(b.id);
          });
          const left = queue.shift();
          const right = queue.shift();
          const parent = {
            id: `h_node_${nodeId++}`,
            char: null,
            freq: left.freq + right.freq,
            left: left,
            right: right,
            isLeaf: false
          };
          queue.push(parent);
        }
        root = queue[0];
      }

      // 3. Extract codes
      const codebook = {};
      const pathToLeaf = {};

      function traverse(node, currentCode, currentPath) {
        if (!node) return;
        const newPath = [...currentPath, node.id];
        if (node.isLeaf) {
          codebook[node.char] = currentCode || '0';
          pathToLeaf[node.char] = newPath;
          return;
        }
        if (node.left) {
          traverse(node.left, currentCode + '0', newPath);
        }
        if (node.right) {
          traverse(node.right, currentCode + '1', newPath);
        }
      }
      traverse(root, '', []);

      // 4. Render Tree
      renderSvgTree(root);

      // 5. Render Codebook Table
      const descChars = [...sortedChars].reverse();
      let totalHuffmanBits = 0;
      const rowsHtml = descChars.map(ch => {
        const count = freqs[ch];
        const asciiBits = count * 8;
        const code = codebook[ch] || '0';
        const huffBits = count * code.length;
        totalHuffmanBits += huffBits;
        const displayChar = ch === ' ' ? '␣ [space]' : ch;

        return `
          <tr class="huffman-row" data-char="${encodeURIComponent(ch)}">
            <td style="font-family: var(--font-mono); font-weight: 800; font-size: 13px; color: var(--accent-soft-text);">
              ${escapeHtml(displayChar)}
            </td>
            <td style="font-weight: 700;">${count}</td>
            <td style="color: var(--text-muted);">${count} &times; 8 = ${asciiBits}</td>
            <td><code style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-weight: 800; padding: 2px 8px; border-radius: 4px;">${code}</code></td>
            <td style="font-weight: 800; color: #34d399;">${count} &times; ${code.length} = <strong>${huffBits}</strong></td>
          </tr>
        `;
      }).join('');
      if (tableBody) tableBody.innerHTML = rowsHtml;

      // 6. Metrics
      const totalAsciiBits = text.length * 8;
      const bitsSaved = Math.max(0, totalAsciiBits - totalHuffmanBits);
      const pctSaved = totalAsciiBits > 0 ? ((bitsSaved / totalAsciiBits) * 100).toFixed(1) : 0;

      if (savedBadge) savedBadge.textContent = `${pctSaved}% Saved`;
      if (bitRatio) bitRatio.textContent = `${totalHuffmanBits} bits vs ${totalAsciiBits} bits`;
      if (meterBar) {
        const pctWidth = totalAsciiBits > 0 ? Math.min(100, Math.max(5, (totalHuffmanBits / totalAsciiBits) * 100)) : 0;
        meterBar.style.width = `${pctWidth}%`;
        meterBar.style.background = pctSaved > 0 ? '#34d399' : '#f87171';
      }
      if (asciiFormula) {
        asciiFormula.innerHTML = `${text.length} chars &times; 8 bits = <strong>${totalAsciiBits} bits</strong>`;
      }
      if (calcFormula) {
        calcFormula.innerHTML = `&sum; (Freq &times; Code Len) = <strong style="color: #34d399;">${totalHuffmanBits} bits</strong>`;
      }

      // 7. Bitstream
      if (bitstreamDisplay) {
        const bitTokens = [];
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          const code = codebook[ch] || '0';
          const disp = ch === ' ' ? '␣' : ch;
          bitTokens.push(`<span class="huffman-bit-token" data-char="${encodeURIComponent(ch)}" title="'${escapeHtml(disp)}' &rarr; ${code}">${code}</span>`);
        }
        bitstreamDisplay.innerHTML = bitTokens.join('');
      }

      // 8. Hover traces
      attachHoverTraces(pathToLeaf);

      // 9. Step Decoder
      if (btnDecodeStream) {
        btnDecodeStream.onclick = () => {
          runStepDecoder(text, codebook, root);
        };
      }
    }

    function renderSvgTree(root) {
      if (!treeSvgContainer || !root) return;

      let leafIndex = 0;
      let maxDepth = 0;

      function assignDepths(node, depth) {
        if (!node) return;
        node.depth = depth;
        if (depth > maxDepth) maxDepth = depth;
        assignDepths(node.left, depth + 1);
        assignDepths(node.right, depth + 1);
      }
      assignDepths(root, 0);

      function computeCoords(node) {
        if (!node) return;
        if (node.isLeaf) {
          node.x = leafIndex * 64 + 40;
          leafIndex++;
        } else {
          computeCoords(node.left);
          computeCoords(node.right);
          if (node.left && node.right) {
            node.x = (node.left.x + node.right.x) / 2;
          } else if (node.left) {
            node.x = node.left.x + 35;
          } else if (node.right) {
            node.x = node.right.x - 35;
          } else {
            node.x = 40;
          }
        }
        node.y = node.depth * 62 + 36;
      }
      computeCoords(root);

      const svgWidth = Math.max(340, leafIndex * 64 + 60);
      const svgHeight = (maxDepth + 1) * 62 + 45;

      const lines = [];
      const nodes = [];

      function drawBranches(node) {
        if (!node) return;
        if (node.left) {
          const edgeId = `edge_${node.id}_${node.left.id}`;
          const midX = (node.x + node.left.x) / 2 - 10;
          const midY = (node.y + node.left.y) / 2;
          lines.push(`
            <line id="${edgeId}" class="huffman-edge" data-source="${node.id}" data-target="${node.left.id}"
                  x1="${node.x}" y1="${node.y}" x2="${node.left.x}" y2="${node.left.y}"
                  stroke="var(--border-color, #4b5563)" stroke-width="2" />
            <text id="label_${edgeId}" class="huffman-edge-label" x="${midX}" y="${midY}" fill="#38bdf8" font-size="12" font-weight="800" text-anchor="middle" dominant-baseline="middle">0</text>
          `);
          drawBranches(node.left);
        }
        if (node.right) {
          const edgeId = `edge_${node.id}_${node.right.id}`;
          const midX = (node.x + node.right.x) / 2 + 10;
          const midY = (node.y + node.right.y) / 2;
          lines.push(`
            <line id="${edgeId}" class="huffman-edge" data-source="${node.id}" data-target="${node.right.id}"
                  x1="${node.x}" y1="${node.y}" x2="${node.right.x}" y2="${node.right.y}"
                  stroke="var(--border-color, #4b5563)" stroke-width="2" />
            <text id="label_${edgeId}" class="huffman-edge-label" x="${midX}" y="${midY}" fill="#34d399" font-size="12" font-weight="800" text-anchor="middle" dominant-baseline="middle">1</text>
          `);
          drawBranches(node.right);
        }

        if (node.isLeaf) {
          const disp = node.char === ' ' ? '␣' : node.char;
          nodes.push(`
            <g id="${node.id}" class="huffman-svg-node huffman-leaf-node" data-char="${encodeURIComponent(node.char)}">
              <circle cx="${node.x}" cy="${node.y}" r="17" fill="var(--bg-surface-elevated, #1e293b)" stroke="#38bdf8" stroke-width="2.5" />
              <text x="${node.x}" y="${node.y + 1}" fill="var(--text-primary, #ffffff)" font-size="13" font-weight="900" font-family="var(--font-mono, monospace)" text-anchor="middle" dominant-baseline="middle">${escapeHtml(disp)}</text>
              <text x="${node.x}" y="${node.y + 26}" fill="var(--text-muted, #94a3b8)" font-size="10" font-weight="700" text-anchor="middle">w:${node.freq}</text>
            </g>
          `);
        } else {
          nodes.push(`
            <g id="${node.id}" class="huffman-svg-node huffman-internal-node">
              <circle cx="${node.x}" cy="${node.y}" r="14" fill="var(--bg-surface, #0f172a)" stroke="var(--border-color, #64748b)" stroke-width="2" />
              <text x="${node.x}" y="${node.y + 1}" fill="var(--text-secondary, #cbd5e1)" font-size="11" font-weight="700" font-family="var(--font-mono, monospace)" text-anchor="middle" dominant-baseline="middle">${node.freq}</text>
            </g>
          `);
        }
      }
      drawBranches(root);

      treeSvgContainer.innerHTML = `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" style="max-width: 100%; height: auto; display: block; margin: 0 auto; overflow: visible;">
          <g class="huffman-edges">${lines.join('')}</g>
          <g class="huffman-nodes">${nodes.join('')}</g>
        </svg>
      `;
    }

    function attachHoverTraces(pathToLeaf) {
      function highlightChar(ch) {
        if (!ch) return;
        const nodeIds = pathToLeaf[ch];
        if (!nodeIds) return;

        nodeIds.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.add('highlighted');
        });

        for (let i = 0; i < nodeIds.length - 1; i++) {
          const edge = document.getElementById(`edge_${nodeIds[i]}_${nodeIds[i + 1]}`);
          if (edge) edge.classList.add('highlighted');
          const lbl = document.getElementById(`label_edge_${nodeIds[i]}_${nodeIds[i + 1]}`);
          if (lbl) lbl.classList.add('highlighted');
        }

        const row = document.querySelector(`.huffman-row[data-char="${encodeURIComponent(ch)}"]`);
        if (row) row.classList.add('active-huffman-row');

        const badge = document.querySelector(`.huffman-freq-badge[data-char="${encodeURIComponent(ch)}"]`);
        if (badge) badge.classList.add('active');

        document.querySelectorAll(`.huffman-bit-token[data-char="${encodeURIComponent(ch)}"]`).forEach(tok => {
          tok.classList.add('active-token');
        });
      }

      function clearHighlights() {
        document.querySelectorAll('.huffman-svg-node.highlighted').forEach(el => el.classList.remove('highlighted'));
        document.querySelectorAll('.huffman-edge.highlighted').forEach(el => el.classList.remove('highlighted'));
        document.querySelectorAll('.huffman-edge-label.highlighted').forEach(el => el.classList.remove('highlighted'));
        document.querySelectorAll('.huffman-row.active-huffman-row').forEach(el => el.classList.remove('active-huffman-row'));
        document.querySelectorAll('.huffman-freq-badge.active').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.huffman-bit-token.active-token').forEach(el => el.classList.remove('active-token'));
      }

      document.querySelectorAll('.huffman-leaf-node').forEach(leaf => {
        const rawCh = decodeURIComponent(leaf.getAttribute('data-char') || '');
        leaf.addEventListener('mouseenter', () => highlightChar(rawCh));
        leaf.addEventListener('mouseleave', clearHighlights);
      });

      document.querySelectorAll('.huffman-row').forEach(row => {
        const rawCh = decodeURIComponent(row.getAttribute('data-char') || '');
        row.addEventListener('mouseenter', () => highlightChar(rawCh));
        row.addEventListener('mouseleave', clearHighlights);
      });

      document.querySelectorAll('.huffman-freq-badge').forEach(badge => {
        const rawCh = decodeURIComponent(badge.getAttribute('data-char') || '');
        badge.addEventListener('mouseenter', () => highlightChar(rawCh));
        badge.addEventListener('mouseleave', clearHighlights);
      });

      document.querySelectorAll('.huffman-bit-token').forEach(token => {
        const rawCh = decodeURIComponent(token.getAttribute('data-char') || '');
        token.addEventListener('mouseenter', () => highlightChar(rawCh));
        token.addEventListener('mouseleave', clearHighlights);
      });
    }

    function runStepDecoder(text, codebook, root) {
      if (!decodeTraceLog) return;
      decodeTraceLog.style.display = 'block';
      decodeTraceLog.innerHTML = `<div style="font-weight: 800; color: #38bdf8; margin-bottom: 6px;">Tree Decoding in progress...</div>`;

      let fullBitString = '';
      for (const ch of text) {
        fullBitString += (codebook[ch] || '0');
      }

      let bitIdx = 0;
      let currentNode = root;
      let decodedResult = '';
      let stepCount = 1;

      if (btnDecodeStream) {
        btnDecodeStream.disabled = true;
        btnDecodeStream.textContent = '⏳ Decoding...';
      }

      if (decodeTimer) clearInterval(decodeTimer);

      decodeTimer = setInterval(() => {
        if (bitIdx >= fullBitString.length) {
          clearInterval(decodeTimer);
          decodeTimer = null;
          if (btnDecodeStream) {
            btnDecodeStream.disabled = false;
            btnDecodeStream.textContent = '✓ Decoded! Replay ▶';
          }
          decodeTraceLog.innerHTML += `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color); font-weight: 800; color: #34d399;">
              ✓ Decoding Complete! Result = "${escapeHtml(decodedResult)}" (${bitIdx} bits processed with 0 ambiguity)
            </div>
          `;
          return;
        }

        const bit = fullBitString[bitIdx];
        const nextNode = (bit === '0') ? (currentNode.left || currentNode) : (currentNode.right || currentNode);

        document.querySelectorAll('.huffman-edge.highlighted').forEach(e => e.classList.remove('highlighted'));
        document.querySelectorAll('.huffman-svg-node.highlighted').forEach(n => n.classList.remove('highlighted'));

        const edgeEl = document.getElementById(`edge_${currentNode.id}_${nextNode.id}`);
        if (edgeEl) edgeEl.classList.add('highlighted');
        const nodeEl = document.getElementById(nextNode.id);
        if (nodeEl) nodeEl.classList.add('highlighted');

        bitIdx++;

        if (nextNode.isLeaf) {
          decodedResult += nextNode.char;
          const disp = nextNode.char === ' ' ? '␣ (Space)' : `'${nextNode.char}'`;
          decodeTraceLog.innerHTML += `
            <div>Step ${stepCount++}: Read bit <code>${bit}</code> &rarr; Reached leaf <strong>${escapeHtml(disp)}</strong>! Output: "<code>${escapeHtml(decodedResult)}</code>"</div>
          `;
          currentNode = root;
        } else {
          const dir = bit === '0' ? 'Left (0)' : 'Right (1)';
          decodeTraceLog.innerHTML += `
            <div>Step ${stepCount++}: Read bit <code>${bit}</code> &rarr; Branch <strong>${dir}</strong> to node (weight ${nextNode.freq})</div>
          `;
          currentNode = nextNode;
        }

        decodeTraceLog.scrollTop = decodeTraceLog.scrollHeight;
      }, 350);
    }

    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const preset = btn.getAttribute('data-preset');
        textInput.value = preset;
        renderHuffman();
      });
    });

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        textInput.value = '';
        renderHuffman();
        textInput.focus();
      });
    }

    textInput.addEventListener('input', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      renderHuffman();
    });

    renderHuffman();
  }

  // =========================================================================
  // 5. INITIALIZATION
  // =========================================================================

  function init() {
    initTheme();
    initTabs();
    setupCharacterEncoderEvents();
    renderCharacterTokens();
    setupCharacterSetsLab();
    initHuffmanLab();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
