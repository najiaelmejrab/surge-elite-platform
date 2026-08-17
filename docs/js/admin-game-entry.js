/**
 * Surge Elite Basketball Platform - Milestone 8
 * Admin Game Entry, Scoring Matrix & Player Box Score Management
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminGameEntry();
});

function initAdminGameEntry() {
  const API_BASE = '../backend/public/api/games.php';

  // State
  let currentMatchups = [];
  let currentRosters = {
    home: [],
    away: []
  };
  let activeOvertimeCount = 0;

  // DOM Elements
  const gameEntryForm = document.getElementById('gameEntryForm');
  const gameIdInput = document.getElementById('gameId');
  const existingGameSelect = document.getElementById('savedGameSelect');
  const modeBadge = document.getElementById('modeBadge');
  const leagueSelect = document.getElementById('leagueSelect');
  const seasonSelect = document.getElementById('seasonSelect');
  const venueSelect = document.getElementById('venueSelect');
  const gameDate = document.getElementById('gameDate');
  const gameTime = document.getElementById('gameTime');
  const homeTeamSelect = document.getElementById('homeTeamSelect');
  const awayTeamSelect = document.getElementById('awayTeamSelect');
  const labelHomeTeamName = document.getElementById('labelHomeTeamName');
  const labelAwayTeamName = document.getElementById('labelAwayTeamName');
  const homeFinalScore = document.getElementById('homeFinalScore');
  const awayFinalScore = document.getElementById('awayFinalScore');
  const calcHomeTotal = document.getElementById('calcHomeTotal');
  const calcAwayTotal = document.getElementById('calcAwayTotal');
  const homeStatsBody = document.getElementById('homeStatsBody');
  const awayStatsBody = document.getElementById('awayStatsBody');
  const tabBtnHome = document.getElementById('tabBtnHome');
  const tabBtnAway = document.getElementById('tabBtnAway');
  const paneHomeBoxScore = document.getElementById('paneHomeBoxScore');
  const paneAwayBoxScore = document.getElementById('paneAwayBoxScore');
  const btnNewGame = document.getElementById('newGameBtn');
  const btnAutofillDemo = document.getElementById('btnAutofillDemo');
  const btnAddOT = document.getElementById('btnAddOT');
  const btnSyncScores = document.getElementById('btnSyncScores');
  const btnAddPlayerHome = document.getElementById('btnAddPlayerHome');
  const btnAddPlayerAway = document.getElementById('btnAddPlayerAway');
  const btnResetForm = document.getElementById('btnResetForm');
  const btnDeleteGame = document.getElementById('btnDeleteGame');
  const btnSaveDraft = document.getElementById('btnSaveDraft');
  const linkViewPublicGame = document.getElementById('linkViewPublicGame');

  // Venue Modal Elements
  const openVenueModal = document.getElementById('openVenueModal');
  const venueModal = document.getElementById('venueModal');
  const closeVenueModal = document.getElementById('closeVenueModal');
  const cancelVenueModal = document.getElementById('cancelVenueModal');

  // New Game Modal Elements
  const newGameModal = document.getElementById('newGameModal');
  const closeNewGameModal = document.getElementById('closeNewGameModal');
  const cancelNewGameModal = document.getElementById('cancelNewGameModal');
  const btnCreateNewGame = document.getElementById('btnCreateNewGame');
  const quickVenueForm = document.getElementById('quickVenueForm');

  // Default Mock Data for fallback / instant offline preview
  const MOCK_TEAMS = [
    { id: 1, name: 'Venice Wave', slug: 'venice-wave', division: 'Pacific Conference', primary_color: '#00e5ff' },
    { id: 2, name: 'Gotham Knights', slug: 'gotham-knights', division: 'Atlantic Conference', primary_color: '#ff0055' },
    { id: 3, name: 'South Beach Surge', slug: 'south-beach-surge', division: 'Southeast Conference', primary_color: '#ff5e00' },
    { id: 4, name: 'Windy City Ballers', slug: 'windy-city-ballers', division: 'Midwest Conference', primary_color: '#10b981' }
  ];

  const MOCK_PLAYERS = {
    1: [ // Venice Wave
      { id: 101, name: 'Marcus Vance', jersey: '23', pos: 'PG', min: 36, pts: 32, reb: 6, ast: 9, stl: 3, blk: 0, to: 2, pf: 2, fgm: 11, fga: 19, pm3: 4, pa3: 7, ftm: 6, fta: 7, pm: '+11' },
      { id: 102, name: 'Jamal Brooks', jersey: '55', pos: 'C', min: 32, pts: 16, reb: 12, ast: 2, stl: 1, blk: 4, to: 1, pf: 4, fgm: 7, fga: 10, pm3: 0, pa3: 0, ftm: 2, fta: 4, pm: '+8' },
      { id: 103, name: 'Elena Rostova', jersey: '7', pos: 'SG', min: 34, pts: 24, reb: 4, ast: 5, stl: 2, blk: 0, to: 3, pf: 1, fgm: 9, fga: 17, pm3: 5, pa3: 9, ftm: 1, fta: 2, pm: '+14' },
      { id: 104, name: 'Dante Walker', jersey: '12', pos: 'SF', min: 28, pts: 18, reb: 7, ast: 4, stl: 1, blk: 1, to: 2, pf: 3, fgm: 7, fga: 13, pm3: 3, pa3: 6, ftm: 1, fta: 1, pm: '+5' },
      { id: 105, name: 'Tariq Johnson', jersey: '34', pos: 'PF', min: 26, pts: 14, reb: 9, ast: 3, stl: 1, blk: 0, to: 2, pf: 4, fgm: 5, fga: 11, pm3: 1, pa3: 3, ftm: 3, fta: 3, pm: '+7' },
      { id: 106, name: 'Leo Chen', jersey: '3', pos: 'PG', min: 14, pts: 5, reb: 2, ast: 4, stl: 0, blk: 0, to: 1, pf: 1, fgm: 2, fga: 5, pm3: 1, pa3: 3, ftm: 0, fta: 0, pm: '-2' },
      { id: 107, name: 'Kobe Miller', jersey: '15', pos: 'SF', min: 15, pts: 3, reb: 2, ast: 1, stl: 0, blk: 0, to: 0, pf: 1, fgm: 1, fga: 4, pm3: 0, pa3: 2, ftm: 1, fta: 1, pm: '+1' },
      { id: 108, name: 'Andre Silva', jersey: '44', pos: 'C', min: 15, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, fgm: 0, fga: 2, pm3: 0, pa3: 0, ftm: 0, fta: 0, pm: '+2' }
    ],
    2: [ // Gotham Knights
      { id: 201, name: 'Zion Sterling', jersey: '1', pos: 'SG', min: 38, pts: 31, reb: 5, ast: 6, stl: 2, blk: 1, to: 4, pf: 3, fgm: 11, fga: 21, pm3: 5, pa3: 11, ftm: 4, fta: 5, pm: '-7' },
      { id: 202, name: 'Trevor Hayes', jersey: '11', pos: 'PG', min: 34, pts: 22, reb: 4, ast: 9, stl: 2, blk: 0, to: 3, pf: 2, fgm: 8, fga: 16, pm3: 3, pa3: 7, ftm: 3, fta: 4, pm: '-9' },
      { id: 203, name: 'Kendrick Fox', jersey: '33', pos: 'PF', min: 30, pts: 18, reb: 11, ast: 2, stl: 0, blk: 2, to: 2, pf: 4, fgm: 7, fga: 14, pm3: 1, pa3: 3, ftm: 3, fta: 4, pm: '-10' },
      { id: 204, name: 'Jaxson Reed', jersey: '8', pos: 'SF', min: 28, pts: 14, reb: 6, ast: 3, stl: 1, blk: 0, to: 2, pf: 3, fgm: 5, fga: 12, pm3: 2, pa3: 5, ftm: 2, fta: 3, pm: '-5' },
      { id: 205, name: 'Malik Turner', jersey: '50', pos: 'C', min: 27, pts: 10, reb: 8, ast: 1, stl: 0, blk: 1, to: 1, pf: 4, fgm: 4, fga: 8, pm3: 0, pa3: 0, ftm: 2, fta: 3, pm: '-12' },
      { id: 206, name: 'Devon Wright', jersey: '5', pos: 'G', min: 17, pts: 4, reb: 2, ast: 1, stl: 1, blk: 0, to: 1, pf: 1, fgm: 2, fga: 5, pm3: 0, pa3: 1, ftm: 0, fta: 1, pm: '-4' },
      { id: 207, name: 'Carter Ross', jersey: '22', pos: 'F', min: 14, pts: 2, reb: 1, ast: 0, stl: 0, blk: 0, to: 1, pf: 2, fgm: 1, fga: 3, pm3: 0, pa3: 1, ftm: 0, fta: 0, pm: '-6' },
      { id: 208, name: 'Lucas Scott', jersey: '14', pos: 'C', min: 12, pts: 0, reb: 1, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, fgm: 0, fga: 2, pm3: 0, pa3: 0, ftm: 0, fta: 0, pm: '-2' }
    ],
    3: [ // South Beach Surge
      { id: 301, name: 'Klayton Rivers', jersey: '2', pos: 'SG', min: 35, pts: 28, reb: 5, ast: 4, stl: 2, blk: 0, to: 2, pf: 2, fgm: 10, fga: 19, pm3: 6, pa3: 11, ftm: 2, fta: 2, pm: '+4' },
      { id: 302, name: 'DeAndre Cole', jersey: '21', pos: 'PF', min: 32, pts: 20, reb: 13, ast: 3, stl: 1, blk: 3, to: 1, pf: 3, fgm: 8, fga: 14, pm3: 1, pa3: 2, ftm: 3, fta: 5, pm: '+2' }
    ],
    4: [ // Windy City Ballers
      { id: 401, name: 'Brandon Cole', jersey: '0', pos: 'PG', min: 36, pts: 26, reb: 6, ast: 11, stl: 3, blk: 0, to: 4, pf: 2, fgm: 9, fga: 18, pm3: 4, pa3: 8, ftm: 4, fta: 4, pm: '+3' },
      { id: 402, name: 'Tyson Graham', jersey: '13', pos: 'SF', min: 31, pts: 21, reb: 8, ast: 3, stl: 1, blk: 1, to: 2, pf: 3, fgm: 8, fga: 15, pm3: 3, pa3: 6, ftm: 2, fta: 3, pm: '-1' }
    ]
  };

  // --- INITIALIZATION ---
  initEventListeners();
  loadInitialData();

  function initEventListeners() {
    // Game selection dropdown
    existingGameSelect?.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      if (selectedId) {
        loadGameDetails(selectedId);
      } else {
        resetFormToNewGame();
      }
    });

    // New Game Button
    btnNewGame?.addEventListener('click', () => {
      resetFormToNewGame();
      if (newGameModal) newGameModal.style.display = 'flex';
    });
    closeNewGameModal?.addEventListener('click', () => { if (newGameModal) newGameModal.style.display = 'none'; });
    cancelNewGameModal?.addEventListener('click', () => { if (newGameModal) newGameModal.style.display = 'none'; });
    btnCreateNewGame?.addEventListener('click', () => {
      if (newGameModal) newGameModal.style.display = 'none';
      showToast('Game setup saved. Proceed to enter rosters and box scores.', 'success');
    });

    // Autofill Demo Match
    btnAutofillDemo?.addEventListener('click', populateDemoMatch);

    // Team Select Changes
    homeTeamSelect?.addEventListener('change', () => {
      updateTeamLabels();
      loadRosterForTeam('home', homeTeamSelect?.value);
    });

    awayTeamSelect?.addEventListener('change', () => {
      updateTeamLabels();
      loadRosterForTeam('away', awayTeamSelect?.value);
    });

    // Quarter Matrix Inputs Calculation
    document.getElementById('quartersMatrixTable')?.addEventListener('input', (e) => {
      if (e.target.classList.contains('q-input')) {
        recalculateQuarterTotals();
      }
    });

    // Auto-Sync Final Scores
    btnSyncScores?.addEventListener('click', () => {
      if (homeFinalScore && calcHomeTotal) homeFinalScore.value = calcHomeTotal.textContent;
      if (awayFinalScore && calcAwayTotal) awayFinalScore.value = calcAwayTotal.textContent;
      showToast('Final scores synchronized with quarter sums', 'success');
    });

    // Add Overtime Column
    btnAddOT?.addEventListener('click', addOvertimeColumn);

    // Status Radio Badges
    document.querySelectorAll('.status-badge-radio').forEach(label => {
      label.addEventListener('click', () => {
        document.querySelectorAll('.status-badge-radio').forEach(l => l.classList.remove('active'));
        label.classList.add('active');
        const radio = label.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });

    // Tabs
    tabBtnHome?.addEventListener('click', () => switchTab('home'));
    tabBtnAway?.addEventListener('click', () => switchTab('away'));

    // Box Score Tables Real-time Recalculation
    homeStatsBody?.addEventListener('input', () => recalculateBoxScoreTotals('home'));
    awayStatsBody?.addEventListener('input', () => recalculateBoxScoreTotals('away'));

    // Add Player Buttons – open modal instead of direct row addition
    btnAddPlayerHome?.addEventListener('click', () => openPlayerModal('home'));
    btnAddPlayerAway?.addEventListener('click', () => openPlayerModal('away'));

    // Close and Cancel handlers for Player Modals
    document.getElementById('closePlayerModalHome')?.addEventListener('click', () => document.getElementById('playerModalHome').style.display = 'none');
    document.getElementById('btnCancelHome')?.addEventListener('click', () => document.getElementById('playerModalHome').style.display = 'none');
    document.getElementById('closePlayerModalAway')?.addEventListener('click', () => document.getElementById('playerModalAway').style.display = 'none');
    document.getElementById('btnCancelAway')?.addEventListener('click', () => document.getElementById('playerModalAway').style.display = 'none');

    // Search input filtering for modals
    document.getElementById('playerSearchHome')?.addEventListener('input', () => filterPlayerList('home'));
    document.getElementById('playerSearchAway')?.addEventListener('input', () => filterPlayerList('away'));

    // Function to open modal and populate player list
    function openPlayerModal(side) {
      const modal = side === 'home' ? document.getElementById('playerModalHome') : document.getElementById('playerModalAway');
      const listDiv = side === 'home' ? document.getElementById('playerListHome') : document.getElementById('playerListAway');
      const teamId = side === 'home' ? homeTeamSelect.value : awayTeamSelect.value;
      // Load players (mock or API)
      let players = MOCK_PLAYERS[teamId] || [];
      // Try API fetch (async not allowed here, so we use existing loadRosterForTeam data if needed – for simplicity we rely on mock data.
      // Clear and render list
      listDiv.innerHTML = '';
      players.forEach(p => {
        const row = document.createElement('div');
        row.className = 'modal-player-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.padding = '0.4rem 0';
        row.style.borderBottom = '1px solid var(--border-light)';
        row.innerHTML = `<span>${p.name || ''} #${p.jersey || ''} ${p.pos || ''}</span><button type="button" class="btn btn-primary btn-sm" data-player-id="${p.id}">Add</button>`;
        // Add click handler
        row.querySelector('button').addEventListener('click', () => {
          if (isPlayerAlreadyAdded(side, p.id)) {
            showToast('Player is already in the box score!', 'warning');
            return;
          }
          addPlayerToBoxScore(side, p);
          modal.style.display = 'none';
        });
        listDiv.appendChild(row);
      });
      modal.style.display = 'flex';
    }

    // Filter the player list based on search input
    function filterPlayerList(side) {
      const searchInput = side === 'home' ? document.getElementById('playerSearchHome') : document.getElementById('playerSearchAway');
      const listDiv = side === 'home' ? document.getElementById('playerListHome') : document.getElementById('playerListAway');
      const term = searchInput.value.toLowerCase();
      Array.from(listDiv.children).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? 'flex' : 'none';
      });
    }

    document.getElementById('btnQuickHomeRoster')?.addEventListener('click', () => loadRosterForTeam('home', homeTeamSelect?.value, true));
    document.getElementById('btnQuickAwayRoster')?.addEventListener('click', () => loadRosterForTeam('away', awayTeamSelect?.value, true));

    // Form Reset & Delete
    btnResetForm?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all unsaved changes on this game?')) {
        resetFormToNewGame();
      }
    });

    btnDeleteGame?.addEventListener('click', handleDeleteGame);

    // Save Draft Button
    btnSaveDraft?.addEventListener('click', () => {
      const scheduledRadio = document.querySelector('input[name="gameStatus"][value="scheduled"]');
      if (scheduledRadio) {
        scheduledRadio.checked = true;
        document.querySelectorAll('.status-badge-radio').forEach(l => l.classList.remove('active'));
        document.querySelector('.status-badge-radio[data-status="scheduled"]')?.classList.add('active');
      }
      gameEntryForm?.dispatchEvent(new Event('submit'));
    });

    // Form Submit (Save / Publish)
    gameEntryForm?.addEventListener('submit', handleFormSubmit);

    // Venue Modal Controls
    if (openVenueModal && venueModal) {
      openVenueModal.addEventListener('click', (e) => {
        e.preventDefault();
        venueModal.style.display = 'flex';
      });

      closeVenueModal?.addEventListener('click', () => venueModal.style.display = 'none');
      cancelVenueModal?.addEventListener('click', () => venueModal.style.display = 'none');

      quickVenueForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('newVenueName').value;
        const city = document.getElementById('newVenueCity').value;
        if (!name || !city) return;

        const newOpt = document.createElement('option');
        newOpt.value = 'venue_' + Date.now();
        newOpt.textContent = `${name} (${city})`;
        newOpt.selected = true;
        venueSelect.appendChild(newOpt);

        venueModal.style.display = 'none';
        quickVenueForm.reset();
        showToast(`Venue "${name}" added successfully`, 'success');
      });
    }
  }

  // --- TAB SWITCHING ---
  function switchTab(team) {
    if (team === 'home') {
      tabBtnHome.classList.add('active');
      tabBtnHome.style.background = 'rgba(0, 229, 255, 0.1)';
      tabBtnHome.style.borderColor = 'rgba(0,229,255,0.3)';
      tabBtnHome.style.color = '#00e5ff';

      tabBtnAway.classList.remove('active');
      tabBtnAway.style.background = 'transparent';
      tabBtnAway.style.borderColor = 'var(--border-light)';
      tabBtnAway.style.color = 'var(--text-muted)';

      paneHomeBoxScore.style.display = 'block';
      paneAwayBoxScore.style.display = 'none';
    } else {
      tabBtnAway.classList.add('active');
      tabBtnAway.style.background = 'rgba(255, 0, 85, 0.1)';
      tabBtnAway.style.borderColor = 'rgba(255,0,85,0.3)';
      tabBtnAway.style.color = '#ff0055';

      tabBtnHome.classList.remove('active');
      tabBtnHome.style.background = 'transparent';
      tabBtnHome.style.borderColor = 'var(--border-light)';
      tabBtnHome.style.color = 'var(--text-muted)';

      paneAwayBoxScore.style.display = 'block';
      paneHomeBoxScore.style.display = 'none';
    }
  }

  // --- DATA LOADING & METADATA ---
  async function loadInitialData() {
    try {
      const res = await fetch(`${API_BASE}?action=metadata`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          populateDropdowns(result.data);
        }
      }
    } catch (err) {
      console.log('Using local client metadata fallback:', err.message);
    }

    // Load existing game list
    loadGameList();

    // Set initial rosters
    updateTeamLabels();
    loadRosterForTeam('home', homeTeamSelect.value);
    loadRosterForTeam('away', awayTeamSelect.value);
  }

  async function loadGameList() {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          existingGameSelect.innerHTML = '<option value="">-- Select a game to edit or create new below --</option>';
          result.data.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.textContent = `#${g.id} - ${g.home_team_name} vs ${g.away_team_name} (${g.game_date}) [${g.status.toUpperCase()}]`;
            existingGameSelect.appendChild(opt);
          });
          return;
        }
      }
    } catch (e) {
      console.log('API offline; checking local persistence...');
    }

    // Fallback games stored in localStorage
    const savedGames = JSON.parse(localStorage.getItem('surge_elite_games') || '[]');
    existingGameSelect.innerHTML = '<option value="">-- Select a game to edit or create new below --</option>';
    savedGames.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = `#${g.id} - ${g.home_team_name || 'Home'} vs ${g.away_team_name || 'Away'} (${g.game_date}) [${(g.status || 'COMPLETED').toUpperCase()}]`;
      existingGameSelect.appendChild(opt);
    });
  }

  function populateDropdowns(meta) {
    if (meta.leagues && meta.leagues.length) {
      leagueSelect.innerHTML = meta.leagues.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
    }
    if (meta.seasons && meta.seasons.length) {
      seasonSelect.innerHTML = meta.seasons.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    }
    if (meta.venues && meta.venues.length) {
      venueSelect.innerHTML = meta.venues.map(v => `<option value="${v.id}">${v.name} (${v.city})</option>`).join('');
    }
    if (meta.teams && meta.teams.length) {
      const options = meta.teams.map(t => `<option value="${t.id}">${t.name} (${t.division || 'Div 1'})</option>`).join('');
      homeTeamSelect.innerHTML = options;
      awayTeamSelect.innerHTML = options;
      if (meta.teams.length > 1) {
        awayTeamSelect.selectedIndex = 1;
      }
    }
  }

  // --- TEAM LABELS & ROSTERS ---
  function updateTeamLabels() {
    const homeOpt = homeTeamSelect.options[homeTeamSelect.selectedIndex];
    const awayOpt = awayTeamSelect.options[awayTeamSelect.selectedIndex];

    const homeName = homeOpt ? homeOpt.text.split('(')[0].trim() : 'Home Team';
    const awayName = awayOpt ? awayOpt.text.split('(')[0].trim() : 'Away Team';

    labelHomeTeamName.textContent = `${homeName} (Home)`;
    labelAwayTeamName.textContent = `${awayName} (Away)`;

    tabBtnHome.textContent = `${homeName} (Home Roster)`;
    tabBtnAway.textContent = `${awayName} (Away Roster)`;
  }

  async function loadRosterForTeam(side, teamId, forceReset = false) {
    const targetBody = side === 'home' ? homeStatsBody : awayStatsBody;

    // Check if we already have players rendered and not force reset
    if (targetBody.children.length > 0 && !forceReset) {
      return;
    }

    targetBody.innerHTML = '';

    let players = MOCK_PLAYERS[teamId] || [];

    // Attempt to fetch from API
    try {
      const res = await fetch(`${API_BASE}?action=roster&team_id=${teamId}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          players = result.data.map(p => ({
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            jersey: p.jersey_number || '0',
            pos: p.position || 'G',
            min: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0,
            fgm: 0, fga: 0, pm3: 0, pa3: 0, ftm: 0, fta: 0, pm: '0'
          }));
        }
      }
    } catch (e) {
      // fallback to mock
    }

    if (players.length === 0) {
      // Create a few default blank rows
      for (let i = 1; i <= 5; i++) {
        renderPlayerRow(side, {
          id: `${teamId}_${i}`,
          name: `Player ${i}`,
          jersey: `${i * 5}`,
          pos: ['PG', 'SG', 'SF', 'PF', 'C'][i - 1] || 'G',
          min: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0,
          fgm: 0, fga: 0, pm3: 0, pa3: 0, ftm: 0, fta: 0, pm: '0'
        });
      }
    } else {
      players.forEach(p => renderPlayerRow(side, p));
    }

    recalculateBoxScoreTotals(side);
  }

  // Helper to check for duplicate player ids in box score
  function isPlayerAlreadyAdded(side, playerId) {
    const targetBody = side === 'home' ? homeStatsBody : awayStatsBody;
    const rows = targetBody.querySelectorAll('tr');
    for (const row of rows) {
      if (row.dataset.playerId == playerId) {
        return true;
      }
    }
    return false;
  }

  // Helper to add player data to box score, mapping fields appropriately
  function addPlayerToBoxScore(side, player) {
    // Map player object to the format expected by renderPlayerRow
    const mapped = {
      id: player.id,
      name: player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim(),
      jersey: player.jersey || player.jersey_number || '0',
      pos: player.pos || player.position || 'G',
      min: 0,
      pts: 0,
      reb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      to: 0,
      pf: 0,
      fgm: 0,
      fga: 0,
      pm3: 0,
      pa3: 0,
      ftm: 0,
      fta: 0,
      pm: '0'
    };
    renderPlayerRow(side, mapped);
    recalculateBoxScoreTotals(side);
  }

  function renderPlayerRow(side, p) {
    const targetBody = side === 'home' ? homeStatsBody : awayStatsBody;
    const row = document.createElement('tr');
    if (p.id) row.dataset.playerId = p.id;

    // Compute initial points based on scoring stats
    const computePts = (row) => {
      const fgm = parseInt(row.querySelector('.stat-fgm')?.value, 10) || 0;
      const threePm = parseInt(row.querySelector('.stat-3pm')?.value, 10) || 0;
      const ftm = parseInt(row.querySelector('.stat-ftm')?.value, 10) || 0;
      // PTS = (FGM × 2) + 3PM + FTM (FGM includes 3PM)
      return (fgm * 2) + threePm + ftm;
    };

    row.innerHTML = `
      <td style="text-align: left; padding-left: 0.5rem; min-width: 170px;">
        <input type="text" class="stat-player-name form-control" style="padding: 0.25rem 0.5rem; font-size: 0.82rem; font-weight: 700;" value="${p.name || ''}" placeholder="Player Name">
      </td>
      <td>
        <select class="stat-player-pos form-select" style="padding: 0.25rem; font-size: 0.78rem; width: 55px;">
          ${['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F'].map(pos => `<option value="${pos}" ${p.pos === pos ? 'selected' : ''}>${pos}</option>`).join('')}
        </select>
      </td>
      <td><input type="number" min="0" max="60" class="stat-input-num stat-min" value="${p.min ?? 0}"></td>
      <td><input type="number" min="0" max="150" class="stat-input-num pts-field stat-pts" value="0" readonly></td>
      <td><input type="number" min="0" max="50" class="stat-input-num stat-reb" value="${p.reb ?? 0}"></td>
      <td><input type="number" min="0" max="50" class="stat-input-num stat-ast" value="${p.ast ?? 0}"></td>
      <td><input type="number" min="0" max="25" class="stat-input-num stat-stl" value="${p.stl ?? 0}"></td>
      <td><input type="number" min="0" max="25" class="stat-input-num stat-blk" value="${p.blk ?? 0}"></td>
      <td><input type="number" min="0" max="25" class="stat-input-num stat-to" value="${p.to ?? 0}"></td>
      <td><input type="number" min="0" max="6" class="stat-input-num stat-pf" value="${p.pf ?? 0}"></td>
      <td><input type="number" min="0" max="60" class="stat-input-num stat-fgm" value="${p.fgm ?? 0}"></td>
      <td><input type="number" min="0" max="60" class="stat-input-num stat-fga" value="${p.fga ?? 0}"></td>
      <td><input type="number" min="0" max="30" class="stat-input-num stat-3pm" value="${p.pm3 ?? p.three_pointers_made ?? 0}"></td>
      <td><input type="number" min="0" max="30" class="stat-input-num stat-3pa" value="${p.pa3 ?? p.three_pointers_attempted ?? 0}"></td>
      <td><input type="number" min="0" max="30" class="stat-input-num stat-ftm" value="${p.ftm ?? p.free_throws_made ?? 0}"></td>
      <td><input type="number" min="0" max="30" class="stat-input-num stat-fta" value="${p.fta ?? p.free_throws_attempted ?? 0}"></td>
      <td><input type="text" class="stat-input-num stat-pm" style="width: 48px;" value="${p.pm ?? p.plus_minus ?? '0'}"></td>
      <td>
        <button type="button" class="btn-del-row" style="color: #ef4444; font-size: 1.1rem; line-height: 1;" title="Remove Player">&times;</button>
      </td>
    `;


    // Attach listeners to scoring fields to recalculate PTS on change and enforce validation
    const scoringFields = row.querySelectorAll('.stat-fgm, .stat-3pm, .stat-ftm, .stat-fga, .stat-3pa, .stat-fta');
    const validateRowStats = (row) => {
      const fgm = parseInt(row.querySelector('.stat-fgm')?.value, 10) || 0;
      const fga = parseInt(row.querySelector('.stat-fga')?.value, 10) || 0;
      const threePm = parseInt(row.querySelector('.stat-3pm')?.value, 10) || 0;
      const threePa = parseInt(row.querySelector('.stat-3pa')?.value, 10) || 0;
      const ftm = parseInt(row.querySelector('.stat-ftm')?.value, 10) || 0;
      const fta = parseInt(row.querySelector('.stat-fta')?.value, 10) || 0;
      let valid = true;
      if (fgm > fga) { showToast('FGM cannot exceed FGA', 'error'); row.querySelector('.stat-fgm').value = fga; valid = false; }
      if (threePm > threePa) { showToast('3PM cannot exceed 3PA', 'error'); row.querySelector('.stat-3pm').value = threePa; valid = false; }
      if (ftm > fta) { showToast('FTM cannot exceed FTA', 'error'); row.querySelector('.stat-ftm').value = fta; valid = false; }
      return valid;
    };
    scoringFields.forEach(inp => {
      inp.addEventListener('input', () => {
        // Recalculate PTS always
        row.querySelector('.stat-pts').value = computePts(row);
        // Validate row constraints
        validateRowStats(row);
        recalculateBoxScoreTotals(side);
      });
    });
    // Initial validation for newly added row
    validateRowStats(row);


    // Bind row delete
    row.querySelector('.btn-del-row').addEventListener('click', () => {
      row.remove();
      recalculateBoxScoreTotals(side);
    });

    targetBody.appendChild(row);
  }

  function addPlayerRow(side) {
    renderPlayerRow(side, {
      id: 'custom_' + Date.now(),
      name: 'New Player',
      jersey: '0',
      pos: 'G',
      min: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0,
      fgm: 0, fga: 0, pm3: 0, pa3: 0, ftm: 0, fta: 0, pm: '0'
    });
    recalculateBoxScoreTotals(side);
  }

  // --- OVERTIME MANAGEMENT ---
  function addOvertimeColumn() {
    activeOvertimeCount++;
    const currentOtIndex = activeOvertimeCount;
    const otLabel = `OT${currentOtIndex > 1 ? currentOtIndex : ''}`;

    // Add header column before "Sum Total"
    const headerRow = document.getElementById('matrixHeaderRow');
    const th = document.createElement('th');
    th.className = 'ot-col';
    th.dataset.otIndex = currentOtIndex;
    th.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; gap:4px;">${otLabel} <span class="remove-ot" style="cursor:pointer; color:#ef4444; font-size:1.25rem; line-height:1;" title="Remove ${otLabel}">&times;</span></div>`;
    headerRow.insertBefore(th, headerRow.children[headerRow.children.length - 2]);

    // Add home cell
    const homeRow = document.querySelector('#quartersMatrixTable tbody tr:first-child');
    const homeTd = document.createElement('td');
    homeTd.className = 'ot-col';
    homeTd.dataset.otIndex = currentOtIndex;
    homeTd.innerHTML = `<input type="number" min="0" max="50" class="matrix-input q-input" data-team="home" data-quarter="${4 + currentOtIndex}" value="0">`;
    homeRow.insertBefore(homeTd, homeRow.children[homeRow.children.length - 2]);

    // Add away cell
    const awayRow = document.querySelector('#quartersMatrixTable tbody tr:last-child');
    const awayTd = document.createElement('td');
    awayTd.className = 'ot-col';
    awayTd.dataset.otIndex = currentOtIndex;
    awayTd.innerHTML = `<input type="number" min="0" max="50" class="matrix-input q-input" data-team="away" data-quarter="${4 + currentOtIndex}" value="0">`;
    awayRow.insertBefore(awayTd, awayRow.children[awayRow.children.length - 2]);

    th.querySelector('.remove-ot').addEventListener('click', () => {
      removeOvertimeColumn(parseInt(th.dataset.otIndex, 10));
    });

    showToast(`Added ${otLabel} scoring period`, 'info');
  }

  function removeOvertimeColumn(indexToRemove) {
    // Remove the specific columns by index
    document.querySelectorAll(`.ot-col[data-ot-index="${indexToRemove}"]`).forEach(el => el.remove());

    activeOvertimeCount--;

    // Renumber remaining OTs
    const headerRow = document.getElementById('matrixHeaderRow');
    const homeRow = document.querySelector('#quartersMatrixTable tbody tr:first-child');
    const awayRow = document.querySelector('#quartersMatrixTable tbody tr:last-child');

    let newOtIndex = 1;

    const otHeaders = headerRow.querySelectorAll('.ot-col');
    otHeaders.forEach(th => {
      const oldIndex = parseInt(th.dataset.otIndex, 10);
      th.dataset.otIndex = newOtIndex;
      const label = `OT${newOtIndex > 1 ? newOtIndex : ''}`;
      th.querySelector('div').childNodes[0].nodeValue = label + ' ';

      const homeCell = homeRow.querySelector(`.ot-col input[data-quarter="${4 + oldIndex}"]`);
      if (homeCell) {
        homeCell.dataset.quarter = 4 + newOtIndex;
        homeCell.closest('td').dataset.otIndex = newOtIndex;
      }

      const awayCell = awayRow.querySelector(`.ot-col input[data-quarter="${4 + oldIndex}"]`);
      if (awayCell) {
        awayCell.dataset.quarter = 4 + newOtIndex;
        awayCell.closest('td').dataset.otIndex = newOtIndex;
      }

      newOtIndex++;
    });

    recalculateQuarterTotals();
  }

  // --- RECALCULATIONS ---
  function recalculateQuarterTotals() {
    let homeSum = 0;
    let awaySum = 0;

    document.querySelectorAll('.q-input[data-team="home"]').forEach(inp => {
      homeSum += parseInt(inp.value, 10) || 0;
    });

    document.querySelectorAll('.q-input[data-team="away"]').forEach(inp => {
      awaySum += parseInt(inp.value, 10) || 0;
    });

    calcHomeTotal.textContent = homeSum;
    calcAwayTotal.textContent = awaySum;

    homeFinalScore.value = homeSum;
    awayFinalScore.value = awaySum;

    validateBoxScoreVsFinal('home');
    validateBoxScoreVsFinal('away');
  }

  function recalculateBoxScoreTotals(side) {
    const targetBody = side === 'home' ? homeStatsBody : awayStatsBody;
    const totals = { min: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, fgm: 0, fga: 0, pm3: 0, pa3: 0, ftm: 0, fta: 0 };

    targetBody.querySelectorAll('tr').forEach(row => {
      totals.min += parseInt(row.querySelector('.stat-min')?.value, 10) || 0;
      totals.pts += parseInt(row.querySelector('.stat-pts')?.value, 10) || 0;
      totals.reb += parseInt(row.querySelector('.stat-reb')?.value, 10) || 0;
      totals.ast += parseInt(row.querySelector('.stat-ast')?.value, 10) || 0;
      totals.stl += parseInt(row.querySelector('.stat-stl')?.value, 10) || 0;
      totals.blk += parseInt(row.querySelector('.stat-blk')?.value, 10) || 0;
      totals.to += parseInt(row.querySelector('.stat-to')?.value, 10) || 0;
      totals.pf += parseInt(row.querySelector('.stat-pf')?.value, 10) || 0;
      totals.fgm += parseInt(row.querySelector('.stat-fgm')?.value, 10) || 0;
      totals.fga += parseInt(row.querySelector('.stat-fga')?.value, 10) || 0;
      totals.pm3 += parseInt(row.querySelector('.stat-3pm')?.value, 10) || 0;
      totals.pa3 += parseInt(row.querySelector('.stat-3pa')?.value, 10) || 0;
      totals.ftm += parseInt(row.querySelector('.stat-ftm')?.value, 10) || 0;
      totals.fta += parseInt(row.querySelector('.stat-fta')?.value, 10) || 0;
    });

    const prefix = side === 'home' ? 'totHome' : 'totAway';
    document.getElementById(`${prefix}Min`).textContent = totals.min;
    document.getElementById(`${prefix}Pts`).textContent = totals.pts;
    document.getElementById(`${prefix}Reb`).textContent = totals.reb;
    document.getElementById(`${prefix}Ast`).textContent = totals.ast;
    document.getElementById(`${prefix}Stl`).textContent = totals.stl;
    document.getElementById(`${prefix}Blk`).textContent = totals.blk;
    document.getElementById(`${prefix}To`).textContent = totals.to;
    document.getElementById(`${prefix}Pf`).textContent = totals.pf;
    document.getElementById(`${prefix}Fgm`).textContent = totals.fgm;
    document.getElementById(`${prefix}Fga`).textContent = totals.fga;
    document.getElementById(`${prefix}3pm`).textContent = totals.pm3;
    document.getElementById(`${prefix}3pa`).textContent = totals.pa3;
    document.getElementById(`${prefix}Ftm`).textContent = totals.ftm;
    document.getElementById(`${prefix}Fta`).textContent = totals.fta;

    validateBoxScoreVsFinal(side);
  }

  function validateBoxScoreVsFinal(side) {
    const prefix = side === 'home' ? 'totHome' : 'totAway';
    const validationElem = document.getElementById(`${side}PtsValidation`);
    const boxPts = parseInt(document.getElementById(`${prefix}Pts`).textContent, 10) || 0;
    const finalScore = parseInt(side === 'home' ? homeFinalScore.value : awayFinalScore.value, 10) || 0;

    if (boxPts === finalScore) {
      validationElem.innerHTML = `&#10004; Matches ${side === 'home' ? 'Home' : 'Away'} Total (${finalScore} pts)`;
      validationElem.style.color = '#10b981';
    } else {
      validationElem.innerHTML = `&#9888; Warning: Box Score sum (${boxPts} pts) differs from team score (${finalScore} pts)`;
      validationElem.style.color = '#ef4444';
    }
  }

  // --- DEMO POPULATION ---
  function populateDemoMatch() {
    homeTeamSelect.value = '1';
    awayTeamSelect.value = '2';
    updateTeamLabels();

    document.getElementById('gameDate').value = '2026-08-17';
    document.getElementById('gameTime').value = '19:30';

    // Quarter scores: 28, 26, 29, 29 vs 24, 27, 24, 26
    const homeQs = [28, 26, 29, 29];
    const awayQs = [24, 27, 24, 26];

    document.querySelectorAll('.q-input[data-team="home"]').forEach((inp, idx) => {
      if (homeQs[idx] !== undefined) inp.value = homeQs[idx];
    });
    document.querySelectorAll('.q-input[data-team="away"]').forEach((inp, idx) => {
      if (awayQs[idx] !== undefined) inp.value = awayQs[idx];
    });

    recalculateQuarterTotals();

    // Populate Roster stats
    loadRosterForTeam('home', '1', true);
    loadRosterForTeam('away', '2', true);

    showToast('Demo Pro-Am Championship match loaded into form!', 'success');
  }

  // --- RESET TO NEW GAME ---
  function resetFormToNewGame() {
    gameIdInput.value = '';
    existingGameSelect.value = '';
    modeBadge.textContent = 'CREATE NEW FIXTURE';
    modeBadge.style.background = 'rgba(0, 229, 255, 0.15)';
    modeBadge.style.color = '#00e5ff';
    btnDeleteGame.style.display = 'none';
    linkViewPublicGame.style.display = 'none';

    // Remove OT columns
    document.querySelectorAll('.ot-col').forEach(el => el.remove());
    activeOvertimeCount = 0;

    // Reset Form fields
    document.querySelectorAll('.q-input').forEach(inp => inp.value = 0);
    homeFinalScore.value = 0;
    awayFinalScore.value = 0;
    calcHomeTotal.textContent = 0;
    calcAwayTotal.textContent = 0;

    homeStatsBody.innerHTML = '';
    awayStatsBody.innerHTML = '';
    updateTeamLabels();
    loadRosterForTeam('home', homeTeamSelect.value, true);
    loadRosterForTeam('away', awayTeamSelect.value, true);

    showToast('New blank fixture initialized', 'info');
  }

  // --- LOAD GAME DETAILS ---
  async function loadGameDetails(id) {
    try {
      const res = await fetch(`${API_BASE}?id=${id}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          applyGameDataToForm(result.data);
          return;
        }
      }
    } catch (e) {
      console.log('Fetching from local fallback storage...');
    }

    // Local storage fallback
    const savedGames = JSON.parse(localStorage.getItem('surge_elite_games') || '[]');
    const game = savedGames.find(g => String(g.id) === String(id));
    if (game) {
      applyGameDataToForm(game);
    } else {
      showToast(`Game #${id} not found in database`, 'error');
    }
  }

  function applyGameDataToForm(game) {
    gameIdInput.value = game.id;
    modeBadge.textContent = `EDITING FIXTURE #${game.id}`;
    modeBadge.style.background = 'rgba(255, 94, 0, 0.15)';
    modeBadge.style.color = 'var(--primary)';
    btnDeleteGame.style.display = 'inline-block';

    linkViewPublicGame.style.display = 'inline-flex';
    linkViewPublicGame.href = `game-details.html?id=${game.id}`;

    if (game.league_id) leagueSelect.value = game.league_id;
    if (game.season_id) seasonSelect.value = game.season_id;
    if (game.venue_id) venueSelect.value = game.venue_id;
    if (game.game_date) gameDate.value = game.game_date;
    if (game.game_time) gameTime.value = game.game_time;

    if (game.home_team_id) homeTeamSelect.value = game.home_team_id;
    if (game.away_team_id) awayTeamSelect.value = game.away_team_id;
    updateTeamLabels();

    // Status Radio
    const status = game.status || 'completed';
    const statusRadio = document.querySelector(`input[name="gameStatus"][value="${status}"]`);
    if (statusRadio) {
      statusRadio.checked = true;
      document.querySelectorAll('.status-badge-radio').forEach(l => l.classList.remove('active'));
      document.querySelector(`.status-badge-radio[data-status="${status}"]`)?.classList.add('active');
    }

    // Quarters
    if (game.quarters && Array.isArray(game.quarters) && game.quarters.length > 0) {
      game.quarters.forEach(q => {
        const homeQ = document.querySelector(`.q-input[data-team="home"][data-quarter="${q.quarter_number}"]`);
        const awayQ = document.querySelector(`.q-input[data-team="away"][data-quarter="${q.quarter_number}"]`);
        if (homeQ) homeQ.value = q.home_points;
        if (awayQ) awayQ.value = q.away_points;
      });
    }

    homeFinalScore.value = game.home_score || 0;
    awayFinalScore.value = game.away_score || 0;
    recalculateQuarterTotals();

    // Player Box Scores
    homeStatsBody.innerHTML = '';
    awayStatsBody.innerHTML = '';

    if (game.home_player_stats && game.home_player_stats.length > 0) {
      game.home_player_stats.forEach(s => renderPlayerRow('home', {
        id: s.player_id,
        name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || `Player #${s.player_id}`,
        pos: s.player_position || 'G',
        ...s
      }));
    } else {
      loadRosterForTeam('home', game.home_team_id || homeTeamSelect.value);
    }

    if (game.away_player_stats && game.away_player_stats.length > 0) {
      game.away_player_stats.forEach(s => renderPlayerRow('away', {
        id: s.player_id,
        name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || `Player #${s.player_id}`,
        pos: s.player_position || 'G',
        ...s
      }));
    } else {
      loadRosterForTeam('away', game.away_team_id || awayTeamSelect.value);
    }

    recalculateBoxScoreTotals('home');
    recalculateBoxScoreTotals('away');
    showToast(`Loaded Game #${game.id} data successfully`, 'success');
  }

  // --- SUBMIT / SAVE GAME ---
  async function handleFormSubmit(e) {
    e.preventDefault();


    const homeId = parseInt(homeTeamSelect.value, 10);
    const awayId = parseInt(awayTeamSelect.value, 10);

    if (homeId === awayId) {
      showToast('Home team and Away team cannot be identical!', 'error');
      return;
    }

    // Collect Quarter Scores
    const quarters = [];
    document.querySelectorAll('.q-input[data-team="home"]').forEach(homeInp => {
      const qNum = parseInt(homeInp.dataset.quarter, 10);
      const awayInp = document.querySelector(`.q-input[data-team="away"][data-quarter="${qNum}"]`);
      quarters.push({
        quarter_number: qNum,
        home_points: parseInt(homeInp.value, 10) || 0,
        away_points: parseInt(awayInp?.value, 10) || 0
      });
    });

    // Collect Player Stats
    const playerStats = [];
    const collectStats = (side, teamId) => {
      const targetBody = side === 'home' ? homeStatsBody : awayStatsBody;
      targetBody.querySelectorAll('tr').forEach(row => {
        const playerName = row.querySelector('.stat-player-name')?.value.trim();
        if (!playerName) return;

        playerStats.push({
          player_id: row.dataset.playerId || Math.floor(Math.random() * 900) + 100,
          team_id: teamId,
          minutes: parseInt(row.querySelector('.stat-min')?.value, 10) || 0,
          points: parseInt(row.querySelector('.stat-pts')?.value, 10) || 0,
          rebounds: parseInt(row.querySelector('.stat-reb')?.value, 10) || 0,
          assists: parseInt(row.querySelector('.stat-ast')?.value, 10) || 0,
          steals: parseInt(row.querySelector('.stat-stl')?.value, 10) || 0,
          blocks: parseInt(row.querySelector('.stat-blk')?.value, 10) || 0,
          turnovers: parseInt(row.querySelector('.stat-to')?.value, 10) || 0,
          fouls: parseInt(row.querySelector('.stat-pf')?.value, 10) || 0,
          field_goals_made: parseInt(row.querySelector('.stat-fgm')?.value, 10) || 0,
          field_goals_attempted: parseInt(row.querySelector('.stat-fga')?.value, 10) || 0,
          three_pointers_made: parseInt(row.querySelector('.stat-3pm')?.value, 10) || 0,
          three_pointers_attempted: parseInt(row.querySelector('.stat-3pa')?.value, 10) || 0,
          free_throws_made: parseInt(row.querySelector('.stat-ftm')?.value, 10) || 0,
          free_throws_attempted: parseInt(row.querySelector('.stat-fta')?.value, 10) || 0,
          plus_minus: parseInt(row.querySelector('.stat-pm')?.value, 10) || 0
        });
      });
    };

    collectStats('home', homeId);
    collectStats('away', awayId);

    const payload = {
      season_id: parseInt(seasonSelect.value, 10) || 1,
      league_id: parseInt(leagueSelect.value, 10) || 1,
      home_team_id: homeId,
      away_team_id: awayId,
      venue_id: parseInt(venueSelect.value, 10) || 1,
      game_date: gameDate.value,
      game_time: gameTime.value,
      status: document.querySelector('input[name="gameStatus"]:checked')?.value || 'completed',
      home_score: parseInt(homeFinalScore.value, 10) || 0,
      away_score: parseInt(awayFinalScore.value, 10) || 0,
      quarters: quarters,
      player_stats: playerStats
    };

    const isEdit = !!gameIdInput.value;
    const url = isEdit
      ? `${API_BASE}?id=${gameIdInput.value}`
      : API_BASE;
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
          showToast(isEdit ? 'Game & Box Score updated!' : 'New game published to schedule!', 'success');
          loadGameList();
          if (!isEdit && result.data?.id) {
            gameIdInput.value = result.data.id;
            modeBadge.textContent = `EDITING FIXTURE #${result.data.id}`;
            btnDeleteGame.style.display = 'inline-block';
            linkViewPublicGame.style.display = 'inline-flex';
            linkViewPublicGame.href = `game-details.html?id=${result.data.id}`;
          }
          return;
        }
      }
    } catch (err) {
      console.log('Persisting to local fallback storage...');
    }

    // Local Storage Save Fallback
    const savedGames = JSON.parse(localStorage.getItem('surge_elite_games') || '[]');
    const newId = isEdit ? parseInt(gameIdInput.value, 10) : Date.now();
    const gameRecord = {
      id: newId,
      ...payload,
      home_team_name: homeTeamSelect.options[homeTeamSelect.selectedIndex]?.text.split('(')[0].trim(),
      away_team_name: awayTeamSelect.options[awayTeamSelect.selectedIndex]?.text.split('(')[0].trim()
    };

    if (isEdit) {
      const idx = savedGames.findIndex(g => g.id === newId);
      if (idx !== -1) savedGames[idx] = gameRecord;
      else savedGames.push(gameRecord);
    } else {
      savedGames.unshift(gameRecord);
      gameIdInput.value = newId;
      modeBadge.textContent = `EDITING FIXTURE #${newId}`;
      btnDeleteGame.style.display = 'inline-block';
      linkViewPublicGame.style.display = 'inline-flex';
      linkViewPublicGame.href = `game-details.html?id=${newId}`;
    }

    localStorage.setItem('surge_elite_games', JSON.stringify(savedGames));
    loadGameList();
    showToast(isEdit ? 'Game & Stats updated successfully!' : 'New game fixture published successfully!', 'success');
  }

  // --- DELETE GAME ---
  async function handleDeleteGame() {
    const id = gameIdInput.value;
    if (!id) return;

    if (!confirm(`Are you sure you want to permanently delete Game #${id}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          showToast(`Game #${id} deleted`, 'info');
          resetFormToNewGame();
          loadGameList();
          return;
        }
      }
    } catch (e) {
      // fallback delete
    }

    let savedGames = JSON.parse(localStorage.getItem('surge_elite_games') || '[]');
    savedGames = savedGames.filter(g => String(g.id) !== String(id));
    localStorage.setItem('surge_elite_games', JSON.stringify(savedGames));

    showToast(`Game #${id} deleted from local database`, 'info');
    resetFormToNewGame();
    loadGameList();
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
}
