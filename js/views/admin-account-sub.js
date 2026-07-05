// Gold_Crew — Admin Account Settings Sub-View (Terminal Style)
const AdminAccountSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  async function render(container) {
    container.innerHTML = `
      <div class="max-w-2xl mx-auto space-y-4">
        <div class="animate-fade-up">
          <h2 class="text-lg font-bold" style="color:var(--text-green)">⚷ Mon Compte Admin</h2>
          <p class="text-xs" style="color:var(--text-muted)">Sécuriser le compte administrateur</p>
        </div>

        <!-- Change Password -->
        <div class="animate-fade-up animate-delay-1" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:14px">
          <h3 class="text-xs font-bold mb-3" style="color:var(--text-green)">⚿ CHANGER LE MOT DE PASSE</h3>
          <form id="admin-pw-form" class="space-y-2" novalidate>
            <div>
              <label class="block text-xs mb-0.5" style="color:var(--text-muted)">MOT DE PASSE ACTUEL</label>
              <input type="password" id="admin-current-pw" class="input-field" placeholder="••••••••" required autocomplete="current-password" style="font-size:0.75rem" />
            </div>
            <div>
              <label class="block text-xs mb-0.5" style="color:var(--text-muted)">NOUVEAU MOT DE PASSE</label>
              <input type="password" id="admin-new-pw" class="input-field" placeholder="••••••••" required autocomplete="new-password" style="font-size:0.75rem" />
              <p class="text-xs mt-0.5" style="color:var(--text-muted);font-size:0.55rem">${t('auth.password_requirements')}</p>
            </div>
            <div>
              <label class="block text-xs mb-0.5" style="color:var(--text-muted)">CONFIRMER</label>
              <input type="password" id="admin-confirm-pw" class="input-field" placeholder="••••••••" required autocomplete="new-password" style="font-size:0.75rem" />
            </div>
            <div id="admin-pw-msg" class="hidden"></div>
            <button type="submit" class="btn btn-green btn-sm mt-2">▸ MODIFIER LE MOT DE PASSE</button>
          </form>
        </div>

        <!-- Session info -->
        <div class="animate-fade-up animate-delay-2" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:14px">
          <h3 class="text-xs font-bold mb-3" style="color:var(--text-green)">◈ INFORMATIONS SESSION</h3>
          <div class="space-y-1.5">
            <div class="flex justify-between items-center p-2 rounded" style="background:rgba(255,255,255,0.02)">
              <span class="text-xs" style="color:var(--text-muted)">Utilisateur</span>
              <span class="text-xs" style="color:var(--green);font-family:var(--font-mono)">admin</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded" style="background:rgba(255,255,255,0.02)">
              <span class="text-xs" style="color:var(--text-muted)">Session active depuis</span>
              <span class="text-xs" style="color:var(--text-primary)">${new Date().toLocaleString('fr-FR')}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded" style="background:rgba(255,255,255,0.02)">
              <span class="text-xs" style="color:var(--text-muted)">Expiration</span>
              <span class="text-xs" style="color:var(--amber)">8h après connexion</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded" style="background:rgba(255,255,255,0.02)">
              <span class="text-xs" style="color:var(--text-muted)">IP</span>
              <span class="text-xs" style="color:var(--text-secondary);font-family:var(--font-mono)">Sandboxed</span>
            </div>
          </div>
        </div>
      </div>
    `;
    bindPasswordForm();
  }

  function bindPasswordForm() {
    document.getElementById('admin-pw-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const current = document.getElementById('admin-current-pw')?.value;
      const newPw = document.getElementById('admin-new-pw')?.value;
      const confirm = document.getElementById('admin-confirm-pw')?.value;
      const msgEl = document.getElementById('admin-pw-msg');

      if (newPw !== confirm) {
        msgEl.innerHTML = '<div class="p-2 rounded text-xs" style="background:rgba(255,0,64,0.06);color:var(--red);border:1px solid rgba(255,0,64,0.15)">Les mots de passe ne correspondent pas.</div>';
        msgEl.classList.remove('hidden');
        return;
      }

      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:14px;height:14px"></div>';
      await new Promise(r => setTimeout(r, 500));

      const result = await GCAdmin.changePassword(current, newPw);
      btn.disabled = false;
      btn.textContent = '▸ MODIFIER LE MOT DE PASSE';

      if (result.error) {
        msgEl.innerHTML = `<div class="p-2 rounded text-xs" style="background:rgba(255,0,64,0.06);color:var(--red);border:1px solid rgba(255,0,64,0.15)">${result.error}</div>`;
      } else {
        msgEl.innerHTML = '<div class="p-2 rounded text-xs" style="background:rgba(0,255,65,0.06);color:var(--green);border:1px solid rgba(0,255,65,0.15)">✓ Mot de passe modifié.</div>';
        e.target.reset();
      }
      msgEl.classList.remove('hidden');
    });
  }

  return { render };
})();

window.GCAdminAccountSubView = AdminAccountSubView;
