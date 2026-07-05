// Gold_Crew — Profile Sub-View
const ProfileSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;
  const COUNTRIES = ['France','Belgique','Suisse','Canada','Maroc','Algérie','Tunisie','Sénégal','Côte d\'Ivoire','Cameroun','RDC','Madagascar','Luxembourg','Haïti','Autre'];

  function render(container) {
    const user = GCState.getUser();
    const history = GCState.get().searchHistory || [];
    if (!user) return;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto space-y-6">
        <h2 class="text-xl font-bold animate-fade-up" style="color:var(--text-primary)">${t('profile.title')}</h2>

        <!-- Avatar & info -->
        <div class="glass-card p-6 animate-fade-up animate-delay-1">
          <div class="flex items-center gap-5 mb-6">
            <div class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0" style="background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#0A0A0F">
              ${(user.firstName?.[0] || user.username[0]).toUpperCase()}
            </div>
            <div>
              <h3 class="text-lg font-bold" style="color:var(--text-primary)">${user.firstName} ${user.lastName}</h3>
              <p class="text-sm" style="color:var(--text-secondary)">@${user.username}</p>
              <p class="text-xs mt-1" style="color:var(--text-muted)">${user.email}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="rounded-xl p-3" style="background:rgba(255,255,255,0.03)">
              <div class="text-xs" style="color:var(--text-muted)">${t('profile.member_since')}</div>
              <div class="text-sm font-medium" style="color:var(--text-primary)">${user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '—'}</div>
            </div>
            <div class="rounded-xl p-3" style="background:rgba(255,255,255,0.03)">
              <div class="text-xs" style="color:var(--text-muted)">${t('profile.last_login')}</div>
              <div class="text-sm font-medium" style="color:var(--text-primary)">${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : '—'}</div>
            </div>
            <div class="rounded-xl p-3" style="background:rgba(255,255,255,0.03)">
              <div class="text-xs" style="color:var(--text-muted)">${t('profile.searches_used')}</div>
              <div class="text-sm font-medium" style="color:var(--gold)">${history.length}</div>
            </div>
            <div class="rounded-xl p-3" style="background:rgba(255,255,255,0.03)">
              <div class="text-xs" style="color:var(--text-muted)">${t('dashboard.searches_remaining')}</div>
              <div class="text-sm font-medium" style="color:var(--success)">${GCState.getCrewRemaining()}</div>
            </div>
          </div>
        </div>

        <!-- Edit form -->
        <div class="glass-card p-6 animate-fade-up animate-delay-2">
          <form id="profile-form" class="space-y-4" novalidate>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--text-secondary)">${t('auth.first_name')}</label>
                <input type="text" id="prof-firstname" class="input-field" value="${user.firstName || ''}" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color:var(--text-secondary)">${t('auth.last_name')}</label>
                <input type="text" id="prof-lastname" class="input-field" value="${user.lastName || ''}" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:var(--text-secondary)">${t('auth.phone')}</label>
              <input type="tel" id="prof-phone" class="input-field" value="${user.phone || ''}" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color:var(--text-secondary)">${t('auth.country')}</label>
              <select id="prof-country" class="input-field">
                <option value="">—</option>
                ${COUNTRIES.map(c => `<option value="${c}" ${user.country === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div id="profile-msg" class="hidden"></div>
            <button type="submit" class="btn btn-gold">${t('profile.save_btn')}</button>
          </form>
        </div>
      </div>
    `;
    bindForm();
  }

  function bindForm() {
    document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = GCState.getUser();
      const updates = {
        firstName: document.getElementById('prof-firstname')?.value.trim(),
        lastName: document.getElementById('prof-lastname')?.value.trim(),
        phone: document.getElementById('prof-phone')?.value.trim(),
        country: document.getElementById('prof-country')?.value,
      };
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:18px;height:18px"></div>';
      await new Promise(r => setTimeout(r, 500));
      const result = await GCAuth.updateProfile(user.id, updates);
      btn.disabled = false;
      btn.textContent = t('profile.save_btn');
      if (result.success) {
        GCToast.success(t('profile.saved'));
        render(document.querySelector('#view-container'));
      } else {
        GCToast.error(result.error || t('common.error'));
      }
    });
  }

  return { render };
})();

window.GCProfileSubView = ProfileSubView;
