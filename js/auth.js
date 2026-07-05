// Gold_Crew — Authentication & User Management
// SHA-256 password hashing with per-user salt, persistent auto-login, force-logout on ban
const Auth = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  const USERS_KEY = 'gc_users';
  const SESSION_KEY = 'gc_session';
  const HISTORY_KEY = 'gc_history';
  const FAV_KEY = 'gc_favorites';
  const NOTIF_KEY = 'gc_notifications';
  const PROMO_KEY = 'gc_promo_codes';
  const PROMO_USED_KEY = 'gc_promo_used';
  const QUOTA_KEY = 'gc_quota';
  const FORCE_LOGOUT_KEY = 'gc_force_logout';
  const DEFAULT_CREW = 2;

  // ── SHA-256 Password Hashing ─────────────────────────
  // Legacy DJB2 hash for migration check
  function legacyHashPassword(pw) {
    let hash = 0;
    for (let i = 0; i < pw.length; i++) {
      const ch = pw.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36) + '_' + pw.length;
  }

  // SHA-256 with per-user salt
  async function hashPasswordSHA256(pw, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + pw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'sha256_' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function generateSalt() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  }

  // Wrapper: uses SHA-256 with salt if user has salt, otherwise legacy for migration
  async function verifyPassword(password, storedHash, salt) {
    if (salt && storedHash.startsWith('sha256_')) {
      const computed = await hashPasswordSHA256(password, salt);
      return computed === storedHash;
    }
    // Legacy fallback
    return legacyHashPassword(password) === storedHash;
  }

  function generateToken() {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  }

  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'GC-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  // ── Fingerprint & IP Tracking ─────────────────────────
  async function collectFingerprint() {
    const fp = await GCFingerprint.generate();
    const ip = await GCFingerprint.getIP();
    const device = GCFingerprint.getDeviceInfo();
    return { fingerprint: fp, ip, device };
  }

  async function checkDuplicate(fingerprint, ip, email, username) {
    const users = await getUsers();
    const byFingerprint = users.find(u => u.fingerprint === fingerprint);
    if (byFingerprint) {
      return {
        blocked: true,
        reason: 'device',
        message: 'Un compte a déjà été créé depuis cet appareil. Multi-comptes interdits.',
        existingUser: byFingerprint.username,
      };
    }
    const byIP = users.find(u => u.registerIP === ip && ip !== 'unknown');
    if (byIP) {
      return {
        blocked: true,
        reason: 'ip',
        message: 'Un compte a déjà été créé depuis cette adresse réseau. Multi-comptes interdits.',
        existingUser: byIP.username,
      };
    }
    return { blocked: false };
  }

  async function getUsers() { return (await GCStorage.get(USERS_KEY)) || []; }
  async function saveUsers(users) { await GCStorage.set(USERS_KEY, users); }

  function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
  function validatePassword(pw) { return pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw); }

  async function register(data) {
    const { email, username, password, firstName, lastName, phone, country } = data;
    if (!validateEmail(email)) return { error: 'Email invalide.' };
    if (!username || username.length < 3) return { error: "Nom d'utilisateur trop court (3 min)." };
    if (!validatePassword(password)) return { error: t('auth.password_requirements') };
    const users = await getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return { error: 'Cet email est déjà utilisé.' };
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) return { error: "Ce nom d'utilisateur est déjà pris." };

    let fpData = { fingerprint: 'unavailable', ip: 'unknown', device: {} };
    try {
      fpData = await collectFingerprint();
    } catch (e) {
      console.warn('Fingerprint collection failed:', e);
    }

    const dupCheck = await checkDuplicate(fpData.fingerprint, fpData.ip, email, username);
    if (dupCheck.blocked) {
      return { error: dupCheck.message, duplicate: true, reason: dupCheck.reason };
    }

    // Try Server API first
    try {
      const result = await GCApi.register({
        email, username, password, firstName, lastName, phone, country,
        fingerprint: fpData.fingerprint, deviceInfo: fpData.device,
      });
      GCApi.storeUserToken(result.token);
      const u = result.user;
      GCState.set({
        user: u, isAuthenticated: true,
        searchUsed: u.searchesUsed || 0, crewQuota: u.crewQuota || 2,
        searchHistory: [], favorites: [], notifications: [], isAdmin: false,
      });
      return { success: true, user: u };
    } catch (e) {
      if (!e.offline) console.warn('API register failed, using localStorage fallback:', e);
    }

    // localStorage fallback
    const salt = generateSalt();
    const hashedPw = await hashPasswordSHA256(password, salt);

    // Use admin-configured default crew quota if available
    let crewQuota = DEFAULT_CREW;
    try {
      const settings = await GCStorage.get('gc_site_settings');
      if (settings?.defaultCrewQuota != null) crewQuota = settings.defaultCrewQuota;
    } catch {}

    const user = {
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      email: email.toLowerCase(),
      username,
      password: hashedPw,
      salt,
      passwordVersion: 'sha256',
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      country: country || '',
      avatar: '',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      verified: true,
      searchesUsed: 0,
      crewQuota,
      quotaResetDay: getNextMonday(),
      twoFactor: false,
      banned: false,
      bannedAt: null,
      forceLogout: false,
      fingerprint: fpData.fingerprint,
      registerIP: fpData.ip,
      deviceInfo: fpData.device,
      loginHistory: [],
    };
    users.push(user);
    await saveUsers(users);
    return { success: true, user: sanitize(user) };
  }

  async function login(email, password) {
    const bfKey = 'user_login:' + (email || '').toLowerCase();
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

    // Try Server API first
    try {
      const result = await GCApi.login({ email, password });
      GCApi.storeUserToken(result.token);
      const u = result.user;
      try { await GCBruteForce.reset(bfKey); } catch {}
      const session = { userId: u.id, token: generateToken(), createdAt: Date.now() };
      await GCStorage.setSession(SESSION_KEY, session);
      await loadUserData(u);
      return { success: true, user: u };
    } catch (e) {
      if (e.status === 429) {
        return { error: e.error || 'Trop de tentatives.', lockedOut: true, remainingMs: e.remainingMs || 600000 };
      }
      if (e.banned) return { error: 'Votre compte a été suspendu. Contactez l\'administrateur.' };
      if (e.status === 401) return { error: e.error || 'Email ou mot de passe incorrect.' };
      if (!e.offline) console.warn('API login failed, using localStorage fallback:', e);
    }

    // localStorage fallback
    const users = await getUsers();
    const user = users.find(u => u.email === email.toLowerCase());
    if (!user) {
      try { await GCBruteForce.recordFailure(bfKey); } catch {}
      return { error: 'Email ou mot de passe incorrect.' };
    }

    const valid = await verifyPassword(password, user.password, user.salt);
    if (!valid) {
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
      return { error: 'Email ou mot de passe incorrect.' };
    }

    if (user.banned) return { error: 'Votre compte a été suspendu. Contactez l\'administrateur.' };

    // Successful — reset brute force + migrate password if legacy
    try { await GCBruteForce.reset(bfKey); } catch {}

    // Auto-migrate legacy DJB2 password to SHA-256 on successful login
    if (!user.salt || user.passwordVersion !== 'sha256') {
      const salt = generateSalt();
      user.password = await hashPasswordSHA256(password, salt);
      user.salt = salt;
      user.passwordVersion = 'sha256';
    }

    user.lastLogin = new Date().toISOString();
    user.forceLogout = false;

    try {
      const ip = await GCFingerprint.getIP();
      const device = GCFingerprint.getDeviceInfo();
      if (!user.loginHistory) user.loginHistory = [];
      user.loginHistory.push({
        ip: ip || 'unknown',
        device,
        date: new Date().toISOString(),
      });
      user.loginHistory = user.loginHistory.slice(-20);
    } catch {}

    await saveUsers(users);

    if (user.twoFactor && user.twoFactorSecret) {
      return {
        twoFactorRequired: true,
        userId: user.id,
        user: sanitize(user),
      };
    }

    const session = { userId: user.id, token: generateToken(), createdAt: Date.now() };
    await GCStorage.setSession(SESSION_KEY, session);
    await loadUserData(user);
    return { success: true, user: sanitize(user) };
  }

  async function login2FAComplete(userId) {
    const users = await getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return { error: 'Utilisateur introuvable.' };
    if (user.banned) return { error: 'Compte suspendu.' };
    user.lastLogin = new Date().toISOString();
    user.forceLogout = false;
    await saveUsers(users);
    const session = { userId: user.id, token: generateToken(), createdAt: Date.now() };
    await GCStorage.setSession(SESSION_KEY, session);
    await loadUserData(user);
    return { success: true, user: sanitize(user) };
  }

  async function logout() {
    GCApi.clearUserToken();
    await GCStorage.removeSession(SESSION_KEY);
    GCState.set({ user: null, isAuthenticated: false, view: 'landing' });
  }

  async function checkSession() {
    // Try Server API first
    if (GCApi.getUserToken()) {
      try {
        const result = await GCApi.me();
        if (result.success && result.user) {
          await loadUserData(result.user);
          return true;
        }
      } catch (e) {
        GCApi.clearUserToken();
      }
    }
    // localStorage fallback
    const session = await GCStorage.getSession(SESSION_KEY);
    if (!session) return false;
    // 30-day expiry for persistent sessions
    if (Date.now() - session.createdAt > 30 * 24 * 60 * 60 * 1000) {
      await GCStorage.removeSession(SESSION_KEY);
      return false;
    }
    const users = await getUsers();
    const user = users.find(u => u.id === session.userId);
    if (!user) { await GCStorage.removeSession(SESSION_KEY); return false; }
    // Check if admin forced logout or user banned since login
    if (user.banned || user.forceLogout) {
      await GCStorage.removeSession(SESSION_KEY);
      return false;
    }
    await loadUserData(user);
    return true;
  }

  async function loadUserData(user) {
    let history = [];
    let favorites = [];

    // Try server API for history and favorites
    if (GCApi.getUserToken()) {
      try {
        const histResult = await GCApi.getHistory();
        if (histResult.success) history = histResult.history;
      } catch {}
      try {
        const favResult = await GCApi.getFavorites();
        if (favResult.success) favorites = favResult.favorites;
      } catch {}
    }
    // Fallback to localStorage for anything missing
    if (!history.length) history = (await GCStorage.get(HISTORY_KEY)) || [];
    if (!favorites.length) favorites = (await GCStorage.get(FAV_KEY)) || [];

    // Load notifications from server first, then localStorage
    let notifications = [];
    if (GCApi.getUserToken()) {
      try {
        const notifResult = await GCApi.req('GET', '/api/auth/notifications');
        if (notifResult.success) notifications = notifResult.notifications;
      } catch {}
    }
    if (!notifications.length) notifications = (await GCStorage.get(NOTIF_KEY)) || [];

    // Load announcements from server
    let serverAnnouncements = [];
    if (GCApi.getUserToken()) {
      try {
        const annResult = await GCApi.req('GET', '/api/auth/announcements');
        if (annResult.success) serverAnnouncements = annResult.announcements;
      } catch {}
    }

    let searchUsed = user.searchesUsed || 0;
    const now = new Date();
    const resetDay = user.quotaResetDay ? new Date(user.quotaResetDay) : null;
    if (resetDay && now >= resetDay) {
      searchUsed = 0;
      user.searchesUsed = 0;
      user.quotaResetDay = getNextMonday();
      const users = await getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx >= 0) { users[idx] = user; await saveUsers(users); }
    }
    GCState.set({
      user: sanitize(user),
      isAuthenticated: true,
      searchUsed,
      crewQuota: user.crewQuota ?? DEFAULT_CREW,
      searchHistory: history.filter(h => h.userId === user.id),
      favorites: favorites.filter(f => f.userId === user.id),
      notifications: notifications.filter(n => n.userId === user.id),
      isAdmin: false,
    });
  }

  async function reloadUserData() {
    const user = GCState.getUser();
    if (!user) return;
    // Re-check user still exists and not force-logged-out
    const users = await getUsers();
    const fresh = users.find(u => u.id === user.id);
    if (!fresh || fresh.banned || fresh.forceLogout) {
      await GCStorage.removeSession(SESSION_KEY);
      GCState.set({ user: null, isAuthenticated: false, view: 'landing' });
      GCRouter.navigate('landing');
      return;
    }
    const history = (await GCStorage.get(HISTORY_KEY)) || [];
    const favorites = (await GCStorage.get(FAV_KEY)) || [];
    let serverHistory = null, serverFavorites = null;
    if (GCApi.getUserToken()) {
      try { const r = await GCApi.getHistory(); if (r.success) serverHistory = r.history; } catch {}
      try { const r = await GCApi.getFavorites(); if (r.success) serverFavorites = r.favorites; } catch {}
    }
    const notifications = (await GCStorage.get(NOTIF_KEY)) || [];
    GCState.set({
      user: sanitize(fresh),
      crewQuota: fresh.crewQuota ?? DEFAULT_CREW,
      searchUsed: fresh.searchesUsed || 0,
      searchHistory: serverHistory || history.filter(h => h.userId === fresh.id),
      favorites: serverFavorites || favorites.filter(f => f.userId === fresh.id),
      notifications: notifications.filter(n => n.userId === fresh.id),
    });
  }

  async function getUserHistory() {
    const user = GCState.getUser();
    if (!user) return [];
    if (GCApi.getUserToken()) {
      try { const r = await GCApi.getHistory(); if (r.success) return r.history; } catch {}
    }
    const history = (await GCStorage.get(HISTORY_KEY)) || [];
    return history.filter(h => h.userId === user.id);
  }

  async function getUserFavorites() {
    const user = GCState.getUser();
    if (!user) return [];
    if (GCApi.getUserToken()) {
      try { const r = await GCApi.getFavorites(); if (r.success) return r.favorites; } catch {}
    }
    const favorites = (await GCStorage.get(FAV_KEY)) || [];
    return favorites.filter(f => f.userId === user.id);
  }

  async function getUserNotifications() {
    const user = GCState.getUser();
    if (!user) return [];
    const notifications = (await GCStorage.get(NOTIF_KEY)) || [];
    return notifications.filter(n => n.userId === user.id);
  }

  async function updateProfile(userId, updates) {
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return { error: 'Utilisateur introuvable.' };
    const allowed = ['firstName', 'lastName', 'phone', 'country', 'avatar'];
    allowed.forEach(k => { if (updates[k] !== undefined) users[idx][k] = updates[k]; });
    await saveUsers(users);
    await loadUserData(users[idx]);
    return { success: true };
  }

  async function changePassword(userId, currentPw, newPw) {
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return { error: 'Utilisateur introuvable.' };
    const user = users[idx];
    const valid = await verifyPassword(currentPw, user.password, user.salt);
    if (!valid) return { error: 'Mot de passe actuel incorrect.' };
    if (!validatePassword(newPw)) return { error: t('auth.password_requirements') };
    const salt = generateSalt();
    users[idx].password = await hashPasswordSHA256(newPw, salt);
    users[idx].salt = salt;
    users[idx].passwordVersion = 'sha256';
    await saveUsers(users);
    return { success: true };
  }

  async function adminResetPassword(userId, newPw) {
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return { error: 'Utilisateur introuvable.' };
    if (!validatePassword(newPw)) return { error: t('auth.password_requirements') };
    const salt = generateSalt();
    users[idx].password = await hashPasswordSHA256(newPw, salt);
    users[idx].salt = salt;
    users[idx].passwordVersion = 'sha256';
    users[idx].forceLogout = true;
    await saveUsers(users);
    return { success: true };
  }

  async function deleteAccount(userId) {
    let users = await getUsers();
    users = users.filter(u => u.id !== userId);
    await saveUsers(users);
    let history = (await GCStorage.get(HISTORY_KEY)) || [];
    history = history.filter(h => h.userId !== userId);
    await GCStorage.set(HISTORY_KEY, history);
    let favs = (await GCStorage.get(FAV_KEY)) || [];
    favs = favs.filter(f => f.userId !== userId);
    await GCStorage.set(FAV_KEY, favs);
    await logout();
  }

  // ── 2FA (TOTP) ───────────────────────────────────────
  async function enable2FA(userId) {
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return { error: 'Utilisateur introuvable.' };
    if (users[idx].twoFactor) return { error: 'La 2FA est déjà activée.' };
    const secret = GCTOTP.generateSecret();
    users[idx].twoFactorSecret = secret;
    users[idx].twoFactorPending = true;
    await saveUsers(users);
    return { success: true, secret, url: GCTOTP.getOtpauthUrl(secret, users[idx].email) };
  }

  async function confirm2FA(userId, code) {
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return { error: 'Utilisateur introuvable.' };
    if (!users[idx].twoFactorSecret) return { error: 'Aucun secret 2FA configuré.' };
    const valid = await GCTOTP.verify(users[idx].twoFactorSecret, code);
    if (!valid) return { error: 'Code invalide. Vérifiez votre application.' };
    users[idx].twoFactor = true;
    users[idx].twoFactorPending = false;
    await saveUsers(users);
    return { success: true };
  }

  async function disable2FA(userId, code) {
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return { error: 'Utilisateur introuvable.' };
    if (!users[idx].twoFactor) return { error: 'La 2FA n\'est pas activée.' };
    const valid = await GCTOTP.verify(users[idx].twoFactorSecret, code);
    if (!valid) return { error: 'Code invalide.' };
    users[idx].twoFactor = false;
    users[idx].twoFactorSecret = null;
    users[idx].twoFactorPending = false;
    await saveUsers(users);
    return { success: true };
  }

  async function verifyLogin2FA(userId, code) {
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0 || !users[idx].twoFactor || !users[idx].twoFactorSecret) return false;
    return await GCTOTP.verify(users[idx].twoFactorSecret, code);
  }

  async function recordSearch(userId) {
    // Try Server API first
    if (GCApi.getUserToken()) {
      try {
        const result = await GCApi.useCredit();
        GCState.set({ searchUsed: result.searchesUsed });
        return;
      } catch {}
    }
    // localStorage fallback
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      users[idx].searchesUsed = (users[idx].searchesUsed || 0) + 1;
      await saveUsers(users);
    }
    GCState.set({ searchUsed: GCState.get().searchUsed + 1 });
  }

  async function addHistory(entry) {
    // Try Server API first
    if (GCApi.getUserToken()) {
      try {
        const result = await GCApi.addHistory(entry);
        if (result.success) {
          GCState.set({ searchHistory: [result.entry, ...GCState.get().searchHistory].slice(0, 500) });
          return;
        }
      } catch {}
    }
    // localStorage fallback
    const history = (await GCStorage.get(HISTORY_KEY)) || [];
    entry.id = 'h_' + Date.now();
    entry.userId = GCState.get().user?.id;
    entry.date = new Date().toISOString();
    history.unshift(entry);
    await GCStorage.set(HISTORY_KEY, history.slice(0, 500));
    GCState.set({ searchHistory: [entry, ...GCState.get().searchHistory].slice(0, 500) });
  }

  async function deleteHistory(id) {
    // Try Server API first
    if (GCApi.getUserToken()) {
      try {
        await GCApi.deleteHistory(id);
        GCState.set({ searchHistory: GCState.get().searchHistory.filter(h => h.id !== id) });
        return;
      } catch {}
    }
    // localStorage fallback
    let history = (await GCStorage.get(HISTORY_KEY)) || [];
    history = history.filter(h => h.id !== id);
    await GCStorage.set(HISTORY_KEY, history);
    GCState.set({ searchHistory: GCState.get().searchHistory.filter(h => h.id !== id) });
  }

  async function toggleFavorite(entry) {
    // Try Server API first
    if (GCApi.getUserToken()) {
      try {
        const result = await GCApi.toggleFavorite(entry);
        if (result.success) {
          const favs = await GCApi.getFavorites();
          if (favs.success) GCState.set({ favorites: favs.favorites.filter(f => f.userId === GCState.get().user?.id) });
          return result.added;
        }
      } catch {}
    }
    // localStorage fallback
    const favs = (await GCStorage.get(FAV_KEY)) || [];
    const userId = GCState.get().user?.id;
    const existing = favs.findIndex(f => f.userId === userId && f.query === entry.query);
    if (existing >= 0) {
      favs.splice(existing, 1);
    } else {
      favs.push({ ...entry, userId, id: 'f_' + Date.now(), addedAt: new Date().toISOString() });
    }
    await GCStorage.set(FAV_KEY, favs);
    GCState.set({ favorites: favs.filter(f => f.userId === userId) });
    return existing < 0;
  }

  async function addNotification(type, message) {
    const notifs = (await GCStorage.get(NOTIF_KEY)) || [];
    const userId = GCState.get().user?.id;
    const n = { id: 'n_' + Date.now(), userId, type, message, read: false, date: new Date().toISOString() };
    notifs.unshift(n);
    await GCStorage.set(NOTIF_KEY, notifs.slice(0, 200));
    GCState.set({ notifications: [n, ...GCState.get().notifications].slice(0, 200) });
  }

  async function markNotificationsRead() {
    const notifs = (await GCStorage.get(NOTIF_KEY)) || [];
    const userId = GCState.get().user?.id;
    notifs.forEach(n => { if (n.userId === userId) n.read = true; });
    await GCStorage.set(NOTIF_KEY, notifs);
    GCState.set({ notifications: GCState.get().notifications.map(n => ({ ...n, read: true })) });
  }

  async function applyPromoCode(code) {
    // Try Server API first
    if (GCApi.getUserToken()) {
      try {
        const result = await GCApi.applyPromo(code.trim().toUpperCase());
        if (result.success) {
          GCState.set({ crewQuota: result.newCrewQuota });
          await addNotification('promo_used', `Code promo ${code.trim().toUpperCase()} activé : +${result.added} Crew`);
          return { success: true, added: result.added, label: result.label };
        }
      } catch (e) {
        if (e.status === 409) return { error: 'Ce code a déjà été utilisé.' };
        if (e.status === 404) return { error: t('promo.invalid') };
        if (!e.offline) console.warn('API promo apply failed, using localStorage fallback:', e);
      }
    }

    // localStorage fallback
    const promoCodes = (await GCStorage.get(PROMO_KEY)) || {
      'GC-WELCOME4': { searches: 4, active: true, label: 'Bonus WhatsApp' }
    };
    await GCStorage.set(PROMO_KEY, promoCodes);
    const usedCodes = (await GCStorage.get(PROMO_USED_KEY)) || {};
    const userId = GCState.get().user?.id;
    const upperCode = code.trim().toUpperCase();
    const promo = promoCodes[upperCode];
    if (!promo || !promo.active) return { error: t('promo.invalid') };
    if (usedCodes[userId]?.includes(upperCode)) return { error: 'Ce code a déjà été utilisé.' };
    if (!usedCodes[userId]) usedCodes[userId] = [];
    usedCodes[userId].push(upperCode);
    await GCStorage.set(PROMO_USED_KEY, usedCodes);
    const state = GCState.get();
    const newCrew = (state.crewQuota || DEFAULT_CREW) + promo.searches;
    GCState.set({ crewQuota: newCrew });
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) { users[idx].crewQuota = newCrew; await saveUsers(users); }
    await addNotification('promo_used', `Code promo ${upperCode} activé : +${promo.searches} Crew`);
    return { success: true, added: promo.searches, label: promo.label };
  }

  async function initDefaultPromo() {
    const codes = await GCStorage.get(PROMO_KEY);
    if (!codes) {
      await GCStorage.set(PROMO_KEY, {
        'GC-WELCOME4': { searches: 4, active: true, label: 'Bonus WhatsApp' }
      });
    }
  }

  function sanitize(user) {
    const { password, salt, ...safe } = user;
    return safe;
  }

  function getNextMonday() {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  // ── Fingerprint Admin Records ─────────────────────────
  async function getFingerprintRecords() {
    const users = await getUsers();
    return users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      fingerprint: u.fingerprint || 'unavailable',
      registerIP: u.registerIP || 'unknown',
      deviceInfo: u.deviceInfo || {},
      loginHistory: u.loginHistory || [],
      createdAt: u.createdAt,
      banned: u.banned || false,
    }));
  }

  async function getDuplicateAccounts() {
    const users = await getUsers();
    const fpGroups = {};
    users.forEach(u => {
      const fp = u.fingerprint || 'unavailable';
      if (!fpGroups[fp]) fpGroups[fp] = [];
      fpGroups[fp].push(u);
    });
    const ipGroups = {};
    users.forEach(u => {
      const ip = u.registerIP || 'unknown';
      if (ip === 'unknown') return;
      if (!ipGroups[ip]) ipGroups[ip] = [];
      ipGroups[ip].push(u);
    });
    return {
      byFingerprint: Object.entries(fpGroups)
        .filter(([, g]) => g.length > 1)
        .map(([fp, g]) => ({ fingerprint: fp, users: g.map(u => u.username) })),
      byIP: Object.entries(ipGroups)
        .filter(([, g]) => g.length > 1)
        .map(([ip, g]) => ({ ip, users: g.map(u => u.username) })),
    };
  }

  return {
    register, login, logout, checkSession, updateProfile, changePassword,
    deleteAccount, recordSearch, addHistory, deleteHistory, toggleFavorite,
    addNotification, markNotificationsRead, applyPromoCode, initDefaultPromo,
    validateEmail, validatePassword, legacyHashPassword, hashPasswordSHA256, generateToken, generateCode,
    enable2FA, confirm2FA, disable2FA, verifyLogin2FA, login2FAComplete, getUsers,
    reloadUserData, getUserHistory, getUserFavorites, getUserNotifications,
    getFingerprintRecords, getDuplicateAccounts, adminResetPassword,
    USERS_KEY, SESSION_KEY, HISTORY_KEY, FAV_KEY, NOTIF_KEY, PROMO_KEY, PROMO_USED_KEY,
    DEFAULT_CREW, FORCE_LOGOUT_KEY,
  };
})();

window.GCAuth = Auth;
