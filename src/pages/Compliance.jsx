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

  // Fixed compliance data - stable across page visits
  const complianceSeries = [
    // Yet to be Submitted (4 series)
    { id: 'comp-1', name: 'Series A NCD', interestRate: 8.5, interestFrequency: 'Monthly', investors: 45, fundsRaised: 25000000, targetAmount: 100000000, issueDate: '2024-01-15', maturityDate: '2027-01-15', lastUpdated: '2024-01-08', status: 'yet-to-be-submitted' },
    { id: 'comp-2', name: 'Series B NCD', interestRate: 9.0, interestFrequency: 'Monthly', investors: 32, fundsRaised: 18000000, targetAmount: 75000000, issueDate: '2024-02-01', maturityDate: '2027-02-01', lastUpdated: '2024-01-07', status: 'yet-to-be-submitted' },
    { id: 'comp-3', name: 'Series D NCD', interestRate: 8.75, interestFrequency: 'Monthly', investors: 28, fundsRaised: 15000000, targetAmount: 60000000, issueDate: '2024-03-10', maturityDate: '2027-03-10', lastUpdated: '2024-01-06', status: 'yet-to-be-submitted' },
    { id: 'comp-4', name: 'Series E NCD', interestRate: 9.25, interestFrequency: 'Monthly', investors: 38, fundsRaised: 22000000, targetAmount: 80000000, issueDate: '2024-04-05', maturityDate: '2027-04-05', lastUpdated: '2024-01-05', status: 'yet-to-be-submitted' },
    
    // Pending (4 series)
    { id: 'comp-5', name: 'Series F NCD', interestRate: 8.8, interestFrequency: 'Monthly', investors: 52, fundsRaised: 45000000, targetAmount: 90000000, issueDate: '2024-01-20', maturityDate: '2027-01-20', lastUpdated: '2024-01-04', status: 'pending' },
    { id: 'comp-6', name: 'Series G NCD', interestRate: 9.1, interestFrequency: 'Monthly', investors: 41, fundsRaised: 35000000, targetAmount: 70000000, issueDate: '2024-02-15', maturityDate: '2027-02-15', lastUpdated: '2024-01-03', status: 'pending' },
    { id: 'comp-7', name: 'Series H NCD', interestRate: 8.9, interestFrequency: 'Monthly', investors: 47, fundsRaised: 40000000, targetAmount: 85000000, issueDate: '2024-03-01', maturityDate: '2027-03-01', lastUpdated: '2024-01-02', status: 'pending' },
    { id: 'comp-8', name: 'Series I NCD', interestRate: 9.3, interestFrequency: 'Monthly', investors: 36, fundsRaised: 30000000, targetAmount: 65000000, issueDate: '2024-04-12', maturityDate: '2027-04-12', lastUpdated: '2024-01-01', status: 'pending' },
    
    // Submitted (4 series)
    { id: 'comp-9', name: 'Series J NCD', interestRate: 8.6, interestFrequency: 'Monthly', investors: 65, fundsRaised: 85000000, targetAmount: 100000000, issueDate: '2024-01-10', maturityDate: '2027-01-10', lastUpdated: '2023-12-31', status: 'submitted' },
    { id: 'comp-10', name: 'Series K NCD', interestRate: 9.2, interestFrequency: 'Monthly', investors: 58, fundsRaised: 70000000, targetAmount: 90000000, issueDate: '2024-02-08', maturityDate: '2027-02-08', lastUpdated: '2023-12-30', status: 'submitted' },
    { id: 'comp-11', name: 'Series L NCD', interestRate: 8.95, interestFrequency: 'Monthly', investors: 72, fundsRaised: 95000000, targetAmount: 120000000, issueDate: '2024-03-05', maturityDate: '2027-03-05', lastUpdated: '2023-12-29', status: 'submitted' },
    { id: 'comp-12', name: 'Series M NCD', interestRate: 9.4, interestFrequency: 'Monthly', investors: 61, fundsRaised: 80000000, targetAmount: 110000000, issueDate: '2024-04-18', maturityDate: '2027-04-18', lastUpdated: '2023-12-28', status: 'submitted' }
  ];

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
            <h1>Compliance Management</h1>
            <p>Monitor regulatory compliance status across all NCD series</p>
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

        {/* Yet to be Submitted - Red Theme */}
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
                <div key={s.id} className="series-card red-card">
                  <div className="card-banner">
                    <div className="banner-content">
                      <h3 className="series-name">{s.name}</h3>
                      <div className="banner-status">
                        <span className={`status-pill ${statusInfo.color}`}>
                          {statusInfo.label.toUpperCase()}
                        </span>
                        <span className="frequency-pill">{s.interestFrequency}</span>
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
                      <span className="detail-label">Last Updated:</span>
                      <span className="detail-value">{s.lastUpdated}</span>
                    </div>
                  </div>
                  <button 
                    className="view-details-button red-button"
                    onClick={() => handleViewDetails(s)}
                  >
                    <HiOutlineEye size={18} /> View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending - Orange Theme */}
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
                <div key={s.id} className="series-card orange-card">
                  <div className="card-banner">
                    <div className="banner-content">
                      <h3 className="series-name">{s.name}</h3>
                      <div className="banner-status">
                        <span className={`status-pill ${statusInfo.color}`}>
                          {statusInfo.label.toUpperCase()}
                        </span>
                        <span className="frequency-pill">{s.interestFrequency}</span>
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
                      <span className="detail-label">Last Updated:</span>
                      <span className="detail-value">{s.lastUpdated}</span>
                    </div>
                  </div>
                  <button 
                    className="view-details-button orange-button"
                    onClick={() => handleViewDetails(s)}
                  >
                    <HiOutlineEye size={18} /> View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submitted - Green Theme */}
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
                <div key={s.id} className="series-card green-card">
                  <div className="card-banner">
                    <div className="banner-content">
                      <h3 className="series-name">{s.name}</h3>
                      <div className="banner-status">
                        <span className={`status-pill ${statusInfo.color}`}>
                          {statusInfo.label.toUpperCase()}
                        </span>
                        <span className="frequency-pill">{s.interestFrequency}</span>
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
                      <span className="detail-label">Last Updated:</span>
                      <span className="detail-value">{s.lastUpdated}</span>
                    </div>
                  </div>
                  <button 
                    className="view-details-button green-button"
                    onClick={() => handleViewDetails(s)}
                  >
                    <HiOutlineEye size={18} /> View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compliance Tracker Modal - Dynamic for each series */}
        {showComplianceTracker && selectedSeries && (
          <ComplianceTracker 
            onClose={() => setShowComplianceTracker(false)} 
            seriesData={{
              seriesName: selectedSeries.name,
              trusteeCompany: 'SBICAP Trustee Co. Ltd.',
              stats: {
                totalRequirements: 42,
                receivedCompleted: selectedSeries.status === 'submitted' ? 38 : selectedSeries.status === 'pending' ? 25 : 12,
                pendingActions: selectedSeries.status === 'submitted' ? 4 : selectedSeries.status === 'pending' ? 15 : 25,
                notApplicable: selectedSeries.status === 'submitted' ? 0 : selectedSeries.status === 'pending' ? 2 : 5
              }
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Compliance;