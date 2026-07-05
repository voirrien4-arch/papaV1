// Gold_Crew — Toast Notification System
const Toast = (() => {
  function ensureContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function show(message, type = 'info', duration = 4000) {
    const container = ensureContainer();
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span style="font-size:1.1rem">${icons[type] || icons.info}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  function success(msg) { show(msg, 'success'); }
  function error(msg) { show(msg, 'error', 5000); }
  function warning(msg) { show(msg, 'warning'); }
  function info(msg) { show(msg, 'info'); }

  return { show, success, error, warning, info };
})();

window.GCToast = Toast;
