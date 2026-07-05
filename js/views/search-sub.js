// Gold_Crew — Search Sub-View (Real OSINT + Mistral AI Analysis)
const SearchSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  const SEARCH_TYPES = [
    { value: 'name', label: 'search.types.name', icon: '⊕' },
    { value: 'fullname', label: 'search.types.fullname', icon: '⊕' },
    { value: 'phone', label: 'search.types.phone', icon: '⊕' },
    { value: 'email', label: 'search.types.email', icon: '⊗' },
    { value: 'username', label: 'search.types.username', icon: '⊘' },
    { value: 'pseudo', label: 'search.types.pseudo', icon: '⊙' },
    { value: 'keyword', label: 'search.types.keyword', icon: '⊛' },
    { value: 'domain', label: 'search.types.domain', icon: '⊚' },
    { value: 'ip', label: 'search.types.ip', icon: '⊜' },
    { value: 'url', label: 'search.types.url', icon: '⊝' },
    { value: 'hash', label: 'search.types.hash', icon: '⊞' },
    { value: 'address', label: 'search.types.address', icon: '⌂' },
    { value: 'whatsapp', label: 'search.types.whatsapp', icon: '📱' },
    { value: 'person', label: 'search.types.person', icon: '👤' },
    { value: 'image', label: 'search.types.image', icon: '🖼' },
  ];

  let _currentResults = null;

  function render(container) {
    const crew = GCState.getCrewRemaining();
    container.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-4">
        <!-- Header -->
        <div class="animate-fade-up">
          <h2 class="text-lg font-bold" style="color:var(--text-green);font-family:var(--font-mono)">
            <span style="color:var(--text-muted)">root@osint</span>:<span style="color:var(--cyan)">~</span>$ search
          </h2>
          <p class="text-xs mt-1" style="color:var(--text-muted)">${t('search.subtitle')}</p>
        </div>

        <!-- Crew indicator -->
        <div class="flex items-center gap-3 animate-fade-up animate-delay-1">
          <span class="badge ${crew > 0 ? 'badge-green' : 'badge-danger'}" style="font-family:var(--font-mono)">
            ${crew > 0 ? `▸ ${crew} CREW LEFT` : `⊘ CREW EXHAUSTED`}
          </span>
          <span class="text-xs" style="color:var(--text-muted)" id="source-count"></span>
          <span class="badge badge-info" style="font-size:0.55rem" id="ai-status-badge">⚙ GOLD_CREW AI</span>
        </div>

        <!-- Search form -->
        <div class="animate-fade-up animate-delay-2" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:16px">
          <form id="osint-search-form" class="space-y-4" novalidate>
            <!-- Search type selector -->
            <div>
              <label class="block text-xs font-bold mb-2" style="color:var(--green);text-transform:uppercase;letter-spacing:0.1em">${t('search.type_label')}</label>
              <div class="grid grid-cols-3 sm:grid-cols-5 gap-1.5" id="type-grid">
                ${SEARCH_TYPES.map(st => `
                  <button type="button" class="search-type-btn flex flex-col items-center gap-0.5 p-2 rounded cursor-pointer transition-all"
                    style="background:${st.value === 'username' ? 'rgba(0,255,65,0.08)' : 'rgba(255,255,255,0.02)'};border:1px solid ${st.value === 'username' ? 'rgba(0,255,65,0.2)' : 'rgba(255,255,255,0.04)'};color:${st.value === 'username' ? 'var(--green)' : 'var(--text-muted)'}"
                    data-type="${st.value}">
                    <span style="font-size:0.8rem">${st.icon}</span>
                    <span class="text-xs text-center leading-tight" style="font-size:0.55rem">${t(st.label)}</span>
                  </button>
                `).join('')}
              </div>
              <input type="hidden" id="search-type" value="username" />
            </div>

            <!-- Search input -->
            <div>
              <label class="block text-xs mb-1.5" style="color:var(--text-muted)">TARGET</label>
              <div class="flex gap-2">
                <div class="flex-1 relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2" style="color:var(--green);font-size:0.8rem">$</span>
                  <input type="text" id="search-query" class="input-field" style="padding-left:28px" placeholder="${t('search.input_placeholder')}" autocomplete="off" />
                </div>
                <button type="submit" class="btn btn-green shrink-0" id="search-btn" ${crew <= 0 ? 'disabled' : ''}>
                  ▶ SCAN
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Active sources indicator -->
        <div id="active-sources-bar" class="animate-fade-up animate-delay-3"></div>

        <!-- Results area -->
        <div id="search-results" class="space-y-3"></div>

        ${crew <= 0 ? renderCrewBanner() : ''}
      </div>
    `;
    loadSourceStatus();
    bindTypeSelector();
    bindSearch(crew);
  }

  async function loadSourceStatus() {
    try {
      const sources = await GCOsintEngine.getSources();
      const type = document.getElementById('search-type')?.value || 'username';
      const available = sources.filter(s => s.enabled && s.searchTypes.includes(type));
      const bar = document.getElementById('active-sources-bar');
      const countEl = document.getElementById('source-count');
      const aiBadge = document.getElementById('ai-status-badge');
      if (aiBadge) {
        const ks = GCMistralAI.getKeyStatus();
        if (ks.configured) {
          aiBadge.textContent = '◈ GOLD_CREW AI';
          aiBadge.className = 'badge badge-info';
          aiBadge.title = 'Clé: ' + ks.masked;
        } else {
          aiBadge.textContent = '⊘ AI OFFLINE';
          aiBadge.className = 'badge badge-warning';
          aiBadge.title = 'Clé API Gold_Crew non configurée';
        }
      }
      if (bar) {
        bar.innerHTML = `
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs" style="color:var(--text-muted)">SOURCES ACTIVES:</span>
            ${available.length === 0
              ? '<span class="text-xs" style="color:var(--red)">Aucune source pour ce type</span>'
              : available.map(s => `<span class="badge badge-green" style="font-size:0.55rem">${s.icon} ${s.name}</span>`).join('')
            }
          </div>
        `;
      }
      if (countEl) {
        countEl.textContent = `${available.length} source(s) active(s)`;
      }
    } catch {}
  }

  function renderCrewBanner() {
    return `
      <div class="text-center p-6 animate-fade-up animate-delay-3" style="background:rgba(255,0,64,0.03);border:1px solid rgba(255,0,64,0.15);border-radius:var(--radius)">
        <div class="text-xl mb-2" style="color:var(--red)">⊘</div>
        <h3 class="font-bold mb-2 text-sm" style="color:var(--red)">${t('search.crew_exhausted')}</h3>
        <p class="text-xs mb-3" style="color:var(--text-secondary)">${t('search.whatsapp_instructions')}</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-2 mb-2 flex-wrap">
          <a href="https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T" target="_blank" rel="noopener" class="btn btn-green btn-sm">
            💬 ${t('search.whatsapp_link_goldcrew')}
          </a>
          <a href="https://whatsapp.com/channel/0029VbBT7FdLCoX1TDyQQb1B" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="border-color:rgba(37,211,102,0.3);color:#25d366">
            💬 ${t('search.whatsapp_link_digitalcrew')}
          </a>
          <a href="https://whatsapp.com/channel/0029Vb5ioJzA2pLD4CZOCq2V" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="border-color:rgba(191,0,255,0.3);color:#bf00ff">
            💬 ${t('search.whatsapp_link_hackersacademy')}
          </a>
        </div>
        <p class="text-xs mt-2" style="color:var(--text-muted)">${t('search.contact_admin')}</p>
      </div>
    `;
  }

  function bindTypeSelector() {
    document.querySelectorAll('.search-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.search-type-btn').forEach(b => {
          b.style.background = 'rgba(255,255,255,0.02)';
          b.style.borderColor = 'rgba(255,255,255,0.04)';
          b.style.color = 'var(--text-muted)';
        });
        btn.style.background = 'rgba(0,255,65,0.08)';
        btn.style.borderColor = 'rgba(0,255,65,0.2)';
        btn.style.color = 'var(--green)';
        document.getElementById('search-type').value = btn.dataset.type;
        const typeName = SEARCH_TYPES.find(s => s.value === btn.dataset.type);
        document.getElementById('search-query').placeholder = `${t(typeName?.label || 'search.input_placeholder')}...`;
        loadSourceStatus();
      });
    });
  }

  function bindSearch(crew) {
    document.getElementById('osint-search-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentCrew = GCState.getCrewRemaining();
      if (currentCrew <= 0) {
        GCToast.warning(t('search.crew_exhausted'));
        return;
      }
      const query = document.getElementById('search-query')?.value.trim();
      const type = document.getElementById('search-type')?.value;
      if (!query) { GCToast.warning('Entrez un terme de recherche.'); return; }

      const btn = document.getElementById('search-btn');
      const resultsDiv = document.getElementById('search-results');
      btn.disabled = true;

      // ── Phase 1: OSINT Scan (with real-time progress) ──
      renderScanPhase(resultsDiv, type, query, 'osint');

      const startTime = Date.now();
      try {
        const osintResult = await GCOsintEngine.search(type, query, (progress) => {
          // Real-time source-by-source progress in the scan panel
          _handleScanProgress(progress, resultsDiv);
        });
        const osintDuration = ((Date.now() - startTime) / 1000).toFixed(1);

        if (osintResult.error && osintResult.results.length === 0) {
          // Check if we had any configured sources at all
          const allSources = await GCOsintEngine.getSources();
          const configuredSources = allSources.filter(s => s.enabled && s.searchTypes.includes(type));
          const needsKeyHint = configuredSources.length === 0
            ? `<p class="text-xs mt-2" style="color:var(--text-muted)">Les sources de données sont en cours de configuration pour ce type de recherche.</p>`
            : `<p class="text-xs mt-2" style="color:var(--text-muted)">Essayez avec d'autres termes de recherche ou changez le type de recherche.</p>`;
          resultsDiv.innerHTML = `
            <div class="p-6 text-center" style="background:rgba(0,229,255,0.03);border:1px solid rgba(0,229,255,0.15);border-radius:var(--radius)">
              <p class="text-sm" style="color:var(--cyan)">📡 Aucune donnée publique trouvée pour cette requête.</p>
              ${needsKeyHint}
            </div>
          `;
          GCToast.info('Aucune donnée trouvée pour cette requête.');
          btn.disabled = false;
          btn.innerHTML = '▶ SCAN';
          return;
        }

        // Deduct crew
        await GCAuth.recordSearch(GCState.getUser()?.id);

        // ── Phase 2: Mistral AI Analysis ──────────────
        renderScanPhase(resultsDiv, type, query, 'ai', osintResult);

        let aiAnalysis = '';
        let aiError = null;
        const aiStartTime = Date.now();

        try {
          if (osintResult.results.length > 0) {
            aiAnalysis = await GCMistralAI.analyzeOSINTResults(type, query, osintResult.results);
          } else {
            aiAnalysis = await GCMistralAI.analyzePartialResults(type, query, [], osintResult.errors);
          }
        } catch (err) {
          aiError = err.message;
        }

        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
        const aiDuration = ((Date.now() - aiStartTime) / 1000).toFixed(1);

        // Save to history
        await GCAuth.addHistory({
          type, query,
          results: osintResult.results,
          errors: osintResult.errors,
          duration: parseFloat(totalDuration),
          credits: 1,
          sourcesQueried: osintResult.sourcesQueried,
          aiAnalysis: aiAnalysis || null,
          aiError: aiError,
        });

        await GCAuth.addNotification('search_complete', `Scan "${query}" terminé — ${osintResult.results.length} résultat(s) via ${osintResult.totalSources} source(s)`);

        // Store for export
        _currentResults = { osint: osintResult, ai: aiAnalysis, type, query };

        // ── Phase 3: Render everything ────────────────
        renderFullResults(resultsDiv, osintResult, aiAnalysis, aiError, type, query, osintDuration, aiDuration, totalDuration);

        GCToast.success(`Scan terminé en ${totalDuration}s — ${osintResult.results.length} résultat(s) + analyse IA`);

      } catch (err) {
        resultsDiv.innerHTML = `
          <div class="p-6 text-center" style="background:rgba(0,229,255,0.03);border:1px solid rgba(0,229,255,0.15);border-radius:var(--radius)">
            <p class="text-sm" style="color:var(--cyan)">📡 Recherche en cours — veuillez patienter ou réessayer.</p>
            <p class="text-xs mt-2" style="color:var(--text-muted)">Si le problème persiste, contactez l'administrateur.</p>
          </div>
        `;
        GCToast.info('Recherche interrompue. Réessayez.');
      }
      btn.disabled = false;
      btn.innerHTML = '▶ SCAN';
      GCDashboardView.updateNotifDot();
    });
  }

  // ── Scan Phase Animation ────────────────────────────
  function renderScanPhase(container, type, query, phase, osintResult) {
    if (phase === 'osint') {
      container.innerHTML = `
        <div class="p-6" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius)" id="scan-panel">
          <div class="flex items-center gap-3 mb-4">
            <div class="spinner"></div>
            <div>
              <p class="text-sm font-bold" style="color:var(--green)">▸ PHASE 1: COLLECTE OSINT</p>
              <p class="text-xs" style="color:var(--text-muted)">Interrogation des sources en parallèle...</p>
            </div>
          </div>
          <div class="space-y-1 font-mono" id="scan-log" style="max-height:300px;overflow-y:auto;scroll-behavior:smooth">
            <p class="text-xs" style="color:var(--text-muted)">→ Type: <span style="color:var(--cyan)">${type}</span> | Cible: <span style="color:var(--green)">${query}</span></p>
            <p class="text-xs scan-log-line" style="color:var(--text-muted);animation:fade-in 0.3s ease 0.2s both">→ Connexion aux sources OSINT en parallèle...</p>
            <p class="text-xs scan-log-line" style="color:var(--text-muted);animation:fade-in 0.3s ease 0.5s both">→ Scan en cours <span class="terminal-cursor"></span></p>
          </div>
        </div>
      `;
    } else if (phase === 'ai') {
      const resultCount = osintResult?.results?.length || 0;
      const sourceNames = osintResult?.sourcesQueried?.join(', ') || '—';
      container.innerHTML = `
        <div class="p-6" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius)">
          <!-- Phase 1 complete -->
          <div class="flex items-center gap-2 mb-3 pb-3" style="border-bottom:1px solid rgba(0,255,65,0.06)">
            <span style="color:var(--green)">✓</span>
            <span class="text-xs" style="color:var(--green)">PHASE 1 TERMINÉE</span>
            <span class="badge badge-green" style="font-size:0.55rem">${resultCount} résultat(s)</span>
            <span class="text-xs" style="color:var(--text-muted)">${sourceNames}</span>
          </div>

          <!-- Phase 2 AI -->
          <div class="flex items-center gap-3">
            <div class="spinner" style="border-top-color:var(--cyan)"></div>
            <div>
              <p class="text-sm font-bold" style="color:var(--cyan)">▸ PHASE 2: ANALYSE GOLD_CREW AI</p>
              <p class="text-xs" style="color:var(--text-muted)">Envoi des données à l'IA pour analyse approfondie...</p>
            </div>
          </div>
          <div class="mt-3 space-y-1">
            <p class="text-xs" style="color:var(--text-muted);animation:fade-in 0.3s ease 0.1s both">→ Transmission des ${resultCount} résultats à Gold_Crew AI...</p>
            <p class="text-xs" style="color:var(--text-muted);animation:fade-in 0.3s ease 0.4s both">→ Analyse en cours <span class="terminal-cursor" style="background:var(--cyan)"></span></p>
          </div>
        </div>
      `;
    }
  }

  // ── Real-Time Scan Progress Handler ─────────────────
  function _handleScanProgress(progress, container) {
    if (progress.phase === 'source') {
      const logEl = container.querySelector('#scan-log');
      if (!logEl) return;
      const icon = progress.icon || '◆';
      const name = progress.source || 'Unknown';
      const isOk = progress.status === 'success';
      const count = progress.count || 0;
      const color = isOk ? 'var(--green)' : 'var(--text-muted)';
      const symbol = isOk ? '✓' : '·';
      const detail = isOk
        ? `${count} résultat${count !== 1 ? 's' : ''}`
        : 'Pas de données publiques';
      const line = document.createElement('p');
      line.className = 'text-xs scan-log-line';
      line.style.cssText = `color:${color};animation:fade-in 0.2s ease both`;
      line.innerHTML = `${symbol} ${icon} <strong>${name}</strong> — ${detail}`;
      // Replace the "Scan en cours" cursor line if still present
      const cursorLine = logEl.querySelector('.terminal-cursor');
      if (cursorLine) cursorLine.parentElement.remove();
      logEl.appendChild(line);
      // Re-add cursor
      const cursor = document.createElement('p');
      cursor.className = 'text-xs';
      cursor.style.cssText = 'color:var(--text-muted);animation:fade-in 0.1s ease both';
      cursor.innerHTML = '→ Scan en cours <span class="terminal-cursor"></span>';
      logEl.appendChild(cursor);
      // Auto-scroll
      logEl.scrollTop = logEl.scrollHeight;
    }
    if (progress.phase === 'complete') {
      const logEl = container.querySelector('#scan-log');
      if (!logEl) return;
      const cursorLine = logEl.querySelector('.terminal-cursor');
      if (cursorLine) cursorLine.parentElement.remove();
      const doneLine = document.createElement('p');
      doneLine.className = 'text-xs';
      doneLine.style.cssText = 'color:var(--green);font-weight:700;animation:fade-in 0.2s ease both';
      doneLine.textContent = `✓ ${progress.resultCount} résultat(s) collecté(s) — Analyse en cours...`;
      logEl.appendChild(doneLine);
    }
  }

  // ── Full Results (OSINT + AI Analysis) ──────────────
  function renderFullResults(container, osintResult, aiAnalysis, aiError, type, query, osintDur, aiDur, totalDur) {
    const { results, errors, sourcesQueried } = osintResult;

    let html = `
      <div class="animate-fade-up space-y-3">
        <!-- Summary Bar -->
        <div class="flex flex-wrap items-center justify-between gap-2 p-3 rounded" style="background:#0a0a0a;border:1px solid var(--border-subtle)">
          <div class="flex items-center gap-3 flex-wrap">
            <span class="badge badge-green" style="font-size:0.55rem">✓ SCAN TERMINÉ</span>
            <span class="text-xs" style="color:var(--text-muted)">Durée: <span style="color:var(--text-primary)">${totalDur}s</span></span>
            <span class="text-xs" style="color:var(--text-muted)">OSINT: <span style="color:var(--green)">${osintDur}s</span></span>
            <span class="text-xs" style="color:var(--text-muted)">IA: <span style="color:var(--cyan)">${aiDur}s</span></span>
            <span class="text-xs" style="color:var(--text-muted)">Sources: <span style="color:var(--text-primary)">${sourcesQueried?.join(', ') || '—'}</span></span>
          </div>
          <div class="flex gap-1.5">
            <button class="btn btn-ghost btn-sm" id="export-csv" style="font-size:0.65rem">⬇ CSV</button>
            <button class="btn btn-ghost btn-sm" id="download-report" style="font-size:0.65rem;color:var(--gold)">⬇ RAPPORT</button>
            <button class="btn btn-ghost btn-sm" id="copy-results" style="font-size:0.65rem;color:var(--cyan)">📋 COPIER</button>
            <button class="btn btn-ghost btn-sm" id="save-fav" style="font-size:0.65rem">★ FAV</button>
          </div>
        </div>

        ${errors.length ? `<div class="p-2 rounded text-xs" style="background:rgba(0,229,255,0.04);color:var(--cyan);border:1px solid rgba(0,229,255,0.1)">📡 ${errors.length} source(s) n'ont pas retourné de données publiques pour cette requête. L'analyse ci-dessous exploite l'ensemble des données disponibles.</div>` : ''}
    `;

    // ── AI Analysis Panel ─────────────────────────────
    html += `
        <div style="background:#0a0a0a;border:1px solid rgba(0,229,255,0.15);border-radius:var(--radius);overflow:hidden">
          <div class="flex items-center justify-between px-4 py-2" style="background:rgba(0,229,255,0.04);border-bottom:1px solid rgba(0,229,255,0.1)">
            <div class="flex items-center gap-2">
              <span style="color:var(--cyan);font-size:1rem">◈</span>
              <span class="text-xs font-bold" style="color:var(--cyan)">ANALYSE GOLD_CREW AI</span>
              <span class="badge badge-info" style="font-size:0.5rem">IA</span>
            </div>
            <div class="flex gap-1">
            <button class="btn btn-ghost btn-sm" id="copy-ai-analysis" style="font-size:0.6rem;color:var(--cyan)">📋 COPIER</button>
            <button class="btn btn-ghost btn-sm" id="toggle-ai-panel" style="font-size:0.6rem;color:var(--text-muted)">▲ RÉDUIRE</button>
            </div>
          </div>
          <div id="ai-analysis-content" class="p-4">
            ${aiError
              ? `<p class="text-xs" style="color:var(--text-muted)">📡 Gold_Crew AI analyse les données collectées. L'approfondissement sera disponible prochainement.</p>`
              : renderMarkdown(aiAnalysis)
            }
          </div>
        </div>
    `;

    // ── Raw OSINT Results ──────────────────────────────
    if (results.length > 0) {
      html += `
        <div style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:14px">
          <div class="flex items-center justify-between mb-3 pb-2" style="border-bottom:1px solid rgba(0,255,65,0.06)">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold" style="color:var(--green)">▸ DONNÉES BRUTES</span>
              <span class="badge badge-green" style="font-size:0.55rem">${results.length}</span>
            </div>
            <button class="btn btn-ghost btn-sm" id="toggle-raw-data" style="font-size:0.6rem;color:var(--text-muted)">▼ AFFICHER</button>
          </div>
          <div id="raw-results-list" class="space-y-2" style="display:none">
            ${results.map((r, i) => renderResultCard(r, i)).join('')}
          </div>
        </div>
      `;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Bind interactions
    document.getElementById('export-csv')?.addEventListener('click', () => exportCSV(results, type, query));
    document.getElementById('download-report')?.addEventListener('click', () => downloadBrandedReport(osintResult, aiAnalysis, aiError, type, query, osintDur, aiDur, totalDur));
    document.getElementById('copy-results')?.addEventListener('click', () => copyResultsToClipboard(osintResult, aiAnalysis, aiError, type, query));
    document.getElementById('copy-ai-analysis')?.addEventListener('click', async () => {
      const text = aiAnalysis || '';
      if (!text) { GCToast.info('Aucune analyse IA à copier.'); return; }
      try {
        await navigator.clipboard.writeText(text);
        GCToast.success('Analyse IA copiée !');
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        GCToast.success('Analyse IA copiée !');
      }
    });
    document.getElementById('save-fav')?.addEventListener('click', async () => {
      const added = await GCAuth.toggleFavorite({ type, query, results, aiAnalysis, date: new Date().toISOString() });
      GCToast[added ? 'success' : 'info'](added ? 'Ajouté aux favoris.' : 'Retiré des favoris.');
    });

    // Toggle AI panel
    document.getElementById('toggle-ai-panel')?.addEventListener('click', () => {
      const content = document.getElementById('ai-analysis-content');
      const btn = document.getElementById('toggle-ai-panel');
      if (content.style.display === 'none') {
        content.style.display = 'block';
        btn.textContent = '▲ RÉDUIRE';
      } else {
        content.style.display = 'none';
        btn.textContent = '▼ DÉVELOPPER';
      }
    });

    // Toggle raw data
    document.getElementById('toggle-raw-data')?.addEventListener('click', () => {
      const list = document.getElementById('raw-results-list');
      const btn = document.getElementById('toggle-raw-data');
      if (list.style.display === 'none') {
        list.style.display = 'block';
        btn.textContent = '▲ MASQUER';
      } else {
        list.style.display = 'none';
        btn.textContent = '▼ AFFICHER';
      }
    });
  }

  // ── Simple Markdown Renderer ────────────────────────
  function renderMarkdown(md) {
    if (!md) return '<p class="text-xs" style="color:var(--text-muted)">Aucune analyse disponible.</p>';
    let html = md
      // Headers
      .replace(/^### (.+)$/gm, '<h4 class="text-sm font-bold mt-3 mb-1" style="color:var(--cyan)">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="text-sm font-bold mt-4 mb-2" style="color:var(--green)">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 class="text-base font-bold mt-4 mb-2" style="color:var(--green)">$1</h2>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```[\s\S]*?```/g, (m) => `<pre class="p-2 my-2 rounded text-xs overflow-x-auto" style="background:rgba(0,255,65,0.03);border:1px solid rgba(0,255,65,0.08);color:var(--green)">${m.slice(3, -3).trim()}</pre>`)
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded text-xs" style="background:rgba(0,255,65,0.06);color:var(--green)">$1</code>')
      // Unordered lists
      .replace(/^- (.+)$/gm, '<div class="flex gap-2 text-xs py-0.5"><span style="color:var(--green)">▸</span><span style="color:var(--text-secondary)">$1</span></div>')
      // Ordered lists
      .replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-2 text-xs py-0.5"><span style="color:var(--cyan);min-width:16px">$1.</span><span style="color:var(--text-secondary)">$2</span></div>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(0,255,65,0.08);margin:12px 0">')
      // Paragraphs
      .replace(/\n\n/g, '<div class="h-2"></div>')
      // Line breaks
      .replace(/\n/g, '<br>');

    return `<div class="text-xs leading-relaxed" style="color:var(--text-secondary);font-family:var(--font-body)">${html}</div>`;
  }

  // ── Result Card ─────────────────────────────────────
  function renderResultCard(r, i) {
    const conf = r.confidence || 0;
    const confClass = conf >= 70 ? 'confidence-high' : conf >= 40 ? 'confidence-medium' : 'confidence-low';
    const dataEntries = r.data ? Object.entries(r.data).slice(0, 8) : [];
    const links = r.links || [];

    return `
      <div class="p-3 rounded transition-all" style="background:rgba(0,255,65,0.01);border:1px solid rgba(0,255,65,0.06);border-left:2px solid ${conf >= 70 ? 'var(--green)' : conf >= 40 ? 'var(--amber)' : 'var(--red)'}">
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <span style="font-size:0.8rem">${r.icon || '◆'}</span>
            <span class="badge badge-green" style="font-size:0.55rem">${r.source || 'UNKNOWN'}</span>
            ${r.date ? `<span class="text-xs" style="color:var(--text-muted);font-size:0.6rem">${new Date(r.date).toLocaleDateString('fr-FR')}</span>` : ''}
          </div>
          <div class="flex items-center gap-1.5">
            <div class="confidence-bar"><div class="confidence-fill ${confClass}" style="width:${conf}%"></div></div>
            <span class="text-xs font-bold" style="color:var(--${conf >= 70 ? 'green' : conf >= 40 ? 'amber' : 'red'});font-size:0.6rem">${conf}%</span>
          </div>
        </div>
        ${r.isImage && r.rawData?.thumbnail ? `
          <div class="mb-2" style="text-align:center">
            <a href="${r.rawData.image || r.rawData.url || '#'}" target="_blank" rel="noopener">
              <img src="${r.rawData.thumbnail}" alt="${escapeHTML(r.rawData.title || '')}" loading="lazy" style="max-width:200px;max-height:150px;border-radius:var(--radius);border:1px solid var(--border-subtle);object-fit:cover" onerror="this.parentElement.style.display='none'" />
            </a>
            ${r.rawData.title ? `<p class="text-xs mt-1 truncate" style="color:var(--text-muted);max-width:200px;margin:4px auto 0">${escapeHTML(r.rawData.title)}</p>` : ''}
          </div>
        ` : ''}
        ${dataEntries.length ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 mb-2">
            ${dataEntries.map(([k, v]) => `
              <div class="flex gap-1.5 text-xs overflow-hidden">
                <span style="color:var(--text-muted);min-width:60px;font-size:0.65rem">${k}:</span>
                <span style="color:var(--text-primary);word-break:break-all;font-size:0.7rem">${formatSearchValue(v)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${links.length ? `
          <div class="flex flex-wrap gap-1.5">
            ${links.map(l => `<a href="${l}" target="_blank" rel="noopener" class="text-xs px-2 py-0.5 rounded" style="background:rgba(0,229,255,0.08);color:var(--cyan);font-size:0.6rem">${l.length > 50 ? l.slice(0, 50) + '...' : l}</a>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  // ── Export CSV ──────────────────────────────────────
  function exportCSV(results, type, query) {
    const rows = [['Source', 'Confiance', 'Date', 'Données', 'Liens']];
    results.forEach(r => {
      rows.push([
        r.source || '',
        r.confidence || '',
        r.date || '',
        r.data ? JSON.stringify(r.data) : '',
        (r.links || []).join(' | ')
      ]);
    });
    const csv = rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gold_crew_${type}_${query}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    GCToast.success('Export CSV téléchargé.');
  }

  // ── Copy Results to Clipboard ────────────────────────
  async function copyResultsToClipboard(osintResult, aiAnalysis, aiError, type, query) {
    const { results, errors, sourcesQueried } = osintResult;
    const now = new Date();
    const lines = [];

    lines.push('═══════════════════════════════════════════');
    lines.push('         GOLD_CREW OSINT — RÉSULTATS');
    lines.push('═══════════════════════════════════════════');
    lines.push(`Type: ${type} | Cible: ${query}`);
    lines.push(`Date: ${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR')}`);
    lines.push(`Sources: ${(sourcesQueried || []).join(', ') || '—'}`);
    lines.push(`Résultats: ${results.length}`);
    lines.push('');

    // AI Analysis
    if (aiAnalysis) {
      lines.push('───────── ANALYSE GOLD_CREW AI ─────────');
      lines.push(aiAnalysis);
      lines.push('');
    } else if (aiError) {
      lines.push(`⚠ Erreur IA: ${aiError}`);
      lines.push('');
    }

    // Raw OSINT Results
    if (results.length > 0) {
      lines.push(`───────── DONNÉES OSINT (${results.length}) ─────────`);
      results.forEach((r, i) => {
        lines.push(`\n▸ ${r.source || 'Unknown'} (confiance: ${r.confidence || 0}%)`);
        if (r.data) {
          const entries = Object.entries(r.data).slice(0, 10);
          for (const [k, v] of entries) {
            const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
            lines.push(`  ${k}: ${val}`);
          }
        }
        if (r.links && r.links.length > 0) {
          lines.push(`  Liens: ${r.links.join(', ')}`);
        }
      });
    }

    // Sources without public data
    if (errors.length > 0) {
      lines.push('\n───────── SOURCES ─────────');
      lines.push(`  ${errors.length} source(s) interrogée(s) sans données publiques pour cette cible.`);
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════');
    lines.push('GOLD_CREW OSINT — Créé par Mcamara');
    lines.push('═══════════════════════════════════════════');

    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      GCToast.success('Résultats copiés dans le presse-papier !');
    } catch {
      // Fallback for insecure contexts
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      GCToast.success('Résultats copiés !');
    }
  }

  // ── Branded Report Download ───────────────────────
  function downloadBrandedReport(osintResult, aiAnalysis, aiError, type, query, osintDur, aiDur, totalDur) {
    const { results, errors, sourcesQueried } = osintResult;
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const timeStr = now.toLocaleTimeString('fr-FR');
    const fileDate = now.toISOString().slice(0, 10).replace(/-/g, '');

    // Build results HTML
    let resultsHTML = '';
    if (results.length > 0) {
      resultsHTML = results.map((r, i) => {
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
              <div style="font-size:11px"><span style="color:#555">${k}:</span> <span style="color:#c8c8c8">${escapeHTML(typeof v === 'object' ? JSON.stringify(v) : String(v)).slice(0, 120)}</span></div>
            `).join('')}</div>` : ''}
            ${links.length ? `<div style="margin-top:6px">${links.map(l => `<span style="color:#00e5ff;font-size:10px">${escapeHTML(l)}</span>`).join('<br>')}</div>` : ''}
          </div>
        `;
      }).join('');
    } else {
      resultsHTML = '<p style="color:#555;font-size:12px;text-align:center;padding:20px">Aucun résultat trouvé.</p>';
    }

    // Errors section — hide technical details, show neutral info
    let errorsHTML = '';
    if (errors.length > 0) {
      errorsHTML = `
        <div style="margin-top:16px">
          <div style="color:#555;font-size:10px;padding:8px;background:rgba(0,229,255,0.03);border:1px solid rgba(0,229,255,0.08);border-radius:4px">
            📡 ${errors.length} source(s) interrogée(s) sans données publiques pour cette requête.
          </div>
        </div>
      `;
    }

    // AI analysis section
    let aiHTML = '';
    if (aiAnalysis) {
      const formatted = aiAnalysis
        .replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/^### (.+)$/gm, '<h4 style="color:#00e5ff;font-size:13px;font-weight:700;margin:12px 0 6px">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 style="color:#00ff41;font-size:14px;font-weight:700;margin:14px 0 8px">$1</h3>')
        .replace(/^# (.+)$/gm, '<h2 style="color:#00ff41;font-size:15px;font-weight:700;margin:14px 0 8px">$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#c8c8c8">$1</strong>')
        .replace(/^- (.+)$/gm, '<div style="color:#888;font-size:11px;padding:2px 0">▸ $1</div>')
        .replace(/\n\n/g, '<div style="height:6px"></div>')
        .replace(/\n/g, '<br>');
      aiHTML = `
        <div style="margin-top:20px;page-break-inside:avoid">
          <div style="background:rgba(0,229,255,0.04);border:1px solid rgba(0,229,255,0.15);border-radius:4px;padding:14px">
            <h3 style="color:#00e5ff;font-size:13px;font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.1em">◈ Analyse Gold_Crew AI</h3>
            <div style="color:#888;font-size:11px;line-height:1.7">${formatted}</div>
          </div>
        </div>
      `;
    } else if (aiError) {
      aiHTML = `
        <div style="margin-top:20px">
          <div style="background:rgba(0,229,255,0.03);border:1px solid rgba(0,229,255,0.08);border-radius:4px;padding:14px">
            <p style="color:#555;font-size:11px">📡 L'analyse détaillée Gold_Crew AI sera disponible après la collecte complète des données.</p>
          </div>
        </div>
      `;
    }

    // Full HTML report
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gold_Crew OSINT — Rapport ${type}: ${query}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'JetBrains Mono','Fira Code',monospace; background:#060606; color:#c8c8c8; padding:0; line-height:1.6; }
    @media print { body { background:#fff; color:#000; } .report-page { box-shadow:none; border:none; } .report-header { background:#000 !important; } }
  </style>
</head>
<body>
  <div class="report-page" style="max-width:800px;margin:0 auto;padding:24px">
    <!-- Header -->
    <div class="report-header" style="background:linear-gradient(135deg,#0a0a0a,#080808);border:1px solid rgba(0,255,65,0.15);border-radius:6px;padding:24px;margin-bottom:20px;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;right:0;width:200px;height:200px;background:radial-gradient(circle,rgba(212,175,55,0.06),transparent);pointer-events:none"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:4px">RAPPORT CONFIDENTIEL</div>
          <h1 style="color:#00ff41;font-size:22px;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:0.05em">GOLD_CREW <span style="color:#d4af37">OSINT</span></h1>
          <div style="font-size:10px;color:#555;margin-top:4px">Plateforme d'Intelligence Open Source • Créé par Mcamara</div>
        </div>
        <div style="text-align:right">
          <div style="color:#d4af37;font-size:18px;font-weight:900">GC</div>
          <div style="font-size:9px;color:#555">v1.0 — ${dateStr}</div>
        </div>
      </div>
    </div>

    <!-- Search Info -->
    <div style="background:#0a0a0a;border:1px solid #111;border-radius:4px;padding:16px;margin-bottom:16px">
      <h2 style="color:#00ff41;font-size:14px;font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.1em">⊞ Informations de Recherche</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:11px">
        <div><span style="color:#555">Type:</span> <span style="color:#00e5ff">${escapeHTML(type)}</span></div>
        <div><span style="color:#555">Cible:</span> <span style="color:#00ff41;font-weight:700">${escapeHTML(query)}</span></div>
        <div><span style="color:#555">Date:</span> <span style="color:#c8c8c8">${dateStr} à ${timeStr}</span></div>
        <div><span style="color:#555">Durée totale:</span> <span style="color:#c8c8c8">${totalDur}s</span></div>
        <div><span style="color:#555">OSINT:</span> <span style="color:#00ff41">${osintDur}s</span></div>
        <div><span style="color:#555">Analyse IA:</span> <span style="color:#00e5ff">${aiDur}s</span></div>
        <div><span style="color:#555">Résultats:</span> <span style="color:#c8c8c8;font-weight:700">${results.length}</span></div>
        <div><span style="color:#555">Sources:</span> <span style="color:#c8c8c8">${(sourcesQueried || []).join(', ') || '—'}</span></div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
      <div style="background:#0a0a0a;border:1px solid #111;border-radius:4px;padding:14px;text-align:center">
        <div style="color:#00ff41;font-size:22px;font-weight:900">${results.length}</div>
        <div style="color:#555;font-size:9px;text-transform:uppercase;letter-spacing:0.1em">Résultats</div>
      </div>
      <div style="background:#0a0a0a;border:1px solid #111;border-radius:4px;padding:14px;text-align:center">
        <div style="color:#d4af37;font-size:22px;font-weight:900">${results.length > 0 ? Math.round(results.reduce((a, r) => a + (r.confidence || 0), 0) / results.length) : 0}%</div>
        <div style="color:#555;font-size:9px;text-transform:uppercase;letter-spacing:0.1em">Confiance Moy.</div>
      </div>
      <div style="background:#0a0a0a;border:1px solid #111;border-radius:4px;padding:14px;text-align:center">
        <div style="color:#00e5ff;font-size:22px;font-weight:900">${(sourcesQueried || []).length}</div>
        <div style="color:#555;font-size:9px;text-transform:uppercase;letter-spacing:0.1em">Sources</div>
      </div>
    </div>

    <!-- AI Analysis -->
    ${aiHTML}

    <!-- OSINT Results -->
    <div style="margin-top:20px">
      <h3 style="color:#00ff41;font-size:13px;font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.1em">▸ Données OSINT Brutes (${results.length})</h3>
      ${resultsHTML}
    </div>

    ${errorsHTML}

    <!-- Footer -->
    <div style="margin-top:30px;padding-top:16px;border-top:1px solid rgba(0,255,65,0.08);text-align:center">
      <div style="color:#00ff41;font-size:12px;font-weight:700;font-family:'JetBrains Mono',monospace">GOLD_CREW OSINT</div>
      <div style="color:#555;font-size:9px;margin-top:4px">Plateforme OSINT Professionnelle — Créé par Mcamara • © 2024 Gold_Crew</div>
      <div style="color:#333;font-size:8px;margin-top:4px">Ce rapport a été généré automatiquement. Les données proviennent de sources publiques légales.</div>
      <div style="margin-top:12px;padding:8px;background:rgba(0,255,65,0.03);border:1px solid rgba(0,255,65,0.08);border-radius:4px">
        <span style="color:#d4af37;font-size:10px;font-weight:700">GOLD_CREW</span>
        <span style="color:#333;font-size:9px"> • </span>
        <span style="color:#555;font-size:9px">whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T</span>
        <span style="color:#333;font-size:9px"> · </span>
        <span style="color:#555;font-size:9px">Digital Crew</span>
        <span style="color:#333;font-size:9px"> · </span>
        <span style="color:#555;font-size:9px">Hackers Academy X</span>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gold_Crew_OSINT_${type}_${query}_${fileDate}.html`;
    a.click();
    URL.revokeObjectURL(url);
    GCToast.success('Rapport Gold_Crew OSINT téléchargé.');
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Auto-link URLs in data values ──────────────────
  function formatSearchValue(v) {
    if (v === null || v === undefined) return '—';
    if (Array.isArray(v)) {
      return v.map(item => formatSearchValue(item)).join(', ');
    }
    if (typeof v === 'object') return JSON.stringify(v);
    const s = String(v);
    const truncated = s.length > 100 ? s.slice(0, 100) + '...' : s;
    // Auto-link URLs
    return truncated.replace(/(https?:\/\/[^\s<]+)/g, (url) => {
      const display = url.length > 55 ? url.slice(0, 55) + '...' : url;
      return `<a href="${url}" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline">${display}</a>`;
    });
  }

  return { render };
})();

window.GCSearchSubView = SearchSubView;
