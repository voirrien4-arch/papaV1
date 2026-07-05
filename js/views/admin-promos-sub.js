// Gold_Crew — Admin Promo Codes Sub-View (Terminal Style)
const AdminPromosSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  async function render(container) {
    const codes = await GCAdmin.getPromoCodes();
    const stats = await GCAdmin.getPromoStats();

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up">
          <div>
            <h2 class="text-lg font-bold" style="color:var(--text-green)">◆ Codes Promo</h2>
            <p class="text-xs" style="color:var(--text-muted)">${Object.keys(codes).length} code(s)</p>
          </div>
          <button class="btn btn-green btn-sm" id="admin-add-promo">+ NOUVEAU</button>
        </div>

        <div id="admin-promo-form-area" class="hidden animate-fade-up"></div>

        <div id="admin-promos-list" class="animate-fade-up animate-delay-1">
          ${Object.keys(codes).length === 0
            ? '<div class="p-8 text-center" style="color:var(--text-muted)">∅ Aucun code promo</div>'
            : '<div class="space-y-2">' + Object.entries(codes).map(([code, promo]) => {
                const totalUsed = stats[code] || 0;
                return `
                  <div class="p-3 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2" style="background:rgba(0,255,65,0.02);border:1px solid var(--border-subtle)">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <code class="text-xs font-bold px-2 py-0.5 rounded" style="background:rgba(0,255,65,0.08);color:var(--green);font-family:var(--font-mono)">${code}</code>
                        ${promo.active ? '<span class="badge badge-success" style="font-size:0.5rem">ACTIVE</span>' : '<span class="badge badge-danger" style="font-size:0.5rem">OFF</span>'}
                      </div>
                      <div class="text-xs" style="color:var(--text-muted);font-size:0.6rem">
                        +${promo.searches} Crew · ${promo.label || '—'} · Used: ${totalUsed}
                      </div>
                    </div>
                    <div class="flex gap-1">
                      <button class="btn btn-ghost btn-sm admin-toggle-promo" data-code="${code}" data-active="${promo.active}" style="font-size:0.7rem">${promo.active ? '⏸' : '▶'}</button>
                      <button class="btn btn-ghost btn-sm admin-delete-promo" data-code="${code}" style="color:var(--red);font-size:0.7rem">✕</button>
                    </div>
                  </div>
                `;
              }).join('') + '</div>'
          }
        </div>
      </div>
    `;
    bindPromoActions();
    bindAddPromo();
  }

  function bindAddPromo() {
    document.getElementById('admin-add-promo')?.addEventListener('click', () => {
      const area = document.getElementById('admin-promo-form-area');
      area.classList.toggle('hidden');
      if (!area.classList.contains('hidden')) {
        area.innerHTML = `
          <div style="background:#0a0a0a;border:1px solid rgba(0,255,65,0.15);border-radius:var(--radius);padding:14px">
            <h4 class="text-xs font-bold mb-3" style="color:var(--text-green)">NOUVEAU CODE</h4>
            <form id="new-promo-form" class="space-y-2" novalidate>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label class="block text-xs mb-0.5" style="color:var(--text-muted)">Code</label>
                  <input type="text" id="new-promo-code" class="input-field" placeholder="GC-BONUS10" style="text-transform:uppercase;font-size:0.75rem" />
                </div>
                <div>
                  <label class="block text-xs mb-0.5" style="color:var(--text-muted)">Crew ajoutés</label>
                  <input type="number" id="new-promo-searches" class="input-field" value="4" min="1" max="100" style="font-size:0.75rem" />
                </div>
                <div>
                  <label class="block text-xs mb-0.5" style="color:var(--text-muted)">Label</label>
                  <input type="text" id="new-promo-label" class="input-field" placeholder="Bonus WhatsApp" style="font-size:0.75rem" />
                </div>
              </div>
              <div class="flex gap-2 justify-end mt-2">
                <button type="button" class="btn btn-ghost btn-sm" id="cancel-new-promo">Annuler</button>
                <button type="submit" class="btn btn-green btn-sm">CRÉER</button>
              </div>
            </form>
          </div>
        `;
        document.getElementById('cancel-new-promo')?.addEventListener('click', () => area.classList.add('hidden'));
        document.getElementById('new-promo-form')?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const code = document.getElementById('new-promo-code')?.value.trim();
          const searches = document.getElementById('new-promo-searches')?.value;
          const label = document.getElementById('new-promo-label')?.value.trim();
          if (!code) { GCToast.warning('Entrez un code.'); return; }
          await GCAdmin.addPromoCode(code, searches, label);
          GCToast.success(`Code ${code.toUpperCase()} créé.`);
          render(document.querySelector('#admin-view-container'));
        });
      }
    });
  }

  function bindPromoActions() {
    document.querySelectorAll('.admin-toggle-promo').forEach(btn => {
      btn.addEventListener('click', async () => {
        const active = btn.dataset.active === 'true';
        await GCAdmin.togglePromoCode(btn.dataset.code, !active);
        GCToast.success(active ? 'Désactivé.' : 'Activé.');
        render(document.querySelector('#admin-view-container'));
      });
    });
    document.querySelectorAll('.admin-delete-promo').forEach(btn => {
      btn.addEventListener('click', async () => {
        await GCAdmin.deletePromoCode(btn.dataset.code);
        GCToast.info('Code supprimé.');
        render(document.querySelector('#admin-view-container'));
      });
    });
  }

  return { render };
})();

window.GCAdminPromosSubView = AdminPromosSubView;
