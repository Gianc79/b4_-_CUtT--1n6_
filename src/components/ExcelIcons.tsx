import React from 'react';

/**
 * Icona SVG nativa "Importa da Excel":
 * Documento Excel verde con foglio a celle, badge "XLS" e freccia verde di importazione.
 */
export const ExcelImportIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = 'excel-action-svg-native',
}) => {
  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Foglio documento con piega in alto a dx */}
      <path
        d="M6 5a2 2 0 0 1 2-2h14l8 8v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5z"
        fill="#FFFFFF"
        stroke="#107C41"
        strokeWidth="1.6"
      />
      <path d="M22 3v7a1 1 0 0 0 1 1h7" fill="#E2E8F0" stroke="#107C41" strokeWidth="1.4" />

      {/* Griglia celle Excel sullo sfondo */}
      <rect x="10" y="14" width="16" height="12" rx="1" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="0.8" />
      <line x1="10" y1="18" x2="26" y2="18" stroke="#86EFAC" strokeWidth="0.8" />
      <line x1="10" y1="22" x2="26" y2="22" stroke="#86EFAC" strokeWidth="0.8" />
      <line x1="18" y1="14" x2="18" y2="26" stroke="#86EFAC" strokeWidth="0.8" />

      {/* Badge Verde Excel con scritta XLS */}
      <rect x="3" y="10" width="13" height="11" rx="2" fill="#107C41" stroke="#047857" strokeWidth="0.6" />
      <text
        x="9.5"
        y="18"
        fill="#FFFFFF"
        fontSize="6.5"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.2"
      >
        XLS
      </text>

      {/* Freccia verde di importazione (in entrata / verso destra o basso-destra) */}
      <circle cx="27" cy="27" r="7.5" fill="#107C41" />
      <path
        d="M24 27h6m-3-3l3 3-3 3"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Icona SVG nativa "Esporta in Excel":
 * Documento Excel verde con foglio a celle, badge "XLS" e freccia verde di esportazione verso il basso.
 */
export const ExcelExportIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = 'excel-action-svg-native',
}) => {
  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Foglio documento con piega in alto a dx */}
      <path
        d="M6 5a2 2 0 0 1 2-2h14l8 8v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5z"
        fill="#FFFFFF"
        stroke="#107C41"
        strokeWidth="1.6"
      />
      <path d="M22 3v7a1 1 0 0 0 1 1h7" fill="#E2E8F0" stroke="#107C41" strokeWidth="1.4" />

      {/* Griglia celle Excel sullo sfondo */}
      <rect x="10" y="14" width="16" height="12" rx="1" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="0.8" />
      <line x1="10" y1="18" x2="26" y2="18" stroke="#86EFAC" strokeWidth="0.8" />
      <line x1="10" y1="22" x2="26" y2="22" stroke="#86EFAC" strokeWidth="0.8" />
      <line x1="18" y1="14" x2="18" y2="26" stroke="#86EFAC" strokeWidth="0.8" />

      {/* Badge Verde Excel con scritta XLS */}
      <rect x="3" y="10" width="13" height="11" rx="2" fill="#107C41" stroke="#047857" strokeWidth="0.6" />
      <text
        x="9.5"
        y="18"
        fill="#FFFFFF"
        fontSize="6.5"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.2"
      >
        XLS
      </text>

      {/* Freccia verde di esportazione (verso il basso con tray) */}
      <circle cx="27" cy="27" r="7.5" fill="#107C41" />
      <path
        d="M27 23.5v6.5m-3-3l3 3 3-3"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Icona SVG nativa "Ordina Tabella":
 * Freccia verticale di ordinamento con 4 barre orizzontali graduate azzurre.
 */
export const SortTableIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = 'sort-trigger-svg-native',
}) => {
  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Freccia verticale rivolta verso il basso a sinistra */}
      <path
        d="M8 8v19m0 0l-4-4.5M8 27l4-4.5"
        stroke="#1E293B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 4 Barre orizzontali graduate blu/ciano */}
      <rect x="16" y="8" width="6" height="4" rx="1.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
      <rect x="16" y="14" width="10" height="4" rx="1.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
      <rect x="16" y="20" width="14" height="4" rx="1.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
      <rect x="16" y="26" width="17" height="4" rx="1.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
    </svg>
  );
};
