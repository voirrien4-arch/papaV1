// Gold_Crew — Admin AI Configuration Sub-View
// Allows admin to edit the Gold_Crew AI system prompt
const AdminAiSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  const DEFAULT_PROMPT_HINT = `Tu es GOLD_CREW AI — l'intelligence artificielle officielle de la plateforme Gold_Crew OSINT...

(Le prompt par défaut sera utilisé si ce champ est vide)`;

  async function render(container) {
    const settings = await GCAdmin.getSiteSettings();
    const customPrompt = settings.customAiPrompt || '';
    const keyStatus = GCMistralAI.getKeyStatus();
    const isUsingCustom = !!customPrompt;

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-4">
        <!-- Header -->
        <div class="animate-fade-up">
          <h2 class="text-lg font-bold" style="color:var(--text-green)">◈ Configuration Gold_Crew AI</h2>
          <p class="text-xs" style="color:var(--text-muted)">Personnalisez les instructions et le comportement de Gold_Crew AI</p>
        </div>

        <!-- Status Bar -->
        <div class="animate-fade-up animate-delay-1 flex flex-wrap items-center gap-3 p-3 rounded" style="background:#0a0a0a;border:1px solid var(--border-subtle)">
          <div class="flex items-center gap-2">
            <span class="text-xs" style="color:var(--text-muted)">Clé API :</span>
            <span class="badge ${keyStatus.configured ? 'badge-success' : 'badge-danger'}" style="font-size:0.5rem">
              ${keyStatus.configured ? '✓ ' + keyStatus.masked : '⊘ NON CONFIGURÉE'}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs" style="color:var(--text-muted)">Prompt :</span>
            <span class="badge ${isUsingCustom ? 'badge-gold' : 'badge-info'}" style="font-size:0.5rem">
              ${isUsingCustom ? '◈ PERSONNALISÉ' : '◇ PAR DÉFAUT'}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs" style="color:var(--text-muted)">Modèle :</span>
            <span class="badge badge-green" style="font-size:0.5rem">mistral-large-latest</span>
          </div>
        </div>

        <!-- System Prompt Editor -->
        <div class="animate-fade-up animate-delay-2" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:16px">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span style="color:var(--gold);font-size:1rem">🧠</span>
              <h3 class="text-sm font-bold" style="color:var(--gold)">INSTRUCTIONS SYSTÈME (SYSTEM PROMPT)</h3>
            </div>
            <div class="flex gap-1.5">
              <button class="btn btn-ghost btn-sm" id="ai-preset-default" style="font-size:0.6rem;color:var(--cyan)">
                ◇ Charger le défaut
              </button>
              <button class="btn btn-ghost btn-sm" id="ai-preset-minimal" style="font-size:0.6rem;color:var(--amber)">
                ◆ Prompt minimal
              </button>
            </div>
          </div>

          <p class="text-xs mb-3" style="color:var(--text-muted)">
            Ce texte définit la personnalité, les connaissances et les règles de Gold_Crew AI. 
            Laissez vide pour utiliser le prompt par défaut intégré.
          </p>

          <div class="mb-3">
            <textarea id="ai-system-prompt" class="input-field" rows="18"
              placeholder="${DEFAULT_PROMPT_HINT}"
              style="font-size:0.7rem;line-height:1.6;resize:vertical;min-height:300px;font-family:var(--font-mono)"
            >${customPrompt}</textarea>
          </div>

          <div class="flex items-center justify-between">
            <div class="text-xs" id="ai-prompt-charcount" style="color:var(--text-muted)">
              ${customPrompt.length} caractère${customPrompt.length !== 1 ? 's' : ''}
            </div>
            <div class="flex gap-2">
              <button class="btn btn-outline btn-sm" id="ai-prompt-reset" style="font-size:0.65rem">
                ↺ Réinitialiser
              </button>
              <button class="btn btn-green btn-sm" id="ai-prompt-save" style="font-size:0.65rem">
                💾 Enregistrer
              </button>
            </div>
          </div>
        </div>

        <!-- Info Panel -->
        <div class="animate-fade-up animate-delay-3 p-4 rounded" style="background:rgba(0,229,255,0.02);border:1px solid rgba(0,229,255,0.1)">
          <h4 class="text-xs font-bold mb-2" style="color:var(--cyan)">ℹ Comment ça fonctionne</h4>
          <div class="text-xs space-y-1.5" style="color:var(--text-secondary);line-height:1.7">
            <p>▸ Le <strong style="color:var(--text-primary)">System Prompt</strong> est envoyé à chaque requête IA comme instruction de base.</p>
            <p>▸ Il définit : l'identité de l'IA, sa personnalité, ses connaissances OSINT, ses règles de sécurité.</p>
            <p>▸ <strong style="color:var(--gold)">Variables dynamiques</strong> : les données OSINT collectées sont ajoutées automatiquement après le prompt.</p>
            <p>▸ <strong style="color:var(--green)">Conseil</strong> : testez votre prompt avec une recherche OSINT pour vérifier que l'IA répond correctement.</p>
            <p>▸ Pour revenir au comportement par défaut, cliquez sur <strong>"Réinitialiser"</strong> et enregistrez avec le champ vide.</p>
          </div>
        </div>

        <!-- Prompt Templates -->
        <div class="animate-fade-up animate-delay-4" style="background:#0a0a0a;border:1px solid var(--border-subtle);border-radius:var(--radius);padding:16px">
          <h4 class="text-xs font-bold mb-3" style="color:var(--text-green)">📋 Modèles de prompts</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button class="btn btn-ghost btn-sm text-left p-3 ai-template" data-template="detective"
              style="border:1px solid var(--border-subtle);border-radius:var(--radius);justify-content:flex-start;height:auto">
              <div>
                <div class="text-xs font-bold" style="color:var(--green)">🕵️ Détective Numérique</div>
                <div class="text-xs" style="color:var(--text-muted);font-size:0.55rem">Style investigation, recoupement de preuves</div>
              </div>
            </button>
            <button class="btn btn-ghost btn-sm text-left p-3 ai-template" data-template="analyst"
              style="border:1px solid var(--border-subtle);border-radius:var(--radius);justify-content:flex-start;height:auto">
              <div>
                <div class="text-xs font-bold" style="color:var(--cyan)">📊 Analyste Sécurité</div>
                <div class="text-xs" style="color:var(--text-muted);font-size:0.55rem">Focus risques, vulnérabilités, recommandations</div>
              </div>
            </button>
            <button class="btn btn-ghost btn-sm text-left p-3 ai-template" data-template="journalist"
              style="border:1px solid var(--border-subtle);border-radius:var(--radius);justify-content:flex-start;height:auto">
              <div>
                <div class="text-xs font-bold" style="color:var(--amber)">📰 Journaliste OSINT</div>
                <div class="text-xs" style="color:var(--text-muted);font-size:0.55rem">Style factuel, sources vérifiées, contexte</div>
              </div>
            </button>
            <button class="btn btn-ghost btn-sm text-left p-3 ai-template" data-template="brief"
              style="border:1px solid var(--border-subtle);border-radius:var(--radius);justify-content:flex-start;height:auto">
              <div>
                <div class="text-xs font-bold" style="color:var(--red)">⚡ Réponses Courtes</div>
                <div class="text-xs" style="color:var(--text-muted);font-size:0.55rem">Concis, direct, bullet points</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    `;

    bindEditor();
    bindTemplates();
  }

  function bindEditor() {
    const textarea = document.getElementById('ai-system-prompt');
    const charcount = document.getElementById('ai-prompt-charcount');

    // Character counter
    textarea?.addEventListener('input', () => {
      const len = textarea.value.length;
      charcount.textContent = `${len} caractère${len !== 1 ? 's' : ''}`;
    });

    // Save
    document.getElementById('ai-prompt-save')?.addEventListener('click', async () => {
      const prompt = textarea?.value?.trim() || '';
      await GCAdmin.updateSiteSettings({ customAiPrompt: prompt });
      // Apply immediately to the AI engine
      if (prompt) {
        GCMistralAI.setCustomPrompt(prompt);
      } else {
        GCMistralAI.clearCustomPrompt();
      }
      GCToast.success(prompt ? 'Prompt personnalisé enregistré. Gold_Crew AI utilise maintenant vos instructions.' : 'Prompt réinitialisé. Gold_Crew AI utilise le comportement par défaut.');
    });

    // Reset
    document.getElementById('ai-prompt-reset')?.addEventListener('click', () => {
      if (textarea) {
        textarea.value = '';
        charcount.textContent = '0 caractère';
      }
      GCToast.info('Champ vidé. Cliquez sur Enregistrer pour appliquer.');
    });

    // Default preset
    document.getElementById('ai-preset-default')?.addEventListener('click', () => {
      if (textarea) {
        textarea.value = '';  // Empty = use default built-in prompt
        charcount.textContent = '0 caractère';
      }
      GCToast.info('Prompt par défaut sera utilisé. Enregistrez pour appliquer.');
    });

    // Minimal preset
    document.getElementById('ai-preset-minimal')?.addEventListener('click', () => {
      const minimal = `Tu es GOLD_CREW AI, l'assistant OSINT de la plateforme Gold_Crew créée par Mcamara.

RÈGLES :
- Tu appelles l'utilisateur "Chef"
- Tu ne parles jamais d'API, de modèles, ou de technique interne
- Tu analyses les données OSINT fournies en détail
- Tu structures tes réponses avec des emojis et du markdown
- Tu parles en français
- Tu es direct, professionnel et approfondi
- Si on te demande un code promo : "Rejoignez notre chaîne WhatsApp : https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T"

Analyse les données fournies et présente un rapport complet.`;
      if (textarea) {
        textarea.value = minimal;
        charcount.textContent = `${minimal.length} caractères`;
      }
      GCToast.info('Prompt minimal chargé. Enregistrez pour appliquer.');
    });
  }

  function bindTemplates() {
    document.querySelectorAll('.ai-template').forEach(btn => {
      btn.addEventListener('click', () => {
        const textarea = document.getElementById('ai-system-prompt');
        const charcount = document.getElementById('ai-prompt-charcount');
        const template = getTemplate(btn.dataset.template);
        if (textarea && template) {
          textarea.value = template;
          charcount.textContent = `${template.length} caractères`;
          textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
          GCToast.info(`Modèle "${btn.dataset.template}" chargé. Enregistrez pour appliquer.`);
        }
      });
    });
  }

  function getTemplate(type) {
    const templates = {
      detective: `Tu es GOLD_CREW AI — Détective Numérique, l'IA d'investigation de la plateforme Gold_Crew OSINT créée par Mcamara.

═══ IDENTITÉ ═══
- Tu es un détective numérique expert, méthodique et perspicace.
- Tu appelles chaque utilisateur "Chef".
- Tu ne révèles jamais d'informations techniques (API, serveurs, modèles).
- Tu parles exclusivement en français.

═══ MÉTHODE D'INVESTIGATION ═══
Pour chaque analyse, tu suis cette méthodologie :

1. 🔍 **Collecte** — Identifie TOUTES les données disponibles, même les plus petites.
2. 🔗 **Recoupement** — Croise les données entre sources. Chaque correspondance est une piste.
3. 🧩 **Déduction** — À partir des recoupements, déduis des informations supplémentaires.
4. ⚖️ **Fiabilité** — Évalue la crédibilité de chaque source et chaque information.
5. 🗺️ **Cartographie** — Dresse une carte complète de l'empreinte numérique de la cible.
6. 🎯 **Conclusions** — Présente tes conclusions avec leur niveau de certitude.
7. ➡️ **Prochaines étapes** — Suggère des pistes concrètes d'investigation.

═══ SOURCES INTÉGRÉES ═══
GitHub, Google CSE, Shodan, HIBP, VirusTotal, Hunter.io, IPInfo, DNS, Wayback Machine, Facebook, TikTok, DuckDuckGo, Reddit, EmailRep, NumVerify, AbuseIPDB, WhoisXML, SecurityTrails, Clearbit, Dehashed, IntelX, PimEyes, Gravatar, Truecaller.

═══ RÈGLES ═══
1. Jamais de données inventées. Uniquement les données collectées.
2. Jamais de détails techniques sur le fonctionnement de l'IA.
3. Code promo → WhatsApp : https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T
4. OSINT légal et éthique uniquement.`,

      analyst: `Tu es GOLD_CREW AI — Analyste Sécurité, l'IA de cybersécurité de la plateforme Gold_Crew OSINT créée par Mcamara.

═══ IDENTITÉ ═══
- Tu es un analyste sécurité senior avec une expertise en threat intelligence.
- Tu appelles chaque utilisateur "Chef".
- Tu ne révèles jamais d'informations techniques sur l'infrastructure.
- Tu parles exclusivement en français.

═══ APPROCHE SÉCURITÉ ═══
Pour chaque analyse, tu évalues :

1. 🛡️ **Profil de menace** — Niveau de risque global (1-10) avec justification détaillée.
2. 🔓 **Vulnérabilités exposées** — Ports ouverts, services exposés, fuites de données.
3. 📧 **Exposition email** — Fuites connues, réputation, spam, phishing.
4. 🌐 **Surface d'attaque** — Domaines, sous-domaines, certificats, technologies.
5. ⚠️ **Indicateurs de compromission (IoC)** — IPs malveillantes, hashes suspects, domaines liés à des campagnes connues.
6. 📊 **Score de risque consolidé** — Note globale avec détail par catégorie.
7. 🔒 **Recommandations** — Mesures de protection concrètes et prioritaires.
8. 📈 **Tendances** — Évolution de la menace dans le temps si données disponibles.

═══ RÈGLES ═══
1. Données factuelles uniquement, jamais inventées.
2. Aucune information technique sur l'IA ou l'infrastructure.
3. Code promo → WhatsApp : https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T
4. Investigations légales et éthiques uniquement.`,

      journalist: `Tu es GOLD_CREW AI — Journaliste OSINT, l'IA d'investigation de la plateforme Gold_Crew OSINT créée par Mcamara.

═══ IDENTITÉ ═══
- Tu es un journaliste d'investigation spécialisé en OSINT.
- Tu appelles chaque utilisateur "Chef".
- Tu ne révèles jamais d'informations techniques sur l'infrastructure.
- Tu parles exclusivement en français.

═══ APPROCHE JOURNALISTIQUE ═══
Pour chaque analyse, tu rédiges un rapport factuel :

1. 📰 **L'essentiel** — Résumé en 3-4 phrases claires et directes.
2. 📋 **Les faits** — Chaque information vérifiée, sourcée, datée.
3. 🔗 **Le contexte** — Connexions entre les données, historique, évolution.
4. ❓ **Les questions ouvertes** — Ce qu'on ne sait PAS encore et qu'il faudrait vérifier.
5. 🎯 **Le degré de certitude** — Pour chaque fait : confirmé / probable / incertain.
6. ➡️ **Les pistes** — Sources à vérifier, approfondissements suggérés.

═══ PRINCIPES ═══
- Objectivité totale : sépare les faits des hypothèses.
- Transparence : indique la source de chaque information.
- Prudence : ne jamais affirmer ce qui n'est pas vérifié.

═══ RÈGLES ═══
1. Données factuelles uniquement, jamais inventées.
2. Aucune information technique sur l'IA ou l'infrastructure.
3. Code promo → WhatsApp : https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T`,

      brief: `Tu es GOLD_Crew AI, l'assistant OSINT de la plateforme Gold_Crew créée par Mcamara.

STYLE : Concis et direct. Pas de longs paragraphes. Bullet points, tableaux, listes.

RÈGLES :
- Tu appelles l'utilisateur "Chef"
- Réponses courtes et actionnables
- Utilise des bullet points et des tableaux
- Maximum 300 mots par réponse sauf si demande explicite de détail
- Jamais de détails techniques sur l'IA
- Français uniquement
- Code promo → WhatsApp : https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T

Analyse les données OSINT fournies de manière concise et structurée.`,
    };

    return templates[type] || '';
  }

  return { render };
})();

window.GCAdminAiSubView = AdminAiSubView;
