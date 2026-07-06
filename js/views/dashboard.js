// Gold_Crew — Dashboard Shell with Sidebar (Dark Terminal)
const DashboardView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  const NAV_ITEMS = [
    { id: 'home', icon: '◈', label: 'dashboard.home' },
    { id: 'search', icon: '⊛', label: 'dashboard.new_search' },
    { id: 'history', icon: '☰', label: 'dashboard.history' },
    { id: 'promo', icon: '◆', label: 'dashboard.promo' },
    { id: 'favorites', icon: '★', label: 'dashboard.favorites' },
    { id: 'people', icon: '👤', label: 'dashboard.people' },
    { id: 'import', icon: '📁', label: 'dashboard.import' },
    { id: 'stats', icon: '⊞', label: 'dashboard.stats' },
    { id: 'profile', icon: '◉', label: 'dashboard.profile' },
    { id: 'settings', icon: '⚙', label: 'dashboard.settings' },
  ];

  async function render(container) {
    const user = GCState.getUser();
    if (!user) { GCRouter.navigate('landing'); return; }

    // Reload fresh notifications from storage
    try { await GCAuth.reloadUserData(); } catch {}

    const crew = GCState.getCrewRemaining();
    const crewTotal = GCState.get().crewQuota || 2;

    container.innerHTML = `
      <div class="flex min-h-screen">
        <!-- Mobile overlay -->
        <div id="sidebar-overlay" class="sidebar-overlay"></div>

        <!-- Sidebar -->
        <aside id="sidebar" class="sidebar fixed lg:sticky top-0 flex flex-col" style="height:100vh">
          <!-- Brand -->
          <div class="p-4 border-b" style="border-color:var(--border-subtle)">
            <div class="flex items-center gap-2">
              <span style="color:var(--green);font-weight:800;font-size:0.85rem;font-family:var(--font-mono)">◈</span>
              <div>
                <div class="font-bold text-xs" style="color:var(--green);font-family:var(--font-mono)">GOLD_CREW</div>
                <div class="text-xs" style="color:var(--text-muted);font-size:0.55rem">${user.username}</div>
              </div>
            </div>
          </div>

          <!-- Crew badge -->
          <div class="px-3 py-2">
            <div class="p-2.5 rounded" style="background:rgba(0,255,65,0.03);border:1px solid var(--border-subtle)">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs" style="color:var(--text-muted);font-size:0.6rem">CREW</span>
                <span class="badge badge-green" style="font-size:0.5rem">${crew}/${crewTotal}</span>
              </div>
              <div class="h-1 rounded overflow-hidden" style="background:rgba(0,255,65,0.06)">
                <div class="h-full rounded transition-all duration-500" style="width:${Math.max(5,(crew/crewTotal)*100)}%;background:var(--green)"></div>
              </div>
            </div>
          </div>

          ${!GCApi.isServerAvailable() ? `
          <div class="px-3 pb-1">
            <div class="p-1.5 rounded text-center" style="background:rgba(255,184,0,0.04);border:1px solid rgba(255,184,0,0.1)">
              <span style="color:var(--amber);font-size:0.55rem;font-family:var(--font-mono)">⚡ Mode local (pas de serveur)</span>
            </div>
          </div>
          ` : ''}

          <!-- Navigation -->
          <nav class="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
            ${NAV_ITEMS.filter(item => item.id !== 'import' || GCState.get().isAdmin).map(item => `
              <button class="sidebar-link" data-nav="${item.id}">
                <span class="icon">${item.icon}</span>
                <span>${t(item.label)}</span>
              </button>
            `).join('')}
          </nav>

          <!-- Logout & Admin -->
          <div class="p-2 border-t" style="border-color:var(--border-subtle)">
            <button class="sidebar-link" id="sidebar-logout" style="color:var(--red)">
              <span class="icon">⏻</span>
              <span>${t('dashboard.logout')}</span>
            </button>
          </div>
        </aside>

        <!-- Main content -->
        <div class="flex-1 flex flex-col min-w-0">
          <!-- Top bar -->
          <header class="sticky top-0 z-40 h-12 flex items-center justify-between px-4 glass-card" style="border-radius:0;border-top:none;border-left:none;border-right:none">
            <div class="flex items-center gap-3">
              <button id="hamburger" class="hamburger lg:hidden" aria-label="Menu">☰</button>
              <h2 id="page-title" class="text-sm font-bold" style="color:var(--text-green);font-family:var(--font-mono)">${t('dashboard.home')}</h2>
            </div>
            <div class="flex items-center gap-2">
              ${GCState.get().isAdmin ? `
              <button id="dashboard-admin-btn" title="Administration" aria-label="Administration" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1rem;padding:6px;border-radius:var(--radius);transition:all 0.15s ease;opacity:0.3">⚙</button>
              ` : ''}
              <button id="notif-btn" class="relative p-1.5 rounded hover:bg-white/5 transition" aria-label="${t('dashboard.notifications')}">
                <span style="font-size:0.9rem;color:var(--text-secondary)">⊘</span>
                <span id="notif-dot" class="notif-dot hidden"></span>
              </button>
              <div class="w-7 h-7 rounded flex items-center justify-center text-xs font-bold" style="background:rgba(0,255,65,0.1);color:var(--green);border:1px solid rgba(0,255,65,0.2);font-family:var(--font-mono)">
                ${(user.firstName?.[0] || user.username[0]).toUpperCase()}
              </div>
            </div>
          </header>

          <!-- View container -->
          <main id="view-container" class="flex-1 p-4 sm:p-6"></main>
        </div>
      </div>

      <!-- Notification panel -->
      <div id="notif-panel" class="fixed right-0 top-0 h-full w-72 hidden z-50" style="background:#0a0a0a;border-left:1px solid var(--border-subtle)">
        <div class="p-4 border-b flex items-center justify-between" style="border-color:var(--border-subtle)">
          <h3 class="font-bold text-sm" style="color:var(--text-green)">Notifications</h3>
          <button id="close-notif" class="btn btn-ghost btn-sm" style="font-size:0.7rem">✕</button>
        </div>
        <div id="notif-list" class="p-3 space-y-2 overflow-y-auto" style="max-height:calc(100vh - 60px)"></div>
      </div>
    `;
    bindSidebar();
    bindNotifications();
    navigateSubView('home');
  }

  function bindSidebar() {
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigateSubView(btn.dataset.nav);
        closeSidebar();
      });
    });
    document.getElementById('sidebar-logout')?.addEventListener('click', async () => {
      await GCAuth.logout();
      GCToast.info('Déconnecté.');
      GCRouter.navigate('landing');
    });
    document.getElementById('dashboard-admin-btn')?.addEventListener('click', () => {
      GCRouter.navigate('admin-login');
    });
    document.getElementById('hamburger')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);
  }

  function bindNotifications() {
    const notifBtn = document.getElementById('notif-btn');
    const notifPanel = document.getElementById('notif-panel');
    const closeBtn = document.getElementById('close-notif');
    notifBtn?.addEventListener('click', async () => {
      // Reload fresh notifications
      try { await GCAuth.reloadUserData(); } catch {}
      notifPanel.classList.toggle('hidden');
      renderNotifications();
    });
    closeBtn?.addEventListener('click', () => notifPanel.classList.add('hidden'));
    updateNotifDot();
  }

  function updateNotifDot() {
    const notifs = GCState.get().notifications || [];
    const unread = notifs.filter(n => !n.read).length;
    const dot = document.getElementById('notif-dot');
    if (dot) dot.classList.toggle('hidden', unread === 0);
  }

  function renderNotifications() {
    const list = document.getElementById('notif-list');
    const notifs = GCState.get().notifications || [];
    if (notifs.length === 0) {
      list.innerHTML = `<div class="empty-state"><p style="font-size:0.75rem">${t('notifications.empty')}</p></div>`;
      return;
    }
    const icons = { new_login: '⊕', search_complete: '✓', crew_low: '⚠', quota_low: '⚠', promo_used: '◆', system_update: '↻', admin_announce: '⊘' };
    const colorMap = { green: 'var(--green)', red: 'var(--red)', amber: 'var(--amber)', cyan: 'var(--cyan)', purple: 'var(--purple)', gold: 'var(--gold)' };
    const colorBgMap = { green: 'rgba(0,255,65,0.06)', red: 'rgba(255,0,64,0.06)', amber: 'rgba(255,184,0,0.06)', cyan: 'rgba(0,229,255,0.06)', purple: 'rgba(191,0,255,0.06)', gold: 'rgba(212,175,55,0.06)' };
    const colorBorderMap = { green: 'rgba(0,255,65,0.2)', red: 'rgba(255,0,64,0.2)', amber: 'rgba(255,184,0,0.2)', cyan: 'rgba(0,229,255,0.2)', purple: 'rgba(191,0,255,0.2)', gold: 'rgba(212,175,55,0.2)' };
    list.innerHTML = notifs.slice(0, 20).map(n => {
      const col = n.color || 'green';
      const isAnnounce = n.type === 'admin_announce';
      const iconColor = isAnnounce ? (colorMap[col] || 'var(--green)') : 'var(--green)';
      const bgColor = isAnnounce ? (colorBgMap[col] || 'rgba(0,255,65,0.03)') : (n.read ? 'rgba(255,255,255,0.01)' : 'rgba(0,255,65,0.03)');
      const borderColor = isAnnounce ? (colorBorderMap[col] || 'rgba(0,255,65,0.1)') : (n.read ? 'rgba(255,255,255,0.03)' : 'rgba(0,255,65,0.1)');
      const leftBorder = isAnnounce ? `3px solid ${iconColor}` : (n.read ? '2px solid transparent' : '2px solid var(--green)');
      return `
      <div class="p-2.5 rounded" style="background:${bgColor};border:1px solid ${borderColor};border-left:${leftBorder}">
        <div class="flex items-start gap-2">
          <span style="color:${iconColor};font-size:0.7rem">${icons[n.type] || '•'}</span>
          <div class="flex-1 min-w-0">
            <p class="text-xs" style="color:var(--text-primary);line-height:1.5">${renderNotifMessage(n.message)}</p>
            <p class="text-xs mt-0.5" style="color:var(--text-muted);font-size:0.55rem">${new Date(n.date).toLocaleString('fr-FR')}</p>
          </div>
        </div>
      </div>
    `;
    }).join('') + `<button id="mark-all-read" class="btn btn-ghost btn-sm w-full mt-2" style="font-size:0.65rem">${t('dashboard.mark_all_read')}</button>`;
    document.getElementById('mark-all-read')?.addEventListener('click', async () => {
      await GCAuth.markNotificationsRead();
      updateNotifDot();
      renderNotifications();
      GCToast.success('Notifications lues.');
    });
  }

  function renderNotifMessage(msg) {
    if (!msg) return '';
    return msg
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;word-break:break-all">$1</a>');
  }

  function refreshCrewDisplay() {
    const crew = GCState.getCrewRemaining();
    const crewTotal = GCState.get().crewQuota || 2;
    const badge = document.querySelector('.sidebar .badge-green');
    if (badge) badge.textContent = `${crew}/${crewTotal}`;
    const bar = document.querySelector('.sidebar .h-1.rounded > div');
    if (bar) bar.style.width = `${Math.max(5, (crew / crewTotal) * 100)}%`;
  }

  function navigateSubView(subId) {
    const titles = { home: 'dashboard.home', search: 'dashboard.new_search', history: 'dashboard.history', promo: 'dashboard.promo', favorites: 'dashboard.favorites', people: 'dashboard.people', import: 'dashboard.import', stats: 'dashboard.stats', profile: 'dashboard.profile', settings: 'dashboard.settings' };
    document.getElementById('page-title').textContent = t(titles[subId] || subId);
    document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === subId));
    const viewMap = { home: HomeSubView, search: SearchSubView, history: HistorySubView, promo: PromoSubView, favorites: FavoritesSubView, people: window.PeopleSubView, import: window.ImportSubView, stats: StatsSubView, profile: ProfileSubView, settings: SettingsSubView };
    const view = viewMap[subId];
    const viewContainer = document.getElementById('view-container');
    if (view) {
      view.render(viewContainer);
    } else if (viewContainer) {
      viewContainer.innerHTML = `<div class="empty-state"><div class="icon">🚧</div><p>Cette section n'est pas encore disponible.</p></div>`;
    }
  }

  function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('visible');
  }

  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('visible');
  }

  return { render, navigateSubView, updateNotifDot, refreshCrewDisplay };
})();

window.GCDashboardView = DashboardView;
    
