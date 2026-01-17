import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './Investors.css';
import { MdOutlineFileDownload, MdTrendingUp, MdCurrencyRupee } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { FiFilter } from "react-icons/fi";
import { FaEye } from "react-icons/fa";
import { TiUserAdd } from "react-icons/ti";
import { HiOutlineDocumentText, HiOutlineMail, HiOutlinePhone, HiOutlineCalendar, HiOutlineChartBar, HiOutlineArrowRight } from "react-icons/hi";
import { FiUpload } from "react-icons/fi";



const Investors = () => {
  const navigate = useNavigate();
  const { showCreateButton, showEditButton, canEdit } = usePermissions();
  const { user } = useAuth();
  const { investors, series, getTotalInvestors, getKYCCompleted, getKYCRejected, getPendingKYC, addInvestor, updateInvestor, updateSeries, addAuditLog } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showKYCDropdown, setShowKYCDropdown] = useState(false);
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
  const [selectedKYCFilter, setSelectedKYCFilter] = useState('all');
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState('all');
  const [showAddInvestorModal, setShowAddInvestorModal] = useState(false);
  const [showAddInvestmentModal, setShowAddInvestmentModal] = useState(false);
  const [showInvestorDetails, setShowInvestorDetails] = useState(false);
  const [showSeriesSelection, setShowSeriesSelection] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [investorSearchTerm, setInvestorSearchTerm] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentDocument, setInvestmentDocument] = useState(null);
  const [formData, setFormData] = useState({
    // Applicant's Personal Information
    fullName: '',
    email: '',
    residentialAddress: '',
    correspondenceAddress: '',
    pan: 'ABCDE1234F',
    aadhaar: '1234 5678 9012',
    dob: '',
    
    // Bank Details
    bankName: '',
    accountNumber: '1234567890123456',
    ifscCode: 'SBIN0001234',
    
    // KYC Information
    occupation: '',
    sourceOfFunds: '',
    
    // Nomination (Optional)
    nomineeName: '',
    nomineeRelationship: '',
    nomineeMobile: '+91 ',
    nomineeEmail: '',
    nomineeAddress: '',
    
    // System fields
    phone: '+91 ',
    kycStatus: 'Pending',
    active: true,
    
    // Document uploads
    panDocument: null,
    aadhaarDocument: null,
    cancelledCheque: null,
    form15G15H: null,
    digitalSignature: null
  });

  const totalInvestors = getTotalInvestors();
  const kycCompleted = getKYCCompleted();
  const kycPending = getPendingKYC();
  const kycRejected = getKYCRejected();

  const filteredInvestors = useMemo(() => {
    return investors.filter(investor => {
      const matchesSearch = 
        investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.investorId.toLowerCase().includes(searchTerm.toLowerCase());
      
      // KYC Status filter
      const matchesKYCFilter = selectedKYCFilter === 'all' || investor.kycStatus === selectedKYCFilter;
      
      // Series filter
      const matchesSeriesFilter = selectedSeriesFilter === 'all' || 
        (investor.series && investor.series.includes(selectedSeriesFilter));
      
      return matchesSearch && matchesKYCFilter && matchesSeriesFilter;
    });
  }, [investors, searchTerm, selectedKYCFilter, selectedSeriesFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'completed';
      case 'Pending':
        return 'pending';
      case 'Rejected':
        return 'rejected';
      default:
        return '';
    }
  };

  const getStatusText = (status) => {
    console.log('KYC Status for display:', status); // Debug log
    switch (status) {
      case 'Completed':
        return 'Completed';
      case 'Pending':
        return 'Pending';
      case 'Rejected':
        return 'Rejected';
      default:
        console.log('Unknown KYC status:', status); // Debug log for unknown status
        return status;
    }
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Name', 'Investor ID', 'Email', 'Phone', 'Series', 'Investment', 'KYC Status', 'Date Joined'];
    const rows = filteredInvestors.map(inv => [
      inv.name,
      inv.investorId,
      inv.email,
      inv.phone,
      inv.series.join(', '),
      inv.investment,
      inv.kycStatus,
      inv.dateJoined
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = 'investors.csv';
    a.download = fileName;
    a.click();
    
    // Add audit log for document download
    addAuditLog({
      action: 'Downloaded Report',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `Downloaded Investors List (${filteredInvestors.length} investors, CSV format)`,
      entityType: 'Investor',
      entityId: 'All Investors',
      changes: {
        documentType: 'Investors List',
        fileName: fileName,
        format: 'CSV',
        recordCount: filteredInvestors.length
      }
    });
  };

  // Filter handlers
  const handleFilterToggle = () => {
    setShowFilterDropdown(!showFilterDropdown);
    setShowKYCDropdown(false);
    setShowSeriesDropdown(false);
  };

  const handleKYCFilterToggle = () => {
    setShowKYCDropdown(!showKYCDropdown);
    setShowSeriesDropdown(false);
  };

  const handleSeriesFilterToggle = () => {
    setShowSeriesDropdown(!showSeriesDropdown);
    setShowKYCDropdown(false);
  };

  const handleKYCFilterSelect = (status) => {
    setSelectedKYCFilter(status);
    setShowKYCDropdown(false);
    setShowFilterDropdown(false);
  };

  const handleSeriesFilterSelect = (seriesName) => {
    setSelectedSeriesFilter(seriesName);
    setShowSeriesDropdown(false);
    setShowFilterDropdown(false);
  };

  const clearFilters = () => {
    setSelectedKYCFilter('all');
    setSelectedSeriesFilter('all');
    setShowFilterDropdown(false);
    setShowKYCDropdown(false);
    setShowSeriesDropdown(false);
  };

  // Get unique series names from investors
  const getUniqueSeriesFromInvestors = () => {
    const allSeries = investors.flatMap(investor => investor.series || []);
    return [...new Set(allSeries)];
  };

  // Map series names to IDs for navigation
  const getSeriesId = (seriesName) => {
    // First try to find the series in the actual series data
    const foundSeries = series.find(s => s.name === seriesName);
    if (foundSeries) {
      return foundSeries.id.toString();
    }
    
    // Fallback to static mapping for initial series
    const seriesMap = {
      'Series A': '1',
      'Series B': '2',
      'Series C': '3',
      'Series D': '4',
      'Series E': '5'
    };
    return seriesMap[seriesName] || '1'; // Default to '1' if not found
  };

  const handleSeriesClick = (seriesName) => {
    const seriesId = getSeriesId(seriesName);
    navigate(`/ncd-series/${seriesId}`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  const handleFileInput = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  const generateInvestorId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create KYC documents array from uploaded files
    const kycDocuments = [];
    const uploadDate = new Date().toLocaleDateString('en-GB');
    
    if (formData.panDocument) {
      kycDocuments.push({
        name: 'PAN Card',
        uploadedDate: uploadDate,
        status: formData.kycStatus,
        fileName: formData.panDocument.name
      });
    }
    
    if (formData.aadhaarDocument) {
      kycDocuments.push({
        name: 'Aadhaar Card',
        uploadedDate: uploadDate,
        status: formData.kycStatus,
        fileName: formData.aadhaarDocument.name
      });
    }
    
    if (formData.cancelledCheque) {
      kycDocuments.push({
        name: 'Cancelled Cheque',
        uploadedDate: uploadDate,
        status: formData.kycStatus,
        fileName: formData.cancelledCheque.name
      });
    }
    
    if (formData.form15G15H) {
      kycDocuments.push({
        name: 'Form 15G/15H',
        uploadedDate: uploadDate,
        status: formData.kycStatus,
        fileName: formData.form15G15H.name
      });
    }
    
    if (formData.digitalSignature) {
      kycDocuments.push({
        name: 'Digital Signature',
        uploadedDate: uploadDate,
        status: formData.kycStatus,
        fileName: formData.digitalSignature.name
      });
    }
    
    const newInvestor = {
      name: formData.fullName,
      investorId: generateInvestorId(),
      email: formData.email,
      phone: formData.phone,
      pan: formData.pan,
      dob: formData.dob,
      address: formData.residentialAddress,
      kycStatus: formData.kycStatus,
      active: formData.active,
      series: [],
      investment: 0,
      dateJoined: new Date().toLocaleDateString('en-GB'),
      bankAccountNumber: formData.accountNumber,
      ifscCode: formData.ifscCode,
      bankName: formData.bankName,
      kycDocuments: kycDocuments
    };
    
    const success = addInvestor(newInvestor);
    if (!success) {
      return; // Don't close modal if duplicate ID
    }
    
    // Add audit log for investor creation
    addAuditLog({
      action: 'Created Investor',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `Created new investor "${formData.fullName}" (ID: ${newInvestor.investorId}) with KYC status: ${formData.kycStatus}`,
      entityType: 'Investor',
      entityId: newInvestor.investorId,
      changes: {
        investorName: formData.fullName,
        investorId: newInvestor.investorId,
        email: formData.email,
        phone: formData.phone,
        kycStatus: formData.kycStatus,
        bankName: formData.bankName,
        documentsUploaded: kycDocuments.length
      }
    });
    
    setShowAddInvestorModal(false);
    // Reset form
    setFormData({
      fullName: '',
      email: '',
      residentialAddress: '',
      correspondenceAddress: '',
      pan: 'ABCDE1234F',
      aadhaar: '1234 5678 9012',
      dob: '',
      bankName: '',
      accountNumber: '1234567890123456',
      ifscCode: 'SBIN0001234',
      occupation: '',
      sourceOfFunds: '',
      nomineeName: '',
      nomineeRelationship: '',
      nomineeMobile: '+91 ',
      nomineeEmail: '',
      nomineeAddress: '',
      phone: '+91 ',
      kycStatus: 'Pending',
      active: true,
      panDocument: null,
      aadhaarDocument: null,
      cancelledCheque: null,
      form15G15H: null,
      digitalSignature: null
    });
  };

  // Investment flow handlers
  const handleInvestorSearch = () => {
    const investor = investors.find(inv => inv.investorId === investorSearchTerm.trim());
    
    if (!investor) {
      alert('Investor not found. Please check the Investor ID.');
      return;
    }

    // 🚨 CRITICAL SECURITY CHECK - Block deleted/deactivated investors
    console.log('🔒 SECURITY CHECK for Investor ID:', investorSearchTerm.trim());
    console.log('Found investor:', investor);
    console.log('Investor status:', investor.status);
    console.log('Investor active:', investor.active);

    // HARD BLOCK for deleted investors
    if (investor.status === 'deleted') {
      alert('🚫 INVESTMENT BLOCKED: This investor account has been DELETED. Cannot add investments to deleted accounts.');
      console.log('🚫 BLOCKED: Deleted investor attempted investment');
      return;
    }

    // HARD BLOCK for deactivated investors
    if (investor.status === 'deactivated' || investor.active === false) {
      alert('🚫 INVESTMENT BLOCKED: This investor account has been DEACTIVATED. Cannot add investments to deactivated accounts. Please reactivate the account first.');
      console.log('🚫 BLOCKED: Deactivated investor attempted investment');
      return;
    }

    // Only proceed if investor is active
    console.log('✅ SECURITY CHECK PASSED: Investor is active');
    setSelectedInvestor(investor);
    setShowInvestorDetails(true);
  };

  const handleProceedToSeries = () => {
    setShowInvestorDetails(false);
    setShowSeriesSelection(true);
  };

  const handleSeriesSelect = (series) => {
    setSelectedSeries(series);
    setShowSeriesSelection(false);
    setShowInvestmentForm(true);
  };

  const handleInvestmentSubmit = () => {
    if (!investmentAmount || !investmentDocument) {
      alert('Please fill all required fields and upload document.');
      return;
    }

    // 🚨 FINAL SECURITY CHECK before processing investment
    console.log('🔒 FINAL SECURITY CHECK before investment submission');
    console.log('Selected investor:', selectedInvestor);
    console.log('Investor status:', selectedInvestor.status);
    console.log('Investor active:', selectedInvestor.active);

    // ABSOLUTE FINAL BLOCK for deleted investors
    if (selectedInvestor.status === 'deleted') {
      alert('🚫 INVESTMENT SUBMISSION BLOCKED: Cannot process investment for DELETED account.');
      console.log('🚫 FINAL BLOCK: Investment submission blocked for deleted investor');
      return;
    }

    // ABSOLUTE FINAL BLOCK for deactivated investors
    if (selectedInvestor.status === 'deactivated' || selectedInvestor.active === false) {
      alert('🚫 INVESTMENT SUBMISSION BLOCKED: Cannot process investment for DEACTIVATED account.');
      console.log('🚫 FINAL BLOCK: Investment submission blocked for deactivated investor');
      return;
    }
    
    // Ensure series is an array
    const currentSeries = Array.isArray(selectedInvestor.series) ? selectedInvestor.series : [];
    const currentInvestments = Array.isArray(selectedInvestor.investments) ? selectedInvestor.investments : [];
    
    // Check if this is a new investment in this series
    const isNewSeriesForInvestor = !currentSeries.includes(selectedSeries.name);
    
    // Create new investment record with admin who made the change
    const newInvestment = {
      seriesName: selectedSeries.name,
      amount: parseInt(investmentAmount),
      date: new Date().toLocaleDateString('en-GB'),
      timestamp: new Date().toISOString(),
      addedBy: user ? user.name : 'Admin',
      addedByRole: user ? user.displayRole : 'Admin'
    };
    
    // Update investor's investment and series data
    const updatedInvestor = {
      ...selectedInvestor,
      investment: selectedInvestor.investment + parseInt(investmentAmount),
      series: currentSeries.includes(selectedSeries.name) 
        ? currentSeries 
        : [...currentSeries, selectedSeries.name],
      investments: [...currentInvestments, newInvestment]
    };
    
    updateInvestor(selectedInvestor.id, updatedInvestor);
    
    // Update series data (increase funds raised and investor count)
    const updatedSeries = {
      ...selectedSeries,
      fundsRaised: selectedSeries.fundsRaised + parseInt(investmentAmount),
      investors: isNewSeriesForInvestor ? selectedSeries.investors + 1 : selectedSeries.investors
    };
    
    updateSeries(selectedSeries.id, updatedSeries);
    
    console.log('✅ INVESTMENT PROCESSED: Security checks passed');
    alert(`Investment of ₹${parseInt(investmentAmount).toLocaleString('en-IN')} added successfully for ${selectedInvestor.name} in ${selectedSeries.name}`);
    
    // Reload page to refresh all data
    window.location.reload();
  };

  // Reset functions for modal closing
  const handleCloseInvestmentModal = () => {
    setShowAddInvestmentModal(false);
    setInvestorSearchTerm('');
  };

  const handleCloseInvestorDetails = () => {
    setShowInvestorDetails(false);
    setSelectedInvestor(null);
  };

  const handleCloseSeriesSelection = () => {
    setShowSeriesSelection(false);
    setSelectedSeries(null);
  };

  const handleCloseInvestmentForm = () => {
    setShowInvestmentForm(false);
    setInvestmentAmount('');
    setInvestmentDocument(null);
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  // Filter series for investment (upcoming and ready to release)
  const availableSeries = series.filter(s => s.status === 'upcoming' || s.status === 'active');

  return (
    <Layout>
      <div className="investors-page">
        <div className="investors-header">
          <div>
            <h1 className="page-title">Investors</h1>
            <p className="page-subtitle">Manage investor profiles and KYC status.</p>
          </div>
          <div className="header-buttons">
            {showCreateButton('investors') && (
              <>
                <button className="add-investment-button" onClick={() => setShowAddInvestmentModal(true)}>
                  <MdTrendingUp size={20} /> Add Investment
                </button>
                <button className="add-investor-button" onClick={() => setShowAddInvestorModal(true)}>
                  <TiUserAdd size={20} /> Add Investor
                </button>
              </>
            )}
          </div>
        </div>

        <div className="investors-summary-cards">
          <div className="summary-card">
            <p className="card-label">Total Investors</p>
            <h2 className="card-value">{totalInvestors}</h2>
          </div>
          <div className="summary-card green">
            <p className="card-label">KYC Completed</p>
            <h2 className="card-value">{kycCompleted}</h2>
          </div>
          <div className="summary-card orange">
            <p className="card-label">KYC Pending</p>
            <h2 className="card-value">{getPendingKYC()}</h2>
          </div>
          <div className="summary-card red">
            <p className="card-label">KYC Rejected</p>
            <h2 className="card-value">{kycRejected}</h2>
          </div>
        </div>

        <div className="investors-table-section">
          <div className="table-header">
            <h3 className="section-title">All Investors</h3>
            <div className="table-actions">
              <div className="search-container">
                <FiSearch size={16} />
                <input
                  type="text"
                  placeholder="Search investors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-container">
                <button className="filter-button" onClick={handleFilterToggle}>
                  <FiFilter size={16} />
                  {(selectedKYCFilter !== 'all' || selectedSeriesFilter !== 'all') && (
                    <span className="filter-indicator"></span>
                  )}
                </button>
                
                {showFilterDropdown && (
                  <div className="filter-dropdown">
                    <div className="filter-section">
                      <div className="filter-option" onClick={handleKYCFilterToggle}>
                        <span>KYC Status</span>
                        <span className="dropdown-arrow">▶</span>
                      </div>
                      {showKYCDropdown && (
                        <div className="sub-dropdown kyc-dropdown">
                          <div 
                            className={`sub-option ${selectedKYCFilter === 'all' ? 'active' : ''}`}
                            onClick={() => handleKYCFilterSelect('all')}
                          >
                            All Status
                          </div>
                          <div 
                            className={`sub-option ${selectedKYCFilter === 'Pending' ? 'active' : ''}`}
                            onClick={() => handleKYCFilterSelect('Pending')}
                          >
                            Pending
                          </div>
                          <div 
                            className={`sub-option ${selectedKYCFilter === 'Completed' ? 'active' : ''}`}
                            onClick={() => handleKYCFilterSelect('Completed')}
                          >
                            Completed
                          </div>
                          <div 
                            className={`sub-option ${selectedKYCFilter === 'Rejected' ? 'active' : ''}`}
                            onClick={() => handleKYCFilterSelect('Rejected')}
                          >
                            Rejected
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="filter-section">
                      <div className="filter-option" onClick={handleSeriesFilterToggle}>
                        <span>Series</span>
                        <span className="dropdown-arrow">▶</span>
                      </div>
                      {showSeriesDropdown && (
                        <div className="sub-dropdown series-dropdown">
                          <div 
                            className={`sub-option ${selectedSeriesFilter === 'all' ? 'active' : ''}`}
                            onClick={() => handleSeriesFilterSelect('all')}
                          >
                            All Series
                          </div>
                          {getUniqueSeriesFromInvestors().map((seriesName) => (
                            <div 
                              key={seriesName}
                              className={`sub-option ${selectedSeriesFilter === seriesName ? 'active' : ''}`}
                              onClick={() => handleSeriesFilterSelect(seriesName)}
                            >
                              {seriesName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {(selectedKYCFilter !== 'all' || selectedSeriesFilter !== 'all') && (
                      <div className="filter-actions">
                        <button className="clear-filters-btn" onClick={clearFilters}>
                          Clear All Filters
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={handleExport} className="export-button">
                <MdOutlineFileDownload size={18} /> Export
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="investors-table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Contact</th>
                  <th>Series</th>
                  <th>Investment</th>
                  <th>KYC Status</th>
                  <th>Date Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvestors.map((investor) => (
                  <tr key={investor.id} className="investor-row">
  <td colSpan={7} className="scroll-row-cell">
    <div className="scroll-row-wrapper">
      <div className="scroll-row-content">

        {/* Investor */}
        <div className="cell investor">
          <div className="investor-name">{investor.name}</div>
          <div className="investor-id" style={{marginTop:"4px"}}>{investor.investorId}</div>
        </div>

        {/* Contact */}
        <div className="cell contact">
          <div>{investor.email}</div>
          <div className="phone">{investor.phone}</div>
        </div>

        {/* Series */}
        <div className="cell series">
          <div className="series-tags">
            {investor.series && investor.series.length > 0 ? (
              investor.series
                .filter(s => s && typeof s === 'string' && s.startsWith('Series'))
                .map((s, idx) => (
                  <span 
                    key={idx} 
                    className="series-tag clickable-series-tag"
                    onClick={() => handleSeriesClick(s)}
                    title={`View ${s} details`}
                  >
                    {s}
                  </span>
                ))
            ) : null}
            {(!investor.series || investor.series.length === 0 || investor.series.filter(s => s && typeof s === 'string' && s.startsWith('Series')).length === 0) && (
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>No series yet</span>
            )}
          </div>
        </div>

        {/* Investment */}
        <div className="cell investment">
          ₹{investor.investment.toLocaleString('en-IN')}
        </div>

        {/* KYC */}
        <div className="cell kyc">
          {investor.status === 'deleted' ? (
            <div className="deleted-investor-info">
              <span className="status-badge deleted">
                DELETED
              </span>
              {investor.refundAmount && (
                <div className="refund-amount-small">
                  Net: ₹{investor.refundAmount.toLocaleString('en-IN')}
                </div>
              )}
              {investor.penaltyAmount > 0 && (
                <div className="penalty-amount-small">
                  Penalty: ₹{investor.penaltyAmount.toLocaleString('en-IN')}
                </div>
              )}
              {investor.lockInViolations && investor.lockInViolations.length > 0 && (
                <div className="lockin-warning-small">
                  ⚠️ {investor.lockInViolations.length} early exit
                </div>
              )}
            </div>
          ) : (
            <span className={`status-badge ${getStatusColor(investor.kycStatus)}`}>
              {getStatusText(investor.kycStatus)}
            </span>
          )}
        </div>

        {/* Date */}
        <div className="cell date">
          {investor.dateJoined}
        </div>

        {/* Action */}
        <div className="cell action">
          <button
            className="view-button"
            onClick={() => navigate(`/investors/${investor.id}`)}
          >
            <FaEye size={16} /> View
          </button>
        </div>

      </div>
    </div>
  </td>
</tr>

                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile-friendly card layout */}
          <div className="mobile-investors-list">
            {filteredInvestors.map((investor) => (
              <div key={investor.id} className="mobile-investor-card">
                <div className="mobile-card-header">
                  <div className="mobile-investor-info">
                    <h4>{investor.name}</h4>
                    <span className="investor-id">{investor.investorId}</span>
                  </div>
                  {investor.status === 'deleted' ? (
                    <div className="deleted-investor-info">
                      <span className="status-badge deleted">
                        DELETED
                      </span>
                      {investor.refundAmount && (
                        <div className="refund-amount-small">
                          Net: ₹{investor.refundAmount.toLocaleString('en-IN')}
                        </div>
                      )}
                      {investor.penaltyAmount > 0 && (
                        <div className="penalty-amount-small">
                          Penalty: ₹{investor.penaltyAmount.toLocaleString('en-IN')}
                        </div>
                      )}
                      {investor.lockInViolations && investor.lockInViolations.length > 0 && (
                        <div className="lockin-warning-small">
                          ⚠️ {investor.lockInViolations.length} early exit
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className={`status-badge ${getStatusColor(investor.kycStatus)}`}>
                      {getStatusText(investor.kycStatus)}
                    </span>
                  )}
                </div>
                
                <div className="mobile-card-details">
                  <div className="mobile-detail-item">
                    <span className="mobile-detail-label">Contact</span>
                    <div className="mobile-detail-value">
                      <div>{investor.email}</div>
                      <div style={{fontSize: '11px', color: '#64748b'}}>{investor.phone}</div>
                    </div>
                  </div>
                  
                  <div className="mobile-detail-item">
                    <span className="mobile-detail-label">Investment</span>
                    <span className="mobile-detail-value mobile-investment">
                      ₹{investor.investment.toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div className="mobile-detail-item">
                    <span className="mobile-detail-label">Series</span>
                    <div className="mobile-series-tags">
                      {investor.series && investor.series.length > 0 ? (
                        investor.series
                          .filter(s => s && typeof s === 'string' && s.startsWith('Series'))
                          .map((s, idx) => (
                            <span 
                              key={idx} 
                              className="series-tag clickable-series-tag"
                              onClick={() => handleSeriesClick(s)}
                              title={`View ${s} details`}
                            >
                              {s}
                            </span>
                          ))
                      ) : null}
                      {(!investor.series || investor.series.length === 0 || investor.series.filter(s => s && typeof s === 'string' && s.startsWith('Series')).length === 0) && (
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>No series yet</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mobile-detail-item">
                    <span className="mobile-detail-label">Joined</span>
                    <span className="mobile-detail-value">{investor.dateJoined}</span>
                  </div>
                </div>
                
                <div className="mobile-card-footer">
                  <span className="mobile-date">Last updated: {investor.dateJoined}</span>
                  <button
                    className="mobile-view-button"
                    onClick={() => navigate(`/investors/${investor.id}`)}
                  >
                    <FaEye size={12} /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showAddInvestorModal && (
          <div className="modal-overlay" onClick={() => setShowAddInvestorModal(false)}>
            <div className="modal-content investor-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-with-icon">
                  <HiOutlineDocumentText size={24} className="title-icon" />
                  <h2>Onboard New Investor</h2>
                </div>
                <button 
                  className="close-button"
                  onClick={() => setShowAddInvestorModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="create-form investor-form">
                
                {/* Applicant's Personal Information */}
                <div className="form-section">
                  <h3 className="section-title">Applicant's Personal Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name*</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email ID*</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Birth*</label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number*</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (!value.startsWith('+91 ')) {
                            value = '+91 ' + value.replace(/^\+91\s*/, '');
                          }
                          setFormData({ ...formData, phone: value });
                        }}
                        required
                        placeholder="+91 Enter mobile number"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Residential Address*</label>
                      <textarea
                        value={formData.residentialAddress}
                        onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                        required
                        placeholder="Enter residential address"
                        rows="3"
                      />
                    </div>
                    <div className="form-group">
                      <label>Correspondence Address (if different)</label>
                      <textarea
                        value={formData.correspondenceAddress}
                        onChange={(e) => setFormData({ ...formData, correspondenceAddress: e.target.value })}
                        placeholder="Enter correspondence address or leave blank if same as residential"
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>PAN (Permanent Account Number)*</label>
                      <input
                        type="text"
                        value={formData.pan}
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                        required
                        placeholder="ABCDE1234F"
                        onFocus={(e) => {
                          if (e.target.value === 'ABCDE1234F') {
                            setFormData({ ...formData, pan: '' });
                          }
                        }}
                        style={{ 
                          color: formData.pan === 'ABCDE1234F' ? '#9ca3af' : '#1e293b',
                          fontStyle: formData.pan === 'ABCDE1234F' ? 'italic' : 'normal'
                        }}
                        maxLength="10"
                      />
                    </div>
                    <div className="form-group">
                      <label>Aadhaar Number*</label>
                      <input
                        type="text"
                        value={formData.aadhaar}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          value = value.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
                          setFormData({ ...formData, aadhaar: value });
                        }}
                        required
                        placeholder="1234 5678 9012"
                        onFocus={(e) => {
                          if (e.target.value === '1234 5678 9012') {
                            setFormData({ ...formData, aadhaar: '' });
                          }
                        }}
                        style={{ 
                          color: formData.aadhaar === '1234 5678 9012' ? '#9ca3af' : '#1e293b',
                          fontStyle: formData.aadhaar === '1234 5678 9012' ? 'italic' : 'normal'
                        }}
                        maxLength="14"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="form-section">
                  <h3 className="section-title">Bank Details for Interest/Redemption Payments</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Bank Name*</label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        required
                        placeholder="Enter bank name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Account Number*</label>
                      <input
                        type="text"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        required
                        placeholder="1234567890123456"
                        onFocus={(e) => {
                          if (e.target.value === '1234567890123456') {
                            setFormData({ ...formData, accountNumber: '' });
                          }
                        }}
                        style={{ 
                          color: formData.accountNumber === '1234567890123456' ? '#9ca3af' : '#1e293b',
                          fontStyle: formData.accountNumber === '1234567890123456' ? 'italic' : 'normal'
                        }}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>IFSC Code*</label>
                      <input
                        type="text"
                        value={formData.ifscCode}
                        onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                        required
                        placeholder="SBIN0001234"
                        onFocus={(e) => {
                          if (e.target.value === 'SBIN0001234') {
                            setFormData({ ...formData, ifscCode: '' });
                          }
                        }}
                        style={{ 
                          color: formData.ifscCode === 'SBIN0001234' ? '#9ca3af' : '#1e293b',
                          fontStyle: formData.ifscCode === 'SBIN0001234' ? 'italic' : 'normal'
                        }}
                        maxLength="11"
                      />
                    </div>
                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.active}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                          className="active-checkbox"
                        />
                        <span>Active Account</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Know Your Customer (KYC) */}
                <div className="form-section">
                  <h3 className="section-title">Know Your Customer (KYC)</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Occupation*</label>
                      <input
                        type="text"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        required
                        placeholder="Enter occupation"
                      />
                    </div>
                    <div className="form-group">
                      <label>KYC Status</label>
                      <select
                        value={formData.kycStatus}
                        onChange={(e) => setFormData({ ...formData, kycStatus: e.target.value })}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Source of Funds*</label>
                      <select
                        value={formData.sourceOfFunds}
                        onChange={(e) => setFormData({ ...formData, sourceOfFunds: e.target.value })}
                        required
                      >
                        <option value="">Select source of funds</option>
                        <option value="Salary">Salary</option>
                        <option value="Business Income">Business Income</option>
                        <option value="Investment Returns">Investment Returns</option>
                        <option value="Inheritance">Inheritance</option>
                        <option value="Gift">Gift</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Nomination (Optional) */}
                <div className="form-section">
                  <h3 className="section-title">Nomination (Optional)</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name of Nominee</label>
                      <input
                        type="text"
                        value={formData.nomineeName}
                        onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                        placeholder="Enter nominee name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Relationship with Subscriber</label>
                      <select
                        value={formData.nomineeRelationship}
                        onChange={(e) => setFormData({ ...formData, nomineeRelationship: e.target.value })}
                      >
                        <option value="">Select relationship</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Mobile No</label>
                      <input
                        type="tel"
                        value={formData.nomineeMobile}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (!value.startsWith('+91 ')) {
                            value = '+91 ' + value.replace(/^\+91\s*/, '');
                          }
                          setFormData({ ...formData, nomineeMobile: value });
                        }}
                        placeholder="+91 Enter nominee mobile number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Id</label>
                      <input
                        type="email"
                        value={formData.nomineeEmail}
                        onChange={(e) => setFormData({ ...formData, nomineeEmail: e.target.value })}
                        placeholder="Enter nominee email"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Address</label>
                      <textarea
                        value={formData.nomineeAddress}
                        onChange={(e) => setFormData({ ...formData, nomineeAddress: e.target.value })}
                        placeholder="Enter nominee address"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                <div className="upload-section">
                  <h3 className="section-title">Attachments</h3>
                  <div className="upload-grid">
                    <div className="upload-item">
                      <label>PAN Document (Mandatory)*</label>
                      <div className="upload-wrapper">
                        <div 
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'panDocument')}
                          onClick={() => document.getElementById('panDocument').click()}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="upload-content">
                            <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Click to upload or drag and drop PAN document here</p>
                              <p className="file-limit">Limit 200MB per file</p>
                              <p className="file-limit">PDF, PNG, JPG, JPEG</p>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          id="panDocument"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileInput(e, 'panDocument')}
                          style={{ display: 'none' }}
                          required
                        />
                      </div>
                      {formData.panDocument && (
                        <div className="file-selected">{formData.panDocument.name}</div>
                      )}
                    </div>

                    <div className="upload-item">
                      <label>Aadhaar Document (Mandatory)*</label>
                      <div className="upload-wrapper">
                        <div 
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'aadhaarDocument')}
                          onClick={() => document.getElementById('aadhaarDocument').click()}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="upload-content">
                            <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Click to upload or drag and drop Aadhaar document here</p>
                              <p className="file-limit">Limit 200MB per file</p>
                              <p className="file-limit">PDF, PNG, JPG, JPEG</p>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          id="aadhaarDocument"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileInput(e, 'aadhaarDocument')}
                          style={{ display: 'none' }}
                          required
                        />
                      </div>
                      {formData.aadhaarDocument && (
                        <div className="file-selected">{formData.aadhaarDocument.name}</div>
                      )}
                    </div>

                    <div className="upload-item">
                      <label>Cancelled Cheque (Mandatory)*</label>
                      <div className="upload-wrapper">
                        <div 
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'cancelledCheque')}
                          onClick={() => document.getElementById('cancelledCheque').click()}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="upload-content">
                            <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Click to upload or drag and drop cancelled cheque here</p>
                              <p className="file-limit">Limit 200MB per file</p>
                              <p className="file-limit">PDF, PNG, JPG, JPEG</p>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          id="cancelledCheque"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileInput(e, 'cancelledCheque')}
                          style={{ display: 'none' }}
                          required
                        />
                      </div>
                      {formData.cancelledCheque && (
                        <div className="file-selected">{formData.cancelledCheque.name}</div>
                      )}
                    </div>

                    <div className="upload-item">
                      <label>Form 15G/15H (Optional)</label>
                      <div className="upload-wrapper">
                        <div 
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'form15G15H')}
                          onClick={() => document.getElementById('form15G15H').click()}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="upload-content">
                            <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Click to upload or drag and drop Form 15G/15H here</p>
                              <p className="file-limit">Limit 200MB per file</p>
                              <p className="file-limit">PDF, PNG, JPG, JPEG</p>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          id="form15G15H"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileInput(e, 'form15G15H')}
                          style={{ display: 'none' }}
                        />
                      </div>
                      {formData.form15G15H && (
                        <div className="file-selected">{formData.form15G15H.name}</div>
                      )}
                    </div>

                    <div className="upload-item">
                      <label>Digital Signature*</label>
                      <div className="upload-wrapper">
                        <div 
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'digitalSignature')}
                          onClick={() => document.getElementById('digitalSignature').click()}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="upload-content">
                            <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Click to upload or drag and drop digital signature here</p>
                              <p className="file-limit">Limit 200MB per file</p>
                              <p className="file-limit">PNG, JPG, JPEG</p>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          id="digitalSignature"
                          accept=".png,.jpg,.jpeg"
                          onChange={(e) => handleFileInput(e, 'digitalSignature')}
                          style={{ display: 'none' }}
                          required
                        />
                      </div>
                      {formData.digitalSignature && (
                        <div className="file-selected">{formData.digitalSignature.name}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Declaration */}
                <div className="form-section declaration-section">
                  <h3 className="section-title">Declaration</h3>
                  <div className="declaration-text">
                    <p>
                      I hereby declare that the information provided above is true and correct to the best of my knowledge and belief. 
                      I undertake to inform the company of any changes in the above details promptly. I also authorize the company 
                      to use my bank account details for interest/redemption payments related to the Non-Convertible Debentures issue.
                    </p>
                  </div>
                  <div className="declaration-checkbox">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        required
                        className="active-checkbox"
                      />
                      <span>I agree to the above declaration</span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={() => setShowAddInvestorModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-button create-investor-button">
                    <TiUserAdd size={18} /> Create Investor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Investment Modal - Search Investor */}
        {showAddInvestmentModal && (
          <div className="modal-overlay" onClick={handleCloseInvestmentModal}>
            <div className="modal-content investment-search-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Investment</h2>
                <button className="close-button" onClick={handleCloseInvestmentModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="search-investor-section">
                  <label>Enter Investor ID:</label>
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      value={investorSearchTerm}
                      onChange={(e) => setInvestorSearchTerm(e.target.value)}
                      placeholder="Enter unique investor ID (e.g., ABCDE1234F)"
                      className="investor-search-input"
                    />
                    <button className="search-button" onClick={handleInvestorSearch}>
                      <FiSearch size={16} /> Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Investor Details Modal */}
        {showInvestorDetails && selectedInvestor && (
          <div className="modal-overlay" onClick={handleCloseInvestorDetails}>
            <div className="modal-content investor-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Investor Details</h2>
                <button className="close-button" onClick={handleCloseInvestorDetails}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="investor-info-header">
                  <div className="investor-name-section">
                    <h3>{selectedInvestor.name}</h3>
                    <span className="investor-id-display">{selectedInvestor.investorId}</span>
                  </div>
                  <span className={`kyc-status-badge kyc-${selectedInvestor.kycStatus.toLowerCase()}`}>
                    {selectedInvestor.kycStatus}
                  </span>
                </div>

                <div className="investor-details-grid">
                  <div className="detail-item">
                    <div className="detail-item-header">
                      <HiOutlineMail className="detail-icon" />
                      <span className="detail-label">Email</span>
                    </div>
                    <span className="detail-value">{selectedInvestor.email}</span>
                  </div>
                  
                  <div className="detail-item">
                    <div className="detail-item-header">
                      <HiOutlinePhone className="detail-icon" />
                      <span className="detail-label">Phone</span>
                    </div>
                    <span className="detail-value">{selectedInvestor.phone}</span>
                  </div>
                  
                  <div className="detail-item">
                    <div className="detail-item-header">
                      <HiOutlineCalendar className="detail-icon" />
                      <span className="detail-label">Date Joined</span>
                    </div>
                    <span className="detail-value">{selectedInvestor.dateJoined}</span>
                  </div>
                  
                  <div className="detail-item">
                    <div className="detail-item-header">
                      <MdCurrencyRupee className="detail-icon" />
                      <span className="detail-label">Current Investment</span>
                    </div>
                    <span className="detail-value investment-amount">₹{selectedInvestor.investment.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="detail-item full-width">
                    <div className="detail-item-header">
                      <HiOutlineChartBar className="detail-icon" />
                      <span className="detail-label">Active Series</span>
                    </div>
                    <div className="series-tags">
                      {selectedInvestor.series.map((series, index) => (
                        <span key={index} className="series-tag">{series}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="cancel-button" onClick={handleCloseInvestorDetails}>
                    Cancel
                  </button>
                  <button className="submit-button" onClick={handleProceedToSeries}>
                    Add New Investment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Series Selection Modal */}
        {showSeriesSelection && (
          <div className="modal-overlay" onClick={handleCloseSeriesSelection}>
            <div className="modal-content series-selection-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Select Series for Investment</h2>
                <button className="close-button" onClick={handleCloseSeriesSelection}>×</button>
              </div>
              <div className="modal-body">
                <div className="series-grid">
                  {availableSeries.map((series) => {
                    const progress = (series.fundsRaised / series.targetAmount) * 100;
                    return (
                      <div key={series.id} className="series-card" onClick={() => handleSeriesSelect(series)}>
                        <div className="series-header">
                          <h3>{series.name}</h3>
                          <span className={`status-badge ${series.status}`}>{series.status}</span>
                        </div>
                        <div className="series-details">
                          <div className="detail-row">
                            <span>Interest Rate:</span>
                            <span>{series.interestRate}%</span>
                          </div>
                          <div className="detail-row">
                            <span>Frequency:</span>
                            <span>{series.interestFrequency}</span>
                          </div>
                          <div className="detail-row">
                            <span>Min Investment:</span>
                            <span>₹{series.minInvestment.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <div className="funds-progress">
                          <div className="progress-info">
                            <span>{formatCurrency(series.fundsRaised)} / {formatCurrency(series.targetAmount)}</span>
                            <span>{progress.toFixed(1)}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Investment Form Modal */}
        {showInvestmentForm && selectedSeries && (
          <div className="modal-overlay" onClick={handleCloseInvestmentForm}>
            <div className="modal-content investment-form-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Invest in {selectedSeries.name}</h2>
                <button className="close-button" onClick={handleCloseInvestmentForm}>×</button>
              </div>
              <div className="modal-body">
                <div className="series-summary">
                  <h3>Series Details</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span>Interest Rate:</span>
                      <span>{selectedSeries.interestRate}%</span>
                    </div>
                    <div className="summary-item">
                      <span>Frequency:</span>
                      <span>{selectedSeries.interestFrequency}</span>
                    </div>
                    <div className="summary-item">
                      <span>Minimum Investment:</span>
                      <span>₹{selectedSeries.minInvestment.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="funds-raised">
                    <div className="progress-info">
                      <span>Funds Raised: {formatCurrency(selectedSeries.fundsRaised)} / {formatCurrency(selectedSeries.targetAmount)}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(selectedSeries.fundsRaised / selectedSeries.targetAmount) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="investment-form">
                  <div className="form-group">
                    <label>Investment Amount *</label>
                    <input
                      type="number"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      placeholder={`Minimum ₹${selectedSeries.minInvestment.toLocaleString('en-IN')}`}
                      min={selectedSeries.minInvestment}
                      className="amount-input"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Investment Transferred *</label>
                      <input
                        type="date"
                        className="amount-input"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Date of Investment Received *</label>
                      <input
                        type="date"
                        className="amount-input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Upload Payment Document *</label>
                    <div 
                      className="investment-file-upload-area"
                      onClick={() => document.getElementById('investment-document').click()}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="investment-upload-content">
                        <FiUpload size={28} className="investment-upload-icon" />
                        <div className="investment-upload-text">
                          <p className="investment-upload-main">
                            {investmentDocument ? investmentDocument.name : 'Click to upload payment receipt/document'}
                          </p>
                          <p className="investment-upload-subtitle">or drag and drop your file here</p>
                          <p className="investment-file-formats">PDF, JPG, PNG, DOC (Max 10MB)</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        onChange={(e) => setInvestmentDocument(e.target.files[0])}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="file-input"
                        id="investment-document"
                        style={{ display: 'none' }}
                      />
                      {investmentDocument && (
                        <div className="investment-file-selected">
                          <span>✓ File selected: {investmentDocument.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button className="cancel-button" onClick={handleCloseInvestmentForm}>
                    Cancel
                  </button>
                  <button className="invest-button" onClick={handleInvestmentSubmit}>
                    Invest ₹{investmentAmount ? parseInt(investmentAmount).toLocaleString('en-IN') : '0'}
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

export default Investors;

