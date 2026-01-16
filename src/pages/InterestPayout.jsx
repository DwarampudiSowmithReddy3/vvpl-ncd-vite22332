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
  const { series, investors, addAuditLog } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeries, setFilterSeries] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportSeries, setSelectedExportSeries] = useState('all');
  const [exportTab, setExportTab] = useState('current'); // 'current' or 'upcoming'
  const [showImportModal, setShowImportModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const dropdownRef = useRef(null);
  
  // Store payout status updates (key: investorId-seriesName-month, value: status)
  const [payoutStatusUpdates, setPayoutStatusUpdates] = useState(() => {
    const saved = localStorage.getItem('payoutStatusUpdates');
    return saved ? JSON.parse(saved) : {};
  });

  // Save payout status updates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('payoutStatusUpdates', JSON.stringify(payoutStatusUpdates));
  }, [payoutStatusUpdates]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
        setShowStatusDropdown(false);
        setShowSeriesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate payout data based on actual series and investors from DataContext
  const payoutData = useMemo(() => {
    const payouts = [];
    let payoutId = 1;
    
    // Get current and next month
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
      
      // Check based on frequency
      if (frequency === 'Monthly Interest') {
        // At least 30 days must have passed
        return daysDiff >= 30;
      } else if (frequency === 'Quarterly Interest') {
        // At least 90 days must have passed
        return daysDiff >= 90;
      } else {
        // Annual - at least 365 days
        return daysDiff >= 365;
      }
    };
    
    // Only generate payouts for active series
    const activeSeries = series.filter(s => s.status === 'active');
    
    activeSeries.forEach(s => {
      // Check if this series has any due payouts
      if (!isPayoutDue(s.issueDate, s.interestFrequency)) {
        // Skip this series - no payout due yet
        return;
      }
      
      // Get investors for this series
      const seriesInvestors = investors.filter(inv => inv.series && inv.series.includes(s.name));
      
      seriesInvestors.forEach(investor => {
        // Calculate investment amount for this series
        const investmentPerSeries = investor.investment / investor.series.length;
        
        // Calculate interest based on frequency
        let interestAmount = 0;
        if (s.interestFrequency === 'Monthly Interest') {
          interestAmount = (investmentPerSeries * s.interestRate) / 100 / 12;
        } else if (s.interestFrequency === 'Quarterly Interest') {
          interestAmount = (investmentPerSeries * s.interestRate) / 100 / 4;
        } else {
          interestAmount = (investmentPerSeries * s.interestRate) / 100;
        }
        
        // Create unique key for this payout
        const payoutKey = `${investor.investorId}-${s.name}-${currentMonth}`;
        
        // Check if there's a status update for this payout, otherwise default to 'Paid'
        const payoutStatus = payoutStatusUpdates[payoutKey] || 'Paid';
        
        // Current month payout only (for main table display)
        payouts.push({
          id: payoutId++,
          investorId: investor.investorId,
          investorName: investor.name,
          seriesName: s.name,
          seriesId: s.id,
          interestMonth: currentMonth,
          interestDate: `15-${currentDate.toLocaleString('default', { month: 'short' })}-${currentDate.getFullYear()}`,
          amount: Math.round(interestAmount),
          status: payoutStatus
        });
      });
    });
    
    return payouts;
  }, [series, investors, payoutStatusUpdates]);
  
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
      
      // Check based on frequency
      if (frequency === 'Monthly Interest') {
        // At least 30 days must have passed
        return daysDiff >= 30;
      } else if (frequency === 'Quarterly Interest') {
        // At least 90 days must have passed
        return daysDiff >= 90;
      } else {
        // Annual - at least 365 days
        return daysDiff >= 365;
      }
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
        if (s.interestFrequency === 'Monthly Interest') {
          interestAmount = (investmentPerSeries * s.interestRate) / 100 / 12;
        } else if (s.interestFrequency === 'Quarterly Interest') {
          interestAmount = (investmentPerSeries * s.interestRate) / 100 / 4;
        } else {
          interestAmount = (investmentPerSeries * s.interestRate) / 100;
        }
        
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

  // Calculate summary statistics (current month only)
  const totalInterestPaid = payoutData
    .filter(payout => payout.status === 'Paid')
    .reduce((sum, payout) => sum + payout.amount, 0);

  const totalPayouts = payoutData.length;
  
  const totalInvestorsCount = new Set(payoutData.map(p => p.investorId)).size;

  const filteredPayouts = useMemo(() => {
    return payoutData.filter(payout => {
      const matchesSearch = 
        payout.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.investorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.seriesName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatusFilter = selectedStatusFilter === 'all' || payout.status === selectedStatusFilter;
      
      // Series filter (using both old filterSeries and new selectedSeriesFilter)
      const matchesSeriesFilter = (filterSeries === 'all' || payout.seriesName === filterSeries) &&
                                 (selectedSeriesFilter === 'all' || payout.seriesName === selectedSeriesFilter);
      
      return matchesSearch && matchesStatusFilter && matchesSeriesFilter;
    });
  }, [payoutData, searchTerm, filterSeries, selectedStatusFilter, selectedSeriesFilter]);

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
    const headers = ['Investor ID', 'Investor Name', 'Series Name', 'Interest Month', 'Interest Date', 'Amount', 'Status'];
    const rows = filteredPayouts.map(payout => [
      payout.investorId,
      payout.investorName,
      payout.seriesName,
      payout.interestMonth,
      payout.interestDate,
      `₹${payout.amount.toLocaleString('en-IN')}`,
      payout.status
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

  // Filter handlers
  const handleFilterToggle = () => {
    setShowFilterDropdown(!showFilterDropdown);
    setShowStatusDropdown(false);
    setShowSeriesDropdown(false);
  };

  const handleStatusFilterToggle = () => {
    setShowStatusDropdown(!showStatusDropdown);
    setShowSeriesDropdown(false);
  };

  const handleSeriesFilterToggle = () => {
    setShowSeriesDropdown(!showSeriesDropdown);
    setShowStatusDropdown(false);
  };

  const handleStatusFilterSelect = (status) => {
    setSelectedStatusFilter(status);
    setShowStatusDropdown(false);
    setShowFilterDropdown(false);
  };

  const handleSeriesFilterSelect = (seriesName) => {
    setSelectedSeriesFilter(seriesName);
    setShowSeriesDropdown(false);
    setShowFilterDropdown(false);
  };

  const clearAdvancedFilters = () => {
    setSelectedStatusFilter('all');
    setSelectedSeriesFilter('all');
    setShowFilterDropdown(false);
    setShowStatusDropdown(false);
    setShowSeriesDropdown(false);
  };

  // Get unique series names from actual series data
  const getUniqueSeriesFromPayouts = () => {
    // Get all approved series (active and upcoming)
    const approvedSeries = series.filter(s => s.status === 'active' || s.status === 'upcoming');
    return approvedSeries.map(s => s.name);
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

  // Download export data as CSV
  const handleDownloadExport = () => {
    const data = getExportData();
    const summary = getExportSummary();
    
    const headers = ['Investor ID', 'Investor Name', 'Series', 'Month', 'Date', 'Amount', 'Bank Account', 'IFSC Code', 'Bank Name'];
    const rows = data.map(p => [
      p.investorId,
      p.investorName,
      p.seriesName,
      p.interestMonth,
      p.interestDate,
      p.amount,
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
        'Investor Name': 'Sample Investor',
        'Series Name': 'Series A',
        'Interest Month': 'January 2026',
        'Interest Date': '15-Jan-2026',
        'Amount': '10000',
        'Status': 'Paid',
        'Bank Account': '1234567890123456',
        'IFSC Code': 'SBIN0001234',
        'Bank Name': 'State Bank of India'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Interest Payout');
    
    const fileName = `Interest_Payout_Sample_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    // Add audit log
    addAuditLog({
      action: 'Downloaded Report',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `Downloaded Interest Payout Sample Template (Excel format)`,
      entityType: 'Payout',
      entityId: 'Sample Template',
      changes: {
        documentType: 'Interest Payout Sample',
        fileName: fileName,
        format: 'Excel'
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
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setImportStatus('error:The uploaded file is empty');
          return;
        }

        // Validate required columns
        const requiredColumns = ['Investor ID', 'Series Name', 'Interest Month', 'Status'];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
          setImportStatus(`error:Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }

        // Process the data and update statuses
        let updatedCount = 0;
        let notFoundCount = 0;
        const newStatusUpdates = { ...payoutStatusUpdates };

        jsonData.forEach(row => {
          const investorId = row['Investor ID'];
          const status = row['Status'];
          const seriesName = row['Series Name'];
          const interestMonth = row['Interest Month'];
          
          if (investorId && status) {
            // Find investor in the system
            const investor = investors.find(inv => inv.investorId === investorId);
            
            if (investor) {
              // Create unique key for this payout
              const payoutKey = `${investorId}-${seriesName}-${interestMonth}`;
              
              // Update the status
              newStatusUpdates[payoutKey] = status;
              updatedCount++;
            } else {
              notFoundCount++;
            }
          }
        });

        // Save the updated statuses
        setPayoutStatusUpdates(newStatusUpdates);

        // Show success message
        if (updatedCount > 0) {
          setImportStatus(`success:Successfully updated ${updatedCount} payout status(es). ${notFoundCount > 0 ? `${notFoundCount} investor(s) not found.` : ''}`);
          
          // Add audit log
          addAuditLog({
            action: 'Imported Data',
            adminName: user ? user.name : 'Admin',
            adminRole: user ? user.displayRole : 'Admin',
            details: `Imported Interest Payout data: ${updatedCount} records processed, ${notFoundCount} not found`,
            entityType: 'Payout',
            entityId: 'Bulk Import',
            changes: {
              documentType: 'Interest Payout Import',
              fileName: uploadedFile.name,
              format: 'Excel',
              recordsProcessed: updatedCount,
              recordsNotFound: notFoundCount,
              totalRecords: jsonData.length
            }
          });

          // Reset after 3 seconds
          setTimeout(() => {
            setShowImportModal(false);
            setUploadedFile(null);
            setImportStatus('');
          }, 3000);
        } else {
          setImportStatus('error:No valid records found to process');
        }

      } catch (error) {
        console.error('Error processing file:', error);
        setImportStatus('error:Error processing file. Please check the format and try again.');
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  return (
    <Layout>
      <div className="interest-payout-container">
        <div className="interest-payout-header">
          <div className="header-content">
            <h1>Interest Payout Management</h1>
            <p>Track and manage interest payments across all NCD series</p>
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
                <h2 className="card-value">₹{totalInterestPaid.toLocaleString('en-IN')}</h2>
                <FaRupeeSign className="card-icon-green" />
              </div>
            </div>
          </div>
          
          <div className="summary-card orange">
            <div className="card-content">
              <p className="card-label">Total Payouts This Month</p>
              <div className="card-value-row">
                <h2 className="card-value">{totalPayouts}</h2>
                <MdTrendingUp className="card-icon-orange" />
              </div>
            </div>
          </div>
          
          <div className="summary-card blue">
            <div className="card-content">
              <p className="card-label">Total Investors</p>
              <div className="card-value-row">
                <h2 className="card-value">{totalInvestorsCount}</h2>
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
          </div>

          <div className="action-buttons">
            <div className="filter-dropdown-container" ref={dropdownRef}>
              <button 
                className={`filter-button ${(selectedStatusFilter !== 'all' || selectedSeriesFilter !== 'all') ? 'active' : ''}`}
                onClick={handleFilterToggle}
              >
                <FiFilter size={16} />
                Advanced Filter
                {(selectedStatusFilter !== 'all' || selectedSeriesFilter !== 'all') && (
                  <span className="filter-indicator">•</span>
                )}
              </button>
              
              {showFilterDropdown && (
                <div className="filter-dropdown">
                  <div className="filter-dropdown-header">
                    <span>Filter Options</span>
                    {(selectedStatusFilter !== 'all' || selectedSeriesFilter !== 'all') && (
                      <button className="clear-filters-btn" onClick={clearAdvancedFilters}>
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="filter-option">
                    <button 
                      className="filter-option-btn"
                      onClick={handleStatusFilterToggle}
                    >
                      <span>Status</span>
                      <span className="filter-arrow">▼</span>
                    </button>
                    {showStatusDropdown && (
                      <div className="filter-sub-dropdown">
                        <button 
                          className={`filter-sub-option ${selectedStatusFilter === 'all' ? 'active' : ''}`}
                          onClick={() => handleStatusFilterSelect('all')}
                        >
                          All Status
                        </button>
                        <button 
                          className={`filter-sub-option ${selectedStatusFilter === 'Paid' ? 'active' : ''}`}
                          onClick={() => handleStatusFilterSelect('Paid')}
                        >
                          Paid
                        </button>
                        <button 
                          className={`filter-sub-option ${selectedStatusFilter === 'Pending' ? 'active' : ''}`}
                          onClick={() => handleStatusFilterSelect('Pending')}
                        >
                          Pending
                        </button>
                        <button 
                          className={`filter-sub-option ${selectedStatusFilter === 'Scheduled' ? 'active' : ''}`}
                          onClick={() => handleStatusFilterSelect('Scheduled')}
                        >
                          Scheduled
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="filter-option">
                    <button 
                      className="filter-option-btn"
                      onClick={handleSeriesFilterToggle}
                    >
                      <span>Series</span>
                      <span className="filter-arrow">▼</span>
                    </button>
                    {showSeriesDropdown && (
                      <div className="filter-sub-dropdown">
                        <button 
                          className={`filter-sub-option ${selectedSeriesFilter === 'all' ? 'active' : ''}`}
                          onClick={() => handleSeriesFilterSelect('all')}
                        >
                          All Series
                        </button>
                        {getUniqueSeriesFromPayouts().map(seriesName => (
                          <button 
                            key={seriesName}
                            className={`filter-sub-option ${selectedSeriesFilter === seriesName ? 'active' : ''}`}
                            onClick={() => handleSeriesFilterSelect(seriesName)}
                          >
                            {seriesName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                <th>Investor ID</th>
                <th>Investor Name</th>
                <th>Series Name</th>
                <th>Interest Month</th>
                <th>Interest Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map((payout) => (
                <tr key={payout.id}>
                  <td>
                    <span className="investor-id">{payout.investorId}</span>
                  </td>
                  <td>
                    <div className="investor-info">
                      <span className="investor-name">{payout.investorName}</span>
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