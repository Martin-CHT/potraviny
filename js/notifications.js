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
    const now = new Date();
    today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
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
        // Fallback pro mobilní service worker
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
    // Kontrola každou hodinu
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
    const list = this.getExpiringItems();
    if (list.length === 0) {
      if (App.Main) App.Main.showToast('Všechny potraviny jsou čerstvé! Žádná nekončí v příštích 7 dnech. 🟢', 'success', 3000);
      return;
    }

    // Nastavit filtr na expirující
    if (App.Items && App.Main) {
      App.Main.navigate('inventory');
      App.Items.setSort('expiration', 'asc');
      App.Main.showToast(`Zobrazeno ${list.length} potravin seřazených dle expirace.`, 'info', 3000);
    }
  },

  setupNotificationUI() {
    const btn = document.getElementById('btn-notifications');
    if (btn) {
      btn.addEventListener('click', () => this.showExpiringItemsModal());
    }
  }
};

