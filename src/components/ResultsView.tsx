import React, { useState } from 'react';
import { OptimizationResult } from '../types';
import { fmt, intFmt, resultKey, unitWeight } from '../utils/math';
import { buildOperationalPlan } from '../utils/optimizer';
import { CutDiagramBar } from './CutDiagramBar';
import { ConfirmModal } from './ConfirmModal';
import { ExportPlanModal } from './ExportPlanModal';
import { exportDiagramsAsPng, exportDiagramsAsPdf } from '../utils/exportDiagramsImage';

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
  onUndoOptimize?: () => void;
  canUndoOptimize?: boolean;
  onExportPlan: () => void;
  onUpdateDemand?: () => void;
  onUpdateStock: (selected: SelectedStockItem[]) => void;
  onToast?: (msg: string) => void;
}

/**
 * Icona Esporta Piano di Taglio in stile SpesaSuMisura (38x38 px con documento e freccia di esportazione).
 */
const ExportPlanIcon: React.FC<{ size?: number }> = ({ size = 38 }) => (
  <svg
    viewBox="0 0 38 38"
    width={size}
    height={size}
    fill="none"
    style={{ display: 'block' }}
  >
    <rect
      x="1"
      y="1"
      width="36"
      height="36"
      rx="9"
      fill="#ffffff"
      stroke="#102b46"
      strokeWidth="1.8"
    />
    {/* Foglio / Documento */}
    <path
      d="M13 10h8l6 6v12a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2z"
      fill="#f1f5f9"
      stroke="#102b46"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M21 10v6h6" stroke="#102b46" strokeWidth="1.6" strokeLinejoin="round" />
    {/* Cerchio blu con freccia di esportazione verso il basso */}
    <circle cx="26" cy="26" r="6.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.2" />
    <path
      d="M26 22.5v7m0 0l-2.2-2.2M26 29.5l2.2-2.2"
      stroke="#ffffff"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  onOptimize,
  onUndoOptimize,
  canUndoOptimize = false,
  onExportPlan,
  onUpdateDemand,
  onUpdateStock,
  onToast,
}) => {
  // Schermata principale e predefinita: Tabella Dati (sx)
  const [displayMode, setDisplayMode] = useState<'table' | 'visual'>('table');

  // Selezione elementi in Sfridi
  const [selectedStockKeys, setSelectedStockKeys] = useState<Set<string>>(new Set());

  // Modali in-app di conferma
  const [confirmStockModalOpen, setConfirmStockModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState<string | null>(null);

  const totalUsedWeight = (r: OptimizationResult) => {
    return (r.usedByLength || []).reduce((sum, x) => sum + (Number(x.weight) || 0), 0);
  };

  const has = !!(result && Array.isArray(result.patterns));

  const getItemKey = (idx: number) => `scrap_${idx}`;

  const handleToggleStockItem = (idx: number) => {
    const key = getItemKey(idx);
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
    const selected = stockItems.filter((_, idx) =>
      selectedStockKeys.has(getItemKey(idx))
    );
    if (selected.length === 0) {
      setAlertModalMessage('Seleziona almeno uno sfrido dalla tabella.');
      return;
    }
    setConfirmStockModalOpen(true);
  };

  const handleConfirmStockUpdate = (stockItems: SelectedStockItem[]) => {
    const selected = stockItems.filter((_, idx) =>
      selectedStockKeys.has(getItemKey(idx))
    );
    onUpdateStock(selected);
    setSelectedStockKeys(new Set());
    setConfirmStockModalOpen(false);
  };

  return (
    <section className="page active" id="page-results">
      {/* 5) Intestazione Ottimizza: Frase esplicativa aggiornata; Tasto Ottimizza ed Icona Esporta XLS a dx */}
      <div className="section-head optimization-head-v129">
        <div className="optimization-head-text">
          <h2>Ottimizza</h2>
          {/* Frase esplicativa v1.36 */}
          <p>Piano Operativo di Taglio generato dall'ottimizzazione della giacenza. Possibilità di esportarlo in un file Excel.</p>
        </div>

        {/* Pulsante Esegui ottimizzazione e Icona quadrata Annulla */}
        <div className="optimization-head-actions-row">
          <button
            className="btn primary optimize-pulse-btn-v128"
            type="button"
            id="optimizeBtn"
            onClick={onOptimize}
            aria-label="Esegui ottimizzazione"
          >
            <span className="optimize-btn-text-v128">▶ Esegui ottimizzazione</span>
          </button>
          <button
            type="button"
            className="btn-undo-optimization-square"
            onClick={onUndoOptimize}
            disabled={!canUndoOptimize}
            title={canUndoOptimize ? 'Annulla ultima ottimizzazione' : 'Nessuna ottimizzazione da annullare'}
            aria-label="Annulla ultima ottimizzazione"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: 'block' }}
            >
              <path d="M9 14L4 9l5-5" />
              <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
            </svg>
          </button>
        </div>
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
            <button className="btn primary optimize-pulse-btn-v128" type="button" onClick={onOptimize}>
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

        // Mostrare SOLO gli sfridi recuperabili
        const stockOptions: SelectedStockItem[] = result.scraps
          .map((x, i) => ({
            source: 'scrap' as const,
            sourceIndex: i,
            diameter: x.diameter,
            qty: x.qty,
            length: x.length,
          }))
          .sort((a, b) => a.diameter - b.diameter || b.length - a.length);

        const allStockKeys = stockOptions.map((_, idx) => getItemKey(idx));
        const stockAllChecked =
          allStockKeys.length > 0 && allStockKeys.every(k => selectedStockKeys.has(k));
        const stockSomeChecked =
          allStockKeys.some(k => selectedStockKeys.has(k)) && !stockAllChecked;

        // 1) Riepilogo Barre Utilizzate: Totale Numero e Totale Barra (MATR.SOMMA.PRODOTTO Numero e Barra)
        const totalUsedBarsPieces = result.usedByLength.reduce((sum, x) => sum + x.qty, 0);
        const totalUsedBarsMeters = result.usedByLength.reduce(
          (sum, x) => sum + (x.qty * (x.length / 100)),
          0
        );

        // 2) Richiesta Non Evasa: Totale Mancanti e Totale Taglio (MATR.SOMMA.PRODOTTO Mancanti e Taglio)
        const totalUnmetPieces = result.unmet.reduce((sum, x) => sum + x.remaining, 0);
        const totalUnmetMeters = result.unmet.reduce(
          (sum, x) => sum + (x.remaining * (x.length / 100)),
          0
        );
        const totalUnmetWeight = result.unmet.reduce(
          (sum, x) => sum + x.remaining * (x.length / 100) * unitWeight(x.diameter),
          0
        );

        // 3) Sfridi: Totale Nr. e Totale L (MATR.SOMMA.PRODOTTO Nr. e L)
        const totalScrapPieces = stockOptions.reduce((sum, x) => sum + x.qty, 0);
        const totalScrapMeters = stockOptions.reduce(
          (sum, x) => sum + (x.qty * (x.length / 100)),
          0
        );
        const totalScrapWeight = stockOptions.reduce(
          (sum, x) => sum + x.qty * (x.length / 100) * unitWeight(x.diameter),
          0
        );

        return (
          <div id="resultsContent">
            {/* Messaggio di stato */}
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
                      )} pezzi a causa di esaurimento della Giacenza.`}
                </p>
              </div>
            </div>

            {/* 2) KPI Cards in formato 3D / Rilievo con allineamento verticale coerente */}
            <div className="kpis-modern-3d">
              <div className="kpi-card-3d">
                <div className="kpi-label-3d">Pezzi Richiesti</div>
                <div className="kpi-value-3d">{intFmt(result.requestedPieces)}</div>
                <div className="kpi-sub-3d">totale distinta</div>
              </div>

              <div className="kpi-card-3d accent-green-3d">
                <div className="kpi-label-3d">Pezzi Evasi</div>
                <div className="kpi-value-3d">{intFmt(result.fulfilledPieces)}</div>
                <div className="kpi-sub-3d">
                  {result.allFulfilled
                    ? '100% evaso'
                    : `${fmt(
                        (result.fulfilledPieces / Math.max(1, result.requestedPieces)) * 100,
                        1
                      )}% evasione`}
                </div>
              </div>

              <div className="kpi-card-3d accent-amber-3d">
                <div className="kpi-label-3d">Sfrido Totale</div>
                <div className="kpi-value-3d">{fmt(result.scrapMeters)} m</div>
                <div className="kpi-sub-3d nowrap-sub-3d">{fmt(result.scrapPct, 1)}% delle barre utilizzate</div>
              </div>

              <div className="kpi-card-3d">
                <div className="kpi-label-3d">Peso Acciaio Utilizzato</div>
                <div className="kpi-value-3d">{fmt(usedWeight)} kg</div>
                <div className="kpi-sub-3d">Ø: {diaList || '—'} mm</div>
              </div>
            </div>

            {/* 3) Piano Operativo di Taglio */}
            <div className="panel cutting-plan-panel">
              <div className="panel-head plan-head-v137">
                <div className="plan-title-row-v137">
                  <h3>Piano Operativo di Taglio</h3>
                  <button
                    type="button"
                    className="btn outline small export-plan-head-btn"
                    onClick={() => setExportModalOpen(true)}
                    title="Esporta o Stampa il Piano di Taglio (PDF, Immagine, Excel)"
                  >
                    📥 Esporta / Stampa
                  </button>
                </div>

                <p className="plan-subtitle-v137">
                  Sequenza cronologica dei pezzi da tagliare, con l'indicazione delle barre da
                  utilizzare, dei tagli da recuperare e degli scarti/sfridi (da recuperare su richiesta).
                </p>

                <div className="plan-toggle-row-v137">
                  {/* Widget delle schede Tabella Dati / Diagrammi Visivi */}
                  <div className="view-mode-toggle-v128" role="group" aria-label="Visualizzazione piano">
                    <button
                      type="button"
                      className={`view-toggle-btn-v128 ${displayMode === 'table' ? 'active' : ''}`}
                      onClick={() => setDisplayMode('table')}
                    >
                      ☰ Tabella Dati
                    </button>
                    <button
                      type="button"
                      className={`view-toggle-btn-v128 ${displayMode === 'visual' ? 'active' : ''}`}
                      onClick={() => setDisplayMode('visual')}
                    >
                      ✂ Diagrammi Visivi
                    </button>
                  </div>
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
                          barId={p.barId}
                          isRecovery={p.isRecovery}
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
                  /* Tabella Dati */
                  <div className="table-wrap">
                    <table className="result-table" id="outputTable">
                      <thead>
                        <tr>
                          <th>
                            <span className="th-line1">ID</span>
                            <span className="th-line2">[n]</span>
                          </th>
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
                            <td colSpan={cuts.length + 7} className="empty">
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
                                <td className="plan-id-cell">
                                  <span
                                    className={`table-id-badge ${p.isRecovery ? 'badge-recovery' : 'badge-origin'}`}
                                    title={p.isRecovery ? `Barra da recupero della barra ${p.barId}` : `Barra originaria ${p.barId}`}
                                  >
                                    {p.barId}
                                  </span>
                                </td>
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
                            <td></td>
                            <td className="total-label-cell">Totale</td>
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
              {/* Tabella "Riepilogo Barre Utilizzate": Totale sotto il primo campo e solo per Peso */}
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
                            <span className="th-line1">Numero</span>
                            <span className="th-line2">[n]</span>
                          </th>
                          <th>
                            <span className="th-line1">Barra</span>
                            <span className="th-line2">[m]</span>
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
                                <td>{intFmt(x.qty)}</td>
                                <td>{fmt(x.length / 100)}</td>
                                <td>{fmt(x.weight)}</td>
                              </tr>
                            ))
                        )}
                        <tr className="total-row">
                          <td className="total-label-cell">Totale</td>
                          <td>{intFmt(totalUsedBarsPieces)}</td>
                          <td>{fmt(totalUsedBarsMeters)}</td>
                          <td>{fmt(usedWeight)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Tabella "Richiesta Non Evasa": Totale con stessi criteri + Pulsante Aggiorna Richiesta sotto a dx */}
              <div className="panel result-panel">
                <div className="panel-head">
                  <div>
                    <h3>Richiesta Non Evasa</h3>
                    <p>Tagli non eseguiti a causa di esaurimento della Giacenza.</p>
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
                            <span className="th-line1">Mancanti</span>
                            <span className="th-line2">[n]</span>
                          </th>
                          <th>
                            <span className="th-line1">Taglio</span>
                            <span className="th-line2">[m]</span>
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
                              <td>{intFmt(x.remaining)}</td>
                              <td>{fmt(x.length / 100)}</td>
                              <td>
                                {fmt(x.remaining * (x.length / 100) * unitWeight(x.diameter))}
                              </td>
                            </tr>
                          ))
                        )}
                        {result.unmet.length > 0 && (
                          <tr className="total-row">
                            <td className="total-label-cell">Totale</td>
                            <td>{intFmt(totalUnmetPieces)}</td>
                            <td>{fmt(totalUnmetMeters)}</td>
                            <td>{fmt(totalUnmetWeight)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Tabella "Sfridi": Riga Totale con stessi criteri + Pulsante sotto a dx */}
              <div className="panel result-panel">
                <div className="panel-head">
                  <div>
                    <h3>Sfridi</h3>
                    <p>Seleziona gli eventuali sfridi da integrare nella Giacenza attuale.</p>
                  </div>
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
                              aria-label="Seleziona tutti gli sfridi"
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
                            <span className="th-line2">[m]</span>
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
                              Nessuno sfrido generato dal piano di taglio.
                            </td>
                          </tr>
                        ) : (
                          stockOptions.map((x, i) => {
                            const isChecked = selectedStockKeys.has(getItemKey(i));
                            const w = x.qty * (x.length / 100) * unitWeight(x.diameter);
                            return (
                              <tr key={i}>
                                <td>
                                  <input
                                    className="scrap-check"
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleStockItem(i)}
                                    aria-label={`Seleziona sfrido Ø ${intFmt(x.diameter)}, ${intFmt(
                                      x.qty
                                    )} pz da ${fmt(x.length / 100)} m`}
                                  />
                                </td>
                                <td>{intFmt(x.diameter)}</td>
                                <td>{intFmt(x.qty)}</td>
                                <td>{fmt(x.length / 100)}</td>
                                <td>{fmt(w)}</td>
                              </tr>
                            );
                          })
                        )}
                        {stockOptions.length > 0 && (
                          <tr className="total-row">
                            <td></td>
                            <td className="total-label-cell">Totale</td>
                            <td>{intFmt(totalScrapPieces)}</td>
                            <td>{fmt(totalScrapMeters)}</td>
                            <td>{fmt(totalScrapWeight)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pulsante "Aggiorna Giacenza" posizionato sotto la tabella a destra */}
                  <div className="sfridi-footer-actions">
                    <button
                      className="btn primary small"
                      type="button"
                      onClick={() => handleTriggerUpdateStock(stockOptions)}
                      disabled={stockOptions.length === 0}
                    >
                      Aggiorna Giacenza
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modali di Conferma In-App */}
            {/* Frase esplicativa esatta: "Gli sfridi selezionati verranno integrati nella Giacenza. Continuare?" */}
            <ConfirmModal
              isOpen={confirmStockModalOpen}
              title="Aggiorna Giacenza"
              message="Gli sfridi selezionati verranno integrati nella Giacenza. Continuare?"
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

            {/* Finestra Modale Esporta Piano di Taglio (PDF, Immagine, Excel) */}
            <ExportPlanModal
              isOpen={exportModalOpen}
              onClose={() => setExportModalOpen(false)}
              onExportExcel={() => onExportPlan()}
              onExportPdf={() => {
                exportDiagramsAsPdf(operations, result, onToast || (() => {}));
              }}
              onExportPng={() => {
                exportDiagramsAsPng(operations, result, onToast || (() => {}));
              }}
            />
          </div>
        );
      })()}
    </section>
  );
};
