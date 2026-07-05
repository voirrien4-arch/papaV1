// Gold_Crew — Real OSINT Engine
// Makes actual API calls to configured OSINT sources
const OsintEngine = (() => {
  const OSINT_SOURCES_KEY = 'gc_osint_sources';

  // ── Fetch with Timeout ────────────────────────────
  async function fetchWithTimeout(url, options, timeoutMs) {
    const timeout = timeoutMs || 15000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return resp;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error('Timeout');
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError'))
        throw new Error('CORS bloque');
      throw err;
    }
  }

  // ── CORS Proxy Fallback Layer ──────────────────────
  // VirusTotal and some other APIs block browser CORS requests.
  // fetchSmart tries direct first, then cascades through public CORS proxies.
  // Blocked domains are cached in-memory so subsequent calls skip the failed direct attempt.
  const CORS_PROXIES = [
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ];
  const _corsBlockedDomains = new Set();

  function _isCorsError(err) {
    const msg = (err && err.message) || '';
    return msg.includes('CORS') || msg.includes('Failed to fetch') || msg.includes('NetworkError');
  }

  async function fetchSmart(url, options, timeoutMs, opts) {
    const needsProxy = opts && opts.needsProxy;
    let domain = '';
    try { domain = new URL(url).hostname; } catch {}
    if (needsProxy || _corsBlockedDomains.has(domain)) {
      return await _fetchViaProxy(url, options, timeoutMs);
    }
    try {
      return await fetchWithTimeout(url, options, timeoutMs);
    } catch (err) {
      if (_isCorsError(err)) {
        _corsBlockedDomains.add(domain);
        return await _fetchViaProxy(url, options, timeoutMs);
      }
      throw err;
    }
  }

  async function _fetchViaProxy(url, options, timeoutMs) {
    let lastErr = null;
    for (const proxyFn of CORS_PROXIES) {
      try {
        return await fetchWithTimeout(proxyFn(url), { ...options, mode: 'cors' }, timeoutMs + 5000);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('CORS: tous les proxys ont echoue');
  }

  const DEFAULT_SOURCES = [
    {
      id: 'github',
      name: 'GitHub',
      icon: '🐙',
      enabled: true,
      apiKey: '',
      apiUrl: 'https://api.github.com',
      searchTypes: ['username', 'email', 'fullname', 'keyword'],
      description: 'Search GitHub users, repos, and public data',
      rateLimit: '60 req/hour (unauthenticated), 5000 req/hour (token)',
      requiresKey: false,
    },
    {
      id: 'google',
      name: 'Google Dorks',
      icon: '🔍',
      enabled: true,
      apiKey: '',
      apiCx: '',
      apiUrl: 'https://www.googleapis.com/customsearch/v1',
      searchTypes: ['name', 'fullname', 'email', 'phone', 'keyword', 'domain', 'url'],
      description: 'Google Custom Search for OSINT reconnaissance',
      rateLimit: '100 queries/day (free tier)',
      requiresKey: true,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      enabled: false,
      apiKey: '',
      apiUrl: 'https://graph.facebook.com',
      searchTypes: ['name', 'fullname', 'email', 'phone', 'username'],
      description: 'Facebook public data search via Graph API',
      rateLimit: '200 calls/hour',
      requiresKey: true,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      enabled: false,
      apiKey: '',
      apiUrl: 'https://open.tiktokapis.com',
      searchTypes: ['username', 'keyword'],
      description: 'TikTok public user and content search',
      rateLimit: '1000 requests/day',
      requiresKey: true,
    },
    {
      id: 'custom_secret',
      name: 'Source Secrète',
      icon: '🔒',
      enabled: false,
      apiKey: '',
      apiUrl: '',
      searchTypes: ['name', 'fullname', 'email', 'phone', 'username', 'keyword', 'domain', 'ip', 'url'],
      description: 'Custom secret OSINT source — configure URL and API key',
      rateLimit: 'Unlimited',
      requiresKey: true,
    },
    { id: 'shodan', name: 'Shodan', icon: '🌐', enabled: true, apiKey: '', apiUrl: 'https://api.shodan.io', searchTypes: ['ip', 'domain'], description: 'IoT & infrastructure search engine for IP reconnaissance', rateLimit: '1 req/sec (free)', requiresKey: true },
    { id: 'hibp', name: 'HIBP', icon: '🔓', enabled: false, apiKey: '', apiUrl: 'https://haveibeenpwned.com/api/v3', searchTypes: ['email'], description: 'Have I Been Pwned — Email breach database', rateLimit: '10 req/min', requiresKey: true },
    { id: 'virustotal', name: 'VirusTotal', icon: '🛡️', enabled: true, apiKey: '', apiUrl: 'https://www.virustotal.com/api/v3', searchTypes: ['domain', 'url', 'hash', 'ip'], description: 'URL, domain, hash & IP malware scanner', rateLimit: '4 req/min (free)', requiresKey: true },
    { id: 'hunter', name: 'Hunter.io', icon: '🎯', enabled: false, apiKey: '', apiUrl: 'https://api.hunter.io/v2', searchTypes: ['email', 'domain'], description: 'Email finder & domain verification', rateLimit: '50 req/month (free)', requiresKey: true },
    { id: 'ipinfo', name: 'IPInfo', icon: '📍', enabled: true, apiKey: '', apiUrl: 'https://ipinfo.io', searchTypes: ['ip'], description: 'IP geolocation & network intelligence', rateLimit: '50k req/month', requiresKey: false },
    { id: 'dns', name: 'DNS Lookup', icon: '🔗', enabled: true, apiKey: '', apiUrl: 'https://dns.google/resolve', searchTypes: ['domain'], description: 'DNS records via DNS-over-HTTPS (A, AAAA, MX, NS, TXT)', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'wayback', name: 'Wayback Machine', icon: '⏳', enabled: true, apiKey: '', apiUrl: 'https://web.archive.org', searchTypes: ['domain', 'url'], description: 'Internet Archive — Historical web snapshots', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'duckduckgo', name: 'DuckDuckGo', icon: '🦆', enabled: true, apiKey: '', apiUrl: 'https://api.duckduckgo.com', searchTypes: ['name','fullname','email','phone','keyword','domain','url','username','pseudo'], description: 'DuckDuckGo instant answers — privacy-focused search', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'emailrep', name: 'EmailRep', icon: '📧', enabled: true, apiKey: '', apiUrl: 'https://emailrep.io', searchTypes: ['email'], description: 'Email reputation & OSINT (social profiles, breach data)', rateLimit: '100 req/day (free)', requiresKey: true },
    { id: 'gravatar', name: 'Gravatar', icon: '👤', enabled: true, apiKey: '', apiUrl: 'https://www.gravatar.com', searchTypes: ['email'], description: 'Gravatar profile lookup (avatar, display name, links)', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'numverify', name: 'NumVerify', icon: '📞', enabled: true, apiKey: '', apiUrl: 'https://apilayer.net/api/validate', searchTypes: ['phone'], description: 'Phone number validation & carrier info', rateLimit: '100 req/month (free)', requiresKey: true },
    { id: 'whoisxml', name: 'WhoisXML', icon: '🌐', enabled: true, apiKey: '', apiUrl: 'https://whoisjs.com', searchTypes: ['domain','ip'], description: 'WHOIS domain/IP data lookup', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'abuseipdb', name: 'AbuseIPDB', icon: '🛡️', enabled: true, apiKey: '', apiUrl: 'https://api.abuseipdb.com/api/v2', searchTypes: ['ip'], description: 'IP abuse reports & malicious activity database', rateLimit: '1000 req/day (free)', requiresKey: true },
    { id: 'reddit', name: 'Reddit', icon: '🤖', enabled: true, apiKey: '', apiUrl: 'https://www.reddit.com', searchTypes: ['username','pseudo','keyword'], description: 'Reddit user profiles & post history (public JSON API)', rateLimit: '60 req/min', requiresKey: false },
    { id: 'securitytrails', name: 'SecurityTrails', icon: '🛤️', enabled: false, apiKey: '', apiUrl: 'https://api.securitytrails.com/v1', searchTypes: ['domain','ip'], description: 'DNS history, subdomains, IP intelligence', rateLimit: '50 req/month (free)', requiresKey: true },
    { id: 'clearbit', name: 'Clearbit', icon: '🏢', enabled: false, apiKey: '', apiUrl: 'https://person.clearbit.com/v2', searchTypes: ['email','domain'], description: 'Person & company enrichment (role, company, social)', rateLimit: '100 req/month (free)', requiresKey: true },
    { id: 'dehashed', name: 'Dehashed', icon: '🗃️', enabled: false, apiKey: '', apiUrl: 'https://api.dehashed.com/search', searchTypes: ['email','username','phone','name','ip'], description: 'Leaked database search (email, username, password hashes)', rateLimit: '100 req/month', requiresKey: true },
    { id: 'intelx', name: 'IntelX', icon: '🕵️', enabled: false, apiKey: '', apiUrl: 'https://2.intelx.io', searchTypes: ['email','phone','domain','ip','keyword','username'], description: 'Intelligence X — leaked data & darknet search engine', rateLimit: '100 req/month (free)', requiresKey: true },
    // ── RapidAPI Sources ──
    { id: 'rapidapi_ip', name: 'RapidAPI IP Geo', icon: '🌍', enabled: true, apiKey: '', apiUrl: 'https://ip-geolocation-ipwhois-io.p.rapidapi.com', searchTypes: ['ip'], description: 'IP geolocation via RapidAPI — city, country, ISP, coordinates', rateLimit: '1000 req/day (free)', requiresKey: true, isRapidApi: true },
    { id: 'rapidapi_phone', name: 'RapidAPI Phone', icon: '📱', enabled: true, apiKey: '', apiUrl: 'https://phonenumbervalidatefree.p.rapidapi.com', searchTypes: ['phone'], description: 'Phone number validation via RapidAPI — carrier, line type, country', rateLimit: '500 req/month (free)', requiresKey: true, isRapidApi: true },
    { id: 'rapidapi_email', name: 'RapidAPI Email', icon: '✉️', enabled: true, apiKey: '', apiUrl: 'https://mailcheck.p.rapidapi.com', searchTypes: ['email'], description: 'Email verification via RapidAPI — disposable check, MX, deliverability', rateLimit: '500 req/month (free)', requiresKey: true, isRapidApi: true },
    { id: 'rapidapi_breach', name: 'RapidAPI Breach', icon: '💀', enabled: true, apiKey: '', apiUrl: 'https://breachdirectory.p.rapidapi.com', searchTypes: ['email','username'], description: 'Data breach lookup via RapidAPI — leaked credentials & breach history', rateLimit: '500 req/month (free)', requiresKey: true, isRapidApi: true },
    { id: 'rapidapi_social', name: 'RapidAPI Social', icon: '👥', enabled: true, apiKey: '', apiUrl: 'https://social-media-profile-search.p.rapidapi.com', searchTypes: ['username','email'], description: 'Social media profile search via RapidAPI — cross-platform username lookup', rateLimit: '500 req/month (free)', requiresKey: true, isRapidApi: true },
    // ── 100% FREE Sources (No API Key Required) ──
    { id: 'crt_sh', name: 'crt.sh', icon: '🔒', enabled: true, apiKey: '', apiUrl: 'https://crt.sh', searchTypes: ['domain'],
      description: 'Certificate Transparency logs — discover subdomains via SSL certificates', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'ip_api', name: 'IP-API', icon: '🌍', enabled: true, apiKey: '', apiUrl: '/api/proxy/ip-api', searchTypes: ['ip'],
      description: 'IP geolocation, ISP, org, timezone, proxy detection — 45 req/min free (via server proxy)', rateLimit: '45 req/min (free)', requiresKey: false },
    { id: 'wayback_cdx', name: 'Wayback CDX', icon: '📼', enabled: true, apiKey: '', apiUrl: 'https://web.archive.org/cdx/search/cdx', searchTypes: ['domain', 'url'],
      description: 'Wayback CDX API — detailed historical snapshot listing with timestamps, status codes, MIME types', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'ipwhois', name: 'IPWhois', icon: '🗺️', enabled: true, apiKey: '', apiUrl: 'https://ipwho.is', searchTypes: ['ip'],
      description: 'IP geolocation & intelligence — city, country, ISP, threat level, timezone', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'urlhaus', name: 'URLHaus', icon: '⚠️', enabled: true, apiKey: '', apiUrl: 'https://urlhaus-api.abuse.ch/v1', searchTypes: ['url', 'domain', 'ip'],
      description: 'Abuse.ch URLHaus — malware URL database. Check if URLs/domains/IPs are linked to malware distribution', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'malwarebazaar', name: 'MalwareBazaar', icon: '🦠', enabled: true, apiKey: '', apiUrl: 'https://mb-api.abuse.ch/api/v1', searchTypes: ['hash'],
      description: 'Abuse.ch MalwareBazaar — look up file hashes in malware database. SHA256, SHA1, MD5 supported', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'threatfox', name: 'ThreatFox', icon: '🎯', enabled: true, apiKey: '', apiUrl: 'https://threatfox-api.abuse.ch/api/v1', searchTypes: ['ip', 'domain', 'url', 'hash', 'keyword'],
      description: 'Abuse.ch ThreatFox — IOC (Indicators of Compromise) database. Search for malicious IPs, domains, URLs, hashes', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'shodan_internetdb', name: 'Shodan InternetDB', icon: '📊', enabled: true, apiKey: '', apiUrl: 'https://internetdb.shodan.io', searchTypes: ['ip'],
      description: 'Shodan InternetDB — free IP intelligence: open ports, CVEs, hostnames, CPEs. No API key needed', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'opencage', name: 'OpenCage', icon: '📍', enabled: true, apiKey: '', apiUrl: 'https://api.opencagedata.com/geocode/v1', searchTypes: ['address'],
      description: 'OpenCage Geocoder — forward/reverse geocoding. Convert addresses to coordinates and vice versa', rateLimit: '2500 req/day (free)', requiresKey: true },
    { id: 'whois_free', name: 'WHOIS Free', icon: '📋', enabled: true, apiKey: '', apiUrl: 'https://whois.freeaiapi.xyz', searchTypes: ['domain'],
      description: 'Free WHOIS lookup — domain registration data, registrar, creation date, name servers', rateLimit: 'Unlimited (free)', requiresKey: false },
    // ── Free via Server Proxy (CORS blocked in browser) ──
    { id: 'urlscan_proxy', name: 'URLScan.io', icon: '🔎', enabled: true, apiKey: '', apiUrl: '/api/proxy/urlscan', searchTypes: ['domain', 'url', 'ip'],
      description: 'URLScan.io — website screenshots, technologies, redirects, malicious indicators. Free, no key needed', rateLimit: '50 req/day (anonymous)', requiresKey: false },
    { id: 'nvd_cve', name: 'NVD CVE', icon: '🐛', enabled: true, apiKey: '', apiUrl: '/api/proxy/nvd', searchTypes: ['keyword', 'domain'],
      description: 'NIST NVD — CVE vulnerability database. Search for known vulnerabilities by keyword or product name', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'criminalip_proxy', name: 'Criminal IP', icon: '🚔', enabled: false, apiKey: '', apiUrl: '/api/proxy/criminalip', searchTypes: ['ip', 'domain', 'keyword'],
      description: 'Criminal IP — threat intelligence, attack surface analysis, malicious IP detection', rateLimit: '100 req/month (free)', requiresKey: true },
    { id: 'abstract_email', name: 'Abstract Email', icon: '📩', enabled: false, apiKey: '', apiUrl: 'https://emailvalidation.abstractapi.com/v1', searchTypes: ['email'],
      description: 'AbstractAPI Email Validation — deliverability, disposable check, MX records, quality score', rateLimit: '100 req/month (free)', requiresKey: true },
    { id: 'ssl_labs', name: 'SSL Labs', icon: '🔐', enabled: true, apiKey: '', apiUrl: 'https://api.ssllabs.com/api/v3', searchTypes: ['domain'],
      description: 'Qualys SSL Labs — SSL/TLS configuration analysis, grade, certificates, vulnerabilities', rateLimit: 'Unlimited (free)', requiresKey: false },
    // ── WhatsApp OSINT Sources ──
    { id: 'whatsapp_check', name: 'WhatsApp Check', icon: '📱', enabled: true, apiKey: '', apiUrl: '/api/osint/whatsapp-check',
      searchTypes: ['phone', 'whatsapp'],
      description: 'WhatsApp phone number lookup — check if number has WhatsApp, generate direct chat links, detect country', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'whatsapp_groups', name: 'WhatsApp Groups', icon: '💬', enabled: true, apiKey: '', apiUrl: '/api/osint/whatsapp-groups',
      searchTypes: ['whatsapp', 'keyword', 'name'],
      description: 'WhatsApp group & channel finder — search for public WhatsApp groups and channels by keyword', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'image_search', name: 'DuckDuckGo Images', icon: '🖼', enabled: true, apiKey: '', apiUrl: '/api/proxy/image-search',
      searchTypes: ['image'],
      description: 'Image search via DuckDuckGo — find images related to a query', rateLimit: 'Unlimited (free)', requiresKey: false },
    { id: 'people_db', name: 'People Database', icon: '👤', enabled: true, apiKey: '', apiUrl: '/api/osint/people-search',
      searchTypes: ['person', 'name', 'fullname', 'phone', 'email'],
      description: 'Local people database — search imported personality data (names, phones, info, exploits)', rateLimit: 'Unlimited (free)', requiresKey: false },
  ];

  // ── Source Management ─────────────────────────────
  async function getSources() {
    const stored = await GCStorage.get(OSINT_SOURCES_KEY);
    if (!stored) {
      await GCStorage.set(OSINT_SOURCES_KEY, DEFAULT_SOURCES);
      return await _mergeCentralizedKeys([...DEFAULT_SOURCES]);
    }
    // Merge defaults for any missing sources
    const ids = stored.map(s => s.id);
    let updated = false;
    for (const def of DEFAULT_SOURCES) {
      if (!ids.includes(def.id)) { stored.push(def); updated = true; }
    }
    if (updated) await GCStorage.set(OSINT_SOURCES_KEY, stored);
    return await _mergeCentralizedKeys(stored);
  }

  // ── Merge centralized admin API keys and states ───
  // The admin sets API keys and on/off states in site_settings.
  // This ensures ALL users on ALL devices use the admin's config.
  async function _mergeCentralizedKeys(sources) {
    try {
      let adminKeys = {};
      let adminStates = {};
      // Try server API first (works for ALL authenticated users)
      if (GCApi.getUserToken()) {
        try {
          const result = await GCApi.req('GET', '/api/public/sources');
          if (result.success) {
            adminKeys = result.apiKeys || {};
            adminStates = result.sourceStates || {};
            // Also load Mistral AI key if available
            if (result.mistralApiKey) GCMistralAI.setKey(result.mistralApiKey);
            if (result.customAiPrompt) GCMistralAI.setCustomPrompt(result.customAiPrompt);
          }
        } catch {}
      }
      // Fallback to localStorage (admin browser only)
      if (Object.keys(adminKeys).length === 0) {
        const settings = await GCStorage.get('gc_site_settings');
        if (settings) {
          adminKeys = settings.apiKeys || {};
          adminStates = settings.sourceStates || {};
        }
      }
      for (const src of sources) {
        // Override API key if admin has set one centrally
        if (adminKeys[src.id] !== undefined) {
          src.apiKey = adminKeys[src.id];
        }
        // Override enabled state if admin has set one centrally
        if (adminStates[src.id] !== undefined) {
          src.enabled = adminStates[src.id];
        }
        // Handle Google CX (stored as google_cx in centralized keys)
        if (src.id === 'google' && adminKeys['google_cx'] !== undefined) {
          src.apiCx = adminKeys['google_cx'];
        }
        // Handle RapidAPI: all sources with isRapidApi flag share one key
        if (src.isRapidApi && adminKeys['rapidapi'] !== undefined) {
          src.apiKey = adminKeys['rapidapi'];
        }
      }
    } catch {}
    return sources;
  }

  async function saveSources(sources) {
    await GCStorage.set(OSINT_SOURCES_KEY, sources);
  }

  async function updateSource(sourceId, updates) {
    const sources = await getSources();
    const idx = sources.findIndex(s => s.id === sourceId);
    if (idx < 0) return { error: 'Source introuvable.' };
    Object.assign(sources[idx], updates);
    await saveSources(sources);
    return { success: true, source: sources[idx] };
  }

  async function addCustomSource(source) {
    const sources = await getSources();
    const id = 'custom_' + Date.now();
    sources.push({
      id,
      name: source.name || 'Custom Source',
      icon: source.icon || '🔗',
      enabled: true,
      apiKey: source.apiKey || '',
      apiUrl: source.apiUrl || '',
      searchTypes: source.searchTypes || ['keyword'],
      description: source.description || 'Custom OSINT source',
      rateLimit: source.rateLimit || 'Unknown',
      requiresKey: true,
      headers: source.headers || {},
      responseParser: source.responseParser || 'json',
    });
    await saveSources(sources);
    return { success: true, id };
  }

  async function removeSource(sourceId) {
    const sources = await getSources();
    const filtered = sources.filter(s => s.id !== sourceId);
    if (filtered.length === sources.length) return { error: 'Source introuvable.' };
    await saveSources(filtered);
    return { success: true };
  }

  // ── Search Engine ─────────────────────────────────
  async function search(type, query, onProgress) {
    const sources = await getSources();
    const activeSources = sources.filter(s => {
      if (!s.enabled) return false;
      if (!s.searchTypes.includes(type)) return false;
      // Skip sources that require an API key but don't have one configured
      if (s.requiresKey && !s.apiKey) return false;
      return true;
    });

    if (activeSources.length === 0) {
      return { error: 'Aucune source OSINT active pour ce type de recherche.', results: [] };
    }

    const allResults = [];
    const errors = [];

    // Notify: scan starting
    if (onProgress) onProgress({ phase: 'start', total: activeSources.length, sources: activeSources.map(s => ({ id: s.id, name: s.name, icon: s.icon })) });

    // Run searches in parallel with real-time progress
    const promises = activeSources.map(async (source) => {
      try {
        const results = await querySource(source, type, query);
        allResults.push(...results);
        if (onProgress) onProgress({ phase: 'source', source: source.name, icon: source.icon, sourceId: source.id, status: 'success', count: results.length });
      } catch (err) {
        errors.push({ source: source.name, error: err.message });
        if (onProgress) onProgress({ phase: 'source', source: source.name, icon: source.icon, sourceId: source.id, status: 'error', error: err.message });
      }
    });

    await Promise.allSettled(promises);

    // Sort by confidence
    allResults.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    // Notify: scan complete
    if (onProgress) onProgress({ phase: 'complete', resultCount: allResults.length, errorCount: errors.length });

    return {
      results: allResults,
      errors,
      sourcesQueried: activeSources.map(s => s.name),
      totalSources: activeSources.length,
    };
  }

  async function querySource(source, type, query) {
    switch (source.id) {
      case 'github': return queryGitHub(source, type, query);
      case 'google': return queryGoogle(source, type, query);
      case 'facebook': return queryFacebook(source, type, query);
      case 'tiktok': return queryTikTok(source, type, query);
      case 'shodan': return queryShodan(source, type, query);
      case 'hibp': return queryHIBP(source, type, query);
      case 'virustotal': return queryVirusTotal(source, type, query);
      case 'hunter': return queryHunter(source, type, query);
      case 'ipinfo': return queryIPInfo(source, type, query);
      case 'dns': return queryDNS(source, type, query);
      case 'wayback': return queryWayback(source, type, query);
      case 'duckduckgo': return queryDuckDuckGo(source, type, query);
      case 'emailrep': return queryEmailRep(source, type, query);
      case 'gravatar': return queryGravatar(source, type, query);
      case 'numverify': return queryNumVerify(source, type, query);
      case 'whoisxml': return queryWhoisXML(source, type, query);
      case 'abuseipdb': return queryAbuseIPDB(source, type, query);
      case 'reddit': return queryReddit(source, type, query);
      case 'securitytrails': return querySecurityTrails(source, type, query);
      case 'clearbit': return queryClearbit(source, type, query);
      case 'dehashed': return queryDehashed(source, type, query);
      case 'intelx': return queryIntelX(source, type, query);
      case 'custom_secret': return queryCustomAPI(source, type, query);
      case 'rapidapi_ip': return queryRapidApiIP(source, type, query);
      case 'rapidapi_phone': return queryRapidApiPhone(source, type, query);
      case 'rapidapi_email': return queryRapidApiEmail(source, type, query);
      case 'rapidapi_breach': return queryRapidApiBreach(source, type, query);
      case 'rapidapi_social': return queryRapidApiSocial(source, type, query);
      default: return queryCustomAPI(source, type, query);
    }
  }

  // ── GitHub API ────────────────────────────────────
  async function queryGitHub(source, type, query) {
    const headers = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GoldCrewOSINT/1.0' };
    if (source.apiKey) headers['Authorization'] = `token ${source.apiKey}`;

    const results = [];

    try {
      if (type === 'username' || type === 'pseudo') {
        const resp = await fetchWithTimeout(`https://api.github.com/users/${encodeURIComponent(query)}`, { headers }, 12000);
        if (resp.ok) {
          const user = await resp.json();
          results.push({
            source: 'GitHub',
            icon: '🐙',
            confidence: 95,
            date: user.created_at,
            data: {
              username: user.login,
              name: user.name || '—',
              bio: user.bio || '—',
              location: user.location || '—',
              company: user.company || '—',
              blog: user.blog || '—',
              public_repos: user.public_repos,
              followers: user.followers,
              following: user.following,
              created: user.created_at,
            },
            links: [user.html_url],
            rawData: user,
          });
        }
      }

      if (type === 'email') {
        // GitHub search by email in commits
        const resp = await fetchWithTimeout(`https://api.github.com/search/users?q=${encodeURIComponent(query)}+in:email`, { headers }, 12000);
        if (resp.ok) {
          const data = await resp.json();
          for (const user of data.items?.slice(0, 3) || []) {
            results.push({
              source: 'GitHub',
              icon: '🐙',
              confidence: 75,
              date: null,
              data: { username: user.login, profile: user.html_url, type: user.type },
              links: [user.html_url],
              rawData: user,
            });
          }
        }
      }

      if (type === 'fullname' || type === 'name') {
        const resp = await fetchWithTimeout(`https://api.github.com/search/users?q=${encodeURIComponent(query)}+in:name`, { headers }, 12000);
        if (resp.ok) {
          const data = await resp.json();
          for (const user of data.items?.slice(0, 5) || []) {
            results.push({
              source: 'GitHub',
              icon: '🐙',
              confidence: 70,
              date: null,
              data: { username: user.login, profile: user.html_url, type: user.type },
              links: [user.html_url],
              rawData: user,
            });
          }
        }
      }

      if (type === 'keyword') {
        const resp = await fetchWithTimeout(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=5`, { headers }, 12000);
        if (resp.ok) {
          const data = await resp.json();
          for (const repo of data.items?.slice(0, 5) || []) {
            results.push({
              source: 'GitHub',
              icon: '🐙',
              confidence: 80,
              date: repo.created_at,
              data: {
                repo: repo.full_name,
                description: repo.description || '—',
                stars: repo.stargazers_count,
                language: repo.language || '—',
                forks: repo.forks_count,
              },
              links: [repo.html_url],
              rawData: repo,
            });
          }
        }
      }
    } catch (err) {
      throw new Error('GitHub API: ' + err.message);
    }

    return results;
  }

  // ── Google Custom Search API ──────────────────────
  async function queryGoogle(source, type, query) {
    if (!source.apiKey || !source.apiCx) {
      throw new Error('Google API Key et Search Engine ID requis.');
    }

    const results = [];
    try {
      const params = new URLSearchParams({
        key: source.apiKey,
        cx: source.apiCx,
        q: query,
        num: '10',
      });

      // Enhance query based on type
      if (type === 'email') params.set('q', `"${query}"`);
      if (type === 'phone') params.set('q', `"${query}"`);
      if (type === 'domain') params.set('q', `site:${query}`);
      if (type === 'fullname' || type === 'name') params.set('q', `"${query}" social media profile`);

      const resp = await fetchWithTimeout(`https://www.googleapis.com/customsearch/v1?${params}`, {}, 15000);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        if (resp.status === 429) throw new Error('Quota Google API epuise (100/jour gratuit).');
        throw new Error(err.error?.message || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      for (const item of data.items || []) {
        results.push({
          source: 'Google',
          icon: '🔍',
          confidence: 65,
          date: null,
          data: {
            title: item.title,
            snippet: item.snippet || '',
            displayLink: item.displayLink,
          },
          links: [item.link],
          rawData: item,
        });
      }
    } catch (err) {
      throw new Error('Google API: ' + err.message);
    }

    return results;
  }

  // ── Facebook Graph API ────────────────────────────
  async function queryFacebook(source, type, query) {
    if (!source.apiKey) {
      throw new Error('Facebook Access Token requis.');
    }

    const results = [];
    try {
      if (type === 'username') {
        const resp = await fetchWithTimeout(
          `https://graph.facebook.com/${encodeURIComponent(query)}?fields=id,name,email,location,website,about,birthday&access_token=${source.apiKey}`,
          {}, 10000
        );
        if (resp.ok) {
          const user = await resp.json();
          if (user.id) {
            results.push({
              source: 'Facebook',
              icon: '📘',
              confidence: 90,
              date: null,
              data: {
                name: user.name,
                id: user.id,
                location: user.location?.name || '—',
                website: user.website || '—',
                about: user.about || '—',
              },
              links: [`https://facebook.com/${user.id}`],
              rawData: user,
            });
          }
        } else if (resp.status === 404) {
          // No results
        } else {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${resp.status}`);
        }
      }

      if (type === 'email' || type === 'phone') {
        // Search pages/users by query
        const resp = await fetchWithTimeout(
          `https://graph.facebook.com/search?q=${encodeURIComponent(query)}&type=user&fields=id,name,location&access_token=${source.apiKey}`,
          {}, 10000
        );
        if (resp.ok) {
          const data = await resp.json();
          for (const user of data.data?.slice(0, 5) || []) {
            results.push({
              source: 'Facebook',
              icon: '📘',
              confidence: 60,
              date: null,
              data: { name: user.name, id: user.id, location: user.location?.name || '—' },
              links: [`https://facebook.com/${user.id}`],
              rawData: user,
            });
          }
        }
      }
    } catch (err) {
      throw new Error('Facebook API: ' + err.message);
    }

    return results;
  }

  // ── TikTok API ────────────────────────────────────
  async function queryTikTok(source, type, query) {
    if (!source.apiKey) {
      throw new Error('TikTok API Key requis.');
    }

    const results = [];
    try {
      const headers = {
        'Authorization': `Bearer ${source.apiKey}`,
        'Content-Type': 'application/json',
      };

      if (type === 'username') {
        const resp = await fetchWithTimeout(
          `https://open.tiktokapis.com/v2/user/info/?fields=display_name,bio_description,avatar_url,follower_count,following_count,likes_count,video_count&username=${encodeURIComponent(query)}`,
          { headers }, 12000
        );
        if (resp.ok) {
          const data = await resp.json();
          const user = data.data?.user;
          if (user) {
            results.push({
              source: 'TikTok',
              icon: '🎵',
              confidence: 90,
              date: null,
              data: {
                username: query,
                display_name: user.display_name,
                bio: user.bio_description || '—',
                followers: user.follower_count,
                following: user.following_count,
                likes: user.likes_count,
                videos: user.video_count,
              },
              links: [`https://tiktok.com/@${query}`],
              rawData: user,
            });
          }
        } else if (resp.status !== 404) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${resp.status}`);
        }
      }

      if (type === 'keyword') {
        const resp = await fetchWithTimeout(
          `https://open.tiktokapis.com/v2/search/video/?query=${encodeURIComponent(query)}&count=5`,
          { method: 'POST', headers }, 12000
        );
        if (resp.ok) {
          const data = await resp.json();
          for (const video of data.data?.videos?.slice(0, 5) || []) {
            results.push({
              source: 'TikTok',
              icon: '🎵',
              confidence: 70,
              date: video.create_time ? new Date(video.create_time * 1000).toISOString() : null,
              data: {
                title: video.title || '—',
                author: video.author?.username || '—',
                likes: video.statistics?.digg_count || 0,
                views: video.statistics?.view_count || 0,
              },
              links: [`https://tiktok.com/@${video.author?.username}/video/${video.id}`],
              rawData: video,
            });
          }
        }
      }
    } catch (err) {
      throw new Error('TikTok API: ' + err.message);
    }

    return results;
  }

  // ── Shodan API ──────────────────────────────────────
  async function queryShodan(source, type, query) {
    if (!source.apiKey) throw new Error('Shodan API Key requis.');
    const results = [];
    try {
      const resp = await fetchWithTimeout(`https://api.shodan.io/shodan/host/${encodeURIComponent(query)}?key=${source.apiKey}`, {}, 12000);
      if (resp.ok) {
        const data = await resp.json();
        results.push({ source: 'Shodan', icon: '🌐', confidence: 90, date: data.last_update || null, data: { ip: data.ip_str, org: data.org || '—', os: data.os || '—', ports: (data.ports || []).join(', '), vulns: (data.vulns || []).length, hostnames: (data.hostnames || []).join(', '), country: data.country_name || '—' }, links: [`https://www.shodan.io/host/${data.ip_str}`], rawData: data });
      } else if (resp.status !== 404) { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('Shodan: ' + err.message); }
    return results;
  }

  // ── Have I Been Pwned ────────────────────────────────
  async function queryHIBP(source, type, query) {
    if (!source.apiKey) throw new Error('HIBP API Key requis.');
    const results = [];
    try {
      const resp = await fetchWithTimeout(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(query)}`, { headers: { 'hibp-api-key': source.apiKey } }, 12000);
      if (resp.ok) {
        const breaches = await resp.json();
        for (const b of breaches.slice(0, 10)) {
          results.push({ source: 'HIBP', icon: '🔓', confidence: 95, date: b.BreachDate, data: { name: b.Name, domain: b.Domain, count: b.PwnCount, dataClasses: (b.DataClasses || []).join(', '), description: (b.Description || '').slice(0, 200) }, links: ['https://haveibeenpwned.com'], rawData: b });
        }
      } else if (resp.status !== 404) { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('HIBP: ' + err.message); }
    return results;
  }

  // ── VirusTotal (via CORS proxy — VT blocks browser requests) ──
  async function queryVirusTotal(source, type, query) {
    if (!source.apiKey) throw new Error('VirusTotal API Key requis.');
    const results = [];
    // VirusTotal blocks browser CORS — encode key in header AND pass via proxy
    const headers = { 'x-apikey': source.apiKey, 'Accept': 'application/json' };
    try {
      let endpoint = type === 'ip' ? `ip_addresses/${query}` : type === 'hash' ? `files/${query}` : type === 'url' ? `urls/${btoa(query)}` : `domains/${query}`;
      const url = `https://www.virustotal.com/api/v3/${endpoint}`;
      const resp = await fetchSmart(url, { headers }, 15000, { needsProxy: true });
      if (resp.ok) {
        const data = await resp.json();
        const attrs = data.data?.attributes || {};
        results.push({ source: 'VirusTotal', icon: '🛡️', confidence: 85, date: attrs.last_analysis_date ? new Date(attrs.last_analysis_date * 1000).toISOString() : null, data: { type: data.data?.type, reputation: attrs.reputation ?? '—', harmless: attrs.last_analysis_stats?.harmless ?? 0, malicious: attrs.last_analysis_stats?.malicious ?? 0, suspicious: attrs.last_analysis_stats?.suspicious ?? 0, undetected: attrs.last_analysis_stats?.undetected ?? 0 }, links: [`https://www.virustotal.com/gui/${encodeURIComponent(query)}`], rawData: data });
      } else if (resp.status !== 404) { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('VirusTotal: ' + err.message); }
    return results;
  }

  // ── Hunter.io ────────────────────────────────────────
  async function queryHunter(source, type, query) {
    if (!source.apiKey) throw new Error('Hunter.io API Key requis.');
    const results = [];
    try {
      const endpoint = type === 'email' ? `email-verifier?email=${encodeURIComponent(query)}` : `domain-search?domain=${encodeURIComponent(query)}`;
      const resp = await fetchWithTimeout(`https://api.hunter.io/v2/${endpoint}&api_key=${source.apiKey}`, {}, 12000);
      if (resp.ok) {
        const json = await resp.json();
        const data = json.data;
        if (type === 'email' && data) {
          results.push({ source: 'Hunter.io', icon: '🎯', confidence: 80, date: null, data: { email: data.email, result: data.result, score: data.score, sources: (data.sources || []).length }, links: [], rawData: data });
        } else if (data?.emails) {
          for (const e of data.emails.slice(0, 5)) {
            results.push({ source: 'Hunter.io', icon: '🎯', confidence: e.confidence || 60, date: null, data: { email: e.value, type: e.type, firstName: e.first_name || '—', lastName: e.last_name || '—', position: e.position || '—' }, links: [], rawData: e });
          }
        }
      } else { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('Hunter.io: ' + err.message); }
    return results;
  }

  // ── IPInfo ───────────────────────────────────────────
  async function queryIPInfo(source, type, query) {
    const results = [];
    try {
      const url = source.apiKey ? `https://ipinfo.io/${encodeURIComponent(query)}/json?token=${source.apiKey}` : `https://ipinfo.io/${encodeURIComponent(query)}/json`;
      const resp = await fetchWithTimeout(url, {}, 10000);
      if (resp.ok) {
        const data = await resp.json();
        if (data.ip) {
          results.push({ source: 'IPInfo', icon: '📍', confidence: 90, date: null, data: { ip: data.ip, city: data.city || '—', region: data.region || '—', country: data.country || '—', org: data.org || '—', loc: data.loc || '—', timezone: data.timezone || '—' }, links: [`https://ipinfo.io/${query}`], rawData: data });
        }
      } else if (resp.status !== 404) { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('IPInfo: ' + err.message); }
    return results;
  }

  // ── DNS Lookup (DNS-over-HTTPS) ─────────────────────
  async function queryDNS(source, type, query) {
    const results = [];
    const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME'];
    try {
      for (const rt of recordTypes) {
        const resp = await fetchWithTimeout(`https://dns.google/resolve?name=${encodeURIComponent(query)}&type=${rt}`, {}, 8000);
        if (resp.ok) {
          const data = await resp.json();
          if (data.Answer?.length) {
            for (const a of data.Answer) {
              results.push({ source: 'DNS', icon: '🔗', confidence: 95, date: null, data: { type: rt, name: a.name, data: a.data, ttl: a.TTL || '—' }, links: [], rawData: a });
            }
          }
        }
      }
    } catch (err) { throw new Error('DNS: ' + err.message); }
    return results;
  }

  // ── Wayback Machine ─────────────────────────────────
  async function queryWayback(source, type, query) {
    const results = [];
    try {
      const url = query.startsWith('http') ? query : `https://${query}`;
      const resp = await fetchWithTimeout(`https://web.archive.org/wayback/available?url=${encodeURIComponent(url)}`, {}, 10000);
      if (resp.ok) {
        const data = await resp.json();
        if (data.archived_snapshots?.closest) {
          const s = data.archived_snapshots.closest;
          results.push({ source: 'Wayback Machine', icon: '⏳', confidence: 70, date: s.timestamp ? `${s.timestamp.slice(0,4)}-${s.timestamp.slice(4,6)}-${s.timestamp.slice(6,8)}` : null, data: { url: s.url, status: s.status, available: s.available, original: url }, links: [s.url], rawData: data });
        }
        const cdxResp = await fetchWithTimeout(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&limit=5&output=json&fl=timestamp,statuscode,mimetype`, {}, 10000);
        if (cdxResp.ok) {
          const cdx = await cdxResp.json();
          if (cdx.length > 1) {
            for (let i = 1; i < Math.min(cdx.length, 6); i++) {
              const [ts, code, mime] = cdx[i];
              results.push({ source: 'Wayback Machine', icon: '⏳', confidence: 60, date: `${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)}`, data: { snapshot: `https://web.archive.org/web/${ts}/${url}`, status: code, type: mime }, links: [`https://web.archive.org/web/${ts}/${url}`], rawData: { timestamp: ts, statuscode: code, mimetype: mime } });
            }
          }
        }
      }
    } catch (err) { throw new Error('Wayback Machine: ' + err.message); }
    return results;
  }

  // ── DuckDuckGo Instant Answer API ───────────────────
  async function queryDuckDuckGo(source, type, query) {
    const results = [];
    try {
      // DuckDuckGo Instant Answer + HTML search
      const resp = await fetchWithTimeout(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
        {}, 10000
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data.AbstractText) {
          results.push({
            source: 'DuckDuckGo', icon: '🦆', confidence: 60,
            date: null,
            data: { abstract: data.AbstractText, source: data.AbstractSource || '—', url: data.AbstractURL || '—', heading: data.Heading || '—' },
            links: data.AbstractURL ? [data.AbstractURL] : [],
            rawData: data,
          });
        }
        // Related topics
        for (const topic of (data.RelatedTopics || []).slice(0, 5)) {
          if (topic.Text) {
            results.push({
              source: 'DuckDuckGo', icon: '🦆', confidence: 45,
              date: null,
              data: { text: topic.Text, url: topic.FirstURL || '—' },
              links: topic.FirstURL ? [topic.FirstURL] : [],
              rawData: topic,
            });
          }
        }
      }
    } catch (err) { throw new Error('DuckDuckGo: ' + err.message); }
    return results;
  }

  // ── EmailRep ────────────────────────────────────────
  async function queryEmailRep(source, type, query) {
    if (!source.apiKey) throw new Error('EmailRep API Key requis.');
    const results = [];
    try {
      const resp = await fetchWithTimeout(
        `https://emailrep.io/${encodeURIComponent(query)}`,
        { headers: { 'Key': source.apiKey, 'Accept': 'application/json', 'User-Agent': 'GoldCrewOSINT' } },
        10000
      );
      if (resp.ok) {
        const data = await resp.json();
        results.push({
          source: 'EmailRep', icon: '📧', confidence: 80,
          date: null,
          data: {
            email: data.email, reputation: data.reputation || '—',
            suspicious: data.suspicious ? 'Oui' : 'Non',
            references: data.references || 0,
            blacklisted: data.details?.blacklisted ? 'Oui' : 'Non',
            malicious_activity: data.details?.malicious_activity ? 'Oui' : 'Non',
            credentials_leaked: data.details?.credentials_leaked ? 'Oui' : 'Non',
            first_seen: data.details?.first_seen || '—',
            last_seen: data.details?.last_seen || '—',
            domain_exists: data.details?.domain_exists ? 'Oui' : 'Non',
            profiles: (data.details?.profiles || []).join(', ') || '—',
          },
          links: [],
          rawData: data,
        });
      } else if (resp.status !== 404) { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('EmailRep: ' + err.message); }
    return results;
  }

  // ── Gravatar ────────────────────────────────────────
  async function queryGravatar(source, type, query) {
    const results = [];
    try {
      // Gravatar v3 API (JSON) — works without key for public profiles
      const emailHash = await sha256Hex(query.trim().toLowerCase());
      const resp = await fetchWithTimeout(
        `https://www.gravatar.com/${emailHash}.json`,
        { headers: { 'Accept': 'application/json' } },
        10000
      );
      if (resp.ok) {
        const data = await resp.json();
        const entry = data.entry?.[0];
        if (entry) {
          results.push({
            source: 'Gravatar', icon: '👤', confidence: 75,
            date: null,
            data: {
              display_name: entry.displayName || '—',
              about: entry.aboutMe || '—',
              location: entry.currentLocation || '—',
              urls: (entry.urls || []).map(u => u.value).join(', ') || '—',
              accounts: (entry.accounts || []).map(a => `${a.shortname || a.domain}`).join(', ') || '—',
              profile_url: entry.profileUrl || '—',
            },
            links: entry.profileUrl ? [entry.profileUrl] : [`https://gravatar.com/${emailHash}`],
            rawData: entry,
          });
        }
      } else if (resp.status !== 404) { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('Gravatar: ' + err.message); }
    return results;
  }

  // SHA-256 hex helper for Gravatar
  async function sha256Hex(str) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback: no Gravatar hash available
      return str.replace(/[^a-f0-9]/gi, '0').padEnd(64, '0');
    }
  }

  // ── NumVerify ───────────────────────────────────────
  async function queryNumVerify(source, type, query) {
    if (!source.apiKey) throw new Error('NumVerify API Key requis.');
    const results = [];
    try {
      const resp = await fetchWithTimeout(
        `https://apilayer.net/api/validate?access_key=${source.apiKey}&number=${encodeURIComponent(query)}`,
        {}, 10000
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data.valid !== undefined) {
          results.push({
            source: 'NumVerify', icon: '📞', confidence: data.valid ? 85 : 30,
            date: null,
            data: {
              number: data.number || query, valid: data.valid ? 'Oui' : 'Non',
              local_format: data.local_format || '—', international_format: data.international_format || '—',
              country: data.country_name || '—', country_code: data.country_code || '—',
              location: data.location || '—', carrier: data.carrier || '—',
              line_type: data.line_type || '—',
            },
            links: [],
            rawData: data,
          });
        }
      } else { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('NumVerify: ' + err.message); }
    return results;
  }

  // ── WhoisXML ────────────────────────────────────────
  async function queryWhoisXML(source, type, query) {
    const results = [];
    try {
      // Free tier whoisjs.com endpoint
      const resp = await fetchWithTimeout(
        `https://whoisjs.com/api/v1/${encodeURIComponent(query)}`,
        {}, 12000
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data.registrar || data.name) {
          results.push({
            source: 'WhoisXML', icon: '🌐', confidence: 85,
            date: data.created_date || data.creation_date || null,
            data: {
              domain: data.domain_name || query,
              registrar: data.registrar || '—',
              created: data.created_date || data.creation_date || '—',
              expires: data.expiration_date || data.registry_expiry_date || '—',
              updated: data.updated_date || '—',
              name_servers: (data.name_servers || []).join(', ') || '—',
              status: (data.status || data.domain_status || []).join(', ') || '—',
              registrant: data.registrant?.name || data.registrant_name || '—',
              country: data.registrant?.country || data.registrant_country || '—',
            },
            links: [`https://who.is/whois/${query}`],
            rawData: data,
          });
        }
      } else if (resp.status !== 404) { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('WhoisXML: ' + err.message); }
    return results;
  }

  // ── AbuseIPDB ───────────────────────────────────────
  async function queryAbuseIPDB(source, type, query) {
    if (!source.apiKey) throw new Error('AbuseIPDB API Key requis.');
    const results = [];
    try {
      const resp = await fetchWithTimeout(
        `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(query)}&maxAgeInDays=90`,
        { headers: { 'Key': source.apiKey, 'Accept': 'application/json' } },
        10000
      );
      if (resp.ok) {
        const json = await resp.json();
        const data = json.data;
        if (data) {
          results.push({
            source: 'AbuseIPDB', icon: '🛡️', confidence: 85,
            date: data.lastReportedAt || null,
            data: {
              ip: data.ipAddress || query,
              abuse_confidence_score: data.abuseConfidenceScore + '%',
              is_public: data.isPublic ? 'Oui' : 'Non',
              is_whitelisted: data.isWhitelisted ? 'Oui' : 'Non',
              country_code: data.countryCode || '—',
              isp: data.isp || '—',
              domain: data.domain || '—',
              total_reports: data.totalReports || 0,
              num_distinct_users: data.numDistinctUsers || 0,
              last_reported: data.lastReportedAt || '—',
              usage_type: data.usageType || '—',
            },
            links: [`https://www.abuseipdb.com/check/${query}`],
            rawData: data,
          });
        }
      } else { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('AbuseIPDB: ' + err.message); }
    return results;
  }

  // ── Reddit ──────────────────────────────────────────
  async function queryReddit(source, type, query) {
    const results = [];
    try {
      if (type === 'username' || type === 'pseudo') {
        // Reddit blocks most CORS from browsers — try multiple endpoints
        let data = null;
        const endpoints = [
          `https://api.reddit.com/user/${encodeURIComponent(query)}/about.json`,
          `https://old.reddit.com/user/${encodeURIComponent(query)}/about.json`,
          `https://www.reddit.com/user/${encodeURIComponent(query)}/about.json`,
        ];
        for (const url of endpoints) {
          try {
            const resp = await fetchWithTimeout(url, {
              headers: { 'Accept': 'application/json' },
            }, 8000);
            if (resp.ok) {
              const json = await resp.json();
              if (json.data?.name) { data = json.data; break; }
            }
          } catch { continue; }
        }
        if (data) {
          results.push({
            source: 'Reddit', icon: '🤖', confidence: 90,
            date: data.created_utc ? new Date(data.created_utc * 1000).toISOString() : null,
            data: {
              username: data.name, link_karma: data.link_karma || 0,
              comment_karma: data.comment_karma || 0,
              total_karma: (data.link_karma || 0) + (data.comment_karma || 0),
              verified: data.verified ? 'Oui' : 'Non',
              has_verified_email: data.has_verified_email ? 'Oui' : 'Non',
              is_mod: data.is_mod ? 'Oui' : 'Non',
              is_gold: data.is_gold ? 'Oui' : 'Non',
              account_created: data.created_utc ? new Date(data.created_utc * 1000).toLocaleDateString('fr-FR') : '—',
              profile: data.subreddit?.public_description || '—',
            },
            links: [`https://www.reddit.com/user/${query}`],
            rawData: data,
          });
        }
      }
      if (type === 'keyword') {
        let searchData = null;
        const searchEndpoints = [
          `https://api.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=5&sort=relevance`,
          `https://old.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=5&sort=relevance`,
          `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=5&sort=relevance`,
        ];
        for (const url of searchEndpoints) {
          try {
            const resp = await fetchWithTimeout(url, {
              headers: { 'Accept': 'application/json' },
            }, 8000);
            if (resp.ok) { searchData = await resp.json(); break; }
          } catch { continue; }
        }
        if (searchData?.data?.children) {
          for (const post of searchData.data.children.slice(0, 5)) {
            const d = post.data || {};
            results.push({
              source: 'Reddit', icon: '🤖', confidence: 55,
              date: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : null,
              data: {
                title: (d.title || '').slice(0, 120), subreddit: d.subreddit || '—',
                author: d.author || '—', score: d.score || 0,
                comments: d.num_comments || 0, url: d.url || '—',
              },
              links: [d.permalink ? `https://www.reddit.com${d.permalink}` : d.url],
              rawData: d,
            });
          }
        }
      }
    } catch (err) { throw new Error('Reddit: ' + err.message); }
    return results;
  }

  // ── SecurityTrails ──────────────────────────────────
  async function querySecurityTrails(source, type, query) {
    if (!source.apiKey) throw new Error('SecurityTrails API Key requis.');
    const results = [];
    const headers = { 'apikey': source.apiKey, 'Accept': 'application/json' };
    try {
      if (type === 'domain') {
        // Subdomains
        const resp = await fetchWithTimeout(
          `https://api.securitytrails.com/v1/domain/${encodeURIComponent(query)}/subdomains`,
          { headers }, 12000
        );
        if (resp.ok) {
          const data = await resp.json();
          const subdomains = data.subdomains || [];
          if (subdomains.length > 0) {
            results.push({
              source: 'SecurityTrails', icon: '🛤️', confidence: 85,
              date: null,
              data: { domain: query, subdomain_count: subdomains.length, subdomains: subdomains.slice(0, 20).join(', ') },
              links: [`https://securitytrails.com/domain/${query}`],
              rawData: data,
            });
          }
        } else if (resp.status !== 404) { throw new Error(`HTTP ${resp.status}`); }
      }
      if (type === 'ip') {
        // IPs to domains
        const resp = await fetchWithTimeout(
          `https://api.securitytrails.com/v1/search/list?ip=${encodeURIComponent(query)}`,
          { headers }, 12000
        );
        if (resp.ok) {
          const data = await resp.json();
          const records = data.records || [];
          for (const r of records.slice(0, 5)) {
            results.push({
              source: 'SecurityTrails', icon: '🛤️', confidence: 80,
              date: null,
              data: { hostname: r.hostname || '—', ip: r.ip || query },
              links: [`https://securitytrails.com/domain/${r.hostname}`],
              rawData: r,
            });
          }
        }
      }
    } catch (err) { throw new Error('SecurityTrails: ' + err.message); }
    return results;
  }

  // ── Clearbit ────────────────────────────────────────
  async function queryClearbit(source, type, query) {
    if (!source.apiKey) throw new Error('Clearbit API Key requis.');
    const results = [];
    const headers = { 'Authorization': `Bearer ${source.apiKey}` };
    try {
      if (type === 'email') {
        const resp = await fetchWithTimeout(
          `https://person.clearbit.com/v2/people/find?email=${encodeURIComponent(query)}`,
          { headers }, 12000
        );
        if (resp.ok) {
          const data = await resp.json();
          results.push({
            source: 'Clearbit', icon: '🏢', confidence: 85,
            date: null,
            data: {
              name: [data.name?.givenName, data.name?.familyName].filter(Boolean).join(' ') || '—',
              title: data.employment?.title || '—',
              company: data.employment?.name || '—',
              role: data.employment?.role || '—',
              seniority: data.employment?.seniority || '—',
              location: data.geo?.city || data.geo?.country || '—',
              bio: data.bio || '—',
              twitter: data.twitter?.handle || '—',
              linkedin: data.linkedin?.handle || '—',
              github: data.github?.handle || '—',
            },
            links: [
              data.twitter?.handle ? `https://twitter.com/${data.twitter.handle}` : null,
              data.linkedin?.handle ? `https://linkedin.com/in/${data.linkedin.handle}` : null,
            ].filter(Boolean),
            rawData: data,
          });
        } else if (resp.status !== 404) { throw new Error(`HTTP ${resp.status}`); }
      }
      if (type === 'domain') {
        const resp = await fetchWithTimeout(
          `https://company.clearbit.com/v2/companies/find?domain=${encodeURIComponent(query)}`,
          { headers }, 12000
        );
        if (resp.ok) {
          const data = await resp.json();
          results.push({
            source: 'Clearbit', icon: '🏢', confidence: 85,
            date: null,
            data: {
              name: data.name || '—', domain: data.domain || query,
              description: (data.description || '').slice(0, 200),
              industry: data.category?.industry || '—',
              sector: data.category?.sector || '—',
              employees: data.metrics?.employees || '—',
              raised: data.metrics?.raised || '—',
              location: data.geo?.city || data.geo?.country || '—',
              tech: (data.tech || []).slice(0, 8).join(', ') || '—',
            },
            links: [`https://${query}`],
            rawData: data,
          });
        } else if (resp.status !== 404) { throw new Error(`HTTP ${resp.status}`); }
      }
    } catch (err) { throw new Error('Clearbit: ' + err.message); }
    return results;
  }

  // ── Dehashed ────────────────────────────────────────
  async function queryDehashed(source, type, query) {
    if (!source.apiKey) throw new Error('Dehashed API Key requis.');
    const results = [];
    try {
      const resp = await fetchWithTimeout(
        `https://api.dehashed.com/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': 'Basic ' + btoa(source.apiKey),
            'Accept': 'application/json',
          },
        },
        15000
      );
      if (resp.ok) {
        const data = await resp.json();
        for (const entry of (data.entries || []).slice(0, 10)) {
          results.push({
            source: 'Dehashed', icon: '🗃️', confidence: 80,
            date: null,
            data: {
              email: entry.email || '—', username: entry.username || '—',
              password: entry.password ? '***MASQUÉ***' : '—',
              hashed_password: entry.hashed_password ? entry.hashed_password.slice(0, 20) + '...' : '—',
              ip_address: entry.ip_address || '—',
              name: entry.name || '—', database_name: entry.database_name || '—',
            },
            links: [],
            rawData: entry,
          });
        }
        if (results.length > 0) {
          results[0].data.total_results = data.total || results.length;
        }
      } else { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('Dehashed: ' + err.message); }
    return results;
  }

  // ── Intelligence X ──────────────────────────────────
  async function queryIntelX(source, type, query) {
    if (!source.apiKey) throw new Error('IntelX API Key requis.');
    const results = [];
    const headers = { 'x-key': source.apiKey, 'Accept': 'application/json' };
    try {
      // Search
      const searchResp = await fetchWithTimeout(
        `https://2.intelx.io/intelligent/search?term=${encodeURIComponent(query)}&maxresults=5`,
        { method: 'POST', headers },
        15000
      );
      if (searchResp.ok) {
        const searchData = await searchResp.json();
        if (searchData.id) {
          // Get results
          await new Promise(r => setTimeout(r, 1500)); // IntelX needs a delay
          const resultResp = await fetchWithTimeout(
            `https://2.intelx.io/intelligent/search/result?id=${searchData.id}&limit=5`,
            { headers },
            15000
          );
          if (resultResp.ok) {
            const resultData = await resultResp.json();
            for (const record of (resultData.records || []).slice(0, 5)) {
              results.push({
                source: 'IntelX', icon: '🕵️', confidence: 75,
                date: record.date || null,
                data: {
                  name: record.name || '—',
                  bucket: record.bucket || '—',
                  type: record.type || '—',
                  media: record.media || '—',
                  size: record.size || '—',
                },
                links: record.systemid ? [`https://intelx.io/?s=${record.systemid}`] : [],
                rawData: record,
              });
            }
          }
        }
      } else { throw new Error(`HTTP ${searchResp.status}`); }
    } catch (err) { throw new Error('IntelX: ' + err.message); }
    return results;
  }

  // ── Custom / Secret API ───────────────────────────
  async function queryCustomAPI(source, type, query) {
    if (!source.apiUrl) {
      throw new Error('URL de l\'API non configurée.');
    }

    const results = [];
    try {
      let url = source.apiUrl.replace('{query}', encodeURIComponent(query));
      url = url.replace('{type}', encodeURIComponent(type));

      const headers = {
        'Content-Type': 'application/json',
        ...(source.headers || {}),
      };
      if (source.apiKey) {
        headers['Authorization'] = `Bearer ${source.apiKey}`;
        // Also set X-API-Key for APIs that use it
        headers['X-API-Key'] = source.apiKey;
      }

      const resp = await fetchWithTimeout(url, { headers }, 15000);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);

      const contentType = resp.headers.get('content-type') || '';
      let data;

      if (contentType.includes('json')) {
        data = await resp.json();
      } else {
        const text = await resp.text();
        try { data = JSON.parse(text); } catch { data = { raw: text }; }
      }

      // Try to normalize the response
      const items = Array.isArray(data) ? data : (data.results || data.data || data.items || [data]);

      for (const item of items.slice(0, 10)) {
        results.push({
          source: source.name,
          icon: source.icon || '🔗',
          confidence: 50,
          date: item.date || item.created_at || null,
          data: item,
          links: item.links || item.urls || (item.url ? [item.url] : []),
          rawData: item,
        });
      }
    } catch (err) {
      throw new Error(`${source.name}: ${err.message}`);
    }

    return results;
  }

  // ── RapidAPI: IP Geolocation ─────────────────────
  async function queryRapidApiIP(source, type, query) {
    if (!source.apiKey) throw new Error('RapidAPI Key requis.');
    const results = [];
    const headers = { 'x-rapidapi-key': source.apiKey, 'x-rapidapi-host': 'ip-geolocation-ipwhois-io.p.rapidapi.com' };
    try {
      const resp = await fetchWithTimeout(`https://ip-geolocation-ipwhois-io.p.rapidapi.com/?ip=${encodeURIComponent(query)}`, { headers }, 12000);
      if (resp.ok) {
        const data = await resp.json();
        if (data.ip) {
          results.push({ source: 'RapidAPI IP Geo', icon: '🌍', confidence: 88, date: null, data: { ip: data.ip, city: data.city || '—', region: data.region || '—', country: data.country || '—', loc: data.loc || '—', org: data.org || '—', timezone: data.timezone || '—', postal: data.postal || '—', asn: data.asn || '—', isp: data.isp || '—' }, links: [`https://ipinfo.io/${query}`], rawData: data });
        }
      } else { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('RapidAPI IP Geo: ' + err.message); }
    return results;
  }

  // ── RapidAPI: Phone Validation ────────────────────
  async function queryRapidApiPhone(source, type, query) {
    if (!source.apiKey) throw new Error('RapidAPI Key requis.');
    const results = [];
    const headers = { 'x-rapidapi-key': source.apiKey, 'x-rapidapi-host': 'phonenumbervalidatefree.p.rapidapi.com' };
    try {
      const resp = await fetchWithTimeout(`https://phonenumbervalidatefree.p.rapidapi.com/validate?number=${encodeURIComponent(query)}`, { headers }, 12000);
      if (resp.ok) {
        const data = await resp.json();
        results.push({ source: 'RapidAPI Phone', icon: '📱', confidence: data.is_valid ? 85 : 30, date: null, data: { number: data.phone || query, valid: data.is_valid ? 'Oui' : 'Non', country: data.country || '—', country_code: data.country_code || '—', carrier: data.carrier || '—', line_type: data.line_type || data.type || '—', formatted: data.formatted || '—' }, links: [], rawData: data });
      } else { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('RapidAPI Phone: ' + err.message); }
    return results;
  }

  // ── RapidAPI: Email Verification ──────────────────
  async function queryRapidApiEmail(source, type, query) {
    if (!source.apiKey) throw new Error('RapidAPI Key requis.');
    const results = [];
    const headers = { 'x-rapidapi-key': source.apiKey, 'x-rapidapi-host': 'mailcheck.p.rapidapi.com' };
    try {
      const resp = await fetchWithTimeout(`https://mailcheck.p.rapidapi.com/?email=${encodeURIComponent(query)}`, { headers }, 12000);
      if (resp.ok) {
        const data = await resp.json();
        results.push({ source: 'RapidAPI Email', icon: '✉️', confidence: data.valid ? 80 : 25, date: null, data: { email: data.email || query, valid: data.valid ? 'Oui' : 'Non', disposable: data.disposable ? 'Oui' : 'Non', deliverable: data.deliverability || '—', domain: data.domain || '—', mx: data.mx || '—', suggestion: data.suggestion || '—', catch_all: data.catch_all ? 'Oui' : 'Non' }, links: [], rawData: data });
      } else { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('RapidAPI Email: ' + err.message); }
    return results;
  }

  // ── RapidAPI: Breach Directory ────────────────────
  async function queryRapidApiBreach(source, type, query) {
    if (!source.apiKey) throw new Error('RapidAPI Key requis.');
    const results = [];
    const host = 'breachdirectory.p.rapidapi.com';
    const headers = { 'x-rapidapi-key': source.apiKey, 'x-rapidapi-host': host };
    try {
      // BreachDirectory uses /func/ endpoint path
      let resp = await fetchWithTimeout(`https://${host}/func/?query=${encodeURIComponent(query)}`, { headers }, 15000);
      if (!resp.ok && resp.status !== 403) {
        // Fallback to root endpoint
        resp = await fetchWithTimeout(`https://${host}/?query=${encodeURIComponent(query)}`, { headers }, 15000);
      }
      if (resp.ok) {
        const data = await resp.json();
        const entries = data.result || data.data || data.found || [];
        const items = Array.isArray(entries) ? entries : [entries];
        for (const entry of items.slice(0, 10)) {
          results.push({ source: 'RapidAPI Breach', icon: '💀', confidence: 80, date: entry.breach_date || entry.date || null, data: { email: entry.email || entry.mail || query, password: entry.password ? '••••••••' : '—', hash: entry.hash ? entry.hash.slice(0, 16) + '...' : '—', source: entry.source || entry.breach || entry.name || '—', database: entry.database || '—' }, links: [], rawData: entry });
        }
        if (results.length === 0) {
          results.push({ source: 'RapidAPI Breach', icon: '💀', confidence: 50, date: null, data: { status: 'Aucune fuite trouvée', query: query, checked_sources: data.checked || '—' }, links: [], rawData: data });
        }
      } else if (resp.status === 403) {
        throw new Error('API non activée — souscrivez gratuitement sur RapidAPI');
      } else { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('RapidAPI Breach: ' + err.message); }
    return results;
  }

  // ── RapidAPI: Social Media Lookup ─────────────────
  async function queryRapidApiSocial(source, type, query) {
    if (!source.apiKey) throw new Error('RapidAPI Key requis.');
    const results = [];
    const host = 'social-media-profile-search.p.rapidapi.com';
    const headers = { 'x-rapidapi-key': source.apiKey, 'x-rapidapi-host': host };
    try {
      const param = type === 'email' ? `email=${encodeURIComponent(query)}` : `username=${encodeURIComponent(query)}`;
      // Try multiple endpoint formats
      let resp = null;
      const endpoints = [
        `https://${host}/func/?${param}`,
        `https://${host}/lookup?${param}`,
        `https://${host}/?${param}`,
      ];
      for (const url of endpoints) {
        try {
          resp = await fetchWithTimeout(url, { headers }, 12000);
          if (resp.ok) break;
          if (resp.status === 403) break; // stop trying if auth fails
        } catch { continue; }
      }
      if (resp && resp.ok) {
        const data = await resp.json();
        const profiles = data.profiles || data.data || data.results || data.result || [];
        const items = Array.isArray(profiles) ? profiles : (profiles ? [profiles] : []);
        for (const profile of items.slice(0, 8)) {
          results.push({ source: 'RapidAPI Social', icon: '👥', confidence: profile.confidence || 70, date: null, data: { platform: profile.platform || profile.social_network || '—', username: profile.username || profile.handle || query, name: profile.name || profile.full_name || '—', url: profile.url || profile.link || '—', followers: profile.followers || '—', bio: (profile.bio || profile.description || '—').slice(0, 150), verified: profile.verified ? 'Oui' : 'Non', profile_pic: profile.avatar || profile.profile_pic || '—' }, links: profile.url ? [profile.url] : (profile.link ? [profile.link] : []), rawData: profile });
        }
      } else if (resp && resp.status === 403) {
        throw new Error('API non activée — souscrivez gratuitement sur RapidAPI');
      } else {
        throw new Error(resp ? `HTTP ${resp.status}` : 'Tous les endpoints ont échoué');
      }
    } catch (err) { throw new Error('RapidAPI Social: ' + err.message); }
    return results;
  }

  // ── Utility ───────────────────────────────────────
  function getEnabledSources(sources) {
    return sources.filter(s => s.enabled);
  }

  function getSourceById(sources, id) {
    return sources.find(s => s.id === id);
  }

  function getSourcesForType(sources, type) {
    return sources.filter(s => s.enabled && s.searchTypes.includes(type));
  }

  return {
    getSources, saveSources, updateSource, addCustomSource, removeSource,
    search, querySource, getEnabledSources, getSourceById, getSourcesForType,
    DEFAULT_SOURCES,
  };
})();

window.GCOsintEngine = OsintEngine;
