window.App = window.App || {};

App.Scanner = {
  html5QrCode: null,
  isScanning: false,
  
  async init(containerId = 'scanner-preview') {
    try {
      const container = document.getElementById(containerId);
      if (!container) return;

      if (typeof Html5Qrcode === 'undefined') {
        console.warn('Html5Qrcode library not loaded.');
        return;
      }

      if (!this.html5QrCode) {
        this.html5QrCode = new Html5Qrcode(containerId);
      }
      
      if (this.isScanning) {
        await this.stop();
      }

      await this.html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => this.onBarcodeDetected(decodedText),
        () => { /* normal frame scan error, ignore */ }
      );
      this.isScanning = true;
    } catch (err) {
      console.error('Camera start error:', err);
      if (App.Main) App.Main.showToast('Kameru se nepodařilo spustit (zkontrolujte oprávnění).', 'warning', 3000);
    }
  },
  
  async stop() {
    if (this.html5QrCode && this.isScanning) {
      try {
        await this.html5QrCode.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      this.isScanning = false;
    }
  },
  
  async onBarcodeDetected(decodedText) {
    await this.stop();
    if (App.Main) App.Main.showLoading();
    
    const product = await this.lookupBarcode(decodedText);
    if (App.Main) App.Main.hideLoading();
    
    this.showScanResult(product || { barcode: decodedText, notFound: true });
  },
  
  async lookupOpenFoodFacts(barcode) {
    try {
      // 1. Zkusit českou Open Food Facts DB
      let res = await fetch(`https://cz.openfoodfacts.org/api/v0/product/${barcode}.json`);
      let data = await res.json();
      
      // 2. Pokud není v CZ, zkusit globální v2 DB
      if (!data || data.status !== 1 || !data.product) {
        res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
        data = await res.json();
      }

      if (!data || !data.product) return null;
      const p = data.product;

      // Získat nejlepší název (CZ > obecný > značka)
      let name = p.product_name_cs || p.product_name || p.generic_name_cs || p.generic_name || '';
      if (p.brands && name && !name.toLowerCase().includes(p.brands.toLowerCase())) {
        name = `${name} (${p.brands})`;
      }

      const imageUrl = p.image_front_url || p.image_url || p.image_small_url || '';
      
      return {
        barcode: barcode,
        name: name || 'Neznámý produkt',
        brand: p.brands || '',
        categoryTags: p.categories_tags || [],
        imageUrl: imageUrl,
        nutrition: {
          energy: p.nutriments?.['energy-kcal_100g'] || p.nutriments?.['energy-kcal'] || null,
          fat: p.nutriments?.fat_100g || null,
          carbs: p.nutriments?.carbohydrates_100g || null,
          protein: p.nutriments?.proteins_100g || null,
          fiber: p.nutriments?.fiber_100g || null,
          salt: p.nutriments?.salt_100g || null
        },
        quantity: 1,
        unit: 'ks'
      };
    } catch (e) {
      console.warn('Open Food Facts lookup failed:', e);
      return null;
    }
  },
  
  async lookupBarcode(barcode) {
    let product = await this.lookupOpenFoodFacts(barcode);
    if (product) {
      product.category = App.AI ? App.AI.classifyItem(product.name) : 'ostatni';
      product.location = App.AI ? App.AI.suggestLocation(product.name, product.category) : 'spiz';
      return product;
    }

    // Pokud není v Open Food Facts, zkusit odhad z AI
    return {
      barcode: barcode,
      name: '',
      category: 'ostatni',
      location: 'spiz',
      notFound: true
    };
  },
  
  showScanResult(productData) {
    const resDiv = document.getElementById('scanner-result');
    if (!resDiv) return;
    resDiv.classList.remove('hidden');
    resDiv.innerHTML = '';
    
    // Zkontrolovat, zda už máme položku se stejným čárovým kódem v inventáři
    const existing = App.Items?.items?.find(it => it.barcode === productData.barcode);

    if (productData.notFound) {
      resDiv.innerHTML = `
        <div style="background: var(--surface); padding: 16px; border-radius: 12px; border: 1px solid var(--border); margin-top: 16px; text-align: center;">
          <p>Kód <strong>${productData.barcode}</strong> nebyl nalezen v databázi.</p>
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button id="btn-scan-add-manual" class="btn-primary flex-1">Zadat ručně s tímto kódem</button>
            <button id="btn-scan-again" class="btn-secondary flex-1">Skenovat další</button>
          </div>
        </div>
      `;

      document.getElementById('btn-scan-add-manual')?.addEventListener('click', () => {
        resDiv.classList.add('hidden');
        if (App.Main) {
          App.Main.navigate('inventory');
          document.getElementById('modal-add-item-title').textContent = 'Přidat potravinu';
          document.getElementById('form-add-item').reset();
          document.getElementById('item-id').value = '';
          document.getElementById('item-barcode').value = productData.barcode;
          App.Main.renderExpirationRows([]);
          App.Main.showModal('modal-add-item');
        }
      });
    } else {
      const priceEst = App.Prices ? App.Prices.priceDB[productData.name.toLowerCase()] : null;
      
      resDiv.innerHTML = `
        <div style="background: var(--surface); padding: 16px; border-radius: 12px; border: 1px solid var(--border); margin-top: 16px;">
          <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 12px;">
            ${productData.imageUrl ? `<img src="${productData.imageUrl}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);">` : '<div style="font-size: 2.5rem;">📦</div>'}
            <div>
              <h3 style="margin: 0; font-size: 1.1rem;">${productData.name}</h3>
              <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">
                ${App.Items?.getCategoryLabel(productData.category)} • ${App.Items?.getLocationLabel(productData.location)}
              </p>
              ${existing ? `<p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--primary); font-weight: bold;">(V inventáři již máte ${existing.quantity} ${existing.unit})</p>` : ''}
            </div>
          </div>
          
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
            ${existing ? `
              <button id="btn-scan-inc-existing" class="btn-success flex-1">Navýšit množství (+1 ${existing.unit})</button>
            ` : ''}
            <button id="btn-scan-add-direct" class="btn-primary flex-1">${existing ? 'Přidat novou šarži' : 'Přidat do zásob'}</button>
            <button id="btn-scan-edit-before" class="btn-secondary flex-1">Upravit před uložením</button>
            <button id="btn-scan-again" class="btn-secondary">Skenovat další</button>
          </div>
        </div>
      `;

      // 1. Navýšit existující
      document.getElementById('btn-scan-inc-existing')?.addEventListener('click', async () => {
        existing.quantity = (existing.quantity || 0) + 1;
        await App.Items.updateItem(existing);
        resDiv.classList.add('hidden');
        if (App.Main) {
          App.Main.showToast(`Množství položky ${existing.name} navýšeno na ${existing.quantity}`, 'success', 2500);
          this.init();
        }
      });

      // 2. Přidat přímo
      document.getElementById('btn-scan-add-direct')?.addEventListener('click', async () => {
        const exp = App.AI ? App.AI.predictExpiration(productData.name, productData.category) : null;
        const priceInfo = App.Prices ? await App.Prices.lookupPrice(productData.name) : null;

        await App.Items.addItem({
          name: productData.name,
          category: productData.category,
          location: productData.location,
          quantity: 1,
          unit: 'ks',
          barcode: productData.barcode,
          imageUrl: productData.imageUrl,
          nutrition: productData.nutrition,
          price: priceInfo ? priceInfo.price : null,
          expirations: exp ? [exp] : []
        });

        resDiv.classList.add('hidden');
        if (App.Main) {
          App.Main.showToast(`Položka ${productData.name} byla přidána.`, 'success', 2500);
          this.init();
        }
      });

      // 3. Upravit před uložením
      document.getElementById('btn-scan-edit-before')?.addEventListener('click', async () => {
        resDiv.classList.add('hidden');
        if (App.Main) {
          App.Main.navigate('inventory');
          document.getElementById('modal-add-item-title').textContent = 'Přidat potravinu';
          document.getElementById('form-add-item').reset();
          document.getElementById('item-id').value = '';
          document.getElementById('item-name').value = productData.name;
          document.getElementById('item-category').value = productData.category;
          document.getElementById('item-location').value = productData.location;
          document.getElementById('item-quantity').value = 1;
          document.getElementById('item-unit').value = 'ks';
          document.getElementById('item-barcode').value = productData.barcode;
          
          const priceInfo = App.Prices ? await App.Prices.lookupPrice(productData.name) : null;
          if (priceInfo) {
            document.getElementById('item-price').value = priceInfo.price;
          }

          if (productData.nutrition) {
            if (document.getElementById('input-nut-energy')) document.getElementById('input-nut-energy').value = productData.nutrition.energy || '';
            if (document.getElementById('input-nut-fat')) document.getElementById('input-nut-fat').value = productData.nutrition.fat || '';
            if (document.getElementById('input-nut-carbs')) document.getElementById('input-nut-carbs').value = productData.nutrition.carbs || '';
            if (document.getElementById('input-nut-protein')) document.getElementById('input-nut-protein').value = productData.nutrition.protein || '';
            if (document.getElementById('input-nut-fiber')) document.getElementById('input-nut-fiber').value = productData.nutrition.fiber || '';
            if (document.getElementById('input-nut-salt')) document.getElementById('input-nut-salt').value = productData.nutrition.salt || '';
          }

          const exp = App.AI ? App.AI.predictExpiration(productData.name, productData.category) : null;
          App.Main.renderExpirationRows(exp ? [exp] : []);

          App.Main.showModal('modal-add-item');
        }
      });
    }

    document.getElementById('btn-scan-again')?.addEventListener('click', () => {
      resDiv.classList.add('hidden');
      this.init();
    });
  },
  
  async scanReceipt(imageFile) {
    const processingDiv = document.getElementById('receipt-processing');
    const resultsDiv = document.getElementById('receipt-results');
    if (processingDiv) processingDiv.classList.remove('hidden');
    if (resultsDiv) resultsDiv.innerHTML = '';

    try {
      if (typeof Tesseract === 'undefined') {
        throw new Error('Tesseract OCR knihovna není načtena.');
      }

      const worker = await Tesseract.createWorker('ces');
      const { data: { text } } = await worker.recognize(imageFile);
      await worker.terminate();
      
      const items = await (App.AI ? App.AI.parseReceiptText(text) : []);
      if (processingDiv) processingDiv.classList.add('hidden');
      
      if (resultsDiv) {
        if (items.length === 0) {
          resultsDiv.innerHTML = '<p style="text-align:center; padding: 16px;">Na účtence nebyly rozpoznány žádné položky. Zkuste prosím fotku s lepším osvětlením.</p>';
          return;
        }

        resultsDiv.innerHTML = `
          <div style="background: var(--surface); padding: 16px; border-radius: 12px; border: 1px solid var(--border); margin-top: 16px;">
            <h4 style="margin-bottom: 12px;">Rozpoznané položky z účtenky (${items.length}):</h4>
            <div id="receipt-items-checklist" style="display: flex; flex-direction: column; gap: 8px; max-height: 250px; overflow-y: auto;">
              ${items.map((it, i) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; border-bottom: 1px solid var(--border);">
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex: 1;">
                    <input type="checkbox" checked data-idx="${i}" class="receipt-item-cb">
                    <span><strong>${it.name}</strong> (${it.quantity} ${it.unit})</span>
                  </label>
                  <span style="font-size: 0.85rem; color: var(--text-secondary);">${it.price ? it.price + ' Kč' : ''}</span>
                </div>
              `).join('')}
            </div>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
              <button id="btn-confirm-receipt-items" class="btn-primary flex-1">Přidat vybrané do zásob</button>
            </div>
          </div>
        `;

        document.getElementById('btn-confirm-receipt-items')?.addEventListener('click', async () => {
          const checkboxes = document.querySelectorAll('.receipt-item-cb:checked');
          let addedCount = 0;
          for (let cb of checkboxes) {
            const idx = parseInt(cb.dataset.idx);
            const item = items[idx];
            if (item) {
              await App.Items.addItem(item);
              addedCount++;
            }
          }
          if (App.Main) {
            App.Main.showToast(`Z účtenky bylo přidáno ${addedCount} položek.`, 'success', 2500);
            resultsDiv.innerHTML = '';
            App.Main.navigate('inventory');
          }
        });
      }
    } catch (e) {
      console.error('Receipt OCR error:', e);
      if (processingDiv) processingDiv.classList.add('hidden');
      if (App.Main) App.Main.showToast('Chyba při čtení účtenky: ' + e.message, 'error', 3000);
    }
  },
  
  setupScannerUI() {
    // 1. Manuální zadání čárového kódu
    const btnManual = document.getElementById('btn-barcode-submit');
    const inputManual = document.getElementById('input-barcode-manual');
    if (btnManual && inputManual) {
      const submitCode = () => {
        const code = inputManual.value.trim();
        if (code) this.onBarcodeDetected(code);
      };
      btnManual.addEventListener('click', submitCode);
      inputManual.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitCode();
      });
    }

    // 2. Účtenka - výběr ze souboru
    const receiptFileInput = document.getElementById('input-receipt-file');
    if (receiptFileInput) {
      receiptFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.scanReceipt(e.target.files[0]);
        }
      });
    }

    // 3. Účtenka - tlačítko Vyfotit účtenku (vyvolá nativní fotoaparát)
    const btnCapture = document.getElementById('btn-capture-receipt');
    if (btnCapture && receiptFileInput) {
      btnCapture.addEventListener('click', () => {
        receiptFileInput.setAttribute('capture', 'environment');
        receiptFileInput.click();
      });
    }

    // 4. Přepínání záložek Čárový kód vs Účtenka
    const tabs = document.querySelectorAll('.scanner-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const target = tab.dataset.target;
        const barcodeArea = document.getElementById('scanner-barcode-area');
        const receiptArea = document.getElementById('receipt-scan-area');

        if (target === 'barcode') {
          if (barcodeArea) barcodeArea.classList.remove('hidden');
          if (receiptArea) receiptArea.classList.add('hidden');
          this.init();
        } else {
          if (barcodeArea) barcodeArea.classList.add('hidden');
          if (receiptArea) receiptArea.classList.remove('hidden');
          this.stop();
        }
      });
    });
  }
};

