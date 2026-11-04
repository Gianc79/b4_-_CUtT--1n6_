# Riprogettazione Moderna & Mobile-First: OTTIMIZZAZIONE BARRE C.A.

Piano di rinnovamento dell'interfaccia utente per trasformare l'applicazione in una piattaforma moderna, fluida e adatta sia all'uso desktop in ufficio tecnico (vista affiancata scorte/fabbisogno) sia all'utilizzo operativo in cantiere/officina su smartphone (schede touch, filtri per diametro e diagrammi visivi di taglio).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Sulla base delle risposte fornite nella fase di chiarimento, il nuovo layout adotterà le seguenti scelte architetturali:

- **Confirmed Decision 1 (Layout & Ergonomia)**: Layout ibrido intelligente:
  - *Desktop (schermi ampi)*: Modalità a vista affiancata (Split-View) o a schede per consultare contemporaneamente *Giacenza* e *Richiesta* con monitoraggio immediato dei totali (sviluppo e peso) e pulsante di ottimizzazione sempre accessibile.
  - *Mobile (smartphone in cantiere)*: Barra di navigazione inferiore ergonomica (Bottom Navigation Tab Bar) con target touch $\ge 44\text{px}$, schede a lista ad alta leggibilità e modulo di inserimento rapido.
- **Confirmed Decision 2 (Schede e Filtri per Diametro)**: Visualizzazione dei record organizzata in schede reattive (stile lista spesa su misura) con barra di filtro rapido per diametro (Tutti, Ø6, Ø8, Ø10, Ø12, Ø14, Ø16, Ø18, Ø20, Ø22, Ø25, Ø28, Ø32, Ø36, Ø40). Toggle rapido per alternare tra vista a schede moderne e vista a tabella compatta per chi preferisce la visuale da foglio di calcolo.
- **Confirmed Decision 3 (Diagrammi Visivi di Taglio)**: Nel Piano di Taglio, ciascuna configurazione di barra sarà accompagnata da una **barra segmentata interattiva**:
  - Segmenti dei tagli richiesti colorati con etichetta metrica (es. verde smeraldo/ciano);
  - Segmento di recupero per passaggi successivi (azzurro indaco);
  - Segmento di sfrido finale chiaramente evidenziato (ambra/arancio);
  - Informazioni dettagliate al tocco/hover con quote in cm e metri.
- **Confirmed Decision 4 (Zero Perdita Funzionale)**: Preservazione al 100% dell'algoritmo di calcolo deterministico a minimo sfrido, dell'import/export Excel (.xlsx), del backup/salvataggio JSON e della persistenza continua in localStorage (schema v4).

---

## 1. Overview & Core Concept

- **What It Does**: Piattaforma per ingegneri, geometri e ferraioli che ottimizza l'uso delle barre in acciaio da cemento armato (C.A.). Riduce al minimo gli scarti di lavorazione, mappa il riutilizzo dei recuperi e guida l'operatore con un piano di taglio visivo e stampabile.
- **Target Audience & Context**:
  - *Ufficio Tecnico / Preposto di Cantiere*: Lavora su computer o tablet, importa distinte da file Excel, ordina le barre per diametro o lunghezza, ed esporta il piano esecutivo.
  - *Ferraiolo / Tagliatore in Officina o Cantiere*: Lavora su smartphone, spesso all'aperto o in ambienti polverosi con una sola mano; ha bisogno di pulsanti ampi, numeri ad alto contrasto e una rappresentazione grafica immediata di dove tagliare ciascuna barra.
- **Key Value**: Riduzione tangibile degli scarti economici di acciaio, eliminazione degli errori di lettura delle combinazioni numeriche e interfaccia reattiva piacevole e moderna.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Gestione Giacenza e Richiesta**:
   - L'operatore visualizza i diametri attivi con contatore di pezzi e peso complessivo.
   - Premendo un chip di diametro (es. `Ø 12`), la lista si filtra all'istante mostrando solo i pezzi di quel diametro.
   - Aggiunta rapida tramite tastiera touch o modale a comparsa con campi grandi e stepper numerici (+ / -).
   - In qualunque momento è possibile importare o esportare il file Excel della singola tabella.
2. **Lancio dell'Ottimizzazione**:
   - Su desktop il pulsante "Esegui ottimizzazione" è sempre in evidenza; su mobile è accessibile sia dalla barra fissa che dalla scheda dedicata.
   - Transizione fluida verso la schermata Risultati con riepilogo immediato dei 4 KPI (Pezzi richiesti, evasi, sfrido totale % e peso consumato).
3. **Esecuzione del Piano di Taglio Visivo**:
   - L'operatore scorre le barre da tagliare: ogni barra mostra il diametro, la lunghezza iniziale, e la barra grafica segmentata con le quote esatte dei pezzi da ricavare e dell'eventuale sfrido.
   - Possibilità di esportare il Piano in Excel `.xlsx` o stampare/salvare il foglio operativo.
4. **Aggiornamento di Chiusura Ciclo**:
   - Se rimangono pezzi non evasi o spezzoni residui riutilizzabili, l'operatore seleziona i record desiderati e con un tocco aggiorna la Giacenza o la Richiesta per il lotto successivo.

### Visual Identity & Palette

- **Palette Cromatica 60-30-10**:
  - *60% Sfondo Neutro*: Slate chiaro rilassante (`#F8FAFC` / `#F1F5F9`) con contrasto pulito.
  - *30% Superfici e Strutture*: Bianco puro (`#FFFFFF`) con bordi sottili ad alta definizione (`#E2E8F0`) e ombre morbide (`0 4px 16px rgba(15, 23, 42, 0.05)`).
  - *10% Accenti Funzionali*:
    - Blu Acciaio / Navy Industriale (`#0F2942`) per l'identità del brand e intestazioni;
    - Verde Evasione / Smeraldo (`#059669`) per tagli riusciti, azioni primarie e barre valide;
    - Ciano / Teal (`#0284C7`) per i recuperi intermedi di lavorazione;
    - Ambra Calda (`#D97706`) per lo sfrido finale e gli avvisi di materiale rimanente.
- **Tipografia**:
  - Display & Headings: `Plus Jakarta Sans` o `Manrope` (font geometrico e moderno, pulito e senza fronzoli).
  - Testo e Controlli: `Plus Jakarta Sans` a 14–16px con altezza riga ottimale per touch.
  - Dati Numerici, Quote e Tabelle: Strettamente `tabular-nums` per garantire l'allineamento perfetto delle cifre.
- **Ergonomia Touch da Cantiere**:
  - Touch target minimi di $44\text{px} \times 44\text{px}$.
  - Pulsanti principali con feedback tattile (`active:scale-[0.98]`).
  - Spaziatura generosa per evitare tocchi accidentali con guanti o dita bagnate.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Vista Doppia Desktop (Split) + Schede Mobile (Bottom Nav)**
  - *Scelta*: Responsive design adattivo che trasforma il layout da affiancato su schermi $\ge 1024\text{px}$ a navigazione a linguette inferiore con swipe su smartphone.
  - *Perché*: Su grande schermo permette di vedere l'effetto di una modifica alla giacenza sulla richiesta; su smartphone massimizza l'area visibile lasciando la navigazione nel raggio d'azione del pollice.
- **Decision 2: Schede Interattive con Filtri Ø + Switch a Griglia Classica**
  - *Scelta*: La visualizzazione predefinita utilizza card raggruppate per diametro con pulsanti di incremento, ma un interruttore "Vista Tabella / Vista Schede" permette di ritornare alla griglia tabellare densa per chi deve inserire o incollare decine di righe in una volta.
  - *Perché*: Massima flessibilità: comodità moderna per il cantiere, efficienza seriale per l'ufficio.
- **Decision 3: Barra di Taglio Grafica SVG / CSS Progress Bar**
  - *Scelta*: Rendering vettoriale reattivo in percentuale proporzionale alla lunghezza reale della barra (fino a 12 metri), con etichette chiare e scala cromatica distinta tra pezzi tagliati, recuperi e scarti.
  - *Perché*: Elimina qualunque ambiguità su quale pezzo tagliare per primo e quanto materiale rimarrà in officina.

---

## 4. Technical Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                                TopBar                                  │
│  [Logo OTTIMIZZAZIONE BARRE C.A.] ─── [Carica JSON | Salva | Salva...]  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Workspace & Navigation                          │
│  [Desktop: Split-View Toggle / Tabs] ─ [Mobile: Bottom Touch Bar]     │
├───────────────────────────────────┬────────────────────────────────────┤
│           Giacenza View           │          Richiesta View            │
│  - Filter Pills: [Tutti][Ø12]...  │  - Filter Pills: [Tutti][Ø16]...   │
│  - View Mode: [Schede | Tabella]  │  - View Mode: [Schede | Tabella]   │
│  - Item Cards / Rows              │  - Item Cards / Rows               │
│  - Excel Import / Export          │  - Excel Import / Export           │
│  - Sviluppo & Peso Cards          │  - Sviluppo & Peso Cards           │
├───────────────────────────────────┴────────────────────────────────────┤
│                       Optimization Action Banner                       │
│        [ ▶ Calcola Piano di Taglio Ottimizzato ] (Sticky/Floating)      │
├────────────────────────────────────────────────────────────────────────┤
│                           Results View                                 │
│  - Performance KPI Badges (Pezzi, % Evasione, Sfrido, Peso)            │
│  - Visual Cutting Plan: Interactive Segmented Bars (Cut | Scrap)       │
│  - Detailed Operational Table & Excel Export (.xlsx)                   │
│  - Used Bars Breakdown                                                 │
│  - Unmet Demand Replacer                                               │
│  - Residual Stock & Scrap Replacer                                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

1. `src/components/TopBar.tsx`: Barra superiore compatta con marchio, versione, stato di salvataggio e pulsanti JSON.
2. `src/components/BottomNav.tsx`: Barra di navigazione mobile fissa per smartphone (Giacenza, Richiesta, Ottimizzazione, Guida).
3. `src/components/DiameterFilter.tsx`: Filtri rapidi con contatore di pezzi per diametro attivo.
4. `src/components/ItemCard.tsx`: Scheda mobile touch per singolo record (badge Ø, stepper quantità, lunghezza, peso e azioni rapide).
5. `src/components/CutDiagramBar.tsx`: Componente grafico per la renderizzazione proporzionale della barra di taglio con segmenti colorati e tooltip metrici.
6. `src/components/MasterTable.tsx`: Griglia tabellare densa con supporto per switch rapido Schede/Tabella.
7. `src/components/ResultsView.tsx`: Dashboard con KPI, diagrammi a barre dei tagli e pannelli di sincronizzazione.

---

## Verification & Validation Plan

1. **Test di Usabilità Mobile**:
   - Verifica di tutti i controlli touch con viewport 375px (iPhone SE) e 390px (iPhone 14/15/16).
   - Verifica che le zone di pressione siano $\ge 44\text{px}$ e che non ci siano elementi con testo troncato involontariamente.
2. **Test di Usabilità Desktop**:
   - Verifica della vista affiancata a 1440px con ridimensionamento fluido.
3. **Test di Calcolo & Precisione**:
   - Esecuzione dell'ottimizzazione con casi di test con più diametri contemporanei (es. Ø12, Ø16, Ø20).
   - Verifica che le percentuali di sfrido e i pesi coincidano esattamente al grammo con i dati validati del motore.
4. **Test di Import/Export**:
   - Verifica importazione file Excel `.xlsx` da cantiere.
   - Verifica esportazione del Piano di Taglio `.xlsx`.
   - Verifica backup/ripristino JSON.
5. **Verifica Build**:
   - `compile_applet` e `lint_applet` senza alcun warning o errore.
