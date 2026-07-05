// Gold_Crew — Router / View Manager
const Router = (() => {
  const views = {};
  let currentView = null;

  function register(name, renderFn) {
    views[name] = renderFn;
  }

  async function navigate(viewName, params) {
    if (!views[viewName]) {
      console.warn('Unknown view:', viewName);
      return;
    }
    currentView = viewName;
    GCState.set({ view: viewName, viewParams: params || {} });
    const container = document.getElementById('app');
    if (!container) return;
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:60vh"><div class="spinner spinner-lg"></div></div>';
    try {
      await views[viewName](container, params);
    } catch (e) {
      console.error('View render error:', e);
      container.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>${window.GCI18n?.t('common.error') ?? 'Erreur'}</p></div>`;
    }
  }

  function getCurrent() { return currentView; }

  return { register, navigate, getCurrent };
})();

window.GCRouter = Router;
