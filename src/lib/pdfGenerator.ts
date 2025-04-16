import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PdfOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: string;
  unit?: 'pt' | 'mm' | 'cm' | 'in';
  preview?: boolean;
}

/**
 * Generates a PDF from an HTML element
 * @param element The HTML element to convert to PDF
 * @param options PDF generation options
 * @returns A Promise that resolves to a string (data URL) if preview is true, otherwise void
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  options: PdfOptions = {}
): Promise<string | void> {
  const {
    filename = 'download.pdf',
    orientation = 'portrait',
    format = 'a4',
    unit = 'mm',
    preview = false
  } = options;

  // Create canvas from HTML element
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  // Initialize PDF document
  const pdf = new jsPDF(orientation, unit, format);

  // Get dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Calculate proper scaling to fit the content on the page
  const ratio = Math.min(pageWidth / canvasWidth, pageHeight / canvasHeight);
  const scaledWidth = canvasWidth * ratio;
  const scaledHeight = canvasHeight * ratio;
  const xOffset = (pageWidth - scaledWidth) / 2;
  const yOffset = (pageHeight - scaledHeight) / 2;

  // Add canvas image to PDF
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight);

  // Return preview URL or save the file
  if (preview) {
    return pdf.output('datauristring');
  } else {
    pdf.save(filename);
  }
}

/**
 * Generates a PDF for a quote
 * @param quoteId The ID of the quote
 * @param elementId The ID of the HTML element containing the quote template
 * @param options PDF generation options
 * @returns A Promise that resolves to a string (data URL) if preview is true, otherwise void
 */
export async function generateQuotePdf(
  quoteId: string,
  elementId: string,
  options: PdfOptions = {}
): Promise<string | void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID ${elementId} not found`);
  }

  const defaultOptions: PdfOptions = {
    filename: `quote-${quoteId}.pdf`,
    ...options
  };

  return generatePdfFromElement(element, defaultOptions);
}

/**
 * Generates a PDF for a job
 * @param jobId The ID of the job
 * @param elementId The ID of the HTML element containing the job template
 * @param options PDF generation options
 * @returns A Promise that resolves to a string (data URL) if preview is true, otherwise void
 */
export async function generateJobPdf(
  jobId: string,
  elementId: string,
  options: PdfOptions = {}
): Promise<string | void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID ${elementId} not found`);
  }

  const defaultOptions: PdfOptions = {
    filename: `job-${jobId}.pdf`,
    ...options
  };

  return generatePdfFromElement(element, defaultOptions);
} 