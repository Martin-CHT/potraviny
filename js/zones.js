window.App = window.App || {};

App.Zones = {
  zones: [
    // Lednice
    { id: 'lednice_horni', main: 'lednice', label: '🧊 Lednice – Horní police', shortLabel: 'Horní police', icon: '🧊' },
    { id: 'lednice_stredni', main: 'lednice', label: '🧊 Lednice – Střední police', shortLabel: 'Střední police', icon: '🧊' },
    { id: 'lednice_dolni', main: 'lednice', label: '🧊 Lednice – Dolní police', shortLabel: 'Dolní police', icon: '🧊' },
    { id: 'lednice_dvere', main: 'lednice', label: '🚪 Lednice – Dveře', shortLabel: 'Dveře', icon: '🚪' },
    { id: 'lednice_suplik', main: 'lednice', label: '🥗 Lednice – Šuplík na zeleninu/ovoce', shortLabel: 'Šuplík na zeleninu', icon: '🥗' },
    { id: 'lednice', main: 'lednice', label: '🧊 Lednice – Obecně', shortLabel: 'Lednice (obecně)', icon: '🧊' },

    // Mrazák
    { id: 'mrazak_horni', main: 'mrazak', label: '❄️ Mrazák – Horní šuplík (Rychlé mrazení)', shortLabel: 'Horní šuplík', icon: '❄️' },
    { id: 'mrazak_stredni', main: 'mrazak', label: '❄️ Mrazák – Střední šuplík (Maso & zelenina)', shortLabel: 'Střední šuplík', icon: '❄️' },
    { id: 'mrazak_dolni', main: 'mrazak', label: '❄️ Mrazák – Dolní šuplík (Zásoby)', shortLabel: 'Dolní šuplík', icon: '❄️' },
    { id: 'mrazak', main: 'mrazak', label: '❄️ Mrazák – Obecně', shortLabel: 'Mrazák (obecně)', icon: '❄️' },

    // Spíž a skříně
    { id: 'spiz_1', main: 'spiz', label: '🚪 Spíž – Regál 1', shortLabel: 'Regál 1', icon: '🚪' },
    { id: 'spiz_2', main: 'spiz', label: '🚪 Spíž – Regál 2', shortLabel: 'Regál 2', icon: '🚪' },
    { id: 'spiz_3', main: 'spiz', label: '🚪 Spíž – Regál 3', shortLabel: 'Regál 3', icon: '🚪' },
    { id: 'spiz', main: 'spiz', label: '🚪 Spíž – Obecně', shortLabel: 'Spíž (obecně)', icon: '🚪' },

    { id: 'suplik', main: 'suplik', label: '🗄️ Šuplík', shortLabel: 'Šuplík', icon: '🗄️' },
    { id: 'skrin', main: 'skrin', label: '🗄️ Skříň', shortLabel: 'Skříň', icon: '🗄️' },
    { id: 'police', main: 'police', label: '📚 Police', shortLabel: 'Police', icon: '📚' },
    { id: 'ostatni', main: 'ostatni', label: '📦 Ostatní', shortLabel: 'Ostatní', icon: '📦' }
  ],

  getZoneLabel(key) {
    const found = this.zones.find(z => z.id === key);
    return found ? found.label : (key || 'Neznámé');
  },

  getMainLocation(key) {
    const found = this.zones.find(z => z.id === key);
    return found ? found.main : key;
  },

  // Otevření vizuálního zobrazení lednice a mrazáku
  openVisualZonesModal() {
    this.renderVisualZones();
    if (App.Main) App.Main.showModal('modal-visual-zones');
  },

  renderVisualZones() {
    const container = document.getElementById('visual-zones-container');
    if (!container || !App.Items) return;

    const items = App.Items.items || [];

    const getItemsInZone = (zoneId, fallbackMain = null) => {
      return items.filter(i => {
        if (i.location === zoneId) return true;
        if (fallbackMain && (i.location === fallbackMain || !i.location)) return true;
        return false;
      });
    };

    const renderShelfItems = (shelfItems) => {
      if (!shelfItems || shelfItems.length === 0) {
        return `<span class="text-muted text-small" style="font-style: italic; opacity:0.6;">Prázdná přihrádka</span>`;
      }
      return shelfItems.map(it => {
        const emoji = App.Items.getCategoryEmoji(it.category);
        const expStatus = App.Items.getExpirationStatus(it);
        const cleanName = it.name.replace(/'/g, "\\'");
        return `
          <div class="visual-item-chip exp-${expStatus.status}" onclick="event.stopPropagation(); App.Main.hideModal('modal-visual-zones'); App.Items.openDetailModal('${it.id}')" title="${it.name} (${it.quantity} ${it.unit})">
            <span>${emoji} ${it.name}</span>
            <span class="chip-qty">${it.quantity} ${it.unit}</span>
          </div>
        `;
      }).join('');
    };

    container.innerHTML = `
      <div class="visual-fridge-layout">
        <!-- LEDNICE -->
        <div class="appliance-card fridge-box">
          <div class="appliance-header">
            <h3>🧊 Chladnička</h3>
            <span class="badge badge-cat">${getItemsInZone('lednice_horni').length + getItemsInZone('lednice_stredni').length + getItemsInZone('lednice_dolni').length + getItemsInZone('lednice_dvere').length + getItemsInZone('lednice_suplik').length + getItemsInZone('lednice').length} potravin</span>
          </div>
          
          <div class="appliance-body">
            <!-- Horní police -->
            <div class="zone-shelf" data-zone="lednice_horni">
              <div class="zone-title">Horní police (mléčné, hotovky)</div>
              <div class="zone-items">${renderShelfItems([...getItemsInZone('lednice_horni'), ...getItemsInZone('lednice')].filter((v,i,a)=>a.findIndex(t=>t.id===v.id)===i))}</div>
            </div>

            <!-- Střední police -->
            <div class="zone-shelf" data-zone="lednice_stredni">
              <div class="zone-title">Střední police (uzeniny, sýry, maso)</div>
              <div class="zone-items">${renderShelfItems(getItemsInZone('lednice_stredni'))}</div>
            </div>

            <!-- Dolní police -->
            <div class="zone-shelf" data-zone="lednice_dolni">
              <div class="zone-title">Dolní police (nápoje, těžké nádoby)</div>
              <div class="zone-items">${renderShelfItems(getItemsInZone('lednice_dolni'))}</div>
            </div>

            <!-- Dveře a Šuplík -->
            <div class="zone-row-split">
              <div class="zone-shelf flex-1" data-zone="lednice_suplik">
                <div class="zone-title">🥗 Šuplík na zeleninu/ovoce</div>
                <div class="zone-items">${renderShelfItems(getItemsInZone('lednice_suplik'))}</div>
              </div>
              <div class="zone-shelf flex-1" data-zone="lednice_dvere">
                <div class="zone-title">🚪 Dveře (vejce, omáčky, mléko)</div>
                <div class="zone-items">${renderShelfItems(getItemsInZone('lednice_dvere'))}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- MRAZÁK -->
        <div class="appliance-card freezer-box">
          <div class="appliance-header">
            <h3>❄️ Mraznička</h3>
            <span class="badge badge-cat">${getItemsInZone('mrazak_horni').length + getItemsInZone('mrazak_stredni').length + getItemsInZone('mrazak_dolni').length + getItemsInZone('mrazak').length} potravin</span>
          </div>
          
          <div class="appliance-body">
            <!-- Horní šuplík -->
            <div class="zone-drawer" data-zone="mrazak_horni">
              <div class="zone-title">❄️ Horní šuplík (zmrzlina, pečivo, bylinky)</div>
              <div class="zone-items">${renderShelfItems([...getItemsInZone('mrazak_horni'), ...getItemsInZone('mrazak')].filter((v,i,a)=>a.findIndex(t=>t.id===v.id)===i))}</div>
            </div>

            <!-- Střední šuplík -->
            <div class="zone-drawer" data-zone="mrazak_stredni">
              <div class="zone-title">❄️ Střední šuplík (maso, ryby, hotová jídla)</div>
              <div class="zone-items">${renderShelfItems(getItemsInZone('mrazak_stredni'))}</div>
            </div>

            <!-- Dolní šuplík -->
            <div class="zone-drawer" data-zone="mrazak_dolni">
              <div class="zone-title">❄️ Dolní šuplík (mražená zelenina, hranolky, zásoby)</div>
              <div class="zone-items">${renderShelfItems(getItemsInZone('mrazak_dolni'))}</div>
            </div>
          </div>
        </div>

        <!-- SPÍŽ A SKŘÍŇ -->
        <div class="appliance-card pantry-box">
          <div class="appliance-header">
            <h3>🚪 Spíž a regály</h3>
            <span class="badge badge-cat">${getItemsInZone('spiz_1').length + getItemsInZone('spiz_2').length + getItemsInZone('spiz_3').length + getItemsInZone('spiz').length + getItemsInZone('suplik').length + getItemsInZone('skrin').length + getItemsInZone('police').length + getItemsInZone('ostatni').length} potravin</span>
          </div>
          
          <div class="appliance-body">
            <div class="zone-shelf" data-zone="spiz_1">
              <div class="zone-title">🚪 Spíž – Horní police (konzervy, trvanlivé)</div>
              <div class="zone-items">${renderShelfItems([...getItemsInZone('spiz_1'), ...getItemsInZone('spiz')].filter((v,i,a)=>a.findIndex(t=>t.id===v.id)===i))}</div>
            </div>
            <div class="zone-shelf" data-zone="spiz_2">
              <div class="zone-title">🚪 Spíž – Střední police (těstoviny, rýže, mouky)</div>
              <div class="zone-items">${renderShelfItems(getItemsInZone('spiz_2'))}</div>
            </div>
            <div class="zone-shelf" data-zone="suplik">
              <div class="zone-title">🗄️ Šuplíky a skříňky (koření, dochucovadla, sladkosti)</div>
              <div class="zone-items">${renderShelfItems([...getItemsInZone('suplik'), ...getItemsInZone('skrin'), ...getItemsInZone('police'), ...getItemsInZone('ostatni')].filter((v,i,a)=>a.findIndex(t=>t.id===v.id)===i))}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Kliknutí na zónu vyfiltruje položky v inventáři
    container.querySelectorAll('.zone-shelf, .zone-drawer').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.visual-item-chip')) return;
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
  }
};
