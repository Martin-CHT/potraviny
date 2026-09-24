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

  // Databáze průměrných nutričních hodnot (na 100g) pro české potraviny
  nutritionDB: [
    // Mléčné
    { keywords: ['plnotučné mléko', 'mléko 3.5%'], energy: 64, fat: 3.5, carbs: 4.7, protein: 3.2, fiber: 0, salt: 0.1 },
    { keywords: ['polotučné mléko', 'mléko 1.5%', 'mléko'], energy: 47, fat: 1.5, carbs: 4.8, protein: 3.3, fiber: 0, salt: 0.1 },
    { keywords: ['odtučněné mléko', 'mléko 0.5%'], energy: 35, fat: 0.5, carbs: 4.9, protein: 3.4, fiber: 0, salt: 0.1 },
    { keywords: ['máslo', 'čerstvé máslo'], energy: 742, fat: 82, carbs: 0.7, protein: 0.7, fiber: 0, salt: 0.02 },
    { keywords: ['eidam 30%', 'eidam'], energy: 260, fat: 16, carbs: 1.5, protein: 29, fiber: 0, salt: 1.8 },
    { keywords: ['eidam 45%', 'gouda', 'čedar', 'cheddar'], energy: 350, fat: 28, carbs: 1.5, protein: 25, fiber: 0, salt: 1.8 },
    { keywords: ['parmezán', 'grana padano'], energy: 392, fat: 28, carbs: 3.2, protein: 32, fiber: 0, salt: 1.6 },
    { keywords: ['mozzarella'], energy: 280, fat: 20, carbs: 2.2, protein: 22, fiber: 0, salt: 0.7 },
    { keywords: ['hermelín', 'camembert'], energy: 290, fat: 23, carbs: 0.5, protein: 20, fiber: 0, salt: 1.7 },
    { keywords: ['niva', 'balkánský'], energy: 340, fat: 29, carbs: 1.0, protein: 20, fiber: 0, salt: 3.5 },
    { keywords: ['tvaroh měkký', 'tvaroh'], energy: 95, fat: 2.5, carbs: 3.5, protein: 14, fiber: 0, salt: 0.1 },
    { keywords: ['tvaroh odtučněný', 'skyr', 'skyre'], energy: 65, fat: 0.2, carbs: 4.0, protein: 12, fiber: 0, salt: 0.1 },
    { keywords: ['jogurt bílý', 'bílý jogurt', 'jogurt'], energy: 62, fat: 3.5, carbs: 4.5, protein: 3.8, fiber: 0, salt: 0.1 },
    { keywords: ['jogurt ovocný', 'ovocný jogurt'], energy: 95, fat: 2.8, carbs: 14.0, protein: 3.2, fiber: 0.2, salt: 0.1 },
    { keywords: ['smetana ke šlehání', 'šlehačka', 'smetana 33%'], energy: 310, fat: 33, carbs: 3.2, protein: 2.3, fiber: 0, salt: 0.08 },
    { keywords: ['zakysaná smetana', 'smetana'], energy: 165, fat: 16, carbs: 3.5, protein: 2.8, fiber: 0, salt: 0.1 },
    { keywords: ['kefír', 'podmáslí', 'acidofilní mléko'], energy: 45, fat: 1.5, carbs: 4.2, protein: 3.2, fiber: 0, salt: 0.1 },
    { keywords: ['cottage'], energy: 98, fat: 4.2, carbs: 2.6, protein: 12.5, fiber: 0, salt: 0.8 },
    { keywords: ['vejce', 'vajíčka'], energy: 143, fat: 9.5, carbs: 0.7, protein: 12.6, fiber: 0, salt: 0.3 },

    // Maso a uzeniny
    { keywords: ['kuřecí prsa', 'kuřecí řízky', 'krůtí prsa'], energy: 106, fat: 1.2, carbs: 0, protein: 23.5, fiber: 0, salt: 0.1 },
    { keywords: ['kuřecí stehna', 'kuře'], energy: 170, fat: 10, carbs: 0, protein: 19.5, fiber: 0, salt: 0.2 },
    { keywords: ['vepřová panenka', 'vepřová pečeně'], energy: 145, fat: 5.5, carbs: 0, protein: 22, fiber: 0, salt: 0.1 },
    { keywords: ['vepřová krkovice', 'bůček', 'vepřové'], energy: 270, fat: 22, carbs: 0, protein: 17, fiber: 0, salt: 0.2 },
    { keywords: ['hovězí zadní', 'hovězí svíčková', 'hovězí'], energy: 180, fat: 9, carbs: 0, protein: 23, fiber: 0, salt: 0.15 },
    { keywords: ['mleté maso'], energy: 230, fat: 17, carbs: 0, protein: 19, fiber: 0, salt: 0.3 },
    { keywords: ['šunka dušená', 'kuřecí šunka', 'šunka'], energy: 110, fat: 3, carbs: 1.5, protein: 18, fiber: 0, salt: 2.2 },
    { keywords: ['vysočina', 'poličan', 'salám', 'paprikáš', 'turista'], energy: 460, fat: 42, carbs: 1.0, protein: 20, fiber: 0, salt: 3.2 },
    { keywords: ['párky', 'vídeňské párky', 'párek', 'debrecínka'], energy: 280, fat: 25, carbs: 2.0, protein: 12, fiber: 0, salt: 2.4 },
    { keywords: ['klobása', 'špekáček', 'špekáčky'], energy: 320, fat: 28, carbs: 2.5, protein: 13, fiber: 0, salt: 2.6 },
    { keywords: ['anglická slanina', 'slanina', 'špek'], energy: 480, fat: 46, carbs: 0.5, protein: 15, fiber: 0, salt: 2.8 },
    { keywords: ['losos'], energy: 208, fat: 13, carbs: 0, protein: 20, fiber: 0, salt: 0.1 },
    { keywords: ['treska', 'kapr', 'pstruh', 'ryba'], energy: 105, fat: 2.5, carbs: 0, protein: 19, fiber: 0, salt: 0.2 },
    { keywords: ['tuňák'], energy: 130, fat: 1.0, carbs: 0, protein: 28, fiber: 0, salt: 0.8 },

    // Ovoce
    { keywords: ['jablko', 'jablka'], energy: 52, fat: 0.2, carbs: 13.8, protein: 0.3, fiber: 2.4, salt: 0.01 },
    { keywords: ['banán', 'banány'], energy: 89, fat: 0.3, carbs: 22.8, protein: 1.1, fiber: 2.6, salt: 0.01 },
    { keywords: ['pomeranč', 'mandarinka', 'citron'], energy: 47, fat: 0.1, carbs: 11.8, protein: 0.9, fiber: 2.4, salt: 0.01 },
    { keywords: ['jahody', 'maliny', 'borůvky'], energy: 38, fat: 0.3, carbs: 7.7, protein: 0.7, fiber: 2.0, salt: 0.01 },
    { keywords: ['hroznové víno', 'hrozny'], energy: 69, fat: 0.2, carbs: 18.1, protein: 0.7, fiber: 0.9, salt: 0.01 },
    { keywords: ['meloun'], energy: 30, fat: 0.2, carbs: 7.6, protein: 0.6, fiber: 0.4, salt: 0.01 },
    { keywords: ['avokádo'], energy: 160, fat: 15, carbs: 8.5, protein: 2.0, fiber: 6.7, salt: 0.01 },

    // Zelenina
    { keywords: ['rajče', 'rajčata'], energy: 18, fat: 0.2, carbs: 3.9, protein: 0.9, fiber: 1.2, salt: 0.01 },
    { keywords: ['okurka', 'hadovka'], energy: 15, fat: 0.1, carbs: 3.6, protein: 0.7, fiber: 0.5, salt: 0.01 },
    { keywords: ['paprika'], energy: 28, fat: 0.3, carbs: 6.0, protein: 1.0, fiber: 2.1, salt: 0.01 },
    { keywords: ['mrkev'], energy: 41, fat: 0.2, carbs: 9.6, protein: 0.9, fiber: 2.8, salt: 0.07 },
    { keywords: ['brambory', 'brambor'], energy: 77, fat: 0.1, carbs: 17.5, protein: 2.0, fiber: 2.1, salt: 0.01 },
    { keywords: ['cibule', 'česnek'], energy: 40, fat: 0.1, carbs: 9.3, protein: 1.1, fiber: 1.7, salt: 0.01 },
    { keywords: ['salát', 'ledový salát', 'špenát', 'rukola'], energy: 17, fat: 0.3, carbs: 2.2, protein: 1.5, fiber: 1.6, salt: 0.03 },
    { keywords: ['brokolice', 'květák'], energy: 34, fat: 0.4, carbs: 6.6, protein: 2.8, fiber: 2.6, salt: 0.04 },
    { keywords: ['žampiony', 'houby'], energy: 22, fat: 0.3, carbs: 3.3, protein: 3.1, fiber: 1.0, salt: 0.01 },

    // Pečivo
    { keywords: ['chléb', 'chleba', 'šumava', 'kvasový chléb'], energy: 240, fat: 1.3, carbs: 49.0, protein: 7.5, fiber: 4.8, salt: 1.3 },
    { keywords: ['rohlík', 'houska', 'bageta', 'kaiserka'], energy: 285, fat: 2.1, carbs: 56.0, protein: 8.5, fiber: 2.8, salt: 1.4 },
    { keywords: ['toastový chléb', 'toustový chléb'], energy: 265, fat: 3.2, carbs: 48.5, protein: 8.0, fiber: 3.0, salt: 1.2 },
    { keywords: ['croissant', 'koláč', 'buchta', 'kobliha', 'vánočka'], energy: 380, fat: 16.0, carbs: 51.0, protein: 7.0, fiber: 2.0, salt: 0.8 },

    // Trvanlivé a přílohy
    { keywords: ['rýže', 'basmati', 'jasmínová rýže'], energy: 350, fat: 0.8, carbs: 78.0, protein: 7.0, fiber: 1.5, salt: 0.01 },
    { keywords: ['těstoviny', 'špagety', 'kolínka', 'penne'], energy: 355, fat: 1.5, carbs: 72.0, protein: 12.0, fiber: 3.0, salt: 0.02 },
    { keywords: ['mouka', 'hladká mouka', 'polohrubá mouka'], energy: 345, fat: 1.2, carbs: 70.0, protein: 10.5, fiber: 3.2, salt: 0.01 },
    { keywords: ['ovesné vločky', 'vločky'], energy: 370, fat: 7.0, carbs: 59.0, protein: 13.5, fiber: 10.0, salt: 0.01 },
    { keywords: ['cukr', 'krystal'], energy: 400, fat: 0, carbs: 100.0, protein: 0, fiber: 0, salt: 0 },
    { keywords: ['olej', 'slunečnicový olej', 'řepkový olej', 'olivový olej'], energy: 884, fat: 100.0, carbs: 0, protein: 0, fiber: 0, salt: 0 },
    { keywords: ['fazole', 'čočka', 'cizrna', 'hrách'], energy: 115, fat: 0.6, carbs: 19.5, protein: 8.5, fiber: 6.5, salt: 0.02 },
    { keywords: ['tuňák v konzervě', 'sardinky'], energy: 160, fat: 8.0, carbs: 0, protein: 22.0, fiber: 0, salt: 1.2 },
    { keywords: ['rajčatový protlak', 'drcená rajčata', 'passata'], energy: 32, fat: 0.3, carbs: 5.5, protein: 1.5, fiber: 1.2, salt: 0.3 },

    // Sladkosti
    { keywords: ['čokoláda mléčná', 'čokoláda'], energy: 535, fat: 30.0, carbs: 58.0, protein: 7.5, fiber: 2.5, salt: 0.2 },
    { keywords: ['čokoláda hořká'], energy: 550, fat: 38.0, carbs: 42.0, protein: 7.0, fiber: 8.0, salt: 0.05 },
    { keywords: ['sušenky', 'tatranky', 'horalky', 'fidorka'], energy: 490, fat: 24.0, carbs: 62.0, protein: 6.5, fiber: 2.5, salt: 0.4 },
    { keywords: ['med', 'džem', 'marmeláda'], energy: 280, fat: 0.1, carbs: 68.0, protein: 0.4, fiber: 1.0, salt: 0.02 },
    { keywords: ['chipsy', 'brambůrky'], energy: 530, fat: 33.0, carbs: 51.0, protein: 6.0, fiber: 4.0, salt: 1.5 },

    // Nápoje
    { keywords: ['džus', 'pomerančový džus', 'jablečný mošt'], energy: 45, fat: 0.1, carbs: 10.5, protein: 0.5, fiber: 0.2, salt: 0.01 },
    { keywords: ['limonáda', 'kofola', 'cola'], energy: 42, fat: 0, carbs: 10.5, protein: 0, fiber: 0, salt: 0.01 },
    { keywords: ['pivo', 'ležák'], energy: 43, fat: 0, carbs: 3.6, protein: 0.5, fiber: 0, salt: 0.01 },
    { keywords: ['víno'], energy: 82, fat: 0, carbs: 2.6, protein: 0.1, fiber: 0, salt: 0.01 }
  ],

  // Průměrné hodnoty pro celé kategorie (fallback)
  categoryNutritionDefaults: {
    'mlecne': { energy: 130, fat: 7.5, carbs: 5.0, protein: 8.5, fiber: 0, salt: 0.4 },
    'maso': { energy: 210, fat: 14.0, carbs: 0.5, protein: 20.0, fiber: 0, salt: 0.8 },
    'ovoce_zelenina': { energy: 45, fat: 0.3, carbs: 9.5, protein: 1.2, fiber: 2.2, salt: 0.02 },
    'pecivo': { energy: 275, fat: 3.5, carbs: 51.0, protein: 8.0, fiber: 3.5, salt: 1.2 },
    'napoje': { energy: 35, fat: 0, carbs: 8.0, protein: 0.2, fiber: 0, salt: 0.01 },
    'mrazene': { energy: 180, fat: 8.0, carbs: 15.0, protein: 10.0, fiber: 2.0, salt: 0.6 },
    'konzervy': { energy: 120, fat: 4.5, carbs: 12.0, protein: 8.0, fiber: 3.0, salt: 0.9 },
    'koreni': { energy: 150, fat: 4.0, carbs: 20.0, protein: 5.0, fiber: 8.0, salt: 5.0 },
    'sladkosti': { energy: 480, fat: 22.0, carbs: 64.0, protein: 5.0, fiber: 2.0, salt: 0.3 },
    'ostatni': { energy: 250, fat: 8.0, carbs: 35.0, protein: 7.0, fiber: 2.5, salt: 0.5 }
  },

  // Automatická predikce nutričních hodnot podle názvu a kategorie
  predictNutrition(name, category = null) {
    const n = (name || '').toLowerCase().trim();
    
    // 1. Zkusit najít v detailní nutritionDB
    for (let entry of this.nutritionDB) {
      if (entry.keywords.some(k => n.includes(k))) {
        return {
          energy: entry.energy,
          fat: entry.fat,
          carbs: entry.carbs,
          protein: entry.protein,
          fiber: entry.fiber,
          salt: entry.salt
        };
      }
    }

    // 2. Fallback podle kategorie
    const cat = category || this.classifyItem(name);
    const def = this.categoryNutritionDefaults[cat] || this.categoryNutritionDefaults['ostatni'];
    return { ...def };
  },

  // Slovník pro překlad a normalizaci zahraničních názvů z Open Food Facts a skenování do češtiny
  foreignTranslations: [
    // Polština
    { regex: /\bmleko\s+uht\b/gi, cz: 'Mléko trvanlivé' },
    { regex: /\bmleko\s+(?:świeże|swieze)\b/gi, cz: 'Mléko čerstvé' },
    { regex: /\bmleko\b/gi, cz: 'Mléko' },
    { regex: /\bmasło\s+(?:ekstra|polskie|ońskie)?\b/gi, cz: 'Máslo' },
    { regex: /\bmaslo\b/gi, cz: 'Máslo' },
    { regex: /\bser\s+żółty\b/gi, cz: 'Sýr plátkový' },
    { regex: /\bser\s+twarogowy\b/gi, cz: 'Tvaroh' },
    { regex: /\bser\b/gi, cz: 'Sýr' },
    { regex: /\btwaróg\b/gi, cz: 'Tvaroh' },
    { regex: /\bśmietana\b/gi, cz: 'Smetana' },
    { regex: /\bjajka\b/gi, cz: 'Vejce' },
    { regex: /\bchleb\b/gi, cz: 'Chléb' },
    { regex: /\bbułki\b/gi, cz: 'Housky' },
    { regex: /\bszynka\b/gi, cz: 'Šunka' },
    { regex: /\bkiełbasa\b/gi, cz: 'Klobása' },
    { regex: /\bparówki\b/gi, cz: 'Párky' },
    { regex: /\bkurczak\b/gi, cz: 'Kuřecí maso' },
    { regex: /\bwieprzowina\b/gi, cz: 'Vepřové maso' },
    { regex: /\bwołowina\b/gi, cz: 'Hovězí maso' },
    { regex: /\bjabłka\b/gi, cz: 'Jablka' },
    { regex: /\bbanany\b/gi, cz: 'Banány' },
    { regex: /\bpomidory\b/gi, cz: 'Rajčata' },
    { regex: /\bogórki\b/gi, cz: 'Okurky' },
    { regex: /\bziemniaki\b/gi, cz: 'Brambory' },
    { regex: /\bcebula\b/gi, cz: 'Cibule' },
    { regex: /\bryż\b/gi, cz: 'Rýže' },
    { regex: /\bmakaron\b/gi, cz: 'Těstoviny' },
    { regex: /\bmąka\b/gi, cz: 'Mouka' },
    { regex: /\bcukier\b/gi, cz: 'Cukr' },
    { regex: /\bsól\b/gi, cz: 'Sůl' },
    { regex: /\bczekolada\b/gi, cz: 'Čokoláda' },
    { regex: /\bciastka\b/gi, cz: 'Sušenky' },
    { regex: /\blody\b/gi, cz: 'Zmrzlina' },
    { regex: /\bpiwo\b/gi, cz: 'Pivo' },
    { regex: /\bwoda\s+mineralna\b/gi, cz: 'Minerální voda' },
    { regex: /\bwoda\b/gi, cz: 'Voda' },

    // Němčina
    { regex: /\bmilch\b/gi, cz: 'Mléko' },
    { regex: /\bhaltbare\s+milch\b/gi, cz: 'Trvanlivé mléko' },
    { regex: /\bfrische\s+milch\b/gi, cz: 'Čerstvé mléko' },
    { regex: /\bbutter\b/gi, cz: 'Máslo' },
    { regex: /\bkäse\b/gi, cz: 'Sýr' },
    { regex: /\bquark\b/gi, cz: 'Tvaroh' },
    { regex: /\bsahne\b/gi, cz: 'Smetana' },
    { regex: /\beier\b/gi, cz: 'Vejce' },
    { regex: /\bbrot\b/gi, cz: 'Chléb' },
    { regex: /\bbrötchen\b/gi, cz: 'Housky' },
    { regex: /\bschinken\b/gi, cz: 'Šunka' },
    { regex: /\bwurst\b/gi, cz: 'Uzenina' },
    { regex: /\bhähnchen\b/gi, cz: 'Kuřecí maso' },
    { regex: /\brindfleisch\b/gi, cz: 'Hovězí maso' },
    { regex: /\bschweinefleisch\b/gi, cz: 'Vepřové maso' },
    { regex: /\bäpfel\b/gi, cz: 'Jablka' },
    { regex: /\btomaten\b/gi, cz: 'Rajčata' },
    { regex: /\bgurken\b/gi, cz: 'Okurky' },
    { regex: /\bkartoffeln\b/gi, cz: 'Brambory' },
    { regex: /\bzwiebeln\b/gi, cz: 'Cibule' },
    { regex: /\breis\b/gi, cz: 'Rýže' },
    { regex: /\bnudeln\b/gi, cz: 'Těstoviny' },
    { regex: /\bmehl\b/gi, cz: 'Mouka' },
    { regex: /\bzucker\b/gi, cz: 'Cukr' },
    { regex: /\bsalz\b/gi, cz: 'Sůl' },
    { regex: /\böl\b/gi, cz: 'Olej' },
    { regex: /\bschokolade\b/gi, cz: 'Čokoláda' },
    { regex: /\bkekse\b/gi, cz: 'Sušenky' },
    { regex: /\beis\b/gi, cz: 'Zmrzlina' },
    { regex: /\bbier\b/gi, cz: 'Pivo' },
    { regex: /\bwein\b/gi, cz: 'Víno' },
    { regex: /\bwasser\b/gi, cz: 'Voda' },

    // Angličtina
    { regex: /\buht\s+milk\b/gi, cz: 'Trvanlivé mléko' },
    { regex: /\bfresh\s+milk\b/gi, cz: 'Čerstvé mléko' },
    { regex: /\bmilk\b/gi, cz: 'Mléko' },
    { regex: /\bbutter\b/gi, cz: 'Máslo' },
    { regex: /\bcheese\b/gi, cz: 'Sýr' },
    { regex: /\bcottage\s+cheese\b/gi, cz: 'Cottage sýr' },
    { regex: /\byogurt|yoghurt\b/gi, cz: 'Jogurt' },
    { regex: /\bcream\b/gi, cz: 'Smetana' },
    { regex: /\beggs?\b/gi, cz: 'Vejce' },
    { regex: /\bbread\b/gi, cz: 'Chléb' },
    { regex: /\brolls?\b/gi, cz: 'Pečivo' },
    { regex: /\bham\b/gi, cz: 'Šunka' },
    { regex: /\bsausage\b/gi, cz: 'Klobása' },
    { regex: /\bchicken\s+breast\b/gi, cz: 'Kuřecí prsa' },
    { regex: /\bchicken\b/gi, cz: 'Kuřecí maso' },
    { regex: /\bpork\b/gi, cz: 'Vepřové maso' },
    { regex: /\bbeef\b/gi, cz: 'Hovězí maso' },
    { regex: /\bapples?\b/gi, cz: 'Jablka' },
    { regex: /\bbananas?\b/gi, cz: 'Banány' },
    { regex: /\boranges?\b/gi, cz: 'Pomeranče' },
    { regex: /\btomatoes?\b/gi, cz: 'Rajčata' },
    { regex: /\bcucumbers?\b/gi, cz: 'Okurky' },
    { regex: /\bpotatoes?\b/gi, cz: 'Brambory' },
    { regex: /\bonions?\b/gi, cz: 'Cibule' },
    { regex: /\brice\b/gi, cz: 'Rýže' },
    { regex: /\bpasta\b/gi, cz: 'Těstoviny' },
    { regex: /\bflour\b/gi, cz: 'Mouka' },
    { regex: /\bsugar\b/gi, cz: 'Cukr' },
    { regex: /\bsalt\b/gi, cz: 'Sůl' },
    { regex: /\boil\b/gi, cz: 'Olej' },
    { regex: /\bchocolate\b/gi, cz: 'Čokoláda' },
    { regex: /\bbiscuits|cookies\b/gi, cz: 'Sušenky' },
    { regex: /\bice\s*cream\b/gi, cz: 'Zmrzlina' },
    { regex: /\bbeer\b/gi, cz: 'Pivo' },
    { regex: /\bwine\b/gi, cz: 'Víno' },
    { regex: /\bwater\b/gi, cz: 'Voda' }
  ],

  // Čištění a překlad zahraničního / skenovaného názvu do čisté češtiny
  normalizeToCzech(rawName, category = null, brand = '') {
    if (!rawName) return 'Neznámá potravina';
    let name = rawName.trim();

    // 1. Odstranit zbytečné balicí suffixy a šumy
    name = name
      .replace(/\s*\(?(?:opack|opakowanie|karton|tetra\s*pack|pet\s*butelka|flasche|can|tin)\)?/gi, '')
      .replace(/\s*e\s*(\d+)/gi, '') // E-kódy z názvu pokud jsou samostatně
      .replace(/\b\d+\s*x\s*\d+\s*(?:g|ml|l|kg)\b/gi, '') // multipacky 4x100g
      .replace(/\s*-\s*CZ\b/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 2. Překlad cizích slov do češtiny
    for (let t of this.foreignTranslations) {
      if (t.regex.test(name)) {
        name = name.replace(t.regex, t.cz);
        break; // Aplikovat primární překlad
      }
    }

    // 3. Ošetřit značku - pokud je značka známa a ještě není v názvu
    if (brand && brand.trim() && !name.toLowerCase().includes(brand.toLowerCase())) {
      name = `${name} (${brand.trim()})`;
    }

    // 4. Správná kapitalizace prvního písmene
    name = name.charAt(0).toUpperCase() + name.slice(1);
    return name;
  },

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
            const rawName = it.name || 'Položka';
            const cleanName = this.normalizeToCzech(rawName, it.category);
            const exp = this.predictExpiration(cleanName, it.category);
            if (it.expirationType) exp.type = it.expirationType;
            return {
              name: cleanName,
              quantity: Number(it.quantity) || 1,
              unit: it.unit || 'ks',
              category: it.category || this.classifyItem(cleanName),
              location: it.location || this.suggestLocation(cleanName, it.category),
              expirations: [exp],
              nutrition: this.predictNutrition(cleanName, it.category)
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

      // Vyčistit a normalizovat název
      let itemName = textSeg
        .replace(/^(z\s+|ze\s+)/i, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!itemName) continue;

      const cleanName = this.normalizeToCzech(itemName);
      const category = this.classifyItem(cleanName);
      if (!location) {
        location = this.suggestLocation(cleanName, category);
      }

      const predictedExp = this.predictExpiration(cleanName, category);
      const predictedNutrition = this.predictNutrition(cleanName, category);

      results.push({
        name: cleanName,
        quantity: quantity,
        unit: unit,
        category: category,
        location: location,
        expirations: [predictedExp],
        nutrition: predictedNutrition
      });
    }

    return results;
  },

  // Zpracování textu z účtenky
  async parseReceiptText(ocrText) {
    if (!ocrText || !ocrText.trim()) return [];

    // 1. Zkusit online AI pokud je nastaven API klíč
    const prompt = `Zanalyzuj tento text z české nákupní účtenky. Extrahuj z něj POUZE zakoupené položky (potraviny/zboží) jako JSON pole objektů.
Ignoruj hlavičky obchodu, součty, DPH, zálohy, karty, body, slevové součty.
Pokud je u položky řádek s množstvím a násobkem (např. '2 * 9,90  19,80' nebo '0,450 kg * 49,90'), spoj to se správnou položkou!

Objekty v JSON poli mají klíče:
- name: string (vyčištěný čitelný název produktu v češtině, např. "Kobliha meruňková 65g", "Oreo Brownie 154g", "DrWitt RELAX 0,75l", "Korunní 1,5l")
- quantity: number (počet kusů nebo hmotnost, např. 2 nebo 0.45)
- unit: string ('ks' | 'kg' | 'g' | 'l' | 'ml' | 'baleni')
- price: number (celková cena v Kč, např. 19.80)
- category: string ('mlecne' | 'maso' | 'ovoce_zelenina' | 'pecivo' | 'napoje' | 'mrazene' | 'konzervy' | 'koreni' | 'sladkosti' | 'ostatni')
- location: string ('lednice' | 'mrazak' | 'spiz' | 'suplik' | 'skrin' | 'police' | 'ostatni')

Vrať POUZE validní JSON pole. Účtenka k analýze:
${ocrText}`;

    const aiRes = await this.queryAI(prompt);
    if (aiRes) {
      try {
        const cleanJson = aiRes.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(it => {
            const rawName = it.name || 'Položka';
            const cleanName = this.normalizeToCzech(rawName, it.category);
            const exp = this.predictExpiration(cleanName, it.category);
            return {
              name: cleanName,
              quantity: Number(it.quantity) || 1,
              unit: it.unit || 'ks',
              price: it.price ? Number(it.price) : null,
              category: it.category || this.classifyItem(cleanName),
              location: it.location || this.suggestLocation(cleanName, it.category),
              expirations: [exp],
              nutrition: this.predictNutrition(cleanName, it.category)
            };
          });
        }
      } catch (e) {
        console.warn('Failed to parse AI receipt JSON, falling back to heuristic parser:', e);
      }
    }

    // 2. Pokročilý Offline pravidlový parser pro české účtenky (Kaufland, Lidl, Albert, Tesco, Billa...)
    return this.parseReceiptTextOffline(ocrText);
  },

  // Offline pravidlový analyzátor účtenek
  parseReceiptTextOffline(ocrText) {
    const rawLines = ocrText.split('\n');
    const items = [];

    // Klíčová slova hlavičky k ignorování
    const headerKeywords = [
      'kaufland', 'lidl', 'billa', 'albert', 'tesco', 'penny', 'coop', 'globus', 'rohlik', 'kosik',
      'česká republika', 'v.o.s', 's.r.o', 'a.s', 'ič', 'dič', 'prodejna', 'bělohorská', 'kocandě',
      'cena czk', 'cena eur', 'doklad', 'provozovna', 'pokladna', 'spojení', 'datum', 'čas', '******', '======'
    ];

    // Klíčová slova ukončující výpis položek (součty, platby, DPH)
    const stopKeywords = [
      'součet', 'soucet', 'celkem', 'platba', 'karta', 'hotovost', 'vráceno', 'vraceno',
      'daň %', 'dan %', 'brutto', 'netto', 'rekapitulace', 'kaufland card', 'lidl plus',
      'clubcard', 'děkujeme', 'dekujeme', 'debit mastercard', 'visa', 'doklad zákazníka'
    ];

    // Slovníček pro rozšíření zkratek z pokladních systémů
    const expandAbbr = (str) => {
      return str
        .replace(/\bnesol\.(?:\s*|$)/gi, 'nesolené ')
        .replace(/\bmeruň\.(?:\s*|$)/gi, 'meruňková ')
        .replace(/\bochuc(?:\b|1)/gi, 'ochucená ')
        .replace(/\bpolot\.(?:\s*|$)/gi, 'polotučné ')
        .replace(/\bplnot\.(?:\s*|$)/gi, 'plnotučné ')
        .replace(/\bčerstv\.(?:\s*|$)/gi, 'čerstvé ')
        .replace(/\btrvanl\.(?:\s*|$)/gi, 'trvanlivé ')
        .replace(/1,51PET/gi, '1.5l PET')
        .replace(/1,5lPET/gi, '1.5l PET')
        .replace(/0,751\b/gi, '0.75l')
        .replace(/\s+/g, ' ')
        .trim();
    };

    let pendingItem = null;
    let stopParsing = false;

    for (let i = 0; i < rawLines.length; i++) {
      if (stopParsing) break;

      let line = rawLines[i].trim();
      if (!line || line.length < 2) continue;

      const lower = line.toLowerCase();

      // Kontrola konce seznamu položek
      if (stopKeywords.some(k => lower.includes(k))) {
        if (pendingItem) {
          items.push(pendingItem);
          pendingItem = null;
        }
        stopParsing = true;
        break;
      }

      // Kontrola hlavičky
      if (headerKeywords.some(k => lower.includes(k))) {
        continue;
      }

      // 1. Zkontrolovat řádek s násobkem množství (např. "2 * 9,90  19,80 F" nebo "0,450 kg * 49,90  22,45 B")
      const multMatch = line.match(/^\s*(\d+(?:[.,]\d+)?)\s*(ks|kg|g|l|ml)?\s*[*xX]\s*(\d+[.,]\d{2})\s+(\d+[.,]\d{2})\s*(?:Kč|czk|[A-Za-z])?$/i);
      if (multMatch) {
        const qty = parseFloat(multMatch[1].replace(',', '.'));
        const unit = multMatch[2] ? multMatch[2].toLowerCase() : 'ks';
        const totalPrice = parseFloat(multMatch[4].replace(',', '.'));

        if (pendingItem) {
          pendingItem.quantity = qty;
          pendingItem.unit = unit;
          pendingItem.price = totalPrice;
          items.push(pendingItem);
          pendingItem = null;
        }
        continue;
      }

      // 2. Zkontrolovat řádek položky s cenou na konci (např. "Oreo Brownie 154g  47,90 F" nebo "DrWitt RELAX 0,75l 17,90 C")
      const itemWithPriceMatch = line.match(/^(.*?)\s+(\d+[.,]\d{2})\s*(?:Kč|czk|[A-Za-z])?$/i);
      if (itemWithPriceMatch) {
        if (pendingItem) {
          items.push(pendingItem);
          pendingItem = null;
        }

        let namePart = itemWithPriceMatch[1].trim();
        const priceVal = parseFloat(itemWithPriceMatch[2].replace(',', '.'));

        // Ignorovat řádky se slevami jako novou položku (např. "Sleva akce -10,00")
        if (/^(sleva|akce|bonus|kupon|odpočet|odpocet)\b/i.test(namePart)) {
          continue;
        }

        // Odstranit počáteční čísla položek / kódů
        namePart = namePart.replace(/^\d+[\s\-_.]+/, '').trim();
        if (namePart.length < 2) continue;

        namePart = expandAbbr(namePart);
        const cleanName = this.normalizeToCzech(namePart);
        const category = this.classifyItem(cleanName);
        const location = this.suggestLocation(cleanName, category);
        const exp = this.predictExpiration(cleanName, category);
        const nutrition = this.predictNutrition(cleanName, category);

        // Zjistit jednotku z názvu (např. 1,5l, 500g)
        let unit = 'ks';
        let qty = 1;

        items.push({
          name: cleanName,
          quantity: qty,
          unit: unit,
          price: priceVal,
          category: category,
          location: location,
          expirations: [exp],
          nutrition: nutrition
        });
        continue;
      }

      // 3. Řádek bez ceny (může to být název vícedenní položky jako "Kobliha meruň.65g" s násobkem na dalším řádku)
      if (pendingItem) {
        items.push(pendingItem);
        pendingItem = null;
      }

      let standaloneName = line.replace(/^\d+[\s\-_.]+/, '').trim();
      if (standaloneName.length >= 3) {
        standaloneName = expandAbbr(standaloneName);
        const cleanName = this.normalizeToCzech(standaloneName);
        const category = this.classifyItem(cleanName);
        const location = this.suggestLocation(cleanName, category);
        const exp = this.predictExpiration(cleanName, category);
        const nutrition = this.predictNutrition(cleanName, category);

        pendingItem = {
          name: cleanName,
          quantity: 1,
          unit: 'ks',
          price: null,
          category: category,
          location: location,
          expirations: [exp],
          nutrition: nutrition
        };
      }
    }

    if (pendingItem) {
      items.push(pendingItem);
    }

    return items;
  },

  // Mapy synonym pro sémantické vyhledávání
  synonymMap: {
    'ryba': ['treska', 'losos', 'kapr', 'pstruh', 'tuňák', 'tuna', 'makrela', 'tilapie', 'pangasius', 'filé', 'rybí', 'sardinky', 'sleď', 'šprot'],
    'ryby': ['treska', 'losos', 'kapr', 'pstruh', 'tuňák', 'tuna', 'makrela', 'tilapie', 'pangasius', 'filé', 'rybí', 'sardinky', 'sleď', 'šprot'],
    'maso': ['kuřecí', 'vepřové', 'hovězí', 'krůtí', 'kachní', 'mleté', 'šunka', 'salám', 'klobása', 'párek', 'slanina', 'bůček', 'panenka', 'krkovice', 'kotleta', 'steak'],
    'pečivo': ['chléb', 'chleba', 'rohlík', 'houska', 'bageta', 'croissant', 'kaiserka', 'toast', 'toust', 'vánočka', 'kobliha', 'koláč', 'buchta'],
    'tuk': ['máslo', 'hera', 'stela', 'rama', 'perla', 'zlatá haná', 'olej', 'sádlo', 'ceres', 'flora'],
    'sýr': ['eidam', 'gouda', 'čedar', 'cheddar', 'mozzarella', 'parmezán', 'hermelín', 'camembert', 'niva', 'balkánský', 'lučina', 'žervé', 'tavený'],
    'mléko': ['mléko', 'kefír', 'podmáslí', 'smetana', 'šlehačka', 'jogurt', 'tvaroh'],
    'zelenina': ['rajče', 'okurka', 'paprika', 'mrkev', 'cibule', 'česnek', 'brambor', 'brambory', 'salát', 'špenát', 'brokolice', 'květák', 'cuketa', 'lilek', 'celer', 'petržel'],
    'ovoce': ['jablko', 'banán', 'pomeranč', 'citron', 'mandarinka', 'jahody', 'maliny', 'borůvky', 'hrozny', 'kiwi', 'mango', 'meloun']
  },

  // Mapy náhradních surovin / alternativ (substitutes)
  substituteMap: {
    'hera': ['stela', 'rama', 'máslo', 'zlatá haná', 'perla', 'tuk na pečení'],
    'stela': ['hera', 'rama', 'máslo', 'zlatá haná', 'perla'],
    'rama': ['flora', 'perla', 'máslo', 'stela', 'hera'],
    'máslo': ['pomazánkové máslo', 'ghí', 'přepuštěné máslo', 'hera', 'stela', 'rama'],
    'smetana': ['zakysaná smetana', 'crème fraîche', 'řecký jogurt', 'šlehačka', 'mléko'],
    'parmezán': ['gran moravia', 'grana padano', 'parmigiano', 'eidam 45%'],
    'česnek': ['česneková pasta', 'sušený česnek'],
    'cibule': ['šalotka', 'jarní cibulka', 'pórek'],
    'cukr': ['med', 'třtinový cukr', 'sirup', 'stévie'],
    'mouka': ['hladká mouka', 'polohrubá mouka', 'hrubá mouka', 'špaldová mouka'],
    'droždí': ['kvasnice', 'prášek do pečiva', 'kypřicí prášek'],
    'strouhanka': ['pečivo', 'rohlík', 'kukuřičná strouhanka']
  },

  stripDiacritics(str) {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  },

  levenshteinDistance(a, b) {
    const s1 = this.stripDiacritics(a);
    const s2 = this.stripDiacritics(b);
    if (s1 === s2) return 0;
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    const matrix = [];
    for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[s2.length][s1.length];
  },

  // Inteligentní vyhledávání s podporou více výrazů, překlepů, synonym a náhrad
  smartSearch(items, rawQuery) {
    if (!rawQuery || !rawQuery.trim() || !items || items.length === 0) {
      return { items: items || [], explanations: [] };
    }

    const cleanQuery = rawQuery.trim().toLowerCase();
    const queryTerms = cleanQuery.split(/[\s,;+]+/).filter(t => t.length > 0);
    const matchedMap = new Map(); // itemId -> item
    const explanations = [];

    queryTerms.forEach(term => {
      const termNorm = this.stripDiacritics(term);
      let termMatchedCount = 0;

      items.forEach(item => {
        const nameNorm = this.stripDiacritics(item.name || '');
        const notesNorm = this.stripDiacritics(item.notes || '');
        const barcodeNorm = this.stripDiacritics(item.barcode || '');
        const categoryNorm = this.stripDiacritics(item.category || '');
        const itemWords = nameNorm.split(/[\s\-_.,/]+/).filter(w => w.length > 0);

        // 1. Přímá shoda (přesný podřetězec nebo čárový kód)
        if (nameNorm.includes(termNorm) || notesNorm.includes(termNorm) || barcodeNorm.includes(termNorm) || categoryNorm.includes(termNorm)) {
          matchedMap.set(item.id, item);
          termMatchedCount++;
          return;
        }

        // 2. Tolerance překlepů (Fuzzy Levenshtein) pro slova delší než 3 znaky
        if (termNorm.length >= 4) {
          for (let word of itemWords) {
            if (word.length >= 3) {
              const maxDist = termNorm.length >= 7 ? 2 : 1;
              const dist = this.levenshteinDistance(termNorm, word);
              if (dist <= maxDist) {
                matchedMap.set(item.id, item);
                termMatchedCount++;
                explanations.push({
                  term: term,
                  match: item.name,
                  type: 'fuzzy',
                  note: `(opraven překlep "${term}" → "${item.name}")`
                });
                return;
              }
            }
          }
        }

        // 3. Sémantická synonyma (např. "ryba" -> Treska, Losos...)
        const synonyms = this.synonymMap[term] || this.synonymMap[termNorm];
        if (synonyms) {
          for (let syn of synonyms) {
            const synNorm = this.stripDiacritics(syn);
            if (nameNorm.includes(synNorm)) {
              matchedMap.set(item.id, item);
              termMatchedCount++;
              explanations.push({
                term: term,
                match: item.name,
                type: 'synonym',
                note: `(rozpoznáno jako "${term}")`
              });
              return;
            }
          }
        }
      });

      // 4. Pokud pro hledaný výraz nic nebylo nalezeno, vyzkoušet náhradní suroviny (substitutes)
      // Např. hledám "hera", ale v zásobách je jen "Stela" nebo "Máslo"
      if (termMatchedCount === 0) {
        const substitutes = this.substituteMap[term] || this.substituteMap[termNorm];
        if (substitutes) {
          items.forEach(item => {
            const nameNorm = this.stripDiacritics(item.name || '');
            for (let sub of substitutes) {
              const subNorm = this.stripDiacritics(sub);
              if (nameNorm.includes(subNorm)) {
                matchedMap.set(item.id, item);
                termMatchedCount++;
                explanations.push({
                  term: term,
                  match: item.name,
                  type: 'substitute',
                  note: `(nenalezeno "${term}" — nalezena alternativa: ${item.name})`
                });
                return;
              }
            }
          });
        }
      }
    });

    // Unikátní vysvětlivky
    const uniqueExplanations = [];
    const seenExplanations = new Set();
    explanations.forEach(exp => {
      const key = `${exp.term}_${exp.match}`;
      if (!seenExplanations.has(key)) {
        seenExplanations.add(key);
        uniqueExplanations.push(exp);
      }
    });

    return {
      items: Array.from(matchedMap.values()),
      explanations: uniqueExplanations
    };
  }
};

