// Gold_Crew — Main Bootstrap
// Dark Terminal OSINT Platform

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize i18n (load locale catalog)
  await GCI18n.init();

  // Detect server availability early (so all subsequent API calls fail fast)
  try { await GCApi.req('GET', '/api/ping'); } catch {}

  // Initialize admin module FIRST — merges centralized API keys
  // Must run before OSINT engine so keys are in place when sources load
  await GCAdmin.init();

  // Initialize default promo codes
  await GCAuth.initDefaultPromo();

  // Initialize OSINT engine (loads default sources, merges centralized keys)
  await GCOsintEngine.getSources();

  // Load admin Mistral key override (persists across sessions)
  try {
    const override = await GCStorage.get('gc_mistral_key_override');
    if (override) GCMistralAI.setKey(override);
  } catch {}

  // Load centralized Mistral key from server (available to ALL authenticated users)
  if (GCApi.getUserToken()) {
    try {
      const srcResult = await GCApi.req('GET', '/api/public/sources');
      if (srcResult.success) {
        if (srcResult.mistralApiKey) GCMistralAI.setKey(srcResult.mistralApiKey);
        if (srcResult.customAiPrompt) GCMistralAI.setCustomPrompt(srcResult.customAiPrompt);
      }
    } catch {}
  }

  // Load GitHub token from admin settings (direct, for admin only)
  try {
    const settings = await GCAdmin.getSiteSettings();
    if (settings.githubToken) {
      await GCOsintEngine.updateSource('github', { apiKey: settings.githubToken });
    }
  } catch {}

  // Register user views
  GCRouter.register('landing', GCLandingView.render);
  GCRouter.register('auth', GCAuthView.render);
  GCRouter.register('dashboard', GCDashboardView.render);

  // Register admin views
  GCRouter.register('admin-login', GCAdminLoginView.render);
  GCRouter.register('admin-panel', GCAdminPanelView.render);

  // Check existing session
  const hasSession = await GCAuth.checkSession();
  const hasAdminSession = await GCAdmin.checkSession();

  // Check maintenance mode — on interroge le serveur directement (endpoint public),
  // car GCAdmin.getSiteSettings() ne reflète que le stockage local du navigateur
  // de l'admin et ne serait jamais vu par les autres visiteurs.
  let settings;
  try {
    settings = await GCApi.getPublicSettings();
  } catch {
    settings = await GCAdmin.getSiteSettings();
  }
  // Sanitize maintenance message to prevent XSS (admin-controlled field)
  function _escMaint(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  }
  if (settings.maintenanceMode && !hasAdminSession) {
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen flex flex-col" style="background:var(--bg-primary)">
        <!-- Top bar: admin access left -->
        <div class="flex items-center justify-between px-4 py-3" style="border-bottom:1px solid var(--border-subtle)">
          <button id="maint-admin-btn" title="Administration" aria-label="Administration" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem;padding:8px;border-radius:var(--radius);transition:all 0.15s ease">
            ⚙
          </button>
          <span style="color:var(--text-muted);font-size:0.65rem;font-family:var(--font-mono)">SYSTEM MAINTENANCE</span>
          <div style="width:40px"></div>
        </div>

        <!-- Main content -->
        <div class="flex-1 flex items-center justify-center px-4 py-8">
          <div class="w-full animate-fade-up" style="max-width:460px">
            <!-- Logo & status -->
            <div class="text-center mb-8">
              <div class="ascii-block text-center mb-3" style="font-size:0.45rem;line-height:1.05;color:rgba(255,0,64,0.2)"> ██╗     ██╗  ██╗ ██╗ ███╗   ██╗████████╗
 ██║     ██║  ██║ ██║ ████╗  ██║╚══██╔══╝
 ██║     ███████║ ██║ ██╔██╗ ██║   ██║   
 ██║     ██╔══██║ ██║ ██║╚██╗██║   ██║   
 ███████╗██║  ██║ ██║ ██║ ╚████║   ██║   
 ╚══════╝╚═╝  ╚═╝ ╚═╝ ╚═╝  ╚═══╝   ╚═╝</div>
              <div class="text-3xl mb-2" style="color:var(--red)">⊘</div>
              <h1 class="text-lg font-bold glitch-text" data-text="GOLD_CREW" style="color:var(--green);font-family:var(--font-mono)">GOLD_CREW</h1>
              <div class="mt-3" style="color:var(--red);font-size:0.75rem;font-family:var(--font-mono)">
                <span class="badge badge-danger">● MAINTENANCE</span>
              </div>
              <p class="text-xs mt-3" style="color:var(--text-muted);max-width:320px;margin-left:auto;margin-right:auto">
                ${_escMaint(settings.maintenanceMessage) || 'Le système est en cours de maintenance. Nous revenons très bientôt.'}
              </p>
            </div>

            <!-- WhatsApp channels -->
            <div class="mb-6 p-4" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius)">
              <h3 class="text-center font-bold text-xs mb-3" style="color:var(--text-green);text-transform:uppercase;letter-spacing:0.1em">💬 Rejoignez nos chaînes WhatsApp</h3>
              <div class="flex flex-col sm:flex-row items-center justify-center gap-2">
                <a href="https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T" target="_blank" rel="noopener" class="btn btn-gold btn-sm flex-1 w-full sm:w-auto text-center">
                  📲 Gold_Crew OSINT
                </a>
                <a href="https://whatsapp.com/channel/0029VbBT7FdLCoX1TDyQQb1B" target="_blank" rel="noopener" class="btn btn-outline btn-sm flex-1 w-full sm:w-auto text-center" style="border-color:rgba(37,211,102,0.3);color:#25d366">
                  📲 Digital Crew
                </a>
                <a href="https://whatsapp.com/channel/0029Vb5ioJzA2pLD4CZOCq2V" target="_blank" rel="noopener" class="btn btn-outline btn-sm flex-1 w-full sm:w-auto text-center" style="border-color:rgba(191,0,255,0.3);color:#bf00ff">
                  📲 Hackers Academy X
                </a>
              </div>
            </div>

            <!-- Info button -->
            <div class="text-center">
              <button id="maint-info-btn" class="btn btn-outline btn-sm">ℹ Informations sur le projet</button>
            </div>
          </div>
        </div>
      </div>
      <!-- Info modal -->
      <div id="maint-info-modal" class="modal-overlay" style="display:none">
        <div class="modal" style="max-width:480px">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold" style="color:var(--green);font-family:var(--font-mono)">ℹ Gold_Crew OSINT</h3>
            <button id="maint-info-close" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.1rem;padding:4px">×</button>
          </div>
          <div style="color:var(--text-secondary);font-size:0.8rem;line-height:1.7">
            <p class="mb-3"><strong style="color:var(--text-primary)">Gold_Crew</strong> est une plateforme OSINT (Open Source Intelligence) professionnelle créée par <strong style="color:var(--gold)">Mcamara</strong>.</p>
            <p class="mb-3">Elle permet d'explorer les données publiques en toute légalité grâce à <strong style="color:var(--text-primary)">43+ sources OSINT</strong> intégrées et une intelligence artificielle intégrée (<strong style="color:var(--text-primary)">Gold_Crew AI</strong>).</p>
            <div class="mb-3 p-3" style="background:rgba(0,255,65,0.03);border:1px solid var(--border-subtle);border-radius:var(--radius)">
              <p class="text-xs" style="color:var(--green);font-weight:700;margin-bottom:4px">Fonctionnalités :</p>
              <ul style="list-style:none;padding:0;font-size:0.75rem">
                <li style="color:var(--text-secondary);padding:2px 0">▸ Recherche multi-sources (noms, emails, téléphones, domaines, IP…)</li>
                <li style="color:var(--text-secondary);padding:2px 0">▸ Analyse IA détaillée via Gold_Crew AI</li>
                <li style="color:var(--text-secondary);padding:2px 0">▸ Historique, favoris et export PDF/CSV</li>
                <li style="color:var(--text-secondary);padding:2px 0">▸ 100% légal et éthique</li>
              </ul>
            </div>
            <p class="text-xs" style="color:var(--text-muted)">Créateur : <span style="color:var(--gold)">Mcamara</span> · © 2024 Gold_Crew — Tous droits réservés.</p>
          </div>
          <div class="mt-5 text-center">
            <button id="maint-info-ok" class="btn btn-outline btn-sm">Compris</button>
          </div>
        </div>
      </div>
    `;
    // Bind admin access
    document.getElementById('maint-admin-btn').addEventListener('click', () => {
      GCRouter.navigate('admin-login');
    });
    // Bind info modal
    const infoModal = document.getElementById('maint-info-modal');
    const openInfo = () => { infoModal.style.display = 'flex'; };
    const closeInfo = () => { infoModal.style.display = 'none'; };
    document.getElementById('maint-info-btn').addEventListener('click', openInfo);
    document.getElementById('maint-info-close').addEventListener('click', closeInfo);
    document.getElementById('maint-info-ok').addEventListener('click', closeInfo);
    infoModal.addEventListener('click', (e) => { if (e.target === infoModal) closeInfo(); });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') { closeInfo(); document.removeEventListener('keydown', escHandler); }
    });
    return;
  }

  if (hasAdminSession) {
    GCRouter.navigate('admin-panel');
  } else if (hasSession) {
    GCRouter.navigate('dashboard');
  } else {
    GCRouter.navigate('landing');
  }
});
