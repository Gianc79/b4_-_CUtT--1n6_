import React, { useRef } from 'react';

export type TabType = 'stock' | 'demand' | 'results' | 'help' | 'split';

interface TopBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onImportJson: (file: File) => void;
  onSave: () => void;
  onSaveAs: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  onImportJson,
  onSave,
  onSaveAs,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      onImportJson(file);
    }
    e.target.value = '';
  };

  const handleImportClick = async () => {
    if (typeof (window as any).showOpenFilePicker === 'function') {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: 'Dati OTTIMIZZAZIONE BARRE C.A.',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        const file = await handle.getFile();
        onImportJson(file);
        return;
      } catch (e: any) {
        if (e && e.name === 'AbortError') return;
      }
    }
    fileInputRef.current?.click();
  };

  return (
    <header className="topbar">
      <div className="brandline">
        <div className="brandmark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M4 8h24M4 16h24M4 24h24" stroke="#8ED9CE" strokeWidth="3" strokeLinecap="round" />
            <path d="M10 4v24M22 4v24" stroke="#fff" strokeOpacity=".75" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="brand">
          <h1>OTTIMIZZAZIONE BARRE C.A.</h1>
          <p>
            Piano di Taglio & Gestione Fabbisogno <span className="version">v. 1.25</span>
          </p>
        </div>
        <div className="top-actions">
          <button className="btn" id="importJsonBtn" type="button" onClick={handleImportClick} title="Carica file di backup JSON">
            ⇧ Carica file
          </button>
          <button className="btn" id="saveBtn" type="button" onClick={onSave} title="Salva modifiche correnti">
            ▣ Salva
          </button>
          <button className="btn" id="saveAsBtn" type="button" onClick={onSaveAs} title="Scarica copia backup JSON">
            ⇩ Salva con nome
          </button>
          <input
            ref={fileInputRef}
            className="file-input"
            type="file"
            id="importJsonFile"
            accept="application/json,.json"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="nav topbar-nav desktop-nav" aria-label="Sezioni applicazione">
        <button
          type="button"
          className={activeTab === 'stock' ? 'active' : ''}
          onClick={() => onTabChange('stock')}
        >
          <span className="nicon">▤</span>Giacenza
        </button>
        <button
          type="button"
          className={activeTab === 'demand' ? 'active' : ''}
          onClick={() => onTabChange('demand')}
        >
          <span className="nicon">≡</span>Richiesta
        </button>
        <button
          type="button"
          className={activeTab === 'split' ? 'active split-tab-btn' : 'split-tab-btn'}
          onClick={() => onTabChange('split')}
          title="Visualizza Giacenza e Richiesta affiancate (ideale per grandi schermi)"
        >
          <span className="nicon">◫</span>Vista Affiancata
        </button>
        <button
          type="button"
          className={activeTab === 'results' ? 'active' : ''}
          onClick={() => onTabChange('results')}
        >
          <span className="nicon">▥</span>Ottimizzazione
        </button>
        <button
          type="button"
          className={activeTab === 'help' ? 'active' : ''}
          onClick={() => onTabChange('help')}
          aria-label="Guida rapida"
          title="Guida rapida"
        >
          <span className="nicon">ⓘ</span>
          <span className="nav-label">Guida</span>
        </button>
      </nav>
    </header>
  );
};
