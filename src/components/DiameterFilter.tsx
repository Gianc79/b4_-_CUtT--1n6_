import React from 'react';
import { MasterRow } from '../types';
import { inputNumber } from '../utils/math';

interface DiameterFilterProps {
  rows: MasterRow[];
  selectedDiameter: number | 'all';
  onSelectDiameter: (dia: number | 'all') => void;
}

const COMMON_DIAMETERS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40];

export const DiameterFilter: React.FC<DiameterFilterProps> = ({
  rows,
  selectedDiameter,
  onSelectDiameter,
}) => {
  // Count items per diameter
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

  // Active diameters in rows + common diameters that might have items
  const activeDiameters = Array.from(
    new Set([...Array.from(counts.keys()), ...COMMON_DIAMETERS])
  ).sort((a, b) => a - b);

  return (
    <div className="diameter-filter-wrap">
      <div className="diameter-filter-bar" role="tablist" aria-label="Filtro rapido per diametro">
        <button
          type="button"
          className={`filter-chip ${selectedDiameter === 'all' ? 'active' : ''}`}
          onClick={() => onSelectDiameter('all')}
        >
          <span className="chip-label">Tutti</span>
          {totalValid > 0 && <span className="chip-count">{totalValid}</span>}
        </button>

        {activeDiameters.map(dia => {
          const count = counts.get(dia) || 0;
          return (
            <button
              key={dia}
              type="button"
              className={`filter-chip ${selectedDiameter === dia ? 'active' : ''} ${
                count > 0 ? 'has-items' : 'empty-items'
              }`}
              onClick={() => onSelectDiameter(dia)}
            >
              <span className="chip-label">Ø {dia}</span>
              {count > 0 && <span className="chip-count">{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
