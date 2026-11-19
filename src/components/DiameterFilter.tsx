import React from 'react';
import { MasterRow } from '../types';
import { inputNumber } from '../utils/math';

interface DiameterFilterProps {
  rows: MasterRow[];
  selectedDiameter: number | 'all';
  onSelectDiameter: (dia: number | 'all') => void;
  id?: string;
}

export const DiameterFilter: React.FC<DiameterFilterProps> = ({
  rows,
  selectedDiameter,
  onSelectDiameter,
  id = 'diameter-filter-select',
}) => {
  // Calcola il numero di righe valide per ogni diametro presente
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

  // Mostra i diametri presenti nella tabella, includendo l'eventuale diametro attualmente filtrato anche se a 0 righe
  const diameterSet = new Set<number>(counts.keys());
  if (selectedDiameter !== 'all') {
    diameterSet.add(selectedDiameter);
  }
  const presentDiameters = Array.from(diameterSet).sort((a, b) => a - b);
  const isFiltered = selectedDiameter !== 'all';

  return (
    <div className={`diameter-filter-dropdown-wrap ${isFiltered ? 'is-filtered' : ''}`.trim()}>
      <label className="diameter-filter-label" htmlFor={id}>
        Filtra Ø
      </label>
      <select
        id={id}
        className="diameter-filter-select"
        value={selectedDiameter === 'all' ? 'all' : String(selectedDiameter)}
        onChange={e => {
          const val = e.target.value;
          onSelectDiameter(val === 'all' ? 'all' : Number(val));
        }}
        aria-label="Filtra Diametri"
      >
        <option value="all">Tutti ({totalValid})</option>
        {presentDiameters.map(dia => {
          const count = counts.get(dia) || 0;
          return (
            <option key={dia} value={String(dia)}>
              Ø {dia} mm ({count})
            </option>
          );
        })}
      </select>
    </div>
  );
};
