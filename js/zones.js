window.App = window.App || {};

App.Zones = {
  // Výchozí konfigurace spotřebičů a přihrádek
  defaultAppliances: [
    {
      id: 'fridge',
      name: 'Chladnička',
      icon: '🧊',
      theme: 'fridge',
      layout: 'fridge_door_split',
      mainLocationKey: 'lednice',
      compartments: [
        { id: 'lednice_horni', title: 'Horní police', desc: 'Mléčné výrobky, hotovky, jogurty', icon: '🥛', type: 'shelf', size: 'medium', column: 'main' },
        { id: 'lednice_stredni', title: 'Střední police', desc: 'Uzeniny, sýry, balené maso', icon: '🧀', type: 'shelf', size: 'medium', column: 'main' },
        { id: 'lednice_dolni', title: 'Dolní police', desc: 'Maso k vaření, nápoje, těžké nádoby', icon: '🥩', type: 'shelf', size: 'medium', column: 'main' },
        { id: 'lednice_suplik', title: 'Šuplík na zeleninu a ovoce', desc: 'Čerstvá zelenina, saláty, bylinky', icon: '🥗', type: 'drawer', size: 'large', column: 'main' },
        { id: 'lednice_dvere_horni', title: 'Dveře – Horní polička', desc: 'Vejce, máslo, droždí', icon: '🥚', type: 'door', size: 'small', column: 'door' },
        { id: 'lednice_dvere_stredni', title: 'Dveře – Střední polička', desc: 'Dresinky, omáčky, hořčice, marmelády', icon: '🥫', type: 'door', size: 'medium', column: 'door' },
        { id: 'lednice_dvere_dolni', title: 'Dveře – Dolní polička', desc: 'Mléko, džusy, vysoké láhve', icon: '🍾', type: 'door', size: 'large', column: 'door' },
        { id: 'lednice_dvere', title: 'Dveře (obecně)', desc: 'Poličky ve dveřích', icon: '🚪', type: 'door', size: 'medium', column: 'door', isLegacy: true },
        { id: 'lednice', title: 'Lednice (obecně)', desc: 'Obecné umístění v lednici', icon: '🧊', type: 'shelf', size: 'small', column: 'main', isLegacy: true }
      ]
    },
    {
      id: 'freezer',
      name: 'Mraznička',
      icon: '❄️',
      theme: 'freezer',
      layout: 'stacked',
      mainLocationKey: 'mrazak',
      compartments: [
        { id: 'mrazak_horni', title: 'Horní šuplík', desc: 'Rychlé mrazení, pečivo, zmrzlina, bylinky', icon: '🍦', type: 'drawer', size: 'medium' },
        { id: 'mrazak_stredni', title: 'Střední šuplík', desc: 'Maso, ryby, hotová mražená jídla', icon: '🥩', type: 'drawer', size: 'medium' },
        { id: 'mrazak_dolni', title: 'Dolní šuplík', desc: 'Mražená zelenina, hranolky, velké zásoby', icon: '🥦', type: 'drawer', size: 'large' },
        { id: 'mrazak', title: 'Mrazák (obecně)', desc: 'Obecné umístění v mrazáku', icon: '❄️', type: 'drawer', size: 'small', isLegacy: true }
      ]
    },
    {
      id: 'pantry',
      name: 'Spíž a skříně',
      icon: '🚪',
      theme: 'pantry',
      layout: 'stacked',
      mainLocationKey: 'spiz',
      compartments: [
        { id: 'spiz_1', title: 'Spíž – Horní police', desc: 'Konzervy, kompoty, zavařeniny, trvanlivé', icon: '🥫', type: 'shelf', size: 'medium' },
        { id: 'spiz_2', title: 'Spíž – Střední police', desc: 'Těstoviny, rýže, mouky, luštěniny, obiloviny', icon: '🌾', type: 'shelf', size: 'medium' },
        { id: 'spiz_3', title: 'Spíž – Dolní police', desc: 'Oleje, octy, balíky nápojů, velké zásoby', icon: '🍾', type: 'shelf', size: 'large' },
        { id: 'suplik', title: 'Šuplíky a přihrádky', desc: 'Koření, dochucovadla, čaje, sáčky', icon: '🗄️', type: 'drawer', size: 'small' },
        { id: 'skrin', title: 'Skříňka na sladkosti & kávu', desc: 'Káva, kakao, sladkosti, oříšky, snacky', icon: '🍫', type: 'shelf', size: 'medium' },
        { id: 'police', title: 'Otevřená police', desc: 'Běžně používané potraviny a kořenky', icon: '📚', type: 'shelf', size: 'small' },
        { id: 'spiz', title: 'Spíž (obecně)', desc: 'Obecné umístění ve spíži', icon: '🚪', type: 'shelf', size: 'small', isLegacy: true },
        { id: 'ostatni', title: 'Ostatní umístění', desc: 'Jinde v domácnosti', icon: '📦', type: 'shelf', size: 'small' }
      ]
    }
  ],

  appliances: [],
  zones: [],

  async init() {
    await this.loadAppliances();
    this.rebuildZonesList();
    this.populateLocationSelects();
    this.setupZonesUI();
    this.setupZoneEditorUI();
  },

  async loadAppliances() {
    try {
      const saved = await App.DB.getSetting('custom_appliances_config');
      if (saved && Array.isArray(saved) && saved.length > 0) {
        this.appliances = saved;
      } else {
        this.appliances = JSON.parse(JSON.stringify(this.defaultAppliances));
      }
    } catch (e) {
      this.appliances = JSON.parse(JSON.stringify(this.defaultAppliances));
    }
  },

  async saveAppliances() {
    await App.DB.setSetting('custom_appliances_config', this.appliances);
    this.rebuildZonesList();
    this.populateLocationSelects();
    window.dispatchEvent(new Event('app:zones-updated'));
  },

  async resetToDefaults() {
    if (confirm('Opravdu chcete obnovit výchozí zóny, police a rozložení?')) {
      this.appliances = JSON.parse(JSON.stringify(this.defaultAppliances));
      await this.saveAppliances();
      this.renderVisualZones();
      this.renderZoneEditor();
      if (App.Main) App.Main.showToast('Zóny byly obnoveny na výchozí stav', 'success', 2000);
    }
  },

  rebuildZonesList() {
    const list = [];
    this.appliances.forEach(app => {
      app.compartments.forEach(comp => {
        list.push({
          id: comp.id,
          main: app.mainLocationKey || app.id,
          applianceId: app.id,
          label: `${app.icon} ${app.name} – ${comp.title}`,
          shortLabel: comp.title,
          icon: comp.icon || app.icon || '📦',
          type: comp.type || 'shelf',
          size: comp.size || 'medium',
          desc: comp.desc || '',
          isLegacy: !!comp.isLegacy
        });
      });
    });
    this.zones = list;
  },

  getZoneLabel(key) {
    const found = this.zones.find(z => z.id === key);
    if (found) return found.label;
    // Fallback labels
    const fallbackMap = {
      'lednice': '🧊 Lednice (obecně)',
      'mrazak': '❄️ Mrazák (obecně)',
      'spiz': '🚪 Spíž (obecně)',
      'suplik': '🗄️ Šuplík',
      'skrin': '🗄️ Skříň',
      'police': '📚 Police',
      'ostatni': '📦 Ostatní'
    };
    return fallbackMap[key] || key || 'Neznámé';
  },

  getMainLocation(key) {
    const found = this.zones.find(z => z.id === key);
    return found ? found.main : key;
  },

  // Aktualizuje výběry umístění v formuláři a hromadných akcích
  populateLocationSelects() {
    const selects = [
      document.getElementById('item-location'),
      document.getElementById('select-bulk-move-location')
    ];

    selects.forEach(select => {
      if (!select) return;
      const isBulk = select.id === 'select-bulk-move-location';
      const prevVal = select.value;
      
      let html = isBulk ? '<option value="">📦 Přesunout do...</option>' : '';

      this.appliances.forEach(app => {
        const visibleComps = app.compartments.filter(c => !c.isLegacy || c.id === app.mainLocationKey);
        if (visibleComps.length === 0) return;

        html += `<optgroup label="${app.icon} ${app.name}">`;
        visibleComps.forEach(comp => {
          html += `<option value="${comp.id}">${comp.icon || ''} ${comp.title}</option>`;
        });
        html += `</optgroup>`;
      });

      select.innerHTML = html;
      if (prevVal) select.value = prevVal;
    });

    // Aktualizovat location-pills filtry
    const filterContainer = document.getElementById('location-filters');
    if (filterContainer) {
      const activePill = filterContainer.querySelector('.location-pill.active');
      const activeLoc = activePill ? activePill.dataset.location : 'all';

      let pillsHtml = `<button class="location-pill ${activeLoc === 'all' ? 'active' : ''}" data-location="all">🏠 Vše</button>`;
      this.appliances.forEach(app => {
        pillsHtml += `<button class="location-pill ${activeLoc === app.mainLocationKey ? 'active' : ''}" data-location="${app.mainLocationKey}">${app.icon} ${app.name}</button>`;
      });
      pillsHtml += `<button type="button" id="btn-visual-zones" class="btn-secondary btn-small" style="margin-left:auto; white-space:nowrap; border-radius:20px; font-weight:600;">🧊 Vizuální zóny</button>`;

      filterContainer.innerHTML = pillsHtml;

      // Znovu navázat posluchače
      if (App.Items && typeof App.Items.setupLocationFilters === 'function') {
        App.Items.setupLocationFilters();
      }
      this.setupZonesUI();
    }
  },

  // ==================== VIZUÁLNÍ PŘEHLED (LAYOUT & DRAG & DROP) ====================
  openVisualZonesModal() {
    this.renderVisualZones();
    if (App.Main) App.Main.showModal('modal-visual-zones');
  },

  renderVisualZones() {
    const container = document.getElementById('visual-zones-container');
    if (!container || !App.Items) return;

    const items = App.Items.items || [];

    const getItemsInCompartment = (comp, app) => {
      return items.filter(i => {
        if (i.location === comp.id) return true;
        // Fallback pro obecné umístění
        if (comp.id === app.mainLocationKey && (!i.location || i.location === app.mainLocationKey)) {
          return true;
        }
        return false;
      });
    };

    const renderItemsChips = (compItems) => {
      if (!compItems || compItems.length === 0) {
        return `<span class="empty-shelf-text">Prázdná přihrádka (přetáhněte sem)</span>`;
      }
      return compItems.map(it => {
        const emoji = App.Items.getCategoryEmoji(it.category);
        const expStatus = App.Items.getExpirationStatus(it);
        const cleanName = (it.name || '').replace(/'/g, "\\'");
        return `
          <div class="visual-item-chip exp-${expStatus.status}" 
               draggable="true" 
               data-item-id="${it.id}"
               onclick="event.stopPropagation(); App.Main.hideModal('modal-visual-zones'); App.Items.openDetailModal('${it.id}')" 
               title="${it.name} (${it.quantity} ${it.unit}) • Přetáhněte myší pro přesun">
            <span class="chip-handle">⋮⋮</span>
            <span>${emoji} ${it.name}</span>
            <span class="chip-qty">${it.quantity} ${it.unit}</span>
          </div>
        `;
      }).join('');
    };

    const renderCompartmentBox = (comp, app) => {
      const compItems = getItemsInCompartment(comp, app);
      const isDrawer = comp.type === 'drawer';
      const isDoor = comp.type === 'door';
      const sizeClass = `shelf-size-${comp.size || 'medium'}`;
      const compClass = isDrawer ? 'zone-drawer' : (isDoor ? 'zone-door-shelf' : 'zone-shelf');

      return `
        <div class="${compClass} ${sizeClass}" data-zone="${comp.id}" data-appliance="${app.id}">
          <div class="zone-title-bar">
            <span class="zone-title-text">${comp.icon || ''} ${comp.title}</span>
            <span class="zone-count-badge">${compItems.length}</span>
          </div>
          ${comp.desc ? `<div class="zone-desc-text">${comp.desc}</div>` : ''}
          <div class="zone-items-dropzone">${renderItemsChips(compItems)}</div>
        </div>
      `;
    };

    let appliancesHtml = '';

    this.appliances.forEach(app => {
      // Spočítat celkový počet potravin ve spotřebiči
      let totalAppItems = 0;
      app.compartments.forEach(c => {
        totalAppItems += getItemsInCompartment(c, app).length;
      });

      const themeClass = `appliance-theme-${app.theme || 'default'}`;

      if (app.layout === 'fridge_door_split') {
        // Chladnička s rozdělením: Hlavní police vlevo + Dveře přes celou výšku vpravo
        const mainComps = app.compartments.filter(c => c.column !== 'door' && !c.isLegacy);
        const doorComps = app.compartments.filter(c => c.column === 'door' && !c.isLegacy);

        appliancesHtml += `
          <div class="appliance-card ${themeClass}" data-appliance-id="${app.id}">
            <div class="appliance-header">
              <div class="appliance-title-wrap">
                <span class="appliance-icon">${app.icon}</span>
                <h3>${app.name}</h3>
              </div>
              <span class="badge badge-cat">${totalAppItems} potravin</span>
            </div>
            
            <div class="appliance-fridge-body">
              <!-- Hlavní komora (Police a spodní šuplíky) -->
              <div class="fridge-main-column">
                <div class="column-header-label">🧊 Hlavní prostor chladničky</div>
                <div class="main-shelves-stack">
                  ${mainComps.map(c => renderCompartmentBox(c, app)).join('')}
                </div>
              </div>

              <!-- Dveře chladničky (přes celou výšku zóny) -->
              <div class="fridge-door-column">
                <div class="column-header-label">🚪 Dveře chladničky</div>
                <div class="door-shelves-stack">
                  ${doorComps.map(c => renderCompartmentBox(c, app)).join('')}
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        // Klasické vertikální skládání (Mrazák, Spíž, Sklep, Vinotéka...)
        const visibleComps = app.compartments.filter(c => !c.isLegacy);

        appliancesHtml += `
          <div class="appliance-card ${themeClass}" data-appliance-id="${app.id}">
            <div class="appliance-header">
              <div class="appliance-title-wrap">
                <span class="appliance-icon">${app.icon}</span>
                <h3>${app.name}</h3>
              </div>
              <span class="badge badge-cat">${totalAppItems} potravin</span>
            </div>
            
            <div class="appliance-body stacked-body">
              ${visibleComps.map(c => renderCompartmentBox(c, app)).join('')}
            </div>
          </div>
        `;
      }
    });

    container.innerHTML = `
      <div class="visual-zones-toolbar mb-3">
        <div class="visual-zones-hint">
          <span>💡 <strong>Tip:</strong> Přetahujte položky myší nebo prstem mezi policemi pro okamžitou změnu umístění.</span>
        </div>
        <div class="visual-zones-btns">
          <button type="button" id="btn-open-zone-editor" class="btn-secondary btn-small">⚙️ Upravit zóny a police</button>
        </div>
      </div>
      <div class="visual-fridge-layout">
        ${appliancesHtml}
      </div>
    `;

    // Připojit Drag and Drop a filtry
    this.attachDragAndDropHandlers(container);
    this.attachShelfFilterHandlers(container);

    // Tlačítko editoru
    const btnEdit = document.getElementById('btn-open-zone-editor');
    if (btnEdit) {
      btnEdit.addEventListener('click', () => {
        this.openZoneEditorModal();
      });
    }
  },

  // ==================== DRAG & DROP IMPLEMENTACE ====================
  attachDragAndDropHandlers(container) {
    let draggedItemId = null;

    // 1. Mouse Drag & Drop (HTML5 standard)
    container.querySelectorAll('.visual-item-chip').forEach(chip => {
      chip.addEventListener('dragstart', (e) => {
        draggedItemId = chip.dataset.itemId;
        chip.classList.add('is-dragging');
        e.dataTransfer.setData('text/plain', draggedItemId);
        e.dataTransfer.effectAllowed = 'move';
      });

      chip.addEventListener('dragend', () => {
        chip.classList.remove('is-dragging');
        container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      });
    });

    container.querySelectorAll('.zone-shelf, .zone-drawer, .zone-door-shelf').forEach(dropTarget => {
      dropTarget.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        dropTarget.classList.add('drag-over');
      });

      dropTarget.addEventListener('dragleave', (e) => {
        if (!dropTarget.contains(e.relatedTarget)) {
          dropTarget.classList.remove('drag-over');
        }
      });

      dropTarget.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropTarget.classList.remove('drag-over');
        const itemId = e.dataTransfer.getData('text/plain') || draggedItemId;
        const targetZone = dropTarget.dataset.zone;

        if (itemId && targetZone) {
          await this.moveItemToZone(itemId, targetZone);
        }
      });
    });

    // 2. Mobile Touch Drag Support
    let touchDraggingChip = null;
    let touchClone = null;
    let currentDropTarget = null;

    container.querySelectorAll('.visual-item-chip').forEach(chip => {
      chip.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        touchDraggingChip = chip;
        draggedItemId = chip.dataset.itemId;

        const rect = chip.getBoundingClientRect();
        touchClone = chip.cloneNode(true);
        touchClone.className = 'visual-item-chip touch-drag-clone';
        touchClone.style.position = 'fixed';
        touchClone.style.zIndex = '9999';
        touchClone.style.pointerEvents = 'none';
        touchClone.style.opacity = '0.85';
        touchClone.style.left = `${rect.left}px`;
        touchClone.style.top = `${rect.top}px`;
        touchClone.style.width = `${rect.width}px`;
        document.body.appendChild(touchClone);

        chip.classList.add('is-dragging');
      }, { passive: true });

      chip.addEventListener('touchmove', (e) => {
        if (!touchDraggingChip || !touchClone) return;
        const touch = e.touches[0];
        touchClone.style.left = `${touch.clientX - 40}px`;
        touchClone.style.top = `${touch.clientY - 20}px`;

        const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const newTarget = elemBelow ? elemBelow.closest('.zone-shelf, .zone-drawer, .zone-door-shelf') : null;

        if (currentDropTarget !== newTarget) {
          if (currentDropTarget) currentDropTarget.classList.remove('drag-over');
          currentDropTarget = newTarget;
          if (currentDropTarget) currentDropTarget.classList.add('drag-over');
        }
      }, { passive: true });

      chip.addEventListener('touchend', async () => {
        if (touchClone) {
          touchClone.remove();
          touchClone = null;
        }
        if (touchDraggingChip) {
          touchDraggingChip.classList.remove('is-dragging');
          touchDraggingChip = null;
        }

        if (currentDropTarget && draggedItemId) {
          currentDropTarget.classList.remove('drag-over');
          const targetZone = currentDropTarget.dataset.zone;
          currentDropTarget = null;
          await this.moveItemToZone(draggedItemId, targetZone);
        }
        draggedItemId = null;
      });
    });
  },

  async moveItemToZone(itemId, targetZoneId) {
    if (!App.Items || !App.Items.items) return;
    const item = App.Items.items.find(i => i.id === itemId);
    if (!item) return;

    if (item.location === targetZoneId) return;

    const oldZoneLabel = this.getZoneLabel(item.location);
    const newZoneLabel = this.getZoneLabel(targetZoneId);

    item.location = targetZoneId;
    await App.Items.updateItem(item);

    this.renderVisualZones();
    if (App.Main) {
      App.Main.showToast(`✅ "${item.name}" přesunuto: ${newZoneLabel}`, 'success', 2500);
    }
  },

  attachShelfFilterHandlers(container) {
    container.querySelectorAll('.zone-shelf, .zone-drawer, .zone-door-shelf').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.visual-item-chip') || e.target.closest('.btn-bulk')) return;
        const zone = el.dataset.zone;
        if (zone && App.Items) {
          App.Items.setFilter('location', zone);
          if (App.Main) {
            App.Main.hideModal('modal-visual-zones');
            App.Main.navigate('inventory');
            App.Main.showToast(`Filtrováno podle zóny: ${this.getZoneLabel(zone)}`, 'info', 2000);
          }
        }
      });
    });
  },

  setupZonesUI() {
    const btnOpenZones = document.getElementById('btn-visual-zones');
    if (btnOpenZones) {
      btnOpenZones.addEventListener('click', () => {
        this.openVisualZonesModal();
      });
    }
  },

  // ==================== EDITOR VLASTNÍCH ZÓN A POLIC ====================
  openZoneEditorModal() {
    this.renderZoneEditor();
    if (App.Main) App.Main.showModal('modal-zone-editor');
  },

  renderZoneEditor() {
    const container = document.getElementById('zone-editor-container');
    if (!container) return;

    let html = `
      <div class="zone-editor-header-actions mb-3">
        <button type="button" id="btn-add-new-appliance" class="btn-primary btn-small">+ Přidat nový spotřebič / prostor</button>
        <button type="button" id="btn-reset-zones" class="btn-secondary btn-small" style="color:var(--danger);">↺ Obnovit výchozí rozložení</button>
      </div>
    `;

    this.appliances.forEach((app, appIdx) => {
      const isFridge = app.layout === 'fridge_door_split';
      const visibleComps = app.compartments.filter(c => !c.isLegacy);

      html += `
        <div class="editor-appliance-card mb-4" data-app-idx="${appIdx}">
          <div class="editor-appliance-head">
            <div class="flex-row align-center gap-2">
              <span class="appliance-icon-large">${app.icon}</span>
              <div>
                <h3 style="margin:0;">${app.name}</h3>
                <span class="text-small text-muted">${visibleComps.length} přihrádek / polic</span>
              </div>
            </div>
            <div class="editor-app-btns">
              <button type="button" class="btn-secondary btn-small btn-add-shelf-to-app" data-app-idx="${appIdx}">+ Přidat polici/šuplík</button>
              ${this.appliances.length > 1 ? `<button type="button" class="btn-text text-danger btn-delete-app" data-app-idx="${appIdx}" title="Smazat spotřebič">🗑️</button>` : ''}
            </div>
          </div>

          <div class="editor-shelves-list mt-2">
            ${visibleComps.map((comp, compIdx) => {
              const actualIdx = app.compartments.findIndex(c => c.id === comp.id);
              return `
                <div class="editor-shelf-row" data-comp-id="${comp.id}">
                  <div class="shelf-reorder-btns">
                    <button type="button" class="btn-move-shelf btn-shelf-up" data-app-idx="${appIdx}" data-comp-idx="${actualIdx}" ${compIdx === 0 ? 'disabled' : ''} title="Posunout nahoru">▲</button>
                    <button type="button" class="btn-move-shelf btn-shelf-down" data-app-idx="${appIdx}" data-comp-idx="${actualIdx}" ${compIdx === visibleComps.length - 1 ? 'disabled' : ''} title="Posunout dolů">▼</button>
                  </div>
                  <span class="comp-icon-preview">${comp.icon || '📦'}</span>
                  <div class="shelf-info-edit flex-1">
                    <input type="text" class="input-shelf-title" data-app-idx="${appIdx}" data-comp-idx="${actualIdx}" value="${comp.title}" placeholder="Název police...">
                    <input type="text" class="input-shelf-desc text-small text-muted" data-app-idx="${appIdx}" data-comp-idx="${actualIdx}" value="${comp.desc || ''}" placeholder="Popis potravin (např. jogurty, sýry)...">
                  </div>
                  <div class="shelf-options-wrap">
                    <select class="select-shelf-size" data-app-idx="${appIdx}" data-comp-idx="${actualIdx}" title="Výška / Velikost přihrádky">
                      <option value="small" ${comp.size === 'small' ? 'selected' : ''}>📏 Malá výška</option>
                      <option value="medium" ${comp.size === 'medium' || !comp.size ? 'selected' : ''}>📏 Střední výška</option>
                      <option value="large" ${comp.size === 'large' ? 'selected' : ''}>📏 Velká výška / Hluboká</option>
                    </select>
                    <select class="select-shelf-type" data-app-idx="${appIdx}" data-comp-idx="${actualIdx}" title="Typ přihrádky">
                      <option value="shelf" ${comp.type === 'shelf' ? 'selected' : ''}>📚 Police</option>
                      <option value="drawer" ${comp.type === 'drawer' ? 'selected' : ''}>🗄️ Šuplík</option>
                      <option value="door" ${comp.type === 'door' ? 'selected' : ''}>🚪 Dveře</option>
                    </select>
                    ${isFridge ? `
                      <select class="select-shelf-col" data-app-idx="${appIdx}" data-comp-idx="${actualIdx}" title="Sloupec v chladničce">
                        <option value="main" ${comp.column !== 'door' ? 'selected' : ''}>🧊 Hlavní komora</option>
                        <option value="door" ${comp.column === 'door' ? 'selected' : ''}>🚪 Dveře</option>
                      </select>
                    ` : ''}
                    <button type="button" class="btn-text text-danger btn-delete-comp" data-app-idx="${appIdx}" data-comp-idx="${actualIdx}" title="Smazat polici">🗑️</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    this.attachEditorListeners(container);
  },

  attachEditorListeners(container) {
    // Přidat nový spotřebič
    const btnAddApp = document.getElementById('btn-add-new-appliance');
    if (btnAddApp) {
      btnAddApp.addEventListener('click', async () => {
        const name = prompt('Zadejte název nového spotřebiče nebo prostoru (např. Sklep, Vinotéka, Balkon):');
        if (!name || !name.trim()) return;

        const icon = prompt('Zadejte emoji ikonu (např. 🍷, 🗄️, 📦, 🧊, 🚪):', '📦') || '📦';
        const newAppId = 'custom_' + Date.now();
        const mainLocKey = newAppId;

        this.appliances.push({
          id: newAppId,
          name: name.trim(),
          icon: icon.trim(),
          theme: 'custom',
          layout: 'stacked',
          mainLocationKey: mainLocKey,
          compartments: [
            { id: `${newAppId}_1`, title: 'Police 1', desc: 'Horní police', icon: icon.trim(), type: 'shelf', size: 'medium' },
            { id: `${newAppId}_2`, title: 'Police 2', desc: 'Dolní police', icon: icon.trim(), type: 'shelf', size: 'medium' }
          ]
        });

        await this.saveAppliances();
        this.renderZoneEditor();
        this.renderVisualZones();
        if (App.Main) App.Main.showToast(`Spotřebič "${name}" byl vytvořen`, 'success', 2000);
      });
    }

    // Resetovat na výchozí
    const btnReset = document.getElementById('btn-reset-zones');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.resetToDefaults());
    }

    // Přidat polici do spotřebiče
    container.querySelectorAll('.btn-add-shelf-to-app').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const appIdx = parseInt(btn.dataset.appIdx, 10);
        const app = this.appliances[appIdx];
        if (!app) return;

        const title = prompt(`Zadejte název nové police v "${app.name}":`, `Police ${app.compartments.length + 1}`);
        if (!title || !title.trim()) return;

        const newCompId = `${app.id}_${Date.now()}`;
        app.compartments.push({
          id: newCompId,
          title: title.trim(),
          desc: '',
          icon: app.icon || '📦',
          type: 'shelf',
          size: 'medium',
          column: app.layout === 'fridge_door_split' ? 'main' : undefined
        });

        await this.saveAppliances();
        this.renderZoneEditor();
        this.renderVisualZones();
        if (App.Main) App.Main.showToast(`Police "${title}" přidána`, 'success', 2000);
      });
    });

    // Smazat spotřebič
    container.querySelectorAll('.btn-delete-app').forEach(btn => {
      btn.addEventListener('click', async () => {
        const appIdx = parseInt(btn.dataset.appIdx, 10);
        const app = this.appliances[appIdx];
        if (!app) return;

        if (confirm(`Opravdu chcete smazat spotřebič "${app.name}" a všechny jeho přihrádky?`)) {
          this.appliances.splice(appIdx, 1);
          await this.saveAppliances();
          this.renderZoneEditor();
          this.renderVisualZones();
        }
      });
    });

    // Změna názvu police
    container.querySelectorAll('.input-shelf-title').forEach(inp => {
      inp.addEventListener('change', async () => {
        const appIdx = parseInt(inp.dataset.appIdx, 10);
        const compIdx = parseInt(inp.dataset.compIdx, 10);
        if (this.appliances[appIdx]?.compartments[compIdx]) {
          this.appliances[appIdx].compartments[compIdx].title = inp.value.trim() || 'Police';
          await this.saveAppliances();
          this.renderVisualZones();
        }
      });
    });

    // Změna popisu police
    container.querySelectorAll('.input-shelf-desc').forEach(inp => {
      inp.addEventListener('change', async () => {
        const appIdx = parseInt(inp.dataset.appIdx, 10);
        const compIdx = parseInt(inp.dataset.compIdx, 10);
        if (this.appliances[appIdx]?.compartments[compIdx]) {
          this.appliances[appIdx].compartments[compIdx].desc = inp.value.trim();
          await this.saveAppliances();
          this.renderVisualZones();
        }
      });
    });

    // Změna velikosti/výšky
    container.querySelectorAll('.select-shelf-size').forEach(sel => {
      sel.addEventListener('change', async () => {
        const appIdx = parseInt(sel.dataset.appIdx, 10);
        const compIdx = parseInt(sel.dataset.compIdx, 10);
        if (this.appliances[appIdx]?.compartments[compIdx]) {
          this.appliances[appIdx].compartments[compIdx].size = sel.value;
          await this.saveAppliances();
          this.renderVisualZones();
        }
      });
    });

    // Změna typu (police / šuplík / dveře)
    container.querySelectorAll('.select-shelf-type').forEach(sel => {
      sel.addEventListener('change', async () => {
        const appIdx = parseInt(sel.dataset.appIdx, 10);
        const compIdx = parseInt(sel.dataset.compIdx, 10);
        if (this.appliances[appIdx]?.compartments[compIdx]) {
          this.appliances[appIdx].compartments[compIdx].type = sel.value;
          await this.saveAppliances();
          this.renderVisualZones();
        }
      });
    });

    // Změna sloupce v chladničce (hlavní / dveře)
    container.querySelectorAll('.select-shelf-col').forEach(sel => {
      sel.addEventListener('change', async () => {
        const appIdx = parseInt(sel.dataset.appIdx, 10);
        const compIdx = parseInt(sel.dataset.compIdx, 10);
        if (this.appliances[appIdx]?.compartments[compIdx]) {
          this.appliances[appIdx].compartments[compIdx].column = sel.value;
          await this.saveAppliances();
          this.renderVisualZones();
        }
      });
    });

    // Smazat polici
    container.querySelectorAll('.btn-delete-comp').forEach(btn => {
      btn.addEventListener('click', async () => {
        const appIdx = parseInt(btn.dataset.appIdx, 10);
        const compIdx = parseInt(btn.dataset.compIdx, 10);
        const app = this.appliances[appIdx];
        if (!app || !app.compartments[compIdx]) return;

        const comp = app.compartments[compIdx];
        if (confirm(`Opravdu chcete smazat polici "${comp.title}"?`)) {
          // Případné položky přemístit do obecného umístění spotřebiče
          if (App.Items && App.Items.items) {
            const itemsInComp = App.Items.items.filter(i => i.location === comp.id);
            for (let it of itemsInComp) {
              it.location = app.mainLocationKey;
              await App.Items.updateItem(it);
            }
          }

          app.compartments.splice(compIdx, 1);
          await this.saveAppliances();
          this.renderZoneEditor();
          this.renderVisualZones();
        }
      });
    });

    // Posun nahoru / dolů
    container.querySelectorAll('.btn-shelf-up').forEach(btn => {
      btn.addEventListener('click', async () => {
        const appIdx = parseInt(btn.dataset.appIdx, 10);
        const compIdx = parseInt(btn.dataset.compIdx, 10);
        const app = this.appliances[appIdx];
        if (app && compIdx > 0) {
          const temp = app.compartments[compIdx];
          app.compartments[compIdx] = app.compartments[compIdx - 1];
          app.compartments[compIdx - 1] = temp;
          await this.saveAppliances();
          this.renderZoneEditor();
          this.renderVisualZones();
        }
      });
    });

    container.querySelectorAll('.btn-shelf-down').forEach(btn => {
      btn.addEventListener('click', async () => {
        const appIdx = parseInt(btn.dataset.appIdx, 10);
        const compIdx = parseInt(btn.dataset.compIdx, 10);
        const app = this.appliances[appIdx];
        if (app && compIdx < app.compartments.length - 1) {
          const temp = app.compartments[compIdx];
          app.compartments[compIdx] = app.compartments[compIdx + 1];
          app.compartments[compIdx + 1] = temp;
          await this.saveAppliances();
          this.renderZoneEditor();
          this.renderVisualZones();
        }
      });
    });
  },

  setupZoneEditorUI() {
    // Posluchač události pro aktualizaci položek
    window.addEventListener('app:items-updated', () => {
      const modal = document.getElementById('modal-visual-zones');
      if (modal && !modal.classList.contains('hidden')) {
        this.renderVisualZones();
      }
    });
  }
};
