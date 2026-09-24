window.App = window.App || {};

App.Notifications = {
  async init() {
    const enabled = await App.DB.getSetting('pushNotificationsEnabled') || await App.DB.getSetting('setting-notifications');
    if (enabled) {
      this.scheduleCheck();
    }
    this.updateNotificationBadge();
    this.setupNotificationUI();
  },
  
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Prohlížeč nepodporuje notifikace.');
      return false;
    }
    
    let permission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
    }
    
    const isGranted = permission === 'granted';
    await App.DB.setSetting('pushNotificationsEnabled', isGranted);
    await App.DB.setSetting('setting-notifications', isGranted);
    
    if (isGranted) {
      this.scheduleCheck();
      this.sendNotification('Potraviny — Upozornění aktivována', 'Budeme vás včas varovat před expirací potravin.');
    }
    
    return isGranted;
  },
  
  async checkExpirations() {
    if (!App.Items || !App.Items.items) return;
    
    const warningDays = (await App.DB.getSetting('expirationWarningDays')) || (await App.DB.getSetting('setting-exp-days')) || 3;
    let expiringCount = 0;
    const criticalItems = [];
    
    App.Items.items.forEach(item => {
      if (!item.expirations || item.expirations.length === 0) return;
      const status = App.Items.getExpirationStatus(item);
      
      if (status.daysLeft <= warningDays) {
        expiringCount++;
        if (status.daysLeft <= 1) {
          criticalItems.push({ item, status });
        }
      }
    });
    
    this.updateNotificationBadge();

    // Pokud jsou kritické položky, poslat push notifikaci
    if (criticalItems.length > 0) {
      const names = criticalItems.map(c => c.item.name).slice(0, 3).join(', ');
      const title = criticalItems.length === 1 ? '⚠️ Blíží se konec spotřeby!' : `⚠️ ${criticalItems.length} potraviny brzy expirují!`;
      const body = `Zkontrolujte: ${names}${criticalItems.length > 3 ? ' a další' : ''}`;
      this.sendNotification(title, body, 'critical-exp');
    }
  },
  
  sendNotification(title, body, tag = 'potraviny-alert') {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: './icons/icon-512.svg',
          badge: './icons/icon-512.svg',
          tag: tag
        });
      } catch (e) {
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, {
              body: body,
              icon: './icons/icon-512.svg',
              tag: tag
            });
          });
        }
      }
    } else if (App.Main) {
      App.Main.showToast(`${title}: ${body}`, 'warning', 4000);
    }
  },
  
  updateNotificationBadge() {
    if (!App.Items) return;
    const count = App.Items.getExpiringItemsCount ? App.Items.getExpiringItemsCount(3) : 0;
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },
  
  scheduleCheck() {
    setInterval(() => {
      this.checkExpirations();
    }, 60 * 60 * 1000);
  },
  
  getExpiringItems() {
    if (!App.Items || !App.Items.items) return [];
    
    const expItems = [];
    App.Items.items.forEach(item => {
      if (!item.expirations || item.expirations.length === 0) return;
      const status = App.Items.getExpirationStatus(item);
      if (status.daysLeft <= 7) {
        expItems.push({ item, status });
      }
    });
    
    expItems.sort((a, b) => a.status.daysLeft - b.status.daysLeft);
    return expItems;
  },
  
  showExpiringItemsModal() {
    const modal = document.getElementById('modal-notifications');
    const container = document.getElementById('notifications-list-container');
    if (!modal || !container) {
      // Fallback
      if (App.Items && App.Main) {
        App.Main.navigate('inventory');
        App.Items.setSort('expiration', 'asc');
      }
      return;
    }

    const list = this.getExpiringItems();
    const shoppingPending = App.Shopping ? App.Shopping.items.filter(i => !i.checked).length : 0;

    if (list.length === 0 && shoppingPending === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 24px 0;">
          <div style="font-size:3rem; margin-bottom:8px;">🟢</div>
          <h3>Vše je v pořádku!</h3>
          <p class="text-muted">Žádným potravinám nekončí expirace v příštích 7 dnech a nákupní seznam je prázdný.</p>
        </div>
      `;
    } else {
      const expiringNames = list.map(i => i.item.name).slice(0, 3).join(' ');

      container.innerHTML = `
        ${list.length > 0 ? `
          <div class="notif-section mb-3">
            <h4 style="color:var(--danger); display:flex; align-items:center; gap:6px;">⚠️ Expirující potraviny (${list.length})</h4>
            <div class="notif-items-list mt-2">
              ${list.map(({ item, status }) => {
                const emoji = App.Items.getCategoryEmoji(item.category);
                return `
                  <div class="notif-item-row" style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border);">
                    <div style="cursor:pointer;" onclick="App.Main.hideModal('modal-notifications'); App.Items.openDetailModal('${item.id}')">
                      <strong>${emoji} ${item.name}</strong>
                      <div class="text-small text-muted">${status.text} • ${item.quantity} ${item.unit}</div>
                    </div>
                    <div style="display:flex; gap:6px;">
                      <button type="button" class="btn-quick-consume" onclick="App.Items.quickConsume('${item.id}', 1); App.Notifications.showExpiringItemsModal();" title="Spotřebovat 1 ks">
                        ⚡ Spotřebovat
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            ${expiringNames ? `
              <button type="button" class="btn-secondary btn-block btn-small mt-2" onclick="App.Main.hideModal('modal-notifications'); App.Main.navigate('recipes'); App.Recipes.openReceptySearch('${expiringNames.replace(/'/g, "\\'")}');">
                🍳 Vyhledat recepty z expirujících potravin
              </button>
            ` : ''}
          </div>
        ` : ''}

        ${shoppingPending > 0 ? `
          <div class="notif-section mt-3 pt-2" style="border-top: 1px solid var(--border);">
            <h4 style="color:var(--primary); display:flex; align-items:center; gap:6px;">🛒 Nákupní seznam (${shoppingPending})</h4>
            <p class="text-small text-muted">Máte ${shoppingPending} položek k nakoupení.</p>
            <button type="button" class="btn-primary btn-block btn-small mt-2" onclick="App.Main.hideModal('modal-notifications'); App.Main.navigate('shopping');">
              Přejít do nákupního seznamu
            </button>
          </div>
        ` : ''}
      `;
    }

    if (App.Main) App.Main.showModal('modal-notifications');
  },

  setupNotificationUI() {
    const btn = document.getElementById('btn-notifications');
    if (btn) {
      btn.addEventListener('click', () => this.showExpiringItemsModal());
    }
  }
};
