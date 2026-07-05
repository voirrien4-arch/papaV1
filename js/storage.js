// Gold_Crew — Storage Module (localStorage-based)
// Persistent key-value storage with persistent session support
const Storage = (() => {
  const PREFIX = 'gc_';

  async function get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  async function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  }

  async function remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch {}
  }

  // Sessions use localStorage for persistent auto-login across tab/browser restarts
  async function getSession(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  async function setSession(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {}
  }

  async function removeSession(key) {
    try { localStorage.removeItem(PREFIX + key); } catch {}
  }

  return { get, set, remove, getSession, setSession, removeSession };
})();

window.GCStorage = Storage;
