// Gold_Crew — Admin Users Sub-View (Terminal Style)
// Supports server-side pagination for 1000+ users
const AdminUsersSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  let _currentPage = 1;
  let _currentQuery = '';
  const PAGE_LIMIT = 50;

  async function render(container) {
    _currentPage = 1;
    _currentQuery = '';
    await _loadPage(container);
  }

  async function _loadPage(container) {
    const settings = await GCAdmin.getSiteSettings();

    // Use paginated API if server available, otherwise load all
    let users = [];
    let total = 0;
    let totalPages = 1;

    if (GCApi.isServerAvailable()) {
      try {
        const result = await GCApi.req('GET', `/api/admin/users?page=${_currentPage}&limit=${PAGE_LIMIT}&q=${encodeURIComponent(_currentQuery)}`);
        if (result.success) {
          users = result.users;
          total = result.total;
          totalPages = result.totalPages;
        }
      } catch {}
    }

    // Fallback: load all and paginate client-side
    if (!users.length && !_currentQuery) {
      const allUsers = await GCAdmin.getAllUsers();
      total = allUsers.length;
      totalPages = Math.ceil(total / PAGE_LIMIT);
      const start = (_currentPage - 1) * PAGE_LIMIT;
      users = allUsers.slice(start, start + PAGE_LIMIT);
    } else if (!users.length) {
      // Search fallback
      const allUsers = await GCAdmin.getAllUsers();
      const q = _currentQuery.toLowerCase();
      const filtered = allUsers.filter(u =>
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.firstName || '').toLowerCase().includes(q) ||
        (u.lastName || '').toLowerCase().includes(q)
      );
      total = filtered.length;
      totalPages = Math.ceil(total / PAGE_LIMIT);
      const start = (_currentPage - 1) * PAGE_LIMIT;
      users = filtered.slice(start, start + PAGE_LIMIT);
    }

    container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up">
          <div>
            <h2 class="text-lg font-bold" style="color:var(--text-green)">◉ Utilisateurs</h2>
            <p class="text-xs" style="color:var(--text-muted)">${total} inscrit(s) · page ${_currentPage}/${totalPages}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <input type="text" id="admin-user-search" class="input-field" style="max-width:200px;font-size:0.75rem" placeholder="filtrer..." value="${_escAttr(_currentQuery)}" />
            <button class="btn btn-outline btn-sm" id="admin-reset-all-crew" style="border-color:rgba(0,229,255,0.3);color:var(--cyan);font-size:0.6rem">
              ↻ RESET WEEK
            </button>
            <button class="btn btn-outline btn-sm" id="admin-apply-default-crew" style="border-color:rgba(212,175,55,0.3);color:var(--gold);font-size:0.6rem" title="Appliquer ${settings.defaultCrewQuota || 2} Crew à tous">
              ⊞ APPLIQUER DÉFAUT (${settings.defaultCrewQuota || 2})
            </button>
          </div>
        </div>
        <div id="admin-users-list" class="animate-fade-up animate-delay-1">
          ${_renderUsersTable(users)}
        </div>
        ${totalPages > 1 ? `
        <div class="flex items-center justify-between animate-fade-up animate-delay-2" style="padding:8px 0">
          <button class="btn btn-ghost btn-sm" id="admin-prev-page" ${_currentPage <= 1 ? 'disabled' : ''} style="font-size:0.65rem">◀ Précédent</button>
          <span class="text-xs" style="color:var(--text-muted)">Page ${_currentPage} / ${totalPages} · ${total} total</span>
          <button class="btn btn-ghost btn-sm" id="admin-next-page" ${_currentPage >= totalPages ? 'disabled' : ''} style="font-size:0.65rem">Suivant ▶</button>
        </div>
        ` : ''}
      </div>
    `;
    bindUserActions();
    bindBulkActions();
    bindPagination(container);
    bindServerSearch(container);
    _escAttr = _escAttr || ((s) => String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'));
  }

  function _escAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

  function _renderUsersTable(users) {
    if (users.length === 0) return '<div class="p-8 text-center" style="color:var(--text-muted)">∅ Aucun utilisateur trouvé</div>';
    let html = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Crew</th>
              <th>Scans</th>
              <th>Reset</th>
              <th>IP / Appareil</th>
              <th>Connexion</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => {
              const userSearches = u.searchesUsed || 0;
              const crew = u.crewQuota ?? 2;
              const used = u.searchesUsed || 0;
              const lastLogin = u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—';
              const resetDay = u.quotaResetDay ? new Date(u.quotaResetDay) : null;
              const now = new Date();
              const resetPassed = resetDay && now >= resetDay;
              const resetLabel = resetDay
                ? resetDay.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' })
                : '—';
              return `
                <tr data-user-id="${u.id}">
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" style="background:rgba(0,255,65,0.1);color:var(--green);border:1px solid rgba(0,255,65,0.2);font-family:var(--font-mono)">${(u.firstName?.[0] || u.username?.[0] || '?').toUpperCase()}</div>
                      <div>
                        <div class="text-xs font-medium" style="color:var(--text-primary)">${u.firstName || ''} ${u.lastName || ''}</div>
                        <div class="text-xs" style="color:var(--text-muted);font-size:0.6rem">@${u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td class="text-xs" style="color:var(--text-secondary)">${u.email}</td>
                  <td>
                    <div class="flex items-center gap-1.5">
                      <span class="badge badge-green" style="font-size:0.5rem">${used}/${crew}</span>
                      <button class="btn btn-ghost btn-sm admin-add-crew" data-user-id="${u.id}" data-username="${u.username}" title="Ajouter crew" style="font-size:0.7rem;padding:2px 6px">+</button>
                      <button class="btn btn-ghost btn-sm admin-set-crew" data-user-id="${u.id}" data-username="${u.username}" data-crew="${crew}" title="Définir crew" style="font-size:0.6rem;padding:2px 6px;color:var(--cyan)">✎</button>
                    </div>
                  </td>
                  <td style="color:var(--text-secondary)">${userSearches}</td>
                  <td>
                    <div class="flex items-center gap-1">
                      <span class="text-xs" style="color:${resetPassed ? 'var(--amber)' : 'var(--text-muted)'};font-size:0.6rem">${resetLabel}</span>
                      ${resetPassed ? '<span class="badge badge-warning" style="font-size:0.4rem">DÛ</span>' : ''}
                    </div>
                  </td>
                  <td>
                    <div class="space-y-0.5">
                      <div class="text-xs" style="color:var(--cyan);font-size:0.6rem" title="${u.registerIP || 'unknown'}">🌐 ${u.registerIP || '—'}</div>
                      <div class="text-xs" style="color:var(--text-muted);font-size:0.55rem" title="Fingerprint: ${u.fingerprint || 'N/A'}">🖥 ${(u.deviceInfo?.browser || '?')} / ${(u.deviceInfo?.os || '?')}</div>
                      <div class="text-xs" style="color:var(--text-muted);font-size:0.5rem">${u.deviceInfo?.screen || '?'} · ${u.deviceInfo?.language || '?'}</div>
                    </div>
                  </td>
                  <td>
                    <div class="text-xs" style="color:var(--text-muted);font-size:0.6rem">${lastLogin}</div>
                  </td>
                  <td>${u.banned ? '<span class="badge badge-danger" style="font-size:0.5rem">BANNED</span>' : '<span class="badge badge-success" style="font-size:0.5rem">OK</span>'}</td>
                  <td>
                    <div class="flex gap-1">
                      <button class="btn btn-ghost btn-sm admin-toggle-ban" data-user-id="${u.id}" data-banned="${!!u.banned}" title="${u.banned ? 'Débannir' : 'Bannir'}" style="color:${u.banned ? 'var(--green)' : 'var(--amber)'};font-size:0.7rem">${u.banned ? '⊕' : '⊘'}</button>
                      <button class="btn btn-ghost btn-sm admin-reset-pw" data-user-id="${u.id}" data-username="${u.username}" title="Réinitialiser mot de passe" style="color:var(--amber);font-size:0.7rem">⚿</button>
                      <button class="btn btn-ghost btn-sm admin-force-logout" data-user-id="${u.id}" data-username="${u.username}" title="Déconnecter" style="color:var(--cyan);font-size:0.7rem">⏻</button>
                      <button class="btn btn-ghost btn-sm admin-delete-user" data-user-id="${u.id}" data-username="${u.username}" title="Supprimer" style="color:var(--red);font-size:0.7rem">✕</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    return html;
  }

  function bindServerSearch(container) {
    let debounceTimer;
    document.getElementById('admin-user-search')?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        _currentQuery = e.target.value.trim();
        _currentPage = 1;
        await _loadPage(container);
      }, 400);
    });
  }

  function bindPagination(container) {
    document.getElementById('admin-prev-page')?.addEventListener('click', async () => {
      if (_currentPage > 1) { _currentPage--; await _loadPage(container); }
    });
    document.getElementById('admin-next-page')?.addEventListener('click', async () => {
      _currentPage++;
      await _loadPage(container);
    });
  }

  function bindUserActions() {
    document.querySelectorAll('.admin-add-crew').forEach(btn => {
      btn.addEventListener('click', () => showAddCrewModal(btn.dataset.userId, btn.dataset.username));
    });
    document.querySelectorAll('.admin-set-crew').forEach(btn => {
      btn.addEventListener('click', () => showSetCrewModal(btn.dataset.userId, btn.dataset.username, parseInt(btn.dataset.crew)));
    });
    document.querySelectorAll('.admin-toggle-ban').forEach(btn => {
      btn.addEventListener('click', async () => {
        const banned = btn.dataset.banned === 'true';
        const result = await GCAdmin.banUser(btn.dataset.userId, !banned);
        if (result.success) {
          GCToast.success(banned ? 'Utilisateur débanni.' : 'Utilisateur banni et déconnecté.');
          render(document.querySelector('#admin-view-container'));
        }
      });
    });
    document.querySelectorAll('.admin-reset-pw').forEach(btn => {
      btn.addEventListener('click', () => showResetPasswordModal(btn.dataset.userId, btn.dataset.username));
    });
    document.querySelectorAll('.admin-force-logout').forEach(btn => {
      btn.addEventListener('click', () => showForceLogoutModal(btn.dataset.userId, btn.dataset.username));
    });
    document.querySelectorAll('.admin-delete-user').forEach(btn => {
      btn.addEventListener('click', () => showDeleteUserModal(btn.dataset.userId, btn.dataset.username));
    });
  }

  function bindBulkActions() {
    document.getElementById('admin-reset-all-crew')?.addEventListener('click', async () => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <h3 class="font-bold text-sm mb-2" style="color:var(--cyan);font-family:var(--font-mono)">↻ RESET WEEKLY CREW</h3>
          <p class="text-xs mb-4" style="color:var(--text-muted)">Réinitialiser les Crew de TOUS les utilisateurs actifs à 0 consommé ? Leur quota total reste inchangé.</p>
          <div class="flex gap-2 justify-end">
            <button class="btn btn-ghost btn-sm modal-cancel">${t('common.cancel')}</button>
            <button class="btn btn-outline btn-sm modal-confirm" style="border-color:rgba(0,229,255,0.3);color:var(--cyan)">CONFIRMER RESET</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('.modal-cancel')?.addEventListener('click', () => overlay.remove());
      overlay.querySelector('.modal-confirm')?.addEventListener('click', async () => {
        const result = await GCAdmin.resetAllCrew();
        if (result.success) {
          GCToast.success(`Crew réinitialisés pour ${result.resetCount} utilisateur(s).`);
          overlay.remove();
          render(document.querySelector('#admin-view-container'));
        }
      });
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    });

    document.getElementById('admin-apply-default-crew')?.addEventListener('click', async () => {
      const settings = await GCAdmin.getSiteSettings();
      const defaultCrew = settings.defaultCrewQuota || 2;
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <h3 class="font-bold text-sm mb-2" style="color:var(--gold);font-family:var(--font-mono)">⊞ APPLIQUER QUOTA DÉFAUT</h3>
          <p class="text-xs mb-4" style="color:var(--text-muted)">Appliquer <strong style="color:var(--gold)">${defaultCrew} Crew</strong> comme quota à TOUS les utilisateurs actifs ?</p>
          <div class="flex gap-2 justify-end">
            <button class="btn btn-ghost btn-sm modal-cancel">${t('common.cancel')}</button>
            <button class="btn btn-outline btn-sm modal-confirm" style="border-color:rgba(212,175,55,0.3);color:var(--gold)">APPLIQUER</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('.modal-cancel')?.addEventListener('click', () => overlay.remove());
      overlay.querySelector('.modal-confirm')?.addEventListener('click', async () => {
        const result = await GCAdmin.applyDefaultCrewToAll();
        if (result.success) {
          GCToast.success(`${result.defaultCrew} Crew appliqués à ${result.updatedCount} utilisateur(s).`);
          overlay.remove();
          render(document.querySelector('#admin-view-container'));
        }
      });
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    });
  }

  function showAddCrewModal(userId, username) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3 class="font-bold text-sm mb-2" style="color:var(--text-green);font-family:var(--font-mono)">⊕ AJOUTER CREW</h3>
        <p class="text-xs mb-3" style="color:var(--text-muted)">Cible: <span style="color:var(--green)">@${username}</span></p>
        <div class="mb-3">
          <label class="block text-xs mb-1" style="color:var(--text-muted)">NOMBRE DE CREW À AJOUTER</label>
          <input type="number" id="admin-crew-amount" class="input-field" value="5" min="1" max="100" />
        </div>
        <div class="flex gap-2 justify-end">
          <button class="btn btn-ghost btn-sm modal-cancel">${t('common.cancel')}</button>
          <button class="btn btn-green btn-sm modal-confirm">+ AJOUTER</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-cancel')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('.modal-confirm')?.addEventListener('click', async () => {
      const amount = parseInt(document.getElementById('admin-crew-amount')?.value) || 5;
      const result = await GCAdmin.addCrewToUser(userId, amount);
      if (result.success) {
        GCToast.success(`+${amount} Crew → @${username} (total: ${result.newQuota})`);
        overlay.remove();
        render(document.querySelector('#admin-view-container'));
      }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  function showSetCrewModal(userId, username, currentCrew) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3 class="font-bold text-sm mb-2" style="color:var(--cyan);font-family:var(--font-mono)">✎ DÉFINIR CREW</h3>
        <p class="text-xs mb-3" style="color:var(--text-muted)">Cible: <span style="color:var(--cyan)">@${username}</span> · Actuel: <span style="color:var(--green)">${currentCrew}</span></p>
        <div class="mb-3">
          <label class="block text-xs mb-1" style="color:var(--text-muted)">NOUVEAU TOTAL DE CREW</label>
          <input type="number" id="admin-set-crew-amount" class="input-field" value="${currentCrew}" min="0" max="9999" />
        </div>
        <div class="flex gap-2 justify-end">
          <button class="btn btn-ghost btn-sm modal-cancel">${t('common.cancel')}</button>
          <button class="btn btn-outline btn-sm modal-confirm" style="border-color:rgba(0,229,255,0.3);color:var(--cyan)">DÉFINIR</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-cancel')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('.modal-confirm')?.addEventListener('click', async () => {
      const amount = parseInt(document.getElementById('admin-set-crew-amount')?.value);
      if (isNaN(amount) || amount < 0) return;
      const result = await GCAdmin.updateUserCrew(userId, amount);
      if (result.success) {
        GCToast.success(`@${username} → ${result.newQuota} Crew`);
        overlay.remove();
        render(document.querySelector('#admin-view-container'));
      }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  function showResetPasswordModal(userId, username) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3 class="font-bold text-sm mb-2" style="color:var(--amber);font-family:var(--font-mono)">⚿ RÉINITIALISER MOT DE PASSE</h3>
        <p class="text-xs mb-3" style="color:var(--text-muted)">Cible: <span style="color:var(--amber)">@${username}</span></p>
        <p class="text-xs mb-3" style="color:var(--text-muted)">L'utilisateur sera automatiquement déconnecté de toutes ses sessions.</p>
        <div class="mb-3">
          <label class="block text-xs mb-1" style="color:var(--text-muted)">NOUVEAU MOT DE PASSE</label>
          <input type="text" id="admin-new-password" class="input-field" placeholder="Minimum 8 car., majuscule, chiffre, spécial" />
        </div>
        <div class="flex gap-2 justify-end">
          <button class="btn btn-ghost btn-sm modal-cancel">${t('common.cancel')}</button>
          <button class="btn btn-outline btn-sm modal-confirm" style="border-color:rgba(255,184,0,0.3);color:var(--amber)">RÉINITIALISER</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-cancel')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('.modal-confirm')?.addEventListener('click', async () => {
      const newPw = document.getElementById('admin-new-password')?.value;
      if (!newPw) return;
      // Try Server API first
      try {
        await GCApi.adminResetPassword(userId, newPw);
      } catch {
        // localStorage fallback
        const result = await GCAuth.adminResetPassword(userId, newPw);
        if (result.error) {
          GCToast.error(result.error);
          return;
        }
      }
      GCToast.success(`Mot de passe de @${username} réinitialisé. Sessions invalidées.`);
      overlay.remove();
      render(document.querySelector('#admin-view-container'));
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  function showForceLogoutModal(userId, username) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3 class="font-bold text-sm mb-2" style="color:var(--cyan);font-family:var(--font-mono)">⏻ DÉCONNECTER UTILISATEUR</h3>
        <p class="text-xs mb-4" style="color:var(--text-muted)">Forcer la déconnexion de <span style="color:var(--cyan)">@${username}</span> ? L'utilisateur sera redirigé vers la page de connexion à son prochain chargement.</p>
        <div class="flex gap-2 justify-end">
          <button class="btn btn-ghost btn-sm modal-cancel">${t('common.cancel')}</button>
          <button class="btn btn-outline btn-sm modal-confirm" style="border-color:rgba(0,229,255,0.3);color:var(--cyan)">DÉCONNECTER</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-cancel')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('.modal-confirm')?.addEventListener('click', async () => {
      // Try Server API first
      try {
        await GCApi.adminForceLogout(userId);
      } catch {
        // localStorage fallback
        const users = await GCAdmin.getAllUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx >= 0) {
          users[idx].forceLogout = true;
          await GCStorage.set(GCAuth.USERS_KEY, users);
        }
      }
      GCToast.success(`@${username} sera déconnecté à son prochain chargement.`);
      overlay.remove();
      render(document.querySelector('#admin-view-container'));
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  function showDeleteUserModal(userId, username) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h3 class="font-bold text-sm mb-2" style="color:var(--red);font-family:var(--font-mono)">⊘ SUPPRIMER UTILISATEUR</h3>
        <p class="text-xs mb-4" style="color:var(--text-muted)">Confirmer la suppression de <span style="color:var(--red)">@${username}</span> ? Irréversible.</p>
        <div class="flex gap-2 justify-end">
          <button class="btn btn-ghost btn-sm modal-cancel">${t('common.cancel')}</button>
          <button class="btn btn-danger btn-sm modal-confirm">SUPPRIMER</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-cancel')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('.modal-confirm')?.addEventListener('click', async () => {
      await GCAdmin.deleteUser(userId);
      GCToast.info(`@${username} supprimé.`);
      overlay.remove();
      render(document.querySelector('#admin-view-container'));
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  return { render };
})();

window.GCAdminUsersSubView = AdminUsersSubView;
