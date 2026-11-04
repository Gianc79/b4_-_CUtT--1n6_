import React, { useState, useRef } from 'react';
import { MasterRow } from '../types';
import {
  blankMaster,
  fmt,
  inputNumber,
  masterStats,
  unitWeight,
  validDiameter,
} from '../utils/math';
import { DiameterFilter } from './DiameterFilter';
import { ItemCard } from './ItemCard';

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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedDiameter, setSelectedDiameter] = useState<number | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = masterStats(rows);

  // Quick add state
  const [quickDia, setQuickDia] = useState<string>('12');
  const [quickQty, setQuickQty] = useState<string>('1');
  const [quickLength, setQuickLength] = useState<string>('1200');

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

  const handleAddRow = (initial?: Partial<MasterRow>) => {
    const newRow: MasterRow = {
      ...blankMaster(),
      diameter: initial?.diameter || (selectedDiameter !== 'all' ? String(selectedDiameter) : ''),
      qty: initial?.qty || '',
      length: initial?.length || '',
    };
    onChangeRows([...rows, newRow]);
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

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const d = inputNumber(quickDia);
    const q = inputNumber(quickQty);
    const l = inputNumber(quickLength);

    if (!validDiameter(d)) {
      alert('Diametro non valido. Scegli un numero pari tra 6 e 40 mm.');
      return;
    }
    if (!q || q < 1 || q > 10000) {
      alert('Quantità non valida. Inserisci un intero positivo da 1 a 10.000.');
      return;
    }
    if (!l || l < 1 || l > 1200) {
      alert('Lunghezza non valida. Inserisci un intero in cm da 1 a 1.200.');
      return;
    }

    // Check if there is an empty row we can populate
    const emptyIndex = rows.findIndex(
      r => !r.diameter.trim() && !r.qty.trim() && !r.length.trim()
    );

    if (emptyIndex >= 0) {
      const updated = [...rows];
      updated[emptyIndex] = {
        ...updated[emptyIndex],
        diameter: String(d),
        qty: String(q),
        length: String(l),
      };
      onChangeRows(updated);
    } else {
      onChangeRows([
        ...rows,
        {
          ...blankMaster(),
          diameter: String(d),
          qty: String(q),
          length: String(l),
        },
      ]);
    }

    onToast(`Aggiunto: ${q} barre Ø ${d} da ${l} cm.`);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      onImportXls(file);
    }
    e.target.value = '';
  };

  // Filter rows if a specific diameter is selected
  const filteredRows = rows.filter(r => {
    if (selectedDiameter === 'all') return true;
    const d = inputNumber(r.diameter);
    return d === selectedDiameter;
  });

  return (
    <section className="page active" id={`page-${kind === 'stockDetail' ? 'stock' : 'demand'}`}>
      {/* Section Head */}
      <div className="section-head master-page-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="heading-actions">
          {/* View mode toggle */}
          <div className="view-mode-toggle" role="group" aria-label="Modalità di visualizzazione">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Vista Schede Touch (ideale per smartphone e cantiere)"
            >
              ⊞ Schede
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Vista Tabella Densa"
            >
              ☰ Tabella
            </button>
          </div>

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

      {/* Totals Summary Cards */}
      <div className="calc-total top-totals">
        <div className="summary-box">
          <div className="s-label">Sviluppo Complessivo</div>
          <div className="s-value">
            {fmt(stats.totalMeters)}
            <span className="s-unit">m</span>
          </div>
          <div className="s-sub">{stats.totalQty} pezzi totali</div>
        </div>
        <div className="summary-box">
          <div className="s-label">Peso Totale</div>
          <div className="s-value">
            {fmt(stats.totalWeight)}
            <span className="s-unit">kg</span>
          </div>
          <div className="s-sub">Acciaio B450C</div>
        </div>
      </div>

      {/* Quick Add Bar for Fast Entry */}
      <div className="panel quick-add-panel">
        <form onSubmit={handleQuickAdd} className="quick-add-form">
          <div className="quick-add-title">
            <span>＋ Inserimento Rapido</span>
          </div>
          <div className="quick-add-fields">
            <div className="field-group">
              <label htmlFor={`quick-dia-${kind}`}>Ø mm</label>
              <select
                id={`quick-dia-${kind}`}
                value={quickDia}
                onChange={e => setQuickDia(e.target.value)}
              >
                {[6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40].map(dia => (
                  <option key={dia} value={dia}>
                    Ø {dia} mm
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label htmlFor={`quick-length-${kind}`}>Lunghezza</label>
              <div className="input-with-suffix">
                <input
                  id={`quick-length-${kind}`}
                  type="number"
                  min="1"
                  max="1200"
                  step="1"
                  value={quickLength}
                  onChange={e => setQuickLength(e.target.value)}
                  placeholder="cm"
                />
                <span className="input-suffix">cm</span>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor={`quick-qty-${kind}`}>Quantità</label>
              <input
                id={`quick-qty-${kind}`}
                type="number"
                min="1"
                max="10000"
                step="1"
                value={quickQty}
                onChange={e => setQuickQty(e.target.value)}
                placeholder="Nr."
              />
            </div>

            <button type="submit" className="btn primary quick-add-submit">
              ＋ Inserisci
            </button>
          </div>
        </form>
      </div>

      {/* Diameter Filter Bar */}
      <DiameterFilter
        rows={rows}
        selectedDiameter={selectedDiameter}
        onSelectDiameter={setSelectedDiameter}
      />

      {/* Main Content Panel */}
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title-group">
            <h3>{kind === 'stockDetail' ? 'Elenco Giacenza' : 'Elenco Richiesta'}</h3>
            {selectedDiameter !== 'all' && (
              <span className="active-filter-badge">
                Filtrato: Ø {selectedDiameter} mm ({filteredRows.length})
              </span>
            )}
          </div>
          <div className="panel-head-actions">
            <button className="btn small sort" type="button" onClick={onOpenSort}>
              Ordina
            </button>
            <button
              className="btn small neutral text-danger"
              type="button"
              onClick={handleClearTable}
              title="Svuota l'intera tabella"
            >
              Svuota
            </button>
          </div>
        </div>

        <div className="panel-body">
          {viewMode === 'cards' ? (
            /* Cards View */
            <div className="cards-view-wrap">
              {filteredRows.length === 0 ? (
                <div className="empty-filter-state">
                  <p>Nessun elemento registrato per questo filtro.</p>
                  <button
                    type="button"
                    className="btn primary small"
                    onClick={() =>
                      handleAddRow({
                        diameter: selectedDiameter !== 'all' ? String(selectedDiameter) : '',
                      })
                    }
                  >
                    ＋ Aggiungi barra {selectedDiameter !== 'all' ? `Ø ${selectedDiameter}` : ''}
                  </button>
                </div>
              ) : (
                <div className="item-cards-grid">
                  {filteredRows.map((r, i) => (
                    <ItemCard
                      key={r.id}
                      row={r}
                      index={i}
                      onUpdate={updated => {
                        const newRows = rows.map(item =>
                          item.id === r.id ? { ...item, ...updated } : item
                        );
                        onChangeRows(newRows);
                      }}
                      onDelete={() => handleDeleteRow(r.id)}
                      onValidateField={(field, val) => handleCellBlur(r.id, field, val)}
                    />
                  ))}
                </div>
              )}

              <div className="table-bottom-actions">
                <button
                  className="btn primary"
                  type="button"
                  onClick={() =>
                    handleAddRow({
                      diameter: selectedDiameter !== 'all' ? String(selectedDiameter) : '',
                    })
                  }
                >
                  ＋ Aggiungi Riga
                </button>
              </div>
            </div>
          ) : (
            /* Table View */
            <>
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
                    {filteredRows.map((r, i) => {
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
                <button
                  className="btn primary small"
                  type="button"
                  onClick={() =>
                    handleAddRow({
                      diameter: selectedDiameter !== 'all' ? String(selectedDiameter) : '',
                    })
                  }
                >
                  ＋ Aggiungi Riga
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
