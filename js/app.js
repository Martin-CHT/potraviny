window.App = window.App || {};

App.Main = {
  async init() {
    try {
      await App.DB.init();
      
      const settings = await App.DB.getAllSettings();
      this.applySettings(settings);
      
      if (App.Items && typeof App.Items.loadItems === 'function') {
        await App.Items.loadItems();
        App.Items.renderItems();
        App.Items.setupCategoryTabs();
        App.Items.setupLocationFilters();
        App.Items.setupSortModal();
        App.Items.setupViewModeToggle();
        if (typeof App.Items.setupBulkActionsUI === 'function') {
          App.Items.setupBulkActionsUI();
        }
      }

      if (App.Shopping && typeof App.Shopping.setupShoppingUI === 'function') {
        App.Shopping.setupShoppingUI();
        await App.Shopping.loadItems();
      }

      if (App.Zones && typeof App.Zones.setupZonesUI === 'function') {
        App.Zones.setupZonesUI();
      }

      if (App.Scanner && typeof App.Scanner.setupScannerUI === 'function') {
        App.Scanner.setupScannerUI();
      }

      if (App.Voice && typeof App.Voice.init === 'function') {
        App.Voice.init();
      }

      if (App.Recipes && typeof App.Recipes.setupRecipeUI === 'function') {
        App.Recipes.setupRecipeUI();
      }

      if (App.Unpack && typeof App.Unpack.setupUnpackModal === 'function') {
        App.Unpack.setupUnpackModal();
      }

      if (App.Waste && typeof App.Waste.setupWasteUI === 'function') {
        App.Waste.setupWasteUI();
      }

      if (App.Sync && typeof App.Sync.setupSyncUI === 'function') {
        App.Sync.setupSyncUI();
      }

      if (App.Prices && typeof App.Prices.setupPriceUI === 'function') {
        App.Prices.setupPriceUI();
      }

      if (App.Notifications && typeof App.Notifications.init === 'function') {
        await App.Notifications.init();
      }

      this.setupNavigation();
      this.setupSearch();
      this.setupFAB();
      this.setupModals();
      this.setupItemForm();
      this.setupSettings();
      this.setupConsumeModal();
      this.registerServiceWorker();

      // Listen for items updates
      window.addEventListener('app:items-updated', () => {
        if (App.Notifications) App.Notifications.updateNotificationBadge();
      });

      // Zkontrolovat URL parametry pro automatické přihlášení k synchronizaci (?sync=fráze&url=...)
      try {
        const urlParams = new URLSearchParams(window.location.search || window.location.hash.replace(/^#/, '?'));
        const syncPass = urlParams.get('sync') || urlParams.get('passphrase');
        const syncUrl = urlParams.get('url') || urlParams.get('script');
        if (syncPass && App.Sync) {
          setTimeout(() => {
            App.Sync.loginWithPassphrase(syncPass, syncUrl);
          }, 400);
        }
      } catch (e) {}

    } catch (error) {
      console.error("Initialization error: ", error);
      this.showToast('Chyba při načítání aplikace: ' + error.message, 'error');
    }
  },
  
  navigate(viewId) {
    document.querySelectorAll('[id^="view-"]').forEach(el => {
      el.classList.add('hidden');
      el.classList.remove('active');
    });
    
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) {
      targetView.classList.remove('hidden');
      targetView.classList.add('active');
    }
    
    document.querySelectorAll('.bottom-nav-item, .desktop-nav-item').forEach(el => {
      el.classList.remove('active');
    });
    document.querySelectorAll(`[data-view="${viewId}"]`).forEach(el => {
      el.classList.add('active');
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewId === 'scanner' && App.Scanner && typeof App.Scanner.init === 'function') {
      App.Scanner.init();
    } else if (App.Scanner && typeof App.Scanner.stop === 'function') {
      App.Scanner.stop();
    }

    if (viewId === 'recipes' && App.Recipes && typeof App.Recipes.searchFromStock === 'function') {
      App.Recipes.searchFromStock();
    }

    if (viewId === 'shopping' && App.Shopping && typeof App.Shopping.loadItems === 'function') {
      App.Shopping.loadItems();
    }
  },
  
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('active');
    }
  },
  
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.classList.add('hidden');
      }, 200);
    }
  },
  
  hideAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('active');
      modal.classList.add('hidden');
    });
  },
  
  showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
  },
  
  showLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.classList.remove('hidden');
  },

  hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.classList.add('hidden');
  },
  
  toggleFabMenu() {
    const menu = document.getElementById('fab-menu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  },
  
  setupNavigation() {
    document.querySelectorAll('.bottom-nav-item, .desktop-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        if (view) this.navigate(view);
      });
    });
    
    // Initial view
    this.navigate('inventory');
  },

  setupSearch() {
    const searchInput = document.getElementById('search-input');
    let timeout = null;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (App.Items) App.Items.setFilter('search', e.target.value);
        }, 250);
      });
    }
  },

  setupFAB() {
    const mainFab = document.getElementById('main-fab');
    if (mainFab) {
      mainFab.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFabMenu();
      });
    }

    document.addEventListener('click', (e) => {
      const menu = document.getElementById('fab-menu');
      if (menu && !menu.classList.contains('hidden') && !e.target.closest('#fab-container')) {
        menu.classList.add('hidden');
      }
    });

    const fabAddManual = document.getElementById('fab-add-manual');
    if (fabAddManual) {
      fabAddManual.addEventListener('click', () => {
        this.toggleFabMenu();
        const title = document.getElementById('modal-add-item-title');
        if (title) title.textContent = 'Přidat potravinu';
        document.getElementById('form-add-item').reset();
        document.getElementById('item-id').value = '';
        if (document.getElementById('item-category')) delete document.getElementById('item-category').dataset.userModified;
        if (document.getElementById('item-location')) delete document.getElementById('item-location').dataset.userModified;
        ['input-nut-energy', 'input-nut-fat', 'input-nut-carbs', 'input-nut-protein', 'input-nut-fiber', 'input-nut-salt'].forEach(id => {
          if (document.getElementById(id)) delete document.getElementById(id).dataset.autofilled;
        });
        this.renderExpirationRows([]);
        this.showModal('modal-add-item');
      });
    }

    const fabScanBarcode = document.getElementById('fab-scan-barcode');
    if (fabScanBarcode) {
      fabScanBarcode.addEventListener('click', () => {
        this.toggleFabMenu();
        this.navigate('scanner');
      });
    }

    const fabVoiceInput = document.getElementById('fab-voice-input');
    if (fabVoiceInput) {
      fabVoiceInput.addEventListener('click', () => {
        this.toggleFabMenu();
        this.showModal('modal-voice-input');
        if (App.Voice) App.Voice.startListening();
      });
    }

    const fabUnpack = document.getElementById('fab-unpack');
    if (fabUnpack) {
      fabUnpack.addEventListener('click', () => {
        this.toggleFabMenu();
        if (App.Unpack) App.Unpack.renderTempList();
        this.showModal('modal-unpack');
      });
    }

    const fabScanReceipt = document.getElementById('fab-scan-receipt');
    if (fabScanReceipt) {
      fabScanReceipt.addEventListener('click', () => {
        this.toggleFabMenu();
        this.navigate('scanner');
        // Přepnout na záložku účtenky
        const receiptTab = document.querySelector('.scanner-tab[data-target="receipt"]');
        if (receiptTab) receiptTab.click();
      });
    }
  },

  setupModals() {
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
      el.addEventListener('click', (e) => {
        const modal = el.closest('.modal');
        if (modal) this.hideModal(modal.id);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideAllModals();
      }
    });
  },

  setupItemForm() {
    const form = document.getElementById('form-add-item');
    const saveBtn = document.getElementById('btn-save-item');
    const addExpBtn = document.getElementById('btn-add-expiration');
    const nameInput = document.getElementById('item-name');
    const catSelect = document.getElementById('item-category');
    const locSelect = document.getElementById('item-location');

    const autoFillNutrition = () => {
      const name = nameInput ? nameInput.value.trim() : '';
      const cat = catSelect ? catSelect.value : 'ostatni';
      if (!name) return;

      const nut = App.AI ? App.AI.predictNutrition(name, cat) : null;
      if (nut) {
        const setIfEmpty = (id, val) => {
          const el = document.getElementById(id);
          if (el && (!el.value || el.dataset.autofilled === 'true')) {
            el.value = val !== undefined && val !== null ? val : '';
            el.dataset.autofilled = 'true';
          }
        };
        setIfEmpty('input-nut-energy', nut.energy);
        setIfEmpty('input-nut-fat', nut.fat);
        setIfEmpty('input-nut-carbs', nut.carbs);
        setIfEmpty('input-nut-protein', nut.protein);
        setIfEmpty('input-nut-fiber', nut.fiber);
        setIfEmpty('input-nut-salt', nut.salt);
      }
    };

    // Listeners for manual input on nutrition fields to remove autofilled flag
    ['input-nut-energy', 'input-nut-fat', 'input-nut-carbs', 'input-nut-protein', 'input-nut-fiber', 'input-nut-salt'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', (e) => {
        delete e.target.dataset.autofilled;
      });
    });

    if (nameInput) {
      nameInput.addEventListener('blur', () => {
        const name = nameInput.value.trim();
        if (name && App.AI) {
          // Auto-suggest category and location if not modified
          const predictedCat = App.AI.classifyItem(name);
          if (catSelect && (!catSelect.dataset.userModified || catSelect.dataset.userModified === 'false')) {
            catSelect.value = predictedCat;
          }
          const predictedLoc = App.AI.suggestLocation(name, catSelect ? catSelect.value : predictedCat);
          if (locSelect && (!locSelect.dataset.userModified || locSelect.dataset.userModified === 'false')) {
            locSelect.value = predictedLoc;
          }
        }
        autoFillNutrition();
      });

      nameInput.addEventListener('input', () => {
        // debounce autofill
        clearTimeout(nameInput._nutTimeout);
        nameInput._nutTimeout = setTimeout(autoFillNutrition, 400);
      });
    }

    if (catSelect) {
      catSelect.addEventListener('change', () => {
        catSelect.dataset.userModified = 'true';
        autoFillNutrition();
      });
    }

    if (locSelect) {
      locSelect.addEventListener('change', () => {
        locSelect.dataset.userModified = 'true';
      });
    }

    if (addExpBtn) {
      addExpBtn.addEventListener('click', () => {
        this.addExpirationRow();
      });
    }

    if (saveBtn && form) {
      saveBtn.addEventListener('click', () => {
        if (form.reportValidity()) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('item-name').value.trim();
        if (!name) {
          this.showToast('Zadejte prosím název potraviny', 'error');
          return;
        }

        const id = document.getElementById('item-id').value;
        const expirations = this.collectExpirationData();

        const parseNum = (id, fallback = null) => {
          const el = document.getElementById(id);
          if (!el || el.value === '' || el.value === null || el.value === undefined) return fallback;
          const n = parseFloat(el.value.toString().replace(',', '.'));
          return isNaN(n) ? fallback : n;
        };

        const itemData = {
          name: name,
          category: document.getElementById('item-category').value,
          location: document.getElementById('item-location').value,
          quantity: parseNum('item-quantity', 1),
          unit: document.getElementById('item-unit').value,
          barcode: document.getElementById('item-barcode').value || '',
          notes: document.getElementById('item-notes').value || '',
          expirations: expirations,
          price: parseNum('item-price', null),
          priceManuallySet: document.getElementById('input-price-manual') ? document.getElementById('input-price-manual').checked : false,
          nutrition: {
            energy: parseNum('input-nut-energy'),
            fat: parseNum('input-nut-fat'),
            carbs: parseNum('input-nut-carbs'),
            protein: parseNum('input-nut-protein'),
            fiber: parseNum('input-nut-fiber'),
            salt: parseNum('input-nut-salt')
          }
        };

        this.showLoading();
        try {
          // Pokud nemá expirace a AI je k dispozici, odhadnout
          if (expirations.length === 0 && App.AI) {
            const predicted = App.AI.predictExpiration(itemData.name, itemData.category);
            if (predicted) itemData.expirations.push(predicted);
          }

          // Pokud nemá cenu a nebyla zadána ručně, zkusit odhad z DB/AI
          if (itemData.price === null && App.Prices) {
            const p = await App.Prices.lookupPrice(itemData.name);
            if (p) itemData.price = p.price;
          }

          if (id) {
            itemData.id = id;
            const existing = await App.DB.get('items', id);
            if (existing) {
              itemData.addedDate = existing.addedDate;
              itemData.imageUrl = existing.imageUrl;
            }
            await App.Items.updateItem(itemData);
            this.showToast(`Potravina "${itemData.name}" byla upravena`, 'success');
          } else {
            await App.Items.addItem(itemData);
            this.showToast(`Potravina "${itemData.name}" byla přidána`, 'success');
          }

          this.hideModal('modal-add-item');
          App.Items.renderItems();
        } catch (error) {
          console.error("Save error:", error);
          this.showToast('Chyba při ukládání: ' + error.message, 'error');
        } finally {
          this.hideLoading();
        }
      });
    }
  },

  addExpirationRow(expData = null) {
    const container = document.getElementById('expirations-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'expiration-row';
    row.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-bottom: 8px;';
    
    const id = expData ? expData.id : crypto.randomUUID();
    const date = expData ? expData.date : '';
    const type = expData ? expData.type : 'spotrebujte_do';
    const qty = expData ? (expData.quantity || 1) : 1;

    row.innerHTML = `
      <input type="hidden" class="exp-id" value="${id}">
      <input type="date" class="exp-date flex-1" value="${date}" required style="padding: 8px; border: 1px solid var(--border); border-radius: 6px;">
      <input type="number" class="exp-qty" value="${qty}" min="0.01" step="any" style="width: 60px; padding: 8px 4px; border: 1px solid var(--border); border-radius: 6px; text-align: center;">
      <select class="exp-type" style="padding: 8px 6px; border: 1px solid var(--border); border-radius: 6px; font-size: 0.85rem;">
        <option value="spotrebujte_do" ${type === 'spotrebujte_do' ? 'selected' : ''}>Spotřebujte do</option>
        <option value="minimalni_trvanlivost" ${type === 'minimalni_trvanlivost' ? 'selected' : ''}>Min. trvanlivost</option>
      </select>
      <button type="button" class="btn-close btn-remove-exp" style="font-size: 1.1rem; padding: 0 4px;">❌</button>
    `;

    row.querySelector('.btn-remove-exp').addEventListener('click', () => {
      row.remove();
    });

    container.appendChild(row);
  },

  renderExpirationRows(expirations) {
    const container = document.getElementById('expirations-container');
    if (!container) return;
    container.innerHTML = '';
    if (expirations && expirations.length > 0) {
      expirations.forEach(exp => this.addExpirationRow(exp));
    }
  },

  collectExpirationData() {
    const container = document.getElementById('expirations-container');
    if (!container) return [];
    
    const rows = container.querySelectorAll('.expiration-row');
    const expirations = [];
    rows.forEach(row => {
      const dateVal = row.querySelector('.exp-date')?.value;
      const rawQty = row.querySelector('.exp-qty')?.value;
      const parsedQty = rawQty ? parseFloat(rawQty.toString().replace(',', '.')) : 1;
      if (dateVal) {
        expirations.push({
          id: row.querySelector('.exp-id')?.value || crypto.randomUUID(),
          date: dateVal,
          type: row.querySelector('.exp-type')?.value || 'spotrebujte_do',
          quantity: isNaN(parsedQty) ? 1 : parsedQty,
          aiPredicted: false
        });
      }
    });
    return expirations;
  },

  async setupSettings() {
    const settings = await App.DB.getAllSettings();
    this.applySettings(settings);

    // Přepínače a vstupy v nastavení
    const bindSetting = (id, key, isCheckbox = false) => {
      const el = document.getElementById(id);
      if (el) {
        if (isCheckbox) el.checked = !!settings[key];
        else el.value = settings[key] !== undefined ? settings[key] : '';

        el.addEventListener('change', async (e) => {
          const val = isCheckbox ? e.target.checked : e.target.value;
          await App.DB.setSetting(key, val);
          await App.DB.setSetting(id, val);
          
          if (key === 'darkMode') {
            document.body.classList.toggle('dark-mode', val);
          }
          if (key === 'pushNotificationsEnabled' && val) {
            if (App.Notifications) App.Notifications.requestPermission();
          }
          
          App.Main.showToast('Nastavení uloženo', 'success', 1500);
          window.dispatchEvent(new Event('app:settings-updated'));
        });
      }
    };

    bindSetting('setting-waste', 'wasteTrackerEnabled', true);
    bindSetting('setting-darkmode', 'darkMode', true);
    bindSetting('setting-notifications', 'pushNotificationsEnabled', true);
    bindSetting('setting-exp-days', 'expirationWarningDays', false);
    bindSetting('toggle-auto-prices', 'autoPricesEnabled', true);
    bindSetting('input-sheets-id', 'googleSheetsId', false);
    bindSetting('input-sheets-api-key', 'googleSheetsApiKey', false);
    bindSetting('input-ai-api-key', 'aiApiKey', false);

    // Přepínač výchozího zobrazení (seznam/tabulka vs karty)
    const toggleDefaultView = document.getElementById('toggle-default-view');
    if (toggleDefaultView) {
      toggleDefaultView.checked = settings.defaultView === 'table' || settings.defaultView === 'list';
      toggleDefaultView.addEventListener('change', async (e) => {
        const mode = e.target.checked ? 'table' : 'grid';
        await App.DB.setSetting('defaultView', mode);
        if (App.Items) {
          await App.Items.setViewMode(mode);
        }
        App.Main.showToast(`Zobrazení nastaveno na ${mode === 'table' ? 'tabulku' : 'karty'}`, 'success', 1500);
        window.dispatchEvent(new Event('app:settings-updated'));
      });
    }

    // Tlačítko Uložit nastavení
    const btnSaveSettings = document.getElementById('btn-save-settings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', async () => {
        this.showToast('Všechna nastavení byla uložena', 'success', 2000);
      });
    }

    // Export dat
    const btnExport = document.getElementById('btn-export-data');
    if (btnExport) {
      btnExport.addEventListener('click', async () => {
        const json = await App.DB.exportAll();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `potraviny_zaloha_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Záloha byla stažena', 'success', 2000);
      });
    }

    // Import dat
    const btnImport = document.getElementById('btn-import-data');
    const inputImport = document.getElementById('input-import-data');
    if (btnImport && inputImport) {
      btnImport.addEventListener('click', () => inputImport.click());
      inputImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            await App.DB.importAll(event.target.result);
            this.showToast('Data byla úspěšně obnovena', 'success', 2000);
            if (App.Items) {
              await App.Items.loadItems();
              App.Items.renderItems();
            }
          } catch (err) {
            this.showToast('Chyba při čtení záložního souboru', 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    // Vymazat data
    const btnClear = document.getElementById('btn-clear-data');
    if (btnClear) {
      btnClear.addEventListener('click', async () => {
        if (confirm('POZOR: Opravdu chcete smazat všechny potraviny a historii? Tuto akci nelze vrátit.')) {
          await App.DB.clear('items');
          await App.DB.clear('history');
          if (App.Items) {
            await App.Items.loadItems();
            App.Items.renderItems();
          }
          this.showToast('Všechna data byla vymazána', 'info');
        }
      });
    }
  },

  setupConsumeModal() {
    const form = document.getElementById('form-consume');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('consume-item-id').value;
        const qty = parseFloat(document.getElementById('consume-qty').value) || 1;
        const action = document.getElementById('consume-action').value;

        if (action === 'wasted') {
          await App.Items.wasteItem(id, qty);
          this.showToast('Potravina označena jako vyhozená', 'warning');
        } else {
          await App.Items.consumeItem(id, qty);
          this.showToast('Potravina spotřebována', 'success');
        }
        
        this.hideModal('modal-consume');
        App.Items.renderItems();
      });
    }
  },

  applySettings(settings) {
    if (!settings) return;

    if (settings.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) el.value = val;
    };
    const setChecked = (id, checked) => {
      const el = document.getElementById(id);
      if (el && checked !== undefined && checked !== null) el.checked = !!checked;
    };

    setVal('input-ai-api-key', settings.aiApiKey || settings['input-ai-api-key']);
    setVal('input-sheets-id', settings.googleSheetsId || settings['input-sheets-id']);
    setVal('input-sheets-api-key', settings.googleSheetsApiKey || settings['input-sheets-api-key']);
    setVal('input-passphrase', settings.householdPassphrase || settings['input-passphrase']);
    setVal('setting-exp-days', settings.expirationWarningDays || settings['setting-exp-days']);

    setChecked('setting-darkmode', settings.darkMode);
    setChecked('setting-waste', settings.wasteTrackerEnabled);
    setChecked('setting-notifications', settings.pushNotificationsEnabled);
    setChecked('toggle-auto-prices', settings.autoPricesEnabled);
    
    const isTableView = settings.defaultView === 'table' || settings.defaultView === 'list';
    setChecked('toggle-default-view', isTableView);
    if (App.Items) {
      App.Items.viewMode = isTableView ? 'table' : 'grid';
      const btnCards = document.getElementById('btn-view-cards');
      const btnTable = document.getElementById('btn-view-table');
      if (btnCards) btnCards.classList.toggle('active', !isTableView);
      if (btnTable) btnTable.classList.toggle('active', isTableView);
    }

    if (App.Sync && typeof App.Sync.updatePassphraseUI === 'function') {
      App.Sync.updatePassphraseUI();
    }
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(registration => {
          console.log('SW registrován:', registration.scope);
        }).catch(err => {
          console.warn('SW registrace selhala:', err);
        });
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.Main.init();
});

