window.App = window.App || {};

App.DB = {
  db: null,
  dbName: 'potraviny-db',
  dbVersion: 2,

  defaultSettings: {
    wasteTrackerEnabled: true,
    pushNotificationsEnabled: false,
    expirationWarningDays: 3,
    googleSheetsId: '',
    googleSheetsApiKey: '',
    darkMode: false,
    defaultView: 'grid',
    aiApiKey: '',
    autoPricesEnabled: true,
  },

  init() {
    return new Promise((resolve) => {
      const openDb = (ver) => {
        const request = indexedDB.open(this.dbName, ver);

        request.onblocked = () => {
          console.warn('Database upgrade blocked by another connection.');
        };

        request.onerror = (event) => {
          console.error('Database open error: ', event.target.error);
          resolve(null);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          if (!db.objectStoreNames.contains('items')) {
            db.createObjectStore('items', { keyPath: 'id' });
          }
          
          if (!db.objectStoreNames.contains('history')) {
            const historyStore = db.createObjectStore('history', { keyPath: 'id' });
            historyStore.createIndex('date', 'date', { unique: false });
            historyStore.createIndex('itemId', 'itemId', { unique: false });
            historyStore.createIndex('action', 'action', { unique: false });
          }
          
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }

          if (!db.objectStoreNames.contains('shopping_list')) {
            const shoppingStore = db.createObjectStore('shopping_list', { keyPath: 'id' });
            shoppingStore.createIndex('category', 'category', { unique: false });
            shoppingStore.createIndex('checked', 'checked', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          this.db.onversionchange = () => {
            this.db.close();
          };

          // Pokud v otevřené DB chybí shopping_list, automaticky navýšíme verzi
          if (!this.db.objectStoreNames.contains('shopping_list')) {
            const nextVer = (this.db.version || 1) + 1;
            this.db.close();
            openDb(nextVer);
            return;
          }

          resolve(this.db);
        };
      };

      openDb(this.dbVersion);
    });
  },

  async getAll(storeName) {
    return new Promise((resolve) => {
      if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
        return resolve([]);
      }
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      } catch (e) {
        console.warn(`Store ${storeName} read error:`, e);
        resolve([]);
      }
    });
  },

  async get(storeName, id) {
    return new Promise((resolve) => {
      if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
        return resolve(null);
      }
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch (e) {
        console.warn(`Store ${storeName} get error:`, e);
        resolve(null);
      }
    });
  },

  async add(storeName, record) {
    return new Promise((resolve, reject) => {
      if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
        return resolve(record);
      }
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(record);

        request.onsuccess = () => resolve(record);
        request.onerror = () => resolve(record);
      } catch (e) {
        resolve(record);
      }
    });
  },

  async put(storeName, record) {
    return new Promise((resolve, reject) => {
      if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
        return resolve(record);
      }
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(record);

        request.onsuccess = () => resolve(record);
        request.onerror = () => resolve(record);
      } catch (e) {
        resolve(record);
      }
    });
  },

  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
        return resolve(id);
      }
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
      } catch (e) {
        console.warn(`Store ${storeName} delete error:`, e);
        resolve(id);
      }
    });
  },

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
        return resolve();
      }
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (e) {
        console.warn(`Store ${storeName} clear error:`, e);
        resolve();
      }
    });
  },

  async getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
        return resolve([]);
      }
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (e) {
        console.warn(`Store ${storeName} getByIndex error:`, e);
        resolve([]);
      }
    });
  },

  async getSetting(key) {
    const record = await this.get('settings', key);
    return record ? record.value : this.defaultSettings[key];
  },

  async setSetting(key, value) {
    return this.put('settings', { key, value });
  },

  async getAllSettings() {
    const records = await this.getAll('settings');
    const settings = { ...this.defaultSettings };
    for (const record of records) {
      settings[record.key] = record.value;
    }
    return settings;
  },

  async exportAll() {
    const items = await this.getAll('items');
    const history = await this.getAll('history');
    const settings = await this.getAll('settings');
    const shopping_list = await this.getAll('shopping_list');
    
    return JSON.stringify({
      items,
      history,
      settings,
      shopping_list
    });
  },

  async importAll(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      await this.clear('items');
      await this.clear('history');
      await this.clear('settings');
      await this.clear('shopping_list');
      
      if (data.items) {
        for (const item of data.items) {
          await this.put('items', item);
        }
      }
      if (data.history) {
        for (const entry of data.history) {
          await this.put('history', entry);
        }
      }
      if (data.settings) {
        for (const setting of data.settings) {
          await this.put('settings', setting);
        }
      }
      if (data.shopping_list) {
        for (const item of data.shopping_list) {
          await this.put('shopping_list', item);
        }
      }
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }
};
