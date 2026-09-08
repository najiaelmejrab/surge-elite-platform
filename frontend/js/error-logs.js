(function () {
  'use strict';

  const STORAGE_KEY = 'surgeEliteErrorLogs';
  const MAX_LOGS = 250;
  const levelOrder = ['critical', 'error', 'warning', 'info'];

  function createSeedLogs() {
    const now = Date.now();
    const minutes = (value) => new Date(now - value * 60 * 1000).toISOString();

    return [
      {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-1`,
        level: 'error',
        source: 'auth.js',
        message: 'Failed to parse session payload on admin portal load.',
        details: 'TypeError: Cannot read properties of undefined (reading "role")',
        timestamp: minutes(4)
      },
      {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-2`,
        level: 'warning',
        source: 'player-portal.js',
        message: 'Profile photo upload did not complete due to a missing file.',
        details: 'Warning: upload input returned an empty Blob and the fallback avatar was used.',
        timestamp: minutes(18)
      },
      {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-3`,
        level: 'critical',
        source: 'development.js',
        message: 'Development profile update failed to save.',
        details: 'Unhandled promise rejection: POST /api/player/update returned 500',
        timestamp: minutes(33)
      },
      {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-4`,
        level: 'info',
        source: 'admin.js',
        message: 'Admin dashboard refreshed successfully.',
        details: 'Status: 200 OK. Cached metrics reloaded without errors.',
        timestamp: minutes(56)
      }
    ];
  }

  function readLogs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const seedLogs = createSeedLogs();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seedLogs));
        return seedLogs;
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length ? parsed : createSeedLogs();
    } catch (error) {
      console.error('Error reading debug logs from localStorage.', error);
      return createSeedLogs();
    }
  }

  function saveLogs(logs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));
  }

  function normalizeLevel(level) {
    const value = String(level || 'info').toLowerCase();
    return levelOrder.includes(value) ? value : 'info';
  }

  function formatTime(timestamp) {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function getLevelBadge(level) {
    return `<span class="error-level-badge ${normalizeLevel(level)}">${normalizeLevel(level)}</span>`;
  }

  function renderSummary(logs) {
    const summary = {
      critical: 0,
      error: 0,
      warning: 0,
      info: 0,
      total: logs.length
    };

    logs.forEach((log) => {
      const key = normalizeLevel(log.level);
      if (summary[key] !== undefined) {
        summary[key] += 1;
      }
    });

    document.getElementById('criticalCount').textContent = summary.critical;
    document.getElementById('errorCount').textContent = summary.error;
    document.getElementById('warningCount').textContent = summary.warning;
    document.getElementById('totalCount').textContent = summary.total;
  }

  function filterLogs(logs, level, query) {
    return logs.filter((log) => {
      const matchesLevel = !level || level === 'all' || normalizeLevel(log.level) === level;
      const text = [log.message, log.source, log.details, log.level].join(' ').toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      return matchesLevel && matchesQuery;
    });
  }

  function renderLogs() {
    const level = document.getElementById('errorLevelFilter').value;
    const query = document.getElementById('errorSearch').value.trim();
    const logs = readLogs();
    const filtered = filterLogs(logs, level, query);
    const tbody = document.getElementById('logRows');

    renderSummary(logs);

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-log-state">
            No matching errors found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.slice().reverse().map((log) => {
      const levelClass = normalizeLevel(log.level);
      const details = log.details || 'No additional details provided.';
      const snippet = details.length > 120 ? `${details.slice(0, 120)}…` : details;
      return `
        <tr data-level="${levelClass}">
          <td>${formatTime(log.timestamp)}</td>
          <td>${getLevelBadge(log.level)}</td>
          <td>${escapeHtml(log.source || 'unknown')}</td>
          <td>${escapeHtml(log.message || 'Unknown error')}</td>
          <td title="${escapeHtml(details)}">${escapeHtml(snippet)}</td>
        </tr>
      `;
    }).join('');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function appendLog(level, source, message, details) {
    const logs = readLogs();
    logs.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      level: normalizeLevel(level),
      source: source || 'unknown',
      message: message || 'Unknown issue',
      details: details || '',
      timestamp: new Date().toISOString()
    });

    saveLogs(logs);
    renderLogs();
  }

  function setupFilters() {
    const levelFilter = document.getElementById('errorLevelFilter');
    const searchInput = document.getElementById('errorSearch');

    levelFilter?.addEventListener('change', renderLogs);
    searchInput?.addEventListener('input', renderLogs);

    document.getElementById('refreshLogsBtn')?.addEventListener('click', renderLogs);

    document.getElementById('clearLogsBtn')?.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      const seedLogs = createSeedLogs();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedLogs));
      renderLogs();
      if (window.adminToast) {
        window.adminToast('Debug logs cleared and reset.', 'info');
      }
    });

    document.getElementById('exportLogsBtn')?.addEventListener('click', () => {
      const logs = readLogs();
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'surge-elite-error-logs.json';
      anchor.click();
      URL.revokeObjectURL(url);
      if (window.adminToast) {
        window.adminToast('Error log export created.', 'success');
      }
    });
  }

  function captureBrowserErrors() {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      appendLog('error', 'browser-console', args.map(String).join(' '), args.map((value) => typeof value === 'string' ? value : JSON.stringify(value)).join(' | '));
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      appendLog('warning', 'browser-console', args.map(String).join(' '), args.map((value) => typeof value === 'string' ? value : JSON.stringify(value)).join(' | '));
      originalConsoleWarn.apply(console, args);
    };

    window.addEventListener('error', (event) => {
      const message = event.message || 'Window error';
      const source = event.filename || 'window';
      appendLog('error', source, message, event.error ? event.error.stack : `Line ${event.lineno}:${event.colno}`);
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason || {};
      const message = reason.message || 'Unhandled promise rejection';
      const stack = reason.stack || JSON.stringify(reason);
      appendLog('critical', 'promise', message, stack);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupFilters();
    renderLogs();
    captureBrowserErrors();
  });
})();
