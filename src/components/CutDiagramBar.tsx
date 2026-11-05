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

  // Calcolo punti di taglio effettivi lungo la barra (in cm e in percentuale)
  const cutPoints: Array<{ cm: number; meters: string; pct: number }> = [];
  let accumCm = 0;

  for (let i = 1; i <= cutCount; i++) {
    accumCm += cutLength;
    if (accumCm < totalLength) {
      cutPoints.push({
        cm: accumCm,
        meters: fmt(accumCm / 100),
        pct: (accumCm / totalLength) * 100,
      });
    }
  }

  // Se c'è recupero prima dello sfrido, il punto di separazione tra recupero e sfrido è un taglio
  if (recoveryUnits > 0 && accumCm + recoveryUnits < totalLength) {
    const recEndCm = accumCm + recoveryUnits;
    cutPoints.push({
      cm: recEndCm,
      meters: fmt(recEndCm / 100),
      pct: (recEndCm / totalLength) * 100,
    });
  }

  // Singoli pezzi di taglio
  const pieces = Array.from({ length: cutCount }, (_, idx) => ({
    id: idx,
    pct: (cutLength / totalLength) * 100,
    meters: fmt(cutLength / 100),
  }));

  const recoveryPct = (recoveryUnits / totalLength) * 100;
  const scrapPct = Math.max(0, 100 - ((cutLength * cutCount + recoveryUnits) / totalLength) * 100);

  return (
    <div className="cut-diagram-card-3d">
      {/* 4) Numero delle barre posizionato nell'angolo in alto a destra DEL RIQUADRO GENERICO con font 1.5x */}
      <div
        className="diagram-card-barcount-badge"
        title={`${barCount} ${barCount === 1 ? 'barra' : 'barre'}`}
      >
        <span className="badge-count-num">{intFmt(barCount)}</span>
      </div>

      {/* Header con i riquadri Diametro e Lunghezza barra */}
      <div className="cut-diagram-header-v3">
        <div className="cut-badges-group-v3">
          {/* Riquadro Diametro */}
          <div className="dia-badge-box-v3">
            Ø {diameter} mm
          </div>

          {/* Riquadro Lunghezza barra */}
          <div className="bar-length-badge-box-v3">
            <span>Barra {fmt(barUnits / 100)} m</span>
          </div>
        </div>

        {/* Indicazioni riassuntive sopra la barra (solo in metri #,## m) */}
        <div className="cut-diagram-summary-v3">
          <span className="summary-indicator-v3 tag-cut-3d">
            Taglio: {cutCount > 1 ? `${cutCount}× ` : ''}{fmt(cutLength / 100)} m
          </span>
          {recoveryUnits > 0 && (
            <span className="summary-indicator-v3 tag-rec-3d">
              Recupero: {fmt(recoveryUnits / 100)} m
            </span>
          )}
          {scrapUnits > 0 && (
            <span className="summary-indicator-v3 tag-scrap-3d">
              Sfrido: {fmt(scrapUnits / 100)} m
            </span>
          )}
        </div>
      </div>

      {/* Barra con spigoli retti (border-radius: 0) ed EFFETTO 3D lucido/metallico */}
      <div className="cut-bar-container-3d">
        {/* Pezzi di taglio (Verde 3D con riflesso e separatori marcati) */}
        {pieces.map(piece => (
          <div
            key={piece.id}
            className="cut-segment-3d seg-cut-3d"
            style={{ width: `${piece.pct}%` }}
            title={`Taglio: ${piece.meters} m`}
          >
            <span className="seg-label-3d">{piece.meters} m</span>
          </div>
        ))}

        {/* Recupero (Blu 3D) */}
        {recoveryUnits > 0 && (
          <div
            className="cut-segment-3d seg-recovery-3d"
            style={{ width: `${recoveryPct}%` }}
            title={`Recupero: ${fmt(recoveryUnits / 100)} m`}
          >
            <span className="seg-label-3d">{fmt(recoveryUnits / 100)} m</span>
          </div>
        )}

        {/* Sfrido (Rosso 3D) */}
        {scrapUnits > 0 && (
          <div
            className="cut-segment-3d seg-scrap-3d"
            style={{ width: `${scrapPct}%` }}
            title={`Sfrido: ${fmt(scrapUnits / 100)} m`}
          >
            <span className="seg-label-3d">{fmt(scrapUnits / 100)} m</span>
          </div>
        )}
      </div>

      {/* Forbici orientate rigorosamente in VERTICALE sotto alla barra per ogni taglio */}
      <div className="cut-markers-track-v3">
        {cutPoints.map((cp, idx) => (
          <div
            key={idx}
            className="cut-marker-item-v3"
            style={{ left: `${cp.pct}%` }}
            title={`Punto di taglio a ${cp.meters} m`}
          >
            <div className="cut-marker-line-v3" />
            <div className="cut-marker-scissors-vertical" aria-hidden="true">
              {/* Forbice con lame orientate verso l'alto verso la linea di taglio */}
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <g transform="rotate(-90 12 12)">
                  <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm9.5-8c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1zm3.5-9h-3l-4.34 4.34 2.12 2.12L22 4.41V3h-3z" />
                </g>
              </svg>
            </div>
            <span className="cut-marker-label-v3">{cp.meters} m</span>
          </div>
        ))}
      </div>
    </div>
  );
};
