import React from 'react';

/**
 * Icona SVG "Importa da Excel" (v. 1.47):
 * Stile illustrato a colori pieni coerente con le icone della barra superiore (foglio Excel verde + freccia blu di importazione).
 */
export const ExcelImportIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 26,
  className = 'excel-action-svg-native',
}) => {
  return (
    <svg
      viewBox="0 0 28 28"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Corpo principale cartella/foglio Excel */}
      <path
        d="M5 3.5A2 2 0 0 1 7 1.5h10.5L23 7v15.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-19z"
        fill="#FFFFFF"
        stroke="#15803D"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Piega angolo in alto a destra */}
      <path
        d="M17.5 1.5V6a1 1 0 0 0 1 1H23"
        fill="#BBF7D0"
        stroke="#15803D"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Intestazione verde tabella Excel */}
      <rect x="8.5" y="9.5" width="12" height="3.2" rx="0.8" fill="#16A34A" />
      {/* Griglia celle Excel */}
      <rect x="8.5" y="13.5" width="12" height="7.5" rx="0.8" fill="#DCFCE7" stroke="#4ADE80" strokeWidth="0.8" />
      <line x1="8.5" y1="17.2" x2="20.5" y2="17.2" stroke="#4ADE80" strokeWidth="0.8" />
      <line x1="14.5" y1="13.5" x2="14.5" y2="21" stroke="#4ADE80" strokeWidth="0.8" />

      {/* Tassello verde Excel a sinistra con "X" geometrica bianca */}
      <rect x="1.5" y="7" width="11.5" height="11.5" rx="2.2" fill="#107C41" stroke="#065F46" strokeWidth="1" />
      <path
        d="M4.8 10.2l4.9 5.1M9.7 10.2l-4.9 5.1"
        stroke="#FFFFFF"
        strokeWidth="1.9"
        strokeLinecap="round"
      />

      {/* Badge circolare blu con freccia verso il basso/interno (Importa) */}
      <circle cx="20.8" cy="20.8" r="6" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
      <path
        d="M20.8 17.5v5.6m0 0l-2.3-2.3m2.3 2.3l2.3-2.3"
        stroke="#FFFFFF"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Icona SVG "Esporta in Excel" (v. 1.47):
 * Stile illustrato a colori pieni coerente con le icone della barra superiore (foglio Excel verde + freccia arancione di esportazione).
 */
export const ExcelExportIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 26,
  className = 'excel-action-svg-native',
}) => {
  return (
    <svg
      viewBox="0 0 28 28"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Corpo principale cartella/foglio Excel */}
      <path
        d="M5 3.5A2 2 0 0 1 7 1.5h10.5L23 7v15.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-19z"
        fill="#FFFFFF"
        stroke="#15803D"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Piega angolo in alto a destra */}
      <path
        d="M17.5 1.5V6a1 1 0 0 0 1 1H23"
        fill="#BBF7D0"
        stroke="#15803D"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Intestazione verde tabella Excel */}
      <rect x="8.5" y="9.5" width="12" height="3.2" rx="0.8" fill="#16A34A" />
      {/* Griglia celle Excel */}
      <rect x="8.5" y="13.5" width="12" height="7.5" rx="0.8" fill="#DCFCE7" stroke="#4ADE80" strokeWidth="0.8" />
      <line x1="8.5" y1="17.2" x2="20.5" y2="17.2" stroke="#4ADE80" strokeWidth="0.8" />
      <line x1="14.5" y1="13.5" x2="14.5" y2="21" stroke="#4ADE80" strokeWidth="0.8" />

      {/* Tassello verde Excel a sinistra con "X" geometrica bianca */}
      <rect x="1.5" y="7" width="11.5" height="11.5" rx="2.2" fill="#107C41" stroke="#065F46" strokeWidth="1" />
      <path
        d="M4.8 10.2l4.9 5.1M9.7 10.2l-4.9 5.1"
        stroke="#FFFFFF"
        strokeWidth="1.9"
        strokeLinecap="round"
      />

      {/* Badge circolare ambra/arancio con freccia verso l'esterno (Esporta) */}
      <circle cx="20.8" cy="20.8" r="6" fill="#EA580C" stroke="#FFFFFF" strokeWidth="1.5" />
      <path
        d="M18.6 23l4.4-4.4m0 0h-3.2m3.2 0v3.2"
        stroke="#FFFFFF"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Icona SVG "Esporta / Stampa" (v. 1.47):
 * Stile illustrato a colori pieni coerente con le icone della barra superiore (stampante blu + foglio con diagramma + freccia esporta).
 */
export const ExportPrintIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 26,
  className = 'export-print-svg-native',
}) => {
  return (
    <svg
      viewBox="0 0 28 28"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Foglio in ingresso superiore */}
      <path
        d="M8 3.5A1.5 1.5 0 0 1 9.5 2h9A1.5 1.5 0 0 1 20 3.5V9H8V3.5z"
        fill="#FFFFFF"
        stroke="#1D4ED8"
        strokeWidth="1.3"
      />
      <line x1="10.5" y1="5" x2="17.5" y2="5" stroke="#93C5FD" strokeWidth="1.2" strokeLinecap="round" />

      {/* Corpo stampante blu stile TopBar */}
      <rect
        x="3"
        y="8.5"
        width="22"
        height="10.5"
        rx="2.6"
        fill="#2563EB"
        stroke="#1D4ED8"
        strokeWidth="1.2"
      />
      {/* Dettaglio fessura superiore e LED verde */}
      <rect x="6" y="10.8" width="11" height="1.8" rx="0.9" fill="#93C5FD" opacity="0.65" />
      <circle cx="21" cy="11.7" r="1.2" fill="#4ADE80" />

      {/* Foglio stampato in uscita con mini barra diagramma taglio */}
      <path
        d="M7.5 15.5h13v8.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 7.5 24v-8.5z"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <rect x="9.5" y="18" width="5.5" height="2.4" rx="0.6" fill="#16A34A" />
      <rect x="15.5" y="18" width="3" height="2.4" rx="0.6" fill="#DC2626" />
      <line x1="9.5" y1="22.5" x2="15.5" y2="22.5" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" />

      {/* Badge circolare ambra di esportazione in basso a destra */}
      <circle cx="21.5" cy="21.5" r="5.3" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.4" />
      <path
        d="M19.5 23.5l4-4m0 0h-2.9m2.9 0v2.9"
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
