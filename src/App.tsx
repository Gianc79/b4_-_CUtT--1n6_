import React, { useState, useEffect, useRef } from 'react';
import { AppState, MasterRow, SortLevel } from './types';
import {
  blankMaster,
  inputNumber,
  n,
  newId,
  validDiameter,
} from './utils/math';
import { normalizeResultRows, runOptimization } from './utils/optimizer';
import {
  loadState,
  normalizeNewState,
  saveAsAppFile,
  saveCurrentFile,
  saveState,
} from './utils/storage';
import { exportMasterXls, exportPlanXls, parseMasterXls } from './utils/excel';
import { TabType, TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { MasterTable } from './components/MasterTable';
import { ResultsView, SelectedStockItem } from './components/ResultsView';
import { HelpView } from './components/HelpView';
import { SortDialog } from './components/SortDialog';
import { Toast } from './components/Toast';
import { ScrollToTop } from './components/ScrollToTop';

const SORT_FIELDS = [
  { value: 'diameter' as const, label: 'Diametro [mm]' },
  { value: 'qty' as const, label: 'Nr.' },
  { value: 'length' as const, label: 'Lunghezza [cm]' },
];

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => loadState());
  // 4) Schermata principale dell'app è "Giacenza"
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sortKind, setSortKind] = useState<'stockDetail' | 'demandDetail' | null>(null);

  const toastTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    saveState(state);
  }, [state]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modifica righe Giacenza e Richiesta
  const handleStockChange = (newStock: MasterRow[]) => {
    setState(prev => ({ ...prev, stockDetail: newStock }));
  };

  const handleDemandChange = (newDemand: MasterRow[]) => {
    setState(prev => ({ ...prev, demandDetail: newDemand }));
  };

  // Ordinamento multi-livello
  const sortRows = (rows: MasterRow[], levels: SortLevel[]): MasterRow[] => {
    return rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const qA = inputNumber(a.row.qty);
        const lA = inputNumber(a.row.length);
        const dA = inputNumber(a.row.diameter);
        const readyA =
          validDiameter(dA) &&
          Number.isInteger(qA) &&
          qA! >= 1 &&
          qA! <= 10000 &&
          Number.isInteger(lA) &&
          lA! >= 1 &&
          lA! <= 1200;

        const qB = inputNumber(b.row.qty);
        const lB = inputNumber(b.row.length);
        const dB = inputNumber(b.row.diameter);
        const readyB =
          validDiameter(dB) &&
          Number.isInteger(qB) &&
          qB! >= 1 &&
          qB! <= 10000 &&
          Number.isInteger(lB) &&
          lB! >= 1 &&
          lB! <= 1200;

        if (readyA !== readyB) return readyA ? -1 : 1;
        if (readyA && readyB) {
          for (const level of levels) {
            const av = n(a.row[level.field]);
            const bv = n(b.row[level.field]);
            if (av !== bv) return (av - bv) * (level.direction === 'asc' ? 1 : -1);
          }
        }
        return a.index - b.index;
      })
      .map(x => x.row);
  };

  const handleApplySort = (levels: SortLevel[]) => {
    if (!sortKind) return;
    const currentRows = state[sortKind];
    const sorted = sortRows(currentRows, levels);
    setState(prev => ({ ...prev, [sortKind]: sorted }));
    const descriptions = levels.map(
      l =>
        `${SORT_FIELDS.find(f => f.value === l.field)?.label || l.field} ${
          l.direction === 'asc' ? 'crescente' : 'decrescente'
        }`
    );
    showToast(`Tabella ordinata per ${descriptions.join(' → ')}.`);
  };

  // 12) Ottimizzazione con scarico automatico delle barre utilizzate dalla Giacenza
  const handleOptimize = () => {
    try {
      const res = runOptimization(state.stockDetail, state.demandDetail);
      const normalized = normalizeResultRows(res, null);

      if (!normalized) {
        showToast('Nessun risultato: verifica che i dati di Giacenza e Richiesta siano validi.');
        return;
      }

      // Scala automaticamente le barre utilizzate dalla tabella Giacenza
      const remainingStockDetail = state.stockDetail.map(row => ({ ...row }));

      for (const used of normalized.usedByLength) {
        let toDeduct = used.qty;
        for (const row of remainingStockDetail) {
          if (
            inputNumber(row.diameter) === used.diameter &&
            inputNumber(row.length) === used.length
          ) {
            const currentQty = inputNumber(row.qty) || 0;
            if (currentQty <= toDeduct) {
              toDeduct -= currentQty;
              row.qty = '0';
            } else {
              row.qty = String(currentQty - toDeduct);
              toDeduct = 0;
            }
          }
          if (toDeduct <= 0) break;
        }
      }

      // Rimuove le righe con quantità 0
      const cleanedStock = remainingStockDetail.filter(r => (inputNumber(r.qty) || 0) > 0);
      const finalStock = cleanedStock.length > 0 ? cleanedStock : [blankMaster()];

      setState(prev => ({
        ...prev,
        stockDetail: finalStock,
        result: normalized,
      }));

      setActiveTab('results');

      // 9) Messaggi esatti per ottimizzazione
      if (normalized.allFulfilled) {
        showToast(
          `Ottimizzazione completata: evasi tutti i ${normalized.fulfilledPieces} pezzi su ${normalized.requestedPieces} richiesti.`
        );
      } else {
        const unmetCount = normalized.requestedPieces - normalized.fulfilledPieces;
        showToast(
          `Ottimizzazione parziale: evasi ${normalized.fulfilledPieces} pezzi su ${normalized.requestedPieces}. Non evasi ${unmetCount} pezzi a causa di esaurimento della giacenza.`
        );
      }
    } catch (e: any) {
      showToast(e.message || 'Errore durante l’ottimizzazione.');
    }
  };

  // 12) Aggiorna Richiesta: i tagli non evasi sostituiscono integralmente la Richiesta attuale
  const handleUpdateDemand = () => {
    const r = state.result;
    if (!r || r.unmet.length === 0) return;

    const newDemandRows: MasterRow[] = r.unmet.map(x => ({
      id: newId(),
      diameter: String(x.diameter),
      qty: String(x.remaining),
      length: String(x.length),
    }));

    setState(prev => ({
      ...prev,
      demandDetail: newDemandRows,
      result: prev.result ? { ...prev.result, unmet: [] } : null,
    }));

    showToast(`Richiesta aggiornata con i tagli non evasi.`);
  };

  // 12) Aggiorna Giacenza: i pezzi selezionati integrano la Giacenza (sommando o aggiungendo)
  const handleUpdateStock = (selectedItems: SelectedStockItem[]) => {
    if (!state.result || selectedItems.length === 0) return;

    const newStock = [...state.stockDetail];

    for (const item of selectedItems) {
      const existing = newStock.find(
        r =>
          inputNumber(r.diameter) === item.diameter &&
          inputNumber(r.length) === item.length &&
          (inputNumber(r.qty) || 0) > 0
      );

      if (existing) {
        const curQ = inputNumber(existing.qty) || 0;
        existing.qty = String(curQ + item.qty);
      } else {
        // Cerca eventuale riga vuota
        const blankIdx = newStock.findIndex(
          r => !r.diameter.trim() && !r.qty.trim() && !r.length.trim()
        );
        if (blankIdx >= 0) {
          newStock[blankIdx] = {
            id: newStock[blankIdx].id,
            diameter: String(item.diameter),
            qty: String(item.qty),
            length: String(item.length),
          };
        } else {
          newStock.push({
            id: newId(),
            diameter: String(item.diameter),
            qty: String(item.qty),
            length: String(item.length),
          });
        }
      }
    }

    // Rimuove i pezzi selezionati dalle liste remainingStock e scraps
    const remainingSelectedIndices = new Set(
      selectedItems.filter(s => s.source === 'remaining').map(s => s.sourceIndex)
    );
    const scrapSelectedIndices = new Set(
      selectedItems.filter(s => s.source === 'scrap').map(s => s.sourceIndex)
    );

    const updatedRemaining = state.result.remainingStock.filter(
      (_, idx) => !remainingSelectedIndices.has(idx)
    );
    const updatedScraps = state.result.scraps.filter(
      (_, idx) => !scrapSelectedIndices.has(idx)
    );

    setState(prev => ({
      ...prev,
      stockDetail: newStock,
      result: prev.result
        ? {
            ...prev.result,
            remainingStock: updatedRemaining,
            scraps: updatedScraps,
          }
        : null,
    }));

    showToast(`Pezzi integrati con successo nella Giacenza.`);
  };

  // JSON Import
  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const d = JSON.parse(text);
      if (
        !d ||
        typeof d !== 'object' ||
        (!Array.isArray(d.stockDetail) && !Array.isArray(d.demandDetail) && !Array.isArray(d.quickStock))
      ) {
        throw new Error('Formato file non riconosciuto: selezionare un file dati JSON dell’applicazione.');
      }
      const newState = normalizeNewState(d);
      setState(newState);
      showToast('File caricato correttamente.');
    } catch (e: any) {
      showToast('Impossibile caricare il file: ' + e.message);
    }
  };

  // XLS Import
  const handleImportXls = async (file: File, kind: 'stockDetail' | 'demandDetail') => {
    const label = kind === 'stockDetail' ? 'Giacenza' : 'Richiesta';
    try {
      const imported = await parseMasterXls(file);
      setState(prev => ({ ...prev, [kind]: imported }));
      showToast(`${label}: importati ${imported.length} record dal file Excel.`);
    } catch (e: any) {
      showToast(`Impossibile importare il file Excel: ${e.message || 'formato non valido.'}`);
    }
  };

  return (
    <div className="app-layout-wrapper">
      <TopBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onImportJson={handleImportJson}
        onSave={() => saveCurrentFile(state, showToast)}
        onSaveAs={() => saveAsAppFile(state, showToast)}
      />

      <div className="shell app-shell-content">
        <main>
          {activeTab === 'stock' && (
            <MasterTable
              kind="stockDetail"
              title="Giacenza"
              subtitle="Gestisci la giacenza delle barre in cantiere."
              rows={state.stockDetail}
              onChangeRows={handleStockChange}
              onOpenSort={() => setSortKind('stockDetail')}
              onImportXls={f => handleImportXls(f, 'stockDetail')}
              onExportXls={() => exportMasterXls(state.stockDetail, 'giacenza', showToast)}
              onToast={showToast}
            />
          )}

          {activeTab === 'demand' && (
            <MasterTable
              kind="demandDetail"
              title="Richiesta"
              subtitle="Inserisci la distinta ferri richiesta."
              rows={state.demandDetail}
              onChangeRows={handleDemandChange}
              onOpenSort={() => setSortKind('demandDetail')}
              onImportXls={f => handleImportXls(f, 'demandDetail')}
              onExportXls={() => exportMasterXls(state.demandDetail, 'richiesta', showToast)}
              onToast={showToast}
            />
          )}

          {/* Desktop Split View: Side-by-Side Giacenza & Richiesta */}
          {activeTab === 'split' && (
            <div className="split-view-container">
              <div className="split-view-banner">
                <div className="split-banner-info">
                  <h3>Vista Affiancata: Giacenza &amp; Richiesta</h3>
                  <p>
                    Confronta e modifica scorte e distinta di taglio in un unico colpo d'occhio.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn primary split-optimize-cta"
                  onClick={handleOptimize}
                >
                  ▶ &gt; Esegui ottimizzazione
                </button>
              </div>

              <div className="split-view-grid">
                <div className="split-column">
                  <MasterTable
                    kind="stockDetail"
                    title="Giacenza"
                    subtitle="Gestisci la giacenza delle barre in cantiere."
                    rows={state.stockDetail}
                    onChangeRows={handleStockChange}
                    onOpenSort={() => setSortKind('stockDetail')}
                    onImportXls={f => handleImportXls(f, 'stockDetail')}
                    onExportXls={() => exportMasterXls(state.stockDetail, 'giacenza', showToast)}
                    onToast={showToast}
                  />
                </div>
                <div className="split-column">
                  <MasterTable
                    kind="demandDetail"
                    title="Richiesta"
                    subtitle="Inserisci la distinta ferri richiesta."
                    rows={state.demandDetail}
                    onChangeRows={handleDemandChange}
                    onOpenSort={() => setSortKind('demandDetail')}
                    onImportXls={f => handleImportXls(f, 'demandDetail')}
                    onExportXls={() => exportMasterXls(state.demandDetail, 'richiesta', showToast)}
                    onToast={showToast}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <ResultsView
              result={state.result}
              onOptimize={handleOptimize}
              onExportPlan={() => exportPlanXls(state.result, showToast)}
              onUpdateDemand={handleUpdateDemand}
              onUpdateStock={handleUpdateStock}
            />
          )}

          {activeTab === 'help' && <HelpView />}
        </main>

        {/* 3) Frase in fondo alla pagina aggiornata senza "da cantiere" */}
        <div className="footer-note">
          TAGLIO BARRE C.A. · v. 1.26 · Dati memorizzati localmente nel browser · Progettato per PC e smartphone
        </div>
      </div>

      {/* 5) Freccina flottante "torna in alto" (SpesaSuMisura style) */}
      <ScrollToTop />

      {/* 1) Barra inferiore flottante con sfondo blu e icone ingrandite senza badge */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Finestra Ordina */}
      <SortDialog
        isOpen={sortKind !== null}
        kind={sortKind || 'stockDetail'}
        onClose={() => setSortKind(null)}
        onApplySort={handleApplySort}
      />

      <Toast message={toastMessage} />
    </div>
  );
};

export default App;
