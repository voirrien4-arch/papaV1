// Gold_Crew — History Sub-View
// Always loads fresh data from storage to avoid stale state
const HistorySubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  async function render(container) {
    // Always reload fresh from storage
    await GCAuth.reloadUserData();
    const history = await GCAuth.getUserHistory();

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up">
          <h2 class="text-xl font-bold" style="color:var(--text-primary)">${t('history.title')}</h2>
          <input type="text" id="history-search" class="input-field" style="max-width:280px" placeholder="${t('history.search_placeholder')}" />
        </div>
        <div id="history-list" class="animate-fade-up animate-delay-1">
          ${history.length === 0 ? `
            <div class="glass-card p-12 text-center">
              <p class="text-4xl mb-3 opacity-50">📜</p>
              <p style="color:var(--text-muted)">${t('history.empty')}</p>
              <button class="btn btn-outline btn-sm mt-4" id="history-goto-search">▶ ${t('dashboard.new_search')}</button>
            </div>
          ` : renderTable(history)}
        </div>
      </div>
    `;
    document.getElementById('history-goto-search')?.addEventListener('click', () => GCDashboardView.navigateSubView('search'));
    bindSearch(history);
    bindActions();
  }

  function renderTable(history) {
    return `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>${t('history.date')}</th>
              <th>${t('history.type')}</th>
              <th>Requête</th>
              <th>${t('history.duration')}</th>
              <th>${t('history.credits')}</th>
              <th>${t('history.result')}</th>
              <th>${t('history.actions')}</th>
            </tr>
          </thead>
          <tbody id="history-tbody">
            ${history.map(h => `
              <tr data-id="${h.id}">
                <td>
                  <div class="text-sm" style="color:var(--text-primary)">${new Date(h.date).toLocaleDateString('fr-FR')}</div>
                  <div class="text-xs" style="color:var(--text-muted)">${new Date(h.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td><span class="badge badge-gold">${h.type || '—'}</span></td>
                <td class="truncate max-w-[160px]" style="color:var(--text-primary)">${h.query || '—'}</td>
                <td style="color:var(--text-secondary)">${h.duration ? h.duration + 's' : '—'}</td>
                <td style="color:var(--text-secondary)">${h.credits || 1}</td>
                <td><span class="badge badge-success">${(h.results || []).length} résultat(s)</span></td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-sm history-view" data-id="${h.id}" aria-label="${t('common.view')}">👁️</button>
                    <button class="btn btn-ghost btn-sm history-export" data-id="${h.id}" aria-label="Export CSV">📄</button>
                    <button class="btn btn-ghost btn-sm history-report" data-id="${h.id}" aria-label="Télécharger rapport" style="color:var(--gold)">📊</button>
                    <button class="btn btn-ghost btn-sm history-delete" data-id="${h.id}" aria-label="${t('common.delete')}" style="color:var(--danger)">🗑️</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function bindSearch(history) {
    document.getElementById('history-search')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = history.filter(h =>
        (h.query || '').toLowerCase().includes(q) ||
        (h.type || '').toLowerCase().includes(q)
      );
      const list = document.getElementById('history-list');
      list.innerHTML = filtered.length === 0
        ? `<div class="glass-card p-12 text-center"><p style="color:var(--text-muted)">${t('history.empty')}</p></div>`
        : renderTable(filtered);
      bindActions();
    });
  }

  function bindActions() {
    document.querySelectorAll('.history-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm(t('history.confirm_delete'))) {
          await GCAuth.deleteHistory(btn.dataset.id);
          render(document.querySelector('#view-container'));
          GCToast.success('Recherche supprimée.');
        }
      });
    });
    document.querySelectorAll('.history-export').forEach(btn => {
      btn.addEventListener('click', () => {
        const history = GCState.get().searchHistory || [];
        const entry = history.find(h => h.id === btn.dataset.id);
        if (entry) exportEntryCSV(entry);
      });
    });
    document.querySelectorAll('.history-report').forEach(btn => {
      btn.addEventListener('click', () => {
        const history = GCState.get().searchHistory || [];
        const entry = history.find(h => h.id === btn.dataset.id);
        if (entry) downloadHistoryReport(entry);
      });
    });
    document.querySelectorAll('.history-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const history = GCState.get().searchHistory || [];
        const entry = history.find(h => h.id === btn.dataset.id);
        if (entry) showDetail(entry);
      });
    });
  }

  function showDetail(entry) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:650px;max-height:80vh;overflow-y:auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold" style="color:var(--text-primary)">${escapeHtml(entry.type)}: ${escapeHtml(entry.query)}</h3>
          <button class="btn btn-ghost btn-sm modal-close">✕</button>
        </div>
        <p class="text-xs mb-4" style="color:var(--text-muted)">${new Date(entry.date).toLocaleString('fr-FR')} · ${entry.duration}s</p>

        <!-- AI Analysis if available -->
        ${entry.aiAnalysis ? `
          <div class="mb-4 p-3 rounded" style="background:rgba(0,229,255,0.03);border:1px solid rgba(0,229,255,0.15)">
            <div class="flex items-center gap-2 mb-2">
              <span style="color:var(--cyan)">◈</span>
              <span class="text-xs font-bold" style="color:var(--cyan)">ANALYSE IA</span>
            </div>
            <div class="text-xs" style="color:var(--text-secondary);line-height:1.6;max-height:200px;overflow-y:auto">
              ${renderMarkdownInline(entry.aiAnalysis)}
            </div>
          </div>
        ` : ''}

        <!-- Results -->
        <div class="space-y-3">
          ${(entry.results || []).map(r => {
            const conf = r.confidence || 0;
            const links = r.links || [];
            const dataEntries = r.data ? Object.entries(r.data).slice(0, 10) : [];
            return `
              <div class="rounded p-3" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-left:2px solid ${conf >= 70 ? 'var(--green)' : conf >= 40 ? 'var(--amber)' : 'var(--red)'}">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="badge badge-gold">${r.source}</span>
                    ${r.date ? `<span class="text-xs" style="color:var(--text-muted);font-size:0.6rem">${new Date(r.date).toLocaleDateString('fr-FR')}</span>` : ''}
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="confidence-bar"><div class="confidence-fill ${conf >= 70 ? 'confidence-high' : conf >= 40 ? 'confidence-medium' : 'confidence-low'}" style="width:${conf}%"></div></div>
                    <span class="text-xs font-bold" style="color:var(--${conf >= 70 ? 'green' : conf >= 40 ? 'amber' : 'red'});font-size:0.6rem">${conf}%</span>
                  </div>
                </div>

                ${dataEntries.length ? `
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 mb-2">
                    ${dataEntries.map(([k, v]) => `
                      <div class="flex gap-1.5 text-xs overflow-hidden">
                        <span style="color:var(--text-muted);min-width:60px;font-size:0.65rem">${escapeHtml(k)}:</span>
                        <span style="color:var(--text-primary);word-break:break-all;font-size:0.7rem">${formatValue(v)}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                ${links.length ? `
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    ${links.map(l => `
                      <a href="${escapeAttr(l)}" target="_blank" rel="noopener" class="text-xs px-2 py-0.5 rounded inline-flex items-center gap-1" style="background:rgba(0,229,255,0.08);color:var(--cyan);font-size:0.6rem;text-decoration:none;transition:all 0.15s ease">
                        🔗 ${l.length > 55 ? l.slice(0, 55) + '...' : l}
                      </a>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); }
    });
  }

  function formatValue(v) {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'object') {
      // If it's an array of strings, join with links
      if (Array.isArray(v)) {
        return v.map(item => {
          const s = String(item);
          if (s.startsWith('http://') || s.startsWith('https://')) {
            return `<a href="${escapeAttr(s)}" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline">${s.length > 50 ? s.slice(0, 50) + '...' : s}</a>`;
          }
          return escapeHtml(s);
        }).join(', ');
      }
      return escapeHtml(JSON.stringify(v));
    }
    const s = String(v);
    // Auto-link URLs
    if (s.startsWith('http://') || s.startsWith('https://')) {
      return `<a href="${escapeAttr(s)}" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline">${s.length > 60 ? s.slice(0, 60) + '...' : s}</a>`;
    }
    return escapeHtml(s.length > 200 ? s.slice(0, 200) + '...' : s);
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderMarkdownInline(md) {
    if (!md) return '';
    return escapeHtml(md)
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded" style="background:rgba(0,255,65,0.06);color:var(--green);font-size:0.7rem">$1</code>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline">$1</a>')
      .replace(/^- (.+)$/gm, '<div class="flex gap-2 py-0.5"><span style="color:var(--green)">▸</span><span>$1</span></div>')
      .replace(/^## (.+)$/gm, '<div class="font-bold mt-2 mb-1" style="color:var(--green)">$1</div>')
      .replace(/^### (.+)$/gm, '<div class="font-bold mt-2" style="color:var(--cyan)">$1</div>')
      .replace(/\n/g, '<br>');
  }

  function exportEntryCSV(entry) {
    const rows = [['Source', 'Date', 'Confiance', 'Données', 'Liens']];
    (entry.results || []).forEach(r => {
      rows.push([r.source || '', r.date || '', r.confidence || '', r.data ? JSON.stringify(r.data) : '', (r.links || []).join(' | ')]);
    });
    const csv = rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gold_crew_${entry.type}_${entry.query}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    GCToast.success('Export CSV téléchargé.');
  }

  function downloadHistoryReport(entry) {
    const results = entry.results || [];
    const errors = entry.errors || [];
    const now = new Date(entry.date);
    const dateStr = now.toLocaleDateString('fr-FR');
    const timeStr = now.toLocaleTimeString('fr-FR');
    const fileDate = now.toISOString().slice(0, 10).replace(/-/g, '');
    const type = entry.type || 'unknown';
    const query = entry.query || '';
    const totalDur = entry.duration || 0;
    const sourcesQueried = entry.sourcesQueried || [];
    const aiAnalysis = entry.aiAnalysis || '';
    const aiError = entry.aiError || null;

    let resultsHTML = '';
    if (results.length > 0) {
      resultsHTML = results.map(r => {
        const conf = r.confidence || 0;
        const confColor = conf >= 70 ? '#00ff41' : conf >= 40 ? '#ffb800' : '#ff0040';
        const dataEntries = r.data ? Object.entries(r.data).slice(0, 12) : [];
        const links = r.links || [];
        return `
          <div style="background:#0a0a0a;border:1px solid #111;border-left:3px solid ${confColor};border-radius:4px;padding:14px;margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="color:#00ff41;font-size:13px;font-weight:700">${r.icon || '◆'} ${r.source || 'UNKNOWN'}</span>
              <span style="color:${confColor};font-size:12px;font-weight:700">Confiance: ${conf}%</span>
            </div>
            ${dataEntries.length ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px">${dataEntries.map(([k, v]) => `
              <div style="font-size:11px"><span style="color:#555">${k}:</span> <span style="color:#c8c8c8">${escapeHtml(typeof v === 'object' ? JSON.stringify(v) : String(v)).slice(0, 120)}</span></div>
            `).join('')}</div>` : ''}
            ${links.length ? `<div style="margin-top:6px">${links.map(l => `<span style="color:#00e5ff;font-size:10px">${escapeHtml(l)}</span>`).join('<br>')}</div>` : ''}
          </div>
        `;
      }).join('');
    } else {
      resultsHTML = '<p style="color:#555;font-size:12px;text-align:center;padding:20px">Aucun r\u00e9sultat trouv\u00e9.</p>';
    }

    let errorsHTML = '';
    if (errors.length > 0) {
      errorsHTML = `<div style="margin-top:16px"><div style="color:#555;font-size:10px;padding:8px;background:rgba(0,229,255,0.03);border:1px solid rgba(0,229,255,0.08);border-radius:4px">\ud83d\udce1 ${errors.length} source(s) interrog\u00e9e(s) sans donn\u00e9es publiques pour cette requ\u00eate.</div></div>`;
    }

    let aiHTML = '';
    if (aiAnalysis) {
      const formatted = aiAnalysis
        .replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/^### (.+)$/gm, '<h4 style="color:#00e5ff;font-size:13px;font-weight:700;margin:12px 0 6px">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 style="color:#00ff41;font-size:14px;font-weight:700;margin:14px 0 8px">$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#c8c8c8">$1</strong>')
        .replace(/^- (.+)$/gm, '<div style="color:#888;font-size:11px;padding:2px 0">▸ $1</div>')
        .replace(/\n\n/g, '<div style="height:6px"></div>')
        .replace(/\n/g, '<br>');
      aiHTML = `<div style="margin-top:20px"><div style="background:rgba(0,229,255,0.04);border:1px solid rgba(0,229,255,0.15);border-radius:4px;padding:14px"><h3 style="color:#00e5ff;font-size:13px;font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.1em">◈ Analyse Gold_Crew AI</h3><div style="color:#888;font-size:11px;line-height:1.7">${formatted}</div></div></div>`;
    }

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Gold_Crew OSINT — Rapport ${type}: ${query}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'JetBrains Mono',monospace;background:#060606;color:#c8c8c8;padding:0;line-height:1.6}</style></head>
<body><div style="max-width:800px;margin:0 auto;padding:24px">
<div style="background:linear-gradient(135deg,#0a0a0a,#080808);border:1px solid rgba(0,255,65,0.15);border-radius:6px;padding:24px;margin-bottom:20px;position:relative;overflow:hidden">
<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
<div><div style="font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:4px">RAPPORT CONFIDENTIEL</div>
<h1 style="color:#00ff41;font-size:22px;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:0.05em">GOLD_CREW <span style="color:#d4af37">OSINT</span></h1>
<div style="font-size:10px;color:#555;margin-top:4px">Plateforme d'Intelligence Open Source • Créé par Mcamara</div></div>
<div style="text-align:right"><div style="color:#d4af37;font-size:18px;font-weight:900">GC</div><div style="font-size:9px;color:#555">v1.0 — ${dateStr}</div></div></div></div>
<div style="background:#0a0a0a;border:1px solid #111;border-radius:4px;padding:16px;margin-bottom:16px">
<h2 style="color:#00ff41;font-size:14px;font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.1em">⊞ Informations de Recherche</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:11px">
<div><span style="color:#555">Type:</span> <span style="color:#00e5ff">${escapeHtml(type)}</span></div>
<div><span style="color:#555">Cible:</span> <span style="color:#00ff41;font-weight:700">${escapeHtml(query)}</span></div>
<div><span style="color:#555">Date:</span> <span style="color:#c8c8c8">${dateStr} à ${timeStr}</span></div>
<div><span style="color:#555">Durée:</span> <span style="color:#c8c8c8">${totalDur}s</span></div>
<div><span style="color:#555">Résultats:</span> <span style="color:#c8c8c8;font-weight:700">${results.length}</span></div>
<div><span style="color:#555">Sources:</span> <span style="color:#c8c8c8">${sourcesQueried.join(', ') || '—'}</span></div></div></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
<div style="background:#0a0a0a;border:1px solid #111;border-radius:4px;padding:14px;text-align:center"><div style="color:#00ff41;font-size:22px;font-weight:900">${results.length}</div><div style="color:#555;font-size:9px;text-transform:uppercase;letter-spacing:0.1em">Résultats</div></div>
<div style="background:#0a0a0a;border:1px solid #111;border-radius:4px;padding:14px;text-align:center"><div style="color:#d4af37;font-size:22px;font-weight:900">${results.length > 0 ? Math.round(results.reduce((a, r) => a + (r.confidence || 0), 0) / results.length) : 0}%</div><div style="color:#555;font-size:9px;text-transform:uppercase;letter-spacing:0.1em">Confiance Moy.</div></div>
<div style="background:#0a0a0a;border:1px solid #111;border-radius:4px;padding:14px;text-align:center"><div style="color:#00e5ff;font-size:22px;font-weight:900">${sourcesQueried.length}</div><div style="color:#555;font-size:9px;text-transform:uppercase;letter-spacing:0.1em">Sources</div></div></div>
${aiHTML}
<div style="margin-top:20px"><h3 style="color:#00ff41;font-size:13px;font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.1em">▸ Données OSINT Brutes (${results.length})</h3>${resultsHTML}</div>
${errorsHTML}
<div style="margin-top:30px;padding-top:16px;border-top:1px solid rgba(0,255,65,0.08);text-align:center">
<div style="color:#00ff41;font-size:12px;font-weight:700;font-family:'JetBrains Mono',monospace">GOLD_CREW OSINT</div>
<div style="color:#555;font-size:9px;margin-top:4px">Plateforme OSINT Professionnelle — Créé par Mcamara • © 2024 Gold_Crew</div>
<div style="margin-top:12px;padding:8px;background:rgba(0,255,65,0.03);border:1px solid rgba(0,255,65,0.08);border-radius:4px;text-align:center;line-height:1.8"><span style="color:#d4af37;font-size:10px;font-weight:700">GOLD_CREW OSINT</span> <span style="color:#333;font-size:9px">—</span> <span style="color:#555;font-size:9px">Gold_Crew OSINT</span> <span style="color:#333;font-size:9px">·</span> <span style="color:#555;font-size:9px">Digital Crew</span> <span style="color:#333;font-size:9px">·</span> <span style="color:#555;font-size:9px">Hackers Academy X</span></div></div></div></body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gold_Crew_OSINT_${type}_${query}_${fileDate}.html`;
    a.click();
    URL.revokeObjectURL(url);
    GCToast.success('Rapport Gold_Crew OSINT téléchargé.');
  }

  return { render };
})();

window.GCHistorySubView = HistorySubView;
