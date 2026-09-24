window.App = window.App || {};

App.Waste = {
  async getStats(period = 'month') {
    const history = await App.DB.getAll('history') || [];
    
    const now = new Date();
    let cutoff = new Date();
    if (period === 'week') cutoff.setDate(now.getDate() - 7);
    else if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
    else cutoff = new Date(0);
    
    let wastedCount = 0;
    let consumedCount = 0;
    let wastedValue = 0;
    const catMap = {};
    
    for (let h of history) {
      const d = new Date(h.date);
      if (d >= cutoff) {
        if (h.action === 'wasted') {
          const qty = Number(h.quantity) || 1;
          wastedCount += qty;
          wastedValue += (Number(h.price) || 0) * qty;
          
          const it = h.itemId ? await App.DB.get('items', h.itemId) : null;
          const cat = it ? it.category : 'ostatni';
          catMap[cat] = (catMap[cat] || 0) + qty;
        } else if (h.action === 'consumed') {
          consumedCount += (Number(h.quantity) || 1);
        }
      }
    }
    
    const total = wastedCount + consumedCount;
    const percentage = total > 0 ? (wastedCount / total) * 100 : 0;
    
    const topCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => ({ category: e[0], count: e[1] }));
      
    return {
      totalCount: wastedCount,
      totalValue: wastedValue,
      percentage: percentage,
      topCategories: topCategories
    };
  },
  
  async getRecentWaste(limit = 20) {
    const history = await App.DB.getAll('history') || [];
    return history
      .filter(h => h.action === 'wasted')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  },
  
  async renderWasteReport() {
    const select = document.getElementById('waste-period-select');
    const period = select ? select.value : 'month';
    
    const stats = await this.getStats(period);
    const recent = await this.getRecentWaste(15);
    
    const countEl = document.getElementById('waste-stat-count');
    const valueEl = document.getElementById('waste-stat-value');
    const percentEl = document.getElementById('waste-stat-percent');
    const listEl = document.getElementById('waste-history-list');

    if (countEl) countEl.textContent = stats.totalCount;
    if (valueEl) valueEl.textContent = `${stats.totalValue.toFixed(0)} Kč`;
    if (percentEl) {
      percentEl.textContent = `${stats.percentage.toFixed(1)} %`;
      if (stats.percentage > 25) percentEl.style.color = 'var(--danger)';
      else if (stats.percentage > 10) percentEl.style.color = 'var(--warning)';
      else percentEl.style.color = 'var(--success)';
    }

    if (listEl) {
      if (recent.length === 0) {
        listEl.innerHTML = '<p style="text-align:center; padding:16px; color:var(--text-secondary);">Zatím jste nevyhodili žádné potraviny. Skvělá práce! 👏</p>';
      } else {
        listEl.innerHTML = recent.map(r => `
          <div class="list-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border);">
            <div>
              <strong>${r.itemName}</strong>
              <div style="font-size:0.8rem; color:var(--text-secondary);">
                ${r.quantity} ${r.unit || 'ks'} • ${new Date(r.date).toLocaleDateString('cs-CZ')}
              </div>
            </div>
            <div style="font-weight:bold; color:var(--danger);">
              ${r.price ? (r.price * r.quantity).toFixed(0) + ' Kč' : ''}
            </div>
          </div>
        `).join('');
      }
    }
  },

  showReport() {
    this.renderWasteReport();
    if (App.Main) App.Main.showModal('modal-waste-report');
  },
  
  setupWasteUI() {
    const btn = document.getElementById('btn-waste-report');
    if (btn) {
      btn.addEventListener('click', () => this.showReport());
    }

    const select = document.getElementById('waste-period-select');
    if (select) {
      select.addEventListener('change', () => this.renderWasteReport());
    }
  }
};

