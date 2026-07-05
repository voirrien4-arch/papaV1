// Gold_Crew — Admin Panel Dashboard View
const AdminPanelView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  const ADMIN_NAV = [
    { id: 'admin-home', icon: '◈', label: 'Tableau de bord' },
    { id: 'admin-users', icon: '◉', label: 'Utilisateurs' },
    { id: 'admin-osint-sources', icon: '⬡', label: 'Sources OSINT' },
    { id: 'admin-promos', icon: '◆', label: 'Codes Promo' },
    { id: 'admin-api-keys', icon: '⚿', label: 'Clés API' },
    { id: 'admin-announcements', icon: '⊘', label: 'Annonces' },
    { id: 'admin-site-settings', icon: '⚙', label: 'Paramètres site' },
    { id: 'admin-admin-settings', icon: '⚷', label: 'Mon compte admin' },
    { id: 'admin-ai', icon: '◈', label: 'Gold_Crew AI' },
    { id: 'admin-ai-sources', icon: '🧠', label: 'Sources IA' },
    { id: 'admin-sourcecode', icon: '⤓', label: 'Code Source' },
    { id: 'admin-apk', icon: '📱', label: 'Générer APK' },
  ];

  async function render(container) {
    const isAdmin = await GCAdmin.checkSession();
    if (!isAdmin) { GCRouter.navigate('admin-login'); return; }

    container.innerHTML = `
      <div class="flex min-h-screen">
        <div id="admin-sidebar-overlay" class="sidebar-overlay"></div>
        <aside id="admin-sidebar" class="sidebar fixed lg:sticky top-0 flex flex-col" style="height:100vh">
          <div class="p-4 border-b" style="border-color:var(--border-subtle)">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded flex items-center justify-center" style="background:rgba(255,0,64,0.15);border:1px solid rgba(255,0,64,0.3)">
                <span style="color:var(--red);font-size:0.9rem">⊛</span>
              </div>
              <div>
                <div class="font-bold text-xs" style="color:var(--red)">ADMIN_PANEL</div>
                <div class="text-xs" style="color:var(--text-muted);font-size:0.6rem">Gold_Crew // root</div>
              </div>
            </div>
          </div>
          <nav class="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
            ${ADMIN_NAV.map(item => `
              <button class="sidebar-link" data-admin-nav="${item.id}">
                <span class="icon">${item.icon}</span>
                <span>${item.label}</span>
              </button>
            `).join('')}
          </nav>
          <div class="p-2 border-t space-y-0.5" style="border-color:var(--border-subtle)">
            <button class="sidebar-link" id="admin-back-user" style="color:var(--cyan)">
              <span class="icon">◁</span><span>Retour User Dashboard</span>
            </button>
            <button class="sidebar-link" id="admin-logout" style="color:var(--red)">
              <span class="icon">⏻</span><span>Déconnexion</span>
            </button>
          </div>
        </aside>
        <div class="flex-1 flex flex-col min-w-0">
          <header class="sticky top-0 z-40 h-12 flex items-center justify-between px-4 glass-card" style="border-radius:0;border-top:none;border-left:none;border-right:none">
            <div class="flex items-center gap-3">
              <button id="admin-hamburger" class="hamburger lg:hidden" aria-label="Menu">☰</button>
              <h2 id="admin-page-title" class="text-sm font-bold" style="color:var(--text-green)">Tableau de bord</h2>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge badge-danger" style="font-size:0.55rem">ROOT</span>
            </div>
          </header>
          <main id="admin-view-container" class="flex-1 p-4 sm:p-6"></main>
        </div>
      </div>
    `;
    bindAdminSidebar();
    navigateAdminSubView('admin-home');
  }

  function bindAdminSidebar() {
    document.querySelectorAll('[data-admin-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigateAdminSubView(btn.dataset.adminNav);
        closeAdminSidebar();
      });
    });
    document.getElementById('admin-back-user')?.addEventListener('click', () => {
      GCRouter.navigate('dashboard');
    });
    document.getElementById('admin-logout')?.addEventListener('click', async () => {
      await GCAdmin.logout();
      GCToast.info('Déconnexion admin.');
      GCRouter.navigate('landing');
    });
    document.getElementById('admin-hamburger')?.addEventListener('click', () => {
      document.getElementById('admin-sidebar')?.classList.toggle('open');
      document.getElementById('admin-sidebar-overlay')?.classList.toggle('visible');
    });
    document.getElementById('admin-sidebar-overlay')?.addEventListener('click', closeAdminSidebar);
  }

  function closeAdminSidebar() {
    document.getElementById('admin-sidebar')?.classList.remove('open');
    document.getElementById('admin-sidebar-overlay')?.classList.remove('visible');
  }

  async function navigateAdminSubView(subId) {
    const titles = {
      'admin-home': 'Tableau de bord',
      'admin-users': 'Utilisateurs',
      'admin-osint-sources': 'Sources OSINT',
      'admin-promos': 'Codes Promo',
      'admin-api-keys': 'Clés API',
      'admin-announcements': 'Annonces',
      'admin-site-settings': 'Paramètres site',
      'admin-admin-settings': 'Mon compte admin',
      'admin-ai': 'Gold_Crew AI',
      'admin-ai-sources': 'Sources IA',
      'admin-sourcecode': 'Code Source',
      'admin-apk': 'Générer APK',
    };
    document.getElementById('admin-page-title').textContent = titles[subId] || subId;
    document.querySelectorAll('[data-admin-nav]').forEach(b => b.classList.toggle('active', b.dataset.adminNav === subId));
    const viewContainer = document.getElementById('admin-view-container');
    viewContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:40vh"><div class="spinner spinner-lg"></div></div>';
    const viewMap = {
      'admin-home': AdminHomeSubView,
      'admin-users': AdminUsersSubView,
      'admin-osint-sources': AdminOsintSourcesSubView,
      'admin-promos': AdminPromosSubView,
      'admin-api-keys': AdminApiKeysSubView,
      'admin-announcements': AdminAnnouncementsSubView,
      'admin-site-settings': AdminSiteSettingsSubView,
      'admin-admin-settings': AdminAccountSubView,
      'admin-ai': AdminAiSubView,
      'admin-ai-sources': AdminAiSourcesSubView,
      'admin-sourcecode': AdminSourceCodeSubView,
      'admin-apk': AdminApkSubView,
    };
    const view = viewMap[subId];
    if (view) await view.render(viewContainer);
  }

  return { render, navigateAdminSubView };
})();

window.GCAdminPanelView = AdminPanelView;
