import React, { useState, useEffect, useRef } from 'react';
import { AppState, MasterRow, SortLevel } from './types';
import {
  blankMaster,
  inputNumber,
  intFmt,
  isBlankMaster,
  n,
  newId,
  validDiameter,
  validMasterRows,
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
import { ResultsView } from './components/ResultsView';
import { HelpView } from './components/HelpView';
import { SortDialog } from './components/SortDialog';
import { Toast } from './components/Toast';

const SORT_FIELDS = [
  { value: 'diameter' as const, label: 'Diametro [mm]' },
  { value: 'qty' as const, label: 'Nr.' },
  { value: 'length' as const, label: 'Lunghezza [cm]' },
];

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => loadState());
  const [activeTab, setActiveTab] = useState<TabType>('results');
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
    }, 3500);
  };

  useEffect(() => {
    saveState(state);
  }, [state]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Master tables change
  const handleStockChange = (newStock: MasterRow[]) => {
    setState(prev => ({ ...prev, stockDetail: newStock }));
  };

  const handleDemandChange = (newDemand: MasterRow[]) => {
    setState(prev => ({ ...prev, demandDetail: newDemand }));
  };

  // Sorting
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

  // Optimization
  const handleOptimize = () => {
    try {
      const res = runOptimization(state.stockDetail, state.demandDetail);
      const normalized = normalizeResultRows(res, null);
      setState(prev => ({ ...prev, result: normalized }));
      setActiveTab('results');
      showToast(
        normalized?.allFulfilled
          ? 'Ottimizzazione completata: richiesta evasa.'
          : 'Ottimizzazione incompleta: alcune richieste non sono state evase.'
      );
    } catch (e: any) {
      alert(e.message || 'Errore durante l’ottimizzazione.');
    }
  };

  // Update unmet demand
  const handleUpdateDemand = () => {
    const r = state.result;
    if (!r) return;
    const chosen = r.unmet.filter(x => x.selected && !x.added);
    if (!chosen.length) {
      alert('Seleziona almeno una riga della Richiesta non evasa.');
      return;
    }

    const piecesAdded = chosen.reduce((sum, x) => sum + x.remaining, 0);
    if (
      !confirm(
        `La tabella Richiesta verrà SOSTITUITA integralmente con i ${intFmt(
          chosen.length
        )} record selezionati della Richiesta non evasa. Continuare?`
      )
    ) {
      return;
    }

    const newDemandRows = chosen.map(x => ({
      id: newId(),
      diameter: String(x.diameter),
      qty: String(x.remaining),
      length: String(x.length),
    }));

    const updatedUnmet = r.unmet.map(x =>
      x.selected && !x.added ? { ...x, added: true, selected: false } : x
    );

    setState(prev => ({
      ...prev,
      demandDetail: newDemandRows,
      result: prev.result ? { ...prev.result, unmet: updatedUnmet } : null,
    }));

    showToast(`Richiesta sostituita con i tagli non evasi selezionati (${intFmt(piecesAdded)} pezzi).`);
  };

  // Update residual stock
  const handleUpdateStock = () => {
    const r = state.result;
    if (!r) return;
    if (r.stockUpdated) {
      alert(
        'La Giacenza è già stata aggiornata per questa ottimizzazione. Per eseguire una nuova selezione, avvia una nuova ottimizzazione.'
      );
      return;
    }

    const chosenRemaining = r.remainingStock.filter(x => x.selected && !x.applied);
    const chosenScraps = r.scraps.filter(x => x.selected && !x.added);

    if (!chosenRemaining.length && !chosenScraps.length) {
      alert('Seleziona almeno un record della Giacenza residua o degli sfridi recuperabili.');
      return;
    }

    const selectedOptions = [
      ...chosenRemaining.map(x => ({
        source: 'remaining' as const,
        item: x,
        diameter: Number(x.diameter),
        length: Number(x.length),
        qty: Number(x.qty),
      })),
      ...chosenScraps.map(x => ({
        source: 'scrap' as const,
        item: x,
        diameter: Number(x.diameter),
        length: Number(x.length),
        qty: Number(x.qty),
      })),
    ].filter(
      x =>
        validDiameter(x.diameter) &&
        Number.isInteger(x.length) &&
        x.length > 0 &&
        Number.isInteger(x.qty) &&
        x.qty > 0
    );

    const allOptions = [...r.remainingStock, ...r.scraps];
    const affectedDiameters = new Set(allOptions.map(x => Number(x.diameter)).filter(validDiameter));

    if (!selectedOptions.length || !affectedDiameters.size) {
      alert('I record selezionati non contengono dati validi da aggiungere alla Giacenza.');
      return;
    }

    const diameterLabel = Array.from(affectedDiameters)
      .sort((a, b) => a - b)
      .join(', ');

    const message = `La Giacenza esistente verrà SOSTITUITA per tutti i diametri presenti nella tabella (${diameterLabel} mm), usando SOLTANTO i record selezionati. I record non selezionati non verranno aggiunti. Dopo l'aggiornamento tutte le caselle saranno disattivate e non sarà possibile modificare ulteriormente questa selezione. Continuare?`;
    if (!confirm(message)) return;

    // Filter out unaffected diameters
    let newStock = state.stockDetail.filter(
      x => !affectedDiameters.has(Number(x.diameter)) && !isBlankMaster(x)
    );

    for (const option of selectedOptions) {
      const existing = newStock.find(
        x => Number(x.diameter) === option.diameter && Number(x.length) === option.length && Number(x.qty) > 0
      );
      if (existing) {
        existing.qty = String((Math.floor(n(existing.qty)) || 0) + option.qty);
      } else {
        const blank = newStock.find(isBlankMaster);
        if (blank) {
          Object.assign(blank, {
            diameter: String(option.diameter),
            qty: String(option.qty),
            length: String(option.length),
          });
        } else {
          newStock.push({
            id: newId(),
            diameter: String(option.diameter),
            qty: String(option.qty),
            length: String(option.length),
          });
        }
      }
    }

    if (!newStock.length) {
      newStock = [blankMaster()];
    }

    const updatedRemaining = r.remainingStock.map(x => ({
      ...x,
      applied: x.selected || x.applied,
      selected: false,
    }));
    const updatedScraps = r.scraps.map(x => ({
      ...x,
      added: x.selected || x.added,
      selected: false,
    }));

    setState(prev => ({
      ...prev,
      stockDetail: newStock,
      result: prev.result
        ? {
            ...prev.result,
            remainingStock: updatedRemaining,
            scraps: updatedScraps,
            stockUpdated: true,
          }
        : null,
    }));

    showToast(`Giacenza sostituita per i diametri ${diameterLabel} mm. Le caselle sono state disattivate.`);
  };

  // Toggle checkboxes in results
  const handleToggleUnmetSelect = (index: number, selected: boolean) => {
    setState(prev => {
      if (!prev.result) return prev;
      const updated = [...prev.result.unmet];
      if (updated[index] && !updated[index].added) {
        updated[index] = { ...updated[index], selected };
      }
      return { ...prev, result: { ...prev.result, unmet: updated } };
    });
  };

  const handleToggleAllUnmetSelect = (selected: boolean) => {
    setState(prev => {
      if (!prev.result) return prev;
      const updated = prev.result.unmet.map(x => (!x.added ? { ...x, selected } : x));
      return { ...prev, result: { ...prev.result, unmet: updated } };
    });
  };

  const handleToggleStockOptionSelect = (
    source: 'remaining' | 'scrap',
    index: number,
    selected: boolean
  ) => {
    setState(prev => {
      if (!prev.result || prev.result.stockUpdated) return prev;
      if (source === 'remaining') {
        const updated = [...prev.result.remainingStock];
        if (updated[index] && !updated[index].applied) {
          updated[index] = { ...updated[index], selected };
        }
        return { ...prev, result: { ...prev.result, remainingStock: updated } };
      } else {
        const updated = [...prev.result.scraps];
        if (updated[index] && !updated[index].added) {
          updated[index] = { ...updated[index], selected };
        }
        return { ...prev, result: { ...prev.result, scraps: updated } };
      }
    });
  };

  const handleToggleAllStockOptionsSelect = (selected: boolean) => {
    setState(prev => {
      if (!prev.result || prev.result.stockUpdated) return prev;
      const updatedRemaining = prev.result.remainingStock.map(x =>
        !x.applied ? { ...x, selected } : x
      );
      const updatedScraps = prev.result.scraps.map(x =>
        !x.added ? { ...x, selected } : x
      );
      return {
        ...prev,
        result: {
          ...prev.result,
          remainingStock: updatedRemaining,
          scraps: updatedScraps,
        },
      };
    });
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
      alert('Impossibile caricare il file: ' + e.message);
    }
  };

  // XLS Import
  const handleImportXls = async (file: File, kind: 'stockDetail' | 'demandDetail') => {
    const label = kind === 'stockDetail' ? 'Giacenza' : 'Richiesta';
    try {
      const imported = await parseMasterXls(file);
      if (
        !confirm(
          `L'importazione sostituirà tutti i record della tabella ${label} con i ${intFmt(
            imported.length
          )} record presenti nel file Excel. Continuare?`
        )
      ) {
        return;
      }
      setState(prev => ({ ...prev, [kind]: imported }));
      showToast(`${label}: importati ${intFmt(imported.length)} record dal file Excel.`);
    } catch (e: any) {
      alert(`Impossibile importare il file Excel: ${e.message || 'formato non valido.'}`);
    }
  };

  const validStockCount = validMasterRows(state.stockDetail).length;
  const validDemandCount = validMasterRows(state.demandDetail).length;

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
              subtitle="Gestisci le barre disponibili a magazzino o in cantiere."
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
              subtitle="Inserisci la distinta ferri e i tagli di armatura necessari."
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
                  <h3>Vista Affiancata: Giacenza & Richiesta</h3>
                  <p>
                    Confronta e modifica scorte e distinta di taglio in un unico colpo d'occhio.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn primary split-optimize-cta"
                  onClick={handleOptimize}
                >
                  ▶ Calcola Ottimizzazione
                </button>
              </div>

              <div className="split-view-grid">
                <div className="split-column">
                  <MasterTable
                    kind="stockDetail"
                    title="Giacenza Disponibile"
                    subtitle="Barre pronte per il taglio a magazzino."
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
                    title="Richiesta Tagli"
                    subtitle="Distinta dei ferri di armatura di progetto."
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
              onToggleUnmetSelect={handleToggleUnmetSelect}
              onToggleAllUnmetSelect={handleToggleAllUnmetSelect}
              onToggleStockOptionSelect={handleToggleStockOptionSelect}
              onToggleAllStockOptionsSelect={handleToggleAllStockOptionsSelect}
            />
          )}

          {activeTab === 'help' && <HelpView />}
        </main>

        <div className="footer-note">
          OTTIMIZZAZIONE BARRE C.A. · v. 1.25 · Dati memorizzati localmente nel browser · Progettato per PC e smartphone da cantiere
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        stockCount={validStockCount}
        demandCount={validDemandCount}
        hasResults={!!state.result}
      />

      {/* Multi-Level Sort Dialog */}
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
