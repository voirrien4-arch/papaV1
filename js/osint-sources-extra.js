// Gold_Crew — Extended OSINT Sources (v4.0)
// Loaded after osint-engine.js — patches query functions onto GCOsintEngine
// v4.0: Added 14 new free sources (crt.sh, ip-api, URLHaus, MalwareBazaar, ThreatFox, etc.)

(function() {
  const _engine = window.GCOsintEngine;
  if (!_engine) { console.error('GCOsintEngine not found'); return; }

  // ── Fetch with Timeout Utility ─────────────────────
  async function _fetchWithTimeout(url, options, timeoutMs) {
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

  async function _sha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ── DuckDuckGo Instant Answers ────────────────────
  _engine._queryDuckDuckGo = async function(source, type, query) {
    const results = [];
    try {
      const resp = await _fetchWithTimeout(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`,
        { headers: { 'Accept': 'application/json' } }, 10000
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data.Abstract) results.push({ source: 'DuckDuckGo', icon: '🦆', confidence: 60, date: null,
          data: { abstract: data.Abstract, source: data.AbstractSource, url: data.AbstractURL, heading: data.Heading },
          links: data.AbstractURL ? [data.AbstractURL] : [], rawData: data });
        for (const topic of (data.RelatedTopics || []).slice(0, 5)) {
          if (topic.Text) results.push({ source: 'DuckDuckGo', icon: '🦆', confidence: 50, date: null,
            data: { text: topic.Text, url: topic.FirstURL || '—' },
            links: topic.FirstURL ? [topic.FirstURL] : [], rawData: topic });
        }
      }
    } catch (err) { throw new Error('DuckDuckGo: ' + err.message); }
    return results;
  };

  // ── EmailRep ──────────────────────────────────────
  _engine._queryEmailRep = async function(source, type, query) {
    const results = [];
    try {
      const headers = { 'Accept': 'application/json' };
      if (source.apiKey) headers['Key'] = source.apiKey;
      const resp = await _fetchWithTimeout(`https://emailrep.io/${encodeURIComponent(query)}`, { headers }, 10000);
      if (resp.ok) {
        const data = await resp.json();
        results.push({ source: 'EmailRep', icon: '📧', confidence: 80, date: null,
          data: { email: data.email, reputation: data.reputation, suspicious: data.suspicious, references: data.references || 0,
            malicious_activity: data.details?.malicious_activity ? 'Oui' : 'Non', credentials_leaked: data.details?.credentials_leaked ? 'Oui' : 'Non',
            profiles: (data.details?.profiles || []).join(', ') || '—', free_provider: data.details?.free_provider ? 'Oui' : 'Non' },
          links: [`https://emailrep.io/${query}`], rawData: data });
      } else if (resp.status === 401 || resp.status === 403) {
        throw new Error('Cle API requise');
      } else if (resp.status !== 404) { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('EmailRep: ' + err.message); }
    return results;
  };

  // ── Gravatar (v3 API) ────────────────────────────
  _engine._queryGravatar = async function(source, type, query) {
    const results = [];
    try {
      const hash = await _sha256(query.toLowerCase().trim());
      const resp = await _fetchWithTimeout(`https://api.gravatar.com/v3/profiles/${hash}`, { headers: { 'Accept': 'application/json' } }, 10000);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.display_name) {
          results.push({ source: 'Gravatar', icon: '👤', confidence: 85, date: null,
            data: { display_name: data.display_name || '—', username: data.username || '—', location: data.location || '—',
              bio: data.description || '—', job_title: data.job_title || '—', company: data.company || '—',
              verified_accounts: (data.verified_accounts || []).map(a => `${a.service_type}: ${a.url}`).join(', ') || '—',
              profile_url: data.profile_url || '—', avatar_url: data.avatar_url || '—' },
            links: data.profile_url ? [data.profile_url] : [`https://gravatar.com/${data.username || hash}`], rawData: data });
        }
      } else if (resp.status !== 404) { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('Gravatar: ' + err.message); }
    return results;
  };

  // ── NumVerify ─────────────────────────────────────
  _engine._queryNumVerify = async function(source, type, query) {
    const results = [];
    try {
      const clean = query.replace(/[\s\-\(\)\+]/g, '');
      if (!source.apiKey) throw new Error('Cle API NumVerify requise.');
      const resp = await _fetchWithTimeout(`https://apilayer.net/api/validate?access_key=${source.apiKey}&number=${encodeURIComponent(clean)}`, {}, 10000);
      if (resp.ok) {
        const data = await resp.json();
        if (data.valid !== undefined) results.push({ source: 'NumVerify', icon: '📞', confidence: data.valid ? 90 : 30, date: null,
          data: { number: data.number || query, valid: data.valid ? 'Oui' : 'Non', local_format: data.local_format || '—',
            international_format: data.international_format || '—', country_prefix: data.country_prefix || '—',
            country_code: data.country_code || '—', country_name: data.country_name || '—', location: data.location || '—',
            carrier: data.carrier || '—', line_type: data.line_type || '—' },
          links: [], rawData: data });
      } else { const e = await resp.json().catch(() => ({})); throw new Error(e.error?.info || `HTTP ${resp.status}`); }
    } catch (err) { throw new Error('NumVerify: ' + err.message); }
    return results;
  };

  // ── WhoisXML ──────────────────────────────────────
  _engine._queryWhoisXML = async function(source, type, query) {
    const results = [];
    try {
      const resp = await _fetchWithTimeout(`https://whoisjs.com/api/v1/${encodeURIComponent(query)}`, { headers: { 'Accept': 'application/json' } }, 12000);
      if (resp.ok) {
        const data = await resp.json();
        if (type === 'domain' && (data.registrar || data.creation)) results.push({ source: 'WhoisXML', icon: '🌐', confidence: 85, date: data.creation || null,
          data: { domain: data.domain || query, registrar: data.registrar?.name || data.registrar || '—', creation_date: data.creation || '—', expiration_date: data.expiration || '—', name_servers: (data.nameServers || []).join(', ') || '—' },
          links: [`https://who.is/whois/${query}`], rawData: data });
        if (type === 'ip' && (data.network || data.range)) results.push({ source: 'WhoisXML', icon: '🌐', confidence: 80, date: null,
          data: { ip: query, network: data.network || '—', range: data.range || '—', name: data.name || '—', country: data.country || '—' },
          links: [], rawData: data });
      } else if (resp.status !== 404) { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) {
      if (err.message?.includes('CORS') || err.message?.includes('Failed') || err.message?.includes('Timeout')) {
        try {
          const altResp = await _fetchWithTimeout(`https://whois.freeaiapi.xyz/?name=${encodeURIComponent(query)}`, {}, 8000);
          if (altResp.ok) { const d = await altResp.json();
            if (d.registrar || d.creation_date) results.push({ source: 'WhoisXML', icon: '🌐', confidence: 75, date: d.creation_date || null,
              data: { domain: query, registrar: d.registrar || '—', creation_date: d.creation_date || '—', expiration_date: d.expiration_date || '—', name_servers: (d.name_servers || []).join(', ') || '—' },
              links: [`https://who.is/whois/${query}`], rawData: d });
          }
        } catch {}
      }
      if (results.length === 0) throw new Error('WhoisXML: ' + err.message);
    }
    return results;
  };

  // ── AbuseIPDB ─────────────────────────────────────
  _engine._queryAbuseIPDB = async function(source, type, query) {
    const results = [];
    try {
      if (!source.apiKey) throw new Error('Cle API AbuseIPDB requise.');
      const resp = await _fetchWithTimeout(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(query)}&maxAgeInDays=90`,
        { headers: { 'Key': source.apiKey, 'Accept': 'application/json' } }, 10000);
      if (resp.ok) {
        const json = await resp.json(); const d = json.data;
        if (d) results.push({ source: 'AbuseIPDB', icon: '🛡️', confidence: 85, date: d.lastReportedAt || null,
          data: { ip: d.ipAddress, abuse_confidence_score: d.abuseConfidenceScore + '%', country_code: d.countryCode || '—', isp: d.isp || '—', domain: d.domain || '—', total_reports: d.totalReports || 0, num_distinct_users: d.numDistinctUsers || 0, is_public: d.isPublic ? 'Oui' : 'Non' },
          links: [`https://www.abuseipdb.com/check/${query}`], rawData: d });
      } else if (resp.status !== 404) { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('AbuseIPDB: ' + err.message); }
    return results;
  };

  // ── Reddit ────────────────────────────────────────
  _engine._queryReddit = async function(source, type, query) {
    const results = [];
    try {
      if (type === 'username' || type === 'pseudo') {
        const resp = await _fetchWithTimeout(`https://www.reddit.com/user/${encodeURIComponent(query)}/about.json`,
          { headers: { 'User-Agent': 'GoldCrewOSINT/1.0' } }, 10000);
        if (resp.ok) { const j = await resp.json(); const d = j.data;
          if (d?.name) results.push({ source: 'Reddit', icon: '🤖', confidence: 90, date: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : null,
            data: { username: d.name, link_karma: d.link_karma, comment_karma: d.comment_karma, total_karma: (d.link_karma||0)+(d.comment_karma||0), verified: d.verified?'Oui':'Non', has_verified_email: d.has_verified_email?'Oui':'Non', is_gold: d.is_gold?'Oui':'Non' },
            links: [`https://reddit.com/user/${query}`], rawData: d });
        } else if (resp.status !== 404) throw new Error(`HTTP ${resp.status}`);
      }
      if (type === 'keyword') {
        const resp = await _fetchWithTimeout(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=5&sort=relevance`,
          { headers: { 'User-Agent': 'GoldCrewOSINT/1.0' } }, 10000);
        if (resp.ok) { const j = await resp.json();
          for (const post of j.data?.children?.slice(0, 5) || []) { const d = post.data;
            results.push({ source: 'Reddit', icon: '🤖', confidence: 60, date: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : null,
              data: { title: d.title, subreddit: d.subreddit, author: d.author, score: d.score, num_comments: d.num_comments, url: d.url, selftext: (d.selftext||'').slice(0,200) },
              links: [`https://reddit.com${d.permalink}`], rawData: d });
          }
        }
      }
    } catch (err) { throw new Error('Reddit: ' + err.message); }
    return results;
  };

  // ── SecurityTrails ────────────────────────────────
  _engine._querySecurityTrails = async function(source, type, query) {
    if (!source.apiKey) throw new Error('SecurityTrails API Key requis.');
    const results = []; const h = { 'apikey': source.apiKey, 'Accept': 'application/json' };
    try {
      if (type === 'domain') {
        const resp = await _fetchWithTimeout(`https://api.securitytrails.com/v1/domain/${encodeURIComponent(query)}`, { headers: h }, 10000);
        if (resp.ok) { const d = await resp.json();
          results.push({ source: 'SecurityTrails', icon: '🛤️', confidence: 85, date: null,
            data: { hostname: d.hostname || query, alexa_rank: d.alexa_rank || '—', company: d.company || '—', subdomains_count: d.subdomains?.length || 0 },
            links: [`https://securitytrails.com/domain/${query}`], rawData: d });
        }
      }
      if (type === 'ip') {
        const resp = await _fetchWithTimeout(`https://api.securitytrails.com/v1/search/list?ip=${encodeURIComponent(query)}`, { headers: h }, 10000);
        if (resp.ok) { const d = await resp.json();
          for (const host of (d.records || []).slice(0, 5)) results.push({ source: 'SecurityTrails', icon: '🛤️', confidence: 75, date: null,
            data: { hostname: host.hostname || host.host || '—', type: host.type || '—' },
            links: [`https://securitytrails.com/domain/${host.hostname || ''}`], rawData: host });
        }
      }
    } catch (err) { throw new Error('SecurityTrails: ' + err.message); }
    return results;
  };

  // ── Clearbit ──────────────────────────────────────
  _engine._queryClearbit = async function(source, type, query) {
    if (!source.apiKey) throw new Error('Clearbit API Key requis.');
    const results = []; const h = { 'Authorization': `Bearer ${source.apiKey}` };
    try {
      if (type === 'email') {
        const resp = await _fetchWithTimeout(`https://person.clearbit.com/v2/people/find?email=${encodeURIComponent(query)}`, { headers: h }, 10000);
        if (resp.ok) { const d = await resp.json();
          results.push({ source: 'Clearbit', icon: '🏢', confidence: 85, date: null,
            data: { name: d.name?.fullName || '—', title: d.employment?.title || '—', company: d.employment?.name || '—', location: d.geo?.city || '—', bio: d.bio || '—', linkedin: d.linkedin?.handle || '—', twitter: d.twitter?.handle || '—' },
            links: d.linkedin?.handle ? [`https://linkedin.com/in/${d.linkedin.handle}`] : [], rawData: d });
        }
      }
      if (type === 'domain') {
        const resp = await _fetchWithTimeout(`https://company.clearbit.com/v2/companies/find?domain=${encodeURIComponent(query)}`, { headers: h }, 10000);
        if (resp.ok) { const d = await resp.json();
          results.push({ source: 'Clearbit', icon: '🏢', confidence: 85, date: null,
            data: { name: d.name, domain: d.domain, description: (d.description||'').slice(0,200), industry: d.category?.industry || '—', employees: d.metrics?.employees || '—' },
            links: [`https://${query}`], rawData: d });
        }
      }
    } catch (err) { throw new Error('Clearbit: ' + err.message); }
    return results;
  };

  // ── Dehashed ──────────────────────────────────────
  _engine._queryDehashed = async function(source, type, query) {
    if (!source.apiKey) throw new Error('Dehashed API Key requis.');
    const results = [];
    try {
      const resp = await _fetchWithTimeout(`https://api.dehashed.com/search?query=${encodeURIComponent(query)}`,
        { headers: { 'Authorization': 'Basic ' + btoa(source.apiKey) } }, 15000);
      if (resp.ok) { const d = await resp.json();
        for (const e of (d.entries || []).slice(0, 10)) results.push({ source: 'Dehashed', icon: '🗃️', confidence: 90, date: null,
          data: { email: e.email || '—', username: e.username || '—', password: e.password ? '••••••••' : '—', hash: e.hashed_password ? e.hashed_password.slice(0,16)+'...' : '—', ip: e.ip_address || '—', name: e.name || '—', database: e.database_name || '—' },
          links: [], rawData: e });
      } else throw new Error(`HTTP ${resp.status}`);
    } catch (err) { throw new Error('Dehashed: ' + err.message); }
    return results;
  };

  // ── IntelX ────────────────────────────────────────
  _engine._queryIntelX = async function(source, type, query) {
    if (!source.apiKey) throw new Error('IntelX API Key requis.');
    const results = [];
    try {
      const h = { 'x-key': source.apiKey, 'Content-Type': 'application/json' };
      const resp = await _fetchWithTimeout('https://2.intelx.io/intelligent/search',
        { method: 'POST', headers: h, body: JSON.stringify({ term: query, buckets: [], lookuplevel: 0, maxresults: 10, media: 0, target: 0, terminate: [] }) }, 15000);
      if (resp.ok) { const d = await resp.json();
        if (d.id) {
          const rr = await _fetchWithTimeout(`https://2.intelx.io/intelligent/search/result?id=${d.id}&limit=10`, { headers: h }, 15000);
          if (rr.ok) { const rd = await rr.json();
            for (const r of (rd.records || []).slice(0, 5)) results.push({ source: 'IntelX', icon: '🕵️', confidence: 75, date: r.added || null,
              data: { system: r.system || '—', bucket: r.bucket || '—', name: r.name || '—', type: r.type || '—' },
              links: r.media?.[0]?.link ? [r.media[0].link] : [], rawData: r });
          }
        }
      } else throw new Error(`HTTP ${resp.status}`);
    } catch (err) { throw new Error('IntelX: ' + err.message); }
    return results;
  };

  // ═════════════════════════════════════════════════════
  // NEW FREE OSINT SOURCES (v4.0)
  // ═════════════════════════════════════════════════════

  // ── crt.sh — Certificate Transparency ─────────────
  _engine._queryCrtSh = async function(source, type, query) {
    const results = [];
    try {
      const resp = await _fetchWithTimeout(`https://crt.sh/?q=${encodeURIComponent('%.' + query)}&output=json`,
        { headers: { 'Accept': 'application/json' } }, 20000);
      if (resp.ok) {
        const data = await resp.json();
        const seen = new Set(); const certs = [];
        for (const e of data) {
          const name = e.name_value?.trim();
          if (name && !seen.has(name)) { seen.add(name);
            certs.push({ subdomain: name, issuer: e.issuer_name || '—', not_before: e.not_before || null, logged_at: e.entry_timestamp || null });
          }
        }
        if (certs.length > 0) {
          results.push({ source: 'crt.sh', icon: '🔒', confidence: 90, date: certs[0].logged_at || null,
            data: { domain: query, unique_subdomains: certs.length, subdomains: certs.slice(0, 25).map(c => c.subdomain).join(', '),
              issuers: [...new Set(certs.map(c => c.issuer))].slice(0, 5).join(', '), latest_cert: certs[0].not_before || '—' },
            links: [`https://crt.sh/?q=${encodeURIComponent('%.' + query)}`], rawData: { total: certs.length, certificates: certs.slice(0, 50) } });
        }
      }
    } catch (err) { throw new Error('crt.sh: ' + err.message); }
    return results;
  };

  // ── IP-API.com — Free IP Geolocation ─────────────
  _engine._queryIpApi = async function(source, type, query) {
    const results = [];
    try {
      const resp = await _fetchWithTimeout(
        `/api/proxy/ip-api?ip=${encodeURIComponent(query)}`,
        {}, 10000);
      if (resp.ok) {
        const d = await resp.json();
        if (d.status === 'success') {
          results.push({ source: 'IP-API', icon: '🌍', confidence: 90, date: null,
            data: { ip: d.query, country: d.country || '—', country_code: d.countryCode || '—', region: d.regionName || '—',
              city: d.city || '—', zip: d.zip || '—', lat: d.lat, lon: d.lon, timezone: d.timezone || '—',
              isp: d.isp || '—', org: d.org || '—', as: d.as || '—', asname: d.asname || '—', reverse: d.reverse || '—',
              mobile: d.mobile ? 'Oui' : 'Non', proxy: d.proxy ? 'Oui' : 'Non', hosting: d.hosting ? 'Oui' : 'Non' },
            links: [`https://ip-api.com/#${d.query}`], rawData: d });
        }
      }
    } catch (err) { throw new Error('IP-API: ' + err.message); }
    return results;
  };

  // ── Wayback CDX — Detailed Snapshots ──────────────
  _engine._queryWaybackCdx = async function(source, type, query) {
    const results = [];
    try {
      const url = query.startsWith('http') ? query : `https://${query}`;
      const resp = await _fetchWithTimeout(
        `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&limit=10&output=json&fl=timestamp,statuscode,mimetype,length,digest,original`,
        {}, 15000);
      if (resp.ok) {
        const data = await resp.json();
        if (data.length > 1) {
          const snaps = [];
          for (let i = 1; i < Math.min(data.length, 11); i++) {
            const [ts, code, mime, length, digest, orig] = data[i];
            snaps.push({ timestamp: ts, date: `${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)} ${ts.slice(8,10)}:${ts.slice(10,12)}`,
              status: code, mime, length, url: `https://web.archive.org/web/${ts}/${orig}` });
          }
          results.push({ source: 'Wayback CDX', icon: '📼', confidence: 85, date: snaps[0]?.date || null,
            data: { domain: query, total_snapshots: data.length - 1, snapshots_listed: snaps.length,
              latest: snaps[0]?.date || '—', latest_status: snaps[0]?.status || '—', latest_type: snaps[0]?.mime || '—' },
            links: snaps.map(s => s.url), rawData: { snapshots: snaps } });
        }
      }
    } catch (err) { throw new Error('Wayback CDX: ' + err.message); }
    return results;
  };

  // ── IPWhois — IP Geolocation Alternative ──────────
  _engine._queryIpWhois = async function(source, type, query) {
    const results = [];
    try {
      const resp = await _fetchWithTimeout(`https://ipwho.is/${encodeURIComponent(query)}`, { headers: { 'Accept': 'application/json' } }, 10000);
      if (resp.ok) {
        const d = await resp.json();
        if (d.success !== false && d.ip) {
          results.push({ source: 'IPWhois', icon: '🗺️', confidence: 88, date: null,
            data: { ip: d.ip, type: d.type || '—', continent: d.continent || '—', country: d.country || '—', country_code: d.country_code || '—',
              region: d.region || '—', city: d.city || '—', lat: d.latitude, lon: d.longitude, postal: d.postal || '—',
              calling_code: d.calling_code || '—', isp: d.connection?.isp || '—', org: d.connection?.org || '—',
              asn: d.connection?.asn || '—', domain: d.connection?.domain || '—',
              timezone_id: d.timezone?.id || '—', timezone_utc: d.timezone?.utc || '—' },
            links: [`https://ipwho.is/${query}`], rawData: d });
        }
      }
    } catch (err) { throw new Error('IPWhois: ' + err.message); }
    return results;
  };

  // ── URLHaus — Malware URL Database ────────────────
  _engine._queryUrlHaus = async function(source, type, query) {
    const results = [];
    try {
      let endpoint, body;
      if (type === 'url') { endpoint = 'https://urlhaus-api.abuse.ch/v1/url/'; body = `url=${encodeURIComponent(query)}`; }
      else { endpoint = 'https://urlhaus-api.abuse.ch/v1/host/'; body = `host=${encodeURIComponent(query)}`; }
      const resp = await _fetchWithTimeout(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }, 12000);
      if (resp.ok) {
        const d = await resp.json();
        if (d.query_status === 'no_results' || (!d.urls && !d.url)) return results;
        const urls = d.urls || (d.url ? [d] : []);
        for (const e of urls.slice(0, 5)) {
          results.push({ source: 'URLHaus', icon: '⚠️', confidence: e.url_status === 'online' ? 95 : 75, date: e.date_added || e.firstseen || null,
            data: { url: e.url || '—', status: e.url_status || '—', threat: e.threat || '—', tags: (e.tags || []).join(', ') || '—',
              host: e.host || d.host || '—', ip_address: e.host_address || d.ip_address || '—', asn: e.asn || d.asn || '—', country: e.country || d.country || '—' },
            links: e.report_url ? [e.report_url] : [`https://urlhaus.abuse.ch/browse.php?search=${encodeURIComponent(query)}`], rawData: e });
        }
        if (d.urls_up !== undefined || d.urls_down !== undefined) {
          results.unshift({ source: 'URLHaus', icon: '⚠️', confidence: 85, date: null,
            data: { host: d.host || query, online_urls: d.urls_up || 0, offline_urls: d.urls_down || 0, total_urls: (d.urls_up||0)+(d.urls_down||0),
              blacklists: d.blacklists ? Object.entries(d.blacklists).map(([k,v])=>`${k}: ${v}`).join(', ') : '—',
              ip_address: d.ip_address || '—', asn: d.asn || '—', country: d.country || '—' },
            links: [`https://urlhaus.abuse.ch/browse.php?search=${encodeURIComponent(query)}`], rawData: d });
        }
      }
    } catch (err) { throw new Error('URLHaus: ' + err.message); }
    return results;
  };

  // ── MalwareBazaar — Hash Lookup ───────────────────
  _engine._queryMalwareBazaar = async function(source, type, query) {
    const results = [];
    try {
      const resp = await _fetchWithTimeout('https://mb-api.abuse.ch/api/v1/', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `query=get_info&hash=${encodeURIComponent(query)}`
      }, 12000);
      if (resp.ok) {
        const d = await resp.json();
        if (d.query_status === 'hash_not_found') return results;
        if (d.data) {
          const entries = Array.isArray(d.data) ? d.data : [d.data];
          for (const e of entries.slice(0, 5)) {
            results.push({ source: 'MalwareBazaar', icon: '🦠', confidence: 95, date: e.first_seen || e.last_seen || null,
              data: { sha256: e.sha256_hash || '—', sha1: e.sha1_hash || '—', md5: e.md5_hash || '—',
                file_name: e.file_name || '—', file_type: e.file_type || '—', file_size: e.file_size || '—',
                signature: e.signature || '—', tags: (e.tags || []).join(', ') || '—', delivery_method: e.delivery_method || '—',
                reporter: e.reporter || '—', origin_country: e.origin_country || '—' },
              links: [`https://bazaar.abuse.ch/browse.php?search=sha256:${e.sha256_hash}`], rawData: e });
          }
        }
      }
    } catch (err) { throw new Error('MalwareBazaar: ' + err.message); }
    return results;
  };

  // ── ThreatFox — IOC Database ──────────────────────
  _engine._queryThreatFox = async function(source, type, query) {
    const results = [];
    try {
      const resp = await _fetchWithTimeout('https://threatfox-api.abuse.ch/api/v1/', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `query=search_ioc&search_term=${encodeURIComponent(query)}`
      }, 12000);
      if (resp.ok) {
        const d = await resp.json();
        if (d.query_status === 'no_result' || !d.data) return results;
        const iocs = Array.isArray(d.data) ? d.data : [d.data];
        for (const i of iocs.slice(0, 8)) {
          results.push({ source: 'ThreatFox', icon: '🎯', confidence: 85, date: i.first_seen_utc || i.last_seen_utc || null,
            data: { ioc: i.ioc || '—', ioc_type: i.ioc_type || '—', threat_type: i.threat_type || '—',
              malware: i.malware || '—', malware_alias: i.malware_alias || '—', confidence_level: i.confidence_level || '—',
              first_seen: i.first_seen_utc || '—', last_seen: i.last_seen_utc || '—', reporter: i.reporter || '—',
              tags: (i.tags || []).join(', ') || '—', reference: i.reference || '—' },
            links: i.reference ? [i.reference] : [`https://threatfox.abuse.ch/browse.php?search=ioc:${i.ioc}`], rawData: i });
        }
      }
    } catch (err) { throw new Error('ThreatFox: ' + err.message); }
    return results;
  };

  // ── Shodan InternetDB — Free IP Intelligence ──────
  _engine._queryShodanInternetDB = async function(source, type, query) {
    const results = [];
    try {
      const resp = await _fetchWithTimeout(`https://internetdb.shodan.io/${encodeURIComponent(query)}`, { headers: { 'Accept': 'application/json' } }, 10000);
      if (resp.ok) {
        const d = await resp.json();
        if (d.ports || d.hostnames) {
          results.push({ source: 'Shodan InternetDB', icon: '📊', confidence: 90, date: null,
            data: { ip: query, ports: (d.ports || []).join(', ') || '—', ports_count: (d.ports || []).length,
              hostnames: (d.hostnames || []).join(', ') || '—', cpes: (d.cpes || []).slice(0, 10).join(', ') || '—',
              vulns: (d.vulns || []).slice(0, 15).join(', ') || '—', vulns_count: (d.vulns || []).length,
              tags: (d.tags || []).join(', ') || '—' },
            links: [`https://www.shodan.io/host/${query}`], rawData: d });
        }
      }
    } catch (err) { throw new Error('Shodan InternetDB: ' + err.message); }
    return results;
  };

  // ── WHOIS Free — Domain Registration ──────────────
  _engine._queryWhoisFree = async function(source, type, query) {
    const results = [];
    try {
      const resp = await _fetchWithTimeout(`https://whois.freeaiapi.xyz/?name=${encodeURIComponent(query)}`, { headers: { 'Accept': 'application/json' } }, 12000);
      if (resp.ok) {
        const d = await resp.json();
        if (d.registrar || d.domain_name) {
          results.push({ source: 'WHOIS Free', icon: '📋', confidence: 80, date: d.creation_date || null,
            data: { domain: d.domain_name || query, registrar: d.registrar || '—', registrant: d.registrant?.name || d.registrant_name || '—',
              registrant_country: d.registrant?.country || d.registrant_country || '—', creation_date: d.creation_date || '—',
              expiration_date: d.expiration_date || '—', updated_date: d.updated_date || '—',
              name_servers: (d.name_servers || []).join(', ') || '—', status: (d.domain_status || d.status || []).join(', ') || '—' },
            links: [`https://who.is/whois/${query}`], rawData: d });
        }
      }
    } catch (err) { throw new Error('WHOIS Free: ' + err.message); }
    return results;
  };

  // ── URLScan.io (via server proxy) ─────────────────
  _engine._queryUrlScanProxy = async function(source, type, query) {
    const results = [];
    try {
      const q = type === 'domain' ? `domain:${query}` : type === 'ip' ? `ip:${query}` : query;
      const resp = await _fetchWithTimeout(`/api/proxy/urlscan?q=${encodeURIComponent(q)}`, {}, 15000);
      if (resp.ok) {
        const d = await resp.json();
        for (const s of (d.results || []).slice(0, 5)) {
          const p = s.page || {};
          results.push({ source: 'URLScan.io', icon: '🔎', confidence: 80, date: s.task?.time || null,
            data: { url: p.url || '—', domain: p.domain || '—', ip: p.ip || '—', country: p.country || '—', server: p.server || '—',
              malicious: s.verdicts?.overall?.malicious ? 'Oui' : 'Non', screenshot: s.task?.screenshotURL || '—',
              technologies: (p.technologies || []).map(t => t.name).join(', ') || '—' },
            links: s.result ? [s.result] : [`https://urlscan.io/search/#${encodeURIComponent(q)}`], rawData: s });
        }
      }
    } catch (err) { throw new Error('URLScan.io: ' + err.message); }
    return results;
  };

  // ── NVD CVE Search (via server proxy) ─────────────
  _engine._queryNvdCve = async function(source, type, query) {
    const results = [];
    try {
      const resp = await _fetchWithTimeout(`/api/proxy/nvd?keyword=${encodeURIComponent(query)}`, {}, 20000);
      if (resp.ok) {
        const d = await resp.json();
        for (const v of (d.vulnerabilities || []).slice(0, 8)) {
          const cve = v.cve || {};
          const desc = (cve.descriptions || []).find(d => d.lang === 'en') || {};
          const m = cve.metrics?.cvssMetricV31?.[0]?.cvssData || cve.metrics?.cvssMetricV2?.[0]?.cvssData || {};
          results.push({ source: 'NVD CVE', icon: '🐛', confidence: 95, date: cve.published || null,
            data: { cve_id: cve.id || '—', description: (desc.value || '—').slice(0, 300),
              severity: m.baseSeverity || '—', cvss_score: m.baseScore || '—', attack_vector: m.attackVector || '—',
              published: cve.published ? cve.published.split('T')[0] : '—', last_modified: cve.lastModified ? cve.lastModified.split('T')[0] : '—',
              references_count: (cve.references || []).length,
              weaknesses: (cve.weaknesses || []).map(w => w.description?.map(d => d.value).join(', ')).filter(Boolean).join(', ') || '—' },
            links: cve.references?.[0]?.url ? [cve.references[0].url] : [`https://nvd.nist.gov/vuln/detail/${cve.id}`], rawData: cve });
        }
      }
    } catch (err) { throw new Error('NVD CVE: ' + err.message); }
    return results;
  };

  // ── SSL Labs — SSL/TLS Analysis ───────────────────
  _engine._querySslLabs = async function(source, type, query) {
    const results = [];
    try {
      const resp = await _fetchWithTimeout(`https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(query)}&all=done`, {}, 30000);
      if (resp.ok) {
        const d = await resp.json();
        if (d.status === 'READY' && d.endpoints) {
          for (const ep of d.endpoints.slice(0, 3)) {
            results.push({ source: 'SSL Labs', icon: '🔐', confidence: 90, date: null,
              data: { host: query, ip: ep.ipAddress || '—', grade: ep.grade || '—', has_warnings: ep.hasWarnings ? 'Oui' : 'Non',
                is_exceptional: ep.isExceptional ? 'Oui' : 'Non',
                protocols: ep.details?.protocols?.map(p => `${p.name} ${p.version}`).join(', ') || '—',
                key: ep.details?.key?.alg || '—', key_size: ep.details?.key?.size || '—',
                cert_issuer: ep.details?.cert?.issuerLabel || '—' },
              links: [`https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(query)}`], rawData: ep });
          }
        } else if (d.status === 'IN_PROGRESS') {
          results.push({ source: 'SSL Labs', icon: '🔐', confidence: 40, date: null,
            data: { host: query, status: 'Analyse en cours...', message: 'Reessayez dans quelques secondes.' },
            links: [`https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(query)}`], rawData: d });
        }
      }
    } catch (err) { throw new Error('SSL Labs: ' + err.message); }
    return results;
  };

  // ── OpenCage Geocoder ─────────────────────────────
  _engine._queryOpenCage = async function(source, type, query) {
    if (!source.apiKey) throw new Error('OpenCage API Key requise (gratuit 2500/jour sur opencagedata.com).');
    const results = [];
    try {
      const resp = await _fetchWithTimeout(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${source.apiKey}&limit=5`, {}, 12000);
      if (resp.ok) {
        const d = await resp.json();
        for (const r of (d.results || []).slice(0, 5)) {
          results.push({ source: 'OpenCage', icon: '📍', confidence: Math.min(95, Math.round((r.confidence||0)*10)), date: null,
            data: { formatted: r.formatted || '—', country: r.components?.country || '—', state: r.components?.state || '—',
              city: r.components?.city || r.components?.town || '—', postcode: r.components?.postcode || '—',
              lat: r.geometry?.lat, lon: r.geometry?.lng, timezone: r.annotations?.timezone?.name || '—',
              currency: r.annotations?.currency?.name || '—', flag: r.annotations?.flag || '—' },
            links: [`https://www.openstreetmap.org/#map=15/${r.geometry?.lat}/${r.geometry?.lng}`], rawData: r });
        }
      } else { const e = await resp.json().catch(() => ({})); throw new Error(e.status?.message || `HTTP ${resp.status}`); }
    } catch (err) { throw new Error('OpenCage: ' + err.message); }
    return results;
  };

  // ── Criminal IP (via server proxy) ────────────────
  _engine._queryCriminalIpProxy = async function(source, type, query) {
    const results = [];
    try {
      const resp = await _fetchWithTimeout(`/api/proxy/criminalip?q=${encodeURIComponent(query)}&type=${type}`, {}, 15000);
      if (resp.ok) {
        const d = await resp.json();
        if (d.status === 200 && d.data) {
          const ip = d.data;
          results.push({ source: 'Criminal IP', icon: '🚔', confidence: 85, date: null,
            data: { ip: ip.ip || query, country: ip.country || '—', city: ip.city || '—', isp: ip.isp || '—', org: ip.org || '—',
              open_ports: (ip.open_ports || []).map(p => p.port).join(', ') || '—',
              score: ip.score?.inbound?.score || '—', current_status: ip.current_status || '—' },
            links: [`https://www.criminalip.io/asset/report/${query}`], rawData: ip });
        }
      }
    } catch (err) { throw new Error('Criminal IP: ' + err.message); }
    return results;
  };

  // ── AbstractAPI Email Validation ─────────────────────
  _engine._queryAbstractEmail = async function(source, type, query) {
    if (!source.apiKey) throw new Error('AbstractAPI Email Key requise (gratuit 100/mois sur abstractapi.com).');
    const results = [];
    try {
      const resp = await _fetchWithTimeout(
        `https://emailvalidation.abstractapi.com/v1/?api_key=${source.apiKey}&email=${encodeURIComponent(query)}`,
        { headers: { 'Accept': 'application/json' } }, 10000);
      if (resp.ok) {
        const d = await resp.json();
        const deliverability = d.deliverability || 'UNKNOWN';
        results.push({ source: 'Abstract Email', icon: '📩', confidence: deliverability === 'DELIVERABLE' ? 85 : 40, date: null,
          data: { email: d.email_address || query, deliverability, is_valid_format: d.is_valid_format?.value ? 'Oui' : 'Non',
            is_free_email: d.is_free_email?.value ? 'Oui' : 'Non', is_disposable: d.is_disposable_email?.value ? 'Oui' : 'Non',
            is_smtp_valid: d.is_smtp_valid?.value ? 'Oui' : 'Non', is_catchall: d.is_catchall_email?.value ? 'Oui' : 'Non',
            mx_found: d.mx_found?.value ? 'Oui' : 'Non', quality_score: d.quality_score || '—',
            domain: d.domain || '—' },
          links: [], rawData: d });
      } else if (resp.status === 429) { throw new Error('Quota AbstractAPI epuise (100/mois gratuit).'); }
      else { throw new Error(`HTTP ${resp.status}`); }
    } catch (err) { throw new Error('Abstract Email: ' + err.message); }
    return results;
  };

  // ── WhatsApp Phone Check — via server proxy ──────────
  _engine._queryWhatsAppCheck = async function(source, type, query) {
    const results = [];
    try {
      const cleanPhone = query.replace(/[^0-9+]/g, '');
      const resp = await _fetchWithTimeout(`/api/osint/whatsapp-check?phone=${encodeURIComponent(cleanPhone)}`, {}, 12000);
      if (resp.ok) {
        const d = await resp.json();
        if (d.success) {
          const country = d.country;
          const waStatus = d.hasWhatsApp === true ? 'Oui' : d.hasWhatsApp === false ? 'Non' : 'Indéterminé';
          results.push({
            source: 'WhatsApp', icon: '📱', confidence: d.hasWhatsApp ? 95 : 70, date: null,
            data: {
              phone: d.phone || cleanPhone,
              formatted: d.formatted || cleanPhone,
              has_whatsapp: waStatus,
              country: country ? `${country.flag || ''} ${country.country}` : '—',
              country_code: country?.code || '—',
              wa_me_link: d.links?.waMe || `https://wa.me/${cleanPhone}`,
              web_whatsapp: d.links?.webWhatsApp || `https://web.whatsapp.com/send?phone=${cleanPhone}`,
            },
            links: [d.links?.waMe, d.links?.webWhatsApp].filter(Boolean),
            rawData: d,
          });
        }
      }
    } catch (err) { throw new Error('WhatsApp Check: ' + err.message); }
    return results;
  };

  // ── WhatsApp Group/Channel Search — via server proxy ──
  _engine._queryWhatsAppGroups = async function(source, type, query) {
    const results = [];
    try {
      const resp = await _fetchWithTimeout(`/api/osint/whatsapp-groups?q=${encodeURIComponent(query)}`, {}, 15000);
      if (resp.ok) {
        const d = await resp.json();
        if (d.success && d.results?.length > 0) {
          for (const item of d.results.slice(0, 10)) {
            const typeLabel = item.type === 'group' ? 'Groupe' : item.type === 'channel' ? 'Chaîne' : 'Annuaire';
            results.push({
              source: 'WhatsApp Groups', icon: '💬', confidence: 65, date: null,
              data: {
                type: typeLabel,
                title: item.title || `WhatsApp ${typeLabel}`,
                url: item.url,
                source_engine: item.source || '—',
              },
              links: [item.url],
              rawData: item,
            });
          }
        }
        // Always add direct WhatsApp search link
        results.push({
          source: 'WhatsApp Search', icon: '🔍', confidence: 50, date: null,
          data: {
            query: query,
            message: 'Recherche WhatsApp directe — ouvre une recherche dans WhatsApp',
            search_url: `https://api.whatsapp.com/send?text=${encodeURIComponent(query)}`,
          },
          links: [`https://wa.me/search/${encodeURIComponent(query)}`],
          rawData: { directSearch: true },
        });
      }
    } catch (err) { throw new Error('WhatsApp Groups: ' + err.message); }
    return results;
  };

  // ── Image Search — DuckDuckGo Images via server proxy ──
  _engine._queryImageSearch = async function(source, type, query) {
    const results = [];
    try {
      const resp = await _fetchWithTimeout(`/api/proxy/image-search?q=${encodeURIComponent(query)}`, {}, 15000);
      if (resp.ok) {
        const d = await resp.json();
        if (d.success && d.images?.length > 0) {
          for (const img of d.images.slice(0, 15)) {
            results.push({
              source: 'DuckDuckGo Images', icon: '🖼', confidence: 75, date: null,
              data: {
                title: img.title || '—',
                source: img.source || '—',
                width: img.width || '—',
                height: img.height || '—',
                image_url: img.image || '—',
                thumbnail: img.thumbnail || '—',
                page_url: img.url || '—',
              },
              links: [img.url, img.image].filter(Boolean),
              rawData: img,
              isImage: true,
            });
          }
        }
      }
    } catch (err) { throw new Error('Image Search: ' + err.message); }
    return results;
  };

  // ── People Database Search ──
  _engine._queryPeopleDB = async function(source, type, query) {
    const results = [];
    try {
      const searchType = type === 'person' ? 'all' : type;
      const resp = await _fetchWithTimeout(`/api/osint/people-search?q=${encodeURIComponent(query)}&type=${searchType}`, {}, 10000);
      if (resp.ok) {
        const d = await resp.json();
        if (d.success && d.results?.length > 0) {
          for (const p of d.results.slice(0, 10)) {
            const data = { nom: p.nom || '—' };
            if (p.telephone) data.telephone = p.telephone;
            if (p.email) data.email = p.email;
            if (p.category) data.categorie = p.category;
            if (p.info) data.informations = p.info.slice(0, 300);
            if (p.exploits) data.exploits = p.exploits.slice(0, 300);
            data.source = 'Base de données locale';
            results.push({
              source: 'People Database', icon: '👤', confidence: 95, date: p.importedAt || null,
              data,
              links: p.telephone ? [`https://wa.me/${p.telephone.replace(/[^0-9]/g, '')}`] : [],
              rawData: p,
            });
          }
        }
      }
    } catch (err) { throw new Error('People DB: ' + err.message); }
    return results;
  };

  // ── Dispatcher patch ──────────────────────────────
  const _origQuerySource = _engine.querySource;
  _engine.querySource = function(source, type, query) {
    switch (source.id) {
      case 'duckduckgo': return _engine._queryDuckDuckGo(source, type, query);
      case 'emailrep': return _engine._queryEmailRep(source, type, query);
      case 'gravatar': return _engine._queryGravatar(source, type, query);
      case 'numverify': return _engine._queryNumVerify(source, type, query);
      case 'whoisxml': return _engine._queryWhoisXML(source, type, query);
      case 'abuseipdb': return _engine._queryAbuseIPDB(source, type, query);
      case 'reddit': return _engine._queryReddit(source, type, query);
      case 'securitytrails': return _engine._querySecurityTrails(source, type, query);
      case 'clearbit': return _engine._queryClearbit(source, type, query);
      case 'dehashed': return _engine._queryDehashed(source, type, query);
      case 'intelx': return _engine._queryIntelX(source, type, query);
      // New v4.0 sources
      case 'crt_sh': return _engine._queryCrtSh(source, type, query);
      case 'ip_api': return _engine._queryIpApi(source, type, query);
      case 'wayback_cdx': return _engine._queryWaybackCdx(source, type, query);
      case 'ipwhois': return _engine._queryIpWhois(source, type, query);
      case 'urlhaus': return _engine._queryUrlHaus(source, type, query);
      case 'malwarebazaar': return _engine._queryMalwareBazaar(source, type, query);
      case 'threatfox': return _engine._queryThreatFox(source, type, query);
      case 'shodan_internetdb': return _engine._queryShodanInternetDB(source, type, query);
      case 'whois_free': return _engine._queryWhoisFree(source, type, query);
      case 'urlscan_proxy': return _engine._queryUrlScanProxy(source, type, query);
      case 'nvd_cve': return _engine._queryNvdCve(source, type, query);
      case 'ssl_labs': return _engine._querySslLabs(source, type, query);
      case 'opencage': return _engine._queryOpenCage(source, type, query);
      case 'criminalip_proxy': return _engine._queryCriminalIpProxy(source, type, query);
      case 'abstract_email': return _engine._queryAbstractEmail(source, type, query);
      case 'whatsapp_check': return _engine._queryWhatsAppCheck(source, type, query);
      case 'whatsapp_groups': return _engine._queryWhatsAppGroups(source, type, query);
      case 'image_search': return _engine._queryImageSearch(source, type, query);
      case 'people_db': return _engine._queryPeopleDB(source, type, query);
      default: return _origQuerySource(source, type, query);
    }
  };
})();
