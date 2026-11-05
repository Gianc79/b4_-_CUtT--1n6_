import React from 'react';
import { MasterRow } from '../types';
import { inputNumber } from '../utils/math';

interface DiameterFilterProps {
  rows: MasterRow[];
  selectedDiameter: number | 'all';
  onSelectDiameter: (dia: number | 'all') => void;
}

export const DiameterFilter: React.FC<DiameterFilterProps> = ({
  rows,
  selectedDiameter,
  onSelectDiameter,
}) => {
  // Calcola i pezzi per ogni diametro presente
  const counts = new Map<number, number>();
  let totalValid = 0;

  for (const r of rows) {
    const d = inputNumber(r.diameter);
    const q = inputNumber(r.qty);
    const l = inputNumber(r.length);
    if (d && q && l && q > 0 && l > 0) {
      counts.set(d, (counts.get(d) || 0) + 1);
      totalValid++;
    }
  }

  // Mostra ESCLUSIVAMENTE i diametri presenti nella tabella
  const presentDiameters = Array.from(counts.keys()).sort((a, b) => a - b);

  return (
    <div className="diameter-filter-wrap">
      <div className="diameter-filter-bar" role="tablist" aria-label="Filtro rapido per diametro">
        <button
          type="button"
          className={`filter-chip ${selectedDiameter === 'all' ? 'active' : ''}`}
          onClick={() => onSelectDiameter('all')}
        >
          <span className="chip-label">Tutti</span>
          <span className="chip-count">{totalValid}</span>
        </button>

        {presentDiameters.map(dia => {
          const count = counts.get(dia) || 0;
          const isActive = selectedDiameter === dia;
          return (
            <button
              key={dia}
              type="button"
              className={`filter-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectDiameter(dia)}
            >
              <span className="chip-label">Ø {dia}</span>
              <span className="chip-count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
