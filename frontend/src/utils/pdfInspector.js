/**
 * PDF Inspector Utility
 * Helper to inspect PDF template structure
 */

import { PDFDocument } from 'pdf-lib';

export async function inspectPDFTemplate() {
  try {
    if (import.meta.env.DEV) { console.log('🔍 Inspecting PDF template...'); }
    
    // CRITICAL: Use absolute path from root
    const response = await fetch('/reports.pdf');
    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    if (import.meta.env.DEV) { console.log('📄 PDF Template Information:'); }
    if (import.meta.env.DEV) {

      if (import.meta.env.DEV) { console.log('  Total Pages:', pdfDoc.getPageCount()); }

    }
    
    // Check for form fields
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    if (import.meta.env.DEV) { console.log('  Form Fields:', fields.length); }
    
    if (fields.length > 0) {
      if (import.meta.env.DEV) { console.log('  📝 Available Form Fields:'); }
      fields.forEach(field => {
        const name = field.getName();
        const type = field.constructor.name;
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.log(`    - ${name} (${type})`); }

        }
      });
    } else {
      if (import.meta.env.DEV) { console.log('  ℹ️ No form fields found. Will need to position text manually.'); }
    }
    
    // Get page dimensions
    const pages = pdfDoc.getPages();
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      if (import.meta.env.DEV) { console.log(`  Page ${index + 1} Size: ${width} x ${height}`); }
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
    if (import.meta.env.DEV) { console.error('❌ Error inspecting PDF:', error); }
    throw error;
  }
}
