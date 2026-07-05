// Gold_Crew — Promo Code Sub-View
const PromoSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  function render(container) {
    container.innerHTML = `
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="animate-fade-up">
          <h2 class="text-xl font-bold" style="color:var(--text-primary)">${t('promo.title')}</h2>
          <p class="text-sm mt-1" style="color:var(--text-secondary)">${t('promo.subtitle')}</p>
        </div>

        <!-- Promo code form -->
        <div class="glass-card p-6 animate-fade-up animate-delay-1">
          <form id="promo-form" class="flex gap-3" novalidate>
            <input type="text" id="promo-input" class="input-field flex-1" placeholder="${t('promo.input_placeholder')}" autocomplete="off" style="text-transform:uppercase" />
            <button type="submit" class="btn btn-gold">${t('promo.apply_btn')}</button>
          </form>
          <div id="promo-msg" class="mt-4 hidden"></div>
        </div>

        <!-- WhatsApp bonus -->
        <div class="glass-card p-6 text-center animate-fade-up animate-delay-2" style="border-color:rgba(37,211,102,0.2)">
          <div class="text-4xl mb-3">💬</div>
          <h3 class="font-bold text-lg mb-2" style="color:var(--text-primary)">${t('promo.whatsapp_title')}</h3>
          <p class="text-sm mb-5" style="color:var(--text-secondary)">${t('promo.whatsapp_desc')}</p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-2 flex-wrap">
            <a href="https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T" target="_blank" rel="noopener" class="btn btn-gold inline-flex">
              📲 ${t('promo.whatsapp_channel_goldcrew')}
            </a>
            <a href="https://whatsapp.com/channel/0029VbBT7FdLCoX1TDyQQb1B" target="_blank" rel="noopener" class="btn btn-outline inline-flex" style="border-color:rgba(37,211,102,0.3);color:#25d366">
              📲 ${t('promo.whatsapp_channel_digitalcrew')}
            </a>
            <a href="https://whatsapp.com/channel/0029Vb5ioJzA2pLD4CZOCq2V" target="_blank" rel="noopener" class="btn btn-outline inline-flex" style="border-color:rgba(191,0,255,0.3);color:#bf00ff">
              📲 ${t('promo.whatsapp_channel_hackersacademy')}
            </a>
          </div>
        </div>
      </div>
    `;
    bindForm();
  }

  function bindForm() {
    document.getElementById('promo-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('promo-input')?.value.trim();
      if (!code) return;
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:18px;height:18px"></div>';
      await new Promise(r => setTimeout(r, 800));
      const result = await GCAuth.applyPromoCode(code);
      btn.disabled = false;
      btn.textContent = t('promo.apply_btn');
      const msgEl = document.getElementById('promo-msg');
      msgEl.classList.remove('hidden');
      if (result.error) {
        msgEl.innerHTML = `<div class="p-3 rounded-lg text-sm" style="background:rgba(239,68,68,0.1);color:var(--danger)">✕ ${result.error}</div>`;
      } else {
        msgEl.innerHTML = `<div class="p-3 rounded-lg text-sm" style="background:rgba(34,197,94,0.1);color:var(--success)">✓ ${t('promo.success').replace('{count}', result.added)}</div>`;
        document.getElementById('promo-input').value = '';
        GCToast.success(t('promo.success').replace('{count}', result.added));
        await GCAuth.reloadUserData();
        GCDashboardView.refreshCrewDisplay();
      }
    });
  }

  return { render };
})();

window.GCPromoSubView = PromoSubView;
