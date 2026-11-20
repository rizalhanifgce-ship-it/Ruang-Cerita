import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { VisitorRecord, LetterheadConfig } from '../types';
import { generatePrintableHTML, getLetterheadConfig } from './storage';

/**
 * Generates and downloads a clean, landscape A4 PDF document of the visitor records
 * using the existing print-friendly HTML & CSS layout (including custom Kop Surat & Logos).
 */
export async function downloadRecordsAsPDF(
  records: VisitorRecord[],
  filterDescription?: string,
  letterheadConfig?: LetterheadConfig,
  filenameSuffix?: string
): Promise<void> {
  const kop = letterheadConfig || getLetterheadConfig();
  const html = generatePrintableHTML(records, filterDescription, kop);

  // Create an offscreen iframe so the print-friendly CSS applies in complete isolation
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '1122px'; // A4 landscape @ 96dpi (~297mm)
  iframe.style.height = '794px';
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Tidak dapat mengakses dokumen pratinjau PDF.');
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Hide the interactive .no-print-bar inside the iframe before capturing
    const noPrintBar = iframeDoc.querySelector('.no-print-bar') as HTMLElement | null;
    if (noPrintBar) {
      noPrintBar.style.display = 'none';
    }

    // Ensure clean white print body padding
    iframeDoc.body.style.padding = '24px 32px';
    iframeDoc.body.style.background = '#ffffff';
    iframeDoc.body.style.width = '1122px';
    iframeDoc.body.style.boxSizing = 'border-box';

    // Wait for any images (left/right logos) to finish loading
    const images = Array.from(iframeDoc.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          })
      )
    );

    // Small tick for layout stabilization
    await new Promise((r) => setTimeout(r, 120));

    const targetEl = iframeDoc.body;
    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 1122,
      windowWidth: 1122,
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm
    const margin = 8; // mm
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Slice canvas across A4 landscape pages if taller than 1 page
    if (imgHeight <= contentHeight) {
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      const pageCanvasHeightPx = Math.floor((contentHeight / imgHeight) * canvas.height);
      let yOffsetPx = 0;
      let pageIndex = 0;

      while (yOffsetPx < canvas.height) {
        const sliceHeightPx = Math.min(pageCanvasHeightPx, canvas.height - yOffsetPx);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            yOffsetPx,
            canvas.width,
            sliceHeightPx,
            0,
            0,
            canvas.width,
            sliceHeightPx
          );
        }

        const sliceImgData = pageCanvas.toDataURL('image/png');
        const sliceImgHeightMm = (sliceHeightPx * imgWidth) / canvas.width;

        if (pageIndex > 0) {
          pdf.addPage();
        }
        pdf.addImage(sliceImgData, 'PNG', margin, margin, imgWidth, sliceImgHeightMm, undefined, 'FAST');

        yOffsetPx += sliceHeightPx;
        pageIndex += 1;
      }
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const suffix = filenameSuffix ? `_${filenameSuffix}` : '';
    pdf.save(`rekap_ruang_cerita_madrasah_${dateStr}${suffix}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}
