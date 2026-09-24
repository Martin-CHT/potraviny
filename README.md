# 🥫 Potraviny — Správce zásob v domácnosti

Moderní Progressive Web App (PWA) pro sledování zásob potravin v domácnosti — v lednici, mrazáku, spíži, šuplíku i jinde.

![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen)
![Offline](https://img.shields.io/badge/Offline-Supported-blue)
![Czech](https://img.shields.io/badge/Jazyk-Čeština-red)

## ✨ Hlavní funkce

### 📦 Správa zásob
- Ruční přidávání a odebírání položek s množstvím a měrnými jednotkami (ks, kg, g, l, ml, balení, sáček)
- Sledování data spotřeby per-kus s rozlišením **„Spotřebujte do"** vs **„Minimální trvanlivost"**
- Třídění do kategorií (mléčné, maso, ovoce & zelenina, pečivo, nápoje, mražené, konzervy, koření, sladkosti)
- Třídění podle umístění (lednice, mrazák, spíž, šuplík, skříň, police)
- Řazení podle názvu, data spotřeby, kategorie, umístění, ceny, množství

### ⚠️ Upozornění na expiraci
- Barevné kódování: 🟢 OK (7+ dní) | 🟡 Varování (3–7 dní) | 🟠 Nebezpečí (1–3 dny) | 🔴 Prošlé
- Push notifikace přímo do notifikačního centra (nastavitelný počet dní předem)
- Badge s počtem expirujících položek

### 🤖 AI funkce
- **Automatické doplnění expirace** — Pokud nevyplníte datum, AI odhadne běžnou trvanlivost potraviny na základě bohaté české databáze
- **Hlasové zadávání (AI / NLP)** — Diktujte přirozenou češtinou: *„Přidej tři polotučná mléka do lednice a dvě pšeničné mouky do spíže“*
- **Klasifikace produktů a umístění** — Automatické zařazení do kategorie a doporučení správného umístění (lednice, mrazák, spíž, šuplík)
- **Odhad průměrných cen** — Automatický odhad cen podle názvu z českých obchodů (např. Kupi.cz) s možností ruční úpravy a uzamčení
- **Podpora Google Gemini i OpenAI** — Volitelně lze zadat API klíč v Nastavení, aplikace však plně funguje i 100% offline bez klíče

### 📸 Skenování a vybalení
- **Čárový kód (EAN)** — Naskenujte fotoaparátem mobilu nebo zadejte ručně
- **Open Food Facts** — Okamžitě stáhne český název, reálnou fotku produktu a výživové hodnoty (energie, tuky, sacharidy, bílkoviny...)
- **Skenování účtenky** — OCR rozpoznání textu účtenky s automatickým vytažením položek, množství a cen
- **Vybalit nákup** — Hromadné skenování zakoupeného nákupu do přechodného seznamu s automatickým roztříděním do lednice, mrazáku a spíže

### 🍳 Recepty a Recepty.cz
- **Recepty z mých zásob** — Návrhy receptů z aktuálních zásob se zvláštním důrazem na potraviny s blížící se expirací
- **Vyhledávání na Recepty.cz** — Přímé propojení a vyhledávání na [recepty.cz](https://www.recepty.cz)

### 📊 Měřič plýtvání
- Sledování vyhozených potravin a ztracené finanční hodnoty v Kč
- Statistiky za týden, měsíc nebo celkově
- Volitelné — lze jednoduše zapnout/vypnout v nastavení

### 🔔 Push notifikace a sledování expirace
- Rozlišení mezi **„Spotřebujte do"** (zdravotní bezpečnost) a **„Minimální trvanlivost"** (jakost)
- Grafické barevné upozornění (🟢 v pořádku, 🟡 varování, 🟠 kritické, 🔴 prošlé)
- Aktivní push notifikace přímo do notifikačního centra mobilu nebo PC

### 🔄 Synchronizace
- Synchronizace přes Google Sheets API / Google Apps Script
- Kompletní export a import zálohy ve formátu JSON

## 🚀 Spuštění

### Lokálně (nejjednodušší)

1. Naklonujte repozitář:
```bash
git clone https://github.com/Martin-CHT/Potraviny.git
cd Potraviny
```

2. Spusťte lokální server (je potřeba kvůli bezpečnostním omezením prohlížeče):

**Python:**
```bash
python -m http.server 8000
```

**Node.js:**
```bash
npx serve .
```

**VS Code:**
Nainstalujte rozšíření [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) a klikněte na "Go Live".

3. Otevřete prohlížeč na `http://localhost:8000`

### GitHub Pages

1. Forkněte repozitář na GitHub
2. Přejděte do **Settings → Pages**
3. Vyberte `main` branch a `/root` jako source
4. Stránka bude dostupná na `https://username.github.io/Potraviny/`

### PWA instalace

Po otevření v prohlížeči (Chrome, Edge, Safari):
- Na desktopu: klikněte na ikonu instalace v adresním řádku
- Na mobilu: "Přidat na plochu" / "Add to Home Screen"

## ⚙️ Nastavení

### OpenAI API (volitelné)
Pro pokročilé AI funkce (hlasové zadávání, klasifikace účtenek, recepty ze zásob):
1. Přejděte do **Nastavení → AI Nastavení**
2. Zadejte váš [OpenAI API Key](https://platform.openai.com/api-keys)

Bez API klíče aplikace používá vestavěnou databázi heuristik.

### Google Sheets synchronizace
1. Vytvořte nový Google Sheet
2. Získejte Sheet ID z URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Vytvořte API Key v [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
4. Povolte Google Sheets API
5. Zadejte údaje v **Nastavení → Synchronizace**

### Push notifikace
1. Povolte v **Nastavení → Notifikace**
2. Prohlížeč se zeptá na povolení
3. Nastavte počet dní před expirací pro upozornění

## 🛠️ Technologie

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Storage:** IndexedDB
- **PWA:** Service Worker, Web App Manifest
- **Skenování:** [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- **OCR:** [Tesseract.js](https://github.com/naptha/tesseract.js)
- **Produktová data:** [Open Food Facts API](https://world.openfoodfacts.org/)
- **Hlasové ovládání:** Web Speech API
- **AI:** OpenAI API (volitelné)

## 📁 Struktura projektu

```
Potraviny/
├── index.html          # Hlavní HTML stránka
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── README.md          # Dokumentace
├── css/
│   └── style.css      # Styly aplikace
├── js/
│   ├── app.js         # Hlavní kontroler
│   ├── db.js          # IndexedDB vrstva
│   ├── items.js       # Správa položek
│   ├── ai.js          # AI a heuristiky
│   ├── scanner.js     # Čtečka čárových kódů + OCR
│   ├── voice.js       # Hlasové zadávání
│   ├── recipes.js     # Generátor receptů
│   ├── sync.js        # Google Sheets sync
│   ├── notifications.js # Push notifikace
│   ├── waste.js       # Měřič plýtvání
│   ├── prices.js      # Správa cen
│   └── unpack.js      # Vybalení nákupu
└── icons/
    └── icon-*.svg     # PWA ikony
```

## 📱 Podporované prohlížeče

- ✅ Chrome / Edge (desktop & mobil)
- ✅ Safari (iOS 14.5+)
- ✅ Firefox
- ⚠️ Některé funkce (Push notifikace, hlasové zadávání) nemusí být dostupné ve všech prohlížečích

## 📄 Licence

MIT License — volně používejte a upravujte.

---

Vytvořeno s ❤️ pro české domácnosti.
