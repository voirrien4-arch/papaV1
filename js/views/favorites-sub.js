// Gold_Crew — Favorites Sub-View
// Always loads fresh data from storage
const FavoritesSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  async function render(container) {
    // Always reload fresh from storage
    await GCAuth.reloadUserData();
    const favorites = GCState.get().favorites || [];

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-4">
        <h2 class="text-xl font-bold animate-fade-up" style="color:var(--text-primary)">${t('favorites.title')}</h2>
        <div id="fav-list" class="animate-fade-up animate-delay-1">
          ${favorites.length === 0 ? `
            <div class="glass-card p-12 text-center">
              <p class="text-4xl mb-3 opacity-50">⭐</p>
              <p style="color:var(--text-muted)">${t('favorites.empty')}</p>
              <button class="btn btn-outline btn-sm mt-4" id="fav-goto-search">▶ ${t('dashboard.new_search')}</button>
            </div>
          ` : `
            <div class="space-y-3">
              ${favorites.map(f => `
                <div class="glass-card p-4 flex items-center justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="badge badge-gold">${f.type || '—'}</span>
                      <span class="text-sm font-medium truncate" style="color:var(--text-primary)">${escapeHtml(f.query || '—')}</span>
                    </div>
                    <span class="text-xs" style="color:var(--text-muted)">${f.addedAt ? new Date(f.addedAt).toLocaleDateString('fr-FR') : ''} · ${(f.results || []).length} résultat(s)</span>
                  </div>
                  <div class="flex gap-2 shrink-0">
                    <button class="btn btn-ghost btn-sm fav-view" data-id="${f.id}" aria-label="${t('favorites.view')}">👁️</button>
                    <button class="btn btn-ghost btn-sm fav-remove" data-id="${f.id}" aria-label="${t('favorites.remove')}" style="color:var(--danger)">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
    document.getElementById('fav-goto-search')?.addEventListener('click', () => GCDashboardView.navigateSubView('search'));
    bindActions();
  }

  function bindActions() {
    document.querySelectorAll('.fav-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        const favs = GCState.get().favorites || [];
        const fav = favs.find(f => f.id === btn.dataset.id);
        if (fav) {
          await GCAuth.toggleFavorite(fav);
          render(document.querySelector('#view-container'));
          GCToast.info('Retiré des favoris.');
        }
      });
    });
    document.querySelectorAll('.fav-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const favs = GCState.get().favorites || [];
        const fav = favs.find(f => f.id === btn.dataset.id);
        if (fav) showFavDetail(fav);
      });
    });
  }

  function showFavDetail(fav) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:600px;max-height:80vh;overflow-y:auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold" style="color:var(--text-primary)">${escapeHtml(fav.type)}: ${escapeHtml(fav.query)}</h3>
          <button class="btn btn-ghost btn-sm modal-close">✕</button>
        </div>
        ${fav.aiAnalysis ? `
          <div class="mb-3 p-3 rounded" style="background:rgba(0,229,255,0.03);border:1px solid rgba(0,229,255,0.12)">
            <div class="flex items-center gap-2 mb-1.5">
              <span style="color:var(--cyan);font-size:0.7rem">◈</span>
              <span class="text-xs font-bold" style="color:var(--cyan)">ANALYSE IA</span>
            </div>
            <div class="text-xs" style="color:var(--text-secondary);line-height:1.5;max-height:120px;overflow-y:auto">
              ${escapeHtml(fav.aiAnalysis).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}
            </div>
          </div>
        ` : ''}
        <div class="space-y-3">
          ${(fav.results || []).map(r => {
            const conf = r.confidence || 0;
            return `
            <div class="rounded p-3" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-left:2px solid ${conf >= 70 ? 'var(--green)' : conf >= 40 ? 'var(--amber)' : 'var(--red)'}">
              <div class="flex items-center gap-2 mb-2">
                <span class="badge badge-gold">${r.source}</span>
                <span class="text-xs font-bold" style="color:var(--${conf >= 70 ? 'green' : conf >= 40 ? 'amber' : 'red'});font-size:0.6rem">${conf}%</span>
              </div>
              ${r.data ? Object.entries(r.data).map(([k,v]) => `<div class="text-xs"><span style="color:var(--text-muted)">${escapeHtml(k)}:</span> <span style="color:var(--text-primary)">${typeof v === 'object' ? escapeHtml(JSON.stringify(v)) : formatFavValue(v)}</span></div>`).join('') : ''}
              ${(r.links||[]).length ? `<div class="flex flex-wrap gap-1.5 mt-2">${r.links.map(l => `<a href="${l}" target="_blank" rel="noopener" class="text-xs px-2 py-0.5 rounded" style="background:rgba(0,229,255,0.08);color:var(--cyan);font-size:0.6rem;text-decoration:none">🔗 ${l.length > 50 ? l.slice(0,50)+'...' : l}</a>`).join('')}</div>` : ''}
            </div>
          `;
          }).join('')}
        </div>
        <div class="mt-4 text-center">
          <button class="btn btn-ghost btn-sm modal-close">Fermer</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => overlay.remove()));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); }
    });
  }

  function formatFavValue(v) {
    if (v === null || v === undefined) return '—';
    const s = String(v);
    if (s.startsWith('http://') || s.startsWith('https://')) {
      return `<a href="${escapeHtml(s)}" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline">${s.length > 60 ? s.slice(0,60)+'...' : s}</a>`;
    }
    return escapeHtml(s.length > 200 ? s.slice(0,200)+'...' : s);
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { render };
})();

window.GCFavoritesSubView = FavoritesSubView;
