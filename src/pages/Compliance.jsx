import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ComplianceTracker from '../components/ComplianceTracker';
import './Compliance.css';
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
  const { series, addAuditLog } = useData();
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [showComplianceTracker, setShowComplianceTracker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get real series data from DataContext and convert to compliance format
  const getComplianceSeries = () => {
    // Filter series that need compliance tracking (approved and beyond)
    const complianceEligibleSeries = series.filter(s => 
      s.status === 'active' || 
      s.status === 'accepting' || 
      s.status === 'upcoming' ||
      (s.status === 'DRAFT' && s.approvalStatus === 'approved') // Include approved drafts
    );
    
    return complianceEligibleSeries.map((s, index) => {
      // Assign compliance status based on series characteristics
      let complianceStatus = 'yet-to-be-submitted'; // Default for all new series
      
      // Only assign better status to series that have been around longer and have activity
      if (s.status === 'active' && s.fundsRaised > 0) {
        const fundingProgress = s.targetAmount > 0 ? (s.fundsRaised / s.targetAmount) * 100 : 0;
        
        // Only well-established series with significant funding get better status
        if (fundingProgress > 90 && s.investors > 50) {
          complianceStatus = 'submitted';
        } else if (fundingProgress > 60 && s.investors > 20) {
          complianceStatus = 'pending';
        }
        
        // Check if series has been active for a reasonable time
        if (s.issueDate) {
          const issueDate = new Date(s.issueDate.split('/').reverse().join('-'));
          const daysSinceIssue = (new Date() - issueDate) / (1000 * 60 * 60 * 24);
          
          // Only series active for more than 6 months can have submitted status
          if (daysSinceIssue < 180 && complianceStatus === 'submitted') {
            complianceStatus = 'pending';
          }
          
          // Series active for less than 30 days should be yet-to-be-submitted
          if (daysSinceIssue < 30) {
            complianceStatus = 'yet-to-be-submitted';
          }
        }
      }
      
      // All DRAFT series (even approved ones) should be yet-to-be-submitted
      if (s.status === 'DRAFT') {
        complianceStatus = 'yet-to-be-submitted';
      }
      
      // New series without investments should be yet-to-be-submitted
      if (s.fundsRaised === 0 || s.investors === 0) {
        complianceStatus = 'yet-to-be-submitted';
      }
      
      return {
        id: `comp-${s.id}`,
        name: `${s.name} NCD`,
        interestRate: s.interestRate,
        interestFrequency: s.interestFrequency || 'Monthly',
        investors: s.investors || 0,
        fundsRaised: s.fundsRaised || 0,
        targetAmount: s.targetAmount || 0,
        issueDate: s.issueDate || 'TBD',
        maturityDate: s.maturityDate || 'TBD',
        lastUpdated: new Date().toISOString().split('T')[0],
        status: complianceStatus,
        originalSeries: s // Keep reference to original series data
      };
    });
  };

  const complianceSeries = getComplianceSeries();

  // Filter series based on search term
  const filteredComplianceSeries = complianceSeries.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Categorize filtered series by compliance status
  const categorizedSeries = {
    'yet-to-be-submitted': filteredComplianceSeries.filter(s => s.status === 'yet-to-be-submitted'),
    'pending': filteredComplianceSeries.filter(s => s.status === 'pending'),
    'submitted': filteredComplianceSeries.filter(s => s.status === 'submitted')
  };

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

  const handleViewDetails = (series) => {
    setSelectedSeries(series);
    setShowComplianceTracker(true);
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

        {/* Show ComplianceTracker by default when no series available */}
        {complianceSeries.length === 0 && (
          <ComplianceTracker 
            onClose={() => {}} // Empty function since we want it always visible when no series
            seriesData={{
              seriesName: 'General NCD Compliance',
              trusteeCompany: 'SBICAP Trustee Co. Ltd.',
              stats: {
                totalRequirements: 42,
                receivedCompleted: 0,
                pendingActions: 42,
                notApplicable: 0
              }
            }}
          />
        )}

        {/* Yet to be Submitted - Red Theme */}
        {categorizedSeries['yet-to-be-submitted'].length > 0 && (
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
        {categorizedSeries['pending'].length > 0 && (
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
        {categorizedSeries['submitted'].length > 0 && (
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

        {/* Compliance Tracker Modal - Dynamic for each series or general compliance */}
        {showComplianceTracker && selectedSeries && (
          <ComplianceTracker 
            onClose={handleCloseComplianceTracker} 
            seriesData={{
              seriesName: selectedSeries.name,
              trusteeCompany: 'SBICAP Trustee Co. Ltd.',
              stats: {
                totalRequirements: 42,
                // New series should start with 0 completed documents
                receivedCompleted: selectedSeries.originalSeries?.status === 'DRAFT' ? 0 : 
                                 selectedSeries.status === 'submitted' ? 38 : 
                                 selectedSeries.status === 'pending' ? 12 : 0,
                pendingActions: selectedSeries.originalSeries?.status === 'DRAFT' ? 42 : 
                              selectedSeries.status === 'submitted' ? 4 : 
                              selectedSeries.status === 'pending' ? 30 : 42,
                notApplicable: 0 // Always 0 for new series
              }
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Compliance;