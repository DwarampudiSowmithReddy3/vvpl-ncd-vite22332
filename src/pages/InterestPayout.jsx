import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './InterestPayout.css';
import { MdOutlineFileDownload, MdPayment } from "react-icons/md";
import { FiSearch, FiFilter, FiUpload } from "react-icons/fi";
import { FaEye, FaRupeeSign } from "react-icons/fa";
import { MdTrendingUp } from "react-icons/md";
import { HiUsers } from "react-icons/hi";
import * as XLSX from 'xlsx';

const InterestPayout = () => {
  const navigate = useNavigate();
  const { showCreateButton, canEdit } = usePermissions();
  const { user } = useAuth();
  const { series, investors, addAuditLog, addInterestPayoutTransaction } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeries, setFilterSeries] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportSeries, setSelectedExportSeries] = useState('all');
  const [exportTab, setExportTab] = useState('current'); // 'current' or 'upcoming'
  const [showImportModal, setShowImportModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  
  // Store payout status updates (key: investorId-seriesName-month, value: status)
  const [payoutStatusUpdates, setPayoutStatusUpdates] = useState(() => {
    const saved = localStorage.getItem('payoutStatusUpdates');
    return saved ? JSON.parse(saved) : {};
  });

  // Add state to trigger re-renders when metadata changes
  const [metadataUpdateTrigger, setMetadataUpdateTrigger] = useState(0);

  // Save payout status updates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('payoutStatusUpdates', JSON.stringify(payoutStatusUpdates));
  }, [payoutStatusUpdates]);

  // Generate payout data based on actual series and investors from DataContext
  const payoutData = useMemo(() => {
    const payouts = [];
    let payoutId = 1;
    
    // Get current and next month
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Load payout metadata from localStorage
    const payoutMetadata = JSON.parse(localStorage.getItem('payoutMetadata') || '{}');
    console.log('Loaded payout metadata:', payoutMetadata);
    
    // Only generate payouts for active series
    const activeSeries = series.filter(s => s.status === 'active');
    
    activeSeries.forEach(s => {
      // Get investors for this series
      const seriesInvestors = investors.filter(inv => inv.series && inv.series.includes(s.name));
      
      seriesInvestors.forEach(investor => {
        // Calculate investment amount for this series
        const investmentPerSeries = investor.investment / investor.series.length;
        
        // Calculate interest based on frequency (always monthly)
        let interestAmount = 0;
        interestAmount = (investmentPerSeries * s.interestRate) / 100 / 12;
        
        // Check if there are any custom payouts for this investor-series combination
        const relevantStatusKeys = Object.keys(payoutStatusUpdates).filter(key => 
          key.startsWith(`${investor.investorId}-${s.name}-`)
        );
        
        const relevantMetadataKeys = Object.keys(payoutMetadata).filter(key => 
          key.startsWith(`${investor.investorId}-${s.name}-`) && key.endsWith('_metadata')
        );
        
        // Combine all relevant keys to get unique months
        const allRelevantKeys = new Set([
          ...relevantStatusKeys,
          ...relevantMetadataKeys.map(key => key.replace('_metadata', ''))
        ]);
        
        if (allRelevantKeys.size === 0) {
          // No custom data, create default current month payout
          const defaultPayoutKey = `${investor.investorId}-${s.name}-${currentMonth}`;
          const payoutStatus = payoutStatusUpdates[defaultPayoutKey] || 'Paid';
          
          payouts.push({
            id: payoutId++,
            investorId: investor.investorId,
            investorName: investor.name,
            seriesName: s.name,
            seriesId: s.id,
            interestMonth: currentMonth,
            interestDate: `15-${currentDate.toLocaleString('default', { month: 'short' })}-${currentDate.getFullYear()}`,
            amount: Math.round(interestAmount),
            status: payoutStatus,
            bankName: investor.bankName || 'N/A',
            bankAccountNumber: investor.bankAccountNumber || 'N/A',
            ifscCode: investor.ifscCode || 'N/A'
          });
        } else {
          // Create payouts for each custom entry
          allRelevantKeys.forEach(payoutKey => {
            const metadataKey = `${payoutKey}_metadata`;
            const metadata = payoutMetadata[metadataKey];
            const payoutStatus = payoutStatusUpdates[payoutKey] || 'Paid';
            
            // Extract month from the payout key or use metadata
            const keyParts = payoutKey.split('-');
            const monthFromKey = keyParts.slice(2).join('-');
            
            // Use custom metadata if available, otherwise derive from key or use current month
            let displayMonth = currentMonth;
            let displayDate = `15-${currentDate.toLocaleString('default', { month: 'short' })}-${currentDate.getFullYear()}`;
            
            if (metadata) {
              // Use metadata values if they exist
              if (metadata.customMonth && metadata.customMonth.trim()) {
                displayMonth = metadata.customMonth.trim();
              }
              if (metadata.customDate && metadata.customDate.trim()) {
                displayDate = metadata.customDate.trim();
              }
            } else if (monthFromKey && monthFromKey !== currentMonth) {
              // Use the month from the key if it's different from current month
              displayMonth = monthFromKey;
            }
            
            console.log(`Creating payout for ${payoutKey}:`, {
              metadata,
              displayMonth,
              displayDate,
              monthFromKey,
              currentMonth
            });
            
            payouts.push({
              id: payoutId++,
              investorId: investor.investorId,
              investorName: investor.name,
              seriesName: s.name,
              seriesId: s.id,
              interestMonth: displayMonth,
              interestDate: displayDate,
              amount: Math.round(interestAmount),
              status: payoutStatus,
              bankName: investor.bankName || 'N/A',
              bankAccountNumber: investor.bankAccountNumber || 'N/A',
              ifscCode: investor.ifscCode || 'N/A'
            });
          });
        }
      });
    });
    
    return payouts;
  }, [series, investors, payoutStatusUpdates, metadataUpdateTrigger]); // Include trigger for metadata changes
  
  // Generate export data with both current and upcoming months (for export modal only)
  const generateExportPayoutData = useMemo(() => {
    const payouts = [];
    let payoutId = 1;
    
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const upcomingMonth = nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Helper function to parse date string (DD/MM/YYYY)
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return null;
    };
    
    // Helper function to check if payout is due
    const isPayoutDue = (issueDate, frequency) => {
      const issue = parseDate(issueDate);
      if (!issue) return false;
      
      const today = new Date();
      const daysDiff = Math.floor((today - issue) / (1000 * 60 * 60 * 24));
      
      // Check based on frequency (always monthly)
      // At least 30 days must have passed
      return daysDiff >= 30;
    };
    
    const activeSeries = series.filter(s => s.status === 'active');
    
    activeSeries.forEach(s => {
      // Check if this series has any due payouts
      if (!isPayoutDue(s.issueDate, s.interestFrequency)) {
        // Skip this series - no payout due yet
        return;
      }
      
      const seriesInvestors = investors.filter(inv => inv.series && inv.series.includes(s.name));
      
      seriesInvestors.forEach(investor => {
        const investmentPerSeries = investor.investment / investor.series.length;
        
        let interestAmount = 0;
        // Always monthly interest calculation
        interestAmount = (investmentPerSeries * s.interestRate) / 100 / 12;
        
        // Create unique keys for payouts
        const currentPayoutKey = `${investor.investorId}-${s.name}-${currentMonth}`;
        const upcomingPayoutKey = `${investor.investorId}-${s.name}-${upcomingMonth}`;
        
        // Check for status updates
        const currentPayoutStatus = payoutStatusUpdates[currentPayoutKey] || 'Paid';
        const upcomingPayoutStatus = payoutStatusUpdates[upcomingPayoutKey] || 'Scheduled';
        
        // Current month payout
        payouts.push({
          id: payoutId++,
          investorId: investor.investorId,
          investorName: investor.name,
          seriesName: s.name,
          seriesId: s.id,
          interestMonth: currentMonth,
          interestDate: `15-${currentDate.toLocaleString('default', { month: 'short' })}-${currentDate.getFullYear()}`,
          amount: Math.round(interestAmount),
          status: currentPayoutStatus,
          bankAccountNumber: investor.bankAccountNumber || 'N/A',
          ifscCode: investor.ifscCode || 'N/A',
          bankName: investor.bankName || 'N/A'
        });
        
        // Upcoming month payout
        payouts.push({
          id: payoutId++,
          investorId: investor.investorId,
          investorName: investor.name,
          seriesName: s.name,
          seriesId: s.id,
          interestMonth: upcomingMonth,
          interestDate: `15-${nextMonth.toLocaleString('default', { month: 'short' })}-${nextMonth.getFullYear()}`,
          amount: Math.round(interestAmount),
          status: upcomingPayoutStatus,
          bankAccountNumber: investor.bankAccountNumber || 'N/A',
          ifscCode: investor.ifscCode || 'N/A',
          bankName: investor.bankName || 'N/A'
        });
      });
    });
    
    return payouts;
  }, [series, investors, payoutStatusUpdates]);

  // Calculate summary statistics (current month only) - wrapped in useMemo to ensure updates
  const summaryStats = useMemo(() => {
    const totalInterestPaid = payoutData
      .filter(payout => payout.status === 'Paid')
      .reduce((sum, payout) => sum + payout.amount, 0);

    const totalPayouts = payoutData.length;
    
    const totalInvestorsCount = new Set(payoutData.map(p => p.investorId)).size;

    return {
      totalInterestPaid,
      totalPayouts,
      totalInvestorsCount
    };
  }, [payoutData, metadataUpdateTrigger]); // Include metadataUpdateTrigger to ensure updates after import

  const filteredPayouts = useMemo(() => {
    return payoutData.filter(payout => {
      const matchesSearch = 
        payout.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.investorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.seriesName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Series filter
      const matchesSeriesFilter = filterSeries === 'all' || payout.seriesName === filterSeries;
      
      return matchesSearch && matchesSeriesFilter;
    });
  }, [payoutData, searchTerm, filterSeries]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'completed';
      case 'Pending':
        return 'pending';
      case 'Scheduled':
        return 'scheduled';
      default:
        return '';
    }
  };

  const handleSeriesClick = (seriesId) => {
    navigate(`/ncd-series/${seriesId}`);
  };

  const handleViewInvestor = (investorName) => {
    // Find the investor by name from the DataContext
    const investor = investors.find(inv => inv.name === investorName);
    if (investor) {
      navigate(`/investors/${investor.id}`);
    }
  };

  const handleExport = () => {
    const headers = ['Investor ID', 'Investor Name', 'Series Name', 'Interest Month', 'Interest Date', 'Amount', 'Status', 'Bank Name', 'Account Number', 'IFSC Code'];
    const rows = filteredPayouts.map(payout => [
      payout.investorId,
      payout.investorName,
      payout.seriesName,
      payout.interestMonth,
      payout.interestDate,
      `₹${payout.amount.toLocaleString('en-IN')}`,
      payout.status,
      payout.bankName,
      payout.bankAccountNumber,
      payout.ifscCode
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = 'interest-payouts.csv';
    a.download = fileName;
    a.click();
    
    // Add audit log for document download
    addAuditLog({
      action: 'Downloaded Report',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `Downloaded Interest Payouts List (${filteredPayouts.length} payouts, CSV format)`,
      entityType: 'Payout',
      entityId: 'All Payouts',
      changes: {
        documentType: 'Interest Payouts List',
        fileName: fileName,
        format: 'CSV',
        recordCount: filteredPayouts.length
      }
    });
  };

  // Get export data based on selected series and tab
  const getExportData = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const upcomingMonth = nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    let filteredData = generateExportPayoutData;
    
    // Filter by series
    if (selectedExportSeries !== 'all') {
      filteredData = filteredData.filter(p => p.seriesName === selectedExportSeries);
    }
    
    // Filter by month
    if (exportTab === 'current') {
      filteredData = filteredData.filter(p => p.interestMonth === currentMonth);
    } else {
      filteredData = filteredData.filter(p => p.interestMonth === upcomingMonth);
    }
    
    return filteredData;
  };

  // Calculate export summary
  const getExportSummary = () => {
    const data = getExportData();
    const totalAmount = data.reduce((sum, p) => sum + p.amount, 0);
    const investorCount = new Set(data.map(p => p.investorId)).size;
    const avgPerInvestor = investorCount > 0 ? totalAmount / investorCount : 0;
    
    return {
      totalAmount,
      investorCount,
      avgPerInvestor,
      payoutCount: data.length
    };
  };

  // Get unique series names from payout data for export dropdown
  const getUniqueSeriesFromPayouts = () => {
    const uniqueSeries = new Set();
    generateExportPayoutData.forEach(payout => {
      if (payout.seriesName) {
        uniqueSeries.add(payout.seriesName);
      }
    });
    return Array.from(uniqueSeries).sort();
  };

  // Download export data as CSV
  const handleDownloadExport = () => {
    const data = getExportData();
    const summary = getExportSummary();
    
    const headers = ['Investor ID', 'Investor Name', 'Series', 'Month', 'Date', 'Amount', 'Status', 'Bank Account', 'IFSC Code', 'Bank Name'];
    const rows = data.map(p => [
      p.investorId,
      p.investorName,
      p.seriesName,
      p.interestMonth,
      p.interestDate,
      p.amount,
      p.status,
      p.bankAccountNumber,
      p.ifscCode,
      p.bankName
    ]);
    
    // Add summary rows
    rows.push([]);
    rows.push(['Summary']);
    rows.push(['Total Amount', summary.totalAmount]);
    rows.push(['Total Investors', summary.investorCount]);
    rows.push(['Average per Investor', summary.avgPerInvestor.toFixed(2)]);
    rows.push(['Total Payouts', summary.payoutCount]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `interest-payout-${selectedExportSeries}-${exportTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.download = fileName;
    a.click();
    
    // Add audit log for document download
    addAuditLog({
      action: 'Downloaded Report',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `Downloaded Interest Payout Export for ${selectedExportSeries === 'all' ? 'All Series' : selectedExportSeries} - ${exportTab === 'current' ? 'Current Month' : 'Upcoming Month'} (${data.length} payouts, CSV format)`,
      entityType: 'Payout',
      entityId: selectedExportSeries,
      changes: {
        documentType: 'Interest Payout Export',
        fileName: fileName,
        format: 'CSV',
        series: selectedExportSeries,
        month: exportTab,
        recordCount: data.length,
        totalAmount: summary.totalAmount
      }
    });
    
    setShowExportModal(false);
  };

  // Download sample Excel template
  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Investor ID': 'ABCDE1234F',
        'Series Name': 'Series A',
        'Status': 'Paid',
        'Interest Month': 'Feb-26',
        'Interest Date': '15-Feb-2026'
      },
      {
        'Investor ID': 'ABCDE1234F',
        'Series Name': 'Series B',
        'Status': 'Pending',
        'Interest Month': 'Jan-26',
        'Interest Date': '15-Jan-2026'
      },
      {
        'Investor ID': 'FGHIJ5678K',
        'Series Name': 'Series A',
        'Status': 'Scheduled',
        'Interest Month': 'Mar-26',
        'Interest Date': '15-Mar-2026'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 15 }, // Investor ID
      { wch: 15 }, // Series Name
      { wch: 12 }, // Status
      { wch: 18 }, // Interest Month
      { wch: 15 }  // Interest Date
    ];
    
    // Format the Interest Month and Interest Date columns as text to prevent Excel date conversion
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      // Interest Month column (D)
      const monthCell = XLSX.utils.encode_cell({ r: row, c: 3 });
      if (ws[monthCell]) {
        ws[monthCell].t = 's'; // Set as string
      }
      
      // Interest Date column (E)
      const dateCell = XLSX.utils.encode_cell({ r: row, c: 4 });
      if (ws[dateCell]) {
        ws[dateCell].t = 's'; // Set as string
      }
    }
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Interest Payout');
    
    const fileName = `Interest_Payout_Sample_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    // Add audit log
    addAuditLog({
      action: 'Downloaded Report',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `Downloaded Interest Payout Sample Template with Status, Interest Month, and Interest Date columns (Excel format)`,
      entityType: 'Payout',
      entityId: 'Sample Template',
      changes: {
        documentType: 'Interest Payout Sample',
        fileName: fileName,
        format: 'Excel',
        columnsIncluded: ['Investor ID', 'Series Name', 'Status', 'Interest Month', 'Interest Date'],
        note: 'Date columns formatted as text to prevent Excel auto-conversion'
      }
    });
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      setImportStatus('');
    }
  };

  // Process uploaded Excel file
  const handleImportSubmit = () => {
    if (!uploadedFile) {
      setImportStatus('error:Please select a file to upload');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        console.log('Processing file:', uploadedFile.name);
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.log('Workbook sheets:', workbook.SheetNames);
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          setImportStatus('error:No sheets found in the Excel file');
          return;
        }
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
          setImportStatus('error:Could not read the worksheet');
          return;
        }
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log('Parsed data:', jsonData);

        if (jsonData.length === 0) {
          setImportStatus('error:The uploaded file is empty or has no data rows');
          return;
        }

        // Validate required columns - need Investor ID, Series Name, and Status
        // Optional columns: Interest Month, Interest Date
        const requiredColumns = ['Investor ID', 'Series Name', 'Status'];
        const optionalColumns = ['Interest Month', 'Interest Date'];
        const firstRow = jsonData[0];
        
        console.log('First row columns:', Object.keys(firstRow));
        console.log('Required columns:', requiredColumns);
        
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
          setImportStatus(`error:Missing required columns: ${missingColumns.join(', ')}. Found columns: ${Object.keys(firstRow).join(', ')}`);
          return;
        }

        // Process the data and update statuses for specific series only
        let updatedCount = 0;
        let notFoundCount = 0;
        let totalPayoutsUpdated = 0;
        const newStatusUpdates = { ...payoutStatusUpdates };
        const errors = [];

        jsonData.forEach((row, index) => {
          try {
            const investorId = row['Investor ID'];
            const seriesName = row['Series Name'];
            const status = row['Status'];
            let interestMonth = row['Interest Month']; // Optional
            let interestDate = row['Interest Date']; // Optional
            
            console.log(`Raw data for row ${index + 1}:`, { 
              investorId, 
              seriesName, 
              status, 
              interestMonth: interestMonth, 
              interestMonthType: typeof interestMonth,
              interestDate: interestDate,
              interestDateType: typeof interestDate
            });
            
            // Convert Excel date serial numbers to proper dates - Fixed Excel date conversion
            if (interestMonth !== undefined && interestMonth !== null && interestMonth !== '') {
              if (typeof interestMonth === 'number' && interestMonth > 1000) {
                // Excel serial date conversion: Excel epoch is January 1, 1900
                // But Excel incorrectly treats 1900 as a leap year, so we need to account for that
                const excelEpoch = new Date(1899, 11, 30); // December 30, 1899 (Excel's actual epoch)
                const jsDate = new Date(excelEpoch.getTime() + interestMonth * 24 * 60 * 60 * 1000);
                interestMonth = jsDate.toLocaleString('default', { month: 'short', year: '2-digit' });
              } else {
                interestMonth = String(interestMonth).trim();
              }
            }
            
            if (interestDate !== undefined && interestDate !== null && interestDate !== '') {
              if (typeof interestDate === 'number' && interestDate > 1000) {
                // Excel serial date conversion
                const excelEpoch = new Date(1899, 11, 30); // December 30, 1899 (Excel's actual epoch)
                const jsDate = new Date(excelEpoch.getTime() + interestDate * 24 * 60 * 60 * 1000);
                const day = jsDate.getDate().toString().padStart(2, '0');
                const month = jsDate.toLocaleString('default', { month: 'short' });
                const year = jsDate.getFullYear();
                interestDate = `${day}-${month}-${year}`;
              } else {
                interestDate = String(interestDate).trim();
              }
            }
            
            console.log(`Final processed data for row ${index + 1}:`, { investorId, seriesName, status, interestMonth, interestDate });
            
            if (!investorId || !seriesName || !status) {
              errors.push(`Row ${index + 2}: Missing required data (Investor ID: ${investorId}, Series: ${seriesName}, Status: ${status})`);
              notFoundCount++;
              return;
            }
            
            // Find investor in the system
            const investor = investors.find(inv => inv.investorId === investorId);
            
            if (!investor) {
              errors.push(`Row ${index + 2}: Investor ID "${investorId}" not found in system`);
              notFoundCount++;
              return;
            }
            
            // Check if investor is actually invested in this series
            if (!investor.series || !investor.series.includes(seriesName)) {
              errors.push(`Row ${index + 2}: Investor "${investorId}" is not invested in series "${seriesName}"`);
              notFoundCount++;
              return;
            }
            
            // Determine which month to use for the payout key
            let payoutMonth;
            if (interestMonth && interestMonth.toString().trim()) {
              // Use the provided Interest Month from the file
              payoutMonth = interestMonth.toString().trim();
            } else {
              // Fall back to current month if not provided
              const currentDate = new Date();
              payoutMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
            }
            
            console.log(`Using payout month: ${payoutMonth} for investor ${investorId}, series ${seriesName}`);
            
            // Create unique key for this specific series payout
            const payoutKey = `${investorId}-${seriesName}-${payoutMonth}`;
            console.log(`Created payout key: ${payoutKey}`);
            
            // Update the status for this specific payout
            newStatusUpdates[payoutKey] = status;
            
            // Add transaction to investor's history when status is 'Paid'
            if (status === 'Paid') {
              // Calculate the interest amount for this payout
              const seriesData = series.find(s => s.name === seriesName);
              if (seriesData && investor.investments) {
                const investment = investor.investments.find(inv => inv.seriesName === seriesName);
                if (investment) {
                  // Calculate monthly interest (assuming annual rate)
                  const monthlyInterestRate = seriesData.interestRate / 100 / 12;
                  const interestAmount = Math.round(investment.amount * monthlyInterestRate);
                  
                  // Add transaction to investor's history
                  addInterestPayoutTransaction(
                    investorId,
                    seriesName,
                    interestAmount,
                    interestDate || new Date().toLocaleDateString('en-GB'),
                    interestMonth || payoutMonth
                  );
                  
                  console.log(`Added interest transaction: ${investorId}, ${seriesName}, ₹${interestAmount}`);
                }
              }
            }
            
            // Store additional payout metadata for custom month/date
            if (interestMonth || interestDate) {
              const metadataKey = `${payoutKey}_metadata`;
              const existingMetadata = JSON.parse(localStorage.getItem('payoutMetadata') || '{}');
              
              const newMetadata = {
                customMonth: interestMonth ? interestMonth.toString().trim() : payoutMonth,
                customDate: interestDate ? interestDate.toString().trim() : null,
                updatedAt: new Date().toISOString()
              };
              
              existingMetadata[metadataKey] = newMetadata;
              
              console.log(`Storing metadata for ${metadataKey}:`, newMetadata);
              localStorage.setItem('payoutMetadata', JSON.stringify(existingMetadata));
              
              // Verify it was saved
              const savedMetadata = JSON.parse(localStorage.getItem('payoutMetadata') || '{}');
              console.log(`Verified saved metadata for ${metadataKey}:`, savedMetadata[metadataKey]);
            }
            
            totalPayoutsUpdated++;
            updatedCount++;
            
          } catch (rowError) {
            console.error(`Error processing row ${index + 1}:`, rowError);
            errors.push(`Row ${index + 2}: ${rowError.message}`);
            notFoundCount++;
          }
        });

        console.log('Processing complete:', { updatedCount, notFoundCount, errors });

        // Save the updated statuses
        setPayoutStatusUpdates(newStatusUpdates);
        
        // Force immediate localStorage update
        localStorage.setItem('payoutStatusUpdates', JSON.stringify(newStatusUpdates));

        // Trigger re-render for metadata changes
        setMetadataUpdateTrigger(prev => prev + 1);

        // Show success message
        if (updatedCount > 0) {
          let message = `Successfully updated ${updatedCount} payout(s) including status, interest month, and interest date where provided.`;
          if (notFoundCount > 0) {
            message += ` ${notFoundCount} record(s) had issues.`;
          }
          if (errors.length > 0 && errors.length <= 3) {
            message += ` Issues: ${errors.slice(0, 3).join('; ')}`;
          }
          
          setImportStatus(`success:${message}`);
          
          // Add audit log
          addAuditLog({
            action: 'Imported Data',
            adminName: user ? user.name : 'Admin',
            adminRole: user ? user.displayRole : 'Admin',
            details: `Imported Interest Payout data: ${updatedCount} payouts updated (status, month, date), ${notFoundCount} not found/invalid`,
            entityType: 'Payout',
            entityId: 'Bulk Import',
            changes: {
              documentType: 'Interest Payout Import',
              fileName: uploadedFile.name,
              format: 'Excel',
              payoutsUpdated: updatedCount,
              recordsNotFound: notFoundCount,
              totalRecords: jsonData.length,
              updatedKeys: Object.keys(newStatusUpdates).filter(key => newStatusUpdates[key] !== payoutStatusUpdates[key]),
              fieldsUpdated: ['Status', 'Interest Month', 'Interest Date'],
              errors: errors.slice(0, 5) // Log first 5 errors
            }
          });

          // Reset after 5 seconds to give time to read the message
          setTimeout(() => {
            setShowImportModal(false);
            setUploadedFile(null);
            setImportStatus('');
          }, 5000);
        } else {
          let errorMessage = 'No valid records found to process.';
          if (errors.length > 0) {
            errorMessage += ` Issues found: ${errors.slice(0, 3).join('; ')}`;
          }
          setImportStatus(`error:${errorMessage}`);
        }

      } catch (error) {
        console.error('Error processing file:', error);
        setImportStatus(`error:Error processing file: ${error.message}. Please check the file format and try again.`);
      }
    };

    reader.onerror = (error) => {
      console.error('File reader error:', error);
      setImportStatus('error:Error reading file. Please try again.');
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  return (
    <Layout>
      <div className="interest-payout-container">
        <div className="interest-payout-header">
          <div className="header-content">
            <h1 className="page-title">Interest Payout Management</h1>
          </div>
          <div className="header-buttons">
            <button className="import-payout-button" onClick={() => setShowImportModal(true)}>
              <FiUpload size={20} /> Import Interest Payout
            </button>
            <button className="export-payout-button" onClick={() => setShowExportModal(true)}>
              <MdOutlineFileDownload size={20} /> Interest Payout Export
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="payout-summary-cards">
          <div className="summary-card green">
            <div className="card-content">
              <p className="card-label">Current Month Total Payout</p>
              <div className="card-value-row">
                <h2 className="card-value">₹{summaryStats.totalInterestPaid.toLocaleString('en-IN')}</h2>
                <FaRupeeSign className="card-icon-green" />
              </div>
            </div>
          </div>
          
          <div className="summary-card orange">
            <div className="card-content">
              <p className="card-label">Total Payouts This Month</p>
              <div className="card-value-row">
                <h2 className="card-value">{summaryStats.totalPayouts}</h2>
                <MdTrendingUp className="card-icon-orange" />
              </div>
            </div>
          </div>
          
          <div className="summary-card blue">
            <div className="card-content">
              <p className="card-label">Total Investors</p>
              <div className="card-value-row">
                <h2 className="card-value">{summaryStats.totalInvestorsCount}</h2>
                <HiUsers className="card-icon-blue" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="payout-controls">
          <div className="search-filter-section">
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by investor name, ID, or series..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-container">
              <FiFilter className="filter-icon" />
              <select
                value={filterSeries}
                onChange={(e) => setFilterSeries(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Series</option>
                <option value="Series A">Series A</option>
                <option value="Series B">Series B</option>
                <option value="Series C">Series C</option>
              </select>
            </div>
            
            <button className="export-button" onClick={handleExport}>
              <MdOutlineFileDownload size={16} />
              Export Data
            </button>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="payouts-table-container">
          <table className="payouts-table">
            <thead>
              <tr>
                <th>Investor Name</th>
                <th>Series Name</th>
                <th>Interest Month</th>
                <th>Interest Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Bank Name</th>
                <th>IFSC Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map((payout) => (
                <tr key={payout.id}>
                  <td>
                    <div className="investor-info">
                      <div className="investor-name">{payout.investorName}</div>
                      <div className="investor-id">{payout.investorId}</div>
                    </div>
                  </td>
                  <td>
                    <button 
                      className="series-link"
                      onClick={() => handleSeriesClick(payout.seriesId)}
                    >
                      {payout.seriesName}
                    </button>
                  </td>
                  <td>{payout.interestMonth}</td>
                  <td>{payout.interestDate}</td>
                  <td>
                    <span className="amount">₹{payout.amount.toLocaleString('en-IN')}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusColor(payout.status)}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td>
                    <div className="bank-info">
                      <div className="bank-name">{payout.bankName}</div>
                      <div className="account-number">{payout.bankAccountNumber}</div>
                    </div>
                  </td>
                  <td>
                    <span className="ifsc-code">{payout.ifscCode}</span>
                  </td>
                  <td>
                    <button 
                      className="view-button"
                      onClick={() => handleViewInvestor(payout.investorName)}
                    >
                      <FaEye size={12} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile-friendly card layout */}
          <div className="mobile-payouts-list">
            {filteredPayouts.map((payout) => (
              <div key={payout.id} className="mobile-payout-card">
                <div className="mobile-payout-header">
                  <div className="mobile-payout-info">
                    <h4>{payout.investorName}</h4>
                    <span className="investor-id">{payout.investorId}</span>
                  </div>
                  <span className={`status-badge ${getStatusColor(payout.status)}`}>
                    {payout.status}
                  </span>
                </div>
                
                <div className="mobile-payout-details">
                  <div className="mobile-payout-item">
                    <span className="mobile-payout-label">Series</span>
                    <button 
                      className="mobile-series-button"
                      onClick={() => handleSeriesClick(payout.seriesId)}
                    >
                      {payout.seriesName}
                    </button>
                  </div>
                  
                  <div className="mobile-payout-item">
                    <span className="mobile-payout-label">Amount</span>
                    <span className="mobile-payout-value mobile-amount">
                      ₹{payout.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div className="mobile-payout-item">
                    <span className="mobile-payout-label">Interest Month</span>
                    <span className="mobile-payout-value">{payout.interestMonth}</span>
                  </div>
                  
                  <div className="mobile-payout-item">
                    <span className="mobile-payout-label">Interest Date</span>
                    <span className="mobile-payout-value">{payout.interestDate}</span>
                  </div>
                  
                  <div className="mobile-payout-item">
                    <span className="mobile-payout-label">Bank Name</span>
                    <span className="mobile-payout-value">{payout.bankName}</span>
                  </div>
                  
                  <div className="mobile-payout-item">
                    <span className="mobile-payout-label">Account Number</span>
                    <span className="mobile-payout-value">{payout.bankAccountNumber}</span>
                  </div>
                  
                  <div className="mobile-payout-item">
                    <span className="mobile-payout-label">IFSC Code</span>
                    <span className="mobile-payout-value">{payout.ifscCode}</span>
                  </div>
                </div>
                
                <div className="mobile-payout-footer">
                  <span className="mobile-payout-date">Status: {payout.status}</span>
                  <button
                    className="mobile-payout-view-button"
                    onClick={() => handleViewInvestor(payout.investorName)}
                  >
                    <FaEye size={12} /> View
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* No Results Message */}
          {filteredPayouts.length === 0 && (
            <div className="no-results">
              <MdPayment size={48} />
              <h3>No payouts found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
            <div className="export-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="export-modal-header">
                <h2>Interest Payout Export</h2>
                <button className="close-button" onClick={() => setShowExportModal(false)}>×</button>
              </div>
              
              <div className="export-modal-body">
                {/* Series Selection Dropdown */}
                <div className="export-series-selector">
                  <label>Select Series:</label>
                  <select 
                    value={selectedExportSeries} 
                    onChange={(e) => setSelectedExportSeries(e.target.value)}
                    className="series-dropdown"
                  >
                    <option value="all">All Series</option>
                    {getUniqueSeriesFromPayouts().map(seriesName => (
                      <option key={seriesName} value={seriesName}>{seriesName}</option>
                    ))}
                  </select>
                </div>

                {/* Tab Buttons */}
                <div className="export-tabs">
                  <button 
                    className={`export-tab ${exportTab === 'current' ? 'active' : ''}`}
                    onClick={() => setExportTab('current')}
                  >
                    Current Month
                  </button>
                  <button 
                    className={`export-tab ${exportTab === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setExportTab('upcoming')}
                  >
                    Upcoming Month
                  </button>
                </div>

                {/* Export Summary */}
                <div className="export-summary">
                  <h3>{exportTab === 'current' ? 'Current Month' : 'Upcoming Month'} Summary</h3>
                  <div className="export-summary-grid">
                    <div className="export-summary-item">
                      <span className="summary-label">Total Amount:</span>
                      <span className="summary-value">₹{getExportSummary().totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="export-summary-item">
                      <span className="summary-label">Total Investors:</span>
                      <span className="summary-value">{getExportSummary().investorCount}</span>
                    </div>
                    <div className="export-summary-item">
                      <span className="summary-label">Avg per Investor:</span>
                      <span className="summary-value">₹{getExportSummary().avgPerInvestor.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
                    </div>
                    <div className="export-summary-item">
                      <span className="summary-label">Total Payouts:</span>
                      <span className="summary-value">{getExportSummary().payoutCount}</span>
                    </div>
                  </div>
                </div>

                {/* Payout Details Table */}
                <div className="export-table-container">
                  <h3>Payout Details</h3>
                  <table className="export-table">
                    <thead>
                      <tr>
                        <th>Investor</th>
                        <th>Series</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Bank Account</th>
                        <th>IFSC Code</th>
                        <th>Bank Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getExportData().map((payout) => (
                        <tr key={payout.id}>
                          <td>
                            <div className="investor-cell">
                              <div className="investor-name">{payout.investorName}</div>
                              <div className="investor-id">{payout.investorId}</div>
                            </div>
                          </td>
                          <td>{payout.seriesName}</td>
                          <td>{payout.interestDate}</td>
                          <td className="amount-cell">₹{payout.amount.toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`status-badge ${payout.status === 'Paid' ? 'paid' : payout.status === 'Pending' ? 'pending' : 'scheduled'}`}>
                              {payout.status}
                            </span>
                          </td>
                          <td>{payout.bankAccountNumber}</td>
                          <td>{payout.ifscCode}</td>
                          <td>{payout.bankName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {getExportData().length === 0 && (
                    <div className="no-export-data">
                      <p>No payout data available for the selected criteria</p>
                    </div>
                  )}
                </div>

                {/* Download Button */}
                <div className="export-actions">
                  <button className="download-export-button" onClick={handleDownloadExport}>
                    <MdOutlineFileDownload size={20} />
                    Download Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
            <div className="import-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="import-modal-header">
                <h2>Import Interest Payout</h2>
                <button className="close-button" onClick={() => setShowImportModal(false)}>×</button>
              </div>
              
              <div className="import-modal-body">
                <div className="import-actions">
                  <div className="button-group">
                    <button className="download-sample-button" onClick={handleDownloadSample}>
                      <MdOutlineFileDownload size={20} />
                      Download Sample
                    </button>

                    <button className="upload-file-button" onClick={() => document.getElementById('payout-file-upload').click()}>
                      <FiUpload size={20} />
                      Upload File
                    </button>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      id="payout-file-upload"
                      style={{ display: 'none' }}
                    />
                  </div>

                  {uploadedFile && (
                    <div className="uploaded-file-info">
                      <span className="file-name">📄 {uploadedFile.name}</span>
                    </div>
                  )}

                  {importStatus && (
                    <div className={`import-status ${importStatus.startsWith('success') ? 'success' : 'error'}`}>
                      {importStatus.split(':')[1]}
                    </div>
                  )}

                  <button 
                    className="submit-import-button" 
                    onClick={handleImportSubmit}
                    disabled={!uploadedFile}
                  >
                    <FiUpload size={18} />
                    Process Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default InterestPayout;