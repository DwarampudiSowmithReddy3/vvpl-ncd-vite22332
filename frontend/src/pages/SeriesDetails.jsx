import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import apiService from '../services/api';
import './SeriesDetails.css';
import '../styles/loading.css';
import { 
  HiArrowLeft,
  HiOutlineCalendar,
  HiCheckCircle
} from 'react-icons/hi';
import { 
  MdOutlineFileDownload,
  MdCurrencyRupee,
  MdAccountBalance,
  MdInfo,
  MdAdd
} from 'react-icons/md';
import { 
  FiUsers,
  FiPercent,
  FiTrendingUp,
  FiLock,
  FiCalendar
} from 'react-icons/fi';
import pdfTemplateService from '../utils/pdfTemplateService';

const SeriesDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { series = [], investors = [], addAuditLog, addInvestorDocument, getInvestorDocuments, forceSeriesRefresh } = useData();
  const { user } = useAuth();
  const [showFundsModal, setShowFundsModal] = useState(false);
  const [showInvestorsModal, setShowInvestorsModal] = useState(false);
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [selectedInvestorForUpload, setSelectedInvestorForUpload] = useState(null);
  const [uploadDocuments, setUploadDocuments] = useState({
    form15G: null,
    form15H: null,
    bondPaper: null
  });
  const [seriesInvestors, setSeriesInvestors] = useState([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);
  
  // NEW: State for series display data (Lock-in Date and Subscription Period)
  // ALL DATA FROM BACKEND - NO FRONTEND LOGIC
  const [seriesDisplayData, setSeriesDisplayData] = useState(null);
  const [loadingDisplayData, setLoadingDisplayData] = useState(false);
  
  // NEW: State for series insights (Lock-in and Maturity details)
  // ALL CALCULATIONS IN BACKEND - NO FRONTEND LOGIC
  const [seriesInsights, setSeriesInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // NEW: State for upcoming payouts (Payout Schedule section)
  // ALL DATA FROM BACKEND - NO FRONTEND LOGIC, NO LOCALSTORAGE
  const [upcomingPayouts, setUpcomingPayouts] = useState(null);
  const [loadingUpcomingPayouts, setLoadingUpcomingPayouts] = useState(false);

  // NEW: State for recent payouts (Recent Transactions section)
  // ALL DATA FROM BACKEND - NO FRONTEND LOGIC
  const [recentPayouts, setRecentPayouts] = useState(null);
  const [loadingRecentPayouts, setLoadingRecentPayouts] = useState(false);

  // CRITICAL: Force refresh series data when component mounts to ensure data is available
  React.useEffect(() => {
    if (import.meta.env.DEV) { console.log(`📊 [SeriesDetails] Component mounted for series ID: ${id}`); }
    if (import.meta.env.DEV) { console.log(`📊 [SeriesDetails] Current series array length: ${series.length}`); }
    
    if (forceSeriesRefresh) {
      if (import.meta.env.DEV) { console.log(`🔄 [SeriesDetails] Triggering series refresh...`); }
      forceSeriesRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only run when ID changes, not when forceSeriesRefresh changes

  // Fetch investors for this series from backend
  React.useEffect(() => {
    const fetchSeriesInvestors = async () => {
      if (!id) return;
      
      try {
        setLoadingInvestors(true);
        if (import.meta.env.DEV) { console.log(`📊 Fetching investors for series ID: ${id}`); }
        const response = await apiService.getSeriesInvestors(id);
        if (import.meta.env.DEV) { console.log(`✅ Fetched ${response.investors.length} investors:`, response.investors); }
        setSeriesInvestors(response.investors || []);
      } catch (error) {
        if (import.meta.env.DEV) { console.error('❌ Error fetching series investors:', error); }
        setSeriesInvestors([]);
      } finally {
        setLoadingInvestors(false);
      }
    };

    fetchSeriesInvestors();
  }, [id]);

  // NEW: Fetch series display data from backend (Lock-in Date and Subscription Period)
  // ALL LOGIC IN BACKEND - Frontend only displays
  React.useEffect(() => {
    const fetchSeriesDisplayData = async () => {
      if (!id) return;
      
      try {
        setLoadingDisplayData(true);
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.log(`📊 [${new Date().toISOString()}] Fetching series display data for series ID: ${id}`); }

        }
        const displayData = await apiService.getSeriesDisplayData(id);
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.log(`✅ [${new Date().toISOString()}] Fetched series display data:`, displayData); }

        }
        setSeriesDisplayData(displayData);
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.log(`✅ [${new Date().toISOString()}] seriesDisplayData state updated`); }

        }
      } catch (error) {
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.error(`❌ [${new Date().toISOString()}] Error fetching series display data:`, error); }

        }
        setSeriesDisplayData(null);
      } finally {
        setLoadingDisplayData(false);
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.log(`✅ [${new Date().toISOString()}] loadingDisplayData set to false`); }

        }
      }
    };

    fetchSeriesDisplayData();
  }, [id]);

  // NEW: Fetch series insights from backend (Lock-in and Maturity details)
  // ALL CALCULATIONS IN BACKEND - Frontend only displays
  React.useEffect(() => {
    const fetchSeriesInsights = async () => {
      if (!id) return;
      
      try {
        setLoadingInsights(true);
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.log(`📊 [${new Date().toISOString()}] Fetching series insights for series ID: ${id}`); }

        }
        const insights = await apiService.getSeriesInsights(id);
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.log(`✅ [${new Date().toISOString()}] Fetched series insights:`, insights); }

        }
        setSeriesInsights(insights);
      } catch (error) {
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.error(`❌ [${new Date().toISOString()}] Error fetching series insights:`, error); }

        }
        setSeriesInsights(null);
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchSeriesInsights();
  }, [id]);

  // NEW: Fetch upcoming payouts from backend (Payout Schedule section)
  // ALL LOGIC IN BACKEND - Frontend only displays
  React.useEffect(() => {
    const fetchUpcomingPayouts = async () => {
      if (!id) return;
      
      try {
        setLoadingUpcomingPayouts(true);
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.log(`📊 [${new Date().toISOString()}] Fetching upcoming payouts for series ID: ${id}`); }

        }
        const payoutsData = await apiService.getSeriesUpcomingPayouts(id);
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.log(`✅ [${new Date().toISOString()}] Fetched upcoming payouts:`, payoutsData); }

        }
        setUpcomingPayouts(payoutsData);
      } catch (error) {
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.error(`❌ [${new Date().toISOString()}] Error fetching upcoming payouts:`, error); }

        }
        setUpcomingPayouts(null);
      } finally {
        setLoadingUpcomingPayouts(false);
      }
    };

    fetchUpcomingPayouts();
  }, [id]);

  // NEW: Fetch recent payouts from backend (Recent Transactions section)
  // ALL LOGIC IN BACKEND - Frontend only displays
  React.useEffect(() => {
    const fetchRecentPayouts = async () => {
      if (!id) return;
      
      try {
        setLoadingRecentPayouts(true);
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.log(`📊 [${new Date().toISOString()}] Fetching recent payouts for series ID: ${id}`); }

        }
        const payoutsData = await apiService.getSeriesRecentPayouts(id, 10);
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.log(`✅ [${new Date().toISOString()}] Fetched recent payouts:`, payoutsData); }

        }
        setRecentPayouts(payoutsData);
      } catch (error) {
        if (import.meta.env.DEV) {

          if (import.meta.env.DEV) { console.error(`❌ [${new Date().toISOString()}] Error fetching recent payouts:`, error); }

        }
        setRecentPayouts(null);
      } finally {
        setLoadingRecentPayouts(false);
      }
    };

    fetchRecentPayouts();
  }, [id]);

  // DEBUG: Monitor seriesDisplayData changes
  React.useEffect(() => {
    if (import.meta.env.DEV) {

      if (import.meta.env.DEV) { console.log(`🔍 [${new Date().toISOString()}] seriesDisplayData changed:`, seriesDisplayData); }

    }
    if (import.meta.env.DEV) {

      if (import.meta.env.DEV) { console.log(`🔍 [${new Date().toISOString()}] loadingDisplayData:`, loadingDisplayData); }

    }
  }, [seriesDisplayData, loadingDisplayData]);

  // Check if we came from investor details by looking at the referrer or state
  const handleBackNavigation = () => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      navigate(-1); // Go back to previous page
    } else {
      navigate('/ncd-series'); // Default fallback
    }
  };

  // Find series by ID from backend - NO HARDCODED FALLBACK
  let seriesData = null;
  let isRealData = false;
  
  if (import.meta.env.DEV) { console.log('🔍 SeriesDetails Debug:', {
    id,
    seriesArrayLength: series?.length,
    seriesArray: series,
    hasId: !!id
  }); }
  
  if (series && series.length > 0 && id) {
    const foundSeries = series.find(s => s.id === parseInt(id));
    if (import.meta.env.DEV) { console.log('🔍 Found series:', foundSeries); }
    
    if (foundSeries) {
      isRealData = true;
      
      seriesData = {
        ...foundSeries,
        status: foundSeries.status === 'DRAFT' ? 'Yet to be approved' : 
                foundSeries.status === 'upcoming' ? 'Releasing soon' :
                foundSeries.status === 'active' ? 'Active' : foundSeries.status,
        progress: Math.round((foundSeries.fundsRaised / foundSeries.targetAmount) * 100),
        transactions: [] // Will be populated from actual investments
      };
      
      if (import.meta.env.DEV) { console.log('✅ seriesData set:', seriesData); }
    } else {
      if (import.meta.env.DEV) { console.log('❌ Series not found with id:', id); }
    }
  } else {
    if (import.meta.env.DEV) { console.log('❌ Cannot find series:', {
      hasSeries: !!series,
      seriesLength: series?.length,
      hasId: !!id
    }); }
  }
  
  // If no series found, seriesData remains null - will show "Not Found" message

  // REMOVED: Frontend calculation of transactions and funds
  // ALL DATA COMES FROM BACKEND - NO FRONTEND CALCULATIONS
  // seriesData already has correct values from backend

  // Map seriesInvestors to investorDetails format for display
  const investorDetails = seriesInvestors.map(inv => ({
    name: inv.name,
    investorId: inv.investorId,
    amount: Math.round(inv.totalInvested || 0),
    kycStatus: inv.kycStatus,
    id: inv.id
  }));

  // REMOVED: Frontend calculation of Lock-in and Maturity Details
  // ALL CALCULATIONS NOW IN BACKEND via getSeriesInsights endpoint
  // Frontend uses seriesInsights state which is fetched from backend

  // Check if no series exist OR series not found - show message (AFTER all hooks)
  if (!seriesData) {
    return (
      <Layout>
        <div className="series-details-container">
          <div className="no-series-message">
            <div className="no-series-content">
              <div className="no-series-icon">
                <MdInfo size={48} />
              </div>
              <h2>{series.length === 0 ? 'No Series Available' : 'Series Not Found'}</h2>
              <p>{series.length === 0 ? 'No NCD series have been created yet. Create a series first to view its details.' : `Series with ID ${id} was not found. It may have been deleted or doesn't exist.`}</p>
              <div className="no-series-actions">
                <button 
                  className="btn-create-series"
                  onClick={() => navigate('/ncd-series')}
                >
                  <HiArrowLeft size={16} />
                  Back to NCD Series
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatCurrencyFull = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const generateSeriesPDF = async () => {
    try {
      if (import.meta.env.DEV) { console.log('📄 Generating Series Details PDF using template...'); }
      
      // Use the pdfTemplateService to generate PDF with proper formatting
      const pdfBytes = await pdfTemplateService.fillSeriesDetails(seriesData);
      
      // Create blob and download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `${seriesData.name.replace(/\s+/g, '_')}_Details_${new Date().toISOString().split('T')[0]}.pdf`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      if (import.meta.env.DEV) { console.log('✅ Series Details PDF generated successfully:', fileName); }
      
      // Add audit log for document download
      addAuditLog({
        action: 'Downloaded Report',
        adminName: user ? user.name : 'Admin',
        adminRole: user ? user.displayRole : 'Admin',
        details: `Downloaded Series Details Report for "${seriesData.name}" (PDF format)`,
        entityType: 'Series',
        entityId: seriesData.name,
        changes: {
          documentType: 'Series Details Report',
          fileName: fileName,
          format: 'PDF'
        }
      });
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error generating series PDF:', error); }
      alert('Error generating PDF: ' + error.message);
    }
  };

  // Document upload functions
  const handleDocumentUpload = (investorId, investorName) => {
    setSelectedInvestorForUpload({ id: investorId, name: investorName });
    setShowDocumentUploadModal(true);
    setUploadDocuments({
      form15G: null,
      form15H: null,
      bondPaper: null
    });
  };

  const handleFileUpload = (documentType, file) => {
    if (file) {
      if (import.meta.env.DEV) { console.log(`📎 File selected for ${documentType}:`, file.name); }
      
      // Store the actual File object (not base64) for uploading to backend
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        file: file  // Store the actual File object for FormData upload
      };
      
      setUploadDocuments(prev => ({
        ...prev,
        [documentType]: fileData
      }));
    }
  };

  const triggerFileInput = (inputId) => {
    const fileInput = document.getElementById(inputId);
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedInvestorForUpload) return;

    try {
      const uploadPromises = [];
      const documentTypes = [];

      // Process each document type and upload to backend/S3
      if (uploadDocuments.form15G) {
        documentTypes.push('Form 15G');
        uploadPromises.push(
          apiService.uploadSeriesInvestorDocument(
            selectedInvestorForUpload.id,
            seriesData.id,
            'form_15g',
            uploadDocuments.form15G.file
          )
        );
      }

      if (uploadDocuments.form15H) {
        documentTypes.push('Form 15H');
        uploadPromises.push(
          apiService.uploadSeriesInvestorDocument(
            selectedInvestorForUpload.id,
            seriesData.id,
            'form_15h',
            uploadDocuments.form15H.file
          )
        );
      }

      if (uploadDocuments.bondPaper) {
        documentTypes.push('Bond Paper');
        uploadPromises.push(
          apiService.uploadSeriesInvestorDocument(
            selectedInvestorForUpload.id,
            seriesData.id,
            'bond_paper',
            uploadDocuments.bondPaper.file
          )
        );
      }

      if (uploadPromises.length === 0) {
        alert('Please select at least one document to upload.');
        return;
      }

      // Upload all documents
      if (import.meta.env.DEV) {

        if (import.meta.env.DEV) { console.log(`📤 Uploading ${uploadPromises.length} document(s) to S3...`); }

      }
      const results = await Promise.all(uploadPromises);
      if (import.meta.env.DEV) { console.log('✅ All documents uploaded successfully:', results); }

      // Add audit log for document upload
      addAuditLog({
        action: 'Uploaded Documents',
        adminName: user ? user.name : 'Admin',
        adminRole: user ? user.displayRole : 'Admin',
        details: `Uploaded ${uploadPromises.length} document(s) for investor "${selectedInvestorForUpload.name}" in series "${seriesData.name}": ${documentTypes.join(', ')}`,
        entityType: 'Document',
        entityId: selectedInvestorForUpload.name,
        changes: {
          investorId: selectedInvestorForUpload.id,
          investorName: selectedInvestorForUpload.name,
          seriesId: seriesData.id,
          seriesName: seriesData.name,
          documentTypes: documentTypes,
          documentCount: uploadPromises.length,
          uploadedFiles: documentTypes.map((type, index) => ({
            type: type,
            fileName: type === 'Form 15G' ? uploadDocuments.form15G?.name :
                     type === 'Form 15H' ? uploadDocuments.form15H?.name :
                     uploadDocuments.bondPaper?.name
          }))
        }
      });

      alert(`Successfully uploaded ${uploadPromises.length} document(s) for ${selectedInvestorForUpload.name}`);
      
      // Close modal and reset
      setShowDocumentUploadModal(false);
      setSelectedInvestorForUpload(null);
      setUploadDocuments({
        form15G: null,
        form15H: null,
        bondPaper: null
      });

    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error uploading documents:', error); }
      alert(`Error uploading documents: ${error.message}`);
    }
  };

  return (
    <Layout>
      <div className="series-details-page">
        {/* Header Section */}
        <div className="series-header-section">
          <div className="header-left">
            <button className="back-button" onClick={handleBackNavigation}>
              <HiArrowLeft size={24} />
            </button>
            <div className="series-title-section">
              <h1 className="series-name">{seriesData.name}</h1>
              <div className="series-meta">
                <span className={`status-badge ${seriesData.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {seriesData.status}
                </span>
              </div>
            </div>
          </div>
          <button className="export-button" onClick={generateSeriesPDF}>
            <MdOutlineFileDownload size={18} /> Export Report
          </button>
        </div>

        {/* Series Insights Cards - Lock-in and Maturity Details - ALL DATA FROM BACKEND */}
        {seriesData && (
          <div className="series-insights-grid">
            {/* Lock-in Details Card - ALL DATA FROM BACKEND */}
            {!loadingInsights && seriesInsights && seriesInsights.lock_in && (
              <div className="insight-card lock-in-card">
                <div className="insight-header">
                  <h3 className="insight-title">Lock-in Period Details</h3>
                  <div className="insight-icon lock-in-icon">
                    <FiLock size={18} />
                  </div>
                </div>
                <div className="insight-content">
                  <div className="insight-main-info">
                    <div className="insight-date">
                      <span className="insight-label">Lock-in End Date</span>
                      <span className="insight-value">{seriesInsights.lock_in.lock_in_end_date}</span>
                    </div>
                    <div className="insight-days">
                      <span className="insight-label">Days</span>
                      <span className={`insight-days-value ${seriesInsights.lock_in.is_active ? 'active' : 'completed'}`}>
                        {seriesInsights.lock_in.is_active ? `+${seriesInsights.lock_in.days_left}` : `-${Math.abs(seriesInsights.lock_in.days_left)}`}
                      </span>
                    </div>
                  </div>
                  <div className="insight-details">
                    <div className="insight-detail-item">
                      <span className="detail-label">Investors Left After Lock-in</span>
                      <span className="detail-value">{seriesInsights.lock_in.investors_left_after_lock_in}</span>
                    </div>
                    <div className="insight-detail-item">
                      <span className="detail-label">Amount Withdrawn After Lock-in</span>
                      <span className="detail-value">{formatCurrency(seriesInsights.lock_in.amount_withdrawn_after_lock_in)}</span>
                    </div>
                    <div className="insight-detail-item">
                      <span className="detail-label">Remaining Investors</span>
                      <span className="detail-value">{seriesInsights.lock_in.remaining_investors}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Maturity Details Card - ALL DATA FROM BACKEND */}
            {!loadingInsights && seriesInsights && seriesInsights.maturity && (
              <div className="insight-card maturity-card">
                <div className="insight-header">
                  <h3 className="insight-title">Maturity Period Details</h3>
                  <div className="insight-icon maturity-icon">
                    <FiCalendar size={18} />
                  </div>
                </div>
                <div className="insight-content">
                  <div className="insight-main-info">
                    <div className="insight-date">
                      <span className="insight-label">Maturity Date</span>
                      <span className="insight-value">{seriesInsights.maturity.maturity_date}</span>
                    </div>
                    <div className="insight-days">
                      <span className="insight-label">Days</span>
                      <span className={`insight-days-value ${seriesInsights.maturity.is_matured ? 'matured' : 'active'}`}>
                        {seriesInsights.maturity.is_matured ? `-${Math.abs(seriesInsights.maturity.days_left)}` : `+${seriesInsights.maturity.days_left}`}
                      </span>
                    </div>
                  </div>
                  <div className="insight-details">
                    <div className="insight-detail-item">
                      <span className="detail-label">Active Investors Count</span>
                      <span className="detail-value">{seriesInsights.maturity.active_investors_count}</span>
                    </div>
                    <div className="insight-detail-item">
                      <span className="detail-label">Total Principal Amount to be Paid</span>
                      <span className="detail-value remaining-funds">{formatCurrency(seriesInsights.maturity.total_principal_to_be_paid)}</span>
                    </div>
                    <div className="insight-detail-item">
                      <span className="detail-label">Series Status</span>
                      <span className="detail-value">{seriesInsights.maturity.real_series_status}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="metrics-grid">
          <div className="metric-card clickable-card" onClick={() => setShowFundsModal(true)}>
            <div className="metric-icon green">
              <MdCurrencyRupee size={24} />
            </div>
            <div className="metric-content">
              <span className="metric-label">Funds Raised</span>
              <span className="metric-value">{formatCurrency(seriesData.fundsRaised)}</span>
            </div>
          </div>
          <div className="metric-card clickable-card" onClick={() => setShowInvestorsModal(true)}>
            <div className="metric-icon grey">
              <FiUsers size={24} />
            </div>
            <div className="metric-content">
              <span className="metric-label">Investors</span>
              <span className="metric-value">{seriesData.investors}</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon yellow">
              <FiPercent size={24} />
            </div>
            <div className="metric-content">
              <span className="metric-label">Interest Rate</span>
              <span className="metric-value">{seriesData.interestRate}%</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon blue">
              <FiTrendingUp size={24} />
            </div>
            <div className="metric-content">
              <span className="metric-label">Progress</span>
              <span className="metric-value">{seriesData.progress}%</span>
            </div>
          </div>
        </div>

        {/* Series Details and Payout Schedule - Side by Side, Fixed Height, No Scrolling */}
        <div className="details-payout-container">
          <div className="series-details-card">
            <h2 className="card-title">Series Details</h2>
            <div className="details-list">
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-content">
                    <div className="detail-label-with-icon">
                      <HiOutlineCalendar className="detail-icon" />
                      <span className="detail-label">Issue Date</span>
                    </div>
                    <span className="detail-value">{seriesData.issueDate}</span>
                  </div>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-content">
                    <div className="detail-label-with-icon">
                      <HiOutlineCalendar className="detail-icon" />
                      <span className="detail-label">Maturity Date</span>
                    </div>
                    <span className="detail-value">{seriesData.maturityDate}</span>
                  </div>
                </div>
              </div>
              
              {/* NEW: Lock-in Date - ALL DATA FROM BACKEND */}
              {(() => {
                const shouldRender = !loadingDisplayData && seriesDisplayData;
                if (import.meta.env.DEV) {
                  console.log(`🎨 [${new Date().toISOString()}] Lock-in Date card render check:`, {
                    loadingDisplayData,
                    hasSeriesDisplayData: !!seriesDisplayData,
                    shouldRender
                  });
                }
                return shouldRender && (
                  <div className="detail-row">
                    <div className="detail-item">
                      <div className="detail-content">
                        <div className="detail-label-with-icon">
                          <FiLock className="detail-icon" />
                          <span className="detail-label">Lock-in Date</span>
                        </div>
                        <span className="detail-value">
                          {seriesDisplayData.lock_in_date.display_value}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* NEW: Subscription Period - ALL DATA FROM BACKEND */}
              {(() => {
                const shouldRender = !loadingDisplayData && seriesDisplayData;
                if (import.meta.env.DEV) {
                  console.log(`🎨 [${new Date().toISOString()}] Subscription Period card render check:`, {
                    loadingDisplayData,
                    hasSeriesDisplayData: !!seriesDisplayData,
                    shouldRender
                  });
                }
                return shouldRender && (
                  <div className="detail-row">
                    <div className="detail-item">
                      <div className="detail-content">
                        <div className="detail-label-with-icon">
                          <FiCalendar className="detail-icon" />
                          <span className="detail-label">Subscription Period</span>
                        </div>
                        <span className="detail-value">
                          {seriesDisplayData.subscription_period.display_value}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-content">
                    <span className="detail-label">Interest Frequency</span>
                    <span className="frequency-badge">{seriesData.interestFrequency}</span>
                  </div>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-content">
                    <span className="detail-label">Face Value</span>
                    <span className="detail-value">{formatCurrencyFull(seriesData.faceValue)}</span>
                  </div>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-content">
                    <span className="detail-label">Minimum Investment</span>
                    <span className="detail-value">{formatCurrencyFull(seriesData.minInvestment)}</span>
                  </div>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-content">
                    <span className="detail-label">Target Amount</span>
                    <span className="detail-value">{formatCurrency(seriesData.targetAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="payout-schedule-card">
            <h2 className="card-title">Payout Schedule</h2>
            <div className="payout-schedule-content">
              {loadingUpcomingPayouts ? (
                <div className="loading-message">Loading upcoming payouts...</div>
              ) : upcomingPayouts && upcomingPayouts.payouts && upcomingPayouts.payouts.length > 0 ? (
                <>
                  <div className="payout-schedule-header">
                    <div className="schedule-info">
                      <span className="schedule-month">Upcoming Month: {upcomingPayouts.upcoming_month}</span>
                      <span className="schedule-date">Payout Date: {upcomingPayouts.summary.payout_date}</span>
                      <span className="schedule-date">Interest Payment Day: {upcomingPayouts.interest_payment_day}</span>
                    </div>
                    <div className="schedule-summary">
                      <span className="total-amount">
                        Total: {formatCurrency(upcomingPayouts.summary.total_amount)}
                      </span>
                      <span className="total-investors">
                        {upcomingPayouts.summary.investor_count} Investors
                      </span>
                    </div>
                  </div>
                  
                  <div className="payout-schedule-table-container">
                    <table className="payout-schedule-table">
                      <thead>
                        <tr>
                          <th>Investor</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Bank Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingPayouts.payouts.map((payout) => (
                          <tr key={payout.id}>
                            <td>
                              <div className="investor-info">
                                <div className="investor-name">{payout.investor_name}</div>
                                <div className="investor-id">{payout.investor_id}</div>
                              </div>
                            </td>
                            <td className="amount-cell">
                              ₹{payout.amount.toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span className={`status-badge ${payout.status.toLowerCase()}`}>
                                {payout.status}
                              </span>
                            </td>
                            <td>
                              <div className="bank-info">
                                <div className="bank-name">{payout.bank_name}</div>
                                <div className="bank-details">
                                  {payout.bank_account_number} | {payout.ifsc_code}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="no-payouts">
                  <p>No upcoming payout data available</p>
                  {seriesData.status === 'Yet to be approved' && (
                    <p className="draft-message">Payout schedule will be generated after series approval.</p>
                  )}
                  {seriesData.status === 'Releasing soon' && (
                    <p className="draft-message">Payout schedule will be available after series release.</p>
                  )}
                  {seriesData.status === 'Active' && (
                    <p className="draft-message">
                      No upcoming payouts available. This may be because:
                      <br />• Series is too new (less than 30 days old)
                      <br />• No investors have been added to this series yet
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rejection Reason Section - Only show for rejected series */}
        {seriesData.status === 'REJECTED' && seriesData.rejectionReason && (
          <div className="rejection-section">
            <div className="rejection-card">
              <h2 className="rejection-title">Rejection Details</h2>
              <div className="rejection-content">
                <div className="rejection-info">
                  <span className="rejection-label">Rejected On:</span>
                  <span className="rejection-date">
                    {seriesData.rejectedAt ? new Date(seriesData.rejectedAt).toLocaleDateString('en-GB') : 'N/A'}
                  </span>
                </div>
                <div className="rejection-reason-box">
                  <h3 className="reason-title">Reason for Rejection:</h3>
                  <p className="reason-text">{seriesData.rejectionReason}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Investor Documents */}
        <div className="documents-section">
          <h2 className="section-title">Investor Documents</h2>
          <div className="documents-table-card">
            {investorDetails && investorDetails.length > 0 ? (
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Investor Name</th>
                    <th>Investor ID</th>
                    <th>Amount Invested</th>
                    <th>Investment Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investorDetails.map((inv, index) => {
                    // Get investment date from backend data
                    const investorData = seriesInvestors.find(investor => investor.investorId === inv.investorId);
                    const investmentDate = investorData?.firstInvestmentDate || 'N/A';
                    const lastInvestmentDate = investorData?.lastInvestmentDate;
                    
                    return (
                      <tr key={index}>
                        <td>{inv.name}</td>
                        <td>
                          <span className="investor-id-badge">{inv.investorId}</span>
                        </td>
                        <td className="amount-cell">₹{inv.amount.toLocaleString('en-IN')}</td>
                        <td>
                          <div className="date-time-cell">
                            <div className="date">{investmentDate}</div>
                            {lastInvestmentDate && lastInvestmentDate !== investmentDate && (
                              <div className="time">
                                Last: {lastInvestmentDate}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <button 
                            className="upload-button"
                            onClick={() => handleDocumentUpload(inv.investorId, inv.name)}
                          >
                            Upload
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-documents">
                <p>No investors in this series yet</p>
                <p className="draft-message">Investor documents will appear here once investments are made in this series.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="transactions-section">
          <h2 className="section-title">Recent Transactions</h2>
          <div className="transactions-table-card">
            {loadingRecentPayouts ? (
              <div className="loading-message">Loading recent transactions...</div>
            ) : recentPayouts && recentPayouts.payouts && recentPayouts.payouts.length > 0 ? (
              <div className="recent-transactions-table-container">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Investor Name</th>
                      <th>Investor ID</th>
                      <th>Payout Month</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayouts.payouts.map((payout) => (
                      <tr key={payout.id}>
                        <td>
                          <div className="date-time-cell">
                            <div className="date">{payout.payout_date}</div>
                            {payout.paid_date && (
                              <div className="time">Paid: {payout.paid_date}</div>
                            )}
                          </div>
                        </td>
                        <td>{payout.investor_name}</td>
                        <td>
                          <span className="investor-id-badge">{payout.investor_id}</span>
                        </td>
                        <td>{payout.payout_month}</td>
                        <td className="amount-cell">{formatCurrencyFull(payout.amount)}</td>
                        <td>
                          <span className={`status-badge ${payout.status.toLowerCase()}`}>
                            {payout.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-transactions">
                <p>No transactions available</p>
                {seriesData.status === 'Yet to be approved' && (
                  <p className="draft-message">Series is pending board approval. Transactions will appear after release.</p>
                )}
                {seriesData.status === 'Releasing soon' && (
                  <p className="draft-message">Series is approved but not yet released. Transactions will appear after release date.</p>
                )}
                {seriesData.status === 'Active' && (
                  <p className="draft-message">No payout transactions have been processed yet for this series.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Funds Raised Modal */}
        {showFundsModal && (
          <div className="modal-overlay" onClick={() => setShowFundsModal(false)}>
            <div className="modal-content funds-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Funds Raised - {seriesData.name}</h2>
                <button className="close-button" onClick={() => setShowFundsModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="modal-summary">
                  <p><strong>Total Funds Raised:</strong> {formatCurrency(seriesData.fundsRaised)}</p>
                  <p><strong>Total Investors:</strong> {investorDetails.length}</p>
                </div>
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Investor Name</th>
                      <th>Investor ID</th>
                      <th>Amount Invested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investorDetails.map((inv, index) => (
                      <tr key={index}>
                        <td>{inv.name}</td>
                        <td>{inv.investorId}</td>
                        <td>₹{inv.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {investorDetails.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>
                          No investors yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Investors Modal */}
        {showInvestorsModal && (
          <div className="modal-overlay" onClick={() => setShowInvestorsModal(false)}>
            <div className="modal-content investors-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Investors - {seriesData.name}</h2>
                <button className="close-button" onClick={() => setShowInvestorsModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="modal-summary">
                  <p><strong>Total Investors:</strong> {investorDetails.length}</p>
                </div>
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Investor Name</th>
                      <th>Investor ID</th>
                      <th>KYC Status</th>
                      <th>Investment Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investorDetails.map((inv, index) => (
                      <tr key={index}>
                        <td>{inv.name}</td>
                        <td>{inv.investorId}</td>
                        <td>
                          <span className={`status-badge ${inv.kycStatus.toLowerCase()}`}>
                            {inv.kycStatus}
                          </span>
                        </td>
                        <td>₹{inv.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {investorDetails.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>
                          No investors yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Document Upload Modal */}
        {showDocumentUploadModal && selectedInvestorForUpload && (
          <div className="modal-overlay" onClick={() => setShowDocumentUploadModal(false)}>
            <div className="modal-content document-upload-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Upload Documents - {selectedInvestorForUpload.name}</h2>
                <button className="close-button" onClick={() => setShowDocumentUploadModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="upload-info">
                  <p><strong>Investor:</strong> {selectedInvestorForUpload.name}</p>
                  <p><strong>Investor ID:</strong> {selectedInvestorForUpload.id}</p>
                  <p><strong>Series:</strong> {seriesData.name}</p>
                </div>
                
                <div className="upload-sections">
                  {/* 15G Document Upload */}
                  <div className="upload-section">
                    <h3>15G Document</h3>
                    <div className="file-upload-area" onClick={() => triggerFileInput('form15G-upload')}>
                      <input
                        type="file"
                        id="form15G-upload"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          if (import.meta.env.DEV) { console.log('15G file selected:', e.target.files[0]); }
                          handleFileUpload('form15G', e.target.files[0]);
                        }}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-content">
                        <div className="upload-icon">📄</div>
                        <div className="upload-text">
                          {uploadDocuments.form15G ? (
                            <span style={{ color: '#10b981', fontWeight: '600' }}>
                              ✓ {uploadDocuments.form15G.name}
                            </span>
                          ) : (
                            'Click to upload 15G document'
                          )}
                        </div>
                        <div className="upload-hint">PDF, JPG, PNG, DOC files supported</div>
                      </div>
                    </div>
                  </div>

                  {/* 15H Document Upload */}
                  <div className="upload-section">
                    <h3>15H Document</h3>
                    <div className="file-upload-area" onClick={() => triggerFileInput('form15H-upload')}>
                      <input
                        type="file"
                        id="form15H-upload"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          if (import.meta.env.DEV) { console.log('15H file selected:', e.target.files[0]); }
                          handleFileUpload('form15H', e.target.files[0]);
                        }}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-content">
                        <div className="upload-icon">📄</div>
                        <div className="upload-text">
                          {uploadDocuments.form15H ? (
                            <span style={{ color: '#10b981', fontWeight: '600' }}>
                              ✓ {uploadDocuments.form15H.name}
                            </span>
                          ) : (
                            'Click to upload 15H document'
                          )}
                        </div>
                        <div className="upload-hint">PDF, JPG, PNG, DOC files supported</div>
                      </div>
                    </div>
                  </div>

                  {/* Bond Paper Document Upload */}
                  <div className="upload-section">
                    <h3>Bond Paper Document</h3>
                    <div className="file-upload-area" onClick={() => triggerFileInput('bondPaper-upload')}>
                      <input
                        type="file"
                        id="bondPaper-upload"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          if (import.meta.env.DEV) { console.log('Bond Paper file selected:', e.target.files[0]); }
                          handleFileUpload('bondPaper', e.target.files[0]);
                        }}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-content">
                        <div className="upload-icon">📄</div>
                        <div className="upload-text">
                          {uploadDocuments.bondPaper ? (
                            <span style={{ color: '#10b981', fontWeight: '600' }}>
                              ✓ {uploadDocuments.bondPaper.name}
                            </span>
                          ) : (
                            'Click to upload bond paper document'
                          )}
                        </div>
                        <div className="upload-hint">PDF, JPG, PNG, DOC files supported</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="cancel-button" onClick={() => setShowDocumentUploadModal(false)}>
                    Cancel
                  </button>
                  <button className="upload-submit-button" onClick={handleUploadSubmit}>
                    Upload Documents
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

export default SeriesDetails;

