window.App = window.App || {};

App.Unpack = {
  tempList: [],
  _isUnpackScanning: false,
  
  async addToTempList(item) {
    const name = item.name || 'Nová položka';
    const category = item.category || (App.AI ? App.AI.classifyItem(name) : 'ostatni');
    
    // Predikce umístění (historie > kategorie/AI)
    let location = item.location;
    if (!location) {
      location = await this.predictLocationFromHistoryOrAI(name, category);
    }
    
    this.tempList.push({
      id: crypto.randomUUID(),
      name: name,
      category: category,
      location: location,
      quantity: item.quantity || 1,
      unit: item.unit || 'ks',
      barcode: item.barcode || '',
      imageUrl: item.imageUrl || '',
      nutrition: item.nutrition || null,
      price: item.price || null
    });
    
    this.renderTempList();
  },
  
  async predictLocationFromHistoryOrAI(name, category) {
    try {
      const history = await App.DB.getAll('history');
      if (history && history.length > 0) {
        const past = history.find(h => h.itemName && h.itemName.toLowerCase() === name.toLowerCase());
        if (past && past.itemId) {
          const item = await App.DB.get('items', past.itemId);
          if (item && item.location) return item.location;
        }
      }
    } catch (e) {}

    return App.AI ? App.AI.suggestLocation(name, category) : 'spiz';
  },

  removeFromTempList(index) {
    this.tempList.splice(index, 1);
    this.renderTempList();
  },
  
  renderTempList() {
    const container = document.getElementById('unpack-list');
    if (!container) return;
    
    if (this.tempList.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; color: var(--text-secondary);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🛒</div>
          <p>Seznam je zatím prázdný.<br>Naskenujte kód produktu nebo přidejte položku ručně.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.tempList.map((it, idx) => `
      <div class="list-item" style="display: flex; gap: 8px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border);">
        <input type="text" class="flex-1" value="${it.name}" 
          style="padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px; font-size: 0.9rem;"
          onchange="App.Unpack.tempList[${idx}].name=this.value">
        
        <input type="number" value="${it.quantity}" min="0.1" step="0.5" 
          style="width: 55px; padding: 6px 4px; border: 1px solid var(--border); border-radius: 6px; text-align: center;"
          onchange="App.Unpack.tempList[${idx}].quantity=parseFloat(this.value)||1">
        
        <select style="width: 70px; padding: 6px 4px; border: 1px solid var(--border); border-radius: 6px; font-size: 0.85rem;"
          onchange="App.Unpack.tempList[${idx}].unit=this.value">
          <option value="ks" ${it.unit==='ks'?'selected':''}>ks</option>
          <option value="kg" ${it.unit==='kg'?'selected':''}>kg</option>
          <option value="g" ${it.unit==='g'?'selected':''}>g</option>
          <option value="l" ${it.unit==='l'?'selected':''}>l</option>
          <option value="ml" ${it.unit==='ml'?'selected':''}>ml</option>
          <option value="baleni" ${it.unit==='baleni'?'selected':''}>bal.</option>
        </select>
        
        <select style="width: 110px; padding: 6px 4px; border: 1px solid var(--border); border-radius: 6px; font-size: 0.85rem;"
          onchange="App.Unpack.tempList[${idx}].location=this.value">
          <option value="lednice" ${it.location==='lednice'?'selected':''}>🧊 Lednice</option>
          <option value="mrazak" ${it.location==='mrazak'?'selected':''}>❄️ Mrazák</option>
          <option value="spiz" ${it.location==='spiz'?'selected':''}>🚪 Spíž</option>
          <option value="suplik" ${it.location==='suplik'?'selected':''}>🗄️ Šuplík</option>
          <option value="skrin" ${it.location==='skrin'?'selected':''}>🗄️ Skříň</option>
          <option value="police" ${it.location==='police'?'selected':''}>📚 Police</option>
          <option value="ostatni" ${it.location==='ostatni'?'selected':''}>📦 Ostatní</option>
        </select>
        
        <button type="button" class="btn-close" style="font-size: 1.1rem; padding: 0 6px;"
          onclick="App.Unpack.removeFromTempList(${idx})">❌</button>
      </div>
    `).join('');
  },
  
  async confirmUnpack() {
    if (this.tempList.length === 0) {
      if (App.Main) App.Main.showToast('Seznam vybalení je prázdný.', 'warning', 2000);
      return;
    }
    
    if (App.Main) App.Main.showLoading();
    let count = 0;
    
    for (let it of this.tempList) {
      const exp = App.AI ? App.AI.predictExpiration(it.name, it.category) : null;
      const priceInfo = App.Prices ? await App.Prices.lookupPrice(it.name) : null;

      await App.Items.addItem({
        name: it.name,
        category: it.category || (App.AI ? App.AI.classifyItem(it.name) : 'ostatni'),
        location: it.location || 'spiz',
        quantity: it.quantity || 1,
        unit: it.unit || 'ks',
        barcode: it.barcode || '',
        imageUrl: it.imageUrl || '',
        nutrition: it.nutrition || null,
        price: it.price || (priceInfo ? priceInfo.price : null),
        expirations: exp ? [exp] : []
      });
      count++;
    }
    
    this.tempList = [];
    this.renderTempList();
    
    if (App.Main) {
      App.Main.hideLoading();
      App.Main.hideModal('modal-unpack');
      App.Main.showToast(`Úspěšně vybaleno a roztříděno ${count} položek.`, 'success', 3000);
      App.Items.renderItems();
    }
  },
  
  startUnpackScan() {
    if (App.Main) {
      App.Main.hideModal('modal-unpack');
      App.Main.navigate('scanner');
      App.Main.showToast('Skenujte čárové kódy pro přidání do zásob.', 'info', 2500);
    }
  },
  
  setupUnpackModal() {
    const btnScan = document.getElementById('btn-unpack-scan');
    const btnConfirm = document.getElementById('btn-confirm-unpack');
    const btnCancel = document.getElementById('btn-cancel-unpack');
    const btnAdd = document.getElementById('btn-unpack-add-manual');
    
    if (btnScan) btnScan.addEventListener('click', () => this.startUnpackScan());
    if (btnConfirm) btnConfirm.addEventListener('click', () => this.confirmUnpack());
    if (btnCancel) btnCancel.addEventListener('click', () => {
      this.tempList = [];
      this.renderTempList();
      if (App.Main) App.Main.hideModal('modal-unpack');
    });
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        this.addToTempList({ name: 'Nová položka', quantity: 1, unit: 'ks' });
      });
    }
  }
};

