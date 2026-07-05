// Gold_Crew OSINT — Backend API Server
// Express + Supabase (with JSON file fallback for local dev)
// In-memory cache for performance (1000+ concurrent users)
// Stores all users server-side so admin can see everyone

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ══════════════════════════════════════════
// SUPABASE DATABASE ADAPTER
// Falls back to local JSON files if SUPABASE_URL is not set
// ══════════════════════════════════════════
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const useSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

const _cache = {};
let _dbReady = false;

// ── Supabase REST helpers (no npm dependency — uses Node 18+ native fetch) ──
async function supabaseUpsert(key, data) {
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/data_store`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify([{ key, value: data, updated_at: new Date().toISOString() }]),
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      console.error('[GC] Supabase upsert error:', key, resp.status, txt.slice(0, 200));
    }
  } catch (err) {
    console.error('[GC] Supabase upsert network error:', key, err.message);
  }
}

async function supabaseLoadAll() {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/data_store?select=key,value`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  if (!resp.ok) throw new Error(`Supabase load failed: ${resp.status} ${resp.statusText}`);
  const rows = await resp.json();
  for (const row of rows) {
    _cache[row.key] = row.value;
  }
  return rows.length;
}

// ── Init: load all data into memory on startup ──
async function initDatabase() {
  if (useSupabase) {
    console.log('[GC] Connecting to Supabase...');
    try {
      const count = await supabaseLoadAll();
      console.log(`[GC] ✓ Loaded ${count} data table(s) from Supabase`);
      _dbReady = true;
    } catch (err) {
      console.error('[GC] ✗ Supabase connection failed:', err.message);
      console.log('[GC] Falling back to local JSON files');
      _loadLocalJSON();
    }
  } else {
    console.log('[GC] Using local JSON file storage (no SUPABASE_URL set)');
    _loadLocalJSON();
  }
}

function _loadLocalJSON() {
  try {
    if (fs.existsSync(DATA_DIR)) {
      for (const f of fs.readdirSync(DATA_DIR)) {
        if (f.endsWith('.json')) {
          try { _cache[f] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); } catch {}
        }
      }
      console.log(`[GC] Loaded ${Object.keys(_cache).length} local JSON files into cache`);
    }
  } catch {}
  _dbReady = true;
}

// ── Sync read: always reads from in-memory cache ──
function readJSON(file) {
  if (!_cache[file]) {
    if (!useSupabase) {
      // JSON fallback: read from disk on cache miss
      try {
        const fp = path.join(DATA_DIR, file);
        _cache[file] = fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, 'utf8')) : {};
      } catch { _cache[file] = {}; }
    } else {
      _cache[file] = {};
    }
  }
  return _cache[file];
}

// ── Async write: update cache immediately, persist in background ──
function writeJSON(file, data) {
  _cache[file] = data;
  if (useSupabase && _dbReady) {
    // Non-blocking write to Supabase
    supabaseUpsert(file, data);
  } else {
    // JSON file fallback: atomic write (tmp + rename)
    const fp = path.join(DATA_DIR, file);
    const tmp = fp + '.tmp';
    fs.writeFile(tmp, JSON.stringify(data, null, 2), (err) => {
      if (err) { console.error('[GC] Write error:', file, err.message); return; }
      fs.rename(tmp, fp, (err) => {
        if (err) console.error('[GC] Rename error:', file, err.message);
      });
    });
  }
}

// Invalidate cache for a file (force re-read on next access)
function invalidateCache(file) {
  delete _cache[file];
}

// ══════════════════════════════════════════
// RATE LIMITING (per-IP, per-minute)
// ══════════════════════════════════════════
const _rateLimits = {};
function rateLimit(ip, maxPerMinute) {
  const now = Date.now();
  const key = ip + ':' + Math.floor(now / 60000);
  if (!_rateLimits[key]) _rateLimits[key] = 0;
  _rateLimits[key]++;
  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    for (const k of Object.keys(_rateLimits)) {
      if (parseInt(k.split(':')[1]) < Math.floor(now / 60000) - 2) delete _rateLimits[k];
    }
  }
  return _rateLimits[key] <= maxPerMinute;
}

// ── Middleware ──
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname, {
  maxAge: '1h',
  setHeaders(res, fp) { if (fp.endsWith('.html')) res.set('Cache-Control', 'no-cache'); }
}));
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
  next();
});

// ── Lightweight ping endpoint for cronjob.com keep-alive ──
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ── Server-side Brute Force Protection ──
const loginAttempts = {};
const MAX_ATTEMPTS = 6;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 min

function checkBruteForce(identifier) {
  const rec = loginAttempts[identifier];
  if (!rec) return { allowed: true, remainingMs: 0 };
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) return { allowed: false, remainingMs: rec.lockedUntil - Date.now() };
  if (rec.lockedUntil && Date.now() >= rec.lockedUntil) { delete loginAttempts[identifier]; return { allowed: true, remainingMs: 0 }; }
  return { allowed: true, remainingMs: 0 };
}
function recordAttempt(identifier, success) {
  if (success) { delete loginAttempts[identifier]; return; }
  if (!loginAttempts[identifier]) loginAttempts[identifier] = { failures: 0, lockedUntil: null };
  loginAttempts[identifier].failures++;
  if (loginAttempts[identifier].failures >= MAX_ATTEMPTS) loginAttempts[identifier].lockedUntil = Date.now() + LOCKOUT_MS;
}
function formatMs(ms) {
  const m = Math.ceil(ms / 60000);
  return m < 60 ? `${m} minute${m > 1 ? 's' : ''}` : `${Math.floor(m / 60)}h${(m % 60).toString().padStart(2, '0')}`;
}

// ── Data helpers ──
function uid() { return crypto.randomBytes(8).toString('hex'); }
function tok() { return crypto.randomBytes(32).toString('hex'); }
// Hash format matches frontend GCAuth.hashPasswordSHA256: 'sha256_' + hex
function sha256(pw, salt) { return 'sha256_' + crypto.createHash('sha256').update(salt + pw).digest('hex'); }
function getNextMonday() {
  const d = new Date(); const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? 1 : 8 - day));
  d.setHours(0, 0, 0, 0); return d.toISOString();
}
function sanitize(u) {
  if (!u) return null;
  const { passwordHash, passwordSalt, totpSecret, ...s } = u;
  return s;
}

// ── XSS Prevention ──
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

// ── User Auth Guard (for proxy routes) ──
function userGuard(req, res, next) {
  const result = getUserFromReq(req);
  if (!result || result.error) return res.status(401).json({ error: 'Authentification requise' });
  req.user = result.user;
  next();
}

// ── SSRF Protection ──
const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '10.0.0.0', '192.168.0.0', '172.16.0.0', 'metadata.google.internal', '169.254.169.254']);
function isSafeUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    const host = u.hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(host)) return false;
    if (host.endsWith('.local') || host.endsWith('.internal')) return false;
    if (/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(host)) return false;
    if (host === 'localhost' || host === '[::1]') return false;
    return true;
  } catch { return false; }
}

// ── Registration Rate Limit (per IP) ──
const registerLimits = {};
function checkRegisterLimit(ip) {
  const now = Date.now();
  const window = 3600000; // 1 hour
  if (!registerLimits[ip]) registerLimits[ip] = [];
  registerLimits[ip] = registerLimits[ip].filter(t => now - t < window);
  if (registerLimits[ip].length >= 3) return false; // max 3 registrations per hour per IP
  registerLimits[ip].push(now);
  return true;
}
// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const ip of Object.keys(registerLimits)) {
    registerLimits[ip] = registerLimits[ip].filter(t => now - t < 3600000);
    if (registerLimits[ip].length === 0) delete registerLimits[ip];
  }
}, 300000);

// ── Session helpers ──
function getUserFromReq(req) {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  if (!t) return null;
  const sessions = readJSON('sessions.json');
  const s = sessions[t];
  if (!s || Date.now() > s.expiresAt) return null;
  const users = readJSON('users.json');
  const u = users[s.userId];
  if (!u) return null;
  if (u.banned) return { error: 'banned', banReason: u.banReason };
  if (u.forceLogout && u.forceLogout > s.createdAt) return { error: 'forceLogout' };
  return { user: u, session: s, token: t };
}
function getAdminFromReq(req) {
  const t = req.headers['x-admin-token'] || '';
  if (!t) return null;
  const sessions = readJSON('admin_sessions.json');
  const s = sessions[t];
  if (!s || Date.now() > s.expiresAt) return null;
  return true;
}
function adminGuard(req, res, next) {
  if (!getAdminFromReq(req)) return res.status(403).json({ error: 'Accès admin requis' });
  next();
}

// ══════════════════════════════════════════
// AUTH ROUTES
// ══════════════════════════════════════════

app.post('/api/auth/register', (req, res) => {
  const { email, password, username, firstName, lastName, phone, country, fingerprint, deviceInfo } = req.body;
  // Registration rate limit: max 3 per hour per IP
  const regIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!checkRegisterLimit(regIp)) {
    return res.status(429).json({ error: 'Trop de créations de compte. Réessayez dans 1 heure.' });
  }
  if (!email || !password || !username) return res.status(400).json({ error: 'Champs requis manquants' });
  if (password.length < 8) return res.status(400).json({ error: 'Mot de passe trop court (8 min).' });

  const users = readJSON('users.json');
  if (Object.values(users).find(u => u.email === email.toLowerCase())) return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
  if (Object.values(users).find(u => u.username.toLowerCase() === username.toLowerCase())) return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris." });

  const id = 'u_' + uid();
  const salt = crypto.randomBytes(16).toString('hex');
  const settings = readJSON('settings.json');

  users[id] = {
    id, email: email.toLowerCase(), username,
    firstName: firstName || '', lastName: lastName || '',
    phone: phone || '', country: country || '',
    passwordHash: sha256(password, salt), passwordSalt: salt,
    crewQuota: settings.defaultCrewQuota || 2,
    searchesUsed: 0, quotaResetDay: getNextMonday(),
    createdAt: new Date().toISOString(), lastLogin: null,
    banned: false, banReason: '', forceLogout: null,
    avatar: null, totpEnabled: false, totpSecret: null,
    fingerprint: fingerprint || 'unavailable',
    registerIP: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
    deviceInfo: deviceInfo || {},
    loginHistory: [],
  };
  writeJSON('users.json', users);

  const token = tok();
  const sessions = readJSON('sessions.json');
  sessions[token] = { userId: id, createdAt: Date.now(), expiresAt: Date.now() + 30 * 86400000 };
  writeJSON('sessions.json', sessions);

  res.json({ success: true, token, user: sanitize(users[id]) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Champs requis manquants' });

  // Server-side brute force check
  const bfId = 'login:' + email.toLowerCase();
  const bf = checkBruteForce(bfId);
  if (!bf.allowed) {
    return res.status(429).json({ error: `Trop de tentatives. Réessayez dans ${formatMs(bf.remainingMs)}.`, lockedOut: true, remainingMs: bf.remainingMs });
  }

  const users = readJSON('users.json');
  const user = Object.values(users).find(u => u.email === email.toLowerCase());
  if (!user) { recordAttempt(bfId, false); return res.status(401).json({ error: 'Email ou mot de passe incorrect.' }); }
  if (user.banned) return res.status(403).json({ error: 'Votre compte a été suspendu.', banned: true });

  const hash = sha256(password, user.passwordSalt || '');
  if (hash !== user.passwordHash) { recordAttempt(bfId, false); return res.status(401).json({ error: 'Email ou mot de passe incorrect.' }); }

  // Success — clear brute force
  recordAttempt(bfId, true);
  // Weekly reset
  if (new Date() >= new Date(user.quotaResetDay)) {
    user.searchesUsed = 0; user.quotaResetDay = getNextMonday();
  }
  user.lastLogin = new Date().toISOString();
  // Track login IP
  if (!user.loginHistory) user.loginHistory = [];
  user.loginHistory.push({
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
    date: new Date().toISOString(),
  });
  user.loginHistory = user.loginHistory.slice(-20);
  users[user.id] = user;
  writeJSON('users.json', users);

  const token = tok();
  const sessions = readJSON('sessions.json');
  sessions[token] = { userId: user.id, createdAt: Date.now(), expiresAt: Date.now() + 30 * 86400000 };
  writeJSON('sessions.json', sessions);

  res.json({ success: true, token, user: sanitize(user) });
});

app.get('/api/auth/me', (req, res) => {
  const result = getUserFromReq(req);
  if (!result) return res.status(401).json({ error: 'Non autorisé' });
  if (result.error === 'banned') return res.status(403).json({ error: 'Compte banni', banned: true });
  if (result.error === 'forceLogout') return res.status(401).json({ error: 'Session invalide', forceLogout: true });

  const { user } = result;
  if (new Date() >= new Date(user.quotaResetDay)) {
    user.searchesUsed = 0; user.quotaResetDay = getNextMonday();
    const users = readJSON('users.json'); users[user.id] = user; writeJSON('users.json', users);
  }
  res.json({ success: true, user: sanitize(user) });
});

app.put('/api/auth/profile', (req, res) => {
  const result = getUserFromReq(req);
  if (!result || result.error) return res.status(401).json({ error: 'Non autorisé' });
  const users = readJSON('users.json');
  const user = users[result.user.id];
  ['firstName', 'lastName', 'phone', 'country', 'avatar'].forEach(k => { if (req.body[k] !== undefined) user[k] = req.body[k]; });
  writeJSON('users.json', users);
  res.json({ success: true, user: sanitize(user) });
});

app.post('/api/auth/change-password', (req, res) => {
  const result = getUserFromReq(req);
  if (!result || result.error) return res.status(401).json({ error: 'Non autorisé' });
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Champs requis manquants' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Mot de passe trop court (8 min).' });

  const users = readJSON('users.json');
  const user = users[result.user.id];
  if (sha256(currentPassword, user.passwordSalt || '') !== user.passwordHash) return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });

  const salt = crypto.randomBytes(16).toString('hex');
  user.passwordHash = sha256(newPassword, salt); user.passwordSalt = salt;
  writeJSON('users.json', users);
  res.json({ success: true });
});

app.post('/api/auth/use-credit', (req, res) => {
  const result = getUserFromReq(req);
  if (!result || result.error) return res.status(401).json({ error: 'Non autorisé' });
  const users = readJSON('users.json');
  const user = users[result.user.id];
  const currentUsed = user.searchesUsed || 0;
  const quota = user.crewQuota || 2;

  // FIX: Server-side crew quota enforcement
  if (currentUsed >= quota) {
    return res.status(403).json({ error: 'Crew épuisés. Attendez la réinitialisation hebdomadaire ou utilisez un code promo.', searchesUsed: currentUsed, crewQuota: quota, crewExhausted: true });
  }

  user.searchesUsed = currentUsed + 1;
  writeJSON('users.json', users);
  res.json({ success: true, searchesUsed: user.searchesUsed, crewQuota: quota });
});

// ── History API ──
app.get('/api/auth/history', (req, res) => {
  const result = getUserFromReq(req);
  if (!result || result.error) return res.status(401).json({ error: 'Non autorisé' });
  const history = readJSON('history.json');
  const userId = result.user.id;
  const userHistory = Object.values(history).filter(h => h.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 500);
  res.json({ success: true, history: userHistory });
});

app.post('/api/auth/history', (req, res) => {
  const result = getUserFromReq(req);
  if (!result || result.error) return res.status(401).json({ error: 'Non autorisé' });
  const history = readJSON('history.json');
  const entry = req.body;
  const id = 'h_' + uid();
  entry.id = id;
  entry.userId = result.user.id;
  entry.date = new Date().toISOString();
  history[id] = entry;
  writeJSON('history.json', history);
  res.json({ success: true, entry });
});

app.delete('/api/auth/history/:id', (req, res) => {
  const result = getUserFromReq(req);
  if (!result || result.error) return res.status(401).json({ error: 'Non autorisé' });
  const history = readJSON('history.json');
  const entry = history[req.params.id];
  if (!entry || entry.userId !== result.user.id) return res.status(404).json({ error: 'Introuvable' });
  delete history[req.params.id];
  writeJSON('history.json', history);
  res.json({ success: true });
});

// ── Favorites API ──
app.get('/api/auth/favorites', (req, res) => {
  const result = getUserFromReq(req);
  if (!result || result.error) return res.status(401).json({ error: 'Non autorisé' });
  const favs = readJSON('favorites.json');
  const userFavs = Object.values(favs).filter(f => f.userId === result.user.id);
  res.json({ success: true, favorites: userFavs });
});

app.post('/api/auth/favorites/toggle', (req, res) => {
  const result = getUserFromReq(req);
  if (!result || result.error) return res.status(401).json({ error: 'Non autorisé' });
  const favs = readJSON('favorites.json');
  const userId = result.user.id;
  const existing = Object.values(favs).find(f => f.userId === userId && f.query === req.body.query);
  if (existing) { delete favs[existing.id]; writeJSON('favorites.json', favs); return res.json({ success: true, added: false }); }
  const id = 'f_' + uid();
  const entry = { ...req.body, id, userId, addedAt: new Date().toISOString() };
  favs[id] = entry;
  writeJSON('favorites.json', favs);
  res.json({ success: true, added: true, entry });
});

// ══════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const settings = readJSON('settings.json');
  const adminSalt = settings.adminPasswordSalt || 'gc_admin_v1';
  const adminUser = settings.adminUsername || 'balla';

  // Admin brute force
  const adminBfId = 'admin:' + (username || '').toLowerCase();
  const adminBf = checkBruteForce(adminBfId);
  if (!adminBf.allowed) {
    return res.status(429).json({ error: `Trop de tentatives. Réessayez dans ${formatMs(adminBf.remainingMs)}.`, lockedOut: true, remainingMs: adminBf.remainingMs });
  }

  let adminHash = settings.adminPasswordHash;
  if (!adminHash) adminHash = sha256('620891542', adminSalt);

  if (username === adminUser && sha256(password, adminSalt) === adminHash) {
    const token = tok();
    const sessions = readJSON('admin_sessions.json');
    sessions[token] = { createdAt: Date.now(), expiresAt: Date.now() + 24 * 3600000 };
    writeJSON('admin_sessions.json', sessions);
    recordAttempt(adminBfId, true);
    return res.json({ success: true, token });
  }
  recordAttempt(adminBfId, false);
  res.status(401).json({ error: 'Identifiants admin incorrects.' });
});

app.post('/api/admin/change-password', adminGuard, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Champs requis' });
  const settings = readJSON('settings.json');
  const adminSalt = settings.adminPasswordSalt || 'gc_admin_v1';
  let adminHash = settings.adminPasswordHash || sha256('620891542', adminSalt);
  if (sha256(currentPassword, adminSalt) !== adminHash) return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
  settings.adminPasswordHash = sha256(newPassword, adminSalt);
  settings.adminPasswordSalt = adminSalt;
  settings.adminUsername = settings.adminUsername || 'balla';
  writeJSON('settings.json', settings);
  res.json({ success: true });
});

// Admin get users — supports pagination & search for 1000+ users
app.get('/api/admin/users', adminGuard, (req, res) => {
  const allUsers = Object.values(readJSON('users.json')).map(sanitize);
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(10, parseInt(req.query.limit) || 50));
  const q = (req.query.q || '').toLowerCase().trim();
  let filtered = allUsers;
  if (q) {
    filtered = allUsers.filter(u =>
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.firstName || '').toLowerCase().includes(q) ||
      (u.lastName || '').toLowerCase().includes(q) ||
      (u.registerIP || '').includes(q) ||
      (u.id || '').includes(q)
    );
  }
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const users = filtered.slice(start, start + limit);
  res.json({ success: true, users, total, page, limit, totalPages });
});

app.get('/api/admin/stats', adminGuard, (req, res) => {
  const users = Object.values(readJSON('users.json'));
  const now = Date.now(); const day = 86400000;
  const settings = readJSON('settings.json');
  const historyData = readJSON('history.json');
  const allHistory = Object.values(historyData);
  const promoUsed = readJSON('promo_used.json');
  const allPromoUsed = Object.values(promoUsed).flat();
  res.json({
    success: true,
    stats: {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.lastLogin && now - new Date(u.lastLogin).getTime() < 7 * day).length,
      bannedUsers: users.filter(u => u.banned).length,
      totalSearches: users.reduce((s, u) => s + (u.searchesUsed || 0), 0),
      searchesToday: allHistory.filter(h => new Date(h.date).toDateString() === new Date().toDateString()).length,
      searchesWeek: allHistory.filter(h => now - new Date(h.date).getTime() < 7 * day).length,
      searchesMonth: allHistory.filter(h => new Date(h.date).getMonth() === new Date().getMonth()).length,
      promoCodesUsed: allPromoUsed.length,
      apiKeysTotal: 0, apiKeysPending: 0, apiKeysApproved: 0,
      totalCrewDistributed: users.reduce((s, u) => s + (u.crewQuota || 0), 0),
      totalCrewUsed: users.reduce((s, u) => s + (u.searchesUsed || 0), 0),
      avgCrewPerUser: users.length ? Math.round(users.reduce((s, u) => s + (u.crewQuota || 0), 0) / users.length) : 0,
      usersNeedingReset: users.filter(u => !u.banned && new Date(u.quotaResetDay) <= new Date()).length,
    },
    settings,
  });
});

app.post('/api/admin/users/:id/ban', adminGuard, (req, res) => {
  const users = readJSON('users.json'); const u = users[req.params.id];
  if (!u) return res.status(404).json({ error: 'Introuvable' });
  const desired = req.body.banned;
  u.banned = desired !== undefined ? !!desired : !u.banned;
  u.banReason = u.banned ? (req.body.reason || '') : '';
  if (u.banned) u.forceLogout = Date.now();
  writeJSON('users.json', users);
  res.json({ success: true, user: sanitize(u) });
});

app.post('/api/admin/users/:id/reset-password', adminGuard, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'Mot de passe requis' });
  const users = readJSON('users.json'); const u = users[req.params.id];
  if (!u) return res.status(404).json({ error: 'Introuvable' });
  const salt = crypto.randomBytes(16).toString('hex');
  u.passwordHash = sha256(newPassword, salt); u.passwordSalt = salt; u.forceLogout = Date.now();
  writeJSON('users.json', users);
  res.json({ success: true });
});

app.post('/api/admin/users/:id/crew', adminGuard, (req, res) => {
  const { action, value } = req.body;
  const users = readJSON('users.json'); const u = users[req.params.id];
  if (!u) return res.status(404).json({ error: 'Introuvable' });
  if (action === 'add') u.crewQuota = (u.crewQuota || 0) + (value || 0);
  else if (action === 'set') u.crewQuota = value || 0;
  writeJSON('users.json', users);
  res.json({ success: true, user: sanitize(u) });
});

app.post('/api/admin/users/:id/force-logout', adminGuard, (req, res) => {
  const users = readJSON('users.json'); const u = users[req.params.id];
  if (!u) return res.status(404).json({ error: 'Introuvable' });
  u.forceLogout = Date.now();
  writeJSON('users.json', users);
  res.json({ success: true });
});

app.delete('/api/admin/users/:id', adminGuard, (req, res) => {
  const users = readJSON('users.json');
  if (!users[req.params.id]) return res.status(404).json({ error: 'Introuvable' });
  delete users[req.params.id]; writeJSON('users.json', users);
  res.json({ success: true });
});

app.post('/api/admin/reset-all-crew', adminGuard, (req, res) => {
  const users = readJSON('users.json'); let count = 0;
  Object.values(users).forEach(u => { if (!u.banned) { u.searchesUsed = 0; u.quotaResetDay = getNextMonday(); count++; } });
  writeJSON('users.json', users);
  res.json({ success: true, count });
});

app.post('/api/admin/apply-default-crew', adminGuard, (req, res) => {
  const settings = readJSON('settings.json'); const q = settings.defaultCrewQuota || 2;
  const users = readJSON('users.json'); let count = 0;
  Object.values(users).forEach(u => { if (!u.banned) { u.crewQuota = q; count++; } });
  writeJSON('users.json', users);
  res.json({ success: true, count, quota: q });
});

// ══════════════════════════════════════════
// PROMO CODE ROUTES
// ══════════════════════════════════════════

// Admin: get all promo codes with usage stats
app.get('/api/admin/promos', adminGuard, (req, res) => {
  const promos = readJSON('promos.json');
  const promoUsed = readJSON('promo_used.json');
  const stats = {};
  for (const [code] of Object.entries(promos)) {
    stats[code] = Object.values(promoUsed).filter(arr => arr.includes(code)).length;
  }
  res.json({ success: true, promos, stats });
});

// Admin: create a promo code
app.post('/api/admin/promos', adminGuard, (req, res) => {
  const { code, searches, label } = req.body;
  if (!code || !searches) return res.status(400).json({ error: 'Code et nombre de Crew requis.' });
  const promos = readJSON('promos.json');
  const upper = code.trim().toUpperCase();
  promos[upper] = { searches: parseInt(searches) || 1, active: true, label: label || '', createdAt: new Date().toISOString() };
  writeJSON('promos.json', promos);
  res.json({ success: true, code: upper, promo: promos[upper] });
});

// Admin: toggle promo active state
app.put('/api/admin/promos/:code', adminGuard, (req, res) => {
  const promos = readJSON('promos.json');
  const upper = req.params.code.toUpperCase();
  if (!promos[upper]) return res.status(404).json({ error: 'Code introuvable.' });
  promos[upper].active = req.body.active !== undefined ? !!req.body.active : !promos[upper].active;
  writeJSON('promos.json', promos);
  res.json({ success: true, promo: promos[upper] });
});

// Admin: delete a promo code
app.delete('/api/admin/promos/:code', adminGuard, (req, res) => {
  const promos = readJSON('promos.json');
  const upper = req.params.code.toUpperCase();
  if (!promos[upper]) return res.status(404).json({ error: 'Code introuvable.' });
  delete promos[upper];
  writeJSON('promos.json', promos);
  res.json({ success: true });
});

// User: apply a promo code
app.post('/api/auth/promo/apply', (req, res) => {
  const result = getUserFromReq(req);
  if (!result || result.error) return res.status(401).json({ error: 'Non autorisé' });
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code requis.' });

  const promos = readJSON('promos.json');
  const upper = code.trim().toUpperCase();
  const promo = promos[upper];
  if (!promo || !promo.active) return res.status(404).json({ error: 'Code promo invalide ou inactif.' });

  const promoUsed = readJSON('promo_used.json');
  const userId = result.user.id;
  if (!promoUsed[userId]) promoUsed[userId] = [];
  if (promoUsed[userId].includes(upper)) return res.status(409).json({ error: 'Ce code a déjà été utilisé.' });

  // Track usage
  promoUsed[userId].push(upper);
  writeJSON('promo_used.json', promoUsed);

  // Add crew to user
  const users = readJSON('users.json');
  const user = users[userId];
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  user.crewQuota = (user.crewQuota || 0) + promo.searches;
  writeJSON('users.json', users);

  res.json({ success: true, added: promo.searches, label: promo.label, newCrewQuota: user.crewQuota });
});

// User: get available promos (public list, no admin required)
app.get('/api/auth/promos', (req, res) => {
  const result = getUserFromReq(req);
  if (!result || result.error) return res.status(401).json({ error: 'Non autorisé' });
  const promos = readJSON('promos.json');
  const promoUsed = readJSON('promo_used.json');
  const userId = result.user.id;
  const usedList = promoUsed[userId] || [];
  // Return only active, not-yet-used codes
  const available = {};
  for (const [code, promo] of Object.entries(promos)) {
    if (promo.active && !usedList.includes(code)) {
      available[code] = { searches: promo.searches, label: promo.label };
    }
  }
  res.json({ success: true, available, used: usedList });
});

// ══════════════════════════════════════════
// SERVER-SIDE ANNOUNCEMENTS (admin broadcasts to ALL users)
// ══════════════════════════════════════════
app.get('/api/admin/announcements', adminGuard, (req, res) => {
  const announcements = readJSON('announcements.json');
  res.json({ success: true, announcements: Object.values(announcements).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt)) });
});

app.post('/api/admin/announcements', adminGuard, (req, res) => {
  const { title, message, color } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Title and message required' });
  const announcements = readJSON('announcements.json');
  const id = 'ann_' + uid();
  announcements[id] = { id, title, message, color: color || 'green', sentAt: new Date().toISOString() };
  writeJSON('announcements.json', announcements);
  res.json({ success: true, id, announcement: announcements[id] });
});

app.delete('/api/admin/announcements/:id', adminGuard, (req, res) => {
  const announcements = readJSON('announcements.json');
  if (!announcements[req.params.id]) return res.status(404).json({ error: 'Not found' });
  delete announcements[req.params.id];
  writeJSON('announcements.json', announcements);
  res.json({ success: true });
});

// User: get announcements (public read)
app.get('/api/auth/announcements', (req, res) => {
  const result = getUserFromReq(req);
  if (!result || result.error) return res.status(401).json({ error: 'Non autorisé' });
  const announcements = readJSON('announcements.json');
  const sorted = Object.values(announcements).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
  res.json({ success: true, announcements: sorted.slice(0, 50) });
});

// ══════════════════════════════════════════
// SERVER-SIDE NOTIFICATIONS (per-user)
// ══════════════════════════════════════════
app.get('/api/auth/notifications', (req, res) => {
  const result = getUserFromReq(req);
  if (!result || result.error) return res.status(401).json({ error: 'Non autorisé' });
  const notifications = readJSON('notifications.json');
  const userNotifs = Object.values(notifications)
    .filter(n => n.userId === result.user.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 100);
  res.json({ success: true, notifications: userNotifs });
});

app.post('/api/auth/notifications/read', (req, res) => {
  const result = getUserFromReq(req);
  if (!result || result.error) return res.status(401).json({ error: 'Non autorisé' });
  const notifications = readJSON('notifications.json');
  let count = 0;
  for (const n of Object.values(notifications)) {
    if (n.userId === result.user.id && !n.read) { n.read = true; count++; }
  }
  writeJSON('notifications.json', notifications);
  res.json({ success: true, markedRead: count });
});

// Admin: send notification to all users (creates entries server-side)
app.post('/api/admin/notify-all', adminGuard, (req, res) => {
  const { type, message, color } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  const users = Object.values(readJSON('users.json'));
  const notifications = readJSON('notifications.json');
  const now = new Date().toISOString();
  let count = 0;
  for (const u of users) {
    if (u.banned) continue;
    const id = 'n_' + uid();
    notifications[id] = { id, userId: u.id, type: type || 'admin_announce', message, color: color || 'green', read: false, date: now };
    count++;
  }
  writeJSON('notifications.json', notifications);
  res.json({ success: true, notifiedUsers: count });
});

// Public settings (for maintenance mode check)
app.get('/api/admin/settings', adminGuard, (req, res) => {
  res.json({ success: true, settings: readJSON('settings.json') });
});

app.put('/api/admin/settings', adminGuard, (req, res) => {
  const current = readJSON('settings.json');
  const updated = { ...current, ...req.body };
  // Sanitize maintenance message to prevent stored XSS
  if (updated.maintenanceMessage) {
    updated.maintenanceMessage = escapeHTML(updated.maintenanceMessage);
  }
  writeJSON('settings.json', updated);
  res.json({ success: true, settings: updated });
});

// ── Admin: Brute Force Management ──
app.get('/api/admin/lockouts', adminGuard, (req, res) => {
  const records = {};
  for (const [key, rec] of Object.entries(loginAttempts)) {
    if (rec.lockedUntil && Date.now() < rec.lockedUntil) {
      records[key] = { failures: rec.failures, lockedUntil: new Date(rec.lockedUntil).toISOString(), remainingMs: rec.lockedUntil - Date.now() };
    }
  }
  res.json({ success: true, records });
});

app.post('/api/admin/lockouts/clear', adminGuard, (req, res) => {
  const { identifier } = req.body;
  if (identifier) { delete loginAttempts[identifier]; }
  else { Object.keys(loginAttempts).forEach(k => delete loginAttempts[k]); }
  res.json({ success: true });
});

// ── Public settings (for maintenance mode check) ──
app.get('/api/public/settings', (req, res) => {
  const s = readJSON('settings.json');
  res.json({ maintenanceMode: s.maintenanceMode || false, maintenanceMessage: s.maintenanceMessage || '' });
});

// ── Public sources config (for all authenticated users) ──
// Returns centralized API keys and source enable/disable states
// WITHOUT exposing admin credentials. This is how all users get the admin's config.
app.get('/api/public/sources', userGuard, (req, res) => {
  const s = readJSON('settings.json');
  const apiKeys = s.apiKeys || {};
  const sourceStates = s.sourceStates || {};
  const mistralKey = s.mistralApiKey || '';
  res.json({
    success: true,
    apiKeys,
    sourceStates,
    mistralApiKey: mistralKey,
    customAiPrompt: s.customAiPrompt || '',
  });
});

// ══════════════════════════════════════════
// WHATSAPP OSINT PROXY ROUTES
// ══════════════════════════════════════════

// WhatsApp Phone Check — verify if a number has WhatsApp + generate links
app.get('/api/osint/whatsapp-check', userGuard, async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const cleaned = phone.replace(/[^0-9+]/g, '');
  const digitsOnly = cleaned.replace(/\+/g, '');

  const links = {
    waMe: `https://wa.me/${digitsOnly}`,
    webWhatsApp: `https://web.whatsapp.com/send?phone=${digitsOnly}`,
    apiWhatsApp: `https://api.whatsapp.com/send?phone=${digitsOnly}`,
  };

  // Country detection from phone prefix
  const countryMap = {
    '1': { country: 'United States / Canada', code: 'US/CA', flag: '🇺🇸' },
    '7': { country: 'Russia', code: 'RU', flag: '🇷🇺' },
    '20': { country: 'Egypt', code: 'EG', flag: '🇪🇬' },
    '27': { country: 'South Africa', code: 'ZA', flag: '🇿🇦' },
    '30': { country: 'Greece', code: 'GR', flag: '🇬🇷' },
    '31': { country: 'Netherlands', code: 'NL', flag: '🇳🇱' },
    '33': { country: 'France', code: 'FR', flag: '🇫🇷' },
    '34': { country: 'Spain', code: 'ES', flag: '🇪🇸' },
    '39': { country: 'Italy', code: 'IT', flag: '🇮🇹' },
    '44': { country: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    '49': { country: 'Germany', code: 'DE', flag: '🇩🇪' },
    '52': { country: 'Mexico', code: 'MX', flag: '🇲🇽' },
    '55': { country: 'Brazil', code: 'BR', flag: '🇧🇷' },
    '61': { country: 'Australia', code: 'AU', flag: '🇦🇺' },
    '62': { country: 'Indonesia', code: 'ID', flag: '🇮🇩' },
    '81': { country: 'Japan', code: 'JP', flag: '🇯🇵' },
    '82': { country: 'South Korea', code: 'KR', flag: '🇰🇷' },
    '86': { country: 'China', code: 'CN', flag: '🇨🇳' },
    '90': { country: 'Turkey', code: 'TR', flag: '🇹🇷' },
    '91': { country: 'India', code: 'IN', flag: '🇮🇳' },
    '92': { country: 'Pakistan', code: 'PK', flag: '🇵🇰' },
    '212': { country: 'Morocco', code: 'MA', flag: '🇲🇦' },
    '213': { country: 'Algeria', code: 'DZ', flag: '🇩🇿' },
    '216': { country: 'Tunisia', code: 'TN', flag: '🇹🇳' },
    '225': { country: "Côte d'Ivoire", code: 'CI', flag: '🇨🇮' },
    '226': { country: 'Burkina Faso', code: 'BF', flag: '🇧🇫' },
    '227': { country: 'Niger', code: 'NE', flag: '🇳🇪' },
    '228': { country: 'Togo', code: 'TG', flag: '🇹🇬' },
    '229': { country: 'Benin', code: 'BJ', flag: '🇧🇯' },
    '234': { country: 'Nigeria', code: 'NG', flag: '🇳🇬' },
    '237': { country: 'Cameroon', code: 'CM', flag: '🇨🇲' },
    '241': { country: 'Gabon', code: 'GA', flag: '🇬🇦' },
    '242': { country: 'Congo', code: 'CG', flag: '🇨🇬' },
    '243': { country: 'DR Congo', code: 'CD', flag: '🇨🇩' },
    '261': { country: 'Madagascar', code: 'MG', flag: '🇲🇬' },
    '509': { country: 'Haiti', code: 'HT', flag: '🇭🇹' },
  };

  let countryInfo = null;
  for (const len of [3, 2, 1]) {
    const prefix = digitsOnly.slice(0, len);
    if (countryMap[prefix]) { countryInfo = countryMap[prefix]; break; }
  }

  // Check wa.me redirect to detect WhatsApp presence
  let hasWhatsApp = null;
  try {
    const resp = await serverFetch(links.waMe, {
      method: 'HEAD',
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    }, 8000);
    const location = resp.headers?.get?.('location') || '';
    hasWhatsApp = resp.status === 302 || resp.status === 200 || location.includes('send');
  } catch {
    hasWhatsApp = null;
  }

  res.json({ success: true, phone: digitsOnly, formatted: cleaned, hasWhatsApp, country: countryInfo, links, whatsappLink: links.waMe });
});

// WhatsApp Group/Channel Search — find public WhatsApp groups and channels
app.get('/api/osint/whatsapp-groups', userGuard, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });

  const results = [];
  const seen = new Set();

  // Search for WhatsApp groups
  try {
    const resp = await serverFetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent('site:chat.whatsapp.com ' + q)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, 12000);
    const html = await resp.text();
    const linkRe = /href="(https?:\/\/chat\.whatsapp\.com\/[^"]+)"/gi;
    let m;
    while ((m = linkRe.exec(html)) !== null) {
      if (!seen.has(m[1])) { seen.add(m[1]); results.push({ url: m[1], source: 'DuckDuckGo', type: 'group' }); }
    }
  } catch {}

  // Search for WhatsApp channels
  try {
    const resp = await serverFetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent('site:whatsapp.com/channel ' + q)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, 12000);
    const html = await resp.text();
    const linkRe = /href="(https?:\/\/whatsapp\.com\/channel\/[^"]+)"/gi;
    let m;
    while ((m = linkRe.exec(html)) !== null) {
      if (!seen.has(m[1])) { seen.add(m[1]); results.push({ url: m[1], source: 'DuckDuckGo', type: 'channel' }); }
    }
  } catch {}

  // Also search for WhatsApp group directories
  try {
    const resp = await serverFetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent('whatsapp group join ' + q)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, 12000);
    const html = await resp.text();
    const titleRe = /<a[^>]*class="result__a"[^>]*>([^<]+)<\/a>/gi;
    const urlRe = /<a[^>]*class="result__url"[^>]*>([^<]+)<\/a>/gi;
    const titles = []; let tm;
    while ((tm = titleRe.exec(html)) !== null) titles.push(tm[1].trim());
    const urls = []; let um;
    while ((um = urlRe.exec(html)) !== null) urls.push(um[1].trim());
    for (let i = 0; i < Math.min(titles.length, 5); i++) {
      const link = urls[i] ? (urls[i].startsWith('http') ? urls[i] : 'https://' + urls[i]) : '';
      if (link && !seen.has(link) && (link.includes('whatsapp') || link.includes('wa.me') || link.includes('chat.'))) {
        seen.add(link);
        results.push({ url: link, title: titles[i], source: 'Web Search', type: 'directory' });
      }
    }
  } catch {}

  res.json({ success: true, query: q, results, total: results.length });
});

// (SPA fallback moved to end of file — after all API routes)

// ══════════════════════════════════════════
// OSINT PROXY ROUTES
// Server-side fetch for APIs that block browser CORS
// ══════════════════════════════════════════

async function serverFetch(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || 15000);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return resp;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// URLScan.io — free search (anonymous, rate limited)
app.get('/api/proxy/urlscan', userGuard, (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!rateLimit(ip + ':urlscan', 30)) return res.status(429).json({ error: 'Rate limit. Réessayez dans 1 minute.' });
  next();
}, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });
  try {
    const resp = await serverFetch(
      `https://urlscan.io/api/v1/search/?q=${encodeURIComponent(q)}&size=5`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'GoldCrewOSINT/1.0' } },
      15000
    );
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'URLScan proxy error: ' + err.message });
  }
});

// ip-api.com single lookup (CORS + mixed content proxy for http://ip-api.com)
app.get('/api/proxy/ip-api', userGuard, async (req, res) => {
  const { ip } = req.query;
  if (!ip) return res.status(400).json({ error: 'IP required' });
  try {
    const resp = await serverFetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query`,
      {}, 10000
    );
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'IP-API proxy error: ' + err.message });
  }
});

// ip-api.com batch endpoint (allows up to 100 per request)
app.post('/api/proxy/ip-api/batch', userGuard, async (req, res) => {
  const { ips } = req.body;
  if (!Array.isArray(ips) || ips.length === 0) return res.status(400).json({ error: 'IPs array required' });
  try {
    const resp = await serverFetch(
      'http://ip-api.com/batch?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ips.slice(0, 100)) },
      15000
    );
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'IP-API batch proxy error: ' + err.message });
  }
});

// NVD CVE Search — free, no key needed, but CORS blocked in browser
app.get('/api/proxy/nvd', userGuard, async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ error: 'keyword required' });
  try {
    const resp = await serverFetch(
      `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=5`,
      { headers: { 'Accept': 'application/json' } },
      20000
    );
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'NVD proxy error: ' + err.message });
  }
});

// Criminal IP — free tier (requires API key from criminalip.io)
app.get('/api/proxy/criminalip', userGuard, async (req, res) => {
  const { q, type } = req.query;
  const settings = readJSON('settings.json');
  const key = settings.apiKeys?.criminalip || '';
  if (!key) return res.status(400).json({ error: 'Criminal IP API key not configured' });
  if (!q) return res.status(400).json({ error: 'Query required' });
  try {
    const endpoint = type === 'ip'
      ? `https://api.criminalip.io/v1/ip/data?ip=${encodeURIComponent(q)}`
      : `https://api.criminalip.io/v1/banner/search?query=${encodeURIComponent(q)}&offset=0`;
    const resp = await serverFetch(endpoint, {
      headers: { 'x-api-key': key, 'Accept': 'application/json' }
    }, 15000);
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Criminal IP proxy error: ' + err.message });
  }
});

// Generic proxy for any OSINT API (used by frontend fetchSmart fallback)
app.get('/api/proxy/fetch', userGuard, async (req, res) => {
  const { url, key, header } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });
  const decodedUrl = decodeURIComponent(url);
  // SSRF protection — block internal/private IPs and localhost
  if (!isSafeUrl(decodedUrl)) return res.status(403).json({ error: 'URL non autorisée' });
  try {
    const headers = { 'Accept': 'application/json', 'User-Agent': 'GoldCrewOSINT/1.0' };
    if (key && header) headers[header] = key;
    const resp = await serverFetch(decodedUrl, { headers }, 15000);
    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('json')) {
      const data = await resp.json();
      res.json(data);
    } else {
      const text = await resp.text();
      try { res.json(JSON.parse(text)); } catch { res.json({ raw: text }); }
    }
  } catch (err) {
    res.status(502).json({ error: 'Proxy fetch error: ' + err.message });
  }
});

// ══════════════════════════════════════════
// PEOPLE DATABASE ROUTES
// ══════════════════════════════════════════

// Admin: import people data (JSON array)
app.post('/api/admin/people/import', adminGuard, (req, res) => {
  const { people } = req.body;
  if (!Array.isArray(people) || people.length === 0) return res.status(400).json({ error: 'Array of people required' });
  const db = readJSON('people.json');
  let imported = 0;
  for (const p of people) {
    const id = 'p_' + uid();
    db[id] = {
      id,
      nom: p.nom || p.name || p.Nom || '',
      telephone: p.telephone || p.phone || p.Telephone || '',
      email: p.email || p.Email || '',
      info: p.info || p.Info || p.information || '',
      exploits: p.exploits || p.Exploits || '',
      photo: p.photo || p.Photo || '',
      category: p.category || p.Category || p.categorie || '',
      tags: p.tags || [],
      importedAt: new Date().toISOString(),
    };
    imported++;
  }
  writeJSON('people.json', db);
  res.json({ success: true, imported, total: Object.keys(db).length });
});

// Admin: list all people
app.get('/api/admin/people', adminGuard, (req, res) => {
  const db = readJSON('people.json');
  res.json({ success: true, people: Object.values(db), total: Object.keys(db).length });
});

// Admin: delete a person
app.delete('/api/admin/people/:id', adminGuard, (req, res) => {
  const db = readJSON('people.json');
  if (!db[req.params.id]) return res.status(404).json({ error: 'Not found' });
  delete db[req.params.id];
  writeJSON('people.json', db);
  res.json({ success: true });
});

// Admin: delete all people
app.delete('/api/admin/people', adminGuard, (req, res) => {
  writeJSON('people.json', {});
  res.json({ success: true });
});

// User: search people database (also supports q=* for listing all)
app.get('/api/osint/people-search', userGuard, (req, res) => {
  const { q, type } = req.query;
  const db = readJSON('people.json');
  const all = Object.values(db);
  if (!q || q === '*') return res.json({ success: true, results: all.slice(0, 200), total: all.length });
  const query = q.toLowerCase();
  const searchType = type || 'all';
  const matches = all.filter(p => {
    if (searchType === 'phone') return (p.telephone || '').replace(/[^0-9+]/g, '').includes(query.replace(/[^0-9+]/g, ''));
    if (searchType === 'email') return (p.email || '').toLowerCase().includes(query);
    if (searchType === 'name' || searchType === 'fullname') return (p.nom || '').toLowerCase().includes(query);
    if (searchType === 'keyword') return (p.info || '').toLowerCase().includes(query) || (p.exploits || '').toLowerCase().includes(query);
    return (p.nom || '').toLowerCase().includes(query) ||
      (p.telephone || '').includes(query) ||
      (p.email || '').toLowerCase().includes(query) ||
      (p.info || '').toLowerCase().includes(query) ||
      (p.exploits || '').toLowerCase().includes(query) ||
      (p.category || '').toLowerCase().includes(query);
  });
  res.json({ success: true, results: matches, total: matches.length });
});

// ══════════════════════════════════════════
// IMAGE SEARCH PROXY (DuckDuckGo Images)
// ══════════════════════════════════════════

app.get('/api/proxy/image-search', userGuard, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });
  try {
    const tokenResp = await serverFetch(
      'https://duckduckgo.com/?q=' + encodeURIComponent(q) + '&iax=images&ia=images',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, 12000
    );
    const tokenHtml = await tokenResp.text();
    const vqdMatch = tokenHtml.match(/vqd="([^"]+)"/) || tokenHtml.match(/vqd=([^&"]+)/);
    const vqd = vqdMatch ? vqdMatch[1] : null;
    if (!vqd) return res.json({ success: true, images: [], query: q });
    const imgResp = await serverFetch(
      'https://duckduckgo.com/i.js?q=' + encodeURIComponent(q) + '&vqd=' + vqd + '&l=us-en&o=json',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, 12000
    );
    const imgData = await imgResp.json();
    const images = (imgData.results || []).slice(0, 30).map(img => ({
      title: img.title || '', thumbnail: img.thumbnail || img.image || '',
      image: img.image || '', url: img.url || '', source: img.source || '',
      width: img.width || 0, height: img.height || 0,
    }));
    res.json({ success: true, images, query: q, total: images.length });
  } catch (err) {
    res.status(502).json({ error: 'Image search error: ' + err.message });
  }
});

// ── SPA fallback (MUST be last route) ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start server (async: load DB first, then listen) ──
async function start() {
  await initDatabase();

  // Seed default promo code if not present
  const promos = readJSON('promos.json');
  if (!promos['GC-WELCOME4']) {
    writeJSON('promos.json', {
      'GC-WELCOME4': { searches: 4, active: true, label: 'Bonus WhatsApp', createdAt: new Date().toISOString() },
    });
    console.log('[GC] Seeded default promo code: GC-WELCOME4');
  }

  // Seed default settings if not present
  const settings = readJSON('settings.json');
  if (!settings.defaultCrewQuota) {
    settings.defaultCrewQuota = 2;
    settings.maintenanceMode = false;
    settings.maintenanceMessage = '';
    writeJSON('settings.json', settings);
    console.log('[GC] Seeded default settings');
  }

  app.listen(PORT, () => {
    const mode = useSupabase ? 'Supabase' : 'Local JSON';
    console.log(`[GC] Server running on http://localhost:${PORT} [${mode}]`);
  });
}

start().catch(err => {
  console.error('[GC] Fatal startup error:', err);
  process.exit(1);
});
