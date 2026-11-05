import React, { useState } from 'react';
import { OptimizationResult } from '../types';
import { fmt, intFmt, resultKey, unitWeight } from '../utils/math';
import { buildOperationalPlan } from '../utils/optimizer';
import { CutDiagramBar } from './CutDiagramBar';
import { ConfirmModal } from './ConfirmModal';

export interface SelectedStockItem {
  source: 'remaining' | 'scrap';
  sourceIndex: number;
  diameter: number;
  length: number;
  qty: number;
}

interface ResultsViewProps {
  result: OptimizationResult | null;
  onOptimize: () => void;
  onExportPlan: () => void;
  onUpdateDemand: () => void;
  onUpdateStock: (selected: SelectedStockItem[]) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  onOptimize,
  onExportPlan,
  onUpdateDemand,
  onUpdateStock,
}) => {
  // Toggle: Tabella Dati (sx) e Diagrammi Visivi (dx)
  const [displayMode, setDisplayMode] = useState<'table' | 'visual'>('visual');

  // Selezione elementi in Giacenza Residua & Sfridi
  const [selectedStockKeys, setSelectedStockKeys] = useState<Set<string>>(new Set());

  // Modali in-app di conferma
  const [confirmDemandModalOpen, setConfirmDemandModalOpen] = useState(false);
  const [confirmStockModalOpen, setConfirmStockModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState<string | null>(null);

  const totalUsedWeight = (r: OptimizationResult) => {
    return (r.usedByLength || []).reduce((sum, x) => sum + (Number(x.weight) || 0), 0);
  };

  const has = !!(result && Array.isArray(result.patterns));

  // Genera chiave univoca per la selezione
  const getItemKey = (source: 'remaining' | 'scrap', idx: number) => `${source}_${idx}`;

  const handleToggleStockItem = (source: 'remaining' | 'scrap', idx: number) => {
    const key = getItemKey(source, idx);
    setSelectedStockKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleToggleAllStock = (
    allKeys: string[],
    allChecked: boolean
  ) => {
    if (allChecked) {
      setSelectedStockKeys(new Set());
    } else {
      setSelectedStockKeys(new Set(allKeys));
    }
  };

  const handleTriggerUpdateStock = (stockItems: SelectedStockItem[]) => {
    const selected = stockItems.filter(item =>
      selectedStockKeys.has(getItemKey(item.source, item.sourceIndex))
    );
    if (selected.length === 0) {
      setAlertModalMessage('Seleziona almeno un pezzo dalla tabella prima di aggiornare la Giacenza.');
      return;
    }
    setConfirmStockModalOpen(true);
  };

  const handleConfirmStockUpdate = (stockItems: SelectedStockItem[]) => {
    const selected = stockItems.filter(item =>
      selectedStockKeys.has(getItemKey(item.source, item.sourceIndex))
    );
    onUpdateStock(selected);
    setSelectedStockKeys(new Set());
    setConfirmStockModalOpen(false);
  };

  const handleTriggerUpdateDemand = () => {
    if (!result || result.unmet.length === 0) return;
    setConfirmDemandModalOpen(true);
  };

  const handleConfirmDemandUpdate = () => {
    onUpdateDemand();
    setConfirmDemandModalOpen(false);
  };

  return (
    <section className="page active" id="page-results">
      {/* 1) Titolo: "Ottimizza" e frase esplicativa aggiornata */}
      <div className="section-head optimization-head">
        <div>
          <h2>Ottimizza</h2>
          <p>Piano di Taglio Operativo generato sull'ottimizzazione della Giacenza.</p>
        </div>
        {/* 2) Pulsante "> Esegui ottimizzazione" più largo e font più grande */}
        <button
          className="btn primary optimize-pulse-btn-v2"
          type="button"
          id="optimizeBtn"
          onClick={onOptimize}
          aria-label="Esegui ottimizzazione"
        >
          <span>&gt; Esegui ottimizzazione</span>
        </button>
      </div>

      {!has && (
        <div id="resultsEmpty" className="panel empty-hero-panel">
          <div className="empty-hero-content">
            <div className="empty-hero-icon">▥</div>
            <h3>Nessun risultato disponibile</h3>
            <p>
              Inserisci o verifica i dati nelle sezioni <strong>Giacenza</strong> e{' '}
              <strong>Richiesta</strong>, quindi premi il pulsante in alto per calcolare il Piano di Taglio.
            </p>
            <button className="btn primary" type="button" onClick={onOptimize}>
              &gt; Esegui ottimizzazione adesso
            </button>
          </div>
        </div>
      )}

      {has && result && (() => {
        const usedWeight = totalUsedWeight(result);
        const diaList = (
          result.diameters ||
          Array.from(new Set((result.initialDemand || []).map(x => x.diameter)))
        ).join(', ');

        const { cuts, rows: operations } = buildOperationalPlan(result);

        // Lista pezzi residui / sfridi
        const stockOptions: SelectedStockItem[] = [
          ...result.remainingStock.map((x, i) => ({
            source: 'remaining' as const,
            sourceIndex: i,
            diameter: x.diameter,
            qty: x.qty,
            length: x.length,
          })),
          ...result.scraps.map((x, i) => ({
            source: 'scrap' as const,
            sourceIndex: i,
            diameter: x.diameter,
            qty: x.qty,
            length: x.length,
          })),
        ].sort(
          (a, b) =>
            a.diameter - b.diameter ||
            b.length - a.length ||
            (a.source === b.source ? 0 : a.source === 'remaining' ? -1 : 1)
        );

        const allStockKeys = stockOptions.map(o => getItemKey(o.source, o.sourceIndex));
        const stockAllChecked =
          allStockKeys.length > 0 && allStockKeys.every(k => selectedStockKeys.has(k));
        const stockSomeChecked =
          allStockKeys.some(k => selectedStockKeys.has(k)) && !stockAllChecked;

        return (
          <div id="resultsContent">
            {/* 9) Messaggio di stato in caso di completamento o parzialità */}
            <div className={`message-banner ${result.allFulfilled ? 'success' : 'warning'}`}>
              <span className="banner-icon">{result.allFulfilled ? '✓' : '⚠'}</span>
              <div className="banner-text">
                <strong>
                  {result.allFulfilled
                    ? 'Ottimizzazione completata'
                    : 'Ottimizzazione parziale'}
                </strong>
                <p>
                  {result.allFulfilled
                    ? `Evasi tutti i ${intFmt(result.fulfilledPieces)} pezzi su ${intFmt(
                        result.requestedPieces
                      )} richiesti.`
                    : `Evasi ${intFmt(result.fulfilledPieces)} pezzi su ${intFmt(
                        result.requestedPieces
                      )}. Non evasi ${intFmt(
                        result.requestedPieces - result.fulfilledPieces
                      )} pezzi a causa di esaurimento della giacenza.`}
                </p>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="kpis-modern">
              <div className="kpi-card">
                <div className="kpi-label">Pezzi Richiesti</div>
                <div className="kpi-value">{intFmt(result.requestedPieces)}</div>
                <div className="kpi-sub">totale distinta</div>
              </div>

              <div className="kpi-card accent-green">
                <div className="kpi-label">Pezzi Evasi</div>
                <div className="kpi-value">{intFmt(result.fulfilledPieces)}</div>
                <div className="kpi-sub">
                  {result.allFulfilled
                    ? '100% evaso'
                    : `${fmt(
                        (result.fulfilledPieces / Math.max(1, result.requestedPieces)) * 100,
                        1
                      )}% evasione`}
                </div>
              </div>

              <div className="kpi-card accent-amber">
                <div className="kpi-label">Sfrido Totale</div>
                <div className="kpi-value">{fmt(result.scrapMeters)} m</div>
                <div className="kpi-sub">{fmt(result.scrapPct, 1)}% barre consumate</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-label">Peso Acciaio Utilizzato</div>
                <div className="kpi-value">{fmt(usedWeight)} kg</div>
                <div className="kpi-sub">Ø: {diaList || '—'} mm</div>
              </div>
            </div>

            {/* Piano di Taglio Operativo */}
            <div className="panel cutting-plan-panel">
              <div className="panel-head plan-head-v2">
                <div className="panel-title-with-subtitle">
                  <h3>Piano di Taglio Operativo</h3>
                  {/* 3) Frase esplicativa esatta richiesta */}
                  <p>
                    Sequenza esecutiva con l'indicazione dei tagli raggruppati ed ordinati, dei tagli
                    da recuperare e degli sfridi inutilizzabili.
                  </p>
                </div>

                <div className="panel-head-actions-v2">
                  {/* 4) Invertite le posizioni: Tabella Dati (sx) e Diagrammi Visivi (dx) */}
                  <div className="view-mode-toggle" role="group" aria-label="Visualizzazione piano">
                    <button
                      type="button"
                      className={`view-toggle-btn ${displayMode === 'table' ? 'active' : ''}`}
                      onClick={() => setDisplayMode('table')}
                    >
                      ☰ Tabella Dati
                    </button>
                    <button
                      type="button"
                      className={`view-toggle-btn ${displayMode === 'visual' ? 'active' : ''}`}
                      onClick={() => setDisplayMode('visual')}
                    >
                      ✂ Diagrammi Visivi
                    </button>
                  </div>

                  {/* 5) Icona Esporta Piano XLS posizionata tutta a dx */}
                  <button
                    className="icon-xls-export-btn"
                    type="button"
                    id="exportPlanBtn"
                    onClick={onExportPlan}
                    title="Esporta Piano di Taglio in formato Excel (.xlsx)"
                    aria-label="Esporta Piano XLS"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span className="xls-tag">XLS</span>
                    <span className="xls-arrow">⇩</span>
                  </button>
                </div>
              </div>

              <div className="panel-body">
                {displayMode === 'visual' ? (
                  /* Visual Segmented Bar Cards */
                  <div className="visual-cutting-plan">
                    {operations.length === 0 ? (
                      <div className="empty">Nessuna barra utilizzata.</div>
                    ) : (
                      operations.map((p, idx) => (
                        <CutDiagramBar
                          key={idx}
                          diameter={p.diameter}
                          barUnits={p.barUnits}
                          barCount={p.barCount}
                          cutLength={p.cutLength}
                          cutCount={p.cutCount}
                          recoveryUnits={p.recoveryUnits}
                          scrapUnits={p.scrapUnits}
                        />
                      ))
                    )}
                  </div>
                ) : (
                  /* 7) Tabella Dati con intestazioni Tagli e altre colonne rigorosamente su 2 righe */
                  <div className="table-wrap">
                    <table className="result-table" id="outputTable">
                      <thead>
                        <tr>
                          <th>
                            <span className="th-line1">Ø</span>
                            <span className="th-line2">[mm]</span>
                          </th>
                          <th>
                            <span className="th-line1">N. barre</span>
                            <span className="th-line2">[n]</span>
                          </th>
                          <th>
                            <span className="th-line1">Barra</span>
                            <span className="th-line2">[m]</span>
                          </th>
                          <th>
                            <span className="th-line1">Recupero</span>
                            <span className="th-line2">[m]</span>
                          </th>
                          <th>
                            <span className="th-line1">Scarto</span>
                            <span className="th-line2">[m]</span>
                          </th>
                          {cuts.map((d, idx) => (
                            <th key={idx} className="th-cut-col">
                              <span className="th-line1">Taglio Ø {d.diameter}</span>
                              <span className="th-line2">{fmt(d.length / 100)} m</span>
                            </th>
                          ))}
                          <th>
                            <span className="th-line1">Peso</span>
                            <span className="th-line2">[kg]</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {operations.length === 0 ? (
                          <tr>
                            <td colSpan={cuts.length + 6} className="empty">
                              Nessuna barra utilizzata.
                            </td>
                          </tr>
                        ) : (
                          operations.map((p, idx) => {
                            const allocatedCm =
                              p.cutLength * p.cutCount + (p.recoveryUnits === 0 ? p.scrapUnits : 0);
                            const allocatedWeight =
                              (allocatedCm / 100) * unitWeight(p.diameter) * p.barCount;
                            return (
                              <tr key={idx}>
                                <td>{intFmt(p.diameter)}</td>
                                <td>{intFmt(p.barCount)}</td>
                                <td>{fmt(p.barUnits / 100)}</td>
                                <td>{fmt(p.recoveryUnits / 100)}</td>
                                <td>{fmt(p.scrapUnits / 100)}</td>
                                {cuts.map((d, cidx) => (
                                  <td key={cidx}>
                                    {p.cutKey === resultKey(d.diameter, d.length)
                                      ? intFmt(p.cutCount)
                                      : '0'}
                                  </td>
                                ))}
                                <td>{fmt(allocatedWeight)}</td>
                              </tr>
                            );
                          })
                        )}
                        {operations.length > 0 && (
                          <tr className="total-row">
                            <td>—</td>
                            <td>{intFmt(result.usedBars)}</td>
                            <td>{fmt(result.usedMeters)}</td>
                            <td>—</td>
                            <td>{fmt(result.scrapMeters)}</td>
                            {cuts.map((d, cidx) => (
                              <td key={cidx}>{intFmt(d.fulfilled)}</td>
                            ))}
                            <td>{fmt(usedWeight)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Pannelli inferiori */}
            <div className="result-grid">
              {/* 13) Riepilogo Barre Utilizzate con titolo e frase aggiornati */}
              <div className="panel result-panel">
                <div className="panel-head">
                  <div>
                    <h3>Riepilogo Barre Utilizzate</h3>
                    <p>Barre prelevate dalla Giacenza ed avviate al taglio.</p>
                  </div>
                </div>
                <div className="panel-body">
                  <div className="table-wrap">
                    <table className="result-table">
                      <thead>
                        <tr>
                          <th>
                            <span className="th-line1">Ø</span>
                            <span className="th-line2">[mm]</span>
                          </th>
                          <th>
                            <span className="th-line1">Barra</span>
                            <span className="th-line2">[cm]</span>
                          </th>
                          <th>
                            <span className="th-line1">Numero</span>
                            <span className="th-line2">[n]</span>
                          </th>
                          <th>
                            <span className="th-line1">Peso</span>
                            <span className="th-line2">[kg]</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.usedByLength.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="empty">
                              Nessuna barra utilizzata.
                            </td>
                          </tr>
                        ) : (
                          [...result.usedByLength]
                            .sort(
                              (a, b) =>
                                Number(b.diameter) - Number(a.diameter) ||
                                Number(b.length) - Number(a.length)
                            )
                            .map((x, idx) => (
                              <tr key={idx}>
                                <td>{intFmt(x.diameter)}</td>
                                <td>{intFmt(x.length)}</td>
                                <td>{intFmt(x.qty)}</td>
                                <td>{fmt(x.weight)}</td>
                              </tr>
                            ))
                        )}
                        <tr className="total-row">
                          <td colSpan={2}>Totale</td>
                          <td>{intFmt(result.usedBars)}</td>
                          <td>{fmt(usedWeight)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 10) Richiesta Non Evasa (senza checkbox, aggiornamento totale) */}
              <div className="panel result-panel">
                <div className="panel-head">
                  <div>
                    <h3>Richiesta Non Evasa</h3>
                    <p>Tagli non eseguiti a causa di esaurimento della giacenza.</p>
                  </div>
                  <button
                    className="btn primary small"
                    type="button"
                    onClick={handleTriggerUpdateDemand}
                    disabled={result.unmet.length === 0}
                  >
                    Aggiorna Richiesta
                  </button>
                </div>
                <div className="panel-body">
                  <div className="table-wrap">
                    <table className="result-table">
                      <thead>
                        <tr>
                          <th>
                            <span className="th-line1">Ø</span>
                            <span className="th-line2">[mm]</span>
                          </th>
                          <th>
                            <span className="th-line1">Taglio</span>
                            <span className="th-line2">[cm]</span>
                          </th>
                          <th>
                            <span className="th-line1">Mancanti</span>
                            <span className="th-line2">[n]</span>
                          </th>
                          <th>
                            <span className="th-line1">Peso</span>
                            <span className="th-line2">[kg]</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.unmet.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="empty">
                              Richiesta completamente evasa.
                            </td>
                          </tr>
                        ) : (
                          result.unmet.map((x, i) => (
                            <tr key={i}>
                              <td>{intFmt(x.diameter)}</td>
                              <td>{intFmt(x.length)}</td>
                              <td>{intFmt(x.remaining)}</td>
                              <td>
                                {fmt(x.remaining * (x.length / 100) * unitWeight(x.diameter))}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 11 & 12) Giacenza Residua & Sfridi (integrativa, elementi flaggabili persistenti) */}
              <div className="panel result-panel">
                <div className="panel-head">
                  <div>
                    <h3>Giacenza Residua & Sfridi</h3>
                    <p>Seleziona i pezzi da aggiungere eventualmente alla Giacenza attuale.</p>
                  </div>
                  <button
                    className="btn primary small"
                    type="button"
                    onClick={() => handleTriggerUpdateStock(stockOptions)}
                    disabled={stockOptions.length === 0}
                  >
                    Aggiorna Giacenza
                  </button>
                </div>
                <div className="panel-body">
                  <div className="table-wrap">
                    <table className="result-table">
                      <thead>
                        <tr>
                          <th>
                            <input
                              className="header-check"
                              type="checkbox"
                              checked={stockAllChecked}
                              ref={el => {
                                if (el) el.indeterminate = stockSomeChecked;
                              }}
                              onChange={() => handleToggleAllStock(allStockKeys, stockAllChecked)}
                              disabled={stockOptions.length === 0}
                              aria-label="Seleziona tutti i pezzi residui"
                            />
                          </th>
                          <th>
                            <span className="th-line1">Ø</span>
                            <span className="th-line2">[mm]</span>
                          </th>
                          <th>
                            <span className="th-line1">Nr.</span>
                            <span className="th-line2">[n]</span>
                          </th>
                          <th>
                            <span className="th-line1">L</span>
                            <span className="th-line2">[cm]</span>
                          </th>
                          <th>
                            <span className="th-line1">P</span>
                            <span className="th-line2">[kg]</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockOptions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="empty">
                              Nessuna barra residua o sfrido recuperabile.
                            </td>
                          </tr>
                        ) : (
                          stockOptions.map((x, i) => {
                            const isChecked = selectedStockKeys.has(
                              getItemKey(x.source, x.sourceIndex)
                            );
                            const w = x.qty * (x.length / 100) * unitWeight(x.diameter);
                            return (
                              <tr key={i}>
                                <td>
                                  <input
                                    className="scrap-check"
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleStockItem(x.source, x.sourceIndex)}
                                    aria-label={`Seleziona Ø ${intFmt(x.diameter)}, ${intFmt(
                                      x.qty
                                    )} pz da ${intFmt(x.length)} cm`}
                                  />
                                </td>
                                <td>{intFmt(x.diameter)}</td>
                                <td>{intFmt(x.qty)}</td>
                                <td>{intFmt(x.length)}</td>
                                <td>{fmt(w)}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="result-note">
                    I pezzi selezionati verranno integrati nella Giacenza attuale sommando le quantità dei tipi esistenti.
                  </p>
                </div>
              </div>
            </div>

            {/* Modali di Conferma In-App (eliminano 'gianc79.github.io dice') */}
            <ConfirmModal
              isOpen={confirmDemandModalOpen}
              title="Aggiorna Richiesta"
              message="I tagli non evasi sostituiranno integralmente l'attuale distinta Richiesta. Continuare?"
              confirmText="Aggiorna"
              cancelText="Annulla"
              onConfirm={handleConfirmDemandUpdate}
              onCancel={() => setConfirmDemandModalOpen(false)}
            />

            <ConfirmModal
              isOpen={confirmStockModalOpen}
              title="Aggiorna Giacenza"
              message="I pezzi selezionati verranno integrati nella tabella della Giacenza (aggiungendosi alle barre già registrate). Continuare?"
              confirmText="Integra Giacenza"
              cancelText="Annulla"
              onConfirm={() => handleConfirmStockUpdate(stockOptions)}
              onCancel={() => setConfirmStockModalOpen(false)}
            />

            <ConfirmModal
              isOpen={alertModalMessage !== null}
              title="Selezione richiesta"
              message={alertModalMessage || ''}
              confirmText="OK"
              showCancel={false}
              onConfirm={() => setAlertModalMessage(null)}
            />
          </div>
        );
      })()}
    </section>
  );
};
