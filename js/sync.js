window.App = window.App || {};

App.Sync = {
  lastSyncTime: null,
  
  async syncToSheets() {
    const sheetsId = await App.DB.getSetting('googleSheetsId') || await App.DB.getSetting('input-sheets-id');
    const apiKey = await App.DB.getSetting('googleSheetsApiKey') || await App.DB.getSetting('input-sheets-api-key');
    
    if (!sheetsId) {
      if (App.Main) App.Main.showToast('Vyplňte prosím Google Sheets ID v Nastavení.', 'warning', 3500);
      return;
    }
    
    if (App.Main) App.Main.showLoading();
    
    try {
      const items = await App.DB.getAll('items') || [];
      const data = this.formatForSheets(items);
      
      // Pokud je ID URL skriptu (Google Apps Script Web App)
      if (sheetsId.startsWith('https://script.google.com')) {
        const response = await fetch(sheetsId, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upload', items: items })
        });
      } else {
        // Google Sheets API v4
        if (!apiKey) {
          throw new Error('Pro Google Sheets API zadejte i API Key.');
        }
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/Potraviny!A1?valueInputOption=USER_ENTERED&key=${apiKey}`;
        const response = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: data })
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Chyba při zápisu. Zkontrolujte oprávnění tabulky.');
        }
      }
      
      this.lastSyncTime = new Date();
      await App.DB.setSetting('lastSyncTime', this.lastSyncTime.toISOString());
      this.updateLastSyncUI();
      
      if (App.Main) App.Main.showToast('Zásoby byly úspěšně synchronizovány do Google Sheets.', 'success', 3000);
    } catch (e) {
      console.error('Sheets sync error:', e);
      if (App.Main) App.Main.showToast('Synchronizace selhala: ' + e.message, 'error', 4000);
    } finally {
      if (App.Main) App.Main.hideLoading();
    }
  },
  
  async syncFromSheets() {
    const sheetsId = await App.DB.getSetting('googleSheetsId') || await App.DB.getSetting('input-sheets-id');
    const apiKey = await App.DB.getSetting('googleSheetsApiKey') || await App.DB.getSetting('input-sheets-api-key');
    
    if (!sheetsId) {
      if (App.Main) App.Main.showToast('Vyplňte prosím Google Sheets ID v Nastavení.', 'warning', 3500);
      return;
    }
    
    if (App.Main) App.Main.showLoading();
    
    try {
      let items = [];

      if (sheetsId.startsWith('https://script.google.com')) {
        const response = await fetch(`${sheetsId}?action=download`);
        const json = await response.json();
        items = json.items || [];
      } else {
        if (!apiKey) throw new Error('Pro stažení přes Google API je vyžadován API klíč.');
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/Potraviny!A1:Z1000?key=${apiKey}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Chyba při čtení tabulky.');
        }
        
        const json = await response.json();
        if (!json.values || json.values.length < 2) throw new Error('Tabulka neobsahuje žádné řádky s daty.');
        
        items = this.parseFromSheets(json.values);
      }
      
      let importedCount = 0;
      for (let it of items) {
        const existing = await App.DB.get('items', it.id);
        if (existing) {
          await App.DB.put('items', { ...existing, ...it });
        } else {
          await App.DB.add('items', it);
        }
        importedCount++;
      }
      
      this.lastSyncTime = new Date();
      await App.DB.setSetting('lastSyncTime', this.lastSyncTime.toISOString());
      this.updateLastSyncUI();
      
      if (App.Items) {
        await App.Items.loadItems();
        App.Items.renderItems();
      }
      if (App.Main) App.Main.showToast(`Načteno ${importedCount} položek z Google Sheets.`, 'success', 3000);
      
    } catch (e) {
      console.error('Sheets download error:', e);
      if (App.Main) App.Main.showToast('Chyba načítání: ' + e.message, 'error', 4000);
    } finally {
      if (App.Main) App.Main.hideLoading();
    }
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
  
  setupSyncUI() {
    const btnUpload = document.getElementById('btn-sync-upload');
    const btnDownload = document.getElementById('btn-sync-download');
    if (btnUpload) btnUpload.addEventListener('click', () => this.syncToSheets());
    if (btnDownload) btnDownload.addEventListener('click', () => this.syncFromSheets());
    this.updateLastSyncUI();
  }
};

