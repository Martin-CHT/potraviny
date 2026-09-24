window.App = window.App || {};

App.Sync = {
  lastSyncTime: null,
  
  // Přihlášení a načtení kompletních dat domácnosti pomocí přihlašovací fráze
  async loginWithPassphrase(passphrase = null, scriptUrl = null) {
    passphrase = passphrase || (document.getElementById('input-passphrase')?.value || '').trim();
    scriptUrl = scriptUrl || (document.getElementById('input-sheets-id')?.value || '').trim();

    if (!passphrase) {
      if (App.Main) App.Main.showToast('Zadejte prosím přihlašovací frázi (např. rodina-novakovi).', 'warning', 3500);
      return;
    }

    if (!scriptUrl) {
      if (App.Main) App.Main.showToast('Zadejte URL Google Apps Script webové aplikace v poli níže.', 'warning', 3500);
      return;
    }

    if (App.Main) App.Main.showLoading();

    try {
      const url = `${scriptUrl}?action=login&passphrase=${encodeURIComponent(passphrase)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Chyba serveru (${response.status})`);
      }

      const result = await response.json();
      if (result.status === 'error') {
        throw new Error(result.message || 'Nepodařilo se ověřit přihlašovací frázi.');
      }

      // 1. Uložit přihlašovací údaje
      await App.DB.setSetting('householdPassphrase', passphrase);
      await App.DB.setSetting('googleSheetsId', scriptUrl);
      await App.DB.setSetting('input-sheets-id', scriptUrl);

      // 2. Importovat nastavení ze serveru pokud existuje
      if (result.settings && typeof result.settings === 'object') {
        for (let key in result.settings) {
          if (key !== 'householdPassphrase') {
            await App.DB.setSetting(key, result.settings[key]);
          }
        }
        if (App.Main) App.Main.applySettings(result.settings);
      }

      // 3. Importovat položky inventáře
      let importedCount = 0;
      if (Array.isArray(result.items)) {
        for (let it of result.items) {
          if (!it.id) it.id = crypto.randomUUID();
          const existing = await App.DB.get('items', it.id);
          if (existing) {
            await App.DB.put('items', { ...existing, ...it });
          } else {
            await App.DB.add('items', it);
          }
          importedCount++;
        }
      }

      // 4. Importovat historii pokud je k dispozici
      if (Array.isArray(result.history)) {
        for (let h of result.history) {
          if (!h.id) h.id = crypto.randomUUID();
          const existH = await App.DB.get('history', h.id);
          if (!existH) await App.DB.add('history', h);
        }
      }

      this.lastSyncTime = new Date();
      await App.DB.setSetting('lastSyncTime', this.lastSyncTime.toISOString());
      
      this.updatePassphraseUI();
      this.updateLastSyncUI();

      if (App.Items) {
        await App.Items.loadItems();
        App.Items.renderItems();
      }

      if (App.Main) {
        App.Main.showToast(`Úspěšně přihlášeno k domácnosti "${passphrase}" (${importedCount} položek načteno).`, 'success', 3500);
      }

    } catch (err) {
      console.error('Passphrase login error:', err);
      if (App.Main) App.Main.showToast('Chyba přihlášení k synchronizaci: ' + err.message, 'error', 4500);
    } finally {
      if (App.Main) App.Main.hideLoading();
    }
  },

  // Uložení všech dat a nastavení do Google Sheets pod danou přihlašovací frází
  async saveToPassphrase() {
    const passphrase = (document.getElementById('input-passphrase')?.value || '').trim() || await App.DB.getSetting('householdPassphrase');
    const scriptUrl = (document.getElementById('input-sheets-id')?.value || '').trim() || await App.DB.getSetting('googleSheetsId');

    if (!passphrase) {
      if (App.Main) App.Main.showToast('Zadejte prosím přihlašovací frázi domácnosti.', 'warning', 3500);
      return;
    }

    if (!scriptUrl) {
      if (App.Main) App.Main.showToast('Zadejte URL Google Apps Scriptu.', 'warning', 3500);
      return;
    }

    if (App.Main) App.Main.showLoading();

    try {
      const items = await App.DB.getAll('items') || [];
      const settings = await App.DB.getAllSettings() || {};
      const history = await App.DB.getAll('history') || [];

      // Uložit do cloudu přes POST
      const payload = {
        action: 'save',
        passphrase: passphrase,
        items: items,
        settings: settings,
        history: history.slice(-100), // Posledních 100 záznamů historie
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain pro vyhnutí se CORS preflight chybám v GAS
        body: JSON.stringify(payload)
      });

      await App.DB.setSetting('householdPassphrase', passphrase);
      await App.DB.setSetting('googleSheetsId', scriptUrl);

      this.lastSyncTime = new Date();
      await App.DB.setSetting('lastSyncTime', this.lastSyncTime.toISOString());
      
      this.updatePassphraseUI();
      this.updateLastSyncUI();

      if (App.Main) App.Main.showToast(`Data domácnosti "${passphrase}" byla uložena do Google Sheets.`, 'success', 3500);
    } catch (err) {
      console.error('Save to passphrase error:', err);
      if (App.Main) App.Main.showToast('Chyba při ukládání: ' + err.message, 'error', 4500);
    } finally {
      if (App.Main) App.Main.hideLoading();
    }
  },

  // Odpojení od přihlašovací fráze
  async disconnectPassphrase() {
    await App.DB.setSetting('householdPassphrase', '');
    const passInput = document.getElementById('input-passphrase');
    if (passInput) passInput.value = '';
    this.updatePassphraseUI();
    if (App.Main) App.Main.showToast('Odpojeno od domácnosti.', 'info', 2500);
  },

  // Starší / přímá synchronizace přes REST API
  async syncToSheets() {
    return this.saveToPassphrase();
  },
  
  async syncFromSheets() {
    return this.loginWithPassphrase();
  },
  
  formatForSheets(items) {
    const headers = ['ID', 'Název', 'Kategorie', 'Umístění', 'Množství', 'Jednotka', 'Cena (Kč)', 'Čárový kód', 'Expirace', 'Přidáno'];
    const rows = items.map(it => {
      const expStr = it.expirations && it.expirations.length > 0 
        ? it.expirations.map(e => `${e.date} (${e.type === 'minimalni_trvanlivost' ? 'MT' : 'SD'})`).join('; ')
        : '';
      return [
        it.id,
        it.name,
        it.category,
        it.location,
        it.quantity,
        it.unit,
        it.price || '',
        it.barcode || '',
        expStr,
        it.addedDate || ''
      ];
    });
    return [headers, ...rows];
  },
  
  parseFromSheets(data) {
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const expirations = [];
      if (row[8]) {
        const expParts = row[8].split(';');
        expParts.forEach(ep => {
          const m = ep.trim().match(/^([\d-]+)/);
          if (m) {
            expirations.push({
              id: crypto.randomUUID(),
              date: m[1],
              type: ep.includes('MT') ? 'minimalni_trvanlivost' : 'spotrebujte_do',
              quantity: 1,
              aiPredicted: false
            });
          }
        });
      }

      return {
        id: row[0] || crypto.randomUUID(),
        name: row[1] || 'Neznámý produkt',
        category: row[2] || 'ostatni',
        location: row[3] || 'spiz',
        quantity: parseFloat(row[4]) || 1,
        unit: row[5] || 'ks',
        price: parseFloat(row[6]) || null,
        barcode: row[7] || '',
        expirations: expirations,
        addedDate: row[9] || new Date().toISOString()
      };
    });
  },

  async updateLastSyncUI() {
    const el = document.getElementById('last-sync-time');
    if (!el) return;
    const time = await App.DB.getSetting('lastSyncTime');
    if (time) {
      el.textContent = `Poslední synchronizace: ${new Date(time).toLocaleString('cs-CZ')}`;
    }
  },

  async updatePassphraseUI() {
    const badge = document.getElementById('passphrase-status-badge');
    const disconnectBtn = document.getElementById('btn-passphrase-disconnect');
    const passInput = document.getElementById('input-passphrase');
    const sheetsInput = document.getElementById('input-sheets-id');

    const phrase = await App.DB.getSetting('householdPassphrase');
    const scriptUrl = await App.DB.getSetting('googleSheetsId');

    if (passInput && phrase && !passInput.value) passInput.value = phrase;
    if (sheetsInput && scriptUrl && !sheetsInput.value) sheetsInput.value = scriptUrl;

    if (badge) {
      if (phrase) {
        badge.innerHTML = `🟢 <strong>Připojeno k domácnosti:</strong> <code style="background:var(--surface); padding:2px 6px; border-radius:4px;">${phrase}</code>`;
        if (disconnectBtn) disconnectBtn.classList.remove('hidden');
      } else {
        badge.innerHTML = `⚪ Nepřipojeno k žádné domácnosti`;
        if (disconnectBtn) disconnectBtn.classList.add('hidden');
      }
    }
  },
  
  setupSyncUI() {
    const btnLogin = document.getElementById('btn-passphrase-login');
    const btnSave = document.getElementById('btn-passphrase-save');
    const btnDisconnect = document.getElementById('btn-passphrase-disconnect');
    
    if (btnLogin) btnLogin.addEventListener('click', () => this.loginWithPassphrase());
    if (btnSave) btnSave.addEventListener('click', () => this.saveToPassphrase());
    if (btnDisconnect) btnDisconnect.addEventListener('click', () => this.disconnectPassphrase());

    const btnUpload = document.getElementById('btn-sync-upload');
    const btnDownload = document.getElementById('btn-sync-download');
    if (btnUpload) btnUpload.addEventListener('click', () => this.saveToPassphrase());
    if (btnDownload) btnDownload.addEventListener('click', () => this.loginWithPassphrase());

    this.updatePassphraseUI();
    this.updateLastSyncUI();
  }
};

