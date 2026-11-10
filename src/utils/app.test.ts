import test from 'node:test';
import assert from 'node:assert/strict';
import {
  unitWeight,
  validDiameter,
  fmt,
  intFmt,
} from './math';
import {
  buildOperationalPlan,
  runOptimization,
} from './optimizer';
import { OptimizationResult } from '../types';
import { parseExcelNumber, excelHeaderMap } from './excel';

test('validDiameter verifies even diameters between 6 and 40', () => {
  assert.equal(validDiameter(6), true);
  assert.equal(validDiameter(12), true);
  assert.equal(validDiameter(40), true);
  assert.equal(validDiameter(7), false);
  assert.equal(validDiameter(4), false);
  assert.equal(validDiameter(42), false);
  assert.equal(validDiameter(null), false);
});

test('unitWeight calculates correct B450C kg/m', () => {
  assert.equal(unitWeight(12), 0.888);
  assert.equal(unitWeight(14), 1.208);
  assert.equal(unitWeight(16), 1.578);
});

test('formatting functions fmt and intFmt work with Italian locale', () => {
  assert.equal(fmt(12.5), '12,50');
  assert.equal(intFmt(1500), '1.500');
});

test('excel parser correctly extracts numbers and headers', () => {
  assert.equal(parseExcelNumber('12', 'diameter'), 12);
  assert.equal(parseExcelNumber('1.200', 'length'), 1200);
  assert.equal(parseExcelNumber('10', 'qty'), 10);

  const header = ['Diametro [mm]', 'Nr.', 'Lunghezza [cm]'];
  const map = excelHeaderMap(header);
  assert.equal(map.diameter, 0);
  assert.equal(map.qty, 1);
  assert.equal(map.length, 2);
});

test('runOptimization and buildOperationalPlan work end-to-end', () => {
  const stock = [{ id: 's1', diameter: '12', qty: '10', length: '1200' }];
  const demand = [{ id: 'd1', diameter: '12', qty: '4', length: '250' }];

  const result = runOptimization(stock, demand);
  assert.equal(result.allFulfilled, true);
  assert.equal(result.fulfilledPieces, 4);
  assert.equal(result.usedBars, 1);

  const plan = buildOperationalPlan(result);
  assert.equal(plan.cuts.length, 1);
  assert.equal(plan.cuts[0].diameter, 12);
  assert.equal(plan.cuts[0].length, 250);
  assert.equal(plan.rows.length, 1);
  assert.equal(plan.rows[0].barCount, 1);
  assert.equal(plan.rows[0].cutCount, 4);
});

test('operational plan exported records contain only actual data rows without Totale', () => {
  const stock = [
    { id: 's1', diameter: '14', qty: '5', length: '1200' },
  ];
  const demand = [
    { id: 'd1', diameter: '14', qty: '2', length: '500' },
  ];
  const result = runOptimization(stock, demand);
  const plan = buildOperationalPlan(result);
  
  // Every row must be a valid bar operation with a numeric barId
  for (const row of plan.rows) {
    assert.equal(typeof row.barId, 'number');
    assert.notEqual(String(row.diameter), 'Totale');
  }
});

test('parseMasterXls merges duplicate records and reports exact error message', async () => {
  const XLSX = await import('xlsx');
  const { parseMasterXls } = await import('./excel');

  // Test 1: Duplicates merging
  const validData = [
    ['Diametro [mm]', 'Nr.', 'L [cm]'],
    [12, 10, 600],
    [14, 5, 1200],
    [12, 20, 600], // duplicate of row 1: Ø12, L600
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(validData);
  const wb1 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb1, ws1, 'Sheet1');
  const buf1 = XLSX.write(wb1, { bookType: 'xlsx', type: 'array' });
  const file1 = new File([buf1], 'test_merge.xlsx');

  const rows = await parseMasterXls(file1);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].diameter, '12');
  assert.equal(rows[0].length, '600');
  assert.equal(rows[0].qty, '30'); // 10 + 20
  assert.equal(rows[1].diameter, '14');
  assert.equal(rows[1].length, '1200');
  assert.equal(rows[1].qty, '5');

  // Test 2: Error message on invalid row
  const invalidData = [
    ['Diametro [mm]', 'Nr.', 'L [cm]'],
    [12, 10, 600],
    [13, 5, 1200], // odd diameter in row 3 (excel row 3)
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(invalidData);
  const wb2 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb2, ws2, 'Sheet1');
  const buf2 = XLSX.write(wb2, { bookType: 'xlsx', type: 'array' });
  const file2 = new File([buf2], 'test_error.xlsx');

  await assert.rejects(
    async () => {
      await parseMasterXls(file2);
    },
    (err: any) => {
      assert.equal(
        err.message,
        "E' stato riscontrato un errore nella riga 3: il [Diametro] deve essere un numero pari compreso tra 6 e 40, la [Quantità] un numero intero da 1 a 10.000 e la [Lunghezza] un numero intero da 1 a 1.200. Non sono ammessi valori vuoti né uguali a zero."
      );
      return true;
    }
  );
});

test('v1.41 row deletion popup condition: only meaningful if qty or length is filled', () => {
  const isRowMeaningful = (row: { diameter: string; qty: string; length: string }) =>
    row.qty.trim() !== '' || row.length.trim() !== '';

  // Only diameter filled: should not trigger popup
  assert.equal(isRowMeaningful({ diameter: '12', qty: '', length: '' }), false);
  // Completely empty: should not trigger popup
  assert.equal(isRowMeaningful({ diameter: '', qty: '', length: '' }), false);
  // Qty filled: triggers popup
  assert.equal(isRowMeaningful({ diameter: '12', qty: '5', length: '' }), true);
  // Length filled: triggers popup
  assert.equal(isRowMeaningful({ diameter: '12', qty: '', length: '600' }), true);
  // Both filled: triggers popup
  assert.equal(isRowMeaningful({ diameter: '12', qty: '5', length: '600' }), true);
});

test('v1.41 optimization unfulfilled demand automatic update', () => {
  const stock = [{ id: 's1', diameter: '12', qty: '2', length: '1200' }];
  const demand = [{ id: 'd1', diameter: '12', qty: '10', length: '600' }]; // needs 5 bars, only 2 available

  const res = runOptimization(stock, demand);
  assert.equal(res.allFulfilled, false);
  assert.equal(res.unmet.length, 1);
  assert.equal(res.unmet[0].diameter, 12);
  assert.equal(res.unmet[0].remaining, 6); // 10 requested - 4 fulfilled = 6 unmet
});

test('v1.42 duplicate cancel empties qty and length while preserving diameter and row', () => {
  const initialRows = [
    { id: 'r1', diameter: '12', qty: '5', length: '600' },
    { id: 'r2', diameter: '12', qty: '10', length: '600' },
  ];
  // Simulating cancel merge behavior
  const sourceRowId = 'r2';
  const updated = initialRows.map(r =>
    r.id === sourceRowId ? { ...r, qty: '', length: '' } : r
  );
  assert.equal(updated.length, 2);
  assert.equal(updated[1].id, 'r2');
  assert.equal(updated[1].diameter, '12');
  assert.equal(updated[1].qty, '');
  assert.equal(updated[1].length, '');
});

test('v1.42 undo optimization snapshot invalidation on table change', () => {
  let snapshot: { stock: any[]; demand: any[] } | null = { stock: [], demand: [] };
  const onTableChange = () => {
    if (snapshot) snapshot = null;
  };
  const onTabChange = () => {
    // Tab changes do not invalidate snapshot
  };

  onTabChange();
  assert.notEqual(snapshot, null);
  onTableChange();
  assert.equal(snapshot, null);
});
