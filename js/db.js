window.App = window.App || {};

App.DB = {
  db: null,
  dbName: 'potraviny-db',
  dbVersion: 1,

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
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Database error: ', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
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
      };
    });
  },

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async add(storeName, record) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(record);

      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  },

  async put(storeName, record) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  },

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
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
    
    return JSON.stringify({
      items,
      history,
      settings
    });
  },

  async importAll(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      await this.clear('items');
      await this.clear('history');
      await this.clear('settings');
      
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
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }
};
