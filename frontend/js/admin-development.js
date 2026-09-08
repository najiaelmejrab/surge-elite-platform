/**
 * Surge Elite Basketball Platform - Admin & Coach Player Development Workbench
 * Powered by PHP + MySQL backend API with PHP session authentication.
 * No localStorage is used for development data.
 */

(function () {
  'use strict';

  const API_URL = '../../backend/public/api/development.php';

  // DOM elements
  const playerListEl = document.getElementById('developmentPlayerList');
  const searchInput = document.getElementById('developmentSearchInput');
  const teamFilter = document.getElementById('developmentTeamFilter');
  const statusFilter = document.getElementById('developmentStatusFilter');
  const emptyStateEl = document.getElementById('developmentEmptyState');
  const profileContentEl = document.getElementById('developmentProfileContent');
  const playerCountEl = document.getElementById('developmentPlayerCount');
  const refreshBtn = document.getElementById('developmentRefreshBtn');
  const editBtn = document.getElementById('developmentEditBtn');
  const saveBtn = document.getElementById('developmentSaveBtn');
  const resetBtn = document.getElementById('developmentResetBtn');
  const cancelBtn = document.getElementById('developmentCancelBtn');
  const tabButtons = Array.from(document.querySelectorAll('.development-tab'));

  // State
  let playersRoster = [];
  let teamsList = [];
  let selectedPlayerId = null;
  let isEditing = false;
  let isSaving = false;

  // Formatters
  function formatDateDisplay(dateStr) {
    if (!dateStr) return 'Not scheduled';
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    }
    return dateStr;
  }

  function formatTimeDisplay(timeStr) {
    if (!timeStr) return '—';
    const parts = String(timeStr).split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes} ${ampm}`;
    }
    return timeStr;
  }

  function formatAuditDate(dateVal) {
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function initialsForName(name) {
    if (!name) return 'P';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'P';
  }

  function showToast(message, type = 'info') {
    if (typeof window.adminToast === 'function') {
      window.adminToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // Fetch from server
  async function loadDevelopmentRoster(preserveSelection = true) {
    try {
      const res = await fetch(API_URL, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (res.status === 401) {
        window.location.href = '../login.html';
        return;
      }
      if (res.status === 403) {
        showToast('Access denied: Coach or Admin required.', 'danger');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        return;
      }
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data || !data.success) {
        throw new Error(data.message || 'Failed to load players roster');
      }

      playersRoster = Array.isArray(data.players) ? data.players : [];
      teamsList = Array.isArray(data.teams) ? data.teams : [];

      populateTeamDropdown();

      const previousId = selectedPlayerId;
      if (!preserveSelection || !previousId || !playersRoster.some((p) => p.id === previousId)) {
        selectedPlayerId = playersRoster.length > 0 ? playersRoster[0].id : null;
      }

      renderPlayerList();
      renderSelectedProfile();
    } catch (err) {
      console.error('Error loading development roster:', err);
      showToast('Error loading development data: ' + err.message, 'danger');
    }
  }

  function populateTeamDropdown() {
    if (!teamFilter) return;
    const current = teamFilter.value || 'all';
    teamFilter.innerHTML = '<option value="all">All Teams</option>';
    teamsList.forEach((team) => {
      const opt = document.createElement('option');
      opt.value = team;
      opt.textContent = team;
      teamFilter.appendChild(opt);
    });
    if (current !== 'all' && teamsList.includes(current)) {
      teamFilter.value = current;
    } else {
      teamFilter.value = 'all';
    }
  }

  function getSelectedPlayer() {
    return playersRoster.find((p) => p.id === selectedPlayerId) || null;
  }

  function renderPlayerList() {
    if (!playerListEl) return;
    const term = (searchInput?.value || '').toLowerCase().trim();
    const teamVal = teamFilter?.value || 'all';
    const statusVal = statusFilter?.value || 'all';

    const filtered = playersRoster.filter((player) => {
      const searchHaystack = `${player.name || ''} ${player.email || ''} ${player.teamName || ''} ${player.position || ''}`.toLowerCase();
      const matchesTerm = !term || searchHaystack.includes(term);
      const matchesTeam = teamVal === 'all' || (player.teamName || '').toLowerCase() === teamVal.toLowerCase();
      const matchesStatus = statusVal === 'all' || (player.status || 'active').toLowerCase() === statusVal.toLowerCase();
      return matchesTerm && matchesTeam && matchesStatus;
    });

    if (playerCountEl) {
      playerCountEl.textContent = filtered.length;
    }

    if (!filtered.length) {
      if (emptyStateEl) emptyStateEl.style.display = 'block';
      playerListEl.innerHTML = '';
      if (profileContentEl) profileContentEl.style.display = 'none';
      return;
    }

    if (emptyStateEl) emptyStateEl.style.display = 'none';
    if (profileContentEl) profileContentEl.style.display = 'block';

    playerListEl.innerHTML = filtered.map((player) => `
      <button type="button" class="development-player-item ${player.id === selectedPlayerId ? 'is-active' : ''}" data-player-id="${player.id}">
        <span class="development-player-avatar">${initialsForName(player.name)}</span>
        <span class="development-player-meta">
          <strong>${escapeHtml(player.name || 'Player')}</strong>
          <span>${escapeHtml(player.teamName || 'Unassigned')} • ${escapeHtml(player.position || 'Player')}</span>
        </span>
      </button>
    `).join('');

    playerListEl.querySelectorAll('.development-player-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.playerId, 10);
        if (id !== selectedPlayerId) {
          selectedPlayerId = id;
          setEditingMode(false);
          renderPlayerList();
          renderSelectedProfile();
        }
      });
    });

    if (!selectedPlayerId || !filtered.some((p) => p.id === selectedPlayerId)) {
      selectedPlayerId = filtered[0].id;
    }
  }

  function renderSelectedProfile() {
    const player = getSelectedPlayer();
    if (!player) {
      if (profileContentEl) profileContentEl.style.display = 'none';
      if (emptyStateEl) emptyStateEl.style.display = 'block';
      return;
    }

    if (profileContentEl) profileContentEl.style.display = 'block';
    if (emptyStateEl) emptyStateEl.style.display = 'none';

    populateFormFields(player);
    setEditingMode(false);
  }

  function populateFormFields(player) {
    const dev = player.development || {};
    const perf = dev.performance || {};
    const train = dev.training || {};
    const sched = dev.schedule || {};
    const goals = dev.goals || {};
    const prog = dev.progress || {};
    const audit = dev.audit || {};

    // Header summary
    const nameEl = document.getElementById('devPlayerName');
    const metaEl = document.getElementById('devPlayerMeta');
    const statusBadge = document.getElementById('devStatusBadge');
    if (nameEl) nameEl.textContent = player.name || 'Player';
    if (metaEl) metaEl.textContent = `${player.teamName || 'Unassigned'} • ${player.position || 'Player'} #${player.jersey_number || '00'}`;
    if (statusBadge) {
      const st = (player.status || 'active').toLowerCase();
      statusBadge.textContent = st.replace('_', ' ');
      statusBadge.className = `admin-status ${st === 'injured' ? 'draft' : (st === 'inactive' ? 'pending' : 'active')}`;
    }

    // Top Stat Cards
    const devPpg = document.getElementById('devPpg');
    const devApg = document.getElementById('devApg');
    const devRpg = document.getElementById('devRpg');
    const devProg = document.getElementById('devOverallProgress');
    if (devPpg) devPpg.textContent = Number(perf.ppg || 0).toFixed(1);
    if (devApg) devApg.textContent = Number(perf.apg || 0).toFixed(1);
    if (devRpg) devRpg.textContent = Number(perf.rpg || 0).toFixed(1);
    if (devProg) devProg.textContent = `${Math.round(prog.overall || 0)}%`;

    // Audit Info
    const createdByEl = document.getElementById('devCreatedByText');
    const updatedByEl = document.getElementById('devUpdatedByText');
    if (createdByEl) {
      const creator = audit.createdBy || 'Staff';
      const createdTime = audit.createdAt ? ` • ${formatAuditDate(audit.createdAt)}` : '';
      createdByEl.textContent = `Added by: ${creator}${createdTime}`;
    }
    if (updatedByEl) {
      const updater = audit.updatedBy || audit.createdBy || 'Staff';
      const updatedTime = audit.updatedAt ? ` • ${formatAuditDate(audit.updatedAt)}` : '';
      updatedByEl.textContent = `Updated by: ${updater}${updatedTime}`;
    }

    // Performance Tab - Readonly
    setText('readonlyPpg', Number(perf.ppg || 0).toFixed(1));
    setText('readonlyApg', Number(perf.apg || 0).toFixed(1));
    setText('readonlyRpg', Number(perf.rpg || 0).toFixed(1));
    setText('readonlyFgPct', `${Number(perf.fgPct || 0).toFixed(1)}%`);
    setText('readonlyThreePct', `${Number(perf.threePct || 0).toFixed(1)}%`);
    setText('readonlyUsage', `${Number(perf.usage || 0).toFixed(1)}%`);

    // Performance Tab - Inputs
    setValue('inputPpg', perf.ppg ?? 0);
    setValue('inputApg', perf.apg ?? 0);
    setValue('inputRpg', perf.rpg ?? 0);
    setValue('inputFgPct', perf.fgPct ?? 0);
    setValue('inputThreePct', perf.threePct ?? 0);
    setValue('inputUsage', perf.usage ?? 0);

    // Training Tab - Readonly
    setText('viewFocus', train.focus || 'Not specified');
    setText('viewWorkouts', train.workouts || 'Not specified');
    setText('viewRecovery', train.recovery || 'Not specified');
    setText('viewNextSessionDate', formatDateDisplay(train.nextSessionDate));
    setText('viewNextSessionTime', formatTimeDisplay(train.nextSessionTime));

    // Training Tab - Inputs
    setValue('inputFocus', train.focus || '');
    setValue('inputWorkouts', train.workouts || '');
    setValue('inputRecovery', train.recovery || '');
    setValue('inputNextSessionDate', train.nextSessionDate || '');
    setValue('inputNextSessionTime', train.nextSessionTime || '');

    // Schedule Tab - Readonly
    setText('viewAvailability', sched.availability || 'Available');
    setText('viewNextGame', sched.nextGame || 'Not scheduled');
    setText('viewNextPracticeDate', formatDateDisplay(sched.nextPracticeDate));
    setText('viewNextPracticeTime', formatTimeDisplay(sched.nextPracticeTime));

    // Schedule Tab - Inputs
    setValue('inputAvailability', sched.availability || 'Available');
    setValue('inputNextGame', sched.nextGame || '');
    setValue('inputNextPracticeDate', sched.nextPracticeDate || '');
    setValue('inputNextPracticeTime', sched.nextPracticeTime || '');

    // Goals Tab - Readonly
    setText('viewSeasonGoal', goals.seasonGoal || 'No season goal set');
    setText('viewImmediateGoal', goals.immediateGoal || 'No immediate goal set');
    setText('viewActionPlan', goals.actionPlan || 'No action plan set');

    // Goals Tab - Inputs
    setValue('inputSeasonGoal', goals.seasonGoal || '');
    setValue('inputImmediateGoal', goals.immediateGoal || '');
    setValue('inputActionPlan', goals.actionPlan || '');

    // Progress Tab - Readonly
    setText('viewOverallProgress', `${prog.overall ?? 0}%`);
    setText('viewReadiness', `${prog.readiness ?? 0}%`);
    setText('viewSummary', prog.summary || 'No summary recorded');

    // Progress Tab - Inputs
    setValue('inputOverallProgress', prog.overall ?? 0);
    setValue('inputReadiness', prog.readiness ?? 0);
    setValue('inputSummary', prog.summary || '');
  }

  function setEditingMode(enabled) {
    isEditing = enabled;
    if (profileContentEl) {
      profileContentEl.classList.toggle('development-is-editing', enabled);
    }

    if (editBtn) {
      editBtn.textContent = enabled ? 'Cancel Edit' : 'Edit Development';
      editBtn.classList.toggle('btn-primary', !enabled);
      editBtn.classList.toggle('btn-outline', enabled);
    }

    if (saveBtn) saveBtn.style.display = enabled ? 'inline-flex' : 'none';
    if (resetBtn) resetBtn.style.display = enabled ? 'inline-flex' : 'none';
    if (cancelBtn) cancelBtn.style.display = enabled ? 'inline-flex' : 'none';

    // Toggle disabled state on all form controls
    const inputIds = [
      'inputPpg', 'inputApg', 'inputRpg', 'inputFgPct', 'inputThreePct', 'inputUsage',
      'inputFocus', 'inputWorkouts', 'inputRecovery', 'inputNextSessionDate', 'inputNextSessionTime',
      'inputAvailability', 'inputNextGame', 'inputNextPracticeDate', 'inputNextPracticeTime',
      'inputSeasonGoal', 'inputImmediateGoal', 'inputActionPlan',
      'inputOverallProgress', 'inputReadiness', 'inputSummary'
    ];

    inputIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.disabled = !enabled;
      }
    });
  }

  function collectFormData() {
    return {
      player_id: selectedPlayerId,
      performance: {
        ppg: parseFloat(getValue('inputPpg')) || 0,
        apg: parseFloat(getValue('inputApg')) || 0,
        rpg: parseFloat(getValue('inputRpg')) || 0,
        fgPct: parseFloat(getValue('inputFgPct')) || 0,
        threePct: parseFloat(getValue('inputThreePct')) || 0,
        usage: parseFloat(getValue('inputUsage')) || 0
      },
      training: {
        focus: getValue('inputFocus'),
        workouts: getValue('inputWorkouts'),
        recovery: getValue('inputRecovery'),
        nextSessionDate: getValue('inputNextSessionDate'),
        nextSessionTime: getValue('inputNextSessionTime')
      },
      schedule: {
        availability: getValue('inputAvailability'),
        nextGame: getValue('inputNextGame'),
        nextPracticeDate: getValue('inputNextPracticeDate'),
        nextPracticeTime: getValue('inputNextPracticeTime')
      },
      goals: {
        seasonGoal: getValue('inputSeasonGoal'),
        immediateGoal: getValue('inputImmediateGoal'),
        actionPlan: getValue('inputActionPlan')
      },
      progress: {
        overall: parseInt(getValue('inputOverallProgress'), 10) || 0,
        readiness: parseInt(getValue('inputReadiness'), 10) || 0,
        summary: getValue('inputSummary')
      }
    };
  }

  async function handleSave() {
    if (!selectedPlayerId || isSaving) return;
    const player = getSelectedPlayer();
    if (!player) return;

    const payload = collectFormData();
    isSaving = true;
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        window.location.href = '../login.html';
        return;
      }
      if (res.status === 403) {
        showToast('Forbidden: Administrator or Coach privileges required.', 'danger');
        return;
      }

      const data = await res.json();
      if (!data || !data.success) {
        throw new Error(data.message || 'Failed to update player development');
      }

      showToast(`Development updates saved for ${player.name}.`, 'success');

      // Reload server data to ensure source of truth and update audit info
      await loadDevelopmentRoster(true);
      setEditingMode(false);
    } catch (err) {
      console.error('Error saving development record:', err);
      showToast('Save failed: ' + err.message, 'danger');
    } finally {
      isSaving = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    }
  }

  function setActiveTab(tabName) {
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    document.querySelectorAll('.development-tab-panel').forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.panel === tabName);
    });
  }

  // Helper utils
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderPlayerList();
    });
  }

  if (teamFilter) {
    teamFilter.addEventListener('change', () => {
      renderPlayerList();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      renderPlayerList();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadDevelopmentRoster(true);
      showToast('Development roster refreshed.', 'info');
    });
  }

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      setEditingMode(!isEditing);
      if (!isEditing) {
        // Cancelled edit, reset to player's current values
        const player = getSelectedPlayer();
        if (player) populateFormFields(player);
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      setEditingMode(false);
      const player = getSelectedPlayer();
      if (player) populateFormFields(player);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const player = getSelectedPlayer();
      if (player) populateFormFields(player);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', handleSave);
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveTab(btn.dataset.tab);
    });
  });

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    loadDevelopmentRoster(false);
  });
})();
