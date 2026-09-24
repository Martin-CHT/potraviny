window.App = window.App || {};

App.Voice = {
  recognition: null,
  isListening: false,
  tempItems: [],
  
  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser.');
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'cs-CZ';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    
    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateUI();
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      this.updateUI();
    };
    
    this.recognition.onresult = (event) => this.onResult(event);
    this.recognition.onerror = (event) => this.onError(event);
    
    this.setupVoiceModal();
  },
  
  startListening() {
    if (!this.recognition) {
      this.init();
      if (!this.recognition) {
        if (App.Main) App.Main.showToast('Váš prohlížeč nepodporuje hlasové zadávání (vyžaduje Chrome / Edge / Safari).', 'warning', 3500);
        return;
      }
    }
    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition already started or error:', e);
    }
  },
  
  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  },

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  },
  
  onResult(event) {
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    const display = document.getElementById('voice-transcript');
    if (display) {
      display.innerHTML = `<span>${finalTranscript}</span> <em style="opacity:0.6;">${interimTranscript}</em>`;
    }
    
    if (finalTranscript.trim() !== '') {
      this.parseAndPreview(finalTranscript);
    }
  },
  
  async parseAndPreview(text) {
    if (!text || !text.trim()) return;
    
    const status = document.getElementById('voice-status');
    if (status) status.textContent = 'Zpracovávám potraviny...';

    const items = await (App.AI ? App.AI.parseVoiceText(text) : []);
    
    this.tempItems = items;
    this.renderVoiceItems();

    if (status) {
      status.textContent = items.length > 0 ? `Rozpoznáno položek: ${items.length}` : 'Zkuste to prosím znovu.';
    }
  },

  renderVoiceItems() {
    const container = document.getElementById('voice-parsed-items');
    const list = document.getElementById('voice-items-list');
    const confirmBtn = document.getElementById('btn-voice-confirm');
    
    if (!list) return;

    if (!this.tempItems || this.tempItems.length === 0) {
      if (container) container.classList.add('hidden');
      if (confirmBtn) confirmBtn.classList.add('hidden');
      return;
    }

    if (container) container.classList.remove('hidden');
    if (confirmBtn) confirmBtn.classList.remove('hidden');

    list.innerHTML = this.tempItems.map((it, idx) => `
      <div style="display: flex; gap: 8px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border);">
        <input type="text" class="flex-1" value="${it.name}" 
          style="padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px; font-size: 0.9rem;"
          onchange="App.Voice.tempItems[${idx}].name=this.value">
        
        <input type="number" value="${it.quantity}" min="0.1" step="0.5" 
          style="width: 50px; padding: 6px 4px; border: 1px solid var(--border); border-radius: 6px; text-align: center;"
          onchange="App.Voice.tempItems[${idx}].quantity=parseFloat(this.value)||1">
        
        <select style="width: 65px; padding: 6px 4px; border: 1px solid var(--border); border-radius: 6px; font-size: 0.85rem;"
          onchange="App.Voice.tempItems[${idx}].unit=this.value">
          <option value="ks" ${it.unit==='ks'?'selected':''}>ks</option>
          <option value="kg" ${it.unit==='kg'?'selected':''}>kg</option>
          <option value="g" ${it.unit==='g'?'selected':''}>g</option>
          <option value="l" ${it.unit==='l'?'selected':''}>l</option>
          <option value="ml" ${it.unit==='ml'?'selected':''}>ml</option>
          <option value="baleni" ${it.unit==='baleni'?'selected':''}>bal.</option>
        </select>
        
        <select style="width: 100px; padding: 6px 4px; border: 1px solid var(--border); border-radius: 6px; font-size: 0.85rem;"
          onchange="App.Voice.tempItems[${idx}].location=this.value">
          <option value="lednice" ${it.location==='lednice'?'selected':''}>🧊 Lednice</option>
          <option value="mrazak" ${it.location==='mrazak'?'selected':''}>❄️ Mrazák</option>
          <option value="spiz" ${it.location==='spiz'?'selected':''}>🚪 Spíž</option>
          <option value="suplik" ${it.location==='suplik'?'selected':''}>🗄️ Šuplík</option>
          <option value="skrin" ${it.location==='skrin'?'selected':''}>🗄️ Skříň</option>
          <option value="police" ${it.location==='police'?'selected':''}>📚 Police</option>
        </select>
        
        <button type="button" class="btn-close" style="font-size: 1rem; padding: 0 4px;"
          onclick="App.Voice.tempItems.splice(${idx},1); App.Voice.renderVoiceItems();">❌</button>
      </div>
    `).join('');
  },
  
  async confirmVoiceItems() {
    if (!this.tempItems || this.tempItems.length === 0) return;
    
    let added = 0;
    for (let it of this.tempItems) {
      const exp = it.expirations || (App.AI ? [App.AI.predictExpiration(it.name, it.category)] : []);
      const priceInfo = App.Prices ? await App.Prices.lookupPrice(it.name) : null;

      await App.Items.addItem({
        name: it.name,
        category: it.category || (App.AI ? App.AI.classifyItem(it.name) : 'ostatni'),
        location: it.location || 'spiz',
        quantity: it.quantity || 1,
        unit: it.unit || 'ks',
        price: priceInfo ? priceInfo.price : null,
        expirations: exp
      });
      added++;
    }
    
    if (App.Main) {
      App.Main.showToast(`Hlasem přidáno ${added} potravin.`, 'success', 2500);
      App.Main.hideModal('modal-voice-input');
      App.Items.renderItems();
    }
    this.resetModal();
  },

  resetModal() {
    this.tempItems = [];
    const display = document.getElementById('voice-transcript');
    if (display) display.innerHTML = '';
    const container = document.getElementById('voice-parsed-items');
    if (container) container.classList.add('hidden');
    const confirmBtn = document.getElementById('btn-voice-confirm');
    if (confirmBtn) confirmBtn.classList.add('hidden');
    const status = document.getElementById('voice-status');
    if (status) status.textContent = 'Klikněte pro nahrávání';
  },
  
  onError(event) {
    console.warn('Voice recognition error:', event.error);
    const status = document.getElementById('voice-status');
    if (status) {
      status.textContent = event.error === 'no-speech' ? 'Nezaznamenán žádný hlas. Zkuste to znovu.' : `Chyba mikrofonu: ${event.error}`;
    }
  },
  
  updateUI() {
    const btn = document.getElementById('btn-start-voice');
    const status = document.getElementById('voice-status');
    if (btn) {
      btn.classList.toggle('listening', this.isListening);
    }
    if (status && this.isListening) {
      status.textContent = 'Naslouchám... Mluvte prosím.';
    }
  },
  
  setupVoiceModal() {
    const startBtn = document.getElementById('btn-start-voice');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.toggleListening());
    }
    
    const confirmBtn = document.getElementById('btn-voice-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.confirmVoiceItems());
    }

    const cancelBtn = document.getElementById('btn-voice-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.stopListening();
        this.resetModal();
      });
    }

    const headerVoiceBtn = document.getElementById('btn-voice-search');
    if (headerVoiceBtn) {
      headerVoiceBtn.addEventListener('click', () => {
        if (App.Main) App.Main.showModal('modal-voice-input');
        this.startListening();
      });
    }
  }
};

