import React from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'danger' | 'primary';
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  isDuplicatePrompt?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Annulla',
  confirmStyle = 'primary',
  showCancel = true,
  onConfirm,
  onCancel,
  isDuplicatePrompt = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="in-app-modal-backdrop" onClick={onCancel}>
      <div
        className="in-app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="in-app-modal-head">
          <h3 id="modal-title">{title}</h3>
          {onCancel && (
            <button
              type="button"
              className="in-app-modal-close"
              onClick={onCancel}
              aria-label="Chiudi finestra"
            >
              ×
            </button>
          )}
        </div>

        <div className="in-app-modal-body">
          <p>{message}</p>
        </div>

        <div className="in-app-modal-actions">
          {isDuplicatePrompt ? (
            <>
              {/* NO a sinistra */}
              <button
                type="button"
                className="btn neutral modal-btn-half"
                onClick={onCancel}
              >
                NO
              </button>
              {/* SI a destra */}
              <button
                type="button"
                className="btn primary modal-btn-half"
                onClick={onConfirm}
              >
                SI
              </button>
            </>
          ) : (
            <>
              {/* Annulla a sinistra: colore standard grigino (btn neutral), non verde */}
              {showCancel && onCancel && (
                <button
                  type="button"
                  className="btn neutral modal-btn-half"
                  onClick={onCancel}
                >
                  {cancelText}
                </button>
              )}
              {/* Conferma (es. Elimina tutti) a destra */}
              <button
                type="button"
                className={`btn ${confirmStyle === 'danger' ? 'btn-danger-bg' : 'primary'} modal-btn-half`}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
