import React from 'react';

/**
 * Icona "Importa da Excel" con l'immagine ufficiale fornita dall'utente (/assets/aistudio/Importa_da_XLS_7b4dd766.jpg)
 */
export const ExcelImportIcon: React.FC<{ size?: number }> = ({ size = 38 }) => {
  return (
    <img
      src="/assets/aistudio/Importa_da_XLS_7b4dd766.jpg"
      alt="Importa da Excel"
      width={size}
      height={size}
      className="excel-action-img"
    />
  );
};

/**
 * Icona "Esporta in Excel" con l'immagine ufficiale fornita dall'utente (/assets/aistudio/Esporta_in_XLS_e8034d49.jpg)
 */
export const ExcelExportIcon: React.FC<{ size?: number }> = ({ size = 38 }) => {
  return (
    <img
      src="/assets/aistudio/Esporta_in_XLS_e8034d49.jpg"
      alt="Esporta in Excel"
      width={size}
      height={size}
      className="excel-action-img"
    />
  );
};

/**
 * Icona pulsante "Ordina" con l'immagine ufficiale fornita dall'utente (/assets/aistudio/Ordina_f2bfc3d8.jpg)
 */
export const SortTableIcon: React.FC<{ size?: number }> = ({ size = 38 }) => {
  return (
    <img
      src="/assets/aistudio/Ordina_f2bfc3d8.jpg"
      alt="Ordina tabella"
      width={size}
      height={size}
      className="sort-trigger-img"
    />
  );
};
