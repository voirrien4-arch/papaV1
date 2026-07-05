// Gold_Crew — Admin Module (Auth, Users, Promos, API Keys, Announcements, Settings)
const Admin = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  const ADMIN_CREDS_KEY = 'gc_admin_creds';
  const ADMIN_SESSION_KEY = 'gc_admin_session';
  const API_KEYS_KEY = 'gc_api_keys';
  const ANNOUNCEMENTS_KEY = 'gc_announcements';
  const SITE_SETTINGS_KEY = 'gc_site_settings';

  // ── Init ──────────────────────────────────────────────
  async function init() {
    // Admin credentials — SHA-256 with fixed salt (factory reset on every load)
    const ADMIN_SALT = 'gc_admin_v1';
    let adminHash;
    try {
      adminHash = await GCAuth.hashPasswordSHA256('620891542', ADMIN_SALT);
    } catch {
      adminHash = GCAuth.legacyHashPassword('620891542');
    }
    const creds = await GCStorage.get(ADMIN_CREDS_KEY);
    if (!creds || creds.username !== 'balla' || creds.password !== adminHash) {
      await GCStorage.set(ADMIN_CREDS_KEY, {
        username: 'balla',
        password: adminHash,
        salt: ADMIN_SALT,
        passwordVersion: 'sha256',
        createdAt: new Date().toISOString(),
        mustChangePassword: false,
      });
    }

    // Migrate legacy AI sources into site_settings
    try {
      const legacyAiSources = await GCStorage.get('gc_ai_sources');
      const settings = await GCStorage.get(SITE_SETTINGS_KEY);
      if (legacyAiSources?.files?.length > 0 && settings && !settings.aiKnowledgeBase) {
        settings.aiKnowledgeBase = legacyAiSources;
        await GCStorage.set(SITE_SETTINGS_KEY, settings);
      }
    } catch {}

    const settings = await GCStorage.get(SITE_SETTINGS_KEY);
    if (!settings) {
      await GCStorage.set(SITE_SETTINGS_KEY, {
        maintenanceMode: false,
        maintenanceMessage: 'Site en maintenance. Revenez bientôt.',
        defaultCrewQuota: 2,
        whatsappLink: 'https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T',
        // API keys and source states are managed server-side in settings.json
        // The frontend fetches them via /api/public/sources
        apiKeys: {},
        sourceStates: {},
      });
    } else {
      // API keys and source states are managed server-side
      if (!settings.apiKeys) settings.apiKeys = {};
      if (!settings.sourceStates) settings.sourceStates = {};
    }
  }

  // ── Auth ──────────────────────────────────────────────
  async function login(username, password) {
    // Try Server API first
    try {
      const result = await GCApi.adminLogin({ username, password });
      GCApi.storeAdminToken(result.token);
      const session = { isAdmin: true, token: GCAuth.generateToken(), createdAt: Date.now() };
      await GCStorage.setSession(ADMIN_SESSION_KEY, session);
      GCState.set({ isAdmin: true });
      return { success: true };
    } catch (e) {
      if (e.status === 429) {
        return { error: e.error || 'Trop de tentatives.', lockedOut: true, remainingMs: e.remainingMs || 600000 };
      }
      if (e.status === 401) {
        return { error: e.error || 'Identifiants incorrects.' };
      }
      if (!e.offline) console.warn('API admin login failed, using localStorage fallback:', e);
    }

    // Brute Force Check
    const bfKey = 'admin_login:' + (username || '').toLowerCase();
    try {
      const limit = await GCBruteForce.checkLimit(bfKey);
      if (!limit.allowed) {
        const timeStr = GCBruteForce.formatLockoutTime(limit.remainingMs);
        return {
          error: `Trop de tentatives. Réessayez dans ${timeStr}.`,
          lockedOut: true,
          remainingMs: limit.remainingMs,
        };
      }
    } catch {}

    const creds = await GCStorage.get(ADMIN_CREDS_KEY);
    if (!creds) return { error: 'Compte administrateur non configuré.' };
    // Verify password (SHA-256 with legacy DJB2 fallback)
    let passwordValid = false;
    if (creds.salt && creds.passwordVersion === 'sha256') {
      try { passwordValid = (await GCAuth.hashPasswordSHA256(password, creds.salt)) === creds.password; } catch {}
    } else {
      passwordValid = creds.password === GCAuth.legacyHashPassword(password);
    }
    if (creds.username !== username || !passwordValid) {
      try {
        const result = await GCBruteForce.recordFailure(bfKey);
        if (!result.allowed) {
          const timeStr = GCBruteForce.formatLockoutTime(result.remainingMs);
          return {
            error: `Trop de tentatives. Réessayez dans ${timeStr}.`,
            lockedOut: true,
            remainingMs: result.remainingMs,
          };
        }
      } catch {}
      return { error: 'Identifiants incorrects.' };
    }
    // Success — reset brute force counter
    try { await GCBruteForce.reset(bfKey); } catch {}
    const session = { isAdmin: true, token: GCAuth.generateToken(), createdAt: Date.now() };
    await GCStorage.setSession(ADMIN_SESSION_KEY, session);
    GCState.set({ isAdmin: true });
    return { success: true, mustChangePassword: creds.mustChangePassword || false };
  }

  async function logout() {
    GCApi.clearAdminToken();
    await GCStorage.removeSession(ADMIN_SESSION_KEY);
    GCState.set({ isAdmin: false });
  }

  async function checkSession() {
    // Check API admin token validity
    if (GCApi.getAdminToken()) {
      try {
        const result = await GCApi.adminGetStats();
        if (result.success) {
          GCState.set({ isAdmin: true });
          return true;
        }
      } catch {
        GCApi.clearAdminToken();
      }
    }
    // localStorage fallback
    const session = await GCStorage.getSession(ADMIN_SESSION_KEY);
    if (!session?.isAdmin) return false;
    if (Date.now() - session.createdAt > 24 * 3600000) { await logout(); return false; }
    GCState.set({ isAdmin: true });
    return true;
  }

  async function changePassword(currentPw, newPw) {
    // Try Server API first
    try {
      await GCApi.adminChangePassword({ currentPassword: currentPw, newPassword: newPw });
    } catch (e) {
      if (e.status === 401) return { error: 'Mot de passe actuel incorrect.' };
    }
    // Also update localStorage
    const creds = await GCStorage.get(ADMIN_CREDS_KEY);
    if (!creds) return { error: 'Compte administrateur non configuré.' };
    let valid = false;
    if (creds.salt && creds.passwordVersion === 'sha256') {
      try { valid = (await GCAuth.hashPasswordSHA256(currentPw, creds.salt)) === creds.password; } catch {}
    } else {
      valid = creds.password === GCAuth.legacyHashPassword(currentPw);
    }
    if (!valid) return { error: 'Mot de passe actuel incorrect.' };
    if (!GCAuth.validatePassword(newPw)) return { error: t('auth.password_requirements') };
    const salt = 'gc_admin_v1';
    creds.password = await GCAuth.hashPasswordSHA256(newPw, salt);
    creds.salt = salt;
    creds.passwordVersion = 'sha256';
    creds.mustChangePassword = false;
    await GCStorage.set(ADMIN_CREDS_KEY, creds);
    return { success: true };
  }

  // ── Users ─────────────────────────────────────────────
  async function getAllUsers() {
    // Try Server API first
    try {
      const result = await GCApi.adminGetUsers();
      if (result.success) return result.users;
    } catch {}
    // localStorage fallback
    return (await GCStorage.get(GCAuth.USERS_KEY)) || [];
  }

  async function updateUserCrew(userId, newQuota) {
    // Try Server API first
    try {
      const result = await GCApi.adminUpdateCrew(userId, 'set', newQuota);
      if (result.success) return { success: true, newQuota: result.user.crewQuota };
    } catch {}
    // localStorage fallback
    const users = await getAllUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return { error: 'Utilisateur introuvable.' };
    users[idx].crewQuota = Math.max(0, newQuota);
    await GCStorage.set(GCAuth.USERS_KEY, users);
    return { success: true, newQuota: users[idx].crewQuota };
  }

  async function addCrewToUser(userId, amount) {
    // Try Server API first
    try {
      const result = await GCApi.adminUpdateCrew(userId, 'add', amount);
      if (result.success) return { success: true, newQuota: result.user.crewQuota };
    } catch {}
    // localStorage fallback
    const users = await getAllUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return { error: 'Utilisateur introuvable.' };
    users[idx].crewQuota = (users[idx].crewQuota || 2) + amount;
    await GCStorage.set(GCAuth.USERS_KEY, users);
    return { success: true, newQuota: users[idx].crewQuota };
  }

  async function banUser(userId, banned) {
    // Try Server API first
    try {
      const result = await GCApi.adminBanUser(userId, banned);
      if (result.success) return { success: true };
    } catch {}
    // localStorage fallback
    const users = await getAllUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return { error: 'Utilisateur introuvable.' };
    users[idx].banned = banned;
    users[idx].bannedAt = banned ? new Date().toISOString() : null;
    if (banned) users[idx].forceLogout = true;
    await GCStorage.set(GCAuth.USERS_KEY, users);
    return { success: true };
  }

  async function deleteUser(userId) {
    // Try Server API first
    try {
      const result = await GCApi.adminDeleteUser(userId);
      if (result.success) return { success: true };
    } catch {}
    // localStorage fallback
    await GCAuth.deleteAccount(userId);
    return { success: true };
  }

  // ── Bulk Crew Operations ──────────────────────────────
  /**
   * Reset all users' weekly crew: searchesUsed = 0, new quotaResetDay = next Monday
   * Returns count of users reset
   */
  async function resetAllCrew() {
    // Try Server API first
    try {
      const result = await GCApi.adminResetAllCrew();
      if (result.success) return { success: true, resetCount: result.count };
    } catch {}
    // localStorage fallback
    const users = await getAllUsers();
    const now = new Date();
    let resetCount = 0;
    const getNextMonday = () => {
      const d = new Date();
      const day = d.getDay();
      const diff = day === 0 ? 1 : 8 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    };
    users.forEach(u => {
      if (!u.banned) {
        u.searchesUsed = 0;
        u.quotaResetDay = getNextMonday();
        resetCount++;
      }
    });
    await GCStorage.set(GCAuth.USERS_KEY, users);
    return { success: true, resetCount };
  }

  /**
   * Apply the global defaultCrewQuota from site_settings to all (non-banned) users.
   * Returns count of users updated.
   */
  async function applyDefaultCrewToAll() {
    // Try Server API first
    try {
      const result = await GCApi.adminApplyDefaultCrew();
      if (result.success) return { success: true, updatedCount: result.count, defaultCrew: result.quota };
    } catch {}
    // localStorage fallback
    const settings = await getSiteSettings();
    const defaultCrew = settings.defaultCrewQuota ?? 2;
    const users = await getAllUsers();
    let updatedCount = 0;
    users.forEach(u => {
      if (!u.banned) {
        u.crewQuota = defaultCrew;
        updatedCount++;
      }
    });
    await GCStorage.set(GCAuth.USERS_KEY, users);
    return { success: true, updatedCount, defaultCrew };
  }

  // ── Promo Codes ───────────────────────────────────────
  async function getPromoCodes() {
    // Try Server API first
    try {
      const result = await GCApi.adminGetPromos();
      if (result.success) return result.promos;
    } catch {}
    // localStorage fallback
    return (await GCStorage.get(GCAuth.PROMO_KEY)) || {};
  }

  async function getPromoStats() {
    try {
      const result = await GCApi.adminGetPromos();
      if (result.success) return result.stats || {};
    } catch {}
    return {};
  }

  async function addPromoCode(code, searches, label) {
    // Try Server API first
    try {
      const result = await GCApi.adminCreatePromo(code, searches, label);
      if (result.success) return { success: true };
    } catch {}
    // localStorage fallback
    const codes = await getPromoCodes();
    codes[code.toUpperCase()] = { searches: parseInt(searches) || 1, active: true, label: label || '' };
    await GCStorage.set(GCAuth.PROMO_KEY, codes);
    return { success: true };
  }

  async function togglePromoCode(code, active) {
    // Try Server API first
    try {
      const result = await GCApi.adminTogglePromo(code, active);
      if (result.success) return { success: true };
    } catch {}
    // localStorage fallback
    const codes = await getPromoCodes();
    if (!codes[code]) return { error: 'Code introuvable.' };
    codes[code].active = active;
    await GCStorage.set(GCAuth.PROMO_KEY, codes);
    return { success: true };
  }

  async function deletePromoCode(code) {
    // Try Server API first
    try {
      const result = await GCApi.adminDeletePromo(code);
      if (result.success) return { success: true };
    } catch {}
    // localStorage fallback
    const codes = await getPromoCodes();
    delete codes[code];
    await GCStorage.set(GCAuth.PROMO_KEY, codes);
    return { success: true };
  }

  // ── API Keys ──────────────────────────────────────────
  async function getApiKeys() { return (await GCStorage.get(API_KEYS_KEY)) || []; }

  async function requestApiKey(userId, description) {
    const keys = await getApiKeys();
    const entry = {
      id: 'ak_' + Date.now(),
      userId,
      key: 'gc_live_' + GCAuth.generateToken().slice(0, 32),
      description: description || '',
      status: 'pending',
      requestedAt: new Date().toISOString(),
      approvedAt: null,
    };
    keys.push(entry);
    await GCStorage.set(API_KEYS_KEY, keys);
    return { success: true, entry };
  }

  async function approveApiKey(keyId) {
    const keys = await getApiKeys();
    const idx = keys.findIndex(k => k.id === keyId);
    if (idx < 0) return { error: 'Clé introuvable.' };
    keys[idx].status = 'approved';
    keys[idx].approvedAt = new Date().toISOString();
    await GCStorage.set(API_KEYS_KEY, keys);
    return { success: true, key: keys[idx] };
  }

  async function revokeApiKey(keyId) {
    const keys = await getApiKeys();
    const idx = keys.findIndex(k => k.id === keyId);
    if (idx < 0) return { error: 'Clé introuvable.' };
    keys[idx].status = 'revoked';
    keys[idx].revokedAt = new Date().toISOString();
    await GCStorage.set(API_KEYS_KEY, keys);
    return { success: true };
  }

  // ── Announcements ─────────────────────────────────────
  async function getAnnouncements() {
    // Try Server API first
    try {
      const result = await GCApi.req('GET', '/api/admin/announcements');
      if (result.success) return result.announcements;
    } catch {}
    // localStorage fallback
    return (await GCStorage.get(ANNOUNCEMENTS_KEY)) || [];
  }

  async function sendAnnouncement(title, message, color) {
    // Try Server API first (saves announcement + notifies ALL users server-side)
    try {
      const result = await GCApi.req('POST', '/api/admin/announcements', { title, message, color });
      if (result.success) {
        // Also create server-side notifications for all users
        await GCApi.req('POST', '/api/admin/notify-all', {
          type: 'admin_announce',
          message: `${title}: ${message}`,
          color: color || 'green',
        });
        return { success: true };
      }
    } catch {}
    // localStorage fallback
    const announcements = await getAnnouncements();
    announcements.unshift({ id: 'ann_' + Date.now(), title, message, color: color || 'green', sentAt: new Date().toISOString() });
    await GCStorage.set(ANNOUNCEMENTS_KEY, announcements.slice(0, 100));
    return { success: true };
  }

  async function deleteAnnouncement(annId) {
    // Try Server API first
    try {
      const result = await GCApi.req('DELETE', `/api/admin/announcements/${annId}`);
      if (result.success) return { success: true };
    } catch {}
    // localStorage fallback
    const announcements = await getAnnouncements();
    const filtered = announcements.filter(a => a.id !== annId);
    if (filtered.length === announcements.length) return { error: 'Annonce introuvable.' };
    await GCStorage.set(ANNOUNCEMENTS_KEY, filtered);
    return { success: true };
  }

  // ── Site Settings ─────────────────────────────────────
  async function getSiteSettings() {
    // Try Server API first
    try {
      const result = await GCApi.adminGetSettings();
      if (result.success) return result.settings;
    } catch {}
    // localStorage fallback
    return (await GCStorage.get(SITE_SETTINGS_KEY)) || { maintenanceMode: false, maintenanceMessage: 'Site en maintenance.', defaultCrewQuota: 2, whatsappLink: 'https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T' };
  }

  async function updateSiteSettings(updates) {
    // Try Server API first
    try {
      const result = await GCApi.adminUpdateSettings(updates);
      if (result.success) return { success: true };
    } catch {}
    // localStorage fallback
    const settings = await getSiteSettings();
    Object.assign(settings, updates);
    await GCStorage.set(SITE_SETTINGS_KEY, settings);
    return { success: true };
  }

  // ── Centralized API Key Management ──────────────────
  async function setSourceApiKey(sourceId, apiKey) {
    const settings = await getSiteSettings();
    if (!settings.apiKeys) settings.apiKeys = {};
    settings.apiKeys[sourceId] = apiKey || '';
    await GCStorage.set(SITE_SETTINGS_KEY, settings);
    return { success: true };
  }

  async function getSourceApiKey(sourceId) {
    const settings = await getSiteSettings();
    return (settings.apiKeys || {})[sourceId] || '';
  }

  async function setSourceEnabled(sourceId, enabled) {
    const settings = await getSiteSettings();
    if (!settings.sourceStates) settings.sourceStates = {};
    settings.sourceStates[sourceId] = !!enabled;
    await GCStorage.set(SITE_SETTINGS_KEY, settings);
    return { success: true };
  }

  async function getSourceEnabled(sourceId) {
    const settings = await getSiteSettings();
    const states = settings.sourceStates || {};
    // If admin hasn't set a state, return undefined (use engine default)
    return states[sourceId] !== undefined ? states[sourceId] : null;
  }

  async function getAllApiKeys() {
    const settings = await getSiteSettings();
    return settings.apiKeys || {};
  }

  async function getAllSourceStates() {
    const settings = await getSiteSettings();
    return settings.sourceStates || {};
  }

  // ── Stats ─────────────────────────────────────────────
  async function getAdminStats() {
    // Try Server API first
    try {
      const result = await GCApi.adminGetStats();
      if (result.success) return result.stats;
    } catch {}
    // localStorage fallback
    const users = await getAllUsers();
    const history = (await GCStorage.get(GCAuth.HISTORY_KEY)) || [];
    const promoUsed = (await GCStorage.get(GCAuth.PROMO_USED_KEY)) || {};
    const apiKeys = await getApiKeys();
    const now = new Date();
    // Crew stats
    const totalCrewDistributed = users.reduce((sum, u) => sum + (u.crewQuota ?? 2), 0);
    const totalCrewUsed = users.reduce((sum, u) => sum + (u.searchesUsed || 0), 0);
    const avgCrewPerUser = users.length > 0 ? Math.round(totalCrewDistributed / users.length) : 0;
    const usersNeedingReset = users.filter(u => {
      const rd = u.quotaResetDay ? new Date(u.quotaResetDay) : null;
      return rd && now >= rd;
    }).length;

    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.lastLogin && (now - new Date(u.lastLogin)) < 604800000).length,
      bannedUsers: users.filter(u => u.banned).length,
      totalSearches: history.length,
      searchesToday: history.filter(h => new Date(h.date).toDateString() === now.toDateString()).length,
      searchesWeek: history.filter(h => new Date(h.date) >= new Date(now - 604800000)).length,
      searchesMonth: history.filter(h => new Date(h.date) >= new Date(now.getFullYear(), now.getMonth(), 1)).length,
      promoCodesUsed: Object.values(promoUsed).flat().length,
      apiKeysTotal: apiKeys.length,
      apiKeysPending: apiKeys.filter(k => k.status === 'pending').length,
      apiKeysApproved: apiKeys.filter(k => k.status === 'approved').length,
      totalCrewDistributed,
      totalCrewUsed,
      avgCrewPerUser,
      usersNeedingReset,
    };
  }

  return {
    init, login, logout, checkSession, changePassword,
    getAllUsers, updateUserCrew, addCrewToUser, banUser, deleteUser,
    resetAllCrew, applyDefaultCrewToAll,
    getPromoCodes, addPromoCode, togglePromoCode, deletePromoCode,
    getPromoStats, getApiKeys, requestApiKey, approveApiKey, revokeApiKey,
    getAnnouncements, sendAnnouncement, deleteAnnouncement,
    getSiteSettings, updateSiteSettings, getAdminStats, getBruteForceRecords: () => GCBruteForce.getAllRecords(), clearBruteForceLockout: (id) => GCBruteForce.clearLockout(id), formatLockoutTime: (ms) => GCBruteForce.formatLockoutTime(ms),
    getServerLockouts: async () => {
      try { const r = await GCApi.adminGetLockouts(); if (r.success) return r.records; } catch {}
      return {};
    },
    clearServerLockout: async (identifier) => {
      try { await GCApi.adminClearLockout(identifier); } catch {}
      await GCBruteForce.clearLockout(identifier);
    },
    setSourceApiKey, getSourceApiKey, setSourceEnabled, getSourceEnabled, getAllApiKeys, getAllSourceStates,
    ADMIN_SESSION_KEY, API_KEYS_KEY, ANNOUNCEMENTS_KEY, SITE_SETTINGS_KEY,
  };
})();

window.GCAdmin = Admin;
