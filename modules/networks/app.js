/**
 * GCSE Computer Science - Networks, Packets & Protocols
 * Living Panoramic Simulator & Educational Interactive Playground
 * Vanilla JavaScript (Zero build tools required)
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. THEME SYNC
  // =========================================================================
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');

  function initTheme() {
    const saved = localStorage.getItem('gcse_theme') || localStorage.getItem('theme');
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDark ? 'block' : 'none';
      moonIcon.style.display = isDark ? 'none' : 'block';
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('gcse_theme', isDark ? 'dark' : 'light');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      if (sunIcon && moonIcon) {
        sunIcon.style.display = isDark ? 'block' : 'none';
        moonIcon.style.display = isDark ? 'none' : 'block';
      }
    });
  }
  initTheme();

  // =========================================================================
  // 2. TAB SWITCHER
  // =========================================================================
  const tabButtons = document.querySelectorAll('.view-tab-btn');
  const tabViews = document.querySelectorAll('.tab-view');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.remove('active'));
      tabViews.forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      const targetView = document.getElementById(`tab-${tabId}`);
      if (targetView) targetView.classList.add('active');

      if (tabId === 'topologies') {
        renderTopology();
      }
      if (tabId === 'layers') {
        updateLayerVisuals();
      }
    });
  });

  // Support URL hash navigation (e.g. #layers or #tab-layers)
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash) {
    const matchingBtn = Array.from(tabButtons).find(b => b.dataset.tab === initialHash || `tab-${b.dataset.tab}` === initialHash);
    if (matchingBtn) matchingBtn.click();
  }

  // =========================================================================
  // 3. LIVING PACKET JOURNEY ENGINE
  // =========================================================================
  
  // Coordinates Map for 1340 x 500 SVG Canvas
  const coords = {
    sender: { x: 150, y: 250 },
    mast: { x: 300, y: 180 },
    isp: { x: 460, y: 250 },
    dns: { x: 640, y: 80 },
    alpha: { x: 660, y: 200 },
    beta: { x: 660, y: 370 },
    gamma: { x: 870, y: 250 },
    destmast: { x: 1020, y: 180 },
    recipient: { x: 1120, y: 250 },
    // Multi-server destinations (shows different websites live on different servers!)
    serverBbc: { x: 1120, y: 130 },
    serverWiki: { x: 1120, y: 250 },
    serverPython: { x: 1120, y: 370 }
  };

  // State
  let state = {
    scenario: 'chat', // 'chat' or 'web'
    currentStep: 0,
    maxSteps: 6,
    isPlaying: false,
    timer: null,
    stepDuration: 1200,
    isCongested: false,
    isCorrupt: false,
    selectedPacketIdx: 0,
    packets: [],
    dnsPacket: null,
    domainName: 'bbc.co.uk',
    resolvedIp: '151.101.0.81',
    serverLabel: 'BBC Server',
    serverLoc: 'London, UK',
    serverNodeId: 'nodeServerBbc',
    serverLinkId: 'linkGammaBbc'
  };

  // DOM Elements - Storyline & Scrubber
  const storyPhasePill = document.getElementById('storyPhasePill') || { set textContent(v) {} };
  const storyHeadline = document.getElementById('storyHeadline');
  const storyCaption = document.getElementById('storyCaption');
  const scrubberTrack = document.getElementById('scrubberTrack');
  const scrubberProgress = document.getElementById('scrubberProgress');
  const scrubberThumb = document.getElementById('scrubberThumb');
  const stepBackBtn = document.getElementById('stepBackBtn');
  const stepFwdBtn = document.getElementById('stepFwdBtn');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const resetJourneyBtn = document.getElementById('resetJourneyBtn');

  // DOM Elements - Canvas & Nodes
  const packetsLayer = document.getElementById('packetsLayer');
  const radioWavesLayer = document.getElementById('radioWavesLayer');
  const nodeDns = document.getElementById('nodeDns');
  const nodeBeta = document.getElementById('nodeBeta');
  const betaHalo = document.getElementById('betaHalo');
  const betaPingText = document.getElementById('betaPingText');
  const hazardIcon = document.getElementById('hazardIcon');
  const betaPrompt = document.getElementById('betaPrompt');
  const linkIspBeta = document.getElementById('linkIspBeta');

  // Scenario Destination Groups (Chat vs Web Servers)
  const groupChatLinks = document.getElementById('groupChatLinks');
  const groupWebLinks = document.getElementById('groupWebLinks');
  const groupChatNodes = document.getElementById('groupChatNodes');
  const groupWebServers = document.getElementById('groupWebServers');

  const nodeServerBbc = document.getElementById('nodeServerBbc');
  const nodeServerWiki = document.getElementById('nodeServerWiki');
  const nodeServerPython = document.getElementById('nodeServerPython');

  const linkGammaBbc = document.getElementById('linkGammaBbc');
  const linkGammaWiki = document.getElementById('linkGammaWiki');
  const linkGammaPython = document.getElementById('linkGammaPython');

  // Callouts
  const calloutDnsCard = document.getElementById('calloutDnsCard');
  const calloutDnsText = document.getElementById('calloutDnsText');
  const calloutDnsRect = document.getElementById('calloutDnsRect');
  const calloutMeshCard = document.getElementById('calloutMeshCard');
  const calloutMeshText = document.getElementById('calloutMeshText');
  const calloutMeshRect = document.getElementById('calloutMeshRect');
  const calloutReassemblyCard = document.getElementById('calloutReassemblyCard');
  const calloutReassemblyRect = document.getElementById('calloutReassemblyRect');

  // Dynamic callout pill auto-resizer to guarantee zero text clipping
  function showCallout(cardEl, textEl, rectEl, text) {
    if (!cardEl) return;
    cardEl.style.display = 'block';
    if (textEl) textEl.textContent = text;
    if (rectEl) {
      const pad = 36;
      const w = Math.max(260, Math.min(480, text.length * 7.6 + pad));
      rectEl.setAttribute('width', w);
      rectEl.setAttribute('x', -w / 2);
    }
  }

  // DOM Elements - Sender Device
  const tabModeChat = document.getElementById('tabModeChat');
  const tabModeWeb = document.getElementById('tabModeWeb');
  const senderAppLabel = document.getElementById('senderAppLabel');
  const senderChatView = document.getElementById('senderChatView');
  const senderWebView = document.getElementById('senderWebView');
  const interactiveMessageInput = document.getElementById('interactiveMessageInput');
  const sendActionBtn = document.getElementById('sendActionBtn');
  const browserDomainSelect = document.getElementById('browserDomainSelect');
  const browserGoBtn = document.getElementById('browserGoBtn');
  const slicerChips = document.getElementById('slicerChips');

  // DOM Elements - Envelope Inspector
  const inspectEnvelopeBadge = document.getElementById('inspectEnvelopeBadge');
  const corruptToggleBtn = document.getElementById('corruptToggleBtn');
  const envSrcIp = document.getElementById('envSrcIp');
  const envDestIp = document.getElementById('envDestIp');
  const envSeq = document.getElementById('envSeq');
  const envProto = document.getElementById('envProto');
  const envTtl = document.getElementById('envTtl');
  const envPayload = document.getElementById('envPayload');
  const envBytes = document.getElementById('envBytes');
  const envCrc = document.getElementById('envCrc');
  const envSealStatus = document.getElementById('envSealStatus');

  // DOM Elements - Recipient Device
  const shelfStatusPill = document.getElementById('shelfStatusPill');
  const shelfSlots = document.getElementById('shelfSlots');
  const destChatBubble = document.getElementById('destChatBubble');
  const destBubbleContent = document.getElementById('destBubbleContent');
  const destMsgTime = document.getElementById('destMsgTime');
  const destTickMarks = document.getElementById('destTickMarks');
  const destDeviceTitle = document.getElementById('destDeviceTitle');
  const destDeviceIp = document.getElementById('destDeviceIp');

  // Checksum calculation (CRC32 simulation)
  function simpleCrc(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return '0x' + hash.toString(16).toUpperCase().padStart(8, '0');
  }

  // Slice data into tangible packets
  function preparePackets() {
    state.packets = [];
    slicerChips.innerHTML = '';

    if (state.scenario === 'chat') {
      const msg = interactiveMessageInput.value.trim() || 'Meet at the library at 4pm!';
      const chunkSize = Math.max(6, Math.ceil(msg.length / 3));
      const chunks = [];
      for (let i = 0; i < msg.length; i += chunkSize) {
        chunks.push(msg.substring(i, i + chunkSize));
      }

      // DNS packet for chat.whatsapp.com
      state.dnsPacket = {
        id: 0,
        type: 'DNS',
        srcIp: '192.168.1.104',
        destIp: '8.8.8.8',
        seq: 'DNS',
        proto: 'UDP (DNS 53)',
        ttl: 64,
        payload: 'DNS: chat.whatsapp.com?',
        crc: simpleCrc('chat.whatsapp.com')
      };

      chunks.forEach((chunk, idx) => {
        const correctCrc = simpleCrc(chunk);
        state.packets.push({
          id: idx + 1,
          total: chunks.length,
          type: 'DATA',
          srcIp: '192.168.1.104',
          destIp: '172.56.21.90',
          seq: idx + 1,
          proto: 'TCP / IP',
          ttl: 64,
          payload: chunk,
          crc: correctCrc,
          corruptCrc: '0xDEADBEEF',
          route: idx === 1 ? 'beta' : 'alpha'
        });

        // Add chip to sender phone slicer tray
        const chip = document.createElement('span');
        chip.className = 'slicer-chip';
        chip.textContent = `#${idx + 1}: "${chunk}"`;
        slicerChips.appendChild(chip);
      });

      state.maxSteps = 6;
      destDeviceTitle.textContent = "Friend's Phone";
      destDeviceIp.textContent = "172.56.21.90";
    } else {
      // Web Mode
      const sel = browserDomainSelect.options[browserDomainSelect.selectedIndex] || browserDomainSelect.options[0];
      state.domainName = sel.value;
      state.resolvedIp = sel.dataset.ip || '151.101.0.81';
      state.serverLabel = sel.dataset.label || 'BBC Server';
      state.serverLoc = sel.dataset.loc || 'London, UK';
      state.serverNodeId = sel.dataset.node || 'nodeServerBbc';
      state.serverLinkId = (state.domainName === 'bbc.co.uk') ? 'linkGammaBbc' : (state.domainName === 'wikipedia.org' ? 'linkGammaWiki' : 'linkGammaPython');

      // DNS packet for domain query
      state.dnsPacket = {
        id: 0,
        type: 'DNS',
        srcIp: '192.168.1.104',
        destIp: '8.8.8.8',
        seq: 'DNS',
        proto: 'UDP (DNS 53)',
        ttl: 64,
        payload: `DNS: ${state.domainName}?`,
        crc: simpleCrc(`DNS:${state.domainName}`)
      };

      // Packets 1 & 2: Web Server HTTP Response
      state.packets.push({
        id: 1,
        total: 2,
        type: 'HTTP',
        srcIp: state.resolvedIp,
        destIp: '192.168.1.104',
        seq: 1,
        proto: 'TCP (HTTPS 443)',
        ttl: 64,
        payload: `HTTP/2 200 OK`,
        crc: simpleCrc('HTTP/2 200 OK'),
        route: 'alpha'
      });

      state.packets.push({
        id: 2,
        total: 2,
        type: 'HTTP',
        srcIp: state.resolvedIp,
        destIp: '192.168.1.104',
        seq: 2,
        proto: 'TCP (HTTPS 443)',
        ttl: 64,
        payload: `HTML: ${state.domainName}`,
        crc: simpleCrc(`HTML:${state.domainName}`),
        route: 'beta'
      });

      state.packets.forEach(p => {
        const chip = document.createElement('span');
        chip.className = 'slicer-chip';
        chip.textContent = `HTTP #${p.seq}`;
        slicerChips.appendChild(chip);
      });

      state.maxSteps = 6;
      destDeviceTitle.textContent = state.serverLabel;
      destDeviceIp.textContent = state.resolvedIp;
    }

    renderRecipientShelf();
    updateEnvelopeInspector(0);
    renderStep();
  }

  // Shelf slots on recipient device
  function renderRecipientShelf() {
    shelfSlots.innerHTML = '';
    state.packets.forEach((p, idx) => {
      const slot = document.createElement('div');
      slot.className = 'shelf-slot';
      slot.id = `shelfSlot-${idx}`;
      slot.textContent = `#${p.seq}`;
      shelfSlots.appendChild(slot);
    });

    shelfStatusPill.textContent = "Empty";
    destChatBubble.className = "dest-chat-bubble waiting";
    destBubbleContent.innerHTML = "<em>Waiting for incoming transmission...</em>";
    destTickMarks.style.display = "none";
  }

  // Update Envelope Inspector (Center Dock)
  function updateEnvelopeInspector(idx) {
    if (!state.packets || state.packets.length === 0) return;
    const p = (idx === -1 && state.dnsPacket) ? state.dnsPacket : (state.packets[idx] || state.packets[0]);
    state.selectedPacketIdx = idx;

    const protoShort = p.type === 'DNS' ? 'UDP' : (p.proto.includes('TCP') ? 'TCP' : 'UDP');
    inspectEnvelopeBadge.textContent = p.type === 'DNS' ? `Packet [DNS Query] (UDP)` : `Packet #${p.seq} of ${p.total} (${protoShort})`;
    envSrcIp.textContent = p.srcIp;
    envDestIp.textContent = p.destIp;
    envSeq.textContent = p.type === 'DNS' ? 'DNS Query' : `#${p.seq} of ${p.total}`;
    envProto.textContent = p.proto;
    envTtl.textContent = `${p.ttl} hops remaining`;
    envPayload.textContent = `"${p.payload}"`;
    envBytes.textContent = `${new Blob([p.payload]).size} bytes • UTF-8`;

    const isCorrupted = (state.isCorrupt && p.id === 2);
    if (isCorrupted) {
      envCrc.textContent = p.corruptCrc || '0xDEADBEEF';
      envSealStatus.textContent = "CRC Check Mismatch! ✗";
      envSealStatus.className = "seal-badge seal-corrupted";
    } else {
      envCrc.textContent = p.crc;
      envSealStatus.textContent = "Valid CRC ✓";
      envSealStatus.className = "seal-badge seal-valid";
    }
  }

  function getTargetServerCoord() {
    if (state.domainName === 'bbc.co.uk') return coords.serverBbc;
    if (state.domainName === 'wikipedia.org') return coords.serverWiki;
    return coords.serverPython;
  }

  // Draw animated packets onto the Living SVG World (Clean spacing, zero stacking bugs)
  function renderPacketsOnSvg(step) {
    packetsLayer.innerHTML = '';
    radioWavesLayer.innerHTML = '';
    let activePackets = [];

    if (state.scenario === 'chat') {
      if (step === 1) {
        // Step 1: Packets sliced and visibly leaving phone on wireless wave towards mast!
        drawRadioWave(coords.sender.x, coords.sender.y, coords.mast.x, coords.mast.y);
        state.packets.forEach((p, i) => {
          // Packet 3 leaving phone (185, 238), Packet 2 at (215, 218), Packet 1 at (248, 198)
          activePackets.push({ ...p, x: 248 - (i * 32), y: 198 + (i * 20), stage: 'wireless' });
        });
      } else if (step === 2) {
        // Step 2: Travelling in underground fibre optic cable from Cell Mast to ISP Gateway
        state.packets.forEach((p, i) => {
          activePackets.push({ ...p, x: 350 + (i * 35), y: 220, stage: 'fibre' });
        });
      } else if (step === 3) {
        // Step 3: ISP Gateway queries DNS Resolver (640, 80) to resolve chat.whatsapp.com!
        activePackets.push({ ...state.dnsPacket, x: coords.dns.x, y: coords.dns.y, stage: 'dns-resolve' });
      } else if (step === 4) {
        // Step 4: Router Mesh (Independent routes!)
        state.packets.forEach((p, i) => {
          let pos;
          if (p.route === 'beta' && !state.isCongested) {
            pos = { x: coords.beta.x, y: coords.beta.y };
          } else {
            pos = { x: coords.alpha.x + (i * 24 - 12), y: coords.alpha.y };
          }
          activePackets.push({ ...p, x: pos.x, y: pos.y, ttl: 63, stage: 'mesh' });
        });
      } else if (step === 5) {
        // Step 5: Converging onto destination (Out of order arrival!)
        state.packets.forEach((p, i) => {
          // Packet 1 arrived, packet 3 arrived, packet 2 trailing behind
          let xOffset = (i === 1) ? -60 : (i * 26);
          activePackets.push({ ...p, x: 970 + xOffset, y: 210, ttl: 62, stage: 'egress' });
        });
      } else if (step >= 6) {
        // Step 6: Arrived at recipient phone (Spaced neatly inside recipient zone)
        state.packets.forEach((p, i) => {
          activePackets.push({ ...p, x: coords.recipient.x - 24 + (i * 24), y: coords.recipient.y, ttl: 61, stage: 'arrived' });
        });
      }
    } else {
      // Web Mode: DNS lookup followed by HTTP routing to specific server
      const sCoord = getTargetServerCoord();
      if (step === 1) {
        // Step 1: DNS Query leaves Phone towards Cell Mast via radio waves!
        drawRadioWave(coords.sender.x, coords.sender.y, coords.mast.x, coords.mast.y);
        activePackets.push({ ...state.dnsPacket, x: 215, y: 220, stage: 'wireless' });
      } else if (step === 2) {
        // Step 2: DNS Query travelling underground in fibre cable from Mast to ISP Gateway
        activePackets.push({ ...state.dnsPacket, x: 385, y: 225, stage: 'fibre' });
      } else if (step === 3) {
        // Step 3: ISP Gateway queries DNS Server (8.8.8.8) - Resolves domain to numeric IP!
        activePackets.push({ ...state.dnsPacket, x: coords.dns.x, y: coords.dns.y, stage: 'dns-resolve' });
      } else if (step === 4) {
        // Step 4: Stamped with Server IP, HTTP GET request travels across router mesh
        activePackets.push({ ...state.packets[0], x: 660, y: 200, stage: 'http-req', payload: `GET / (${state.resolvedIp})` });
      } else if (step === 5) {
        // Step 5: Router Gamma inspects destination IP and steers directly to the target server!
        const midX = Math.round((coords.gamma.x + sCoord.x) / 2);
        const midY = Math.round((coords.gamma.y + sCoord.y) / 2);
        activePackets.push({ ...state.packets[0], x: midX, y: midY, stage: 'server-link', payload: `IP: ${state.resolvedIp}` });
      } else if (step >= 6) {
        // Step 6: At destination server / served back (200 OK)
        activePackets.push({ ...state.packets[0], x: sCoord.x - 14, y: sCoord.y, stage: 'arrived' });
        activePackets.push({ ...state.packets[1], x: sCoord.x + 16, y: sCoord.y, stage: 'arrived' });
      }
    }

    // Render active packet sprites (No CSS transform scale bug!)
    activePackets.forEach((p) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const isCorrupt = (state.isCorrupt && p.id === 2);
      g.setAttribute('class', `world-packet-sprite ${p.type === 'DNS' ? 'packet-dns' : ''} ${isCorrupt ? 'packet-glitched' : ''}`);
      g.setAttribute('transform', `translate(${p.x}, ${p.y})`);

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '-24');
      rect.setAttribute('y', '-14');
      rect.setAttribute('width', '48');
      rect.setAttribute('height', '28');
      rect.setAttribute('class', 'packet-pod-rect');

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', '0');
      text.setAttribute('class', 'packet-pod-text');
      text.textContent = p.type === 'DNS' ? 'DNS' : `#${p.seq}`;

      g.appendChild(rect);
      g.appendChild(text);

      g.addEventListener('click', (e) => {
        e.stopPropagation();
        const pIdx = (p.type === 'DNS') ? -1 : (p.id - 1);
        updateEnvelopeInspector(pIdx);
      });

      packetsLayer.appendChild(g);
    });
  }

  function drawRadioWave(x1, y1, x2, y2) {
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('cx', (x1 + x2) / 2);
    ring.setAttribute('cy', (y1 + y2) / 2);
    ring.setAttribute('r', '28');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', '#3b82f6');
    ring.setAttribute('stroke-width', '2');
    ring.setAttribute('stroke-dasharray', '4, 4');
    ring.setAttribute('opacity', '0.7');
    radioWavesLayer.appendChild(ring);
  }

  // Render Step Storyline & Canvas State
  function renderStep() {
    const step = state.currentStep;

    // Scrubber update
    const pct = (step / state.maxSteps) * 100;
    scrubberProgress.style.width = `${pct}%`;
    scrubberThumb.style.left = `${pct}%`;

    // Reset node and link highlights
    document.querySelectorAll('.world-node').forEach(n => n.classList.remove('active-node'));
    document.querySelectorAll('.wire-link').forEach(l => l.classList.remove('active-wire'));

    // Callouts hide
    calloutDnsCard.style.display = 'none';
    calloutMeshCard.style.display = 'none';
    calloutReassemblyCard.style.display = 'none';

    // Scenario destination topology visibility
    if (state.scenario === 'chat') {
      if (groupChatLinks) groupChatLinks.style.display = 'block';
      if (groupChatNodes) groupChatNodes.style.display = 'block';
      if (groupWebLinks) groupWebLinks.style.display = 'none';
      if (groupWebServers) groupWebServers.style.display = 'none';
    } else {
      if (groupChatLinks) groupChatLinks.style.display = 'none';
      if (groupChatNodes) groupChatNodes.style.display = 'none';
      if (groupWebLinks) groupWebLinks.style.display = 'block';
      if (groupWebServers) groupWebServers.style.display = 'block';

      // Default: mark all 3 servers with standby-server styling
      [nodeServerBbc, nodeServerWiki, nodeServerPython].forEach(srv => {
        if (srv) {
          srv.classList.add('standby-server');
          srv.classList.remove('active-node');
        }
      });
    }

    // Congestion state
    if (state.isCongested) {
      nodeBeta.classList.add('congested-node');
      linkIspBeta.classList.add('congested-wire');
      hazardIcon.style.display = 'block';
      betaPingText.textContent = 'CONGESTED (320ms)';
      betaPrompt.textContent = 'Click to Clear Congestion';
    } else {
      nodeBeta.classList.remove('congested-node');
      linkIspBeta.classList.remove('congested-wire');
      hazardIcon.style.display = 'none';
      betaPingText.textContent = 'Path B (16ms)';
      betaPrompt.textContent = 'Click to Congest';
    }

    renderPacketsOnSvg(step);

    // Disable / enable transport buttons
    stepBackBtn.disabled = (step === 0);
    stepFwdBtn.disabled = (step >= state.maxSteps);

    // Storyline narrative updates
    if (state.scenario === 'chat') {
      handleChatStoryline(step);
    } else {
      handleWebStoryline(step);
    }
  }

  function handleChatStoryline(step) {
    const msg = interactiveMessageInput.value.trim() || 'Meet at the library at 4pm!';

    switch (step) {
      case 0:
        storyPhasePill.textContent = 'Phase 0 • Message Ready';
        storyHeadline.textContent = 'Ready to Send WhatsApp Message';
        storyCaption.innerHTML = `You typed: <strong>"${msg}"</strong>. Tap the green <strong>Send ➔</strong> button to watch your message get sliced into packets, beamed to the cell mast, and routed across the world.`;
        updateEnvelopeInspector(0);
        break;

      case 1:
        storyPhasePill.textContent = 'Hop 1 • Wireless Radio Hop';
        storyHeadline.textContent = 'Step 1: Message Sliced into Packets & Beamed to Cell Mast';
        storyCaption.innerHTML = `<strong>Radio Transmission:</strong> TCP slices your message into <strong>${state.packets.length} numbered packets</strong>. Your phone transmits them through the air as high-frequency radio waves toward the local cell mast.`;
        document.getElementById('nodeSender').classList.add('active-node');
        document.getElementById('linkPhoneMast').classList.add('active-wire');
        document.getElementById('nodeMast').classList.add('active-node');
        updateEnvelopeInspector(0);
        break;

      case 2:
        storyPhasePill.textContent = 'Hop 2 • Underground Fibre Backhaul';
        storyHeadline.textContent = 'Step 2: Mast Converts Radio to Laser Pulses in Fibre';
        storyCaption.innerHTML = `The cell mast transceiver converts the radio waves into pulses of laser light traveling down underground <strong>fibre-optic cables</strong> to your ISP\'s Gateway Router (<code>81.2.14.1</code>).`;
        document.getElementById('nodeMast').classList.add('active-node');
        document.getElementById('linkMastIsp').classList.add('active-wire');
        document.getElementById('nodeIsp').classList.add('active-node');
        updateEnvelopeInspector(0);
        break;

      case 3:
        storyPhasePill.textContent = 'Hop 3 • DNS Directory Lookup';
        showCallout(calloutDnsCard, calloutDnsText, calloutDnsRect, 'DNS Match: chat.whatsapp.com ➔ 172.56.21.90');
        storyHeadline.textContent = 'Step 3: ISP Queries DNS Resolver (8.8.8.8)';
        storyCaption.innerHTML = `<strong>Why DNS?</strong> The internet only understands numeric IP addresses. The ISP Gateway asks <strong>DNS Resolver (8.8.8.8)</strong>: <em>"What is the IP for chat.whatsapp.com?"</em> DNS returns <code>172.56.21.90</code> so all packet headers are stamped with the correct Destination IP.`;
        document.getElementById('nodeIsp').classList.add('active-node');
        document.getElementById('linkIspDns').classList.add('active-wire');
        document.getElementById('nodeDns').classList.add('active-node');
        updateEnvelopeInspector(-1);
        break;

      case 4:
        storyPhasePill.textContent = 'Hop 4 • Dynamic Packet Switching';
        if (state.isCongested) {
          showCallout(calloutMeshCard, calloutMeshText, calloutMeshRect, 'Traffic Jam on Beta! All packets rerouted via Alpha');
          storyHeadline.textContent = 'Step 4: Congestion Detected! Dynamic Rerouting';
          storyCaption.innerHTML = `Router Beta is congested! The ISP\'s routing table spots the bottleneck and steers packets through <strong>Router Alpha</strong>. In packet switching, networks self-heal around delays!`;
          document.getElementById('nodeIsp').classList.add('active-node');
          document.getElementById('linkIspAlpha').classList.add('active-wire');
          document.getElementById('nodeAlpha').classList.add('active-node');
          document.getElementById('linkAlphaGamma').classList.add('active-wire');
          document.getElementById('nodeGamma').classList.add('active-node');
        } else {
          showCallout(calloutMeshCard, calloutMeshText, calloutMeshRect, 'Packets split across Paths A & B to dodge traffic');
          storyHeadline.textContent = 'Step 4: Independent Routing Across the Router Mesh';
          storyCaption.innerHTML = `<strong>Core GCSE Concept:</strong> Packets do <em>not</em> take a fixed single line! Packet #1 takes <strong>Path A (Router Alpha)</strong>, while Packet #2 takes <strong>Path B (Router Beta)</strong>. Routers inspect the destination IP and find the fastest available path.`;
          document.getElementById('nodeIsp').classList.add('active-node');
          document.getElementById('linkIspAlpha').classList.add('active-wire');
          document.getElementById('linkIspBeta').classList.add('active-wire');
          document.getElementById('nodeAlpha').classList.add('active-node');
          document.getElementById('nodeBeta').classList.add('active-node');
          document.getElementById('linkAlphaGamma').classList.add('active-wire');
          document.getElementById('linkBetaGamma').classList.add('active-wire');
          document.getElementById('nodeGamma').classList.add('active-node');
        }
        break;

      case 5:
        storyPhasePill.textContent = 'Hop 5 • Out-of-Order Arrival';
        storyHeadline.textContent = 'Step 5: Packets Converge at Destination Mast Out of Order';
        storyCaption.innerHTML = `Because they took different paths, packets arrive out of order! <strong>Packet #1</strong> and <strong>Packet #3</strong> arrived first; <strong>Packet #2</strong> was delayed. The recipient mast prepares the wireless broadcast to the friend\'s phone.`;
        document.getElementById('nodeGamma').classList.add('active-node');
        document.getElementById('linkGammaDestMast').classList.add('active-wire');
        document.getElementById('nodeDestMast').classList.add('active-node');
        
        const slot0 = document.getElementById('shelfSlot-0');
        if (slot0) {
          slot0.className = 'shelf-slot filled';
          slot0.textContent = '#1 ✓';
        }
        shelfStatusPill.textContent = 'Reordering...';
        break;

      case 6:
        storyPhasePill.textContent = 'Hop 6 • Checksum Check & Reassembly';
        if (state.isCorrupt) {
          storyHeadline.textContent = 'Step 6: CRC Error! Packet #2 Discarded by Recipient';
          storyCaption.innerHTML = `<span style="color:#ef4444; font-weight:800;">TCP Reliability in Action:</span> A bit flipped during transmission in Packet #2. The recipient recalculated the CRC checksum, found it did NOT match the trailer, and <strong>rejected the packet</strong>! Because Packet #2 is missing, the message cannot be assembled. TCP now sends a <strong>Retransmission Request</strong> back to sender!`;
          shelfStatusPill.textContent = 'CRC Error ✗';
          shelfStatusPill.className = 'shelf-status-pill corrupt';

          const slot0 = document.getElementById('shelfSlot-0');
          const slot1 = document.getElementById('shelfSlot-1');
          const slot2 = document.getElementById('shelfSlot-2');
          if (slot0) { slot0.className = 'shelf-slot filled'; slot0.textContent = '#1 ✓'; slot0.style.borderColor = ''; slot0.style.color = ''; }
          if (slot1) {
            slot1.className = 'shelf-slot corrupt';
            slot1.textContent = '#2 ✗';
          }
          if (slot2) { slot2.className = 'shelf-slot filled'; slot2.textContent = '#3 ✓'; slot2.style.borderColor = ''; slot2.style.color = ''; }

          // Message blocked from rendering! Show explicit error card
          destChatBubble.className = 'dest-chat-bubble corrupt-blocked';
          destBubbleContent.innerHTML = `
            <div class="corrupt-alert-badge">TCP CRC Checksum Failed</div>
            <div class="corrupt-alert-body">Packet #2 rejected (corrupted in transit). Message cannot assemble!</div>
            <button id="tcpRetransmitActionBtn" class="tcp-retransmit-action-btn">
              Send TCP Retransmission Request (Resend #2)
            </button>
          `;
          destTickMarks.style.display = 'none';
          destMsgTime.textContent = '--:--';

          const retransmitBtn = document.getElementById('tcpRetransmitActionBtn');
          if (retransmitBtn) {
            retransmitBtn.onclick = () => triggerTcpRetransmit(msg);
          }
        } else {
          showCallout(calloutReassemblyCard, calloutReassemblyText, calloutReassemblyRect, 'Reordered by Sequence Number ✓');
          storyHeadline.textContent = 'Step 6: Sequence Reordered & Checksums Verified!';
          storyCaption.innerHTML = `The recipient device read the <strong>Sequence Numbers</strong> in the packet headers, snapped them into order (1 ➔ 2 ➔ 3), verified all <strong>CRC Checksums</strong>, and popped the message onto the screen!`;

          state.packets.forEach((p, idx) => {
            const slot = document.getElementById(`shelfSlot-${idx}`);
            if (slot) {
              slot.className = 'shelf-slot filled';
              slot.textContent = `#${p.seq} ✓`;
              slot.style.borderColor = '';
              slot.style.color = '';
            }
          });

          shelfStatusPill.textContent = 'Verified ✓';
          shelfStatusPill.className = 'shelf-status-pill';
          destChatBubble.className = 'dest-chat-bubble';
          destBubbleContent.textContent = msg;
          destTickMarks.style.display = 'inline';
          destMsgTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        document.getElementById('linkDestMastPhone').classList.add('active-wire');
        document.getElementById('nodeRecipient').classList.add('active-node');
        break;
    }
  }

  function handleWebStoryline(step) {
    const targetNode = document.getElementById(state.serverNodeId);
    const targetLink = document.getElementById(state.serverLinkId);

    switch (step) {
      case 0:
        storyPhasePill.textContent = 'Phase 0 • Domain Selected';
        storyHeadline.textContent = `Ready to Lookup & Route to ${state.domainName}`;
        storyCaption.innerHTML = `You selected <code>${state.domainName}</code>. Your browser only knows the human name. Tap <strong>Go ➔</strong> or <strong>Step ❯</strong> to watch DNS resolve the IP and routers steer to the specific server!`;
        updateEnvelopeInspector(-1);
        break;

      case 1:
        storyPhasePill.textContent = 'Hop 1 • Wireless Radio Hop';
        storyHeadline.textContent = 'Step 1: DNS Query Beamed from Phone to Cell Mast';
        storyCaption.innerHTML = `Your device creates a <strong>DNS Query packet</strong> addressed to DNS Resolver <code>8.8.8.8</code> asking: <em>"What is the IP address for ${state.domainName}?"</em> It beams this through the air via radio waves to the local cell mast.`;
        document.getElementById('nodeSender').classList.add('active-node');
        document.getElementById('linkPhoneMast').classList.add('active-wire');
        document.getElementById('nodeMast').classList.add('active-node');
        updateEnvelopeInspector(-1);
        break;

      case 2:
        storyPhasePill.textContent = 'Hop 2 • Underground Fibre Backhaul';
        storyHeadline.textContent = 'Step 2: DNS Query Travels Underground to ISP Gateway';
        storyCaption.innerHTML = `The cell mast converts the radio wave into pulses of light inside underground <strong>fibre-optic cables</strong> and forwards the query packet to the ISP Gateway Router (<code>81.2.14.1</code>).`;
        document.getElementById('nodeMast').classList.add('active-node');
        document.getElementById('linkMastIsp').classList.add('active-wire');
        document.getElementById('nodeIsp').classList.add('active-node');
        updateEnvelopeInspector(-1);
        break;

      case 3:
        showCallout(calloutDnsCard, calloutDnsText, calloutDnsRect, `DNS Match: ${state.domainName} ➔ ${state.resolvedIp} (${state.serverLoc})`);
        storyPhasePill.textContent = 'Hop 3 • DNS Directory Match';
        storyHeadline.textContent = `Step 3: DNS Server (8.8.8.8) Resolves Domain to ${state.resolvedIp}`;
        storyCaption.innerHTML = `The <strong>DNS Resolver (8.8.8.8)</strong> queries its worldwide database. It finds that <code>${state.domainName}</code> maps to IP <code>${state.resolvedIp}</code> located at the <strong>${state.serverLabel} (${state.serverLoc})</strong>. Now packets can be stamped with this destination IP!`;
        document.getElementById('nodeIsp').classList.add('active-node');
        document.getElementById('linkIspDns').classList.add('active-wire');
        document.getElementById('nodeDns').classList.add('active-node');
        updateEnvelopeInspector(-1);
        break;

      case 4:
        storyPhasePill.textContent = 'Hop 4 • Router Mesh Traversal';
        storyHeadline.textContent = `Step 4: Request Packet Enters Backbone Router Mesh`;
        storyCaption.innerHTML = `Armed with destination IP <code>${state.resolvedIp}</code>, the HTTP GET request travels through the backbone routers (Alpha & Beta). Routers inspect the destination IP in the packet header to pick the optimal path!`;
        document.getElementById('nodeIsp').classList.add('active-node');
        document.getElementById('linkIspAlpha').classList.add('active-wire');
        document.getElementById('nodeAlpha').classList.add('active-node');
        document.getElementById('linkAlphaGamma').classList.add('active-wire');
        document.getElementById('nodeGamma').classList.add('active-node');
        updateEnvelopeInspector(0);
        break;

      case 5:
        showCallout(calloutMeshCard, calloutMeshText, calloutMeshRect, `Router Gamma steers to ${state.serverLabel} (${state.resolvedIp})`);
        storyPhasePill.textContent = 'Hop 5 • Targeted Server Routing';
        storyHeadline.textContent = `Step 5: Router Gamma Steers Directly to ${state.serverLabel}`;
        storyCaption.innerHTML = `<strong>GCSE Key Concept:</strong> Different websites live on <strong>different physical servers</strong>! Router Gamma reads destination IP <code>${state.resolvedIp}</code> and steers the request down the dedicated cable to the <strong>${state.serverLabel} in ${state.serverLoc}</strong>. Notice how the other servers remain on standby!`;
        document.getElementById('nodeGamma').classList.add('active-node');
        if (targetLink) targetLink.classList.add('active-wire');
        if (targetNode) {
          targetNode.classList.remove('standby-server');
          targetNode.classList.add('active-node');
        }
        updateEnvelopeInspector(0);
        break;

      case 6:
        showCallout(calloutReassemblyCard, calloutReassemblyText, calloutReassemblyRect, `${state.domainName} Responded (200 OK) ✓`);
        storyPhasePill.textContent = 'Hop 6 • Webpage Delivered & Rendered';
        storyHeadline.textContent = `Step 6: ${state.serverLabel} Responds & Webpage Loads!`;
        storyCaption.innerHTML = `The <strong>${state.serverLabel}</strong> processes the request and sends the HTML webpage packets back. Your browser validates the checksums, reassembles the HTML, and displays the page!`;
        if (targetNode) {
          targetNode.classList.remove('standby-server');
          targetNode.classList.add('active-node');
        }
        document.getElementById('nodeSender').classList.add('active-node');

        destChatBubble.className = 'dest-chat-bubble';
        destBubbleContent.innerHTML = `<strong>${state.domainName}</strong> (${state.serverLabel})<br><span style="font-size:11px; color:#a7f3d0;">IP: ${state.resolvedIp} • Location: ${state.serverLoc}</span><br><span style="font-size:11px; color:#38bdf8;">Status: 200 OK (HTTPS Secured)</span>`;
        destTickMarks.style.display = 'inline';
        shelfStatusPill.textContent = 'Loaded 200 OK ✓';

        state.packets.forEach((p, idx) => {
          const slot = document.getElementById(`shelfSlot-${idx}`);
          if (slot) {
            slot.className = 'shelf-slot filled';
            slot.textContent = `#${p.seq} ✓`;
          }
        });
        break;
    }
  }

  function triggerTcpRetransmit(msg) {
    const retransmitBtn = document.getElementById('tcpRetransmitActionBtn');
    if (retransmitBtn) {
      retransmitBtn.disabled = true;
      retransmitBtn.textContent = '⏳ Requesting Packet #2 from Sender...';
    }

    storyHeadline.textContent = 'TCP Retransmission in Progress: Sender Resends Packet #2';
    storyCaption.innerHTML = `Recipient issued a <strong>TCP Repeat Request (NACK)</strong> for corrupted Packet #2. Sender immediately transmits a fresh, uncorrupted segment across the network!`;

    // Visually re-animate clean packet #2 flying from sender across network
    const stages = [
      { x: coords.sender.x, y: coords.sender.y },
      { x: coords.mast.x, y: coords.mast.y },
      { x: coords.isp.x, y: coords.isp.y },
      { x: coords.alpha.x, y: coords.alpha.y },
      { x: coords.destmast.x, y: coords.destmast.y },
      { x: coords.recipient.x, y: coords.recipient.y }
    ];

    let currentHop = 0;
    const animTimer = setInterval(() => {
      currentHop++;
      if (currentHop < stages.length) {
        const stage = stages[currentHop];
        packetsLayer.innerHTML = '';
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${stage.x}, ${stage.y})`);
        g.setAttribute('class', 'world-packet-sprite');
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '-28');
        rect.setAttribute('y', '-12');
        rect.setAttribute('width', '56');
        rect.setAttribute('height', '24');
        rect.setAttribute('rx', '6');
        rect.setAttribute('fill', '#10b981');
        rect.setAttribute('stroke', '#059669');
        rect.setAttribute('stroke-width', '2');
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'packet-pod-text');
        text.textContent = '#2 [Resent]';
        g.appendChild(rect);
        g.appendChild(text);
        packetsLayer.appendChild(g);
      } else {
        clearInterval(animTimer);
        // Clean packet arrived
        state.isCorrupt = false;
        corruptToggleBtn.classList.remove('active');
        if (state.packets[1]) {
          state.packets[1].crc = simpleCrc(state.packets[1].payload);
        }
        updateEnvelopeInspector(1);

        const slot1 = document.getElementById('shelfSlot-1');
        if (slot1) {
          slot1.className = 'shelf-slot filled';
          slot1.textContent = '#2 ✓';
          slot1.style.borderColor = '';
          slot1.style.color = '';
        }

        shelfStatusPill.textContent = 'Verified ✓';
        shelfStatusPill.className = 'shelf-status-pill';
        destChatBubble.className = 'dest-chat-bubble';
        destBubbleContent.textContent = msg;
        destTickMarks.style.display = 'inline';
        destMsgTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        renderPacketsOnSvg(6);

        storyHeadline.textContent = 'Step 6: TCP Retransmission Succeeded! Message Delivered ✓';
        storyCaption.innerHTML = `<strong>GCSE Core TCP Concept:</strong> TCP guarantees 100% reliable transmission. When a packet fails its checksum, TCP automatically requests a retransmission. The fresh clean Packet #2 was received, verified, and reassembled with the others!`;
      }
    }, 240);
  }

  // Transport Controls
  stepFwdBtn.addEventListener('click', () => {
    if (state.currentStep < state.maxSteps) {
      state.currentStep++;
      renderStep();
    }
  });

  stepBackBtn.addEventListener('click', () => {
    if (state.currentStep > 0) {
      state.currentStep--;
      renderStep();
    }
  });

  function stopPlay() {
    state.isPlaying = false;
    clearInterval(state.timer);
    state.timer = null;
    playIcon.style.display = 'inline';
    pauseIcon.style.display = 'none';
  }

  playPauseBtn.addEventListener('click', () => {
    if (state.isPlaying) {
      stopPlay();
    } else {
      if (state.currentStep >= state.maxSteps) {
        state.currentStep = 0;
      }
      state.isPlaying = true;
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline';

      state.timer = setInterval(() => {
        if (state.currentStep < state.maxSteps) {
          state.currentStep++;
          renderStep();
        } else {
          stopPlay();
        }
      }, state.stepDuration);
    }
  });

  resetJourneyBtn.addEventListener('click', () => {
    stopPlay();
    state.currentStep = 0;
    preparePackets();
  });

  // Scrubber Track interaction (Click or Drag)
  scrubberTrack.addEventListener('click', (e) => {
    const rect = scrubberTrack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetStep = Math.round(ratio * state.maxSteps);
    state.currentStep = targetStep;
    renderStep();
  });

  // Direct Node Interactions: Click Router Beta to Congest / Clear!
  nodeBeta.addEventListener('click', () => {
    state.isCongested = !state.isCongested;
    renderStep();
  });

  // Click DNS Node to toggle its live table!
  nodeDns.addEventListener('click', () => {
    const isShown = (calloutDnsCard.style.display === 'block');
    if (isShown) {
      calloutDnsCard.style.display = 'none';
    } else {
      const matchText = (state.scenario === 'chat')
        ? `DNS (8.8.8.8): chat.whatsapp.com ➔ 172.56.21.90`
        : `DNS (8.8.8.8): ${state.domainName} ➔ ${state.resolvedIp}`;
      showCallout(calloutDnsCard, calloutDnsText, calloutDnsRect, matchText);
    }
  });

  // Sender Actions
  sendActionBtn.addEventListener('click', () => {
    stopPlay();
    state.currentStep = 0;
    preparePackets();
    state.isPlaying = true;
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'inline';
    state.timer = setInterval(() => {
      if (state.currentStep < state.maxSteps) {
        state.currentStep++;
        renderStep();
      } else {
        stopPlay();
      }
    }, state.stepDuration);
  });

  browserGoBtn.addEventListener('click', () => {
    sendActionBtn.click();
  });

  // Prominent Mode Tabs (WhatsApp vs Website URL)
  tabModeChat.addEventListener('click', () => {
    tabModeChat.classList.add('active');
    tabModeWeb.classList.remove('active');
    state.scenario = 'chat';
    senderAppLabel.textContent = 'Chat';
    senderChatView.style.display = 'flex';
    senderWebView.style.display = 'none';
    stopPlay();
    state.currentStep = 0;
    preparePackets();
  });

  tabModeWeb.addEventListener('click', () => {
    tabModeWeb.classList.add('active');
    tabModeChat.classList.remove('active');
    state.scenario = 'web';
    senderAppLabel.textContent = 'Web Browser';
    senderChatView.style.display = 'none';
    senderWebView.style.display = 'flex';
    stopPlay();
    state.currentStep = 0;
    preparePackets();
  });

  // Checksum Error Toggle
  corruptToggleBtn.addEventListener('click', () => {
    state.isCorrupt = !state.isCorrupt;
    corruptToggleBtn.classList.toggle('active', state.isCorrupt);
    updateEnvelopeInspector(state.selectedPacketIdx);
    renderStep();
  });

  interactiveMessageInput.addEventListener('input', () => {
    stopPlay();
    state.currentStep = 0;
    preparePackets();
  });

  browserDomainSelect.addEventListener('change', () => {
    stopPlay();
    state.currentStep = 0;
    preparePackets();
  });

  // Initial Journey Setup
  preparePackets();


  // =========================================================================
  // 4. TAB 2: TOPOLOGIES PLAYGROUND (STAR vs BUS vs MESH)
  // =========================================================================
  const topoPills = document.querySelectorAll('#topoPills .topo-pill');
  const topoSvg = document.getElementById('topoSvg');
  const topoCurrentTitle = document.getElementById('topoCurrentTitle');
  const topoHealthBadge = document.getElementById('topoHealthBadge');
  const topoFeedback = document.getElementById('topoFeedback');
  const topoFeedbackIcon = document.getElementById('topoFeedbackIcon');
  const topoFeedbackText = document.getElementById('topoFeedbackText');
  const topoPingBtn = document.getElementById('topoPingBtn');
  const topoRepairBtn = document.getElementById('topoRepairBtn');
  const topoPresetButtons = document.getElementById('topoPresetButtons');

  const metricCost = document.getElementById('metricCost');
  const metricSpof = document.getElementById('metricSpof');
  const metricCollisions = document.getElementById('metricCollisions');
  const metricPaths = document.getElementById('metricPaths');
  const factCardTitle = document.getElementById('factCardTitle');
  const factCardBody = document.getElementById('factCardBody');
  const factExamTip = document.getElementById('factExamTip');

  let currentTopo = 'star';
  let cutCables = new Set();
  let isSwitchBroken = false;
  let isTerminatorBroken = false;
  let isTopoAnimating = false;

  const topoDefinitions = {
    star: {
      title: "Star Topology (Central Switch)",
      cost: "Moderate • O(N) cables",
      spof: "Central Switch (Single Point of Failure)",
      collisions: "Zero (Dedicated switch ports)",
      paths: "1 per workstation (Direct)",
      factTitle: "Star Topology in GCSE Computer Science",
      factBody: `In a star network, every workstation connects directly to a central network switch via its own cable.<br>
      <strong>• Advantage:</strong> If a cable breaks, only that single workstation loses connectivity; the rest of the network continues uninterrupted.<br>
      <strong>• Disadvantage:</strong> The central switch is a <strong>Single Point of Failure (SPOF)</strong>. If it breaks, the entire network crashes.<br>
      <strong>• Modern LANs:</strong> Almost all modern schools, offices, and home Wi-Fi/Ethernet setups use star topology.`,
      examTip: `<strong>AQA Exam Tip:</strong> Questions frequently ask why a star network is better than a bus network. Mention: higher bandwidth (no shared cable), ease of adding new devices without disrupting others, and zero packet collisions thanks to the switch.`
    },
    bus: {
      title: "Bus Topology (Backbone Cable)",
      cost: "Very Low • 1 shared trunk",
      spof: "Backbone Cable & Terminators",
      collisions: "High (Shared carrier collision domain)",
      paths: "1 shared path for all devices",
      factTitle: "Bus Topology in GCSE Computer Science",
      factBody: `All devices connect to a single shared backbone cable. <strong>Terminators</strong> at both ends absorb electrical signals to stop them reflecting back.<br>
      <strong>• Advantage:</strong> Very cheap to install; uses the least amount of cable.<br>
      <strong>• Disadvantage 1:</strong> If the backbone cable breaks, signals bounce off the break and collide, causing <strong>total network collapse</strong>.<br>
      <strong>• Disadvantage 2:</strong> Data is broadcast to everyone; more devices create severe packet collisions and slow performance.`,
      examTip: `<strong>AQA Exam Tip:</strong> Always remember the role of <em>Terminators</em>: they absorb electrical energy at each end of the backbone cable to prevent <strong>signal reflection</strong> and collisions!`
    },
    mesh: {
      title: "Mesh Topology (Redundant Links)",
      cost: "Very High • O(N²) complex cabling",
      spof: "None (Self-healing redundancy)",
      collisions: "Zero (Dynamic routing across mesh)",
      paths: "Multiple redundant paths",
      factTitle: "Mesh Topology in GCSE Computer Science",
      factBody: `In a mesh network, nodes are interconnected with multiple redundant connections. There is no central switch or shared single trunk.<br>
      <strong>• Advantage:</strong> Extremely fault-tolerant! If any cable breaks, routing algorithms automatically and instantly steer packets around the failure.<br>
      <strong>• Disadvantage:</strong> High cost and complex installation; requires massive cabling and sophisticated routing hardware.<br>
      <strong>• Real-world Uses:</strong> The global Internet backbone, military networks, and wireless mesh Wi-Fi nodes.`,
      examTip: `<strong>AQA Exam Tip:</strong> Differentiate between <em>Full Mesh</em> (every node connects to every other node) and <em>Partial Mesh</em> (nodes have multiple connections, but not to every single device). Partial mesh is far more practical and cost-effective.`
    }
  };

  function updateTopoPresets() {
    if (!topoPresetButtons) return;
    topoPresetButtons.innerHTML = '';

    let presets = [];
    if (currentTopo === 'star') {
      presets = [
        { label: 'Normal Operation', fn: () => { cutCables.clear(); isSwitchBroken = false; renderTopology(); } },
        { label: 'Cut Node 1 Cable', fn: () => { cutCables.clear(); isSwitchBroken = false; cutCables.add('cable-switch-n1'); renderTopology(); } },
        { label: 'Cut Node 4 Cable', fn: () => { cutCables.clear(); isSwitchBroken = false; cutCables.add('cable-switch-n4'); renderTopology(); } },
        { label: 'Crash Central Switch (SPOF)', fn: () => { cutCables.clear(); isSwitchBroken = true; renderTopology(); } }
      ];
    } else if (currentTopo === 'bus') {
      presets = [
        { label: 'Normal Operation', fn: () => { cutCables.clear(); isTerminatorBroken = false; renderTopology(); } },
        { label: 'Cut Drop Cable (Node 1)', fn: () => { cutCables.clear(); isTerminatorBroken = false; cutCables.add('cable-drop-n1'); renderTopology(); } },
        { label: 'Sever Backbone Cable', fn: () => { cutCables.clear(); isTerminatorBroken = false; cutCables.add('cable-backbone'); renderTopology(); } },
        { label: 'Remove Terminator', fn: () => { cutCables.clear(); isTerminatorBroken = true; renderTopology(); } }
      ];
    } else {
      presets = [
        { label: 'Normal Operation', fn: () => { cutCables.clear(); renderTopology(); } },
        { label: 'Cut Direct Wire (1 ➔ 4)', fn: () => { cutCables.clear(); cutCables.add('cable-n1-n4'); renderTopology(); } },
        { label: 'Cut Alternate Wire (1 ➔ 5)', fn: () => { cutCables.clear(); cutCables.add('cable-n1-n5'); renderTopology(); } },
        { label: 'Isolate Node 4 Completely', fn: () => { cutCables.clear(); cutCables.add('cable-n1-n4'); cutCables.add('cable-n3-n4'); cutCables.add('cable-n4-n5'); renderTopology(); } }
      ];
    }

    presets.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'topo-preset-btn';
      btn.textContent = p.label;
      btn.addEventListener('click', p.fn);
      topoPresetButtons.appendChild(btn);
    });
  }

  function renderTopology() {
    topoSvg.innerHTML = '';
    const def = topoDefinitions[currentTopo];
    topoCurrentTitle.textContent = def.title;
    metricCost.textContent = def.cost;
    metricSpof.textContent = def.spof;
    metricCollisions.textContent = def.collisions;
    metricPaths.textContent = def.paths;
    factCardTitle.innerHTML = def.factTitle;
    factCardBody.innerHTML = def.factBody;
    factExamTip.innerHTML = def.examTip;

    updateTopoPresets();

    // Layers
    const linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    linksGroup.id = 'topoLinksLayer';
    const packetsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    packetsGroup.id = 'topoPacketsLayer';
    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodesGroup.id = 'topoNodesLayer';

    topoSvg.appendChild(linksGroup);
    topoSvg.appendChild(packetsGroup);
    topoSvg.appendChild(nodesGroup);

    if (currentTopo === 'star') {
      renderStarTopology(linksGroup, nodesGroup);
    } else if (currentTopo === 'bus') {
      renderBusTopology(linksGroup, nodesGroup);
    } else if (currentTopo === 'mesh') {
      renderMeshTopology(linksGroup, nodesGroup);
    }

    checkNetworkHealth();
  }

  function renderStarTopology(linksG, nodesG) {
    const center = { x: 410, y: 200 };
    const nodes = [
      { id: 'switch', label: 'Central Switch', isHub: true, x: center.x, y: center.y },
      { id: 'n1', label: 'Node 1 (Sender)', x: 190, y: 110, ip: '192.168.1.11' },
      { id: 'n2', label: 'Node 2', x: 630, y: 110, ip: '192.168.1.12' },
      { id: 'n3', label: 'Node 3', x: 630, y: 290, ip: '192.168.1.13' },
      { id: 'n4', label: 'Node 4 (Target)', x: 190, y: 290, ip: '192.168.1.14' },
      { id: 'server', label: 'School Server', x: 410, y: 70, ip: '192.168.1.200' }
    ];

    nodes.slice(1).forEach(n => {
      const cableId = `cable-switch-${n.id}`;
      const isCut = cutCables.has(cableId);
      drawInteractiveCable(linksG, center.x, center.y, n.x, n.y, cableId, isCut);
    });

    // Draw central switch
    drawTopoSwitch(nodesG, center.x, center.y, isSwitchBroken);

    // Draw workstations
    nodes.slice(1).forEach(n => {
      drawTopoWorkstation(nodesG, n.x, n.y, n.label, n.ip, n.id);
    });
  }

  function renderBusTopology(linksG, nodesG) {
    const backboneId = 'cable-backbone';
    const isBackboneCut = cutCables.has(backboneId);

    // Backbone Trunk Line
    drawInteractiveCable(linksG, 140, 200, 680, 200, backboneId, isBackboneCut, 6);

    // Terminators at ends
    drawInteractiveTerminator(nodesG, 130, 200, "Terminator A", isTerminatorBroken);
    drawInteractiveTerminator(nodesG, 690, 200, "Terminator B", isTerminatorBroken);

    const drops = [
      { id: 'n1', label: 'Node 1 (Sender)', x: 210, y: 95, bx: 210, by: 200, ip: '192.168.1.11' },
      { id: 'n2', label: 'Node 2', x: 350, y: 305, bx: 350, by: 200, ip: '192.168.1.12' },
      { id: 'n3', label: 'Node 3', x: 490, y: 95, bx: 490, by: 200, ip: '192.168.1.13' },
      { id: 'n4', label: 'Node 4 (Target)', x: 610, y: 305, bx: 610, by: 200, ip: '192.168.1.14' }
    ];

    drops.forEach(d => {
      const dropId = `cable-drop-${d.id}`;
      const isCut = cutCables.has(dropId);
      drawInteractiveCable(linksG, d.x, d.y, d.bx, d.by, dropId, isCut, 3);
      drawTopoWorkstation(nodesG, d.x, d.y, d.label, d.ip, d.id);
    });
  }

  function renderMeshTopology(linksG, nodesG) {
    const nodes = [
      { id: 'n1', label: 'Node 1 (Sender)', x: 200, y: 120, ip: '10.0.0.1' },
      { id: 'n2', label: 'Node 2', x: 620, y: 120, ip: '10.0.0.2' },
      { id: 'n3', label: 'Node 3', x: 620, y: 280, ip: '10.0.0.3' },
      { id: 'n4', label: 'Node 4 (Target)', x: 200, y: 280, ip: '10.0.0.4' },
      { id: 'n5', label: 'Relay Node 5', x: 410, y: 200, ip: '10.0.0.5', isRelay: true }
    ];

    const links = [
      ['n1', 'n2'], ['n2', 'n3'], ['n3', 'n4'], ['n4', 'n1'],
      ['n1', 'n5'], ['n2', 'n5'], ['n3', 'n5'], ['n4', 'n5']
    ];

    links.forEach(([a, b]) => {
      const na = nodes.find(n => n.id === a);
      const nb = nodes.find(n => n.id === b);
      const cableId = `cable-${a}-${b}`;
      const isCut = cutCables.has(cableId);
      drawInteractiveCable(linksG, na.x, na.y, nb.x, nb.y, cableId, isCut, 3);
    });

    nodes.forEach(n => {
      if (n.isRelay) {
        drawTopoRouter(nodesG, n.x, n.y, n.label, n.ip);
      } else {
        drawTopoWorkstation(nodesG, n.x, n.y, n.label, n.ip, n.id);
      }
    });
  }

  // Draw cable with wide clickable hitbox for effortless scissors cutting
  function drawInteractiveCable(g, x1, y1, x2, y2, cableId, isCut, strokeWidth = 3) {
    const lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    if (isCut) {
      // Severed visual gap
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', x1); line1.setAttribute('y1', y1);
      line1.setAttribute('x2', x1 + (midX - x1) * 0.7); line1.setAttribute('y2', y1 + (midY - y1) * 0.7);
      line1.setAttribute('stroke', '#ef4444');
      line1.setAttribute('stroke-width', strokeWidth);
      line1.setAttribute('stroke-dasharray', '4, 4');

      const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', x2); line2.setAttribute('y1', y2);
      line2.setAttribute('x2', x2 + (midX - x2) * 0.7); line2.setAttribute('y2', y2 + (midY - y2) * 0.7);
      line2.setAttribute('stroke', '#ef4444');
      line2.setAttribute('stroke-width', strokeWidth);
      line2.setAttribute('stroke-dasharray', '4, 4');

      // Severed Badge
      const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      badge.setAttribute('transform', `translate(${midX}, ${midY})`);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '-26'); rect.setAttribute('y', '-10');
      rect.setAttribute('width', '52'); rect.setAttribute('height', '20');
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', '#ef4444');
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-weight', '800');
      text.setAttribute('fill', '#ffffff');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('y', '4');
      text.textContent = '⚡ SEVERED';
      badge.appendChild(rect);
      badge.appendChild(text);

      lineGroup.appendChild(line1);
      lineGroup.appendChild(line2);
      lineGroup.appendChild(badge);
    } else {
      const visibleLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      visibleLine.setAttribute('x1', x1); visibleLine.setAttribute('y1', y1);
      visibleLine.setAttribute('x2', x2); visibleLine.setAttribute('y2', y2);
      visibleLine.setAttribute('stroke', '#334155');
      visibleLine.setAttribute('stroke-width', strokeWidth);
      visibleLine.setAttribute('class', 'topo-cable-line');
      lineGroup.appendChild(visibleLine);
    }

    // Invisible wide click hitbox (28px wide)
    const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hitbox.setAttribute('x1', x1); hitbox.setAttribute('y1', y1);
    hitbox.setAttribute('x2', x2); hitbox.setAttribute('y2', y2);
    hitbox.setAttribute('stroke', 'transparent');
    hitbox.setAttribute('stroke-width', '28');
    hitbox.setAttribute('style', 'cursor: pointer;');
    hitbox.setAttribute('title', isCut ? 'Click to reconnect wire' : 'Click to cut wire with scissors ✂');
    hitbox.addEventListener('click', () => toggleCable(cableId));

    lineGroup.appendChild(hitbox);
    g.appendChild(lineGroup);
  }

  function drawTopoSwitch(g, x, y, isBroken) {
    const grp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    grp.setAttribute('transform', `translate(${x}, ${y})`);
    grp.setAttribute('style', 'cursor: pointer;');
    grp.setAttribute('title', 'Click to break or repair Central Switch (Single Point of Failure simulation)');

    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    halo.setAttribute('r', '36');
    halo.setAttribute('fill', isBroken ? 'rgba(239, 68, 68, 0.2)' : 'rgba(37, 99, 235, 0.1)');
    halo.setAttribute('stroke', isBroken ? '#ef4444' : '#3b82f6');
    halo.setAttribute('stroke-width', isBroken ? '3' : '2');

    const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    body.setAttribute('x', '-22'); body.setAttribute('y', '-14');
    body.setAttribute('width', '44'); body.setAttribute('height', '28');
    body.setAttribute('rx', '5');
    body.setAttribute('fill', isBroken ? '#ef4444' : '#1e293b');
    body.setAttribute('stroke', isBroken ? '#b91c1c' : '#3b82f6');
    body.setAttribute('stroke-width', '2');

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('y', '50');
    label.setAttribute('class', 'node-title');
    label.setAttribute('font-size', '13');
    label.setAttribute('font-weight', '800');
    label.setAttribute('fill', isBroken ? '#ef4444' : 'currentColor');
    label.textContent = isBroken ? 'SWITCH OFFLINE' : 'Central Switch';

    const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sub.setAttribute('y', '66');
    sub.setAttribute('class', 'node-desc');
    sub.setAttribute('font-size', '10.5');
    sub.setAttribute('fill', isBroken ? '#ef4444' : 'var(--text-muted)');
    sub.textContent = isBroken ? 'Single Point of Failure!' : 'Click to Break Switch';

    grp.appendChild(halo);
    grp.appendChild(body);
    grp.appendChild(label);
    grp.appendChild(sub);

    grp.addEventListener('click', () => {
      isSwitchBroken = !isSwitchBroken;
      renderTopology();
    });

    g.appendChild(grp);
  }

  function drawTopoWorkstation(g, x, y, label, ip, id) {
    const grp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    grp.setAttribute('transform', `translate(${x}, ${y})`);

    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    halo.setAttribute('r', '26');
    halo.setAttribute('class', 'node-halo halo-device');

    const screen = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    screen.setAttribute('x', '-13'); screen.setAttribute('y', '-12');
    screen.setAttribute('width', '26'); screen.setAttribute('height', '18');
    screen.setAttribute('rx', '3');
    screen.setAttribute('fill', 'none');
    screen.setAttribute('stroke', 'currentColor');
    screen.setAttribute('stroke-width', '2');

    const stand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    stand.setAttribute('x1', '0'); stand.setAttribute('y1', '6');
    stand.setAttribute('x2', '0'); stand.setAttribute('y2', '12');
    stand.setAttribute('stroke', 'currentColor');
    stand.setAttribute('stroke-width', '2.5');

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('y', '38');
    title.setAttribute('class', 'node-title');
    title.setAttribute('font-size', '12');
    title.textContent = label;

    const ipText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    ipText.setAttribute('y', '52');
    ipText.setAttribute('class', 'node-ip');
    ipText.setAttribute('font-size', '10');
    ipText.textContent = ip;

    grp.appendChild(halo);
    grp.appendChild(screen);
    grp.appendChild(stand);
    grp.appendChild(title);
    grp.appendChild(ipText);
    g.appendChild(grp);
  }

  function drawTopoRouter(g, x, y, label, ip) {
    const grp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    grp.setAttribute('transform', `translate(${x}, ${y})`);

    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    halo.setAttribute('r', '28');
    halo.setAttribute('class', 'node-halo halo-router');

    const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    body.setAttribute('x', '-14'); body.setAttribute('y', '-11');
    body.setAttribute('width', '28'); body.setAttribute('height', '22');
    body.setAttribute('rx', '4');
    body.setAttribute('class', 'node-router-body');

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('y', '42');
    title.setAttribute('class', 'node-title');
    title.setAttribute('font-size', '12');
    title.textContent = label;

    grp.appendChild(halo);
    grp.appendChild(body);
    grp.appendChild(title);
    g.appendChild(grp);
  }

  function drawInteractiveTerminator(g, x, y, label, isBroken) {
    const grp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    grp.setAttribute('transform', `translate(${x}, ${y})`);
    grp.setAttribute('style', 'cursor: pointer;');
    grp.setAttribute('title', 'Click to remove or restore Terminator');

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '-6'); rect.setAttribute('y', '-18');
    rect.setAttribute('width', '12'); rect.setAttribute('height', '36');
    rect.setAttribute('rx', '3');
    rect.setAttribute('fill', isBroken ? '#475569' : '#ef4444');
    rect.setAttribute('opacity', isBroken ? '0.3' : '1');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('y', '32');
    text.setAttribute('class', 'node-desc');
    text.setAttribute('font-size', '10.5');
    text.setAttribute('fill', isBroken ? '#ef4444' : 'var(--text-muted)');
    text.textContent = isBroken ? 'MISSING!' : label;

    grp.appendChild(rect);
    grp.appendChild(text);

    grp.addEventListener('click', () => {
      isTerminatorBroken = !isTerminatorBroken;
      renderTopology();
    });

    g.appendChild(grp);
  }

  function toggleCable(cableId) {
    if (cutCables.has(cableId)) {
      cutCables.delete(cableId);
    } else {
      cutCables.add(cableId);
    }
    renderTopology();
  }

  function checkNetworkHealth() {
    if (currentTopo === 'star') {
      if (isSwitchBroken) {
        topoHealthBadge.className = 'topo-health-badge offline';
        topoHealthBadge.textContent = '● TOTAL NETWORK CRASH (SPOF)';
        topoFeedbackIcon.textContent = '✕';
        topoFeedbackText.innerHTML = `<strong style="color:#ef4444;">Central Switch Failed!</strong> Because all devices connect through the switch, NO devices can communicate. This is the classic GCSE <em>Single Point of Failure</em>!`;
      } else if (cutCables.has('cable-switch-n1')) {
        topoHealthBadge.className = 'topo-health-badge degraded';
        topoHealthBadge.textContent = '● Partial Outage (Node 1 Isolated)';
        topoFeedbackIcon.textContent = '!';
        topoFeedbackText.innerHTML = `<strong>Node 1 Disconnected:</strong> Only Node 1 lost connection. All other workstations (Nodes 2, 3, 4, Server) communicate normally at full speed!`;
      } else if (cutCables.has('cable-switch-n4')) {
        topoHealthBadge.className = 'topo-health-badge degraded';
        topoHealthBadge.textContent = '● Partial Outage (Node 4 Isolated)';
        topoFeedbackIcon.textContent = '!';
        topoFeedbackText.innerHTML = `<strong>Node 4 Disconnected:</strong> Node 4 cannot receive data, but the rest of the star network is completely unaffected.`;
      } else if (cutCables.size > 0) {
        topoHealthBadge.className = 'topo-health-badge degraded';
        topoHealthBadge.textContent = `● Isolated Devices (${cutCables.size} cables cut)`;
        topoFeedbackIcon.textContent = 'i';
        topoFeedbackText.innerHTML = `Workstations with cut cables are isolated. The remaining devices continue operating normally through the switch.`;
      } else {
        topoHealthBadge.className = 'topo-health-badge online';
        topoHealthBadge.textContent = '● 100% Operational';
        topoFeedbackIcon.textContent = '✓';
        topoFeedbackText.innerHTML = `Star network fully online. Central switch directly forwards frames to destination ports without packet collisions.`;
      }
    } else if (currentTopo === 'bus') {
      if (cutCables.has('cable-backbone')) {
        topoHealthBadge.className = 'topo-health-badge offline';
        topoHealthBadge.textContent = '● TOTAL NETWORK FAILURE';
        topoFeedbackIcon.textContent = '✕';
        topoFeedbackText.innerHTML = `<strong style="color:#ef4444;">Backbone Severed!</strong> Without a continuous cable, signals hit the break and bounce back. Colliding signals destroy all traffic across the entire bus!`;
      } else if (isTerminatorBroken) {
        topoHealthBadge.className = 'topo-health-badge offline';
        topoHealthBadge.textContent = '● SIGNAL BOUNCE / REFLECTION';
        topoFeedbackIcon.textContent = '!';
        topoFeedbackText.innerHTML = `<strong style="color:#ef4444;">Missing Terminator:</strong> Signals reach the end of the cable without being absorbed. They reflect back down the bus and collide with oncoming packets!`;
      } else if (cutCables.has('cable-drop-n1') || cutCables.has('cable-drop-n4')) {
        topoHealthBadge.className = 'topo-health-badge degraded';
        topoHealthBadge.textContent = '● Drop Cable Severed';
        topoFeedbackIcon.textContent = 'i';
        topoFeedbackText.innerHTML = `A drop cable broke. Only that single device loses access; the backbone cable continues functioning.`;
      } else {
        topoHealthBadge.className = 'topo-health-badge online';
        topoHealthBadge.textContent = '● 100% Operational';
        topoFeedbackIcon.textContent = '✓';
        topoFeedbackText.innerHTML = `Bus network online. Broadcast signals reach all nodes; terminators absorb excess energy at both ends.`;
      }
    } else if (currentTopo === 'mesh') {
      const isDirectCut = cutCables.has('cable-n1-n4');
      const isAlt1Cut = cutCables.has('cable-n1-n5');
      const isAlt2Cut = cutCables.has('cable-n4-n5');

      if (isDirectCut && (isAlt1Cut || isAlt2Cut) && cutCables.has('cable-n3-n4')) {
        topoHealthBadge.className = 'topo-health-badge offline';
        topoHealthBadge.textContent = '● Path Disconnected';
        topoFeedbackIcon.textContent = '❌';
        topoFeedbackText.innerHTML = `<strong style="color:#ef4444;">All Redundant Routes Cut:</strong> Node 4 is completely isolated because all redundant cables were severed.`;
      } else if (isDirectCut) {
        topoHealthBadge.className = 'topo-health-badge degraded';
        topoHealthBadge.textContent = '● Dynamic Rerouting Active';
        topoFeedbackIcon.textContent = '⚡';
        topoFeedbackText.innerHTML = `<span style="color:#10b981; font-weight:800;">Self-Healing Mesh:</span> Direct wire (Node 1 ➔ Node 4) is severed! The mesh network automatically reroutes data via <strong>Relay Node 5</strong> with zero downtime.`;
      } else {
        topoHealthBadge.className = 'topo-health-badge online';
        topoHealthBadge.textContent = '● 100% Operational (Redundant)';
        topoFeedbackIcon.textContent = '✓';
        topoFeedbackText.innerHTML = `Mesh network online. Multiple redundant connections ensure no single point of failure exists!`;
      }
    }
  }

  // Animated Packet Transmission Simulation across Topologies
  function sendTopoPacket() {
    if (isTopoAnimating) return;
    isTopoAnimating = true;
    const packetsG = document.getElementById('topoPacketsLayer');
    if (!packetsG) { isTopoAnimating = false; return; }
    packetsG.innerHTML = '';

    topoPingBtn.disabled = true;
    topoPingBtn.textContent = '⏳ Transmitting...';

    if (currentTopo === 'star') {
      // Node 1 (190, 110) -> Switch (410, 200) -> Node 4 (190, 290)
      const p1Cut = cutCables.has('cable-switch-n1');
      const p4Cut = cutCables.has('cable-switch-n4');

      animateLinePacket(packetsG, 190, 110, 410, 200, '#3b82f6', (progress) => {
        if (p1Cut && progress > 0.3) {
          showTopoBurst(packetsG, 190 + 66, 110 + 27, '#ef4444', 'Dropped at break');
          finishTopoAnimation('Dropped: Cable to switch is cut! Packet could not reach the switch.');
          return false;
        }
        return true;
      }, () => {
        // Reached switch!
        if (isSwitchBroken) {
          showTopoBurst(packetsG, 410, 200, '#ef4444', 'SWITCH DEAD');
          finishTopoAnimation('Dropped: Central Switch is broken! Single Point of Failure stopped the packet.');
          return;
        }

        // Forwarding to Node 4
        animateLinePacket(packetsG, 410, 200, 190, 290, '#10b981', (progress) => {
          if (p4Cut && progress > 0.3) {
            showTopoBurst(packetsG, 410 - 66, 200 + 27, '#ef4444', 'Cable to Node 4 Cut');
            finishTopoAnimation('Dropped: Outgoing cable to Node 4 is cut. Switch could not deliver packet.');
            return false;
          }
          return true;
        }, () => {
          showTopoBurst(packetsG, 190, 290, '#10b981', 'Delivered ✓');
          finishTopoAnimation('Success: Central switch forwarded packet directly to Node 4 port without broadcasting to other machines.');
        });
      });

    } else if (currentTopo === 'bus') {
      // Node 1 (210, 95) -> Tap (210, 200) -> Broadcasts left and right
      const drop1Cut = cutCables.has('cable-drop-n1');
      const backboneCut = cutCables.has('cable-backbone');

      animateLinePacket(packetsG, 210, 95, 210, 200, '#3b82f6', (prog) => {
        if (drop1Cut && prog > 0.3) {
          showTopoBurst(packetsG, 210, 130, '#ef4444', 'Drop Cut');
          finishTopoAnimation('Dropped: Drop cable from Node 1 is cut; packet cannot enter backbone.');
          return false;
        }
        return true;
      }, () => {
        // On backbone!
        if (backboneCut) {
          animateLinePacket(packetsG, 210, 200, 410, 200, '#ef4444', () => true, () => {
            showTopoBurst(packetsG, 410, 200, '#ef4444', 'COLLISION / REFLECT');
            finishTopoAnimation('Fatal Crash: Packet hit severed backbone! Signals reflect and collide, taking down the whole bus.');
          });
          return;
        }

        if (isTerminatorBroken) {
          animateLinePacket(packetsG, 210, 200, 690, 200, '#f59e0b', () => true, () => {
            showTopoBurst(packetsG, 690, 200, '#ef4444', 'SIGNAL BOUNCE');
            finishTopoAnimation('Error: Missing terminator! Signal bounced off cable end and caused a data collision.');
          });
          return;
        }

        // Normal transmission along bus to Node 4 tap (610, 200) and down to (610, 305)
        animateLinePacket(packetsG, 210, 200, 610, 200, '#10b981', () => true, () => {
          if (cutCables.has('cable-drop-n4')) {
            showTopoBurst(packetsG, 610, 240, '#ef4444', 'Drop 4 Cut');
            finishTopoAnimation('Dropped: Node 4 drop cable is severed; packet passed along bus without reaching workstation.');
          } else {
            animateLinePacket(packetsG, 610, 200, 610, 305, '#10b981', () => true, () => {
              showTopoBurst(packetsG, 610, 305, '#10b981', 'Accepted ✓');
              finishTopoAnimation('Success: Broadcast signal traveled along the bus. Node 4 accepted its packet, and terminators absorbed leftover energy.');
            });
          }
        });
      });

    } else if (currentTopo === 'mesh') {
      const directCut = cutCables.has('cable-n1-n4');
      const relay1Cut = cutCables.has('cable-n1-n5');
      const relay2Cut = cutCables.has('cable-n4-n5');

      if (!directCut) {
        // Direct route Node 1 -> Node 4
        animateLinePacket(packetsG, 200, 120, 200, 280, '#10b981', () => true, () => {
          showTopoBurst(packetsG, 200, 280, '#10b981', 'Delivered (Direct) ✓');
          finishTopoAnimation('Success (Direct Path): Packet traveled directly from Node 1 to Node 4 (1 hop, fastest).');
        });
      } else if (!relay1Cut && !relay2Cut) {
        // Self-healing detour via Relay Node 5!
        topoFeedbackText.innerHTML = `<span style="color:#10b981;">Direct cable severed! Rerouting dynamically via Relay Node 5...</span>`;
        animateLinePacket(packetsG, 200, 120, 410, 200, '#06b6d4', () => true, () => {
          showTopoBurst(packetsG, 410, 200, '#06b6d4', 'Rerouted ➔');
          animateLinePacket(packetsG, 410, 200, 200, 280, '#06b6d4', () => true, () => {
            showTopoBurst(packetsG, 200, 280, '#10b981', 'Delivered (Detour) ✓');
            finishTopoAnimation('Self-Healing Success: Direct wire was cut, but mesh routing dynamically steered packet via Relay Node 5!');
          });
        });
      } else {
        // All paths broken
        animateLinePacket(packetsG, 200, 120, 200, 180, '#ef4444', () => true, () => {
          showTopoBurst(packetsG, 200, 180, '#ef4444', 'No Path Found');
          finishTopoAnimation('Dropped: Both direct and relay paths are severed. Target is completely unreachable.');
        });
      }
    }
  }

  function animateLinePacket(g, x1, y1, x2, y2, color, stepCheck, onDone) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '8');
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '2');
    g.appendChild(circle);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.08;
      if (stepCheck && !stepCheck(progress)) {
        clearInterval(interval);
        circle.remove();
        return;
      }

      if (progress >= 1) {
        clearInterval(interval);
        circle.remove();
        if (onDone) onDone();
      } else {
        const curX = x1 + (x2 - x1) * progress;
        const curY = y1 + (y2 - y1) * progress;
        circle.setAttribute('cx', curX);
        circle.setAttribute('cy', curY);
      }
    }, 24);
  }

  function showTopoBurst(g, x, y, color, text) {
    const burst = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    burst.setAttribute('transform', `translate(${x}, ${y})`);

    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('r', '14');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', color);
    ring.setAttribute('stroke-width', '3');

    const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl.setAttribute('y', '-16');
    lbl.setAttribute('font-size', '11');
    lbl.setAttribute('font-weight', '800');
    lbl.setAttribute('fill', color);
    lbl.setAttribute('text-anchor', 'middle');
    lbl.textContent = text;

    burst.appendChild(ring);
    burst.appendChild(lbl);
    g.appendChild(burst);

    setTimeout(() => burst.remove(), 1800);
  }

  function finishTopoAnimation(feedbackText) {
    isTopoAnimating = false;
    topoPingBtn.disabled = false;
    topoPingBtn.textContent = '▶ Send Packet (1 ➔ 4)';
    if (feedbackText) {
      topoFeedbackText.innerHTML = feedbackText;
    }
  }

  topoPills.forEach(pill => {
    pill.addEventListener('click', () => {
      topoPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentTopo = pill.dataset.topo;
      cutCables.clear();
      isSwitchBroken = false;
      isTerminatorBroken = false;
      renderTopology();
    });
  });

  topoRepairBtn.addEventListener('click', () => {
    cutCables.clear();
    isSwitchBroken = false;
    isTerminatorBroken = false;
    renderTopology();
  });

  topoPingBtn.addEventListener('click', sendTopoPacket);


  // =========================================================================
  // 4. TAB 3: TCP/IP 4 LAYERS (U-SHAPED FLOW & ENVELOPE INSPECTOR)
  // =========================================================================
  const layerPresetButtons = document.querySelectorAll('#layerPresetButtons .layer-pill');
  const layerStepBackBtn = document.getElementById('layerStepBackBtn');
  const layerStepFwdBtn = document.getElementById('layerStepFwdBtn');
  const layerAutoPlayBtn = document.getElementById('layerAutoPlayBtn');
  const layerPlayIcon = document.getElementById('layerPlayIcon');
  const layerPauseIcon = document.getElementById('layerPauseIcon');
  const layerResetBtn = document.getElementById('layerResetBtn');
  const layerUserPayloadInput = document.getElementById('layerUserPayloadInput');
  const layerPhaseBadge = document.getElementById('layerPhaseBadge');

  // U-Stack Diagram Elements
  const uSenderDevice = document.getElementById('uSenderDevice');
  const uSenderScreenText = document.getElementById('uSenderScreenText');
  const uSenderWindowTitle = document.getElementById('uSenderWindowTitle');
  const uReceiverDevice = document.getElementById('uReceiverDevice');
  const uReceiverScreenText = document.getElementById('uReceiverScreenText');
  const uReceiverWindowTitle = document.getElementById('uReceiverWindowTitle');
  const uReceiverIndicator = document.getElementById('uReceiverIndicator');
  const uReceiverIp = document.getElementById('uReceiverIp');
  const uSenderAppSub = document.getElementById('uSenderAppSub');
  const uSenderTransSub = document.getElementById('uSenderTransSub');
  const uSenderNetSub = document.getElementById('uSenderNetSub');
  const uReceiverAppSub = document.getElementById('uReceiverAppSub');
  const uReceiverTransSub = document.getElementById('uReceiverTransSub');
  const uLayerBoxes = document.querySelectorAll('.u-layer-box');
  const uWireHighway = document.getElementById('uWireHighway');
  const wireMovingPacket = document.getElementById('wireMovingPacket');
  const wirePacketLabel = document.getElementById('wirePacketLabel');

  // Center Conduit Elements
  const conduitLevel4 = document.getElementById('conduitLevel4');
  const conduitLevel3 = document.getElementById('conduitLevel3');
  const conduitLevel2 = document.getElementById('conduitLevel2');
  const conduitLevel1 = document.getElementById('conduitLevel1');
  const conduitContent4 = document.getElementById('conduitContent4');
  const conduitContent3 = document.getElementById('conduitContent3');
  const conduitContent2 = document.getElementById('conduitContent2');
  const conduitContent1 = document.getElementById('conduitContent1');
  const conduitStatusPill = document.getElementById('conduitStatusPill');

  // Directional Arrows
  const uArrowDown0 = document.getElementById('uArrowDown0');
  const uArrowDown1 = document.getElementById('uArrowDown1');
  const uArrowDown2 = document.getElementById('uArrowDown2');
  const uArrowUp4 = document.getElementById('uArrowUp4');
  const uArrowUp5 = document.getElementById('uArrowUp5');
  const uArrowUp6 = document.getElementById('uArrowUp6');

  // Story & Inspector Elements
  const storyStepIndicator = document.getElementById('storyStepIndicator');
  const storyLayerTag = document.getElementById('storyLayerTag');
  const storyLayerTitle = document.getElementById('storyLayerTitle');
  const storyTeenSub = document.getElementById('storyTeenSub');
  const storyLayerDesc = document.getElementById('storyLayerDesc');
  const envelopeStatePill = document.getElementById('envelopeStatePill');
  const envelopeVisualStack = document.getElementById('envelopeVisualStack');

  let currentLayerStep = 0; // 0 to 7
  let layerPreset = 'web';
  let isLayerPlaying = false;
  let layerTimer = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Splits a payload string into 2 or 3 distinct numbered packets for GCSE pedagogy
  function splitPayloadIntoPackets(payload) {
    const text = (payload || 'GET /index.html').trim();
    if (text.length <= 6) {
      const mid = Math.ceil(text.length / 2);
      return [
        { seq: 1, total: 2, data: text.slice(0, mid) },
        { seq: 2, total: 2, data: text.slice(mid) }
      ];
    }
    const partLen = Math.ceil(text.length / 3);
    return [
      { seq: 1, total: 3, data: text.slice(0, partLen) },
      { seq: 2, total: 3, data: text.slice(partLen, partLen * 2) },
      { seq: 3, total: 3, data: text.slice(partLen * 2) }
    ];
  }

  const layerPresets = {
    web: {
      payload: 'GET /index.html',
      appProtoName: 'HTTP (Hypertext Transfer Protocol)',
      appShort: 'HTTP (Port 80)',
      port: '80 (Web Server)',
      ip: '151.101.0.81 (BBC Web Server)',
      mac: '4A:9C:2D:11:8F:AA (Gateway Router NIC)'
    },
    https: {
      payload: 'GET /secure-login.html',
      appProtoName: 'HTTPS (HTTP over TLS/SSL)',
      appShort: 'HTTPS (Port 443)',
      port: '443 (HTTPS Secure)',
      ip: '104.244.42.1 (Secure Server)',
      mac: '22:B4:91:FA:CD:01 (Switch NIC)'
    },
    email: {
      payload: 'HELO mail.server / MAIL FROM:<user@school.uk>',
      appProtoName: 'SMTP (Simple Mail Transfer Protocol)',
      appShort: 'SMTP (Port 25)',
      port: '25 (Mail Server)',
      ip: '142.250.187.26 (Google Mail Host)',
      mac: '88:E3:AB:12:99:FF (Mail Gateway NIC)'
    },
    custom: {
      payload: 'HELLO SERVER!',
      appProtoName: 'Custom Protocol',
      appShort: 'Custom App',
      port: '8080 (Custom Service)',
      ip: '203.0.113.195 (Target Host)',
      mac: 'FE:ED:00:11:22:33 (Ethernet NIC)'
    }
  };

  const layerStepsConfig = [
    {
      step: 0,
      side: 'sender',
      layerNum: 4,
      layerName: 'Application Layer',
      subtitle: '"Which software application sent this?"',
      desc: 'You trigger an action in an application (e.g. loading a webpage in your browser). The Application Layer prepares and formats the raw message ready for transmission.',
      statePill: 'Raw Payload Ready',
      tags: [
        { type: 'payload', title: 'Payload Data', value: '{{payload}}', status: 'attached' }
      ]
    },
    {
      step: 1,
      side: 'sender',
      layerNum: 3,
      layerName: 'Transport Layer',
      subtitle: '"Splits message into packets & assigns port numbers"',
      desc: 'TCP divides the message into numbered packets so they can be reassembled if they arrive out of sequence. It stamps on the Destination Port ({{port}}) and sets up error checking with checksums.',
      statePill: '+ TCP Header Attached',
      tags: [
        { type: 'transport', title: 'TCP Header', value: 'Dst Port: {{port}} | Seq #1 of 3 | Checksum Valid', status: 'attached' },
        { type: 'payload', title: 'Payload Chunk', value: '{{payload}}', status: 'attached' }
      ]
    },
    {
      step: 2,
      side: 'sender',
      layerNum: 2,
      layerName: 'Internet Layer',
      subtitle: '"Adds Source & Destination IP addresses"',
      desc: 'IP wraps the TCP packet with logical network addresses. It adds Source IP (192.168.1.50) and Destination IP ({{ip}}). Routers across the internet will read these addresses to steer the packet.',
      statePill: '+ IP Header Attached',
      tags: [
        { type: 'internet', title: 'IP Header', value: 'Src: 192.168.1.50 ➔ Dst: {{ip}}', status: 'attached' },
        { type: 'transport', title: 'TCP Header', value: 'Dst Port: {{port}} | Seq #1 of 3', status: 'attached' },
        { type: 'payload', title: 'Payload Chunk', value: '{{payload}}', status: 'attached' }
      ]
    },
    {
      step: 3,
      side: 'sender',
      layerNum: 1,
      layerName: 'Link Layer',
      subtitle: '"Adds MAC addresses & converts bits to electrical/radio signals"',
      desc: 'The Network Interface Card (NIC) adds local physical MAC addresses, creating an Ethernet frame. It encodes the 1s and 0s into physical voltages, light flashes, or Wi-Fi radio frequencies onto the cable.',
      statePill: '+ Ethernet Frame Sealed',
      tags: [
        { type: 'link', title: 'Ethernet Frame', value: 'Dst MAC: {{mac}} | Preamble & CRC', status: 'attached' },
        { type: 'internet', title: 'IP Header', value: 'Src: 192.168.1.50 ➔ Dst: {{ip}}', status: 'attached' },
        { type: 'transport', title: 'TCP Header', value: 'Dst Port: {{port}} | Seq #1 of 3', status: 'attached' },
        { type: 'payload', title: 'Payload Chunk', value: '{{payload}}', status: 'attached' }
      ]
    },
    {
      step: 4,
      side: 'receiver',
      layerNum: 1,
      layerName: 'Link Layer (Received across Wire)',
      subtitle: '"Catches physical signals, checks MAC frame, strips Link header"',
      desc: 'The receiver\'s NIC receives the electrical or optical pulses from the wire. It checks that the MAC address matches, verifies the frame checksum, and strips off the Link header before handing data upwards.',
      statePill: 'Transit Finished • Frame Stripped',
      tags: [
        { type: 'link', title: 'Ethernet Frame', value: 'Dst MAC: {{mac}} (Verified)', status: 'stripped' },
        { type: 'internet', title: 'IP Header', value: 'Src: 192.168.1.50 ➔ Dst: {{ip}}', status: 'attached' },
        { type: 'transport', title: 'TCP Header', value: 'Dst Port: {{port}} | Seq #1 of 3', status: 'attached' },
        { type: 'payload', title: 'Payload Chunk', value: '{{payload}}', status: 'attached' }
      ]
    },
    {
      step: 5,
      side: 'receiver',
      layerNum: 2,
      layerName: 'Internet Layer (IP Verification)',
      subtitle: '"Confirms destination IP belongs to this host & strips IP header"',
      desc: 'The operating system inspects the IP header. Since the Destination IP matches this server ({{ip}}), it accepts the packet. The IP header has finished its job and is stripped off.',
      statePill: 'IP Header Stripped',
      tags: [
        { type: 'internet', title: 'IP Header', value: 'Dst IP: {{ip}} (Matched)', status: 'stripped' },
        { type: 'transport', title: 'TCP Header', value: 'Dst Port: {{port}} | Seq #1 of 3', status: 'attached' },
        { type: 'payload', title: 'Payload Chunk', value: '{{payload}}', status: 'attached' }
      ]
    },
    {
      step: 6,
      side: 'receiver',
      layerNum: 3,
      layerName: 'Transport Layer (Reassembly & Port Dispatch)',
      subtitle: '"Reassembles numbered chunks & passes to matching port"',
      desc: 'TCP checks packet integrity with checksums and reassembles numbered packets into their original sequence. It strips the TCP header and delivers the pure data to the software listening on Port {{port}}.',
      statePill: 'TCP Header Stripped',
      tags: [
        { type: 'transport', title: 'TCP Header', value: 'Port {{port}} (Delivered & Checked)', status: 'stripped' },
        { type: 'payload', title: 'Payload Chunk', value: '{{payload}}', status: 'attached' }
      ]
    },
    {
      step: 7,
      side: 'receiver',
      layerNum: 4,
      layerName: 'Application Layer (Final Delivery)',
      subtitle: '"Server software receives pure payload and displays result!"',
      desc: 'The destination application (e.g. Web or Mail server) receives the intact payload and processes the request: "{{payload}}". The end-to-end communication cycle is complete!',
      statePill: 'Payload Delivered ✓',
      tags: [
        { type: 'payload', title: 'Received Payload', value: '{{payload}}', status: 'attached' }
      ]
    }
  ];

  function interpolate(str, data) {
    return str
      .replace(/{{payload}}/g, data.payload)
      .replace(/{{port}}/g, data.port)
      .replace(/{{ip}}/g, data.ip)
      .replace(/{{mac}}/g, data.mac);
  }

  function updateLayerVisuals() {
    const presetData = layerPresets[layerPreset] || layerPresets.web;
    const currentPayload = (layerUserPayloadInput ? layerUserPayloadInput.value.trim() : '') || presetData.payload;

    const dataContext = {
      payload: currentPayload,
      port: presetData.port,
      ip: presetData.ip,
      mac: presetData.mac
    };

    const stepConf = layerStepsConfig[currentLayerStep];
    const chunks = splitPayloadIntoPackets(currentPayload);

    // 1. Update Subtitles & Host Info in U-Diagram
    if (uSenderAppSub) uSenderAppSub.textContent = presetData.appShort;
    if (uSenderTransSub) uSenderTransSub.textContent = `TCP • Port ${presetData.port.split(' ')[0]} & Seq`;
    if (uSenderNetSub) uSenderNetSub.textContent = `IP • Dest: ${presetData.ip.split(' ')[0]}`;
    if (uReceiverAppSub) uReceiverAppSub.textContent = `${presetData.appShort} Server Process`;
    if (uReceiverTransSub) uReceiverTransSub.textContent = `TCP • Port ${presetData.port.split(' ')[0]} Reassembly`;
    if (uReceiverIp) uReceiverIp.textContent = `IP: ${presetData.ip.split(' ')[0]}`;

    // Update Workstation Window Titles
    if (uSenderWindowTitle) {
      if (layerPreset === 'email') uSenderWindowTitle.textContent = 'Email Client';
      else if (layerPreset === 'custom') uSenderWindowTitle.textContent = 'Custom App Client';
      else uSenderWindowTitle.textContent = 'Browser Client';
    }
    if (uReceiverWindowTitle) {
      if (layerPreset === 'email') uReceiverWindowTitle.textContent = 'Mail Server (Port 25)';
      else if (layerPreset === 'https') uReceiverWindowTitle.textContent = 'HTTPS Server (Port 443)';
      else if (layerPreset === 'custom') uReceiverWindowTitle.textContent = 'Custom Server (Port 8080)';
      else uReceiverWindowTitle.textContent = 'Web Server (Port 80)';
    }

    // 2. Highlight Active Device
    if (uSenderDevice) {
      uSenderDevice.classList.toggle('active', stepConf.side === 'sender');
    }
    if (uReceiverDevice) {
      uReceiverDevice.classList.toggle('active', stepConf.side === 'receiver');
    }

    // 3. Highlight Layer Boxes in U-Diagram
    uLayerBoxes.forEach(box => {
      const stepVal = parseInt(box.dataset.step, 10);
      box.classList.toggle('active', stepVal === currentLayerStep);
    });

    // 4. Update Directional Arrows
    if (uArrowDown0) uArrowDown0.classList.toggle('active', currentLayerStep === 1);
    if (uArrowDown1) uArrowDown1.classList.toggle('active', currentLayerStep === 2);
    if (uArrowDown2) uArrowDown2.classList.toggle('active', currentLayerStep === 3);

    if (uArrowUp4) uArrowUp4.classList.toggle('active', currentLayerStep === 5);
    if (uArrowUp5) uArrowUp5.classList.toggle('active', currentLayerStep === 6);
    if (uArrowUp6) uArrowUp6.classList.toggle('active', currentLayerStep === 7);

    // 5. Update Center Conduit Levels & Active Transformation Zone
    if (conduitLevel4) conduitLevel4.classList.toggle('active', stepConf.layerNum === 4);
    if (conduitLevel3) conduitLevel3.classList.toggle('active', stepConf.layerNum === 3);
    if (conduitLevel2) conduitLevel2.classList.toggle('active', stepConf.layerNum === 2);
    if (conduitLevel1) conduitLevel1.classList.toggle('active', stepConf.layerNum === 1);

    if (conduitStatusPill) {
      if (currentLayerStep <= 3) conduitStatusPill.textContent = 'Encapsulation ↓';
      else if (currentLayerStep === 4) conduitStatusPill.textContent = 'Wire Transit ➔';
      else conduitStatusPill.textContent = 'Decapsulation ↑';
    }

    // Dynamic Conduit Contents
    // Level 4 (Application)
    if (conduitContent4) {
      if (currentLayerStep === 0) {
        conduitContent4.innerHTML = `
          <div class="conduit-action-header">
            <strong>Application Formatting:</strong> Raw Request Created
          </div>
          <div class="split-packet-card" style="border-color: #10b981;">
            <div class="split-packet-header" style="color: #059669;">
              <span>App: ${escapeHtml(presetData.appShort)}</span>
              <span>Target Port: ${escapeHtml(presetData.port.split(' ')[0])}</span>
            </div>
            <div class="split-packet-data">"${escapeHtml(currentPayload)}"</div>
          </div>
          <div class="conduit-action-sub">Software application creates the pure payload text ready for the network stack.</div>
        `;
      } else if (currentLayerStep === 7) {
        conduitContent4.innerHTML = `
          <div class="conduit-action-header">
            <strong>Application Delivery:</strong> Request Processed (200 OK)
          </div>
          <div class="split-packet-card" style="border-color: #10b981;">
            <div class="split-packet-header" style="color: #059669;">
              <span>${escapeHtml(presetData.appShort)} Server</span>
              <span>Status: 200 OK ✓</span>
            </div>
            <div class="split-packet-data" style="color: #059669; font-weight: 800;">"${escapeHtml(currentPayload)}"</div>
          </div>
          <div class="conduit-action-sub">Server software receives pure payload and serves the response. Communication complete!</div>
        `;
      } else {
        conduitContent4.innerHTML = `
          <div class="conduit-action-sub">
            <strong>Application Layer Peer:</strong> ${escapeHtml(presetData.appProtoName)} prepares requests and delivers server responses.
          </div>
        `;
      }
    }

    // Level 3 (Transport - Slicing / Reassembly)
    if (conduitContent3) {
      if (currentLayerStep === 1) {
        const packetCardsHtml = chunks.map(c => `
          <div class="split-packet-card">
            <div class="split-packet-header">
              <span>Seq #${c.seq} of ${c.total}</span>
              <span>Port ${escapeHtml(presetData.port.split(' ')[0])}</span>
            </div>
            <div class="split-packet-data">"${escapeHtml(c.data)}"</div>
          </div>
        `).join('');

        conduitContent3.innerHTML = `
          <div class="conduit-action-header">
            <strong>TCP Segmentation: Message sliced into ${chunks.length} numbered packets!</strong>
          </div>
          <div class="split-packets-grid">
            ${packetCardsHtml}
          </div>
          <div class="conduit-action-sub">
            TCP adds sequence numbers (#1..#${chunks.length}) and stamps Destination Port <strong>${escapeHtml(presetData.port.split(' ')[0])}</strong> on every packet.
          </div>
        `;
      } else if (currentLayerStep === 6) {
        const reassembleChainHtml = chunks.map(c => `
          <span class="reassemble-tag">Seq #${c.seq}</span>
          <span>"${escapeHtml(c.data)}"</span>
        `).join(' <span style="color:#06b6d4; font-weight:800;">+</span> ');

        conduitContent3.innerHTML = `
          <div class="conduit-action-header">
            <strong>TCP Reassembly: Ordering Packets &amp; Delivering to Port ${escapeHtml(presetData.port.split(' ')[0])}</strong>
          </div>
          <div class="reassemble-chain-card">
            ${reassembleChainHtml}
            <span style="color: #059669; font-weight: 800; margin-left: 6px;">= "${escapeHtml(currentPayload)}" ✓</span>
          </div>
          <div class="conduit-action-sub">
            TCP verifies checksums, arranges chunks back into sequential order (#1, #2, #3), and passes pure data to Port <strong>${escapeHtml(presetData.port.split(' ')[0])}</strong>.
          </div>
        `;
      } else {
        conduitContent3.innerHTML = `
          <div class="conduit-action-sub">
            <strong>Transport Layer Peer:</strong> TCP provides reliable end-to-end delivery, port dispatching, and packet sequencing.
          </div>
        `;
      }
    }

    // Level 2 (Internet - IP Addressing)
    if (conduitContent2) {
      if (currentLayerStep === 2) {
        conduitContent2.innerHTML = `
          <div class="conduit-action-header">
            <strong>IP Encapsulation: Stamping Global Logical Addresses</strong>
          </div>
          <div class="split-packet-card" style="border-color: #3b82f6;">
            <div class="split-packet-header" style="color: #2563eb;">
              <span>Source IP: 192.168.1.50</span>
              <span>Dest IP: ${escapeHtml(presetData.ip.split(' ')[0])}</span>
            </div>
            <div class="split-packet-data" style="font-size: 10px; color: var(--text-muted);">
              [IP Header] wraps [TCP Segment: Port ${escapeHtml(presetData.port.split(' ')[0])} | Seq #1 of ${chunks.length}]
            </div>
          </div>
          <div class="conduit-action-sub">
            Routers across the internet inspect Destination IP (<strong>${escapeHtml(presetData.ip.split(' ')[0])}</strong>) to steer each packet hop-by-hop.
          </div>
        `;
      } else if (currentLayerStep === 5) {
        conduitContent2.innerHTML = `
          <div class="conduit-action-header">
            <strong>Internet Decapsulation: Destination IP Verified</strong>
          </div>
          <div class="split-packet-card" style="border-color: #3b82f6;">
            <div class="split-packet-header" style="color: #059669;">
              <span>Dest IP: ${escapeHtml(presetData.ip.split(' ')[0])} (Matched ✓)</span>
              <span>Action: Strip IP Header</span>
            </div>
            <div class="split-packet-data" style="font-size: 10px;">
              IP routing complete. TCP packet unwrapped and passed up to Layer 3.
            </div>
          </div>
          <div class="conduit-action-sub">
            Host confirms the packet was intended for this machine. IP header is peeled off!
          </div>
        `;
      } else {
        conduitContent2.innerHTML = `
          <div class="conduit-action-sub">
            <strong>Internet Layer Peer:</strong> IP protocol adds logical network addresses so intermediate routers can steer packets.
          </div>
        `;
      }
    }

    // Level 1 (Link - MAC & Framing)
    if (conduitContent1) {
      if (currentLayerStep === 3) {
        conduitContent1.innerHTML = `
          <div class="conduit-action-header">
            <strong>Link Framing: MAC Address &amp; Physical Signalling</strong>
          </div>
          <div class="split-packet-card" style="border-color: #f59e0b;">
            <div class="split-packet-header" style="color: #d97706;">
              <span>Local Next-Hop MAC</span>
              <span>${escapeHtml(presetData.mac.split(' ')[0])}</span>
            </div>
            <div class="split-packet-data" style="font-family: var(--font-mono); font-size: 10px; color: #d97706;">
              10110010 01001101 ➔ [Copper Voltages / Fibre Laser Pulses]
            </div>
          </div>
          <div class="conduit-action-sub">
            Network Interface Card (NIC) converts binary bits into physical signals onto the network cable.
          </div>
        `;
      } else if (currentLayerStep === 4) {
        conduitContent1.innerHTML = `
          <div class="conduit-action-header">
            <strong>Link Ingestion: Frame Received Across Wire</strong>
          </div>
          <div class="split-packet-card" style="border-color: #f59e0b;">
            <div class="split-packet-header" style="color: #059669;">
              <span>MAC Verified ✓</span>
              <span>Frame Check Sequence (CRC) Valid</span>
            </div>
            <div class="split-packet-data" style="font-size: 10px;">
              Physical signals converted to digital bits. Ethernet header stripped off.
            </div>
          </div>
          <div class="conduit-action-sub">
            Receiving NIC captures electrical/optical signals and strips the link-layer frame.
          </div>
        `;
      } else {
        conduitContent1.innerHTML = `
          <div class="conduit-action-sub">
            <strong>Link Layer Peer:</strong> Hardware NICs handle physical transmission, MAC addresses, and error-checking checksums.
          </div>
        `;
      }
    }

    // 6. Update Bottom Wire Highway & Packet Animation
    if (uWireHighway) {
      uWireHighway.classList.toggle('active-wire', currentLayerStep === 4);
    }
    if (wireMovingPacket) {
      if (currentLayerStep < 3) {
        wireMovingPacket.style.left = '4%';
        wireMovingPacket.style.opacity = '0.4';
      } else if (currentLayerStep === 3) {
        wireMovingPacket.style.left = '12%';
        wireMovingPacket.style.opacity = '1';
      } else if (currentLayerStep === 4) {
        wireMovingPacket.style.left = '52%';
        wireMovingPacket.style.opacity = '1';
      } else {
        wireMovingPacket.style.left = '86%';
        wireMovingPacket.style.opacity = '0.4';
      }
    }
    if (wirePacketLabel) {
      wirePacketLabel.textContent = `Ethernet Frame [${presetData.mac.split(' ')[0]}]`;
    }

    // 7. Update Workstation Screens (Sender & Receiver)
    if (uSenderScreenText) {
      uSenderScreenText.textContent = currentPayload;
    }

    if (uReceiverScreenText) {
      if (currentLayerStep === 7) {
        uReceiverScreenText.textContent = '200 OK • ' + currentPayload;
        uReceiverScreenText.className = 'screen-text text-delivered';
        if (uReceiverIndicator) uReceiverIndicator.className = 'screen-indicator active';
      } else if (currentLayerStep >= 4) {
        uReceiverScreenText.textContent = 'Processing frame...';
        uReceiverScreenText.className = 'screen-text text-receiving';
        if (uReceiverIndicator) uReceiverIndicator.className = 'screen-indicator receiving';
      } else {
        uReceiverScreenText.textContent = 'Waiting for packets...';
        uReceiverScreenText.className = 'screen-text text-idle';
        if (uReceiverIndicator) uReceiverIndicator.className = 'screen-indicator';
      }
    }

    // 8. Update Stepper Status Bar & Badges
    if (storyStepIndicator) storyStepIndicator.textContent = `Step ${currentLayerStep + 1} of 8`;
    if (storyLayerTag) storyLayerTag.textContent = `Layer ${stepConf.layerNum} • ${stepConf.layerName.split(' ')[0]}`;
    if (layerPhaseBadge) {
      const sideLabel = stepConf.side === 'sender' ? 'Sender (Encapsulation)' : 'Receiver (Decapsulation)';
      layerPhaseBadge.textContent = sideLabel;
    }

    // 9. Update Story Card Content
    if (storyLayerTitle) storyLayerTitle.textContent = stepConf.layerName;
    if (storyTeenSub) storyTeenSub.textContent = interpolate(stepConf.subtitle, dataContext);
    if (storyLayerDesc) storyLayerDesc.textContent = interpolate(stepConf.desc, dataContext);

    // 10. Update Envelope State Pill & Stack
    if (envelopeStatePill) envelopeStatePill.textContent = stepConf.statePill;

    if (envelopeVisualStack) {
      let stackHtml = '';
      stepConf.tags.forEach(tag => {
        const isStripped = tag.status === 'stripped';
        const tagClass = `tag-${tag.type}`;
        const strippedClass = isStripped ? 'tag-stripped' : '';
        const badgeClass = isStripped ? 'badge-peeled' : 'badge-attached';
        const badgeText = isStripped ? 'STRIPPED ✓' : 'ATTACHED';
        const valText = escapeHtml(interpolate(tag.value, dataContext));

        stackHtml += `
          <div class="env-tag-card ${tagClass} ${strippedClass}">
            <div style="display: flex; gap: 8px; align-items: baseline;">
              <strong>[${tag.title}]</strong>
              <span>${valText}</span>
            </div>
            <span class="env-status-badge ${badgeClass}">${badgeText}</span>
          </div>
        `;
      });
      envelopeVisualStack.innerHTML = stackHtml;
    }
  }

  // Presets selector
  layerPresetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      layerPresetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      layerPreset = btn.dataset.preset;

      if (layerPreset !== 'custom') {
        layerUserPayloadInput.value = layerPresets[layerPreset].payload;
      }

      currentLayerStep = 0;
      if (isLayerPlaying) stopLayerAutoPlay();
      updateLayerVisuals();
    });
  });

  // Step buttons
  layerStepFwdBtn.addEventListener('click', () => {
    if (isLayerPlaying) stopLayerAutoPlay();
    if (currentLayerStep < 7) {
      currentLayerStep++;
    } else {
      currentLayerStep = 0;
    }
    updateLayerVisuals();
  });

  layerStepBackBtn.addEventListener('click', () => {
    if (isLayerPlaying) stopLayerAutoPlay();
    if (currentLayerStep > 0) {
      currentLayerStep--;
    } else {
      currentLayerStep = 7;
    }
    updateLayerVisuals();
  });

  layerResetBtn.addEventListener('click', () => {
    if (isLayerPlaying) stopLayerAutoPlay();
    currentLayerStep = 0;
    updateLayerVisuals();
  });

  function stopLayerAutoPlay() {
    isLayerPlaying = false;
    clearInterval(layerTimer);
    layerTimer = null;
    if (layerPlayIcon) layerPlayIcon.style.display = 'inline';
    if (layerPauseIcon) layerPauseIcon.style.display = 'none';
  }

  layerAutoPlayBtn.addEventListener('click', () => {
    if (isLayerPlaying) {
      stopLayerAutoPlay();
    } else {
      isLayerPlaying = true;
      if (layerPlayIcon) layerPlayIcon.style.display = 'none';
      if (layerPauseIcon) layerPauseIcon.style.display = 'inline';

      if (currentLayerStep >= 7) currentLayerStep = 0;
      updateLayerVisuals();

      layerTimer = setInterval(() => {
        if (currentLayerStep < 7) {
          currentLayerStep++;
          updateLayerVisuals();
        } else {
          stopLayerAutoPlay();
        }
      }, 1600);
    }
  });

  layerUserPayloadInput.addEventListener('input', () => {
    updateLayerVisuals();
  });

  // Layer Box direct click interaction
  uLayerBoxes.forEach(box => {
    box.addEventListener('click', () => {
      if (isLayerPlaying) stopLayerAutoPlay();
      currentLayerStep = parseInt(box.dataset.step, 10);
      updateLayerVisuals();
    });
  });

  // Initial renders
  renderTopology();
  updateLayerVisuals();

  // =========================================================================
  // 5. ENCRYPTION & KEY EXCHANGE (SIMON SINGH PAINT POT ANALOGY)
  // =========================================================================
  const cryptoPalettePresetBtns = document.querySelectorAll('#cryptoPalettePresets .layer-pill');
  const cryptoMathToggleBtn = document.getElementById('cryptoMathToggleBtn');
  const cryptoMathPanel = document.getElementById('cryptoMathPanel');

  const cryptoStepResetBtn = document.getElementById('cryptoStepResetBtn');
  const cryptoStepBackBtn = document.getElementById('cryptoStepBackBtn');
  const cryptoStepFwdBtn = document.getElementById('cryptoStepFwdBtn');
  const cryptoAutoPlayBtn = document.getElementById('cryptoAutoPlayBtn');
  const cryptoStepPills = document.querySelectorAll('.crypto-step-pill');

  const cryptoPhaseBadge = document.getElementById('cryptoPhaseBadge');
  const cryptoStoryHeadline = document.getElementById('cryptoStoryHeadline');
  const cryptoStoryDesc = document.getElementById('cryptoStoryDesc');
  const statOneWayStatus = document.getElementById('statOneWayStatus');
  const statEveKnowledge = document.getElementById('statEveKnowledge');
  const statKeyStatus = document.getElementById('statKeyStatus');

  // Workspaces
  const aliceBucketWorkspace = document.getElementById('aliceBucketWorkspace');
  const internetHighwayArea = document.getElementById('internetHighwayArea');
  const bobBucketWorkspace = document.getElementById('bobBucketWorkspace');

  // Eve Radar Elements
  const eveSlotPublic = document.getElementById('eveSlotPublic');
  const eveSlotPublicTxt = document.getElementById('eveSlotPublicTxt');
  const eveSlotAliceMix = document.getElementById('eveSlotAliceMix');
  const eveSlotAliceMixTxt = document.getElementById('eveSlotAliceMixTxt');
  const eveSlotBobMix = document.getElementById('eveSlotBobMix');
  const eveSlotBobMixTxt = document.getElementById('eveSlotBobMixTxt');
  const eveSlotSecret = document.getElementById('eveSlotSecret');
  const eveSlotSecretTxt = document.getElementById('eveSlotSecretTxt');
  const eveCrackBtn = document.getElementById('eveCrackBtn');
  const eveCrackResult = document.getElementById('eveCrackResult');

  // Math Sandbox Inputs
  const mathPInput = document.getElementById('mathPInput');
  const mathGInput = document.getElementById('mathGInput');
  const mathAliceAInput = document.getElementById('mathAliceAInput');
  const mathBobBInput = document.getElementById('mathBobBInput');
  const mathEquationsDisplay = document.getElementById('mathEquationsDisplay');

  // State
  let cryptoCurrentStep = 1; // 1 to 6
  let isCryptoPlaying = false;
  let cryptoPlayTimer = null;
  let cryptoMathOpen = true;

  let publicBaseColor = '#FACC15'; // Sunshine Yellow
  let aliceSecretColor = '#EF4444'; // Coral Red
  let bobSecretColor = '#3B82F6';   // Ocean Blue
  let whatsAppMessageText = 'Meet at the cafe at 4pm!';

  // Diffie-Hellman Parameters for Visual Translation
  const dhParams = {
    p: 23,
    g: 5,
    a: 6,
    b: 15
  };

  // Color Helper Functions (Subtractive Pigment Synthesis)
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  }

  function mixPigments(colorA, colorB) {
    const rgbA = hexToRgb(colorA);
    const rgbB = hexToRgb(colorB);
    const cA = 1 - rgbA.r / 255, mA = 1 - rgbA.g / 255, yA = 1 - rgbA.b / 255;
    const cB = 1 - rgbB.r / 255, mB = 1 - rgbB.g / 255, yB = 1 - rgbB.b / 255;
    const cMix = Math.min(1, (cA + cB) * 0.72);
    const mMix = Math.min(1, (mA + mB) * 0.72);
    const yMix = Math.min(1, (yA + yB) * 0.72);
    return rgbToHex((1 - cMix) * 255, (1 - mMix) * 255, (1 - yMix) * 255);
  }

  function mixThreePigments(col1, col2, col3) {
    const r1 = hexToRgb(col1), r2 = hexToRgb(col2), r3 = hexToRgb(col3);
    const c1 = 1 - r1.r / 255, m1 = 1 - r1.g / 255, y1 = 1 - r1.b / 255;
    const c2 = 1 - r2.r / 255, m2 = 1 - r2.g / 255, y2 = 1 - r2.b / 255;
    const c3 = 1 - r3.r / 255, m3 = 1 - r3.g / 255, y3 = 1 - r3.b / 255;
    const cMix = Math.min(1, (c1 + c2 + c3) * 0.52);
    const mMix = Math.min(1, (m1 + m2 + m3) * 0.52);
    const yMix = Math.min(1, (y1 + y2 + y3) * 0.52);
    return rgbToHex((1 - cMix) * 255, (1 - mMix) * 255, (1 - yMix) * 255);
  }

  function getColorFriendlyName(hex) {
    const rgb = hexToRgb(hex);
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum < 0.15) return 'Dark Mocha';
    if (lum < 0.35 && h < 60) return 'Deep Olive Brown';
    if (h >= 345 || h < 15) return 'Coral Red';
    if (h >= 15 && h < 45) return 'Vibrant Orange';
    if (h >= 45 && h < 70) return 'Sunshine Yellow';
    if (h >= 70 && h < 165) return 'Emerald Green';
    if (h >= 165 && h < 200) return 'Cyan Blue';
    if (h >= 200 && h < 260) return 'Ocean Blue';
    if (h >= 260 && h < 315) return 'Purple';
    return 'Magenta';
  }

  // Cipher Simulation for WhatsApp
  function encryptText(text, keyHex) {
    const bytes = [];
    const keyBytes = hexToRgb(keyHex);
    const k = (keyBytes.r ^ keyBytes.g ^ keyBytes.b) || 42;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i) ^ ((k + i * 7) & 0xFF);
      bytes.push('0x' + code.toString(16).padStart(2, '0').toUpperCase());
    }
    return bytes.join(' ');
  }

  // Diffie-Hellman BigInt Modular Exponentiation
  function modPow(base, exp, mod) {
    let b = BigInt(base);
    let e = BigInt(exp);
    const m = BigInt(mod);
    let res = 1n;
    b = b % m;
    while (e > 0n) {
      if (e % 2n === 1n) res = (res * b) % m;
      e = e / 2n;
      b = (b * b) % m;
    }
    return Number(res);
  }

  // Helper to construct a 3D paint bucket card with optional math badge & picker
  function renderBucketCard({ title, colorHex, badgeText, badgeClass, mathLabel, mathNumber, showPicker, pickerId, compact }) {
    const colorName = getColorFriendlyName(colorHex);
    return `
      <div class="bucket-card ${compact ? 'card-compact' : ''}">
        <span class="bucket-tag-badge ${badgeClass || 'badge-public'}">${badgeText}</span>
        <div class="paint-bucket-3d ${badgeClass === 'badge-key' ? 'glowing-key' : ''} ${compact ? 'bucket-compact' : ''}">
          <div class="bucket-rim-3d"></div>
          <div class="bucket-liquid-fill" style="background: ${colorHex};"></div>
        </div>
        <strong class="bucket-title-text">${title}</strong>
        <span class="bucket-color-tag">${colorName}</span>
        ${mathNumber ? `
          <div class="pot-math-badge ${badgeClass === 'badge-key' ? 'math-key-matched' : ''}">
            <span class="math-sub">${mathLabel || 'DH'}:</span>
            <strong class="math-val">${mathNumber}</strong>
          </div>
        ` : ''}
        ${showPicker ? `
          <div class="bucket-picker-pill">
            <input type="color" id="${pickerId}" value="${colorHex}" title="Select custom color">
            <span style="font-size: 10.5px; font-weight: 700; color: var(--text-secondary);">Change</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderPlaceholderCard({ title, subtitle }) {
    return `
      <div class="bucket-card bucket-placeholder">
        <div class="bucket-placeholder-box">
          <span class="placeholder-icon">↓</span>
          <span class="placeholder-text">${title}</span>
          <span class="placeholder-sub">${subtitle}</span>
        </div>
        <strong class="bucket-title-text" style="opacity: 0.5;">${title}</strong>
        <span class="bucket-color-tag" style="opacity: 0.5;">Awaiting</span>
      </div>
    `;
  }

  const cryptoStepData = [
    // Step 1
    {
      badge: "Step 1 of 6 • Initial State",
      headline: "Private Keys in Studios, Public Key on Open Wire",
      desc: "Alice holds her private key on her device. Bob holds his private key on his device. The public base key is situated in the public network space. You can customize any of these colors using the controls on each pot.",
      principle: "Confidentiality: Private keys never touch the wire",
      eve: "Captured Public Base: Yellow (g = 5)",
      keyStatus: "Private keys locked on devices"
    },
    // Step 2
    {
      badge: "Step 2 of 6 • Share Public Key",
      headline: "Public Base Key Distributed Both Ways to Alice and Bob",
      desc: "The public base paint (g = 5 mod 23) is shared across the network both ways to Alice and Bob. Both users now hold the common public base in their workspaces alongside their private secrets.",
      principle: "Distribution: Public parameters are openly shared",
      eve: "Observed Public Base broadcast: g = 5 (mod 23)",
      keyStatus: "Public base delivered to both studios"
    },
    // Step 3
    {
      badge: "Step 3 of 6 • One-Way Paint Mix",
      headline: "Each User Mixes the Public Base with their Private Secret",
      desc: "Alice blends Public Yellow + Secret Red ➔ Alice's Mixture (Orange, A = 8). Bob blends Public Yellow + Secret Blue ➔ Bob's Mixture (Green, B = 19). Paint mixing is a One-Way Function: simple to combine, computationally impossible to separate.",
      principle: "One-Way Function: Mixing cannot be reversed",
      eve: "Mixtures prepared inside private devices (not yet sent)",
      keyStatus: "Mixtures created in private studios"
    },
    // Step 4
    {
      badge: "Step 4 of 6 • The Packet Swap",
      headline: "Alice and Bob Exchange Mixed Paints Across the Public Wire",
      desc: "Alice transmits her mixed paint (A = 8) to Bob, and Bob transmits his mixed paint (B = 19) to Alice. Alice now receives Bob's mixture, and Bob receives Alice's mixture. Eve intercepts both packets, but cannot reverse the mixture to discover the private keys.",
      principle: "Discrete Logarithm Problem: Eavesdropper cannot un-mix",
      eve: "Intercepted Alice Mix (A=8) & Bob Mix (B=19) — Cannot un-mix",
      keyStatus: "Swapped mixtures received by both parties"
    },
    // Step 5
    {
      badge: "Step 5 of 6 • Shared Key Match",
      headline: "Each Adds their Private Secret ➔ Exact Same Shared Key!",
      desc: "Alice adds her private secret (a = 6) into Bob's incoming mixture (B = 19) ➔ Shared Secret Key (K = 2). Bob adds his private secret (b = 15) into Alice's incoming mixture (A = 8) ➔ Exact Same Secret Key (K = 2). Both arrive at the exact same key without ever transmitting it across the wire.",
      principle: "Commutative Property: (gᵃ)ᵇ = (gᵇ)ᵃ (mod p)",
      eve: "Lacks private keys a & b — Cannot compute Key K = 2",
      keyStatus: "Key match confirmed: Shared Key K = 2 Active"
    },
    // Step 6
    {
      badge: "Step 6 of 6 • WhatsApp End-to-End Encryption Payoff",
      headline: "Alice Encrypts Message Using the Shared Secret Key",
      desc: "Alice uses the negotiated Shared Key (K = 2) to encrypt her message into ciphertext. The ciphertext travels across the wire past Eve. Eve's monitor captures only unreadable ciphertext bytes. Bob's device uses his identical key (K = 2) to decrypt and read the message.",
      principle: "End-to-End Encryption Active (Symmetric AES)",
      eve: "Intercepted ciphertext only — Unreadable noise without Key K = 2",
      keyStatus: "E2EE Session Active (Key K = 2)"
    }
  ];

  function updateCryptoVisuals() {
    const data = cryptoStepData[cryptoCurrentStep - 1];

    // Compute Blended Colors (Subtractive CMY)
    const aliceMixColor = mixPigments(publicBaseColor, aliceSecretColor);
    const bobMixColor = mixPigments(publicBaseColor, bobSecretColor);
    const finalSharedColor = mixThreePigments(publicBaseColor, aliceSecretColor, bobSecretColor);

    const pubName = getColorFriendlyName(publicBaseColor);
    const aliceSecName = getColorFriendlyName(aliceSecretColor);
    const bobSecName = getColorFriendlyName(bobSecretColor);
    const aliceMixName = getColorFriendlyName(aliceMixColor);
    const bobMixName = getColorFriendlyName(bobMixColor);
    const finalKeyName = getColorFriendlyName(finalSharedColor);

    // Diffie-Hellman Calculations
    const p = dhParams.p;
    const g = dhParams.g;
    const a = dhParams.a;
    const b = dhParams.b;
    const A = modPow(g, a, p); // 5^6 mod 23 = 8
    const B = modPow(g, b, p); // 5^15 mod 23 = 19
    const keyAlice = modPow(B, a, p); // 19^6 mod 23 = 2
    const keyBob = modPow(A, b, p);   // 8^15 mod 23 = 2

    // Update Story & Stat Bar
    cryptoPhaseBadge.textContent = data.badge;
    cryptoStoryHeadline.innerHTML = data.headline;
    cryptoStoryDesc.innerHTML = data.desc;
    statOneWayStatus.textContent = data.principle;
    statEveKnowledge.textContent = data.eve;
    if (statKeyStatus) statKeyStatus.textContent = data.keyStatus;

    // Update Stepper Controls
    if (cryptoStepBackBtn) cryptoStepBackBtn.disabled = (cryptoCurrentStep === 1);
    if (cryptoStepFwdBtn) cryptoStepFwdBtn.disabled = (cryptoCurrentStep === 6);

    // Update Stepper Indicators (1 to 6)
    cryptoStepPills.forEach(pill => {
      const step = parseInt(pill.dataset.step, 10);
      pill.classList.toggle('active', step === cryptoCurrentStep);
    });

    // -------------------------------------------------------------------------
    // RENDER WORKSPACE: ALICE (LEFT)
    // -------------------------------------------------------------------------
    if (cryptoCurrentStep === 1) {
      // Step 1: Initial State (Customizable)
      aliceBucketWorkspace.innerHTML = `
        <div class="mixing-stage-flex">
          ${renderPlaceholderCard({
            title: "Public Base",
            subtitle: "Awaiting distribution"
          })}
          ${renderBucketCard({
            title: "Alice Secret Paint",
            colorHex: aliceSecretColor,
            badgeText: "PRIVATE SECRET",
            badgeClass: "badge-secret",
            mathLabel: "Private Exponent",
            mathNumber: `a = ${a}`,
            showPicker: true,
            pickerId: "alicePrivatePickerDyn"
          })}
        </div>
      `;
    } else if (cryptoCurrentStep === 2) {
      // Step 2: Public Key Received
      aliceBucketWorkspace.innerHTML = `
        <div class="mixing-stage-flex">
          ${renderBucketCard({
            title: "Public Base",
            colorHex: publicBaseColor,
            badgeText: "PUBLIC BASE",
            badgeClass: "badge-public",
            mathLabel: "Public Generator",
            mathNumber: `g = ${g} (mod ${p})`
          })}
          ${renderBucketCard({
            title: "Alice Secret",
            colorHex: aliceSecretColor,
            badgeText: "PRIVATE SECRET",
            badgeClass: "badge-secret",
            mathLabel: "Private Exponent",
            mathNumber: `a = ${a}`
          })}
        </div>
      `;
    } else if (cryptoCurrentStep === 3) {
      // Step 3: Mixing Public and Private Key
      aliceBucketWorkspace.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
          <div class="mixing-stage-flex" style="margin-bottom: 6px;">
            ${renderBucketCard({
              title: "Public Base",
              colorHex: publicBaseColor,
              badgeText: "PUBLIC",
              badgeClass: "badge-public",
              mathLabel: "Generator",
              mathNumber: `g = ${g}`
            })}
            <span class="mixing-arrow-operator">+</span>
            ${renderBucketCard({
              title: "Alice Secret",
              colorHex: aliceSecretColor,
              badgeText: "SECRET",
              badgeClass: "badge-secret",
              mathLabel: "Exponent",
              mathNumber: `a = ${a}`
            })}
          </div>
          <div class="mixing-arrow-wrap">
            <div class="mixing-down-arrow">↓</div>
            <div class="arrow-math-formula">
              <span class="formula-label">One-Way Mix:</span> A = gᵃ mod p ➔ ${g}⁶ mod ${p} = <strong>${A}</strong>
            </div>
          </div>
          <div class="mixing-stage-flex" style="margin-top: 6px;">
            ${renderBucketCard({
              title: "Alice's Mixture",
              colorHex: aliceMixColor,
              badgeText: "ALICE MIXTURE",
              badgeClass: "badge-mix",
              mathLabel: "Mixed Public Key",
              mathNumber: `A = ${A}`
            })}
          </div>
        </div>
      `;
    } else if (cryptoCurrentStep === 4) {
      // Step 4: Multi-Row Timeline (Row 1: Mix, Row 2: Swapped with Bob)
      aliceBucketWorkspace.innerHTML = `
        <div class="derivation-stack">
          <!-- Row 1: Initial & First Mix -->
          <div class="derivation-row">
            <div class="derivation-row-tag">Row 1: Public Base + Alice's Secret Mix</div>
            <div class="derivation-row-content">
              <div class="mixing-inputs-compact">
                ${renderBucketCard({
                  title: "Public",
                  colorHex: publicBaseColor,
                  badgeText: "PUBLIC",
                  badgeClass: "badge-public",
                  mathLabel: "g",
                  mathNumber: `${g}`,
                  compact: true
                })}
                <span class="mixing-plus">+</span>
                ${renderBucketCard({
                  title: "Secret",
                  colorHex: aliceSecretColor,
                  badgeText: "SECRET",
                  badgeClass: "badge-secret",
                  mathLabel: "a",
                  mathNumber: `${a}`,
                  compact: true
                })}
              </div>
              <div class="derivation-arrow-compact">
                <span>↓</span>
                <div class="arrow-math-formula">A = ${A}</div>
              </div>
              <div class="mixing-output-compact">
                ${renderBucketCard({
                  title: "Alice Mix",
                  colorHex: aliceMixColor,
                  badgeText: "MIX A",
                  badgeClass: "badge-mix",
                  mathLabel: "Public Mix",
                  mathNumber: `A = ${A}`,
                  compact: true
                })}
              </div>
            </div>
          </div>

          <!-- Row 2: Swapped Mixture from Bob -->
          <div class="derivation-row row-active">
            <div class="derivation-row-tag">Row 2: Swapped with Bob's Mixture</div>
            <div class="derivation-row-content row-swap-highlight">
              <span class="swap-direction-icon">⇄</span>
              ${renderBucketCard({
                title: "Bob's Mix (Received)",
                colorHex: bobMixColor,
                badgeText: "FROM BOB",
                badgeClass: "badge-public",
                mathLabel: "Bob's Mix",
                mathNumber: `B = ${B}`,
                compact: true
              })}
              <span class="swap-status-text">Swapped with Alice's mixture across public wire</span>
            </div>
          </div>
        </div>
      `;
    } else if (cryptoCurrentStep === 5) {
      // Step 5: Multi-Row Timeline (Row 1, Row 2, Row 3: Final Key Match!)
      aliceBucketWorkspace.innerHTML = `
        <div class="derivation-stack">
          <!-- Row 1: Initial & First Mix -->
          <div class="derivation-row">
            <div class="derivation-row-tag">Row 1: Public Base + Alice's Secret Mix</div>
            <div class="derivation-row-content">
              <div class="mixing-inputs-compact">
                ${renderBucketCard({
                  title: "Public",
                  colorHex: publicBaseColor,
                  badgeText: "PUBLIC",
                  badgeClass: "badge-public",
                  mathLabel: "g",
                  mathNumber: `${g}`,
                  compact: true
                })}
                <span class="mixing-plus">+</span>
                ${renderBucketCard({
                  title: "Secret",
                  colorHex: aliceSecretColor,
                  badgeText: "SECRET",
                  badgeClass: "badge-secret",
                  mathLabel: "a",
                  mathNumber: `${a}`,
                  compact: true
                })}
              </div>
              <div class="derivation-arrow-compact">
                <span>↓</span>
                <div class="arrow-math-formula">A = ${A}</div>
              </div>
              <div class="mixing-output-compact">
                ${renderBucketCard({
                  title: "Alice Mix",
                  colorHex: aliceMixColor,
                  badgeText: "MIX A",
                  badgeClass: "badge-mix",
                  mathLabel: "Public Mix",
                  mathNumber: `A = ${A}`,
                  compact: true
                })}
              </div>
            </div>
          </div>

          <!-- Row 2: Swapped Mixture from Bob -->
          <div class="derivation-row">
            <div class="derivation-row-tag">Row 2: Swapped with Bob's Mixture</div>
            <div class="derivation-row-content row-swap-highlight">
              <span class="swap-direction-icon">⇄</span>
              ${renderBucketCard({
                title: "Bob's Mix (Received)",
                colorHex: bobMixColor,
                badgeText: "FROM BOB",
                badgeClass: "badge-public",
                mathLabel: "Bob's Mix",
                mathNumber: `B = ${B}`,
                compact: true
              })}
              <span class="swap-status-text">Received from Bob across public wire</span>
            </div>
          </div>

          <!-- Row 3: Final Key Mix -->
          <div class="derivation-row row-active row-key-result">
            <div class="derivation-row-tag">Row 3: Bob's Mix + Alice's Secret ➔ Shared Key</div>
            <div class="derivation-row-content">
              <div class="mixing-inputs-compact">
                ${renderBucketCard({
                  title: "Bob Mix",
                  colorHex: bobMixColor,
                  badgeText: "FROM BOB",
                  badgeClass: "badge-public",
                  mathLabel: "B",
                  mathNumber: `${B}`,
                  compact: true
                })}
                <span class="mixing-plus">+</span>
                ${renderBucketCard({
                  title: "Alice Secret",
                  colorHex: aliceSecretColor,
                  badgeText: "SECRET",
                  badgeClass: "badge-secret",
                  mathLabel: "a",
                  mathNumber: `${a}`,
                  compact: true
                })}
              </div>
              <div class="derivation-arrow-compact">
                <span>↓</span>
                <div class="arrow-math-formula">K = Bᵃ mod p ➔ ${keyAlice}</div>
              </div>
              <div class="mixing-output-compact">
                ${renderBucketCard({
                  title: "Shared Key",
                  colorHex: finalSharedColor,
                  badgeText: "KEY MATCH",
                  badgeClass: "badge-key",
                  mathLabel: "Secret Key",
                  mathNumber: `K = ${keyAlice}`,
                  compact: true
                })}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (cryptoCurrentStep === 6) {
      // Step 6: WhatsApp Mockup (Alice Sender)
      aliceBucketWorkspace.innerHTML = `
        <div class="whatsapp-phone-mockup">
          <div class="phone-top-bar">
            <div class="phone-contact-info">
              <span class="phone-avatar-dot">B</span>
              <strong class="phone-contact-name">Bob</strong>
            </div>
            <span class="phone-e2ee-tag">End-to-End Encrypted</span>
          </div>
          <div class="phone-chat-screen">
            <div class="phone-bubble sender">
              <div>${whatsAppMessageText}</div>
              <div style="font-size: 9px; opacity: 0.7; margin-top: 4px; text-align: right;">14:15 Sent</div>
            </div>
          </div>
          <div class="phone-composer-bar">
            <input type="text" id="aliceMsgInputDyn" class="phone-input-field" value="${whatsAppMessageText}">
            <button id="aliceSendMsgBtnDyn" class="phone-send-btn">Send ➔</button>
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // RENDER WORKSPACE: BOB (RIGHT)
    // -------------------------------------------------------------------------
    if (cryptoCurrentStep === 1) {
      // Step 1: Initial State (Customizable)
      bobBucketWorkspace.innerHTML = `
        <div class="mixing-stage-flex">
          ${renderPlaceholderCard({
            title: "Public Base",
            subtitle: "Awaiting distribution"
          })}
          ${renderBucketCard({
            title: "Bob Secret Paint",
            colorHex: bobSecretColor,
            badgeText: "PRIVATE SECRET",
            badgeClass: "badge-secret",
            mathLabel: "Private Exponent",
            mathNumber: `b = ${b}`,
            showPicker: true,
            pickerId: "bobPrivatePickerDyn"
          })}
        </div>
      `;
    } else if (cryptoCurrentStep === 2) {
      // Step 2: Public Key Received
      bobBucketWorkspace.innerHTML = `
        <div class="mixing-stage-flex">
          ${renderBucketCard({
            title: "Public Base",
            colorHex: publicBaseColor,
            badgeText: "PUBLIC BASE",
            badgeClass: "badge-public",
            mathLabel: "Public Generator",
            mathNumber: `g = ${g} (mod ${p})`
          })}
          ${renderBucketCard({
            title: "Bob Secret",
            colorHex: bobSecretColor,
            badgeText: "PRIVATE SECRET",
            badgeClass: "badge-secret",
            mathLabel: "Private Exponent",
            mathNumber: `b = ${b}`
          })}
        </div>
      `;
    } else if (cryptoCurrentStep === 3) {
      // Step 3: Mixing Public and Private Key
      bobBucketWorkspace.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
          <div class="mixing-stage-flex" style="margin-bottom: 6px;">
            ${renderBucketCard({
              title: "Public Base",
              colorHex: publicBaseColor,
              badgeText: "PUBLIC",
              badgeClass: "badge-public",
              mathLabel: "Generator",
              mathNumber: `g = ${g}`
            })}
            <span class="mixing-arrow-operator">+</span>
            ${renderBucketCard({
              title: "Bob Secret",
              colorHex: bobSecretColor,
              badgeText: "SECRET",
              badgeClass: "badge-secret",
              mathLabel: "Exponent",
              mathNumber: `b = ${b}`
            })}
          </div>
          <div class="mixing-arrow-wrap">
            <div class="mixing-down-arrow">↓</div>
            <div class="arrow-math-formula">
              <span class="formula-label">One-Way Mix:</span> B = gᵇ mod p ➔ ${g}¹⁵ mod ${p} = <strong>${B}</strong>
            </div>
          </div>
          <div class="mixing-stage-flex" style="margin-top: 6px;">
            ${renderBucketCard({
              title: "Bob's Mixture",
              colorHex: bobMixColor,
              badgeText: "BOB MIXTURE",
              badgeClass: "badge-mix",
              mathLabel: "Mixed Public Key",
              mathNumber: `B = ${B}`
            })}
          </div>
        </div>
      `;
    } else if (cryptoCurrentStep === 4) {
      // Step 4: Multi-Row Timeline (Row 1: Mix, Row 2: Swapped with Alice)
      bobBucketWorkspace.innerHTML = `
        <div class="derivation-stack">
          <!-- Row 1: Initial & First Mix -->
          <div class="derivation-row">
            <div class="derivation-row-tag">Row 1: Public Base + Bob's Secret Mix</div>
            <div class="derivation-row-content">
              <div class="mixing-inputs-compact">
                ${renderBucketCard({
                  title: "Public",
                  colorHex: publicBaseColor,
                  badgeText: "PUBLIC",
                  badgeClass: "badge-public",
                  mathLabel: "g",
                  mathNumber: `${g}`,
                  compact: true
                })}
                <span class="mixing-plus">+</span>
                ${renderBucketCard({
                  title: "Secret",
                  colorHex: bobSecretColor,
                  badgeText: "SECRET",
                  badgeClass: "badge-secret",
                  mathLabel: "b",
                  mathNumber: `${b}`,
                  compact: true
                })}
              </div>
              <div class="derivation-arrow-compact">
                <span>↓</span>
                <div class="arrow-math-formula">B = ${B}</div>
              </div>
              <div class="mixing-output-compact">
                ${renderBucketCard({
                  title: "Bob Mix",
                  colorHex: bobMixColor,
                  badgeText: "MIX B",
                  badgeClass: "badge-mix",
                  mathLabel: "Public Mix",
                  mathNumber: `B = ${B}`,
                  compact: true
                })}
              </div>
            </div>
          </div>

          <!-- Row 2: Swapped Mixture from Alice -->
          <div class="derivation-row row-active">
            <div class="derivation-row-tag">Row 2: Swapped with Alice's Mixture</div>
            <div class="derivation-row-content row-swap-highlight">
              <span class="swap-direction-icon">⇄</span>
              ${renderBucketCard({
                title: "Alice's Mix (Received)",
                colorHex: aliceMixColor,
                badgeText: "FROM ALICE",
                badgeClass: "badge-public",
                mathLabel: "Alice's Mix",
                mathNumber: `A = ${A}`,
                compact: true
              })}
              <span class="swap-status-text">Swapped with Bob's mixture across public wire</span>
            </div>
          </div>
        </div>
      `;
    } else if (cryptoCurrentStep === 5) {
      // Step 5: Multi-Row Timeline (Row 1, Row 2, Row 3: Final Key Match!)
      bobBucketWorkspace.innerHTML = `
        <div class="derivation-stack">
          <!-- Row 1: Initial & First Mix -->
          <div class="derivation-row">
            <div class="derivation-row-tag">Row 1: Public Base + Bob's Secret Mix</div>
            <div class="derivation-row-content">
              <div class="mixing-inputs-compact">
                ${renderBucketCard({
                  title: "Public",
                  colorHex: publicBaseColor,
                  badgeText: "PUBLIC",
                  badgeClass: "badge-public",
                  mathLabel: "g",
                  mathNumber: `${g}`,
                  compact: true
                })}
                <span class="mixing-plus">+</span>
                ${renderBucketCard({
                  title: "Secret",
                  colorHex: bobSecretColor,
                  badgeText: "SECRET",
                  badgeClass: "badge-secret",
                  mathLabel: "b",
                  mathNumber: `${b}`,
                  compact: true
                })}
              </div>
              <div class="derivation-arrow-compact">
                <span>↓</span>
                <div class="arrow-math-formula">B = ${B}</div>
              </div>
              <div class="mixing-output-compact">
                ${renderBucketCard({
                  title: "Bob Mix",
                  colorHex: bobMixColor,
                  badgeText: "MIX B",
                  badgeClass: "badge-mix",
                  mathLabel: "Public Mix",
                  mathNumber: `B = ${B}`,
                  compact: true
                })}
              </div>
            </div>
          </div>

          <!-- Row 2: Swapped Mixture from Alice -->
          <div class="derivation-row">
            <div class="derivation-row-tag">Row 2: Swapped with Alice's Mixture</div>
            <div class="derivation-row-content row-swap-highlight">
              <span class="swap-direction-icon">⇄</span>
              ${renderBucketCard({
                title: "Alice's Mix (Received)",
                colorHex: aliceMixColor,
                badgeText: "FROM ALICE",
                badgeClass: "badge-public",
                mathLabel: "Alice's Mix",
                mathNumber: `A = ${A}`,
                compact: true
              })}
              <span class="swap-status-text">Received from Alice across public wire</span>
            </div>
          </div>

          <!-- Row 3: Final Key Mix -->
          <div class="derivation-row row-active row-key-result">
            <div class="derivation-row-tag">Row 3: Alice's Mix + Bob's Secret ➔ Shared Key</div>
            <div class="derivation-row-content">
              <div class="mixing-inputs-compact">
                ${renderBucketCard({
                  title: "Alice Mix",
                  colorHex: aliceMixColor,
                  badgeText: "FROM ALICE",
                  badgeClass: "badge-public",
                  mathLabel: "A",
                  mathNumber: `${A}`,
                  compact: true
                })}
                <span class="mixing-plus">+</span>
                ${renderBucketCard({
                  title: "Bob Secret",
                  colorHex: bobSecretColor,
                  badgeText: "SECRET",
                  badgeClass: "badge-secret",
                  mathLabel: "b",
                  mathNumber: `${b}`,
                  compact: true
                })}
              </div>
              <div class="derivation-arrow-compact">
                <span>↓</span>
                <div class="arrow-math-formula">K = Aᵇ mod p ➔ ${keyBob}</div>
              </div>
              <div class="mixing-output-compact">
                ${renderBucketCard({
                  title: "Shared Key",
                  colorHex: finalSharedColor,
                  badgeText: "KEY MATCH",
                  badgeClass: "badge-key",
                  mathLabel: "Secret Key",
                  mathNumber: `K = ${keyBob}`,
                  compact: true
                })}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (cryptoCurrentStep === 6) {
      // Step 6: WhatsApp Mockup (Bob Receiver)
      bobBucketWorkspace.innerHTML = `
        <div class="whatsapp-phone-mockup">
          <div class="phone-top-bar">
            <div class="phone-contact-info">
              <span class="phone-avatar-dot" style="background: #3b82f6;">A</span>
              <strong class="phone-contact-name">Alice</strong>
            </div>
            <span class="phone-e2ee-tag">End-to-End Encrypted</span>
          </div>
          <div class="phone-chat-screen">
            <div class="phone-bubble receiver">
              <div>${whatsAppMessageText}</div>
              <div style="font-size: 9px; opacity: 0.8; margin-top: 4px; color: #6ee7b7;">Decrypted with Shared Key K = ${keyBob}</div>
            </div>
          </div>
          <div style="padding: 8px 12px; background: #202c33; font-size: 11px; color: #94a3b8; font-family: var(--font-mono); text-align: center;">
            E2EE Session Verified • Symmetric AES
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // RENDER INTERNET HIGHWAY (CENTER)
    // -------------------------------------------------------------------------
    const cipherHex = encryptText(whatsAppMessageText, finalSharedColor);

    if (cryptoCurrentStep === 1) {
      // Step 1: Initial State (Public Base on Open Wire with Picker)
      internetHighwayArea.innerHTML = `
        <div class="center-public-showcase">
          <span class="public-showcase-title">Open Public Wire • Visible to All</span>
          ${renderBucketCard({
            title: "Public Base Paint",
            colorHex: publicBaseColor,
            badgeText: "PUBLIC BASE",
            badgeClass: "badge-public",
            mathLabel: "Public Generator",
            mathNumber: `g = ${g} (mod ${p})`,
            showPicker: true,
            pickerId: "publicCommonPickerDyn"
          })}
        </div>
      `;
    } else if (cryptoCurrentStep === 2) {
      // Step 2: Public Key Shared Both Ways
      internetHighwayArea.innerHTML = `
        <div class="center-public-showcase" style="width: 100%;">
          <span class="public-showcase-title">Public Base Distributed to Users</span>
          ${renderBucketCard({
            title: "Public Base Paint",
            colorHex: publicBaseColor,
            badgeText: "PUBLIC BROADCAST",
            badgeClass: "badge-public",
            mathLabel: "Public Generator",
            mathNumber: `g = ${g} (mod ${p})`
          })}
          <div class="dispatch-arrows-row">
            <div class="dispatch-arrow-card">
              <span class="dispatch-arrow-sym">⟵</span>
              <span class="dispatch-dir">Shared with Alice</span>
              <div class="arrow-math-formula">g = ${g} (mod ${p}) to Alice</div>
            </div>
            <div class="dispatch-arrow-card">
              <span class="dispatch-arrow-sym">⟶</span>
              <span class="dispatch-dir">Shared with Bob</span>
              <div class="arrow-math-formula">g = ${g} (mod ${p}) to Bob</div>
            </div>
          </div>
        </div>
      `;
    } else if (cryptoCurrentStep === 3) {
      // Step 3: Mixing Inside Studios (Wire Idle)
      internetHighwayArea.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; padding: 20px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); border: 1.5px solid #10b981; display: flex; align-items: center; justify-content: center; color: #10b981; font-weight: 800; font-size: 14px;">OK</div>
          <strong style="color: #10b981; font-size: 13.5px;">Private Device Shield Active</strong>
          <p style="font-size: 11.5px; color: var(--text-secondary); max-width: 260px; line-height: 1.5; margin: 0;">
            Alice and Bob are mixing paints inside their private devices. No packets are on the wire yet.
          </p>
        </div>
      `;
    } else if (cryptoCurrentStep === 4) {
      // Step 4: The Packet Swap across the Wire
      internetHighwayArea.innerHTML = `
        <div style="width: 100%; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; font-family: var(--font-mono); color: var(--text-muted); font-weight: 700;">
            <span>◀ Sending to Bob</span>
            <span>PUBLIC PACKET EXCHANGE</span>
            <span>Sending to Alice ▶</span>
          </div>
          <div class="wire-transit-track">
            <div class="cable-glowing-pulse"></div>
            <div class="transit-cart cart-alice animate-a2b">
              <span class="cart-swatch-dot" style="background: ${aliceMixColor};"></span>
              <span>Alice's Mixture<span class="math-toggle-target"> (A = ${A})</span></span>
            </div>
            <div class="transit-cart cart-bob animate-b2a">
              <span class="cart-swatch-dot" style="background: ${bobMixColor};"></span>
              <span>Bob's Mixture<span class="math-toggle-target"> (B = ${B})</span></span>
            </div>
          </div>
          <div class="wire-math-formula">
            <span class="math-sub">Mixtures Transmitted:</span>
            Alice ➔ Bob: <strong>A = ${g}⁶ mod ${p} = ${A}</strong> &nbsp;|&nbsp;
            Bob ➔ Alice: <strong>B = ${g}¹⁵ mod ${p} = ${B}</strong>
          </div>
        </div>
      `;
    } else if (cryptoCurrentStep === 5) {
      // Step 5: Shared Key Match Confirmation
      internetHighwayArea.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; padding: 16px; width: 100%;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: rgba(234, 179, 8, 0.15); border: 1.5px solid #eab308; display: flex; align-items: center; justify-content: center; color: #facc15; font-weight: 800; font-size: 14px;">KEY</div>
          <strong style="color: #34d399; font-size: 14px;">Identical Key Established!</strong>
          <span style="font-size: 11px; color: var(--text-secondary); max-width: 280px; line-height: 1.5;">
            Both devices calculated the exact matching secret key without ever sharing their private secrets.
          </span>
          <div class="wire-math-formula" style="width: 100%;">
            <span class="math-sub">Shared Key Identity:</span>
            (gᵃ)ᵇ mod p = (gᵇ)ᵃ mod p = <strong>gᵃᵇ mod ${p} = ${keyAlice}</strong>
          </div>
        </div>
      `;
    } else if (cryptoCurrentStep === 6) {
      // Step 6: WhatsApp Ciphertext Transit
      internetHighwayArea.innerHTML = `
        <div style="width: 100%; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; font-family: var(--font-mono); color: var(--text-muted); font-weight: 700;">
            <span>Alice Phone</span>
            <span style="color: #10b981;">CIPHERTEXT IN TRANSIT</span>
            <span>Bob Phone</span>
          </div>
          <div class="wire-transit-track">
            <div class="cable-glowing-pulse"></div>
            <div class="transit-cart cart-ciphertext animate-cipher">
              <span>${cipherHex.slice(0, 16)}...</span>
            </div>
          </div>
          <div class="wire-math-formula">
            <span class="math-sub">E2EE Payload:</span>
            Ciphertext = Encrypt(Message, <strong>Shared Key K = ${keyAlice}</strong>) ➔ Transmitted as Hex Bytes
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // EVE'S MONITOR SLOTS & LOGS
    // -------------------------------------------------------------------------
    eveSlotPublic.style.background = publicBaseColor;
    eveSlotPublicTxt.innerHTML = `${pubName} <span class="math-toggle-target">(g=${g})</span>`;

    if (cryptoCurrentStep >= 4) {
      eveSlotAliceMix.style.background = aliceMixColor;
      eveSlotAliceMixTxt.innerHTML = `${aliceMixName} <span class="math-toggle-target">(A=${A})</span>`;

      eveSlotBobMix.style.background = bobMixColor;
      eveSlotBobMixTxt.innerHTML = `${bobMixName} <span class="math-toggle-target">(B=${B})</span>`;
    } else {
      eveSlotAliceMix.style.background = '#334155';
      eveSlotAliceMixTxt.textContent = 'Unknown';

      eveSlotBobMix.style.background = '#334155';
      eveSlotBobMixTxt.textContent = 'Unknown';
    }

    if (cryptoCurrentStep >= 6) {
      eveCrackResult.innerHTML = `
        <span style="color: #f59e0b; font-weight: 800;">[PACKET SNIFFED]</span> Intercepted Ciphertext:
        <code style="color: #38bdf8; display: block; margin-top: 3px;">${cipherHex.slice(0, 36)}...</code>
        <span style="color: #94a3b8; font-size: 10px;">Without the shared secret key (K=${keyAlice}), this data is mathematically uncrackable noise.</span>
      `;
    } else if (cryptoCurrentStep >= 4) {
      eveCrackResult.innerHTML = `
        <span style="color: #f59e0b; font-weight: 800;">[INTERCEPTED]</span> Alice Mix (A=${A}) &amp; Bob Mix (B=${B}).
        <span style="color: #94a3b8; font-size: 10px; display: block;">Eve cannot un-mix the colors or reverse gᵃ mod p to extract secret private exponents.</span>
      `;
    } else if (cryptoCurrentStep >= 1) {
      eveCrackResult.innerHTML = `
        <span style="color: #38bdf8; font-weight: 800;">[INTERCEPTED]</span> Public Base g = ${g} (mod ${p}).
        <span style="color: #94a3b8; font-size: 10px; display: block;">Eve knows the public generator, but neither private secret has been transmitted.</span>
      `;
    } else {
      eveCrackResult.textContent = 'Eve is waiting for network traffic to begin.';
    }

    // -------------------------------------------------------------------------
    // BIND DYNAMIC EVENT LISTENERS (COLOR PICKERS & CHAT INPUTS)
    // -------------------------------------------------------------------------
    const publicPickerDyn = document.getElementById('publicCommonPickerDyn');
    if (publicPickerDyn) {
      publicPickerDyn.addEventListener('input', (e) => {
        publicBaseColor = e.target.value;
        updateCryptoVisuals();
      });
    }

    const alicePickerDyn = document.getElementById('alicePrivatePickerDyn');
    if (alicePickerDyn) {
      alicePickerDyn.addEventListener('input', (e) => {
        aliceSecretColor = e.target.value;
        updateCryptoVisuals();
      });
    }

    const bobPickerDyn = document.getElementById('bobPrivatePickerDyn');
    if (bobPickerDyn) {
      bobPickerDyn.addEventListener('input', (e) => {
        bobSecretColor = e.target.value;
        updateCryptoVisuals();
      });
    }

    const aliceMsgInputDyn = document.getElementById('aliceMsgInputDyn');
    const aliceSendMsgBtnDyn = document.getElementById('aliceSendMsgBtnDyn');
    if (aliceMsgInputDyn) {
      aliceMsgInputDyn.addEventListener('input', (e) => {
        whatsAppMessageText = e.target.value.trim() || 'Meet at the cafe at 4pm!';
      });
    }
    if (aliceSendMsgBtnDyn) {
      aliceSendMsgBtnDyn.addEventListener('click', () => {
        if (aliceMsgInputDyn) {
          whatsAppMessageText = aliceMsgInputDyn.value.trim() || 'Meet at the cafe at 4pm!';
        }
        updateCryptoVisuals();
      });
    }
  }

  // Stepper Controls
  if (cryptoStepFwdBtn) {
    cryptoStepFwdBtn.addEventListener('click', () => {
      if (cryptoCurrentStep < 6) {
        cryptoCurrentStep++;
        updateCryptoVisuals();
      }
    });
  }

  if (cryptoStepBackBtn) {
    cryptoStepBackBtn.addEventListener('click', () => {
      if (cryptoCurrentStep > 1) {
        cryptoCurrentStep--;
        updateCryptoVisuals();
      }
    });
  }

  if (cryptoStepResetBtn) {
    cryptoStepResetBtn.addEventListener('click', () => {
      if (isCryptoPlaying) stopCryptoAutoPlay();
      cryptoCurrentStep = 1;
      updateCryptoVisuals();
    });
  }

  function stopCryptoAutoPlay() {
    isCryptoPlaying = false;
    clearInterval(cryptoPlayTimer);
    cryptoPlayTimer = null;
    const playIcon = document.getElementById('cryptoPlayIcon');
    const pauseIcon = document.getElementById('cryptoPauseIcon');
    if (playIcon) playIcon.style.display = 'inline';
    if (pauseIcon) pauseIcon.style.display = 'none';
  }

  if (cryptoAutoPlayBtn) {
    cryptoAutoPlayBtn.addEventListener('click', () => {
      if (isCryptoPlaying) {
        stopCryptoAutoPlay();
      } else {
        isCryptoPlaying = true;
        const playIcon = document.getElementById('cryptoPlayIcon');
        const pauseIcon = document.getElementById('cryptoPauseIcon');
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'inline';
        if (cryptoCurrentStep >= 6) cryptoCurrentStep = 1;
        updateCryptoVisuals();

        cryptoPlayTimer = setInterval(() => {
          if (cryptoCurrentStep < 6) {
            cryptoCurrentStep++;
            updateCryptoVisuals();
          } else {
            stopCryptoAutoPlay();
          }
        }, 2400);
      }
    });
  }

  cryptoStepPills.forEach(pill => {
    pill.addEventListener('click', () => {
      cryptoCurrentStep = parseInt(pill.dataset.step, 10);
      updateCryptoVisuals();
    });
  });

  // Math in Diagram Toggle
  if (cryptoMathToggleBtn) {
    cryptoMathToggleBtn.addEventListener('click', () => {
      cryptoMathOpen = !cryptoMathOpen;
      const tabEncryption = document.getElementById('tab-encryption');
      if (tabEncryption) {
        tabEncryption.classList.toggle('show-math', cryptoMathOpen);
      }
      cryptoMathToggleBtn.classList.toggle('active', cryptoMathOpen);
      const toggleText = document.getElementById('cryptoMathToggleText');
      if (toggleText) {
        toggleText.textContent = cryptoMathOpen ? 'Math in Diagram: ON' : 'Math in Diagram: OFF';
      }
    });
  }

  // Eve Crack Button Simulation
  if (eveCrackBtn) {
    eveCrackBtn.addEventListener('click', () => {
      eveCrackResult.innerHTML = `
        <div style="color: #f87171; font-weight: 800; margin-bottom: 4px;">Un-Mixing Brute-Force Attempt Failed</div>
        <div>Eve cannot separate pigments from Alice's mix without knowing Alice's private key. In mathematics, reversing gᵃ mod p is the <strong>Discrete Logarithm Problem</strong>. For 2048-bit primes, testing all combinations would take <strong>4.3 Billion Years</strong>. The message is safe.</div>
      `;
      const terminal = document.getElementById('eveRadarCard');
      if (terminal) {
        terminal.style.boxShadow = '0 0 26px rgba(239, 68, 68, 0.6)';
        setTimeout(() => {
          terminal.style.boxShadow = '';
        }, 1200);
      }
    });
  }

  // Initial render of Encryption Visualiser
  updateCryptoVisuals();

});
