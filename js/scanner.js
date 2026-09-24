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

      // Získat název (CZ > obecný > značka)
      let rawName = p.product_name_cs || p.product_name || p.generic_name_cs || p.generic_name || '';
      
      // Normalizovat na čistý český název
      const name = App.AI ? App.AI.normalizeToCzech(rawName, null, p.brands || '') : (rawName || 'Potravina');
      const category = App.AI ? App.AI.classifyItem(name) : 'ostatni';
      const location = App.AI ? App.AI.suggestLocation(name, category) : 'spiz';

      const imageUrl = p.image_front_url || p.image_url || p.image_small_url || '';
      
      // Získat nutriční hodnoty z Open Food Facts nebo predikovat
      const predictedNut = App.AI ? App.AI.predictNutrition(name, category) : {};
      const nutrition = {
        energy: p.nutriments?.['energy-kcal_100g'] || p.nutriments?.['energy-kcal'] || predictedNut.energy || null,
        fat: p.nutriments?.fat_100g !== undefined && p.nutriments?.fat_100g !== null ? p.nutriments.fat_100g : (predictedNut.fat ?? null),
        carbs: p.nutriments?.carbohydrates_100g !== undefined && p.nutriments?.carbohydrates_100g !== null ? p.nutriments.carbohydrates_100g : (predictedNut.carbs ?? null),
        protein: p.nutriments?.proteins_100g !== undefined && p.nutriments?.proteins_100g !== null ? p.nutriments.proteins_100g : (predictedNut.protein ?? null),
        fiber: p.nutriments?.fiber_100g !== undefined && p.nutriments?.fiber_100g !== null ? p.nutriments.fiber_100g : (predictedNut.fiber ?? null),
        salt: p.nutriments?.salt_100g !== undefined && p.nutriments?.salt_100g !== null ? p.nutriments.salt_100g : (predictedNut.salt ?? null)
      };

      return {
        barcode: barcode,
        name: name,
        brand: p.brands || '',
        category: category,
        location: location,
        imageUrl: imageUrl,
        nutrition: nutrition,
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
      return product;
    }

    // Pokud není v Open Food Facts, zkusit odhad z AI
    return {
      barcode: barcode,
      name: '',
      category: 'ostatni',
      location: 'spiz',
      nutrition: App.AI ? App.AI.predictNutrition('', 'ostatni') : null,
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
  
  // Zpracování PDF účtenky (přímá extrakce textu nebo render do canvasu pro OCR)
  async extractTextFromPDF(file) {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js knihovna není načtena.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    // 1. Zkusit nativní extrakci textu ze všech stránek
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    // Pokud PDF obsahuje čitelný text (digitální účtenka z Lidlu, Kauflandu, Košíku, Rohlíku...)
    if (fullText.trim().length > 30) {
      return { text: fullText, isDirectText: true };
    }

    // 2. Pokud je to naskenované PDF bez textu, vykreslit 1. stránku do canvasu pro OCR
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    
    return { canvas: canvas, isDirectText: false };
  },

  // Předzpracování obrázku pro maximální OCR přesnost
  async preprocessImageForOCR(imageSource) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 2200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Grayscale a adaptivní kontrast
        for (let i = 0; i < data.length; i += 4) {
          const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // Zvýraznění textu účtenky
          const val = avg < 145 ? Math.max(0, avg * 0.7) : Math.min(255, avg * 1.2);
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas);
      };
      img.onerror = () => resolve(imageSource);

      if (imageSource instanceof Blob || imageSource instanceof File) {
        img.src = URL.createObjectURL(imageSource);
      } else if (typeof imageSource === 'string') {
        img.src = imageSource;
      } else {
        resolve(imageSource);
      }
    });
  },

  async scanReceipt(file) {
    const processingDiv = document.getElementById('receipt-processing');
    const statusText = document.getElementById('receipt-processing-status');
    const resultsDiv = document.getElementById('receipt-results');
    
    if (processingDiv) processingDiv.classList.remove('hidden');
    if (statusText) statusText.textContent = 'Čtu účtenku...';
    if (resultsDiv) resultsDiv.innerHTML = '';

    try {
      let text = '';
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (isPDF) {
        if (statusText) statusText.textContent = 'Analyzuji PDF soubor...';
        const pdfResult = await this.extractTextFromPDF(file);
        if (pdfResult.isDirectText) {
          text = pdfResult.text;
        } else if (pdfResult.canvas) {
          if (statusText) statusText.textContent = 'Rozpoznávám text z PDF účtenky (OCR)...';
          if (typeof Tesseract === 'undefined') throw new Error('Tesseract OCR není načten.');
          const worker = await Tesseract.createWorker(['ces', 'eng']);
          const { data: { text: ocrText } } = await worker.recognize(pdfResult.canvas);
          await worker.terminate();
          text = ocrText;
        }
      } else {
        if (statusText) statusText.textContent = 'Optimalizuji obrázek a provádím OCR...';
        if (typeof Tesseract === 'undefined') throw new Error('Tesseract OCR není načten.');
        
        const preprocessed = await this.preprocessImageForOCR(file);
        const worker = await Tesseract.createWorker(['ces', 'eng']);
        const { data: { text: ocrText } } = await worker.recognize(preprocessed);
        await worker.terminate();
        text = ocrText;
      }

      if (statusText) statusText.textContent = 'Kategorizuji rozpoznané položky...';
      const items = await (App.AI ? App.AI.parseReceiptText(text) : []);
      
      if (processingDiv) processingDiv.classList.add('hidden');
      
      if (resultsDiv) {
        if (items.length === 0) {
          resultsDiv.innerHTML = `
            <div style="background: var(--surface); padding: 16px; border-radius: 12px; border: 1px solid var(--border); margin-top: 16px; text-align: center;">
              <p>Na účtence nebyly automaticky rozpoznány položky.</p>
              <p class="text-small text-muted">Zkuste nahrát fotografii s lepším osvětlením, digitální PDF nebo zadejte položky hlasem či čárovým kódem.</p>
            </div>
          `;
          return;
        }

        resultsDiv.innerHTML = `
          <div style="background: var(--surface); padding: 16px; border-radius: 12px; border: 1px solid var(--border); margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h4 style="margin: 0;">Rozpoznané položky z účtenky (${items.length}):</h4>
              <button type="button" id="btn-toggle-all-receipt" class="btn-text text-small">Odznačit vše</button>
            </div>
            <div id="receipt-items-checklist" style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto;">
              ${items.map((it, i) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; border-bottom: 1px solid var(--border); background: var(--background); border-radius: 6px;">
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex: 1;">
                    <input type="checkbox" checked data-idx="${i}" class="receipt-item-cb">
                    <span>
                      <strong>${it.name}</strong> 
                      <span class="text-muted" style="font-size: 0.85rem;">(${it.quantity} ${it.unit}) • ${App.Items?.getLocationLabel(it.location)}</span>
                    </span>
                  </label>
                  <span style="font-size: 0.9rem; font-weight: bold; color: var(--primary);">${it.price ? it.price.toFixed(2) + ' Kč' : ''}</span>
                </div>
              `).join('')}
            </div>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
              <button id="btn-confirm-receipt-items" class="btn-primary flex-1">Přidat vybrané do zásob</button>
            </div>
          </div>
        `;

        document.getElementById('btn-toggle-all-receipt')?.addEventListener('click', (e) => {
          const cbs = document.querySelectorAll('.receipt-item-cb');
          const allChecked = Array.from(cbs).every(c => c.checked);
          cbs.forEach(c => c.checked = !allChecked);
          e.target.textContent = allChecked ? 'Označit vše' : 'Odznačit vše';
        });

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
      console.error('Receipt processing error:', e);
      if (processingDiv) processingDiv.classList.add('hidden');
      if (App.Main) App.Main.showToast('Chyba při zpracování účtenky: ' + e.message, 'error', 3500);
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

