// Gold_Crew — Admin Announcements Sub-View (Terminal Style)
const AdminAnnouncementsSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  const COLORS = [
    { value: 'green', label: '🟢 Vert', color: 'var(--green)', bg: 'rgba(0,255,65,0.06)', border: 'rgba(0,255,65,0.2)' },
    { value: 'red', label: '🔴 Rouge', color: 'var(--red)', bg: 'rgba(255,0,64,0.06)', border: 'rgba(255,0,64,0.2)' },
    { value: 'amber', label: '🟡 Ambre', color: 'var(--amber)', bg: 'rgba(255,184,0,0.06)', border: 'rgba(255,184,0,0.2)' },
    { value: 'cyan', label: '🔵 Cyan', color: 'var(--cyan)', bg: 'rgba(0,229,255,0.06)', border: 'rgba(0,229,255,0.2)' },
    { value: 'purple', label: '🟣 Violet', color: 'var(--purple)', bg: 'rgba(191,0,255,0.06)', border: 'rgba(191,0,255,0.2)' },
    { value: 'gold', label: '🟡 Gold', color: 'var(--gold)', bg: 'rgba(212,175,55,0.06)', border: 'rgba(212,175,55,0.2)' },
  ];

  function getColorConfig(value) {
    return COLORS.find(c => c.value === value) || COLORS[0];
  }

  async function render(container) {
    const announcements = await GCAdmin.getAnnouncements();

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-4">
        <div class="animate-fade-up">
          <h2 class="text-lg font-bold" style="color:var(--text-green)">⊘ Annonces</h2>
          <p class="text-xs" style="color:var(--text-muted)">Envoyer des annonces à tous les utilisateurs. Supports liens et couleurs.</p>
        </div>

        <!-- Send form -->
        <div class="animate-fade-up animate-delay-1" style="background:#0a0a0a;border:1px solid rgba(0,255,65,0.15);border-radius:var(--radius);padding:14px">
          <h3 class="text-xs font-bold mb-3" style="color:var(--text-green)">NOUVELLE ANNONCE</h3>
          <form id="announcement-form" class="space-y-3" novalidate>
            <div>
              <label class="block text-xs mb-0.5" style="color:var(--text-muted)">TITRE</label>
              <input type="text" id="ann-title" class="input-field" placeholder="Titre..." maxlength="100" required style="font-size:0.75rem" />
            </div>
            <div>
              <label class="block text-xs mb-0.5" style="color:var(--text-muted)">MESSAGE <span style="opacity:0.5">(supports liens: https://... et **gras**)</span></label>
              <textarea id="ann-message" class="input-field" rows="4" placeholder="Contenu... Coller des liens https://... directement dans le texte." maxlength="1000" required style="font-size:0.75rem"></textarea>
            </div>
            <div>
              <label class="block text-xs mb-1" style="color:var(--text-muted)">COULEUR</label>
              <div class="flex flex-wrap gap-2" id="color-selector">
                ${COLORS.map((c, i) => `
                  <button type="button" class="color-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded cursor-pointer transition-all"
                    data-color="${c.value}"
                    style="background:${i === 0 ? c.bg : 'rgba(255,255,255,0.02)'};border:1px solid ${i === 0 ? c.border : 'rgba(255,255,255,0.06)'};color:${i === 0 ? c.color : 'var(--text-muted)'};font-size:0.65rem;font-family:var(--font-mono)">
                    ${c.label}
                  </button>
                `).join('')}
              </div>
              <input type="hidden" id="ann-color" value="green" />
            </div>

            <!-- Preview -->
            <div>
              <label class="block text-xs mb-1" style="color:var(--text-muted)">APERÇU</label>
              <div id="ann-preview" class="p-3 rounded" style="background:rgba(0,255,65,0.03);border:1px solid rgba(0,255,65,0.15)">
                <div class="text-xs font-bold" style="color:var(--text-muted);opacity:0.5">Le contenu apparaîtra ici...</div>
              </div>
            </div>

            <button type="submit" class="btn btn-green btn-sm" id="ann-submit">▸ ENVOYER À TOUS</button>
          </form>
        </div>

        <!-- History -->
        <div class="animate-fade-up animate-delay-2" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:14px">
          <h3 class="text-xs font-bold mb-3" style="color:var(--text-green);text-transform:uppercase">▸ Historique</h3>
          ${announcements.length === 0
            ? '<p class="text-xs" style="color:var(--text-muted)">Aucune annonce envoyée.</p>'
            : announcements.map(a => {
                const cc = getColorConfig(a.color);
                return `
                  <div class="p-2.5 rounded mb-1.5 ann-item" data-id="${a.id}" style="background:${cc.bg};border:1px solid ${cc.border};border-left:3px solid ${cc.color}">
                    <div class="flex items-center justify-between mb-0.5">
                      <div class="flex items-center gap-2">
                        <span style="color:${cc.color};font-size:0.55rem">${cc.label.split(' ')[0]}</span>
                        <div class="font-bold text-xs" style="color:var(--text-primary)">${escapeHtml(a.title)}</div>
                      </div>
                      <button class="btn btn-danger btn-sm ann-delete-btn" data-id="${a.id}" style="padding:3px 8px;font-size:0.6rem;min-height:24px" aria-label="Supprimer cette annonce">🗑 Supprimer</button>
                    </div>
                    <div class="text-xs mt-0.5" style="color:var(--text-secondary);line-height:1.5">${renderAnnouncementHtml(a.message)}</div>
                    <div class="text-xs mt-1" style="color:var(--text-muted);font-size:0.55rem">${new Date(a.sentAt).toLocaleString('fr-FR')}</div>
                  </div>
                `;
              }).join('')
          }
        </div>
      </div>
    `;
    bindForm();
    bindColorSelector();
    bindPreview();
    bindDeleteButtons();
  }

  function bindColorSelector() {
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        const cc = getColorConfig(color);
        document.querySelectorAll('.color-btn').forEach(b => {
          b.style.background = 'rgba(255,255,255,0.02)';
          b.style.borderColor = 'rgba(255,255,255,0.06)';
          b.style.color = 'var(--text-muted)';
        });
        btn.style.background = cc.bg;
        btn.style.borderColor = cc.border;
        btn.style.color = cc.color;
        document.getElementById('ann-color').value = color;
        updatePreview();
      });
    });
  }

  function bindPreview() {
    document.getElementById('ann-title')?.addEventListener('input', updatePreview);
    document.getElementById('ann-message')?.addEventListener('input', updatePreview);
  }

  function updatePreview() {
    const title = document.getElementById('ann-title')?.value.trim() || '';
    const message = document.getElementById('ann-message')?.value.trim() || '';
    const color = document.getElementById('ann-color')?.value || 'green';
    const cc = getColorConfig(color);
    const preview = document.getElementById('ann-preview');
    if (!preview) return;

    if (!title && !message) {
      preview.innerHTML = `<div class="text-xs" style="color:var(--text-muted);opacity:0.5">Le contenu apparaîtra ici...</div>`;
      preview.style.background = cc.bg;
      preview.style.borderColor = cc.border;
      return;
    }

    preview.style.background = cc.bg;
    preview.style.borderColor = cc.border;
    preview.innerHTML = `
      ${title ? `<div class="font-bold text-xs mb-1" style="color:${cc.color}">${escapeHtml(title)}</div>` : ''}
      ${message ? `<div class="text-xs" style="color:var(--text-secondary);line-height:1.5">${renderAnnouncementHtml(message)}</div>` : ''}
    `;
  }

  function bindForm() {
    document.getElementById('announcement-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('ann-title')?.value.trim();
      const message = document.getElementById('ann-message')?.value.trim();
      const color = document.getElementById('ann-color')?.value || 'green';
      if (!title || !message) { GCToast.warning('Remplissez le titre et le message.'); return; }
      const btn = document.getElementById('ann-submit');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:14px;height:14px"></div> ENVOI...';
      await new Promise(r => setTimeout(r, 600));
      await GCAdmin.sendAnnouncement(title, message, color);
      btn.disabled = false;
      btn.textContent = '▸ ENVOYER À TOUS';
      GCToast.success('Annonce envoyée !');
      document.getElementById('ann-title').value = '';
      document.getElementById('ann-message').value = '';
      document.getElementById('ann-color').value = 'green';
      // Reset color selector
      document.querySelectorAll('.color-btn').forEach(b => {
        b.style.background = 'rgba(255,255,255,0.02)';
        b.style.borderColor = 'rgba(255,255,255,0.06)';
        b.style.color = 'var(--text-muted)';
      });
      const greenBtn = document.querySelector('[data-color="green"]');
      if (greenBtn) { greenBtn.style.background = COLORS[0].bg; greenBtn.style.borderColor = COLORS[0].border; greenBtn.style.color = COLORS[0].color; }
      render(document.querySelector('#admin-view-container'));
    });
  }

  function bindDeleteButtons() {
    document.querySelectorAll('.ann-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const annId = btn.dataset.id;
        if (!confirm('Supprimer cette annonce ?')) return;
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:10px;height:10px"></div>';
        const result = await GCAdmin.deleteAnnouncement(annId);
        if (result.success) {
          GCToast.success('Annonce supprimée.');
          render(document.querySelector('#admin-view-container'));
        } else {
          GCToast.error(result.error || 'Erreur lors de la suppression.');
          btn.disabled = false;
          btn.innerHTML = '🗑 Supprimer';
        }
      });
    });
  }

  // Render announcement message with links and bold
  function renderAnnouncementHtml(text) {
    if (!text) return '';
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;word-break:break-all">$1</a>')
      .replace(/\n/g, '<br>');
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { render };
})();

window.GCAdminAnnouncementsSubView = AdminAnnouncementsSubView;
