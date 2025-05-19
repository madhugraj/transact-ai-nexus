
import * as pdfjs from 'pdfjs-dist';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  const pdfjsWorker = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url);
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker.toString();
}

/**
 * Render a PDF page to canvas and return as base64 image
 */
export const renderPageToImage = async (page: any, scale = 1.5): Promise<string> => {
  // Render the page to a canvas
  const viewport = page.getViewport({ scale }); // Higher scale for better quality
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Could not create canvas context');
  }
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  // Convert canvas to base64 image
  return canvas.toDataURL('image/png').split(',')[1];
};

/**
 * Load a PDF document from array buffer
 */
export const loadPdfDocument = async (arrayBuffer: ArrayBuffer): Promise<any> => {
  return await pdfjs.getDocument({ data: arrayBuffer }).promise;
};
