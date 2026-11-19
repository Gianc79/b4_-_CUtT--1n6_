import React from 'react';

export interface ExitConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="in-app-modal-backdrop exit-modal-backdrop">
      <div
        className="exit-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-modal-title"
        aria-describedby="exit-modal-desc"
        onClick={e => e.stopPropagation()}
      >
        <div className="exit-modal-icon-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
            <path
              d="M11 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H11"
              stroke="#DC2626"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15.5 7.5L20 12l-4.5 4.5"
              stroke="#DC2626"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="9.5"
              y1="12"
              x2="19.5"
              y2="12"
              stroke="#DC2626"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h3 id="exit-modal-title" className="exit-modal-title">
          Uscire dall&apos;app?
        </h3>
        <p id="exit-modal-desc" className="exit-modal-subtitle">
          Vuoi chiudere TAGLIO BARRE C.A.?
        </p>

        <div className="exit-modal-actions">
          <button
            type="button"
            className="btn exit-modal-btn-cancel"
            onClick={onCancel}
          >
            Annulla
          </button>
          <button
            type="button"
            className="btn exit-modal-btn-confirm"
            onClick={onConfirm}
          >
            Esci
          </button>
        </div>
      </div>
    </div>
  );
};
