/**
 * GCSE SQL & Cyber Security Lab Module Logic
 * Pure Vanilla JavaScript (ES6+) - Zero build tools required
 * Aligned with AQA 8525 §3.6 (Cyber Security) & §3.7 (Relational Databases & SQL)
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. THEME & NAVIGATION
  // =========================================================================

  function initTheme() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');

    const urlParams = new URLSearchParams(window.location.search);
    const saved = urlParams.get('theme') || localStorage.getItem('gcse_theme') || localStorage.getItem('theme');
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }

    function updateIcons(dark) {
      if (sunIcon && moonIcon) {
        sunIcon.style.display = dark ? 'block' : 'none';
        moonIcon.style.display = dark ? 'none' : 'block';
      }
    }

    updateIcons(isDark);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentlyDark = document.documentElement.classList.contains('dark');
        if (currentlyDark) {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
          localStorage.setItem('theme', 'light');
          localStorage.setItem('gcse_theme', 'light');
          updateIcons(false);
        } else {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
          localStorage.setItem('theme', 'dark');
          localStorage.setItem('gcse_theme', 'dark');
          updateIcons(true);
        }
      });
    }
  }

  function initTabs() {
    const tabButtons = document.querySelectorAll('.view-tab-btn');
    const tabViews = document.querySelectorAll('.tab-view');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabViews.forEach(v => v.classList.remove('active'));

        btn.classList.add('active');
        const tabKey = btn.getAttribute('data-tab');
        const targetView = document.getElementById(`tab-${tabKey}`);
        if (targetView) targetView.classList.add('active');
      });
    });

    const initialHash = window.location.hash.replace('#', '');
    if (initialHash) {
      const targetBtn = document.querySelector(`.view-tab-btn[data-tab="${initialHash}"]`);
      if (targetBtn) targetBtn.click();
    }
  }

  // =========================================================================
  // 2. TAB 1: SCHOOL MIS & STORAGE ENGINE SIMULATOR (§3.7.1)
  // =========================================================================

  const COURSE_CATALOG = {
    'Computer Science': { teacher: 'Mr Turing', room: 'Lab C1' },
    'Mathematics': { teacher: 'Mrs Lovelace', room: 'Room M3' },
    'Physics': { teacher: 'Dr Faraday', room: 'Lab S2' },
    'Art & Design': { teacher: 'Ms Hepworth', room: 'Studio A4' },
    'History': { teacher: 'Mr Churchill', room: 'Room H1' },
    'French': { teacher: 'Mme Curie', room: 'Lang 04' },
    'Business Studies': { teacher: 'Mr Musk', room: 'Room B2' }
  };

  const INITIAL_SIM_DATA = {
    students: [
      {
        studentId: 101,
        name: 'Alice Smith',
        dob: '2009-03-14',
        address: '14 High Street, Oakham',
        form: '11A',
        phone: '07700 900142',
        medical: 'No known allergies'
      },
      {
        studentId: 102,
        name: 'Bob Jones',
        dob: '2008-11-20',
        address: '22 Station Road, Oakham',
        form: '11B',
        phone: '07700 900551',
        medical: 'Asthma inhaler carried'
      },
      {
        studentId: 103,
        name: 'Charlie Brown',
        dob: '2009-07-02',
        address: '5 Elm Close, Oakham',
        form: '10A',
        phone: '07700 900889',
        medical: 'Nut allergy (Severe)'
      },
      {
        studentId: 104,
        name: 'Daisy Patel',
        dob: '2009-01-18',
        address: '17 Willow Drive, Oakham',
        form: '11A',
        phone: '07700 900224',
        medical: 'No known allergies'
      },
      {
        studentId: 105,
        name: 'Ethan Clarke',
        dob: '2009-10-05',
        address: '42 Church Lane, Oakham',
        form: '10B',
        phone: '07700 900667',
        medical: 'Wears glasses for reading'
      },
      {
        studentId: 106,
        name: 'Fatima Al-Mansoor',
        dob: '2009-05-30',
        address: '9 Rutland Crescent, Oakham',
        form: '11C',
        phone: '07700 900338',
        medical: 'Hay fever'
      }
    ],
    enrollments: [
      { enrollmentId: 1, studentId: 101, subject: 'Computer Science', targetGrade: 'Grade 8', status: 'Active' },
      { enrollmentId: 2, studentId: 101, subject: 'Mathematics', targetGrade: 'Grade 9', status: 'Active' },
      { enrollmentId: 3, studentId: 101, subject: 'Physics', targetGrade: 'Grade 8', status: 'Active' },
      { enrollmentId: 4, studentId: 102, subject: 'Computer Science', targetGrade: 'Grade 7', status: 'Active' },
      { enrollmentId: 5, studentId: 102, subject: 'Business Studies', targetGrade: 'Grade 6', status: 'Active' },
      { enrollmentId: 6, studentId: 103, subject: 'Art & Design', targetGrade: 'Grade 8', status: 'Active' },
      { enrollmentId: 7, studentId: 104, subject: 'Mathematics', targetGrade: 'Grade 8', status: 'Active' },
      { enrollmentId: 8, studentId: 104, subject: 'Physics', targetGrade: 'Grade 7', status: 'Active' },
      { enrollmentId: 9, studentId: 104, subject: 'French', targetGrade: 'Grade 8', status: 'Active' },
      { enrollmentId: 10, studentId: 105, subject: 'Computer Science', targetGrade: 'Grade 6', status: 'Active' },
      { enrollmentId: 11, studentId: 105, subject: 'History', targetGrade: 'Grade 7', status: 'Active' },
      { enrollmentId: 12, studentId: 106, subject: 'Mathematics', targetGrade: 'Grade 9', status: 'Active' },
      { enrollmentId: 13, studentId: 106, subject: 'Computer Science', targetGrade: 'Grade 9', status: 'Active' },
      { enrollmentId: 14, studentId: 106, subject: 'Art & Design', targetGrade: 'Grade 7', status: 'Active' }
    ],
    flatFileRows: [
      { rowId: 1, studentId: 101, name: 'Alice Smith', address: '14 High Street, Oakham', form: '11A', subject: 'Computer Science', teacher: 'Mr Turing', room: 'Lab C1' },
      { rowId: 2, studentId: 101, name: 'Alice Smith', address: '14 High Street, Oakham', form: '11A', subject: 'Mathematics', teacher: 'Mrs Lovelace', room: 'Room M3' },
      { rowId: 3, studentId: 101, name: 'Alice Smith', address: '14 High Street, Oakham', form: '11A', subject: 'Physics', teacher: 'Dr Faraday', room: 'Lab S2' },
      { rowId: 4, studentId: 102, name: 'Bob Jones', address: '22 Station Road, Oakham', form: '11B', subject: 'Computer Science', teacher: 'Mr Turing', room: 'Lab C1' },
      { rowId: 5, studentId: 102, name: 'Bob Jones', address: '22 Station Road, Oakham', form: '11B', subject: 'Business Studies', teacher: 'Mr Musk', room: 'Room B2' },
      { rowId: 6, studentId: 103, name: 'Charlie Brown', address: '5 Elm Close, Oakham', form: '10A', subject: 'Art & Design', teacher: 'Ms Hepworth', room: 'Studio A4' },
      { rowId: 7, studentId: 104, name: 'Daisy Patel', address: '17 Willow Drive, Oakham', form: '11A', subject: 'Mathematics', teacher: 'Mrs Lovelace', room: 'Room M3' },
      { rowId: 8, studentId: 104, name: 'Daisy Patel', address: '17 Willow Drive, Oakham', form: '11A', subject: 'Physics', teacher: 'Dr Faraday', room: 'Lab S2' },
      { rowId: 9, studentId: 104, name: 'Daisy Patel', address: '17 Willow Drive, Oakham', form: '11A', subject: 'French', teacher: 'Mme Curie', room: 'Lang 04' },
      { rowId: 10, studentId: 105, name: 'Ethan Clarke', address: '42 Church Lane, Oakham', form: '10B', subject: 'Computer Science', teacher: 'Mr Turing', room: 'Lab C1' },
      { rowId: 11, studentId: 105, name: 'Ethan Clarke', address: '42 Church Lane, Oakham', form: '10B', subject: 'History', teacher: 'Mr Churchill', room: 'Room H1' },
      { rowId: 12, studentId: 106, name: 'Fatima Al-Mansoor', address: '9 Rutland Crescent, Oakham', form: '11C', subject: 'Mathematics', teacher: 'Mrs Lovelace', room: 'Room M3' },
      { rowId: 13, studentId: 106, name: 'Fatima Al-Mansoor', address: '9 Rutland Crescent, Oakham', form: '11C', subject: 'Computer Science', teacher: 'Mr Turing', room: 'Lab C1' },
      { rowId: 14, studentId: 106, name: 'Fatima Al-Mansoor', address: '9 Rutland Crescent, Oakham', form: '11C', subject: 'Art & Design', teacher: 'Ms Hepworth', room: 'Studio A4' }
    ]
  };

  let simState = JSON.parse(JSON.stringify(INITIAL_SIM_DATA));
  let currentStudentIndex = 0;
  let activeStorageMode = 'flatfile'; // 'flatfile' | 'relational'
  let nextEnrollmentId = 15;
  let nextFlatRowId = 15;
  let nextStudentId = 107;
  let lastModifiedStudentId = null;
  let lastModifiedRowIds = [];
  let lastModificationType = null; // 'added' | 'updated' | 'conflict'

  function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function showMisScreen(screenName) {
    const screenWelcome = document.getElementById('misScreenWelcome');
    const screenMenu = document.getElementById('misScreenMenu');
    const screenDatabase = document.getElementById('misScreenDatabase');

    if (screenWelcome) {
      const isWelcome = screenName === 'welcome';
      screenWelcome.classList.toggle('active', isWelcome);
      screenWelcome.style.display = isWelcome ? 'block' : 'none';
    }
    if (screenMenu) {
      const isMenu = screenName === 'menu';
      screenMenu.classList.toggle('active', isMenu);
      screenMenu.style.display = isMenu ? 'block' : 'none';
      if (isMenu) {
        renderMenuSearchResults('');
        const searchInput = document.getElementById('misMenuSearchInput');
        if (searchInput) searchInput.value = '';
      }
    }
    if (screenDatabase) {
      const isDb = screenName === 'database';
      screenDatabase.classList.toggle('active', isDb);
      screenDatabase.style.display = isDb ? 'block' : 'none';
    }
  }

  function renderMenuSearchResults(query) {
    const resultsContainer = document.getElementById('misSearchResults');
    if (!resultsContainer) return;
    resultsContainer.innerHTML = '';

    const clean = (query || '').trim().toLowerCase();
    // Keep find student blank until user types something in
    if (!clean) {
      return;
    }

    const filtered = simState.students.filter(s => {
      return s.name.toLowerCase().includes(clean) ||
             String(s.studentId).includes(clean) ||
             s.form.toLowerCase().includes(clean) ||
             s.address.toLowerCase().includes(clean);
    });

    if (filtered.length === 0) {
      const emptySpan = document.createElement('span');
      emptySpan.style.fontSize = '11.5px';
      emptySpan.style.color = '#8a8886';
      emptySpan.style.padding = '4px 2px';
      emptySpan.textContent = 'No matching pupils found in directory.';
      resultsContainer.appendChild(emptySpan);
      return;
    }

    filtered.forEach(s => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'mis-search-chip';
      chip.innerHTML = `<strong>${escapeHTML(s.name)}</strong> <code>${s.studentId}</code> <span>(${escapeHTML(s.form)})</span>`;
      chip.addEventListener('click', () => {
        const idx = simState.students.findIndex(x => x.studentId === s.studentId);
        if (idx !== -1) {
          currentStudentIndex = idx;
          lastModifiedStudentId = s.studentId;
          lastModificationType = 'updated';
          renderCurrentStudentForm();
          showMisScreen('database');
          renderStorageViews();
        }
      });
      resultsContainer.appendChild(chip);
    });
  }

  let isCreatingNewStudent = false;

  function startNewStudentEntry() {
    isCreatingNewStudent = true;
    showMisScreen('database');

    const btnMisCancelNew = document.getElementById('btnMisCancelNew');
    if (btnMisCancelNew) btnMisCancelNew.style.display = 'inline-flex';

    const btnMisSaveStudent = document.getElementById('btnMisSaveStudent');
    if (btnMisSaveStudent) {
      btnMisSaveStudent.classList.add('pulse-save');
    }

    const newId = nextStudentId;
    const formStudentId = document.getElementById('formStudentId');
    const formFullName = document.getElementById('formFullName');
    const formDOB = document.getElementById('formDOB');
    const formGroup = document.getElementById('formGroup');
    const formAddress = document.getElementById('formAddress');
    const formPhone = document.getElementById('formEmergencyPhone');
    const formMedical = document.getElementById('formMedicalNotes');

    if (formStudentId) formStudentId.value = newId;
    if (formFullName) {
      formFullName.value = '';
      setTimeout(() => formFullName.focus(), 80);
    }
    if (formDOB) formDOB.value = '2009-09-01';
    if (formGroup) formGroup.value = '10A';
    if (formAddress) formAddress.value = '';
    if (formPhone) formPhone.value = '';
    if (formMedical) formMedical.value = 'No known allergies';

    // Header updates
    const misAvatar = document.getElementById('misAvatar');
    const misHeaderName = document.getElementById('misHeaderName');
    const misHeaderId = document.getElementById('misHeaderId');
    const misHeaderForm = document.getElementById('misHeaderForm');
    const currentRecNum = document.getElementById('misCurrentRecNum');
    const totalRecCount = document.getElementById('misTotalRecCount');

    if (misAvatar) misAvatar.textContent = '➕';
    if (misHeaderName) misHeaderName.textContent = 'Admitting New Pupil (Unsaved)';
    if (misHeaderId) misHeaderId.textContent = newId;
    if (misHeaderForm) misHeaderForm.textContent = '10A';
    if (currentRecNum) currentRecNum.textContent = '*';
    if (totalRecCount) totalRecCount.textContent = `${simState.students.length} (+1)`;

    // Disable navigation while creating
    const btnRecFirst = document.getElementById('btnRecFirst');
    const btnRecPrev = document.getElementById('btnRecPrev');
    const btnRecNext = document.getElementById('btnRecNext');
    const btnRecLast = document.getElementById('btnRecLast');
    const btnDelete = document.getElementById('btnMisDeleteStudent');
    const jumpSelect = document.getElementById('misStudentJumpSelect');

    if (btnRecFirst) btnRecFirst.disabled = true;
    if (btnRecPrev) btnRecPrev.disabled = true;
    if (btnRecNext) btnRecNext.disabled = true;
    if (btnRecLast) btnRecLast.disabled = true;
    if (btnDelete) btnDelete.disabled = true;
    if (jumpSelect) jumpSelect.disabled = true;

    // Notice in courses list
    const coursesList = document.getElementById('misCoursesList');
    const enrollCountBadge = document.getElementById('misEnrollCountBadge');
    if (enrollCountBadge) enrollCountBadge.textContent = '0 Subjects';
    if (coursesList) {
      coursesList.innerHTML = `
        <div style="padding: 12px 14px; border: 1.5px dashed var(--accent-primary, #c8006b); border-radius: 6px; background: rgba(200, 0, 107, 0.05); color: var(--text-primary); font-size: 12px; line-height: 1.5;">
          <strong>📝 Enter Pupil Details:</strong> Type in Full Legal Name, Home Address, and Phone Number above, then click <strong>💾 Save Record</strong> to commit to the database. Computer Science will be assigned as initial GCSE course.
        </div>`;
    }
  }

  function cancelNewStudentEntry() {
    isCreatingNewStudent = false;
    const btnMisCancelNew = document.getElementById('btnMisCancelNew');
    if (btnMisCancelNew) btnMisCancelNew.style.display = 'none';

    const btnMisSaveStudent = document.getElementById('btnMisSaveStudent');
    if (btnMisSaveStudent) btnMisSaveStudent.classList.remove('pulse-save');

    const jumpSelect = document.getElementById('misStudentJumpSelect');
    if (jumpSelect) jumpSelect.disabled = false;
    const btnDelete = document.getElementById('btnMisDeleteStudent');
    if (btnDelete) btnDelete.disabled = false;

    renderCurrentStudentForm();
  }

  function initFlatFileSimulator() {
    // 1. DOM Element Cache
    const btnEnterMis = document.getElementById('btnEnterMis');
    const btnDirectStudentRecords = document.getElementById('btnDirectStudentRecords');
    const btnMisMainMenu = document.getElementById('btnMisMainMenu');
    const btnMisNavHome = document.getElementById('btnMisNavHome');

    const btnMenuAccessRecords = document.getElementById('btnMenuAccessRecords');
    const btnMenuNewStudent = document.getElementById('btnMenuNewStudent');
    const btnMenuInspectEngine = document.getElementById('btnMenuInspectEngine');
    const misMenuSearchInput = document.getElementById('misMenuSearchInput');

    const btnRecFirst = document.getElementById('btnRecFirst');
    const btnRecPrev = document.getElementById('btnRecPrev');
    const btnRecNext = document.getElementById('btnRecNext');
    const btnRecLast = document.getElementById('btnRecLast');
    const jumpSelect = document.getElementById('misStudentJumpSelect');

    const btnNewStudent = document.getElementById('btnMisNewStudent');
    const btnSaveStudent = document.getElementById('btnMisSaveStudent');
    const btnDeleteStudent = document.getElementById('btnMisDeleteStudent');
    const btnInduceMismatch = document.getElementById('btnMisInduceMismatch');
    const btnReset = document.getElementById('btnMisReset');

    const btnEnrollCourse = document.getElementById('btnMisEnrollCourse');
    const newCourseSelect = document.getElementById('misNewCourseSubject');

    const btnToggleFF = document.getElementById('btnToggleFlatFile');
    const btnToggleRel = document.getElementById('btnToggleRelational');

    const btnDemoUpdate = document.getElementById('btnDemoUpdateMismatch');
    const btnDemoDeletion = document.getElementById('btnDemoDeletionAnomaly');
    const btnDemoRedundancy = document.getElementById('btnDemoRedundancy');
    const btnFix = document.getElementById('btnFixMismatch');

    // 2. Portal Screen Navigation Listeners
    if (btnEnterMis) {
      btnEnterMis.addEventListener('click', () => {
        showMisScreen('menu');
      });
    }

    if (btnDirectStudentRecords) {
      btnDirectStudentRecords.addEventListener('click', () => {
        showMisScreen('database');
      });
    }

    if (btnMisMainMenu) {
      btnMisMainMenu.addEventListener('click', () => {
        if (isCreatingNewStudent) cancelNewStudentEntry();
        showMisScreen('menu');
      });
    }

    if (btnMisNavHome) {
      btnMisNavHome.addEventListener('click', () => {
        if (isCreatingNewStudent) cancelNewStudentEntry();
        showMisScreen('menu');
      });
    }

    if (btnMenuAccessRecords) {
      btnMenuAccessRecords.addEventListener('click', () => {
        if (isCreatingNewStudent) cancelNewStudentEntry();
        showMisScreen('database');
      });
    }

    if (btnMenuNewStudent) {
      btnMenuNewStudent.addEventListener('click', () => {
        startNewStudentEntry();
      });
    }

    if (btnMenuInspectEngine) {
      btnMenuInspectEngine.addEventListener('click', () => {
        if (isCreatingNewStudent) cancelNewStudentEntry();
        showMisScreen('database');
        const engineDeck = document.getElementById('storageSwitchDeck');
        if (engineDeck) engineDeck.scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (misMenuSearchInput) {
      misMenuSearchInput.addEventListener('input', (e) => {
        renderMenuSearchResults(e.target.value);
      });
    }

    // 3. Navigation Handlers within Student Form
    if (btnRecFirst) {
      btnRecFirst.addEventListener('click', () => {
        if (isCreatingNewStudent) cancelNewStudentEntry();
        if (simState.students.length > 0) {
          currentStudentIndex = 0;
          renderCurrentStudentForm();
        }
      });
    }

    if (btnRecPrev) {
      btnRecPrev.addEventListener('click', () => {
        if (isCreatingNewStudent) cancelNewStudentEntry();
        if (currentStudentIndex > 0) {
          currentStudentIndex--;
          renderCurrentStudentForm();
        }
      });
    }

    if (btnRecNext) {
      btnRecNext.addEventListener('click', () => {
        if (isCreatingNewStudent) cancelNewStudentEntry();
        if (currentStudentIndex < simState.students.length - 1) {
          currentStudentIndex++;
          renderCurrentStudentForm();
        }
      });
    }

    if (btnRecLast) {
      btnRecLast.addEventListener('click', () => {
        if (isCreatingNewStudent) cancelNewStudentEntry();
        if (simState.students.length > 0) {
          currentStudentIndex = simState.students.length - 1;
          renderCurrentStudentForm();
        }
      });
    }

    if (jumpSelect) {
      jumpSelect.addEventListener('change', () => {
        if (isCreatingNewStudent) cancelNewStudentEntry();
        const sId = Number(jumpSelect.value);
        const idx = simState.students.findIndex(s => s.studentId === sId);
        if (idx !== -1) {
          currentStudentIndex = idx;
          lastModifiedStudentId = sId;
          lastModificationType = 'updated';
          renderCurrentStudentForm();
          renderStorageViews();
        }
      });
    }

    // 4. School MIS Record Action Handlers
    if (btnNewStudent) {
      btnNewStudent.addEventListener('click', () => {
        startNewStudentEntry();
      });
    }

    const btnMisCancelNew = document.getElementById('btnMisCancelNew');
    if (btnMisCancelNew) {
      btnMisCancelNew.addEventListener('click', () => {
        cancelNewStudentEntry();
      });
    }

    if (btnSaveStudent) {
      btnSaveStudent.addEventListener('click', () => {
        const nameInput = document.getElementById('formFullName');
        const dobInput = document.getElementById('formDOB');
        const formSelect = document.getElementById('formGroup');
        const addressInput = document.getElementById('formAddress');
        const phoneInput = document.getElementById('formEmergencyPhone');
        const medicalInput = document.getElementById('formMedicalNotes');

        const enteredName = nameInput ? nameInput.value.trim() : '';

        if (isCreatingNewStudent) {
          if (!enteredName) {
            alert('Please type in the pupil\'s Full Legal Name before saving.');
            if (nameInput) nameInput.focus();
            return;
          }

          const newId = nextStudentId++;
          const enteredDob = (dobInput && dobInput.value) ? dobInput.value : '2009-09-01';
          const enteredForm = (formSelect && formSelect.value) ? formSelect.value : '10A';
          const enteredAddress = (addressInput && addressInput.value.trim()) ? addressInput.value.trim() : 'Oakham, UK';
          const enteredPhone = (phoneInput && phoneInput.value.trim()) ? phoneInput.value.trim() : '07700 900000';
          const enteredMedical = (medicalInput && medicalInput.value.trim()) ? medicalInput.value.trim() : 'No known allergies';

          const newStudent = {
            studentId: newId,
            name: enteredName,
            dob: enteredDob,
            address: enteredAddress,
            form: enteredForm,
            phone: enteredPhone,
            medical: enteredMedical
          };

          simState.students.push(newStudent);

          // Add default enrollment
          const defSubject = 'Computer Science';
          const catalogEntry = COURSE_CATALOG[defSubject];
          const newEnrollmentId = nextEnrollmentId++;
          simState.enrollments.push({
            enrollmentId: newEnrollmentId,
            studentId: newId,
            subject: defSubject,
            targetGrade: 'Grade 7',
            status: 'Active'
          });

          // Add to flat file
          const newRowId = nextFlatRowId++;
          simState.flatFileRows.push({
            rowId: newRowId,
            studentId: newId,
            name: newStudent.name,
            address: newStudent.address,
            form: newStudent.form,
            subject: defSubject,
            teacher: catalogEntry.teacher,
            room: catalogEntry.room
          });

          isCreatingNewStudent = false;
          const cancelBtn = document.getElementById('btnMisCancelNew');
          if (cancelBtn) cancelBtn.style.display = 'none';
          btnSaveStudent.classList.remove('pulse-save');

          const jumpSelect = document.getElementById('misStudentJumpSelect');
          if (jumpSelect) jumpSelect.disabled = false;
          const btnDelete = document.getElementById('btnMisDeleteStudent');
          if (btnDelete) btnDelete.disabled = false;

          currentStudentIndex = simState.students.length - 1;
          lastModifiedStudentId = newId;
          lastModifiedRowIds = [newRowId];
          lastModificationType = 'added';

          renderCurrentStudentForm();
          renderStorageViews();
          scrollHighlightedRowIntoView();
          return;
        }

        if (simState.students.length === 0) return;
        const currentStudent = simState.students[currentStudentIndex];
        if (!currentStudent) return;

        const oldAddress = currentStudent.address;
        const newAddress = addressInput ? addressInput.value.trim() : oldAddress;

        currentStudent.name = enteredName || currentStudent.name;
        currentStudent.dob = dobInput ? dobInput.value : currentStudent.dob;
        currentStudent.form = formSelect ? formSelect.value : currentStudent.form;
        currentStudent.address = newAddress;
        currentStudent.phone = phoneInput ? phoneInput.value.trim() : currentStudent.phone;
        currentStudent.medical = medicalInput ? medicalInput.value.trim() : currentStudent.medical;

        // In flat-file, save updates all rows for this student, synching them
        const affectedRowIds = [];
        simState.flatFileRows.forEach(r => {
          if (r.studentId === currentStudent.studentId) {
            r.name = currentStudent.name;
            r.address = newAddress;
            r.form = currentStudent.form;
            affectedRowIds.push(r.rowId);
          }
        });

        lastModifiedStudentId = currentStudent.studentId;
        lastModifiedRowIds = affectedRowIds;
        lastModificationType = 'updated';

        renderCurrentStudentForm();
        renderStorageViews();
      });
    }

    if (btnDeleteStudent) {
      btnDeleteStudent.addEventListener('click', () => {
        if (simState.students.length === 0) return;
        const s = simState.students[currentStudentIndex];
        if (!s) return;

        const sId = s.studentId;
        const sName = s.name;

        if (!confirm(`Are you sure you want to delete pupil record for ${sName} (ID: ${sId})?\n\nThis will remove their profile and all course enrollments from the database.`)) {
          return;
        }

        // Remove from students
        simState.students.splice(currentStudentIndex, 1);
        // Remove from enrollments
        simState.enrollments = simState.enrollments.filter(e => e.studentId !== sId);
        // Remove from flat file
        simState.flatFileRows = simState.flatFileRows.filter(r => r.studentId !== sId);

        if (currentStudentIndex >= simState.students.length) {
          currentStudentIndex = Math.max(0, simState.students.length - 1);
        }

        lastModifiedStudentId = simState.students[currentStudentIndex] ? simState.students[currentStudentIndex].studentId : null;
        lastModifiedRowIds = [];
        lastModificationType = 'deleted';

        renderCurrentStudentForm();
        renderStorageViews();
      });
    }

    if (btnInduceMismatch) {
      btnInduceMismatch.addEventListener('click', () => {
        triggerUpdateAnomalyDemo();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        simState = JSON.parse(JSON.stringify(INITIAL_SIM_DATA));
        currentStudentIndex = 0;
        nextEnrollmentId = 15;
        nextFlatRowId = 15;
        nextStudentId = 107;
        lastModifiedStudentId = null;
        lastModifiedRowIds = [];
        lastModificationType = null;
        renderCurrentStudentForm();
        renderStorageViews();
      });
    }

    // 5. Enroll Course Handler
    if (btnEnrollCourse && newCourseSelect) {
      btnEnrollCourse.addEventListener('click', () => {
        if (simState.students.length === 0) return;
        const student = simState.students[currentStudentIndex];
        if (!student) return;

        const subj = newCourseSelect.value;
        const catalogEntry = COURSE_CATALOG[subj] || { teacher: 'Staff', room: 'Main Hall' };

        // Check if student already enrolled
        const already = simState.enrollments.some(e => e.studentId === student.studentId && e.subject === subj);
        if (already) {
          alert(`${student.name} is already enrolled in ${subj}.`);
          return;
        }

        const newEnrId = nextEnrollmentId++;
        simState.enrollments.push({
          enrollmentId: newEnrId,
          studentId: student.studentId,
          subject: subj,
          targetGrade: 'Grade 7',
          status: 'Active'
        });

        const newFId = nextFlatRowId++;
        simState.flatFileRows.push({
          rowId: newFId,
          studentId: student.studentId,
          name: student.name,
          address: student.address,
          form: student.form,
          subject: subj,
          teacher: catalogEntry.teacher,
          room: catalogEntry.room
        });

        lastModifiedStudentId = student.studentId;
        lastModifiedRowIds = [newFId];
        lastModificationType = 'added';

        renderCurrentStudentForm();
        renderStorageViews();
      });
    }

    // 6. Storage Architecture View Toggle
    if (btnToggleFF) {
      btnToggleFF.addEventListener('click', () => {
        setStorageMode('flatfile');
      });
    }

    if (btnToggleRel) {
      btnToggleRel.addEventListener('click', () => {
        setStorageMode('relational');
      });
    }

    // 7. Anomaly Demonstration Handlers
    if (btnDemoUpdate) {
      btnDemoUpdate.addEventListener('click', () => {
        triggerUpdateAnomalyDemo();
      });
    }

    if (btnDemoDeletion) {
      btnDemoDeletion.addEventListener('click', () => {
        triggerDeletionAnomalyDemo();
      });
    }

    if (btnDemoRedundancy) {
      btnDemoRedundancy.addEventListener('click', () => {
        triggerDataRedundancyDemo();
      });
    }

    if (btnFix) {
      btnFix.addEventListener('click', () => {
        synchronizeFlatFile();
      });
    }

    // Initial render
    renderCurrentStudentForm();
    renderStorageViews();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('screen') === 'menu') {
      showMisScreen('menu');
    } else if (urlParams.get('screen') === 'database') {
      showMisScreen('database');
    }
    if (urlParams.get('storage') === 'relational') {
      setStorageMode('relational');
    }
    if (urlParams.get('action') === 'new') {
      startNewStudentEntry();
    }
    if (urlParams.get('anomaly') === 'mismatch') {
      triggerUpdateAnomalyDemo();
    } else if (urlParams.get('anomaly') === 'deletion') {
      triggerDeletionAnomalyDemo();
    }
  }

  function setStorageMode(mode) {
    activeStorageMode = mode;
    const btnToggleFF = document.getElementById('btnToggleFlatFile');
    const btnToggleRel = document.getElementById('btnToggleRelational');
    const viewFF = document.getElementById('viewFlatFile');
    const viewRel = document.getElementById('viewRelational');

    if (mode === 'flatfile') {
      if (btnToggleFF) btnToggleFF.classList.add('active');
      if (btnToggleRel) btnToggleRel.classList.remove('active');
      if (viewFF) viewFF.classList.add('active');
      if (viewRel) viewRel.classList.remove('active');
    } else {
      if (btnToggleFF) btnToggleFF.classList.remove('active');
      if (btnToggleRel) btnToggleRel.classList.add('active');
      if (viewFF) viewFF.classList.remove('active');
      if (viewRel) viewRel.classList.add('active');
    }

    renderStorageViews();
  }

  function scrollHighlightedRowIntoView() {
    setTimeout(() => {
      const activeSection = (activeStorageMode === 'flatfile')
        ? document.getElementById('viewFlatFile')
        : document.getElementById('viewRelational');
      if (!activeSection) return;
      const highlighted = activeSection.querySelector('.row-highlight-added, .row-highlight-updated, .row-highlight-deleted');
      if (highlighted) {
        highlighted.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 80);
  }

  function triggerUpdateAnomalyDemo() {
    // Specifically desynchronize Row 1 of Alice Smith in flat file
    const aliceRows = simState.flatFileRows.filter(r => r.studentId === 101);
    if (aliceRows.length >= 2) {
      aliceRows[0].address = '99 Victoria Road, Oakham [MISMATCHED]';
      // Ensure other rows stay on 14 High Street
      aliceRows.slice(1).forEach(r => {
        r.address = '14 High Street, Oakham';
      });

      lastModifiedStudentId = 101;
      lastModifiedRowIds = [aliceRows[0].rowId];
      lastModificationType = 'conflict';

      setStorageMode('flatfile');
      renderCurrentStudentForm();
      renderStorageViews();
    } else {
      simState = JSON.parse(JSON.stringify(INITIAL_SIM_DATA));
      currentStudentIndex = 0;
      triggerUpdateAnomalyDemo();
    }
  }

  function triggerDeletionAnomalyDemo() {
    // Charlie Brown (103) drops his only subject
    const charlieFlatIdx = simState.flatFileRows.findIndex(r => r.studentId === 103);
    const charlieEnrollIdx = simState.enrollments.findIndex(e => e.studentId === 103);

    if (charlieFlatIdx !== -1) {
      simState.flatFileRows.splice(charlieFlatIdx, 1);
    }
    if (charlieEnrollIdx !== -1) {
      simState.enrollments.splice(charlieEnrollIdx, 1);
    }

    lastModifiedStudentId = 103;
    lastModifiedRowIds = [];
    lastModificationType = 'deleted';

    setStorageMode('flatfile');
    renderCurrentStudentForm();
    renderStorageViews();
  }

  function triggerDataRedundancyDemo() {
    // Enroll Daisy in 2 additional subjects to showcase redundancy
    const subjectsToAdd = ['Computer Science', 'Business Studies'];
    const addedFIds = [];
    subjectsToAdd.forEach(subj => {
      const hasFlat = simState.flatFileRows.some(r => r.studentId === 104 && r.subject === subj);
      if (!hasFlat) {
        const cat = COURSE_CATALOG[subj];
        simState.enrollments.push({
          enrollmentId: nextEnrollmentId++,
          studentId: 104,
          subject: subj,
          targetGrade: 'Grade 8',
          status: 'Active'
        });
        const fId = nextFlatRowId++;
        addedFIds.push(fId);
        simState.flatFileRows.push({
          rowId: fId,
          studentId: 104,
          name: 'Daisy Patel',
          address: '17 Willow Drive, Oakham',
          form: '11A',
          subject: subj,
          teacher: cat.teacher,
          room: cat.room
        });
      }
    });

    const daisyIdx = simState.students.findIndex(s => s.studentId === 104);
    if (daisyIdx !== -1) currentStudentIndex = daisyIdx;
    lastModifiedStudentId = 104;
    lastModifiedRowIds = addedFIds;
    lastModificationType = 'added';

    setStorageMode('flatfile');
    renderCurrentStudentForm();
    renderStorageViews();
  }

  function synchronizeFlatFile() {
    // Synchronize all flat file rows to the canonical address of each student
    simState.students.forEach(s => {
      simState.flatFileRows.forEach(r => {
        if (r.studentId === s.studentId) {
          r.name = s.name;
          r.address = s.address;
          r.form = s.form;
        }
      });
    });

    lastModifiedStudentId = 101;
    lastModifiedRowIds = simState.flatFileRows.filter(r => r.studentId === 101).map(r => r.rowId);
    lastModificationType = 'updated';

    renderCurrentStudentForm();
    renderStorageViews();
  }

  function renderCurrentStudentForm() {
    const student = simState.students[currentStudentIndex];

    const currentRecNum = document.getElementById('misCurrentRecNum');
    const totalRecCount = document.getElementById('misTotalRecCount');
    const btnRecFirst = document.getElementById('btnRecFirst');
    const btnRecPrev = document.getElementById('btnRecPrev');
    const btnRecNext = document.getElementById('btnRecNext');
    const btnRecLast = document.getElementById('btnRecLast');
    const jumpSelect = document.getElementById('misStudentJumpSelect');

    const totalStudents = simState.students.length;
    if (currentRecNum) currentRecNum.textContent = totalStudents > 0 ? (currentStudentIndex + 1) : 0;
    if (totalRecCount) totalRecCount.textContent = totalStudents;

    if (btnRecFirst) btnRecFirst.disabled = (currentStudentIndex <= 0);
    if (btnRecPrev) btnRecPrev.disabled = (currentStudentIndex <= 0);
    if (btnRecNext) btnRecNext.disabled = (currentStudentIndex >= totalStudents - 1);
    if (btnRecLast) btnRecLast.disabled = (currentStudentIndex >= totalStudents - 1);

    // Refresh jump select options
    if (jumpSelect) {
      jumpSelect.innerHTML = '';
      simState.students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.studentId;
        opt.textContent = `${s.name} (ID: ${s.studentId})`;
        if (student && s.studentId === student.studentId) opt.selected = true;
        jumpSelect.appendChild(opt);
      });
    }

    if (!student) {
      // Empty student state
      const misAvatar = document.getElementById('misAvatar');
      const misHeaderName = document.getElementById('misHeaderName');
      const misHeaderId = document.getElementById('misHeaderId');
      const misHeaderForm = document.getElementById('misHeaderForm');
      if (misAvatar) misAvatar.textContent = '--';
      if (misHeaderName) misHeaderName.textContent = 'No Student Records';
      if (misHeaderId) misHeaderId.textContent = '---';
      if (misHeaderForm) misHeaderForm.textContent = 'None';
      return;
    }

    // Header card
    const misAvatar = document.getElementById('misAvatar');
    const misHeaderName = document.getElementById('misHeaderName');
    const misHeaderId = document.getElementById('misHeaderId');
    const misHeaderForm = document.getElementById('misHeaderForm');

    if (misAvatar) misAvatar.textContent = getInitials(student.name);
    if (misHeaderName) misHeaderName.textContent = student.name;
    if (misHeaderId) misHeaderId.textContent = student.studentId;
    if (misHeaderForm) misHeaderForm.textContent = student.form;

    // Field inputs
    const formStudentId = document.getElementById('formStudentId');
    const formFullName = document.getElementById('formFullName');
    const formDOB = document.getElementById('formDOB');
    const formGroup = document.getElementById('formGroup');
    const formAddress = document.getElementById('formAddress');
    const formPhone = document.getElementById('formEmergencyPhone');
    const formMedical = document.getElementById('formMedicalNotes');

    if (formStudentId) formStudentId.value = student.studentId;
    if (formFullName) formFullName.value = student.name;
    if (formDOB) formDOB.value = student.dob;
    if (formGroup) formGroup.value = student.form;
    if (formAddress) formAddress.value = student.address;
    if (formPhone) formPhone.value = student.phone;
    if (formMedical) formMedical.value = student.medical;

    // Conflict indicator on current student's address in the form
    const conflictTag = document.getElementById('formAddressConflictTag');
    const studentFlatRows = simState.flatFileRows.filter(r => r.studentId === student.studentId);
    const distinctAddresses = Array.from(new Set(studentFlatRows.map(r => r.address)));
    const hasStudentConflict = distinctAddresses.length > 1;

    if (conflictTag) {
      conflictTag.style.display = hasStudentConflict ? 'inline-block' : 'none';
    }

    // Render Enrolled Courses
    const coursesList = document.getElementById('misCoursesList');
    const enrollCountBadge = document.getElementById('misEnrollCountBadge');
    const studentEnrs = simState.enrollments.filter(e => e.studentId === student.studentId);

    if (enrollCountBadge) {
      enrollCountBadge.textContent = `${studentEnrs.length} Subject${studentEnrs.length === 1 ? '' : 's'}`;
    }

    if (coursesList) {
      coursesList.innerHTML = '';
      if (studentEnrs.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'mis-empty-courses';
        emptyDiv.textContent = 'No subjects currently enrolled for this student.';
        coursesList.appendChild(emptyDiv);
      } else {
        studentEnrs.forEach(enr => {
          const card = document.createElement('div');
          card.className = 'mis-course-card';
          card.innerHTML = `
            <div class="mis-course-info">
              <span class="mis-course-name">${escapeHTML(enr.subject)}</span>
              <span class="mis-course-meta">Target: <strong>${escapeHTML(enr.targetGrade || 'Grade 7')}</strong> • Active</span>
            </div>
            <button type="button" class="mis-btn-drop" data-subject="${escapeHTML(enr.subject)}">Drop</button>
          `;

          const dropBtn = card.querySelector('.mis-btn-drop');
          if (dropBtn) {
            dropBtn.addEventListener('click', () => {
              // Drop this subject
              const subj = enr.subject;
              const enrIdx = simState.enrollments.findIndex(e => e.studentId === student.studentId && e.subject === subj);
              const flatIdx = simState.flatFileRows.findIndex(r => r.studentId === student.studentId && r.subject === subj);

              if (enrIdx !== -1) simState.enrollments.splice(enrIdx, 1);
              if (flatIdx !== -1) simState.flatFileRows.splice(flatIdx, 1);

              lastModifiedStudentId = student.studentId;
              lastModifiedRowIds = [];
              lastModificationType = 'deleted';

              renderCurrentStudentForm();
              renderStorageViews();
            });
          }

          coursesList.appendChild(card);
        });
      }
    }
  }

  function renderStorageViews() {
    // 1. Analyze Flat-File for Redundancies and Anomaly Conflicts
    const studentAddressMap = {};
    const studentSeenMap = {};
    const conflictStudentIds = new Set();
    let redundantCellCount = 0;

    // First pass: identify conflicts across flat-file rows
    simState.flatFileRows.forEach(r => {
      if (!studentAddressMap[r.studentId]) {
        studentAddressMap[r.studentId] = r.address;
      } else if (studentAddressMap[r.studentId] !== r.address) {
        conflictStudentIds.add(r.studentId);
      }
    });

    // Check if Charlie was deleted from flat file entirely (Deletion Anomaly check)
    const charlieInStudents = simState.students.some(s => s.studentId === 103);
    const charlieInFlat = simState.flatFileRows.some(r => r.studentId === 103);
    const hasDeletionAnomaly = charlieInStudents && !charlieInFlat;

    // 2. Render Flat-File Table
    const ffBody = document.getElementById('flatFileTableBody');
    const ffCountBadge = document.getElementById('ffRowCountBadge');

    if (ffCountBadge) {
      ffCountBadge.textContent = `${simState.flatFileRows.length} Rows Stored`;
    }

    if (ffBody) {
      ffBody.innerHTML = '';
      if (simState.flatFileRows.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="9" style="text-align: center; padding: 20px; color: #94a3b8;">No records stored in spreadsheet.</td>';
        ffBody.appendChild(tr);
      } else {
        simState.flatFileRows.forEach(r => {
          const isRepeated = !!studentSeenMap[r.studentId];
          studentSeenMap[r.studentId] = true;

          if (isRepeated) {
            redundantCellCount += 3; // Name, Address, Form repeated
          }

          const isConflictRow = conflictStudentIds.has(r.studentId);
          const isHighlighted = (lastModificationType && (
            lastModifiedRowIds.includes(r.rowId) ||
            (lastModifiedRowIds.length === 0 && r.studentId === lastModifiedStudentId)
          ));

          const tr = document.createElement('tr');
          let classList = [];
          if (isConflictRow) classList.push('row-conflict');
          if (isHighlighted) classList.push(`row-highlight-${lastModificationType}`);
          if (classList.length > 0) tr.className = classList.join(' ');

          tr.setAttribute('data-row-id', r.rowId);
          tr.setAttribute('data-student-id', r.studentId);

          tr.innerHTML = `
            <td><strong>#${r.rowId}</strong></td>
            <td><code>${r.studentId}</code></td>
            <td class="${isRepeated ? 'cell-redundant' : ''}">
              <strong>${escapeHTML(r.name)}</strong>
              ${isRepeated ? '<span class="tag-redundant">Repeated</span>' : ''}
            </td>
            <td class="${isConflictRow ? 'cell-conflict' : isRepeated ? 'cell-redundant' : ''}">
              ${escapeHTML(r.address)}
              ${isConflictRow ? '<span class="tag-conflict">⚠️ Mismatch</span>' : isRepeated ? '<span class="tag-redundant">Repeated</span>' : ''}
            </td>
            <td class="${isRepeated ? 'cell-redundant' : ''}">
              ${escapeHTML(r.form)}
            </td>
            <td><strong>${escapeHTML(r.subject)}</strong></td>
            <td>${escapeHTML(r.teacher)}</td>
            <td><code>${escapeHTML(r.room)}</code></td>
            <td style="text-align: center;">
              <button type="button" class="tbl-row-btn btn-row-edit" title="Edit this row only to create/test update anomaly" data-rowid="${r.rowId}">
                ⚡ Edit Row
              </button>
              <button type="button" class="tbl-row-btn btn-row-del" title="Delete this specific spreadsheet row" data-rowid="${r.rowId}">
                🗑️
              </button>
            </td>
          `;

          // Event listeners for row action buttons
          const editBtn = tr.querySelector('.btn-row-edit');
          if (editBtn) {
            editBtn.addEventListener('click', () => {
              const row = simState.flatFileRows.find(x => x.rowId === r.rowId);
              if (!row) return;
              const newAddr = prompt(`Edit Address for Row #${row.rowId} (${row.name}) ONLY:\n\nNotice: If other rows exist for this student, changing this row alone creates an Update Anomaly!`, row.address);
              if (newAddr !== null && newAddr.trim() !== '') {
                row.address = newAddr.trim();
                lastModifiedStudentId = row.studentId;
                lastModifiedRowIds = [row.rowId];
                lastModificationType = 'conflict';
                renderCurrentStudentForm();
                renderStorageViews();
              }
            });
          }

          const delBtn = tr.querySelector('.btn-row-del');
          if (delBtn) {
            delBtn.addEventListener('click', () => {
              const fIdx = simState.flatFileRows.findIndex(x => x.rowId === r.rowId);
              if (fIdx !== -1) {
                simState.flatFileRows.splice(fIdx, 1);
                lastModifiedStudentId = r.studentId;
                lastModifiedRowIds = [];
                lastModificationType = 'deleted';
                renderCurrentStudentForm();
                renderStorageViews();
              }
            });
          }

          ffBody.appendChild(tr);
        });
      }
    }

    // 3. Mismatch Banner Logic
    const mismatchBanner = document.getElementById('simMismatchBanner');
    const btnFix = document.getElementById('btnFixMismatch');

    if (mismatchBanner) {
      if (conflictStudentIds.size > 0) {
        mismatchBanner.style.display = 'flex';
        mismatchBanner.className = 'mismatch-banner alert-mismatch';

        const conflictingNames = Array.from(conflictStudentIds).map(sId => {
          const st = simState.students.find(s => s.studentId === sId);
          return st ? `${st.name} (ID: ${sId})` : `Student ID: ${sId}`;
        }).join(', ');

        mismatchBanner.innerHTML = `
          <div class="mismatch-header">
            <h4 class="mismatch-title">
              <span>🚨</span>
              CRITICAL DATA INCONSISTENCY DETECTED (Update Anomaly)
            </h4>
            <span class="mismatch-badge">High Data Integrity Risk</span>
          </div>
          <div class="mismatch-body">
            Conflicting address records were found across spreadsheet rows for <strong>${escapeHTML(conflictingNames)}</strong>!
            Because student details are repeated across multiple rows in a flat-file database, modifying one row without updating every duplicate row corrupts the database.
          </div>
          <div class="mismatch-tip">
            💡 <strong>Why the Relational Database Prevents This:</strong> In Table 1 (<code>Students</code>), each student's address is stored in exactly <strong>one single cell</strong>. An update anomaly is mathematically impossible!
          </div>
        `;
        if (btnFix) btnFix.style.display = 'inline-block';
      } else if (hasDeletionAnomaly) {
        mismatchBanner.style.display = 'flex';
        mismatchBanner.className = 'mismatch-banner alert-mismatch';
        mismatchBanner.innerHTML = `
          <div class="mismatch-header">
            <h4 class="mismatch-title">
              <span>⚠️</span>
              DELETION ANOMALY DETECTED (Accidental Profile Deletion)
            </h4>
            <span class="mismatch-badge">Data Loss Trap</span>
          </div>
          <div class="mismatch-body">
            Charlie Brown dropped his only GCSE subject (Art &amp; Design). In the Flat-File spreadsheet, deleting that row completely wiped out Charlie's home address, emergency telephone, and entire record from the school!
          </div>
          <div class="mismatch-tip">
            💡 <strong>Why the Relational Database Prevents This:</strong> In Table 1 (<code>Students</code>), Charlie still safely exists. Dropping a course only deletes 1 row from Table 2 (<code>Enrollments</code>).
          </div>
        `;
        if (btnFix) btnFix.style.display = 'none';
      } else {
        mismatchBanner.style.display = 'none';
        if (btnFix) btnFix.style.display = 'none';
      }
    }

    // 4. Update Flat-File Metrics
    const metricRedundant = document.getElementById('metricRedundantCells');
    const metricIntegrity = document.getElementById('metricIntegrityScore');
    const metricDesc = document.getElementById('metricIntegrityDesc');
    const metricWaste = document.getElementById('metricStorageWaste');

    if (metricRedundant) metricRedundant.textContent = redundantCellCount;
    if (metricIntegrity) {
      if (conflictStudentIds.size > 0) {
        metricIntegrity.textContent = '35%';
        metricIntegrity.className = 'metric-num text-danger';
        if (metricDesc) metricDesc.textContent = 'Contradictory rows found!';
      } else {
        metricIntegrity.textContent = '100%';
        metricIntegrity.className = 'metric-num';
        if (metricDesc) metricDesc.textContent = 'All duplicate rows currently match.';
      }
    }
    if (metricWaste) {
      const wastePct = Math.round((redundantCellCount / Math.max(1, simState.flatFileRows.length * 7)) * 100);
      metricWaste.textContent = `+${wastePct}%`;
    }

    // 5. Render Relational Tables
    const relStudentsBody = document.getElementById('relStudentsTableBody');
    const relStudentsCount = document.getElementById('relStudentsCount');

    if (relStudentsCount) {
      relStudentsCount.textContent = `${simState.students.length} Pupils Registered`;
    }

    if (relStudentsBody) {
      relStudentsBody.innerHTML = '';
      simState.students.forEach(s => {
        const enrCount = simState.enrollments.filter(e => e.studentId === s.studentId).length;
        const isHighlighted = (lastModificationType && s.studentId === lastModifiedStudentId);
        const tr = document.createElement('tr');
        if (isHighlighted) tr.className = `row-highlight-${lastModificationType}`;
        tr.setAttribute('data-student-id', s.studentId);

        tr.innerHTML = `
          <td><strong><span class="badge-pk">PK</span> ${s.studentId}</strong></td>
          <td><strong>${escapeHTML(s.name)}</strong></td>
          <td><code>${escapeHTML(s.dob)}</code></td>
          <td>${escapeHTML(s.address)}</td>
          <td><span class="mis-field-tag">${escapeHTML(s.form)}</span></td>
          <td>${escapeHTML(s.phone)}</td>
          <td style="text-align: center;"><span class="mis-enrollment-badge">${enrCount}</span></td>
        `;
        relStudentsBody.appendChild(tr);
      });
    }

    const relEnrollBody = document.getElementById('relEnrollmentsTableBody');
    const relEnrollCount = document.getElementById('relEnrollmentsCount');

    if (relEnrollCount) {
      relEnrollCount.textContent = `${simState.enrollments.length} Course Enrollments`;
    }

    if (relEnrollBody) {
      relEnrollBody.innerHTML = '';
      simState.enrollments.forEach(e => {
        const isHighlighted = (lastModificationType && e.studentId === lastModifiedStudentId);
        const tr = document.createElement('tr');
        if (isHighlighted) tr.className = `row-highlight-${lastModificationType}`;
        tr.setAttribute('data-student-id', e.studentId);
        tr.setAttribute('data-enrollment-id', e.enrollmentId);

        tr.innerHTML = `
          <td><strong><span class="badge-pk">PK</span> ${e.enrollmentId}</strong></td>
          <td><span class="badge-fk">FK</span> <code>${e.studentId}</code></td>
          <td><strong>${escapeHTML(e.subject)}</strong></td>
          <td><span class="mis-field-tag">${escapeHTML(e.targetGrade || 'Grade 7')}</span></td>
          <td style="text-align: center;"><span class="mis-status-badge">Active</span></td>
        `;
        relEnrollBody.appendChild(tr);
      });
    }

    // 6. Update Storage Meta Bar Banner
    const metaBar = document.getElementById('storageMetaBanner');
    if (metaBar) {
      if (activeStorageMode === 'flatfile') {
        metaBar.innerHTML = `
          <div class="meta-pill-group">
            <span class="meta-pill pill-warn">Engine: Single Sheet (Flat-File)</span>
            <span class="meta-pill ${redundantCellCount > 0 ? 'pill-warn' : 'pill-success'}">Duplicated Cells: ${redundantCellCount}</span>
            <span class="meta-pill ${conflictStudentIds.size > 0 ? 'pill-danger' : 'pill-info'}">
              ${conflictStudentIds.size > 0 ? '⚠️ Data Inconsistency Active!' : 'Status: Synchronized'}
            </span>
          </div>
          <div>Risk: Vulnerable to Update, Deletion &amp; Insertion Anomalies</div>
        `;
      } else {
        metaBar.innerHTML = `
          <div class="meta-pill-group">
            <span class="meta-pill pill-success">Engine: Relational (Normalized 3NF)</span>
            <span class="meta-pill pill-success">Duplicated Cells: 0 (Stored Once)</span>
            <span class="meta-pill pill-success">Referential Integrity: 100% Protected</span>
          </div>
          <div>Benefit: Mathematically immune to flat-file update anomalies</div>
        `;
      }
    }

    // Auto-scroll highlighted rows into view
    scrollHighlightedRowIntoView();
  }

  // =========================================================================
  // 3. TAB 2: RELATIONAL DATABASE & SQL ENGINE (§3.7.2)
  // =========================================================================

  const DB_SCHEMA = {
    Students: {
      pk: 'StudentID',
      fk: null,
      columns: ['StudentID', 'FirstName', 'LastName', 'YearGroup', 'FormGroup'],
      rows: [
        { StudentID: 101, FirstName: 'Alice',   LastName: 'Smith',   YearGroup: 11, FormGroup: '11A' },
        { StudentID: 102, FirstName: 'Bob',     LastName: 'Jones',   YearGroup: 11, FormGroup: '11B' },
        { StudentID: 103, FirstName: 'Charlie', LastName: 'Brown',   YearGroup: 10, FormGroup: '10A' },
        { StudentID: 104, FirstName: 'Daisy',   LastName: 'Evans',   YearGroup: 11, FormGroup: '11A' },
        { StudentID: 105, FirstName: 'Ethan',   LastName: 'Taylor',  YearGroup: 10, FormGroup: '10B' },
        { StudentID: 106, FirstName: 'Fiona',   LastName: 'White',   YearGroup: 11, FormGroup: '11C' },
        { StudentID: 107, FirstName: 'George',  LastName: 'Miller',  YearGroup: 10, FormGroup: '10A' },
      ]
    },
    ExamResults: {
      pk: 'ResultID',
      fk: 'StudentID',
      columns: ['ResultID', 'StudentID', 'Subject', 'Grade', 'Score'],
      rows: [
        { ResultID: 501, StudentID: 101, Subject: 'Computing', Grade: '9', Score: 94 },
        { ResultID: 502, StudentID: 101, Subject: 'Maths',     Grade: '8', Score: 85 },
        { ResultID: 503, StudentID: 102, Subject: 'Computing', Grade: '6', Score: 62 },
        { ResultID: 504, StudentID: 103, Subject: 'Computing', Grade: '7', Score: 74 },
        { ResultID: 505, StudentID: 104, Subject: 'Computing', Grade: '9', Score: 91 },
        { ResultID: 506, StudentID: 105, Subject: 'Computing', Grade: '5', Score: 58 },
        { ResultID: 507, StudentID: 106, Subject: 'Computing', Grade: '8', Score: 83 },
        { ResultID: 508, StudentID: 107, Subject: 'Computing', Grade: '7', Score: 72 },
      ]
    }
  };

  let workingDb = JSON.parse(JSON.stringify(DB_SCHEMA));

  function renderSchemaTables() {
    // Render Students Table
    const stBody = document.getElementById('studentsTableBody');
    if (stBody) {
      stBody.innerHTML = '';
      workingDb.Students.rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong><span class="badge-pk" style="margin-right: 4px;">PK</span>${r.StudentID}</strong></td>
          <td>${r.FirstName}</td>
          <td>${r.LastName}</td>
          <td>${r.YearGroup}</td>
          <td>${r.FormGroup}</td>
        `;
        stBody.appendChild(tr);
      });
      const stCount = document.getElementById('studentsRowCount');
      if (stCount) stCount.textContent = `${workingDb.Students.rows.length} records`;
    }

    // Render ExamResults Table
    const exBody = document.getElementById('examResultsTableBody');
    if (exBody) {
      exBody.innerHTML = '';
      workingDb.ExamResults.rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong><span class="badge-pk" style="margin-right: 4px;">PK</span>${r.ResultID}</strong></td>
          <td><span class="badge-fk" style="margin-right: 4px;">FK</span><code>${r.StudentID}</code></td>
          <td>${r.Subject}</td>
          <td>${r.Grade}</td>
          <td>${r.Score}</td>
        `;
        exBody.appendChild(tr);
      });
      const exCount = document.getElementById('examResultsRowCount');
      if (exCount) exCount.textContent = `${workingDb.ExamResults.rows.length} records`;
    }
  }

  // Shared Client-side AQA Standard SQL Parser & Evaluator
  function parseAndRunSQL(rawQuery) {
    const query = rawQuery.trim().replace(/;$/, '');
    if (!query) {
      return { success: false, error: 'Please enter an SQL query.' };
    }

    const regex = /SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?$/i;
    const match = query.match(regex);
    if (!match) {
      return {
        success: false,
        error: 'Syntax error. Query must follow: SELECT ... FROM ... [WHERE ...] [ORDER BY ...]'
      };
    }

    const selectPart = match[1].trim();
    const fromPart = match[2].trim();
    const wherePart = match[3] ? match[3].trim() : null;
    const orderPart = match[4] ? match[4].trim() : null;

    const tableKey = Object.keys(workingDb).find(k => k.toLowerCase() === fromPart.toLowerCase());
    if (!tableKey) {
      return {
        success: false,
        error: `Table '${fromPart}' not found. Available tables: Students, ExamResults.`
      };
    }

    const tableMeta = workingDb[tableKey];
    let workingRows = [...tableMeta.rows];
    const traceSteps = [];

    traceSteps.push({
      type: 'from',
      title: 'Step 1: FROM Clause',
      html: `Loaded source table <code>${tableKey}</code> containing <strong>${workingRows.length}</strong> total records.`
    });

    if (wherePart) {
      const initialCount = workingRows.length;
      try {
        workingRows = workingRows.filter(row => evaluateWhere(row, wherePart));
        traceSteps.push({
          type: 'where',
          title: 'Step 2: WHERE Clause Filtering',
          html: `Applied condition <code>${escapeHTML(wherePart)}</code>. Filtered ${initialCount} records down to <strong>${workingRows.length}</strong> matching records.`
        });
      } catch (err) {
        return { success: false, error: `WHERE clause error: ${err.message}` };
      }
    } else {
      traceSteps.push({
        type: 'where',
        title: 'Step 2: WHERE Clause',
        html: 'No WHERE condition specified. All records passed through.'
      });
    }

    if (orderPart) {
      const orderTokens = orderPart.split(/\s+/);
      const orderCol = orderTokens[0];
      const isDesc = orderTokens.length > 1 && orderTokens[1].toUpperCase() === 'DESC';

      const matchedCol = tableMeta.columns.find(c => c.toLowerCase() === orderCol.toLowerCase());
      if (matchedCol) {
        workingRows.sort((a, b) => {
          let valA = a[matchedCol];
          let valB = b[matchedCol];
          if (typeof valA === 'number' && typeof valB === 'number') {
            return isDesc ? valB - valA : valA - valB;
          }
          return isDesc
            ? String(valB).localeCompare(String(valA))
            : String(valA).localeCompare(String(valB));
        });
        traceSteps.push({
          type: 'order',
          title: 'Step 3: ORDER BY Clause',
          html: `Sorted records by column <code>${matchedCol}</code> (${isDesc ? 'DESC: Highest to Lowest / Z-A' : 'ASC: Lowest to Highest / A-Z'}).`
        });
      } else {
        traceSteps.push({
          type: 'order',
          title: 'Step 3: ORDER BY (Ignored)',
          html: `Column <code>${orderCol}</code> not found in table schema; sort skipped.`
        });
      }
    } else {
      traceSteps.push({
        type: 'order',
        title: 'Step 3: ORDER BY',
        html: 'No ordering specified; records retained default database storage order.'
      });
    }

    let projectedColumns = [];
    if (selectPart === '*') {
      projectedColumns = [...tableMeta.columns];
      traceSteps.push({
        type: 'select',
        title: 'Step 4: SELECT Projection',
        html: `Wildcard <code>*</code> specified: returned all <strong>${projectedColumns.length}</strong> columns (${projectedColumns.join(', ')}).`
      });
    } else {
      const reqCols = selectPart.split(',').map(s => s.trim());
      for (const rc of reqCols) {
        const found = tableMeta.columns.find(c => c.toLowerCase() === rc.toLowerCase());
        if (found) {
          projectedColumns.push(found);
        } else {
          return {
            success: false,
            error: `Column '${rc}' does not exist on table '${tableKey}'.`
          };
        }
      }
      traceSteps.push({
        type: 'select',
        title: 'Step 4: SELECT Projection',
        html: `Projected <strong>${projectedColumns.length}</strong> columns: <code>${projectedColumns.join(', ')}</code>.`
      });
    }

    return {
      success: true,
      tableKey,
      rows: workingRows,
      columns: projectedColumns,
      traceSteps,
      isWildcard: selectPart === '*'
    };
  }

  function executeSQLQuery(rawQuery) {
    const traceBox = document.getElementById('executionTracerBox');
    const tableHead = document.getElementById('resultsTableHead');
    const tableBody = document.getElementById('resultsTableBody');
    const countBadge = document.getElementById('resultCountBadge');
    const statusText = document.getElementById('queryStatusText');

    if (traceBox) traceBox.innerHTML = '';
    if (tableHead) tableHead.innerHTML = '';
    if (tableBody) tableBody.innerHTML = '';

    const result = parseAndRunSQL(rawQuery);
    if (!result.success) {
      if (statusText) {
        statusText.textContent = result.error;
        statusText.style.color = '#ef4444';
      }
      addTraceStep('error', 'Execution Error', result.error);
      return result;
    }

    if (result.traceSteps) {
      result.traceSteps.forEach(step => {
        addTraceStep(step.type, step.title, step.html);
      });
    }

    renderQueryResults(result.rows, result.columns);
    if (statusText) {
      statusText.textContent = `✓ Query executed successfully. ${result.rows.length} rows returned.`;
      statusText.style.color = '#10b981';
    }
    if (countBadge) {
      countBadge.textContent = `${result.rows.length} row${result.rows.length === 1 ? '' : 's'} returned`;
    }
    return result;
  }

  function addTraceStep(type, title, bodyHTML) {
    const traceBox = document.getElementById('executionTracerBox');
    if (!traceBox) return;
    const item = document.createElement('div');
    item.className = `trace-step-item step-${type}`;
    item.innerHTML = `<strong>${title}:</strong><div style="margin-top: 3px; color: var(--text-secondary);">${bodyHTML}</div>`;
    traceBox.appendChild(item);
  }

  // Evaluates simple and compound WHERE predicates
  function evaluateWhere(row, whereClause) {
    if (/\s+OR\s+/i.test(whereClause)) {
      const parts = whereClause.split(/\s+OR\s+/i);
      return parts.some(p => evaluateSingleCondition(row, p));
    }
    if (/\s+AND\s+/i.test(whereClause)) {
      const parts = whereClause.split(/\s+AND\s+/i);
      return parts.every(p => evaluateSingleCondition(row, p));
    }
    return evaluateSingleCondition(row, whereClause);
  }

  function evaluateSingleCondition(row, conditionStr) {
    const opRegex = /([a-zA-Z0-9_]+)\s*(>=|<=|<>|!=|=|>|<)\s*(.+)/;
    const match = conditionStr.trim().match(opRegex);
    if (!match) {
      throw new Error(`Invalid condition format: "${conditionStr}"`);
    }

    const colName = match[1].trim();
    const op = match[2].trim();
    let rawVal = match[3].trim();

    const actualCol = Object.keys(row).find(k => k.toLowerCase() === colName.toLowerCase());
    if (!actualCol) {
      throw new Error(`Unknown column '${colName}' in WHERE clause.`);
    }

    const cellVal = row[actualCol];

    let targetVal;
    if ((rawVal.startsWith("'") && rawVal.endsWith("'")) || (rawVal.startsWith('"') && rawVal.endsWith('"'))) {
      targetVal = rawVal.slice(1, -1);
    } else if (!isNaN(Number(rawVal))) {
      targetVal = Number(rawVal);
    } else {
      targetVal = rawVal;
    }

    if (typeof cellVal === 'number' && typeof targetVal === 'number') {
      switch (op) {
        case '=':  return cellVal === targetVal;
        case '<>':
        case '!=': return cellVal !== targetVal;
        case '>':  return cellVal > targetVal;
        case '<':  return cellVal < targetVal;
        case '>=': return cellVal >= targetVal;
        case '<=': return cellVal <= targetVal;
      }
    } else {
      const sCell = String(cellVal).toLowerCase();
      const sTarget = String(targetVal).toLowerCase();
      switch (op) {
        case '=':  return sCell === sTarget;
        case '<>':
        case '!=': return sCell !== sTarget;
        case '>':  return sCell > sTarget;
        case '<':  return sCell < sTarget;
        case '>=': return sCell >= sTarget;
        case '<=': return sCell <= sTarget;
      }
    }
    return false;
  }

  function renderQueryResults(rows, columns, headElId = 'resultsTableHead', bodyElId = 'resultsTableBody') {
    const tableHead = document.getElementById(headElId);
    const tableBody = document.getElementById(bodyElId);
    if (!tableHead || !tableBody) return;

    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    const htr = document.createElement('tr');
    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      htr.appendChild(th);
    });
    tableHead.appendChild(htr);

    if (rows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = Math.max(1, columns.length);
      td.style.textAlign = 'center';
      td.style.color = 'var(--text-muted)';
      td.style.padding = '18px';
      td.textContent = 'No records matched the query criteria.';
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }

    rows.forEach(r => {
      const tr = document.createElement('tr');
      columns.forEach(col => {
        const td = document.createElement('td');
        td.textContent = r[col] !== undefined ? r[col] : '';
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }

  function escapeHTML(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function initSQLWorkbench() {
    renderSchemaTables();

    const queryInput = document.getElementById('sqlQueryInput');
    const runBtn = document.getElementById('runQueryBtn');
    const resetBtn = document.getElementById('resetTablesBtn');
    const presets = document.querySelectorAll('.preset-chip');

    presets.forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.getAttribute('data-query');
        if (queryInput && q) {
          queryInput.value = q;
          executeSQLQuery(q);
        }
      });
    });

    if (runBtn && queryInput) {
      runBtn.addEventListener('click', () => {
        executeSQLQuery(queryInput.value);
      });
      queryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          executeSQLQuery(queryInput.value);
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        workingDb = JSON.parse(JSON.stringify(DB_SCHEMA));
        renderSchemaTables();
        if (queryInput) {
          executeSQLQuery(queryInput.value);
        }
      });
    }

    if (queryInput) {
      executeSQLQuery(queryInput.value);
    }
  }

  // =========================================================================
  // 4. INTEGRATED CHALLENGE MISSIONS (IN QUERY STUDIO)
  // =========================================================================

  const CHALLENGES = [
    {
      id: 1,
      levelBadge: 'WARM-UP [2 MARKS]',
      title: 'Challenge 1: Find All Year 11 Students',
      tableHint: 'Table: Students',
      prompt: 'Write an SQL query to retrieve the <code>FirstName</code> and <code>LastName</code> of all students in <code>YearGroup = 11</code> from the <code>Students</code> table.',
      targetRowsDesc: '4 rows (Alice Smith, Bob Jones, Daisy Evans, Fiona White)',
      starterTemplate: 'SELECT FirstName, LastName\nFROM Students\nWHERE YearGroup = 11',
      expectedTable: 'Students',
      expectedCols: ['FirstName', 'LastName'],
      checkRows: (rows) => rows.length === 4 && rows.every(r => ['Alice', 'Bob', 'Daisy', 'Fiona'].includes(r.FirstName)),
      modelSql: 'SELECT FirstName, LastName FROM Students WHERE YearGroup = 11',
      marksBreakdown: `
        <strong>Exam Mark Scheme (2 Marks):</strong><br>
        • <strong>1 Mark:</strong> Correct columns <code>SELECT FirstName, LastName FROM Students</code><br>
        • <strong>1 Mark:</strong> Correct condition <code>WHERE YearGroup = 11</code>
      `
    },
    {
      id: 2,
      levelBadge: 'COMPOUND LOGIC [3 MARKS]',
      title: 'Challenge 2: Grade 8 or Higher in Computing',
      tableHint: 'Table: ExamResults',
      prompt: 'Write an SQL query to select <code>StudentID</code>, <code>Subject</code>, and <code>Score</code> from the <code>ExamResults</code> table where <code>Subject = \'Computing\'</code> and <code>Score >= 80</code>.',
      targetRowsDesc: '3 rows (Student 101: 94, Student 104: 91, Student 106: 83)',
      starterTemplate: "SELECT StudentID, Subject, Score\nFROM ExamResults\nWHERE Subject = 'Computing' AND Score >= 80",
      expectedTable: 'ExamResults',
      expectedCols: ['StudentID', 'Subject', 'Score'],
      checkRows: (rows) => rows.length === 3 && rows.every(r => r.Score >= 80 && r.Subject === 'Computing'),
      modelSql: "SELECT StudentID, Subject, Score FROM ExamResults WHERE Subject = 'Computing' AND Score >= 80",
      marksBreakdown: `
        <strong>Exam Mark Scheme (3 Marks):</strong><br>
        • <strong>1 Mark:</strong> Correct columns <code>SELECT StudentID, Subject, Score FROM ExamResults</code><br>
        • <strong>1 Mark:</strong> Subject filter <code>WHERE Subject = 'Computing'</code><br>
        • <strong>1 Mark:</strong> Compound operator <code>AND Score >= 80</code> (or <code>Score > 79</code>)
      `
    },
    {
      id: 3,
      levelBadge: 'SORTING & ORDER [3 MARKS]',
      title: 'Challenge 3: Computing Score Leaderboard',
      tableHint: 'Table: ExamResults',
      prompt: 'Write an SQL query to retrieve <code>StudentID</code>, <code>Grade</code>, and <code>Score</code> for all records where <code>Subject = \'Computing\'</code>, sorted by <code>Score</code> in descending order (highest score first).',
      targetRowsDesc: '7 rows sorted descending (94, 91, 83, 74, 72, 62, 58)',
      starterTemplate: "SELECT StudentID, Grade, Score\nFROM ExamResults\nWHERE Subject = 'Computing'\nORDER BY Score DESC",
      expectedTable: 'ExamResults',
      expectedCols: ['StudentID', 'Grade', 'Score'],
      checkRows: (rows) => rows.length === 7 && rows[0]?.Score === 94 && rows[rows.length - 1]?.Score === 58,
      modelSql: "SELECT StudentID, Grade, Score FROM ExamResults WHERE Subject = 'Computing' ORDER BY Score DESC",
      marksBreakdown: `
        <strong>Exam Mark Scheme (3 Marks):</strong><br>
        • <strong>1 Mark:</strong> Correct fields <code>SELECT StudentID, Grade, Score FROM ExamResults</code><br>
        • <strong>1 Mark:</strong> Filtering condition <code>WHERE Subject = 'Computing'</code><br>
        • <strong>1 Mark:</strong> Correct sorting <code>ORDER BY Score DESC</code>
      `
    },
    {
      id: 4,
      levelBadge: 'RELATIONAL QUERY [3 MARKS]',
      title: "Challenge 4: Alice's Exam Transcript",
      tableHint: 'Table: ExamResults (Foreign Key Lookup)',
      prompt: "Alice Smith has <code>StudentID = 101</code>. Write a query on the <code>ExamResults</code> table using the foreign key to retrieve her <code>Subject</code>, <code>Grade</code>, and <code>Score</code>.",
      targetRowsDesc: '2 rows (Computing: Grade 9, Maths: Grade 8)',
      starterTemplate: 'SELECT Subject, Grade, Score\nFROM ExamResults\nWHERE StudentID = 101',
      expectedTable: 'ExamResults',
      expectedCols: ['Subject', 'Grade', 'Score'],
      checkRows: (rows) => rows.length === 2 && rows.some(r => r.Subject === 'Computing') && rows.some(r => r.Subject === 'Maths'),
      modelSql: 'SELECT Subject, Grade, Score FROM ExamResults WHERE StudentID = 101',
      marksBreakdown: `
        <strong>Exam Mark Scheme (3 Marks):</strong><br>
        • <strong>1 Mark:</strong> Selecting fields <code>SELECT Subject, Grade, Score</code><br>
        • <strong>1 Mark:</strong> From child table <code>FROM ExamResults</code><br>
        • <strong>1 Mark:</strong> Foreign key matching <code>WHERE StudentID = 101</code>
      `
    }
  ];

  let activeMissionIndex = null;

  function initStudioMissions() {
    const modeButtons = document.querySelectorAll('#studioModeGroup .studio-mode-btn');
    const missionPanel = document.getElementById('activeMissionPanel');

    const levelBadge = document.getElementById('challengeLevelBadge');
    const titleEl = document.getElementById('challengeTitle');
    const hintEl = document.getElementById('challengeTableHint');
    const promptEl = document.getElementById('challengePrompt');
    const targetRowsEl = document.getElementById('challengeTargetRows');

    const btnCheck = document.getElementById('btnCheckChallenge');
    const btnFillTemplate = document.getElementById('btnFillTemplate');
    const btnToggleModel = document.getElementById('btnToggleModelAnswer');

    const feedbackBox = document.getElementById('challengeFeedbackBox');
    const modelBox = document.getElementById('challengeModelAnswerBox');
    const modelSql = document.getElementById('modelAnswerSql');
    const modelMarks = document.getElementById('modelAnswerMarks');

    const queryInput = document.getElementById('sqlQueryInput');

    function setMission(missionKey) {
      modeButtons.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-mission') === missionKey);
      });

      if (missionKey === 'free') {
        activeMissionIndex = null;
        if (missionPanel) missionPanel.style.display = 'none';
        return;
      }

      const mIdx = parseInt(missionKey, 10) - 1;
      activeMissionIndex = mIdx;
      const c = CHALLENGES[mIdx];
      if (!c) return;

      if (missionPanel) missionPanel.style.display = 'block';
      if (levelBadge) levelBadge.textContent = c.levelBadge;
      if (titleEl) titleEl.textContent = c.title;
      if (hintEl) hintEl.textContent = c.tableHint;
      if (promptEl) promptEl.innerHTML = c.prompt;
      if (targetRowsEl) targetRowsEl.textContent = c.targetRowsDesc;

      if (feedbackBox) feedbackBox.style.display = 'none';
      if (modelBox) modelBox.style.display = 'none';
      if (modelSql) modelSql.textContent = c.modelSql;
      if (modelMarks) modelMarks.innerHTML = c.marksBreakdown;
      if (btnToggleModel) btnToggleModel.textContent = 'Show Worked Model Answer ▾';

      if (queryInput) {
        queryInput.value = c.starterTemplate;
        executeSQLQuery(c.starterTemplate);
      }
    }

    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const missionKey = btn.getAttribute('data-mission');
        setMission(missionKey);
      });
    });

    if (btnFillTemplate) {
      btnFillTemplate.addEventListener('click', () => {
        if (activeMissionIndex === null) return;
        const c = CHALLENGES[activeMissionIndex];
        if (c && queryInput) {
          queryInput.value = c.starterTemplate;
          executeSQLQuery(c.starterTemplate);
        }
      });
    }

    if (btnToggleModel && modelBox) {
      btnToggleModel.addEventListener('click', () => {
        const isHidden = modelBox.style.display === 'none' || !modelBox.style.display;
        modelBox.style.display = isHidden ? 'block' : 'none';
        btnToggleModel.textContent = isHidden ? 'Hide Model Answer ▴' : 'Show Worked Model Answer ▾';
      });
    }

    if (btnCheck) {
      btnCheck.addEventListener('click', () => {
        if (activeMissionIndex === null) return;
        const c = CHALLENGES[activeMissionIndex];
        if (!c || !queryInput || !feedbackBox) return;

        const rawQuery = queryInput.value.trim();
        if (!rawQuery) {
          feedbackBox.style.display = 'block';
          feedbackBox.style.background = '#fef2f2';
          feedbackBox.style.border = '1px solid #f87171';
          feedbackBox.style.color = '#991b1b';
          feedbackBox.innerHTML = '<strong>Empty Query:</strong> Please write an SQL query before checking!';
          return;
        }

        const result = executeSQLQuery(rawQuery);
        if (!result.success) {
          feedbackBox.style.display = 'block';
          feedbackBox.style.background = '#fef2f2';
          feedbackBox.style.border = '1px solid #f87171';
          feedbackBox.style.color = '#991b1b';
          feedbackBox.innerHTML = `<strong>Syntax / Query Error:</strong> ${escapeHTML(result.error)}`;
          return;
        }

        // 1. Check Table
        if (result.tableKey.toLowerCase() !== c.expectedTable.toLowerCase()) {
          feedbackBox.style.display = 'block';
          feedbackBox.style.background = '#fef2f2';
          feedbackBox.style.border = '1px solid #f87171';
          feedbackBox.style.color = '#991b1b';
          feedbackBox.innerHTML = `<strong>Wrong Table:</strong> You queried <code>${result.tableKey}</code>, but this exam question requires <code>${c.expectedTable}</code>.`;
          return;
        }

        // 2. Check Wildcard vs Requested Columns
        if (result.isWildcard) {
          feedbackBox.style.display = 'block';
          feedbackBox.style.background = '#fffbeb';
          feedbackBox.style.border = '1px solid #f59e0b';
          feedbackBox.style.color = '#92400e';
          feedbackBox.innerHTML = `<strong>Partial Credit (Examiner Penalty):</strong> You used <code>SELECT *</code>. In GCSE exams, you lose a mark for wildcards when the question asks for specific fields (<code>${c.expectedCols.join(', ')}</code>). Replace <code>*</code> with the exact column names!`;
          return;
        }

        // 3. Check Projected Columns
        const returnedLowerCols = result.columns.map(col => col.toLowerCase());
        const expectedLowerCols = c.expectedCols.map(col => col.toLowerCase());
        const colsMatch = expectedLowerCols.every(col => returnedLowerCols.includes(col)) &&
                          returnedLowerCols.length === expectedLowerCols.length;

        if (!colsMatch) {
          feedbackBox.style.display = 'block';
          feedbackBox.style.background = '#fffbeb';
          feedbackBox.style.border = '1px solid #f59e0b';
          feedbackBox.style.color = '#92400e';
          feedbackBox.innerHTML = `<strong>Column Mismatch:</strong> Expected columns <code>${c.expectedCols.join(', ')}</code>, but your query returned <code>${result.columns.join(', ')}</code>.`;
          return;
        }

        // 4. Check Filtered Rows
        const rowsPass = c.checkRows(result.rows);
        if (!rowsPass) {
          feedbackBox.style.display = 'block';
          feedbackBox.style.background = '#fef2f2';
          feedbackBox.style.border = '1px solid #f87171';
          feedbackBox.style.color = '#991b1b';
          feedbackBox.innerHTML = `<strong>Incorrect Rows Returned:</strong> Your query returned <strong>${result.rows.length}</strong> rows, but this does not match the target criteria. Re-check your <code>WHERE</code> or <code>ORDER BY</code> clause!`;
          return;
        }

        // Full Success!
        feedbackBox.style.display = 'block';
        feedbackBox.style.background = '#f0fdf4';
        feedbackBox.style.border = '1px solid #22c55e';
        feedbackBox.style.color = '#15803d';
        feedbackBox.innerHTML = `
          <div style="font-size: 14px; font-weight: 800; margin-bottom: 4px;">✓ Full Marks Earned!</div>
          <div>Your query met every specification criterion and produced the exact required dataset. You earned full marks for this exam problem.</div>
        `;
      });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const missionParam = urlParams.get('mission');
    if (missionParam) {
      setMission(missionParam);
    }
  }

  // =========================================================================
  // 5. INITIALIZATION ENTRYPOINT
  // =========================================================================

  function init() {
    initTheme();
    initTabs();
    initFlatFileSimulator();
    initSQLWorkbench();
    initStudioMissions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
