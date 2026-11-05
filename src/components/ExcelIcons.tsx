import React from 'react';

/**
 * Icona "Importa da Excel" fedele al modello fornito (foglio bianco con logo Excel e freccia in giù)
 */
export const ExcelImportIcon: React.FC<{ size?: number }> = ({ size = 28 }) => {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" className="excel-action-svg">
      {/* Foglio bianco con bordo grigio e angolo piegato */}
      <path
        d="M14 6h18l8 8v24a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z"
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth="2"
      />
      {/* Piega angolo superiore destro */}
      <path
        d="M32 6v8h8"
        fill="#E2E8F0"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />

      {/* Badge verde EXCEL */}
      <rect x="7" y="13" width="18" height="8" rx="2" fill="#107C41" />
      <text
        x="16"
        y="19"
        fill="#FFFFFF"
        fontSize="5"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
      >
        EXCEL
      </text>

      {/* Grande X verde centrale */}
      <path
        d="M17 19l14 16m0-16L17 35"
        stroke="#107C41"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Freccia verde scuro rivolta in basso (Importa) in basso a destra */}
      <g transform="translate(28, 25)">
        <rect x="4.5" y="0" width="7" height="9" fill="#0D5C31" />
        <polygon points="0,8 16,8 8,19" fill="#0D5C31" />
      </g>
    </svg>
  );
};

/**
 * Icona "Esporta in Excel" fedele al modello fornito (foglio bianco con logo Excel e freccia in su/download)
 */
export const ExcelExportIcon: React.FC<{ size?: number }> = ({ size = 28 }) => {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" className="excel-action-svg">
      {/* Foglio bianco con bordo grigio e angolo piegato */}
      <path
        d="M14 6h18l8 8v24a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z"
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth="2"
      />
      {/* Piega angolo superiore destro */}
      <path
        d="M32 6v8h8"
        fill="#E2E8F0"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />

      {/* Badge verde EXCEL */}
      <rect x="7" y="13" width="18" height="8" rx="2" fill="#107C41" />
      <text
        x="16"
        y="19"
        fill="#FFFFFF"
        fontSize="5"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
      >
        EXCEL
      </text>

      {/* Grande X verde centrale */}
      <path
        d="M17 19l14 16m0-16L17 35"
        stroke="#107C41"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Freccia verde scuro rivolta verso l'esterno/alto (Esporta) */}
      <g transform="translate(28, 25)">
        <polygon points="8,0 0,11 16,11" fill="#0D5C31" />
        <rect x="4.5" y="10" width="7" height="9" fill="#0D5C31" />
      </g>
    </svg>
  );
};
