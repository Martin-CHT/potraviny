window.App = window.App || {};

App.AI = {
  // Rozšířená databáze běžné trvanlivosti potravin a výchozích umístění pro české domácnosti
  shelfLifeDB: [
    // Mléčné výrobky
    { keywords: ['mléko čerstvé', 'čerstvé mléko', 'mléko'], category: 'mlecne', days: 7, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['trvanlivé mléko', 'mléko uht', 'uht'], category: 'mlecne', days: 90, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['jogurt', 'bílý jogurt', 'ovocný jogurt', 'actimel', 'skyre', 'skyr', 'pribináček'], category: 'mlecne', days: 21, location: 'lednice', type: 'minimalni_trvanlivost' },
    { keywords: ['sýr', 'eidam', 'gouda', 'eidam 30%', 'eidam 45%', 'čedar', 'cheddar', 'parmezán', 'mozzarella', 'balkánský', 'hermelín', 'camembert', 'niva'], category: 'mlecne', days: 25, location: 'lednice', type: 'minimalni_trvanlivost' },
    { keywords: ['tvaroh', 'tvaroh měkký', 'tvaroh tvrdý'], category: 'mlecne', days: 10, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['máslo', 'čerstvé máslo', 'pomazánkové máslo'], category: 'mlecne', days: 40, location: 'lednice', type: 'minimalni_trvanlivost' },
    { keywords: ['smetana', 'šlehačka', 'zakysaná smetana', 'crème fraîche'], category: 'mlecne', days: 14, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['kefír', 'podmáslí', 'acidofilní mléko', 'kyška'], category: 'mlecne', days: 14, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['lučina', 'žervé', 'cottage', 'ricotta'], category: 'mlecne', days: 14, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['vejce', 'vajíčka'], category: 'mlecne', days: 28, location: 'lednice', type: 'minimalni_trvanlivost' },

    // Maso a uzeniny
    { keywords: ['kuřecí prsa', 'kuřecí stehna', 'kuřecí maso', 'kuře', 'krůtí maso', 'krůtí prsa'], category: 'maso', days: 3, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['vepřové', 'krkovice', 'kotleta', 'vepřová pečeně', 'panenka', 'bůček'], category: 'maso', days: 4, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['hovězí', 'zadní hovězí', 'roštěná', 'svíčková', 'gulášové maso'], category: 'maso', days: 5, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['mleté maso', 'mleté', 'mix hovězí vepřové', 'tatarák'], category: 'maso', days: 2, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['šunka', 'vepřová šunka', 'kuřecí šunka', 'dušená šunka', 'prosciutto'], category: 'maso', days: 5, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['salám', 'vysočina', 'poličan', 'turista', 'paprikáš', 'uherák'], category: 'maso', days: 45, location: 'lednice', type: 'minimalni_trvanlivost' },
    { keywords: ['klobása', 'klobásy', 'špekáčky', 'špekáček'], category: 'maso', days: 14, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['párek', 'párky', 'vídeňské párky', 'debrecínské párky'], category: 'maso', days: 7, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['slanina', 'anglická slanina', 'špek'], category: 'maso', days: 21, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['ryba', 'losos', 'treska', 'kapr', 'pstruh', 'tuňák čerstvý'], category: 'maso', days: 2, location: 'lednice', type: 'spotrebujte_do' },

    // Ovoce
    { keywords: ['jablko', 'jablka', 'golden', 'gala'], category: 'ovoce_zelenina', days: 28, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['banán', 'banány'], category: 'ovoce_zelenina', days: 6, location: 'police', type: 'minimalni_trvanlivost' },
    { keywords: ['pomeranč', 'pomeranče', 'citron', 'citrony', 'mandarinka', 'mandarinky', 'grep', 'limetka'], category: 'ovoce_zelenina', days: 14, location: 'lednice', type: 'minimalni_trvanlivost' },
    { keywords: ['jahody', 'maliny', 'borůvky', 'ostružiny'], category: 'ovoce_zelenina', days: 3, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['hrozny', 'hroznové víno'], category: 'ovoce_zelenina', days: 8, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['kiwi', 'mango', 'avokádo'], category: 'ovoce_zelenina', days: 7, location: 'police', type: 'minimalni_trvanlivost' },
    { keywords: ['meloun', 'vodní meloun'], category: 'ovoce_zelenina', days: 7, location: 'lednice', type: 'spotrebujte_do' },

    // Zelenina
    { keywords: ['rajče', 'rajčata', 'cherry rajčata'], category: 'ovoce_zelenina', days: 7, location: 'police', type: 'minimalni_trvanlivost' },
    { keywords: ['okurka', 'hadovka', 'polní okurky'], category: 'ovoce_zelenina', days: 10, location: 'lednice', type: 'minimalni_trvanlivost' },
    { keywords: ['paprika', 'papriky', 'kapie'], category: 'ovoce_zelenina', days: 10, location: 'lednice', type: 'minimalni_trvanlivost' },
    { keywords: ['mrkev', 'petržel', 'celer', 'kořenová zelenina'], category: 'ovoce_zelenina', days: 28, location: 'lednice', type: 'minimalni_trvanlivost' },
    { keywords: ['cibule', 'česnek', 'šalotka'], category: 'ovoce_zelenina', days: 60, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['brambory', 'brambor'], category: 'ovoce_zelenina', days: 60, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['salát', 'ledový salát', 'hlávkový salát', 'římský salát'], category: 'ovoce_zelenina', days: 6, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['špenát', 'rukola', 'polníček'], category: 'ovoce_zelenina', days: 4, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['brokolice', 'květák'], category: 'ovoce_zelenina', days: 7, location: 'lednice', type: 'spotrebujte_do' },
    { keywords: ['cuketa', 'lilek'], category: 'ovoce_zelenina', days: 10, location: 'lednice', type: 'minimalni_trvanlivost' },
    { keywords: ['žampiony', 'houby'], category: 'ovoce_zelenina', days: 5, location: 'lednice', type: 'spotrebujte_do' },

    // Pečivo
    { keywords: ['chleba', 'chléb', 'šumava', 'kvasový chléb'], category: 'pecivo', days: 5, location: 'spiz', type: 'spotrebujte_do' },
    { keywords: ['rohlík', 'rohlíky', 'houska', 'housky'], category: 'pecivo', days: 2, location: 'spiz', type: 'spotrebujte_do' },
    { keywords: ['toastový chléb', 'toustový chléb', 'toast'], category: 'pecivo', days: 10, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['bageta', 'kaiserka'], category: 'pecivo', days: 2, location: 'spiz', type: 'spotrebujte_do' },
    { keywords: ['croissant', 'koláč', 'buchta', 'šáteček', 'kobliha', 'vánočka', 'mazanec'], category: 'pecivo', days: 3, location: 'spiz', type: 'spotrebujte_do' },
    { keywords: ['dort', 'zákusek', 'chlebíčky'], category: 'pecivo', days: 3, location: 'lednice', type: 'spotrebujte_do' },

    // Nápoje
    { keywords: ['džus', 'šťáva', 'juice'], category: 'napoje', days: 180, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['limonáda', 'kofola', 'coca cola', 'pepsi', 'fanta', 'sprite'], category: 'napoje', days: 180, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['pivo', 'ležák', 'pilsner', 'kozel', 'radegast', 'birell'], category: 'napoje', days: 180, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['víno', 'bílé víno', 'červené víno', 'prosecco'], category: 'napoje', days: 365, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['minerálka', 'voda', 'mattoni', 'magnesia', 'rajec', 'korunní'], category: 'napoje', days: 365, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['káva', 'zrnková káva', 'mletá káva', 'čaj'], category: 'napoje', days: 365, location: 'spiz', type: 'minimalni_trvanlivost' },

    // Mražené
    { keywords: ['zmrzlina', 'nanuk', 'míša', 'magnum'], category: 'mrazene', days: 365, location: 'mrazak', type: 'minimalni_trvanlivost' },
    { keywords: ['mražená zelenina', 'hranolky', 'mražený hrášek', 'špenát mražený'], category: 'mrazene', days: 365, location: 'mrazak', type: 'minimalni_trvanlivost' },
    { keywords: ['mražené maso', 'rybí prsty', 'mražené kuře'], category: 'mrazene', days: 180, location: 'mrazak', type: 'minimalni_trvanlivost' },
    { keywords: ['pizza mražená', 'mražená pizza'], category: 'mrazene', days: 180, location: 'mrazak', type: 'minimalni_trvanlivost' },

    // Konzervy a trvanlivé
    { keywords: ['konzerva', 'hotové jídlo'], category: 'konzervy', days: 730, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['fazole plechovka', 'hrášek plechovka', 'kukuřice plechovka', 'fazole', 'cizrna'], category: 'konzervy', days: 730, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['tuňák v konzervě', 'sardinky', 'rybičky', 'tuňák'], category: 'konzervy', days: 1095, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['paštika', 'májka', 'játrovka'], category: 'konzervy', days: 365, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['protlak', 'rajčatový protlak', 'drcená rajčata', 'passata'], category: 'konzervy', days: 730, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['okurky sterilované', 'znojmia', 'sterilovaný hrášek', 'kompot'], category: 'konzervy', days: 730, location: 'spiz', type: 'minimalni_trvanlivost' },

    // Koření a dochucovadla
    { keywords: ['sůl', 'pepř', 'paprika mletá', 'kmín', 'vegeta'], category: 'koreni', days: 1095, location: 'suplik', type: 'minimalni_trvanlivost' },
    { keywords: ['oregano', 'bazalka', 'majoránka', 'bobkový list', 'nové koření'], category: 'koreni', days: 730, location: 'suplik', type: 'minimalni_trvanlivost' },
    { keywords: ['skořice', 'curry', 'kari', 'kurkuma', 'zázvor mletý'], category: 'koreni', days: 730, location: 'suplik', type: 'minimalni_trvanlivost' },
    { keywords: ['kečup', 'hořčice', 'tatarka', 'majonéza'], category: 'koreni', days: 180, location: 'lednice', type: 'minimalni_trvanlivost' },
    { keywords: ['sójová omáčka', 'worcester', 'tabasco'], category: 'koreni', days: 365, location: 'spiz', type: 'minimalni_trvanlivost' },

    // Sladkosti a snacky
    { keywords: ['čokoláda', 'studentská pečeť', 'milka', 'orion'], category: 'sladkosti', days: 365, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['sušenky', 'opavia', 'fidorka', 'tatranky', 'horalky', 'bebe'], category: 'sladkosti', days: 180, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['bonbóny', 'haribo', 'gumové medvídky'], category: 'sladkosti', days: 365, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['med', 'džem', 'marmeláda', 'jahodový džem'], category: 'sladkosti', days: 730, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['nutella', 'arašídové máslo'], category: 'sladkosti', days: 365, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['chipsy', 'brambůrky', 'křupky', 'tyčinky', 'oříšky'], category: 'sladkosti', days: 120, location: 'spiz', type: 'minimalni_trvanlivost' },

    // Ostatní suché potraviny
    { keywords: ['mouka', 'hladká mouka', 'polohrubá mouka', 'hrubá mouka', 'pšeničná mouka', 'žitná mouka'], category: 'ostatni', days: 240, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['cukr', 'krystal', 'cukr moučka', 'třtinový cukr'], category: 'ostatni', days: 1095, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['rýže', 'basmati', 'jasmínová rýže'], category: 'ostatni', days: 730, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['těstoviny', 'špagety', 'kolínka', 'penne', 'vřetena'], category: 'ostatni', days: 730, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['olej', 'slunečnicový olej', 'řepkový olej', 'olivový olej'], category: 'ostatni', days: 365, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['ocet', 'jablečný ocet', 'balsamico'], category: 'ostatni', days: 1095, location: 'spiz', type: 'minimalni_trvanlivost' },
    { keywords: ['droždí', 'kvasnice'], category: 'ostatni', days: 14, location: 'lednice', type: 'spotrebujte_do' }
  ],

  // Předpověď data spotřeby
  predictExpiration(name, category = null) {
    const n = (name || '').toLowerCase().trim();
    for (let entry of this.shelfLifeDB) {
      if ((!category || entry.category === category) && entry.keywords.some(k => n.includes(k))) {
        const date = new Date();
        date.setDate(date.getDate() + entry.days);
        return {
          id: crypto.randomUUID(),
          date: date.toISOString().split('T')[0],
          type: entry.type,
          quantity: 1,
          aiPredicted: true
        };
      }
    }
    // Výchozí odhad: 30 dní
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    return {
      id: crypto.randomUUID(),
      date: defaultDate.toISOString().split('T')[0],
      type: 'minimalni_trvanlivost',
      quantity: 1,
      aiPredicted: true
    };
  },

  classifyItem(name) {
    const n = (name || '').toLowerCase().trim();
    for (let entry of this.shelfLifeDB) {
      if (entry.keywords.some(k => n.includes(k))) {
        return entry.category;
      }
    }
    return 'ostatni';
  },

  suggestLocation(name, category = null) {
    const n = (name || '').toLowerCase().trim();
    for (let entry of this.shelfLifeDB) {
      if ((!category || entry.category === category) && entry.keywords.some(k => n.includes(k))) {
        return entry.location;
      }
    }
    if (category === 'mrazene') return 'mrazak';
    if (category === 'mlecne' || category === 'maso') return 'lednice';
    if (category === 'koreni') return 'suplik';
    return 'spiz';
  },

  // Dotaz na OpenAI / Gemini API pokud je nastaven API klíč
  async queryAI(prompt) {
    try {
      const apiKey = await App.DB.getSetting('aiApiKey') || await App.DB.getSetting('input-ai-api-key');
      if (!apiKey) return null;

      // Pokud klíč začíná AIza -> Gemini API
      if (apiKey.startsWith('AIza')) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      } else {
        // OpenAI API
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2
          })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
      }
    } catch (e) {
      console.warn('AI API query failed, using offline heuristic:', e);
      return null;
    }
  },

  // Zpracování textu z hlasového diktování
  async parseVoiceText(text) {
    if (!text || !text.trim()) return [];

    // 1. Zkusit online AI pokud je API klíč
    const prompt = `Převeď tento český text nákupu/potravin do formátu JSON pole objektů. Každý objekt má klíče:
- name: string (čistý název položky s velkým počátečním písmenem, např. "Polotučné mléko", bez lokací jako 'do lednice')
- quantity: number (množství, např. 3)
- unit: string ('ks' | 'kg' | 'g' | 'l' | 'ml' | 'baleni' | 'sacek')
- category: string ('mlecne' | 'maso' | 'ovoce_zelenina' | 'pecivo' | 'napoje' | 'mrazene' | 'konzervy' | 'koreni' | 'sladkosti' | 'ostatni')
- location: string ('lednice' | 'mrazak' | 'spiz' | 'suplik' | 'skrin' | 'police' | 'ostatni')
- expirationType: string ('spotrebujte_do' | 'minimalni_trvanlivost')

Vrať POUZE validní JSON pole, nic jiného.
Text k analýze: "${text}"`;

    const aiRes = await this.queryAI(prompt);
    if (aiRes) {
      try {
        const cleanJson = aiRes.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(it => {
            const exp = this.predictExpiration(it.name, it.category);
            if (it.expirationType) exp.type = it.expirationType;
            return {
              name: it.name || 'Položka',
              quantity: Number(it.quantity) || 1,
              unit: it.unit || 'ks',
              category: it.category || this.classifyItem(it.name),
              location: it.location || this.suggestLocation(it.name, it.category),
              expirations: [exp]
            };
          });
        }
      } catch (e) {
        console.warn('Failed to parse AI response JSON:', e);
      }
    }

    // 2. Propracovaný Offline NLP parser pro češtinu
    return this.parseVoiceTextOffline(text);
  },

  // Offline pravidlový analyzátor pro hlasové příkazy v češtině
  parseVoiceTextOffline(rawText) {
    let clean = rawText.toLowerCase().trim();
    // Odstranit úvodní fráze
    clean = clean.replace(/^(přidej|zapiš|nakup|koupil jsem|přidat|vlož|dej)\s+/i, '');

    // Rozdělit podle spojek
    const clauses = clean.split(/\s+(?:a\s+také|a\s+taky|a\s+další|a\s+navíc|a|i|,)\s+/i);
    const results = [];

    const czechNumbers = {
      'půl': 0.5, 'půlka': 0.5, 'půlku': 0.5,
      'jeden': 1, 'jedno': 1, 'jedna': 1, 'jednu': 1,
      'dva': 2, 'dvě': 2,
      'tři': 3, 'čtyři': 4,
      'pět': 5, 'šest': 6, 'sedm': 7, 'osm': 8, 'devět': 9, 'deset': 10,
      'jedenáct': 11, 'dvanáct': 12, 'patnáct': 15, 'dvacet': 20, 'třicet': 30, 'padesát': 50, 'sto': 100
    };

    const locationMap = [
      { regex: /(?:do|v)\s+lednic[eií]|do\s+chladničky/i, location: 'lednice' },
      { regex: /(?:do|v)\s+mrazák[au]|do\s+mrazničky/i, location: 'mrazak' },
      { regex: /(?:do|ve)\s+spíž[eií]|do\s+spízk[y]|do\s+komor[y]/i, location: 'spiz' },
      { regex: /(?:do|v)\s+šuplík[au]|do\s+zásuvk[y]/i, location: 'suplik' },
      { regex: /(?:do|ve)\s+skříň[eií]|do\s+linky/i, location: 'skrin' },
      { regex: /(?:na)\s+polic[eií]/i, location: 'police' }
    ];

    const unitMap = [
      { regex: /\b(kilogramy|kilogramů|kilogram|kila|kilo|kg)\b/i, unit: 'kg' },
      { regex: /\b(gramy|gramů|gram|g)\b/i, unit: 'g' },
      { regex: /\b(litry|litrů|litr|l)\b/i, unit: 'l' },
      { regex: /\b(mililitry|mililitrů|mililitr|ml)\b/i, unit: 'ml' },
      { regex: /\b(balení|baleni|balíčky|balíček)\b/i, unit: 'baleni' },
      { regex: /\b(sáčky|sáček|pytlíky|pytlík|sacek)\b/i, unit: 'sacek' },
      { regex: /\b(kusy|kusů|kus|ks)\b/i, unit: 'ks' }
    ];

    for (let clause of clauses) {
      let textSeg = clause.trim();
      if (!textSeg) continue;

      let location = null;
      for (let locEntry of locationMap) {
        if (locEntry.regex.test(textSeg)) {
          location = locEntry.location;
          textSeg = textSeg.replace(locEntry.regex, '').trim();
          break;
        }
      }

      let quantity = 1;
      let unit = 'ks';

      // 1. Zkusit číslo s jednotkou (např. "500g", "2.5 l", "3 ks")
      const numMatch = textSeg.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Zá-žÁ-Ž]+)?\s*(.*)$/);
      if (numMatch) {
        quantity = parseFloat(numMatch[1].replace(',', '.'));
        const possibleUnit = (numMatch[2] || '').toLowerCase();
        for (let u of unitMap) {
          if (u.regex.test(possibleUnit)) {
            unit = u.unit;
            textSeg = numMatch[3] || '';
            break;
          }
        }
        if (textSeg === clause.trim()) {
          textSeg = (numMatch[2] ? numMatch[2] + ' ' : '') + (numMatch[3] || '');
        }
      } else {
        // 2. Zkusit české slovní číslo (např. "tři polotučná mléka")
        for (let word in czechNumbers) {
          const wRegex = new RegExp(`^${word}\\b`, 'i');
          if (wRegex.test(textSeg)) {
            quantity = czechNumbers[word];
            textSeg = textSeg.replace(wRegex, '').trim();
            break;
          }
        }

        // Zkusit jednotku po číslovce (např. "dvě kila mouky")
        for (let u of unitMap) {
          if (u.regex.test(textSeg)) {
            unit = u.unit;
            textSeg = textSeg.replace(u.regex, '').trim();
            break;
          }
        }
      }

      // Vyčistit název
      let itemName = textSeg
        .replace(/^(z\s+|ze\s+)/i, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!itemName) continue;

      // Kapitalizace prvního písmene
      itemName = itemName.charAt(0).toUpperCase() + itemName.slice(1);

      const category = this.classifyItem(itemName);
      if (!location) {
        location = this.suggestLocation(itemName, category);
      }

      const predictedExp = this.predictExpiration(itemName, category);

      results.push({
        name: itemName,
        quantity: quantity,
        unit: unit,
        category: category,
        location: location,
        expirations: [predictedExp]
      });
    }

    return results;
  },

  // Zpracování textu z účtenky
  async parseReceiptText(ocrText) {
    if (!ocrText || !ocrText.trim()) return [];

    // 1. Zkusit online AI
    const prompt = `Zanalyzuj tento text z české nákupní účtenky. Extrahuj z něj jednotlivé zakoupené položky jako JSON pole objektů.
Ignoruj hlavičky obchodu, součty, DPH, zálohy, karty.
Objekty mají klíče:
- name: string (vyčištěný čitelný název produktu, např. "Máslo Jihočeské 250g")
- quantity: number (počet kusů nebo hmotnost, výchozí 1)
- unit: string ('ks' | 'kg' | 'g' | 'l' | 'ml' | 'baleni')
- price: number (cena v Kč, např. 49.90)
- category: string ('mlecne' | 'maso' | 'ovoce_zelenina' | 'pecivo' | 'napoje' | 'mrazene' | 'konzervy' | 'koreni' | 'sladkosti' | 'ostatni')
- location: string ('lednice' | 'mrazak' | 'spiz' | 'suplik' | 'skrin' | 'police' | 'ostatni')

Vrať POUZE JSON pole. Účtenka:
${ocrText}`;

    const aiRes = await this.queryAI(prompt);
    if (aiRes) {
      try {
        const cleanJson = aiRes.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(it => {
            const exp = this.predictExpiration(it.name, it.category);
            return {
              name: it.name || 'Položka',
              quantity: Number(it.quantity) || 1,
              unit: it.unit || 'ks',
              price: it.price ? Number(it.price) : null,
              category: it.category || this.classifyItem(it.name),
              location: it.location || this.suggestLocation(it.name, it.category),
              expirations: [exp]
            };
          });
        }
      } catch (e) {
        console.warn('Failed to parse AI receipt JSON:', e);
      }
    }

    // 2. Offline parser účtenek
    const lines = ocrText.split('\n');
    const items = [];
    const ignoreKeywords = ['celkem', 'součet', 'dph', 'platba', 'karta', 'hotovost', 'vráceno', 'děkujeme', 'ičo', 'dič', 'prodejna', 'sleva', 'akce', 'body', 'club'];

    for (let line of lines) {
      const l = line.trim();
      if (l.length < 3) continue;
      const lower = l.toLowerCase();
      if (ignoreKeywords.some(k => lower.includes(k))) continue;

      // Zkusit najít cenu na konci řádku (např. "MLÉKO POLOTUČNÉ 1L   23,90" nebo "19.90 A")
      const priceMatch = l.match(/(\d+[.,]\d{2})\s*(?:Kč|czk|[A-D])?$/i);
      let price = null;
      let nameStr = l;

      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(',', '.'));
        nameStr = l.replace(priceMatch[0], '').trim();
      }

      // Odstranit počáteční kódy či čísla položek
      nameStr = nameStr.replace(/^\d+[\s\-_.]*/, '').trim();
      if (nameStr.length < 2) continue;

      // Naformátovat název
      nameStr = nameStr.charAt(0).toUpperCase() + nameStr.slice(1).toLowerCase();

      const category = this.classifyItem(nameStr);
      const location = this.suggestLocation(nameStr, category);
      const exp = this.predictExpiration(nameStr, category);

      items.push({
        name: nameStr,
        quantity: 1,
        unit: 'ks',
        price: price,
        category: category,
        location: location,
        expirations: [exp]
      });
    }

    return items;
  }
};

