import * as XLSX from 'xlsx';

/**
 * Excel Export Service
 * Handles exporting report data to Excel and CSV formats
 */
class ExcelExportService {
  /**
   * Export Monthly Collection Report to Excel
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportMonthlyCollectionReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting Excel export for Monthly Collection Report...'); }
      if (import.meta.env.DEV) { console.log('📊 Data received:', data); }
      if (import.meta.env.DEV) { console.log('📊 Series breakdown:', data.series_breakdown); }
      if (import.meta.env.DEV) { console.log('📊 Investment details:', data.investment_details); }
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Report Summary
      const summaryData = [
        ['MONTHLY COLLECTION REPORT'],
        [''],
        ['Report Period:', data.reportPeriod || 'N/A'],
        ['Generated Date:', data.generatedDate || new Date().toLocaleDateString('en-GB')],
        [''],
        ['COLLECTION SUMMARY'],
        ['Metric', 'Value'],
        ['Total Funds Raised', data.summary?.total_funds_raised || 0],
        ['Investment This Period', data.summary?.total_investment_this_month || 0],
        ['Collection Rate (%)', data.summary?.fulfillment_percentage || 0],
        [''],
        ['INVESTOR ANALYTICS'],
        ['Metric', 'Count'],
        ['New Investors', data.investor_statistics?.new_investors || 0],
        ['Returning Investors', data.investor_statistics?.returning_investors || 0],
        ['Retention Rate (%)', data.investor_statistics?.retention_rate || 0],
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Set column widths for summary sheet
      summarySheet['!cols'] = [
        { wch: 35 },
        { wch: 25 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Report Summary');
      
      // Sheet 2: Series-wise Breakdown
      if (import.meta.env.DEV) { console.log('📊 Checking series_breakdown:', data.series_breakdown?.length); }
      if (data.series_breakdown && data.series_breakdown.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Series Breakdown sheet with', data.series_breakdown.length, 'series'); }
        
        const seriesData = [
          ['SERIES-WISE COLLECTION BREAKDOWN'],
          [''],
          [
            'Series Code',
            'Series Name',
            'Target Amount (₹)',
            'Collected Amount (₹)',
            'Achievement (%)',
            'Investor Count',
            'Transaction Count',
            'Average Investment (₹)'
          ]
        ];
        
        // Add series rows
        data.series_breakdown.forEach(series => {
          seriesData.push([
            series.series_code || '',
            series.series_name || '',
            series.target_amount || 0,
            series.collected_amount || 0,
            series.achievement_percentage ? parseFloat(series.achievement_percentage).toFixed(2) : 0,
            series.investor_count || 0,
            series.transaction_count || 0,
            series.average_investment ? parseFloat(series.average_investment).toFixed(2) : 0
          ]);
        });
        
        const seriesSheet = XLSX.utils.aoa_to_sheet(seriesData);
        
        // Set column widths for series sheet
        seriesSheet['!cols'] = [
          { wch: 15 },  // Series Code
          { wch: 30 },  // Series Name
          { wch: 20 },  // Target Amount
          { wch: 20 },  // Collected Amount
          { wch: 15 },  // Achievement
          { wch: 15 },  // Investor Count
          { wch: 18 },  // Transaction Count
          { wch: 22 }   // Average Investment
        ];
        
        XLSX.utils.book_append_sheet(workbook, seriesSheet, 'Series Breakdown');
        if (import.meta.env.DEV) { console.log('✅ Series Breakdown sheet added'); }
      } else {
        if (import.meta.env.DEV) { console.log('⚠️ No series breakdown data found'); }
      }
      
      // Sheet 3: Investment Details
      if (import.meta.env.DEV) { console.log('📊 Checking investment_details:', data.investment_details?.length); }
      if (data.investment_details && data.investment_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Investment Details sheet with', data.investment_details.length, 'records'); }
        
        const investmentData = [
          ['INVESTMENT DETAILS'],
          [''],
          [
            'Investor ID',
            'Investor Name',
            'Series Code',
            'Series Name',
            'Investment Amount (₹)',
            'Date Received',
            'Date Transferred'
          ]
        ];
        
        // Add investment rows
        data.investment_details.forEach(inv => {
          investmentData.push([
            inv.investor_id || '',
            inv.investor_name || '',
            inv.series_code || '',
            inv.series_name || '',
            inv.amount || 0,
            inv.date_received || '',
            inv.date_transferred || ''
          ]);
        });
        
        const investmentSheet = XLSX.utils.aoa_to_sheet(investmentData);
        
        // Set column widths for investment sheet
        investmentSheet['!cols'] = [
          { wch: 12 },  // Investor ID
          { wch: 30 },  // Investor Name
          { wch: 15 },  // Series Code
          { wch: 30 },  // Series Name
          { wch: 22 },  // Investment Amount
          { wch: 18 },  // Date Received
          { wch: 18 }   // Date Transferred
        ];
        
        XLSX.utils.book_append_sheet(workbook, investmentSheet, 'Investment Details');
        if (import.meta.env.DEV) { console.log('✅ Investment Details sheet added'); }
      } else {
        if (import.meta.env.DEV) { console.log('⚠️ No investment details data found'); }
      }
      
      // Generate filename
      const filename = `Monthly_Collection_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Write the workbook and trigger download
      XLSX.writeFile(workbook, filename);
      
      if (import.meta.env.DEV) { console.log('✅ Excel export completed successfully'); }
      if (import.meta.env.DEV) { console.log('📄 Total sheets:', workbook.SheetNames.length); }
      if (import.meta.env.DEV) { console.log('📄 Sheet names:', workbook.SheetNames); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting to Excel:', error); }
      throw error;
    }
  }

  /**
   * Export Monthly Collection Report to CSV
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportMonthlyCollectionReportCSV(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting CSV export for Monthly Collection Report...'); }
      if (import.meta.env.DEV) { console.log('📊 Data received:', data); }
      
      let csvContent = '';
      
      // Header Section
      csvContent += 'MONTHLY COLLECTION REPORT\n';
      csvContent += '\n';
      csvContent += `Report Period:,${data.reportPeriod || 'N/A'}\n`;
      csvContent += `Generated Date:,${data.generatedDate || new Date().toLocaleDateString('en-GB')}\n`;
      csvContent += '\n';
      
      // Collection Summary Section
      csvContent += 'COLLECTION SUMMARY\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Funds Raised (₹),${data.summary?.total_funds_raised || 0}\n`;
      csvContent += `Investment This Period (₹),${data.summary?.total_investment_this_month || 0}\n`;
      csvContent += `Collection Rate (%),${data.summary?.fulfillment_percentage || 0}\n`;
      csvContent += '\n';
      
      // Investor Analytics Section
      csvContent += 'INVESTOR ANALYTICS\n';
      csvContent += 'Metric,Count\n';
      csvContent += `New Investors,${data.investor_statistics?.new_investors || 0}\n`;
      csvContent += `Returning Investors,${data.investor_statistics?.returning_investors || 0}\n`;
      csvContent += `Retention Rate (%),${data.investor_statistics?.retention_rate || 0}\n`;
      csvContent += '\n';
      csvContent += '\n';
      
      // Series-wise Breakdown Section
      if (data.series_breakdown && data.series_breakdown.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Series Breakdown to CSV with', data.series_breakdown.length, 'series'); }
        
        csvContent += 'SERIES-WISE COLLECTION BREAKDOWN\n';
        csvContent += 'Series Code,Series Name,Target Amount (₹),Collected Amount (₹),Achievement (%),Investor Count,Transaction Count,Average Investment (₹)\n';
        
        data.series_breakdown.forEach(series => {
          const seriesName = (series.series_name || '').replace(/"/g, '""');
          
          csvContent += `${series.series_code || ''},`;
          csvContent += `"${seriesName}",`;
          csvContent += `${series.target_amount || 0},`;
          csvContent += `${series.collected_amount || 0},`;
          csvContent += `${series.achievement_percentage ? parseFloat(series.achievement_percentage).toFixed(2) : 0},`;
          csvContent += `${series.investor_count || 0},`;
          csvContent += `${series.transaction_count || 0},`;
          csvContent += `${series.average_investment ? parseFloat(series.average_investment).toFixed(2) : 0}\n`;
        });
        
        csvContent += '\n';
        csvContent += '\n';
        if (import.meta.env.DEV) { console.log('✅ Series Breakdown added to CSV'); }
      } else {
        if (import.meta.env.DEV) { console.log('⚠️ No series breakdown data found'); }
      }
      
      // Investment Details Section
      if (data.investment_details && data.investment_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Investment Details to CSV with', data.investment_details.length, 'records'); }
        
        csvContent += 'INVESTMENT DETAILS\n';
        csvContent += 'Investor ID,Investor Name,Series Code,Series Name,Investment Amount (₹),Date Received,Date Transferred\n';
        
        data.investment_details.forEach(inv => {
          const investorName = (inv.investor_name || '').replace(/"/g, '""');
          const seriesName = (inv.series_name || '').replace(/"/g, '""');
          
          csvContent += `${inv.investor_id || ''},`;
          csvContent += `"${investorName}",`;
          csvContent += `${inv.series_code || ''},`;
          csvContent += `"${seriesName}",`;
          csvContent += `${inv.amount || 0},`;
          csvContent += `${inv.date_received || ''},`;
          csvContent += `${inv.date_transferred || ''}\n`;
        });
        
        if (import.meta.env.DEV) { console.log('✅ Investment Details added to CSV'); }
      } else {
        if (import.meta.env.DEV) { console.log('⚠️ No investment details data found'); }
      }
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = `Monthly_Collection_Report_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (import.meta.env.DEV) { console.log('✅ CSV export completed successfully'); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting to CSV:', error); }
      throw error;
    }
  }

  /**
   * Export Payout Statement Report to Excel
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportPayoutStatementReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting Excel export for Payout Statement Report...'); }
      if (import.meta.env.DEV) { console.log('📊 Data received:', data); }
      
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Report Summary
      const summaryData = [
        ['PAYOUT STATEMENT REPORT'],
        [''],
        ['Report Period:', `${data.from_date || 'N/A'} to ${data.to_date || 'N/A'}`],
        ['Generated Date:', new Date().toLocaleDateString('en-GB')],
        [''],
        ['PAYOUT SUMMARY'],
        ['Metric', 'Value'],
        ['Total Payout Amount (₹)', data.summary?.total_payout || 0],
        ['Amount Paid (₹)', data.summary?.paid_amount || 0],
        ['Amount To Be Paid (₹)', data.summary?.to_be_paid_amount || 0],
        ['Payout Completion Rate (%)', data.summary?.total_payout > 0 ? ((data.summary.paid_amount / data.summary.total_payout) * 100).toFixed(2) : 0],
        [''],
        ['RECORD COUNTS'],
        ['Metric', 'Count'],
        ['Total Records', data.summary?.total_records || 0],
        ['Paid Count', data.summary?.paid_count || 0],
        ['Pending Count', data.summary?.pending_count || 0],
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 35 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      if (import.meta.env.DEV) { console.log('✅ Summary sheet added'); }
      
      // Sheet 2: Series-wise Breakdown
      if (data.series_breakdown && data.series_breakdown.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Series Breakdown sheet with', data.series_breakdown.length, 'series'); }
        
        const seriesData = [
          ['SERIES-WISE BREAKDOWN'],
          [''],
          ['Series Code', 'Series Name', 'Total Payout (₹)', 'Paid Amount (₹)', 'Pending Amount (₹)', 'Number of Investors', 'Completion Rate (%)']
        ];
        
        data.series_breakdown.forEach(series => {
          const completionRate = series.total_payout > 0 
            ? ((series.paid_amount / series.total_payout) * 100).toFixed(2)
            : 0;
          
          seriesData.push([
            series.series_code || '',
            series.series_name || '',
            series.total_payout || 0,
            series.paid_amount || 0,
            series.pending_amount || 0,
            series.investor_count || 0,
            completionRate
          ]);
        });
        
        const seriesSheet = XLSX.utils.aoa_to_sheet(seriesData);
        seriesSheet['!cols'] = [
          { wch: 15 },  // Series Code
          { wch: 35 },  // Series Name
          { wch: 20 },  // Total Payout
          { wch: 20 },  // Paid Amount
          { wch: 20 },  // Pending Amount
          { wch: 22 },  // Number of Investors
          { wch: 20 }   // Completion Rate
        ];
        XLSX.utils.book_append_sheet(workbook, seriesSheet, 'Series Breakdown');
        if (import.meta.env.DEV) { console.log('✅ Series Breakdown sheet added'); }
      }
      
      // Sheet 3: Payout Details (COMPLETE DETAILS - ALL AVAILABLE FIELDS)
      if (data.payout_details && data.payout_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Payout Details sheet with', data.payout_details.length, 'records'); }
        
        const payoutData = [
          ['PAYOUT DETAILS - COMPLETE INFORMATION'],
          [''],
          [
            'Payout ID',
            'Investor ID', 
            'Investor Name',
            'Email',
            'Phone',
            'PAN',
            'Series Code', 
            'Series Name', 
            'Payout Amount (₹)', 
            'Status', 
            'Payout Date',
            'Paid Date',
            'Payout Month',
            'Bank Name', 
            'Account Number', 
            'IFSC Code'
          ]
        ];
        
        data.payout_details.forEach(payout => {
          payoutData.push([
            payout.id || '',
            payout.investor_id || '',
            payout.investor_name || '',
            payout.investor_email || '',
            payout.investor_phone || '',
            payout.investor_pan || '',
            payout.series_code || '',
            payout.series_name || '',
            payout.amount || 0,
            payout.status || '',
            payout.payout_date || '',
            payout.paid_date || 'Not Paid Yet',
            payout.payout_month || '',
            payout.bank_name || '',
            payout.account_number || '',
            payout.ifsc_code || ''
          ]);
        });
        
        const payoutSheet = XLSX.utils.aoa_to_sheet(payoutData);
        payoutSheet['!cols'] = [
          { wch: 12 },  // Payout ID
          { wch: 12 },  // Investor ID
          { wch: 30 },  // Investor Name
          { wch: 30 },  // Email
          { wch: 15 },  // Phone
          { wch: 15 },  // PAN
          { wch: 15 },  // Series Code
          { wch: 35 },  // Series Name
          { wch: 18 },  // Payout Amount
          { wch: 12 },  // Status
          { wch: 18 },  // Payout Date
          { wch: 18 },  // Paid Date
          { wch: 15 },  // Payout Month
          { wch: 25 },  // Bank Name
          { wch: 20 },  // Account Number
          { wch: 15 }   // IFSC Code
        ];
        XLSX.utils.book_append_sheet(workbook, payoutSheet, 'Payout Details');
        if (import.meta.env.DEV) { console.log('✅ Payout Details sheet added with ALL available fields'); }
      }
      
      // Sheet 4: Status Breakdown
      if (data.status_breakdown && data.status_breakdown.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Status Breakdown sheet with', data.status_breakdown.length, 'statuses'); }
        
        const statusData = [
          ['STATUS BREAKDOWN'],
          [''],
          ['Status', 'Number of Payouts', 'Total Amount (₹)', 'Percentage of Total (%)']
        ];
        
        const totalAmount = data.summary?.total_payout || 0;
        
        data.status_breakdown.forEach(status => {
          const percentage = totalAmount > 0 
            ? ((status.total_amount / totalAmount) * 100).toFixed(2)
            : 0;
          
          statusData.push([
            status.status || '',
            status.count || 0,
            status.total_amount || 0,
            percentage
          ]);
        });
        
        const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
        statusSheet['!cols'] = [
          { wch: 15 },  // Status
          { wch: 22 },  // Number of Payouts
          { wch: 22 },  // Total Amount
          { wch: 25 }   // Percentage
        ];
        XLSX.utils.book_append_sheet(workbook, statusSheet, 'Status Breakdown');
        if (import.meta.env.DEV) { console.log('✅ Status Breakdown sheet added'); }
      }
      
      // Sheet 5: Monthly Trend
      if (data.monthly_trend && data.monthly_trend.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Monthly Trend sheet with', data.monthly_trend.length, 'months'); }
        
        const monthlyData = [
          ['MONTHLY TREND'],
          [''],
          ['Month', 'Total Payout Amount (₹)', 'Paid Amount (₹)', 'Pending Amount (₹)', 'Number of Payouts', 'Completion Rate (%)']
        ];
        
        data.monthly_trend.forEach(month => {
          const pendingAmount = (month.total_amount || 0) - (month.paid_amount || 0);
          const completionRate = month.total_amount > 0 
            ? ((month.paid_amount / month.total_amount) * 100).toFixed(2)
            : 0;
          
          monthlyData.push([
            month.month || '',
            month.total_amount || 0,
            month.paid_amount || 0,
            pendingAmount,
            month.payout_count || 0,
            completionRate
          ]);
        });
        
        const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
        monthlySheet['!cols'] = [
          { wch: 15 },  // Month
          { wch: 25 },  // Total Payout Amount
          { wch: 22 },  // Paid Amount
          { wch: 22 },  // Pending Amount
          { wch: 22 },  // Number of Payouts
          { wch: 22 }   // Completion Rate
        ];
        XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Trend');
        if (import.meta.env.DEV) { console.log('✅ Monthly Trend sheet added'); }
      }
      
      // Generate and download
      const filename = `Payout_Statement_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      if (import.meta.env.DEV) { console.log('✅ Excel export completed successfully'); }
      if (import.meta.env.DEV) { console.log('📄 Total sheets:', workbook.SheetNames.length); }
      if (import.meta.env.DEV) { console.log('📄 Sheet names:', workbook.SheetNames); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting to Excel:', error); }
      throw error;
    }
  }

  /**
   * Export Payout Statement Report to CSV
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportPayoutStatementReportCSV(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting CSV export for Payout Statement Report...'); }
      
      let csvContent = '';
      
      // Report Header
      csvContent += 'PAYOUT STATEMENT REPORT\n';
      csvContent += '\n';
      csvContent += `Report Period:,${data.from_date || 'N/A'} to ${data.to_date || 'N/A'}\n`;
      csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n`;
      csvContent += '\n';
      
      // Payout Summary
      csvContent += 'PAYOUT SUMMARY\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Payout Amount (₹),${data.summary?.total_payout || 0}\n`;
      csvContent += `Amount Paid (₹),${data.summary?.paid_amount || 0}\n`;
      csvContent += `Amount To Be Paid (₹),${data.summary?.to_be_paid_amount || 0}\n`;
      csvContent += `Payout Completion Rate (%),${data.summary?.total_payout > 0 ? ((data.summary.paid_amount / data.summary.total_payout) * 100).toFixed(2) : 0}\n`;
      csvContent += '\n';
      csvContent += 'RECORD COUNTS\n';
      csvContent += 'Metric,Count\n';
      csvContent += `Total Records,${data.summary?.total_records || 0}\n`;
      csvContent += `Paid Count,${data.summary?.paid_count || 0}\n`;
      csvContent += `Pending Count,${data.summary?.pending_count || 0}\n`;
      csvContent += '\n';
      csvContent += '\n';
      
      // Series-wise Breakdown
      if (data.series_breakdown && data.series_breakdown.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Series Breakdown to CSV with', data.series_breakdown.length, 'series'); }
        
        csvContent += 'SERIES-WISE BREAKDOWN\n';
        csvContent += 'Series Code,Series Name,Total Payout (₹),Paid Amount (₹),Pending Amount (₹),Number of Investors,Completion Rate (%)\n';
        
        data.series_breakdown.forEach(series => {
          const seriesName = (series.series_name || '').replace(/"/g, '""');
          const completionRate = series.total_payout > 0 
            ? ((series.paid_amount / series.total_payout) * 100).toFixed(2)
            : 0;
          
          csvContent += `${series.series_code || ''},`;
          csvContent += `"${seriesName}",`;
          csvContent += `${series.total_payout || 0},`;
          csvContent += `${series.paid_amount || 0},`;
          csvContent += `${series.pending_amount || 0},`;
          csvContent += `${series.investor_count || 0},`;
          csvContent += `${completionRate}\n`;
        });
        
        csvContent += '\n';
        csvContent += '\n';
        if (import.meta.env.DEV) { console.log('✅ Series Breakdown added to CSV'); }
      }
      
      // Payout Details (COMPLETE DETAILS - ALL AVAILABLE FIELDS)
      if (data.payout_details && data.payout_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Payout Details to CSV with', data.payout_details.length, 'records'); }
        
        csvContent += 'PAYOUT DETAILS - COMPLETE INFORMATION\n';
        csvContent += 'Payout ID,Investor ID,Investor Name,Email,Phone,PAN,Series Code,Series Name,Payout Amount (₹),Status,Payout Date,Paid Date,Payout Month,Bank Name,Account Number,IFSC Code\n';
        
        data.payout_details.forEach(payout => {
          const investorName = (payout.investor_name || '').replace(/"/g, '""');
          const investorEmail = (payout.investor_email || '').replace(/"/g, '""');
          const seriesName = (payout.series_name || '').replace(/"/g, '""');
          const bankName = (payout.bank_name || '').replace(/"/g, '""');
          
          csvContent += `${payout.id || ''},`;
          csvContent += `${payout.investor_id || ''},`;
          csvContent += `"${investorName}",`;
          csvContent += `"${investorEmail}",`;
          csvContent += `${payout.investor_phone || ''},`;
          csvContent += `${payout.investor_pan || ''},`;
          csvContent += `${payout.series_code || ''},`;
          csvContent += `"${seriesName}",`;
          csvContent += `${payout.amount || 0},`;
          csvContent += `${payout.status || ''},`;
          csvContent += `${payout.payout_date || ''},`;
          csvContent += `${payout.paid_date || 'Not Paid Yet'},`;
          csvContent += `${payout.payout_month || ''},`;
          csvContent += `"${bankName}",`;
          csvContent += `${payout.account_number || ''},`;
          csvContent += `${payout.ifsc_code || ''}\n`;
        });
        
        csvContent += '\n';
        csvContent += '\n';
        if (import.meta.env.DEV) { console.log('✅ Payout Details added to CSV with ALL available fields'); }
      }
      
      // Status Breakdown
      if (data.status_breakdown && data.status_breakdown.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Status Breakdown to CSV with', data.status_breakdown.length, 'statuses'); }
        
        csvContent += 'STATUS BREAKDOWN\n';
        csvContent += 'Status,Number of Payouts,Total Amount (₹),Percentage of Total (%)\n';
        
        const totalAmount = data.summary?.total_payout || 0;
        
        data.status_breakdown.forEach(status => {
          const percentage = totalAmount > 0 
            ? ((status.total_amount / totalAmount) * 100).toFixed(2)
            : 0;
          
          csvContent += `${status.status || ''},`;
          csvContent += `${status.count || 0},`;
          csvContent += `${status.total_amount || 0},`;
          csvContent += `${percentage}\n`;
        });
        
        csvContent += '\n';
        csvContent += '\n';
        if (import.meta.env.DEV) { console.log('✅ Status Breakdown added to CSV'); }
      }
      
      // Monthly Trend
      if (data.monthly_trend && data.monthly_trend.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Monthly Trend to CSV with', data.monthly_trend.length, 'months'); }
        
        csvContent += 'MONTHLY TREND\n';
        csvContent += 'Month,Total Payout Amount (₹),Paid Amount (₹),Pending Amount (₹),Number of Payouts,Completion Rate (%)\n';
        
        data.monthly_trend.forEach(month => {
          const pendingAmount = (month.total_amount || 0) - (month.paid_amount || 0);
          const completionRate = month.total_amount > 0 
            ? ((month.paid_amount / month.total_amount) * 100).toFixed(2)
            : 0;
          
          csvContent += `${month.month || ''},`;
          csvContent += `${month.total_amount || 0},`;
          csvContent += `${month.paid_amount || 0},`;
          csvContent += `${pendingAmount},`;
          csvContent += `${month.payout_count || 0},`;
          csvContent += `${completionRate}\n`;
        });
        
        if (import.meta.env.DEV) { console.log('✅ Monthly Trend added to CSV'); }
      }
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = `Payout_Statement_Report_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (import.meta.env.DEV) { console.log('✅ CSV export completed successfully'); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting to CSV:', error); }
      throw error;
    }
  }

  /**
   * Export Series-wise Performance Report to Excel
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportSeriesPerformanceReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting Excel export for Series-wise Performance Report...'); }
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // ============================================================
      // SHEET 1: REPORT SUMMARY
      // ============================================================
      const summaryData = [
        ['SERIES-WISE PERFORMANCE REPORT'],
        ['Vaibhav Vyapaar Private Limited'],
        [''],
        ['Generated Date:', new Date().toLocaleDateString('en-GB')],
        [''],
        ['OVERALL SUMMARY'],
        ['Metric', 'Value'],
        ['Total Series', data.summary?.total_series || 0],
        ['Active Series', data.summary?.active_series || 0],
        ['Total Investments (₹)', data.summary?.total_investments || 0],
        ['Total Investors', data.summary?.total_investors || 0],
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 30 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // ============================================================
      // SHEET 2: SERIES COMPARISON
      // ============================================================
      if (data.series_comparison && data.series_comparison.length > 0) {
        const comparisonData = [
          ['SERIES COMPARISON'],
          [''],
          [
            'Series Code',
            'Series Name',
            'Status',
            'Funds Raised (₹)',
            'Target Amount (₹)',
            'Subscription Rate (%)',
            'Total Investors',
            'Repeated Investors',
            'New Investors',
            'Avg Ticket Size (₹)',
            'Interest Rate (%)',
            'Interest Frequency'
          ]
        ];
        
        data.series_comparison.forEach(series => {
          comparisonData.push([
            series.series_code || '',
            series.name || '',
            series.status || '',
            series.funds_raised || 0,
            series.target_amount || 0,
            series.subscription_ratio ? parseFloat(series.subscription_ratio).toFixed(2) : 0,
            series.total_investors || 0,
            series.repeated_investors || 0,
            series.new_investors || 0,
            series.avg_ticket_size ? parseFloat(series.avg_ticket_size).toFixed(2) : 0,
            series.interest_rate ? parseFloat(series.interest_rate).toFixed(2) : 0,
            series.interest_frequency || ''
          ]);
        });
        
        const comparisonSheet = XLSX.utils.aoa_to_sheet(comparisonData);
        comparisonSheet['!cols'] = [
          { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 18 },
          { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 18 },
          { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 18 }
        ];
        XLSX.utils.book_append_sheet(workbook, comparisonSheet, 'Series Comparison');
      }
      
      // ============================================================
      // SHEET 3+: DETAILED DATA PER SERIES
      // ============================================================
      if (data.detailed_series_data && data.detailed_series_data.length > 0) {
        data.detailed_series_data.forEach((seriesDetail, index) => {
          const sheetData = [
            [`SERIES: ${seriesDetail.series_name} (${seriesDetail.series_code})`],
            [''],
            ['PAYOUT STATISTICS'],
            ['Metric', 'Value'],
            ['Total Payouts', seriesDetail.payout_stats?.total_payouts || 0],
            ['Total Payout Amount (₹)', seriesDetail.payout_stats?.total_payout_amount || 0],
            ['Paid Count', seriesDetail.payout_stats?.paid_count || 0],
            ['Paid Amount (₹)', seriesDetail.payout_stats?.paid_amount || 0],
            ['Pending Count', seriesDetail.payout_stats?.pending_count || 0],
            ['Pending Amount (₹)', seriesDetail.payout_stats?.pending_amount || 0],
            ['Success Rate (%)', seriesDetail.payout_stats?.payout_success_rate || 0],
            [''],
            ['INVESTOR DETAILS'],
            [
              'Investor ID',
              'Name',
              'Email',
              'Phone',
              'PAN',
              'Investment Amount (₹)',
              'Date Received',
              'Date Transferred'
            ]
          ];
          
          // Add investor details
          if (seriesDetail.investor_details && seriesDetail.investor_details.length > 0) {
            seriesDetail.investor_details.forEach(investor => {
              sheetData.push([
                investor.investor_id || '',
                investor.investor_name || '',
                investor.email || '',
                investor.phone || '',
                investor.pan || '',
                investor.investment_amount || 0,
                investor.date_received || '',
                investor.date_transferred || ''
              ]);
            });
            
            // Add total row
            const totalInvestment = seriesDetail.investor_details.reduce(
              (sum, inv) => sum + (inv.investment_amount || 0), 0
            );
            sheetData.push([
              '', '', '', '', 'TOTAL:',
              totalInvestment,
              '', ''
            ]);
          }
          
          sheetData.push(['']);
          sheetData.push(['COMPLIANCE STATUS']);
          sheetData.push(['Metric', 'Value']);
          sheetData.push(['Total Requirements', seriesDetail.compliance_stats?.total_requirements || 0]);
          sheetData.push(['Completed', seriesDetail.compliance_stats?.completed || 0]);
          sheetData.push(['Pending Actions', seriesDetail.compliance_stats?.pending_actions || 0]);
          sheetData.push(['Completion Rate (%)', seriesDetail.compliance_stats?.completion_percentage || 0]);
          
          sheetData.push(['']);
          sheetData.push(['MONTHLY INVESTMENT TREND']);
          sheetData.push(['Month', 'Total Amount (₹)', 'Investment Count']);
          
          if (seriesDetail.monthly_trend && seriesDetail.monthly_trend.length > 0) {
            seriesDetail.monthly_trend.forEach(month => {
              sheetData.push([
                month.month || '',
                month.total_amount || 0,
                month.investment_count || 0
              ]);
            });
          }
          
          sheetData.push(['']);
          sheetData.push(['TICKET SIZE DISTRIBUTION']);
          sheetData.push(['Category', 'Investor Count', 'Total Amount (₹)']);
          
          if (seriesDetail.ticket_distribution && seriesDetail.ticket_distribution.length > 0) {
            seriesDetail.ticket_distribution.forEach(ticket => {
              sheetData.push([
                ticket.category || '',
                ticket.count || 0,
                ticket.total_amount || 0
              ]);
            });
          }
          
          const seriesSheet = XLSX.utils.aoa_to_sheet(sheetData);
          seriesSheet['!cols'] = [
            { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
            { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }
          ];
          
          // Sheet name limited to 31 characters
          const sheetName = `${seriesDetail.series_code}`.substring(0, 31);
          XLSX.utils.book_append_sheet(workbook, seriesSheet, sheetName);
        });
      }
      
      // Generate filename and download
      const filename = `Series_Performance_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      if (import.meta.env.DEV) { console.log('✅ Excel export completed successfully'); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting Series Performance Report to Excel:', error); }
      throw error;
    }
  }

  /**
   * Export Series-wise Performance Report to CSV
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportSeriesPerformanceReportCSV(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting CSV export for Series-wise Performance Report...'); }
      
      let csvContent = '';
      
      // ============================================================
      // HEADER SECTION
      // ============================================================
      csvContent += 'SERIES-WISE PERFORMANCE REPORT\n';
      csvContent += 'Vaibhav Vyapaar Private Limited\n';
      csvContent += '\n';
      csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n`;
      csvContent += '\n';
      
      // ============================================================
      // OVERALL SUMMARY
      // ============================================================
      csvContent += 'OVERALL SUMMARY\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Series,${data.summary?.total_series || 0}\n`;
      csvContent += `Active Series,${data.summary?.active_series || 0}\n`;
      csvContent += `Total Investments (₹),${data.summary?.total_investments || 0}\n`;
      csvContent += `Total Investors,${data.summary?.total_investors || 0}\n`;
      csvContent += '\n';
      csvContent += '\n';
      
      // ============================================================
      // SERIES COMPARISON
      // ============================================================
      if (data.series_comparison && data.series_comparison.length > 0) {
        csvContent += 'SERIES COMPARISON\n';
        csvContent += 'Series Code,Series Name,Status,Funds Raised (₹),Target Amount (₹),Subscription Rate (%),Total Investors,Repeated Investors,New Investors,Avg Ticket Size (₹),Interest Rate (%),Interest Frequency\n';
        
        data.series_comparison.forEach(series => {
          csvContent += `${series.series_code || ''},`;
          csvContent += `"${series.name || ''}",`;
          csvContent += `${series.status || ''},`;
          csvContent += `${series.funds_raised || 0},`;
          csvContent += `${series.target_amount || 0},`;
          csvContent += `${series.subscription_ratio ? parseFloat(series.subscription_ratio).toFixed(2) : 0},`;
          csvContent += `${series.total_investors || 0},`;
          csvContent += `${series.repeated_investors || 0},`;
          csvContent += `${series.new_investors || 0},`;
          csvContent += `${series.avg_ticket_size ? parseFloat(series.avg_ticket_size).toFixed(2) : 0},`;
          csvContent += `${series.interest_rate ? parseFloat(series.interest_rate).toFixed(2) : 0},`;
          csvContent += `${series.interest_frequency || ''}\n`;
        });
        
        csvContent += '\n';
        csvContent += '\n';
      }
      
      // ============================================================
      // DETAILED DATA PER SERIES
      // ============================================================
      if (data.detailed_series_data && data.detailed_series_data.length > 0) {
        data.detailed_series_data.forEach((seriesDetail, index) => {
          csvContent += '='.repeat(80) + '\n';
          csvContent += `SERIES: ${seriesDetail.series_name} (${seriesDetail.series_code})\n`;
          csvContent += '='.repeat(80) + '\n';
          csvContent += '\n';
          
          // Payout Statistics
          csvContent += 'PAYOUT STATISTICS\n';
          csvContent += 'Metric,Value\n';
          csvContent += `Total Payouts,${seriesDetail.payout_stats?.total_payouts || 0}\n`;
          csvContent += `Total Payout Amount (₹),${seriesDetail.payout_stats?.total_payout_amount || 0}\n`;
          csvContent += `Paid Count,${seriesDetail.payout_stats?.paid_count || 0}\n`;
          csvContent += `Paid Amount (₹),${seriesDetail.payout_stats?.paid_amount || 0}\n`;
          csvContent += `Pending Count,${seriesDetail.payout_stats?.pending_count || 0}\n`;
          csvContent += `Pending Amount (₹),${seriesDetail.payout_stats?.pending_amount || 0}\n`;
          csvContent += `Success Rate (%),${seriesDetail.payout_stats?.payout_success_rate || 0}\n`;
          csvContent += '\n';
          
          // Investor Details
          csvContent += 'INVESTOR DETAILS\n';
          csvContent += 'Investor ID,Name,Email,Phone,PAN,Investment Amount (₹),Date Received,Date Transferred\n';
          
          if (seriesDetail.investor_details && seriesDetail.investor_details.length > 0) {
            seriesDetail.investor_details.forEach(investor => {
              csvContent += `${investor.investor_id || ''},`;
              csvContent += `"${investor.investor_name || ''}",`;
              csvContent += `${investor.email || ''},`;
              csvContent += `${investor.phone || ''},`;
              csvContent += `${investor.pan || ''},`;
              csvContent += `${investor.investment_amount || 0},`;
              csvContent += `${investor.date_received || ''},`;
              csvContent += `${investor.date_transferred || ''}\n`;
            });
            
            // Total row
            const totalInvestment = seriesDetail.investor_details.reduce(
              (sum, inv) => sum + (inv.investment_amount || 0), 0
            );
            csvContent += `,,,,TOTAL:,${totalInvestment},,\n`;
          }
          
          csvContent += '\n';
          
          // Compliance Status
          csvContent += 'COMPLIANCE STATUS\n';
          csvContent += 'Metric,Value\n';
          csvContent += `Total Requirements,${seriesDetail.compliance_stats?.total_requirements || 0}\n`;
          csvContent += `Completed,${seriesDetail.compliance_stats?.completed || 0}\n`;
          csvContent += `Pending Actions,${seriesDetail.compliance_stats?.pending_actions || 0}\n`;
          csvContent += `Completion Rate (%),${seriesDetail.compliance_stats?.completion_percentage || 0}\n`;
          csvContent += '\n';
          
          // Monthly Investment Trend
          csvContent += 'MONTHLY INVESTMENT TREND\n';
          csvContent += 'Month,Total Amount (₹),Investment Count\n';
          
          if (seriesDetail.monthly_trend && seriesDetail.monthly_trend.length > 0) {
            seriesDetail.monthly_trend.forEach(month => {
              csvContent += `${month.month || ''},`;
              csvContent += `${month.total_amount || 0},`;
              csvContent += `${month.investment_count || 0}\n`;
            });
          }
          
          csvContent += '\n';
          
          // Ticket Size Distribution
          csvContent += 'TICKET SIZE DISTRIBUTION\n';
          csvContent += 'Category,Investor Count,Total Amount (₹)\n';
          
          if (seriesDetail.ticket_distribution && seriesDetail.ticket_distribution.length > 0) {
            seriesDetail.ticket_distribution.forEach(ticket => {
              csvContent += `"${ticket.category || ''}",`;
              csvContent += `${ticket.count || 0},`;
              csvContent += `${ticket.total_amount || 0}\n`;
            });
          }
          
          csvContent += '\n';
          csvContent += '\n';
        });
      }
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `Series_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (import.meta.env.DEV) { console.log('✅ CSV export completed successfully'); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting Series Performance Report to CSV:', error); }
      throw error;
    }
  }

  /**
   * Export Investor Portfolio Summary Report to Excel
   * Professional corporate format with proper alignment and styling
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportInvestorPortfolioReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting Excel export for Investor Portfolio Summary Report...'); }
      if (import.meta.env.DEV) { console.log('📊 Data received:', data); }
      
      const workbook = XLSX.utils.book_new();
      
      // ============================================================
      // SHEET 1: PORTFOLIO OVERVIEW
      // ============================================================
      const overviewData = [
        ['INVESTOR PORTFOLIO SUMMARY REPORT'],
        ['Vaibhav Vyapaar Private Limited'],
        [''],
        ['Generated Date:', new Date().toLocaleDateString('en-GB')],
        [''],
        ['PORTFOLIO OVERVIEW'],
        ['Metric', 'Value'],
        ['Total Investors', data.summary?.total_investors || 0],
        ['Total Funds Raised (₹)', data.summary?.total_funds_raised || 0],
        ['Total Payouts (₹)', data.summary?.total_payouts || 0],
        ['KYC Rejected Count', data.summary?.kyc_rejected_count || 0],
      ];
      
      const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
      overviewSheet['!cols'] = [{ wch: 35 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Portfolio Overview');
      if (import.meta.env.DEV) { console.log('✅ Portfolio Overview sheet added'); }
      
      // ============================================================
      // SHEET 2: INVESTOR INVESTMENTS SUMMARY
      // ============================================================
      if (data.investor_breakdown && data.investor_breakdown.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Investor Investments Summary sheet with', data.investor_breakdown.length, 'investors'); }
        
        const investmentSummaryData = [
          ['INVESTOR INVESTMENTS SUMMARY'],
          [''],
          [
            'Investor ID',
            'Investor Name',
            'Email',
            'Phone',
            'Total Investment (₹)',
            'Series Count',
            'First Investment Date',
            'Last Investment Date'
          ]
        ];
        
        let totalInvestment = 0;
        
        data.investor_breakdown.forEach(inv => {
          totalInvestment += inv.total_investment || 0;
          
          investmentSummaryData.push([
            inv.investor_id || '',
            inv.investor_name || '',
            inv.email || '',
            inv.phone || '',
            inv.total_investment || 0,
            inv.series_count || 0,
            inv.first_investment_date || '-',
            inv.last_investment_date || '-'
          ]);
        });
        
        // Add total row
        investmentSummaryData.push([]);
        investmentSummaryData.push([
          '',
          '',
          '',
          'TOTAL:',
          totalInvestment,
          '',
          '',
          ''
        ]);
        
        const investmentSummarySheet = XLSX.utils.aoa_to_sheet(investmentSummaryData);
        investmentSummarySheet['!cols'] = [
          { wch: 12 },  // Investor ID
          { wch: 30 },  // Investor Name
          { wch: 35 },  // Email
          { wch: 15 },  // Phone
          { wch: 22 },  // Total Investment
          { wch: 15 },  // Series Count
          { wch: 20 },  // First Investment
          { wch: 20 }   // Last Investment
        ];
        XLSX.utils.book_append_sheet(workbook, investmentSummarySheet, 'Investment Summary');
        if (import.meta.env.DEV) { console.log('✅ Investor Investments Summary sheet added'); }
      }
      
      // ============================================================
      // SHEET 3: INVESTORS DETAILS
      // ============================================================
      if (data.investors_details && data.investors_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Investors Details sheet with', data.investors_details.length, 'investors'); }
        
        const investorsData = [
          ['INVESTORS DETAILS'],
          [''],
          [
            'Investor ID',
            'Full Name',
            'Email',
            'Phone',
            'PAN',
            'Bank Name',
            'Account Number',
            'IFSC Code',
            'KYC Status',
            'Date Joined'
          ]
        ];
        
        data.investors_details.forEach(inv => {
          investorsData.push([
            inv.investor_id || '',
            inv.full_name || '',
            inv.email || '',
            inv.phone || '',
            inv.pan || '',
            inv.bank_name || '',
            inv.account_number || '',
            inv.ifsc_code || '',
            inv.kyc_status || '',
            inv.date_joined || ''
          ]);
        });
        
        const investorsSheet = XLSX.utils.aoa_to_sheet(investorsData);
        investorsSheet['!cols'] = [
          { wch: 12 },  // Investor ID
          { wch: 30 },  // Full Name
          { wch: 35 },  // Email
          { wch: 15 },  // Phone
          { wch: 15 },  // PAN
          { wch: 25 },  // Bank Name
          { wch: 20 },  // Account Number
          { wch: 15 },  // IFSC Code
          { wch: 15 },  // KYC Status
          { wch: 15 }   // Date Joined
        ];
        XLSX.utils.book_append_sheet(workbook, investorsSheet, 'Investors Details');
        if (import.meta.env.DEV) { console.log('✅ Investors Details sheet added'); }
      }
      
      // ============================================================
      // SHEET 4: NOMINEE DETAILS
      // ============================================================
      if (data.nominee_details && data.nominee_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Nominee Details sheet with', data.nominee_details.length, 'nominees'); }
        
        const nomineeData = [
          ['NOMINEE DETAILS'],
          [''],
          [
            'Investor ID',
            'Investor Name',
            'Nominee Name',
            'Relationship',
            'Mobile',
            'Email',
            'Address'
          ]
        ];
        
        data.nominee_details.forEach(nom => {
          nomineeData.push([
            nom.investor_id || '',
            nom.investor_name || '',
            nom.nominee_name || '',
            nom.nominee_relationship || '',
            nom.nominee_mobile || '',
            nom.nominee_email || '',
            nom.nominee_address || ''
          ]);
        });
        
        const nomineeSheet = XLSX.utils.aoa_to_sheet(nomineeData);
        nomineeSheet['!cols'] = [
          { wch: 12 },  // Investor ID
          { wch: 30 },  // Investor Name
          { wch: 30 },  // Nominee Name
          { wch: 15 },  // Relationship
          { wch: 15 },  // Mobile
          { wch: 35 },  // Email
          { wch: 40 }   // Address
        ];
        XLSX.utils.book_append_sheet(workbook, nomineeSheet, 'Nominee Details');
        if (import.meta.env.DEV) { console.log('✅ Nominee Details sheet added'); }
      }
      
      // ============================================================
      // SHEET 5: ALL PAYOUTS
      // ============================================================
      if (data.payouts_table && data.payouts_table.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding All Payouts sheet with', data.payouts_table.length, 'records'); }
        
        const payoutsData = [
          ['ALL PAYOUTS'],
          [''],
          [
            'Investor ID',
            'Investor Name',
            'Series Code',
            'Series Name',
            'Total Amount (₹)',
            'Last Payout Date'
          ]
        ];
        
        let totalPayouts = 0;
        
        data.payouts_table.forEach(payout => {
          totalPayouts += payout.total_amount || 0;
          
          payoutsData.push([
            payout.investor_id || '',
            payout.investor_name || '',
            payout.series_code || '',
            payout.series_name || '',
            payout.total_amount || 0,
            payout.last_payout_date || ''
          ]);
        });
        
        // Add total row
        payoutsData.push([]);
        payoutsData.push([
          '',
          '',
          '',
          'TOTAL:',
          totalPayouts,
          ''
        ]);
        
        const payoutsSheet = XLSX.utils.aoa_to_sheet(payoutsData);
        payoutsSheet['!cols'] = [
          { wch: 12 },  // Investor ID
          { wch: 30 },  // Investor Name
          { wch: 15 },  // Series Code
          { wch: 35 },  // Series Name
          { wch: 22 },  // Total Amount
          { wch: 20 }   // Last Payout Date
        ];
        XLSX.utils.book_append_sheet(workbook, payoutsSheet, 'All Payouts');
        if (import.meta.env.DEV) { console.log('✅ All Payouts sheet added'); }
      }
      
      // ============================================================
      // SHEET 6: GRIEVANCE SUMMARY
      // ============================================================
      if (data.grievance_summary) {
        if (import.meta.env.DEV) { console.log('📊 Adding Grievance Summary sheet'); }
        
        const grievanceData = [
          ['GRIEVANCE SUMMARY'],
          [''],
          ['Metric', 'Value'],
          ['Total Complaints', data.grievance_summary.total_complaints || 0],
          ['Resolved Complaints', data.grievance_summary.resolved_complaints || 0],
          ['Pending Complaints', data.grievance_summary.pending_complaints || 0],
          ['Resolution Rate (%)', data.grievance_summary.resolution_rate || 0],
        ];
        
        const grievanceSheet = XLSX.utils.aoa_to_sheet(grievanceData);
        grievanceSheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, grievanceSheet, 'Grievance Summary');
        if (import.meta.env.DEV) { console.log('✅ Grievance Summary sheet added'); }
      }
      
      // ============================================================
      // SHEET 7: INVESTOR GRIEVANCES
      // ============================================================
      if (data.investor_grievances_table && data.investor_grievances_table.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Investor Grievances sheet with', data.investor_grievances_table.length, 'records'); }
        
        const grievancesData = [
          ['INVESTOR GRIEVANCES'],
          [''],
          [
            'Investor ID',
            'Investor Name',
            'Complaint Type',
            'Description',
            'Status',
            'Filed Date',
            'Resolved Date'
          ]
        ];
        
        data.investor_grievances_table.forEach(griev => {
          grievancesData.push([
            griev.investor_id || '',
            griev.investor_name || '',
            griev.complaint_type || '',
            griev.description || '',
            griev.status || '',
            griev.filed_date || '',
            griev.resolved_date || ''
          ]);
        });
        
        const grievancesSheet = XLSX.utils.aoa_to_sheet(grievancesData);
        grievancesSheet['!cols'] = [
          { wch: 12 },  // Investor ID
          { wch: 30 },  // Investor Name
          { wch: 20 },  // Complaint Type
          { wch: 50 },  // Description
          { wch: 15 },  // Status
          { wch: 15 },  // Filed Date
          { wch: 15 }   // Resolved Date
        ];
        XLSX.utils.book_append_sheet(workbook, grievancesSheet, 'Investor Grievances');
        if (import.meta.env.DEV) { console.log('✅ Investor Grievances sheet added'); }
      }
      
      // Generate and download
      const filename = `Investor_Portfolio_Summary_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      if (import.meta.env.DEV) { console.log('✅ Excel export completed successfully'); }
      if (import.meta.env.DEV) { console.log('📄 Total sheets:', workbook.SheetNames.length); }
      if (import.meta.env.DEV) { console.log('📄 Sheet names:', workbook.SheetNames); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting Investor Portfolio Report to Excel:', error); }
      throw error;
    }
  }

  /**
   * Export Investor Portfolio Summary Report to CSV
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportInvestorPortfolioReportCSV(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting CSV export for Investor Portfolio Summary Report...'); }
      
      let csvContent = '';
      
      // Report Header
      csvContent += 'INVESTOR PORTFOLIO SUMMARY REPORT\n';
      csvContent += 'Vaibhav Vyapaar Private Limited\n';
      csvContent += '\n';
      csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n`;
      csvContent += '\n';
      
      // Portfolio Overview
      csvContent += 'PORTFOLIO OVERVIEW\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Investors,${data.summary?.total_investors || 0}\n`;
      csvContent += `Total Funds Raised (₹),${data.summary?.total_funds_raised || 0}\n`;
      csvContent += `Total Payouts (₹),${data.summary?.total_payouts || 0}\n`;
      csvContent += `KYC Rejected Count,${data.summary?.kyc_rejected_count || 0}\n`;
      csvContent += '\n';
      csvContent += '\n';
      
      // Investor Investments Summary
      if (data.investor_breakdown && data.investor_breakdown.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Investor Investments Summary to CSV'); }
        
        csvContent += 'INVESTOR INVESTMENTS SUMMARY\n';
        csvContent += 'Investor ID,Investor Name,Email,Phone,Total Investment (₹),Series Count,First Investment Date,Last Investment Date\n';
        
        let totalInvestment = 0;
        
        data.investor_breakdown.forEach(inv => {
          totalInvestment += inv.total_investment || 0;
          
          const investorName = (inv.investor_name || '').replace(/"/g, '""');
          const email = (inv.email || '').replace(/"/g, '""');
          
          csvContent += `${inv.investor_id || ''},`;
          csvContent += `"${investorName}",`;
          csvContent += `"${email}",`;
          csvContent += `${inv.phone || ''},`;
          csvContent += `${inv.total_investment || 0},`;
          csvContent += `${inv.series_count || 0},`;
          csvContent += `${inv.first_investment_date || '-'},`;
          csvContent += `${inv.last_investment_date || '-'}\n`;
        });
        
        csvContent += '\n';
        csvContent += `,,,TOTAL:,${totalInvestment},,,\n`;
        csvContent += '\n';
        csvContent += '\n';
      }
      
      // Investors Details
      if (data.investors_details && data.investors_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Investors Details to CSV'); }
        
        csvContent += 'INVESTORS DETAILS\n';
        csvContent += 'Investor ID,Full Name,Email,Phone,PAN,Bank Name,Account Number,IFSC Code,KYC Status,Date Joined\n';
        
        data.investors_details.forEach(inv => {
          const fullName = (inv.full_name || '').replace(/"/g, '""');
          const email = (inv.email || '').replace(/"/g, '""');
          const bankName = (inv.bank_name || '').replace(/"/g, '""');
          
          csvContent += `${inv.investor_id || ''},`;
          csvContent += `"${fullName}",`;
          csvContent += `"${email}",`;
          csvContent += `${inv.phone || ''},`;
          csvContent += `${inv.pan || ''},`;
          csvContent += `"${bankName}",`;
          csvContent += `${inv.account_number || ''},`;
          csvContent += `${inv.ifsc_code || ''},`;
          csvContent += `${inv.kyc_status || ''},`;
          csvContent += `${inv.date_joined || ''}\n`;
        });
        
        csvContent += '\n';
        csvContent += '\n';
      }
      
      // Nominee Details
      if (data.nominee_details && data.nominee_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Nominee Details to CSV'); }
        
        csvContent += 'NOMINEE DETAILS\n';
        csvContent += 'Investor ID,Investor Name,Nominee Name,Relationship,Mobile,Email,Address\n';
        
        data.nominee_details.forEach(nom => {
          const investorName = (nom.investor_name || '').replace(/"/g, '""');
          const nomineeName = (nom.nominee_name || '').replace(/"/g, '""');
          const nomineeEmail = (nom.nominee_email || '').replace(/"/g, '""');
          const nomineeAddress = (nom.nominee_address || '').replace(/"/g, '""');
          
          csvContent += `${nom.investor_id || ''},`;
          csvContent += `"${investorName}",`;
          csvContent += `"${nomineeName}",`;
          csvContent += `${nom.nominee_relationship || ''},`;
          csvContent += `${nom.nominee_mobile || ''},`;
          csvContent += `"${nomineeEmail}",`;
          csvContent += `"${nomineeAddress}"\n`;
        });
        
        csvContent += '\n';
        csvContent += '\n';
      }
      
      // All Payouts
      if (data.payouts_table && data.payouts_table.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding All Payouts to CSV'); }
        
        csvContent += 'ALL PAYOUTS\n';
        csvContent += 'Investor ID,Investor Name,Series Code,Series Name,Total Amount (₹),Last Payout Date\n';
        
        let totalPayouts = 0;
        
        data.payouts_table.forEach(payout => {
          totalPayouts += payout.total_amount || 0;
          
          const investorName = (payout.investor_name || '').replace(/"/g, '""');
          const seriesName = (payout.series_name || '').replace(/"/g, '""');
          
          csvContent += `${payout.investor_id || ''},`;
          csvContent += `"${investorName}",`;
          csvContent += `${payout.series_code || ''},`;
          csvContent += `"${seriesName}",`;
          csvContent += `${payout.total_amount || 0},`;
          csvContent += `${payout.last_payout_date || ''}\n`;
        });
        
        csvContent += '\n';
        csvContent += `,,,TOTAL:,${totalPayouts},\n`;
        csvContent += '\n';
        csvContent += '\n';
      }
      
      // Grievance Summary
      if (data.grievance_summary) {
        if (import.meta.env.DEV) { console.log('📊 Adding Grievance Summary to CSV'); }
        
        csvContent += 'GRIEVANCE SUMMARY\n';
        csvContent += 'Metric,Value\n';
        csvContent += `Total Complaints,${data.grievance_summary.total_complaints || 0}\n`;
        csvContent += `Resolved Complaints,${data.grievance_summary.resolved_complaints || 0}\n`;
        csvContent += `Pending Complaints,${data.grievance_summary.pending_complaints || 0}\n`;
        csvContent += `Resolution Rate (%),${data.grievance_summary.resolution_rate || 0}\n`;
        csvContent += '\n';
        csvContent += '\n';
      }
      
      // Investor Grievances
      if (data.investor_grievances_table && data.investor_grievances_table.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Investor Grievances to CSV'); }
        
        csvContent += 'INVESTOR GRIEVANCES\n';
        csvContent += 'Investor ID,Investor Name,Complaint Type,Description,Status,Filed Date,Resolved Date\n';
        
        data.investor_grievances_table.forEach(griev => {
          const investorName = (griev.investor_name || '').replace(/"/g, '""');
          const complaintType = (griev.complaint_type || '').replace(/"/g, '""');
          const description = (griev.description || '').replace(/"/g, '""');
          
          csvContent += `${griev.investor_id || ''},`;
          csvContent += `"${investorName}",`;
          csvContent += `"${complaintType}",`;
          csvContent += `"${description}",`;
          csvContent += `${griev.status || ''},`;
          csvContent += `${griev.filed_date || ''},`;
          csvContent += `${griev.resolved_date || ''}\n`;
        });
      }
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = `Investor_Portfolio_Summary_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (import.meta.env.DEV) { console.log('✅ CSV export completed successfully'); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting Investor Portfolio Report to CSV:', error); }
      throw error;
    }
  }

  /**
   * Export KYC Status Report to Excel
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportKYCStatusReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting Excel export for KYC Status Report...'); }
      
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Summary
      if (import.meta.env.DEV) { console.log('📊 Creating Summary sheet'); }
      const summaryData = [
        ['KYC STATUS REPORT'],
        ['Generated On:', new Date().toLocaleDateString('en-GB')],
        [],
        ['SUMMARY'],
        ['Total Investors', data.summary?.total_investors || 0],
        ['Pending KYC', data.summary?.pending_kyc || 0],
        ['Completed KYC', data.summary?.completed_kyc || 0]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Sheet 2: Banking Details
      if (data.banking_details && data.banking_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Creating Banking Details sheet'); }
        
        const bankingData = [
          ['BANKING DETAILS'],
          [],
          ['Investor ID', 'Investor Name', 'Bank Name', 'Account Number', 'IFSC Code']
        ];
        
        data.banking_details.forEach(investor => {
          bankingData.push([
            investor.investor_id || '',
            investor.investor_name || '',
            investor.bank_name || '',
            investor.account_number || '',
            investor.ifsc_code || ''
          ]);
        });
        
        const bankingSheet = XLSX.utils.aoa_to_sheet(bankingData);
        bankingSheet['!cols'] = [
          { wch: 15 },  // Investor ID
          { wch: 25 },  // Investor Name
          { wch: 25 },  // Bank Name
          { wch: 20 },  // Account Number
          { wch: 15 }   // IFSC Code
        ];
        XLSX.utils.book_append_sheet(workbook, bankingSheet, 'Banking Details');
      }
      
      // Sheet 3: KYC Details
      if (data.kyc_details && data.kyc_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Creating KYC Details sheet'); }
        
        const kycData = [
          ['KYC DETAILS'],
          [],
          ['Investor ID', 'Investor Name', 'PAN', 'Aadhaar', 'KYC Status', 'Yet to Submit Documents']
        ];
        
        data.kyc_details.forEach(investor => {
          kycData.push([
            investor.investor_id || '',
            investor.investor_name || '',
            investor.pan || '',
            investor.aadhaar || '',
            investor.kyc_status || '',
            investor.yet_to_submit_documents || ''
          ]);
        });
        
        const kycSheet = XLSX.utils.aoa_to_sheet(kycData);
        kycSheet['!cols'] = [
          { wch: 15 },  // Investor ID
          { wch: 25 },  // Investor Name
          { wch: 15 },  // PAN
          { wch: 15 },  // Aadhaar
          { wch: 15 },  // KYC Status
          { wch: 30 }   // Yet to Submit Documents
        ];
        XLSX.utils.book_append_sheet(workbook, kycSheet, 'KYC Details');
      }
      
      // Sheet 4: Personal Details
      if (data.personal_details && data.personal_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Creating Personal Details sheet'); }
        
        const personalData = [
          ['INVESTORS PERSONAL DETAILS'],
          [],
          ['Investor ID', 'Investor Name', 'Email', 'Phone', 'Date of Birth', 'Source of Funds']
        ];
        
        data.personal_details.forEach(investor => {
          personalData.push([
            investor.investor_id || '',
            investor.investor_name || '',
            investor.email || '',
            investor.phone || '',
            investor.dob || '',
            investor.source_of_funds || ''
          ]);
        });
        
        const personalSheet = XLSX.utils.aoa_to_sheet(personalData);
        personalSheet['!cols'] = [
          { wch: 15 },  // Investor ID
          { wch: 25 },  // Investor Name
          { wch: 30 },  // Email
          { wch: 15 },  // Phone
          { wch: 15 },  // Date of Birth
          { wch: 25 }   // Source of Funds
        ];
        XLSX.utils.book_append_sheet(workbook, personalSheet, 'Personal Details');
      }
      
      // Generate and download
      const filename = `KYC_Status_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      if (import.meta.env.DEV) { console.log('✅ Excel export completed successfully'); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting KYC Status Report to Excel:', error); }
      throw error;
    }
  }

  /**
   * Export KYC Status Report to CSV
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportKYCStatusReportCSV(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting CSV export for KYC Status Report...'); }
      
      let csvContent = '';
      
      // Summary
      csvContent += 'KYC STATUS REPORT\n';
      csvContent += `Generated On:,${new Date().toLocaleDateString('en-GB')}\n`;
      csvContent += '\n';
      csvContent += 'SUMMARY\n';
      csvContent += `Total Investors,${data.summary?.total_investors || 0}\n`;
      csvContent += `Pending KYC,${data.summary?.pending_kyc || 0}\n`;
      csvContent += `Completed KYC,${data.summary?.completed_kyc || 0}\n`;
      csvContent += '\n\n';
      
      // Banking Details
      if (data.banking_details && data.banking_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Banking Details to CSV'); }
        
        csvContent += 'BANKING DETAILS\n';
        csvContent += 'Investor ID,Investor Name,Bank Name,Account Number,IFSC Code\n';
        
        data.banking_details.forEach(investor => {
          const investorName = (investor.investor_name || '').replace(/"/g, '""');
          const bankName = (investor.bank_name || '').replace(/"/g, '""');
          const accountNumber = (investor.account_number || '').replace(/"/g, '""');
          
          csvContent += `${investor.investor_id || ''},`;
          csvContent += `"${investorName}",`;
          csvContent += `"${bankName}",`;
          csvContent += `"${accountNumber}",`;
          csvContent += `${investor.ifsc_code || ''}\n`;
        });
        
        csvContent += '\n\n';
      }
      
      // KYC Details
      if (data.kyc_details && data.kyc_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding KYC Details to CSV'); }
        
        csvContent += 'KYC DETAILS\n';
        csvContent += 'Investor ID,Investor Name,PAN,Aadhaar,KYC Status,Yet to Submit Documents\n';
        
        data.kyc_details.forEach(investor => {
          const investorName = (investor.investor_name || '').replace(/"/g, '""');
          const pan = (investor.pan || '').replace(/"/g, '""');
          const aadhaar = (investor.aadhaar || '').replace(/"/g, '""');
          const yetToSubmit = (investor.yet_to_submit_documents || '').replace(/"/g, '""');
          
          csvContent += `${investor.investor_id || ''},`;
          csvContent += `"${investorName}",`;
          csvContent += `"${pan}",`;
          csvContent += `"${aadhaar}",`;
          csvContent += `${investor.kyc_status || ''},`;
          csvContent += `"${yetToSubmit}"\n`;
        });
        
        csvContent += '\n\n';
      }
      
      // Personal Details
      if (data.personal_details && data.personal_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Personal Details to CSV'); }
        
        csvContent += 'INVESTORS PERSONAL DETAILS\n';
        csvContent += 'Investor ID,Investor Name,Email,Phone,Date of Birth,Source of Funds\n';
        
        data.personal_details.forEach(investor => {
          const investorName = (investor.investor_name || '').replace(/"/g, '""');
          const email = (investor.email || '').replace(/"/g, '""');
          const sourceOfFunds = (investor.source_of_funds || '').replace(/"/g, '""');
          
          csvContent += `${investor.investor_id || ''},`;
          csvContent += `"${investorName}",`;
          csvContent += `"${email}",`;
          csvContent += `${investor.phone || ''},`;
          csvContent += `${investor.dob || ''},`;
          csvContent += `"${sourceOfFunds}"\n`;
        });
      }
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = `KYC_Status_Report_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (import.meta.env.DEV) { console.log('✅ CSV export completed successfully'); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting KYC Status Report to CSV:', error); }
      throw error;
    }
  }

  /**
   * Export New Investor Report to Excel
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportNewInvestorReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting Excel export for New Investor Report...'); }
      
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Summary
      if (import.meta.env.DEV) { console.log('📊 Creating Summary sheet'); }
      const summaryData = [
        ['NEW INVESTOR REPORT'],
        ['Generated On:', new Date().toLocaleDateString('en-GB')],
        ['Period:', `${data.from_date || 'N/A'} to ${data.to_date || 'N/A'}`],
        [],
        ['SUMMARY'],
        ['Total New Investors', data.total_new_investors || 0]
      ];
      
      if (data.investor_id) {
        summaryData.push(['Filtered by Investor ID', data.investor_id]);
      }
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Sheet 2: Investment Details
      if (data.investment_details && data.investment_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Creating Investment Details sheet'); }
        
        const investmentData = [
          ['INVESTOR INVESTMENT DETAILS'],
          [],
          ['Investor ID', 'Investor Name', 'All Series Invested In', 'Total Amount Invested', 'Total Payouts Received']
        ];
        
        let totalInvested = 0;
        let totalPayouts = 0;
        
        data.investment_details.forEach(investor => {
          investmentData.push([
            investor.investor_id || '',
            investor.investor_name || '',
            investor.series_invested || 'None',
            investor.total_invested || 0,
            investor.total_payouts || 0
          ]);
          totalInvested += investor.total_invested || 0;
          totalPayouts += investor.total_payouts || 0;
        });
        
        // Add TOTAL row
        investmentData.push([]);
        investmentData.push([
          'TOTAL',
          '',
          '',
          totalInvested,
          totalPayouts
        ]);
        
        const investmentSheet = XLSX.utils.aoa_to_sheet(investmentData);
        investmentSheet['!cols'] = [
          { wch: 15 },  // Investor ID
          { wch: 25 },  // Investor Name
          { wch: 30 },  // Series Invested
          { wch: 20 },  // Total Invested
          { wch: 20 }   // Total Payouts
        ];
        XLSX.utils.book_append_sheet(workbook, investmentSheet, 'Investment Details');
      }
      
      // Sheet 3: Banking Details
      if (data.banking_details && data.banking_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Creating Banking Details sheet'); }
        
        const bankingData = [
          ['INVESTORS BANK DETAILS'],
          [],
          ['Investor ID', 'Investor Name', 'Bank Name', 'Account Number', 'IFSC Code']
        ];
        
        data.banking_details.forEach(investor => {
          bankingData.push([
            investor.investor_id || '',
            investor.investor_name || '',
            investor.bank_name || '',
            investor.account_number || '',
            investor.ifsc_code || ''
          ]);
        });
        
        const bankingSheet = XLSX.utils.aoa_to_sheet(bankingData);
        bankingSheet['!cols'] = [
          { wch: 15 },  // Investor ID
          { wch: 25 },  // Investor Name
          { wch: 25 },  // Bank Name
          { wch: 20 },  // Account Number
          { wch: 15 }   // IFSC Code
        ];
        XLSX.utils.book_append_sheet(workbook, bankingSheet, 'Banking Details');
      }
      
      // Sheet 4: KYC Details
      if (data.kyc_details && data.kyc_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Creating KYC Details sheet'); }
        
        const kycData = [
          ['INVESTOR KYC DETAILS'],
          [],
          ['Investor ID', 'Investor Name', 'PAN', 'Aadhaar', 'KYC Status', 'Yet to Submit Documents']
        ];
        
        data.kyc_details.forEach(investor => {
          kycData.push([
            investor.investor_id || '',
            investor.investor_name || '',
            investor.pan || '',
            investor.aadhaar || '',
            investor.kyc_status || '',
            investor.yet_to_submit_documents || ''
          ]);
        });
        
        const kycSheet = XLSX.utils.aoa_to_sheet(kycData);
        kycSheet['!cols'] = [
          { wch: 15 },  // Investor ID
          { wch: 25 },  // Investor Name
          { wch: 15 },  // PAN
          { wch: 15 },  // Aadhaar
          { wch: 15 },  // KYC Status
          { wch: 30 }   // Yet to Submit Documents
        ];
        XLSX.utils.book_append_sheet(workbook, kycSheet, 'KYC Details');
      }
      
      // Sheet 5: Personal Details
      if (data.personal_details && data.personal_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Creating Personal Details sheet'); }
        
        const personalData = [
          ['INVESTOR PERSONAL DETAILS'],
          [],
          ['Investor ID', 'Investor Name', 'Email', 'Phone', 'Date of Birth', 'Source of Funds', 'Date Joined']
        ];
        
        data.personal_details.forEach(investor => {
          personalData.push([
            investor.investor_id || '',
            investor.investor_name || '',
            investor.email || '',
            investor.phone || '',
            investor.dob || '',
            investor.source_of_funds || '',
            investor.date_joined || ''
          ]);
        });
        
        const personalSheet = XLSX.utils.aoa_to_sheet(personalData);
        personalSheet['!cols'] = [
          { wch: 15 },  // Investor ID
          { wch: 25 },  // Investor Name
          { wch: 30 },  // Email
          { wch: 15 },  // Phone
          { wch: 15 },  // Date of Birth
          { wch: 25 },  // Source of Funds
          { wch: 15 }   // Date Joined
        ];
        XLSX.utils.book_append_sheet(workbook, personalSheet, 'Personal Details');
      }
      
      // Generate and download
      const filename = `New_Investor_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      if (import.meta.env.DEV) { console.log('✅ Excel export completed successfully'); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting New Investor Report to Excel:', error); }
      throw error;
    }
  }

  /**
   * Export New Investor Report to CSV
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportNewInvestorReportCSV(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting CSV export for New Investor Report...'); }
      
      let csvContent = '';
      
      // Summary
      csvContent += 'NEW INVESTOR REPORT\n';
      csvContent += `Generated On:,${new Date().toLocaleDateString('en-GB')}\n`;
      csvContent += `Period:,${data.from_date || 'N/A'} to ${data.to_date || 'N/A'}\n`;
      csvContent += '\n';
      csvContent += 'SUMMARY\n';
      csvContent += `Total New Investors,${data.total_new_investors || 0}\n`;
      
      if (data.investor_id) {
        csvContent += `Filtered by Investor ID,${data.investor_id}\n`;
      }
      
      csvContent += '\n\n';
      
      // Investment Details
      if (data.investment_details && data.investment_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Investment Details to CSV'); }
        
        csvContent += 'INVESTOR INVESTMENT DETAILS\n';
        csvContent += 'Investor ID,Investor Name,All Series Invested In,Total Amount Invested,Total Payouts Received\n';
        
        let totalInvested = 0;
        let totalPayouts = 0;
        
        data.investment_details.forEach(investor => {
          const investorName = (investor.investor_name || '').replace(/"/g, '""');
          const seriesInvested = (investor.series_invested || 'None').replace(/"/g, '""');
          
          csvContent += `${investor.investor_id || ''},`;
          csvContent += `"${investorName}",`;
          csvContent += `"${seriesInvested}",`;
          csvContent += `${investor.total_invested || 0},`;
          csvContent += `${investor.total_payouts || 0}\n`;
          
          totalInvested += investor.total_invested || 0;
          totalPayouts += investor.total_payouts || 0;
        });
        
        // Add TOTAL row
        csvContent += '\n';
        csvContent += `TOTAL,,,${totalInvested},${totalPayouts}\n`;
        
        csvContent += '\n\n';
      }
      
      // Banking Details
      if (data.banking_details && data.banking_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Banking Details to CSV'); }
        
        csvContent += 'INVESTORS BANK DETAILS\n';
        csvContent += 'Investor ID,Investor Name,Bank Name,Account Number,IFSC Code\n';
        
        data.banking_details.forEach(investor => {
          const investorName = (investor.investor_name || '').replace(/"/g, '""');
          const bankName = (investor.bank_name || '').replace(/"/g, '""');
          const accountNumber = (investor.account_number || '').replace(/"/g, '""');
          
          csvContent += `${investor.investor_id || ''},`;
          csvContent += `"${investorName}",`;
          csvContent += `"${bankName}",`;
          csvContent += `"${accountNumber}",`;
          csvContent += `${investor.ifsc_code || ''}\n`;
        });
        
        csvContent += '\n\n';
      }
      
      // KYC Details
      if (data.kyc_details && data.kyc_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding KYC Details to CSV'); }
        
        csvContent += 'INVESTOR KYC DETAILS\n';
        csvContent += 'Investor ID,Investor Name,PAN,Aadhaar,KYC Status,Yet to Submit Documents\n';
        
        data.kyc_details.forEach(investor => {
          const investorName = (investor.investor_name || '').replace(/"/g, '""');
          const pan = (investor.pan || '').replace(/"/g, '""');
          const aadhaar = (investor.aadhaar || '').replace(/"/g, '""');
          const yetToSubmit = (investor.yet_to_submit_documents || '').replace(/"/g, '""');
          
          csvContent += `${investor.investor_id || ''},`;
          csvContent += `"${investorName}",`;
          csvContent += `"${pan}",`;
          csvContent += `"${aadhaar}",`;
          csvContent += `${investor.kyc_status || ''},`;
          csvContent += `"${yetToSubmit}"\n`;
        });
        
        csvContent += '\n\n';
      }
      
      // Personal Details
      if (data.personal_details && data.personal_details.length > 0) {
        if (import.meta.env.DEV) { console.log('📊 Adding Personal Details to CSV'); }
        
        csvContent += 'INVESTOR PERSONAL DETAILS\n';
        csvContent += 'Investor ID,Investor Name,Email,Phone,Date of Birth,Source of Funds,Date Joined\n';
        
        data.personal_details.forEach(investor => {
          const investorName = (investor.investor_name || '').replace(/"/g, '""');
          const email = (investor.email || '').replace(/"/g, '""');
          const sourceOfFunds = (investor.source_of_funds || '').replace(/"/g, '""');
          
          csvContent += `${investor.investor_id || ''},`;
          csvContent += `"${investorName}",`;
          csvContent += `"${email}",`;
          csvContent += `${investor.phone || ''},`;
          csvContent += `${investor.dob || ''},`;
          csvContent += `"${sourceOfFunds}",`;
          csvContent += `${investor.date_joined || ''}\n`;
        });
      }
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = `New_Investor_Report_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (import.meta.env.DEV) { console.log('✅ CSV export completed successfully'); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting New Investor Report to CSV:', error); }
      throw error;
    }
  }

  /**
   * Export RBI Compliance Report to Excel
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportRBIComplianceReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting Excel export for RBI Compliance Report...'); }
      
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Summary
      const summaryData = [
        ['RBI COMPLIANCE REPORT'],
        [''],
        ['Generated Date:', new Date().toLocaleDateString('en-GB')],
        [''],
        ['COMPLIANCE SUMMARY'],
        ['Metric', 'Value'],
        ['Total AUM (₹)', data.summary?.total_aum || 0],
        ['Compliance Score (%)', data.summary?.compliance_score || 0],
        ['KYC Pending', data.summary?.kyc_pending || 0],
        ['Upcoming Payouts (30d) (₹)', data.summary?.upcoming_payouts || 0],
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 30 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Sheet 2: Series Compliance
      if (data.series_compliance && data.series_compliance.length > 0) {
        const seriesData = [
          ['SERIES COMPLIANCE DETAILS'],
          [''],
          [
            'Series Code',
            'Series Name',
            'Security Type',
            'Credit Rating',
            'Trustee Name',
            'KYC Completed',
            'KYC Total',
            'KYC Completion %'
          ]
        ];
        
        data.series_compliance.forEach(series => {
          seriesData.push([
            series.series_code || '',
            series.series_name || '',
            series.security_type || '',
            series.credit_rating || '',
            series.trustee_name || '',
            series.kyc_completed_count || 0,
            series.kyc_total_count || 0,
            series.kyc_completion_percent || 0
          ]);
        });
        
        const seriesSheet = XLSX.utils.aoa_to_sheet(seriesData);
        seriesSheet['!cols'] = [
          { wch: 15 }, // Series Code
          { wch: 25 }, // Series Name
          { wch: 15 }, // Security Type
          { wch: 15 }, // Credit Rating
          { wch: 30 }, // Trustee Name
          { wch: 15 }, // KYC Completed
          { wch: 15 }, // KYC Total
          { wch: 15 }  // KYC Completion %
        ];
        XLSX.utils.book_append_sheet(workbook, seriesSheet, 'Series Compliance');
      }
      
      // Sheet 3: Attention Items
      if (data.attention_items && data.attention_items.length > 0) {
        const attentionData = [
          ['ITEMS REQUIRING ATTENTION'],
          [''],
          ['Series', 'Pre-Compliance Phase', 'Post-Compliance Phase', 'Recurring Compliances', 'KYC Pending']
        ];
        
        data.attention_items.forEach(item => {
          attentionData.push([
            item.series_code || '',
            item.pre_compliance_pending > 0 ? `${item.pre_compliance_pending} pending` : 'Complete',
            item.post_compliance_pending > 0 ? `${item.post_compliance_pending} pending` : 'Complete',
            item.recurring_compliance_pending > 0 ? `${item.recurring_compliance_pending} pending` : 'Complete',
            item.kyc_pending > 0 ? `${item.kyc_pending} investor(s)` : 'Complete'
          ]);
        });
        
        const attentionSheet = XLSX.utils.aoa_to_sheet(attentionData);
        attentionSheet['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, attentionSheet, 'Attention Items');
      }
      
      // Sheet 4: Investor Summary
      const investorData = [
        ['INVESTOR KYC SUMMARY'],
        [''],
        ['Metric', 'Count'],
        ['Total Investors', data.investor_summary?.total_investors || 0],
        ['KYC Completed', data.investor_summary?.kyc_completed || 0],
        ['KYC Pending', data.investor_summary?.kyc_pending || 0],
        ['KYC Rejected', data.investor_summary?.kyc_rejected || 0],
      ];
      
      if (data.investor_summary?.top_holdings && data.investor_summary.top_holdings.length > 0) {
        investorData.push([''], ['INVESTOR HOLDINGS (CONCENTRATION RISK)'], ['']);
        investorData.push(['Investor ID', 'Investor Name', 'Series', 'Amount Invested (₹)', '% of Series']);
        
        data.investor_summary.top_holdings.forEach(holding => {
          investorData.push([
            holding.investor_id || '',
            holding.investor_name || '',
            holding.series_code || '',
            holding.amount_invested || 0,
            holding.percent_of_series || 0
          ]);
        });
      }
      
      const investorSheet = XLSX.utils.aoa_to_sheet(investorData);
      investorSheet['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, investorSheet, 'Investor Summary');
      
      
      // Write file
      const filename = `RBI_Compliance_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      if (import.meta.env.DEV) { console.log('✅ Excel export completed successfully'); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting RBI Compliance Report to Excel:', error); }
      throw error;
    }
  }

  /**
   * Export RBI Compliance Report to CSV
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportRBIComplianceReportCSV(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting CSV export for RBI Compliance Report...'); }
      
      let csvContent = 'RBI COMPLIANCE REPORT\n\n';
      csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n\n`;
      
      // Summary
      csvContent += 'COMPLIANCE SUMMARY\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total AUM (₹),${data.summary?.total_aum || 0}\n`;
      csvContent += `Compliance Score (%),${data.summary?.compliance_score || 0}\n`;
      csvContent += `KYC Pending,${data.summary?.kyc_pending || 0}\n`;
      csvContent += `Upcoming Payouts (30d) (₹),${data.summary?.upcoming_payouts || 0}\n\n`;
      
      // Series Compliance
      if (data.series_compliance && data.series_compliance.length > 0) {
        csvContent += 'SERIES COMPLIANCE DETAILS\n';
        csvContent += 'Series Code,Series Name,Security Type,Credit Rating,Trustee Name,KYC Completed,KYC Total,KYC Completion %\n';
        
        data.series_compliance.forEach(series => {
          csvContent += `${series.series_code || ''},`;
          csvContent += `${series.series_name || ''},`;
          csvContent += `${series.security_type || ''},`;
          csvContent += `${series.credit_rating || ''},`;
          csvContent += `${series.trustee_name || ''},`;
          csvContent += `${series.kyc_completed_count || 0},`;
          csvContent += `${series.kyc_total_count || 0},`;
          csvContent += `${series.kyc_completion_percent || 0}\n`;
        });
        csvContent += '\n';
      }
      
      // Attention Items
      if (data.attention_items && data.attention_items.length > 0) {
        csvContent += 'ITEMS REQUIRING ATTENTION\n';
        csvContent += 'Series,Pre-Compliance Phase,Post-Compliance Phase,Recurring Compliances,KYC Pending\n';
        
        data.attention_items.forEach(item => {
          csvContent += `${item.series_code || ''},`;
          csvContent += `${item.pre_compliance_pending > 0 ? `${item.pre_compliance_pending} pending` : 'Complete'},`;
          csvContent += `${item.post_compliance_pending > 0 ? `${item.post_compliance_pending} pending` : 'Complete'},`;
          csvContent += `${item.recurring_compliance_pending > 0 ? `${item.recurring_compliance_pending} pending` : 'Complete'},`;
          csvContent += `${item.kyc_pending > 0 ? `${item.kyc_pending} investor(s)` : 'Complete'}\n`;
        });
        csvContent += '\n';
      }
      
      // Investor Summary
      csvContent += 'INVESTOR KYC SUMMARY\n';
      csvContent += 'Metric,Count\n';
      csvContent += `Total Investors,${data.investor_summary?.total_investors || 0}\n`;
      csvContent += `KYC Completed,${data.investor_summary?.kyc_completed || 0}\n`;
      csvContent += `KYC Pending,${data.investor_summary?.kyc_pending || 0}\n`;
      csvContent += `KYC Rejected,${data.investor_summary?.kyc_rejected || 0}\n\n`;
      
      // Top Holdings
      if (data.investor_summary?.top_holdings && data.investor_summary.top_holdings.length > 0) {
        csvContent += 'INVESTOR HOLDINGS (CONCENTRATION RISK)\n';
        csvContent += 'Investor ID,Investor Name,Series,Amount Invested (₹),% of Series\n';
        
        data.investor_summary.top_holdings.forEach(holding => {
          const investorName = (holding.investor_name || '').replace(/"/g, '""');
          csvContent += `${holding.investor_id || ''},`;
          csvContent += `"${investorName}",`;
          csvContent += `${holding.series_code || ''},`;
          csvContent += `${holding.amount_invested || 0},`;
          csvContent += `${holding.percent_of_series || 0}\n`;
        });
        csvContent += '\n';
      }
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = `RBI_Compliance_Report_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (import.meta.env.DEV) { console.log('✅ CSV export completed successfully'); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting RBI Compliance Report to CSV:', error); }
      throw error;
    }
  }

  /**
   * Export SEBI Disclosure Report to Excel
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportSEBIDisclosureReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting Excel export for SEBI Disclosure Report...'); }
      
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Summary
      const summaryData = [
        ['SEBI DISCLOSURE REPORT'],
        [''],
        ['Generated Date:', new Date().toLocaleDateString('en-GB')],
        [''],
        ['SUMMARY'],
        ['Metric', 'Value'],
        ['Total Series', data.summary?.total_series || 0],
        ['Active Series', data.summary?.active_series || 0],
        ['Avg Interest Rate (%)', data.summary?.avg_interest_rate || 0],
        ['Avg Investment/Series (₹)', data.summary?.avg_investment_per_series || 0],
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 30 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Sheet 2: Series Details
      if (data.series_details && data.series_details.length > 0) {
        const seriesData = [
          ['ISSUE & SERIES DETAILS'],
          [''],
          [
            'Series Code',
            'Series Name',
            'Status',
            'Issue Date',
            'Allotment Date',
            'Maturity Date',
            'Tenure (Days)',
            'Target Amount (₹)',
            'Funds Raised (₹)',
            'Subscription %',
            'Outstanding Amount (₹)',
            'Interest Rate (%)',
            'Payment Frequency',
            'Credit Rating',
            'Security Type',
            'Debenture Trustee',
            'Investor Count'
          ]
        ];
        
        data.series_details.forEach(series => {
          seriesData.push([
            series.series_code || '',
            series.series_name || '',
            series.status || '',
            series.issue_date || '',
            series.allotment_date || '',
            series.maturity_date || '',
            series.tenure_days || 0,
            series.target_amount || 0,
            series.funds_raised || 0,
            series.subscription_percentage || 0,
            series.outstanding_amount || 0,
            series.interest_rate || 0,
            series.payment_frequency || '',
            series.credit_rating || '',
            series.security_type || '',
            series.debenture_trustee || '',
            series.investor_count || 0
          ]);
        });
        
        const seriesSheet = XLSX.utils.aoa_to_sheet(seriesData);
        seriesSheet['!cols'] = [
          { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
          { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 12 },
          { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
          { wch: 30 }, { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(workbook, seriesSheet, 'Series Details');
      }
      
      // Sheet 3: Payment Compliance
      const paymentData = [
        ['PAYMENT COMPLIANCE & DEFAULTS (LODR Regulation 57)'],
        [''],
        ['Metric', 'Value'],
        ['On-Time Payments', data.payment_compliance_summary?.on_time_payments || 0],
        ['Payouts Till Date', data.payment_compliance_summary?.payouts_till_date || 0],
        ['Overdue Payments', data.payment_compliance_summary?.overdue_payments || 0],
        ['Payout Rate (%)', data.payment_compliance_summary?.payout_rate || 0],
      ];
      
      if (data.payment_records && data.payment_records.length > 0) {
        paymentData.push([''], ['PAYMENT RECORDS'], ['']);
        paymentData.push([
          'Series Code',
          'Scheduled Date',
          'Actual Date',
          'Amount (₹)',
          'Investor Count',
          'Status',
          'Delay (Days)'
        ]);
        
        data.payment_records.forEach(record => {
          paymentData.push([
            record.series_code || '',
            record.scheduled_date || '',
            record.actual_date || 'Pending',
            record.amount || 0,
            record.investor_count || 0,
            record.status || '',
            record.delay_days || 0
          ]);
        });
      }
      
      const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
      paymentSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Payment Compliance');
      
      // Sheet 4: Upcoming Obligations
      if (data.upcoming_obligations && data.upcoming_obligations.length > 0) {
        const obligationsData = [
          ['UPCOMING OBLIGATIONS (Next 90 Days)'],
          [''],
          ['Series Code', 'Payout Date', 'Amount (₹)', 'Investors', 'Status']
        ];
        
        data.upcoming_obligations.forEach(obligation => {
          obligationsData.push([
            obligation.series_code || '',
            obligation.payout_date || '',
            obligation.amount || 0,
            obligation.investors || 0,
            obligation.status || ''
          ]);
        });
        
        const obligationsSheet = XLSX.utils.aoa_to_sheet(obligationsData);
        obligationsSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, obligationsSheet, 'Upcoming Obligations');
      }
      
      // Sheet 5: Grievance Mechanism
      const grievanceData = [
        ['INVESTOR GRIEVANCE MECHANISM (LODR Regulation 13)'],
        [''],
        ['Metric', 'Value'],
        ['Total Grievances', data.grievance_summary?.total_grievances || 0],
        ['Open Grievances', data.grievance_summary?.open_grievances || 0],
        ['Resolved Grievances', data.grievance_summary?.resolved_grievances || 0],
        ['High Priority Open', data.grievance_summary?.high_priority_grievances || 0],
      ];
      
      if (data.grievance_records && data.grievance_records.length > 0) {
        grievanceData.push([''], ['GRIEVANCE RECORDS'], ['']);
        grievanceData.push([
          'Grievance ID',
          'Investor ID',
          'Investor Name',
          'Series',
          'Category',
          'Type',
          'Description',
          'Priority',
          'Status',
          'Filed Date',
          'Resolved Date',
          'Days Pending'
        ]);
        
        data.grievance_records.forEach(record => {
          grievanceData.push([
            record.grievance_id || '',
            record.investor_id || '',
            record.investor_name || '',
            record.series_code || '',
            record.category || '',
            record.grievance_type || '',
            record.description || '',
            record.priority || '',
            record.status || '',
            record.filed_date || '',
            record.resolved_date || 'Pending',
            record.days_pending || 0
          ]);
        });
      }
      
      const grievanceSheet = XLSX.utils.aoa_to_sheet(grievanceData);
      grievanceSheet['!cols'] = [
        { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 20 },
        { wch: 20 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(workbook, grievanceSheet, 'Grievance Mechanism');
      
      // Sheet 6: Compliance Tracking
      const complianceData = [
        ['CONTINUOUS COMPLIANCE TRACKING (LODR Regulation 46)'],
        [''],
        ['Metric', 'Value'],
        ['Total Compliance Items', data.compliance_tracking_summary?.total_compliance_items || 0],
        ['Completed', data.compliance_tracking_summary?.total_completed || 0],
        ['Pending', data.compliance_tracking_summary?.total_pending || 0],
        ['Compliance Rate (%)', data.compliance_tracking_summary?.compliance_rate || 0],
      ];
      
      if (data.compliance_attention_items && data.compliance_attention_items.length > 0) {
        complianceData.push([''], ['ITEMS REQUIRING ATTENTION'], ['']);
        complianceData.push(['Series', 'Pre-Compliance Phase', 'Post-Compliance Phase', 'Recurring Compliances']);
        
        data.compliance_attention_items.forEach(item => {
          complianceData.push([
            item.series_code || '',
            item.pre_compliance_pending > 0 ? `${item.pre_compliance_pending} pending` : 'Complete',
            item.post_compliance_pending > 0 ? `${item.post_compliance_pending} pending` : 'Complete',
            item.recurring_compliance_pending > 0 ? `${item.recurring_compliance_pending} pending` : 'Complete'
          ]);
        });
      }
      
      const complianceSheet = XLSX.utils.aoa_to_sheet(complianceData);
      complianceSheet['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, complianceSheet, 'Compliance Tracking');
      
      // Write file
      const filename = `SEBI_Disclosure_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      if (import.meta.env.DEV) { console.log('✅ Excel export completed successfully'); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting SEBI Disclosure Report to Excel:', error); }
      throw error;
    }
  }

  /**
   * Export SEBI Disclosure Report to CSV
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportSEBIDisclosureReportCSV(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting CSV export for SEBI Disclosure Report...'); }
      
      // Create CSV content with all sections
      let csvContent = 'SEBI DISCLOSURE REPORT\n\n';
      csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n\n`;
      
      // Summary
      csvContent += 'SUMMARY\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Series,${data.summary?.total_series || 0}\n`;
      csvContent += `Active Series,${data.summary?.active_series || 0}\n`;
      csvContent += `Avg Interest Rate (%),${data.summary?.avg_interest_rate || 0}\n`;
      csvContent += `Avg Investment/Series (₹),${data.summary?.avg_investment_per_series || 0}\n\n`;
      
      // Series Details
      if (data.series_details && data.series_details.length > 0) {
        csvContent += 'ISSUE & SERIES DETAILS\n';
        csvContent += 'Series Code,Series Name,Status,Issue Date,Maturity Date,Tenure (Days),Target Amount (₹),Funds Raised (₹),Outstanding Amount (₹),Interest Rate (%),Payment Frequency,Credit Rating,Security Type,Debenture Trustee,Investor Count\n';
        
        data.series_details.forEach(series => {
          csvContent += `${series.series_code || ''},${series.series_name || ''},${series.status || ''},${series.issue_date || ''},${series.maturity_date || ''},${series.tenure_days || 0},${series.target_amount || 0},${series.funds_raised || 0},${series.outstanding_amount || 0},${series.interest_rate || 0},${series.payment_frequency || ''},${series.credit_rating || ''},${series.security_type || ''},${series.debenture_trustee || ''},${series.investor_count || 0}\n`;
        });
        csvContent += '\n';
      }
      
      // Payment Compliance
      csvContent += 'PAYMENT COMPLIANCE & DEFAULTS\n';
      csvContent += 'Metric,Value\n';
      csvContent += `On-Time Payments,${data.payment_compliance_summary?.on_time_payments || 0}\n`;
      csvContent += `Payouts Till Date,${data.payment_compliance_summary?.payouts_till_date || 0}\n`;
      csvContent += `Overdue Payments,${data.payment_compliance_summary?.overdue_payments || 0}\n`;
      csvContent += `Payout Rate (%),${data.payment_compliance_summary?.payout_rate || 0}\n\n`;
      
      // Payment Records
      if (data.payment_records && data.payment_records.length > 0) {
        csvContent += 'PAYMENT RECORDS\n';
        csvContent += 'Series Code,Scheduled Date,Actual Date,Amount (₹),Investor Count,Status,Delay (Days)\n';
        
        data.payment_records.forEach(record => {
          csvContent += `${record.series_code || ''},${record.scheduled_date || ''},${record.actual_date || 'Pending'},${record.amount || 0},${record.investor_count || 0},${record.status || ''},${record.delay_days || 0}\n`;
        });
        csvContent += '\n';
      }
      
      // Upcoming Obligations
      if (data.upcoming_obligations && data.upcoming_obligations.length > 0) {
        csvContent += 'UPCOMING OBLIGATIONS (Next 90 Days)\n';
        csvContent += 'Series Code,Payout Date,Amount (₹),Investors,Status\n';
        
        data.upcoming_obligations.forEach(obligation => {
          csvContent += `${obligation.series_code || ''},${obligation.payout_date || ''},${obligation.amount || 0},${obligation.investors || 0},${obligation.status || ''}\n`;
        });
        csvContent += '\n';
      }
      
      // Grievance Mechanism
      csvContent += 'INVESTOR GRIEVANCE MECHANISM\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Grievances,${data.grievance_summary?.total_grievances || 0}\n`;
      csvContent += `Open Grievances,${data.grievance_summary?.open_grievances || 0}\n`;
      csvContent += `Resolved Grievances,${data.grievance_summary?.resolved_grievances || 0}\n`;
      csvContent += `High Priority Open,${data.grievance_summary?.high_priority_grievances || 0}\n\n`;
      
      // Grievance Records
      if (data.grievance_records && data.grievance_records.length > 0) {
        csvContent += 'GRIEVANCE RECORDS\n';
        csvContent += 'Grievance ID,Investor ID,Investor Name,Series,Category,Type,Description,Priority,Status,Filed Date,Resolved Date,Days Pending\n';
        
        data.grievance_records.forEach(record => {
          const description = (record.description || '').replace(/"/g, '""');
          csvContent += `${record.grievance_id || ''},${record.investor_id || ''},${record.investor_name || ''},${record.series_code || ''},${record.category || ''},${record.grievance_type || ''},"${description}",${record.priority || ''},${record.status || ''},${record.filed_date || ''},${record.resolved_date || 'Pending'},${record.days_pending || 0}\n`;
        });
        csvContent += '\n';
      }
      
      // Compliance Tracking
      csvContent += 'CONTINUOUS COMPLIANCE TRACKING\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Compliance Items,${data.compliance_tracking_summary?.total_compliance_items || 0}\n`;
      csvContent += `Completed,${data.compliance_tracking_summary?.total_completed || 0}\n`;
      csvContent += `Pending,${data.compliance_tracking_summary?.total_pending || 0}\n`;
      csvContent += `Compliance Rate (%),${data.compliance_tracking_summary?.compliance_rate || 0}\n\n`;
      
      // Compliance Attention Items
      if (data.compliance_attention_items && data.compliance_attention_items.length > 0) {
        csvContent += 'ITEMS REQUIRING ATTENTION\n';
        csvContent += 'Series,Pre-Compliance Phase,Post-Compliance Phase,Recurring Compliances\n';
        
        data.compliance_attention_items.forEach(item => {
          const preText = item.pre_compliance_pending > 0 ? `${item.pre_compliance_pending} pending` : 'Complete';
          const postText = item.post_compliance_pending > 0 ? `${item.post_compliance_pending} pending` : 'Complete';
          const recurringText = item.recurring_compliance_pending > 0 ? `${item.recurring_compliance_pending} pending` : 'Complete';
          csvContent += `${item.series_code || ''},${preText},${postText},${recurringText}\n`;
        });
      }
      
      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const filename = `SEBI_Disclosure_Report_${new Date().toISOString().split('T')[0]}.csv`;
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (import.meta.env.DEV) { console.log('✅ CSV export completed successfully'); }

    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting SEBI Disclosure Report to CSV:', error); }
      throw error;
    }
  }

  /**
   * Export Audit Trail Report to Excel
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportAuditTrailReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting Excel export for Audit Trail Report...'); }
      
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Summary
      const summaryData = [
        ['AUDIT TRAIL REPORT'],
        [''],
        ['Generated Date:', new Date().toLocaleDateString('en-GB')],
        [''],
        ['FILTERS'],
        ['From Date:', data.filters?.from_date || 'N/A'],
        ['To Date:', data.filters?.to_date || 'N/A'],
        ['Series Filter:', data.filters?.series_id ? `Series ID: ${data.filters.series_id}` : 'All Series'],
        [''],
        ['SUMMARY'],
        ['Metric', 'Value'],
        ['Total Investments (₹)', data.summary?.total_investments || 0],
        ['Total Payouts Till Date (₹)', data.summary?.total_payouts || 0],
        ['Upcoming Payouts - Next Month (₹)', data.summary?.upcoming_payouts || 0],
        ['Payout Rate (%)', data.summary?.payout_rate || 0],
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 35 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Sheet 2: Investment Transactions
      if (data.investments && data.investments.length > 0) {
        const investmentData = [
          ['INVESTMENT TRANSACTIONS'],
          [''],
          [
            'ID',
            'Date Received',
            'Investor ID',
            'Investor Name',
            'Series Code',
            'Series Name',
            'Amount (₹)',
            'Date Transferred',
            'Status',
            'Created At'
          ]
        ];
        
        data.investments.forEach(investment => {
          // Force timestamp to be treated as text by prepending with space
          const createdAt = investment.created_at ? ` ${investment.created_at}` : '';
          
          investmentData.push([
            investment.id || '',
            investment.date_received || '',
            investment.investor_id || '',
            investment.investor_name || '',
            investment.series_code || '',
            investment.series_name || '',
            investment.amount || 0,
            investment.date_transferred || 'N/A',
            investment.status || '',
            createdAt
          ]);
        });
        
        const investmentSheet = XLSX.utils.aoa_to_sheet(investmentData);
        investmentSheet['!cols'] = [
          { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
          { wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 25 }
        ];
        XLSX.utils.book_append_sheet(workbook, investmentSheet, 'Investment Transactions');
      }
      
      // Sheet 3: Completed Payouts
      if (data.completed_payouts && data.completed_payouts.length > 0) {
        const completedPayoutsData = [
          ['COMPLETED PAYOUTS'],
          [''],
          [
            'Series ID',
            'Series Code',
            'Series Name',
            'Investor ID',
            'Investor Name',
            'Invested Amount (₹)',
            'Payout Month',
            'Payout Date',
            'Paid Timestamp',
            'Payout Amount (₹)'
          ]
        ];
        
        data.completed_payouts.forEach(payout => {
          // Force timestamp to be treated as text by prepending with space
          const paidTimestamp = payout.paid_timestamp ? ` ${payout.paid_timestamp}` : '';
          
          completedPayoutsData.push([
            payout.series_id || '',
            payout.series_code || '',
            payout.series_name || '',
            payout.investor_id || '',
            payout.investor_name || '',
            payout.invested_amount || 0,
            payout.payout_month || '',
            payout.payout_date || '',
            paidTimestamp,
            payout.payout_amount || 0
          ]);
        });
        
        const completedPayoutsSheet = XLSX.utils.aoa_to_sheet(completedPayoutsData);
        completedPayoutsSheet['!cols'] = [
          { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 25 },
          { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 25 }, { wch: 18 }
        ];
        XLSX.utils.book_append_sheet(workbook, completedPayoutsSheet, 'Completed Payouts');
      }
      
      // Sheet 4: Pending Payouts
      if (data.pending_payouts && data.pending_payouts.length > 0) {
        const pendingPayoutsData = [
          ['PENDING PAYOUTS'],
          [''],
          [
            'Series ID',
            'Series Code',
            'Series Name',
            'Investor ID',
            'Investor Name',
            'Invested Amount (₹)',
            'Payout Month',
            'Payout Date',
            'Scheduled Timestamp',
            'To Be Paid Amount (₹)'
          ]
        ];
        
        data.pending_payouts.forEach(payout => {
          // Force timestamp to be treated as text by prepending with space
          const scheduledTimestamp = payout.scheduled_timestamp ? ` ${payout.scheduled_timestamp}` : '';
          
          pendingPayoutsData.push([
            payout.series_id || '',
            payout.series_code || '',
            payout.series_name || '',
            payout.investor_id || '',
            payout.investor_name || '',
            payout.invested_amount || 0,
            payout.payout_month || '',
            payout.payout_date || '',
            scheduledTimestamp,
            payout.payout_amount || 0
          ]);
        });
        
        const pendingPayoutsSheet = XLSX.utils.aoa_to_sheet(pendingPayoutsData);
        pendingPayoutsSheet['!cols'] = [
          { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 25 },
          { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 25 }, { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(workbook, pendingPayoutsSheet, 'Pending Payouts');
      }
      
      // Sheet 5: Upcoming Payouts (Next Month)
      if (data.upcoming_payouts && data.upcoming_payouts.length > 0) {
        const upcomingPayoutsData = [
          ['UPCOMING PAYOUTS - NEXT MONTH'],
          [''],
          [
            'Series ID',
            'Series Code',
            'Series Name',
            'Investor ID',
            'Investor Name',
            'Payout Month',
            'Payout Date',
            'To Be Paid Amount (₹)'
          ]
        ];
        
        data.upcoming_payouts.forEach(payout => {
          upcomingPayoutsData.push([
            payout.series_id || '',
            payout.series_code || '',
            payout.series_name || '',
            payout.investor_id || '',
            payout.investor_name || '',
            payout.payout_month || '',
            payout.payout_date || '',
            payout.payout_amount || 0
          ]);
        });
        
        const upcomingPayoutsSheet = XLSX.utils.aoa_to_sheet(upcomingPayoutsData);
        upcomingPayoutsSheet['!cols'] = [
          { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 25 },
          { wch: 18 }, { wch: 15 }, { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(workbook, upcomingPayoutsSheet, 'Upcoming Payouts');
      }
      
      // Write file
      const filename = `Audit_Trail_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      if (import.meta.env.DEV) { console.log('✅ Excel export completed successfully'); }
      if (import.meta.env.DEV) { console.log(`   - Investment Transactions: ${data.investments?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Completed Payouts: ${data.completed_payouts?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Pending Payouts: ${data.pending_payouts?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Upcoming Payouts: ${data.upcoming_payouts?.length || 0} records`); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting Audit Trail Report to Excel:', error); }
      throw error;
    }
  }

  /**
   * Export Audit Trail Report to CSV
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportAuditTrailReportCSV(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting CSV export for Audit Trail Report...'); }
      
      // DEBUG: Log sample data to see timestamp format
      if (data.completed_payouts && data.completed_payouts.length > 0) {
        if (import.meta.env.DEV) { console.log('🔍 DEBUG - Sample completed payout:', data.completed_payouts[0]); }
        if (import.meta.env.DEV) { console.log('🔍 DEBUG - paid_timestamp value:', data.completed_payouts[0].paid_timestamp); }
        if (import.meta.env.DEV) { console.log('🔍 DEBUG - paid_timestamp type:', typeof data.completed_payouts[0].paid_timestamp); }
      }
      if (data.investments && data.investments.length > 0) {
        if (import.meta.env.DEV) { console.log('🔍 DEBUG - Sample investment:', data.investments[0]); }
        if (import.meta.env.DEV) { console.log('🔍 DEBUG - created_at value:', data.investments[0].created_at); }
        if (import.meta.env.DEV) { console.log('🔍 DEBUG - created_at type:', typeof data.investments[0].created_at); }
      }
      
      // Helper function to clean and escape CSV values
      const cleanValue = (value) => {
        if (value === null || value === undefined) return '';
        // Convert to string and trim whitespace
        let cleaned = String(value).trim();
        // Replace any special characters that might cause issues
        cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
        // Escape quotes
        cleaned = cleaned.replace(/"/g, '""');
        return cleaned;
      };
      
      // Create CSV content with all sections
      let csvContent = 'AUDIT TRAIL REPORT\n\n';
      csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n\n`;
      
      // Filters
      csvContent += 'FILTERS\n';
      csvContent += `From Date:,${cleanValue(data.filters?.from_date || 'N/A')}\n`;
      csvContent += `To Date:,${cleanValue(data.filters?.to_date || 'N/A')}\n`;
      csvContent += `Series Filter:,${cleanValue(data.filters?.series_id ? `Series ID: ${data.filters.series_id}` : 'All Series')}\n\n`;
      
      // Summary
      csvContent += 'SUMMARY\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Investments (Rs),${data.summary?.total_investments || 0}\n`;
      csvContent += `Total Payouts Till Date (Rs),${data.summary?.total_payouts || 0}\n`;
      csvContent += `Upcoming Payouts - Next Month (Rs),${data.summary?.upcoming_payouts || 0}\n`;
      csvContent += `Payout Rate (%),${data.summary?.payout_rate || 0}\n\n`;
      
      // Investment Transactions
      if (data.investments && data.investments.length > 0) {
        csvContent += 'INVESTMENT TRANSACTIONS\n';
        csvContent += 'ID,Date Received,Investor ID,Investor Name,Series Code,Series Name,Amount (Rs),Date Transferred,Status,Created At\n';
        
        data.investments.forEach(investment => {
          csvContent += `${cleanValue(investment.id)},`;
          csvContent += `${cleanValue(investment.date_received)},`;
          csvContent += `${cleanValue(investment.investor_id)},`;
          csvContent += `"${cleanValue(investment.investor_name)}",`;
          csvContent += `${cleanValue(investment.series_code)},`;
          csvContent += `"${cleanValue(investment.series_name)}",`;
          csvContent += `${investment.amount || 0},`;
          csvContent += `${cleanValue(investment.date_transferred || 'N/A')},`;
          csvContent += `${cleanValue(investment.status)},`;
          // Force timestamp as text by adding = and quotes
          csvContent += `="${cleanValue(investment.created_at)}"\n`;
        });
        csvContent += '\n';
      }
      
      // Completed Payouts
      if (data.completed_payouts && data.completed_payouts.length > 0) {
        csvContent += 'COMPLETED PAYOUTS\n';
        csvContent += 'Series ID,Series Code,Series Name,Investor ID,Investor Name,Invested Amount (Rs),Payout Month,Payout Date,Paid Timestamp,Payout Amount (Rs)\n';
        
        data.completed_payouts.forEach(payout => {
          csvContent += `${cleanValue(payout.series_id)},`;
          csvContent += `${cleanValue(payout.series_code)},`;
          csvContent += `"${cleanValue(payout.series_name)}",`;
          csvContent += `${cleanValue(payout.investor_id)},`;
          csvContent += `"${cleanValue(payout.investor_name)}",`;
          csvContent += `${payout.invested_amount || 0},`;
          csvContent += `${cleanValue(payout.payout_month)},`;
          csvContent += `${cleanValue(payout.payout_date)},`;
          // Force timestamp as text by adding = and quotes
          csvContent += `="${cleanValue(payout.paid_timestamp)}",`;
          csvContent += `${payout.payout_amount || 0}\n`;
        });
        csvContent += '\n';
      }
      
      // Pending Payouts
      if (data.pending_payouts && data.pending_payouts.length > 0) {
        csvContent += 'PENDING PAYOUTS\n';
        csvContent += 'Series ID,Series Code,Series Name,Investor ID,Investor Name,Invested Amount (Rs),Payout Month,Payout Date,Scheduled Timestamp,To Be Paid Amount (Rs)\n';
        
        data.pending_payouts.forEach(payout => {
          csvContent += `${cleanValue(payout.series_id)},`;
          csvContent += `${cleanValue(payout.series_code)},`;
          csvContent += `"${cleanValue(payout.series_name)}",`;
          csvContent += `${cleanValue(payout.investor_id)},`;
          csvContent += `"${cleanValue(payout.investor_name)}",`;
          csvContent += `${payout.invested_amount || 0},`;
          csvContent += `${cleanValue(payout.payout_month)},`;
          csvContent += `${cleanValue(payout.payout_date)},`;
          // Force timestamp as text by adding = and quotes
          csvContent += `="${cleanValue(payout.scheduled_timestamp)}",`;
          csvContent += `${payout.payout_amount || 0}\n`;
        });
        csvContent += '\n';
      }
      
      // Upcoming Payouts (Next Month)
      if (data.upcoming_payouts && data.upcoming_payouts.length > 0) {
        csvContent += 'UPCOMING PAYOUTS - NEXT MONTH\n';
        csvContent += 'Series ID,Series Code,Series Name,Investor ID,Investor Name,Payout Month,Payout Date,To Be Paid Amount (Rs)\n';
        
        data.upcoming_payouts.forEach(payout => {
          csvContent += `${cleanValue(payout.series_id)},`;
          csvContent += `${cleanValue(payout.series_code)},`;
          csvContent += `"${cleanValue(payout.series_name)}",`;
          csvContent += `${cleanValue(payout.investor_id)},`;
          csvContent += `"${cleanValue(payout.investor_name)}",`;
          csvContent += `${cleanValue(payout.payout_month)},`;
          csvContent += `${cleanValue(payout.payout_date)},`;
          csvContent += `${payout.payout_amount || 0}\n`;
        });
        csvContent += '\n';
      }
      
      // Create and download CSV file with UTF-8 BOM for proper encoding
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const filename = `Audit_Trail_Report_${new Date().toISOString().split('T')[0]}.csv`;
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (import.meta.env.DEV) { console.log('✅ CSV export completed successfully'); }
      if (import.meta.env.DEV) { console.log(`   - Investment Transactions: ${data.investments?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Completed Payouts: ${data.completed_payouts?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Pending Payouts: ${data.pending_payouts?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Upcoming Payouts: ${data.upcoming_payouts?.length || 0} records`); }

    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting Audit Trail Report to CSV:', error); }
      throw error;
    }
  }

  /**
   * Export Daily Activity Report to Excel
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportDailyActivityReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting Excel export for Daily Activity Report...'); }
      
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Summary
      const summaryData = [
        ['DAILY ACTIVITY REPORT'],
        [''],
        ['Generated Date:', new Date().toLocaleDateString('en-GB')],
        ['Report Timestamp:', data.timestamp ? new Date(data.timestamp).toLocaleString('en-GB') : 'N/A'],
        [''],
        ['FILTERS'],
        ['From Date:', data.filters?.from_date || 'N/A'],
        ['To Date:', data.filters?.to_date || 'N/A'],
        ['Role Filter:', data.filters?.role ? data.filters.role : 'All Roles'],
        [''],
        ['SUMMARY'],
        ['Metric', 'Value'],
        ['Total Users', data.summary?.total_users || 0],
        ['Avg Time Spent (minutes)', data.summary?.avg_time_spent_minutes || 0],
        ['Total Roles', data.summary?.total_roles || 0],
        [''],
        ['STATISTICS'],
        ['Total User Activities:', data.user_activities?.length || 0],
        ['Total Role Categories:', data.role_breakdown?.length || 0],
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 35 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Sheet 2: User Activity
      if (data.user_activities && data.user_activities.length > 0) {
        const userActivityData = [
          ['USER ACTIVITY'],
          [''],
          ['Generated Date:', new Date().toLocaleDateString('en-GB')],
          ['Date Range:', `${data.filters?.from_date || 'N/A'} to ${data.filters?.to_date || 'N/A'}`],
          ['Role Filter:', data.filters?.role ? data.filters.role : 'All Roles'],
          [''],
          [
            'User ID',
            'User Name',
            'Role',
            'Login Count',
            'Session Count',
            'Total Time (minutes)',
            'Time Spent (Formatted)'
          ]
        ];
        
        data.user_activities.forEach(activity => {
          userActivityData.push([
            activity.user_id || '',
            activity.user_name || '',
            activity.role || '',
            activity.login_count || 0,
            activity.session_count || activity.login_count || 0,
            activity.total_time_minutes || 0,
            activity.time_spent_formatted || '0m'
          ]);
        });
        
        const userActivitySheet = XLSX.utils.aoa_to_sheet(userActivityData);
        userActivitySheet['!cols'] = [
          { wch: 15 },  // User ID
          { wch: 25 },  // User Name
          { wch: 30 },  // Role
          { wch: 15 },  // Login Count
          { wch: 15 },  // Session Count
          { wch: 22 },  // Total Time (minutes)
          { wch: 20 }   // Time Spent (Formatted)
        ];
        XLSX.utils.book_append_sheet(workbook, userActivitySheet, 'User Activity');
      }
      
      // Sheet 3: Role Breakdown
      if (data.role_breakdown && data.role_breakdown.length > 0) {
        const roleBreakdownData = [
          ['TIME SPENT BY ROLE'],
          [''],
          ['Generated Date:', new Date().toLocaleDateString('en-GB')],
          ['Date Range:', `${data.filters?.from_date || 'N/A'} to ${data.filters?.to_date || 'N/A'}`],
          ['Role Filter:', data.filters?.role ? data.filters.role : 'All Roles'],
          [''],
          [
            'Role',
            'Total Time (minutes)',
            'Percentage (%)',
            'Formatted Time'
          ]
        ];
        
        data.role_breakdown.forEach(role => {
          // Format time for better readability
          const totalMinutes = role.total_time_minutes || 0;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = Math.floor(totalMinutes % 60);
          const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
          
          roleBreakdownData.push([
            role.role || '',
            totalMinutes,
            role.percentage || 0,
            formattedTime
          ]);
        });
        
        const roleBreakdownSheet = XLSX.utils.aoa_to_sheet(roleBreakdownData);
        roleBreakdownSheet['!cols'] = [
          { wch: 35 },  // Role
          { wch: 25 },  // Total Time (minutes)
          { wch: 18 },  // Percentage
          { wch: 20 }   // Formatted Time
        ];
        XLSX.utils.book_append_sheet(workbook, roleBreakdownSheet, 'Role Breakdown');
      }
      
      // Write file
      const filename = `Daily_Activity_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      if (import.meta.env.DEV) { console.log('✅ Excel export completed successfully'); }
      if (import.meta.env.DEV) { console.log(`   - User Activities: ${data.user_activities?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Role Breakdown: ${data.role_breakdown?.length || 0} records`); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting Daily Activity Report to Excel:', error); }
      throw error;
    }
  }

  /**
   * Export Daily Activity Report to CSV
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportDailyActivityReportCSV(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting CSV export for Daily Activity Report...'); }
      
      // Helper function to clean and escape CSV values
      const cleanValue = (value) => {
        if (value === null || value === undefined) return '';
        let cleaned = String(value).trim();
        cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        cleaned = cleaned.replace(/"/g, '""');
        return cleaned;
      };
      
      // Create CSV content with all sections
      let csvContent = 'DAILY ACTIVITY REPORT\n\n';
      csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n`;
      csvContent += `Report Timestamp:,${data.timestamp ? new Date(data.timestamp).toLocaleString('en-GB') : 'N/A'}\n\n`;
      
      // Filters
      csvContent += 'FILTERS\n';
      csvContent += `From Date:,${cleanValue(data.filters?.from_date || 'N/A')}\n`;
      csvContent += `To Date:,${cleanValue(data.filters?.to_date || 'N/A')}\n`;
      csvContent += `Role Filter:,${cleanValue(data.filters?.role ? data.filters.role : 'All Roles')}\n\n`;
      
      // Summary
      csvContent += 'SUMMARY\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Users,${data.summary?.total_users || 0}\n`;
      csvContent += `Avg Time Spent (minutes),${data.summary?.avg_time_spent_minutes || 0}\n`;
      csvContent += `Total Roles,${data.summary?.total_roles || 0}\n\n`;
      
      // Statistics
      csvContent += 'STATISTICS\n';
      csvContent += `Total User Activities:,${data.user_activities?.length || 0}\n`;
      csvContent += `Total Role Categories:,${data.role_breakdown?.length || 0}\n\n`;
      
      // User Activity
      if (data.user_activities && data.user_activities.length > 0) {
        csvContent += 'USER ACTIVITY\n';
        csvContent += 'User ID,User Name,Role,Login Count,Session Count,Total Time (minutes),Time Spent (Formatted)\n';
        
        data.user_activities.forEach(activity => {
          csvContent += `${cleanValue(activity.user_id)},`;
          csvContent += `"${cleanValue(activity.user_name)}",`;
          csvContent += `"${cleanValue(activity.role)}",`;
          csvContent += `${activity.login_count || 0},`;
          csvContent += `${activity.session_count || activity.login_count || 0},`;
          csvContent += `${activity.total_time_minutes || 0},`;
          csvContent += `${cleanValue(activity.time_spent_formatted)}\n`;
        });
        csvContent += '\n';
      }
      
      // Role Breakdown
      if (data.role_breakdown && data.role_breakdown.length > 0) {
        csvContent += 'TIME SPENT BY ROLE\n';
        csvContent += 'Role,Total Time (minutes),Percentage (%),Formatted Time\n';
        
        data.role_breakdown.forEach(role => {
          // Format time for better readability
          const totalMinutes = role.total_time_minutes || 0;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = Math.floor(totalMinutes % 60);
          const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
          
          csvContent += `"${cleanValue(role.role)}",`;
          csvContent += `${role.total_time_minutes || 0},`;
          csvContent += `${role.percentage || 0},`;
          csvContent += `${formattedTime}\n`;
        });
        csvContent += '\n';
      }
      
      // Create and download CSV file with UTF-8 BOM
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const filename = `Daily_Activity_Report_${new Date().toISOString().split('T')[0]}.csv`;
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (import.meta.env.DEV) { console.log('✅ CSV export completed successfully'); }
      if (import.meta.env.DEV) { console.log(`   - User Activities: ${data.user_activities?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Role Breakdown: ${data.role_breakdown?.length || 0} records`); }

    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting Daily Activity Report to CSV:', error); }
      throw error;
    }
  }

  /**
   * Export Subscription Trend Analysis to Excel
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportSubscriptionTrendAnalysis(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting Excel export for Subscription Trend Analysis...'); }
      
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Overview Summary
      const summaryData = [
        ['SUBSCRIPTION TREND ANALYSIS'],
        [''],
        ['Generated Date:', new Date().toLocaleDateString('en-GB')],
        ['Report Timestamp:', data.timestamp ? new Date(data.timestamp).toLocaleString('en-GB') : 'N/A'],
        [''],
        ['OVERVIEW SUMMARY'],
        ['Metric', 'Value'],
        ['Total Series', data.summary_top?.total_series || 0],
        ['Active Series', data.summary_top?.active_series || 0],
        ['Total Investors', data.summary_top?.total_investors || 0],
        ['Active Investors', data.summary_top?.active_investors || 0],
        [''],
        ['RETENTION & GROWTH METRICS'],
        ['Metric', 'Value'],
        ['Retained Investors', data.summary_retention?.retained_investors || 0],
        ['Retention Rate (%)', data.summary_retention?.retention_rate || 0],
        ['Avg Investors Increase', data.summary_retention?.avg_investors_increase || 0],
        ['Avg Investment Increase (₹)', data.summary_retention?.avg_investment_increase || 0],
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 35 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Sheet 2: Investor Details
      if (data.investor_details && data.investor_details.length > 0) {
        const investorDetailsData = [
          ['INVESTOR DETAILS'],
          [''],
          ['Generated Date:', new Date().toLocaleDateString('en-GB')],
          ['Total Investors:', data.investor_details.length],
          [''],
          [
            'Investor ID',
            'Investor Name',
            'Email',
            'Phone',
            'Total Investment (₹)',
            'Series Count',
            'Avg Investment (₹)'
          ]
        ];
        
        data.investor_details.forEach(investor => {
          investorDetailsData.push([
            investor.investor_id || '',
            investor.investor_name || '',
            investor.email || '',
            investor.phone || '',
            investor.total_investment || 0,
            investor.series_count || 0,
            investor.avg_investment || 0
          ]);
        });
        
        const investorDetailsSheet = XLSX.utils.aoa_to_sheet(investorDetailsData);
        investorDetailsSheet['!cols'] = [
          { wch: 15 },  // Investor ID
          { wch: 30 },  // Investor Name
          { wch: 35 },  // Email
          { wch: 15 },  // Phone
          { wch: 20 },  // Total Investment
          { wch: 15 },  // Series Count
          { wch: 20 }   // Avg Investment
        ];
        XLSX.utils.book_append_sheet(workbook, investorDetailsSheet, 'Investor Details');
      }
      
      // Sheet 3: Series Trend
      if (data.series_trend && data.series_trend.length > 0) {
        const seriesTrendData = [
          ['SERIES TREND ANALYSIS'],
          [''],
          ['Generated Date:', new Date().toLocaleDateString('en-GB')],
          ['Total Series:', data.series_trend.length],
          [''],
          [
            'Series ID',
            'Series Name',
            'Total Investors',
            'Investor Change (%)',
            'Total Investment (₹)',
            'Investment Change (%)'
          ]
        ];
        
        data.series_trend.forEach(series => {
          seriesTrendData.push([
            series.series_id || '',
            series.series_name || '',
            series.total_investors || 0,
            series.investor_change_pct || 0,
            series.total_investment || 0,
            series.investment_change_pct || 0
          ]);
        });
        
        const seriesTrendSheet = XLSX.utils.aoa_to_sheet(seriesTrendData);
        seriesTrendSheet['!cols'] = [
          { wch: 12 },  // Series ID
          { wch: 30 },  // Series Name
          { wch: 18 },  // Total Investors
          { wch: 20 },  // Investor Change %
          { wch: 22 },  // Total Investment
          { wch: 22 }   // Investment Change %
        ];
        XLSX.utils.book_append_sheet(workbook, seriesTrendSheet, 'Series Trend');
      }
      
      // Sheet 4: Top Performing Series
      if (data.top_performing_series && data.top_performing_series.length > 0) {
        const topPerformingData = [
          ['TOP PERFORMING SERIES'],
          [''],
          ['Generated Date:', new Date().toLocaleDateString('en-GB')],
          ['Total Series:', data.top_performing_series.length],
          [''],
          [
            'Series ID',
            'Series Name',
            'Interest Rate (%)',
            'Trustee',
            'Security Type',
            'Start Date',
            'End Date',
            'Target Amount (₹)',
            'Total Invested (₹)',
            'Investment (%)'
          ]
        ];
        
        data.top_performing_series.forEach(series => {
          topPerformingData.push([
            series.series_id || '',
            series.series_name || '',
            series.interest_rate || 0,
            series.trustee || '',
            series.security_type || '',
            series.start_date ? new Date(series.start_date).toLocaleDateString('en-GB') : '',
            series.end_date ? new Date(series.end_date).toLocaleDateString('en-GB') : '',
            series.target_amount || 0,
            series.total_invested || 0,
            series.investment_percentage || 0
          ]);
        });
        
        const topPerformingSheet = XLSX.utils.aoa_to_sheet(topPerformingData);
        topPerformingSheet['!cols'] = [
          { wch: 12 },  // Series ID
          { wch: 30 },  // Series Name
          { wch: 18 },  // Interest Rate
          { wch: 30 },  // Trustee
          { wch: 18 },  // Security Type
          { wch: 15 },  // Start Date
          { wch: 15 },  // End Date
          { wch: 20 },  // Target Amount
          { wch: 20 },  // Total Invested
          { wch: 18 }   // Investment %
        ];
        XLSX.utils.book_append_sheet(workbook, topPerformingSheet, 'Top Performing Series');
      }
      
      // Write file
      const filename = `Subscription_Trend_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      if (import.meta.env.DEV) { console.log('✅ Excel export completed successfully'); }
      if (import.meta.env.DEV) { console.log(`   - Investor Details: ${data.investor_details?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Series Trend: ${data.series_trend?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Top Performing Series: ${data.top_performing_series?.length || 0} records`); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting Subscription Trend Analysis to Excel:', error); }
      throw error;
    }
  }

  /**
   * Export Subscription Trend Analysis to CSV
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportSubscriptionTrendAnalysisCSV(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting CSV export for Subscription Trend Analysis...'); }
      
      // Helper function to clean values for CSV
      const cleanValue = (value) => {
        if (value === null || value === undefined) return '';
        return String(value).replace(/"/g, '""');
      };
      
      // Helper function to format timestamp for CSV (prevents Excel from showing ####)
      const formatTimestamp = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `="${day}/${month}/${year} ${hours}:${minutes}:${seconds}"`;
      };
      
      let csvContent = '';
      
      // Section 1: Overview Summary
      csvContent += 'SUBSCRIPTION TREND ANALYSIS\n';
      csvContent += '\n';
      csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n`;
      csvContent += `Report Timestamp:,${data.timestamp ? new Date(data.timestamp).toLocaleString('en-GB') : 'N/A'}\n`;
      csvContent += '\n';
      csvContent += 'OVERVIEW SUMMARY\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Series,${data.summary_top?.total_series || 0}\n`;
      csvContent += `Active Series,${data.summary_top?.active_series || 0}\n`;
      csvContent += `Total Investors,${data.summary_top?.total_investors || 0}\n`;
      csvContent += `Active Investors,${data.summary_top?.active_investors || 0}\n`;
      csvContent += '\n';
      csvContent += 'RETENTION & GROWTH METRICS\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Retained Investors,${data.summary_retention?.retained_investors || 0}\n`;
      csvContent += `Retention Rate (%),${data.summary_retention?.retention_rate || 0}\n`;
      csvContent += `Avg Investors Increase,${data.summary_retention?.avg_investors_increase || 0}\n`;
      csvContent += `Avg Investment Increase (₹),${data.summary_retention?.avg_investment_increase || 0}\n`;
      csvContent += '\n\n';
      
      // Section 2: Investor Details
      if (data.investor_details && data.investor_details.length > 0) {
        csvContent += 'INVESTOR DETAILS\n';
        csvContent += '\n';
        csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n`;
        csvContent += `Total Investors:,${data.investor_details.length}\n`;
        csvContent += '\n';
        csvContent += 'Investor ID,Investor Name,Email,Phone,Total Investment (₹),Series Count,Avg Investment (₹)\n';
        
        data.investor_details.forEach(investor => {
          csvContent += `"${cleanValue(investor.investor_id)}",`;
          csvContent += `"${cleanValue(investor.investor_name)}",`;
          csvContent += `"${cleanValue(investor.email)}",`;
          csvContent += `"${cleanValue(investor.phone)}",`;
          csvContent += `${investor.total_investment || 0},`;
          csvContent += `${investor.series_count || 0},`;
          csvContent += `${investor.avg_investment || 0}\n`;
        });
        csvContent += '\n\n';
      }
      
      // Section 3: Series Trend
      if (data.series_trend && data.series_trend.length > 0) {
        csvContent += 'SERIES TREND ANALYSIS\n';
        csvContent += '\n';
        csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n`;
        csvContent += `Total Series:,${data.series_trend.length}\n`;
        csvContent += '\n';
        csvContent += 'Series ID,Series Name,Total Investors,Investor Change (%),Total Investment (₹),Investment Change (%)\n';
        
        data.series_trend.forEach(series => {
          csvContent += `${series.series_id || ''},`;
          csvContent += `"${cleanValue(series.series_name)}",`;
          csvContent += `${series.total_investors || 0},`;
          csvContent += `${series.investor_change_pct || 0},`;
          csvContent += `${series.total_investment || 0},`;
          csvContent += `${series.investment_change_pct || 0}\n`;
        });
        csvContent += '\n\n';
      }
      
      // Section 4: Top Performing Series
      if (data.top_performing_series && data.top_performing_series.length > 0) {
        csvContent += 'TOP PERFORMING SERIES\n';
        csvContent += '\n';
        csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n`;
        csvContent += `Total Series:,${data.top_performing_series.length}\n`;
        csvContent += '\n';
        csvContent += 'Series ID,Series Name,Interest Rate (%),Trustee,Security Type,Start Date,End Date,Target Amount (₹),Total Invested (₹),Investment (%)\n';
        
        data.top_performing_series.forEach(series => {
          csvContent += `${series.series_id || ''},`;
          csvContent += `"${cleanValue(series.series_name)}",`;
          csvContent += `${series.interest_rate || 0},`;
          csvContent += `"${cleanValue(series.trustee)}",`;
          csvContent += `"${cleanValue(series.security_type)}",`;
          csvContent += `${series.start_date ? new Date(series.start_date).toLocaleDateString('en-GB') : ''},`;
          csvContent += `${series.end_date ? new Date(series.end_date).toLocaleDateString('en-GB') : ''},`;
          csvContent += `${series.target_amount || 0},`;
          csvContent += `${series.total_invested || 0},`;
          csvContent += `${series.investment_percentage || 0}\n`;
        });
        csvContent += '\n';
      }
      
      // Create and download CSV file with UTF-8 BOM
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const filename = `Subscription_Trend_Analysis_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (import.meta.env.DEV) { console.log('✅ CSV export completed successfully'); }
      if (import.meta.env.DEV) { console.log(`   - Investor Details: ${data.investor_details?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Series Trend: ${data.series_trend?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Top Performing Series: ${data.top_performing_series?.length || 0} records`); }

    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting Subscription Trend Analysis to CSV:', error); }
      throw error;
    }
  }

  /**
   * Export Series Maturity Report to Excel
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportSeriesMaturityReport(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting Excel export for Series Maturity Report...'); }
      
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Summary
      const summaryData = [
        ['SERIES MATURITY REPORT'],
        [''],
        ['Generated Date:', new Date().toLocaleDateString('en-GB')],
        ['Report Timestamp:', data.timestamp ? new Date(data.timestamp).toLocaleString('en-GB') : 'N/A'],
        [''],
        ['MATURITY OVERVIEW'],
        ['Metric', 'Value'],
        ['Total Series', data.summary?.total_series || 0],
        ['Maturing Within 90 Days', data.summary?.series_maturing_soon || 0],
        ['Total Investors', data.summary?.total_investors || 0],
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 35 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Sheet 2: Series Maturing Within 90 Days
      if (data.series_maturing_90_days && data.series_maturing_90_days.length > 0) {
        const series90DaysData = [
          ['SERIES MATURING WITHIN 90 DAYS'],
          [''],
          ['Generated Date:', new Date().toLocaleDateString('en-GB')],
          ['Total Series:', data.series_maturing_90_days.length],
          [''],
          [
            'Series ID',
            'Series Name',
            'No. of Investors',
            'Maturity Date',
            'Amount to Return (₹)'
          ]
        ];
        
        data.series_maturing_90_days.forEach(series => {
          series90DaysData.push([
            series.series_id || '',
            series.series_name || '',
            series.investor_count || 0,
            series.maturity_date ? new Date(series.maturity_date).toLocaleDateString('en-GB') : '',
            series.total_amount_to_return || 0
          ]);
        });
        
        const series90DaysSheet = XLSX.utils.aoa_to_sheet(series90DaysData);
        series90DaysSheet['!cols'] = [
          { wch: 12 },  // Series ID
          { wch: 35 },  // Series Name
          { wch: 18 },  // No. of Investors
          { wch: 18 },  // Maturity Date
          { wch: 25 }   // Amount to Return
        ];
        XLSX.utils.book_append_sheet(workbook, series90DaysSheet, 'Maturing Within 90 Days');
      }
      
      // Sheet 3: Investor Details for Series Maturing Within 90 Days
      const investorsBySeries = data.investors_by_series_90_days || {};
      const series90Days = data.series_maturing_90_days || [];
      
      if (series90Days.length > 0 && Object.keys(investorsBySeries).length > 0) {
        const investorDetailsData = [
          ['INVESTOR DETAILS - SERIES MATURING WITHIN 90 DAYS'],
          [''],
          ['Generated Date:', new Date().toLocaleDateString('en-GB')],
          [''],
        ];
        
        // Add investor details for each series
        series90Days.forEach(series => {
          const investors = investorsBySeries[series.series_id] || [];
          
          if (investors.length > 0) {
            investorDetailsData.push([]);
            investorDetailsData.push([`Series: ${series.series_name}`]);
            investorDetailsData.push([
              'Investor ID',
              'Investor Name',
              'Active in Series',
              'Amount to Receive (₹)'
            ]);
            
            investors.forEach(investor => {
              investorDetailsData.push([
                investor.investor_id || '',
                investor.investor_name || '',
                investor.active_series_count || 0,
                investor.amount_to_receive || 0
              ]);
            });
          }
        });
        
        const investorDetailsSheet = XLSX.utils.aoa_to_sheet(investorDetailsData);
        investorDetailsSheet['!cols'] = [
          { wch: 15 },  // Investor ID
          { wch: 35 },  // Investor Name
          { wch: 20 },  // Active in Series
          { wch: 25 }   // Amount to Receive
        ];
        XLSX.utils.book_append_sheet(workbook, investorDetailsSheet, 'Investor Details');
      }
      
      // Sheet 4: Series Maturing in 90-180 Days
      if (data.series_maturing_90_to_180_days && data.series_maturing_90_to_180_days.length > 0) {
        const series90To180Data = [
          ['SERIES MATURING IN 90-180 DAYS'],
          [''],
          ['Generated Date:', new Date().toLocaleDateString('en-GB')],
          ['Total Series:', data.series_maturing_90_to_180_days.length],
          [''],
          [
            'Series ID',
            'Series Name',
            'No. of Investors',
            'Maturity Date',
            'Amount to Return (₹)'
          ]
        ];
        
        data.series_maturing_90_to_180_days.forEach(series => {
          series90To180Data.push([
            series.series_id || '',
            series.series_name || '',
            series.investor_count || 0,
            series.maturity_date ? new Date(series.maturity_date).toLocaleDateString('en-GB') : '',
            series.total_amount_to_return || 0
          ]);
        });
        
        const series90To180Sheet = XLSX.utils.aoa_to_sheet(series90To180Data);
        series90To180Sheet['!cols'] = [
          { wch: 12 },  // Series ID
          { wch: 35 },  // Series Name
          { wch: 18 },  // No. of Investors
          { wch: 18 },  // Maturity Date
          { wch: 25 }   // Amount to Return
        ];
        XLSX.utils.book_append_sheet(workbook, series90To180Sheet, 'Maturing in 90-180 Days');
      }
      
      // Sheet 5: Series Maturing After 6 Months
      if (data.series_maturing_after_6_months && data.series_maturing_after_6_months.length > 0) {
        const seriesAfter6MonthsData = [
          ['SERIES MATURING AFTER 6 MONTHS'],
          [''],
          ['Generated Date:', new Date().toLocaleDateString('en-GB')],
          ['Total Series:', data.series_maturing_after_6_months.length],
          [''],
          [
            'Series ID',
            'Series Name',
            'No. of Investors',
            'Maturity Date',
            'Amount to Return (₹)'
          ]
        ];
        
        data.series_maturing_after_6_months.forEach(series => {
          seriesAfter6MonthsData.push([
            series.series_id || '',
            series.series_name || '',
            series.investor_count || 0,
            series.maturity_date ? new Date(series.maturity_date).toLocaleDateString('en-GB') : '',
            series.total_amount_to_return || 0
          ]);
        });
        
        const seriesAfter6MonthsSheet = XLSX.utils.aoa_to_sheet(seriesAfter6MonthsData);
        seriesAfter6MonthsSheet['!cols'] = [
          { wch: 12 },  // Series ID
          { wch: 35 },  // Series Name
          { wch: 18 },  // No. of Investors
          { wch: 18 },  // Maturity Date
          { wch: 25 }   // Amount to Return
        ];
        XLSX.utils.book_append_sheet(workbook, seriesAfter6MonthsSheet, 'Maturing After 6 Months');
      }
      
      // Write file
      const filename = `Series_Maturity_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      if (import.meta.env.DEV) { console.log('✅ Excel export completed successfully'); }
      if (import.meta.env.DEV) { console.log(`   - Series Maturing Within 90 Days: ${data.series_maturing_90_days?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Series Maturing in 90-180 Days: ${data.series_maturing_90_to_180_days?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Series Maturing After 6 Months: ${data.series_maturing_after_6_months?.length || 0} records`); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting Series Maturity Report to Excel:', error); }
      throw error;
    }
  }

  /**
   * Export Series Maturity Report to CSV
   * @param {Object} data - Report data from backend
   * @returns {void}
   */
  exportSeriesMaturityReportCSV(data) {
    try {
      if (import.meta.env.DEV) { console.log('📊 Starting CSV export for Series Maturity Report...'); }
      
      // Helper function to clean values for CSV
      const cleanValue = (value) => {
        if (value === null || value === undefined) return '';
        return String(value).replace(/"/g, '""');
      };
      
      let csvContent = '';
      
      // Section 1: Summary
      csvContent += 'SERIES MATURITY REPORT\n';
      csvContent += '\n';
      csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n`;
      csvContent += `Report Timestamp:,${data.timestamp ? new Date(data.timestamp).toLocaleString('en-GB') : 'N/A'}\n`;
      csvContent += '\n';
      csvContent += 'MATURITY OVERVIEW\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Series,${data.summary?.total_series || 0}\n`;
      csvContent += `Maturing Within 90 Days,${data.summary?.series_maturing_soon || 0}\n`;
      csvContent += `Total Investors,${data.summary?.total_investors || 0}\n`;
      csvContent += '\n\n';
      
      // Section 2: Series Maturing Within 90 Days
      if (data.series_maturing_90_days && data.series_maturing_90_days.length > 0) {
        csvContent += 'SERIES MATURING WITHIN 90 DAYS\n';
        csvContent += '\n';
        csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n`;
        csvContent += `Total Series:,${data.series_maturing_90_days.length}\n`;
        csvContent += '\n';
        csvContent += 'Series ID,Series Name,No. of Investors,Maturity Date,Amount to Return (₹)\n';
        
        data.series_maturing_90_days.forEach(series => {
          csvContent += `${series.series_id || ''},`;
          csvContent += `"${cleanValue(series.series_name)}",`;
          csvContent += `${series.investor_count || 0},`;
          csvContent += `${series.maturity_date ? new Date(series.maturity_date).toLocaleDateString('en-GB') : ''},`;
          csvContent += `${series.total_amount_to_return || 0}\n`;
        });
        csvContent += '\n\n';
      }
      
      // Section 3: Investor Details for Each Series
      const investorsBySeries = data.investors_by_series_90_days || {};
      const series90Days = data.series_maturing_90_days || [];
      
      if (series90Days.length > 0 && Object.keys(investorsBySeries).length > 0) {
        csvContent += 'INVESTOR DETAILS - SERIES MATURING WITHIN 90 DAYS\n';
        csvContent += '\n';
        csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n`;
        csvContent += '\n';
        
        series90Days.forEach(series => {
          const investors = investorsBySeries[series.series_id] || [];
          
          if (investors.length > 0) {
            csvContent += '\n';
            csvContent += `Series: ${cleanValue(series.series_name)}\n`;
            csvContent += 'Investor ID,Investor Name,Active in Series,Amount to Receive (₹)\n';
            
            investors.forEach(investor => {
              csvContent += `"${cleanValue(investor.investor_id)}",`;
              csvContent += `"${cleanValue(investor.investor_name)}",`;
              csvContent += `${investor.active_series_count || 0},`;
              csvContent += `${investor.amount_to_receive || 0}\n`;
            });
          }
        });
        csvContent += '\n\n';
      }
      
      // Section 4: Series Maturing in 90-180 Days
      if (data.series_maturing_90_to_180_days && data.series_maturing_90_to_180_days.length > 0) {
        csvContent += 'SERIES MATURING IN 90-180 DAYS\n';
        csvContent += '\n';
        csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n`;
        csvContent += `Total Series:,${data.series_maturing_90_to_180_days.length}\n`;
        csvContent += '\n';
        csvContent += 'Series ID,Series Name,No. of Investors,Maturity Date,Amount to Return (₹)\n';
        
        data.series_maturing_90_to_180_days.forEach(series => {
          csvContent += `${series.series_id || ''},`;
          csvContent += `"${cleanValue(series.series_name)}",`;
          csvContent += `${series.investor_count || 0},`;
          csvContent += `${series.maturity_date ? new Date(series.maturity_date).toLocaleDateString('en-GB') : ''},`;
          csvContent += `${series.total_amount_to_return || 0}\n`;
        });
        csvContent += '\n\n';
      }
      
      // Section 5: Series Maturing After 6 Months
      if (data.series_maturing_after_6_months && data.series_maturing_after_6_months.length > 0) {
        csvContent += 'SERIES MATURING AFTER 6 MONTHS\n';
        csvContent += '\n';
        csvContent += `Generated Date:,${new Date().toLocaleDateString('en-GB')}\n`;
        csvContent += `Total Series:,${data.series_maturing_after_6_months.length}\n`;
        csvContent += '\n';
        csvContent += 'Series ID,Series Name,No. of Investors,Maturity Date,Amount to Return (₹)\n';
        
        data.series_maturing_after_6_months.forEach(series => {
          csvContent += `${series.series_id || ''},`;
          csvContent += `"${cleanValue(series.series_name)}",`;
          csvContent += `${series.investor_count || 0},`;
          csvContent += `${series.maturity_date ? new Date(series.maturity_date).toLocaleDateString('en-GB') : ''},`;
          csvContent += `${series.total_amount_to_return || 0}\n`;
        });
        csvContent += '\n';
      }
      
      // Create and download CSV file with UTF-8 BOM
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const filename = `Series_Maturity_Report_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (import.meta.env.DEV) { console.log('✅ CSV export completed successfully'); }
      if (import.meta.env.DEV) { console.log(`   - Series Maturing Within 90 Days: ${data.series_maturing_90_days?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Series Maturing in 90-180 Days: ${data.series_maturing_90_to_180_days?.length || 0} records`); }
      if (import.meta.env.DEV) { console.log(`   - Series Maturing After 6 Months: ${data.series_maturing_after_6_months?.length || 0} records`); }

    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error exporting Series Maturity Report to CSV:', error); }
      throw error;
    }
  }
}

// Export singleton instance
const excelExportService = new ExcelExportService();
export default excelExportService;
