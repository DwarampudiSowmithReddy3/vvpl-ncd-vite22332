/**
 * PDF Template Service
 * Fills data into the existing PDF template (reports.pdf)
 * 
 * CRITICAL: Path uses '/reports.pdf' which works in both:
 * - Development: Vite serves from /public folder
 * - Production: Files in /public are copied to dist root
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * PROFESSIONAL PDF STYLING CONFIGURATION
 * Based on institutional standards (Big Four, Top Banks)
 * 
 * Key Principles:
 * 1. Typography Hierarchy - Different sizes for different importance
 * 2. White Space - Generous margins and spacing for readability
 * 3. Alignment - Numbers right-aligned, text left-aligned
 * 4. Minimalist Design - Horizontal lines only, no vertical grid
 * 5. Professional Colors - Subtle, not loud
 */
const PROFESSIONAL_STYLES = {
  // TYPOGRAPHY (A4 Report Standards)
  fonts: {
    reportTitle: { size: 20, bold: true },      // Main report title
    sectionHeader: { size: 12, bold: true },    // Section headers
    subsectionHeader: { size: 11, bold: true }, // Subsection headers
    tableHeader: { size: 9, bold: true },       // Table column headers
    bodyText: { size: 10, bold: false },        // Regular text
    tableData: { size: 9, bold: false },        // Table cell data
    caption: { size: 7, bold: false },          // Captions, footers
    metadata: { size: 9, bold: false },         // Date, period info
  },
  
  // COLORS (Professional Palette)
  colors: {
    primary: rgb(0.1, 0.1, 0.1),        // Almost black - titles
    secondary: rgb(0.2, 0.2, 0.2),      // Dark gray - section headers
    bodyText: rgb(0.3, 0.3, 0.3),       // Medium gray - body text
    lightText: rgb(0.5, 0.5, 0.5),      // Light gray - metadata
    tableBorder: rgb(0.7, 0.7, 0.7),    // Light gray - table lines
    accentBlue: rgb(0.2, 0.4, 0.7),     // Professional blue
    successGreen: rgb(0.2, 0.6, 0.3),   // Success/positive
    warningOrange: rgb(0.9, 0.5, 0.1),  // Warning/attention
    errorRed: rgb(0.8, 0.2, 0.2),       // Error/negative
  },
  
  // SPACING & LAYOUT (in points)
  spacing: {
    pageMargin: 72,              // 1 inch = 72 points (professional standard)
    sectionGap: 30,              // Space between major sections
    paragraphGap: 12,            // Space after paragraphs
    lineHeight: 1.25,            // Line spacing multiplier
    tableRowHeight: 18,          // Standard table row height
    tableHeaderPadding: 8,       // Padding in table headers
    tableCellPadding: 4,         // Padding in table cells
  },
  
  // TABLE STYLING
  table: {
    headerBorderThickness: 1.5,  // Thicker line under headers
    rowBorderThickness: 0.3,     // Thin lines between rows
    alternateRowShade: false,    // No zebra striping (too casual)
    minColumnWidth: 80,          // Minimum column width
  },
  
  // PAGE LAYOUT
  layout: {
    headerHeight: 100,           // Space reserved for header
    footerHeight: 80,            // Space reserved for footer
    contentStartY: 720,          // Where content starts (A4 height - header)
    minBottomMargin: 100,        // Minimum space at bottom before new page
  }
};

class PDFTemplateService {
  constructor() {
    // CRITICAL: Use absolute path from root, NOT relative path
    // This works in both development and production
    this.templatePath = '/reports.pdf';
    this.styles = PROFESSIONAL_STYLES;
  }

  /**
   * Get Y position for content start (below header)
   * @param {number} pageHeight - Page height
   * @returns {number} - Y position to start content
   */
  getContentStartY(pageHeight) {
    return pageHeight - this.styles.layout.headerHeight - this.styles.spacing.pageMargin;
  }

  /**
   * Check if we need a new page
   * @param {number} currentY - Current Y position
   * @returns {boolean} - True if new page needed
   */
  needsNewPage(currentY) {
    return currentY < this.styles.layout.minBottomMargin;
  }

  /**
   * Draw professional table header
   * @param {PDFPage} page - Page to draw on
   * @param {Array} headers - Header labels
   * @param {Array} columnX - X positions for columns
   * @param {Array} columnWidths - Width of each column
   * @param {Array} alignments - Alignment for each column ('left' or 'right')
   * @param {number} yPos - Y position
   * @param {PDFFont} boldFont - Bold font
   * @param {number} pageWidth - Page width
   * @returns {number} - New Y position after header
   */
  drawTableHeader(page, headers, columnX, columnWidths, alignments, yPos, boldFont, pageWidth) {
    const styles = this.styles;
    
    // Draw header text
    headers.forEach((header, index) => {
      const alignment = alignments[index] || 'left';
      let xPos = columnX[index];
      
      // Right-align if specified
      if (alignment === 'right' && columnWidths[index]) {
        const textWidth = boldFont.widthOfTextAtSize(header, styles.fonts.tableHeader.size);
        xPos = columnX[index] + columnWidths[index] - textWidth;
      }
      
      page.drawText(header, {
        x: xPos,
        y: yPos,
        size: styles.fonts.tableHeader.size,
        font: boldFont,
        color: styles.colors.secondary,
      });
    });
    
    yPos -= styles.spacing.tableHeaderPadding;
    
    // Draw thick horizontal line under headers
    page.drawLine({
      start: { x: styles.spacing.pageMargin, y: yPos },
      end: { x: pageWidth - styles.spacing.pageMargin, y: yPos },
      thickness: styles.table.headerBorderThickness,
      color: styles.colors.tableBorder,
    });
    
    return yPos - styles.spacing.tableHeaderPadding;
  }

  /**
   * Draw professional table row
   * @param {PDFPage} page - Page to draw on
   * @param {Array} rowData - Data for the row
   * @param {Array} columnX - X positions for columns
   * @param {Array} columnWidths - Width of each column
   * @param {Array} alignments - Alignment for each column
   * @param {number} yPos - Y position
   * @param {PDFFont} font - Regular font
   * @param {number} pageWidth - Page width
   * @param {boolean} drawBottomLine - Whether to draw line after row
   * @returns {number} - New Y position after row
   */
  drawTableRow(page, rowData, columnX, columnWidths, alignments, yPos, font, pageWidth, drawBottomLine = true) {
    const styles = this.styles;
    
    // Draw row data
    rowData.forEach((data, index) => {
      const alignment = alignments[index] || 'left';
      let xPos = columnX[index];
      const text = String(data || '');
      
      // Right-align if specified (typically for numbers)
      if (alignment === 'right' && columnWidths[index]) {
        const textWidth = font.widthOfTextAtSize(text, styles.fonts.tableData.size);
        xPos = columnX[index] + columnWidths[index] - textWidth;
      }
      
      page.drawText(text, {
        x: xPos,
        y: yPos,
        size: styles.fonts.tableData.size,
        font: font,
        color: styles.colors.bodyText,
      });
    });
    
    yPos -= styles.spacing.tableRowHeight;
    
    // Draw thin horizontal line after row
    if (drawBottomLine) {
      page.drawLine({
        start: { x: styles.spacing.pageMargin, y: yPos + 2 },
        end: { x: pageWidth - styles.spacing.pageMargin, y: yPos + 2 },
        thickness: styles.table.rowBorderThickness,
        color: styles.colors.tableBorder,
      });
    }
    
    return yPos;
  }

  /**
   * Format currency for display (right-aligned)
   * @param {number} amount - Amount to format
   * @returns {string} - Formatted currency string
   */
  formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0.00';
    return Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Load the PDF template
   * @returns {Promise<PDFDocument>}
   */
  async loadTemplate() {
    try {
      if (import.meta.env.DEV) { console.log('📄 Loading PDF template from:', this.templatePath); }
      
      // Fetch the template PDF
      const response = await fetch(this.templatePath);
      
      if (!response.ok) {
        throw new Error(`Failed to load PDF template: ${response.status} ${response.statusText}`);
      }
      
      const existingPdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      if (import.meta.env.DEV) { console.log('✅ PDF template loaded successfully'); }
      if (import.meta.env.DEV) {

        if (import.meta.env.DEV) { console.log(`   Pages: ${pdfDoc.getPageCount()}`); }

      }
      
      return pdfDoc;
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error loading PDF template:', error); }
      throw new Error(`Failed to load PDF template: ${error.message}`);
    }
  }

  /**
   * Add a new page with company header/footer template
   * Creates a page that looks like the template but without report content
   * @param {PDFDocument} pdfDoc - PDF document  
   * @param {PDFPage} templatePage - Template page for dimensions
   * @param {PDFFont} font - Regular font
   * @param {PDFFont} boldFont - Bold font
   * @returns {PDFPage} - New page with header/footer
   */
  async addPageWithTemplate(pdfDoc, templatePage, font, boldFont) {
    // Strategy: Copy the first page of the ORIGINAL template (before any content was added)
    // This preserves the logo, yellow line, and all template styling
    
    // Load a fresh copy of the template
    const response = await fetch(this.templatePath);
    const templateBytes = await response.arrayBuffer();
    const freshTemplatePdf = await PDFDocument.load(templateBytes);
    
    // Copy the first page from the fresh template
    const [copiedPage] = await pdfDoc.copyPages(freshTemplatePdf, [0]);
    const newPage = pdfDoc.addPage(copiedPage);
    
    return newPage;
  }

  /**
   * Truncate text to a maximum length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} - Truncated text
   */
  truncateText(text, maxLength) {
    if (!text) return '';
    const str = String(text);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  /**
   * Draw company header and footer on a page
   * @param {PDFPage} page - Page to draw on
   * @param {PDFFont} font - Font to use
   * @param {PDFFont} boldFont - Bold font to use
   * @param {number} width - Page width
   * @param {number} height - Page height
   */
  async drawTemplateHeaderFooter(page, font, boldFont, width, height) {
    // Draw top border line
    page.drawLine({
      start: { x: 50, y: height - 70 },
      end: { x: width - 50, y: height - 70 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    // Draw company name in header
    page.drawText('Vaibhav Vyapaar Private Limited', {
      x: 50,
      y: height - 50,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    // Draw bottom border line
    page.drawLine({
      start: { x: 50, y: 70 },
      end: { x: width - 50, y: 70 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    // Draw footer - Company details
    page.drawText('Vaibhav Vyapaar Private Limited', {
      x: width / 2 - 80,
      y: 50,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    const footerText = 'Registered Address: 16, Rabindra Sarani, Poddar Court, 3rd Floor, Gate No.3, Office Room No. 329, Kolkata - 700 001, West Bengal';
    page.drawText(footerText, {
      x: 50,
      y: 35,
      size: 6,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    const contactText = 'Website: www.vaibhavvyapaar.com  |  CIN: U74999WB2021PTC247XXX  |  Email: info@vaibhavvyapaar.com';
    page.drawText(contactText, {
      x: 50,
      y: 25,
      size: 6,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  /**
   * Fill Monthly Collection Report data into template
   * Handles multi-page reports automatically
   * @param {Object} data - Report data from backend
   * @returns {Promise<Uint8Array>} - Filled PDF bytes
   */
  async fillMonthlyCollectionReport(data) {
    try {
      const pdfDoc = await this.loadTemplate();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      // Load fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      if (import.meta.env.DEV) { console.log('📝 Filling Monthly Collection Report data...'); }
      if (import.meta.env.DEV) { console.log('📊 Investment records:', data.investment_details?.length || 0); }
      if (import.meta.env.DEV) { console.log('📐 Page dimensions:', width, 'x', height); }
      
      let currentPage = firstPage;
      // Start below the template header (logo, company info, etc.)
      let yPos = height - 180;
      
      // Report Title - positioned below template header
      currentPage.drawText('Monthly Collection Report', {
        x: 50,
        y: yPos,
        size: 18,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      yPos -= 30;
      
      // Report Period
      currentPage.drawText(`Period: ${data.reportPeriod || 'N/A'}`, {
        x: 50,
        y: yPos,
        size: 11,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPos -= 20;
      
      currentPage.drawText(`Generated: ${data.generatedDate || new Date().toLocaleDateString('en-GB')}`, {
        x: 50,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPos -= 40;
      
      // Collection Summary Section
      if (data.summary) {
        currentPage.drawText('Collection Summary', {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        currentPage.drawText(`Total Funds Raised: Rs. ${data.summary.total_funds_raised?.toLocaleString('en-IN') || '0'}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 20;
        
        currentPage.drawText(`Investment This Period: Rs. ${data.summary.total_investment_this_month?.toLocaleString('en-IN') || '0'}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 20;
        
        currentPage.drawText(`Collection Rate: ${data.summary.fulfillment_percentage?.toFixed(2) || '0'}%`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 35;
      }
      
      // Series-wise Breakdown Section
      if (data.series_breakdown && data.series_breakdown.length > 0) {
        // Check if we need a new page
        if (yPos < 220) {
          currentPage = pdfDoc.addPage([width, height]);
          yPos = height - 180;
        }
        
        currentPage.drawText('Series-wise Collection Breakdown', {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        // Table headers for series breakdown
        const seriesHeaders = ['Series', 'Target', 'Collected', 'Achievement', 'Investors'];
        const seriesColumnX = [50, 180, 290, 400, 500];
        const seriesRowHeight = 20;
        
        // Draw headers
        seriesHeaders.forEach((header, index) => {
          currentPage.drawText(header, {
            x: seriesColumnX[index],
            y: yPos,
            size: 10,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        yPos -= 5;
        
        // Draw horizontal line under headers
        currentPage.drawLine({
          start: { x: 50, y: yPos },
          end: { x: width - 50, y: yPos },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPos -= 15;
        
        // Draw series breakdown rows
        data.series_breakdown.forEach((series) => {
          // Check if we need a new page
          if (yPos < 130) {
            currentPage = pdfDoc.addPage([width, height]);
            yPos = height - 180;
            
            // Redraw headers on new page
            currentPage.drawText('Series-wise Collection Breakdown (continued)', {
              x: 50,
              y: yPos,
              size: 14,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 25;
            
            seriesHeaders.forEach((header, idx) => {
              currentPage.drawText(header, {
                x: seriesColumnX[idx],
                y: yPos,
                size: 10,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 5;
            
            currentPage.drawLine({
              start: { x: 50, y: yPos },
              end: { x: width - 50, y: yPos },
              thickness: 0.5,
              color: rgb(0.5, 0.5, 0.5),
            });
            yPos -= 15;
          }
          
          // Series name and code
          const seriesName = `${series.series_code || ''} - ${(series.series_name || '').substring(0, 15)}`;
          currentPage.drawText(seriesName, {
            x: seriesColumnX[0],
            y: yPos,
            size: 9,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
          });
          
          // Target amount
          currentPage.drawText(`Rs. ${series.target_amount?.toLocaleString('en-IN') || '0'}`, {
            x: seriesColumnX[1],
            y: yPos,
            size: 9,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
          });
          
          // Collected amount
          currentPage.drawText(`Rs. ${series.collected_amount?.toLocaleString('en-IN') || '0'}`, {
            x: seriesColumnX[2],
            y: yPos,
            size: 9,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
          });
          
          // Achievement percentage with visual bar
          const achievement = series.achievement_percentage || 0;
          currentPage.drawText(`${achievement.toFixed(1)}%`, {
            x: seriesColumnX[3],
            y: yPos,
            size: 9,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
          });
          
          // Draw visual progress bar (50px wide)
          const barWidth = 50;
          const barHeight = 8;
          const filledWidth = Math.min((achievement / 100) * barWidth, barWidth);
          
          // Background bar (light gray)
          currentPage.drawRectangle({
            x: seriesColumnX[3] + 45,
            y: yPos - 2,
            width: barWidth,
            height: barHeight,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 0.5,
            color: rgb(0.95, 0.95, 0.95),
          });
          
          // Filled bar (blue gradient based on achievement)
          if (filledWidth > 0) {
            const barColor = achievement >= 100 
              ? rgb(0.2, 0.7, 0.3)  // Green for 100%+
              : achievement >= 75 
                ? rgb(0.2, 0.5, 0.8)  // Blue for 75%+
                : achievement >= 50 
                  ? rgb(0.9, 0.7, 0.2)  // Yellow for 50%+
                  : rgb(0.9, 0.4, 0.2);  // Orange for <50%
            
            currentPage.drawRectangle({
              x: seriesColumnX[3] + 45,
              y: yPos - 2,
              width: filledWidth,
              height: barHeight,
              color: barColor,
            });
          }
          
          // Investor count
          currentPage.drawText(String(series.investor_count || 0), {
            x: seriesColumnX[4],
            y: yPos,
            size: 9,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
          });
          
          yPos -= seriesRowHeight;
        });
        
        yPos -= 25;
      }
      
      // Investment Details Table
      if (data.investment_details && data.investment_details.length > 0) {
        currentPage.drawText(`Investment Details (${data.total_records} Records)`, {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        // Table headers with better spacing
        const headers = ['Investor ID', 'Name', 'Series', 'Amount', 'Date'];
        const columnX = [50, 160, 290, 400, 510];
        const rowHeight = 18;
        const minYPos = 100;
        
        // Draw table headers
        headers.forEach((header, index) => {
          currentPage.drawText(header, {
            x: columnX[index],
            y: yPos,
            size: 10,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        yPos -= 5;
        
        // Draw horizontal line under headers
        currentPage.drawLine({
          start: { x: 50, y: yPos },
          end: { x: width - 50, y: yPos },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPos -= 15;
        
        // Draw table rows
        data.investment_details.forEach((investment, index) => {
          // Check if we need a new page
          if (yPos < minYPos) {
            // Add new page
            currentPage = pdfDoc.addPage([width, height]);
            yPos = height - 180;
            
            // Redraw table headers on new page
            currentPage.drawText('Investment Details (continued)', {
              x: 50,
              y: yPos,
              size: 14,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 25;
            
            headers.forEach((header, idx) => {
              currentPage.drawText(header, {
                x: columnX[idx],
                y: yPos,
                size: 10,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 5;
            
            currentPage.drawLine({
              start: { x: 50, y: yPos },
              end: { x: width - 50, y: yPos },
              thickness: 0.5,
              color: rgb(0.5, 0.5, 0.5),
            });
            yPos -= 15;
          }
          
          // Draw row data with proper spacing
          const rowData = [
            investment.investor_id || '',
            (investment.investor_name || '').substring(0, 18),
            investment.series_code || '',
            `Rs. ${investment.amount?.toLocaleString('en-IN') || '0'}`,
            investment.date_received || ''
          ];
          
          rowData.forEach((data, idx) => {
            currentPage.drawText(String(data), {
              x: columnX[idx],
              y: yPos,
              size: 9,
              font: font,
              color: rgb(0.3, 0.3, 0.3),
            });
          });
          
          yPos -= rowHeight;
        });
        
        yPos -= 25;
      }
      
      // Investor Analytics Section
      if (data.investor_statistics) {
        // Check if we need a new page for investor stats
        if (yPos < 170) {
          currentPage = pdfDoc.addPage([width, height]);
          yPos = height - 180;
        }
        
        currentPage.drawText('Investor Analytics', {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        currentPage.drawText(`New Investors: ${data.investor_statistics.new_investors || 0}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 20;
        
        currentPage.drawText(`Returning Investors: ${data.investor_statistics.returning_investors || 0}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 20;
        
        currentPage.drawText(`Retention Rate: ${data.investor_statistics.retention_rate?.toFixed(2) || '0'}%`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
      
      // Add page numbers to all pages (positioned to not overlap with template footer)
      const totalPages = pdfDoc.getPageCount();
      for (let i = 0; i < totalPages; i++) {
        const page = pdfDoc.getPages()[i];
        page.drawText(`Page ${i + 1} of ${totalPages}`, {
          x: width - 100,
          y: 50, // Position above template footer
          size: 9,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
      
      if (import.meta.env.DEV) { console.log('✅ Data filled successfully'); }
      if (import.meta.env.DEV) { console.log(`📄 Total pages: ${totalPages}`); }
      
      // Save and return the PDF bytes
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error filling PDF template:', error); }
      throw error;
    }
  }

  /**
   * Fill Payout Statement Report data into template
   * @param {Object} data - Report data from backend
   * @param {Object} chartImages - Chart images as base64 data URLs
   * @returns {Promise<Uint8Array>} - Filled PDF bytes
   */
  async fillPayoutStatementReport(data, chartImages = {}) {
    try {
      const pdfDoc = await this.loadTemplate();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      if (import.meta.env.DEV) { console.log('📝 Filling Payout Statement Report data...'); }
      
      let currentPage = firstPage;
      let yPos = height - 180;
      
      // Report Title
      currentPage.drawText('Payout Statement Report', {
        x: 50,
        y: yPos,
        size: 18,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      yPos -= 30;
      
      // Report Period
      currentPage.drawText(`Period: ${data.from_date || 'N/A'} to ${data.to_date || 'N/A'}`, {
        x: 50,
        y: yPos,
        size: 11,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPos -= 20;
      
      currentPage.drawText(`Generated: ${new Date().toLocaleDateString('en-GB')}`, {
        x: 50,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPos -= 40;
      
      // Payout Summary Section
      currentPage.drawText('Payout Summary', {
        x: 50,
        y: yPos,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 25;
      
      if (data.summary) {
        const completionRate = data.summary.total_payout > 0 
          ? ((data.summary.paid_amount / data.summary.total_payout) * 100).toFixed(2)
          : '0.00';
        
        currentPage.drawText(`Total Payout Amount: Rs. ${data.summary.total_payout?.toLocaleString('en-IN') || '0'}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
        });
        yPos -= 20;
        
        currentPage.drawText(`Amount Paid: Rs. ${data.summary.paid_amount?.toLocaleString('en-IN') || '0'}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0, 0.5, 0),
        });
        yPos -= 20;
        
        currentPage.drawText(`Amount To Be Paid: Rs. ${data.summary.to_be_paid_amount?.toLocaleString('en-IN') || '0'}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0.8, 0.4, 0),
        });
        yPos -= 20;
        
        currentPage.drawText(`Completion Rate: ${completionRate}%`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0, 0.3, 0.8),
        });
        yPos -= 30;
      }
      
      // Series-wise Breakdown Section
      if (data.series_breakdown && data.series_breakdown.length > 0) {
        if (yPos < 220) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180; // Start below template header
        }
        
        currentPage.drawText('Series-wise Breakdown', {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 30;
        
        // Table headers
        currentPage.drawText('Series', { x: 50, y: yPos, size: 10, font: boldFont });
        currentPage.drawText('Total', { x: 150, y: yPos, size: 10, font: boldFont });
        currentPage.drawText('Paid', { x: 250, y: yPos, size: 10, font: boldFont });
        currentPage.drawText('Pending', { x: 350, y: yPos, size: 10, font: boldFont });
        currentPage.drawText('Investors', { x: 470, y: yPos, size: 10, font: boldFont });
        yPos -= 20;
        
        for (const series of data.series_breakdown) {
          if (yPos < 130) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180; // Start below template header
            // Redraw headers on new page
            currentPage.drawText('Series-wise Breakdown (continued)', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 25;
            currentPage.drawText('Series', { x: 50, y: yPos, size: 10, font: boldFont });
            currentPage.drawText('Total', { x: 150, y: yPos, size: 10, font: boldFont });
            currentPage.drawText('Paid', { x: 250, y: yPos, size: 10, font: boldFont });
            currentPage.drawText('Pending', { x: 350, y: yPos, size: 10, font: boldFont });
            currentPage.drawText('Investors', { x: 470, y: yPos, size: 10, font: boldFont });
            yPos -= 20;
          }
          
          currentPage.drawText(series.series_code || '', { x: 50, y: yPos, size: 9, font: font });
          currentPage.drawText(`Rs. ${series.total_payout?.toLocaleString('en-IN') || '0'}`, { x: 150, y: yPos, size: 9, font: font });
          currentPage.drawText(`Rs. ${series.paid_amount?.toLocaleString('en-IN') || '0'}`, { x: 250, y: yPos, size: 9, font: font });
          currentPage.drawText(`Rs. ${series.pending_amount?.toLocaleString('en-IN') || '0'}`, { x: 350, y: yPos, size: 9, font: font });
          currentPage.drawText(`${series.investor_count || 0}`, { x: 470, y: yPos, size: 9, font: font });
          yPos -= 18;
        }
        
        yPos -= 20;
      }
      
      // Payout Details Section
      if (data.payout_details && data.payout_details.length > 0) {
        if (yPos < 220) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180; // Start below template header
        }
        
        currentPage.drawText(`Payout Details (${data.payout_details.length} Records)`, {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 30;
        
        // Table headers
        currentPage.drawText('Investor', { x: 50, y: yPos, size: 9, font: boldFont });
        currentPage.drawText('Series', { x: 120, y: yPos, size: 9, font: boldFont });
        currentPage.drawText('Amount', { x: 200, y: yPos, size: 9, font: boldFont });
        currentPage.drawText('Status', { x: 290, y: yPos, size: 9, font: boldFont });
        currentPage.drawText('Bank', { x: 360, y: yPos, size: 9, font: boldFont });
        currentPage.drawText('Account', { x: 460, y: yPos, size: 9, font: boldFont });
        yPos -= 20;
        
        for (const payout of data.payout_details) {
          if (yPos < 130) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180; // Start below template header
            // Redraw headers on new page
            currentPage.drawText('Payout Details (continued)', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 25;
            currentPage.drawText('Investor', { x: 50, y: yPos, size: 9, font: boldFont });
            currentPage.drawText('Series', { x: 120, y: yPos, size: 9, font: boldFont });
            currentPage.drawText('Amount', { x: 200, y: yPos, size: 9, font: boldFont });
            currentPage.drawText('Status', { x: 290, y: yPos, size: 9, font: boldFont });
            currentPage.drawText('Bank', { x: 360, y: yPos, size: 9, font: boldFont });
            currentPage.drawText('Account', { x: 460, y: yPos, size: 9, font: boldFont });
            yPos -= 20;
          }
          
          currentPage.drawText(payout.investor_id || '', { x: 50, y: yPos, size: 8, font: font });
          currentPage.drawText(payout.series_code || '', { x: 120, y: yPos, size: 8, font: font });
          currentPage.drawText(`Rs. ${payout.amount?.toLocaleString('en-IN') || '0'}`, { x: 200, y: yPos, size: 8, font: font });
          currentPage.drawText(payout.status || '', { x: 290, y: yPos, size: 8, font: font });
          currentPage.drawText((payout.bank_name || '').substring(0, 12), { x: 360, y: yPos, size: 8, font: font });
          currentPage.drawText((payout.account_number || '').substring(0, 12), { x: 460, y: yPos, size: 8, font: font });
          yPos -= 16;
        }
        
        yPos -= 20;
      }
      
      // Status Breakdown Section (for reference, not a chart)
      if (data.status_breakdown && data.status_breakdown.length > 0) {
        if (yPos < 170) {
          currentPage = pdfDoc.addPage([width, height]);
          yPos = height - 180;
        }
        
        currentPage.drawText('Status Breakdown', {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        data.status_breakdown.forEach((status) => {
          if (yPos < 130) {
            currentPage = pdfDoc.addPage([width, height]);
            yPos = height - 180;
          }
          
          currentPage.drawText(`${status.status}: ${status.count} payouts (Rs. ${status.total_amount?.toLocaleString('en-IN') || '0'})`, {
            x: 70,
            y: yPos,
            size: 10,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
          });
          yPos -= 18;
        });
        
        yPos -= 20;
      }
      
      // Monthly Trend Section (for reference, not a chart)
      if (data.monthly_trend && data.monthly_trend.length > 0) {
        if (yPos < 170) {
          currentPage = pdfDoc.addPage([width, height]);
          yPos = height - 180;
        }
        
        currentPage.drawText('Monthly Trend', {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        data.monthly_trend.forEach((month) => {
          if (yPos < 130) {
            currentPage = pdfDoc.addPage([width, height]);
            yPos = height - 180;
          }
          
          currentPage.drawText(`${month.month}: Rs. ${month.total_amount?.toLocaleString('en-IN') || '0'} (Paid: Rs. ${month.paid_amount?.toLocaleString('en-IN') || '0'})`, {
            x: 70,
            y: yPos,
            size: 10,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
          });
          yPos -= 18;
        });
      }
      
      // Embed Chart Images on Page 3 if available
      if (chartImages && Object.keys(chartImages).length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Embedding chart images into PDF...'); }
        
        // Create a new page dedicated to charts (Page 3)
        currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
        yPos = height - 180; // Start below template header
        
        // Page title
        currentPage.drawText('Visual Analytics', {
          x: 50,
          y: yPos,
          size: 16,
          font: boldFont,
          color: rgb(0.1, 0.1, 0.1),
        });
        yPos -= 40;
        
        // Pie Chart - Status Distribution
        if (chartImages.pieChart) {
          currentPage.drawText('Status Distribution', {
            x: 50,
            y: yPos,
            size: 12,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
          yPos -= 25;
          
          try {
            const pieImageBytes = await fetch(chartImages.pieChart).then(res => res.arrayBuffer());
            const pieImage = await pdfDoc.embedPng(pieImageBytes);
            
            // Scale to fit width (max 480px wide to leave margins)
            const maxWidth = 480;
            const scale = maxWidth / pieImage.width;
            const pieWidth = pieImage.width * scale;
            const pieHeight = pieImage.height * scale;
            
            // Check if chart will fit on current page (need space above footer at y=100)
            if (yPos - pieHeight < 130) {
              currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
              yPos = height - 180;
              currentPage.drawText('Status Distribution', {
                x: 50,
                y: yPos,
                size: 12,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
              yPos -= 25;
            }
            
            currentPage.drawImage(pieImage, {
              x: (width - pieWidth) / 2, // Center horizontally
              y: yPos - pieHeight,
              width: pieWidth,
              height: pieHeight,
            });
            
            yPos -= pieHeight + 20;
            if (import.meta.env.DEV) { console.log('✅ Pie chart embedded'); }
          } catch (error) {
            if (import.meta.env.DEV) { console.warn('⚠️ Could not embed pie chart:', error); }
            currentPage.drawText('(Pie chart could not be rendered)', {
              x: 50,
              y: yPos,
              size: 10,
              font: font,
              color: rgb(0.5, 0.5, 0.5),
            });
            yPos -= 25;
          }
        }
        
        // Check if we need a new page for remaining charts
        if (yPos < 300) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180; // Start below template header
        }
        
        // Bar Chart - Series-wise Comparison
        if (chartImages.barChart) {
          currentPage.drawText('Series-wise Payout Comparison', {
            x: 50,
            y: yPos,
            size: 12,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
          yPos -= 25;
          
          try {
            const barImageBytes = await fetch(chartImages.barChart).then(res => res.arrayBuffer());
            const barImage = await pdfDoc.embedPng(barImageBytes);
            
            // Scale to fit width (max 480px wide to leave margins)
            const maxWidth = 480;
            const scale = maxWidth / barImage.width;
            const barWidth = barImage.width * scale;
            const barHeight = barImage.height * scale;
            
            // Check if chart will fit on current page (need space above footer at y=100)
            if (yPos - barHeight < 130) {
              currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
              yPos = height - 180;
              currentPage.drawText('Series-wise Payout Comparison', {
                x: 50,
                y: yPos,
                size: 12,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
              yPos -= 25;
            }
            
            currentPage.drawImage(barImage, {
              x: (width - barWidth) / 2, // Center horizontally
              y: yPos - barHeight,
              width: barWidth,
              height: barHeight,
            });
            
            yPos -= barHeight + 20;
            if (import.meta.env.DEV) { console.log('✅ Bar chart embedded'); }
          } catch (error) {
            if (import.meta.env.DEV) { console.warn('⚠️ Could not embed bar chart:', error); }
            currentPage.drawText('(Bar chart could not be rendered)', {
              x: 50,
              y: yPos,
              size: 10,
              font: font,
              color: rgb(0.5, 0.5, 0.5),
            });
            yPos -= 25;
          }
        }
        
        // Check if we need a new page for line chart
        if (yPos < 300) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180; // Start below template header
        }
        
        // Line Chart - Monthly Trend
        if (chartImages.lineChart) {
          currentPage.drawText('Payout Trend Over Months', {
            x: 50,
            y: yPos,
            size: 12,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
          yPos -= 25;
          
          try {
            const lineImageBytes = await fetch(chartImages.lineChart).then(res => res.arrayBuffer());
            const lineImage = await pdfDoc.embedPng(lineImageBytes);
            
            // Scale to fit width (max 480px wide to leave margins)
            const maxWidth = 480;
            const scale = maxWidth / lineImage.width;
            const lineWidth = lineImage.width * scale;
            const lineHeight = lineImage.height * scale;
            
            // Check if chart will fit on current page (need space above footer at y=100)
            if (yPos - lineHeight < 130) {
              currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
              yPos = height - 180;
              currentPage.drawText('Payout Trend Over Months', {
                x: 50,
                y: yPos,
                size: 12,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
              yPos -= 25;
            }
            
            currentPage.drawImage(lineImage, {
              x: (width - lineWidth) / 2, // Center horizontally
              y: yPos - lineHeight,
              width: lineWidth,
              height: lineHeight,
            });
            
            yPos -= lineHeight + 20;
            if (import.meta.env.DEV) { console.log('✅ Line chart embedded'); }
          } catch (error) {
            if (import.meta.env.DEV) { console.warn('⚠️ Could not embed line chart:', error); }
            currentPage.drawText('(Line chart could not be rendered)', {
              x: 50,
              y: yPos,
              size: 10,
              font: font,
              color: rgb(0.5, 0.5, 0.5),
            });
            yPos -= 25;
          }
        }
      }
      
      // Add page numbers
      const totalPages = pdfDoc.getPageCount();
      for (let i = 0; i < totalPages; i++) {
        const page = pdfDoc.getPages()[i];
        page.drawText(`Page ${i + 1} of ${totalPages}`, {
          x: width - 100,
          y: 50,
          size: 9,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
      
      if (import.meta.env.DEV) { console.log('✅ Payout Statement PDF filled successfully'); }
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error filling Payout Statement PDF:', error); }
      throw error;
    }
  }

  /**
   * Download the filled PDF
   * @param {Uint8Array} pdfBytes - PDF bytes
   * @param {string} filename - Download filename
   */
  downloadPDF(pdfBytes, filename) {
    try {
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      if (import.meta.env.DEV) { console.log('✅ PDF downloaded:', filename); }
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error downloading PDF:', error); }
      throw error;
    }
  }

  /**
   * Fill Series-wise Performance Report data into PDF
   * Each series starts on a new page
   * @param {Object} data - Report data from backend
   * @param {Object} chartImages - Chart images as data URLs (optional)
   * @returns {Promise<Uint8Array>} - Filled PDF bytes
   */
  async fillSeriesPerformanceReport(data, chartImages = {}) {
    try {
      const pdfDoc = await this.loadTemplate();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      if (import.meta.env.DEV) { console.log('📝 Filling Series-wise Performance Report data...'); }
      if (import.meta.env.DEV) { console.log('📊 Series count:', data.detailed_series_data?.length || 0); }
      
      let currentPage = firstPage;
      let yPos = height - 180;
      
      // ============================================================
      // PAGE 1: REPORT TITLE & SUMMARY
      // ============================================================
      
      // Report Title
      currentPage.drawText('Series-wise Performance Report', {
        x: 50,
        y: yPos,
        size: 18,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      yPos -= 30;
      
      // Report Period
      currentPage.drawText(`Generated: ${new Date().toLocaleDateString('en-GB')}`, {
        x: 50,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPos -= 40;
      
      // Summary Section
      currentPage.drawText('Overall Summary', {
        x: 50,
        y: yPos,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 25;
      
      if (data.summary) {
        currentPage.drawText(`Total Series: ${data.summary.total_series || 0}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
        });
        yPos -= 20;
        
        currentPage.drawText(`Active Series: ${data.summary.active_series || 0}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0, 0.5, 0),
        });
        yPos -= 20;
        
        currentPage.drawText(`Total Investments: Rs. ${data.summary.total_investments?.toLocaleString('en-IN') || '0'}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
        });
        yPos -= 20;
        
        currentPage.drawText(`Total Investors: ${data.summary.total_investors || 0}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
        });
        yPos -= 30;
      }
      
      // Series Comparison Table
      if (data.series_comparison && data.series_comparison.length > 0) {
        if (yPos < 250) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText('Series Comparison', {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 30;
        
        // Table headers with proper labels and spacing
        currentPage.drawText('Series', { x: 50, y: yPos, size: 9, font: boldFont });
        currentPage.drawText('Status', { x: 140, y: yPos, size: 9, font: boldFont });
        currentPage.drawText('Funds Raised', { x: 220, y: yPos, size: 9, font: boldFont });
        currentPage.drawText('Investors', { x: 340, y: yPos, size: 9, font: boldFont });
        currentPage.drawText('Subscription %', { x: 410, y: yPos, size: 9, font: boldFont });
        currentPage.drawText('Repeated Inv.', { x: 500, y: yPos, size: 9, font: boldFont });
        yPos -= 20;
        
        for (const series of data.series_comparison) {
          if (yPos < 130) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180;
            currentPage.drawText('Series Comparison (continued)', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 25;
            currentPage.drawText('Series', { x: 50, y: yPos, size: 9, font: boldFont });
            currentPage.drawText('Status', { x: 140, y: yPos, size: 9, font: boldFont });
            currentPage.drawText('Funds Raised', { x: 220, y: yPos, size: 9, font: boldFont });
            currentPage.drawText('Investors', { x: 340, y: yPos, size: 9, font: boldFont });
            currentPage.drawText('Subscription %', { x: 410, y: yPos, size: 9, font: boldFont });
            currentPage.drawText('Repeated Inv.', { x: 500, y: yPos, size: 9, font: boldFont });
            yPos -= 20;
          }
          
          currentPage.drawText(series.series_code || '', { x: 50, y: yPos, size: 9, font: font });
          currentPage.drawText(series.status || '', { x: 140, y: yPos, size: 9, font: font });
          currentPage.drawText(`Rs. ${series.funds_raised?.toLocaleString('en-IN') || '0'}`, { x: 220, y: yPos, size: 9, font: font });
          currentPage.drawText(`${series.total_investors || 0}`, { x: 340, y: yPos, size: 9, font: font });
          currentPage.drawText(`${series.subscription_ratio?.toFixed(2) || '0.00'}%`, { x: 410, y: yPos, size: 9, font: font });
          currentPage.drawText(`${series.repeated_investors || 0}`, { x: 500, y: yPos, size: 9, font: font });
          yPos -= 18;
        }
        
        yPos -= 20;
      }
      
      // Embed Series Comparison Chart if available
      if (chartImages && chartImages.comparisonChart) {
        // Check if we need a new page (need ~250px for chart)
        if (yPos < 300) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText('Series Comparison Chart', {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        try {
          const comparisonImageBytes = await fetch(chartImages.comparisonChart).then(res => res.arrayBuffer());
          const comparisonImage = await pdfDoc.embedPng(comparisonImageBytes);
          
          // Scale to fit width (max 480px wide to leave margins)
          const maxWidth = 480;
          const scale = maxWidth / comparisonImage.width;
          const chartWidth = comparisonImage.width * scale;
          const chartHeight = comparisonImage.height * scale;
          
          currentPage.drawImage(comparisonImage, {
            x: (width - chartWidth) / 2,
            y: yPos - chartHeight,
            width: chartWidth,
            height: chartHeight,
          });
          
          yPos -= chartHeight + 20;
          if (import.meta.env.DEV) { console.log('✅ Series Comparison chart embedded'); }
        } catch (error) {
          if (import.meta.env.DEV) { console.warn('⚠️ Could not embed comparison chart:', error); }
          currentPage.drawText('(Chart could not be rendered)', {
            x: 50,
            y: yPos,
            size: 10,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          });
          yPos -= 25;
        }
      }
      
      // ============================================================
      // DETAILED SERIES DATA - EACH SERIES ON NEW PAGE
      // ============================================================
      
      if (data.detailed_series_data && data.detailed_series_data.length > 0) {
        for (let seriesIndex = 0; seriesIndex < data.detailed_series_data.length; seriesIndex++) {
          const seriesDetail = data.detailed_series_data[seriesIndex];
          // NEW PAGE FOR EACH SERIES
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
          
          // Series Header
          currentPage.drawText(`Series: ${seriesDetail.series_name} (${seriesDetail.series_code})`, {
            x: 50,
            y: yPos,
            size: 16,
            font: boldFont,
            color: rgb(0.1, 0.1, 0.1),
          });
          yPos -= 35;
          
          // Payout Statistics
          if (seriesDetail.payout_stats) {
            currentPage.drawText('Payout Statistics', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 20;
            
            const stats = seriesDetail.payout_stats;
            currentPage.drawText(`Total Payouts: ${stats.total_payouts || 0}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
            });
            yPos -= 18;
            
            currentPage.drawText(`Total Amount: Rs. ${stats.total_payout_amount?.toLocaleString('en-IN') || '0'}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
            });
            yPos -= 18;
            
            currentPage.drawText(`Paid: ${stats.paid_count || 0} (Rs. ${stats.paid_amount?.toLocaleString('en-IN') || '0'})`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
              color: rgb(0, 0.5, 0),
            });
            yPos -= 18;
            
            currentPage.drawText(`Pending: ${stats.pending_count || 0} (Rs. ${stats.pending_amount?.toLocaleString('en-IN') || '0'})`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
              color: rgb(0.8, 0.4, 0),
            });
            yPos -= 18;
            
            currentPage.drawText(`Success Rate: ${stats.payout_success_rate?.toFixed(2) || '0'}%`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
              color: rgb(0, 0.3, 0.8),
            });
            yPos -= 30;
          }
          
          // Investor Details Table
          if (seriesDetail.investor_details && seriesDetail.investor_details.length > 0) {
            if (yPos < 220) {
              currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
              yPos = height - 180;
            }
            
            currentPage.drawText(`Investor Details (${seriesDetail.investor_details.length} Investors)`, {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 25;
            
            // Table headers
            currentPage.drawText('ID', { x: 50, y: yPos, size: 8, font: boldFont });
            currentPage.drawText('Name', { x: 90, y: yPos, size: 8, font: boldFont });
            currentPage.drawText('Email', { x: 180, y: yPos, size: 8, font: boldFont });
            currentPage.drawText('Phone', { x: 280, y: yPos, size: 8, font: boldFont });
            currentPage.drawText('Amount', { x: 360, y: yPos, size: 8, font: boldFont });
            currentPage.drawText('Date', { x: 450, y: yPos, size: 8, font: boldFont });
            yPos -= 18;
            
            let totalInvestment = 0;
            
            for (const investor of seriesDetail.investor_details) {
              if (yPos < 130) {
                currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
                yPos = height - 180;
                currentPage.drawText(`${seriesDetail.series_code} - Investor Details (continued)`, {
                  x: 50,
                  y: yPos,
                  size: 11,
                  font: boldFont,
                  color: rgb(0.2, 0.2, 0.2),
                });
                yPos -= 20;
                currentPage.drawText('ID', { x: 50, y: yPos, size: 8, font: boldFont });
                currentPage.drawText('Name', { x: 90, y: yPos, size: 8, font: boldFont });
                currentPage.drawText('Email', { x: 180, y: yPos, size: 8, font: boldFont });
                currentPage.drawText('Phone', { x: 280, y: yPos, size: 8, font: boldFont });
                currentPage.drawText('Amount', { x: 360, y: yPos, size: 8, font: boldFont });
                currentPage.drawText('Date', { x: 450, y: yPos, size: 8, font: boldFont });
                yPos -= 18;
              }
              
              totalInvestment += investor.investment_amount || 0;
              
              currentPage.drawText((investor.investor_id || '').substring(0, 8), { x: 50, y: yPos, size: 7, font: font });
              currentPage.drawText((investor.investor_name || '').substring(0, 15), { x: 90, y: yPos, size: 7, font: font });
              currentPage.drawText((investor.email || '').substring(0, 18), { x: 180, y: yPos, size: 7, font: font });
              currentPage.drawText((investor.phone || '').substring(0, 12), { x: 280, y: yPos, size: 7, font: font });
              currentPage.drawText(`Rs. ${investor.investment_amount?.toLocaleString('en-IN') || '0'}`, { x: 360, y: yPos, size: 7, font: font });
              currentPage.drawText(investor.date_received || '', { x: 450, y: yPos, size: 7, font: font });
              yPos -= 15;
            }
            
            // Total row
            yPos -= 5;
            currentPage.drawText('Total:', { x: 280, y: yPos, size: 9, font: boldFont });
            currentPage.drawText(`Rs. ${totalInvestment.toLocaleString('en-IN')}`, { x: 360, y: yPos, size: 9, font: boldFont, color: rgb(0, 0.5, 0) });
            yPos -= 30;
          }
          
          // Compliance Status
          if (seriesDetail.compliance_stats) {
            if (yPos < 170) {
              currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
              yPos = height - 180;
            }
            
            currentPage.drawText('Compliance Status', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 20;
            
            const comp = seriesDetail.compliance_stats;
            currentPage.drawText(`Total Requirements: ${comp.total_requirements || 0}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
            });
            yPos -= 18;
            
            currentPage.drawText(`Completed: ${comp.completed || 0}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
              color: rgb(0, 0.5, 0),
            });
            yPos -= 18;
            
            currentPage.drawText(`Pending Actions: ${comp.pending_actions || 0}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
              color: rgb(0.8, 0.4, 0),
            });
            yPos -= 18;
            
            currentPage.drawText(`Completion Rate: ${comp.completion_percentage?.toFixed(2) || '0'}%`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
              color: comp.completion_percentage >= 90 ? rgb(0, 0.5, 0) : 
                     comp.completion_percentage >= 50 ? rgb(0.8, 0.4, 0) : rgb(0.8, 0, 0),
            });
            yPos -= 30;
          }
          
          // Monthly Investment Trend (text summary)
          if (seriesDetail.monthly_trend && seriesDetail.monthly_trend.length > 0) {
            if (yPos < 170) {
              currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
              yPos = height - 180;
            }
            
            currentPage.drawText('Monthly Investment Trend', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 20;
            
            // Show last 6 months
            const recentMonths = seriesDetail.monthly_trend.slice(-6);
            for (const month of recentMonths) {
              if (yPos < 130) {
                currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
                yPos = height - 180;
              }
              
              currentPage.drawText(`${month.month}: Rs. ${month.total_amount?.toLocaleString('en-IN') || '0'} (${month.investment_count || 0} investments)`, {
                x: 70,
                y: yPos,
                size: 9,
                font: font,
                color: rgb(0.3, 0.3, 0.3),
              });
              yPos -= 16;
            }
            
            yPos -= 20;
          }
          
          // Ticket Size Distribution
          if (seriesDetail.ticket_distribution && seriesDetail.ticket_distribution.length > 0) {
            if (yPos < 170) {
              currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
              yPos = height - 180;
            }
            
            currentPage.drawText('Ticket Size Distribution', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 20;
            
            for (const ticket of seriesDetail.ticket_distribution) {
              if (yPos < 130) {
                currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
                yPos = height - 180;
              }
              
              currentPage.drawText(`${ticket.category}: ${ticket.count} investors (Rs. ${ticket.total_amount?.toLocaleString('en-IN') || '0'})`, {
                x: 70,
                y: yPos,
                size: 9,
                font: font,
                color: rgb(0.3, 0.3, 0.3),
              });
              yPos -= 16;
            }
          }
          
          // Embed charts for this series if available
          if (chartImages && chartImages.seriesCharts && chartImages.seriesCharts[seriesIndex]) {
            const seriesChartData = chartImages.seriesCharts[seriesIndex];
            
            // Monthly Investment Trend Line Chart
            if (seriesChartData.lineChart) {
              // Check if we need a new page (need ~250px for chart)
              if (yPos < 300) {
                currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
                yPos = height - 180;
              }
              
              currentPage.drawText('Monthly Investment Trend Chart', {
                x: 50,
                y: yPos,
                size: 12,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
              yPos -= 25;
              
              try {
                const lineImageBytes = await fetch(seriesChartData.lineChart).then(res => res.arrayBuffer());
                const lineImage = await pdfDoc.embedPng(lineImageBytes);
                
                // Scale to fit width (max 480px wide to leave margins)
                const maxWidth = 480;
                const scale = maxWidth / lineImage.width;
                const chartWidth = lineImage.width * scale;
                const chartHeight = lineImage.height * scale;
                
                // Check if chart will fit on current page (need space above footer at y=100)
                if (yPos - chartHeight < 130) {
                  currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
                  yPos = height - 180;
                  currentPage.drawText('Monthly Investment Trend Chart', {
                    x: 50,
                    y: yPos,
                    size: 12,
                    font: boldFont,
                    color: rgb(0.2, 0.2, 0.2),
                  });
                  yPos -= 25;
                }
                
                currentPage.drawImage(lineImage, {
                  x: (width - chartWidth) / 2,
                  y: yPos - chartHeight,
                  width: chartWidth,
                  height: chartHeight,
                });
                
                yPos -= chartHeight + 20;
                if (import.meta.env.DEV) { console.log(`✅ Series ${seriesIndex + 1} Line chart embedded`); }
              } catch (error) {
                if (import.meta.env.DEV) { console.warn(`⚠️ Could not embed series ${seriesIndex + 1} line chart:`, error); }
                currentPage.drawText('(Chart could not be rendered)', {
                  x: 50,
                  y: yPos,
                  size: 10,
                  font: font,
                  color: rgb(0.5, 0.5, 0.5),
                });
                yPos -= 25;
              }
            }
            
            // Ticket Size Distribution Pie Chart
            if (seriesChartData.pieChart) {
              // Check if we need a new page (need ~250px for chart)
              if (yPos < 300) {
                currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
                yPos = height - 180;
              }
              
              currentPage.drawText('Ticket Size Distribution Chart', {
                x: 50,
                y: yPos,
                size: 12,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
              yPos -= 25;
              
              try {
                const pieImageBytes = await fetch(seriesChartData.pieChart).then(res => res.arrayBuffer());
                const pieImage = await pdfDoc.embedPng(pieImageBytes);
                
                // Scale to fit width (max 480px wide to leave margins)
                const maxWidth = 480;
                const scale = maxWidth / pieImage.width;
                const chartWidth = pieImage.width * scale;
                const chartHeight = pieImage.height * scale;
                
                // Check if chart will fit on current page (need space above footer at y=100)
                if (yPos - chartHeight < 130) {
                  currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
                  yPos = height - 180;
                  currentPage.drawText('Ticket Size Distribution Chart', {
                    x: 50,
                    y: yPos,
                    size: 12,
                    font: boldFont,
                    color: rgb(0.2, 0.2, 0.2),
                  });
                  yPos -= 25;
                }
                
                currentPage.drawImage(pieImage, {
                  x: (width - chartWidth) / 2,
                  y: yPos - chartHeight,
                  width: chartWidth,
                  height: chartHeight,
                });
                
                yPos -= chartHeight + 20;
                if (import.meta.env.DEV) { console.log(`✅ Series ${seriesIndex + 1} Pie chart embedded`); }
              } catch (error) {
                if (import.meta.env.DEV) { console.warn(`⚠️ Could not embed series ${seriesIndex + 1} pie chart:`, error); }
                currentPage.drawText('(Chart could not be rendered)', {
                  x: 50,
                  y: yPos,
                  size: 10,
                  font: font,
                  color: rgb(0.5, 0.5, 0.5),
                });
                yPos -= 25;
              }
            }
          }
        }
      }
      
      if (import.meta.env.DEV) { console.log('✅ Series-wise Performance Report PDF generated'); }
      return await pdfDoc.save();
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error filling Series-wise Performance Report:', error); }
      throw error;
    }
  }

  /**
   * Fill Investor Portfolio Summary Report data into template
   * @param {Object} data - Report data from backend
   * @param {Object} chartImages - Chart images as base64 data URLs (optional)
   * @returns {Promise<Uint8Array>} - Filled PDF bytes
   */
  async fillInvestorPortfolioReport(data, chartImages = {}) {
    try {
      const pdfDoc = await this.loadTemplate();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      if (import.meta.env.DEV) { console.log('📝 Filling Investor Portfolio Summary Report data...'); }
      if (import.meta.env.DEV) {

        if (import.meta.env.DEV) { console.log('📊 Report data keys:', Object.keys(data)); }

      }
      
      let currentPage = firstPage;
      let yPos = height - 180;
      const minYPos = 130; // Minimum Y position before new page
      
      // ============================================================
      // PAGE 1: REPORT TITLE & OVERALL SUMMARY
      // ============================================================
      
      // Report Title
      currentPage.drawText('Investor Portfolio Summary Report', {
        x: 50,
        y: yPos,
        size: 18,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      yPos -= 30;
      
      // Report Generated Date
      currentPage.drawText(`Generated: ${new Date().toLocaleDateString('en-GB')}`, {
        x: 50,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPos -= 40;
      
      // Overall Summary Section
      if (data.summary) {
        currentPage.drawText('Overall Summary', {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        currentPage.drawText(`Total Investors: ${data.summary.total_investors || 0}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
        });
        yPos -= 20;
        
        currentPage.drawText(`Total Funds Raised: Rs. ${data.summary.total_funds_raised?.toLocaleString('en-IN') || '0'}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0, 0.5, 0),
        });
        yPos -= 20;
        
        currentPage.drawText(`Total Payouts: Rs. ${data.summary.total_payouts?.toLocaleString('en-IN') || '0'}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
        });
        yPos -= 20;
        
        currentPage.drawText(`KYC Rejected: ${data.summary.kyc_rejected_count || 0}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0.8, 0, 0),
        });
        yPos -= 35;
      }
      
      
      
      // Grievance Summary Section
      if (data.grievance_summary) {
        if (yPos < 200) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText('Grievance Summary', {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        currentPage.drawText(`Total Complaints: ${data.grievance_summary.total_complaints || 0}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
        });
        yPos -= 20;
        
        currentPage.drawText(`Resolved: ${data.grievance_summary.resolved_complaints || 0}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0, 0.5, 0),
        });
        yPos -= 20;
        
        currentPage.drawText(`Pending: ${data.grievance_summary.pending_complaints || 0}`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0.8, 0.4, 0),
        });
        yPos -= 20;
        
        currentPage.drawText(`Resolution Rate: ${data.grievance_summary.resolution_rate?.toFixed(2) || '0'}%`, {
          x: 70,
          y: yPos,
          size: 11,
          font: font,
          color: rgb(0, 0.3, 0.8),
        });
        yPos -= 35;
      }
      
      // ============================================================
      // ============================================================
      // NEW TABLE: INVESTOR INVESTMENTS SUMMARY
      // ============================================================
      if (data.investor_breakdown && data.investor_breakdown.length > 0) {
        if (yPos < 250) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText(`Investor Investments Summary (${data.investor_breakdown.length} Investors)`, {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 30;
        
        // Table headers
        const invSummaryHeaders = ['Investor ID', 'Name', 'Email', 'Total Investment', 'Series', 'First Date', 'Last Date'];
        const invSummaryColumnX = [50, 120, 200, 290, 390, 450, 510];
        
        invSummaryHeaders.forEach((header, index) => {
          currentPage.drawText(header, {
            x: invSummaryColumnX[index],
            y: yPos,
            size: 8,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        yPos -= 5;
        
        currentPage.drawLine({
          start: { x: 50, y: yPos },
          end: { x: width - 50, y: yPos },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPos -= 15;
        
        let totalInvestmentSum = 0;
        
        // Table rows
        for (const investor of data.investor_breakdown) {
          if (yPos < minYPos) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180;
            
            currentPage.drawText('Investor Investments Summary (continued)', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 25;
            
            invSummaryHeaders.forEach((header, idx) => {
              currentPage.drawText(header, {
                x: invSummaryColumnX[idx],
                y: yPos,
                size: 8,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 5;
            
            currentPage.drawLine({
              start: { x: 50, y: yPos },
              end: { x: width - 50, y: yPos },
              thickness: 0.5,
              color: rgb(0.5, 0.5, 0.5),
            });
            yPos -= 15;
          }
          
          totalInvestmentSum += investor.total_investment || 0;
          
          const invSummaryData = [
            (investor.investor_id || '').substring(0, 10),
            (investor.investor_name || '').substring(0, 12),
            (investor.email || '').substring(0, 14),
            `Rs. ${investor.total_investment?.toLocaleString('en-IN') || '0'}`,
            String(investor.series_count || 0),
            (investor.first_investment_date || '-').substring(0, 10),
            (investor.last_investment_date || '-').substring(0, 10)
          ];
          
          invSummaryData.forEach((data, idx) => {
            currentPage.drawText(String(data), {
              x: invSummaryColumnX[idx],
              y: yPos,
              size: 7,
              font: font,
              color: rgb(0.3, 0.3, 0.3),
            });
          });
          
          yPos -= 14;
        }
        
        // Total row
        yPos -= 5;
        currentPage.drawText('Total:', {
          x: 240,
          y: yPos,
          size: 9,
          font: boldFont,
        });
        currentPage.drawText(`Rs. ${totalInvestmentSum.toLocaleString('en-IN')}`, {
          x: 290,
          y: yPos,
          size: 9,
          font: boldFont,
          color: rgb(0, 0.5, 0),
        });
        yPos -= 30;
      }
      
      // ============================================================
      // INVESTORS DETAILS TABLE - ALL PERSONAL INFORMATION
      // ============================================================
      if (data.investors_details && data.investors_details.length > 0) {
        if (yPos < 250) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText(`Investors Details (${data.investors_details.length} Investors)`, {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 30;
        
        // Table headers - Matching frontend exactly
        const headers1 = ['ID', 'Name', 'Email', 'Phone', 'PAN', 'Bank', 'Account', 'IFSC', 'KYC', 'Joined'];
        const columnX1 = [50, 105, 175, 255, 315, 365, 425, 480, 525, 565];
        
        headers1.forEach((header, index) => {
          currentPage.drawText(header, {
            x: columnX1[index],
            y: yPos,
            size: 8,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        yPos -= 5;
        
        currentPage.drawLine({
          start: { x: 50, y: yPos },
          end: { x: width - 50, y: yPos },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPos -= 15;
        
        // Table rows
        for (const inv of data.investors_details) {
          if (yPos < minYPos) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180;
            
            currentPage.drawText('Investors Details (continued)', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 25;
            
            headers1.forEach((header, idx) => {
              currentPage.drawText(header, {
                x: columnX1[idx],
                y: yPos,
                size: 8,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 5;
            
            currentPage.drawLine({
              start: { x: 50, y: yPos },
              end: { x: width - 50, y: yPos },
              thickness: 0.5,
              color: rgb(0.5, 0.5, 0.5),
            });
            yPos -= 15;
          }
          
          const rowData1 = [
            (inv.investor_id || '').substring(0, 8),
            (inv.full_name || '').substring(0, 12),
            (inv.email || '').substring(0, 14),
            (inv.phone || '').substring(0, 12),
            (inv.pan || '-').substring(0, 10),
            (inv.bank_name || '').substring(0, 10),
            (inv.account_number || '').substring(0, 10),
            (inv.ifsc_code || '').substring(0, 10),
            (inv.kyc_status || '-').substring(0, 8),
            (inv.date_joined || '-').substring(0, 10)
          ];
          
          rowData1.forEach((data, idx) => {
            currentPage.drawText(String(data), {
              x: columnX1[idx],
              y: yPos,
              size: 7,
              font: font,
              color: rgb(0.3, 0.3, 0.3),
            });
          });
          
          yPos -= 14;
        }
        
        yPos -= 25;
      }
      
      // ============================================================
      // NOMINEE DETAILS TABLE
      // ============================================================
      if (data.nominee_details && data.nominee_details.length > 0) {
        if (yPos < 250) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText(`Nominee Details (${data.nominee_details.length} Nominees)`, {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 30;
        
        const nomHeaders = ['Investor ID', 'Investor Name', 'Nominee Name', 'Relationship', 'Mobile'];
        const nomColumnX = [50, 130, 230, 330, 430];
        
        nomHeaders.forEach((header, index) => {
          currentPage.drawText(header, {
            x: nomColumnX[index],
            y: yPos,
            size: 8,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        yPos -= 18;
        
        for (const nom of data.nominee_details) {
          if (yPos < minYPos) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180;
            
            currentPage.drawText('Nominee Details (continued)', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 25;
            
            nomHeaders.forEach((header, idx) => {
              currentPage.drawText(header, {
                x: nomColumnX[idx],
                y: yPos,
                size: 8,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 18;
          }
          
          const nomData = [
            (nom.investor_id || '').substring(0, 10),
            (nom.investor_name || '').substring(0, 14),
            (nom.nominee_name || '-').substring(0, 14),
            (nom.nominee_relationship || '-').substring(0, 12),
            nom.nominee_mobile || '-'
          ];
          
          nomData.forEach((data, idx) => {
            currentPage.drawText(String(data), {
              x: nomColumnX[idx],
              y: yPos,
              size: 7,
              font: font,
              color: rgb(0.3, 0.3, 0.3),
            });
          });
          
          yPos -= 14;
        }
        
        yPos -= 25;
      }
      
      // ============================================================
      // PAYOUTS TABLE - AGGREGATED PAYOUT SUMMARY
      // ============================================================
      if (data.payouts_table && data.payouts_table.length > 0) {
        if (yPos < 250) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText(`All Payouts (${data.payouts_table.length} Records)`, {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 30;
        
        const payHeaders = ['Investor', 'Series', 'Total Amount', 'Last Payout'];
        const payColumnX = [50, 150, 260, 380];
        
        payHeaders.forEach((header, index) => {
          currentPage.drawText(header, {
            x: payColumnX[index],
            y: yPos,
            size: 8,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        yPos -= 18;
        
        let totalPayouts = 0;
        
        for (const pay of data.payouts_table) {
          if (yPos < minYPos) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180;
            
            currentPage.drawText('All Payouts (continued)', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 25;
            
            payHeaders.forEach((header, idx) => {
              currentPage.drawText(header, {
                x: payColumnX[idx],
                y: yPos,
                size: 8,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 18;
          }
          
          totalPayouts += pay.total_amount || 0;
          
          const payData = [
            (pay.investor_id || '').substring(0, 14),
            (pay.series_code || '').substring(0, 14),
            `Rs. ${pay.total_amount?.toLocaleString('en-IN') || '0'}`,
            pay.last_payout_date || '-'
          ];
          
          payData.forEach((data, idx) => {
            currentPage.drawText(String(data), {
              x: payColumnX[idx],
              y: yPos,
              size: 7,
              font: font,
              color: rgb(0.3, 0.3, 0.3),
            });
          });
          
          yPos -= 14;
        }
        
        // Total row
        yPos -= 5;
        currentPage.drawText('Total:', {
          x: 200,
          y: yPos,
          size: 9,
          font: boldFont,
        });
        currentPage.drawText(`Rs. ${totalPayouts.toLocaleString('en-IN')}`, {
          x: 260,
          y: yPos,
          size: 9,
          font: boldFont,
          color: rgb(0, 0.5, 0),
        });
        yPos -= 30;
      }
      
      // ============================================================
      // INVESTOR GRIEVANCES TABLE
      // ============================================================
      if (data.investor_grievances_table && data.investor_grievances_table.length > 0) {
        if (yPos < 250) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText(`Investor-wise Grievances (${data.investor_grievances_table.length} Records)`, {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 30;
        
        const grHeaders = ['Investor', 'Series', 'Total', 'Resolved', 'Unresolved'];
        const grColumnX = [50, 150, 260, 340, 430];
        
        grHeaders.forEach((header, index) => {
          currentPage.drawText(header, {
            x: grColumnX[index],
            y: yPos,
            size: 8,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        yPos -= 18;
        
        for (const gr of data.investor_grievances_table) {
          if (yPos < minYPos) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180;
            
            currentPage.drawText('Investor Grievances (continued)', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 25;
            
            grHeaders.forEach((header, idx) => {
              currentPage.drawText(header, {
                x: grColumnX[idx],
                y: yPos,
                size: 8,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 18;
          }
          
          const grData = [
            (gr.investor_id || '').substring(0, 14),
            (gr.series_code || '').substring(0, 14),
            String(gr.total_complaints || 0),
            String(gr.resolved_complaints || 0),
            String(gr.unresolved_complaints || 0)
          ];
          
          grData.forEach((data, idx) => {
            currentPage.drawText(String(data), {
              x: grColumnX[idx],
              y: yPos,
              size: 7,
              font: font,
              color: rgb(0.3, 0.3, 0.3),
            });
          });
          
          yPos -= 14;
        }
        
        yPos -= 25;
      }
      
      // ============================================================
      // DETAILED INVESTOR DATA - EACH INVESTOR ON SEPARATE PAGES
      // ============================================================
      if (data.detailed_investor_data && data.detailed_investor_data.length > 0) {
        for (let invIndex = 0; invIndex < data.detailed_investor_data.length; invIndex++) {
          const investorDetail = data.detailed_investor_data[invIndex];
          
          // NEW PAGE FOR EACH INVESTOR
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
          
          // Investor Header
          currentPage.drawText(`Investor: ${investorDetail.investor_name} (${investorDetail.investor_id})`, {
            x: 50,
            y: yPos,
            size: 16,
            font: boldFont,
            color: rgb(0.1, 0.1, 0.1),
          });
          yPos -= 25;
          
          // Contact Information
          currentPage.drawText(`Email: ${investorDetail.email || 'N/A'}`, {
            x: 50,
            y: yPos,
            size: 9,
            font: font,
            color: rgb(0.4, 0.4, 0.4),
          });
          yPos -= 15;
          
          currentPage.drawText(`Phone: ${investorDetail.phone || 'N/A'}`, {
            x: 50,
            y: yPos,
            size: 9,
            font: font,
            color: rgb(0.4, 0.4, 0.4),
          });
          yPos -= 15;
          
          currentPage.drawText(`PAN: ${investorDetail.pan || 'N/A'}`, {
            x: 50,
            y: yPos,
            size: 9,
            font: font,
            color: rgb(0.4, 0.4, 0.4),
          });
          yPos -= 30;
          
          // Investment Summary
          if (investorDetail.investment_summary) {
            currentPage.drawText('Investment Summary', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 20;
            
            const summary = investorDetail.investment_summary;
            
            currentPage.drawText(`Total Invested: Rs. ${summary.total_invested?.toLocaleString('en-IN') || '0'}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
            });
            yPos -= 18;
            
            currentPage.drawText(`Number of Series: ${summary.number_of_series || 0}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
            });
            yPos -= 18;
            
            currentPage.drawText(`Number of Investments: ${summary.number_of_investments || 0}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
            });
            yPos -= 18;
            
            currentPage.drawText(`Average Investment Size: Rs. ${summary.average_investment_size?.toLocaleString('en-IN') || '0'}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
            });
            yPos -= 18;
            
            currentPage.drawText(`First Investment: ${summary.first_investment_date || 'N/A'}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
            });
            yPos -= 18;
            
            currentPage.drawText(`Last Investment: ${summary.last_investment_date || 'N/A'}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
            });
            yPos -= 30;
          }
          
          // Series-wise Investments Table
          if (investorDetail.series_investments && investorDetail.series_investments.length > 0) {
            if (yPos < 220) {
              currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
              yPos = height - 180;
            }
            
            currentPage.drawText(`Series-wise Investments (${investorDetail.series_investments.length} Records)`, {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 25;
            
            // Table headers
            const seriesHeaders = ['Series', 'Amount', 'Date', 'Rate', 'Maturity', 'Status'];
            const seriesColumnX = [50, 130, 230, 310, 380, 480];
            
            seriesHeaders.forEach((header, index) => {
              currentPage.drawText(header, {
                x: seriesColumnX[index],
                y: yPos,
                size: 8,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 18;
            
            for (const series of investorDetail.series_investments) {
              if (yPos < 130) {
                currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
                yPos = height - 180;
                
                currentPage.drawText(`${investorDetail.investor_id} - Series Investments (continued)`, {
                  x: 50,
                  y: yPos,
                  size: 11,
                  font: boldFont,
                  color: rgb(0.2, 0.2, 0.2),
                });
                yPos -= 20;
                
                seriesHeaders.forEach((header, idx) => {
                  currentPage.drawText(header, {
                    x: seriesColumnX[idx],
                    y: yPos,
                    size: 8,
                    font: boldFont,
                    color: rgb(0.2, 0.2, 0.2),
                  });
                });
                yPos -= 18;
              }
              
              const seriesData = [
                series.series_code || '',
                `Rs. ${series.investment_amount?.toLocaleString('en-IN') || '0'}`,
                series.date_received || 'N/A',
                `${series.interest_rate || 0}%`,
                series.maturity_date || 'N/A',
                series.status || 'N/A'
              ];
              
              seriesData.forEach((data, idx) => {
                currentPage.drawText(String(data), {
                  x: seriesColumnX[idx],
                  y: yPos,
                  size: 7,
                  font: font,
                  color: rgb(0.3, 0.3, 0.3),
                });
              });
              
              yPos -= 15;
            }
            
            yPos -= 25;
          }
          
          // KYC Status
          if (investorDetail.kyc_status) {
            if (yPos < 150) {
              currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
              yPos = height - 180;
            }
            
            currentPage.drawText('KYC & Compliance Status', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 20;
            
            const kycStatus = investorDetail.kyc_status.kyc_status || 'Pending';
            const kycColor = kycStatus === 'verified' ? rgb(0, 0.5, 0) : 
                            kycStatus === 'rejected' ? rgb(0.8, 0, 0) : 
                            rgb(0.8, 0.4, 0);
            
            currentPage.drawText(`KYC Status: ${kycStatus}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
              color: kycColor,
            });
            yPos -= 18;
            
            if (investorDetail.kyc_status.last_updated_date) {
              currentPage.drawText(`Last Updated: ${investorDetail.kyc_status.last_updated_date}`, {
                x: 70,
                y: yPos,
                size: 10,
                font: font,
                color: rgb(0.4, 0.4, 0.4),
              });
              yPos -= 25;
            } else {
              yPos -= 25;
            }
          }
          
          // Bank Details
          if (investorDetail.bank_details) {
            if (yPos < 150) {
              currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
              yPos = height - 180;
            }
            
            currentPage.drawText('Bank Details', {
              x: 50,
              y: yPos,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPos -= 20;
            
            const bank = investorDetail.bank_details;
            
            currentPage.drawText(`Bank Name: ${bank.bank_name || 'N/A'}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
            });
            yPos -= 18;
            
            currentPage.drawText(`Account Number: ${bank.account_number || 'N/A'}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
            });
            yPos -= 18;
            
            currentPage.drawText(`IFSC Code: ${bank.ifsc_code || 'N/A'}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
            });
            yPos -= 18;
            
            currentPage.drawText(`Account Holder: ${bank.account_holder_name || 'N/A'}`, {
              x: 70,
              y: yPos,
              size: 10,
              font: font,
            });
            yPos -= 30;
          }
          
          // Investment Distribution Chart (if available)
          if (chartImages && chartImages.investorCharts && chartImages.investorCharts[invIndex]) {
            const investorChartData = chartImages.investorCharts[invIndex];
            
            if (investorChartData.pieChart) {
              if (yPos < 300) {
                currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
                yPos = height - 180;
              }
              
              currentPage.drawText('Investment Distribution by Series', {
                x: 50,
                y: yPos,
                size: 12,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
              yPos -= 25;
              
              try {
                const pieImageBytes = await fetch(investorChartData.pieChart).then(res => res.arrayBuffer());
                const pieImage = await pdfDoc.embedPng(pieImageBytes);
                
                const maxWidth = 480;
                const scale = maxWidth / pieImage.width;
                const chartWidth = pieImage.width * scale;
                const chartHeight = pieImage.height * scale;
                
                if (yPos - chartHeight < 130) {
                  currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
                  yPos = height - 180;
                  currentPage.drawText('Investment Distribution by Series', {
                    x: 50,
                    y: yPos,
                    size: 12,
                    font: boldFont,
                    color: rgb(0.2, 0.2, 0.2),
                  });
                  yPos -= 25;
                }
                
                currentPage.drawImage(pieImage, {
                  x: (width - chartWidth) / 2,
                  y: yPos - chartHeight,
                  width: chartWidth,
                  height: chartHeight,
                });
                
                yPos -= chartHeight + 20;
                if (import.meta.env.DEV) { console.log(`✅ Investor ${invIndex + 1} Pie chart embedded`); }
              } catch (error) {
                if (import.meta.env.DEV) { console.warn(`⚠️ Could not embed investor ${invIndex + 1} pie chart:`, error); }
                currentPage.drawText('(Chart could not be rendered)', {
                  x: 50,
                  y: yPos,
                  size: 10,
                  font: font,
                  color: rgb(0.5, 0.5, 0.5),
                });
                yPos -= 25;
              }
            }
            
            // Yearly Investment Trend Chart
            if (investorChartData.lineChart) {
              if (yPos < 300) {
                currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
                yPos = height - 180;
              }
              
              currentPage.drawText('Yearly Investment Trend', {
                x: 50,
                y: yPos,
                size: 12,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
              yPos -= 25;
              
              try {
                const lineImageBytes = await fetch(investorChartData.lineChart).then(res => res.arrayBuffer());
                const lineImage = await pdfDoc.embedPng(lineImageBytes);
                
                const maxWidth = 480;
                const scale = maxWidth / lineImage.width;
                const chartWidth = lineImage.width * scale;
                const chartHeight = lineImage.height * scale;
                
                if (yPos - chartHeight < 130) {
                  currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
                  yPos = height - 180;
                  currentPage.drawText('Yearly Investment Trend', {
                    x: 50,
                    y: yPos,
                    size: 12,
                    font: boldFont,
                    color: rgb(0.2, 0.2, 0.2),
                  });
                  yPos -= 25;
                }
                
                currentPage.drawImage(lineImage, {
                  x: (width - chartWidth) / 2,
                  y: yPos - chartHeight,
                  width: chartWidth,
                  height: chartHeight,
                });
                
                yPos -= chartHeight + 20;
                if (import.meta.env.DEV) { console.log(`✅ Investor ${invIndex + 1} Line chart embedded`); }
              } catch (error) {
                if (import.meta.env.DEV) { console.warn(`⚠️ Could not embed investor ${invIndex + 1} line chart:`, error); }
                currentPage.drawText('(Chart could not be rendered)', {
                  x: 50,
                  y: yPos,
                  size: 10,
                  font: font,
                  color: rgb(0.5, 0.5, 0.5),
                });
                yPos -= 25;
              }
            }
          }
        }
      }
      
      // Add page numbers
      const totalPages = pdfDoc.getPageCount();
      for (let i = 0; i < totalPages; i++) {
        const page = pdfDoc.getPages()[i];
        page.drawText(`Page ${i + 1} of ${totalPages}`, {
          x: width - 100,
          y: 50,
          size: 9,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
      
      if (import.meta.env.DEV) { console.log('✅ Investor Portfolio Summary Report PDF generated'); }
      return await pdfDoc.save();
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error filling Investor Portfolio Summary Report:', error); }
      throw error;
    }
  }

  /**
   * Fill KYC Status Report template with data
   * @param {Object} data - Report data from backend
   * @returns {Promise<Uint8Array>} - Filled PDF bytes
   */
  async fillKYCStatusReport(data) {
    if (import.meta.env.DEV) { console.log('📄 Filling KYC Status Report PDF...'); }
    
    try {
      const pdfDoc = await this.loadTemplate();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const firstPage = pdfDoc.getPages()[0];
      const { width, height } = firstPage.getSize();
      
      let currentPage = firstPage;
      let yPos = height - 180;
      
      // Title
      currentPage.drawText('KYC Status Report', {
        x: 50,
        y: yPos,
        size: 20,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 40;
      
      // Summary Cards
      if (data.summary) {
        currentPage.drawText('Summary', {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        const summaryData = [
          { label: 'Total Investors', value: data.summary.total_investors || 0 },
          { label: 'Pending KYC', value: data.summary.pending_kyc || 0 },
          { label: 'Completed KYC', value: data.summary.completed_kyc || 0 }
        ];
        
        const boxWidth = 150;
        const boxHeight = 60;
        const boxSpacing = 20;
        let xPos = 50;
        
        summaryData.forEach((item, index) => {
          // Draw box
          currentPage.drawRectangle({
            x: xPos,
            y: yPos - boxHeight,
            width: boxWidth,
            height: boxHeight,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 1,
          });
          
          // Draw value
          currentPage.drawText(String(item.value), {
            x: xPos + 10,
            y: yPos - 30,
            size: 18,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
          
          // Draw label
          currentPage.drawText(item.label, {
            x: xPos + 10,
            y: yPos - 50,
            size: 10,
            font: font,
            color: rgb(0.4, 0.4, 0.4),
          });
          
          xPos += boxWidth + boxSpacing;
        });
        
        yPos -= boxHeight + 30;
      }
      
      // Banking Details Table
      if (data.banking_details && data.banking_details.length > 0) {
        if (yPos < 200) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText(`Banking Details (${data.banking_details.length} Investors)`, {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        // Table headers
        const columnX = [50, 120, 220, 320, 420];
        const headers = ['Investor ID', 'Investor Name', 'Bank Name', 'Account Number', 'IFSC Code'];
        
        headers.forEach((header, i) => {
          currentPage.drawText(header, {
            x: columnX[i],
            y: yPos,
            size: 9,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        yPos -= 15;
        
        // Table rows
        for (const investor of data.banking_details) {
          if (yPos < 130) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180;
            
            // Redraw headers
            headers.forEach((header, i) => {
              currentPage.drawText(header, {
                x: columnX[i],
                y: yPos,
                size: 9,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 15;
          }
          
          const rowData = [
            investor.investor_id || '',
            this.truncateText(investor.investor_name || '', 15),
            this.truncateText(investor.bank_name || '', 15),
            this.truncateText(investor.account_number || '', 15),
            investor.ifsc_code || ''
          ];
          
          rowData.forEach((text, i) => {
            currentPage.drawText(String(text), {
              x: columnX[i],
              y: yPos,
              size: 8,
              font: font,
              color: rgb(0.2, 0.2, 0.2),
            });
          });
          yPos -= 12;
        }
        
        yPos -= 20;
      }
      
      // KYC Details Table
      if (data.kyc_details && data.kyc_details.length > 0) {
        if (yPos < 200) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText(`KYC Details (${data.kyc_details.length} Investors)`, {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        // Table headers
        const columnX = [50, 120, 200, 280, 350, 410];
        const headers = ['Investor ID', 'Investor Name', 'PAN', 'Aadhaar', 'KYC Status', 'Yet to Submit'];
        
        headers.forEach((header, i) => {
          currentPage.drawText(header, {
            x: columnX[i],
            y: yPos,
            size: 9,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        yPos -= 15;
        
        // Table rows
        for (const investor of data.kyc_details) {
          if (yPos < 130) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180;
            
            // Redraw headers
            headers.forEach((header, i) => {
              currentPage.drawText(header, {
                x: columnX[i],
                y: yPos,
                size: 9,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 15;
          }
          
          const rowData = [
            investor.investor_id || '',
            this.truncateText(investor.investor_name || '', 12),
            this.truncateText(investor.pan || '', 12),
            this.truncateText(investor.aadhaar || '', 12),
            investor.kyc_status || '',
            this.truncateText(investor.yet_to_submit_documents || '', 15)
          ];
          
          rowData.forEach((text, i) => {
            currentPage.drawText(String(text), {
              x: columnX[i],
              y: yPos,
              size: 8,
              font: font,
              color: rgb(0.2, 0.2, 0.2),
            });
          });
          yPos -= 12;
        }
        
        yPos -= 20;
      }
      
      // Personal Details Table
      if (data.personal_details && data.personal_details.length > 0) {
        if (yPos < 200) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText(`Investors Personal Details (${data.personal_details.length} Investors)`, {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        // Table headers
        const columnX = [50, 120, 200, 280, 340, 410];
        const headers = ['Investor ID', 'Investor Name', 'Email', 'Phone', 'DOB', 'Source of Funds'];
        
        headers.forEach((header, i) => {
          currentPage.drawText(header, {
            x: columnX[i],
            y: yPos,
            size: 9,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        yPos -= 15;
        
        // Table rows
        for (const investor of data.personal_details) {
          if (yPos < 130) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180;
            
            // Redraw headers
            headers.forEach((header, i) => {
              currentPage.drawText(header, {
                x: columnX[i],
                y: yPos,
                size: 9,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 15;
          }
          
          const rowData = [
            investor.investor_id || '',
            this.truncateText(investor.investor_name || '', 12),
            this.truncateText(investor.email || '', 12),
            investor.phone || '',
            investor.dob || '',
            this.truncateText(investor.source_of_funds || '', 15)
          ];
          
          rowData.forEach((text, i) => {
            currentPage.drawText(String(text), {
              x: columnX[i],
              y: yPos,
              size: 8,
              font: font,
              color: rgb(0.2, 0.2, 0.2),
            });
          });
          yPos -= 12;
        }
      }
      
      // Add page numbers
      const totalPages = pdfDoc.getPageCount();
      for (let i = 0; i < totalPages; i++) {
        const page = pdfDoc.getPages()[i];
        page.drawText(`Page ${i + 1} of ${totalPages}`, {
          x: width - 100,
          y: 50,
          size: 9,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
      
      if (import.meta.env.DEV) { console.log('✅ KYC Status Report PDF generated'); }
      return await pdfDoc.save();
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error filling KYC Status Report:', error); }
      throw error;
    }
  }

  /**
   * Fill New Investor Report template with data
   * @param {Object} data - Report data from backend
   * @returns {Promise<Uint8Array>} - Filled PDF bytes
   */
  async fillNewInvestorReport(data) {
    if (import.meta.env.DEV) { console.log('📄 Filling New Investor Report PDF...'); }
    
    try {
      const pdfDoc = await this.loadTemplate();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const firstPage = pdfDoc.getPages()[0];
      const { width, height } = firstPage.getSize();
      
      let currentPage = firstPage;
      let yPos = height - 180;
      
      // Title
      currentPage.drawText('New Investor Report', {
        x: 50,
        y: yPos,
        size: 20,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 30;
      
      // Report Period
      const reportPeriod = `Period: ${data.from_date || 'N/A'} to ${data.to_date || 'N/A'}`;
      currentPage.drawText(reportPeriod, {
        x: 50,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPos -= 15;
      
      if (data.investor_id) {
        currentPage.drawText(`Filtered by Investor ID: ${data.investor_id}`, {
          x: 50,
          y: yPos,
          size: 10,
          font: font,
          color: rgb(0.4, 0.4, 0.4),
        });
        yPos -= 15;
      }
      
      currentPage.drawText(`Total New Investors: ${data.total_new_investors || 0}`, {
        x: 50,
        y: yPos,
        size: 10,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 30;
      
      // Investment Details Table
      if (data.investment_details && data.investment_details.length > 0) {
        if (yPos < 200) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText(`Investor Investment Details (${data.investment_details.length} Investors)`, {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        // Table headers
        const columnX = [50, 120, 220, 340, 450];
        const headers = ['Investor ID', 'Investor Name', 'Series Invested', 'Total Invested', 'Total Payouts'];
        
        headers.forEach((header, i) => {
          currentPage.drawText(header, {
            x: columnX[i],
            y: yPos,
            size: 9,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        yPos -= 15;
        
        // Table rows
        for (const investor of data.investment_details) {
          if (yPos < 130) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180;
            
            // Redraw headers
            headers.forEach((header, i) => {
              currentPage.drawText(header, {
                x: columnX[i],
                y: yPos,
                size: 9,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 15;
          }
          
          const rowData = [
            investor.investor_id || '',
            this.truncateText(investor.investor_name || '', 15),
            this.truncateText(investor.series_invested || '', 18),
            `Rs ${(investor.total_invested || 0).toLocaleString('en-IN')}`,
            `Rs ${(investor.total_payouts || 0).toLocaleString('en-IN')}`
          ];
          
          rowData.forEach((text, i) => {
            currentPage.drawText(String(text), {
              x: columnX[i],
              y: yPos,
              size: 8,
              font: font,
              color: rgb(0.2, 0.2, 0.2),
            });
          });
          yPos -= 12;
        }
        
        yPos -= 20;
      }
      
      // Banking Details Table
      if (data.banking_details && data.banking_details.length > 0) {
        if (yPos < 200) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText(`Investors Bank Details (${data.banking_details.length} Investors)`, {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        // Table headers
        const columnX = [50, 120, 220, 320, 420];
        const headers = ['Investor ID', 'Investor Name', 'Bank Name', 'Account Number', 'IFSC Code'];
        
        headers.forEach((header, i) => {
          currentPage.drawText(header, {
            x: columnX[i],
            y: yPos,
            size: 9,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        yPos -= 15;
        
        // Table rows
        for (const investor of data.banking_details) {
          if (yPos < 130) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180;
            
            // Redraw headers
            headers.forEach((header, i) => {
              currentPage.drawText(header, {
                x: columnX[i],
                y: yPos,
                size: 9,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 15;
          }
          
          const rowData = [
            investor.investor_id || '',
            this.truncateText(investor.investor_name || '', 15),
            this.truncateText(investor.bank_name || '', 15),
            this.truncateText(investor.account_number || '', 15),
            investor.ifsc_code || ''
          ];
          
          rowData.forEach((text, i) => {
            currentPage.drawText(String(text), {
              x: columnX[i],
              y: yPos,
              size: 8,
              font: font,
              color: rgb(0.2, 0.2, 0.2),
            });
          });
          yPos -= 12;
        }
        
        yPos -= 20;
      }
      
      // KYC Details Table
      if (data.kyc_details && data.kyc_details.length > 0) {
        if (yPos < 200) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText(`Investor KYC Details (${data.kyc_details.length} Investors)`, {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        // Table headers
        const columnX = [50, 120, 200, 280, 350, 410];
        const headers = ['Investor ID', 'Investor Name', 'PAN', 'Aadhaar', 'KYC Status', 'Yet to Submit'];
        
        headers.forEach((header, i) => {
          currentPage.drawText(header, {
            x: columnX[i],
            y: yPos,
            size: 9,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        yPos -= 15;
        
        // Table rows
        for (const investor of data.kyc_details) {
          if (yPos < 130) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180;
            
            // Redraw headers
            headers.forEach((header, i) => {
              currentPage.drawText(header, {
                x: columnX[i],
                y: yPos,
                size: 9,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 15;
          }
          
          const rowData = [
            investor.investor_id || '',
            this.truncateText(investor.investor_name || '', 12),
            this.truncateText(investor.pan || '', 12),
            this.truncateText(investor.aadhaar || '', 12),
            investor.kyc_status || '',
            this.truncateText(investor.yet_to_submit_documents || '', 15)
          ];
          
          rowData.forEach((text, i) => {
            currentPage.drawText(String(text), {
              x: columnX[i],
              y: yPos,
              size: 8,
              font: font,
              color: rgb(0.2, 0.2, 0.2),
            });
          });
          yPos -= 12;
        }
        
        yPos -= 20;
      }
      
      // Personal Details Table
      if (data.personal_details && data.personal_details.length > 0) {
        if (yPos < 200) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPos = height - 180;
        }
        
        currentPage.drawText(`Investor Personal Details (${data.personal_details.length} Investors)`, {
          x: 50,
          y: yPos,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPos -= 25;
        
        // Table headers
        const columnX = [50, 110, 180, 250, 310, 370, 440];
        const headers = ['Investor ID', 'Name', 'Email', 'Phone', 'DOB', 'Source', 'Joined'];
        
        headers.forEach((header, i) => {
          currentPage.drawText(header, {
            x: columnX[i],
            y: yPos,
            size: 9,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        yPos -= 15;
        
        // Table rows
        for (const investor of data.personal_details) {
          if (yPos < 130) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPos = height - 180;
            
            // Redraw headers
            headers.forEach((header, i) => {
              currentPage.drawText(header, {
                x: columnX[i],
                y: yPos,
                size: 9,
                font: boldFont,
                color: rgb(0.2, 0.2, 0.2),
              });
            });
            yPos -= 15;
          }
          
          const rowData = [
            investor.investor_id || '',
            this.truncateText(investor.investor_name || '', 10),
            this.truncateText(investor.email || '', 10),
            this.truncateText(investor.phone || '', 10),
            investor.dob || '',
            this.truncateText(investor.source_of_funds || '', 10),
            investor.date_joined || ''
          ];
          
          rowData.forEach((text, i) => {
            currentPage.drawText(String(text), {
              x: columnX[i],
              y: yPos,
              size: 7,
              font: font,
              color: rgb(0.2, 0.2, 0.2),
            });
          });
          yPos -= 12;
        }
      }
      
      // Add page numbers
      const totalPages = pdfDoc.getPageCount();
      for (let i = 0; i < totalPages; i++) {
        const page = pdfDoc.getPages()[i];
        page.drawText(`Page ${i + 1} of ${totalPages}`, {
          x: width - 100,
          y: 50,
          size: 9,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
      
      if (import.meta.env.DEV) { console.log('✅ New Investor Report PDF generated'); }
      return await pdfDoc.save();
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error filling New Investor Report:', error); }
      throw error;
    }
  }

  /**
   * Generic method to fill any report
   * @param {string} reportType - Type of report
   * @param {Object} data - Report data from backend
   * @returns {Promise<Uint8Array>}
   */
  async fillReport(reportType, data) {
    switch (reportType) {
      case 'Monthly Collection Report':
        return await this.fillMonthlyCollectionReport(data);
      
      case 'Payout Statement':
        return await this.fillPayoutStatementReport(data);
      
      case 'Series-wise Performance':
        return await this.fillSeriesPerformanceReport(data);
      
      case 'Investor Portfolio Summary':
        return await this.fillInvestorPortfolioReport(data);
      
      case 'KYC Status Report':
        return await this.fillKYCStatusReport(data);
      
      case 'New Investor Report':
        return await this.fillNewInvestorReport(data);
      
      case 'RBI Compliance Report':
        return await this.fillRBIComplianceReport(data);
      
      case 'SEBI Disclosure Report':
        return await this.fillSEBIDisclosureReport(data);
      
      // TODO: Add other report types here
      case 'Audit Trail Report':
      case 'Daily Activity Report':
      case 'Subscription Trend Analysis':
      case 'Series Maturity Report':
        throw new Error(`Report type "${reportType}" not yet implemented`);
      
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  /**
   * Fill RBI Compliance Report
   * @param {Object} data - Report data from backend
   * @returns {Promise<Uint8Array>}
   */
  async fillRBIComplianceReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📄 Filling RBI Compliance Report...'); }
      
      const pdfDoc = await this.loadTemplate();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let currentPage = firstPage;
      let yPosition = height - 120;
      const leftMargin = 50;
      const rightMargin = width - 50;
      const lineHeight = 15;
      
      // Sanitize text to remove Unicode characters that WinAnsi can't encode
      const sanitizeText = (text) => {
        if (!text) return '';
        return String(text)
          .replace(/₹/g, 'Rs.')
          .replace(/≥/g, '>=')
          .replace(/≤/g, '<=')
          .replace(/≠/g, '!=')
          .replace(/×/g, 'x')
          .replace(/÷/g, '/')
          .replace(/°/g, ' deg')
          .replace(/•/g, '*')
          .replace(/—/g, '-')
          .replace(/–/g, '-')
          .replace(/"/g, '"')
          .replace(/"/g, '"')
          .replace(/'/g, "'")
          .replace(/'/g, "'")
          .replace(/…/g, '...')
          .replace(/[^\x00-\x7F]/g, ''); // Remove any remaining non-ASCII characters
      };
      
      const formatCurrency = (amount) => {
        if (amount >= 10000000) return `Rs.${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `Rs.${(amount / 100000).toFixed(2)} L`;
        return `Rs.${amount.toFixed(2)}`;
      };
      
      // Title
      currentPage.drawText('RBI COMPLIANCE REPORT', {
        x: leftMargin,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
      
      // Generated Date
      currentPage.drawText(`Generated: ${new Date().toLocaleDateString('en-GB')}`, {
        x: leftMargin,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 30;
      
      // Summary Section
      const summary = data.summary || {};
      
      currentPage.drawText('COMPLIANCE SUMMARY', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const summaryItems = [
        ['Total AUM:', formatCurrency(summary.total_aum || 0)],
        ['Compliance Score:', `${summary.compliance_score || 0}%`],
        ['KYC Pending:', `${summary.kyc_pending || 0}`],
        ['Upcoming Payouts (30d):', formatCurrency(summary.upcoming_payouts || 0)]
      ];
      
      summaryItems.forEach(([label, value]) => {
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(value, {
          x: leftMargin + 200,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
      
      yPosition -= 20;
      
      // Attention Items
      const attentionItems = data.attention_items || [];
      if (attentionItems.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`ITEMS REQUIRING ATTENTION (${attentionItems.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0.8, 0, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('Series', { x: leftMargin, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('Pre-Compliance', { x: leftMargin + 80, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('Post-Compliance', { x: leftMargin + 180, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('Recurring', { x: leftMargin + 280, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('KYC', { x: leftMargin + 360, y: yPosition, size: 9, font: boldFont });
        yPosition -= 15;
        
        for (const item of attentionItems) {
          if (yPosition < 100) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(sanitizeText(item.series_code || ''), { x: leftMargin, y: yPosition, size: 8, font: font });
          
          const preText = item.pre_compliance_pending > 0 ? `${item.pre_compliance_pending} pending` : 'Complete';
          currentPage.drawText(sanitizeText(preText), { x: leftMargin + 80, y: yPosition, size: 8, font: font });
          
          const postText = item.post_compliance_pending > 0 ? `${item.post_compliance_pending} pending` : 'Complete';
          currentPage.drawText(sanitizeText(postText), { x: leftMargin + 180, y: yPosition, size: 8, font: font });
          
          const recurringText = item.recurring_compliance_pending > 0 ? `${item.recurring_compliance_pending} pending` : 'Complete';
          currentPage.drawText(sanitizeText(recurringText), { x: leftMargin + 280, y: yPosition, size: 8, font: font });
          
          const kycText = item.kyc_pending > 0 ? `${item.kyc_pending} inv.` : 'Complete';
          currentPage.drawText(sanitizeText(kycText), { x: leftMargin + 360, y: yPosition, size: 8, font: font });
          
          yPosition -= 12;
        }
        
        yPosition -= 20;
      }
      
      // Series Compliance
      const seriesCompliance = data.series_compliance || [];
      if (seriesCompliance.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`SERIES COMPLIANCE DETAILS (${seriesCompliance.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('Series', { x: leftMargin, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('Security Type', { x: leftMargin + 80, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('Rating', { x: leftMargin + 180, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('Trustee', { x: leftMargin + 250, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('KYC Status', { x: leftMargin + 380, y: yPosition, size: 9, font: boldFont });
        yPosition -= 15;
        
        for (const series of seriesCompliance) {
          if (yPosition < 100) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(sanitizeText(series.series_code || ''), { x: leftMargin, y: yPosition, size: 8, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(series.security_type || ''), 15), { x: leftMargin + 80, y: yPosition, size: 8, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(series.credit_rating || ''), 10), { x: leftMargin + 180, y: yPosition, size: 8, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(series.trustee_name || ''), 20), { x: leftMargin + 250, y: yPosition, size: 8, font: font });
          currentPage.drawText(`${series.kyc_completed_count}/${series.kyc_total_count} (${series.kyc_completion_percent}%)`, { x: leftMargin + 380, y: yPosition, size: 8, font: font });
          yPosition -= 12;
        }
        
        yPosition -= 20;
      }
      
      // Investor Summary
      const investorSummary = data.investor_summary || {};
      if (yPosition < 150) {
        currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
        yPosition = height - 120;
      }
      
      currentPage.drawText('INVESTOR KYC SUMMARY', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const investorItems = [
        ['Total Investors:', `${investorSummary.total_investors || 0}`],
        ['KYC Completed:', `${investorSummary.kyc_completed || 0}`],
        ['KYC Pending:', `${investorSummary.kyc_pending || 0}`],
        ['KYC Rejected:', `${investorSummary.kyc_rejected || 0}`]
      ];
      
      investorItems.forEach(([label, value]) => {
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(value, {
          x: leftMargin + 150,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
      
      yPosition -= 20;
      
      // Top Holdings (Concentration Risk)
      const topHoldings = investorSummary.top_holdings || [];
      if (topHoldings.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`INVESTOR HOLDINGS - CONCENTRATION RISK (${topHoldings.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('Investor ID', { x: leftMargin, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('Investor Name', { x: leftMargin + 70, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('Series', { x: leftMargin + 200, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('Amount (Rs.)', { x: leftMargin + 280, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('% of Series', { x: leftMargin + 380, y: yPosition, size: 9, font: boldFont });
        yPosition -= 15;
        
        for (const holding of topHoldings) {
          if (yPosition < 100) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(sanitizeText(holding.investor_id || ''), { x: leftMargin, y: yPosition, size: 8, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(holding.investor_name || ''), 20), { x: leftMargin + 70, y: yPosition, size: 8, font: font });
          currentPage.drawText(sanitizeText(holding.series_code || ''), { x: leftMargin + 200, y: yPosition, size: 8, font: font });
          currentPage.drawText(holding.amount_invested ? holding.amount_invested.toLocaleString('en-IN') : '0', { x: leftMargin + 280, y: yPosition, size: 8, font: font });
          currentPage.drawText(`${holding.percent_of_series || 0}%`, { x: leftMargin + 380, y: yPosition, size: 8, font: font });
          yPosition -= 12;
        }
      }
      
      
      const pdfBytes = await pdfDoc.save();
      if (import.meta.env.DEV) { console.log('✅ RBI Compliance Report PDF generated successfully'); }
      
      return pdfBytes;
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error filling RBI Compliance Report:', error); }
      throw error;
    }
  }

  /**
   * Fill SEBI Disclosure Report
   * @param {Object} data - Report data from backend
   * @returns {Promise<Uint8Array>}
   */
  async fillSEBIDisclosureReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📄 Filling SEBI Disclosure Report...'); }
      
      const pdfDoc = await this.loadTemplate();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let currentPage = firstPage;
      let yPosition = height - 120;
      const leftMargin = 50;
      const rightMargin = width - 50;
      const lineHeight = 15;
      
      // Sanitize text to remove Unicode characters
      const sanitizeText = (text) => {
        if (!text) return '';
        return String(text)
          .replace(/₹/g, 'Rs.')
          .replace(/≥/g, '>=')
          .replace(/≤/g, '<=')
          .replace(/≠/g, '!=')
          .replace(/×/g, 'x')
          .replace(/÷/g, '/')
          .replace(/°/g, ' deg')
          .replace(/•/g, '*')
          .replace(/—/g, '-')
          .replace(/–/g, '-')
          .replace(/"/g, '"')
          .replace(/"/g, '"')
          .replace(/'/g, "'")
          .replace(/'/g, "'")
          .replace(/…/g, '...')
          .replace(/[^\x00-\x7F]/g, '');
      };
      
      const formatCurrency = (amount) => {
        if (amount >= 10000000) return `Rs.${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `Rs.${(amount / 100000).toFixed(2)} L`;
        return `Rs.${amount.toFixed(2)}`;
      };
      
      // Title
      currentPage.drawText('SEBI DISCLOSURE REPORT', {
        x: leftMargin,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
      
      // Generated Date
      currentPage.drawText(`Generated: ${new Date().toLocaleDateString('en-GB')}`, {
        x: leftMargin,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 30;
      
      // ============================================================
      // SECTION 1: SUMMARY
      // ============================================================
      const summary = data.summary || {};
      
      currentPage.drawText('1. SUMMARY', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const summaryItems = [
        ['Total Series:', `${summary.total_series || 0}`],
        ['Active Series:', `${summary.active_series || 0}`],
        ['Avg Interest Rate:', `${summary.avg_interest_rate || 0}%`],
        ['Avg Investment/Series:', formatCurrency(summary.avg_investment_per_series || 0)]
      ];
      
      summaryItems.forEach(([label, value]) => {
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(value, {
          x: leftMargin + 200,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
      
      yPosition -= 20;
      
      // ============================================================
      // SECTION 2: SERIES DETAILS
      // ============================================================
      const seriesDetails = data.series_details || [];
      if (seriesDetails.length > 0) {
        if (yPosition < 200) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText('2. ISSUE & SERIES DETAILS', {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        for (const series of seriesDetails) {
          if (yPosition < 150) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(`Series: ${sanitizeText(series.series_code || '')}`, {
            x: leftMargin,
            y: yPosition,
            size: 11,
            font: boldFont,
            color: rgb(0, 0, 0),
          });
          yPosition -= 15;
          
          const seriesInfo = [
            ['Name:', sanitizeText(series.series_name || '')],
            ['Status:', sanitizeText(series.status || '')],
            ['Issue Date:', sanitizeText(series.issue_date || 'N/A')],
            ['Maturity Date:', sanitizeText(series.maturity_date || 'N/A')],
            ['Tenure:', `${series.tenure_days || 0} days`],
            ['Target Amount:', formatCurrency(series.target_amount || 0)],
            ['Funds Raised:', formatCurrency(series.funds_raised || 0)],
            ['Outstanding:', formatCurrency(series.outstanding_amount || 0)],
            ['Interest Rate:', `${series.interest_rate || 0}%`],
            ['Payment Frequency:', sanitizeText(series.payment_frequency || '')],
            ['Credit Rating:', sanitizeText(series.credit_rating || 'N/A')],
            ['Security Type:', sanitizeText(series.security_type || '')],
            ['Debenture Trustee:', sanitizeText(series.debenture_trustee || 'N/A')],
            ['Investors:', `${series.investor_count || 0}`]
          ];
          
          for (const [label, value] of seriesInfo) {
            if (yPosition < 80) {
              currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
              yPosition = height - 120;
            }
            currentPage.drawText(label, {
              x: leftMargin + 10,
              y: yPosition,
              size: 9,
              font: font,
              color: rgb(0, 0, 0),
            });
            currentPage.drawText(this.truncateText(value, 50), {
              x: leftMargin + 150,
              y: yPosition,
              size: 9,
              font: font,
              color: rgb(0, 0, 0),
            });
            yPosition -= 12;
          }
          
          yPosition -= 10;
        }
        
        yPosition -= 10;
      }
      
      // ============================================================
      // SECTION 3: PAYMENT COMPLIANCE
      // ============================================================
      const paymentSummary = data.payment_compliance_summary || {};
      
      if (yPosition < 200) {
        currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
        yPosition = height - 120;
      }
      
      currentPage.drawText('3. PAYMENT COMPLIANCE & DEFAULTS (LODR Regulation 57)', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const paymentItems = [
        ['On-Time Payments:', `${paymentSummary.on_time_payments || 0}`],
        ['Payouts Till Date:', `${paymentSummary.payouts_till_date || 0}`],
        ['Overdue Payments:', `${paymentSummary.overdue_payments || 0}`],
        ['Payout Rate:', `${paymentSummary.payout_rate || 0}%`]
      ];
      
      paymentItems.forEach(([label, value]) => {
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(value, {
          x: leftMargin + 200,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
      
      yPosition -= 20;
      
      // Payment Records
      const paymentRecords = data.payment_records || [];
      if (paymentRecords.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText('Payment Records:', {
          x: leftMargin,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('Series', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Scheduled', { x: leftMargin + 60, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Actual', { x: leftMargin + 130, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Amount', { x: leftMargin + 200, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Investors', { x: leftMargin + 280, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Status', { x: leftMargin + 340, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        for (const record of paymentRecords.slice(0, 50)) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(sanitizeText(record.series_code || ''), { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(record.scheduled_date || ''), { x: leftMargin + 60, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(record.actual_date || 'Pending'), { x: leftMargin + 130, y: yPosition, size: 7, font: font });
          currentPage.drawText(record.amount ? record.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0', { x: leftMargin + 200, y: yPosition, size: 7, font: font });
          currentPage.drawText(`${record.investor_count || 0}`, { x: leftMargin + 280, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(record.status || ''), { x: leftMargin + 340, y: yPosition, size: 7, font: font });
          yPosition -= 10;
        }
        
        yPosition -= 15;
      }
      
      // ============================================================
      // SECTION 4: GRIEVANCE MECHANISM
      // ============================================================
      const grievanceSummary = data.grievance_summary || {};
      
      if (yPosition < 200) {
        currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
        yPosition = height - 120;
      }
      
      currentPage.drawText('4. INVESTOR GRIEVANCE MECHANISM (LODR Regulation 13)', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const grievanceItems = [
        ['Total Grievances:', `${grievanceSummary.total_grievances || 0}`],
        ['Open Grievances:', `${grievanceSummary.open_grievances || 0}`],
        ['Resolved Grievances:', `${grievanceSummary.resolved_grievances || 0}`],
        ['High Priority Open:', `${grievanceSummary.high_priority_grievances || 0}`]
      ];
      
      grievanceItems.forEach(([label, value]) => {
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(value, {
          x: leftMargin + 200,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
      
      yPosition -= 20;
      
      // Grievance Records
      const grievanceRecords = data.grievance_records || [];
      if (grievanceRecords.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText('Grievance Records:', {
          x: leftMargin,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('ID', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Investor', { x: leftMargin + 50, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Series', { x: leftMargin + 130, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Category', { x: leftMargin + 180, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Priority', { x: leftMargin + 260, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Status', { x: leftMargin + 320, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Days', { x: leftMargin + 380, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        for (const record of grievanceRecords.slice(0, 50)) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(sanitizeText(record.grievance_id || ''), { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(record.investor_name || ''), 12), { x: leftMargin + 50, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(record.series_code || ''), { x: leftMargin + 130, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(record.category || ''), 12), { x: leftMargin + 180, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(record.priority || ''), { x: leftMargin + 260, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(record.status || ''), { x: leftMargin + 320, y: yPosition, size: 7, font: font });
          currentPage.drawText(`${record.days_pending || 0}`, { x: leftMargin + 380, y: yPosition, size: 7, font: font });
          yPosition -= 10;
        }
        
        yPosition -= 15;
      }
      
      // ============================================================
      // SECTION 5: CONTINUOUS COMPLIANCE TRACKING
      // ============================================================
      const complianceSummary = data.compliance_tracking_summary || {};
      
      if (yPosition < 200) {
        currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
        yPosition = height - 120;
      }
      
      currentPage.drawText('5. CONTINUOUS COMPLIANCE TRACKING (LODR Regulation 46)', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const complianceItems = [
        ['Total Compliance Items:', `${complianceSummary.total_compliance_items || 0}`],
        ['Completed:', `${complianceSummary.total_completed || 0}`],
        ['Pending:', `${complianceSummary.total_pending || 0}`],
        ['Compliance Rate:', `${complianceSummary.compliance_rate || 0}%`]
      ];
      
      complianceItems.forEach(([label, value]) => {
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(value, {
          x: leftMargin + 200,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
      
      yPosition -= 20;
      
      // Compliance Attention Items
      const complianceAttentionItems = data.compliance_attention_items || [];
      if (complianceAttentionItems.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`Items Requiring Attention (${complianceAttentionItems.length}):`, {
          x: leftMargin,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0.8, 0, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('Series', { x: leftMargin, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('Pre-Compliance', { x: leftMargin + 80, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('Post-Compliance', { x: leftMargin + 200, y: yPosition, size: 9, font: boldFont });
        currentPage.drawText('Recurring', { x: leftMargin + 320, y: yPosition, size: 9, font: boldFont });
        yPosition -= 15;
        
        for (const item of complianceAttentionItems) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(sanitizeText(item.series_code || ''), { x: leftMargin, y: yPosition, size: 8, font: font });
          
          const preText = item.pre_compliance_pending > 0 ? `${item.pre_compliance_pending} pending` : 'Complete';
          currentPage.drawText(sanitizeText(preText), { x: leftMargin + 80, y: yPosition, size: 8, font: font });
          
          const postText = item.post_compliance_pending > 0 ? `${item.post_compliance_pending} pending` : 'Complete';
          currentPage.drawText(sanitizeText(postText), { x: leftMargin + 200, y: yPosition, size: 8, font: font });
          
          const recurringText = item.recurring_compliance_pending > 0 ? `${item.recurring_compliance_pending} pending` : 'Complete';
          currentPage.drawText(sanitizeText(recurringText), { x: leftMargin + 320, y: yPosition, size: 8, font: font });
          
          yPosition -= 12;
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      if (import.meta.env.DEV) { console.log('✅ SEBI Disclosure Report PDF generated successfully'); }
      
      return pdfBytes;
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error filling SEBI Disclosure Report:', error); }
      throw error;
    }
  }

  /**
   * Fill Audit Trail Report
   * @param {Object} data - Report data from backend
   * @returns {Promise<Uint8Array>}
   */
  async fillAuditTrailReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📄 Filling Audit Trail Report...'); }
      
      const pdfDoc = await this.loadTemplate();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let currentPage = firstPage;
      let yPosition = height - 120;
      const leftMargin = 50;
      const rightMargin = width - 50;
      const lineHeight = 15;
      
      // Sanitize text to remove Unicode characters
      const sanitizeText = (text) => {
        if (!text) return '';
        return String(text)
          .replace(/₹/g, 'Rs.')
          .replace(/≥/g, '>=')
          .replace(/≤/g, '<=')
          .replace(/≠/g, '!=')
          .replace(/×/g, 'x')
          .replace(/÷/g, '/')
          .replace(/°/g, ' deg')
          .replace(/•/g, '*')
          .replace(/—/g, '-')
          .replace(/–/g, '-')
          .replace(/"/g, '"')
          .replace(/"/g, '"')
          .replace(/'/g, "'")
          .replace(/'/g, "'")
          .replace(/…/g, '...')
          .replace(/[^\x00-\x7F]/g, '');
      };
      
      const formatCurrency = (amount) => {
        if (amount >= 10000000) return `Rs.${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `Rs.${(amount / 100000).toFixed(2)} L`;
        return `Rs.${amount.toFixed(2)}`;
      };
      
      // Title
      currentPage.drawText('AUDIT TRAIL REPORT', {
        x: leftMargin,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
      
      // Generated Date
      currentPage.drawText(`Generated: ${new Date().toLocaleDateString('en-GB')}`, {
        x: leftMargin,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 30;
      
      // ============================================================
      // FILTERS
      // ============================================================
      const filters = data.filters || {};
      
      currentPage.drawText('FILTERS', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const filterItems = [
        ['From Date:', filters.from_date || 'N/A'],
        ['To Date:', filters.to_date || 'N/A'],
        ['Series Filter:', filters.series_id ? `Series ID: ${filters.series_id}` : 'All Series']
      ];
      
      filterItems.forEach(([label, value]) => {
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(sanitizeText(value), {
          x: leftMargin + 120,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
      
      yPosition -= 20;
      
      // ============================================================
      // SUMMARY
      // ============================================================
      const summary = data.summary || {};
      
      currentPage.drawText('SUMMARY', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const summaryItems = [
        ['Total Investments:', formatCurrency(summary.total_investments || 0)],
        ['Total Payouts Till Date:', formatCurrency(summary.total_payouts || 0)],
        ['Upcoming Payouts (Next Month):', formatCurrency(summary.upcoming_payouts || 0)],
        ['Payout Rate:', `${summary.payout_rate || 0}%`]
      ];
      
      summaryItems.forEach(([label, value]) => {
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(value, {
          x: leftMargin + 200,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
      
      yPosition -= 20;
      
      // ============================================================
      // INVESTMENT TRANSACTIONS
      // ============================================================
      const investments = data.investments || [];
      if (investments.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`INVESTMENT TRANSACTIONS (${investments.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('ID', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Date Rcvd', { x: leftMargin + 25, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Investor', { x: leftMargin + 80, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Series', { x: leftMargin + 160, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Amount', { x: leftMargin + 220, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Date Trnsfr', { x: leftMargin + 280, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Status', { x: leftMargin + 345, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Created At', { x: leftMargin + 395, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        for (const investment of investments) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(`${investment.id || ''}`, { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(investment.date_received || ''), { x: leftMargin + 25, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(investment.investor_name || ''), 12), { x: leftMargin + 80, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(investment.series_code || ''), { x: leftMargin + 160, y: yPosition, size: 7, font: font });
          currentPage.drawText(investment.amount ? investment.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0', { x: leftMargin + 220, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(investment.date_transferred || 'N/A'), { x: leftMargin + 280, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(investment.status || ''), { x: leftMargin + 345, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(investment.created_at || ''), { x: leftMargin + 395, y: yPosition, size: 6, font: font });
          yPosition -= 10;
        }
        
        yPosition -= 20;
      }
      
      // ============================================================
      // TABLE 1: COMPLETED PAYOUTS
      // ============================================================
      const completedPayouts = data.completed_payouts || [];
      if (completedPayouts.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`COMPLETED PAYOUTS (${completedPayouts.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0.5, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('Series', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Investor', { x: leftMargin + 55, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Invested', { x: leftMargin + 125, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Payout Month', { x: leftMargin + 180, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Payout Date', { x: leftMargin + 260, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Paid Timestamp', { x: leftMargin + 330, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Payout Amt', { x: leftMargin + 450, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        for (const payout of completedPayouts) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(this.truncateText(sanitizeText(payout.series_name || ''), 8), { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(payout.investor_name || ''), 10), { x: leftMargin + 55, y: yPosition, size: 7, font: font });
          currentPage.drawText(payout.invested_amount ? payout.invested_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0', { x: leftMargin + 125, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(payout.payout_month || ''), { x: leftMargin + 180, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(payout.payout_date || ''), { x: leftMargin + 260, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(payout.paid_timestamp || ''), { x: leftMargin + 330, y: yPosition, size: 6, font: font });
          currentPage.drawText(payout.payout_amount ? payout.payout_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0', { x: leftMargin + 450, y: yPosition, size: 7, font: font });
          yPosition -= 10;
        }
        
        yPosition -= 20;
      }
      
      // ============================================================
      // TABLE 2: PENDING PAYOUTS
      // ============================================================
      const pendingPayouts = data.pending_payouts || [];
      if (pendingPayouts.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`PENDING PAYOUTS (${pendingPayouts.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(1, 0.6, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('Series', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Investor', { x: leftMargin + 55, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Invested', { x: leftMargin + 125, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Payout Month', { x: leftMargin + 180, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Payout Date', { x: leftMargin + 260, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Scheduled Time', { x: leftMargin + 330, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('To Be Paid', { x: leftMargin + 450, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        for (const payout of pendingPayouts) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(this.truncateText(sanitizeText(payout.series_name || ''), 8), { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(payout.investor_name || ''), 10), { x: leftMargin + 55, y: yPosition, size: 7, font: font });
          currentPage.drawText(payout.invested_amount ? payout.invested_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0', { x: leftMargin + 125, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(payout.payout_month || ''), { x: leftMargin + 180, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(payout.payout_date || ''), { x: leftMargin + 260, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(payout.scheduled_timestamp || ''), { x: leftMargin + 330, y: yPosition, size: 6, font: font });
          currentPage.drawText(payout.payout_amount ? payout.payout_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0', { x: leftMargin + 450, y: yPosition, size: 7, font: font });
          yPosition -= 10;
        }
        
        yPosition -= 20;
      }
      
      // ============================================================
      // TABLE 3: UPCOMING PAYOUTS (NEXT MONTH)
      // ============================================================
      const upcomingPayouts = data.upcoming_payouts || [];
      if (upcomingPayouts.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`UPCOMING PAYOUTS - NEXT MONTH (${upcomingPayouts.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0.4, 0.8),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('Series Name', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Investor Name', { x: leftMargin + 90, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Payout Month', { x: leftMargin + 200, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Payout Date', { x: leftMargin + 300, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('To Be Paid Amount', { x: leftMargin + 400, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        for (const payout of upcomingPayouts) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(this.truncateText(sanitizeText(payout.series_name || ''), 14), { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(payout.investor_name || ''), 16), { x: leftMargin + 90, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(payout.payout_month || ''), { x: leftMargin + 200, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(payout.payout_date || ''), { x: leftMargin + 300, y: yPosition, size: 7, font: font });
          currentPage.drawText(payout.payout_amount ? payout.payout_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0', { x: leftMargin + 400, y: yPosition, size: 7, font: font });
          yPosition -= 10;
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      if (import.meta.env.DEV) { console.log('✅ Audit Trail Report PDF generated successfully'); }
      
      return pdfBytes;
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error filling Audit Trail Report:', error); }
      throw error;
    }
  }

  /**
   * Fill Daily Activity Report template with data
   * @param {Object} data - Report data from backend
   * @param {string} chartImageDataUrl - Base64 data URL of the pie chart image
   * @returns {Promise<Uint8Array>}
   */
  async fillDailyActivityReport(data, chartImageDataUrl = null) {
    try {
      if (import.meta.env.DEV) { console.log('📄 Filling Daily Activity Report...'); }
      
      const pdfDoc = await this.loadTemplate();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let currentPage = firstPage;
      let yPosition = height - 120;
      const leftMargin = 50;
      const rightMargin = width - 50;
      const lineHeight = 15;
      
      // Sanitize text to remove Unicode characters
      const sanitizeText = (text) => {
        if (!text) return '';
        return String(text)
          .replace(/₹/g, 'Rs.')
          .replace(/≥/g, '>=')
          .replace(/≤/g, '<=')
          .replace(/≠/g, '!=')
          .replace(/×/g, 'x')
          .replace(/÷/g, '/')
          .replace(/°/g, ' deg')
          .replace(/•/g, '*')
          .replace(/—/g, '-')
          .replace(/–/g, '-')
          .replace(/"/g, '"')
          .replace(/"/g, '"')
          .replace(/'/g, "'")
          .replace(/'/g, "'")
          .replace(/…/g, '...')
          .replace(/[^\x00-\x7F]/g, '');
      };
      
      const formatTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      };
      
      // Title
      currentPage.drawText('DAILY ACTIVITY REPORT', {
        x: leftMargin,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
      
      // Generated Date
      currentPage.drawText(`Generated: ${new Date().toLocaleDateString('en-GB')}`, {
        x: leftMargin,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 30;
      
      // ============================================================
      // FILTERS
      // ============================================================
      const filters = data.filters || {};
      
      currentPage.drawText('FILTERS', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const filterItems = [
        ['From Date:', filters.from_date || 'N/A'],
        ['To Date:', filters.to_date || 'N/A'],
        ['Role Filter:', filters.role ? filters.role : 'All Roles']
      ];
      
      filterItems.forEach(([label, value]) => {
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(sanitizeText(value), {
          x: leftMargin + 120,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
      
      yPosition -= 20;
      
      // ============================================================
      // SUMMARY
      // ============================================================
      const summary = data.summary || {};
      
      currentPage.drawText('SUMMARY', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const summaryItems = [
        ['Total Users:', `${summary.total_users || 0}`],
        ['Avg Time Spent:', formatTime(summary.avg_time_spent_minutes || 0)],
        ['Total Roles:', `${summary.total_roles || 0}`]
      ];
      
      summaryItems.forEach(([label, value]) => {
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(value, {
          x: leftMargin + 200,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
      
      yPosition -= 20;
      
      // ============================================================
      // USER ACTIVITY TABLE
      // ============================================================
      const userActivities = data.user_activities || [];
      if (userActivities.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`USER ACTIVITY (${userActivities.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('User ID', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('User Name', { x: leftMargin + 70, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Role', { x: leftMargin + 200, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Login Count', { x: leftMargin + 340, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Time Spent', { x: leftMargin + 430, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        for (const activity of userActivities) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(sanitizeText(activity.user_id || ''), { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(activity.user_name || ''), 18), { x: leftMargin + 70, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(activity.role || ''), 18), { x: leftMargin + 200, y: yPosition, size: 7, font: font });
          currentPage.drawText(`${activity.login_count || 0}`, { x: leftMargin + 360, y: yPosition, size: 7, font: font });
          currentPage.drawText(sanitizeText(activity.time_spent_formatted || '0m'), { x: leftMargin + 430, y: yPosition, size: 7, font: boldFont });
          yPosition -= 10;
        }
        
        yPosition -= 20;
      }
      
      // ============================================================
      // ROLE BREAKDOWN SECTION WITH PIE CHART
      // ============================================================
      const roleBreakdown = data.role_breakdown || [];
      if (roleBreakdown.length > 0) {
        // Check if we need a new page
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        // Section title
        currentPage.drawText(`TIME SPENT BY ROLE (${roleBreakdown.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 30;
        
        // Embed pie chart image if available
        if (chartImageDataUrl) {
          try {
            if (import.meta.env.DEV) { console.log('📊 Embedding pie chart image in PDF...'); }
            
            // Ensure we have enough space for the chart (need at least 300px)
            if (yPosition < 320) {
              currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
              yPosition = height - 120;
            }
            
            // Convert base64 data URL to bytes
            const base64Data = chartImageDataUrl.split(',')[1];
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            // Embed the PNG image
            const chartImage = await pdfDoc.embedPng(imageBytes);
            
            // Scale the image to fit nicely (max width 400px, max height 250px)
            const maxWidth = 400;
            const maxHeight = 250;
            let scale = Math.min(maxWidth / chartImage.width, maxHeight / chartImage.height);
            const imageDims = chartImage.scale(scale);
            
            // Center the image horizontally
            const imageX = (width - imageDims.width) / 2;
            const imageY = yPosition - imageDims.height;
            
            // Draw the image
            currentPage.drawImage(chartImage, {
              x: imageX,
              y: imageY,
              width: imageDims.width,
              height: imageDims.height,
            });
            
            // Update yPosition to be below the image
            yPosition = imageY - 30;
            if (import.meta.env.DEV) { console.log('✅ Pie chart image embedded successfully'); }
            if (import.meta.env.DEV) { console.log(`   Image dimensions: ${imageDims.width}x${imageDims.height}`); }
            if (import.meta.env.DEV) { console.log(`   New yPosition: ${yPosition}`); }
          } catch (error) {
            if (import.meta.env.DEV) { console.error('❌ Error embedding pie chart image:', error); }
            // Continue without the image
          }
        }
        
        // Ensure we have space for the table (need at least 150px)
        if (yPosition < 150) {
          if (import.meta.env.DEV) { console.log('⚠️ Not enough space for table, creating new page'); }
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        // Detailed Breakdown subtitle
        currentPage.drawText('Detailed Breakdown', {
          x: leftMargin,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 25;
        
        // Table header
        currentPage.drawText('Role', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Total Time', { x: leftMargin + 250, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Percentage', { x: leftMargin + 380, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        // Table rows
        if (import.meta.env.DEV) { console.log(`📋 Drawing ${roleBreakdown.length} role breakdown rows...`); }
        for (const role of roleBreakdown) {
          // Check if we need a new page for this row
          if (yPosition < 80) {
            if (import.meta.env.DEV) { console.log('⚠️ Creating new page for table continuation'); }
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(this.truncateText(sanitizeText(role.role || ''), 35), { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(formatTime(role.total_time_minutes || 0), { x: leftMargin + 250, y: yPosition, size: 7, font: boldFont });
          currentPage.drawText(`${role.percentage || 0}%`, { x: leftMargin + 380, y: yPosition, size: 7, font: boldFont });
          yPosition -= 10;
        }
        if (import.meta.env.DEV) { console.log('✅ Role breakdown table completed'); }
      }
      
      const pdfBytes = await pdfDoc.save();
      if (import.meta.env.DEV) { console.log('✅ Daily Activity Report PDF generated successfully'); }
      
      return pdfBytes;
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error filling Daily Activity Report:', error); }
      throw error;
    }
  }

  /**
   * Fill Subscription Trend Analysis Report data into template
   * @param {Object} data - Report data from backend
   * @param {string} chartImageDataUrl - Base64 encoded chart image (optional)
   * @returns {Promise<Uint8Array>}
   */
  async fillSubscriptionTrendAnalysis(data, chartImageDataUrl = null) {
    try {
      if (import.meta.env.DEV) { console.log('📄 Filling Subscription Trend Analysis Report...'); }
      
      const pdfDoc = await this.loadTemplate();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let currentPage = firstPage;
      let yPosition = height - 120;
      const leftMargin = 50;
      const rightMargin = width - 50;
      const lineHeight = 15;
      
      // Sanitize text to remove Unicode characters
      const sanitizeText = (text) => {
        if (!text) return '';
        return String(text)
          .replace(/₹/g, 'Rs.')
          .replace(/≥/g, '>=')
          .replace(/≤/g, '<=')
          .replace(/≠/g, '!=')
          .replace(/×/g, 'x')
          .replace(/÷/g, '/')
          .replace(/°/g, ' deg')
          .replace(/•/g, '*')
          .replace(/—/g, '-')
          .replace(/–/g, '-')
          .replace(/"/g, '"')
          .replace(/"/g, '"')
          .replace(/'/g, "'")
          .replace(/'/g, "'")
          .replace(/…/g, '...')
          .replace(/[^\x00-\x7F]/g, '');
      };
      
      const formatCurrency = (amount) => {
        if (amount >= 10000000) return `Rs.${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `Rs.${(amount / 100000).toFixed(2)} L`;
        return `Rs.${amount.toFixed(2)}`;
      };
      
      // Title
      currentPage.drawText('SUBSCRIPTION TREND ANALYSIS', {
        x: leftMargin,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
      
      // Generated Date
      currentPage.drawText(`Generated: ${new Date().toLocaleDateString('en-GB')}`, {
        x: leftMargin,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 30;
      
      // ============================================================
      // SECTION 1: OVERVIEW SUMMARY
      // ============================================================
      const summaryTop = data.summary_top || {};
      
      currentPage.drawText('OVERVIEW SUMMARY', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const summaryItems = [
        ['Total Series:', `${summaryTop.total_series || 0}`],
        ['Active Series:', `${summaryTop.active_series || 0}`],
        ['Total Investors:', `${summaryTop.total_investors || 0}`],
        ['Active Investors:', `${summaryTop.active_investors || 0}`]
      ];
      
      summaryItems.forEach(([label, value]) => {
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(value, {
          x: leftMargin + 200,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
      
      yPosition -= 20;
      
      // ============================================================
      // SECTION 2: INVESTOR DETAILS TABLE
      // ============================================================
      const investorDetails = data.investor_details || [];
      if (investorDetails.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`INVESTOR DETAILS (${investorDetails.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        // Table header - redesigned for better spacing
        currentPage.drawText('ID', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Name', { x: leftMargin + 60, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Email', { x: leftMargin + 160, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Phone', { x: leftMargin + 300, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Investment', { x: leftMargin + 390, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Series', { x: leftMargin + 480, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        for (const investor of investorDetails) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(this.truncateText(sanitizeText(investor.investor_id || ''), 10), { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(investor.investor_name || ''), 15), { x: leftMargin + 60, y: yPosition, size: 7, font: font });
          // Don't truncate email - show full email
          currentPage.drawText(sanitizeText(investor.email || ''), { x: leftMargin + 160, y: yPosition, size: 6, font: font });
          // Don't truncate phone - show full phone
          currentPage.drawText(sanitizeText(investor.phone || ''), { x: leftMargin + 300, y: yPosition, size: 7, font: font });
          currentPage.drawText(formatCurrency(investor.total_investment || 0), { x: leftMargin + 390, y: yPosition, size: 7, font: boldFont });
          currentPage.drawText(`${investor.series_count || 0}`, { x: leftMargin + 490, y: yPosition, size: 7, font: font });
          yPosition -= 10;
        }
        
        yPosition -= 20;
      }
      
      // ============================================================
      // SECTION 3: RETENTION & GROWTH METRICS
      // ============================================================
      const summaryRetention = data.summary_retention || {};
      
      if (yPosition < 150) {
        currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
        yPosition = height - 120;
      }
      
      currentPage.drawText('RETENTION & GROWTH METRICS', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const retentionItems = [
        ['Retained Investors:', `${summaryRetention.retained_investors || 0}`],
        ['Retention Rate:', `${summaryRetention.retention_rate || 0}%`],
        ['Avg Investors Increase:', `${summaryRetention.avg_investors_increase || 0}`],
        ['Avg Investment Increase:', formatCurrency(summaryRetention.avg_investment_increase || 0)]
      ];
      
      retentionItems.forEach(([label, value]) => {
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(sanitizeText(value), {
          x: leftMargin + 200,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
      
      yPosition -= 20;
      
      // ============================================================
      // SECTION 4: SERIES TREND TABLE
      // ============================================================
      const seriesTrend = data.series_trend || [];
      if (seriesTrend.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`SERIES TREND ANALYSIS (${seriesTrend.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('ID', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Series Name', { x: leftMargin + 30, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Investors', { x: leftMargin + 180, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Change %', { x: leftMargin + 250, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Investment', { x: leftMargin + 320, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Change %', { x: leftMargin + 420, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        for (const series of seriesTrend) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(`${series.series_id || ''}`, { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(series.series_name || ''), 22), { x: leftMargin + 30, y: yPosition, size: 7, font: font });
          currentPage.drawText(`${series.total_investors || 0}`, { x: leftMargin + 195, y: yPosition, size: 7, font: font });
          currentPage.drawText(`${series.investor_change_pct >= 0 ? '+' : ''}${series.investor_change_pct || 0}%`, { x: leftMargin + 255, y: yPosition, size: 7, font: font });
          currentPage.drawText(formatCurrency(series.total_investment || 0), { x: leftMargin + 320, y: yPosition, size: 7, font: boldFont });
          currentPage.drawText(`${series.investment_change_pct >= 0 ? '+' : ''}${series.investment_change_pct || 0}%`, { x: leftMargin + 425, y: yPosition, size: 7, font: font });
          yPosition -= 10;
        }
        
        yPosition -= 20;
      }
      
      // ============================================================
      // SECTION 5: TOP PERFORMING SERIES WITH CHART
      // ============================================================
      const topPerformingSeries = data.top_performing_series || [];
      if (topPerformingSeries.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`TOP PERFORMING SERIES (${topPerformingSeries.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 30;
        
        // Embed bar chart image if available
        if (chartImageDataUrl) {
          try {
            if (import.meta.env.DEV) { console.log('📊 Embedding bar chart image in PDF...'); }
            
            // Ensure we have enough space for the chart (need at least 300px)
            if (yPosition < 320) {
              currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
              yPosition = height - 120;
            }
            
            // Convert base64 data URL to bytes
            const base64Data = chartImageDataUrl.split(',')[1];
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            // Embed the PNG image
            const chartImage = await pdfDoc.embedPng(imageBytes);
            
            // Scale the image to fit nicely (max width 500px, max height 280px)
            const maxWidth = 500;
            const maxHeight = 280;
            const imgDims = chartImage.scale(1);
            let scale = Math.min(maxWidth / imgDims.width, maxHeight / imgDims.height);
            
            const scaledWidth = imgDims.width * scale;
            const scaledHeight = imgDims.height * scale;
            
            // Center the image horizontally
            const xPos = leftMargin + (rightMargin - leftMargin - scaledWidth) / 2;
            
            currentPage.drawImage(chartImage, {
              x: xPos,
              y: yPosition - scaledHeight,
              width: scaledWidth,
              height: scaledHeight,
            });
            
            yPosition -= scaledHeight + 30;
            if (import.meta.env.DEV) { console.log('✅ Bar chart embedded successfully'); }
            
          } catch (error) {
            if (import.meta.env.DEV) { console.error('❌ Error embedding bar chart:', error); }
          }
        }
        
        // Table header
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText('DETAILED VIEW', {
          x: leftMargin,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        currentPage.drawText('ID', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Series Name', { x: leftMargin + 30, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Rate', { x: leftMargin + 150, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Trustee', { x: leftMargin + 190, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Security', { x: leftMargin + 300, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Start Date', { x: leftMargin + 370, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Inv %', { x: leftMargin + 450, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        for (const series of topPerformingSeries) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(`${series.series_id || ''}`, { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(series.series_name || ''), 18), { x: leftMargin + 30, y: yPosition, size: 7, font: font });
          currentPage.drawText(`${series.interest_rate || 0}%`, { x: leftMargin + 150, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(series.trustee || ''), 15), { x: leftMargin + 190, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(series.security_type || ''), 10), { x: leftMargin + 300, y: yPosition, size: 7, font: font });
          currentPage.drawText(series.start_date ? new Date(series.start_date).toLocaleDateString('en-GB') : '', { x: leftMargin + 370, y: yPosition, size: 7, font: font });
          currentPage.drawText(`${series.investment_percentage || 0}%`, { x: leftMargin + 450, y: yPosition, size: 7, font: boldFont });
          yPosition -= 10;
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      if (import.meta.env.DEV) { console.log('✅ Subscription Trend Analysis PDF generated successfully'); }
      
      return pdfBytes;
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error filling Subscription Trend Analysis:', error); }
      throw error;
    }
  }

  /**
   * Fill Series Maturity Report data into template
   * @param {Object} data - Report data from backend
   * @returns {Promise<Uint8Array>}
   */
  async fillSeriesMaturityReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📄 Filling Series Maturity Report...'); }
      
      const pdfDoc = await this.loadTemplate();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let currentPage = firstPage;
      let yPosition = height - 120;
      const leftMargin = 50;
      const rightMargin = width - 50;
      const lineHeight = 15;
      
      // Sanitize text to remove Unicode characters
      const sanitizeText = (text) => {
        if (!text) return '';
        return String(text)
          .replace(/₹/g, 'Rs.')
          .replace(/≥/g, '>=')
          .replace(/≤/g, '<=')
          .replace(/≠/g, '!=')
          .replace(/×/g, 'x')
          .replace(/÷/g, '/')
          .replace(/°/g, ' deg')
          .replace(/•/g, '*')
          .replace(/—/g, '-')
          .replace(/–/g, '-')
          .replace(/"/g, '"')
          .replace(/"/g, '"')
          .replace(/'/g, "'")
          .replace(/'/g, "'")
          .replace(/…/g, '...')
          .replace(/[^\x00-\x7F]/g, '');
      };
      
      const formatCurrency = (amount) => {
        if (amount >= 10000000) return `Rs.${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `Rs.${(amount / 100000).toFixed(2)} L`;
        return `Rs.${amount.toFixed(2)}`;
      };
      
      // Title
      currentPage.drawText('SERIES MATURITY REPORT', {
        x: leftMargin,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
      
      // Generated Date
      currentPage.drawText(`Generated: ${new Date().toLocaleDateString('en-GB')}`, {
        x: leftMargin,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 30;
      
      // ============================================================
      // SECTION 1: SUMMARY
      // ============================================================
      const summary = data.summary || {};
      
      currentPage.drawText('MATURITY OVERVIEW', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const summaryItems = [
        ['Total Series:', `${summary.total_series || 0}`],
        ['Maturing Within 90 Days:', `${summary.series_maturing_soon || 0}`],
        ['Total Investors:', `${summary.total_investors || 0}`]
      ];
      
      summaryItems.forEach(([label, value]) => {
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText(value, {
          x: leftMargin + 200,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
      
      yPosition -= 20;
      
      // ============================================================
      // SECTION 2: SERIES MATURING WITHIN 90 DAYS
      // ============================================================
      const seriesMaturing90Days = data.series_maturing_90_days || [];
      if (seriesMaturing90Days.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`SERIES MATURING WITHIN 90 DAYS (${seriesMaturing90Days.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('ID', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Series Name', { x: leftMargin + 30, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Investors', { x: leftMargin + 200, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Maturity Date', { x: leftMargin + 270, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Amount to Return', { x: leftMargin + 370, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        for (const series of seriesMaturing90Days) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(`${series.series_id || ''}`, { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(series.series_name || ''), 25), { x: leftMargin + 30, y: yPosition, size: 7, font: font });
          currentPage.drawText(`${series.investor_count || 0}`, { x: leftMargin + 215, y: yPosition, size: 7, font: font });
          currentPage.drawText(series.maturity_date ? new Date(series.maturity_date).toLocaleDateString('en-GB') : '', { x: leftMargin + 270, y: yPosition, size: 7, font: font });
          currentPage.drawText(formatCurrency(series.total_amount_to_return || 0), { x: leftMargin + 370, y: yPosition, size: 7, font: boldFont });
          yPosition -= 10;
        }
        
        yPosition -= 20;
      }
      
      // ============================================================
      // SECTION 3: INVESTOR DETAILS FOR EACH SERIES (≤90 DAYS)
      // ============================================================
      const investorsBySeries90Days = data.investors_by_series_90_days || {};
      
      for (const series of seriesMaturing90Days) {
        const investors = investorsBySeries90Days[series.series_id] || [];
        
        if (investors.length === 0) continue;
        
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`INVESTORS IN ${sanitizeText(series.series_name || '')} (${investors.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('Investor ID', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Investor Name', { x: leftMargin + 80, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Active Series', { x: leftMargin + 250, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Amount to Receive', { x: leftMargin + 350, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        for (const investor of investors) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(sanitizeText(investor.investor_id || ''), { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(investor.investor_name || ''), 25), { x: leftMargin + 80, y: yPosition, size: 7, font: font });
          currentPage.drawText(`${investor.active_series_count || 0}`, { x: leftMargin + 275, y: yPosition, size: 7, font: font });
          currentPage.drawText(formatCurrency(investor.amount_to_receive || 0), { x: leftMargin + 350, y: yPosition, size: 7, font: boldFont });
          yPosition -= 10;
        }
        
        yPosition -= 20;
      }
      
      // ============================================================
      // SECTION 4: SERIES MATURING BETWEEN 90-180 DAYS
      // ============================================================
      const seriesMaturing90To180Days = data.series_maturing_90_to_180_days || [];
      if (seriesMaturing90To180Days.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`SERIES MATURING IN 90-180 DAYS (${seriesMaturing90To180Days.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('ID', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Series Name', { x: leftMargin + 30, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Investors', { x: leftMargin + 200, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Maturity Date', { x: leftMargin + 270, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Amount to Return', { x: leftMargin + 370, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        for (const series of seriesMaturing90To180Days) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(`${series.series_id || ''}`, { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(series.series_name || ''), 25), { x: leftMargin + 30, y: yPosition, size: 7, font: font });
          currentPage.drawText(`${series.investor_count || 0}`, { x: leftMargin + 215, y: yPosition, size: 7, font: font });
          currentPage.drawText(series.maturity_date ? new Date(series.maturity_date).toLocaleDateString('en-GB') : '', { x: leftMargin + 270, y: yPosition, size: 7, font: font });
          currentPage.drawText(formatCurrency(series.total_amount_to_return || 0), { x: leftMargin + 370, y: yPosition, size: 7, font: boldFont });
          yPosition -= 10;
        }
        
        yPosition -= 20;
      }
      
      // ============================================================
      // SECTION 5: SERIES MATURING AFTER 6 MONTHS
      // ============================================================
      const seriesMaturingAfter6Months = data.series_maturing_after_6_months || [];
      if (seriesMaturingAfter6Months.length > 0) {
        if (yPosition < 150) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
        
        currentPage.drawText(`SERIES MATURING AFTER 6 MONTHS (${seriesMaturingAfter6Months.length})`, {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        // Table header
        currentPage.drawText('ID', { x: leftMargin, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Series Name', { x: leftMargin + 30, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Investors', { x: leftMargin + 200, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Maturity Date', { x: leftMargin + 270, y: yPosition, size: 8, font: boldFont });
        currentPage.drawText('Amount to Return', { x: leftMargin + 370, y: yPosition, size: 8, font: boldFont });
        yPosition -= 15;
        
        for (const series of seriesMaturingAfter6Months) {
          if (yPosition < 80) {
            currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
            yPosition = height - 120;
          }
          
          currentPage.drawText(`${series.series_id || ''}`, { x: leftMargin, y: yPosition, size: 7, font: font });
          currentPage.drawText(this.truncateText(sanitizeText(series.series_name || ''), 25), { x: leftMargin + 30, y: yPosition, size: 7, font: font });
          currentPage.drawText(`${series.investor_count || 0}`, { x: leftMargin + 215, y: yPosition, size: 7, font: font });
          currentPage.drawText(series.maturity_date ? new Date(series.maturity_date).toLocaleDateString('en-GB') : '', { x: leftMargin + 270, y: yPosition, size: 7, font: font });
          currentPage.drawText(formatCurrency(series.total_amount_to_return || 0), { x: leftMargin + 370, y: yPosition, size: 7, font: boldFont });
          yPosition -= 10;
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      if (import.meta.env.DEV) { console.log('✅ Series Maturity Report PDF generated successfully'); }
      
      return pdfBytes;
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error filling Series Maturity Report:', error); }
      throw error;
    }
  }

  /**
   * Fill Series Details PDF
   * Generates a comprehensive PDF with all series information in proper table format
   * @param {Object} seriesData - Series data object
   * @returns {Promise<Uint8Array>} - PDF bytes
   */
  async fillSeriesDetails(seriesData) {
    try {
      if (import.meta.env.DEV) { console.log('📄 Generating Series Details PDF...'); }
      
      const pdfDoc = await this.loadTemplate();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let currentPage = firstPage;
      let yPosition = height - 120;
      const leftMargin = 50;
      const lineHeight = 12;
      
      // Helper function to check if we need a new page
      const checkNewPage = async () => {
        if (yPosition < 100) {
          currentPage = await this.addPageWithTemplate(pdfDoc, firstPage, font, boldFont);
          yPosition = height - 120;
        }
      };
      
      // Format currency
      const formatCurrency = (amount) => {
        if (!amount) return 'Rs. 0';
        const crores = amount / 10000000;
        return `Rs. ${crores.toFixed(2)} Cr`;
      };
      
      // Format date
      const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
          return new Date(dateStr).toLocaleDateString('en-GB');
        } catch {
          return dateStr;
        }
      };
      
      // Sanitize text
      const sanitizeText = (text) => {
        if (!text) return '';
        return String(text).replace(/[^\x20-\x7E]/g, '');
      };
      
      // TITLE
      currentPage.drawText('SERIES DETAILS REPORT', {
        x: leftMargin,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;
      
      currentPage.drawText(`Generated: ${new Date().toLocaleDateString('en-GB')}`, {
        x: leftMargin,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPosition -= 35;
      
      // SECTION 1: SERIES OVERVIEW
      await checkNewPage();
      currentPage.drawText('Series Overview', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      // Draw table for basic info
      const basicInfo = [
        ['Series Name:', sanitizeText(seriesData.name || 'N/A')],
        ['Series Code:', sanitizeText(seriesData.seriesCode || seriesData.series_code || 'N/A')],
        ['Security Type:', sanitizeText(seriesData.securityType || seriesData.security_type || 'N/A')],
        ['Status:', sanitizeText((seriesData.status || 'N/A').toUpperCase())],
        ['Created By:', sanitizeText(seriesData.createdBy || seriesData.created_by || 'N/A')],
        ['Created At:', formatDate(seriesData.createdAt || seriesData.created_at)],
      ];
      
      for (const [label, value] of basicInfo) {
        await checkNewPage();
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 9,
          font: boldFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        currentPage.drawText(value, {
          x: leftMargin + 150,
          y: yPosition,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
      
      yPosition -= 15;
      
      // SECTION 2: FINANCIAL DETAILS
      await checkNewPage();
      currentPage.drawText('Financial Details', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const financialInfo = [
        ['Face Value:', `Rs. ${(seriesData.faceValue || seriesData.face_value || 0).toLocaleString('en-IN')}`],
        ['Minimum Investment:', `Rs. ${(seriesData.minInvestment || seriesData.min_investment || 0).toLocaleString('en-IN')}`],
        ['Target Amount:', formatCurrency(seriesData.targetAmount || seriesData.target_amount)],
        ['Total Issue Size:', `${(seriesData.totalIssueSize || seriesData.total_issue_size || 0).toLocaleString('en-IN')} units`],
        ['Funds Raised:', formatCurrency(seriesData.fundsRaised || seriesData.funds_raised || 0)],
        ['Progress:', `${(seriesData.progressPercentage || seriesData.progress_percentage || 0).toFixed(2)}%`],
        ['Min Subscription %:', `${(seriesData.minSubscriptionPercentage || seriesData.min_subscription_percentage || 0)}%`],
      ];
      
      for (const [label, value] of financialInfo) {
        await checkNewPage();
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 9,
          font: boldFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        currentPage.drawText(value, {
          x: leftMargin + 150,
          y: yPosition,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
      
      yPosition -= 15;
      
      // SECTION 3: INTEREST & RATING
      await checkNewPage();
      currentPage.drawText('Interest & Rating', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const interestInfo = [
        ['Interest Rate:', `${(seriesData.interestRate || seriesData.interest_rate || 0)}% p.a.`],
        ['Interest Frequency:', sanitizeText(seriesData.interestFrequency || seriesData.interest_frequency || 'N/A')],
        ['Interest Payment Day:', `${seriesData.interestPaymentDay || seriesData.interest_payment_day || 'N/A'} of each month`],
        ['Credit Rating:', sanitizeText(seriesData.creditRating || seriesData.credit_rating || 'N/A')],
      ];
      
      for (const [label, value] of interestInfo) {
        await checkNewPage();
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 9,
          font: boldFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        currentPage.drawText(value, {
          x: leftMargin + 150,
          y: yPosition,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
      
      yPosition -= 15;
      
      // SECTION 4: IMPORTANT DATES
      await checkNewPage();
      currentPage.drawText('Important Dates', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const dateInfo = [
        ['Issue Date:', formatDate(seriesData.issueDate || seriesData.issue_date)],
        ['Maturity Date:', formatDate(seriesData.maturityDate || seriesData.maturity_date)],
        ['Tenure:', `${seriesData.tenure || 0} months`],
        ['Lock-in Date:', formatDate(seriesData.lockInDate || seriesData.lock_in_date)],
        ['Subscription Start:', formatDate(seriesData.subscriptionStartDate || seriesData.subscription_start_date)],
        ['Subscription End:', formatDate(seriesData.subscriptionEndDate || seriesData.subscription_end_date)],
        ['Series Start Date:', formatDate(seriesData.seriesStartDate || seriesData.series_start_date)],
        ['Release Date:', formatDate(seriesData.releaseDate || seriesData.release_date)],
      ];
      
      for (const [label, value] of dateInfo) {
        await checkNewPage();
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 9,
          font: boldFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        currentPage.drawText(value, {
          x: leftMargin + 150,
          y: yPosition,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
      
      yPosition -= 15;
      
      // SECTION 5: TRUSTEE & INVESTOR INFORMATION
      await checkNewPage();
      currentPage.drawText('Trustee & Investor Information', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      const trusteeInfo = [
        ['Debenture Trustee:', sanitizeText(seriesData.debentureTrustee || seriesData.debenture_trustee_name || 'N/A')],
        ['Maximum Investors:', `${(seriesData.investorsSize || seriesData.investors_size || 0).toLocaleString('en-IN')}`],
        ['Current Investors:', `${(seriesData.investors || seriesData.investor_count || 0).toLocaleString('en-IN')}`],
      ];
      
      for (const [label, value] of trusteeInfo) {
        await checkNewPage();
        currentPage.drawText(label, {
          x: leftMargin,
          y: yPosition,
          size: 9,
          font: boldFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        currentPage.drawText(value, {
          x: leftMargin + 150,
          y: yPosition,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
      
      yPosition -= 15;
      
      // SECTION 6: DESCRIPTION (if available)
      if (seriesData.description) {
        await checkNewPage();
        currentPage.drawText('Description', {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        
        const description = sanitizeText(seriesData.description);
        const maxCharsPerLine = 85;
        const words = description.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          if ((currentLine + word).length > maxCharsPerLine) {
            await checkNewPage();
            currentPage.drawText(currentLine.trim(), {
              x: leftMargin,
              y: yPosition,
              size: 9,
              font: font,
              color: rgb(0, 0, 0),
            });
            yPosition -= lineHeight;
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
        }
        
        if (currentLine.trim()) {
          await checkNewPage();
          currentPage.drawText(currentLine.trim(), {
            x: leftMargin,
            y: yPosition,
            size: 9,
            font: font,
            color: rgb(0, 0, 0),
          });
          yPosition -= lineHeight;
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      if (import.meta.env.DEV) { console.log('✅ Series Details PDF generated successfully'); }
      
      return pdfBytes;
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error filling Series Details PDF:', error); }
      throw error;
    }
  }
}

// Export singleton instance
export default new PDFTemplateService();
