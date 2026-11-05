import React from 'react';
import { TabType } from './TopBar';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className="floating-bottom-nav" aria-label="Navigazione principale">
      {/* 1) Giacenza */}
      <button
        type="button"
        className={`floating-nav-item ${activeTab === 'stock' ? 'active' : ''}`}
        onClick={() => onTabChange('stock')}
        aria-label="Scheda Giacenza"
      >
        <div className="nav-item-icon-wrap">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="10" y1="4" x2="10" y2="20" />
          </svg>
        </div>
        <span className="nav-item-label">Giacenza</span>
      </button>

      {/* 2) Richiesta */}
      <button
        type="button"
        className={`floating-nav-item ${activeTab === 'demand' ? 'active' : ''}`}
        onClick={() => onTabChange('demand')}
        aria-label="Scheda Richiesta"
      >
        <div className="nav-item-icon-wrap">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3.5" />
            <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3.5" />
            <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3.5" />
          </svg>
        </div>
        <span className="nav-item-label">Richiesta</span>
      </button>

      {/* 3) Ottimizza */}
      <button
        type="button"
        className={`floating-nav-item ${activeTab === 'results' ? 'active' : ''}`}
        onClick={() => onTabChange('results')}
        aria-label="Scheda Ottimizza"
      >
        <div className="nav-item-icon-wrap">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
        </div>
        <span className="nav-item-label">Ottimizza</span>
      </button>

      {/* 4) Guida */}
      <button
        type="button"
        className={`floating-nav-item ${activeTab === 'help' ? 'active' : ''}`}
        onClick={() => onTabChange('help')}
        aria-label="Scheda Guida"
      >
        <div className="nav-item-icon-wrap">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="3.5" />
          </svg>
        </div>
        <span className="nav-item-label">Guida</span>
      </button>
    </nav>
  );
};
