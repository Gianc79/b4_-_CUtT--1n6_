import React from 'react';
import { fmt, intFmt } from '../utils/math';

interface CutDiagramBarProps {
  diameter: number;
  barUnits: number; // in cm
  barCount: number;
  cutLength: number; // in cm
  cutCount: number;
  recoveryUnits: number; // in cm
  scrapUnits: number; // in cm
}

export const CutDiagramBar: React.FC<CutDiagramBarProps> = ({
  diameter,
  barUnits,
  barCount,
  cutLength,
  cutCount,
  recoveryUnits,
  scrapUnits,
}) => {
  const totalLength = Math.max(1, barUnits);
  const totalCutUnits = cutLength * cutCount;
  const cutPct = Math.min(100, Math.max(0, (totalCutUnits / totalLength) * 100));
  const recoveryPct = Math.min(100 - cutPct, Math.max(0, (recoveryUnits / totalLength) * 100));
  const scrapPct = Math.max(0, 100 - cutPct - recoveryPct);

  return (
    <div className="cut-diagram-card">
      <div className="cut-diagram-header">
        <div className="cut-diagram-meta">
          <span className="diagram-dia-badge">Ø {diameter} mm</span>
          <span className="diagram-bar-count">
            <strong>{intFmt(barCount)}</strong> {barCount === 1 ? 'barra' : 'barre'} da{' '}
            <strong>{fmt(barUnits / 100)} m</strong>
          </span>
        </div>
        <div className="cut-diagram-summary">
          <span className="diagram-summary-cut">
            {cutCount}× {intFmt(cutLength)} cm ({fmt(totalCutUnits / 100)} m)
          </span>
          {recoveryUnits > 0 && (
            <span className="diagram-summary-rec">
              Recupero: {intFmt(recoveryUnits)} cm ({fmt(recoveryUnits / 100)} m)
            </span>
          )}
          {scrapUnits > 0 && (
            <span className="diagram-summary-scrap">
              Sfrido: {intFmt(scrapUnits)} cm ({fmt(scrapUnits / 100)} m)
            </span>
          )}
        </div>
      </div>

      {/* Proportional Segmented Bar */}
      <div
        className="cut-bar-container"
        title={`Barra: ${fmt(barUnits / 100)} m | Tagli: ${cutCount}x ${intFmt(cutLength)} cm | Recupero: ${intFmt(
          recoveryUnits
        )} cm | Sfrido: ${intFmt(scrapUnits)} cm`}
      >
        {/* Cut Pieces */}
        {cutPct > 0 && (
          <div
            className="cut-segment cut-piece"
            style={{ width: `${cutPct}%` }}
          >
            <div className="cut-segment-content">
              <span className="cut-icon">✂</span>
              <span className="cut-label">
                {cutCount > 1 ? `${cutCount}× ` : ''}
                {intFmt(cutLength)} cm
              </span>
            </div>
          </div>
        )}

        {/* Recovery (if any) */}
        {recoveryPct > 0 && (
          <div
            className="cut-segment cut-recovery"
            style={{ width: `${recoveryPct}%` }}
          >
            <div className="cut-segment-content">
              <span className="cut-icon">↻</span>
              <span className="cut-label">Rec. {intFmt(recoveryUnits)} cm</span>
            </div>
          </div>
        )}

        {/* Scrap (if any) */}
        {scrapPct > 0 && (
          <div
            className="cut-segment cut-scrap"
            style={{ width: `${scrapPct}%` }}
          >
            <div className="cut-segment-content">
              <span className="cut-label">
                {scrapPct > 12 ? `Sfrido ${intFmt(scrapUnits)} cm` : `${intFmt(scrapUnits)}`}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="cut-diagram-ticks">
        <span>0 cm</span>
        <span>{fmt(totalCutUnits / 100)} m (taglio)</span>
        <span>{fmt(barUnits / 100)} m (totale)</span>
      </div>
    </div>
  );
};
