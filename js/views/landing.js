// Gold_Crew — Landing Page View (Dark Web Terminal)
const LandingView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  let _adminModalLockoutInterval = null;

  async function render(container) {
    container.innerHTML = `
      <div id="landing-page" class="min-h-screen flex flex-col scanline-effect">
        <!-- Header -->
        <header class="fixed top-0 w-full z-50" style="background:rgba(6,6,6,0.95);border-bottom:1px solid var(--border-subtle);backdrop-filter:blur(8px)">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span style="color:var(--green);font-weight:800;font-size:0.9rem;font-family:var(--font-mono)">◈</span>
              <span class="font-bold text-sm tracking-wider" style="color:var(--green);font-family:var(--font-mono)">GOLD_CREW</span>
              <span class="text-xs" style="color:var(--text-muted)">// OSINT</span>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-ghost btn-sm" id="landing-admin-icon" title="System" aria-label="System settings" style="font-size:0.75rem;padding:6px 8px;color:var(--text-muted);opacity:0.35;transition:opacity 0.2s">⚙</button>
              <button class="btn btn-ghost btn-sm" id="landing-login" style="font-size:0.7rem">${t('landing.cta_login')}</button>
              <button class="btn btn-outline btn-sm" id="landing-register" style="font-size:0.7rem">${t('landing.cta_register')}</button>
            </div>
          </div>
        </header>

        <!-- Hero -->
        <section class="flex-1 flex items-center justify-center pt-16 pb-12 px-4">
          <div class="max-w-4xl mx-auto text-center">
            <!-- ASCII art -->
            <div class="ascii-block animate-fade-up mb-6 hidden sm:block" style="color:rgba(0,255,65,0.12)">
 ██████╗  ██████╗ ██╗     ██████╗ ██████╗██████╗ ███████╗██╗    ██╗
██╔════╝ ██╔═══██╗██║     ██╔══██╗██╔══██╗██╔══██╗██╔════╝██║    ██║
██║  ███╗██║   ██║██║     ██║  ██║██████╔╝██║  ██║█████╗  ██║ █╗ ██║
██║   ██║██║   ██║██║     ██║  ██║██╔══██╗██║  ██║██╔══╝  ██║███╗██║
╚██████╔╝╚██████╔╝███████╗██████╔╝██║  ██║██████╔╝███████╗╚███╔███╔╝
 ╚═════╝  ╚═════╝ ╚══════╝╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝ ╚══╝╚══╝
            </div>

            <div class="animate-fade-up animate-delay-1">
              <span class="badge badge-green mb-4 inline-flex">${t('landing.eyebrow')}</span>
            </div>

            <h1 class="animate-fade-up animate-delay-2 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 glitch-text"
              data-text="GOLD_CREW" style="color:var(--green);font-family:var(--font-mono)">
              GOLD_CREW
            </h1>

            <p class="animate-fade-up animate-delay-3 text-sm sm:text-base max-w-xl mx-auto mb-8" style="color:var(--text-secondary)">
              ${t('landing.subtitle')}
            </p>

            <div class="animate-fade-up animate-delay-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button class="btn btn-green btn-lg" id="hero-register">
                <span>▸</span> ${t('landing.cta_register')}
              </button>
              <button class="btn btn-outline btn-lg" id="hero-login">
                ${t('landing.cta_login')}
              </button>
            </div>

            <!-- Terminal animation -->
            <div class="animate-fade-up animate-delay-5 mt-12 text-left max-w-2xl mx-auto" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:16px;font-family:var(--font-mono)">
              <div class="flex items-center gap-2 mb-3 pb-2" style="border-bottom:1px solid rgba(0,255,65,0.06)">
                <div class="w-2 h-2 rounded-full" style="background:var(--red)"></div>
                <div class="w-2 h-2 rounded-full" style="background:var(--amber)"></div>
                <div class="w-2 h-2 rounded-full" style="background:var(--green)"></div>
                <span class="text-xs ml-2" style="color:var(--text-muted)">gold_crew@osint:~$</span>
              </div>
              <div id="terminal-lines" class="space-y-1 text-xs">
                <div class="terminal-line" style="animation-delay:0.5s"><span style="color:var(--green)">$</span> <span style="color:var(--text-muted)">nmap -sV --script osint 0.0.0.0/0</span></div>
                <div class="terminal-line" style="animation-delay:1.0s"><span style="color:var(--green)">[+]</span> <span style="color:var(--text-secondary)">Initializing OSINT engine v3.0...</span></div>
                <div class="terminal-line" style="animation-delay:1.5s"><span style="color:var(--green)">[+]</span> <span style="color:var(--text-secondary)">GitHub API .............. connected</span></div>
                <div class="terminal-line" style="animation-delay:2.0s"><span style="color:var(--green)">[+]</span> <span style="color:var(--text-secondary)">Google Dorks ............ connected</span></div>
                <div class="terminal-line" style="animation-delay:2.5s"><span style="color:var(--amber)">[!]</span> <span style="color:var(--text-secondary)">Facebook Graph .......... awaiting key</span></div>
                <div class="terminal-line" style="animation-delay:3.0s"><span style="color:var(--amber)">[!]</span> <span style="color:var(--text-secondary)">TikTok API .............. awaiting key</span></div>
                <div class="terminal-line" style="animation-delay:3.5s"><span style="color:var(--cyan)">[*]</span> <span style="color:var(--text-secondary)">Secret source ........... CLASSIFIED</span></div>
                <div class="terminal-line" style="animation-delay:4.0s"><span style="color:var(--green)">$</span> <span style="color:var(--text-primary)">gold_crew --status --verbose</span><span class="terminal-cursor"></span></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Features -->
        <section class="py-12 px-4 border-t" style="border-color:var(--border-subtle)">
          <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            ${renderFeatureCard('⊡', t('landing.feature1_title'), t('landing.feature1_desc'), 'animate-delay-1')}
            ${renderFeatureCard('◈', t('landing.feature2_title'), t('landing.feature2_desc'), 'animate-delay-2')}
            ${renderFeatureCard('⊠', t('landing.feature3_title'), t('landing.feature3_desc'), 'animate-delay-3')}
          </div>
        </section>

        <!-- Stats -->
        <section class="py-10 px-4 border-t" style="border-color:var(--border-subtle)">
          <div class="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
            ${renderStatCard('12,847', t('landing.stats_searches'))}
            ${renderStatCard('3,291', t('landing.stats_users'))}
            ${renderStatCard('43+', t('landing.stats_sources'))}
            ${renderStatCard('99.9%', t('landing.stats_uptime'))}
          </div>
        </section>

        <!-- About -->
        <section class="py-10 px-4 border-t" style="border-color:var(--border-subtle)">
          <div class="max-w-3xl mx-auto text-center">
            <h2 class="text-lg sm:text-xl font-bold mb-4" style="color:var(--green)">${t('landing.about_title')}</h2>
            <p class="text-sm leading-relaxed" style="color:var(--text-secondary)">${t('landing.about_text')}</p>
          </div>
        </section>

        <!-- Footer -->
        <footer class="py-6 px-4 border-t" style="border-color:var(--border-subtle)">
          <div class="max-w-4xl mx-auto">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div class="flex items-center gap-2">
                <span style="color:var(--green);font-family:var(--font-mono);font-weight:800;font-size:0.8rem">◈ GOLD_CREW</span>
              </div>
              <nav class="flex flex-wrap items-center justify-center gap-4 text-xs" style="color:var(--text-muted)">
                <a href="#" class="hover:text-white transition">${t('landing.footer_terms')}</a>
                <a href="#" class="hover:text-white transition">${t('landing.footer_privacy')}</a>
                <a href="#" class="hover:text-white transition">${t('landing.footer_contact')}</a>
              </nav>
            </div>
            <div class="text-center text-xs" style="color:var(--text-muted)">
              <p>${t('app.copyright')}</p>
              <p class="mt-1">${t('landing.footer_creator')}</p>
            </div>
          </div>
        </footer>
      </div>

      <!-- Admin Login Modal (hidden) -->
      <div id="admin-login-modal" class="modal-overlay" style="display:none">
        <div class="modal" style="max-width:400px" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span style="color:var(--red);font-size:0.9rem">⊛</span>
              <h3 class="font-bold text-sm" style="color:var(--red);font-family:var(--font-mono)">ADMIN_PANEL</h3>
            </div>
            <button id="admin-modal-close" aria-label="Fermer" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.1rem;padding:4px">×</button>
          </div>
          <form id="admin-modal-form" class="space-y-3" novalidate>
            <div>
              <label class="block text-xs mb-1" style="color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em">Username</label>
              <input type="text" id="admin-modal-username" class="input-field" placeholder="admin" required autocomplete="username" />
            </div>
            <div>
              <label class="block text-xs mb-1" style="color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em">Password</label>
              <input type="password" id="admin-modal-password" class="input-field" placeholder="••••••••" required autocomplete="current-password" />
            </div>
            <div id="admin-modal-lockout" class="hidden p-3 rounded text-center" style="background:rgba(255,184,0,0.06);border:1px solid rgba(255,184,0,0.15)">
              <div class="text-xs font-bold mb-1" style="color:var(--amber)">${t('auth.lockout_admin_title')}</div>
              <div id="admin-modal-lockout-timer" class="text-xs" style="color:var(--text-muted)"></div>
            </div>
            <div id="admin-modal-error" class="text-xs hidden p-2 rounded" style="background:rgba(255,0,64,0.06);color:var(--red);border:1px solid rgba(255,0,64,0.15)"></div>
            <button type="submit" class="btn btn-green w-full btn-sm" id="admin-modal-submit">▸ ROOT LOGIN</button>
          </form>
          <div class="text-center mt-3 text-xs" style="color:var(--text-muted);font-size:0.55rem">
            CLASSIFIED // AUTHORIZED PERSONNEL ONLY
          </div>
        </div>
      </div>
    `;
    bindEvents();
    bindAdminModal();
  }

  function renderFeatureCard(icon, title, desc, delayClass) {
    return `
      <div class="glass-card p-5 animate-fade-up ${delayClass} hover:border-green-500/20 transition-all">
        <div class="text-xl mb-3" style="color:var(--green)">${icon}</div>
        <h3 class="font-bold text-sm mb-1.5" style="color:var(--text-primary)">${title}</h3>
        <p class="text-xs" style="color:var(--text-secondary)">${desc}</p>
      </div>
    `;
  }

  function renderStatCard(value, label) {
    return `
      <div class="stat-card text-center animate-fade-up">
        <div class="text-xl sm:text-2xl font-black mb-0.5" style="color:var(--green)">${value}</div>
        <div class="text-xs uppercase tracking-wider" style="color:var(--text-muted);font-size:0.6rem">${label}</div>
      </div>
    `;
  }

  function bindEvents() {
    ['landing-login', 'hero-login'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => GCRouter.navigate('auth', { mode: 'login' }));
    });
    ['landing-register', 'hero-register'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => GCRouter.navigate('auth', { mode: 'register' }));
    });
    // Admin icon: open admin login modal (subtle, top-right)
    document.getElementById('landing-admin-icon')?.addEventListener('click', () => {
      const modal = document.getElementById('admin-login-modal');
      modal.style.display = 'flex';
    });
  }

  function bindAdminModal() {
    const modal = document.getElementById('admin-login-modal');
    const closeModal = () => {
      modal.style.display = 'none';
      const errEl = document.getElementById('admin-modal-error');
      const lockEl = document.getElementById('admin-modal-lockout');
      if (errEl) errEl.classList.add('hidden');
      if (lockEl) lockEl.classList.add('hidden');
      const u = document.getElementById('admin-modal-username');
      const p = document.getElementById('admin-modal-password');
      if (u) u.value = '';
      if (p) p.value = '';
      if (u) u.disabled = false;
      if (p) p.disabled = false;
      const btn = document.getElementById('admin-modal-submit');
      if (btn) { btn.disabled = false; btn.textContent = '▸ ROOT LOGIN'; }
    };

    document.getElementById('admin-modal-close')?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.style.display === 'flex') closeModal();
    });

    document.getElementById('admin-modal-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('admin-modal-error');
      errEl.classList.add('hidden');
      const username = document.getElementById('admin-modal-username')?.value.trim();
      const password = document.getElementById('admin-modal-password')?.value;
      if (!username || !password) {
        errEl.textContent = 'Remplissez tous les champs.';
        errEl.classList.remove('hidden');
        return;
      }
      const btn = document.getElementById('admin-modal-submit');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:14px;height:14px"></div>';
      await new Promise(r => setTimeout(r, 500));
      const result = await GCAdmin.login(username, password);
      btn.disabled = false;
      btn.textContent = '▸ ROOT LOGIN';
      if (result.error) {
        if (result.lockedOut) showAdminModalLockout(result.remainingMs);
        errEl.textContent = result.error;
        errEl.classList.remove('hidden');
        return;
      }
      closeModal();
      GCToast.success('Accès root accordé.');
      GCRouter.navigate('admin-panel');
    });
  }

  function showAdminModalLockout(remainingMs) {
    const notice = document.getElementById('admin-modal-lockout');
    const timer = document.getElementById('admin-modal-lockout-timer');
    const submitBtn = document.getElementById('admin-modal-submit');
    const usernameInput = document.getElementById('admin-modal-username');
    const passwordInput = document.getElementById('admin-modal-password');

    if (!notice || !timer) return;
    if (_adminModalLockoutInterval) clearInterval(_adminModalLockoutInterval);

    notice.classList.remove('hidden');
    if (submitBtn) submitBtn.disabled = true;
    if (usernameInput) usernameInput.disabled = true;
    if (passwordInput) passwordInput.disabled = true;

    let remaining = remainingMs;
    function updateTimer() {
      if (remaining <= 0) {
        clearInterval(_adminModalLockoutInterval);
        _adminModalLockoutInterval = null;
        notice.classList.add('hidden');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '▸ ROOT LOGIN'; }
        if (usernameInput) usernameInput.disabled = false;
        if (passwordInput) passwordInput.disabled = false;
        return;
      }
      timer.textContent = t('auth.lockout_retry_in', { time: GCBruteForce.formatLockoutTime(remaining) });
      remaining -= 1000;
    }
    updateTimer();
    _adminModalLockoutInterval = setInterval(updateTimer, 1000);
  }

  return { render };
})();

window.GCLandingView = LandingView;
