window.App = window.App || {};

App.Items = {
  items: [],
  currentSort: { field: 'name', direction: 'asc' },
  currentFilters: { category: 'all', location: 'all', search: '' },

  async loadItems() {
    this.items = await App.DB.getAll('items') || [];
  },

  async addItem(itemData) {
    const rawName = itemData.name ? itemData.name.trim() : 'Nová potravina';
    const cleanName = App.AI ? App.AI.normalizeToCzech(rawName, itemData.category) : rawName;
    const category = itemData.category || (App.AI ? App.AI.classifyItem(cleanName) : 'ostatni');
    const location = itemData.location || (App.AI ? App.AI.suggestLocation(cleanName, category) : 'spiz');

    // Nutriční hodnoty - automaticky doplnit z AI pokud chybí
    let nutrition = itemData.nutrition;
    if (!nutrition || (!nutrition.energy && !nutrition.fat && !nutrition.carbs && !nutrition.protein)) {
      nutrition = App.AI ? App.AI.predictNutrition(cleanName, category) : null;
    }

    const item = {
      id: itemData.id || crypto.randomUUID(),
      name: cleanName,
      category: category,
      location: location,
      quantity: parseFloat(itemData.quantity) || 1,
      unit: itemData.unit || 'ks',
      expirations: itemData.expirations || [],
      barcode: itemData.barcode || '',
      imageUrl: itemData.imageUrl || '',
      nutrition: nutrition,
      price: itemData.price !== undefined && itemData.price !== null && itemData.price !== '' ? parseFloat(itemData.price) : null,
      priceManuallySet: !!itemData.priceManuallySet,
      priceLastUpdated: itemData.price ? new Date().toISOString() : null,
      addedDate: itemData.addedDate || new Date().toISOString(),
      notes: itemData.notes || ''
    };

    // Pokud nemá expiraci, doplnit automatický odhad z AI
    if (item.expirations.length === 0 && App.AI) {
      const predicted = App.AI.predictExpiration(item.name, item.category);
      item.expirations.push(predicted);
    }

    await App.DB.add('items', item);
    this.items.push(item);
    
    const settings = await App.DB.getAllSettings();
    if (settings.wasteTrackerEnabled) {
      await App.DB.add('history', {
        id: crypto.randomUUID(),
        itemId: item.id,
        itemName: item.name,
        action: 'added',
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        date: new Date().toISOString()
      });
    }

    window.dispatchEvent(new Event('app:items-updated'));
    return item;
  },

  async updateItem(itemData) {
    await App.DB.put('items', itemData);
    const index = this.items.findIndex(i => i.id === itemData.id);
    if (index !== -1) {
      this.items[index] = itemData;
    }
    window.dispatchEvent(new Event('app:items-updated'));
    return itemData;
  },

  async deleteItem(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    await App.DB.delete('items', id);
    this.items = this.items.filter(i => i.id !== id);

    const settings = await App.DB.getAllSettings();
    if (settings.wasteTrackerEnabled) {
      await App.DB.add('history', {
        id: crypto.randomUUID(),
        itemId: id,
        itemName: item.name,
        action: 'removed',
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        date: new Date().toISOString()
      });
    }
    window.dispatchEvent(new Event('app:items-updated'));
  },

  async consumeItem(id, quantity) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    item.quantity = Math.max(0, item.quantity - quantity);
    
    // Upravit expirace pro odebrané kusy
    let qtyToDeduct = quantity;
    if (item.expirations && item.expirations.length > 0) {
      item.expirations.sort((a, b) => new Date(a.date) - new Date(b.date));
      for (let exp of item.expirations) {
        if (qtyToDeduct <= 0) break;
        const currentExpQty = exp.quantity || 1;
        if (currentExpQty <= qtyToDeduct) {
          qtyToDeduct -= currentExpQty;
          exp.quantity = 0;
        } else {
          exp.quantity -= qtyToDeduct;
          qtyToDeduct = 0;
        }
      }
      item.expirations = item.expirations.filter(e => (e.quantity || 0) > 0);
    }

    await App.DB.add('history', {
      id: crypto.randomUUID(),
      itemId: id,
      itemName: item.name,
      action: 'consumed',
      quantity: quantity,
      unit: item.unit,
      price: item.price,
      date: new Date().toISOString()
    });

    if (item.quantity <= 0) {
      await this.deleteItem(id);
    } else {
      await this.updateItem(item);
    }
  },

  async wasteItem(id, quantity) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    item.quantity = Math.max(0, item.quantity - quantity);
    
    await App.DB.add('history', {
      id: crypto.randomUUID(),
      itemId: id,
      itemName: item.name,
      action: 'wasted',
      quantity: quantity,
      unit: item.unit,
      price: item.price,
      date: new Date().toISOString()
    });

    if (item.quantity <= 0) {
      await this.deleteItem(id);
    } else {
      await this.updateItem(item);
    }
  },

  getFilteredAndSorted() {
    let result = [...this.items];

    if (this.currentFilters.category !== 'all') {
      result = result.filter(i => i.category === this.currentFilters.category);
    }
    
    if (this.currentFilters.location !== 'all') {
      result = result.filter(i => i.location === this.currentFilters.location);
    }

    if (this.currentFilters.search) {
      const query = this.currentFilters.search.toLowerCase().trim();
      result = result.filter(i => 
        i.name.toLowerCase().includes(query) || 
        (i.notes && i.notes.toLowerCase().includes(query)) ||
        (i.barcode && i.barcode.includes(query))
      );
    }

    result.sort((a, b) => {
      let valA = a[this.currentSort.field];
      let valB = b[this.currentSort.field];
      
      if (this.currentSort.field === 'expiration') {
        const expA = a.expirations && a.expirations.length > 0 ? new Date(Math.min(...a.expirations.map(e => new Date(e.date).getTime()))) : new Date('2099-01-01');
        const expB = b.expirations && b.expirations.length > 0 ? new Date(Math.min(...b.expirations.map(e => new Date(e.date).getTime()))) : new Date('2099-01-01');
        valA = expA.getTime();
        valB = expB.getTime();
      }

      if (valA === undefined || valA === null) valA = this.currentSort.direction === 'asc' ? Infinity : -Infinity;
      if (valB === undefined || valB === null) valB = this.currentSort.direction === 'asc' ? Infinity : -Infinity;

      if (typeof valA === 'string') {
        return this.currentSort.direction === 'asc' ? valA.localeCompare(valB, 'cs') : valB.localeCompare(valA, 'cs');
      }

      if (valA < valB) return this.currentSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return this.currentSort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  },

  setFilter(filterType, value) {
    this.currentFilters[filterType] = value;
    this.renderItems();
  },

  setSort(field, direction) {
    this.currentSort = { field, direction };
    this.renderItems();
  },

  renderItems() {
    const container = document.getElementById('items-container');
    const emptyState = document.getElementById('empty-state');
    if (!container) return;
    
    const items = this.getFilteredAndSorted();
    
    if (items.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    container.innerHTML = items.map(item => {
      const expStatus = this.getExpirationStatus(item);
      const emoji = this.getCategoryEmoji(item.category);
      const priceText = item.price ? `${item.price.toFixed(1)} Kč` : '';
      
      return `
        <div class='item-card' data-id='${item.id}' data-category='${item.category}' onclick="App.Items.openDetailModal('${item.id}')">
          <div class='item-card-image'>
            ${item.imageUrl ? `<img src="${item.imageUrl}" style="width:100%; height:100%; object-fit:cover;">` : emoji}
          </div>
          <div class='item-card-content'>
            <h3 class='item-card-name' title="${item.name}">${item.name}</h3>
            <div style="display:flex; gap:4px; margin-bottom:4px; flex-wrap:wrap;">
              <span class='item-card-category'>${this.getCategoryLabel(item.category)}</span>
              <span class='item-card-location'>${this.getLocationLabel(item.location)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
              <span class='item-card-quantity'>${item.quantity} ${this.getUnitLabel(item.unit)}</span>
              <span class='item-card-price'>${priceText}</span>
            </div>
            <div class='item-card-expiration exp-${expStatus.status} ${expStatus.isBestBefore ? 'exp-best-before' : ''}'>
              ${expStatus.text}
            </div>
          </div>
          <span class='item-card-qty-badge'>${item.quantity} ${this.getUnitLabel(item.unit)}</span>
        </div>
      `;
    }).join('');
  },

  getExpirationStatus(item) {
    if (!item.expirations || item.expirations.length === 0) {
      return { status: 'ok', text: 'Bez expirace', daysLeft: Infinity, isBestBefore: false };
    }

    const sortedExps = [...item.expirations].sort((a, b) => new Date(a.date) - new Date(b.date));
    const earliest = sortedExps[0];
    const expDate = new Date(earliest.date);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const diffTime = expDate - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status = 'ok';
    if (daysLeft < 0) status = 'expired';
    else if (daysLeft === 0) status = 'danger';
    else if (daysLeft <= 3) status = 'warning';

    const isBestBefore = earliest.type === 'minimalni_trvanlivost';
    const typeLabel = isBestBefore ? 'Min. trvanlivost' : 'Spotřebujte do';
    const dateStr = expDate.toLocaleDateString('cs-CZ');
    let text = dateStr;
    
    if (daysLeft < 0) {
      text = `🔴 Prošlé ${Math.abs(daysLeft)} dny (${dateStr})`;
    } else if (daysLeft === 0) {
      text = `🟠 Končí dnes (${typeLabel})`;
    } else if (daysLeft === 1) {
      text = `🟠 Končí zítra (${typeLabel})`;
    } else if (daysLeft <= 3) {
      text = `🟡 Zbývají ${daysLeft} dny (${dateStr})`;
    } else {
      text = `🟢 Do ${dateStr} (${isBestBefore ? 'MT' : 'SD'})`;
    }

    return { status, text, daysLeft, isBestBefore, earliestDate: expDate };
  },

  async openDetailModal(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    const modal = document.getElementById('modal-item-detail');
    if (!modal) return;

    document.getElementById('detail-name').textContent = item.name;
    
    const imgEl = document.getElementById('detail-image');
    if (imgEl) {
      if (item.imageUrl) {
        imgEl.src = item.imageUrl;
        imgEl.classList.remove('hidden');
      } else {
        imgEl.classList.add('hidden');
      }
    }

    const catBadge = document.getElementById('detail-category-badge');
    if (catBadge) catBadge.textContent = this.getCategoryLabel(item.category);

    const locBadge = document.getElementById('detail-location-badge');
    if (locBadge) locBadge.textContent = this.getLocationLabel(item.location);

    document.getElementById('detail-quantity').textContent = item.quantity;
    document.getElementById('detail-unit').textContent = this.getUnitLabel(item.unit);

    // Expirations
    const expDiv = document.getElementById('detail-expirations');
    if (expDiv) {
      if (item.expirations && item.expirations.length > 0) {
        expDiv.innerHTML = item.expirations.map(exp => {
          const d = new Date(exp.date);
          const isBB = exp.type === 'minimalni_trvanlivost';
          const typeBadge = isBB 
            ? '<span class="badge" style="background:#4285f4; color:white; font-size:0.75rem; padding:2px 6px;">Minimální trvanlivost</span>' 
            : '<span class="badge" style="background:#ea4335; color:white; font-size:0.75rem; padding:2px 6px;">Spotřebujte do</span>';
          
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 6px 0; border-bottom: 1px dashed var(--border);">
              <div>
                <strong>${d.toLocaleDateString('cs-CZ')}</strong>
                ${exp.quantity ? ` <span class="text-muted">(${exp.quantity} ks)</span>` : ''}
              </div>
              <div>${typeBadge}</div>
            </div>
          `;
        }).join('');
      } else {
        expDiv.innerHTML = '<span class="text-muted">Není nastaveno datum expirace</span>';
      }
    }

    // Price
    const priceEl = document.getElementById('detail-price');
    if (priceEl) {
      priceEl.textContent = item.price ? item.price.toFixed(2) : '-';
    }

    const btnDetailRefreshPrice = document.getElementById('btn-detail-refresh-price');
    if (btnDetailRefreshPrice) {
      btnDetailRefreshPrice.onclick = async () => {
        if (App.Prices) {
          await App.Prices.refreshPrice(id);
          const updated = App.Items.items.find(i => i.id === id);
          if (updated && priceEl) {
            priceEl.textContent = updated.price ? updated.price.toFixed(2) : '-';
          }
        }
      };
    }

    // Barcode
    const barcodeEl = document.getElementById('detail-barcode');
    if (barcodeEl) {
      barcodeEl.textContent = item.barcode || 'Neuveden';
    }

    // Notes
    const notesEl = document.getElementById('detail-notes');
    if (notesEl) {
      notesEl.textContent = item.notes || 'Žádné poznámky';
    }

    // Nutrition
    const nutInfo = document.getElementById('detail-nutrition-info');
    const nutContainer = document.getElementById('nutrition-container');
    if (nutInfo && nutContainer) {
      let nut = item.nutrition;
      if (!nut || (!nut.energy && !nut.fat && !nut.carbs && !nut.protein)) {
        nut = App.AI ? App.AI.predictNutrition(item.name, item.category) : null;
      }
      if (nut) {
        nutInfo.classList.remove('hidden');
        nutContainer.innerHTML = `
          <div><strong>Energie:</strong> ${nut.energy ?? '-'} kcal</div>
          <div><strong>Tuky:</strong> ${nut.fat ?? '-'} g</div>
          <div><strong>Sacharidy:</strong> ${nut.carbs ?? '-'} g</div>
          <div><strong>Bílkoviny:</strong> ${nut.protein ?? '-'} g</div>
          <div><strong>Vláknina:</strong> ${nut.fiber ?? '-'} g</div>
          <div><strong>Sůl:</strong> ${nut.salt ?? '-'} g</div>
        `;
      } else {
        nutInfo.classList.add('hidden');
      }
    }

    // Waste button visibility
    const settings = await App.DB.getAllSettings();
    const wasteBtn = document.getElementById('btn-detail-waste');
    if (wasteBtn) {
      if (settings.wasteTrackerEnabled) {
        wasteBtn.classList.remove('hidden');
      } else {
        wasteBtn.classList.add('hidden');
      }
    }

    // Action buttons
    const editBtn = document.getElementById('btn-detail-edit');
    if (editBtn) {
      editBtn.onclick = () => {
        App.Main.hideModal('modal-item-detail');
        this.openEditModal(id);
      };
    }

    const consumeBtn = document.getElementById('btn-detail-consume');
    if (consumeBtn) {
      consumeBtn.onclick = () => {
        App.Main.hideModal('modal-item-detail');
        this.openConsumeModal(id, 'consumed');
      };
    }

    if (wasteBtn) {
      wasteBtn.onclick = () => {
        App.Main.hideModal('modal-item-detail');
        this.openConsumeModal(id, 'wasted');
      };
    }

    const deleteBtn = document.getElementById('btn-detail-delete');
    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        if (confirm(`Opravdu chcete smazat "${item.name}"?`)) {
          await this.deleteItem(id);
          App.Main.hideModal('modal-item-detail');
          this.renderItems();
          App.Main.showToast('Položka smazána', 'info');
        }
      };
    }

    App.Main.showModal('modal-item-detail');
  },

  openConsumeModal(id, action = 'consumed') {
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    const title = document.getElementById('modal-consume-title');
    if (title) title.textContent = action === 'wasted' ? 'Vyhodit do odpadu' : 'Spotřebovat potravinu';

    document.getElementById('consume-item-id').value = id;
    document.getElementById('consume-action').value = action;
    document.getElementById('consume-item-name').textContent = item.name;
    document.getElementById('consume-item-unit').textContent = this.getUnitLabel(item.unit);

    const qtyInput = document.getElementById('consume-qty');
    if (qtyInput) {
      qtyInput.max = item.quantity;
      qtyInput.value = item.quantity >= 1 ? 1 : item.quantity;
    }

    App.Main.showModal('modal-consume');
  },

  openEditModal(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    const title = document.getElementById('modal-add-item-title');
    if (title) title.textContent = 'Upravit potravinu';

    document.getElementById('item-id').value = item.id;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-category').value = item.category;
    document.getElementById('item-location').value = item.location;
    document.getElementById('item-quantity').value = item.quantity;
    document.getElementById('item-unit').value = item.unit;
    document.getElementById('item-barcode').value = item.barcode || '';
    document.getElementById('item-price').value = item.price || '';
    document.getElementById('input-price-manual').checked = !!item.priceManuallySet;
    document.getElementById('item-notes').value = item.notes || '';

    const nut = item.nutrition || (App.AI ? App.AI.predictNutrition(item.name, item.category) : null);
    if (nut) {
      if (document.getElementById('input-nut-energy')) document.getElementById('input-nut-energy').value = nut.energy ?? '';
      if (document.getElementById('input-nut-fat')) document.getElementById('input-nut-fat').value = nut.fat ?? '';
      if (document.getElementById('input-nut-carbs')) document.getElementById('input-nut-carbs').value = nut.carbs ?? '';
      if (document.getElementById('input-nut-protein')) document.getElementById('input-nut-protein').value = nut.protein ?? '';
      if (document.getElementById('input-nut-fiber')) document.getElementById('input-nut-fiber').value = nut.fiber ?? '';
      if (document.getElementById('input-nut-salt')) document.getElementById('input-nut-salt').value = nut.salt ?? '';
    }

    App.Main.renderExpirationRows(item.expirations);
    App.Main.showModal('modal-add-item');
  },

  getCategoryLabel(val) {
    const map = {
      'mlecne': 'Mléčné výrobky', 'maso': 'Maso a uzeniny', 'ovoce_zelenina': 'Ovoce a zelenina',
      'pecivo': 'Pečivo', 'napoje': 'Nápoje', 'mrazene': 'Mražené', 'konzervy': 'Konzervy a trvanlivé',
      'koreni': 'Koření a dochucovadla', 'sladkosti': 'Sladkosti a snacky', 'ostatni': 'Ostatní'
    };
    return map[val] || val;
  },

  getLocationLabel(val) {
    const map = {
      'lednice': '🧊 Lednice', 'mrazak': '❄️ Mrazák', 'spiz': '🚪 Spíž',
      'suplik': '🗄️ Šuplík', 'skrin': '🗄️ Skříň', 'police': '📚 Police', 'ostatni': '📦 Ostatní'
    };
    return map[val] || val;
  },

  getCategoryEmoji(val) {
    const map = {
      'mlecne': '🧀', 'maso': '🥩', 'ovoce_zelenina': '🥬', 'pecivo': '🍞',
      'napoje': '🥤', 'mrazene': '🧊', 'konzervy': '🥫', 'koreni': '🌶️',
      'sladkosti': '🍫', 'ostatni': '📦'
    };
    return map[val] || '📦';
  },

  getUnitLabel(val) {
    const map = { 'ks': 'ks', 'kg': 'kg', 'g': 'g', 'l': 'l', 'ml': 'ml', 'baleni': 'balení', 'sacek': 'sáček' };
    return map[val] || val;
  },

  setupCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.setFilter('category', tab.dataset.category);
      });
    });
  },

  setupLocationFilters() {
    const pills = document.querySelectorAll('.location-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.setFilter('location', pill.dataset.location);
      });
    });
  },

  setupSortModal() {
    const btnSort = document.getElementById('btn-sort');
    if (btnSort) {
      btnSort.addEventListener('click', () => {
        App.Main.showModal('modal-sort');
      });
    }

    const btnApplySort = document.getElementById('btn-apply-sort');
    if (btnApplySort) {
      btnApplySort.addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="sort-option"]:checked');
        if (selectedRadio) {
          const val = selectedRadio.value;
          let field = 'name';
          let direction = 'asc';
          let text = 'Dle názvu (A-Z)';

          switch (val) {
            case 'name_asc': field = 'name'; direction = 'asc'; text = 'Název (A-Z)'; break;
            case 'name_desc': field = 'name'; direction = 'desc'; text = 'Název (Z-A)'; break;
            case 'exp_asc': field = 'expiration'; direction = 'asc'; text = 'Datum spotřeby (nejbližší)'; break;
            case 'exp_desc': field = 'expiration'; direction = 'desc'; text = 'Datum spotřeby (nejpozdější)'; break;
            case 'added_desc': field = 'addedDate'; direction = 'desc'; text = 'Datum přidání (nejnovější)'; break;
            case 'added_asc': field = 'addedDate'; direction = 'asc'; text = 'Datum přidání (nejstarší)'; break;
            case 'category': field = 'category'; direction = 'asc'; text = 'Kategorie'; break;
            case 'location': field = 'location'; direction = 'asc'; text = 'Umístění'; break;
            case 'price_asc': field = 'price'; direction = 'asc'; text = 'Cena (nejnižší)'; break;
            case 'price_desc': field = 'price'; direction = 'desc'; text = 'Cena (nejvyšší)'; break;
            case 'qty_asc': field = 'quantity'; direction = 'asc'; text = 'Množství (nejméně)'; break;
            case 'qty_desc': field = 'quantity'; direction = 'desc'; text = 'Množství (nejvíce)'; break;
          }

          this.setSort(field, direction);
          const currentSortText = document.getElementById('current-sort-text');
          if (currentSortText) currentSortText.textContent = `Řazení: ${text}`;
          
          App.Main.hideModal('modal-sort');
        }
      });
    }
  },

  getExpiringItemsCount(warningDays = 3) {
    let count = 0;
    this.items.forEach(item => {
      const status = this.getExpirationStatus(item);
      if (status.daysLeft <= warningDays) {
        count++;
      }
    });
    return count;
  }
};

