import React, { useRef } from 'react';
import { MasterRow } from '../types';
import {
  blankMaster,
  fmt,
  inputNumber,
  masterStats,
  unitWeight,
  validDiameter,
} from '../utils/math';

interface MasterTableProps {
  kind: 'stockDetail' | 'demandDetail';
  title: string;
  subtitle: string;
  rows: MasterRow[];
  onChangeRows: (rows: MasterRow[]) => void;
  onOpenSort: () => void;
  onImportXls: (file: File) => void;
  onExportXls: () => void;
  onToast: (msg: string) => void;
}

export const MasterTable: React.FC<MasterTableProps> = ({
  kind,
  title,
  subtitle,
  rows,
  onChangeRows,
  onOpenSort,
  onImportXls,
  onExportXls,
  onToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stats = masterStats(rows);

  const handleCellChange = (id: string, field: 'diameter' | 'qty' | 'length', val: string) => {
    const updated = rows.map(r => (r.id === id ? { ...r, [field]: val } : r));
    onChangeRows(updated);
  };

  const handleCellBlur = (id: string, field: 'diameter' | 'qty' | 'length', rawVal: string) => {
    const trimmed = rawVal.trim();
    if (trimmed === '') return;

    const value = inputNumber(trimmed);
    let valid = value !== null;
    let message = '';

    if (field === 'diameter') {
      valid = validDiameter(value);
      message = 'Diametro non valido. Sono ammessi soltanto numeri pari da 6 a 40.';
    } else if (field === 'qty') {
      valid = Number.isInteger(value) && value! >= 1 && value! <= 10000;
      message = 'Valore Nr. non valido. Inserire un numero intero positivo da 1 a 10.000.';
    } else if (field === 'length') {
      valid = Number.isInteger(value) && value! >= 1 && value! <= 1200;
      message = 'Lunghezza non valida. Inserire un numero intero positivo da 1 a 1.200 cm.';
    }

    if (!valid) {
      alert(message);
      const updated = rows.map(r => (r.id === id ? { ...r, [field]: '' } : r));
      onChangeRows(updated);
      return;
    }

    const normalized = String(value);
    const updated = rows.map(r => (r.id === id ? { ...r, [field]: normalized } : r));
    onChangeRows(updated);
  };

  const handleAddRow = () => {
    onChangeRows([...rows, blankMaster()]);
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) {
      onChangeRows([blankMaster()]);
    } else {
      onChangeRows(rows.filter(r => r.id !== id));
    }
  };

  const handleClearTable = () => {
    if (!confirm('Sei sicuro di voler svuotare la tabella?')) return;
    onChangeRows([blankMaster()]);
    onToast('Tabella svuotata.');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      onImportXls(file);
    }
    e.target.value = '';
  };

  return (
    <section className="page active" id={`page-${kind === 'stockDetail' ? 'stock' : 'demand'}`}>
      <div className="section-head master-page-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="heading-actions">
          <button
            className="btn neutral"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Importa XLS
          </button>
          <button className="btn neutral" type="button" onClick={onExportXls}>
            Esporta XLS
          </button>
          <input
            ref={fileInputRef}
            className="file-input"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileInputChange}
          />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>{kind === 'stockDetail' ? 'Elenco Giacenza' : 'Elenco Richiesta'}</h3>
          </div>
          <button className="btn small sort" type="button" onClick={onOpenSort}>
            Ordina
          </button>
        </div>

        <div className="panel-body">
          <div className="table-wrap">
            <table className="master-table">
              <colgroup>
                <col className="dia" />
                <col className="qty" />
                <col className="length" />
                <col className="weight" />
                <col className="action" />
              </colgroup>
              <thead>
                <tr>
                  <th>Ø [mm]</th>
                  <th>Nr.</th>
                  <th>L [cm]</th>
                  <th>P [kg]</th>
                  <th>
                    <button
                      className="header-clear"
                      type="button"
                      onClick={handleClearTable}
                      aria-label={`Svuota tutti i record della ${title}`}
                    >
                      ×
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const q = inputNumber(r.qty);
                  const l = inputNumber(r.length);
                  const d = inputNumber(r.diameter);
                  const rowWeight =
                    Number.isInteger(q) &&
                    q! > 0 &&
                    q! <= 10000 &&
                    Number.isInteger(l) &&
                    l! > 0 &&
                    l! <= 1200 &&
                    validDiameter(d)
                      ? ((q! * l!) / 100) * unitWeight(d)
                      : 0;

                  return (
                    <tr key={r.id} data-master-row={r.id}>
                      <td>
                        <input
                          className="cell-input"
                          type="number"
                          min="6"
                          max="40"
                          step="2"
                          inputMode="numeric"
                          aria-label={`Diametro riga ${i + 1}`}
                          value={r.diameter}
                          placeholder="Ø"
                          onChange={e => handleCellChange(r.id, 'diameter', e.target.value)}
                          onBlur={e => handleCellBlur(r.id, 'diameter', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="cell-input"
                          type="number"
                          min="1"
                          max="10000"
                          step="1"
                          inputMode="numeric"
                          aria-label={`Numero riga ${i + 1}`}
                          value={r.qty}
                          placeholder="Nr."
                          onChange={e => handleCellChange(r.id, 'qty', e.target.value)}
                          onBlur={e => handleCellBlur(r.id, 'qty', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="cell-input"
                          type="number"
                          min="1"
                          max="1200"
                          step="1"
                          inputMode="numeric"
                          aria-label={`Lunghezza in centimetri riga ${i + 1}`}
                          value={r.length}
                          placeholder="cm"
                          onChange={e => handleCellChange(r.id, 'length', e.target.value)}
                          onBlur={e => handleCellBlur(r.id, 'length', e.target.value)}
                        />
                      </td>
                      <td className="weight-cell">
                        <span>{rowWeight > 0 ? fmt(rowWeight) : '—'}</span>
                      </td>
                      <td className="action-cell">
                        <button
                          className="icon-btn"
                          type="button"
                          onClick={() => handleDeleteRow(r.id)}
                          aria-label={`Elimina riga ${i + 1}`}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="table-bottom-actions">
            <button className="btn primary small" type="button" onClick={handleAddRow}>
              ＋ Aggiungi Riga
            </button>
          </div>

          <div className="calc-total">
            <div className="summary-box">
              <div className="s-label">Sviluppo</div>
              <div className="s-value">
                {fmt(stats.totalMeters)}
                <span className="s-unit">m</span>
              </div>
            </div>
            <div className="summary-box">
              <div className="s-label">Peso</div>
              <div className="s-value">
                {fmt(stats.totalWeight)}
                <span className="s-unit">kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
