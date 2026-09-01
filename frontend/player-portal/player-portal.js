document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    const normalized = href.split('/').pop();
    if (normalized === currentPage) {
      link.classList.add('active');
    }
  });

  const mobileToggle = document.getElementById('mobileToggle');
  const mobileClose = document.getElementById('mobileClose');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileOverlay = document.getElementById('mobileOverlay');

  if (mobileToggle && mobileMenu && mobileOverlay) {
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

    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  initPlayerProfilePage();
});

function getAccountStore() {
  const raw = localStorage.getItem('surge_admin_accounts_v1');
  if (!raw) return {};
  try {
    return JSON.parse(raw) || {};
  } catch (error) {
    return {};
  }
}

function resolveAccountForPlayer(player = {}) {
  const store = getAccountStore();
  const values = Object.values(store);

  const account = values.find((entry) => {
    if (!entry) return false;
    const matchesEmail = player.email && entry.email && String(entry.email).toLowerCase() === String(player.email).toLowerCase();
    const matchesName = player.name && entry.name && String(entry.name).toLowerCase() === String(player.name).toLowerCase();
    return matchesEmail || matchesName;
  }) || values.find((entry) => entry && String(entry.status || '').toLowerCase() === 'active') || values[0];

  if (account) return account;

  const seeded = {
    id: `acct_player_${player.id || 'default'}`,
    name: player.name || 'Player',
    email: player.email || 'player@surgelite.com',
    password: 'SurgeElite123!',
    status: 'active'
  };

  const nextStore = { ...store, [seeded.id]: seeded };
  localStorage.setItem('surge_admin_accounts_v1', JSON.stringify(nextStore));
  return seeded;
}

function initPlayerProfilePage() {
  const form = document.getElementById('playerProfileForm');
  if (!form) return;

  const viewState = document.getElementById('profileViewState');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const editProfileModal = document.getElementById('editProfileModal');
  const securityResetBtn = document.getElementById('securityResetBtn');
  const resetPasswordModal = document.getElementById('resetPasswordModal');
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const resetPasswordEmailInput = document.getElementById('resetPasswordEmail');
  const resetPasswordMessage = document.getElementById('resetPasswordMessage');
  const playerId = new URLSearchParams(window.location.search).get('playerId') || 'p001';
  let currentPlayer = getSharedPlayerProfile(playerId);

  const setStatus = (message, tone = 'success') => {
    const statusEl = document.getElementById('profileSaveState');
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = tone === 'success' ? '#4ade80' : '#fbbf24';
  };

  const setProfileMode = (isEditing) => {
    if (viewState) viewState.classList.toggle('is-hidden', isEditing);
    if (editProfileModal) editProfileModal.classList.toggle('is-hidden', !isEditing);
    if (editProfileBtn) editProfileBtn.hidden = isEditing;
    document.body.style.overflow = isEditing ? 'hidden' : '';
  };

  const getEditableAccount = () => {
    const store = getAccountStore();
    const values = Object.values(store);
    const byEmail = values.find((account) => account && account.email && currentPlayer.player.email && String(account.email).toLowerCase() === String(currentPlayer.player.email).toLowerCase());
    const byName = values.find((account) => account && account.name && currentPlayer.player.name && String(account.name).toLowerCase() === String(currentPlayer.player.name).toLowerCase());
    const fallback = byEmail || byName || values.find((account) => account && String(account.status || '').toLowerCase() === 'active') || values[0] || null;

    if (fallback) return fallback;

    const seeded = {
      id: `acct_player_${currentPlayer.player.id || 'default'}`,
      name: currentPlayer.player.name || 'Player',
      email: currentPlayer.player.email || 'player@surgelite.com',
      password: 'SurgeElite123!',
      status: 'active'
    };

    const nextStore = { ...store, [seeded.id]: seeded };
    localStorage.setItem('surge_admin_accounts_v1', JSON.stringify(nextStore));
    return seeded;
  };

  const syncAccountEmail = (nextEmail) => {
    if (!nextEmail) return;
    const account = getEditableAccount();
    if (!account || !account.email) return;
    const nextAccount = { ...account, email: nextEmail };
    const store = getAccountStore();
    store[account.id || nextAccount.id] = nextAccount;
    localStorage.setItem('surge_admin_accounts_v1', JSON.stringify(store));
  };

  const calculateAge = (dobValue) => {
    if (!dobValue) return '';
    const dob = new Date(dobValue);
    if (Number.isNaN(dob.getTime())) return '';
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age;
  };

  const setResetMessage = (message, tone = 'success') => {
    if (!resetPasswordMessage) return;
    resetPasswordMessage.textContent = message;
    resetPasswordMessage.style.color = tone === 'success' ? '#4ade80' : '#fbbf24';
  };

  const closeResetPasswordModal = () => {
    if (resetPasswordModal) {
      resetPasswordModal.classList.add('is-hidden');
    }
    if (resetPasswordForm) resetPasswordForm.reset();
    setResetMessage('');
  };

  const openResetPasswordModal = () => {
    if (!resetPasswordModal) return;
    resetPasswordModal.classList.remove('is-hidden');
    const account = getEditableAccount();
    const email = account && account.email ? account.email : currentPlayer.player.email || '';
    if (resetPasswordEmailInput) resetPasswordEmailInput.value = email;
    setResetMessage('');
    if (resetPasswordEmailInput) resetPasswordEmailInput.focus();
  };

  const sendPasswordResetLink = (email) => {
    const normalized = (email || '').trim();
    if (!normalized) {
      return { ok: false, message: 'No email address found.' };
    }

    if (window.sendPasswordResetEmail && typeof window.sendPasswordResetEmail === 'function') {
      const response = window.sendPasswordResetEmail(normalized);
      return { ok: true, result: response };
    }

    const existing = JSON.parse(localStorage.getItem('surge_password_reset_requests') || '[]');
    existing.push({ email: normalized, sentAt: new Date().toISOString() });
    localStorage.setItem('surge_password_reset_requests', JSON.stringify(existing));
    return { ok: true, result: { email: normalized } };
  };

  const dobInput = document.getElementById('dateOfBirth');
  const ageInput = document.getElementById('age');
  if (dobInput) {
    dobInput.addEventListener('input', () => {
      if (!ageInput) return;
      const nextAge = calculateAge(dobInput.value);
      ageInput.value = nextAge !== '' ? String(nextAge) : '';
    });
  }

  const applyProfilePhoto = (photoValue) => {
    const avatarBadge = document.getElementById('profileAvatarBadge');
    const modalPreview = document.getElementById('profileImagePreview');
    const viewPreview = document.getElementById('viewProfileImagePreview');

    [avatarBadge, modalPreview, viewPreview].forEach((element) => {
      if (!element) return;
      if (photoValue) {
        element.style.backgroundImage = `url(${photoValue})`;
        element.textContent = '';
      } else {
        element.style.backgroundImage = 'none';
        const initials = (currentPlayer.player.firstName || currentPlayer.player.name || 'P').split(' ')[0].slice(0, 1).toUpperCase();
        element.textContent = initials || 'P';
      }
    });
  };

  const fileInput = document.getElementById('profilePicture');
  if (fileInput) {
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const photoValue = reader.result;
        applyProfilePhoto(photoValue);
        if (currentPlayer && currentPlayer.player) {
          currentPlayer.player.profilePhoto = photoValue;
        }
      };
      reader.readAsDataURL(file);
    });
  }

  const openEditModal = () => {
    setStatus('');
    setProfileMode(true);
  };

  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', openEditModal);
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      currentPlayer = getSharedPlayerProfile(playerId);
      renderPlayerProfile(currentPlayer);
      setProfileMode(false);
    });
  }

  document.getElementById('closeEditProfileModal')?.addEventListener('click', () => {
    currentPlayer = getSharedPlayerProfile(playerId);
    renderPlayerProfile(currentPlayer);
    setProfileMode(false);
  });

  if (editProfileModal) {
    editProfileModal.addEventListener('click', (event) => {
      if (event.target === editProfileModal) {
        currentPlayer = getSharedPlayerProfile(playerId);
        renderPlayerProfile(currentPlayer);
        setProfileMode(false);
      }
    });
  }

  if (securityResetBtn) {
    securityResetBtn.addEventListener('click', openResetPasswordModal);
  }

  document.getElementById('closeResetPasswordModal')?.addEventListener('click', closeResetPasswordModal);
  document.getElementById('cancelResetPassword')?.addEventListener('click', closeResetPasswordModal);
  if (resetPasswordModal) {
    resetPasswordModal.addEventListener('click', (event) => {
      if (event.target === resetPasswordModal) closeResetPasswordModal();
    });
  }

  resetPasswordForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = resetPasswordEmailInput ? resetPasswordEmailInput.value.trim() : '';
    const result = sendPasswordResetLink(email);
    if (!result.ok) {
      setResetMessage(result.message, 'warning');
      return;
    }
    setResetMessage('Password reset link sent. Please check your email.');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const profileData = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email,
      phone: document.getElementById('phone').value.trim(),
      dateOfBirth: document.getElementById('dateOfBirth').value,
      age: document.getElementById('age') ? document.getElementById('age').value.trim() : '',
      position: document.getElementById('position').value.trim(),
      school: document.getElementById('school').value.trim(),
      profilePhoto: document.getElementById('profileImagePreview').style.backgroundImage
        ? document.getElementById('profileImagePreview').style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '')
        : currentPlayer.player.profilePhoto || '',
      teamName: document.getElementById('teamName').value.trim(),
      height: document.getElementById('height').value.trim(),
      jersey: document.getElementById('jersey').value.trim(),
      name: [
        document.getElementById('firstName').value.trim(),
        document.getElementById('lastName').value.trim()
      ].filter(Boolean).join(' '),
      parentGuardian: {
        fullName: document.getElementById('guardianName').value.trim(),
        relationship: document.getElementById('guardianRelationship').value.trim(),
        email: document.getElementById('guardianEmail').value.trim(),
        phone: document.getElementById('guardianPhone').value.trim()
      }
    };

    if (!profileData.firstName || !profileData.lastName) {
      setStatus('First and last name are required.', 'warning');
      return;
    }

    syncAccountEmail(email);
    const saved = saveSharedPlayerProfile(currentPlayer.player.id, profileData);
    currentPlayer = saved || currentPlayer;
    renderPlayerProfile(currentPlayer);
    setProfileMode(false);
    setStatus('Profile saved successfully.');
  });

  const tabButtons = document.querySelectorAll('.profile-tab');
  const tabPanels = document.querySelectorAll('.profile-tab-panel');
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.tab;
      tabButtons.forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      tabPanels.forEach((panel) => {
        const isActive = panel.id === `tab-${target}`;
        panel.classList.toggle('active', isActive);
        panel.hidden = !isActive;
      });
    });
  });

  renderPlayerProfile(currentPlayer);
  setProfileMode(false);
}

function getSharedPlayerProfile(playerId) {
  if (window.getPlayerProfileById) {
    const result = window.getPlayerProfileById(playerId);
    if (result && result.player) {
      return result;
    }
  }

  const teams = window.getAdminTeams ? window.getAdminTeams() : {};
  for (const teamId in teams) {
    const team = teams[teamId];
    const player = Array.isArray(team.players) ? team.players.find((entry) => entry.id === playerId) : null;
    if (player) {
      return { teamId, teamName: team.name, player };
    }
  }

  const fallbackTeam = {
    id: 't001',
    name: 'Surge Wolves',
    league: 'U19 Elite League'
  };

  return {
    teamId: fallbackTeam.id,
    teamName: fallbackTeam.name,
    player: {
      id: playerId,
      name: 'Marcus Vance',
      firstName: 'Marcus',
      lastName: 'Vance',
      email: 'marcus.vance@surgelite.com',
      phone: '(555) 123-4567',
      dateOfBirth: '2009-05-18',
      position: 'Point Guard (PG)',
      jersey: '23',
      height: "6'3\"",
      teamName: fallbackTeam.name,
      profilePhoto: '',
      school: 'Northfield Academy',
      parentGuardian: {
        fullName: 'Jane Vance',
        relationship: 'Mother',
        email: 'jane.vance@example.com',
        phone: '(555) 987-6543'
      }
    }
  };
}

function saveSharedPlayerProfile(playerId, profileData) {
  if (window.savePlayerProfileById) {
    const result = window.savePlayerProfileById(playerId, profileData);
    if (result && result.player) return result;
  }

  const teams = window.getAdminTeams ? window.getAdminTeams() : {};
  let target = null;

  for (const teamId in teams) {
    const team = teams[teamId];
    const index = Array.isArray(team.players) ? team.players.findIndex((entry) => entry.id === playerId) : -1;
    if (index >= 0) {
      target = { teamId, team, index };
      break;
    }
  }

  if (!target) return null;

  const merged = {
    ...target.team.players[target.index],
    ...profileData,
    id: playerId,
    name: [profileData.firstName || target.team.players[target.index].firstName || target.team.players[target.index].name?.split(' ')[0], profileData.lastName || target.team.players[target.index].lastName || target.team.players[target.index].name?.split(' ').slice(1).join(' ')].filter(Boolean).join(' '),
    teamName: target.team.name,
    updatedAt: new Date().toISOString()
  };

  target.team.players[target.index] = merged;
  localStorage.setItem('surge_admin_teams_v2', JSON.stringify(teams));
  return { teamId: target.teamId, teamName: target.team.name, player: merged };
}

function renderPlayerProfile(result) {
  const player = result && result.player ? result.player : {};
  const fullName = [player.firstName || player.name?.split(' ')[0], player.lastName || player.name?.split(' ').slice(1).join(' ')].filter(Boolean).join(' ') || 'Player';
  const teamName = result && result.teamName ? result.teamName : player.teamName || 'Surge Wolves';
  const position = player.position || 'Point Guard (PG)';
  const jersey = player.jersey || '23';
  const height = player.height || "6'3\"";
  const dateOfBirth = player.dateOfBirth || '2009-05-18';
  const ageValue = player.age || calculateAge(dateOfBirth) || '17';
  const account = resolveAccountForPlayer(player);

  document.getElementById('profileHeroName').textContent = fullName;
  document.getElementById('profileHeroMeta').textContent = `${position} · ${teamName} · Season 2026 · ${height}`;

  const avatar = document.getElementById('profileAvatarBadge');
  const modalPreview = document.getElementById('profileImagePreview');
  const photoValue = player.profilePhoto || '';

  if (avatar) {
    if (photoValue) {
      avatar.style.backgroundImage = `url(${photoValue})`;
      avatar.textContent = '';
    } else {
      avatar.style.backgroundImage = 'none';
      const initials = fullName.split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'P';
      avatar.textContent = initials;
    }
  }

  if (modalPreview) {
    if (photoValue) {
      modalPreview.style.backgroundImage = `url(${photoValue})`;
      modalPreview.textContent = '';
    } else {
      modalPreview.style.backgroundImage = 'none';
      const initials = fullName.split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'P';
      modalPreview.textContent = initials;
    }
  }

  document.getElementById('viewFirstName').textContent = player.firstName || fullName.split(' ')[0] || '';
  document.getElementById('viewLastName').textContent = player.lastName || fullName.split(' ').slice(1).join(' ') || '';
  document.getElementById('viewAge').textContent = ageValue;
  document.getElementById('viewDateOfBirth').textContent = dateOfBirth;
  document.getElementById('viewEmail').textContent = player.email || account.email || 'marcus.vance@surgelite.com';
  document.getElementById('viewPhone').textContent = player.phone || '(555) 123-4567';
  document.getElementById('viewPosition').textContent = position;
  document.getElementById('viewHeight').textContent = height;
  document.getElementById('viewTeam').textContent = teamName;
  document.getElementById('viewJersey').textContent = jersey;
  document.getElementById('viewSchool').textContent = player.school || 'Northfield Academy';

  const guardianDetails = player.parentGuardian || {};
  document.getElementById('viewGuardianName').textContent = guardianDetails.fullName || 'Jane Vance';
  document.getElementById('viewGuardianRelationship').textContent = guardianDetails.relationship || 'Mother';
  document.getElementById('viewGuardianEmail').textContent = guardianDetails.email || 'jane.vance@example.com';
  document.getElementById('viewGuardianPhone').textContent = guardianDetails.phone || '(555) 987-6543';

  const resetEmailInput = document.getElementById('resetPasswordEmail');
  if (resetEmailInput) {
    resetEmailInput.value = account.email || player.email || 'marcus.vance@surgelite.com';
  }

  document.getElementById('profileSidebarName').textContent = fullName;
  document.getElementById('profileSidebarRole').textContent = position;
  document.getElementById('readOnlyTeam').textContent = teamName;
  document.getElementById('readOnlyJersey').textContent = jersey;
  document.getElementById('readOnlyHeight').textContent = height;

  const preview = document.getElementById('profileImagePreview');
  if (preview) {
    if (photoValue) {
      preview.style.backgroundImage = `url(${photoValue})`;
      preview.textContent = '';
    } else {
      preview.style.backgroundImage = 'none';
      const initials = fullName.split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'P';
      preview.textContent = initials;
    }
  }

  const fields = {
    firstName: document.getElementById('firstName'),
    lastName: document.getElementById('lastName'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    dateOfBirth: document.getElementById('dateOfBirth'),
    age: document.getElementById('age'),
    position: document.getElementById('position'),
    height: document.getElementById('height'),
    teamName: document.getElementById('teamName'),
    jersey: document.getElementById('jersey'),
    school: document.getElementById('school'),
    guardianName: document.getElementById('guardianName'),
    guardianRelationship: document.getElementById('guardianRelationship'),
    guardianEmail: document.getElementById('guardianEmail'),
    guardianPhone: document.getElementById('guardianPhone')
  };

  if (fields.firstName) fields.firstName.value = player.firstName || fullName.split(' ')[0] || '';
  if (fields.lastName) fields.lastName.value = player.lastName || fullName.split(' ').slice(1).join(' ') || '';
  if (fields.email) fields.email.value = player.email || account.email || 'marcus.vance@surgelite.com';
  if (fields.phone) fields.phone.value = player.phone || '(555) 123-4567';
  if (fields.dateOfBirth) fields.dateOfBirth.value = dateOfBirth;
  if (fields.age) fields.age.value = ageValue;
  if (fields.position) fields.position.value = position;
  if (fields.height) fields.height.value = height;
  if (fields.teamName) fields.teamName.value = teamName;
  if (fields.jersey) fields.jersey.value = jersey;
  if (fields.school) fields.school.value = player.school || 'Northfield Academy';

  const guardianFormDetails = player.parentGuardian || {};
  if (fields.guardianName) fields.guardianName.value = guardianFormDetails.fullName || 'Jane Vance';
  if (fields.guardianRelationship) fields.guardianRelationship.value = guardianFormDetails.relationship || 'Mother';
  if (fields.guardianEmail) fields.guardianEmail.value = guardianFormDetails.email || 'jane.vance@example.com';
  if (fields.guardianPhone) fields.guardianPhone.value = guardianFormDetails.phone || '(555) 987-6543';

  document.getElementById('snapshotJersey').textContent = jersey;
  document.getElementById('snapshotPosition').textContent = position.includes('(') ? position.match(/\(([^)]+)\)/)?.[1] || position : position;
  document.getElementById('snapshotTeam').textContent = teamName.split(' ')[0] || teamName;
  document.getElementById('snapshotHeight').textContent = height;
}

function calculateAge(dobValue) {
  if (!dobValue) return '';
  const dob = new Date(dobValue);
  if (Number.isNaN(dob.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return String(age);
}
