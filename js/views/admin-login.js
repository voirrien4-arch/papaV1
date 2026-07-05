// Gold_Crew — Admin Login View (Terminal Style)
const AdminLoginView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  let _adminLockoutInterval = null;

  function render(container) {
    container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center px-4 py-10" style="background:var(--bg-primary)">
        <div class="w-full max-w-md">
          <button id="admin-back" class="btn btn-ghost btn-sm mb-4" style="color:var(--text-muted);font-size:0.7rem">← ${t('common.back')}</button>
          <div class="text-center mb-6 animate-fade-up">
            <div class="text-xl font-black mb-2" style="color:var(--red);font-family:var(--font-mono)">⊛ ADMIN_PANEL</div>
            <p class="text-xs" style="color:var(--text-muted)">Gold_Crew // Restricted Access</p>
          </div>
          <div class="animate-fade-up animate-delay-1" style="background:#0a0a0a;border:1px solid rgba(255,0,64,0.15);border-radius:var(--radius);padding:20px">
            <form id="admin-login-form" class="space-y-3" novalidate>
              <div>
                <label class="block text-xs mb-1" style="color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em">Username</label>
                <input type="text" id="admin-username" class="input-field" placeholder="admin" required autocomplete="username" />
              </div>
              <div>
                <label class="block text-xs mb-1" style="color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em">Password</label>
                <input type="password" id="admin-password" class="input-field" placeholder="••••••••" required autocomplete="current-password" />
              </div>
              <div id="admin-lockout-notice" class="hidden p-3 rounded text-center" style="background:rgba(255,184,0,0.06);border:1px solid rgba(255,184,0,0.15)">
                <div class="text-sm font-bold mb-1" style="color:var(--amber)">⊛ Compte admin temporairement verrouillé</div>
                <div id="admin-lockout-timer" class="text-xs" style="color:var(--text-muted)"></div>
              </div>
              <div id="admin-login-error" class="text-xs hidden p-2 rounded" style="background:rgba(255,0,64,0.06);color:var(--red);border:1px solid rgba(255,0,64,0.15)"></div>
              <button type="submit" class="btn btn-green w-full" id="admin-login-submit" style="margin-top:8px">▸ ROOT LOGIN</button>
            </form>
          </div>
          <div class="text-center mt-4 text-xs animate-fade-up animate-delay-2" style="color:var(--text-muted);font-size:0.6rem">
            CLASSIFIED // AUTHORIZED PERSONNEL ONLY
          </div>
        </div>
      </div>
    `;
    document.getElementById('admin-back')?.addEventListener('click', () => GCRouter.navigate('landing'));
    document.getElementById('admin-login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('admin-login-error');
      errEl.classList.add('hidden');
      const username = document.getElementById('admin-username')?.value.trim();
      const password = document.getElementById('admin-password')?.value;
      if (!username || !password) { errEl.textContent = 'Remplissez tous les champs.'; errEl.classList.remove('hidden'); return; }
      const btn = document.getElementById('admin-login-submit');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:14px;height:14px"></div>';
      await new Promise(r => setTimeout(r, 500));
      const result = await GCAdmin.login(username, password);
      btn.disabled = false;
      btn.textContent = '▸ ROOT LOGIN';
      if (result.lockedOut) {
        showAdminLockout(result.remainingMs);
        errEl.textContent = result.error;
        errEl.classList.remove('hidden');
        return;
      }
      if (result.error) {
        if (result.lockedOut) {
          showAdminLockout(result.remainingMs);
        }
        errEl.textContent = result.error;
        errEl.classList.remove('hidden');
        return;
      }
      GCToast.success('Accès root accordé.');
      GCRouter.navigate('admin-panel');
    });
  }

  function showAdminLockout(remainingMs) {
    const notice = document.getElementById('admin-lockout-notice');
    const timer = document.getElementById('admin-lockout-timer');
    const submitBtn = document.getElementById('admin-login-submit');
    const usernameInput = document.getElementById('admin-username');
    const passwordInput = document.getElementById('admin-password');

    if (!notice || !timer) return;

    if (_adminLockoutInterval) clearInterval(_adminLockoutInterval);

    notice.classList.remove('hidden');
    if (submitBtn) submitBtn.disabled = true;
    if (usernameInput) usernameInput.disabled = true;
    if (passwordInput) passwordInput.disabled = true;

    let remaining = remainingMs;

    function updateTimer() {
      if (remaining <= 0) {
        clearInterval(_adminLockoutInterval);
        _adminLockoutInterval = null;
        notice.classList.add('hidden');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '▸ ROOT LOGIN'; }
        if (usernameInput) usernameInput.disabled = false;
        if (passwordInput) passwordInput.disabled = false;
        return;
      }
      timer.textContent = `Réessayez dans ${GCBruteForce.formatLockoutTime(remaining)}`;
      remaining -= 1000;
    }

    updateTimer();
    _adminLockoutInterval = setInterval(updateTimer, 1000);
  }

  return { render };
})();

window.GCAdminLoginView = AdminLoginView;
