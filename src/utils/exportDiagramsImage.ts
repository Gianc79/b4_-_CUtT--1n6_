import { OptimizationResult } from '../types';
import { fmt, intFmt, unitWeight } from './math';
import { download, saveWithPicker } from './storage';

export interface DiagramOperationItem {
  barId: number;
  isRecovery?: boolean;
  diameter: number;
  barUnits: number; // in cm
  barCount: number;
  cutLength: number; // in cm
  cutCount: number;
  recoveryUnits: number; // in cm
  scrapUnits: number; // in cm
}

/**
 * Genera ed esporta un'immagine grafica ad alta risoluzione (PNG)
 * dei Diagrammi Visivi del Piano di Taglio.
 */
export async function exportDiagramsAsPng(
  operations: DiagramOperationItem[],
  result: OptimizationResult,
  onToast: (msg: string) => void
): Promise<void> {
  if (!operations || operations.length === 0) {
    alert('Nessun diagramma di taglio disponibile da esportare.');
    return;
  }

  const dpr = 2; // Alta risoluzione Retina
  const baseWidth = 960;
  const cardHeight = 118;
  const headerHeight = 130;
  const footerHeight = 44;
  const baseHeight = headerHeight + operations.length * (cardHeight + 14) + footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = baseWidth * dpr;
  canvas.height = baseHeight * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    alert('Impossibile inizializzare il motore grafico.');
    return;
  }

  ctx.scale(dpr, dpr);

  // Sfondo pagina
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, baseWidth, baseHeight);

  // Intestazione scura
  const gradHeader = ctx.createLinearGradient(0, 0, baseWidth, headerHeight);
  gradHeader.addColorStop(0, '#102b46');
  gradHeader.addColorStop(1, '#163b5e');
  ctx.fillStyle = gradHeader;
  ctx.fillRect(0, 0, baseWidth, headerHeight);

  // Titolo applicazione
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('TAGLIO BARRE C.A. — v. 1.36', 24, 38);

  ctx.fillStyle = '#93c5fd';
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('Piano Operativo di Taglio · Diagrammi Visivi', 24, 60);

  // Data generazione
  const dateStr = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Generato il: ${dateStr}`, baseWidth - 220, 38);

  // Barra di riepilogo nell'header con elenco barre utilizzate
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(24, 76, baseWidth - 48, 38);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  const usedBarsList = (result.usedByLength || []).map(
    b => `n. ${intFmt(b.qty)} Ø ${b.diameter} da ${fmt(b.length / 100)} m`
  );
  const headerSummaryText = `Barre utilizzate: ${usedBarsList.join('   |   ') || 'Nessuna'}`;
  ctx.fillText(headerSummaryText, 38, 100);

  // Render di ciascuna scheda diagramma
  let currentY = headerHeight + 16;

  for (let i = 0; i < operations.length; i++) {
    const p = operations[i];
    const cardX = 24;
    const cardW = baseWidth - 48;
    const totalLen = Math.max(1, p.barUnits);

    // Sfondo scheda bianca
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cardX, currentY, cardW, cardHeight, 10);
    ctx.fill();
    ctx.stroke();

    // Badge circolare numero barre (in alto a destra)
    const badgeSize = 30;
    const badgeX = cardX + cardW - badgeSize - 14;
    const badgeY = currentY + 10;
    ctx.fillStyle = '#102b46';
    ctx.beginPath();
    ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(p.barCount), badgeX + badgeSize / 2, badgeY + badgeSize / 2);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Badge ID (Verde origin o Azzurro recovery)
    const idBg = p.isRecovery ? '#e0f2fe' : '#dcfce7';
    const idColor = p.isRecovery ? '#0369a1' : '#15803d';
    const idBorder = p.isRecovery ? '#7dd3fc' : '#86efac';
    ctx.fillStyle = idBg;
    ctx.strokeStyle = idBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cardX + 12, currentY + 10, 52, 22, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = idColor;
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`ID ${p.barId}`, cardX + 18, currentY + 25);

    // Badge Diametro
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect(cardX + 70, currentY + 10, 78, 22, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Ø ${p.diameter} mm`, cardX + 78, currentY + 25);

    // Badge Lunghezza Barra
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect(cardX + 154, currentY + 10, 102, 22, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Barra ${fmt(p.barUnits / 100)} m`, cardX + 162, currentY + 25);

    // Indicatori sintetici sopra la barra (Taglio, Recupero, Sfrido)
    let tagX = cardX + 266;
    ctx.font = '600 11px system-ui, -apple-system, sans-serif';

    // 1) Taglio
    const cutText = `Taglio: ${p.cutCount > 1 ? `${p.cutCount}× ` : ''}${fmt(p.cutLength / 100)} m`;
    const cutTextWidth = ctx.measureText(cutText).width;
    ctx.fillStyle = '#e0f2fe';
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tagX, currentY + 10, cutTextWidth + 14, 22, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0369a1';
    ctx.fillText(cutText, tagX + 7, currentY + 25);
    tagX += cutTextWidth + 20;

    // 2) Recupero (se presente)
    if (p.recoveryUnits > 0) {
      const recText = `Recupero: ${fmt(p.recoveryUnits / 100)} m`;
      const recTextWidth = ctx.measureText(recText).width;
      ctx.fillStyle = '#f0f9ff';
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tagX, currentY + 10, recTextWidth + 14, 22, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0284c7';
      ctx.fillText(recText, tagX + 7, currentY + 25);
      tagX += recTextWidth + 20;
    }

    // 3) Sfrido (se presente)
    if (p.scrapUnits > 0) {
      const scrapText = `Sfrido: ${fmt(p.scrapUnits / 100)} m`;
      const scrapTextWidth = ctx.measureText(scrapText).width;
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tagX, currentY + 10, scrapTextWidth + 14, 22, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#b45309';
      ctx.fillText(scrapText, tagX + 7, currentY + 25);
      tagX += scrapTextWidth + 20;
    }

    // Barra segmentata
    const barTrackX = cardX + 14;
    const barTrackY = currentY + 44;
    const barTrackW = cardW - 28;
    const barTrackH = 34;

    // Sfondo barra
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(barTrackX, barTrackY, barTrackW, barTrackH, 6);
    ctx.fill();

    // Pezzi di taglio
    let accumPct = 0;
    const cutPct = (p.cutLength / totalLen);
    for (let c = 0; c < p.cutCount; c++) {
      const segX = barTrackX + accumPct * barTrackW;
      const segW = cutPct * barTrackW;
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(segX, barTrackY, segW, barTrackH);

      // Bordo separatore
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(segX, barTrackY, segW, barTrackH);

      // Scritta lunghezza dentro il pezzo
      if (segW > 28) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${fmt(p.cutLength / 100)} m`, segX + segW / 2, barTrackY + barTrackH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
      accumPct += cutPct;
    }

    // Segmento recupero
    if (p.recoveryUnits > 0) {
      const recPct = (p.recoveryUnits / totalLen);
      const segX = barTrackX + accumPct * barTrackW;
      const segW = recPct * barTrackW;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(segX, barTrackY, segW, barTrackH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(segX, barTrackY, segW, barTrackH);

      if (segW > 28) {
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Rec. ${fmt(p.recoveryUnits / 100)} m`, segX + segW / 2, barTrackY + barTrackH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
      accumPct += recPct;
    }

    // Segmento sfrido rimanente
    if (accumPct < 0.999) {
      const scrapW = barTrackW - (accumPct * barTrackW);
      const segX = barTrackX + accumPct * barTrackW;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(segX, barTrackY, scrapW, barTrackH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(segX, barTrackY, scrapW, barTrackH);

      if (scrapW > 24) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Sfrido ${fmt(p.scrapUnits / 100)} m`, segX + scrapW / 2, barTrackY + barTrackH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }

    // Indicatore forbici/quote sotto la barra
    ctx.fillStyle = '#64748b';
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    let runningCm = 0;
    for (let c = 1; c <= p.cutCount; c++) {
      runningCm += p.cutLength;
      if (runningCm < totalLen) {
        const markerX = barTrackX + (runningCm / totalLen) * barTrackW;
        ctx.textAlign = 'center';
        ctx.fillText(`✂ ${fmt(runningCm / 100)} m`, markerX, barTrackY + barTrackH + 16);
      }
    }
    ctx.textAlign = 'left';

    currentY += cardHeight + 14;
  }

  // Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('TAGLIO BARRE C.A. · Documento generato ad uso officina e cantiere', 24, baseHeight - 16);

  // Download
  canvas.toBlob(async blob => {
    if (!blob) {
      alert('Errore nella creazione del file immagine.');
      return;
    }
    const buffer = await blob.arrayBuffer();
    const fileName = 'diagrammi-piano-taglio-v1.36.png';
    const mime = 'image/png';

    try {
      const saveRes = await saveWithPicker({
        name: fileName,
        content: new Uint8Array(buffer),
        type: mime,
        description: 'Immagine Diagrammi Visivi',
        extension: '.png',
      });
      if (saveRes.cancelled) return;
      if (saveRes.supported) {
        onToast('Diagrammi Visivi esportati come immagine PNG.');
        return;
      }
    } catch (_) {}

    download(fileName, new Uint8Array(buffer), mime);
    onToast('Diagrammi Visivi esportati come immagine PNG.');
  }, 'image/png');
}
