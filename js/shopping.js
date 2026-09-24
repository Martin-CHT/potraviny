window.App = window.App || {};

App.Shopping = {
  items: [],
  currentFilter: 'all', // 'all' | 'pending' | 'completed'

  async loadItems() {
    this.items = await App.DB.getAll('shopping_list') || [];
  },

  async addItem(itemData) {
    const rawName = (itemData.name || '').trim();
    if (!rawName) return null;

    const cleanName = App.AI ? App.AI.normalizeToCzech(rawName) : rawName;
    const category = itemData.category || (App.AI ? App.AI.classifyItem(cleanName) : 'ostatni');

    const item = {
      id: itemData.id || crypto.randomUUID(),
      name: cleanName,
      quantity: parseFloat(itemData.quantity) || 1,
      unit: itemData.unit || 'ks',
      category: category,
      checked: !!itemData.checked,
      addedDate: itemData.addedDate || new Date().toISOString(),
      fromItemId: itemData.fromItemId || null
    };

    // Pokud už položka se stejným názvem a jednotkou v seznamu existuje a není odškrtnutá, navýšit množství
    const existing = this.items.find(i => i.name.toLowerCase() === item.name.toLowerCase() && i.unit === item.unit && !i.checked);
    if (existing) {
      existing.quantity += item.quantity;
      await App.DB.put('shopping_list', existing);
      this.renderShoppingList();
      window.dispatchEvent(new Event('app:shopping-updated'));
      return existing;
    }

    await App.DB.add('shopping_list', item);
    this.items.push(item);
    this.renderShoppingList();
    window.dispatchEvent(new Event('app:shopping-updated'));
    return item;
  },

  async toggleChecked(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    item.checked = !item.checked;
    await App.DB.put('shopping_list', item);
    this.renderShoppingList();
    window.dispatchEvent(new Event('app:shopping-updated'));
  },

  async deleteItem(id) {
    await App.DB.delete('shopping_list', id);
    this.items = this.items.filter(i => i.id !== id);
    this.renderShoppingList();
    window.dispatchEvent(new Event('app:shopping-updated'));
  },

  async clearChecked() {
    const checkedItems = this.items.filter(i => i.checked);
    if (checkedItems.length === 0) return;

    for (let item of checkedItems) {
      await App.DB.delete('shopping_list', item.id);
    }
    this.items = this.items.filter(i => !i.checked);
    this.renderShoppingList();
    window.dispatchEvent(new Event('app:shopping-updated'));
    if (App.Main) App.Main.showToast(`Odstraněno ${checkedItems.length} nakoupených položek`, 'info', 2000);
  },

  // Zkopírování nákupního seznamu do schránky pro SMS / WhatsApp
  async copyToClipboard() {
    const pendingItems = this.items.filter(i => !i.checked);
    if (pendingItems.length === 0) {
      if (App.Main) App.Main.showToast('Nákupní seznam je prázdný.', 'info', 2000);
      return;
    }

    // Seskupit podle kategorií
    const lines = ['🛒 Nákupní seznam (Potraviny):\n'];
    pendingItems.forEach(i => {
      lines.push(`• ${i.name} — ${i.quantity} ${i.unit}`);
    });

    const text = lines.join('\n');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        if (App.Main) App.Main.showToast('Nákupní seznam zkopírován do schránky!', 'success', 2500);
      } else {
        prompt('Zkopírujte si nákupní seznam:', text);
      }
    } catch (e) {
      prompt('Zkopírujte si nákupní seznam:', text);
    }
  },

  // Převedení koupených položek přímo do zásob inventáře
  async transferCheckedToStock() {
    const checkedItems = this.items.filter(i => i.checked);
    if (checkedItems.length === 0) {
      if (App.Main) App.Main.showToast('Nejprve zaškrtněte položky, které jste koupili.', 'warning', 2500);
      return;
    }

    if (App.Main) App.Main.showLoading();
    let transferredCount = 0;

    for (let it of checkedItems) {
      const category = it.category || (App.AI ? App.AI.classifyItem(it.name) : 'ostatni');
      const location = App.AI ? App.AI.suggestLocation(it.name, category) : 'spiz';
      const exp = App.AI ? App.AI.predictExpiration(it.name, category) : null;
      const priceInfo = App.Prices ? await App.Prices.lookupPrice(it.name) : null;

      await App.Items.addItem({
        name: it.name,
        category: category,
        location: location,
        quantity: it.quantity || 1,
        unit: it.unit || 'ks',
        price: priceInfo ? priceInfo.price : null,
        expirations: exp ? [exp] : []
      });

      await App.DB.delete('shopping_list', it.id);
      transferredCount++;
    }

    this.items = this.items.filter(i => !i.checked);
    this.renderShoppingList();
    window.dispatchEvent(new Event('app:shopping-updated'));

    if (App.Main) {
      App.Main.hideLoading();
      App.Main.showToast(`Úspěšně přeneseno ${transferredCount} položek do zásob!`, 'success', 3000);
      App.Items.renderItems();
    }
  },

  renderShoppingList() {
    const listContainer = document.getElementById('shopping-items-list');
    const emptyState = document.getElementById('shopping-empty-state');
    const badgeEl = document.getElementById('shopping-pending-badge');
    const transferBtn = document.getElementById('btn-shopping-transfer');
    if (!listContainer) return;

    const pendingCount = this.items.filter(i => !i.checked).length;
    const checkedCount = this.items.filter(i => i.checked).length;

    if (badgeEl) {
      if (pendingCount > 0) {
        badgeEl.textContent = pendingCount;
        badgeEl.classList.remove('hidden');
      } else {
        badgeEl.classList.add('hidden');
      }
    }

    if (transferBtn) {
      if (checkedCount > 0) {
        transferBtn.classList.remove('hidden');
        transferBtn.textContent = `📥 Přenést koupené do zásob (${checkedCount})`;
      } else {
        transferBtn.classList.add('hidden');
      }
    }

    let filtered = [...this.items];
    if (this.currentFilter === 'pending') {
      filtered = filtered.filter(i => !i.checked);
    } else if (this.currentFilter === 'completed') {
      filtered = filtered.filter(i => i.checked);
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    listContainer.innerHTML = filtered.map(item => {
      const emoji = App.Items ? App.Items.getCategoryEmoji(item.category) : '📦';
      const catLabel = App.Items ? App.Items.getCategoryLabel(item.category) : item.category;

      return `
        <div class="shopping-item-card ${item.checked ? 'item-checked' : ''}" data-id="${item.id}">
          <label class="shopping-cb-label">
            <input type="checkbox" class="shopping-item-cb" data-id="${item.id}" ${item.checked ? 'checked' : ''}>
            <span class="shopping-custom-cb"></span>
          </label>
          <span class="shopping-emoji">${emoji}</span>
          <div class="shopping-item-info">
            <div class="shopping-item-name ${item.checked ? 'text-strikethrough' : ''}">${item.name}</div>
            <div class="shopping-item-meta">
              <span class="shopping-qty-pill">${item.quantity} ${item.unit}</span>
              <span class="shopping-cat-pill">${catLabel}</span>
            </div>
          </div>
          <div class="shopping-item-actions">
            <button type="button" class="btn-icon-danger btn-delete-shopping-item" data-id="${item.id}" title="Smazat">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    // Listeners
    listContainer.querySelectorAll('.shopping-item-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        this.toggleChecked(e.target.dataset.id);
      });
    });

    listContainer.querySelectorAll('.btn-delete-shopping-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteItem(btn.dataset.id);
      });
    });
  },

  setupShoppingUI() {
    const form = document.getElementById('form-add-shopping-item');
    const nameInput = document.getElementById('input-shopping-name');
    const qtyInput = document.getElementById('input-shopping-qty');
    const unitSelect = document.getElementById('input-shopping-unit');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) return;

        const qty = parseFloat(qtyInput ? qtyInput.value : 1) || 1;
        const unit = unitSelect ? unitSelect.value : 'ks';

        await this.addItem({ name, quantity: qty, unit });

        if (nameInput) {
          nameInput.value = '';
          nameInput.focus();
        }
        if (qtyInput) qtyInput.value = '1';
        if (App.Main) App.Main.showToast(`Položka "${name}" přidána do nákupního seznamu`, 'success', 1800);
      });
    }

    const btnCopy = document.getElementById('btn-shopping-copy');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => this.copyToClipboard());
    }

    const btnTransfer = document.getElementById('btn-shopping-transfer');
    if (btnTransfer) {
      btnTransfer.addEventListener('click', () => this.transferCheckedToStock());
    }

    const btnClearChecked = document.getElementById('btn-shopping-clear-checked');
    if (btnClearChecked) {
      btnClearChecked.addEventListener('click', () => this.clearChecked());
    }

    // Filter tabs
    const filterTabs = document.querySelectorAll('.shopping-filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentFilter = tab.dataset.filter || 'all';
        this.renderShoppingList();
      });
    });

    this.renderShoppingList();
  }
};
