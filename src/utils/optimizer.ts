import {
  MasterRow,
  OptimizationResult,
  OperationalCut,
  OperationalRow,
  Pattern,
  PieceTotal,
  RemainingStockItem,
  ScrapItem,
  UnmetItem,
  UsedBarItem,
} from '../types';
import {
  inputNumber,
  round2,
  unitWeight,
  validDiameter,
  resultKey,
} from './math';

interface InputItem {
  diameter: number;
  units: number;
  qty: number;
  remaining: number;
  length: number;
}

interface PatternCandidate {
  source: 'stock' | 'scrap';
  units: number;
  qty: number;
  entry?: { diameter: number; units: number; qty: number; remaining: number };
  pattern: {
    usedUnits: number;
    scrapUnits: number;
    counts: number[];
    pieceCount: number;
  };
}

export function validateInputRows(rows: MasterRow[], label: string): InputItem[] {
  const map = new Map<string, InputItem>();
  rows.forEach((r, index) => {
    const dText = String(r.diameter ?? '').trim();
    const qText = String(r.qty ?? '').trim();
    const lText = String(r.length ?? '').trim();
    if (!dText && !qText && !lText) return;

    const d = inputNumber(dText);
    const q = inputNumber(qText);
    const l = inputNumber(lText);

    if (
      !validDiameter(d) ||
      !Number.isInteger(q) ||
      q! < 1 ||
      q! > 10000 ||
      !Number.isInteger(l) ||
      l! < 1 ||
      l! > 1200
    ) {
      throw new Error(
        `${label}: completa la riga ${index + 1} con un diametro pari, da 6 a 40 mm, un numero intero positivo di barre/pezzi da 1 a 10.000 e una lunghezza intera in cm (da 1 a 1.200).`
      );
    }

    const key = `${d}|${l}`;
    if (!map.has(key)) {
      map.set(key, { diameter: d!, units: l!, qty: 0, remaining: 0, length: l! });
    }
    const item = map.get(key)!;
    item.qty += q!;
    item.remaining += q!;
  });
  return Array.from(map.values()).sort((a, b) => a.diameter - b.diameter || b.units - a.units);
}

function buildReachability(maxUnits: number, demand: InputItem[]) {
  const reachable = new Uint8Array(maxUnits + 1);
  reachable[0] = 1;
  const prevSum = new Int32Array(maxUnits + 1);
  prevSum.fill(-1);
  const prevItem = new Int32Array(maxUnits + 1);
  prevItem.fill(-1);
  const prevTake = new Int32Array(maxUnits + 1);

  for (let i = 0; i < demand.length; i++) {
    const item = demand[i];
    let qty = Math.min(item.remaining, Math.floor(maxUnits / item.units));
    let pack = 1;
    while (qty > 0) {
      const take = Math.min(pack, qty);
      const weight = take * item.units;
      qty -= take;
      pack *= 2;
      if (weight > maxUnits) continue;
      for (let s = maxUnits; s >= weight; s--) {
        if (!reachable[s] && reachable[s - weight]) {
          reachable[s] = 1;
          prevSum[s] = s - weight;
          prevItem[s] = i;
          prevTake[s] = take;
        }
      }
    }
  }
  return { reachable, prevSum, prevItem, prevTake };
}

function patternAtCapacity(
  capacity: number,
  dp: ReturnType<typeof buildReachability>,
  workingDemand: InputItem[]
) {
  let used = Math.min(capacity, dp.reachable.length - 1);
  while (used > 0 && !dp.reachable[used]) used--;
  if (used <= 0) return null;

  const counts = new Int32Array(workingDemand.length);
  let s = used;
  let guard = 0;
  while (s > 0 && guard++ < workingDemand.length * 32 + 2000) {
    const item = dp.prevItem[s];
    const take = dp.prevTake[s];
    const prior = dp.prevSum[s];
    if (item < 0 || take <= 0 || prior < 0) {
      throw new Error('Errore interno nella ricostruzione del piano di taglio.');
    }
    counts[item] += take;
    s = prior;
  }
  if (s !== 0) throw new Error('Il piano di taglio non è stato ricostruito correttamente.');
  return {
    usedUnits: used,
    scrapUnits: capacity - used,
    counts: Array.from(counts),
    pieceCount: counts.reduce((a, b) => a + b, 0),
  };
}

function chooseBetter(
  a: PatternCandidate | null,
  b: PatternCandidate | null
): PatternCandidate | null {
  if (!a) return b;
  if (!b) return a;
  // Priorità 1: minor sfrido della singola combinazione.
  if (b.pattern.scrapUnits !== a.pattern.scrapUnits) {
    return b.pattern.scrapUnits < a.pattern.scrapUnits ? b : a;
  }
  // Priorità 2: evadere più pezzi con la barra scelta.
  if (b.pattern.pieceCount !== a.pattern.pieceCount) {
    return b.pattern.pieceCount > a.pattern.pieceCount ? b : a;
  }
  // Priorità 3: preferire lo schema che copre più centimetri di Richiesta.
  if (b.pattern.usedUnits !== a.pattern.usedUnits) {
    return b.pattern.usedUnits > a.pattern.usedUnits ? b : a;
  }
  // Ultimo spareggio: conservare la barra più corta quando il materiale tagliato è uguale.
  if (b.units !== a.units) return b.units < a.units ? b : a;
  if (b.source !== a.source) return b.source === 'scrap' ? b : a;
  return a;
}

export function runOptimizationSingle(
  stockRows: InputItem[],
  demandRows: InputItem[],
  diameter: number
): OptimizationResult {
  const initialStock = stockRows.map(s => ({ ...s, remaining: s.qty }));
  const demand = demandRows.map(d => ({ ...d, remaining: d.qty }));
  if (!demand.length) {
    throw new Error(`La Richiesta per il diametro ${diameter} mm non contiene righe valide.`);
  }

  const requestedPieces = demand.reduce((sum, d) => sum + d.qty, 0);
  const initialDemand = demand.map(d => ({
    diameter: Number(diameter),
    units: d.units,
    length: d.length,
    qty: d.qty,
    remaining: d.qty,
  }));

  if (!initialStock.length) {
    const pieceTotals: PieceTotal[] = demand.map(d => ({
      diameter: Number(diameter),
      length: d.length,
      units: d.units,
      requested: d.qty,
      fulfilled: 0,
      remaining: d.qty,
    }));
    return {
      diameter: Number(diameter),
      patterns: [],
      requestedPieces,
      fulfilledPieces: 0,
      unmet: pieceTotals.filter(d => d.remaining > 0).map(d => ({ ...d, selected: false, added: false })),
      usedBars: 0,
      usedMeters: 0,
      scrapMeters: 0,
      netMeters: 0,
      scrapPct: 0,
      usedByLength: [],
      scraps: [],
      remainingStock: [],
      pieceTotals,
      initialDemand,
      allFulfilled: false,
      stockUpdated: false,
      processedDiameters: [],
    };
  }

  const inventory = initialStock.map(s => ({
    diameter: Number(diameter),
    units: s.units,
    qty: s.qty,
    remaining: s.qty,
  }));

  const barRecords: Array<{
    barUnits: number;
    counts: Int32Array;
    currentScrapUnits: number;
  }> = [];

  let loops = 0;
  const maxIterations = Math.min(100000, Math.max(2000, requestedPieces * 2 + demand.length * 20));

  while (demand.some(d => d.remaining > 0)) {
    if (++loops > maxIterations) {
      throw new Error('Il calcolo ha raggiunto il limite di sicurezza. Verifica le quantità e le lunghezze inserite.');
    }
    const stockCandidates = inventory
      .filter(s => s.remaining > 0)
      .map(s => ({ source: 'stock' as const, units: s.units, qty: s.remaining, entry: s }));

    const scrapQty = new Map<number, number>();
    for (const b of barRecords) {
      if (b.currentScrapUnits > 0) {
        scrapQty.set(b.currentScrapUnits, (scrapQty.get(b.currentScrapUnits) || 0) + 1);
      }
    }
    const scrapCandidates = Array.from(scrapQty, ([units, qty]) => ({
      source: 'scrap' as const,
      units,
      qty,
    }));

    const candidates = [...stockCandidates, ...scrapCandidates];
    if (!candidates.length) break;

    const maxUnits = Math.max(...candidates.map(c => c.units));
    const dp = buildReachability(maxUnits, demand);
    const cache = new Map<number, ReturnType<typeof patternAtCapacity>>();
    let best: PatternCandidate | null = null;

    for (const c of candidates) {
      let p = cache.get(c.units);
      if (p === undefined) {
        p = patternAtCapacity(c.units, dp, demand);
        cache.set(c.units, p);
      }
      if (!p) continue;
      best = chooseBetter(best, { ...c, pattern: p });
    }

    if (!best) break;

    let batch = best.qty;
    for (let i = 0; i < best.pattern.counts.length; i++) {
      const count = best.pattern.counts[i];
      if (count > 0) {
        batch = Math.min(batch, Math.floor(demand[i].remaining / count));
      }
    }
    batch = Math.floor(batch);
    if (batch < 1) {
      throw new Error('Il motore non è riuscito a determinare una quantità valida di barre da tagliare.');
    }

    const p = best.pattern;
    if (best.source === 'stock') {
      best.entry!.remaining -= batch;
      for (let j = 0; j < batch; j++) {
        const counts = new Int32Array(demand.length);
        for (let i = 0; i < counts.length; i++) counts[i] = p.counts[i];
        barRecords.push({
          barUnits: best.units,
          counts,
          currentScrapUnits: p.scrapUnits,
        });
      }
    } else {
      let remainingToCut = batch;
      for (const record of barRecords) {
        if (remainingToCut <= 0) break;
        if (record.currentScrapUnits !== best.units) continue;
        for (let i = 0; i < record.counts.length; i++) record.counts[i] += p.counts[i];
        record.currentScrapUnits = p.scrapUnits;
        remainingToCut--;
      }
      if (remainingToCut !== 0) {
        throw new Error('Errore interno durante il riutilizzo degli sfridi.');
      }
    }

    for (let i = 0; i < demand.length; i++) {
      if (p.counts[i] > 0) demand[i].remaining -= p.counts[i] * batch;
    }
  }

  const fulfilledPieces = demand.reduce((sum, d) => sum + (d.qty - d.remaining), 0);
  const pieceTotals: PieceTotal[] = demand.map(d => ({
    diameter: Number(diameter),
    length: d.length,
    units: d.units,
    requested: d.qty,
    fulfilled: d.qty - d.remaining,
    remaining: d.remaining,
  }));

  const usedByLength = new Map<number, number>();
  for (const b of barRecords) {
    const key = b.barUnits;
    usedByLength.set(key, (usedByLength.get(key) || 0) + 1);
  }

  const remainingStock: RemainingStockItem[] = inventory
    .filter(s => s.remaining > 0)
    .map(s => ({
      diameter: Number(diameter),
      units: s.units,
      length: s.units,
      qty: s.remaining,
      selected: false,
      applied: false,
    }))
    .sort((a, b) => b.units - a.units);

  const scrapsMap = new Map<number, number>();
  for (const b of barRecords) {
    if (b.currentScrapUnits > 0) {
      scrapsMap.set(b.currentScrapUnits, (scrapsMap.get(b.currentScrapUnits) || 0) + 1);
    }
  }

  const patterns: Pattern[] = barRecords.map((b, index) => ({
    id: index + 1,
    diameter: Number(diameter),
    barUnits: b.barUnits,
    barLength: b.barUnits / 100,
    barCount: 1,
    scrapUnits: b.currentScrapUnits,
    scrapLength: b.currentScrapUnits / 100,
    counts: Array.from(b.counts),
  }));

  const usedBars = barRecords.length;
  const usedUnits = barRecords.reduce((sum, b) => sum + b.barUnits, 0);
  const scrapUnits = barRecords.reduce((sum, b) => sum + b.currentScrapUnits, 0);
  const pieceLengthUnits = pieceTotals.reduce((sum, d) => sum + d.units * d.fulfilled, 0);

  const usedMeters = usedUnits / 100;
  const scrapMeters = scrapUnits / 100;
  const netMeters = pieceLengthUnits / 100;

  const usedByLengthRows: UsedBarItem[] = Array.from(usedByLength, ([units, qty]) => ({
    diameter: Number(diameter),
    units,
    length: units,
    qty,
    weight: qty * (units / 100) * unitWeight(diameter),
  })).sort((a, b) => b.units - a.units);

  return {
    diameter: Number(diameter),
    patterns,
    requestedPieces,
    fulfilledPieces,
    unmet: pieceTotals.filter(d => d.remaining > 0).map(d => ({ ...d, selected: false, added: false })),
    usedBars,
    usedMeters,
    scrapMeters,
    netMeters,
    scrapPct: usedMeters > 0 ? (scrapMeters / usedMeters) * 100 : 0,
    usedByLength: usedByLengthRows,
    scraps: Array.from(scrapsMap, ([units, qty]) => ({
      diameter: Number(diameter),
      units,
      length: units,
      qty,
      selected: false,
      added: false,
    })).sort((a, b) => b.units - a.units),
    remainingStock,
    pieceTotals,
    initialDemand,
    allFulfilled: fulfilledPieces === requestedPieces,
    stockUpdated: false,
    processedDiameters: [Number(diameter)],
  };
}

export function runOptimization(
  stockRows: MasterRow[],
  demandRows: MasterRow[]
): OptimizationResult {
  const stock = validateInputRows(stockRows, 'Giacenza');
  const demand = validateInputRows(demandRows, 'Richiesta');

  if (!stock.length) {
    throw new Error('La tabella Giacenza è vuota o non contiene righe valide. Inserisci i record validi nella schermata Giacenza.');
  }
  if (!demand.length) {
    throw new Error('La tabella Richiesta è vuota o non contiene righe valide. Inserisci i record validi nella schermata Richiesta.');
  }

  const diameters = Array.from(new Set(demand.map(d => d.diameter))).sort((a, b) => a - b);
  const partial = diameters.map(dia =>
    runOptimizationSingle(
      stock.filter(x => x.diameter === dia),
      demand.filter(x => x.diameter === dia),
      dia
    )
  );

  const pieceTotals = partial.flatMap(x => x.pieceTotals).sort((a, b) => a.diameter - b.diameter || b.length - a.length);
  const globalIndex = new Map(pieceTotals.map((x, i) => [resultKey(x.diameter, x.length), i]));

  const patterns: Pattern[] = [];
  for (const sub of partial) {
    const local = sub.pieceTotals;
    for (const p of sub.patterns) {
      const counts = Array(pieceTotals.length).fill(0);
      local.forEach((item, i) => {
        counts[globalIndex.get(resultKey(item.diameter, item.length))!] = p.counts[i] || 0;
      });
      patterns.push({ ...p, counts });
    }
  }

  const unmet: UnmetItem[] = partial.flatMap(x => x.unmet);
  const initialDemand = partial.flatMap(x => x.initialDemand);
  const usedByLength = partial.flatMap(x => x.usedByLength);
  const remainingStock = partial.flatMap(x => x.remainingStock);
  const scraps: ScrapItem[] = partial.flatMap(x => x.scraps);

  const requestedPieces = partial.reduce((a, x) => a + x.requestedPieces, 0);
  const fulfilledPieces = partial.reduce((a, x) => a + x.fulfilledPieces, 0);
  const usedBars = partial.reduce((a, x) => a + x.usedBars, 0);
  const usedMeters = partial.reduce((a, x) => a + x.usedMeters, 0);
  const scrapMeters = partial.reduce((a, x) => a + x.scrapMeters, 0);
  const netMeters = partial.reduce((a, x) => a + x.netMeters, 0);
  const processedDiameters = partial.filter(x => x.processedDiameters.length).map(x => x.diameter!);

  return {
    patterns,
    pieceTotals,
    unmet,
    initialDemand,
    usedByLength,
    remainingStock,
    scraps,
    requestedPieces,
    fulfilledPieces,
    usedBars,
    usedMeters,
    scrapMeters,
    netMeters,
    scrapPct: usedMeters > 0 ? (scrapMeters / usedMeters) * 100 : 0,
    allFulfilled: fulfilledPieces === requestedPieces,
    stockUpdated: false,
    processedDiameters,
    diameters,
  };
}

export function buildOperationalPlan(result: OptimizationResult): {
  cuts: OperationalCut[];
  rows: OperationalRow[];
} {
  const cuts: OperationalCut[] = (result.pieceTotals || [])
    .map((cut, sourceIndex) => ({
      ...cut,
      sourceIndex,
      units: Number(cut.units) || Number(cut.length),
    }))
    .sort((a, b) => Number(b.length) - Number(a.length) || Number(b.diameter) - Number(a.diameter));

  const operations: OperationalRow[] = [];
  let motherBarIdCounter = 1;

  for (const original of result.patterns || []) {
    const steps = cuts
      .map(cut => ({
        cut,
        count: Math.max(0, Math.floor(Number(original.counts?.[cut.sourceIndex]) || 0)),
      }))
      .filter(step => step.count > 0);

    if (!steps.length) continue;

    const currentBarId = motherBarIdCounter++;
    let currentLength = Number(original.barUnits);
    for (let i = 0; i < steps.length; i++) {
      const { cut, count } = steps[i];
      const afterCut = Math.max(0, currentLength - count * Number(cut.units));
      const hasFurtherCut = i < steps.length - 1;
      const isRecovery = i > 0;
      const operation: OperationalRow = {
        barId: currentBarId,
        isRecovery,
        diameter: Number(original.diameter),
        barUnits: currentLength,
        recoveryUnits: hasFurtherCut ? afterCut : 0,
        scrapUnits: hasFurtherCut ? 0 : afterCut,
        cutKey: resultKey(cut.diameter, cut.length),
        cutLength: Number(cut.length),
        cutCount: count,
        barCount: Number(original.barCount) || 1,
      };
      operations.push(operation);
      currentLength = afterCut;
    }
  }

  // Raggruppa solo passaggi realmente identici mantenendo barId e tracciamento recupero
  const grouped = new Map<string, OperationalRow>();
  for (const op of operations) {
    const key = [
      op.barId,
      op.isRecovery ? '1' : '0',
      op.diameter,
      op.barUnits,
      op.recoveryUnits,
      op.scrapUnits,
      op.cutKey,
      op.cutCount,
    ].join('|');
    if (!grouped.has(key)) grouped.set(key, { ...op });
    else grouped.get(key)!.barCount += op.barCount;
  }

  // Ordinamento cronologico per ID barra e passaggi (barra originaria -> recupero)
  const rows = Array.from(grouped.values()).sort(
    (a, b) =>
      a.barId - b.barId ||
      (a.isRecovery ? 1 : 0) - (b.isRecovery ? 1 : 0) ||
      Number(b.cutLength) - Number(a.cutLength)
  );

  return { cuts, rows };
}

export function normalizeNumericTree<T>(value: T): T {
  if (typeof value === 'number') return round2(value) as unknown as T;
  if (Array.isArray(value)) return value.map(normalizeNumericTree) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = normalizeNumericTree(item);
    }
    return out as unknown as T;
  }
  return value;
}

export function normalizeResultRows(
  result: OptimizationResult | null,
  defaultDiameter: number | null
): OptimizationResult | null {
  if (!result || !Array.isArray(result.patterns)) return null;
  const d = Number(result.diameter) || Number(defaultDiameter) || null;

  result.patterns = (result.patterns || []).map(x => ({
    ...x,
    diameter: Number(x.diameter) || d || 6,
    counts: Array.isArray(x.counts) ? x.counts : [],
  }));
  result.pieceTotals = (result.pieceTotals || []).map(x => ({
    ...x,
    diameter: Number(x.diameter) || d || 6,
  }));
  result.unmet = (result.unmet || []).map(x => ({
    ...x,
    diameter: Number(x.diameter) || d || 6,
    selected: !!x.selected,
    added: !!x.added,
  }));
  result.initialDemand = (result.initialDemand || []).map(x => ({
    ...x,
    diameter: Number(x.diameter) || d || 6,
  }));
  result.usedByLength = (result.usedByLength || []).map(x => ({
    ...x,
    diameter: Number(x.diameter) || d || 6,
  }));
  result.remainingStock = (result.remainingStock || []).map(x => ({
    ...x,
    diameter: Number(x.diameter) || d || 6,
    selected: !!x.selected,
    applied: !!x.applied,
  }));
  result.scraps = (result.scraps || []).map(x => ({
    ...x,
    diameter: Number(x.diameter) || d || 6,
    selected: !!x.selected,
    added: !!x.added,
  }));
  result.processedDiameters = Array.isArray(result.processedDiameters)
    ? result.processedDiameters.map(Number).filter(validDiameter)
    : validDiameter(d)
    ? [d!]
    : [];
  result.stockUpdated = !!result.stockUpdated;
  result.requestedPieces =
    Number(result.requestedPieces) ||
    result.pieceTotals.reduce((a, x) => a + (Number(x.requested) || 0), 0);
  result.fulfilledPieces =
    Number(result.fulfilledPieces) ||
    result.pieceTotals.reduce((a, x) => a + (Number(x.fulfilled) || 0), 0);
  result.usedBars =
    Number(result.usedBars) ||
    result.patterns.reduce((a, x) => a + (Number(x.barCount) || 1), 0);
  result.usedMeters =
    Number(result.usedMeters) ||
    result.patterns.reduce((a, x) => a + (Number(x.barLength) || 0) * (Number(x.barCount) || 1), 0);
  result.scrapMeters =
    Number(result.scrapMeters) ||
    result.patterns.reduce((a, x) => a + (Number(x.scrapLength) || 0) * (Number(x.barCount) || 1), 0);
  result.scrapPct =
    result.usedMeters > 0 ? (result.scrapMeters / result.usedMeters) * 100 : 0;
  result.allFulfilled = result.fulfilledPieces === result.requestedPieces;

  return normalizeNumericTree(result);
}
