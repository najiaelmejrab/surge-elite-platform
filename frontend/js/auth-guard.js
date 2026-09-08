/**
 * Surge Elite Basketball Platform - Authentication Guard
 * Enforces PHP session authentication, role-based portal protection, and dynamic user UI syncing.
 * No localStorage authentication is used.
 */
(function () {
  const currentPath = window.location.pathname.replace(/\\/g, '/');
  const isAdminSection = currentPath.includes('/admin/');
  const isPlayerSection = currentPath.includes('/player-portal/');

  // Resolve correct relative paths depending on directory depth
  const apiSessionUrl = (isAdminSection || isPlayerSection)
    ? '../../backend/public/api/auth.php'
    : '../backend/public/api/auth.php';

  const loginUrl = (isAdminSection || isPlayerSection)
    ? '../login.html'
    : 'login.html';

  const adminPortalUrl = isPlayerSection
    ? '../admin/index.html'
    : (isAdminSection ? 'index.html' : 'admin/index.html');

  const playerPortalUrl = isAdminSection
    ? '../player-portal/index.html'
    : (isPlayerSection ? 'index.html' : 'player-portal/index.html');

  function updatePortalUI(user) {
    if (!user) return;
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
    const firstInitial = (user.first_name || 'U')[0] || 'U';
    const lastInitial = (user.last_name || '')[0] || '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();

    // Admin & Coach UI elements
    document.querySelectorAll('.admin-user-name').forEach((el) => {
      el.textContent = fullName;
    });

    document.querySelectorAll('.admin-user-role').forEach((el) => {
      if (user.role === 'coach') {
        el.textContent = 'Head Coach';
      } else if (user.role === 'admin') {
        el.textContent = 'System Administrator';
      } else {
        el.textContent = 'User';
      }
    });

    document.querySelectorAll('.admin-user-avatar').forEach((el) => {
      if (!el.querySelector('img')) {
        el.textContent = initials;
      }
    });

    // Role-based visibility: hide admin-only links (Accounts) if user is not an administrator
    if (String(user.role).toLowerCase() !== 'admin') {
      document.querySelectorAll('a[href*="admin-accounts.html"]').forEach((el) => {
        el.style.display = 'none';
      });
    }

    // Player Portal UI elements
    document.querySelectorAll('.portal-profile-pill__avatar').forEach((el) => {
      if (!el.querySelector('img')) {
        el.textContent = initials;
      }
    });

    document.querySelectorAll('.portal-profile-pill__meta strong').forEach((el) => {
      el.textContent = fullName;
    });

    document.querySelectorAll('#profileHeroName').forEach((el) => {
      el.textContent = fullName;
    });

    document.querySelectorAll('#viewSecurityEmail').forEach((el) => {
      el.textContent = user.email || '';
    });
  }

  fetch(apiSessionUrl, {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
    .then((res) => {
      if (res.status === 401) {
        window.location.href = loginUrl;
        return null;
      }
      if (!res.ok) {
        throw new Error('Session check failed with status ' + res.status);
      }
      return res.json();
    })
    .then((data) => {
      if (!data || !data.loggedIn || !data.role) {
        window.location.href = loginUrl;
        return;
      }

      const role = String(data.role).toLowerCase();
      window.currentUser = data.user || null;

      // Role check for Admin Section (Admins & Coaches allowed; Players redirected to Player Portal)
      if (isAdminSection) {
        if (role === 'player') {
          window.location.href = playerPortalUrl;
          return;
        }

        // Dedicated administrator-only sub-pages (e.g. Accounts management)
        if (currentPath.includes('admin-accounts.html') && role !== 'admin') {
          window.location.href = 'index.html';
          return;
        }
      }

      // Role check for Player Section (Players allowed; Staff redirected to Admin Portal)
      if (isPlayerSection) {
        if (role === 'admin' || role === 'coach') {
          window.location.href = adminPortalUrl;
          return;
        }
      }

      // Sync user info into page DOM
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => updatePortalUI(data.user));
      } else {
        updatePortalUI(data.user);
      }

      // Dispatch event for any other scripts that want to listen
      window.dispatchEvent(new CustomEvent('surge:auth-ready', { detail: data }));
    })
    .catch((err) => {
      console.warn('Authentication guard check failed:', err);
      window.location.href = loginUrl;
    });
})();
