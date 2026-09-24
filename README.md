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

### 🔄 Synchronizace a Přihlašovací fráze

- **Přihlášení pomocí fráze (Passphrase)** — Spojte všechny telefony, tablety a počítače v domácnosti jednou jednoduchou frází (např. `rodina-novakovi`). Při změně zařízení stačí zadat frázi a celá spižírna, nastavení i API klíče se okamžitě načtou.
- **Google Sheets jako bezplatný cloudový backend** — Plná podpora Google Apps Script Web App: bez nutnosti placených serverů nebo databází.
- **Kompletní export a import** — Možnost kdykoli stáhnout kompletní JSON zálohu nebo data obnovit.

---

## ☁️ Podrobný návod: Propojení s Google Sheets přes Google Apps Script

Díky tomuto řešení získáte **plnohodnotný cloudový backend zcela zdarma**. Nemusíte vytvářet žádné placené databáze ani složité Google Cloud API projekty.

### Krok 1: Vytvoření Google Tabulky

1. Otevřete [Google Disk (Google Drive)](https://drive.google.com/) nebo [Google Sheets](https://sheets.new).
2. Založte novou tabulku a pojmenujte ji např. **„Potraviny — Zásoby"**.

### Krok 2: Vložení kódu do Apps Script

1. V horním menu tabulky klikněte na **Rozšíření → Apps Script** (*Extensions → Apps Script*).
2. Smažte veškerý výchozí kód v editoru (`myFunction`) a vložte kompletní skript ze souboru [Apps Script.txt](potraviny/Apps Script.txt at main · Martin-CHT/potraviny · GitHub).
3. Klikněte na ikonu **Uložit** (💾).

### Krok 3: Nasazení Webové aplikace (Web App)

1. V pravém horním rohu klikněte na modré tlačítko **Nasadit → Nové nasazení** (*Deploy → New deployment*).
2. Jako typ vyberte **Webová aplikace** (*ozubené kolečko → Web app*).
3. Vyplňte nastavení:
   - **Popis:** `Potraviny Sync API`
   - **Spustit jako:** `Já (váš e-mail)` (*Execute as: Me*)
   - **Kdo má přístup:** `Kdokoli` (*Who has access: Anyone*) — **DŮLEŽITÉ!**
4. Klikněte na **Nasadit** (*Deploy*).
5. Udělte aplikaci potřebná oprávnění pro přístup k vaší tabulce.
6. Zkopírujte vygenerovanou **URL adresu webové aplikace** (má tvar `https://script.google.com/macros/s/.../exec`).

### Krok 4: Propojení v aplikaci Potraviny

1. Otevřete aplikaci **Potraviny** v mobilu nebo na počítači.
2. Přejděte do sekce **⚙️ Nastavení → 🔑 Domácnost & Přihlašovací fráze**.
3. Zadejte libovolnou přihlašovací frázi Vaší rodiny (např. `rodina-novakovi` nebo `nase-chata`).
4. Do pole pro URL vložte zkopírovanou adresu z Google Apps Scriptu.
5. Klikněte na **📤 Uložit data do cloudu** (pokud již máte zásoby) nebo **📥 Přihlásit se & Stáhnout data** (na druhém zařízení).

Nyní můžete aplikaci otevřít na libovolném dalším mobilu, tabletu nebo notebooku, zadat stejnou frázi a URL a máte vše okamžitě synchronizované!

---

## ⚙️ Další nastavení

### AI API Klíč (Google Gemini nebo OpenAI — volitelné)

Pro ještě přesnější zpracování účtenek a hlasových pokynů:

1. Přejděte do **Nastavení → AI Nastavení**
2. Zadejte Váš klíč k [Google AI Studio (Gemini)](https://aistudio.google.com/) nebo [OpenAI](https://platform.openai.com/).
3. Aplikace automaticky rozpozná formát klíče (Gemini začíná na `AIza...`, OpenAI na `sk-...`).

> **Poznámka:** Aplikace plně funguje i zcela **offline bez jakéhokoli API klíče**, protože disponuje vestavěným českým NLP parserem, databází nutričních hodnot i trvanlivosti.

### Push notifikace

1. Povolte v **Nastavení → Notifikace**.
2. Prohlížeč se zeptá na systémové oprávnění pro zasílání oznámení.
3. Nastavte počet dní před expirací, kdy má začít varování.

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
├── apps script.txt      # Skript pro Google Sheets
├── index.html           # Hlavní HTML stránka
├── manifest.json        # PWA manifest
├── sw.js                # Service Worker
├── README.md            # Dokumentace
├── css/
│   └── style.css        # Styly aplikace
├── js/
│   ├── app.js           # Hlavní kontroler
│   ├── db.js            # IndexedDB vrstva
│   ├── items.js         # Správa položek
│   ├── ai.js            # AI a heuristiky
│   ├── scanner.js       # Čtečka čárových kódů + OCR
│   ├── voice.js         # Hlasové zadávání
│   ├── recipes.js       # Generátor receptů
│   ├── sync.js          # Google Sheets sync
│   ├── notifications.js # Push notifikace
│   ├── waste.js         # Měřič plýtvání
│   ├── prices.js        # Správa cen
│   └── unpack.js        # Vybalení nákupu
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
