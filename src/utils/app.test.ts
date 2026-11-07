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
