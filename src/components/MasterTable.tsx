import React, { useState, useRef, useEffect } from 'react';
import { MasterRow } from '../types';
import {
  blankMaster,
  fmt,
  inputNumber,
  newId,
  unitWeight,
  validDiameter,
} from '../utils/math';
import { DiameterFilter } from './DiameterFilter';
import { ConfirmModal } from './ConfirmModal';

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

interface DuplicateCandidate {
  sourceRowId: string;
  targetRowId: string;
  addQty: number;
}

interface DeletedRowRecord {
  row: MasterRow;
  index: number;
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
  const [selectedDiameter, setSelectedDiameter] = useState<number | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus management per immissione fluida con Invio
  const nextFocusRowIdRef = useRef<string | null>(null);

  // Memorizzazione valore precedente per ripristino in caso di diametro errato
  const cellPreviousValuesRef = useRef<Record<string, string>>({});

  // Stato per i modali in-app
  const [invalidDiaModalOpen, setInvalidDiaModalOpen] = useState(false);
  const [clearTableModalOpen, setClearTableModalOpen] = useState(false);
  const [duplicateCandidate, setDuplicateCandidate] = useState<DuplicateCandidate | null>(null);

  // Undo eliminazione riga
  const [deletedRecord, setDeletedRecord] = useState<DeletedRowRecord | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  // Auto-focus sulla nuova riga appena aggiunta
  useEffect(() => {
    if (nextFocusRowIdRef.current) {
      const targetInput = document.querySelector<HTMLInputElement>(
        `input[data-row-id="${nextFocusRowIdRef.current}"][data-field="diameter"]`
      );
      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
      nextFocusRowIdRef.current = null;
    }
  }, [rows]);

  // Calcolo statistiche dinamiche (totali o per il diametro selezionato)
  const isFiltered = selectedDiameter !== 'all';
  const effectiveRows = rows.filter(r => {
    if (!isFiltered) return true;
    return inputNumber(r.diameter) === selectedDiameter;
  });

  let statsMeters = 0;
  let statsWeight = 0;
  let statsPieces = 0;

  for (const r of effectiveRows) {
    const q = inputNumber(r.qty);
    const l = inputNumber(r.length);
    const d = inputNumber(r.diameter);
    if (validDiameter(d) && q && l && q > 0 && l > 0) {
      const m = (q * l) / 100;
      statsMeters += m;
      statsPieces += q;
      statsWeight += m * unitWeight(d!);
    }
  }

  // Gestione modifiche cella
  const handleCellChange = (id: string, field: 'diameter' | 'qty' | 'length', val: string) => {
    const updated = rows.map(r => (r.id === id ? { ...r, [field]: val } : r));
    onChangeRows(updated);
  };

  const handleCellFocus = (id: string, field: 'diameter' | 'qty' | 'length', currentVal: string) => {
    cellPreviousValuesRef.current[`${id}_${field}`] = currentVal;
  };

  const handleCellBlur = (id: string, field: 'diameter' | 'qty' | 'length', rawVal: string) => {
    const trimmed = rawVal.trim();
    const prevVal = cellPreviousValuesRef.current[`${id}_${field}`] || '';

    if (trimmed === '') return;

    const value = inputNumber(trimmed);

    if (field === 'diameter') {
      if (!validDiameter(value)) {
        // Ripristina il valore precedente (non cancellarlo!) e mostra finestra modale
        const updated = rows.map(r => (r.id === id ? { ...r, diameter: prevVal } : r));
        onChangeRows(updated);
        setInvalidDiaModalOpen(true);
        return;
      }
    } else if (field === 'qty') {
      if (!Number.isInteger(value) || value! < 1 || value! > 10000) {
        const updated = rows.map(r => (r.id === id ? { ...r, qty: prevVal } : r));
        onChangeRows(updated);
        onToast('Quantità non valida: inserire un intero positivo da 1 a 10.000.');
        return;
      }
    } else if (field === 'length') {
      if (!Number.isInteger(value) || value! < 1 || value! > 1200) {
        const updated = rows.map(r => (r.id === id ? { ...r, length: prevVal } : r));
        onChangeRows(updated);
        onToast('Lunghezza non valida: inserire un intero in cm da 1 a 1.200.');
        return;
      }
    }

    // Normalizza valore
    const normalized = String(value);
    const updated = rows.map(r => (r.id === id ? { ...r, [field]: normalized } : r));
    onChangeRows(updated);

    // Controlla se la riga completata è un duplicato di un'altra riga esistente
    checkDuplicates(id, updated);
  };

  // Controllo duplicati (diametro + lunghezza già presenti in tabella)
  const checkDuplicates = (currentId: string, currentRows: MasterRow[]) => {
    const currentRow = currentRows.find(r => r.id === currentId);
    if (!currentRow) return;

    const curD = inputNumber(currentRow.diameter);
    const curL = inputNumber(currentRow.length);
    const curQ = inputNumber(currentRow.qty);

    if (!validDiameter(curD) || !curL || curL <= 0 || !curQ || curQ <= 0) {
      return;
    }

    // Cerca un'altra riga con stesso diametro e stessa lunghezza
    const existingRow = currentRows.find(
      r =>
        r.id !== currentId &&
        inputNumber(r.diameter) === curD &&
        inputNumber(r.length) === curL &&
        inputNumber(r.qty) !== null &&
        inputNumber(r.qty)! > 0
    );

    if (existingRow) {
      setDuplicateCandidate({
        sourceRowId: currentId,
        targetRowId: existingRow.id,
        addQty: curQ,
      });
    }
  };

  const handleConfirmMergeDuplicate = () => {
    if (!duplicateCandidate) return;
    const { sourceRowId, targetRowId, addQty } = duplicateCandidate;

    const updated = rows
      .map(r => {
        if (r.id === targetRowId) {
          const oldQ = inputNumber(r.qty) || 0;
          return { ...r, qty: String(oldQ + addQty) };
        }
        return r;
      })
      .filter(r => r.id !== sourceRowId);

    onChangeRows(updated.length > 0 ? updated : [blankMaster()]);
    setDuplicateCandidate(null);
    onToast(`Quantità aggiunta all'elemento esistente.`);
  };

  const handleCancelMergeDuplicate = () => {
    setDuplicateCandidate(null);
  };

  // Navigazione fluida con tasto Invio
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    field: 'diameter' | 'qty' | 'length',
    rowId: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Forza blur per triggerare validazione e salvataggio
      (e.target as HTMLInputElement).blur();

      if (field === 'diameter') {
        const nextInput = document.querySelector<HTMLInputElement>(
          `input[data-row-id="${rowId}"][data-field="qty"]`
        );
        nextInput?.focus();
        nextInput?.select();
      } else if (field === 'qty') {
        const nextInput = document.querySelector<HTMLInputElement>(
          `input[data-row-id="${rowId}"][data-field="length"]`
        );
        nextInput?.focus();
        nextInput?.select();
      } else if (field === 'length') {
        // Ultima cella della riga: passa alla prima cella della riga successiva
        const nextRow = effectiveRows[rowIndex + 1];
        if (nextRow) {
          const nextDiaInput = document.querySelector<HTMLInputElement>(
            `input[data-row-id="${nextRow.id}"][data-field="diameter"]`
          );
          nextDiaInput?.focus();
          nextDiaInput?.select();
        } else {
          // Aggiunge automaticamente una nuova riga e passa il focus
          const newRowId = newId();
          nextFocusRowIdRef.current = newRowId;
          const newRow: MasterRow = {
            id: newRowId,
            diameter: selectedDiameter !== 'all' ? String(selectedDiameter) : '',
            qty: '',
            length: '',
          };
          onChangeRows([...rows, newRow]);
        }
      }
    }
  };

  const handleAddRow = () => {
    const newRowId = newId();
    nextFocusRowIdRef.current = newRowId;
    const newRow: MasterRow = {
      id: newRowId,
      diameter: selectedDiameter !== 'all' ? String(selectedDiameter) : '',
      qty: '',
      length: '',
    };
    onChangeRows([...rows, newRow]);
  };

  // Rimozione record con popup e Annulla
  const handleDeleteRow = (id: string, index: number) => {
    const rowToDelete = rows.find(r => r.id === id);
    if (!rowToDelete) return;

    const isEmpty =
      !rowToDelete.diameter.trim() &&
      !rowToDelete.qty.trim() &&
      !rowToDelete.length.trim();

    const updated = rows.filter(r => r.id !== id);
    onChangeRows(updated.length > 0 ? updated : [blankMaster()]);

    if (!isEmpty) {
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
      setDeletedRecord({ row: rowToDelete, index });
      undoTimerRef.current = window.setTimeout(() => {
        setDeletedRecord(null);
      }, 6000);
    }
  };

  const handleUndoDelete = () => {
    if (!deletedRecord) return;
    const newRows = [...rows];
    // Inserisce di nuovo alla posizione memorizzata o alla fine
    const insertIdx = Math.min(deletedRecord.index, newRows.length);
    newRows.splice(insertIdx, 0, deletedRecord.row);
    onChangeRows(newRows);
    setDeletedRecord(null);
    onToast('Riga ripristinata.');
  };

  // Svuota tabella con modale personalizzato
  const handleConfirmClearTable = () => {
    onChangeRows([blankMaster()]);
    setClearTableModalOpen(false);
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
      {/* Intestazione pagina */}
      <div className="section-head master-page-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {/* Pulsanti Importa ed Esporta XLS sulla stessa riga */}
        <div className="heading-actions-row">
          <button
            className="btn neutral"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Importa XLS
          </button>
          <button
            className="btn neutral"
            type="button"
            onClick={onExportXls}
          >
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

      {/* Filtro rapido Diametri (mostra solo i diametri presenti) */}
      <DiameterFilter
        rows={rows}
        selectedDiameter={selectedDiameter}
        onSelectDiameter={setSelectedDiameter}
      />

      {/* Widget Totali dinamici posizionati tra il filtro e l'elenco */}
      <div className="calc-total totals-between-filter">
        <div className="summary-box">
          <div className="s-label">
            {isFiltered
              ? `SVILUPPO BARRE Ø ${selectedDiameter}`
              : 'SVILUPPO COMPLESSIVO'}
          </div>
          <div className="s-value">
            {fmt(statsMeters)}
            <span className="s-unit">m</span>
          </div>
          <div className="s-sub">
            {isFiltered ? `${statsPieces} pezzi` : `${statsPieces} pezzi totali`}
          </div>
        </div>

        <div className="summary-box">
          <div className="s-label">PESO TOTALE</div>
          <div className="s-value">
            {fmt(statsWeight)}
            <span className="s-unit">kg</span>
          </div>
          <div className="s-sub">Acciaio B450C</div>
        </div>
      </div>

      {/* Pannello Principale Tabella */}
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title-group">
            <h3>{kind === 'stockDetail' ? 'Elenco Giacenza' : 'Elenco Richiesta'}</h3>
            {isFiltered && (
              <span className="active-filter-badge">
                Filtrato: Ø {selectedDiameter} mm ({effectiveRows.length})
              </span>
            )}
          </div>
          <div className="panel-head-actions">
            {/* Tasto Ordina più largo e font leggermente più grande */}
            <button
              className="btn btn-sort-wide"
              type="button"
              onClick={onOpenSort}
            >
              Ordina
            </button>
          </div>
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
                    {/* Pulsante X per svuotare con dialog personalizzato */}
                    <button
                      className="header-clear"
                      type="button"
                      onClick={() => setClearTableModalOpen(true)}
                      aria-label="Svuota tabella"
                      title="Svuota tabella"
                    >
                      ×
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {effectiveRows.map((r, i) => {
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
                      ? ((q! * l!) / 100) * unitWeight(d!)
                      : 0;

                  return (
                    <tr key={r.id}>
                      <td>
                        <input
                          className="cell-input"
                          type="number"
                          min="6"
                          max="40"
                          step="2"
                          inputMode="numeric"
                          data-row-id={r.id}
                          data-field="diameter"
                          aria-label={`Diametro riga ${i + 1}`}
                          value={r.diameter}
                          placeholder="Ø"
                          onClick={e => e.currentTarget.select()}
                          onFocus={e => {
                            e.currentTarget.select();
                            handleCellFocus(r.id, 'diameter', e.target.value);
                          }}
                          onChange={e => handleCellChange(r.id, 'diameter', e.target.value)}
                          onBlur={e => handleCellBlur(r.id, 'diameter', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, i, 'diameter', r.id)}
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
                          data-row-id={r.id}
                          data-field="qty"
                          aria-label={`Numero riga ${i + 1}`}
                          value={r.qty}
                          placeholder="Nr."
                          onClick={e => e.currentTarget.select()}
                          onFocus={e => {
                            e.currentTarget.select();
                            handleCellFocus(r.id, 'qty', e.target.value);
                          }}
                          onChange={e => handleCellChange(r.id, 'qty', e.target.value)}
                          onBlur={e => handleCellBlur(r.id, 'qty', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, i, 'qty', r.id)}
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
                          data-row-id={r.id}
                          data-field="length"
                          aria-label={`Lunghezza in centimetri riga ${i + 1}`}
                          value={r.length}
                          placeholder="cm"
                          onClick={e => e.currentTarget.select()}
                          onFocus={e => {
                            e.currentTarget.select();
                            handleCellFocus(r.id, 'length', e.target.value);
                          }}
                          onChange={e => handleCellChange(r.id, 'length', e.target.value)}
                          onBlur={e => handleCellBlur(r.id, 'length', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, i, 'length', r.id)}
                        />
                      </td>
                      <td className="weight-cell">
                        <span>{rowWeight > 0 ? fmt(rowWeight) : '—'}</span>
                      </td>
                      <td className="action-cell">
                        <button
                          className="icon-btn"
                          type="button"
                          onClick={() => handleDeleteRow(r.id, i)}
                          aria-label={`Elimina riga ${i + 1}`}
                          title="Elimina riga"
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
              onClick={handleAddRow}
            >
              ＋ Aggiungi Riga
            </button>
          </div>
        </div>
      </div>

      {/* Toast con Annulla (Undo) per eliminazione riga */}
      {deletedRecord && (
        <div className="undo-delete-toast" role="alert">
          <span className="undo-toast-text">
            Rimosso:{' '}
            <strong>
              Ø {deletedRecord.row.diameter || '?'} - L:{' '}
              {deletedRecord.row.length || '?'} cm ({deletedRecord.row.qty || '?'} pz)
            </strong>
          </span>
          <button
            type="button"
            className="undo-btn"
            onClick={handleUndoDelete}
            title="Annulla eliminazione"
          >
            <span className="undo-icon">↶</span> Annulla
          </button>
        </div>
      )}

      {/* Modale Diametro Non Valido */}
      <ConfirmModal
        isOpen={invalidDiaModalOpen}
        title="Diametro non valido"
        message="Sono ammessi solo numeri pari da 6 a 40."
        confirmText="OK"
        showCancel={false}
        onConfirm={() => setInvalidDiaModalOpen(false)}
      />

      {/* Modale Svuota Tabella */}
      <ConfirmModal
        isOpen={clearTableModalOpen}
        title="Svuota tabella"
        message="Gli elementi della tabella stanno per essere eliminati definitivamente. Continuare?"
        confirmText="Elimina tutti"
        cancelText="Annulla"
        confirmStyle="danger"
        onConfirm={handleConfirmClearTable}
        onCancel={() => setClearTableModalOpen(false)}
      />

      {/* Modale Duplicato: Aggiungere alla quantità esistente? */}
      <ConfirmModal
        isOpen={duplicateCandidate !== null}
        title="Elemento già presente in tabella"
        message="Elemento già presente in tabella: aggiungere alla quantità esistente?"
        isDuplicatePrompt={true}
        onConfirm={handleConfirmMergeDuplicate}
        onCancel={handleCancelMergeDuplicate}
      />
    </section>
  );
};
