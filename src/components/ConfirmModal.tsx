import React from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'danger' | 'primary';
  showCancel?: boolean;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
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
  showCloseButton = true,
  closeOnBackdrop = true,
  onConfirm,
  onCancel,
  isDuplicatePrompt = false,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (!closeOnBackdrop || !showCloseButton) return;
    if (showCancel && onCancel) {
      onCancel();
    }
  };

  const shouldRenderCloseButton = showCloseButton && !!onCancel;

  return (
    <div className="in-app-modal-backdrop" onClick={handleBackdropClick}>
      <div
        className="in-app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="in-app-modal-head">
          <h3 id="modal-title">{title}</h3>
          {shouldRenderCloseButton && (
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
          {showCancel && onCancel && (
            <button
              type="button"
              className="btn neutral modal-btn-half"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className={`btn ${confirmStyle === 'danger' ? 'btn-danger-bg' : 'primary'} ${showCancel ? 'modal-btn-half' : ''}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
