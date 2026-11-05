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
              description: 'Dati TAGLIO BARRE C.A.',
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
      {/* Riga superiore: Logo, Titolo a tutta larghezza e Sottotitolo */}
      <div className="brandline-full">
        <div className="brandmark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M4 8h24M4 16h24M4 24h24" stroke="#8ED9CE" strokeWidth="3" strokeLinecap="round" />
            <path d="M10 4v24M22 4v24" stroke="#fff" strokeOpacity=".75" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="brand">
          <h1>TAGLIO BARRE C.A.</h1>
          <p>
            Gestione ottimizzata della giacenza e del Piano di Taglio.{' '}
            <span className="version">v. 1.26</span>
          </p>
        </div>
      </div>

      {/* Riga inferiore: Navigazione a sinistra e Icone Azioni (Apri, Salva, Salva con nome) a destra */}
      <div className="topbar-bottom-row">
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
            <span className="nicon">▥</span>Ottimizza
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

        {/* 2) Icone Apri, Salva, Salva con nome posizionate sulla parte bassa della fascia */}
        <div className="topbar-action-icons" role="toolbar" aria-label="Operazioni file">
          {/* Icona Apri file */}
          <button
            className="topbar-icon-action"
            type="button"
            onClick={handleImportClick}
            title="Apri file dati (.json)"
            aria-label="Apri file dati JSON"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <polyline points="12 11 12 17 9 14" />
              <polyline points="12 11 12 17 15 14" />
            </svg>
          </button>

          {/* Icona Salva */}
          <button
            className="topbar-icon-action"
            type="button"
            onClick={onSave}
            title="Salva modifiche correnti"
            aria-label="Salva"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          </button>

          {/* Icona Salva con nome */}
          <button
            className="topbar-icon-action"
            type="button"
            onClick={onSaveAs}
            title="Salva con nome (.json)"
            aria-label="Salva con nome"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
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
    </header>
  );
};
