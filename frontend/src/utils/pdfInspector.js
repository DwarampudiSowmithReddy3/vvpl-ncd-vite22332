/**
 * PDF Inspector Utility
 * Helper to inspect PDF template structure
 */

import { PDFDocument } from 'pdf-lib';

export async function inspectPDFTemplate() {
  try {
    
    // CRITICAL: Use absolute path from root
    const response = await fetch('/reports.pdf');
    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    if (import.meta.env.DEV) {

      // Log removed

    }
    
    // Check for form fields
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    if (fields.length > 0) {
      fields.forEach(field => {
        const name = field.getName();
        const type = field.constructor.name;
        if (import.meta.env.DEV) {

          // Log removed

        }
      });
    } else {
    }
    
    // Get page dimensions
    const pages = pdfDoc.getPages();
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
    });
    
    return {
      pageCount: pdfDoc.getPageCount(),
      hasFormFields: fields.length > 0,
      formFields: fields.map(f => ({
        name: f.getName(),
        type: f.constructor.name
      })),
      pages: pages.map(p => {
        const { width, height } = p.getSize();
        return { width, height };
      })
    };
    
  } catch (error) {
    throw error;
  }
}

