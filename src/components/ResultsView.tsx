import React, { useState } from 'react';
import { OptimizationResult } from '../types';
import { fmt, intFmt, resultKey, unitWeight } from '../utils/math';
import { buildOperationalPlan } from '../utils/optimizer';
import { CutDiagramBar } from './CutDiagramBar';

interface ResultsViewProps {
  result: OptimizationResult | null;
  onOptimize: () => void;
  onExportPlan: () => void;
  onUpdateDemand: () => void;
  onUpdateStock: () => void;
  onToggleUnmetSelect: (index: number, selected: boolean) => void;
  onToggleAllUnmetSelect: (selected: boolean) => void;
  onToggleStockOptionSelect: (source: 'remaining' | 'scrap', index: number, selected: boolean) => void;
  onToggleAllStockOptionsSelect: (selected: boolean) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  onOptimize,
  onExportPlan,
  onUpdateDemand,
  onUpdateStock,
  onToggleUnmetSelect,
  onToggleAllUnmetSelect,
  onToggleStockOptionSelect,
  onToggleAllStockOptionsSelect,
}) => {
  const [displayMode, setDisplayMode] = useState<'visual' | 'table'>('visual');

  const totalUsedWeight = (r: OptimizationResult) => {
    return (r.usedByLength || []).reduce((sum, x) => sum + (Number(x.weight) || 0), 0);
  };

  const has = !!(result && Array.isArray(result.patterns));

  return (
    <section className="page active" id="page-results">
      <div className="section-head optimization-head">
        <div>
          <h2>Ottimizzazione</h2>
          <p>Piano di Taglio esecutivo generato in funzione di Giacenza e Richiesta.</p>
        </div>
        <button
          className="btn primary optimize-pulse-btn"
          type="button"
          id="optimizeBtn"
          onClick={onOptimize}
          aria-label="Esegui ottimizzazione"
        >
          <span>
            ▶ Ricalcola
            <br />
            ottimizzazione
          </span>
        </button>
      </div>

      {!has && (
        <div id="resultsEmpty" className="panel empty-hero-panel">
          <div className="empty-hero-content">
            <div className="empty-hero-icon">▥</div>
            <h3>Nessun risultato disponibile</h3>
            <p>
              Inserisci o verifica i dati nelle sezioni <strong>Giacenza</strong> e{' '}
              <strong>Richiesta</strong>, quindi premi il pulsante in alto per calcolare la
              combinazione ottimale dei tagli.
            </p>
            <button className="btn primary" type="button" onClick={onOptimize}>
              ▶ Esegui ottimizzazione adesso
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

        const unmetEligible = result.unmet.filter(x => !x.added);
        const unmetAllChecked = unmetEligible.length > 0 && unmetEligible.every(x => x.selected);
        const unmetSomeChecked = unmetEligible.some(x => x.selected);

        const stockOptions = [
          ...result.remainingStock.map((x, i) => ({
            source: 'remaining' as const,
            sourceIndex: i,
            diameter: x.diameter,
            qty: x.qty,
            length: x.length,
            selected: !!x.selected,
            done: !!x.applied,
            weight: x.qty * (x.length / 100) * unitWeight(x.diameter),
            label: 'Barra intera',
          })),
          ...result.scraps.map((x, i) => ({
            source: 'scrap' as const,
            sourceIndex: i,
            diameter: x.diameter,
            qty: x.qty,
            length: x.length,
            selected: !!x.selected,
            done: !!x.added,
            weight: x.qty * (x.length / 100) * unitWeight(x.diameter),
            label: 'Sfrido',
          })),
        ].sort(
          (a, b) =>
            a.diameter - b.diameter ||
            b.length - a.length ||
            (a.source === b.source ? 0 : a.source === 'remaining' ? -1 : 1)
        );

        const stockEligible = stockOptions.filter(x => !x.done);
        const stockAllChecked = stockEligible.length > 0 && stockEligible.every(x => x.selected);
        const stockSomeChecked = stockEligible.some(x => x.selected);

        return (
          <div id="resultsContent">
            {/* Status Message */}
            <div className={`message-banner ${result.allFulfilled ? 'success' : 'warning'}`}>
              <span className="banner-icon">{result.allFulfilled ? '✓' : '⚠'}</span>
              <div className="banner-text">
                <strong>
                  {result.allFulfilled
                    ? 'Ottimizzazione completata con successo'
                    : 'Ottimizzazione parziale: fabbisogno residuo'}
                </strong>
                <p>
                  {result.allFulfilled
                    ? `Evasi tutti i ${intFmt(result.fulfilledPieces)} pezzi su ${intFmt(
                        result.requestedPieces
                      )} richiesti nei diametri lavorati.`
                    : `Evasi ${intFmt(result.fulfilledPieces)} pezzi su ${intFmt(
                        result.requestedPieces
                      )}. Mancano ${intFmt(
                        result.requestedPieces - result.fulfilledPieces
                      )} pezzi per esaurimento scorte.`}
                </p>
              </div>
            </div>

            {/* KPI Cards Strip */}
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
                    : `${fmt((result.fulfilledPieces / Math.max(1, result.requestedPieces)) * 100, 1)}% evasione`}
                </div>
              </div>

              <div className="kpi-card accent-amber">
                <div className="kpi-label">Sfrido Totale</div>
                <div className="kpi-value">{fmt(result.scrapMeters)} m</div>
                <div className="kpi-sub">{fmt(result.scrapPct, 1)}% delle barre consumate</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-label">Peso Acciaio Utilizzato</div>
                <div className="kpi-value">{fmt(usedWeight)} kg</div>
                <div className="kpi-sub">Ø: {diaList || '—'} mm</div>
              </div>
            </div>

            {/* Piano di Taglio Main Panel */}
            <div className="panel cutting-plan-panel">
              <div className="panel-head">
                <div className="panel-title-with-subtitle">
                  <h3>Piano di Taglio Operativo</h3>
                  <p>Sequenza esecutiva per l'operatore di taglio con recuperi e sfridi.</p>
                </div>

                <div className="panel-head-actions">
                  <div className="view-mode-toggle" role="group" aria-label="Visualizzazione piano">
                    <button
                      type="button"
                      className={`view-toggle-btn ${displayMode === 'visual' ? 'active' : ''}`}
                      onClick={() => setDisplayMode('visual')}
                    >
                      ✂ Diagrammi Visivi
                    </button>
                    <button
                      type="button"
                      className={`view-toggle-btn ${displayMode === 'table' ? 'active' : ''}`}
                      onClick={() => setDisplayMode('table')}
                    >
                      ☰ Tabella Dati
                    </button>
                  </div>

                  <button
                    className="btn primary small"
                    type="button"
                    id="exportPlanBtn"
                    onClick={onExportPlan}
                  >
                    ⇩ Esporta Piano XLS
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
                  /* Formal Result Table */
                  <div className="table-wrap">
                    <table className="result-table" id="outputTable">
                      <thead>
                        <tr>
                          <th>
                            <span className="th-main">Ø</span>
                            <span className="th-unit">[mm]</span>
                          </th>
                          <th>
                            <span className="th-main">N. barre</span>
                          </th>
                          <th>
                            <span className="th-main">Barra</span>
                            <span className="th-unit">[m]</span>
                          </th>
                          <th>
                            <span className="th-main">Recupero</span>
                            <span className="th-unit">[m]</span>
                          </th>
                          <th>
                            <span className="th-main">Scarto</span>
                            <span className="th-unit">[m]</span>
                          </th>
                          {cuts.map((d, idx) => (
                            <th key={idx}>
                              <span className="th-main">Taglio Ø {d.diameter}</span>
                              <span className="th-unit">{fmt(d.length / 100)} m</span>
                            </th>
                          ))}
                          <th>
                            <span className="th-main">Peso</span>
                            <span className="th-unit">[kg]</span>
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

            {/* Bottom Sub-Panels */}
            <div className="result-grid">
              {/* Riepilogo barre utilizzate */}
              <div className="panel result-panel">
                <div className="panel-head">
                  <div>
                    <h3>Riepilogo Barre Consumate</h3>
                    <p>Barre integre da magazzino avviate al taglio.</p>
                  </div>
                </div>
                <div className="panel-body">
                  <div className="table-wrap">
                    <table className="result-table">
                      <thead>
                        <tr>
                          <th>Ø [mm]</th>
                          <th>Barra [cm]</th>
                          <th>Numero</th>
                          <th>Peso [kg]</th>
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

              {/* Richiesta non evasa */}
              <div className="panel result-panel">
                <div className="panel-head">
                  <div>
                    <h3>Richiesta Non Evasa</h3>
                    <p>Tagli mancanti per esaurimento giacenza.</p>
                  </div>
                  <button
                    className="btn primary small"
                    type="button"
                    onClick={onUpdateDemand}
                    disabled={!result.unmet.some(x => x.selected && !x.added)}
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
                            <input
                              className="header-check"
                              type="checkbox"
                              checked={unmetAllChecked}
                              ref={el => {
                                if (el) el.indeterminate = unmetSomeChecked && !unmetAllChecked;
                              }}
                              onChange={e => onToggleAllUnmetSelect(e.target.checked)}
                              disabled={unmetEligible.length === 0}
                              aria-label="Seleziona tutti i tagli non evasi"
                            />
                          </th>
                          <th>Ø [mm]</th>
                          <th>Barra [cm]</th>
                          <th>Numero</th>
                          <th>Peso [kg]</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.unmet.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="empty">
                              Richiesta completamente evasa.
                            </td>
                          </tr>
                        ) : (
                          result.unmet.map((x, i) => (
                            <tr key={i} className={x.added ? 'row-applied' : ''}>
                              <td>
                                <input
                                  className="scrap-check"
                                  type="checkbox"
                                  checked={!!x.selected}
                                  disabled={!!x.added}
                                  onChange={e => onToggleUnmetSelect(i, e.target.checked)}
                                  aria-label={`Seleziona Ø ${x.diameter}, taglio ${intFmt(x.length)} cm`}
                                />
                              </td>
                              <td>{intFmt(x.diameter)}</td>
                              <td>{intFmt(x.length)}</td>
                              <td>
                                {intFmt(x.remaining)}
                                {x.added ? ' ✓' : ''}
                              </td>
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

              {/* Giacenza residua */}
              <div className="panel result-panel">
                <div className="panel-head">
                  <div>
                    <h3>Giacenza Residua & Sfridi</h3>
                    <p>Seleziona i pezzi da registrare a magazzino.</p>
                  </div>
                  <button
                    className="btn primary small"
                    type="button"
                    onClick={onUpdateStock}
                    disabled={!!result.stockUpdated || !stockOptions.some(x => x.selected && !x.done)}
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
                                if (el) el.indeterminate = stockSomeChecked && !stockAllChecked;
                              }}
                              onChange={e => onToggleAllStockOptionsSelect(e.target.checked)}
                              disabled={result.stockUpdated || stockEligible.length === 0}
                              aria-label="Seleziona tutte le barre residue e gli sfridi"
                            />
                          </th>
                          <th>Ø [mm]</th>
                          <th>Nr.</th>
                          <th>L [cm]</th>
                          <th>P [kg]</th>
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
                          stockOptions.map((x, i) => (
                            <tr key={i} className={x.done ? 'row-applied' : ''}>
                              <td>
                                <input
                                  className="scrap-check"
                                  type="checkbox"
                                  checked={!!x.selected && !x.done && !result.stockUpdated}
                                  disabled={x.done || result.stockUpdated}
                                  onChange={e =>
                                    onToggleStockOptionSelect(x.source, x.sourceIndex, e.target.checked)
                                  }
                                  aria-label={`Seleziona ${x.label.toLowerCase()}, Ø ${intFmt(
                                    x.diameter
                                  )}, ${intFmt(x.qty)} pezzi da ${intFmt(x.length)} cm`}
                                />
                              </td>
                              <td>{intFmt(x.diameter)}</td>
                              <td>
                                {intFmt(x.qty)}
                                {x.done ? ' ✓' : ''}
                              </td>
                              <td>{intFmt(x.length)}</td>
                              <td>{fmt(x.weight)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="result-note">
                    Confermando, la Giacenza esistente viene sostituita per tutti i diametri presenti in
                    questa tabella, usando soltanto i record selezionati.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};
