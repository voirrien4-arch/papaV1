// Gold_Crew — API Client (GCApi)
// Wrapper fetch centralisé pour toutes les routes de server.js
// Reconstruit le 06/07/2026 après corruption de l'index.html d'origine.
const Api = (() => {
  const USER_TOKEN_KEY = 'gc_user_token';
  const ADMIN_TOKEN_KEY = 'gc_admin_token';
  let _serverAvailable = null; // null = inconnu, true/false = testé

  // ── Token storage (localStorage) ──
  function getUserToken() {
    try { return localStorage.getItem(USER_TOKEN_KEY) || null; } catch { return null; }
  }
  function storeUserToken(token) {
    try { localStorage.setItem(USER_TOKEN_KEY, token); } catch {}
  }
  function clearUserToken() {
    try { localStorage.removeItem(USER_TOKEN_KEY); } catch {}
  }
  function getAdminToken() {
    try { return localStorage.getItem(ADMIN_TOKEN_KEY) || null; } catch { return null; }
  }
  function storeAdminToken(token) {
    try { localStorage.setItem(ADMIN_TOKEN_KEY, token); } catch {}
  }
  function clearAdminToken() {
    try { localStorage.removeItem(ADMIN_TOKEN_KEY); } catch {}
  }

  function isServerAvailable() {
    return _serverAvailable !== false;
  }

  // ── Core request helper ──
  // method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  // path: '/api/...'
  // body: object (optionnel)
  // opts.admin: true pour utiliser le token admin (x-admin-token) au lieu du token user (Bearer)
  async function req(method, path, body, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    // On attache toujours les deux tokens s'ils existent : certaines routes admin
    // sont appelées via req() directement (sans passer {admin:true}), et le serveur
    // ignore simplement le header qu'il n'utilise pas (userGuard ne lit que
    // Authorization, adminGuard ne lit que x-admin-token).
    const ut = getUserToken();
    if (ut) headers['Authorization'] = `Bearer ${ut}`;
    const at = getAdminToken();
    if (at) headers['x-admin-token'] = at;

    let resp;
    try {
      resp = await fetch(path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      _serverAvailable = true;
    } catch (err) {
      _serverAvailable = false;
      throw new Error('Serveur injoignable');
    }

    let data;
    try { data = await resp.json(); } catch { data = {}; }

    if (!resp.ok) {
      const err = new Error(data.error || `Erreur HTTP ${resp.status}`);
      err.status = resp.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // ══════════════════════════════════
  // AUTH (utilisateur)
  // ══════════════════════════════════
  async function register(payload) {
    return req('POST', '/api/auth/register', payload);
  }
  async function login(payload) {
    return req('POST', '/api/auth/login', payload);
  }
  async function me() {
    return req('GET', '/api/auth/me');
  }
  async function updateProfile(payload) {
    return req('PUT', '/api/auth/profile', payload);
  }
  async function changePassword(payload) {
    return req('POST', '/api/auth/change-password', payload);
  }
  async function useCredit() {
    return req('POST', '/api/auth/use-credit');
  }

  // ── Historique ──
  async function getHistory() {
    return req('GET', '/api/auth/history');
  }
  async function addHistory(entry) {
    return req('POST', '/api/auth/history', entry);
  }
  async function deleteHistory(id) {
    return req('DELETE', `/api/auth/history/${id}`);
  }

  // ── Favoris ──
  async function getFavorites() {
    return req('GET', '/api/auth/favorites');
  }
  async function toggleFavorite(entry) {
    return req('POST', '/api/auth/favorites/toggle', entry);
  }

  // ── Promo (utilisateur) ──
  async function applyPromo(code) {
    return req('POST', '/api/auth/promo/apply', { code });
  }
  async function getAvailablePromos() {
    return req('GET', '/api/auth/promos');
  }

  // ── Annonces / Notifications (utilisateur) ──
  async function getAnnouncements() {
    return req('GET', '/api/auth/announcements');
  }
  async function getNotifications() {
    return req('GET', '/api/auth/notifications');
  }
  async function markNotificationsRead() {
    return req('POST', '/api/auth/notifications/read');
  }

  // ── Réglages publics (mode maintenance, visible par tous) ──
  async function getPublicSettings() {
    return req('GET', '/api/public/settings');
  }
  async function adminLogin(payload) {
    return req('POST', '/api/admin/login', payload);
  }
  async function adminChangePassword(payload) {
    return req('POST', '/api/admin/change-password', payload, { admin: true });
  }
  async function adminGetUsers(page, limit, q) {
    const params = new URLSearchParams();
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    if (q) params.set('q', q);
    return req('GET', `/api/admin/users?${params.toString()}`, undefined, { admin: true });
  }
  async function adminGetStats() {
    return req('GET', '/api/admin/stats', undefined, { admin: true });
  }
  async function adminBanUser(userId, banned, reason) {
    return req('POST', `/api/admin/users/${userId}/ban`, { banned, reason }, { admin: true });
  }
  async function adminResetPassword(userId, newPassword) {
    return req('POST', `/api/admin/users/${userId}/reset-password`, { newPassword }, { admin: true });
  }
  async function adminUpdateCrew(userId, action, value) {
    return req('POST', `/api/admin/users/${userId}/crew`, { action, value }, { admin: true });
  }
  async function adminForceLogout(userId) {
    return req('POST', `/api/admin/users/${userId}/force-logout`, undefined, { admin: true });
  }
  async function adminDeleteUser(userId) {
    return req('DELETE', `/api/admin/users/${userId}`, undefined, { admin: true });
  }
  async function adminResetAllCrew() {
    return req('POST', '/api/admin/reset-all-crew', undefined, { admin: true });
  }
  async function adminApplyDefaultCrew() {
    return req('POST', '/api/admin/apply-default-crew', undefined, { admin: true });
  }

  // ── Promos (admin) ──
  async function adminGetPromos() {
    return req('GET', '/api/admin/promos', undefined, { admin: true });
  }
  async function adminCreatePromo(code, searches, label) {
    return req('POST', '/api/admin/promos', { code, searches, label }, { admin: true });
  }
  async function adminTogglePromo(code, active) {
    return req('PUT', `/api/admin/promos/${code}`, { active }, { admin: true });
  }
  async function adminDeletePromo(code) {
    return req('DELETE', `/api/admin/promos/${code}`, undefined, { admin: true });
  }

  // ── Settings (admin) ──
  async function adminGetSettings() {
    return req('GET', '/api/admin/settings', undefined, { admin: true });
  }
  async function adminUpdateSettings(updates) {
    return req('PUT', '/api/admin/settings', updates, { admin: true });
  }

  // ── Lockouts / brute-force (admin) ──
  async function adminGetLockouts() {
    return req('GET', '/api/admin/lockouts', undefined, { admin: true });
  }
  async function adminClearLockout(identifier) {
    return req('POST', '/api/admin/lockouts/clear', { identifier }, { admin: true });
  }

  // ── People (admin) ──
  async function adminImportPeople(payload) {
    return req('POST', '/api/admin/people/import', payload, { admin: true });
  }
  async function adminGetPeople() {
    return req('GET', '/api/admin/people', undefined, { admin: true });
  }
  async function adminDeletePerson(id) {
    return req('DELETE', `/api/admin/people/${id}`, undefined, { admin: true });
  }
  async function adminDeleteAllPeople() {
    return req('DELETE', '/api/admin/people', undefined, { admin: true });
  }

  return {
    req,
    getUserToken, storeUserToken, clearUserToken,
    getAdminToken, storeAdminToken, clearAdminToken,
    isServerAvailable, getPublicSettings,
    register, login, me, updateProfile, changePassword, useCredit,
    getHistory, addHistory, deleteHistory,
    getFavorites, toggleFavorite,
    applyPromo, getAvailablePromos,
    getAnnouncements, getNotifications, markNotificationsRead,
    adminLogin, adminChangePassword,
    adminGetUsers, adminGetStats,
    adminBanUser, adminResetPassword, adminUpdateCrew, adminForceLogout, adminDeleteUser,
    adminResetAllCrew, adminApplyDefaultCrew,
    adminGetPromos, adminCreatePromo, adminTogglePromo, adminDeletePromo,
    adminGetSettings, adminUpdateSettings,
    adminGetLockouts, adminClearLockout,
    adminImportPeople, adminGetPeople, adminDeletePerson, adminDeleteAllPeople,
  };
})();
window.GCApi = Api;
