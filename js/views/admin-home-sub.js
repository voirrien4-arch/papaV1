// Gold_Crew — Admin Home Sub-View (Dashboard Stats — Terminal)
const AdminHomeSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  function _esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  }

  async function render(container) {
    const stats = await GCAdmin.getAdminStats();
    const settings = await GCAdmin.getSiteSettings();
    const announcements = await GCAdmin.getAnnouncements();

    container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-4">
        ${settings.maintenanceMode ? `
          <div class="p-3 animate-fade-up" style="background:rgba(255,0,64,0.05);border:1px solid rgba(255,0,64,0.2);border-radius:var(--radius)">
            <div class="flex items-center gap-2">
              <span style="color:var(--red);font-size:0.8rem">⚠</span>
              <div>
                <span class="text-xs font-bold" style="color:var(--red)">MAINTENANCE ACTIVE</span>
                <span class="text-xs ml-2" style="color:var(--text-muted)">${_esc(settings.maintenanceMessage)}</span>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Stats grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-up animate-delay-1">
          ${adminStatCard(stats.totalUsers, 'USERS', '◉', 'green')}
          ${adminStatCard(stats.activeUsers, 'ACTIVE 7D', '⊕', 'cyan')}
          ${adminStatCard(stats.bannedUsers, 'BANNED', '⊘', 'red')}
          ${adminStatCard(stats.totalSearches, 'SCANS', '⊛', 'green')}
          ${adminStatCard(stats.searchesToday, 'TODAY', '◈', 'amber')}
          ${adminStatCard(stats.searchesWeek, 'WEEK', '☰', 'cyan')}
          ${adminStatCard(stats.searchesMonth, 'MONTH', '⊞', 'green')}
          ${adminStatCard(stats.apiKeysPending, 'KEYS ⏳', '⚿', 'red')}
        </div>

        <!-- Crew stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-up animate-delay-1">
          ${adminStatCard(stats.totalCrewDistributed, 'CREW TOTAL', '⊞', 'gold')}
          ${adminStatCard(stats.totalCrewUsed, 'CREW USED', '⊛', 'amber')}
          ${adminStatCard(stats.avgCrewPerUser, 'AVG/USER', '◈', 'cyan')}
          ${adminStatCard(stats.usersNeedingReset, 'RESET DÛ', '↻', stats.usersNeedingReset > 0 ? 'amber' : 'green')}
        </div>

        <!-- Quick actions -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 animate-fade-up animate-delay-2">
          ${adminQuickAction('⬡', 'Sources OSINT', 'admin-osint-sources')}
          ${adminQuickAction('◉', 'Utilisateurs', 'admin-users')}
          ${adminQuickAction('◆', 'Codes Promo', 'admin-promos')}
          ${adminQuickAction('⊘', 'Annonces', 'admin-announcements')}
          ${adminQuickAction('⚙', 'Paramètres', 'admin-site-settings')}
        </div>

        <!-- Recent announcements -->
        <div class="animate-fade-up animate-delay-3" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:14px">
          <h3 class="font-bold text-xs mb-3" style="color:var(--text-green);text-transform:uppercase;letter-spacing:0.1em">▸ Annonces récentes</h3>
          ${announcements.length === 0
            ? '<p class="text-xs" style="color:var(--text-muted)">Aucune annonce.</p>'
            : announcements.slice(0, 5).map(a => `
                <div class="p-2.5 rounded mb-1.5" style="background:rgba(0,255,65,0.02);border:1px solid rgba(0,255,65,0.04)">
                  <div class="font-bold text-xs" style="color:var(--text-primary)">${_esc(a.title)}</div>
                  <div class="text-xs mt-0.5" style="color:var(--text-muted)">${_esc(a.message)}</div>
                  <div class="text-xs mt-0.5" style="color:var(--text-muted);font-size:0.55rem">${new Date(a.sentAt).toLocaleString('fr-FR')}</div>
                </div>
              `).join('')
          }
        </div>
      </div>
    `;
    document.querySelectorAll('[data-admin-quick]').forEach(btn => {
      btn.addEventListener('click', () => GCAdminPanelView.navigateAdminSubView(btn.dataset.adminQuick));
    });
  }

  function adminStatCard(value, label, icon, color) {
    const colorMap = { green: 'var(--green)', cyan: 'var(--cyan)', red: 'var(--red)', amber: 'var(--amber)', gold: 'var(--gold)' };
    return `
      <div class="stat-card">
        <div class="text-lg font-black" style="color:${colorMap[color] || colorMap.green}">${value}</div>
        <div class="flex items-center gap-1 mt-0.5">
          <span style="color:${colorMap[color]};font-size:0.6rem">${icon}</span>
          <span style="color:var(--text-muted);font-size:0.55rem;text-transform:uppercase;letter-spacing:0.08em">${label}</span>
        </div>
      </div>
    `;
  }

  function adminQuickAction(icon, label, viewId) {
    return `
      <button data-admin-quick="${viewId}" class="p-3 rounded cursor-pointer hover:border-green-500/20 transition-all" style="background:rgba(0,255,65,0.02);border:1px solid var(--border-subtle)">
        <div class="text-lg mb-0.5" style="color:var(--green)">${icon}</div>
        <div class="text-xs" style="color:var(--text-secondary);font-size:0.55rem">${label}</div>
      </button>
    `;
  }

  return { render };
})();

window.GCAdminHomeSubView = AdminHomeSubView;
