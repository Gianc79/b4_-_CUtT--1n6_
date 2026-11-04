# OTTIMIZZAZIONE BARRE C.A. — v. 1.25

Applicazione React + Vite + TypeScript per la gestione della giacenza, la distinta di richiesta e l'ottimizzazione del taglio di barre per cemento armato (C.A.).

## Caratteristiche

- **Giacenza e Richiesta**:
  - Inserimento rapido e modifica di barre (Diametro Ø [mm], Numero pezzi, Lunghezza [cm]).
  - Calcolo automatico immediato del peso [kg], sviluppo complessivo [m] e peso totale [kg].
  - Ordinamento multi-livello configurabile fino a 3 livelli (Diametro, Numero, Lunghezza in ordine crescente o decrescente).
  - Importazione ed esportazione Excel (.xlsx) per le tabelle Giacenza e Richiesta.
- **Motore di Ottimizzazione del Taglio (Cutting Stock)**:
  - Algoritmo a programmazione dinamica (Knapsack/Reachability) per massimizzare l'evasione dei tagli e minimizzare lo sfrido.
  - Generazione del Piano di taglio operativo con passaggi sequenziali ordinati per misura di taglio.
  - Gestione del recupero e degli sfridi riutilizzabili.
  - Esportazione del Piano di taglio operativo in formato Excel (.xlsx).
  - Riepilogo barre consumate, gestione dei tagli non evasi con sostituzione della Richiesta, e gestione delle barre residue con aggiornamento della Giacenza.
- **Salvataggio e Portabilità**:
  - Salvataggio locale automatico continuo (localStorage) retrocompatibile con le versioni precedenti.
  - Backup e ripristino completo in formato JSON con supporto a File System Access API ("Salva" e "Salva con nome").
- **Design Fedele**:
  - Interfaccia reattiva e curata, conforme al layout e palette dell'applicazione originale.

## Esecuzione e Sviluppo

```bash
npm run dev
```

Dev server su porta 3000 (`http://localhost:3000`).
Per la build di produzione:

```bash
npm run build
```
