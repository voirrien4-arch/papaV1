// Gold_Crew — Stats Sub-View
const StatsSubView = (() => {
  const t = (k) => window.GCI18n?.t(k) ?? k;

  function render(container) {
    const history = GCState.get().searchHistory || [];
    const now = new Date();
    const today = history.filter(h => new Date(h.date).toDateString() === now.toDateString());
    const weekAgo = new Date(now - 7 * 86400000);
    const week = history.filter(h => new Date(h.date) >= weekAgo);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const month = history.filter(h => new Date(h.date) >= monthStart);
    const promoUsed = Object.values(GCState.get().promoUsed || {}).flat().length;

    // Build weekly chart data
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const chartData = days.map((day, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return history.filter(h => new Date(h.date).toDateString() === d.toDateString()).length;
    });
    const maxVal = Math.max(...chartData, 1);

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        <h2 class="text-xl font-bold animate-fade-up" style="color:var(--text-primary)">${t('stats.title')}</h2>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          ${statCard(history.length, t('stats.total_searches'), '🔍', 'gold')}
          ${statCard(today.length, t('stats.searches_today'), '📅', 'info')}
          ${statCard(week.length, t('stats.searches_week'), '📆', 'success')}
          ${statCard(month.length, t('stats.searches_month'), '📊', 'warning')}
        </div>

        <!-- Chart -->
        <div class="glass-card p-6 animate-fade-up animate-delay-2">
          <h3 class="font-bold mb-4" style="color:var(--text-primary)">${t('stats.chart_title')}</h3>
          <div class="flex items-end justify-between gap-2" style="height:200px">
            ${chartData.map((val, i) => {
              const pct = (val / maxVal) * 100;
              return `
                <div class="flex-1 flex flex-col items-center gap-2">
                  <span class="text-xs font-bold" style="color:var(--gold);opacity:${val > 0 ? 1 : 0.3}">${val}</span>
                  <div class="w-full rounded-t-lg transition-all duration-700" style="height:${Math.max(pct, 4)}%;background:linear-gradient(to top, var(--gold-dark), var(--gold));min-height:4px;animation-delay:${i * 0.1}s"></div>
                  <span class="text-xs" style="color:var(--text-muted)">${days[i]}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function statCard(value, label, icon, color) {
    const colors = { gold: 'var(--gold)', info: 'var(--info)', success: 'var(--success)', warning: 'var(--warning)' };
    const bgColors = { gold: 'rgba(212,175,55,0.12)', info: 'rgba(59,130,246,0.12)', success: 'rgba(34,197,94,0.12)', warning: 'rgba(245,158,11,0.12)' };
    return `
      <div class="stat-card animate-fade-up">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:${bgColors[color]}">
            <span style="font-size:1.3rem">${icon}</span>
          </div>
          <div>
            <div class="text-2xl font-bold" style="color:${colors[color]}">${value}</div>
            <div class="text-xs" style="color:var(--text-muted)">${label}</div>
          </div>
        </div>
      </div>
    `;
  }

  return { render };
})();

window.GCStatsSubView = StatsSubView;
