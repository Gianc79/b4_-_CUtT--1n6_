import React from 'react';
import { TabType } from './TopBar';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  stockCount: number;
  demandCount: number;
  hasResults: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  stockCount,
  demandCount,
  hasResults,
}) => {
  return (
    <nav className="mobile-bottom-nav" aria-label="Navigazione principale mobile">
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'stock' ? 'active' : ''}`}
        onClick={() => onTabChange('stock')}
      >
        <div className="bottom-nav-icon-wrap">
          <span className="bottom-nav-icon">▤</span>
          {stockCount > 0 && <span className="bottom-nav-badge">{stockCount}</span>}
        </div>
        <span className="bottom-nav-label">Giacenza</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'demand' ? 'active' : ''}`}
        onClick={() => onTabChange('demand')}
      >
        <div className="bottom-nav-icon-wrap">
          <span className="bottom-nav-icon">≡</span>
          {demandCount > 0 && <span className="bottom-nav-badge">{demandCount}</span>}
        </div>
        <span className="bottom-nav-label">Richiesta</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'results' ? 'active' : ''}`}
        onClick={() => onTabChange('results')}
      >
        <div className="bottom-nav-icon-wrap">
          <span className="bottom-nav-icon">▥</span>
          {hasResults && <span className="bottom-nav-dot" aria-label="Risultati disponibili" />}
        </div>
        <span className="bottom-nav-label">Ottimizza</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'help' ? 'active' : ''}`}
        onClick={() => onTabChange('help')}
      >
        <div className="bottom-nav-icon-wrap">
          <span className="bottom-nav-icon">ⓘ</span>
        </div>
        <span className="bottom-nav-label">Guida</span>
      </button>
    </nav>
  );
};
