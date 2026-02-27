import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import apiService from '../services/api';
import auditService from '../services/auditService';
import Layout from '../components/Layout';
import './Investors.css';
import '../styles/loading.css';
import { MdOutlineFileDownload, MdTrendingUp, MdCurrencyRupee } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { FaEye, FaUsers, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import { TiUserAdd } from "react-icons/ti";
import { HiOutlineDocumentText, HiOutlineMail, HiOutlinePhone, HiOutlineCalendar, HiOutlineChartBar } from "react-icons/hi";
import { FiUpload } from "react-icons/fi";
import { IoLockClosedOutline } from "react-icons/io5";

const Investors = () => {
  const navigate = useNavigate();
  const { showCreateButton } = usePermissions();
  const { user } = useAuth();
  const toast = useToast();
  
  // State management - Data from backend
  const [investors, setInvestors] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    total_investors: 0,
    kyc_completed: 0,
    kyc_pending: 0,
    kyc_rejected: 0,
    total_investment: 0
  });
  const [uniqueSeries, setUniqueSeries] = useState([]);

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddInvestorModal, setShowAddInvestorModal] = useState(false);
  const [showAddInvestmentModal, setShowAddInvestmentModal] = useState(false);
  const [showInvestorDetails, setShowInvestorDetails] = useState(false);
  const [showSeriesSelection, setShowSeriesSelection] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [investorSearchTerm, setInvestorSearchTerm] = useState('');
  const [seriesSearchTerm, setSeriesSearchTerm] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentDocument, setInvestmentDocument] = useState(null);
  const [availableSeriesForInvestment, setAvailableSeriesForInvestment] = useState([]);
  const [isSubmittingInvestment, setIsSubmittingInvestment] = useState(false); // NEW: Loading state for investment submission

  // Form data for Add Investor
  const [formData, setFormData] = useState({
    investorId: '', // NEW: Manual Investor ID field
    fullName: '',
    email: '',
    residentialAddress: '',
    correspondenceAddress: '',
    pan: '',
    aadhaar: '',
    dob: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
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

  // Statistics from backend
  const totalInvestors = statistics.total_investors;
  const kycCompleted = statistics.kyc_completed;
  const kycPending = statistics.kyc_pending;
  const kycRejected = statistics.kyc_rejected;

  // Filtered investors - now using backend search
  const [filteredInvestors, setFilteredInvestors] = useState([]);

  // Load data from backend on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load all data from backend
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (import.meta.env.DEV) { console.log('🔄 Loading investors data from backend...'); }
      
      // Load investors, statistics, and series in parallel
      const [investorsData, statsData, seriesData, uniqueSeriesData] = await Promise.all([
        apiService.searchInvestors({ status: 'active', limit: 1000 }).catch(err => {
          if (import.meta.env.DEV) { console.error('❌ Error loading investors:', err); }
          return { investors: [] };
        }),
        apiService.getInvestorStatistics().catch(err => {
          if (import.meta.env.DEV) { console.error('❌ Error loading statistics:', err); }
          return { total_investors: 0, kyc_completed: 0, kyc_pending: 0, kyc_rejected: 0, total_investment: 0 };
        }),
        apiService.getSeries().catch(err => {
          if (import.meta.env.DEV) { console.error('❌ Error loading series:', err); }
          return [];
        }),
        apiService.getUniqueSeriesForFilters().catch(err => {
          if (import.meta.env.DEV) { console.error('❌ Error loading unique series:', err); }
          return { series: [] };
        })
      ]);
      
      if (import.meta.env.DEV) { console.log('✅ Data loaded:', {
        investors: investorsData.investors?.length || 0,
        stats: statsData,
        series: seriesData.length || 0,
        uniqueSeries: uniqueSeriesData.series?.length || 0
      }); }
      
      // Set investors (already formatted from backend)
      setInvestors(investorsData.investors || []);
      setFilteredInvestors(investorsData.investors || []);
      
      // Set statistics
      setStatistics(statsData);
      
      // Set series (transform for frontend use)
      const transformedSeries = (seriesData || []).map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        subscriptionStartDate: s.subscription_start_date,
        subscriptionEndDate: s.subscription_end_date,
        seriesStartDate: s.series_start_date,
        maturityDate: s.maturity_date,
        interestRate: s.interest_rate,
        interestFrequency: s.interest_frequency,
        minInvestment: s.min_investment,
        targetAmount: s.target_amount,
        fundsRaised: s.funds_raised || 0
      }));
      setSeries(transformedSeries);
      
      // Set unique series for filters
      setUniqueSeries(uniqueSeriesData.series || []);
      
    } catch (err) {
      if (import.meta.env.DEV) { console.error('❌ Error loading data:', err); }
      setError('Failed to load data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  // Load filtered investors when filters change
  useEffect(() => {
    const loadFilteredInvestors = async () => {
      try {
        const params = {
          status: 'active',
          limit: 1000
        };
        
        if (searchTerm) params.q = searchTerm;
        
        const result = await apiService.searchInvestors(params);
        setFilteredInvestors(result.investors || []);
      } catch (err) {
        if (import.meta.env.DEV) { console.error('Error filtering investors:', err); }
      }
    };
    
    loadFilteredInvestors();
  }, [searchTerm]);


  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'completed';
      case 'Pending': return 'pending';
      case 'Rejected': return 'rejected';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    return status;
  };

  const handleSeriesClick = (seriesName) => {
    // Navigate to series details page
    if (import.meta.env.DEV) { console.log('Series clicked:', seriesName); }
    
    // Create a dynamic mapping function for series names to IDs
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
        'Series E': '5',
        'Series AB': '6'
      };
      return seriesMap[seriesName] || '1'; // Default to '1' if not found
    };
    
    const seriesId = getSeriesId(seriesName);
    navigate(`/ncd-series/${seriesId}`);
  };

  const handleExport = async () => {
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
    
    // Log audit
    await auditService.logReportDownload({
      reportType: 'Investors List',
      fileName: fileName,
      format: 'CSV',
      recordCount: filteredInvestors.length
    }, user);
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

  // Removed generateInvestorId - now using backend API

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate Investor ID is provided
      if (!formData.investorId || !formData.investorId.trim()) {
        toast.error('Investor ID is required', 'Validation Error');
        return;
      }
      
      // Create investor data
      const investorData = {
        investor_id: formData.investorId.trim().toUpperCase(), // Use manual ID
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob,
        residential_address: formData.residentialAddress,
        correspondence_address: formData.correspondenceAddress || formData.residentialAddress,
        pan: formData.pan.toUpperCase(),
        aadhaar: formData.aadhaar.replace(/\s/g, ''),
        bank_name: formData.bankName,
        account_number: formData.accountNumber,
        ifsc_code: formData.ifscCode.toUpperCase(),
        occupation: formData.occupation,
        kyc_status: formData.kycStatus,
        source_of_funds: formData.sourceOfFunds,
        is_active: formData.active,
        nominee_name: formData.nomineeName || null,
        nominee_relationship: formData.nomineeRelationship || null,
        nominee_mobile: formData.nomineeMobile || null,
        nominee_email: formData.nomineeEmail || null,
        nominee_address: formData.nomineeAddress || null
      };
      
      // Create investor via API
      await apiService.createInvestor(investorData);
      
      // Log audit - FIXED: Changed logInvestorCreated to logInvestorCreate and matched parameter names
      await auditService.logInvestorCreate(user, {
        fullName: formData.fullName,
        investorId: formData.investorId.trim().toUpperCase(),
        email: formData.email,
        phone: formData.phone,
        kycStatus: formData.kycStatus
      });
      
      // Reload data
      await loadData();
      
      // Close modal and reset form
      setShowAddInvestorModal(false);
      setFormData({
        investorId: '',
        fullName: '',
        email: '',
        residentialAddress: '',
        correspondenceAddress: '',
        pan: '',
        aadhaar: '',
        dob: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
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
      
      toast.success(`Investor "${formData.fullName}" has been created successfully with ID: ${formData.investorId.trim().toUpperCase()}`, 'Investor Created');
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Error creating investor:', error); }
      toast.error(error.message || 'Failed to create investor. Please try again.', 'Creation Failed');
    }
  };

  // Investment flow handlers - BACKEND ONLY, NO FRONTEND LOGIC
  const handleInvestorSearch = async () => {
    const investor = investors.find(inv => inv.investorId === investorSearchTerm.trim());
    
    if (!investor) {
      toast.error('Investor not found. Please check the Investor ID.', 'Not Found');
      return;
    }

    // NO FRONTEND CHECKS - Just show investor details
    // Backend will validate everything when investment is submitted
    if (import.meta.env.DEV) { console.log('Found investor:', investor.investorId); }
    setSelectedInvestor(investor);
    setShowInvestorDetails(true);
  };

  const handleProceedToSeries = async () => {
    setShowInvestorDetails(false);
    setShowSeriesSelection(true);
    
    // Load series with backend-calculated status
    try {
      if (import.meta.env.DEV) { console.log('🔄 Loading available series from backend...'); }
      const response = await apiService.getAvailableSeriesForInvestment();
      if (import.meta.env.DEV) { console.log('✅ Backend response:', response); }
      if (import.meta.env.DEV) { console.log('✅ Series count:', response.series?.length || 0); }
      
      if (response.series && response.series.length > 0) {
        setAvailableSeriesForInvestment(response.series);
        if (import.meta.env.DEV) { console.log('✅ Series loaded successfully:', response.series.length); }
      } else {
        if (import.meta.env.DEV) { console.warn('⚠️ No series returned from backend'); }
        setAvailableSeriesForInvestment([]);
        toast.info('No series are currently accepting investments', 'No Series Available');
      }
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error loading series:', error); }
      if (import.meta.env.DEV) { console.error('❌ Error details:', error.message); }
      setAvailableSeriesForInvestment([]);
      toast.error('Failed to load series. Please try again.', 'Error');
    }
  };

  const handleSeriesSelect = (series) => {
    // Backend only returns series that are accepting investments
    if (import.meta.env.DEV) { console.log('Series selected:', series.name); }
    setSelectedSeries(series);
    setShowSeriesSelection(false);
    setShowInvestmentForm(true);
  };

  const handleInvestmentSubmit = async () => {
    if (!investmentAmount || !investmentDocument) {
      toast.error('Please fill all required fields and upload document.', 'Validation Error');
      return;
    }

    // Prevent double submission
    if (isSubmittingInvestment) {
      if (import.meta.env.DEV) { console.log('⚠️ Investment already in progress, ignoring duplicate click'); }
      return;
    }

    try {
      setIsSubmittingInvestment(true); // Disable button and show loading
      
      // Backend validates EVERYTHING - investor status, series status, subscription window, etc.
      const validation = await apiService.validateInvestment(
        selectedInvestor.investorId,
        selectedSeries.id,
        parseFloat(investmentAmount)
      );
      
      if (!validation.valid) {
        toast.error(validation.message, 'Investment Blocked');
        return;
      }
      
      // Create investment via API
      const investmentData = {
        series_id: selectedSeries.id,
        amount: parseFloat(investmentAmount),
        date_transferred: new Date().toISOString().split('T')[0],
        date_received: new Date().toISOString().split('T')[0]
      };
      
      // Pass the payment document file
      await apiService.addInvestment(selectedInvestor.id, investmentData, investmentDocument);
      
      // Backend already creates audit log - no need to log from frontend
      
      // Show success message first
      toast.success(`Investment of ₹${parseFloat(investmentAmount).toLocaleString()} created successfully`, 'Investment Created');
      
      // Close all modals and reset form
      setShowInvestmentForm(false);
      setShowSeriesSelection(false);
      setShowInvestorDetails(false);
      setInvestmentAmount('');
      setInvestmentDocument(null);
      setSelectedInvestor(null);
      setSelectedSeries(null);
      
      // Reload data
      await loadData();
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Error creating investment:', error); }
      toast.error(error.message || 'Failed to create investment. Please try again.', 'Creation Failed');
    } finally {
      setIsSubmittingInvestment(false); // Re-enable button
    }
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
    setSeriesSearchTerm(''); // Reset search term when closing modal
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

  // Filter series from backend data (only by search term, status already calculated by backend)
  const filteredSeriesForInvestment = availableSeriesForInvestment.filter(s => {
    // Filter by search term (name or ID)
    const matchesSearch = !seriesSearchTerm || 
      s.name.toLowerCase().includes(seriesSearchTerm.toLowerCase()) ||
      (s.id && s.id.toString().toLowerCase().includes(seriesSearchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Enhanced table row scrolling functionality
  const handleRowKeyDown = (e, rowIndex) => {
    const row = e.currentTarget;
    const scrollAmount = 100; // pixels to scroll
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        row.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        break;
      case 'ArrowRight':
        e.preventDefault();
        row.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        break;
      case 'Home':
        e.preventDefault();
        row.scrollTo({ left: 0, behavior: 'smooth' });
        break;
      case 'End':
        e.preventDefault();
        row.scrollTo({ left: row.scrollWidth, behavior: 'smooth' });
        break;
    }
  };

  // Handle scroll indicators
  const handleRowScroll = (e) => {
    const row = e.currentTarget;
    if (row.scrollLeft > 0) {
      row.classList.add('scrolled');
    } else {
      row.classList.remove('scrolled');
    }
  };

  // Show loading state
  // Show loading state with standard overlay
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

  // Show error state
  if (error) {
    return (
      <Layout>
        <div className="investors-new-page">
          <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
            <p>{error}</p>
            <button onClick={loadData} style={{ marginTop: '20px', padding: '10px 20px' }}>Retry</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="investors-new-page">
        {/* Header */}
        <div className="investors-new-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">Investors</h1>
              <p className="page-subtitle">Manage investor profiles and KYC status.</p>
            </div>
            <div className="header-actions">
              {showCreateButton('investors') && (
                <>
                  <button className="add-investment-btn" onClick={() => setShowAddInvestmentModal(true)}>
                    <MdTrendingUp size={20} /> Add Investment
                  </button>
                  <button className="add-investor-btn" onClick={() => setShowAddInvestorModal(true)}>
                    <TiUserAdd size={20} /> Add Investor
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card stat-card-blue">
            <div className="stat-content">
              <p className="stat-label">Total Investors</p>
              <h2 className="stat-value">{totalInvestors}</h2>
            </div>
            <div className="stat-icon">
              <FaUsers size={24} />
            </div>
          </div>
          <div className="stat-card stat-card-green">
            <div className="stat-content">
              <p className="stat-label">KYC Completed</p>
              <h2 className="stat-value">{kycCompleted}</h2>
            </div>
            <div className="stat-icon">
              <FaCheckCircle size={24} />
            </div>
          </div>
          <div className="stat-card stat-card-yellow">
            <div className="stat-content">
              <p className="stat-label">KYC Pending</p>
              <h2 className="stat-value">{kycPending}</h2>
            </div>
            <div className="stat-icon">
              <FaClock size={24} />
            </div>
          </div>
          <div className="stat-card stat-card-red">
            <div className="stat-content">
              <p className="stat-label">KYC Rejected</p>
              <h2 className="stat-value">{kycRejected}</h2>
            </div>
            <div className="stat-icon">
              <FaTimesCircle size={24} />
            </div>
          </div>
        </div>

        {/* Header Card */}
        <div className="header-card">
          <div className="table-header">
            <div className="table-title">
              <h2>All Investors</h2>
            </div>
            <div className="table-actions">
              {/* Search Box */}
              <div className="search-box">
                <FiSearch className="search-icon" size={16} />
                <input
                  type="text"
                  placeholder="Search investors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* Export Button */}
              <button onClick={handleExport} className="export-btn">
                <MdOutlineFileDownload size={18} /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-section">

          {/* Big Card Background for Table Only */}
          <div className="big-table-card">
            <div className="perfect-table-container">
              <table className="perfect-table">
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
                {filteredInvestors.map((investor, index) => (
                  <tr 
                    key={investor.id}
                    tabIndex={0}
                    onKeyDown={(e) => handleRowKeyDown(e, index)}
                    onScroll={handleRowScroll}
                    title="Use arrow keys to scroll horizontally, Home/End for start/end"
                  >
                    <td>
                      <div className="perfect-investor-cell">
                        <div className="perfect-investor-name">{investor.name}</div>
                        <div className="perfect-investor-id">{investor.investorId}</div>
                      </div>
                    </td>
                    <td>
                      <div className="perfect-contact-cell">
                        <div className="perfect-email">{investor.email}</div>
                        <div className="perfect-phone">{investor.phone}</div>
                      </div>
                    </td>
                    <td>
                      <div 
                        className="perfect-series-cell"
                        ref={(el) => {
                          if (el && investor.series && investor.series.length > 3) {
                            el.classList.add('has-scroll');
                          }
                        }}
                      >
                        {(() => {
                          if (import.meta.env.DEV) { console.log(`🔍 DEBUG: Investor ${investor.name}:`, {
                            hasSeries: !!investor.series,
                            seriesLength: investor.series?.length || 0,
                            seriesData: investor.series,
                            seriesType: typeof investor.series
                          }); }
                          
                          // Simple, robust rendering
                          if (!investor.series || !Array.isArray(investor.series) || investor.series.length === 0) {
                            return <span className="perfect-no-series">No Series</span>;
                          }
                          
                          return investor.series.map((seriesName, idx) => {
                            if (import.meta.env.DEV) { console.log(`🔍 Rendering series ${idx}:`, seriesName); }
                            return (
                              <div 
                                key={idx} 
                                className="perfect-series-tag clickable-series-tag"
                                onClick={() => handleSeriesClick(seriesName)}
                                title={`View ${seriesName} details`}
                              >
                                {seriesName || 'Unknown Series'}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </td>
                    <td>
                      <div className="perfect-investment-cell">
                        ₹{investor.investment.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <div className="perfect-status-cell">
                        {investor.status === 'deleted' ? (
                          <span className="perfect-status-badge deleted">DELETED</span>
                        ) : (
                          <span className={`perfect-status-badge ${investor.kycStatus.toLowerCase()}`}>
                            {investor.kycStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="perfect-date-cell">{investor.dateJoined}</div>
                    </td>
                    <td>
                      <div className="perfect-actions-cell">
                        <button
                          className="perfect-view-btn"
                          onClick={() => navigate(`/investors/${investor.investorId || investor.investor_id}`)}
                        >
                          <FaEye size={14} /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
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
                
                {/* Investor ID - FIRST FIELD */}
                <div className="form-section">
                  <h3 className="section-title">Investor Identification</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Investor ID* <span className="field-hint">(Unique identifier - e.g., INV001, INV002)</span></label>
                      <input
                        type="text"
                        value={formData.investorId}
                        onChange={(e) => setFormData({ ...formData, investorId: e.target.value.toUpperCase() })}
                        required
                        placeholder="Enter unique Investor ID (e.g., INV001)"
                        maxLength="20"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>
                </div>
                
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

        {/* Investor Details Modal - Rebuilt from scratch */}
        {showInvestorDetails && selectedInvestor && (
          <div className="modal-overlay" onClick={handleCloseInvestorDetails}>
            <div className="modal-content investor-details-modal-new" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Investor Details</h2>
                <button className="close-button" onClick={handleCloseInvestorDetails}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="investor-info-header-new">
                  <div className="investor-name-section-new">
                    <h3>{selectedInvestor.name}</h3>
                    <span className="investor-id-display-new">{selectedInvestor.investorId}</span>
                  </div>
                  <span className={`kyc-status-badge-new kyc-${selectedInvestor.kycStatus.toLowerCase()}`}>
                    {selectedInvestor.kycStatus}
                  </span>
                </div>

                <div className="investor-details-grid-new">
                  <div className="detail-card-new">
                    <div className="detail-header-new">
                      <HiOutlineMail className="detail-icon-new" />
                      <span className="detail-title-new">Email</span>
                    </div>
                    <div className="detail-content-new">{selectedInvestor.email}</div>
                  </div>
                  
                  <div className="detail-card-new">
                    <div className="detail-header-new">
                      <HiOutlinePhone className="detail-icon-new" />
                      <span className="detail-title-new">Phone</span>
                    </div>
                    <div className="detail-content-new">{selectedInvestor.phone}</div>
                  </div>
                  
                  <div className="detail-card-new">
                    <div className="detail-header-new">
                      <HiOutlineCalendar className="detail-icon-new" />
                      <span className="detail-title-new">Date Joined</span>
                    </div>
                    <div className="detail-content-new">{selectedInvestor.dateJoined}</div>
                  </div>
                  
                  <div className="detail-card-new">
                    <div className="detail-header-new">
                      <MdCurrencyRupee className="detail-icon-new" />
                      <span className="detail-title-new">Current Investment</span>
                    </div>
                    <div className="detail-content-new investment-amount-new">₹{selectedInvestor.investment.toLocaleString('en-IN')}</div>
                  </div>
                  
                  <div className="detail-card-new full-width-new">
                    <div className="detail-header-new">
                      <HiOutlineChartBar className="detail-icon-new" />
                      <span className="detail-title-new">Active Series</span>
                    </div>
                    <div className="series-tags-new">
                      {selectedInvestor.series.map((series, index) => (
                        <span key={index} className="series-tag-new">{series}</span>
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
                {/* Series Search Bar */}
                <div className="series-search-section">
                  <div className="search-input-wrapper">
                    <FiSearch size={16} className="search-icon" />
                    <input
                      type="text"
                      value={seriesSearchTerm}
                      onChange={(e) => setSeriesSearchTerm(e.target.value)}
                      placeholder="Search series by name or ID..."
                      className="series-search-input"
                    />
                    {seriesSearchTerm && (
                      <button 
                        className="clear-search-btn"
                        onClick={() => setSeriesSearchTerm('')}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {filteredSeriesForInvestment.length > 0 ? (
                  <div className="series-selection-container">
                    <div className="series-selection-header">
                      <h3>Investment Opportunities</h3>
                      <p>Select a series to invest in.</p>
                    </div>
                    
                    <div className="series-cards-grid">
                      {filteredSeriesForInvestment.map((series) => {
                        const progress = (series.fundsRaised / series.targetAmount) * 100;
                        return (
                          <div key={series.id} className="investment-series-card" onClick={() => handleSeriesSelect(series)}>
                            <div className="series-card-header">
                              <div className="series-title-section">
                                <h4 className="series-title">{series.name}</h4>
                                {/* All series are accepting investments */}
                                <span className="series-status-badge accepting">
                                  ✓ Accepting Investments
                                </span>
                              </div>
                              <div className="series-interest-rate">
                                <span className="rate-value">{series.interestRate}%</span>
                                <span className="rate-label">Interest Rate</span>
                              </div>
                            </div>
                            
                            <div className="series-card-body">
                              <div className="series-info-grid">
                                <div className="info-item">
                                  <span className="info-label">Frequency</span>
                                  <span className="info-value">{series.interestFrequency}</span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Min Investment</span>
                                  <span className="info-value">₹{series.minInvestment.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Subscription Period</span>
                                  <span className="info-value subscription-dates">
                                    {series.subscriptionStartDate} to {series.subscriptionEndDate}
                                  </span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Maturity Date</span>
                                  <span className="info-value">{series.maturityDate}</span>
                                </div>
                              </div>
                              
                              <div className="funding-progress-section">
                                <div className="progress-header">
                                  <span className="progress-label">Funding Progress</span>
                                  <span className="progress-percentage">{progress.toFixed(1)}%</span>
                                </div>
                                <div className="progress-bar-container">
                                  <div className="progress-bar-track">
                                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                                  </div>
                                </div>
                                <div className="progress-amounts">
                                  <span className="raised-amount">₹{series.fundsRaised.toLocaleString('en-IN')} raised</span>
                                  <span className="target-amount">₹{series.targetAmount.toLocaleString('en-IN')} target</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="series-card-footer">
                              {/* Backend only returns series accepting investments */}
                              <button className="invest-now-button">
                                <span>Invest Now</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="no-series-found">
                    <div className="no-results-icon">🔍</div>
                    <h4>No Series Found</h4>
                    {seriesSearchTerm ? (
                      <div>
                        <p>No series found matching "{seriesSearchTerm}"</p>
                        <button 
                          className="clear-search-button"
                          onClick={() => setSeriesSearchTerm('')}
                        >
                          Clear Search
                        </button>
                      </div>
                    ) : (
                      <p>No series are currently available.</p>
                    )}
                  </div>
                )}
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
                  <button 
                    className="cancel-button" 
                    onClick={handleCloseInvestmentForm}
                    disabled={isSubmittingInvestment}
                  >
                    Cancel
                  </button>
                  <button 
                    className="invest-button" 
                    onClick={handleInvestmentSubmit}
                    disabled={isSubmittingInvestment}
                    style={{
                      opacity: isSubmittingInvestment ? 0.7 : 1,
                      cursor: isSubmittingInvestment ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmittingInvestment ? (
                      <>
                        <span className="button-spinner"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        Invest ₹{investmentAmount ? parseInt(investmentAmount).toLocaleString('en-IN') : '0'}
                      </>
                    )}
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

