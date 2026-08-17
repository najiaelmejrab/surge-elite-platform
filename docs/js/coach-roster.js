/**
 * Surge Elite Basketball Platform - Milestone 9
 * Coach Roster & Athlete Management JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initCoachRoster();
});

function initCoachRoster() {
  const API_BASE = '../backend/public/api/players.php';

  // State
  let showInactive = false;
  let currentView = 'grid'; // 'grid' or 'table'
  let playersList = [];

  // DOM Elements
  const coachTeamSelect = document.getElementById('coachTeamSelect');
  const playerSearchInput = document.getElementById('playerSearchInput');
  const positionFilterSelect = document.getElementById('positionFilterSelect');
  const btnToggleInactive = document.getElementById('btnToggleInactive');
  const inactiveBtnText = document.getElementById('inactiveBtnText');
  const btnViewGrid = document.getElementById('btnViewGrid');
  const btnViewTable = document.getElementById('btnViewTable');
  const athletesGridView = document.getElementById('athletesGridView');
  const athletesTableView = document.getElementById('athletesTableView');
  const athletesTableBody = document.getElementById('athletesTableBody');
  const emptyRosterState = document.getElementById('emptyRosterState');
  const btnClearFilters = document.getElementById('btnClearFilters');

  // KPI Elements
  const metricTotalActive = document.getElementById('metricTotalActive');
  const metricGuards = document.getElementById('metricGuards');
  const metricForwards = document.getElementById('metricForwards');
  const metricCenters = document.getElementById('metricCenters');

  // Modal Elements
  const btnOpenAddPlayerModal = document.getElementById('btnOpenAddPlayerModal');
  const playerModal = document.getElementById('playerModal');
  const closePlayerModal = document.getElementById('closePlayerModal');
  const cancelPlayerModal = document.getElementById('cancelPlayerModal');
  const playerForm = document.getElementById('playerForm');
  const playerModalTitle = document.getElementById('playerModalTitle');
  const modalPlayerId = document.getElementById('modalPlayerId');
  const modalFirstName = document.getElementById('modalFirstName');
  const modalLastName = document.getElementById('modalLastName');
  const modalJersey = document.getElementById('modalJersey');
  const modalPosition = document.getElementById('modalPosition');
  const modalStatus = document.getElementById('modalStatus');
  const modalHeight = document.getElementById('modalHeight');
  const modalWeight = document.getElementById('modalWeight');
  const modalExperience = document.getElementById('modalExperience');
  const modalTeamSelect = document.getElementById('modalTeamSelect');
  const modalCollege = document.getElementById('modalCollege');
  const modalAvatarUrl = document.getElementById('modalAvatarUrl');
  const modalBio = document.getElementById('modalBio');

  // Initial Seed Data for fallback
  const SEED_ATHLETES = [
    { id: 101, team_id: 1, first_name: 'Marcus', last_name: 'Vance', jersey_number: '23', position: 'PG', height: "6'3\"", weight: '195 lbs', experience_years: 5, college_or_highschool: 'UCLA', status: 'active', bio: 'Floor general with elite perimeter playmaking and clutch shot creation.', avatar_url: '' },
    { id: 102, team_id: 1, first_name: 'Jamal', last_name: 'Brooks', jersey_number: '55', position: 'C', height: "6'11\"", weight: '250 lbs', experience_years: 4, college_or_highschool: 'Kentucky', status: 'active', bio: 'Dominant rim protector, elite defensive anchor and rebound machine.', avatar_url: '' },
    { id: 103, team_id: 1, first_name: 'Elena', last_name: 'Rostova', jersey_number: '7', position: 'SG', height: "5'11\"", weight: '165 lbs', experience_years: 3, college_or_highschool: 'Stanford', status: 'active', bio: 'Sharpshooter from beyond the arc with high basketball IQ and transition speed.', avatar_url: '' },
    { id: 104, team_id: 1, first_name: 'Dante', last_name: 'Walker', jersey_number: '12', position: 'SF', height: "6'7\"", weight: '220 lbs', experience_years: 6, college_or_highschool: 'Duke', status: 'active', bio: 'Two-way wing scorer capable of defending 1 through 4 positions.', avatar_url: '' },
    { id: 105, team_id: 1, first_name: 'Tariq', last_name: 'Johnson', jersey_number: '34', position: 'PF', height: "6'9\"", weight: '235 lbs', experience_years: 2, college_or_highschool: 'Gonzaga', status: 'active', bio: 'High-motor stretch four with mid-range touch and offensive glass tenacity.', avatar_url: '' },
    { id: 106, team_id: 1, first_name: 'Leo', last_name: 'Chen', jersey_number: '3', position: 'PG', height: "6'1\"", weight: '180 lbs', experience_years: 1, college_or_highschool: 'Arizona', status: 'active', bio: 'Speedy backup playmaker with quick hands and excellent court vision.', avatar_url: '' },
    { id: 107, team_id: 1, first_name: 'Kobe', last_name: 'Miller', jersey_number: '15', position: 'SF', height: "6'6\"", weight: '210 lbs', experience_years: 3, college_or_highschool: 'Michigan', status: 'injured', bio: 'Athletic slasher recovering from minor ankle sprain.', avatar_url: '' },
    { id: 201, team_id: 2, first_name: 'Zion', last_name: 'Sterling', jersey_number: '1', position: 'SG', height: "6'5\"", weight: '205 lbs', experience_years: 4, college_or_highschool: 'North Carolina', status: 'active', bio: 'Explosive primary isolation scorer and acrobatic finisher at the rim.', avatar_url: '' },
    { id: 202, team_id: 2, first_name: 'Trevor', last_name: 'Hayes', jersey_number: '11', position: 'PG', height: "6'2\"", weight: '188 lbs', experience_years: 5, college_or_highschool: 'Villanova', status: 'active', bio: 'Veteran floor general specializing in pick-and-roll execution.', avatar_url: '' },
    { id: 203, team_id: 2, first_name: 'Kendrick', last_name: 'Fox', jersey_number: '33', position: 'PF', height: "6'8\"", weight: '230 lbs', experience_years: 3, college_or_highschool: 'Kansas', status: 'active', bio: 'Physical power forward with dependable short-corner jumpers.', avatar_url: '' },
    { id: 301, team_id: 3, first_name: 'Klayton', last_name: 'Rivers', jersey_number: '2', position: 'SG', height: "6'6\"", weight: '215 lbs', experience_years: 4, college_or_highschool: 'Florida', status: 'active', bio: 'Dead-eye shooter and lockdown perimeter stopper.', avatar_url: '' },
    { id: 401, team_id: 4, first_name: 'Brandon', last_name: 'Cole', jersey_number: '0', position: 'PG', height: "6'3\"", weight: '192 lbs', experience_years: 3, college_or_highschool: 'Illinois', status: 'active', bio: 'Dynamic Chicago point guard with crafty floaters and tight handles.', avatar_url: '' }
  ];

  // Initialize storage if empty
  if (!localStorage.getItem('surge_elite_athletes')) {
    localStorage.setItem('surge_elite_athletes', JSON.stringify(SEED_ATHLETES));
  }

  // --- INITIALIZATION ---
  initEvents();
  loadAthletes();

  function initEvents() {
    // Filter controls
    coachTeamSelect.addEventListener('change', loadAthletes);
    positionFilterSelect.addEventListener('change', filterAndRender);
    playerSearchInput.addEventListener('input', debounce(filterAndRender, 200));

    btnClearFilters.addEventListener('click', () => {
      playerSearchInput.value = '';
      positionFilterSelect.value = 'all';
      filterAndRender();
    });

    // Inactive Toggle Button
    btnToggleInactive.addEventListener('click', () => {
      showInactive = !showInactive;
      if (showInactive) {
        inactiveBtnText.textContent = 'Hide Inactive Athletes';
        btnToggleInactive.style.borderColor = 'var(--primary)';
        btnToggleInactive.style.color = 'var(--primary)';
      } else {
        inactiveBtnText.textContent = 'Show Inactive Athletes';
        btnToggleInactive.style.borderColor = 'var(--border-light)';
        btnToggleInactive.style.color = 'var(--text-main)';
      }
      loadAthletes();
    });

    // View Switcher
    btnViewGrid.addEventListener('click', () => {
      currentView = 'grid';
      btnViewGrid.classList.add('active');
      btnViewGrid.style.background = 'rgba(255,94,0,0.15)';
      btnViewGrid.style.borderColor = 'var(--primary)';

      btnViewTable.classList.remove('active');
      btnViewTable.style.background = 'transparent';
      btnViewTable.style.borderColor = 'var(--border-light)';

      athletesGridView.style.display = 'grid';
      athletesTableView.style.display = 'none';
    });

    btnViewTable.addEventListener('click', () => {
      currentView = 'table';
      btnViewTable.classList.add('active');
      btnViewTable.style.background = 'rgba(255,94,0,0.15)';
      btnViewTable.style.borderColor = 'var(--primary)';

      btnViewGrid.classList.remove('active');
      btnViewGrid.style.background = 'transparent';
      btnViewGrid.style.borderColor = 'var(--border-light)';

      athletesGridView.style.display = 'none';
      athletesTableView.style.display = 'block';
    });

    // Modal Events
    btnOpenAddPlayerModal.addEventListener('click', openAddModal);
    closePlayerModal.addEventListener('click', closeModal);
    cancelPlayerModal.addEventListener('click', closeModal);
    playerModal.addEventListener('click', (e) => {
      if (e.target === playerModal) closeModal();
    });

    // Form Submit
    playerForm.addEventListener('submit', handlePlayerFormSubmit);
  }

  // --- API DATA FETCHING ---
  async function loadAthletes() {
    const teamId = coachTeamSelect.value;
    const url = `${API_BASE}?team_id=${teamId}&include_inactive=${showInactive}`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          playersList = result.data;
          filterAndRender();
          return;
        }
      }
    } catch (e) {
      console.log('API unreachable; loading athletes from local persistent storage');
    }

    // Local Storage Fallback
    const stored = JSON.parse(localStorage.getItem('surge_elite_athletes') || '[]');
    playersList = stored.filter(p => {
      const matchTeam = String(p.team_id) === String(teamId);
      if (!matchTeam) return false;
      if (!showInactive && p.status === 'inactive') return false;
      return true;
    });

    filterAndRender();
  }

  // --- FILTER & RENDER ---
  function filterAndRender() {
    const searchVal = playerSearchInput.value.toLowerCase().trim();
    const posVal = positionFilterSelect.value;

    const filtered = playersList.filter(p => {
      const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
      const jersey = String(p.jersey_number || p.active_jersey || '');
      const college = (p.college_or_highschool || '').toLowerCase();
      const pos = (p.position || p.active_position || '').toUpperCase();

      const matchesSearch = !searchVal || fullName.includes(searchVal) || jersey.includes(searchVal) || college.includes(searchVal);
      const matchesPos = posVal === 'all' || pos === posVal;

      return matchesSearch && matchesPos;
    });

    updateKPICounters(playersList);

    if (filtered.length === 0) {
      athletesGridView.style.display = 'none';
      athletesTableView.style.display = 'none';
      emptyRosterState.style.display = 'block';
      return;
    }

    emptyRosterState.style.display = 'none';
    if (currentView === 'grid') {
      athletesGridView.style.display = 'grid';
      athletesTableView.style.display = 'none';
    } else {
      athletesGridView.style.display = 'none';
      athletesTableView.style.display = 'block';
    }

    renderGrid(filtered);
    renderTable(filtered);
  }

  // --- UPDATE KPI STATS ---
  function updateKPICounters(athletes) {
    const active = athletes.filter(a => a.status !== 'inactive');
    metricTotalActive.textContent = active.length;

    const guards = active.filter(a => ['PG', 'SG', 'G'].includes((a.position || a.active_position || '').toUpperCase())).length;
    const forwards = active.filter(a => ['SF', 'PF', 'F'].includes((a.position || a.active_position || '').toUpperCase())).length;
    const centers = active.filter(a => ['C', 'F/C'].includes((a.position || a.active_position || '').toUpperCase())).length;

    metricGuards.textContent = guards;
    metricForwards.textContent = forwards;
    metricCenters.textContent = centers;
  }

  // --- RENDER GRID CARDS ---
  function renderGrid(athletes) {
    athletesGridView.innerHTML = '';

    athletes.forEach(athlete => {
      const card = document.createElement('div');
      const isInactive = athlete.status === 'inactive';
      card.className = `athlete-card ${isInactive ? 'inactive-card' : ''}`;

      const pos = athlete.position || athlete.active_position || 'G';
      const jersey = athlete.jersey_number || athlete.active_jersey || '0';
      const initials = `${(athlete.first_name || 'P')[0]}${(athlete.last_name || 'A')[0]}`.toUpperCase();

      let statusBadge = `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">Active</span>`;
      if (athlete.status === 'injured') {
        statusBadge = `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Injured</span>`;
      } else if (isInactive) {
        statusBadge = `<span class="badge" style="background: rgba(148, 163, 184, 0.15); color: #94a3b8;">Inactive</span>`;
      }

      card.innerHTML = `
        <div class="athlete-card-header">
          <div class="athlete-avatar">
            ${athlete.avatar_url ? `<img src="${athlete.avatar_url}" alt="${athlete.first_name}">` : initials}
          </div>
          <div class="athlete-meta">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
              <span style="font-family: var(--font-display); font-size: 1.1rem; color: var(--primary); font-weight: 700;">#${jersey}</span>
              ${statusBadge}
            </div>
            <h3 class="athlete-name">${athlete.first_name} ${athlete.last_name}</h3>
            <div class="athlete-sub">
              <span><strong>${pos}</strong></span>
              <span>&bull;</span>
              <span>${athlete.college_or_highschool || 'Pro-Am Elite'}</span>
            </div>
          </div>
        </div>

        <div class="athlete-stats-row">
          <div class="athlete-stat-box">
            <div class="val">${athlete.height || '6\'4"'}</div>
            <div class="lbl">Height</div>
          </div>
          <div class="athlete-stat-box">
            <div class="val">${athlete.weight || '205 lbs'}</div>
            <div class="lbl">Weight</div>
          </div>
          <div class="athlete-stat-box">
            <div class="val">${athlete.experience_years ?? 2} Yrs</div>
            <div class="lbl">Exp</div>
          </div>
        </div>

        <div style="padding: 0.85rem 1.25rem 0.25rem 1.25rem; font-size: 0.82rem; color: var(--text-muted); line-height: 1.4;">
          ${athlete.bio ? athlete.bio : 'Registered Surge Elite athlete on the active team roster.'}
        </div>

        <div class="athlete-card-actions">
          <button type="button" class="btn btn-outline btn-sm btn-edit-player" data-id="${athlete.id}">
            Edit Profile
          </button>
          ${isInactive ? `
            <button type="button" class="btn btn-sm btn-restore-player" data-id="${athlete.id}" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3);">
              Restore Active
            </button>
          ` : `
            <button type="button" class="btn btn-outline btn-sm btn-delete-player" data-id="${athlete.id}" style="color: #ef4444; border-color: rgba(239,68,68,0.3);">
              Deactivate
            </button>
          `}
        </div>
      `;

      // Bind Card Actions
      card.querySelector('.btn-edit-player').addEventListener('click', () => openEditModal(athlete));
      if (isInactive) {
        card.querySelector('.btn-restore-player').addEventListener('click', () => handleRestorePlayer(athlete.id));
      } else {
        card.querySelector('.btn-delete-player').addEventListener('click', () => handleSoftDeletePlayer(athlete.id, `${athlete.first_name} ${athlete.last_name}`));
      }

      athletesGridView.appendChild(card);
    });
  }

  // --- RENDER TABLE ROWS ---
  function renderTable(athletes) {
    athletesTableBody.innerHTML = '';

    athletes.forEach(athlete => {
      const row = document.createElement('tr');
      const isInactive = athlete.status === 'inactive';
      row.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
      if (isInactive) row.style.opacity = '0.6';

      const jersey = athlete.jersey_number || athlete.active_jersey || '0';
      const pos = athlete.position || athlete.active_position || 'G';

      let statusBadge = `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 0.75rem;">Active</span>`;
      if (athlete.status === 'injured') {
        statusBadge = `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; font-size: 0.75rem;">Injured</span>`;
      } else if (isInactive) {
        statusBadge = `<span class="badge" style="background: rgba(148, 163, 184, 0.15); color: #94a3b8; font-size: 0.75rem;">Inactive</span>`;
      }

      row.innerHTML = `
        <td style="padding: 0.85rem 1.25rem; font-family: var(--font-display); font-size: 1.1rem; color: var(--primary); font-weight: 700;">#${jersey}</td>
        <td style="padding: 0.85rem 1.25rem; font-weight: 700;">${athlete.first_name} ${athlete.last_name}</td>
        <td style="padding: 0.85rem 1.25rem;"><span class="badge" style="background: rgba(0,229,255,0.1); color: #00e5ff;">${pos}</span></td>
        <td style="padding: 0.85rem 1.25rem;">${athlete.height || "6'4\""}</td>
        <td style="padding: 0.85rem 1.25rem;">${athlete.weight || "200 lbs"}</td>
        <td style="padding: 0.85rem 1.25rem;">${athlete.experience_years ?? 2} Yrs</td>
        <td style="padding: 0.85rem 1.25rem; color: var(--text-muted);">${athlete.college_or_highschool || 'N/A'}</td>
        <td style="padding: 0.85rem 1.25rem;">${statusBadge}</td>
        <td style="padding: 0.85rem 1.25rem; text-align: right;">
          <button type="button" class="btn btn-outline btn-sm btn-edit-table" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;">Edit</button>
          ${isInactive ? `
            <button type="button" class="btn btn-sm btn-restore-table" style="padding: 0.3rem 0.6rem; font-size: 0.78rem; background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3);">Restore</button>
          ` : `
            <button type="button" class="btn btn-outline btn-sm btn-delete-table" style="padding: 0.3rem 0.6rem; font-size: 0.78rem; color: #ef4444; border-color: rgba(239,68,68,0.3);">Deactivate</button>
          `}
        </td>
      `;

      row.querySelector('.btn-edit-table').addEventListener('click', () => openEditModal(athlete));
      if (isInactive) {
        row.querySelector('.btn-restore-table').addEventListener('click', () => handleRestorePlayer(athlete.id));
      } else {
        row.querySelector('.btn-delete-table').addEventListener('click', () => handleSoftDeletePlayer(athlete.id, `${athlete.first_name} ${athlete.last_name}`));
      }

      athletesTableBody.appendChild(row);
    });
  }

  // --- MODAL CONTROLS ---
  function openAddModal() {
    playerForm.reset();
    modalPlayerId.value = '';
    modalTeamSelect.value = coachTeamSelect.value;
    modalStatus.value = 'active';
    playerModalTitle.textContent = 'Add Athlete to Roster';
    playerModal.style.display = 'flex';
  }

  function openEditModal(athlete) {
    modalPlayerId.value = athlete.id;
    modalFirstName.value = athlete.first_name || '';
    modalLastName.value = athlete.last_name || '';
    modalJersey.value = athlete.jersey_number || athlete.active_jersey || '';
    modalPosition.value = athlete.position || athlete.active_position || 'G';
    modalStatus.value = athlete.status || 'active';
    modalHeight.value = athlete.height || '';
    modalWeight.value = athlete.weight || '';
    modalExperience.value = athlete.experience_years ?? 0;
    modalTeamSelect.value = athlete.team_id || coachTeamSelect.value;
    modalCollege.value = athlete.college_or_highschool || '';
    modalAvatarUrl.value = athlete.avatar_url || '';
    modalBio.value = athlete.bio || '';

    playerModalTitle.textContent = `Edit Profile: ${athlete.first_name} ${athlete.last_name}`;
    playerModal.style.display = 'flex';
  }

  function closeModal() {
    playerModal.style.display = 'none';
  }

  // --- FORM SUBMIT (CREATE / UPDATE) ---
  async function handlePlayerFormSubmit(e) {
    e.preventDefault();

    const isEdit = !!modalPlayerId.value;
    const payload = {
      first_name: modalFirstName.value.trim(),
      last_name: modalLastName.value.trim(),
      jersey_number: modalJersey.value.trim(),
      position: modalPosition.value,
      status: modalStatus.value,
      height: modalHeight.value.trim(),
      weight: modalWeight.value.trim(),
      experience_years: parseInt(modalExperience.value, 10) || 0,
      team_id: parseInt(modalTeamSelect.value, 10) || parseInt(coachTeamSelect.value, 10),
      season_id: 1,
      college_or_highschool: modalCollege.value.trim(),
      avatar_url: modalAvatarUrl.value.trim(),
      bio: modalBio.value.trim()
    };

    const url = isEdit ? `${API_BASE}?id=${modalPlayerId.value}` : API_BASE;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          showToast(isEdit ? 'Athlete profile updated!' : 'New athlete added to roster!', 'success');
          closeModal();
          loadAthletes();
          return;
        }
      }
    } catch (err) {
      console.log('Saving to local persistent fallback storage...');
    }

    // Local Storage Save Fallback
    const stored = JSON.parse(localStorage.getItem('surge_elite_athletes') || '[]');
    if (isEdit) {
      const idx = stored.findIndex(a => String(a.id) === String(modalPlayerId.value));
      if (idx !== -1) {
        stored[idx] = { ...stored[idx], ...payload };
      }
    } else {
      const newPlayer = {
        id: Date.now(),
        ...payload
      };
      stored.push(newPlayer);
    }

    localStorage.setItem('surge_elite_athletes', JSON.stringify(stored));
    showToast(isEdit ? 'Athlete profile updated successfully!' : 'New athlete added to team roster!', 'success');
    closeModal();
    loadAthletes();
  }

  // --- SOFT DELETE (MARK INACTIVE) ---
  async function handleSoftDeletePlayer(id, name) {
    if (!confirm(`Are you sure you want to deactivate ${name}? The athlete will be soft-deleted (marked inactive) without deleting historic statistics.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          showToast(`${name} marked inactive (soft deleted)`, 'info');
          loadAthletes();
          return;
        }
      }
    } catch (e) {
      // Local storage fallback
    }

    const stored = JSON.parse(localStorage.getItem('surge_elite_athletes') || '[]');
    const target = stored.find(a => String(a.id) === String(id));
    if (target) {
      target.status = 'inactive';
      localStorage.setItem('surge_elite_athletes', JSON.stringify(stored));
      showToast(`${name} marked inactive (soft deleted)`, 'info');
      loadAthletes();
    }
  }

  // --- RESTORE INACTIVE ATHLETE ---
  async function handleRestorePlayer(id) {
    try {
      const res = await fetch(`${API_BASE}?action=restore&id=${id}`, { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          showToast('Athlete restored to active roster', 'success');
          loadAthletes();
          return;
        }
      }
    } catch (e) {
      // Local storage fallback
    }

    const stored = JSON.parse(localStorage.getItem('surge_elite_athletes') || '[]');
    const target = stored.find(a => String(a.id) === String(id));
    if (target) {
      target.status = 'active';
      localStorage.setItem('surge_elite_athletes', JSON.stringify(stored));
      showToast('Athlete restored to active roster', 'success');
      loadAthletes();
    }
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '&#9432;';
    if (type === 'success') icon = '&#10004;';
    if (type === 'error') icon = '&#9888;';

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.2rem;">${icon}</span>
        <span style="font-size: 0.88rem; font-weight: 600;">${message}</span>
      </div>
      <button type="button" style="color: var(--text-muted); font-size: 1.2rem; line-height: 1;">&times;</button>
    `;

    toast.querySelector('button').addEventListener('click', () => toast.remove());

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  }

  // Helper debounce
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
}
