// Gold_Crew — Admin API Keys & External Services Sub-View
const AdminApiKeysSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  async function render(container) {
    const keys = await GCAdmin.getApiKeys();
    const users = await GCAdmin.getAllUsers();
    const sources = await GCOsintEngine.getSources();
    const keySources = sources.filter(s => s.requiresKey);
    const freeSources = sources.filter(s => !s.requiresKey);

    container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-5">
        <!-- Header -->
        <div class="animate-fade-up">
          <h2 class="text-lg font-bold" style="color:var(--text-green)">⚿ Configuration API & Services</h2>
          <p class="text-xs" style="color:var(--text-muted)">${keySources.length} service(s) avec clé · ${freeSources.length} service(s) gratuit(s) · ${keys.filter(k => k.status === 'pending').length} demande(s) en attente</p>
        </div>

        <!-- Gold_Crew AI (Mistral) Section -->
        <div class="animate-fade-up animate-delay-1 p-4 rounded" style="background:rgba(0,229,255,0.03);border:1px solid rgba(0,229,255,0.12)">
          <div class="flex items-center gap-2 mb-3">
            <span style="color:var(--cyan);font-size:1rem">◈</span>
            <span class="text-sm font-bold" style="color:var(--cyan)">GOLD_CREW AI (MISTRAL)</span>
            <span id="mistral-status-badge" class="badge" style="font-size:0.5rem"></span>
          </div>
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs" style="color:var(--text-muted)">Clé actuelle:</span>
            <code id="mistral-key-display" class="text-xs px-2 py-1 rounded" style="background:rgba(0,0,0,0.3);color:var(--text-primary);font-family:var(--font-mono)"></code>
          </div>
          <div class="flex gap-2">
            <input type="password" id="mistral-key-input" class="input-field flex-1" placeholder="Nouvelle clé API Mistral..." style="font-size:0.75rem" />
            <button class="btn btn-sm" id="mistral-key-save" style="background:rgba(0,229,255,0.15);border:1px solid rgba(0,229,255,0.3);color:var(--cyan);font-size:0.65rem;padding:6px 14px">↻ METTRE À JOUR</button>
          </div>
        </div>

        <!-- External Services Grid -->
        <div class="animate-fade-up animate-delay-2">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold" style="color:var(--green)">⬡ Services Externes OSINT</h3>
            <span class="badge badge-green" style="font-size:0.55rem">${keySources.length} avec clé API</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${keySources.map(s => renderServiceCard(s)).join('')}
          </div>
          ${freeSources.length > 0 ? `
            <div class="mt-3 p-3 rounded" style="background:rgba(0,255,65,0.02);border:1px solid var(--border-subtle)">
              <p class="text-xs mb-2 font-bold" style="color:var(--text-muted)">✓ Services gratuits (actifs sans clé) :</p>
              <div class="flex flex-wrap gap-2">
                ${freeSources.map(s => {
                  const isOn = s.enabled;
                  return `<span class="badge ${isOn ? 'badge-success' : 'badge-warning'}" style="font-size:0.55rem">${s.icon} ${s.name} ${isOn ? '●' : '○'}</span>`;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- User API Key Requests -->
        <div class="animate-fade-up animate-delay-3">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold" style="color:var(--green)">⚿ Demandes de clés API utilisateurs</h3>
            <span class="text-xs" style="color:var(--text-muted)">${keys.length} clé(s) · ${keys.filter(k => k.status === 'pending').length} en attente</span>
          </div>
          <div id="admin-api-keys-list">
            ${keys.length === 0
              ? '<div class="p-6 text-center rounded" style="background:rgba(0,255,65,0.02);border:1px solid var(--border-subtle);color:var(--text-muted)">∅ Aucune demande de clé API utilisateur pour le moment.</div>'
              : renderUserKeys(keys, users)
            }
          </div>
        </div>
      </div>
    `;

    bindMistralStatus();
    bindServiceCards();
    bindApiKeyActions();
  }

  // ── Service Card Renderer ─────────────────────────
  function renderServiceCard(source) {
    const hasKey = !!source.apiKey;
    return `
      <div class="p-3 rounded" style="background:rgba(0,255,65,0.02);border:1px solid var(--border-subtle)">
        <div class="flex items-center gap-2 mb-2">
          <span style="font-size:1rem">${source.icon}</span>
          <span class="font-bold text-xs" style="color:var(--text-primary)">${source.name}</span>
          <span class="source-status ${hasKey ? 'active' : 'error'}"></span>
          <span class="badge ${hasKey ? 'badge-success' : 'badge-warning'}" style="font-size:0.45rem">${hasKey ? '✓ CONFIGURÉ' : '⚠ REQUIS'}</span>
        </div>
        <p class="text-xs mb-2" style="color:var(--text-muted);font-size:0.6rem">${source.description}</p>
        <div class="space-y-2">
          <div class="flex gap-1.5">
            <input type="password" class="input-field flex-1 svc-apikey" data-id="${source.id}"
              value="${hasKey ? '••••••••••' : ''}" placeholder="${hasKey ? 'Clé configurée — entrez une nouvelle clé pour remplacer' : 'Entrer la clé API...'}" style="font-size:0.7rem" />
            <button class="btn btn-sm svc-save-key" data-id="${source.id}" style="background:rgba(0,255,65,0.1);border:1px solid rgba(0,255,65,0.2);color:var(--green);font-size:0.6rem;padding:4px 10px">💾</button>
          </div>
          ${source.id === 'google' ? `
            <div class="flex gap-1.5">
              <input type="text" class="input-field flex-1 svc-cx" data-id="${source.id}"
                value="${source.apiCx || ''}" placeholder="Search Engine ID (cx)" style="font-size:0.7rem" />
              <button class="btn btn-sm svc-save-cx" data-id="${source.id}" style="background:rgba(0,229,255,0.1);border:1px solid rgba(0,229,255,0.2);color:var(--cyan);font-size:0.6rem;padding:4px 10px">💾</button>
            </div>
          ` : ''}
        </div>
        <div class="mt-2 flex items-center justify-between">
          <div class="flex flex-wrap gap-1">
            ${source.searchTypes.map(st => `<span class="badge badge-green" style="font-size:0.45rem">${st}</span>`).join('')}
          </div>
          <span class="text-xs" style="color:var(--text-muted);font-size:0.5rem">${source.rateLimit}</span>
        </div>
      </div>
    `;
  }

  // ── User API Keys Renderer ────────────────────────
  function renderUserKeys(keys, users) {
    return '<div class="space-y-2">' + keys.map(k => {
      const user = users.find(u => u.id === k.userId);
      const statusColors = { pending: 'badge-info', approved: 'badge-success', revoked: 'badge-danger' };
      const statusLabels = { pending: 'PENDING', approved: 'APPROVED', revoked: 'REVOKED' };
      return `
        <div class="p-3 rounded" style="background:rgba(0,255,65,0.02);border:1px solid var(--border-subtle)">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <code class="text-xs px-2 py-0.5 rounded" style="background:rgba(255,255,255,0.04);color:var(--text-primary);font-family:var(--font-mono)">${k.key.slice(0, 16)}...${k.key.slice(-8)}</code>
                <span class="badge ${statusColors[k.status]}" style="font-size:0.5rem">${statusLabels[k.status]}</span>
              </div>
              <div class="text-xs" style="color:var(--text-muted);font-size:0.55rem">
                Par ${user ? '@' + user.username : '—'} · ${new Date(k.requestedAt).toLocaleString('fr-FR')}${k.description ? ' · ' + k.description : ''}
              </div>
            </div>
            <div class="flex gap-1">
              ${k.status === 'pending' ? `<button class="btn btn-sm admin-approve-key" data-key-id="${k.id}" style="background:rgba(0,255,65,0.1);border:1px solid rgba(0,255,65,0.2);color:var(--green);font-size:0.65rem;padding:4px 10px">✓ APPROUVER</button>` : ''}
              ${k.status === 'approved' ? `<button class="btn btn-sm admin-revoke-key" data-key-id="${k.id}" style="background:rgba(255,0,64,0.1);border:1px solid rgba(255,0,64,0.2);color:var(--red);font-size:0.65rem;padding:4px 10px">⊘ RÉVOQUER</button>` : ''}
            </div>
          </div>
          ${k.status === 'approved' ? `
            <div class="flex items-center gap-2 p-2 rounded mt-1" style="background:rgba(0,255,65,0.03);border:1px solid rgba(0,255,65,0.08)">
              <code class="text-xs flex-1" style="color:var(--green);word-break:break-all;font-family:var(--font-mono)">${k.key}</code>
              <button class="btn btn-ghost btn-sm copy-api-key" data-key="${k.key}" style="font-size:0.7rem">📋</button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('') + '</div>';
  }

  // ── Gold_Crew AI (Mistral) Key Management ─────────
  function bindMistralStatus() {
    const badge = document.getElementById('mistral-status-badge');
    const display = document.getElementById('mistral-key-display');
    const input = document.getElementById('mistral-key-input');
    const saveBtn = document.getElementById('mistral-key-save');

    if (!badge || !display) return;

    function refreshMistralStatus() {
      const ks = GCMistralAI.getKeyStatus();
      if (ks.configured) {
        badge.textContent = '✓ CONFIGURÉE';
        badge.className = 'badge badge-success';
        display.textContent = ks.masked;
        display.style.color = 'var(--green)';
      } else {
        badge.textContent = '⊘ NON CONFIGURÉE';
        badge.className = 'badge badge-danger';
        display.textContent = 'Aucune clé';
        display.style.color = 'var(--red)';
      }
    }

    refreshMistralStatus();

    saveBtn?.addEventListener('click', async () => {
      const newKey = input?.value?.trim();
      if (!newKey) {
        GCToast.warning('Entrez une clé API Mistral.');
        return;
      }
      GCMistralAI.setKey(newKey);
      await GCStorage.set('gc_mistral_key_override', newKey);
      await GCAdmin.updateSiteSettings({ mistralApiKey: newKey });
      input.value = '';
      refreshMistralStatus();
      GCToast.success('Clé API Gold_Crew AI mise à jour.');
    });
  }

  // ── External Service API Key Binding ──────────────
  function bindServiceCards() {
    document.querySelectorAll('.svc-save-key').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const el = document.querySelector(`.svc-apikey[data-id="${id}"]`);
        if (!el || !el.value || el.value.includes('•')) {
          GCToast.warning('Entrez une nouvelle clé API.');
          return;
        }
        await GCAdmin.setSourceApiKey(id, el.value.trim());
        GCToast.success(`Clé API pour ${id} enregistrée globalement — tous les utilisateurs en bénéficieront.`);
        render(document.getElementById('admin-view-container'));
      });
    });

    document.querySelectorAll('.svc-save-cx').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const el = document.querySelector(`.svc-cx[data-id="${id}"]`);
        if (!el) return;
        await GCAdmin.setSourceApiKey('google_cx', el.value.trim());
        GCToast.success('Search Engine ID enregistré.');
        render(document.getElementById('admin-view-container'));
      });
    });
  }

  // ── User API Key Actions ──────────────────────────
  function bindApiKeyActions() {
    document.querySelectorAll('.admin-approve-key').forEach(btn => {
      btn.addEventListener('click', async () => {
        const result = await GCAdmin.approveApiKey(btn.dataset.keyId);
        if (result.success) {
          GCToast.success('Clé API approuvée.');
          render(document.querySelector('#admin-view-container'));
        }
      });
    });
    document.querySelectorAll('.admin-revoke-key').forEach(btn => {
      btn.addEventListener('click', async () => {
        await GCAdmin.revokeApiKey(btn.dataset.keyId);
        GCToast.info('Clé API révoquée.');
        render(document.querySelector('#admin-view-container'));
      });
    });
    document.querySelectorAll('.copy-api-key').forEach(btn => {
      btn.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(btn.dataset.key); GCToast.success('Copié.'); }
        catch { GCToast.error('Impossible de copier.'); }
      });
    });
  }

  return { render };
})();

window.GCAdminApiKeysSubView = AdminApiKeysSubView;
