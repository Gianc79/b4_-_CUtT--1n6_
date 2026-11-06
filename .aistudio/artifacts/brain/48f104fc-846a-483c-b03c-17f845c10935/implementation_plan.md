# Implementazione TAGLIO BARRE C.A. — v. 1.30

Piano di sviluppo per il rilascio della versione **v. 1.30**, mirato a perfezionare il layout su dispositivi smartphone, sostituire le immagini esterne con icone SVG native nitide e affidabili, snellire le pagine Giacenza e Richiesta integrando i totali nella tabella, e introdurre il tracciamento univoco dell'ID delle barre madri e recuperate nel Piano Operativo di Taglio.

---

### Decisioni Confermate con l'Utente

> [!IMPORTANT]
> **Scelte confermate in Fase 1:**
> - **Inserimento dati su mobile:** Cella attiva fissa con scorrimento interno morbido senza salti.
> - **Fascia superiore su smartphone:** Layout a due righe per dare al titolo tutta la larghezza orizzontale e posizionare le 3 icone circolari allineate in basso a destra sotto al titolo, a fianco del sottotitolo.

---

## 1. Panoramica delle Modifiche

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TAGLIO BARRE C.A. — v. 1.30                          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. GENERALE       • Fascia fissa a 2 righe su smartphone (zero collisioni)│
│                   • Popup cancellazione con centraggio immediato (no jump)│
│ 2. GIACENZA &     • 3 Icone SVG native (Importa XLS, Esporta XLS, Ordina)│
│    RICHIESTA      • Rimozione widget Sviluppo/Peso ➔ Riga Totale in tabella│
│                   • Font aumentato per i filtri diametro               │
│                   • Editing celle senza scatti o scroll forzati       │
│ 3. OTTIMIZZA      • Icona Esporta XLS tutta a destra su mobile        │
│                   • Dicitura "utilizzate" nello Sfrido Totale          │
│                   • Colonna "ID" barra con tracciamento barre recuperate│
│                   • Badge ID in linea nei Diagrammi Visivi             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dettaglio Funzionale ed Esperienza Utente

### A. Generale & Fascia Superiore
1. **Fascia fissa a due righe (Mobile Viewport):**
   - **Riga 1:** Icona applicazione + Titolo `TAGLIO BARRE C.A.` con versione `v. 1.30` inline, con l'intera larghezza dello schermo a disposizione senza toccare o coprire le icone.
   - **Riga 2:** Sottotitolo `Gestione ottimizzata del Piano di Taglio.` a sinistra e le 3 icone circolari bianche (Salva, Salva con nome, Apri) allineate a destra lungo il bordo inferiore.
   - Su schermi tablet/desktop, la fascia mantiene un allineamento armonico a riga singola con le azioni a destra.
2. **Popup di eliminazione con centraggio stabile:**
   - Correzione dell'animazione CSS del toast: rimozione del transform disallineato durante il `popIn`. Il popup utilizzerà `left: 0; right: 0; margin-left: auto; margin-right: auto; width: fit-content;` garantendo che compaia direttamente al centro senza prima scattare a destra.

### B. Pagine Giacenza e Richiesta
1. **Nuove Icone SVG Vettoriali Native (Zero dipendenze esterne):**
   - **Importa da XLS:** Documento foglio di calcolo verde Excel con icona foglio grigliato, etichetta "XLS" e freccia verde in entrata / importazione.
   - **Esporta in XLS:** Documento verde Excel con icona foglio, etichetta "XLS" e freccia verde verso il basso.
   - **Ordina Tabella:** Icona moderna con barre graduate azzurre e freccia verticale, coordinata con lo stile dell'ordinamento.
   - Tutte le icone saranno integrate come componenti React SVG autonomi, garantendo visualizzazione perfetta su qualsiasi schermo e browser, inclusa la versione standalone esportata.
2. **Pulsanti Filtra Diametri:**
   - Incremento del font da 12px a 13.5px con peso 800, padding confortevole per l'interazione touch su mobile.
3. **Eliminazione Widget e Aggiunta Riga Totale in Tabella:**
   - Rimozione dei due box grandi `SVILUPPO COMPLESSIVO` e `PESO TOTALE` che occupavano spazio prezioso sullo schermo.
   - Aggiunta della riga finale `tfoot` nella tabella:
     - Colonna **Ø [mm]**: `Totale` (in grassetto scuro)
     - Colonna **Nr.**: conteggio pezzi totali (es. `168 pz`)
     - Colonna **L [cm]**: sviluppo metrico complessivo (es. `729,20 m`)
     - Colonna **P [kg]**: peso totale complessivo (es. `647,53 kg`)
     - Colonna **Azioni**: vuota.
   - In presenza di un filtro diametro attivo (es. Ø 12), la riga Totale rifletterà dinamicamente solo i record del diametro filtrato.
4. **Inserimento Valori Smart & Scorrimento:**
   - Nessun trigger di scroll verticale o riposizionamento durante la navigazione da cella a cella sulla medesima riga.
   - Nel passaggio a una riga nuova, scorrimento morbido e circoscritto unicamente se la cella si trova nell'area inferiore coperta dalla tastiera.

### C. Pagina Ottimizza
1. **Esporta in XLS allineato a destra su mobile:**
   - Separazione flessibile dell'intestazione di Ottimizza: il pulsante `▶ Esegui ottimizzazione` e l'icona `Esporta in XLS` avranno posizionamento chiaro, con l'icona esportazione ancorata all'estrema destra anche su schermi stretti.
2. **Widget Sfrido Totale:**
   - Aggiornamento del sottotitolo in: `% barre utilizzate` (invece di `consumate`).
3. **Colonna ID e Tracciamento Barre Recuperate:**
   - Nel modello operativo di taglio (`buildOperationalPlan`), ogni barra madre vergine riceverà un numero progressivo progressivo (`ID 1`, `ID 2`, `ID 3`, ...).
   - Quando una barra genera uno sfrido/recupero che viene successivamente impiegato per ulteriori tagli in una fase successiva del piano, tale record manterrà l'**identificativo della barra originaria** (es. `ID 1 [Recupero]`), collegando visivamente e logicamente il ciclo di vita della barra.
   - **Tabella Dati:** Prima colonna intitolata `ID` con l'indicatore progressivo.
   - **Diagrammi Visivi:** Badge in linea a sinistra del diametro barra nel riquadro superiore:
     `[ID #1] [Ø 12 mm] [L: 1200 cm] [1 barra]` tutto su un'unica riga orizzontale.

---

## 3. Architettura dei Componenti

```
src/
├── components/
│   ├── ExcelIcons.tsx       <-- Nuove icone SVG native: ExcelImportIcon, ExcelExportIcon, SortTableIcon
│   ├── TopBar.tsx           <-- Fascia superiore a 2 righe su smartphone, v. 1.30 inline
│   ├── MasterTable.tsx      <-- Rimossi widget; aggiunta riga Totale a fondo tabella (L in metri, P in kg)
│   ├── ResultsView.tsx      <-- Esporta XLS a destra, testo "utilizzate", colonna ID e badge ID
│   └── CutDiagramBar.tsx    <-- Badge ID in linea con diametro, lunghezza e barre
├── utils/
│   └── optimizer.ts         <-- Assegnazione ID barra originaria e propagazione su barre da recupero
└── index.css                <-- Stili a 2 righe mobile per TopBar, fix centraggio popup, stili tfoot
```

---

## 4. Piano di Verifica e Collaudo
1. **Verifica Layout Mobile (Smartphone 360px - 414px):**
   - Testare la fascia superiore: verificare che `TAGLIO BARRE C.A. v. 1.30` non collida con le 3 icone circolari.
   - Testare le pagine Giacenza e Richiesta: verificare presenza delle 3 icone SVG, ingrandimento testo diametri, presenza della riga Totale a fondo tabella.
   - Testare il popup di eliminazione riga: verificare che compaia al centro senza spostamento laterale.
2. **Verifica Piano di Taglio (Ottimizza):**
   - Eseguire l'ottimizzazione e verificare che la colonna `ID` sia presente nella Tabella Dati e che le barre tagliate da recuperi mantengano l'ID della barra madre originaria.
   - Verificare che nei Diagrammi Visivi il badge ID compaia in linea con diametro e lunghezza.
   - Verificare che il widget Sfrido Totale riporti `% barre utilizzate`.
3. **Build e Lint:**
   - Esecuzione contemporanea di `compile_applet` e `lint_applet` per confermare 0 errori.
   - Archiviazione della versione autonoma `versions/TAGLIO_BARRE_CA_v1.30.html` e `docs/versions/TAGLIO_BARRE_CA_v1.30.html`.
