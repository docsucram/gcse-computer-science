/**
 * GCSE Computer Science Revision Portal - Shared Navigation
 * Mobile Section Switcher & Dynamic Sheet Picker
 * Automatically enhances desktop .view-tabs into an accessible mobile section switcher.
 */

(function () {
  'use strict';

  function initMobileSectionSwitcher() {
    const headerInner = document.querySelector('.module-header-inner, .header-container');
    const viewTabs = document.querySelector('.view-tabs');
    if (!headerInner || !viewTabs) return;

    const tabButtons = Array.from(viewTabs.querySelectorAll('.view-tab-btn'));
    if (tabButtons.length === 0) return;

    // Check if switcher already injected
    if (document.getElementById('mobileSectionSwitcher')) return;

    // 1. Create Mobile Trigger Button
    const switcherWrap = document.createElement('div');
    switcherWrap.className = 'mobile-section-switcher';
    switcherWrap.id = 'mobileSectionSwitcher';

    const triggerBtn = document.createElement('button');
    triggerBtn.type = 'button';
    triggerBtn.className = 'mobile-section-trigger-btn';
    triggerBtn.id = 'mobileSectionTriggerBtn';
    triggerBtn.setAttribute('aria-expanded', 'false');
    triggerBtn.setAttribute('aria-haspopup', 'dialog');
    triggerBtn.setAttribute('aria-label', 'Change active section');

    const triggerContent = document.createElement('div');
    triggerContent.className = 'mobile-trigger-content';

    const triggerTag = document.createElement('span');
    triggerTag.className = 'mobile-trigger-tag';
    triggerTag.textContent = 'Section';

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

    // Append to headerInner
    headerInner.appendChild(switcherWrap);

    // 2. Create Modal / Bottom Sheet
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
        <span class="mobile-sheet-sub">Module Navigation</span>
        <h3 class="mobile-sheet-title" id="mobileSheetTitle">Choose Section</h3>
      </div>
      <button type="button" class="mobile-sheet-close-btn" id="mobileSheetCloseBtn" aria-label="Close section menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    const list = document.createElement('div');
    list.className = 'mobile-section-list';
    list.id = 'mobileSectionList';

    sheet.appendChild(sheetHeader);
    sheet.appendChild(list);
    modal.appendChild(backdrop);
    modal.appendChild(sheet);
    document.body.appendChild(modal);

    function getActiveTab() {
      return tabButtons.find(b => b.classList.contains('active')) || tabButtons[0];
    }

    function getTabTitle(btn) {
      const span = btn.querySelector('span');
      return span ? span.textContent.trim() : btn.textContent.trim();
    }

    function updateTriggerTitle() {
      const activeBtn = getActiveTab();
      if (activeBtn) {
        triggerTitle.textContent = getTabTitle(activeBtn);
      }
    }

    function renderSheetItems() {
      list.innerHTML = '';
      const activeBtn = getActiveTab();

      tabButtons.forEach(btn => {
        const title = getTabTitle(btn);
        const isActive = (btn === activeBtn);
        const svgEl = btn.querySelector('svg');
        const iconHtml = svgEl ? svgEl.outerHTML : '<span style="font-size:16px;">•</span>';

        const item = document.createElement('button');
        item.type = 'button';
        item.className = `mobile-section-item-btn ${isActive ? 'active' : ''}`;

        item.innerHTML = `
          <div class="mobile-item-icon">${iconHtml}</div>
          <div class="mobile-item-info">
            <span class="mobile-item-title">${title}</span>
          </div>
          <div class="mobile-item-badge-wrap">
            ${isActive ? '<span class="mobile-item-check-badge">Current Section ✓</span>' : ''}
          </div>
        `;

        item.addEventListener('click', () => {
          btn.click();
          closeModal();
          updateTriggerTitle();
        });

        list.appendChild(item);
      });
    }

    function openModal() {
      renderSheetItems();
      modal.style.display = 'block';
      // Force reflow for animation
      void modal.offsetWidth;
      modal.classList.add('open');
      triggerBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
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

    triggerBtn.addEventListener('click', openModal);
    backdrop.addEventListener('click', closeModal);
    const closeBtn = document.getElementById('mobileSheetCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });

    // Sync trigger title when user changes tabs through any means
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(updateTriggerTitle, 50);
      });
    });

    // Mutation observer to detect class changes on tabButtons
    const observer = new MutationObserver(() => {
      updateTriggerTitle();
    });
    tabButtons.forEach(btn => {
      observer.observe(btn, { attributes: true, attributeFilter: ['class'] });
    });

    // Initial title
    updateTriggerTitle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileSectionSwitcher);
  } else {
    initMobileSectionSwitcher();
  }
})();
