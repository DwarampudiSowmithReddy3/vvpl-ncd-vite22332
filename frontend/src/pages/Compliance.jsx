import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import auditService from '../services/auditService';
import apiService from '../services/api';
import Layout from '../components/Layout';
import ComplianceTracker from '../components/ComplianceTracker';
import './Compliance.css';
import '../styles/loading.css';
import { 
  MdSecurity, 
  MdVerifiedUser, 
  MdGavel, 
  MdFileDownload, 
  MdAdd,
  MdWarning,
  MdCheckCircle,
  MdSchedule,
  MdInfo
} from "react-icons/md";
import { HiOutlineEye, HiOutlineDocumentText } from "react-icons/hi";
import { FiSearch } from "react-icons/fi";

const Compliance = () => {
  const navigate = useNavigate();
  const { showCreateButton, canEdit } = usePermissions();
  const { user } = useAuth();
  const { addAuditLog } = useData();
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [showComplianceTracker, setShowComplianceTracker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [complianceSeries, setComplianceSeries] = useState([]);
  const [categorizedSeries, setCategorizedSeries] = useState({
    'yet-to-be-submitted': [],
    'pending': [],
    'submitted': []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load compliance series from backend
  useEffect(() => {
    const loadComplianceSeries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (import.meta.env.DEV) { console.log('🔄 Loading compliance series from backend...'); }
        const response = await apiService.getComplianceSeries(searchTerm || null);
        if (import.meta.env.DEV) { console.log('✅ Compliance series loaded:', response); }
        
        // Backend returns { all_series, categorized, total_count }
        // Use categorized data directly from backend (100% backend)
        const categorizedData = response.categorized || {
          'yet-to-be-submitted': [],
          'pending': [],
          'submitted': []
        };
        
        // Transform each category
        const transformCategory = (seriesArray) => {
          return seriesArray.map(s => ({
            id: s.id,
            seriesId: s.series_id,
            name: s.name,
            seriesCode: s.series_code,
            interestRate: s.interest_rate,
            interestFrequency: s.interest_frequency,
            investors: s.investors,
            fundsRaised: s.funds_raised,
            targetAmount: s.target_amount,
            issueDate: s.issue_date,
            maturityDate: s.maturity_date,
            lastUpdated: s.last_updated,
            status: s.compliance_status,
            seriesStatus: s.series_status,
            complianceStats: s.compliance_stats,
            originalSeries: {
              id: s.series_id,
              status: s.series_status
            }
          }));
        };
        
        // Set categorized data from backend
        setCategorizedSeries({
          'yet-to-be-submitted': transformCategory(categorizedData['yet-to-be-submitted']),
          'pending': transformCategory(categorizedData['pending']),
          'submitted': transformCategory(categorizedData['submitted'])
        });
        
        // Also set all series for count
        setComplianceSeries(response.all_series || []);
        
        if (import.meta.env.DEV) { console.log('✅ Categorized series set from backend'); }
        
      } catch (err) {
        if (import.meta.env.DEV) { console.error('❌ Failed to load compliance series:', err); }
        setError(err.message || 'Failed to load compliance data');
      } finally {
        setLoading(false);
      }
    };

    loadComplianceSeries();
  }, [searchTerm]); // Reload when search term changes

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'yet-to-be-submitted':
        return { label: 'Yet to be Submitted', color: 'red', icon: <MdWarning /> };
      case 'pending':
        return { label: 'Pending', color: 'orange', icon: <MdSchedule /> };
      case 'submitted':
        return { label: 'Submitted', color: 'green', icon: <MdCheckCircle /> };
      default:
        return { label: 'Unknown', color: 'gray', icon: <MdInfo /> };
    }
  };

  const handleViewDetails = async (series) => {
    try {
      setSelectedSeries(series);
      setShowComplianceTracker(true);
      
      // Log compliance details view using auditService
      auditService.logActivity(
        'Compliance Details Viewed',
        `Viewed compliance details for series "${series.name}"`,
        'Compliance',
        series.name,
        {
          seriesName: series.name,
          complianceStatus: series.status,
          viewedBy: user?.name || user?.full_name
        }
      ).catch(error => {
        if (import.meta.env.DEV) { console.error('Failed to log compliance view:', error); }
      });
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Error viewing compliance details:', error); }
    }
  };

  const handleCloseComplianceTracker = () => {
    setShowComplianceTracker(false);
    setSelectedSeries(null);
  };

  // Mock compliance data for the dashboard
  const complianceData = {
    totalRequirements: 45,
    completed: 32,
    pending: 8,
    notApplicable: 5,
    preCompliance: [
      { requirement: 'Board Resolution for NCD Issue', reference: 'Companies Act 2013, Section 42', status: 'RECEIVED' },
      { requirement: 'Credit Rating Certificate', reference: 'SEBI (ICDR) Regulations 2018', status: 'PENDING' },
      { requirement: 'Debenture Trust Deed', reference: 'Companies Act 2013, Section 71', status: 'IN RECORDS' },
      { requirement: 'Prospectus Filing', reference: 'Companies Act 2013, Section 26', status: 'RECEIVED' },
      { requirement: 'SEBI Approval Letter', reference: 'SEBI (ICDR) Regulations 2018', status: 'PENDING' }
    ],
    criticalDeadlines: [
      { item: 'Debenture Trust Deed', deadline: '2024-01-15', daysLeft: 9 },
      { item: 'MCA Filings', deadline: '2024-01-20', daysLeft: 14 },
      { item: 'SEBI Compliance Report', deadline: '2024-01-25', daysLeft: 19 }
    ],
    allotmentStatus: [
      { item: 'Allotment Letter Issued', completed: true },
      { item: 'Demat Credit Completed', completed: true },
      { item: 'Listing Application Filed', completed: false },
      { item: 'Trading Approval Received', completed: false }
    ],
    recurringObligations: [
      { item: 'Interest Payment Confirmations', frequency: 'Monthly', nextDue: '2024-02-01' },
      { item: 'Quarterly Reports to Trustees', frequency: 'Quarterly', nextDue: '2024-03-31' },
      { item: 'Annual Compliance Certificate', frequency: 'Yearly', nextDue: '2024-12-31' }
    ]
  };

  return (
    <Layout>
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading...</p>
          </div>
        </div>
      )}
      
      <div className="compliance-container">
        <div className="compliance-header">
          <div className="header-content">
            <h1 className="page-title">Compliance Management</h1>
          </div>
          <div className="header-actions">
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search series by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {/* Show error state */}
        {error && !loading && (
          <div className="error-message">
            <div className="error-content">
              <MdWarning size={48} color="#ef4444" />
              <h2>Error Loading Compliance Data</h2>
              <p>{error}</p>
              <button 
                className="btn-retry"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Show message when no series available instead of hardcoded ComplianceTracker */}
        {!loading && !error && complianceSeries.length === 0 && (
          <div className="no-series-message">
            <div className="no-series-content">
              <div className="no-series-icon">
                <MdInfo size={48} />
              </div>
              <h2>No Series Available for Compliance Tracking</h2>
              <p>Create and approve NCD series to start tracking compliance requirements.</p>
              <div className="no-series-actions">
                <button 
                  className="btn-create-series"
                  onClick={() => navigate('/ncd-series')}
                >
                  <MdAdd size={16} />
                  Go to NCD Series
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Yet to be Submitted - Red Theme */}
        {!loading && !error && categorizedSeries['yet-to-be-submitted'].length > 0 && (
        <div className="compliance-section red-theme">
          <div className="section-header">
            <h2 className="section-title">
              <MdWarning className="section-icon" />
              Yet to be Submitted ({categorizedSeries['yet-to-be-submitted'].length})
            </h2>
            <p className="section-subtitle">Series with many pending document submissions</p>
          </div>
          <div className="series-grid">
            {categorizedSeries['yet-to-be-submitted'].map((s) => {
              const statusInfo = getStatusInfo('yet-to-be-submitted');
              return (
                <div key={s.id} className="compliance-series-card compliance-red-card">
                  <div className="compliance-card-banner">
                    <div className="compliance-banner-content">
                      <h3 className="compliance-series-name">{s.name}</h3>
                      <div className="compliance-banner-status">
                        <span className={`compliance-status-pill compliance-${statusInfo.color}`}>
                          {statusInfo.label.toUpperCase()}
                        </span>
                        <span className="compliance-frequency-pill">{s.interestFrequency}</span>
                      </div>
                    </div>
                  </div>
                  <div className="compliance-series-details">
                    <div className="compliance-detail-item">
                      <span className="compliance-detail-label">Issue Date:</span>
                      <span className="compliance-detail-value">{s.issueDate}</span>
                    </div>
                    <div className="compliance-detail-item">
                      <span className="compliance-detail-label">Maturity Date:</span>
                      <span className="compliance-detail-value">{s.maturityDate}</span>
                    </div>
                    <div className="compliance-detail-item">
                      <span className="compliance-detail-label">Last Updated:</span>
                      <span className="compliance-detail-value">{s.lastUpdated}</span>
                    </div>
                  </div>
                  <button 
                    className="compliance-view-details-button compliance-red-button"
                    onClick={() => handleViewDetails(s)}
                  >
                    <HiOutlineEye size={18} /> View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Pending - Orange Theme */}
        {!loading && !error && categorizedSeries['pending'].length > 0 && (
        <div className="compliance-section orange-theme">
          <div className="section-header">
            <h2 className="section-title">
              <MdSchedule className="section-icon" />
              Pending ({categorizedSeries['pending'].length})
            </h2>
            <p className="section-subtitle">Series with moderate compliance progress</p>
          </div>
          <div className="series-grid">
            {categorizedSeries['pending'].map((s) => {
              const statusInfo = getStatusInfo('pending');
              return (
                <div key={s.id} className="compliance-series-card compliance-orange-card">
                  <div className="compliance-card-banner">
                    <div className="compliance-banner-content">
                      <h3 className="compliance-series-name">{s.name}</h3>
                      <div className="compliance-banner-status">
                        <span className={`compliance-status-pill compliance-${statusInfo.color}`}>
                          {statusInfo.label.toUpperCase()}
                        </span>
                        <span className="compliance-frequency-pill">{s.interestFrequency}</span>
                      </div>
                    </div>
                  </div>
                  <div className="compliance-series-details">
                    <div className="compliance-detail-item">
                      <span className="compliance-detail-label">Issue Date:</span>
                      <span className="compliance-detail-value">{s.issueDate}</span>
                    </div>
                    <div className="compliance-detail-item">
                      <span className="compliance-detail-label">Maturity Date:</span>
                      <span className="compliance-detail-value">{s.maturityDate}</span>
                    </div>
                    <div className="compliance-detail-item">
                      <span className="compliance-detail-label">Last Updated:</span>
                      <span className="compliance-detail-value">{s.lastUpdated}</span>
                    </div>
                  </div>
                  <button 
                    className="compliance-view-details-button compliance-orange-button"
                    onClick={() => handleViewDetails(s)}
                  >
                    <HiOutlineEye size={18} /> View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Submitted - Green Theme */}
        {!loading && !error && categorizedSeries['submitted'].length > 0 && (
        <div className="compliance-section green-theme">
          <div className="section-header">
            <h2 className="section-title">
              <MdCheckCircle className="section-icon" />
              Submitted ({categorizedSeries['submitted'].length})
            </h2>
            <p className="section-subtitle">Series with complete compliance documentation</p>
          </div>
          <div className="series-grid">
            {categorizedSeries['submitted'].map((s) => {
              const statusInfo = getStatusInfo('submitted');
              return (
                <div key={s.id} className="compliance-series-card compliance-green-card">
                  <div className="compliance-card-banner">
                    <div className="compliance-banner-content">
                      <h3 className="compliance-series-name">{s.name}</h3>
                      <div className="compliance-banner-status">
                        <span className={`compliance-status-pill compliance-${statusInfo.color}`}>
                          {statusInfo.label.toUpperCase()}
                        </span>
                        <span className="compliance-frequency-pill">{s.interestFrequency}</span>
                      </div>
                    </div>
                  </div>
                  <div className="compliance-series-details">
                    <div className="compliance-detail-item">
                      <span className="compliance-detail-label">Issue Date:</span>
                      <span className="compliance-detail-value">{s.issueDate}</span>
                    </div>
                    <div className="compliance-detail-item">
                      <span className="compliance-detail-label">Maturity Date:</span>
                      <span className="compliance-detail-value">{s.maturityDate}</span>
                    </div>
                    <div className="compliance-detail-item">
                      <span className="compliance-detail-label">Last Updated:</span>
                      <span className="compliance-detail-value">{s.lastUpdated}</span>
                    </div>
                  </div>
                  <button 
                    className="compliance-view-details-button compliance-green-button"
                    onClick={() => handleViewDetails(s)}
                  >
                    <HiOutlineEye size={18} /> View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Compliance Tracker Modal - Dynamic for each series using backend data */}
        {showComplianceTracker && selectedSeries && (
          <ComplianceTracker 
            onClose={handleCloseComplianceTracker} 
            seriesData={{
              seriesName: selectedSeries.name,
              seriesId: selectedSeries.seriesId,
              issueDate: selectedSeries.issueDate,
              maturityDate: selectedSeries.maturityDate,
              trusteeCompany: 'SBICAP Trustee Co. Ltd.',
              stats: selectedSeries.complianceStats || {
                totalRequirements: 42,
                receivedCompleted: 0,
                pendingActions: 42,
                notApplicable: 0
              }
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Compliance;