window.App = window.App || {};

App.Recipes = {
  builtInRecipes: [
    {
      name: 'Svíčková na smetaně',
      ingredients: ['hovězí', 'mrkev', 'celer', 'petržel', 'cibule', 'smetana', 'špek', 'hořčice', 'máslo', 'citron'],
      description: 'Tradiční česká klasika se šlehanou smetanou a kořenovou zeleninou.',
      category: 'hlavni'
    },
    {
      name: 'Vepřový guláš s cibulkou',
      ingredients: ['vepřové', 'cibule', 'česnek', 'paprika mletá', 'chleba', 'kmín', 'olej'],
      description: 'Poctivý hustý guláš s čerstvou cibulkou.',
      category: 'hlavni'
    },
    {
      name: 'Kuřecí řízek s bramborovou kaší',
      ingredients: ['kuřecí prsa', 'vejce', 'mouka', 'strouhanka', 'brambory', 'mléko', 'máslo', 'olej'],
      description: 'Křupavý smažený řízek s jemnou bramborovou kaší.',
      category: 'hlavni'
    },
    {
      name: 'Poctivá bramboračka',
      ingredients: ['brambory', 'mrkev', 'celer', 'petržel', 'cibule', 'česnek', 'majoránka', 'houby', 'máslo', 'mouka'],
      description: 'Hustá polévka s kořenovou zeleninou a vůní majoránky.',
      category: 'polevka'
    },
    {
      name: 'Domácí palačinky s džemem',
      ingredients: ['mléko', 'vejce', 'mouka', 'cukr', 'olej', 'džem', 'tvaroh'],
      description: 'Nadýchané tenké palačinky se sladkou náplní.',
      category: 'sladke'
    },
    {
      name: 'Kuřecí rizoto se sýrem',
      ingredients: ['rýže', 'kuřecí maso', 'mražená zelenina', 'sýr', 'cibule', 'olej', 'máslo'],
      description: 'Rychlé a oblíbené rizoto sypané strouhaným sýrem.',
      category: 'hlavni'
    },
    {
      name: 'Zapečené francouzské brambory',
      ingredients: ['brambory', 'vejce', 'klobása', 'uzené', 'smetana', 'cibule', 'sýr', 'máslo'],
      description: 'Vydatný rodinný oběd zapečený se smetanou a vajíčky.',
      category: 'hlavni'
    },
    {
      name: 'Kuře na paprice s těstovinami',
      ingredients: ['kuřecí maso', 'kuřecí stehna', 'paprika mletá', 'smetana', 'cibule', 'olej', 'těstoviny', 'mouka'],
      description: 'Jemná smetanová omáčka na paprice.',
      category: 'hlavni'
    },
    {
      name: 'Rajská omáčka s masovými kuličkami',
      ingredients: ['mleté maso', 'protlak', 'drcená rajčata', 'cibule', 'cukr', 'skořice', 'těstoviny', 'rýže'],
      description: 'Sladkokyselá rajská omáčka s těstovinami.',
      category: 'hlavni'
    },
    {
      name: 'Těstovinový salát s tuňákem a zeleninou',
      ingredients: ['těstoviny', 'tuňák v konzervě', 'rajče', 'okurka', 'kukuřice', 'majonéza', 'jogurt'],
      description: 'Osvěžující a rychlý studený oběd nebo večeře.',
      category: 'salat'
    },
    {
      name: 'Kynuté knedlíky s ovocem a tvarohem',
      ingredients: ['mouka', 'droždí', 'mléko', 'vejce', 'jahody', 'borůvky', 'tvaroh', 'cukr', 'máslo'],
      description: 'Nadýchané kynuté knedlíky sypané tvarohem a polité máslem.',
      category: 'sladke'
    },
    {
      name: 'Hovězí vývar s nudlemi',
      ingredients: ['hovězí', 'mrkev', 'celer', 'petržel', 'cibule', 'česnek', 'nudle', 'pepř'],
      description: 'Silný poctivý hovězí vývar s játrovými knedlíčky nebo nudlemi.',
      category: 'polevka'
    },
    {
      name: 'Smaženice z hub a vajec',
      ingredients: ['houby', 'žampiony', 'vejce', 'cibule', 'máslo', 'kmín', 'chleba'],
      description: 'Klasická rychlá večeře z hub s čerstvým chlebem.',
      category: 'hlavni'
    },
    {
      name: 'Lečo s klobásou a vejci',
      ingredients: ['paprika', 'rajče', 'cibule', 'vejce', 'klobása', 'špekáčky', 'chleba'],
      description: 'Tradiční zeleninové lečo vonící po uzenině.',
      category: 'hlavni'
    }
  ],
  
  openReceptySearch(query) {
    if (!query) return;
    const url = `https://www.recepty.cz/vyhledavani?text=${encodeURIComponent(query.trim())}`;
    window.open(url, '_blank');
  },
  
  async searchFromStock() {
    if (!App.Items || !App.Items.items) return;
    
    const items = App.Items.items.filter(it => it.quantity > 0);
    if (items.length === 0) {
      if (App.Main) App.Main.showToast('V inventáři nemáte žádné potraviny.', 'info', 2500);
      return;
    }

    // Seřadit ingredience tak, aby ty s nejbližší expirací měly prioritu
    const sortedByExp = [...items].sort((a, b) => {
      const expA = a.expirations && a.expirations.length > 0 ? new Date(a.expirations[0].date).getTime() : Infinity;
      const expB = b.expirations && b.expirations.length > 0 ? new Date(b.expirations[0].date).getTime() : Infinity;
      return expA - expB;
    });

    const stockNames = sortedByExp.map(it => it.name.toLowerCase());
    const matches = this.matchRecipesToInventory(items);
    
    const container = document.getElementById('recipes-container');
    if (!container) return;
    
    container.innerHTML = '';

    // Vyzdvihnout suroviny končící brzy
    const expiringSoon = sortedByExp.filter(it => {
      const status = App.Items.getExpirationStatus(it);
      return status.daysLeft <= 4;
    });

    if (expiringSoon.length > 0) {
      const expNames = expiringSoon.map(i => i.name).join(', ');
      const expBanner = document.createElement('div');
      expBanner.className = 'exp-recipe-banner';
      expBanner.style.cssText = 'background: rgba(249,171,0,0.15); border: 1px solid var(--warning); padding: 12px; border-radius: 8px; margin-bottom: 16px; grid-column: 1 / -1;';
      expBanner.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">⚠️ Priorita: Spotřebujte brzy expirující suroviny</div>
        <p style="font-size: 0.85rem; margin-bottom: 8px;">Doporučujeme využít: <strong>${expNames}</strong></p>
        <button class="btn-primary btn-small" onclick="App.Recipes.openReceptySearch('${expiringSoon.map(i => i.name).slice(0, 3).join(' ')}')">Hledat recept na Recepty.cz z expirujících</button>
      `;
      container.appendChild(expBanner);
    }
    
    if (matches.length > 0) {
      matches.forEach(m => {
        container.innerHTML += this.renderRecipeCard(m);
      });
    } else {
      container.innerHTML += `
        <div style="grid-column: 1 / -1; text-align: center; padding: 20px;">
          <p>Nenašli jsme přesnou shodu v databázi.</p>
          <button class="btn-primary" onclick="App.Recipes.openReceptySearch('${stockNames.slice(0, 3).join(' ')}')">Hledat recepty na Recepty.cz</button>
        </div>
      `;
    }
  },
  
  renderRecipeCard(matchData) {
    const r = matchData.recipe;
    const matchPct = Math.round(matchData.matchPercentage);
    const matchedIngs = matchData.matched.join(', ');
    const missingIngs = matchData.missing.join(', ');

    return `
      <div class="recipe-card" style="border: 1px solid var(--border); border-radius: 12px; padding: 16px; background: var(--surface); box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h3 style="font-size: 1.1rem; margin: 0;">${r.name}</h3>
          <span style="background: ${matchPct >= 70 ? 'var(--success)' : (matchPct >= 40 ? 'var(--warning)' : 'var(--border)')}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">
            ${matchPct}% shoda
          </span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">${r.description}</p>
        
        <div style="font-size: 0.8rem; margin-bottom: 6px;">
          <strong style="color: var(--success);">Máte doma (${matchData.matched.length}):</strong> ${matchedIngs || 'žádné'}
        </div>
        ${missingIngs ? `
          <div style="font-size: 0.8rem; margin-bottom: 12px; color: var(--text-secondary);">
            <strong>Chybí (${matchData.missing.length}):</strong> ${missingIngs}
          </div>
        ` : '<div style="font-size: 0.8rem; margin-bottom: 12px; color: var(--success); font-weight: bold;">✅ Máte všechny potřebné suroviny!</div>'}
        
        <button class="btn-primary btn-block btn-small" onclick="App.Recipes.openReceptySearch('${r.name}')">
          Zobrazit postup na Recepty.cz ↗
        </button>
      </div>
    `;
  },
  
  matchRecipesToInventory(items) {
    const availableLower = items.map(it => it.name.toLowerCase());
    const results = [];

    for (let recipe of this.builtInRecipes) {
      const matched = [];
      const missing = [];

      for (let req of recipe.ingredients) {
        const reqLower = req.toLowerCase();
        const hasIt = availableLower.some(av => av.includes(reqLower) || reqLower.includes(av));
        if (hasIt) {
          matched.push(req);
        } else {
          missing.push(req);
        }
      }

      const matchPercentage = (matched.length / recipe.ingredients.length) * 100;
      if (matchPercentage > 0) {
        results.push({
          recipe,
          matchPercentage,
          matched,
          missing
        });
      }
    }

    results.sort((a, b) => b.matchPercentage - a.matchPercentage);
    return results;
  },
  
  setupRecipeUI() {
    const btnFromStock = document.getElementById('btn-recipes-from-stock');
    if (btnFromStock) {
      btnFromStock.addEventListener('click', () => this.searchFromStock());
    }

    const searchInput = document.getElementById('recipe-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = searchInput.value.trim();
          if (val) this.openReceptySearch(val);
        }
      });
    }
  }
};

