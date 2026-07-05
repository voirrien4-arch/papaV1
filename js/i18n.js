// Gold_Crew — Built-in i18n Module
// Loads locale catalog from locales/ and exposes miniappI18n API
const GCI18n = (() => {
  let _catalog = {};
  let _locale = 'fr';

  const SUPPORTED = {
    fr: { label: 'Français', flag: '🇫🇷' },
    en: { label: 'English', flag: '🇬🇧' },
    ht: { label: 'Kreyòl Ayisyen', flag: '🇭🇹' },
  };

  async function init() {
    // Try to load saved locale preference
    try {
      const saved = localStorage.getItem('gc_locale');
      if (saved && SUPPORTED[saved]) _locale = saved;
    } catch {}

    await _loadCatalog(_locale);
  }

  async function _loadCatalog(locale) {
    try {
      const resp = await fetch(`locales/${locale}.json`);
      if (resp.ok) {
        _catalog = await resp.json();
      } else {
        // Fallback to French if requested locale not found
        if (locale !== 'fr') {
          const fallback = await fetch('locales/fr.json');
          if (fallback.ok) _catalog = await fallback.json();
        }
      }
    } catch (e) {
      console.warn('i18n: failed to load locale catalog:', e);
    }
  }

  function t(key, values) {
    const parts = key.split('.');
    let val = _catalog;
    for (const p of parts) {
      if (val && typeof val === 'object' && p in val) {
        val = val[p];
      } else {
        return key; // fallback to key
      }
    }
    if (typeof val !== 'string') return key;
    // Replace {name} placeholders
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      }
    }
    return val;
  }

  function getContext() {
    return {
      resolvedLocale: _locale,
      dir: 'ltr',
      availableLocales: Object.keys(SUPPORTED),
      canChangeLocale: true,
    };
  }

  function getSupported() {
    return SUPPORTED;
  }

  function getLocale() {
    return _locale;
  }

  async function setLocale(code) {
    if (code === _locale) return;
    if (!SUPPORTED[code]) return;
    _locale = code;
    try { localStorage.setItem('gc_locale', code); } catch {}
    await _loadCatalog(code);
  }

  return { init, t, getContext, setLocale, getSupported, getLocale };
})();

// Expose as GCI18n for use throughout the app
window.GCI18n = GCI18n;
