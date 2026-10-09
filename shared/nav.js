/**
 * GCSE Computer Science Revision Portal - Universal Navigation
 * Full Course Directory Drawer & Touch Section Switcher
 * Mobile-First Collapsible Course Directory
 */

(function () {
  'use strict';

  const COURSE_DATA = [
    {
      paperId: 'paper1',
      paperTitle: 'Paper 1: Computational Thinking & Code',
      modules: [
        {
          id: 'sort-lab',
          title: 'Searching & Sorting',
          code: '§3.1',
          url: 'modules/sort-lab/index.html',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
          sections: [
            { id: 'visualizer', title: 'Sorting Algorithms' },
            { id: 'race', title: 'Sorting Race Mode' },
            { id: 'search', title: 'Searching Algorithms' },
            { id: 'revision', title: 'Revision Summary' }
          ]
        },
        {
          id: 'trace-tables',
          title: 'Design & Testing',
          code: '§3.2',
          url: 'modules/trace-tables/index.html',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line></svg>',
          sections: [
            { id: 'tabBtnModules', title: '1. Structuring programmes' },
            { id: 'tabBtnDebugger', title: '2. Understanding Program Errors' },
            { id: 'tabBtnTestPlan', title: '3. Test Plans & Boundaries' },
            { id: 'tabBtnTrace', title: '4. Trace Tables' },
            { id: 'tabBtnRevision', title: '5. Revision Summary' }
          ]
        },
        {
          id: 'random-lab',
          title: 'Random Numbers & PRNG',
          code: '§3.2',
          url: 'modules/random-lab/index.html',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"></circle><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"></circle><circle cx="12" cy="12" r="1.5" fill="currentColor"></circle></svg>',
          sections: [
            { id: 'art', title: 'Procedural World & Art' },
            { id: 'engine', title: 'PRNG Engine & Math' },
            { id: 'revision', title: 'Revision' }
          ]
        }
      ]
    },
    {
      paperId: 'paper2',
      paperTitle: 'Paper 2: Computing Concepts & Data',
      modules: [
        {
          id: 'binary-numbers',
          title: 'Number Systems & Binary',
          code: '§3.3.1',
          url: 'modules/binary-numbers/index.html',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="7" height="16" rx="3.5"></rect><path d="M17 4v16M14 7l3-3"></path></svg>',
          sections: [
            { id: 'register', title: 'Binary & Hexadecimal Numbers' },
            { id: 'maths', title: 'Binary Maths' },
            { id: 'units', title: 'Data Units' },
            { id: 'revision', title: 'Revision' },
            { id: 'arcade', title: '⚡ BitMaster' }
          ]
        },
        {
          id: 'character-encoding',
          title: 'Character Sets & Huffman',
          code: '§3.3.2',
          url: 'modules/character-encoding/index.html',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>',
          sections: [
            { id: 'ascii', title: 'ASCII & Unicode' },
            { id: 'huffman', title: 'Huffman Coding' },
            { id: 'revision', title: 'Revision' }
          ]
        },
        {
          id: 'cpu-sim',
          title: 'CPU Architecture',
          code: '§3.4.1',
          url: 'modules/cpu-sim/index.html',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect></svg>',
          sections: [
            { id: 'fde', title: 'F-D-E Visualizer' },
            { id: 'perf', title: 'Performance Sandbox' },
            { id: 'storage', title: 'Storage & Memory' },
            { id: 'revision', title: 'Revision Cards' }
          ]
        },
        {
          id: 'data-representation',
          title: 'Data Representation',
          code: '§3.3.3',
          url: 'modules/data-representation/index.html',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
          sections: [
            { id: 'visualizer', title: 'Pixel Grid (Sprites)' },
            { id: 'photolab', title: 'Photo Colour Depth' },
            { id: 'comparison', title: 'Comparison Mode' },
            { id: 'sound', title: 'Sound Sampling' },
            { id: 'revision', title: 'Revision Cards' }
          ]
        },
        {
          id: 'networks',
          title: 'Networks & Protocols',
          code: '§3.5',
          url: 'modules/networks/index.html',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="2" width="20" height="8" rx="2"></rect><rect x="2" y="14" width="20" height="8" rx="2"></rect></svg>',
          sections: [
            { id: 'packet-world', title: 'Packet Routing' },
            { id: 'topologies', title: 'Topologies Sandbox' },
            { id: 'layers', title: 'TCP/IP 4 Layers' },
            { id: 'encryption', title: 'Encryption' },
            { id: 'revision', title: 'Revision Guide' }
          ]
        },
        {
          id: 'sql-cyber-lab',
          title: 'Databases & SQL',
          code: '§3.7',
          url: 'modules/sql-cyber-lab/index.html',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
          sections: [
            { id: 'flatfile', title: 'Flat-File vs Relational Sim' },
            { id: 'sql', title: 'Schema & SQL Query Studio' },
            { id: 'revision', title: 'Revision & Mark Schemes' }
          ]
        },
        {
          id: 'logic-gates',
          title: 'Boolean Logic & Circuits',
          code: '§3.4.3',
          url: 'modules/logic-gates/index.html',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 6h4c3.31 0 6 2.69 6 6s-2.69 6-6 6H4z"></path></svg>',
          sections: [
            { id: 'breadboard', title: 'Logic Breadboard' },
            { id: 'bitwise', title: 'Bitwise Logic & Masks' },
            { id: 'revision', title: 'Revision' }
          ]
        }
      ]
    }
  ];

  function detectCurrentModuleId() {
    const p = window.location.pathname.toLowerCase().replace(/\\/g, '/');
    for (const group of COURSE_DATA) {
      for (const m of group.modules) {
        if (p.includes('/' + m.id + '/') || p.includes(m.id)) {
          return m.id;
        }
      }
    }
    return '';
  }

  function getHubRelativePrefix() {
    // Determine path prefix to reach project root
    const p = window.location.pathname.toLowerCase().replace(/\\/g, '/');
    if (p.includes('/modules/')) {
      return '../../';
    }
    return './';
  }

  function initUniversalNav() {
    // 1. Locate the header container
    const headerInner = document.querySelector(
      '.module-header:not(#standaloneNavBar) .module-header-inner, ' +
      '.module-header-inner, ' +
      '.site-header .header-container, ' +
      '.site-nav .nav-container, ' +
      '.header-container, ' +
      '.nav-container'
    ) || document.querySelector('header:not(#standaloneNavBar) > div') || document.querySelector('header > div');

    const viewTabs = document.querySelector('.view-tabs');
    if (!headerInner) return;

    const currentModId = detectCurrentModuleId();
    const currentTabButtons = viewTabs ? Array.from(viewTabs.querySelectorAll('.view-tab-btn')) : [];

    // Prevent duplicate injection
    if (document.getElementById('mobileSectionSwitcher')) return;

    // 2. Build Mobile Section Switcher Trigger Button
    const switcherWrap = document.createElement('div');
    switcherWrap.className = 'mobile-section-switcher';
    switcherWrap.id = 'mobileSectionSwitcher';

    const triggerBtn = document.createElement('button');
    triggerBtn.type = 'button';
    triggerBtn.className = 'mobile-section-trigger-btn';
    triggerBtn.id = 'mobileSectionTriggerBtn';
    triggerBtn.setAttribute('aria-expanded', 'false');
    triggerBtn.setAttribute('aria-haspopup', 'dialog');
    triggerBtn.setAttribute('aria-label', 'Open course navigation and section switcher');

    const triggerContent = document.createElement('div');
    triggerContent.className = 'mobile-trigger-content';

    const triggerTag = document.createElement('span');
    triggerTag.className = 'mobile-trigger-tag';
    triggerTag.textContent = 'Topic';

    const triggerTitle = document.createElement('span');
    triggerTitle.className = 'mobile-trigger-active-title';
    triggerTitle.id = 'mobileTriggerActiveTitle';

    triggerContent.appendChild(triggerTag);
    triggerContent.appendChild(triggerTitle);

    const chevronWrap = document.createElement('div');
    chevronWrap.className = 'mobile-trigger-chevron-wrap';
    chevronWrap.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;

    triggerBtn.appendChild(triggerContent);
    triggerBtn.appendChild(chevronWrap);
    switcherWrap.appendChild(triggerBtn);
    headerInner.appendChild(switcherWrap);

    // 3. Build Full Course Directory Modal / Drawer
    const modal = document.createElement('div');
    modal.className = 'mobile-section-modal';
    modal.id = 'mobileSectionModal';
    modal.style.display = 'none';

    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-section-backdrop';
    backdrop.id = 'mobileSectionBackdrop';

    const sheet = document.createElement('div');
    sheet.className = 'mobile-section-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'mobileSheetTitle');

    const sheetHeader = document.createElement('div');
    sheetHeader.className = 'mobile-section-sheet-header';
    sheetHeader.innerHTML = `
      <div class="mobile-sheet-title-group">
        <span class="mobile-sheet-sub">GCSE Computer Science</span>
        <h3 class="mobile-sheet-title" id="mobileSheetTitle">Topics &amp; Sections</h3>
      </div>
      <button type="button" class="mobile-sheet-close-btn" id="mobileSheetCloseBtn" aria-label="Close navigation menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    // Fast-jump to Hub Bar
    const hubJumpBar = document.createElement('div');
    hubJumpBar.className = 'mobile-drawer-hub-bar';
    const hubPrefix = getHubRelativePrefix();
    hubJumpBar.innerHTML = `
      <a href="${hubPrefix}index.html" class="mobile-drawer-hub-link">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Return to Revision Hub Dashboard</span>
      </a>
      <a href="${hubPrefix}bitmaster.html" class="mobile-drawer-arcade-link" title="Launch Full-Screen BitMaster">
        <span>⚡ BitMaster</span>
      </a>
    `;

    const list = document.createElement('div');
    list.className = 'mobile-section-list';
    list.id = 'mobileSectionList';

    sheet.appendChild(sheetHeader);
    sheet.appendChild(hubJumpBar);
    sheet.appendChild(list);
    modal.appendChild(backdrop);
    modal.appendChild(sheet);
    document.body.appendChild(modal);

    function getActiveTabButton() {
      if (!currentTabButtons.length) return null;
      return currentTabButtons.find(b => b.classList.contains('active')) || currentTabButtons[0];
    }

    function getTabButtonTitle(btn) {
      if (!btn) return '';
      const span = btn.querySelector('span');
      return (span ? span.textContent : btn.textContent).trim();
    }

    function updateTriggerLabel() {
      const activeBtn = getActiveTabButton();
      if (activeBtn) {
        triggerTitle.textContent = getTabButtonTitle(activeBtn);
      } else {
        // Fallback to module title
        const h1 = document.querySelector('.nav-module-title, h1');
        triggerTitle.textContent = h1 ? h1.textContent.trim() : 'Navigation Menu';
      }
    }

    // Render the Collapsible All-Modules List
    function renderAccordionDirectory() {
      list.innerHTML = '';
      const activeBtn = getActiveTabButton();
      const activeTitleStr = (activeBtn ? getTabButtonTitle(activeBtn) : '').toLowerCase();
      const activeDataTab = activeBtn ? (activeBtn.getAttribute('data-tab') || activeBtn.id || '') : '';

      COURSE_DATA.forEach(group => {
        // Group Header (Paper 1 / Paper 2)
        const groupEl = document.createElement('div');
        groupEl.className = 'mobile-nav-group';

        const groupLabel = document.createElement('div');
        groupLabel.className = 'mobile-nav-group-label';
        groupLabel.textContent = group.paperTitle;
        groupEl.appendChild(groupLabel);

        group.modules.forEach(mod => {
          const isCurrentMod = (mod.id === currentModId);

          const modCard = document.createElement('div');
          modCard.className = `mobile-accordion-module ${isCurrentMod ? 'current-module expanded' : 'collapsed'}`;
          modCard.id = `mobileModCard_${mod.id}`;

          // Header button for module accordion
          const modHeader = document.createElement('button');
          modHeader.type = 'button';
          modHeader.className = 'mobile-accordion-header';
          modHeader.setAttribute('aria-expanded', isCurrentMod ? 'true' : 'false');

          modHeader.innerHTML = `
            <div class="mobile-mod-icon">${mod.iconSvg}</div>
            <div class="mobile-mod-title-wrap">
              <span class="mobile-mod-title">${mod.title}</span>
              <span class="mobile-mod-spec">${mod.code}</span>
            </div>
            <div class="mobile-mod-chevron">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          `;

          // Clicking module header toggles collapse/expand
          modHeader.addEventListener('click', (e) => {
            e.preventDefault();
            const isExp = modCard.classList.contains('expanded');
            if (isExp) {
              modCard.classList.remove('expanded');
              modCard.classList.add('collapsed');
              modHeader.setAttribute('aria-expanded', 'false');
            } else {
              modCard.classList.remove('collapsed');
              modCard.classList.add('expanded');
              modHeader.setAttribute('aria-expanded', 'true');
            }
          });

          // Sections List inside module
          const secList = document.createElement('div');
          secList.className = 'mobile-accordion-sections';

          // If current module, match with actual live tab buttons in DOM where available
          const sectionsToRender = isCurrentMod && currentTabButtons.length ?
            currentTabButtons.map((tb, idx) => ({
              id: tb.getAttribute('data-tab') || tb.id || ('sec_' + idx),
              title: getTabButtonTitle(tb),
              liveButton: tb
            })) :
            mod.sections.map(s => ({
              id: s.id,
              title: s.title,
              liveButton: null
            }));

          sectionsToRender.forEach(sec => {
            const isCurrentSec = isCurrentMod && (
              (sec.liveButton && sec.liveButton === activeBtn) ||
              (sec.id && sec.id === activeDataTab) ||
              (sec.title.toLowerCase() === activeTitleStr)
            );

            const secBtn = document.createElement('button');
            secBtn.type = 'button';
            secBtn.className = `mobile-section-sub-btn ${isCurrentSec ? 'active current-active-section' : ''}`;

            secBtn.innerHTML = `
              <div class="mobile-sub-dot"></div>
              <span class="mobile-sub-title">${sec.title}</span>
              ${isCurrentSec ? '<span class="mobile-sub-badge">Current Section ✓</span>' : ''}
            `;

            secBtn.addEventListener('click', () => {
              if (isCurrentMod) {
                // In same module: switch tab directly!
                if (sec.liveButton) {
                  sec.liveButton.click();
                } else {
                  // Find button by data-tab or id
                  const matchedLive = currentTabButtons.find(b =>
                    (b.getAttribute('data-tab') === sec.id) ||
                    (b.id === sec.id) ||
                    (getTabButtonTitle(b).toLowerCase() === sec.title.toLowerCase())
                  );
                  if (matchedLive) matchedLive.click();
                }
                closeModal();
                updateTriggerLabel();
              } else {
                // Different module: navigate to URL with section deep-link
                const targetUrl = hubPrefix + mod.url + (sec.id ? `?tab=${encodeURIComponent(sec.id)}` : '');
                window.location.href = targetUrl;
              }
            });

            secList.appendChild(secBtn);
          });

          modCard.appendChild(modHeader);
          modCard.appendChild(secList);
          groupEl.appendChild(modCard);
        });

        list.appendChild(groupEl);
      });
    }

    function openModal() {
      renderAccordionDirectory();
      modal.style.display = 'block';
      // Trigger animation frame
      requestAnimationFrame(() => {
        modal.classList.add('open');
        triggerBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';

        // Auto-scroll so current section is in view
        setTimeout(() => {
          const currentActiveEl = list.querySelector('.current-active-section');
          const currentModEl = list.querySelector('.current-module');
          const scrollTarget = currentActiveEl || currentModEl;
          if (scrollTarget && typeof scrollTarget.scrollIntoView === 'function') {
            scrollTarget.scrollIntoView({ block: 'center', behavior: 'auto' });
          }
        }, 80);
      });
    }

    function closeModal() {
      modal.classList.remove('open');
      triggerBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (!modal.classList.contains('open')) {
          modal.style.display = 'none';
        }
      }, 250);
    }

    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (modal.classList.contains('open')) closeModal();
      else openModal();
    });

    backdrop.addEventListener('click', closeModal);
    const closeBtn = document.getElementById('mobileSheetCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });

    // Sync trigger label with any external tab changes
    updateTriggerLabel();
    currentTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(updateTriggerLabel, 50);
      });
    });

    // Also observe tab active changes
    const observer = new MutationObserver(() => {
      updateTriggerLabel();
    });
    currentTabButtons.forEach(b => {
      observer.observe(b, { attributes: true, attributeFilter: ['class', 'aria-selected'] });
    });

    // 4. Initialize Labelled Previous / Next Bottom Topic Navigation
    initBottomTopicNav(currentModId, currentTabButtons, hubPrefix);
  }

  function initBottomTopicNav(currentModId, currentTabButtons, hubPrefix) {
    if (document.getElementById('bottomTopicNav')) return;
    if (!currentTabButtons || !currentTabButtons.length) return;

    // Do not show on standalone BitMaster or bitmaster.html
    if (
      document.body.classList.contains('bitmaster-standalone-mode') ||
      window.location.pathname.endsWith('bitmaster.html') ||
      window.location.search.includes('standalone=1')
    ) {
      return;
    }

    const navEl = document.createElement('nav');
    navEl.className = 'bottom-topic-nav';
    navEl.id = 'bottomTopicNav';
    navEl.setAttribute('aria-label', 'Topic navigation');

    // Insert just before footer, or into main / body
    const footer = document.querySelector('footer.site-footer, footer');
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(navEl, footer);
    } else {
      const container = document.querySelector('main, .main-container, .editorial-container, #root');
      if (container) {
        container.appendChild(navEl);
      } else {
        document.body.appendChild(navEl);
      }
    }

    function getActiveIdx() {
      const idx = currentTabButtons.findIndex(b =>
        b.classList.contains('active') ||
        b.getAttribute('aria-selected') === 'true' ||
        b.classList.contains('bg-[#c8006b]')
      );
      return idx >= 0 ? idx : 0;
    }

    function getTabTitle(btn) {
      if (!btn) return '';
      const span = btn.querySelector('span:not(.badge)');
      if (span && span.textContent.trim()) return span.textContent.trim();
      return btn.textContent.trim();
    }

    function updateBottomNav() {
      const idx = getActiveIdx();
      const total = currentTabButtons.length;

      // BitMaster should NOT have the prev/next topic buttons
      const activeTab = currentTabButtons[idx];
      const tabKey = activeTab ? (activeTab.getAttribute('data-tab') || activeTab.textContent || '').toLowerCase() : '';
      if (tabKey.includes('arcade') || tabKey.includes('bitmaster')) {
        navEl.style.display = 'none';
        document.body.classList.remove('has-bottom-nav');
        return;
      } else {
        navEl.style.display = 'flex';
        document.body.classList.add('has-bottom-nav');
      }

      navEl.innerHTML = '';

      // --- 1. Previous Topic / Back to Hub Button ---
      const prevBtn = document.createElement('a');
      prevBtn.className = 'bottom-nav-btn prev-btn';

      if (idx === 0) {
        prevBtn.href = hubPrefix + 'index.html';
        prevBtn.className += ' is-hub';
        prevBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          <span class="bottom-nav-btn-text">Back to Hub</span>
        `;
      } else {
        prevBtn.href = '#';
        const targetTab = currentTabButtons[idx - 1];
        const title = getTabTitle(targetTab);
        prevBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          <span class="bottom-nav-btn-text">Prev: ${title}</span>
        `;
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          targetTab.click();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }

      // --- 2. Next Topic / Next Module Button ---
      const nextBtn = document.createElement('a');
      nextBtn.className = 'bottom-nav-btn next-btn';

      if (idx < total - 1) {
        nextBtn.href = '#';
        const targetTab = currentTabButtons[idx + 1];
        const title = getTabTitle(targetTab);
        nextBtn.innerHTML = `
          <span class="bottom-nav-btn-text">Next: ${title}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        `;
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          targetTab.click();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      } else {
        // Last topic of current module: link next module!
        const allMods = COURSE_DATA.flatMap(g => g.modules);
        const curModIdx = allMods.findIndex(m => m.id === currentModId);
        const nextMod = (curModIdx >= 0 && curModIdx < allMods.length - 1) ? allMods[curModIdx + 1] : null;

        if (nextMod) {
          nextBtn.href = hubPrefix + nextMod.url;
          nextBtn.className += ' is-next-module';
          nextBtn.innerHTML = `
            <span class="bottom-nav-btn-text">Next Module: ${nextMod.title}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          `;
        } else {
          nextBtn.href = hubPrefix + 'index.html';
          nextBtn.className += ' is-complete';
          nextBtn.innerHTML = `
            <span class="bottom-nav-btn-text">Course Complete ✓</span>
          `;
        }
      }

      navEl.appendChild(prevBtn);
      navEl.appendChild(nextBtn);
    }

    updateBottomNav();

    // Re-render when any tab button is clicked or changed
    currentTabButtons.forEach(b => {
      b.addEventListener('click', () => {
        setTimeout(updateBottomNav, 70);
      });
    });

    const observer = new MutationObserver(() => {
      updateBottomNav();
    });
    currentTabButtons.forEach(b => {
      observer.observe(b, { attributes: true, attributeFilter: ['class', 'aria-selected'] });
    });
  }

  function startInit() {
    initUniversalNav();
    // In React or SPA apps (like sort-lab), the header and tabs may render after DOMContentLoaded
    if (!document.getElementById('mobileSectionSwitcher')) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        initUniversalNav();
        if (document.getElementById('mobileSectionSwitcher') || attempts > 25) {
          clearInterval(interval);
        }
      }, 150);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInit);
  } else {
    startInit();
  }
})();
