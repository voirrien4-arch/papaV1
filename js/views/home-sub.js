// Gold_Crew — Home Sub-View (Dashboard Home — Terminal Style)
// Always loads fresh data from storage
const HomeSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  const colorMap = { green: 'var(--green)', red: 'var(--red)', amber: 'var(--amber)', cyan: 'var(--cyan)', purple: 'var(--purple)', gold: 'var(--gold)' };
  const colorBgMap = { green: 'rgba(0,255,65,0.04)', red: 'rgba(255,0,64,0.04)', amber: 'rgba(255,184,0,0.04)', cyan: 'rgba(0,229,255,0.04)', purple: 'rgba(191,0,255,0.04)', gold: 'rgba(212,175,55,0.04)' };
  const colorBorderMap = { green: 'rgba(0,255,65,0.2)', red: 'rgba(255,0,64,0.2)', amber: 'rgba(255,184,0,0.2)', cyan: 'rgba(0,229,255,0.2)', purple: 'rgba(191,0,255,0.2)', gold: 'rgba(212,175,55,0.2)' };

  async function render(container) {
    // Always reload fresh from storage
    await GCAuth.reloadUserData();

    const user = GCState.getUser();
    const crew = GCState.getCrewRemaining();
    const crewTotal = GCState.get().crewQuota || 2;
    const history = GCState.get().searchHistory || [];
    const recentSearches = history.slice(0, 5);
    const favorites = GCState.get().favorites || [];
    const nextReset = user?.quotaResetDay ? new Date(user.quotaResetDay) : null;
    const resetStr = nextReset ? nextReset.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '—';

    // Load announcements
    let announcements = [];
    try {
      announcements = await GCAdmin.getAnnouncements();
    } catch {}
    const recentAnnouncements = announcements.slice(0, 3);

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-4">
        <!-- Announcements -->
        <div id="home-announcements">
          ${recentAnnouncements.length > 0 ? recentAnnouncements.map(a => {
            const col = a.color || 'green';
            const iconColor = colorMap[col] || 'var(--green)';
            const bgColor = colorBgMap[col] || 'rgba(0,255,65,0.04)';
            const borderColor = colorBorderMap[col] || 'rgba(0,255,65,0.2)';
            return `
              <div class="mb-3 p-3 rounded animate-fade-up" style="background:${bgColor};border:1px solid ${borderColor};border-left:3px solid ${iconColor}">
                <div class="flex items-center gap-2 mb-1">
                  <span style="color:${iconColor};font-size:0.7rem">⊘</span>
                  <span class="font-bold text-xs" style="color:${iconColor}">${escapeHtml(a.title)}</span>
                  <span class="text-xs" style="color:var(--text-muted);font-size:0.5rem;margin-left:auto">${new Date(a.sentAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <div class="text-xs" style="color:var(--text-secondary);line-height:1.6">${renderAnnouncementHtml(a.message)}</div>
              </div>
            `;
          }).join('') : ''}
        </div>

        <!-- Welcome card -->
        <div class="animate-fade-up" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:16px">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 class="text-lg font-bold" style="color:var(--text-green);font-family:var(--font-mono)">
                <span style="color:var(--text-muted)">$</span> whoami
              </h1>
              <p class="text-xs mt-1" style="color:var(--text-secondary)">
                <span style="color:var(--green)">${user?.firstName || user?.username || 'anonymous'}</span> — ${t('dashboard.quota_reset')} ${resetStr}
              </p>
            </div>
            <button class="btn btn-green btn-sm" id="home-new-search">
              ▶ ${t('dashboard.new_search')}
            </button>
          </div>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="stat-card animate-fade-up animate-delay-1">
            <div class="flex items-center gap-2.5">
              <span style="color:var(--green);font-size:1rem">⊕</span>
              <div>
                <div class="text-xl font-black" style="color:var(--green)">${crew}</div>
                <div class="text-xs" style="color:var(--text-muted);font-size:0.6rem">${t('dashboard.crew_remaining')}</div>
              </div>
            </div>
          </div>
          <div class="stat-card animate-fade-up animate-delay-2">
            <div class="flex items-center gap-2.5">
              <span style="color:var(--cyan);font-size:1rem">☰</span>
              <div>
                <div class="text-xl font-black" style="color:var(--cyan)">${history.length}</div>
                <div class="text-xs" style="color:var(--text-muted);font-size:0.6rem">${t('dashboard.history')}</div>
              </div>
            </div>
          </div>
          <div class="stat-card animate-fade-up animate-delay-3">
            <div class="flex items-center gap-2.5">
              <span style="color:var(--amber);font-size:1rem">★</span>
              <div>
                <div class="text-xl font-black" style="color:var(--amber)">${favorites.length}</div>
                <div class="text-xs" style="color:var(--text-muted);font-size:0.6rem">${t('dashboard.favorites')}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          ${quickAction('⊛', t('dashboard.new_search'), 'search')}
          ${quickAction('☰', t('dashboard.history'), 'history')}
          ${quickAction('◆', t('dashboard.promo'), 'promo')}
          ${quickAction('⚙', t('dashboard.settings'), 'settings')}
        </div>

        <!-- Recent searches -->
        <div class="animate-fade-up animate-delay-4" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:14px">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-xs" style="color:var(--text-green);text-transform:uppercase;letter-spacing:0.1em">▸ ${t('dashboard.history')}</h3>
            ${history.length > 5 ? `<button class="btn btn-ghost btn-sm" data-quick-action="history" style="font-size:0.6rem;color:var(--cyan)">Voir tout (${history.length})</button>` : ''}
          </div>
          ${recentSearches.length === 0
            ? '<div class="text-center py-6" style="color:var(--text-muted)"><p class="text-xl mb-1 opacity-30">∅</p><p class="text-xs">Aucun scan récent</p><button class="btn btn-outline btn-sm mt-3" id="home-goto-search">▶ Lancer une recherche</button></div>'
            : '<div class="space-y-1">' + recentSearches.map(h => `
                <div class="flex items-center justify-between p-2 rounded hover:bg-white/2 transition" style="cursor:pointer" data-history-detail="${h.id}">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="badge badge-green text-xs" style="font-size:0.5rem">${h.type || '—'}</span>
                    <span class="text-xs truncate" style="color:var(--text-primary)">${escapeHtml(h.query || '—')}</span>
                    <span class="badge badge-info" style="font-size:0.45rem">${(h.results || []).length} résultat(s)</span>
                  </div>
                  <span class="text-xs shrink-0" style="color:var(--text-muted);font-size:0.55rem">${new Date(h.date).toLocaleDateString('fr-FR')}</span>
                </div>
              `).join('') + '</div>'
          }
        </div>

        ${crew <= 0 ? renderCrewExhausted() : ''}
      </div>
    `;
    document.getElementById('home-new-search')?.addEventListener('click', () => GCDashboardView.navigateSubView('search'));
    document.getElementById('home-goto-search')?.addEventListener('click', () => GCDashboardView.navigateSubView('search'));
    document.querySelectorAll('[data-quick-action]').forEach(btn => {
      btn.addEventListener('click', () => GCDashboardView.navigateSubView(btn.dataset.quickAction));
    });
    document.querySelectorAll('[data-history-detail]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.historyDetail;
        const entry = history.find(h => h.id === id);
        if (entry) showQuickDetail(entry);
      });
    });
  }

  function quickAction(icon, label, viewId) {
    return `
      <button data-quick-action="${viewId}" class="p-3 rounded cursor-pointer hover:border-green-500/20 transition-all animate-fade-up" style="background:rgba(0,255,65,0.02);border:1px solid var(--border-subtle)">
        <div class="text-lg mb-0.5" style="color:var(--green)">${icon}</div>
        <div class="text-xs" style="color:var(--text-secondary);font-size:0.6rem">${label}</div>
      </button>
    `;
  }

  function showQuickDetail(entry) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const conf = entry.results?.[0]?.confidence || 0;
    overlay.innerHTML = `
      <div class="modal" style="max-width:550px;max-height:80vh;overflow-y:auto">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-sm" style="color:var(--green);font-family:var(--font-mono)">
            <span style="color:var(--text-muted)">${escapeHtml(entry.type)}</span>: ${escapeHtml(entry.query)}
          </h3>
          <button class="btn btn-ghost btn-sm modal-close">✕</button>
        </div>
        <p class="text-xs mb-3" style="color:var(--text-muted)">${new Date(entry.date).toLocaleString('fr-FR')} · ${entry.duration}s · ${(entry.results || []).length} résultat(s)</p>

        ${entry.aiAnalysis ? `
          <div class="mb-3 p-3 rounded" style="background:rgba(0,229,255,0.03);border:1px solid rgba(0,229,255,0.12)">
            <div class="flex items-center gap-2 mb-1.5">
              <span style="color:var(--cyan);font-size:0.7rem">◈</span>
              <span class="text-xs font-bold" style="color:var(--cyan)">ANALYSE IA</span>
            </div>
            <div class="text-xs" style="color:var(--text-secondary);line-height:1.5;max-height:150px;overflow-y:auto">
              ${renderAnnouncementHtml(entry.aiAnalysis)}
            </div>
          </div>
        ` : ''}

        ${(entry.results || []).slice(0, 5).map(r => `
          <div class="rounded p-2.5 mb-2" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-left:2px solid ${(r.confidence||0) >= 70 ? 'var(--green)' : (r.confidence||0) >= 40 ? 'var(--amber)' : 'var(--red)'}">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="badge badge-gold" style="font-size:0.55rem">${r.source}</span>
              <span class="text-xs font-bold" style="color:var(--${(r.confidence||0) >= 70 ? 'green' : (r.confidence||0) >= 40 ? 'amber' : 'red'});font-size:0.6rem">${r.confidence||0}%</span>
            </div>
            ${r.data ? `<div class="text-xs" style="color:var(--text-secondary);line-height:1.5;max-height:80px;overflow-y:auto">${Object.entries(r.data).slice(0,5).map(([k,v]) => `<span style="color:var(--text-muted)">${escapeHtml(k)}:</span> ${escapeHtml(String(v).slice(0,100))}`).join('<br>')}</div>` : ''}
            ${(r.links||[]).length ? `<div class="flex flex-wrap gap-1 mt-1.5">${r.links.slice(0,3).map(l => `<a href="${l}" target="_blank" rel="noopener" class="text-xs px-1.5 py-0.5 rounded" style="background:rgba(0,229,255,0.06);color:var(--cyan);font-size:0.55rem;text-decoration:none">🔗 ${l.length > 40 ? l.slice(0,40)+'...' : l}</a>`).join('')}</div>` : ''}
          </div>
        `).join('')}

        <div class="flex gap-2 mt-3">
          <button class="btn btn-outline btn-sm flex-1" id="qv-go-history">☰ Voir dans l'historique</button>
          <button class="btn btn-ghost btn-sm" id="qv-close">Fermer</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('#qv-close')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('#qv-go-history')?.addEventListener('click', () => { overlay.remove(); GCDashboardView.navigateSubView('history'); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); }
    });
  }

  function renderCrewExhausted() {
    return `
      <div class="animate-fade-up animate-delay-5 p-5" style="background:rgba(255,0,64,0.03);border:1px solid rgba(255,0,64,0.15);border-radius:var(--radius)">
        <div class="text-center">
          <div class="text-xl mb-2" style="color:var(--red)">⊘</div>
          <h3 class="font-bold text-sm mb-2" style="color:var(--red)">${t('search.crew_exhausted')}</h3>
          <p class="text-xs mb-3" style="color:var(--text-secondary)">${t('search.whatsapp_instructions')}</p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-2 mb-2">
            <a href="https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T" target="_blank" rel="noopener" class="btn btn-green btn-sm">
              💬 ${t('search.whatsapp_link_goldcrew')}
            </a>
            <a href="https://whatsapp.com/channel/0029VbBT7FdLCoX1TDyQQb1B" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="border-color:rgba(37,211,102,0.3);color:#25d366">
              💬 ${t('search.whatsapp_link_digitalcrew')}
            </a>
            <button class="btn btn-outline btn-sm" data-quick-action="promo">
              ${t('promo.input_placeholder')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderAnnouncementHtml(text) {
    if (!text) return '';
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;word-break:break-all">$1</a>')
      .replace(/\n/g, '<br>');
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { render };
})();

window.GCHomeSubView = HomeSubView;
