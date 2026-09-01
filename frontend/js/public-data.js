/* Shared read-only public rendering for the localStorage prototype. */
(function () {
  const keys = {
    leagues: 'surge_admin_leagues_v1',
    teams: 'surge_admin_teams_v2',
    games: 'surge_admin_games_v1'
  };

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { return {}; }
  }

  function data() {
    return { leagues: read(keys.leagues), teams: read(keys.teams), games: read(keys.games) };
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function id() { return new URLSearchParams(location.search).get('id'); }
  function list(value) { return Array.isArray(value) ? value : Object.values(value || {}); }
  function teamName(team, fallback) { return team ? team.name : (fallback || 'Unknown Team'); }
  function score(value) { return Number.isFinite(Number(value)) ? Number(value) : null; }
  function formatDate(game) {
    if (!game.date) return 'Date TBA';
    const date = new Date(`${game.date}T${game.time || '00:00'}`);
    return Number.isNaN(date.getTime()) ? game.date : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function standings(leagueId, source) {
    const teams = list(source.teams).filter(team => !leagueId || team.leagueId === leagueId);
    const rows = teams.map(team => ({ team, gp: 0, w: 0, l: 0, pf: 0, pa: 0 }));
    const byId = Object.fromEntries(rows.map(row => [row.team.id, row]));
    list(source.games).filter(game => game.status === 'completed' && (!leagueId || game.leagueId === leagueId)).forEach(game => {
      const home = byId[game.homeTeamId];
      const away = byId[game.awayTeamId];
      const homeScore = score(game.homeScore);
      const awayScore = score(game.awayScore);
      if (!home || !away || homeScore === null || awayScore === null) return;
      home.gp++; away.gp++; home.pf += homeScore; home.pa += awayScore; away.pf += awayScore; away.pa += homeScore;
      if (homeScore > awayScore) { home.w++; away.l++; } else if (awayScore > homeScore) { away.w++; home.l++; }
    });
    return rows.sort((a, b) => b.w - a.w || (b.pf - b.pa) - (a.pf - a.pa));
  }

  function renderLeagueList(source) {
    const grid = document.getElementById('leaguesGrid');
    if (!grid) return;
    const leagues = list(source.leagues);
    grid.innerHTML = leagues.length ? leagues.map(league => {
      const count = list(source.teams).filter(team => team.leagueId === league.id).length;
      return `<article class="league-card" data-status="${esc(league.status || '')}"><div><div class="league-badge">${esc(league.status || 'Active')}</div><h3 class="league-title">${esc(league.name)}</h3><p>${esc(league.description || 'Competitive basketball division.')}</p><div class="league-meta"><div class="league-meta-item"><span class="league-meta-label">Season</span><span class="league-meta-val">${esc(league.season || '—')}</span></div><div class="league-meta-item"><span class="league-meta-label">Teams</span><span class="league-meta-val">${count}</span></div><div class="league-meta-item"><span class="league-meta-label">Format</span><span class="league-meta-val">${esc(league.format || '—')}</span></div></div></div><a href="league-details.html?id=${encodeURIComponent(league.id)}" class="btn btn-outline btn-sm">View League</a></article>`;
    }).join('') : '<p class="empty-state">No leagues available.</p>';
  }

  function renderTeamList(source) {
    const grid = document.getElementById('teamsGrid');
    if (!grid) return;
    const leagues = source.leagues;
    const teams = list(source.teams);
    grid.innerHTML = teams.length ? teams.map(team => `<article class="team-card" data-division="${esc(team.leagueId || '')}"><div class="team-card-header"><div class="team-logo-lg">${esc(team.badge || team.name.slice(0, 2).toUpperCase())}</div><div><h3 class="team-card-title">${esc(team.name)}</h3><div class="team-card-division">${esc(leagues[team.leagueId]?.name || team.league || 'Unassigned')} • ${esc(team.season || 'Season TBA')}</div></div></div><div class="team-card-details"><div class="team-detail-row"><span class="team-detail-label">Coach</span><strong class="team-detail-val">${esc(team.coach?.name || 'Unassigned')}</strong></div><div class="team-detail-row"><span class="team-detail-label">Roster</span><strong class="team-detail-val">${list(team.players).length} players</strong></div><div class="team-detail-row"><span class="team-detail-label">Status</span><strong class="team-detail-val">${esc(team.status || 'Active')}</strong></div></div><a href="team-details.html?id=${encodeURIComponent(team.id)}" class="btn btn-outline btn-sm">View Team</a></article>`).join('') : '<p class="empty-state">No teams available.</p>';
  }

  function renderPlayerList(source) {
    const grid = document.getElementById('playersGrid');
    if (!grid) return;
    const players = [];
    list(source.teams).forEach(team => list(team.players).forEach(player => players.push({ player, team })));
    grid.innerHTML = players.length ? players.map(({ player, team }) => `<article class="player-dir-card" data-pos="${esc(player.position || '')}" data-team="${esc(team.id)}" data-league="${esc(team.leagueId || '')}"><div class="player-dir-header"><div class="player-dir-number">#${esc(player.jersey || '—')}</div></div><div class="player-dir-body"><div class="player-dir-name">${esc(player.name)}</div><div class="player-dir-meta">${esc(team.name)} • ${esc(source.leagues[team.leagueId]?.name || team.league || 'Unassigned')}</div><div class="player-dir-chips"><span class="player-dir-chip pos">${esc(player.position || '—')}</span></div><a href="player-profile.html?id=${encodeURIComponent(player.id)}" class="btn btn-primary btn-sm" style="width:100%">View Profile</a></div></article>`).join('') : '<p class="empty-state">No players available.</p>';
  }

  function gameCard(game, source) {
    const home = source.teams[game.homeTeamId];
    const away = source.teams[game.awayTeamId];
    const hs = score(game.homeScore); const as = score(game.awayScore);
    return `<a href="game-details.html?id=${encodeURIComponent(game.id)}" class="game-card-full" data-league="${esc(game.leagueId || '')}" data-teams="${esc(`${game.homeTeamId || ''} ${game.awayTeamId || ''}`)}" style="text-decoration:none;color:inherit"><article><div class="game-card-top"><span class="game-league-tag">${esc(source.leagues[game.leagueId]?.name || game.league || 'Unassigned')}</span><span class="game-status-badge">${esc(game.status || 'scheduled')}</span></div><div class="game-card-body"><div class="game-matchup-full"><div class="team-side home"><div class="team-logo-pill">${esc(home?.badge || '—')}</div><div class="team-full-name">${esc(teamName(home, game.homeTeam))}</div></div><div class="score-center"><div class="score-vs">${hs === null ? 'VS' : `${hs} - ${as}`}</div></div><div class="team-side away"><div class="team-logo-pill">${esc(away?.badge || '—')}</div><div class="team-full-name">${esc(teamName(away, game.awayTeam))}</div></div></div><div class="game-card-footer"><span>${esc(formatDate(game))} • ${esc(game.time || '')}</span><span>${esc(game.venue || 'Venue TBA')}</span></div></div></article></a>`;
  }

  function renderNotFound(message) {
    const main = document.querySelector('main');
    if (main) main.innerHTML = `<div class="container empty-state"><h1>Record not found</h1><p>${esc(message)}</p><a href="index.html" class="btn btn-primary">Back Home</a></div>`;
  }

  function renderGames(source) {
    const upcoming = document.getElementById('sectionUpcoming');
    const results = document.getElementById('sectionResults');
    if (!upcoming && !results) return;
    const games = list(source.games);
    const upcomingGames = games.filter(game => game.status !== 'completed');
    const completedGames = games.filter(game => game.status === 'completed');
    if (upcoming) upcoming.innerHTML = `<div class="section-header"><h2 class="section-title">Upcoming Games</h2></div><div class="public-games-list">${upcomingGames.length ? upcomingGames.map(game => gameCard(game, source)).join('') : '<p class="empty-state">No upcoming games.</p>'}</div>`;
    if (results) results.innerHTML = `<div class="section-header"><h2 class="section-title">Results</h2></div><div class="public-games-list">${completedGames.length ? completedGames.map(game => gameCard(game, source)).join('') : '<p class="empty-state">No completed games.</p>'}</div>`;
  }

  function renderHome(source) {
    const leagueGrid = document.querySelector('#leagues:not(.leagues-section) .leagues-grid, .leagues-section#leagues .leagues-grid');
    if (leagueGrid) {
      leagueGrid.innerHTML = list(source.leagues).slice(0, 3).map(league => `<article class="league-card"><div><div class="league-badge">${esc(league.status || 'Active')}</div><h3 class="league-title">${esc(league.name)}</h3><p>${esc(league.description || 'Competitive basketball division.')}</p><div class="league-meta"><div class="league-meta-item"><span class="league-meta-label">Season</span><span class="league-meta-val">${esc(league.season || '—')}</span></div><div class="league-meta-item"><span class="league-meta-label">Teams</span><span class="league-meta-val">${list(source.teams).filter(team => team.leagueId === league.id).length}</span></div></div></div><a href="league-details.html?id=${encodeURIComponent(league.id)}" class="btn btn-outline btn-sm">View League</a></article>`).join('') || '<p>No active leagues.</p>';
    }
    const gameGrid = document.querySelector('#games.games-section .games-grid');
    if (gameGrid) gameGrid.innerHTML = list(source.games).slice(0, 3).map(game => gameCard(game, source)).join('') || '<p>No games scheduled.</p>';
    const playerGrid = document.querySelector('#players.players-section .players-grid');
    if (playerGrid) {
      const players = []; list(source.teams).forEach(team => list(team.players).forEach(player => players.push({ player, team })));
      playerGrid.innerHTML = players.slice(0, 3).map(({ player, team }) => `<a href="player-profile.html?id=${encodeURIComponent(player.id)}" class="public-player-link"><article class="player-card"><div class="player-header-bg"><div class="jersey-num">#${esc(player.jersey || '—')}</div><span class="public-player-status">${esc(player.status || 'Active')}</span></div><div class="player-avatar-wrapper"><div class="player-avatar" aria-hidden="true"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div></div><div class="player-info"><h3 class="player-name">${esc(player.name)}</h3><p class="player-team-pos">${esc(player.position || 'Position TBA')} • ${esc(team.name)}</p><div class="player-stats-grid"><div><div class="player-stat-val">#${esc(player.jersey || '—')}</div><div class="player-stat-lbl">Jersey</div></div><div><div class="player-stat-val">${esc(player.position || '—')}</div><div class="player-stat-lbl">Position</div></div><div><div class="player-stat-val">${esc(team.season || '—')}</div><div class="player-stat-lbl">Season</div></div></div></div></article></a>`).join('') || '<p>No players registered.</p>';
    }
  }

  function renderGameDetail(source) {
    const game = source.games[id()];
    if (!game || !document.getElementById('adminGameMatchupTitle')) return;
    const home = source.teams[game.homeTeamId]; const away = source.teams[game.awayTeamId];
    const homeName = teamName(home, game.homeTeam); const awayName = teamName(away, game.awayTeam);
    const set = (selector, value) => { const el = document.querySelector(selector); if (el) el.textContent = value; };
    set('#adminGameMatchupTitle', `${homeName} VS ${awayName}`);
    set('#adminGameSubMeta', `${source.leagues[game.leagueId]?.name || game.league || 'Unassigned'} • ${formatDate(game)} at ${game.time || ''} • ${game.venue || 'Venue TBA'}`);
  }

  function renderPublicDetail(source) {
    const game = source.games[id()];
    if (!game || !document.getElementById('homeTeamName')) return;
    const home = source.teams[game.homeTeamId]; const away = source.teams[game.awayTeamId];
    const set = (selector, value) => { const el = document.querySelector(selector); if (el) el.textContent = value; };
    set('#crumbGameTitle', `${teamName(home, game.homeTeam)} vs ${teamName(away, game.awayTeam)}`);
    set('#heroLeagueTag', source.leagues[game.leagueId]?.name || game.league || 'Unassigned');
    set('#heroDate', formatDate(game)); set('#homeTeamName', teamName(home, game.homeTeam)); set('#awayTeamName', teamName(away, game.awayTeam));
    set('#homeScore', score(game.homeScore) ?? '—'); set('#awayScore', score(game.awayScore) ?? '—'); set('#infoVenue', game.venue || 'Venue TBA'); set('#infoTime', `Tip-off: ${game.time || 'TBA'}`);
    const q = game.quarterScores || { home: [], away: [] };
    [0, 1, 2, 3].forEach((i) => { set(`#qHome${i + 1}`, q.home?.[i] ?? '—'); set(`#qAway${i + 1}`, q.away?.[i] ?? '—'); });
    set('#qHomeName', teamName(home, game.homeTeam)); set('#qAwayName', teamName(away, game.awayTeam)); set('#qHomeTotal', score(game.homeScore) ?? '—'); set('#qAwayTotal', score(game.awayScore) ?? '—');
    const ot = game.otScores || { home: [], away: [] };
    const otRow = document.getElementById('publicOtRow');
    if (otRow && (list(ot.home).length || list(ot.away).length)) { otRow.style.display = ''; set('#qHomeOt', list(ot.home).join(' + ') || '—'); set('#qAwayOt', list(ot.away).join(' + ') || '—'); }
    const body = document.getElementById('boxScoreHomeBody');
    const awayBody = document.getElementById('boxScoreAwayBody');
    const rows = entries => list(entries).map(player => `<tr><td>${esc(player.name)} #${esc(player.jersey || '—')}</td><td>${esc(player.position || '—')}</td><td>${player.stats?.min ?? 0}</td><td>${player.stats?.pts ?? 0}</td><td>${player.stats?.reb ?? 0}</td><td>${player.stats?.ast ?? 0}</td><td>${player.stats?.stl ?? 0}</td><td>${player.stats?.blk ?? 0}</td><td>${player.stats?.fgm ?? 0}-${player.stats?.fga ?? 0}</td><td>${player.stats?.tpm ?? 0}-${player.stats?.tpa ?? 0}</td><td>${player.stats?.ftm ?? 0}-${player.stats?.fta ?? 0}</td><td>—</td></tr>`).join('') || '<tr><td colspan="12">No box score recorded.</td></tr>';
    if (body) body.innerHTML = rows(game.homeBoxScore); if (awayBody) awayBody.innerHTML = rows(game.awayBoxScore);
  }

  function renderLeagueDetail(source) {
    const league = source.leagues[id()];
    const title = document.getElementById('leagueTitleDisplay');
    if (!league || !title) return;
    title.textContent = league.name;
    const teams = list(source.teams).filter(team => team.leagueId === league.id);
    const rows = standings(league.id, source);
    const standingsBody = document.querySelector('#standingsTab tbody');
    if (standingsBody) standingsBody.innerHTML = rows.map((row, index) => `<tr><td>${index + 1}</td><td>${esc(row.team.name)}</td><td>${row.gp}</td><td>${row.w}</td><td>${row.l}</td><td>${row.pf}</td><td>${row.pa}</td><td>${row.pf - row.pa}</td><td>${row.gp ? (row.w / row.gp).toFixed(3) : '.000'}</td></tr>`).join('') || '<tr><td colspan="9">No completed games yet.</td></tr>';
    const teamBody = document.querySelector('#leagueTeamsTable tbody');
    if (teamBody) teamBody.innerHTML = teams.map(team => `<tr><td><a href="team-details.html?id=${encodeURIComponent(team.id)}">${esc(team.name)}</a></td><td>${esc(team.coach?.name || '—')}</td><td>${list(team.players).length}</td></tr>`).join('') || '<tr><td colspan="3">No teams enrolled.</td></tr>';
    if (!document.getElementById('publicLeagueTeams') && teams.length) {
      const section = document.createElement('section');
      section.id = 'publicLeagueTeams';
      section.className = 'league-participating-teams';
      section.innerHTML = `<h2 class="section-title">Participating Teams</h2><div class="teams-grid">${teams.map(team => `<a href="team-details.html?id=${encodeURIComponent(team.id)}" class="team-card"><h3 class="team-card-title">${esc(team.name)}</h3><p>${list(team.players).length} players • ${esc(team.coach?.name || 'Coach unassigned')}</p></a>`).join('')}</div>`;
      document.querySelector('main')?.appendChild(section);
    }
    const schedule = document.querySelector('#scheduleTab .games-grid');
    if (schedule) schedule.innerHTML = list(source.games).filter(game => game.leagueId === league.id && game.status !== 'completed').map(game => gameCard(game, source)).join('') || '<p>No upcoming games.</p>';
    const results = document.querySelector('#resultsTab .results-grid');
    if (results) results.innerHTML = list(source.games).filter(game => game.leagueId === league.id && game.status === 'completed').map(game => gameCard(game, source)).join('') || '<p>No completed games.</p>';
  }

  function renderTeamDetail(source) {
    const team = source.teams[id()];
    const title = document.getElementById('teamNameDisplay');
    if (!team || !title) return;
    title.textContent = team.name;
    const league = source.leagues[team.leagueId];
    const set = (selector, value) => { const el = document.querySelector(selector); if (el) el.textContent = value; };
    set('#teamCoachDisplay', team.coach?.name || 'Unassigned'); set('#teamDivisionBadge', league?.name || team.league || 'Unassigned');
    const roster = document.querySelector('#rosterTab tbody');
    if (roster) roster.innerHTML = list(team.players).map(player => `<tr><td>#${esc(player.jersey || '—')}</td><td>${esc(player.name)}</td><td>${esc(player.position || '—')}</td><td>${esc(player.height || '—')} / ${esc(player.weight || '—')}</td></tr>`).join('') || '<tr><td colspan="4">No players on this roster.</td></tr>';
  }

  function renderPlayerProfile(source) {
    const playerId = id();
    if (!playerId || !document.getElementById('profileName')) return;
    let found = null;
    list(source.teams).some(team => list(team.players).some(player => {
      if (player.id === playerId) { found = { player, team }; return true; }
      return false;
    }));
    if (!found) return;
    const { player, team } = found;
    const set = (selector, value) => { const el = document.querySelector(selector); if (el) el.textContent = value; };
    set('#profileBreadcrumb', player.name); set('#profileName', player.name); set('#profileJersey', player.jersey || '—'); set('#profileTeam', team.name); set('#profilePosBadge', player.position || '—'); set('#profileDivBadge', source.leagues[team.leagueId]?.name || team.league || 'Unassigned'); set('#profileMeasure', `${player.height || '—'} • ${player.weight || '—'}`);
    const link = document.getElementById('profileTeamLink'); if (link) link.href = `team-details.html?id=${encodeURIComponent(team.id)}`;
  }

  function init() {
    const source = data();
    const path = location.pathname.toLowerCase();
    const requestedId = id();
    if (requestedId && path.endsWith('league-details.html') && !source.leagues[requestedId]) return renderNotFound('This league is unavailable.');
    if (requestedId && path.endsWith('team-details.html') && !source.teams[requestedId]) return renderNotFound('This team is unavailable.');
    if (requestedId && path.endsWith('game-details.html') && !source.games[requestedId]) return renderNotFound('This game is unavailable.');
    renderHome(source); renderLeagueList(source); renderTeamList(source); renderPlayerList(source); renderGames(source); renderGameDetail(source); renderPublicDetail(source); renderLeagueDetail(source); renderTeamDetail(source); renderPlayerProfile(source);
    if (requestedId && path.endsWith('player-profile.html')) {
      const playerExists = list(source.teams).some(team => list(team.players).some(player => player.id === requestedId));
      if (!playerExists) renderNotFound('This player is unavailable.');
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    init();
    setTimeout(init, 0);
  });
})();
