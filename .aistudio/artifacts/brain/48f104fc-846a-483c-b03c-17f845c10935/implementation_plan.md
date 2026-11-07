# Piano di Implementazione — TAGLIO BARRE C.A. v1.36.0

Ottimizzazione dell'esperienza utente nelle schermate Giacenza, Richiesta e Ottimizza, stabilizzazione dello scorrimento da tastiera, estensione dell'esportazione Excel con colonna ID e formattazione uniforme a capo, e perfezionamento del rendering grafico e dell'intestazione nei diagrammi visivi esportati.

> [!IMPORTANT]
> **Regola Fondamentale di Modifica**: Non verrà creato alcun file o cartella di backup in `versions/` o `docs/versions/`. Le modifiche verranno applicate direttamente e chirurgicamente sui soli file sorgente attivi all'interno di `src/` (e radice di configurazione se necessario), modificando unicamente le funzioni e i blocchi interessati.

---

## Decisioni di Revisione Utente

> [!IMPORTANT]
> Le seguenti scelte sono state confermate tramite la consultazione interattiva:
> - **Formattazione Colonne Excel**: Tutte le colonne avranno una larghezza uniforme calibrata e le intestazioni saranno formattate con testo a capo su due righe (`wrapText: true`), consentendo una lettura pulita e compatta dei campi (es. "Taglio Ø 12" su riga 1 e "8,90 m" su riga 2).
> - **Intestazione Immagine Diagrammi**: La fascia riassuntiva superiore dell'immagine PNG mostrerà unicamente l'elenco sequenziale di tutte le barre utilizzate nel formato compatto `Barre utilizzate: n. [nr.] Ø [diametro] da [lunghezza] m | [record successivo]`.
> - **File di Destinazione**: Modifiche dirette ai soli file in `src/`, nessun file o duplicato in `versions/`.

---

## 1. Panoramica & Funzionalità

La versione 1.36.0 introduce una serie di perfezionamenti mirati:
1. **Chiarezza dei Testi**: Aggiornamento delle frasi descrittive sotto i titoli in tutte le viste (Giacenza, Richiesta, Ottimizza) per esplicitare chiaramente le azioni di importazione ed esportazione.
2. **Navigazione Tastiera Fluida**: Risoluzione del doppio scatto/oscillazione (scroll giù e risalita) durante la navigazione con tasto `Invio` nelle celle delle tabelle, adottando uno scorrimento condizionale con `block: 'nearest'` ed evitando chiamate ridondanti su elementi già centrati nell'area di lavoro.
3. **Pulizia Visiva Ottimizza**: Rimozione dell'icona ridondante a fianco del pulsante "Esegui ottimizzazione" e riposizionamento del pulsante "Esporta/Stampa" all'estrema destra dell'intestazione della sezione "Piano Operativo di Taglio".
4. **Modale Esporta Piano di Taglio**: Rimozione del tasto "Annulla" in calce alla finestra, affidandosi alla "×" in alto a destra o al tocco all'esterno/tasto ESC.
5. **Esportazione Excel Avanzata**: Inclusione del campo numerico `ID` come prima colonna della tabella del Piano di Taglio, adozione di larghezze di colonna uniformi ed allineamento con testo a capo su due righe per le intestazioni.
6. **Guida Stampa PDF su Smartphone**: Chiarimento sulle modalità native di salvataggio PDF su Android (selettore in alto "Salva come PDF") e iOS (gesture pinch-to-zoom sull'anteprima di stampa) per consentire la creazione del PDF anche senza stampanti hardware connesse.
7. **Diagrammi Visivi (Canvas PNG)**: Integrazione delle etichette riassuntive complete sopra la barra (`Taglio`, `Recupero` e `Sfrido`), allineandole a quanto mostrato a schermo, e sostituzione del testo in testata con la stringa concatenata dei record del riepilogo barre utilizzate.

---

## 2. Esperienza Utente & Design Visivo

- **Pagine Giacenza e Richiesta**:
  - Sottotitolo chiaro su 2 righe:
    - *Giacenza*: `"Gestisci la giacenza delle barre.\nPossibilità di importare una giacenza da un file Excel o di esportare quella attuale."`
    - *Richiesta*: `"Gestisci la richiesta/Distinta barre.\nPossibilità di importare una richiesta da un file Excel o di esportare quella attuale."`
  - Scorrimento fluido: premendo Invio, il focus si sposta orizzontalmente (`Ø` → `Quantità` → `Lunghezza`), e a fine riga passa alla prima cella della riga successiva. La finestra non effettua più rimbalzi verticali bruschi, mantenendo ferma la riga attiva a meno che non esca dal campo visivo sopra la tastiera virtuale.
- **Pagina Ottimizza**:
  - Sottotitolo: `"Piano Operativo di Taglio generato dall'ottimizzazione della giacenza. Possibilità di esportarlo in un file Excel."`
  - Nessuna icona duplicata accanto a `▶ Esegui ottimizzazione`.
  - Intestazione del Piano Operativo di Taglio riorganizzata: Titolo a sinistra, selettore visualizzazione al centro (`Tabella Dati` / `Diagrammi Visivi`), e pulsante `📥 Esporta / Stampa` collocato all'estrema destra.
- **Finestra Modale Esporta Piano di Taglio**:
  - Presenta solo le 3 card di scelta (Excel, PDF/Stampa, Immagine PNG) con la chiusura rapida tramite "×" o tocco all'esterno.
- **Esportazione Immagine PNG dei Diagrammi**:
  - Testata superiore con barra elegante in contrasto contenente `Barre utilizzate: n. [nr.] Ø [diametro] da [lunghezza] m | n. ...`.
  - Ogni barra grafica include sopra di sé tutte le quote pertinenti: `ID [n]`, `Ø [d] mm`, `Barra [l] m`, `Taglio: [k]× [l] m`, e quando presenti `Recupero: [r] m` (in azzurro) e `Sfrido: [s] m` (in arancione).

---

## 3. Decisioni Tecniche & File Coinvolti Direttamente

Le modifiche saranno applicate chirurgicamente ai soli file attivi in `src/`:

1. **`src/App.tsx`**:
   - Aggiornamento delle proprietà `subtitle` passate a `MasterTable` per `stockDetail` e `demandDetail` (sia in vista standard che in Split View).
2. **`src/components/MasterTable.tsx`**:
   - Rielaborazione della funzione di scroll (`scrollElementIntoWorkArea`) e degli eventi di focus/keydown: eliminazione del `block: 'center'` indiscriminato a favore di un controllo dei bounds dell'elemento e di `block: 'nearest'`, prevenendo salti e oscillazioni.
3. **`src/components/ResultsView.tsx`**:
   - Aggiornamento della frase esplicativa di Ottimizza.
   - Rimozione del pulsante/icona `exportPlanBtn` posizionato accanto a `optimizeBtn`.
   - Riposizionamento del pulsante `Esporta / Stampa` all'estrema destra dell'header della sezione `Piano Operativo di Taglio` (dopo i pulsanti di cambio vista `Tabella Dati` / `Diagrammi Visivi`).
4. **`src/components/ExportPlanModal.tsx`**:
   - Rimozione del footer contenente il pulsante "Annulla".
5. **`src/utils/excel.ts`**:
   - Aggiunta della colonna `ID` all'inizio dell'esportazione del Piano di Taglio.
   - Intestazioni multilinea su 2 righe con `\n` per tutti i campi.
   - Impostazione di larghezza omogenea/uniforme per tutte le colonne in `worksheet['!cols']` e configurazione dello stile `wrapText: true` per preservare il testo a capo in Excel.
6. **`src/utils/exportDiagramsImage.ts`**:
   - Composizione del testo dell'header con la concatenazione di tutti i record di `result.usedByLength`.
   - Calcolo e disegno sul canvas dei badge `Recupero: ... m` e `Sfrido: ... m` in aggiunta a `Taglio: ... m`.

---

## 4. Architettura dei Componenti & Flusso Dati

```
┌────────────────────────────────────────────────────────────────────────┐
│                              src/App.tsx                               │
│  - Gestione stato centrale (stockDetail, demandDetail, optimization)   │
│  - Sottotitoli aggiornati per Giacenza, Richiesta e Split View         │
└──────────────────┬───────────────────────────────┬─────────────────────┘
                   │                               │
        ┌──────────┴──────────┐         ┌──────────┴──────────┐
        │   MasterTable.tsx   │         │   ResultsView.tsx   │
        │ - Giacenza/Richiesta│         │ - Esegui Ottimizza  │
        │ - Focus stabile     │         │   (senza icona)     │
        │   senza oscillazioni│         │ - Tasto Esporta/    │
        │ - preventScroll +   │         │   Stampa a destra   │
        │   nearest block     │         └──────────┬──────────┘
        └─────────────────────┘                    │
                                                   │ Apre
                                        ┌──────────┴──────────┐
                                        │ ExportPlanModal.tsx │
                                        │ - 3 opzioni rapide  │
                                        │ - Senza tasto       │
                                        │   "Annulla" in fondo│
                                        └──────────┬──────────┘
                                                   │
                   ┌───────────────────────────────┼───────────────────────────────┐
                   ▼                               ▼                               ▼
       ┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
       │   src/utils/excel    │        │  window.print (A4)   │        │ exportDiagramsImage  │
       │ - Colonna ID numerico│        │ - Layout stampabile  │        │ - Testata con elenco │
       │ - Intestazioni a     │        │ - Istruzioni mobili  │        │   barre utilizzate   │
       │   larghezza uniforme │        │   "Salva come PDF"   │        │ - Quote complete con │
       │   e testo a capo     │        │                      │        │   Recuperi & Sfridi  │
       └──────────────────────┘        └──────────────────────┘        └──────────────────────┘
```
