// Gold_Crew — App State Management
const State = (() => {
  const listeners = new Map();
  let state = {
    view: 'landing',
    user: null,
    isAuthenticated: false,
    crewQuota: 2,
    searchUsed: 0,
    searchHistory: [],
    favorites: [],
    notifications: [],
    promoCodes: {},
    sidebarOpen: false,
    isAdmin: false,
  };

  function get() { return state; }

  function set(updates) {
    const prev = { ...state };
    state = { ...state, ...updates };
    listeners.forEach((fns, key) => {
      if (key === '*' || updates[key] !== undefined) {
        fns.forEach(fn => fn(state, prev));
      }
    });
  }

  function on(key, fn) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(fn);
    return () => listeners.get(key)?.delete(fn);
  }

  function getUser() { return state.user; }
  function isLoggedIn() { return state.isAuthenticated && state.user !== null; }
  function getCrewRemaining() {
    if (!state.user) return 0;
    return Math.max(0, (state.crewQuota || 2) - state.searchUsed);
  }

  return { get, set, on, getUser, isLoggedIn, getCrewRemaining };
})();

window.GCState = State;
