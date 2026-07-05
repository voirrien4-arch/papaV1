// Gold_Crew — Admin OSINT Sources Management Sub-View
const AdminOsintSourcesSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  async function render(container) {
    const sources = await GCOsintEngine.getSources();

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-5">
        <div class="animate-fade-up flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold" style="color:var(--text-green)">⌬ Sources OSINT</h2>
            <p class="text-xs mt-0.5" style="color:var(--text-muted)">Configurer les APIs de recherche open source</p>
          </div>
          <button class="btn btn-outline btn-sm" id="add-custom-source">+ Source secrète</button>
        </div>

        <!-- Sources list -->
        <div class="space-y-3 animate-fade-up animate-delay-1" id="sources-list">
          ${sources.map(s => renderSourceCard(s)).join('')}
        </div>

        <!-- API key test area -->
        <div class="glass-card p-5 animate-fade-up animate-delay-2">
          <h3 class="font-bold text-sm mb-3" style="color:var(--text-green)">🧪 Tester une source</h3>
          <div class="flex gap-3 flex-wrap">
            <select id="test-source" class="input-field" style="max-width:200px">
              ${sources.filter(s => s.enabled).map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
            </select>
            <input type="text" id="test-query" class="input-field flex-1" placeholder="Entrez un terme de test..." style="min-width:150px" />
            <button class="btn btn-green btn-sm" id="test-btn">▶ Tester</button>
          </div>
          <div id="test-result" class="mt-3 hidden"></div>
        </div>
      </div>
    `;

    bindEvents(sources);
  }

  function renderSourceCard(source) {
    const hasKey = !!source.apiKey;
    const hasUrl = !!source.apiUrl;
    const needsKey = source.requiresKey;
    const isReady = source.enabled && (!needsKey || hasKey);
    const isCustom = source.id.startsWith('custom_');

    return `
      <div class="glass-card p-5 source-card" data-source-id="${source.id}" style="border-color:${source.enabled ? 'rgba(0,255,65,0.15)' : 'rgba(255,255,255,0.05)'}">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            <span class="text-xl">${source.icon}</span>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm" style="color:var(--text-primary)">${source.name}</span>
                <span class="source-status ${source.enabled ? (isReady ? 'active' : 'error') : 'inactive'}"></span>
                ${isCustom ? '<span class="badge badge-warning" style="font-size:0.55rem">CUSTOM</span>' : ''}
              </div>
              <p class="text-xs mt-0.5" style="color:var(--text-muted)">${source.description}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-ghost btn-sm source-toggle" data-id="${source.id}" data-enabled="${source.enabled}">
              ${source.enabled ? '🟢 ON' : '⚫ OFF'}
            </button>
            ${isCustom ? `<button class="btn btn-ghost btn-sm source-delete" data-id="${source.id}" style="color:var(--danger)">✕</button>` : ''}
          </div>
        </div>

        <!-- Config area (collapsible) -->
        <div class="source-config ${source.enabled ? '' : 'hidden'}" data-config-id="${source.id}">
          <div class="border-t pt-3 mt-1" style="border-color:rgba(255,255,255,0.04)">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${needsKey ? `
                <div>
                  <label class="block text-xs font-medium mb-1" style="color:var(--text-muted)">API Key</label>
                  <div class="flex gap-2">
                    <input type="password" class="input-field source-apikey flex-1" data-id="${source.id}"
                      value="${hasKey ? '••••••••••' : ''}" placeholder="${hasKey ? 'Clé configurée' : 'Entrer la clé API...'}" />
                    <button class="btn btn-ghost btn-sm source-save-key" data-id="${source.id}" title="Enregistrer">💾</button>
                  </div>
                </div>
              ` : `
                <div>
                  <span class="text-xs" style="color:var(--text-muted)">🔑 Pas de clé requise (API publique)</span>
                </div>
              `}

              ${source.id === 'google' ? `
                <div>
                  <label class="block text-xs font-medium mb-1" style="color:var(--text-muted)">Search Engine ID (cx)</label>
                  <input type="text" class="input-field source-cx" data-id="${source.id}"
                    value="${source.apiCx || ''}" placeholder="ex: a1b2c3d4e5f6g7h8i" />
                </div>
              ` : ''}

              ${isCustom ? `
                <div>
                  <label class="block text-xs font-medium mb-1" style="color:var(--text-muted)">URL de l'API</label>
                  <input type="url" class="input-field source-url" data-id="${source.id}"
                    value="${source.apiUrl || ''}" placeholder="https://api.example.com/search?q={query}" />
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1" style="color:var(--text-muted)">Nom de la source</label>
                  <input type="text" class="input-field source-name" data-id="${source.id}"
                    value="${source.name}" placeholder="Mon API" />
                </div>
              ` : ''}
            </div>

            <div class="mt-3 flex items-center gap-3 flex-wrap">
              <span class="text-xs" style="color:var(--text-muted)">Types:</span>
              ${source.searchTypes.map(st => `<span class="badge badge-green" style="font-size:0.55rem">${st}</span>`).join('')}
              <span class="text-xs ml-auto" style="color:var(--text-muted)">${source.rateLimit}</span>
            </div>

            <div class="mt-3 flex gap-2">
              <button class="btn btn-green btn-sm source-save" data-id="${source.id}">💾 Enregistrer</button>
              ${!needsKey && source.id !== 'github' ? '' : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bindEvents(sources) {
    // Toggle source visibility
    document.querySelectorAll('.source-toggle').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const enabled = btn.dataset.enabled === 'true';
        await GCAdmin.setSourceEnabled(id, !enabled);
        render(document.getElementById('admin-view-container'));
        GCToast[!enabled ? 'success' : 'info'](`Source ${!enabled ? 'activée' : 'désactivée'}.`);
      });
    });

    // Save individual source config
    document.querySelectorAll('.source-save').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const updates = {};

        const apiKeyEl = document.querySelector(`.source-apikey[data-id="${id}"]`);
        if (apiKeyEl && apiKeyEl.value && !apiKeyEl.value.includes('•')) {
          await GCAdmin.setSourceApiKey(id, apiKeyEl.value.trim());
        }

        const cxEl = document.querySelector(`.source-cx[data-id="${id}"]`);
        if (cxEl) updates.apiCx = cxEl.value.trim();

        const urlEl = document.querySelector(`.source-url[data-id="${id}"]`);
        if (urlEl) updates.apiUrl = urlEl.value.trim();

        const nameEl = document.querySelector(`.source-name[data-id="${id}"]`);
        if (nameEl) updates.name = nameEl.value.trim();

        if (cxEl && cxEl.value) await GCAdmin.setSourceApiKey('google_cx', cxEl.value.trim());
        if (urlEl || nameEl) await GCOsintEngine.updateSource(id, updates);
        GCToast.success(`Configuration de ${id} enregistrée.`);
        render(document.getElementById('admin-view-container'));
      });
    });

    // Save API key only
    document.querySelectorAll('.source-save-key').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const el = document.querySelector(`.source-apikey[data-id="${id}"]`);
        if (!el || !el.value || el.value.includes('•')) {
          GCToast.warning('Entrez une nouvelle clé API.');
          return;
        }
        await GCAdmin.setSourceApiKey(id, el.value.trim());
        GCToast.success('Clé API enregistrée.');
        render(document.getElementById('admin-view-container'));
      });
    });

    // Delete custom source
    document.querySelectorAll('.source-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Supprimer cette source ?')) return;
        await GCOsintEngine.removeSource(btn.dataset.id);
        GCToast.info('Source supprimée.');
        render(document.getElementById('admin-view-container'));
      });
    });

    // Add custom source modal
    document.getElementById('add-custom-source')?.addEventListener('click', () => showAddSourceModal());

    // Test source
    document.getElementById('test-btn')?.addEventListener('click', async () => {
      const sourceId = document.getElementById('test-source')?.value;
      const query = document.getElementById('test-query')?.value.trim();
      if (!query) { GCToast.warning('Entrez un terme de test.'); return; }

      const btn = document.getElementById('test-btn');
      const resultDiv = document.getElementById('test-result');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:14px;height:14px"></div>';
      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = '<p class="text-xs" style="color:var(--text-muted)">Test en cours...</p>';

      try {
        const source = (await GCOsintEngine.getSources()).find(s => s.id === sourceId);
        const results = await GCOsintEngine.querySource(source, source.searchTypes[0], query);
        resultDiv.innerHTML = `
          <div class="rounded-lg p-3" style="background:rgba(0,255,65,0.04);border:1px solid rgba(0,255,65,0.1)">
            <p class="text-xs font-bold mb-2" style="color:var(--green)">✓ ${results.length} résultat(s) trouvé(s)</p>
            <pre class="text-xs overflow-auto" style="color:var(--text-secondary);max-height:200px;white-space:pre-wrap">${JSON.stringify(results.slice(0, 3), null, 2)}</pre>
          </div>
        `;
      } catch (err) {
        resultDiv.innerHTML = `
          <div class="rounded-lg p-3" style="background:rgba(255,0,64,0.04);border:1px solid rgba(255,0,64,0.1)">
            <p class="text-xs" style="color:var(--red)">✕ Erreur: ${err.message}</p>
          </div>
        `;
      }

      btn.disabled = false;
      btn.innerHTML = '▶ Tester';
    });
  }

  function showAddSourceModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:500px">
        <h3 class="font-bold mb-4" style="color:var(--text-green)">🔒 Ajouter une source secrète</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs mb-1" style="color:var(--text-muted)">Nom</label>
            <input type="text" id="new-source-name" class="input-field" placeholder="Mon API Secrète" />
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:var(--text-muted)">URL de l'API (utilisez {query} et {type})</label>
            <input type="url" id="new-source-url" class="input-field" placeholder="https://api.example.com/v1/search?q={query}&type={type}" />
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:var(--text-muted)">Clé API</label>
            <input type="password" id="new-source-key" class="input-field" placeholder="sk-..." />
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:var(--text-muted)">Description</label>
            <input type="text" id="new-source-desc" class="input-field" placeholder="Description de la source" />
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:var(--text-muted)">Types de recherche supportés</label>
            <div class="flex flex-wrap gap-2 mt-1" id="new-source-types">
              ${['name','fullname','email','phone','username','keyword','domain','ip','url'].map(t => `
                <label class="flex items-center gap-1 text-xs cursor-pointer" style="color:var(--text-secondary)">
                  <input type="checkbox" value="${t}" checked class="accent-green-500" /> ${t}
                </label>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="flex gap-2 mt-5">
          <button class="btn btn-green btn-sm flex-1" id="new-source-save">Ajouter</button>
          <button class="btn btn-ghost btn-sm" id="new-source-cancel">Annuler</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#new-source-cancel')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#new-source-save')?.addEventListener('click', async () => {
      const name = overlay.querySelector('#new-source-name')?.value.trim();
      const apiUrl = overlay.querySelector('#new-source-url')?.value.trim();
      const apiKey = overlay.querySelector('#new-source-key')?.value.trim();
      const description = overlay.querySelector('#new-source-desc')?.value.trim();
      const types = Array.from(overlay.querySelectorAll('#new-source-types input:checked')).map(c => c.value);

      if (!name || !apiUrl) { GCToast.warning('Nom et URL sont requis.'); return; }
      if (types.length === 0) { GCToast.warning('Sélectionnez au moins un type de recherche.'); return; }

      await GCOsintEngine.addCustomSource({ name, apiUrl, apiKey, description, searchTypes: types });
      overlay.remove();
      GCToast.success(`Source "${name}" ajoutée.`);
      render(document.getElementById('admin-view-container'));
    });
  }

  return { render };
})();

window.GCAdminOsintSourcesSubView = AdminOsintSourcesSubView;
