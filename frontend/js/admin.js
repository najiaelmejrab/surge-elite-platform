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

  // ─── LIVE BROADCAST DATA STORE ─────────────────────────────────────────
  const BROADCAST_STORAGE_KEY = 'surge_live_broadcasts';

  const DEFAULT_BROADCASTS = {
    'g001': {
      gameId: 'g001',
      enabled: true,
      title: 'Surge Wolves vs Apex Titans',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      scheduledDateIso: '2026-10-24',
      scheduledDate: 'October 24, 2026',
      scheduledTimeVal: '19:00',
      scheduledTime: '2026-10-24T19:00',
      status: 'live',
      thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
      description: 'High-octane U15 Youth League matchup featuring PPG leader Marcus Vance vs Elena Rostova.'
    },
    'g002': {
      gameId: 'g002',
      enabled: true,
      title: 'Metro Vipers vs Coastal Ballers',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      scheduledDateIso: '2026-10-25',
      scheduledDate: 'October 25, 2026',
      scheduledTimeVal: '16:30',
      scheduledTime: '2026-10-25T16:30',
      status: 'scheduled',
      thumbnail: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&q=80',
      description: 'U17 Junior Division battle for playoff position.'
    },
    'g003': {
      gameId: 'g003',
      enabled: true,
      title: 'Venice Wave vs Gotham Knights',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      scheduledDateIso: '2026-10-17',
      scheduledDate: 'October 17, 2026',
      scheduledTimeVal: '19:30',
      scheduledTime: '2026-10-17T19:30',
      status: 'ended',
      thumbnail: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=800&q=80',
      description: 'Full official game replay and box score commentary.'
    }
  };

  window.getLiveBroadcasts = function () {
    try {
      const stored = localStorage.getItem(BROADCAST_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(DEFAULT_BROADCASTS));
        return DEFAULT_BROADCASTS;
      }
      return JSON.parse(stored);
    } catch (e) {
      return DEFAULT_BROADCASTS;
    }
  };

  window.getBroadcastForGame = function (gameId) {
    const broadcasts = window.getLiveBroadcasts();
    return broadcasts[gameId] || null;
  };

  window.saveBroadcastForGame = function (gameId, broadcastData) {
    const broadcasts = window.getLiveBroadcasts();
    broadcasts[gameId] = {
      ...broadcastData,
      gameId: gameId,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(broadcasts));
    return broadcasts[gameId];
  };

  window.removeBroadcastForGame = function (gameId) {
    const broadcasts = window.getLiveBroadcasts();
    if (broadcasts[gameId]) {
      delete broadcasts[gameId];
      localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(broadcasts));
    }
  };

  // ─── TEAM, COACH & PLAYER CENTRALIZED STORE ──────────────────────────────
  const TEAMS_STORAGE_KEY = 'surge_admin_teams_v2';

  const DEFAULT_TEAMS_DATA = {
    't001': {
      id: 't001',
      name: 'Surge Wolves',
      badge: 'SW',
      league: 'U19 Elite League',
      season: 'Spring 2026',
      status: 'active',
      coach: {
        name: 'Juan Dela Cruz',
        title: 'Head Coach',
        email: 'juan.delacruz@surgelite.com',
        phone: '(555) 234-5678'
      },
      players: [
        { id: 'p001', name: 'Marcus Vance', jersey: '23', position: 'Point Guard (PG)', height: "6'3\"", weight: '190 lbs', status: 'active' },
        { id: 'p002', name: 'Jamal Brooks', jersey: '55', position: 'Center (C)', height: "6'11\"", weight: '245 lbs', status: 'injured' },
        { id: 'p003', name: 'Cameron Cole', jersey: '04', position: 'Shooting Guard (SG)', height: "6'2\"", weight: '185 lbs', status: 'active' },
        { id: 'p004', name: 'Daniel Garcia', jersey: '12', position: 'Point Guard (PG)', height: "6'0\"", weight: '175 lbs', status: 'active' }
      ]
    },
    't002': {
      id: 't002',
      name: 'Apex Titans',
      badge: 'AT',
      league: 'U19 Elite League',
      season: 'Spring 2026',
      status: 'active',
      coach: {
        name: 'Brian Mitchell',
        title: 'Head Coach',
        email: 'brian.mitchell@apextitans.org',
        phone: '(555) 876-5432'
      },
      players: [
        { id: 'p005', name: 'Elena Rostova', jersey: '03', position: 'Shooting Guard (SG)', height: "5'11\"", weight: '165 lbs', status: 'active' },
        { id: 'p006', name: 'David Okafor', jersey: '44', position: 'Center (C)', height: "6'10\"", weight: '235 lbs', status: 'active' },
        { id: 'p007', name: 'Mateo Silva', jersey: '10', position: 'Point Guard (PG)', height: "6'1\"", weight: '180 lbs', status: 'active' }
      ]
    },
    't003': {
      id: 't003',
      name: 'Venice Wave',
      badge: 'VW',
      league: 'Pro-Am Division',
      season: 'Spring 2026',
      status: 'active',
      coach: {
        name: 'Dave Henderson',
        title: 'Head Coach',
        email: 'dave.henderson@venicewave.com',
        phone: '(555) 345-6789'
      },
      players: [
        { id: 'p008', name: 'Paolo Reyes', jersey: '07', position: 'Power Forward (PF)', height: "6'8\"", weight: '220 lbs', status: 'active' },
        { id: 'p009', name: 'Alex Cruz', jersey: '10', position: 'Center (C)', height: "6'9\"", weight: '230 lbs', status: 'active' }
      ]
    },
    't004': {
      id: 't004',
      name: 'Gotham Knights',
      badge: 'GK',
      league: 'Pro-Am Division',
      season: 'Spring 2026',
      status: 'active',
      coach: {
        name: 'Marcus Vance Sr.',
        title: 'Head Coach',
        email: 'marcus.vance@gothamknights.com',
        phone: '(555) 987-6543'
      },
      players: [
        { id: 'p010', name: 'Miguel Santos', jersey: '04', position: 'Point Guard (PG)', height: "6'1\"", weight: '175 lbs', status: 'active' }
      ]
    },
    't005': {
      id: 't005',
      name: 'Metro Vipers',
      badge: 'MV',
      leagueId: 'l002', // U17 Junior League
      league: 'U17 Junior League',
      season: 'Spring 2026',
      status: 'active',
      coach: null,
      players: []
    },
    't006': {
      id: 't006',
      name: 'Coastal Ballers',
      badge: 'CB',
      leagueId: 'l002', // U17 Junior League
      league: 'U17 Junior League',
      season: 'Spring 2026',
      status: 'active',
      coach: null,
      players: []
    }
  };

  window.getAdminTeams = function () {
    try {
      const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
      let teams = {};
      if (!stored) {
        teams = { ...DEFAULT_TEAMS_DATA };
      } else {
        teams = JSON.parse(stored);
      }

      // Safe migration/normalization of old t.league (name string) to t.leagueId
      let migrated = false;
      let leagues = {};
      try {
        const storedLeagues = localStorage.getItem('surge_admin_leagues_v1');
        if (storedLeagues) {
          leagues = JSON.parse(storedLeagues);
        } else {
          // Default fallback leagues data from the block below
          leagues = {
            'l001': { id: 'l001', name: 'U19 Elite League' },
            'l002': { id: 'l002', name: 'U17 Junior League' },
            'l003': { id: 'l003', name: 'U15 Youth League' },
            'l004': { id: 'l004', name: 'Pro-Am Division' }
          };
        }
      } catch (err) {}

      for (const id in teams) {
        const t = teams[id];
        if (t.league && !t.leagueId) {
          const match = Object.values(leagues).find(
            l => l.name.trim().toLowerCase() === t.league.trim().toLowerCase()
          );
          if (match) {
            t.leagueId = match.id;
            migrated = true;
          }
        }
      }

      if (migrated || !stored) {
        localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
      }

      return teams;
    } catch (e) {
      return DEFAULT_TEAMS_DATA;
    }
  };

  window.getAdminTeamById = function (teamId) {
    const teams = window.getAdminTeams();
    return teams[teamId] || null;
  };

  window.saveAdminTeam = function (teamData) {
    const teams = window.getAdminTeams();
    const id = teamData.id || `t_${Date.now()}`;
    
    // Calculate badge abbreviation from team name if not provided
    const words = (teamData.name || 'Team').trim().split(/\s+/);
    const badge = teamData.badge || (words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : words[0].substring(0, 2).toUpperCase());

    const existing = teams[id] || {};
    teams[id] = {
      ...existing,
      ...teamData,
      id: id,
      badge: badge,
      coach: teamData.coach !== undefined ? teamData.coach : (existing.coach || null),
      players: teamData.players !== undefined ? teamData.players : (existing.players || []),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    return teams[id];
  };

  window.deleteAdminTeam = function (teamId) {
    const teams = window.getAdminTeams();
    if (teams[teamId]) {
      delete teams[teamId];
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    }
  };

  // Coach CRUD within Team
  window.saveTeamCoach = function (teamId, coachData) {
    const teams = window.getAdminTeams();
    if (!teams[teamId]) return null;
    teams[teamId].coach = coachData;
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    return teams[teamId];
  };

  window.removeTeamCoach = function (teamId) {
    const teams = window.getAdminTeams();
    if (!teams[teamId]) return null;
    teams[teamId].coach = null;
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    return teams[teamId];
  };

  // Player CRUD within Team
  window.saveTeamPlayer = function (teamId, playerData) {
    const teams = window.getAdminTeams();
    if (!teams[teamId]) return null;
    if (!teams[teamId].players) teams[teamId].players = [];

    const pid = playerData.id || `p_${Date.now()}`;
    const pidx = teams[teamId].players.findIndex(p => p.id === pid);

    const updatedPlayer = {
      ...playerData,
      id: pid
    };

    if (pidx >= 0) {
      teams[teamId].players[pidx] = updatedPlayer;
    } else {
      teams[teamId].players.push(updatedPlayer);
    }

    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    return teams[teamId];
  };

  window.removeTeamPlayer = function (teamId, playerId) {
    const teams = window.getAdminTeams();
    if (!teams[teamId] || !teams[teamId].players) return null;
    teams[teamId].players = teams[teamId].players.filter(p => p.id !== playerId);
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    return teams[teamId];
  };

  // ─── LEAGUE DATA STORE ────────────────────────────────────────────────────
  const LEAGUES_STORAGE_KEY = 'surge_admin_leagues_v1';

  const DEFAULT_LEAGUES_DATA = {
    'l001': {
      id: 'l001',
      name: 'U19 Elite League',
      badge: 'U19',
      badgeColor: 'rgba(249,115,22,0.15)',
      badgeTextColor: 'var(--primary)',
      season: 'Spring 2026',
      status: 'active',
      format: '16 Games + Finals',
      maxTeams: 12,
      description: 'Premier Showcase Division for U19-and-under athletes. Competitive round-robin format followed by a single-elimination finals bracket.'
    },
    'l002': {
      id: 'l002',
      name: 'U17 Junior League',
      badge: 'U17',
      badgeColor: 'rgba(6,182,212,0.15)',
      badgeTextColor: 'var(--cyan-highlight)',
      season: 'Spring 2026',
      status: 'active',
      format: '14 Games + Tournament',
      maxTeams: 20,
      description: 'Junior Championship Tier for U17 athletes. Full season play with tournament-style playoffs.'
    },
    'l003': {
      id: 'l003',
      name: 'U15 Youth League',
      badge: 'U15',
      badgeColor: 'rgba(16,185,129,0.15)',
      badgeTextColor: '#10b981',
      season: 'Spring 2026',
      status: 'upcoming',
      format: '12 Games + Playoffs',
      maxTeams: 16,
      description: 'Developmental Youth Division focusing on fundamentals, teamwork, and competitive experience for U15 athletes.'
    },
    'l004': {
      id: 'l004',
      name: 'Pro-Am Division',
      badge: 'PRO',
      badgeColor: 'rgba(139,92,246,0.15)',
      badgeTextColor: '#8b5cf6',
      season: 'Spring 2026',
      status: 'active',
      format: '18 Games + Championship',
      maxTeams: 8,
      description: 'Premier adult Pro-Am showcase league for post-collegiate and professional-level athletes.'
    }
  };

  window.getAdminLeagues = function () {
    try {
      const stored = localStorage.getItem(LEAGUES_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(LEAGUES_STORAGE_KEY, JSON.stringify(DEFAULT_LEAGUES_DATA));
        return DEFAULT_LEAGUES_DATA;
      }
      return JSON.parse(stored);
    } catch (e) {
      return DEFAULT_LEAGUES_DATA;
    }
  };

  window.getAdminLeagueById = function (leagueId) {
    const leagues = window.getAdminLeagues();
    return leagues[leagueId] || null;
  };

  window.saveAdminLeague = function (leagueData) {
    const leagues = window.getAdminLeagues();
    const id = leagueData.id || `l_${Date.now()}`;

    // Auto-generate badge from name if not provided
    const words = (leagueData.name || 'League').trim().split(/\s+/);
    const badge = leagueData.badge || (words.length > 1
      ? words[0].toUpperCase().substring(0, 3)
      : words[0].toUpperCase().substring(0, 3));

    const existing = leagues[id] || {};
    leagues[id] = {
      ...existing,
      ...leagueData,
      id,
      badge,
      badgeColor: leagueData.badgeColor || existing.badgeColor || 'rgba(249,115,22,0.15)',
      badgeTextColor: leagueData.badgeTextColor || existing.badgeTextColor || 'var(--primary)',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(LEAGUES_STORAGE_KEY, JSON.stringify(leagues));
    return leagues[id];
  };

  /**
   * Delete a league — blocks if the league still has teams assigned to it.
   * Returns { ok: true } or { ok: false, reason: string }
   */
  window.deleteAdminLeague = function (leagueId) {
    const leagues = window.getAdminLeagues();
    if (!leagues[leagueId]) return { ok: false, reason: 'League not found.' };

    // Check for associated teams using leagueId
    const teams = window.getAdminTeams();
    const leagueName = leagues[leagueId].name;
    const associatedTeams = Object.values(teams).filter(
      t => t.leagueId === leagueId
    );

    if (associatedTeams.length > 0) {
      const teamNames = associatedTeams.map(t => t.name).join(', ');
      return {
        ok: false,
        reason: `Cannot delete "${leagueName}" — it still has ${associatedTeams.length} team(s) enrolled: ${teamNames}. Re-assign or remove those teams first.`
      };
    }

    delete leagues[leagueId];
    localStorage.setItem(LEAGUES_STORAGE_KEY, JSON.stringify(leagues));
    return { ok: true };
  };

  // ─── PLAYER STORE HELPER FUNCTIONS ───────────────────────────────────────
  window.getAdminPlayers = function () {
    const teams = window.getAdminTeams();
    const playersList = [];
    for (const teamId in teams) {
      const team = teams[teamId];
      if (team.players && Array.isArray(team.players)) {
        team.players.forEach(p => {
          playersList.push({
            ...p,
            teamId: team.id,
            teamName: team.name
          });
        });
      }
    }
    return playersList;
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
  document.addEventListener('DOMContentLoaded', () => {
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
    } catch (e) {}
  });

  // ─── CENTRAL GAMES DATA STORE ─────────────────────────────────────────────
  const GAMES_STORAGE_KEY = 'surge_admin_games_v1';

  const DEFAULT_GAMES_DATA = {
    'g001': {
      id: 'g001',
      leagueId: 'l001',      // U19 Elite League
      homeTeamId: 't001',    // Surge Wolves
      awayTeamId: 't002',    // Apex Titans
      date: '2026-10-24',
      time: '18:00',
      venue: 'Surge Arena (Main Court)',
      status: 'scheduled',
      homeScore: null,
      awayScore: null
    },
    'g002': {
      id: 'g002',
      leagueId: 'l002',      // U17 Junior League
      homeTeamId: 't005',    // Metro Vipers
      awayTeamId: 't006',    // Coastal Ballers
      date: '2026-10-25',
      time: '16:30',
      venue: 'Downtown Complex (Court B)',
      status: 'scheduled',
      homeScore: null,
      awayScore: null
    },
    'g003': {
      id: 'g003',
      leagueId: 'l004',      // Pro-Am Division
      homeTeamId: 't003',    // Venice Wave
      awayTeamId: 't004',    // Gotham Knights
      date: '2026-10-17',
      time: '19:30',
      venue: 'Venice Beach Arena',
      status: 'completed',
      homeScore: 112,
      awayScore: 98
    },
    'g004': {
      id: 'g004',
      leagueId: 'l001',      // U19 Elite League
      homeTeamId: 't001',    // Surge Wolves
      awayTeamId: 't003',    // Venice Wave
      date: '2026-10-26',
      time: '20:00',
      venue: 'Northgate Court',
      status: 'scheduled',
      homeScore: null,
      awayScore: null
    }
  };

  window.getAdminGames = function () {
    try {
      const stored = localStorage.getItem(GAMES_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(DEFAULT_GAMES_DATA));
        return DEFAULT_GAMES_DATA;
      }
      return JSON.parse(stored);
    } catch (e) {
      return DEFAULT_GAMES_DATA;
    }
  };

  window.getAdminGameById = function (gameId) {
    const games = window.getAdminGames();
    return games[gameId] || null;
  };

  window.saveAdminGame = function (gameData) {
    const games = window.getAdminGames();
    const id = gameData.id || `g_${Date.now()}`;
    games[id] = {
      ...games[id],
      ...gameData,
      id: id,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(games));
    return games[id];
  };

  window.deleteAdminGame = function (gameId) {
    const games = window.getAdminGames();
    if (games[gameId]) {
      delete games[gameId];
      localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(games));
    }
  };
})();
