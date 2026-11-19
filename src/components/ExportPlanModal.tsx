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
              setTimeout(() => {
                onExportPdf();
              }, 100);
            }}
          >
            <div className="export-option-icon-box pdf-icon-bg" aria-hidden="true">
              <svg viewBox="0 0 36 36" width="38" height="38" fill="none">
                {/* Foglio documento bianco con piega in alto a dx */}
                <path
                  d="M7 4a2 2 0 0 1 2-2h13l8 8v21a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4z"
                  fill="#FFFFFF"
                  stroke="#DC2626"
                  strokeWidth="1.6"
                />
                <path d="M22 2v7a1 1 0 0 0 1 1h7" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.4" strokeLinejoin="round" />
                {/* Mini barre colorate del diagramma sul documento */}
                <rect x="11" y="13" width="14" height="3.2" rx="1" fill="#FECACA" />
                <rect x="11" y="13" width="8.5" height="3.2" rx="1" fill="#16A34A" />
                <rect x="11" y="18.2" width="14" height="2.2" rx="1" fill="#CBD5E1" />
                <rect x="11" y="22" width="10" height="2.2" rx="1" fill="#CBD5E1" />
                {/* Badge Rosso PDF in primo piano */}
                <rect x="2" y="19" width="18" height="10.5" rx="2.5" fill="#DC2626" stroke="#991B1B" strokeWidth="0.8" />
                <text
                  x="11"
                  y="26.5"
                  fill="#FFFFFF"
                  fontSize="6.8"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  letterSpacing="0.3"
                >
                  PDF
                </text>
                {/* Mini badge stampante in basso a destra */}
                <circle cx="28" cy="27.5" r="6" fill="#0F2942" stroke="#FFFFFF" strokeWidth="1.2" />
                <rect x="25.2" y="26.2" width="5.6" height="3.2" rx="0.7" fill="#FFFFFF" />
                <rect x="26.3" y="24.5" width="3.4" height="2" rx="0.4" fill="#93C5FD" />
                <rect x="26.3" y="28.4" width="3.4" height="2.1" rx="0.3" fill="#E2E8F0" />
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
              setTimeout(() => {
                onExportPng();
              }, 100);
            }}
          >
            <div className="export-option-icon-box img-icon-bg" aria-hidden="true">
              <svg viewBox="0 0 36 36" width="38" height="38" fill="none">
                {/* Cornice foto/immagine stile illustrato */}
                <rect x="4" y="4" width="28" height="24" rx="3.5" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1.6" />
                {/* Sfondo cielo */}
                <rect x="6.5" y="6.5" width="23" height="16.5" rx="1.8" fill="#BAE6FD" />
                {/* Sole dorato */}
                <circle cx="24" cy="11.5" r="2.6" fill="#FBBF24" stroke="#D97706" strokeWidth="0.7" />
                {/* Montagna sullo sfondo */}
                <path d="M15.5 23L21.5 14.5L29.5 23H15.5Z" fill="#0EA5E9" />
                {/* Montagna in primo piano */}
                <path d="M6.5 23L13.5 12.5L21 23H6.5Z" fill="#0284C7" />
                {/* Innevamento/luce cima */}
                <path d="M13.5 12.5L15.6 15.6L13.7 14.9L11.7 15.8L13.5 12.5Z" fill="#FFFFFF" />
                {/* Badge Blu PNG */}
                <rect x="9" y="23.5" width="18" height="10" rx="2.5" fill="#0284C7" stroke="#0369A1" strokeWidth="0.8" />
                <text
                  x="18"
                  y="30.8"
                  fill="#FFFFFF"
                  fontSize="6.6"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  letterSpacing="0.3"
                >
                  PNG
                </text>
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
              setTimeout(() => {
                onExportExcel();
              }, 100);
            }}
          >
            <div className="export-option-icon-box excel-icon-bg" aria-hidden="true">
              <svg viewBox="0 0 36 36" width="38" height="38" fill="none">
                {/* Foglio documento Excel con piega */}
                <path
                  d="M7 4a2 2 0 0 1 2-2h13l8 8v21a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4z"
                  fill="#FFFFFF"
                  stroke="#107C41"
                  strokeWidth="1.6"
                />
                <path d="M22 2v7a1 1 0 0 0 1 1h7" fill="#DCFCE7" stroke="#107C41" strokeWidth="1.4" strokeLinejoin="round" />
                {/* Griglia celle Excel */}
                <rect x="10.5" y="12.5" width="16" height="15" rx="1.2" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="0.9" />
                <rect x="10.5" y="12.5" width="16" height="3.8" rx="1" fill="#BBF7D0" />
                <line x1="10.5" y1="16.3" x2="26.5" y2="16.3" stroke="#4ADE80" strokeWidth="0.9" />
                <line x1="10.5" y1="20.1" x2="26.5" y2="20.1" stroke="#86EFAC" strokeWidth="0.9" />
                <line x1="10.5" y1="23.8" x2="26.5" y2="23.8" stroke="#86EFAC" strokeWidth="0.9" />
                <line x1="18.5" y1="12.5" x2="18.5" y2="27.5" stroke="#86EFAC" strokeWidth="0.9" />
                {/* Badge Verde Excel con scritta XLS */}
                <rect x="2" y="18.5" width="18" height="10.5" rx="2.5" fill="#107C41" stroke="#065F46" strokeWidth="0.8" />
                <text
                  x="11"
                  y="26"
                  fill="#FFFFFF"
                  fontSize="6.8"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  letterSpacing="0.3"
                >
                  XLS
                </text>
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
