/**
 * Surge Elite — Admin Portal Shared JavaScript
 * Handles sidebar toggle, modals, search, toast notifications, and shared admin utilities.
 */

(function () {
  'use strict';

  // ─── SIDEBAR TOGGLE (MOBILE) ───────────────────────────────────────────
  const sidebar = document.getElementById('adminSidebar');
  const sidebarOverlay = document.getElementById('adminSidebarOverlay');
  const mobileToggle = document.getElementById('adminMobileToggle');

  function openSidebar() {
    sidebar?.classList.add('open');
    sidebarOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar?.classList.remove('open');
    sidebarOverlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  mobileToggle?.addEventListener('click', openSidebar);
  sidebarOverlay?.addEventListener('click', closeSidebar);

  // Close sidebar on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
      closeAllModals();
    }
  });

  // ─── MODAL SYSTEM ──────────────────────────────────────────────────────
  window.adminOpenModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  window.adminCloseModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  function closeAllModals() {
    document.querySelectorAll('.admin-modal-overlay.open').forEach((m) => {
      m.classList.remove('open');
    });
    document.body.style.overflow = '';
  }

  // Close modal on backdrop click
  document.querySelectorAll('.admin-modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

  // Close buttons
  document.querySelectorAll('.admin-modal-close').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.admin-modal-overlay');
      if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

  // Cancel buttons in modals
  document.querySelectorAll('[data-dismiss="modal"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.admin-modal-overlay');
      if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

  // ─── TOAST NOTIFICATIONS ───────────────────────────────────────────────
  window.adminToast = function (message, type = 'info', duration = 3500) {
    let container = document.querySelector('.admin-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'admin-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.animation = 'toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)';

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };

    toast.innerHTML = `
      <span style="display:flex;align-items:center;gap:0.6rem;">
        <span style="font-weight:800;font-size:1.05rem;">${icons[type] || icons.info}</span>
        <span style="font-size:0.85rem;">${message}</span>
      </span>
      <button style="font-size:1.2rem;color:var(--text-muted);line-height:1;cursor:pointer;background:none;border:none;" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(120%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // ─── TABLE SEARCH ──────────────────────────────────────────────────────
  window.adminTableSearch = function (inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    if (!input || !table) return;

    input.addEventListener('input', () => {
      const term = input.value.toLowerCase().trim();
      const rows = table.querySelectorAll('tbody tr');

      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
      });

      // Update count if footer exists
      const footer = table.closest('.admin-table-card')?.querySelector('.admin-table-footer span');
      if (footer) {
        const visible = table.querySelectorAll('tbody tr:not([style*="display: none"])').length;
        const total = rows.length;
        footer.textContent = `Showing ${visible} of ${total} entries`;
      }
    });
  };

  // ─── FILTER SELECT HANDLER ─────────────────────────────────────────────
  window.adminFilterTable = function (selectId, tableId, colIndex) {
    const select = document.getElementById(selectId);
    const table = document.getElementById(tableId);
    if (!select || !table) return;

    select.addEventListener('change', () => {
      const val = select.value.toLowerCase();
      const rows = table.querySelectorAll('tbody tr');

      rows.forEach((row) => {
        if (val === 'all' || val === '') {
          row.style.display = '';
        } else {
          const cell = row.querySelectorAll('td')[colIndex];
          const text = cell?.textContent?.toLowerCase().trim() || '';
          row.style.display = text.includes(val) ? '' : 'none';
        }
      });
    });
  };

  // ─── CONFIRM DELETE ────────────────────────────────────────────────────
  window.adminConfirmDelete = function (entityName, callback) {
    if (confirm(`Are you sure you want to delete "${entityName}"? This action cannot be undone.`)) {
      if (typeof callback === 'function') callback();
      adminToast(`${entityName} has been deleted.`, 'success');
    }
  };

  // ─── FORM SUBMIT HANDLER ───────────────────────────────────────────────
  window.adminHandleFormSubmit = function (formId, modalId, successMessage) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      adminCloseModal(modalId);
      adminToast(successMessage || 'Changes saved successfully.', 'success');
      form.reset();
    });
  };

  // ─── AUDIT TRAIL HELPERS ───────────────────────────────────────────────
  function getCurrentAuditAccount() {
    return 'Admin Director';
  }

  function resolveAuditActorName(value, fallback = getCurrentAuditAccount()) {
    if (value === null || value === undefined || value === '') {
      return fallback || 'Admin Director';
    }
    if (typeof value === 'string') {
      return value.trim() || (fallback || 'Admin Director');
    }
    if (typeof value === 'object') {
      return value.name || value.email || fallback || 'Admin Director';
    }
    return String(value) || (fallback || 'Admin Director');
  }

  window.getCurrentAuditAccount = function () {
    return getCurrentAuditAccount();
  };

  window.resolveAuditActorName = function (value, fallback) {
    return resolveAuditActorName(value, fallback);
  };

  function applyAuditMetadata(record, options = {}) {
    const actorName = options.actorName || getCurrentAuditAccount() || 'Admin Director';
    const now = new Date().toISOString();
    const current = { ...(record || {}) };

    if (!current.createdAt && !current.createdDate) {
      current.createdAt = now;
      current.createdDate = now;
      current.createdBy = actorName;
    } else {
      current.createdAt = current.createdAt || current.createdDate || now;
      current.createdDate = current.createdDate || current.createdAt || now;
      current.createdBy = current.createdBy || actorName;
    }

    current.updatedAt = now;
    current.lastModifiedAt = now;
    current.lastModifiedDate = now;
    current.lastModifiedBy = actorName;
    return current;
  }

  window.applyAuditMetadata = function (record, options) {
    return applyAuditMetadata(record, options || {});
  };

  // ─── BACKEND-BACKED ADMIN DATA ───────────────────────────────────────────
  const ADMIN_API = '../../backend/public/api/admin-data.php';
  const GAME_API = '../../backend/public/api/games.php';
  const adminCache = { leagues: {}, teams: {}, players: [], games: {}, broadcasts: {} };
  function request(url, method = 'GET', body = null) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, false);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    if (body !== null) xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(body === null ? null : JSON.stringify(body));
    if (xhr.status < 200 || xhr.status >= 300) return null;
    try { const payload = JSON.parse(xhr.responseText); return payload.data ?? payload; } catch (e) { return null; }
  }
  function reloadAdminData() {
    const data = request(ADMIN_API);
    if (data && typeof data === 'object') {
      adminCache.leagues = data.leagues || {};
      adminCache.teams = {};
      Object.keys(data.teams || {}).forEach(id => {
        const team = data.teams[id];
        adminCache.teams[id] = { ...team, id: team.id || id, leagueId: team.leagueId || team.league_id, players: Array.isArray(team.players) ? team.players : [] };
      });
      adminCache.players = Array.isArray(data.players) ? data.players.map(player => ({ ...player, id: player.id, teamId: player.teamId || player.team_id, teamName: player.teamName || player.team_name, name: player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim() })) : [];
    }
    const games = request(GAME_API);
    if (Array.isArray(games)) {
      adminCache.games = {      }
      const broadcasts = request(`${ADMIN_API}?entity=broadcasts`);
      adminCache.broadcasts = broadcasts && typeof broadcasts === 'object' ? broadcasts : {};;
      games.forEach(game => { adminCache.games[String(game.id)] = {
        ...game, date: game.game_date, time: game.game_time, homeTeamId: game.home_team_id,
        awayTeamId: game.away_team_id, leagueId: game.league_id, seasonId: game.season_id,
        homeScore: game.home_score, awayScore: game.away_score, venue: game.venue_name
      }; });
    }
  }
  window.getLiveBroadcasts = () => adminCache.broadcasts;
  window.getBroadcastForGame = (id) => window.getLiveBroadcasts()[id] || null;
  window.saveBroadcastForGame = (id, data) => {
    const saved = request(`${ADMIN_API}?entity=broadcasts`, 'POST', { ...data, gameId: id });
    const result = saved || { ...data, gameId: id };
    adminCache.broadcasts[id] = result;
    return result;
  };
  window.removeBroadcastForGame = (id) => { request(`${ADMIN_API}?entity=broadcasts&id=${id}`, 'DELETE'); delete adminCache.broadcasts[id]; };
  window.getAdminLeagues = () => adminCache.leagues;
  window.getAdminLeagueById = (id) => adminCache.leagues[id] || null;
  window.saveAdminLeague = (data) => {
    const saved = request(`${ADMIN_API}?entity=leagues${data.id ? `&id=${data.id}` : ''}`, data.id ? 'PUT' : 'POST', data);
    if (saved) adminCache.leagues[String(saved.id)] = { ...data, ...saved, id: saved.id };
    return saved || data;
  };
  window.deleteAdminLeague = (id) => {
    if (Object.values(adminCache.teams).some(t => String(t.league_id || t.leagueId) === String(id))) return { ok: false, reason: 'League still has teams assigned.' };
    const result = request(`${ADMIN_API}?entity=leagues&id=${id}`, 'DELETE');
    if (result) { delete adminCache.leagues[id]; return { ok: true }; }
    return { ok: false, reason: 'Unable to delete league.' };
  };
  window.getAdminTeams = () => adminCache.teams;
  window.getAdminTeamById = (id) => adminCache.teams[id] || null;
  window.saveAdminTeam = (data) => {
    const saved = request(`${ADMIN_API}?entity=teams${data.id ? `&id=${data.id}` : ''}`, data.id ? 'PUT' : 'POST', data);
    if (saved) adminCache.teams[String(saved.id)] = { ...data, ...saved, id: saved.id, leagueId: saved.league_id, season: saved.season };
    return saved || data;
  };
  window.deleteAdminTeam = (id) => {
    const result = request(`${ADMIN_API}?entity=teams&id=${id}`, 'DELETE');
    if (result) { delete adminCache.teams[id]; return true; }
    return false;
  };
  window.saveTeamCoach = (id, coach) => { const team = window.getAdminTeamById(id); return team ? (team.coach = coach, team) : null; };
  window.removeTeamCoach = (id) => window.saveTeamCoach(id, null);
  window.saveTeamPlayer = (teamId, player) => {
    const payload = { ...player, team_id: teamId, first_name: player.first_name || player.firstName || (player.name || '').split(' ')[0], last_name: player.last_name || player.lastName || (player.name || '').split(' ').slice(1).join(' ') };
    const saved = request(`${ADMIN_API}?entity=players${player.id ? `&id=${player.id}` : ''}`, player.id ? 'PUT' : 'POST', payload);
    reloadAdminData(); return window.getAdminTeamById(teamId) || saved;
  };
  window.removeTeamPlayer = () => null;
  function normalizePlayerDevelopment(player = {}) {
    const current = player.development || {};
    const teamCoach = player.teamCoachName || player.coachName || 'Coach Staff';
    const actor = player.lastModifiedBy || player.createdBy || teamCoach || 'Coach Staff';
    return {
      performance: { ...(current.performance || {}) },
      training: { ...(current.training || {}) },
      schedule: { ...(current.schedule || {}) },
      goals: { ...(current.goals || {}) },
      progress: { ...(current.progress || {}) },
      createdBy: current.createdBy || player.createdBy || teamCoach || 'Coach Staff',
      updatedBy: current.updatedBy || current.lastUpdatedBy || actor,
      lastUpdated: current.lastUpdated || new Date().toISOString(),
      lastUpdatedBy: current.lastUpdatedBy || current.updatedBy || actor
    };
  }

  window.getAdminPlayers = () => adminCache.players;

  window.getPlayerDevelopmentRecord = function (playerId) {
    const teams = window.getAdminTeams ? window.getAdminTeams() : {};
    for (const teamId in teams) {
      const team = teams[teamId];
      if (!team || !Array.isArray(team.players)) continue;
      const player = team.players.find((entry) => entry.id === playerId);
      if (player) {
        const normalized = normalizePlayerDevelopment({ ...player, teamCoachName: team.coach && team.coach.name ? team.coach.name : 'Coach Staff' });
        player.development = normalized;
        return normalized;
      }
    }
    return normalizePlayerDevelopment({ teamCoachName: 'Coach Staff' });
  };

  window.savePlayerDevelopmentRecord = function (playerId, updatedValues) {
    const teams = window.getAdminTeams ? window.getAdminTeams() : {};
    const selectedTeam = Object.values(teams).find(team => Array.isArray(team.players) && team.players.some(entry => entry.id === playerId));
    const coachName = (selectedTeam && selectedTeam.coach && selectedTeam.coach.name) || 'Coach Staff';
    const actorName = updatedValues && (updatedValues.lastUpdatedBy || updatedValues.updatedBy) ? (updatedValues.lastUpdatedBy || updatedValues.updatedBy) : coachName;

    for (const teamId in teams) {
      const team = teams[teamId];
      if (!team || !Array.isArray(team.players)) continue;
      const index = team.players.findIndex((entry) => entry.id === playerId);
      if (index === -1) continue;

      const existing = normalizePlayerDevelopment({ ...team.players[index], teamCoachName: coachName });
      const merged = normalizePlayerDevelopment({
        ...team.players[index],
        teamCoachName: coachName,
        development: {
          ...existing,
          ...(updatedValues || {}),
          performance: {
            ...existing.performance,
            ...((updatedValues && updatedValues.performance) || {})
          },
          training: {
            ...existing.training,
            ...((updatedValues && updatedValues.training) || {})
          },
          schedule: {
            ...existing.schedule,
            ...((updatedValues && updatedValues.schedule) || {})
          },
          goals: {
            ...existing.goals,
            ...((updatedValues && updatedValues.goals) || {})
          },
          progress: {
            ...existing.progress,
            ...((updatedValues && updatedValues.progress) || {})
          },
          createdBy: team.players[index].createdBy || existing.createdBy || coachName,
          updatedBy: actorName,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: actorName
        }
      });

      team.players[index].development = merged;
      team.players[index].createdBy = team.players[index].createdBy || coachName;
      team.players[index].lastModifiedBy = actorName;
      team.players[index].lastModifiedAt = new Date().toISOString();
      team.players[index].updatedAt = new Date().toISOString();
      return merged;
    }
    return normalizePlayerDevelopment({ teamCoachName: coachName });
  };

  window.getPlayerProfileById = function (playerId) {
    const teams = window.getAdminTeams ? window.getAdminTeams() : {};
    for (const teamId in teams) {
      const team = teams[teamId];
      if (!team || !Array.isArray(team.players)) continue;
      const player = team.players.find((entry) => entry.id === playerId);
      if (player) {
        return {
          teamId: team.id,
          teamName: team.name,
          player: {
            ...player,
            teamId: team.id,
            teamName: team.name
          }
        };
      }
    }
    return null;
  };

  window.savePlayerProfileById = function (playerId, profileData) {
    const teams = window.getAdminTeams ? window.getAdminTeams() : {};
    for (const teamId in teams) {
      const team = teams[teamId];
      if (!team || !Array.isArray(team.players)) continue;
      const index = team.players.findIndex((entry) => entry.id === playerId);
      if (index === -1) continue;

      const current = team.players[index];
      const merged = {
        ...current,
        ...profileData,
        id: playerId,
        name: [profileData.firstName || current.firstName || current.name?.split(' ')[0], profileData.lastName || current.lastName || current.name?.split(' ').slice(1).join(' ')].filter(Boolean).join(' '),
        preferredName: profileData.preferredName || current.preferredName || profileData.firstName || current.firstName || current.name?.split(' ')[0],
        teamId: team.id,
        teamName: team.name,
        updatedAt: new Date().toISOString()
      };

      team.players[index] = merged;
      return {
        teamId: team.id,
        teamName: team.name,
        player: merged
      };
    }
    return null;
  };

  /**
   * Save player info. Handles team reassignment if targetTeamId is different from originalTeamId.
   */
  window.saveCentralPlayer = function (originalTeamId, targetTeamId, playerData) {
    if (originalTeamId && targetTeamId && originalTeamId !== targetTeamId) {
      // Remove from original team roster
      window.removeTeamPlayer(originalTeamId, playerData.id);
    }
    // Save to the (possibly new) target team roster
    return window.saveTeamPlayer(targetTeamId, playerData);
  };

  // Sync nav bar counts across admin portal on load
  function syncAdminNavigationCounts() {
    try {
      const teams = window.getAdminTeams();
      const tCount = Object.keys(teams).length;
      document.querySelectorAll('.admin-nav-link[href="teams.html"] .nav-count').forEach(el => {
        el.textContent = tCount;
      });

      const leagues = window.getAdminLeagues();
      const lCount = Object.keys(leagues).length;
      document.querySelectorAll('.admin-nav-link[href="leagues.html"] .nav-count').forEach(el => {
        el.textContent = lCount;
      });

      const pCount = window.getAdminPlayers().length;
      document.querySelectorAll('.admin-nav-link[href="players.html"] .nav-count').forEach(el => {
        el.textContent = pCount;
      });

      const gCount = Object.keys(window.getAdminGames()).length;
      document.querySelectorAll('.admin-nav-link[href="games.html"] .nav-count').forEach(el => {
        el.textContent = gCount;
      });
    } catch (e) { }
  }

  function buildDashboardKpis() {
    const cards = document.querySelectorAll('.admin-kpi-card');
    if (!cards.length) return;

    const leagues = window.getAdminLeagues() || {};
    const teams = window.getAdminTeams() || {};
    const players = window.getAdminPlayers() || [];
    const games = window.getAdminGames() || {};

    const metrics = [
      {
        label: 'Total Leagues',
        value: Object.keys(leagues).length,
        emptyText: 'No leagues yet'
      },
      {
        label: 'Active Teams',
        value: Object.values(teams).filter(team => String(team.status || '').toLowerCase() === 'active').length,
        emptyText: 'No teams yet'
      },
      {
        label: 'Registered Players',
        value: players.length,
        emptyText: 'No players registered'
      },
      {
        label: 'Scheduled Games',
        value: Object.values(games).filter(game => String(game.status || '').toLowerCase() === 'scheduled').length,
        emptyText: 'No games scheduled'
      },
      {
        label: 'Completed Games',
        value: Object.values(games).filter(game => String(game.status || '').toLowerCase() === 'completed').length,
        emptyText: 'No games scheduled'
      }
    ];

    cards.forEach((card) => {
      const labelEl = card.querySelector('.admin-kpi-label');
      const valueEl = card.querySelector('.admin-kpi-value');
      const trendEl = card.querySelector('.admin-kpi-trend span');
      if (!labelEl || !valueEl || !trendEl) return;

      const label = labelEl.textContent.trim();
      const metric = metrics.find(item => item.label === label);
      if (!metric) return;

      valueEl.textContent = String(metric.value);
      if (metric.value === 0) {
        trendEl.textContent = metric.emptyText;
      }
    });
  }

  function getSafeTeamName(teamId) {
    const team = window.getAdminTeamById(teamId);
    return team && team.name ? team.name : 'Unknown Team';
  }

  function getSafeLeagueName(leagueId) {
    const league = window.getAdminLeagueById(leagueId);
    return league && league.name ? league.name : 'Unknown League';
  }

  function gameTimestampValue(game) {
    if (!game) return 0;
    const date = game.date || '1970-01-01';
    const time = game.time || '00:00';
    const parsed = new Date(`${date}T${time}:00`);
    if (Number.isNaN(parsed.getTime())) return 0;
    return parsed.getTime();
  }

  function formatGameDateTime(game) {
    const date = game && game.date ? game.date : '';
    const time = game && game.time ? game.time : '';
    if (!date && !time) return 'Date unavailable';

    const normalized = `${date || '1970-01-01'}T${time || '00:00'}:00`;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return [date, time].filter(Boolean).join(' • ');
    }

    const formattedDate = parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const formattedTime = parsed.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    return `${formattedDate} • ${formattedTime}`;
  }

  function getGameStatusMarkup(game) {
    const status = String(game.status || '').toLowerCase();

    if (status === 'completed') {
      const homeScore = game.homeScore !== null && game.homeScore !== undefined ? game.homeScore : '—';
      const awayScore = game.awayScore !== null && game.awayScore !== undefined ? game.awayScore : '—';
      return `<span class="admin-status completed">Completed (${homeScore} - ${awayScore})</span>`;
    }

    if (status === 'in-progress' || status === 'in_progress' || status === 'live' || status === 'in progress') {
      return '<span class="admin-status scheduled">In Progress</span>';
    }

    return '<span class="admin-status scheduled">Scheduled</span>';
  }

  function renderRecentGames() {
    const tableBody = document.querySelector('.admin-table-card .admin-table tbody');
    if (!tableBody) return;

    const games = Object.values(window.getAdminGames() || {}).sort((a, b) => gameTimestampValue(b) - gameTimestampValue(a));
    if (!games.length) {
      tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No games scheduled</td></tr>';
      return;
    }

    tableBody.innerHTML = games.map((game) => {
      const homeName = getSafeTeamName(game.homeTeamId);
      const awayName = getSafeTeamName(game.awayTeamId);
      const leagueName = getSafeLeagueName(game.leagueId);
      return `
        <tr>
          <td>
            <div class="admin-matchup-cell">
              <span>${homeName}</span>
              <span class="admin-matchup-vs">VS</span>
              <span>${awayName}</span>
            </div>
          </td>
          <td>${leagueName}</td>
          <td>${formatGameDateTime(game)}</td>
          <td>${getGameStatusMarkup(game)}</td>
        </tr>
      `;
    }).join('');
  }

  function formatActivityTimestamp(isoString) {
    if (!isoString) return 'Unknown date';
    const parsed = new Date(isoString);
    if (Number.isNaN(parsed.getTime())) return 'Unknown date';
    return parsed.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function renderRecentActivity() {
    const list = document.querySelector('.admin-activity-list');
    if (!list) return;

    const entries = [];

    Object.values(window.getAdminLeagues() || {}).forEach((league) => {
      const timestamp = league && (league.lastModifiedDate || league.lastModifiedAt || league.updatedAt || league.createdDate || league.createdAt);
      if (!league || !timestamp) return;
      const actor = league.lastModifiedBy || league.createdBy || getCurrentAuditAccount();
      entries.push({
        type: 'league',
        badge: 'orange',
        description: `<strong>League updated:</strong> ${league.name || 'League'} by ${actor}.`,
        timestamp: timestamp
      });
    });

    Object.values(window.getAdminTeams() || {}).forEach((team) => {
      const timestamp = team && (team.lastModifiedDate || team.lastModifiedAt || team.updatedAt || team.createdDate || team.createdAt);
      if (!team || !timestamp) return;
      const actor = team.lastModifiedBy || team.createdBy || getCurrentAuditAccount();
      entries.push({
        type: 'team',
        badge: 'cyan',
        description: `<strong>Team updated:</strong> ${team.name || 'Team'} by ${actor}.`,
        timestamp: timestamp
      });
    });

    Object.values(window.getAdminGames() || {}).forEach((game) => {
      const timestamp = game && (game.lastModifiedDate || game.lastModifiedAt || game.updatedAt || game.createdDate || game.createdAt);
      if (!game || !timestamp) return;
      const matchup = `${getSafeTeamName(game.homeTeamId)} vs ${getSafeTeamName(game.awayTeamId)}`;
      const actor = game.lastModifiedBy || game.createdBy || getCurrentAuditAccount();
      entries.push({
        type: 'game',
        badge: 'green',
        description: `<strong>Game updated:</strong> ${matchup} by ${actor}.`,
        timestamp: timestamp
      });
    });

    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (!entries.length) {
      list.innerHTML = '<li class="admin-activity-item"><div class="admin-activity-text">No recent activity available.</div></li>';
      return;
    }

    list.innerHTML = entries.slice(0, 4).map((entry) => `
      <li class="admin-activity-item">
        <div class="admin-activity-dot ${entry.badge}"></div>
        <div>
          <div class="admin-activity-text">${entry.description}</div>
          <div class="admin-activity-time">${formatActivityTimestamp(entry.timestamp)}</div>
        </div>
      </li>
    `).join('');
  }

  function initAdminDashboard() {
    const hasDashboardKpis = !!document.querySelector('.admin-kpi-card');
    const hasDashboardActivity = !!document.querySelector('.admin-activity-list');

    if (!hasDashboardKpis || !hasDashboardActivity) {
      return;
    }

    buildDashboardKpis();
    renderRecentGames();
    renderRecentActivity();
  }

  document.addEventListener('DOMContentLoaded', () => {
    syncAdminNavigationCounts();
    initAdminDashboard();
  });

  window.getAdminGames = () => adminCache.games;
  window.getAdminGameById = (id) => adminCache.games[id] || null;
  window.saveAdminGame = (gameData) => {
    // Issue 2 fix: when editing an existing game, always merge the authoritative
    // backend-sourced cached record first so required FK fields (season_id,
    // league_id, home_team_id, away_team_id) are never undefined or 0.
    const existingCached = gameData.id ? (adminCache.games[String(gameData.id)] || {}) : {};
    const merged = Object.assign({}, existingCached, gameData);

    const homeTeam = adminCache.teams[merged.homeTeamId || merged.home_team_id] || {};

    const seasonId   = parseInt(merged.seasonId   || merged.season_id   || homeTeam.season_id)  || 0;
    const leagueId   = parseInt(merged.leagueId   || merged.league_id)                          || 0;
    const homeTeamId = parseInt(merged.homeTeamId || merged.home_team_id)                       || 0;
    const awayTeamId = parseInt(merged.awayTeamId || merged.away_team_id)                       || 0;

    // Validate required FK fields before sending — show a clear error instead of
    // silently sending 0 which would cause a MySQL foreign-key violation.
    if (!seasonId || !leagueId || !homeTeamId || !awayTeamId) {
      const missing = [
        !seasonId   && 'season',
        !leagueId   && 'league',
        !homeTeamId && 'home team',
        !awayTeamId && 'away team'
      ].filter(Boolean).join(', ');
      if (typeof adminToast === 'function') {
        adminToast(`Cannot save game: missing required field(s): ${missing}. Please reload the page and try again.`, 'error');
      } else {
        alert(`Cannot save game: missing required field(s): ${missing}.`);
      }
      return null;
    }

    const payload = {
      season_id:    seasonId,
      league_id:    leagueId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      game_date:    merged.date || merged.game_date,
      game_time:    merged.time || merged.game_time || null,
      status:       merged.status === 'in-progress' || merged.status === 'in_progress'
                      ? 'live'
                      : (merged.status === 'verified' ? 'completed' : (merged.status || 'scheduled')),
      home_score:   parseInt(merged.homeScore ?? merged.home_score) || 0,
      away_score:   parseInt(merged.awayScore ?? merged.away_score) || 0,
      venue_id:     merged.venue_id || null
    };

    // Issue 1 fix: forward quarter scores and player stats arrays so the backend
    // GameController::update() can persist them via saveQuarters() and
    // statModel->saveBatch(). These arrays are built by admin-game-entry.js
    // using buildQuartersPayload() / buildPlayerStatsPayload().
    if (Array.isArray(merged.quarters) && merged.quarters.length) {
      payload.quarters = merged.quarters;
    }
    if (Array.isArray(merged.player_stats) && merged.player_stats.length) {
      payload.player_stats = merged.player_stats;
    }

    const saved = request(
      `${GAME_API}${gameData.id ? `?id=${gameData.id}` : ''}`,
      gameData.id ? 'PUT' : 'POST',
      payload
    );

    if (saved) {
      const id = String(saved.id || gameData.id);
      adminCache.games[id] = {
        ...merged, ...saved, id: saved.id || gameData.id,
        date: saved.game_date || merged.date,
        time: saved.game_time || merged.time,
        homeTeamId: saved.home_team_id || homeTeamId,
        awayTeamId: saved.away_team_id || awayTeamId,
        leagueId:   saved.league_id   || leagueId
      };
    }
    return saved || gameData;
  };
  window.deleteAdminGame = (id) => !!request(`${GAME_API}?id=${id}`, 'DELETE');
  reloadAdminData();
})();
