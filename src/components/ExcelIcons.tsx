import React from 'react';

/**
 * Icona SVG nativa "Importa da Excel":
 * Freccia piegata a 90°: parte in orizzontale (da dx a sx) e poi gira in basso (in verticale).
 */
export const ExcelImportIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 34,
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
        d="M5 5a2 2 0 0 1 2-2h14l8 8v18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5z"
        fill="#FFFFFF"
        stroke="#107C41"
        strokeWidth="1.6"
      />
      <path d="M21 3v7a1 1 0 0 0 1 1h7" fill="#E2E8F0" stroke="#107C41" strokeWidth="1.4" />

      {/* Griglia celle Excel sullo sfondo */}
      <rect x="9" y="13" width="16" height="12" rx="1" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="0.8" />
      <line x1="9" y1="17" x2="25" y2="17" stroke="#86EFAC" strokeWidth="0.8" />
      <line x1="9" y1="21" x2="25" y2="21" stroke="#86EFAC" strokeWidth="0.8" />
      <line x1="17" y1="13" x2="17" y2="25" stroke="#86EFAC" strokeWidth="0.8" />

      {/* Badge Verde Excel con scritta XLS */}
      <rect x="3" y="9" width="12" height="10" rx="2" fill="#107C41" stroke="#047857" strokeWidth="0.6" />
      <text
        x="9"
        y="16.5"
        fill="#FFFFFF"
        fontSize="6"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.2"
      >
        XLS
      </text>

      {/* Circoletto freccia Importa */}
      <circle cx="26" cy="26" r="8.5" fill="#107C41" stroke="#FFFFFF" strokeWidth="1.2" />
      {/* Freccia a 90°: parte in orizzontale (da dx a sx) e poi gira in basso in verticale */}
      <path
        d="M31 22h-5a2 2 0 0 0-2 2v6"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Punta freccia rivolta in basso */}
      <path
        d="M21 27.5l3 3.5 3-3.5"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Icona SVG nativa "Esporta in Excel":
 * Freccia piegata a 90°: parte in verticale (dal basso verso l'alto) e poi gira a destra in orizzontale.
 */
export const ExcelExportIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 34,
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
        d="M5 5a2 2 0 0 1 2-2h14l8 8v18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5z"
        fill="#FFFFFF"
        stroke="#107C41"
        strokeWidth="1.6"
      />
      <path d="M21 3v7a1 1 0 0 0 1 1h7" fill="#E2E8F0" stroke="#107C41" strokeWidth="1.4" />

      {/* Griglia celle Excel sullo sfondo */}
      <rect x="9" y="13" width="16" height="12" rx="1" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="0.8" />
      <line x1="9" y1="17" x2="25" y2="17" stroke="#86EFAC" strokeWidth="0.8" />
      <line x1="9" y1="21" x2="25" y2="21" stroke="#86EFAC" strokeWidth="0.8" />
      <line x1="17" y1="13" x2="17" y2="25" stroke="#86EFAC" strokeWidth="0.8" />

      {/* Badge Verde Excel con scritta XLS */}
      <rect x="3" y="9" width="12" height="10" rx="2" fill="#107C41" stroke="#047857" strokeWidth="0.6" />
      <text
        x="9"
        y="16.5"
        fill="#FFFFFF"
        fontSize="6"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.2"
      >
        XLS
      </text>

      {/* Circoletto freccia Esporta */}
      <circle cx="26" cy="26" r="8.5" fill="#107C41" stroke="#FFFFFF" strokeWidth="1.2" />
      {/* Freccia a 90°: parte in verticale (dal basso verso l'alto) e poi gira a destra in orizzontale */}
      <path
        d="M22 31v-5a2 2 0 0 1 2-2h6"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Punta freccia rivolta a destra */}
      <path
        d="M27.5 21l3.5 3-3.5 3"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Icona SVG nativa "Ordina Tabella":
 * Freccia in giù a sx e a destra 2 lettere A e Z ben visibili (la A sopra e la Z sotto).
 */
export const SortTableIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 34,
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
      {/* Freccia verticale rivolta in giù a sinistra */}
      <line
        x1="9"
        y1="7"
        x2="9"
        y2="28"
        stroke="#1E293B"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Punta freccia in giù */}
      <path
        d="M5 24l4 4.5 4-4.5"
        stroke="#1E293B"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lettera 'A' sopra a destra */}
      <text
        x="24"
        y="16"
        fill="#0284C7"
        fontSize="13"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        A
      </text>

      {/* Lettera 'Z' sotto a destra */}
      <text
        x="24"
        y="29"
        fill="#7C3AED"
        fontSize="13"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        Z
      </text>
    </svg>
  );
};
