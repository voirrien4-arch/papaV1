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
            <div class="relative shrink-0">
              <div id="profile-avatar-wrap" class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden" style="background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#0A0A0F">
                ${user.avatar
                  ? `<img src="${user.avatar}" alt="" class="w-full h-full object-cover" />`
                  : (user.firstName?.[0] || user.username[0]).toUpperCase()}
              </div>
              <button id="profile-avatar-btn" type="button" title="${t('profile.change_photo')}" aria-label="${t('profile.change_photo')}" class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center" style="background:var(--bg-primary);border:1px solid var(--border-green);color:var(--green);font-size:0.8rem;cursor:pointer">📷</button>
              <input type="file" id="profile-avatar-input" accept="image/png,image/jpeg,image/webp" class="hidden" />
            </div>
            <div>
              <h3 class="text-lg font-bold" style="color:var(--text-primary)">${user.firstName} ${user.lastName}</h3>
              <p class="text-sm" style="color:var(--text-secondary)">@${user.username}</p>
              <p class="text-xs mt-1" style="color:var(--text-muted)">${user.email}</p>
              ${user.avatar ? `<button id="profile-avatar-remove" type="button" class="text-xs mt-1" style="color:var(--red);background:none;border:none;cursor:pointer;padding:0">${t('profile.remove_photo')}</button>` : ''}
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
    bindAvatar();
  }

  // Redimensionne et compresse l'image côté client avant envoi
  // (évite d'envoyer des photos de plusieurs Mo au serveur/à Supabase).
  function resizeImage(file, maxSize = 256, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read_failed'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('decode_failed'));
        img.onload = () => {
          let { width, height } = img;
          if (width > height) { if (width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; } }
          else { if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; } }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function bindAvatar() {
    const btn = document.getElementById('profile-avatar-btn');
    const input = document.getElementById('profile-avatar-input');
    const removeBtn = document.getElementById('profile-avatar-remove');

    btn?.addEventListener('click', () => input?.click());

    input?.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
        GCToast.error(t('profile.photo_invalid_type'));
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        GCToast.error(t('profile.photo_too_large'));
        return;
      }
      const wrap = document.getElementById('profile-avatar-wrap');
      const prevHTML = wrap.innerHTML;
      wrap.innerHTML = '<div class="spinner"></div>';
      try {
        const dataUrl = await resizeImage(file);
        const user = GCState.getUser();
        const result = await GCAuth.updateProfile(user.id, { avatar: dataUrl });
        if (result.success) {
          GCToast.success(t('profile.photo_updated'));
          render(document.querySelector('#view-container'));
          GCDashboardView.refreshHeaderAvatar?.();
        } else {
          wrap.innerHTML = prevHTML;
          GCToast.error(result.error || t('common.error'));
        }
      } catch {
        wrap.innerHTML = prevHTML;
        GCToast.error(t('profile.photo_invalid_type'));
      }
      input.value = '';
    });

    removeBtn?.addEventListener('click', async () => {
      const user = GCState.getUser();
      const result = await GCAuth.updateProfile(user.id, { avatar: '' });
      if (result.success) {
        GCToast.success(t('profile.photo_removed'));
        render(document.querySelector('#view-container'));
        GCDashboardView.refreshHeaderAvatar?.();
      } else {
        GCToast.error(result.error || t('common.error'));
      }
    });
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
