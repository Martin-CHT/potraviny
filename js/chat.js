window.App = window.App || {};

App.Chat = {
  messages: [],
  isProcessing: false,

  async init() {
    await this.loadHistory();
    this.setupChatUI();
    this.renderMessages();
  },

  async loadHistory() {
    try {
      const saved = await App.DB.getSetting('chat_history');
      if (saved && Array.isArray(saved) && saved.length > 0) {
        this.messages = saved;
      } else {
        this.messages = [
          {
            id: 'welcome',
            role: 'assistant',
            text: 'Ahoj! Jsem váš chytrý **AI asistent zásob a vaření** 🤖.\n\nVím přesně, co máte v lednici, mrazáku i spíži. Můžete se mě zeptat:\n* *Kde mám uložené máslo a kolik ho zbývá?*\n* *Co brzy expiruje a co z toho uvařit?*\n* *Co je potřeba dokoupit?*\n* Nebo mi sem **vložte libovolný recept se surovinami** a já vám je v zásobách vyhledám a připravím k vyskladnění!',
            timestamp: new Date().toISOString()
          }
        ];
      }
    } catch (e) {
      this.messages = [];
    }
  },

  async saveHistory() {
    // Uložit posledních 50 zpráv
    const trimmed = this.messages.slice(-50);
    await App.DB.setSetting('chat_history', trimmed);
  },

  async clearHistory() {
    if (confirm('Opravdu chcete vymazat historii konverzace s AI?')) {
      this.messages = [
        {
          id: 'welcome_reset',
          role: 'assistant',
          text: 'Historie chatu byla vymazána. Jak vám mohu dnes pomoci se zásobami nebo recepty?',
          timestamp: new Date().toISOString()
        }
      ];
      await this.saveHistory();
      this.renderMessages();
      if (App.Main) App.Main.showToast('Historie chatu vymazána', 'info', 1500);
    }
  },

  // ==================== ZPRACOVÁNÍ DOTAZŮ & INTENTŮ ====================
  async sendUserMessage(rawText) {
    const text = (rawText || '').trim();
    if (!text || this.isProcessing) return;

    this.isProcessing = true;
    const userMsgId = crypto.randomUUID();
    this.messages.push({
      id: userMsgId,
      role: 'user',
      text: text,
      timestamp: new Date().toISOString()
    });

    this.renderMessages();
    this.scrollToBottom();

    // Vizuální indikátor psaní
    this.showTypingIndicator();

    try {
      const response = await this.generateAIResponse(text);
      this.hideTypingIndicator();

      this.messages.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: response.text,
        cardType: response.cardType || null,
        cardData: response.cardData || null,
        timestamp: new Date().toISOString()
      });

      await this.saveHistory();
      this.renderMessages();
      this.scrollToBottom();
    } catch (err) {
      console.error('Chat error:', err);
      this.hideTypingIndicator();
      this.messages.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Omlouvám se, při zpracování dotazu došlo k chybě: ' + err.message,
        timestamp: new Date().toISOString()
      });
      this.renderMessages();
      this.scrollToBottom();
    } finally {
      this.isProcessing = false;
    }
  },

  async generateAIResponse(userQuery) {
    const queryLower = userQuery.toLowerCase();
    const items = (App.Items && App.Items.items) ? App.Items.items : [];
    const shoppingItems = (App.Shopping && App.Shopping.items) ? App.Shopping.items : [];
    const apiKey = (await App.DB.getSetting('aiApiKey')) || (await App.DB.getSetting('input-ai-api-key'));

    // 1. Zkontrolovat, zda dotaz obsahuje recept / seznam surovin (nebo požadavek na vyskladnění)
    const recipeDetection = this.detectAndParseRecipe(userQuery, items);
    if (recipeDetection.isRecipe && recipeDetection.ingredients.length > 0) {
      return this.handleRecipeCheckout(recipeDetection, userQuery);
    }

    // 2. Pokud je nastaven API klíč (Gemini / OpenAI), zkusit online LLM s bohatým kontextem
    if (apiKey) {
      try {
        const llmReply = await this.queryOnlineLLM(userQuery, items, shoppingItems, apiKey);
        if (llmReply) {
          // Zkontrolovat, zda odpověď LLM obsahuje recept se surovinami pro vyskladnění
          const replyRecipe = this.detectAndParseRecipe(llmReply, items);
          if (replyRecipe.isRecipe && replyRecipe.ingredients.length >= 2) {
            return {
              text: llmReply,
              cardType: 'recipe_checkout',
              cardData: replyRecipe
            };
          }
          return { text: llmReply };
        }
      } catch (llmErr) {
        console.warn('Online LLM failed, falling back to smart local heuristics:', llmErr);
      }
    }

    // 3. Lokální inteligentní heuristiky (100% offline bez nutnosti API klíče)
    return this.handleOfflineQuery(userQuery, queryLower, items, shoppingItems);
  },

  // ==================== LOKÁLNÍ OFFLINE INTENT HANDLER ====================
  handleOfflineQuery(userQuery, q, items, shoppingItems) {
    // A) Kde mám X / Vyhledání umístění
    if (q.includes('kde mám') || q.includes('kde je') || q.includes('kde najdu') || q.includes('mám ještě') || q.includes('máme doma') || q.includes('kolik máme') || q.includes('kolik je')) {
      const cleanSearch = q
        .replace(/^(kde mám|kde je|kde najdu|mám ještě|máme doma|kolik máme|kolik je)\s+/i, '')
        .replace(/[?!.]/g, '')
        .trim();

      if (cleanSearch) {
        const matched = App.AI ? App.AI.smartSearch(items, cleanSearch) : [];
        if (matched.length > 0) {
          let reply = `🔍 **Nalezeno v zásobách:**\n\n`;
          matched.forEach(it => {
            const locLabel = App.Zones ? App.Zones.getZoneLabel(it.location) : (it.location || 'Spíž');
            const expStatus = App.Items.getExpirationStatus(it);
            const emoji = App.Items.getCategoryEmoji(it.category);
            reply += `• **${emoji} ${it.name}**: ${it.quantity} ${it.unit}\n  📍 Umístění: **${locLabel}**\n  ⏳ Spotřeba: ${expStatus.text}\n\n`;
          });
          return {
            text: reply,
            cardType: 'item_matches',
            cardData: { items: matched }
          };
        } else {
          return {
            text: `❌ Položku **"${cleanSearch}"** jsem v zásobách nenašel.\n\nChcete ji přidat do nákupního seznamu?`,
            cardType: 'quick_add_shopping',
            cardData: { name: cleanSearch }
          };
        }
      }
    }

    // B) Co expiruje / Co je potřeba spotřebovat
    if (q.includes('expir') || q.includes('kazí') || q.includes('projde') || q.includes('spotřebovat') || q.includes('dochází')) {
      const expiring = [];
      items.forEach(it => {
        if (!it.expirations || it.expirations.length === 0) return;
        const st = App.Items.getExpirationStatus(it);
        if (st.daysLeft <= 7) {
          expiring.push({ item: it, status: st });
        }
      });

      expiring.sort((a, b) => a.status.daysLeft - b.status.daysLeft);

      if (expiring.length === 0) {
        return { text: '🟢 **Vše je v pořádku!** Žádným potravinám nekončí trvanlivost v nejbližších 7 dnech.' };
      }

      let reply = `⚠️ **Potraviny s blížící se expirací (${expiring.length}):**\n\n`;
      expiring.forEach(({ item, status }) => {
        const emoji = App.Items.getCategoryEmoji(item.category);
        const loc = App.Zones ? App.Zones.getZoneLabel(item.location) : item.location;
        reply += `• **${emoji} ${item.name}** (${item.quantity} ${item.unit}) — ${status.text}\n  📍 *${loc}*\n`;
      });

      const expiringNames = expiring.map(e => e.item.name).slice(0, 3).join(', ');
      reply += `\n💡 *Tip: Můžete zkusit recept z: ${expiringNames}*`;

      return {
        text: reply,
        cardType: 'expiring_list',
        cardData: { list: expiring }
      };
    }

    // C) Co je potřeba dokoupit / Nákupní lístek
    if (q.includes('dokoupit') || q.includes('koupit') || q.includes('nákup') || q.includes('co chybí') || q.includes('nákupní seznam')) {
      const pendingShopping = shoppingItems.filter(i => !i.checked);
      const lowStock = items.filter(i => (i.unit === 'ks' && i.quantity <= 1) || (i.unit === 'kg' && i.quantity <= 0.3) || (i.unit === 'l' && i.quantity <= 0.3));

      let reply = '🛒 **Přehled pro nákup:**\n\n';

      if (pendingShopping.length > 0) {
        reply += `**Položky v nákupním lístku (${pendingShopping.length}):**\n`;
        pendingShopping.forEach(it => {
          reply += `• ${it.name} — ${it.quantity} ${it.unit}\n`;
        });
        reply += '\n';
      } else {
        reply += 'V nákupním lístku momentálně nemáte žádné položky.\n\n';
      }

      if (lowStock.length > 0) {
        reply += `**Potraviny v zásobách, které docházejí (${lowStock.length}):**\n`;
        lowStock.slice(0, 5).forEach(it => {
          reply += `• ${it.name} (zbývá jen ${it.quantity} ${it.unit})\n`;
        });
      }

      return {
        text: reply,
        cardType: 'shopping_overview',
        cardData: { pending: pendingShopping, lowStock }
      };
    }

    // D) Co uvařit / Recepty ze zásob
    if (q.includes('uvařit') || q.includes('upéct') || q.includes('večeř') || q.includes('oběd') || q.includes('snídan') || q.includes('recept')) {
      return this.suggestOfflineRecipes(items, q);
    }

    // E) Celkový stav zásob
    if (q.includes('přehled') || q.includes('kolik máme celkem') || q.includes('stav zásob') || q.includes('všechno')) {
      const totalCount = items.length;
      let totalValue = 0;
      items.forEach(i => { if (i.price) totalValue += i.price * i.quantity; });

      return {
        text: `📦 **Celkový stav vašich zásob:**\n\n• Máte evidováno **${totalCount} položek**.\n• Odhadovaná hodnota zásob: **${totalValue.toFixed(0)} Kč**.\n• Položek v nákupním lístku: **${shoppingItems.filter(i => !i.checked).length}**.\n\nZeptejte se mě na konkrétní surovinu, nebo vložte recept, který chcete uvařit!`
      };
    }

    // Fallback nápověda
    return {
      text: `Jsem připraven vám pomoci! Rozumím dotazům na vaše zásoby, například:\n\n• *"Kde mám máslo?"*\n• *"Co brzy expiruje?"*\n• *"Co mám uvařit k večeři?"*\n• *"Co je potřeba dokoupit?"*\n\nTaké mi sem můžete **vložit recept se surovinami** a já vám je v zásobách automaticky najdu a umožním jedním klepnutím vyskladnit.`
    };
  },

  // ==================== PARSOVÁNÍ RECEPTU A VYSKLADNĚNÍ ====================
  detectAndParseRecipe(text, items) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const ingredients = [];

    // Detekce linek se surovinami: např. "500g kuřecí maso", "• 3 ks vajec", "2 lžíce másla", "1 cibule"
    const ingRegex = /(?:[•\-\*]\s*)?(?:(\d+(?:[.,]\d+)?)\s*(kg|g|ks|l|ml|lžíce|lžičk[ay]|balení|sáček|strouž(?:ek|ky))?\s+)?(.+)/i;

    // Klíčová slova receptu
    const hasRecipeKeywords = /recept|suroviny|ingredience|postup|příprava|uvařit|guláš|polévka|těstoviny|bábovka|omáčka|řízek/i.test(text);

    lines.forEach(line => {
      // Ignorovat hlavičky jako "Postup:" nebo "Recept:"
      if (/^(recept|postup|příprava|instrukce|kroky):/i.test(line)) return;

      const m = line.match(ingRegex);
      if (m && m[3]) {
        let rawQty = m[1] ? parseFloat(m[1].replace(',', '.')) : 1;
        let rawUnit = (m[2] || 'ks').toLowerCase();
        let name = m[3]
          .replace(/^[•\-\*:]\s*/, '')
          .replace(/\(.*?\)/g, '')
          .replace(/,\s*$/, '')
          .trim();

        if (name.length >= 2 && !name.toLowerCase().startsWith('dobrou chuť') && !name.toLowerCase().startsWith('pečeme na')) {
          // Zkusit najít položku v zásobách
          const matchResult = App.AI ? App.AI.smartSearch(items, name) : [];
          const matchedItem = matchResult.length > 0 ? matchResult[0] : null;

          const inStock = matchedItem ? matchedItem.quantity : 0;
          const stockUnit = matchedItem ? matchedItem.unit : rawUnit;
          const location = matchedItem ? (App.Zones ? App.Zones.getZoneLabel(matchedItem.location) : matchedItem.location) : null;
          const locationId = matchedItem ? matchedItem.location : null;

          ingredients.push({
            id: crypto.randomUUID(),
            requestedName: name,
            requestedQty: rawQty,
            requestedUnit: rawUnit,
            matchedItemId: matchedItem ? matchedItem.id : null,
            matchedItemName: matchedItem ? matchedItem.name : null,
            inStockQty: inStock,
            stockUnit: stockUnit,
            location: location,
            locationId: locationId,
            isAvailable: inStock > 0,
            consumeQty: Math.min(rawQty, inStock > 0 ? inStock : rawQty),
            checked: inStock > 0
          });
        }
      }
    });

    const isRecipe = hasRecipeKeywords || ingredients.length >= 2;
    return {
      isRecipe,
      title: lines[0] ? lines[0].replace(/^#+\s*/, '') : 'Recept',
      ingredients
    };
  },

  handleRecipeCheckout(recipeData, originalQuery) {
    const availableCount = recipeData.ingredients.filter(i => i.isAvailable).length;
    const totalCount = recipeData.ingredients.length;

    let summaryText = `🍳 **Rozpoznán recept:** *${recipeData.title}*\n\n`;
    summaryText += `Skladem máte **${availableCount} z ${totalCount}** surovin. Níže můžete vybrané suroviny rovnou **vyskladnit (spotřebovat)** ze zásob nebo chybějící přidat do nákupního seznamu:`;

    return {
      text: summaryText,
      cardType: 'recipe_checkout',
      cardData: recipeData
    };
  },

  suggestOfflineRecipes(items, query) {
    const itemNames = items.map(i => i.name.toLowerCase());

    const has = (keyword) => itemNames.some(n => n.includes(keyword));

    const recipes = [
      {
        name: 'Těstoviny s kuřecím masem a smetanou',
        required: ['těstoviny', 'kuřecí', 'smetana'],
        optional: ['sýr', 'česnek', 'olej'],
        desc: 'Orestujte kuřecí maso s česnekem, zalijte smetanou a promíchejte s uvařenými těstovinami a sýrem.'
      },
      {
        name: 'Míchaná vajíčka s cibulkou a šunkou',
        required: ['vejce', 'máslo'],
        optional: ['cibule', 'šunka', 'chléb', 'sýr'],
        desc: 'Na másle zpěňte cibulku se šunkou, přidejte rozšlehaná vejce a podávejte s čerstvým chlebem.'
      },
      {
        name: 'Zapečené brambory se sýrem a uzeninou',
        required: ['brambory', 'sýr'],
        optional: ['smetana', 'šunka', 'klobása', 'vejce'],
        desc: 'Plátky brambor navrstvěte s uzeninou, zalijte smetanou s vajíčkem a zapečte se sýrem do zlatova.'
      },
      {
        name: 'Zeleninový salát s tuňákem a vejcem',
        required: ['tuňák', 'vejce'],
        optional: ['rajče', 'okurka', 'salát', 'olivový olej'],
        desc: 'Čerstvou zeleninu nakrájejte, přidejte kousky tuňáka, vařené vejce a zakápněte olivovým olejem.'
      },
      {
        name: 'Rychlé těstoviny Aglio Olio e Peperoncino / se sýrem',
        required: ['těstoviny', 'česnek', 'olej'],
        optional: ['parmezán', 'sýr', 'chilli'],
        desc: 'Uvařte těstoviny, na olivovém oleji orestujte plátky česneku a promíchejte se sýrem.'
      }
    ];

    // Najít nejlépe pasující recepty
    const scored = recipes.map(r => {
      const matchRequired = r.required.filter(req => has(req)).length;
      const matchOptional = r.optional.filter(opt => has(opt)).length;
      const totalReq = r.required.length;
      const score = (matchRequired / totalReq) * 10 + matchOptional;
      return { recipe: r, score, matchRequired, totalReq };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored.filter(s => s.matchRequired > 0);

    if (best.length === 0) {
      return {
        text: 'Nenašel jsem v zásobách dostatek surovin pro typické rychlé recepty. Můžete mi zkusit napsat konkrétní recept, nebo se podívat do nákupního seznamu!'
      };
    }

    let reply = '🍳 **Recepty z vašich aktuálních zásob:**\n\n';
    best.slice(0, 2).forEach(({ recipe, matchRequired, totalReq }) => {
      reply += `### ${recipe.name}\n`;
      reply += `*Shoda surovin: ${matchRequired}/${totalReq} základních skladem*\n`;
      reply += `${recipe.desc}\n\n`;
      reply += `**Suroviny k přípravě:**\n`;
      recipe.required.concat(recipe.optional).forEach(ing => {
        const inSt = has(ing);
        reply += `• ${inSt ? '🟢' : '🔴'} ${ing} ${inSt ? '(máte skladem)' : '(nutno dokoupit)'}\n`;
      });
      reply += '\n';
    });

    const primaryRecipe = best[0].recipe;
    const mockRecipeText = `${primaryRecipe.name}\n` + primaryRecipe.required.concat(primaryRecipe.optional).map(i => `• 1 ks ${i}`).join('\n');
    const parsedRecipe = this.detectAndParseRecipe(mockRecipeText, items);

    return {
      text: reply,
      cardType: 'recipe_checkout',
      cardData: parsedRecipe
    };
  },

  // ==================== ONLINE LLM (GEMINI / OPENAI) ====================
  async queryOnlineLLM(userPrompt, items, shoppingItems, apiKey) {
    const stockSummary = items.map(i => {
      const loc = App.Zones ? App.Zones.getZoneLabel(i.location) : i.location;
      const exp = i.expirations?.[0]?.date || 'neuvedeno';
      return `- ${i.name}: ${i.quantity} ${i.unit} (umístění: ${loc}, spotřeba: ${exp})`;
    }).join('\n');

    const shoppingSummary = shoppingItems.map(i => `- ${i.name}: ${i.quantity} ${i.unit}`).join('\n');

    const systemPrompt = `Jsi inteligentní asistent pro správu domácích zásob potravin a receptů v české aplikaci "Potraviny".
Zde je aktuální stav domácnosti:
ZÁSOBY SKLADEM:
${stockSummary || 'Žádné potraviny v evidenci'}

NÁKUPNÍ SEZNAM:
${shoppingSummary || 'Nákupní seznam je prázdný'}

INSTRUKCE:
1. Odpovídej přátelsky, stručně a výhradně v češtině.
2. Vždy přesně vycházej z uvedeného seznamu zásob skladem a jejich umístění.
3. Pokud navrhuješ recept nebo odpovídáš na dotaz k vaření, vždy uveď přesný seznam surovin s odrážkami (např. • 500g kuřecí prsa), aby aplikace mohla nabídnout jejich automatické vyskladnění.
4. Pokud uživatel vloží recept, zhodnoť, které suroviny má doma a kde přesně jsou uloženy.`;

    const fullPrompt = `${systemPrompt}\n\nUŽIVATEL: ${userPrompt}`;

    return await App.AI.queryAI(fullPrompt);
  },

  // ==================== AKCE Z RECEPTU V CHATU ====================
  // 1. Hromadné vyskladnění surovin z karty
  async consumeRecipeIngredients(cardId) {
    const cardEl = document.querySelector(`.chat-card[data-card-id="${cardId}"]`);
    if (!cardEl) return;

    const checkedBoxes = cardEl.querySelectorAll('.recipe-ing-cb:checked');
    if (checkedBoxes.length === 0) {
      if (App.Main) App.Main.showToast('Vyberte alespoň jednu surovinu k vyskladnění', 'warning');
      return;
    }

    if (App.Main) App.Main.showLoading();
    let consumedCount = 0;
    const consumedNames = [];

    for (let cb of checkedBoxes) {
      const itemId = cb.dataset.itemId;
      const row = cb.closest('.recipe-ing-row');
      const qtyInput = row ? row.querySelector('.recipe-ing-qty-input') : null;
      const qtyToConsume = qtyInput ? parseFloat(qtyInput.value) || 1 : 1;

      if (itemId && App.Items) {
        const it = App.Items.items.find(i => i.id === itemId);
        if (it) {
          await App.Items.consumeItem(itemId, qtyToConsume);
          consumedCount++;
          consumedNames.push(`${it.name} (${qtyToConsume} ${it.unit})`);
        }
      }
    }

    if (App.Main) {
      App.Main.hideLoading();
      App.Main.showToast(`✅ Úspěšně vyskladněno ${consumedCount} surovin!`, 'success', 3000);
      App.Items.renderItems();
    }

    // Odeslat zprávu do chatu o provedeném vyskladnění
    this.messages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      text: `✅ **Vyskladněno ze zásob:**\n${consumedNames.map(n => `• ${n}`).join('\n')}\n\nPoložky byly odečteny z vašeho inventáře. Přeji dobrou chuť k jídlu! 🍳`,
      timestamp: new Date().toISOString()
    });

    await this.saveHistory();
    this.renderMessages();
    this.scrollToBottom();
  },

  // 2. Přidání chybějících surovin do nákupního lístku
  async addMissingToShopping(cardId) {
    const cardEl = document.querySelector(`.chat-card[data-card-id="${cardId}"]`);
    if (!cardEl) return;

    const missingRows = cardEl.querySelectorAll('.recipe-ing-row.is-missing');
    if (missingRows.length === 0) {
      if (App.Main) App.Main.showToast('Žádné chybějící suroviny k přidání.', 'info');
      return;
    }

    let addedCount = 0;
    for (let row of missingRows) {
      const name = row.dataset.ingName;
      const qty = parseFloat(row.dataset.ingQty) || 1;
      const unit = row.dataset.ingUnit || 'ks';

      if (name && App.Shopping) {
        await App.Shopping.addItem({ name, quantity: qty, unit });
        addedCount++;
      }
    }

    if (App.Main) {
      App.Main.showToast(`🛒 Přidáno ${addedCount} chybějících položek do nákupního seznamu!`, 'success', 2500);
    }
  },

  // 3. Odfiltrování surovin v inventáři
  filterInInventory(ingredientNames) {
    if (!App.Main || !App.Items) return;
    App.Main.navigate('inventory');
    const query = ingredientNames.join(' ');
    App.Items.setFilter('search', query);
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = query;
    App.Main.showToast(`Filtrovány suroviny z receptu: ${ingredientNames.slice(0, 3).join(', ')}...`, 'info', 2500);
  },

  // ==================== RENDEROVÁNÍ ZPRÁV ====================
  renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    container.innerHTML = this.messages.map(msg => {
      const isUser = msg.role === 'user';
      const timeStr = new Date(msg.timestamp).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
      const formattedText = this.formatMarkdown(msg.text);

      let cardHtml = '';
      if (msg.cardType === 'recipe_checkout' && msg.cardData) {
        cardHtml = this.renderRecipeCheckoutCard(msg.cardData, msg.id);
      } else if (msg.cardType === 'item_matches' && msg.cardData) {
        cardHtml = this.renderItemMatchesCard(msg.cardData);
      }

      return `
        <div class="chat-message-row ${isUser ? 'msg-user' : 'msg-assistant'}">
          <div class="chat-avatar">${isUser ? '👤' : '🤖'}</div>
          <div class="chat-bubble-wrap">
            <div class="chat-bubble">
              <div class="chat-bubble-text">${formattedText}</div>
              ${cardHtml}
            </div>
            <div class="chat-msg-time">${timeStr}</div>
          </div>
        </div>
      `;
    }).join('');

    this.attachCardListeners(container);
  },

  renderRecipeCheckoutCard(recipeData, cardId) {
    const ingredients = recipeData.ingredients || [];
    const availableIngs = ingredients.filter(i => i.isAvailable);
    const missingIngs = ingredients.filter(i => !i.isAvailable);
    const ingNamesEscaped = JSON.stringify(ingredients.map(i => i.requestedName)).replace(/"/g, '&quot;');

    return `
      <div class="chat-card recipe-checkout-card mt-3" data-card-id="${cardId}">
        <div class="card-head flex-row justify-between align-center">
          <strong>📋 Suroviny k vyskladnění (${availableIngs.length}/${ingredients.length} skladem)</strong>
        </div>

        <div class="recipe-ing-table mt-2">
          ${ingredients.map(ing => {
            return `
              <div class="recipe-ing-row ${ing.isAvailable ? 'is-available' : 'is-missing'}" 
                   data-ing-name="${ing.requestedName}" 
                   data-ing-qty="${ing.requestedQty}" 
                   data-ing-unit="${ing.requestedUnit}">
                <div class="flex-row align-center gap-2 flex-1">
                  <input type="checkbox" class="recipe-ing-cb" data-item-id="${ing.matchedItemId || ''}" ${ing.checked ? 'checked' : ''} ${!ing.isAvailable ? 'disabled' : ''}>
                  <div class="ing-info">
                    <span class="ing-name ${!ing.isAvailable ? 'text-muted' : ''}">${ing.requestedName}</span>
                    <div class="ing-meta text-small text-muted">
                      ${ing.isAvailable 
                        ? `<span class="badge badge-success" style="font-size:0.75rem;">Skladem: ${ing.inStockQty} ${ing.stockUnit} • ${ing.location}</span>`
                        : `<span class="badge badge-danger" style="font-size:0.75rem;">Chybí v zásobách</span>`
                      }
                    </div>
                  </div>
                </div>
                ${ing.isAvailable ? `
                  <div class="ing-qty-consume-wrap">
                    <input type="number" class="recipe-ing-qty-input" value="${ing.consumeQty}" min="0.01" max="${ing.inStockQty}" step="any" title="Množství k odečtení">
                    <span class="text-small text-muted">${ing.stockUnit}</span>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <div class="recipe-card-actions mt-3 flex-row gap-2 flex-wrap">
          ${availableIngs.length > 0 ? `
            <button type="button" class="btn-primary btn-small btn-consume-recipe" data-card-id="${cardId}" style="background:#27ae60;">
              ⚡ Vyskladnit vybrané (${availableIngs.length})
            </button>
          ` : ''}
          <button type="button" class="btn-secondary btn-small btn-filter-inventory" data-names="${ingNamesEscaped}">
            🔍 Zobrazit v zásobách
          </button>
          ${missingIngs.length > 0 ? `
            <button type="button" class="btn-secondary btn-small btn-add-missing-shopping" data-card-id="${cardId}">
              🛒 Přidat ${missingIngs.length} chybějící do nákupu
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  renderItemMatchesCard(cardData) {
    const items = cardData.items || [];
    return `
      <div class="chat-card item-matches-card mt-2">
        <div class="flex-row gap-2 flex-wrap">
          ${items.map(it => {
            const loc = App.Zones ? App.Zones.getZoneLabel(it.location) : it.location;
            const emoji = App.Items ? App.Items.getCategoryEmoji(it.category) : '📦';
            return `
              <button type="button" class="btn-secondary btn-small" onclick="App.Main.navigate('inventory'); App.Items.openDetailModal('${it.id}')">
                ${emoji} ${it.name} (${it.quantity} ${it.unit}) • 📍 ${loc}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  attachCardListeners(container) {
    container.querySelectorAll('.btn-consume-recipe').forEach(btn => {
      btn.addEventListener('click', () => {
        this.consumeRecipeIngredients(btn.dataset.cardId);
      });
    });

    container.querySelectorAll('.btn-add-missing-shopping').forEach(btn => {
      btn.addEventListener('click', () => {
        this.addMissingToShopping(btn.dataset.cardId);
      });
    });

    container.querySelectorAll('.btn-filter-inventory').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const names = JSON.parse(btn.dataset.names);
          this.filterInInventory(names);
        } catch (e) {}
      });
    });
  },

  formatMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gim, '<h4 style="margin: 8px 0 4px 0;">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 style="margin: 10px 0 6px 0;">$1</h3>')
      .replace(/^# (.*$)/gim, '<h2 style="margin: 12px 0 8px 0;">$1</h2>')
      .replace(/^\s*[•\-\*]\s*(.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/gim, '')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    return html;
  },

  showTypingIndicator() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const existing = document.getElementById('chat-typing-indicator');
    if (existing) existing.remove();

    const ind = document.createElement('div');
    ind.id = 'chat-typing-indicator';
    ind.className = 'chat-message-row msg-assistant typing';
    ind.innerHTML = `
      <div class="chat-avatar">🤖</div>
      <div class="chat-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    container.appendChild(ind);
    this.scrollToBottom();
  },

  hideTypingIndicator() {
    const existing = document.getElementById('chat-typing-indicator');
    if (existing) existing.remove();
  },

  scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  },

  // ==================== UI LISTENERS ====================
  setupChatUI() {
    const form = document.getElementById('form-chat-input');
    const input = document.getElementById('chat-user-input');
    const btnVoice = document.getElementById('btn-chat-voice');
    const btnClear = document.getElementById('btn-chat-clear');
    const btnHeaderChat = document.getElementById('btn-header-chat');

    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
          input.value = '';
          this.sendUserMessage(text);
        }
      });

      // Odeslání stisknutím Enter (pokud není Shift+Enter)
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      });
    }

    if (btnVoice && input) {
      btnVoice.addEventListener('click', () => {
        if (App.Voice && typeof App.Voice.startListening === 'function') {
          if (App.Main) App.Main.showModal('modal-voice-input');
          App.Voice.startListening();
        }
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => this.clearHistory());
    }

    if (btnHeaderChat && App.Main) {
      btnHeaderChat.addEventListener('click', () => {
        App.Main.navigate('chat');
      });
    }

    // Quick prompts chips
    document.querySelectorAll('.quick-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt;
        if (prompt) {
          this.sendUserMessage(prompt);
        }
      });
    });
  }
};
