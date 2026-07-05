// Gold_Crew — Admin: Source Code Download
// Packages all project source files into a ZIP for download.
const AdminSourceCodeSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  const SOURCE_FILES = [
    { path: 'index.html', kind: 'html' },
    { path: 'main.js', kind: 'js' },
    { path: 'styles.css', kind: 'css' },
    { path: 'locales/fr.json', kind: 'data' },
    { path: 'locales/en.json', kind: 'data' },
    { path: 'locales/ht.json', kind: 'data' },
    { path: 'js/state.js', kind: 'js' },
    { path: 'js/storage.js', kind: 'js' },
    { path: 'js/i18n.js', kind: 'js' },
    { path: 'js/toast.js', kind: 'js' },
    { path: 'js/totp.js', kind: 'js' },
    { path: 'js/fingerprint.js', kind: 'js' },
    { path: 'js/bruteforce.js', kind: 'js' },
    { path: 'js/auth.js', kind: 'js' },
    { path: 'js/router.js', kind: 'js' },
    { path: 'js/admin.js', kind: 'js' },
    { path: 'js/mistral-ai.js', kind: 'js' },
    { path: 'js/osint-engine.js', kind: 'js' },
    { path: 'js/osint-sources-extra.js', kind: 'js' },
    { path: 'js/views/landing.js', kind: 'js' },
    { path: 'js/views/auth.js', kind: 'js' },
    { path: 'js/views/dashboard.js', kind: 'js' },
    { path: 'js/views/home-sub.js', kind: 'js' },
    { path: 'js/views/search-sub.js', kind: 'js' },
    { path: 'js/views/history-sub.js', kind: 'js' },
    { path: 'js/views/promo-sub.js', kind: 'js' },
    { path: 'js/views/favorites-sub.js', kind: 'js' },
    { path: 'js/views/stats-sub.js', kind: 'js' },
    { path: 'js/views/profile-sub.js', kind: 'js' },
    { path: 'js/views/settings-sub.js', kind: 'js' },
    { path: 'js/views/admin-login.js', kind: 'js' },
    { path: 'js/views/admin-panel.js', kind: 'js' },
    { path: 'js/views/admin-home-sub.js', kind: 'js' },
    { path: 'js/views/admin-users-sub.js', kind: 'js' },
    { path: 'js/views/admin-osint-sources-sub.js', kind: 'js' },
    { path: 'js/views/admin-promos-sub.js', kind: 'js' },
    { path: 'js/views/admin-api-keys-sub.js', kind: 'js' },
    { path: 'js/views/admin-announcements-sub.js', kind: 'js' },
    { path: 'js/views/admin-site-settings-sub.js', kind: 'js' },
    { path: 'js/views/admin-ai-sub.js', kind: 'js' },
    { path: 'js/views/admin-ai-sources-sub.js', kind: 'js' },
    { path: 'js/views/admin-account-sub.js', kind: 'js' },
    { path: 'js/views/admin-sourcecode-sub.js', kind: 'js' },
    { path: 'js/views/admin-apk-sub.js', kind: 'js' },
  ];

  function render(container) {
    container.innerHTML = `
      <div class="animate-fade-up" style="max-width:800px">
        <div class="glass-card p-5 mb-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded flex items-center justify-center" style="background:rgba(0,255,65,0.1);border:1px solid rgba(0,255,65,0.2)">
              <span style="color:var(--green);font-size:1.2rem">⤓</span>
            </div>
            <div>
              <h3 class="text-sm font-bold" style="color:var(--green)">Téléchargement Code Source</h3>
              <p class="text-xs" style="color:var(--text-muted)">Tous les fichiers sources de Gold_Crew OSINT</p>
            </div>
          </div>

          <div class="mb-4" style="background:#080808;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:14px">
            <div class="flex items-center gap-2 mb-2">
              <span style="color:var(--amber);font-size:0.8rem">◈</span>
              <span class="text-xs font-bold" style="color:var(--amber)">INFORMATION PACKAGE</span>
            </div>
            <div class="space-y-1 text-xs" style="color:var(--text-secondary)">
              <p><span style="color:var(--text-muted)">Fichiers :</span> ${SOURCE_FILES.length} fichiers sources</p>
              <p><span style="color:var(--text-muted)">Format :</span> ZIP (.zip)</p>
              <p><span style="color:var(--text-muted)">Structure :</span> Dossiers js/, js/views/, locales/</p>
              <p><span style="color:var(--text-muted)">Contenu :</span> HTML, CSS, JavaScript, JSON (i18n)</p>
            </div>
          </div>

          <!-- File tree preview -->
          <div class="mb-4" style="background:#060606;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:14px;max-height:240px;overflow-y:auto">
            <div class="text-xs font-bold mb-2" style="color:var(--green);font-family:var(--font-mono)">$ tree gold_crew_osint/</div>
            <div id="sc-file-tree" class="text-xs" style="color:var(--text-muted);font-family:var(--font-mono);line-height:1.8"></div>
          </div>

          <!-- Download button -->
          <div class="flex items-center gap-3">
            <button id="sc-download-btn" class="btn btn-green btn-lg">
              <span>⤓</span> Télécharger le code source (.zip)
            </button>
            <span id="sc-status" class="text-xs" style="color:var(--text-muted)"></span>
          </div>

          <!-- Progress bar -->
          <div id="sc-progress-wrap" class="mt-3" style="display:none">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs" style="color:var(--text-muted)">Progression</span>
              <span id="sc-progress-text" class="text-xs" style="color:var(--green)">0%</span>
            </div>
            <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">
              <div id="sc-progress-bar" style="height:100%;width:0%;background:var(--green);border-radius:2px;transition:width 0.3s ease"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    renderFileTree();
    document.getElementById('sc-download-btn').addEventListener('click', handleDownload);
  }

  function renderFileTree() {
    const tree = document.getElementById('sc-file-tree');
    if (!tree) return;

    // Build a tree structure
    const structure = {};
    SOURCE_FILES.forEach(f => {
      const parts = f.path.split('/');
      let current = structure;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          current[part] = null; // file
        } else {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      });
    });

    function renderBranch(obj, indent = '') {
      let html = '';
      const entries = Object.entries(obj);
      entries.forEach(([name, value], i) => {
        const isLast = i === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const extension = indent + connector;

        if (value === null) {
          // file
          const icon = name.endsWith('.html') ? '◇' : name.endsWith('.css') ? '◆' : name.endsWith('.json') ? '◈' : '▸';
          html += `<div>${extension}<span style="color:var(--green)">${icon}</span> ${name}</div>`;
        } else {
          // directory
          html += `<div>${extension}<span style="color:var(--cyan)">📁</span> <span style="color:var(--cyan)">${name}/</span></div>`;
          const childIndent = indent + (isLast ? '    ' : '│   ');
          html += renderBranch(value, childIndent);
        }
      });
      return html;
    }

    tree.innerHTML = `<div style="color:var(--green)">gold_crew_osint/</div>${renderBranch(structure, '')}`;
  }

  async function handleDownload() {
    const btn = document.getElementById('sc-download-btn');
    const status = document.getElementById('sc-status');
    const progressWrap = document.getElementById('sc-progress-wrap');
    const progressBar = document.getElementById('sc-progress-bar');
    const progressText = document.getElementById('sc-progress-text');

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px"></div> Préparation...';
    status.textContent = '';
    progressWrap.style.display = 'block';

    try {
      // Load JSZip from CDN
      if (!window.JSZip) {
        status.textContent = 'Chargement de JSZip...';
        status.style.color = 'var(--cyan)';
        await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
      }

      const zip = new JSZip();
      const total = SOURCE_FILES.length;
      let done = 0;
      let errors = [];

      for (const file of SOURCE_FILES) {
        try {
          const content = await readFileRobust(file.path);
          zip.file('gold_crew_osint/' + file.path, content);
        } catch (err) {
          errors.push(file.path);
          // Add placeholder for missing files
          zip.file('gold_crew_osint/' + file.path, `/* ⚠️ Unable to load: ${file.path} */\n`);
        }
        done++;
        const pct = Math.round((done / total) * 100);
        progressBar.style.width = pct + '%';
        progressText.textContent = pct + '%';
      }

      // Add a README
      const readmeContent = generateReadme();
      zip.file('gold_crew_osint/README.md', readmeContent);

      status.textContent = 'Compression en cours...';
      status.style.color = 'var(--cyan)';

      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      }, (metadata) => {
        const pct = Math.round(metadata.percent);
        progressBar.style.width = pct + '%';
        progressText.textContent = `Compression: ${pct}%`;
      });

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gold_crew_osint_source.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Success
      status.textContent = errors.length > 0
        ? `✅ Téléchargé (${total - errors.length}/${total} fichiers)`
        : `✅ Téléchargé avec succès — ${total + 1} fichiers`;
      status.style.color = 'var(--green)';
      btn.innerHTML = '<span>✓</span> Téléchargé !';
      btn.className = 'btn btn-outline btn-lg';
      btn.style.borderColor = 'var(--green)';
      btn.style.color = 'var(--green)';

      // Reset button after 3s
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '<span>⤓</span> Télécharger à nouveau';
        btn.className = 'btn btn-green btn-lg';
        btn.style.borderColor = '';
        btn.style.color = '';
        progressWrap.style.display = 'none';
      }, 3000);

    } catch (err) {
      status.textContent = '❌ Erreur: ' + err.message;
      status.style.color = 'var(--red)';
      btn.disabled = false;
      btn.innerHTML = '<span>⤓</span> Réessayer';
      progressWrap.style.display = 'none';
    }
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

  // Robust file reader: tries fetch first, then XHR, with retries
  async function readFileRobust(path) {
    for (let attempt = 0; attempt < 3; attempt++) {
      // Method 1: fetch
      try {
        const resp = await fetch(path, { cache: 'no-store' });
        if (resp.ok) return await resp.text();
      } catch {}
      // Method 2: XHR fallback
      try {
        const text = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', path, true);
          xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve(xhr.responseText) : reject(new Error('HTTP ' + xhr.status));
          xhr.onerror = () => reject(new Error('XHR error'));
          xhr.send();
        });
        if (text && text.length > 0) return text;
      } catch {}
      // Wait before retry
      if (attempt < 2) await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
    throw new Error('Cannot read: ' + path);
  }

  function generateReadme() {
    return `# Gold_Crew OSINT — Source Code

> Plateforme OSINT professionnelle avec Gold_Crew AI intégré.

## Structure du projet

\`\`\`
gold_crew_osint/
├── index.html              # Point d'entrée HTML
├── main.js                 # Bootstrap de l'application
├── styles.css              # Styles CSS (thème terminal)
├── locales/
│   ├── fr.json             # Traductions françaises
│   ├── en.json             # English translations
│   └── ht.json             # Tradiksyon Kreyòl Ayisyen
├── js/
│   ├── state.js            # Gestionnaire d'état global
│   ├── storage.js          # Abstraction stockage (localStorage)
│   ├── i18n.js             # Module d'internationalisation
│   ├── toast.js            # Notifications toast
│   ├── totp.js             # TOTP 2FA (Web Crypto)
│   ├── fingerprint.js      # Empreinte navigateur (anti multi-comptes)
│   ├── bruteforce.js       # Protection anti-brute force
│   ├── auth.js             # Authentification & utilisateurs
│   ├── admin.js            # Module admin (users, promos, settings)
│   ├── router.js           # Routeur SPA
│   ├── mistral-ai.js       # Gold_Crew AI (Mistral integration)
│   ├── osint-engine.js     # Moteur OSINT multi-sources
│   └── views/
│       ├── landing.js          # Page d'accueil
│       ├── auth.js             # Connexion / Inscription
│       ├── dashboard.js        # Dashboard utilisateur
│       ├── home-sub.js         # Sous-vue accueil
│       ├── search-sub.js       # Moteur de recherche OSINT
│       ├── history-sub.js      # Historique
│       ├── favorites-sub.js    # Favoris
│       ├── promo-sub.js        # Codes promo
│       ├── stats-sub.js        # Statistiques
│       ├── profile-sub.js      # Profil utilisateur
│       ├── settings-sub.js     # Paramètres
│       ├── admin-login.js      # Connexion admin
│       ├── admin-panel.js      # Panel admin principal
│       ├── admin-home-sub.js   # Dashboard admin
│       ├── admin-users-sub.js  # Gestion utilisateurs
│       ├── admin-osint-sources-sub.js  # Sources OSINT
│       ├── admin-promos-sub.js         # Codes promo
│       ├── admin-api-keys-sub.js       # Clés API
│       ├── admin-announcements-sub.js  # Annonces
│       ├── admin-site-settings-sub.js  # Paramètres site
│       ├── admin-ai-sub.js            # Configuration Gold_Crew AI
│       ├── admin-account-sub.js        # Compte admin
│       └── admin-sourcecode-sub.js     # Téléchargement source
│       └── admin-apk-sub.js            # Générateur APK Android
\`\`\`

## Sources OSINT intégrées

| Source | Type | Gratuit |
|--------|------|---------|
| GitHub Users | Pseudo search | ✅ |
| Google CSE | Full-text | ❌ (clé API) |
| Facebook Graph | Name search | ❌ (clé API) |
| TikTok API | Username | ❌ (clé API) |
| Custom Source | Configurable | Variable |
| Shodan | IP/Infrastructure | ❌ (clé API) |
| HIBP | Email breaches | ❌ (clé API) |
| VirusTotal | Domain/URL/Hash/IP | ❌ (clé API) |
| Hunter.io | Email finder | ❌ (clé API) |
| IPInfo | IP Geolocation | ✅ |
| DNS Lookup | DNS records | ✅ |
| Wayback Machine | Web archives | ✅ |

## Identifiants Admin

- **Username:** balla
- **Password:** 620891542

## Gold_Crew AI

Intégration Mistral API pour l'analyse OSINT automatique.
La clé API peut être modifiée dans le panel admin.

## GitHub Token

Un token GitHub peut être configuré dans **Admin > Paramètres site > Token GitHub**.

Il est stocké uniquement dans le navigateur de l'admin et permet d'augmenter les limites d'API GitHub (5000 req/h au lieu de 60 sans authentification).

---
© ${new Date().getFullYear()} Gold_Crew — Créé par Mcamara
`;
  }

  return { render };
})();

window.AdminSourceCodeSubView = AdminSourceCodeSubView;
