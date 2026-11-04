export interface MasterRow {
  id: string;
  diameter: string;
  qty: string;
  length: string;
}

export interface SortLevel {
  field: 'diameter' | 'qty' | 'length';
  direction: 'asc' | 'desc';
}

export interface Pattern {
  id: number;
  diameter: number;
  barUnits: number;
  barLength: number;
  barCount: number;
  scrapUnits: number;
  scrapLength: number;
  counts: number[];
}

export interface PieceTotal {
  diameter: number;
  length: number;
  units: number;
  requested: number;
  fulfilled: number;
  remaining: number;
}

export interface UnmetItem extends PieceTotal {
  selected?: boolean;
  added?: boolean;
}

export interface UsedBarItem {
  diameter: number;
  units: number;
  length: number;
  qty: number;
  weight: number;
}

export interface RemainingStockItem {
  diameter: number;
  units: number;
  length: number;
  qty: number;
  selected?: boolean;
  applied?: boolean;
}

export interface ScrapItem {
  diameter: number;
  units: number;
  length: number;
  qty: number;
  selected?: boolean;
  added?: boolean;
}

export interface OptimizationResult {
  diameter?: number;
  patterns: Pattern[];
  pieceTotals: PieceTotal[];
  unmet: UnmetItem[];
  initialDemand: Array<{ diameter: number; units: number; length: number; qty: number; remaining: number }>;
  usedByLength: UsedBarItem[];
  remainingStock: RemainingStockItem[];
  scraps: ScrapItem[];
  requestedPieces: number;
  fulfilledPieces: number;
  usedBars: number;
  usedMeters: number;
  scrapMeters: number;
  netMeters: number;
  scrapPct: number;
  allFulfilled: boolean;
  stockUpdated: boolean;
  processedDiameters: number[];
  diameters?: number[];
}

export interface OperationalCut {
  diameter: number;
  length: number;
  units: number;
  requested: number;
  fulfilled: number;
  remaining: number;
  sourceIndex: number;
}

export interface OperationalRow {
  diameter: number;
  barUnits: number;
  recoveryUnits: number;
  scrapUnits: number;
  cutKey: string;
  cutLength: number;
  cutCount: number;
  barCount: number;
}

export interface AppState {
  schemaVersion: number;
  stockDetail: MasterRow[];
  demandDetail: MasterRow[];
  result: OptimizationResult | null;
}
