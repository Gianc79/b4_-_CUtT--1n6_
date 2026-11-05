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
      {/* Fascia superiore: Icona a sinistra, Titolo e sottotitolo a destra dell'icona, 3 icone circolari a destra */}
      <div className="brandline-v128">
        <div className="brand-header-left">
          {/* Icona dell'app */}
          <div className="brandmark-app-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#1e3a5f" />
              <path d="M6 11h20M6 21h20" stroke="#5eead4" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M11 6v20M21 6v20" stroke="#ffffff" strokeOpacity=".85" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Titolo e sottotitolo posizionati a destra dell'icona dell'app */}
          <div className="brand-titles-group">
            <div className="brand-title-row">
              <h1 className="brand-app-name">TAGLIO BARRE C.A.</h1>
              <span className="brand-version-pill">v. 1.28</span>
            </div>
            <p className="brand-subtitle-twolines">
              <span>Gestione ottimizzata</span>
              <br />
              <span>del Piano di Taglio.</span>
            </p>
          </div>
        </div>

        {/* 3 Icone SpesaSuMisura in cerchi bianchi (1.5x): Salva, Salva con nome, Apri */}
        <div className="topbar-circular-actions" role="toolbar" aria-label="Operazioni file">
          {/* 1) Salva: Floppy disk (uguale a Salva con nome ma senza matita) */}
          <button
            className="topbar-circular-btn"
            type="button"
            onClick={onSave}
            title="Salva modifiche correnti"
            aria-label="Salva"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              {/* Corpo blu floppy */}
              <path
                d="M4 3h13l4 4v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
                fill="#2563EB"
                stroke="#1D4ED8"
                strokeWidth="1"
              />
              {/* Cursore metallico superiore */}
              <rect x="6.5" y="3" width="9.5" height="6.5" rx="1" fill="#E2E8F0" />
              <rect x="12" y="4.2" width="2.5" height="4.5" rx="0.5" fill="#475569" />
              {/* Etichetta bianca */}
              <rect x="5.5" y="12" width="13" height="8" rx="1" fill="#FFFFFF" />
              <line x1="7.5" y1="14.5" x2="16.5" y2="14.5" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="7.5" y1="17.5" x2="14" y2="17.5" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>

          {/* 2) Salva con nome: Floppy disk con matita */}
          <button
            className="topbar-circular-btn"
            type="button"
            onClick={onSaveAs}
            title="Salva con nome (.json)"
            aria-label="Salva con nome"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              {/* Corpo blu floppy */}
              <path
                d="M4 3h13l4 4v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
                fill="#2563EB"
                stroke="#1D4ED8"
                strokeWidth="1"
              />
              {/* Cursore metallico superiore */}
              <rect x="6.5" y="3" width="9.5" height="6.5" rx="1" fill="#E2E8F0" />
              <rect x="12" y="4.2" width="2.5" height="4.5" rx="0.5" fill="#475569" />
              {/* Etichetta bianca */}
              <rect x="5.5" y="12" width="13" height="8" rx="1" fill="#FFFFFF" />
              <line x1="7.5" y1="14.5" x2="13.5" y2="14.5" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" />
              {/* Matita gialla sovrapposta in basso a destra */}
              <g transform="translate(10, 10)">
                <rect
                  x="3"
                  y="1"
                  width="3.5"
                  height="9"
                  rx="0.5"
                  transform="rotate(-45 3 1)"
                  fill="#F59E0B"
                  stroke="#B45309"
                  strokeWidth="0.8"
                />
                <polygon points="1.5,10.5 3.5,11.5 0,13" fill="#FDE68A" stroke="#B45309" strokeWidth="0.5" />
                <polygon points="0,13 0.8,12.2 1.3,12.7" fill="#1E293B" />
                <rect
                  x="8.5"
                  y="-4.5"
                  width="3.5"
                  height="2.5"
                  rx="0.5"
                  transform="rotate(-45 8.5 -4.5)"
                  fill="#F43F5E"
                />
              </g>
            </svg>
          </button>

          {/* 3) Apri: Cartella gialla aperta */}
          <button
            className="topbar-circular-btn"
            type="button"
            onClick={handleImportClick}
            title="Apri file dati (.json)"
            aria-label="Apri file dati JSON"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              {/* Parte posteriore cartella */}
              <path d="M2 5a2 2 0 0 1 2-2h4l2 2h10a2 2 0 0 1 2 2v2H4a2 2 0 0 0-2 2V5z" fill="#D97706" />
              {/* Foglio bianco che spunta */}
              <rect x="5" y="6" width="14" height="7" rx="1" fill="#FFFFFF" opacity="0.95" />
              <line x1="7" y1="8.5" x2="13" y2="8.5" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
              {/* Tasca anteriore aperta inclinata */}
              <path
                d="M2 19l2.2-9.2A2 2 0 0 1 6.1 8h15.4a1.5 1.5 0 0 1 1.4 1.9l-2.1 8.2a2 2 0 0 1-1.9 1.9H4a2 2 0 0 1-2-2z"
                fill="#FBBF24"
                stroke="#D97706"
                strokeWidth="1"
              />
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

      {/* Navigazione Desktop (visibile su schermi >= 768px) */}
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
          title="Visualizza Giacenza e Richiesta affiancate"
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
    </header>
  );
};
