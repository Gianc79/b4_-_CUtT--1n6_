# OTTIMIZZAZIONE BARRE C.A. — v. 1.25

Applicazione React + Vite + TypeScript per la gestione della giacenza, la distinta di richiesta e l'ottimizzazione del taglio di barre per cemento armato (C.A.).

## Caratteristiche

- **Interfaccia Moderna e Mobile-First**:
  - Schede reattive touch con stepper per quantità (`−` e `＋`), ideale per l'uso in cantiere con smartphone.
  - Filtri rapidi per diametro (da Ø6 a Ø40 mm) con contatori in tempo reale.
  - Selettore modalità di visualizzazione tra **Schede** e **Tabella** classica.
  - Barra di inserimento rapido intuitiva.
  - Vista affiancata desktop (Desktop Split-View) per monitorare contemporaneamente Giacenza e Richiesta.
  - Navigazione fissa inferiore (Bottom Navigation) per smartphone.
- **Piano di Taglio Operativo con Diagrammi Visivi**:
  - Barre segmentate proporzionali con codifica a colori (tagli utili in verde smeraldo, recuperi intermedi in azzurro, sfridi in ambra tratteggiata).
  - Esportazione del Piano di Taglio in formato Excel (.xlsx).
  - Sincronizzazione automatica della Richiesta non evasa e della Giacenza residua.
- **Motore di Calcolo & Dati**:
  - Algoritmo deterministico a programmazione dinamica a minimo sfrido.
  - Importazione ed esportazione autonoma file Excel (.xlsx) per Giacenza e Richiesta.
  - Salvataggio e backup completi in JSON con supporto a File System Access API e localStorage (schema v4).

## Distribuzione su GitHub Pages

L'applicazione supporta automaticamente la pubblicazione su GitHub Pages:

### Opzione A: Tramite GitHub Actions (Consigliata)
Nel repository è incluso il workflow `.github/workflows/deploy.yml`:
1. Su GitHub, apri il repository e vai in **Settings** > **Pages**.
2. Sotto **Build and deployment > Source**, seleziona **GitHub Actions**.
3. A ogni sincronizzazione o push, l'app verrà compilata e pubblicata automaticamente all'indirizzo del tuo repository.

### Opzione B: Deploy da Branch (Root o Docs)
Se preferisci mantenere l'impostazione "Deploy from a branch":
- Sia la cartella `dist/` sia la cartella `docs/` contengono l'applicazione compilata pronta con percorsi relativi.
- Il file `index.html` principale include un reindirizzamento automatico trasparente a `./dist/` per evitare la schermata bianca quando servito come file statico.

## Sviluppo Locale

```bash
npm install
npm run dev
```

Dev server su porta 3000 (`http://localhost:3000`).

Per compilare per la produzione:
```bash
npm run build
```
