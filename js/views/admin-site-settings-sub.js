// Gold_Crew — Admin Site Settings Sub-View (Terminal Style)
const CUSTOM_API_SLOTS = 6;
const AdminSiteSettingsSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  async function render(container) {
    const settings = await GCAdmin.getSiteSettings();
    const slots = settings.customApiSlots || [];

    container.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-4">
        <div class="animate-fade-up">
          <h2 class="text-lg font-bold" style="color:var(--text-green)">⚙ Paramètres Site</h2>
          <p class="text-xs" style="color:var(--text-muted)">Configuration globale de la plateforme</p>
        </div>

        <!-- Maintenance Mode -->
        <div class="animate-fade-up animate-delay-1" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:14px">
          <h3 class="text-xs font-bold mb-3" style="color:var(--text-green)">⊘ MODE MAINTENANCE</h3>
          <div class="flex items-center justify-between p-3 rounded mb-3" style="background:rgba(255,255,255,0.02)">
            <div>
              <div class="text-xs font-medium" style="color:var(--text-primary)">Activer la maintenance</div>
              <div class="text-xs" style="color:var(--text-muted);font-size:0.55rem">Seul l'admin aura accès</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="maintenance-toggle" class="sr-only peer" ${settings.maintenanceMode ? 'checked' : ''} />
              <div class="w-9 h-5 rounded-sm peer transition-colors" style="background:rgba(255,255,255,0.1)" id="maintenance-track"></div>
            </label>
          </div>
          <div id="maintenance-details" class="${settings.maintenanceMode ? '' : 'hidden'} space-y-2">
            <label class="block text-xs" style="color:var(--text-muted)">MESSAGE</label>
            <input type="text" id="maintenance-message" class="input-field" value="${settings.maintenanceMessage || 'Site en maintenance.'}" style="font-size:0.75rem" />
          </div>
        </div>

        <!-- Default Crew Quota -->
        <div class="animate-fade-up animate-delay-2" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:14px">
          <h3 class="text-xs font-bold mb-3" style="color:var(--text-green)">⊞ QUOTA PAR DÉFAUT</h3>
          <div>
            <label class="block text-xs mb-0.5" style="color:var(--text-muted)">Crew gratuits/semaine (nouveaux comptes)</label>
            <input type="number" id="default-crew" class="input-field" value="${settings.defaultCrewQuota || 2}" min="0" max="100" style="font-size:0.75rem" />
          </div>
          <div class="mt-3">
            <button class="btn btn-outline btn-sm" id="apply-crew-to-all" style="border-color:rgba(212,175,55,0.3);color:var(--gold);font-size:0.6rem">
              ⊞ APPLIQUER CE QUOTA À TOUS LES UTILISATEURS
            </button>
          </div>
        </div>

        <!-- WhatsApp Link -->
        <div class="animate-fade-up animate-delay-3" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:14px">
          <h3 class="text-xs font-bold mb-3" style="color:var(--text-green)">⊕ LIEN WHATSAPP</h3>
          <div>
            <label class="block text-xs mb-0.5" style="color:var(--text-muted)">URL chaîne WhatsApp</label>
            <input type="url" id="whatsapp-link" class="input-field" value="${settings.whatsappLink || ''}" style="font-size:0.75rem" />
          </div>
        </div>

        <!-- Custom API + URL Fields (x6) -->
        <div class="animate-fade-up animate-delay-4" style="background:#0a0a0a;border:1px solid rgba(212,175,55,0.15);border-radius:var(--radius);padding:14px">
          <h3 class="text-xs font-bold mb-1" style="color:var(--gold)">⚿ SERVICES API PERSONNALISÉS</h3>
          <p class="text-xs mb-4" style="color:var(--text-muted)">Configurez jusqu'à ${CUSTOM_API_SLOTS} services API externes (nom, URL, clé API).</p>
          <div class="space-y-3">
            ${Array.from({ length: CUSTOM_API_SLOTS }, (_, i) => {
              const slot = slots[i] || {};
              const num = i + 1;
              return `
                <div class="p-3 rounded" style="background:rgba(212,175,55,0.02);border:1px solid rgba(212,175,55,0.08)">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="badge badge-gold" style="font-size:0.5rem">${num}</span>
                    <input type="text" class="input-field flex-1" id="api-name-${num}"
                      value="${_escAttr(slot.name || '')}" placeholder="Nom du service"
                      style="font-size:0.7rem" />
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label class="block text-xs mb-0.5" style="color:var(--text-muted);font-size:0.55rem">URL</label>
                      <input type="url" class="input-field" id="api-url-${num}"
                        value="${_escAttr(slot.url || '')}" placeholder="https://api.example.com/v1"
                        style="font-size:0.7rem" />
                    </div>
                    <div>
                      <label class="block text-xs mb-0.5" style="color:var(--text-muted);font-size:0.55rem">Clé API</label>
                      <input type="password" class="input-field" id="api-key-${num}"
                        value="${slot.apiKey ? '••••••••••' : ''}" placeholder="${slot.apiKey ? 'Clé configurée' : 'sk_xxxxx...'}"
                        style="font-size:0.7rem" />
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- GitHub Token (Admin only) -->
        <div class="animate-fade-up animate-delay-5" style="background:#0a0a0a;border:1px solid rgba(139,92,246,0.2);border-radius:var(--radius);padding:14px">
          <h3 class="text-xs font-bold mb-3" style="color:var(--purple)">⊛ TOKEN GITHUB</h3>
          <p class="text-xs mb-3" style="color:var(--text-muted)">Token GitHub personnel pour l'admin. Stocké uniquement dans votre navigateur. Permet d'augmenter les limites d'API GitHub (5000 req/h au lieu de 60).</p>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs" style="color:var(--text-muted)">Statut:</span>
            <span id="github-token-status" class="badge ${settings.githubToken ? 'badge-success' : 'badge-warning'}" style="font-size:0.5rem">${settings.githubToken ? '✓ CONFIGURÉ' : '⚠ NON CONFIGURÉ'}</span>
          </div>
          <div class="flex gap-2">
            <input type="password" id="github-token" class="input-field flex-1" value="${settings.githubToken ? '••••••••••••••••' : ''}" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" style="font-size:0.75rem" />
            <button class="btn btn-sm" id="github-token-save" style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:var(--purple);font-size:0.65rem;padding:6px 14px">💾 SAUVEGARDER</button>
          </div>
          <div id="github-token-msg" class="mt-2 hidden"></div>
          <div class="mt-3 p-2 rounded text-xs" style="background:rgba(139,92,246,0.04);border:1px solid rgba(139,92,246,0.08);color:var(--text-muted)">
            <p>📝 <strong>Comment obtenir un token :</strong></p>
            <p class="mt-1">1. Allez sur <span style="color:var(--cyan)">github.com/settings/tokens</span></p>
            <p>2. Cliquez sur <strong>"Generate new token"</strong></p>
            <p>3. Cochez les permissions <span style="color:var(--text-primary)">public_repo</span> et <span style="color:var(--text-primary)">read:user</span></p>
            <p>4. Copiez le token et collez-le ici</p>
          </div>
        </div>

        <button class="btn btn-green btn-sm animate-fade-up" id="save-site-settings">💾 ENREGISTRER</button>
      </div>
    `;
    bindSettings(settings);
    bindGitHubToken(settings);
  }

  function _escAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function bindSettings(settings) {
    const toggle = document.getElementById('maintenance-toggle');
    const track = document.getElementById('maintenance-track');
    const details = document.getElementById('maintenance-details');

    if (toggle) {
      toggle.addEventListener('change', () => {
        const active = toggle.checked;
        track.style.background = active ? 'var(--green)' : 'rgba(255,255,255,0.1)';
        details.classList.toggle('hidden', !active);
      });
      if (toggle.checked) track.style.background = 'var(--green)';
    }

    document.getElementById('save-site-settings')?.addEventListener('click', async () => {
      // Collect custom API slots
      const existingSlots = settings.customApiSlots || [];
      const customApiSlots = [];
      for (let i = 1; i <= CUSTOM_API_SLOTS; i++) {
        const nameEl = document.getElementById(`api-name-${i}`);
        const urlEl = document.getElementById(`api-url-${i}`);
        const keyEl = document.getElementById(`api-key-${i}`);
        const name = nameEl?.value?.trim() || '';
        const url = urlEl?.value?.trim() || '';
        const keyVal = keyEl?.value?.trim() || '';
        // Keep existing key if the field shows dots (already configured)
        const apiKey = keyVal.includes('•') ? (existingSlots[i - 1]?.apiKey || '') : keyVal;
        customApiSlots.push({ name, url, apiKey });
      }

      const updates = {
        maintenanceMode: document.getElementById('maintenance-toggle')?.checked || false,
        maintenanceMessage: document.getElementById('maintenance-message')?.value || '',
        defaultCrewQuota: parseInt(document.getElementById('default-crew')?.value) || 2,
        whatsappLink: document.getElementById('whatsapp-link')?.value || '',
        customApiSlots,
      };
      await GCAdmin.updateSiteSettings(updates);
      GCToast.success('Paramètres enregistrés.');
    });

    document.getElementById('apply-crew-to-all')?.addEventListener('click', async () => {
      const crewValue = parseInt(document.getElementById('default-crew')?.value) || 2;
      // First save the setting
      await GCAdmin.updateSiteSettings({ defaultCrewQuota: crewValue });
      // Then apply to all users
      const result = await GCAdmin.applyDefaultCrewToAll();
      if (result.success) {
        GCToast.success(`${result.defaultCrew} Crew appliqués à ${result.updatedCount} utilisateur(s).`);
      }
    });
  }

  function bindGitHubToken(settings) {
    document.getElementById('github-token-save')?.addEventListener('click', async () => {
      const input = document.getElementById('github-token');
      const msgEl = document.getElementById('github-token-msg');
      const statusEl = document.getElementById('github-token-status');
      const value = input?.value?.trim();

      if (!value || value.includes('•')) {
        GCToast.warning('Entrez un token GitHub valide.');
        return;
      }

      // Validate basic format (ghp_, gho_, github_pat_)
      if (!/^(ghp_|gho_|github_pat_)/.test(value) && value.length < 10) {
        msgEl.innerHTML = '<div class="p-2 rounded text-xs" style="background:rgba(255,0,64,0.06);color:var(--red);border:1px solid rgba(255,0,64,0.15)">Format de token invalide. Le token doit commencer par ghp_, gho_ ou github_pat_</div>';
        msgEl.classList.remove('hidden');
        return;
      }

      // Save to site settings
      await GCAdmin.updateSiteSettings({ githubToken: value });

      // Update OSINT engine GitHub source with the token
      await GCOsintEngine.updateSource('github', { apiKey: value });

      input.value = '••••••••••••••••';
      msgEl.innerHTML = '<div class="p-2 rounded text-xs" style="background:rgba(0,255,65,0.06);color:var(--green);border:1px solid rgba(0,255,65,0.15)">✓ Token GitHub enregistré. Source GitHub activée avec authentification.</div>';
      msgEl.classList.remove('hidden');
      if (statusEl) {
        statusEl.textContent = '✓ CONFIGURÉ';
        statusEl.className = 'badge badge-success';
      }
      GCToast.success('Token GitHub sauvegardé et activé !');

      // Hide message after 4s
      setTimeout(() => { if (msgEl) msgEl.classList.add('hidden'); }, 4000);
    });
  }

  return { render };
})();

window.GCAdminSiteSettingsSubView = AdminSiteSettingsSubView;
