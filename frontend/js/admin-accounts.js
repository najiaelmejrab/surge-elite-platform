/**
 * Surge Elite Basketball Platform - Admin Account Management JS
 * Integrates with PHP + MySQL Backend API (backend/public/api/accounts.php)
 * Zero localStorage usage for auth or account data.
 */

document.addEventListener('DOMContentLoaded', () => {
  let allAccounts = [];
  const apiEndpoint = '../../backend/public/api/accounts.php';

  const accountsTableBody = document.getElementById('accountsTableBody');
  const accountsCountTitle = document.getElementById('accountsCountTitle');
  const accountsFooterText = document.getElementById('accountsFooterText');
  const searchInput = document.getElementById('accountSearchInput');
  const roleFilter = document.getElementById('accountRoleFilter');
  const statusFilter = document.getElementById('accountStatusFilter');

  const kpiTotal = document.getElementById('kpiTotal');
  const kpiActive = document.getElementById('kpiActive');
  const kpiPending = document.getElementById('kpiPending');
  const kpiInactive = document.getElementById('kpiInactive');

  const createAccountBtn = document.getElementById('createAccountBtn');
  const accountModal = document.getElementById('accountModal');
  const accountModalTitle = document.getElementById('accountModalTitle');
  const accountForm = document.getElementById('accountForm');
  const accountSaveBtn = document.getElementById('accountSaveBtn');

  const resetPasswordModal = document.getElementById('resetPasswordModal');
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const viewAccountModal = document.getElementById('viewAccountModal');

  // Toast container helper
  const showToast = (message, type = 'success') => {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'admin-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    toast.style.padding = '0.75rem 1rem';
    toast.style.marginBottom = '0.5rem';
    toast.style.borderRadius = 'var(--radius-md)';
    toast.style.background = type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
    toast.style.color = '#fff';
    toast.style.fontSize = '0.85rem';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getRoleBadge = (role) => {
    const r = String(role || '').toLowerCase();
    if (r === 'admin' || r === 'administrator') {
      return '<span class="admin-badge admin-badge--orange" style="background: rgba(255, 107, 0, 0.15); color: #ff6b00; padding: 0.25rem 0.6rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem;">Administrator</span>';
    }
    if (r === 'coach') {
      return '<span class="admin-badge admin-badge--cyan" style="background: rgba(0, 229, 255, 0.15); color: #00e5ff; padding: 0.25rem 0.6rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem;">Coach</span>';
    }
    if (r === 'player') {
      return '<span class="admin-badge admin-badge--blue" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 0.25rem 0.6rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem;">Player</span>';
    }
    return `<span class="admin-badge">${role}</span>`;
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'active') {
      return '<span class="admin-badge admin-badge--green" style="background: rgba(34, 197, 94, 0.15); color: #4ade80; padding: 0.25rem 0.6rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem;">Active</span>';
    }
    if (s === 'pending') {
      return '<span class="admin-badge admin-badge--yellow" style="background: rgba(234, 179, 8, 0.15); color: #facc15; padding: 0.25rem 0.6rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem;">Pending</span>';
    }
    return '<span class="admin-badge admin-badge--red" style="background: rgba(239, 68, 68, 0.15); color: #fca5a5; padding: 0.25rem 0.6rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem;">Inactive</span>';
  };

  // ---------------------------------------------------------------------------
  // Fetch Accounts from Backend API
  // ---------------------------------------------------------------------------
  async function fetchAccounts() {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          window.location.href = 'index.html';
          return;
        }
        throw new Error('Failed to load accounts list.');
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.accounts)) {
        allAccounts = data.accounts;
        updateKPIs();
        renderTable();
      }
    } catch (error) {
      showToast(error.message || 'Error loading account data', 'error');
    }
  }

  // Update KPI counters
  function updateKPIs() {
    if (kpiTotal) kpiTotal.textContent = allAccounts.length;
    if (kpiActive) kpiActive.textContent = allAccounts.filter(a => String(a.status).toLowerCase() === 'active').length;
    if (kpiPending) kpiPending.textContent = allAccounts.filter(a => String(a.status).toLowerCase() === 'pending').length;
    if (kpiInactive) kpiInactive.textContent = allAccounts.filter(a => String(a.status).toLowerCase() === 'inactive' || String(a.status).toLowerCase() === 'suspended').length;
  }

  // Filter & Render Table
  function renderTable() {
    if (!accountsTableBody) return;

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedRole = roleFilter ? roleFilter.value.toLowerCase() : 'all';
    const selectedStatus = statusFilter ? statusFilter.value.toLowerCase() : 'all';

    const filtered = allAccounts.filter((account) => {
      const name = String(account.name || '').toLowerCase();
      const email = String(account.email || '').toLowerCase();
      const matchesQuery = !query || name.includes(query) || email.includes(query);

      const r = String(account.role || '').toLowerCase();
      let matchesRole = true;
      if (selectedRole === 'administrator' || selectedRole === 'admin') {
        matchesRole = (r === 'admin' || r === 'administrator');
      } else if (selectedRole !== 'all') {
        matchesRole = (r === selectedRole);
      }

      const s = String(account.status || '').toLowerCase();
      let matchesStatus = true;
      if (selectedStatus !== 'all') {
        matchesStatus = (s === selectedStatus);
      }

      return matchesQuery && matchesRole && matchesStatus;
    });

    if (accountsCountTitle) accountsCountTitle.textContent = `Accounts (${filtered.length})`;
    if (accountsFooterText) accountsFooterText.textContent = `Showing ${filtered.length} of ${allAccounts.length} entries`;

    if (filtered.length === 0) {
      accountsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No accounts found matching your filters.
          </td>
        </tr>
      `;
      return;
    }

    accountsTableBody.innerHTML = filtered.map((account) => {
      const isSelf = window.currentUser && (window.currentUser.id === account.id || window.currentUser.email === account.email);
      const isDeactive = String(account.status).toLowerCase() !== 'active';
      const toggleActionText = isDeactive ? 'Activate' : 'Deactivate';
      const toggleActionClass = isDeactive ? 'btn-outline' : 'btn-outline';

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div class="admin-user-avatar" style="width: 36px; height: 36px; font-size: 0.85rem;">
                ${(account.first_name || 'U')[0]}${(account.last_name || '')[0] || ''}
              </div>
              <div>
                <strong style="display: block; color: #fff;">${escapeHtml(account.name)} ${isSelf ? '<small style="color: var(--primary);">(You)</small>' : ''}</strong>
                <small style="color: var(--text-muted); font-size: 0.8rem;">${escapeHtml(account.email)}</small>
              </div>
            </div>
          </td>
          <td>${getRoleBadge(account.role)}</td>
          <td>${getStatusBadge(account.status)}</td>
          <td style="font-size: 0.85rem; color: var(--text-muted);">${formatDate(account.created_at)}</td>
          <td style="font-size: 0.85rem; color: var(--text-muted);">${formatDate(account.updated_at)}</td>
          <td style="text-align: center;">
            <div style="display: flex; gap: 0.4rem; justify-content: center;">
              <button class="btn btn-outline btn-sm action-view-btn" data-id="${account.id}" title="View Details">View</button>
              <button class="btn btn-outline btn-sm action-edit-btn" data-id="${account.id}" title="Edit Account">Edit</button>
              <button class="btn btn-outline btn-sm action-reset-btn" data-id="${account.id}" title="Reset Password">Reset Pass</button>
              ${!isSelf ? `
                <button class="btn ${toggleActionClass} btn-sm action-status-btn" data-id="${account.id}" data-status="${isDeactive ? 'active' : 'inactive'}" style="font-size: 0.75rem;">
                  ${toggleActionText}
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    attachTableActionListeners();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------------------------------------------------------------------------
  // Action Event Listeners in Table
  // ---------------------------------------------------------------------------
  function attachTableActionListeners() {
    // View Account
    document.querySelectorAll('.action-view-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const account = allAccounts.find(a => a.id === id);
        if (account) openViewAccountModal(account);
      });
    });

    // Edit Account
    document.querySelectorAll('.action-edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const account = allAccounts.find(a => a.id === id);
        if (account) openEditAccountModal(account);
      });
    });

    // Reset Password
    document.querySelectorAll('.action-reset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const account = allAccounts.find(a => a.id === id);
        if (account) openResetPasswordModal(account);
      });
    });

    // Toggle Status
    document.querySelectorAll('.action-status-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const nextStatus = btn.getAttribute('data-status');
        await toggleAccountStatus(id, nextStatus);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Account Actions API Calls
  // ---------------------------------------------------------------------------
  async function toggleAccountStatus(id, nextStatus) {
    try {
      const response = await fetch(`${apiEndpoint}?action=status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: new URLSearchParams({ id, status: nextStatus }).toString()
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Status update failed.');
      }

      showToast(result.message || `Account set to ${nextStatus}`, 'success');
      fetchAccounts();
    } catch (error) {
      showToast(error.message || 'Status update error', 'error');
    }
  }

  // ---------------------------------------------------------------------------
  // Modal Handlers (Create & Edit)
  // ---------------------------------------------------------------------------
  if (createAccountBtn) {
    createAccountBtn.addEventListener('click', () => {
      openCreateAccountModal();
    });
  }

  function openCreateAccountModal() {
    if (!accountModal) return;
    accountForm.reset();
    document.getElementById('accountIdInput').value = '';
    accountModalTitle.textContent = 'Create New Account';
    accountSaveBtn.textContent = 'Create Account';

    // Show password row for creation
    let passGroup = document.getElementById('passwordInputGroup');
    if (!passGroup) {
      passGroup = document.createElement('div');
      passGroup.id = 'passwordInputGroup';
      passGroup.className = 'admin-form-group';
      passGroup.style.marginBottom = '1rem';
      passGroup.innerHTML = `
        <label class="admin-form-label" for="accountPasswordInput">Password *</label>
        <input type="password" id="accountPasswordInput" class="admin-form-input" placeholder="••••••••" required autocomplete="new-password">
      `;
      accountForm.insertBefore(passGroup, accountForm.querySelector('.admin-form-row'));
    } else {
      passGroup.style.display = 'block';
      const input = document.getElementById('accountPasswordInput');
      if (input) input.required = true;
    }

    accountModal.classList.add('open');
  }

  function openEditAccountModal(account) {
    if (!accountModal) return;
    accountForm.reset();
    document.getElementById('accountIdInput').value = account.id;
    accountModalTitle.textContent = `Edit Account: ${account.name}`;
    accountSaveBtn.textContent = 'Save Changes';

    document.getElementById('accountFirstNameInput').value = account.first_name || '';
    document.getElementById('accountLastNameInput').value = account.last_name || '';
    document.getElementById('accountEmailInput').value = account.email || '';
    document.getElementById('accountRoleInput').value = (account.role === 'admin' || account.role === 'administrator') ? 'admin' : account.role;
    document.getElementById('accountStatusInput').value = account.status || 'active';

    // Hide creation password field when editing existing account
    const passGroup = document.getElementById('passwordInputGroup');
    if (passGroup) {
      passGroup.style.display = 'none';
      const input = document.getElementById('accountPasswordInput');
      if (input) input.required = false;
    }

    accountModal.classList.add('open');
  }

  // Submit Create / Edit Form
  if (accountForm) {
    accountForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('accountIdInput').value;
      const isEdit = Boolean(id);

      const firstName = document.getElementById('accountFirstNameInput').value.trim();
      const lastName = document.getElementById('accountLastNameInput').value.trim();
      const email = document.getElementById('accountEmailInput').value.trim();
      const role = document.getElementById('accountRoleInput').value;
      const status = document.getElementById('accountStatusInput').value;

      if (!firstName || !lastName || !email) {
        showToast('First name, last name, and email are required.', 'error');
        return;
      }

      accountSaveBtn.disabled = true;
      accountSaveBtn.textContent = 'Saving...';

      try {
        let action = isEdit ? 'update' : 'create';
        let payload = { first_name: firstName, last_name: lastName, email, role, status };

        if (isEdit) {
          payload.id = id;
        } else {
          const passInput = document.getElementById('accountPasswordInput');
          payload.password = passInput ? passInput.value : '';
          if (!payload.password || payload.password.length < 8) {
            throw new Error('Password must be at least 8 characters long.');
          }
        }

        const response = await fetch(`${apiEndpoint}?action=${action}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'same-origin',
          body: new URLSearchParams(payload).toString()
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Action failed.');
        }

        showToast(result.message || (isEdit ? 'Account updated' : 'Account created'), 'success');
        accountModal.classList.remove('open');
        fetchAccounts();
      } catch (error) {
        showToast(error.message || 'Failed to save account', 'error');
      } finally {
        accountSaveBtn.disabled = false;
        accountSaveBtn.textContent = isEdit ? 'Save Changes' : 'Create Account';
      }
    });
  }

  // Modal dismiss buttons
  document.querySelectorAll('[data-dismiss="modal"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (accountModal) accountModal.classList.remove('open');
    });
  });

  // ---------------------------------------------------------------------------
  // View Details Modal
  // ---------------------------------------------------------------------------
  function openViewAccountModal(account) {
    if (!viewAccountModal) return;
    const content = document.getElementById('viewAccountContent');
    if (content) {
      content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem;">
          <div><strong style="color: var(--text-muted); display: block;">Full Name:</strong> ${escapeHtml(account.name)}</div>
          <div><strong style="color: var(--text-muted); display: block;">Email:</strong> ${escapeHtml(account.email)}</div>
          <div><strong style="color: var(--text-muted); display: block;">Role:</strong> ${getRoleBadge(account.role)}</div>
          <div><strong style="color: var(--text-muted); display: block;">Status:</strong> ${getStatusBadge(account.status)}</div>
          <div><strong style="color: var(--text-muted); display: block;">Created At:</strong> ${formatDate(account.created_at)}</div>
          <div><strong style="color: var(--text-muted); display: block;">Last Updated:</strong> ${formatDate(account.updated_at)}</div>
        </div>
      `;
    }
    viewAccountModal.classList.add('open');
  }

  document.querySelectorAll('[data-dismiss="viewModal"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (viewAccountModal) viewAccountModal.classList.remove('open');
    });
  });

  // ---------------------------------------------------------------------------
  // Reset Password Modal
  // ---------------------------------------------------------------------------
  function openResetPasswordModal(account) {

    let passModal = document.getElementById('adminResetPasswordModal');
    if (!passModal) {
      passModal = document.createElement('div');
      passModal.id = 'adminResetPasswordModal';
      passModal.className = 'admin-modal-overlay';
      passModal.innerHTML = `
        <div class="admin-modal">
          <div class="admin-modal-header">
            <h3 class="admin-modal-title">Reset Account Password</h3>
            <button class="admin-modal-close" id="closeResetPassModal">&times;</button>
          </div>
          <form id="adminResetPassForm">
            <input type="hidden" id="resetPassUserId">
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
              Set a new secure password for <strong id="resetPassUserName" style="color: #fff;"></strong>.
            </p>
            <div class="admin-form-group" style="margin-bottom: 1.25rem;">
              <label class="admin-form-label" for="newAdminPassword">New Password (min. 8 chars) *</label>
              <input type="password" id="newAdminPassword" class="admin-form-input" placeholder="••••••••" required autocomplete="new-password">
            </div>
            <div class="admin-modal-actions" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
              <button type="button" class="btn btn-outline" id="cancelResetPassModal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="saveResetPassBtn">Update Password</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(passModal);

      document.getElementById('closeResetPassModal').addEventListener('click', () => passModal.classList.remove('open'));
      document.getElementById('cancelResetPassModal').addEventListener('click', () => passModal.classList.remove('open'));

      document.getElementById('adminResetPassForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('resetPassUserId').value;
        const password = document.getElementById('newAdminPassword').value;

        if (!password || password.length < 8) {
          showToast('New password must be at least 8 characters long.', 'error');
          return;
        }

        const saveBtn = document.getElementById('saveResetPassBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Updating...';

        try {
          const response = await fetch(`${apiEndpoint}?action=reset_password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin',
            body: new URLSearchParams({ id, password }).toString()
          });

          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.message || 'Password reset failed.');
          }

          showToast(result.message || 'Password updated successfully', 'success');
          passModal.classList.remove('open');
        } catch (err) {
          showToast(err.message || 'Failed to reset password', 'error');
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Update Password';
        }
      });
    }

    document.getElementById('resetPassUserId').value = account.id;
    document.getElementById('resetPassUserName').textContent = account.name;
    document.getElementById('newAdminPassword').value = '';
    passModal.classList.add('open');
  }

  // ---------------------------------------------------------------------------
  // Filters Event Listeners
  // ---------------------------------------------------------------------------
  if (searchInput) searchInput.addEventListener('input', renderTable);
  if (roleFilter) roleFilter.addEventListener('change', renderTable);
  if (statusFilter) statusFilter.addEventListener('change', renderTable);

  // Initial load
  fetchAccounts();
});
