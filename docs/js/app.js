/**
 * SURGE ELITE BASKETBALL PLATFORM - MILESTONE 1 JAVASCRIPT
 * Public Landing Page Interactive Features
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Navbar Scroll Listener
  initStickyNavbar();

  // Initialize Mobile Drawer Navigation
  initMobileMenu();

  // Initialize Animated Counters
  initStatCounters();

  // Initialize Modal Dialog Controls
  initModals();

  // Initialize Milestone 2 Tab Controls
  initLeagueTabs();

  // Initialize Search & Filter Controls
  initLeagueFilters();
  initTeamFilters();

  // Initialize Milestone 4 Player Module
  initPlayerFilters();
  initStatBars();

  // Initialize Milestone 5 Games Module
  initGamesPage();
});

/**
 * 7. Teams List Search & Filter Logic
 */
function initTeamFilters() {
  const searchInput = document.getElementById('teamSearch');
  const divisionFilter = document.getElementById('divisionFilter');
  const teamCards = document.querySelectorAll('.team-card[data-division]');

  if (!searchInput && !divisionFilter) return;

  const filterTeams = () => {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedDivision = divisionFilter ? divisionFilter.value : 'all';

    teamCards.forEach(card => {
      const cardTitle = card.querySelector('.team-card-title')?.textContent.toLowerCase() || '';
      const coachName = card.querySelector('.team-detail-val')?.textContent.toLowerCase() || '';
      const cardDivision = card.getAttribute('data-division') || '';

      const matchesSearch = cardTitle.includes(query) || coachName.includes(query);
      const matchesDivision = selectedDivision === 'all' || cardDivision === selectedDivision;

      if (matchesSearch && matchesDivision) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  };

  if (searchInput) searchInput.addEventListener('input', filterTeams);
  if (divisionFilter) divisionFilter.addEventListener('change', filterTeams);
}


/**
 * 5. League Details Tab Switching
 */
function initLeagueTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content[id]');

  if (tabBtns.length === 0) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const activeContent = document.getElementById(targetTab);
      if (activeContent) {
        activeContent.classList.add('active');
      }
    });
  });
}

/**
 * 6. Leagues List Search & Filter Logic
 */
function initLeagueFilters() {
  const searchInput = document.getElementById('leagueSearch');
  const statusFilter = document.getElementById('statusFilter');
  const leagueCards = document.querySelectorAll('.league-card[data-status]');

  if (!searchInput && !statusFilter) return;

  const filterCards = () => {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedStatus = statusFilter ? statusFilter.value : 'all';

    leagueCards.forEach(card => {
      const cardTitle = card.querySelector('.league-title')?.textContent.toLowerCase() || '';
      const cardDesc = card.querySelector('p')?.textContent.toLowerCase() || '';
      const cardStatus = card.getAttribute('data-status') || '';

      const matchesSearch = cardTitle.includes(query) || cardDesc.includes(query);
      const matchesStatus = selectedStatus === 'all' || cardStatus === selectedStatus;

      if (matchesSearch && matchesStatus) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  };

  if (searchInput) searchInput.addEventListener('input', filterCards);
  if (statusFilter) statusFilter.addEventListener('change', filterCards);
}


/**
 * 1. Sticky Navigation Bar with backdrop blur state on scroll
 */
function initStickyNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial state check
}

/**
 * 2. Mobile Menu Drawer Navigation Logic
 */
function initMobileMenu() {
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileClose = document.getElementById('mobileClose');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!mobileToggle || !mobileMenu || !mobileOverlay) return;

  const openMenu = () => {
    mobileMenu.classList.add('active');
    mobileOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    mobileMenu.classList.remove('active');
    mobileOverlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  mobileToggle.addEventListener('click', openMenu);
  if (mobileClose) mobileClose.addEventListener('click', closeMenu);
  mobileOverlay.addEventListener('click', closeMenu);

  // Close menu when clicking any navigation link
  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

/**
 * 3. Animated Statistics Counter Trigger on Scroll Intersection
 */
function initStatCounters() {
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (statNumbers.length === 0) return;

  let animated = false;

  const animateCounters = () => {
    statNumbers.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'), 10);
      const suffix = counter.getAttribute('data-suffix') || '';
      const duration = 1800; // ms
      const frameRate = 1000 / 60;
      const totalFrames = Math.round(duration / frameRate);
      let frame = 0;

      const timer = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        // Ease out quadratic
        const currentCount = Math.round(target * (1 - Math.pow(1 - progress, 3)));
        
        counter.innerHTML = `${currentCount.toLocaleString()}<span>${suffix}</span>`;

        if (frame >= totalFrames) {
          clearInterval(timer);
          counter.innerHTML = `${target.toLocaleString()}<span>${suffix}</span>`;
        }
      }, frameRate);
    });
  };

  // IntersectionObserver to trigger animation when section comes into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        animateCounters();
        observer.disconnect();
      }
    });
  }, { threshold: 0.25 });

  const statsSection = document.getElementById('stats');
  if (statsSection) {
    observer.observe(statsSection);
  }
}

/**
 * 4. Modal Dialog Handlers for Login & Unlock Premium CTAs
 */
function initModals() {
  const loginModal = document.getElementById('loginModal');
  const premiumModal = document.getElementById('premiumModal');

  const loginBtns = document.querySelectorAll('.btn-trigger-login');
  const premiumBtns = document.querySelectorAll('.btn-trigger-premium');
  const modalCloses = document.querySelectorAll('.modal-close, .modal-backdrop');

  const openModal = (modal) => {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  loginBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(loginModal);
    });
  });

  premiumBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(premiumModal);
    });
  });

  modalCloses.forEach(close => {
    close.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      closeModal(modal);
    });
  });

  // Handle Demo Login Form Submission
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Surge Elite Platform: Login functionality will be implemented in Milestone 2! Thank you for testing.');
      closeModal(loginModal);
    });
  }

  // Handle Demo Premium Form Submission
  const premiumForm = document.getElementById('premiumForm');
  if (premiumForm) {
    premiumForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Surge Elite Premium: Registration submitted! Feature activation will launch in Milestone 2.');
      closeModal(premiumModal);
    });
  }
}

/**
 * 8. Player Directory Search & Filter Logic
 */
function initPlayerFilters() {
  const searchInput = document.getElementById('playerSearch');
  const posFilter = document.getElementById('positionFilter');
  const divFilter = document.getElementById('playerDivFilter') || document.getElementById('playerLeagueFilter');
  const teamFilter = document.getElementById('teamFilter') || document.getElementById('playerTeamFilter');
  const cards = document.querySelectorAll('.player-dir-card[data-pos]');

  if (!searchInput && !posFilter && !divFilter && !teamFilter) return;

  const filter = () => {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const pos = posFilter ? posFilter.value : 'all';
    const div = divFilter ? divFilter.value : 'all';
    const team = teamFilter ? teamFilter.value : 'all';

    cards.forEach(card => {
      const name = card.querySelector('.player-dir-name')?.textContent.toLowerCase() || '';
      const teamMeta = card.querySelector('.player-dir-meta')?.textContent.toLowerCase() || '';
      const cardPos = card.getAttribute('data-pos') || '';
      const cardDiv = card.getAttribute('data-div') || card.getAttribute('data-league') || '';
      const cardTeam = card.getAttribute('data-team') || '';

      const matchSearch = name.includes(query) || teamMeta.includes(query);
      const matchPos = pos === 'all' || cardPos === pos;
      const matchDiv = div === 'all' || cardDiv === div;
      const matchTeam = team === 'all' || cardTeam === team || teamMeta.includes(team.replace('-', ' '));

      card.style.display = (matchSearch && matchPos && matchDiv && matchTeam) ? 'flex' : 'none';
    });
  };

  if (searchInput) searchInput.addEventListener('input', filter);
  if (posFilter) posFilter.addEventListener('change', filter);
  if (divFilter) divFilter.addEventListener('change', filter);
  if (teamFilter) teamFilter.addEventListener('change', filter);
}

/**
 * 9. Animated Stat Bars (IntersectionObserver trigger)
 */
function initStatBars() {
  const bars = document.querySelectorAll('.stat-bar-fill[data-pct]');
  if (bars.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const pct = bar.getAttribute('data-pct');
        // Small delay so CSS transition is visible
        setTimeout(() => { bar.style.width = pct + '%'; }, 80);
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.3 });

  bars.forEach(bar => observer.observe(bar));
}

/**
 * 10. Games Page – Pill Tab Toggle (Upcoming / Results)
 */
function initGamesPage() {
  // Pill-tab switcher
  const pillTabs = document.querySelectorAll('.pill-tab[data-section]');
  const sections = document.querySelectorAll('.games-list-section');
  if (pillTabs.length === 0) return;

  pillTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      pillTabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.getAttribute('data-section'));
      if (target) target.classList.add('active');
    });
  });

  // Attach filter logic
  initGamesFilters();
}

/**
 * 11. Games Directory Search & Filter
 */
function initGamesFilters() {
  const searchEl = document.getElementById('gameSearch');
  const leagueEl = document.getElementById('gameLeagueFilter');
  const teamEl   = document.getElementById('gameTeamFilter');
  const cards    = document.querySelectorAll('.game-card-full[data-league]');

  if (!searchEl && !leagueEl && !teamEl) return;

  const applyFilter = () => {
    const q      = searchEl  ? searchEl.value.toLowerCase().trim() : '';
    const league = leagueEl  ? leagueEl.value : 'all';
    const team   = teamEl    ? teamEl.value   : 'all';

    cards.forEach(card => {
      const text      = card.textContent.toLowerCase();
      const cardLeague = card.getAttribute('data-league') || '';
      const cardTeams  = card.getAttribute('data-teams')  || '';

      const matchQ      = q === '' || text.includes(q);
      const matchLeague  = league === 'all' || cardLeague === league;
      const matchTeam    = team   === 'all' || cardTeams.includes(team);

      card.style.display = (matchQ && matchLeague && matchTeam) ? '' : 'none';
    });
  };

  if (searchEl) searchEl.addEventListener('input', applyFilter);
  if (leagueEl) leagueEl.addEventListener('change', applyFilter);
  if (teamEl)   teamEl.addEventListener('change', applyFilter);
}
