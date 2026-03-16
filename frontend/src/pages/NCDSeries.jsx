import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import auditService from '../services/auditService';
import apiService from '../services/api';
import Layout from '../components/Layout';
import LoadingOverlay from '../components/LoadingOverlay';
import Lottie from 'lottie-react';
import loadingDotsAnimation from '../assets/animations/loading-dots-blue.json';
import growthChartAnimation from '../assets/animations/growth-chart.json';
import { getUserFriendlyError } from '../utils/errorHandler';
import './NCDSeries.css';
import { HiOutlineEye, HiOutlineTrash } from "react-icons/hi";
import { HiOutlineDocumentText } from "react-icons/hi";

const NCDSeries = () => {
  const navigate = useNavigate();
  const { showCreateButton, canEdit, canDelete } = usePermissions();
  const { user } = useAuth();
  const { addAuditLog, forceSeriesRefresh } = useData(); // Get forceSeriesRefresh to refresh DataContext
  const toast = useToast();
  
  // Local state for series data (fetched from backend)
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState(null);
  const [showCreatingAnimation, setShowCreatingAnimation] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    seriesCode: '',
    interestRate: '',
    interestFrequency: 'Non-cumulative & Monthly',
    interestPaymentDay: '',  // FIXED: Empty by default, not 15
    issueDate: '',
    maturityDate: '',
    tenure: '',
    subscriptionStartDate: '',
    subscriptionEndDate: '',
    seriesStartDate: '',  // NEW FIELD
    faceValue: '',
    minInvestment: '',
    targetAmount: '',
    creditRating: '',
    lockInDate: '',
    releaseOption: 'now',
    releaseDate: '',
    securityType: 'Secured',
    totalIssueSize: '',
    status: 'DRAFT',
    description: '',
    debentureTrusteeName: '',
    investorsSize: '',
    minSubscriptionPercentage: '',
    termSheet: null,
    offerDocument: null,
    boardResolution: null
  });

  // FIXED: Proper handleChange function to prevent cursor jumping
  const handleChange = React.useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (day) => {
    if (!day) return '';
    const j = day % 10;
    const k = day % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  // Fetch series from backend API
  const fetchSeries = async () => {
    try {
      const seriesData = await apiService.getSeries();
      
      // Transform backend format (snake_case) to frontend format (camelCase)
      const transformedSeries = seriesData.map(s => ({
        id: s.id,
        name: s.name,
        seriesCode: s.series_code,
        securityType: s.security_type,
        status: s.status,
        debentureTrustee: s.debenture_trustee_name,
        investorsSize: s.investors_size,
        issueDate: s.issue_date,
        tenure: s.tenure,
        maturityDate: s.maturity_date,
        lockInDate: s.lock_in_date,
        subscriptionStartDate: s.subscription_start_date,
        subscriptionEndDate: s.subscription_end_date,
        seriesStartDate: s.series_start_date,  // NEW FIELD
        releaseDate: s.release_date,
        minSubscriptionPercentage: s.min_subscription_percentage,
        faceValue: s.face_value,
        minInvestment: s.min_investment,
        targetAmount: s.target_amount,
        totalIssueSize: s.total_issue_size,
        interestRate: s.interest_rate,
        interestPaymentDay: s.interest_payment_day,  // NEW FIELD - Interest payment day
        creditRating: s.credit_rating,
        interestFrequency: s.interest_frequency,
        description: s.description,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        createdBy: s.created_by,
        isActive: s.is_active,
        fundsRaised: s.funds_raised || 0,
        progressPercentage: s.progress_percentage || 0,
        investors: s.investor_count || 0  // FIXED: Use investor_count from backend
      }));
      setSeries(transformedSeries);
      
      // Set loading to false after data is loaded
      setLoading(false);
      
    } catch (error) {
      const friendlyError = getUserFriendlyError(error, 'Failed to load series data. Please refresh the page.');
      toast.error(friendlyError, 'Failed to Load Series');
      
      // Set loading to false even on error
      setLoading(false);
    }
  };

  // Track minimum load time
  const [minLoadTimeComplete, setMinLoadTimeComplete] = React.useState(false);

  // Load series on component mount
  React.useEffect(() => {
    fetchSeries();
  }, []);

  // Minimum loading time of 1401ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadTimeComplete(true);
    }, 1401);
    return () => clearTimeout(timer);
  }, []);

  // Hide loader only when BOTH conditions are met:
  // 1. Minimum 1401ms has passed
  // 2. Series data has been fetched
  React.useEffect(() => {
    if (minLoadTimeComplete && !loading) {
      // Data is already loaded (fetchSeries sets loading to false)
      // Just ensure loader is hidden
    }
  }, [minLoadTimeComplete, loading]);

  // REMOVED: Frontend status calculation - use backend status directly
  // Backend automatically updates status based on dates
  const getSeriesStatus = (s) => {
    // Simply return the status from backend - it's already calculated correctly
    return s.status;
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  // Helper function to format date from backend (YYYY-MM-DD or date object) to DD/MM/YYYY
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    try {
      // If it's already a string in DD/MM/YYYY format, return as is
      if (typeof dateValue === 'string' && dateValue.includes('/')) {
        return dateValue;
      }
      
      // If it's a string in YYYY-MM-DD format, convert to DD/MM/YYYY
      if (typeof dateValue === 'string' && dateValue.includes('-')) {
        const [year, month, day] = dateValue.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // If it's a Date object, format it
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      
      return 'N/A';
    } catch (error) {
      return 'N/A';
    }
  };

  const getStatusInfo = (s) => {
    const status = getSeriesStatus(s);
    
    switch (status) {
      case 'DRAFT':
        return { status: 'draft', label: 'Yet to be approved', color: 'gray' };
      case 'upcoming':
        return { status: 'upcoming', label: 'Releasing soon', color: 'orange' };
      case 'accepting':
        return { status: 'accepting', label: 'Accepting investments', color: 'blue' };
      case 'active':
        return { status: 'active', label: 'Active', color: 'green' };
      case 'matured':
        return { status: 'matured', label: 'Matured', color: 'gray' };
      default:
        return { status: 'unknown', label: 'Unknown', color: 'gray' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that all 3 documents are uploaded
    if (!formData.termSheet || !formData.offerDocument || !formData.boardResolution) {
      toast.warning('Please upload all required documents (Term Sheet, Offer Document, and Board Resolution)', 'Missing Documents');
      return;
    }
    
    // Show creating animation
    setShowCreatingAnimation(true);
    
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Convert date to YYYY-MM-DD string format for backend
    const formatDateForBackend = (dateStr) => {
      if (!dateStr) return null;
      
      // If already in YYYY-MM-DD format, return as is
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      
      // Parse and format the date
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return null;
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    };
    
    const seriesData = {
      name: formData.name,
      series_code: formData.seriesCode,
      security_type: formData.securityType,
      status: 'DRAFT', // Always start as DRAFT
      debenture_trustee_name: formData.debentureTrusteeName,
      investors_size: parseInt(formData.investorsSize),
      issue_date: String(formatDateForBackend(formData.issueDate)),
      tenure: parseInt(formData.tenure),
      maturity_date: String(formatDateForBackend(formData.maturityDate)),
      lock_in_date: formData.lockInDate ? String(formatDateForBackend(formData.lockInDate)) : null,
      subscription_start_date: String(formatDateForBackend(formData.subscriptionStartDate)),
      subscription_end_date: String(formatDateForBackend(formData.subscriptionEndDate)),
      series_start_date: formData.seriesStartDate ? String(formatDateForBackend(formData.seriesStartDate)) : null,
      release_date: formData.releaseOption === 'now' ? String(formatDateForBackend(new Date().toISOString())) : String(formatDateForBackend(formData.releaseDate)),
      min_subscription_percentage: parseFloat(formData.minSubscriptionPercentage),
      face_value: parseInt(formData.faceValue),
      min_investment: parseInt(formData.minInvestment),
      target_amount: parseFloat(formData.targetAmount) * 10000000, // Convert Cr to actual amount
      total_issue_size: parseFloat(formData.totalIssueSize),
      interest_rate: parseFloat(formData.interestRate),
      credit_rating: formData.creditRating,
      interest_frequency: formData.interestFrequency,
      interest_payment_day: parseInt(formData.interestPaymentDay) || 15,  // NEW FIELD
      description: formData.description,
      created_by: user ? user.name : 'Admin'
    };

    try {
      
      // Ensure ALL date fields are strings before sending
      const cleanedSeriesData = {
        ...seriesData,
        issue_date: seriesData.issue_date ? String(seriesData.issue_date) : null,
        maturity_date: seriesData.maturity_date ? String(seriesData.maturity_date) : null,
        lock_in_date: seriesData.lock_in_date ? String(seriesData.lock_in_date) : null,
        subscription_start_date: seriesData.subscription_start_date ? String(seriesData.subscription_start_date) : null,
        subscription_end_date: seriesData.subscription_end_date ? String(seriesData.subscription_end_date) : null,
        release_date: seriesData.release_date ? String(seriesData.release_date) : null
      };
      
      // Call backend API to create series in MySQL database
      const response = await apiService.createSeries(cleanedSeriesData);
      
      // Upload documents to S3 if provided
      if (formData.termSheet || formData.offerDocument || formData.boardResolution) {
        try {
          await apiService.uploadSeriesDocuments(
            response.id,  // series_id from response
            formData.termSheet,
            formData.offerDocument,
            formData.boardResolution
          );
        } catch (docError) {
          const friendlyError = getUserFriendlyError(docError, 'Failed to upload documents.');
          
          // CRITICAL: Close animation even if document upload fails
          setShowCreatingAnimation(false);
          
          toast.warning(`Series created but ${friendlyError}`, 'Partial Success');
          
          // Refresh and return early
          await fetchSeries();
          setShowCreateForm(false);
          return;
        }
      } else {
      }
      
      // CRITICAL: Close animation IMMEDIATELY after upload completes
      setShowCreatingAnimation(false);
      
      // CRITICAL: Close animation IMMEDIATELY after upload completes
      setShowCreatingAnimation(false);
      
      // Add audit log for series creation (non-blocking)
      try {
        await auditService.logSeriesCreated({
          name: formData.name,
          targetAmount: parseFloat(formData.targetAmount) * 10000000,
          interestRate: parseFloat(formData.interestRate),
          seriesCode: formData.seriesCode,
          status: 'DRAFT'
        }, user);
      } catch (auditError) {
        /* Audit log error silenced */
      }
      
      // Show success message
      toast.success(
        `Series "${formData.name}" has been created successfully${formData.termSheet || formData.offerDocument || formData.boardResolution ? ' with documents' : ''}!`,
        'Series Created'
      );
      
      // Refresh series list in this page (non-blocking)
      try {
        await fetchSeries();
      } catch (fetchError) {
        /* Fetch error silenced */
      }
      
      // CRITICAL: Refresh DataContext series data so other pages (Approval, Dashboard) see the new series
      if (forceSeriesRefresh) {
        forceSeriesRefresh();
      }
      
      // Close form and reset
      setShowCreateForm(false);
      setFormData({
        name: '',
        seriesCode: '',
        interestRate: '',
        interestFrequency: 'Non-cumulative & Monthly',
        interestPaymentDay: '',
        issueDate: '',
        maturityDate: '',
        tenure: '',
        subscriptionStartDate: '',
        subscriptionEndDate: '',
        seriesStartDate: '',
        faceValue: '',
        minInvestment: '',
        targetAmount: '',
        creditRating: '',
        lockInDate: '',
        releaseOption: 'now',
        releaseDate: '',
        securityType: 'Secured',
        totalIssueSize: '',
        status: 'DRAFT',
        description: '',
        debentureTrusteeName: '',
        investorsSize: '',
        minSubscriptionPercentage: '',
        termSheet: null,
        offerDocument: null,
        boardResolution: null
      });
      
    } catch (error) {
      // Hide creating animation on error
      setShowCreatingAnimation(false);
      const friendlyError = getUserFriendlyError(error, 'Failed to create series. Please try again.');
      toast.error(friendlyError, 'Creation Failed');
    } finally {
      // CRITICAL: Ensure animation is always closed, even if there's an error
      setShowCreatingAnimation(false);
    }
  };

  const handleFileUpload = (field, file) => {
    setFormData({ ...formData, [field]: file });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (e, field) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(field, files[0]);
    }
  };

  const handleFileInput = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(field, file);
    }
  };

  const handleDeleteClick = (series) => {
    setSeriesToDelete(series);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (seriesToDelete) {
      try {
        // Check if series can be deleted (only DRAFT and upcoming)
        const status = getSeriesStatus(seriesToDelete);
        if (status !== 'DRAFT' && status !== 'upcoming') {
          toast.error('Cannot delete active series. Only draft and upcoming series can be deleted.', 'Delete Not Allowed');
          return;
        }
        
        // Call backend API to delete series
        await apiService.deleteSeries(seriesToDelete.id);
        
        // Add audit log for series deletion using auditService
        await auditService.logSeriesDelete(seriesToDelete, user).catch(error => {
        });
        
        // Also add to local audit log for backward compatibility
        addAuditLog({
          action: 'Deleted Series',
          adminName: user ? user.name : 'Admin',
          adminRole: user ? user.displayRole : 'Admin',
          details: `Deleted NCD series "${seriesToDelete.name}" (Status: ${seriesToDelete.status})`,
          entityType: 'Series',
          entityId: seriesToDelete.name,
          changes: {
            seriesId: seriesToDelete.id,
            seriesName: seriesToDelete.name,
            status: seriesToDelete.status,
            targetAmount: seriesToDelete.targetAmount
          }
        });
        
        // Refresh series list
        await fetchSeries();
        
        setShowDeleteConfirm(false);
        setSeriesToDelete(null);
        
        toast.success(`Series "${seriesToDelete.name}" has been deleted successfully.`, 'Series Deleted');
        
      } catch (error) {
        const friendlyError = getUserFriendlyError(error, 'Failed to delete series. Please try again.');
        toast.error(friendlyError, 'Delete Failed');
      }
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setSeriesToDelete(null);
  };

  // Separate series into categories based on actual status
  const draftSeries = series.filter(s => getSeriesStatus(s) === 'DRAFT');
  const rejectedSeries = series.filter(s => s.status === 'REJECTED');
  const upcomingSeries = series.filter(s => getSeriesStatus(s) === 'upcoming');
  const acceptingSeries = series.filter(s => getSeriesStatus(s) === 'accepting');
  const activeSeries = series.filter(s => getSeriesStatus(s) === 'active');
  const maturedSeries = series.filter(s => getSeriesStatus(s) === 'matured');

  /* Diagnostic logs removed */

  return (
    <Layout>
      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ width: '200px', height: '200px' }}>
            <Lottie animationData={loadingDotsAnimation} loop={true} />
          </div>
        </div>
      )}
      
      <div className="ncd-series-page">
        <div className="series-header">
          <div>
            <h1 className="page-title">NCD Series</h1>
            <p className="page-subtitle">Manage all your non-convertible debenture series</p>
          </div>
          {showCreateButton('ncdSeries') && (
            <button 
              className="create-button"
              onClick={() => setShowCreateForm(true)}
            >
              + Create New Series
            </button>
          )}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#666' }}>
            Loading series data...
          </div>
        )}

        {/* Draft Series Section */}
        {!loading && draftSeries.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Pending Approval</h2>
              <p className="section-subtitle">Series awaiting board approval</p>
            </div>
            <div className="series-grid">
              {draftSeries.map((s) => {
                const statusInfo = getStatusInfo(s);
                const progress = (s.fundsRaised / s.targetAmount) * 100;
                return (
                  <div key={s.id} className="series-card draft-card">
                    <div className="card-banner draft-banner">
                      <div className="banner-content">
                        <div className="series-title-section">
                          <h3 className="series-name">{s.name}</h3>
                          <p className="series-code">{s.seriesCode}</p>
                        </div>
                        <div className="banner-status">
                          <span className={`status-pill ${statusInfo.color}`}>
                            {statusInfo.label.toUpperCase()}
                          </span>
                          <span className="frequency-pill">{s.interestFrequency}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rate-row">
                      <div className="interest-rate">
                        {s.interestRate}% 
                        {s.interestPaymentDay && (
                          <span style={{ fontSize: '11px', color: '#666', marginLeft: '6px', fontWeight: 'normal' }}>
                            (on {s.interestPaymentDay}{getOrdinalSuffix(s.interestPaymentDay)})
                          </span>
                        )}
                      </div>
                      <div className="investors-count">{s.investors} investors</div>
                    </div>
                    <div className="funds-progress">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${statusInfo.color}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <div className="progress-text">
                          {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                        </div>
                        <div className="trustee-name">
                          {s.debentureTrustee}
                        </div>
                      </div>
                    </div>
                    <div className="series-details">
                      <div className="detail-item">
                        <span className="detail-label">Issue Date:</span>
                        <span className="detail-value">{s.issueDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Maturity Date:</span>
                        <span className="detail-value">{s.maturityDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Face Value:</span>
                        <span className="detail-value">₹{s.faceValue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Min Investment:</span>
                        <span className="detail-value">₹{s.minInvestment.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Lock-in Date:</span>
                        <span className="detail-value">{formatDate(s.lockInDate)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Max Investors:</span>
                        <span className="detail-value">{s.investorsSize ? s.investorsSize.toLocaleString('en-IN') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="view-details-button"
                        onClick={() => navigate(`/ncd-series/${s.id}`)}
                      >
                        <HiOutlineEye size={18} />
                        <span>View Details</span>
                      </button>
                      {canDelete('ncdSeries') && (
                        <button 
                          className="delete-series-button"
                          onClick={() => handleDeleteClick(s)}
                          title="Delete Draft Series"
                        >
                          <HiOutlineTrash size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Rejected Series Section */}
        {!loading && rejectedSeries.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Rejected Series</h2>
              <p className="section-subtitle">Series that were rejected during approval</p>
            </div>
            <div className="series-grid">
              {rejectedSeries.map((s) => {
                const statusInfo = { color: 'red', label: 'Rejected' };
                const progress = (s.fundsRaised / s.targetAmount) * 100;
                return (
                  <div key={s.id} className="series-card rejected-card">
                    <div className="card-banner rejected-banner">
                      <div className="banner-content">
                        <div className="series-title-section">
                          <h3 className="series-name">{s.name}</h3>
                          <p className="series-code">{s.seriesCode}</p>
                        </div>
                        <div className="banner-status">
                          <span className={`status-pill ${statusInfo.color}`}>
                            {statusInfo.label.toUpperCase()}
                          </span>
                          <span className="frequency-pill">{s.interestFrequency}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rate-row">
                      <div className="interest-rate">
                        {s.interestRate}%
                        {s.interestPaymentDay && (
                          <span style={{ fontSize: '11px', color: '#666', marginLeft: '6px', fontWeight: 'normal' }}>
                            (on {s.interestPaymentDay}{getOrdinalSuffix(s.interestPaymentDay)})
                          </span>
                        )}
                      </div>
                      <div className="investors-count">{s.investors} investors</div>
                    </div>
                    <div className="funds-progress">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${statusInfo.color}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <div className="progress-text">
                          {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                        </div>
                        <div className="trustee-name">
                          {s.debentureTrustee}
                        </div>
                      </div>
                    </div>
                    <div className="series-details">
                      <div className="detail-item">
                        <span className="detail-label">Issue Date:</span>
                        <span className="detail-value">{s.issueDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Maturity Date:</span>
                        <span className="detail-value">{s.maturityDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Face Value:</span>
                        <span className="detail-value">₹{s.faceValue ? s.faceValue.toLocaleString('en-IN') : 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Rejected On:</span>
                        <span className="detail-value">{s.rejectedAt ? new Date(s.rejectedAt).toLocaleDateString('en-GB') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="view-details-button rejected-button"
                        onClick={() => navigate(`/ncd-series/${s.id}`)}
                      >
                        <HiOutlineEye size={16} />
                        <span>View Rejection Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Upcoming Series Section - Approved but not yet released */}
        {!loading && upcomingSeries.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Releasing Soon</h2>
              <p className="section-subtitle">Approved series awaiting release date</p>
            </div>
            <div className="series-grid">
              {upcomingSeries.map((s) => {
                const statusInfo = getStatusInfo(s);
                const progress = (s.fundsRaised / s.targetAmount) * 100;
                return (
                  <div key={s.id} className="series-card upcoming-card">
                    <div className="card-banner upcoming-banner">
                      <div className="banner-content">
                        <div className="series-title-section">
                          <h3 className="series-name">{s.name}</h3>
                          <p className="series-code">{s.seriesCode}</p>
                        </div>
                        <div className="banner-status">
                          <span className={`status-pill ${statusInfo.color}`}>
                            {statusInfo.label.toUpperCase()}
                          </span>
                          <span className="frequency-pill">{s.interestFrequency}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rate-row">
                      <div className="interest-rate">
                        {s.interestRate}%
                        {s.interestPaymentDay && (
                          <span style={{ fontSize: '11px', color: '#666', marginLeft: '6px', fontWeight: 'normal' }}>
                            (on {s.interestPaymentDay}{getOrdinalSuffix(s.interestPaymentDay)})
                          </span>
                        )}
                      </div>
                      <div className="investors-count">{s.investors} investors</div>
                    </div>
                    <div className="funds-progress">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${statusInfo.color}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <div className="progress-text">
                          {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                        </div>
                        <div className="trustee-name">
                          {s.debentureTrustee}
                        </div>
                      </div>
                    </div>
                    <div className="series-details">
                      <div className="detail-item">
                        <span className="detail-label">Issue Date:</span>
                        <span className="detail-value">{s.issueDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Maturity Date:</span>
                        <span className="detail-value">{s.maturityDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Face Value:</span>
                        <span className="detail-value">₹{s.faceValue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Min Investment:</span>
                        <span className="detail-value">₹{s.minInvestment.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Lock-in Date:</span>
                        <span className="detail-value">{formatDate(s.lockInDate)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Max Investors:</span>
                        <span className="detail-value">{s.investorsSize ? s.investorsSize.toLocaleString('en-IN') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="view-details-button"
                        onClick={() => navigate(`/ncd-series/${s.id}`)}
                      >
                        <HiOutlineEye size={18} />
                        <span>View Details</span>
                      </button>
                      {canDelete('ncdSeries') && (
                        <button 
                          className="delete-series-button"
                          onClick={() => handleDeleteClick(s)}
                          title="Delete Upcoming Series"
                        >
                          <HiOutlineTrash size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Accepting Investments Series Section - Within subscription window */}
        {!loading && acceptingSeries.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Accepting Investments</h2>
              <p className="section-subtitle">Series currently accepting new investments within subscription window</p>
            </div>
            <div className="series-grid">
              {acceptingSeries.map((s) => {
                const statusInfo = getStatusInfo(s);
                const progress = (s.fundsRaised / s.targetAmount) * 100;
                return (
                  <div key={s.id} className="series-card accepting-card">
                    <div className="card-banner accepting-banner">
                      <div className="banner-content">
                        <div className="series-title-section">
                          <h3 className="series-name">{s.name}</h3>
                          <p className="series-code">{s.seriesCode}</p>
                        </div>
                        <div className="banner-status">
                          <span className={`status-pill ${statusInfo.color}`}>
                            {statusInfo.label.toUpperCase()}
                          </span>
                          <span className="frequency-pill">{s.interestFrequency}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rate-row">
                      <div className="interest-rate">
                        {s.interestRate}%
                        {s.interestPaymentDay && (
                          <span style={{ fontSize: '11px', color: '#666', marginLeft: '6px', fontWeight: 'normal' }}>
                            (on {s.interestPaymentDay}{getOrdinalSuffix(s.interestPaymentDay)})
                          </span>
                        )}
                      </div>
                      <div className="investors-count">{s.investors} investors</div>
                    </div>
                    <div className="funds-progress">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${statusInfo.color}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <div className="progress-text">
                          {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                        </div>
                        <div className="trustee-name">
                          {s.debentureTrustee}
                        </div>
                      </div>
                    </div>
                    <div className="series-details">
                      <div className="detail-item">
                        <span className="detail-label">Subscription Start:</span>
                        <span className="detail-value">{s.subscriptionStartDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Subscription End:</span>
                        <span className="detail-value">{s.subscriptionEndDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Face Value:</span>
                        <span className="detail-value">₹{s.faceValue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Min Investment:</span>
                        <span className="detail-value">₹{s.minInvestment.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Lock-in Date:</span>
                        <span className="detail-value">{formatDate(s.lockInDate)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Max Investors:</span>
                        <span className="detail-value">{s.investorsSize ? s.investorsSize.toLocaleString('en-IN') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="view-details-button"
                        onClick={() => navigate(`/ncd-series/${s.id}`)}
                      >
                        <HiOutlineEye size={18} />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Active Series Section */}
        {!loading && activeSeries.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Currently Running</h2>
            </div>
            <div className="series-grid">
              {activeSeries.map((s) => {
                const statusInfo = getStatusInfo(s);
                const progress = (s.fundsRaised / s.targetAmount) * 100;
                return (
                  <div key={s.id} className="series-card">
                    <div className="card-banner">
                      <div className="banner-content">
                        <div className="series-title-section">
                          <h3 className="series-name">{s.name}</h3>
                          <p className="series-code">{s.seriesCode}</p>
                        </div>
                        <div className="banner-status">
                          <span className={`status-pill ${statusInfo.color}`}>
                            {statusInfo.label.toUpperCase()}
                          </span>
                          <span className="frequency-pill">{s.interestFrequency}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rate-row">
                      <div className="interest-rate">
                        {s.interestRate}%
                        {s.interestPaymentDay && (
                          <span style={{ fontSize: '11px', color: '#666', marginLeft: '6px', fontWeight: 'normal' }}>
                            (on {s.interestPaymentDay}{getOrdinalSuffix(s.interestPaymentDay)})
                          </span>
                        )}
                      </div>
                      <div className="investors-count">{s.investors} investors</div>
                    </div>
                    <div className="funds-progress">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${statusInfo.color}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <div className="progress-text">
                          {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                        </div>
                        <div className="trustee-name">
                          {s.debentureTrustee}
                        </div>
                      </div>
                    </div>
                    <div className="series-details">
                      <div className="detail-item">
                        <span className="detail-label">Issue Date:</span>
                        <span className="detail-value">{s.issueDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Maturity Date:</span>
                        <span className="detail-value">{s.maturityDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Face Value:</span>
                        <span className="detail-value">₹{s.faceValue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Min Investment:</span>
                        <span className="detail-value">₹{s.minInvestment.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Lock-in Date:</span>
                        <span className="detail-value">{formatDate(s.lockInDate)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Max Investors:</span>
                        <span className="detail-value">{s.investorsSize ? s.investorsSize.toLocaleString('en-IN') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="view-details-button"
                        onClick={() => navigate(`/ncd-series/${s.id}`)}
                      >
                        <HiOutlineEye size={18} />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Matured Series Section */}
        {!loading && maturedSeries.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Matured Series</h2>
              <p className="section-subtitle">Series that have completed their maturity period</p>
            </div>
            <div className="series-grid">
              {maturedSeries.map((s) => {
                const statusInfo = { status: 'matured', label: 'Matured', color: 'gray' };
                const progress = 100; // Matured series are 100% complete
                return (
                  <div key={s.id} className="series-card matured-card">
                    <div className="card-banner matured-banner">
                      <div className="banner-content">
                        <div className="series-title-section">
                          <h3 className="series-name">{s.name}</h3>
                          <p className="series-code">{s.seriesCode}</p>
                        </div>
                        <div className="banner-status">
                          <span className={`status-pill ${statusInfo.color}`}>
                            {statusInfo.label.toUpperCase()}
                          </span>
                          <span className="frequency-pill">{s.interestFrequency}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rate-row">
                      <div className="interest-rate">
                        {s.interestRate}%
                        {s.interestPaymentDay && (
                          <span style={{ fontSize: '11px', color: '#666', marginLeft: '6px', fontWeight: 'normal' }}>
                            (on {s.interestPaymentDay}{getOrdinalSuffix(s.interestPaymentDay)})
                          </span>
                        )}
                      </div>
                      <div className="investors-count">{s.investors} investors</div>
                    </div>
                    <div className="funds-progress">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${statusInfo.color}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <div className="progress-text">
                          {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                        </div>
                        <div className="trustee-name">
                          {s.debentureTrustee}
                        </div>
                      </div>
                    </div>
                    <div className="series-details">
                      <div className="detail-item">
                        <span className="detail-label">Issue Date:</span>
                        <span className="detail-value">{s.issueDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Maturity Date:</span>
                        <span className="detail-value">{s.maturityDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Face Value:</span>
                        <span className="detail-value">₹{s.faceValue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Min Investment:</span>
                        <span className="detail-value">₹{s.minInvestment.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Lock-in Date:</span>
                        <span className="detail-value">{formatDate(s.lockInDate)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Max Investors:</span>
                        <span className="detail-value">{s.investorsSize ? s.investorsSize.toLocaleString('en-IN') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="view-details-button matured-button"
                        onClick={() => navigate(`/ncd-series/${s.id}`)}
                      >
                        <HiOutlineEye size={18} />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {showCreateForm && (
          <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add New NCD Series</h2>
                <button 
                  className="close-button"
                  onClick={() => setShowCreateForm(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="create-form">
                {/* Basic Information Section */}
                <div className="form-section">
                  <h3 className="form-section-title">Basic Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Series Name*</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Enter series name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Series Code*</label>
                      <input
                        type="text"
                        value={formData.seriesCode}
                        onChange={(e) => setFormData({ ...formData, seriesCode: e.target.value })}
                        required
                        placeholder="Enter series code"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Security Type*</label>
                      <select
                        value={formData.securityType}
                        onChange={(e) => setFormData({ ...formData, securityType: e.target.value })}
                        required
                      >
                        <option value="Secured">Secured</option>
                        <option value="Unsecured">Unsecured</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status*</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        required
                      >
                        <option value="DRAFT">DRAFT</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Debenture Trustee Name*</label>
                      <input
                        type="text"
                        value={formData.debentureTrusteeName}
                        onChange={(e) => setFormData({ ...formData, debentureTrusteeName: e.target.value })}
                        required
                        placeholder="Enter debenture trustee name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Investors Size*</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.investorsSize}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          handleChange('investorsSize', value);
                        }}
                        required
                        placeholder="Enter expected number of investors"
                      />
                    </div>
                  </div>
                </div>

                {/* Date & Tenure Information */}
                <div className="form-section">
                  <h3 className="form-section-title">Date & Tenure Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Issue Date*</label>
                      <input
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => handleChange('issueDate', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Tenure (months)*</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.tenure}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          handleChange('tenure', value);
                        }}
                        required
                        placeholder="Enter tenure in months"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Maturity Date*</label>
                      <input
                        type="date"
                        value={formData.maturityDate}
                        onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Lock-in Date</label>
                      <input
                        type="date"
                        value={formData.lockInDate}
                        onChange={(e) => setFormData({ ...formData, lockInDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription Information */}
                <div className="form-section">
                  <h3 className="form-section-title">Subscription Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Subscription Start Date*</label>
                      <input
                        type="date"
                        value={formData.subscriptionStartDate}
                        onChange={(e) => setFormData({ ...formData, subscriptionStartDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Subscription End Date*</label>
                      <input
                        type="date"
                        value={formData.subscriptionEndDate}
                        onChange={(e) => setFormData({ ...formData, subscriptionEndDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Series Start Date*</label>
                      <input
                        type="date"
                        value={formData.seriesStartDate}
                        onChange={(e) => handleChange('seriesStartDate', e.target.value)}
                        required
                      />
                      <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        Date when the series officially starts (between subscription start and end)
                      </small>
                    </div>
                    <div className="form-group">
                      <label>Minimum Subscription of Issue Size (%)*</label>
                      <input
                        type="text"
                        value={formData.minSubscriptionPercentage}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow only numbers and one decimal point
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            // Validate range (0-100)
                            const numValue = parseFloat(value);
                            if (value === '' || (numValue >= 0 && numValue <= 100)) {
                              handleChange('minSubscriptionPercentage', value);
                            }
                          }
                        }}
                        required
                        placeholder="Enter minimum subscription percentage (0-100)"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="form-section">
                  <h3 className="form-section-title">Financial Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Face Value (₹)*</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.faceValue}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          handleChange('faceValue', value);
                        }}
                        required
                        placeholder="Enter face value (e.g., 1000)"
                      />
                    </div>
                    <div className="form-group">
                      <label>Minimum Investment (₹)*</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.minInvestment}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          handleChange('minInvestment', value);
                        }}
                        required
                        placeholder="Enter minimum investment"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Target Amount (Cr)*</label>
                      <div className="input-with-suffix">
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          value={formData.targetAmount}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            // Prevent multiple decimal points
                            const parts = value.split('.');
                            const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value;
                            handleChange('targetAmount', formatted);
                          }}
                          required
                          placeholder=""
                        />
                        <span className="input-suffix">Cr</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Total Issue Size*</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.totalIssueSize}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          handleChange('totalIssueSize', value);
                        }}
                        required
                        placeholder="Enter total issue size (in units)"
                      />
                    </div>
                  </div>
                </div>

                {/* Interest & Rating Information */}
                <div className="form-section">
                  <h3 className="form-section-title">Interest & Rating Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Interest Rate (%)*</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        value={formData.interestRate}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          // Prevent multiple decimal points
                          const parts = value.split('.');
                          const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value;
                          handleChange('interestRate', formatted);
                        }}
                        required
                        placeholder="Enter interest rate"
                      />
                    </div>
                    <div className="form-group">
                      <label>Credit Rating*</label>
                      <select 
                        value={formData.creditRating}
                        onChange={(e) => handleChange('creditRating', e.target.value)}
                        required
                      >
                        <option value="">Select Rating</option>
                        <option value="AAA">AAA</option>
                        <option value="AA+">AA+</option>
                        <option value="AA">AA</option>
                        <option value="AA-">AA-</option>
                        <option value="A+">A+</option>
                        <option value="A">A</option>
                        <option value="A-">A-</option>
                        <option value="BBB+">BBB+</option>
                        <option value="BBB">BBB</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Non-cumulative & Monthly*</label>
                      <select
                        value={formData.interestFrequency}
                        onChange={(e) => handleChange('interestFrequency', e.target.value)}
                        required
                      >
                        <option value="Non-cumulative & Monthly">Non-cumulative & Monthly</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Interest Payment Day*</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.interestPaymentDay}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          // Validate day is between 1-31
                          const numValue = parseInt(value);
                          if (value === '' || (numValue >= 1 && numValue <= 31)) {
                            handleChange('interestPaymentDay', value);
                          }
                        }}
                        placeholder="Day of month (1-31)"
                        required
                      />
                      <small className="field-hint">Day of the month when interest is paid (e.g., 15 for 15th)</small>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="form-section">
                  <h3 className="form-section-title">Additional Information</h3>
                  <div className="form-group">
                    <label>Description / Notes</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="4"
                      placeholder="Enter any additional notes or description"
                    />
                  </div>
                </div>

                {/* Upload Documents section - keeping unchanged as requested */}
                <div className="upload-section">
                  <h3>Upload Documents</h3>
                  
                  <div className="form-group">
                    <label>Term Sheet*</label>
                    <div 
                      className="file-upload-area"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'termSheet')}
                      onClick={() => document.getElementById('termSheet').click()}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="upload-content">
                        <HiOutlineDocumentText size={24} />
                        <div className="upload-text">
                          <p>Click to upload or drag and drop file here</p>
                          <p className="file-limit">Limit 200MB per file • PDF</p>
                        </div>
                        <input
                          type="file"
                          id="termSheet"
                          accept=".pdf"
                          onChange={(e) => handleFileInput(e, 'termSheet')}
                          style={{ display: 'none' }}
                        />
                      </div>
                      {formData.termSheet && (
                        <div className="file-selected">
                          <span>âœ“ {formData.termSheet.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Offer Document*</label>
                    <div 
                      className="file-upload-area"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'offerDocument')}
                      onClick={() => document.getElementById('offerDocument').click()}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="upload-content">
                        <HiOutlineDocumentText size={24} />
                        <div className="upload-text">
                          <p>Click to upload or drag and drop file here</p>
                          <p className="file-limit">Limit 200MB per file • PDF</p>
                        </div>
                        <input
                          type="file"
                          id="offerDocument"
                          accept=".pdf"
                          onChange={(e) => handleFileInput(e, 'offerDocument')}
                          style={{ display: 'none' }}
                        />
                      </div>
                      {formData.offerDocument && (
                        <div className="file-selected">
                          <span>âœ“ {formData.offerDocument.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Board Resolution*</label>
                    <div 
                      className="file-upload-area"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'boardResolution')}
                      onClick={() => document.getElementById('boardResolution').click()}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="upload-content">
                        <HiOutlineDocumentText size={24} />
                        <div className="upload-text">
                          <p>Click to upload or drag and drop file here</p>
                          <p className="file-limit">Limit 200MB per file • PDF</p>
                        </div>
                        <input
                          type="file"
                          id="boardResolution"
                          accept=".pdf"
                          onChange={(e) => handleFileInput(e, 'boardResolution')}
                          style={{ display: 'none' }}
                        />
                      </div>
                      {formData.boardResolution && (
                        <div className="file-selected">
                          <span>âœ“ {formData.boardResolution.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    Save Series
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && seriesToDelete && (
          <div className="modal-overlay" onClick={handleDeleteCancel}>
            <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Delete Series</h3>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{seriesToDelete.name}</strong>?</p>
                <p className="warning-text">This action cannot be undone.</p>
              </div>
              <div className="modal-actions">
                <button 
                  className="cancel-button"
                  onClick={handleDeleteCancel}
                >
                  Cancel
                </button>
                <button 
                  className="delete-confirm-button"
                  onClick={handleDeleteConfirm}
                >
                  <HiOutlineTrash size={16} />
                  Delete Series
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Growth Chart Animation Overlay for Series Creation */}
        {showCreatingAnimation && (
          <>
            {/* Background Blur Overlay */}
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 99998
            }} />
            
            {/* Animation Card */}
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 99999,
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4)',
              border: '1px solid #e2e8f0',
              width: '550px',
              overflow: 'hidden',
              animation: 'greetingEnter 0.5s ease-out'
            }}>
              <div style={{
                padding: '32px 48px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
              }}>
                {/* Lottie Animation */}
                <div style={{ width: '240px', height: '240px' }}>
                  <Lottie
                    animationData={growthChartAnimation}
                    loop={true}
                    autoplay={true}
                    speed={0.5}
                    style={{ 
                      width: '100%', 
                      height: '100%'
                    }}
                  />
                </div>
                
                {/* Text Content */}
                <div style={{
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#000000',
                    margin: 0
                  }}>
                    Creating New Series
                  </h2>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#64748b',
                    margin: 0
                  }}>
                    {formData.name}
                  </p>
                </div>
                
                {/* Loading Dots */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center',
                  marginTop: '8px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: '0s'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: '0.2s'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: '0.4s'
                  }}></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default NCDSeries;


