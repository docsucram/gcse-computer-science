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
    const themeParam = new URLSearchParams(window.location.search).get('theme');
    const saved = themeParam || localStorage.getItem('gcse_theme') || localStorage.getItem('theme');
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

  // Support URL hash & query navigation (e.g. #topologies, #topologies-bus, ?topo=bus)
  const hashRaw = window.location.hash.replace('#', '');
  const urlSearch = new URLSearchParams(window.location.search);
  const initialHash = hashRaw.split('?')[0].split('&')[0];

  if (initialHash) {
    const matchingBtn = Array.from(tabButtons).find(b => b.dataset.tab === initialHash || `tab-${b.dataset.tab}` === initialHash || (initialHash.startsWith('topologies') && b.dataset.tab === 'topologies'));
    if (matchingBtn) matchingBtn.click();
  } else if (urlSearch.has('topo')) {
    const topoBtn = Array.from(tabButtons).find(b => b.dataset.tab === 'topologies');
    if (topoBtn) topoBtn.click();
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
    scenario: 'web', // Default: Web & DNS (Request ➔ Response)
    currentStep: 0,
    maxSteps: 6,
    isPlaying: false,
    timer: null,
    stepDuration: 1300,
    isCongested: false,
    isCorrupt: false,
    selectedPacketIdx: 0,
    packets: [],
    dnsPacket: null,
    httpReqPacket: null,
    domainName: 'bbc.co.uk',
    resolvedIp: '151.101.0.81',
    serverLabel: 'BBC Server',
    serverLoc: 'London, UK',
    serverNodeId: 'nodeServerBbc',
    serverLinkId: 'linkGammaBbc'
  };

  // =========================================================================
  // INTERACTIVE GCSE TOOLTIP GLOSSARY DATA
  // =========================================================================
  const TOOLTIP_DATA = {
    // Packet Header Fields
    proto: {
      title: 'Protocol Header (TCP vs UDP vs HTTP/HTTPS)',
      spec: 'AQA §3.5.2 & §3.5.3',
      body: 'Sets the rules of transmission:<br>• <strong>TCP (Transmission Control Protocol):</strong> Connection-oriented, reliable. Slices data, tracks sequence numbers, and requests resends if packets are lost.<br>• <strong>UDP (User Datagram Protocol):</strong> Connectionless, lightweight, fast. No handshakes or resends (ideal for DNS queries &amp; live video).<br>• <strong>HTTP/HTTPS:</strong> Application Layer protocol requesting web pages (HTTPS uses TLS encryption).'
    },
    srcIp: {
      title: 'Source IP Address (32-bit IPv4)',
      spec: 'AQA §3.5.2',
      body: 'The numeric address of the sending device (<code>192.168.1.104</code>). Tells the receiving web server where to send the response packets back across the internet.'
    },
    destIp: {
      title: 'Destination IP Address',
      spec: 'AQA §3.5.2',
      body: 'The numeric address of the target destination. Routers along the route only read this field to look up their routing tables and decide the optimal next hop.'
    },
    seq: {
      title: 'Sequence Number (#1 of 3)',
      spec: 'AQA §3.5.2',
      body: 'Packets travel along independent routes and often arrive out of order. The receiving TCP layer uses sequence numbers to rebuild the exact original file without corruption.'
    },
    ttl: {
      title: 'TTL (Time to Live)',
      spec: 'AQA §3.5.2',
      body: 'A hop counter (starts at 64). Every router decrements this value by 1. If it reaches 0, the packet is discarded to prevent infinite routing loops from clogging the internet.'
    },
    payload: {
      title: 'Payload (Data Chunk)',
      spec: 'AQA §3.5.2',
      body: 'The actual chunk of user information being transported—such as a piece of HTML code, part of an image, or a section of a text message.'
    },
    crc: {
      title: 'Checksum (CRC32 Error Check)',
      spec: 'AQA §3.5.2',
      body: 'A mathematical fingerprint calculated from the payload bits before sending. The receiver recalculates this hash; if electrical noise flipped any bits in transit, the checksum fails and TCP discards the packet.'
    },

    // Network Hardware Nodes
    nodeDns: {
      title: 'DNS Resolver Server (8.8.8.8)',
      spec: 'AQA §3.5.3',
      body: '<strong>The "phonebook of the Internet":</strong> Humans remember domain names (<code>bbc.co.uk</code>), but routers only navigate by numeric IP addresses (<code>151.101.0.81</code>). DNS resolves human URLs into IP addresses.'
    },
    nodeServerBbc: {
      title: 'BBC Web Server & London Edge CDN',
      spec: 'AQA §3.5.3',
      body: '<strong>Where Websites Live:</strong><br>• <strong>Origin Servers:</strong> High-powered computers in data centers running 24/7 storing website code.<br>• <strong>CDNs (Content Delivery Networks):</strong> Popular websites (BBC, YouTube, Netflix) cache copies in local server facilities close to UK ISPs (e.g. London). This allows pages to load in milliseconds without crossing underwater transatlantic cables!'
    },
    nodeServerWiki: {
      title: 'Wikipedia Web Server (Virginia, USA)',
      spec: 'AQA §3.5.3',
      body: 'Hosted on Wikimedia data center servers in the United States. Accessing this origin server requires transatlantic submarine fibre-optic cables.'
    },
    nodeServerPython: {
      title: 'Python Software Server (Oregon, USA)',
      spec: 'AQA §3.5.3',
      body: 'Origin server located in Oregon, USA. Delivers documentation and package archives across international WAN backbones.'
    },
    nodeMast: {
      title: '4G/5G Cellular Base Station (Mast)',
      spec: 'AQA §3.5.1',
      body: 'Physical layer transceiver: converts high-frequency electromagnetic radio waves from your phone\'s antenna into pulses of laser light inside underground fibre-optic cables.'
    },
    nodeDestMast: {
      title: 'Recipient\'s Local Cell Mast',
      spec: 'AQA §3.5.1',
      body: 'The final cellular base station near the recipient. Receives laser light from the optical backbone and broadcasts radio waves to the recipient\'s mobile handset.'
    },
    nodeIsp: {
      title: 'ISP Gateway Router (81.2.14.1)',
      spec: 'AQA §3.5.2',
      body: 'Connects your local provider network to the global internet backbone. Inspects the destination IP and chooses the initial routing path.'
    },
    nodeAlpha: {
      title: 'Backbone Router Alpha (Path A)',
      spec: 'AQA §3.5.2',
      body: 'Core internet router. Inspects packet headers, consults routing tables, and forwards packets across high-speed optical links (12ms ping).'
    },
    nodeBeta: {
      title: 'Backbone Router Beta (Path B)',
      spec: 'AQA §3.5.2',
      body: 'Alternate routing path. In packet switching, if Router Beta becomes congested or severed, routers automatically reroute traffic through Router Alpha.'
    },
    nodeGamma: {
      title: 'Egress / Cloud Gateway Router',
      spec: 'AQA §3.5.2',
      body: 'Aggregates packets arriving from multiple paths. In WhatsApp mode, acts as the Cloud Relay Gateway queuing and dispatching messages.'
    },
    nodeSender: {
      title: 'Your Mobile Phone (Client)',
      spec: 'AQA §3.5.1',
      body: 'Client device running the web browser or messaging app. The OS network stack and TCP slice application data into packets and attach IP headers.'
    },
    nodeRecipient: {
      title: 'Friend\'s Mobile Handset',
      spec: 'AQA §3.5.1',
      body: 'The receiving endpoint. The TCP layer buffers incoming packets, reorders them using Sequence Numbers, checks checksums, and renders the message.'
    }
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
  const destWebView = document.getElementById('destWebView');
  const siteUrlDisplay = document.getElementById('siteUrlDisplay');
  const siteHeroHeadline = document.getElementById('siteHeroHeadline');

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
      // Realistic WhatsApp Messaging: Destination is WhatsApp Cloud Relay Server!
      const msg = interactiveMessageInput.value.trim() || 'Meet at the library at 4pm!';
      const chunkSize = Math.max(6, Math.ceil(msg.length / 3));
      const chunks = [];
      for (let i = 0; i < msg.length; i += chunkSize) {
        chunks.push(msg.substring(i, i + chunkSize));
      }

      state.dnsPacket = null;
      state.httpReqPacket = null;

      chunks.forEach((chunk, idx) => {
        const correctCrc = simpleCrc(chunk);
        state.packets.push({
          id: idx + 1,
          total: chunks.length,
          type: 'DATA',
          srcIp: '192.168.1.104',
          destIp: '157.240.22.60', // WhatsApp Cloud Relay in London
          seq: idx + 1,
          proto: 'TCP / IP',
          ttl: 64,
          payload: chunk,
          crc: correctCrc,
          corruptCrc: '0xDEADBEEF',
          route: idx === 1 ? 'beta' : 'alpha'
        });

        const chip = document.createElement('span');
        chip.className = 'slicer-chip';
        chip.textContent = `#${idx + 1}: "${chunk}"`;
        slicerChips.appendChild(chip);
      });

      state.maxSteps = 6;
      destDeviceTitle.textContent = "Friend's Phone";
      destDeviceIp.textContent = "172.56.21.90";

      if (destWebView) destWebView.style.display = 'none';
      if (destChatBubble) destChatBubble.style.display = 'block';
    } else {
      // Web & DNS Mode: Full Request ➔ Server ➔ Response Journey
      const sel = browserDomainSelect.options[browserDomainSelect.selectedIndex] || browserDomainSelect.options[0];
      state.domainName = sel.value;
      state.resolvedIp = sel.dataset.ip || '151.101.0.81';
      state.serverLabel = sel.dataset.label || 'BBC Server';
      state.serverLoc = sel.dataset.loc || 'London, UK';
      state.serverNodeId = sel.dataset.node || 'nodeServerBbc';
      state.serverLinkId = (state.domainName === 'bbc.co.uk') ? 'linkGammaBbc' : (state.domainName === 'wikipedia.org' ? 'linkGammaWiki' : 'linkGammaPython');

      // 1. DNS Packet (UDP Port 53)
      state.dnsPacket = {
        id: 0,
        type: 'DNS',
        srcIp: '192.168.1.104',
        destIp: '8.8.8.8',
        seq: 'DNS',
        proto: 'UDP (DNS 53)',
        ttl: 64,
        payload: `DNS Query: ${state.domainName}?`,
        crc: simpleCrc(`DNS:${state.domainName}`)
      };

      // 2. HTTP GET Request Packet (TCP Port 443)
      state.httpReqPacket = {
        id: 0,
        type: 'HTTP-REQ',
        srcIp: '192.168.1.104',
        destIp: state.resolvedIp,
        seq: 'GET',
        proto: 'TCP (HTTPS 443)',
        ttl: 64,
        payload: `GET / HTTP/2 (${state.domainName})`,
        crc: simpleCrc(`GET:${state.domainName}`)
      };

      // 3. Web Server Response Packets (TCP slices HTML page into 3 chunks returned to phone)
      if (state.domainName === 'bbc.co.uk') {
        state.packets = [
          { id: 1, total: 3, type: 'HTTP-RES', srcIp: state.resolvedIp, destIp: '192.168.1.104', seq: 1, proto: 'TCP (HTTPS 443)', ttl: 64, payload: '<!DOCTYPE html><title>BBC News</title>', crc: simpleCrc('BBC_P1'), route: 'alpha' },
          { id: 2, total: 3, type: 'HTTP-RES', srcIp: state.resolvedIp, destIp: '192.168.1.104', seq: 2, proto: 'TCP (HTTPS 443)', ttl: 64, payload: '<article>Live Tech Updates: Networks</article>', crc: simpleCrc('BBC_P2'), corruptCrc: '0xDEADBEEF', route: 'beta' },
          { id: 3, total: 3, type: 'HTTP-RES', srcIp: state.resolvedIp, destIp: '192.168.1.104', seq: 3, proto: 'TCP (HTTPS 443)', ttl: 64, payload: '<footer>© BBC News 2026 • London CDN</footer>', crc: simpleCrc('BBC_P3'), route: 'alpha' }
        ];
      } else if (state.domainName === 'wikipedia.org') {
        state.packets = [
          { id: 1, total: 3, type: 'HTTP-RES', srcIp: state.resolvedIp, destIp: '192.168.1.104', seq: 1, proto: 'TCP (HTTPS 443)', ttl: 64, payload: '<!DOCTYPE html><title>Wikipedia</title>', crc: simpleCrc('WIKI_P1'), route: 'alpha' },
          { id: 2, total: 3, type: 'HTTP-RES', srcIp: state.resolvedIp, destIp: '192.168.1.104', seq: 2, proto: 'TCP (HTTPS 443)', ttl: 64, payload: '<main>The Free Encyclopedia: WANs & Packets</main>', crc: simpleCrc('WIKI_P2'), corruptCrc: '0xDEADBEEF', route: 'beta' },
          { id: 3, total: 3, type: 'HTTP-RES', srcIp: state.resolvedIp, destIp: '192.168.1.104', seq: 3, proto: 'TCP (HTTPS 443)', ttl: 64, payload: '<footer>Wikimedia Foundation • Virginia USA</footer>', crc: simpleCrc('WIKI_P3'), route: 'alpha' }
        ];
      } else {
        state.packets = [
          { id: 1, total: 3, type: 'HTTP-RES', srcIp: state.resolvedIp, destIp: '192.168.1.104', seq: 1, proto: 'TCP (HTTPS 443)', ttl: 64, payload: '<!DOCTYPE html><title>Python.org</title>', crc: simpleCrc('PY_P1'), route: 'alpha' },
          { id: 2, total: 3, type: 'HTTP-RES', srcIp: state.resolvedIp, destIp: '192.168.1.104', seq: 2, proto: 'TCP (HTTPS 443)', ttl: 64, payload: '<code>import socket; sock.connect()</code>', crc: simpleCrc('PY_P2'), corruptCrc: '0xDEADBEEF', route: 'beta' },
          { id: 3, total: 3, type: 'HTTP-RES', srcIp: state.resolvedIp, destIp: '192.168.1.104', seq: 3, proto: 'TCP (HTTPS 443)', ttl: 64, payload: '<footer>Python Software Foundation • Oregon</footer>', crc: simpleCrc('PY_P3'), route: 'alpha' }
        ];
      }

      state.packets.forEach(p => {
        const chip = document.createElement('span');
        chip.className = 'slicer-chip';
        chip.textContent = `HTML #${p.seq}`;
        slicerChips.appendChild(chip);
      });

      state.maxSteps = 6;
      destDeviceTitle.textContent = state.serverLabel;
      destDeviceIp.textContent = state.resolvedIp;

      if (destWebView) destWebView.style.display = 'block';
      if (destChatBubble) destChatBubble.style.display = 'none';
      if (siteUrlDisplay) siteUrlDisplay.textContent = `https://${state.domainName}`;
      if (siteHeroHeadline) siteHeroHeadline.textContent = `${state.serverLabel} • Response Reassembled`;
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

    shelfStatusPill.textContent = "Waiting";
    shelfStatusPill.className = "shelf-status-pill";

    if (destChatBubble) {
      destChatBubble.className = "dest-chat-bubble waiting";
      destBubbleContent.innerHTML = "<em>Waiting for incoming transmission...</em>";
      destTickMarks.style.display = "none";
    }
  }

  // Update Envelope Inspector (Center Dock)
  function updateEnvelopeInspector(idx) {
    let p;
    if (idx === -1 && state.dnsPacket) {
      p = state.dnsPacket;
    } else if (idx === -2 && state.httpReqPacket) {
      p = state.httpReqPacket;
    } else if (state.packets && state.packets.length > 0) {
      p = state.packets[idx] || state.packets[0];
    } else {
      return;
    }

    state.selectedPacketIdx = idx;

    const isDns = (p.type === 'DNS');
    const isHttpReq = (p.type === 'HTTP-REQ');

    if (isDns) {
      inspectEnvelopeBadge.textContent = 'Packet [DNS Query] (UDP Port 53)';
    } else if (isHttpReq) {
      inspectEnvelopeBadge.textContent = 'Packet [HTTP GET Request] (TCP 443)';
    } else {
      inspectEnvelopeBadge.textContent = `Packet #${p.seq} of ${p.total} (TCP Data)`;
    }

    envSrcIp.textContent = p.srcIp;
    envDestIp.textContent = p.destIp;
    envSeq.textContent = isDns ? 'DNS Lookup' : (isHttpReq ? 'HTTP GET' : `#${p.seq} of ${p.total}`);
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

  // Draw animated packets onto the Living SVG World
  function renderPacketsOnSvg(step) {
    packetsLayer.innerHTML = '';
    radioWavesLayer.innerHTML = '';
    let activePackets = [];

    if (state.scenario === 'chat') {
      // Realistic WhatsApp Messaging: Phone ➔ Mast ➔ ISP ➔ WhatsApp Cloud Relay (Gamma) ➔ Friend Mast ➔ Friend Phone
      if (step === 1) {
        // Step 1: Wireless hop from phone to cell mast
        drawRadioWave(coords.sender.x, coords.sender.y, coords.mast.x, coords.mast.y);
        state.packets.forEach((p, i) => {
          activePackets.push({ ...p, x: 248 - (i * 32), y: 198 + (i * 20), stage: 'wireless' });
        });
      } else if (step === 2) {
        // Step 2: Optical fibre from cell mast to ISP gateway
        state.packets.forEach((p, i) => {
          activePackets.push({ ...p, x: 350 + (i * 35), y: 220, stage: 'fibre' });
        });
      } else if (step === 3) {
        // Step 3: Independent routing across router mesh (Path A & Path B)
        state.packets.forEach((p, i) => {
          let pos;
          if (p.route === 'beta' && !state.isCongested) {
            pos = { x: coords.beta.x, y: coords.beta.y };
          } else {
            pos = { x: coords.alpha.x + (i * 24 - 12), y: coords.alpha.y };
          }
          activePackets.push({ ...p, x: pos.x, y: pos.y, ttl: 63, stage: 'mesh' });
        });
      } else if (step === 4) {
        // Step 4: Arrives at WhatsApp Cloud Relay Server (Gamma / 870, 250)
        state.packets.forEach((p, i) => {
          activePackets.push({ ...p, x: coords.gamma.x - 20 + (i * 20), y: coords.gamma.y, ttl: 62, stage: 'cloud-relay' });
        });
      } else if (step === 5) {
        // Step 5: WhatsApp Cloud Relay pushes packets across carrier backbone to Friend's mast
        state.packets.forEach((p, i) => {
          let xOffset = (i === 1) ? -40 : (i * 24);
          activePackets.push({ ...p, x: 970 + xOffset, y: 210, ttl: 61, stage: 'egress' });
        });
      } else if (step >= 6) {
        // Step 6: Arrived at recipient phone via 5G wireless waves
        drawRadioWave(coords.destmast.x, coords.destmast.y, coords.recipient.x, coords.recipient.y);
        state.packets.forEach((p, i) => {
          activePackets.push({ ...p, x: coords.recipient.x - 24 + (i * 24), y: coords.recipient.y, ttl: 60, stage: 'arrived' });
        });
      }
    } else {
      // Web & DNS Mode: DNS Query ➔ DNS Resolver ➔ HTTP GET ➔ Web Server ➔ Response Slices
      const sCoord = getTargetServerCoord();

      if (step === 1) {
        // Step 1: DNS Query leaves Phone towards Cell Mast via radio waves
        drawRadioWave(coords.sender.x, coords.sender.y, coords.mast.x, coords.mast.y);
        activePackets.push({ ...state.dnsPacket, x: 215, y: 220, stage: 'wireless' });
      } else if (step === 2) {
        // Step 2: DNS Query travelling underground in fibre cable from Mast to ISP Gateway
        activePackets.push({ ...state.dnsPacket, x: 385, y: 225, stage: 'fibre' });
      } else if (step === 3) {
        // Step 3: ISP queries DNS Resolver (8.8.8.8) to resolve domain to numeric IP
        activePackets.push({ ...state.dnsPacket, x: coords.dns.x, y: coords.dns.y, stage: 'dns-resolve' });
      } else if (step === 4) {
        // Step 4: Stamped with Server IP, HTTP GET request travels across router mesh to Server
        activePackets.push({ ...state.httpReqPacket, x: coords.alpha.x, y: coords.alpha.y, stage: 'http-req' });
      } else if (step === 5) {
        // Step 5: Web Server slices HTML response into 3 packets and routes back across mesh!
        state.packets.forEach((p, i) => {
          let pos;
          if (p.route === 'beta' && !state.isCongested) {
            pos = { x: coords.beta.x, y: coords.beta.y };
          } else {
            pos = { x: coords.alpha.x + (i * 26 - 13), y: coords.alpha.y };
          }
          activePackets.push({ ...p, x: pos.x, y: pos.y, stage: 'http-res-mesh' });
        });
      } else if (step >= 6) {
        // Step 6: Arrived back at Phone / Browser (Reassembled!)
        state.packets.forEach((p, i) => {
          activePackets.push({ ...p, x: coords.sender.x - 20 + (i * 20), y: coords.sender.y, stage: 'arrived' });
        });
      }
    }

    // Render active packet sprites
    activePackets.forEach((p) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const isCorrupt = (state.isCorrupt && p.id === 2);
      const isDns = (p.type === 'DNS');
      const isGet = (p.type === 'HTTP-REQ');

      g.setAttribute('class', `world-packet-sprite ${isDns ? 'packet-dns' : ''} ${isCorrupt ? 'packet-glitched' : ''}`);
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
      text.textContent = isDns ? 'DNS' : (isGet ? 'GET' : `#${p.seq}`);

      g.appendChild(rect);
      g.appendChild(text);

      g.addEventListener('click', (e) => {
        e.stopPropagation();
        const pIdx = isDns ? -1 : (isGet ? -2 : (p.id - 1));
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

      // Mark all 3 servers with standby-server styling
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
        storyPhasePill.textContent = 'Phase 0 • Message Composed';
        storyHeadline.textContent = 'Ready to Send WhatsApp Message';
        storyCaption.innerHTML = `You typed: <strong>"${msg}"</strong>. Tap <strong>Send ➔</strong> to watch your message get sliced into TCP packets and routed to the <strong>WhatsApp Cloud Relay</strong> before being pushed to your friend's handset.`;
        updateEnvelopeInspector(0);
        break;

      case 1:
        storyPhasePill.textContent = 'Hop 1 • Wireless Radio Hop';
        storyHeadline.textContent = 'Step 1: Message Sliced by TCP & Beamed to Mast';
        storyCaption.innerHTML = `<strong>TCP Slicing:</strong> The operating system\'s network stack slices your message into <strong>${state.packets.length} numbered TCP packets</strong>. Your phone transmits them through the air as high-frequency radio waves to the local cell mast.`;
        document.getElementById('nodeSender').classList.add('active-node');
        document.getElementById('linkPhoneMast').classList.add('active-wire');
        document.getElementById('nodeMast').classList.add('active-node');
        updateEnvelopeInspector(0);
        break;

      case 2:
        storyPhasePill.textContent = 'Hop 2 • Underground Fibre Backhaul';
        storyHeadline.textContent = 'Step 2: Mast Converts Radio Waves to Laser Light';
        storyCaption.innerHTML = `The cell mast transceiver converts the radio waves into pulses of laser light traveling down underground <strong>fibre-optic cables</strong> to your ISP\'s Gateway Router (<code>81.2.14.1</code>).`;
        document.getElementById('nodeMast').classList.add('active-node');
        document.getElementById('linkMastIsp').classList.add('active-wire');
        document.getElementById('nodeIsp').classList.add('active-node');
        updateEnvelopeInspector(0);
        break;

      case 3:
        storyPhasePill.textContent = 'Hop 3 • Dynamic Packet Switching';
        if (state.isCongested) {
          showCallout(calloutMeshCard, calloutMeshText, calloutMeshRect, 'Traffic Jam on Beta! All packets rerouted via Alpha');
          storyHeadline.textContent = 'Step 3: Congestion Detected! Dynamic Rerouting';
          storyCaption.innerHTML = `Router Beta is congested! The ISP routing table spots the delay and steers packets through <strong>Router Alpha</strong>. In packet switching, networks dynamically self-heal around bottlenecks!`;
          document.getElementById('nodeIsp').classList.add('active-node');
          document.getElementById('linkIspAlpha').classList.add('active-wire');
          document.getElementById('nodeAlpha').classList.add('active-node');
          document.getElementById('linkAlphaGamma').classList.add('active-wire');
          document.getElementById('nodeGamma').classList.add('active-node');
        } else {
          showCallout(calloutMeshCard, calloutMeshText, calloutMeshRect, 'Packets split across Paths A & B to balance traffic');
          storyHeadline.textContent = 'Step 3: Independent Routing Across Router Mesh';
          storyCaption.innerHTML = `<strong>Core GCSE Concept:</strong> Packets do <em>not</em> take a fixed single line! Packet #1 takes <strong>Path A (Router Alpha)</strong>, while Packet #2 takes <strong>Path B (Router Beta)</strong>. Routers inspect the destination IP and forward along the fastest available path.`;
          document.getElementById('nodeIsp').classList.add('active-node');
          document.getElementById('linkIspAlpha').classList.add('active-wire');
          document.getElementById('linkIspBeta').classList.add('active-wire');
          document.getElementById('nodeAlpha').classList.add('active-node');
          document.getElementById('nodeBeta').classList.add('active-node');
          document.getElementById('linkAlphaGamma').classList.add('active-wire');
          document.getElementById('linkBetaGamma').classList.add('active-wire');
          document.getElementById('nodeGamma').classList.add('active-node');
        }
        updateEnvelopeInspector(1);
        break;

      case 4:
        storyPhasePill.textContent = 'Hop 4 • WhatsApp Cloud Relay';
        showCallout(calloutMeshCard, calloutMeshText, calloutMeshRect, 'WhatsApp Cloud Relay (157.240.22.60) Queues Delivery');
        storyHeadline.textContent = 'Step 4: Packets Arrive at WhatsApp Cloud Server';
        storyCaption.innerHTML = `<strong>Realistic Messaging Architecture:</strong> Phones do <em>not</em> connect peer-to-peer! Your packets arrive at the <strong>WhatsApp Cloud Relay (<code>157.240.22.60</code>)</strong> in London. The server acknowledges receipt, checks the database for your friend\'s active carrier session, and dispatches the delivery!`;
        document.getElementById('nodeGamma').classList.add('active-node');
        updateEnvelopeInspector(0);
        break;

      case 5:
        storyPhasePill.textContent = 'Hop 5 • Carrier Egress to Recipient Mast';
        storyHeadline.textContent = 'Step 5: Packets Pushed to Friend\'s Local Cell Mast';
        storyCaption.innerHTML = `The WhatsApp server transmits the message packets across the internet backbone to your friend\'s cellular carrier. The packets arrive at the local mast serving your friend\'s area, ready for wireless broadcast.`;
        document.getElementById('nodeGamma').classList.add('active-node');
        document.getElementById('linkGammaDestMast').classList.add('active-wire');
        document.getElementById('nodeDestMast').classList.add('active-node');

        const slot0 = document.getElementById('shelfSlot-0');
        if (slot0) {
          slot0.className = 'shelf-slot filled';
          slot0.textContent = '#1 ✓';
        }
        shelfStatusPill.textContent = 'Receiving...';
        updateEnvelopeInspector(1);
        break;

      case 6:
        storyPhasePill.textContent = 'Hop 6 • Checksum Verification & Delivery';
        if (state.isCorrupt) {
          storyHeadline.textContent = 'Step 6: CRC Error! Packet #2 Discarded by Recipient';
          storyCaption.innerHTML = `<span style="color:#ef4444; font-weight:800;">TCP Reliability in Action:</span> Electrical interference flipped a bit during transit in Packet #2. The recipient recalculated the CRC checksum, found it did NOT match the trailer, and <strong>rejected the packet</strong>! Because Packet #2 is missing, the message cannot assemble. TCP sends an automatic <strong>Retransmission Request</strong> back to sender!`;
          shelfStatusPill.textContent = 'CRC Error ✗';
          shelfStatusPill.className = 'shelf-status-pill corrupt';

          const slot0 = document.getElementById('shelfSlot-0');
          const slot1 = document.getElementById('shelfSlot-1');
          const slot2 = document.getElementById('shelfSlot-2');
          if (slot0) { slot0.className = 'shelf-slot filled'; slot0.textContent = '#1 ✓'; }
          if (slot1) { slot1.className = 'shelf-slot corrupt'; slot1.textContent = '#2 ✗'; }
          if (slot2) { slot2.className = 'shelf-slot filled'; slot2.textContent = '#3 ✓'; }

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
          storyHeadline.textContent = 'Step 6: Sequence Reordered & Message Displayed!';
          storyCaption.innerHTML = `The friend\'s phone read the <strong>Sequence Numbers</strong> in the packet headers, snapped them into order (1 ➔ 2 ➔ 3), verified all <strong>CRC Checksums</strong>, and popped the WhatsApp chat bubble onto the screen with double ticks (<code>✓✓</code>)!`;

          state.packets.forEach((p, idx) => {
            const slot = document.getElementById(`shelfSlot-${idx}`);
            if (slot) {
              slot.className = 'shelf-slot filled';
              slot.textContent = `#${p.seq} ✓`;
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
        updateEnvelopeInspector(0);
        break;
    }
  }

  function handleWebStoryline(step) {
    const targetNode = document.getElementById(state.serverNodeId);
    const targetLink = document.getElementById(state.serverLinkId);

    switch (step) {
      case 0:
        storyPhasePill.textContent = 'Phase 0 • URL Entered';
        storyHeadline.textContent = `Ready to Request Web Page: ${state.domainName}`;
        storyCaption.innerHTML = `You typed <code>${state.domainName}</code> into your browser. Computers cannot navigate by words! Watch the 2-phase process: <strong>Phase 1: DNS Resolution</strong> to find the numeric IP, followed by <strong>Phase 2: HTTP GET Request &amp; Response Packet Slicing</strong>.`;
        updateEnvelopeInspector(-1);
        break;

      case 1:
        storyPhasePill.textContent = 'Hop 1 • DNS Query Beamed';
        storyHeadline.textContent = `Step 1: DNS Query Beamed from Phone to Cell Mast (UDP)`;
        storyCaption.innerHTML = `Your browser creates a lightweight <strong>UDP</strong> packet addressed to <strong>DNS Resolver (8.8.8.8)</strong> asking: <em>"What is the IP address for ${state.domainName}?"</em> Why UDP? Because DNS queries are tiny and require low latency without connection handshake overhead.`;
        document.getElementById('nodeSender').classList.add('active-node');
        document.getElementById('linkPhoneMast').classList.add('active-wire');
        document.getElementById('nodeMast').classList.add('active-node');
        updateEnvelopeInspector(-1);
        break;

      case 2:
        storyPhasePill.textContent = 'Hop 2 • Underground Optical Fibre';
        storyHeadline.textContent = 'Step 2: DNS Query Travels Down Fibre to ISP Gateway';
        storyCaption.innerHTML = `The cell mast converts the wireless radio waves into pulses of laser light inside underground <strong>fibre-optic cables</strong> and forwards the query packet to the ISP Gateway Router (<code>81.2.14.1</code>).`;
        document.getElementById('nodeMast').classList.add('active-node');
        document.getElementById('linkMastIsp').classList.add('active-wire');
        document.getElementById('nodeIsp').classList.add('active-node');
        updateEnvelopeInspector(-1);
        break;

      case 3:
        showCallout(calloutDnsCard, calloutDnsText, calloutDnsRect, `DNS Match: ${state.domainName} ➔ ${state.resolvedIp} (${state.serverLoc})`);
        storyPhasePill.textContent = 'Hop 3 • DNS Directory Match';
        storyHeadline.textContent = `Step 3: DNS Server (8.8.8.8) Resolves Domain to ${state.resolvedIp}`;
        storyCaption.innerHTML = `The <strong>DNS Resolver (8.8.8.8)</strong> looks up its worldwide directory. It finds that <code>${state.domainName}</code> maps to IP <code>${state.resolvedIp}</code> (${state.serverLabel} in ${state.serverLoc}). The DNS server sends this IP reply back so your browser can address the web server directly!`;
        document.getElementById('nodeIsp').classList.add('active-node');
        document.getElementById('linkIspDns').classList.add('active-wire');
        document.getElementById('nodeDns').classList.add('active-node');
        updateEnvelopeInspector(-1);
        break;

      case 4:
        storyPhasePill.textContent = 'Hop 4 • HTTP GET Request';
        showCallout(calloutMeshCard, calloutMeshText, calloutMeshRect, `HTTP GET / (${state.domainName}) routed to ${state.resolvedIp}`);
        storyHeadline.textContent = `Step 4: HTTP GET Request Routed to ${state.serverLabel}`;
        storyCaption.innerHTML = `Armed with destination IP <code>${state.resolvedIp}</code>, your browser sends an <strong>HTTP GET /</strong> packet via <strong>TCP (HTTPS Port 443)</strong>. Routers Alpha and Beta read the destination IP header and forward the request to the <strong>${state.serverLabel}</strong>!`;
        document.getElementById('nodeIsp').classList.add('active-node');
        document.getElementById('linkIspAlpha').classList.add('active-wire');
        document.getElementById('nodeAlpha').classList.add('active-node');
        document.getElementById('linkAlphaGamma').classList.add('active-wire');
        document.getElementById('nodeGamma').classList.add('active-node');
        if (targetLink) targetLink.classList.add('active-wire');
        if (targetNode) {
          targetNode.classList.remove('standby-server');
          targetNode.classList.add('active-node');
        }
        updateEnvelopeInspector(-2);
        break;

      case 5:
        showCallout(calloutMeshCard, calloutMeshText, calloutMeshRect, `${state.serverLabel} slices HTML into 3 response packets`);
        storyPhasePill.textContent = 'Hop 5 • Server Slices HTML Response';
        storyHeadline.textContent = `Step 5: ${state.serverLabel} Slices Webpage into 3 Packets`;
        storyCaption.innerHTML = `<strong>The Server Sends the Site Back in Chunks:</strong> The web page is too large for one packet! The ${state.serverLabel}\'s TCP layer slices the HTML into <strong>3 numbered response packets</strong> (#1 Header, #2 Article Body, #3 CSS/Footer). They travel back independently across Paths A and B!`;
        document.getElementById('nodeGamma').classList.add('active-node');
        document.getElementById('linkIspAlpha').classList.add('active-wire');
        document.getElementById('linkIspBeta').classList.add('active-wire');
        document.getElementById('nodeAlpha').classList.add('active-node');
        document.getElementById('nodeBeta').classList.add('active-node');
        if (targetNode) {
          targetNode.classList.remove('standby-server');
          targetNode.classList.add('active-node');
        }
        updateEnvelopeInspector(1);
        break;

      case 6:
        showCallout(calloutReassemblyCard, calloutReassemblyText, calloutReassemblyRect, `${state.domainName} Loaded (200 OK) ✓`);
        storyPhasePill.textContent = 'Hop 6 • TCP Reassembly & Render';
        storyHeadline.textContent = `Step 6: Packets Reassembled & Webpage Rendered!`;
        storyCaption.innerHTML = `The 3 response packets arrived back at your phone. Even though Packet #2 took the longer Path B, your browser\'s TCP layer used the <strong>Sequence Numbers (#1, #2, #3)</strong> to reassemble the HTML perfectly, verified CRC checksums, and displayed the live webpage!`;
        document.getElementById('nodeSender').classList.add('active-node');

        if (destWebView) destWebView.style.display = 'block';
        if (destChatBubble) destChatBubble.style.display = 'none';

        shelfStatusPill.textContent = 'Loaded 200 OK ✓';
        shelfStatusPill.className = 'shelf-status-pill';

        state.packets.forEach((p, idx) => {
          const slot = document.getElementById(`shelfSlot-${idx}`);
          if (slot) {
            slot.className = 'shelf-slot filled';
            slot.textContent = `#${p.seq} ✓`;
          }
        });
        updateEnvelopeInspector(0);
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

  // Scrubber Track interaction
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
        ? `WhatsApp Relay IP: 157.240.22.60`
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

  // Prominent Mode Tabs (Web & DNS vs WhatsApp Cloud Relay)
  tabModeWeb.addEventListener('click', () => {
    tabModeWeb.classList.add('active');
    tabModeChat.classList.remove('active');
    state.scenario = 'web';
    senderAppLabel.textContent = 'Browser';
    senderChatView.style.display = 'none';
    senderWebView.style.display = 'block';
    stopPlay();
    state.currentStep = 0;
    preparePackets();
  });

  tabModeChat.addEventListener('click', () => {
    tabModeChat.classList.add('active');
    tabModeWeb.classList.remove('active');
    state.scenario = 'chat';
    senderAppLabel.textContent = 'Chat';
    senderChatView.style.display = 'block';
    senderWebView.style.display = 'none';
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

  // =========================================================================
  // INTERACTIVE GCSE TOOLTIPS SYSTEM
  // =========================================================================
  function initTooltips() {
    const tooltipEl = document.getElementById('networkTooltip');
    if (!tooltipEl) return;

    function showTooltip(key, evt) {
      const data = TOOLTIP_DATA[key];
      if (!data) return;

      tooltipEl.innerHTML = `
        <div class="tooltip-header">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          ${data.title}
        </div>
        <div class="tooltip-body">${data.body}</div>
        ${data.spec ? `<div class="tooltip-spec-tag">${data.spec}</div>` : ''}
      `;
      tooltipEl.style.display = 'block';
      positionTooltip(evt);
      tooltipEl.classList.add('visible');
    }

    function hideTooltip() {
      tooltipEl.classList.remove('visible');
      tooltipEl.style.display = 'none';
    }

    function positionTooltip(evt) {
      const pad = 16;
      const tWidth = tooltipEl.offsetWidth || 300;
      const tHeight = tooltipEl.offsetHeight || 120;

      let clientX = evt.clientX;
      let clientY = evt.clientY;

      if (!clientX && evt.target) {
        const b = evt.target.getBoundingClientRect();
        clientX = b.left + b.width / 2;
        clientY = b.top;
      }

      let x = (clientX || 100) + 15;
      let y = (clientY || 100) + 15;

      if (x + tWidth > window.innerWidth - pad) {
        x = window.innerWidth - tWidth - pad;
      }
      if (y + tHeight > window.innerHeight - pad) {
        y = (clientY || 100) - tHeight - 15;
      }

      tooltipEl.style.left = `${Math.max(pad, x)}px`;
      tooltipEl.style.top = `${Math.max(pad, y)}px`;
    }

    document.querySelectorAll('[data-tooltip-key]').forEach(el => {
      const key = el.getAttribute('data-tooltip-key');
      el.addEventListener('mouseenter', (e) => showTooltip(key, e));
      el.addEventListener('mousemove', (e) => positionTooltip(e));
      el.addEventListener('mouseleave', hideTooltip);
      el.addEventListener('click', (e) => {
        if (tooltipEl.classList.contains('visible') && tooltipEl.getAttribute('data-current-key') === key) {
          hideTooltip();
        } else {
          showTooltip(key, e);
          tooltipEl.setAttribute('data-current-key', key);
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('[data-tooltip-key]')) {
        hideTooltip();
      }
    });
  }

  // Initial Journey Setup
  initTooltips();
  preparePackets();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'chat') {
    tabModeChat.click();
  }


  // =========================================================================
  // 4. TAB 2: TOPOLOGIES PLAYGROUND & NETWORK BUILDER (STAR, BUS, MESH, CUSTOM)
  // =========================================================================
  const topoPills = document.querySelectorAll('#topoPills .topo-pill');
  const topoSvg = document.getElementById('topoSvg');
  const topoCanvasContainer = document.getElementById('topoCanvasContainer');
  const topoCurrentTitle = document.getElementById('topoCurrentTitle');
  const topoHealthBadge = document.getElementById('topoHealthBadge');
  const topoHudHint = document.getElementById('topoHudHint');
  const topoFeedback = document.getElementById('topoFeedback');
  const topoFeedbackIcon = document.getElementById('topoFeedbackIcon');
  const topoFeedbackText = document.getElementById('topoFeedbackText');
  const topoPingBtn = document.getElementById('topoPingBtn');
  const topoRepairBtn = document.getElementById('topoRepairBtn');
  const topoPresetButtons = document.getElementById('topoPresetButtons');
  const topoToolButtons = document.querySelectorAll('#topoToolButtons .topo-tool-btn');
  const topoSrcNode = document.getElementById('topoSrcNode');
  const topoDstNode = document.getElementById('topoDstNode');

  // Diagnostics and exam facts
  const topoClassifiedTag = document.getElementById('topoClassifiedTag');
  const metricNodes = document.getElementById('metricNodes');
  const metricCables = document.getElementById('metricCables');
  const metricCost = document.getElementById('metricCost');
  const metricSpof = document.getElementById('metricSpof');
  const metricCollisions = document.getElementById('metricCollisions');
  const metricPaths = document.getElementById('metricPaths');
  const factCardTitle = document.getElementById('factCardTitle');
  const factCardBody = document.getElementById('factCardBody');
  const factExamTip = document.getElementById('factExamTip');
  const factTabBtns = document.querySelectorAll('#factQuickTabs .fact-tab-btn');

  // Graph state
  let currentTopo = 'star';
  let activeTool = null;
  let cableStartNode = null;
  let isTopoAnimating = false;
  let nextNodeId = 10;

  // Graph data structures
  let topoNodes = [];
  let topoLinks = [];

  // Special hardware fault states
  let isTerminatorBroken = false;

  const topoDefinitions = {
    star: {
      title: "Star Topology (Central Switch Architecture)",
      cost: "Moderate • O(N) dedicated cables",
      spof: "Central Switch (Single Point of Failure)",
      collisions: "Zero (Dedicated switch ports)",
      paths: "1 per workstation (Direct to switch)",
      tag: "Star Topology",
      factTitle: "Star Topology in GCSE Computer Science",
      factBody: `<p>In a star network, every endpoint (workstation, server, printer) connects directly to a central network switch via its own dedicated cable.</p>
      <ul>
        <li><strong>Key Advantage:</strong> Highly reliable. If any individual workstation cable snaps, only that single computer loses connection. The rest of the network operates normally.</li>
        <li><strong>Easy Scalability:</strong> New computers can be plugged into the central switch at any time without taking down or disrupting the rest of the network.</li>
        <li><strong>Zero Packet Collisions:</strong> The switch reads MAC addresses and routes frames directly to destination ports, giving full wire bandwidth to each device.</li>
        <li><strong>Major Disadvantage (SPOF):</strong> The central switch is a <strong>Single Point of Failure (SPOF)</strong>. If the switch hardware or power fails, the entire network immediately collapses!</li>
        <li><strong>Cable Cost:</strong> Requires high amount of cabling (one long cable per machine running back to the central rack).</li>
      </ul>`,
      examTip: `<strong>AQA Exam Tip:</strong> Exam questions frequently ask why a school or business would choose a Star topology over a Bus topology. State at least two reasons: <em>no packet collisions</em> (dedicated bandwidth via switch), <em>easier fault finding</em>, and <em>cable failure only affects one computer</em>!`
    },
    bus: {
      title: "Bus Topology (Shared Backbone Cable & Terminators)",
      cost: "Very Low • 1 shared trunk cable",
      spof: "Backbone Cable & Terminators (SPOF)",
      collisions: "High (Single shared collision domain)",
      paths: "1 shared broadcast path",
      tag: "Bus Topology",
      factTitle: "Bus Topology in GCSE Computer Science",
      factBody: `<p>All devices connect directly to a single shared central cable called the <strong>Backbone</strong>. A <strong>Terminator</strong> is installed at each physical end of the backbone.</p>
      <ul>
        <li><strong>Role of Terminators:</strong> When electrical data signals reach the end of the wire, terminators absorb the electrical energy. Without terminators, signals <strong>reflect (bounce)</strong> back along the wire, causing data corruption and collisions!</li>
        <li><strong>Key Advantage:</strong> Extremely cheap and simple to install. Uses the minimum possible amount of cabling and requires no costly switches.</li>
        <li><strong>Catastrophic Disadvantage:</strong> If the central backbone breaks anywhere, or a terminator is detached, signals reflect off the break and <strong>the entire network crashes</strong>!</li>
        <li><strong>Severe Collisions &amp; Slowdown:</strong> Because all machines share one cable, only one device can transmit at a time. As more machines join, packet collisions multiply exponentially.</li>
        <li><strong>Low Security:</strong> All data packets pass every workstation's drop cable, allowing any device to eavesdrop.</li>
      </ul>`,
      examTip: `<strong>AQA Exam Tip:</strong> Memorise the purpose of <strong>Terminators</strong>: they absorb electrical signals at the ends of the backbone to prevent <strong>signal reflection (bounce)</strong> and packet collisions!`
    },
    mesh: {
      title: "Mesh Topology (Fault-Tolerant Redundant Paths)",
      cost: "Very High • O(N²) complex cabling",
      spof: "None (Self-healing dynamic redundancy)",
      collisions: "Zero (Dynamic point-to-point links)",
      paths: "Multiple redundant paths per node",
      tag: "Mesh Topology",
      factTitle: "Mesh Topology in GCSE Computer Science",
      factBody: `<p>In a mesh network, nodes are interconnected with multiple redundant physical or wireless links. There is no central switch or shared single trunk.</p>
      <ul>
        <li><strong>Full Mesh vs Partial Mesh:</strong> In a <em>Full Mesh</em>, every single node connects to every other node (requires \(N(N-1)/2\) cables). In a <em>Partial Mesh</em>, nodes have multiple connections to neighbouring nodes, but not necessarily to all nodes.</li>
        <li><strong>Supreme Fault Tolerance:</strong> <strong>No Single Point of Failure!</strong> If any wire breaks or a node crashes, routing algorithms dynamically reroute data packets along alternate paths with zero downtime.</li>
        <li><strong>High Privacy &amp; Performance:</strong> Dedicated point-to-point connections guarantee high bandwidth and prevent eavesdropping.</li>
        <li><strong>Major Disadvantage:</strong> Enormous cabling cost, complex installation, and expensive network hardware with multiple ports.</li>
        <li><strong>Real-World Use:</strong> The global Internet backbone, military mission-critical networks, and modern wireless mesh home Wi-Fi pods.</li>
      </ul>`,
      examTip: `<strong>AQA Exam Tip:</strong> Be ready to explain the difference between <em>Full Mesh</em> (impractical for large wired LANs due to cost) and <em>Partial Mesh</em> (far more realistic, providing redundancy at manageable cost).`
    },
    custom: {
      title: "Custom Network Workbench",
      cost: "Custom Architecture",
      spof: "Depends on design",
      collisions: "Switched / Point-to-point",
      paths: "Configured by user",
      tag: "Custom Builder",
      factTitle: "Designing Resilient Networks",
      factBody: `<p>You are designing your own network topology! Network engineers balance three critical GCSE trade-offs when designing architectures:</p>
      <ul>
        <li><strong>Resilience vs Cost:</strong> Adding backup cables prevents outages (like Mesh), but increases installation expense and complexity.</li>
        <li><strong>Scalability:</strong> Using switches (Star) makes adding new workstations easy, but leaves the switch as a central Single Point of Failure.</li>
        <li><strong>Bandwidth &amp; Security:</strong> Point-to-point and switched links prevent collisions and stop unauthorized packet eavesdropping.</li>
      </ul>`,
      examTip: `<strong>AQA Exam Tip:</strong> In design scenario questions (e.g., designing a network for a hospital vs a small shop), identify whether reliability (Mesh), budget (Bus), or standard ease-of-use (Star) is the top priority.`
    }
  };

  // -------------------------------------------------------------------------
  // Preset Builders
  // -------------------------------------------------------------------------
  function loadStarPreset() {
    currentTopo = 'star';
    isTerminatorBroken = false;
    topoNodes = [
      { id: 'sw1', label: 'Central Switch', type: 'switch', x: 490, y: 230, isBroken: false },
      { id: 'pc1', label: 'PC 1', type: 'pc', x: 230, y: 130, ip: '192.168.1.11', isBroken: false },
      { id: 'pc2', label: 'PC 2', type: 'pc', x: 750, y: 130, ip: '192.168.1.12', isBroken: false },
      { id: 'pc3', label: 'PC 3', type: 'pc', x: 750, y: 350, ip: '192.168.1.13', isBroken: false },
      { id: 'pc4', label: 'PC 4', type: 'pc', x: 230, y: 350, ip: '192.168.1.14', isBroken: false },
      { id: 'srv1', label: 'School Server', type: 'server', x: 490, y: 80, ip: '192.168.1.200', isBroken: false }
    ];

    topoLinks = [
      { id: 'link-sw-pc1', from: 'sw1', to: 'pc1', isCut: false },
      { id: 'link-sw-pc2', from: 'sw1', to: 'pc2', isCut: false },
      { id: 'link-sw-pc3', from: 'sw1', to: 'pc3', isCut: false },
      { id: 'link-sw-pc4', from: 'sw1', to: 'pc4', isCut: false },
      { id: 'link-sw-srv1', from: 'sw1', to: 'srv1', isCut: false }
    ];
    renderWorkbench();
    selectNodeDropdowns('pc1', 'pc4');
  }

  function loadBusPreset() {
    currentTopo = 'bus';
    isTerminatorBroken = false;
    topoNodes = [
      { id: 'termA', label: 'Terminator A', type: 'terminator', x: 140, y: 235, isBroken: false },
      { id: 'termB', label: 'Terminator B', type: 'terminator', x: 840, y: 235, isBroken: false },
      { id: 'tap1', label: 'Tap 1', type: 'tap', x: 250, y: 235 },
      { id: 'tap2', label: 'Tap 2', type: 'tap', x: 410, y: 235 },
      { id: 'tap3', label: 'Tap 3', type: 'tap', x: 570, y: 235 },
      { id: 'tap4', label: 'Tap 4', type: 'tap', x: 730, y: 235 },
      { id: 'pc1', label: 'PC 1', type: 'pc', x: 250, y: 120, ip: '192.168.1.11', isBroken: false },
      { id: 'pc2', label: 'PC 2', type: 'pc', x: 410, y: 350, ip: '192.168.1.12', isBroken: false },
      { id: 'pc3', label: 'PC 3', type: 'pc', x: 570, y: 120, ip: '192.168.1.13', isBroken: false },
      { id: 'pc4', label: 'PC 4', type: 'pc', x: 730, y: 350, ip: '192.168.1.14', isBroken: false }
    ];

    topoLinks = [
      { id: 'link-bb-left', from: 'termA', to: 'tap1', isCut: false, isBackbone: true },
      { id: 'link-bb-mid1', from: 'tap1', to: 'tap2', isCut: false, isBackbone: true },
      { id: 'link-bb-mid2', from: 'tap2', to: 'tap3', isCut: false, isBackbone: true },
      { id: 'link-bb-mid3', from: 'tap3', to: 'tap4', isCut: false, isBackbone: true },
      { id: 'link-bb-right', from: 'tap4', to: 'termB', isCut: false, isBackbone: true },
      { id: 'link-drop-pc1', from: 'tap1', to: 'pc1', isCut: false, isDrop: true },
      { id: 'link-drop-pc2', from: 'tap2', to: 'pc2', isCut: false, isDrop: true },
      { id: 'link-drop-pc3', from: 'tap3', to: 'pc3', isCut: false, isDrop: true },
      { id: 'link-drop-pc4', from: 'tap4', to: 'pc4', isCut: false, isDrop: true }
    ];
    renderWorkbench();
    selectNodeDropdowns('pc1', 'pc4');
  }

  function loadMeshPreset() {
    currentTopo = 'mesh';
    isTerminatorBroken = false;
    topoNodes = [
      { id: 'pc1', label: 'PC 1', type: 'pc', x: 240, y: 130, ip: '10.0.0.1', isBroken: false },
      { id: 'pc2', label: 'PC 2', type: 'pc', x: 740, y: 130, ip: '10.0.0.2', isBroken: false },
      { id: 'pc3', label: 'PC 3', type: 'pc', x: 740, y: 340, ip: '10.0.0.3', isBroken: false },
      { id: 'pc4', label: 'PC 4', type: 'pc', x: 240, y: 340, ip: '10.0.0.4', isBroken: false },
      { id: 'pc5', label: 'Relay Router 5', type: 'router', x: 490, y: 235, ip: '10.0.0.5', isBroken: false }
    ];

    topoLinks = [
      { id: 'link-pc1-pc2', from: 'pc1', to: 'pc2', isCut: false },
      { id: 'link-pc2-pc3', from: 'pc2', to: 'pc3', isCut: false },
      { id: 'link-pc3-pc4', from: 'pc3', to: 'pc4', isCut: false },
      { id: 'link-pc4-pc1', from: 'pc4', to: 'pc1', isCut: false },
      { id: 'link-pc1-pc5', from: 'pc1', to: 'pc5', isCut: false },
      { id: 'link-pc2-pc5', from: 'pc2', to: 'pc5', isCut: false },
      { id: 'link-pc3-pc5', from: 'pc3', to: 'pc5', isCut: false },
      { id: 'link-pc4-pc5', from: 'pc4', to: 'pc5', isCut: false }
    ];
    renderWorkbench();
    selectNodeDropdowns('pc1', 'pc4');
  }

  function loadCustomPreset() {
    currentTopo = 'custom';
    isTerminatorBroken = false;
    topoNodes = [
      { id: 'pc1', label: 'Workstation 1', type: 'pc', x: 240, y: 235, ip: '192.168.1.10', isBroken: false },
      { id: 'sw1', label: 'Central Switch', type: 'switch', x: 490, y: 235, isBroken: false },
      { id: 'pc2', label: 'Workstation 2', type: 'pc', x: 740, y: 235, ip: '192.168.1.11', isBroken: false }
    ];
    topoLinks = [
      { id: 'link-pc1-sw1', from: 'pc1', to: 'sw1', isCut: false },
      { id: 'link-pc2-sw1', from: 'pc2', to: 'sw1', isCut: false }
    ];
    renderWorkbench();
    selectNodeDropdowns('pc1', 'pc2');
  }

  function selectNodeDropdowns(srcId, dstId) {
    updateNodeDropdowns();
    if (srcId && topoSrcNode) topoSrcNode.value = srcId;
    if (dstId && topoDstNode) topoDstNode.value = dstId;
  }

  function updateNodeDropdowns() {
    if (!topoSrcNode || !topoDstNode) return;
    const curSrc = topoSrcNode.value;
    const curDst = topoDstNode.value;

    const endpoints = topoNodes.filter(n => n.type === 'pc' || n.type === 'server' || n.type === 'router');

    topoSrcNode.innerHTML = '';
    topoDstNode.innerHTML = '';

    endpoints.forEach(n => {
      const opt1 = document.createElement('option');
      opt1.value = n.id;
      opt1.textContent = n.label;
      topoSrcNode.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = n.id;
      opt2.textContent = n.label;
      topoDstNode.appendChild(opt2);
    });

    if (endpoints.some(n => n.id === curSrc)) {
      topoSrcNode.value = curSrc;
    } else if (endpoints[0]) {
      topoSrcNode.value = endpoints[0].id;
    }

    if (endpoints.some(n => n.id === curDst)) {
      topoDstNode.value = curDst;
    } else if (endpoints[1]) {
      topoDstNode.value = endpoints[1].id;
    } else if (endpoints[0]) {
      topoDstNode.value = endpoints[0].id;
    }
  }

  // -------------------------------------------------------------------------
  // Scenarios Bar
  // -------------------------------------------------------------------------
  function updateTopoScenarios() {
    if (!topoPresetButtons) return;
    topoPresetButtons.innerHTML = '';

    let scenarios = [];
    if (currentTopo === 'star') {
      scenarios = [
        { label: 'Normal Operation', fn: () => { topoLinks.forEach(l => l.isCut = false); const sw = topoNodes.find(n => n.id === 'sw1'); if (sw) sw.isBroken = false; renderWorkbench(); } },
        { label: 'Cut PC 1 Cable', fn: () => { topoLinks.forEach(l => l.isCut = false); const l = topoLinks.find(x => x.from === 'sw1' && x.to === 'pc1'); if (l) l.isCut = true; renderWorkbench(); } },
        { label: 'Cut PC 4 Cable', fn: () => { topoLinks.forEach(l => l.isCut = false); const l = topoLinks.find(x => x.from === 'sw1' && x.to === 'pc4'); if (l) l.isCut = true; renderWorkbench(); } },
        { label: 'Crash Central Switch (SPOF)', fn: () => { const sw = topoNodes.find(n => n.id === 'sw1'); if (sw) sw.isBroken = true; renderWorkbench(); } }
      ];
    } else if (currentTopo === 'bus') {
      scenarios = [
        { label: 'Normal Operation', fn: () => { topoLinks.forEach(l => l.isCut = false); isTerminatorBroken = false; renderWorkbench(); } },
        { label: 'Cut Drop Cable (PC 1)', fn: () => { topoLinks.forEach(l => l.isCut = false); isTerminatorBroken = false; const l = topoLinks.find(x => x.id === 'link-drop-pc1'); if (l) l.isCut = true; renderWorkbench(); } },
        { label: 'Sever Backbone Cable', fn: () => { topoLinks.forEach(l => l.isCut = false); isTerminatorBroken = false; const l = topoLinks.find(x => x.id === 'link-bb-mid2'); if (l) l.isCut = true; renderWorkbench(); } },
        { label: 'Remove Terminator B (Bounce)', fn: () => { topoLinks.forEach(l => l.isCut = false); isTerminatorBroken = true; renderWorkbench(); } }
      ];
    } else if (currentTopo === 'mesh') {
      scenarios = [
        { label: 'Normal Operation', fn: () => { topoLinks.forEach(l => l.isCut = false); renderWorkbench(); } },
        { label: 'Cut Direct Wire (PC 1 ➔ PC 4)', fn: () => { topoLinks.forEach(l => l.isCut = false); const l = topoLinks.find(x => x.id === 'link-pc4-pc1'); if (l) l.isCut = true; renderWorkbench(); } },
        { label: 'Cut Alternate Wire (PC 1 ➔ Relay)', fn: () => { topoLinks.forEach(l => l.isCut = false); const l = topoLinks.find(x => x.id === 'link-pc1-pc5'); if (l) l.isCut = true; renderWorkbench(); } },
        { label: 'Isolate PC 4 Completely', fn: () => { topoLinks.forEach(x => { if (x.from === 'pc4' || x.to === 'pc4') x.isCut = true; }); renderWorkbench(); } }
      ];
    } else {
      scenarios = [
        { label: 'Repair All Wires', fn: () => { topoLinks.forEach(l => l.isCut = false); topoNodes.forEach(n => n.isBroken = false); renderWorkbench(); } },
        { label: 'Cut First Cable', fn: () => { if (topoLinks[0]) topoLinks[0].isCut = true; renderWorkbench(); } }
      ];
    }

    scenarios.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'topo-preset-btn';
      btn.textContent = s.label;
      btn.addEventListener('click', s.fn);
      topoPresetButtons.appendChild(btn);
    });
  }

  // -------------------------------------------------------------------------
  // Main Render Workbench
  // -------------------------------------------------------------------------
  function renderTopology() {
    renderWorkbench();
  }

  function renderWorkbench() {
    topoSvg.innerHTML = '';

    // Defs & Background Pattern
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <pattern id="topoGridPattern" width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="14" cy="14" r="1.2" fill="rgba(255, 255, 255, 0.1)"></circle>
      </pattern>
      <filter id="topoGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3.5" result="blur"></feGaussianBlur>
        <feMerge>
          <feMergeNode in="blur"></feMergeNode>
          <feMergeNode in="SourceGraphic"></feMergeNode>
        </feMerge>
      </filter>
    `;
    topoSvg.appendChild(defs);

    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', 'url(#topoGridPattern)');
    bgRect.setAttribute('pointer-events', 'none');
    topoSvg.appendChild(bgRect);

    // Groups for layers
    const linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    linksGroup.id = 'topoLinksLayer';
    const packetsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    packetsGroup.id = 'topoPacketsLayer';
    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodesGroup.id = 'topoNodesLayer';
    const overlaysGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    overlaysGroup.id = 'topoOverlaysLayer';

    topoSvg.appendChild(linksGroup);
    topoSvg.appendChild(packetsGroup);
    topoSvg.appendChild(nodesGroup);
    topoSvg.appendChild(overlaysGroup);

    // Draw Links
    topoLinks.forEach(link => {
      const fromNode = topoNodes.find(n => n.id === link.from);
      const toNode = topoNodes.find(n => n.id === link.to);
      if (!fromNode || !toNode) return;
      drawCableLink(linksGroup, link, fromNode, toNode);
    });

    // Draw Nodes
    topoNodes.forEach(node => {
      drawWorkbenchNode(nodesGroup, node);
    });

    updateMetricsAndFacts();
    updateTopoScenarios();
    updateNodeDropdowns();
    checkNetworkHealth();
  }

  // -------------------------------------------------------------------------
  // Draw Interactive Cable Link
  // -------------------------------------------------------------------------
  function drawCableLink(g, link, fromNode, toNode) {
    const lg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    lg.setAttribute('class', 'topo-cable-item');

    const strokeWidth = link.isBackbone ? 6 : (link.isDrop ? 3 : 3.5);
    const x1 = fromNode.x;
    const y1 = fromNode.y;
    const x2 = toNode.x;
    const y2 = toNode.y;

    if (link.isCut) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', x1); line1.setAttribute('y1', y1);
      line1.setAttribute('x2', x1 + (midX - x1) * 0.7); line1.setAttribute('y2', y1 + (midY - y1) * 0.7);
      line1.setAttribute('stroke', '#ef4444');
      line1.setAttribute('stroke-width', strokeWidth);
      line1.setAttribute('class', 'topo-cable-severed');

      const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', x2); line2.setAttribute('y1', y2);
      line2.setAttribute('x2', x2 + (midX - x2) * 0.7); line2.setAttribute('y2', y2 + (midY - y2) * 0.7);
      line2.setAttribute('stroke', '#ef4444');
      line2.setAttribute('stroke-width', strokeWidth);
      line2.setAttribute('class', 'topo-cable-severed');

      // Severed Badge
      const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      badge.setAttribute('transform', `translate(${midX}, ${midY})`);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '-28'); rect.setAttribute('y', '-10');
      rect.setAttribute('width', '56'); rect.setAttribute('height', '20');
      rect.setAttribute('class', 'severed-badge-rect');
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('class', 'severed-badge-text');
      txt.setAttribute('y', '1');
      txt.textContent = '⚡ SEVERED';
      badge.appendChild(rect);
      badge.appendChild(txt);

      lg.appendChild(line1);
      lg.appendChild(line2);
      lg.appendChild(badge);
    } else {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      line.setAttribute('stroke', link.isBackbone ? '#cbd5e1' : '#475569');
      line.setAttribute('stroke-width', strokeWidth);
      line.setAttribute('class', 'topo-cable-line healthy');
      lg.appendChild(line);
    }

    // Wide transparent hitbox for easy clicking/cutting/deleting
    const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hitbox.setAttribute('x1', x1); hitbox.setAttribute('y1', y1);
    hitbox.setAttribute('x2', x2); hitbox.setAttribute('y2', y2);
    hitbox.setAttribute('stroke', 'transparent');
    hitbox.setAttribute('stroke-width', '28');
    hitbox.setAttribute('style', 'cursor: pointer;');
    hitbox.setAttribute('title', activeTool === 'delete' ? 'Click to delete this cable' : (link.isCut ? 'Click to reconnect severed cable' : 'Click to snip / sever cable'));

    hitbox.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeTool === 'delete') {
        const fromLabel = fromNode ? fromNode.label : link.from;
        const toLabel = toNode ? toNode.label : link.to;
        topoLinks = topoLinks.filter(l => l.id !== link.id);
        topoFeedbackText.innerHTML = `Deleted cable between <strong>${fromLabel}</strong> and <strong>${toLabel}</strong>.`;
        renderWorkbench();
        return;
      }

      link.isCut = !link.isCut;
      if (link.isCut) {
        topoFeedbackText.innerHTML = `Cable severed between <strong>${fromNode.label}</strong> and <strong>${toNode.label}</strong>. Test packet transmission to observe fault handling!`;
      } else {
        topoFeedbackText.innerHTML = `Cable reconnected and functional.`;
      }
      renderWorkbench();
    });

    lg.appendChild(hitbox);
    g.appendChild(lg);
  }

  // -------------------------------------------------------------------------
  // Draw Interactive Node
  // -------------------------------------------------------------------------
  function drawWorkbenchNode(g, node) {
    if (node.type === 'tap') {
      // Tap dot on bus backbone
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', node.x); dot.setAttribute('cy', node.y);
      dot.setAttribute('r', '6');
      dot.setAttribute('fill', '#60a5fa');
      dot.setAttribute('stroke', '#1e293b');
      dot.setAttribute('stroke-width', '2');
      g.appendChild(dot);
      return;
    }

    const grp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    grp.setAttribute('class', `topo-node-g node-${node.type} ${node.isBroken ? 'broken' : ''} ${cableStartNode && cableStartNode.id === node.id ? 'cable-selected' : ''}`);
    grp.setAttribute('transform', `translate(${node.x}, ${node.y})`);
    grp.setAttribute('data-id', node.id);

    // Halo circle
    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    halo.setAttribute('r', node.type === 'switch' ? '34' : '28');
    halo.setAttribute('class', 'node-halo-circle');
    halo.setAttribute('fill', node.isBroken ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.7)');
    halo.setAttribute('stroke', node.isBroken ? '#ef4444' : (node.type === 'switch' ? '#3b82f6' : (node.type === 'server' ? '#8b5cf6' : '#64748b')));
    halo.setAttribute('stroke-width', '2');
    grp.appendChild(halo);

    // Visual Icon representation based on device type
    if (node.type === 'pc') {
      // Monitor Screen
      const screen = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      screen.setAttribute('x', '-14'); screen.setAttribute('y', '-13');
      screen.setAttribute('width', '28'); screen.setAttribute('height', '19');
      screen.setAttribute('rx', '3');
      screen.setAttribute('fill', node.isBroken ? '#7f1d1d' : '#1e293b');
      screen.setAttribute('stroke', node.isBroken ? '#ef4444' : '#94a3b8');
      screen.setAttribute('stroke-width', '1.8');
      
      const stand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      stand.setAttribute('x1', '0'); stand.setAttribute('y1', '6');
      stand.setAttribute('x2', '0'); stand.setAttribute('y2', '12');
      stand.setAttribute('stroke', '#94a3b8');
      stand.setAttribute('stroke-width', '2.5');

      const base = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      base.setAttribute('x1', '-8'); base.setAttribute('y1', '12');
      base.setAttribute('x2', '8'); base.setAttribute('y2', '12');
      base.setAttribute('stroke', '#94a3b8');
      base.setAttribute('stroke-width', '2');

      grp.appendChild(screen);
      grp.appendChild(stand);
      grp.appendChild(base);

    } else if (node.type === 'switch') {
      // Rack Switch box with ports
      const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      box.setAttribute('x', '-22'); box.setAttribute('y', '-14');
      box.setAttribute('width', '44'); box.setAttribute('height', '28');
      box.setAttribute('rx', '4');
      box.setAttribute('fill', node.isBroken ? '#7f1d1d' : '#0f172a');
      box.setAttribute('stroke', node.isBroken ? '#ef4444' : '#3b82f6');
      box.setAttribute('stroke-width', '2');

      // Port indicator LEDs
      for (let i = -14; i <= 14; i += 7) {
        const port = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        port.setAttribute('cx', i);
        port.setAttribute('cy', '0');
        port.setAttribute('r', '2');
        port.setAttribute('fill', node.isBroken ? '#ef4444' : '#10b981');
        grp.appendChild(port);
      }
      grp.appendChild(box);

    } else if (node.type === 'server') {
      // Server Tower / Stack
      const stack = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      stack.setAttribute('x', '-15'); stack.setAttribute('y', '-17');
      stack.setAttribute('width', '30'); stack.setAttribute('height', '34');
      stack.setAttribute('rx', '3');
      stack.setAttribute('fill', node.isBroken ? '#7f1d1d' : '#1e1b4b');
      stack.setAttribute('stroke', node.isBroken ? '#ef4444' : '#a855f7');
      stack.setAttribute('stroke-width', '2');

      // Drive slots
      [-10, -2, 6].forEach(slotY => {
        const slot = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        slot.setAttribute('x1', '-10'); slot.setAttribute('y1', slotY);
        slot.setAttribute('x2', '4'); slot.setAttribute('y2', slotY);
        slot.setAttribute('stroke', '#cbd5e1'); slot.setAttribute('stroke-width', '1.5');
        const led = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        led.setAttribute('cx', '9'); led.setAttribute('cy', slotY);
        led.setAttribute('r', '1.5'); led.setAttribute('fill', '#10b981');
        grp.appendChild(slot);
        grp.appendChild(led);
      });
      grp.appendChild(stack);

    } else if (node.type === 'router') {
      // Router disk
      const disk = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      disk.setAttribute('r', '16');
      disk.setAttribute('fill', node.isBroken ? '#7f1d1d' : '#083344');
      disk.setAttribute('stroke', node.isBroken ? '#ef4444' : '#06b6d4');
      disk.setAttribute('stroke-width', '2');
      grp.appendChild(disk);

    } else if (node.type === 'terminator') {
      // Terminator block
      const term = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      term.setAttribute('x', '-7'); term.setAttribute('y', '-16');
      term.setAttribute('width', '14'); term.setAttribute('height', '32');
      term.setAttribute('rx', '3');
      term.setAttribute('fill', isTerminatorBroken ? '#334155' : '#ef4444');
      term.setAttribute('opacity', isTerminatorBroken ? '0.3' : '1');
      grp.appendChild(term);
    }

    // Title label
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('y', node.type === 'terminator' ? '32' : (node.type === 'switch' ? '46' : '42'));
    title.setAttribute('font-size', '11.5');
    title.setAttribute('font-weight', '800');
    title.setAttribute('fill', node.isBroken ? '#ef4444' : '#ffffff');
    title.setAttribute('text-anchor', 'middle');
    title.textContent = (node.type === 'terminator' && isTerminatorBroken) ? 'MISSING!' : (node.isBroken ? 'OFFLINE (SPOF)' : node.label);
    grp.appendChild(title);

    // IP badge (if any)
    if (node.ip && !node.isBroken) {
      const ipText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      ipText.setAttribute('y', '56');
      ipText.setAttribute('font-size', '9.5');
      ipText.setAttribute('font-family', 'var(--font-mono)');
      ipText.setAttribute('fill', 'var(--text-muted)');
      ipText.setAttribute('text-anchor', 'middle');
      ipText.textContent = node.ip;
      grp.appendChild(ipText);
    }

    // Dynamic Sender / Receiver Role Badge (Accurately reflects current ping selection)
    const isSender = (topoSrcNode && topoSrcNode.value === node.id);
    const isReceiver = (topoDstNode && topoDstNode.value === node.id);

    if ((isSender || isReceiver) && !node.isBroken && node.type !== 'terminator' && node.type !== 'tap') {
      const badgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      badgeG.setAttribute('transform', 'translate(0, -32)');
      badgeG.setAttribute('class', isSender ? 'node-role-sender' : 'node-role-receiver');

      const badgeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      badgeRect.setAttribute('x', isSender ? '-33' : '-37');
      badgeRect.setAttribute('y', '-9');
      badgeRect.setAttribute('width', isSender ? '66' : '74');
      badgeRect.setAttribute('height', '18');
      badgeRect.setAttribute('rx', '4');
      badgeRect.setAttribute('fill', isSender ? '#1d4ed8' : '#047857');
      badgeRect.setAttribute('stroke', isSender ? '#93c5fd' : '#6ee7b7');
      badgeRect.setAttribute('stroke-width', '1.5');

      const badgeTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      badgeTxt.setAttribute('y', '3.5');
      badgeTxt.setAttribute('font-size', '9.5');
      badgeTxt.setAttribute('font-weight', '800');
      badgeTxt.setAttribute('fill', '#ffffff');
      badgeTxt.setAttribute('text-anchor', 'middle');
      badgeTxt.textContent = isSender ? 'SENDER' : 'RECEIVER';

      badgeG.appendChild(badgeRect);
      badgeG.appendChild(badgeTxt);
      grp.appendChild(badgeG);
    }

    // Interactions
    setupNodeInteractivity(grp, node);

    g.appendChild(grp);
  }

  // -------------------------------------------------------------------------
  // Node Interactivity: Context-Aware Move, Cable, Snip, Delete
  // -------------------------------------------------------------------------
  function setupNodeInteractivity(elem, node) {
    let isDragging = false;
    let didMove = false;
    let startX = 0;
    let startY = 0;
    let ignoreNextClick = false;

    elem.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Only primary mouse button
      isDragging = true;
      didMove = false;
      startX = e.clientX;
      startY = e.clientY;

      const onMouseMove = (moveEvt) => {
        if (!isDragging) return;
        const dx = moveEvt.clientX - startX;
        const dy = moveEvt.clientY - startY;
        if (Math.hypot(dx, dy) > 4) {
          didMove = true;
          elem.classList.add('dragging');
        }
        if (!didMove) return;

        const rect = topoSvg.getBoundingClientRect();
        const svgW = 980;
        const svgH = 470;
        const scaleX = svgW / rect.width;
        const scaleY = svgH / rect.height;

        const newX = Math.max(35, Math.min(svgW - 35, (moveEvt.clientX - rect.left) * scaleX));
        const newY = Math.max(35, Math.min(svgH - 45, (moveEvt.clientY - rect.top) * scaleY));

        node.x = Math.round(newX);
        node.y = Math.round(newY);

        renderWorkbench();
      };

      const onMouseUp = () => {
        if (didMove) {
          ignoreNextClick = true;
          setTimeout(() => { ignoreNextClick = false; }, 60);
        }
        isDragging = false;
        elem.classList.remove('dragging');
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    elem.addEventListener('click', (e) => {
      e.stopPropagation();
      if (ignoreNextClick) return;

      if (activeTool === 'cable') {
        if (!cableStartNode) {
          cableStartNode = node;
          topoHudHint.innerHTML = `<strong>Cable Mode:</strong> Selected <em>${node.label}</em>. Now click the second device to connect them!`;
          renderWorkbench();
        } else if (cableStartNode.id === node.id) {
          cableStartNode = null;
          topoHudHint.innerHTML = `Cancelled cable connection.`;
          renderWorkbench();
        } else {
          // Connect cable between cableStartNode and node
          const existing = topoLinks.find(l => (l.from === cableStartNode.id && l.to === node.id) || (l.from === node.id && l.to === cableStartNode.id));
          if (!existing) {
            topoLinks.push({
              id: `link-${cableStartNode.id}-${node.id}-${Date.now()}`,
              from: cableStartNode.id,
              to: node.id,
              isCut: false
            });
            topoFeedbackText.innerHTML = `Connected Ethernet cable between <strong>${cableStartNode.label}</strong> and <strong>${node.label}</strong>.`;
          }
          cableStartNode = null;
          topoHudHint.innerHTML = `Cable connected! Drag devices to rearrange or select another tool.`;
          renderWorkbench();
        }

      } else if (activeTool === 'cut') {
        if (node.type === 'terminator') {
          isTerminatorBroken = !isTerminatorBroken;
          topoFeedbackText.innerHTML = isTerminatorBroken ? `<strong style="color:#ef4444;">Terminator Removed!</strong> Signals will reflect and bounce down the bus cable.` : `Terminator restored. Signals are properly absorbed.`;
        } else {
          node.isBroken = !node.isBroken;
          topoFeedbackText.innerHTML = node.isBroken ? `<strong style="color:#ef4444;">${node.label} Failed!</strong> Testing network tolerance to hardware outage.` : `${node.label} restored and back online.`;
        }
        renderWorkbench();

      } else if (activeTool === 'delete') {
        topoNodes = topoNodes.filter(n => n.id !== node.id);
        topoLinks = topoLinks.filter(l => l.from !== node.id && l.to !== node.id);
        if (cableStartNode && cableStartNode.id === node.id) cableStartNode = null;
        topoFeedbackText.innerHTML = `Deleted device <strong>${node.label}</strong> and its connected cables.`;
        renderWorkbench();

      } else {
        topoFeedbackText.innerHTML = `Selected <strong>${node.label}</strong>${node.ip ? ` (${node.ip})` : ''}. Drag to reposition anywhere on the canvas.`;
      }
    });
  }

  // Helper generators for unique node identifiers and IPs
  function getNextPcInfo() {
    const usedNumbers = new Set();
    const usedIps = new Set();
    topoNodes.forEach(n => {
      if (n.type === 'pc') {
        const match = n.label && n.label.match(/PC\s*(\d+)/i);
        if (match) usedNumbers.add(parseInt(match[1], 10));
      }
      if (n.ip) {
        const ipMatch = n.ip.match(/192\.168\.1\.(\d+)/);
        if (ipMatch) usedIps.add(parseInt(ipMatch[1], 10));
      }
    });

    let num = 1;
    while (usedNumbers.has(num)) num++;

    let ipLastOctet = 10 + num;
    while (usedIps.has(ipLastOctet)) ipLastOctet++;

    return {
      label: `PC ${num}`,
      ip: `192.168.1.${ipLastOctet}`
    };
  }

  function getNextSwitchLabel() {
    const switchCount = topoNodes.filter(n => n.type === 'switch').length;
    if (switchCount === 0) return 'Central Switch';
    return `Switch ${switchCount + 1}`;
  }

  function getNextServerInfo() {
    const serverNodes = topoNodes.filter(n => n.type === 'server');
    if (serverNodes.length === 0) {
      return { label: 'Server', ip: '192.168.1.200' };
    }
    const num = serverNodes.length + 1;
    return { label: `Server ${num}`, ip: `192.168.1.${200 + serverNodes.length}` };
  }

  // Canvas click to add devices
  topoSvg.addEventListener('click', (e) => {
    if (activeTool === 'add-pc' || activeTool === 'add-switch' || activeTool === 'add-server') {
      const rect = topoSvg.getBoundingClientRect();
      const svgW = 980;
      const svgH = 470;
      const x = Math.round((e.clientX - rect.left) * (svgW / rect.width));
      const y = Math.round((e.clientY - rect.top) * (svgH / rect.height));

      if (activeTool === 'add-pc') {
        const id = `pc_${nextNodeId++}`;
        const pcInfo = getNextPcInfo();
        topoNodes.push({ id, label: pcInfo.label, type: 'pc', x, y, ip: pcInfo.ip, isBroken: false });
        topoFeedbackText.innerHTML = `Placed <strong>${pcInfo.label}</strong> (${pcInfo.ip}) on canvas. Use <strong>Cable</strong> to connect it to the network!`;
      } else if (activeTool === 'add-switch') {
        const id = `sw_${nextNodeId++}`;
        const label = getNextSwitchLabel();
        topoNodes.push({ id, label, type: 'switch', x, y, isBroken: false });
        topoFeedbackText.innerHTML = `Placed <strong>${label}</strong> on canvas. Connect workstations to it to build a Star network.`;
      } else if (activeTool === 'add-server') {
        const id = `srv_${nextNodeId++}`;
        const srvInfo = getNextServerInfo();
        topoNodes.push({ id, label: srvInfo.label, type: 'server', x, y, ip: srvInfo.ip, isBroken: false });
        topoFeedbackText.innerHTML = `Placed <strong>${srvInfo.label}</strong> on canvas.`;
      }
      renderWorkbench();
    }
  });

  // -------------------------------------------------------------------------
  // Tool Modes Switching
  // -------------------------------------------------------------------------
  topoToolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;

      // Toggle off if clicking the already-selected tool
      if (activeTool === tool) {
        activeTool = null;
        btn.classList.remove('active');
        cableStartNode = null;
        topoSvg.classList.remove('cursor-crosshair', 'cursor-scissors', 'cursor-delete');
        topoHudHint.innerHTML = `Drag any device to move. Select a tool from the dock to add devices, connect cables, or snip.`;
        renderWorkbench();
        return;
      }

      topoToolButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTool = tool;
      cableStartNode = null;

      // Cursor states
      topoSvg.classList.remove('cursor-crosshair', 'cursor-scissors', 'cursor-delete');
      if (activeTool === 'cable' || activeTool === 'add-pc' || activeTool === 'add-switch' || activeTool === 'add-server') {
        topoSvg.classList.add('cursor-crosshair');
      } else if (activeTool === 'cut') {
        topoSvg.classList.add('cursor-scissors');
      } else if (activeTool === 'delete') {
        topoSvg.classList.add('cursor-delete');
      }

      // Hints
      if (activeTool === 'add-pc') topoHudHint.innerHTML = `<strong>Add PC:</strong> Click anywhere on the grid canvas to place a Workstation PC.`;
      if (activeTool === 'add-switch') topoHudHint.innerHTML = `<strong>Add Switch:</strong> Click on the canvas to place a Central Switch.`;
      if (activeTool === 'add-server') topoHudHint.innerHTML = `<strong>Add Server:</strong> Click on the canvas to place a Dedicated Server.`;
      if (activeTool === 'cable') topoHudHint.innerHTML = `<strong>Connect Cable:</strong> Click the first device, then click the second device to link them.`;
      if (activeTool === 'cut') topoHudHint.innerHTML = `<strong>Snip / Cut:</strong> Click any cable to snip it, or click a switch to simulate hardware crash.`;
      if (activeTool === 'delete') topoHudHint.innerHTML = `<strong>Delete:</strong> Click any device or cable to remove it from the network.`;

      renderWorkbench();
    });
  });

  // -------------------------------------------------------------------------
  // Topology Recognition & Diagnostics Updates
  // -------------------------------------------------------------------------
  function updateMetricsAndFacts() {
    const pcCount = topoNodes.filter(n => n.type === 'pc' || n.type === 'server' || n.type === 'router').length;
    const switchCount = topoNodes.filter(n => n.type === 'switch').length;
    const cableCount = topoLinks.length;
    const cutCount = topoLinks.filter(l => l.isCut).length;

    metricNodes.textContent = `${pcCount} Endpoints ${switchCount > 0 ? `+ ${switchCount} Switch` : ''}`;
    metricCables.textContent = `${cableCount} Links (${cutCount} severed)`;

    // Detect topology automatically
    let detected = currentTopo;
    if (switchCount === 1 && cableCount >= pcCount && currentTopo !== 'bus') {
      detected = 'star';
    } else if (topoNodes.some(n => n.type === 'terminator') || topoLinks.some(l => l.isBackbone)) {
      detected = 'bus';
    } else if (pcCount >= 4 && cableCount >= pcCount * 1.4) {
      detected = 'mesh';
    }

    const def = topoDefinitions[detected] || topoDefinitions.custom;
    if (topoCurrentTitle) topoCurrentTitle.innerHTML = def.title;
    topoClassifiedTag.textContent = def.tag;
    metricCost.textContent = def.cost;
    metricSpof.textContent = def.spof;
    metricCollisions.textContent = def.collisions;
    metricPaths.textContent = def.paths;

    factCardTitle.innerHTML = def.factTitle;
    factCardBody.innerHTML = def.factBody;
    factExamTip.innerHTML = def.examTip;

    // Active fact tab button
    factTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.fact === detected);
    });
  }

  // Quick fact tab switching
  factTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      factTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.fact;
      const def = topoDefinitions[target] || topoDefinitions.star;
      factCardTitle.innerHTML = def.factTitle;
      factCardBody.innerHTML = def.factBody;
      factExamTip.innerHTML = def.examTip;
    });
  });

  // -------------------------------------------------------------------------
  // Network Health Check
  // -------------------------------------------------------------------------
  function checkNetworkHealth() {
    const hasBrokenSwitch = topoNodes.some(n => n.type === 'switch' && n.isBroken);
    const hasCutBackbone = topoLinks.some(l => l.isBackbone && l.isCut);
    const cutCount = topoLinks.filter(l => l.isCut).length;

    if (currentTopo === 'star') {
      if (hasBrokenSwitch) {
        topoHealthBadge.className = 'topo-health-badge offline';
        topoHealthBadge.textContent = '● TOTAL NETWORK CRASH (SPOF)';
        topoFeedbackIcon.textContent = '✕';
        topoFeedbackText.innerHTML = `<strong style="color:#ef4444;">Central Switch Failed!</strong> Because all devices connect through the switch, NO devices can communicate. This is the classic GCSE <em>Single Point of Failure (SPOF)</em>!`;
      } else if (cutCount > 0) {
        topoHealthBadge.className = 'topo-health-badge degraded';
        topoHealthBadge.textContent = `● Isolated Devices (${cutCount} severed)`;
        topoFeedbackIcon.textContent = '!';
        topoFeedbackText.innerHTML = `<strong>Cable Severed:</strong> Only machines with broken cables are disconnected. The rest of the star network continues communicating at full wire speed!`;
      } else {
        topoHealthBadge.className = 'topo-health-badge online';
        topoHealthBadge.textContent = '● 100% Operational';
        topoFeedbackIcon.textContent = '✓';
        topoFeedbackText.innerHTML = `Star network fully online. The central switch routes frames directly to destination ports without packet collisions.`;
      }

    } else if (currentTopo === 'bus') {
      if (hasCutBackbone) {
        topoHealthBadge.className = 'topo-health-badge offline';
        topoHealthBadge.textContent = '● TOTAL NETWORK COLLAPSE';
        topoFeedbackIcon.textContent = '✕';
        topoFeedbackText.innerHTML = `<strong style="color:#ef4444;">Backbone Severed!</strong> Without a continuous cable, signals hit the break and bounce back. Colliding signals destroy all traffic across the entire bus!`;
      } else if (isTerminatorBroken) {
        topoHealthBadge.className = 'topo-health-badge offline';
        topoHealthBadge.textContent = '● SIGNAL BOUNCE / REFLECTION';
        topoFeedbackIcon.textContent = '!';
        topoFeedbackText.innerHTML = `<strong style="color:#ef4444;">Missing Terminator:</strong> Signals reach the cable end without absorption. They reflect back down the bus and collide with oncoming packets!`;
      } else if (cutCount > 0) {
        topoHealthBadge.className = 'topo-health-badge degraded';
        topoHealthBadge.textContent = '● Drop Cable Severed';
        topoFeedbackIcon.textContent = 'i';
        topoFeedbackText.innerHTML = `A drop cable is severed. Only that single workstation lost access; the shared backbone remains functional.`;
      } else {
        topoHealthBadge.className = 'topo-health-badge online';
        topoHealthBadge.textContent = '● 100% Operational';
        topoFeedbackIcon.textContent = '✓';
        topoFeedbackText.innerHTML = `Bus network online. Broadcast signals reach all nodes; terminators absorb excess energy at both cable ends.`;
      }

    } else if (currentTopo === 'mesh') {
      const link14 = topoLinks.find(l => (l.from === 'pc1' && l.to === 'pc4') || (l.from === 'pc4' && l.to === 'pc1'));
      const directCut = link14 ? link14.isCut : false;

      if (cutCount >= 3) {
        topoHealthBadge.className = 'topo-health-badge degraded';
        topoHealthBadge.textContent = `● High Fault Tolerance (${cutCount} cuts)`;
        topoFeedbackIcon.textContent = '⚡';
        topoFeedbackText.innerHTML = `Multiple cables severed, but mesh routing algorithms find alternate redundant routes around broken links!`;
      } else if (directCut) {
        topoHealthBadge.className = 'topo-health-badge degraded';
        topoHealthBadge.textContent = '● Dynamic Rerouting Active';
        topoFeedbackIcon.textContent = '⚡';
        topoFeedbackText.innerHTML = `<span style="color:#10b981; font-weight:800;">Self-Healing Mesh:</span> Direct wire (PC 1 ➔ PC 4) is cut! The mesh network automatically and seamlessly reroutes traffic around the failure with zero downtime.`;
      } else {
        topoHealthBadge.className = 'topo-health-badge online';
        topoHealthBadge.textContent = '● 100% Operational (Redundant)';
        topoFeedbackIcon.textContent = '✓';
        topoFeedbackText.innerHTML = `Mesh network online. Multiple redundant connections guarantee no single point of failure exists!`;
      }
    } else {
      topoHealthBadge.className = 'topo-health-badge online';
      topoHealthBadge.textContent = `● Custom Lab (${topoNodes.length} devices)`;
      topoFeedbackIcon.textContent = '✓';
      topoFeedbackText.innerHTML = `Custom network ready. Select source &amp; destination nodes above to test packet delivery.`;
    }
  }

  // -------------------------------------------------------------------------
  // Pathfinding (BFS)
  // -------------------------------------------------------------------------
  function findGraphPath(startId, targetId) {
    if (startId === targetId) return [startId];

    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current === targetId) return path;

      // Find non-severed neighbors whose node is not broken
      const connectedLinks = topoLinks.filter(l => !l.isCut && (l.from === current || l.to === current));
      for (const link of connectedLinks) {
        const neighborId = link.from === current ? link.to : link.from;
        const neighborNode = topoNodes.find(n => n.id === neighborId);

        if (!neighborNode || neighborNode.isBroken) continue;

        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push([...path, neighborId]);
        }
      }
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // Animated Packet Transmission Simulation
  // -------------------------------------------------------------------------
  function sendTopoPacket() {
    if (isTopoAnimating) return;
    const srcId = topoSrcNode ? topoSrcNode.value : 'pc1';
    const dstId = topoDstNode ? topoDstNode.value : 'pc4';

    const srcNode = topoNodes.find(n => n.id === srcId);
    const dstNode = topoNodes.find(n => n.id === dstId);

    if (!srcNode || !dstNode) {
      topoFeedbackText.innerHTML = 'Please choose a valid Source and Destination device.';
      return;
    }

    if (srcId === dstId) {
      topoFeedbackText.innerHTML = `Source and destination are the same device (<strong>${srcNode.label}</strong>). Select a different destination!`;
      return;
    }

    isTopoAnimating = true;
    topoPingBtn.disabled = true;
    topoPingBtn.textContent = '⏳ Transmitting...';
    const packetsG = document.getElementById('topoPacketsLayer');
    if (packetsG) packetsG.innerHTML = '';

    // Specialized Bus Simulation
    if (currentTopo === 'bus') {
      simulateBusPacket(packetsG, srcNode, dstNode);
      return;
    }

    // Pathfinding across star, mesh, or custom
    const path = findGraphPath(srcId, dstId);

    if (path) {
      // Direct or rerouted path found!
      const isDetour = currentTopo === 'mesh' && path.length > 2;
      if (isDetour) {
        topoFeedbackText.innerHTML = `<span style="color:#10b981; font-weight:800;">⚡ Self-Healing Mesh:</span> Direct wire is severed, but dynamic routing rerouted packet via <strong>${topoNodes.find(n => n.id === path[1]).label}</strong>!`;
      } else {
        topoFeedbackText.innerHTML = `Transmitting packet from <strong>${srcNode.label}</strong> to <strong>${dstNode.label}</strong>...`;
      }

      animatePathHops(packetsG, path, 0, () => {
        showTopoBurst(packetsG, dstNode.x, dstNode.y, '#10b981', 'Delivered ✓');
        const msg = currentTopo === 'star'
          ? `Success: Central switch read destination MAC address and forwarded packet directly to ${dstNode.label} without broadcasting.`
          : (isDetour
            ? `Self-Healing Success: Dynamic mesh routing steered packet around severed links with zero downtime!`
            : `Success: Packet delivered cleanly across ${path.length - 1} hop(s).`);
        finishTopoAnimation(msg);
      });

    } else {
      // Path blocked! Determine why and animate up to the failure point
      simulateBlockedPacket(packetsG, srcNode, dstNode);
    }
  }

  function animatePathHops(packetsG, path, hopIndex, onComplete) {
    if (hopIndex >= path.length - 1) {
      if (onComplete) onComplete();
      return;
    }

    const n1 = topoNodes.find(n => n.id === path[hopIndex]);
    const n2 = topoNodes.find(n => n.id === path[hopIndex + 1]);

    animateLinePacket(packetsG, n1.x, n1.y, n2.x, n2.y, '#3b82f6', null, () => {
      if (n2.type === 'switch') {
        showTopoBurst(packetsG, n2.x, n2.y, '#3b82f6', 'SWITCH PORT');
      }
      animatePathHops(packetsG, path, hopIndex + 1, onComplete);
    });
  }

  function simulateBlockedPacket(packetsG, srcNode, dstNode) {
    // Check if source cable is cut
    const srcLink = topoLinks.find(l => (l.from === srcNode.id || l.to === srcNode.id));
    if (srcLink && srcLink.isCut) {
      const otherNode = topoNodes.find(n => n.id === (srcLink.from === srcNode.id ? srcLink.to : srcLink.from));
      const midX = (srcNode.x + otherNode.x) / 2;
      const midY = (srcNode.y + otherNode.y) / 2;
      animateLinePacket(packetsG, srcNode.x, srcNode.y, midX, midY, '#ef4444', null, () => {
        showTopoBurst(packetsG, midX, midY, '#ef4444', 'CABLE CUT');
        finishTopoAnimation(`Dropped: Cable from ${srcNode.label} is cut! Packet could not reach the switch.`);
      });
      return;
    }

    // Check if central switch is broken (in star)
    const centralSw = topoNodes.find(n => n.type === 'switch');
    if (centralSw && centralSw.isBroken) {
      animateLinePacket(packetsG, srcNode.x, srcNode.y, centralSw.x, centralSw.y, '#ef4444', null, () => {
        showTopoBurst(packetsG, centralSw.x, centralSw.y, '#ef4444', 'SWITCH DEAD');
        finishTopoAnimation(`Dropped: Central Switch is broken! Classic GCSE Single Point of Failure (SPOF) stopped packet.`);
      });
      return;
    }

    // Default dropped packet animation
    animateLinePacket(packetsG, srcNode.x, srcNode.y, (srcNode.x + dstNode.x) / 2, (srcNode.y + dstNode.y) / 2, '#ef4444', null, () => {
      showTopoBurst(packetsG, (srcNode.x + dstNode.x) / 2, (srcNode.y + dstNode.y) / 2, '#ef4444', 'PATH BLOCKED');
      finishTopoAnimation(`Dropped: No viable network route between ${srcNode.label} and ${dstNode.label}! All connecting links severed.`);
    });
  }

  // Specialized Bus packet simulation
  function simulateBusPacket(packetsG, srcNode, dstNode) {
    const tapSrc = topoNodes.find(n => n.type === 'tap' && Math.abs(n.x - srcNode.x) < 20);
    const tapDst = topoNodes.find(n => n.type === 'tap' && Math.abs(n.x - dstNode.x) < 20);
    const dropSrcLink = topoLinks.find(l => (l.from === srcNode.id || l.to === srcNode.id) && l.isDrop);
    const hasCutBackbone = topoLinks.some(l => l.isBackbone && l.isCut);

    // 1. Drop cable down to backbone
    animateLinePacket(packetsG, srcNode.x, srcNode.y, tapSrc.x, tapSrc.y, '#3b82f6', (prog) => {
      if (dropSrcLink && dropSrcLink.isCut && prog > 0.4) {
        showTopoBurst(packetsG, (srcNode.x + tapSrc.x) / 2, (srcNode.y + tapSrc.y) / 2, '#ef4444', 'Drop Cut');
        finishTopoAnimation(`Dropped: Drop cable from ${srcNode.label} is severed; packet cannot enter backbone.`);
        return false;
      }
      return true;
    }, () => {
      // Reached backbone!
      if (hasCutBackbone) {
        const breakX = 490;
        animateLinePacket(packetsG, tapSrc.x, tapSrc.y, breakX, tapSrc.y, '#ef4444', null, () => {
          showTopoBurst(packetsG, breakX, tapSrc.y, '#ef4444', 'COLLISION / BOUNCE');
          finishTopoAnimation(`Fatal Crash: Packet hit severed backbone! Signals reflect and collide, taking down the entire bus.`);
        });
        return;
      }

      if (isTerminatorBroken) {
        animateLinePacket(packetsG, tapSrc.x, tapSrc.y, 840, tapSrc.y, '#f59e0b', null, () => {
          showTopoBurst(packetsG, 840, tapSrc.y, '#ef4444', 'SIGNAL BOUNCE');
          finishTopoAnimation(`Collision Error: Missing Terminator! Unabsorbed signal bounced back down the wire and collided with traffic.`);
        });
        return;
      }

      // Normal transmission along backbone to destination tap
      animateLinePacket(packetsG, tapSrc.x, tapSrc.y, tapDst.x, tapDst.y, '#10b981', null, () => {
        const dropDstLink = topoLinks.find(l => (l.from === dstNode.id || l.to === dstNode.id) && l.isDrop);
        if (dropDstLink && dropDstLink.isCut) {
          showTopoBurst(packetsG, (tapDst.x + dstNode.x) / 2, (tapDst.y + dstNode.y) / 2, '#ef4444', 'Drop Cut');
          finishTopoAnimation(`Dropped: ${dstNode.label} drop cable is severed; broadcast packet passed along bus without reaching workstation.`);
        } else {
          animateLinePacket(packetsG, tapDst.x, tapDst.y, dstNode.x, dstNode.y, '#10b981', null, () => {
            showTopoBurst(packetsG, dstNode.x, dstNode.y, '#10b981', 'Accepted ✓');
            finishTopoAnimation(`Success: Broadcast packet traveled along backbone. ${dstNode.label} accepted its packet; terminators absorbed excess energy.`);
          });
        }
      });
    });
  }

  function animateLinePacket(g, x1, y1, x2, y2, color, stepCheck, onDone) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '8.5');
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '2.5');
    circle.setAttribute('filter', 'url(#topoGlow)');
    g.appendChild(circle);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.07;
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
    }, 22);
  }

  function showTopoBurst(g, x, y, color, text) {
    const targetG = document.getElementById('topoOverlaysLayer') || g;
    const burst = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    burst.setAttribute('transform', `translate(${x}, ${y})`);
    burst.setAttribute('class', 'topo-burst-effect');

    // Pulsing glowing ring
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('r', '28');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', color);
    ring.setAttribute('stroke-width', '3');
    ring.setAttribute('filter', 'url(#topoGlow)');

    // Floating Badge Card (Above node so it appears crisply in front of the device icon)
    const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    badge.setAttribute('transform', 'translate(0, -38)');

    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '-56');
    bgRect.setAttribute('y', '-13');
    bgRect.setAttribute('width', '112');
    bgRect.setAttribute('height', '26');
    bgRect.setAttribute('rx', '13');
    bgRect.setAttribute('fill', color === '#10b981' ? '#064e3b' : (color === '#ef4444' ? '#7f1d1d' : '#1e293b'));
    bgRect.setAttribute('stroke', color);
    bgRect.setAttribute('stroke-width', '2');
    bgRect.setAttribute('filter', 'url(#topoGlow)');

    const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl.setAttribute('y', '4');
    lbl.setAttribute('font-size', '12');
    lbl.setAttribute('font-weight', '800');
    lbl.setAttribute('fill', '#ffffff');
    lbl.setAttribute('text-anchor', 'middle');
    lbl.textContent = text;

    badge.appendChild(bgRect);
    badge.appendChild(lbl);

    burst.appendChild(ring);
    burst.appendChild(badge);
    targetG.appendChild(burst);

    if (urlTopoParams.get('burst') !== '1') {
      setTimeout(() => burst.remove(), 2500);
    }
  }

  function finishTopoAnimation(feedbackText) {
    isTopoAnimating = false;
    topoPingBtn.disabled = false;
    topoPingBtn.textContent = '▶ Send Packet';
    if (feedbackText) {
      topoFeedbackText.innerHTML = feedbackText;
    }
  }

  // -------------------------------------------------------------------------
  // Event Listeners for Topo Pills & Action Buttons
  // -------------------------------------------------------------------------
  topoPills.forEach(pill => {
    pill.addEventListener('click', () => {
      topoPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const topo = pill.dataset.topo;
      currentTopo = topo;

      if (topo === 'star') loadStarPreset();
      else if (topo === 'bus') loadBusPreset();
      else if (topo === 'mesh') loadMeshPreset();
      else loadCustomPreset();
    });
  });

  topoRepairBtn.addEventListener('click', () => {
    topoLinks.forEach(l => l.isCut = false);
    topoNodes.forEach(n => n.isBroken = false);
    isTerminatorBroken = false;
    renderWorkbench();
    topoFeedbackText.innerHTML = 'All cables reconnected and all devices restored to full working order!';
  });

  topoPingBtn.addEventListener('click', sendTopoPacket);

  // Dynamic dropdown change listeners to update Sender and Receiver role badges in real time
  if (topoSrcNode) {
    topoSrcNode.addEventListener('change', () => renderWorkbench());
  }
  if (topoDstNode) {
    topoDstNode.addEventListener('change', () => renderWorkbench());
  }

  // URL parameter & hash support (e.g. ?topo=bus or #topologies-bus or #topologies-mesh)
  const urlTopoParams = new URLSearchParams(window.location.search);
  const currentHash = window.location.hash.toLowerCase();
  const initialTopo = urlTopoParams.get('topo') || (currentHash.includes('bus') ? 'bus' : (currentHash.includes('mesh') ? 'mesh' : (currentHash.includes('custom') ? 'custom' : null)));
  if (initialTopo || currentHash.includes('topologies')) {
    const topoTabBtn = document.querySelector('.view-tab-btn[data-tab="topologies"]');
    if (topoTabBtn) topoTabBtn.click();
  }
  if (initialTopo === 'bus') {
    const pill = document.querySelector('#topoPills [data-topo="bus"]');
    if (pill) pill.click();
  } else if (initialTopo === 'mesh') {
    const pill = document.querySelector('#topoPills [data-topo="mesh"]');
    if (pill) pill.click();
  } else if (initialTopo === 'custom') {
    const pill = document.querySelector('#topoPills [data-topo="custom"]');
    if (pill) pill.click();
  } else {
    loadStarPreset();
  }

  const scenarioParam = urlTopoParams.get('scenario');
  if (scenarioParam === 'spof') {
    const sw = topoNodes.find(n => n.id === 'sw1');
    if (sw) sw.isBroken = true;
    renderWorkbench();
  } else if (scenarioParam === 'sever') {
    const l = topoLinks.find(x => x.id === 'link-bb-mid2');
    if (l) l.isCut = true;
    renderWorkbench();
  } else if (scenarioParam === 'bounce') {
    isTerminatorBroken = true;
    renderWorkbench();
  } else if (scenarioParam === 'cut1') {
    if (topoLinks[0]) topoLinks[0].isCut = true;
    renderWorkbench();
  }

  if (urlTopoParams.get('burst') === '1') {
    setTimeout(() => {
      const dstNode = topoNodes.find(n => n.id === 'pc4');
      if (dstNode) {
        showTopoBurst(null, dstNode.x, dstNode.y, '#10b981', 'Delivered ✓');
      }
    }, 150);
  }



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
          <div class="shared-key-emblem">KEY</div>
          <strong class="shared-key-title">Identical Key Established!</strong>
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
