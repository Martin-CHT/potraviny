window.App = window.App || {};

App.Prices = {
  // Databáze průměrných českých maloobchodních cen (Kč) dle Kupi.cz / ČSÚ
  priceDB: {
    // Mléčné výrobky
    'mléko': 24.90, 'mléko čerstvé': 26.90, 'trvanlivé mléko': 23.90,
    'jogurt': 15.90, 'bílý jogurt': 13.90, 'ovocný jogurt': 16.90, 'skyr': 24.90,
    'sýr': 39.90, 'eidam': 34.90, 'gouda': 39.90, 'hermelín': 39.90, 'mozzarella': 27.90, 'camembert': 39.90, 'niva': 36.90, 'čedar': 49.90,
    'máslo': 59.90, 'pomazánkové máslo': 34.90,
    'tvaroh': 26.90, 'smetana': 24.90, 'šlehačka': 29.90, 'zakysaná smetana': 21.90,
    'kefír': 22.90, 'lučina': 32.90, 'cottage': 29.90, 'vejce': 49.90,

    // Maso a uzeniny
    'kuřecí prsa': 169.00, 'kuřecí stehna': 109.00, 'kuře': 89.90,
    'vepřová krkovice': 149.00, 'vepřová kotleta': 139.00, 'vepřová pečeně': 139.00, 'vepřová panenka': 229.00,
    'hovězí zadní': 249.00, 'hovězí přední': 199.00, 'mleté maso': 119.00,
    'šunka': 34.90, 'dušená šunka': 29.90, 'prosciutto': 59.90,
    'salám': 29.90, 'vysočina': 32.90, 'poličan': 36.90, 'turista': 29.90,
    'párky': 89.90, 'vídeňské párky': 99.90, 'klobása': 49.90, 'špekáčky': 99.00,
    'slanina': 39.90, 'losos': 99.90, 'treska': 79.90, 'rybí prsty': 59.90,

    // Ovoce a zelenina
    'jablko': 39.90, 'jablka': 39.90, 'banán': 34.90, 'banány': 34.90,
    'pomeranč': 44.90, 'pomeranče': 44.90, 'citron': 49.90, 'citrony': 49.90, 'mandarinky': 49.90,
    'jahody': 69.90, 'borůvky': 59.90, 'hrozny': 79.90, 'meloun': 29.90,
    'rajče': 69.90, 'rajčata': 69.90, 'cherry rajčata': 39.90,
    'okurka': 24.90, 'okurky': 24.90, 'paprika': 79.90, 'papriky': 79.90,
    'mrkev': 19.90, 'petržel': 39.90, 'celer': 29.90, 'cibule': 22.90, 'česnek': 29.90,
    'brambory': 24.90, 'salát': 29.90, 'ledový salát': 29.90, 'špenát': 34.90, 'brokolice': 39.90, 'květák': 49.90,

    // Pečivo
    'chleba': 39.90, 'chléb': 39.90, 'rohlík': 2.90, 'houska': 3.50, 'bageta': 19.90, 'toastový chléb': 29.90,
    'croissant': 17.90, 'koláč': 22.90, 'buchta': 19.90, 'vánočka': 59.90,

    // Nápoje
    'džus': 39.90, 'limonáda': 29.90, 'kofola': 36.90, 'coca cola': 39.90,
    'pivo': 18.90, 'pilsner': 29.90, 'víno': 119.00, 'minerálka': 15.90, 'mattoni': 16.90,
    'káva': 129.00, 'čaj': 45.00,

    // Mražené a konzervy
    'zmrzlina': 99.90, 'mražená zelenina': 49.90, 'hranolky': 49.90, 'pizza mražená': 79.90,
    'tuňák v konzervě': 45.90, 'tuňák': 45.90, 'fazole': 29.90, 'kukuřice': 26.90, 'hrášek': 24.90,
    'paštika': 26.90, 'májka': 24.90, 'protlak': 22.90, 'drcená rajčata': 32.90, 'okurky sterilované': 39.90,

    // Suché potraviny a dochucovadla
    'mouka': 19.90, 'hladká mouka': 19.90, 'polohrubá mouka': 19.90, 'cukr': 26.90,
    'rýže': 45.90, 'těstoviny': 34.90, 'špagety': 34.90, 'olej': 49.90, 'olivový olej': 179.00,
    'sůl': 14.90, 'pepř': 29.90, 'kečup': 49.90, 'hořčice': 19.90, 'tatarka': 39.90, 'majonéza': 39.90,
    'čokoláda': 39.90, 'sušenky': 24.90, 'chipsy': 39.90, 'med': 139.00, 'džem': 49.90
  },
  
  async lookupPrice(name) {
    if (!name) return null;
    const lowerName = name.toLowerCase().trim();
    
    // 1. Přesná nebo částečná shoda ve vestavěné DB
    for (let key in this.priceDB) {
      if (lowerName === key || lowerName.includes(key) || key.includes(lowerName)) {
        return { price: this.priceDB[key], source: 'DB' };
      }
    }

    // Rozdělit slova a zkusit hledat hlavní podstatné jméno
    const words = lowerName.split(' ');
    for (let w of words) {
      if (w.length > 3 && this.priceDB[w]) {
        return { price: this.priceDB[w], source: 'DB' };
      }
    }
    
    // 2. AI vyhledání průměrné ceny na českém internetu (např. kupi.cz)
    if (App.AI && typeof App.AI.queryAI === 'function') {
      const prompt = `Jaká je aktuální průměrná cena v českých obchodech v Kč (např. dle Kupi.cz/akce) pro položku "${name}"? Odpověz POUZE samotným číslem (např. 39.90).`;
      const res = await App.AI.queryAI(prompt);
      if (res) {
        const num = parseFloat(res.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num) && num > 0) return { price: num, source: 'AI' };
      }
    }
    
    return null;
  },
  
  async updateAllPrices() {
    const auto = await App.DB.getSetting('toggle-auto-prices') || await App.DB.getSetting('autoPricesEnabled');
    if (auto === false) return;
    
    if (App.Main) App.Main.showLoading();
    
    const items = await App.DB.getAll('items');
    let updated = 0;
    
    for (let it of items) {
      // Pokud byla cena nastavena ručně uživatelem, nepřepisovat!
      if (!it.priceManuallySet) {
        const p = await this.lookupPrice(it.name);
        if (p && p.price !== it.price) {
          it.price = p.price;
          it.priceLastUpdated = new Date().toISOString();
          await App.DB.put('items', it);
          updated++;
        }
      }
    }
    
    if (App.Items) {
      await App.Items.loadItems();
      App.Items.renderItems();
    }
    if (App.Main) {
      App.Main.hideLoading();
      App.Main.showToast(`Aktualizováno cen: ${updated}`, 'success', 2000);
    }
  },
  
  async refreshPrice(itemId) {
    const it = await App.DB.get('items', itemId);
    if (!it) return;
    
    if (App.Main) App.Main.showLoading();
    const p = await this.lookupPrice(it.name);
    if (App.Main) App.Main.hideLoading();

    if (p) {
      it.price = p.price;
      it.priceManuallySet = false; // Reset ruční úpravy
      it.priceLastUpdated = new Date().toISOString();
      await App.DB.put('items', it);
      if (App.Items) {
        await App.Items.loadItems();
        App.Items.renderItems();
      }
      if (App.Main) App.Main.showToast(`Cena aktualizována na ${p.price} Kč`, 'success', 2000);
    } else {
      if (App.Main) App.Main.showToast('Cenu se nepodařilo najít.', 'warning', 2000);
    }
  },
  
  async setManualPrice(itemId, price) {
    const it = await App.DB.get('items', itemId);
    if (!it) return;
    
    it.price = parseFloat(price) || null;
    it.priceManuallySet = true;
    it.priceLastUpdated = new Date().toISOString();
    
    await App.DB.put('items', it);
    if (App.Items) {
      await App.Items.loadItems();
      App.Items.renderItems();
    }
  },

  setupPriceUI() {
    const btn = document.getElementById('btn-update-prices');
    if (btn) btn.addEventListener('click', () => this.updateAllPrices());
  }
};

