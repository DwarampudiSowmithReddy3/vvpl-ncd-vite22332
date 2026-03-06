import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import auditService from '../services/auditService';
import api from '../services/api';
import Layout from '../components/Layout';
import './InterestPayout.css';
import '../styles/loading.css';
import { MdOutlineFileDownload, MdPayment } from "react-icons/md";
import { FiSearch, FiFilter, FiUpload } from "react-icons/fi";
import { FaEye, FaRupeeSign } from "react-icons/fa";
import { MdTrendingUp } from "react-icons/md";
import { HiUsers } from "react-icons/hi";

const InterestPayout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeries, setFilterSeries] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportSeries, setSelectedExportSeries] = useState('all');
  const [exportTab, setExportTab] = useState('current'); // 'current' or 'upcoming'
  const [showImportModal, setShowImportModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  
  // Backend data states
  const [payoutData, setPayoutData] = useState([]);
  const [exportPayoutData, setExportPayoutData] = useState([]);
  const [exportSummary, setExportSummary] = useState({
    total_amount: 0,
    investor_count: 0,
    avg_per_investor: 0,
    payout_count: 0
  });
  const [summaryStats, setSummaryStats] = useState({
    totalInterestPaid: 0,
    totalPayouts: 0,
    totalInvestorsCount: 0
  });
  const [uniqueSeriesNames, setUniqueSeriesNames] = useState([]);
  const [uniqueSeriesForExport, setUniqueSeriesForExport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch payout data from backend on mount
  useEffect(() => {
    fetchPayoutData();
    fetchSummaryData();
    fetchUniqueSeriesNames();
    fetchUniqueSeriesForExport();
  }, []);

  // Refetch when search or filter changes
  useEffect(() => {
    fetchPayoutData();
  }, [searchTerm, filterSeries]);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Pass search and filter to backend
      const seriesId = filterSeries === 'all' ? null : getSeriesIdByName(filterSeries);
      const search = searchTerm || null;
      
      const response = await api.getAllPayouts(seriesId, null, search);
      setPayoutData(response.payouts || []);
    } catch (err) {
      if (import.meta.env.DEV) { console.error('Error fetching payouts:', err); }
      setError(err.message || 'Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get series ID by name (from cached data)
  const getSeriesIdByName = (seriesName) => {
    if (!seriesName || seriesName === 'all') return null;
    const series = uniqueSeriesForExport.find(s => s.name === seriesName);
    return series ? series.id : null;
  };

  const fetchSummaryData = async () => {
    try {
      const response = await api.getPayoutSummary();
      setSummaryStats({
        totalInterestPaid: response.total_interest_paid || 0,
        totalPayouts: response.total_payouts || 0,
        totalInvestorsCount: response.total_investors || 0
      });
    } catch (err) {
      if (import.meta.env.DEV) { console.error('Error fetching summary:', err); }
    }
  };

  const fetchUniqueSeriesNames = async () => {
    try {
      const response = await api.getUniqueSeriesNames();
      setUniqueSeriesNames(response.series_names || []);
      if (import.meta.env.DEV) { console.log('✅ Unique series names loaded from backend:', response.series_names); }
    } catch (err) {
      if (import.meta.env.DEV) { console.error('Error fetching unique series names:', err); }
    }
  };

  const fetchUniqueSeriesForExport = async () => {
    try {
      const response = await api.getUniqueSeriesForExport();
      setUniqueSeriesForExport(response.series || []);
      if (import.meta.env.DEV) { console.log('✅ Unique series for export loaded from backend:', response.series); }
    } catch (err) {
      if (import.meta.env.DEV) { console.error('Error fetching unique series for export:', err); }
    }
  };

  // Fetch export data when modal opens or tab changes
  useEffect(() => {
    if (showExportModal) {
      fetchExportData();
    }
  }, [showExportModal, exportTab, selectedExportSeries]);

  const fetchExportData = async () => {
    try {
      // selectedExportSeries can be 'all' or a series_id
      const seriesId = selectedExportSeries === 'all' ? null : parseInt(selectedExportSeries);
      const response = await api.getExportPayouts(seriesId, exportTab);
      setExportPayoutData(response.payouts || []);
      setExportSummary(response.summary || {
        total_amount: 0,
        investor_count: 0,
        avg_per_investor: 0,
        payout_count: 0
      });
    } catch (err) {
      if (import.meta.env.DEV) { console.error('Error fetching export data:', err); }
    }
  };

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

  const handleViewInvestor = (investorId) => {
    // Navigate using the investor database ID
    navigate(`/investors/${investorId}`);
  };

  // Download export data as CSV
  const handleDownloadExport = async () => {
    try {
      // Call backend to generate and download CSV
      const seriesId = selectedExportSeries === 'all' ? null : parseInt(selectedExportSeries);
      const result = await api.downloadExportCSV(seriesId, exportTab);
      
      // Add audit log
      auditService.logDocumentDownloaded({
        documentType: 'Interest Payout Export',
        fileName: result.filename,
        format: 'CSV',
        series: selectedExportSeries,
        month: exportTab,
        recordCount: exportPayoutData.length
      }, user).catch(error => {
        if (import.meta.env.DEV) { console.error('Failed to log document download:', error); }
      });
      
      setShowExportModal(false);
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Error downloading export CSV:', error); }
      alert('Failed to download export CSV. Please try again.');
    }
  };

  const handleDownloadSample = async () => {
    try {
      // Call backend to generate and download sample Excel
      const result = await api.downloadSampleTemplate();
      
      // Add audit log
      auditService.logDocumentDownloaded({
        documentType: 'Interest Payout Sample',
        fileName: result.filename,
        format: 'Excel'
      }, user).catch(error => {
        if (import.meta.env.DEV) { console.error('Failed to log document download:', error); }
      });
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Error downloading sample template:', error); }
      alert('Failed to download sample template. Please try again.');
    }
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
  const handleImportSubmit = async () => {
    if (!uploadedFile) {
      setImportStatus('error:Please select a file to upload');
      return;
    }

    try {
      setImportStatus('');
      const response = await api.importPayouts(uploadedFile);
      
      if (response.success) {
        setImportStatus(`success:Successfully imported ${response.updated_count} payout(s)`);
        
        // Refresh data
        await fetchPayoutData();
        await fetchSummaryData();
        
        // Add audit log
        auditService.logPayoutImported({
          fileName: uploadedFile.name,
          recordCount: response.updated_count
        }, user).catch(error => {
          if (import.meta.env.DEV) { console.error('Failed to log payout import:', error); }
        });
        
        // Reset after 3 seconds
        setTimeout(() => {
          setShowImportModal(false);
          setUploadedFile(null);
          setImportStatus('');
        }, 3000);
      } else {
        setImportStatus(`error:${response.message || 'Import failed'}`);
      }
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Error importing payouts:', error); }
      setImportStatus(`error:${error.message || 'Failed to import payouts'}`);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-overlay">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="interest-payout-container">
          <div className="error-message">Error: {error}</div>
        </div>
      </Layout>
    );
  }

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
                {uniqueSeriesNames.map(seriesName => (
                  <option key={seriesName} value={seriesName}>{seriesName}</option>
                ))}
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
                <th>Payout Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Bank Name</th>
                <th>IFSC Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payoutData.map((payout) => (
                <tr key={payout.id}>
                  <td>
                    <div className="investor-info">
                      <div className="investor-name">{payout.investor_name}</div>
                      <div className="investor-id">{payout.investor_id}</div>
                    </div>
                  </td>
                  <td>
                    <button 
                      className="series-link"
                      onClick={() => handleSeriesClick(payout.series_id)}
                    >
                      {payout.series_name}
                    </button>
                  </td>
                  <td>{payout.interest_month}</td>
                  <td>{payout.interest_date}</td>
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
                      <div className="bank-name">{payout.bank_name || 'N/A'}</div>
                      <div className="account-number">{payout.bank_account_number || 'N/A'}</div>
                    </div>
                  </td>
                  <td>
                    <span className="ifsc-code">{payout.ifsc_code || 'N/A'}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        className="view-button"
                        onClick={() => handleViewInvestor(payout.investor_id)}
                      >
                        <FaEye size={12} />
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* No Results Message */}
          {payoutData.length === 0 && (
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
                    {uniqueSeriesForExport.map(series => (
                      <option key={series.id} value={series.id}>{series.name}</option>
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

                {/* Payout Details Table */}
                <div className="export-table-container">
                  <h3>Payout Details</h3>
                  
                  {/* Summary Stats */}
                  <div className="export-summary-stats" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '1rem', 
                    marginBottom: '1rem',
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Total Amount</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#28a745' }}>
                        ₹{exportSummary.total_amount?.toLocaleString('en-IN') || 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Total Payouts</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#007bff' }}>
                        {exportSummary.payout_count || 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Total Investors</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#6f42c1' }}>
                        {exportSummary.investor_count || 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Avg per Investor</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fd7e14' }}>
                        ₹{exportSummary.avg_per_investor?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}
                      </div>
                    </div>
                  </div>
                  
                  <table className="export-table">
                    <thead>
                      <tr>
                        <th>Investor</th>
                        <th>Series</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportPayoutData.map((payout) => (
                        <tr key={payout.id}>
                          <td>
                            <div className="investor-cell">
                              <div className="investor-name">{payout.investor_name}</div>
                              <div className="investor-id">{payout.investor_id}</div>
                            </div>
                          </td>
                          <td>{payout.series_name}</td>
                          <td>{payout.interest_date}</td>
                          <td className="amount-cell">₹{payout.amount.toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`status-badge ${getStatusColor(payout.status)}`}>
                              {payout.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {exportPayoutData.length === 0 && (
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


  const handleExport = async () => {
    try {
      // Call backend to generate and download CSV
      const result = await api.downloadPayoutsCSV(null, null);
      
      // Add audit log
      auditService.logDocumentDownloaded({
        documentType: 'Interest Payouts List',
        fileName: result.filename,
        format: 'CSV',
        recordCount: payoutData.length
      }, user).catch(error => {
        if (import.meta.env.DEV) { console.error('Failed to log document download:', error); }
      });
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Error downloading CSV:', error); }
      alert('Failed to download CSV file. Please try again.');
    }
  };
