// Gold_Crew — Brute Force Protection Module
// Rate limiting with progressive lockout per identifier
const BruteForce = (() => {
  const STORE_KEY = 'gc_bruteforce';

  // Progressive lockout tiers
  const TIERS = [
    { maxAttempts: 5,  lockoutMs: 5 * 60 * 1000 },   // 5 fails → 5 min lock
    { maxAttempts: 10, lockoutMs: 15 * 60 * 1000 },   // 10 fails → 15 min lock
    { maxAttempts: 15, lockoutMs: 30 * 60 * 1000 },   // 15 fails → 30 min lock
    { maxAttempts: 20, lockoutMs: 60 * 60 * 1000 },    // 20 fails → 1 hour lock
    { maxAttempts: Infinity, lockoutMs: 4 * 60 * 60 * 1000 }, // beyond → 4 hours
  ];

  const MAX_STORED_RECORDS = 200;

  async function getRecords() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  async function saveRecords(records) {
    try {
      // Prune old entries if too many
      const keys = Object.keys(records);
      if (keys.length > MAX_STORED_RECORDS) {
        // Remove oldest entries
        const sorted = keys
          .map(k => ({ key: k, lastAttempt: records[k].lastAttempt || 0 }))
          .sort((a, b) => a.lastAttempt - b.lastAttempt);
        const toRemove = sorted.slice(0, keys.length - MAX_STORED_RECORDS);
        toRemove.forEach(r => delete records[r.key]);
      }
      localStorage.setItem(STORE_KEY, JSON.stringify(records));
    } catch {}
  }

  function getTier(totalFailures) {
    for (const tier of TIERS) {
      if (totalFailures < tier.maxAttempts) return tier;
    }
    return TIERS[TIERS.length - 1];
  }

  /**
   * Check if an identifier (email, IP, admin-username) is currently allowed
   * to attempt a login. Returns { allowed, remainingMs, attemptsLeft, totalFailures, tierLockoutMs }
   */
  async function checkLimit(identifier) {
    const records = await getRecords();
    const record = records[identifier];

    if (!record) {
      return { allowed: true, remainingMs: 0, attemptsLeft: 5, totalFailures: 0, tierLockoutMs: 0 };
    }

    const now = Date.now();
    const totalFailures = record.failures || 0;
    const tier = getTier(totalFailures);
    const tierMaxAttempts = TIERS[0].maxAttempts; // first lockout threshold

    // If currently in a lockout period
    if (record.lockedUntil && now < record.lockedUntil) {
      return {
        allowed: false,
        remainingMs: record.lockedUntil - now,
        attemptsLeft: 0,
        totalFailures,
        tierLockoutMs: tier.lockoutMs,
      };
    }

    // If lockout expired, allow attempts but keep failure count
    const attemptsInCurrentWindow = record.attemptTimestamps
      ? record.attemptTimestamps.filter(t => now - t < 15 * 60 * 1000).length
      : 0;

    const attemptsLeft = Math.max(0, tierMaxAttempts - attemptsInCurrentWindow);

    return {
      allowed: attemptsLeft > 0,
      remainingMs: 0,
      attemptsLeft,
      totalFailures,
      tierLockoutMs: tier.lockoutMs,
    };
  }

  /**
   * Record a failed attempt for the identifier.
   * Returns the updated status after recording.
   */
  async function recordFailure(identifier) {
    const records = await getRecords();
    const now = Date.now();

    if (!records[identifier]) {
      records[identifier] = {
        failures: 0,
        attemptTimestamps: [],
        lockedUntil: null,
        firstAttempt: now,
        lastAttempt: now,
      };
    }

    const record = records[identifier];
    record.failures = (record.failures || 0) + 1;
    record.lastAttempt = now;

    // Track individual attempt timestamps (sliding 15-min window)
    if (!record.attemptTimestamps) record.attemptTimestamps = [];
    record.attemptTimestamps.push(now);
    record.attemptTimestamps = record.attemptTimestamps.filter(t => now - t < 15 * 60 * 1000);

    // Determine if lockout should kick in
    const tier = getTier(record.failures);
    const recentFailures = record.attemptTimestamps.length;

    // Lock out if recent failures exceed first tier threshold
    if (recentFailures >= TIERS[0].maxAttempts) {
      record.lockedUntil = now + tier.lockoutMs;
      record.lockoutCount = (record.lockoutCount || 0) + 1;
    }

    await saveRecords(records);

    return checkLimit(identifier);
  }

  /**
   * Reset the failure counter for an identifier (called on successful login).
   */
  async function reset(identifier) {
    const records = await getRecords();
    if (records[identifier]) {
      delete records[identifier];
      await saveRecords(records);
    }
  }

  /**
   * Get the lockout record for an identifier (for admin inspection).
   */
  async function getRecord(identifier) {
    const records = await getRecords();
    return records[identifier] || null;
  }

  /**
   * Get all lockout records (admin view).
   */
  async function getAllRecords() {
    return await getRecords();
  }

  /**
   * Manually clear a lockout (admin action).
   */
  async function clearLockout(identifier) {
    const records = await getRecords();
    if (records[identifier]) {
      delete records[identifier];
      await saveRecords(records);
    }
  }

  /**
   * Get a human-readable lockout message.
   */
  function formatLockoutTime(ms) {
    if (ms <= 0) return '';
    const totalSec = Math.ceil(ms / 1000);
    if (totalSec < 60) return `${totalSec} seconde${totalSec > 1 ? 's' : ''}`;
    const min = Math.ceil(totalSec / 60);
    if (min < 60) return `${min} minute${min > 1 ? 's' : ''}`;
    const hours = Math.floor(min / 60);
    const remainMin = min % 60;
    if (remainMin === 0) return `${hours} heure${hours > 1 ? 's' : ''}`;
    return `${hours}h${remainMin.toString().padStart(2, '0')}`;
  }

  return { checkLimit, recordFailure, reset, getRecord, getAllRecords, clearLockout, formatLockoutTime };
})();

window.GCBruteForce = BruteForce;
