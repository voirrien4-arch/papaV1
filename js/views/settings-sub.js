// Gold_Crew — Settings Sub-View (with real TOTP 2FA + WhatsApp channel)
const SettingsSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  function render(container) {
    const user = GCState.getUser();
    container.innerHTML = `
      <div class="max-w-2xl mx-auto space-y-6">
        <h2 class="text-xl font-bold animate-fade-up" style="color:var(--text-primary)">${t('settings.title')}</h2>

        <!-- Language -->
        <div class="glass-card p-6 animate-fade-up animate-delay-1">
          <h3 class="font-bold mb-4" style="color:var(--text-primary)">🌍 ${t('settings.language')}</h3>
          <div class="space-y-2" id="lang-list">${renderLanguageList()}</div>
        </div>

        <!-- Security -->
        <div class="glass-card p-6 animate-fade-up animate-delay-2">
          <h3 class="font-bold mb-4" style="color:var(--text-primary)">🔒 ${t('settings.security')}</h3>
          <!-- Change password -->
          <form id="password-form" class="space-y-3 mb-6">
            <h4 class="text-sm font-medium" style="color:var(--text-secondary)">${t('settings.change_password')}</h4>
            <input type="password" id="settings-current-pw" class="input-field" placeholder="${t('settings.current_password')}" autocomplete="current-password" />
            <input type="password" id="settings-new-pw" class="input-field" placeholder="${t('settings.new_password')}" autocomplete="new-password" />
            <input type="password" id="settings-confirm-pw" class="input-field" placeholder="${t('settings.confirm_new_password')}" autocomplete="new-password" />
            <div id="pw-msg" class="hidden"></div>
            <button type="submit" class="btn btn-outline btn-sm">${t('settings.change_password')}</button>
          </form>

          <!-- 2FA Section -->
          <div id="twofa-section">
            ${render2FASection(user)}
          </div>
        </div>

        <!-- WhatsApp Channel & Crew -->
        <div class="glass-card p-6 animate-fade-up animate-delay-3" style="border-color:rgba(37,211,102,0.15)">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded flex items-center justify-center" style="background:rgba(37,211,102,0.1);border:1px solid rgba(37,211,102,0.2)">
              <span style="font-size:1.2rem">💬</span>
            </div>
            <div>
              <h3 class="font-bold text-sm" style="color:var(--text-primary)">${t('settings.whatsapp_title')}</h3>
              <p class="text-xs" style="color:var(--text-muted)">${t('settings.whatsapp_subtitle')}</p>
            </div>
          </div>

          <!-- Explanation steps -->
          <div class="space-y-3 mb-5">
            <div class="flex gap-3 items-start p-3 rounded-lg" style="background:rgba(37,211,102,0.04);border:1px solid rgba(37,211,102,0.08)">
              <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style="background:rgba(37,211,102,0.15);color:#25d366">1</div>
              <div>
                <p class="text-sm font-medium" style="color:var(--text-primary)">${t('settings.whatsapp_step1_title')}</p>
                <p class="text-xs mt-0.5" style="color:var(--text-muted)">${t('settings.whatsapp_step1_desc')}</p>
              </div>
            </div>

            <div class="flex gap-3 items-start p-3 rounded-lg" style="background:rgba(37,211,102,0.04);border:1px solid rgba(37,211,102,0.08)">
              <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style="background:rgba(37,211,102,0.15);color:#25d366">2</div>
              <div>
                <p class="text-sm font-medium" style="color:var(--text-primary)">${t('settings.whatsapp_step2_title')}</p>
                <p class="text-xs mt-0.5" style="color:var(--text-muted)">${t('settings.whatsapp_step2_desc')}</p>
              </div>
            </div>

            <div class="flex gap-3 items-start p-3 rounded-lg" style="background:rgba(37,211,102,0.04);border:1px solid rgba(37,211,102,0.08)">
              <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style="background:rgba(37,211,102,0.15);color:#25d366">3</div>
              <div>
                <p class="text-sm font-medium" style="color:var(--text-primary)">${t('settings.whatsapp_step3_title')}</p>
                <p class="text-xs mt-0.5" style="color:var(--text-muted)">${t('settings.whatsapp_step3_desc')}</p>
              </div>
            </div>
          </div>

          <!-- Promo hint -->
          <div class="p-3 rounded-lg mb-4" style="background:rgba(255,184,0,0.06);border:1px solid rgba(255,184,0,0.12)">
            <div class="flex items-center gap-2 mb-1">
              <span style="color:var(--amber);font-size:0.8rem">◈</span>
              <span class="text-xs font-bold" style="color:var(--amber)">${t('settings.promo_location_title')}</span>
            </div>
            <p class="text-xs" style="color:var(--text-secondary)">${t('settings.promo_location_desc')}</p>
          </div>

          <!-- CTA buttons — both channels -->
          <div class="space-y-2 flex flex-col gap-2">
            <a href="https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T" target="_blank" rel="noopener" class="btn btn-gold w-full justify-center text-center">
              📲 ${t('settings.whatsapp_channel_goldcrew')}
            </a>
            <a href="https://whatsapp.com/channel/0029VbBT7FdLCoX1TDyQQb1B" target="_blank" rel="noopener" class="btn btn-outline w-full justify-center text-center" style="border-color:rgba(37,211,102,0.3);color:#25d366">
              📲 ${t('settings.whatsapp_channel_digitalcrew')}
            </a>
            <a href="https://whatsapp.com/channel/0029Vb5ioJzA2pLD4CZOCq2V" target="_blank" rel="noopener" class="btn btn-outline w-full justify-center text-center" style="border-color:rgba(191,0,255,0.3);color:#bf00ff">
              📲 ${t('settings.whatsapp_channel_hackersacademy')}
            </a>
          </div>
        </div>
      </div>
    `;
    bindPasswordForm();
    bind2FA();
    bindLanguagePicker();
  }

  function render2FASection(user) {
    if (user?.twoFactor) {
      return `
        <div class="border-t pt-5 mb-2" style="border-color:var(--border-subtle)">
          <h4 class="text-sm font-medium mb-3" style="color:var(--text-secondary)">🔐 ${t('settings.two_factor')}</h4>
          <div class="flex items-center justify-between p-3 rounded-lg mb-3" style="background:rgba(0,255,65,0.05)">
            <div class="flex items-center gap-2">
              <span class="source-status active"></span>
              <span class="text-sm" style="color:var(--green)">2FA activée</span>
            </div>
            <span class="badge badge-green">Active</span>
          </div>
          <div id="twofa-disable-area">
            <p class="text-xs mb-2" style="color:var(--text-muted)">Entrez un code de votre application d'authentification pour désactiver la 2FA.</p>
            <div class="flex gap-2 items-end">
              <div class="flex-1">
                <input type="text" id="twofa-disable-code" class="input-field text-center" placeholder="000000" maxlength="6" inputmode="numeric" autocomplete="one-time-code" style="letter-spacing:0.3em" />
              </div>
              <button class="btn btn-danger btn-sm" id="twofa-disable-btn">Désactiver</button>
            </div>
            <div id="twofa-disable-msg" class="text-xs mt-2 hidden p-2 rounded"></div>
          </div>
        </div>
      `;
    }
    return `
      <div class="border-t pt-5 mb-2" style="border-color:var(--border-subtle)">
        <h4 class="text-sm font-medium mb-3" style="color:var(--text-secondary)">🔐 ${t('settings.two_factor')}</h4>
        <div class="flex items-center justify-between p-3 rounded-lg mb-3" style="background:rgba(255,255,255,0.03)">
          <div class="flex items-center gap-2">
            <span class="source-status inactive"></span>
            <span class="text-sm" style="color:var(--text-muted)">2FA désactivée</span>
          </div>
          <button class="btn btn-outline btn-sm" id="twofa-enable-btn">${t('settings.enable_2fa')}</button>
        </div>
        <div id="twofa-setup-area"></div>
      </div>
    `;
  }

  function renderSetupStep(secret, url) {
    return `
      <div class="animate-fade-up p-4 rounded-lg mt-3" style="background:#0a0a0a;border:1px solid var(--border-green)">
        <div class="text-xs mb-3" style="color:var(--text-secondary)">
          <strong style="color:var(--green)">Étape 1 :</strong> Scannez ce QR code ou entrez la clé secrète dans votre application (Google Authenticator, Authy, etc.)
        </div>
        <!-- QR Code via external service -->
        <div class="flex justify-center mb-3">
          <div style="background:#fff;padding:8px;border-radius:4px;display:inline-block">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}" width="160" height="160" alt="QR Code 2FA" />
          </div>
        </div>
        <div class="text-center mb-3">
          <p class="text-xs mb-1" style="color:var(--text-muted)">Clé secrète :</p>
          <code class="text-sm font-bold select-all px-3 py-1.5 inline-block rounded" style="background:rgba(0,255,65,0.06);color:var(--green);letter-spacing:0.15em;font-size:0.85rem">${GCTOTP.formatSecret(secret)}</code>
        </div>
        <div class="border-t mt-3 pt-3" style="border-color:var(--border-subtle)">
          <p class="text-xs mb-2" style="color:var(--text-secondary)">
            <strong style="color:var(--green)">Étape 2 :</strong> Entrez le code à 6 chiffres pour confirmer :
          </p>
          <div class="flex gap-2 items-end">
            <div class="flex-1">
              <input type="text" id="twofa-confirm-code" class="input-field text-center" placeholder="000000" maxlength="6" inputmode="numeric" autocomplete="one-time-code" style="letter-spacing:0.3em;font-size:1.1rem;padding:10px" />
            </div>
            <button class="btn btn-green btn-sm" id="twofa-confirm-btn">Activer</button>
          </div>
          <div id="twofa-confirm-msg" class="text-xs mt-2 hidden p-2 rounded"></div>
        </div>
      </div>
    `;
  }

  function bind2FA() {
    // Enable 2FA button
    document.getElementById('twofa-enable-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('twofa-enable-btn');
      const user = GCState.getUser();
      if (!user) return;
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:14px;height:14px"></div>';

      const result = await GCAuth.enable2FA(user.id);
      btn.disabled = false;
      btn.textContent = t('settings.enable_2fa');

      if (result.error) {
        GCToast.error(result.error);
        return;
      }

      // Show setup form
      const area = document.getElementById('twofa-setup-area');
      if (area) {
        area.innerHTML = renderSetupStep(result.secret, result.url);
        bind2FAConfirm(user.id);
      }
    });

    // Disable 2FA button
    document.getElementById('twofa-disable-btn')?.addEventListener('click', async () => {
      const code = document.getElementById('twofa-disable-code')?.value?.trim();
      const msgEl = document.getElementById('twofa-disable-msg');
      const user = GCState.getUser();
      if (!user) return;

      if (!code || code.length !== 6) {
        if (msgEl) {
          msgEl.innerHTML = '<div class="p-2 rounded" style="background:rgba(255,0,64,0.06);color:var(--red)">Entrez un code à 6 chiffres.</div>';
          msgEl.classList.remove('hidden');
        }
        return;
      }

      const btn = document.getElementById('twofa-disable-btn');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:12px;height:12px"></div>';

      const result = await GCAuth.disable2FA(user.id, code);
      btn.disabled = false;
      btn.textContent = 'Désactiver';

      if (result.error) {
        if (msgEl) {
          msgEl.innerHTML = `<div class="p-2 rounded" style="background:rgba(255,0,64,0.06);color:var(--red)">${result.error}</div>`;
          msgEl.classList.remove('hidden');
        }
        return;
      }

      GCToast.success('2FA désactivée avec succès.');
      // Refresh the section
      const updatedUser = GCState.getUser();
      document.getElementById('twofa-section').innerHTML = render2FASection(updatedUser);
      bind2FA();
    });
  }

  function bind2FAConfirm(userId) {
    const codeInput = document.getElementById('twofa-confirm-code');
    setTimeout(() => codeInput?.focus(), 100);

    document.getElementById('twofa-confirm-btn')?.addEventListener('click', async () => {
      const code = codeInput?.value?.trim();
      const msgEl = document.getElementById('twofa-confirm-msg');

      if (!code || code.length !== 6) {
        if (msgEl) {
          msgEl.innerHTML = '<div class="p-2 rounded" style="background:rgba(255,0,64,0.06);color:var(--red)">Entrez un code à 6 chiffres.</div>';
          msgEl.classList.remove('hidden');
        }
        return;
      }

      const btn = document.getElementById('twofa-confirm-btn');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:12px;height:12px"></div>';

      const result = await GCAuth.confirm2FA(userId, code);
      btn.disabled = false;
      btn.textContent = 'Activer';

      if (result.error) {
        if (msgEl) {
          msgEl.innerHTML = `<div class="p-2 rounded" style="background:rgba(255,0,64,0.06);color:var(--red)">${result.error}</div>`;
          msgEl.classList.remove('hidden');
        }
        codeInput.value = '';
        codeInput.focus();
        return;
      }

      GCToast.success('2FA activée avec succès !');
      // Refresh the section
      const updatedUser = GCState.getUser();
      document.getElementById('twofa-section').innerHTML = render2FASection(updatedUser);
      bind2FA();
    });
  }

  function renderLanguageList() {
    const supported = GCI18n.getSupported();
    const current = GCI18n.getLocale();
    return Object.entries(supported).map(([code, info]) => {
      const isActive = code === current;
      return `
        <button data-lang="${code}"
          class="flex items-center justify-between w-full p-3 rounded-lg cursor-pointer transition-all"
          style="background:${isActive ? 'rgba(0,255,65,0.06)' : 'rgba(255,255,255,0.03)'};border:1px solid ${isActive ? 'rgba(0,255,65,0.2)' : 'rgba(255,255,255,0.04)'}">
          <div class="flex items-center gap-3">
            <span style="font-size:1.3rem">${info.flag}</span>
            <span class="text-sm" style="color:${isActive ? 'var(--green)' : 'var(--text-secondary)'};font-weight:${isActive ? '700' : '400'}">${info.label}</span>
          </div>
          ${isActive ? '<span class="badge badge-green">✓</span>' : ''}
        </button>
      `;
    }).join('');
  }

  function bindLanguagePicker() {
    document.querySelectorAll('#lang-list [data-lang]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const code = btn.dataset.lang;
        if (code === GCI18n.getLocale()) return;
        await GCI18n.setLocale(code);
        // Re-render dashboard to apply new language
        const container = document.getElementById('app');
        if (container) {
          GCDashboardView.render(container);
          // Navigate back to settings sub
          setTimeout(() => {
            const settingsBtn = document.querySelector('[data-sub="settings"]');
            if (settingsBtn) settingsBtn.click();
          }, 50);
        }
      });
    });
  }

  function bindPasswordForm() {
    document.getElementById('password-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = GCState.getUser();
      const current = document.getElementById('settings-current-pw')?.value;
      const newPw = document.getElementById('settings-new-pw')?.value;
      const confirm = document.getElementById('settings-confirm-pw')?.value;
      const msgEl = document.getElementById('pw-msg');
      if (newPw !== confirm) {
        msgEl.innerHTML = `<div class="p-3 rounded-lg text-sm" style="background:rgba(239,68,68,0.1);color:var(--danger)">Les mots de passe ne correspondent pas.</div>`;
        msgEl.classList.remove('hidden');
        return;
      }
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:16px;height:16px"></div>';
      await new Promise(r => setTimeout(r, 600));
      const result = await GCAuth.changePassword(user.id, current, newPw);
      btn.disabled = false;
      btn.textContent = t('settings.change_password');
      if (result.error) {
        msgEl.innerHTML = `<div class="p-3 rounded-lg text-sm" style="background:rgba(239,68,68,0.1);color:var(--danger)">${result.error}</div>`;
      } else {
        msgEl.innerHTML = `<div class="p-3 rounded-lg text-sm" style="background:rgba(34,197,94,0.1);color:var(--success)">Mot de passe modifié avec succès.</div>`;
        e.target.reset();
      }
      msgEl.classList.remove('hidden');
    });
  }

  return { render };
})();

window.GCSettingsSubView = SettingsSubView;
