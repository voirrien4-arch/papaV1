// Gold_Crew — Auth Views (Dark Terminal Style)
const AuthView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  const COUNTRIES = ['France','Belgique','Suisse','Canada','Maroc','Algérie','Tunisie','Sénégal','Côte d\'Ivoire','Cameroun','RDC','Madagascar','Luxembourg','Haïti','Autre'];

  async function render(container, params) {
    const mode = params?.mode || 'login';
    container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center px-4 py-10">
        <div class="w-full max-w-md">
          <!-- Back -->
          <button id="auth-back" class="btn btn-ghost btn-sm mb-4" style="color:var(--text-muted);font-size:0.7rem">
            ← ${t('common.back')}
          </button>

          <!-- Logo -->
          <div class="text-center mb-6 animate-fade-up">
            <div class="text-2xl font-black mb-2" style="color:var(--green);font-family:var(--font-mono)">◈ GOLD_CREW</div>
            <p id="auth-subtitle" class="text-xs" style="color:var(--text-muted)"></p>
          </div>

          <!-- Form container -->
          <div id="auth-form" class="animate-fade-up animate-delay-1" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:20px"></div>

          <!-- Toggle link -->
          <div id="auth-toggle" class="text-center mt-4 text-xs animate-fade-up animate-delay-2" style="color:var(--text-muted)"></div>
        </div>
      </div>
    `;
    document.getElementById('auth-back')?.addEventListener('click', () => GCRouter.navigate('landing'));
    switchView(mode);
  }

  function switchView(mode, viewParams) {
    const subEl = document.getElementById('auth-subtitle');
    const formEl = document.getElementById('auth-form');
    const toggleEl = document.getElementById('auth-toggle');
    if (!formEl) return;

    switch (mode) {
      case 'login':
        subEl.textContent = t('auth.login_subtitle');
        formEl.innerHTML = renderLoginForm();
        toggleEl.innerHTML = `${t('auth.no_account')} <button id="to-register" class="font-bold" style="color:var(--green);background:none;border:none;cursor:pointer">${t('landing.cta_register')}</button>`;
        bindLogin();
        document.getElementById('to-register')?.addEventListener('click', () => switchView('register'));
        break;

      case 'register':
        subEl.textContent = t('auth.register_subtitle');
        formEl.innerHTML = renderRegisterForm();
        toggleEl.innerHTML = `${t('auth.has_account')} <button id="to-login" class="font-bold" style="color:var(--green);background:none;border:none;cursor:pointer">${t('auth.login_btn')}</button>`;
        bindRegister();
        document.getElementById('to-login')?.addEventListener('click', () => switchView('login'));
        break;

      case 'forgot':
        subEl.textContent = t('auth.forgot_subtitle');
        formEl.innerHTML = renderForgotForm();
        toggleEl.innerHTML = `<button id="to-login2" class="font-bold" style="color:var(--green);background:none;border:none;cursor:pointer">${t('auth.back_login')}</button>`;
        bindForgot();
        document.getElementById('to-login2')?.addEventListener('click', () => switchView('login'));
        break;

      case '2fa':
        {
          const userId = viewParams?.userId;
          const email = viewParams?.email || '';
          subEl.textContent = 'Vérification en deux étapes';
          formEl.innerHTML = render2FAForm();
          toggleEl.innerHTML = `<button id="to-login3" class="font-bold" style="color:var(--green);background:none;border:none;cursor:pointer">${t('auth.back_login')}</button>`;
          bind2FA(userId);
          document.getElementById('to-login3')?.addEventListener('click', () => switchView('login'));
        }
        break;
    }
  }

  function renderLoginForm() {
    return `
      <form id="login-form" class="space-y-3" novalidate>
        <div id="lockout-notice" class="hidden p-3 rounded text-center" style="background:rgba(255,184,0,0.06);border:1px solid rgba(255,184,0,0.15)">
          <div class="text-sm font-bold mb-1" style="color:var(--amber)">⊛ Compte temporairement verrouillé</div>
          <div id="lockout-timer" class="text-xs" style="color:var(--text-muted)"></div>
        </div>
        <div>
          <label class="block text-xs mb-1" style="color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em">${t('auth.email')}</label>
          <input type="email" id="login-email" class="input-field" placeholder="user@target.com" required autocomplete="email" />
        </div>
        <div>
          <label class="block text-xs mb-1" style="color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em">${t('auth.password')}</label>
          <input type="password" id="login-password" class="input-field" placeholder="••••••••" required autocomplete="current-password" />
        </div>
        <div class="flex items-center justify-between text-xs">
          <label class="flex items-center gap-1.5 cursor-pointer" style="color:var(--text-muted)">
            <input type="checkbox" id="remember-me" style="accent-color:var(--green)" /> ${t('auth.remember_me')}
          </label>
          <button type="button" id="forgot-link" style="color:var(--green);background:none;border:none;cursor:pointer;font-size:0.7rem">${t('auth.forgot_title')}</button>
        </div>
        <div id="login-error" class="text-xs hidden p-2 rounded" style="background:rgba(255,0,64,0.06);color:var(--red);border:1px solid rgba(255,0,64,0.15)"></div>
        <button type="submit" class="btn btn-green w-full" id="login-submit" style="margin-top:8px">▸ ${t('auth.login_btn')}</button>
      </form>
    `;
  }

  function renderRegisterForm() {
    return `
      <form id="register-form" class="space-y-3" novalidate>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs mb-1" style="color:var(--text-muted)">${t('auth.first_name')}</label>
            <input type="text" id="reg-firstname" class="input-field" placeholder="Jean" required />
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:var(--text-muted)">${t('auth.last_name')}</label>
            <input type="text" id="reg-lastname" class="input-field" placeholder="Dupont" required />
          </div>
        </div>
        <div>
          <label class="block text-xs mb-1" style="color:var(--text-muted)">${t('auth.username')}</label>
          <input type="text" id="reg-username" class="input-field" placeholder="jeandupont" required autocomplete="username" />
        </div>
        <div>
          <label class="block text-xs mb-1" style="color:var(--text-muted)">${t('auth.email')}</label>
          <input type="email" id="reg-email" class="input-field" placeholder="user@target.com" required autocomplete="email" />
        </div>
        <div>
          <label class="block text-xs mb-1" style="color:var(--text-muted)">${t('auth.password')}</label>
          <input type="password" id="reg-password" class="input-field" placeholder="••••••••" required autocomplete="new-password" />
          <p class="text-xs mt-0.5" style="color:var(--text-muted);font-size:0.6rem">${t('auth.password_requirements')}</p>
        </div>
        <div>
          <label class="block text-xs mb-1" style="color:var(--text-muted)">${t('auth.confirm_password')}</label>
          <input type="password" id="reg-confirm" class="input-field" placeholder="••••••••" required autocomplete="new-password" />
        </div>
        <div>
          <label class="block text-xs mb-1" style="color:var(--text-muted)">${t('auth.phone')}</label>
          <input type="tel" id="reg-phone" class="input-field" placeholder="+33 6 12 34 56 78" />
        </div>
        <div>
          <label class="block text-xs mb-1" style="color:var(--text-muted)">${t('auth.country')}</label>
          <select id="reg-country" class="input-field">
            <option value="">—</option>
            ${COUNTRIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div id="register-error" class="text-xs hidden p-2 rounded" style="background:rgba(255,0,64,0.06);color:var(--red);border:1px solid rgba(255,0,64,0.15)"></div>
        <button type="submit" class="btn btn-green w-full" id="register-submit" style="margin-top:8px">▸ ${t('auth.register_btn')}</button>
      </form>
    `;
  }

  function renderForgotForm() {
    return `
      <form id="forgot-form" class="space-y-3" novalidate>
        <div>
          <label class="block text-xs mb-1" style="color:var(--text-muted)">${t('auth.email')}</label>
          <input type="email" id="forgot-email" class="input-field" placeholder="user@target.com" required />
        </div>
        <div id="forgot-msg" class="text-xs hidden p-2 rounded" style="background:rgba(0,255,65,0.06);color:var(--green);border:1px solid rgba(0,255,65,0.15)"></div>
        <button type="submit" class="btn btn-green w-full">▸ ${t('auth.forgot_btn')}</button>
      </form>
    `;
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
  }

  function hideError(id) {
    document.getElementById(id)?.classList.add('hidden');
  }

  function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    if (loading) btn.innerHTML = '<div class="spinner" style="width:14px;height:14px"></div>';
  }

  function bindLogin() {
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError('login-error');
      const email = document.getElementById('login-email')?.value.trim();
      const password = document.getElementById('login-password')?.value;
      if (!email || !password) { showError('login-error', 'Remplir tous les champs.'); return; }
      setLoading('login-submit', true);
      await new Promise(r => setTimeout(r, 500));
      const result = await GCAuth.login(email, password);
      if (result.twoFactorRequired) {
        setLoading('login-submit', false);
        switchView('2fa', { userId: result.userId, email });
        return;
      }
      setLoading('login-submit', false);
      document.getElementById('login-submit').textContent = '▸ ' + t('auth.login_btn');
      if (result.error) {
        if (result.lockedOut) {
          showLockout(result.remainingMs, 'login-email');
        }
        showError('login-error', result.error);
        return;
      }
      GCToast.success('Connexion réussie.');
      await GCAuth.addNotification('new_login', 'Nouvelle connexion à votre compte');
      GCRouter.navigate('dashboard');
    });
    document.getElementById('forgot-link')?.addEventListener('click', () => switchView('forgot'));
  }

  function bindRegister() {
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError('register-error');
      const data = {
        firstName: document.getElementById('reg-firstname')?.value.trim(),
        lastName: document.getElementById('reg-lastname')?.value.trim(),
        username: document.getElementById('reg-username')?.value.trim(),
        email: document.getElementById('reg-email')?.value.trim(),
        password: document.getElementById('reg-password')?.value,
        phone: document.getElementById('reg-phone')?.value.trim(),
        country: document.getElementById('reg-country')?.value,
      };
      const confirm = document.getElementById('reg-confirm')?.value;
      if (data.password !== confirm) { showError('register-error', 'Les mots de passe ne correspondent pas.'); return; }
      setLoading('register-submit', true);
      await new Promise(r => setTimeout(r, 600));
      const result = await GCAuth.register(data);
      setLoading('register-submit', false);
      document.getElementById('register-submit').textContent = '▸ ' + t('auth.register_btn');
      if (result.error) {
        if (result.duplicate) {
          const icon = result.reason === 'device' ? '🖥️' : '🌐';
          showError('register-error', `${icon} ${result.error}`);
        } else {
          showError('register-error', result.error);
        }
        return;
      }
      GCToast.success('Compte créé. Bienvenue.');
      const loginResult = await GCAuth.login(data.email, data.password);
      if (loginResult.success) GCRouter.navigate('dashboard');
    });
  }

  function bindForgot() {
    document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email')?.value.trim();
      if (!email) return;
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:14px;height:14px"></div>';
      await new Promise(r => setTimeout(r, 800));
      btn.disabled = false;
      btn.textContent = '▸ ' + t('auth.forgot_btn');
      const msgEl = document.getElementById('forgot-msg');
      if (msgEl) {
        msgEl.textContent = 'Si un compte existe, un lien a été envoyé.';
        msgEl.classList.remove('hidden');
      }
    });
  }

  function render2FAForm() {
    return `
      <form id="tfa-form" class="space-y-4" novalidate>
        <div class="text-center mb-2">
          <div class="text-2xl mb-2">🔐</div>
          <p class="text-xs" style="color:var(--text-muted)">Ouvrez votre application d'authentification (Google Authenticator, Authy, etc.) et entrez le code à 6 chiffres.</p>
        </div>
        <div>
          <label class="block text-xs mb-1" style="color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em">Code de vérification</label>
          <input type="text" id="tfa-code" class="input-field text-center" placeholder="000000" maxlength="6"
            pattern="[0-9]{6}" autocomplete="one-time-code" inputmode="numeric"
            style="font-size:1.4rem;letter-spacing:0.4em;padding:12px" />
        </div>
        <div id="tfa-error" class="text-xs hidden p-2 rounded" style="background:rgba(255,0,64,0.06);color:var(--red);border:1px solid rgba(255,0,64,0.15)"></div>
        <button type="submit" class="btn btn-green w-full" id="tfa-submit" style="margin-top:8px">▸ Vérifier</button>
      </form>
    `;
  }

  function bind2FA(userId) {
    const codeInput = document.getElementById('tfa-code');
    setTimeout(() => codeInput?.focus(), 100);

    document.getElementById('tfa-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError('tfa-error');
      const code = codeInput?.value?.trim();
      if (!code || code.length !== 6) { showError('tfa-error', 'Entrez un code à 6 chiffres.'); return; }
      setLoading('tfa-submit', true);
      const valid = await GCAuth.verifyLogin2FA(userId, code);
      setLoading('tfa-submit', false);
      document.getElementById('tfa-submit').textContent = '▸ Vérifier';
      if (!valid) {
        showError('tfa-error', 'Code invalide ou expiré. Réessayez.');
        codeInput.value = '';
        codeInput.focus();
        return;
      }
      // 2FA verified — complete login
      await GCAuth.login2FAComplete(userId);
      GCToast.success('Connexion réussie.');
      await GCAuth.addNotification('new_login', 'Nouvelle connexion à votre compte');
      GCRouter.navigate('dashboard');
    });
  }

  // ── Lockout Countdown ────────────────────────────
  let _lockoutInterval = null;

  function showLockout(remainingMs, inputId) {
    const notice = document.getElementById('lockout-notice');
    const timer = document.getElementById('lockout-timer');
    const submitBtn = document.getElementById('login-submit');
    const input = document.getElementById(inputId);

    if (!notice || !timer) return;

    // Clear any existing countdown
    if (_lockoutInterval) clearInterval(_lockoutInterval);

    notice.classList.remove('hidden');
    if (submitBtn) { submitBtn.disabled = true; }
    if (input) { input.disabled = true; }

    let remaining = remainingMs;

    function updateTimer() {
      if (remaining <= 0) {
        clearInterval(_lockoutInterval);
        _lockoutInterval = null;
        notice.classList.add('hidden');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '▸ ' + t('auth.login_btn');
        }
        if (input) { input.disabled = false; }
        return;
      }
      const timeStr = GCBruteForce.formatLockoutTime(remaining);
      timer.textContent = `Réessayez dans ${timeStr}`;
      remaining -= 1000;
    }

    updateTimer();
    _lockoutInterval = setInterval(updateTimer, 1000);
  }

  function checkInitialLockout() {
    // On login view load, check if there's an active lockout for the email
    const email = document.getElementById('login-email')?.value?.trim();
    if (email) {
      GCBruteForce.checkLimit('user_login:' + email.toLowerCase()).then(limit => {
        if (!limit.allowed) showLockout(limit.remainingMs, 'login-email');
      }).catch(() => {});
    }
  }

  return { render };
})();

window.GCAuthView = AuthView;
