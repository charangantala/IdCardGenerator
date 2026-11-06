import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Downloads a DOM element as a high-resolution PNG (3x pixel ratio).
 * @param {HTMLElement} element - The ID card DOM element
 * @param {string} filename - Output file name
 */
export async function downloadCardAsPng(element, filename = 'id-card.png') {
  if (!element) throw new Error('Card element is missing');

  try {
    const dataUrl = await htmlToImage.toPng(element, {
      pixelRatio: 3, // Ultra-sharp 300 DPI equivalent
      cacheBust: true,
      skipFonts: false,
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Failed to export PNG:', error);
    throw error;
  }
}

/**
 * Downloads a DOM element as a standard CR-80 printable PDF.
 * CR-80 ISO standard card size: 85.6 mm x 54 mm.
 * @param {HTMLElement} element - The ID card DOM element
 * @param {string} filename - Output file name
 * @param {'vertical'|'horizontal'} layout - Layout orientation
 */
export async function downloadCardAsPdf(
  element,
  filename = 'id-card.pdf',
  layout = 'vertical'
) {
  if (!element) throw new Error('Card element is missing');

  try {
    const dataUrl = await htmlToImage.toPng(element, {
      pixelRatio: 3,
      cacheBust: true,
    });

    const cardWidthMm = 54;
    const cardHeightMm = 85.6;
    const isHorizontal = layout === 'horizontal';

    const pdf = new jsPDF({
      orientation: isHorizontal ? 'landscape' : 'portrait',
      unit: 'mm',
      format: isHorizontal ? [cardHeightMm, cardWidthMm] : [cardWidthMm, cardHeightMm],
    });

    const pdfWidth = isHorizontal ? cardHeightMm : cardWidthMm;
    const pdfHeight = isHorizontal ? cardWidthMm : cardHeightMm;

    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  }
}

/**
 * Batch exports an array of card DOM elements into a single multi-page PDF document.
 * @param {Array<HTMLElement>} elements - Array of card DOM elements
 * @param {string} filename - Output file name
 * @param {'vertical'|'horizontal'} layout - Orientation
 * @param {Function} onProgress - Progress callback (index, total)
 */
export async function downloadBatchCardsAsPdf(
  elements = [],
  filename = 'batch_approved_id_cards.pdf',
  layout = 'vertical',
  onProgress
) {
  if (!elements.length) throw new Error('No card elements found for batch PDF export');

  const cardWidthMm = 54;
  const cardHeightMm = 85.6;
  const isHorizontal = layout === 'horizontal';

  const pdf = new jsPDF({
    orientation: isHorizontal ? 'landscape' : 'portrait',
    unit: 'mm',
    format: isHorizontal ? [cardHeightMm, cardWidthMm] : [cardWidthMm, cardHeightMm],
  });

  const pdfWidth = isHorizontal ? cardHeightMm : cardWidthMm;
  const pdfHeight = isHorizontal ? cardWidthMm : cardHeightMm;

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (onProgress) onProgress(i + 1, elements.length);

    const dataUrl = await htmlToImage.toPng(el, {
      pixelRatio: 2.5,
      cacheBust: true,
    });

    if (i > 0) {
      pdf.addPage(
        isHorizontal ? [cardHeightMm, cardWidthMm] : [cardWidthMm, cardHeightMm],
        isHorizontal ? 'landscape' : 'portrait'
      );
    }

    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
  }

  pdf.save(filename);
  return true;
}
