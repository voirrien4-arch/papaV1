// Gold_Crew — Admin AI Sources Sub-View
// Upload ZIP files with knowledge base data for Gold_Crew AI
const AdminAiSourcesSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  const MAX_FILE_SIZE = 512 * 1024; // 500KB max text content
  const MAX_FILES = 50;
  const TEXT_EXTENSIONS = ['.txt', '.md', '.json', '.csv', '.xml', '.html', '.log', '.yaml', '.yml', '.tsv', '.rtf', '.ini', '.cfg', '.conf'];

  async function render(container) {
    const sources = await getSources();

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-4">
        <!-- Header -->
        <div class="animate-fade-up">
          <h2 class="text-lg font-bold" style="color:var(--text-green)">🧠 Sources IA — Base de Connaissances</h2>
          <p class="text-xs" style="color:var(--text-muted)">Uploadez des fichiers ZIP contenant des données que Gold_Crew AI utilisera comme référence lors des analyses OSINT.</p>
        </div>

        <!-- Stats bar -->
        <div class="animate-fade-up animate-delay-1 flex flex-wrap items-center gap-3 p-3 rounded" style="background:#0a0a0a;border:1px solid var(--border-subtle)">
          <div class="flex items-center gap-2">
            <span class="text-xs" style="color:var(--text-muted)">Fichiers chargés :</span>
            <span class="badge ${sources.files.length > 0 ? 'badge-success' : 'badge-warning'}" style="font-size:0.5rem">${sources.files.length} / ${MAX_FILES}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs" style="color:var(--text-muted)">Taille totale :</span>
            <span class="badge badge-info" style="font-size:0.5rem">${formatBytes(sources.totalSize)}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs" style="color:var(--text-muted)">Dernière MAJ :</span>
            <span class="badge badge-green" style="font-size:0.5rem">${sources.lastUpdated ? new Date(sources.lastUpdated).toLocaleString('fr-FR') : 'Jamais'}</span>
          </div>
        </div>

        <!-- Upload zone -->
        <div class="animate-fade-up animate-delay-2" style="background:#0a0a0a;border:1px solid rgba(0,255,65,0.15);border-radius:var(--radius);padding:14px">
          <h3 class="text-xs font-bold mb-3" style="color:var(--green)">📂 UPLOADER UN ZIP</h3>

          <div id="ai-drop-zone" class="p-6 rounded text-center cursor-pointer transition-all"
               style="border:2px dashed rgba(0,255,65,0.15);background:rgba(0,255,65,0.02);transition:all 0.2s ease">
            <div style="font-size:2rem;opacity:0.4;margin-bottom:8px">📁</div>
            <p class="text-xs font-bold mb-1" style="color:var(--text-green)">Glissez un fichier ZIP ici</p>
            <p class="text-xs" style="color:var(--text-muted)">ou cliquez pour sélectionner</p>
            <p class="text-xs mt-2" style="color:var(--text-muted);font-size:0.55rem">
              Fichiers acceptés : .txt, .md, .json, .csv, .xml, .html, .log, .yaml, .ini — Max ${formatBytes(MAX_FILE_SIZE)} de texte
            </p>
          </div>
          <input type="file" id="ai-zip-input" accept=".zip" style="display:none" />
        </div>

        <!-- Upload progress -->
        <div id="ai-upload-progress" class="animate-fade-up" style="display:none">
          <div style="background:#0a0a0a;border:1px solid rgba(0,229,255,0.15);border-radius:var(--radius);padding:14px">
            <div class="flex items-center justify-between mb-2">
              <span id="ai-upload-label" class="text-xs" style="color:var(--cyan)">Extraction en cours...</span>
              <span id="ai-upload-pct" class="text-xs" style="color:var(--green)">0%</span>
            </div>
            <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">
              <div id="ai-upload-bar" style="height:100%;width:0%;background:var(--cyan);border-radius:2px;transition:width 0.3s ease"></div>
            </div>
          </div>
        </div>

        <!-- Uploaded files list -->
        <div class="animate-fade-up animate-delay-3" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:14px">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-bold" style="color:var(--text-green)">📋 FICHIERS CHARGÉS</h3>
            ${sources.files.length > 0 ? `<button class="btn btn-danger btn-sm" id="ai-clear-all" style="padding:3px 10px;font-size:0.6rem">🗑 Tout effacer</button>` : ''}
          </div>
          ${sources.files.length === 0
            ? `<div class="empty-state" style="padding:24px">
                <div class="icon" style="opacity:0.3">🧠</div>
                <p class="text-xs" style="color:var(--text-muted)">Aucune source IA chargée.</p>
                <p class="text-xs mt-1" style="color:var(--text-muted);font-size:0.55rem">Uploadez un ZIP contenant vos données de référence.</p>
              </div>`
            : `<div class="space-y-1.5" id="ai-files-list">
                ${sources.files.map((f, i) => `
                  <div class="flex items-center justify-between p-2.5 rounded" style="background:rgba(0,255,65,0.02);border:1px solid rgba(0,255,65,0.06)">
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                      <span style="color:var(--cyan);font-size:0.9rem">${getFileIcon(f.name)}</span>
                      <div class="flex-1 min-w-0">
                        <div class="text-xs font-medium truncate" style="color:var(--text-primary)">${escapeHtml(f.name)}</div>
                        <div class="text-xs" style="color:var(--text-muted);font-size:0.55rem">${formatBytes(f.size)} · ${f.lineCount || 0} lignes · ${new Date(f.uploadedAt).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-1">
                      <button class="btn btn-ghost btn-sm ai-preview-btn" data-index="${i}" style="padding:3px 8px;font-size:0.6rem;color:var(--cyan)" title="Aperçu">👁</button>
                      <button class="btn btn-ghost btn-sm ai-delete-btn" data-index="${i}" style="padding:3px 8px;font-size:0.6rem;color:var(--red)" title="Supprimer">🗑</button>
                    </div>
                  </div>
                `).join('')}
              </div>`
          }
        </div>

        <!-- Preview modal -->
        <div id="ai-preview-modal" class="modal-overlay" style="display:none">
          <div class="modal" style="max-width:600px;max-height:80vh;display:flex;flex-direction:column">
            <div class="flex items-center justify-between mb-3">
              <h3 id="ai-preview-title" class="text-sm font-bold" style="color:var(--green)">Aperçu</h3>
              <button id="ai-preview-close" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem;padding:4px">×</button>
            </div>
            <div id="ai-preview-content" class="flex-1 overflow-y-auto p-3 rounded" style="background:#060606;border:1px solid var(--border-subtle);max-height:60vh;font-family:var(--font-mono);font-size:0.7rem;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap;word-break:break-all"></div>
            <div class="mt-3 text-center">
              <button id="ai-preview-ok" class="btn btn-outline btn-sm">Fermer</button>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="animate-fade-up animate-delay-4 p-4 rounded" style="background:rgba(0,229,255,0.02);border:1px solid rgba(0,229,255,0.1)">
          <h4 class="text-xs font-bold mb-2" style="color:var(--cyan)">ℹ Comment ça fonctionne</h4>
          <div class="text-xs space-y-1.5" style="color:var(--text-secondary);line-height:1.7">
            <p>▸ <strong style="color:var(--text-primary)">Uploadez un ZIP</strong> contenant vos fichiers de données (texte, JSON, CSV, Markdown...).</p>
            <p>▸ <strong style="color:var(--gold)">Gold_Crew AI</strong> utilisera ces fichiers comme <strong style="color:var(--text-primary)">base de connaissances de référence</strong> lors des analyses OSINT.</p>
            <p>▸ L'IA pourra <strong style="color:var(--green)">croiser les données OSINT</strong> avec vos sources personnalisées pour des analyses plus précises.</p>
            <p>▸ <strong style="color:var(--red)">Limite :</strong> ${MAX_FILES} fichiers, ${formatBytes(MAX_FILE_SIZE)} de texte total. Les fichiers binaires/images sont ignorés.</p>
            <p>▸ Vous pouvez mettre à jour les sources à tout moment — les anciens fichiers sont remplacés.</p>
          </div>
        </div>
      </div>
    `;

    bindDropZone();
    bindButtons(sources);
    bindPreview(sources);
  }

  function bindDropZone() {
    const zone = document.getElementById('ai-drop-zone');
    const input = document.getElementById('ai-zip-input');
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.style.borderColor = 'var(--green)';
      zone.style.background = 'rgba(0,255,65,0.06)';
    });

    zone.addEventListener('dragleave', () => {
      zone.style.borderColor = 'rgba(0,255,65,0.15)';
      zone.style.background = 'rgba(0,255,65,0.02)';
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.style.borderColor = 'rgba(0,255,65,0.15)';
      zone.style.background = 'rgba(0,255,65,0.02)';
      const file = e.dataTransfer.files[0];
      if (file) handleZipFile(file);
    });

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (file) handleZipFile(file);
      input.value = '';
    });
  }

  function bindButtons(sources) {
    document.getElementById('ai-clear-all')?.addEventListener('click', async () => {
      if (!confirm('Supprimer toutes les sources IA ? Gold_Crew AI perdra cette base de connaissances.')) return;
      await clearSources();
      GCToast.success('Sources IA effacées.');
      render(document.querySelector('#admin-view-container'));
    });

    document.querySelectorAll('.ai-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.index);
        const sources = await getSources();
        if (idx < 0 || idx >= sources.files.length) return;
        const name = sources.files[idx].name;
        if (!confirm(`Supprimer "${name}" ?`)) return;
        sources.files.splice(idx, 1);
        sources.totalSize = sources.files.reduce((s, f) => s + (f.size || 0), 0);
        sources.lastUpdated = new Date().toISOString();
        await saveSources(sources);
        GCToast.success(`"${name}" supprimé.`);
        render(document.querySelector('#admin-view-container'));
      });
    });
  }

  function bindPreview(sources) {
    const modal = document.getElementById('ai-preview-modal');
    const closeBtn = document.getElementById('ai-preview-close');
    const okBtn = document.getElementById('ai-preview-ok');

    document.querySelectorAll('.ai-preview-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.index);
        const src = await getSources();
        const file = src.files[idx];
        if (!file) return;
        document.getElementById('ai-preview-title').textContent = `📄 ${file.name}`;
        document.getElementById('ai-preview-content').textContent = file.content.slice(0, 10000) + (file.content.length > 10000 ? '\n\n... (tronqué)' : '');
        modal.style.display = 'flex';
      });
    });

    const closeModal = () => { modal.style.display = 'none'; };
    closeBtn?.addEventListener('click', closeModal);
    okBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.style.display === 'flex') closeModal(); });
  }

  async function handleZipFile(file) {
    if (!file.name.endsWith('.zip')) {
      GCToast.error('Seuls les fichiers .zip sont acceptés.');
      return;
    }

    const progressWrap = document.getElementById('ai-upload-progress');
    const bar = document.getElementById('ai-upload-bar');
    const pct = document.getElementById('ai-upload-pct');
    const label = document.getElementById('ai-upload-label');

    progressWrap.style.display = 'block';
    label.textContent = 'Chargement JSZip...';
    pct.textContent = '0%';
    bar.style.width = '0%';

    try {
      if (!window.JSZip) {
        await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
      }

      label.textContent = 'Extraction du ZIP...';
      pct.textContent = '10%';
      bar.style.width = '10%';

      const zip = await JSZip.loadAsync(file);
      const entries = Object.keys(zip.files).filter(name => {
        if (zip.files[name].dir) return false;
        const ext = '.' + name.split('.').pop().toLowerCase();
        return TEXT_EXTENSIONS.includes(ext);
      });

      if (entries.length === 0) {
        GCToast.warning('Aucun fichier texte trouvé dans le ZIP.');
        progressWrap.style.display = 'none';
        return;
      }

      const existingSources = await getSources();
      const newFiles = [];
      let totalSize = 0;
      const limit = Math.min(entries.length, MAX_FILES);

      for (let i = 0; i < limit; i++) {
        const name = entries[i];
        const pctVal = Math.round(10 + (i / limit) * 80);
        label.textContent = `Extraction: ${name.split('/').pop()}`;
        pct.textContent = `${pctVal}%`;
        bar.style.width = `${pctVal}%`;

        try {
          const content = await zip.files[name].async('string');
          const size = new Blob([content]).size;
          if (totalSize + size > MAX_FILE_SIZE) {
            GCToast.warning(`Limite de taille atteinte (${formatBytes(MAX_FILE_SIZE)}). ${i} fichiers chargés.`);
            break;
          }
          const lineCount = content.split('\n').length;
          newFiles.push({
            name: name.split('/').pop(),
            path: name,
            content: content,
            size: size,
            lineCount: lineCount,
            uploadedAt: new Date().toISOString(),
          });
          totalSize += size;
        } catch (e) {
          console.warn('Failed to extract:', name, e);
        }

        await new Promise(r => setTimeout(r, 10)); // yield
      }

      label.textContent = 'Sauvegarde...';
      pct.textContent = '95%';
      bar.style.width = '95%';

      // Merge: replace existing files with same names, add new ones
      const mergedFiles = [...existingSources.files];
      for (const nf of newFiles) {
        const existIdx = mergedFiles.findIndex(f => f.name === nf.name);
        if (existIdx >= 0) {
          mergedFiles[existIdx] = nf;
        } else {
          mergedFiles.push(nf);
        }
      }

      const sources = {
        files: mergedFiles.slice(0, MAX_FILES),
        totalSize: mergedFiles.reduce((s, f) => s + (f.size || 0), 0),
        lastUpdated: new Date().toISOString(),
      };

      await saveSources(sources);

      pct.textContent = '100%';
      bar.style.width = '100%';
      label.textContent = 'Terminé !';

      GCToast.success(`${newFiles.length} fichier(s) chargé(s) — ${formatBytes(totalSize)} de données.`);

      setTimeout(() => {
        progressWrap.style.display = 'none';
        render(document.querySelector('#admin-view-container'));
      }, 800);

    } catch (err) {
      GCToast.error('Erreur: ' + err.message);
      progressWrap.style.display = 'none';
    }
  }

  // ── Storage ──
  // AI knowledge base is stored INSIDE site_settings so it syncs across all devices/users.
  const SITE_SETTINGS_KEY = 'gc_site_settings';

  async function getSources() {
    try {
      const settings = (await GCStorage.get(SITE_SETTINGS_KEY)) || {};
      return settings.aiKnowledgeBase || { files: [], totalSize: 0, lastUpdated: null };
    } catch {
      return { files: [], totalSize: 0, lastUpdated: null };
    }
  }

  async function saveSources(sources) {
    const settings = (await GCStorage.get(SITE_SETTINGS_KEY)) || {};
    settings.aiKnowledgeBase = sources;
    await GCStorage.set(SITE_SETTINGS_KEY, settings);
  }

  async function clearSources() {
    const settings = (await GCStorage.get(SITE_SETTINGS_KEY)) || {};
    delete settings.aiKnowledgeBase;
    await GCStorage.set(SITE_SETTINGS_KEY, settings);
  }

  // ── Helpers ──
  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function getFileIcon(name) {
    const ext = name.split('.').pop().toLowerCase();
    const icons = {
      json: '📋', csv: '📊', txt: '📄', md: '📝', xml: '📰',
      html: '🌐', log: '📃', yaml: '⚙', yml: '⚙', ini: '🔧',
      cfg: '🔧', conf: '🔧', tsv: '📊', rtf: '📄',
    };
    return icons[ext] || '📄';
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  return { render, getSources };
})();

window.GCAdminAiSourcesSubView = AdminAiSourcesSubView;
