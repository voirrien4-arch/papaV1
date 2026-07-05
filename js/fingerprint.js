// Gold_Crew — Browser Fingerprint & IP Detection
// Generates a unique device fingerprint to prevent duplicate accounts
const Fingerprint = (() => {
  let _fingerprint = null;
  let _ip = null;

  // ── Canvas Fingerprint ────────────────────────────────
  function getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 280;
      canvas.height = 60;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';

      // Draw complex shapes for uniqueness
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Gold_Crew OSINT 🛡️', 2, 15);
      ctx.fillStyle = 'rgba(102,204,0,0.7)';
      ctx.fillText('Fingerprint v2', 4, 35);

      // Draw geometric shapes
      ctx.beginPath();
      ctx.arc(200, 30, 15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,0,200,0.5)';
      ctx.fill();

      return canvas.toDataURL();
    } catch { return 'canvas-error'; }
  }

  // ── WebGL Fingerprint ─────────────────────────────────
  function getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      const version = gl.getParameter(gl.VERSION);
      const shadingLang = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const maxViewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS);

      return `${vendor}~${renderer}~${version}~${shadingLang}~${maxTextureSize}~${maxViewport}`;
    } catch { return 'webgl-error'; }
  }

  // ── Audio Fingerprint ─────────────────────────────────
  async function getAudioFingerprint() {
    try {
      const ac = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
      const osc = ac.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(10000, ac.currentTime);

      const compressor = ac.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-50, ac.currentTime);
      compressor.knee.setValueAtTime(40, ac.currentTime);
      compressor.ratio.setValueAtTime(12, ac.currentTime);
      compressor.attack.setValueAtTime(0, ac.currentTime);
      compressor.release.setValueAtTime(0.25, ac.currentTime);

      osc.connect(compressor);
      compressor.connect(ac.destination);
      osc.start(0);

      const buffer = await ac.startRendering();
      const data = buffer.getChannelData(0);
      // Get a small sample for hashing
      let sum = 0;
      for (let i = 4500; i < 5000; i++) {
        sum += Math.abs(data[i]);
      }
      return sum.toFixed(6);
    } catch { return 'audio-error'; }
  }

  // ── Screen & Hardware Properties ──────────────────────
  function getScreenInfo() {
    return [
      screen.width, screen.height, screen.availWidth, screen.availHeight,
      screen.colorDepth, screen.pixelDepth,
      window.innerWidth, window.innerHeight,
      window.devicePixelRatio,
      navigator.hardwareConcurrency || 0,
      navigator.deviceMemory || 0,
      navigator.maxTouchPoints || 0,
      navigator.platform || 'unknown',
    ].join('~');
  }

  // ── Navigator Properties ──────────────────────────────
  function getNavigatorInfo() {
    const nav = navigator;
    return [
      nav.language || '',
      nav.languages ? nav.languages.join(',') : '',
      nav.userAgent,
      nav.cookieEnabled ? 1 : 0,
      nav.doNotTrack || 'unspecified',
      typeof nav.connection !== 'undefined' ? (nav.connection.effectiveType || '') : '',
    ].join('~');
  }

  // ── Timezone ──────────────────────────────────────────
  function getTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone + '~' + new Date().getTimezoneOffset();
    } catch { return 'tz-error'; }
  }

  // ── Font Detection ────────────────────────────────────
  function detectFonts() {
    const testFonts = [
      'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
      'Palatino', 'Garamond', 'Comic Sans MS', 'Impact', 'Lucida Console',
      'Tahoma', 'Trebuchet MS', 'Century Gothic', 'Futura', 'Helvetica',
    ];
    const span = document.createElement('span');
    span.style.position = 'absolute';
    span.style.left = '-9999px';
    span.style.fontSize = '72px';
    span.textContent = 'mmmmmmmmmmlli';
    document.body.appendChild(span);

    const defaultWidth = {};
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    baseFonts.forEach(base => {
      span.style.fontFamily = base;
      defaultWidth[base] = span.offsetWidth;
    });

    const detected = [];
    testFonts.forEach(font => {
      for (const base of baseFonts) {
        span.style.fontFamily = `'${font}', ${base}`;
        if (span.offsetWidth !== defaultWidth[base]) {
          detected.push(font);
          break;
        }
      }
    });

    document.body.removeChild(span);
    return detected.join(',');
  }

  // ── Hash String ───────────────────────────────────────
  async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ── Collect All & Generate Fingerprint ────────────────
  async function generate() {
    if (_fingerprint) return _fingerprint;

    const canvas = getCanvasFingerprint();
    const webgl = getWebGLFingerprint();
    const audio = await getAudioFingerprint();
    const screen = getScreenInfo();
    const nav = getNavigatorInfo();
    const tz = getTimezone();
    const fonts = detectFonts();

    const raw = [canvas, webgl, audio, screen, nav, tz, fonts].join('|||');
    _fingerprint = await hashString(raw);
    return _fingerprint;
  }

  // ── Get IP Address ────────────────────────────────────
  async function getIP() {
    if (_ip) return _ip;
    const apis = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://ipinfo.io/json',
    ];
    for (const api of apis) {
      try {
        const resp = await fetch(api, { signal: AbortSignal.timeout(4000) });
        if (!resp.ok) continue;
        const data = await resp.json();
        _ip = data.ip || data.IP || null;
        if (_ip) return _ip;
      } catch { continue; }
    }
    return 'unknown';
  }

  // ── Get Device Info (Human-Readable) ──────────────────
  function getDeviceInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';

    if (/Firefox\//.test(ua)) browser = 'Firefox';
    else if (/Edg\//.test(ua)) browser = 'Edge';
    else if (/Chrome\//.test(ua)) browser = 'Chrome';
    else if (/Safari\//.test(ua)) browser = 'Safari';
    else if (/OPR\//.test(ua)) browser = 'Opera';

    if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
    else if (/Windows NT 6/.test(ua)) os = 'Windows 7/8';
    else if (/Mac OS X/.test(ua)) os = 'macOS';
    else if (/Linux/.test(ua)) os = 'Linux';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/iPhone|iPad/.test(ua)) os = 'iOS';

    return {
      browser,
      os,
      screen: `${screen.width}x${screen.height}`,
      cores: navigator.hardwareConcurrency || '?',
      language: navigator.language || '?',
      touch: navigator.maxTouchPoints > 0,
      platform: navigator.platform || '?',
    };
  }

  return { generate, getIP, getDeviceInfo };
})();

window.GCFingerprint = Fingerprint;
