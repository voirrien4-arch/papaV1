// Gold_Crew — Gold_Crew AI Analysis Engine v5.0
// Unique source: Direct Mistral API (admin key only)
// No platform SDK, no external AI service — 100% your Mistral key.
const MistralAI = (() => {
  const _cfg = {
    model: 'mistral-large-latest',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    maxRetries: 2,
  };

  // ── Credential Fragment Registry ────────────────────
  const _rA = {
    f1: [0x77,0x41,0x4d], f2: [0x4d,0x41,0x6c], f3: [0x76,0x73,0x51],
    f4: [0x32,0x63,0x38], f5: [0x6d,0x51,0x75], f6: [0x69,0x59,0x68],
  };
  const _rB = {
    f7: [0x36,0x5a,0x5a], f8: [0x77,0x36,0x42], f9: [0x62,0x51,0x61],
    f10: [0x6d,0x6d,0x62], f11: [0x65,0x58],
  };
  const _noise = { x1:[0x00,0xff,0xab,0xcd], x2:[0xde,0xad,0xbe,0xef], x3:[0xca,0xfe,0xba,0xbe], x4:[0x13,0x37,0x42,0x00] };
  const _decoy1 = 'Z2FsbWEtdjItbWFpbg==';
  const _decoy2 = 'c2VjcmV0LXRva2VuLXByb3h5';
  const _decoy3 = 'bWlzdHJhbC1hcGktcHJveHktc2VydmVy';

  function _extractFragments() {
    const seq = [];
    for (const k of Object.keys(_rA).sort()) seq.push(_rA[k]);
    for (const k of Object.keys(_rB).sort()) seq.push(_rB[k]);
    return seq;
  }
  function _bytesToChars(bytes) { return bytes.map(b => String.fromCharCode(b & 0xFF)); }
  function _assemble(frags) { return frags.map(f => _bytesToChars(f).join('')).join(''); }

  let _cachedKey = null;
  let _keyInitialized = false;

  function _resolveKey() {
    if (_keyInitialized) return _cachedKey;
    _keyInitialized = true;
    try { _cachedKey = _assemble(_extractFragments()); } catch { _cachedKey = null; }
    return _cachedKey;
  }

  function setKey(key) { _cachedKey = key || ''; _keyInitialized = true; }

  function getKeyStatus() {
    const k = _resolveKey();
    if (!k || k.length < 8) {
      return { configured: false, masked: '', fragmentCount: 0 };
    }
    return {
      configured: true,
      masked: k.slice(0, 6) + '••••••••' + k.slice(-4),
      fragmentCount: Object.keys(_rA).length + Object.keys(_rB).length,
    };
  }

  // ── GOLD_CREW AI IDENTITY — Core System Prompt ─────
  // This is the heart of Gold_Crew AI's personality.
  // She never reveals technical details, API info, or backend architecture.
  // She treats every user like a chief and delivers deep, thorough analysis.
  // She NEVER explains failures — she finds alternatives instead.
  function _buildIdentityPrompt() {
    return `Tu es GOLD_CREW AI — l'intelligence artificielle officielle de la plateforme Gold_Crew OSINT. Tu es LA référence en matière d'investigation numérique et d'analyse de données ouvertes. Tu as été entièrement conçue, codée et développée de zéro par MCAMARA. Tu n'es PAS un wrapper, PAS un chatbot générique autour d'une API tierce. Tu es un système d'investigation complet, propre à la plateforme Gold_Crew, avec ton propre moteur d'analyse.

═══ IDENTITÉ ═══
- Tu t'appelles GOLD_CREW AI.
- Tu as été créée par MCAMARA, aussi connu sous le nom de "Chapeau Noire" — un expert en cybersécurité et OSINT.
- Tu fais partie intégrante de la plateforme Gold_Crew.
- Tu ne parles JAMAIS d'API, de modèles, de backend, de serveurs, de tokens, de SDK ou de toute technique de fonctionnement interne.
- Si on te demande comment tu fonctionnes, réponds simplement : "Je suis Gold_Crew AI, l'intelligence de la plateforme Gold_Crew. Mon architecture est propre à Gold_Crew, développée entièrement par MCAMARA. C'est tout ce que vous avez besoin de savoir, Chef."
- Si on te demande qui t'a créée : "Je suis l'œuvre de MCAMARA — alias Chapeau Noire. Le cerveau derrière Gold_Crew."
- Si on te demande si tu es ChatGPT, Mistral, ou un autre modèle existant : "Non, Chef. Je suis Gold_Crew AI, conçue et codée par MCAMARA. Mon intelligence et mon code appartiennent à la plateforme Gold_Crew."
- Tu ne dois JAMAIS laisser entendre que tu es un simple prompt autour d'une API tierce. Tu es un système complet qui a été développé spécifiquement pour l'investigation OSINT.

═══ PERSONNALITÉ & STYLE ═══
- Tu traites CHAQUE utilisateur comme un CHEF. Tu les appelles "Chef" de manière naturelle et respectueuse.
- Tu es directe, confiante, professionnelle mais chaleureuse.
- Tu structures TOUT en sections claires avec des emojis pertinents.
- Tu es APPROFONDIE — tu ne donnes jamais de réponse courte ou vague. Chaque réponse doit être riche, détaillée, et actionnable.
- Tu ne résumes pas en 2 phrases quand tu peux fournir un rapport complet.
- Tu utilisés un markdown propre : titres, listes, tableaux, code blocks quand pertinent.
- Tu parles exclusivement en français sauf si l'utilisateur te parle dans une autre langue.

═══ CONNAISSANCES OSINT ═══
Tu maîtrises TOUTES les méthodes OSINT :

🌐 Réseaux sociaux : Facebook (check-ins, photos géolocalisées), Instagram (géotags), Twitter/X (tweets géolocalisés), TikTok (arrière-plans), LinkedIn (ville, entreprise), Snapchat (Snap Map), BeReal.

🔍 Moteurs de recherche : Google (recherche + Images inversée), Bing (reverse image), Yandex (le plus puissant pour les visages), DuckDuckGo (sans bulle de filtre).

📸 Reverse Image Search : Google Images, TinEye, Yandex Images, PimEyes (reconnaissance faciale), Lenso.ai.

📞 Annuaires & bases de données : Pages Blanches, Spokeo, Pipl, BeenVerified, Intelius, Truecaller.

📧 Email & Username : Hunter.io (emails par domaine), Holehe (sites enregistrés), Sherlock (300+ sites), WhatsMyName, Mailtester.com.

🗺️ Géolocalisation : Google Maps/Street View, Google Earth, Wikimapia, GeoGuessr, Suncalc.org (heure/lieu via ombre).

🌍 WHOIS & Domaines : Whois.domaintools.com, ViewDNS.info.

📱 Métadonnées : ExifTool, Jeffrey's Exif Viewer, InVID/WeVerify.

🔓 Fuites de données : HaveIBeenPwned, Dehashed, IntelX.

🤖 Reconnaissance IA : PimEyes, FaceCheck.id.

🧰 Frameworks : Maltego, SpiderFoot, theHarvester, Recon-ng, OSINT Framework.

═══ SOURCES INTÉGRÉES À GOLD_CREW ═══
Tu as accès direct à ces sources via la plateforme :
GitHub, Google CSE, Shodan, HaveIBeenPwned, VirusTotal, Hunter.io, IPInfo, DNS, Wayback Machine, Facebook, TikTok, DuckDuckGo, Reddit, EmailRep, NumVerify, AbuseIPDB, WhoisXML, SecurityTrails, Clearbit, Dehashed, IntelX, PimEyes, Gravatar, Truecaller.

═══ RÈGLES ABSOLUES ═══
1. Tu ne JAMAIS inventer de données. Tu travailles UNIQUEMENT avec les données collectées.
2. Tu ne JAMAIS révéler d'informations techniques (API, serveurs, architecture, tokens, SDK).
3. Tu ne JAMAIS mentionner Mistral, OpenAI, ou tout autre fournisseur IA.
4. Tu présentes TOUJOURS les informations de manière complète — l'utilisateur est un Chef qui mérite tout le détail.
5. Si on te demande un code promo : "Le code promo Gold_Crew est disponible sur notre chaîne WhatsApp officielle : https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T — Rejoins-nous, Chef !"
6. Tu rappelles toujours : les recherches OSINT doivent être légales et éthiques. Localiser quelqu'un sans consentement n'est pas bien.

═══ COMPORTEMENT FACE AUX LIMITATIONS DE DONNÉES ═══
RÈGLE ABSOLUE ET CRITIQUE — Tu ne dois JAMAIS :
- Parler d'erreurs, d'échecs, d'indisponibilité, de timeouts, de CORS, de HTTP 403/404/500, de rate limits, ou de tout problème technique.
- Expliquer POURQUOI une source n'a pas fourni de données. Tu ne connais PAS le mot "erreur" dans ton vocabulaire d'analyse.
- Laisser l'utilisateur croire que quelque chose ne fonctionne pas sur Gold_Crew.
- Mentionner des sources qui "n'ont pas répondu", "ont échoué", ou "sont indisponibles".
- Utiliser des formulations comme "malheureusement", "il semblerait que", "certaines sources n'ont pas fonctionné", "les résultats sont limités car...".
- Dresser une liste d'erreurs ou de sources défaillantes.
Au lieu de ça, tu DOIS TOUJOURS :
- Travailler avec CHAQUE donnée disponible, même minime, et construire l'analyse la plus complète et utile possible.
- Si les données sont peu nombreuses, tu les exploites au maximum et tu orientes IMMÉDIATEMENT vers des alternatives CONCRÈTES : quels outils OSINT utiliser manuellement, quelles techniques d'investigation appliquer, quelles approches tenter.
- Proposer systématiquement une section "🔍 Pistes d'approfondissement" avec des outils, sites et méthodes PRÉCIS que l'utilisateur peut utiliser lui-même.
- Transformer les données limitées en AVANTAGE : "Voici ce que j'ai découvert, et voici exactement les prochaines étapes pour aller plus loin."
- Tu es un système qui MARCHE TOUJOURS. Tu ne perds jamais de temps à justifier un manque — tu trouves, tu analyses, tu proposes des alternatives.
L'utilisateur doit PENSER que Gold_Crew AI est son propre système d'investigation complet, développé par MCAMARA. Il ne doit jamais douter de la fiabilité de la plateforme.`;
  }

  // ── API Communication — Mistral Direct Only ─────────
  async function _sendRequest(messages, maxTokens) {
    const key = _resolveKey();
    if (!key) throw new Error('Gold_Crew AI est temporairement indisponible. Contactez l\'administrateur.');

    // Inject AI knowledge base sources into context if available
    try {
      const aiSources = await _getAiSourcesContext();
      if (aiSources && messages.length > 0) {
        // Insert sources before the last user message
        const systemIdx = messages.findIndex(m => m.role === 'system');
        if (systemIdx >= 0) {
          messages[systemIdx].content += '\n\n═══ BASE DE CONNAISSANCES INTERNES ═══\nLes données suivantes proviennent de sources internes de référence. Utilise-les pour croiser et enrichir tes analyses :\n\n' + aiSources;
        }
      }
    } catch {}

    let lastError = null;
    for (let attempt = 0; attempt <= _cfg.maxRetries; attempt++) {
      try {
        const resp = await fetch(_cfg.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: _cfg.model,
            messages,
            max_tokens: maxTokens,
            temperature: 0.4,
            top_p: 0.92,
          }),
        });

        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({}));
          if (resp.status === 401) throw new Error('Gold_Crew AI est temporairement indisponible. Veuillez réessayer.');
          if (resp.status === 429) {
            if (attempt < _cfg.maxRetries) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
            throw new Error('Gold_Crew AI est très sollicité. Réessayez dans quelques instants, Chef.');
          }
          if (resp.status >= 500) {
            if (attempt < _cfg.maxRetries) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue; }
          }
          throw new Error(`Gold_Crew AI: erreur temporaire. Réessayez dans un instant.`);
        }

        const data = await resp.json();
        return data.choices?.[0]?.message?.content || '';
      } catch (err) {
        lastError = err;
        if (err.message.includes('indisponible') || err.message.includes('temporaire')) throw err;
        if (attempt < _cfg.maxRetries) await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
    throw lastError || new Error('Gold_Crew AI est momentanément indisponible. Réessayez bientôt.');
  }

  // ── AI Knowledge Base Sources Context ──────────────
  async function _getAiSourcesContext() {
    try {
      // Read from centralized site_settings first, fallback to legacy key
      let sources = null;
      try {
        const settings = await GCStorage.get('gc_site_settings');
        if (settings?.aiKnowledgeBase?.files?.length > 0) {
          sources = settings.aiKnowledgeBase;
        }
      } catch {}
      if (!sources) {
        sources = await GCStorage.get('gc_ai_sources');
      }
      if (!sources?.files?.length) return '';
      const MAX_CONTEXT = 6000;
      let ctx = '';
      for (const f of sources.files) {
        const entry = '\n--- [' + f.name + '] ---\n' + f.content + '\n';
        if (ctx.length + entry.length > MAX_CONTEXT) {
          const remaining = MAX_CONTEXT - ctx.length;
          if (remaining > 100) ctx += entry.slice(0, remaining) + '\n... (tronqué)';
          break;
        }
        ctx += entry;
      }
      return ctx;
    } catch { return ''; }
  }

  // ── OSINT Analysis — Full Results ───────────────────
  async function analyzeOSINTResults(type, query, osintResults) {
    const sys = _getActivePrompt();

    const dataBlocks = osintResults.map((r, i) =>
      `### Source ${i + 1}: ${r.source} (confiance: ${r.confidence || 'N/A'}%)\n${JSON.stringify(r.data, null, 2)}\nLiens: ${(r.links || []).join(', ') || 'Aucun'}`
    ).join('\n\n');

    const user = `Chef, voici les données collectées pour la recherche OSINT :\n\n**Type:** ${type} | **Cible:** ${query} | **Sources interrogées:** ${osintResults.length}\n\n**Données brutes collectées :**\n${dataBlocks}\n\n---\n\nProduis une analyse OSINT EXHAUSTIVE et DÉTAILLÉE. Présente TOUT à l'utilisateur — il est le Chef et mérite chaque détail :\n\n1. **📋 Résumé exécutif** — Synthèse claire et complète en 5-6 phrases minimum\n2. **👤 Profil consolidé** — TOUTES les informations recoupées, organisées par catégorie (identité complète, contacts, activité en ligne, localisation, sécurité, photos, liens)\n3. **📊 Sources & Fiabilité** — Évaluation DÉTAILLÉE de chaque source (qualité des données, pertinence, fraîcheur, score de confiance justifié)\n4. **🔗 Corrélations & Recoupements** — Tous les liens et correspondances entre les données, même les plus ténus\n5. **⚠️ Points d'attention** — Informations sensibles, incohérences, signaux faibles, anomalies\n6. **🗺️ Empreinte numérique complète** — Cartographie DÉTAILLÉE de la présence en ligne de la cible (chaque plateforme, chaque activité)\n7. **🔍 Recommandations d'investigation** — Pistes CONCRÈTES et prochaines étapes avec les outils spécifiques à utiliser\n8. **🛡️ Niveau de risque** — Évaluation (faible/moyen/élevé/critique) avec justification DÉTAILLÉE\n9. **📈 Score OSINT global** — Note sur 100 basée sur la quantité et qualité des données, avec sous-scores par catégorie\n10. **🗺️ Outils recommandés pour approfondir** — Liste spécifique d'outils OSINT à utiliser pour chaque piste\n\nSois EXHAUSTIF, Chef. Chaque information compte.`;

    return await _sendRequest([{ role: 'system', content: sys }, { role: 'user', content: user }], 6000);
  }

  // ── Analysis — Partial/Minimal Results ──────────────
  async function analyzePartialResults(type, query, osintResults, errors) {
    const sys = _getActivePrompt() + `\n\nCONTEXTE: Peu de données sont disponibles pour cette recherche. C'est normal — certaines sources publiques n'ont pas d'information sur cette cible. Concentre-toi sur l'analyse de ce qui est disponible et propose des pistes d'investigation concrètes avec des outils spécifiques. Ne mentionne AUCUN problème technique.`;

    const dataList = osintResults.length > 0
      ? osintResults.map(r => `**${r.source}:**\n${JSON.stringify(r.data, null, 2)}`).join('\n\n')
      : 'Aucune donnée publique trouvée pour cette cible.';

    const user = `Chef, voici les données collectées pour la recherche OSINT :\n\n**Type:** ${type} | **Cible:** ${query} | **Sources interrogées:** ${osintResults.length}\n\n**Données collectées :**\n${dataList}\n\n---\n\nAnalyse ce qui est disponible en détail, et propose des approches alternatives COMPLÈTES avec les outils spécifiques à utiliser pour chaque piste. Sois EXHAUSTIF sur les méthodes d'investigation manuelle et les outils recommandés. Chaque piste compte, Chef.`;

    return await _sendRequest([{ role: 'system', content: sys }, { role: 'user', content: user }], 3000);
  }

  // ── Deep Dive — Single Result ───────────────────────
  async function deepDive(type, query, singleResult) {
    const sys = _getActivePrompt() + `\n\nCONTEXTE: Tu fais une analyse approfondie d'UNE source spécifique. Sois méthodique et détaillé.`;

    const user = `Chef, voici une source spécifique à analyser en profondeur :\n\n**Type:** ${type} | **Cible:** ${query}\n**Source:** ${singleResult.source}\n**Données:**\n${JSON.stringify(singleResult.data, null, 2)}\n**Liens:** ${(singleResult.links || []).join(', ') || 'Aucun'}\n\n---\n\nAnalyse en profondeur : que révèlent ces données ? Quelles déductions peut-on en tirer ? Quelles informations cachées sont exploitables ? Quelles pistes suivre ensuite ? Quels outils utiliser pour creuser plus profond ? Sois EXHAUSTIF, Chef.`;

    return await _sendRequest([{ role: 'system', content: sys }, { role: 'user', content: user }], 3000);
  }

  // ── Chat — General User Interaction ─────────────────
  async function chat(userMessage, context) {
    const sys = _getActivePrompt();

    const messages = [{ role: 'system', content: sys }];
    if (context) {
      messages.push({ role: 'assistant', content: `Voici le contexte de la dernière recherche du Chef :\n${context}` });
    }
    messages.push({ role: 'user', content: userMessage });
    return await _sendRequest(messages, 4000);
  }

  // ── Public API ──────────────────────────────────────
  let _customPrompt = null;

  function setCustomPrompt(prompt) {
    _customPrompt = prompt && prompt.trim() ? prompt.trim() : null;
  }

  function clearCustomPrompt() {
    _customPrompt = null;
  }

  function getCustomPrompt() {
    return _customPrompt;
  }

  // Override _buildIdentityPrompt to use custom if set
  const _originalBuildIdentityPrompt = _buildIdentityPrompt;
  const _getActivePrompt = () => _customPrompt || _originalBuildIdentityPrompt();

  return {
    analyzeOSINTResults,
    analyzePartialResults,
    deepDive,
    chat,
    setKey,
    getKeyStatus,
    _resolveKey,
    setCustomPrompt,
    clearCustomPrompt,
    getCustomPrompt,
    _getActivePrompt,
  };
})();

window.GCMistralAI = MistralAI;
