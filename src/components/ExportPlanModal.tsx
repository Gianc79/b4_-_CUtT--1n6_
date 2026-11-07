import React from 'react';

interface ExportPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onExportPng: () => void;
}

export const ExportPlanModal: React.FC<ExportPlanModalProps> = ({
  isOpen,
  onClose,
  onExportExcel,
  onExportPdf,
  onExportPng,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="in-app-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exportPlanModalTitle"
    >
      <div
        className="in-app-modal export-plan-modal-card"
        onClick={e => e.stopPropagation()}
      >
        {/* Header modale con titolo percepibile e 'x' allineata verticalmente all'estrema dx */}
        <div className="export-plan-modal-header">
          <div className="export-plan-title-group">
            <span className="export-plan-header-icon" aria-hidden="true">📥</span>
            <h3 id="exportPlanModalTitle" className="export-plan-modal-title">
              Esporta / Stampa
            </h3>
          </div>
          <button
            type="button"
            className="in-app-modal-close-btn"
            onClick={onClose}
            aria-label="Chiudi finestra"
          >
            ×
          </button>
        </div>

        {/* 3 Opzioni di esportazione nel nuovo ordine a, b, c richiesto */}
        <div className="export-options-list">
          {/* a) Stampa / Salva come PDF */}
          <button
            type="button"
            className="export-option-card recommended-export"
            onClick={() => {
              onClose();
              onExportPdf();
            }}
          >
            <div className="export-option-icon-box pdf-icon-bg" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="#dc2626" />
                <path d="M7 8h10M7 12h7M7 16h10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <path d="M14 3v5h5" stroke="#ffffff" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="export-option-details">
              <div className="export-option-title-row">
                <span className="export-option-title">Stampa / Salva come PDF</span>
                <span className="export-badge-pill pdf">.PDF</span>
              </div>
              <p className="export-option-desc">
                Diagrammi Visivi in formato PDF ad alta definizione, identici alla grafica a video con colori pieni e pronti per la stampa A4 o il salvataggio.
              </p>
            </div>
          </button>

          {/* b) Esporta Diagrammi Visivi come immagine */}
          <button
            type="button"
            className="export-option-card"
            onClick={() => {
              onClose();
              onExportPng();
            }}
          >
            <div className="export-option-icon-box img-icon-bg" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="#0284c7" />
                <circle cx="8.5" cy="8.5" r="2" fill="#ffffff" />
                <path d="M21 15l-5-5L5 21" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="export-option-details">
              <div className="export-option-title-row">
                <span className="export-option-title">Esporta Diagrammi Visivi come immagine</span>
                <span className="export-badge-pill png">.PNG</span>
              </div>
              <p className="export-option-desc">
                Grafica ad alta risoluzione con barre e quote di taglio, ideale per la condivisione rapida su smartphone e WhatsApp.
              </p>
            </div>
          </button>

          {/* c) Esporta Tabella in Excel */}
          <button
            type="button"
            className="export-option-card"
            onClick={() => {
              onClose();
              onExportExcel();
            }}
          >
            <div className="export-option-icon-box excel-icon-bg" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="#15803d" />
                <path d="M7 7l4 10m0-10l-4 10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <path d="M14 8h4m-4 4h4m-4 4h4" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="export-option-details">
              <div className="export-option-title-row">
                <span className="export-option-title">Esporta Tabella in Excel</span>
                <span className="export-badge-pill xlsx">.XLSX</span>
              </div>
              <p className="export-option-desc">
                Tabella completa con tutte le operazioni cronologiche, le barre prelevate, i tagli e gli sfridi.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
